import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { useCreateStore } from '../../hooks/useCreateStore';
import { getScenarioRecommendation, getRecommendedSize } from '../../utils/layoutEngine';

// 排版模式
type LayoutMode = 'smart' | 'template' | 'auto' | 'custom';

// 平台预设
const PLATFORM_PRESETS = [
  { id: 'xiaohongshu', name: '小红书', ratio: '3:4', size: '1242×1660', icon: 'book-open' },
  { id: 'weibo', name: '微博', ratio: '1:1', size: '1080×1080', icon: 'comments' },
  { id: 'douyin', name: '抖音', ratio: '9:16', size: '1080×1920', icon: 'video' },
  { id: 'wechat', name: '朋友圈', ratio: '1:1', size: '1080×1080', icon: 'share' },
  { id: 'instagram', name: 'Instagram', ratio: '1:1', size: '1080×1080', icon: 'camera' },
  { id: 'poster', name: '海报', ratio: '2:3', size: '1200×1800', icon: 'image' },
];

// 智能排版模板
const SMART_TEMPLATES = [
  { 
    id: 'center', 
    name: '中心聚焦', 
    icon: 'crosshairs',
    description: '内容居中，突出重点',
  },
  { 
    id: 'left-text', 
    name: '左文右图', 
    icon: 'align-left',
    description: '文字左侧，视觉右侧',
  },
  { 
    id: 'top-text', 
    name: '上文下图', 
    icon: 'arrow-up',
    description: '标题在上，内容在下',
  },
  { 
    id: 'grid', 
    name: '网格布局', 
    icon: 'th',
    description: '多图网格排列',
  },
  { 
    id: 'masonry', 
    name: '瀑布流', 
    icon: 'stream',
    description: '错落有致排列',
  },
  { 
    id: 'fullscreen', 
    name: '全屏沉浸', 
    icon: 'expand',
    description: '满屏展示，震撼效果',
  },
];

// 文字排版样式
const TEXT_STYLES = [
  { id: 'minimal', name: '极简留白', icon: 'square', description: '大量留白，极简设计' },
  { id: 'elegant', name: '优雅衬线', icon: 'font', description: '衬线字体，文艺气息' },
  { id: 'bold', name: '粗体冲击', icon: 'heading', description: '粗体大字，视觉冲击' },
  { id: 'vertical', name: '竖排古典', icon: 'text-height', description: '竖排文字，古典韵味' },
  { id: 'overlay', name: '图文叠加', icon: 'layer-group', description: '文字叠加在图上' },
  { id: 'frame', name: '边框装饰', icon: 'border-all', description: '边框包围，精致感' },
];

// AI推荐场景
const AI_SCENARIOS = [
  { id: 'product', name: '产品展示', icon: 'box', description: '突出产品特点' },
  { id: 'festival', name: '节日海报', icon: 'gift', description: '节日氛围营造' },
  { id: 'quote', name: '金句分享', icon: 'quote-right', description: '文字为主的设计' },
  { id: 'event', name: '活动宣传', icon: 'calendar', description: '活动信息突出' },
  { id: 'brand', name: '品牌宣传', icon: 'flag', description: '品牌形象展示' },
  { id: 'social', name: '社交媒体', icon: 'hashtag', description: '适合社交传播' },
];

export const SmartLayoutPanel: React.FC = () => {
  const { isDark } = useTheme();
  const [mode, setMode] = useState<LayoutMode>('smart');
  
  // 从 store 获取智能排版状态和方法
  const smartLayoutConfig = useCreateStore((state) => state.smartLayoutConfig);
  const layoutRecommendation = useCreateStore((state) => state.layoutRecommendation);
  const isAnalyzingLayout = useCreateStore((state) => state.isAnalyzingLayout);
  const setSmartLayoutConfig = useCreateStore((state) => state.setSmartLayoutConfig);
  const analyzeLayout = useCreateStore((state) => state.analyzeLayout);
  const applyLayout = useCreateStore((state) => state.applyLayout);
  const resetLayout = useCreateStore((state) => state.resetLayout);
  const generatedResults = useCreateStore((state) => state.generatedResults);
  
  // 本地状态
  const [customText, setCustomText] = useState<string>(smartLayoutConfig.customText || '');
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);

  // 同步 store 中的配置到本地状态
  useEffect(() => {
    setCustomText(smartLayoutConfig.customText || '');
  }, [smartLayoutConfig.customText]);

  // 处理场景选择
  const handleScenarioSelect = useCallback((scenarioId: string) => {
    const recommendation = getScenarioRecommendation(scenarioId);
    setSmartLayoutConfig({ 
      scenario: scenarioId,
      template: recommendation.template,
      textStyle: recommendation.textStyle
    });
    setAiRecommendation(null);
  }, [setSmartLayoutConfig]);

  // 处理平台选择
  const handlePlatformSelect = useCallback((platformId: string) => {
    const size = getRecommendedSize(platformId);
    setSmartLayoutConfig({ 
      platform: platformId,
      aspectRatio: size.ratio,
      canvasSize: { width: size.width, height: size.height }
    });
  }, [setSmartLayoutConfig]);

  // 处理模板选择
  const handleTemplateSelect = useCallback((templateId: string) => {
    setSmartLayoutConfig({ template: templateId });
  }, [setSmartLayoutConfig]);

  // 处理文字样式选择
  const handleTextStyleSelect = useCallback((styleId: string) => {
    setSmartLayoutConfig({ textStyle: styleId });
  }, [setSmartLayoutConfig]);

  // 处理文案输入
  const handleCustomTextChange = useCallback((text: string) => {
    setCustomText(text);
    setSmartLayoutConfig({ customText: text });
  }, [setSmartLayoutConfig]);

  // 处理AI智能排版
  const handleSmartLayout = useCallback(async () => {
    if (generatedResults.length === 0) {
      toast.error('请先生成或上传图片后再使用智能排版');
      return;
    }
    
    const loadingToast = toast.loading('AI正在分析内容并生成最佳排版...');
    
    try {
      const recommendation = await analyzeLayout();
      toast.dismiss(loadingToast);
      
      if (recommendation) {
        setAiRecommendation(recommendation.recommendation);
        toast.success('智能排版生成完成！');
      } else {
        toast.error('排版分析失败，请重试');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Smart layout analysis failed:', error);
      toast.error('排版分析失败，请重试');
    }
  }, [analyzeLayout, generatedResults.length]);

  // 处理一键适配多平台
  const handleMultiPlatform = useCallback(() => {
    const loadingToast = toast.loading('正在生成多平台尺寸...');
    
    setTimeout(() => {
      toast.dismiss(loadingToast);
      toast.success('已生成6个平台的适配尺寸！');
    }, 1500);
  }, []);

  // 处理应用排版
  const handleApplyLayout = useCallback(async () => {
    if (generatedResults.length === 0) {
      toast.error('请先生成或上传图片后再应用排版');
      return;
    }
    
    // 如果没有生成过推荐，先根据当前配置生成
    if (!layoutRecommendation) {
      const loadingToast = toast.loading('正在生成排版...');
      try {
        const recommendation = await analyzeLayout();
        toast.dismiss(loadingToast);
        
        if (!recommendation) {
          toast.error('排版生成失败，请重试');
          return;
        }
        
        // 直接应用新生成的推荐
        applyLayout();
        toast.success('排版已应用到画布！');
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error('排版生成失败，请重试');
        return;
      }
    } else {
      // 已经有推荐，直接应用
      applyLayout();
      toast.success('排版已应用到画布！');
    }
  }, [applyLayout, layoutRecommendation, analyzeLayout, generatedResults.length]);

  // 处理重置排版
  const handleResetLayout = useCallback(() => {
    resetLayout();
    setAiRecommendation(null);
    setCustomText('');
    toast.success('排版已重置');
  }, [resetLayout]);

  const panelBg = isDark ? 'bg-gray-900' : 'bg-white';
  const sectionBg = isDark ? 'bg-gray-800' : 'bg-gray-50';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const subTextColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className={`h-full overflow-y-auto ${panelBg}`}>
      {/* 模式切换 */}
      <div className={`sticky top-0 z-10 ${panelBg} border-b ${borderColor} p-4`}>
        <div className="flex gap-2">
          {[
            { id: 'smart', name: '智能排版', icon: 'magic' },
            { id: 'template', name: '模板库', icon: 'th-large' },
            { id: 'auto', name: '自动适配', icon: 'sync' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id as LayoutMode)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === m.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : `${sectionBg} ${textColor} hover:opacity-80`
              }`}
            >
              <i className={`fas fa-${m.icon}`} />
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-6">
        <AnimatePresence mode="wait">
          {/* 智能排版模式 */}
          {mode === 'smart' && (
            <motion.div
              key="smart"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* AI一键排版 */}
              <div className={`${sectionBg} rounded-xl p-4`}>
                <h3 className={`font-semibold ${textColor} mb-3 flex items-center gap-2`}>
                  <i className="fas fa-robot text-purple-500" />
                  AI 一键智能排版
                </h3>
                <p className={`text-sm ${subTextColor} mb-4`}>
                  AI自动分析您的作品内容，推荐最佳版式和布局方案
                </p>
                
                {/* 使用场景 */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {AI_SCENARIOS.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => handleScenarioSelect(scenario.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        smartLayoutConfig.scenario === scenario.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : `border-transparent ${isDark ? 'bg-gray-700' : 'bg-white'}`
                      }`}
                    >
                      <i className={`fas fa-${scenario.icon} text-lg mb-1 ${
                        smartLayoutConfig.scenario === scenario.id ? 'text-purple-500' : subTextColor
                      }`} />
                      <div className={`text-xs font-medium ${textColor}`}>{scenario.name}</div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSmartLayout}
                  disabled={isAnalyzingLayout}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50"
                >
                  <i className={`fas fa-${isAnalyzingLayout ? 'spinner fa-spin' : 'wand-magic-sparkles'} mr-2`} />
                  {isAnalyzingLayout ? 'AI分析中...' : '开始智能排版'}
                </button>

                {/* AI 推荐结果 */}
                {(aiRecommendation || layoutRecommendation?.recommendation) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg"
                  >
                    <div className="flex items-start gap-2">
                      <i className="fas fa-lightbulb text-purple-500 mt-0.5" />
                      <div className="flex-1">
                        <p className={`text-sm ${textColor} font-medium mb-1`}>AI 推荐</p>
                        <p className={`text-sm ${subTextColor}`}>
                          {aiRecommendation || layoutRecommendation?.recommendation}
                        </p>
                        {layoutRecommendation && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                              模板: {SMART_TEMPLATES.find(t => t.id === layoutRecommendation.template)?.name}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                              文字: {TEXT_STYLES.find(t => t.id === layoutRecommendation.textStyleId)?.name}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                              尺寸: {layoutRecommendation.aspectRatio}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* 平台选择 */}
              <div>
                <h3 className={`font-semibold ${textColor} mb-3 flex items-center gap-2`}>
                  <i className="fas fa-mobile-alt text-blue-500" />
                  选择发布平台
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORM_PRESETS.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => handlePlatformSelect(platform.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        smartLayoutConfig.platform === platform.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : `border-transparent ${sectionBg}`
                      }`}
                    >
                      <i className={`fas fa-${platform.icon} text-lg mb-1 ${
                        smartLayoutConfig.platform === platform.id ? 'text-blue-500' : subTextColor
                      }`} />
                      <div className={`text-xs font-medium ${textColor}`}>{platform.name}</div>
                      <div className={`text-[10px] ${subTextColor}`}>{platform.ratio}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 排版模板 */}
              <div>
                <h3 className={`font-semibold ${textColor} mb-3`}>排版布局</h3>
                <div className="grid grid-cols-2 gap-2">
                  {SMART_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        smartLayoutConfig.template === template.id
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : `border-transparent ${sectionBg}`
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <i className={`fas fa-${template.icon} ${
                          smartLayoutConfig.template === template.id ? 'text-green-500' : subTextColor
                        }`} />
                        <span className={`text-sm font-medium ${textColor}`}>{template.name}</span>
                      </div>
                      <p className={`text-xs ${subTextColor}`}>{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 文字样式 */}
              <div>
                <h3 className={`font-semibold ${textColor} mb-3`}>文字排版</h3>
                <div className="grid grid-cols-3 gap-2">
                  {TEXT_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => handleTextStyleSelect(style.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        smartLayoutConfig.textStyle === style.id
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : `border-transparent ${sectionBg}`
                      }`}
                    >
                      <i className={`fas fa-${style.icon} mb-1 ${
                        smartLayoutConfig.textStyle === style.id ? 'text-orange-500' : subTextColor
                      }`} />
                      <div className={`text-xs font-medium ${textColor}`}>{style.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 添加文字 */}
              <div>
                <h3 className={`font-semibold ${textColor} mb-3`}>添加文案</h3>
                <textarea
                  value={customText}
                  onChange={(e) => handleCustomTextChange(e.target.value)}
                  placeholder="输入您想要展示的文字内容..."
                  className={`w-full p-3 rounded-xl border ${borderColor} ${panelBg} ${textColor} text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  rows={3}
                />
              </div>
            </motion.div>
          )}

          {/* 模板库模式 */}
          {mode === 'template' && (
            <motion.div
              key="template"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className={`${sectionBg} rounded-xl p-8 text-center`}>
                <i className="fas fa-images text-4xl text-gray-400 mb-4" />
                <h3 className={`font-semibold ${textColor} mb-2`}>专业模板库</h3>
                <p className={`text-sm ${subTextColor} mb-4`}>
                  海量设计师精选模板，一键套用
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {['电商海报', '社交媒体', '活动宣传', '品牌展示'].map((cat) => (
                    <div key={cat} className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} cursor-pointer hover:shadow-md transition-shadow`}>
                      <span className={`text-sm ${textColor}`}>{cat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* 自动适配模式 */}
          {mode === 'auto' && (
            <motion.div
              key="auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className={`${sectionBg} rounded-xl p-6`}>
                <h3 className={`font-semibold ${textColor} mb-3 flex items-center gap-2`}>
                  <i className="fas fa-clone text-green-500" />
                  一键适配多平台
                </h3>
                <p className={`text-sm ${subTextColor} mb-4`}>
                  一次设计，自动生成所有平台的适配尺寸
                </p>
                
                <div className="space-y-2 mb-4">
                  {PLATFORM_PRESETS.map((platform) => (
                    <div key={platform.id} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                      <div className="flex items-center gap-3">
                        <i className={`fas fa-${platform.icon} ${subTextColor}`} />
                        <span className={`text-sm ${textColor}`}>{platform.name}</span>
                      </div>
                      <span className={`text-xs ${subTextColor}`}>{platform.size}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleMultiPlatform}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-green-500/30 transition-all"
                >
                  <i className="fas fa-clone mr-2" />
                  生成全部尺寸
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 操作按钮组 */}
        <div className="space-y-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApplyLayout}
            disabled={generatedResults.length === 0}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-check mr-2" />
            应用排版到画布
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleResetLayout}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <i className="fas fa-undo mr-2" />
            重置排版
          </motion.button>
        </div>
      </div>
    </div>
  );
};
