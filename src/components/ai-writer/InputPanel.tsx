import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Sparkles, X, Check, Loader2 } from 'lucide-react';
import type { Template } from './TemplatePreview';

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  helperText?: string;
}

interface InputPanelProps {
  template: Template | null;
  onSubmit?: (data: Record<string, string>) => void;
  isGenerating?: boolean;
  onOptimizePrompt?: (fieldId: string, currentValue: string, fieldLabel: string) => Promise<string>;
}

// 根据模板类型生成对应的表单字段
const generateFormFields = (template: Template | null): FormField[] => {
  if (!template) return [];

  const baseFields: FormField[] = [
    {
      id: 'projectName',
      label: '项目/公司名称',
      type: 'text',
      placeholder: '例如：未来科技',
      required: true,
      helperText: '请输入您的项目或公司全称',
    },
  ];

  switch (template.category) {
    case '商业文档':
      return [
        ...baseFields,
        {
          id: 'coreBusiness',
          label: '核心业务/产品',
          type: 'textarea',
          placeholder: '例如：AI驱动的教育平台，提供个性化学习方案...',
          required: true,
          helperText: '简要描述您的产品或服务是什么',
        },
        {
          id: 'targetMarket',
          label: '目标市场',
          type: 'text',
          placeholder: '例如：K12教育市场、企业培训领域...',
          required: true,
          helperText: '您的目标客户群体是谁',
        },
        {
          id: 'competitiveAdvantage',
          label: '核心竞争优势',
          type: 'textarea',
          placeholder: '例如：独家算法、海量数据、专业团队...',
          required: true,
          helperText: '与竞争对手相比，您的独特优势是什么',
        },
        {
          id: 'fundingAmount',
          label: '融资金额（可选）',
          type: 'text',
          placeholder: '例如：500万人民币',
          helperText: '如果是融资计划书，请填写期望融资金额',
        },
      ];

    case '产品文档':
      return [
        ...baseFields,
        {
          id: 'productDescription',
          label: '产品描述',
          type: 'textarea',
          placeholder: '详细描述产品的功能、特性和使用场景...',
          required: true,
          helperText: '请尽可能详细地描述您的产品',
        },
        {
          id: 'targetUsers',
          label: '目标用户',
          type: 'text',
          placeholder: '例如：25-35岁职场白领、大学生群体...',
          required: true,
          helperText: '描述您的目标用户画像',
        },
        {
          id: 'userPainPoints',
          label: '用户痛点',
          type: 'textarea',
          placeholder: '例如：学习效率低、信息获取困难...',
          required: true,
          helperText: '用户目前面临什么问题',
        },
      ];

    case '社交媒体':
      return [
        ...baseFields,
        {
          id: 'contentTheme',
          label: '内容主题',
          type: 'text',
          placeholder: '例如：新品发布、活动推广、知识分享...',
          required: true,
          helperText: '您希望发布什么类型的内容',
        },
        {
          id: 'keyMessage',
          label: '核心信息',
          type: 'textarea',
          placeholder: '您希望传达给受众的关键信息...',
          required: true,
          helperText: '用简短的话概括您想表达的核心内容',
        },
        {
          id: 'tone',
          label: '文案风格',
          type: 'select',
          placeholder: '选择文案风格',
          required: true,
          options: [
            { value: 'professional', label: '专业严谨' },
            { value: 'casual', label: '轻松随意' },
            { value: 'humorous', label: '幽默风趣' },
            { value: 'emotional', label: '感性温暖' },
            { value: 'urgent', label: '紧迫促单' },
          ],
          helperText: '选择适合您品牌调性的文案风格',
        },
      ];

    case '营销推广':
      return [
        ...baseFields,
        {
          id: 'campaignGoal',
          label: '营销目标',
          type: 'select',
          placeholder: '选择营销目标',
          required: true,
          options: [
            { value: 'brand', label: '品牌曝光' },
            { value: 'conversion', label: '转化销售' },
            { value: 'engagement', label: '用户互动' },
            { value: 'retention', label: '客户留存' },
          ],
          helperText: '您希望通过这次营销达成什么目标',
        },
        {
          id: 'productHighlights',
          label: '产品卖点',
          type: 'textarea',
          placeholder: '列出您的产品最吸引人的3-5个卖点...',
          required: true,
          helperText: '消费者为什么要选择您的产品',
        },
        {
          id: 'promotion',
          label: '促销信息（可选）',
          type: 'text',
          placeholder: '例如：限时8折、买一送一...',
          helperText: '如果有促销活动，请填写相关信息',
        },
      ];

    default:
      return [
        ...baseFields,
        {
          id: 'description',
          label: '详细描述',
          type: 'textarea',
          placeholder: '请详细描述您的需求...',
          required: true,
          helperText: '提供越详细的信息，AI生成的内容越精准',
        },
      ];
  }
};

export const InputPanel: React.FC<InputPanelProps> = ({
  template,
  onSubmit,
  isGenerating = false,
  onOptimizePrompt,
}) => {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [optimizingField, setOptimizingField] = useState<string | null>(null);
  const [optimizedContent, setOptimizedContent] = useState<{ fieldId: string; content: string } | null>(null);

  const fields = generateFormFields(template);

  const handleChange = useCallback((fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    // 验证必填字段
    const missingFields = fields.filter(
      (field) => field.required && !formData[field.id]?.trim()
    );

    if (missingFields.length > 0) {
      // 可以在这里添加错误提示
      return;
    }

    onSubmit?.(formData);
  }, [fields, formData, onSubmit]);

  const handleReset = useCallback(() => {
    setFormData({});
    setOptimizedContent(null);
  }, []);

  const handleOptimize = useCallback(async (field: FormField) => {
    if (!onOptimizePrompt || !formData[field.id]?.trim()) return;
    
    setOptimizingField(field.id);
    try {
      const optimized = await onOptimizePrompt(field.id, formData[field.id], field.label);
      setOptimizedContent({ fieldId: field.id, content: optimized });
    } catch (error) {
      console.error('优化失败:', error);
    } finally {
      setOptimizingField(null);
    }
  }, [onOptimizePrompt, formData]);

  const handleAcceptOptimization = useCallback(() => {
    if (optimizedContent) {
      setFormData(prev => ({ ...prev, [optimizedContent.fieldId]: optimizedContent.content }));
      setOptimizedContent(null);
    }
  }, [optimizedContent]);

  const handleRejectOptimization = useCallback(() => {
    setOptimizedContent(null);
  }, []);

  if (!template) {
    return (
      <div className={`flex flex-col items-center justify-center h-full py-20 px-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <h3 className="text-base font-medium mb-1">选择模板后填写</h3>
        <p className="text-sm text-center">
          请先选择一个模板，然后在右侧填写相关信息
        </p>
      </div>
    );
  }

  const isFormValid = fields.every(
    (field) => !field.required || formData[field.id]?.trim()
  );

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className={`p-5 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              填写关键信息
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              完善以下信息，AI将为您生成专业文案
            </p>
          </div>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <AnimatePresence mode="wait">
          {fields.map((field, index) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="space-y-2"
            >
              {/* 标签 */}
              <div className="flex items-center justify-between">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {/* AI优化按钮 - 仅对textarea字段显示 */}
                {field.type === 'textarea' && onOptimizePrompt && formData[field.id]?.trim() && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOptimize(field)}
                    disabled={optimizingField === field.id || isGenerating}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                      optimizingField === field.id
                        ? isDark
                          ? 'bg-purple-500/20 text-purple-400 cursor-wait'
                          : 'bg-purple-100 text-purple-600 cursor-wait'
                        : isDark
                        ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                        : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                    }`}
                  >
                    {optimizingField === field.id ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        优化中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        AI优化
                      </>
                    )}
                  </motion.button>
                )}
              </div>

              {/* 输入框 */}
              {field.type === 'textarea' ? (
                <>
                  <textarea
                    value={formData[field.id] || ''}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    onFocus={() => setFocusedField(field.id)}
                    onBlur={() => setFocusedField(null)}
                    placeholder={field.placeholder}
                    rows={4}
                    className={`w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 resize-none ${
                      focusedField === field.id
                        ? isDark
                          ? 'bg-gray-800 border-blue-500 ring-2 ring-blue-500/20'
                          : 'bg-white border-blue-500 ring-2 ring-blue-500/20'
                        : isDark
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    } border-2 outline-none`}
                  />
                  {/* 优化结果展示 */}
                  {optimizedContent?.fieldId === field.id && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`mt-3 p-4 rounded-xl border-2 ${
                        isDark
                          ? 'bg-purple-500/10 border-purple-500/30'
                          : 'bg-purple-50 border-purple-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        <span className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                          AI优化建议
                        </span>
                      </div>
                      <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {optimizedContent.content}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleAcceptOptimization}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                            isDark
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          采用
                        </button>
                        <button
                          onClick={handleRejectOptimization}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                            isDark
                              ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          <X className="w-3 h-3" />
                          放弃
                        </button>
                      </div>
                    </motion.div>
                  )}
                </>
              ) : field.type === 'select' ? (
                <div className="relative">
                  <select
                    value={formData[field.id] || ''}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    onFocus={() => setFocusedField(field.id)}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 appearance-none cursor-pointer ${
                      focusedField === field.id
                        ? isDark
                          ? 'bg-gray-800 border-blue-500 ring-2 ring-blue-500/20'
                          : 'bg-white border-blue-500 ring-2 ring-blue-500/20'
                        : isDark
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    } border-2 outline-none`}
                  >
                    <option value="">{field.placeholder || '请选择'}</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <svg
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              ) : (
                <input
                  type={field.type}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  onFocus={() => setFocusedField(field.id)}
                  onBlur={() => setFocusedField(null)}
                  placeholder={field.placeholder}
                  className={`w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                    focusedField === field.id
                      ? isDark
                        ? 'bg-gray-800 border-blue-500 ring-2 ring-blue-500/20'
                        : 'bg-white border-blue-500 ring-2 ring-blue-500/20'
                      : isDark
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  } border-2 outline-none`}
                />
              )}

              {/* 辅助文字 */}
              {field.helperText && (
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {field.helperText}
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 底部操作区 */}
      <div className={`p-5 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'} space-y-3`}>
        {/* AI生成按钮 */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={!isFormValid || isGenerating}
          className={`w-full py-3.5 px-6 rounded-xl text-base font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            isFormValid && !isGenerating
              ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25'
              : isDark
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              AI生成中...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI生成文案
            </>
          )}
        </motion.button>

        {/* 重置按钮 */}
        <button
          onClick={handleReset}
          disabled={isGenerating || Object.keys(formData).length === 0}
          className={`w-full py-2.5 px-6 rounded-xl text-sm font-medium transition-all duration-200 ${
            Object.keys(formData).length > 0 && !isGenerating
              ? isDark
                ? 'text-gray-300 hover:bg-gray-800'
                : 'text-gray-600 hover:bg-gray-100'
              : isDark
              ? 'text-gray-600 cursor-not-allowed'
              : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          重置表单
        </button>
      </div>
    </div>
  );
};

export default InputPanel;
