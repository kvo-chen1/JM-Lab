import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import type { ChatMessage } from '@/pages/Community';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

interface ChatSectionProps {
  isDark: boolean;
  channelName: string;
  messages: ChatMessage[];
  onSendMessage: (message: Partial<ChatMessage>) => void;
  retrySendMessage?: (messageId: string) => void;
  onAddReaction?: (messageId: string, reaction: string) => void;
  onReplyToMessage?: (messageId: string, content: string) => void;
  currentUser: { name: string };
  unreadCount?: number;
  onMarkAsRead?: () => void;
}

const ChatSection: React.FC<ChatSectionProps> = memo(({
  isDark,
  channelName,
  messages,
  onSendMessage,
  retrySendMessage,
  onAddReaction,
  onReplyToMessage,
  currentUser,
  unreadCount = 0,
  onMarkAsRead
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; user: string } | null>(null);
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);

  // 优化滚动逻辑，使用requestAnimationFrame避免布局抖动
  useEffect(() => {
    if (scrollRef.current) {
      const scrollToBottom = () => {
        scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight;
      };
      
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(scrollToBottom);
      } else {
        scrollToBottom();
      }
    }
  }, [messages]);

  // 标记消息为已读
  useEffect(() => {
    if (unreadCount > 0 && onMarkAsRead && !hasMarkedAsRead) {
      // 当用户查看聊天时，标记消息为已读
      setTimeout(() => {
        onMarkAsRead();
        setHasMarkedAsRead(true);
      }, 500);
    }
  }, [unreadCount, onMarkAsRead, hasMarkedAsRead]);

  // 当消息更新时，重置已读状态
  useEffect(() => {
    setHasMarkedAsRead(false);
  }, [messages]);

  // 使用useCallback缓存函数，减少不必要的重新渲染
  const handleReplyClick = useCallback((messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message) {
      setReplyingTo({ id: messageId, user: message.user });
    }
  }, [messages]);

  // 使用useCallback缓存函数，减少不必要的重新渲染
  const handleSend = useCallback((message: Partial<ChatMessage>) => {
    if (replyingTo) {
      // 如果是回复消息，使用onReplyToMessage
      if (onReplyToMessage && message.text) {
        onReplyToMessage(replyingTo.id, message.text);
        setReplyingTo(null);
      }
    } else {
      // 否则使用普通发送
      onSendMessage(message);
    }
  }, [replyingTo, onReplyToMessage, onSendMessage]);

  // 使用useCallback缓存取消回复函数
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-56px)] lg:h-screen">
      {/* Header */}
      <div className={`h-14 md:h-12 flex items-center px-4 shadow-sm flex-shrink-0 ${isDark ? 'bg-gray-700 text-white shadow-black/20' : 'bg-white text-gray-900 shadow-gray-200'}`}>
        <div className="flex items-center gap-2">
            <i className="fas fa-hashtag text-gray-400"></i>
            <span className="font-bold">{channelName}</span>
            {unreadCount > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'}`}>
                    {unreadCount}
                </span>
            )}
            <span className="hidden sm:inline text-xs text-gray-500 ml-2 border-l pl-2 border-gray-500/30">欢迎来到 {channelName} 频道</span>
        </div>
        
        <div className="ml-auto flex items-center gap-3 md:gap-4">
             <button className="p-2 rounded-full hover:bg-gray-200/20 transition-colors text-gray-500 relative">
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && (
                    <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${isDark ? 'bg-blue-500' : 'bg-red-500'}`}></span>
                )}
             </button>
             <button className="p-2 rounded-full hover:bg-gray-200/20 transition-colors text-gray-500"><i className="fas fa-thumbtack"></i></button>
             <button className="p-2 rounded-full hover:bg-gray-200/20 transition-colors text-gray-500 lg:hidden"><i className="fas fa-users"></i></button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar flex flex-col pb-4 px-3"
      >
        <div className="mt-auto"> {/* Keep messages at bottom initially */}
            {messages.map((msg, index) => {
                const prevMsg = messages[index - 1];
                const isSequence = prevMsg && prevMsg.user === msg.user && (msg.createdAt || 0) - (prevMsg.createdAt || 0) < 60000;
                
                return (
                    <MessageBubble 
                        key={msg.id || index}
                        isDark={isDark}
                        message={msg}
                        isMe={msg.user === currentUser.name}
                        showAvatar={!isSequence}
                        retrySendMessage={retrySendMessage}
                        onAddReaction={onAddReaction}
                        onReplyToMessage={handleReplyClick}
                    />
                );
            })}
        </div>
      </div>

      {/* Input */}
      <div className="relative">
        {replyingTo && (
          <div className={`px-4 py-2 flex items-center justify-between ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            <div className="flex items-center gap-2">
              <i className="fas fa-reply"></i>
              <span>回复 @{replyingTo.user}</span>
            </div>
            <button 
              onClick={handleCancelReply}
              className="text-sm hover:underline"
            >
              取消
            </button>
          </div>
        )}
        <ChatInput 
          isDark={isDark}
          onSend={handleSend}
          placeholder={replyingTo ? `回复 @${replyingTo.user}...` : `发送消息到 #${channelName}`}
        />
      </div>
    </div>
  );
});

// 添加displayName便于调试
ChatSection.displayName = 'ChatSection';

export { ChatSection };
