/**
 * 社群邀请对话框组件
 * 津脉社区平台
 */

import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useCommunityInvitations, useUserSearch } from '@/hooks/useCommunityInvitation';
import type { SearchableUser } from '@/types/community-invitation';
import {
  Search,
  X,
  Loader2,
  Check,
  AlertCircle,
  Link,
  Copy,
  UserPlus,
} from 'lucide-react';

interface CommunityInviteDialogProps {
  communityId: string;
  communityName: string;
  trigger?: React.ReactNode;
}

export function CommunityInviteDialog({
  communityId,
  communityName,
  trigger,
}: CommunityInviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<SearchableUser[]>([]);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const { users, loading: searching, error: searchError, searchUsers } = useUserSearch();
  const { createBatchInvitations, rateLimit, loading: sending } = useCommunityInvitations(communityId);

  // 生成邀请链接
  const generateInviteLink = useCallback(() => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/community/${communityId}/join?ref=invite`;
    setInviteLink(link);
    return link;
  }, [communityId]);

  // 复制邀请链接
  const handleCopyLink = useCallback(async () => {
    const link = inviteLink || generateInviteLink();
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      toast.success('邀请链接已复制到剪贴板');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast.error('复制失败，请手动复制');
    }
  }, [inviteLink, generateInviteLink]);

  // 搜索用户
  const handleSearch = useCallback(
    (query: string) => {
      searchUsers(query, communityId);
    },
    [searchUsers, communityId]
  );

  // 选择用户
  const handleSelectUser = useCallback((user: SearchableUser) => {
    setSelectedUsers((prev) => {
      if (prev.find((u) => u.id === user.id)) {
        return prev.filter((u) => u.id !== user.id);
      }
      if (prev.length >= 20) {
        toast.error('单次最多选择20位用户');
        return prev;
      }
      return [...prev, user];
    });
  }, []);

  // 移除已选用户
  const handleRemoveUser = useCallback((userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  // 发送邀请
  const handleSendInvitations = useCallback(async () => {
    if (selectedUsers.length === 0) {
      toast.error('请至少选择一位邀请对象');
      return;
    }

    if (rateLimit?.canInvite === false) {
      toast.error('您的邀请次数已达上限，请稍后再试');
      return;
    }

    const invitees = selectedUsers.map((user) => ({
      userId: user.id,
    }));

    const result = await createBatchInvitations({
      communityId,
      invitees,
      message: inviteMessage,
    });

    if (result) {
      setSelectedUsers([]);
      setInviteMessage('');
      if (result.failed.length === 0) {
        setOpen(false);
      }
    }
  }, [selectedUsers, rateLimit, createBatchInvitations, communityId, inviteMessage]);

  // 渲染对话框内容
  const renderContent = () => (
    <div className="space-y-4">
      {/* 复制链接邀请 */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center gap-2 mb-2">
          <Link className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">链接邀请</span>
        </div>
        <p className="text-xs text-blue-700 mb-3">
          复制链接发送给好友，他们可以通过链接直接加入社群
        </p>
        <div className="flex gap-2">
          <Input
            value={inviteLink || generateInviteLink()}
            readOnly
            className="flex-1 text-sm bg-white"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyLink}
            className="whitespace-nowrap"
          >
            {linkCopied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                已复制
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                复制链接
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-2 bg-white text-xs text-gray-500">或直接邀请好友</span>
        </div>
      </div>

      {/* 搜索用户 */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜索用户名或ID..."
            className="pl-10"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="border rounded-lg max-h-[200px] overflow-y-auto">
          {searching ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : users.length > 0 ? (
            <div className="divide-y">
              {users.map((user) => {
                const isSelected = selectedUsers.find((u) => u.id === user.id);
                const isMember = user.isMember;
                return (
                  <button
                    key={user.id}
                    onClick={() => !isMember && handleSelectUser(user)}
                    disabled={isMember}
                    className={`w-full flex items-center gap-3 p-3 transition-colors text-left ${
                      isMember 
                        ? 'bg-gray-50 cursor-not-allowed opacity-60' 
                        : 'hover:bg-gray-50'
                    } ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <Avatar
                      src={user.avatarUrl}
                      alt={user.username}
                      size="medium"
                      shape="circle"
                    >
                      {user.username[0]}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.username}</p>
                      {user.bio && (
                        <p className="text-xs text-gray-500 truncate">{user.bio}</p>
                      )}
                    </div>
                    {isMember ? (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        已是成员
                      </span>
                    ) : isSelected ? (
                      <Check className="w-5 h-5 text-blue-500" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : searchError ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <Search className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">{searchError}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <UserPlus className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">输入用户名搜索好友</p>
            </div>
          )}
        </div>
      </div>

      {/* 已选用户 */}
      {selectedUsers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">已选择 {selectedUsers.length} 人</span>
            <Button variant="ghost" size="sm" onClick={() => setSelectedUsers([])}>
              清空
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 border rounded-lg">
            {selectedUsers.map((user) => (
              <Badge
                key={user.id}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                {user.avatarUrl && (
                  <Avatar
                    src={user.avatarUrl}
                    alt={user.username}
                    size="small"
                    shape="circle"
                  >
                    {user.username[0]}
                  </Avatar>
                )}
                <span className="max-w-[120px] truncate">{user.username}</span>
                <button
                  onClick={() => handleRemoveUser(user.id)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 邀请附言 */}
      <div className="space-y-2">
        <textarea
          placeholder="添加邀请附言（可选）..."
          value={inviteMessage}
          onChange={(e) => setInviteMessage(e.target.value)}
          maxLength={200}
          className="w-full p-3 border rounded-lg resize-none text-sm"
          rows={2}
        />
        <div className="flex justify-end">
          <span className="text-xs text-gray-500">{inviteMessage.length}/200</span>
        </div>
      </div>

      {/* 频率限制警告 */}
      {rateLimit?.canInvite === false && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>您的邀请次数已达上限，请稍后再试</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* 触发按钮 */}
      <div onClick={() => setOpen(true)}>{trigger}</div>

      {/* 对话框 */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`邀请加入「${communityName}」`}
        size="lg"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSendInvitations}
              disabled={selectedUsers.length === 0 || sending || rateLimit?.canInvite === false}
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  发送中...
                </>
              ) : (
                <>发送邀请 ({selectedUsers.length})</>
              )}
            </Button>
          </div>
        }
      >
        <div className="mb-4 text-sm text-gray-500">
          邀请平台上的好友加入您的社群。单次最多可邀请20位用户。
          <span className="block mt-1 text-xs">
            今日剩余邀请次数：{rateLimit?.dailyRemaining ?? 10} / 10
          </span>
        </div>
        {renderContent()}
      </Modal>
    </>
  );
}

export default CommunityInviteDialog;
