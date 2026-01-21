import React, { createContext, useState, ReactNode, useEffect, useContext } from 'react';
import { AuthContext } from './authContext';
import apiClient from '@/lib/apiClient';

export interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: number;
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
        const res = await apiClient.get('/api/messages/unread');
        if (res.data?.ok) {
          const counts: Record<string, number> = {};
          res.data.data.forEach((item: any) => {
            counts[item.sender_id] = item.count;
          });
          setUnreadCounts(counts);
        }
      } catch (e) {
        console.error('获取未读消息失败', e);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 10000); // 每10秒刷新一次
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
        const res = await apiClient.get(`/api/messages/${currentChatFriendId}?limit=50`);
        if (res.data?.ok) {
          setMessages(res.data.data);
          // 标记为已读
          await apiClient.post('/api/messages/read', { friendId: currentChatFriendId });
          // 更新未读计数
          setUnreadCounts(prev => ({ ...prev, [currentChatFriendId]: 0 }));
        }
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
        // 使用 offset=0, limit=50 获取最新消息
        const res = await apiClient.get(`/api/messages/${currentChatFriendId}?limit=50`);
        if (res.data?.ok) {
          // 这里简单替换，实际可以用更智能的合并
          setMessages(res.data.data);
          // 标记为已读
          await apiClient.post('/api/messages/read', { friendId: currentChatFriendId });
        }
      } catch (e) {
        console.error('轮询消息失败', e);
      }
    }, 3000); // 聊天时每3秒刷新一次

    return () => clearInterval(interval);
  }, [currentUser, currentChatFriendId]);

  const sendMessage = async (content: string): Promise<boolean> => {
    if (!currentUser || !currentChatFriendId) return false;
    
    try {
      const res = await apiClient.post('/api/messages/send', {
        friendId: currentChatFriendId,
        content
      });
      
      if (res.data?.ok) {
        // 乐观更新
        const newMsg: Message = res.data.data;
        setMessages(prev => [...prev, newMsg]);
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
    if (currentChatFriendId) {
        // 这里只是为了暴露给外部手动刷新，实际上useEffect里的轮询已经处理了
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
