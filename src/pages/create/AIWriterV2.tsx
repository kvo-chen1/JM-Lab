import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import {
  ThreeColumnLayout,
  TemplateSidebar,
  TemplatePreview,
  InputPanel,
  Header,
  defaultCategories,
  sampleTemplates,
  OutlineEditor,
} from '@/components/ai-writer';

import type { Template, OutlineTemplate } from '@/components/ai-writer';

export default function AIWriterV2() {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // 状态管理
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedModel, setSelectedModel] = useState('tongyi');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [showOutlineEditor, setShowOutlineEditor] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<Record<string, string>>({});

  // 过滤模板
  const filteredTemplates = useMemo(() => {
    if (activeCategory === 'all') return sampleTemplates;
    return sampleTemplates.filter(
      (t) => t.category === defaultCategories.find((c) => c.id === activeCategory)?.name
    );
  }, [activeCategory]);

  // 处理分类切换
  const handleCategoryChange = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
    // 如果当前选中的模板不在新分类中，取消选中
    if (categoryId !== 'all' && selectedTemplate) {
      const categoryName = defaultCategories.find((c) => c.id === categoryId)?.name;
      if (selectedTemplate.category !== categoryName) {
        setSelectedTemplate(null);
      }
    }
  }, [selectedTemplate]);

  // 处理模板选择
  const handleSelectTemplate = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setShowResult(false);
    setGeneratedContent('');
  }, []);

  // 处理表单提交 - 打开大纲编辑器
  const handleSubmit = useCallback(async (formData: Record<string, string>) => {
    if (!selectedTemplate) return;

    // 保存表单数据并打开大纲编辑器
    setPendingFormData(formData);
    setShowOutlineEditor(true);
  }, [selectedTemplate]);

  // 处理大纲编辑器生成
  const handleOutlineGenerate = useCallback((outline: OutlineTemplate, formData: Record<string, string>) => {
    // 关闭大纲编辑器并跳转到编辑页面
    setShowOutlineEditor(false);
    
    // 跳转到编辑页面，传递大纲信息和表单数据
    navigate('/create/ai-writer-editor', {
      state: {
        templateId: outline.id,
        templateName: outline.name,
        formData: formData,
        outline: outline,
      },
    });
  }, [navigate]);

  // 构建提示词
  const buildPrompt = (template: Template, formData: Record<string, string>): string => {
    const parts = [
      `请根据以下信息生成一份${template.name}：`,
      '',
      `【项目/公司名称】${formData.projectName || '未填写'}`,
    ];

    if (formData.coreBusiness) {
      parts.push(`【核心业务】${formData.coreBusiness}`);
    }
    if (formData.targetMarket) {
      parts.push(`【目标市场】${formData.targetMarket}`);
    }
    if (formData.competitiveAdvantage) {
      parts.push(`【竞争优势】${formData.competitiveAdvantage}`);
    }

    parts.push('', `请按照以下结构生成：${template.sections.map((s) => s.name).join('、')}`);

    return parts.join('\n');
  };

  // 模拟生成内容
  const generateMockContent = (template: Template, formData: Record<string, string>): string => {
    const projectName = formData.projectName || '示例项目';

    return `# ${projectName} - ${template.name}

## 1. 执行摘要

${projectName}是一个创新性的项目，致力于通过先进的技术和优质的服务，为用户创造独特的价值。我们的团队拥有丰富的行业经验和强大的技术实力，有信心在激烈的市场竞争中脱颖而出。

## 2. 公司概述

${projectName}成立于2024年，总部位于中国。我们专注于${formData.coreBusiness || '核心业务领域'}，致力于成为行业的领导者。

## 3. 问题与解决方案

### 3.1 市场痛点
当前市场存在以下主要问题：
- 用户需求未被充分满足
- 现有解决方案效率低下
- 服务质量参差不齐

### 3.2 我们的解决方案
${projectName}提供创新的解决方案：
- 采用最新技术提升效率
- 以用户为中心的设计理念
- 专业团队提供优质服务

## 4. 产品介绍

我们的核心产品具有以下特点：
- **创新性**：采用行业领先的技术
- **易用性**：简洁直观的用户界面
- **可靠性**：稳定高效的服务保障

## 5. 市场分析

### 5.1 目标市场
${formData.targetMarket || '目标市场分析'}

### 5.2 市场规模
根据行业研究数据，目标市场规模预计将达到数十亿元，年增长率超过20%。

## 6. 竞争分析

### 6.1 竞争优势
${formData.competitiveAdvantage || '我们的核心竞争优势包括：'}
- 技术创新能力强
- 团队经验丰富
- 客户口碑良好

### 6.2 竞争策略
我们将通过差异化竞争策略，在细分市场中建立领先地位。

## 7. 商业模式

### 7.1 收入来源
- 产品销售
- 服务收费
- 增值服务

### 7.2 成本结构
- 研发投入
- 运营成本
- 市场推广

## 8. 财务预测

基于当前市场情况和公司发展规划，预计未来三年：
- 第一年：实现盈亏平衡
- 第二年：收入增长率达到100%
- 第三年：实现规模化盈利

---

*本文档由AI智作文案生成，仅供参考。*
`;
  };

  // 渲染模板列表（用于中栏未选择模板时显示）
  const renderTemplateList = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {activeCategory === 'all'
            ? '所有模板'
            : defaultCategories.find((c) => c.id === activeCategory)?.name}
        </h2>
        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          共 {filteredTemplates.length} 个模板
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleSelectTemplate(template)}
            className={`p-5 rounded-xl cursor-pointer transition-all duration-200 border ${
              selectedTemplate?.id === template.id
                ? isDark
                  ? 'bg-blue-500/10 border-blue-500'
                  : 'bg-blue-50 border-blue-500'
                : isDark
                ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* 彩色图标 */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${template.categoryColor}20` }}
              >
                <svg
                  className="w-6 h-6"
                  style={{ color: template.categoryColor }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {template.name}
                  </h3>
                  {template.isFeatured && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                      精选
                    </span>
                  )}
                </div>
                <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {template.description}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: template.categoryColor }}
                  >
                    {template.category}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {template.usageCount?.toLocaleString()} 次使用
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // 处理选择历史记录
  const handleSelectHistoryItem = (item: any) => {
    toast.info(`已选择：${item.title}`);
    // 跳转到编辑页面并加载历史记录
    navigate('/create/ai-writer-editor', {
      state: {
        historyItemId: item.id,
        templateId: item.templateId,
        templateName: item.templateName,
        content: item.content,
        formData: item.formData,
      },
    });
  };

  return (
    <>
      <ThreeColumnLayout
        header={
          <Header
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            onHistoryClick={() => navigate('/create/ai-writer/history')}
          />
        }
      leftSidebar={
        <TemplateSidebar
          categories={defaultCategories}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      }
      mainContent={
        <AnimatePresence mode="wait">
          {showResult ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* 结果头部 */}
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      生成结果
                    </h2>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      基于 {selectedTemplate?.name} 模板生成
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowResult(false)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isDark
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      返回编辑
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedContent);
                        toast.success('已复制到剪贴板');
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      复制内容
                    </button>
                  </div>
                </div>
              </div>

              {/* 生成的内容 */}
              <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <pre
                  className={`whitespace-pre-wrap font-sans text-sm leading-relaxed ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {generatedContent}
                </pre>
              </div>
            </motion.div>
          ) : selectedTemplate ? (
            <motion.div key="preview">
              <TemplatePreview
                template={selectedTemplate}
                onUseTemplate={handleSelectTemplate}
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderTemplateList()}
            </motion.div>
          )}
        </AnimatePresence>
      }
      rightSidebar={
        <InputPanel
          template={selectedTemplate}
          onSubmit={handleSubmit}
          isGenerating={isGenerating}
        />
      }
      />

      {showOutlineEditor && selectedTemplate && (
        <OutlineEditor
          template={selectedTemplate}
          onClose={() => setShowOutlineEditor(false)}
          onGenerate={handleOutlineGenerate}
          initialFormData={pendingFormData}
        />
      )}
    </>
  );
}
