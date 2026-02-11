import { supabase, supabaseAdmin } from '@/lib/supabase';

// 反馈类型
export type FeedbackType = 'bug' | 'feature' | 'complaint' | 'inquiry' | 'other';
export type FeedbackStatus = 'pending' | 'processing' | 'resolved' | 'rejected' | 'closed';
export type FeedbackPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ContactType = 'email' | 'phone' | 'wechat' | 'other';

// 反馈类型配置
export const FEEDBACK_TYPE_CONFIG: Record<FeedbackType, { label: string; color: string; icon: string }> = {
  bug: { label: '功能异常', color: '#ef4444', icon: 'bug' },
  feature: { label: '功能建议', color: '#3b82f6', icon: 'lightbulb' },
  complaint: { label: '投诉建议', color: '#f59e0b', icon: 'exclamation-triangle' },
  inquiry: { label: '咨询问题', color: '#10b981', icon: 'question-circle' },
  other: { label: '其他', color: '#6b7280', icon: 'comment' }
};

// 反馈状态配置
export const FEEDBACK_STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待处理', color: '#f59e0b', bgColor: 'bg-yellow-100' },
  processing: { label: '处理中', color: '#3b82f6', bgColor: 'bg-blue-100' },
  resolved: { label: '已解决', color: '#10b981', bgColor: 'bg-green-100' },
  rejected: { label: '已拒绝', color: '#6b7280', bgColor: 'bg-gray-100' },
  closed: { label: '已关闭', color: '#8b5cf6', bgColor: 'bg-purple-100' }
};

// 优先级配置
export const FEEDBACK_PRIORITY_CONFIG: Record<FeedbackPriority, { label: string; color: string; value: number }> = {
  low: { label: '低', color: '#6b7280', value: 1 },
  normal: { label: '普通', color: '#3b82f6', value: 2 },
  high: { label: '高', color: '#f59e0b', value: 3 },
  urgent: { label: '紧急', color: '#ef4444', value: 4 }
};

// 反馈数据类型
export interface Feedback {
  id: string;
  user_id: string | null;
  type: FeedbackType;
  title?: string;
  content: string;
  contact_info?: string;
  contact_type?: ContactType;
  screenshots: string[];
  device_info?: {
    os?: string;
    browser?: string;
    screen?: string;
    userAgent?: string;
  };
  browser_info?: string;
  page_url?: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  assigned_to?: string;
  response_content?: string;
  responded_at?: string;
  responded_by?: string;
  is_notified: boolean;
  notified_at?: string;
  created_at: string;
  updated_at: string;
  // 关联数据
  user?: {
    id: string;
    username: string;
    email: string;
    avatar_url?: string;
  };
  assignee?: {
    id: string;
    username: string;
  };
  responder?: {
    id: string;
    username: string;
  };
}

// 处理日志类型
export interface FeedbackProcessLog {
  id: string;
  feedback_id: string;
  admin_id?: string;
  action: string;
  old_value?: string;
  new_value?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
  admin?: {
    id: string;
    username: string;
  };
}

// 用户通知类型
export interface UserNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string;
  related_id?: string;
  related_type?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

// 反馈统计数据
export interface FeedbackStats {
  total_count: number;
  pending_count: number;
  processing_count: number;
  resolved_count: number;
  today_count: number;
  avg_process_hours: number;
}

class FeedbackService {
  // 提交反馈
  async submitFeedback(data: {
    type: FeedbackType;
    title?: string;
    content: string;
    contact_info?: string;
    contact_type?: ContactType;
    screenshots?: string[];
    device_info?: Feedback['device_info'];
    browser_info?: string;
    page_url?: string;
    user_id?: string;
  }): Promise<Feedback | null> {
    const { data: feedback, error } = await supabase
      .from('user_feedbacks')
      .insert({
        ...data,
        screenshots: data.screenshots || [],
        status: 'pending',
        priority: 'normal'
      })
      .select()
      .single();

    if (error) {
      console.error('提交反馈失败:', error);
      throw error;
    }

    return feedback;
  }

  // 获取反馈列表
  async getFeedbacks(options?: {
    page?: number;
    limit?: number;
    status?: FeedbackStatus;
    type?: FeedbackType;
    priority?: FeedbackPriority;
    assigned_to?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ feedbacks: Feedback[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    let query = supabase
      .from('user_feedbacks')
      .select('*', { count: 'exact' });

    // 应用筛选条件
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.type) {
      query = query.eq('type', options.type);
    }
    if (options?.priority) {
      query = query.eq('priority', options.priority);
    }
    if (options?.assigned_to) {
      query = query.eq('assigned_to', options.assigned_to);
    }
    if (options?.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate);
    }
    if (options?.search) {
      query = query.or(`content.ilike.%${options.search}%,title.ilike.%${options.search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('获取反馈列表失败:', error);
      throw error;
    }

    // 获取关联的用户信息
    const feedbacks = data || [];
    const userIds = [...new Set(feedbacks.filter(f => f.user_id).map(f => f.user_id))];
    const adminIds = [...new Set([
      ...feedbacks.filter(f => f.assigned_to).map(f => f.assigned_to),
      ...feedbacks.filter(f => f.responded_by).map(f => f.responded_by)
    ])];

    // 批量获取用户信息（如果失败则使用占位数据）
    let usersMap: Record<string, any> = {};
    let adminsMap: Record<string, any> = {};

    if (userIds.length > 0) {
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, username, email, avatar_url')
        .in('id', userIds);
      if (!userError && users) {
        usersMap = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
      }
    }

    if (adminIds.length > 0) {
      const { data: admins, error: adminError } = await supabase
        .from('admin_accounts')
        .select('id, username')
        .in('id', adminIds);
      if (!adminError && admins) {
        adminsMap = admins.reduce((acc, a) => ({ ...acc, [a.id]: a }), {});
      }
    }

    // 合并数据
    const enrichedFeedbacks = feedbacks.map(f => ({
      ...f,
      user: f.user_id ? usersMap[f.user_id] || { username: '未知用户' } : { username: '匿名用户' },
      assignee: f.assigned_to ? adminsMap[f.assigned_to] || { username: '未知管理员' } : null,
      responder: f.responded_by ? adminsMap[f.responded_by] || { username: '未知管理员' } : null
    }));

    return {
      feedbacks: enrichedFeedbacks,
      total: count || 0
    };
  }

  // 获取单个反馈详情
  async getFeedbackById(feedbackId: string): Promise<Feedback | null> {
    const { data, error } = await supabase
      .from('user_feedbacks')
      .select('*')
      .eq('id', feedbackId)
      .single();

    if (error) {
      console.error('获取反馈详情失败:', error);
      return null;
    }

    if (!data) return null;

    // 获取关联信息
    const feedback = data;
    let user = { username: feedback.user_id ? '未知用户' : '匿名用户' };
    let assignee = null;
    let responder = null;

    if (feedback.user_id) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, email, avatar_url')
        .eq('id', feedback.user_id)
        .single();
      if (!userError && userData) {
        user = userData;
      }
    }

    if (feedback.assigned_to) {
      const { data: adminData, error: adminError } = await supabase
        .from('admin_accounts')
        .select('id, username')
        .eq('id', feedback.assigned_to)
        .single();
      if (!adminError && adminData) {
        assignee = adminData;
      }
    }

    if (feedback.responded_by) {
      const { data: responderData, error: responderError } = await supabase
        .from('admin_accounts')
        .select('id, username')
        .eq('id', feedback.responded_by)
        .single();
      if (!responderError && responderData) {
        responder = responderData;
      }
    }

    return {
      ...feedback,
      user,
      assignee,
      responder
    };
  }

  // 更新反馈状态
  async updateFeedbackStatus(
    feedbackId: string,
    status: FeedbackStatus,
    adminId?: string
  ): Promise<boolean> {
    const updates: any = { status };

    if (status === 'resolved' || status === 'rejected') {
      updates.responded_at = new Date().toISOString();
      updates.responded_by = adminId;
    }

    const { error } = await supabase
      .from('user_feedbacks')
      .update(updates)
      .eq('id', feedbackId);

    if (error) {
      console.error('更新反馈状态失败:', error);
      return false;
    }

    // 记录处理日志
    if (adminId) {
      await this.logProcess(feedbackId, adminId, 'status_change', undefined, status);
    }

    return true;
  }

  // 分配反馈给管理员
  async assignFeedback(
    feedbackId: string,
    adminId: string,
    assignedBy?: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('user_feedbacks')
      .update({
        assigned_to: adminId,
        status: 'processing'
      })
      .eq('id', feedbackId);

    if (error) {
      console.error('分配反馈失败:', error);
      return false;
    }

    // 记录处理日志
    if (assignedBy) {
      await this.logProcess(feedbackId, assignedBy, 'assign', undefined, adminId);
    }

    return true;
  }

  // 设置优先级
  async setPriority(
    feedbackId: string,
    priority: FeedbackPriority,
    adminId?: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('user_feedbacks')
      .update({ priority })
      .eq('id', feedbackId);

    if (error) {
      console.error('设置优先级失败:', error);
      return false;
    }

    if (adminId) {
      await this.logProcess(feedbackId, adminId, 'priority_change', undefined, priority);
    }

    return true;
  }

  // 提交处理结果
  async submitResponse(
    feedbackId: string,
    responseContent: string,
    adminId: string,
    notifyUser: boolean = true
  ): Promise<boolean> {
    const { error } = await supabase
      .from('user_feedbacks')
      .update({
        response_content: responseContent,
        responded_at: new Date().toISOString(),
        responded_by: adminId,
        status: 'resolved'
      })
      .eq('id', feedbackId);

    if (error) {
      console.error('提交处理结果失败:', error);
      return false;
    }

    // 记录处理日志
    await this.logProcess(feedbackId, adminId, 'respond', undefined, undefined, {
      response_content: responseContent
    });

    // 通知用户
    if (notifyUser) {
      await this.notifyUser(feedbackId, responseContent);
    }

    return true;
  }

  // 通知用户处理结果
  async notifyUser(feedbackId: string, responseContent: string): Promise<boolean> {
    try {
      // 获取反馈信息
      const feedback = await this.getFeedbackById(feedbackId);
      if (!feedback || !feedback.user_id) {
        console.warn('无法通知用户：反馈不存在或无用户ID');
        return false;
      }

      // 尝试使用RPC函数
      try {
        const { error } = await supabase
          .rpc('send_user_notification', {
            p_user_id: feedback.user_id,
            p_type: 'feedback_response',
            p_title: '您的反馈已得到回复',
            p_content: `关于您提交的"${FEEDBACK_TYPE_CONFIG[feedback.type].label}"反馈，管理员已回复：${responseContent.substring(0, 100)}${responseContent.length > 100 ? '...' : ''}`,
            p_related_id: feedbackId,
            p_related_type: 'feedback'
          });

        if (!error) {
          // 更新反馈通知状态
          await supabase
            .from('user_feedbacks')
            .update({
              is_notified: true,
              notified_at: new Date().toISOString()
            })
            .eq('id', feedbackId);

          return true;
        }
      } catch (error) {
        console.log('RPC调用失败，使用备用方案');
      }

      // 备用方案：直接插入通知
      const { error: insertError } = await supabase
        .from('user_notifications')
        .insert({
          user_id: feedback.user_id,
          type: 'feedback_response',
          title: '您的反馈已得到回复',
          content: `关于您提交的"${FEEDBACK_TYPE_CONFIG[feedback.type].label}"反馈，管理员已回复：${responseContent.substring(0, 100)}${responseContent.length > 100 ? '...' : ''}`,
          related_id: feedbackId,
          related_type: 'feedback'
        });

      if (insertError) {
        console.error('发送通知失败:', insertError);
        return false;
      }

      // 更新反馈通知状态
      await supabase
        .from('user_feedbacks')
        .update({
          is_notified: true,
          notified_at: new Date().toISOString()
        })
        .eq('id', feedbackId);

      return true;
    } catch (error) {
      console.error('通知用户失败:', error);
      return false;
    }
  }

  // 获取处理日志
  async getProcessLogs(feedbackId: string): Promise<FeedbackProcessLog[]> {
    const { data, error } = await supabase
      .from('feedback_process_logs')
      .select('*')
      .eq('feedback_id', feedbackId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('获取处理日志失败:', error);
      return [];
    }

    const logs = data || [];
    const adminIds = [...new Set(logs.filter(l => l.admin_id).map(l => l.admin_id))];

    // 批量获取管理员信息
    let adminsMap: Record<string, any> = {};
    if (adminIds.length > 0) {
      const { data: admins, error: adminError } = await supabase
        .from('admin_accounts')
        .select('id, username')
        .in('id', adminIds);
      if (!adminError && admins) {
        adminsMap = admins.reduce((acc, a) => ({ ...acc, [a.id]: a }), {});
      }
    }

    // 合并数据
    return logs.map(log => ({
      ...log,
      admin: log.admin_id ? adminsMap[log.admin_id] || { username: '未知管理员' } : null
    }));
  }

  // 记录处理日志
  async logProcess(
    feedbackId: string,
    adminId: string,
    action: string,
    oldValue?: string,
    newValue?: string,
    details?: Record<string, any>
  ): Promise<string | null> {
    try {
      // 尝试使用RPC函数
      const { data, error } = await supabase
        .rpc('log_feedback_process', {
          p_feedback_id: feedbackId,
          p_admin_id: adminId,
          p_action: action,
          p_old_value: oldValue,
          p_new_value: newValue,
          p_details: details
        });

      if (!error && data) {
        return data;
      }
    } catch (error) {
      console.log('RPC调用失败，使用备用方案');
    }

    // 备用方案：直接插入
    try {
      const { data, error } = await supabase
        .from('feedback_process_logs')
        .insert({
          feedback_id: feedbackId,
          admin_id: adminId,
          action,
          old_value: oldValue,
          new_value: newValue,
          details
        })
        .select('id')
        .single();

      if (error) {
        console.error('记录处理日志失败:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('记录处理日志失败:', error);
      return null;
    }
  }

  // 删除反馈
  async deleteFeedback(feedbackId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_feedbacks')
      .delete()
      .eq('id', feedbackId);

    if (error) {
      console.error('删除反馈失败:', error);
      return false;
    }

    return true;
  }

  // 获取统计数据
  async getStats(): Promise<FeedbackStats> {
    try {
      // 尝试使用RPC函数
      const { data, error } = await supabase
        .rpc('get_feedback_stats');

      if (!error && data) {
        return data;
      }
    } catch (error) {
      console.log('RPC调用失败，使用备用方案');
    }

    // 备用方案：直接查询
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: allFeedbacks, error } = await supabase
        .from('user_feedbacks')
        .select('status, created_at, responded_at');

      if (error) throw error;

      const feedbacks = allFeedbacks || [];
      const todayCount = feedbacks.filter(f => new Date(f.created_at) >= today).length;
      const pendingCount = feedbacks.filter(f => f.status === 'pending').length;
      const processingCount = feedbacks.filter(f => f.status === 'processing').length;
      const resolvedCount = feedbacks.filter(f => f.status === 'resolved').length;

      // 计算平均处理时长
      const resolvedFeedbacks = feedbacks.filter(f => f.status === 'resolved' && f.responded_at);
      let avgHours = 0;
      if (resolvedFeedbacks.length > 0) {
        const totalHours = resolvedFeedbacks.reduce((sum, f) => {
          const created = new Date(f.created_at).getTime();
          const responded = new Date(f.responded_at!).getTime();
          return sum + (responded - created) / (1000 * 60 * 60);
        }, 0);
        avgHours = Math.round((totalHours / resolvedFeedbacks.length) * 100) / 100;
      }

      return {
        total_count: feedbacks.length,
        pending_count: pendingCount,
        processing_count: processingCount,
        resolved_count: resolvedCount,
        today_count: todayCount,
        avg_process_hours: avgHours
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return {
        total_count: 0,
        pending_count: 0,
        processing_count: 0,
        resolved_count: 0,
        today_count: 0,
        avg_process_hours: 0
      };
    }
  }

  // 获取用户的反馈历史
  async getUserFeedbacks(userId: string): Promise<Feedback[]> {
    const { data, error } = await supabase
      .from('user_feedbacks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取用户反馈历史失败:', error);
      return [];
    }

    return data || [];
  }

  // 获取用户的通知
  async getUserNotifications(userId: string, options?: {
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<UserNotification[]> {
    let query = supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId);

    if (options?.unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取用户通知失败:', error);
      return [];
    }

    return data || [];
  }

  // 标记通知为已读
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) {
      console.error('标记通知已读失败:', error);
      return false;
    }

    return true;
  }

  // 标记所有通知为已读
  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('标记所有通知已读失败:', error);
      return false;
    }

    return true;
  }
}

export const feedbackService = new FeedbackService();
