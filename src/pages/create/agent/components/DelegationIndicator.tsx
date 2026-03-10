import React from 'react';
import { motion } from 'framer-motion';
import { useAgentStore } from '../hooks/useAgentStore';
import { DelegationTask, AGENT_CONFIG, AgentType } from '../types/agent';
import { ArrowRight, Clock, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

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

  const getStatusBadge = () => {
    switch (delegation.status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-[10px] text-amber-500">
            <Clock className="w-3 h-3" />等待中
          </span>
        );
      case 'in_progress':
        return (
          <span className="flex items-center gap-1 text-[10px] text-blue-500">
            <Loader2 className="w-3 h-3 animate-spin" />进行中
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-[10px] text-green-500">
            <CheckCircle2 className="w-3 h-3" />已完成
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-xl p-3 mb-3 ${
        isDark
          ? 'bg-gray-800/80 border border-gray-700/50'
          : 'bg-white/80 border border-gray-200/50'
      }`}
    >
      {/* 头部：智能委派 + 状态 */}
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
          isDark ? 'bg-[#C02C38]/10' : 'bg-[#C02C38]/5'
        }`}>
          <Sparkles className="w-3 h-3 text-[#C02C38]" />
          <span className="text-xs font-medium text-[#C02C38]">智能委派</span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Agent 切换 - 横向紧凑布局 */}
      <div className="flex items-center gap-2 mb-2">
        {/* From Agent */}
        <div className="flex items-center gap-2 flex-1">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${fromConfig.color} flex items-center justify-center`}>
            <span className="text-sm text-white font-bold">{fromConfig.avatar}</span>
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {fromConfig.name}
            </p>
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>原负责人</p>
          </div>
        </div>

        {/* 箭头 */}
        <ArrowRight className="w-4 h-4 text-[#C02C38] flex-shrink-0" />

        {/* To Agent */}
        <div className="flex items-center gap-2 flex-1">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${toConfig.color} flex items-center justify-center ring-2 ${
            isDark ? 'ring-[#C02C38]/30' : 'ring-[#C02C38]/20'
          }`}>
            <span className="text-sm text-white font-bold">{toConfig.avatar}</span>
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {toConfig.name}
            </p>
            <p className="text-[10px] text-[#C02C38]">新负责人</p>
          </div>
        </div>
      </div>

      {/* 任务描述 - 单行省略 */}
      {showDetails && (
        <p className={`text-xs line-clamp-2 mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {delegation.taskDescription}
        </p>
      )}

      {/* 进度条（进行中） */}
      {delegation.status === 'in_progress' && (
        <div className="mt-2">
          <div className={`w-full h-1 rounded-full overflow-hidden ${
            isDark ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <motion.div
              className="h-full bg-gradient-to-r from-[#C02C38] to-[#E85D75]"
              initial={{ width: '0%' }}
              animate={{ width: '60%' }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
            />
          </div>
        </div>
      )}

      {/* 时间戳 */}
      <div className={`mt-2 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        {new Date(delegation.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
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
    <div className={`rounded-xl p-3 ${
      isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-gray-50/80 border border-gray-200/50'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-3 h-3 text-[#C02C38]" />
        <h4 className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          委派记录
        </h4>
        <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${
          isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
        }`}>
          {delegations.length}
        </span>
      </div>

      <div className="space-y-2">
        {recentDelegations.map((delegation) => (
          <div
            key={delegation.id}
            className={`flex items-center gap-2 p-2 rounded-lg ${
              isDark ? 'bg-gray-800/50' : 'bg-white/50'
            }`}
          >
            {/* From Agent */}
            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${
              AGENT_CONFIG[delegation.fromAgent as keyof typeof AGENT_CONFIG]?.color
            } flex items-center justify-center flex-shrink-0`}>
              <span className="text-[10px] text-white font-bold">
                {AGENT_CONFIG[delegation.fromAgent as keyof typeof AGENT_CONFIG]?.avatar}
              </span>
            </div>

            <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />

            {/* To Agent */}
            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${
              AGENT_CONFIG[delegation.toAgent as keyof typeof AGENT_CONFIG]?.color
            } flex items-center justify-center flex-shrink-0`}>
              <span className="text-[10px] text-white font-bold">
                {AGENT_CONFIG[delegation.toAgent as keyof typeof AGENT_CONFIG]?.avatar}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {AGENT_CONFIG[delegation.fromAgent as keyof typeof AGENT_CONFIG]?.name}
                <span className="mx-1 text-gray-400">→</span>
                {AGENT_CONFIG[delegation.toAgent as keyof typeof AGENT_CONFIG]?.name}
              </p>
            </div>

            {/* Status */}
            <div className="flex-shrink-0">
              {delegation.status === 'completed' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              ) : delegation.status === 'in_progress' ? (
                <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-amber-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
