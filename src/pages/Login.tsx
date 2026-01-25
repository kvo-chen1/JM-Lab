import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Login() {
  const { toggleTheme, isDark } = useTheme();
  const { login, loginWithCode, sendEmailOtp, sendSmsOtp, isAuthenticated, quickLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // 登录方式：email - 邮箱登录，phone - 手机号验证码登录
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  // 邮箱登录类型：password - 密码登录，code - 验证码登录
  const [emailLoginType, setEmailLoginType] = useState<'password' | 'code'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  // 表单验证状态
  interface ErrorsState {
    email: string;
    password: string;
    phone: string;
    code: string;
  }
  const [errors, setErrors] = useState<ErrorsState>({ email: '', password: '', phone: '', code: '' });
  // 输入框焦点状态
  interface FocusedState {
    email: boolean;
    password: boolean;
    phone: boolean;
    code: boolean;
  }
  const [focused, setFocused] = useState<FocusedState>({ email: false, password: false, phone: false, code: false });
  
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
  
  // 发送验证码（支持手机号和邮箱）
  const handleSendCode = async (type: 'phone' | 'email') => {
    // 验证输入
    if (type === 'phone') {
      if (!phone || errors.phone) {
        setErrors(prev => ({ ...prev, phone: '请输入有效的手机号' }));
        return;
      }
    } else {
      if (!email || errors.email) {
        setErrors(prev => ({ ...prev, email: '请输入有效的邮箱' }));
        return;
      }
    }
    
    setIsSendingCode(true);
    try {
      if (type === 'email') {
        // 使用Supabase内置的邮箱验证码发送功能
        const result = await sendEmailOtp(email);
        if (result.success) {
          toast.success('邮箱验证码发送成功，请注意查收');
          setCountdown(60); // 60秒倒计时
        } else {
          toast.error(result.error || '邮箱验证码发送失败');
        }
      } else {
        // 使用后端API发送手机验证码
        const result = await sendSmsOtp(phone);
        if (result.success) {
          if (result.mockCode) {
            toast.success(`短信验证码发送成功: ${result.mockCode}`);
          } else {
            toast.success('短信验证码发送成功');
          }
          setCountdown(60); // 60秒倒计时
        } else {
          toast.error(result.error || '短信验证码发送失败');
        }
      }
    } catch (error) {
      toast.error(`${type === 'phone' ? '短信' : '邮箱'}验证码发送失败，请稍后重试`);
    } finally {
      setIsSendingCode(false);
    }
  };
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate])
  
  // 实时表单验证
  const validateEmail = (value: string) => {
    if (!value) return '请输入邮箱';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return '请输入有效的邮箱地址';
    return '';
  };

  const validatePassword = (value: string) => {
    if (!value) return '请输入密码';
    return '';
  };

  const validatePhone = (value: string) => {
    if (!value) return '请输入手机号';
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(value)) return '请输入有效的手机号';
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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setErrors(prev => ({ ...prev, password: validatePassword(value) }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);
    setErrors(prev => ({ ...prev, phone: validatePhone(value) }));
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCode(value);
    setErrors(prev => ({ ...prev, code: validateCode(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginMethod === 'email') {
      // 邮箱登录验证
      const emailError = validateEmail(email);
      let passwordError = '';
      let codeError = '';
      
      if (emailLoginType === 'password') {
        // 密码登录验证
        passwordError = validatePassword(password);
      } else {
        // 验证码登录验证
        codeError = validateCode(code);
      }
      
      if (emailError || passwordError || codeError) {
        setErrors(prev => ({ 
          ...prev, 
          email: emailError, 
          password: passwordError, 
          code: codeError 
        }));
        toast.error('请检查输入信息');
        return;
      }
      
      setIsLoading(true);
      
      try {
        if (emailLoginType === 'password') {
          // 邮箱密码登录
          const success = await login(email, password);
          
          if (success) {
            toast.success('登录成功！');
            navigate('/');
          } else {
            toast.error('邮箱或密码错误，请重试');
          }
        } else {
          // 邮箱验证码登录
          const success = await loginWithCode('email', email, code);
          
          if (success) {
            toast.success('登录成功！');
            navigate('/');
          } else {
            toast.error('邮箱或验证码错误，请重试');
          }
        }
      } catch (error) {
        toast.error('登录失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    } else {
      // 手机号验证码登录验证
      const phoneError = validatePhone(phone);
      const codeError = validateCode(code);
      
      if (phoneError || codeError) {
        setErrors(prev => ({ ...prev, phone: phoneError, code: codeError }));
        toast.error('请检查输入信息');
        return;
      }
      
      setIsLoading(true);
      
      try {
        // 手机号验证码登录
        const success = await loginWithCode('phone', phone, code);
        
        if (success) {
          toast.success('登录成功！');
          navigate('/');
        } else {
          toast.error('手机号或验证码错误，请重试');
        }
      } catch (error) {
        toast.error('登录失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };
  
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-red-600 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-600 opacity-10 rounded-full blur-3xl"></div>
      </div>
      
      <motion.div 
        className={`relative z-10 w-full max-w-md ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-8 border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-1">
            <span className="text-xl font-bold text-red-600">AI</span>
            <span className="text-xl font-bold">共创</span>
          </div>
          
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full ${isDark ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-700'} transition-colors`}
            aria-label="切换主题"
          >
            {isDark ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
          </button>
        </div>
        
        <motion.h1 
          className="text-2xl font-bold mb-6"
          variants={itemVariants}
        >
          欢迎回来
        </motion.h1>
        
        <motion.p 
          className="mb-8 opacity-70"
          variants={itemVariants}
        >
          登录您的AI共创平台账号，继续您的创作之旅
        </motion.p>
        
        {/* 登录方式切换 */}
        <div className="mb-6">
          <div className={`flex rounded-xl overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 px-4 transition-colors ${loginMethod === 'email' ? 'bg-red-600 text-white' : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              邮箱登录
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-2 px-4 transition-colors ${loginMethod === 'phone' ? 'bg-red-600 text-white' : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              手机号验证码
            </button>
          </div>
        </div>
        
        <motion.form 
          onSubmit={handleSubmit}
          className="space-y-6"
          variants={itemVariants}
        >
          {/* 邮箱登录表单 */}
          {loginMethod === 'email' ? (
            <>
              {/* 邮箱输入 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="email" className="block text-sm font-medium">邮箱</label>
                  {errors.email && (
                    <span className="text-xs text-red-500">{errors.email}</span>
                  )}
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={handleEmailChange}
                  onFocus={() => setFocused(prev => ({ ...prev, email: true }))}
                  onBlur={() => setFocused(prev => ({ ...prev, email: false }))}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors",
                    isDark 
                      ? `bg-gray-700 border ${errors.email ? 'border-red-500' : focused.email ? 'border-red-500' : 'border-gray-600'} text-white placeholder-gray-400` 
                      : `bg-gray-50 border ${errors.email ? 'border-red-500' : focused.email ? 'border-red-500' : 'border-gray-200'} text-gray-900 placeholder-gray-400`
                  )}
                  placeholder="请输入您的邮箱"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  enterKeyHint="next"
                  required
                />
              </div>
              
              {/* 邮箱登录类型切换 */}
              <div className={`flex rounded-lg overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => setEmailLoginType('password')}
                  className={`flex-1 py-1.5 px-4 text-sm transition-colors ${emailLoginType === 'password' ? 'bg-red-600 text-white' : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  密码登录
                </button>
                <button
                  type="button"
                  onClick={() => setEmailLoginType('code')}
                  className={`flex-1 py-1.5 px-4 text-sm transition-colors ${emailLoginType === 'code' ? 'bg-red-600 text-white' : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  验证码登录
                </button>
              </div>
              
              {/* 根据邮箱登录类型显示不同字段 */}
              {emailLoginType === 'password' ? (
                /* 密码登录 */
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="password" className="block text-sm font-medium">密码</label>
                    <Link to="/forgot-password" className="text-sm text-red-600 hover:text-red-700 transition-colors">忘记密码？</Link>
                  </div>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={handlePasswordChange}
                    onFocus={() => setFocused(prev => ({ ...prev, password: true }))}
                    onBlur={() => setFocused(prev => ({ ...prev, password: false }))}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors",
                      isDark 
                        ? `bg-gray-700 border ${errors.password ? 'border-red-500' : focused.password ? 'border-red-500' : 'border-gray-600'} text-white placeholder-gray-400` 
                        : `bg-gray-50 border ${errors.password ? 'border-red-500' : focused.password ? 'border-red-500' : 'border-gray-200'} text-gray-900 placeholder-gray-400`
                    )}
                    placeholder="请输入您的密码"
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    enterKeyHint="done"
                    required
                  />
                  {errors.password && (
                    <span className="text-xs text-red-500 mt-1 block">{errors.password}</span>
                  )}
                </div>
              ) : (
                /* 验证码登录 */
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="code" className="block text-sm font-medium">验证码</label>
                    {errors.code && (
                      <span className="text-xs text-red-500">{errors.code}</span>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      id="code"
                      value={code}
                      onChange={handleCodeChange}
                      onFocus={() => setFocused(prev => ({ ...prev, code: true }))}
                      onBlur={() => setFocused(prev => ({ ...prev, code: false }))}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors",
                        isDark 
                          ? `bg-gray-700 border ${errors.code ? 'border-red-500' : focused.code ? 'border-red-500' : 'border-gray-600'} text-white placeholder-gray-400` 
                          : `bg-gray-50 border ${errors.code ? 'border-red-500' : focused.code ? 'border-red-500' : 'border-gray-200'} text-gray-900 placeholder-gray-400`
                      )}
                      placeholder="请输入验证码"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      enterKeyHint="done"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleSendCode('email')}
                      disabled={isSendingCode || countdown > 0}
                      className={`px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${isSendingCode || countdown > 0 ? (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-400') : (isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')}`}
                    >
                      {isSendingCode ? '发送中...' : countdown > 0 ? `${countdown}秒后重发` : '获取验证码'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* 手机号验证码登录表单 */
            <>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="phone" className="block text-sm font-medium">手机号</label>
                  {errors.phone && (
                    <span className="text-xs text-red-500">{errors.phone}</span>
                  )}
                </div>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  onFocus={() => setFocused(prev => ({ ...prev, phone: true }))}
                  onBlur={() => setFocused(prev => ({ ...prev, phone: false }))}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors",
                    isDark 
                      ? `bg-gray-700 border ${errors.phone ? 'border-red-500' : focused.phone ? 'border-red-500' : 'border-gray-600'} text-white placeholder-gray-400` 
                      : `bg-gray-50 border ${errors.phone ? 'border-red-500' : focused.phone ? 'border-red-500' : 'border-gray-200'} text-gray-900 placeholder-gray-400`
                  )}
                  placeholder="请输入您的手机号"
                  autoComplete="tel"
                  inputMode="tel"
                  autoCapitalize="none"
                  autoCorrect="off"
                  enterKeyHint="next"
                  required
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="code" className="block text-sm font-medium">验证码</label>
                  {errors.code && (
                    <span className="text-xs text-red-500">{errors.code}</span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    id="code"
                    value={code}
                    onChange={handleCodeChange}
                    onFocus={() => setFocused(prev => ({ ...prev, code: true }))}
                    onBlur={() => setFocused(prev => ({ ...prev, code: false }))}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors",
                      isDark 
                        ? `bg-gray-700 border ${errors.code ? 'border-red-500' : focused.code ? 'border-red-500' : 'border-gray-600'} text-white placeholder-gray-400` 
                        : `bg-gray-50 border ${errors.code ? 'border-red-500' : focused.code ? 'border-red-500' : 'border-gray-200'} text-gray-900 placeholder-gray-400`
                    )}
                    placeholder="请输入验证码"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    enterKeyHint="done"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleSendCode('phone')}
                    disabled={isSendingCode || countdown > 0}
                    className={`px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${isSendingCode || countdown > 0 ? (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-400') : (isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')}`}
                  >
                    {isSendingCode ? '发送中...' : countdown > 0 ? `${countdown}秒后重发` : '获取验证码'}
                  </button>
                </div>
              </div>
            </>
          )}
          
          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                登录中...
              </>
            ) : (
              '登录'
            )}
          </motion.button>
        </motion.form>
        
        <motion.div 
          className="mt-8 text-center"
          variants={itemVariants}
        >
          <p className="opacity-70">
            还没有账号？{' '}
            <Link to="/register" className="text-red-600 hover:text-red-700 font-medium transition-colors">
              立即注册
            </Link>
          </p>
        </motion.div>
        
        <motion.div 
          className="mt-12"
          variants={itemVariants}
        >
          <div className="flex items-center justify-center mb-6">
            <div className={`flex-1 h-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            <span className="px-4 text-sm opacity-60">或使用以下方式登录</span>
            <div className={`flex-1 h-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {
              [
                { name: 'github', color: 'bg-gray-800', icon: 'fa-github' },
                { name: 'google', color: 'bg-red-500', icon: 'fa-google' },
                { name: 'twitter', color: 'bg-blue-400', icon: 'fa-twitter' },
                { name: 'discord', color: 'bg-indigo-600', icon: 'fa-discord' },
                { name: 'wechat', color: 'bg-green-500', icon: 'fa-weixin' },
                { name: 'alipay', color: 'bg-blue-500', icon: 'fa-alipay' },
                { name: 'qq', color: 'bg-blue-400', icon: 'fa-qq' },
                { name: 'weibo', color: 'bg-red-500', icon: 'fa-weibo' },
              ].map((item) => (
                <motion.button
                  key={item.name}
                  className={`h-14 sm:h-12 rounded-xl ${item.color} flex items-center justify-center text-white transition-transform min-h-[44px]`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={`使用${item.name}登录`}
                  onClick={async () => {
                    // 所有第三方登录都使用 quickLogin（包括GitHub）
                    const ok = await quickLogin(item.name as any)
                    if (!ok) {
                      toast.error(`${item.name} 登录暂未开放`)
                    }
                  }}
                >
                  <i className={`fab ${item.icon} text-xl`}></i>
                </motion.button>
              ))
            }
          </div>
          <div className="mt-4">
            <button 
              onClick={async () => {
                const ok = await quickLogin('phone')
                if (ok) {
                  toast.success('手机号一键登录成功！')
                  navigate('/')
                }
              }}
              className={`w-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors`}
            >
              手机号一键登录
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
