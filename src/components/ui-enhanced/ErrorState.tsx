import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/utils/designSystem';
import { EnhancedButton } from './EnhancedButton';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorState = ({
  error,
  onRetry,
  onDismiss,
  className,
}: ErrorStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5 }}
          className="flex-shrink-0"
        >
          <AlertCircle className="w-8 h-8 text-red-500" />
        </motion.div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            出错了
          </h3>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>

          <div className="flex gap-3">
            {onRetry && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRetry}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                重试
              </motion.button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-4 py-2 text-red-600 dark:text-red-300 hover:text-red-800 dark:hover:text-red-100 transition-colors"
              >
                关闭
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ErrorState;
