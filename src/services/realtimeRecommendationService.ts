/**
 * 实时推荐服务
 * 构建实时推荐管道，支持流式数据处理和实时特征更新
 * 
 * 架构设计：
 * 1. 实时行为收集 -> Redis Streams
 * 2. 实时特征计算 -> 滑动窗口聚合
 * 3. 实时推荐更新 -> WebSocket推送
 */

import { supabase } from '@/lib/supabase';
import { EventEmitter } from 'events';

// ============================================
// 类型定义
// ============================================

/**
 * 实时用户行为事件
 */
export interface RealtimeUserEvent {
  id: string;
  userId: string;
  eventType: 'view' | 'click' | 'like' | 'share' | 'comment' | 'dwell';
  itemId: string;
  itemType: 'post' | 'work' | 'challenge' | 'template';
  timestamp: number;
  metadata?: {
    dwellTime?: number;        // 停留时长(ms)
    position?: number;         // 展示位置
    source?: string;           // 来源页面
    device?: string;           // 设备类型
  };
}

/**
 * 实时特征
 */
export interface RealtimeFeatures {
  userId: string;
  // 实时统计特征
  stats: {
    viewCount: number;         // 近1小时浏览数
    clickCount: number;        // 近1小时点击数
    likeCount: number;         // 近1小时点赞数
    avgDwellTime: number;      // 平均停留时长
    currentSessionDuration: number; // 当前会话时长
  };
  // 实时兴趣特征
  interests: {
    categories: Record<string, number>;  // 分类实时权重
    tags: Record<string, number>;        // 标签实时权重
    authors: Record<string, number>;     // 作者实时权重
  };
  // 上下文特征
  context: {
    timeOfDay: number;         // 当前时间(0-23)
    dayOfWeek: number;         // 星期(0-6)
    deviceType: string;        // 设备类型
    location?: string;         // 地理位置
  };
  lastUpdated: number;
}

/**
 * 实时推荐结果
 */
export interface RealtimeRecommendation {
  userId: string;
  items: Array<{
    id: string;
    type: string;
    score: number;
    reason: string;
    features: RealtimeFeatures;
  }>;
  generatedAt: number;
  expiresAt: number;
}

// ============================================
// 实时推荐引擎
// ============================================

class RealtimeRecommendationEngine extends EventEmitter {
  // 内存缓存（用于快速访问）
  private userFeaturesCache: Map<string, RealtimeFeatures> = new Map();
  private recommendationCache: Map<string, RealtimeRecommendation> = new Map();
  
  // 配置参数
  private config = {
    featureWindowSize: 60 * 60 * 1000,      // 特征窗口：1小时
    recommendationTTL: 5 * 60 * 1000,       // 推荐缓存：5分钟
    featureUpdateInterval: 30 * 1000,       // 特征更新间隔：30秒
    maxEventsPerUser: 1000,                 // 每用户最大事件数
    similarityThreshold: 0.6                // 相似度阈值
  };
  
  // 事件缓冲区
  private eventBuffer: RealtimeUserEvent[] = [];
  private bufferFlushInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initialize();
  }

  /**
   * 初始化实时引擎
   */
  private initialize(): void {
    // 启动事件缓冲区刷新
    this.bufferFlushInterval = setInterval(() => {
      this.flushEventBuffer();
    }, 5000); // 每5秒刷新一次

    // 启动特征更新定时器
    setInterval(() => {
      this.updateAllUserFeatures();
    }, this.config.featureUpdateInterval);

    console.log('[RealtimeRecommendationEngine] 初始化完成');
  }

  // ============================================
  // 实时事件处理
  // ============================================

  /**
   * 收集用户行为事件
   */
  public collectEvent(event: Omit<RealtimeUserEvent, 'id' | 'timestamp'>): void {
    const fullEvent: RealtimeUserEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    // 添加到缓冲区
    this.eventBuffer.push(fullEvent);

    // 实时更新用户特征（不等待批量刷新）
    this.updateUserFeaturesRealtime(fullEvent);

    // 触发事件
    this.emit('event', fullEvent);

    // 如果缓冲区过大，立即刷新
    if (this.eventBuffer.length >= 100) {
      this.flushEventBuffer();
    }
  }

  /**
   * 批量刷新事件缓冲区
   */
  private async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      // 批量保存到Supabase
      await this.saveEventsToDatabase(events);
      
      // 更新实时统计
      this.updateRealtimeStats(events);
      
      console.log(`[RealtimeRecommendationEngine] 刷新 ${events.length} 个事件`);
    } catch (error) {
      console.error('[RealtimeRecommendationEngine] 刷新事件失败:', error);
      // 失败时重新加入缓冲区
      this.eventBuffer.unshift(...events);
    }
  }

  /**
   * 保存事件到数据库
   */
  private async saveEventsToDatabase(events: RealtimeUserEvent[]): Promise<void> {
    const records = events.map(event => ({
      user_id: event.userId,
      event_type: event.eventType,
      item_id: event.itemId,
      item_type: event.itemType,
      metadata: event.metadata,
      created_at: new Date(event.timestamp).toISOString()
    }));

    const { error } = await supabase
      .from('user_behavior_events')
      .insert(records);

    if (error) {
      throw error;
    }
  }

  // ============================================
  // 实时特征计算
  // ============================================

  /**
   * 实时更新用户特征
   */
  private updateUserFeaturesRealtime(event: RealtimeUserEvent): void {
    const { userId } = event;
    let features = this.userFeaturesCache.get(userId);

    // 初始化特征
    if (!features) {
      features = this.initializeFeatures(userId);
    }

    // 更新统计特征
    switch (event.eventType) {
      case 'view':
        features.stats.viewCount++;
        break;
      case 'click':
        features.stats.clickCount++;
        break;
      case 'like':
        features.stats.likeCount++;
        break;
      case 'dwell':
        const dwellTime = event.metadata?.dwellTime || 0;
        features.stats.avgDwellTime = 
          (features.stats.avgDwellTime * (features.stats.viewCount - 1) + dwellTime) / 
          features.stats.viewCount;
        break;
    }

    // 更新兴趣特征（基于内容元数据）
    this.updateInterestFeatures(features, event);

    // 更新上下文
    features.context.timeOfDay = new Date().getHours();
    features.context.dayOfWeek = new Date().getDay();

    // 更新时间戳
    features.lastUpdated = Date.now();

    // 保存到缓存
    this.userFeaturesCache.set(userId, features);

    // 触发特征更新事件
    this.emit('featuresUpdated', { userId, features });
  }

  /**
   * 初始化用户特征
   */
  private initializeFeatures(userId: string): RealtimeFeatures {
    return {
      userId,
      stats: {
        viewCount: 0,
        clickCount: 0,
        likeCount: 0,
        avgDwellTime: 0,
        currentSessionDuration: 0
      },
      interests: {
        categories: {},
        tags: {},
        authors: {}
      },
      context: {
        timeOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
        deviceType: 'unknown'
      },
      lastUpdated: Date.now()
    };
  }

  /**
   * 更新兴趣特征
   */
  private async updateInterestFeatures(
    features: RealtimeFeatures,
    event: RealtimeUserEvent
  ): Promise<void> {
    // 获取内容元数据
    const metadata = await this.getItemMetadata(event.itemId, event.itemType);
    if (!metadata) return;

    const weight = this.getEventWeight(event.eventType);

    // 更新分类兴趣
    if (metadata.category) {
      const current = features.interests.categories[metadata.category] || 0;
      features.interests.categories[metadata.category] = 
        Math.min(current + weight, 1.0);
    }

    // 更新标签兴趣
    if (metadata.tags) {
      metadata.tags.forEach((tag: string) => {
        const current = features.interests.tags[tag] || 0;
        features.interests.tags[tag] = Math.min(current + weight * 0.5, 1.0);
      });
    }

    // 更新作者兴趣
    if (metadata.authorId) {
      const current = features.interests.authors[metadata.authorId] || 0;
      features.interests.authors[metadata.authorId] = 
        Math.min(current + weight * 0.8, 1.0);
    }
  }

  /**
   * 获取事件权重
   */
  private getEventWeight(eventType: string): number {
    const weights: Record<string, number> = {
      view: 0.1,
      click: 0.3,
      like: 0.5,
      share: 0.8,
      comment: 0.6,
      dwell: 0.2
    };
    return weights[eventType] || 0.1;
  }

  /**
   * 获取内容元数据
   */
  private async getItemMetadata(
    itemId: string,
    itemType: string
  ): Promise<any | null> {
    // 先从本地缓存查找
    const cacheKey = `metadata_${itemType}_${itemId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // 从Supabase查询
    const table = itemType === 'post' || itemType === 'work' ? 'works' : 
                  itemType === 'challenge' ? 'challenges' : 'templates';
    
    const { data, error } = await supabase
      .from(table)
      .select('id, category, tags, author_id, title')
      .eq('id', itemId)
      .single();

    if (error || !data) return null;

    const metadata = {
      id: data.id,
      category: data.category,
      tags: data.tags,
      authorId: data.author_id,
      title: data.title
    };

    // 缓存到本地
    localStorage.setItem(cacheKey, JSON.stringify(metadata));

    return metadata;
  }

  /**
   * 更新所有用户的特征（定时任务）
   */
  private async updateAllUserFeatures(): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.config.featureWindowSize;

    // 清理过期特征
    for (const [userId, features] of this.userFeaturesCache.entries()) {
      if (features.lastUpdated < windowStart) {
        // 重置统计特征（滑动窗口）
        features.stats = {
          viewCount: 0,
          clickCount: 0,
          likeCount: 0,
          avgDwellTime: 0,
          currentSessionDuration: 0
        };
        
        // 衰减兴趣特征
        this.decayInterestFeatures(features);
        
        features.lastUpdated = now;
      }
    }
  }

  /**
   * 兴趣特征衰减
   */
  private decayInterestFeatures(features: RealtimeFeatures): void {
    const decayFactor = 0.9; // 衰减因子

    // 衰减分类兴趣
    Object.keys(features.interests.categories).forEach(key => {
      features.interests.categories[key] *= decayFactor;
      if (features.interests.categories[key] < 0.01) {
        delete features.interests.categories[key];
      }
    });

    // 衰减标签兴趣
    Object.keys(features.interests.tags).forEach(key => {
      features.interests.tags[key] *= decayFactor;
      if (features.interests.tags[key] < 0.01) {
        delete features.interests.tags[key];
      }
    });

    // 衰减作者兴趣
    Object.keys(features.interests.authors).forEach(key => {
      features.interests.authors[key] *= decayFactor;
      if (features.interests.authors[key] < 0.01) {
        delete features.interests.authors[key];
      }
    });
  }

  /**
   * 更新实时统计
   */
  private updateRealtimeStats(events: RealtimeUserEvent[]): void {
    // 按用户聚合统计
    const userStats: Map<string, number> = new Map();
    
    events.forEach(event => {
      const count = userStats.get(event.userId) || 0;
      userStats.set(event.userId, count + 1);
    });

    // 触发统计更新事件
    this.emit('statsUpdated', { userStats, totalEvents: events.length });
  }

  // ============================================
  // 实时推荐生成
  // ============================================

  /**
   * 获取实时推荐
   */
  public async getRealtimeRecommendations(
    userId: string,
    options: {
      limit?: number;
      context?: Partial<RealtimeFeatures['context']>;
    } = {}
  ): Promise<RealtimeRecommendation> {
    const { limit = 20 } = options;

    // 检查缓存
    const cached = this.recommendationCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached;
    }

    // 获取用户实时特征
    const features = this.userFeaturesCache.get(userId) || 
                     this.initializeFeatures(userId);

    // 合并上下文
    if (options.context) {
      features.context = { ...features.context, ...options.context };
    }

    // 生成推荐
    const items = await this.generateRecommendations(userId, features, limit);

    // 构建推荐结果
    const recommendation: RealtimeRecommendation = {
      userId,
      items,
      generatedAt: Date.now(),
      expiresAt: Date.now() + this.config.recommendationTTL
    };

    // 缓存推荐结果
    this.recommendationCache.set(userId, recommendation);

    return recommendation;
  }

  /**
   * 生成实时推荐
   */
  private async generateRecommendations(
    userId: string,
    features: RealtimeFeatures,
    limit: number
  ): Promise<RealtimeRecommendation['items']> {
    // 1. 多路召回
    const candidates = await this.realtimeMultiChannelRecall(userId, features, limit * 3);

    // 2. 实时特征排序
    const scored = candidates.map(item => ({
      ...item,
      realtimeScore: this.calculateRealtimeScore(item, features)
    }));

    // 3. 排序并返回
    scored.sort((a, b) => b.realtimeScore - a.realtimeScore);

    return scored.slice(0, limit).map(item => ({
      id: item.id,
      type: item.type,
      score: item.realtimeScore,
      reason: item.reason,
      features
    }));
  }

  /**
   * 实时多路召回
   */
  private async realtimeMultiChannelRecall(
    userId: string,
    features: RealtimeFeatures,
    limit: number
  ): Promise<Array<{ id: string; type: string; reason: string }>> {
    const candidates: Array<{ id: string; type: string; reason: string }> = [];

    // 1. 基于实时兴趣召回
    const interestCandidates = await this.recallByRealtimeInterest(
      features.interests,
      Math.ceil(limit * 0.4)
    );
    candidates.push(...interestCandidates);

    // 2. 基于热门召回
    const trendingCandidates = await this.recallTrending(
      Math.ceil(limit * 0.3)
    );
    candidates.push(...trendingCandidates);

    // 3. 基于相似用户召回
    const similarUserCandidates = await this.recallBySimilarUsers(
      userId,
      Math.ceil(limit * 0.2)
    );
    candidates.push(...similarUserCandidates);

    // 4. 新品召回
    const newContentCandidates = await this.recallNewContent(
      Math.ceil(limit * 0.1)
    );
    candidates.push(...newContentCandidates);

    return candidates;
  }

  /**
   * 基于实时兴趣召回
   */
  private async recallByRealtimeInterest(
    interests: RealtimeFeatures['interests'],
    limit: number
  ): Promise<Array<{ id: string; type: string; reason: string }>> {
    // 获取Top分类
    const topCategories = Object.entries(interests.categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);

    // 获取Top标签
    const topTags = Object.entries(interests.tags)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);

    if (topCategories.length === 0 && topTags.length === 0) {
      return [];
    }

    // 查询数据库
    let query = supabase
      .from('works')
      .select('id, category, tags')
      .limit(limit);

    if (topCategories.length > 0) {
      query = query.in('category', topCategories);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map(item => ({
      id: item.id,
      type: 'post',
      reason: '基于你的实时兴趣'
    }));
  }

  /**
   * 热门召回
   */
  private async recallTrending(
    limit: number
  ): Promise<Array<{ id: string; type: string; reason: string }>> {
    const { data, error } = await supabase
      .from('works')
      .select('id')
      .order('likes', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map(item => ({
      id: item.id,
      type: 'post',
      reason: '热门内容'
    }));
  }

  /**
   * 基于相似用户召回
   */
  private async recallBySimilarUsers(
    userId: string,
    limit: number
  ): Promise<Array<{ id: string; type: string; reason: string }>> {
    // 简化实现，实际应该使用协同过滤结果
    return [];
  }

  /**
   * 新品召回
   */
  private async recallNewContent(
    limit: number
  ): Promise<Array<{ id: string; type: string; reason: string }>> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('works')
      .select('id')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map(item => ({
      id: item.id,
      type: 'post',
      reason: '最新发布'
    }));
  }

  /**
   * 计算实时分数
   */
  private calculateRealtimeScore(
    item: { id: string; type: string; reason: string },
    features: RealtimeFeatures
  ): number {
    let score = 0;

    // 基础分数
    score += 50;

    // 根据推荐理由调整分数
    switch (item.reason) {
      case '基于你的实时兴趣':
        score += 30;
        break;
      case '热门内容':
        score += 20;
        break;
      case '最新发布':
        score += 10;
        break;
    }

    // 根据用户活跃度调整
    score += features.stats.viewCount * 0.1;

    return score;
  }

  // ============================================
  // 公共API
  // ============================================

  /**
   * 获取用户实时特征
   */
  public getUserRealtimeFeatures(userId: string): RealtimeFeatures | null {
    return this.userFeaturesCache.get(userId) || null;
  }

  /**
   * 清除用户缓存
   */
  public clearUserCache(userId: string): void {
    this.userFeaturesCache.delete(userId);
    this.recommendationCache.delete(userId);
  }

  /**
   * 获取引擎统计信息
   */
  public getStats(): {
    cachedUsers: number;
    cachedRecommendations: number;
    bufferedEvents: number;
  } {
    return {
      cachedUsers: this.userFeaturesCache.size,
      cachedRecommendations: this.recommendationCache.size,
      bufferedEvents: this.eventBuffer.length
    };
  }

  /**
   * 销毁引擎
   */
  public destroy(): void {
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
    }
    this.removeAllListeners();
    this.userFeaturesCache.clear();
    this.recommendationCache.clear();
  }
}

// ============================================
// 单例导出
// ============================================

export const realtimeRecommendationEngine = new RealtimeRecommendationEngine();

export default realtimeRecommendationEngine;
