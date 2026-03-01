/**
 * @提及服务 - 处理社群互动中的@提及功能
 * 支持帖子、评论、聊天中的@提及
 */

import { supabase } from '../lib/supabase';
import { supabaseAdmin } from '../lib/supabaseClient';

// ============================================
// 类型定义
// ============================================

export type MentionType = 'post' | 'comment' | 'chat' | 'reply';
export type ContentType = 'post' | 'comment' | 'message';

export interface Mention {
  id: string;
  senderId: string;
  receiverId: string;
  mentionType: MentionType;
  contentId: string;
  contentType: ContentType;
  mentionPosition?: number;
  mentionText: string;
  contentPreview?: string;
  communityId?: string;
  notificationSent: boolean;
  notificationRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MentionWithDetails extends Mention {
  senderUsername: string;
  senderAvatar?: string;
  communityName?: string;
}

export interface CommunityMember {
  userId: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  memberRole: string;
  similarityScore: number;
}

export interface MentionNotification {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatar?: string;
  mentionType: MentionType;
  contentId: string;
  contentType: ContentType;
  contentPreview?: string;
  communityId?: string;
  communityName?: string;
  notificationRead: boolean;
  createdAt: string;
}

// ============================================
// 成员搜索
// ============================================

/**
 * 搜索社群成员（用于@提及时的下拉选择）
 * @param communityId 社群ID
 * @param searchQuery 搜索关键词
 * @param limit 返回数量限制
 */
async function searchCommunityMembers(
  communityId: string,
  searchQuery: string = '',
  limit: number = 10
): Promise<CommunityMember[]> {
  try {
    // 首先尝试使用RPC函数（需要数据库迁移）
    const { data, error } = await supabase.rpc('search_community_members', {
      p_community_id: communityId,
      p_search_query: searchQuery,
      p_limit: limit,
    });

    if (error) {
      console.warn('RPC search_community_members failed, falling back to direct query:', error);
      // 如果RPC失败，使用备选查询方式
      return fallbackSearchMembers(communityId, searchQuery, limit);
    }

    return (data || []).map((member: any) => ({
      userId: member.user_id,
      username: member.username,
      avatarUrl: member.avatar_url,
      bio: member.bio,
      memberRole: member.member_role,
      similarityScore: member.similarity_score,
    }));
  } catch (error) {
    console.warn('Error in searchCommunityMembers, using fallback:', error);
    // 使用备选查询方式
    return fallbackSearchMembers(communityId, searchQuery, limit);
  }
}

/**
 * 备选的成员搜索方式（当RPC函数不可用时使用）
 */
async function fallbackSearchMembers(
  communityId: string,
  searchQuery: string = '',
  limit: number = 10
): Promise<CommunityMember[]> {
  try {
    console.log('[fallbackSearchMembers] Starting search for community:', communityId);
    
    // 第一步：获取社群成员列表
    const { data: membersData, error: membersError } = await supabase
      .from('community_members')
      .select('user_id, role')
      .eq('community_id', communityId)
      .limit(limit);

    console.log('[fallbackSearchMembers] Members data:', membersData, 'Error:', membersError);

    if (membersError) {
      console.error('Fallback search error - members:', membersError);
      return [];
    }

    if (!membersData || membersData.length === 0) {
      console.log('[fallbackSearchMembers] No members found');
      return [];
    }

    // 第二步：获取用户信息
    const userIds = membersData.map(m => m.user_id);
    console.log('[fallbackSearchMembers] User IDs:', userIds);
    
    let usersQuery = supabase
      .from('users')
      .select('id, username, avatar_url, bio')
      .in('id', userIds);

    // 如果有搜索关键词，添加过滤条件
    if (searchQuery && searchQuery.trim()) {
      usersQuery = usersQuery.or(`username.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`);
    }

    const { data: usersData, error: usersError } = await usersQuery;

    console.log('[fallbackSearchMembers] Users data:', usersData, 'Error:', usersError);

    if (usersError) {
      console.error('Fallback search error - users:', usersError);
      return [];
    }

    // 创建用户ID到用户信息的映射
    const usersMap = new Map();
    usersData?.forEach(user => {
      usersMap.set(user.id, user);
    });

    // 合并数据
    const result = membersData.map((member: any) => {
      const user = usersMap.get(member.user_id);
      return {
        userId: member.user_id,
        username: user?.username || '未知用户',
        avatarUrl: user?.avatar_url,
        bio: user?.bio,
        memberRole: member.role || 'member',
        similarityScore: 1.0,
      };
    }).filter(member => {
      // 如果有搜索词，只返回匹配的用户
      if (!searchQuery || !searchQuery.trim()) return true;
      return member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (member.bio && member.bio.toLowerCase().includes(searchQuery.toLowerCase()));
    });

    console.log('[fallbackSearchMembers] Final result:', result);
    return result;
  } catch (error) {
    console.error('Error in fallbackSearchMembers:', error);
    return [];
  }
}

/**
 * 获取社群成员列表（用于@提及时显示）
 * @param communityId 社群ID
 * @param limit 返回数量限制
 */
async function getCommunityMembers(
  communityId: string,
  limit: number = 20
): Promise<CommunityMember[]> {
  return searchCommunityMembers(communityId, '', limit);
}

// ============================================
// @提及创建
// ============================================

/**
 * 创建单个@提及
 * @param senderId 发送者ID
 * @param receiverUsername 接收者用户名
 * @param mentionType 提及类型
 * @param contentId 内容ID
 * @param contentType 内容类型
 * @param contentPreview 内容预览
 * @param communityId 社群ID（可选）
 * @param mentionPosition 提及位置（可选）
 */
async function createMention(
  senderId: string,
  receiverUsername: string,
  mentionType: MentionType,
  contentId: string,
  contentType: ContentType,
  contentPreview?: string,
  communityId?: string,
  mentionPosition?: number
): Promise<string> {
  try {
    // 首先尝试使用RPC函数
    const { data, error } = await supabase.rpc('create_mention', {
      p_sender_id: senderId,
      p_receiver_username: receiverUsername,
      p_mention_type: mentionType,
      p_content_id: contentId,
      p_content_type: contentType,
      p_content_preview: contentPreview,
      p_community_id: communityId,
      p_mention_position: mentionPosition,
    });

    if (error) {
      console.warn('RPC create_mention failed, using fallback:', error);
      // 如果RPC失败，使用备选方案
      return fallbackCreateMention(senderId, receiverUsername, mentionType, contentId, contentType, contentPreview, communityId, mentionPosition);
    }

    return data;
  } catch (error) {
    console.warn('Error in createMention, using fallback:', error);
    // 使用备选方案
    return fallbackCreateMention(senderId, receiverUsername, mentionType, contentId, contentType, contentPreview, communityId, mentionPosition);
  }
}

/**
 * 备选的创建@提及方式
 */
async function fallbackCreateMention(
  senderId: string,
  receiverUsername: string,
  mentionType: MentionType,
  contentId: string,
  contentType: ContentType,
  contentPreview?: string,
  communityId?: string,
  mentionPosition?: number
): Promise<string> {
  try {
    // 查找接收者ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', receiverUsername)
      .single();

    if (userError || !userData) {
      throw new Error(`User not found: ${receiverUsername}`);
    }

    const receiverId = userData.id;

    // 检查接收者是否在社群中
    if (communityId) {
      const { data: memberData, error: memberError } = await supabase
        .from('community_members')
        .select('user_id')
        .eq('community_id', communityId)
        .eq('user_id', receiverId)
        .single();

      if (memberError || !memberData) {
        throw new Error('User is not a member of this community');
      }
    }

    // 创建提及记录
    const { data: mentionData, error: insertError } = await supabase
      .from('mentions')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        mention_type: mentionType,
        content_id: contentId,
        content_type: contentType,
        content_preview: contentPreview,
        community_id: communityId,
        mention_position: mentionPosition,
        mention_text: `@${receiverUsername}`,
        notification_sent: false,
        notification_read: false,
      })
      .select('id')
      .single();

    if (insertError) {
      throw new Error('Failed to create mention');
    }

    return mentionData.id;
  } catch (error) {
    console.error('Error in fallbackCreateMention:', error);
    throw error;
  }
}

/**
 * 批量处理内容中的@提及
 * @param content 内容文本
 * @param senderId 发送者ID
 * @param mentionType 提及类型
 * @param contentId 内容ID
 * @param contentType 内容类型
 * @param communityId 社群ID（可选）
 * @returns 成功创建的提及数量
 */
async function processContentMentions(
  content: string,
  senderId: string,
  mentionType: MentionType,
  contentId: string,
  contentType: ContentType,
  communityId?: string
): Promise<number> {
  try {
    // 首先尝试使用RPC函数
    const { data, error } = await supabase.rpc('process_content_mentions', {
      p_content: content,
      p_sender_id: senderId,
      p_mention_type: mentionType,
      p_content_id: contentId,
      p_content_type: contentType,
      p_community_id: communityId,
    });

    if (error) {
      console.warn('RPC process_content_mentions failed, using fallback:', error);
      // 如果RPC失败，使用备选方案
      return fallbackProcessMentions(content, senderId, mentionType, contentId, contentType, communityId);
    }

    return data || 0;
  } catch (error) {
    console.warn('Error in processContentMentions, using fallback:', error);
    // 使用备选方案
    return fallbackProcessMentions(content, senderId, mentionType, contentId, contentType, communityId);
  }
}

/**
 * 备选的@提及处理方式
 */
async function fallbackProcessMentions(
  content: string,
  senderId: string,
  mentionType: MentionType,
  contentId: string,
  contentType: ContentType,
  communityId?: string
): Promise<number> {
  try {
    // 提取所有@提及
    const usernames = extractMentions(content);
    if (usernames.length === 0) return 0;

    let count = 0;
    const contentPreview = content.substring(0, 100) + (content.length > 100 ? '...' : '');

    // 为每个提及创建记录
    for (const username of usernames) {
      try {
        // 查找用户ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .single();

        if (userError || !userData) {
          console.warn(`User not found: ${username}`);
          continue;
        }

        // 检查用户是否在社群中
        if (communityId) {
          const { data: memberData, error: memberError } = await supabase
            .from('community_members')
            .select('user_id')
            .eq('community_id', communityId)
            .eq('user_id', userData.id)
            .single();

          if (memberError || !memberData) {
            console.warn(`User ${username} is not a member of this community`);
            continue;
          }
        }

        // 创建提及记录
        const { error: insertError } = await supabase
          .from('mentions')
          .insert({
            sender_id: senderId,
            receiver_id: userData.id,
            mention_type: mentionType,
            content_id: contentId,
            content_type: contentType,
            content_preview: contentPreview,
            community_id: communityId,
            mention_text: `@${username}`,
            notification_sent: false,
            notification_read: false,
          });

        if (insertError) {
          console.error('Error inserting mention:', insertError);
          continue;
        }

        count++;
      } catch (err) {
        console.error(`Error processing mention for ${username}:`, err);
      }
    }

    return count;
  } catch (error) {
    console.error('Error in fallbackProcessMentions:', error);
    return 0;
  }
}

// ============================================
// @提及查询
// ============================================

/**
 * 获取用户的@提及列表
 * @param userId 用户ID
 * @param unreadOnly 是否只返回未读
 * @param limit 返回数量限制
 * @param offset 偏移量
 */
async function getUserMentions(
  userId: string,
  unreadOnly: boolean = false,
  limit: number = 20,
  offset: number = 0
): Promise<MentionNotification[]> {
  try {
    const { data, error } = await supabase.rpc('get_user_mentions', {
      p_user_id: userId,
      p_unread_only: unreadOnly,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('Error getting user mentions:', error);
      throw new Error('获取@提及列表失败');
    }

    return (data || []).map((mention: any) => ({
      id: mention.id,
      senderId: mention.sender_id,
      senderUsername: mention.sender_username,
      senderAvatar: mention.sender_avatar,
      mentionType: mention.mention_type,
      contentId: mention.content_id,
      contentType: mention.content_type,
      contentPreview: mention.content_preview,
      communityId: mention.community_id,
      communityName: mention.community_name,
      notificationRead: mention.notification_read,
      createdAt: mention.created_at,
    }));
  } catch (error) {
    console.error('Error in getUserMentions:', error);
    throw error;
  }
}

/**
 * 获取未读@提及数量
 * @param userId 用户ID
 */
async function getUnreadMentionCount(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('get_unread_mention_count', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error getting unread mention count:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Error in getUnreadMentionCount:', error);
    return 0;
  }
}

/**
 * 标记@提及为已读
 * @param mentionId 提及ID
 * @param userId 用户ID
 */
async function markMentionAsRead(mentionId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('mark_mention_as_read', {
      p_mention_id: mentionId,
      p_user_id: userId,
    });

    if (error) {
      console.error('Error marking mention as read:', error);
      throw new Error('标记已读失败');
    }

    return data || false;
  } catch (error) {
    console.error('Error in markMentionAsRead:', error);
    throw error;
  }
}

/**
 * 标记所有@提及为已读
 * @param userId 用户ID
 */
async function markAllMentionsAsRead(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('mentions')
      .update({ notification_read: true, updated_at: new Date().toISOString() })
      .eq('receiver_id', userId)
      .eq('notification_read', false);

    if (error) {
      console.error('Error marking all mentions as read:', error);
      throw new Error('标记全部已读失败');
    }
  } catch (error) {
    console.error('Error in markAllMentionsAsRead:', error);
    throw error;
  }
}

// ============================================
// 文本处理
// ============================================

/**
 * 从文本中提取@提及的用户名
 * @param content 文本内容
 * @returns 提取的用户名列表
 */
function extractMentions(content: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_\u4e00-\u9fa5]+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  return [...new Set(mentions)]; // 去重
}

/**
 * 将文本中的@提及转换为可点击的链接格式
 * @param content 原始文本
 * @returns 处理后的HTML字符串
 */
function formatMentionsInText(content: string): string {
  const mentionRegex = /@([a-zA-Z0-9_\u4e00-\u9fa5]+)/g;
  
  return content.replace(mentionRegex, (match, username) => {
    return `<span class="mention-highlight" data-username="${username}">${match}</span>`;
  });
}

/**
 * 检查文本中是否包含@提及
 * @param content 文本内容
 */
function hasMentions(content: string): boolean {
  const mentionRegex = /@([a-zA-Z0-9_\u4e00-\u9fa5]+)/;
  return mentionRegex.test(content);
}

/**
 * 获取光标位置的@提及上下文
 * @param content 文本内容
 * @param cursorPosition 光标位置
 * @returns 当前正在输入的@提及文本（如果有）
 */
function getCurrentMentionQuery(content: string, cursorPosition: number): string | null {
  const textBeforeCursor = content.substring(0, cursorPosition);
  const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_\u4e00-\u9fa5]*)$/);
  
  if (mentionMatch) {
    return mentionMatch[1];
  }
  
  return null;
}

/**
 * 在指定位置插入@提及
 * @param content 原始文本
 * @param cursorPosition 光标位置
 * @param username 要插入的用户名
 * @returns 新文本和新的光标位置
 */
function insertMention(
  content: string,
  cursorPosition: number,
  username: string
): { newContent: string; newCursorPosition: number } {
  const textBeforeCursor = content.substring(0, cursorPosition);
  const textAfterCursor = content.substring(cursorPosition);
  
  // 查找当前正在输入的@提及
  const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_\u4e00-\u9fa5]*)$/);
  
  let newTextBeforeCursor: string;
  if (mentionMatch) {
    // 替换当前正在输入的@提及
    newTextBeforeCursor = textBeforeCursor.substring(0, textBeforeCursor.length - mentionMatch[0].length);
  } else {
    newTextBeforeCursor = textBeforeCursor;
  }
  
  const mentionText = `@${username} `;
  const newContent = newTextBeforeCursor + mentionText + textAfterCursor;
  const newCursorPosition = newTextBeforeCursor.length + mentionText.length;
  
  return { newContent, newCursorPosition };
}

// ============================================
// 实时订阅
// ============================================

/**
 * 订阅用户的@提及通知
 * @param userId 用户ID
 * @param callback 收到新提及时的回调函数
 * @returns 取消订阅函数
 */
function subscribeToMentions(
  userId: string,
  callback: (mention: MentionNotification) => void
): () => void {
  const channel = supabase
    .channel(`mentions:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'mentions',
        filter: `receiver_id=eq.${userId}`,
      },
      async (payload) => {
        const newMention = payload.new as any;
        
        // 获取发送者信息
        const { data: sender } = await supabase
          .from('users')
          .select('username, avatar_url')
          .eq('id', newMention.sender_id)
          .single();

        // 获取社群信息
        let communityName: string | undefined;
        if (newMention.community_id) {
          const { data: community } = await supabase
            .from('communities')
            .select('name')
            .eq('id', newMention.community_id)
            .single();
          communityName = community?.name;
        }

        const mentionNotification: MentionNotification = {
          id: newMention.id,
          senderId: newMention.sender_id,
          senderUsername: sender?.username || '未知用户',
          senderAvatar: sender?.avatar_url,
          mentionType: newMention.mention_type,
          contentId: newMention.content_id,
          contentType: newMention.content_type,
          contentPreview: newMention.content_preview,
          communityId: newMention.community_id,
          communityName,
          notificationRead: newMention.notification_read,
          createdAt: newMention.created_at,
        };

        callback(mentionNotification);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

// ============================================
// 导出服务
// ============================================

export const mentionService = {
  // 成员搜索
  searchCommunityMembers,
  getCommunityMembers,
  
  // @提及创建
  createMention,
  processContentMentions,
  
  // @提及查询
  getUserMentions,
  getUnreadMentionCount,
  markMentionAsRead,
  markAllMentionsAsRead,
  
  // 文本处理
  extractMentions,
  formatMentionsInText,
  hasMentions,
  getCurrentMentionQuery,
  insertMention,
  
  // 实时订阅
  subscribeToMentions,
};

export default mentionService;
