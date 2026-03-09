/**
 * 管理员反馈管理服务
 */

import { supabase } from '@/lib/supabase';
import {
  FeedbackItem,
  FeedbackFilterParams,
  FeedbackStats,
  FeedbackStatus,
  FeedbackPriority
} from '@/types/feedback';
import { toast } from 'sonner';

/**
 * 获取所有反馈列表
 */
export async function getAllFeedbacks(params: FeedbackFilterParams = {}): Promise<{
  data: FeedbackItem[];
  total: number;
}> {
  try {
    let query = supabase
      .from('feedbacks')
      .select('*', { count: 'exact' });

    // 搜索
    if (params.search) {
      query = query.or(`user_name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }

    // 状态筛选
    if (params.status) {
      query = query.eq('status', params.status);
    }

    // 类型筛选
    if (params.type) {
      query = query.eq('type', params.type);
    }

    // 优先级筛选
    if (params.priority) {
      query = query.eq('priority', params.priority);
    }

    // 分页
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0
    };
  } catch (error: any) {
    console.error('获取反馈列表失败:', error);
    toast.error(error.message || '获取反馈列表失败');
    return { data: [], total: 0 };
  }
}

/**
 * 更新反馈状态
 */
export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus
): Promise<void> {
  try {
    const { error } = await supabase
      .from('feedbacks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    toast.success('状态更新成功');
  } catch (error: any) {
    console.error('更新状态失败:', error);
    toast.error(error.message || '更新状态失败');
    throw error;
  }
}

/**
 * 更新反馈优先级
 */
export async function updateFeedbackPriority(
  id: string,
  priority: FeedbackPriority
): Promise<void> {
  try {
    const { error } = await supabase
      .from('feedbacks')
      .update({ priority, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    toast.success('优先级更新成功');
  } catch (error: any) {
    console.error('更新优先级失败:', error);
    toast.error(error.message || '更新优先级失败');
    throw error;
  }
}

/**
 * 回复反馈
 */
export async function replyToFeedback(id: string, reply: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('feedbacks')
      .update({
        admin_reply: reply,
        status: 'resolved',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    toast.success('回复成功');
  } catch (error: any) {
    console.error('回复失败:', error);
    toast.error(error.message || '回复失败');
    throw error;
  }
}

/**
 * 删除反馈
 */
export async function deleteFeedback(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('feedbacks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    toast.success('删除成功');
  } catch (error: any) {
    console.error('删除失败:', error);
    toast.error(error.message || '删除失败');
    throw error;
  }
}

/**
 * 获取反馈统计数据
 */
export async function getFeedbackStats(): Promise<FeedbackStats> {
  try {
    // 获取总数
    const { count: total } = await supabase
      .from('feedbacks')
      .select('*', { count: 'exact', head: true });

    // 获取今日反馈数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayCount } = await supabase
      .from('feedbacks')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // 获取各状态数量
    const { data: statusData } = await supabase
      .from('feedbacks')
      .select('status');

    const statusCounts = statusData?.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      total: total || 0,
      today: todayCount || 0,
      pending: statusCounts['pending'] || 0,
      processing: statusCounts['processing'] || 0,
      resolved: statusCounts['resolved'] || 0
    };
  } catch (error: any) {
    console.error('获取统计数据失败:', error);
    return {
      total: 0,
      today: 0,
      pending: 0,
      processing: 0,
      resolved: 0
    };
  }
}

/**
 * 获取单个反馈详情
 */
export async function getFeedbackById(id: string): Promise<FeedbackItem | null> {
  try {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data;
  } catch (error: any) {
    console.error('获取反馈详情失败:', error);
    return null;
  }
}
