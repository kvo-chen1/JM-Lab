import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ForgotPassword() {
  const { toggleTheme, isDark } = useTheme();
  const { sendEmailOtp, resetPassword, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // 验证状态
  const [errors, setErrors] = useState({ email: '', code: '', password: '' });
  const [focused, setFocused] = useState({ email: false, code: false, password: false });

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
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // 验证函数
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

  const validatePassword = (value: string) => {
    if (!value) return '请输入新密码';
    if (value.length < 8) return '密码至少8位';
    return '';
  };

  // 发送验证码
  const handleSendCode = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors(prev => ({ ...prev, email: emailError }));
      return;
    }

    setIsSendingCode(true);
    try {
      const result = await sendEmailOtp(email);
      if (result.success) {
        toast.success('验证码已发送，请查收邮件', {
          description: result.mockCode ? `测试环境验证码: ${result.mockCode}` : undefined
        });
        setCountdown(60);
      } else {
        toast.error(result.error || '发送失败，请稍后重试');
      }
    } catch (error) {
      toast.error('发送失败，请稍后重试');
    } finally {
      setIsSendingCode(false);
    }
  };

  // 提交重置
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailError = validateEmail(email);
    const codeError = validateCode(code);
    const passwordError = validatePassword(newPassword);

    if (emailError || codeError || passwordError) {
      setErrors({ email: emailError, code: codeError, password: passwordError });
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(email, code, newPassword);
      if (result.success) {
        toast.success('密码重置成功，请使用新密码登录');
        navigate('/login');
      } else {
        toast.error(result.error || '重置失败，请检查验证码');
      }
    } catch (error) {
      toast.error('重置失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
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
          <Link to="/login" className="flex items-center space-x-1 hover:opacity-80 transition-opacity">
            <i className="fas fa-arrow-left mr-2"></i>
            <span>返回登录</span>
          </Link>
          
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full ${isDark ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-700'} transition-colors`}
          >
            {isDark ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
          </button>
        </div>
        
        <motion.h1 className="text-2xl font-bold mb-2" variants={itemVariants}>
          重置密码
        </motion.h1>
        
        <motion.p className="mb-8 opacity-70" variants={itemVariants}>
          请输入您的注册邮箱，我们将发送验证码以重置密码
        </motion.p>
        
        <motion.form onSubmit={handleSubmit} className="space-y-6" variants={itemVariants}>
          {/* 邮箱 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="email" className="block text-sm font-medium">邮箱</label>
              {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
            </div>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors(prev => ({ ...prev, email: validateEmail(e.target.value) }));
              }}
              onFocus={() => setFocused(prev => ({ ...prev, email: true }))}
              onBlur={() => setFocused(prev => ({ ...prev, email: false }))}
              className={cn(
                "w-full px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors",
                isDark 
                  ? `bg-gray-700 border ${errors.email ? 'border-red-500' : focused.email ? 'border-red-500' : 'border-gray-600'} text-white` 
                  : `bg-gray-50 border ${errors.email ? 'border-red-500' : focused.email ? 'border-red-500' : 'border-gray-200'} text-gray-900`
              )}
              placeholder="请输入您的邮箱"
            />
          </div>

          {/* 验证码 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="code" className="block text-sm font-medium">验证码</label>
              {errors.code && <span className="text-xs text-red-500">{errors.code}</span>}
            </div>
            <div className="flex space-x-3">
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setErrors(prev => ({ ...prev, code: validateCode(e.target.value) }));
                }}
                onFocus={() => setFocused(prev => ({ ...prev, code: true }))}
                onBlur={() => setFocused(prev => ({ ...prev, code: false }))}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors",
                  isDark 
                    ? `bg-gray-700 border ${errors.code ? 'border-red-500' : focused.code ? 'border-red-500' : 'border-gray-600'} text-white` 
                    : `bg-gray-50 border ${errors.code ? 'border-red-500' : focused.code ? 'border-red-500' : 'border-gray-200'} text-gray-900`
                )}
                placeholder="6位验证码"
                maxLength={6}
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isSendingCode || countdown > 0}
                className={`px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${isSendingCode || countdown > 0 ? (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-400') : (isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')}`}
              >
                {isSendingCode ? '发送中...' : countdown > 0 ? `${countdown}秒` : '获取验证码'}
              </button>
            </div>
          </div>

          {/* 新密码 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="newPassword" className="block text-sm font-medium">新密码</label>
              {errors.password && <span className="text-xs text-red-500">{errors.password}</span>}
            </div>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrors(prev => ({ ...prev, password: validatePassword(e.target.value) }));
              }}
              onFocus={() => setFocused(prev => ({ ...prev, password: true }))}
              onBlur={() => setFocused(prev => ({ ...prev, password: false }))}
              className={cn(
                "w-full px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors",
                isDark 
                  ? `bg-gray-700 border ${errors.password ? 'border-red-500' : focused.password ? 'border-red-500' : 'border-gray-600'} text-white` 
                  : `bg-gray-50 border ${errors.password ? 'border-red-500' : focused.password ? 'border-red-500' : 'border-gray-200'} text-gray-900`
              )}
              placeholder="请设置新密码（至少8位）"
            />
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
                提交中...
              </>
            ) : (
              '重置密码'
            )}
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  );
}