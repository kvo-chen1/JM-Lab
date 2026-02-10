import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Community } from '@/pages/Community';
import { chatService } from '@/services/chatService';
import { supabase } from '@/lib/supabaseClient';

interface ShareCardData {
  type: 'work' | 'activity' | 'post';
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  url: string;
  author?: {
    name: string;
    avatar?: string;
  };
}

interface ShareToCommunityProps {
  isOpen: boolean;
  onClose: () => void;
  shareCard: ShareCardData;
  userId: string;
  userName: string;
  userAvatar?: string;
}

const ShareToCommunity: React.FC<ShareToCommunityProps> = ({
  isOpen,
  onClose,
  shareCard,
  userId,
  userName,
  userAvatar
}) => {
  const navigate = useNavigate();
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>('chat');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);

  const loadJoinedCommunities = useCallback(async () => {
    if (!isOpen || joinedCommunities.length > 0) return;
    
    setLoadingCommunities(true);
    try {
      const { communityService } = await import('@/services/communityService');
      const communities = await communityService.getUserCommunities(userId);
      setJoinedCommunities(communities || []);
    } catch (err) {
      console.error('Failed to load joined communities:', err);
      setError('加载社群失败');
    } finally {
      setLoadingCommunities(false);
    }
  }, [isOpen, userId, joinedCommunities]);

  React.useEffect(() => {
    if (isOpen) {
      loadJoinedCommunities();
    }
  }, [isOpen, loadJoinedCommunities]);

  const handleSendShare = async () => {
    if (!selectedCommunity) {
      setError('请选择要分享到的社群');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const channelId = `community:${selectedCommunity.id}:${selectedChannel}`;
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('请先登录');
      }

      // 使用后端 API 发送消息
      const response = await fetch('/api/community/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          communityId: selectedCommunity.id,
          channelId: channelId,
          content: `${userName} 分享了一个${shareCard.type === 'work' ? '作品' : shareCard.type === 'activity' ? '活动' : '帖子'}`,
          type: 'share_card',
          metadata: {
            shareCard: shareCard
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '发送失败');
      }

      const result = await response.json();
      console.log('Message sent successfully:', result);
      onClose();
    } catch (err: any) {
      console.error('Failed to send share:', err);
      setError(err.message || '分享失败，请重试');
    } finally {
      setSending(false);
    }
  };

  const handleCommunitySelect = (community: Community) => {
    setSelectedCommunity(community);
    setSelectedChannel('chat');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            分享到社群
          </h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <i className="fas fa-times text-gray-500"></i>
          </button>
        </div>

        {/* Preview Card */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4">
            {shareCard.thumbnail && (
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={shareCard.thumbnail} 
                  alt={shareCard.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {shareCard.type === 'work' ? '作品' : shareCard.type === 'activity' ? '活动' : '帖子'}
                </span>
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                {shareCard.title}
              </h4>
              {shareCard.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                  {shareCard.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Community Selection */}
        <div className="px-6 py-4 max-h-80 overflow-y-auto">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            选择社群
          </h4>
          
          {loadingCommunities ? (
            <div className="flex items-center justify-center py-8">
              <i className="fas fa-spinner fa-spin text-blue-500 text-xl"></i>
            </div>
          ) : joinedCommunities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                还没有加入任何社群
              </p>
              <button 
                onClick={() => navigate('/community')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                去发现社群
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {joinedCommunities.map((community) => (
                <div
                  key={community.id}
                  onClick={() => handleCommunitySelect(community)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    selectedCommunity?.id === community.id
                      ? 'bg-blue-50 border-2 border-blue-500 dark:bg-blue-900/20'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    {community.avatar ? (
                      <img 
                        src={community.avatar} 
                        alt={community.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {community.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 dark:text-white truncate">
                      {community.name}
                    </h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {community.memberCount || 0} 成员
                    </p>
                  </div>
                  {selectedCommunity?.id === community.id && (
                    <i className="fas fa-check-circle text-blue-500 text-xl"></i>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Channel Selection */}
        {selectedCommunity && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              选择频道
            </h4>
            <div className="flex gap-2">
              {['chat', 'feed', 'members'].map((channel) => (
                <button
                  key={channel}
                  onClick={() => setSelectedChannel(channel)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    selectedChannel === channel
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {channel === 'chat' && <><i className="fas fa-comment-dots mr-2"></i>聊天</>}
                  {channel === 'feed' && <><i className="fas fa-stream mr-2"></i>动态</>}
                  {channel === 'members' && <><i className="fas fa-users mr-2"></i>成员</>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="px-6 py-2">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm dark:bg-red-900/20 dark:text-red-400">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={sending}
          >
            取消
          </button>
          <button
            onClick={handleSendShare}
            disabled={!selectedCommunity || sending}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              !selectedCommunity || sending
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30'
            }`}
          >
            {sending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                发送中...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane mr-2"></i>
                发送分享
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareToCommunity;
