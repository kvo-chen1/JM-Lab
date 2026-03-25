/**
 * 学习系统
 * 收集用户反馈，分析偏好，提供个性化推荐
 */

import { AgentType } from '../types/agent';
import { supabase } from '@/lib/supabase';

// ==================== 数据模型 ====================

export type FeedbackType =
  | 'like'           // 点赞
  | 'dislike'        // 不喜欢
  | 'modify'         // 修改请求
  | 'regenerate'     // 重新生成
  | 'style_change'   // 换风格
  | 'detail_adjust'  // 细节调整
  | 'save'           // 保存作品
  | 'share'          // 分享作品
  | 'download'       // 下载作品
  | 'use_in_design'  // 用于设计
  | 'select_style'   // 选择风格
  | 'select_agent';  // 选择 Agent

export interface Feedback {
  id: string;
  userId: string;
  sessionId: string;
  type: FeedbackType;
  designId?: string;
  designType?: string;
  style?: string;
  prompt?: string;
  timestamp: number;

  // 反馈详情
  details?: {
    reason?: string;
    improvement?: string;
    specificAspects?: string[];  // 具体方面：颜色/构图/风格等
    comparisonWith?: string;     // 与哪个作品比较
    rating?: number;             // 1-5 评分
  };

  // 上下文
  context: {
    agentType: AgentType;
    conversationStage: string;
    previousDesigns?: string[];
    messageCount: number;
  };
}

export interface StylePreference {
  styleId: string;
  styleName: string;
  score: number;           // 0-100
  selectionCount: number;
  lastUsed: number;
  contexts: string[];      // 在哪些场景下使用过
  avgRating?: number;      // 平均评分
}

export interface DesignTypePreference {
  type: string;
  frequency: number;
  avgComplexity: 'simple' | 'moderate' | 'complex';
  lastUsed: number;
}

export interface ColorPreference {
  color: string;
  score: number;
  associatedStyles: string[];
  frequency: number;
}

export interface AgentPreference {
  agentType: AgentType;
  satisfaction: number;    // 0-100
  usageCount: number;
  avgRating?: number;
  lastUsed: number;
}

export interface KeywordPattern {
  keyword: string;
  frequency: number;
  context: string;
  associatedDesignTypes: string[];
}

export interface LearnedRule {
  id: string;
  condition: string;
  action: string;
  confidence: number;      // 0-1
  successRate: number;     // 0-1
  usageCount: number;
  createdAt: number;
  lastUsed: number;
}

export interface UserPreferenceProfile {
  userId: string;

  // 偏好数据
  stylePreferences: StylePreference[];
  designTypePreferences: DesignTypePreference[];
  colorPreferences: ColorPreference[];
  agentPreferences: AgentPreference[];
  commonKeywords: KeywordPattern[];

  // 学习到的规则
  learnedRules: LearnedRule[];

  // 统计
  totalFeedbacks: number;
  totalDesigns: number;
  avgSatisfaction: number;

  updatedAt: number;
}

// ==================== 反馈收集器 ====================

export class FeedbackCollector {
  private feedbacks: Feedback[] = [];
  private readonly STORAGE_KEY = 'agent_feedbacks';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 收集反馈
   */
  collect(feedback: Omit<Feedback, 'id' | 'timestamp'>): Feedback {
    const newFeedback: Feedback = {
      ...feedback,
      id: this.generateId(),
      timestamp: Date.now()
    };

    this.feedbacks.push(newFeedback);
    this.saveToStorage();

    // 异步同步到数据库
    this.syncToDatabase(newFeedback).catch(console.error);

    console.log('[FeedbackCollector] 收集反馈:', newFeedback);
    return newFeedback;
  }

  /**
   * 快速收集反馈（简化版）
   */
  quickCollect(
    userId: string,
    sessionId: string,
    type: FeedbackType,
    context: Feedback['context'],
    details?: Feedback['details']
  ): Feedback {
    return this.collect({
      userId,
      sessionId,
      type,
      context,
      details
    });
  }

  /**
   * 获取用户的所有反馈
   */
  getUserFeedback(userId: string): Feedback[] {
    return this.feedbacks.filter(f => f.userId === userId);
  }

  /**
   * 获取会话的反馈
   */
  getSessionFeedback(sessionId: string): Feedback[] {
    return this.feedbacks.filter(f => f.sessionId === sessionId);
  }

  /**
   * 获取特定类型的反馈
   */
  getFeedbackByType(userId: string, type: FeedbackType): Feedback[] {
    return this.feedbacks.filter(f => f.userId === userId && f.type === type);
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 从 localStorage 加载
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.feedbacks = JSON.parse(stored);
        console.log('[FeedbackCollector] 从存储加载反馈:', this.feedbacks.length);
      }
    } catch (error) {
      console.error('[FeedbackCollector] 加载存储失败:', error);
    }
  }

  /**
   * 保存到 localStorage
   */
  private saveToStorage(): void {
    try {
      // 只保存最近100条反馈
      const recentFeedbacks = this.feedbacks.slice(-100);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentFeedbacks));
    } catch (error) {
      console.error('[FeedbackCollector] 保存存储失败:', error);
    }
  }

  /**
   * 同步到数据库
   */
  private async syncToDatabase(feedback: Feedback): Promise<void> {
    try {
      // 如果用户已登录，同步到 Supabase
      if (feedback.userId && !feedback.userId.startsWith('anon_')) {
        const { error } = await supabase
          .from('user_feedbacks')
          .insert({
            user_id: feedback.userId,
            session_id: feedback.sessionId,
            type: feedback.type,
            design_id: feedback.designId,
            design_type: feedback.designType,
            style: feedback.style,
            prompt: feedback.prompt,
            details: feedback.details,
            context: feedback.context,
            created_at: new Date(feedback.timestamp).toISOString()
          });

        if (error) {
          console.error('[FeedbackCollector] 同步到数据库失败:', error);
        }
      }
    } catch (error) {
      console.error('[FeedbackCollector] 同步失败:', error);
    }
  }

  /**
   * 清空反馈
   */
  clear(): void {
    this.feedbacks = [];
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// ==================== 偏好分析器 ====================

export class PreferenceAnalyzer {
  private feedbackCollector: FeedbackCollector;

  constructor(feedbackCollector: FeedbackCollector) {
    this.feedbackCollector = feedbackCollector;
  }

  /**
   * 分析用户偏好
   */
  analyze(userId: string): UserPreferenceProfile {
    const feedbacks = this.feedbackCollector.getUserFeedback(userId);

    const profile: UserPreferenceProfile = {
      userId,
      stylePreferences: this.analyzeStylePreferences(feedbacks),
      designTypePreferences: this.analyzeDesignTypePreferences(feedbacks),
      colorPreferences: this.analyzeColorPreferences(feedbacks),
      agentPreferences: this.analyzeAgentPreferences(feedbacks),
      commonKeywords: this.extractKeywordPatterns(feedbacks),
      learnedRules: this.generateLearnedRules(feedbacks),
      totalFeedbacks: feedbacks.length,
      totalDesigns: this.countDesigns(feedbacks),
      avgSatisfaction: this.calculateAvgSatisfaction(feedbacks),
      updatedAt: Date.now()
    };

    console.log('[PreferenceAnalyzer] 分析用户偏好:', profile);
    return profile;
  }

  /**
   * 分析风格偏好
   */
  private analyzeStylePreferences(feedbacks: Feedback[]): StylePreference[] {
    const styleMap = new Map<string, StylePreference>();

    feedbacks.forEach(fb => {
      if (!fb.style) return;

      const existing = styleMap.get(fb.style);
      if (existing) {
        existing.selectionCount++;
        existing.lastUsed = Math.max(existing.lastUsed, fb.timestamp);
        if (fb.details?.rating) {
          existing.avgRating = (existing.avgRating || 0) + fb.details.rating;
        }
        if (fb.designType && !existing.contexts.includes(fb.designType)) {
          existing.contexts.push(fb.designType);
        }
      } else {
        styleMap.set(fb.style, {
          styleId: fb.style,
          styleName: fb.style,
          score: 50,  // 初始分数
          selectionCount: 1,
          lastUsed: fb.timestamp,
          contexts: fb.designType ? [fb.designType] : [],
          avgRating: fb.details?.rating
        });
      }
    });

    // 计算分数
    const preferences = Array.from(styleMap.values()).map(pref => {
      // 基于选择次数、评分和时效性计算分数
      const countScore = Math.min(pref.selectionCount * 10, 50);
      const ratingScore = pref.avgRating ? (pref.avgRating / pref.selectionCount) * 10 : 0;
      const recencyScore = this.calculateRecencyScore(pref.lastUsed);

      pref.score = Math.min(countScore + ratingScore + recencyScore, 100);
      if (pref.avgRating) {
        pref.avgRating = pref.avgRating / pref.selectionCount;
      }

      return pref;
    });

    // 按分数排序
    return preferences.sort((a, b) => b.score - a.score);
  }

  /**
   * 分析设计类型偏好
   */
  private analyzeDesignTypePreferences(feedbacks: Feedback[]): DesignTypePreference[] {
    const typeMap = new Map<string, { count: number; complexities: string[]; lastUsed: number }>();

    feedbacks.forEach(fb => {
      if (!fb.designType) return;

      const existing = typeMap.get(fb.designType);
      if (existing) {
        existing.count++;
        existing.lastUsed = Math.max(existing.lastUsed, fb.timestamp);
        if (fb.context?.conversationStage) {
          existing.complexities.push(fb.context.conversationStage);
        }
      } else {
        typeMap.set(fb.designType, {
          count: 1,
          complexities: fb.context?.conversationStage ? [fb.context.conversationStage] : [],
          lastUsed: fb.timestamp
        });
      }
    });

    return Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      frequency: data.count,
      avgComplexity: this.estimateComplexity(data.complexities),
      lastUsed: data.lastUsed
    })).sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * 分析颜色偏好
   */
  private analyzeColorPreferences(feedbacks: Feedback[]): ColorPreference[] {
    // 从反馈中提取颜色关键词
    const colorKeywords = ['红色', '蓝色', '绿色', '黄色', '紫色', '橙色', '粉色', '黑色', '白色', '灰色', '金色', '银色'];
    const colorMap = new Map<string, { count: number; styles: Set<string> }>();

    feedbacks.forEach(fb => {
      if (!fb.prompt) return;

      colorKeywords.forEach(color => {
        if (fb.prompt?.includes(color)) {
          const existing = colorMap.get(color);
          if (existing) {
            existing.count++;
            if (fb.style) existing.styles.add(fb.style);
          } else {
            colorMap.set(color, {
              count: 1,
              styles: fb.style ? new Set([fb.style]) : new Set()
            });
          }
        }
      });
    });

    return Array.from(colorMap.entries()).map(([color, data]) => ({
      color,
      score: Math.min(data.count * 10, 100),
      frequency: data.count,
      associatedStyles: Array.from(data.styles)
    })).sort((a, b) => b.score - a.score);
  }

  /**
   * 分析 Agent 偏好
   */
  private analyzeAgentPreferences(feedbacks: Feedback[]): AgentPreference[] {
    const agentMap = new Map<AgentType, { count: number; ratings: number[]; lastUsed: number }>();

    feedbacks.forEach(fb => {
      const agentType = fb.context.agentType;

      const existing = agentMap.get(agentType);
      if (existing) {
        existing.count++;
        existing.lastUsed = Math.max(existing.lastUsed, fb.timestamp);
        if (fb.details?.rating) {
          existing.ratings.push(fb.details.rating);
        }
      } else {
        agentMap.set(agentType, {
          count: 1,
          ratings: fb.details?.rating ? [fb.details.rating] : [],
          lastUsed: fb.timestamp
        });
      }
    });

    return Array.from(agentMap.entries()).map(([agentType, data]) => {
      const avgRating = data.ratings.length > 0
        ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length
        : 3;

      return {
        agentType,
        satisfaction: avgRating * 20,  // 转换为 0-100
        usageCount: data.count,
        avgRating,
        lastUsed: data.lastUsed
      };
    }).sort((a, b) => b.satisfaction - a.satisfaction);
  }

  /**
   * 提取关键词模式
   */
  private extractKeywordPatterns(feedbacks: Feedback[]): KeywordPattern[] {
    const keywordMap = new Map<string, { count: number; contexts: string[]; types: Set<string> }>();

    // 常见设计关键词
    const designKeywords = ['可爱', '简约', '科技感', '复古', '现代', '华丽', '清新', '酷炫', '温馨', '专业'];

    feedbacks.forEach(fb => {
      if (!fb.prompt) return;

      designKeywords.forEach(keyword => {
        if (fb.prompt?.includes(keyword)) {
          const existing = keywordMap.get(keyword);
          if (existing) {
            existing.count++;
            if (fb.context?.conversationStage) {
              existing.contexts.push(fb.context.conversationStage);
            }
            if (fb.designType) {
              existing.types.add(fb.designType);
            }
          } else {
            keywordMap.set(keyword, {
              count: 1,
              contexts: fb.context?.conversationStage ? [fb.context.conversationStage] : [],
              types: fb.designType ? new Set([fb.designType]) : new Set()
            });
          }
        }
      });
    });

    return Array.from(keywordMap.entries()).map(([keyword, data]) => ({
      keyword,
      frequency: data.count,
      context: data.contexts[0] || 'general',
      associatedDesignTypes: Array.from(data.types)
    })).sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * 生成学习到的规则
   */
  private generateLearnedRules(feedbacks: Feedback[]): LearnedRule[] {
    const rules: LearnedRule[] = [];

    // 基于反馈生成简单规则
    const styleDesignTypeMap = new Map<string, Map<string, number>>();

    feedbacks.forEach(fb => {
      if (fb.style && fb.designType) {
        const designTypeMap = styleDesignTypeMap.get(fb.style) || new Map<string, number>();
        const count = designTypeMap.get(fb.designType) || 0;
        designTypeMap.set(fb.designType, count + 1);
        styleDesignTypeMap.set(fb.style, designTypeMap);
      }
    });

    // 生成风格-设计类型关联规则
    styleDesignTypeMap.forEach((designTypeMap, style) => {
      const total = Array.from(designTypeMap.values()).reduce((a, b) => a + b, 0);
      designTypeMap.forEach((count, designType) => {
        if (count >= 2 && count / total > 0.5) {
          rules.push({
            id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            condition: `designType:${designType}`,
            action: `recommendStyle:${style}`,
            confidence: count / total,
            successRate: count / total,
            usageCount: count,
            createdAt: Date.now(),
            lastUsed: Date.now()
          });
        }
      });
    });

    return rules.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 计算时效性分数
   */
  private calculateRecencyScore(timestamp: number): number {
    const daysSinceLastUse = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
    if (daysSinceLastUse < 1) return 20;
    if (daysSinceLastUse < 7) return 15;
    if (daysSinceLastUse < 30) return 10;
    return 5;
  }

  /**
   * 估计复杂度
   */
  private estimateComplexity(stages: string[]): 'simple' | 'moderate' | 'complex' {
    if (stages.length === 0) return 'moderate';

    const complexIndicators = stages.filter(s =>
      s.includes('complex') || s.includes('detailed') || s.includes('complete')
    ).length;

    if (complexIndicators > stages.length * 0.6) return 'complex';
    if (complexIndicators < stages.length * 0.3) return 'simple';
    return 'moderate';
  }

  /**
   * 计算设计数量
   */
  private countDesigns(feedbacks: Feedback[]): number {
    const designIds = new Set(feedbacks.map(fb => fb.designId).filter(Boolean));
    return designIds.size;
  }

  /**
   * 计算平均满意度
   */
  private calculateAvgSatisfaction(feedbacks: Feedback[]): number {
    const ratings = feedbacks
      .map(fb => fb.details?.rating)
      .filter((r): r is number => r !== undefined);

    if (ratings.length === 0) return 0;
    return ratings.reduce((a, b) => a + b, 0) / ratings.length;
  }
}

// ==================== 个性化推荐器 ====================

export interface StyleRecommendation {
  styleId: string;
  styleName: string;
  score: number;
  reason: string;
}

export interface AgentRecommendation {
  agentType: AgentType;
  score: number;
  reason: string;
}

export class PersonalizedRecommender {
  private preferenceAnalyzer: PreferenceAnalyzer;

  constructor(preferenceAnalyzer: PreferenceAnalyzer) {
    this.preferenceAnalyzer = preferenceAnalyzer;
  }

  /**
   * 推荐风格
   */
  recommendStyles(
    userId: string,
    designType?: string,
    limit: number = 5
  ): StyleRecommendation[] {
    const profile = this.preferenceAnalyzer.analyze(userId);

    // 基于用户偏好排序
    let recommendations = profile.stylePreferences.map(pref => ({
      styleId: pref.styleId,
      styleName: pref.styleName,
      score: pref.score,
      reason: this.generateStyleReason(pref, designType)
    }));

    // 如果指定了设计类型，提升相关风格的分数
    if (designType) {
      recommendations = recommendations.map(rec => {
        const preference = profile.stylePreferences.find(p => p.styleId === rec.styleId);
        if (preference?.contexts.includes(designType)) {
          return { ...rec, score: rec.score * 1.2 };
        }
        return rec;
      });
    }

    // 应用学习到的规则
    profile.learnedRules.forEach(rule => {
      if (designType && rule.condition === `designType:${designType}`) {
        const styleId = rule.action.replace('recommendStyle:', '');
        const rec = recommendations.find(r => r.styleId === styleId);
        if (rec) {
          rec.score = Math.min(rec.score * (1 + rule.confidence), 100);
          rec.reason += ` (基于您的历史偏好)`;
        }
      }
    });

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * 推荐 Agent
   */
  recommendAgent(
    userId: string,
    designType?: string
  ): AgentRecommendation {
    const profile = this.preferenceAnalyzer.analyze(userId);

    // 基于设计类型推荐
    let recommendedAgent: AgentType = 'director';
    let score = 50;
    let reason = '默认推荐';

    if (designType) {
      switch (designType) {
        case 'ip-character':
        case 'illustration':
          recommendedAgent = 'illustrator';
          score = 80;
          reason = '插画师擅长角色和插画设计';
          break;
        case 'brand':
        case 'packaging':
        case 'poster':
        case 'logo':
          recommendedAgent = 'designer';
          score = 80;
          reason = '品牌设计师擅长视觉设计';
          break;
        case 'animation':
          recommendedAgent = 'animator';
          score = 80;
          reason = '动画师擅长动效设计';
          break;
      }
    }

    // 基于用户偏好调整
    const userAgentPref = profile.agentPreferences.find(p => p.agentType === recommendedAgent);
    if (userAgentPref) {
      score = Math.min(score + userAgentPref.satisfaction * 0.2, 100);
      reason += ` (您的满意度: ${userAgentPref.satisfaction.toFixed(0)}%)`;
    }

    return {
      agentType: recommendedAgent,
      score,
      reason
    };
  }

  /**
   * 生成推荐理由
   */
  private generateStyleReason(preference: StylePreference, designType?: string): string {
    const reasons: string[] = [];

    if (preference.selectionCount > 3) {
      reasons.push(`您已选择 ${preference.selectionCount} 次`);
    }

    if (preference.avgRating && preference.avgRating >= 4) {
      reasons.push(`平均评分 ${preference.avgRating.toFixed(1)}/5`);
    }

    if (designType && preference.contexts.includes(designType)) {
      reasons.push(`适合${designType}设计`);
    }

    const daysSinceLastUse = Math.floor((Date.now() - preference.lastUsed) / (1000 * 60 * 60 * 24));
    if (daysSinceLastUse < 7) {
      reasons.push('最近使用过');
    }

    return reasons.length > 0 ? reasons.join('，') : '推荐风格';
  }
}

// ==================== 学习管理器 ====================

export class LearningManager {
  private feedbackCollector: FeedbackCollector;
  private preferenceAnalyzer: PreferenceAnalyzer;
  private recommender: PersonalizedRecommender;

  constructor() {
    this.feedbackCollector = new FeedbackCollector();
    this.preferenceAnalyzer = new PreferenceAnalyzer(this.feedbackCollector);
    this.recommender = new PersonalizedRecommender(this.preferenceAnalyzer);
  }

  /**
   * 从反馈学习
   */
  learnFromFeedback(feedback: Omit<Feedback, 'id' | 'timestamp'>): void {
    this.feedbackCollector.collect(feedback);
    console.log('[LearningManager] 学习反馈:', feedback.type);
  }

  /**
   * 获取用户偏好
   */
  getUserProfile(userId: string): UserPreferenceProfile {
    return this.preferenceAnalyzer.analyze(userId);
  }

  /**
   * 获取个性化推荐
   */
  getRecommendations(
    userId: string,
    designType?: string
  ): {
    styles: StyleRecommendation[];
    agent: AgentRecommendation;
  } {
    return {
      styles: this.recommender.recommendStyles(userId, designType),
      agent: this.recommender.recommendAgent(userId, designType)
    };
  }

  /**
   * 获取个性化默认设置
   */
  getPersonalizedDefaults(userId: string): {
    defaultStyle?: string;
    defaultAgent?: AgentType;
    suggestedKeywords: string[];
  } {
    const profile = this.preferenceAnalyzer.analyze(userId);

    return {
      defaultStyle: profile.stylePreferences[0]?.styleId,
      defaultAgent: profile.agentPreferences[0]?.agentType,
      suggestedKeywords: profile.commonKeywords.slice(0, 5).map(k => k.keyword)
    };
  }

  /**
   * 快速记录反馈（简化接口）
   */
  recordFeedback(
    userId: string,
    sessionId: string,
    type: FeedbackType,
    agentType: AgentType,
    details?: {
      designType?: string;
      style?: string;
      prompt?: string;
      rating?: number;
      reason?: string;
    }
  ): void {
    this.feedbackCollector.collect({
      userId,
      sessionId,
      type,
      designType: details?.designType,
      style: details?.style,
      prompt: details?.prompt,
      context: {
        agentType,
        conversationStage: 'active',
        messageCount: 0
      },
      details: details?.rating ? {
        rating: details.rating,
        reason: details.reason
      } : undefined
    });
  }
}

// 导出单例
export const learningManager = new LearningManager();
