import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../../hooks/useCreateStore';
import { traditionalPatterns } from '../../data';
import { motion } from 'framer-motion';

export default function PatternPanel() {
  const { isDark } = useTheme();
  const { selectedPatternId, updateState, setSelectedResult, selectedResult } = useCreateStore();

  const handlePatternSelect = (patternId: number) => {
    updateState({ selectedPatternId: patternId });
    // 这里可以添加纹样嵌入的逻辑
    // 暂时简单处理，将纹样应用到当前选中的图片
    if (selectedResult) {
      // 实际项目中应该调用API或本地逻辑来生成嵌入纹样的图片
      console.log('应用纹样', patternId, '到图片', selectedResult);
    }
  };

  return (
    <div className="p-4 h-full overflow-y-auto">
      {/* Panel Header */}
      <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-800">
        <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>纹样库</h3>
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>选择传统纹样添加到您的作品中</p>
      </div>

      {/* Pattern Grid */}
      <div className="grid grid-cols-2 gap-3">
        {traditionalPatterns.map((pattern) => (
          <motion.button
            key={pattern.id}
            onClick={() => handlePatternSelect(pattern.id)}
            className={`group rounded-lg overflow-hidden border-2 transition-all duration-300 hover:shadow-md ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} ${selectedPatternId === pattern.id ? 'border-[#C02C38] ring-2 ring-[#C02C38]/20 scale-105' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 z-10">
                <p className="text-white text-xs font-medium">{pattern.name}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Selected Pattern Info */}
      {selectedPatternId && (
        <div className={`mt-6 p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border border-gray-200 dark:border-gray-700`}>
          <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
            当前选择: {traditionalPatterns.find(p => p.id === selectedPatternId)?.name}
          </h4>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {traditionalPatterns.find(p => p.id === selectedPatternId)?.description}
          </p>
        </div>
      )}
    </div>
  );
}
