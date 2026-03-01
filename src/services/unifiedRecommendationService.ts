/**
 * 统一推荐服务
 * 
 * 整合四阶段优化成果，提供统一的推荐入口
 * - 第一阶段：算法精度提升（协同过滤 + LTR）
 * - 第二阶段：实时性与多样性（实时管道 + MMR重排序）
 * - 第三阶段：冷启动优化（新用户/新内容策略）
 * - 第四阶段：A/B测试框架（实验驱动迭代）
 */

import { recommendationService } from './recommendationService';
import { realtimeRecommendationService } from './realtimeRecommendationService';
import { diversityRerankService } from './diversityRerankService';
import { coldStartService } from './coldStartService';
import { abTestingService } from './abTestingService';
import { feedService } from './feedService';
import { supabase } from '../lib/supabase';

// ============================================
// 类型定义
// ============================================

export interface UnifiedRecommendationOptions {
  userId: string;
  limit?: number;
  strategy?: 'personalized' | 'trending' | 'diverse' | 'realtime' | 'coldstart';
  includeTypes?: Array<'post' | 'work' | 'challenge' | 'template'>;
  excludeIds?: string[];
  context?: {
    page?: string;
    device?: string;
    timeOfDay?: number;
  };
}

export interface UnifiedRecommendationResult {
  items: RecommendedItem[];
  strategy: string;
  experimentId?: string;
  variantId?: string;
  metadata: {
    totalCandidates: number;
    diversityScore: number;
    freshnessScore: number;
    coldStartRatio: number;
    latency: number;
  };
}

export interface RecommendedItem {
  id: string;
  type: 'post' | 'work' | 'challenge' | 'template';
  title: string;
  thumbnail?: string;
  score: number;
  reason: string;
  source: 'collaborative' | 'content' | 'trending' | 'diverse' | 'coldstart' | 'realtime';
  metadata?: Record<string, any>;
}

// ============================================
// 统一推荐服务类
// ============================================

class UnifiedRecommendationService {
  private readonly DEFAULT_LIMIT = 20;
  private readonly NEW_USER_THRESHOLD = 5; // 互动少于5次视为新用户
  private readonly REALTIME_WINDOW_MS = 5 * 60 * 1000; // 5分钟实时窗口

  // ============================================
  // 主推荐入口
  // ============================================

  /**
   * 获取统一推荐
   * 
   * 根据用户状态自动选择最佳推荐策略：
   * 1. 检查A/B测试实验分配
   * 2. 判断是否为冷启动用户
   * 3. 检查实时事件触发
   * 4. 执行多级召回和精排
   * 5. 应用多样性重排序
   * 6. 返回最终结果
   */
  public async getRecommendations(
    options: UnifiedRecommendationOptions
  ): Promise<UnifiedRecommendationResult> {
    const startTime = Date.now();
    const limit = options.limit || this.DEFAULT_LIMIT;

    try {
      // 1. 检查A/B测试实验分配
      const experimentAssignment = await this.checkExperimentAssignment(options.userId);

      // 2. 判断用户类型并选择策略
      const userType = await this.determineUserType(options.userId);
      const strategy = this.selectStrategy(userType, options.strategy);

      // 3. 根据策略获取推荐
      let recommendations: RecommendedItem[] = [];

      switch (strategy) {
        case 'coldstart':
          recommendations = await this.getColdStartRecommendations(options.userId, limit);
          break;
        case 'realtime':
          recommendations = await this.getRealtimeRecommendations(options.userId, limit);
          break;
        case 'diverse':
          recommendations = await this.getDiverseRecommendations(options.userId, limit);
          break;
        case 'trending':
          recommendations = await this.getTrendingRecommendations(limit);
          break;
        case 'personalized':
        default:
          recommendations = await this.getPersonalizedRecommendations(options.userId, limit);
          break;
      }

      // 4. 应用多样性重排序（如果不是多样性策略）
      if (strategy !== 'diverse') {
        recommendations = await this.applyDiversityRerank(recommendations, limit);
      }

      // 5. 过滤和截断
      recommendations = this.filterRecommendations(recommendations, options.excludeIds);
      recommendations = recommendations.slice(0, limit);

      // 6. 记录推荐日志
      await this.logRecommendations(options.userId, recommendations, strategy);

      // 7. 追踪A/B测试指标
      if (experimentAssignment) {
        await abTestingService.trackMetric(
          options.userId,
          experimentAssignment.experimentId,
          'recommendation_exposure',
          recommendations.length
        );
      }

      const latency = Date.now() - startTime;

      return {
        items: recommendations,
        strategy,
        experimentId: experimentAssignment?.experimentId,
        variantId: experimentAssignment?.variantId,
        metadata: {
          totalCandidates: recommendations.length,
          diversityScore: this.calculateDiversityScore(recommendations),
          freshnessScore: this.calculateFreshnessScore(recommendations),
          coldStartRatio: this.calculateColdStartRatio(recommendations),
          latency
        }
      };

    } catch (error) {
      console.error('统一推荐服务错误:', error);
      
      // 降级到热门推荐
      const fallbackRecommendations = await this.getTrendingRecommendations(limit);
      
      return {
        items: fallbackRecommendations,
        strategy: 'fallback_trending',
        metadata: {
          totalCandidates: fallbackRecommendations.length,
          diversityScore: 0,
          freshnessScore: 0,
          coldStartRatio: 0,
          latency: Date.now() - startTime
        }
      };
    }
  }

  // ============================================
  // 策略选择
  // ============================================

  /**
   * 判断用户类型
   */
  private async determineUserType(userId: string): Promise<'new' | 'active' | 'dormant'> {
    // 检查用户互动数量
    const { count, error } = await supabase
      .from('user_actions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error || count === null) {
      return 'new';
    }

    if (count < this.NEW_USER_THRESHOLD) {
      return 'new';
    }

    // 检查最近活动
    const { data: recentActions } = await supabase
      .from('user_actions')
      .select('timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1);

    if (recentActions && recentActions.length > 0) {
      const lastAction = new Date(recentActions[0].timestamp);
      const daysSinceLastAction = (Date.now() - lastAction.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastAction > 30) {
        return 'dormant';
      }
    }

    return 'active';
  }

  /**
   * 选择推荐策略
   */
  private selectStrategy(
    userType: 'new' | 'active' | 'dormant',
    requestedStrategy?: string
  ): string {
    // 如果指定了策略，优先使用
    if (requestedStrategy) {
      return requestedStrategy;
    }

    // 根据用户类型选择策略
    switch (userType) {
      case 'new':
        return 'coldstart';
      case 'dormant':
        return 'trending';
      case 'active':
      default:
        return 'personalized';
    }
  }

  // ============================================
  // 各类推荐实现
  // ============================================

  /**
   * 冷启动推荐
   */
  private async getColdStartRecommendations(
    userId: string,
    limit: number
  ): Promise<RecommendedItem[]> {
    const coldStartItems = await coldStartService.generateNewUserRecommendations(userId, limit);
    
    return coldStartItems.map((item: any) => ({
      id: item.id,
      type: item.type || 'post',
      title: item.title,
      thumbnail: item.thumbnail,
      score: item.score || 0.5,
      reason: item.reason || '为您推荐',
      source: 'coldstart',
      metadata: item.metadata
    }));
  }

  /**
   * 实时推荐
   */
  private async getRealtimeRecommendations(
    userId: string,
    limit: number
  ): Promise<RecommendedItem[]> {
    const realtimeItems = await realtimeRecommendationService.getRealtimeRecommendations(userId, limit);
    
    return realtimeItems.map((item: any) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      thumbnail: item.thumbnail,
      score: item.score,
      reason: '基于您的实时兴趣',
      source: 'realtime',
      metadata: item.metadata
    }));
  }

  /**
   * 多样性推荐
   */
  private async getDiverseRecommendations(
    userId: string,
    limit: number
  ): Promise<RecommendedItem[]> {
    // 先获取个性化推荐
    const personalizedItems = await this.getPersonalizedRecommendations(userId, limit * 2);
    
    // 应用MMR多样性重排序
    const diverseItems = await diversityRerankService.rerankWithMMR(
      personalizedItems.map(item => ({
        ...item,
        featureVector: this.extractFeatureVector(item)
      })),
      { lambda: 0.5, maxResults: limit }
    );

    return diverseItems.map((item: any) => ({
      ...item,
      source: 'diverse' as const,
      reason: '探索更多元的内容'
    }));
  }

  /**
   * 热门推荐
   */
  private async getTrendingRecommendations(limit: number): Promise<RecommendedItem[]> {
    const { data: trendingPosts } = await supabase
      .from('posts')
      .select('id, title, thumbnail, view_count, like_count')
      .order('view_count', { ascending: false })
      .limit(limit);

    if (!trendingPosts) {
      return [];
    }

    return trendingPosts.map((post: any) => ({
      id: post.id,
      type: 'post' as const,
      title: post.title,
      thumbnail: post.thumbnail,
      score: Math.min(post.view_count / 1000, 1),
      reason: '热门内容',
      source: 'trending' as const
    }));
  }

  /**
   * 个性化推荐
   */
  private async getPersonalizedRecommendations(
    userId: string,
    limit: number
  ): Promise<RecommendedItem[]> {
    // 使用Feed服务获取个性化推荐
    const feedResult = await feedService.getPersonalizedFeed(userId, limit);
    
    return feedResult.items.map((item: any) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      thumbnail: item.thumbnail,
      score: item.score,
      reason: item.reason || '为您推荐',
      source: this.mapSource(item.source),
      metadata: item.metadata
    }));
  }

  // ============================================
  // 辅助方法
  // ============================================

  /**
   * 检查A/B测试实验分配
   */
  private async checkExperimentAssignment(userId: string): Promise<{ experimentId: string; variantId: string } | null> {
    // 获取运行中的实验
    const runningExperiments = await abTestingService.getRunningExperiments();
    
    for (const experiment of runningExperiments) {
      const variant = await abTestingService.assignUserToVariant(userId, experiment.id);
      if (variant) {
        return {
          experimentId: experiment.id,
          variantId: variant.id
        };
      }
    }

    return null;
  }

  /**
   * 应用多样性重排序
   */
  private async applyDiversityRerank(
    items: RecommendedItem[],
    limit: number
  ): Promise<RecommendedItem[]> {
    // 使用滑动窗口控制多样性
    return diversityRerankService.slidingWindowDiversity(items, {
      windowSize: 5,
      maxSameCategory: 2,
      maxSameAuthor: 1
    });
  }

  /**
   * 过滤推荐
   */
  private filterRecommendations(
    items: RecommendedItem[],
    excludeIds?: string[]
  ): RecommendedItem[] {
    if (!excludeIds || excludeIds.length === 0) {
      return items;
    }

    return items.filter(item => !excludeIds.includes(item.id));
  }

  /**
   * 提取特征向量（用于多样性计算）
   */
  private extractFeatureVector(item: RecommendedItem): number[] {
    // 简化实现：使用类型和分数作为特征
    const typeEncoding = {
      'post': [1, 0, 0, 0],
      'work': [0, 1, 0, 0],
      'challenge': [0, 0, 1, 0],
      'template': [0, 0, 0, 1]
    };

    return [...typeEncoding[item.type], item.score];
  }

  /**
   * 映射来源
   */
  private mapSource(source?: string): 'collaborative' | 'content' | 'trending' | 'diverse' | 'coldstart' | 'realtime' {
    const sourceMap: Record<string, any> = {
      'collaborative': 'collaborative',
      'content': 'content',
      'trending': 'trending',
      'diverse': 'diverse',
      'coldstart': 'coldstart',
      'realtime': 'realtime'
    };

    return sourceMap[source || ''] || 'content';
  }

  /**
   * 计算多样性分数
   */
  private calculateDiversityScore(items: RecommendedItem[]): number {
    if (items.length < 2) {
      return 1;
    }

    const types = new Set(items.map(item => item.type));
    const sources = new Set(items.map(item => item.source));

    // 简单的多样性计算：类型和来源的覆盖度
    const typeDiversity = types.size / 4; // 假设有4种类型
    const sourceDiversity = sources.size / 6; // 假设有6种来源

    return (typeDiversity + sourceDiversity) / 2;
  }

  /**
   * 计算新鲜度分数
   */
  private calculateFreshnessScore(items: RecommendedItem[]): number {
    // 简化实现：基于来源判断新鲜度
    const realtimeSources = ['realtime', 'trending'];
    const freshCount = items.filter(item => realtimeSources.includes(item.source)).length;
    return freshCount / items.length;
  }

  /**
   * 计算冷启动内容比例
   */
  private calculateColdStartRatio(items: RecommendedItem[]): number {
    const coldStartCount = items.filter(item => item.source === 'coldstart').length;
    return coldStartCount / items.length;
  }

  /**
   * 记录推荐日志
   */
  private async logRecommendations(
    userId: string,
    items: RecommendedItem[],
    strategy: string
  ): Promise<void> {
    const logs = items.map((item, index) => ({
      user_id: userId,
      item_id: item.id,
      item_type: item.type,
      strategy,
      position: index + 1,
      score: item.score,
      source: item.source,
      timestamp: new Date().toISOString()
    }));

    // 批量插入日志
    const { error } = await supabase
      .from('recommendation_logs')
      .insert(logs);

    if (error) {
      console.error('记录推荐日志失败:', error);
    }
  }

  // ============================================
  // 反馈处理
  // ============================================

  /**
   * 处理推荐反馈
   */
  public async handleFeedback(
    userId: string,
    itemId: string,
    feedbackType: 'like' | 'dislike' | 'click' | 'hide',
    metadata?: Record<string, any>
  ): Promise<void> {
    // 1. 记录反馈
    await supabase.from('recommendation_feedback').insert({
      user_id: userId,
      item_id: itemId,
      feedback_type: feedbackType,
      metadata,
      timestamp: new Date().toISOString()
    });

    // 2. 如果是实时反馈，触发实时推荐更新
    if (feedbackType === 'click' || feedbackType === 'like') {
      realtimeRecommendationService.collectEvent({
        userId,
        itemId,
        eventType: feedbackType,
        timestamp: Date.now()
      });
    }

    // 3. 追踪A/B测试指标
    const runningExperiments = await abTestingService.getRunningExperiments();
    for (const experiment of runningExperiments) {
      const { data: assignment } = await supabase
        .from('ab_user_assignments')
        .select('*')
        .eq('user_id', userId)
        .eq('experiment_id', experiment.id)
        .single();

      if (assignment) {
        await abTestingService.trackMetric(
          userId,
          experiment.id,
          `recommendation_${feedbackType}`,
          1,
          { itemId }
        );
      }
    }
  }

  // ============================================
  // 健康检查
  // ============================================

  /**
   * 服务健康检查
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    latency: number;
  }> {
    const startTime = Date.now();
    const services: Record<string, boolean> = {};

    // 检查各服务状态
    try {
      await supabase.from('posts').select('id', { count: 'exact', head: true });
      services['database'] = true;
    } catch {
      services['database'] = false;
    }

    services['recommendationService'] = true;
    services['realtimeRecommendationService'] = true;
    services['diversityRerankService'] = true;
    services['coldStartService'] = true;
    services['abTestingService'] = true;

    const allHealthy = Object.values(services).every(v => v);
    const latency = Date.now() - startTime;

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      services,
      latency
    };
  }
}

// 导出单例
export const unifiedRecommendationService = new UnifiedRecommendationService();
