import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../../hooks/useCreateStore';
import { STYLE_PRESETS } from '@/constants/creativeData';
import { imageProcessingService } from '@/services/imageProcessingService';
import { llmService } from '@/services/llmService';
import { toast } from 'sonner';
import { Loader2, Check, Blend, Palette, Landmark } from 'lucide-react';

// 风格转换类型
type StyleMode = 'transfer' | 'mix' | 'culture';

// 国潮风格预设
const CULTURE_PRESETS = [
  { id: 'guochao', name: '国潮风尚', icon: 'dragon', color: '#C02C38', description: '传统与现代的完美融合' },
  { id: 'ink', name: '水墨意境', icon: 'paint-brush', color: '#2D3748', description: '东方美学，意境深远' },
  { id: 'bluewhite', name: '青花瓷韵', icon: 'wine-bottle', color: '#3182CE', description: '天青色等烟雨，经典传承' },
  { id: 'dunhuang', name: '敦煌飞天', icon: 'feather', color: '#D69E2E', description: '丝路瑰宝，艺术殿堂' },
  { id: 'paper', name: '剪纸艺术', icon: 'cut', color: '#E53E3E', description: '民间艺术，精巧细腻' },
  { id: 'calligraphy', name: '书法韵味', icon: 'pen-fancy', color: '#1A202C', description: '笔墨纸砚，文化传承' },
];

// 现代风格预设
const MODERN_PRESETS = [
  { id: 'minimal', name: '极简主义', icon: 'minus', color: '#718096', description: '少即是多，纯净美学' },
  { id: 'retro', name: '复古怀旧', icon: 'clock', color: '#D69E2E', description: '老上海风情，怀旧记忆' },
  { id: 'neon', name: '赛博朋克', icon: 'bolt', color: '#805AD5', description: '霓虹未来，科技感十足' },
  { id: 'nordic', name: '北欧风格', icon: 'snowflake', color: '#4299E1', description: '明亮色彩，简约实用' },
];

export const StyleLabPanel: React.FC = () => {
  const { isDark } = useTheme();
  const { updateState, generatedResults, selectedResult, currentImage } = useCreateStore();

  const [activeMode, setActiveMode] = useState<StyleMode>('transfer');
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [mixRatio, setMixRatio] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [intensity, setIntensity] = useState(70);

  const hasWork = generatedResults.length > 0;

  // 模拟进度增长
  const startProgressSimulation = (stages: string[]) => {
    setProcessingProgress(0);
    let currentStage = 0;
    let progress = 0;

    // 清除之前的定时器
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    setProcessingStage(stages[0]);

    progressIntervalRef.current = setInterval(() => {
      progress += Math.random() * 3 + 1; // 每次增加 1-4%

      // 根据进度切换阶段
      const stageIndex = Math.min(
        Math.floor((progress / 100) * stages.length),
        stages.length - 1
      );
      if (stageIndex !== currentStage) {
        currentStage = stageIndex;
        setProcessingStage(stages[stageIndex]);
      }

      if (progress >= 95) {
        progress = 95; // 保持在95%，等待实际完成
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }
      setProcessingProgress(Math.floor(progress));
    }, 200);
  };

  // 停止进度模拟
  const stopProgressSimulation = (completed = true) => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (completed) {
      setProcessingProgress(100);
      setTimeout(() => {
        setProcessingProgress(0);
        setProcessingStage('');
      }, 500);
    }
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // 风格转换（使用千问API）
  const handleStyleTransfer = async (styleId: string) => {
    // 获取当前图片 URL - 优先使用 currentImage，否则根据 selectedResult ID 查找对应作品
    const currentWork = selectedResult 
      ? generatedResults.find(r => r.id === selectedResult)
      : generatedResults[0];
    const imageUrl = currentImage || currentWork?.thumbnail;
    
    if (!imageUrl) {
      toast.error('请先生成或上传作品');
      return;
    }

    setSelectedStyle(styleId);
    setIsProcessing(true);

    const allPresets = [...CULTURE_PRESETS, ...MODERN_PRESETS];
    const preset = allPresets.find(p => p.id === styleId);

    // 启动进度模拟
    startProgressSimulation([
      '正在分析原图风格...',
      '正在提取风格特征...',
      '正在应用新风格...',
      '正在优化转换效果...'
    ]);

    try {
      console.log('[StyleLab] Style transfer with image:', imageUrl.substring(0, 80));

      // 调用千问API进行风格迁移
      const result = await llmService.styleTransfer(
        imageUrl,
        styleId,
        intensity
      );

      if (result.success && result.imageUrl) {
        const newResult = {
          id: Date.now(),
          thumbnail: result.imageUrl,
          prompt: currentWork?.prompt || '风格转换作品',
          style: preset?.name || styleId,
          timestamp: Date.now(),
          score: Math.min((currentWork?.score || 85) + 5, 100)
        };

        updateState({
          generatedResults: [...generatedResults, newResult],
          selectedResult: newResult.id,
          aiExplanation: `已将作品转换为「${preset?.name}」风格`
        });

        stopProgressSimulation(true);
        toast.success(`风格转换完成：${preset?.name}`);
      } else {
        stopProgressSimulation(false);
        toast.error(result.error || '风格转换失败');
      }
    } catch (error) {
      stopProgressSimulation(false);
      console.error('风格转换失败:', error);
      toast.error('风格转换失败');
    } finally {
      setIsProcessing(false);
    }
  };

  // 多风格融合（使用千问API）
  const handleStyleMix = async () => {
    // 获取当前图片 URL - 优先使用 currentImage，否则根据 selectedResult ID 查找对应作品
    const currentWork = selectedResult 
      ? generatedResults.find(r => r.id === selectedResult)
      : generatedResults[0];
    const imageUrl = currentImage || currentWork?.thumbnail;
    
    if (!imageUrl) {
      toast.error('请先生成或上传作品');
      return;
    }
    
    if (selectedStyles.length < 2) {
      toast.error('请至少选择2种风格进行融合');
      return;
    }

    setIsProcessing(true);
    const allPresets = [...CULTURE_PRESETS, ...MODERN_PRESETS];
    const styleNames = selectedStyles.map(id => allPresets.find(p => p.id === id)?.name).join(' + ');

    // 启动进度模拟
    startProgressSimulation([
      '正在分析多种风格...',
      '正在提取风格特征...',
      '正在智能融合风格...',
      '正在优化融合效果...'
    ]);

    try {
      console.log('[StyleLab] Style mix with image:', imageUrl.substring(0, 80));

      // 使用第一个选中的风格作为主要风格，调用千问API
      const primaryStyle = selectedStyles[0];
      const result = await llmService.styleTransfer(
        imageUrl,
        primaryStyle,
        mixRatio
      );

      if (result.success && result.imageUrl) {
        const newResult = {
          id: Date.now(),
          thumbnail: result.imageUrl,
          prompt: currentWork?.prompt || '风格融合作品',
          style: `融合: ${styleNames}`,
          timestamp: Date.now(),
          score: Math.min((currentWork?.score || 85) + 6, 100)
        };

        updateState({
          generatedResults: [...generatedResults, newResult],
          selectedResult: newResult.id,
          aiExplanation: `已融合风格：${styleNames}，融合比例：${mixRatio}%`
        });

        stopProgressSimulation(true);
        toast.success('风格融合完成');
      } else {
        stopProgressSimulation(false);
        toast.error(result.error || '风格融合失败');
      }
    } catch (error) {
      stopProgressSimulation(false);
      console.error('风格融合失败:', error);
      toast.error('风格融合失败');
    } finally {
      setIsProcessing(false);
    }
  };

  // 切换风格选择（多选）
  const toggleStyleSelection = (styleId: string) => {
    if (selectedStyles.includes(styleId)) {
      setSelectedStyles(selectedStyles.filter(id => id !== styleId));
    } else if (selectedStyles.length < 3) {
      setSelectedStyles([...selectedStyles, styleId]);
    } else {
      toast.info('最多选择3种风格');
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* 模式切换 */}
      <div className="flex p-2 gap-1">
        {[
          { id: 'transfer', name: '风格转换', icon: 'exchange-alt' },
          { id: 'mix', name: '风格融合', icon: 'blender' },
          { id: 'culture', name: '国潮专区', icon: 'dragon' },
        ].map((mode) => (
          <motion.button
            key={mode.id}
            onClick={() => {
              setActiveMode(mode.id as StyleMode);
              setSelectedStyle(null);
              setSelectedStyles([]);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1 ${
              activeMode === mode.id
                ? 'bg-amber-500 text-white shadow-md'
                : isDark
                  ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <i className={`fas fa-${mode.icon}`}></i>
            <span>{mode.name}</span>
          </motion.button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 p-4 relative">
        {/* 加载遮罩 */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg"
          >
            {/* 旋转动画图标 */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 rounded-full border-4 border-amber-500/30 border-t-amber-500 mb-4"
            />

            {/* 处理阶段文字 */}
            <motion.p
              key={processingStage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {processingStage}
            </motion.p>

            {/* 进度条 */}
            <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${processingProgress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>

            {/* 百分比 */}
            <p className="text-amber-500 text-lg font-bold">
              {processingProgress}%
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* 风格转换模式 */}
          {activeMode === 'transfer' && (
            <motion.div
              key="transfer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* 国潮风格 */}
              <div>
                <div className="text-sm font-medium mb-3 flex items-center gap-2">
                  <i className="fas fa-landmark text-red-500"></i>
                  中国传统风格
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {CULTURE_PRESETS.map((preset) => (
                    <motion.button
                      key={preset.id}
                      onClick={() => handleStyleTransfer(preset.id)}
                      disabled={isProcessing}
                      className={`p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden ${
                        selectedStyle === preset.id
                          ? 'border-amber-500'
                          : isDark
                            ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div 
                        className="absolute top-0 right-0 w-16 h-16 opacity-10 rounded-bl-full"
                        style={{ backgroundColor: preset.color }}
                      />
                      <div className="flex items-center gap-3 mb-2 relative z-10">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: preset.color }}
                        >
                          <i className={`fas fa-${preset.icon}`}></i>
                        </div>
                        <div className="font-medium text-sm">{preset.name}</div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 relative z-10">
                        {preset.description}
                      </p>
                      {selectedStyle === preset.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                          <i className="fas fa-check text-white text-xs"></i>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* 现代风格 */}
              <div className="mt-6">
                <div className="text-sm font-medium mb-3 flex items-center gap-2">
                  <i className="fas fa-city text-blue-500"></i>
                  现代艺术风格
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {MODERN_PRESETS.map((preset) => (
                    <motion.button
                      key={preset.id}
                      onClick={() => handleStyleTransfer(preset.id)}
                      disabled={isProcessing}
                      className={`p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden ${
                        selectedStyle === preset.id
                          ? 'border-amber-500'
                          : isDark
                            ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div 
                        className="absolute top-0 right-0 w-16 h-16 opacity-10 rounded-bl-full"
                        style={{ backgroundColor: preset.color }}
                      />
                      <div className="flex items-center gap-3 mb-2 relative z-10">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: preset.color }}
                        >
                          <i className={`fas fa-${preset.icon}`}></i>
                        </div>
                        <div className="font-medium text-sm">{preset.name}</div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 relative z-10">
                        {preset.description}
                      </p>
                      {selectedStyle === preset.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                          <i className="fas fa-check text-white text-xs"></i>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* 强度调节 */}
              {selectedStyle && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">转换强度</span>
                    <span className="text-sm text-amber-500">{intensity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={intensity}
                    onChange={(e) => setIntensity(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #F59E0B 0%, #F59E0B ${intensity}%, ${isDark ? '#374151' : '#D1D5DB'} ${intensity}%, ${isDark ? '#374151' : '#D1D5DB'} 100%)`
                    }}
                  />
                </motion.div>
              )}
            </motion.div>
          )}

          {/* 风格融合模式 */}
          {activeMode === 'mix' && (
            <motion.div
              key="mix"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="text-sm font-medium mb-2">选择2-3种风格进行融合</div>
              
              <div className="grid grid-cols-3 gap-2">
                {[...CULTURE_PRESETS, ...MODERN_PRESETS].map((preset) => {
                  const isSelected = selectedStyles.includes(preset.id);
                  const selectionOrder = selectedStyles.indexOf(preset.id) + 1;
                  
                  return (
                    <motion.button
                      key={preset.id}
                      onClick={() => toggleStyleSelection(preset.id)}
                      disabled={!isSelected && selectedStyles.length >= 3}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                          : selectedStyles.length >= 3
                            ? 'border-gray-200 dark:border-gray-800 opacity-50'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm relative"
                        style={{ backgroundColor: preset.color }}
                      >
                        <i className={`fas fa-${preset.icon}`}></i>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center">
                            {selectionOrder}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-center">{preset.name}</span>
                    </motion.button>
                  );
                })}
              </div>

              {selectedStyles.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-4"
                >
                  <div className="text-sm font-medium">融合比例</div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs w-16 truncate">
                      {CULTURE_PRESETS.find(p => p.id === selectedStyles[0])?.name || MODERN_PRESETS.find(p => p.id === selectedStyles[0])?.name}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={mixRatio}
                      onChange={(e) => setMixRatio(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #F59E0B 0%, #F59E0B ${mixRatio}%, ${isDark ? '#374151' : '#D1D5DB'} ${mixRatio}%, ${isDark ? '#374151' : '#D1D5DB'} 100%)`
                      }}
                    />
                    <span className="text-xs w-16 text-right truncate">
                      {CULTURE_PRESETS.find(p => p.id === selectedStyles[1])?.name || MODERN_PRESETS.find(p => p.id === selectedStyles[1])?.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{100 - mixRatio}%</span>
                    <span>{mixRatio}%</span>
                  </div>

                  {/* 融合预览 */}
                  <div className="p-3 rounded-lg bg-white dark:bg-gray-900">
                    <div className="text-xs text-gray-500 mb-2">融合预览</div>
                    <div className="flex items-center gap-2">
                      {selectedStyles.map((styleId, index) => {
                        const preset = [...CULTURE_PRESETS, ...MODERN_PRESETS].find(p => p.id === styleId);
                        return (
                          <React.Fragment key={styleId}>
                            <div 
                              className="px-3 py-1.5 rounded-full text-xs text-white"
                              style={{ backgroundColor: preset?.color }}
                            >
                              {preset?.name}
                            </div>
                            {index < selectedStyles.length - 1 && (
                              <i className="fas fa-plus text-gray-400 text-xs"></i>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* 融合进度条 */}
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3 overflow-hidden"
                    >
                      <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {processingStage}
                          </span>
                          <span className="text-xs font-bold text-amber-500">
                            {processingProgress}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${processingProgress}%` }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <button
                    onClick={handleStyleMix}
                    disabled={isProcessing}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-lg disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        融合中...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <i className="fas fa-blender"></i>
                        开始融合
                      </span>
                    )}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* 国潮专区 */}
          {activeMode === 'culture' && (
            <motion.div
              key="culture"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-yellow-500/10 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-dragon text-red-500"></i>
                  <span className="font-medium">国潮风格转换</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  一键将您的作品转换为具有中国特色的国潮风格，融合传统元素与现代设计
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {CULTURE_PRESETS.map((preset) => (
                  <motion.button
                    key={preset.id}
                    onClick={() => handleStyleTransfer(preset.id)}
                    disabled={isProcessing}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                      selectedStyle === preset.id
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : isDark
                          ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl"
                      style={{ backgroundColor: preset.color }}
                    >
                      <i className={`fas fa-${preset.icon}`}></i>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{preset.name}</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {preset.description}
                      </p>
                    </div>
                    {selectedStyle === preset.id && (
                      <i className="fas fa-check-circle text-red-500 text-xl"></i>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};


