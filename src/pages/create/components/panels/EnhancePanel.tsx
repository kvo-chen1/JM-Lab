import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../../hooks/useCreateStore';
import { TRADITIONAL_PATTERNS, AI_FILTERS } from '@/constants/creativeData';
import { toast } from 'sonner';

// 智能美化模式
type EnhanceMode = 'smart' | 'filter' | 'pattern' | 'tile' | 'color';

// 一键美化预设
const SMART_PRESETS = [
  { id: 'vivid', name: '鲜艳增强', icon: 'sun', description: '提升色彩饱和度，让画面更生动' },
  { id: 'soft', name: '柔和唯美', icon: 'cloud', description: '降低对比度，营造梦幻氛围' },
  { id: 'classic', name: '经典复古', icon: 'history', description: '添加复古色调，怀旧情怀' },
  { id: 'culture', name: '国潮风格', icon: 'dragon', description: '强化中国传统色彩特征' },
  { id: 'clear', name: '清晰锐化', icon: 'eye', description: '增强细节，提升清晰度' },
  { id: 'warm', name: '温暖色调', icon: 'fire', description: '增加暖色调，温馨舒适' },
];

// 平铺模式
const TILE_MODES = [
  { id: 'repeat', name: '重复', icon: 'th' },
  { id: 'mirror', name: '镜像', icon: 'adjust' },
  { id: 'rotate', name: '旋转', icon: 'sync-alt' },
  { id: 'random', name: '随机', icon: 'random' },
];

export const EnhancePanel: React.FC = () => {
  const { isDark } = useTheme();
  const { 
    updateState, 
    generatedResults,
    selectedResult,
    patternOpacity,
    patternScale,
    patternRotation,
    patternBlendMode
  } = useCreateStore();

  const [activeMode, setActiveMode] = useState<EnhanceMode>('smart');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<number | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<number | null>(null);
  const [selectedTileMode, setSelectedTileMode] = useState<string>('repeat');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterIntensity, setFilterIntensity] = useState(50);

  // 检查是否有作品
  const hasWork = generatedResults.length > 0;

  // 一键智能美化
  const handleSmartEnhance = async (presetId: string) => {
    if (!hasWork) {
      toast.error('请先生成或上传作品');
      return;
    }

    setSelectedPreset(presetId);
    setIsProcessing(true);

    // 模拟AI处理
    setTimeout(() => {
      const preset = SMART_PRESETS.find(p => p.id === presetId);
      // 只更新AI说明，不显示AI点评弹窗
      updateState({
        aiExplanation: `已应用「${preset?.name}」智能美化效果`
      });
      setIsProcessing(false);
      toast.success(`已应用${preset?.name}效果`);
    }, 1500);
  };

  // 应用滤镜
  const handleApplyFilter = async () => {
    if (!hasWork || !selectedFilter) {
      toast.error('请选择滤镜效果');
      return;
    }

    setIsProcessing(true);
    const filter = AI_FILTERS.find(f => f.id === selectedFilter);
    
    setTimeout(() => {
      updateState({
        aiExplanation: `已应用「${filter?.name}」滤镜，强度${filterIntensity}%`
      });
      setIsProcessing(false);
      toast.success('滤镜应用成功');
    }, 1200);
  };

  // 应用纹样
  const handleApplyPattern = async () => {
    if (!hasWork || !selectedPattern) {
      toast.error('请选择纹样');
      return;
    }

    setIsProcessing(true);
    const pattern = TRADITIONAL_PATTERNS.find(p => p.id === selectedPattern);
    
    setTimeout(() => {
      updateState({
        selectedPatternId: selectedPattern,
        patternOpacity: 60,
        patternScale: 80,
        aiExplanation: `已嵌入「${pattern?.name}」传统纹样`
      });
      setIsProcessing(false);
      toast.success('纹样嵌入成功');
    }, 1200);
  };

  // 应用平铺
  const handleApplyTile = async () => {
    if (!hasWork || !selectedPattern) {
      toast.error('请选择图案');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      updateState({
        tilePatternId: selectedPattern,
        tileMode: selectedTileMode,
        aiExplanation: `已应用${TILE_MODES.find(m => m.id === selectedTileMode)?.name}平铺效果`
      });
      setIsProcessing(false);
      toast.success('平铺效果应用成功');
    }, 1200);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* 模式切换标签 */}
      <div className="flex p-2 gap-1 overflow-x-auto scrollbar-hide">
        {[
          { id: 'smart', name: '一键美化', icon: 'magic' },
          { id: 'filter', name: 'AI滤镜', icon: 'filter' },
          { id: 'pattern', name: '纹样嵌入', icon: 'th' },
          { id: 'tile', name: '图案平铺', icon: 'border-all' },
        ].map((mode) => (
          <motion.button
            key={mode.id}
            onClick={() => setActiveMode(mode.id as EnhanceMode)}
            className={`flex-1 min-w-[80px] py-2 px-3 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1 ${
              activeMode === mode.id
                ? 'bg-violet-500 text-white shadow-md'
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
      <div className="flex-1 p-4">
        <AnimatePresence mode="wait">
          {/* 一键美化模式 */}
          {activeMode === 'smart' && (
            <motion.div
              key="smart"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="text-sm font-medium mb-3">选择美化风格</div>
              <div className="grid grid-cols-2 gap-3">
                {SMART_PRESETS.map((preset) => (
                  <motion.button
                    key={preset.id}
                    onClick={() => handleSmartEnhance(preset.id)}
                    disabled={isProcessing}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedPreset === preset.id
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                        : isDark
                          ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        selectedPreset === preset.id
                          ? 'bg-violet-500 text-white'
                          : isDark
                            ? 'bg-gray-700 text-gray-400'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        <i className={`fas fa-${preset.icon}`}></i>
                      </div>
                      <div className="font-medium text-sm">{preset.name}</div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {preset.description}
                    </p>
                  </motion.button>
                ))}
              </div>

              {/* 智能推荐 */}
              <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <i className="fas fa-lightbulb text-yellow-500"></i>
                  <span className="text-sm font-medium">AI智能推荐</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  根据您的作品风格，推荐最适合的美化方案
                </p>
                <button
                  onClick={() => handleSmartEnhance('vivid')}
                  disabled={isProcessing || !hasWork}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <i className="fas fa-spinner fa-spin"></i>
                      AI处理中...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <i className="fas fa-wand-magic-sparkles"></i>
                      智能一键美化
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* 滤镜模式 */}
          {activeMode === 'filter' && (
            <motion.div
              key="filter"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="text-sm font-medium mb-3">选择滤镜效果</div>
              <div className="grid grid-cols-2 gap-3">
                {AI_FILTERS.map((filter) => (
                  <motion.button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={`rounded-xl overflow-hidden border-2 transition-all ${
                      selectedFilter === filter.id
                        ? 'border-violet-500 ring-2 ring-violet-500/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="aspect-video relative">
                      <img
                        src={filter.thumbnail}
                        alt={filter.name}
                        className="w-full h-full object-cover"
                      />
                      {selectedFilter === filter.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                          <i className="fas fa-check text-white text-xs"></i>
                        </div>
                      )}
                    </div>
                    <div className="p-2 bg-gray-100 dark:bg-gray-900">
                      <div className="text-xs font-medium">{filter.name}</div>
                      <div className="text-[10px] text-gray-500 truncate">{filter.description}</div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* 强度调节 */}
              {selectedFilter && (
                <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">滤镜强度</span>
                    <span className="text-sm text-violet-500">{filterIntensity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filterIntensity}
                    onChange={(e) => setFilterIntensity(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${filterIntensity}%, ${isDark ? '#374151' : '#D1D5DB'} ${filterIntensity}%, ${isDark ? '#374151' : '#D1D5DB'} 100%)`
                    }}
                  />
                  <button
                    onClick={handleApplyFilter}
                    disabled={isProcessing}
                    className="w-full mt-4 py-3 rounded-xl bg-violet-500 text-white font-medium shadow-lg disabled:opacity-50"
                  >
                    {isProcessing ? '应用中...' : '应用滤镜'}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* 纹样嵌入模式 */}
          {activeMode === 'pattern' && (
            <motion.div
              key="pattern"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="text-sm font-medium mb-3">选择传统纹样</div>
              <div className="grid grid-cols-3 gap-2">
                {TRADITIONAL_PATTERNS.map((pattern) => (
                  <motion.button
                    key={pattern.id}
                    onClick={() => setSelectedPattern(pattern.id)}
                    className={`rounded-xl overflow-hidden border-2 transition-all ${
                      selectedPattern === pattern.id
                        ? 'border-violet-500 ring-2 ring-violet-500/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="aspect-square relative">
                      <img
                        src={pattern.thumbnail}
                        alt={pattern.name}
                        className="w-full h-full object-cover"
                      />
                      {selectedPattern === pattern.id && (
                        <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                            <i className="fas fa-check text-white text-xs"></i>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-1.5 bg-gray-100 dark:bg-gray-900 text-center">
                      <div className="text-[10px] font-medium truncate">{pattern.name}</div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {selectedPattern && (
                <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-3">
                  <div className="text-sm font-medium">纹样属性</div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>透明度</span>
                      <span>60%</span>
                    </div>
                    <input type="range" className="w-full h-1.5 bg-gray-300 rounded-lg" defaultValue={60} />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>缩放</span>
                      <span>80%</span>
                    </div>
                    <input type="range" className="w-full h-1.5 bg-gray-300 rounded-lg" defaultValue={80} />
                  </div>
                  <button
                    onClick={handleApplyPattern}
                    disabled={isProcessing}
                    className="w-full py-3 rounded-xl bg-violet-500 text-white font-medium shadow-lg disabled:opacity-50"
                  >
                    {isProcessing ? '嵌入中...' : '嵌入纹样'}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* 平铺模式 */}
          {activeMode === 'tile' && (
            <motion.div
              key="tile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="text-sm font-medium mb-3">选择平铺图案</div>
              <div className="grid grid-cols-3 gap-2">
                {TRADITIONAL_PATTERNS.slice(0, 6).map((pattern) => (
                  <motion.button
                    key={pattern.id}
                    onClick={() => setSelectedPattern(pattern.id)}
                    className={`rounded-xl overflow-hidden border-2 transition-all ${
                      selectedPattern === pattern.id
                        ? 'border-violet-500'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="aspect-square">
                      <img
                        src={pattern.thumbnail}
                        alt={pattern.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="text-sm font-medium mb-3 mt-4">平铺模式</div>
              <div className="grid grid-cols-4 gap-2">
                {TILE_MODES.map((mode) => (
                  <motion.button
                    key={mode.id}
                    onClick={() => setSelectedTileMode(mode.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                      selectedTileMode === mode.id
                        ? 'bg-violet-500 text-white'
                        : isDark
                          ? 'bg-gray-800 text-gray-400'
                          : 'bg-gray-100 text-gray-600'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <i className={`fas fa-${mode.icon}`}></i>
                    <span>{mode.name}</span>
                  </motion.button>
                ))}
              </div>

              <button
                onClick={handleApplyTile}
                disabled={isProcessing || !selectedPattern}
                className="w-full py-3 rounded-xl bg-violet-500 text-white font-medium shadow-lg disabled:opacity-50 mt-4"
              >
                {isProcessing ? '应用中...' : '应用平铺'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};


