import React from 'react';
import { motion } from 'framer-motion';
import { useAgentStore } from '../hooks/useAgentStore';
import { DelegationTask, AGENT_CONFIG } from '../types/agent';
import { Users, ArrowRight, Sparkles } from 'lucide-react';

interface DelegationIndicatorProps {
  delegation: DelegationTask;
}

// Agent 头像组件 - 美化版本
function AgentAvatar({ role, size = 'sm' }: { role: string; size?: 'xs' | 'sm' | 'md' }) {
  const config = AGENT_CONFIG[role as keyof typeof AGENT_CONFIG];
  if (!config) return null;

  const sizeClasses = {
    xs: 'w-6 h-6 text-[11px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm'
  };

  const ringColors: Record<string, string> = {
    director: 'ring-amber-400/50 shadow-amber-400/20',
    designer: 'ring-cyan-400/50 shadow-cyan-400/20',
    illustrator: 'ring-pink-400/50 shadow-pink-400/20',
    copywriter: 'ring-emerald-400/50 shadow-emerald-400/20',
    animator: 'ring-violet-400/50 shadow-violet-400/20',
    researcher: 'ring-slate-400/50 shadow-slate-400/20'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br ${config.color} 
        flex items-center justify-center flex-shrink-0 
        ring-2 ring-offset-1 ring-offset-transparent ${ringColors[role] || 'ring-gray-400/30'}
        shadow-lg`}
    >
      <span className="text-white font-bold">{config.avatar}</span>
    </motion.div>
  );
}

// 美化版委派提示 - 卡片式设计
export default function DelegationIndicator({ delegation }: DelegationIndicatorProps) {
  const { isDark } = useAgentStore();

  const fromConfig = AGENT_CONFIG[delegation.fromAgent as keyof typeof AGENT_CONFIG];
  const toConfig = AGENT_CONFIG[delegation.toAgent as keyof typeof AGENT_CONFIG];

  if (!fromConfig || !toConfig) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`
        relative overflow-hidden rounded-2xl p-4 mb-4
        ${isDark 
          ? 'bg-gradient-to-r from-gray-800/80 via-gray-800/60 to-gray-800/80 border border-gray-700/50' 
          : 'bg-gradient-to-r from-amber-50/80 via-orange-50/60 to-amber-50/80 border border-amber-200/50'
        }
      `}
    >
      {/* 装饰背景 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-30 ${isDark ? 'bg-[#C02C38]/20' : 'bg-amber-400/20'}`} />
        <div className={`absolute -bottom-10 -left-10 w-24 h-24 rounded-full blur-2xl opacity-20 ${isDark ? 'bg-pink-500/20' : 'bg-orange-400/20'}`} />
      </div>

      {/* 顶部：Agent 邀请信息 */}
      <div className="relative flex items-center justify-center gap-3">
        {/* From Agent */}
        <motion.div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <AgentAvatar role={delegation.fromAgent} size="xs" />
          <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            @{fromConfig.name}
          </span>
        </motion.div>

        {/* 箭头动画 */}
        <motion.div
          animate={{ x: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className={isDark ? 'text-gray-500' : 'text-amber-400'}
        >
          <ArrowRight className="w-4 h-4" />
        </motion.div>

        {/* To Agent */}
        <motion.div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#C02C38]/10 to-[#E85D75]/10 border border-[#C02C38]/20 backdrop-blur-sm"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <AgentAvatar role={delegation.toAgent} size="xs" />
          <span className="text-sm font-medium bg-gradient-to-r from-[#C02C38] to-[#E85D75] bg-clip-text text-transparent">
            @{toConfig.name}
          </span>
        </motion.div>
      </div>

      {/* 中间：加入群聊提示 */}
      <motion.div 
        className="relative flex items-center justify-center gap-2 mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className={`h-px flex-1 ${isDark ? 'bg-gradient-to-r from-transparent via-gray-600 to-transparent' : 'bg-gradient-to-r from-transparent via-amber-300 to-transparent'}`} />
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700/80 text-gray-300' : 'bg-white/80 text-amber-600'}`}>
          <Users className="w-3 h-3" />
          <span>加入了群聊</span>
        </div>
        <div className={`h-px flex-1 ${isDark ? 'bg-gradient-to-r from-transparent via-gray-600 to-transparent' : 'bg-gradient-to-r from-transparent via-amber-300 to-transparent'}`} />
      </motion.div>

      {/* 底部：任务委派信息 */}
      {delegation.taskDescription && (
        <motion.div 
          className="relative mt-3 pt-3 border-t border-dashed border-gray-300/50 dark:border-gray-600/50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className={`flex items-center justify-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <Sparkles className="w-3.5 h-3.5 text-[#C02C38]" />
            <span>
              <span className="font-medium">{fromConfig.name}</span>
              <span className="mx-1">将任务委派给了</span>
              <span className="font-medium text-[#C02C38]">{toConfig.name}</span>
            </span>
          </div>
          {delegation.reasoning && (
            <p className={`mt-2 text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {delegation.reasoning}
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// 委派历史列表组件 - 美化版
interface DelegationHistoryProps {
  delegations: DelegationTask[];
  maxItems?: number;
}

export function DelegationHistory({ delegations, maxItems = 3 }: DelegationHistoryProps) {
  const { isDark } = useAgentStore();

  if (delegations.length === 0) return null;

  const recentDelegations = delegations.slice(-maxItems).reverse();

  return (
    <div className={`rounded-xl p-3 ${isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-amber-50/50 border border-amber-200/50'}`}>
      <div className={`flex items-center gap-2 mb-3 text-xs font-medium ${isDark ? 'text-gray-400' : 'text-amber-600'}`}>
        <Users className="w-3.5 h-3.5" />
        <span>委派记录</span>
      </div>
      <div className="space-y-2">
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
              className={`flex items-center gap-2 text-xs p-2 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-white/60'}`}
            >
              <AgentAvatar role={delegation.fromAgent} size="xs" />
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                {fromConfig.name}
              </span>
              <ArrowRight className={`w-3 h-3 ${isDark ? 'text-gray-500' : 'text-amber-400'}`} />
              <AgentAvatar role={delegation.toAgent} size="xs" />
              <span className="font-medium text-[#C02C38]">
                {toConfig.name}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
