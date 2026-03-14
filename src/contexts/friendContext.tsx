import React, { createContext, useState, ReactNode, useEffect, useContext } from 'react';
import { AuthContext, User as AuthUser } from './authContext';
import { supabase } from '@/lib/supabase';
import { 
  sendFriendRequest as sendSupabaseFriendRequest,
  acceptFriendRequest as acceptSupabaseFriendRequest,
  rejectFriendRequest as rejectSupabaseFriendRequest,
  getFriendRequests as getSupabaseFriendRequests
} from '@/services/messageService';

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
  id: string;
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
    let statusTimer: NodeJS.Timeout | null = null;
    
    if (currentUser) {
      // 更新用户状态为在线（使用防抖）
      statusTimer = setTimeout(() => {
        updateUserStatus('online');
      }, 1000);
      
      // 加载好友列表和请求（使用防抖）
      setTimeout(() => {
        getFriends();
        getFriendRequests();
      }, 500);
      
      // 监听好友状态变化
      cleanupFunction = subscribeToFriendStatuses();
    }
    
    // 组件卸载时更新状态为离线
    return () => {
      if (statusTimer) {
        clearTimeout(statusTimer);
      }
      if (currentUser) {
        // 延迟执行离线状态更新，避免频繁切换
        setTimeout(() => {
          updateUserStatus('offline');
        }, 500);
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
      const { data, error: searchError } = await supabase
        .from('users')
        .select('id, username, email, avatar_url, bio')
        .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
        .neq('id', currentUser.id)
        .limit(20);
      
      if (searchError) {
        console.error('搜索用户失败:', searchError);
        return [];
      }
      
      return (data || []).map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        avatar: u.avatar_url,
        bio: u.bio,
        membershipLevel: 'free' as const,
        membershipStatus: 'active' as const
      })) as User[];
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
      await sendSupabaseFriendRequest(currentUser.id, userId);
      return true;
    } catch (err: any) {
      if (err.message === 'ALREADY_FRIENDS') {
        setError('已经是好友了');
      } else {
        setError(err.message || '发送请求失败');
      }
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
      const success = await acceptSupabaseFriendRequest(requestId);
      if (success) {
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
      const success = await rejectSupabaseFriendRequest(requestId);
      if (success) {
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
      const requests = await getSupabaseFriendRequests(currentUser.id);
      
      // 获取发送者信息
      const requestsWithSender = await Promise.all(
        requests.map(async (req) => {
          const { data: sender } = await supabase
            .from('users')
            .select('id, username, email, avatar_url')
            .eq('id', req.sender_id)
            .single();
          return {
            ...req,
            updated_at: req.updated_at || req.created_at,
            sender: sender ? {
              id: sender.id,
              username: sender.username,
              email: sender.email,
              avatar: sender.avatar_url,
              membershipLevel: 'free' as const,
              membershipStatus: 'active' as const
            } : undefined
          };
        })
      );
      
      setFriendRequests(requestsWithSender as FriendRequest[]);
      return requestsWithSender as FriendRequest[];
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
      // 从 friend_requests 表获取已接受的好友关系
      const { data: friendRelations, error: friendError } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .eq('status', 'accepted');
      
      if (friendError) {
        console.error('获取好友列表失败:', friendError);
        return [];
      }
      
      // 转换为 Friend 格式并获取好友信息
      const friendsList: Friend[] = await Promise.all(
        (friendRelations || []).map(async (relation) => {
          const friendId = relation.sender_id === currentUser.id 
            ? relation.receiver_id 
            : relation.sender_id;
          
          const { data: friendUser } = await supabase
            .from('users')
            .select('id, username, email, avatar_url')
            .eq('id', friendId)
            .single();
          
          return {
            id: relation.id,
            user_id: currentUser.id,
            friend_id: friendId,
            created_at: relation.created_at,
            updated_at: relation.updated_at,
            friend: friendUser ? {
              id: friendUser.id,
              username: friendUser.username,
              email: friendUser.email,
              avatar: friendUser.avatar_url,
              membershipLevel: 'free' as const,
              membershipStatus: 'active' as const
            } : {
              id: friendId,
              username: '未知用户',
              email: '',
              membershipLevel: 'free' as const,
              membershipStatus: 'active' as const
            }
          };
        })
      );
      
      setFriends(friendsList);
      return friendsList;
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
      await supabase
        .from('user_status')
        .upsert({
          user_id: currentUser.id,
          status,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
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
      // 删除好友关系（将状态改为 rejected 或直接删除）
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUser.id})`);
      
      if (error) {
        console.error('删除好友失败:', error);
        return false;
      }
      
      setFriends(prev => prev.filter(f => f.friend_id !== friendId));
      return true;
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
      // 更新好友备注（需要在 friend_requests 表中添加 note 字段，或者创建单独的表）
      // 这里简化处理，仅更新本地状态
      setFriends(prev => prev.map(f => 
        f.friend_id === friendId ? { ...f, user_note: note } : f
      ));
      return true;
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
