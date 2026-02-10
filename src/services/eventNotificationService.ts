import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// 通知类型
export type NotificationType =
  | 'registration_confirmed'   // 报名确认
  | 'submission_reminder'      // 提交提醒
  | 'deadline_warning'         // 截止警告
  | 'submission_received'      // 提交已收到
  | 'review_started'           // 评审开始
  | 'review_completed'         // 评审完成
  | 'result_published'         // 结果公布
  | 'award_received'           // 获奖通知
  | 'event_updated'            // 活动更新
  | 'event_cancelled';         // 活动取消

// 通知接口
export interface EventNotification {
  id: string;
  userId: string;
  eventId?: string;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  isImportant: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata: Record<string, any>;
  createdAt: string;
  readAt?: string;
  event?: {
    title: string;
    thumbnailUrl?: string;
  };
}

// 通知筛选选项
export interface NotificationFilter {
  isRead?: boolean;
  type?: NotificationType;
  isImportant?: boolean;
}

// 通知统计
export interface NotificationStats {
  total: number;
  unread: number;
  important: number;
  byType: Record<NotificationType, number>;
}

class EventNotificationService {
  private channels: Map<string, RealtimeChannel> = new Map();

  /**
   * 获取用户通知列表
   */
  async getUserNotifications(
    userId: string,
    filter: NotificationFilter = {},
    pagination: { page?: number; pageSize?: number } = {}
  ): Promise<{ data: EventNotification[]; total: number }> {
    try {
      const { page = 1, pageSize = 20 } = pagination;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('user_notification_summary')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (filter.isRead !== undefined) {
        query = query.eq('is_read', filter.isRead);
      }

      if (filter.type) {
        query = query.eq('type', filter.type);
      }

      if (filter.isImportant !== undefined) {
        query = query.eq('is_important', filter.isImportant);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const formattedData: EventNotification[] = (data || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        eventId: item.event_id,
        type: item.type as NotificationType,
        title: item.title,
        content: item.content,
        isRead: item.is_read,
        isImportant: item.is_important,
        actionUrl: item.action_url,
        actionText: item.action_text,
        metadata: item.metadata || {},
        createdAt: item.created_at,
        readAt: item.read_at,
        event: item.event_id ? {
          title: item.event_title || '',
          thumbnailUrl: item.event_thumbnail,
        } : undefined,
      }));

      return { data: formattedData, total: count || 0 };
    } catch (error) {
      console.error('获取通知失败:', error);
      return { data: [], total: 0 };
    }
  }

  /**
   * 获取未读通知数
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('get_unread_notification_count', { p_user_id: userId });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('获取未读通知数失败:', error);
      return 0;
    }
  }

  /**
   * 获取通知统计
   */
  async getNotificationStats(userId: string): Promise<NotificationStats> {
    try {
      const { data, error } = await supabase
        .from('event_notifications')
        .select('type, is_read, is_important')
        .eq('user_id', userId);

      if (error) throw error;

      const stats: NotificationStats = {
        total: 0,
        unread: 0,
        important: 0,
        byType: {
          registration_confirmed: 0,
          submission_reminder: 0,
          deadline_warning: 0,
          submission_received: 0,
          review_started: 0,
          review_completed: 0,
          result_published: 0,
          award_received: 0,
          event_updated: 0,
          event_cancelled: 0,
        },
      };

      (data || []).forEach((item: any) => {
        stats.total++;
        if (!item.is_read) stats.unread++;
        if (item.is_important) stats.important++;
        if (item.type in stats.byType) {
          stats.byType[item.type as NotificationType]++;
        }
      });

      return stats;
    } catch (error) {
      console.error('获取通知统计失败:', error);
      return {
        total: 0,
        unread: 0,
        important: 0,
        byType: {
          registration_confirmed: 0,
          submission_reminder: 0,
          deadline_warning: 0,
          submission_received: 0,
          review_started: 0,
          review_completed: 0,
          result_published: 0,
          award_received: 0,
          event_updated: 0,
          event_cancelled: 0,
        },
      };
    }
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('event_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('标记通知已读失败:', error);
      return false;
    }
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('event_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('标记所有通知已读失败:', error);
      return false;
    }
  }

  /**
   * 删除通知
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('event_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('删除通知失败:', error);
      return false;
    }
  }

  /**
   * 删除所有已读通知
   */
  async deleteAllRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('event_notifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_read', true);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('删除已读通知失败:', error);
      return false;
    }
  }

  /**
   * 订阅实时通知
   */
  subscribeToNotifications(
    userId: string,
    callbacks: {
      onInsert?: (notification: EventNotification) => void;
      onUpdate?: (notification: EventNotification) => void;
      onDelete?: (notificationId: string) => void;
    }
  ): () => void {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (callbacks.onInsert) {
            callbacks.onInsert(this.formatNotification(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'event_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (callbacks.onUpdate) {
            callbacks.onUpdate(this.formatNotification(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'event_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (callbacks.onDelete) {
            callbacks.onDelete(payload.old.id);
          }
        }
      )
      .subscribe();

    this.channels.set(userId, channel);

    return () => {
      supabase.removeChannel(channel);
      this.channels.delete(userId);
    };
  }

  /**
   * 获取通知类型配置
   */
  getNotificationTypeConfig(type: NotificationType): {
    label: string;
    icon: string;
    color: string;
    bgColor: string;
  } {
    const configs: Record<NotificationType, { label: string; icon: string; color: string; bgColor: string }> = {
      registration_confirmed: {
        label: '报名确认',
        icon: 'fa-check-circle',
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
      },
      submission_reminder: {
        label: '提交提醒',
        icon: 'fa-clock',
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      },
      deadline_warning: {
        label: '截止警告',
        icon: 'fa-exclamation-triangle',
        color: 'text-orange-500',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      },
      submission_received: {
        label: '提交已收到',
        icon: 'fa-inbox',
        color: 'text-purple-500',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      },
      review_started: {
        label: '评审开始',
        icon: 'fa-search',
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      },
      review_completed: {
        label: '评审完成',
        icon: 'fa-clipboard-check',
        color: 'text-teal-500',
        bgColor: 'bg-teal-100 dark:bg-teal-900/30',
      },
      result_published: {
        label: '结果公布',
        icon: 'fa-bullhorn',
        color: 'text-cyan-500',
        bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
      },
      award_received: {
        label: '获奖通知',
        icon: 'fa-trophy',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      },
      event_updated: {
        label: '活动更新',
        icon: 'fa-sync',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
      },
      event_cancelled: {
        label: '活动取消',
        icon: 'fa-times-circle',
        color: 'text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
      },
    };

    return configs[type] || {
      label: '系统通知',
      icon: 'fa-bell',
      color: 'text-gray-500',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
    };
  }

  /**
   * 格式化时间显示
   */
  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    
    return date.toLocaleDateString('zh-CN');
  }

  /**
   * 格式化通知数据
   */
  private formatNotification(data: any): EventNotification {
    return {
      id: data.id,
      userId: data.user_id,
      eventId: data.event_id,
      type: data.type as NotificationType,
      title: data.title,
      content: data.content,
      isRead: data.is_read,
      isImportant: data.is_important,
      actionUrl: data.action_url,
      actionText: data.action_text,
      metadata: data.metadata || {},
      createdAt: data.created_at,
      readAt: data.read_at,
    };
  }
}

export const eventNotificationService = new EventNotificationService();
