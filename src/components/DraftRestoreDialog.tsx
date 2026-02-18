import React from 'react';
import { motion } from 'framer-motion';
import { Clock, RotateCcw, X, FileText } from 'lucide-react';

interface DraftRestoreDialogProps {
  isOpen: boolean;
  savedAt: Date | null;
  onRestore: () => void;
  onDiscard: () => void;
}

/**
 * 草稿恢复对话框
 * 
 * 当检测到本地有保存的草稿时显示，让用户选择恢复或丢弃
 */
export function DraftRestoreDialog({
  isOpen,
  savedAt,
  onRestore,
  onDiscard,
}: DraftRestoreDialogProps) {
  if (!isOpen) return null;

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // 小于 1 小时
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} 分钟前`;
    }
    // 小于 24 小时
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} 小时前`;
    }
    // 显示具体日期时间
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* 头部 */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                恢复草稿
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                检测到您有未完成的草稿，是否继续编辑？
              </p>
              {savedAt && (
                <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <Clock className="w-4 h-4" />
                  <span>上次编辑: {formatTime(savedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 按钮区域 */}
        <div className="p-6 pt-4 flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDiscard}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            丢弃草稿
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRestore}
            className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            恢复草稿
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

export default DraftRestoreDialog;
