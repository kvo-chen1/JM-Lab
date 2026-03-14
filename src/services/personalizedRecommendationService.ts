/**
 * 个性化推荐服务
 * 基于用户行为、偏好、历史表现生成个性化灵感推荐
 * 学习抖音推荐算法的核心逻辑
 */

import { supabase } from '@/lib/supabase';
import { TrendingTopic } from './trendingService';

/**
 * 用户画像接口
 */
export interface UserProfile {
  userId: string;
  favoriteCategories: string[];      // 喜欢的分类
  contentStyles: string[];           // 内容风格偏好
  bestPostingTime: string;           // 最佳发布时间
  audienceProfile: {
    ageRange: string;
    genderRatio: { male: number; female: number };
    topCities: string[];
  };
  historicalPerformance: {
    avgViews: number;
    avgLikes: number;
    bestCategory: string;
    totalWorks: number;
  };
  behaviorScore: {
    creativity: number;      // 创造力评分
    consistency: number;     // 持续性评分
    engagement: number;      // 互动率评分
    trendiness: number;      // 追热点能力评分
  };
}

/**
 * 推荐结果接口
 */
export interface Recommendation {
  inspiration: TrendingTopic;
  score: number;             // 推荐分数 (0-100)
  reasons: string[];         // 推荐理由
  confidence: number;        // 置信度 (0-1)
}

/**
 * 用户行为记录
 */
export interface UserBehavior {
  userId: string;
  inspirationId: string;
  actionType: 'view' | 'use' | 'complete' | 'share' | 'bookmark' | 'like';
  duration?: number;         // 停留时长 (秒)
  createdAt: string;
}

/**
 * 个性化推荐服务类
 */
class PersonalizedRecommendationService {
  // 推荐权重配置
  private weights = {
    categoryPreference: 0.30,    // 分类偏好权重
    behaviorHistory: 0.25,       // 行为历史权重
    trendingScore: 0.20,         // 热点分数权重
    timeRelevance: 0.15,         // 时间相关性权重
    diversity: 0.10,             // 多样性权重
  };

  /**
   * 获取用户画像
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // 1. 从数据库获取用户偏好
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (preferences) {
        return this.mapToUserProfile(preferences);
      }

      // 2. 如果没有偏好数据，基于用户行为计算
      return await this.calculateUserProfile(userId);
    } catch (error: any) {
      console.error('获取用户画像失败:', error);
      return null;
    }
  }

  /**
   * 基于行为计算用户画像
   */
  private async calculateUserProfile(userId: string): Promise<UserProfile> {
    // 获取用户历史行为
    const { data: behaviors } = await supabase
      .from('inspiration_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    // 分析行为数据
    const categoryCount: Record<string, number> = {};
    let totalActions = 0;

    behaviors?.forEach(behavior => {
      totalActions++;
      // 这里简化处理，实际应该关联热点话题表获取分类
      const category = 'tianjin-culture'; // 示例
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    // 计算最喜欢的分类
    const favoriteCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);

    return {
      userId,
      favoriteCategories,
      contentStyles: ['realistic', 'storytelling'], // 示例
      bestPostingTime: '19:00-21:00',
      audienceProfile: {
        ageRange: '18-30',
        genderRatio: { male: 0.45, female: 0.55 },
        topCities: ['天津', '北京', '上海'],
      },
      historicalPerformance: {
        avgViews: 50000,
        avgLikes: 3500,
        bestCategory: 'tianjin-culture',
        totalWorks: totalActions,
      },
      behaviorScore: {
        creativity: 75,
        consistency: 60,
        engagement: 80,
        trendiness: 85,
      },
    };
  }

  /**
   * 获取个性化推荐
   */
  async getPersonalizedRecommendations(
    userId: string,
    limit = 10
  ): Promise<Recommendation[]> {
    try {
      // 1. 获取用户画像
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        // 返回热门数据
        return [];
      }

      // 2. 获取候选热点（从数据库）
      const { data: candidates } = await supabase
        .from('trending_topics')
        .select('*')
        .order('heat_value', { ascending: false })
        .limit(50);

      if (!candidates) return [];

      // 3. 计算每个热点的推荐分数
      const recommendations: Recommendation[] = [];

      for (const candidate of candidates) {
        const score = this.calculateRecommendationScore(
          candidate,
          userProfile
        );

        if (score.score >= 60) { // 只推荐分数>=60 的
          recommendations.push({
            inspiration: this.mapToTrendingTopic(candidate),
            score: score.score,
            reasons: score.reasons,
            confidence: score.confidence,
          });
        }
      }

      // 4. 按分数排序并返回 Top N
      recommendations.sort((a, b) => b.score - a.score);
      return recommendations.slice(0, limit);
    } catch (error: any) {
      console.error('获取个性化推荐失败:', error);
      return [];
    }
  }

  /**
   * 计算推荐分数
   */
  private calculateRecommendationScore(
    topic: any,
    userProfile: UserProfile
  ): { score: number; reasons: string[]; confidence: number } {
    const reasons: string[] = [];
    const confidence = 0.8;

    // 1. 分类偏好分数 (0-100)
    const categoryScore = this.calculateCategoryScore(
      topic.category,
      userProfile.favoriteCategories
    );
    if (categoryScore >= 80) {
      reasons.push('与你喜欢的分类高度匹配');
    }

    // 2. 行为历史分数
    const behaviorScore = this.calculateBehaviorScore(
      topic.id,
      userProfile.userId
    );
    if (behaviorScore >= 70) {
      reasons.push('基于你的浏览历史推荐');
    }

    // 3. 热点分数
    const trendingScore = this.calculateTrendingScore(topic);
    if (trendingScore >= 80) {
      reasons.push('当前热点，流量高涨');
    }

    // 4. 时间相关性分数
    const timeScore = this.calculateTimeScore(topic, userProfile.bestPostingTime);
    if (timeScore >= 70) {
      reasons.push('适合当前时间发布');
    }

    // 5. 多样性分数（避免推荐过于单一）
    const diversityScore = this.calculateDiversityScore(topic, userProfile);

    // 加权计算总分
    const totalScore =
      categoryScore * this.weights.categoryPreference +
      behaviorScore * this.weights.behaviorHistory +
      trendingScore * this.weights.trendingScore +
      timeScore * this.weights.timeRelevance +
      diversityScore * this.weights.diversity;

    return {
      score: Math.round(totalScore),
      reasons: reasons.slice(0, 3), // 最多 3 个理由
      confidence,
    };
  }

  /**
   * 计算分类偏好分数
   */
  private calculateCategoryScore(
    category: string,
    favoriteCategories: string[]
  ): number {
    if (favoriteCategories.includes(category)) {
      return 95;
    }

    // 检查是否是相关分类
    const relatedCategories: Record<string, string[]> = {
      'tianjin-culture': ['food', 'history', 'craft'],
      'food': ['tianjin-culture', 'life'],
      'history': ['tianjin-culture', 'travel'],
    };

    for (const fav of favoriteCategories) {
      if (relatedCategories[fav]?.includes(category)) {
        return 75;
      }
    }

    return 50; // 默认分数
  }

  /**
   * 计算行为历史分数
   */
  private calculateBehaviorScore(topicId: string, userId: string): number {
    // 简化实现：如果用户之前使用过类似灵感，分数更高
    // 实际应该查询数据库分析历史行为
    return 70;
  }

  /**
   * 计算热点分数
   */
  private calculateTrendingScore(topic: any): number {
    const heatScore = Math.min(topic.heat_value / 1000000, 100); // 热度分数
    const growthScore = Math.min(topic.growth_rate * 5, 100);     // 增长分数
    const trendBonus = topic.trend === 'rising' ? 20 : 0;         // 趋势加分

    return Math.min(heatScore * 0.6 + growthScore * 0.4 + trendBonus, 100);
  }

  /**
   * 计算时间相关性分数
   */
  private calculateTimeScore(topic: any, bestPostingTime: string): number {
    const currentHour = new Date().getHours();
    
    // 解析最佳发布时间
    const [startHour] = bestPostingTime.split('-').map(s => parseInt(s));
    
    // 如果当前时间接近最佳发布时间，分数更高
    const hourDiff = Math.abs(currentHour - startHour);
    
    if (hourDiff <= 2) return 95;
    if (hourDiff <= 4) return 80;
    if (hourDiff <= 6) return 60;
    return 50;
  }

  /**
   * 计算多样性分数
   */
  private calculateDiversityScore(topic: any, userProfile: UserProfile): number {
    // 如果用户最近已经看过很多同类内容，降低分数
    // 这里简化实现
    return 80;
  }

  /**
   * 记录用户行为
   */
  async trackBehavior(
    userId: string,
    inspirationId: string,
    actionType: 'view' | 'use' | 'complete' | 'share' | 'bookmark' | 'like',
    duration?: number
  ): Promise<void> {
    try {
      await supabase
        .from('inspiration_usage_logs')
        .insert({
          user_id: userId,
          inspiration_id: inspirationId,
          inspiration_type: 'recommendation',
          action_type: actionType,
          duration: duration,
          created_at: new Date().toISOString(),
        });

      // 更新用户偏好（异步）
      this.updateUserPreferences(userId, inspirationId, actionType);
    } catch (error: any) {
      console.error('记录用户行为失败:', error);
    }
  }

  /**
   * 更新用户偏好
   */
  private async updateUserPreferences(
    userId: string,
    inspirationId: string,
    actionType: string
  ): Promise<void> {
    try {
      // 获取灵感信息
      const { data: inspiration } = await supabase
        .from('trending_topics')
        .select('category')
        .eq('id', inspirationId)
        .single();

      if (!inspiration) return;

      // 更新或创建用户偏好
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('favorite_categories')
        .eq('user_id', userId)
        .single();

      if (existing) {
        // 更新现有偏好
        const categories = existing.favorite_categories || [];
        if (!categories.includes(inspiration.category)) {
          categories.push(inspiration.category);
        }

        await supabase
          .from('user_preferences')
          .update({
            favorite_categories: categories,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      } else {
        // 创建新偏好
        await supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            favorite_categories: [inspiration.category],
            created_at: new Date().toISOString(),
          });
      }
    } catch (error: any) {
      console.error('更新用户偏好失败:', error);
    }
  }

  /**
   * 映射数据库对象到 UserProfile
   */
  private mapToUserProfile(data: any): UserProfile {
    return {
      userId: data.user_id,
      favoriteCategories: data.favorite_categories || [],
      contentStyles: data.content_styles || [],
      bestPostingTime: data.best_posting_time || '19:00-21:00',
      audienceProfile: data.audience_profile || {
        ageRange: '18-30',
        genderRatio: { male: 0.45, female: 0.55 },
        topCities: ['天津'],
      },
      historicalPerformance: data.historical_performance || {
        avgViews: 0,
        avgLikes: 0,
        bestCategory: '',
        totalWorks: 0,
      },
      behaviorScore: {
        creativity: 75,
        consistency: 60,
        engagement: 80,
        trendiness: 85,
      },
    };
  }

  /**
   * 映射数据库对象到 TrendingTopic
   */
  private mapToTrendingTopic(data: any): TrendingTopic {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      subcategory: data.subcategory,
      heatValue: data.heat_value,
      growthRate: data.growth_rate,
      videoCount: data.video_count,
      viewCount: data.view_count,
      likeCount: data.like_count,
      trend: data.trend as 'rising' | 'falling' | 'stable',
      relatedTags: data.related_tags,
      suggestedAngles: data.suggested_angles,
      timeRange: data.time_range as any,
    };
  }
}

// 导出单例
export const personalizedRecommendationService = new PersonalizedRecommendationService();
