/**
 * AI反馈服务
 * 处理用户对AI回复的反馈数据收集和管理
 */

import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase';

// AI反馈类型
export type AIFeedbackType = 'satisfaction' | 'quality' | 'accuracy' | 'helpfulness' | 'other';

// AI反馈数据接口
export interface AIFeedback {
  id: string;
  userId: string | null;
  userName: string;
  userAvatar?: string;
  sessionId: string;
  conversationId?: string;
  messageId?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedbackType: AIFeedbackType;
  comment?: string;
  aiModel: string;
  aiResponse: string;
  userQuery: string;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

// 提交AI反馈的数据接口
export interface SubmitAIFeedbackData {
  userId?: string;
  userName?: string;
  userAvatar?: string;
  sessionId: string;
  conversationId?: string;
  messageId?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedbackType?: AIFeedbackType;
  comment?: string;
  aiModel?: string;
  aiResponse: string;
  userQuery: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

// 反馈统计数据接口
export interface AIFeedbackStats {
  totalCount: number;
  avgRating: number;
  unreadCount: number;
  rating5Count: number;
  rating4Count: number;
  rating3Count: number;
  rating2Count: number;
  rating1Count: number;
}

// 反馈列表查询选项
export interface AIFeedbackQueryOptions {
  page?: number;
  limit?: number;
  rating?: number;
  feedbackType?: AIFeedbackType;
  isRead?: boolean;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}

// 反馈类型配置
export const FEEDBACK_TYPE_CONFIG: Record<AIFeedbackType, { name: string; color: string; bgColor: string }> = {
  'satisfaction': { name: '满意度', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' },
  'quality': { name: '内容质量', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.1)' },
  'accuracy': { name: '准确性', color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.1)' },
  'helpfulness': { name: '有用性', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)' },
  'other': { name: '其他', color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.1)' },
};

// 评分配置
export const RATING_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: '非常不满意', color: '#EF4444' },
  2: { label: '不满意', color: '#F97316' },
  3: { label: '一般', color: '#EAB308' },
  4: { label: '满意', color: '#22C55E' },
  5: { label: '非常满意', color: '#10B981' },
};

class AIFeedbackService {
  private readonly STORAGE_KEY = 'ai_feedback_pending';

  /**
   * 提交AI反馈
   */
  async submitFeedback(data: SubmitAIFeedbackData): Promise<AIFeedback | null> {
    try {
      // 准备插入数据
      const insertData = {
        user_id: data.userId || null,
        user_name: data.userName || '匿名用户',
        user_avatar: data.userAvatar,
        session_id: data.sessionId,
        conversation_id: data.conversationId,
        message_id: data.messageId,
        rating: data.rating,
        feedback_type: data.feedbackType || 'satisfaction',
        comment: data.comment,
        ai_model: data.aiModel || 'unknown',
        ai_response: data.aiResponse,
        user_query: data.userQuery,
        tags: data.tags || [],
        metadata: data.metadata || {},
        is_read: false,
      };

      // 尝试保存到数据库（使用 admin 客户端绕过 RLS）
      const { data: feedback, error } = await supabaseAdmin
        .from('ai_feedback')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.warn('保存AI反馈到数据库失败:', error);
        // 保存到本地存储作为备份
        this.saveToLocalStorage(data);
        return null;
      }

      console.log('[AIFeedbackService] 反馈提交成功:', feedback);
      return this.formatFeedback(feedback);
    } catch (error) {
      console.error('提交AI反馈失败:', error);
      // 保存到本地存储作为备份
      this.saveToLocalStorage(data);
      return null;
    }
  }

  /**
   * 获取AI反馈列表（管理员用）
   */
  async getFeedbackList(options: AIFeedbackQueryOptions = {}): Promise<{ feedbacks: AIFeedback[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      rating,
      feedbackType,
      isRead,
      searchQuery,
      startDate,
      endDate,
    } = options;

    try {
      // 使用RPC函数获取反馈列表
      const { data, error } = await supabaseAdmin
        .rpc('get_ai_feedback_list', {
          p_rating: rating || null,
          p_feedback_type: feedbackType || null,
          p_is_read: isRead !== undefined ? isRead : null,
          p_search_query: searchQuery || null,
          p_start_date: startDate || null,
          p_end_date: endDate || null,
          p_limit: limit,
          p_offset: (page - 1) * limit,
        });

      if (error) {
        console.warn('使用RPC获取AI反馈列表失败:', error);
        // 回退到直接查询
        return this.getFeedbackListFallback(options);
      }

      if (!data || data.length === 0) {
        return { feedbacks: [], total: 0 };
      }

      const feedbacks = data.map((item: any) => this.formatFeedback(item));
      const total = data[0]?.total_count || 0;

      return { feedbacks, total: Number(total) };
    } catch (error) {
      console.error('获取AI反馈列表失败:', error);
      return this.getFeedbackListFallback(options);
    }
  }

  /**
   * 获取AI反馈列表的备用方案（直接查询）
   */
  private async getFeedbackListFallback(options: AIFeedbackQueryOptions = {}): Promise<{ feedbacks: AIFeedback[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      rating,
      feedbackType,
      isRead,
      searchQuery,
      startDate,
      endDate,
    } = options;

    try {
      let query = supabaseAdmin
        .from('ai_feedback')
        .select('*', { count: 'exact' });

      // 应用筛选条件
      if (rating) {
        query = query.eq('rating', rating);
      }
      if (feedbackType) {
        query = query.eq('feedback_type', feedbackType);
      }
      if (isRead !== undefined) {
        query = query.eq('is_read', isRead);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }
      if (searchQuery) {
        query = query.or(`user_name.ilike.%${searchQuery}%,comment.ilike.%${searchQuery}%,user_query.ilike.%${searchQuery}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        console.error('备用查询AI反馈列表失败:', error);
        return { feedbacks: [], total: 0 };
      }

      const feedbacks = (data || []).map((item: any) => this.formatFeedback(item));
      return { feedbacks, total: count || 0 };
    } catch (error) {
      console.error('备用查询AI反馈列表失败:', error);
      return { feedbacks: [], total: 0 };
    }
  }

  /**
   * 获取AI反馈统计数据
   */
  async getFeedbackStats(startDate?: string, endDate?: string): Promise<AIFeedbackStats> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_ai_feedback_stats', {
          p_start_date: startDate || null,
          p_end_date: endDate || null,
        });

      if (error || !data || data.length === 0) {
        console.warn('使用RPC获取AI反馈统计失败:', error);
        return this.getFeedbackStatsFallback(startDate, endDate);
      }

      const stats = data[0];
      return {
        totalCount: Number(stats.total_count) || 0,
        avgRating: Number(stats.avg_rating) || 0,
        unreadCount: Number(stats.unread_count) || 0,
        rating5Count: Number(stats.rating_5_count) || 0,
        rating4Count: Number(stats.rating_4_count) || 0,
        rating3Count: Number(stats.rating_3_count) || 0,
        rating2Count: Number(stats.rating_2_count) || 0,
        rating1Count: Number(stats.rating_1_count) || 0,
      };
    } catch (error) {
      console.error('获取AI反馈统计失败:', error);
      return this.getFeedbackStatsFallback(startDate, endDate);
    }
  }

  /**
   * 获取AI反馈统计的备用方案
   */
  private async getFeedbackStatsFallback(startDate?: string, endDate?: string): Promise<AIFeedbackStats> {
    try {
      let query = supabaseAdmin.from('ai_feedback').select('rating, is_read');

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('备用查询AI反馈统计失败:', error);
        return this.getDefaultStats();
      }

      const feedbacks = data || [];
      const totalCount = feedbacks.length;

      if (totalCount === 0) {
        return this.getDefaultStats();
      }

      const sumRating = feedbacks.reduce((acc, item) => acc + (item.rating || 0), 0);
      const unreadCount = feedbacks.filter(item => !item.is_read).length;

      return {
        totalCount,
        avgRating: parseFloat((sumRating / totalCount).toFixed(1)),
        unreadCount,
        rating5Count: feedbacks.filter(item => item.rating === 5).length,
        rating4Count: feedbacks.filter(item => item.rating === 4).length,
        rating3Count: feedbacks.filter(item => item.rating === 3).length,
        rating2Count: feedbacks.filter(item => item.rating === 2).length,
        rating1Count: feedbacks.filter(item => item.rating === 1).length,
      };
    } catch (error) {
      console.error('备用查询AI反馈统计失败:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * 标记反馈为已读
   */
  async markAsRead(feedbackId: string): Promise<boolean> {
    try {
      // 尝试使用RPC函数
      const { data, error } = await supabaseAdmin
        .rpc('mark_ai_feedback_as_read', {
          p_feedback_id: feedbackId,
        });

      if (!error && data) {
        return true;
      }

      // 回退到直接更新
      const { error: updateError } = await supabaseAdmin
        .from('ai_feedback')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', feedbackId);

      if (updateError) {
        console.error('标记AI反馈已读失败:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('标记AI反馈已读失败:', error);
      return false;
    }
  }

  /**
   * 获取单个反馈详情
   */
  async getFeedbackById(feedbackId: string): Promise<AIFeedback | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('ai_feedback')
        .select('*')
        .eq('id', feedbackId)
        .single();

      if (error) {
        console.error('获取AI反馈详情失败:', error);
        return null;
      }

      return data ? this.formatFeedback(data) : null;
    } catch (error) {
      console.error('获取AI反馈详情失败:', error);
      return null;
    }
  }

  /**
   * 删除反馈
   */
  async deleteFeedback(feedbackId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('ai_feedback')
        .delete()
        .eq('id', feedbackId);

      if (error) {
        console.error('删除AI反馈失败:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('删除AI反馈失败:', error);
      return false;
    }
  }

  /**
   * 同步本地存储的待处理反馈
   */
  async syncPendingFeedback(): Promise<number> {
    if (typeof window === 'undefined') return 0;

    try {
      const pending = this.getPendingFeedback();
      if (pending.length === 0) return 0;

      let syncedCount = 0;
      for (const data of pending) {
        const result = await this.submitFeedback(data);
        if (result) {
          syncedCount++;
        }
      }

      // 清除已同步的数据
      if (syncedCount > 0) {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log(`[AIFeedbackService] 同步了 ${syncedCount} 条待处理反馈`);
      }

      return syncedCount;
    } catch (error) {
      console.error('同步待处理反馈失败:', error);
      return 0;
    }
  }

  /**
   * 保存到本地存储（作为备份）
   */
  private saveToLocalStorage(data: SubmitAIFeedbackData): void {
    if (typeof window === 'undefined') return;

    try {
      const pending = this.getPendingFeedback();
      pending.push(data);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pending));
      console.log('[AIFeedbackService] 反馈已保存到本地存储');
    } catch (error) {
      console.error('保存反馈到本地存储失败:', error);
    }
  }

  /**
   * 获取待处理的反馈
   */
  private getPendingFeedback(): SubmitAIFeedbackData[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('读取待处理反馈失败:', error);
      return [];
    }
  }

  /**
   * 格式化反馈数据
   */
  private formatFeedback(item: any): AIFeedback {
    return {
      id: item.id,
      userId: item.user_id,
      userName: item.user_name || '匿名用户',
      userAvatar: item.user_avatar,
      sessionId: item.session_id,
      conversationId: item.conversation_id,
      messageId: item.message_id,
      rating: item.rating,
      feedbackType: item.feedback_type || 'satisfaction',
      comment: item.comment,
      aiModel: item.ai_model || 'unknown',
      aiResponse: item.ai_response,
      userQuery: item.user_query,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      isRead: item.is_read || false,
      tags: item.tags || [],
      metadata: item.metadata || {},
    };
  }

  /**
   * 获取默认统计数据
   */
  private getDefaultStats(): AIFeedbackStats {
    return {
      totalCount: 0,
      avgRating: 0,
      unreadCount: 0,
      rating5Count: 0,
      rating4Count: 0,
      rating3Count: 0,
      rating2Count: 0,
      rating1Count: 0,
    };
  }
}

export const aiFeedbackService = new AIFeedbackService();
export default aiFeedbackService;
