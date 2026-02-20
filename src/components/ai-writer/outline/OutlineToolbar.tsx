import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Plus, ChevronDown, ChevronUp, LayoutList } from 'lucide-react';

interface OutlineToolbarProps {
  onAddSection: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  sectionCount: number;
}

export const OutlineToolbar: React.FC<OutlineToolbarProps> = ({
  onAddSection,
  onExpandAll,
  onCollapseAll,
  sectionCount,
}) => {
  const { isDark } = useTheme();

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border ${
        isDark
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isDark ? 'bg-blue-500/20' : 'bg-blue-100'
          }`}
        >
          <LayoutList className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3
            className={`font-semibold text-sm ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            章节结构
          </h3>
          <p
            className={`text-xs ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            共 {sectionCount} 个章节
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onExpandAll}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
            isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <ChevronDown className="w-4 h-4" />
          全部展开
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCollapseAll}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
            isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <ChevronUp className="w-4 h-4" />
          全部折叠
        </motion.button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAddSection}
          className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-lg shadow-blue-500/25"
        >
          <Plus className="w-4 h-4" />
          添加章节
        </motion.button>
      </div>
    </div>
  );
};

export default OutlineToolbar;
