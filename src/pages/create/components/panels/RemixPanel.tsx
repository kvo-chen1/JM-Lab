import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../../hooks/useCreateStore';
import { stylePresets } from '../../data';
import { StylePreset } from '../../types';

const RemixPanel: React.FC = () => {
  const { isDark } = useTheme();
  const { updateState } = useCreateStore();
  const [selectedStyles, setSelectedStyles] = useState<Array<{ style: StylePreset; weight: number }>>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // 获取所有风格分类
  const categories = ['all', ...Array.from(new Set(stylePresets.map(preset => preset.category)))];

  // 过滤风格预设
  const filteredPresets = activeCategory === 'all'
    ? stylePresets
    : stylePresets.filter(preset => preset.category === activeCategory);

  // 处理风格选择
  const handleStyleSelect = (style: StylePreset) => {
    // 检查风格是否已被选择
    const existingIndex = selectedStyles.findIndex(item => item.style.id === style.id);
    
    if (existingIndex >= 0) {
      // 如果已选择，则移除
      setSelectedStyles(selectedStyles.filter((_, index) => index !== existingIndex));
    } else {
      // 如果未选择且未超过3个，则添加
      if (selectedStyles.length < 3) {
        setSelectedStyles([...selectedStyles, { style, weight: 33 }]);
      }
    }
  };

  // 处理权重调整
  const handleWeightChange = (index: number, weight: number) => {
    const updatedStyles = [...selectedStyles];
    updatedStyles[index].weight = weight;
    
    // 重新计算权重，确保总和为100
    const totalWeight = updatedStyles.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight > 0) {
      const normalizedStyles = updatedStyles.map(item => ({
        ...item,
        weight: Math.round((item.weight / totalWeight) * 100)
      }));
      setSelectedStyles(normalizedStyles);
    } else {
      setSelectedStyles(updatedStyles);
    }
  };

  // 处理风格重混生成
  const handleRemixGenerate = () => {
    if (selectedStyles.length < 2) return;
    
    setIsGenerating(true);
    
    // 模拟生成过程
    setTimeout(() => {
      // 这里可以添加实际的生成逻辑
      updateState({
        aiExplanation: `已生成融合${selectedStyles.map(item => item.style.name).join('、')}风格的设计方案`,
        showAIReview: true
      });
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">风格重混</h3>
        <p className="text-xs opacity-70 mb-3">选择2-3种风格进行融合，调整权重以获得理想效果</p>
        
        {/* 分类选择 */}
        <div className="flex overflow-x-auto space-x-2 mb-3 pb-2 scrollbar-hide scroll-smooth snap-x snap-mandatory">
          {categories.map((category) => (
            <motion.button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all duration-200 ease-in-out snap-center ${isDark 
                ? activeCategory === category 
                  ? 'bg-[#C02C38]/20 text-[#C02C38] shadow-md' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300' 
                : activeCategory === category 
                  ? 'bg-[#C02C38]/10 text-[#C02C38] shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              tabIndex={0}
              role="tab"
              aria-selected={activeCategory === category}
            >
              {category === 'all' ? '全部' : category}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 风格预设列表 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {filteredPresets.map((style) => {
          const isSelected = selectedStyles.some(item => item.style.id === style.id);
          return (
            <motion.button
              key={style.id}
              onClick={() => handleStyleSelect(style)}
              className={`group rounded-lg overflow-hidden border-2 transition-all duration-300 hover:shadow-md ${isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'} ${isSelected 
                ? 'border-[#C02C38] ring-2 ring-[#C02C38]/20 scale-105 z-10' 
                : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
              whileTap={{ scale: 0.95 }}
              disabled={isSelected ? false : selectedStyles.length >= 3}
            >
              <div className="relative">
                <div className="aspect-square relative">
                  <img
                    src={style.thumbnail}
                    alt={style.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      // 图片加载失败时显示占位符
                      const target = e.target as HTMLImageElement;
                      target.src = `https://via.placeholder.com/150?text=${encodeURIComponent(style.name)}`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 z-10">
                    <p className="text-white text-xs font-medium">{style.name}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#C02C38] flex items-center justify-center z-20">
                      <i className="fas fa-check text-white text-[10px]"></i>
                    </div>
                  )}
                </div>
                <div className="p-2 bg-gray-100 dark:bg-gray-900">
                  <p className="text-xs font-medium truncate">{style.name}</p>
                  <p className="text-[9px] opacity-70 truncate">{style.description}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* 已选择风格和权重调整 */}
      {selectedStyles.length > 0 && (
        <div className={`rounded-lg border p-3 mb-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h4 className="text-sm font-medium mb-3">已选择风格 ({selectedStyles.length}/3)</h4>
          <div className="space-y-3">
            {selectedStyles.map((item, index) => (
              <div key={item.style.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={item.style.thumbnail}
                      alt={item.style.name}
                      className="w-6 h-6 rounded object-cover"
                      onError={(e) => {
                        // 图片加载失败时显示占位符
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/48x48?text=${encodeURIComponent(item.style.name)}`;
                      }}
                    />
                    <p className="text-sm font-medium">{item.style.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={item.weight}
                      onChange={(e) => handleWeightChange(index, parseInt(e.target.value))}
                      className={`w-24 h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#C02C38]`}
                    />
                    <span className="text-xs font-medium w-8 text-center">{item.weight}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 生成按钮 */}
      <div className="mt-auto">
        <motion.button
          onClick={handleRemixGenerate}
          disabled={selectedStyles.length < 2 || isGenerating}
          className={`w-full py-3 rounded-lg font-medium transition-all duration-300 ${isDark 
            ? selectedStyles.length < 2 
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
              : isGenerating 
                ? 'bg-[#C02C38]/70 text-white cursor-not-allowed' 
                : 'bg-[#C02C38] text-white hover:bg-[#A0232F] shadow-lg shadow-[#C02C38]/30' 
            : selectedStyles.length < 2 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : isGenerating 
                ? 'bg-[#C02C38]/70 text-white cursor-not-allowed' 
                : 'bg-[#C02C38] text-white hover:bg-[#A0232F] shadow-lg shadow-[#C02C38]/30'}`}
          whileHover={selectedStyles.length >= 2 && !isGenerating ? { scale: 1.02 } : {}}
          whileTap={selectedStyles.length >= 2 && !isGenerating ? { scale: 0.98 } : {}}
        >
          {isGenerating ? (
            <div className="flex items-center justify-center gap-2">
              <i className="fas fa-spinner fa-spin text-sm"></i>
              <span>生成中...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <i className="fas fa-random text-sm"></i>
              <span>生成融合风格</span>
            </div>
          )}
        </motion.button>
        <p className="text-xs text-center opacity-50 mt-2">选择至少2种风格进行融合</p>
      </div>
    </div>
  );
};

export default RemixPanel;