import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore } from './hooks/useAgentStore';
import { useConversationStore, initializeSession } from './hooks/useConversationStore';
import { PanelLeft, Sparkles, History, Share2 } from 'lucide-react';
import ConversationSidebar from './components/ConversationSidebar';
import FeedbackModal from '@/components/Feedback/FeedbackModal';
import PublishCaseModal from './components/PublishCaseModal';

interface AgentLayoutProps {
  children: {
    chatPanel: React.ReactNode;
    canvasPanel: React.ReactNode;
  };
}

export default function AgentLayout({ children }: AgentLayoutProps) {
  const { isDark } = useTheme();
  const { isChatCollapsed, currentAgent, currentTask, messages } = useAgentStore();
  const { currentSessionId, getCurrentSession, createSession } = useConversationStore();
  const [isConversationSidebarOpen, setIsConversationSidebarOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 当反馈弹窗打开时，自动收起会话侧边栏
  useEffect(() => {
    if (isFeedbackOpen && isConversationSidebarOpen) {
      setIsConversationSidebarOpen(false);
    }
  }, [isFeedbackOpen]);

  // 初始化时恢复会话（确保 agentStore 状态已恢复后再执行）
  useEffect(() => {
    // 使用 setTimeout 确保在首次渲染完成后执行
    // 此时 zustand persist 应该已经完成状态恢复
    const timer = setTimeout(() => {
      if (isInitialized) return;

      console.log('[AgentLayout] 初始化会话，currentSessionId:', currentSessionId);

      // 优先使用 initializeSession 恢复会话
      const restoredSessionId = initializeSession();
      console.log('[AgentLayout] 会话恢复结果:', restoredSessionId);

      // 如果没有恢复成功且没有当前会话，检查是否需要创建新会话
      if (!restoredSessionId && !currentSessionId) {
        // 使用 getState 获取最新的消息数量（避免闭包问题）
        const agentStore = useAgentStore.getState();
        // 如果有现有对话内容（多条消息或已有任务），保存为会话
        if (agentStore.messages.length > 1 || agentStore.currentTask) {
          const title = agentStore.currentTask?.title || '未命名会话';
          console.log('[AgentLayout] 创建新会话:', title);
          createSession(title);
        }
      }

      setIsInitialized(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [isInitialized, currentSessionId]);

  const currentSession = getCurrentSession();

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${isDark ? 'bg-[#0a0f0a]' : 'bg-gray-50'}`}>
      {/* Header - 添加 mt-3 为 SidebarLayout 的顶部导航栏留出空间 */}
      <header className={`h-14 px-4 mt-3 flex items-center justify-between border-b backdrop-blur-md z-20 ${
        isDark ? 'bg-[#1a1f1a]/80 border-[#2a2f2a]' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          {/* 会话侧边栏切换按钮 */}
          <motion.button
            onClick={() => setIsConversationSidebarOpen(!isConversationSidebarOpen)}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-[#3a3f3a] text-[#a0a0a0]' : 'hover:bg-gray-100 text-gray-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isConversationSidebarOpen ? '收起会话列表' : '展开会话列表'}
          >
            {isConversationSidebarOpen ? (
              <PanelLeft className="w-5 h-5" />
            ) : (
              <History className="w-5 h-5" />
            )}
          </motion.button>

          {/* Logo和标题 */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C02C38] to-[#E85D75] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className={`font-bold text-lg ${isDark ? 'text-[#ffffff]' : 'text-gray-900'}`}>
                津小脉 Agent
              </h1>
              <p className={`text-xs ${isDark ? 'text-[#a0a0a0]' : 'text-gray-500'}`}>
                {currentSession?.title || (currentTask ? currentTask.title : '智能设计助手')}
              </p>
            </div>
          </div>
        </div>

        {/* 右侧操作按钮 */}
        <div className="flex items-center gap-2">
          {/* 发布案例按钮 */}
          {messages.length > 0 && (
            <motion.button
              onClick={() => setIsPublishModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isDark
                  ? 'bg-gradient-to-r from-[#C02C38] to-[#E85D75] text-white hover:opacity-90'
                  : 'bg-gradient-to-r from-[#C02C38] to-[#E85D75] text-white hover:opacity-90'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="发布当前对话到案例库"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>发布案例</span>
            </motion.button>
          )}

          {/* 当前 Agent 指示器 */}
          <span className={`text-xs ${isDark ? 'text-[#a0a0a0]' : 'text-gray-500'}`}>当前 Agent:</span>
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
      <div className="flex-1 flex min-h-0">
        {/* Conversation Sidebar */}
        <ConversationSidebar
          isOpen={isConversationSidebarOpen}
          onToggle={() => setIsConversationSidebarOpen(!isConversationSidebarOpen)}
        />

        {/* Chat Panel - 固定高度 */}
        <motion.div
          initial={false}
          animate={{
            width: isChatCollapsed ? 0 : 480,
            opacity: isChatCollapsed ? 0 : 1
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex-shrink-0 h-full"
        >
          <div className="w-[480px] h-full">
            {children.chatPanel}
          </div>
        </motion.div>

        {/* Canvas Panel - 可滚动 */}
        <div className="flex-1 min-w-0 h-full overflow-y-auto relative">
          {React.cloneElement(children.canvasPanel as React.ReactElement, {
            onFeedbackClick: () => setIsFeedbackOpen(true)
          })}
        </div>
      </div>

      {/* 反馈弹窗 */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

      {/* 发布案例弹窗 */}
      <PublishCaseModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
      />
    </div>
  );
}
