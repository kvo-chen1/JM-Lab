import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { TaskQueue, TaskStatus } from '../services/taskQueueManager';
import { CheckCircle, Circle, Loader, Clock } from 'lucide-react';

interface ChainTaskProgressProps {
  queue: TaskQueue;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
}

export default function ChainTaskProgress({ queue, progress }: ChainTaskProgressProps) {
  const { isDark } = useTheme();

  const getTaskStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case TaskStatus.RUNNING:
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case TaskStatus.PENDING:
        return <Circle className="w-4 h-4 text-gray-400" />;
      case TaskStatus.FAILED:
        return <Clock className="w-4 h-4 text-red-500" />;
      case TaskStatus.SKIPPED:
        return <Circle className="w-4 h-4 text-gray-300" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTaskStatusText = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return '已完成';
      case TaskStatus.RUNNING:
        return '进行中';
      case TaskStatus.PENDING:
        return '待处理';
      case TaskStatus.FAILED:
        return '失败';
      case TaskStatus.SKIPPED:
        return '已跳过';
      default:
        return '未知';
    }
  };

  const getTaskStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'text-green-500';
      case TaskStatus.RUNNING:
        return 'text-blue-500';
      case TaskStatus.PENDING:
        return 'text-gray-400';
      case TaskStatus.FAILED:
        return 'text-red-500';
      case TaskStatus.SKIPPED:
        return 'text-gray-300';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-800/50' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* 进度条头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            链式任务进度
          </span>
        </div>
        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {progress.current}/{progress.total} ({progress.percentage}%)
        </span>
      </div>

      {/* 进度条 */}
      <div className={`w-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden mb-4`}>
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress.percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* 任务列表 */}
      <div className="space-y-2">
        {queue.tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center gap-3 p-3 rounded-lg ${
              isDark ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}
          >
            {/* 状态图标 */}
            <div className="flex-shrink-0">
              {getTaskStatusIcon(task.status)}
            </div>

            {/* 任务信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {task.name}
                </span>
                <span className={`text-xs ${getTaskStatusColor(task.status)}`}>
                  {getTaskStatusText(task.status)}
                </span>
              </div>
              <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {task.description}
              </p>
            </div>

            {/* Agent 标识 */}
            <div className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
              {task.agent}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 队列状态 */}
      {queue.status === 'running' && (
        <div className={`mt-4 flex items-center gap-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <Loader className="w-3 h-3 animate-spin" />
          <span>任务正在执行中...</span>
        </div>
      )}

      {queue.status === 'completed' && (
        <div className="mt-4 flex items-center gap-2 text-xs text-green-500">
          <CheckCircle className="w-3 h-3" />
          <span>所有任务已完成！</span>
        </div>
      )}

      {queue.status === 'failed' && (
        <div className="mt-4 flex items-center gap-2 text-xs text-red-500">
          <Clock className="w-3 h-3" />
          <span>任务执行失败</span>
        </div>
      )}
    </div>
  );
}
