// src/components/chat/MessageBubble.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

export type MessageType = 'user' | 'assistant' | 'error' | 'system';

export interface MessageBubbleProps {
  type: MessageType;
  content: string;
  timestamp?: string;
  avatar?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  onRetry?: () => void;
}

// 津小脉头像组件
const JinXiaoMaiAvatar: React.FC = () => (
  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
    <span className="text-white font-bold text-sm">津</span>
  </div>
);

// 用户头像组件
const UserAvatar: React.FC = () => (
  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
    <i className="fas fa-user text-white text-sm"></i>
  </div>
);

// 错误图标组件
const ErrorIcon: React.FC = () => (
  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg">
    <i className="fas fa-exclamation text-white text-sm"></i>
  </div>
);

// 加载动画组件
const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1 px-2">
    <motion.div
      className="w-2 h-2 rounded-full bg-indigo-500"
      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
    />
    <motion.div
      className="w-2 h-2 rounded-full bg-indigo-500"
      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
    />
    <motion.div
      className="w-2 h-2 rounded-full bg-indigo-500"
      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
    />
  </div>
);

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  type,
  content,
  timestamp,
  avatar,
  isLoading = false,
  className,
  onRetry,
}) => {
  const isUser = type === 'user';
  const isError = type === 'error';
  const isAssistant = type === 'assistant';

  // 动画配置
  const bubbleVariants = {
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
        damping: 25,
      }
    },
  };

  // 渲染头像
  const renderAvatar = () => {
    if (avatar) return avatar;
    if (isUser) return <UserAvatar />;
    if (isError) return <ErrorIcon />;
    return <JinXiaoMaiAvatar />;
  };

  // 渲染消息内容
  const renderContent = () => {
    if (isLoading) {
      return <TypingIndicator />;
    }

    if (isError) {
      return (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <i className="fas fa-exclamation-circle text-red-500 mt-1"></i>
            <div className="flex-1">
              <p className="font-medium text-red-900 mb-1">抱歉，我暂时无法回答你的问题</p>
              <p className="text-sm text-red-700">{content}</p>
            </div>
          </div>
          {onRetry && (
            <div className="flex gap-2 pl-7">
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
              >
                <i className="fas fa-redo text-xs"></i>
                重试
              </button>
              <button
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <i className="fas fa-robot text-xs"></i>
                切换模型
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="prose prose-sm max-w-none">
        {content.split('\n').map((line, index) => (
          <p key={index} className={clsx(
            "mb-2 last:mb-0",
            isUser ? "text-white" : "text-gray-800"
          )}>
            {line}
          </p>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      className={clsx(
        "flex gap-3 mb-6",
        isUser ? "flex-row-reverse" : "flex-row",
        className
      )}
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 头像 */}
      <div className="flex-shrink-0">
        {renderAvatar()}
      </div>

      {/* 消息内容区域 */}
      <div className={clsx(
        "flex flex-col max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        {/* 气泡 */}
        <div
          className={clsx(
            "relative px-5 py-3 shadow-md",
            isUser && [
              "bg-gradient-to-br from-indigo-500 to-purple-600",
              "rounded-2xl rounded-tr-sm",
              "text-white",
            ],
            isAssistant && [
              "bg-gray-100",
              "rounded-2xl rounded-tl-sm",
              "text-gray-800",
              "border border-gray-200",
            ],
            isError && [
              "bg-gradient-to-br from-red-50 to-red-100",
              "rounded-2xl rounded-tl-sm",
              "border border-red-200",
              "w-full min-w-[300px]",
            ],
            isLoading && "py-4"
          )}
        >
          {renderContent()}
        </div>

        {/* 时间戳 */}
        {timestamp && !isLoading && (
          <span className="text-xs text-gray-400 mt-1.5 px-1">
            {timestamp}
          </span>
        )}
      </div>
    </motion.div>
  );
};

// 消息列表容器组件
export interface MessageListProps {
  children: React.ReactNode;
  className?: string;
}

export const MessageList: React.FC<MessageListProps> = ({ children, className }) => {
  return (
    <div className={clsx("flex flex-col space-y-2 p-4", className)}>
      {children}
    </div>
  );
};

export default MessageBubble;
