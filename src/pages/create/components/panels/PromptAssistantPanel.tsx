import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../../hooks/useCreateStore';
import { llmService } from '@/services/llmService';
import { toast } from 'sonner';
import { Sparkles, Wand2, History, Trash2, Check, X, Lightbulb, AlertCircle } from 'lucide-react';

// 提示词模板
const PROMPT_TEMPLATES = [
  {
    category: '艺术风格',
    templates: [
      { name: '国潮风格', template: '国潮插画，{subject}，传统纹样，红色金色配色，精细细节，高清画质' },
      { name: '水墨意境', template: '水墨画风格，{subject}，黑白灰色调，留白艺术，东方美学，意境深远' },
      { name: '赛博朋克', template: '赛博朋克风格，{subject}，霓虹灯光，紫色蓝色色调，未来科技感' },
      { name: '复古怀旧', template: '复古风格，{subject}，暖色调，胶片质感，怀旧氛围' },
    ]
  },
  {
    category: '光线效果',
    templates: [
      { name: '自然光', template: '{subject}，自然光照明，柔和阴影，真实质感' },
      { name: '霓虹光', template: '{subject}，霓虹灯光，夜晚场景，反射光效' },
      { name: '柔光', template: '{subject}，柔光照明，梦幻氛围，朦胧美感' },
      { name: '逆光', template: '{subject}，逆光拍摄，轮廓光，剪影效果' },
    ]
  },
  {
    category: '构图方式',
    templates: [
      { name: '对称构图', template: '{subject}，对称构图，平衡稳定，中心对齐' },
      { name: '黄金分割', template: '{subject}，黄金分割构图，视觉焦点，和谐比例' },
      { name: '三分法', template: '{subject}，三分法构图，九宫格，视觉引导' },
      { name: '框架构图', template: '{subject}，框架式构图，前景框架，深度感' },
    ]
  }
];

// 关键词建议
const KEYWORD_SUGGESTIONS = [
  '高清', '精细', '专业', '艺术', '创意',
  '传统', '现代', '抽象', '写实', '梦幻',
  '温暖', '冷峻', '明亮', '柔和', '对比',
  '简约', '复杂', '优雅', '动感', '静谧'
];

export const PromptAssistantPanel: React.FC = () => {
  const { isDark } = useTheme();
  const { 
    prompt, 
    setPrompt,
    optimizedPrompt,
    setOptimizedPrompt,
    promptHistory,
    addPromptHistory,
    removePromptFromHistory
  } = useCreateStore();

  const [activeTab, setActiveTab] = useState<'optimize' | 'templates' | 'history'>('optimize');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    score: number;
    presentElements: string[];
    missingElements: string[];
    suggestions: string[];
  } | null>(null);
  const [showOptimized, setShowOptimized] = useState(false);

  // 优化提示词
  const handleOptimize = useCallback(async () => {
    if (!prompt.trim()) {
      toast.warning('请先输入提示词');
      return;
    }

    setIsOptimizing(true);
    try {
      const result = await llmService.optimizePrompt(prompt);
      
      if (result.success && result.optimized) {
        setOptimizedPrompt(result.optimized);
        setShowOptimized(true);
        addPromptHistory(prompt);
        toast.success('提示词优化完成！');
      } else {
        toast.error(result.error || '优化失败');
      }
    } catch (error) {
      toast.error('优化过程出错');
    } finally {
      setIsOptimizing(false);
    }
  }, [prompt, setOptimizedPrompt, addPromptHistory]);

  // 分析提示词
  const handleAnalyze = useCallback(async () => {
    if (!prompt.trim()) {
      toast.warning('请先输入提示词');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await llmService.analyzePrompt(prompt);
      
      if (result.success && result.score !== undefined) {
        setAnalysisResult({
          score: result.score,
          presentElements: result.presentElements || [],
          missingElements: result.missingElements || [],
          suggestions: result.suggestions || []
        });
        toast.success('分析完成！');
      } else {
        toast.error(result.error || '分析失败');
      }
    } catch (error) {
      toast.error('分析过程出错');
    } finally {
      setIsAnalyzing(false);
    }
  }, [prompt]);

  // 应用优化后的提示词
  const applyOptimizedPrompt = useCallback(() => {
    if (optimizedPrompt) {
      setPrompt(optimizedPrompt);
      setShowOptimized(false);
      toast.success('已应用优化后的提示词');
    }
  }, [optimizedPrompt, setPrompt]);

  // 使用模板
  const useTemplate = useCallback((template: string) => {
    const subject = prompt.trim() || '主体内容';
    const filledTemplate = template.replace('{subject}', subject);
    setPrompt(filledTemplate);
    toast.success('模板已应用');
  }, [prompt, setPrompt]);

  // 添加关键词
  const addKeyword = useCallback((keyword: string) => {
    const newPrompt = prompt.trim() ? `${prompt}, ${keyword}` : keyword;
    setPrompt(newPrompt);
  }, [prompt, setPrompt]);

  // 清除历史
  const clearHistory = useCallback(() => {
    promptHistory.forEach(p => removePromptFromHistory(p));
    toast.success('历史记录已清除');
  }, [promptHistory, removePromptFromHistory]);

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* 标签切换 */}
      <div className="flex p-2 gap-1">
        {[
          { id: 'optimize', name: 'AI优化', icon: Sparkles },
          { id: 'templates', name: '模板', icon: Wand2 },
          { id: 'history', name: '历史', icon: History },
        ].map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1 ${
              activeTab === tab.id
                ? 'bg-violet-500 text-white shadow-md'
                : isDark
                  ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.name}</span>
          </motion.button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 p-4">
        <AnimatePresence mode="wait">
          {/* AI优化标签 */}
          {activeTab === 'optimize' && (
            <motion.div
              key="optimize"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* 当前提示词显示 */}
              <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="text-xs font-medium mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  当前提示词
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                  {prompt || '暂无提示词'}
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  onClick={handleOptimize}
                  disabled={isOptimizing || !prompt.trim()}
                  whileTap={{ scale: 0.95 }}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isOptimizing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      优化中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      AI优化
                    </>
                  )}
                </motion.button>
                <motion.button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !prompt.trim()}
                  whileTap={{ scale: 0.95 }}
                  className={`py-3 px-4 rounded-xl font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 ${
                    isDark 
                      ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      分析质量
                    </>
                  )}
                </motion.button>
              </div>

              {/* 优化结果 */}
              <AnimatePresence>
                {showOptimized && optimizedPrompt && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`p-4 rounded-xl border-2 border-violet-200 ${isDark ? 'bg-violet-900/20' : 'bg-violet-50'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                        优化结果
                      </span>
                      <button
                        onClick={() => setShowOptimized(false)}
                        className="p-1 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {optimizedPrompt}
                    </p>
                    <motion.button
                      onClick={applyOptimizedPrompt}
                      whileTap={{ scale: 0.95 }}
                      className="w-full py-2 rounded-lg bg-violet-500 text-white text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      应用此提示词
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 分析结果 */}
              <AnimatePresence>
                {analysisResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">质量评分</span>
                      <div className="flex items-center gap-2">
                        <div className={`text-lg font-bold ${
                          analysisResult.score >= 80 ? 'text-green-500' :
                          analysisResult.score >= 60 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {analysisResult.score}/100
                        </div>
                        <button
                          onClick={() => setAnalysisResult(null)}
                          className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* 进度条 */}
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          analysisResult.score >= 80 ? 'bg-green-500' :
                          analysisResult.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${analysisResult.score}%` }}
                      />
                    </div>

                    {/* 已有元素 */}
                    {analysisResult.presentElements.length > 0 && (
                      <div className="mb-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">已有元素</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analysisResult.presentElements.map((el, i) => (
                            <span key={i} className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              {el}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 缺失元素 */}
                    {analysisResult.missingElements.length > 0 && (
                      <div className="mb-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">建议添加</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analysisResult.missingElements.map((el, i) => (
                            <span key={i} className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                              {el}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 改进建议 */}
                    {analysisResult.suggestions.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">改进建议</span>
                        <ul className="mt-1 space-y-1">
                          {analysisResult.suggestions.map((suggestion, i) => (
                            <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                              <span className="text-violet-500">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 关键词建议 */}
              <div>
                <div className="text-xs font-medium mb-2">快速添加关键词</div>
                <div className="flex flex-wrap gap-1">
                  {KEYWORD_SUGGESTIONS.map((keyword) => (
                    <motion.button
                      key={keyword}
                      onClick={() => addKeyword(keyword)}
                      whileTap={{ scale: 0.95 }}
                      className={`px-2 py-1 rounded-full text-xs transition-colors ${
                        isDark 
                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      + {keyword}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* 模板标签 */}
          {activeTab === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {PROMPT_TEMPLATES.map((category) => (
                <div key={category.category}>
                  <div className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-violet-500" />
                    {category.category}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {category.templates.map((template) => (
                      <motion.button
                        key={template.name}
                        onClick={() => useTemplate(template.template)}
                        whileTap={{ scale: 0.95 }}
                        className={`p-3 rounded-xl text-left transition-all border ${
                          isDark 
                            ? 'bg-gray-800 border-gray-700 hover:border-violet-500' 
                            : 'bg-white border-gray-200 hover:border-violet-300'
                        }`}
                      >
                        <div className="font-medium text-sm mb-1">{template.name}</div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {template.template}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* 历史标签 */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {promptHistory.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">历史提示词</span>
                    <motion.button
                      onClick={clearHistory}
                      whileTap={{ scale: 0.95 }}
                      className="text-xs text-red-500 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3 h-3" />
                      清空
                    </motion.button>
                  </div>
                  <div className="space-y-2">
                    {promptHistory.map((historyPrompt, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-3 rounded-xl flex items-center justify-between group ${
                          isDark 
                            ? 'bg-gray-800 hover:bg-gray-700' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <p 
                          className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 flex-1 cursor-pointer"
                          onClick={() => setPrompt(historyPrompt)}
                        >
                          {historyPrompt}
                        </p>
                        <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button
                            onClick={() => setPrompt(historyPrompt)}
                            whileTap={{ scale: 0.95 }}
                            className="p-1.5 rounded-lg bg-violet-500 text-white"
                            title="使用"
                          >
                            <Check className="w-3 h-3" />
                          </motion.button>
                          <motion.button
                            onClick={() => removePromptFromHistory(historyPrompt)}
                            whileTap={{ scale: 0.95 }}
                            className="p-1.5 rounded-lg bg-red-500 text-white"
                            title="删除"
                          >
                            <X className="w-3 h-3" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <History className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">暂无历史记录</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
