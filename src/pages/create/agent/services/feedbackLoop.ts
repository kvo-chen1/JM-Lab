// 反馈闭环服务 - 收集反馈并持续优化系统

import { getMemoryService } from './memoryService';
import { getVectorStore } from './vectorStore';
import { getPredictionService, BehaviorType } from './predictionService';

// 反馈类型
export enum FeedbackType {
  EXPLICIT_LIKE = 'explicit_like',      // 显式点赞
  EXPLICIT_DISLIKE = 'explicit_dislike', // 显式点踩
  IMPLICIT_DWELL = 'implicit_dwell',     // 隐式停留时间
  IMPLICIT_ACTION = 'implicit_action',   // 隐式操作路径
  CORRECTION = 'correction',             // 用户纠正
  SKIP = 'skip',                         // 跳过/忽略
  REPEAT = 'repeat'                      // 重复请求
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
  rating?: number; // 1-5星评分
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

// 存储键
const FEEDBACK_STORAGE_KEY = 'agent-feedback-data';
const MAX_FEEDBACK_RECORDS = 1000;

/**
 * 反馈闭环服务
 * 收集显式和隐式反馈，持续优化系统
 */
export class FeedbackLoopService {
  private feedbacks: FeedbackData[] = [];
  private memoryService = getMemoryService();
  private vectorStore = getVectorStore();
  private predictionService = getPredictionService();

  constructor() {
    this.loadFeedbacks();
  }

  /**
   * 加载反馈数据
   */
  private loadFeedbacks(): void {
    try {
      const saved = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      if (saved) {
        this.feedbacks = JSON.parse(saved);
        console.log(`[FeedbackLoop] Loaded ${this.feedbacks.length} feedback records`);
      }
    } catch (error) {
      console.error('[FeedbackLoop] Failed to load feedbacks:', error);
    }
  }

  /**
   * 保存反馈数据
   */
  private saveFeedbacks(): void {
    try {
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(this.feedbacks));
    } catch (error) {
      console.error('[FeedbackLoop] Failed to save feedbacks:', error);
    }
  }

  // ==================== 反馈收集 ====================

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
    const feedback: FeedbackData = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
      context,
      rating: options?.rating,
      comment: options?.comment,
      tags: options?.tags
    };

    this.feedbacks.push(feedback);

    // 限制数量
    if (this.feedbacks.length > MAX_FEEDBACK_RECORDS) {
      this.feedbacks = this.feedbacks.slice(-MAX_FEEDBACK_RECORDS);
    }

    this.saveFeedbacks();

    // 更新记忆服务
    if (context.outputId) {
      this.memoryService.recordFeedback(
        context.outputId,
        type === FeedbackType.EXPLICIT_LIKE ? 'like' : 'dislike',
        options?.comment,
        options?.tags
      );
    }

    // 记录行为
    this.predictionService.recordBehavior(
      type === FeedbackType.EXPLICIT_LIKE ? BehaviorType.FEEDBACK_GIVE : BehaviorType.FEEDBACK_GIVE,
      { feedbackType: type, outputId: context.outputId }
    );

    console.log(`[FeedbackLoop] Submitted ${type} feedback`);
  }

  /**
   * 记录隐式反馈 - 停留时间
   */
  recordDwellTime(
    outputId: string,
    dwellTimeMs: number,
    context: FeedbackData['context']
  ): void {
    // 根据停留时间判断满意度
    let impliedRating = 3;
    if (dwellTimeMs > 30000) impliedRating = 5; // 超过30秒，很感兴趣
    else if (dwellTimeMs > 10000) impliedRating = 4; // 超过10秒，比较满意
    else if (dwellTimeMs < 3000) impliedRating = 2; // 少于3秒，不太满意

    const feedback: FeedbackData = {
      id: `feedback-dwell-${Date.now()}`,
      type: FeedbackType.IMPLICIT_DWELL,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
      context: { ...context, outputId },
      rating: impliedRating,
      metadata: { dwellTimeMs }
    };

    this.feedbacks.push(feedback);
    this.saveFeedbacks();

    console.log(`[FeedbackLoop] Recorded dwell time: ${dwellTimeMs}ms, rating: ${impliedRating}`);
  }

  /**
   * 记录用户纠正
   */
  recordCorrection(
    originalResponse: string,
    correctedResponse: string,
    context: FeedbackData['context']
  ): void {
    const feedback: FeedbackData = {
      id: `feedback-correction-${Date.now()}`,
      type: FeedbackType.CORRECTION,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
      context: {
        ...context,
        response: originalResponse
      },
      comment: correctedResponse,
      tags: ['correction', 'user-edit']
    };

    this.feedbacks.push(feedback);
    this.saveFeedbacks();

    // 添加到向量存储用于学习
    this.vectorStore.addVector(
      `原始: ${originalResponse}\n纠正: ${correctedResponse}`,
      {
        type: 'conversation',
        tags: ['correction', 'learning'],
        timestamp: Date.now()
      }
    );

    console.log('[FeedbackLoop] Recorded user correction');
  }

  /**
   * 记录跳过行为
   */
  recordSkip(
    outputId: string,
    reason: string,
    context: FeedbackData['context']
  ): void {
    const feedback: FeedbackData = {
      id: `feedback-skip-${Date.now()}`,
      type: FeedbackType.SKIP,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
      context: { ...context, outputId },
      comment: reason,
      tags: ['skip', 'not-relevant']
    };

    this.feedbacks.push(feedback);
    this.saveFeedbacks();

    console.log('[FeedbackLoop] Recorded skip:', reason);
  }

  // ==================== 反馈分析 ====================

  /**
   * 分析反馈数据
   */
  analyzeFeedback(timeRange?: { start: number; end: number }): FeedbackAnalysis {
    let feedbacks = this.feedbacks;

    // 时间范围过滤
    if (timeRange) {
      feedbacks = feedbacks.filter(
        f => f.timestamp >= timeRange.start && f.timestamp <= timeRange.end
      );
    }

    // 只分析最近100条
    feedbacks = feedbacks.slice(-100);

    if (feedbacks.length === 0) {
      return {
        totalFeedback: 0,
        satisfactionRate: 0,
        averageRating: 0,
        trend: 'stable',
        topIssues: [],
        topStrengths: []
      };
    }

    // 计算满意度
    const explicitFeedbacks = feedbacks.filter(
      f => f.type === FeedbackType.EXPLICIT_LIKE || f.type === FeedbackType.EXPLICIT_DISLIKE
    );

    const likeCount = explicitFeedbacks.filter(
      f => f.type === FeedbackType.EXPLICIT_LIKE
    ).length;

    const satisfactionRate = explicitFeedbacks.length > 0
      ? likeCount / explicitFeedbacks.length
      : 0;

    // 计算平均评分
    const ratings = feedbacks
      .filter(f => f.rating !== undefined)
      .map(f => f.rating!);

    const averageRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    // 分析趋势
    const trend = this.calculateTrend(feedbacks);

    // 分析问题
    const topIssues = this.identifyTopIssues(feedbacks);

    // 分析优势
    const topStrengths = this.identifyTopStrengths(feedbacks);

    return {
      totalFeedback: feedbacks.length,
      satisfactionRate,
      averageRating,
      trend,
      topIssues,
      topStrengths
    };
  }

  /**
   * 计算趋势
   */
  private calculateTrend(feedbacks: FeedbackData[]): FeedbackAnalysis['trend'] {
    if (feedbacks.length < 20) return 'stable';

    const half = Math.floor(feedbacks.length / 2);
    const firstHalf = feedbacks.slice(0, half);
    const secondHalf = feedbacks.slice(half);

    const firstRating = this.calculateAverageRating(firstHalf);
    const secondRating = this.calculateAverageRating(secondHalf);

    const diff = secondRating - firstRating;

    if (diff > 0.5) return 'improving';
    if (diff < -0.5) return 'declining';
    return 'stable';
  }

  /**
   * 计算平均评分
   */
  private calculateAverageRating(feedbacks: FeedbackData[]): number {
    const ratings = feedbacks.filter(f => f.rating !== undefined).map(f => f.rating!);
    if (ratings.length === 0) return 0;
    return ratings.reduce((a, b) => a + b, 0) / ratings.length;
  }

  /**
   * 识别主要问题
   */
  private identifyTopIssues(feedbacks: FeedbackData[]): FeedbackAnalysis['topIssues'] {
    const issues: Map<string, { count: number; severity: 'high' | 'medium' | 'low' }> = new Map();

    // 分析负面反馈
    const negativeFeedbacks = feedbacks.filter(
      f => f.type === FeedbackType.EXPLICIT_DISLIKE || (f.rating && f.rating < 3)
    );

    negativeFeedbacks.forEach(f => {
      const tags = f.tags || [];
      tags.forEach(tag => {
        const current = issues.get(tag) || { count: 0, severity: 'low' };
        current.count++;
        if (current.count > 5) current.severity = 'high';
        else if (current.count > 2) current.severity = 'medium';
        issues.set(tag, current);
      });

      // 分析评论中的关键词
      if (f.comment) {
        const keywords = ['不对', '错误', '不好', '不满意', '问题', 'bug'];
        keywords.forEach(keyword => {
          if (f.comment!.includes(keyword)) {
            const current = issues.get(keyword) || { count: 0, severity: 'low' };
            current.count++;
            issues.set(keyword, current);
          }
        });
      }
    });

    return Array.from(issues.entries())
      .map(([issue, data]) => ({
        issue,
        count: data.count,
        severity: data.severity
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * 识别主要优势
   */
  private identifyTopStrengths(feedbacks: FeedbackData[]): FeedbackAnalysis['topStrengths'] {
    const strengths: Map<string, number> = new Map();

    // 分析正面反馈
    const positiveFeedbacks = feedbacks.filter(
      f => f.type === FeedbackType.EXPLICIT_LIKE || (f.rating && f.rating >= 4)
    );

    positiveFeedbacks.forEach(f => {
      const tags = f.tags || [];
      tags.forEach(tag => {
        strengths.set(tag, (strengths.get(tag) || 0) + 1);
      });

      // 分析评论中的关键词
      if (f.comment) {
        const keywords = ['好', '不错', '满意', '喜欢', '棒', '优秀'];
        keywords.forEach(keyword => {
          if (f.comment!.includes(keyword)) {
            strengths.set(keyword, (strengths.get(keyword) || 0) + 1);
          }
        });
      }
    });

    return Array.from(strengths.entries())
      .map(([strength, count]) => ({ strength, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  // ==================== 学习优化 ====================

  /**
   * 生成学习数据
   */
  generateLearningData(): LearningData {
    const recentFeedbacks = this.feedbacks.slice(-200);

    // 分析成功模式
    const successfulPatterns = this.identifySuccessfulPatterns(recentFeedbacks);

    // 分析失败模式
    const failedPatterns = this.identifyFailedPatterns(recentFeedbacks);

    // 提取用户偏好
    const userPreferences = this.extractUserPreferences(recentFeedbacks);

    return {
      successfulPatterns,
      failedPatterns,
      userPreferences
    };
  }

  /**
   * 识别成功模式
   */
  private identifySuccessfulPatterns(feedbacks: FeedbackData[]): LearningData['successfulPatterns'] {
    const patterns: Map<string, { success: number; total: number }> = new Map();

    feedbacks.forEach(f => {
      if (!f.context.agentType || !f.context.taskType) return;

      const key = `${f.context.agentType}-${f.context.taskType}`;
      const current = patterns.get(key) || { success: 0, total: 0 };

      current.total++;
      if (f.type === FeedbackType.EXPLICIT_LIKE || (f.rating && f.rating >= 4)) {
        current.success++;
      }

      patterns.set(key, current);
    });

    return Array.from(patterns.entries())
      .filter(([_, data]) => data.total >= 3) // 至少3次使用
      .map(([pattern, data]) => ({
        pattern,
        successRate: data.success / data.total,
        usageCount: data.total
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 10);
  }

  /**
   * 识别失败模式
   */
  private identifyFailedPatterns(feedbacks: FeedbackData[]): LearningData['failedPatterns'] {
    const patterns: Map<string, { failures: number; total: number; reasons: string[] }> = new Map();

    feedbacks.forEach(f => {
      if (!f.context.agentType || !f.context.taskType) return;

      const key = `${f.context.agentType}-${f.context.taskType}`;
      const current = patterns.get(key) || { failures: 0, total: 0, reasons: [] };

      current.total++;
      if (f.type === FeedbackType.EXPLICIT_DISLIKE || (f.rating && f.rating < 3)) {
        current.failures++;
        if (f.comment) current.reasons.push(f.comment);
      }

      patterns.set(key, current);
    });

    return Array.from(patterns.entries())
      .filter(([_, data]) => data.total >= 3 && data.failures / data.total > 0.3) // 失败率>30%
      .map(([pattern, data]) => ({
        pattern,
        failureRate: data.failures / data.total,
        commonReasons: data.reasons.slice(0, 5)
      }))
      .sort((a, b) => b.failureRate - a.failureRate)
      .slice(0, 5);
  }

  /**
   * 提取用户偏好
   */
  private extractUserPreferences(feedbacks: FeedbackData[]): LearningData['userPreferences'] {
    const preferences: Map<string, number> = new Map();

    feedbacks.forEach(f => {
      if (f.tags) {
        f.tags.forEach(tag => {
          const weight = f.type === FeedbackType.EXPLICIT_LIKE ? 1 : -0.5;
          preferences.set(tag, (preferences.get(tag) || 0) + weight);
        });
      }
    });

    return Array.from(preferences.entries())
      .map(([preference, strength]) => ({ preference, strength }))
      .sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength))
      .slice(0, 10);
  }

  /**
   * 生成优化建议
   */
  generateOptimizationSuggestions(): OptimizationSuggestion[] {
    const analysis = this.analyzeFeedback();
    const learningData = this.generateLearningData();
    const suggestions: OptimizationSuggestion[] = [];

    // 基于问题生成建议
    analysis.topIssues.forEach(issue => {
      suggestions.push({
        area: '用户体验',
        issue: issue.issue,
        suggestion: `改进${issue.issue}相关问题`,
        priority: issue.severity,
        expectedImpact: '提升用户满意度',
        implementation: '需要进一步分析具体场景'
      });
    });

    // 基于失败模式生成建议
    learningData.failedPatterns.forEach(pattern => {
      suggestions.push({
        area: '模型优化',
        issue: `${pattern.pattern} 失败率过高`,
        suggestion: '优化该场景下的Prompt或模型参数',
        priority: pattern.failureRate > 0.5 ? 'high' : 'medium',
        expectedImpact: '降低失败率，提升成功率',
        implementation: '收集更多失败案例进行微调'
      });
    });

    return suggestions;
  }

  // ==================== 辅助方法 ====================

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
      userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('agent-user-id', userId);
    }
    return userId;
  }

  /**
   * 获取反馈统计
   */
  getStats(): {
    total: number;
    byType: Record<string, number>;
    recent7Days: number;
  } {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const byType: Record<string, number> = {};
    this.feedbacks.forEach(f => {
      byType[f.type] = (byType[f.type] || 0) + 1;
    });

    return {
      total: this.feedbacks.length,
      byType,
      recent7Days: this.feedbacks.filter(f => f.timestamp > sevenDaysAgo).length
    };
  }

  /**
   * 导出反馈数据
   */
  exportFeedbacks(): string {
    return JSON.stringify(this.feedbacks, null, 2);
  }

  /**
   * 清除所有反馈
   */
  clearFeedbacks(): void {
    this.feedbacks = [];
    localStorage.removeItem(FEEDBACK_STORAGE_KEY);
  }
}

// 导出单例
let feedbackLoopInstance: FeedbackLoopService | null = null;

export function getFeedbackLoopService(): FeedbackLoopService {
  if (!feedbackLoopInstance) {
    feedbackLoopInstance = new FeedbackLoopService();
  }
  return feedbackLoopInstance;
}

export function resetFeedbackLoopService(): void {
  feedbackLoopInstance = null;
}
