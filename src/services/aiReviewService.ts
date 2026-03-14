/**
 * AI点评服务
 * 提供AI点评记录的保存、查询等功能
 */

import { supabase } from '@/lib/supabase';
import { WorkReviewResult } from './llmService';
import { inspirationMindMapService } from './inspirationMindMapService';

// AI点评记录类型
export interface AIReviewRecord {
  id: string;
  workId: string;
  prompt: string;
  aiExplanation: string;
  overallScore: number;
  culturalFitScore: number;
  creativityScore: number;
  aestheticsScore: number;
  commercialPotentialScore?: number;
  culturalFitDetails: string[];
  creativityDetails: string[];
  aestheticsDetails: string[];
  suggestions: string[];
  highlights: string[];
  commercialAnalysis?: string[];
  recommendedCommercialPaths?: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  relatedActivities?: Array<{
    title: string;
    deadline: string;
    reward: string;
    image?: string;
  }>;
  similarWorks?: Array<{
    id: string;
    thumbnail: string;
    title: string;
  }>;
  workThumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

// 保存AI点评请求参数
export interface SaveAIReviewParams {
  workId: string;
  prompt: string;
  aiExplanation: string;
  reviewResult: WorkReviewResult;
  workThumbnail?: string;
}

// 获取点评列表响应
export interface AIReviewListResponse {
  reviews: Array<{
    id: string;
    workId: string;
    prompt: string;
    overallScore: number;
    culturalFitScore: number;
    creativityScore: number;
    aestheticsScore: number;
    commercialPotentialScore?: number;
    highlights: string[];
    workThumbnail?: string;
    createdAt: string;
  }>;
  total: number;
}

class AIReviewService {
  /**
   * 保存AI点评记录
   * @param userId 用户ID
   * @param params 点评参数
   * @returns 保存的记录ID
   */
  async saveAIReview(userId: string, params: SaveAIReviewParams): Promise<string | null> {
    try {
      const { workId, prompt, aiExplanation, reviewResult, workThumbnail } = params;

      // 调用RPC函数保存点评记录
      const { data, error } = await supabase.rpc('save_ai_review', {
        p_user_id: userId,
        p_work_id: workId,
        p_prompt: prompt,
        p_ai_explanation: aiExplanation,
        p_overall_score: reviewResult.overallScore,
        p_cultural_fit_score: reviewResult.culturalFit.score,
        p_creativity_score: reviewResult.creativity.score,
        p_aesthetics_score: reviewResult.aesthetics.score,
        p_commercial_potential_score: reviewResult.commercialPotential?.score || null,
        p_cultural_fit_details: JSON.stringify(reviewResult.culturalFit.details),
        p_creativity_details: JSON.stringify(reviewResult.creativity.details),
        p_aesthetics_details: JSON.stringify(reviewResult.aesthetics.details),
        p_suggestions: JSON.stringify(reviewResult.suggestions),
        p_highlights: JSON.stringify(reviewResult.highlights),
        p_commercial_analysis: JSON.stringify(reviewResult.commercialPotential?.analysis || []),
        p_recommended_commercial_paths: JSON.stringify(reviewResult.recommendedCommercialPaths || []),
        p_related_activities: JSON.stringify(reviewResult.relatedActivities || []),
        p_similar_works: JSON.stringify([]), // 相似作品不存储，实时获取
        p_work_thumbnail: workThumbnail || null
      });

      if (error) {
        console.error('保存AI点评记录失败:', error);
        return null;
      }

      // 同步到津脉脉络
      (async () => {
        try {
          // 获取或创建用户的默认津脉脉络
          const mindMaps = await inspirationMindMapService.getUserMindMaps(userId);
          let mindMap = mindMaps.find(m => m.title === '我的创作脉络') || mindMaps[0];

          if (!mindMap) {
            console.log('[InspirationMindMap] Creating default mind map for user');
            mindMap = await inspirationMindMapService.createMindMap(userId, '我的创作脉络');
          }

          // 添加AI点评节点
          const nodeData = {
            title: `AI点评: ${reviewResult.overallScore}分`,
            description: `AI智能点评作品\n文化契合度: ${reviewResult.culturalFit.score}分 | 创意性: ${reviewResult.creativity.score}分 | 美观度: ${reviewResult.aesthetics.score}分`,
            category: 'ai_generate' as const,
            content: {
              type: 'ai_review',
              workThumbnail: workThumbnail,
              prompt: prompt,
              overallScore: reviewResult.overallScore,
              culturalFitScore: reviewResult.culturalFit.score,
              creativityScore: reviewResult.creativity.score,
              aestheticsScore: reviewResult.aesthetics.score,
              commercialPotentialScore: reviewResult.commercialPotential?.score,
              highlights: reviewResult.highlights,
              suggestions: reviewResult.suggestions,
              reviewedAt: new Date().toISOString(),
            },
            tags: ['AI点评', '智能评测', '作品分析'],
          };

          await inspirationMindMapService.addNode(mindMap.id, nodeData);
          console.log('[InspirationMindMap] Added AI review node to mind map:', mindMap.id);
        } catch (err) {
          console.error('[InspirationMindMap] Failed to sync AI review to mind map:', err);
          // 不影响主流程，仅记录错误
        }
      })();

      return data;
    } catch (error) {
      console.error('保存AI点评记录异常:', error);
      return null;
    }
  }

  /**
   * 获取用户的AI点评历史记录
   * @param userId 用户ID
   * @param limit 每页数量
   * @param offset 偏移量
   * @returns 点评列表
   */
  async getUserAIReviews(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<AIReviewListResponse> {
    try {
      // 调用RPC函数获取列表
      const { data, error } = await supabase.rpc('get_user_ai_reviews', {
        p_user_id: userId,
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        console.error('获取AI点评历史失败:', error);
        return { reviews: [], total: 0 };
      }

      // 获取总数
      const { count, error: countError } = await supabase
        .from('ai_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        console.error('获取AI点评总数失败:', countError);
      }

      const reviews = (data || []).map((item: any) => ({
        id: item.id,
        workId: item.work_id,
        prompt: item.prompt,
        overallScore: item.overall_score,
        culturalFitScore: item.cultural_fit_score,
        creativityScore: item.creativity_score,
        aestheticsScore: item.aesthetics_score,
        commercialPotentialScore: item.commercial_potential_score,
        highlights: Array.isArray(item.highlights) ? item.highlights : JSON.parse(item.highlights || '[]'),
        workThumbnail: item.work_thumbnail,
        createdAt: item.created_at
      }));

      return {
        reviews,
        total: count || reviews.length
      };
    } catch (error) {
      console.error('获取AI点评历史异常:', error);
      return { reviews: [], total: 0 };
    }
  }

  /**
   * 获取单个AI点评详情
   * @param reviewId 点评记录ID
   * @param userId 用户ID
   * @returns 点评详情
   */
  async getAIReviewDetail(reviewId: string, userId: string): Promise<AIReviewRecord | null> {
    try {
      const { data, error } = await supabase.rpc('get_ai_review_detail', {
        p_review_id: reviewId,
        p_user_id: userId
      });

      if (error || !data || data.length === 0) {
        console.error('获取AI点评详情失败:', error);
        return null;
      }

      const item = data[0];
      return {
        id: item.id,
        workId: item.work_id,
        prompt: item.prompt,
        aiExplanation: item.ai_explanation,
        overallScore: item.overall_score,
        culturalFitScore: item.cultural_fit_score,
        creativityScore: item.creativity_score,
        aestheticsScore: item.aesthetics_score,
        commercialPotentialScore: item.commercial_potential_score,
        culturalFitDetails: Array.isArray(item.cultural_fit_details) 
          ? item.cultural_fit_details 
          : JSON.parse(item.cultural_fit_details || '[]'),
        creativityDetails: Array.isArray(item.creativity_details) 
          ? item.creativity_details 
          : JSON.parse(item.creativity_details || '[]'),
        aestheticsDetails: Array.isArray(item.aesthetics_details) 
          ? item.aesthetics_details 
          : JSON.parse(item.aesthetics_details || '[]'),
        suggestions: Array.isArray(item.suggestions) 
          ? item.suggestions 
          : JSON.parse(item.suggestions || '[]'),
        highlights: Array.isArray(item.highlights) 
          ? item.highlights 
          : JSON.parse(item.highlights || '[]'),
        commercialAnalysis: Array.isArray(item.commercial_analysis) 
          ? item.commercial_analysis 
          : JSON.parse(item.commercial_analysis || '[]'),
        recommendedCommercialPaths: Array.isArray(item.recommended_commercial_paths) 
          ? item.recommended_commercial_paths 
          : JSON.parse(item.recommended_commercial_paths || '[]'),
        relatedActivities: Array.isArray(item.related_activities) 
          ? item.related_activities 
          : JSON.parse(item.related_activities || '[]'),
        similarWorks: Array.isArray(item.similar_works) 
          ? item.similar_works 
          : JSON.parse(item.similar_works || '[]'),
        workThumbnail: item.work_thumbnail,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      };
    } catch (error) {
      console.error('获取AI点评详情异常:', error);
      return null;
    }
  }

  /**
   * 删除AI点评记录
   * @param reviewId 点评记录ID
   * @param userId 用户ID
   * @returns 是否删除成功
   */
  async deleteAIReview(reviewId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', userId);

      if (error) {
        console.error('删除AI点评记录失败:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('删除AI点评记录异常:', error);
      return false;
    }
  }

  /**
   * 检查作品是否已有AI点评
   * @param workId 作品ID
   * @param userId 用户ID
   * @returns 点评记录ID或null
   */
  async checkExistingReview(workId: string, userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('ai_reviews')
        .select('id')
        .eq('work_id', workId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('检查AI点评记录失败:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('检查AI点评记录异常:', error);
      return null;
    }
  }
}

export const aiReviewService = new AIReviewService();
