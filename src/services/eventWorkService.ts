import { supabase, supabaseAdmin } from '@/lib/supabase';
import type { EventSubmission, SubmissionVote, SubmissionLike, SubmissionRating, UserInteraction } from '@/types';

export interface SubmissionWithStats extends EventSubmission {
  voteCount: number;
  likeCount: number;
  avgRating: number;
  ratingCount: number;
  coverImage?: string;
  mediaType: 'image' | 'video' | 'audio' | 'document' | 'other';
  eventTitle?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  creatorName?: string;
  creatorAvatar?: string;
  creatorFullName?: string;
}

export interface SubmissionFilters {
  mediaType?: 'image' | 'video' | 'audio' | 'document' | 'other' | 'all';
  sortBy?: 'newest' | 'popular' | 'rating' | 'votes';
  status?: 'draft' | 'submitted' | 'under_review' | 'reviewed' | 'rejected' | 'all';
}

class EventWorkService {
  /**
   * 获取活动的所有作品
   */
  async getEventSubmissions(
    eventId: string,
    filters: SubmissionFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ submissions: SubmissionWithStats[]; total: number }> {
    const { mediaType = 'all', sortBy = 'newest', status = 'submitted' } = filters;

    let query = supabase
      .from('submission_with_stats')
      .select('*', { count: 'exact' })
      .eq('event_id', eventId);

    // 应用媒体类型筛选
    if (mediaType !== 'all') {
      query = query.eq('media_type', mediaType);
    }

    // 应用状态筛选
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // 应用排序
    switch (sortBy) {
      case 'newest':
        query = query.order('submitted_at', { ascending: false });
        break;
      case 'popular':
        query = query.order('like_count', { ascending: false });
        break;
      case 'rating':
        query = query.order('avg_rating', { ascending: false });
        break;
      case 'votes':
        query = query.order('vote_count', { ascending: false });
        break;
    }

    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('获取活动作品失败:', error);
      throw new Error('获取活动作品失败: ' + error.message);
    }

    return {
      submissions: (data || []).map(this.mapToSubmissionWithStats),
      total: count || 0,
    };
  }

  /**
   * 获取单个作品详情
   */
  async getSubmissionDetail(submissionId: string): Promise<SubmissionWithStats | null> {
    const { data, error } = await supabase
      .from('submission_with_stats')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (error) {
      console.error('获取作品详情失败:', error);
      throw new Error('获取作品详情失败: ' + error.message);
    }

    return data ? this.mapToSubmissionWithStats(data) : null;
  }

  /**
   * 获取用户对多个作品的交互状态
   */
  async getUserInteractions(
    userId: string,
    submissionIds: string[]
  ): Promise<Map<string, UserInteraction>> {
    if (!submissionIds.length) return new Map();

    const { data, error } = await supabase.rpc('get_user_interactions', {
      p_user_id: userId,
      p_submission_ids: submissionIds,
    });

    if (error) {
      console.error('获取用户交互状态失败:', error);
      return new Map();
    }

    const interactions = new Map<string, UserInteraction>();
    (data || []).forEach((item: any) => {
      interactions.set(item.submission_id, {
        hasVoted: item.has_voted,
        hasLiked: item.has_liked,
        userRating: item.user_rating,
      });
    });

    return interactions;
  }

  /**
   * 提交投票（切换投票状态）
   */
  async submitVote(submissionId: string, userId: string): Promise<{ success: boolean; action: 'added' | 'removed'; message: string }> {
    const { data, error } = await supabase.rpc('submit_vote', {
      p_submission_id: submissionId,
      p_user_id: userId,
    });

    if (error) {
      console.error('投票失败:', error);
      throw new Error('投票失败: ' + error.message);
    }

    return data as { success: boolean; action: 'added' | 'removed'; message: string };
  }

  /**
   * 提交点赞（切换点赞状态）
   */
  async submitLike(submissionId: string, userId: string): Promise<{ success: boolean; action: 'added' | 'removed'; message: string }> {
    const { data, error } = await supabase.rpc('submit_like', {
      p_submission_id: submissionId,
      p_user_id: userId,
    });

    if (error) {
      console.error('点赞失败:', error);
      throw new Error('点赞失败: ' + error.message);
    }

    return data as { success: boolean; action: 'added' | 'removed'; message: string };
  }

  /**
   * 提交评分
   */
  async submitRating(
    submissionId: string,
    userId: string,
    rating: number,
    comment?: string
  ): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc('submit_rating', {
      p_submission_id: submissionId,
      p_user_id: userId,
      p_rating: rating,
      p_comment: comment || null,
    });

    if (error) {
      console.error('评分失败:', error);
      throw new Error('评分失败: ' + error.message);
    }

    return data as { success: boolean; message: string };
  }

  /**
   * 获取作品的评分列表
   */
  async getSubmissionRatings(submissionId: string, page: number = 1, pageSize: number = 10): Promise<{
    ratings: (SubmissionRating & { userName?: string; userAvatar?: string })[];
    total: number;
  }> {
    const { data, error, count } = await supabase
      .from('submission_ratings')
      .select(`
        *,
        user:user_id (raw_user_meta_data->>username, raw_user_meta_data->>avatar_url)
      `, { count: 'exact' })
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      console.error('获取评分列表失败:', error);
      throw new Error('获取评分列表失败: ' + error.message);
    }

    const ratings = (data || []).map((item: any) => ({
      ...item,
      userName: item.user?.username,
      userAvatar: item.user?.avatar_url,
    }));

    return { ratings, total: count || 0 };
  }

  /**
   * 获取活动的作品数量
   */
  async getEventSubmissionCount(eventId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('event_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'submitted');

      if (error) {
        console.error('获取作品数量失败:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('获取作品数量失败:', error);
      return 0;
    }
  }

  /**
   * 获取热门作品（用于推荐）
   */
  async getPopularSubmissions(eventId: string, limit: number = 5): Promise<SubmissionWithStats[]> {
    const { data, error } = await supabase
      .from('submission_with_stats')
      .select('*')
      .eq('event_id', eventId)
      .order('like_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('获取热门作品失败:', error);
      return [];
    }

    return (data || []).map(this.mapToSubmissionWithStats);
  }

  /**
   * 数据映射函数
   */
  private mapToSubmissionWithStats(data: any): SubmissionWithStats {
    return {
      id: data.id,
      eventId: data.event_id,
      userId: data.user_id,
      participationId: data.participation_id,
      title: data.title,
      description: data.description,
      files: data.files || [],
      status: data.status,
      submittedAt: data.submitted_at,
      reviewedAt: data.reviewed_at,
      reviewNotes: data.review_notes,
      score: data.score,
      metadata: data.metadata || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      voteCount: data.vote_count || 0,
      likeCount: data.like_count || 0,
      avgRating: data.avg_rating || 0,
      ratingCount: data.rating_count || 0,
      coverImage: data.cover_image,
      mediaType: data.media_type || 'image',
      eventTitle: data.event_title,
      eventStartTime: data.event_start_time,
      eventEndTime: data.event_end_time,
      creatorName: data.creator_name,
      creatorAvatar: data.creator_avatar,
      creatorFullName: data.creator_full_name,
    };
  }
}

export const eventWorkService = new EventWorkService();
export default eventWorkService;
