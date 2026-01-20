import React, { useRef, useEffect, useState } from 'react';
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
}

export const ChatSection: React.FC<ChatSectionProps> = ({
  isDark,
  channelName,
  messages,
  onSendMessage,
  retrySendMessage,
  onAddReaction,
  onReplyToMessage,
  currentUser
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; user: string } | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 处理回复消息
  const handleReplyClick = (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message) {
      setReplyingTo({ id: messageId, user: message.user });
    }
  };

  // 处理发送消息
  const handleSend = (message: Partial<ChatMessage>) => {
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
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-56px)] lg:h-screen">
      {/* Header */}
      <div className={`h-14 md:h-12 flex items-center px-4 shadow-sm flex-shrink-0 ${isDark ? 'bg-gray-700 text-white shadow-black/20' : 'bg-white text-gray-900 shadow-gray-200'}`}>
        <div className="flex items-center gap-2">
            <i className="fas fa-hashtag text-gray-400"></i>
            <span className="font-bold">{channelName}</span>
            <span className="hidden sm:inline text-xs text-gray-500 ml-2 border-l pl-2 border-gray-500/30">欢迎来到 {channelName} 频道</span>
        </div>
        
        <div className="ml-auto flex items-center gap-3 md:gap-4 text-gray-500">
             <button className="p-2 rounded-full hover:bg-gray-200/20 transition-colors"><i className="fas fa-bell"></i></button>
             <button className="p-2 rounded-full hover:bg-gray-200/20 transition-colors"><i className="fas fa-thumbtack"></i></button>
             <button className="p-2 rounded-full hover:bg-gray-200/20 transition-colors lg:hidden"><i className="fas fa-users"></i></button>
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
              onClick={() => setReplyingTo(null)}
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
};
