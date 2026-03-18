import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import {
  X,
  Globe,
  ExternalLink,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Shield,
  BookOpen,
  MessageCircle,
  HelpCircle,
  Send,
  Link as LinkIcon,
  Building2,
  User
} from 'lucide-react';

interface ExternalProtectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const platforms = [
  { id: 'weibo', name: '微博', icon: '🔴', description: '新浪微博平台' },
  { id: 'wechat', name: '微信公众号', icon: '💬', description: '微信公众账号' },
  { id: 'douyin', name: '抖音', icon: '🎵', description: '抖音短视频平台' },
  { id: 'kuaishou', name: '快手', icon: '⚡', description: '快手短视频平台' },
  { id: 'bilibili', name: 'B站', icon: '📺', description: '哔哩哔哩视频平台' },
  { id: 'xiaohongshu', name: '小红书', icon: '📕', description: '小红书社区' },
  { id: 'zhihu', name: '知乎', icon: '❓', description: '知乎问答社区' },
  { id: 'other', name: '其他平台', icon: '🌐', description: '其他网站或平台' },
];

const infringementTypes = [
  { id: 'unauthorized_copy', label: '未经授权复制', description: '作品被完整或部分复制' },
  { id: 'unauthorized_modify', label: '未经授权修改', description: '作品被修改后发布' },
  { id: 'unauthorized_share', label: '未经授权转载', description: '作品被转载到其他平台' },
  { id: 'commercial_use', label: '商业使用', description: '作品被用于商业目的' },
  { id: 'remove_watermark', label: '去除水印', description: '作品水印被去除后发布' },
  { id: 'impersonation', label: '冒充原创', description: '他人冒充原创作者发布' },
];

const guidanceSteps = [
  {
    title: '收集证据',
    description: '截图保存侵权内容、记录侵权链接、保存发布时间等信息',
    icon: Upload,
  },
  {
    title: '联系平台',
    description: '通过平台官方渠道提交侵权投诉，大多数平台都有版权保护机制',
    icon: MessageCircle,
  },
  {
    title: '提交申诉',
    description: '按照平台要求提交版权证明和侵权证据',
    icon: Send,
  },
  {
    title: '跟进处理',
    description: '关注处理进度，如有需要可补充材料或升级投诉',
    icon: CheckCircle2,
  },
];

export default function ExternalProtectionModal({ isOpen, onClose }: ExternalProtectionModalProps) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'report' | 'guide'>('report');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState({
    platform: '',
    infringementUrl: '',
    originalUrl: '',
    infringementType: '',
    description: '',
    evidence: [] as File[],
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    agreeToTerms: false,
  });

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      if (formData.evidence.length + newFiles.length > 5) {
        toast.error('最多上传5个文件');
        return;
      }
      setFormData(prev => ({
        ...prev,
        evidence: [...prev.evidence, ...newFiles]
      }));
      toast.success('文件上传成功');
    }
  }, [formData.evidence.length]);

  const removeFile = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index)
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.platform) {
      toast.error('请选择侵权平台');
      return;
    }
    if (!formData.infringementUrl.trim()) {
      toast.error('请输入侵权链接');
      return;
    }
    if (!formData.infringementType) {
      toast.error('请选择侵权类型');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('请描述侵权情况');
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
      toast.success('站外维权申请已提交，我们会尽快处理');
    } catch (error) {
      toast.error('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      platform: '',
      infringementUrl: '',
      originalUrl: '',
      infringementType: '',
      description: '',
      evidence: [],
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      agreeToTerms: false,
    });
    setStep(1);
    setSubmitSuccess(false);
  }, []);

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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    站外维权
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    处理站外平台的侵权问题
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

            {/* 标签切换 */}
            <div className={`flex border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <button
                onClick={() => setActiveTab('report')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'report'
                    ? 'text-blue-500 border-b-2 border-blue-500'
                    : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                提交维权
              </button>
              <button
                onClick={() => setActiveTab('guide')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'guide'
                    ? 'text-blue-500 border-b-2 border-blue-500'
                    : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                维权指南
              </button>
            </div>

            {/* 内容区 */}
            <div className="h-[calc(90vh-140px)] overflow-y-auto p-6">
              {activeTab === 'report' ? (
                !submitSuccess ? (
                  <div className="space-y-6">
                    {/* 步骤指示器 */}
                    <div className="flex items-center gap-2">
                      {[1, 2, 3].map((s) => (
                        <React.Fragment key={s}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            step >= s
                              ? 'bg-blue-500 text-white'
                              : isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {s}
                          </div>
                          {s < 3 && (
                            <div className={`flex-1 h-0.5 ${
                              step > s ? 'bg-blue-500' : isDark ? 'bg-slate-800' : 'bg-slate-200'
                            }`} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* 步骤1: 选择平台和填写链接 */}
                    {step === 1 && (
                      <div className="space-y-6">
                        <div>
                          <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            选择侵权平台
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {platforms.map((platform) => (
                              <button
                                key={platform.id}
                                onClick={() => setFormData(prev => ({ ...prev, platform: platform.id }))}
                                className={`p-3 rounded-xl border text-left transition-all ${
                                  formData.platform === platform.id
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : isDark
                                      ? 'border-slate-700 hover:border-slate-600'
                                      : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <span className="text-2xl">{platform.icon}</span>
                                <p className={`font-medium mt-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                  {platform.name}
                                </p>
                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {platform.description}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            填写链接信息
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                侵权链接 <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <LinkIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                                  isDark ? 'text-slate-500' : 'text-slate-400'
                                }`} />
                                <input
                                  type="text"
                                  value={formData.infringementUrl}
                                  onChange={(e) => setFormData(prev => ({ ...prev, infringementUrl: e.target.value }))}
                                  placeholder="请输入侵权内容的链接"
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
                                原作品链接（可选）
                              </label>
                              <div className="relative">
                                <LinkIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                                  isDark ? 'text-slate-500' : 'text-slate-400'
                                }`} />
                                <input
                                  type="text"
                                  value={formData.originalUrl}
                                  onChange={(e) => setFormData(prev => ({ ...prev, originalUrl: e.target.value }))}
                                  placeholder="请输入您原创作品的链接"
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

                        <button
                          onClick={() => setStep(2)}
                          disabled={!formData.platform || !formData.infringementUrl.trim()}
                          className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          下一步
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    {/* 步骤2: 侵权详情 */}
                    {step === 2 && (
                      <div className="space-y-6">
                        <div>
                          <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            选择侵权类型
                          </h3>
                          <div className="space-y-3">
                            {infringementTypes.map((type) => (
                              <button
                                key={type.id}
                                onClick={() => setFormData(prev => ({ ...prev, infringementType: type.id }))}
                                className={`w-full p-4 rounded-xl border text-left transition-all ${
                                  formData.infringementType === type.id
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : isDark
                                      ? 'border-slate-700 hover:border-slate-600'
                                      : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    formData.infringementType === type.id
                                      ? 'border-blue-500'
                                      : isDark ? 'border-slate-600' : 'border-slate-300'
                                  }`}>
                                    {formData.infringementType === type.id && (
                                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                      {type.label}
                                    </p>
                                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                      {type.description}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            详细描述
                          </h3>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="请详细描述侵权情况，包括发现时间、侵权程度等信息"
                            rows={4}
                            className={`w-full px-3 py-2 rounded-lg text-sm resize-none ${
                              isDark
                                ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                                : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          />
                        </div>

                        <div>
                          <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            上传证据
                          </h3>
                          <div className={`border-2 border-dashed rounded-xl p-6 text-center ${
                            isDark ? 'border-slate-700 hover:border-slate-600' : 'border-slate-300 hover:border-slate-400'
                          } transition-colors cursor-pointer`}>
                            <input
                              type="file"
                              multiple
                              onChange={handleFileUpload}
                              className="hidden"
                              id="external-evidence-upload"
                              accept="image/*,.pdf,.doc,.docx"
                            />
                            <label htmlFor="external-evidence-upload" className="cursor-pointer">
                              <Upload className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                点击上传证据文件
                              </p>
                              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-1`}>
                                支持图片、PDF、文档格式，最多5个文件
                              </p>
                            </label>
                          </div>
                          {formData.evidence.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {formData.evidence.map((file, index) => (
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
                            onClick={() => setStep(3)}
                            disabled={!formData.infringementType || !formData.description.trim()}
                            className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            下一步
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 步骤3: 联系方式和提交 */}
                    {step === 3 && (
                      <div className="space-y-6">
                        <div>
                          <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            联系方式
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                联系人姓名
                              </label>
                              <div className="relative">
                                <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                                  isDark ? 'text-slate-500' : 'text-slate-400'
                                }`} />
                                <input
                                  type="text"
                                  value={formData.contactName}
                                  onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                                  placeholder="请输入联系人姓名"
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
                                联系邮箱
                              </label>
                              <input
                                type="email"
                                value={formData.contactEmail}
                                onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                                placeholder="请输入联系邮箱"
                                className={`w-full px-3 py-2 rounded-lg text-sm ${
                                  isDark
                                    ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                                    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                              />
                            </div>
                            <div>
                              <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                联系电话
                              </label>
                              <input
                                type="tel"
                                value={formData.contactPhone}
                                onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                                placeholder="请输入联系电话"
                                className={`w-full px-3 py-2 rounded-lg text-sm ${
                                  isDark
                                    ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                                    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                              />
                            </div>
                          </div>
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
                              我已阅读并同意《站外维权服务协议》，确认所提供的信息真实有效，
                              并授权平台协助处理该侵权投诉。
                            </span>
                          </label>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => setStep(2)}
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
                            disabled={isSubmitting || !formData.agreeToTerms}
                            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                提交中...
                              </>
                            ) : (
                              <>
                                <Send className="w-5 h-5" />
                                提交申请
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      提交成功
                    </h3>
                    <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      您的站外维权申请已提交，我们会在3个工作日内处理并反馈结果
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={resetForm}
                        className={`px-6 py-2 rounded-lg ${
                          isDark
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        } transition-colors`}
                      >
                        继续提交
                      </button>
                      <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        完成
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-6">
                  <div className={`p-6 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      站外维权流程
                    </h3>
                    <div className="space-y-4">
                      {guidanceSteps.map((step, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isDark ? 'bg-slate-700' : 'bg-white'
                            }`}>
                              <step.icon className="w-5 h-5 text-blue-500" />
                            </div>
                          </div>
                          <div>
                            <h4 className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                              {step.title}
                            </h4>
                            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {step.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`p-6 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      常见问题
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          什么是站外维权？
                        </h4>
                        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          站外维权是指当您的原创作品在其他平台被侵权时，通过平台协助或自行向侵权平台投诉，
                          要求删除侵权内容或获得相应赔偿的维权方式。
                        </p>
                      </div>
                      <div>
                        <h4 className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          维权需要多长时间？
                        </h4>
                        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          一般情况下，平台会在3-7个工作日内处理您的投诉。复杂案件可能需要更长时间，
                          我们会及时跟进并反馈进展。
                        </p>
                      </div>
                      <div>
                        <h4 className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          需要准备哪些材料？
                        </h4>
                        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          需要准备原创证明（如创作时间、源文件等）、侵权证据截图、
                          您的身份证明以及联系方式。
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'border-blue-800 bg-blue-900/20' : 'border-blue-200 bg-blue-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                          需要帮助？
                        </h4>
                        <p className={`text-sm mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                          如果您在维权过程中遇到困难，可以联系我们的客服团队获取专业指导。
                          客服邮箱：support@example.com
                        </p>
                      </div>
                    </div>
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
