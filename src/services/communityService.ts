import { supabase } from '../lib/supabase';
import type { PostWithAuthor, UserProfile, CommentWithAuthor } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export const communityService = {
  async toggleLike(postId: string, userId: string, action: 'like' | 'unlike'): Promise<void> {
    if (action === 'unlike') {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: userId });
        
      if (error) throw error;
    }
  },

  async toggleFollow(followerId: string, followingId: string, action: 'follow' | 'unfollow'): Promise<void> {
    if (action === 'unfollow') {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);
        
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: followerId, following_id: followingId });
        
      if (error) throw error;
    }
  },

  subscribeToPosts(onPostChange: (payload: any) => void): RealtimeChannel {
    return supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        onPostChange
      )
      .subscribe();
  },

  // 好友相关功能
  async sendFriendRequest(senderId: string, receiverId: string): Promise<void> {
    const { error } = await supabase
      .from('friend_requests')
      .insert({ sender_id: senderId, receiver_id: receiverId, status: 'pending' });
    
    if (error) throw error;
  },

  async acceptFriendRequest(requestId: string): Promise<void> {
    // 1. 更新好友请求状态
    const { data: request, error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    if (!request) throw new Error('好友请求不存在');
    
    // 2. 可以在这里添加好友关系表的记录
    // 例如：在friends表中插入两条记录，方便双向查询
    // await supabase.from('friends').insert([
    //   { user_id: request.sender_id, friend_id: request.receiver_id },
    //   { user_id: request.receiver_id, friend_id: request.sender_id }
    // ]);
  },

  async rejectFriendRequest(requestId: string): Promise<void> {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);
    
    if (error) throw error;
  },

  async removeFriend(userId: string, friendId: string): Promise<void> {
    // 这里需要根据实际的数据模型来实现
    // 例如：从friends表中删除关系记录
    // 或者从friend_requests表中删除已接受的请求
    
    // 示例实现（假设使用friend_requests表）
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .or(`sender_id.eq.${userId},sender_id.eq.${friendId}`)
      .or(`receiver_id.eq.${userId},receiver_id.eq.${friendId}`)
      .eq('status', 'accepted');
    
    if (error) throw error;
  },

  async getFriends(userId: string): Promise<{ data: UserProfile[] | null; error: any }> {
    // 这里需要根据实际的数据模型来实现
    // 示例实现：获取所有已接受的好友请求对应的用户
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        sender:users!sender_id(*),
        receiver:users!receiver_id(*)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted');
    
    if (error) return { data: null, error };
    
    // 处理数据，提取好友列表
    const friends: UserProfile[] = [];
    data.forEach(request => {
      if (request.sender && request.sender.id !== userId) {
        friends.push(request.sender as UserProfile);
      }
      if (request.receiver && request.receiver.id !== userId) {
        friends.push(request.receiver as UserProfile);
      }
    });
    
    return { data: friends, error: null };
  },

  async getSentFriendRequests(userId: string): Promise<{ data: any[] | null; error: any }> {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *, 
        receiver:users!receiver_id(*)
      `)
      .eq('sender_id', userId)
      .eq('status', 'pending');
    
    return { data, error };
  },

  async getReceivedFriendRequests(userId: string): Promise<{ data: any[] | null; error: any }> {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *, 
        sender:users!sender_id(*)
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending');
    
    return { data, error };
  },

  // 私信相关功能
  async sendMessage(senderId: string, receiverId: string, content: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        is_read: false
      });
    
    if (error) throw error;
  },

  async getChatMessages(userId: string, friendId: string): Promise<{ data: any[] | null; error: any }> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *, 
        sender:users!sender_id(*),
        receiver:users!receiver_id(*)
      `)
      .or(
        `sender_id.eq.${userId},sender_id.eq.${friendId}`,
        `receiver_id.eq.${userId},receiver_id.eq.${friendId}`
      )
      .order('created_at', { ascending: true });
    
    return { data, error };
  },

  async getChatSessions(userId: string): Promise<{ data: any[] | null; error: any }> {
    // 这里需要根据实际的数据模型来实现
    // 示例实现：获取与所有好友的最新消息
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *, 
        sender:users!sender_id(*),
        receiver:users!receiver_id(*)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (error) return { data: null, error };
    
    // 处理数据，按对话分组并获取最新消息
    const sessionsMap = new Map<string, any>();
    
    data.forEach(message => {
      const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;
      if (!sessionsMap.has(otherUserId)) {
        sessionsMap.set(otherUserId, message);
      }
    });
    
    const sessions = Array.from(sessionsMap.values());
    return { data: sessions, error: null };
  },

  async markMessagesAsRead(userId: string, friendId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', userId)
      .eq('sender_id', friendId);
    
    if (error) throw error;
  }
};
