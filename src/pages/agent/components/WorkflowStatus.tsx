import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore } from '../hooks/useAgentStore';
import { getWorkflowEngine, WorkflowInstance } from '../services/workflowEngine';
import { GitBranch, CheckCircle2, Circle, Loader2, AlertCircle, Clock, ArrowRight } from 'lucide-react';

export default function WorkflowStatus() {
  const { isDark } = useTheme();
  const { currentTask } = useAgentStore();
  const [workflowInstance, setWorkflowInstance] = useState<WorkflowInstance | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const workflowEngine = getWorkflowEngine();

  // 监听工作流状态
  useEffect(() => {
    if (!currentTask?.id) {
      setWorkflowInstance(null);
      return;
    }

    // 获取工作流实例
    const instance = workflowEngine.getWorkflowInstance(currentTask.id);
    if (instance) {
      setWorkflowInstance(instance);
    }

    // 监听工作流事件
    const handleWorkflowUpdate = (event: any) => {
      if (event.detail?.workflowId === currentTask.id) {
        const updated = workflowEngine.getWorkflowInstance(currentTask.id);
        setWorkflowInstance(updated || null);
      }
    };

    window.addEventListener('workflow-update', handleWorkflowUpdate);
    return () => window.removeEventListener('workflow-update', handleWorkflowUpdate);
  }, [currentTask?.id, workflowEngine]);

  // 如果没有工作流状态，不显示
  if (!workflowInstance) {
    return null;
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Circle className="w-4 h-4 text-gray-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return isDark ? 'text-green-400' : 'text-green-600';
      case 'running':
        return isDark ? 'text-blue-400' : 'text-blue-600';
      case 'pending':
        return isDark ? 'text-gray-400' : 'text-gray-500';
      case 'failed':
        return isDark ? 'text-red-400' : 'text-red-600';
      default:
        return isDark ? 'text-gray-400' : 'text-gray-500';
    }
  };

  // 计算进度
  const progress = workflowInstance.progress || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border overflow-hidden ${
        isDark 
          ? 'bg-gray-800/50 border-gray-700/50' 
          : 'bg-white/50 border-gray-200/50'
      }`}
    >
      {/* 头部 */}
      <div 
        className={`flex items-center justify-between p-3 cursor-pointer ${
          isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-purple-500" />
          <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            工作流进度
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            workflowInstance.status === 'running'
              ? 'bg-blue-500/20 text-blue-400'
              : workflowInstance.status === 'completed'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gray-500/20 text-gray-400'
          }`}>
            {workflowInstance.status === 'running' ? '进行中' : 
             workflowInstance.status === 'completed' ? '已完成' : '等待中'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {progress}%
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowRight className="w-4 h-4 text-gray-400 rotate-90" />
          </motion.div>
        </div>
      </div>

      {/* 进度条 */}
      <div className={`h-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* 步骤列表 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-3 space-y-2"
          >
            {/* 当前节点 */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-3 p-2 rounded-lg ${
                workflowInstance.status === 'running'
                  ? isDark ? 'bg-blue-500/10' : 'bg-blue-50'
                  : ''
              }`}
            >
              {/* 状态图标 */}
              <div className="flex-shrink-0">
                {getStatusIcon(workflowInstance.status)}
              </div>

              {/* 节点信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium truncate ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    当前节点: {workflowInstance.currentNodeId}
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  已完成节点: {workflowInstance.completedNodes.length}
                </p>
              </div>
            </motion.div>

            {/* 总耗时 */}
            {workflowInstance.endTime && workflowInstance.startTime && (
              <div className={`pt-2 mt-2 border-t text-xs text-right ${
                isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'
              }`}>
                总耗时: {Math.round((workflowInstance.endTime - workflowInstance.startTime) / 1000)}s
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
