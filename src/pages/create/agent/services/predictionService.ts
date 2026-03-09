// 用户行为预测服务 - 基于历史行为预测用户需求

import { getMemoryService } from './memoryService';
import { getVectorStore } from './vectorStore';
import { AgentType } from '../types/agent';

// 行为类型
export enum BehaviorType {
  MESSAGE_SEND = 'message_send',
  STYLE_SELECT = 'style_select',
  IMAGE_GENERATE = 'image_generate',
  TASK_CREATE = 'task_create',
  AGENT_SWITCH = 'agent_switch',
  CONVERSATION_END = 'conversation_end',
  FEEDBACK_GIVE = 'feedback_give',
  REFERENCE_VIEW = 'reference_view'
}

// 行为记录
export interface BehaviorRecord {
  id: string;
  type: BehaviorType;
  timestamp: number;
  context: {
    agent?: AgentType;
    taskType?: string;
    style?: string;
    content?: string;
    [key: string]: any;
  };
  sessionId: string;
}

// 预测结果
export interface BehaviorPrediction {
  nextAction: BehaviorType;
  confidence: number;
  suggestions: {
    type: 'style' | 'agent' | 'task' | 'content';
    value: string;
    reason: string;
    confidence: number;
  }[];
  predictedTime: number; // 预计多久后会执行
}

// 用户画像
export interface UserProfile {
  preferredAgents: AgentType[];
  preferredStyles: string[];
  frequentTaskTypes: string[];
  activeHours: number[]; // 活跃时间段
  averageSessionDuration: number;
  designComplexity: 'simple' | 'medium' | 'complex';
  decisionSpeed: 'fast' | 'normal' | 'careful';
  lastUpdated: number;
}

// 趋势分析
export interface TrendAnalysis {
  trendingStyles: { style: string; growth: number }[];
  trendingTasks: { task: string; growth: number }[];
  seasonalPatterns: { period: string; preference: string }[];
}

// 存储键
const BEHAVIOR_STORAGE_KEY = 'agent-behavior-records';
const USER_PROFILE_KEY = 'agent-user-profile';
const MAX_BEHAVIOR_RECORDS = 1000;

/**
 * 用户行为预测服务
 */
export class PredictionService {
  private behaviors: BehaviorRecord[] = [];
  private userProfile: UserProfile | null = null;
  private vectorStore = getVectorStore();
  private memoryService = getMemoryService();

  constructor() {
    this.loadData();
  }

  /**
   * 加载数据
   */
  private loadData(): void {
    try {
      const savedBehaviors = localStorage.getItem(BEHAVIOR_STORAGE_KEY);
      if (savedBehaviors) {
        this.behaviors = JSON.parse(savedBehaviors);
      }

      const savedProfile = localStorage.getItem(USER_PROFILE_KEY);
      if (savedProfile) {
        this.userProfile = JSON.parse(savedProfile);
      }
    } catch (error) {
      console.error('[Prediction] Failed to load data:', error);
    }
  }

  /**
   * 保存数据
   */
  private saveData(): void {
    try {
      localStorage.setItem(BEHAVIOR_STORAGE_KEY, JSON.stringify(this.behaviors));
      if (this.userProfile) {
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(this.userProfile));
      }
    } catch (error) {
      console.error('[Prediction] Failed to save data:', error);
    }
  }

  /**
   * 记录用户行为
   */
  recordBehavior(
    type: BehaviorType,
    context: BehaviorRecord['context'] = {},
    sessionId?: string
  ): void {
    const record: BehaviorRecord = {
      id: `behavior-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      context,
      sessionId: sessionId || this.getCurrentSessionId()
    };

    this.behaviors.push(record);

    // 限制数量
    if (this.behaviors.length > MAX_BEHAVIOR_RECORDS) {
      this.behaviors = this.behaviors.slice(-MAX_BEHAVIOR_RECORDS);
    }

    this.saveData();
    this.updateUserProfile(record);

    console.log(`[Prediction] Recorded behavior: ${type}`);
  }

  /**
   * 获取当前会话ID
   */
  private getCurrentSessionId(): string {
    let sessionId = sessionStorage.getItem('agent-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('agent-session-id', sessionId);
    }
    return sessionId;
  }

  /**
   * 更新用户画像
   */
  private updateUserProfile(record: BehaviorRecord): void {
    if (!this.userProfile) {
      this.userProfile = {
        preferredAgents: [],
        preferredStyles: [],
        frequentTaskTypes: [],
        activeHours: [],
        averageSessionDuration: 0,
        designComplexity: 'medium',
        decisionSpeed: 'normal',
        lastUpdated: Date.now()
      };
    }

    // 更新偏好Agent
    if (record.context.agent && !this.userProfile.preferredAgents.includes(record.context.agent)) {
      this.userProfile.preferredAgents.push(record.context.agent);
      if (this.userProfile.preferredAgents.length > 5) {
        this.userProfile.preferredAgents.shift();
      }
    }

    // 更新偏好风格
    if (record.context.style && !this.userProfile.preferredStyles.includes(record.context.style)) {
      this.userProfile.preferredStyles.push(record.context.style);
      if (this.userProfile.preferredStyles.length > 5) {
        this.userProfile.preferredStyles.shift();
      }
    }

    // 更新任务类型
    if (record.context.taskType) {
      const existing = this.userProfile.frequentTaskTypes.find(t => 
        record.context.taskType && t.includes(record.context.taskType)
      );
      if (!existing) {
        this.userProfile.frequentTaskTypes.push(record.context.taskType);
        if (this.userProfile.frequentTaskTypes.length > 5) {
          this.userProfile.frequentTaskTypes.shift();
        }
      }
    }

    // 更新活跃时间
    const hour = new Date().getHours();
    if (!this.userProfile.activeHours.includes(hour)) {
      this.userProfile.activeHours.push(hour);
    }

    this.userProfile.lastUpdated = Date.now();
    this.saveData();
  }

  /**
   * 预测用户下一步行为
   */
  predictNextBehavior(currentContext?: {
    agent?: AgentType;
    taskType?: string;
    stage?: string;
  }): BehaviorPrediction {
    // 获取最近的行为
    const recentBehaviors = this.getRecentBehaviors(10);
    
    if (recentBehaviors.length === 0) {
      return this.getDefaultPrediction();
    }

    // 分析行为模式
    const patterns = this.analyzeBehaviorPatterns(recentBehaviors);
    
    // 基于模式预测
    const prediction = this.generatePrediction(patterns, currentContext);
    
    return prediction;
  }

  /**
   * 获取最近的行为记录
   */
  private getRecentBehaviors(count: number): BehaviorRecord[] {
    return this.behaviors.slice(-count);
  }

  /**
   * 分析行为模式
   */
  private analyzeBehaviorPatterns(behaviors: BehaviorRecord[]): {
    typeFrequency: Map<BehaviorType, number>;
    agentSequence: AgentType[];
    commonTransitions: Map<BehaviorType, BehaviorType[]>;
    averageTimeBetweenActions: number;
  } {
    const typeFrequency = new Map<BehaviorType, number>();
    const agentSequence: AgentType[] = [];
    const transitions = new Map<BehaviorType, BehaviorType[]>();
    let totalTimeGap = 0;
    let timeGapCount = 0;

    for (let i = 0; i < behaviors.length; i++) {
      const behavior = behaviors[i];
      
      // 统计频率
      typeFrequency.set(behavior.type, (typeFrequency.get(behavior.type) || 0) + 1);
      
      // 记录Agent序列
      if (behavior.context.agent && !agentSequence.includes(behavior.context.agent)) {
        agentSequence.push(behavior.context.agent);
      }
      
      // 记录转换
      if (i > 0) {
        const prevType = behaviors[i - 1].type;
        const currentTransitions = transitions.get(prevType) || [];
        currentTransitions.push(behavior.type);
        transitions.set(prevType, currentTransitions);
        
        // 计算时间间隔
        const timeGap = behavior.timestamp - behaviors[i - 1].timestamp;
        if (timeGap < 300000) { // 只计算5分钟内的间隔
          totalTimeGap += timeGap;
          timeGapCount++;
        }
      }
    }

    return {
      typeFrequency,
      agentSequence,
      commonTransitions: transitions,
      averageTimeBetweenActions: timeGapCount > 0 ? totalTimeGap / timeGapCount : 30000
    };
  }

  /**
   * 生成预测
   */
  private generatePrediction(
    patterns: ReturnType<typeof this.analyzeBehaviorPatterns>,
    currentContext?: { agent?: AgentType; taskType?: string; stage?: string }
  ): BehaviorPrediction {
    const suggestions: BehaviorPrediction['suggestions'] = [];
    let predictedAction: BehaviorType = BehaviorType.MESSAGE_SEND;
    let confidence = 0.5;

    // 基于频率预测
    const sortedTypes = Array.from(patterns.typeFrequency.entries())
      .sort((a, b) => b[1] - a[1]);
    
    if (sortedTypes.length > 0) {
      predictedAction = sortedTypes[0][0];
      confidence = Math.min(sortedTypes[0][1] / 10, 0.9);
    }

    // 基于当前上下文生成建议
    if (currentContext?.agent === 'director' && currentContext?.stage === 'collecting') {
      // 如果在需求收集阶段，预测下一步可能是风格选择
      if (this.userProfile?.preferredStyles.length > 0) {
        suggestions.push({
          type: 'style',
          value: this.userProfile.preferredStyles[0],
          reason: '根据您的历史偏好推荐',
          confidence: 0.8
        });
      }
      predictedAction = BehaviorType.STYLE_SELECT;
      confidence = 0.7;
    }

    // 基于Agent序列预测
    if (currentContext?.agent && patterns.agentSequence.length > 1) {
      const currentIndex = patterns.agentSequence.indexOf(currentContext.agent);
      if (currentIndex >= 0 && currentIndex < patterns.agentSequence.length - 1) {
        const nextAgent = patterns.agentSequence[currentIndex + 1];
        suggestions.push({
          type: 'agent',
          value: nextAgent,
          reason: '您通常在这个环节后会切换到该Agent',
          confidence: 0.75
        });
      }
    }

    // 基于用户画像生成建议
    if (this.userProfile) {
      // 推荐常用任务类型
      if (this.userProfile.frequentTaskTypes.length > 0) {
        suggestions.push({
          type: 'task',
          value: this.userProfile.frequentTaskTypes[0],
          reason: '这是您经常创建的任务类型',
          confidence: 0.7
        });
      }

      // 推荐偏好风格
      if (this.userProfile.preferredStyles.length > 0) {
        const style = this.userProfile.preferredStyles[0];
        if (!suggestions.find(s => s.type === 'style' && s.value === style)) {
          suggestions.push({
            type: 'style',
            value: style,
            reason: '您喜欢这个风格',
            confidence: 0.85
          });
        }
      }
    }

    // 计算预计时间
    const predictedTime = patterns.averageTimeBetweenActions;

    return {
      nextAction: predictedAction,
      confidence,
      suggestions: suggestions.slice(0, 3),
      predictedTime
    };
  }

  /**
   * 获取默认预测
   */
  private getDefaultPrediction(): BehaviorPrediction {
    return {
      nextAction: BehaviorType.MESSAGE_SEND,
      confidence: 0.3,
      suggestions: [
        {
          type: 'style',
          value: 'warm-color',
          reason: '大多数用户喜欢这个风格',
          confidence: 0.5
        }
      ],
      predictedTime: 30000
    };
  }

  /**
   * 分析趋势
   */
  analyzeTrends(): TrendAnalysis {
    const lastMonth = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentBehaviors = this.behaviors.filter(b => b.timestamp > lastMonth);

    // 分析风格趋势
    const styleCounts = new Map<string, number>();
    const taskCounts = new Map<string, number>();

    recentBehaviors.forEach(b => {
      if (b.context.style) {
        styleCounts.set(b.context.style, (styleCounts.get(b.context.style) || 0) + 1);
      }
      if (b.context.taskType) {
        taskCounts.set(b.context.taskType, (taskCounts.get(b.context.taskType) || 0) + 1);
      }
    });

    // 计算增长率（简化版）
    const trendingStyles = Array.from(styleCounts.entries())
      .map(([style, count]) => ({
        style,
        growth: count / Math.max(recentBehaviors.length / 10, 1)
      }))
      .sort((a, b) => b.growth - a.growth)
      .slice(0, 5);

    const trendingTasks = Array.from(taskCounts.entries())
      .map(([task, count]) => ({
        task,
        growth: count / Math.max(recentBehaviors.length / 10, 1)
      }))
      .sort((a, b) => b.growth - a.growth)
      .slice(0, 5);

    return {
      trendingStyles,
      trendingTasks,
      seasonalPatterns: [] // 可以进一步实现季节性分析
    };
  }

  /**
   * 获取用户画像
   */
  getUserProfile(): UserProfile | null {
    return this.userProfile;
  }

  /**
   * 获取行为统计
   */
  getBehaviorStats(): {
    totalBehaviors: number;
    uniqueSessions: number;
    averageBehaviorsPerSession: number;
    mostActiveHour: number | null;
  } {
    const uniqueSessions = new Set(this.behaviors.map(b => b.sessionId)).size;
    const hourCounts = new Map<number, number>();
    
    this.behaviors.forEach(b => {
      const hour = new Date(b.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    const mostActiveHour = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      totalBehaviors: this.behaviors.length,
      uniqueSessions,
      averageBehaviorsPerSession: uniqueSessions > 0 ? this.behaviors.length / uniqueSessions : 0,
      mostActiveHour
    };
  }

  /**
   * 清除所有数据
   */
  clearData(): void {
    this.behaviors = [];
    this.userProfile = null;
    localStorage.removeItem(BEHAVIOR_STORAGE_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
  }
}

// 导出单例
let predictionServiceInstance: PredictionService | null = null;

export function getPredictionService(): PredictionService {
  if (!predictionServiceInstance) {
    predictionServiceInstance = new PredictionService();
  }
  return predictionServiceInstance;
}

export function resetPredictionService(): void {
  predictionServiceInstance = null;
}
