import React from 'react';
import { motion } from 'framer-motion';
import { useAgentStore } from '../hooks/useAgentStore';
import { DelegationTask, AGENT_CONFIG } from '../types/agent';

interface DelegationIndicatorProps {
  delegation: DelegationTask;
}

// Agent 头像组件
function AgentAvatar({ role, size = 'sm' }: { role: string; size?: 'xs' | 'sm' | 'md' }) {
  const config = AGENT_CONFIG[role as keyof typeof AGENT_CONFIG];
  if (!config) return null;

  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold">{config.avatar}</span>
    </div>
  );
}

// 简化的委派提示 - 参考 oii 风格
export default function DelegationIndicator({ delegation }: DelegationIndicatorProps) {
  const { isDark } = useAgentStore();

  const fromConfig = AGENT_CONFIG[delegation.fromAgent as keyof typeof AGENT_CONFIG];
  const toConfig = AGENT_CONFIG[delegation.toAgent as keyof typeof AGENT_CONFIG];

  if (!fromConfig || !toConfig) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center justify-center gap-2 py-3 text-sm"
    >
      {/* From Agent */}
      <AgentAvatar role={delegation.fromAgent} size="xs" />
      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
        @{fromConfig.name}
      </span>

      {/* 邀请文字 */}
      <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>邀请</span>

      {/* To Agent */}
      <AgentAvatar role={delegation.toAgent} size="xs" />
      <span className="text-[#E85D75] font-medium">
        @{toConfig.name}
      </span>

      {/* 加入群聊 */}
      <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>加入了群聊</span>
    </motion.div>
  );
}

// 委派历史列表组件 - 简化版
interface DelegationHistoryProps {
  delegations: DelegationTask[];
  maxItems?: number;
}

export function DelegationHistory({ delegations, maxItems = 3 }: DelegationHistoryProps) {
  const { isDark } = useAgentStore();

  if (delegations.length === 0) return null;

  const recentDelegations = delegations.slice(-maxItems).reverse();

  return (
    <div className="space-y-2 py-2">
      {recentDelegations.map((delegation, index) => {
        const fromConfig = AGENT_CONFIG[delegation.fromAgent as keyof typeof AGENT_CONFIG];
        const toConfig = AGENT_CONFIG[delegation.toAgent as keyof typeof AGENT_CONFIG];

        if (!fromConfig || !toConfig) return null;

        return (
          <motion.div
            key={delegation.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-center gap-2 text-xs"
          >
            <AgentAvatar role={delegation.fromAgent} size="xs" />
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
              @{fromConfig.name}
            </span>
            <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>→</span>
            <AgentAvatar role={delegation.toAgent} size="xs" />
            <span className="text-[#E85D75]">
              @{toConfig.name}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
