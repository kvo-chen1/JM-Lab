import React, { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../../hooks/useCreateStore';
import { aiFilters } from '../../data';
import { motion } from 'framer-motion';

export default function FilterPanel() {
  const { isDark } = useTheme();
  const { selectedFilterId, filterIntensity, updateState, selectedResult } = useCreateStore();
  const [isApplying, setIsApplying] = useState(false);
  const [realTimePreview, setRealTimePreview] = useState(true);

  const selectedFilter = aiFilters.find(filter => filter.id === selectedFilterId);

  // 处理滤镜选择
  const handleFilterSelect = (filterId: number) => {
    updateState({ selectedFilterId: filterId });
  };

  // 处理强度调整
  const handleIntensityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const intensity = parseInt(e.target.value);
    updateState({ filterIntensity: intensity });
  };

  // 应用滤镜
  const handleApplyFilter = async () => {
    if (!selectedFilter) return;
    
    setIsApplying(true);
    
    try {
      // 模拟API调用，生成应用滤镜的图片
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      updateState({
        aiExplanation: `已成功将「${selectedFilter.name}」滤镜应用到您的作品，强度为${filterIntensity}%`,
        showAIReview: true
      });
    } catch (error) {
      console.error('应用滤镜失败:', error);
    } finally {
      setIsApplying(false);
    }
  };

  // 生成滤镜预览效果
  const generatePreviewUrl = () => {
    if (!selectedFilter) return '';
    
    // 实际项目中应该调用API生成实时预览
    // 这里使用模拟数据
    return selectedFilter.thumbnail;
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Panel Header */}
      <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-800">
        <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>AI滤镜</h3>
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>为您的作品添加独特的视觉效果</p>
      </div>

      {/* 滤镜预览区域 */}
      {selectedFilter && (
        <div className={`mb-6 rounded-lg overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'} bg-gradient-to-br ${isDark ? 'from-gray-800 to-gray-900' : 'from-gray-50 to-gray-100'} p-3`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>实时预览</h4>
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
                {/* 原始图片 */}
                <img
                  src={`https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&h=400&fit=crop`}
                  alt="原始图片"
                  className="w-full h-full object-cover"
                />
                
                {/* 滤镜叠加层 - 模拟滤镜效果 */}
                <div 
                  className="absolute inset-0 transition-opacity duration-300"
                  style={{
                    opacity: realTimePreview ? filterIntensity / 100 : 0,
                    backgroundColor: selectedFilter.name === '复古胶片' ? 'rgba(255, 230, 180, 0.3)' : 
                                      selectedFilter.name === '赛博朋克' ? 'rgba(0, 200, 255, 0.2)' :
                                      selectedFilter.name === '水墨风格' ? 'rgba(0, 0, 0, 0.4)' :
                                      selectedFilter.name === '日系清新' ? 'rgba(255, 240, 245, 0.3)' :
                                      selectedFilter.name === '油画效果' ? 'rgba(200, 180, 150, 0.2)' :
                                      selectedFilter.name === '黑白经典' ? 'rgba(120, 120, 120, 0.5)' :
                                      selectedFilter.name === '洛可可风格' ? 'rgba(255, 220, 255, 0.2)' :
                                      selectedFilter.name === '故障艺术' ? 'rgba(255, 0, 255, 0.1)' : 'rgba(0, 0, 0, 0)',
                    filter: selectedFilter.name === '复古胶片' ? `contrast(1.1) saturate(1.2)` :
                             selectedFilter.name === '赛博朋克' ? `contrast(1.3) saturate(1.5)` :
                             selectedFilter.name === '水墨风格' ? `grayscale(1) contrast(1.4)` :
                             selectedFilter.name === '日系清新' ? `brightness(1.1) contrast(0.9) saturate(0.8)` :
                             selectedFilter.name === '油画效果' ? `contrast(1.2) saturate(1.3)` :
                             selectedFilter.name === '黑白经典' ? `grayscale(1)` :
                             selectedFilter.name === '洛可可风格' ? `brightness(1.1) saturate(1.2)` :
                             selectedFilter.name === '故障艺术' ? `contrast(1.5) saturate(2)` : 'none'
                  }}
                />
                
                {/* 滤镜信息标签 */}
                <div className="absolute bottom-2 left-2 bg-[#C02C38] text-white text-xs px-2 py-1 rounded">
                  {selectedFilter.name} · {filterIntensity}%
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

      {/* 滤镜列表 */}
      <div className="mb-6">
        <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>滤镜效果</h4>
        <div className="grid grid-cols-2 gap-3">
          {aiFilters.map((filter) => (
            <motion.button
              key={filter.id}
              onClick={() => handleFilterSelect(filter.id)}
              className={`group rounded-lg overflow-hidden border-2 transition-all duration-300 hover:shadow-md ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} ${selectedFilterId === filter.id ? 'border-[#C02C38] ring-2 ring-[#C02C38]/20 scale-105 z-10' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
              whileTap={{ scale: 0.95 }}
            >
              <div className="aspect-square relative">
                <img
                  src={filter.thumbnail}
                  alt={filter.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    // 图片加载失败时显示占位符
                    const target = e.target as HTMLImageElement;
                    target.src = `https://via.placeholder.com/150?text=${encodeURIComponent(filter.name)}`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 z-10">
                  <p className="text-white text-xs font-medium">{filter.name}</p>
                </div>
                {selectedFilterId === filter.id && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#C02C38] flex items-center justify-center z-20">
                    <i className="fas fa-check text-white text-[10px]"></i>
                  </div>
                )}
              </div>
              <div className="p-2 bg-gray-100 dark:bg-gray-900">
                <p className="text-xs font-medium truncate">{filter.name}</p>
                <p className="text-[9px] opacity-70 truncate">{filter.description}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 滤镜详情和强度调整 */}
      {selectedFilter && (
        <div className={`mb-6 p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border border-gray-200 dark:border-gray-700`}>
          <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedFilter.name}</h4>
          <p className={`text-xs mt-1 mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selectedFilter.description}</p>
          
          {/* 分类标签 */}
          <div className="mb-4">
            <span className={`inline-block px-2 py-1 rounded-full text-xs ${isDark ? 'bg-[#C02C38]/20 text-[#C02C38]' : 'bg-[#C02C38]/10 text-[#C02C38]'}`}>
              {selectedFilter.category}
            </span>
          </div>
          
          {/* 强度控制 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>强度</label>
              <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{filterIntensity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={filterIntensity}
              onChange={handleIntensityChange}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-300 dark:bg-gray-700"
              style={{
                background: `linear-gradient(to right, #C02C38 0%, #C02C38 ${filterIntensity}%, ${isDark ? '#374151' : '#D1D5DB'} ${filterIntensity}%, ${isDark ? '#374151' : '#D1D5DB'} 100%)`
              }}
            />
            {/* 强度预设 */}
            <div className="flex justify-between mt-2">
              {[0, 25, 50, 75, 100].map((preset) => (
                <button
                  key={preset}
                  onClick={() => updateState({ filterIntensity: preset })}
                  className={`text-xs px-2 py-0.5 rounded-full transition-all duration-200 ${isDark 
                    ? filterIntensity === preset 
                      ? 'bg-[#C02C38]/20 text-[#C02C38]' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
                    : filterIntensity === preset 
                      ? 'bg-[#C02C38]/10 text-[#C02C38]' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 应用按钮 */}
      {selectedFilter && (
        <motion.button
          onClick={handleApplyFilter}
          disabled={isApplying}
          className={`w-full py-3 rounded-lg font-medium transition-all duration-300 ${isDark 
            ? isApplying 
              ? 'bg-[#C02C38]/70 text-white cursor-not-allowed' 
              : 'bg-[#C02C38] hover:bg-[#A0232F] text-white shadow-lg shadow-[#C02C38]/30' 
            : isApplying 
              ? 'bg-[#C02C38]/70 text-white cursor-not-allowed' 
              : 'bg-[#C02C38] hover:bg-[#A0232F] text-white shadow-lg shadow-[#C02C38]/30'}`}
          whileHover={!isApplying ? { scale: 1.02 } : {}}
          whileTap={!isApplying ? { scale: 0.98 } : {}}
        >
          {isApplying ? (
            <div className="flex items-center justify-center gap-2">
              <i className="fas fa-spinner fa-spin text-sm"></i>
              <span>应用中...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <i className="fas fa-magic text-sm"></i>
              <span>应用滤镜</span>
            </div>
          )}
        </motion.button>
      )}
    </div>
  );
}
