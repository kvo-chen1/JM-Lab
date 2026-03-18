import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  X,
  Shield,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Award,
  Star,
  Crown,
  BadgeCheck,
  FileText,
  Upload,
  User,
  Mail,
  Phone,
  Building2,
  Link as LinkIcon,
  Check,
  AlertCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface AuthorCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const certificationTypes = [
  {
    id: 'personal',
    title: '个人认证',
    description: '适合独立创作者',
    icon: User,
    requirements: ['完成实名认证', '发布至少5个原创作品', '账号注册满30天'],
    benefits: ['原创标识', '优先推荐', '侵权快速处理'],
    color: 'blue'
  },
  {
    id: 'organization',
    title: '机构认证',
    description: '适合企业、媒体、机构',
    icon: Building2,
    requirements: ['提供营业执照', '提供组织机构代码证', '官方授权书'],
    benefits: ['官方标识', '品牌保护', '批量维权'],
    color: 'purple'
  },
  {
    id: 'expert',
    title: '专家认证',
    description: '适合行业专家、学者',
    icon: Crown,
    requirements: ['提供职称证书', '提供学历证明', '行业影响力证明'],
    benefits: ['专家标识', '内容优先审核', '专属客服'],
    color: 'amber'
  }
];

const benefits = [
  {
    icon: Shield,
    title: '原创保护',
    description: '获得平台全方位的原创作品保护服务'
  },
  {
    icon: BadgeCheck,
    title: '认证标识',
    description: '个人主页和作品展示专属认证标识'
  },
  {
    icon: Star,
    title: '优先推荐',
    description: '作品获得更多曝光和推荐机会'
  },
  {
    icon: Award,
    title: '专属权益',
    description: '享受平台提供的各项专属权益和服务'
  }
];

export default function AuthorCertificationModal({ isOpen, onClose }: AuthorCertificationModalProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [certificationStatus, setCertificationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');

  const [formData, setFormData] = useState({
    realName: '',
    idNumber: '',
    phone: '',
    email: '',
    bio: '',
    portfolio: '',
    documents: [] as File[],
    agreeToTerms: false,
  });

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      if (formData.documents.length + newFiles.length > 5) {
        toast.error('最多上传5个文件');
        return;
      }
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...newFiles]
      }));
      toast.success('文件上传成功');
    }
  }, [formData.documents.length]);

  const removeFile = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.realName.trim()) {
      toast.error('请输入真实姓名');
      return;
    }
    if (!formData.idNumber.trim()) {
      toast.error('请输入身份证号');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('请输入联系电话');
      return;
    }
    if (!formData.agreeToTerms) {
      toast.error('请同意服务条款');
      return;
    }

    setIsSubmitting(true);
    try {
      // 模拟提交
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitSuccess(true);
      setCertificationStatus('pending');
      toast.success('认证申请已提交，我们会尽快审核');
    } catch (error) {
      toast.error('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      realName: '',
      idNumber: '',
      phone: '',
      email: '',
      bio: '',
      portfolio: '',
      documents: [],
      agreeToTerms: false,
    });
    setStep(1);
    setSelectedType('');
    setSubmitSuccess(false);
  }, []);

  const getStatusDisplay = () => {
    switch (certificationStatus) {
      case 'pending':
        return {
          icon: Clock,
          title: '审核中',
          description: '您的认证申请正在审核中，请耐心等待',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
        };
      case 'approved':
        return {
          icon: CheckCircle2,
          title: '已认证',
          description: '恭喜您已通过原创作者认证',
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-900/20'
        };
      case 'rejected':
        return {
          icon: XCircle,
          title: '认证失败',
          description: '您的认证申请未通过，请检查后重新提交',
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20'
        };
      default:
        return null;
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
              isDark ? 'bg-slate-900' : 'bg-white'
            }`}
          >
            {/* 头部 */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isDark ? 'border-slate-700' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    原创作者认证
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    进行原创作者认证，获得以下权益
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 内容区 */}
            <div className="h-[calc(90vh-80px)] overflow-y-auto p-6">
              {!submitSuccess ? (
                <div className="space-y-8">
                  {/* 权益展示 */}
                  {step === 1 && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {benefits.map((benefit, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-4 rounded-xl text-center ${
                              isDark ? 'bg-slate-800/50' : 'bg-slate-50'
                            }`}
                          >
                            <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                              isDark ? 'bg-slate-700' : 'bg-white'
                            }`}>
                              <benefit.icon className="w-6 h-6 text-blue-500" />
                            </div>
                            <h4 className={`font-medium mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                              {benefit.title}
                            </h4>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {benefit.description}
                            </p>
                          </motion.div>
                        ))}
                      </div>

                      {/* 认证类型选择 */}
                      <div>
                        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          选择认证类型
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {certificationTypes.map((type) => (
                            <button
                              key={type.id}
                              onClick={() => setSelectedType(type.id)}
                              className={`p-5 rounded-xl border text-left transition-all ${
                                selectedType === type.id
                                  ? `border-${type.color}-500 bg-${type.color}-50 dark:bg-${type.color}-900/20`
                                  : isDark
                                    ? 'border-slate-700 hover:border-slate-600'
                                    : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                                selectedType === type.id
                                  ? `bg-${type.color}-500`
                                  : isDark ? 'bg-slate-700' : 'bg-slate-100'
                              }`}>
                                <type.icon className={`w-6 h-6 ${
                                  selectedType === type.id ? 'text-white' : `text-${type.color}-500`
                                }`} />
                              </div>
                              <h4 className={`font-semibold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                {type.title}
                              </h4>
                              <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {type.description}
                              </p>
                              <div className="space-y-1">
                                <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                  认证要求:
                                </p>
                                {type.requirements.map((req, idx) => (
                                  <div key={idx} className="flex items-center gap-1">
                                    <Check className={`w-3 h-3 text-${type.color}-500`} />
                                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                      {req}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => setStep(2)}
                        disabled={!selectedType}
                        className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        下一步
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* 填写信息 */}
                  {step === 2 && (
                    <>
                      <div className="flex items-center gap-2 mb-6">
                        <button
                          onClick={() => setStep(1)}
                          className={`text-sm ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          返回上一步
                        </button>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            基本信息
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                真实姓名 <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                                  isDark ? 'text-slate-500' : 'text-slate-400'
                                }`} />
                                <input
                                  type="text"
                                  value={formData.realName}
                                  onChange={(e) => setFormData(prev => ({ ...prev, realName: e.target.value }))}
                                  placeholder="请输入真实姓名"
                                  className={`w-full pl-10 pr-3 py-2 rounded-lg text-sm ${
                                    isDark
                                      ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                                      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                />
                              </div>
                            </div>
                            <div>
                              <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                身份证号 <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={formData.idNumber}
                                onChange={(e) => setFormData(prev => ({ ...prev, idNumber: e.target.value }))}
                                placeholder="请输入身份证号"
                                className={`w-full px-3 py-2 rounded-lg text-sm ${
                                  isDark
                                    ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                                    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                              />
                            </div>
                            <div>
                              <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                联系电话 <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                                  isDark ? 'text-slate-500' : 'text-slate-400'
                                }`} />
                                <input
                                  type="tel"
                                  value={formData.phone}
                                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                  placeholder="请输入联系电话"
                                  className={`w-full pl-10 pr-3 py-2 rounded-lg text-sm ${
                                    isDark
                                      ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                                      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                />
                              </div>
                            </div>
                            <div>
                              <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                电子邮箱
                              </label>
                              <div className="relative">
                                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                                  isDark ? 'text-slate-500' : 'text-slate-400'
                                }`} />
                                <input
                                  type="email"
                                  value={formData.email}
                                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                  placeholder="请输入电子邮箱"
                                  className={`w-full pl-10 pr-3 py-2 rounded-lg text-sm ${
                                    isDark
                                      ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                                      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            创作者信息
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                个人简介
                              </label>
                              <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                placeholder="请简要介绍您的创作领域和经历"
                                rows={3}
                                className={`w-full px-3 py-2 rounded-lg text-sm resize-none ${
                                  isDark
                                    ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                                    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                              />
                            </div>
                            <div>
                              <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                作品集链接
                              </label>
                              <div className="relative">
                                <LinkIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                                  isDark ? 'text-slate-500' : 'text-slate-400'
                                }`} />
                                <input
                                  type="text"
                                  value={formData.portfolio}
                                  onChange={(e) => setFormData(prev => ({ ...prev, portfolio: e.target.value }))}
                                  placeholder="请输入您的作品集链接（可选）"
                                  className={`w-full pl-10 pr-3 py-2 rounded-lg text-sm ${
                                    isDark
                                      ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                                      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            认证材料
                          </h3>
                          <div className={`border-2 border-dashed rounded-xl p-6 text-center ${
                            isDark ? 'border-slate-700 hover:border-slate-600' : 'border-slate-300 hover:border-slate-400'
                          } transition-colors cursor-pointer`}>
                            <input
                              type="file"
                              multiple
                              onChange={handleFileUpload}
                              className="hidden"
                              id="certification-documents"
                              accept="image/*,.pdf,.doc,.docx"
                            />
                            <label htmlFor="certification-documents" className="cursor-pointer">
                              <Upload className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                点击上传认证材料
                              </p>
                              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-1`}>
                                支持身份证、职称证书、作品证明等，最多5个文件
                              </p>
                            </label>
                          </div>
                          {formData.documents.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {formData.documents.map((file, index) => (
                                <div key={index} className={`flex items-center gap-2 p-2 rounded-lg ${
                                  isDark ? 'bg-slate-800' : 'bg-slate-100'
                                }`}>
                                  <FileText className="w-4 h-4 text-blue-500" />
                                  <span className={`text-sm flex-1 truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {file.name}
                                  </span>
                                  <button
                                    onClick={() => removeFile(index)}
                                    className="text-red-500 hover:text-red-600"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.agreeToTerms}
                              onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                              className="w-4 h-4 mt-0.5 text-blue-500 rounded"
                            />
                            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              我已阅读并同意《原创作者认证服务协议》，确认所提供的信息真实有效，
                              并授权平台进行认证审核。我承诺遵守平台的原创保护规则，
                              如提供虚假信息愿意承担相应责任。
                            </span>
                          </label>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => setStep(1)}
                            className={`flex-1 py-3 rounded-xl font-medium ${
                              isDark
                                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            } transition-colors`}
                          >
                            上一步
                          </button>
                          <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                提交中...
                              </>
                            ) : (
                              <>
                                <Shield className="w-5 h-5" />
                                提交认证
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  {statusDisplay && (
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-full ${statusDisplay.bgColor} flex items-center justify-center`}>
                      <statusDisplay.icon className={`w-10 h-10 ${statusDisplay.color}`} />
                    </div>
                  )}
                  <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {statusDisplay?.title || '提交成功'}
                  </h3>
                  <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {statusDisplay?.description || '您的认证申请已提交，我们会尽快审核'}
                  </p>
                  
                  {certificationStatus === 'pending' && (
                    <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                      <h4 className={`font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        审核进度
                      </h4>
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          <span className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>提交申请</span>
                        </div>
                        <div className="w-16 h-0.5 bg-green-500" />
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                            <Clock className="w-4 h-4 text-white" />
                          </div>
                          <span className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>审核中</span>
                        </div>
                        <div className={`w-16 h-0.5 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'} flex items-center justify-center`}>
                            <BadgeCheck className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                          </div>
                          <span className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>认证完成</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 justify-center">
                    {certificationStatus === 'rejected' && (
                      <button
                        onClick={resetForm}
                        className={`px-6 py-2 rounded-lg ${
                          isDark
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        } transition-colors`}
                      >
                        重新申请
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      完成
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
