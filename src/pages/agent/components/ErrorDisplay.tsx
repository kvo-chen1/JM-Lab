import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AgentError, AgentErrorType, ERROR_MESSAGES } from '../types/errors';
import { AlertCircle, WifiOff, Clock, RefreshCw, HelpCircle, X } from 'lucide-react';

interface ErrorDisplayProps {
  error: AgentError;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
}

export default function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  showDetails = false
}: ErrorDisplayProps) {
  const { isDark } = useTheme();
  const errorConfig = ERROR_MESSAGES[error.type];

  const getErrorIcon = () => {
    switch (error.type) {
      case AgentErrorType.NETWORK_ERROR:
        return <WifiOff className="w-6 h-6 text-red-500" />;
      case AgentErrorType.TIMEOUT_ERROR:
        return <Clock className="w-6 h-6 text-orange-500" />;
      case AgentErrorType.VALIDATION_ERROR:
        return <HelpCircle className="w-6 h-6 text-yellow-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-red-500" />;
    }
  };

  const getErrorColor = () => {
    switch (error.type) {
      case AgentErrorType.NETWORK_ERROR:
        return 'border-red-500/20 bg-red-500/10';
      case AgentErrorType.TIMEOUT_ERROR:
        return 'border-orange-500/20 bg-orange-500/10';
      case AgentErrorType.VALIDATION_ERROR:
        return 'border-yellow-500/20 bg-yellow-500/10';
      default:
        return 'border-red-500/20 bg-red-500/10';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={`rounded-xl border p-4 ${getErrorColor()} ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}
    >
      {/* 头部 */}
      <div className="flex items-start gap-3">
        {/* 错误图标 */}
        <div className="flex-shrink-0 mt-0.5">
          {getErrorIcon()}
        </div>

        {/* 错误信息 */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {errorConfig.title}
          </h3>
          
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {error.message}
          </p>

          {/* 建议的解决方案 */}
          {error.suggestedAction && (
            <div className={`mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              💡 {error.suggestedAction}
            </div>
          )}

          {/* 详细信息 */}
          {showDetails && error.details && (
            <details className="mt-2">
              <summary className={`text-xs cursor-pointer ${isDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-500 hover:text-gray-600'}`}>
                查看详情
              </summary>
              <pre className={`mt-1 text-xs p-2 rounded ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'} overflow-auto`}>
                {error.details}
              </pre>
            </details>
          )}
        </div>

        {/* 关闭按钮 */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 p-1 rounded transition-colors ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2 mt-4">
        {onRetry && error.retryable && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            重试
          </button>
        )}

        {!onRetry && (
          <button
            onClick={onDismiss}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            关闭
          </button>
        )}
      </div>

      {/* 错误级别标识 */}
      {error.level && (
        <div className="mt-3 flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            error.level === 'critical'
              ? 'bg-red-500/20 text-red-500'
              : error.level === 'error'
              ? 'bg-orange-500/20 text-orange-500'
              : error.level === 'warning'
              ? 'bg-yellow-500/20 text-yellow-500'
              : 'bg-blue-500/20 text-blue-500'
          }`}>
            {error.level.toUpperCase()}
          </span>
          {error.agentType && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
            }`}>
              {error.agentType}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

/**
 * 错误提示 Toast 组件
 */
export function ErrorToast({ error, onClose }: { error: AgentError; onClose: () => void }) {
  const errorConfig = ERROR_MESSAGES[error.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      className="fixed top-4 right-4 z-50 max-w-sm"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-red-200 dark:border-red-800 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {errorConfig.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              {error.message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
