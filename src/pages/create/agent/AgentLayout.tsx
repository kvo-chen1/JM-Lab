import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore } from './hooks/useAgentStore';
import { PanelLeft, PanelRight, Sparkles } from 'lucide-react';

interface AgentLayoutProps {
  children: {
    chatPanel: React.ReactNode;
    canvasPanel: React.ReactNode;
  };
}

export default function AgentLayout({ children }: AgentLayoutProps) {
  const { isDark } = useTheme();
  const { isChatCollapsed, toggleChatCollapsed, currentAgent, currentTask } = useAgentStore();

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* 顶部边距 - 避开搜索框 */}
      <div className="h-3"></div>
      
      {/* Header */}
      <header className={`h-14 px-4 flex items-center justify-between border-b backdrop-blur-md z-20 ${
        isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          {/* 折叠按钮 */}
          <motion.button
            onClick={toggleChatCollapsed}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isChatCollapsed ? '展开对话面板' : '收起对话面板'}
          >
            {isChatCollapsed ? <PanelRight className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
          </motion.button>

          {/* Logo和标题 */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C02C38] to-[#E85D75] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                津小脉Agent
              </h1>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {currentTask ? currentTask.title : '智能设计助手'}
              </p>
            </div>
          </div>
        </div>

        {/* 当前Agent指示器 */}
        <div className="flex items-center gap-2">
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>当前Agent:</span>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            currentAgent === 'director'
              ? 'bg-gradient-to-r from-amber-500/20 to-orange-600/20 text-amber-600 border border-amber-500/30'
              : 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-600 border border-cyan-500/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              currentAgent === 'director' ? 'bg-amber-500' : 'bg-cyan-500'
            }`} />
            {currentAgent === 'director' ? '津脉设计总监' : '津脉品牌设计师'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <motion.div
          initial={false}
          animate={{
            width: isChatCollapsed ? 0 : 400,
            opacity: isChatCollapsed ? 0 : 1
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex-shrink-0 overflow-hidden"
        >
          <div className="w-[400px] h-full">
            {children.chatPanel}
          </div>
        </motion.div>

        {/* Canvas Panel */}
        <div className="flex-1 min-w-0">
          {children.canvasPanel}
        </div>
      </div>
    </div>
  );
}
