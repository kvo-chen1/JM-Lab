import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2, Check, MessageCircle, Users, Share2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { getFollowingList, getFollowersList } from '@/services/postService';

interface Friend {
  id: string;
  name: string;
  avatar: string;
}

interface Community {
  id: string;
  name: string;
  avatar?: string;
}

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  content: {
    title: string;
    description: string;
    imageUrl: string;
    type: 'image' | 'video';
  } | null;
  mode: 'community' | 'friend';
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  content,
  mode
}) => {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [shareNote, setShareNote] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');
  const [shareTarget, setShareTarget] = useState<'posts' | 'chat'>('posts');
  const [loading, setLoading] = useState(false);

  // 加载好友列表和社群列表
  useEffect(() => {
    if (isOpen) {
      if (mode === 'friend') {
        loadFriends();
      } else if (mode === 'community') {
        loadCommunities();
      }
    }
  }, [isOpen, mode]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('请先登录');
        return;
      }

      // 使用关注/粉丝机制获取好友列表（互相关注 = 好友）
      const [following, followers] = await Promise.all([
        getFollowingList(),
        getFollowersList()
      ]);

      console.log('[ShareDialog] 关注列表:', following);
      console.log('[ShareDialog] 粉丝列表:', followers);

      // 计算好友列表（互相关注的人）
      const followerIds = new Set(followers.map(u => u.id));
      const friendsList = following
        .filter(user => followerIds.has(user.id))
        .map(user => ({
          id: user.id,
          name: user.username || '未知用户',
          avatar: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
        }));

      console.log('[ShareDialog] 好友列表（互相关注）:', friendsList);
      setFriends(friendsList);
    } catch (error) {
      console.error('[ShareDialog] 加载好友列表异常:', error);
      toast.error('加载好友列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('请先登录');
        return;
      }

      const response = await fetch('/api/user/communities', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[ShareDialog] 加载社群列表:', data);
        if (data.code === 0 && data.data) {
          const communityList = data.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            avatar: c.avatar
          }));
          setCommunities(communityList);
          // 默认选择第一个社群
          if (communityList.length > 0 && !selectedCommunity) {
            setSelectedCommunity(communityList[0].id);
          }
        }
      } else {
        console.error('[ShareDialog] 加载社群列表失败');
      }
    } catch (error) {
      console.error('[ShareDialog] 加载社群列表异常:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !content) return null;

  // 复制链接
  const handleCopyLink = () => {
    navigator.clipboard.writeText(content.imageUrl);
    setCopied(true);
    toast.success('链接已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  // 分享到社群
  const handleShareToCommunity = async () => {
    if (!selectedCommunity) {
      toast.error('请选择一个社群');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('请先登录');
        return;
      }

      const selectedCommunityData = communities.find(c => c.id === selectedCommunity);

      if (shareTarget === 'posts') {
        // 分享到社群帖子区
        const response = await fetch('/api/share/community', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: content.title,
            description: content.description,
            imageUrl: content.imageUrl,
            type: content.type,
            communityId: selectedCommunity,
            communityName: selectedCommunityData?.name || '津脉社群'
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[ShareDialog] 分享到社群帖子区成功:', data);
          toast.success(`已分享到 ${selectedCommunityData?.name || '社群'} 的帖子区！`);
          onClose();
        } else {
          const errorData = await response.json().catch(() => ({ message: '未知错误' }));
          console.error('[ShareDialog] 分享到社群失败:', errorData);
          toast.error('分享失败: ' + (errorData.message || '请重试'));
        }
      } else {
        // 分享到社群聊天
        const response = await fetch('/api/community/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            communityId: selectedCommunity,
            channelId: 'general',
            content: JSON.stringify({
              type: 'ai_share',
              title: content.title,
              description: content.description,
              imageUrl: content.imageUrl,
              mediaType: content.type
            })
          })
        });

        if (response.ok) {
          console.log('[ShareDialog] 分享到社群聊天成功');
          toast.success(`已分享到 ${selectedCommunityData?.name || '社群'} 的聊天频道！`);
          onClose();
        } else {
          const errorData = await response.json().catch(() => ({ message: '未知错误' }));
          console.error('[ShareDialog] 分享到社群聊天失败:', errorData);
          toast.error('分享失败: ' + (errorData.message || '请重试'));
        }
      }
    } catch (error) {
      console.error('[ShareDialog] 分享到社群异常:', error);
      toast.error('分享失败，请重试');
    }
  };

  // 分享给好友
  const handleShareToFriends = async () => {
    if (selectedFriends.length === 0) {
      toast.error('请选择至少一位好友');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('请先登录');
        return;
      }

      const response = await fetch('/api/share/friend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: content.title,
          description: content.description,
          imageUrl: content.imageUrl,
          type: content.type,
          friendIds: selectedFriends,
          note: shareNote
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[ShareDialog] 分享给好友成功:', data);
        toast.success(`已分享给 ${selectedFriends.length} 位好友！`);
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({ message: '未知错误' }));
        console.error('[ShareDialog] 分享给好友失败:', errorData);
        toast.error('分享失败: ' + (errorData.message || '请重试'));
      }
    } catch (error) {
      console.error('[ShareDialog] 分享给好友异常:', error);
      toast.error('分享失败，请重试');
    }
  };

  // 切换好友选择
  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
            isDark ? 'bg-gray-900' : 'bg-white'
          }`}
          onClick={e => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className={`flex items-center justify-between p-5 border-b ${
            isDark ? 'border-gray-800' : 'border-gray-100'
          }`}>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {mode === 'community' ? '分享到社群' : '分享给好友'}
            </h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 内容预览 */}
          <div className="p-5">
            <div className={`rounded-xl overflow-hidden mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              {content.type === 'image' ? (
                <img
                  src={content.imageUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
              ) : (
                <video
                  src={content.imageUrl}
                  className="w-full h-48 object-cover"
                />
              )}
            </div>
            <h4 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {content.title}
            </h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {content.description}
            </p>
          </div>

          {mode === 'community' ? (
            // 社群分享模式
            <div className="px-5 pb-5">
              {/* 复制链接 */}
              <div className={`flex items-center gap-3 p-3 rounded-xl mb-4 ${
                isDark ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <Link2 className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  value={content.imageUrl}
                  readOnly
                  className={`flex-1 bg-transparent text-sm outline-none ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                />
                <button
                  onClick={handleCopyLink}
                  className={`p-2 rounded-lg transition-colors ${
                    copied
                      ? 'bg-green-500 text-white'
                      : isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-white text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                </button>
              </div>

              {/* 选择社群 */}
              <div className="mb-4">
                <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  选择社群
                </h4>
                {loading ? (
                  <div className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    加载中...
                  </div>
                ) : communities.length === 0 ? (
                  <div className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    暂无加入的社群
                  </div>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {communities.map(community => (
                      <button
                        key={community.id}
                        onClick={() => setSelectedCommunity(community.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                          selectedCommunity === community.id
                            ? 'bg-indigo-500/20 border-2 border-indigo-500'
                            : isDark
                              ? 'bg-gray-800 border-2 border-transparent hover:border-gray-700'
                              : 'bg-gray-100 border-2 border-transparent hover:border-gray-200'
                        }`}
                      >
                        <img
                          src={community.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${community.name}`}
                          alt={community.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <span className={`flex-1 text-left ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {community.name}
                        </span>
                        {selectedCommunity === community.id && (
                          <Check className="w-5 h-5 text-indigo-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 选择发送目标 */}
              <div className="mb-4">
                <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  发送到
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShareTarget('posts')}
                    className={`flex-1 py-2 px-4 rounded-xl transition-all ${
                      shareTarget === 'posts'
                        ? 'bg-indigo-500 text-white'
                        : isDark
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    帖子区
                  </button>
                  <button
                    onClick={() => setShareTarget('chat')}
                    className={`flex-1 py-2 px-4 rounded-xl transition-all ${
                      shareTarget === 'chat'
                        ? 'bg-indigo-500 text-white'
                        : isDark
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    聊天频道
                  </button>
                </div>
              </div>

              {/* 分享按钮 */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleShareToCommunity}
                disabled={!selectedCommunity || communities.length === 0}
                className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                  !selectedCommunity || communities.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                }`}
              >
                <Share2 className="w-5 h-5" />
                {shareTarget === 'posts' ? '分享到帖子区' : '分享到聊天频道'}
              </motion.button>
            </div>
          ) : (
            // 好友分享模式
            <div className="px-5 pb-5">
              {/* 好友列表 */}
              <div className="mb-4">
                <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  选择好友
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {loading ? (
                    <div className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      加载中...
                    </div>
                  ) : friends.length === 0 ? (
                    <div className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      暂无好友，先去添加好友吧
                    </div>
                  ) : (
                    friends.map(friend => (
                      <button
                        key={friend.id}
                        onClick={() => toggleFriend(friend.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                          selectedFriends.includes(friend.id)
                            ? 'bg-indigo-500/20 border-2 border-indigo-500'
                            : isDark
                              ? 'bg-gray-800 border-2 border-transparent hover:border-gray-700'
                              : 'bg-gray-100 border-2 border-transparent hover:border-gray-200'
                        }`}
                      >
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <span className={`flex-1 text-left ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {friend.name}
                        </span>
                        {selectedFriends.includes(friend.id) && (
                          <Check className="w-5 h-5 text-indigo-500" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* 附言 */}
              <div className="mb-4">
                <input
                  type="text"
                  value={shareNote}
                  onChange={(e) => setShareNote(e.target.value)}
                  placeholder="添加附言（可选）..."
                  className={`w-full p-3 rounded-xl border outline-none transition-all ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                  }`}
                />
              </div>

              {/* 分享按钮 */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleShareToFriends}
                disabled={selectedFriends.length === 0}
                className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                  selectedFriends.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                发送给 {selectedFriends.length > 0 ? `${selectedFriends.length} 位好友` : '好友'}
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareDialog;
