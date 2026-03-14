/**
 * 反馈闭环服务 - 兼容层
 * 已迁移到 feedbackLearning.ts
 * 此文件保留以维持向后兼容
 */

import { getFeedbackLearning, FeedbackType as NewFeedbackType } from './feedbackLearning';
import { getLongTermMemory, MemoryType } from './longTermMemory';
import { EntityType } from './entityExtractor';

// 反馈类型
export enum FeedbackType {
  EXPLICIT_LIKE = 'explicit_like',
  EXPLICIT_DISLIKE = 'explicit_dislike',
  IMPLICIT_DWELL = 'implicit_dwell',
  IMPLICIT_ACTION = 'implicit_action',
  CORRECTION = 'correction',
  SKIP = 'skip',
  REPEAT = 'repeat'
}

// 反馈数据
export interface FeedbackData {
  id: string;
  type: FeedbackType;
  timestamp: number;
  sessionId: string;
  userId: string;
  context: {
    agentType?: string;
    taskType?: string;
    outputId?: string;
    prompt?: string;
    response?: string;
    stage?: string;
  };
  rating?: number;
  comment?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

// 反馈分析结果
export interface FeedbackAnalysis {
  totalFeedback: number;
  satisfactionRate: number;
  averageRating: number;
  trend: 'improving' | 'stable' | 'declining';
  topIssues: {
    issue: string;
    count: number;
    severity: 'high' | 'medium' | 'low';
  }[];
  topStrengths: {
    strength: string;
    count: number;
  }[];
}

// 优化建议
export interface OptimizationSuggestion {
  area: string;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: string;
  implementation: string;
}

// 学习数据
export interface LearningData {
  successfulPatterns: {
    pattern: string;
    successRate: number;
    usageCount: number;
  }[];
  failedPatterns: {
    pattern: string;
    failureRate: number;
    commonReasons: string[];
  }[];
  userPreferences: {
    preference: string;
    strength: number;
  }[];
}

/**
 * 反馈闭环服务（兼容层）
 */
export class FeedbackLoopService {
  private feedbackLearning = getFeedbackLearning();
  private longTermMemory = getLongTermMemory();

  /**
   * 提交显式反馈
   */
  submitExplicitFeedback(
    type: FeedbackType.EXPLICIT_LIKE | FeedbackType.EXPLICIT_DISLIKE,
    context: FeedbackData['context'],
    options?: {
      rating?: number;
      comment?: string;
      tags?: string[];
    }
  ): void {
    const feedbackType = type === FeedbackType.EXPLICIT_LIKE 
      ? NewFeedbackType.LIKE 
      : NewFeedbackType.DISLIKE;

    this.feedbackLearning.collectFeedback({
      type: feedbackType,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      agentType: context.agentType || 'unknown',
      taskType: context.taskType,
      content: context.response || '',
      rating: options?.rating,
      comment: options?.comment,
      tags: options?.tags
    });
  }

  /**
   * 记录隐式反馈 - 停留时间
   */
  recordDwellTime(
    outputId: string,
    dwellTimeMs: number,
    context: FeedbackData['context']
  ): void {
    let rating = 3;
    if (dwellTimeMs > 30000) rating = 5;
    else if (dwellTimeMs > 10000) rating = 4;
    else if (dwellTimeMs < 3000) rating = 2;

    this.feedbackLearning.collectFeedback({
      type: NewFeedbackType.IMPLICIT,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      agentType: context.agentType || 'unknown',
      taskType: context.taskType,
      content: context.response || '',
      rating,
      metadata: { dwellTimeMs }
    });
  }

  /**
   * 记录用户纠正
   */
  recordCorrection(
    originalResponse: string,
    correctedResponse: string,
    context: FeedbackData['context']
  ): void {
    this.feedbackLearning.collectFeedback({
      type: NewFeedbackType.CORRECTION,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      agentType: context.agentType || 'unknown',
      taskType: context.taskType,
      content: originalResponse,
      comment: correctedResponse,
      tags: ['correction', 'user-edit']
    });

    // 添加到长期记忆用于学习
    this.longTermMemory.store({
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      type: MemoryType.PREFERENCE,
      content: `原始: ${originalResponse}\n纠正: ${correctedResponse}`,
      entities: [
        { type: EntityType.STYLE, value: 'correction', confidence: 1 },
        { type: EntityType.STYLE, value: 'learning', confidence: 1 }
      ],
      importance: 0.8,
      metadata: { originalResponse, correctedResponse }
    });
  }

  /**
   * 记录跳过行为
   */
  recordSkip(
    outputId: string,
    reason: string,
    context: FeedbackData['context']
  ): void {
    this.feedbackLearning.collectFeedback({
      type: NewFeedbackType.SKIP,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      agentType: context.agentType || 'unknown',
      taskType: context.taskType,
      content: context.response || '',
      comment: reason,
      tags: ['skip', 'not-relevant']
    });
  }

  /**
   * 分析反馈数据
   */
  analyzeFeedback(timeRange?: { start: number; end: number }): FeedbackAnalysis {
    const stats = this.feedbackLearning.getStats();
    const insights = this.feedbackLearning.generateInsights();

    return {
      totalFeedback: stats.total,
      satisfactionRate: stats.satisfactionRate,
      averageRating: stats.averageRating,
      trend: stats.trend as 'improving' | 'stable' | 'declining',
      topIssues: insights.commonIssues.map(issue => ({
        issue: issue.category,
        count: issue.count,
        severity: issue.severity as 'high' | 'medium' | 'low'
      })),
      topStrengths: insights.successPatterns.map(pattern => ({
        strength: pattern.pattern,
        count: pattern.count
      }))
    };
  }

  /**
   * 生成学习数据
   */
  generateLearningData(): LearningData {
    const insights = this.feedbackLearning.generateInsights();
    
    return {
      successfulPatterns: insights.successPatterns.map(p => ({
        pattern: p.pattern,
        successRate: p.successRate,
        usageCount: p.count
      })),
      failedPatterns: [], // 简化实现
      userPreferences: [] // 简化实现
    };
  }

  /**
   * 生成优化建议
   */
  generateOptimizationSuggestions(): OptimizationSuggestion[] {
    const insights = this.feedbackLearning.generateInsights();
    
    return insights.improvementSuggestions.map(suggestion => ({
      area: suggestion.area,
      issue: suggestion.issue,
      suggestion: suggestion.suggestion,
      priority: suggestion.priority as 'high' | 'medium' | 'low',
      expectedImpact: suggestion.expectedImpact,
      implementation: suggestion.implementation
    }));
  }

  /**
   * 获取统计信息
   */
  getStats(): { total: number; byType: Record<string, number>; recent7Days: number } {
    const stats = this.feedbackLearning.getStats();
    return {
      total: stats.total,
      byType: {},
      recent7Days: stats.total
    };
  }

  /**
   * 导出反馈数据
   */
  exportFeedbacks(): string {
    return JSON.stringify([]);
  }

  /**
   * 清除所有反馈
   */
  clearFeedbacks(): void {
    // 简化实现
  }

  /**
   * 获取会话ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('agent-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('agent-session-id', sessionId);
    }
    return sessionId;
  }

  /**
   * 获取用户ID
   */
  private getUserId(): string {
    let userId = localStorage.getItem('agent-user-id');
    if (!userId) {
      userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('agent-user-id', userId);
    }
    return userId;
  }
}

// 单例实例
let feedbackLoopServiceInstance: FeedbackLoopService | null = null;

export function getFeedbackLoopService(): FeedbackLoopService {
  if (!feedbackLoopServiceInstance) {
    feedbackLoopServiceInstance = new FeedbackLoopService();
  }
  return feedbackLoopServiceInstance;
}

export function resetFeedbackLoopService(): void {
  feedbackLoopServiceInstance = null;
}

export default FeedbackLoopService;
