import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, MessageCircle, Link2, Check } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import ShareToCommunity from './ShareToCommunity';
import { WorkShareModal } from './share';

interface ShareSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: {
    type: 'work' | 'activity' | 'post';
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    videoUrl?: string;
    url: string;
    author?: {
      name: string;
      avatar?: string;
    };
  };
  userId: string;
  userName: string;
  userAvatar?: string;
}

type ShareMode = 'select' | 'community' | 'private';

export const ShareSelector: React.FC<ShareSelectorProps> = ({
  isOpen,
  onClose,
  shareData,
  userId,
  userName,
  userAvatar
}) => {
  const { isDark } = useTheme();
  const [mode, setMode] = useState<ShareMode>('select');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // 复制链接
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareData.url);
    setCopied(true);
    toast.success('链接已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  // 返回选择界面
  const handleBack = () => {
    setMode('select');
  };

  // 关闭所有弹窗
  const handleCloseAll = () => {
    setMode('select');
    onClose();
  };

  // 选择模式界面
  if (mode === 'select') {
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
                分享
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
              <div className={`rounded-xl overflow-hidden mb-6 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                {shareData.videoUrl ? (
                  <div className="relative w-full h-48">
                    <video
                      src={shareData.videoUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      loop
                      autoPlay
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/60 text-white text-xs flex items-center gap-1">
                      <i className="fas fa-video text-[10px]"></i>
                      视频
                    </div>
                  </div>
                ) : shareData.thumbnail ? (
                  <img
                    src={shareData.thumbnail}
                    alt={shareData.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center">
                    <i className="fas fa-image text-4xl text-gray-400"></i>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                }`}>
                  {shareData.type === 'work' ? '作品' : shareData.type === 'activity' ? '活动' : '帖子'}
                </span>
              </div>
              <h4 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {shareData.title}
              </h4>
              {shareData.description && (
                <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {shareData.description}
                </p>
              )}
            </div>

            {/* 分享选项 */}
            <div className="px-5 pb-5">
              <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                选择分享方式
              </h4>
              
              <div className="space-y-3">
                {/* 分享到社群 */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode('community')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                    isDark 
                      ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700' 
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      分享到社群
                    </h5>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      分享到你加入的社群
                    </p>
                  </div>
                  <i className="fas fa-chevron-right text-gray-400"></i>
                </motion.button>

                {/* 私信分享 */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode('private')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                    isDark 
                      ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700' 
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      私信分享
                    </h5>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      发送给好友的私信
                    </p>
                  </div>
                  <i className="fas fa-chevron-right text-gray-400"></i>
                </motion.button>

                {/* 复制链接 */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopyLink}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                    isDark 
                      ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700' 
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    copied 
                      ? 'bg-green-500' 
                      : isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    {copied ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <Link2 className={`w-6 h-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {copied ? '已复制' : '复制链接'}
                    </h5>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      复制链接分享给其他人
                    </p>
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // 分享到社群模式
  if (mode === 'community') {
    return (
      <ShareToCommunity
        isOpen={true}
        onClose={handleBack}
        shareCard={shareData}
        userId={userId}
        userName={userName}
        userAvatar={userAvatar}
      />
    );
  }

  // 私信分享模式
  if (mode === 'private') {
    return (
      <WorkShareModal
        isOpen={true}
        onClose={handleCloseAll}
        onBack={() => setMode('select')}
        preselectedWork={{
          id: shareData.id,
          title: shareData.title,
          thumbnail: shareData.thumbnail || '',
          type: shareData.videoUrl ? 'video' : 'image',
          status: '已发布',
          createdAt: Date.now(),
          views: 0,
          likes: 0,
          description: shareData.description,
        }}
      />
    );
  }

  return null;
};

export default ShareSelector;
