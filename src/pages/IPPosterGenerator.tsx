/**
 * IP 形象展示海报生成器页面
 * 使用 AI 一键生成专业的 IP 形象设计展示海报
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wand2,
  Palette,
  Layout,
  Image,
  Smile,
  Zap,
  ShoppingBag,
  Box,
  Download,
  RefreshCw,
  Check,
  Sparkles,
  Loader2,
  History,
  Trash2,
  Search,
  Clock,
  X,
} from 'lucide-react';
import {
  promptTemplates,
  type IPPosterGenerationParams,
  type IPPosterGenerationResult,
} from '@/services/ipPosterGenerationService';
import { generateImagesWithDelay } from '@/services/imageGenerationService';
import {
  getHistory,
  addHistory,
  deleteHistory,
  clearHistory,
  type IPPosterHistoryItem,
} from '@/services/ipPosterHistoryService';

// 生成步骤
const generationSteps = [
  { id: 'mainVisual', label: '主视觉海报', icon: Image },
  { id: 'threeViews', label: '三视图', icon: Box },
  { id: 'emojiSheet', label: '表情包', icon: Smile },
  { id: 'actionSheet', label: '动作延展', icon: Zap },
  { id: 'colorPalette', label: '配色方案', icon: Palette },
  { id: 'merchandiseMockup', label: '周边设计', icon: ShoppingBag },
];

// 风格选项
const styleOptions = [
  { value: 'cute', label: '可爱风格', description: '圆润可爱，适合儿童产品' },
  { value: 'realistic', label: '写实风格', description: '真实感强，细节丰富' },
  { value: 'anime', label: '动漫风格', description: '日式动漫，青春活泼' },
  { value: 'chibi', label: 'Q版风格', description: '大头小身，萌趣十足' },
  { value: 'watercolor', label: '水彩风格', description: '艺术感强，柔和自然' },
];

// 主题选项
const themeOptions = [
  { value: 'culture', label: '文化主题', description: '传统文化、历史元素' },
  { value: 'mascot', label: '吉祥物', description: '运动会、活动代言' },
  { value: 'brand', label: '品牌IP', description: '企业品牌、产品代言' },
  { value: 'festival', label: '节日主题', description: '春节、中秋等传统节日' },
  { value: 'custom', label: '自定义', description: '自由创作' },
];

// 布局选项
const layoutOptions = [
  { value: 'grid', label: '网格布局', description: '规整对称' },
  { value: 'masonry', label: '瀑布流', description: '错落有致' },
  { value: 'timeline', label: '时间线', description: '流程展示' },
  { value: 'classic', label: '经典布局', description: '传统海报' },
];

// 背景选项
const backgroundOptions = [
  { value: 'gradient', label: '渐变背景', description: '现代感强' },
  { value: 'pattern', label: '图案背景', description: '纹理丰富' },
  { value: 'scene', label: '场景背景', description: '沉浸感强' },
  { value: 'minimal', label: '极简背景', description: '简洁干净' },
];

export default function IPPosterGenerator() {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<Partial<IPPosterGenerationResult>>({});
  const [error, setError] = useState<string | null>(null);

  // 表单状态
  const [formData, setFormData] = useState<IPPosterGenerationParams>({
    characterName: '',
    characterDescription: '',
    characterStory: '',
    theme: 'culture',
    style: 'cute',
    colorScheme: {
      primary: '#4A90D9',
      secondary: '#48C9B0',
      accent: '#F4D03F',
    },
    elements: {
      mainVisual: true,
      threeViews: true,
      emojis: true,
      actionPoses: true,
      colorPalette: true,
      merchandise: true,
    },
    layout: 'grid',
    backgroundStyle: 'gradient',
  });

  // 历史记录状态
  const [history, setHistory] = useState<IPPosterHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // 加载历史记录
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  // 加载历史记录到表单
  const loadHistoryItem = (item: IPPosterHistoryItem) => {
    setFormData(item.params);
    setGeneratedImages(item.images);
    setShowHistory(false);
  };

  // 删除历史记录
  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteHistory(id)) {
      setHistory(getHistory());
    }
  };

  // 清空历史记录
  const handleClearHistory = () => {
    if (confirm('确定要清空所有历史记录吗？')) {
      clearHistory();
      setHistory([]);
    }
  };

  // 过滤历史记录
  const filteredHistory = historySearchQuery
    ? history.filter(
        (item) =>
          item.characterName.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
          item.characterDescription.toLowerCase().includes(historySearchQuery.toLowerCase())
      )
    : history;

  // 生成海报
  const handleGenerate = async () => {
    if (!formData.characterName || !formData.characterDescription) {
      setError('请填写角色名称和描述');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCurrentStep(0);
    setGeneratedImages({});

    try {
      // 准备生成任务
      const steps = [
        { key: 'mainPoster', type: 'mainVisual' as const, label: '主视觉海报', elementKey: 'mainVisual' },
        { key: 'threeViews', type: 'threeViews' as const, label: '三视图', elementKey: 'threeViews' },
        { key: 'emojiSheet', type: 'emojiSheet' as const, label: '表情包', elementKey: 'emojis' },
        { key: 'actionSheet', type: 'actionSheet' as const, label: '动作延展', elementKey: 'actionPoses' },
        { key: 'colorPalette', type: 'colorPalette' as const, label: '配色方案', elementKey: 'colorPalette' },
        { key: 'merchandiseMockup', type: 'merchandiseMockup' as const, label: '周边设计', elementKey: 'merchandise' },
      ];

      // 过滤出需要生成的任务
      const tasks = steps
        .filter(step => formData.elements[step.elementKey as keyof IPPosterGenerationParams['elements']] ?? true)
        .map(step => ({
          key: step.key,
          label: step.label,
          prompt: promptTemplates[step.type](formData),
        }));

      // 使用批量生成（带延迟）
      const generatedResults: IPPosterHistoryItem['images'] = {};
      
      await generateImagesWithDelay(
        tasks,
        (key, url) => {
          setGeneratedImages((prev) => ({ ...prev, [key]: url }));
          generatedResults[key as keyof IPPosterHistoryItem['images']] = url;
          const stepIndex = steps.findIndex(s => s.key === key);
          if (stepIndex !== -1) {
            setCurrentStep(stepIndex + 1);
          }
        },
        (key, error) => {
          console.error(`Failed to generate ${key}:`, error);
        }
      );

      // 保存到历史记录
      if (Object.keys(generatedResults).length > 0) {
        addHistory(formData, generatedResults);
        setHistory(getHistory());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 下载图片
  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-blue-500" />
                IP 海报生成器
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI 一键生成专业展示海报
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              历史记录
            </span>
            {history.length > 0 && (
              <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                {history.length}
              </span>
            )}
          </motion.button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：配置表单 */}
          <div className="space-y-6">
            {/* 基本信息 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl"
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                基本信息
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    角色名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.characterName}
                    onChange={(e) =>
                      setFormData({ ...formData, characterName: e.target.value })
                    }
                    placeholder="例如：津小脉"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    角色描述 *
                  </label>
                  <textarea
                    value={formData.characterDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, characterDescription: e.target.value })
                    }
                    placeholder="描述角色的外观特征、性格特点..."
                    rows={3}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    背景故事
                  </label>
                  <textarea
                    value={formData.characterStory}
                    onChange={(e) =>
                      setFormData({ ...formData, characterStory: e.target.value })
                    }
                    placeholder="角色的来历、故事背景..."
                    rows={3}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </motion.div>

            {/* 风格设置 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl"
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-500" />
                风格设置
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    艺术风格
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {styleOptions.map((style) => (
                      <button
                        key={style.value}
                        onClick={() =>
                          setFormData({ ...formData, style: style.value as any })
                        }
                        className={`p-3 rounded-xl text-left transition-all ${
                          formData.style === style.value
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="font-medium">{style.label}</div>
                        <div
                          className={`text-xs mt-1 ${
                            formData.style === style.value
                              ? 'text-white/70'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {style.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    主题类型
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {themeOptions.map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() =>
                          setFormData({ ...formData, theme: theme.value as any })
                        }
                        className={`p-3 rounded-xl text-left transition-all ${
                          formData.theme === theme.value
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="font-medium">{theme.label}</div>
                        <div
                          className={`text-xs mt-1 ${
                            formData.theme === theme.value
                              ? 'text-white/70'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {theme.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 配色方案 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl"
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-pink-500" />
                配色方案
              </h2>
              <div className="flex gap-4">
                {(['primary', 'secondary', 'accent'] as const).map((colorKey) => (
                  <div key={colorKey} className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                      {colorKey === 'primary'
                        ? '主色'
                        : colorKey === 'secondary'
                        ? '辅色'
                        : '点缀色'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.colorScheme[colorKey]}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            colorScheme: {
                              ...formData.colorScheme,
                              [colorKey]: e.target.value,
                            },
                          })
                        }
                        className="w-12 h-10 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.colorScheme[colorKey]}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            colorScheme: {
                              ...formData.colorScheme,
                              [colorKey]: e.target.value,
                            },
                          })
                        }
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 布局设置 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl"
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Layout className="w-5 h-5 text-green-500" />
                布局与背景
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    布局风格
                  </label>
                  <select
                    value={formData.layout}
                    onChange={(e) =>
                      setFormData({ ...formData, layout: e.target.value as any })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {layoutOptions.map((layout) => (
                      <option key={layout.value} value={layout.value}>
                        {layout.label} - {layout.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    背景风格
                  </label>
                  <select
                    value={formData.backgroundStyle}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        backgroundStyle: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {backgroundOptions.map((bg) => (
                      <option key={bg.value} value={bg.value}>
                        {bg.label} - {bg.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>

            {/* 生成元素选择 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl"
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-orange-500" />
                生成元素
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: 'mainVisual', label: '主视觉海报', icon: Image },
                  { key: 'threeViews', label: '三视图', icon: Box },
                  { key: 'emojis', label: '表情包', icon: Smile },
                  { key: 'actionPoses', label: '动作延展', icon: Zap },
                  { key: 'colorPalette', label: '配色方案', icon: Palette },
                  { key: 'merchandise', label: '周边设计', icon: ShoppingBag },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        elements: {
                          ...formData.elements,
                          [item.key]: !formData.elements[item.key as keyof typeof formData.elements],
                        },
                      })
                    }
                    className={`flex items-center gap-2 p-3 rounded-xl transition-all ${
                      formData.elements[item.key as keyof typeof formData.elements]
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                    {formData.elements[item.key as keyof typeof formData.elements] && (
                      <Check className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* 生成按钮 */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-4 bg-gradient-to-r from-blue-500 via-teal-500 to-cyan-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  生成中... ({currentStep + 1}/{generationSteps.length})
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  开始生成海报
                </>
              )}
            </motion.button>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
                {error}
              </div>
            )}
          </div>

          {/* 右侧：生成结果 */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {Object.keys(generatedImages).length === 0 && !isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white/50 dark:bg-gray-800/50 rounded-3xl p-12 border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-teal-100 dark:from-blue-900/30 dark:to-teal-900/30 rounded-full flex items-center justify-center mb-4">
                    <Wand2 className="w-12 h-12 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    准备生成
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                    在左侧填写角色信息并选择生成元素，然后点击"开始生成海报"按钮
                  </p>
                </motion.div>
              )}

              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl"
                >
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                    生成进度
                  </h3>
                  <div className="space-y-4">
                    {generationSteps.map((step, index) => {
                      const isCompleted = index < currentStep;
                      const isCurrent = index === currentStep;
                      const elementKey = step.id as keyof IPPosterGenerationParams['elements'];
                      const isEnabled = formData.elements[elementKey] ?? true;

                      if (!isEnabled) return null;

                      return (
                        <div
                          key={step.id}
                          className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                            isCompleted
                              ? 'bg-green-50 dark:bg-green-900/20'
                              : isCurrent
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : 'bg-gray-50 dark:bg-gray-700'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isCompleted
                                ? 'bg-green-500 text-white'
                                : isCurrent
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-500'
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="w-5 h-5" />
                            ) : isCurrent ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <step.icon className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p
                              className={`font-medium ${
                                isCompleted || isCurrent
                                  ? 'text-gray-900 dark:text-white'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {step.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {Object.entries(generatedImages).map(([key, url], index) => {
                if (!url) return null;
                const stepInfo = generationSteps.find((s) => s.id === key) || {
                  label: key,
                  icon: Image,
                };

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl"
                  >
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <stepInfo.icon className="w-5 h-5 text-blue-500" />
                        <span className="font-bold text-gray-900 dark:text-white">
                          {stepInfo.label}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          handleDownload(url, `${formData.characterName}_${key}.png`)
                        }
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700">
                      <img
                        src={url}
                        alt={stepInfo.label}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 历史记录侧边栏 */}
      <AnimatePresence>
        {showHistory && (
          <>
            {/* 遮罩层 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            {/* 侧边栏 */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
            >
              {/* 头部 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    生成历史
                  </h2>
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                    {history.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {history.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="清空历史"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* 搜索框 */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索历史记录..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 历史列表 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {historySearchQuery ? '未找到匹配的记录' : '暂无历史记录'}
                    </p>
                  </div>
                ) : (
                  filteredHistory.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => loadHistoryItem(item)}
                      className="group bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex gap-3">
                        {/* 缩略图 */}
                        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.characterName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Image className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        {/* 信息 */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-white truncate">
                            {item.characterName}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                            {item.characterDescription}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                            </span>
                            <span>·</span>
                            <span>
                              {Object.keys(item.images).length} 张图片
                            </span>
                          </div>
                        </div>
                        {/* 删除按钮 */}
                        <button
                          onClick={(e) => handleDeleteHistory(item.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
