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
  totalVotes: number;
  totalLikes: number;
  avgScore: number;
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
  start_date: number | null;
  end_date: number | null;
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
    timeRange: TimeRange = '30d',
    eventId?: string
  ): Promise<DashboardStats | null> {
    try {
      // 计算日期范围
      const { startDate, endDate } = this.getDateRange(timeRange);

      console.log('[Analytics] Calling RPC with:', { organizerId, startDate, endDate, eventId });

      // 尝试使用 RPC 函数
      const { data, error } = await supabase.rpc('get_organizer_dashboard_stats', {
        p_organizer_id: organizerId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_event_id: eventId || null,
      });

      console.log('[Analytics] RPC result:', { data, error });

      if (error) {
        console.warn('RPC 函数调用失败，使用备用方案:', error);
        // RPC 失败时使用备用方案
        return this.getDashboardStatsFallback(organizerId, timeRange, eventId);
      }

      if (data && data.length > 0) {
        const stats = data[0];
        console.log('[Analytics] RPC stats:', stats);
        return {
          totalEvents: Number(stats.total_events) || 0,
          totalSubmissions: Number(stats.total_submissions) || 0,
          totalVotes: Number(stats.total_votes) || 0,
          totalLikes: Number(stats.total_likes) || 0,
          avgScore: Number(stats.avg_score) || 0,
          pendingReview: Number(stats.pending_review) || 0,
          dailySubmissions: stats.daily_submissions || [],
          topWorks: stats.top_works || [],
        };
      }

      // RPC 返回空数据，使用备用方案
      console.log('[Analytics] RPC 返回空数据，使用备用方案');
      return this.getDashboardStatsFallback(organizerId, timeRange, eventId);
    } catch (error) {
      console.error('获取概览统计数据失败:', error);
      // 出错时使用备用方案
      return this.getDashboardStatsFallback(organizerId, timeRange, eventId);
    }
  }

  // 备用方案：使用现有 API 获取统计数据
  private async getDashboardStatsFallback(
    organizerId: string,
    timeRange: TimeRange,
    eventId?: string
  ): Promise<DashboardStats> {
    try {
      // 获取活动列表
      let eventsQuery = supabase
        .from('events')
        .select('id, status, created_at')
        .eq('organizer_id', organizerId);

      // 如果指定了活动ID，只查询该活动
      if (eventId) {
        eventsQuery = eventsQuery.eq('id', eventId);
      }

      const { data: events, error: eventsError } = await eventsQuery;

      console.log('[Analytics] Events query result:', { eventsCount: events?.length || 0, error: eventsError, organizerId, eventId });

      if (eventsError) throw eventsError;

      const eventIds = events?.map(e => e.id) || [];
      const totalEvents = eventId ? 1 : (events?.length || 0);

      console.log('[Analytics] Event IDs:', eventIds);

      // 获取活动相关的作品提交 - 通过 event_submissions 表
      // 直接从 event_submissions 获取统计数据（vote_count, like_count, score）
      let submissions: any[] = [];

      if (eventIds.length > 0) {
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('event_submissions')
          .select('id, status, created_at, title, event_id, user_id, score, vote_count, like_count, avg_rating')
          .in('event_id', eventIds);

        if (submissionsError) {
          console.error('[Analytics] Submissions query error:', submissionsError);
        } else {
          submissions = submissionsData || [];
        }
      }

      console.log('[Analytics] Submissions count:', submissions.length);

      // 统计计算 - 直接从 event_submissions 表获取统计数据
      const totalSubmissions = submissions?.length || 0;
      // 投票数作为浏览/互动数的替代
      const totalVotes = submissions?.reduce((sum, s) => sum + (s.vote_count || 0), 0) || 0;
      // 点赞数
      const totalLikes = submissions?.reduce((sum, s) => sum + (s.like_count || 0), 0) || 0;
      // 待审核作品
      const pendingReview = submissions?.filter(s => s.status === 'draft' || s.status === 'under_review').length || 0;

      // 计算平均分 - 使用 score 或 avg_rating
      const scoredSubmissions = submissions?.filter(s => s.score > 0 || s.avg_rating > 0) || [];
      const avgScore = scoredSubmissions.length > 0
        ? scoredSubmissions.reduce((sum, s) => sum + (s.score || s.avg_rating || 0), 0) / scoredSubmissions.length
        : 0;

      // 生成每日提交数据
      const dailySubmissions = this.generateDailySubmissions(submissions || [], timeRange);

      // 获取热门作品 - 使用 vote_count 和 like_count 排序
      const topWorks = (submissions || [])
        .map(s => ({
          id: s.id,
          title: s.title || '未命名作品',
          views: s.vote_count || 0,
          likes: s.like_count || 0,
          score: s.score || s.avg_rating || 0,
        }))
        .sort((a, b) => (b.views + b.likes) - (a.views + a.likes))
        .slice(0, 5);

      return {
        totalEvents,
        totalSubmissions,
        totalVotes,
        totalLikes,
        avgScore: Math.round(avgScore * 10) / 10,
        pendingReview,
        dailySubmissions,
        topWorks,
      };
    } catch (error) {
      console.error('备用方案获取数据失败:', error);
      // 返回空数据
      return {
        totalEvents: 0,
        totalSubmissions: 0,
        totalVotes: 0,
        totalLikes: 0,
        avgScore: 0,
        pendingReview: 0,
        dailySubmissions: [],
        topWorks: [],
      };
    }
  }

  // 生成每日提交数据
  private generateDailySubmissions(works: any[], timeRange: TimeRange): DailySubmission[] {
    const days = timeRange === 'today' ? 1 : 
                 timeRange === '7d' ? 7 : 
                 timeRange === '30d' ? 30 : 
                 timeRange === '90d' ? 90 : 365;
    
    const result: DailySubmission[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = works.filter(w => {
        const workDate = new Date(w.created_at);
        return workDate.toISOString().split('T')[0] === dateStr;
      }).length;
      
      result.push({ date: dateStr, count });
    }
    
    return result;
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

      if (error) {
        console.warn('RPC get_works_trend 失败，使用备用方案:', error);
        return this.getWorksTrendFallback(organizerId, days);
      }

      return (data || []).map((item: any) => ({
        stat_date: item.stat_date,
        submissions_count: Number(item.submissions_count) || 0,
        views_count: Number(item.views_count) || 0,
        likes_count: Number(item.likes_count) || 0,
        comments_count: Number(item.comments_count) || 0,
      }));
    } catch (error) {
      console.error('获取作品趋势数据失败:', error);
      return this.getWorksTrendFallback(organizerId, days);
    }
  }

  // 备用方案：获取作品趋势数据
  private async getWorksTrendFallback(
    organizerId: string,
    days: number = 30
  ): Promise<TrendData[]> {
    try {
      // 获取活动列表
      const { data: events } = await supabase
        .from('events')
        .select('id')
        .eq('organizer_id', organizerId);

      const eventIds = events?.map(e => e.id) || [];

      // 获取活动相关的作品提交列表 - 直接获取统计数据
      let submissions: any[] = [];
      if (eventIds.length > 0) {
        const { data: submissionsData, error } = await supabase
          .from('event_submissions')
          .select('id, created_at, event_id, vote_count, like_count')
          .in('event_id', eventIds)
          .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

        if (error) throw error;
        submissions = submissionsData || [];
      }

      // 按日期分组统计 - 直接使用 event_submissions 的统计数据
      const trendMap = new Map<string, { submissions: number; views: number; likes: number; comments: number }>();

      // 初始化所有日期
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        trendMap.set(dateStr, { submissions: 0, views: 0, likes: 0, comments: 0 });
      }

      // 统计作品数据 - 直接使用 event_submissions 的 vote_count 和 like_count
      (submissions || []).forEach(s => {
        const dateStr = new Date(s.created_at).toISOString().split('T')[0];
        if (trendMap.has(dateStr)) {
          const stat = trendMap.get(dateStr)!;
          stat.submissions += 1;
          stat.views += s.vote_count || 0;  // 使用 vote_count 作为 views
          stat.likes += s.like_count || 0;  // 使用 like_count
          stat.comments += 0;  // 暂时为0，可以通过 comments 表统计
        }
      });

      // 转换为数组
      return Array.from(trendMap.entries()).map(([stat_date, stat]) => ({
        stat_date,
        submissions_count: stat.submissions,
        views_count: stat.views,
        likes_count: stat.likes,
        comments_count: stat.comments,
      }));
    } catch (error) {
      console.error('备用方案获取趋势数据失败:', error);
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

      if (error) {
        console.warn('RPC get_score_distribution 失败，使用备用方案:', error);
        return this.getScoreDistributionFallback(organizerId);
      }

      return (data || []).map((item: any) => ({
        score_range: item.score_range,
        count: Number(item.count) || 0,
        percentage: Number(item.percentage) || 0,
      }));
    } catch (error) {
      console.error('获取评分分布失败:', error);
      return this.getScoreDistributionFallback(organizerId);
    }
  }

  // 备用方案：获取评分分布（works 表没有 score 字段，返回空数据）
  private async getScoreDistributionFallback(
    organizerId: string
  ): Promise<ScoreDistribution[]> {
    // 返回默认的评分分布（因为没有评分数据）
    return [
      { score_range: '0-60', count: 0, percentage: 0 },
      { score_range: '60-70', count: 0, percentage: 0 },
      { score_range: '70-80', count: 0, percentage: 0 },
      { score_range: '80-90', count: 0, percentage: 0 },
      { score_range: '90-100', count: 0, percentage: 0 },
    ];
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

      if (error) {
        console.warn('RPC get_top_works 失败，使用备用方案:', error);
        return this.getTopWorksFallback(organizerId, limit, sortBy);
      }

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
      return this.getTopWorksFallback(organizerId, limit, sortBy);
    }
  }

  // 备用方案：获取热门作品排行
  private async getTopWorksFallback(
    organizerId: string,
    limit: number = 10,
    sortBy: SortBy = 'views'
  ): Promise<TopWorkDetail[]> {
    try {
      // 获取活动列表
      const { data: events } = await supabase
        .from('events')
        .select('id')
        .eq('organizer_id', organizerId);

      const eventIds = events?.map(e => e.id) || [];

      // 获取活动相关的作品提交列表
      let submissions: any[] = [];
      if (eventIds.length > 0) {
        const { data: submissionsData, error } = await supabase
          .from('event_submissions')
          .select('id, title, created_at, user_id, event_id, vote_count, like_count, score, avg_rating')
          .in('event_id', eventIds)
          .limit(limit * 2); // 多获取一些用于排序

        if (error) throw error;
        submissions = submissionsData || [];
      }

      // 获取用户信息
      const userIds = [...new Set((submissions || []).map(s => s.user_id))];
      const { data: users } = await supabase
        .from('users')
        .select('id, username')
        .in('id', userIds.length > 0 ? userIds : ['']);

      const userMap = new Map(users?.map(u => [u.id, u.username]) || []);

      // 直接使用 event_submissions 的统计数据
      const submissionsWithStats = submissions.map(s => ({
        ...s,
        view_count: s.vote_count || 0,  // 使用 vote_count 作为 views
        like_count: s.like_count || 0,
        comment_count: 0,  // 暂时为0
        avg_score: s.score || s.avg_rating || 0,
      }));

      // 排序
      let sortedSubmissions = [...submissionsWithStats];
      switch (sortBy) {
        case 'likes':
          sortedSubmissions.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
          break;
        case 'score':
          sortedSubmissions.sort((a, b) => (b.avg_score || 0) - (a.avg_score || 0));
          break;
        case 'views':
        default:
          sortedSubmissions.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
          break;
      }

      // 转换为 TopWorkDetail 格式
      return sortedSubmissions.slice(0, limit).map(s => ({
        work_id: s.id,
        title: s.title || '未命名作品',
        creator_name: userMap.get(s.user_id) || '未知用户',
        views: s.view_count || 0,
        likes: s.like_count || 0,
        comments: s.comment_count || 0,
        score: s.avg_score || 0,
        engagement_rate: 0, // 暂时设为 0
        submitted_at: new Date(s.created_at).toISOString(),
      }));
    } catch (error) {
      console.error('备用方案获取热门作品失败:', error);
      return [];
    }
  }

  // 获取实时活动流
  async getRecentActivities(
    organizerId: string,
    limit: number = 20,
    eventId?: string
  ): Promise<Activity[]> {
    try {
      const { data, error } = await supabase.rpc('get_recent_activities', {
        p_organizer_id: organizerId,
        p_limit: limit,
        p_event_id: eventId || null,
      });

      if (error) {
        console.warn('RPC get_recent_activities 失败，使用备用方案:', error);
        return this.getRecentActivitiesFallback(organizerId, limit, eventId);
      }

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
      return this.getRecentActivitiesFallback(organizerId, limit, eventId);
    }
  }

  // 备用方案：获取实时活动流
  private async getRecentActivitiesFallback(
    organizerId: string,
    limit: number = 20,
    eventId?: string
  ): Promise<Activity[]> {
    try {
      // 获取活动列表
      let eventsQuery = supabase
        .from('events')
        .select('id')
        .eq('organizer_id', organizerId);

      // 如果指定了活动ID，只查询该活动
      if (eventId) {
        eventsQuery = eventsQuery.eq('id', eventId);
      }

      const { data: events } = await eventsQuery;

      const eventIds = events?.map(e => e.id) || [];

      // 获取活动相关的最近作品提交
      let submissions: any[] = [];
      if (eventIds.length > 0) {
        let submissionsQuery = supabase
          .from('event_submissions')
          .select('id, title, user_id, created_at, event_id')
          .in('event_id', eventIds)
          .order('created_at', { ascending: false })
          .limit(limit);

        const { data: submissionsData, error } = await submissionsQuery;

        if (error) throw error;
        submissions = submissionsData || [];
      }

      // 获取用户信息
      const userIds = [...new Set((submissions || []).map(s => s.user_id))];
      const { data: users } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', userIds.length > 0 ? userIds : ['']);

      const userMap = new Map(users?.map(u => [u.id, { name: u.username, avatar: u.avatar_url }]) || []);

      // 转换为 Activity 格式
      return (submissions || []).map(s => {
        const user = userMap.get(s.user_id);
        return {
          activity_id: s.id,
          action_type: 'submission' as const,
          user_name: user?.name || '未知用户',
          user_avatar: user?.avatar || '',
          target_title: s.title || '未命名作品',
          target_type: 'work',
          metadata: {},
          created_at: new Date(s.created_at).toISOString(),
        };
      });
    } catch (error) {
      console.error('备用方案获取实时活动失败:', error);
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

      if (error) {
        console.warn('organizer_event_summary 查询失败，使用备用方案:', error);
        return this.getOrganizerEventsFallback(organizerId);
      }

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
      return this.getOrganizerEventsFallback(organizerId);
    }
  }

  // 备用方案：获取活动列表
  private async getOrganizerEventsFallback(organizerId: string): Promise<EventSummary[]> {
    try {
      // 从 events 表获取活动列表
      const { data: events, error } = await supabase
        .from('events')
        .select('id, title, organizer_id, status, start_time, end_time, created_at')
        .eq('organizer_id', organizerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 获取活动ID列表
      const eventIds = (events || []).map(e => e.id);

      // 获取每个活动的作品提交统计 - 直接获取统计数据
      let submissions: any[] = [];
      if (eventIds.length > 0) {
        const { data: submissionsData } = await supabase
          .from('event_submissions')
          .select('id, event_id, status, vote_count, like_count, score, avg_rating')
          .in('event_id', eventIds);
        submissions = submissionsData || [];
      }

      // 按活动ID分组统计 - 直接使用 event_submissions 的统计数据
      const eventStatsMap = new Map<string, { submissions: number; published: number; views: number; likes: number; totalScore: number; scoredCount: number }>();
      submissions.forEach(s => {
        if (!eventStatsMap.has(s.event_id)) {
          eventStatsMap.set(s.event_id, { submissions: 0, published: 0, views: 0, likes: 0, totalScore: 0, scoredCount: 0 });
        }
        const stat = eventStatsMap.get(s.event_id)!;
        stat.submissions += 1;
        if (s.status === 'submitted' || s.status === 'reviewed') stat.published += 1;
        stat.views += s.vote_count || 0;  // 使用 vote_count 作为 views
        stat.likes += s.like_count || 0;  // 使用 like_count
        const workScore = s.score || s.avg_rating || 0;
        if (workScore > 0) {
          stat.totalScore += workScore;
          stat.scoredCount += 1;
        }
      });

      // 转换为 EventSummary 格式
      return (events || []).map(e => {
        const stat = eventStatsMap.get(e.id) || { submissions: 0, published: 0, views: 0, likes: 0, totalScore: 0, scoredCount: 0 };
        const avgScore = stat.scoredCount > 0 ? stat.totalScore / stat.scoredCount : 0;
        return {
          event_id: e.id,
          event_title: e.title || '未命名活动',
          organizer_id: e.organizer_id,
          status: e.status || 'draft',
          start_date: e.start_time ? new Date(e.start_time).getTime() : null,
          end_date: e.end_time ? new Date(e.end_time).getTime() : null,
          total_submissions: stat.submissions,
          published_count: stat.published,
          avg_score: Math.round(avgScore * 10) / 10,
          total_views: stat.views,
          total_likes: stat.likes,
          created_at: e.created_at ? new Date(e.created_at).toISOString() : new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('备用方案获取活动列表失败:', error);
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
  formatNumber(num: number | undefined | null): string {
    if (num === undefined || num === null) {
      return '0';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // 格式化日期
  formatDate(dateStr: string | undefined | null): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  }

  // 获取相对时间
  getRelativeTime(dateStr: string | undefined | null): string {
    if (!dateStr) return '未知时间';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '未知时间';
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
