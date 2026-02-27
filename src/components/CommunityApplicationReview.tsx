/**
 * 社群申请审核管理组件
 * 津脉社区平台
 */

import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCommunityJoinRequests } from '@/hooks/useCommunityInvitation';
import type { CommunityJoinRequest } from '@/types/community-invitation';
import {
  Check,
  X,
  MoreVertical,
  User,
  Clock,
  FileText,
  Loader2,
  Filter,
} from 'lucide-react';

interface CommunityApplicationReviewProps {
  communityId: string;
}

export function CommunityApplicationReview({ communityId }: CommunityApplicationReviewProps) {
  const [selectedRequest, setSelectedRequest] = useState<CommunityJoinRequest | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  const { requests, loading, total, reviewApplication, refresh } = useCommunityJoinRequests(communityId);

  // 处理审核
  const handleReview = useCallback(
    async (action: 'approve' | 'reject') => {
      if (!selectedRequest) return;

      const success = await reviewApplication({
        requestId: selectedRequest.id,
        action,
        note: reviewNote,
      });

      if (success) {
        setSelectedRequest(null);
        setReviewNote('');
      }
    },
    [selectedRequest, reviewNote, reviewApplication]
  );

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            待审核
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Check className="w-3 h-3 mr-1" />
            已通过
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <X className="w-3 h-3 mr-1" />
            已拒绝
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            已取消
          </Badge>
        );
      default:
        return null;
    }
  };

  // 渲染申请列表
  const renderRequestList = (filteredRequests: CommunityJoinRequest[]) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (filteredRequests.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <FileText className="w-12 h-12 mb-4 opacity-50" />
          <p>暂无申请记录</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={request.user?.avatarUrl} />
                  <AvatarFallback>
                    <User className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{request.user?.username || '未知用户'}</h4>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  {request.reason && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {request.reason}
                    </p>
                  )}

                  {request.answers && Object.keys(request.answers).length > 0 && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <p className="text-xs text-muted-foreground mb-1">申请答案：</p>
                      {Object.entries(request.answers).map(([key, value]) => (
                        <p key={key} className="truncate">
                          <span className="text-muted-foreground">{key}:</span> {value}
                        </p>
                      ))}
                    </div>
                  )}

                  {request.status === 'pending' ? (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:bg-green-50"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        通过
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        拒绝
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-muted-foreground">
                      {request.reviewedBy && (
                        <p>
                          审核人: {request.reviewer?.username || request.reviewedBy}
                        </p>
                      )}
                      {request.reviewedAt && (
                        <p>
                          审核时间: {new Date(request.reviewedAt).toLocaleString('zh-CN')}
                        </p>
                      )}
                      {request.reviewNote && (
                        <p className="mt-1">备注: {request.reviewNote}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const approvedRequests = requests.filter((r) => r.status === 'approved');
  const rejectedRequests = requests.filter((r) => r.status === 'rejected');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">入群申请管理</h2>
          <p className="text-sm text-muted-foreground">
            共 {total} 条申请记录
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <Filter className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            待审核
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            已通过
            {approvedRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {approvedRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected">
            已拒绝
            {rejectedRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {rejectedRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <ScrollArea className="h-[500px]">
            {renderRequestList(pendingRequests)}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <ScrollArea className="h-[500px]">
            {renderRequestList(approvedRequests)}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          <ScrollArea className="h-[500px]">
            {renderRequestList(rejectedRequests)}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* 审核对话框 */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>审核入群申请</DialogTitle>
            <DialogDescription>
              请确认是否批准 {selectedRequest?.user?.username} 的加入申请
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={selectedRequest.user?.avatarUrl} />
                  <AvatarFallback>
                    <User className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedRequest.user?.username}</p>
                  <p className="text-sm text-muted-foreground">
                    申请时间: {new Date(selectedRequest.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>

              {selectedRequest.reason && (
                <div>
                  <p className="text-sm font-medium mb-1">申请理由</p>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded">
                    {selectedRequest.reason}
                  </p>
                </div>
              )}

              {selectedRequest.answers && Object.keys(selectedRequest.answers).length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">申请答案</p>
                  <div className="space-y-2">
                    {Object.entries(selectedRequest.answers).map(([key, value]) => (
                      <div key={key} className="p-2 bg-muted rounded text-sm">
                        <span className="text-muted-foreground">{key}:</span>
                        <p className="mt-1">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-1">审核备注（可选）</p>
                <Textarea
                  placeholder="添加审核备注..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  maxLength={200}
                  rows={2}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReview('reject')}
            >
              <X className="w-4 h-4 mr-2" />
              拒绝
            </Button>
            <Button onClick={() => handleReview('approve')}>
              <Check className="w-4 h-4 mr-2" />
              通过
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CommunityApplicationReview;
