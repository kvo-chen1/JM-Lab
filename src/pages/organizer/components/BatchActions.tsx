import { motion } from 'framer-motion';
import {
  CheckSquare,
  X,
  Send,
  Trash2,
} from 'lucide-react';

interface BatchActionsProps {
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onPublish: () => void;
  onCancel: () => void;
  isDark: boolean;
}

export function BatchActions({
  selectedCount,
  onSelectAll,
  onClearSelection,
  onPublish,
  onCancel,
  isDark,
}: BatchActionsProps) {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className={`fixed top-16 left-0 right-0 z-40 px-4 py-3 border-b ${
        isDark
          ? 'bg-gray-800/95 border-gray-700 backdrop-blur-sm'
          : 'bg-white/95 border-gray-200 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded bg-red-500 flex items-center justify-center text-white text-sm font-medium`}>
              {selectedCount}
            </div>
            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              已选择
            </span>
          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          <button
            onClick={onSelectAll}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>全选</span>
          </button>

          <button
            onClick={onClearSelection}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="w-4 h-4" />
            <span>清空</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onPublish}
            disabled={selectedCount === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCount === 0
                ? 'opacity-50 cursor-not-allowed'
                : ''
            } bg-emerald-500 hover:bg-emerald-600 text-white`}
          >
            <Send className="w-4 h-4" />
            <span>批量发布</span>
          </button>

          <button
            onClick={onCancel}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <X className="w-4 h-4" />
            <span>取消</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
