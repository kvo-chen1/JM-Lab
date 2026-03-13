import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { collaborationHistoryService } from '@/services/collaborationHistoryService';
import type { CollaborationVersion, PaginatedResponse } from '@/types/work-collaboration';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';

interface VersionHistoryProps {
  workId: string;
  userId: string;
  canEdit: boolean;
  onRestore?: (version: CollaborationVersion) => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({
  workId,
  userId,
  canEdit,
  onRestore,
}) => {
  const [versions, setVersions] = useState<CollaborationVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<CollaborationVersion | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const loadVersions = useCallback(async (pageNum: number = 1) => {
    setIsLoading(true);
    try {
      const result: PaginatedResponse<CollaborationVersion> = await collaborationHistoryService.getVersions(
        workId,
        {
          page: pageNum,
          pageSize: 10,
          includeAutoSaves: false,
        }
      );

      if (pageNum === 1) {
        setVersions(result.items);
      } else {
        setVersions((prev) => [...prev, ...result.items]);
      }
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to load versions:', error);
      toast.error('加载版本历史失败');
    } finally {
      setIsLoading(false);
    }
  }, [workId]);

  useEffect(() => {
    loadVersions(1);
  }, [loadVersions]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadVersions(nextPage);
  };

  const handleRestore = async () => {
    if (!selectedVersion) return;

    setIsRestoring(true);
    try {
      const newVersion = await collaborationHistoryService.restoreVersion(
        workId,
        selectedVersion.id,
        userId
      );

      toast.success(`已恢复到版本 v${selectedVersion.versionNumber}`);
      setShowRestoreDialog(false);
      setSelectedVersion(null);

      loadVersions(1);

      if (onRestore) {
        onRestore(newVersion);
      }
    } catch (error: any) {
      toast.error(error.message || '恢复失败');
    } finally {
      setIsRestoring(false);
    }
  };

  const handlePreview = (version: CollaborationVersion) => {
    setSelectedVersion(version);
    setShowPreviewDialog(true);
  };

  const handleConfirmRestore = (version: CollaborationVersion) => {
    setSelectedVersion(version);
    setShowRestoreDialog(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderContentPreview = (content: any) => {
    if (typeof content === 'string') {
      return content.length > 200 ? content.substring(0, 200) + '...' : content;
    }
    if (typeof content === 'object') {
      return JSON.stringify(content, null, 2).substring(0, 200) + '...';
    }
    return '无内容预览';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">版本历史</h3>
          <p className="text-sm text-muted-foreground">
            查看和恢复历史版本
          </p>
        </div>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-3 pr-4">
          <AnimatePresence>
            {versions.map((version, index) => (
              <motion.div
                key={version.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">v{version.versionNumber}</Badge>
                        {version.isAutoSave && (
                          <Badge variant="secondary">自动保存</Badge>
                        )}
                        <span className="text-sm font-medium">{version.title}</span>
                      </div>

                      {version.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {version.description}
                        </p>
                      )}

                      {version.changeLog && (
                        <p className="text-sm text-muted-foreground mb-2 italic">
                          {version.changeLog}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>创建于 {formatDate(version.createdAt)}</span>
                        <span>创建者: {version.createdBy === userId ? '我' : '协作者'}</span>
                        {version.collaboratorCount > 1 && (
                          <span>{version.collaboratorCount} 人协作</span>
                        )}
                      </div>

                      {version.tags && version.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {version.tags.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(version)}
                      >
                        预览
                      </Button>
                      {canEdit && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleConfirmRestore(version)}
                        >
                          恢复
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}

          {!isLoading && versions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              暂无版本历史
            </div>
          )}

          {!isLoading && hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={handleLoadMore}>
                加载更多
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              版本预览 - v{selectedVersion?.versionNumber}
            </DialogTitle>
            <DialogDescription>
              {selectedVersion?.title} · {selectedVersion && formatDate(selectedVersion.createdAt)}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-muted rounded-lg p-4 max-h-[400px] overflow-auto">
              <pre className="text-sm whitespace-pre-wrap">
                {selectedVersion?.content && renderContentPreview(selectedVersion.content)}
              </pre>
            </div>

            {selectedVersion?.description && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-1">版本描述</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedVersion.description}
                </p>
              </div>
            )}

            {selectedVersion?.changeLog && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-1">变更说明</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedVersion.changeLog}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              关闭
            </Button>
            {canEdit && (
              <Button
                onClick={() => {
                  setShowPreviewDialog(false);
                  if (selectedVersion) {
                    handleConfirmRestore(selectedVersion);
                  }
                }}
              >
                恢复此版本
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认恢复版本</DialogTitle>
            <DialogDescription>
              您确定要恢复到版本 v{selectedVersion?.versionNumber} 吗？
              这将创建一个新版本，当前内容将被保存。
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">v{selectedVersion?.versionNumber}</Badge>
                <span className="font-medium">{selectedVersion?.title}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedVersion?.changeLog || selectedVersion?.description || '无描述'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                创建于 {selectedVersion && formatDate(selectedVersion.createdAt)}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              取消
            </Button>
            <Button onClick={handleRestore} disabled={isRestoring}>
              {isRestoring ? '恢复中...' : '确认恢复'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VersionHistory;
