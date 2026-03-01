/**
 * 多样性重排序服务
 * 实现MMR(Maximal Marginal Relevance)算法，平衡推荐相关性和多样性
 * 
 * MMR公式：MMR = λ * Relevance - (1-λ) * max(Similarity)
 * 其中λ是平衡参数，控制相关性和多样性的权重
 */

import { RecommendedItem } from './recommendationService';

// ============================================
// 类型定义
// ============================================

/**
 * MMR配置选项
 */
export interface MMRConfig {
  lambda: number;              // 平衡参数 (0-1)，越大越注重相关性
  maxResults: number;          // 最大返回结果数
  similarityThreshold: number; // 相似度阈值，低于此值认为不相似
}

/**
 * 内容特征向量（用于计算相似度）
 */
export interface ContentVector {
  id: string;
  category?: string;
  tags?: string[];
  authorId?: string;
  theme?: string;
  embedding?: number[];        // 可选的向量嵌入
}

/**
 * MMR排序结果
 */
export interface MMRResult {
  items: RecommendedItem[];
  diversityScore: number;      // 多样性分数
  relevanceScore: number;      // 相关性分数
  mmrScore: number;            // 综合MMR分数
}

// ============================================
// MMR多样性重排序引擎
// ============================================

class DiversityRerankService {
  // 默认配置
  private defaultConfig: MMRConfig = {
    lambda: 0.7,               // 70%相关性，30%多样性
    maxResults: 20,
    similarityThreshold: 0.5
  };

  /**
   * MMR重排序主函数
   * @param items 候选推荐项
   * @param config MMR配置
   */
  public rerank(
    items: RecommendedItem[],
    config: Partial<MMRConfig> = {}
  ): MMRResult {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    if (items.length <= finalConfig.maxResults) {
      return {
        items,
        diversityScore: this.calculateDiversityScore(items),
        relevanceScore: this.calculateRelevanceScore(items),
        mmrScore: 0
      };
    }

    // 提取内容特征向量
    const vectors = items.map(item => this.extractVector(item));

    // 执行MMR算法
    const selected = this.mmrSelect(items, vectors, finalConfig);

    // 计算分数
    const diversityScore = this.calculateDiversityScore(selected);
    const relevanceScore = this.calculateRelevanceScore(selected);
    const mmrScore = finalConfig.lambda * relevanceScore + 
                     (1 - finalConfig.lambda) * diversityScore;

    return {
      items: selected,
      diversityScore,
      relevanceScore,
      mmrScore
    };
  }

  /**
   * MMR核心选择算法
   */
  private mmrSelect(
    items: RecommendedItem[],
    vectors: ContentVector[],
    config: MMRConfig
  ): RecommendedItem[] {
    const selected: RecommendedItem[] = [];
    const selectedVectors: ContentVector[] = [];
    const candidates = [...items];
    const candidateVectors = [...vectors];

    // 首先选择相关性最高的项
    const firstItem = this.selectHighestRelevance(candidates);
    const firstIndex = candidates.indexOf(firstItem);
    
    selected.push(firstItem);
    selectedVectors.push(candidateVectors[firstIndex]);
    candidates.splice(firstIndex, 1);
    candidateVectors.splice(firstIndex, 1);

    // 迭代选择剩余项
    while (selected.length < config.maxResults && candidates.length > 0) {
      let bestMMRScore = -Infinity;
      let bestIndex = -1;

      // 计算每个候选的MMR分数
      for (let i = 0; i < candidates.length; i++) {
        const relevance = this.normalizeScore(candidates[i].score);
        const maxSimilarity = this.calculateMaxSimilarity(
          candidateVectors[i],
          selectedVectors
        );

        // MMR公式
        const mmrScore = config.lambda * relevance - 
                        (1 - config.lambda) * maxSimilarity;

        if (mmrScore > bestMMRScore) {
          bestMMRScore = mmrScore;
          bestIndex = i;
        }
      }

      if (bestIndex >= 0) {
        selected.push(candidates[bestIndex]);
        selectedVectors.push(candidateVectors[bestIndex]);
        candidates.splice(bestIndex, 1);
        candidateVectors.splice(bestIndex, 1);
      }
    }

    return selected;
  }

  /**
   * 提取内容特征向量
   */
  private extractVector(item: RecommendedItem): ContentVector {
    return {
      id: item.id,
      category: item.metadata?.category,
      tags: item.metadata?.tags || [],
      authorId: item.metadata?.authorId,
      theme: item.metadata?.theme
    };
  }

  /**
   * 计算两个向量的相似度
   */
  private calculateSimilarity(v1: ContentVector, v2: ContentVector): number {
    let similarity = 0;
    let featureCount = 0;

    // 1. 分类相似度 (权重：0.3)
    if (v1.category && v2.category) {
      featureCount += 0.3;
      if (v1.category === v2.category) {
        similarity += 0.3;
      }
    }

    // 2. 标签相似度 - Jaccard (权重：0.4)
    if (v1.tags && v2.tags && v1.tags.length > 0 && v2.tags.length > 0) {
      featureCount += 0.4;
      const intersection = v1.tags.filter(tag => v2.tags!.includes(tag));
      const union = [...new Set([...v1.tags, ...v2.tags])];
      const jaccard = union.length > 0 ? intersection.length / union.length : 0;
      similarity += 0.4 * jaccard;
    }

    // 3. 作者相似度 (权重：0.2)
    if (v1.authorId && v2.authorId) {
      featureCount += 0.2;
      if (v1.authorId === v2.authorId) {
        similarity += 0.2;
      }
    }

    // 4. 主题相似度 (权重：0.1)
    if (v1.theme && v2.theme) {
      featureCount += 0.1;
      if (v1.theme === v2.theme) {
        similarity += 0.1;
      }
    }

    // 归一化
    return featureCount > 0 ? similarity / featureCount : 0;
  }

  /**
   * 计算与已选集合的最大相似度
   */
  private calculateMaxSimilarity(
    vector: ContentVector,
    selectedVectors: ContentVector[]
  ): number {
    if (selectedVectors.length === 0) return 0;

    let maxSimilarity = 0;
    for (const selected of selectedVectors) {
      const similarity = this.calculateSimilarity(vector, selected);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return maxSimilarity;
  }

  /**
   * 选择相关性最高的项
   */
  private selectHighestRelevance(items: RecommendedItem[]): RecommendedItem {
    return items.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  }

  /**
   * 归一化分数到0-1范围
   */
  private normalizeScore(score: number): number {
    // 使用sigmoid函数归一化
    return 1 / (1 + Math.exp(-score / 100));
  }

  /**
   * 计算多样性分数
   * 使用类别覆盖率和基尼系数
   */
  private calculateDiversityScore(items: RecommendedItem[]): number {
    if (items.length <= 1) return 1;

    // 1. 类别多样性
    const categories = new Set(items.map(item => item.metadata?.category).filter(Boolean));
    const categoryDiversity = categories.size / items.length;

    // 2. 作者多样性
    const authors = new Set(items.map(item => item.metadata?.authorId).filter(Boolean));
    const authorDiversity = Math.min(authors.size / Math.min(items.length, 10), 1);

    // 3. 类型多样性
    const types = new Set(items.map(item => item.type));
    const typeDiversity = types.size / 3; // 假设最多3种类型

    // 综合多样性分数
    return (categoryDiversity * 0.5 + authorDiversity * 0.3 + typeDiversity * 0.2);
  }

  /**
   * 计算相关性分数
   */
  private calculateRelevanceScore(items: RecommendedItem[]): number {
    if (items.length === 0) return 0;
    
    const totalScore = items.reduce((sum, item) => sum + item.score, 0);
    return totalScore / items.length / 100; // 归一化
  }

  // ============================================
  // 高级多样性算法
  // ============================================

  /**
   * 基于聚类的多样性重排序
   * 使用K-means思想将内容聚类，然后从每个聚类中选择代表性内容
   */
  public clusterBasedRerank(
    items: RecommendedItem[],
    numClusters: number = 5
  ): RecommendedItem[] {
    if (items.length <= numClusters) return items;

    // 提取特征向量
    const vectors = items.map(item => this.extractVector(item));

    // 简单的K-means聚类（使用分类和标签作为特征）
    const clusters = this.kMeansClustering(vectors, numClusters);

    // 从每个聚类中选择分数最高的项
    const selected: RecommendedItem[] = [];
    
    for (const cluster of clusters) {
      if (cluster.length === 0) continue;
      
      // 找到聚类中分数最高的项
      let bestItem: RecommendedItem | null = null;
      let bestScore = -Infinity;

      for (const vector of cluster) {
        const item = items.find(i => i.id === vector.id);
        if (item && item.score > bestScore) {
          bestScore = item.score;
          bestItem = item;
        }
      }

      if (bestItem) {
        selected.push(bestItem);
      }
    }

    // 如果结果不足，补充剩余的高分项
    if (selected.length < items.length) {
      const selectedIds = new Set(selected.map(item => item.id));
      const remaining = items
        .filter(item => !selectedIds.has(item.id))
        .sort((a, b) => b.score - a.score);
      
      selected.push(...remaining.slice(0, items.length - selected.length));
    }

    return selected;
  }

  /**
   * 简化的K-means聚类
   */
  private kMeansClustering(
    vectors: ContentVector[],
    k: number
  ): ContentVector[][] {
    if (vectors.length <= k) {
      return vectors.map(v => [v]);
    }

    // 初始化聚类中心（随机选择）
    const centroids: ContentVector[] = [];
    const used = new Set<number>();
    
    while (centroids.length < k && used.size < vectors.length) {
      const idx = Math.floor(Math.random() * vectors.length);
      if (!used.has(idx)) {
        centroids.push(vectors[idx]);
        used.add(idx);
      }
    }

    // 迭代聚类（简化版，只迭代3次）
    let clusters: ContentVector[][] = [];
    
    for (let iter = 0; iter < 3; iter++) {
      // 清空聚类
      clusters = Array(centroids.length).fill(null).map(() => []);

      // 分配向量到最近的聚类
      for (const vector of vectors) {
        let bestCluster = 0;
        let minDistance = Infinity;

        for (let i = 0; i < centroids.length; i++) {
          const distance = 1 - this.calculateSimilarity(vector, centroids[i]);
          if (distance < minDistance) {
            minDistance = distance;
            bestCluster = i;
          }
        }

        clusters[bestCluster].push(vector);
      }

      // 更新聚类中心
      for (let i = 0; i < centroids.length; i++) {
        if (clusters[i].length > 0) {
          centroids[i] = this.calculateCentroid(clusters[i]);
        }
      }
    }

    return clusters;
  }

  /**
   * 计算聚类中心
   */
  private calculateCentroid(cluster: ContentVector[]): ContentVector {
    // 简化实现：返回聚类中第一个向量
    // 实际应该计算平均向量
    return cluster[0];
  }

  /**
   * 滑动窗口多样性控制
   * 确保窗口内的内容具有多样性
   */
  public slidingWindowDiversity(
    items: RecommendedItem[],
    windowSize: number = 5,
    maxSameCategory: number = 2
  ): RecommendedItem[] {
    const result: RecommendedItem[] = [];
    const remaining = [...items];

    while (remaining.length > 0 && result.length < items.length) {
      // 获取当前窗口
      const windowStart = Math.max(0, result.length - windowSize + 1);
      const currentWindow = result.slice(windowStart);

      // 统计窗口内各类别数量
      const categoryCount: Record<string, number> = {};
      currentWindow.forEach(item => {
        const cat = item.metadata?.category || 'unknown';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      // 选择下一个项
      let selectedIndex = -1;
      
      for (let i = 0; i < remaining.length; i++) {
        const item = remaining[i];
        const category = item.metadata?.category || 'unknown';

        // 检查是否超过类别限制
        if ((categoryCount[category] || 0) < maxSameCategory) {
          selectedIndex = i;
          break;
        }
      }

      // 如果所有项都违反限制，选择分数最高的
      if (selectedIndex === -1) {
        selectedIndex = 0;
      }

      result.push(remaining[selectedIndex]);
      remaining.splice(selectedIndex, 1);
    }

    return result;
  }

  // ============================================
  // 公共API
  // ============================================

  /**
   * 快速多样性检查
   */
  public quickDiversityCheck(items: RecommendedItem[]): {
    isDiverse: boolean;
    score: number;
    suggestions: string[];
  } {
    const score = this.calculateDiversityScore(items);
    const isDiverse = score > 0.5;

    const suggestions: string[] = [];
    
    if (score < 0.3) {
      suggestions.push('推荐结果过于单一，建议增加不同类别的内容');
    } else if (score < 0.5) {
      suggestions.push('推荐多样性有待提升');
    }

    // 检查作者多样性
    const authors = new Set(items.map(item => item.metadata?.authorId));
    if (authors.size < items.length * 0.3) {
      suggestions.push('同一作者内容过多，建议分散作者来源');
    }

    return { isDiverse, score, suggestions };
  }

  /**
   * 获取配置
   */
  public getConfig(): MMRConfig {
    return { ...this.defaultConfig };
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<MMRConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }
}

// ============================================
// 单例导出
// ============================================

export const diversityRerankService = new DiversityRerankService();

export default diversityRerankService;
