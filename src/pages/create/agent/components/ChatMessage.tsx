import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore } from '../hooks/useAgentStore';
import { AgentMessage, AGENT_CONFIG } from '../types/agent';
import AgentAvatar from './AgentAvatar';
import StyleSelector from './StyleSelector';
import ThinkingProcess from './ThinkingProcess';
import { ChevronDown, ChevronUp, Lightbulb, Wand2 } from 'lucide-react';

interface ChatMessageProps {
  message: AgentMessage;
  isLast?: boolean;
}

export default function ChatMessage({ message, isLast = false }: ChatMessageProps) {
  const { isDark } = useTheme();
  const { setShowThinkingProcess, showThinkingProcess } = useAgentStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const isUser = message.role === 'user';
  const isDirector = message.role === 'director';
  const isDesigner = message.role === 'designer';

  // 动画配置
  const messageVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 350,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // 渲染消息内容
  const renderContent = () => {
    switch (message.type) {
      case 'style-options':
        return (
          <div className="space-y-4">
            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
              {message.content.split('\n').map((line, index) => (
                <p key={index} className="mb-1 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
            <StyleSelector />
            {message.metadata?.thinking && (
              <ThinkingProcess thinking={message.metadata.thinking} />
            )}
          </div>
        );

      case 'thinking':
        return (
          <div className="space-y-3">
            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
              {message.content.split('\n').map((line, index) => (
                <p key={index} className="mb-1 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
            {message.metadata?.thinking && (
              <ThinkingProcess thinking={message.metadata.thinking} />
            )}
          </div>
        );

      case 'image':
        return (
          <div className="space-y-3">
            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
              {message.content.split('\n').map((line, index) => (
                <p key={index} className="mb-1 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
            {message.metadata?.images && (
              <div className="grid grid-cols-2 gap-2">
                {message.metadata.images.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-lg overflow-hidden border-2 border-transparent hover:border-[#C02C38] transition-colors cursor-pointer"
                  >
                    <img 
                      src={image} 
                      alt={`Generated ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );

      case 'satisfaction-check':
        return (
          <div className="space-y-4">
            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
              {message.content.split('\n').map((line, index) => (
                <p key={index} className="mb-1 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium shadow-lg shadow-green-500/25"
              >
                ✓ 满意，继续下一步
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium ${
                  isDark 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ✕ 差点意思，我要修改
              </motion.button>
            </div>
          </div>
        );

      case 'derivative-options':
        return (
          <div className="space-y-4">
            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
              {message.content.split('\n').map((line, index) => (
                <p key={index} className="mb-1 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
            {message.metadata?.derivativeOptions && (
              <div className="space-y-2">
                {message.metadata.derivativeOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                      isDark 
                        ? 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700' 
                        : 'bg-white hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <Wand2 className="w-5 h-5 text-[#C02C38]" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {option.title}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {option.description}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        );

      case 'text':
      default:
        return (
          <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
            {message.content.split('\n').map((line, index) => {
              // 处理标题
              if (line.startsWith('**') && line.endsWith('**')) {
                return (
                  <p key={index} className={`font-bold mt-3 mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {line.replace(/\*\*/g, '')}
                  </p>
                );
              }
              // 处理列表项
              if (line.trim().startsWith('•')) {
                return (
                  <p key={index} className={`ml-4 mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {line}
                  </p>
                );
              }
              // 处理数字列表
              if (/^\d+\./.test(line.trim())) {
                return (
                  <p key={index} className={`ml-4 mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {line}
                  </p>
                );
              }
              return (
                <p key={index} className={`mb-1 last:mb-0 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {line}
                </p>
              );
            })}
          </div>
        );
    }
  };

  // 获取气泡样式
  const getBubbleStyle = () => {
    if (isUser) {
      return `bg-gradient-to-br from-[#C02C38] to-[#E85D75] text-white rounded-2xl rounded-tr-sm`;
    }
    if (isDirector) {
      return `${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl rounded-tl-sm`;
    }
    if (isDesigner) {
      return `${isDark ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} border rounded-2xl rounded-tl-sm`;
    }
    return `${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-2xl rounded-tl-sm`;
  };

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <AgentAvatar role={message.role} size="md" />
      </div>

      {/* Message Content */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
        {/* Agent Name */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${
              isDirector ? 'text-amber-500' : isDesigner ? 'text-cyan-500' : 'text-gray-500'
            }`}>
              {isDirector ? AGENT_CONFIG.director.name : isDesigner ? AGENT_CONFIG.designer.name : '系统'}
            </span>
            {message.metadata?.thinking && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors ${
                  isDark 
                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <Lightbulb className="w-3 h-3" />
                思考过程
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        )}

        {/* Bubble */}
        <div className={`px-4 py-3 shadow-sm ${getBubbleStyle()}`}>
          {renderContent()}
        </div>

        {/* Timestamp */}
        <span className={`text-xs mt-1 px-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}
