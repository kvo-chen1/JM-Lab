import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePersistentAuth } from '@/hooks/usePersistentAuth';
import { getPreLoginPath, clearPreLoginPath } from '@/components/PrivateRoute';

// OAuth 提供商配置
interface OAuthProvider {
  name: string;
  label: string;
  color: string;
  icon: string;
  configured: boolean;
}

export default function Login() {
  const { toggleTheme, isDark } = useTheme();
  const { login, loginWithCode, sendEmailOtp, isAuthenticated, quickLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { redirectAfterLogin, getLastPath } = usePersistentAuth({
    storageKeyPrefix: 'app',
    persistAuth: true,
  });

  // OAuth 提供商列表 - 固定显示所有4个图标
  const oauthProviders: OAuthProvider[] = [
    { name: 'github', label: 'GitHub', color: 'bg-gradient-to-br from-gray-800 to-gray-600', icon: 'fa-github', configured: true },
    { name: 'google', label: 'Google', color: 'bg-gradient-to-br from-red-500 to-orange-400', icon: 'fa-google', configured: true },
    { name: 'wechat', label: '微信', color: 'bg-gradient-to-br from-green-500 to-teal-400', icon: 'fa-weixin', configured: false },
    { name: 'alipay', label: '支付宝', color: 'bg-gradient-to-br from-blue-500 to-blue-400', icon: 'fa-alipay', configured: false },
  ];

  // 获取已配置的 OAuth 提供商状态（用于控制是否可用）
  const [configuredProviders, setConfiguredProviders] = useState<Set<string>>(new Set(['github']));

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/auth/oauth-providers');
        const data = await response.json();
        if (data.success) {
          // 更新配置状态集合
          const configured = new Set(
            data.providers.filter((p: any) => p.configured).map((p: any) => p.name)
          );
          setConfiguredProviders(configured);
        }
      } catch (error) {
        // 如果接口失败，默认只有 GitHub
        console.log('获取 OAuth 提供商失败，使用默认配置');
        setConfiguredProviders(new Set(['github']));
      }
    };

    fetchProviders();
  }, []);

  // 邮箱登录类型：只保留验证码登录
  const [emailLoginType] = useState<'password' | 'code'>('code');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  // 表单验证状态
  interface ErrorsState {
    email: string;
    code: string;
  }
  const [errors, setErrors] = useState<ErrorsState>({ email: '', code: '' });
  // 输入框焦点状态
  interface FocusedState {
    email: boolean;
    code: boolean;
  }
  const [focused, setFocused] = useState<FocusedState>({ email: false, code: false });
  
  // 倒计时计时器
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);
  
  const handleSendCode = async () => {
    if (!email || errors.email) {
      setErrors(prev => ({ ...prev, email: '请输入有效的邮箱' }));
      return;
    }
    
    setIsSendingCode(true);
    try {
      const result = await sendEmailOtp(email);
      if (result.success) {
        toast.success('邮箱验证码发送成功，请注意查收');
        setCountdown(60);
      } else {
        toast.error(result.error || '邮箱验证码发送失败');
      }
    } catch (error) {
      toast.error('邮箱验证码发送失败，请稍后重试');
    } finally {
      setIsSendingCode(false);
    }
  };
  
  useEffect(() => {
    if (isAuthenticated) {
      // 登录成功后，优先使用 PrivateRoute 保存的路径
      const preLoginPath = getPreLoginPath();
      if (preLoginPath && preLoginPath !== '/login') {
        clearPreLoginPath();
        navigate(preLoginPath, { replace: true });
      } else {
        // 如果没有保存的路径，使用 usePersistentAuth 的路径
        redirectAfterLogin();
      }
    }
  }, [isAuthenticated, redirectAfterLogin, navigate])
  
  // 实时表单验证
  const validateEmail = (value: string) => {
    if (!value) return '请输入邮箱';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return '请输入有效的邮箱地址';
    return '';
  };

  const validateCode = (value: string) => {
    if (!value) return '请输入验证码';
    if (value.length !== 6) return '验证码长度为6位';
    if (!/^\d+$/.test(value)) return '验证码只能包含数字';
    return '';
  };

  // 处理输入变化
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setErrors(prev => ({ ...prev, email: validateEmail(value) }));
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCode(value);
    setErrors(prev => ({ ...prev, code: validateCode(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    const codeError = validateCode(code);

    if (emailError || codeError) {
      setErrors(prev => ({
        ...prev,
        email: emailError,
        code: codeError
      }));
      toast.error('请检查输入信息');
      return;
    }

    setIsLoading(true);

    try {
      const success = await loginWithCode('email', email, code);

      if (success) {
        toast.success('登录成功！');
        // 检查用户是否为新用户，如果是则重定向到信息完善页面
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.isNewUser) {
          navigate('/complete-profile');
        } else {
          // 登录成功后，优先使用 PrivateRoute 保存的路径
          const preLoginPath = getPreLoginPath();
          if (preLoginPath && preLoginPath !== '/login') {
            clearPreLoginPath();
            navigate(preLoginPath, { replace: true });
          } else {
            // 如果没有保存的路径，使用 usePersistentAuth 的路径
            redirectAfterLogin();
          }
        }
      } else {
        toast.error('邮箱或验证码错误，请重试');
      }
    } catch (error) {
      toast.error('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: 'spring', 
        stiffness: 100,
        damping: 12
      }
    }
  };
  
  const buttonVariants = {
    hover: { 
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    tap: { 
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  };
  
  const inputVariants = {
    focus: { 
      boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
      transition: { duration: 0.2 }
    }
  };
  
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[40rem] h-[40rem] bg-gradient-to-br from-red-600 to-purple-600 opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-[40rem] h-[40rem] bg-gradient-to-tr from-blue-600 to-teal-400 opacity-10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <motion.div 
        className={`relative z-10 w-full max-w-md ${isDark ? 'bg-gray-800/90 backdrop-blur-sm' : 'bg-white/95 backdrop-blur-sm'} rounded-2xl shadow-2xl p-4 sm:p-8 border ${isDark ? 'border-gray-700' : 'border-gray-100'} transition-all duration-300`}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}
      >
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <motion.div 
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-red-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm sm:text-base">AI</span>
            </div>
            <span className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">共创</span>
          </motion.div>
          
          <motion.button 
            onClick={toggleTheme}
            className={`p-2 rounded-full ${isDark ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-700'} transition-all duration-300`}
            aria-label="切换主题"
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.95 }}
          >
            {isDark ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
          </motion.button>
        </div>
        
        <motion.h1
          className="text-xl sm:text-[clamp(1.5rem,4vw,2rem)] font-bold mb-1 sm:mb-2 leading-tight"
          variants={itemVariants}
        >
          欢迎回来
        </motion.h1>

        <motion.p
          className="mb-4 sm:mb-6 text-gray-600 dark:text-gray-300 text-xs sm:text-sm"
          variants={itemVariants}
        >
          登录您的AI共创平台账号，继续您的创作之旅
        </motion.p>
        
        {/* 登录方式切换 - 移除手机号选项 */}
        <motion.div
          className="mb-4 sm:mb-6"
          variants={itemVariants}
        >
          <div className={`flex rounded-xl overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
            <button
              type="button"
              className={`flex-1 py-2 px-4 transition-all duration-300 bg-gradient-to-r from-red-600 to-purple-600 text-white font-medium text-xs sm:text-sm shadow-md`}
            >
              邮箱登录
            </button>
          </div>
        </motion.div>
        
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-3 sm:space-y-4"
          variants={itemVariants}
        >
          <div className="relative">
            <div className="flex justify-between items-center mb-1 sm:mb-2">
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 dark:text-gray-300">邮箱</label>
              {errors.email && (
                <span className="text-xs text-red-500 flex items-center">
                  <i className="fas fa-exclamation-circle mr-1"></i>
                  {errors.email}
                </span>
              )}
            </div>
            <motion.div
              className="relative"
              whileFocus={{ scale: 1.01 }}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <i className="fas fa-envelope text-sm"></i>
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                onFocus={() => setFocused(prev => ({ ...prev, email: true }))}
                onBlur={() => setFocused(prev => ({ ...prev, email: false }))}
                className={cn(
                  "w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm sm:text-base",
                  isDark
                    ? `bg-gray-700/50 border ${errors.email ? 'border-red-500' : focused.email ? 'border-red-400' : 'border-gray-600'} text-white placeholder-gray-400`
                    : `bg-white border ${errors.email ? 'border-red-500' : focused.email ? 'border-red-400' : 'border-gray-200'} text-gray-900 placeholder-gray-400 shadow-sm`
                )}
                placeholder="请输入您的邮箱"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                enterKeyHint="next"
                required
              />
            </motion.div>
          </div>

          <div className="relative">
            <div className="flex justify-between items-center mb-1 sm:mb-2">
              <label htmlFor="code" className="block text-xs font-medium text-gray-700 dark:text-gray-300">验证码</label>
              {errors.code && (
                <span className="text-xs text-red-500 flex items-center">
                  <i className="fas fa-exclamation-circle mr-1"></i>
                  {errors.code}
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <motion.div
                className="flex-1 relative"
                whileFocus={{ scale: 1.01 }}
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <i className="fas fa-shield-alt text-sm"></i>
                </div>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={handleCodeChange}
                  onFocus={() => setFocused(prev => ({ ...prev, code: true }))}
                  onBlur={() => setFocused(prev => ({ ...prev, code: false }))}
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm sm:text-base",
                    isDark
                      ? `bg-gray-700/50 border ${errors.code ? 'border-red-500' : focused.code ? 'border-red-400' : 'border-gray-600'} text-white placeholder-gray-400`
                      : `bg-white border ${errors.code ? 'border-red-500' : focused.code ? 'border-red-400' : 'border-gray-200'} text-gray-900 placeholder-gray-400 shadow-sm`
                  )}
                  placeholder="请输入验证码"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  enterKeyHint="done"
                  required
                />
              </motion.div>
              <motion.button
                type="button"
                onClick={handleSendCode}
                disabled={isSendingCode || countdown > 0}
                className={cn(
                  "px-2 sm:px-3 py-2.5 sm:py-3 rounded-xl transition-all duration-300 font-medium whitespace-nowrap text-xs sm:text-sm",
                  isSendingCode || countdown > 0
                    ? (isDark ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                    : (isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-sm')
                )}
                whileHover={!isSendingCode && countdown === 0 ? { scale: 1.05 } : {}}
                whileTap={!isSendingCode && countdown === 0 ? { scale: 0.95 } : {}}
              >
                {isSendingCode ? (
                  <div className="flex items-center">
                    <i className="fas fa-spinner fa-spin mr-1"></i>
                    发送中...
                  </div>
                ) : countdown > 0 ? `${countdown}秒后重发` : '获取验证码'}
              </motion.button>
            </div>
          </div>
          
          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white font-medium py-2.5 sm:py-3 px-4 rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center text-sm sm:text-base"
            variants={buttonVariants}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                登录中...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt mr-2"></i>
                登录
              </>
            )}
          </motion.button>
        </motion.form>
        
        <motion.div
          className="mt-4 sm:mt-6 text-center"
          variants={itemVariants}
        >
          <div className="bg-gradient-to-r from-red-50 to-purple-50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl p-2 sm:p-3 shadow-sm">
            <p className="text-gray-700 dark:text-gray-300 text-xs flex items-center justify-center">
              <i className="fas fa-lightbulb text-yellow-500 mr-1"></i>
              首次登录？直接输入邮箱即可，系统会自动为您创建账号
            </p>
          </div>
        </motion.div>
        
        <motion.div
          className="mt-6 sm:mt-8"
          variants={itemVariants}
        >
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <div className={`flex-1 h-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            <span className="px-4 text-xs opacity-60">或使用以下方式登录</span>
            <div className={`flex-1 h-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {oauthProviders.map((item) => (
              <motion.button
                key={item.name}
                className={`h-10 sm:h-12 rounded-xl ${item.color} flex flex-col items-center justify-center text-white transition-all duration-300 shadow-md ${!configuredProviders.has(item.name) ? 'opacity-60' : ''}`}
                whileHover={{ scale: 1.08, y: -2, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)' }}
                whileTap={{ scale: 0.95 }}
                aria-label={`使用${item.label}登录`}
                onClick={async () => {
                  if (!configuredProviders.has(item.name)) {
                    toast.error(`${item.label} 登录暂未开放`)
                    return
                  }
                  const ok = await quickLogin(item.name as any)
                  if (!ok) {
                    toast.error(`${item.label} 登录失败，请稍后重试`)
                  }
                }}
              >
                <i className={`fab ${item.icon} text-base sm:text-lg`}></i>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
