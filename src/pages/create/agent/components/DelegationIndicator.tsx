import React from 'react';
import { motion } from 'framer-motion';
import { useAgentStore } from '../hooks/useAgentStore';
import { DelegationTask, AGENT_CONFIG, AgentType } from '../types/agent';
import { ArrowRight, Clock, CheckCircle2, Loader2 } from 'lucide-react';

interface DelegationIndicatorProps {
  delegation: DelegationTask;
  showDetails?: boolean;
}

export default function DelegationIndicator({
  delegation,
  showDetails = true
}: DelegationIndicatorProps) {
  const { isDark } = useAgentStore();

  const fromConfig = AGENT_CONFIG[delegation.fromAgent as keyof typeof AGENT_CONFIG];
  const toConfig = AGENT_CONFIG[delegation.toAgent as keyof typeof AGENT_CONFIG];

  const getStatusIcon = () => {
    switch (delegation.status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'in_progress':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (delegation.status) {
      case 'pending':
        return '等待中';
      case 'in_progress':
        return '进行中';
      case 'completed':
        return '已完成';
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-xl p-4 mb-4 ${
        isDark
          ? 'bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-gray-700'
          : 'bg-gradient-to-r from-gray-50 to-white border border-gray-200'
      }`}
    >
      {/* 头部：Agent 切换 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* From Agent */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${fromConfig.color} flex items-center justify-center`}>
              <span className="text-sm text-white font-bold">{fromConfig.avatar}</span>
            </div>
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {fromConfig.name}
            </span>
          </div>

          {/* 箭头 */}
          <ArrowRight className="w-4 h-4 text-gray-400" />

          {/* To Agent */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${toConfig.color} flex items-center justify-center`}>
              <span className="text-sm text-white font-bold">{toConfig.avatar}</span>
            </div>
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {toConfig.name}
            </span>
          </div>
        </div>

        {/* 状态 */}
        <div className="flex items-center gap-1.5">
          {getStatusIcon()}
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* 详情 */}
      {showDetails && (
        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <p className="mb-1">
            <span className="font-medium">任务：</span>
            {delegation.taskDescription}
          </p>
          <p>
            <span className="font-medium">原因：</span>
            {delegation.context}
          </p>
        </div>
      )}

      {/* 进度条（进行中） */}
      {delegation.status === 'in_progress' && (
        <div className="mt-3">
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${
            isDark ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
              initial={{ width: '0%' }}
              animate={{ width: '60%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut'
              }}
            />
          </div>
        </div>
      )}

      {/* 时间戳 */}
      <div className={`mt-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        {new Date(delegation.createdAt).toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        })}
        {delegation.completedAt && (
          <span className="ml-2">
            - {new Date(delegation.completedAt).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// 委派历史列表组件
interface DelegationHistoryProps {
  delegations: DelegationTask[];
  maxItems?: number;
}

export function DelegationHistory({ delegations, maxItems = 5 }: DelegationHistoryProps) {
  const { isDark } = useAgentStore();

  if (delegations.length === 0) return null;

  const recentDelegations = delegations.slice(-maxItems).reverse();

  return (
    <div className={`rounded-xl p-4 ${
      isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'
    }`}>
      <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        任务委派记录
      </h4>
      <div className="space-y-2">
        {recentDelegations.map((delegation) => (
          <div
            key={delegation.id}
            className={`flex items-center gap-2 text-xs ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            <span className="font-medium">
              {AGENT_CONFIG[delegation.fromAgent as keyof typeof AGENT_CONFIG]?.name}
            </span>
            <ArrowRight className="w-3 h-3" />
            <span className="font-medium">
              {AGENT_CONFIG[delegation.toAgent as keyof typeof AGENT_CONFIG]?.name}
            </span>
            <span className="ml-auto">
              {delegation.status === 'completed' ? '✓' : delegation.status === 'in_progress' ? '⋯' : '○'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
