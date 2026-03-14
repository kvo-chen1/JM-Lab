import { supabase } from '@/lib/supabase';

// FAQ反馈类型
export interface FAQFeedback {
  id: string;
  faq_id: string;
  user_id: string | null;
  is_helpful: boolean;
  created_at: string;
}

// FAQ浏览记录类型
export interface FAQView {
  id: string;
  faq_id: string;
  user_id: string | null;
  session_id: string;
  created_at: string;
}

// FAQ统计类型
export interface FAQStats {
  faq_id: string;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  helpful_rate: number;
}

class FAQService {
  private readonly FEEDBACK_TABLE = 'faq_feedback';
  private readonly VIEWS_TABLE = 'faq_views';

  /**
   * 提交FAQ反馈（有帮助/无帮助）
   */
  async submitFeedback(faqId: string, isHelpful: boolean, userId?: string): Promise<boolean> {
    try {
      // 生成会话ID（用于未登录用户）
      const sessionId = this.getOrCreateSessionId();

      // 检查是否已经提交过反馈
      const hasFeedback = await this.hasUserFeedback(faqId, userId, sessionId);
      if (hasFeedback) {
        // 更新已有反馈
        const { error } = await supabase
          .from(this.FEEDBACK_TABLE)
          .update({ is_helpful: isHelpful })
          .eq('faq_id', faqId)
          .eq(userId ? 'user_id' : 'session_id', userId || sessionId);

        if (error) throw error;
      } else {
        // 创建新反馈
        const { error } = await supabase
          .from(this.FEEDBACK_TABLE)
          .insert({
            faq_id: faqId,
            user_id: userId || null,
            session_id: userId ? null : sessionId,
            is_helpful: isHelpful
          });

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('[FAQService] 提交反馈失败:', error);
      // 降级到本地存储
      return this.saveFeedbackToLocal(faqId, isHelpful);
    }
  }

  /**
   * 记录FAQ浏览
   */
  async recordView(faqId: string, userId?: string): Promise<boolean> {
    try {
      const sessionId = this.getOrCreateSessionId();

      // 检查是否已经浏览过（24小时内只记录一次）
      const hasViewed = await this.hasRecentView(faqId, userId, sessionId);
      if (hasViewed) return true;

      const { error } = await supabase
        .from(this.VIEWS_TABLE)
        .insert({
          faq_id: faqId,
          user_id: userId || null,
          session_id: userId ? null : sessionId
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[FAQService] 记录浏览失败:', error);
      return false;
    }
  }

  /**
   * 获取FAQ统计数据
   */
  async getFAQStats(faqId: string): Promise<FAQStats> {
    try {
      // 使用RPC函数获取统计
      const { data, error } = await supabase
        .rpc('get_faq_stats', { p_faq_id: faqId });

      if (error) throw error;

      if (data && data.length > 0) {
        return data[0];
      }

      // 备用方案：直接查询
      return this.calculateStatsFromDB(faqId);
    } catch (error) {
      console.error('[FAQService] 获取统计失败:', error);
      return this.getLocalStats(faqId);
    }
  }

  /**
   * 批量获取FAQ统计
   */
  async getBatchFAQStats(faqIds: string[]): Promise<Record<string, FAQStats>> {
    try {
      const { data, error } = await supabase
        .rpc('get_batch_faq_stats', { p_faq_ids: faqIds });

      if (error) throw error;

      const statsMap: Record<string, FAQStats> = {};
      if (data) {
        data.forEach((stat: FAQStats) => {
          statsMap[stat.faq_id] = stat;
        });
      }

      return statsMap;
    } catch (error) {
      console.error('[FAQService] 批量获取统计失败:', error);
      // 逐个获取
      const statsMap: Record<string, FAQStats> = {};
      for (const faqId of faqIds) {
        statsMap[faqId] = await this.getFAQStats(faqId);
      }
      return statsMap;
    }
  }

  /**
   * 检查用户是否已经提交过反馈
   */
  async hasUserFeedback(faqId: string, userId?: string, sessionId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from(this.FEEDBACK_TABLE)
        .select('id')
        .eq('faq_id', faqId);

      if (userId) {
        query = query.eq('user_id', userId);
      } else if (sessionId) {
        query = query.eq('session_id', sessionId);
      } else {
        return false;
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('[FAQService] 检查反馈状态失败:', error);
      return this.hasLocalFeedback(faqId);
    }
  }

  /**
   * 获取用户的反馈记录
   */
  async getUserFeedbacks(userId?: string): Promise<Record<string, boolean>> {
    try {
      const sessionId = !userId ? this.getOrCreateSessionId() : null;

      let query = supabase
        .from(this.FEEDBACK_TABLE)
        .select('faq_id, is_helpful');

      if (userId) {
        query = query.eq('user_id', userId);
      } else if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const feedbackMap: Record<string, boolean> = {};
      data?.forEach((item: { faq_id: string; is_helpful: boolean }) => {
        feedbackMap[item.faq_id] = item.is_helpful;
      });

      // 合并本地数据
      const localFeedbacks = this.getLocalFeedbacks();
      return { ...localFeedbacks, ...feedbackMap };
    } catch (error) {
      console.error('[FAQService] 获取用户反馈记录失败:', error);
      return this.getLocalFeedbacks();
    }
  }

  /**
   * 获取热门FAQ（按浏览量排序）
   */
  async getHotFAQs(limit: number = 10): Promise<Array<{ faq_id: string; view_count: number; helpful_rate: number }>> {
    try {
      const { data, error } = await supabase
        .rpc('get_hot_faqs', { p_limit: limit });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[FAQService] 获取热门FAQ失败:', error);
      return [];
    }
  }

  /**
   * 获取相关FAQ推荐
   */
  async getRelatedFAQs(faqId: string, category: string, limit: number = 5): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_related_faqs', {
          p_faq_id: faqId,
          p_category: category,
          p_limit: limit
        });

      if (error) throw error;
      return data?.map((item: { faq_id: string }) => item.faq_id) || [];
    } catch (error) {
      console.error('[FAQService] 获取相关FAQ失败:', error);
      return [];
    }
  }

  // ============ 私有方法 ============

  /**
   * 获取或创建会话ID
   */
  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return 'server';

    let sessionId = sessionStorage.getItem('faq_session_id');
    if (!sessionId) {
      sessionId = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('faq_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * 检查最近是否浏览过（24小时内）
   */
  private async hasRecentView(faqId: string, userId?: string, sessionId?: string): Promise<boolean> {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      let query = supabase
        .from(this.VIEWS_TABLE)
        .select('id')
        .eq('faq_id', faqId)
        .gte('created_at', yesterday);

      if (userId) {
        query = query.eq('user_id', userId);
      } else if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * 从数据库计算统计
   */
  private async calculateStatsFromDB(faqId: string): Promise<FAQStats> {
    try {
      // 获取浏览量
      const { count: viewCount, error: viewError } = await supabase
        .from(this.VIEWS_TABLE)
        .select('*', { count: 'exact', head: true })
        .eq('faq_id', faqId);

      if (viewError) throw viewError;

      // 获取反馈统计
      const { data: feedbackData, error: feedbackError } = await supabase
        .from(this.FEEDBACK_TABLE)
        .select('is_helpful')
        .eq('faq_id', faqId);

      if (feedbackError) throw feedbackError;

      const helpfulCount = feedbackData?.filter(f => f.is_helpful).length || 0;
      const notHelpfulCount = feedbackData?.filter(f => !f.is_helpful).length || 0;
      const totalFeedback = helpfulCount + notHelpfulCount;
      const helpfulRate = totalFeedback > 0 ? Math.round((helpfulCount / totalFeedback) * 100) : 0;

      return {
        faq_id: faqId,
        view_count: viewCount || 0,
        helpful_count: helpfulCount,
        not_helpful_count: notHelpfulCount,
        helpful_rate: helpfulRate
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 保存反馈到本地存储（降级方案）
   */
  private saveFeedbackToLocal(faqId: string, isHelpful: boolean): boolean {
    try {
      if (typeof window === 'undefined') return false;

      const key = 'faq_feedback_local';
      const stored = localStorage.getItem(key);
      const feedbacks: Record<string, { isHelpful: boolean; timestamp: number }> = stored ? JSON.parse(stored) : {};

      feedbacks[faqId] = {
        isHelpful,
        timestamp: Date.now()
      };

      localStorage.setItem(key, JSON.stringify(feedbacks));
      return true;
    } catch (error) {
      console.error('[FAQService] 本地存储失败:', error);
      return false;
    }
  }

  /**
   * 获取本地反馈记录
   */
  private getLocalFeedbacks(): Record<string, boolean> {
    try {
      if (typeof window === 'undefined') return {};

      const key = 'faq_feedback_local';
      const stored = localStorage.getItem(key);
      if (!stored) return {};

      const feedbacks: Record<string, { isHelpful: boolean; timestamp: number }> = JSON.parse(stored);
      const result: Record<string, boolean> = {};

      Object.entries(feedbacks).forEach(([faqId, data]) => {
        result[faqId] = data.isHelpful;
      });

      return result;
    } catch (error) {
      return {};
    }
  }

  /**
   * 检查本地是否有反馈
   */
  private hasLocalFeedback(faqId: string): boolean {
    const feedbacks = this.getLocalFeedbacks();
    return faqId in feedbacks;
  }

  /**
   * 获取本地统计
   */
  private getLocalStats(faqId: string): FAQStats {
    const feedbacks = this.getLocalFeedbacks();
    const hasFeedback = faqId in feedbacks;

    return {
      faq_id: faqId,
      view_count: 0, // 本地无法统计浏览量
      helpful_count: hasFeedback && feedbacks[faqId] ? 1 : 0,
      not_helpful_count: hasFeedback && !feedbacks[faqId] ? 1 : 0,
      helpful_rate: hasFeedback ? (feedbacks[faqId] ? 100 : 0) : 0
    };
  }
}

export const faqService = new FAQService();
export default faqService;
