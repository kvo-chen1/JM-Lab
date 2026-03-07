/**
 * 通知服务 - 处理社群邀请与申请相关的通知
 * 津脉社区平台
 */

import { supabase } from '../lib/supabase';
import type {
  InvitationNotification,
  InvitationNotificationType,
} from '../types/community-invitation';

// ============================================
// 通知发送
// ============================================

interface SendNotificationParams {
  type: string;
  recipientId: string;
  senderId?: string;
  communityId?: string;
  invitationId?: string;
  requestId?: string;
  title?: string;
  content?: string;
}

/**
 * 发送通用通知
 */
async function sendNotification(params: SendNotificationParams): Promise<void> {
  const { type, recipientId, senderId, communityId, invitationId, requestId, title, content } = params;

  // 构建通知内容
  let notificationTitle = title || '';
  let notificationContent = content || '';

  if (!title || !content) {
    const template = getNotificationTemplate(type);
    notificationTitle = template.title;
    notificationContent = template.content;
  }

  // 保存到数据库
  const { error } = await supabase.from('notifications').insert({
    type,
    title: notificationTitle,
    content: notificationContent,
    user_id: recipientId,
    sender_id: senderId,
    community_id: communityId,
    related_id: invitationId || requestId,
    related_type: invitationId ? 'invitation' : requestId ? 'join_request' : null,
    is_read: false,
    link: buildNotificationLink(type, communityId, invitationId, requestId),
  });

  if (error) {
    console.error('Error sending notification:', error);
    throw new Error('发送通知失败');
  }

  // 发送实时通知（如果用户在线）
  await sendRealtimeNotification(recipientId, {
    type,
    title: notificationTitle,
    content: notificationContent,
    communityId,
    invitationId,
    requestId,
  });
}

/**
 * 发送邀请相关通知
 */
async function sendInvitationNotification(params: {
  type: InvitationNotification['type'];
  recipientId: string;
  senderId?: string;
  communityId?: string;
  invitationId?: string;
  requestId?: string;
}): Promise<void> {
  const { type, recipientId, senderId, communityId, invitationId, requestId } = params;

  // 获取发送者信息
  let senderName = '系统';
  if (senderId) {
    const { data: sender } = await supabase
      .from('users')
      .select('username')
      .eq('id', senderId)
      .single();
    senderName = sender?.username || '未知用户';
  }

  // 获取社群信息
  let communityName = '';
  if (communityId) {
    const { data: community } = await supabase
      .from('communities')
      .select('name')
      .eq('id', communityId)
      .single();
    communityName = community?.name || '';
  }

  // 构建通知内容
  const { title, content } = buildInvitationNotificationContent(
    type,
    senderName,
    communityName
  );

  await sendNotification({
    type,
    recipientId,
    senderId,
    communityId,
    invitationId,
    requestId,
    title,
    content,
  });
}

/**
 * 发送邮件邀请
 */
async function sendEmailInvitation(params: {
  email: string;
  inviterName: string;
  communityName: string;
  inviteLink: string;
  message?: string;
}): Promise<void> {
  const { email, inviterName, communityName, inviteLink, message } = params;

  // 调用后端API发送邮件
  try {
    const response = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        template: 'community_invitation',
        data: {
          inviterName,
          communityName,
          inviteLink,
          message,
        },
      }),
    });

    if (!response.ok) {
      console.error('Failed to send email invitation');
    }
  } catch (error) {
    console.error('Error sending email invitation:', error);
  }
}

/**
 * 发送短信邀请
 */
async function sendSMSInvitation(params: {
  phone: string;
  inviterName: string;
  communityName: string;
  inviteLink: string;
}): Promise<void> {
  const { phone, inviterName, communityName, inviteLink } = params;

  // 调用后端API发送短信
  try {
    const response = await fetch('/api/notifications/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phone,
        template: 'community_invitation',
        data: {
          inviterName,
          communityName,
          inviteLink,
        },
      }),
    });

    if (!response.ok) {
      console.error('Failed to send SMS invitation');
    }
  } catch (error) {
    console.error('Error sending SMS invitation:', error);
  }
}

// ============================================
// 通知查询
// ============================================

/**
 * 获取用户的通知列表
 */
async function getUserNotifications(
  userId: string,
  options?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<InvitationNotification[]> {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options?.unreadOnly) {
    query = query.eq('is_read', false);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return (data || []).map(mapNotificationFromDB);
}

/**
 * 标记通知为已读
 */
async function markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('标记通知失败');
  }
}

/**
 * 标记所有通知为已读
 */
async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('标记通知失败');
  }
}

/**
 * 获取未读通知数量
 */
async function getUnreadCount(userId: string): Promise<number> {
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

/**
 * 删除通知
 */
async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting notification:', error);
    throw new Error('删除通知失败');
  }
}

// ============================================
// 实时通知
// ============================================

/**
 * 发送实时通知（通过WebSocket）
 */
async function sendRealtimeNotification(
  recipientId: string,
  notification: any
): Promise<void> {
  // Realtime 功能已禁用 - 本地开发环境不支持 WebSocket
  // Realtime disabled - WebSocket not supported in local dev environment
  console.log('[NotificationService] Realtime notification skipped (not supported in local environment)');
}

/**
 * 订阅用户通知
 */
function subscribeToNotifications(
  userId: string,
  callback: (notification: any) => void
): () => void {
  // Realtime 功能已禁用 - 本地开发环境不支持 WebSocket
  // Realtime disabled - WebSocket not supported in local dev environment
  console.log('[NotificationService] Realtime subscription skipped (not supported in local environment)');

  // 返回空函数作为取消订阅的占位符
  return () => {};
}

// ============================================
// 辅助函数
// ============================================

/**
 * 获取通知模板
 */
function getNotificationTemplate(type: string): { title: string; content: string } {
  const templates: Record<string, { title: string; content: string }> = {
    new_application: {
      title: '新的入群申请',
      content: '您收到一个新的入群申请，请尽快审核',
    },
    system: {
      title: '系统通知',
      content: '您有一条新的系统通知',
    },
  };

  return templates[type] || { title: '新通知', content: '您有一条新通知' };
}

/**
 * 构建邀请通知内容
 */
function buildInvitationNotificationContent(
  type: InvitationNotification['type'],
  senderName: string,
  communityName: string
): { title: string; content: string } {
  switch (type) {
    case 'invitation_received':
      return {
        title: `收到社群邀请`,
        content: `${senderName} 邀请您加入社群「${communityName}」`,
      };
    case 'invitation_accepted':
      return {
        title: `邀请已被接受`,
        content: `${senderName} 已接受您的邀请，加入了「${communityName}」`,
      };
    case 'invitation_rejected':
      return {
        title: `邀请已被拒绝`,
        content: `${senderName} 拒绝了您的邀请`,
      };
    case 'application_approved':
      return {
        title: `入群申请已通过`,
        content: `恭喜！您的「${communityName}」入群申请已被批准`,
      };
    case 'application_rejected':
      return {
        title: `入群申请未通过`,
        content: `抱歉，您的「${communityName}」入群申请未被批准`,
      };
    default:
      return {
        title: '新通知',
        content: '您有一条新通知',
      };
  }
}

/**
 * 构建通知链接
 */
function buildNotificationLink(
  type: string,
  communityId?: string,
  invitationId?: string,
  requestId?: string
): string {
  if (type === 'invitation_received' && invitationId) {
    return `/invitations/${invitationId}`;
  }
  if (type === 'application_approved' && communityId) {
    return `/community/${communityId}`;
  }
  if (communityId) {
    return `/community/${communityId}/manage/applications`;
  }
  return '/notifications';
}

/**
 * 数据映射
 */
function mapNotificationFromDB(data: any): InvitationNotification {
  return {
    id: data.id,
    type: data.type,
    title: data.title,
    content: data.content,
    senderId: data.sender_id,
    recipientId: data.user_id,
    communityId: data.community_id,
    invitationId: data.related_type === 'invitation' ? data.related_id : undefined,
    requestId: data.related_type === 'join_request' ? data.related_id : undefined,
    isRead: data.is_read,
    createdAt: data.created_at,
  };
}

// ============================================
// 导出
// ============================================

export const notificationService = {
  sendNotification,
  sendInvitationNotification,
  sendEmailInvitation,
  sendSMSInvitation,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  deleteNotification,
  subscribeToNotifications,
};

export default notificationService;
