/**
 * 个性化推荐服务
 * 基于用户行为和偏好提供个性化内容推荐
 */

import { supabase } from '@/lib/supabase';
import { culturalExpertService, CulturalElement } from './culturalExpertService';

// 用户行为类型
export type UserBehaviorType = 
  | 'view_work'           // 浏览作品
  | 'like_work'           // 点赞作品
  | 'comment_work'        // 评论作品
  | 'create_work'         // 创建作品
  | 'search'              // 搜索
  | 'click_element'       // 点击文化元素
  | 'use_template'        // 使用模板
  | 'generate_image'      // 生成图片
  | 'generate_video'      // 生成视频
  | 'share_work';         // 分享作品

// 用户行为记录
export interface UserBehavior {
  id?: string;
  user_id: string;
  behavior_type: UserBehaviorType;
  target_id?: string;
  target_type?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

// 用户偏好
export interface UserPreference {
  id?: string;
  user_id: string;
  preferred_styles: string[];
  preferred_cultural_elements: string[];
  preferred_colors: string[];
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  interests: string[];
  updated_at?: string;
}

// 推荐内容
export interface Recommendation {
  id: string;
  type: 'cultural_element' | 'template' | 'work' | 'activity' | 'creator';
  title: string;
  description: string;
  image?: string;
  relevance_score: number;
  reason: string;
  data: any;
}

// 创作建议
export interface CreativeSuggestion {
  type: 'style' | 'element' | 'color' | 'composition' | 'theme';
  suggestion: string;
  reason: string;
  confidence: number;
}

class PersonalizationService {
  private cache: Map<string, any> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 记录用户行为
   */
  async trackBehavior(
    userId: string,
    behaviorType: UserBehaviorType,
    targetId?: string,
    targetType?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_behaviors')
        .insert({
          user_id: userId,
          behavior_type: behaviorType,
          target_id: targetId,
          target_type: targetType,
          metadata,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('记录用户行为失败:', error);
      }
    } catch (error) {
      console.error('记录用户行为异常:', error);
    }
  }

  /**
   * 获取用户偏好
   */
  async getUserPreference(userId: string): Promise<UserPreference | null> {
    const cacheKey = `preference_${userId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // 如果没有记录，创建默认偏好
        if (error.code === 'PGRST116') {
          return this.createDefaultPreference(userId);
        }
        return null;
      }

      const preference = data as UserPreference;
      this.cache.set(cacheKey, { data: preference, timestamp: Date.now() });
      return preference;
    } catch (error) {
      console.error('获取用户偏好失败:', error);
      return null;
    }
  }

  /**
   * 创建默认偏好
   */
  private createDefaultPreference(userId: string): UserPreference {
    return {
      user_id: userId,
      preferred_styles: [],
      preferred_cultural_elements: [],
      preferred_colors: [],
      skill_level: 'beginner',
      interests: []
    };
  }

  /**
   * 更新用户偏好
   */
  async updateUserPreference(
    userId: string,
    updates: Partial<UserPreference>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('更新用户偏好失败:', error);
        return false;
      }

      // 清除缓存
      this.cache.delete(`preference_${userId}`);
      return true;
    } catch (error) {
      console.error('更新用户偏好异常:', error);
      return false;
    }
  }

  /**
   * 分析用户行为并生成推荐
   */
  async generateRecommendations(userId: string, limit: number = 5): Promise<Recommendation[]> {
    const cacheKey = `recommendations_${userId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      // 获取用户偏好
      const preference = await this.getUserPreference(userId);
      
      // 获取用户最近行为
      const recentBehaviors = await this.getRecentBehaviors(userId, 20);

      // 生成推荐
      const recommendations: Recommendation[] = [];

      // 1. 基于偏好的文化元素推荐
      if (preference && preference.preferred_cultural_elements && preference.preferred_cultural_elements.length > 0) {
        const elementRecommendations = await this.recommendCulturalElements(
          preference.preferred_cultural_elements,
          recentBehaviors
        );
        recommendations.push(...elementRecommendations);
      }

      // 2. 基于行为的推荐
      const behaviorRecommendations = await this.recommendBasedOnBehavior(
        recentBehaviors
      );
      recommendations.push(...behaviorRecommendations);

      // 3. 热门推荐
      const trendingRecommendations = await this.getTrendingRecommendations();
      recommendations.push(...trendingRecommendations);

      // 去重并按相关性排序
      const uniqueRecommendations = this.deduplicateAndSortRecommendations(recommendations);

      // 缓存结果
      this.cache.set(cacheKey, { 
        data: uniqueRecommendations.slice(0, limit), 
        timestamp: Date.now() 
      });

      return uniqueRecommendations.slice(0, limit);
    } catch (error) {
      console.error('生成推荐失败:', error);
      return [];
    }
  }

  /**
   * 获取用户最近行为
   */
  private async getRecentBehaviors(userId: string, limit: number): Promise<UserBehavior[]> {
    try {
      const { data, error } = await supabase
        .from('user_behaviors')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * 推荐文化元素
   */
  private async recommendCulturalElements(
    preferredElements: string[],
    behaviors: UserBehavior[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // 获取用户喜欢的元素的相关元素
    for (const elementName of preferredElements.slice(0, 3)) {
      const elements = await culturalExpertService.searchCulturalElements(elementName);
      if (elements.length > 0) {
        const element = elements[0];
        const relatedElements = culturalExpertService.getRelatedElements(element.id);
        
        relatedElements.forEach(related => {
          recommendations.push({
            id: `cultural_${related.id}`,
            type: 'cultural_element',
            title: related.name,
            description: related.description,
            relevance_score: 0.8,
            reason: `基于您对${element.name}的兴趣推荐`,
            data: related
          });
        });
      }
    }

    return recommendations;
  }

  /**
   * 基于行为推荐
   */
  private async recommendBasedOnBehavior(
    behaviors: UserBehavior[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // 分析行为模式
    const behaviorCounts: Record<string, number> = {};
    behaviors.forEach(b => {
      behaviorCounts[b.behavior_type] = (behaviorCounts[b.behavior_type] || 0) + 1;
    });

    // 根据行为模式推荐
    if (behaviorCounts['create_work'] > 3) {
      // 活跃用户推荐活动
      recommendations.push({
        id: 'activity_1',
        type: 'activity',
        title: '参与"津门创意大赛"',
        description: '展示您的创作才华，赢取丰厚奖品',
        relevance_score: 0.9,
        reason: '您最近创作活跃，适合参与活动',
        data: { type: 'contest', name: '津门创意大赛' }
      });
    }

    if (behaviorCounts['view_work'] > 5) {
      // 浏览型用户推荐创作者
      recommendations.push({
        id: 'creator_1',
        type: 'creator',
        title: '关注热门创作者',
        description: '发现更多优秀作品和创作灵感',
        relevance_score: 0.85,
        reason: '根据您的浏览习惯推荐',
        data: { type: 'creator_suggestion' }
      });
    }

    if (behaviorCounts['search'] > 0) {
      // 搜索型用户推荐模板
      recommendations.push({
        id: 'template_1',
        type: 'template',
        title: '天津文化主题模板',
        description: '快速开始您的文化创作',
        relevance_score: 0.8,
        reason: '基于您的搜索历史推荐',
        data: { type: 'cultural_template' }
      });
    }

    return recommendations;
  }

  /**
   * 获取热门推荐
   */
  private async getTrendingRecommendations(): Promise<Recommendation[]> {
    return [
      {
        id: 'trending_1',
        type: 'cultural_element',
        title: '杨柳青年画',
        description: '天津最具代表性的非遗文化，适合春节主题创作',
        relevance_score: 0.75,
        reason: '当前热门文化元素',
        data: culturalExpertService.getCulturalElementById('yangliuqing_nianhua')
      },
      {
        id: 'trending_2',
        type: 'activity',
        title: '非遗文化周',
        description: '探索天津传统文化，参与线上活动',
        relevance_score: 0.7,
        reason: '平台热门活动',
        data: { type: 'cultural_event', name: '非遗文化周' }
      }
    ];
  }

  /**
   * 去重并排序推荐
   */
  private deduplicateAndSortRecommendations(
    recommendations: Recommendation[]
  ): Recommendation[] {
    const seen = new Set<string>();
    const unique: Recommendation[] = [];

    for (const rec of recommendations) {
      if (!seen.has(rec.id)) {
        seen.add(rec.id);
        unique.push(rec);
      }
    }

    // 按相关性排序
    return unique.sort((a, b) => b.relevance_score - a.relevance_score);
  }

  /**
   * 生成创作建议
   */
  async generateCreativeSuggestions(
    userId: string,
    context?: string
  ): Promise<CreativeSuggestion[]> {
    const preference = await this.getUserPreference(userId);
    const suggestions: CreativeSuggestion[] = [];

    if (!preference) return suggestions;

    // 基于偏好的风格建议
    if (preference.preferred_styles.length > 0) {
      const style = preference.preferred_styles[0];
      suggestions.push({
        type: 'style',
        suggestion: `尝试${style}风格，这与您的历史偏好一致`,
        reason: '基于您的风格偏好',
        confidence: 0.85
      });
    }

    // 基于技能水平的建议
    if (preference.skill_level === 'beginner') {
      suggestions.push({
        type: 'theme',
        suggestion: '从简单的文化元素开始，如狗不理包子或十八街麻花',
        reason: '适合初学者的入门元素',
        confidence: 0.9
      });
    } else if (preference.skill_level === 'advanced') {
      suggestions.push({
        type: 'composition',
        suggestion: '尝试融合多种文化元素，创造独特的视觉效果',
        reason: '适合高级创作者的复杂构图',
        confidence: 0.8
      });
    }

    // 基于兴趣的建议
    if (preference.interests.includes('非遗')) {
      suggestions.push({
        type: 'element',
        suggestion: '探索杨柳青年画或泥人张的现代化表达',
        reason: '符合您对非遗文化的兴趣',
        confidence: 0.85
      });
    }

    // 基于上下文的建议
    if (context) {
      if (context.includes('春节') || context.includes('新年')) {
        suggestions.push({
          type: 'theme',
          suggestion: '使用杨柳青年画的喜庆元素和红色调',
          reason: '适合春节主题',
          confidence: 0.9
        });
      }
    }

    return suggestions;
  }

  /**
   * 生成每日灵感
   */
  async generateDailyInspiration(userId: string): Promise<string> {
    const preference = await this.getUserPreference(userId);
    
    // 随机选择文化元素
    const allElements = culturalExpertService.getAllCulturalElements();
    const randomElement = allElements[Math.floor(Math.random() * allElements.length)];

    let inspiration = `## 今日创作灵感 💡\n\n`;
    inspiration += `**推荐元素：** ${randomElement.name}\n\n`;
    inspiration += `${randomElement.description}\n\n`;
    
    if (randomElement.application_suggestions.length > 0) {
      inspiration += `**创作建议：**\n`;
      randomElement.application_suggestions.slice(0, 2).forEach(suggestion => {
        inspiration += `- ${suggestion}\n`;
      });
      inspiration += '\n';
    }

    inspiration += `**推荐配色：** ${randomElement.color_palette.slice(0, 3).join('、')}\n`;
    
    if (preference) {
      inspiration += `\n💡 根据您的偏好，建议尝试${preference.preferred_styles[0] || '传统与现代结合'}的风格。`;
    }

    return inspiration;
  }

  /**
   * 获取创作趋势分析
   */
  async getCreativeTrends(userId: string): Promise<{
    totalWorks: number;
    favoriteElements: string[];
    styleEvolution: string[];
    suggestions: string[];
  }> {
    try {
      // 获取用户作品统计
      const { data: works, error } = await supabase
        .from('works')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        return {
          totalWorks: 0,
          favoriteElements: [],
          styleEvolution: [],
          suggestions: ['开始您的创作之旅吧！']
        };
      }

      const totalWorks = works?.length || 0;
      
      // 分析喜欢的元素
      const elementCounts: Record<string, number> = {};
      works?.forEach(work => {
        if (work.cultural_elements) {
          work.cultural_elements.forEach((element: string) => {
            elementCounts[element] = (elementCounts[element] || 0) + 1;
          });
        }
      });

      const favoriteElements = Object.entries(elementCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([element]) => element);

      // 生成建议
      const suggestions: string[] = [];
      if (totalWorks === 0) {
        suggestions.push('开始您的第一个创作吧！');
        suggestions.push('可以尝试使用杨柳青年画元素');
      } else if (totalWorks < 5) {
        suggestions.push('保持创作热情，尝试不同风格');
        suggestions.push('探索更多天津文化元素');
      } else {
        suggestions.push('您的创作很丰富，考虑参与平台活动');
        suggestions.push('尝试融合多种文化元素');
      }

      return {
        totalWorks,
        favoriteElements,
        styleEvolution: [],
        suggestions
      };
    } catch (error) {
      return {
        totalWorks: 0,
        favoriteElements: [],
        styleEvolution: [],
        suggestions: ['开始创作吧！']
      };
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// 导出单例实例
export const personalizationService = new PersonalizationService();
