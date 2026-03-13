import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { realtimeCollaborationService } from '@/services/realtimeCollaborationService';
import { collaborationHistoryService } from '@/services/collaborationHistoryService';
import { workCollaborationInviteService } from '@/services/workCollaborationInviteService';
import type {
  CollaborationRole,
  CollaboratorCursor,
  CollaborationParticipant,
  CollaborationVersion,
  OperationLock,
} from '@/types/work-collaboration';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';

interface EnhancedCollaborativeEditorProps {
  workId: string;
  userId: string;
  username: string;
  userRole: CollaborationRole;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onSave?: (content: string) => Promise<void>;
  className?: string;
}

const EnhancedCollaborativeEditor: React.FC<EnhancedCollaborativeEditorProps> = ({
  workId,
  userId,
  username,
  userRole,
  initialContent = '',
  onContentChange,
  onSave,
  className = '',
}) => {
  const [content, setContent] = useState(initialContent);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<CollaborationParticipant[]>([]);
  const [cursors, setCursors] = useState<CollaboratorCursor[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockOwner, setLockOwner] = useState<string | null>(null);
  const [versions, setVersions] = useState<CollaborationVersion[]>([]);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [showSaveVersionDialog, setShowSaveVersionDialog] = useState(false);
  const [versionDescription, setVersionDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const contentRef = useRef(content);

  const canEdit = userRole === 'owner' || userRole === 'editor';

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    realtimeCollaborationService.initialize({
      id: userId,
      username,
    });

    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(
      realtimeCollaborationService.on('session_joined', () => {
        setIsConnected(true);
        toast.success('已加入协作会话');
      })
    );

    unsubscribers.push(
      realtimeCollaborationService.on('session_left', () => {
        setIsConnected(false);
      })
    );

    unsubscribers.push(
      realtimeCollaborationService.on('user_joined', ({ participant }: { participant: CollaborationParticipant }) => {
        setParticipants((prev) => [...prev.filter((p) => p.userId !== participant.userId), participant]);
        toast.info(`${participant.username} 加入了协作`);
      })
    );

    unsubscribers.push(
      realtimeCollaborationService.on('user_left', ({ userId: leftUserId }: { userId: string }) => {
        setParticipants((prev) => prev.filter((p) => p.userId !== leftUserId));
        setCursors((prev) => prev.filter((c) => c.userId !== leftUserId));
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(leftUserId);
          return next;
        });
      })
    );

    unsubscribers.push(
      realtimeCollaborationService.on('cursor_updated', ({ cursor }: { cursor: CollaboratorCursor }) => {
        setCursors((prev) => [...prev.filter((c) => c.userId !== cursor.userId), cursor]);
      })
    );

    unsubscribers.push(
      realtimeCollaborationService.on('selection_updated', ({ cursor }: { cursor: CollaboratorCursor }) => {
        setCursors((prev) => [...prev.filter((c) => c.userId !== cursor.userId), cursor]);
      })
    );

    unsubscribers.push(
      realtimeCollaborationService.on('text_edit', ({ operation }: { operation: any }) => {
        if (operation.userId === userId) return;

        setContent((prev) => {
          let newContent = prev;
          if (operation.operationType === 'insert') {
            newContent = prev.slice(0, operation.position) + operation.content + prev.slice(operation.position);
          } else if (operation.operationType === 'delete') {
            newContent = prev.slice(0, operation.position) + prev.slice(operation.position + operation.length);
          }
          onContentChange?.(newContent);
          setHasUnsavedChanges(true);
          return newContent;
        });
      })
    );

    unsubscribers.push(
      realtimeCollaborationService.on('typing_updated', ({ userId: typingUserId, isTyping: typing }: { userId: string; isTyping: boolean }) => {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          if (typing) {
            next.add(typingUserId);
          } else {
            next.delete(typingUserId);
          }
          return next;
        });
      })
    );

    unsubscribers.push(
      realtimeCollaborationService.on('lock_acquired', ({ lock }: { lock: OperationLock }) => {
        if (lock.resourceType === 'content') {
          setIsLocked(true);
          setLockOwner(lock.userId);
        }
      })
    );

    unsubscribers.push(
      realtimeCollaborationService.on('lock_released', ({ lockId }: { lockId: string }) => {
        setIsLocked(false);
        setLockOwner(null);
      })
    );

    realtimeCollaborationService.joinSession(workId, userRole).then(() => {
      setParticipants(realtimeCollaborationService.getParticipants(workId));
      setCursors(realtimeCollaborationService.getCursors(workId));
    });

    loadVersions();

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      realtimeCollaborationService.leaveSession(workId);
    };
  }, [workId, userId, username, userRole]);

  useEffect(() => {
    if (!canEdit || !hasUnsavedChanges) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      handleAutoSave();
    }, 30000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content, hasUnsavedChanges, canEdit]);

  const loadVersions = async () => {
    try {
      const result = await collaborationHistoryService.getVersions(workId, { pageSize: 10 });
      setVersions(result.items);
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  const handleAutoSave = async () => {
    if (!onSave) return;

    try {
      await onSave(contentRef.current);
      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);

      await collaborationHistoryService.createVersion(workId, userId, {
        title: '自动保存',
        content: contentRef.current,
        isAutoSave: true,
      });
    } catch (error) {
      console.error('Auto save failed:', error);
    }
  };

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!canEdit) return;

      const newContent = e.target.value;
      const cursorPosition = e.target.selectionStart;

      setContent(newContent);
      onContentChange?.(newContent);
      setHasUnsavedChanges(true);

      realtimeCollaborationService.sendCursorMove(workId, cursorPosition);

      if (!isTyping) {
        setIsTyping(true);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    },
    [canEdit, workId, isTyping, onContentChange]
  );

  const handleSelectionChange = useCallback(() => {
    if (!editorRef.current) return;

    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;

    realtimeCollaborationService.sendSelectionChange(workId, start, end);
  }, [workId]);

  const handleSaveVersion = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(content);

      await collaborationHistoryService.createVersion(workId, userId, {
        title: `版本 ${versions.length + 1}`,
        description: versionDescription,
        content,
        isAutoSave: false,
      });

      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
      setShowSaveVersionDialog(false);
      setVersionDescription('');
      toast.success('版本已保存');
      loadVersions();
    } catch (error) {
      toast.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreVersion = async (version: CollaborationVersion) => {
    if (!canEdit) {
      toast.error('您没有编辑权限');
      return;
    }

    try {
      const newVersion = await collaborationHistoryService.restoreVersion(workId, version.id, userId);
      setContent(version.content || '');
      onContentChange?.(version.content || '');
      toast.success(`已恢复到版本 ${version.versionNumber}`);
      loadVersions();
    } catch (error) {
      toast.error('恢复失败');
    }
  };

  const handleAcquireLock = async () => {
    if (!canEdit) return;

    const lock = await realtimeCollaborationService.acquireLock(workId, 'content');
    if (lock) {
      toast.success('已获取编辑锁');
    } else {
      toast.error('无法获取编辑锁，可能正在被其他用户使用');
    }
  };

  const handleReleaseLock = async () => {
    await realtimeCollaborationService.releaseLock(workId, 'content');
    toast.success('已释放编辑锁');
  };

  const getTypingIndicator = () => {
    if (typingUsers.size === 0) return null;

    const typingNames = Array.from(typingUsers)
      .map((id) => participants.find((p) => p.userId === id)?.username)
      .filter(Boolean);

    if (typingNames.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-sm text-muted-foreground"
      >
        {typingNames.join('、')} 正在输入...
      </motion.div>
    );
  };

  const renderRemoteCursors = () => {
    if (!editorRef.current) return null;

    return cursors
      .filter((c) => c.userId !== userId)
      .map((cursor) => {
        const lineHeight = 20;
        const charWidth = 8;
        const lines = content.substring(0, cursor.position).split('\n');
        const line = lines.length - 1;
        const col = lines[lines.length - 1].length;

        return (
          <motion.div
            key={cursor.userId}
            className="absolute pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              left: `${col * charWidth}px`,
              top: `${line * lineHeight}px`,
            }}
          >
            <div
              className="w-0.5 h-5 animate-pulse"
              style={{ backgroundColor: cursor.color }}
            />
            <div
              className="absolute top-5 left-0 px-1 py-0.5 rounded text-xs text-white whitespace-nowrap"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.username}
            </div>
          </motion.div>
        );
      });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              } animate-pulse`}
            />
            <span className="text-sm">
              {isConnected ? '协作已连接' : '协作已断开'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {participants.slice(0, 5).map((p) => (
              <Avatar
                key={p.userId}
                src={undefined}
                alt={p.username}
                fallback={p.username[0]}
                className="w-6 h-6 border-2"
                style={{ borderColor: p.color }}
              />
            ))}
            {participants.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{participants.length - 5}
              </Badge>
            )}
          </div>

          {getTypingIndicator()}
        </div>

        <div className="flex items-center gap-2">
          {lastSavedAt && (
            <span className="text-xs text-muted-foreground">
              上次保存: {lastSavedAt.toLocaleTimeString()}
            </span>
          )}
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-xs">
              未保存
            </Badge>
          )}

          {canEdit && (
            <>
              {isLocked ? (
                lockOwner === userId ? (
                  <Button variant="outline" size="sm" onClick={handleReleaseLock}>
                    释放锁
                  </Button>
                ) : (
                  <Badge variant="secondary">编辑中</Badge>
                )
              ) : (
                <Button variant="outline" size="sm" onClick={handleAcquireLock}>
                  获取编辑锁
                </Button>
              )}
            </>
          )}

          {canEdit && (
            <Button size="sm" onClick={() => setShowSaveVersionDialog(true)}>
              保存版本
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => setShowVersionDialog(true)}>
            版本历史
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {renderRemoteCursors()}
        </div>

        <Textarea
          ref={editorRef}
          value={content}
          onChange={handleContentChange}
          onSelect={handleSelectionChange}
          className="min-h-[400px] font-mono"
          disabled={!canEdit || (isLocked && lockOwner !== userId)}
          placeholder={canEdit ? '开始协作编辑...' : '您只有查看权限'}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>
          字符数: {content.length} | 行数: {content.split('\n').length}
        </div>
        <div>
          {participants.length} 人在线协作
        </div>
      </div>

      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>版本历史</DialogTitle>
            <DialogDescription>查看和恢复历史版本</DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{version.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {version.description || '无描述'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(version.createdAt).toLocaleString()}
                      {version.isAutoSave && ' (自动保存)'}
                    </div>
                  </div>
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreVersion(version)}
                    >
                      恢复
                    </Button>
                  )}
                </div>
              ))}

              {versions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  暂无版本记录
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showSaveVersionDialog} onOpenChange={setShowSaveVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>保存版本</DialogTitle>
            <DialogDescription>为当前版本添加描述</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder="版本描述（可选）"
              value={versionDescription}
              onChange={(e) => setVersionDescription(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveVersionDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSaveVersion} disabled={isSaving}>
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedCollaborativeEditor;
