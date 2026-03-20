/**
 * 反馈学习服务
 * 收集用户反馈并基于反馈优化Agent行为
 */

import { getUserProfileService } from './userProfileService';
import { getLongTermMemory, MemoryType } from './longTermMemory';
import { callQwenChat } from '@/services/llm/chatProviders';

// 反馈类型
export enum FeedbackType {
  THUMB_UP = 'THUMB_UP',       // 点赞
  THUMB_DOWN = 'THUMB_DOWN',   // 点踩
  RATING = 'RATING',           // 评分
  COMMENT = 'COMMENT',         // 评论
  CORRECTION = 'CORRECTION'    // 纠正
}

// 反馈项
export interface Feedback {
  id: string;
  userId: string;
  sessionId: string;
  messageId: string;
  type: FeedbackType;
  rating?: number;              // 1-5评分
  comment?: string;
  correction?: string;          // 用户提供的正确回答
  context: {
    userInput: string;
    agentResponse: string;
    intent?: string;
    entities?: string[];
  };
  timestamp: number;
  processed: boolean;
}

// 反馈统计
export interface FeedbackStats {
  totalFeedback: number;
  avgRating: number;
  thumbsUpRate: number;
  thumbsDownRate: number;
  byType: Record<FeedbackType, number>;
  trend: 'improving' | 'stable' | 'declining';
}

// 学习结果
export interface LearningResult {
  feedbackId: string;
  action: string;
  confidence: number;
  applied: boolean;
  timestamp: number;
}

/**
 * 反馈学习服务类
 */
export class FeedbackLearning {
  private feedbacks: Map<string, Feedback> = new Map();
  private userFeedbacks: Map<string, Set<string>> = new Map();
  private learningHistory: LearningResult[] = [];
  private profileService = getUserProfileService();
  private longTermMemory = getLongTermMemory();
  private initialized = false;

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('[FeedbackLearning] Initializing...');
    
    // 从localStorage加载反馈
    this.loadFromStorage();
    
    this.initialized = true;
    console.log(`[FeedbackLearning] Initialized with ${this.feedbacks.size} feedbacks`);
  }

  /**
   * 收集反馈
   */
  async collectFeedback(
    userId: string,
    sessionId: string,
    messageId: string,
    type: FeedbackType,
    data: {
      rating?: number;
      comment?: string;
      correction?: string;
    },
    context: Feedback['context']
  ): Promise<Feedback> {
    if (!this.initialized) {
      await this.initialize();
    }

    const feedback: Feedback = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      sessionId,
      messageId,
      type,
      rating: data.rating,
      comment: data.comment,
      correction: data.correction,
      context,
      timestamp: Date.now(),
      processed: false
    };

    // 存储反馈
    this.feedbacks.set(feedback.id, feedback);

    // 更新用户反馈索引
    if (!this.userFeedbacks.has(userId)) {
      this.userFeedbacks.set(userId, new Set());
    }
    this.userFeedbacks.get(userId)!.add(feedback.id);

    // 更新用户画像
    if (data.rating) {
      this.profileService.recordFeedback(userId, data.rating, data.comment);
    }

    // 存储到长期记忆
    await this.longTermMemory.store({
      userId,
      sessionId,
      type: MemoryType.FEEDBACK,
      content: `反馈: ${type}, 评分: ${data.rating || 'N/A'}, 评论: ${data.comment || 'N/A'}`,
      entities: [],
      importance: 0.8,
      metadata: { feedbackId: feedback.id }
    });

    // 立即处理反馈
    await this.processFeedback(feedback.id);

    // 持久化
    this.saveToStorage();

    return feedback;
  }

  /**
   * 处理反馈并学习
   */
  async processFeedback(feedbackId: string): Promise<LearningResult> {
    const feedback = this.feedbacks.get(feedbackId);
    if (!feedback || feedback.processed) {
      return {
        feedbackId,
        action: 'skipped',
        confidence: 0,
        applied: false,
        timestamp: Date.now()
      };
    }

    let result: LearningResult;

    switch (feedback.type) {
      case FeedbackType.THUMB_UP:
        result = await this.learnFromPositiveFeedback(feedback);
        break;
      case FeedbackType.THUMB_DOWN:
        result = await this.learnFromNegativeFeedback(feedback);
        break;
      case FeedbackType.RATING:
        result = await this.learnFromRating(feedback);
        break;
      case FeedbackType.CORRECTION:
        result = await this.learnFromCorrection(feedback);
        break;
      default:
        result = {
          feedbackId,
          action: 'stored',
          confidence: 0.5,
          applied: true,
          timestamp: Date.now()
        };
    }

    // 标记为已处理
    feedback.processed = true;
    this.feedbacks.set(feedbackId, feedback);

    // 记录学习历史
    this.learningHistory.push(result);

    return result;
  }

  /**
   * 从正面反馈学习
   */
  private async learnFromPositiveFeedback(feedback: Feedback): Promise<LearningResult> {
    // 强化当前的回复策略
    const { userInput, agentResponse } = feedback.context;

    // 存储成功的回复模式
    await this.longTermMemory.store({
      userId: feedback.userId,
      sessionId: feedback.sessionId,
      type: MemoryType.CONTEXT,
      content: `成功回复模式: 用户说"${userInput}", 回复"${agentResponse}"`,
      entities: [],
      importance: 0.7,
      metadata: { feedbackType: 'positive' }
    });

    return {
      feedbackId: feedback.id,
      action: 'reinforce_pattern',
      confidence: 0.8,
      applied: true,
      timestamp: Date.now()
    };
  }

  /**
   * 从负面反馈学习
   */
  private async learnFromNegativeFeedback(feedback: Feedback): Promise<LearningResult> {
    const { userInput, agentResponse } = feedback.context;

    // 分析失败原因
    const analysis = await this.analyzeFailure(userInput, agentResponse);

    // 存储需要避免的模式
    await this.longTermMemory.store({
      userId: feedback.userId,
      sessionId: feedback.sessionId,
      type: MemoryType.CONTEXT,
      content: `需要改进: 用户说"${userInput}", 但回复"${agentResponse}"不合适。原因: ${analysis.reason}`,
      entities: [],
      importance: 0.9,
      metadata: { feedbackType: 'negative', analysis }
    });

    return {
      feedbackId: feedback.id,
      action: 'avoid_pattern',
      confidence: analysis.confidence,
      applied: true,
      timestamp: Date.now()
    };
  }

  /**
   * 从评分学习
   */
  private async learnFromRating(feedback: Feedback): Promise<LearningResult> {
    const rating = feedback.rating || 3;

    if (rating >= 4) {
      // 高分，强化
      return await this.learnFromPositiveFeedback(feedback);
    } else if (rating <= 2) {
      // 低分，改进
      return await this.learnFromNegativeFeedback(feedback);
    }

    return {
      feedbackId: feedback.id,
      action: 'neutral_rating',
      confidence: 0.5,
      applied: true,
      timestamp: Date.now()
    };
  }

  /**
   * 从纠正学习
   */
  private async learnFromCorrection(feedback: Feedback): Promise<LearningResult> {
    const { userInput, agentResponse } = feedback.context;
    const correction = feedback.correction;

    if (!correction) {
      return {
        feedbackId: feedback.id,
        action: 'no_correction',
        confidence: 0,
        applied: false,
        timestamp: Date.now()
      };
    }

    // 存储纠正作为训练数据
    await this.longTermMemory.store({
      userId: feedback.userId,
      sessionId: feedback.sessionId,
      type: MemoryType.CONTEXT,
      content: `纠正示例: 用户说"${userInput}", 原回复"${agentResponse}", 应该是"${correction}"`,
      entities: [],
      importance: 0.95,
      metadata: { 
        feedbackType: 'correction',
        originalResponse: agentResponse,
        correctedResponse: correction
      }
    });

    return {
      feedbackId: feedback.id,
      action: 'learn_correction',
      confidence: 0.9,
      applied: true,
      timestamp: Date.now()
    };
  }

  /**
   * 分析失败原因
   */
  private async analyzeFailure(userInput: string, agentResponse: string): Promise<{
    reason: string;
    confidence: number;
  }> {
    try {
      const prompt = `分析以下Agent回复为什么不合适：

用户输入："${userInput}"
Agent回复："${agentResponse}"

请分析回复的问题，选择最可能的原因：
1. 理解错误 - 没有正确理解用户意图
2. 答非所问 - 回复与问题无关
3. 信息不足 - 没有提供足够的信息
4. 语气不当 - 语气不符合场景
5. 格式问题 - 回复格式不友好

返回JSON格式：
{
  "reason": "原因描述",
  "category": "上述分类之一",
  "confidence": 0-1之间的置信度
}`;

      const response = await callQwenChat({
        model: 'qwen3.5-plus-2026-02-15',
        messages: [
          { role: 'system', content: '你是一个反馈分析专家。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          reason: parsed.reason,
          confidence: parsed.confidence || 0.7
        };
      }
    } catch (error) {
      console.error('[FeedbackLearning] Analysis failed:', error);
    }

    return {
      reason: '未知原因',
      confidence: 0.5
    };
  }

  /**
   * 获取用户的反馈历史
   */
  getUserFeedbackHistory(userId: string, limit: number = 10): Feedback[] {
    const feedbackIds = this.userFeedbacks.get(userId);
    if (!feedbackIds) return [];

    return Array.from(feedbackIds)
      .map(id => this.feedbacks.get(id))
      .filter((f): f is Feedback => f !== undefined)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * 获取反馈统计
   */
  getFeedbackStats(userId?: string): FeedbackStats {
    let feedbacks: Feedback[];
    
    if (userId) {
      const feedbackIds = this.userFeedbacks.get(userId);
      feedbacks = feedbackIds 
        ? Array.from(feedbackIds).map(id => this.feedbacks.get(id)).filter((f): f is Feedback => f !== undefined)
        : [];
    } else {
      feedbacks = Array.from(this.feedbacks.values());
    }

    if (feedbacks.length === 0) {
      return {
        totalFeedback: 0,
        avgRating: 0,
        thumbsUpRate: 0,
        thumbsDownRate: 0,
        byType: {
          [FeedbackType.THUMB_UP]: 0,
          [FeedbackType.THUMB_DOWN]: 0,
          [FeedbackType.RATING]: 0,
          [FeedbackType.COMMENT]: 0,
          [FeedbackType.CORRECTION]: 0
        },
        trend: 'stable'
      };
    }

    // 计算统计
    const byType: Record<FeedbackType, number> = {
      [FeedbackType.THUMB_UP]: 0,
      [FeedbackType.THUMB_DOWN]: 0,
      [FeedbackType.RATING]: 0,
      [FeedbackType.COMMENT]: 0,
      [FeedbackType.CORRECTION]: 0
    };

    let totalRating = 0;
    let ratingCount = 0;

    for (const feedback of feedbacks) {
      byType[feedback.type]++;
      if (feedback.rating) {
        totalRating += feedback.rating;
        ratingCount++;
      }
    }

    const total = feedbacks.length;
    const recentFeedbacks = feedbacks.filter(f => f.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oldFeedbacks = feedbacks.filter(f => f.timestamp <= Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 计算趋势
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentFeedbacks.length > 5 && oldFeedbacks.length > 5) {
      const recentAvg = recentFeedbacks.reduce((sum, f) => sum + (f.rating || 3), 0) / recentFeedbacks.length;
      const oldAvg = oldFeedbacks.reduce((sum, f) => sum + (f.rating || 3), 0) / oldFeedbacks.length;
      
      if (recentAvg > oldAvg + 0.5) {
        trend = 'improving';
      } else if (recentAvg < oldAvg - 0.5) {
        trend = 'declining';
      }
    }

    return {
      totalFeedback: total,
      avgRating: ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : 0,
      thumbsUpRate: Math.round((byType[FeedbackType.THUMB_UP] / total) * 100) / 100,
      thumbsDownRate: Math.round((byType[FeedbackType.THUMB_DOWN] / total) * 100) / 100,
      byType,
      trend
    };
  }

  /**
   * 获取改进建议
   */
  async getImprovementSuggestions(userId?: string): Promise<string[]> {
    const feedbacks = userId 
      ? this.getUserFeedbackHistory(userId, 50)
      : Array.from(this.feedbacks.values()).slice(-50);

    const negativeFeedbacks = feedbacks.filter(f => 
      f.type === FeedbackType.THUMB_DOWN || 
      (f.rating && f.rating <= 2)
    );

    if (negativeFeedbacks.length === 0) {
      return ['当前表现良好，继续保持！'];
    }

    // 分析常见问题
    const issues = new Map<string, number>();
    for (const feedback of negativeFeedbacks) {
      const key = feedback.context.intent || 'unknown';
      issues.set(key, (issues.get(key) || 0) + 1);
    }

    // 生成建议
    const suggestions: string[] = [];
    
    const sortedIssues = Array.from(issues.entries()).sort((a, b) => b[1] - a[1]);
    for (const [issue, count] of sortedIssues.slice(0, 3)) {
      if (count >= 2) {
        suggestions.push(`在"${issue}"场景下需要改进（出现${count}次负面反馈）`);
      }
    }

    if (suggestions.length === 0) {
      suggestions.push('建议收集更多反馈以识别改进点');
    }

    return suggestions;
  }

  /**
   * 导出反馈数据
   */
  exportFeedbackData(): string {
    const data = {
      feedbacks: Array.from(this.feedbacks.values()),
      learningHistory: this.learningHistory,
      timestamp: Date.now()
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * 清空所有反馈
   */
  clear(): void {
    this.feedbacks.clear();
    this.userFeedbacks.clear();
    this.learningHistory = [];
    localStorage.removeItem('agent_feedback');
  }

  // ========== 私有方法 ==========

  private saveToStorage(): void {
    try {
      const data = {
        feedbacks: Array.from(this.feedbacks.entries()),
        learningHistory: this.learningHistory
      };
      localStorage.setItem('agent_feedback', JSON.stringify(data));
    } catch (error) {
      console.warn('[FeedbackLearning] Failed to save to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('agent_feedback');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.feedbacks) {
          for (const [id, feedback] of data.feedbacks) {
            this.feedbacks.set(id, feedback);
            
            // 重建索引
            if (!this.userFeedbacks.has(feedback.userId)) {
              this.userFeedbacks.set(feedback.userId, new Set());
            }
            this.userFeedbacks.get(feedback.userId)!.add(id);
          }
        }
        if (data.learningHistory) {
          this.learningHistory = data.learningHistory;
        }
      }
    } catch (error) {
      console.warn('[FeedbackLearning] Failed to load from storage:', error);
    }
  }
}

// 导出单例
let learningInstance: FeedbackLearning | null = null;

export function getFeedbackLearning(): FeedbackLearning {
  if (!learningInstance) {
    learningInstance = new FeedbackLearning();
  }
  return learningInstance;
}

export function resetFeedbackLearning(): void {
  learningInstance = null;
}
