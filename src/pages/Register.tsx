import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import PrivacyModal from '@/components/PrivacyModal';
import InterestTagsSelector from '@/components/InterestTagsSelector';

// 注册表单验证模式
const registerSchema = z.object({
  username: z.string()
    .min(2, { message: '用户名至少需要2个字符' })
    .max(20, { message: '用户名最多20个字符' }),
  email: z.string()
    .email({ message: '请输入有效的邮箱地址' }),
  phone: z.string()
    .regex(/^1[3-9]\d{9}$/, { message: '请输入有效的手机号' })
    .optional(),
  password: z.string()
    .min(8, { message: '密码至少需要8个字符' })
    .regex(/[a-zA-Z]/, { message: '密码需要包含至少一个字母' })
    .regex(/[0-9]/, { message: '密码需要包含至少一个数字' }),
  code: z.string()
    .regex(/^\d{6}$/, { message: '验证码长度为6位数字' })
    .optional(),
  age: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export default function Register() {
  const { theme, toggleTheme, isDark } = useTheme();
  const { register, isAuthenticated, sendRegisterEmailOtp, sendSmsOtp } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // 注册方式：email - 邮箱注册，phone - 手机号验证码注册
  const [registerMethod, setRegisterMethod] = useState<'email' | 'phone'>('email');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [emailCode, setEmailCode] = useState(''); // 单独为邮箱添加验证码状态
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailCountdown, setEmailCountdown] = useState(0); // 单独为邮箱添加倒计时
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [age, setAge] = useState('');
  const [tags, setTags] = useState<string[]>(['国潮爱好者']);
  
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

  // 邮箱验证码倒计时
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (emailCountdown > 0) {
      timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [emailCountdown]);
  
  // 如果已登录，直接跳转到首页
  if (isAuthenticated) {
    navigate('/');
  }
  
  // 发送短信验证码
  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setErrors(prev => ({ ...prev, phone: '请输入有效的手机号' }));
      return;
    }
    
    setIsSendingCode(true);
    try {
      // 调用发送验证码API (使用注册专用接口)
      const response = await fetch('/api/auth/send-register-sms-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });
      
      const data = await response.json();
      if (data.code === 0) {
        if (data.data?.mockCode) {
          toast.success(`验证码发送成功: ${data.data.mockCode}`);
        } else {
          toast.success('验证码发送成功');
        }
        setCountdown(60); // 60秒倒计时
      } else {
        toast.error(data.message || '验证码发送失败');
      }
    } catch (error) {
      toast.error('验证码发送失败，请稍后重试');
    } finally {
      setIsSendingCode(false);
    }
  };

  // 发送邮箱验证码
  const handleSendEmailCode = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors(prev => ({ ...prev, email: '请输入有效的邮箱地址' }));
      return;
    }
    
    setIsSendingCode(true);
    try {
      // 调用发送注册验证码API
      const result = await sendRegisterEmailOtp(email);
      
      if (result.success) {
        if (result.mockCode) {
          toast.success(`验证码发送成功: ${result.mockCode}`);
        } else {
          toast.success('验证码发送成功，请查收邮件');
        }
        setEmailCountdown(60); // 60秒倒计时
      } else {
        toast.error(result.error || '验证码发送失败');
      }
    } catch (error) {
      toast.error('验证码发送失败，请稍后重试');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('1. handleSubmit called');
    e.preventDefault();
    
    // 表单验证
    try {
      console.log('2. Validating form');
      
      // 根据注册方式创建不同的验证规则
      let validationResult;
      if (registerMethod === 'email') {
        // 邮箱注册验证规则
        const emailRegisterSchema = z.object({
          username: z.string()
            .min(2, { message: '用户名至少需要2个字符' })
            .max(20, { message: '用户名最多20个字符' }),
          email: z.string()
            .email({ message: '请输入有效的邮箱地址' }),
          password: z.string()
            .min(8, { message: '密码至少需要8个字符' })
            .regex(/[a-zA-Z]/, { message: '密码需要包含至少一个字母' })
            .regex(/[0-9]/, { message: '密码需要包含至少一个数字' }),
          code: z.string()
            .regex(/^\d{6}$/, { message: '验证码长度为6位数字' }),
          age: z.string().optional(),
          tags: z.array(z.string()).optional(),
        });
        validationResult = emailRegisterSchema.safeParse({ username, email, password, code: emailCode, age, tags });
      } else {
        // 手机号注册验证规则
        const phoneRegisterSchema = z.object({
          username: z.string()
            .min(2, { message: '用户名至少需要2个字符' })
            .max(20, { message: '用户名最多20个字符' }),
          phone: z.string()
            .regex(/^1[3-9]\d{9}$/, { message: '请输入有效的手机号' }),
          code: z.string()
            .regex(/^\d{6}$/, { message: '验证码长度为6位数字' }),
          age: z.string().optional(),
          tags: z.array(z.string()).optional(),
        });
        validationResult = phoneRegisterSchema.safeParse({ username, phone, code, age, tags });
      }
      
      if (!validationResult.success) {
        console.error('4. Form validation failed:', validationResult.error);
        const newErrors: Record<string, string> = {};
        validationResult.error.issues.forEach(issue => {
          newErrors[issue.path[0]] = issue.message;
        });
        setErrors(newErrors);
        return;
      }
      
      console.log('3. Form validation passed');
      setErrors({});
    } catch (err) {
      console.error('4. Form validation failed:', err);
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.issues.forEach(issue => {
          newErrors[issue.path[0]] = issue.message;
        });
        setErrors(newErrors);
      }
      return;
    }
    
    console.log('5. Setting isLoading to true');
    setIsLoading(true);
    
    try {
      console.log('6. Calling register function with:', { username, email: registerMethod === 'email' ? email : undefined, phone: registerMethod === 'phone' ? phone : undefined, password: registerMethod === 'email' ? '****' : undefined, code: registerMethod === 'phone' ? code : emailCode, age, tags });
      
      // 调用不同的注册API根据注册方式
      let result;
      if (registerMethod === 'email') {
        result = await register(username, email, password, age, tags, emailCode);
      } else {
        // 手机号验证码注册
        const response = await fetch('/api/auth/register-phone', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, phone, code, age, tags }),
        });
        
        result = await response.json();
      }
      
      console.log('8. Register function returned:', result);
      
      if (result.success || result.code === 0) {
        if (registerMethod === 'email') {
          // 如果注册方法已经自动登录了（通过token），直接跳转
          // 我们需要短暂延迟检查isAuthenticated，或者直接假设如果后端返回成功且不是纯验证码模式
          // 由于React状态更新是异步的，这里isAuthenticated可能还没变
          // 最好是看result是否包含token或者通过navigate直接尝试跳转
          toast.success('注册成功！');
          // 强制刷新一下或者直接跳转，AuthContext会处理状态
          navigate('/');
        } else {
          toast.success('注册成功！自动登录中...');
          // 手机号注册成功后直接登录
          if (result.data?.token && result.data?.refreshToken) {
            localStorage.setItem('token', result.data.token);
            localStorage.setItem('refreshToken', result.data.refreshToken);
            window.location.reload();
          } else {
            navigate('/login');
          }
        }
      } else {
        const errorMessage = result.error || result.message || '注册失败，请检查输入信息或稍后重试';
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('8. Register failed with error:', error);
      console.error('8.1 Error message:', error.message);
      console.error('8.2 Error stack:', error.stack);
      
      // 提供更详细的错误信息给用户
      const errorMessage = error.message || '注册失败，请稍后重试';
      toast.error(`注册失败: ${errorMessage}`);
    } finally {
      console.log('9. Setting isLoading to false');
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
          创建新账号
        </motion.h1>
        
        <motion.p 
          className="mb-8 opacity-70"
          variants={itemVariants}
        >
          加入AI共创平台，开启您的创意之旅
        </motion.p>
        
        {/* 注册方式切换 */}
        <div className="mb-6">
          <div className="flex rounded-xl overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'}">
            <button
              type="button"
              onClick={() => setRegisterMethod('email')}
              className={`flex-1 py-2 px-4 transition-colors ${registerMethod === 'email' ? 'bg-red-600 text-white' : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              邮箱注册
            </button>
            <button
              type="button"
              onClick={() => setRegisterMethod('phone')}
              className={`flex-1 py-2 px-4 transition-colors ${registerMethod === 'phone' ? 'bg-red-600 text-white' : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              手机号注册
            </button>
          </div>
        </div>

        <motion.form 
          onSubmit={handleSubmit}
          className="space-y-6"
          variants={itemVariants}
        >
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">用户名</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={cn(
                "w-full px-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-2",
                errors.username 
                  ? "border-red-500 focus:ring-red-500" 
                  : isDark 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 border focus:ring-red-500" 
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border focus:ring-red-500"
              )}
              placeholder="请输入您的用户名"
              required
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-500">{errors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-medium mb-2">年龄</label>
            <input
              type="number"
              id="age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className={cn(
                "w-full px-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-2",
                isDark 
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 border focus:ring-red-500" 
                  : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border focus:ring-red-500"
              )}
              placeholder="请输入您的年龄"
            />
          </div>

          <InterestTagsSelector value={tags} onChange={setTags} />
          
          {/* 邮箱注册表单字段 */}
          {registerMethod === 'email' ? (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">邮箱</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-2",
                    errors.email 
                      ? "border-red-500 focus:ring-red-500" 
                      : isDark 
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 border focus:ring-red-500" 
                        : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border focus:ring-red-500"
                  )}
                  placeholder="请输入您的邮箱"
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="emailCode" className="block text-sm font-medium mb-2">验证码</label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    id="emailCode"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-2",
                      errors.code 
                        ? "border-red-500 focus:ring-red-500" 
                        : isDark 
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 border focus:ring-red-500" 
                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border focus:ring-red-500"
                    )}
                    placeholder="请输入邮箱验证码"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSendEmailCode}
                    disabled={isSendingCode || emailCountdown > 0}
                    className={`px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${isSendingCode || emailCountdown > 0 ? (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-400') : (isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')}`}
                  >
                    {isSendingCode ? '发送中...' : emailCountdown > 0 ? `${emailCountdown}秒后重发` : '获取验证码'}
                  </button>
                </div>
                {errors.code && (
                  <p className="mt-1 text-sm text-red-500">{errors.code}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">密码</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-2",
                    errors.password 
                      ? "border-red-500 focus:ring-red-500" 
                      : isDark 
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 border focus:ring-red-500" 
                        : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border focus:ring-red-500"
                  )}
                  placeholder="请设置您的密码"
                  required
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
                <p className="mt-1 text-xs opacity-60">密码至少8个字符，包含至少一个字母和一个数字</p>
              </div>
            </>
          ) : (
            /* 手机号注册表单字段 */
            <>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">手机号</label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-2",
                    errors.phone 
                      ? "border-red-500 focus:ring-red-500" 
                      : isDark 
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 border focus:ring-red-500" 
                        : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border focus:ring-red-500"
                  )}
                  placeholder="请输入您的手机号"
                  required
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="code" className="block text-sm font-medium mb-2">验证码</label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-2",
                      errors.code 
                        ? "border-red-500 focus:ring-red-500" 
                        : isDark 
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 border focus:ring-red-500" 
                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border focus:ring-red-500"
                    )}
                    placeholder="请输入验证码"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={isSendingCode || countdown > 0}
                    className={`px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${isSendingCode || countdown > 0 ? (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-400') : (isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')}`}
                  >
                    {isSendingCode ? '发送中...' : countdown > 0 ? `${countdown}秒后重发` : '获取验证码'}
                  </button>
                </div>
                {errors.code && (
                  <p className="mt-1 text-sm text-red-500">{errors.code}</p>
                )}
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
                注册中...
              </>
            ) : (
              '注册'
            )}
          </motion.button>
        </motion.form>
        
        <motion.div 
          className="mt-8 text-center"
          variants={itemVariants}
        >
          <p className="opacity-70">
            已有账号？{' '}
            <Link to="/login" className="text-red-600 hover:text-red-700 font-medium transition-colors">
              立即登录
            </Link>
          </p>
        </motion.div>
        
        <motion.div 
          className="mt-8 text-center text-xs opacity-60"
          variants={itemVariants}
        >
          点击"注册"，即表示您同意我们的服务条款和隐私政策
        </motion.div>

        <PrivacyModal 
          open={showPrivacy}
          onAccept={() => setShowPrivacy(false)}
          onClose={() => setShowPrivacy(false)}
        />
      </motion.div>
    </div>
  );
}
