import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../../hooks/useCreateStore';
import { aiFilters } from '../../data';
import { motion } from 'framer-motion';

export default function FilterPanel() {
  const { isDark } = useTheme();
  const { selectedFilterId, filterIntensity, updateState } = useCreateStore();

  const handleFilterSelect = (filterId: number) => {
    updateState({ selectedFilterId: filterId });
    // 这里可以添加滤镜应用的逻辑
    console.log('应用滤镜', filterId);
  };

  const handleIntensityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateState({ filterIntensity: parseInt(e.target.value) });
    // 这里可以添加滤镜强度调整的逻辑
    console.log('调整滤镜强度', parseInt(e.target.value));
  };

  const selectedFilter = aiFilters.find(filter => filter.id === selectedFilterId);

  return (
    <div className="p-4 h-full overflow-y-auto">
      {/* Panel Header */}
      <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-800">
        <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>AI滤镜</h3>
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>为您的作品添加独特的视觉效果</p>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
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
            </div>
          </motion.button>
        ))}
      </div>

      {/* Filter Details */}
      {selectedFilter && (
        <div className={`mb-6 p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border border-gray-200 dark:border-gray-700`}>
          <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedFilter.name}</h4>
          <p className={`text-xs mt-1 mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selectedFilter.description}</p>
          
          {/* Intensity Control */}
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
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-300 dark:bg-gray-700"
              style={{
                background: `linear-gradient(to right, #C02C38 0%, #C02C38 ${filterIntensity}%, ${isDark ? '#374151' : '#D1D5DB'} ${filterIntensity}%, ${isDark ? '#374151' : '#D1D5DB'} 100%)`
              }}
            />
          </div>
        </div>
      )}

      {/* Apply Button */}
      {selectedFilter && (
        <motion.button
          onClick={() => {
            // 这里可以添加应用滤镜的逻辑
            console.log('确认应用滤镜', selectedFilter.id, '强度', filterIntensity);
          }}
          className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${isDark ? 'bg-[#C02C38] hover:bg-[#A01E2A] text-white' : 'bg-[#C02C38] hover:bg-[#A01E2A] text-white'}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <i className="fas fa-magic mr-1"></i> 应用滤镜
        </motion.button>
      )}
    </div>
  );
}
