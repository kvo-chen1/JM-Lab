import { supabase } from '@/lib/supabase';
import type { EventSubmission, SubmissionRating, UserInteraction } from '@/types';

export interface SubmissionWithStats extends EventSubmission {
  voteCount: number;
  likeCount: number;
  avgRating: number;
  ratingCount: number;
  coverImage?: string;
  workThumbnail?: string;
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

    // 首先获取基础提交数据
    let query = supabase
      .from('event_submissions')
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

    const { data: submissionsData, error: submissionsError, count } = await query;

    if (submissionsError) {
      console.error('获取活动作品失败:', submissionsError);
      throw new Error('获取活动作品失败: ' + submissionsError.message);
    }

    if (!submissionsData || submissionsData.length === 0) {
      return {
        submissions: [],
        total: count || 0,
      };
    }

    // 获取提交ID列表用于查询统计数据
    const submissionIds = submissionsData.map(s => s.id);
    // 获取用户ID列表用于查询用户信息
    const userIds = [...new Set(submissionsData.map(s => s.user_id).filter(Boolean))];

    // 并行获取统计数据和用户信息
    const [votesResult, likesResult, ratingsResult, usersResult] = await Promise.all([
      // 获取投票数
      supabase
        .from('submission_votes')
        .select('submission_id')
        .in('submission_id', submissionIds),
      // 获取点赞数
      supabase
        .from('submission_likes')
        .select('submission_id')
        .in('submission_id', submissionIds),
      // 获取评分
      supabase
        .from('submission_ratings')
        .select('submission_id, rating')
        .in('submission_id', submissionIds),
      // 获取用户信息
      userIds.length > 0
        ? supabase
            .from('users')
            .select('id, username, avatar_url')
            .in('id', userIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    // 计算统计数据
    const voteCounts = new Map<string, number>();
    const likeCounts = new Map<string, number>();
    const ratingSums = new Map<string, number>();
    const ratingCounts = new Map<string, number>();

    (votesResult.data || []).forEach((v: any) => {
      voteCounts.set(v.submission_id, (voteCounts.get(v.submission_id) || 0) + 1);
    });

    (likesResult.data || []).forEach((l: any) => {
      likeCounts.set(l.submission_id, (likeCounts.get(l.submission_id) || 0) + 1);
    });

    (ratingsResult.data || []).forEach((r: any) => {
      ratingSums.set(r.submission_id, (ratingSums.get(r.submission_id) || 0) + r.rating);
      ratingCounts.set(r.submission_id, (ratingCounts.get(r.submission_id) || 0) + 1);
    });

    // 构建用户信息映射
    const usersMap = new Map<string, { username?: string; avatar_url?: string }>();
    (usersResult.data || []).forEach((user: any) => {
      usersMap.set(user.id, {
        username: user.username,
        avatar_url: user.avatar_url,
      });
    });

    // 合并数据
    const submissionsWithStats = submissionsData.map(submission => {
      const voteCount = voteCounts.get(submission.id) || 0;
      const likeCount = likeCounts.get(submission.id) || 0;
      const ratingSum = ratingSums.get(submission.id) || 0;
      const ratingCount = ratingCounts.get(submission.id) || 0;
      const avgRating = ratingCount > 0 ? ratingSum / ratingCount : 0;
      const userInfo = usersMap.get(submission.user_id);

      return {
        ...submission,
        vote_count: voteCount,
        like_count: likeCount,
        avg_rating: avgRating,
        rating_count: ratingCount,
        creator_name: userInfo?.username || '匿名用户',
        creator_avatar: userInfo?.avatar_url,
        creator_full_name: undefined,
      };
    });

    return {
      submissions: submissionsWithStats.map(this.mapToSubmissionWithStats),
      total: count || 0,
    };
  }

  /**
   * 获取单个作品详情
   */
  async getSubmissionDetail(submissionId: string): Promise<SubmissionWithStats | null> {
    // 获取基础提交数据
    const { data: submission, error: submissionError } = await supabase
      .from('event_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError) {
      console.error('获取作品详情失败:', submissionError);
      throw new Error('获取作品详情失败: ' + submissionError.message);
    }

    if (!submission) return null;

    // 获取统计数据和用户信息
    const [votesResult, likesResult, ratingsResult, userResult] = await Promise.all([
      supabase
        .from('submission_votes')
        .select('submission_id')
        .eq('submission_id', submissionId),
      supabase
        .from('submission_likes')
        .select('submission_id')
        .eq('submission_id', submissionId),
      supabase
        .from('submission_ratings')
        .select('rating')
        .eq('submission_id', submissionId),
      // 获取用户信息
      submission.user_id
        ? supabase
            .from('users')
            .select('username, avatar_url')
            .eq('id', submission.user_id)
            .single()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const voteCount = (votesResult.data || []).length;
    const likeCount = (likesResult.data || []).length;
    const ratings = ratingsResult.data || [];
    const ratingCount = ratings.length;
    const avgRating = ratingCount > 0
      ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratingCount
      : 0;

    const userInfo = userResult.data;

    const submissionWithStats = {
      ...submission,
      vote_count: voteCount,
      like_count: likeCount,
      avg_rating: avgRating,
      rating_count: ratingCount,
      creator_name: userInfo?.username || '匿名用户',
      creator_avatar: userInfo?.avatar_url,
      creator_full_name: undefined,
    };

    return this.mapToSubmissionWithStats(submissionWithStats);
  }

  /**
   * 获取用户对多个作品的交互状态
   */
  async getUserInteractions(
    userId: string,
    submissionIds: string[]
  ): Promise<Map<string, UserInteraction>> {
    if (!submissionIds.length) return new Map();

    // 使用 Promise.all 并行查询投票、点赞和评分状态
    const [votesResult, likesResult, ratingsResult] = await Promise.all([
      // 查询投票状态
      supabase
        .from('submission_votes')
        .select('submission_id')
        .eq('user_id', userId)
        .in('submission_id', submissionIds),
      // 查询点赞状态
      supabase
        .from('submission_likes')
        .select('submission_id')
        .eq('user_id', userId)
        .in('submission_id', submissionIds),
      // 查询评分状态
      supabase
        .from('submission_ratings')
        .select('submission_id, rating')
        .eq('user_id', userId)
        .in('submission_id', submissionIds),
    ]);

    if (votesResult.error) {
      console.error('获取投票状态失败:', votesResult.error);
    }
    if (likesResult.error) {
      console.error('获取点赞状态失败:', likesResult.error);
    }
    if (ratingsResult.error) {
      console.error('获取评分状态失败:', ratingsResult.error);
    }

    // 构建交互状态映射
    const votedIds = new Set((votesResult.data || []).map((v: any) => v.submission_id));
    const likedIds = new Set((likesResult.data || []).map((l: any) => l.submission_id));
    const ratingsMap = new Map((ratingsResult.data || []).map((r: any) => [r.submission_id, r.rating]));

    const interactions = new Map<string, UserInteraction>();
    submissionIds.forEach((id) => {
      interactions.set(id, {
        hasVoted: votedIds.has(id),
        hasLiked: likedIds.has(id),
        userRating: ratingsMap.get(id),
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
    // 获取基础提交数据
    const { data: submissions, error } = await supabase
      .from('event_submissions')
      .select('*')
      .eq('event_id', eventId)
      .order('like_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('获取热门作品失败:', error);
      return [];
    }

    if (!submissions || submissions.length === 0) return [];

    // 获取提交ID列表和用户ID列表
    const submissionIds = submissions.map(s => s.id);
    const userIds = [...new Set(submissions.map(s => s.user_id).filter(Boolean))];

    // 并行获取统计数据和用户信息
    const [votesResult, likesResult, ratingsResult, usersResult] = await Promise.all([
      supabase
        .from('submission_votes')
        .select('submission_id')
        .in('submission_id', submissionIds),
      supabase
        .from('submission_likes')
        .select('submission_id')
        .in('submission_id', submissionIds),
      supabase
        .from('submission_ratings')
        .select('submission_id, rating')
        .in('submission_id', submissionIds),
      // 获取用户信息
      userIds.length > 0
        ? supabase
            .from('users')
            .select('id, username, avatar_url')
            .in('id', userIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    // 计算统计数据
    const voteCounts = new Map<string, number>();
    const likeCounts = new Map<string, number>();
    const ratingSums = new Map<string, number>();
    const ratingCounts = new Map<string, number>();

    (votesResult.data || []).forEach((v: any) => {
      voteCounts.set(v.submission_id, (voteCounts.get(v.submission_id) || 0) + 1);
    });

    (likesResult.data || []).forEach((l: any) => {
      likeCounts.set(l.submission_id, (likeCounts.get(l.submission_id) || 0) + 1);
    });

    (ratingsResult.data || []).forEach((r: any) => {
      ratingSums.set(r.submission_id, (ratingSums.get(r.submission_id) || 0) + r.rating);
      ratingCounts.set(r.submission_id, (ratingCounts.get(r.submission_id) || 0) + 1);
    });

    // 构建用户信息映射
    const usersMap = new Map<string, { username?: string; avatar_url?: string }>();
    (usersResult.data || []).forEach((user: any) => {
      usersMap.set(user.id, {
        username: user.username,
        avatar_url: user.avatar_url,
      });
    });

    // 合并数据
    const submissionsWithStats = submissions.map(submission => {
      const voteCount = voteCounts.get(submission.id) || 0;
      const likeCount = likeCounts.get(submission.id) || 0;
      const ratingSum = ratingSums.get(submission.id) || 0;
      const ratingCount = ratingCounts.get(submission.id) || 0;
      const avgRating = ratingCount > 0 ? ratingSum / ratingCount : 0;
      const userInfo = usersMap.get(submission.user_id);

      return {
        ...submission,
        vote_count: voteCount,
        like_count: likeCount,
        avg_rating: avgRating,
        rating_count: ratingCount,
        creator_name: userInfo?.username || '匿名用户',
        creator_avatar: userInfo?.avatar_url,
        creator_full_name: undefined,
      };
    });

    return submissionsWithStats.map(this.mapToSubmissionWithStats);
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
      workThumbnail: data.work_thumbnail,
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
