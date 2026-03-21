/**
 * 长期记忆存储服务
 * 使用向量数据库存储对话记忆，支持语义检索
 */

import { getEmbeddingService } from './embeddingService';
import { Entity } from './entityExtractor';

// 记忆项
export interface Memory {
  id: string;
  userId: string;
  sessionId: string;
  type: MemoryType;
  content: string;
  entities: Entity[];
  embedding?: number[];
  importance: number;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  metadata?: Record<string, any>;
}

// 记忆类型
export enum MemoryType {
  CONVERSATION = 'CONVERSATION',   // 对话内容
  DECISION = 'DECISION',           // 决策记录
  PREFERENCE = 'PREFERENCE',       // 偏好设置
  FEEDBACK = 'FEEDBACK',           // 反馈记录
  DESIGN = 'DESIGN',               // 设计结果
  CONTEXT = 'CONTEXT'              // 上下文信息
}

// 记忆搜索选项
export interface MemorySearchOptions {
  userId?: string;
  sessionId?: string;
  types?: MemoryType[];
  startTime?: number;
  endTime?: number;
  minImportance?: number;
  limit?: number;
  threshold?: number;
}

// 记忆统计
export interface MemoryStats {
  totalMemories: number;
  byType: Record<MemoryType, number>;
  byUser: Record<string, number>;
  avgImportance: number;
  totalAccesses: number;
}

/**
 * 长期记忆存储服务类
 */
export class LongTermMemory {
  private memories: Map<string, Memory> = new Map();
  private userMemories: Map<string, Set<string>> = new Map();
  private sessionMemories: Map<string, Set<string>> = new Map();
  private embeddingService = getEmbeddingService();
  private maxMemories = 10000;
  private initialized = false;

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('[LongTermMemory] Initializing...');
    
    // 从localStorage加载记忆
    this.loadFromStorage();
    
    this.initialized = true;
    console.log(`[LongTermMemory] Initialized with ${this.memories.size} memories`);
  }

  /**
   * 存储记忆
   */
  async store(memory: Omit<Memory, 'id' | 'timestamp' | 'accessCount' | 'lastAccessed'>): Promise<Memory> {
    if (!this.initialized) {
      await this.initialize();
    }

    // 生成Embedding
    let embedding: number[] | undefined;
    try {
      embedding = await this.embeddingService.getEmbedding(memory.content);
    } catch (error) {
      console.warn('[LongTermMemory] Failed to generate embedding:', error);
    }

    const newMemory: Memory = {
      ...memory,
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      embedding
    };

    // 检查容量限制
    if (this.memories.size >= this.maxMemories) {
      this.evictLeastImportant();
    }

    // 存储记忆
    this.memories.set(newMemory.id, newMemory);

    // 更新索引
    this.updateIndexes(newMemory);

    // 持久化
    this.saveToStorage();

    return newMemory;
  }

  /**
   * 批量存储记忆
   */
  async storeBatch(memories: Omit<Memory, 'id' | 'timestamp' | 'accessCount' | 'lastAccessed'>[]): Promise<Memory[]> {
    const stored: Memory[] = [];
    for (const memory of memories) {
      stored.push(await this.store(memory));
    }
    return stored;
  }

  /**
   * 语义搜索记忆
   */
  async search(query: string, options: MemorySearchOptions = {}): Promise<Array<Memory & { similarity: number }>> {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      userId,
      sessionId,
      types,
      startTime,
      endTime,
      minImportance = 0,
      limit = 10,
      threshold = 0.7
    } = options;

    // 获取查询的Embedding
    const queryEmbedding = await this.embeddingService.getEmbedding(query);

    // 筛选候选记忆
    let candidates = Array.from(this.memories.values());

    // 应用过滤器
    if (userId) {
      const userMemoryIds = this.userMemories.get(userId);
      if (userMemoryIds) {
        candidates = candidates.filter(m => userMemoryIds.has(m.id));
      } else {
        return [];
      }
    }

    if (sessionId) {
      const sessionMemoryIds = this.sessionMemories.get(sessionId);
      if (sessionMemoryIds) {
        candidates = candidates.filter(m => sessionMemoryIds.has(m.id));
      }
    }

    if (types && types.length > 0) {
      candidates = candidates.filter(m => types.includes(m.type));
    }

    if (startTime) {
      candidates = candidates.filter(m => m.timestamp >= startTime);
    }

    if (endTime) {
      candidates = candidates.filter(m => m.timestamp <= endTime);
    }

    if (minImportance > 0) {
      candidates = candidates.filter(m => m.importance >= minImportance);
    }

    // 计算相似度
    const scored = candidates
      .filter(m => m.embedding) // 只考虑有Embedding的记忆
      .map(m => ({
        ...m,
        similarity: m.embedding 
          ? this.embeddingService.cosineSimilarity(queryEmbedding, m.embedding)
          : 0
      }));

    // 排序和过滤
    return scored
      .filter(m => m.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(m => {
        // 更新访问统计
        const memory = this.memories.get(m.id);
        if (memory) {
          memory.accessCount++;
          memory.lastAccessed = Date.now();
        }
        return m;
      });
  }

  /**
   * 获取用户的最近记忆
   */
  async getRecentMemories(
    userId: string,
    options: {
      types?: MemoryType[];
      limit?: number;
      hours?: number;
    } = {}
  ): Promise<Memory[]> {
    const { types, limit = 10, hours = 24 } = options;

    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;

    const userMemoryIds = this.userMemories.get(userId);
    if (!userMemoryIds) return [];

    let memories = Array.from(userMemoryIds)
      .map(id => this.memories.get(id))
      .filter((m): m is Memory => m !== undefined)
      .filter(m => m.timestamp >= cutoffTime);

    if (types && types.length > 0) {
      memories = memories.filter(m => types.includes(m.type));
    }

    return memories
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * 获取相关记忆（基于实体匹配）
   */
  async getRelatedMemories(
    userId: string,
    entities: Entity[],
    limit: number = 5
  ): Promise<Memory[]> {
    const userMemoryIds = this.userMemories.get(userId);
    if (!userMemoryIds || entities.length === 0) return [];

    const entityValues = new Set(entities.map(e => e.value.toLowerCase()));

    const scored = Array.from(userMemoryIds)
      .map(id => this.memories.get(id))
      .filter((m): m is Memory => m !== undefined)
      .map(m => {
        const matchCount = m.entities.filter(e => 
          entityValues.has(e.value.toLowerCase())
        ).length;
        return { memory: m, score: matchCount };
      })
      .filter(item => item.score > 0);

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.memory);
  }

  /**
   * 更新记忆重要性
   */
  updateImportance(memoryId: string, delta: number): void {
    const memory = this.memories.get(memoryId);
    if (memory) {
      memory.importance = Math.min(Math.max(memory.importance + delta, 0), 1);
      this.saveToStorage();
    }
  }

  /**
   * 删除记忆
   */
  delete(memoryId: string): boolean {
    const memory = this.memories.get(memoryId);
    if (!memory) return false;

    this.memories.delete(memoryId);

    // 更新索引
    const userMemories = this.userMemories.get(memory.userId);
    if (userMemories) {
      userMemories.delete(memoryId);
    }

    const sessionMemories = this.sessionMemories.get(memory.sessionId);
    if (sessionMemories) {
      sessionMemories.delete(memoryId);
    }

    this.saveToStorage();
    return true;
  }

  /**
   * 清理过期记忆
   */
  cleanup(maxAge: number = 30 * 24 * 60 * 60 * 1000): number {
    const cutoffTime = Date.now() - maxAge;
    let deletedCount = 0;

    for (const [id, memory] of this.memories) {
      if (memory.timestamp < cutoffTime && memory.importance < 0.5) {
        this.delete(id);
        deletedCount++;
      }
    }

    console.log(`[LongTermMemory] Cleaned up ${deletedCount} old memories`);
    return deletedCount;
  }

  /**
   * 获取统计信息
   */
  getStats(): MemoryStats {
    const stats: MemoryStats = {
      totalMemories: this.memories.size,
      byType: {
        [MemoryType.CONVERSATION]: 0,
        [MemoryType.DECISION]: 0,
        [MemoryType.PREFERENCE]: 0,
        [MemoryType.FEEDBACK]: 0,
        [MemoryType.DESIGN]: 0,
        [MemoryType.CONTEXT]: 0
      },
      byUser: {},
      avgImportance: 0,
      totalAccesses: 0
    };

    let totalImportance = 0;

    for (const memory of this.memories.values()) {
      stats.byType[memory.type]++;
      stats.byUser[memory.userId] = (stats.byUser[memory.userId] || 0) + 1;
      totalImportance += memory.importance;
      stats.totalAccesses += memory.accessCount;
    }

    stats.avgImportance = this.memories.size > 0 
      ? totalImportance / this.memories.size 
      : 0;

    return stats;
  }

  /**
   * 导出用户记忆
   */
  exportUserMemories(userId: string): string {
    const userMemoryIds = this.userMemories.get(userId);
    if (!userMemoryIds) return '[]';

    const memories = Array.from(userMemoryIds)
      .map(id => this.memories.get(id))
      .filter((m): m is Memory => m !== undefined);

    return JSON.stringify(memories, null, 2);
  }

  /**
   * 导入记忆
   */
  importMemories(json: string): number {
    try {
      const memories = JSON.parse(json) as Memory[];
      let imported = 0;

      for (const memory of memories) {
        if (!this.memories.has(memory.id)) {
          this.memories.set(memory.id, memory);
          this.updateIndexes(memory);
          imported++;
        }
      }

      this.saveToStorage();
      return imported;
    } catch (error) {
      console.error('[LongTermMemory] Failed to import memories:', error);
      return 0;
    }
  }

  /**
   * 清空所有记忆
   */
  clear(): void {
    this.memories.clear();
    this.userMemories.clear();
    this.sessionMemories.clear();
    localStorage.removeItem('agent_memories');
  }

  // ========== 私有方法 ==========

  private updateIndexes(memory: Memory): void {
    // 用户索引
    if (!this.userMemories.has(memory.userId)) {
      this.userMemories.set(memory.userId, new Set());
    }
    this.userMemories.get(memory.userId)!.add(memory.id);

    // 会话索引
    if (!this.sessionMemories.has(memory.sessionId)) {
      this.sessionMemories.set(memory.sessionId, new Set());
    }
    this.sessionMemories.get(memory.sessionId)!.add(memory.id);
  }

  private evictLeastImportant(): void {
    let leastImportant: Memory | null = null;
    let lowestScore = Infinity;

    for (const memory of this.memories.values()) {
      // 计算淘汰分数（重要性 + 访问频率 + 时间衰减）
      const timeDecay = (Date.now() - memory.lastAccessed) / (24 * 60 * 60 * 1000);
      const score = memory.importance * 0.5 + 
                   (memory.accessCount / 100) * 0.3 - 
                   timeDecay * 0.2;

      if (score < lowestScore) {
        lowestScore = score;
        leastImportant = memory;
      }
    }

    if (leastImportant) {
      this.delete(leastImportant.id);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        memories: Array.from(this.memories.entries()),
        timestamp: Date.now()
      };
      localStorage.setItem('agent_memories', JSON.stringify(data));
    } catch (error) {
      console.warn('[LongTermMemory] Failed to save to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('agent_memories');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.memories) {
          for (const [id, memory] of data.memories) {
            this.memories.set(id, memory);
            this.updateIndexes(memory);
          }
        }
      }
    } catch (error) {
      console.warn('[LongTermMemory] Failed to load from storage:', error);
    }
  }
}

// 导出单例
let memoryInstance: LongTermMemory | null = null;

export function getLongTermMemory(): LongTermMemory {
  if (!memoryInstance) {
    memoryInstance = new LongTermMemory();
  }
  return memoryInstance;
}

export function resetLongTermMemory(): void {
  memoryInstance = null;
}
