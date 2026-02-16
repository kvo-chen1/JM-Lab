import { supabase } from '@/lib/supabase';
import { apiService } from './apiService';

// 参与状态类型
export type ParticipationStatus = 'registered' | 'reviewing' | 'completed' | 'awarded' | 'cancelled';

// 参与步骤类型
export type ParticipationStep = 1 | 2 | 3 | 4;

// 参与记录详情接口
export interface ParticipationDetail {
  id: string;
  userId: string;
  eventId: string;
  participationStatus: ParticipationStatus;
  progress: number;
  currentStep: ParticipationStep;
  submittedWorkId?: string;
  submissionDate?: string;
  ranking?: number;
  award?: string;
  registrationDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  event: {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    location?: string;
    type: 'online' | 'offline';
    status: string;
    thumbnailUrl?: string;
    participants: number;
    maxParticipants?: number;
  };
  submission?: {
    id: string;
    title: string;
    status: string;
    score?: number;
    reviewNotes?: string;
  };
}

// 参与统计接口
export interface ParticipationStats {
  total: number;
  totalVotes: number;
  totalLikes: number;
}

// 筛选选项接口
export interface ParticipationFilter {
  status?: ParticipationStatus | 'all';
  step?: ParticipationStep | 'all';
  timeRange?: 'upcoming' | 'ongoing' | 'ended' | 'all';
  searchQuery?: string;
}

class EventParticipationService {
  /**
   * 获取用户的所有活动参与记录
   */
  async getUserParticipations(
    userId: string,
    filter: ParticipationFilter = {},
    pagination: { page?: number; pageSize?: number } = {}
  ): Promise<{ data: ParticipationDetail[]; total: number }> {
    try {
      const { page = 1, pageSize = 10 } = pagination;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 首先尝试使用视图获取参与详情
      let useView = true;
      let data: any[] = [];
      let count = 0;
      
      try {
        let query = supabase
          .from('user_participation_details')
          .select('*', { count: 'exact' })
          .eq('user_id', userId);

        // 应用状态筛选
        if (filter.status && filter.status !== 'all') {
          const dbStatusMap: Record<string, string[]> = {
            'registered': ['registered', 'checked_in'], // 已报名：已报名、已签到
            'reviewing': ['submitted', 'reviewing'], // 评审中：已提交、评审中
            'completed': ['completed', 'submitted', 'reviewing'], // 已结束：已完成、已提交（活动结束）、评审中（活动结束）
            'awarded': ['awarded'],
          };
          const dbStatuses = dbStatusMap[filter.status];
          if (dbStatuses) {
            if (dbStatuses.length === 1) {
              query = query.eq('participation_status', dbStatuses[0]);
            } else {
              query = query.in('participation_status', dbStatuses);
            }
          }
        }

        const result = await query
          .order('created_at', { ascending: false })
          .range(from, to);

        if (result.error) {
          // 如果视图不存在，会返回错误
          if (result.error.message?.includes('Could not find the table')) {
            console.log('[getUserParticipations] View not found, will use direct query');
            useView = false;
          } else {
            throw result.error;
          }
        } else {
          data = result.data || [];
          count = result.count || 0;
        }
      } catch (viewError: any) {
        if (viewError.message?.includes('Could not find the table')) {
          console.log('[getUserParticipations] View not found, will use direct query');
          useView = false;
        } else {
          throw viewError;
        }
      }

      // 如果视图不可用，直接从 event_participants 表查询
      if (!useView) {
        console.log('[getUserParticipations] Using direct query from event_participants');
        
        // 先查询 event_participants
        let participantsQuery = supabase
          .from('event_participants')
          .select('*', { count: 'exact' })
          .eq('user_id', userId);

        // 调试：先查询所有记录，查看实际状态
        const debugResult = await supabase
          .from('event_participants')
          .select('id, event_id, status')
          .eq('user_id', userId);
        console.log('[getUserParticipations] Debug - All participations:', debugResult.data);
        if (debugResult.data && debugResult.data.length > 0) {
          console.log('[getUserParticipations] Debug - First participation status:', debugResult.data[0].status);
        }

        // 应用状态筛选
        if (filter.status && filter.status !== 'all') {
          const dbStatusMap: Record<string, string[]> = {
            'registered': ['registered', 'checked_in'], // 已报名：已报名、已签到
            'reviewing': ['submitted', 'reviewing'], // 评审中：已提交、评审中
            'completed': ['completed', 'submitted', 'reviewing'], // 已结束：已完成、已提交（活动结束）、评审中（活动结束）
            'awarded': ['awarded'],
          };
          const dbStatuses = dbStatusMap[filter.status];
          console.log('[getUserParticipations] Debug - Filter status:', filter.status);
          console.log('[getUserParticipations] Debug - DB statuses:', dbStatuses);
          if (dbStatuses) {
            if (dbStatuses.length === 1) {
              participantsQuery = participantsQuery.eq('status', dbStatuses[0]);
              console.log('[getUserParticipations] Debug - Using eq filter:', dbStatuses[0]);
            } else {
              participantsQuery = participantsQuery.in('status', dbStatuses);
              console.log('[getUserParticipations] Debug - Using in filter:', dbStatuses);
            }
          }
        }

        const participantsResult = await participantsQuery
          .order('created_at', { ascending: false })
          .range(from, to);

        console.log('[getUserParticipations] Debug - Participants query result:', {
          data: participantsResult.data,
          count: participantsResult.count,
          error: participantsResult.error
        });

        if (participantsResult.error) {
          console.error('[getUserParticipations] Participants query error:', participantsResult.error);
          throw participantsResult.error;
        }

        const participants = participantsResult.data || [];
        count = participantsResult.count || 0;
        console.log('[getUserParticipations] Debug - Processed participants:', participants);
        console.log('[getUserParticipations] Debug - Total count:', count);

        // 获取所有相关的 event_id
        const eventIds = participants.map(p => p.event_id).filter(Boolean);
        
        // 批量查询 events 信息
        let eventsMap: Record<string, any> = {};
        if (eventIds.length > 0) {
          const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .in('id', eventIds);
          
          if (eventsError) {
            console.error('[getUserParticipations] Events query error:', eventsError);
          } else {
            eventsMap = (events || []).reduce((map, event) => {
              map[event.id] = event;
              return map;
            }, {} as Record<string, any>);
          }
        }

        // 合并数据
        data = participants.map(p => ({
          ...p,
          events: eventsMap[p.event_id] || null
        }));
      }

      if (!data || data.length === 0) {
        return { data: [], total: 0 };
      }

      // 格式化数据
      console.log('[getUserParticipations] Debug - Raw data before formatting:', data);
      
      const formattedData: ParticipationDetail[] = data.map((item: any) => {
        // 根据查询方式处理数据格式
        const event = useView ? {
          id: item.event_id,
          title: item.event_title || '未知活动',
          description: item.event_description || '',
          startTime: item.event_start || new Date().toISOString(),
          endTime: item.event_end || new Date().toISOString(),
          location: item.event_location,
          type: 'offline',
          status: item.event_status || 'published',
          thumbnailUrl: item.event_thumbnail,
          participants: 0,
          maxParticipants: item.event_max_participants,
        } : {
          id: item.events?.id || item.event_id,
          title: item.events?.title || '未知活动',
          description: item.events?.description || '',
          startTime: item.events?.start_time || new Date().toISOString(),
          endTime: item.events?.end_time || new Date().toISOString(),
          location: item.events?.location,
          type: 'offline',
          status: item.events?.status || 'published',
          thumbnailUrl: item.events?.thumbnail_url,
          participants: item.events?.participants || 0,
          maxParticipants: item.events?.max_participants,
        };

        return {
          id: item.id,
          userId: item.user_id,
          eventId: item.event_id,
          participationStatus: this.mapStatus(useView ? item.participation_status : item.status),
          progress: item.progress || 0,
          currentStep: (item.current_step || 1) as ParticipationStep,
          submittedWorkId: item.submitted_work_id,
          submissionDate: item.submission_date,
          ranking: item.ranking,
          award: item.award,
          registrationDate: item.registration_date || item.created_at,
          notes: item.notes,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          event,
          submission: item.submission_id || item.submitted_work_id ? {
            id: item.submission_id || item.submitted_work_id,
            title: item.submission_title || '',
            status: item.submission_status || 'draft',
            score: item.submission_score,
            reviewNotes: item.review_notes,
          } : undefined,
        };
      });

      console.log('[getUserParticipations] Debug - Formatted data:', formattedData);
      return { data: formattedData, total: count || 0 };
    } catch (error) {
      console.error('获取用户参与记录失败:', error);
      return { data: [], total: 0 };
    }
  }

  /**
   * 获取参与详情
   */
  async getParticipationDetail(participationId: string): Promise<ParticipationDetail | null> {
    try {
      // 首先尝试使用视图
      let useView = true;
      let data: any = null;
      
      try {
        const result = await supabase
          .from('user_participation_details')
          .select('*')
          .eq('id', participationId)
          .single();

        if (result.error) {
          if (result.error.message?.includes('Could not find the table')) {
            console.log('[getParticipationDetail] View not found, will use direct query');
            useView = false;
          } else {
            throw result.error;
          }
        } else {
          data = result.data;
        }
      } catch (viewError: any) {
        if (viewError.message?.includes('Could not find the table')) {
          console.log('[getParticipationDetail] View not found, will use direct query');
          useView = false;
        } else {
          throw viewError;
        }
      }

      // 如果视图不可用，直接从 event_participants 表查询
      if (!useView || !data) {
        console.log('[getParticipationDetail] Using direct query from event_participants');
        
        const { data: participant, error: participantError } = await supabase
          .from('event_participants')
          .select('*')
          .eq('id', participationId)
          .single();
        
        if (participantError || !participant) {
          console.error('[getParticipationDetail] Participant not found');
          return null;
        }
        
        // 查询关联的 event 信息
        let eventData = null;
        if (participant.event_id) {
          const { data: event } = await supabase
            .from('events')
            .select('*')
            .eq('id', participant.event_id)
            .single();
          eventData = event;
        }
        
        data = {
          ...participant,
          events: eventData
        };
      }

      if (!data) return null;

      // 根据查询方式处理数据格式
      const event = useView ? {
        id: data.event_id,
        title: data.event_title || '未知活动',
        description: data.event_description || '',
        startTime: data.event_start || new Date().toISOString(),
        endTime: data.event_end || new Date().toISOString(),
        location: data.event_location,
        type: 'offline',
        status: data.event_status || 'published',
        thumbnailUrl: data.event_thumbnail,
        participants: 0,
        maxParticipants: data.event_max_participants,
      } : {
        id: data.events?.id || data.event_id,
        title: data.events?.title || '未知活动',
        description: data.events?.description || '',
        startTime: data.events?.start_time || new Date().toISOString(),
        endTime: data.events?.end_time || new Date().toISOString(),
        location: data.events?.location,
        type: 'offline',
        status: data.events?.status || 'published',
        thumbnailUrl: data.events?.thumbnail_url,
        participants: data.events?.participants || 0,
        maxParticipants: data.events?.max_participants,
      };

      return {
        id: data.id,
        userId: data.user_id,
        eventId: data.event_id,
        participationStatus: this.mapStatus(useView ? data.participation_status : data.status),
        progress: data.progress || 0,
        currentStep: (data.current_step || 1) as ParticipationStep,
        submittedWorkId: data.submitted_work_id,
        submissionDate: data.submission_date,
        ranking: data.ranking,
        award: data.award,
        registrationDate: data.registration_date || data.created_at,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        event,
        submission: data.submission_id || data.submitted_work_id ? {
          id: data.submission_id || data.submitted_work_id,
          title: data.submission_title || '',
          status: data.submission_status || 'draft',
          score: data.submission_score,
          reviewNotes: data.review_notes,
        } : undefined,
      };
    } catch (error) {
      console.error('获取参与详情失败:', error);
      return null;
    }
  }

  /**
   * 获取用户参与统计
   */
  async getUserParticipationStats(userId: string): Promise<ParticipationStats> {
    try {
      // 使用 RPC 函数获取统计数据
      const { data, error } = await supabase.rpc('get_user_participation_stats', {
        p_user_id: userId,
      });

      if (error) {
        console.error('RPC 调用失败，使用备用查询:', error);
        
        // 备用：直接查询
        const { data: participations, error: participantsError } = await supabase
          .from('event_participants')
          .select('id')
          .eq('user_id', userId);

        if (participantsError) throw participantsError;

        const { data: submissions, error: subError } = await supabase
          .from('event_submissions')
          .select('id, vote_count, like_count')
          .eq('user_id', userId);

        if (subError) throw subError;

        const totalVotes = submissions?.reduce((sum, s) => sum + (s.vote_count || 0), 0) || 0;
        const totalLikes = submissions?.reduce((sum, s) => sum + (s.like_count || 0), 0) || 0;

        return {
          total: participations?.length || 0,
          totalVotes,
          totalLikes,
        };
      }

      return {
        total: data?.total || 0,
        totalVotes: data?.totalVotes || 0,
        totalLikes: data?.totalLikes || 0,
      };
    } catch (error) {
      console.error('获取参与统计失败:', error);
      return {
        total: 0,
        totalVotes: 0,
        totalLikes: 0,
      };
    }
  }

  // 获取用户活动统计（用于右侧栏）
  async getUserActivityStats(userId: string): Promise<{ registered: number; submitted: number; completed: number }> {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select('status')
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        registered: 0,
        submitted: 0,
        completed: 0,
      };

      (data || []).forEach((item: any) => {
        // 根据状态统计
        if (item.status === 'registered' || item.status === 'pending') {
          stats.registered++;
        } else if (item.status === 'submitted' || item.status === 'reviewing') {
          stats.submitted++;
        } else if (item.status === 'completed' || item.status === 'awarded') {
          stats.completed++;
        } else {
          // 默认计入已报名
          stats.registered++;
        }
      });

      return stats;
    } catch (error) {
      console.error('获取活动统计失败:', error);
      return {
        registered: 0,
        submitted: 0,
        completed: 0,
      };
    }
  }

  /**
   * 获取用户参与的活动的详细统计（用于数据分析页面）
   */
  async getUserParticipationDashboardStats(userId: string): Promise<{
    totalEvents: number;
    totalSubmissions: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    avgScore: number;
    publishedWorks: number;
    pendingReview: number;
  }> {
    try {
      // 获取用户参与的所有活动ID
      const { data: participations, error: participationsError } = await supabase
        .from('event_participants')
        .select('event_id')
        .eq('user_id', userId);

      if (participationsError) throw participationsError;

      const eventIds = participations?.map(p => p.event_id) || [];
      const totalEvents = eventIds.length;

      // 获取用户的作品提交
      const { data: submissions, error: submissionsError } = await supabase
        .from('event_submissions')
        .select('id, status, vote_count, like_count, rating_count, avg_rating')
        .eq('user_id', userId);

      if (submissionsError) throw submissionsError;

      const totalSubmissions = submissions?.length || 0;
      const totalViews = submissions?.reduce((sum, s) => sum + (s.vote_count || 0), 0) || 0;
      const totalLikes = submissions?.reduce((sum, s) => sum + (s.like_count || 0), 0) || 0;
      const totalComments = submissions?.reduce((sum, s) => sum + (s.rating_count || 0), 0) || 0;
      const publishedWorks = submissions?.filter(s => s.status === 'submitted' || s.status === 'reviewed').length || 0;
      const pendingReview = submissions?.filter(s => s.status === 'draft' || s.status === 'under_review').length || 0;

      // 计算平均分
      const scoredSubmissions = submissions?.filter(s => s.avg_rating > 0) || [];
      const avgScore = scoredSubmissions.length > 0
        ? scoredSubmissions.reduce((sum, s) => sum + (s.avg_rating || 0), 0) / scoredSubmissions.length
        : 0;

      return {
        totalEvents,
        totalSubmissions,
        totalViews,
        totalLikes,
        totalComments,
        avgScore: Math.round(avgScore * 10) / 10,
        publishedWorks,
        pendingReview,
      };
    } catch (error) {
      console.error('获取用户参与统计失败:', error);
      return {
        totalEvents: 0,
        totalSubmissions: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        avgScore: 0,
        publishedWorks: 0,
        pendingReview: 0,
      };
    }
  }

  /**
   * 更新参与进度
   */
  async updateProgress(
    participationId: string,
    step: ParticipationStep,
    progress: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('event_participants')
        .update({ 
          current_step: step,
          progress: progress,
          updated_at: new Date().toISOString()
        })
        .eq('id', participationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('更新进度失败:', error);
      return false;
    }
  }

  /**
   * 取消参与
   */
  async cancelParticipation(participationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('event_participants')
        .update({ status: 'cancelled' })
        .eq('id', participationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('取消参与失败:', error);
      return false;
    }
  }

  /**
   * 检查用户是否已报名活动
   */
  async checkParticipation(eventId: string, userId: string): Promise<{ isParticipated: boolean; participationId?: string; status?: ParticipationStatus }> {
    try {
      // 直接使用 Supabase 查询参与状态
      const { data, error } = await supabase
        .from('event_participants')
        .select('id, status')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('检查参与状态失败:', error);
        return { isParticipated: false };
      }

      return {
        isParticipated: !!data,
        participationId: data?.id,
        status: data?.status ? this.mapStatus(data.status) : undefined,
      };
    } catch (error) {
      console.error('检查参与状态失败:', error);
      return { isParticipated: false };
    }
  }

  /**
   * 报名参加活动
   */
  async registerForEvent(eventId: string, userId: string): Promise<{ success: boolean; participationId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('register_for_event_transaction', {
        p_event_id: eventId,
        p_user_id: userId,
      });

      if (error) throw error;

      if (data?.success) {
        return { success: true, participationId: data.registration_id };
      } else {
        return { success: false, error: data?.error || '报名失败' };
      }
    } catch (error: any) {
      console.error('报名活动失败:', error);
      return { success: false, error: error.message || '报名失败' };
    }
  }

  /**
   * 订阅参与状态变化（Realtime）
   */
  subscribeToParticipationChanges(
    userId: string,
    callback: (payload: any) => void
  ): () => void {
    const channel = supabase
      .channel(`participations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_participants',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // 辅助方法：映射状态
  private mapStatus(status: string): ParticipationStatus {
    const statusMap: Record<string, ParticipationStatus> = {
      'registered': 'registered',
      'checked_in': 'registered', // 已签到属于已报名状态
      'cancelled': 'cancelled',
      'submitted': 'reviewing', // 已提交作品进入评审中状态
      'reviewing': 'reviewing',
      'completed': 'completed',
      'awarded': 'awarded',
    };
    return statusMap[status] || 'registered';
  }
}

export const eventParticipationService = new EventParticipationService();
