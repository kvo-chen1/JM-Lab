import { supabase } from '@/lib/supabase';
import { userPersonaService } from './userPersonaService';
import {
  FeedbackType,
  FeedbackReason,
  RecommendationFeedback,
  FeedbackStats,
  FeedbackImpact,
  ABTestExperiment,
  RecommendationConfig,
  FeedbackLearningResult,
  RecommendationQualityScore,
  UserFeedbackProfile,
} from '@/types/recommendationFeedback';

const FEEDBACK_TABLE = 'recommendation_feedback';
const EXPERIMENTS_TABLE = 'recommendation_experiments';
const CONFIG_TABLE = 'recommendation_config';
const FEEDBACK_CACHE_KEY = 'jmzf_feedback_cache';

class RecommendationFeedbackService {
  private feedbackQueue: RecommendationFeedback[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 3000;
  private readonly BATCH_SIZE = 20;

  async submitFeedback(
    userId: string,
    itemId: string,
    itemType: 'work' | 'creator' | 'event' | 'collection',
    feedbackType: FeedbackType,
    options?: {
      reason?: FeedbackReason;
      comment?: string;
      metadata?: RecommendationFeedback['metadata'];
    }
  ): Promise<RecommendationFeedback> {
    const feedback: RecommendationFeedback = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      itemId,
      itemType,
      feedbackType,
      reason: options?.reason,
      comment: options?.comment,
      metadata: {
        ...options?.metadata,
        timestamp: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    };

    this.feedbackQueue.push(feedback);
    this.scheduleFlush();

    this.updateLocalFeedbackCache(feedback);

    await userPersonaService.trackBehavior(
      userId,
      itemId,
      itemType as any,
      this.mapFeedbackToBehavior(feedbackType),
      { feedbackType, reason: options?.reason }
    );

    return feedback;
  }

  private scheduleFlush(): void {
    if (this.flushTimer) return;
    
    if (this.feedbackQueue.length >= this.BATCH_SIZE) {
      this.flushFeedbacks();
      return;
    }

    this.flushTimer = setTimeout(() => {
      this.flushFeedbacks();
    }, this.FLUSH_INTERVAL);
  }

  private async flushFeedbacks(): Promise<void> {
    if (this.feedbackQueue.length === 0) return;

    const feedbacksToSend = [...this.feedbackQueue];
    this.feedbackQueue = [];
    
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    try {
      const { error } = await supabase
        .from(FEEDBACK_TABLE)
        .insert(feedbacksToSend.map(f => ({
          id: f.id,
          user_id: f.userId,
          item_id: f.itemId,
          item_type: f.itemType,
          feedback_type: f.feedbackType,
          reason: f.reason,
          comment: f.comment,
          metadata: f.metadata,
          created_at: f.createdAt,
        })));

      if (error) {
        console.error('Failed to flush feedbacks:', error);
        this.feedbackQueue = [...feedbacksToSend, ...this.feedbackQueue];
      }
    } catch (error) {
      console.error('Error flushing feedbacks:', error);
      this.feedbackQueue = [...feedbacksToSend, ...this.feedbackQueue];
    }
  }

  private updateLocalFeedbackCache(feedback: RecommendationFeedback): void {
    try {
      const cacheKey = `${FEEDBACK_CACHE_KEY}_${feedback.userId}`;
      const cached = localStorage.getItem(cacheKey);
      const feedbacks = cached ? JSON.parse(cached) : { feedbacks: [], timestamp: 0 };
      
      feedbacks.feedbacks.unshift(feedback);
      feedbacks.feedbacks = feedbacks.feedbacks.slice(0, 100);
      feedbacks.timestamp = Date.now();
      
      localStorage.setItem(cacheKey, JSON.stringify(feedbacks));
    } catch (error) {
      console.error('Error updating local feedback cache:', error);
    }
  }

  private mapFeedbackToBehavior(feedbackType: FeedbackType): any {
    const mapping: Record<FeedbackType, string> = {
      like: 'like',
      dislike: 'dislike',
      not_interested: 'hide',
      seen_too_often: 'skip',
      inappropriate: 'report',
      irrelevant: 'dislike',
      outdated: 'dislike',
      misleading: 'dislike',
      other: 'click',
    };
    return mapping[feedbackType] || 'click';
  }

  async getUserFeedbacks(
    userId: string,
    limit: number = 50
  ): Promise<RecommendationFeedback[]> {
    try {
      const { data, error } = await supabase
        .from(FEEDBACK_TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(this.mapFeedbackFromDB);
    } catch (error) {
      console.error('Error fetching user feedbacks:', error);
      return this.getLocalFeedbacks(userId);
    }
  }

  private getLocalFeedbacks(userId: string): RecommendationFeedback[] {
    try {
      const cacheKey = `${FEEDBACK_CACHE_KEY}_${userId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { feedbacks } = JSON.parse(cached);
        return feedbacks;
      }
    } catch (error) {
      console.error('Error getting local feedbacks:', error);
    }
    return [];
  }

  async getFeedbackStats(
    userId: string,
    days: number = 30
  ): Promise<FeedbackStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const { data: feedbacks } = await supabase
        .from(FEEDBACK_TABLE)
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      if (!feedbacks || feedbacks.length === 0) {
        return this.getEmptyStats();
      }

      const stats: FeedbackStats = {
        totalFeedback: feedbacks.length,
        likeCount: feedbacks.filter(f => f.feedback_type === 'like').length,
        dislikeCount: feedbacks.filter(f => f.feedback_type === 'dislike').length,
        notInterestedCount: feedbacks.filter(f => f.feedback_type === 'not_interested').length,
        reportCount: feedbacks.filter(f => f.feedback_type === 'inappropriate').length,
        likeRate: 0,
        dislikeRate: 0,
        feedbackByType: {} as Record<FeedbackType, number>,
        feedbackByReason: {} as Record<FeedbackReason, number>,
        recentTrend: 'stable',
      };

      feedbacks.forEach(f => {
        stats.feedbackByType[f.feedback_type as FeedbackType] = 
          (stats.feedbackByType[f.feedback_type as FeedbackType] || 0) + 1;
        
        if (f.reason) {
          stats.feedbackByReason[f.reason as FeedbackReason] = 
            (stats.feedbackByReason[f.reason as FeedbackReason] || 0) + 1;
        }
      });

      stats.likeRate = stats.likeCount / stats.totalFeedback;
      stats.dislikeRate = stats.dislikeCount / stats.totalFeedback;

      return stats;
    } catch (error) {
      console.error('Error getting feedback stats:', error);
      return this.getEmptyStats();
    }
  }

  private getEmptyStats(): FeedbackStats {
    return {
      totalFeedback: 0,
      likeCount: 0,
      dislikeCount: 0,
      notInterestedCount: 0,
      reportCount: 0,
      likeRate: 0,
      dislikeRate: 0,
      feedbackByType: {} as Record<FeedbackType, number>,
      feedbackByReason: {} as Record<FeedbackReason, number>,
      recentTrend: 'stable',
    };
  }

  async getFeedbackImpact(itemId: string): Promise<FeedbackImpact | null> {
    try {
      const { data: feedbacks } = await supabase
        .from(FEEDBACK_TABLE)
        .select('*')
        .eq('item_id', itemId);

      if (!feedbacks || feedbacks.length === 0) return null;

      const likeCount = feedbacks.filter(f => f.feedback_type === 'like').length;
      const dislikeCount = feedbacks.filter(f => f.feedback_type === 'dislike').length;
      
      const impactScore = (likeCount - dislikeCount * 2) / Math.max(feedbacks.length, 1);

      return {
        itemId,
        feedbackCount: feedbacks.length,
        avgScoreBefore: 0.5,
        avgScoreAfter: 0.5 + impactScore * 0.3,
        impactScore,
        affectedUsers: new Set(feedbacks.map(f => f.user_id)).size,
      };
    } catch (error) {
      console.error('Error getting feedback impact:', error);
      return null;
    }
  }

  async createExperiment(
    experiment: Omit<ABTestExperiment, 'id' | 'status' | 'results'>
  ): Promise<ABTestExperiment> {
    const newExperiment: ABTestExperiment = {
      ...experiment,
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'draft',
    };

    try {
      await supabase
        .from(EXPERIMENTS_TABLE)
        .insert({
          id: newExperiment.id,
          name: newExperiment.name,
          description: newExperiment.description,
          status: newExperiment.status,
          variants: newExperiment.variants,
          targeting: newExperiment.targeting,
          metrics: newExperiment.metrics,
          start_date: newExperiment.startDate,
          end_date: newExperiment.endDate,
        });

      return newExperiment;
    } catch (error) {
      console.error('Error creating experiment:', error);
      throw error;
    }
  }

  async getActiveExperiments(): Promise<ABTestExperiment[]> {
    try {
      const { data, error } = await supabase
        .from(EXPERIMENTS_TABLE)
        .select('*')
        .eq('status', 'running');

      if (error) throw error;

      return (data || []).map(this.mapExperimentFromDB);
    } catch (error) {
      console.error('Error getting active experiments:', error);
      return [];
    }
  }

  async assignExperimentVariant(
    userId: string,
    experiment: ABTestExperiment
  ): Promise<string> {
    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const variant of experiment.variants) {
      random -= variant.weight;
      if (random <= 0) {
        return variant.id;
      }
    }

    return experiment.variants[0].id;
  }

  async getRecommendationConfig(
    category?: string
  ): Promise<RecommendationConfig[]> {
    try {
      let query = supabase
        .from(CONFIG_TABLE)
        .select('*')
        .eq('is_active', true);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapConfigFromDB);
    } catch (error) {
      console.error('Error getting recommendation config:', error);
      return [];
    }
  }

  async learnFromFeedback(userId: string): Promise<FeedbackLearningResult> {
    const feedbacks = await this.getUserFeedbacks(userId, 100);

    const result: FeedbackLearningResult = {
      userId,
      learningDate: new Date().toISOString(),
      updatedPreferences: {
        interests: [],
        categories: [],
        creators: [],
      },
      adjustedWeights: [],
      insights: [],
      modelVersion: '1.0.0',
    };

    const tagDeltas: Map<string, number> = new Map();
    const categoryDeltas: Map<string, number> = new Map();
    const creatorDeltas: Map<string, number> = new Map();

    feedbacks.forEach(feedback => {
      const delta = this.getFeedbackDelta(feedback.feedbackType);

      if (feedback.metadata?.tags) {
        feedback.metadata.tags.forEach((tag: string) => {
          tagDeltas.set(tag, (tagDeltas.get(tag) || 0) + delta);
        });
      }

      if (feedback.metadata?.category) {
        categoryDeltas.set(
          feedback.metadata.category,
          (categoryDeltas.get(feedback.metadata.category) || 0) + delta
        );
      }

      if (feedback.metadata?.creatorId) {
        creatorDeltas.set(
          feedback.metadata.creatorId,
          (creatorDeltas.get(feedback.metadata.creatorId) || 0) + delta
        );
      }
    });

    result.updatedPreferences.interests = Array.from(tagDeltas.entries())
      .filter(([_, delta]) => Math.abs(delta) > 0.1)
      .map(([tag, scoreDelta]) => ({ tag, scoreDelta }));

    result.updatedPreferences.categories = Array.from(categoryDeltas.entries())
      .filter(([_, delta]) => Math.abs(delta) > 0.1)
      .map(([category, scoreDelta]) => ({ category, scoreDelta }));

    result.updatedPreferences.creators = Array.from(creatorDeltas.entries())
      .filter(([_, delta]) => Math.abs(delta) > 0.1)
      .map(([creatorId, scoreDelta]) => ({ creatorId, scoreDelta }));

    result.insights = this.generateInsights(feedbacks, result);

    return result;
  }

  private getFeedbackDelta(feedbackType: FeedbackType): number {
    const deltas: Record<FeedbackType, number> = {
      like: 0.3,
      dislike: -0.5,
      not_interested: -0.4,
      seen_too_often: -0.2,
      inappropriate: -1.0,
      irrelevant: -0.6,
      outdated: -0.3,
      misleading: -0.7,
      other: 0,
    };
    return deltas[feedbackType] || 0;
  }

  private generateInsights(
    feedbacks: RecommendationFeedback[],
    result: FeedbackLearningResult
  ): string[] {
    const insights: string[] = [];

    const likeRate = feedbacks.filter(f => f.feedbackType === 'like').length / 
      Math.max(feedbacks.length, 1);
    
    if (likeRate > 0.7) {
      insights.push('您对推荐内容的满意度很高，我们会继续保持');
    } else if (likeRate < 0.3) {
      insights.push('我们注意到您对推荐内容不太满意，正在优化推荐策略');
    }

    if (result.updatedPreferences.interests.length > 5) {
      insights.push('您的兴趣广泛，我们会提供更多样化的内容');
    }

    return insights;
  }

  async calculateQualityScore(
    userId: string,
    sampleSize: number = 50
  ): Promise<RecommendationQualityScore> {
    const feedbacks = await this.getUserFeedbacks(userId, sampleSize);
    
    if (feedbacks.length === 0) {
      return {
        overall: 0.5,
        relevance: 0.5,
        diversity: 0.5,
        novelty: 0.5,
        serendipity: 0.5,
        freshness: 0.5,
        calculatedAt: new Date().toISOString(),
        sampleSize: 0,
      };
    }

    const likeCount = feedbacks.filter(f => f.feedbackType === 'like').length;
    const relevance = likeCount / feedbacks.length;

    const uniqueCategories = new Set(
      feedbacks.filter(f => f.metadata?.category).map(f => f.metadata!.category)
    );
    const diversity = Math.min(uniqueCategories.size / 5, 1);

    const recentFeedbacks = feedbacks.filter(f => {
      const feedbackTime = new Date(f.createdAt).getTime();
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return feedbackTime > dayAgo;
    });
    const novelty = recentFeedbacks.length > 0 ? 
      recentFeedbacks.filter(f => f.feedbackType === 'like').length / recentFeedbacks.length : 0.5;

    const serendipity = feedbacks.filter(f => 
      f.feedbackType === 'like' && f.reason === 'other'
    ).length / Math.max(feedbacks.length, 1);

    const freshness = feedbacks.filter(f => {
      const feedbackTime = new Date(f.createdAt).getTime();
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return feedbackTime > weekAgo;
    }).length / feedbacks.length;

    const overall = (relevance * 0.4 + diversity * 0.2 + novelty * 0.15 + 
                     serendipity * 0.1 + freshness * 0.15);

    return {
      overall,
      relevance,
      diversity,
      novelty,
      serendipity,
      freshness,
      calculatedAt: new Date().toISOString(),
      sampleSize: feedbacks.length,
    };
  }

  async getUserFeedbackProfile(userId: string): Promise<UserFeedbackProfile> {
    const feedbacks = await this.getUserFeedbacks(userId, 200);
    
    if (feedbacks.length === 0) {
      return {
        userId,
        totalFeedback: 0,
        feedbackRate: 0,
        preferredFeedbackTypes: [],
        commonReasons: [],
        avgSessionFeedback: 0,
        lastFeedbackDate: new Date().toISOString(),
        feedbackQuality: 'medium',
        preferences: {
          likesDiversity: false,
          prefersNovelty: false,
          isSelective: false,
        },
      };
    }

    const feedbackTypeCounts: Record<FeedbackType, number> = {} as any;
    const reasonCounts: Record<FeedbackReason, number> = {} as any;

    feedbacks.forEach(f => {
      feedbackTypeCounts[f.feedbackType] = (feedbackTypeCounts[f.feedbackType] || 0) + 1;
      if (f.reason) {
        reasonCounts[f.reason] = (reasonCounts[f.reason] || 0) + 1;
      }
    });

    const preferredFeedbackTypes = Object.entries(feedbackTypeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type as FeedbackType);

    const commonReasons = Object.entries(reasonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([reason]) => reason as FeedbackReason);

    const lastFeedbackDate = feedbacks[0]?.createdAt || new Date().toISOString();

    const likeRate = (feedbackTypeCounts['like'] || 0) / feedbacks.length;
    const feedbackQuality = likeRate > 0.6 ? 'high' : likeRate > 0.3 ? 'medium' : 'low';

    const uniqueCategories = new Set(
      feedbacks.filter(f => f.metadata?.category).map(f => f.metadata!.category)
    );
    const likesDiversity = uniqueCategories.size > 3;

    const novelFeedbacks = feedbacks.filter(f => 
      f.feedbackType === 'like' && f.metadata?.source === 'discovery'
    );
    const prefersNovelty = novelFeedbacks.length / feedbacks.length > 0.3;

    const isSelective = feedbackTypeCounts['like'] && feedbackTypeCounts['dislike'] &&
      (feedbackTypeCounts['like'] / feedbackTypeCounts['dislike']) < 2;

    return {
      userId,
      totalFeedback: feedbacks.length,
      feedbackRate: feedbacks.length / 30,
      preferredFeedbackTypes,
      commonReasons,
      avgSessionFeedback: feedbacks.length / 10,
      lastFeedbackDate,
      feedbackQuality,
      preferences: {
        likesDiversity,
        prefersNovelty,
        isSelective,
      },
    };
  }

  private mapFeedbackFromDB(data: any): RecommendationFeedback {
    return {
      id: data.id,
      userId: data.user_id,
      itemId: data.item_id,
      itemType: data.item_type,
      feedbackType: data.feedback_type,
      reason: data.reason,
      comment: data.comment,
      metadata: data.metadata,
      createdAt: data.created_at,
    };
  }

  private mapExperimentFromDB(data: any): ABTestExperiment {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      status: data.status,
      variants: data.variants,
      targeting: data.targeting,
      metrics: data.metrics,
      startDate: data.start_date,
      endDate: data.end_date,
      results: data.results,
    };
  }

  private mapConfigFromDB(data: any): RecommendationConfig {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      parameters: data.parameters,
      isActive: data.is_active,
      version: data.version,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async flush(): Promise<void> {
    await this.flushFeedbacks();
  }
}

export const recommendationFeedbackService = new RecommendationFeedbackService();
