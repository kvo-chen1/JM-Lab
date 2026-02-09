import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { CheckCircle, AlertCircle, Key, Activity } from 'lucide-react';

interface ModelStatus {
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  latency?: number;
  lastUsed?: string;
}

interface ModelStatusCardProps {
  models: ModelStatus[];
  onConfigure: () => void;
}

export function ModelStatusCard({ models, onConfigure }: ModelStatusCardProps) {
  const connectedCount = models.filter(m => m.status === 'connected').length;
  const totalCount = models.length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          API 状态
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {connectedCount}/{totalCount} 个服务已连接
        </p>
      </div>

      {/* 状态概览 */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <motion.circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${(connectedCount / totalCount) * 175.93} 175.93`}
              className="text-blue-500"
              initial={{ strokeDashoffset: 175.93 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {Math.round((connectedCount / totalCount) * 100)}%
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {connectedCount} 个已连接
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {totalCount - connectedCount} 个未配置
            </span>
          </div>
        </div>
      </div>

      {/* 模型列表 */}
      <div className="space-y-2">
        {models.map((model, index) => (
          <motion.div
            key={model.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={clsx(
              'flex items-center gap-3 p-3 rounded-xl',
              'bg-gray-50 dark:bg-gray-800/50',
              'border border-gray-100 dark:border-gray-700/50'
            )}
          >
            <div className={clsx(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              model.status === 'connected'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
            )}>
              {model.status === 'connected' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {model.name}
              </div>
              {model.latency && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  延迟: {model.latency}ms
                </div>
              )}
            </div>
            <div className={clsx(
              'text-xs font-medium px-2 py-1 rounded-full',
              model.status === 'connected'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            )}>
              {model.status === 'connected' ? '已连接' : '未配置'}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 快捷操作 */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onConfigure}
            className={clsx(
              'flex items-center justify-center gap-2',
              'px-4 py-2.5 rounded-xl',
              'bg-blue-600 hover:bg-blue-700',
              'text-white text-sm font-medium',
              'transition-colors'
            )}
          >
            <Key className="w-4 h-4" />
            配置密钥
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={clsx(
              'flex items-center justify-center gap-2',
              'px-4 py-2.5 rounded-xl',
              'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
              'text-gray-700 dark:text-gray-300 text-sm font-medium',
              'transition-colors'
            )}
          >
            <Activity className="w-4 h-4" />
            测试连接
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default ModelStatusCard;
