import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../../hooks/useCreateStore';
import { stylePresets } from '../../data';
import { StylePreset } from '../../types';
import { toast } from 'sonner';

const RemixPanel: React.FC = () => {
  const { isDark } = useTheme();
  const { updateState, selectedResult, generatedResults } = useCreateStore();
  const [selectedStyles, setSelectedStyles] = useState<Array<{ style: StylePreset; weight: number }>>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [realTimePreview, setRealTimePreview] = useState(true);

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
        const newStyles = [...selectedStyles, { style, weight: 33 }];
        // 重新计算权重，确保总和为100
        const totalWeight = newStyles.length * 33;
        const normalizedStyles = newStyles.map(item => ({
          ...item,
          weight: Math.round((item.weight / totalWeight) * 100)
        }));
        setSelectedStyles(normalizedStyles);
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

    // 检查是否有生成作品
    if (generatedResults.length === 0) {
      toast.error('请先生成作品后再进行风格重混');
      return;
    }

    setIsGenerating(true);

    // 模拟生成过程
    setTimeout(() => {
      // 这里可以添加实际的生成逻辑
      updateState({
        aiExplanation: `已生成融合${selectedStyles.map(item => `${item.style.name}(${item.weight}%)`).join('、')}风格的设计方案`,
        showAIReview: true
      });
      setIsGenerating(false);
    }, 2000);
  };

  // 生成融合预览效果
  const generatePreviewStyle = () => {
    if (selectedStyles.length === 0) return {};
    
    // 计算颜色混合
    const baseColors = {
      '中国传统': 'rgba(255, 100, 100, 0.3)',
      '现代简约': 'rgba(150, 200, 255, 0.3)',
      '复古怀旧': 'rgba(255, 220, 150, 0.3)',
      '装饰艺术': 'rgba(200, 150, 255, 0.3)',
      '日式侘寂': 'rgba(200, 200, 180, 0.3)',
      '北欧风格': 'rgba(150, 255, 220, 0.3)',
      '霓虹未来': 'rgba(255, 150, 255, 0.3)',
      '波西米亚': 'rgba(255, 200, 100, 0.3)'
    };
    
    // 计算混合颜色
    let mixedColor = 'rgba(0, 0, 0, 0)';
    if (selectedStyles.length > 0) {
      const colorValues = selectedStyles.map(item => {
        const baseColor = baseColors[item.style.name as keyof typeof baseColors] || 'rgba(0, 0, 0, 0)';
        return {
          color: baseColor,
          weight: item.weight / 100
        };
      });
      
      // 简单的颜色混合计算
      const rgbaValues = colorValues.map(cv => {
        const rgba = cv.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([0-1]|1|0?\.\d+)\)/);
        if (rgba) {
          return {
            r: parseInt(rgba[1]) * cv.weight,
            g: parseInt(rgba[2]) * cv.weight,
            b: parseInt(rgba[3]) * cv.weight,
            a: parseFloat(rgba[4]) * cv.weight
          };
        }
        return { r: 0, g: 0, b: 0, a: 0 };
      });
      
      const total = rgbaValues.reduce((sum, cv) => {
        return {
          r: sum.r + cv.r,
          g: sum.g + cv.g,
          b: sum.b + cv.b,
          a: sum.a + cv.a
        };
      }, { r: 0, g: 0, b: 0, a: 0 });
      
      mixedColor = `rgba(${Math.round(total.r)}, ${Math.round(total.g)}, ${Math.round(total.b)}, ${total.a})`;
    }
    
    return {
      backgroundColor: realTimePreview ? mixedColor : 'rgba(0, 0, 0, 0)',
      transition: 'background-color 0.3s ease'
    };
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
              {category === 'all' ? '全部' : category === '传统' ? '中国传统' : category === '现代' ? '现代风格' : category === '复古' ? '复古怀旧' : category === '艺术' ? '艺术风格' : category === '未来' ? '未来风格' : category}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 风格融合预览 */}
      {selectedStyles.length > 0 && (
        <div className={`mb-6 rounded-lg overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'} bg-gradient-to-br ${isDark ? 'from-gray-800 to-gray-900' : 'from-gray-50 to-gray-100'} p-3`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>风格融合预览</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-70">{realTimePreview ? '开启' : '关闭'}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={realTimePreview}
                  onChange={(e) => setRealTimePreview(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full peer ${realTimePreview ? 'bg-[#C02C38]' : 'bg-gray-600'} peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#C02C38] peer-focus:ring-opacity-50 transition-all duration-300`}></div>
                <div className={`absolute left-1.5 top-1.5 bg-white w-3 h-3 rounded-full transition-transform duration-300 ${realTimePreview ? 'transform translate-x-5' : ''}`}></div>
              </label>
            </div>
          </div>
          
          <div className="relative aspect-video rounded-lg overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'} bg-gray-800 dark:bg-gray-900">
            {selectedResult ? (
              <div className="relative w-full h-full">
                {/* 基础图片 */}
                <img
                  src={`https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&h=400&fit=crop`}
                  alt="基础图片"
                  className="w-full h-full object-cover opacity-90"
                />
                
                {/* 风格融合叠加层 */}
                <div 
                  className="absolute inset-0 transition-all duration-500"
                  style={{
                    ...generatePreviewStyle(),
                    backdropFilter: selectedStyles.some(item => item.style.name === '现代简约') ? 'blur(2px)' : 'none',
                    mixBlendMode: 'overlay'
                  }}
                ></div>
                
                {/* 风格标签 */}
                <div className="absolute bottom-2 left-2 bg-[#C02C38] text-white text-xs px-2 py-1 rounded">
                  {selectedStyles.map((item, index) => (
                    <span key={index} className="mr-1">
                      {item.style.name}({item.weight}%)
                      {index < selectedStyles.length - 1 && '+'}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <i className="fas fa-image text-2xl mb-2"></i>
                  <p className="text-xs">请先选择一张作品图片</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                : 'opacity-70 hover:opacity-100 hover:scale-105'} ${!isSelected && selectedStyles.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileTap={{ scale: 0.95 }}
              disabled={!isSelected && selectedStyles.length >= 3}
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
                  {!isSelected && selectedStyles.length >= 3 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                      <i className="fas fa-lock text-white text-xl opacity-70"></i>
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
          <div className="space-y-4">
            {selectedStyles.map((item, index) => (
              <div key={item.style.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img
                        src={item.style.thumbnail}
                        alt={item.style.name}
                        className="w-10 h-10 rounded object-cover border-2 border-[#C02C38]"
                        onError={(e) => {
                          // 图片加载失败时显示占位符
                          const target = e.target as HTMLImageElement;
                          target.src = `https://via.placeholder.com/48x48?text=${encodeURIComponent(item.style.name)}`;
                        }}
                      />
                      <button
                        onClick={() => handleStyleSelect(item.style)}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs hover:bg-red-700 transition-colors"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.style.name}</p>
                      <p className="text-[9px] opacity-70">{item.style.category}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[#C02C38]">{item.weight}%</span>
                </div>
                
                {/* 权重滑块 */}
                <div className="px-2">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={item.weight}
                    onChange={(e) => handleWeightChange(index, parseInt(e.target.value))}
                    className={`w-full h-3 rounded-lg appearance-none cursor-pointer bg-gray-300 dark:bg-gray-700`}
                    style={{
                      background: `linear-gradient(to right, #C02C38 0%, #C02C38 ${item.weight}%, ${isDark ? '#374151' : '#D1D5DB'} ${item.weight}%, ${isDark ? '#374151' : '#D1D5DB'} 100%)`
                    }}
                  />
                  
                  {/* 权重刻度 */}
                  <div className="flex justify-between text-[8px] text-gray-500 dark:text-gray-400 mt-1">
                    <span>1%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 风格权重饼图 */}
          {selectedStyles.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <h5 className="text-xs font-medium mb-3">权重分布</h5>
              <div className="flex justify-center items-center">
                <div className="relative w-32 h-32">
                  {/* 饼图 */}
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {selectedStyles.map((item, index) => {
                      const cumulativeAngle = selectedStyles.slice(0, index).reduce((sum, s) => sum + s.weight, 0);
                      const startAngle = (cumulativeAngle / 100) * 360;
                      const endAngle = ((cumulativeAngle + item.weight) / 100) * 360;
                      
                      const startRad = (startAngle - 90) * Math.PI / 180;
                      const endRad = (endAngle - 90) * Math.PI / 180;
                      
                      const x1 = 50 + 40 * Math.cos(startRad);
                      const y1 = 50 + 40 * Math.sin(startRad);
                      const x2 = 50 + 40 * Math.cos(endRad);
                      const y2 = 50 + 40 * Math.sin(endRad);
                      
                      const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
                      
                      return (
                        <path
                          key={item.style.id}
                          d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                          fill={`hsl(${index * 45}, 70%, 60%)`}
                          opacity="0.8"
                        />
                      );
                    })}
                    {/* 中心圆 */}
                    <circle cx="50" cy="50" r="25" fill={isDark ? '#1F2937' : '#FFFFFF'} />
                  </svg>
                  
                  {/* 中心文字 */}
                  <div className="absolute inset-0 flex items-center justify-center text-center">
                    <div>
                      <div className="text-sm font-bold">融合</div>
                      <div className="text-[10px] opacity-70">风格</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
        <p className="text-xs text-center opacity-50 mt-2">
          {selectedStyles.length === 0 ? '请选择2-3种风格' : 
           selectedStyles.length === 1 ? '再选择1-2种风格' : 
           '调整权重获得理想效果'}
        </p>
      </div>
    </div>
  );
};

export default RemixPanel;