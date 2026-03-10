// Agent 记忆服务 - 管理用户偏好和跨会话记忆

import { AgentType, GeneratedOutput, PRESET_STYLES } from '../types/agent';

// 用户偏好记忆
export interface UserPreferences {
  // 风格偏好
  preferredStyles: string[];
  dislikedStyles: string[];

  // 常用需求类型
  frequentTaskTypes: {
    type: string;
    count: number;
    lastUsed: number;
  }[];

  // 目标受众偏好
  preferredAudiences: string[];

  // 使用场景偏好
  preferredScenarios: string[];

  // 品牌调性偏好
  preferredBrandTones: string[];

  // 沟通偏好
  communicationStyle: 'detailed' | 'concise' | 'creative';

  // 上次更新时间
  lastUpdated: number;
}

// 参考案例记忆
export interface ReferenceMemory {
  id: string;
  type: 'image' | 'description';
  content: string;
  tags: string[];
  usedInTasks: string[];
  createdAt: number;
  lastUsed: number;
}

// 用户反馈记忆
export interface FeedbackMemory {
  id: string;
  outputId: string;
  type: 'like' | 'dislike' | 'neutral';
  reason?: string;
  tags: string[];
  createdAt: number;
}

// Agent 交互记忆
export interface AgentInteractionMemory {
  agent: AgentType;
  interactionCount: number;
  satisfactionScore: number;
  lastInteraction: number;
  commonTopics: string[];
}

// 行为记录类型
export interface BehaviorRecord {
  id: string;
  type: 'click' | 'view' | 'scroll' | 'input' | 'hover' | 'action';
  target: string;
  metadata?: Record<string, any>;
  timestamp: number;
  sessionId: string;
}

// 完整记忆数据
export interface AgentMemory {
  userId: string;
  preferences: UserPreferences;
  references: ReferenceMemory[];
  feedbacks: FeedbackMemory[];
  agentInteractions: Map<AgentType, AgentInteractionMemory>;
  behaviorRecords: BehaviorRecord[]; // 新增：行为记录
  createdAt: number;
  lastUpdated: number;
}

// 记忆存储键
const MEMORY_STORAGE_KEY = 'agent-memory';
const MAX_REFERENCES = 50;
const MAX_FEEDBACKS = 100;
const MAX_BEHAVIOR_RECORDS = 500; // 新增：行为记录最大数量

/**
 * 记忆服务类
 */
export class MemoryService {
  private memory: AgentMemory;
  private userId: string;

  constructor(userId: string = 'default-user') {
    this.userId = userId;
    this.memory = this.loadMemory();
  }

  /**
   * 从本地存储加载记忆
   */
  private loadMemory(): AgentMemory {
    try {
      const saved = localStorage.getItem(`${MEMORY_STORAGE_KEY}-${this.userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // 恢复 Map 结构
        if (parsed.agentInteractions) {
          parsed.agentInteractions = new Map(Object.entries(parsed.agentInteractions));
        }
        return {
          ...this.getDefaultMemory(),
          ...parsed,
          userId: this.userId
        };
      }
    } catch (error) {
      console.error('[Memory] Failed to load memory:', error);
    }
    return this.getDefaultMemory();
  }

  /**
   * 获取默认记忆结构
   */
  private getDefaultMemory(): AgentMemory {
    return {
      userId: this.userId,
      preferences: {
        preferredStyles: [],
        dislikedStyles: [],
        frequentTaskTypes: [],
        preferredAudiences: [],
        preferredScenarios: [],
        preferredBrandTones: [],
        communicationStyle: 'detailed',
        lastUpdated: Date.now()
      },
      references: [],
      feedbacks: [],
      agentInteractions: new Map(),
      behaviorRecords: [], // 新增：初始化行为记录数组
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };
  }

  /**
   * 保存记忆到本地存储
   */
  private saveMemory(): void {
    try {
      // 将 Map 转换为普通对象以便序列化
      const memoryToSave = {
        ...this.memory,
        agentInteractions: Object.fromEntries(this.memory.agentInteractions)
      };
      localStorage.setItem(`${MEMORY_STORAGE_KEY}-${this.userId}`, JSON.stringify(memoryToSave));
    } catch (error) {
      console.error('[Memory] Failed to save memory:', error);
    }
  }

  // ==================== 偏好管理 ====================

  /**
   * 记录风格偏好
   */
  recordStylePreference(styleId: string, isLiked: boolean): void {
    const prefs = this.memory.preferences;

    if (isLiked) {
      if (!prefs.preferredStyles.includes(styleId)) {
        prefs.preferredStyles.push(styleId);
      }
      // 从不喜欢列表中移除
      prefs.dislikedStyles = prefs.dislikedStyles.filter(s => s !== styleId);
    } else {
      if (!prefs.dislikedStyles.includes(styleId)) {
        prefs.dislikedStyles.push(styleId);
      }
      // 从喜欢列表中移除
      prefs.preferredStyles = prefs.preferredStyles.filter(s => s !== styleId);
    }

    prefs.lastUpdated = Date.now();
    this.memory.lastUpdated = Date.now();
    this.saveMemory();
  }

  /**
   * 获取推荐风格
   */
  getRecommendedStyles(limit: number = 3): string[] {
    const prefs = this.memory.preferences;

    // 优先返回用户喜欢的风格
    if (prefs.preferredStyles.length > 0) {
      return prefs.preferredStyles.slice(0, limit);
    }

    // 如果没有明确偏好，根据任务历史推断
    const taskTypes = prefs.frequentTaskTypes;
    if (taskTypes.length > 0) {
      const mostFrequent = taskTypes[0].type.toLowerCase();

      if (mostFrequent.includes('ip') || mostFrequent.includes('角色')) {
        return ['crayon-cute', 'warm-color', 'color-pencil'];
      }
      if (mostFrequent.includes('品牌')) {
        return ['warm-color', 'dreamy-pastel', 'color-pencil'];
      }
      if (mostFrequent.includes('包装')) {
        return ['warm-color', 'grainy-cute', 'fantasy-picture-book'];
      }
    }

    // 默认推荐
    return ['warm-color', 'color-pencil', 'crayon-cute'];
  }

  /**
   * 记录任务类型
   */
  recordTaskType(taskType: string): void {
    const prefs = this.memory.preferences;
    const existing = prefs.frequentTaskTypes.find(t => t.type === taskType);

    if (existing) {
      existing.count++;
      existing.lastUsed = Date.now();
    } else {
      prefs.frequentTaskTypes.push({
        type: taskType,
        count: 1,
        lastUsed: Date.now()
      });
    }

    // 按使用次数排序
    prefs.frequentTaskTypes.sort((a, b) => b.count - a.count);

    prefs.lastUpdated = Date.now();
    this.memory.lastUpdated = Date.now();
    this.saveMemory();
  }

  /**
   * 获取常用任务类型
   */
  getFrequentTaskTypes(limit: number = 5): string[] {
    return this.memory.preferences.frequentTaskTypes
      .slice(0, limit)
      .map(t => t.type);
  }

  /**
   * 记录受众偏好
   */
  recordAudiencePreference(audience: string): void {
    const prefs = this.memory.preferences;
    if (!prefs.preferredAudiences.includes(audience)) {
      prefs.preferredAudiences.push(audience);
      // 限制数量
      if (prefs.preferredAudiences.length > 10) {
        prefs.preferredAudiences.shift();
      }
    }
    prefs.lastUpdated = Date.now();
    this.memory.lastUpdated = Date.now();
    this.saveMemory();
  }

  /**
   * 记录场景偏好
   */
  recordScenarioPreference(scenario: string): void {
    const prefs = this.memory.preferences;
    if (!prefs.preferredScenarios.includes(scenario)) {
      prefs.preferredScenarios.push(scenario);
      if (prefs.preferredScenarios.length > 10) {
        prefs.preferredScenarios.shift();
      }
    }
    prefs.lastUpdated = Date.now();
    this.memory.lastUpdated = Date.now();
    this.saveMemory();
  }

  // ==================== 参考案例管理 ====================

  /**
   * 添加参考案例
   */
  addReference(type: 'image' | 'description', content: string, tags: string[] = []): string {
    const id = `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const reference: ReferenceMemory = {
      id,
      type,
      content,
      tags,
      usedInTasks: [],
      createdAt: Date.now(),
      lastUsed: Date.now()
    };

    this.memory.references.push(reference);

    // 限制数量，移除最旧的
    if (this.memory.references.length > MAX_REFERENCES) {
      this.memory.references.shift();
    }

    this.memory.lastUpdated = Date.now();
    this.saveMemory();

    return id;
  }

  /**
   * 获取相关参考案例
   */
  getRelevantReferences(tags: string[], limit: number = 5): ReferenceMemory[] {
    return this.memory.references
      .filter(ref => ref.tags.some(tag => tags.includes(tag)))
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, limit);
  }

  /**
   * 记录参考案例使用
   */
  recordReferenceUsage(referenceId: string, taskId: string): void {
    const ref = this.memory.references.find(r => r.id === referenceId);
    if (ref) {
      if (!ref.usedInTasks.includes(taskId)) {
        ref.usedInTasks.push(taskId);
      }
      ref.lastUsed = Date.now();
      this.saveMemory();
    }
  }

  // ==================== 反馈管理 ====================

  /**
   * 记录用户反馈
   */
  recordFeedback(outputId: string, type: 'like' | 'dislike' | 'neutral', reason?: string, tags: string[] = []): void {
    const id = `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const feedback: FeedbackMemory = {
      id,
      outputId,
      type,
      reason,
      tags,
      createdAt: Date.now()
    };

    this.memory.feedbacks.push(feedback);

    // 限制数量
    if (this.memory.feedbacks.length > MAX_FEEDBACKS) {
      this.memory.feedbacks.shift();
    }

    // 如果是风格相关的反馈，更新风格偏好
    if (type === 'like' || type === 'dislike') {
      const styleTag = tags.find(t => PRESET_STYLES.some(s => s.id === t));
      if (styleTag) {
        this.recordStylePreference(styleTag, type === 'like');
      }
    }

    this.memory.lastUpdated = Date.now();
    this.saveMemory();
  }

  /**
   * 获取用户喜欢的元素标签
   */
  getLikedTags(): string[] {
    return this.memory.feedbacks
      .filter(f => f.type === 'like')
      .flatMap(f => f.tags);
  }

  /**
   * 获取用户不喜欢的元素标签
   */
  getDislikedTags(): string[] {
    return this.memory.feedbacks
      .filter(f => f.type === 'dislike')
      .flatMap(f => f.tags);
  }

  // ==================== Agent 交互管理 ====================

  /**
   * 记录 Agent 交互
   */
  recordAgentInteraction(agent: AgentType, satisfaction: number = 5, topic?: string): void {
    let interaction = this.memory.agentInteractions.get(agent);

    if (!interaction) {
      interaction = {
        agent,
        interactionCount: 0,
        satisfactionScore: 0,
        lastInteraction: 0,
        commonTopics: []
      };
      this.memory.agentInteractions.set(agent, interaction);
    }

    interaction.interactionCount++;
    interaction.satisfactionScore = (interaction.satisfactionScore * (interaction.interactionCount - 1) + satisfaction) / interaction.interactionCount;
    interaction.lastInteraction = Date.now();

    if (topic && !interaction.commonTopics.includes(topic)) {
      interaction.commonTopics.push(topic);
      if (interaction.commonTopics.length > 10) {
        interaction.commonTopics.shift();
      }
    }

    this.memory.lastUpdated = Date.now();
    this.saveMemory();
  }

  /**
   * 获取最常用的 Agent
   */
  getMostUsedAgents(limit: number = 3): AgentType[] {
    return Array.from(this.memory.agentInteractions.entries())
      .sort((a, b) => b[1].interactionCount - a[1].interactionCount)
      .slice(0, limit)
      .map(([agent]) => agent);
  }

  /**
   * 获取满意度最高的 Agent
   */
  getMostSatisfyingAgents(limit: number = 3): AgentType[] {
    return Array.from(this.memory.agentInteractions.entries())
      .filter(([_, interaction]) => interaction.interactionCount >= 3)
      .sort((a, b) => b[1].satisfactionScore - a[1].satisfactionScore)
      .slice(0, limit)
      .map(([agent]) => agent);
  }

  // ==================== 记忆增强提示 ====================

  /**
   * 构建记忆增强的系统提示
   */
  buildMemoryEnhancedPrompt(basePrompt: string, agent: AgentType): string {
    const memories: string[] = [];

    // 添加风格偏好记忆
    const preferredStyles = this.memory.preferences.preferredStyles;
    if (preferredStyles.length > 0) {
      const styleNames = preferredStyles
        .map(id => PRESET_STYLES.find(s => s.id === id)?.name)
        .filter(Boolean)
        .join('、');
      memories.push(`用户偏好的风格：${styleNames}`);
    }

    // 添加常用任务类型记忆
    const frequentTasks = this.getFrequentTaskTypes(3);
    if (frequentTasks.length > 0) {
      memories.push(`用户常做的项目类型：${frequentTasks.join('、')}`);
    }

    // 添加受众偏好记忆
    const audiences = this.memory.preferences.preferredAudiences;
    if (audiences.length > 0) {
      memories.push(`用户常面向的受众：${audiences.slice(-3).join('、')}`);
    }

    // 添加 Agent 交互记忆
    const agentInteraction = this.memory.agentInteractions.get(agent);
    if (agentInteraction && agentInteraction.interactionCount > 0) {
      memories.push(`与该用户的交互次数：${agentInteraction.interactionCount}次`);
    }

    // 添加喜欢的元素
    const likedTags = this.getLikedTags().slice(0, 5);
    if (likedTags.length > 0) {
      memories.push(`用户喜欢的元素：${likedTags.join('、')}`);
    }

    // 添加不喜欢的元素
    const dislikedTags = this.getDislikedTags().slice(0, 5);
    if (dislikedTags.length > 0) {
      memories.push(`用户不喜欢的元素：${dislikedTags.join('、')}`);
    }

    if (memories.length === 0) {
      return basePrompt;
    }

    return `${basePrompt}

## 用户历史偏好（请作为参考，但不要直接提及）
${memories.map(m => `- ${m}`).join('\n')}

请根据以上偏好信息，提供更个性化的服务。`;
  }

  // ==================== 行为记录管理 ====================

  /**
   * 记录用户行为
   */
  recordBehavior(
    type: BehaviorRecord['type'],
    target: string,
    metadata?: Record<string, any>,
    sessionId?: string
  ): string {
    const id = `behavior-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const record: BehaviorRecord = {
      id,
      type,
      target,
      metadata,
      timestamp: Date.now(),
      sessionId: sessionId || this.getCurrentSessionId()
    };

    this.memory.behaviorRecords.push(record);

    // 限制数量，移除最旧的
    if (this.memory.behaviorRecords.length > MAX_BEHAVIOR_RECORDS) {
      this.memory.behaviorRecords.shift();
    }

    this.memory.lastUpdated = Date.now();
    this.saveMemory();

    return id;
  }

  /**
   * 获取行为记录
   */
  getBehaviorRecords(limit?: number): BehaviorRecord[] {
    const records = [...this.memory.behaviorRecords];
    if (limit) {
      return records.slice(-limit);
    }
    return records;
  }

  /**
   * 设置行为记录（用于资源管理器清理）
   */
  setBehaviorRecords(records: BehaviorRecord[]): void {
    this.memory.behaviorRecords = records;
    this.memory.lastUpdated = Date.now();
    this.saveMemory();
  }

  /**
   * 获取特定类型的行为记录
   */
  getBehaviorRecordsByType(type: BehaviorRecord['type']): BehaviorRecord[] {
    return this.memory.behaviorRecords.filter(r => r.type === type);
  }

  /**
   * 获取特定目标的行为记录
   */
  getBehaviorRecordsByTarget(target: string): BehaviorRecord[] {
    return this.memory.behaviorRecords.filter(r => r.target === target);
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
   * 清除行为记录
   */
  clearBehaviorRecords(): void {
    this.memory.behaviorRecords = [];
    this.memory.lastUpdated = Date.now();
    this.saveMemory();
  }

  // ==================== 数据导出/导入 ====================

  /**
   * 导出记忆数据
   */
  exportMemory(): string {
    return JSON.stringify({
      ...this.memory,
      agentInteractions: Object.fromEntries(this.memory.agentInteractions)
    }, null, 2);
  }

  /**
   * 导入记忆数据
   */
  importMemory(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.agentInteractions) {
        parsed.agentInteractions = new Map(Object.entries(parsed.agentInteractions));
      }
      this.memory = {
        ...this.getDefaultMemory(),
        ...parsed,
        userId: this.userId
      };
      this.saveMemory();
      return true;
    } catch (error) {
      console.error('[Memory] Failed to import memory:', error);
      return false;
    }
  }

  /**
   * 清除所有记忆
   */
  clearMemory(): void {
    this.memory = this.getDefaultMemory();
    localStorage.removeItem(`${MEMORY_STORAGE_KEY}-${this.userId}`);
  }

  /**
   * 获取记忆统计
   */
  getMemoryStats(): {
    totalReferences: number;
    totalFeedbacks: number;
    totalInteractions: number;
    totalBehaviorRecords: number; // 新增：行为记录数量
    preferredStylesCount: number;
    frequentTaskTypesCount: number;
    lastUpdated: number;
  } {
    return {
      totalReferences: this.memory.references.length,
      totalFeedbacks: this.memory.feedbacks.length,
      totalInteractions: Array.from(this.memory.agentInteractions.values())
        .reduce((sum, i) => sum + i.interactionCount, 0),
      totalBehaviorRecords: this.memory.behaviorRecords.length, // 新增
      preferredStylesCount: this.memory.preferences.preferredStyles.length,
      frequentTaskTypesCount: this.memory.preferences.frequentTaskTypes.length,
      lastUpdated: this.memory.lastUpdated
    };
  }
}

// 导出单例实例
let memoryServiceInstance: MemoryService | null = null;

export function getMemoryService(userId?: string): MemoryService {
  if (!memoryServiceInstance || (userId && memoryServiceInstance['userId'] !== userId)) {
    memoryServiceInstance = new MemoryService(userId);
  }
  return memoryServiceInstance;
}

export function resetMemoryService(): void {
  memoryServiceInstance = null;
}
