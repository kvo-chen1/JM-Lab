// 对话面板组件

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { ConversationMessage } from '../types';
import {
  User,
  Bot,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';

interface ConversationPanelProps {
  messages: ConversationMessage[];
}

export const ConversationPanel: React.FC<ConversationPanelProps> = ({
  messages,
}) => {
  const { isDark } = useTheme();
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  const toggleExpand = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (messages.length === 0) {
    return (
      <div className={`
        flex flex-col items-center justify-center py-12
        ${isDark ? 'text-gray-500' : 'text-gray-400'}
      `}>
        <Sparkles className="w-10 h-10 mb-3 opacity-50" />
        <p className="text-sm">暂无对话记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const isUser = message.role === 'user';
        const isExpanded = expandedMessages.has(message.id);
        const hasAnalysis = message.type === 'analysis' && message.metadata?.analysis;
        const hasImage = message.type === 'image' && message.metadata?.imageUrl;

        return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
              flex gap-3
              ${isUser ? 'flex-row-reverse' : 'flex-row'}
            `}
          >
            {/* 头像 */}
            <div className={`
              flex-shrink-0 w-8 h-8 rounded-full
              flex items-center justify-center
              ${isUser
                ? isDark
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700'
                  : 'bg-gradient-to-br from-blue-500 to-blue-600'
                : isDark
                  ? 'bg-gradient-to-br from-[#C02C38] to-[#E85D75]'
                  : 'bg-gradient-to-br from-[#C02C38] to-[#E85D75]'
              }
            `}>
              {isUser ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>

            {/* 消息内容 */}
            <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
              {/* 消息气泡 */}
              <div className={`
                inline-block max-w-[85%] rounded-2xl px-4 py-3
                text-left
                ${isUser
                  ? isDark
                    ? 'bg-blue-600/20 text-blue-100'
                    : 'bg-blue-50 text-blue-900'
                  : isDark
                    ? 'bg-[#1a1f1a] text-gray-100'
                    : 'bg-gray-100 text-gray-900'
                }
              `}>
                {/* 消息文本 */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>

                {/* 图片 */}
                {hasImage && (
                  <div className="mt-3 rounded-xl overflow-hidden">
                    <img
                      src={message.metadata?.imageUrl}
                      alt="生成的图片"
                      className="w-full h-auto"
                    />
                  </div>
                )}

                {/* 分析内容（可折叠） */}
                {hasAnalysis && (
                  <div className="mt-3">
                    <button
                      onClick={() => toggleExpand(message.id)}
                      className={`
                        flex items-center gap-1 text-xs
                        ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}
                      `}
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>图片分析</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className={`
                            mt-2 p-3 rounded-lg text-xs
                            ${isDark ? 'bg-black/30 text-gray-400' : 'bg-white/50 text-gray-600'}
                          `}
                        >
                          {message.metadata?.analysis}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* 时间戳 */}
              <span className={`
                block mt-1 text-xs
                ${isDark ? 'text-gray-600' : 'text-gray-400'}
              `}>
                {formatTime(message.timestamp)}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ConversationPanel;
