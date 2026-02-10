// 主办方数据分析服务

import { supabase } from '@/lib/supabaseClient';

// 时间范围类型
export type TimeRange = 'today' | '7d' | '30d' | '90d' | '1y' | 'all';

// 排序类型
export type SortBy = 'views' | 'likes' | 'score' | 'engagement' | 'submitted_at';

// 概览统计数据接口
export interface DashboardStats {
  totalEvents: number;
  totalSubmissions: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  avgScore: number;
  publishedWorks: number;
  pendingReview: number;
  dailySubmissions: DailySubmission[];
  topWorks: TopWork[];
}

// 每日提交数据
export interface DailySubmission {
  date: string;
  count: number;
}

// 热门作品
export interface TopWork {
  id: string;
  title: string;
  views: number;
  likes: number;
  score: number;
}

// 趋势数据
export interface TrendData {
  stat_date: string;
  submissions_count: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
}

// 评分分布
export interface ScoreDistribution {
  score_range: string;
  count: number;
  percentage: number;
}

// 热门作品详情
export interface TopWorkDetail {
  work_id: string;
  title: string;
  creator_name: string;
  views: number;
  likes: number;
  comments: number;
  score: number;
  engagement_rate: number;
  submitted_at: string;
}

// 活动记录
export interface Activity {
  activity_id: string;
  action_type: 'submission' | 'view' | 'like' | 'comment' | 'share' | 'score' | 'publish';
  user_name: string;
  user_avatar: string;
  target_title: string;
  target_type: string;
  metadata: Record<string, any>;
  created_at: string;
}

// 活动摘要
export interface EventSummary {
  event_id: string;
  event_title: string;
  organizer_id: string;
  status: string;
  start_date: number;
  end_date: number;
  total_submissions: number;
  published_count: number;
  avg_score: number;
  total_views: number;
  total_likes: number;
  created_at: string;
}

// 主办方数据分析服务类
class OrganizerAnalyticsService {
  // 获取概览统计数据
  async getDashboardStats(
    organizerId: string,
    timeRange: TimeRange = '30d'
  ): Promise<DashboardStats | null> {
    try {
      // 计算日期范围
      const { startDate, endDate } = this.getDateRange(timeRange);

      const { data, error } = await supabase.rpc('get_organizer_dashboard_stats', {
        p_organizer_id: organizerId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const stats = data[0];
        return {
          totalEvents: Number(stats.total_events) || 0,
          totalSubmissions: Number(stats.total_submissions) || 0,
          totalViews: Number(stats.total_views) || 0,
          totalLikes: Number(stats.total_likes) || 0,
          totalComments: Number(stats.total_comments) || 0,
          avgScore: Number(stats.avg_score) || 0,
          publishedWorks: Number(stats.published_works) || 0,
          pendingReview: Number(stats.pending_review) || 0,
          dailySubmissions: stats.daily_submissions || [],
          topWorks: stats.top_works || [],
        };
      }

      return null;
    } catch (error) {
      console.error('获取概览统计数据失败:', error);
      return null;
    }
  }

  // 获取作品趋势数据
  async getWorksTrend(
    organizerId: string,
    eventId?: string,
    days: number = 30
  ): Promise<TrendData[]> {
    try {
      const { data, error } = await supabase.rpc('get_works_trend', {
        p_organizer_id: organizerId,
        p_event_id: eventId || null,
        p_days: days,
      });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        stat_date: item.stat_date,
        submissions_count: Number(item.submissions_count) || 0,
        views_count: Number(item.views_count) || 0,
        likes_count: Number(item.likes_count) || 0,
        comments_count: Number(item.comments_count) || 0,
      }));
    } catch (error) {
      console.error('获取作品趋势数据失败:', error);
      return [];
    }
  }

  // 获取评分分布
  async getScoreDistribution(
    organizerId: string,
    eventId?: string
  ): Promise<ScoreDistribution[]> {
    try {
      const { data, error } = await supabase.rpc('get_score_distribution', {
        p_organizer_id: organizerId,
        p_event_id: eventId || null,
      });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        score_range: item.score_range,
        count: Number(item.count) || 0,
        percentage: Number(item.percentage) || 0,
      }));
    } catch (error) {
      console.error('获取评分分布失败:', error);
      return [];
    }
  }

  // 获取热门作品排行
  async getTopWorks(
    organizerId: string,
    eventId?: string,
    limit: number = 10,
    sortBy: SortBy = 'views'
  ): Promise<TopWorkDetail[]> {
    try {
      const { data, error } = await supabase.rpc('get_top_works', {
        p_organizer_id: organizerId,
        p_event_id: eventId || null,
        p_limit: limit,
        p_sort_by: sortBy,
      });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        work_id: item.work_id,
        title: item.title,
        creator_name: item.creator_name,
        views: Number(item.views) || 0,
        likes: Number(item.likes) || 0,
        comments: Number(item.comments) || 0,
        score: Number(item.score) || 0,
        engagement_rate: Number(item.engagement_rate) || 0,
        submitted_at: item.submitted_at,
      }));
    } catch (error) {
      console.error('获取热门作品排行失败:', error);
      return [];
    }
  }

  // 获取实时活动流
  async getRecentActivities(
    organizerId: string,
    limit: number = 20
  ): Promise<Activity[]> {
    try {
      const { data, error } = await supabase.rpc('get_recent_activities', {
        p_organizer_id: organizerId,
        p_limit: limit,
      });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        activity_id: item.activity_id,
        action_type: item.action_type,
        user_name: item.user_name,
        user_avatar: item.user_avatar,
        target_title: item.target_title,
        target_type: item.target_type,
        metadata: item.metadata || {},
        created_at: item.created_at,
      }));
    } catch (error) {
      console.error('获取实时活动流失败:', error);
      return [];
    }
  }

  // 获取活动列表
  async getOrganizerEvents(organizerId: string): Promise<EventSummary[]> {
    try {
      const { data, error } = await supabase
        .from('organizer_event_summary')
        .select('*')
        .eq('organizer_id', organizerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        event_id: item.event_id,
        event_title: item.event_title,
        organizer_id: item.organizer_id,
        status: item.status,
        start_date: item.start_date,
        end_date: item.end_date,
        total_submissions: Number(item.total_submissions) || 0,
        published_count: Number(item.published_count) || 0,
        avg_score: Number(item.avg_score) || 0,
        total_views: Number(item.total_views) || 0,
        total_likes: Number(item.total_likes) || 0,
        created_at: item.created_at,
      }));
    } catch (error) {
      console.error('获取活动列表失败:', error);
      return [];
    }
  }

  // 记录活动日志
  async logActivity(
    eventId: string,
    userId: string,
    actionType: Activity['action_type'],
    targetId?: string,
    targetType?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.rpc('log_activity', {
        p_event_id: eventId,
        p_user_id: userId,
        p_action_type: actionType,
        p_target_id: targetId || null,
        p_target_type: targetType || null,
        p_metadata: metadata || null,
      });
    } catch (error) {
      console.error('记录活动日志失败:', error);
    }
  }

  // 计算增长率
  calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  // 获取日期范围
  private getDateRange(timeRange: TimeRange): { startDate: string | null; endDate: string | null } {
    const end = new Date();
    const start = new Date();

    switch (timeRange) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case 'all':
        return { startDate: null, endDate: null };
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }

  // 格式化数字
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // 格式化日期
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  }

  // 获取相对时间
  getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return this.formatDate(dateStr);
  }
}

// 导出单例实例
const organizerAnalyticsService = new OrganizerAnalyticsService();
export default organizerAnalyticsService;
