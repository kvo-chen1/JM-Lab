import React from 'react';
import { motion } from 'framer-motion';

export interface MerchandiseCategory {
  id: string;
  name: string;
  icon: string;
  items: string[];
}

export interface MerchandiseSelectorProps {
  categories: MerchandiseCategory[];
  selectedIds: string[];
  onSelect: (categoryId: string) => void;
  title?: string;
  maxSelection?: number;
}

export const MerchandiseSelector: React.FC<MerchandiseSelectorProps> = ({
  categories,
  selectedIds,
  onSelect,
  title = '选择周边类型',
  maxSelection = 3,
}) => {
  const handleToggle = (categoryId: string) => {
    if (selectedIds.includes(categoryId)) {
      // 如果已选中，允许取消选择
      onSelect(categoryId);
    } else {
      // 如果未选中，检查是否达到最大选择数
      if (selectedIds.length < maxSelection) {
        onSelect(categoryId);
      }
    }
  };

  const selectedCategories = categories.filter(c => selectedIds.includes(c.id));

  return (
    <div className="w-full">
      {title && (
        <div className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
          {selectedIds.length > 0 && (
            <span className="ml-2 text-xs text-gray-500">
              (已选 {selectedIds.length}/{maxSelection} 个)
            </span>
          )}
        </div>
      )}

      {/* 分类网格 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {categories.map((category) => {
          const isSelected = selectedIds.includes(category.id);
          
          return (
            <motion.button
              key={category.id}
              onClick={() => handleToggle(category.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-200
                flex flex-col items-center justify-center gap-2
                ${isSelected
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                }
              `}
              disabled={!isSelected && selectedIds.length >= maxSelection}
            >
              {/* Emoji 图标 */}
              <span className="text-4xl">{category.icon}</span>
              
              {/* 分类名称 */}
              <span className={`text-sm font-medium ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                {category.name}
              </span>
              
              {/* 选中指示器 */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
              
              {/* 达到最大选择数时的遮罩 */}
              {!isSelected && selectedIds.length >= maxSelection && (
                <div className="absolute inset-0 bg-gray-100/50 dark:bg-gray-900/50 rounded-xl" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* 已选产品展示 */}
      {selectedCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3"
        >
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            将为您设计以下周边产品：
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
              >
                <span className="text-sm">{category.icon}</span>
                <span className="text-xs text-gray-700 dark:text-gray-300">{category.name}</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {category.items.slice(0, 2).join('、')}
                  {category.items.length > 2 && '等'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MerchandiseSelector;
