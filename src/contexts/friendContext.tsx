import React, { createContext, useState, ReactNode, useEffect, useContext } from 'react';
import { AuthContext, User as AuthUser } from './authContext';
import apiClient from '@/lib/apiClient';

// 好友请求状态类型
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

// 用户状态类型
export type UserStatus = 'online' | 'offline' | 'away';

// 用户类型（包含状态信息）
export interface User extends AuthUser {
  status?: UserStatus;
  last_seen?: string;
}

// 好友请求类型
export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: FriendRequestStatus;
  created_at: string;
  updated_at: string;
  // 扩展字段，用于存储发送者和接收者的用户信息
  sender?: User;
  receiver?: User;
}

// 好友关系类型
export interface Friend {
  id: string; // 实际上可能是 (user_id, friend_id) 组合键，但在前端我们主要用 friend_id 来操作
  user_id: string;
  friend_id: string;
  user_note?: string;
  friend_note?: string;
  created_at: string;
  updated_at?: string;
  // 扩展字段，用于存储好友的用户信息
  friend?: User;
}

// 好友上下文类型定义
export interface FriendContextType {
  // 好友搜索功能
  searchUsers: (query: string) => Promise<User[]>;
  
  // 好友请求功能
  sendFriendRequest: (userId: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<boolean>;
  rejectFriendRequest: (requestId: string) => Promise<boolean>;
  getFriendRequests: () => Promise<FriendRequest[]>;
  friendRequests: FriendRequest[];
  
  // 好友列表功能
  getFriends: () => Promise<Friend[]>;
  friends: Friend[];
  
  // 好友状态功能
  updateUserStatus: (status: UserStatus) => Promise<boolean>;
  friendStatuses: Record<string, UserStatus>;
  
  // 好友管理功能
  deleteFriend: (friendId: string) => Promise<boolean>;
  setFriendNote: (friendId: string, note: string) => Promise<boolean>;
  
  // 加载状态
  loading: boolean;
  error: string | null;
}

// 创建好友上下文
const FriendContext = createContext<FriendContextType | undefined>(undefined);

// 好友提供者组件
export const FriendProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.user;
  
  // 状态管理
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendStatuses, setFriendStatuses] = useState<Record<string, UserStatus>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化好友系统
  useEffect(() => {
    let cleanupFunction: (() => void) | undefined;
    
    if (currentUser) {
      // 更新用户状态为在线
      updateUserStatus('online');
      
      // 加载好友列表和请求
      getFriends();
      getFriendRequests();
      
      // 监听好友状态变化
      cleanupFunction = subscribeToFriendStatuses();
    }
    
    // 组件卸载时更新状态为离线
    return () => {
      if (currentUser) {
        updateUserStatus('offline');
      }
      // 执行清理函数
      if (cleanupFunction) {
        cleanupFunction();
      }
    };
  }, [currentUser]);

  // 搜索用户
  const searchUsers = async (query: string): Promise<User[]> => {
    if (!query || !currentUser) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(`/api/friends/search?q=${encodeURIComponent(query)}`);
      if (response.data?.ok) {
        return response.data.data;
      }
      return [];
    } catch (err: any) {
      setError('搜索用户失败');
      console.error('搜索用户失败:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 发送好友请求
  const sendFriendRequest = async (userId: string): Promise<boolean> => {
    if (!currentUser) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post('/api/friends/request', { userId });
      if (response.data?.ok) {
        return true;
      }
      if (response.data?.error === 'ALREADY_FRIENDS') {
        setError('已经是好友了');
      } else {
        setError(response.data?.message || '发送请求失败');
      }
      return false;
    } catch (err: any) {
      setError('发送好友请求失败');
      console.error('发送好友请求失败:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 接受好友请求
  const acceptFriendRequest = async (requestId: string): Promise<boolean> => {
    if (!currentUser) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post('/api/friends/accept', { requestId });
      if (response.data?.ok) {
        // 更新本地状态
        setFriendRequests(prev => prev.filter(r => r.id !== requestId));
        getFriends();
        return true;
      }
      return false;
    } catch (err) {
      setError('接受好友请求失败');
      console.error('接受好友请求失败:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 拒绝好友请求
  const rejectFriendRequest = async (requestId: string): Promise<boolean> => {
    if (!currentUser) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post('/api/friends/reject', { requestId });
      if (response.data?.ok) {
        setFriendRequests(prev => prev.filter(r => r.id !== requestId));
        return true;
      }
      return false;
    } catch (err) {
      setError('拒绝好友请求失败');
      console.error('拒绝好友请求失败:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 获取好友请求
  const getFriendRequests = async (): Promise<FriendRequest[]> => {
    if (!currentUser) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get('/api/friends/requests');
      if (response.data?.ok) {
        const requests = response.data.data;
        setFriendRequests(requests);
        return requests;
      }
      return [];
    } catch (err) {
      setError('获取好友请求失败');
      console.error('获取好友请求失败:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 获取好友列表
  const getFriends = async (): Promise<Friend[]> => {
    if (!currentUser) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get('/api/friends/list');
      if (response.data?.ok) {
        const friendList = response.data.data;
        setFriends(friendList);
        return friendList;
      }
      return [];
    } catch (err) {
      setError('获取好友列表失败');
      console.error('获取好友列表失败:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 更新用户状态
  const updateUserStatus = async (status: UserStatus): Promise<boolean> => {
    if (!currentUser) return false;
    
    try {
      // 我们可以静默更新，不显示loading
      await apiClient.post('/api/friends/status', { status });
      return true;
    } catch (err) {
      console.error('更新用户状态失败:', err);
      return false;
    }
  };

  // 订阅好友状态变化
  const subscribeToFriendStatuses = (): (() => void) | undefined => {
    // 简单轮询
    const interval = setInterval(() => {
      // 重新获取好友列表以更新状态
      getFriends();
    }, 30000); // 每30秒更新一次
    
    return () => clearInterval(interval);
  };

  // 删除好友
  const deleteFriend = async (friendId: string): Promise<boolean> => {
    if (!currentUser) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.delete(`/api/friends/${friendId}`);
      if (response.data?.ok) {
        setFriends(prev => prev.filter(f => f.friend_id !== friendId));
        return true;
      }
      return false;
    } catch (err) {
      setError('删除好友失败');
      console.error('删除好友失败:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 设置好友备注名
  const setFriendNote = async (friendId: string, note: string): Promise<boolean> => {
    if (!currentUser) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post('/api/friends/note', { friendId, note });
      if (response.data?.ok) {
        setFriends(prev => prev.map(f => 
          f.friend_id === friendId ? { ...f, user_note: note } : f
        ));
        return true;
      }
      return false;
    } catch (err) {
      setError('设置好友备注失败');
      console.error('设置好友备注失败:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 上下文值
  const contextValue: FriendContextType = {
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriendRequests,
    friendRequests,
    getFriends,
    friends,
    updateUserStatus,
    friendStatuses,
    deleteFriend,
    setFriendNote,
    loading,
    error
  };

  return (
    <FriendContext.Provider value={contextValue}>
      {children}
    </FriendContext.Provider>
  );
};

// 自定义钩子，用于访问好友上下文
export const useFriendContext = () => {
  const context = useContext(FriendContext);
  if (context === undefined) {
    throw new Error('useFriendContext must be used within a FriendProvider');
  }
  return context;
};
