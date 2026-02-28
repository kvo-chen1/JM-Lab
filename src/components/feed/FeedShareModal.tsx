import { useState, useCallback, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import {
  X,
  Users,
  MessageCircle,
  Link2,
  ChevronRight,
  Check,
  Search,
  Send,
  Loader2,
} from 'lucide-react';
import type { FeedItem } from '@/types/feed';
import type { User } from '@/types/user';
import { UserSearch } from '@/components/share/UserSearch';
import { communityService, type Community } from '@/services/communityService';

interface FeedShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  feed: FeedItem | null;
  onShareSuccess?: () => void;
}

type ShareStep = 'options' | 'select-community' | 'select-user' | 'compose' | 'sending' | 'success';

export function FeedShareModal({ isOpen, onClose, feed, onShareSuccess }: FeedShareModalProps) {
  const { isDark } = useTheme();
  const { user: currentUser } = useContext(AuthContext);
  const [currentStep, setCurrentStep] = useState<ShareStep>('options');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  const [communitySearchQuery, setCommunitySearchQuery] = useState('');

  // 加载用户加入的社群
  useEffect(() => {
    const loadCommunities = async () => {
      if (!isOpen || !currentUser?.id) return;

      setIsLoadingCommunities(true);
      try {
        const userCommunities = await communityService.getUserCommunities(currentUser.id);
        setCommunities(userCommunities);
      } catch (error) {
        console.error('加载社群失败:', error);
        toast.error('加载社群失败');
      } finally {
        setIsLoadingCommunities(false);
      }
    };

    loadCommunities();
  }, [isOpen, currentUser?.id]);

  // 筛选社群
  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(communitySearchQuery.toLowerCase())
  );

  // 重置状态
  const resetState = useCallback(() => {
    setCurrentStep('options');
    setSelectedUser(null);
    setMessage('');
    setSendStatus('idle');
    setCopied(false);
    setCommunitySearchQuery('');
  }, []);

  // 关闭弹窗
  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  // 复制链接
  const handleCopyLink = useCallback(async () => {
    if (!feed) return;

    const shareUrl = `${window.location.origin}/feed/${feed.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('链接已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
      onShareSuccess?.();
    } catch (error) {
      toast.error('复制失败，请手动复制');
    }
  }, [feed, onShareSuccess]);

  // 选择分享到社群
  const handleShareToCommunity = useCallback(() => {
    setCurrentStep('select-community');
  }, []);

  // 选择私信分享
  const handleShareToUser = useCallback(() => {
    setCurrentStep('select-user');
  }, []);

  // 选择用户
  const handleUserSelect = useCallback((user: User) => {
    setSelectedUser(user);
    setCurrentStep('compose');
  }, []);

  // 返回上一步
  const handleBack = useCallback(() => {
    switch (currentStep) {
      case 'select-community':
      case 'select-user':
        setCurrentStep('options');
        break;
      case 'compose':
        setCurrentStep('select-user');
        break;
    }
  }, [currentStep]);

  // 发送私信分享
  const handleSend = useCallback(async () => {
    if (!currentUser || !selectedUser || !feed) {
      toast.error('缺少必要信息');
      return;
    }

    setSendStatus('sending');
    setCurrentStep('sending');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      // 调用后端 API 发送私信分享
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: selectedUser.id,
          content: message || `分享一个作品：${feed.title || '动态'}`,
          feedId: feed.id,
          feedType: 'share'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          setSendStatus('success');
          setCurrentStep('success');
          toast.success('分享成功！');
          onShareSuccess?.();

          // 3 秒后自动关闭
          setTimeout(() => {
            handleClose();
          }, 3000);
          return;
        }
      }
      
      throw new Error('发送失败');
    } catch (error: any) {
      console.error('[FeedShareModal] handleSend error:', error);
      setSendStatus('error');
      toast.error(error.message || '发送失败，请重试');
      
      // 错误时 2 秒后允许重新发送
      setTimeout(() => {
        setSendStatus('idle');
        setCurrentStep('compose');
      }, 2000);
    }
  }, [currentUser, selectedUser, feed, message, onShareSuccess, handleClose]);

  // 获取预览图片
  const getPreviewImage = () => {
    if (!feed) return '';
    if (feed.media && feed.media.length > 0) {
      const firstMedia = feed.media[0];
      // 如果是视频，使用缩略图；如果是图片，使用原图
      if (firstMedia.type === 'video') {
        return firstMedia.thumbnailUrl || firstMedia.url;
      }
      return firstMedia.url;
    }
    if (feed.shareTarget?.thumbnailUrl) {
      return feed.shareTarget.thumbnailUrl;
    }
    return '';
  };

  // 获取预览标题
  const getPreviewTitle = () => {
    if (!feed) return '';
    return feed.title || feed.shareTarget?.title || '动态分享';
  };

  // 获取预览描述
  const getPreviewDescription = () => {
    if (!feed) return '';
    const content = feed.content || feed.shareTarget?.description || '';
    return content.length > 60 ? content.slice(0, 60) + '...' : content;
  };

  // 渲染分享选项
  const renderShareOptions = () => (
    <div className="space-y-3">
      {/* 分享到社群 */}
      <button
        onClick={handleShareToCommunity}
        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
          isDark
            ? 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700'
            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
        }`}
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 text-left">
          <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            分享到社群
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            分享到你加入的社群
          </p>
        </div>
        <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
      </button>

      {/* 私信分享 */}
      <button
        onClick={handleShareToUser}
        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
          isDark
            ? 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700'
            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
        }`}
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 text-left">
          <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            私信分享
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            发送给好友的私信
          </p>
        </div>
        <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
      </button>

      {/* 复制链接 */}
      <button
        onClick={handleCopyLink}
        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
          isDark
            ? 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700'
            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
        }`}
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center flex-shrink-0">
          {copied ? (
            <Check className="w-6 h-6 text-white" />
          ) : (
            <Link2 className="w-6 h-6 text-white" />
          )}
        </div>
        <div className="flex-1 text-left">
          <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {copied ? '已复制' : '复制链接'}
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            复制链接分享给其他人
          </p>
        </div>
      </button>
    </div>
  );

  // 渲染社群选择
  const renderCommunitySelect = () => (
    <div className="space-y-4">
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        <input
          type="text"
          placeholder="搜索社群..."
          value={communitySearchQuery}
          onChange={(e) => setCommunitySearchQuery(e.target.value)}
          className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm ${
            isDark
              ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500'
              : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {isLoadingCommunities ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <p className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>加载社群中...</p>
          </div>
        ) : filteredCommunities.length > 0 ? (
          filteredCommunities.map((community) => (
            <button
              key={community.id}
              onClick={async () => {
                try {
                  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                  
                  // 调用后端 API 分享到社群
                  const response = await fetch('/api/share/community', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      communityId: community.id,
                      title: feed.title || feed.shareTarget?.title || '作品分享',
                      description: feed.content || feed.shareTarget?.description || '',
                      imageUrl: feed.media?.[0]?.url || feed.media?.[0]?.thumbnailUrl || '',
                      type: feed.media?.[0]?.type === 'video' ? 'video' : 'image',
                      feedId: feed.id,
                      shareType: 'feed'
                    })
                  });

                  if (response.ok) {
                    const result = await response.json();
                    if (result.code === 0) {
                      toast.success(`已分享到 ${community.name}`);
                      onShareSuccess?.();
                      setTimeout(() => {
                        handleClose();
                      }, 2000);
                      return;
                    }
                  }
                  
                  throw new Error('分享失败');
                } catch (error: any) {
                  console.error('[FeedShareModal] handleShareToCommunity error:', error);
                  toast.error(error.message || '分享失败，请重试');
                }
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                isDark
                  ? 'hover:bg-gray-800/50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <img
                src={community.avatar}
                alt={community.name}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div className="flex-1 text-left">
                <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {community.name}
                </h4>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {community.memberCount} 成员
                </p>
              </div>
              <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <Users className={`w-12 h-12 mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {communitySearchQuery ? '未找到匹配的社群' : '您还没有加入任何社群'}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // 渲染用户选择
  const renderUserSelect = () => (
    <UserSearch
      selectedUser={selectedUser}
      onSelect={handleUserSelect}
      onBack={handleBack}
      onCancel={handleClose}
    />
  );

  // 渲染私信编辑
  const renderCompose = () => (
    <div className="space-y-4">
      {/* 已选用户 */}
      {selectedUser && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl ${
            isDark ? 'bg-gray-800/50' : 'bg-gray-50'
          }`}
        >
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            发送给：
          </span>
          <div className="flex items-center gap-2">
            {selectedUser.avatar ? (
              <img
                src={selectedUser.avatar}
                alt={selectedUser.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
                {selectedUser.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {selectedUser.name}
            </span>
          </div>
        </div>
      )}

      {/* 消息编辑区 */}
      <div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`给 ${selectedUser?.name} 写点什么...（可选）`}
          maxLength={500}
          rows={4}
          className={`w-full p-4 rounded-xl text-sm resize-none ${
            isDark
              ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500'
              : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
        <div className={`text-right text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {message.length}/500
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={handleBack}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            isDark
              ? 'text-gray-400 hover:text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          返回
        </button>
        <button
          onClick={handleSend}
          disabled={sendStatus === 'sending'}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sendStatus === 'sending' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              发送中...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              发送私信
            </>
          )}
        </button>
      </div>
    </div>
  );

  // 渲染发送中状态
  const renderSending = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-blue-200 dark:border-blue-900/30" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>
      <p className={`mt-6 text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
        正在发送...
      </p>
    </div>
  );

  // 渲染成功状态
  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
        <Check className="w-8 h-8 text-white" />
      </div>
      <p className={`mt-6 text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
        分享成功！
      </p>
      <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        已通过私信发送给 {selectedUser?.name}
      </p>
    </div>
  );

  // 渲染内容
  const renderContent = () => {
    switch (currentStep) {
      case 'options':
        return renderShareOptions();
      case 'select-community':
        return renderCommunitySelect();
      case 'select-user':
        return renderUserSelect();
      case 'compose':
        return renderCompose();
      case 'sending':
        return renderSending();
      case 'success':
        return renderSuccess();
      default:
        return null;
    }
  };

  if (!isOpen || !feed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl ${
            isDark
              ? 'bg-gray-900 border border-gray-800'
              : 'bg-white border border-gray-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div
            className={`flex items-center justify-between p-4 border-b ${
              isDark ? 'border-gray-800' : 'border-gray-100'
            }`}
          >
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {currentStep === 'options' ? '分享' : currentStep === 'select-community' ? '选择社群' : currentStep === 'select-user' ? '选择好友' : '发送私信'}
            </h2>
            <button
              onClick={handleClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 作品预览 - 仅在选项页面显示 */}
          {currentStep === 'options' && (
            <div className={`p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              {/* 标签 */}
              <div className="mb-3">
                <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                  isDark
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  作品
                </span>
              </div>

              {/* 图片/视频预览 */}
              {(() => {
                const previewUrl = getPreviewImage();
                const firstMedia = feed?.media?.[0];
                const isVideo = firstMedia?.type === 'video';
                
                if (!previewUrl && !isVideo) return null;
                
                return (
                  <div className="relative rounded-xl overflow-hidden mb-3 aspect-video bg-gray-100 dark:bg-gray-800">
                    {isVideo ? (
                      // 视频预览 - 自动播放
                      <video
                        src={firstMedia?.url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        autoPlay
                        loop
                        preload="auto"
                      />
                    ) : (
                      // 图片预览
                      <img
                        src={previewUrl}
                        alt={getPreviewTitle()}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                );
              })()}

              {/* 标题和描述 */}
              <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {getPreviewTitle()}
              </h3>
              <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {getPreviewDescription()}
              </p>
            </div>
          )}

          {/* 返回按钮 - 在非选项页面显示 */}
          {currentStep !== 'options' && currentStep !== 'sending' && currentStep !== 'success' && (
            <div className="px-4 pt-4">
              <button
                onClick={handleBack}
                className={`text-sm flex items-center gap-1 transition-colors ${
                  isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                返回
              </button>
            </div>
          )}

          {/* 内容区域 */}
          <div className="p-4 overflow-y-auto max-h-[50vh]">
            {renderContent()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default FeedShareModal;
