import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore, PRESET_STYLES } from '../hooks/useAgentStore';
import { Send, Image as ImageIcon, Mic, Sparkles, Trash2, Bot, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import ChatMessage from './ChatMessage';
import AgentAvatar from './AgentAvatar';
import AgentSwitcher from './AgentSwitcher';
import DelegationIndicator from './DelegationIndicator';
import UploadDialog from './UploadDialog';
import InspirationHints from './InspirationHints';
import type { InspirationHint } from '../types/agent';
import {
  agentOrchestrator,
  processWithOrchestrator,
  ConversationContext
} from '../services/agentOrchestrator';
import {
  analyzeDesignRequirements
} from '../services/agentService';
import type { DesignTask, AgentMessage, AgentType, OrchestratorResponse } from '../types/agent';
import { AGENT_CONFIG } from '../types/agent';

export default function ChatPanel() {
  const { isDark } = useTheme();
  const {
    messages,
    isTyping,
    currentAgent,
    currentTask,
    delegationHistory,
    agentQueue,
    addMessage,
    setIsTyping,
    setCurrentAgent,
    clearMessages,
    createTask,
    updateTaskRequirements,
    setShowStyleSelector,
    updateMessage,
    delegateToAgent,
    completeDelegation,
    addToAgentQueue,
    processNextInQueue,
    setCollaborating
  } = useAgentStore();

  const [inputValue, setInputValue] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [showAgentSwitcher, setShowAgentSwitcher] = useState(false);
  const [switcherFromAgent, setSwitcherFromAgent] = useState<AgentType | undefined>();
  const [switcherToAgent, setSwitcherToAgent] = useState<AgentType>('director');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 自动滚动到底部
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior
      });
    }
  }, []);

  // 页面加载时自动滚动到底部
  useEffect(() => {
    // 使用 setTimeout 确保 DOM 已完全渲染
    const timer = setTimeout(() => {
      scrollToBottom('auto');
    }, 500);
    return () => clearTimeout(timer);
  }, [scrollToBottom]);

  // 消息变化时自动滚动到底部
  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, streamingContent, isTyping, scrollToBottom]);

  // 当消息从空数组变为有内容时（如从本地存储加载完成），滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom('auto');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [messages.length, scrollToBottom]);

  // 自动调整输入框高度
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  // 处理 Agent 切换动画
  const handleAgentSwitch = useCallback((fromAgent: AgentType | undefined, toAgent: AgentType) => {
    setSwitcherFromAgent(fromAgent);
    setSwitcherToAgent(toAgent);
    setShowAgentSwitcher(true);
  }, []);

  // 处理编排器响应
  const handleOrchestratorResponse = useCallback(async (
    response: OrchestratorResponse,
    messageId: string
  ) => {
    // 更新消息内容
    updateMessage(messageId, {
      content: response.content,
      type: response.aiResponse?.type || 'text',
      metadata: {
        thinking: response.aiResponse?.thinking,
        ...response.aiResponse?.metadata
      }
    });

    // 处理不同类型的响应
    switch (response.type) {
      case 'delegation':
        if (response.delegationTask) {
          // 显示 Agent 切换动画
          handleAgentSwitch(
            response.delegationTask.fromAgent,
            response.delegationTask.toAgent
          );

          // 添加委派指示消息
          addMessage({
            role: 'system',
            content: `${AGENT_CONFIG[response.delegationTask.fromAgent as keyof typeof AGENT_CONFIG].name} 将任务委派给了 ${AGENT_CONFIG[response.delegationTask.toAgent as keyof typeof AGENT_CONFIG].name}`,
            type: 'delegation',
            metadata: {
              delegationInfo: {
                fromAgent: response.delegationTask.fromAgent,
                toAgent: response.delegationTask.toAgent,
                taskDescription: response.delegationTask.taskDescription,
                reasoning: response.delegationTask.context
              }
            }
          });
        }
        break;

      case 'collaboration':
        if (response.collaborationAgents && response.collaborationAgents.length > 0) {
          setCollaborating(true, response.collaborationAgents);

          // 添加协作消息
          addMessage({
            role: 'system',
            content: `开始协作模式，${response.collaborationAgents.length} 位团队成员将同时为你服务`,
            type: 'collaboration',
            metadata: {
              collaborationInfo: {
                participatingAgents: response.collaborationAgents,
                taskDescription: '协作任务',
                progress: 0
              }
            }
          });
        }
        break;

      case 'chain':
        if (response.chainQueue && response.chainQueue.length > 0) {
          addToAgentQueue(response.chainQueue);

          // 添加链式任务消息
          addMessage({
            role: 'system',
            content: `已安排 ${response.chainQueue.length + 1} 位团队成员依次为你服务`,
            type: 'text'
          });
        }
        break;

      case 'handoff':
        // 完全交接给新 Agent
        handleAgentSwitch(currentAgent, response.agent);
        break;

      case 'response':
      default:
        // 普通响应，检查是否需要切换 Agent
        if (response.agent !== currentAgent) {
          handleAgentSwitch(currentAgent, response.agent);
        }
        break;
    }

    // 处理风格选项
    if (response.aiResponse?.type === 'style-options') {
      setShowStyleSelector(true);
    }

    // 智能检测：如果设计师或总监说开始设计/生成方案等，自动显示风格选择器
    const designKeywords = [
      '开始设计', '生成方案', '呈现方案', '设计方案', '概念图', '初步方案', 
      '为你设计', '提供方案', '制作方案', '提供初步', '设计方案', '设计形象'
    ];
    const shouldShowStyleSelector = (response.agent === 'designer' || response.agent === 'director') &&
      designKeywords.some(keyword => response.content.includes(keyword));

    if (shouldShowStyleSelector) {
      setTimeout(() => {
        setShowStyleSelector(true);
        // 添加风格选择提示
        addMessage({
          role: 'designer',
          content: '请选择你喜欢的设计风格：',
          type: 'style-options'
        });
      }, 500);
    }
  }, [currentAgent, updateMessage, addMessage, setCollaborating, addToAgentQueue, handleAgentSwitch, setShowStyleSelector]);

  // 流式显示AI响应
  const streamResponse = useCallback(async (content: string, messageId: string) => {
    setStreamingContent('');
    const chars = content.split('');

    for (let i = 0; i < chars.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 15));
      setStreamingContent(prev => prev + chars[i]);

      // 每50个字符更新一次消息
      if (i % 50 === 0 || i === chars.length - 1) {
        updateMessage(messageId, {
          content: content.slice(0, i + 1)
        });
      }
    }

    setStreamingContent('');
  }, [updateMessage]);

  // 处理发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // 添加用户消息
    addMessage({
      role: 'user',
      content: userMessage,
      type: 'text'
    });

    setIsTyping(true);

    try {
      // 如果没有当前任务，先分析需求并创建任务
      if (!currentTask) {
        const analysis = await analyzeDesignRequirements(userMessage);
        createTask(analysis.type, getTaskTitle(analysis.type), userMessage);

        // 更新任务需求
        updateTaskRequirements({
          description: userMessage
        });
      }

      // 构建对话上下文（包含刚添加的用户消息）
      const userMessageObj: AgentMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: userMessage,
        timestamp: Date.now(),
        type: 'text'
      };

      const context: ConversationContext = {
        currentAgent,
        messages: [...messages.slice(-9), userMessageObj], // 包含用户消息
        taskDescription: currentTask?.requirements.description,
        delegationHistory
      };

      // 创建临时消息用于流式显示
      const tempMessageId = addMessage({
        role: currentAgent,
        content: '',
        type: 'text'
      });

      // 使用编排器处理用户输入
      const response = await processWithOrchestrator(userMessage, context);

      // 更新当前 Agent
      if (response.agent !== currentAgent) {
        setCurrentAgent(response.agent);
      }

      // 流式显示响应
      await streamResponse(response.content, tempMessageId);

      // 处理编排器响应
      await handleOrchestratorResponse(response, tempMessageId);

    } catch (error) {
      console.error('[Chat] Error:', error);
      toast.error('AI响应失败，请重试');

      // 添加错误提示消息
      addMessage({
        role: currentAgent,
        content: '抱歉，我遇到了一些问题。请稍后再试，或者换个方式描述你的需求。',
        type: 'text'
      });
    } finally {
      setIsTyping(false);
    }
  };

  // 获取任务标题
  const getTaskTitle = (type: string): string => {
    switch (type) {
      case 'ip-character':
        return 'IP形象设计';
      case 'brand-packaging':
        return '品牌包装设计';
      case 'poster':
        return '宣传海报设计';
      default:
        return '创意设计任务';
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 清空对话
  const handleClear = () => {
    if (confirm('确定要清空对话吗？')) {
      clearMessages();
      toast.success('对话已清空');
    }
  };

  // 状态管理
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showInspirationPanel, setShowInspirationPanel] = useState(false);

  const toggleInspirationPanel = () => setShowInspirationPanel(!showInspirationPanel);

  // 快速操作
  const quickActions = [
    { icon: Trash2, label: '清空对话', onClick: handleClear },
    { icon: ImageIcon, label: '上传参考', onClick: () => setShowUploadDialog(true) },
    { icon: Sparkles, label: '灵感提示', onClick: toggleInspirationPanel }
  ];

  // 获取当前 Agent 的颜色
  const getAgentColor = () => {
    switch (currentAgent) {
      case 'director':
        return 'bg-amber-500';
      case 'designer':
        return 'bg-cyan-500';
      case 'illustrator':
        return 'bg-pink-500';
      case 'copywriter':
        return 'bg-emerald-500';
      case 'animator':
        return 'bg-violet-500';
      case 'researcher':
        return 'bg-slate-500';
      default:
        return 'bg-gray-500';
    }
  };

  const addReferenceImage = (image: { id: string; url: string; name: string; size: number; type: string; uploadedAt: number }) => {
    // 添加参考图片到消息
    addMessage({
      role: 'user',
      content: '',
      type: 'image',
      metadata: {
        imageUrl: image.url,
        imageName: image.name
      }
    });
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-gray-900/50' : 'bg-white/50'}`}>
      {/* Agent Switcher Modal */}
      <AgentSwitcher
        fromAgent={switcherFromAgent}
        toAgent={switcherToAgent}
        isVisible={showAgentSwitcher}
        onComplete={() => setShowAgentSwitcher(false)}
      />

      {/* 上传对话框 */}
      <UploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUploadComplete={(results) => {
          results.forEach(result => {
            addReferenceImage({
              id: `upload_${Date.now()}_${Math.random()}`,
              url: result.url,
              name: result.name,
              size: result.size,
              type: result.type,
              uploadedAt: Date.now()
            });
          });
          toast.success(`已上传 ${results.length} 张图片`);
        }}
      />

      {/* 灵感提示面板 */}
      <AnimatePresence>
        {showInspirationPanel && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed right-0 top-0 h-full w-96 shadow-2xl z-40 ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <InspirationHints
              onHintSelect={(hint: InspirationHint) => {
                setInputValue(hint.examplePrompt);
                toggleInspirationPanel();
                toast.success(`已应用灵感提示：${hint.title}`);
              }}
              onClose={toggleInspirationPanel}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <AnimatePresence>
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              isLast={index === messages.length - 1}
            />
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3"
          >
            <AgentAvatar role={currentAgent} size="sm" />
            <div className={`px-4 py-3 rounded-2xl rounded-tl-sm ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <div className="flex items-center gap-1">
                <motion.div
                  className={`w-2 h-2 rounded-full ${getAgentColor()}`}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className={`w-2 h-2 rounded-full ${getAgentColor()}`}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className={`w-2 h-2 rounded-full ${getAgentColor()}`}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-800 bg-gray-900/80' : 'border-gray-200 bg-white/80'}`}>
        {/* Quick Actions */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <action.icon className="w-3 h-3" />
              {action.label}
            </button>
          ))}
        </div>

        {/* Input Box */}
        <div className={`flex items-end gap-2 p-2 rounded-xl border ${
          isDark
            ? 'bg-gray-800 border-gray-700 focus-within:border-gray-600'
            : 'bg-white border-gray-200 focus-within:border-gray-300'
        }`}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的设计需求..."
            disabled={isTyping}
            className={`flex-1 bg-transparent border-none outline-none resize-none max-h-[120px] min-h-[40px] py-2 px-2 text-sm ${
              isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
            } disabled:opacity-50`}
            rows={1}
          />
          <div className="flex items-center gap-1 pb-1">
            <button
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
              title="语音输入"
            >
              <Mic className="w-4 h-4" />
            </button>
            <motion.button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className={`p-2 rounded-lg transition-colors ${
                inputValue.trim() && !isTyping
                  ? 'bg-gradient-to-r from-[#C02C38] to-[#E85D75] text-white'
                  : isDark
                    ? 'bg-gray-700 text-gray-500'
                    : 'bg-gray-200 text-gray-400'
              }`}
              whileHover={inputValue.trim() && !isTyping ? { scale: 1.05 } : {}}
              whileTap={inputValue.trim() && !isTyping ? { scale: 0.95 } : {}}
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        <p className={`text-xs mt-2 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          按 Enter 发送，Shift + Enter 换行
        </p>
      </div>
    </div>
  );
}
