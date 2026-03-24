/**
 * Skill 调试工具 - 简化版
 * 用于开发和调试 Skill 架构
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AgentType } from '../types/agent';
import { AGENT_CAPABILITY_DESCRIPTIONS } from '../config/agentSkillConfig';
import { 
  Bug, 
  X, 
  Terminal,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface SkillDebuggerProps {
  className?: string;
}

// Agent 图标映射
const agentIconMap: Record<Exclude<AgentType, 'system' | 'user'>, React.ReactNode> = {
  director: <span>✨</span>,
  designer: <span>🎨</span>,
  illustrator: <span>✏️</span>,
  copywriter: <span>📝</span>,
  animator: <span>🎬</span>,
  researcher: <span>🔍</span>
};

export const SkillDebugger: React.FC<SkillDebuggerProps> = ({ className = '' }) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Exclude<AgentType, 'system' | 'user'>>('designer');

  // 可选择的 Agent 列表
  const selectableAgents: Exclude<AgentType, 'system' | 'user'>[] = [
    'director', 'designer', 'illustrator', 'copywriter', 'animator', 'researcher'
  ];

  if (!isOpen) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg ${
          isDark 
            ? 'bg-purple-600 hover:bg-purple-700 text-white' 
            : 'bg-purple-500 hover:bg-purple-600 text-white'
        }`}
        title="Skill 调试工具"
      >
        <Bug className="w-5 h-5" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-4 right-4 z-50 w-80 rounded-lg shadow-2xl overflow-hidden ${
        isDark 
          ? 'bg-gray-900 border border-gray-700' 
          : 'bg-white border border-gray-200'
      } ${className}`}
    >
      {/* 头部 */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="flex items-center gap-2">
          <Bug className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            Agent-Skill 映射
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700`}
        >
          <X className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
        </button>
      </div>

      {/* 内容区域 */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {/* Agent 选择 */}
        <div className="mb-4">
          <label className={`block text-xs font-medium mb-2 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            选择 Agent
          </label>
          <div className="space-y-1">
            {selectableAgents.map((agent) => {
              const info = AGENT_CAPABILITY_DESCRIPTIONS[agent];
              const isSelected = agent === selectedAgent;
              
              return (
                <button
                  key={agent}
                  onClick={() => setSelectedAgent(agent)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                    isSelected 
                      ? isDark 
                        ? 'bg-blue-900/30 border border-blue-500/50' 
                        : 'bg-blue-50 border border-blue-200'
                      : isDark 
                        ? 'hover:bg-gray-800' 
                        : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={isSelected ? 'text-blue-500' : 'text-gray-400'}>
                    {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4 opacity-0" />}
                  </span>
                  <span className="text-lg">{agentIconMap[agent]}</span>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      isSelected 
                        ? isDark ? 'text-blue-400' : 'text-blue-600'
                        : isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {info.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 当前 Agent 的 Skill 列表 */}
        <div>
          <label className={`block text-xs font-medium mb-2 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {AGENT_CAPABILITY_DESCRIPTIONS[selectedAgent]?.title} 拥有的 Skill
          </label>
          <div className="space-y-1">
            {AGENT_CAPABILITY_DESCRIPTIONS[selectedAgent]?.skills.map((skill) => (
              <div
                key={skill.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                  isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-gray-400" />
                <div>
                  <p className="font-medium">{skill.name}</p>
                  <p className={`${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {skill.id}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 提示 */}
        <div className={`mt-4 p-3 rounded-lg text-xs ${
          isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-600'
        }`}>
          <p className="font-medium mb-1">💡 提示</p>
          <p>选择不同的 Agent 会显示不同的 Skill 能力。在聊天界面中发送消息时，系统会根据意图自动匹配合适的 Skill。</p>
        </div>
      </div>
    </motion.div>
  );
};

export default SkillDebugger;
