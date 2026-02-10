import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { ViewToggleProps, ViewMode } from '../types/collection';
import { LayoutGrid, List } from 'lucide-react';

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  const { isDark } = useTheme();

  return (
    <div
      className={`flex items-center p-1 rounded-lg ${
        isDark ? 'bg-gray-700' : 'bg-gray-100'
      }`}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onViewModeChange(ViewMode.GRID)}
        className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
          viewMode === ViewMode.GRID
            ? isDark
              ? 'bg-gray-600 text-white'
              : 'bg-white text-gray-900 shadow-sm'
            : isDark
              ? 'text-gray-400 hover:text-gray-200'
              : 'text-gray-500 hover:text-gray-700'
        }`}
        title="网格视图"
      >
        <LayoutGrid className="w-4 h-4" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onViewModeChange(ViewMode.LIST)}
        className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
          viewMode === ViewMode.LIST
            ? isDark
              ? 'bg-gray-600 text-white'
              : 'bg-white text-gray-900 shadow-sm'
            : isDark
              ? 'text-gray-400 hover:text-gray-200'
              : 'text-gray-500 hover:text-gray-700'
        }`}
        title="列表视图"
      >
        <List className="w-4 h-4" />
      </motion.button>
    </div>
  );
}
