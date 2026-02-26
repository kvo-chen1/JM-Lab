/**
 * 推广用户申请页面
 * 用户可以在此页面申请成为推广用户
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Rocket, 
  User, 
  Building2, 
  Camera, 
  Star,
  CheckCircle,
  ArrowRight,
  Loader2,
  AlertCircle,
  Plus,
  X,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3
} from 'lucide-react';
import { promotionUserService, type PromotionApplication } from '@/services/promotionUserService';

// 申请类型选项
const applicationTypes = [
  { id: 'individual', label: '个人推广者', icon: User, description: '适合个人创作者、自媒体运营者' },
  { id: 'business', label: '企业/商家', icon: Building2, description: '适合有营业执照的企业或商家' },
  { id: 'creator', label: '内容创作者', icon: Camera, description: '适合有粉丝基础的创作者' },
  { id: 'brand', label: '品牌方', icon: Star, description: '适合品牌推广需求方' },
];

// 推广渠道选项
const channelOptions = [
  '抖音', '小红书', '微信', '微博', 'B站', '快手', 
  '知乎', '今日头条', '百度', '其他'
];

// 预算范围选项
const budgetOptions = [
  { value: 5000, label: '5,000元/月以下' },
  { value: 10000, label: '5,000-10,000元/月' },
  { value: 30000, label: '10,000-30,000元/月' },
  { value: 50000, label: '30,000-50,000元/月' },
  { value: 100000, label: '50,000元/月以上' },
];

export default function PromotionApplication() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // 表单状态
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [existingApplication, setExistingApplication] = useState<PromotionApplication | null>(null);
  
  // 表单数据
  const [formData, setFormData] = useState({
    application_type: 'individual' as const,
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    company_name: '',
    company_address: '',
    business_license: '',
    promotion_channels: [] as string[],
    promotion_experience: '',
    expected_monthly_budget: 10000,
    social_accounts: [] as Array<{ platform: string; account: string; followers: number }>,
  });

  // 检查是否已有申请
  useEffect(() => {
    const checkExisting = async () => {
      if (!user) {
        setChecking(false);
        return;
      }
      
      try {
        const application = await promotionUserService.getUserApplication(user.id);
        setExistingApplication(application);
      } catch (error) {
        console.error('检查申请状态失败:', error);
      } finally {
        setChecking(false);
      }
    };
    
    checkExisting();
  }, [user]);

  // 处理表单字段更新
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 处理推广渠道选择
  const toggleChannel = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      promotion_channels: prev.promotion_channels.includes(channel)
        ? prev.promotion_channels.filter(c => c !== channel)
        : [...prev.promotion_channels, channel]
    }));
  };

  // 添加社交媒体账号
  const addSocialAccount = () => {
    setFormData(prev => ({
      ...prev,
      social_accounts: [...prev.social_accounts, { platform: '', account: '', followers: 0 }]
    }));
  };

  // 更新社交媒体账号
  const updateSocialAccount = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      social_accounts: prev.social_accounts.map((account, i) => 
        i === index ? { ...account, [field]: value } : account
      )
    }));
  };

  // 删除社交媒体账号
  const removeSocialAccount = (index: number) => {
    setFormData(prev => ({
      ...prev,
      social_accounts: prev.social_accounts.filter((_, i) => i !== index)
    }));
  };

  // 验证表单
  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.contact_name.trim()) {
          toast.error('请填写联系人姓名');
          return false;
        }
        if (!formData.contact_phone.trim()) {
          toast.error('请填写联系电话');
          return false;
        }
        if (formData.application_type === 'business' && !formData.company_name.trim()) {
          toast.error('请填写公司名称');
          return false;
        }
        return true;
      case 2:
        if (formData.promotion_channels.length === 0) {
          toast.error('请至少选择一个推广渠道');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  // 提交申请
  const handleSubmit = async () => {
    if (!user) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
    
    setLoading(true);
    try {
      const result = await promotionUserService.createApplication(formData);
      if (result) {
        toast.success('申请提交成功！我们会尽快审核您的申请。');
        setExistingApplication(result);
      } else {
        toast.error('申请提交失败，请重试');
      }
    } catch (error) {
      console.error('提交申请失败:', error);
      toast.error('申请提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 如果正在检查状态
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  // 如果已有申请
  if (existingApplication) {
    const statusConfig: Record<string, { label: string; color: string; message: string }> = {
      pending: { label: '待审核', color: 'yellow', message: '您的申请正在审核中，请耐心等待。' },
      reviewing: { label: '审核中', color: 'blue', message: '您的申请正在审核中，请耐心等待。' },
      approved: { label: '已通过', color: 'green', message: '恭喜！您的推广用户申请已通过审核。' },
      rejected: { label: '已驳回', color: 'red', message: '很遗憾，您的申请未通过审核。' },
      suspended: { label: '已暂停', color: 'gray', message: '您的推广账号已被暂停。' },
    };
    
    const status = statusConfig[existingApplication.status] || statusConfig.pending;
    
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-2xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-8 text-center ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
          >
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 bg-${status.color}-100`}>
              {existingApplication.status === 'approved' ? (
                <CheckCircle className={`w-10 h-10 text-${status.color}-500`} />
              ) : existingApplication.status === 'rejected' ? (
                <AlertCircle className={`w-10 h-10 text-${status.color}-500`} />
              ) : (
                <Loader2 className={`w-10 h-10 text-${status.color}-500 animate-spin`} />
              )}
            </div>
            
            <h2 className="text-2xl font-bold mb-2">{status.label}</h2>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {status.message}
            </p>
            
            {existingApplication.status === 'approved' && (
              <button
                onClick={() => navigate('/promotion')}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
              >
                进入推广中心
              </button>
            )}
            
            {existingApplication.status === 'rejected' && existingApplication.rejection_reason && (
              <div className={`mt-4 p-4 rounded-lg text-left ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className="font-medium mb-2">驳回原因：</p>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  {existingApplication.rejection_reason}
                </p>
              </div>
            )}
            
            <div className={`mt-6 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                申请时间：{new Date(existingApplication.created_at).toLocaleString()}
              </p>
              {existingApplication.reviewed_at && (
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  审核时间：{new Date(existingApplication.reviewed_at).toLocaleString()}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // 未登录状态
  if (!user) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-2xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-8 text-center ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
          >
            <Rocket className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">请先登录</h2>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              申请成为推广用户需要先登录账号
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
            >
              去登录
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* 页面头部 */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <Rocket className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">申请成为推广用户</h1>
              <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                加入我们的推广计划，获取更多曝光和收益
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 步骤指示器 */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s, index) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                step >= s 
                  ? 'bg-red-600 text-white' 
                  : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {index < 2 && (
                <div className={`w-20 h-1 mx-2 transition-colors ${
                  step > s ? 'bg-red-600' : isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* 表单内容 */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className={`rounded-2xl p-8 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
        >
          {/* 步骤1：基本信息 */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-6">选择申请类型</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {applicationTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => updateField('application_type', type.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.application_type === type.id
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : isDark 
                          ? 'border-gray-700 hover:border-gray-600' 
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        formData.application_type === type.id
                          ? 'bg-red-100 text-red-600'
                          : isDark ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <type.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{type.label}</h3>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="font-medium mb-4">联系信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      联系人姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) => updateField('contact_name', e.target.value)}
                      placeholder="请输入联系人姓名"
                      className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-red-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      联系电话 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => updateField('contact_phone', e.target.value)}
                      placeholder="请输入联系电话"
                      className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-red-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      联系邮箱
                    </label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => updateField('contact_email', e.target.value)}
                      placeholder="请输入联系邮箱"
                      className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-red-500`}
                    />
                  </div>
                </div>
              </div>

              {/* 企业信息（仅企业类型显示） */}
              {formData.application_type === 'business' && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="font-medium mb-4">企业信息</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        公司名称 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.company_name}
                        onChange={(e) => updateField('company_name', e.target.value)}
                        placeholder="请输入公司名称"
                        className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:outline-none focus:ring-2 focus:ring-red-500`}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        公司地址
                      </label>
                      <input
                        type="text"
                        value={formData.company_address}
                        onChange={(e) => updateField('company_address', e.target.value)}
                        placeholder="请输入公司地址"
                        className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:outline-none focus:ring-2 focus:ring-red-500`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 步骤2：推广信息 */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-6">推广信息</h2>
              
              <div>
                <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  推广渠道 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {channelOptions.map((channel) => (
                    <button
                      key={channel}
                      onClick={() => toggleChannel(channel)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        formData.promotion_channels.includes(channel)
                          ? 'bg-red-600 text-white border-red-600'
                          : isDark 
                            ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' 
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {channel}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  推广经验
                </label>
                <textarea
                  value={formData.promotion_experience}
                  onChange={(e) => updateField('promotion_experience', e.target.value)}
                  placeholder="请简要描述您的推广经验..."
                  rows={4}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-red-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  预期月推广预算
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {budgetOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateField('expected_monthly_budget', option.value)}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        formData.expected_monthly_budget === option.value
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600'
                          : isDark 
                            ? 'border-gray-700 hover:border-gray-600' 
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    社交媒体账号
                  </label>
                  <button
                    onClick={addSocialAccount}
                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                  >
                    <Plus className="w-4 h-4" />
                    添加账号
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.social_accounts.map((account, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="text"
                        value={account.platform}
                        onChange={(e) => updateSocialAccount(index, 'platform', e.target.value)}
                        placeholder="平台（如：抖音）"
                        className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:outline-none focus:ring-2 focus:ring-red-500`}
                      />
                      <input
                        type="text"
                        value={account.account}
                        onChange={(e) => updateSocialAccount(index, 'account', e.target.value)}
                        placeholder="账号"
                        className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:outline-none focus:ring-2 focus:ring-red-500`}
                      />
                      <input
                        type="number"
                        value={account.followers || ''}
                        onChange={(e) => updateSocialAccount(index, 'followers', parseInt(e.target.value) || 0)}
                        placeholder="粉丝数"
                        className={`w-24 px-4 py-2 rounded-lg border transition-colors ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:outline-none focus:ring-2 focus:ring-red-500`}
                      />
                      <button
                        onClick={() => removeSocialAccount(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 步骤3：确认提交 */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-6">确认信息</h2>
              
              <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <h3 className="font-medium mb-4">申请信息概览</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>申请类型</span>
                    <span className="font-medium">
                      {applicationTypes.find(t => t.id === formData.application_type)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>联系人</span>
                    <span className="font-medium">{formData.contact_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>联系电话</span>
                    <span className="font-medium">{formData.contact_phone}</span>
                  </div>
                  {formData.contact_email && (
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>联系邮箱</span>
                      <span className="font-medium">{formData.contact_email}</span>
                    </div>
                  )}
                  {formData.company_name && (
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>公司名称</span>
                      <span className="font-medium">{formData.company_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>推广渠道</span>
                    <span className="font-medium">{formData.promotion_channels.join('、')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>预期月预算</span>
                    <span className="font-medium">
                      {budgetOptions.find(b => b.value === formData.expected_monthly_budget)?.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-xl ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} border ${isDark ? 'border-blue-800' : 'border-blue-200'}`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-700 dark:text-blue-400">提交前请确认</p>
                    <p className={`mt-1 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                      提交申请后，我们的工作人员会在1-3个工作日内完成审核。审核通过后，您将获得推广用户的全部权限。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 导航按钮 */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setStep(prev => prev - 1)}
              disabled={step === 1}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                step === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              上一步
            </button>
            
            {step < 3 ? (
              <button
                onClick={() => {
                  if (validateStep(step)) {
                    setStep(prev => prev + 1);
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
              >
                下一步
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    提交申请
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* 推广用户权益 */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-center mb-8">推广用户权益</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: TrendingUp, title: '专属推广套餐', desc: '享受优惠的推广价格和定制化服务' },
              { icon: DollarSign, title: '佣金返利', desc: '推广成功可获得丰厚的佣金返利' },
              { icon: Users, title: '数据分析', desc: '详细的推广数据分析和效果追踪' },
              { icon: BarChart3, title: '优先支持', desc: '专属客服团队提供优先技术支持' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-xl text-center ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-red-600" />
                </div>
                <h4 className="font-medium mb-2">{item.title}</h4>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
