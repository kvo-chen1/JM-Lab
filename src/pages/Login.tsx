import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Login() {
  const { toggleTheme, isDark } = useTheme();
  const { login, isAuthenticated, quickLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // 表单验证状态
  const [errors, setErrors] = useState({ email: '', password: '' });
  // 输入框焦点状态
  const [focused, setFocused] = useState({ email: false, password: false });
  
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
    if (value.length < 6) return '密码长度不能少于6位';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      toast.error('请检查输入信息');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        toast.success('登录成功！');
        navigate('/');
      } else {
        toast.error('邮箱或密码错误，请重试');
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
        
        <motion.form 
          onSubmit={handleSubmit}
          className="space-y-6"
          variants={itemVariants}
        >
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
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="block text-sm font-medium">密码</label>
              <a href="#" className="text-sm text-red-600 hover:text-red-700 transition-colors">忘记密码？</a>
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
            {[
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
                  const ok = await quickLogin(item.name as any)
                  if (ok) {
                    toast.success('登录成功！')
                    navigate('/')
                  }
                }}
              >
                <i className={`fab ${item.icon} text-xl`}></i>
              </motion.button>
            ))}
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
