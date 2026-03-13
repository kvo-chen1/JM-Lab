import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { workCollaborationInviteService } from '@/services/workCollaborationInviteService';
import { collaborationHistoryService } from '@/services/collaborationHistoryService';
import type {
  WorkCollaborator,
  CollaborationInvite,
  CollaborationRole,
  CollaborationHistory,
  CollaborationStats,
} from '@/types/work-collaboration';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

interface CollaboratorManagerProps {
  workId: string;
  userId: string;
  isOwner: boolean;
  onCollaboratorChange?: () => void;
}

const CollaboratorManager: React.FC<CollaboratorManagerProps> = ({
  workId,
  userId,
  isOwner,
  onCollaboratorChange,
}) => {
  const [collaborators, setCollaborators] = useState<WorkCollaborator[]>([]);
  const [invites, setInvites] = useState<CollaborationInvite[]>([]);
  const [history, setHistory] = useState<CollaborationHistory[]>([]);
  const [stats, setStats] = useState<CollaborationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<WorkCollaborator | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CollaborationRole>('editor');
  const [inviteMessage, setInviteMessage] = useState('');
  const [activeTab, setActiveTab] = useState('collaborators');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [collabsData, invitesData, historyData, statsData] = await Promise.all([
        workCollaborationInviteService.getWorkCollaborators(workId),
        workCollaborationInviteService.getWorkInvites(workId),
        collaborationHistoryService.getWorkHistory(workId, { pageSize: 50 }),
        collaborationHistoryService.getStats(workId),
      ]);

      setCollaborators(collabsData);
      setInvites(invitesData.filter(i => i.status === 'pending'));
      setHistory(historyData.items);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load collaboration data:', error);
      toast.error('加载协作数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [workId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('请输入邮箱地址');
      return;
    }

    try {
      await workCollaborationInviteService.createInvite(
        {
          workId,
          inviteeEmail: inviteEmail.trim(),
          role: inviteRole,
          message: inviteMessage.trim() || undefined,
        },
        userId
      );

      toast.success('邀请已发送');
      setShowInviteDialog(false);
      setInviteEmail('');
      setInviteRole('editor');
      setInviteMessage('');
      loadData();
      onCollaboratorChange?.();
    } catch (error: any) {
      toast.error(error.message || '发送邀请失败');
    }
  };

  const handleRemoveCollaborator = async () => {
    if (!selectedCollaborator) return;

    try {
      await workCollaborationInviteService.removeCollaborator(
        workId,
        selectedCollaborator.userId,
        userId
      );

      toast.success('已移除协作者');
      setShowRemoveDialog(false);
      setSelectedCollaborator(null);
      loadData();
      onCollaboratorChange?.();
    } catch (error: any) {
      toast.error(error.message || '移除失败');
    }
  };

  const handleUpdateRole = async (collaborator: WorkCollaborator, newRole: CollaborationRole) => {
    try {
      await workCollaborationInviteService.updateCollaboratorRole(
        workId,
        collaborator.userId,
        newRole,
        userId
      );

      toast.success('权限已更新');
      loadData();
      onCollaboratorChange?.();
    } catch (error: any) {
      toast.error(error.message || '更新失败');
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await workCollaborationInviteService.cancelInvite(inviteId, userId);
      toast.success('邀请已取消');
      loadData();
    } catch (error: any) {
      toast.error(error.message || '取消失败');
    }
  };

  const getRoleBadgeVariant = (role: CollaborationRole) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'editor':
        return 'secondary';
      case 'viewer':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: CollaborationRole) => {
    switch (role) {
      case 'owner':
        return '所有者';
      case 'editor':
        return '编辑者';
      case 'viewer':
        return '查看者';
      default:
        return role;
    }
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      join: '加入协作',
      leave: '离开协作',
      edit: '编辑内容',
      lock: '锁定资源',
      unlock: '解锁资源',
      invite: '发送邀请',
      remove: '移除协作者',
      version_create: '创建版本',
      version_restore: '恢复版本',
    };
    return labels[actionType] || actionType;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">协作管理</h2>
          <p className="text-muted-foreground">管理作品的协作者和权限</p>
        </div>
        {isOwner && (
          <Button onClick={() => setShowInviteDialog(true)}>
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            邀请协作者
          </Button>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold">{stats.totalCollaborators}</div>
            <div className="text-sm text-muted-foreground">协作者</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold">{invites.length}</div>
            <div className="text-sm text-muted-foreground">待处理邀请</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold">{stats.totalVersions}</div>
            <div className="text-sm text-muted-foreground">版本数</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <div className="text-sm text-muted-foreground">协作会话</div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="collaborators">
            协作者 ({collaborators.length})
          </TabsTrigger>
          <TabsTrigger value="invites">
            待处理邀请 ({invites.length})
          </TabsTrigger>
          <TabsTrigger value="history">活动日志</TabsTrigger>
        </TabsList>

        <TabsContent value="collaborators" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              <AnimatePresence>
                {collaborators.map((collaborator) => (
                  <motion.div
                    key={collaborator.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={collaborator.user?.avatarUrl}
                        alt={collaborator.user?.username || '用户'}
                        fallback={collaborator.user?.username?.[0] || '?'}
                      />
                      <div>
                        <div className="font-medium">
                          {collaborator.user?.username || '未知用户'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {collaborator.user?.email || ''}
                        </div>
                      </div>
                      <Badge variant={getRoleBadgeVariant(collaborator.role)}>
                        {getRoleLabel(collaborator.role)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      {collaborator.role !== 'owner' && isOwner && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>更改权限</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleUpdateRole(collaborator, 'editor')}
                              disabled={collaborator.role === 'editor'}
                            >
                              编辑者
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateRole(collaborator, 'viewer')}
                              disabled={collaborator.role === 'viewer'}
                            >
                              查看者
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedCollaborator(collaborator);
                                setShowRemoveDialog(true);
                              }}
                            >
                              移除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <div className="text-xs text-muted-foreground">
                        加入于 {new Date(collaborator.addedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {collaborators.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  暂无协作者
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="invites" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              <AnimatePresence>
                {invites.map((invite) => (
                  <motion.div
                    key={invite.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">
                          {invite.inviteeEmail || invite.invitee?.username || '未知'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          邀请为 {getRoleLabel(invite.role)} ·
                          过期于 {new Date(invite.expiresAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline">待处理</Badge>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleCancelInvite(invite.id)}
                        >
                          取消
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {invites.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  暂无待处理的邀请
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="font-medium">{item.user?.username || '用户'}</span>
                      <span className="text-muted-foreground ml-2">
                        {getActionLabel(item.actionType)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}

              {history.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  暂无活动记录
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>邀请协作者</DialogTitle>
            <DialogDescription>
              通过邮箱邀请他人协作编辑此作品
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">邮箱地址</label>
              <Input
                type="email"
                placeholder="请输入邮箱地址"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">权限角色</label>
              <div className="flex gap-2">
                {(['editor', 'viewer'] as CollaborationRole[]).map((role) => (
                  <Button
                    key={role}
                    variant={inviteRole === role ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInviteRole(role)}
                  >
                    {getRoleLabel(role)}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {inviteRole === 'editor' ? '可以编辑内容和创建版本' : '仅可查看内容'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">邀请消息（可选）</label>
              <Input
                placeholder="添加一条消息"
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSendInvite}>发送邀请</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>移除协作者</DialogTitle>
            <DialogDescription>
              确定要移除协作者 {selectedCollaborator?.user?.username} 吗？移除后该用户将无法继续协作编辑此作品。
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleRemoveCollaborator}>
              确认移除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollaboratorManager;
