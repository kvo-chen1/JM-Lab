/**
 * 冷启动优化服务
 * 解决新用户和新内容的冷启动问题
 * 
 * 策略：
 * 1. 新用户冷启动：onboarding问卷 + 人口属性推荐 + 探索-利用平衡
 * 2. 新内容冷启动：质量预评估 + 小流量测试 + 逐步放量
 */

import { supabase } from '@/lib/supabase';
import { EventEmitter } from 'events';

// ============================================
// 类型定义
// ============================================

/**
 * 用户人口属性
 */
export interface UserDemographics {
  age?: number;
  gender?: 'male' | 'female' | 'other';
  location?: string;
  occupation?: string;
  interests?: string[];
  deviceType?: string;
}

/**
 * Onboarding问卷结果
 */
export interface OnboardingResult {
  userId: string;
  favoriteCategories: string[];
  contentStyles: string[];
  preferredTime: string;
  experience: 'beginner' | 'intermediate' | 'expert';
  goals: string[];
  completedAt: string;
}

/**
 * 冷启动推荐配置
 */
export interface ColdStartConfig {
  // 探索-利用参数
  explorationRate: number;      // 探索比例 (0-1)
  minExplorationItems: number;  // 最少探索项数
  
  // 人口属性权重
  demographicWeight: number;    // 人口属性权重
  
  // 热门兜底
  trendingBackup: boolean;      // 是否使用热门兜底
  trendingWeight: number;       // 热门内容权重
  
  // 新内容策略
  newContentBoost: number;      // 新内容提升倍数
  newContentMaxAge: number;     // 新内容最大年龄(小时)
}

/**
 * 内容质量预评估结果
 */
export interface ContentQualityAssessment {
  contentId: string;
  qualityScore: number;         // 质量分数 (0-100)
  completenessScore: number;    // 完整度分数
  visualQualityScore: number;   // 视觉质量分数
  textQualityScore: number;     // 文本质量分数
  predictedEngagement: number;  // 预测互动率
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * 小流量测试结果
 */
export interface SmallTrafficTest {
  contentId: string;
  testStartTime: string;
  testEndTime?: string;
  exposureCount: number;        // 曝光数
  clickCount: number;           // 点击数
  likeCount: number;            // 点赞数
  ctr: number;                  // 点击率
  engagementRate: number;       // 互动率
  status: 'testing' | 'passed' | 'failed' | 'expanded';
}

// ============================================
// 冷启动服务
// ============================================

class ColdStartService extends EventEmitter {
  // 默认配置
  private config: ColdStartConfig = {
    explorationRate: 0.3,         // 30%探索
    minExplorationItems: 3,       // 最少3个探索项
    demographicWeight: 0.4,       // 人口属性权重40%
    trendingBackup: true,         // 启用热门兜底
    trendingWeight: 0.3,          // 热门权重30%
    newContentBoost: 1.5,         // 新内容提升1.5倍
    newContentMaxAge: 72          // 72小时内算新内容
  };

  // 人口属性-分类映射表
  private demographicCategoryMap: Map<string, string[]> = new Map([
    ['teenager', ['trending', 'creative', 'fun']],
    ['young_adult', ['tech', 'design', 'lifestyle']],
    ['middle_aged', ['business', 'culture', 'education']],
    ['senior', ['culture', 'history', 'traditional']],
    ['student', ['education', 'creative', 'trending']],
    ['professional', ['business', 'tech', 'design']],
    ['artist', ['art', 'creative', 'design']]
  ]);

  // 小流量测试缓存
  private smallTrafficTests: Map<string, SmallTrafficTest> = new Map();

  constructor() {
    super();
  }

  // ============================================
  // 新用户冷启动策略
  // ============================================

  /**
   * 生成新用户推荐
   * 结合onboarding、人口属性和探索策略
   */
  public async generateNewUserRecommendations(
    userId: string,
    demographics?: UserDemographics,
    onboarding?: OnboardingResult
  ): Promise<{
    items: Array<{
      id: string;
      type: string;
      score: number;
      reason: string;
      strategy: 'onboarding' | 'demographic' | 'exploration' | 'trending';
    }>;
    strategies: string[];
  }> {
    const recommendations: Array<{
      id: string;
      type: string;
      score: number;
      reason: string;
      strategy: 'onboarding' | 'demographic' | 'exploration' | 'trending';
    }> = [];
    const usedStrategies: string[] = [];

    // 1. Onboarding推荐（最高优先级）
    if (onboarding && onboarding.favoriteCategories.length > 0) {
      const onboardingRecs = await this.getOnboardingRecommendations(onboarding);
      recommendations.push(...onboardingRecs);
      usedStrategies.push('onboarding');
    }

    // 2. 人口属性推荐
    if (demographics) {
      const demographicRecs = await this.getDemographicRecommendations(demographics);
      recommendations.push(...demographicRecs);
      usedStrategies.push('demographic');
    }

    // 3. 探索项（Epsilon-Greedy策略）
    const explorationRecs = await this.getExplorationRecommendations();
    recommendations.push(...explorationRecs);
    usedStrategies.push('exploration');

    // 4. 热门兜底
    if (this.config.trendingBackup) {
      const trendingRecs = await this.getTrendingBackupRecommendations();
      recommendations.push(...trendingRecs);
      usedStrategies.push('trending');
    }

    // 去重并排序
    const uniqueRecs = this.deduplicateRecommendations(recommendations);
    const sortedRecs = this.balanceExploitationExploration(uniqueRecs);

    return {
      items: sortedRecs,
      strategies: usedStrategies
    };
  }

  /**
   * 基于Onboarding的推荐
   */
  private async getOnboardingRecommendations(
    onboarding: OnboardingResult
  ): Promise<Array<any>> {
    const { favoriteCategories, contentStyles, experience } = onboarding;
    
    // 根据经验水平调整推荐策略
    const difficultyFilter = this.getDifficultyFilter(experience);
    
    // 查询匹配的内容
    const { data: works, error } = await supabase
      .from('works')
      .select('id, category, tags, difficulty, likes, views')
      .in('category', favoriteCategories)
      .limit(20);

    if (error || !works) return [];

    return works.map(work => ({
      id: work.id,
      type: 'post',
      score: 80 + Math.random() * 15, // 高基础分数
      reason: `基于你选择的${work.category}兴趣`,
      strategy: 'onboarding' as const
    }));
  }

  /**
   * 基于人口属性的推荐
   */
  private async getDemographicRecommendations(
    demographics: UserDemographics
  ): Promise<Array<any>> {
    const categories = this.inferCategoriesFromDemographics(demographics);
    
    const { data: works, error } = await supabase
      .from('works')
      .select('id, category, likes, views')
      .in('category', categories)
      .limit(15);

    if (error || !works) return [];

    return works.map(work => ({
      id: work.id,
      type: 'post',
      score: 60 + Math.random() * 20,
      reason: '适合你的年龄段和兴趣',
      strategy: 'demographic' as const
    }));
  }

  /**
   * 从人口属性推断分类偏好
   */
  private inferCategoriesFromDemographics(demographics: UserDemographics): string[] {
    const categories: string[] = [];

    // 根据年龄推断
    if (demographics.age !== undefined) {
      if (demographics.age < 18) {
        categories.push(...this.demographicCategoryMap.get('teenager') || []);
      } else if (demographics.age < 30) {
        categories.push(...this.demographicCategoryMap.get('young_adult') || []);
      } else if (demographics.age < 50) {
        categories.push(...this.demographicCategoryMap.get('middle_aged') || []);
      } else {
        categories.push(...this.demographicCategoryMap.get('senior') || []);
      }
    }

    // 根据职业推断
    if (demographics.occupation) {
      const occupationCategories = this.demographicCategoryMap.get(demographics.occupation);
      if (occupationCategories) {
        categories.push(...occupationCategories);
      }
    }

    // 根据兴趣推断
    if (demographics.interests) {
      categories.push(...demographics.interests);
    }

    // 去重并返回
    return [...new Set(categories)];
  }

  /**
   * 探索推荐（发现新兴趣）
   */
  private async getExplorationRecommendations(): Promise<Array<any>> {
    // 随机选择不同分类的内容
    const { data: works, error } = await supabase
      .from('works')
      .select('id, category, likes, views')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !works) return [];

    // 随机打乱并选择
    const shuffled = works.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, this.config.minExplorationItems);

    return selected.map(work => ({
      id: work.id,
      type: 'post',
      score: 40 + Math.random() * 20,
      reason: '发现新兴趣',
      strategy: 'exploration' as const
    }));
  }

  /**
   * 热门兜底推荐
   */
  private async getTrendingBackupRecommendations(): Promise<Array<any>> {
    const { data: works, error } = await supabase
      .from('works')
      .select('id, category, likes, views')
      .order('likes', { ascending: false })
      .limit(10);

    if (error || !works) return [];

    return works.map(work => ({
      id: work.id,
      type: 'post',
      score: 50,
      reason: '热门内容',
      strategy: 'trending' as const
    }));
  }

  /**
   * 平衡探索与利用
   * Epsilon-Greedy策略
   */
  private balanceExploitationExploration(
    items: Array<any>
  ): Array<any> {
    const explorationCount = Math.max(
      this.config.minExplorationItems,
      Math.floor(items.length * this.config.explorationRate)
    );

    // 分离探索项和利用项
    const explorationItems = items.filter(item => item.strategy === 'exploration');
    const exploitationItems = items.filter(item => item.strategy !== 'exploration');

    // 排序利用项（按分数）
    exploitationItems.sort((a, b) => b.score - a.score);

    // 混合策略：前N个位置插入探索项
    const result: Array<any> = [];
    const exploitationCount = items.length - explorationCount;

    for (let i = 0; i < items.length; i++) {
      if (i < explorationCount && explorationItems[i]) {
        result.push(explorationItems[i]);
      } else if (exploitationItems[i - explorationCount]) {
        result.push(exploitationItems[i - explorationCount]);
      }
    }

    return result;
  }

  /**
   * 去重推荐
   */
  private deduplicateRecommendations(
    items: Array<any>
  ): Array<any> {
    const seen = new Set<string>();
    return items.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  /**
   * 获取难度过滤器
   */
  private getDifficultyFilter(experience: string): string[] {
    switch (experience) {
      case 'beginner':
        return ['easy', 'beginner'];
      case 'intermediate':
        return ['easy', 'medium', 'intermediate'];
      case 'expert':
        return ['medium', 'hard', 'expert'];
      default:
        return ['easy', 'medium'];
    }
  }

  // ============================================
  // 新内容冷启动策略
  // ============================================

  /**
   * 评估新内容质量
   */
  public async assessContentQuality(content: {
    id: string;
    title?: string;
    description?: string;
    tags?: string[];
    images?: string[];
    category?: string;
    authorId?: string;
  }): Promise<ContentQualityAssessment> {
    // 1. 完整度评估
    const completenessScore = this.assessCompleteness(content);

    // 2. 视觉质量评估（简化版）
    const visualQualityScore = this.assessVisualQuality(content);

    // 3. 文本质量评估
    const textQualityScore = this.assessTextQuality(content);

    // 4. 预测互动率
    const predictedEngagement = this.predictEngagement(content);

    // 5. 计算综合质量分
    const qualityScore = (
      completenessScore * 0.3 +
      visualQualityScore * 0.2 +
      textQualityScore * 0.2 +
      predictedEngagement * 0.3
    );

    // 6. 风险评估
    const riskLevel = this.assessRisk(content, qualityScore);

    return {
      contentId: content.id,
      qualityScore,
      completenessScore,
      visualQualityScore,
      textQualityScore,
      predictedEngagement,
      riskLevel
    };
  }

  /**
   * 评估内容完整度
   */
  private assessCompleteness(content: any): number {
    let score = 0;
    let total = 0;

    // 标题
    if (content.title && content.title.length > 5) {
      score += 20;
    }
    total += 20;

    // 描述
    if (content.description && content.description.length > 20) {
      score += 20;
    }
    total += 20;

    // 标签
    if (content.tags && content.tags.length >= 3) {
      score += 20;
    } else if (content.tags && content.tags.length > 0) {
      score += 10;
    }
    total += 20;

    // 图片
    if (content.images && content.images.length >= 3) {
      score += 20;
    } else if (content.images && content.images.length > 0) {
      score += 10;
    }
    total += 20;

    // 分类
    if (content.category) {
      score += 20;
    }
    total += 20;

    return (score / total) * 100;
  }

  /**
   * 评估视觉质量（简化版）
   */
  private assessVisualQuality(content: any): number {
    // 简化实现：基于图片数量和格式
    let score = 50; // 基础分

    if (content.images) {
      // 图片数量加分
      score += Math.min(content.images.length * 10, 30);

      // 检查图片格式
      const hasHighQuality = content.images.some((img: string) => 
        img.includes('.jpg') || img.includes('.png')
      );
      if (hasHighQuality) score += 20;
    }

    return Math.min(score, 100);
  }

  /**
   * 评估文本质量
   */
  private assessTextQuality(content: any): number {
    let score = 50;

    // 标题长度
    if (content.title) {
      if (content.title.length >= 10 && content.title.length <= 50) {
        score += 20;
      }
    }

    // 描述长度
    if (content.description) {
      if (content.description.length >= 50) {
        score += 20;
      }
    }

    // 标签质量
    if (content.tags && content.tags.length >= 3) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * 预测互动率
   */
  private predictEngagement(content: any): number {
    // 基于历史数据和内容特征预测
    // 简化实现
    let score = 50;

    // 有图片的内容通常互动率更高
    if (content.images && content.images.length > 0) {
      score += 15;
    }

    // 有描述的内容
    if (content.description && content.description.length > 50) {
      score += 15;
    }

    // 有标签的内容
    if (content.tags && content.tags.length >= 3) {
      score += 10;
    }

    // 热门分类加分
    const hotCategories = ['trending', 'creative', 'design'];
    if (content.category && hotCategories.includes(content.category)) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * 风险评估
   */
  private assessRisk(content: any, qualityScore: number): 'low' | 'medium' | 'high' {
    // 质量分低于40为高风险
    if (qualityScore < 40) return 'high';
    
    // 质量分40-70为中风险
    if (qualityScore < 70) return 'medium';
    
    // 质量分70以上为低风险
    return 'low';
  }

  /**
   * 开始小流量测试
   */
  public async startSmallTrafficTest(contentId: string): Promise<SmallTrafficTest> {
    const test: SmallTrafficTest = {
      contentId,
      testStartTime: new Date().toISOString(),
      exposureCount: 0,
      clickCount: 0,
      likeCount: 0,
      ctr: 0,
      engagementRate: 0,
      status: 'testing'
    };

    this.smallTrafficTests.set(contentId, test);

    // 保存到数据库
    await supabase.from('content_traffic_tests').insert({
      content_id: contentId,
      test_start_time: test.testStartTime,
      status: 'testing'
    });

    this.emit('testStarted', test);

    return test;
  }

  /**
   * 更新小流量测试数据
   */
  public async updateTestMetrics(
    contentId: string,
    metrics: { exposure?: number; click?: number; like?: number }
  ): Promise<void> {
    const test = this.smallTrafficTests.get(contentId);
    if (!test) return;

    // 更新指标
    if (metrics.exposure) test.exposureCount += metrics.exposure;
    if (metrics.click) test.clickCount += metrics.click;
    if (metrics.like) test.likeCount += metrics.like;

    // 计算比率
    test.ctr = test.exposureCount > 0 ? test.clickCount / test.exposureCount : 0;
    test.engagementRate = test.exposureCount > 0 ? 
      (test.clickCount + test.likeCount) / test.exposureCount : 0;

    // 检查是否达到测试标准
    await this.evaluateTest(contentId);
  }

  /**
   * 评估测试结果
   */
  private async evaluateTest(contentId: string): Promise<void> {
    const test = this.smallTrafficTests.get(contentId);
    if (!test || test.status !== 'testing') return;

    // 至少需要100次曝光
    if (test.exposureCount < 100) return;

    // 评估标准
    const passed = test.ctr > 0.05 && test.engagementRate > 0.08;

    if (passed) {
      test.status = 'passed';
      await this.expandExposure(contentId);
    } else {
      test.status = 'failed';
    }

    test.testEndTime = new Date().toISOString();

    // 更新数据库
    await supabase.from('content_traffic_tests').update({
      status: test.status,
      test_end_time: test.testEndTime,
      ctr: test.ctr,
      engagement_rate: test.engagementRate
    }).eq('content_id', contentId);

    this.emit('testCompleted', test);
  }

  /**
   * 扩大内容曝光
   */
  private async expandExposure(contentId: string): Promise<void> {
    const test = this.smallTrafficTests.get(contentId);
    if (!test) return;

    test.status = 'expanded';

    // 更新内容状态
    await supabase.from('works').update({
      status: 'expanded',
      boosted_score: 1.5
    }).eq('id', contentId);

    this.emit('exposureExpanded', { contentId, test });
  }

  /**
   * 获取新内容推荐（带冷启动优化）
   */
  public async getNewContentRecommendations(
    limit: number = 10
  ): Promise<Array<any>> {
    const maxAge = new Date(Date.now() - this.config.newContentMaxAge * 60 * 60 * 1000);

    // 获取通过测试的新内容
    const { data: works, error } = await supabase
      .from('works')
      .select('id, category, created_at, likes, views')
      .gte('created_at', maxAge.toISOString())
      .in('status', ['expanded', 'testing'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !works) return [];

    return works.map(work => ({
      id: work.id,
      type: 'post',
      score: (work.likes || 0) * this.config.newContentBoost,
      reason: '新鲜内容',
      isNewContent: true
    }));
  }

  // ============================================
  // 公共API
  // ============================================

  /**
   * 检查用户是否为新用户
   */
  public async isNewUser(userId: string): Promise<boolean> {
    // 检查用户行为数
    const { count, error } = await supabase
      .from('user_behavior_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) return true;

    // 行为数少于5认为是新用户
    return (count || 0) < 5;
  }

  /**
   * 检查内容是否为新内容
   */
  public isNewContent(createdAt: string): boolean {
    const age = Date.now() - new Date(createdAt).getTime();
    return age < this.config.newContentMaxAge * 60 * 60 * 1000;
  }

  /**
   * 获取配置
   */
  public getConfig(): ColdStartConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<ColdStartConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取小流量测试列表
   */
  public getSmallTrafficTests(): SmallTrafficTest[] {
    return Array.from(this.smallTrafficTests.values());
  }
}

// ============================================
// 单例导出
// ============================================

export const coldStartService = new ColdStartService();

export default coldStartService;
