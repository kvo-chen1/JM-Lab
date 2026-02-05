import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CompleteProfile() {
  const { isDark } = useTheme();
  const { user, updateUser, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    avatar: user?.avatar || '',
    phone: user?.phone || '',
    gender: '',
    interests: [] as string[],
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [errors, setErrors] = useState({
    username: '',
    avatar: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 检查用户是否已认证，未认证则重定向到登录页
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user) {
      // 检查用户信息是否完整
      const isProfileComplete = user.username && user.username.trim() !== '' && 
                               user.avatar && user.avatar.trim() !== '';
      
      // 如果用户信息完整，重定向到主页
      if (isProfileComplete) {
        navigate('/');
      }
    }
  }, [isAuthenticated, user, navigate]);
  
  // 兴趣标签选项
  const interestOptions = [
    'AI创作', '设计', '摄影', '音乐', '写作', '绘画', '编程', '游戏',
    '电影', '旅行', '美食', '运动', '科技', '艺术', '时尚'
  ];
  
  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 实时验证
    validateField(name, value);
  };
  
  // 处理兴趣标签选择
  const handleInterestToggle = (interest: string) => {
    setFormData(prev => {
      const isSelected = prev.interests.includes(interest);
      if (isSelected) {
        return { ...prev, interests: prev.interests.filter(item => item !== interest) };
      } else {
        return { ...prev, interests: [...prev.interests, interest] };
      }
    });
  };
  
  // 处理头像上传
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, avatar: '请上传图片文件' }));
        return;
      }
      
      // 检查文件大小（5MB限制）
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, avatar: '图片大小不能超过5MB' }));
        return;
      }
      
      // 预览图片
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        setAvatarPreview(preview);
        setFormData(prev => ({ ...prev, avatar: preview }));
        setErrors(prev => ({ ...prev, avatar: '' }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 处理头像选择（预设头像）
  const handleAvatarSelect = (avatarUrl: string) => {
    setAvatarPreview(avatarUrl);
    setFormData(prev => ({ ...prev, avatar: avatarUrl }));
    setErrors(prev => ({ ...prev, avatar: '' }));
  };
  
  // 预设头像选项
  const presetAvatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=6',
  ];
  
  // 表单验证
  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'username':
        if (!value.trim()) {
          setErrors(prev => ({ ...prev, username: '请输入姓名' }));
        } else if (value.trim().length < 2) {
          setErrors(prev => ({ ...prev, username: '姓名至少2个字符' }));
        } else {
          setErrors(prev => ({ ...prev, username: '' }));
        }
        break;
      case 'phone':
        if (value && !/^1[3-9]\d{9}$/.test(value)) {
          setErrors(prev => ({ ...prev, phone: '请输入有效的手机号' }));
        } else {
          setErrors(prev => ({ ...prev, phone: '' }));
        }
        break;
      default:
        break;
    }
  };
  
  const validateForm = () => {
    const newErrors = {
      username: '',
      avatar: '',
      phone: '',
    };
    
    if (!formData.username.trim()) {
      newErrors.username = '请输入姓名';
    } else if (formData.username.trim().length < 2) {
      newErrors.username = '姓名至少2个字符';
    }
    
    if (!formData.avatar) {
      newErrors.avatar = '请选择或上传头像';
    }
    
    if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = '请输入有效的手机号';
    }
    
    setErrors(newErrors);
    
    return !Object.values(newErrors).some(error => error);
  };
  
  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('请检查输入信息');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 更新用户信息
      updateUser({
        ...formData,
        isNewUser: false, // 标记用户信息已完善
      });

      // 同步更新到 Supabase Auth Metadata，确保后台 Users 列表能看到 Display Name
      if (isAuthenticated && user?.id) {
        // 动态导入 supabase 避免 SSR 问题
        import('@/lib/supabase').then(async ({ supabase }) => {
            // 1. 更新 Auth Metadata
            await supabase.auth.updateUser({
                data: {
                    username: formData.username,
                    avatar: formData.avatar,
                    phone: formData.phone,
                    interests: formData.interests
                }
            });

            // 2. 确保 public.users 表中有此用户数据 (用于外键关联)
            const { error: upsertError } = await supabase
                .from('users')
                .upsert({
                    id: user.id,
                    email: user.email,
                    username: formData.username,
                    name: formData.username,
                    avatar: formData.avatar,
                    phone: formData.phone,
                    interests: formData.interests,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });
                
            if (upsertError) {
                console.error('Failed to sync public.users:', upsertError);
            }
        });
      }
      
      toast.success('信息完善成功！');
      
      // 延迟重定向，确保用户看到成功提示
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      console.error('信息完善失败:', error);
      toast.error('信息完善失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
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
        </div>
        
        <motion.h1 
          className="text-2xl font-bold mb-6"
          variants={itemVariants}
        >
          完善个人信息
        </motion.h1>
        
        <motion.p 
          className="mb-8 opacity-70"
          variants={itemVariants}
        >
          请填写以下信息，完成您的个人资料设置
        </motion.p>
        
        <motion.form 
          onSubmit={handleSubmit}
          className="space-y-6"
          variants={itemVariants}
        >
          {/* 头像上传/选择 */}
          <div>
            <label className="block text-sm font-medium mb-2">头像</label>
            <div className="flex flex-col items-center mb-4">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-red-600 mb-4">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="头像预览" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <i className="fas fa-user text-4xl opacity-50"></i>
                  </div>
                )}
              </div>
              
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <label
                htmlFor="avatar-upload"
                className={`px-4 py-2 rounded-xl cursor-pointer transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <i className="fas fa-upload mr-2"></i>上传头像
              </label>
              
              {errors.avatar && (
                <span className="text-xs text-red-500 mt-1 block">{errors.avatar}</span>
              )}
            </div>
            
            {/* 预设头像选择 */}
            <div>
              <p className="text-sm font-medium mb-2">或选择预设头像</p>
              <div className="grid grid-cols-6 gap-2">
                {presetAvatars.map((avatarUrl, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleAvatarSelect(avatarUrl)}
                    className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${formData.avatar === avatarUrl ? 'border-red-600 scale-110' : isDark ? 'border-gray-600 hover:border-gray-400' : 'border-gray-200 hover:border-gray-400'}`}
                  >
                    <img 
                      src={avatarUrl} 
                      alt={`预设头像 ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* 姓名 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="username" className="block text-sm font-medium">姓名</label>
              {errors.username && (
                <span className="text-xs text-red-500">{errors.username}</span>
              )}
            </div>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={cn(
                "w-full px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors",
                isDark
                  ? `bg-gray-700 border ${errors.username ? 'border-red-500' : 'border-gray-600'} text-white placeholder-gray-400`
                  : `bg-gray-50 border ${errors.username ? 'border-red-500' : 'border-gray-200'} text-gray-900 placeholder-gray-400`
              )}
              placeholder="请输入您的姓名"
              required
            />
          </div>
          
          {/* 手机号 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="phone" className="block text-sm font-medium">手机号（选填）</label>
              {errors.phone && (
                <span className="text-xs text-red-500">{errors.phone}</span>
              )}
            </div>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={cn(
                "w-full px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors",
                isDark
                  ? `bg-gray-700 border ${errors.phone ? 'border-red-500' : 'border-gray-600'} text-white placeholder-gray-400`
                  : `bg-gray-50 border ${errors.phone ? 'border-red-500' : 'border-gray-200'} text-gray-900 placeholder-gray-400`
              )}
              placeholder="请输入您的手机号"
              inputMode="tel"
            />
          </div>
          
          {/* 性别 */}
          <div>
            <label className="block text-sm font-medium mb-2">性别（选填）</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className={cn(
                "w-full px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors",
                isDark
                  ? `bg-gray-700 border border-gray-600 text-white`
                  : `bg-gray-50 border border-gray-200 text-gray-900`
              )}
            >
              <option value="">请选择</option>
              <option value="male">男</option>
              <option value="female">女</option>
              <option value="other">其他</option>
            </select>
          </div>
          
          {/* 兴趣标签 */}
          <div>
            <label className="block text-sm font-medium mb-2">兴趣标签（选填）</label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${formData.interests.includes(interest) 
                    ? 'bg-red-600 text-white' 
                    : isDark 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
          
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                提交中...
              </>
            ) : (
              '提交信息'
            )}
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  );
}
