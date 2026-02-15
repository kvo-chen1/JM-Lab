import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Check, AlertCircle, Loader2 } from 'lucide-react';
import { SaveStatus } from '@/hooks/useDraftAutoSave';

interface AutoSaveStatusProps {
  status: SaveStatus;
  lastSavedAt: Date | null;
  className?: string;
}

/**
 * 自动保存状态显示组件
 * 
 * 显示当前草稿的保存状态：
 * - idle: 空闲状态，显示上次保存时间
 * - saving: 正在保存，显示加载动画
 * - saved: 保存成功，显示成功提示
 * - error: 保存失败，显示错误提示
 */
export function AutoSaveStatus({ status, lastSavedAt, className = '' }: AutoSaveStatusProps) {
  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // 小于 1 分钟
    if (diff < 60000) {
      return '刚刚';
    }
    // 小于 1 小时
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)} 分钟前`;
    }
    // 小于 24 小时
    if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)} 小时前`;
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
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <AnimatePresence mode="wait">
        {status === 'saving' && (
          <motion.div
            key="saving"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>保存中...</span>
          </motion.div>
        )}

        {status === 'saved' && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"
          >
            <Check className="w-4 h-4" />
            <span>已保存</span>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-1.5 text-red-600 dark:text-red-400"
          >
            <AlertCircle className="w-4 h-4" />
            <span>保存失败</span>
          </motion.div>
        )}

        {status === 'idle' && lastSavedAt && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400"
          >
            <Save className="w-4 h-4" />
            <span>上次保存: {formatTime(lastSavedAt)}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AutoSaveStatus;
