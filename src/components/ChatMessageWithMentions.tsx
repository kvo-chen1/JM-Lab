/**
 * 聊天消息组件（支持@提及）
 * 用于显示和发送聊天消息
 */

import React, { useRef, useState, useEffect } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';
import { MentionInput, MentionInputRef } from './MentionInput';
import { MentionText } from './MentionText';
import Avatar from '@/components/ui/Avatar';
import { mentionService, MentionNotification } from '@/services/mentionService';
import { useAuth } from '@/contexts/authContext';
import { toast } from 'sonner';
import { formatDistanceToNow, isToday, isYesterday } from '@/utils/dateUtils';

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  createdAt: string;
  type?: 'text' | 'image' | 'file';
  isRead?: boolean;
}

interface ChatMessageWithMentionsProps {
  communityId: string;
  channelId: string;
  currentUserId: string;
}

// 聊天输入组件
export const ChatInputWithMentions: React.FC<{
  communityId: string;
  channelId: string;
  onSend: (content: string, mentionedUserIds: string[]) => Promise<void>;
  disabled?: boolean;
}> = ({ communityId, onSend, disabled }) => {
  const mentionInputRef = useRef<MentionInputRef>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    const content = mentionInputRef.current?.getContent() || '';
    if (!content.trim()) return;

    const mentionedUserIds = mentionInputRef.current?.getMentionedUserIds() || [];

    setIsSending(true);
    try {
      await onSend(content, mentionedUserIds);
      mentionInputRef.current?.setContent('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('发送失败，请重试');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <MentionInput
            ref={mentionInputRef}
            communityId={communityId}
            placeholder="输入消息... 使用 @ 提及成员"
            maxLength={1000}
            rows={1}
            className="min-h-[44px] py-2.5"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="添加表情"
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="添加附件"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || disabled}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="发送"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-400">
        按 Enter 发送，Shift + Enter 换行
      </p>
    </div>
  );
};

// 单条消息组件
export const ChatMessageItem: React.FC<{
  message: ChatMessage;
  isCurrentUser: boolean;
  showAvatar?: boolean;
}> = ({ message, isCurrentUser, showAvatar = true }) => {
  return (
    <div
      className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''} ${
        showAvatar ? 'mb-4' : 'mb-1'
      }`}
    >
      {/* 头像 */}
      {showAvatar ? (
        <Avatar
          src={message.senderAvatar}
          alt={message.senderName}
          size="medium"
        >
          {message.senderName[0]?.toUpperCase()}
        </Avatar>
      ) : (
        <div className="w-10" /> // 占位保持对齐
      )}

      {/* 消息内容 */}
      <div className={`max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        {/* 发送者名称和时间 */}
        {showAvatar && (
          <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {message.senderName}
            </span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(message.createdAt)}
            </span>
          </div>
        )}

        {/* 消息气泡 */}
        <div
          className={`px-4 py-2 rounded-2xl ${
            isCurrentUser
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
          }`}
        >
          {message.type === 'text' || !message.type ? (
            <MentionText
              content={message.content}
              className={isCurrentUser ? 'text-white' : ''}
              mentionClassName={
                isCurrentUser
                  ? 'text-blue-200 hover:text-white underline cursor-pointer'
                  : 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium'
              }
              onMentionClick={(username) => {
                console.log('Clicked mention in chat:', username);
              }}
            />
          ) : message.type === 'image' ? (
            <img
              src={message.content}
              alt="Shared image"
              className="max-w-full rounded-lg"
            />
          ) : (
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              <span className="underline cursor-pointer">{message.content}</span>
            </div>
          )}
        </div>

        {/* 已读状态 */}
        {isCurrentUser && message.isRead && (
          <span className="text-xs text-gray-400 mt-1">已读</span>
        )}
      </div>
    </div>
  );
};

// 消息分组（按日期）
const groupMessagesByDate = (messages: ChatMessage[]) => {
  const groups: { date: string; messages: ChatMessage[] }[] = [];
  let currentGroup: ChatMessage[] = [];
  let currentDate: string | null = null;

  messages.forEach((message) => {
    const messageDate = new Date(message.createdAt).toDateString();
    
    if (messageDate !== currentDate) {
      if (currentGroup.length > 0) {
        groups.push({ date: currentDate!, messages: currentGroup });
      }
      currentDate = messageDate;
      currentGroup = [message];
    } else {
      currentGroup.push(message);
    }
  });

  if (currentGroup.length > 0 && currentDate) {
    groups.push({ date: currentDate, messages: currentGroup });
  }

  return groups;
};

// 格式化日期分组标签
const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return '今天';
  if (isYesterday(date)) return '昨天';
  return date.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
};

// 主聊天组件
export const ChatMessageWithMentions: React.FC<ChatMessageWithMentionsProps> = ({
  communityId,
  channelId,
  currentUserId,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 加载消息
  useEffect(() => {
    // 这里应该从服务加载历史消息
    // 示例数据
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        // 模拟API调用
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // 示例消息数据
        const sampleMessages: ChatMessage[] = [
          {
            id: '1',
            content: '大家好！欢迎加入这个社群 @张三 @李四',
            senderId: 'user1',
            senderName: '管理员',
            senderAvatar: '',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            type: 'text',
          },
          {
            id: '2',
            content: '谢谢！很高兴加入 @管理员',
            senderId: 'user2',
            senderName: '张三',
            senderAvatar: '',
            createdAt: new Date(Date.now() - 3000000).toISOString(),
            type: 'text',
          },
          {
            id: '3',
            content: '我也来了！',
            senderId: currentUserId,
            senderName: '我',
            senderAvatar: '',
            createdAt: new Date(Date.now() - 2400000).toISOString(),
            type: 'text',
            isRead: true,
          },
        ];
        
        setMessages(sampleMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [channelId, currentUserId]);

  // 发送消息
  const handleSendMessage = async (content: string, mentionedUserIds: string[]) => {
    if (!user?.id) {
      toast.error('请先登录');
      return;
    }

    // 创建新消息
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      senderId: currentUserId,
      senderName: user.username || '我',
      senderAvatar: user.avatar_url,
      createdAt: new Date().toISOString(),
      type: 'text',
    };

    // 添加到消息列表
    setMessages((prev) => [...prev, newMessage]);

    // 处理@提及
    if (mentionedUserIds.length > 0) {
      try {
        await mentionService.processContentMentions(
          content,
          user.id,
          'chat',
          newMessage.id,
          'message',
          communityId
        );
      } catch (error) {
        console.error('Error processing mentions:', error);
      }
    }

    // 滚动到底部
    setTimeout(scrollToBottom, 100);
  };

  // 订阅新的@提及
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = mentionService.subscribeToMentions(user.id, (mention) => {
      if (mention.mentionType === 'chat') {
        toast.info(`${mention.senderUsername} 在聊天中提到了你`, {
          action: {
            label: '查看',
            onClick: () => {
              // 跳转到相关聊天
              console.log('Navigate to chat:', mention.contentId);
            },
          },
        });
      }
    });

    return () => unsubscribe();
  }, [user?.id]);

  // 按日期分组的消息
  const messageGroups = groupMessagesByDate(messages);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messageGroups.map((group) => (
          <div key={group.date} className="space-y-4">
            {/* 日期分隔线 */}
            <div className="flex items-center justify-center">
              <div className="px-4 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400">
                {formatDateLabel(group.date)}
              </div>
            </div>

            {/* 消息 */}
            {group.messages.map((message, index) => {
              const isCurrentUser = message.senderId === currentUserId;
              const prevMessage = index > 0 ? group.messages[index - 1] : null;
              const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;

              return (
                <ChatMessageItem
                  key={message.id}
                  message={message}
                  isCurrentUser={isCurrentUser}
                  showAvatar={showAvatar}
                />
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <ChatInputWithMentions
        communityId={communityId}
        channelId={channelId}
        onSend={handleSendMessage}
      />
    </div>
  );
};

export default ChatMessageWithMentions;
