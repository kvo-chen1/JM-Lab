import React, { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../../hooks/useCreateStore';
import { traditionalPatterns } from '../../data';
import { motion } from 'framer-motion';

export default function PatternPanel() {
  const { isDark } = useTheme();
  const { selectedPatternId, updateState, selectedResult } = useCreateStore();
  const [isApplying, setIsApplying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const selectedPattern = traditionalPatterns.find(p => p.id === selectedPatternId);

  // 处理纹样选择和预览
  const handlePatternSelect = (patternId: number) => {
    updateState({ selectedPatternId: patternId });
    
    // 生成预览效果（模拟）
    if (selectedResult) {
      const pattern = traditionalPatterns.find(p => p.id === patternId);
      if (pattern) {
        // 实际项目中应该调用API来生成预览图
        setPreviewUrl(pattern.thumbnail);
      }
    }
  };

  // 应用纹样到作品
  const handleApplyPattern = async () => {
    if (!selectedPattern || !selectedResult) return;
    
    setIsApplying(true);
    
    try {
      // 模拟API调用，生成嵌入纹样的图片
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 实际项目中应该调用真实API获取生成结果
      updateState({
        aiExplanation: `已成功将「${selectedPattern.name}」纹样嵌入到您的作品中`,
        showAIReview: true
      });
    } catch (error) {
      console.error('应用纹样失败:', error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="p-4 h-full overflow-y-auto">
      {/* Panel Header */}
      <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-800">
        <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>纹样库</h3>
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>选择传统纹样添加到您的作品中</p>
      </div>

      {/* 纹样预览区域 */}
      {selectedPattern && (
        <div className={`mb-6 rounded-lg overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'} bg-gradient-to-br ${isDark ? 'from-gray-800 to-gray-900' : 'from-gray-50 to-gray-100'} p-3`}>
          <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>纹样预览</h4>
          <div className="relative aspect-video rounded-lg overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'} bg-gray-800 dark:bg-gray-900">
            {selectedResult ? (
              <div className="relative w-full h-full">
                {/* 基础图片 */}
                <img
                  src={`https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&h=400&fit=crop`}
                  alt="基础图片"
                  className="w-full h-full object-cover opacity-80"
                />
                {/* 纹样叠加 */}
                <div className="absolute inset-0 mix-blend-overlay opacity-70">
                  <img
                    src={previewUrl || selectedPattern.thumbnail}
                    alt={selectedPattern.name}
                    className="w-full h-full object-cover"
                    style={{ backgroundBlendMode: 'multiply' }}
                  />
                </div>
                {/* 纹样名称标签 */}
                <div className="absolute bottom-2 left-2 bg-[#C02C38] text-white text-xs px-2 py-1 rounded">
                  {selectedPattern.name}
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

      {/* 应用按钮 */}
      {selectedPattern && selectedResult && (
        <motion.button
          onClick={handleApplyPattern}
          disabled={isApplying}
          className={`w-full py-3 rounded-lg font-medium transition-all duration-300 mb-6 ${isDark 
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
              <span>应用纹样到作品</span>
            </div>
          )}
        </motion.button>
      )}

      {/* Pattern Grid */}
      <div>
        <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>纹样选择</h4>
        <div className="grid grid-cols-2 gap-3">
          {traditionalPatterns.map((pattern) => (
            <motion.button
              key={pattern.id}
              onClick={() => handlePatternSelect(pattern.id)}
              className={`group rounded-lg overflow-hidden border-2 transition-all duration-300 hover:shadow-md ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} ${selectedPatternId === pattern.id ? 'border-[#C02C38] ring-2 ring-[#C02C38]/20 scale-105 z-10' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
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
                {selectedPatternId === pattern.id && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#C02C38] flex items-center justify-center z-20">
                    <i className="fas fa-check text-white text-[10px]"></i>
                  </div>
                )}
              </div>
              <div className="p-2 bg-gray-100 dark:bg-gray-900">
                <p className="text-xs font-medium truncate">{pattern.name}</p>
                <p className="text-[9px] opacity-70 truncate">{pattern.description}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
