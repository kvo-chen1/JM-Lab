import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Sparkles, Trash2, Wand2, PanelRightClose, PanelRight } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { PresetScenarios } from './components/PresetScenarios';
import { DraggableCanvas } from './components/DraggableCanvas';
import { ChatHistory } from './components/ChatHistory';
import { useSkillChat } from './hooks/useSkillChat';
import { useChatSessions } from './hooks/useChatSessions';
import { useCanvasStore, WorkItem } from './hooks/useCanvasStore';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeSkills } from '../skills';

const SkillAgentChatPage: React.FC = () => {
  const { isDark } = useTheme();
  const { 
    sessions, 
    currentSessionId, 
    currentSession,
    createSession, 
    switchSession, 
    deleteSession, 
    renameSession,
    updateSessionMessages,
    clearAllSessions,
    formatTime 
  } = useChatSessions();
  
  const { 
    messages, 
    isProcessing, 
    sendMessage, 
    clearMessages, 
    loadMessages,
    currentSkillCall 
  } = useSkillChat();
  
  const { works, addWork, clearWorks, selectWork } = useCanvasStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showChat, setShowChat] = useState(true);
  
  // 记录已处理的附件 ID，防止重复处理
  const processedAttachmentsRef = useRef<Set<string>>(new Set());

  // 初始化 Skills（只在组件挂载时执行一次）
  useEffect(() => {
    try {
      initializeSkills();
      console.log('[SkillAgentChatPage] Skills initialized');
    } catch (error) {
      console.error('[SkillAgentChatPage] Failed to initialize skills:', error);
    }
  }, []);

  // 同步消息中的附件到画布
  const syncAttachmentsToCanvas = useCallback((msgs: ChatMessage[]) => {
    msgs.forEach((msg, index) => {
      // 处理消息的条件：
      // 1. 没有 skillCall 状态（普通消息）
      // 2. skillCall 状态为 completed 或 error（已完成或出错）
      // 3. 有 attachments 的消息（即使状态还是 calling，但已经有附件了）
      const shouldProcess = !msg.skillCall?.status || 
                           msg.skillCall.status === 'completed' || 
                           msg.skillCall.status === 'error' ||
                           (msg.attachments && msg.attachments.length > 0);
      
      if (!shouldProcess) {
        return;
      }

      if (msg.role === 'agent' && msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach((attachment, attIndex) => {
          // 生成附件唯一 ID（优先使用 attachment.id，否则使用 msg.id + index）
          const attachmentId = attachment.id || `${msg.id}_att_${attIndex}`;

          // 检查是否已处理
          if (processedAttachmentsRef.current.has(attachmentId)) {
            return;
          }

          try {
            if (attachment.type === 'image' && attachment.url) {
              // 检查是否已存在（通过 URL 判断）
              const currentWorks = useCanvasStore.getState().works;
              const exists = currentWorks.some(w => w.imageUrl === attachment.url);

              if (!exists) {
                // 使用 getState().addWork 确保使用最新的状态
                useCanvasStore.getState().addWork({
                  id: `work_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  title: attachment.title || '生成的作品',
                  type: 'image',
                  imageUrl: attachment.url,
                  thumbnailUrl: attachment.thumbnailUrl || attachment.url,
                  description: msg.content.slice(0, 100),
                  status: 'completed',
                });
              }
            } else if (attachment.type === 'text' && attachment.content) {
              // 处理文本类型附件（文案）
              const currentWorks = useCanvasStore.getState().works;
              const exists = currentWorks.some(w =>
                w.type === 'text' && w.content === attachment.content
              );

              if (!exists) {
                useCanvasStore.getState().addWork({
                  id: `work_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  title: attachment.title || '生成的文案',
                  type: 'text',
                  content: attachment.content,
                  description: msg.content.slice(0, 100),
                  status: 'completed',
                });
              }
            }

            // 标记为已处理（无论是否已存在，都标记为已处理）
            processedAttachmentsRef.current.add(attachmentId);
          } catch (error) {
            console.error('[ChatPage] 添加作品失败:', error, attachment);
            // 如果添加失败，不标记为已处理，下次重试
          }
        });
      }
    });
  }, []);

  // 同步当前会话的消息到会话管理
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      updateSessionMessages(currentSessionId, messages);
    }
  }, [messages, currentSessionId, updateSessionMessages]);

  // 页面初始化时加载当前会话的消息（只在组件挂载时执行一次）
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (currentSessionId && sessions.length > 0) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session && session.messages.length > 0) {
        clearWorks();
        processedAttachmentsRef.current.clear();
        loadMessages(session.messages);
        syncAttachmentsToCanvas(session.messages);
      }
      hasInitializedRef.current = true;
    }
  }, [currentSessionId, sessions.length, sessions, loadMessages, syncAttachmentsToCanvas, clearWorks]);

  // 切换会话时加载对应的消息
  const handleSwitchSession = useCallback((sessionId: string) => {
    const session = switchSession(sessionId);
    if (session) {
      // 清空画布和已处理记录，避免旧数据干扰
      clearWorks();
      processedAttachmentsRef.current.clear();
      // 加载会话的消息到 useSkillChat
      loadMessages(session.messages);
      // 同步附件到画布（使用 setTimeout 确保在 loadMessages 完成后执行）
      setTimeout(() => {
        syncAttachmentsToCanvas(session.messages);
      }, 0);
    }
  }, [switchSession, loadMessages, syncAttachmentsToCanvas, clearWorks]);

  // 创建新会话
  const handleCreateSession = useCallback(() => {
    // 先清空消息和画布
    clearMessages();
    clearWorks();
    // 清空已处理的附件记录，避免新会话的附件被跳过
    processedAttachmentsRef.current.clear();
    // 再创建新会话（确保新会话是空的）
    const newSession = createSession();
  }, [createSession, clearMessages, clearWorks]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 将消息中的附件转换为画布作品（用于实时消息）
  useEffect(() => {
    if (messages.length > 0) {
      syncAttachmentsToCanvas(messages);
    }
  }, [messages, syncAttachmentsToCanvas]);

  const handleSendMessage = (content: string, images?: any[]) => {
    sendMessage(content, images);
  };

  const handleClearAll = () => {
    clearMessages();
    clearWorks();
    // 清空已处理的附件记录
    processedAttachmentsRef.current.clear();
  };

  const handleWorkSelect = (work: WorkItem) => {
    selectWork(work.id);
  };

  const handleWorkDelete = (id: string) => {
    // 从画布状态中删除
    const { deleteWork } = useCanvasStore.getState();
    deleteWork(id);
  };

  const handleWorkDownload = (work: WorkItem) => {
    if (work.imageUrl) {
      const link = document.createElement('a');
      link.href = work.imageUrl;
      link.download = work.title || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={`h-screen flex ${isDark ? 'bg-[#0a0f0a]' : 'bg-gray-50'}`}>
      {/* Left Side - Canvas Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Canvas Header */}
        <div className={`h-14 flex items-center justify-between px-4 border-b ${
          isDark ? 'border-gray-800 bg-[#0a0f0a]' : 'border-gray-200 bg-white'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>画布</span>
              {works.length > 0 && (
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                }`}>
                  {works.length} 个作品
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 切换聊天面板按钮 */}
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-2 rounded-lg transition-colors ${
                isDark 
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
              title={showChat ? '隐藏聊天面板' : '显示聊天面板'}
            >
              {showChat ? <PanelRightClose className="w-5 h-5" /> : <PanelRight className="w-5 h-5" />}
            </button>
            
            <button
              onClick={handleClearAll}
              disabled={messages.length === 0 && works.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-30 ${
                isDark 
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-red-400' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-red-500'
              }`}
              title="清空所有内容"
            >
              <Trash2 className="w-4 h-4" />
              清空
            </button>
          </div>
        </div>

        {/* Canvas Content */}
        <div className="flex-1 overflow-hidden">
          <DraggableCanvas
            isGenerating={isProcessing && currentSkillCall?.status === 'executing'}
            onWorkSelect={handleWorkSelect}
            onWorkDelete={handleWorkDelete}
            onWorkDownload={handleWorkDownload}
          />
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <AnimatePresence mode="wait">
        {showChat && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 450, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={`flex flex-col border-l shadow-xl overflow-hidden ${
              isDark ? 'border-gray-800 bg-[#0f1410]' : 'border-gray-200 bg-white'
            }`}
          >
            {/* Chat Header */}
            <div className={`h-14 border-b flex items-center justify-between px-4 ${
              isDark ? 'border-gray-800 bg-[#0f1410]' : 'border-gray-200 bg-white'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className={`font-semibold text-sm ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Skill Agent</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>在线</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowChat(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
                title="收起面板"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>

            {/* Chat History */}
            <ChatHistory
              sessions={sessions}
              currentSessionId={currentSessionId}
              onSwitchSession={handleSwitchSession}
              onCreateSession={handleCreateSession}
              onDeleteSession={deleteSession}
              onRenameSession={renameSession}
              formatTime={formatTime}
            />

            {/* Chat Messages */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
              isDark ? 'bg-[#0f1410]' : 'bg-gray-50'
            }`}>
              {messages.length === 0 ? (
                <PresetScenarios onSelect={handleSendMessage} />
              ) : (
                <>
                  {messages.map((message, index) => (
                    <ChatMessage 
                      key={message.id} 
                      message={message}
                      isLast={index === messages.length - 1}
                      onSendMessage={handleSendMessage}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Chat Input */}
            <div className={`${
              isDark ? 'bg-[#0f1410]' : 'bg-white'
            }`}>
              <ChatInput 
                onSend={handleSendMessage} 
                isProcessing={isProcessing}
                placeholder="输入消息开始对话..."
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 当聊天面板隐藏时显示的展开按钮 */}
      {!showChat && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setShowChat(true)}
          className={`absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-xl shadow-lg transition-colors ${
            isDark 
              ? 'bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
          title="展开聊天面板"
        >
          <PanelRight className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  );
};

export default SkillAgentChatPage;
