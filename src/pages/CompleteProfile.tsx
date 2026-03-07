import React, { useState, useContext, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  User,
  Camera,
  Phone,
  Tag,
  Check,
  ChevronRight,
  Sparkles,
  Shield,
  Zap,
  Award,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  Palette,
  Heart,
  Briefcase,
  MapPin,
  Calendar,
  Mail,
  Globe
} from 'lucide-react';

// 表单步骤类型
interface FormStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  fields: string[];
}

// 表单数据类型
interface FormData {
  username: string;
  avatar: string;
  phone: string;
  gender: string;
  interests: string[];
  bio: string;
  location: string;
  birthday: string;
  email: string;
  website: string;
  occupation: string;
}

// 验证错误类型
interface FormErrors {
  [key: string]: string;
}

// 预设头像列表
const PRESET_AVATARS = [
  { id: '1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4', style: '活泼' },
  { id: '2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede', style: '优雅' },
  { id: '3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zack&backgroundColor=ffdfbf', style: '阳光' },
  { id: '4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella&backgroundColor=ffd5dc', style: '甜美' },
  { id: '5', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=d1d4f9', style: '知性' },
  { id: '6', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Molly&backgroundColor=ffdfbf', style: '时尚' },
  { id: '7', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver&backgroundColor=b6e3f4', style: '专业' },
  { id: '8', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie&backgroundColor=c0aede', style: '文艺' },
];

// 兴趣标签选项
const INTEREST_OPTIONS = [
  { id: 'ai', label: 'AI创作', icon: <Sparkles className="w-3 h-3" />, color: 'from-violet-500 to-purple-600' },
  { id: 'design', label: '设计', icon: <Palette className="w-3 h-3" />, color: 'from-pink-500 to-rose-600' },
  { id: 'photo', label: '摄影', icon: <Camera className="w-3 h-3" />, color: 'from-amber-500 to-orange-600' },
  { id: 'music', label: '音乐', icon: <Heart className="w-3 h-3" />, color: 'from-red-500 to-pink-600' },
  { id: 'writing', label: '写作', icon: <Briefcase className="w-3 h-3" />, color: 'from-blue-500 to-cyan-600' },
  { id: 'art', label: '绘画', icon: <Palette className="w-3 h-3" />, color: 'from-emerald-500 to-teal-600' },
  { id: 'coding', label: '编程', icon: <Zap className="w-3 h-3" />, color: 'from-indigo-500 to-blue-600' },
  { id: 'game', label: '游戏', icon: <Sparkles className="w-3 h-3" />, color: 'from-fuchsia-500 to-purple-600' },
  { id: 'movie', label: '电影', icon: <Camera className="w-3 h-3" />, color: 'from-rose-500 to-red-600' },
  { id: 'travel', label: '旅行', icon: <MapPin className="w-3 h-3" />, color: 'from-sky-500 to-blue-600' },
  { id: 'food', label: '美食', icon: <Heart className="w-3 h-3" />, color: 'from-orange-500 to-amber-600' },
  { id: 'sport', label: '运动', icon: <Zap className="w-3 h-3" />, color: 'from-green-500 to-emerald-600' },
  { id: 'tech', label: '科技', icon: <Zap className="w-3 h-3" />, color: 'from-cyan-500 to-blue-600' },
  { id: 'fashion', label: '时尚', icon: <Sparkles className="w-3 h-3" />, color: 'from-pink-500 to-rose-600' },
  { id: 'reading', label: '阅读', icon: <Briefcase className="w-3 h-3" />, color: 'from-amber-500 to-yellow-600' },
];

// 表单步骤配置
const FORM_STEPS: FormStep[] = [
  {
    id: 'basic',
    title: '基本信息',
    description: '完善您的个人资料',
    icon: <User className="w-5 h-5" />,
    fields: ['username', 'avatar', 'gender']
  },
  {
    id: 'contact',
    title: '联系方式',
    description: '添加您的联系信息',
    icon: <Phone className="w-5 h-5" />,
    fields: ['phone', 'email', 'location']
  },
  {
    id: 'profile',
    title: '个人简介',
    description: '展示您的个性',
    icon: <Award className="w-5 h-5" />,
    fields: ['bio', 'occupation', 'website', 'birthday']
  },
  {
    id: 'interests',
    title: '兴趣标签',
    description: '选择您感兴趣的领域',
    icon: <Tag className="w-5 h-5" />,
    fields: ['interests']
  }
];

export default function CompleteProfile() {
  const { isDark } = useTheme();
  const { user, updateUser, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isReEditing = searchParams.get('mode') === 'reedit';

  // 当前步骤状态
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // 表单数据状态 - 从 user 对象预填充所有已有数据
  const [formData, setFormData] = useState<FormData>({
    username: user?.username || '',
    avatar: user?.avatar_url || user?.avatar || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    interests: user?.interests || [],
    bio: user?.bio || '',
    location: user?.location || '',
    birthday: user?.birthday || '',
    email: user?.email || '',
    website: user?.website || '',
    occupation: user?.occupation || ''
  });

  // UI 状态
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar_url || user?.avatar || '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);

  // 当 user 数据加载或变化时，更新表单数据
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username || prev.username || '',
        avatar: user.avatar_url || user.avatar || prev.avatar || '',
        phone: user.phone || prev.phone || '',
        gender: user.gender || prev.gender || '',
        interests: user.interests || prev.interests || [],
        bio: user.bio || prev.bio || '',
        location: user.location || prev.location || '',
        birthday: user.birthday || prev.birthday || '',
        email: user.email || prev.email || '',
        website: user.website || prev.website || '',
        occupation: user.occupation || prev.occupation || ''
      }));
      setAvatarPreview(user.avatar_url || user.avatar || '');
    }
  }, [user]);

  // 检查用户认证状态
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user && !isReEditing) {
      const avatarValue = user.avatar_url || user.avatar;
      const isProfileComplete = user.username &&
        user.username.trim() !== '' &&
        avatarValue &&
        avatarValue.trim() !== '';
      if (isProfileComplete) {
        navigate('/');
      }
    }
  }, [isAuthenticated, user, navigate, isReEditing]);

  // 验证规则
  const validationRules = {
    username: (value: string) => {
      if (!value.trim()) return '请输入姓名';
      if (value.trim().length < 2) return '姓名至少2个字符';
      if (value.trim().length > 20) return '姓名最多20个字符';
      if (!/^[一-龥a-zA-Z0-9_]+$/.test(value)) return '姓名只能包含中文、英文、数字和下划线';
      return '';
    },
    avatar: (value: string) => {
      if (!value) return '请选择或上传头像';
      return '';
    },
    phone: (value: string) => {
      if (value && !/^1[3-9]\d{9}$/.test(value)) return '请输入有效的手机号';
      return '';
    },
    email: (value: string) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '请输入有效的邮箱地址';
      return '';
    },
    website: (value: string) => {
      if (value && !/^https?:\/\/.+/.test(value)) return '网址需要以http://或https://开头';
      return '';
    },
    bio: (value: string) => {
      if (value && value.length > 200) return '个人简介最多200个字符';
      return '';
    }
  };

  // 验证单个字段
  const validateField = useCallback((field: string, value: string) => {
    const validator = validationRules[field as keyof typeof validationRules];
    if (validator) {
      const error = validator(value);
      setErrors(prev => ({ ...prev, [field]: error }));
      return !error;
    }
    return true;
  }, []);

  // 验证当前步骤
  const validateCurrentStep = useCallback(() => {
    const step = FORM_STEPS[currentStep];
    const stepErrors: FormErrors = {};
    let isValid = true;

    step.fields.forEach(field => {
      const value = formData[field as keyof FormData];
      const validator = validationRules[field as keyof typeof validationRules];
      if (validator) {
        const error = validator(typeof value === 'string' ? value : '');
        if (error) {
          stepErrors[field] = error;
          isValid = false;
        }
      }
    });

    setErrors(prev => ({ ...prev, ...stepErrors }));
    return isValid;
  }, [currentStep, formData]);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouchedFields(prev => new Set(prev).add(name));

    if (touchedFields.has(name)) {
      validateField(name, value);
    }
  };

  // 处理兴趣标签选择
  const handleInterestToggle = (interestId: string) => {
    setFormData(prev => {
      const isSelected = prev.interests.includes(interestId);
      if (isSelected) {
        return { ...prev, interests: prev.interests.filter(id => id !== interestId) };
      } else {
        if (prev.interests.length >= 8) {
          toast.warning('最多选择8个兴趣标签');
          return prev;
        }
        return { ...prev, interests: [...prev.interests, interestId] };
      }
    });
  };

  // 处理头像上传
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processAvatarFile(file);
  };

  // 处理拖拽上传
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processAvatarFile(file);
  };

  // 处理头像文件
  const processAvatarFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = event.target?.result as string;
      setAvatarPreview(preview);
      setFormData(prev => ({ ...prev, avatar: preview }));
      setErrors(prev => ({ ...prev, avatar: '' }));
      toast.success('头像上传成功');
    };
    reader.readAsDataURL(file);
  };

  // 处理预设头像选择
  const handleAvatarSelect = (avatarUrl: string) => {
    setAvatarPreview(avatarUrl);
    setFormData(prev => ({ ...prev, avatar: avatarUrl }));
    setErrors(prev => ({ ...prev, avatar: '' }));
  };

  // 清除头像
  const clearAvatar = () => {
    setAvatarPreview('');
    setFormData(prev => ({ ...prev, avatar: '' }));
  };

  // 下一步
  const handleNext = () => {
    if (validateCurrentStep()) {
      setCompletedSteps(prev => [...new Set([...prev, FORM_STEPS[currentStep].id])]);
      if (currentStep < FORM_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
    } else {
      // 标记当前步骤所有字段为已触摸
      const stepFields = FORM_STEPS[currentStep].fields;
      setTouchedFields(prev => new Set([...prev, ...stepFields]));
      toast.error('请检查输入信息');
    }
  };

  // 上一步
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // 跳转到指定步骤
  const handleStepClick = (index: number) => {
    if (index <= currentStep || completedSteps.includes(FORM_STEPS[index].id)) {
      setCurrentStep(index);
    }
  };

  // 计算完成进度
  const calculateProgress = () => {
    const totalFields = Object.keys(formData).length;
    const filledFields = Object.entries(formData).filter(([key, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value && value.toString().trim() !== '';
    }).length;
    return Math.round((filledFields / totalFields) * 100);
  };

  // 处理表单提交
  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      setTouchedFields(prev => new Set([...prev, ...FORM_STEPS[currentStep].fields]));
      toast.error('请检查输入信息');
      return;
    }

    // 验证必填项
    if (!formData.username.trim()) {
      toast.error('请填写姓名');
      setCurrentStep(0);
      return;
    }
    if (!formData.avatar) {
      toast.error('请选择头像');
      setCurrentStep(0);
      return;
    }

    setIsSubmitting(true);

    try {
      // 准备用户数据
      const userData = {
        username: formData.username,
        avatar: formData.avatar,
        phone: formData.phone,
        email: formData.email || user?.email,
        interests: formData.interests,
        bio: formData.bio,
        location: formData.location,
        birthday: formData.birthday,
        website: formData.website,
        occupation: formData.occupation,
        gender: formData.gender,
        isNewUser: false
      };

      if (isAuthenticated && user?.id) {
        try {
          const { supabase } = await import('@/lib/supabase');

          // 尝试更新数据库
          const { error: dbError } = await supabase
            .from('users')
            .update({
              username: formData.username,
              avatar_url: formData.avatar,
              phone: formData.phone || null,
              email: formData.email || user?.email,
              interests: formData.interests || [],
              bio: formData.bio || null,
              location: formData.location || null,
              birthday: formData.birthday || null,
              website: formData.website || null,
              occupation: formData.occupation || null,
              gender: formData.gender || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          if (dbError) {
            console.warn('数据库更新警告（非阻塞）:', dbError.message);
            // 继续执行，不阻塞用户体验
          }

          // 更新 Auth 用户元数据
          await supabase.auth.updateUser({
            data: userData
          });
        } catch (dbError) {
          console.warn('数据库操作警告（非阻塞）:', dbError);
          // 继续执行，不阻塞用户体验
        }
      }

      // 更新本地状态
      await updateUser(userData);

      toast.success('信息完善成功！');
      setTimeout(() => navigate('/'), 1000);
    } catch (error) {
      console.error('信息完善失败:', error);
      toast.error('信息完善失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 动画配置
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  };

  // 渲染表单字段
  const renderFormFields = () => {
    const step = FORM_STEPS[currentStep];

    switch (step.id) {
      case 'basic':
        return (
          <div className="space-y-6">
            {/* 头像上传区域 */}
            <motion.div variants={itemVariants} className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                头像 <span className="text-red-500">*</span>
              </label>
              <div
                className={cn(
                  "relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300",
                  isDragging
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
                  errors.avatar && touchedFields.has('avatar') && "border-red-500 bg-red-50 dark:bg-red-900/20"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {avatarPreview ? (
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <motion.img
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        src={avatarPreview}
                        alt="头像预览"
                        className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-xl"
                      />
                      <button
                        type="button"
                        onClick={clearAvatar}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">点击右上角按钮更换头像</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      拖拽图片到此处，或
                      <label className="text-blue-500 hover:text-blue-600 cursor-pointer ml-1">
                        点击上传
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">支持 JPG、PNG 格式，最大 5MB</p>
                  </div>
                )}
              </div>
              {errors.avatar && touchedFields.has('avatar') && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1 text-sm text-red-500"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.avatar}
                </motion.p>
              )}

              {/* 预设头像 */}
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">或选择预设头像</p>
                <div className="grid grid-cols-4 gap-3">
                  {PRESET_AVATARS.map((avatar) => (
                    <motion.button
                      key={avatar.id}
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAvatarSelect(avatar.url)}
                      className={cn(
                        "relative rounded-xl overflow-hidden transition-all duration-200",
                        formData.avatar === avatar.url
                          ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800"
                          : "hover:shadow-md"
                      )}
                    >
                      <img
                        src={avatar.url}
                        alt={avatar.style}
                        className="w-full aspect-square object-cover"
                      />
                      {formData.avatar === avatar.url && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <Check className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* 姓名输入 */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                姓名 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  onBlur={(e) => validateField('username', e.target.value)}
                  placeholder="请输入您的姓名"
                  className={cn(
                    "w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-200 focus:outline-none",
                    isDark
                      ? "bg-gray-800/50 text-white placeholder-gray-500"
                      : "bg-white text-gray-900 placeholder-gray-400",
                    errors.username && touchedFields.has('username')
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
                  )}
                />
              </div>
              {errors.username && touchedFields.has('username') && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1 text-sm text-red-500"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.username}
                </motion.p>
              )}
            </motion.div>

            {/* 性别选择 */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                性别
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'male', label: '男', emoji: '👨' },
                  { value: 'female', label: '女', emoji: '👩' },
                  { value: 'other', label: '其他', emoji: '😊' }
                ].map((option) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData(prev => ({ ...prev, gender: option.value }))}
                    className={cn(
                      "py-3 px-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2",
                      formData.gender === option.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    <span className="text-xl">{option.emoji}</span>
                    <span className="font-medium">{option.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6">
            {/* 手机号 */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                手机号
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  onBlur={(e) => validateField('phone', e.target.value)}
                  placeholder="请输入您的手机号"
                  inputMode="tel"
                  className={cn(
                    "w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-200 focus:outline-none",
                    isDark
                      ? "bg-gray-800/50 text-white placeholder-gray-500"
                      : "bg-white text-gray-900 placeholder-gray-400",
                    errors.phone && touchedFields.has('phone')
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
                  )}
                />
              </div>
              {errors.phone && touchedFields.has('phone') && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1 text-sm text-red-500"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.phone}
                </motion.p>
              )}
            </motion.div>

            {/* 邮箱 */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                邮箱
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={(e) => validateField('email', e.target.value)}
                  placeholder="请输入您的邮箱地址"
                  className={cn(
                    "w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-200 focus:outline-none",
                    isDark
                      ? "bg-gray-800/50 text-white placeholder-gray-500"
                      : "bg-white text-gray-900 placeholder-gray-400",
                    errors.email && touchedFields.has('email')
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
                  )}
                />
              </div>
              {errors.email && touchedFields.has('email') && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1 text-sm text-red-500"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </motion.p>
              )}
            </motion.div>

            {/* 所在地 */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                所在地
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="请输入您的所在城市"
                  className={cn(
                    "w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-200 focus:outline-none",
                    isDark
                      ? "bg-gray-800/50 text-white placeholder-gray-500 border-gray-700 focus:border-blue-400"
                      : "bg-white text-gray-900 placeholder-gray-400 border-gray-200 focus:border-blue-500"
                  )}
                />
              </div>
            </motion.div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            {/* 个人简介 */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                个人简介
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                onBlur={(e) => validateField('bio', e.target.value)}
                placeholder="介绍一下自己，让更多人了解你..."
                rows={4}
                maxLength={200}
                className={cn(
                  "w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none resize-none",
                  isDark
                    ? "bg-gray-800/50 text-white placeholder-gray-500"
                    : "bg-white text-gray-900 placeholder-gray-400",
                  errors.bio && touchedFields.has('bio')
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
                )}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{formData.bio.length}/200</span>
                {errors.bio && touchedFields.has('bio') && (
                  <span className="text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.bio}
                  </span>
                )}
              </div>
            </motion.div>

            {/* 职业 */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                职业
              </label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleInputChange}
                  placeholder="您的职业或专业领域"
                  className={cn(
                    "w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-200 focus:outline-none",
                    isDark
                      ? "bg-gray-800/50 text-white placeholder-gray-500 border-gray-700 focus:border-blue-400"
                      : "bg-white text-gray-900 placeholder-gray-400 border-gray-200 focus:border-blue-500"
                  )}
                />
              </div>
            </motion.div>

            {/* 个人网站 */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                个人网站
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  onBlur={(e) => validateField('website', e.target.value)}
                  placeholder="https://your-website.com"
                  className={cn(
                    "w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-200 focus:outline-none",
                    isDark
                      ? "bg-gray-800/50 text-white placeholder-gray-500"
                      : "bg-white text-gray-900 placeholder-gray-400",
                    errors.website && touchedFields.has('website')
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
                  )}
                />
              </div>
              {errors.website && touchedFields.has('website') && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1 text-sm text-red-500"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.website}
                </motion.p>
              )}
            </motion.div>

            {/* 生日 */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                生日
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleInputChange}
                  className={cn(
                    "w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-200 focus:outline-none",
                    isDark
                      ? "bg-gray-800/50 text-white border-gray-700 focus:border-blue-400"
                      : "bg-white text-gray-900 border-gray-200 focus:border-blue-500"
                  )}
                />
              </div>
            </motion.div>
          </div>
        );

      case 'interests':
        return (
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                选择您感兴趣的领域
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                选择 1-8 个标签，帮助我们为您推荐相关内容
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {INTEREST_OPTIONS.map((interest) => {
                const isSelected = formData.interests.includes(interest.id);
                return (
                  <motion.button
                    key={interest.id}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleInterestToggle(interest.id)}
                    className={cn(
                      "px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2",
                      isSelected
                        ? `bg-gradient-to-r ${interest.color} text-white shadow-lg`
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    )}
                  >
                    {interest.icon}
                    {interest.label}
                    {isSelected && <Check className="w-3 h-3" />}
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                <Info className="w-4 h-4" />
                <span className="text-sm font-medium">已选择 {formData.interests.length} 个标签</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <motion.div
                  className="bg-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(formData.interests.length / 8) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const progress = calculateProgress();

  return (
    <div className={cn(
      "min-h-screen",
      isDark ? "bg-gray-950" : "bg-gradient-to-br from-gray-50 to-blue-50"
    )}>
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-100/50 to-transparent dark:from-blue-900/20 rounded-full" />
      </div>

      {/* 主容器 - 三栏布局 */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 顶部标题区 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI 共创
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            完善个人信息
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            填写以下信息，开启您的创作之旅
          </p>
        </motion.div>

        {/* 三栏布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左栏 - 步骤导航 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <div className={cn(
              "sticky top-8 rounded-2xl p-6",
              isDark ? "bg-gray-900/80 border border-gray-800" : "bg-white/80 border border-gray-200",
              "backdrop-blur-xl shadow-xl"
            )}>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                完成进度
              </h3>

              {/* 进度条 */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{progress}%</span>
                  <span className="text-gray-500 dark:text-gray-400">资料完整度</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* 步骤列表 */}
              <div className="space-y-2">
                {FORM_STEPS.map((step, index) => {
                  const isActive = index === currentStep;
                  const isCompleted = completedSteps.includes(step.id);
                  const isClickable = index <= currentStep || isCompleted;

                  return (
                    <motion.button
                      key={step.id}
                      onClick={() => isClickable && handleStepClick(index)}
                      disabled={!isClickable}
                      whileHover={isClickable ? { x: 4 } : {}}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                          : isCompleted
                            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                        !isClickable && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        isActive
                          ? "bg-blue-500 text-white"
                          : isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      )}>
                        {isCompleted ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          step.icon
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className={cn(
                          "font-medium text-sm",
                          isActive
                            ? "text-blue-700 dark:text-blue-300"
                            : isCompleted
                              ? "text-green-700 dark:text-green-300"
                              : "text-gray-700 dark:text-gray-300"
                        )}>
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {step.description}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* 提示信息 */}
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    您的信息将受到严格保护，仅用于个性化服务推荐
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 中栏 - 表单内容 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-6"
          >
            <div className={cn(
              "rounded-2xl p-6 sm:p-8",
              isDark ? "bg-gray-900/80 border border-gray-800" : "bg-white/80 border border-gray-200",
              "backdrop-blur-xl shadow-xl"
            )}>
              {/* 步骤标题 */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {FORM_STEPS[currentStep].title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {FORM_STEPS[currentStep].description}
                  </p>
                </div>
                <div className="text-sm text-gray-400 dark:text-gray-500">
                  {currentStep + 1} / {FORM_STEPS.length}
                </div>
              </div>

              {/* 表单内容 */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {renderFormFields()}
                  </motion.div>
                </motion.div>
              </AnimatePresence>

              {/* 导航按钮 */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-medium transition-all duration-200",
                    currentStep === 0
                      ? "opacity-0 pointer-events-none"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  上一步
                </button>

                {currentStep < FORM_STEPS.length - 1 ? (
                  <motion.button
                    type="button"
                    onClick={handleNext}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 flex items-center gap-2"
                  >
                    下一步
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-200 flex items-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        提交中...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        完成
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>

          {/* 右栏 - 预览和提示 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3"
          >
            <div className="sticky top-8 space-y-6">
              {/* 个人资料预览卡片 */}
              <div className={cn(
                "rounded-2xl p-6",
                isDark ? "bg-gray-900/80 border border-gray-800" : "bg-white/80 border border-gray-200",
                "backdrop-blur-xl shadow-xl"
              )}>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                  资料预览
                </h3>

                <div className="text-center">
                  {/* 头像预览 */}
                  <div className="relative inline-block mb-4">
                    {formData.avatar ? (
                      <img
                        src={formData.avatar}
                        alt="头像"
                        className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  {/* 姓名 */}
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                    {formData.username || '未设置姓名'}
                  </h4>

                  {/* 职业 */}
                  {formData.occupation && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {formData.occupation}
                    </p>
                  )}

                  {/* 简介 */}
                  {formData.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-3">
                      {formData.bio}
                    </p>
                  )}

                  {/* 兴趣标签 */}
                  {formData.interests.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                      {formData.interests.slice(0, 4).map((interestId) => {
                        const interest = INTEREST_OPTIONS.find(i => i.id === interestId);
                        return interest ? (
                          <span
                            key={interestId}
                            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full"
                          >
                            {interest.label}
                          </span>
                        ) : null;
                      })}
                      {formData.interests.length > 4 && (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs rounded-full">
                          +{formData.interests.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 完成奖励提示 */}
              <div className={cn(
                "rounded-2xl p-6",
                isDark ? "bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-800/50" : "bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200",
                "backdrop-blur-xl"
              )}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">完成奖励</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">完善资料即可获得</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>100 积分奖励</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>专属创作者徽章</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>优先推荐机会</span>
                  </li>
                </ul>
              </div>

              {/* 帮助提示 */}
              <div className={cn(
                "rounded-2xl p-4",
                isDark ? "bg-gray-800/50 border border-gray-700" : "bg-gray-50 border border-gray-200"
              )}>
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">需要帮助？</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      如果您在完善资料过程中遇到任何问题，请联系我们的客服团队获取帮助。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
