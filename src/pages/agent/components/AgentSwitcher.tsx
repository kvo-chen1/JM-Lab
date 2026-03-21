import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentStore } from '../hooks/useAgentStore';
import { AgentType, AGENT_CONFIG } from '../types/agent';
import { ArrowRight, Sparkles } from 'lucide-react';

interface AgentSwitcherProps {
  fromAgent?: AgentType;
  toAgent: AgentType;
  isVisible: boolean;
  onComplete?: () => void;
}

export default function AgentSwitcher({
  fromAgent,
  toAgent,
  isVisible,
  onComplete
}: AgentSwitcherProps) {
  const { isDark } = useAgentStore();

  const fromConfig = fromAgent ? AGENT_CONFIG[fromAgent as keyof typeof AGENT_CONFIG] : null;
  const toConfig = AGENT_CONFIG[toAgent as keyof typeof AGENT_CONFIG];

  if (!toConfig) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onComplete}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className={`relative p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 ${
              isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 装饰背景 */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-amber-500/20 to-pink-500/20 rounded-full blur-3xl" />
            </div>

            {/* 内容 */}
            <div className="relative z-10">
              <div className="text-center mb-6">
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center justify-center gap-2 mb-2"
                >
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    正在切换团队成员
                  </span>
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </motion.div>
              </div>

              {/* Agent 切换动画 */}
              <div className="flex items-center justify-center gap-6 mb-6">
                {/* 原 Agent */}
                {fromConfig && (
                  <motion.div
                    initial={{ x: 0, opacity: 1 }}
                    animate={{ x: -20, opacity: 0.5 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="flex flex-col items-center"
                  >
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${fromConfig.color} flex items-center justify-center shadow-lg mb-2`}>
                      <span className="text-2xl text-white font-bold">{fromConfig.avatar}</span>
                    </div>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {fromConfig.name}
                    </span>
                  </motion.div>
                )}

                {/* 箭头动画 */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  >
                    <ArrowRight className="w-8 h-8 text-gray-400" />
                  </motion.div>
                </motion.div>

                {/* 新 Agent */}
                <motion.div
                  initial={{ x: 20, opacity: 0.5 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${toConfig.color} flex items-center justify-center shadow-lg mb-2 ring-4 ring-offset-2 ${
                      isDark ? 'ring-offset-gray-900 ring-blue-500/30' : 'ring-offset-white ring-blue-500/20'
                    }`}
                  >
                    <span className="text-2xl text-white font-bold">{toConfig.avatar}</span>
                  </motion.div>
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {toConfig.name}
                  </span>
                </motion.div>
              </div>

              {/* 描述 */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className={`text-center p-4 rounded-xl ${
                  isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                }`}
              >
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {toConfig.description}
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {toConfig.capabilities.slice(0, 3).map((cap, index) => (
                    <span
                      key={index}
                      className={`text-xs px-2 py-1 rounded-full ${
                        isDark ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-600 border border-gray-200'
                      }`}
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* 关闭按钮 */}
              <motion.button
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                onClick={onComplete}
                className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity"
              >
                开始对话
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
