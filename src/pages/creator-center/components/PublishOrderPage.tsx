import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import * as orderAuditService from '@/services/orderAuditService';
import {
  Briefcase,
  DollarSign,
  Calendar,
  MapPin,
  Users,
  Target,
  FileText,
  Upload,
  X,
  Plus,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Building2,
  Clock,
  Tag,
  Image as ImageIcon,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

// ============================================================================
// 类型定义
// ============================================================================

type TaskType = 'design' | 'illustration' | 'video' | 'writing' | 'photography' | 'other';
type DifficultyLevel = 'easy' | 'medium' | 'hard';

interface OrderFormData {
  title: string;
  brandName: string;
  type: TaskType;
  description: string;
  requirements: string[];
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  duration: string;
  location: string;
  maxApplicants: number;
  difficulty: DifficultyLevel;
  tags: string[];
  attachments: File[];
}

// ============================================================================
// 配置数据
// ============================================================================

const taskTypeOptions: { value: TaskType; label: string; icon: React.ElementType }[] = [
  { value: 'design', label: '设计创作', icon: Target },
  { value: 'illustration', label: '插画创作', icon: Sparkles },
  { value: 'video', label: '视频创作', icon: Clock },
  { value: 'writing', label: '文案创作', icon: FileText },
  { value: 'photography', label: '摄影创作', icon: ImageIcon },
  { value: 'other', label: '其他类型', icon: Tag },
];

const difficultyOptions: { value: DifficultyLevel; label: string; description: string }[] = [
  { value: 'easy', label: '简单', description: '适合新手创作者，要求基础技能' },
  { value: 'medium', label: '中等', description: '需要一定经验，标准商业项目' },
  { value: 'hard', label: '困难', description: '高难度项目，需要专业技能' },
];

const durationOptions = ['1天', '3天', '7天', '14天', '30天', '自定义'];

const locationOptions = ['远程', '北京', '上海', '天津', '广州', '深圳', '杭州', '成都', '其他'];

// ============================================================================
// 主组件
// ============================================================================

const PublishOrderPage: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState<OrderFormData>({
    title: '',
    brandName: '',
    type: 'design',
    description: '',
    requirements: [''],
    budgetMin: 1000,
    budgetMax: 5000,
    deadline: '',
    duration: '7天',
    location: '远程',
    maxApplicants: 10,
    difficulty: 'medium',
    tags: [],
    attachments: [],
  });

  const [newTag, setNewTag] = useState('');
  const [newRequirement, setNewRequirement] = useState('');

  const updateFormData = useCallback(<K extends keyof OrderFormData>(
    key: K,
    value: OrderFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      updateFormData('requirements', [...formData.requirements, newRequirement.trim()]);
      setNewRequirement('');
    }
  };

  const handleRemoveRequirement = (index: number) => {
    updateFormData('requirements', formData.requirements.filter((_, i) => i !== index));
  };

  const handleUpdateRequirement = (index: number, value: string) => {
    const newRequirements = [...formData.requirements];
    newRequirements[index] = value;
    updateFormData('requirements', newRequirements);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      updateFormData('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    updateFormData('tags', formData.tags.filter(t => t !== tag));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + formData.attachments.length > 5) {
      toast.error('最多只能上传5个附件');
      return;
    }
    updateFormData('attachments', [...formData.attachments, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    updateFormData('attachments', formData.attachments.filter((_, i) => i !== index));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          toast.error('请输入任务标题');
          return false;
        }
        if (!formData.brandName.trim()) {
          toast.error('请输入品牌名称');
          return false;
        }
        if (!formData.description.trim()) {
          toast.error('请输入任务描述');
          return false;
        }
        return true;
      case 2:
        if (formData.budgetMin <= 0 || formData.budgetMax <= 0) {
          toast.error('请输入有效的预算金额');
          return false;
        }
        if (formData.budgetMin > formData.budgetMax) {
          toast.error('最低预算不能高于最高预算');
          return false;
        }
        if (!formData.deadline) {
          toast.error('请选择截止日期');
          return false;
        }
        return true;
      case 3:
        const validRequirements = formData.requirements.filter(r => r && r.trim());
        if (validRequirements.length === 0) {
          toast.error('请至少添加一个任务要求');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    // 检查用户是否登录
    if (!user?.id) {
      toast.error('请先登录后再提交商单');
      return;
    }

    setIsSubmitting(true);
    try {
      // 过滤空的要求
      const validRequirements = formData.requirements.filter(r => r && r.trim());
      if (validRequirements.length === 0) {
        toast.error('请至少添加一个任务要求');
        return;
      }

      // 提交商单到审核系统
      const orderData = {
        order_id: `order_${Date.now()}`,
        user_id: user.id,
        title: formData.title,
        brand_name: formData.brandName,
        type: formData.type,
        description: formData.description,
        requirements: validRequirements,
        budget_min: Number(formData.budgetMin),
        budget_max: Number(formData.budgetMax),
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : new Date().toISOString(),
        duration: formData.duration,
        location: formData.location,
        max_applicants: Number(formData.maxApplicants),
        difficulty: formData.difficulty,
        tags: formData.tags,
        attachments: [], // 附件上传功能待实现
      };

      const orderId = await orderAuditService.submitOrderForAudit(orderData);

      if (orderId) {
        setShowSuccess(true);
        toast.success('商单提交成功，等待审核通过后将在商单广场展示');
      } else {
        toast.error('提交失败，请重试');
      }
    } catch (error) {
      console.error('提交商单失败:', error);
      toast.error('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return <SuccessView isDark={isDark} onPublishAnother={() => {
      setShowSuccess(false);
      setCurrentStep(1);
      setFormData({
        title: '',
        brandName: '',
        type: 'design',
        description: '',
        requirements: [''],
        budgetMin: 1000,
        budgetMax: 5000,
        deadline: '',
        duration: '7天',
        location: '远程',
        maxApplicants: 10,
        difficulty: 'medium',
        tags: [],
        attachments: [],
      });
    }} />;
  }

  return (
    <div className="min-h-screen pb-8">
      {/* 页面标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mb-8 ${isDark ? 'bg-gradient-to-r from-blue-900/80 via-indigo-900/80 to-violet-900/80' : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600'} rounded-2xl p-6 relative overflow-hidden`}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white mb-2">发布商单</h1>
          <p className="text-white/70">发布商业订单，找到合适的创作者合作</p>
        </div>
      </motion.div>

      {/* 步骤指示器 */}
      <StepIndicator currentStep={currentStep} isDark={isDark} />

      {/* 表单内容 */}
      <div className="mt-8">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <StepOne
              key="step1"
              formData={formData}
              updateFormData={updateFormData}
              isDark={isDark}
            />
          )}
          {currentStep === 2 && (
            <StepTwo
              key="step2"
              formData={formData}
              updateFormData={updateFormData}
              isDark={isDark}
            />
          )}
          {currentStep === 3 && (
            <StepThree
              key="step3"
              formData={formData}
              updateFormData={updateFormData}
              isDark={isDark}
              newRequirement={newRequirement}
              setNewRequirement={setNewRequirement}
              onAddRequirement={handleAddRequirement}
              onRemoveRequirement={handleRemoveRequirement}
              onHandleUpdateRequirement={handleUpdateRequirement}
              newTag={newTag}
              setNewTag={setNewTag}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />
          )}
          {currentStep === 4 && (
            <StepFour
              key="step4"
              formData={formData}
              isDark={isDark}
              onFileUpload={handleFileUpload}
              onRemoveFile={handleRemoveFile}
            />
          )}
        </AnimatePresence>
      </div>

      {/* 底部操作栏 */}
      <div className={`fixed bottom-0 left-0 right-0 ${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} border-t backdrop-blur-sm z-50`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              currentStep === 1
                ? 'opacity-50 cursor-not-allowed'
                : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            上一步
          </button>

          <div className="flex items-center gap-4">
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25"
              >
                下一步
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    发布中...
                  </>
                ) : (
                  <>
                    <Briefcase className="w-5 h-5" />
                    发布商单
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 底部占位 */}
      <div className="h-20" />
    </div>
  );
};

// ============================================================================
// 步骤指示器
// ============================================================================

const StepIndicator: React.FC<{ currentStep: number; isDark: boolean }> = ({ currentStep, isDark }) => {
  const steps = [
    { number: 1, label: '基本信息' },
    { number: 2, label: '预算与时间' },
    { number: 3, label: '要求与标签' },
    { number: 4, label: '确认发布' },
  ];

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;

          return (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center">
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isActive
                      ? '#3b82f6'
                      : isCompleted
                        ? '#10b981'
                        : isDark
                          ? '#374151'
                          : '#e5e7eb',
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white transition-colors`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    step.number
                  )}
                </motion.div>
                <span className={`mt-2 text-sm font-medium ${
                  isActive
                    ? 'text-blue-500'
                    : isCompleted
                      ? 'text-emerald-500'
                      : isDark
                        ? 'text-gray-500'
                        : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-24 h-1 mx-4 ${
                  isCompleted
                    ? 'bg-emerald-500'
                    : isDark
                      ? 'bg-gray-700'
                      : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 步骤一：基本信息
// ============================================================================

const StepOne: React.FC<{
  formData: OrderFormData;
  updateFormData: <K extends keyof OrderFormData>(key: K, value: OrderFormData[K]) => void;
  isDark: boolean;
}> = ({ formData, updateFormData, isDark }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}
    >
      <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>基本信息</h2>

      <div className="space-y-6">
        {/* 任务标题 */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            任务标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateFormData('title', e.target.value)}
            placeholder="例如：天津海河文化宣传海报设计"
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
              isDark
                ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
            } focus:outline-none`}
          />
        </div>

        {/* 品牌名称 */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            品牌名称 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              value={formData.brandName}
              onChange={(e) => updateFormData('brandName', e.target.value)}
              placeholder="请输入品牌或公司名称"
              className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all ${
                isDark
                  ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
              } focus:outline-none`}
            />
          </div>
        </div>

        {/* 任务类型 */}
        <div>
          <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            任务类型 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {taskTypeOptions.map((type) => {
              const Icon = type.icon;
              const isSelected = formData.type === type.value;

              return (
                <motion.button
                  key={type.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateFormData('type', type.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10'
                      : isDark
                        ? 'border-gray-700 hover:border-gray-600'
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-blue-500' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {type.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* 任务描述 */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            任务描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateFormData('description', e.target.value)}
            placeholder="详细描述任务需求、预期效果、品牌调性等信息..."
            rows={6}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all resize-none ${
              isDark
                ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
            } focus:outline-none`}
          />
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// 步骤二：预算与时间
// ============================================================================

const StepTwo: React.FC<{
  formData: OrderFormData;
  updateFormData: <K extends keyof OrderFormData>(key: K, value: OrderFormData[K]) => void;
  isDark: boolean;
}> = ({ formData, updateFormData, isDark }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}
    >
      <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>预算与时间</h2>

      <div className="space-y-6">
        {/* 预算范围 */}
        <div>
          <label className={`block text-sm font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            预算范围（元） <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="number"
                value={formData.budgetMin}
                onChange={(e) => updateFormData('budgetMin', parseInt(e.target.value) || 0)}
                placeholder="最低预算"
                className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all ${
                  isDark
                    ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                } focus:outline-none`}
              />
            </div>
            <span className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>~</span>
            <div className="flex-1 relative">
              <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="number"
                value={formData.budgetMax}
                onChange={(e) => updateFormData('budgetMax', parseInt(e.target.value) || 0)}
                placeholder="最高预算"
                className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all ${
                  isDark
                    ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                } focus:outline-none`}
              />
            </div>
          </div>
        </div>

        {/* 截止日期 */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            截止日期 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => updateFormData('deadline', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all ${
                isDark
                  ? 'bg-gray-900/50 border-gray-700 text-white focus:border-blue-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
              } focus:outline-none`}
            />
          </div>
        </div>

        {/* 预计工期 */}
        <div>
          <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            预计工期
          </label>
          <div className="flex flex-wrap gap-3">
            {durationOptions.map((duration) => (
              <motion.button
                key={duration}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => updateFormData('duration', duration)}
                className={`px-4 py-2 rounded-xl border-2 transition-all ${
                  formData.duration === duration
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                    : isDark
                      ? 'border-gray-700 text-gray-300 hover:border-gray-600'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {duration}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 工作地点 */}
        <div>
          <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            工作地点
          </label>
          <div className="flex flex-wrap gap-3">
            {locationOptions.map((location) => (
              <motion.button
                key={location}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => updateFormData('location', location)}
                className={`px-4 py-2 rounded-xl border-2 transition-all ${
                  formData.location === location
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                    : isDark
                      ? 'border-gray-700 text-gray-300 hover:border-gray-600'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {location}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 最大接单人数 */}
        <div>
          <label className={`block text-sm font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            最大接单人数: {formData.maxApplicants} 人
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={formData.maxApplicants}
            onChange={(e) => updateFormData('maxApplicants', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className={`flex justify-between text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <span>1人</span>
            <span>50人</span>
          </div>
        </div>

        {/* 难度等级 */}
        <div>
          <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            难度等级
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {difficultyOptions.map((difficulty) => (
              <motion.button
                key={difficulty.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updateFormData('difficulty', difficulty.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  formData.difficulty === difficulty.value
                    ? 'border-blue-500 bg-blue-500/10'
                    : isDark
                      ? 'border-gray-700 hover:border-gray-600'
                      : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className={`font-medium ${formData.difficulty === difficulty.value ? 'text-blue-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
                  {difficulty.label}
                </span>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {difficulty.description}
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// 步骤三：要求与标签
// ============================================================================

const StepThree: React.FC<{
  formData: OrderFormData;
  updateFormData: <K extends keyof OrderFormData>(key: K, value: OrderFormData[K]) => void;
  isDark: boolean;
  newRequirement: string;
  setNewRequirement: (value: string) => void;
  onAddRequirement: () => void;
  onRemoveRequirement: (index: number) => void;
  onHandleUpdateRequirement?: (index: number, value: string) => void;
  newTag: string;
  setNewTag: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}> = ({
  formData,
  updateFormData,
  isDark,
  newRequirement,
  setNewRequirement,
  onAddRequirement,
  onRemoveRequirement,
  onHandleUpdateRequirement,
  newTag,
  setNewTag,
  onAddTag,
  onRemoveTag,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}
    >
      <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>要求与标签</h2>

      <div className="space-y-8">
        {/* 任务要求 */}
        <div>
          <label className={`block text-sm font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            任务要求 <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {formData.requirements.map((req, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <input
                  type="text"
                  value={req}
                  onChange={(e) => onHandleUpdateRequirement && onHandleUpdateRequirement(index, e.target.value)}
                  placeholder="请输入要求"
                  className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                    isDark
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                  } focus:outline-none`}
                />
                <button
                  onClick={() => onRemoveRequirement(index)}
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                    isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <input
              type="text"
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onAddRequirement()}
              placeholder="添加新的要求，按回车确认"
              className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                isDark
                  ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
              } focus:outline-none`}
            />
            <button
              onClick={onAddRequirement}
              className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 标签 */}
        <div>
          <label className={`block text-sm font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            标签
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.tags.map((tag) => (
              <motion.span
                key={tag}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                  isDark
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-blue-50 text-blue-600'
                }`}
              >
                {tag}
                <button
                  onClick={() => onRemoveTag(tag)}
                  className="hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onAddTag()}
              placeholder="添加标签，按回车确认"
              className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                isDark
                  ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
              } focus:outline-none`}
            />
            <button
              onClick={onAddTag}
              className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            添加相关标签可以帮助创作者更好地找到您的任务
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// 步骤四：确认发布
// ============================================================================

const StepFour: React.FC<{
  formData: OrderFormData;
  isDark: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
}> = ({ formData, isDark, onFileUpload, onRemoveFile }) => {
  const typeConfig = taskTypeOptions.find(t => t.value === formData.type);
  const TypeIcon = typeConfig?.icon || Target;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* 预览卡片 */}
      <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}>
        <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>预览</h2>

        <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
              <TypeIcon className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formData.title || '未填写标题'}
              </h3>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                品牌方: {formData.brandName || '未填写'}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                  {typeConfig?.label}
                </span>
                {formData.tags.map((tag) => (
                  <span key={tag} className={`px-2.5 py-1 text-xs rounded-lg ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-500">
                ¥{formData.budgetMin.toLocaleString()} - ¥{formData.budgetMax.toLocaleString()}
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                截止: {formData.deadline || '未设置'}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className={`font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>任务描述</h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {formData.description || '未填写描述'}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>预计工期</p>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formData.duration}</p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>工作地点</p>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formData.location}</p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>最大人数</p>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formData.maxApplicants}人</p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>难度等级</p>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {difficultyOptions.find(d => d.value === formData.difficulty)?.label}
              </p>
            </div>
          </div>

          {formData.requirements.length > 0 && formData.requirements[0] !== '' && (
            <div className="mt-4">
              <h4 className={`font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>任务要求</h4>
              <div className="flex flex-wrap gap-2">
                {formData.requirements.filter(r => r).map((req, index) => (
                  <span key={index} className={`px-2 py-1 rounded-lg text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                    {req}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 附件上传 */}
      <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}>
        <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>附件（可选）</h3>
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          上传参考文件、品牌资料等，最多5个文件
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {formData.attachments.map((file, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`relative p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <div className="flex items-center gap-2">
                <FileText className={`w-8 h-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{file.name}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => onRemoveFile(index)}
                className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-500'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}

          {formData.attachments.length < 5 && (
            <label className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
              isDark
                ? 'border-gray-700 hover:border-gray-600'
                : 'border-gray-300 hover:border-gray-400'
            }`}>
              <Upload className={`w-8 h-8 mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>上传文件</span>
              <input
                type="file"
                multiple
                onChange={onFileUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* 提示信息 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
          <div>
            <p className={`text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
              发布前请确认
            </p>
            <p className={`text-sm mt-1 ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
              请仔细检查所有信息，发布后可以在创作者中心管理您的商单。
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// 成功页面
// ============================================================================

const SuccessView: React.FC<{ isDark: boolean; onPublishAnother: () => void }> = ({ isDark, onPublishAnother }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex items-center justify-center p-6"
    >
      <div className={`max-w-md w-full text-center ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-8 border`}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500 flex items-center justify-center"
        >
          <CheckCircle2 className="w-10 h-10 text-white" />
        </motion.div>

        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          发布成功！
        </h2>
        <p className={`mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          您的商单已成功发布，创作者们现在可以看到并申请您的任务了。
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/order-square')}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
          >
            查看商单广场
          </button>
          <button
            onClick={onPublishAnother}
            className={`w-full py-3 rounded-xl font-medium transition-colors ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            再发布一个
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PublishOrderPage;
