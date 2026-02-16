import { supabase } from '@/lib/supabase';
import { SubmissionFile } from './eventSubmissionService';

// 评分记录接口
export interface ScoreRecord {
  id: string;
  submissionId: string;
  judgeId: string;
  judgeName?: string;
  judgeAvatar?: string;
  score: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

// 评分统计接口
export interface ScoreStats {
  avgScore: number;
  maxScore: number;
  minScore: number;
  scoreCount: number;
  judgeCount: number;
}

// 作品评分数据接口
export interface WorkScoringData {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  creatorName: string;
  creatorAvatar?: string;
  title: string;
  description: string;
  files: SubmissionFile[];
  submittedAt: string;
  status: string;
  isPublished: boolean;
  publishedAt?: string;
  avgScore?: number;
  scoreCount: number;
  judgeCount: number;
}

// 作品详情接口
export interface WorkDetail extends WorkScoringData {
  scores: ScoreRecord[];
  scoreStats: ScoreStats;
}

// 品牌活动接口
export interface BrandEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  submissionCount: number;
}

// 筛选条件接口
export interface WorkFilterOptions {
  eventId?: string;
  status?: 'submitted' | 'under_review' | 'reviewed' | 'all';
  scoreStatus?: 'unscored' | 'scored' | 'published' | 'all';
  searchQuery?: string;
  sortBy?: 'submitted_at' | 'score' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// 分页结果接口
export interface PaginatedWorks {
  works: WorkScoringData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 操作日志接口
export interface ScoreAuditLog {
  id: string;
  submissionId: string;
  judgeId: string;
  judgeName: string;
  action: 'score' | 'update_score' | 'delete_score' | 'publish' | 'unpublish';
  oldScore?: number;
  newScore?: number;
  comment?: string;
  createdAt: string;
}

class WorkScoringService {
  /**
   * 获取品牌方的活动列表
   */
  async getBrandEvents(userId: string): Promise<BrandEvent[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_brand_events', { p_user_id: userId });

      if (error) throw error;
      
      return (data || []).map((event: any) => ({
        id: event.id,
        title: event.title,
        startTime: event.start_time,
        endTime: event.end_time,
        status: event.status,
        submissionCount: Number(event.submission_count) || 0,
      }));
    } catch (error) {
      console.error('获取品牌活动列表失败:', error);
      return [];
    }
  }

  /**
   * 获取作品列表（带筛选和分页）
   */
  async getWorks(options: WorkFilterOptions): Promise<PaginatedWorks> {
    try {
      const {
        eventId,
        status = 'all',
        scoreStatus = 'all',
        searchQuery,
        sortBy = 'submitted_at',
        sortOrder = 'desc',
        page = 1,
        limit = 20,
      } = options;

      const { data, error } = await supabase
        .rpc('get_works_for_scoring', {
          p_event_id: eventId || null,
          p_status: status,
          p_score_status: scoreStatus,
          p_search_query: searchQuery || null,
          p_sort_by: sortBy,
          p_sort_order: sortOrder,
          p_page: page,
          p_limit: limit,
        });

      if (error) throw error;

      const result = data || { works: [], total: 0, page: 1, limit: 20, total_pages: 0 };

      return {
        works: (result.works || []).map((work: any) => this.formatWorkData(work)),
        total: result.total || 0,
        page: result.page || 1,
        limit: result.limit || 20,
        totalPages: result.total_pages || 0,
      };
    } catch (error) {
      console.error('获取作品列表失败:', error);
      return {
        works: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };
    }
  }

  /**
   * 获取作品详情
   */
  async getWorkDetail(submissionId: string): Promise<WorkDetail | null> {
    try {
      // 获取作品基本信息
      const { data: workData, error: workError } = await supabase
        .from('submission_full_details')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (workError || !workData) {
        console.error('获取作品详情失败:', workError);
        return null;
      }

      // 获取评分详情
      const { data: scoresData, error: scoresError } = await supabase
        .rpc('get_submission_scores', { p_submission_id: submissionId });

      if (scoresError) {
        console.error('获取评分详情失败:', scoresError);
      }

      const scores = scoresData?.scores || [];
      const stats = scoresData?.stats || {
        avg_score: 0,
        max_score: 0,
        min_score: 0,
        score_count: 0,
        judge_count: 0,
      };

      return {
        ...this.formatWorkData(workData),
        scores: scores.map((s: any) => ({
          id: s.id,
          submissionId: submissionId,
          judgeId: s.judge_id,
          judgeName: s.judge_name,
          judgeAvatar: s.judge_avatar,
          score: s.score,
          comment: s.comment,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        })),
        scoreStats: {
          avgScore: stats.avg_score || 0,
          maxScore: stats.max_score || 0,
          minScore: stats.min_score || 0,
          scoreCount: stats.score_count || 0,
          judgeCount: stats.judge_count || 0,
        },
      };
    } catch (error) {
      console.error('获取作品详情失败:', error);
      return null;
    }
  }

  /**
   * 提交评分
   */
  async submitScore(
    submissionId: string,
    judgeId: string,
    score: number,
    comment?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('submit_score', {
          p_submission_id: submissionId,
          p_judge_id: judgeId,
          p_score: score,
          p_comment: comment || null,
        });

      if (error) throw error;

      if (data?.success) {
        return {
          success: true,
          message: data.message,
        };
      } else {
        return {
          success: false,
          error: data?.error || '评分提交失败',
        };
      }
    } catch (error: any) {
      console.error('提交评分失败:', error);
      return {
        success: false,
        error: error.message || '评分提交失败',
      };
    }
  }

  /**
   * 更新评分
   */
  async updateScore(
    scoreId: string,
    score: number,
    comment?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('submission_scores')
        .update({
          score,
          comment: comment || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', scoreId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('更新评分失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 删除评分
   */
  async deleteScore(scoreId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('submission_scores')
        .delete()
        .eq('id', scoreId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('删除评分失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 批量发布评分结果
   */
  async batchPublish(
    submissionIds: string[],
    publishedBy: string
  ): Promise<{ success: boolean; results: Array<{ id: string; success: boolean; error?: string }> }> {
    try {
      const { data, error } = await supabase
        .rpc('batch_publish_scores', {
          p_submission_ids: submissionIds,
          p_published_by: publishedBy,
        });

      if (error) throw error;

      const results = (data || []).map((r: any) => ({
        id: r.submission_id,
        success: r.success,
        error: r.error,
      }));

      return {
        success: results.every((r: any) => r.success),
        results,
      };
    } catch (error: any) {
      console.error('批量发布失败:', error);
      return {
        success: false,
        results: submissionIds.map(id => ({
          id,
          success: false,
          error: error.message,
        })),
      };
    }
  }

  /**
   * 单个发布/取消发布评分
   */
  async publishScore(
    submissionId: string,
    publish: boolean,
    publishedBy: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('publish_score', {
          p_submission_id: submissionId,
          p_publish: publish,
          p_published_by: publishedBy,
        });

      if (error) throw error;

      if (data?.success) {
        return {
          success: true,
          message: data.message,
        };
      } else {
        return {
          success: false,
          error: data?.error || '操作失败',
        };
      }
    } catch (error: any) {
      console.error('发布评分失败:', error);
      return {
        success: false,
        error: error.message || '操作失败',
      };
    }
  }

  /**
   * 获取评分操作日志
   */
  async getScoreAuditLogs(submissionId?: string, limit: number = 50): Promise<ScoreAuditLog[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_score_audit_logs', {
          p_submission_id: submissionId || null,
          p_limit: limit,
        });

      if (error) throw error;

      return (data || []).map((log: any) => ({
        id: log.id,
        submissionId: log.submission_id,
        judgeId: log.judge_id,
        judgeName: log.judge_name,
        action: log.action,
        oldScore: log.old_score,
        newScore: log.new_score,
        comment: log.comment,
        createdAt: log.created_at,
      }));
    } catch (error) {
      console.error('获取评分日志失败:', error);
      return [];
    }
  }

  /**
   * 获取当前用户的评分
   */
  async getMyScore(submissionId: string, judgeId: string): Promise<ScoreRecord | null> {
    try {
      const { data, error } = await supabase
        .from('submission_scores')
        .select('*')
        .eq('submission_id', submissionId)
        .eq('judge_id', judgeId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        submissionId: data.submission_id,
        judgeId: data.judge_id,
        score: data.score,
        comment: data.comment,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('获取我的评分失败:', error);
      return null;
    }
  }

  /**
   * 格式化作品数据
   */
  private formatWorkData(work: any): WorkScoringData {
    return {
      id: work.id,
      eventId: work.event_id,
      eventTitle: work.event_title || '',
      userId: work.user_id,
      creatorName: work.creator_name || '未知用户',
      creatorAvatar: work.creator_avatar,
      title: work.title || '',
      description: work.description || '',
      files: work.files || [],
      submittedAt: work.submitted_at || work.created_at,
      status: work.status || 'submitted',
      isPublished: work.is_published || false,
      publishedAt: work.published_at,
      avgScore: work.avg_score,
      scoreCount: Number(work.score_count) || 0,
      judgeCount: Number(work.judge_count) || 0,
    };
  }

  /**
   * 获取作品排名数据
   */
  async getWorkRankings(
    eventId: string,
    limit: number = 10
  ): Promise<{
    rankedWorks: WorkScoringData[];
    stats: {
      totalWorks: number;
      scoredWorks: number;
      avgScore: number;
      maxScore: number;
      minScore: number;
    };
  }> {
    try {
      // 获取所有作品
      const { data, error } = await supabase
        .rpc('get_works_for_scoring', {
          p_event_id: eventId,
          p_status: 'all',
          p_score_status: 'all',
          p_search_query: null,
          p_sort_by: 'score',
          p_sort_order: 'desc',
          p_page: 1,
          p_limit: 100, // 获取足够多的数据用于排名
        });

      if (error) throw error;

      const allWorks = (data?.works || []).map((work: any) => this.formatWorkData(work));
      
      // 过滤出有评分的作品并排序
      const scoredWorks = allWorks
        .filter((w: WorkScoringData) => w.avgScore !== undefined && w.avgScore > 0)
        .sort((a: WorkScoringData, b: WorkScoringData) => (b.avgScore || 0) - (a.avgScore || 0));

      // 计算统计数据
      const scores = scoredWorks.map((w: WorkScoringData) => w.avgScore || 0);
      const stats = {
        totalWorks: allWorks.length,
        scoredWorks: scoredWorks.length,
        avgScore: scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0,
        maxScore: scores.length > 0 ? Math.max(...scores) : 0,
        minScore: scores.length > 0 ? Math.min(...scores) : 0,
      };

      return {
        rankedWorks: scoredWorks.slice(0, limit),
        stats,
      };
    } catch (error) {
      console.error('获取作品排名失败:', error);
      return {
        rankedWorks: [],
        stats: {
          totalWorks: 0,
          scoredWorks: 0,
          avgScore: 0,
          maxScore: 0,
          minScore: 0,
        },
      };
    }
  }
}

export const workScoringService = new WorkScoringService();
export default workScoringService;
