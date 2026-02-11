import React, { createContext, useState, ReactNode, useEffect, useContext } from 'react';
import { AuthContext } from './authContext';
import { 
  getDirectMessages, 
  sendDirectMessage as sendSupabaseMessage,
  markMessagesAsRead,
  getUnreadMessageCounts
} from '@/services/messageService';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatContextType {
  currentChatFriendId: string | null;
  setCurrentChatFriendId: (friendId: string | null) => void;
  messages: Message[];
  sendMessage: (content: string) => Promise<boolean>;
  loading: boolean;
  unreadCounts: Record<string, number>;
  refreshMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.user;
  
  const [currentChatFriendId, setCurrentChatFriendId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // 自动刷新未读消息计数
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchUnread = async () => {
      try {
        const counts = await getUnreadMessageCounts(currentUser.id);
        setUnreadCounts(counts);
      } catch (e) {
        console.error('获取未读消息失败', e);
      }
    };

    fetchUnread();
    // 减少轮询频率以降低 Supabase 出口流量使用
    const interval = setInterval(fetchUnread, 120000); // 每2分钟刷新一次
    return () => clearInterval(interval);
  }, [currentUser]);

  // 当选中聊天对象时，加载消息
  useEffect(() => {
    if (!currentUser || !currentChatFriendId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const data = await getDirectMessages(currentUser.id, currentChatFriendId, 50);
        setMessages(data);
        // 标记为已读
        await markMessagesAsRead(currentUser.id, currentChatFriendId);
        // 更新未读计数
        setUnreadCounts(prev => ({ ...prev, [currentChatFriendId]: 0 }));
      } catch (e) {
        console.error('获取消息失败', e);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    
    // 轮询当前聊天的消息
    const interval = setInterval(async () => {
      try {
        const newMessages = await getDirectMessages(currentUser.id, currentChatFriendId, 50);
        
        // 智能合并消息，避免闪烁
        setMessages(prevMessages => {
          const existingIds = new Set(prevMessages.map(m => m.id));
          const newOnlyMessages = newMessages.filter((msg: Message) => !existingIds.has(msg.id));
          
          if (newOnlyMessages.length > 0) {
            // 有新消息，合并
            return [...prevMessages, ...newOnlyMessages];
          }
          return prevMessages;
        });
        
        // 只在有新消息时标记为已读
        if (newMessages.length > messages.length) {
          await markMessagesAsRead(currentUser.id, currentChatFriendId);
        }
      } catch (e) {
        console.error('轮询消息失败', e);
      }
    }, 30000); // 减少轮询频率到30秒，降低 Supabase 出口流量使用

    return () => clearInterval(interval);
  }, [currentUser, currentChatFriendId]);

  const sendMessage = async (content: string): Promise<boolean> => {
    if (!currentUser || !currentChatFriendId) return false;

    try {
      const result = await sendSupabaseMessage(currentUser.id, currentChatFriendId, content);

      if (result.success && result.data) {
        // 乐观更新
        setMessages(prev => [...prev, result.data!]);
        return true;
      }
      return false;
    } catch (e) {
      console.error('发送消息失败', e);
      return false;
    }
  };

  const refreshMessages = () => {
    // 触发重新加载
    if (currentChatFriendId && currentUser) {
      getDirectMessages(currentUser.id, currentChatFriendId, 50)
        .then(data => setMessages(data))
        .catch(e => console.error('刷新消息失败', e));
    }
  };

  return (
    <ChatContext.Provider value={{
      currentChatFriendId,
      setCurrentChatFriendId,
      messages,
      sendMessage,
      loading,
      unreadCounts,
      refreshMessages
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
