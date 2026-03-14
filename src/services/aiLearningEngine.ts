/**
 * AI学习引擎
 * 提升知识更新与学习效率
 * 实现持续学习、知识蒸馏、模型优化
 */


// 学习样本
export interface LearningSample {
  id: string;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  context: string;
  feedback: 'positive' | 'negative' | 'neutral';
  rating?: number;
  timestamp: number;
  category: string;
  tags: string[];
  metadata?: Record<string, any>;
}

// 知识单元
export interface KnowledgeUnit {
  id: string;
  content: string;
  category: string;
  confidence: number;
  source: string;
  createdAt: number;
  updatedAt: number;
  usageCount: number;
  successRate: number;
  relatedUnits: string[];
  embeddings?: number[];
}

// 学习统计
export interface LearningStats {
  totalSamples: number;
  positiveSamples: number;
  negativeSamples: number;
  averageRating: number;
  improvementRate: number;
  lastLearningTime: number;
  knowledgeCoverage: number;
}

// 性能指标
export interface PerformanceMetrics {
  responseAccuracy: number;
  responseRelevance: number;
  contextUnderstanding: number;
  userSatisfaction: number;
  averageResponseTime: number;
  errorRate: number;
  learningEfficiency: number;
}

// 优化建议
export interface OptimizationSuggestion {
  type: 'knowledge' | 'response' | 'performance' | 'interaction';
  priority: 'high' | 'medium' | 'low';
  description: string;
  currentValue?: number;
  targetValue?: number;
  action: string;
  expectedImpact: string;
}

class AILearningEngine {
  private samples: Map<string, LearningSample> = new Map();
  private knowledgeBase: Map<string, KnowledgeUnit> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private performanceHistory: PerformanceMetrics[] = [];
  
  // 学习配置
  private config = {
    minSamplesForLearning: 10,
    learningInterval: 24 * 60 * 60 * 1000, // 24小时
    maxKnowledgeUnits: 10000,
    similarityThreshold: 0.85,
    retentionPeriod: 90 * 24 * 60 * 60 * 1000 // 90天
  };

  /**
   * 添加学习样本
   */
  addSample(sample: Omit<LearningSample, 'id' | 'timestamp'>): LearningSample {
    const newSample: LearningSample = {
      ...sample,
      id: `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    this.samples.set(newSample.id, newSample);
    this.updateIndexes(newSample);
    
    // 触发知识提取
    if (sample.feedback === 'positive' && sample.rating && sample.rating >= 4) {
      this.extractKnowledge(newSample);
    }

    return newSample;
  }

  /**
   * 从样本中提取知识
   */
  private extractKnowledge(sample: LearningSample): void {
    // 分析高质量样本，提取知识单元
    const knowledgeContent = this.synthesizeKnowledge(sample);
    
    // 检查是否已存在相似知识
    const similarUnits = this.findSimilarKnowledge(knowledgeContent);
    
    if (similarUnits.length > 0) {
      // 更新现有知识
      const bestMatch = similarUnits[0];
      this.updateKnowledgeUnit(bestMatch.id, {
        confidence: Math.min(1, bestMatch.confidence + 0.05),
        usageCount: bestMatch.usageCount + 1,
        updatedAt: Date.now()
      });
    } else {
      // 创建新知识单元
      this.createKnowledgeUnit({
        content: knowledgeContent,
        category: sample.category,
        source: sample.id,
        confidence: 0.7
      });
    }
  }

  /**
   * 合成知识内容
   */
  private synthesizeKnowledge(sample: LearningSample): string {
    // 从输入和期望输出中提取关键信息
    const keyPoints = this.extractKeyPoints(sample.input, sample.expectedOutput);
    return keyPoints.join('\n');
  }

  /**
   * 提取关键点
   */
  private extractKeyPoints(input: string, output: string): string[] {
    const points: string[] = [];
    
    // 提取问题-答案对
    const qaPattern = /([^?？]+)[?？]\s*([^。！.]+)/g;
    let match;
    while ((match = qaPattern.exec(input + ' ' + output)) !== null) {
      points.push(`Q: ${match[1].trim()}\nA: ${match[2].trim()}`);
    }

    // 提取重要陈述
    const statementPattern = /(是|为|表示|认为|建议|推荐|注意|重要)[：:]?([^。！.]{10,100})/g;
    while ((match = statementPattern.exec(output)) !== null) {
      points.push(match[2].trim());
    }

    return points.length > 0 ? points : [output.substring(0, 200)];
  }

  /**
   * 创建知识单元
   */
  createKnowledgeUnit(unit: Omit<KnowledgeUnit, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'successRate' | 'relatedUnits'>): KnowledgeUnit {
    const newUnit: KnowledgeUnit = {
      ...unit,
      id: `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
      successRate: 0,
      relatedUnits: []
    };

    this.knowledgeBase.set(newUnit.id, newUnit);
    this.updateCategoryIndex(newUnit);
    
    // 限制知识库大小
    this.maintainKnowledgeBaseSize();
    
    return newUnit;
  }

  /**
   * 查找相似知识
   */
  private findSimilarKnowledge(content: string): KnowledgeUnit[] {
    const similar: KnowledgeUnit[] = [];
    
    for (const unit of this.knowledgeBase.values()) {
      const similarity = this.calculateSimilarity(content, unit.content);
      if (similarity >= this.config.similarityThreshold) {
        similar.push(unit);
      }
    }

    return similar.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 计算文本相似度
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * 更新知识单元
   */
  updateKnowledgeUnit(id: string, updates: Partial<KnowledgeUnit>): void {
    const unit = this.knowledgeBase.get(id);
    if (unit) {
      Object.assign(unit, updates, { updatedAt: Date.now() });
      this.knowledgeBase.set(id, unit);
    }
  }

  /**
   * 检索相关知识
   */
  retrieveKnowledge(query: string, category?: string, limit: number = 5): KnowledgeUnit[] {
    const candidates: { unit: KnowledgeUnit; score: number }[] = [];

    for (const unit of this.knowledgeBase.values()) {
      // 类别过滤
      if (category && unit.category !== category) continue;

      // 计算相关性得分
      let score = this.calculateSimilarity(query, unit.content);
      
      // 考虑知识单元的质量因素
      score *= unit.confidence;
      score *= (1 + unit.usageCount * 0.01);
      score *= (0.5 + unit.successRate * 0.5);

      candidates.push({ unit, score });
    }

    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(c => c.unit);
  }

  /**
   * 批量学习
   */
  async batchLearn(): Promise<LearningStats> {
    const recentSamples = Array.from(this.samples.values())
      .filter(s => Date.now() - s.timestamp < this.config.learningInterval);

    if (recentSamples.length < this.config.minSamplesForLearning) {
      return this.getLearningStats();
    }

    // 分析样本模式
    const patterns = this.analyzePatterns(recentSamples);
    
    // 更新知识库
    for (const pattern of patterns) {
      await this.integratePattern(pattern);
    }

    // 清理过期数据
    this.cleanupOldData();

    return this.getLearningStats();
  }

  /**
   * 分析样本模式
   */
  private analyzePatterns(samples: LearningSample[]): any[] {
    const patterns: any[] = [];
    
    // 按类别分组分析
    const categoryGroups = this.groupByCategory(samples);
    
    for (const [category, groupSamples] of categoryGroups) {
      // 分析常见问题
      const commonQuestions = this.findCommonPatterns(
        groupSamples.map(s => s.input)
      );
      
      // 分析优质回复
      const goodResponses = groupSamples
        .filter(s => s.feedback === 'positive' && s.rating && s.rating >= 4)
        .map(s => s.expectedOutput);

      patterns.push({
        category,
        commonQuestions,
        responseTemplates: this.extractTemplates(goodResponses),
        improvementAreas: this.identifyImprovementAreas(groupSamples)
      });
    }

    return patterns;
  }

  /**
   * 按类别分组
   */
  private groupByCategory(samples: LearningSample[]): Map<string, LearningSample[]> {
    const groups = new Map<string, LearningSample[]>();
    
    for (const sample of samples) {
      if (!groups.has(sample.category)) {
        groups.set(sample.category, []);
      }
      groups.get(sample.category)!.push(sample);
    }

    return groups;
  }

  /**
   * 查找常见模式
   */
  private findCommonPatterns(inputs: string[]): string[] {
    const patterns: string[] = [];
    const frequency: Map<string, number> = new Map();

    // 提取关键词组合
    for (const input of inputs) {
      const keywords = this.extractKeywords(input);
      const key = keywords.sort().join(',');
      frequency.set(key, (frequency.get(key) || 0) + 1);
    }

    // 返回高频模式
    for (const [pattern, count] of frequency) {
      if (count >= 3) {
        patterns.push(pattern);
      }
    }

    return patterns;
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    // 停用词列表
    const stopWords = new Set(['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这']);
    
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(w => w.length > 1 && !stopWords.has(w));
  }

  /**
   * 提取回复模板
   */
  private extractTemplates(responses: string[]): string[] {
    // 简化实现：返回最常见的回复结构
    const templates: string[] = [];
    
    for (const response of responses.slice(0, 10)) {
      // 提取回复结构模式
      const structure = response
        .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (structure.length > 20) {
        templates.push(structure.substring(0, 100) + '...');
      }
    }

    return [...new Set(templates)];
  }

  /**
   * 识别改进领域
   */
  private identifyImprovementAreas(samples: LearningSample[]): string[] {
    const areas: string[] = [];
    
    const negativeSamples = samples.filter(s => s.feedback === 'negative');
    if (negativeSamples.length > samples.length * 0.3) {
      areas.push('需要改进回复质量');
    }

    const lowRatingSamples = samples.filter(s => s.rating && s.rating < 3);
    if (lowRatingSamples.length > 0) {
      areas.push('低评分样本较多，需要针对性优化');
    }

    return areas;
  }

  /**
   * 集成模式到知识库
   */
  private async integratePattern(pattern: any): Promise<void> {
    // 创建或更新知识单元
    const knowledgeContent = `
类别：${pattern.category}
常见问题：${pattern.commonQuestions.join('、')}
回复模板：${pattern.responseTemplates.length}个
改进建议：${pattern.improvementAreas.join('、')}
    `.trim();

    this.createKnowledgeUnit({
      content: knowledgeContent,
      category: pattern.category,
      source: 'pattern_learning',
      confidence: 0.6
    });
  }

  /**
   * 获取学习统计
   */
  getLearningStats(): LearningStats {
    const allSamples = Array.from(this.samples.values());
    const positiveSamples = allSamples.filter(s => s.feedback === 'positive');
    const negativeSamples = allSamples.filter(s => s.feedback === 'negative');
    
    const ratedSamples = allSamples.filter(s => s.rating !== undefined);
    const averageRating = ratedSamples.length > 0
      ? ratedSamples.reduce((sum, s) => sum + (s.rating || 0), 0) / ratedSamples.length
      : 0;

    // 计算改进率（最近30天vs前30天）
    const now = Date.now();
    const recentPositive = positiveSamples.filter(s => now - s.timestamp < 30 * 24 * 60 * 60 * 1000).length;
    const previousPositive = positiveSamples.filter(s => {
      const days30 = 30 * 24 * 60 * 60 * 1000;
      return s.timestamp >= now - 2 * days30 && s.timestamp < now - days30;
    }).length;
    
    const improvementRate = previousPositive > 0
      ? (recentPositive - previousPositive) / previousPositive
      : 0;

    return {
      totalSamples: allSamples.length,
      positiveSamples: positiveSamples.length,
      negativeSamples: negativeSamples.length,
      averageRating,
      improvementRate,
      lastLearningTime: now,
      knowledgeCoverage: this.knowledgeBase.size
    };
  }

  /**
   * 计算性能指标
   */
  calculateMetrics(): PerformanceMetrics {
    const recentSamples = Array.from(this.samples.values())
      .filter(s => Date.now() - s.timestamp < 7 * 24 * 60 * 60 * 1000);

    const total = recentSamples.length || 1;
    const positive = recentSamples.filter(s => s.feedback === 'positive').length;
    const rated = recentSamples.filter(s => s.rating !== undefined);
    
    const metrics: PerformanceMetrics = {
      responseAccuracy: positive / total,
      responseRelevance: this.calculateRelevance(recentSamples),
      contextUnderstanding: this.calculateContextUnderstanding(recentSamples),
      userSatisfaction: rated.length > 0
        ? rated.reduce((sum, s) => sum + (s.rating || 0), 0) / rated.length / 5
        : 0,
      averageResponseTime: this.calculateAverageResponseTime(),
      errorRate: recentSamples.filter(s => s.feedback === 'negative').length / total,
      learningEfficiency: this.calculateLearningEfficiency()
    };

    this.performanceHistory.push(metrics);
    
    // 保留最近100条记录
    if (this.performanceHistory.length > 100) {
      this.performanceHistory.shift();
    }

    return metrics;
  }

  /**
   * 计算相关性
   */
  private calculateRelevance(samples: LearningSample[]): number {
    // 简化实现：基于反馈和评分的加权平均
    let totalScore = 0;
    let count = 0;

    for (const sample of samples) {
      if (sample.rating) {
        totalScore += sample.rating / 5;
        count++;
      } else if (sample.feedback === 'positive') {
        totalScore += 0.8;
        count++;
      } else if (sample.feedback === 'negative') {
        totalScore += 0.2;
        count++;
      }
    }

    return count > 0 ? totalScore / count : 0.5;
  }

  /**
   * 计算上下文理解能力
   */
  private calculateContextUnderstanding(samples: LearningSample[]): number {
    // 基于多轮对话样本的比例
    const multiTurnSamples = samples.filter(s => 
      s.context && s.context.split('\n').length > 2
    );
    
    return samples.length > 0
      ? multiTurnSamples.length / samples.length
      : 0.5;
  }

  /**
   * 计算平均响应时间
   */
  private calculateAverageResponseTime(): number {
    // 这里可以从实际系统获取响应时间数据
    // 简化实现：返回模拟值
    return 1500; // 1.5秒
  }

  /**
   * 计算学习效率
   */
  private calculateLearningEfficiency(): number {
    const stats = this.getLearningStats();
    
    if (stats.totalSamples === 0) return 0;
    
    // 基于正样本率和改进率计算
    const positiveRate = stats.positiveSamples / stats.totalSamples;
    const improvementFactor = Math.max(0, stats.improvementRate + 1) / 2;
    
    return (positiveRate + improvementFactor) / 2;
  }

  /**
   * 生成优化建议
   */
  generateOptimizationSuggestions(): OptimizationSuggestion[] {
    const metrics = this.calculateMetrics();
    const stats = this.getLearningStats();
    const suggestions: OptimizationSuggestion[] = [];

    // 响应准确性优化
    if (metrics.responseAccuracy < 0.8) {
      suggestions.push({
        type: 'response',
        priority: 'high',
        description: '响应准确性偏低',
        currentValue: metrics.responseAccuracy,
        targetValue: 0.85,
        action: '增加高质量样本学习，优化知识库内容',
        expectedImpact: '提升用户满意度15-20%'
      });
    }

    // 知识覆盖优化
    if (stats.knowledgeCoverage < 1000) {
      suggestions.push({
        type: 'knowledge',
        priority: 'medium',
        description: '知识库覆盖不足',
        currentValue: stats.knowledgeCoverage,
        targetValue: 2000,
        action: '扩充文化知识和设计案例',
        expectedImpact: '提升回答丰富度30%'
      });
    }

    // 用户满意度优化
    if (metrics.userSatisfaction < 0.7) {
      suggestions.push({
        type: 'interaction',
        priority: 'high',
        description: '用户满意度有待提升',
        currentValue: metrics.userSatisfaction,
        targetValue: 0.8,
        action: '优化回复格式，增加个性化',
        expectedImpact: '提升用户留存率25%'
      });
    }

    // 错误率优化
    if (metrics.errorRate > 0.1) {
      suggestions.push({
        type: 'performance',
        priority: 'high',
        description: '错误率偏高',
        currentValue: metrics.errorRate,
        targetValue: 0.05,
        action: '加强错误处理和恢复机制',
        expectedImpact: '减少用户投诉50%'
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * 更新索引
   */
  private updateIndexes(sample: LearningSample): void {
    // 更新类别索引
    if (!this.categoryIndex.has(sample.category)) {
      this.categoryIndex.set(sample.category, new Set());
    }
    this.categoryIndex.get(sample.category)!.add(sample.id);

    // 更新标签索引
    for (const tag of sample.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(sample.id);
    }
  }

  /**
   * 更新类别索引
   */
  private updateCategoryIndex(unit: KnowledgeUnit): void {
    if (!this.categoryIndex.has(unit.category)) {
      this.categoryIndex.set(unit.category, new Set());
    }
    this.categoryIndex.get(unit.category)!.add(unit.id);
  }

  /**
   * 维护知识库大小
   */
  private maintainKnowledgeBaseSize(): void {
    if (this.knowledgeBase.size <= this.config.maxKnowledgeUnits) return;

    // 按质量排序，移除低质量的知识
    const sorted = Array.from(this.knowledgeBase.entries())
      .sort((a, b) => {
        const scoreA = a[1].confidence * a[1].usageCount * a[1].successRate;
        const scoreB = b[1].confidence * b[1].usageCount * b[1].successRate;
        return scoreA - scoreB;
      });

    const toRemove = sorted.slice(0, sorted.length - this.config.maxKnowledgeUnits);
    for (const [id] of toRemove) {
      this.knowledgeBase.delete(id);
    }
  }

  /**
   * 清理过期数据
   */
  private cleanupOldData(): void {
    const cutoff = Date.now() - this.config.retentionPeriod;
    
    // 清理过期样本
    for (const [id, sample] of this.samples) {
      if (sample.timestamp < cutoff) {
        this.samples.delete(id);
      }
    }

    // 清理未使用的知识
    for (const [id, unit] of this.knowledgeBase) {
      if (unit.updatedAt < cutoff && unit.usageCount === 0) {
        this.knowledgeBase.delete(id);
      }
    }
  }

  /**
   * 导出学习数据
   */
  exportLearningData(): {
    samples: LearningSample[];
    knowledgeUnits: KnowledgeUnit[];
    stats: LearningStats;
    metrics: PerformanceMetrics;
  } {
    return {
      samples: Array.from(this.samples.values()),
      knowledgeUnits: Array.from(this.knowledgeBase.values()),
      stats: this.getLearningStats(),
      metrics: this.calculateMetrics()
    };
  }

  /**
   * 导入学习数据
   */
  importLearningData(data: {
    samples: LearningSample[];
    knowledgeUnits: KnowledgeUnit[];
  }): void {
    for (const sample of data.samples) {
      this.samples.set(sample.id, sample);
    }

    for (const unit of data.knowledgeUnits) {
      this.knowledgeBase.set(unit.id, unit);
    }
  }
}

export const aiLearningEngine = new AILearningEngine();
export default AILearningEngine;
