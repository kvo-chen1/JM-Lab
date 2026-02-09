import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

export interface TemplateSection {
  id: string;
  name: string;
  description?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryColor?: string;
  icon?: React.ReactNode;
  previewImage?: string;
  sections: TemplateSection[];
  tags?: string[];
  usageCount?: number;
  isFeatured?: boolean;
}

interface TemplatePreviewProps {
  template: Template | null;
  onUseTemplate?: (template: Template) => void;
}

// 示例模板数据
export const sampleTemplates: Template[] = [
  {
    id: 'business-plan',
    name: '经典商业计划书',
    description: '适用于融资、路演的完整标准结构，包含执行摘要、市场分析、财务预测等核心章节',
    category: '商业文档',
    categoryColor: '#3b82f6',
    sections: [
      { id: '1', name: '执行摘要', description: '项目核心亮点概述' },
      { id: '2', name: '公司概述', description: '企业背景与愿景' },
      { id: '3', name: '问题与解决方案', description: '市场痛点与产品服务' },
      { id: '4', name: '产品介绍', description: '核心产品功能特性' },
      { id: '5', name: '市场分析', description: '目标市场规模趋势' },
      { id: '6', name: '竞争分析', description: '竞品对比与差异化' },
      { id: '7', name: '商业模式', description: '盈利方式与收入来源' },
      { id: '8', name: '财务预测', description: '3-5年财务规划' },
    ],
    tags: ['融资', '路演', '标准结构'],
    usageCount: 12580,
    isFeatured: true,
  },
  {
    id: 'lean-canvas',
    name: '精益创业画布',
    description: '适用于早期项目的快速验证与梳理，一页纸梳理商业模式全貌',
    category: '商业文档',
    categoryColor: '#3b82f6',
    sections: [
      { id: '1', name: '问题', description: '目标用户的核心痛点' },
      { id: '2', name: '客户细分', description: '早期采纳者画像' },
      { id: '3', name: '独特卖点', description: '一句话价值主张' },
      { id: '4', name: '解决方案', description: '产品核心功能' },
      { id: '5', name: '渠道', description: '获客路径与方式' },
      { id: '6', name: '收入来源', description: '定价与盈利模式' },
    ],
    tags: ['MVP', '验证', '画布'],
    usageCount: 8932,
  },
  {
    id: 'pitch-deck',
    name: '融资路演PPT文案',
    description: '适用于路演讲演的精简有力文案，配合演示文稿使用',
    category: '商业文档',
    categoryColor: '#3b82f6',
    sections: [
      { id: '1', name: '封面', description: '一句话定位' },
      { id: '2', name: '痛点', description: '市场机会描述' },
      { id: '3', name: '解决方案', description: '产品价值主张' },
      { id: '4', name: '市场规模', description: 'TAM/SAM/SOM分析' },
      { id: '5', name: '商业模式', description: '盈利路径说明' },
    ],
    tags: ['PPT', '路演', '投资人'],
    usageCount: 7654,
  },
  {
    id: 'market-analysis',
    name: '深度市场分析报告',
    description: '专注于行业趋势与竞争格局的深度分析',
    category: '商业文档',
    categoryColor: '#3b82f6',
    sections: [
      { id: '1', name: '行业概况', description: '宏观环境分析' },
      { id: '2', name: '市场规模', description: '容量与增长预测' },
      { id: '3', name: '竞争格局', description: '主要玩家分析' },
      { id: '4', name: '趋势洞察', description: '未来发展方向' },
    ],
    tags: ['行业研究', '竞争分析'],
    usageCount: 5421,
  },
  {
    id: 'prd',
    name: '产品需求文档(PRD)',
    description: '标准化的互联网产品需求定义文档',
    category: '产品文档',
    categoryColor: '#10b981',
    sections: [
      { id: '1', name: '文档说明', description: '版本历史与术语' },
      { id: '2', name: '产品概述', description: '背景与目标' },
      { id: '3', name: '功能需求', description: '详细功能描述' },
      { id: '4', name: '非功能需求', description: '性能安全要求' },
      { id: '5', name: '界面原型', description: '交互设计说明' },
    ],
    tags: ['PRD', '需求文档', '产品经理'],
    usageCount: 9876,
  },
  {
    id: 'social-media',
    name: '社交媒体文案',
    description: '适用于微信、微博、小红书等平台的营销文案',
    category: '社交媒体',
    categoryColor: '#8b5cf6',
    sections: [
      { id: '1', name: '标题', description: '吸睛标题文案' },
      { id: '2', name: '引言', description: '开场白设计' },
      { id: '3', name: '核心内容', description: '正文内容结构' },
      { id: '4', name: '互动引导', description: '评论引导话术' },
      { id: '5', name: '话题标签', description: '热门标签建议' },
    ],
    tags: ['小红书', '微信', '微博'],
    usageCount: 15432,
  },
  {
    id: 'ad-copy',
    name: '广告文案',
    description: '适用于各种广告媒体的精准营销文案',
    category: '营销推广',
    categoryColor: '#f59e0b',
    sections: [
      { id: '1', name: ' headline', description: '主标题文案' },
      { id: '2', name: '副标题', description: '补充说明文案' },
      { id: '3', name: '正文', description: '产品卖点阐述' },
      { id: '4', name: 'CTA', description: '行动号召按钮' },
    ],
    tags: ['广告', '投放', '转化'],
    usageCount: 11234,
  },
  {
    id: 'email-marketing',
    name: '营销邮件',
    description: '适用于客户沟通和促销活动的邮件文案',
    category: '营销推广',
    categoryColor: '#f59e0b',
    sections: [
      { id: '1', name: '主题行', description: '邮件标题设计' },
      { id: '2', name: '问候语', description: '个性化开场' },
      { id: '3', name: '正文', description: '核心信息传达' },
      { id: '4', name: 'CTA', description: '点击引导' },
      { id: '5', name: '签名', description: '品牌落款' },
    ],
    tags: ['EDM', '邮件营销', '客户沟通'],
    usageCount: 6789,
  },
];

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  onUseTemplate,
}) => {
  const { isDark } = useTheme();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  if (!template) {
    return (
      <div className={`flex flex-col items-center justify-center h-full py-20 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        <div className={`w-24 h-24 rounded-2xl flex items-center justify-center mb-6 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2">选择一个模板</h3>
        <p className="text-sm text-center max-w-sm">
          从左侧分类中选择一个模板，查看详情并开始创作
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* 模板头部信息 */}
      <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm`}>
        {/* 顶部彩色条 */}
        <div
          className="h-2"
          style={{ backgroundColor: template.categoryColor || '#3b82f6' }}
        />

        <div className="p-6">
          {/* 分类标签 + 精选标识 */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className="px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: template.categoryColor || '#3b82f6' }}
            >
              {template.category}
            </span>
            {template.isFeatured && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                精选模板
              </span>
            )}
          </div>

          {/* 模板名称 */}
          <h1 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {template.name}
          </h1>

          {/* 描述 */}
          <p className={`text-base leading-relaxed mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {template.description}
          </p>

          {/* 标签 */}
          {template.tags && template.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {template.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`px-2.5 py-1 rounded-lg text-xs ${
                    isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 使用统计 */}
          <div className={`flex items-center gap-4 mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center gap-1.5">
              <svg className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {template.usageCount?.toLocaleString() || 0} 次使用
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 内容章节大纲 */}
      <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm`}>
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            内容结构
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            该模板包含以下章节，AI将根据您的输入生成完整内容
          </p>
        </div>

        <div className="p-2">
          {template.sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onMouseEnter={() => setActiveSection(section.id)}
              onMouseLeave={() => setActiveSection(null)}
              className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer ${
                activeSection === section.id
                  ? isDark
                    ? 'bg-gray-700/50'
                    : 'bg-blue-50'
                  : ''
              }`}
            >
              {/* 序号 */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white'
                    : isDark
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {index + 1}
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <h3 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {section.name}
                </h3>
                {section.description && (
                  <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {section.description}
                  </p>
                )}
              </div>

              {/* 悬停指示 */}
              <AnimatePresence>
                {activeSection === section.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex-shrink-0"
                  >
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 使用模板按钮 */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onUseTemplate?.(template)}
        className="w-full py-4 px-6 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 transition-all duration-200 flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        使用此模板
      </motion.button>
    </motion.div>
  );
};

export default TemplatePreview;
