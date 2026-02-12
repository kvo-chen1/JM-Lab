import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../../hooks/useCreateStore';
import { TRADITIONAL_PATTERNS, AI_FILTERS } from '@/constants/creativeData';
import { imageProcessingService } from '@/services/imageProcessingService';
import { llmService } from '@/services/llmService';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/Slider';
import { Eye, Check, RotateCcw, Sparkles, Loader2 } from 'lucide-react';

// 智能美化模式
type EnhanceMode = 'smart' | 'filter' | 'pattern';

// 一键美化预设 - 对应CSS滤镜
const SMART_PRESETS = [
  { 
    id: 'vivid', 
    name: '鲜艳增强', 
    icon: 'sun', 
    description: '提升色彩饱和度，让画面更生动',
    filter: 'saturate(1.4) contrast(1.1)'
  },
  { 
    id: 'soft', 
    name: '柔和唯美', 
    icon: 'cloud', 
    description: '降低对比度，营造梦幻氛围',
    filter: 'contrast(0.9) brightness(1.05) sepia(0.1)'
  },
  { 
    id: 'classic', 
    name: '经典复古', 
    icon: 'history', 
    description: '添加复古色调，怀旧情怀',
    filter: 'sepia(0.4) contrast(1.1) brightness(0.95)'
  },
  { 
    id: 'culture', 
    name: '国潮风格', 
    icon: 'dragon', 
    description: '强化中国传统色彩特征',
    filter: 'saturate(1.3) contrast(1.15) sepia(0.15) hue-rotate(-10deg)'
  },
  { 
    id: 'clear', 
    name: '清晰锐化', 
    icon: 'eye', 
    description: '增强细节，提升清晰度',
    filter: 'contrast(1.15) saturate(1.2)'
  },
  { 
    id: 'warm', 
    name: '温暖色调', 
    icon: 'fire', 
    description: '增加暖色调，温馨舒适',
    filter: 'sepia(0.25) saturate(1.1) brightness(1.05)'
  },
];

// AI滤镜 - 对应CSS滤镜
const FILTER_PRESETS = [
  { id: 1, name: '复古胶片', filter: 'sepia(0.5) contrast(1.2) brightness(0.9)' },
  { id: 2, name: '清新日系', filter: 'brightness(1.1) saturate(0.9) contrast(0.95)' },
  { id: 3, name: '黑白艺术', filter: 'grayscale(1) contrast(1.2)' },
  { id: 4, name: 'HDR效果', filter: 'contrast(1.3) saturate(1.2)' },
  { id: 5, name: '暖色阳光', filter: 'sepia(0.3) brightness(1.1) saturate(1.1)' },
  { id: 6, name: '冷色清新', filter: 'hue-rotate(180deg) saturate(0.8) brightness(1.05)' },
  { id: 7, name: '戏剧效果', filter: 'contrast(1.4) brightness(0.95)' },
  { id: 8, name: '梦幻柔光', filter: 'brightness(1.1) blur(0.5px) saturate(1.1)' },
];

export const EnhancePanel: React.FC = () => {
  const { isDark } = useTheme();
  const { 
    updateState, 
    generatedResults,
    selectedResult,
  } = useCreateStore();

  const [activeMode, setActiveMode] = useState<EnhanceMode>('smart');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<number | null>(null);
  const [intensity, setIntensity] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewFilter, setPreviewFilter] = useState<string>('');

  const hasWork = generatedResults.length > 0;
  const currentWork = hasWork && selectedResult 
    ? generatedResults.find(r => r.id === selectedResult) || generatedResults[0]
    : null;

  // 计算预览滤镜
  const previewStyle = useMemo(() => {
    if (!previewFilter) return {};
    
    // 根据强度调整滤镜
    const intensityRatio = intensity / 100;
    const adjustedFilter = previewFilter.replace(/\(([^)]+)\)/g, (match, value) => {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return match;
      
      // 对于大于1的值，按强度比例调整；对于小于1的值，按1 + (value-1) * intensityRatio
      if (numValue > 1) {
        return `(${1 + (numValue - 1) * intensityRatio})`;
      } else if (numValue < 1) {
        return `(${numValue * intensityRatio})`;
      }
      return match;
    });
    
    return { filter: adjustedFilter };
  }, [previewFilter, intensity]);

  // 选择预设时更新预览
  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = SMART_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setPreviewFilter(preset.filter);
    }
  };

  // 选择滤镜时更新预览
  const handleSelectFilter = (filterId: number) => {
    setSelectedFilter(filterId);
    const filter = FILTER_PRESETS.find(f => f.id === filterId);
    if (filter) {
      setPreviewFilter(filter.filter);
    }
  };

  // 应用效果（使用API）
  const handleApply = async () => {
    if (!hasWork || !currentWork) {
      toast.error('请先生成或上传作品');
      return;
    }

    if (!previewFilter) {
      toast.error('请先选择效果');
      return;
    }

    setIsProcessing(true);

    try {
      // 调用千问API进行图片增强
      const preset = SMART_PRESETS.find(p => p.id === selectedPreset);
      const filter = FILTER_PRESETS.find(f => f.id === selectedFilter);
      const effectName = preset?.name || filter?.name || '效果';
      const effectType = selectedPreset || 'vivid';

      // 调用新的API方法
      const result = await llmService.enhanceImage(
        currentWork.thumbnail,
        effectType,
        intensity
      );

      if (result.success && result.imageUrl) {
        const newResult = {
          id: Date.now(),
          thumbnail: result.imageUrl,
          prompt: currentWork.prompt,
          style: `${currentWork.style || ''} + ${effectName}`,
          timestamp: Date.now(),
          score: Math.min((currentWork.score || 85) + 2, 100)
        };

        updateState({
          generatedResults: [...generatedResults, newResult],
          selectedResult: generatedResults.length,
          aiExplanation: `已应用「${effectName}」效果，强度${intensity}%`
        });

        toast.success(`已应用${effectName}效果`);
        
        // 重置预览
        setPreviewFilter('');
        setSelectedPreset(null);
        setSelectedFilter(null);
      } else {
        toast.error(result.error || '处理失败');
      }
    } catch (error) {
      console.error('应用效果失败:', error);
      toast.error('处理失败');
    } finally {
      setIsProcessing(false);
    }
  };

  // AI一键美化
  const handleAIEnhance = async () => {
    if (!hasWork || !currentWork) {
      toast.error('请先生成或上传作品');
      return;
    }

    setIsProcessing(true);

    try {
      // 调用AI增强API
      const result = await llmService.enhanceImage(
        currentWork.thumbnail,
        'smart',
        80
      );

      if (result.success && result.imageUrl) {
        const newResult = {
          id: Date.now(),
          thumbnail: result.imageUrl,
          prompt: currentWork.prompt,
          style: `${currentWork.style || ''} + AI智能美化`,
          timestamp: Date.now(),
          score: Math.min((currentWork.score || 85) + 3, 100)
        };

        updateState({
          generatedResults: [...generatedResults, newResult],
          selectedResult: generatedResults.length,
          aiExplanation: '已应用AI智能美化，自动优化色彩、对比度和细节'
        });

        toast.success('AI智能美化完成！');
      } else {
        toast.error(result.error || '美化失败');
      }
    } catch (error) {
      console.error('AI美化失败:', error);
      toast.error('美化失败');
    } finally {
      setIsProcessing(false);
    }
  };

  // 重置预览
  const handleReset = () => {
    setPreviewFilter('');
    setSelectedPreset(null);
    setSelectedFilter(null);
    setIntensity(100);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* 模式切换标签 */}
      <div className="flex p-2 gap-1 overflow-x-auto scrollbar-hide">
        {[
          { id: 'smart', name: '一键美化', icon: 'magic' },
          { id: 'filter', name: 'AI滤镜', icon: 'filter' },
          { id: 'pattern', name: '纹样嵌入', icon: 'th' },
        ].map((mode) => (
          <motion.button
            key={mode.id}
            onClick={() => {
              setActiveMode(mode.id as EnhanceMode);
              handleReset();
            }}
            className={`flex-1 min-w-[80px] py-2 px-3 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1 ${
              activeMode === mode.id
                ? 'bg-violet-500 text-white shadow-md'
                : isDark
                  ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <i className={`fas fa-${mode.icon}`}></i>
            <span>{mode.name}</span>
          </motion.button>
        ))}
      </div>

      {/* 实时预览区域 */}
      {currentWork && (
        <div className="px-4 py-3">
          <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
            <div className="aspect-video relative">
              <img
                src={currentWork.thumbnail}
                alt="预览"
                className="w-full h-full object-cover transition-all duration-300"
                style={previewStyle}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                }}
              />
              {previewFilter && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded-full flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  预览中
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 强度调节 */}
      {previewFilter && (
        <div className="px-4 py-2">
          <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">效果强度</span>
              <span className="text-xs text-violet-500">{intensity}%</span>
            </div>
            <Slider
              value={[intensity]}
              onValueChange={(value) => setIntensity(value[0])}
              min={0}
              max={200}
              step={10}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* 内容区域 */}
      <div className="flex-1 p-4">
        {activeMode === 'smart' && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">选择美化风格</h4>
            <div className="grid grid-cols-2 gap-2">
              {SMART_PRESETS.map((preset) => (
                <motion.button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`p-3 rounded-xl text-left transition-all border-2 ${
                    selectedPreset === preset.id
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                      : isDark
                        ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      selectedPreset === preset.id
                        ? 'bg-violet-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      <i className={`fas fa-${preset.icon} text-sm`}></i>
                    </div>
                    <span className="font-medium text-sm">{preset.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {preset.description}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {activeMode === 'filter' && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">选择滤镜</h4>
            <div className="grid grid-cols-2 gap-2">
              {FILTER_PRESETS.map((filter) => (
                <motion.button
                  key={filter.id}
                  onClick={() => handleSelectFilter(filter.id)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    selectedFilter === filter.id
                      ? 'border-violet-500 ring-2 ring-violet-500/30'
                      : 'border-transparent'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {currentWork ? (
                    <img
                      src={currentWork.thumbnail}
                      alt={filter.name}
                      className="w-full h-full object-cover"
                      style={{ filter: filter.filter }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x200?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <i className="fas fa-image text-gray-400"></i>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                    <span className="text-white text-xs font-medium">{filter.name}</span>
                  </div>
                  {selectedFilter === filter.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {activeMode === 'pattern' && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">选择传统纹样</h4>
            <div className="grid grid-cols-3 gap-2">
              {TRADITIONAL_PATTERNS.slice(0, 6).map((pattern) => (
                <motion.button
                  key={pattern.id}
                  className={`p-3 rounded-xl text-center transition-all border-2 ${
                    isDark
                      ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <i className="fas fa-yin-yang text-2xl text-violet-500 mb-2"></i>
                  <p className="text-xs font-medium">{pattern.name}</p>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部操作按钮 */}
      {previewFilter && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={handleApply}
            disabled={isProcessing}
            className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-violet-500/30 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                处理中...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                应用效果
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            disabled={isProcessing}
            className="w-full py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
        </div>
      )}

      {!hasWork && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <i className="fas fa-image text-2xl text-gray-400"></i>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              请先生成或上传作品
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
