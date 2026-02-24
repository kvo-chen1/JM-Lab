/**
 * 消息中心服务 - 处理用户消息和通知
 * 津脉社区平台
 */

import { supabase } from '@/lib/supabase';

// ============================================
// 类型定义
// ============================================

export type MessageType = 'private' | 'reply' | 'mention' | 'like' | 'system' | 'follow';

export interface Message {
  id: string;
  type: MessageType;
  title: string;
  content: string;
  timestamp: Date;
  read: boolean;
  sender?: {
    id: string;
    username: string;
    avatar?: string;
    verified?: boolean;
  };
  targetContent?: {
    id: string;
    type: 'post' | 'comment' | 'work';
    preview?: string;
    thumbnail?: string;
  };
  count?: number;
  link?: string;
}

export interface MessageFilter {
  type?: MessageType;
  unreadOnly?: boolean;
  searchQuery?: string;
}

export interface MessageStats {
  total: number;
  unread: number;
  private: number;
  reply: number;
  mention: number;
  like: number;
  follow: number;
  system: number;
}

// ============================================
// 消息类型映射（将数据库类型映射到前端类型）
// ============================================

const typeMapping: Record<string, MessageType> = {
  // 私信相关
  'private_message': 'private',
  'direct_message': 'private',
  
  // 回复相关
  'reply': 'reply',
  'comment_reply': 'reply',
  'post_commented': 'reply',
  
  // @提及相关
  'mention': 'mention',
  'at_mention': 'mention',
  'comment_replied': 'mention',
  
  // 点赞相关
  'like': 'like',
  'post_liked': 'like',
  'comment_liked': 'like',
  'work_liked': 'like',
  
  // 关注相关
  'follow': 'follow',
  'user_followed': 'follow',
  'new_follower': 'follow',
  
  // 系统通知
  'system': 'system',
  'announcement': 'system',
  'ranking_published': 'system',
  'feedback_resolved': 'system',
  'invitation_received': 'system',
  'invitation_accepted': 'system',
  'application_approved': 'system',
  'application_rejected': 'system',
};

// ============================================
// 消息查询
// ============================================

/**
 * 获取用户消息列表
 */
export async function getMessages(
  userId: string,
  filter?: MessageFilter,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<Message[]> {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  // 构建基础查询
  let query = supabase
    .from('notifications')
    .select(`
      *,
      sender:sender_id(
        id,
        username,
        avatar_url,
        is_verified
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // 应用类型过滤
  if (filter?.type) {
    // 获取对应的数据库类型列表
    const dbTypes = Object.entries(typeMapping)
      .filter(([_, v]) => v === filter.type)
      .map(([k]) => k);
    
    if (dbTypes.length > 0) {
      query = query.in('type', dbTypes);
    }
  }

  // 应用未读过滤
  if (filter?.unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  // 转换数据格式
  let messages = (data || []).map(mapNotificationToMessage);

  // 应用搜索过滤（客户端过滤）
  if (filter?.searchQuery) {
    const query = filter.searchQuery.toLowerCase();
    messages = messages.filter(
      m =>
        m.title.toLowerCase().includes(query) ||
        m.content.toLowerCase().includes(query)
    );
  }

  return messages;
}

/**
 * 获取消息统计
 */
export async function getMessageStats(userId: string): Promise<MessageStats> {
  // 获取所有消息
  const { data, error } = await supabase
    .from('notifications')
    .select('type, is_read')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching message stats:', error);
    return {
      total: 0,
      unread: 0,
      private: 0,
      reply: 0,
      mention: 0,
      like: 0,
      follow: 0,
      system: 0,
    };
  }

  const stats: MessageStats = {
    total: data?.length || 0,
    unread: 0,
    private: 0,
    reply: 0,
    mention: 0,
    like: 0,
    follow: 0,
    system: 0,
  };

  data?.forEach((item: any) => {
    const mappedType = typeMapping[item.type] || 'system';
    
    if (!item.is_read) {
      stats.unread++;
    }
    
    switch (mappedType) {
      case 'private':
        stats.private++;
        break;
      case 'reply':
        stats.reply++;
        break;
      case 'mention':
        stats.mention++;
        break;
      case 'like':
        stats.like++;
        break;
      case 'follow':
        stats.follow++;
        break;
      case 'system':
        stats.system++;
        break;
    }
  });

  return stats;
}

/**
 * 标记消息为已读
 */
export async function markAsRead(messageId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq('id', messageId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error marking message as read:', error);
    return false;
  }

  return true;
}

/**
 * 标记所有消息为已读
 */
export async function markAllAsRead(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all messages as read:', error);
    return false;
  }

  return true;
}

/**
 * 删除消息
 */
export async function deleteMessage(messageId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', messageId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting message:', error);
    return false;
  }

  return true;
}

/**
 * 获取未读消息数量
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }

  return count || 0;
}

// ============================================
// 实时订阅
// ============================================

/**
 * 订阅用户消息
 */
export function subscribeToMessages(
  userId: string,
  callback: (message: Message) => void
): () => void {
  const channel = supabase
    .channel(`user_messages:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const message = mapNotificationToMessage(payload.new);
        callback(message);
      }
    )
    .subscribe();

  // 返回取消订阅函数
  return () => {
    channel.unsubscribe();
  };
}

// ============================================
// 辅助函数
// ============================================

/**
 * 将数据库通知映射为前端消息格式
 */
function mapNotificationToMessage(data: any): Message {
  const mappedType = typeMapping[data.type] || 'system';
  
  // 解析data字段中的额外信息
  const extraData = data.data || {};
  
  return {
    id: data.id,
    type: mappedType,
    title: data.title || getDefaultTitle(mappedType),
    content: data.content || '',
    timestamp: new Date(data.created_at),
    read: data.is_read,
    sender: data.sender ? {
      id: data.sender.id,
      username: data.sender.username || '未知用户',
      avatar: data.sender.avatar_url,
      verified: data.sender.is_verified,
    } : undefined,
    targetContent: extraData.targetContent,
    count: extraData.count,
    link: data.link,
  };
}

/**
 * 获取默认标题
 */
function getDefaultTitle(type: MessageType): string {
  const titles: Record<MessageType, string> = {
    'private': '私信',
    'reply': '回复',
    'mention': '@提及',
    'like': '点赞',
    'follow': '关注',
    'system': '系统通知',
  };
  return titles[type] || '通知';
}

// ============================================
// 好友请求功能
// ============================================

/**
 * 发送好友请求
 */
export async function sendFriendRequest(senderId: string, receiverId: string): Promise<void> {
  // 检查是否已经是好友
  const { data: existing } = await supabase
    .from('friend_requests')
    .select('*')
    .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
    .eq('status', 'accepted')
    .single();

  if (existing) {
    throw new Error('ALREADY_FRIENDS');
  }

  // 检查是否已有待处理的请求
  const { data: pending } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('sender_id', senderId)
    .eq('receiver_id', receiverId)
    .eq('status', 'pending')
    .single();

  if (pending) {
    throw new Error('REQUEST_ALREADY_SENT');
  }

  const { error } = await supabase
    .from('friend_requests')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      status: 'pending',
    });

  if (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
}

/**
 * 接受好友请求
 */
export async function acceptFriendRequest(requestId: string): Promise<boolean> {
  const { error } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) {
    console.error('Error accepting friend request:', error);
    return false;
  }

  return true;
}

/**
 * 拒绝好友请求
 */
export async function rejectFriendRequest(requestId: string): Promise<boolean> {
  const { error } = await supabase
    .from('friend_requests')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) {
    console.error('Error rejecting friend request:', error);
    return false;
  }

  return true;
}

/**
 * 获取好友请求列表
 */
export async function getFriendRequests(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting friend requests:', error);
    return [];
  }

  return data || [];
}

/**
 * 检查是否是好友
 */
export async function checkIsFriend(userId: string, friendId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
    .eq('status', 'accepted')
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

// ============================================
// 私信功能
// ============================================

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  type?: 'text' | 'image' | 'work_share' | 'community_invite';
}

export interface Conversation {
  userId: string;
  username: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

/**
 * 获取两个用户之间的私信列表
 */
export async function getDirectMessages(
  userId: string,
  friendId: string,
  limit: number = 50
): Promise<DirectMessage[]> {
  const { data, error } = await supabase
    .from('direct_messages')
    .select('*')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching direct messages:', error);
    return [];
  }

  return data || [];
}

export interface SendMessageResult {
  success: boolean;
  data?: DirectMessage;
  error?: string;
}

/**
 * 发送私信
 */
export async function sendDirectMessage(
  senderId: string,
  receiverId: string,
  content: string,
  type: 'text' | 'image' | 'work_share' | 'community_invite' = 'text'
): Promise<SendMessageResult> {
  const { data, error } = await supabase
    .from('direct_messages')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      type,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending direct message:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * 标记私信为已读
 */
export async function markMessagesAsRead(
  userId: string,
  senderId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('direct_messages')
    .update({ is_read: true })
    .eq('receiver_id', userId)
    .eq('sender_id', senderId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking messages as read:', error);
    return false;
  }

  return true;
}

/**
 * 获取用户的所有未读消息数量（按发送者分组）
 */
export async function getUnreadMessageCounts(userId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('direct_messages')
    .select('sender_id')
    .eq('receiver_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error fetching unread message counts:', error);
    return {};
  }

  const counts: Record<string, number> = {};
  data?.forEach((msg: any) => {
    counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
  });

  return counts;
}

/**
 * 获取用户的会话列表
 */
export async function getConversations(userId: string): Promise<Conversation[]> {
  // 获取所有相关的私信（发送或接收的）
  const { data, error } = await supabase
    .from('direct_messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  // 按用户分组，获取每个用户的最新消息和未读数
  const conversationMap = new Map<string, {
    userId: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
  }>();

  data?.forEach((msg: any) => {
    const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    
    if (!conversationMap.has(otherUserId)) {
      conversationMap.set(otherUserId, {
        userId: otherUserId,
        lastMessage: msg.content,
        lastMessageTime: msg.created_at,
        unreadCount: msg.receiver_id === userId && !msg.is_read ? 1 : 0,
      });
    } else {
      const conv = conversationMap.get(otherUserId)!;
      if (msg.receiver_id === userId && !msg.is_read) {
        conv.unreadCount++;
      }
    }
  });

  // 获取用户信息
  const userIds = Array.from(conversationMap.keys());
  if (userIds.length === 0) return [];

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, username, avatar_url')
    .in('id', userIds);

  if (usersError) {
    console.error('Error fetching user info:', usersError);
  }

  const userMap = new Map(users?.map((u: any) => [u.id, u]));

  return Array.from(conversationMap.values()).map(conv => {
    const user = userMap.get(conv.userId);
    return {
      userId: conv.userId,
      username: user?.username || '未知用户',
      avatar: user?.avatar_url,
      lastMessage: conv.lastMessage,
      lastMessageTime: conv.lastMessageTime,
      unreadCount: conv.unreadCount,
    };
  });
}

// ============================================
// 导出
// ============================================

export const messageService = {
  getMessages,
  getMessageStats,
  markAsRead,
  markAllAsRead,
  deleteMessage,
  getUnreadCount,
  subscribeToMessages,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
  checkIsFriend,
  getDirectMessages,
  sendDirectMessage,
  markMessagesAsRead,
  getUnreadMessageCounts,
  getConversations,
};

export default messageService;
