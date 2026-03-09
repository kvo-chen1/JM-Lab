// 向量存储服务 - 使用本地向量存储实现语义检索

import { callQwenChat } from '@/services/llm/chatProviders';

// 向量维度
const VECTOR_DIMENSION = 1536;

// 向量存储项
export interface VectorItem {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    type: 'design-case' | 'user-preference' | 'conversation' | 'reference';
    tags: string[];
    createdAt: number;
    [key: string]: any;
  };
}

// 相似度搜索结果
export interface SimilarityResult {
  item: VectorItem;
  score: number;
}

// 本地向量存储配置
const VECTOR_STORAGE_KEY = 'agent-vector-store';
const MAX_VECTORS = 500; // 最大向量数量

/**
 * 向量存储服务
 * 使用余弦相似度进行语义搜索
 */
export class VectorStore {
  private vectors: VectorItem[] = [];
  private initialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * 初始化存储
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const saved = localStorage.getItem(VECTOR_STORAGE_KEY);
      if (saved) {
        this.vectors = JSON.parse(saved);
        console.log(`[VectorStore] Loaded ${this.vectors.length} vectors`);
      }
    } catch (error) {
      console.error('[VectorStore] Failed to load:', error);
      this.vectors = [];
    }

    this.initialized = true;
  }

  /**
   * 保存到本地存储
   */
  private save(): void {
    try {
      localStorage.setItem(VECTOR_STORAGE_KEY, JSON.stringify(this.vectors));
    } catch (error) {
      console.error('[VectorStore] Failed to save:', error);
      // 如果存储失败，可能是容量限制，清理旧数据
      this.cleanupOldVectors();
    }
  }

  /**
   * 清理旧向量
   */
  private cleanupOldVectors(): void {
    // 保留最近的向量
    this.vectors = this.vectors.slice(-Math.floor(MAX_VECTORS * 0.8));
    try {
      localStorage.setItem(VECTOR_STORAGE_KEY, JSON.stringify(this.vectors));
    } catch (error) {
      console.error('[VectorStore] Still failed after cleanup:', error);
    }
  }

  /**
   * 生成文本的Embedding向量
   * 使用千问API或本地模拟
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // 尝试使用API生成embedding
      // 注意：这里使用千问API的模拟方式，实际项目中可以使用真实的embedding API
      const response = await callQwenChat({
        model: 'qwen-turbo',
        messages: [
          {
            role: 'system',
            content: `请将以下文本转换为${VECTOR_DIMENSION}维的语义向量表示。返回格式：JSON数组，包含${VECTOR_DIMENSION}个浮点数，范围[-1, 1]。只返回JSON数组，不要有其他内容。`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0,
        max_tokens: 2000
      });

      // 尝试解析返回的向量
      const vectorMatch = response.match(/\[[\s\S]*\]/);
      if (vectorMatch) {
        const vector = JSON.parse(vectorMatch[0]);
        if (Array.isArray(vector) && vector.length === VECTOR_DIMENSION) {
          return vector;
        }
      }

      // 如果API返回格式不正确，使用本地生成
      return this.generateLocalEmbedding(text);
    } catch (error) {
      console.warn('[VectorStore] API embedding failed, using local:', error);
      return this.generateLocalEmbedding(text);
    }
  }

  /**
   * 生成本地Embedding（基于词频的简化实现）
   * 作为API失败时的降级方案
   */
  private generateLocalEmbedding(text: string): number[] {
    // 简化的embedding生成：基于字符编码和词频
    const normalized = text.toLowerCase().trim();
    const vector: number[] = new Array(VECTOR_DIMENSION).fill(0);

    // 使用多个哈希函数生成向量
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);

      // 多个不同的哈希位置
      for (let j = 0; j < 8; j++) {
        const index = (char * (j + 1) + i * 31) % VECTOR_DIMENSION;
        vector[index] += Math.sin(char + j) * 0.1;
      }
    }

    // 归一化
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude > 0) {
      return vector.map(v => v / magnitude);
    }

    return vector;
  }

  /**
   * 添加向量到存储
   */
  async addVector(
    content: string,
    metadata: VectorItem['metadata'],
    id?: string
  ): Promise<string> {
    await this.initialize();

    const vectorId = id || `vec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 生成embedding
    const embedding = await this.generateEmbedding(content);

    const item: VectorItem = {
      id: vectorId,
      content,
      embedding,
      metadata: {
        ...metadata,
        createdAt: Date.now()
      }
    };

    // 检查是否已存在相同ID
    const existingIndex = this.vectors.findIndex(v => v.id === vectorId);
    if (existingIndex >= 0) {
      this.vectors[existingIndex] = item;
    } else {
      this.vectors.push(item);
    }

    // 限制数量
    if (this.vectors.length > MAX_VECTORS) {
      this.vectors = this.vectors.slice(-MAX_VECTORS);
    }

    this.save();
    console.log(`[VectorStore] Added vector: ${vectorId}`);

    return vectorId;
  }

  /**
   * 批量添加向量
   */
  async addVectors(
    items: { content: string; metadata: VectorItem['metadata']; id?: string }[]
  ): Promise<string[]> {
    const ids: string[] = [];

    for (const item of items) {
      const id = await this.addVector(item.content, item.metadata, item.id);
      ids.push(id);
    }

    return ids;
  }

  /**
   * 计算余弦相似度
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 语义相似度搜索
   */
  async searchSimilar(
    query: string,
    options?: {
      limit?: number;
      threshold?: number;
      filter?: (item: VectorItem) => boolean;
    }
  ): Promise<SimilarityResult[]> {
    await this.initialize();

    const limit = options?.limit || 5;
    const threshold = options?.threshold || 0.5;

    // 生成查询向量
    const queryEmbedding = await this.generateEmbedding(query);

    // 计算相似度
    const results: SimilarityResult[] = this.vectors
      .filter(item => !options?.filter || options.filter(item))
      .map(item => ({
        item,
        score: this.cosineSimilarity(queryEmbedding, item.embedding)
      }))
      .filter(result => result.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    console.log(`[VectorStore] Search found ${results.length} results`);
    return results;
  }

  /**
   * 基于向量ID搜索相似项
   */
  async searchSimilarById(
    vectorId: string,
    options?: {
      limit?: number;
      threshold?: number;
    }
  ): Promise<SimilarityResult[]> {
    const vector = this.vectors.find(v => v.id === vectorId);
    if (!vector) return [];

    const limit = options?.limit || 5;
    const threshold = options?.threshold || 0.5;

    const results: SimilarityResult[] = this.vectors
      .filter(v => v.id !== vectorId)
      .map(item => ({
        item,
        score: this.cosineSimilarity(vector.embedding, item.embedding)
      }))
      .filter(result => result.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  /**
   * 删除向量
   */
  deleteVector(id: string): boolean {
    const index = this.vectors.findIndex(v => v.id === id);
    if (index >= 0) {
      this.vectors.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  /**
   * 根据ID获取向量
   */
  getVector(id: string): VectorItem | undefined {
    return this.vectors.find(v => v.id === id);
  }

  /**
   * 根据类型获取向量
   */
  getVectorsByType(type: VectorItem['metadata']['type']): VectorItem[] {
    return this.vectors.filter(v => v.metadata.type === type);
  }

  /**
   * 根据标签搜索
   */
  getVectorsByTags(tags: string[]): VectorItem[] {
    return this.vectors.filter(v =>
      tags.some(tag => v.metadata.tags.includes(tag))
    );
  }

  /**
   * 更新向量元数据
   */
  updateMetadata(id: string, metadata: Partial<VectorItem['metadata']>): boolean {
    const vector = this.vectors.find(v => v.id === id);
    if (vector) {
      vector.metadata = { ...vector.metadata, ...metadata };
      this.save();
      return true;
    }
    return false;
  }

  /**
   * 获取存储统计
   */
  getStats(): {
    total: number;
    byType: Record<string, number>;
    oldestVector: number;
    newestVector: number;
  } {
    const byType: Record<string, number> = {};
    let oldest = Infinity;
    let newest = 0;

    this.vectors.forEach(v => {
      byType[v.metadata.type] = (byType[v.metadata.type] || 0) + 1;
      oldest = Math.min(oldest, v.metadata.createdAt);
      newest = Math.max(newest, v.metadata.createdAt);
    });

    return {
      total: this.vectors.length,
      byType,
      oldestVector: oldest === Infinity ? 0 : oldest,
      newestVector: newest
    };
  }

  /**
   * 清空存储
   */
  clear(): void {
    this.vectors = [];
    localStorage.removeItem(VECTOR_STORAGE_KEY);
    console.log('[VectorStore] Cleared all vectors');
  }

  /**
   * 导出数据
   */
  export(): string {
    return JSON.stringify(this.vectors, null, 2);
  }

  /**
   * 导入数据
   */
  import(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        this.vectors = parsed;
        this.save();
        console.log(`[VectorStore] Imported ${parsed.length} vectors`);
        return true;
      }
    } catch (error) {
      console.error('[VectorStore] Import failed:', error);
    }
    return false;
  }
}

// 导出单例实例
let vectorStoreInstance: VectorStore | null = null;

export function getVectorStore(): VectorStore {
  if (!vectorStoreInstance) {
    vectorStoreInstance = new VectorStore();
  }
  return vectorStoreInstance;
}

export function resetVectorStore(): void {
  vectorStoreInstance = null;
}
