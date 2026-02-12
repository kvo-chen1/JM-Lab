import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../../hooks/useCreateStore';
import { traditionalPatterns } from '../../data';
import { toast } from 'sonner';

// 定义平铺模式类型
type TileMode = 'repeat' | 'mirror' | 'rotate' | 'random';

// 定义平铺配置类型
interface TileConfig {
  patternId: number | null;
  mode: TileMode;
  size: number;
  spacing: number;
  rotation: number;
  opacity: number;
}

const TilePanel: React.FC = () => {
  const { isDark } = useTheme();
  const { 
    updateState, 
    tilePatternId, 
    tileMode, 
    tileSize, 
    tileSpacing, 
    tileRotation, 
    tileOpacity,
    generatedResults
  } = useCreateStore();
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Derive tileConfig from store for rendering
  const tileConfig = {
    patternId: tilePatternId,
    mode: tileMode || 'repeat',
    size: tileSize || 100,
    spacing: tileSpacing || 0,
    rotation: tileRotation || 0,
    opacity: tileOpacity || 100
  };

  // 处理图案选择
  const handlePatternSelect = (patternId: number) => {
    updateState({ tilePatternId: patternId });
  };

  // 处理平铺模式变化
  const handleModeChange = (mode: TileMode) => {
    updateState({ tileMode: mode });
  };

  // 处理配置变化
  const handleConfigChange = (field: keyof Omit<TileConfig, 'patternId' | 'mode'>, value: number) => {
    const storeKeyMap: Record<string, string> = {
        size: 'tileSize',
        spacing: 'tileSpacing',
        rotation: 'tileRotation',
        opacity: 'tileOpacity'
    };
    const storeKey = storeKeyMap[field];
    if (storeKey) {
        updateState({ [storeKey]: value });
    }
  };

  // 应用平铺效果
  const handleApplyTile = () => {
    if (!tileConfig.patternId) return;
    
    // 检查是否有生成作品
    if (generatedResults.length === 0) {
      toast.error('请先生成作品后再应用纹样');
      return;
    }
    
    setIsGenerating(true);
    
    // 模拟应用过程
    setTimeout(() => {
      // 更新全局状态
      updateState({
        selectedPatternId: tileConfig.patternId,
        patternOpacity: tileConfig.opacity,
        patternScale: tileConfig.size,
        patternRotation: tileConfig.rotation,
        aiExplanation: `已应用${tileConfig.mode}平铺模式，图案大小${tileConfig.size}%，间距${tileConfig.spacing}px，旋转${tileConfig.rotation}度，透明度${tileConfig.opacity}%`,
        showAIReview: true
      });
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">图案平铺</h3>
        <p className="text-xs opacity-70 mb-3">将纹样以不同方式平铺，创造丰富的图案效果</p>
        
        {/* 图案选择 */}
        <div className={`rounded-lg border p-3 mb-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h4 className="text-sm font-medium mb-3">选择纹样</h4>
          <div className="grid grid-cols-3 gap-2">
            {traditionalPatterns.map((pattern) => {
              const isSelected = tileConfig.patternId === pattern.id;
              return (
                <motion.button
                  key={pattern.id}
                  onClick={() => handlePatternSelect(pattern.id)}
                  className={`group rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    tileConfig.patternId === pattern.id 
                      ? 'border-[#C02C38] ring-2 ring-[#C02C38]/20 scale-105 z-10' 
                      : isDark ? 'border-gray-700 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="aspect-square relative">
                    <img
                      src={pattern.thumbnail}
                      alt={pattern.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        // 图片加载失败时显示占位符
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/150?text=${encodeURIComponent(pattern.name)}`;
                      }}
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-[#C02C38] flex items-center justify-center">
                        <i className="fas fa-check text-white text-[8px]"></i>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 平铺模式选择 */}
      <div className={`rounded-lg border p-3 mb-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h4 className="text-sm font-medium mb-3">平铺模式</h4>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'repeat', label: '重复', icon: 'repeat' },
            { value: 'mirror', label: '镜像', icon: 'ad' },
            { value: 'rotate', label: '旋转', icon: 'sync-alt' },
            { value: 'random', label: '随机', icon: 'shuffle' }
          ] as const).map((mode) => (
            <motion.button
              key={mode.value}
              onClick={() => handleModeChange(mode.value)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex flex-col items-center gap-1 ${
                tileConfig.mode === mode.value 
                  ? 'bg-[#C02C38] text-white shadow-md' 
                  : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <i className={`fas fa-${mode.icon}`}></i>
              <span>{mode.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 平铺参数设置 */}
      <div className={`rounded-lg border p-3 mb-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h4 className="text-sm font-medium mb-3">参数设置</h4>
        
        {/* 图案大小 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium">图案大小</label>
            <span className="text-xs opacity-70">{tileConfig.size}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="200"
            value={tileConfig.size}
            onChange={(e) => handleConfigChange('size', parseInt(e.target.value))}
            className={`w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#C02C38]`}
          />
        </div>

        {/* 平铺间距 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium">平铺间距</label>
            <span className="text-xs opacity-70">{tileConfig.spacing}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            value={tileConfig.spacing}
            onChange={(e) => handleConfigChange('spacing', parseInt(e.target.value))}
            className={`w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#C02C38]`}
          />
        </div>

        {/* 旋转角度 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium">旋转角度</label>
            <span className="text-xs opacity-70">{tileConfig.rotation}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={tileConfig.rotation}
            onChange={(e) => handleConfigChange('rotation', parseInt(e.target.value))}
            className={`w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#C02C38]`}
          />
        </div>

        {/* 透明度 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium">透明度</label>
            <span className="text-xs opacity-70">{tileConfig.opacity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={tileConfig.opacity}
            onChange={(e) => handleConfigChange('opacity', parseInt(e.target.value))}
            className={`w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#C02C38]`}
          />
        </div>
      </div>

      {/* 平铺预览 */}
      {tileConfig.patternId && (
        <div className={`rounded-lg border p-3 mb-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h4 className="text-sm font-medium mb-3">预览效果</h4>
          <div 
            className="w-full h-40 rounded-lg overflow-hidden relative"
            style={{
              backgroundImage: `url(${traditionalPatterns.find(p => p.id === tileConfig.patternId)?.thumbnail})`,
              backgroundSize: `${tileConfig.size}px ${tileConfig.size}px`,
              backgroundRepeat: 'repeat',
              opacity: tileConfig.opacity / 100,
              transform: `rotate(${tileConfig.rotation}deg)`,
              // 根据平铺模式设置不同的背景效果
              // 注意：这里只是简单的预览，实际实现可能需要更复杂的CSS或Canvas处理
              filter: tileConfig.mode === 'mirror' ? 'brightness(0.9)' : 'none'
            }}
          >
            {/* 平铺效果说明 */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2">
              {tileConfig.mode === 'repeat' && '重复平铺模式'}
              {tileConfig.mode === 'mirror' && '镜像平铺模式'}
              {tileConfig.mode === 'rotate' && '旋转平铺模式'}
              {tileConfig.mode === 'random' && '随机平铺模式'}
            </div>
          </div>
        </div>
      )}

      {/* 应用按钮 */}
      <div className="mt-auto">
        <motion.button
          onClick={handleApplyTile}
          disabled={!tileConfig.patternId || isGenerating}
          className={`w-full py-3 rounded-lg font-medium transition-all duration-300 ${isDark 
            ? !tileConfig.patternId 
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
              : isGenerating 
                ? 'bg-[#C02C38]/70 text-white cursor-not-allowed' 
                : 'bg-[#C02C38] text-white hover:bg-[#A0232F] shadow-lg shadow-[#C02C38]/30' 
            : !tileConfig.patternId 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : isGenerating 
                ? 'bg-[#C02C38]/70 text-white cursor-not-allowed' 
                : 'bg-[#C02C38] text-white hover:bg-[#A0232F] shadow-lg shadow-[#C02C38]/30'}`}
          whileHover={tileConfig.patternId && !isGenerating ? { scale: 1.02 } : {}}
          whileTap={tileConfig.patternId && !isGenerating ? { scale: 0.98 } : {}}
        >
          {isGenerating ? (
            <div className="flex items-center justify-center gap-2">
              <i className="fas fa-spinner fa-spin text-sm"></i>
              <span>应用中...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <i className="fas fa-border-all text-sm"></i>
              <span>应用图案平铺</span>
            </div>
          )}
        </motion.button>
        <p className="text-xs text-center opacity-50 mt-2">选择纹样和平铺模式以应用</p>
      </div>
    </div>
  );
};

export default TilePanel;