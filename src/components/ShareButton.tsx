import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

// 分享选项类型
type SharePlatform = 'wechat' | 'weibo' | 'qq' | 'copy';

// 分享按钮属性
interface ShareButtonProps {
  title?: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  className?: string;
  onShareSuccess?: (platform: SharePlatform) => void;
  onShareFailure?: (platform: SharePlatform, error: Error) => void;
}

/**
 * 分享按钮组件，支持多种社交平台分享
 */
const ShareButton: React.FC<ShareButtonProps> = ({
  title = '分享',
  description = '分享内容',
  url = window.location.href,
  imageUrl,
  className = '',
  onShareSuccess,
  onShareFailure
}) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // 复制到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      onShareSuccess?.('copy');
      setIsOpen(false);
    } catch (error) {
      onShareFailure?.('copy', error as Error);
    }
  };

  // 分享到社交媒体平台
  const shareToPlatform = (platform: SharePlatform) => {
    let shareUrl = '';
    
    switch (platform) {
      case 'weibo':
        shareUrl = `https://service.weibo.com/share/share.php?title=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}&pic=${encodeURIComponent(imageUrl || '')}`;
        break;
      case 'qq':
        shareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(description)}&pics=${encodeURIComponent(imageUrl || '')}`;
        break;
      case 'wechat':
        // 微信分享需要特殊处理，这里只显示提示
        alert('请使用微信扫描二维码分享');
        return;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    onShareSuccess?.(platform);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block">
      {/* 分享按钮 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 ${
          isDark 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        } ${className}`}
      >
        <i className="fas fa-share-alt"></i>
        <span>{title}</span>
      </motion.button>

      {/* 分享选项 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute right-0 mt-2 w-48 rounded-lg shadow-xl overflow-hidden z-50 ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
          >
            {/* 分享选项列表 */}
            <div className="py-2">
              {/* 微信分享 */}
              <button
                onClick={() => shareToPlatform('wechat')}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
              >
                <i className="fab fa-weixin text-green-500 text-xl"></i>
                <span>微信分享</span>
              </button>
              
              {/* 微博分享 */}
              <button
                onClick={() => shareToPlatform('weibo')}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
              >
                <i className="fab fa-weibo text-red-500 text-xl"></i>
                <span>微博分享</span>
              </button>
              
              {/* QQ分享 */}
              <button
                onClick={() => shareToPlatform('qq')}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
              >
                <i className="fab fa-qq text-blue-500 text-xl"></i>
                <span>QQ分享</span>
              </button>
              
              {/* 复制链接 */}
              <button
                onClick={copyToClipboard}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
              >
                <i className="fas fa-copy text-gray-500 text-xl"></i>
                <span>复制链接</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ShareButton;