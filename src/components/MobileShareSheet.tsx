import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { 
  X, 
  Link2, 
  Check, 
  Users, 
  MessageCircle, 
  Share2, 
  ChevronRight,
  Copy,
  ExternalLink
} from 'lucide-react';
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

interface ShareContent {
  title: string;
  description: string;
  imageUrl: string;
  type: 'image' | 'video';
}

interface MobileShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  content: ShareContent | null;
}

type ShareView = 'menu' | 'communities' | 'friends' | 'link';

export function MobileShareSheet({ isOpen, onClose, content }: MobileShareSheetProps) {
  const { isDark } = useTheme();
  const { isAuthenticated } = useContext(AuthContext);
  const [currentView, setCurrentView] = useState<ShareView>('menu');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');
  const [shareTarget, setShareTarget] = useState<'posts' | 'chat'>('posts');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareNote, setShareNote] = useState('');

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setCurrentView('menu');
      setSelectedFriends([]);
      setSelectedCommunity('');
      setShareTarget('posts');
      setCopied(false);
      setShareNote('');
    }
  }, [isOpen]);

  // 加载好友列表
  const loadFriends = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }
    try {
      setLoading(true);
      const [following, followers] = await Promise.all([
        getFollowingList(),
        getFollowersList()
      ]);

      const followerIds = new Set(followers.map(u => u.id));
      const friendsList = following
        .filter(user => followerIds.has(user.id))
        .map(user => ({
          id: user.id,
          name: user.username || '未知用户',
          avatar: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
        }));

      setFriends(friendsList);
      setCurrentView('friends');
    } catch (error) {
      console.error('加载好友列表失败:', error);
      toast.error('加载好友列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载社群列表
  const loadCommunities = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/communities', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.code === 0 && data.data) {
          const communityList = data.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            avatar: c.avatar
          }));
          setCommunities(communityList);
          if (communityList.length > 0) {
            setSelectedCommunity(communityList[0].id);
          }
        }
      }
      setCurrentView('communities');
    } catch (error) {
      console.error('加载社群列表失败:', error);
      toast.error('加载社群列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 复制链接
  const handleCopyLink = () => {
    if (!content) return;
    navigator.clipboard.writeText(content.imageUrl);
    setCopied(true);
    toast.success('链接已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  // 复制分享文本
  const handleCopyShareText = () => {
    if (!content) return;
    const text = `【${content.title}】\n${content.description}\n${content.imageUrl}`;
    navigator.clipboard.writeText(text);
    toast.success('分享内容已复制');
  };

  // 分享到社群
  const handleShareToCommunity = async () => {
    if (!selectedCommunity) {
      toast.error('请选择一个社群');
      return;
    }
    if (!content) return;

    try {
      const token = localStorage.getItem('token');
      const selectedCommunityData = communities.find(c => c.id === selectedCommunity);

      if (shareTarget === 'posts') {
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
            communityName: selectedCommunityData?.name
          })
        });

        if (response.ok) {
          toast.success(`已分享到 ${selectedCommunityData?.name || '社群'}！`);
          onClose();
        } else {
          throw new Error('分享失败');
        }
      } else {
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
          toast.success(`已分享到聊天频道！`);
          onClose();
        } else {
          throw new Error('分享失败');
        }
      }
    } catch (error) {
      console.error('分享到社群失败:', error);
      toast.error('分享失败，请重试');
    }
  };

  // 分享给好友
  const handleShareToFriends = async () => {
    if (selectedFriends.length === 0) {
      toast.error('请选择至少一位好友');
      return;
    }
    if (!content) return;

    try {
      const token = localStorage.getItem('token');
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
        toast.success(`已分享给 ${selectedFriends.length} 位好友！`);
        onClose();
      } else {
        throw new Error('分享失败');
      }
    } catch (error) {
      console.error('分享给好友失败:', error);
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

  // 渲染主菜单
  const renderMenu = () => (
    <div className="space-y-2">
      {/* 分享到社群 */}
      <button
        onClick={loadCommunities}
        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
          isDark 
            ? 'bg-gray-800 hover:bg-gray-700' 
            : 'bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'
        }`}>
          <Users className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
        </div>
        <div className="flex-1 text-left">
          <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            分享到社群
          </h4>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            发布到津脉社区的帖子或聊天
          </p>
        </div>
        <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
      </button>

      {/* 分享给好友 */}
      <button
        onClick={loadFriends}
        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
          isDark 
            ? 'bg-gray-800 hover:bg-gray-700' 
            : 'bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isDark ? 'bg-pink-500/20' : 'bg-pink-100'
        }`}>
          <MessageCircle className={`w-6 h-6 ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />
        </div>
        <div className="flex-1 text-left">
          <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            分享给好友
          </h4>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            发送给关注你的好友
          </p>
        </div>
        <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
      </button>

      {/* 复制链接 */}
      <button
        onClick={() => setCurrentView('link')}
        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
          isDark 
            ? 'bg-gray-800 hover:bg-gray-700' 
            : 'bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
        }`}>
          <Link2 className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
        </div>
        <div className="flex-1 text-left">
          <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            复制链接
          </h4>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            复制链接分享到其他平台
          </p>
        </div>
        <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
      </button>
    </div>
  );

  // 渲染社群选择
  const renderCommunities = () => (
    <div className="space-y-4">
      {/* 返回按钮 */}
      <button
        onClick={() => setCurrentView('menu')}
        className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        返回
      </button>

      {loading ? (
        <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          加载中...
        </div>
      ) : communities.length === 0 ? (
        <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>暂无加入的社群</p>
        </div>
      ) : (
        <>
          {/* 社群列表 */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {communities.map(community => (
              <button
                key={community.id}
                onClick={() => setSelectedCommunity(community.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  selectedCommunity === community.id
                    ? 'bg-indigo-500/20 border-2 border-indigo-500'
                    : isDark
                      ? 'bg-gray-800 border-2 border-transparent'
                      : 'bg-gray-50 border-2 border-transparent'
                }`}
              >
                <img
                  src={community.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${community.name}`}
                  alt={community.name}
                  className="w-10 h-10 rounded-full"
                />
                <span className={`flex-1 text-left font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {community.name}
                </span>
                {selectedCommunity === community.id && (
                  <Check className="w-5 h-5 text-indigo-500" />
                )}
              </button>
            ))}
          </div>

          {/* 发送目标选择 */}
          <div className="flex gap-2">
            <button
              onClick={() => setShareTarget('posts')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                shareTarget === 'posts'
                  ? 'bg-indigo-500 text-white'
                  : isDark
                    ? 'bg-gray-800 text-gray-300'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              帖子区
            </button>
            <button
              onClick={() => setShareTarget('chat')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                shareTarget === 'chat'
                  ? 'bg-indigo-500 text-white'
                  : isDark
                    ? 'bg-gray-800 text-gray-300'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              聊天频道
            </button>
          </div>

          {/* 分享按钮 */}
          <button
            onClick={handleShareToCommunity}
            disabled={!selectedCommunity}
            className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
              !selectedCommunity
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
            }`}
          >
            <Share2 className="w-5 h-5" />
            {shareTarget === 'posts' ? '分享到帖子区' : '分享到聊天频道'}
          </button>
        </>
      )}
    </div>
  );

  // 渲染好友选择
  const renderFriends = () => (
    <div className="space-y-4">
      {/* 返回按钮 */}
      <button
        onClick={() => setCurrentView('menu')}
        className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        返回
      </button>

      {loading ? (
        <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          加载中...
        </div>
      ) : friends.length === 0 ? (
        <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>暂无好友</p>
          <p className="text-sm mt-1">先去添加好友吧</p>
        </div>
      ) : (
        <>
          {/* 好友列表 */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {friends.map(friend => (
              <button
                key={friend.id}
                onClick={() => toggleFriend(friend.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  selectedFriends.includes(friend.id)
                    ? 'bg-pink-500/20 border-2 border-pink-500'
                    : isDark
                      ? 'bg-gray-800 border-2 border-transparent'
                      : 'bg-gray-50 border-2 border-transparent'
                }`}
              >
                <img
                  src={friend.avatar}
                  alt={friend.name}
                  className="w-10 h-10 rounded-full"
                />
                <span className={`flex-1 text-left font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {friend.name}
                </span>
                {selectedFriends.includes(friend.id) && (
                  <Check className="w-5 h-5 text-pink-500" />
                )}
              </button>
            ))}
          </div>

          {/* 附言输入 */}
          <input
            type="text"
            value={shareNote}
            onChange={(e) => setShareNote(e.target.value)}
            placeholder="添加附言（可选）..."
            className={`w-full p-3 rounded-xl border outline-none transition-all text-sm ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
            }`}
          />

          {/* 分享按钮 */}
          <button
            onClick={handleShareToFriends}
            disabled={selectedFriends.length === 0}
            className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
              selectedFriends.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 to-rose-600 text-white'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            发送给 {selectedFriends.length > 0 ? `${selectedFriends.length} 位好友` : '好友'}
          </button>
        </>
      )}
    </div>
  );

  // 渲染链接分享
  const renderLink = () => (
    <div className="space-y-4">
      {/* 返回按钮 */}
      <button
        onClick={() => setCurrentView('menu')}
        className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        返回
      </button>

      {/* 链接显示 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-3 mb-3">
          <Link2 className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            作品链接
          </span>
        </div>
        <div className={`p-3 rounded-lg text-sm break-all ${isDark ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-600 border border-gray-200'}`}>
          {content?.imageUrl}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="space-y-2">
        <button
          onClick={handleCopyLink}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
            copied
              ? 'bg-green-500 text-white'
              : isDark
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          {copied ? '已复制' : '复制链接'}
        </button>

        <button
          onClick={handleCopyShareText}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
            isDark
              ? 'bg-gray-800 text-white hover:bg-gray-700'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          <Share2 className="w-5 h-5" />
          复制分享文案
        </button>

        <a
          href={content?.imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
            isDark
              ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
          }`}
        >
          <ExternalLink className="w-5 h-5" />
          打开原图
        </a>
      </div>
    </div>
  );

  if (!isOpen || !content) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`absolute bottom-0 left-0 right-0 rounded-t-3xl max-h-[85vh] overflow-hidden ${
            isDark ? 'bg-gray-900' : 'bg-white'
          }`}
          onClick={e => e.stopPropagation()}
        >
          {/* 拖动指示条 */}
          <div className="flex justify-center pt-3 pb-2">
            <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
          </div>

          {/* 头部 */}
          <div className={`flex items-center justify-between px-5 pb-4 border-b ${
            isDark ? 'border-gray-800' : 'border-gray-100'
          }`}>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {currentView === 'menu' && '分享到'}
              {currentView === 'communities' && '选择社群'}
              {currentView === 'friends' && '选择好友'}
              {currentView === 'link' && '复制链接'}
            </h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 内容预览 */}
          {currentView === 'menu' && (
            <div className="px-5 py-4">
              <div className={`rounded-xl overflow-hidden mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <img
                  src={content.imageUrl}
                  alt="Preview"
                  className="w-full h-40 object-cover"
                />
              </div>
              <h4 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {content.title}
              </h4>
              <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {content.description}
              </p>
            </div>
          )}

          {/* 内容区域 */}
          <div className="px-5 pb-8 overflow-y-auto max-h-[50vh]">
            {currentView === 'menu' && renderMenu()}
            {currentView === 'communities' && renderCommunities()}
            {currentView === 'friends' && renderFriends()}
            {currentView === 'link' && renderLink()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default MobileShareSheet;
