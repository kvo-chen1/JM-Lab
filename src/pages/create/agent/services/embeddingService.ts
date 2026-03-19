/**
 * Embedding服务
 * 提供文本Embedding和向量相似度计算功能
 */

import { callQwenChat } from '@/services/llm/chatProviders';

// Embedding配置
interface EmbeddingConfig {
  dimension: number;
  model: string;
  cacheEnabled: boolean;
  cacheMaxSize: number;
}

// 默认配置
const DEFAULT_CONFIG: EmbeddingConfig = {
  dimension: 1536,  // 通义千问embedding维度
  model: 'text-embedding-v1',
  cacheEnabled: true,
  cacheMaxSize: 1000
};

// 缓存项
interface CacheItem {
  embedding: number[];
  timestamp: number;
  accessCount: number;
}

/**
 * Embedding服务类
 */
export class EmbeddingService {
  private config: EmbeddingConfig;
  private cache: Map<string, CacheItem> = new Map();
  private initialized = false;

  constructor(config?: Partial<EmbeddingConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('[EmbeddingService] Initializing...');
    
    // 从localStorage加载缓存（如果启用）
    if (this.config.cacheEnabled) {
      this.loadCacheFromStorage();
    }

    this.initialized = true;
    console.log('[EmbeddingService] Initialized successfully');
  }

  /**
   * 获取文本的Embedding向量
   * 优先使用缓存，否则调用API
   */
  async getEmbedding(text: string): Promise<number[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    // 文本预处理
    const normalizedText = this.normalizeText(text);
    
    // 检查缓存
    if (this.config.cacheEnabled) {
      const cached = this.cache.get(normalizedText);
      if (cached) {
        cached.accessCount++;
        cached.timestamp = Date.now();
        return [...cached.embedding];
      }
    }

    try {
      // 调用API获取Embedding
      const embedding = await this.fetchEmbeddingFromAPI(normalizedText);
      
      // 存入缓存
      if (this.config.cacheEnabled) {
        this.addToCache(normalizedText, embedding);
      }
      
      return embedding;
    } catch (error) {
      console.error('[EmbeddingService] Failed to get embedding:', error);
      // 降级到本地简单embedding
      return this.getLocalEmbedding(normalizedText);
    }
  }

  /**
   * 批量获取Embedding
   */
  async getEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.getEmbedding(text)));
  }

  /**
   * 计算两个向量的余弦相似度
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 计算欧氏距离
   */
  euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * 查找最相似的文本
   */
  async findMostSimilar(
    query: string,
    candidates: string[],
    topK: number = 5
  ): Promise<Array<{ text: string; similarity: number; index: number }>> {
    const queryEmbedding = await this.getEmbedding(query);
    const candidateEmbeddings = await this.getEmbeddings(candidates);

    const similarities = candidateEmbeddings.map((embedding, index) => ({
      text: candidates[index],
      similarity: this.cosineSimilarity(queryEmbedding, embedding),
      index
    }));

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * 语义搜索
   * 在文档集合中搜索与查询语义相关的内容
   */
  async semanticSearch(
    query: string,
    documents: Array<{ id: string; text: string; metadata?: any }>,
    threshold: number = 0.7,
    topK: number = 10
  ): Promise<Array<{ id: string; text: string; similarity: number; metadata?: any }>> {
    const queryEmbedding = await this.getEmbedding(query);
    
    const results = await Promise.all(
      documents.map(async doc => {
        const docEmbedding = await this.getEmbedding(doc.text);
        const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
        
        return {
          id: doc.id,
          text: doc.text,
          similarity,
          metadata: doc.metadata
        };
      })
    );

    return results
      .filter(r => r.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * 聚类相似文本
   */
  async clusterTexts(
    texts: string[],
    similarityThreshold: number = 0.8
  ): Promise<Array<{ clusterId: number; texts: string[]; center: number[] }>> {
    const embeddings = await this.getEmbeddings(texts);
    const clusters: Array<{ texts: string[]; center: number[] }> = [];
    const assigned = new Set<number>();

    for (let i = 0; i < texts.length; i++) {
      if (assigned.has(i)) continue;

      const cluster: string[] = [texts[i]];
      const clusterEmbeddings: number[][] = [embeddings[i]];
      assigned.add(i);

      for (let j = i + 1; j < texts.length; j++) {
        if (assigned.has(j)) continue;

        const similarity = this.cosineSimilarity(embeddings[i], embeddings[j]);
        if (similarity >= similarityThreshold) {
          cluster.push(texts[j]);
          clusterEmbeddings.push(embeddings[j]);
          assigned.add(j);
        }
      }

      // 计算聚类中心
      const center = this.calculateCenter(clusterEmbeddings);
      clusters.push({ texts: cluster, center });
    }

    return clusters.map((c, id) => ({ clusterId: id, ...c }));
  }

  /**
   * 从API获取Embedding
   */
  private async fetchEmbeddingFromAPI(text: string): Promise<number[]> {
    try {
      // 由于通义千问可能没有直接的embedding API，我们使用LLM来生成embedding
      // 实际项目中应该调用专门的embedding API
      const prompt = `请将以下文本转换为一个${this.config.dimension}维的数值向量表示（embedding），用于语义相似度计算。

文本："${text}"

请返回一个JSON数组，包含${this.config.dimension}个数值（范围-1到1），表示该文本的语义向量。
注意：请确保返回的是有效的JSON数组格式。`;

      const response = await callQwenChat({
        model: 'qwen3.5-plus',
        messages: [
          { 
            role: 'system', 
            content: '你是一个专业的文本 Embedding 生成器。将文本转换为数值向量表示。' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      // 尝试解析JSON数组
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const embedding = JSON.parse(jsonMatch[0]);
        if (Array.isArray(embedding) && embedding.length === this.config.dimension) {
          return embedding;
        }
      }

      // 如果解析失败，返回本地embedding
      console.warn('[EmbeddingService] API response parsing failed, using local embedding');
      return this.getLocalEmbedding(text);
    } catch (error) {
      console.error('[EmbeddingService] API call failed:', error);
      return this.getLocalEmbedding(text);
    }
  }

  /**
   * 本地简单Embedding（降级方案）
   * 基于词频和简单特征
   */
  private getLocalEmbedding(text: string): number[] {
    // 文本特征提取
    const features: number[] = [];
    
    // 1. 文本长度特征
    features.push(text.length / 100);
    
    // 2. 中文字符比例
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    features.push(chineseChars / text.length);
    
    // 3. 英文单词数量
    const englishWords = text.match(/[a-zA-Z]+/g) || [];
    features.push(englishWords.length / 10);
    
    // 4. 数字数量
    const numbers = text.match(/\d+/g) || [];
    features.push(numbers.length / 5);
    
    // 5. 标点符号数量
    const punctuations = (text.match(/[，。！？；：""''（）【】《》、,.!?;:'"()[\]{}]/g) || []).length;
    features.push(punctuations / 10);
    
    // 6. 关键词特征（设计领域）
    const designKeywords = [
      '设计', 'logo', '品牌', '包装', '海报', '插画', '动画', '风格',
      '颜色', '红色', '蓝色', '绿色', '可爱', '简约', '复古', '现代'
    ];
    
    for (const keyword of designKeywords) {
      features.push(text.toLowerCase().includes(keyword.toLowerCase()) ? 1 : 0);
    }
    
    // 填充到指定维度
    while (features.length < this.config.dimension) {
      features.push(0);
    }
    
    // 归一化
    const norm = Math.sqrt(features.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      return features.map(val => val / norm);
    }
    
    return features;
  }

  /**
   * 文本预处理
   */
  private normalizeText(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '');
  }

  /**
   * 添加到缓存
   */
  private addToCache(text: string, embedding: number[]): void {
    // 检查缓存大小
    if (this.cache.size >= this.config.cacheMaxSize) {
      this.evictLRU();
    }

    this.cache.set(text, {
      embedding: [...embedding],
      timestamp: Date.now(),
      accessCount: 1
    });

    // 定期保存到localStorage
    this.saveCacheToStorage();
  }

  /**
   * LRU淘汰策略
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, item] of this.cache) {
      // 综合考虑访问时间和访问频率
      const score = item.timestamp / (item.accessCount + 1);
      if (score < oldestTime) {
        oldestTime = score;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 从localStorage加载缓存
   */
  private loadCacheFromStorage(): void {
    try {
      const saved = localStorage.getItem('embedding_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        for (const [key, item] of Object.entries(parsed)) {
          this.cache.set(key, item as CacheItem);
        }
        console.log(`[EmbeddingService] Loaded ${this.cache.size} cached embeddings`);
      }
    } catch (error) {
      console.warn('[EmbeddingService] Failed to load cache:', error);
    }
  }

  /**
   * 保存缓存到localStorage
   */
  private saveCacheToStorage(): void {
    try {
      // 只保存最近使用的100条
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => b[1].timestamp - a[1].timestamp)
        .slice(0, 100);
      
      const toSave = Object.fromEntries(entries);
      localStorage.setItem('embedding_cache', JSON.stringify(toSave));
    } catch (error) {
      console.warn('[EmbeddingService] Failed to save cache:', error);
    }
  }

  /**
   * 计算聚类中心
   */
  private calculateCenter(embeddings: number[][]): number[] {
    if (embeddings.length === 0) {
      return new Array(this.config.dimension).fill(0);
    }

    const center = new Array(this.config.dimension).fill(0);
    
    for (const embedding of embeddings) {
      for (let i = 0; i < embedding.length; i++) {
        center[i] += embedding[i];
      }
    }

    for (let i = 0; i < center.length; i++) {
      center[i] /= embeddings.length;
    }

    return center;
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear();
    localStorage.removeItem('embedding_cache');
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.cacheMaxSize,
      hitRate: 0 // 需要额外统计
    };
  }
}

// 导出单例
let serviceInstance: EmbeddingService | null = null;

export function getEmbeddingService(): EmbeddingService {
  if (!serviceInstance) {
    serviceInstance = new EmbeddingService();
  }
  return serviceInstance;
}

export function resetEmbeddingService(): void {
  serviceInstance = null;
}
