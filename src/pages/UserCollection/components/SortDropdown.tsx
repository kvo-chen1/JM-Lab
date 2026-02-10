import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { SortDropdownProps } from '../types/collection';
import { SortOption } from '@/services/collectionService';
import { ChevronDown, Clock, TrendingUp, Eye, Calendar } from 'lucide-react';

const sortOptions = [
  { value: SortOption.NEWEST, label: '最新收藏', icon: Clock },
  { value: SortOption.OLDEST, label: '最早收藏', icon: Calendar },
  { value: SortOption.MOST_LIKED, label: '最多点赞', icon: TrendingUp },
  { value: SortOption.MOST_VIEWED, label: '最多浏览', icon: Eye },
];

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = sortOptions.find((opt) => opt.value === value);
  const SelectedIcon = selectedOption?.icon || Clock;

  const handleSelect = (optionValue: SortOption) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isDark
            ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <SelectedIcon className="w-4 h-4" />
        <span>{selectedOption?.label}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* 下拉菜单 */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`absolute right-0 top-full mt-2 w-40 rounded-xl shadow-lg z-50 overflow-hidden ${
                isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}
            >
              {sortOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = value === option.value;

                return (
                  <motion.button
                    key={option.value}
                    whileHover={{ x: 4 }}
                    onClick={() => handleSelect(option.value)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      isSelected
                        ? isDark
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-blue-50 text-blue-700'
                        : isDark
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{option.label}</span>
                    {isSelected && (
                      <motion.div
                        layoutId="selectedIndicator"
                        className={`ml-auto w-1.5 h-1.5 rounded-full ${
                          isDark ? 'bg-blue-400' : 'bg-blue-600'
                        }`}
                      />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
