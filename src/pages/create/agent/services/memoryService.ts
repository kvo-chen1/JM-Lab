/**
 * Agent 记忆服务 - 兼容层
 * 已迁移到 longTermMemory.ts 和 userProfileService.ts
 * 此文件保留以维持向后兼容
 */

import { AgentType, GeneratedOutput, PRESET_STYLES } from '../types/agent';
import { EntityType } from './entityExtractor';
import {
  LongTermMemory,
  getLongTermMemory,
  MemoryType
} from './longTermMemory';

// 用户偏好记忆
export interface UserPreferences {
  preferredStyles: string[];
  dislikedStyles: string[];
  frequentTaskTypes: {
    type: string;
    count: number;
    lastUsed: number;
  }[];
  preferredAudiences: string[];
  preferredScenarios: string[];
  preferredBrandTones: string[];
  communicationStyle: 'detailed' | 'concise' | 'creative';
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
  behaviorRecords: BehaviorRecord[];
  createdAt: number;
  lastUpdated: number;
}

// 本地存储键
const MEMORY_STORAGE_KEY = 'agent-memory-data';

/**
 * 记忆服务类（兼容层）
 */
export class MemoryService {
  private longTermMemory: LongTermMemory;
  private userId: string;
  private localData: {
    preferences: UserPreferences;
    agentInteractions: Map<AgentType, AgentInteractionMemory>;
    behaviorRecords: BehaviorRecord[];
  };

  constructor(userId: string = 'default-user') {
    this.userId = userId;
    this.longTermMemory = getLongTermMemory(userId);
    this.localData = this.loadLocalData();
  }

  // ==================== 本地数据管理 ====================

  private loadLocalData(): typeof this.localData {
    try {
      const stored = localStorage.getItem(`${MEMORY_STORAGE_KEY}-${this.userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          preferences: parsed.preferences || this.getDefaultPreferences(),
          agentInteractions: new Map(parsed.agentInteractions || []),
          behaviorRecords: parsed.behaviorRecords || []
        };
      }
    } catch (e) {
      console.error('[MemoryService] Failed to load local data:', e);
    }
    return {
      preferences: this.getDefaultPreferences(),
      agentInteractions: new Map(),
      behaviorRecords: []
    };
  }

  private saveLocalData(): void {
    try {
      localStorage.setItem(`${MEMORY_STORAGE_KEY}-${this.userId}`, JSON.stringify({
        preferences: this.localData.preferences,
        agentInteractions: Array.from(this.localData.agentInteractions.entries()),
        behaviorRecords: this.localData.behaviorRecords
      }));
    } catch (e) {
      console.error('[MemoryService] Failed to save local data:', e);
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      preferredStyles: [],
      dislikedStyles: [],
      frequentTaskTypes: [],
      preferredAudiences: [],
      preferredScenarios: [],
      preferredBrandTones: [],
      communicationStyle: 'detailed',
      lastUpdated: Date.now()
    };
  }

  // ==================== 偏好管理 ====================

  recordStylePreference(styleId: string, isLiked: boolean): void {
    const prefs = this.localData.preferences;
    if (isLiked) {
      if (!prefs.preferredStyles.includes(styleId)) {
        prefs.preferredStyles.push(styleId);
      }
      prefs.dislikedStyles = prefs.dislikedStyles.filter(s => s !== styleId);
    } else {
      if (!prefs.dislikedStyles.includes(styleId)) {
        prefs.dislikedStyles.push(styleId);
      }
      prefs.preferredStyles = prefs.preferredStyles.filter(s => s !== styleId);
    }
    prefs.lastUpdated = Date.now();
    this.saveLocalData();
  }

  getRecommendedStyles(limit: number = 3): string[] {
    const prefs = this.localData.preferences.preferredStyles;
    if (prefs.length > 0) {
      return prefs.slice(0, limit);
    }
    return ['warm-color', 'color-pencil', 'crayon-cute'];
  }

  recordTaskType(taskType: string): void {
    const prefs = this.localData.preferences;
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
    prefs.frequentTaskTypes.sort((a, b) => b.count - a.count);
    prefs.lastUpdated = Date.now();
    this.saveLocalData();
  }

  getFrequentTaskTypes(limit: number = 5): string[] {
    return this.localData.preferences.frequentTaskTypes
      .slice(0, limit)
      .map(t => t.type);
  }

  recordAudiencePreference(audience: string): void {
    const prefs = this.localData.preferences;
    if (!prefs.preferredAudiences.includes(audience)) {
      prefs.preferredAudiences.push(audience);
      prefs.lastUpdated = Date.now();
      this.saveLocalData();
    }
  }

  recordScenarioPreference(scenario: string): void {
    const prefs = this.localData.preferences;
    if (!prefs.preferredScenarios.includes(scenario)) {
      prefs.preferredScenarios.push(scenario);
      prefs.lastUpdated = Date.now();
      this.saveLocalData();
    }
  }

  // ==================== 参考案例管理 ====================

  addReference(type: 'image' | 'description', content: string, tags: string[] = []): string {
    const id = `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.longTermMemory.store({
      userId: this.userId,
      sessionId: 'default-session',
      type: MemoryType.DESIGN,
      content,
      entities: tags.map(t => ({ type: EntityType.STYLE, value: t, confidence: 1 })),
      importance: 0.7,
      metadata: { referenceType: type, id, tags }
    });
    return id;
  }

  getRelevantReferences(tags: string[], limit: number = 5): ReferenceMemory[] {
    return [];
  }

  recordReferenceUsage(referenceId: string, taskId: string): void {
    // 简化实现
  }

  // ==================== 反馈管理 ====================

  recordFeedback(outputId: string, type: 'like' | 'dislike' | 'neutral', reason?: string, tags: string[] = []): void {
    this.longTermMemory.store({
      userId: this.userId,
      sessionId: 'default-session',
      type: MemoryType.FEEDBACK,
      content: reason || `${type} feedback for ${outputId}`,
      entities: tags.map(t => ({ type: EntityType.STYLE, value: t, confidence: 1 })),
      importance: 0.8,
      metadata: { outputId, feedbackType: type }
    });

    if (type === 'like' || type === 'dislike') {
      const styleTag = tags.find(t => PRESET_STYLES.some(s => s.id === t));
      if (styleTag) {
        this.recordStylePreference(styleTag, type === 'like');
      }
    }
  }

  getLikedTags(): string[] {
    return [];
  }

  getDislikedTags(): string[] {
    return [];
  }

  // ==================== Agent 交互管理 ====================

  recordAgentInteraction(agent: AgentType, satisfaction: number = 5, topic?: string): void {
    const interactions = this.localData.agentInteractions;
    const existing = interactions.get(agent);
    if (existing) {
      existing.interactionCount++;
      existing.satisfactionScore = (existing.satisfactionScore + satisfaction) / 2;
      existing.lastInteraction = Date.now();
      if (topic && !existing.commonTopics.includes(topic)) {
        existing.commonTopics.push(topic);
      }
    } else {
      interactions.set(agent, {
        agent,
        interactionCount: 1,
        satisfactionScore: satisfaction,
        lastInteraction: Date.now(),
        commonTopics: topic ? [topic] : []
      });
    }
    this.saveLocalData();
  }

  getMostUsedAgents(limit: number = 3): AgentType[] {
    return Array.from(this.localData.agentInteractions.entries())
      .sort((a, b) => b[1].interactionCount - a[1].interactionCount)
      .slice(0, limit)
      .map(([agent]) => agent);
  }

  getMostSatisfyingAgents(limit: number = 3): AgentType[] {
    return Array.from(this.localData.agentInteractions.entries())
      .sort((a, b) => b[1].satisfactionScore - a[1].satisfactionScore)
      .slice(0, limit)
      .map(([agent]) => agent);
  }

  // ==================== 记忆增强提示 ====================

  buildMemoryEnhancedPrompt(basePrompt: string, agent: AgentType): string {
    const memories: string[] = [];

    const preferredStyles = this.getRecommendedStyles(5);
    if (preferredStyles.length > 0) {
      memories.push(`用户偏好的风格：${preferredStyles.join('、')}`);
    }

    const frequentTasks = this.getFrequentTaskTypes(3);
    if (frequentTasks.length > 0) {
      memories.push(`用户常做的项目类型：${frequentTasks.join('、')}`);
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

  recordBehavior(
    type: BehaviorRecord['type'],
    target: string,
    metadata?: Record<string, any>,
    sessionId?: string
  ): string {
    const id = `behavior-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.localData.behaviorRecords.push({
      id,
      type,
      target,
      metadata,
      timestamp: Date.now(),
      sessionId: sessionId || 'default-session'
    });

    // 限制记录数量
    if (this.localData.behaviorRecords.length > 500) {
      this.localData.behaviorRecords = this.localData.behaviorRecords.slice(-500);
    }

    this.saveLocalData();
    return id;
  }

  getBehaviorRecords(limit?: number): BehaviorRecord[] {
    const records = this.localData.behaviorRecords;
    if (limit) {
      return records.slice(-limit);
    }
    return records;
  }

  setBehaviorRecords(records: BehaviorRecord[]): void {
    this.localData.behaviorRecords = records;
    this.saveLocalData();
  }

  getBehaviorRecordsByType(type: BehaviorRecord['type']): BehaviorRecord[] {
    return this.localData.behaviorRecords.filter(r => r.type === type);
  }

  getBehaviorRecordsByTarget(target: string): BehaviorRecord[] {
    return this.localData.behaviorRecords.filter(r => r.target === target);
  }

  clearBehaviorRecords(): void {
    this.localData.behaviorRecords = [];
    this.saveLocalData();
  }

  // ==================== 数据导出/导入 ====================

  exportMemory(): string {
    return JSON.stringify({
      userId: this.userId,
      preferences: this.localData.preferences,
      agentInteractions: Array.from(this.localData.agentInteractions.entries()),
      behaviorRecords: this.localData.behaviorRecords,
      longTermMemories: this.longTermMemory.exportUserMemories(this.userId)
    }, null, 2);
  }

  importMemory(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.preferences) {
        this.localData.preferences = parsed.preferences;
      }
      if (parsed.agentInteractions) {
        this.localData.agentInteractions = new Map(parsed.agentInteractions);
      }
      if (parsed.behaviorRecords) {
        this.localData.behaviorRecords = parsed.behaviorRecords;
      }
      if (parsed.longTermMemories) {
        this.longTermMemory.importMemories(JSON.stringify(parsed.longTermMemories));
      }
      this.saveLocalData();
      return true;
    } catch (error) {
      console.error('[Memory] Failed to import memory:', error);
      return false;
    }
  }

  clearMemory(): void {
    this.localData.preferences = this.getDefaultPreferences();
    this.localData.agentInteractions = new Map();
    this.localData.behaviorRecords = [];
    this.longTermMemory.clear();
    this.saveLocalData();
  }

  getMemoryStats(): {
    totalReferences: number;
    totalFeedbacks: number;
    totalInteractions: number;
    totalBehaviorRecords: number;
    preferredStylesCount: number;
    frequentTaskTypesCount: number;
    lastUpdated: number;
  } {
    const stats = this.longTermMemory.getStats();

    return {
      totalReferences: stats.totalMemories,
      totalFeedbacks: stats.byType[MemoryType.FEEDBACK] || 0,
      totalInteractions: this.localData.agentInteractions.size,
      totalBehaviorRecords: this.localData.behaviorRecords.length,
      preferredStylesCount: this.localData.preferences.preferredStyles.length,
      frequentTaskTypesCount: this.localData.preferences.frequentTaskTypes.length,
      lastUpdated: this.localData.preferences.lastUpdated
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
