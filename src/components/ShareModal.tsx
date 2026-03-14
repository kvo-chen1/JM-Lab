import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  url: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  url
}) => {
  const { isDark } = useTheme();
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('链接已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('复制失败，请手动复制');
    }
  };

  const shareOptions = [
    { name: '微信', icon: '💬', color: 'bg-green-500' },
    { name: '微博', icon: '📱', color: 'bg-red-500' },
    { name: 'QQ', icon: '🐧', color: 'bg-blue-500' },
    { name: '复制链接', icon: '🔗', color: 'bg-gray-500', onClick: handleCopyLink },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
          />

          {/* 弹窗内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl shadow-2xl z-[70] ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border`}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">分享活动</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-6">
              <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">{title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{description}</p>
              </div>

              {/* 分享选项 */}
              <div className="grid grid-cols-4 gap-4">
                {shareOptions.map((option) => (
                  <motion.button
                    key={option.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={option.onClick || (() => toast.info(`${option.name}分享功能开发中`))}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className={`w-12 h-12 rounded-full ${option.color} flex items-center justify-center text-white text-xl`}>
                      {option.name === '复制链接' && copied ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <span>{option.icon}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {option.name === '复制链接' && copied ? '已复制' : option.name}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* 链接输入框 */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  活动链接
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={url}
                    readOnly
                    className={`flex-1 px-4 py-2 rounded-lg border text-sm ${
                      isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShareModal;
