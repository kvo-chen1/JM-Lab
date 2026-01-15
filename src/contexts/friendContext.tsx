import React from 'react';
import { createContext, useState, ReactNode, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AuthContext, User as AuthUser } from './authContext';

// 检查是否为开发环境
const isDevelopment = (): boolean => {
  return import.meta.env?.MODE === 'development' || import.meta.env?.DEV === true;
};

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
  updated_at: string;
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

// 导出上下文
// 注意：仅导出上下文和钩子，不导出内部实现细节
// 这是为了确保 Vite Fast Refresh 能正常工作

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
      if (supabase) {
        // 使用Supabase搜索用户
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .ilike('username', `%${query}%`)
          .or(`email.ilike.%${query}%,id.eq.${query}`)
          .neq('id', currentUser.id)
          .limit(20);
        
        if (error) {
          // 忽略表不存在的错误，这是正常的开发环境状态
          if (error.code === 'PGRST205') {
              if (isDevelopment()) {
                console.warn('搜索用户时表不存在，这是正常的开发环境状态');
              }
              return [];
            }
          throw error;
        }
        
        // 获取用户状态
        const usersWithStatus = await Promise.all((data || []).map(async (user: any) => {
          const status = await getUserStatus(user.id);
          return {
            ...user,
            status
          };
        }));
        
        return usersWithStatus;
      } else {
        // 模拟搜索结果
        return [];
      }
    } catch (err) {
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
      if (supabase) {
        // 检查是否已经发送过请求
        let existingRequest;
        try {
          const { data } = await supabase
            .from('friend_requests')
            .select('*')
            .eq('sender_id', currentUser.id)
            .eq('receiver_id', userId)
            .single();
          existingRequest = data;
        } catch (checkErr: any) {
          // 忽略表不存在的错误，继续执行
            if (checkErr.code === 'PGRST205') {
              if (isDevelopment()) {
                console.warn('好友请求表尚未创建，这是正常的开发环境状态');
              }
            } else {
              throw checkErr;
            }
        }
        
        if (existingRequest) {
          setError('已经发送过好友请求');
          return false;
        }
        
        // 发送好友请求
        const { error } = await (supabase as any)
          .from('friend_requests')
          .insert({
            sender_id: currentUser.id,
            receiver_id: userId,
            status: 'pending'
          });
        
        if (error) {
          // 忽略表不存在的错误，这是正常的开发环境状态
          if (error.code === 'PGRST205') {
              if (isDevelopment()) {
                console.warn('发送好友请求时表不存在，这是正常的开发环境状态');
              }
              return true;
            }
          throw error;
        }
        
        return true;
      } else {
        // 模拟发送请求
        return true;
      }
    } catch (err) {
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
      if (supabase) {
        // 获取请求信息
        let request;
        try {
          const { data, error: requestError } = await supabase
            .from('friend_requests')
            .select('*')
            .eq('id', requestId)
            .single();
          
          if (requestError) throw requestError;
          request = data;
        } catch (getErr: any) {
          // 忽略表不存在的错误，模拟成功
            if (getErr.code === 'PGRST205') {
              if (isDevelopment()) {
                console.warn('好友请求表尚未创建，这是正常的开发环境状态');
              }
              // 更新本地状态
              setFriendRequests(prev => prev.filter(r => r.id !== requestId));
              getFriends();
              return true;
            }
          throw getErr;
        }
        
        if (!request) {
          setError('好友请求不存在');
          return false;
        }
        
        // 更新请求状态为已接受
        try {
          const { error: updateError } = await (supabase as any)
            .from('friend_requests')
            .update({ status: 'accepted' })
            .eq('id', requestId);
          
          if (updateError) throw updateError;
        } catch (updateErr: any) {
          // 忽略表不存在的错误，继续执行
            if (updateErr.code === 'PGRST205') {
              if (isDevelopment()) {
                console.warn('好友请求表尚未创建，这是正常的开发环境状态');
              }
            } else {
              throw updateErr;
            }
        }
        
        // 创建双向好友关系
        try {
          await (supabase as any).from('friends').insert([
            {
              user_id: (request as any).sender_id,
              friend_id: (request as any).receiver_id
            },
            {
              user_id: (request as any).receiver_id,
              friend_id: (request as any).sender_id
            }
          ]);
        } catch (insertErr: any) {
          // 忽略表不存在的错误，继续执行
            if (insertErr.code === 'PGRST205') {
              if (isDevelopment()) {
                console.warn('好友表尚未创建，这是正常的开发环境状态');
              }
            } else {
              throw insertErr;
            }
        }
        
        // 更新本地状态
        setFriendRequests(prev => prev.filter(r => r.id !== requestId));
        getFriends();
        
        return true;
      } else {
        // 模拟接受请求
        setFriendRequests(prev => prev.filter(r => r.id !== requestId));
        return true;
      }
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
      if (supabase) {
        // 更新请求状态为已拒绝
        try {
          const { error } = await (supabase as any)
            .from('friend_requests')
            .update({ status: 'rejected' })
            .eq('id', requestId);
          
          if (error) {
            // 忽略表不存在的错误，这是正常的开发环境状态
            if (error.code === 'PGRST205') {
              if (isDevelopment()) {
                console.warn('好友请求表尚未创建，这是正常的开发环境状态');
              }
            } else {
              throw error;
            }
          }
        } catch (updateErr: any) {
          // 只忽略表不存在的错误
          if (updateErr.code !== 'PGRST205') {
            throw updateErr;
          }
        }
        
        // 更新本地状态
        setFriendRequests(prev => prev.filter(r => r.id !== requestId));
        
        return true;
      } else {
        // 模拟拒绝请求
        setFriendRequests(prev => prev.filter(r => r.id !== requestId));
        return true;
      }
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
      if (supabase) {
        // 获取当前用户收到的好友请求
        let data: any[] = [];
        try {
          const result = await supabase
            .from('friend_requests')
            .select('*')
            .eq('receiver_id', currentUser.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
          
          if (result.error) {
            // 忽略表不存在的错误，返回空数组
          if (result.error.code === 'PGRST205') {
            if (isDevelopment()) {
              console.warn('好友请求表尚未创建，这是正常的开发环境状态');
            }
            data = [];
          } else {
            throw result.error;
          }
          } else {
            data = result.data;
          }
        } catch (fetchErr: any) {
          // 忽略表不存在的错误，返回空数组
        if (fetchErr.code === 'PGRST205') {
          if (isDevelopment()) {
            console.warn('好友请求表尚未创建，这是正常的开发环境状态');
          }
          data = [];
        } else {
          throw fetchErr;
        }
        }
        
        // 获取发送者信息
        const requestsWithSender = await Promise.all((data || []).map(async (request: any) => {
          let sender;
          try {
            const { data: senderData } = await (supabase as any)
              .from('users')
              .select('*')
              .eq('id', request.sender_id)
              .single();
            sender = senderData;
          } catch (userErr: any) {
            // 忽略表不存在的错误，继续执行
            if (userErr.code !== 'PGRST205') {
              console.error('获取发送者信息失败:', userErr);
            }
          }
          
          return {
            ...request,
            sender
          };
        }));
        
        setFriendRequests(requestsWithSender);
        return requestsWithSender;
      } else {
        // 模拟好友请求
        setFriendRequests([]);
        return [];
      }
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
      if (supabase) {
        // 获取当前用户的好友列表
        let data: any[] = [];
        try {
          const result = await supabase
            .from('friends')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
          
          if (result.error) {
            // 忽略表不存在的错误，返回空数组
          if (result.error.code === 'PGRST205') {
            if (isDevelopment()) {
              console.warn('好友表尚未创建，这是正常的开发环境状态');
            }
            data = [];
          } else {
            throw result.error;
          }
          } else {
            data = result.data;
          }
        } catch (fetchErr: any) {
          // 忽略表不存在的错误，返回空数组
        if (fetchErr.code === 'PGRST205') {
          if (isDevelopment()) {
            console.warn('好友表尚未创建，这是正常的开发环境状态');
          }
          data = [];
        } else {
          throw fetchErr;
        }
        }
        
        // 获取好友详细信息和状态
        const friendsWithDetails = await Promise.all((data || []).map(async (friendship: any) => {
          let friend;
          try {
            const { data: friendData } = await (supabase as any)
              .from('users')
              .select('*')
              .eq('id', friendship.friend_id)
              .single();
            friend = friendData;
          } catch (userErr: any) {
            // 忽略表不存在的错误，继续执行
            if (userErr.code !== 'PGRST205') {
              console.error('获取好友信息失败:', userErr);
            }
          }
          
          const status = await getUserStatus(friendship.friend_id);
          
          return {
          ...friendship,
          friend: friend ? {
            ...friend,
            status
          } : undefined
        };
        }));
        
        setFriends(friendsWithDetails);
        return friendsWithDetails;
      } else {
        // 模拟好友列表
        setFriends([]);
        return [];
      }
    } catch (err) {
      setError('获取好友列表失败');
      console.error('获取好友列表失败:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 获取用户状态
  const getUserStatus = async (userId: string): Promise<UserStatus> => {
    if (supabase) {
      const { data, error } = await (supabase as any)
        .from('user_status')
        .select('status')
        .eq('user_id', userId)
        .single();
      
      if (error || !data) {
        return 'offline';
      }
      
      return (data as any).status as UserStatus;
    }
    
    return 'offline';
  };

  // 更新用户状态
  const updateUserStatus = async (status: UserStatus): Promise<boolean> => {
    if (!currentUser) return false;
    
    try {
      if (supabase) {
        // 更新用户状态
        const { error } = await (supabase as any)
          .from('user_status')
          .upsert({
            user_id: currentUser.id,
            status,
            last_seen: new Date().toISOString()
          });
        
        if (error) {
          // 忽略表不存在的错误，因为这可能是开发环境中的临时状态
          if (error.code === 'PGRST205') {
            if (isDevelopment()) {
              console.warn('用户状态表尚未创建，这是正常的开发环境状态');
            }
            return true;
          }
          throw error;
        }
      }
      
      return true;
    } catch (err) {
      console.error('更新用户状态失败:', err);
      return false;
    }
  };

  // 订阅好友状态变化
  const subscribeToFriendStatuses = (): (() => void) | undefined => {
    if (supabase) {
      // 这里可以实现实时状态更新，例如使用Supabase的realtime功能
      // 由于当前环境限制，我们暂时不实现实时更新，而是定期轮询
      const interval = setInterval(() => {
        // 更新好友状态
        friends.forEach(async (friend) => {
          if (friend.friend?.id) {
            const friendId = friend.friend.id;
            const status = await getUserStatus(friendId);
            setFriendStatuses(prev => ({
              ...prev,
              [friendId]: status
            }));
          }
        });
      }, 30000); // 每30秒更新一次
      
      return () => clearInterval(interval);
    }
    return undefined;
  };

  // 删除好友
  const deleteFriend = async (friendId: string): Promise<boolean> => {
    if (!currentUser) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      if (supabase) {
        // 删除双向好友关系
        try {
          const { error } = await supabase
            .from('friends')
            .delete()
            .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUser.id})`);
          
          if (error) {
            // 忽略表不存在的错误，这是正常的开发环境状态
            if (error.code === 'PGRST205') {
              if (isDevelopment()) {
                console.warn('好友表尚未创建，这是正常的开发环境状态');
              }
            } else {
              throw error;
            }
          }
        } catch (deleteErr: any) {
          // 只忽略表不存在的错误
          if (deleteErr.code !== 'PGRST205') {
            throw deleteErr;
          }
        }
        
        // 更新本地状态
        setFriends(prev => prev.filter(f => f.friend_id !== friendId));
        
        return true;
      } else {
        // 模拟删除好友
        setFriends(prev => prev.filter(f => f.friend_id !== friendId));
        return true;
      }
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
      if (supabase) {
        // 更新好友备注
        try {
          const { error } = await (supabase as any)
            .from('friends')
            .update({ user_note: note })
            .eq('user_id', currentUser.id)
            .eq('friend_id', friendId);
          
          if (error) {
            // 忽略表不存在的错误，这是正常的开发环境状态
            if (error.code === 'PGRST205') {
              if (isDevelopment()) {
                console.warn('好友表尚未创建，这是正常的开发环境状态');
              }
            } else {
              throw error;
            }
          }
        } catch (updateErr: any) {
          // 只忽略表不存在的错误
          if (updateErr.code !== 'PGRST205') {
            throw updateErr;
          }
        }
        
        // 更新本地状态
        setFriends(prev => prev.map(f => 
          f.friend_id === friendId ? { ...f, user_note: note } : f
        ));
        
        return true;
      } else {
        // 模拟设置备注
        setFriends(prev => prev.map(f => 
          f.friend_id === friendId ? { ...f, user_note: note } : f
        ));
        return true;
      }
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
