import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Minimize2,
  Maximize2,
  Headphones
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  isHelpful?: boolean;
}

interface AIChatBotProps {
  initialOpen?: boolean;
  onClose?: () => void;
}

// 常见问题知识库
const knowledgeBase: Record<string, string> = {
  '注册': '您可以通过邮箱或手机号注册账号，也可以使用微信、支付宝等第三方账号快捷登录。注册完成后，系统会发送验证邮件或短信。',
  '登录': '在登录页面输入您的邮箱/手机号和密码即可登录。如果忘记密码，可以点击"忘记密码"链接进行重置。',
  '密码': '如果忘记密码，请点击登录页面的"忘记密码"链接，按照提示输入注册邮箱或手机号，系统会发送密码重置链接。',
  '会员': '会员可以享受无限AI生成次数、高级AI模型访问、高清作品导出等权益。您可以在"会员中心"查看详细权益说明。',
  '创作': '进入"AI创作工具"页面，选择模型与参数，按照向导完成创作流程。首次使用建议查看新手引导教程。',
  '工单': '点击页面右下角的"提交工单"按钮，选择工单类型，填写标题和描述即可提交。我们会尽快处理您的工单。',
  '反馈': '您可以通过反馈按钮提交问题或建议，我们的客服团队会在24小时内回复。',
  '积分': '积分可以通过每日签到、完成任务、参与活动等方式获得。积分可以在积分商城兑换商品或服务。',
  '导出': 'VIP会员可以导出高清作品。在作品详情页点击"导出"按钮，选择格式和尺寸即可。',
  '水印': '免费用户导出的作品会带有水印。升级VIP会员后可以去除水印。',
};

// 智能回复生成函数
const generateResponse = (userMessage: string): { content: string; suggestions: string[] } => {
  const lowerMessage = userMessage.toLowerCase();
  
  // 检查知识库匹配
  for (const [keyword, answer] of Object.entries(knowledgeBase)) {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      return {
        content: answer,
        suggestions: ['还有其他问题吗？', '需要人工客服帮助吗？', '查看相关文档']
      };
    }
  }
  
  // 默认回复
  const defaultResponses = [
    '我理解您的问题。为了更好地帮助您，您可以：\n1. 查看帮助中心的常见问题\n2. 提交工单获取人工帮助\n3. 详细描述您遇到的问题',
    '感谢您的咨询！这个问题可能需要更详细的了解。建议您：\n1. 提供更多详细信息\n2. 或者联系人工客服\n3. 查看相关教程文档',
    '您好！我暂时无法完全理解您的问题。您可以尝试：\n1. 使用更简洁的语言描述\n2. 查看帮助中心的相关内容\n3. 提交工单给人工客服'
  ];
  
  return {
    content: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
    suggestions: ['提交工单', '查看帮助中心', '联系人工客服']
  };
};

export function AIChatBot({ initialOpen = false, onClose }: AIChatBotProps) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '您好！我是津脉智坊AI助手，有什么可以帮助您的吗？',
      timestamp: new Date(),
      suggestions: ['如何注册账号？', '会员有什么权益？', '如何提交工单？']
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // 添加用户消息
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // 模拟AI思考延迟
    setTimeout(() => {
      const response = generateResponse(content);
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  }, []);

  // 处理建议点击
  const handleSuggestionClick = useCallback((suggestion: string) => {
    sendMessage(suggestion);
  }, [sendMessage]);

  // 处理反馈
  const handleFeedback = useCallback((messageId: string, isHelpful: boolean) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isHelpful } : msg
    ));
    
    toast.success(isHelpful ? '感谢您的反馈！' : '我们会继续改进');
  }, []);

  // 转人工客服
  const handleTransferToHuman = useCallback(() => {
    const systemMessage: Message = {
      id: `system-${Date.now()}`,
      role: 'system',
      content: '正在为您转接人工客服，请稍候...',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, systemMessage]);
    
    // 模拟转接
    setTimeout(() => {
      const humanMessage: Message = {
        id: `human-${Date.now()}`,
        role: 'assistant',
        content: '您好！我是人工客服小明，很高兴为您服务。请问有什么可以帮助您的？',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, humanMessage]);
    }, 2000);
  }, []);

  // 清空对话
  const handleClearChat = useCallback(() => {
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: '对话已清空。我是津脉智坊AI助手，有什么可以帮助您的吗？',
      timestamp: new Date(),
      suggestions: ['如何注册账号？', '会员有什么权益？', '如何提交工单？']
    }]);
  }, []);

  // 导出对话
  const handleExportChat = useCallback(() => {
    const chatContent = messages
      .map(msg => `${msg.role === 'user' ? '用户' : 'AI助手'} (${msg.timestamp.toLocaleString()}):\n${msg.content}`)
      .join('\n\n---\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `客服对话_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('对话已导出');
  }, [messages]);

  // 处理按键
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  }, [inputMessage, sendMessage]);

  // 关闭聊天
  const handleClose = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl
          flex items-center justify-center transition-all
          ${isDark 
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500' 
            : 'bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600'
          }
        `}
      >
        <MessageCircle size={24} className="text-white" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        height: isMinimized ? 60 : 500,
        width: isMinimized ? 280 : 380
      }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`
        fixed bottom-6 right-6 z-50 rounded-2xl shadow-2xl overflow-hidden
        ${isDark 
          ? 'bg-slate-900 border border-slate-700' 
          : 'bg-white border border-gray-200'
        }
      `}
    >
      {/* 头部 */}
      <div className={`
        flex items-center justify-between px-4 py-3 border-b
        ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-100 bg-gray-50'}
      `}>
        <div className="flex items-center gap-3">
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center
            ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}
          `}>
            <Bot size={18} className="text-indigo-500" />
          </div>
          <div>
            <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
              AI智能助手
            </h3>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {isConnected ? '在线' : '离线'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
          >
            {isMinimized ? <Maximize2 size={16} className={isDark ? 'text-slate-400' : 'text-gray-500'} /> : <Minimize2 size={16} className={isDark ? 'text-slate-400' : 'text-gray-500'} />}
          </button>
          <button
            onClick={handleClose}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
          >
            <X size={16} className={isDark ? 'text-slate-400' : 'text-gray-500'} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* 消息区域 */}
          <div className={`
            h-80 overflow-y-auto p-4 space-y-4
            ${isDark ? 'bg-slate-900' : 'bg-white'}
          `}>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* 头像 */}
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                    ${message.role === 'user' 
                      ? (isDark ? 'bg-indigo-500' : 'bg-indigo-600')
                      : message.role === 'system'
                        ? (isDark ? 'bg-amber-500/20' : 'bg-amber-100')
                        : (isDark ? 'bg-slate-700' : 'bg-gray-100')
                    }
                  `}>
                    {message.role === 'user' ? (
                      <User size={14} className="text-white" />
                    ) : message.role === 'system' ? (
                      <Sparkles size={14} className="text-amber-500" />
                    ) : (
                      <Bot size={14} className={isDark ? 'text-slate-300' : 'text-gray-600'} />
                    )}
                  </div>

                  {/* 消息内容 */}
                  <div className="space-y-2">
                    <div className={`
                      px-3 py-2 rounded-2xl text-sm whitespace-pre-line
                      ${message.role === 'user'
                        ? (isDark ? 'bg-indigo-500 text-white' : 'bg-indigo-600 text-white')
                        : message.role === 'system'
                          ? (isDark ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30' : 'bg-amber-50 text-amber-800 border border-amber-200')
                          : (isDark ? 'bg-slate-800 text-slate-200' : 'bg-gray-100 text-gray-700')
                      }
                    `}>
                      {message.content}
                    </div>

                    {/* 建议按钮 */}
                    {message.suggestions && message.role === 'assistant' && (
                      <div className="flex flex-wrap gap-1.5">
                        {message.suggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className={`
                              px-2.5 py-1 rounded-full text-xs transition-colors
                              ${isDark 
                                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700' 
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                              }
                            `}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 反馈按钮 */}
                    {message.role === 'assistant' && !message.isHelpful !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>有帮助吗？</span>
                        <button
                          onClick={() => handleFeedback(message.id, true)}
                          className={`p-1 rounded transition-colors ${message.isHelpful === true ? 'text-emerald-500' : isDark ? 'text-slate-400 hover:text-emerald-400' : 'text-gray-400 hover:text-emerald-500'}`}
                        >
                          <ThumbsUp size={14} />
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, false)}
                          className={`p-1 rounded transition-colors ${message.isHelpful === false ? 'text-red-500' : isDark ? 'text-slate-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                        >
                          <ThumbsDown size={14} />
                        </button>
                      </div>
                    )}

                    {/* 时间戳 */}
                    <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* 正在输入指示器 */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex gap-2">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center
                    ${isDark ? 'bg-slate-700' : 'bg-gray-100'}
                  `}>
                    <Bot size={14} className={isDark ? 'text-slate-300' : 'text-gray-600'} />
                  </div>
                  <div className={`
                    px-4 py-3 rounded-2xl flex items-center gap-1
                    ${isDark ? 'bg-slate-800' : 'bg-gray-100'}
                  `}>
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 快捷操作栏 */}
          <div className={`
            px-4 py-2 border-t flex items-center gap-2
            ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-gray-100 bg-gray-50'}
          `}>
            <button
              onClick={handleTransferToHuman}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors
                ${isDark 
                  ? 'text-slate-300 hover:bg-slate-700' 
                  : 'text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              <Headphones size={14} />
              转人工
            </button>
            <button
              onClick={handleClearChat}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors
                ${isDark 
                  ? 'text-slate-300 hover:bg-slate-700' 
                  : 'text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              <X size={14} />
              清空
            </button>
            <button
              onClick={handleExportChat}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ml-auto
                ${isDark 
                  ? 'text-slate-300 hover:bg-slate-700' 
                  : 'text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              导出对话
            </button>
          </div>

          {/* 输入区域 */}
          <div className={`
            p-4 border-t
            ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-gray-100 bg-gray-50'}
          `}>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入您的问题..."
                disabled={isTyping}
                className={`
                  flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all
                  ${isDark 
                    ? 'bg-slate-800 text-white placeholder-slate-500 border border-slate-700 focus:border-indigo-500/50' 
                    : 'bg-white text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-indigo-300'
                  }
                `}
              />
              <button
                onClick={() => sendMessage(inputMessage)}
                disabled={!inputMessage.trim() || isTyping}
                className={`
                  w-10 h-10 rounded-xl flex items-center justify-center transition-all
                  ${inputMessage.trim() && !isTyping
                    ? (isDark 
                        ? 'bg-indigo-500 hover:bg-indigo-400 text-white' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      )
                    : (isDark 
                        ? 'bg-slate-700 text-slate-500' 
                        : 'bg-gray-200 text-gray-400'
                      )
                  }
                `}
              >
                {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
            <p className={`text-xs mt-2 text-center ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              按 Enter 发送，Shift + Enter 换行
            </p>
          </div>
        </>
      )}
    </motion.div>
  );
}

export default AIChatBot;
