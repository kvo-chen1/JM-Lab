import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Github, Chrome } from 'lucide-react';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export default function LoginPromptModal({ 
  isOpen, 
  onClose, 
  title = '需要登录',
  description = '请先登录后再进行此操作'
}: LoginPromptModalProps) {
  const navigate = useNavigate();
  const { quickLogin } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    onClose();
    navigate('/login', { state: { from: window.location.pathname } });
  };

  const handleQuickLogin = async (provider: 'github' | 'google') => {
    setIsLoading(true);
    try {
      const success = await quickLogin(provider);
      if (success) {
        onClose();
        toast.success('登录成功');
      }
    } catch (error) {
      toast.error('登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* 弹窗内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* 头部 */}
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-center">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 p-1 text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                <p className="text-white/80 text-sm">{description}</p>
              </div>

              {/* 内容区 */}
              <div className="p-6 space-y-4">
                {/* 主要登录按钮 */}
                <button
                  onClick={handleLogin}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Mail className="w-5 h-5" />
                    使用邮箱登录
                  </span>
                </button>

                {/* 分隔线 */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">或使用以下方式</span>
                  </div>
                </div>

                {/* 第三方登录 */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleQuickLogin('github')}
                    disabled={isLoading}
                    className="py-2.5 px-4 bg-gray-900 dark:bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Github className="w-5 h-5" />
                    GitHub
                  </button>
                  <button
                    onClick={() => handleQuickLogin('google')}
                    disabled={isLoading}
                    className="py-2.5 px-4 bg-white border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Chrome className="w-5 h-5 text-red-500" />
                    Google
                  </button>
                </div>

                {/* 注册链接 */}
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  还没有账号？
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/register');
                    }}
                    className="ml-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    立即注册
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
