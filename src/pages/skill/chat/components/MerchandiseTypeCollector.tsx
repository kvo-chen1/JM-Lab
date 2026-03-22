import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { MerchandiseCategory } from '../services/requirementService';

export interface MerchandiseTypeCollectorProps {
  categories: MerchandiseCategory[];
  selectedIds: string[];
  onSelect: (categoryIds: string[]) => void;
  message?: string;
}

const CATEGORY_TO_NAME: Record<string, string> = {
  'stationery': '商务文具',
  'apparel': '服饰周边',
  'packaging': '包装产品',
  'lifestyle': '生活用品',
  'environment': '环境应用',
};

export const MerchandiseTypeCollector: React.FC<MerchandiseTypeCollectorProps> = ({
  categories,
  selectedIds,
  onSelect,
  message,
}) => {
  const { isDark } = useTheme();

  const handleToggle = (categoryId: string) => {
    if (selectedIds.includes(categoryId)) {
      // 取消选择
      onSelect(selectedIds.filter(id => id !== categoryId));
    } else {
      // 添加选择（最多 3 个）
      if (selectedIds.length < 3) {
        onSelect([...selectedIds, categoryId]);
      }
    }
  };

  // 处理用户输入解析
  React.useEffect(() => {
    if (!message) return;

    const lowerMessage = message.toLowerCase();
    const newSelections: string[] = [...selectedIds];

    categories.forEach(category => {
      const shouldSelect = lowerMessage.includes(category.name.toLowerCase())
        || category.items.some(item =>
          lowerMessage.includes(item.toLowerCase())
        );

      if (shouldSelect && !newSelections.includes(category.id)) {
        if (newSelections.length < 3) {
          newSelections.push(category.id);
        }
      }
    });

    if (newSelections.length !== selectedIds.length) {
      onSelect(newSelections);
    }
  }, [message, categories, selectedIds, onSelect]);

  const selectedCategories = categories.filter(c => selectedIds.includes(c.id));

  return (
    <div className={`mt-3 rounded-xl border overflow-hidden ${
      isDark 
        ? 'bg-gray-800/50 border-gray-700' 
        : 'bg-white/50 border-gray-200'
    }`}>
      <div className="p-4">
        {/* 标题 */}
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
          <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            选择周边类型
            {selectedIds.length > 0 && (
              <span className="ml-2 text-xs text-gray-500">
                (已选 {selectedIds.length}/3 个)
              </span>
            )}
          </span>
        </div>

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
                disabled={!isSelected && selectedIds.length >= 3}
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
                {!isSelected && selectedIds.length >= 3 && (
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
            className={`rounded-lg p-3 ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}
          >
            <div className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              将为您设计以下周边产品：
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((category) => (
                <div
                  key={category.id}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md border text-xs ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-gray-300' 
                      : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  <span>{category.icon}</span>
                  <span className="font-medium">{category.name}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {category.items.slice(0, 2).join('、')}
                    {category.items.length > 2 && '等'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MerchandiseTypeCollector;
