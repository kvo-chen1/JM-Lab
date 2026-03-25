/**
 * Agent 选择器组件
 * 允许用户手动切换当前 Agent
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentStore } from '../hooks/useAgentStore';
import { AgentType, AGENT_CONFIG } from '../types/agent';
import { 
  Sparkles, 
  Palette, 
  PenTool, 
  Type, 
  Video, 
  Search,
  ChevronDown,
  User,
  Lock,
  Unlock
} from 'lucide-react';

interface AgentSelectorProps {
  currentAgent: AgentType;
  onAgentChange: (agent: AgentType) => void;
  isLocked?: boolean;
  onToggleLock?: () => void;
  className?: string;
}

// Agent 图标映射
const agentIconMap: Record<Exclude<AgentType, 'system' | 'user'>, React.ReactNode> = {
  director: <Sparkles className="w-4 h-4" />,
  designer: <Palette className="w-4 h-4" />,
  illustrator: <PenTool className="w-4 h-4" />,
  copywriter: <Type className="w-4 h-4" />,
  animator: <Video className="w-4 h-4" />,
  researcher: <Search className="w-4 h-4" />
};

// Agent 颜色映射
const agentColorMap: Record<Exclude<AgentType, 'system' | 'user'>, string> = {
  director: 'from-amber-500 to-orange-600',
  designer: 'from-cyan-500 to-blue-600',
  illustrator: 'from-pink-500 to-rose-600',
  copywriter: 'from-emerald-500 to-teal-600',
  animator: 'from-violet-500 to-purple-600',
  researcher: 'from-slate-500 to-gray-600'
};

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  currentAgent,
  onAgentChange,
  isLocked = false,
  onToggleLock,
  className = ''
}) => {
  const { isDark } = useAgentStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentConfig = AGENT_CONFIG[currentAgent as keyof typeof AGENT_CONFIG];

  // 可选择的 Agent 列表（排除 system 和 user）
  const selectableAgents: Exclude<AgentType, 'system' | 'user'>[] = [
    'director',
    'designer',
    'illustrator',
    'copywriter',
    'animator',
    'researcher'
  ];

  return (
    <div className={`relative ${className}`}>
      {/* 当前 Agent 显示按钮 + 锁定按钮 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
            isDark 
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700' 
              : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 shadow-sm'
          }`}
        >
          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${agentColorMap[currentAgent as Exclude<AgentType, 'system' | 'user'>]} flex items-center justify-center`}>
            <span className="text-white text-xs">
              {agentIconMap[currentAgent as Exclude<AgentType, 'system' | 'user'>]}
            </span>
          </div>
          <span className="font-medium">{currentConfig?.name || currentAgent}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* 锁定按钮 */}
        {onToggleLock && (
          <button
            onClick={onToggleLock}
            title={isLocked ? '已锁定当前 Agent，不会自动切换' : '点击锁定当前 Agent'}
            className={`p-2 rounded-lg transition-all ${
              isLocked
                ? isDark
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                  : 'bg-amber-100 text-amber-600 border border-amber-200'
                : isDark
                  ? 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                  : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* 下拉菜单 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 遮罩层 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* 菜单 */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`absolute top-full left-0 mt-2 w-72 rounded-xl shadow-2xl z-50 overflow-hidden ${
                isDark 
                  ? 'bg-gray-800 border border-gray-700' 
                  : 'bg-white border border-gray-200'
              }`}
            >
              {/* 标题 */}
              <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  选择团队成员
                </p>
              </div>

              {/* Agent 列表 */}
              <div className="py-2">
                {selectableAgents.map((agent) => {
                  const config = AGENT_CONFIG[agent as keyof typeof AGENT_CONFIG];
                  const isSelected = agent === currentAgent;
                  
                  return (
                    <button
                      key={agent}
                      onClick={() => {
                        onAgentChange(agent);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        isSelected 
                          ? isDark 
                            ? 'bg-blue-900/30 border-l-2 border-blue-500' 
                            : 'bg-blue-50 border-l-2 border-blue-500'
                          : isDark 
                            ? 'hover:bg-gray-700' 
                            : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agentColorMap[agent]} flex items-center justify-center shadow-lg`}>
                        <span className="text-white">
                          {agentIconMap[agent]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          isSelected 
                            ? isDark ? 'text-blue-400' : 'text-blue-600'
                            : isDark ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          {config?.name || agent}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} line-clamp-1`}>
                          {config?.description?.slice(0, 30)}...
                        </p>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`w-2 h-2 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 底部提示 */}
              <div className={`px-4 py-2 border-t ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  选择不同的团队成员将获得不同的专业能力
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentSelector;
