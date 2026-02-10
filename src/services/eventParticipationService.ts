import { supabase } from '@/lib/supabase';

// 参与状态类型
export type ParticipationStatus = 'registered' | 'submitted' | 'reviewing' | 'completed' | 'awarded' | 'cancelled';

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
  registered: number;
  submitted: number;
  reviewing: number;
  completed: number;
  awarded: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
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

      // 使用视图获取参与详情
      let query = supabase
        .from('user_participation_details')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // 应用状态筛选
      if (filter.status && filter.status !== 'all') {
        query = query.eq('participation_status', filter.status);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (!data || data.length === 0) {
        return { data: [], total: 0 };
      }

      // 格式化数据
      const formattedData: ParticipationDetail[] = data.map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        eventId: item.event_id,
        participationStatus: this.mapStatus(item.participation_status),
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
        event: {
          id: item.event_id,
          title: item.event_title || '未知活动',
          description: item.event_description || '',
          startTime: item.event_start || new Date().toISOString(),
          endTime: item.event_end || new Date().toISOString(),
          location: item.event_location,
          type: 'offline',
          status: item.event_status || 'published',
          thumbnailUrl: item.event_thumbnail,
          participants: 0, // 视图已移除该字段
          maxParticipants: item.event_max_participants,
        },
        submission: item.submission_id ? {
          id: item.submission_id,
          title: item.submission_title || '',
          status: item.submission_status || 'draft',
          score: item.submission_score,
          reviewNotes: item.review_notes,
        } : undefined,
      }));

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
      const { data, error } = await supabase
        .from('user_participation_details')
        .select('*')
        .eq('id', participationId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        eventId: data.event_id,
        participationStatus: this.mapStatus(data.participation_status),
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
        event: {
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
        },
        submission: data.submission_id ? {
          id: data.submission_id,
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
      const { data, error } = await supabase
        .from('event_participants')
        .select('status')
        .eq('user_id', userId);

      if (error) throw error;

      const stats: ParticipationStats = {
        total: 0,
        registered: 0,
        submitted: 0,
        reviewing: 0,
        completed: 0,
        awarded: 0,
        totalViews: 0,
        totalLikes: 0,
        totalShares: 0,
      };

      (data || []).forEach((item: any) => {
        stats.total++;
        switch (item.status) {
          case 'registered':
            stats.registered++;
            break;
          case 'submitted':
            stats.submitted++;
            break;
          case 'reviewing':
            stats.reviewing++;
            break;
          case 'completed':
            stats.completed++;
            break;
          case 'awarded':
            stats.awarded++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('获取参与统计失败:', error);
      return {
        total: 0,
        registered: 0,
        submitted: 0,
        reviewing: 0,
        completed: 0,
        awarded: 0,
        totalViews: 0,
        totalLikes: 0,
        totalShares: 0,
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
      const { data, error } = await supabase
        .from('event_participants')
        .select('id, status')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

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
      'checked_in': 'submitted',
      'cancelled': 'cancelled',
      'submitted': 'submitted',
      'reviewing': 'reviewing',
      'completed': 'completed',
      'awarded': 'awarded',
    };
    return statusMap[status] || 'registered';
  }
}

export const eventParticipationService = new EventParticipationService();
