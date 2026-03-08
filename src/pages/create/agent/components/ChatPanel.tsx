import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore } from '../hooks/useAgentStore';
import { Send, Image as ImageIcon, Mic, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ChatMessage from './ChatMessage';
import AgentAvatar from './AgentAvatar';

export default function ChatPanel() {
  const { isDark } = useTheme();
  const {
    messages,
    isTyping,
    currentAgent,
    addMessage,
    setIsTyping,
    setCurrentAgent,
    clearMessages,
    createTask,
    currentTask
  } = useAgentStore();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // 自动调整输入框高度
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  // 处理发送消息
  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // 添加用户消息
    addMessage({
      role: 'user',
      content: userMessage,
      type: 'text'
    });

    // 模拟Agent回复
    setIsTyping(true);

    // 如果没有当前任务，创建一个新任务
    if (!currentTask) {
      // 检测任务类型
      const taskType = detectTaskType(userMessage);
      createTask(taskType, getTaskTitle(taskType, userMessage), userMessage);
    }

    // 模拟回复延迟
    setTimeout(() => {
      setIsTyping(false);
      
      // 根据当前Agent生成回复
      if (currentAgent === 'director') {
        // 设计总监回复逻辑
        const response = generateDirectorResponse(userMessage, currentTask);
        addMessage({
          role: 'director',
          content: response.content,
          type: response.type,
          metadata: response.metadata
        });

        // 如果需要切换到设计师
        if (response.switchToDesigner) {
          setTimeout(() => {
            setCurrentAgent('designer');
            addMessage({
              role: 'designer',
              content: '收到总监的任务安排！我是津脉品牌设计师，专门负责将创意转化为视觉作品。让我来为你设计吧！',
              type: 'text'
            });
          }, 1000);
        }
      } else {
        // 品牌设计师回复逻辑
        const response = generateDesignerResponse(userMessage, currentTask);
        addMessage({
          role: 'designer',
          content: response.content,
          type: response.type,
          metadata: response.metadata
        });
      }
    }, 1500 + Math.random() * 1000);
  };

  // 检测任务类型
  const detectTaskType = (message: string): 'ip-character' | 'brand-packaging' | 'poster' | 'custom' => {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('ip') || lowerMsg.includes('形象') || lowerMsg.includes('角色') || lowerMsg.includes('吉祥物')) {
      return 'ip-character';
    }
    if (lowerMsg.includes('包装') || lowerMsg.includes('品牌')) {
      return 'brand-packaging';
    }
    if (lowerMsg.includes('海报') || lowerMsg.includes('宣传')) {
      return 'poster';
    }
    return 'custom';
  };

  // 获取任务标题
  const getTaskTitle = (type: string, message: string): string => {
    switch (type) {
      case 'ip-character':
        return 'IP形象设计';
      case 'brand-packaging':
        return '品牌包装设计';
      case 'poster':
        return '宣传海报设计';
      default:
        return message.slice(0, 20) + (message.length > 20 ? '...' : '');
    }
  };

  // 生成设计总监回复
  const generateDirectorResponse = (userMessage: string, task: any) => {
    const lowerMsg = userMessage.toLowerCase();
    
    // 如果是IP形象设计
    if (task?.type === 'ip-character' || lowerMsg.includes('ip') || lowerMsg.includes('形象')) {
      return {
        content: `收到！你想要设计一个IP形象，这是个很棒的想法！\n\n为了帮你设计出最合适的形象，我需要了解几个关键点：\n\n1. **这个IP形象的主要用途是什么？**\n   • 品牌吉祥物\n   • 虚拟代言人\n   • 文创产品\n   • 其他\n\n2. **目标受众是谁？**（比如：儿童、年轻人、商务人士等）\n\n3. **你希望传达什么样的感觉？**（比如：可爱、专业、潮流、传统等）\n\n请告诉我这些信息，我会安排品牌设计师为你创作！`,
        type: 'text',
        switchToDesigner: false
      };
    }

    // 默认回复
    return {
      content: `好的，我理解你的需求了！\n\n让我为你分析一下：你想要的是${task?.type === 'custom' ? '一个创意设计' : getTaskTitle(task?.type || 'custom', userMessage)}。\n\n为了确保设计效果，能否告诉我更多细节？比如：\n• 目标受众是谁？\n• 有什么特别的要求或偏好吗？\n• 最终用途是什么？\n\n了解清楚后，我会指派品牌设计师开始创作！`,
      type: 'text',
      switchToDesigner: false
    };
  };

  // 生成品牌设计师回复
  const generateDesignerResponse = (userMessage: string, task: any) => {
    const lowerMsg = userMessage.toLowerCase();
    
    // 如果提到了风格或准备开始设计
    if (lowerMsg.includes('风格') || lowerMsg.includes('开始') || lowerMsg.includes('设计')) {
      return {
        content: '太好了！我已经了解了你的需求。现在让我为你展示一些风格选项，你可以选择最喜欢的设计风格：',
        type: 'style-options',
        metadata: {
          thinking: '根据用户需求分析：\n• 设计类型：IP形象\n• 目标受众：年轻群体\n• 风格偏好：可爱、治愈\n• 推荐风格：温馨彩绘、童趣蜡笔插画'
        }
      };
    }

    // 默认回复
    return {
      content: '明白！我正在分析你的需求，准备为你设计。请稍等片刻...',
      type: 'text'
    };
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

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-gray-900/50' : 'bg-white/50'}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <AnimatePresence>
          {messages.map((message, index) => (
            <ChatMessage key={message.id} message={message} isLast={index === messages.length - 1} />
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
                  className={`w-2 h-2 rounded-full ${currentAgent === 'director' ? 'bg-amber-500' : 'bg-cyan-500'}`}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className={`w-2 h-2 rounded-full ${currentAgent === 'director' ? 'bg-amber-500' : 'bg-cyan-500'}`}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className={`w-2 h-2 rounded-full ${currentAgent === 'director' ? 'bg-amber-500' : 'bg-cyan-500'}`}
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
          <button
            onClick={handleClear}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            <Trash2 className="w-3 h-3" />
            清空对话
          </button>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            上传参考
          </button>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            灵感提示
          </button>
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
            className={`flex-1 bg-transparent border-none outline-none resize-none max-h-[120px] min-h-[40px] py-2 px-2 text-sm ${
              isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
            }`}
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
