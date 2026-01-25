/**
 * 成就服务模块 - 提供创作成就相关功能
 */
import apiClient from '../lib/apiClient';

// 创作者等级类型定义
export interface CreatorLevel {
  level: number;
  name: string;
  icon: string;
  requiredPoints: number;
  权益: string[];
  description: string;
}

// 成就类型定义
export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  criteria: string;
  progress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  points: number; // 成就对应的积分
}

// 创作者等级信息
export interface CreatorLevelInfo {
  currentLevel: CreatorLevel;
  nextLevel: CreatorLevel | null;
  currentPoints: number;
  pointsToNextLevel: number;
  levelProgress: number; // 0-100%
}

// 积分记录类型定义
export interface PointsRecord {
  id: number;
  source: string;
  type: 'achievement' | 'task' | 'daily' | 'consumption' | 'exchange' | 'system';
  points: number;
  date: string;
  description: string;
  relatedId?: string;
  balanceAfter: number;
  created_at?: number; // 后端返回的时间戳
}

// 积分来源统计类型定义
export interface PointsSourceStats {
  achievement: number;
  task: number;
  daily: number;
  consumption: number;
  exchange: number;
  other: number;
}

// 消费记录类型
export interface ConsumptionRecord {
  id: number;
  amount: number;
  pointsEarned: number;
  pointsUsed: number;
  finalAmount: number;
  date: string;
  description: string;
  relatedId?: string;
}

// 成就服务类
class AchievementService {
  // 创作者等级数据
  private creatorLevels: CreatorLevel[] = [
    { level: 1, name: '创作新手', icon: '🌱', requiredPoints: 0, 权益: ['基础创作工具', '作品发布权限', '社区评论权限'], description: '刚刚开始创作之旅的新手' },
    { level: 2, name: '创作爱好者', icon: '✏️', requiredPoints: 100, 权益: ['高级创作工具', '模板库访问', '作品打赏权限'], description: '热爱创作的积极用户' },
    { level: 3, name: '创作达人', icon: '🌟', requiredPoints: 300, 权益: ['AI创意助手', '专属客服支持', '作品推广机会'], description: '创作能力突出的达人' },
    { level: 4, name: '创作大师', icon: '🎨', requiredPoints: 800, 权益: ['限量模板使用权', '线下活动邀请', '品牌合作机会'], description: '创作领域的大师级人物' },
    { level: 5, name: '创作传奇', icon: '👑', requiredPoints: 2000, 权益: ['平台荣誉认证', '定制化创作工具', 'IP孵化支持'], description: '创作界的传奇人物' }
  ];

  // 基础成就定义 (静态数据)
  private baseAchievements: Omit<Achievement, 'progress' | 'isUnlocked' | 'unlockedAt'>[] = [
    {
      id: 1,
      name: '初次创作',
      description: '完成第一篇创作作品',
      icon: 'star',
      rarity: 'common',
      criteria: '完成1篇作品',
      points: 10
    },
    {
      id: 2,
      name: '活跃创作者',
      description: '连续7天登录平台',
      icon: 'fire',
      rarity: 'common',
      criteria: '连续登录7天',
      points: 20
    },
    {
      id: 3,
      name: '人气王',
      description: '获得100个点赞',
      icon: 'thumbs-up',
      rarity: 'rare',
      criteria: '获得100个点赞',
      points: 50
    },
    {
      id: 4,
      name: '文化传播者',
      description: '使用5种不同文化元素',
      icon: 'book',
      rarity: 'rare',
      criteria: '使用5种不同文化元素',
      points: 40
    },
    {
      id: 5,
      name: '作品达人',
      description: '发布10篇作品',
      icon: 'image',
      rarity: 'rare',
      criteria: '发布10篇作品',
      points: 80
    },
    {
      id: 6,
      name: '商业成功',
      description: '作品被品牌采纳',
      icon: 'handshake',
      rarity: 'epic',
      criteria: '作品被品牌采纳1次',
      points: 200
    },
    {
      id: 7,
      name: '传统文化大师',
      description: '精通传统文化知识',
      icon: 'graduation-cap',
      rarity: 'legendary',
      criteria: '完成10个文化知识问答',
      points: 300
    }
  ];

  // 运行时成就数据
  private achievements: Achievement[] = [];

  // 积分记录数据
  public pointsRecords: PointsRecord[] = [];

  // 消费记录数据
  private consumptionRecords: ConsumptionRecord[] = [];

  // 用户积分数据
  private userPoints: number = 0;
  
  // 消费金额兑换积分比例
  private readonly CASH_TO_POINTS_RATIO = 1; // 1元 = 1积分
  
  // 积分抵扣消费比例
  private readonly POINTS_TO_CASH_RATIO = 100; // 100积分 = 1元
  
  // 单次消费最大抵扣比例
  private readonly MAX_DISCOUNT_RATIO = 0.3; // 30%

  private initialized = false;

  constructor() {
    this.resetState();
  }

  // 重置状态为初始值（未解锁任何成就，0积分）
  private resetState() {
    this.achievements = this.baseAchievements.map(a => ({
      ...a,
      progress: 0,
      isUnlocked: false
    }));
    this.pointsRecords = [];
    this.userPoints = 0;
  }

  // 初始化数据（从后端获取）
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await Promise.all([
        this.fetchUserAchievements(),
        this.fetchPointsStats()
      ]);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize achievement service:', error);
      // Fallback to empty state is already done in constructor
    }
  }

  // 从服务器获取用户成就
  async fetchUserAchievements(): Promise<Achievement[]> {
    try {
      const response = await apiClient.get<any[]>('/api/user/achievements');
      if (response.ok && response.data) {
        // 合并后端数据
        const userAchievements = response.data;
        this.achievements = this.baseAchievements.map(base => {
          const userAch = userAchievements.find((ua: any) => ua.achievement_id === base.id);
          return {
            ...base,
            progress: userAch ? userAch.progress : 0,
            isUnlocked: userAch ? !!userAch.is_unlocked : false,
            unlockedAt: userAch && userAch.unlocked_at ? new Date(Number(userAch.unlocked_at)).toISOString().split('T')[0] : undefined
          };
        });
      }
      return this.achievements;
    } catch (error) {
      console.error('Fetch user achievements failed:', error);
      return this.achievements;
    }
  }

  // 从服务器获取积分统计
  async fetchPointsStats(): Promise<void> {
    try {
      const response = await apiClient.get<{ total: number, records: any[] }>('/api/user/points');
      if (response.ok && response.data) {
        this.userPoints = response.data.total;
        this.pointsRecords = response.data.records.map(r => ({
          id: r.id,
          source: r.source,
          type: r.type as any,
          points: r.points,
          date: new Date(Number(r.created_at)).toISOString().split('T')[0],
          description: r.description,
          balanceAfter: r.balance_after,
          created_at: Number(r.created_at)
        }));
      }
    } catch (error) {
      console.error('Fetch points stats failed:', error);
    }
  }

  // 领取积分/签到
  async claimPoints(type: string, source: string, points: number, description: string): Promise<boolean> {
    try {
      const response = await apiClient.post<{ balance: number }>('/api/user/points/claim', {
        type,
        source,
        points,
        description
      });
      
      if (response.ok) {
        await this.fetchPointsStats(); // 刷新数据
        return true;
      }
      return false;
    } catch (error) {
      console.error('Claim points failed:', error);
      return false;
    }
  }
  
  // 获取所有成就
  getAllAchievements(): Achievement[] {
    return [...this.achievements];
  }

  // 获取已解锁的成就
  getUnlockedAchievements(): Achievement[] {
    return this.achievements.filter(achievement => achievement.isUnlocked);
  }

  // 获取未解锁的成就
  getLockedAchievements(): Achievement[] {
    return this.achievements.filter(achievement => !achievement.isUnlocked);
  }

  // 获取单个成就
  getAchievementById(id: number): Achievement | undefined {
    return this.achievements.find(achievement => achievement.id === id);
  }

  // 更新成就进度 (暂保留为本地模拟，实际应调用API)
  updateAchievementProgress(id: number, progress: number): boolean {
    // TODO: 调用后端API更新进度
    const achievement = this.getAchievementById(id);
    if (achievement && !achievement.isUnlocked) {
      achievement.progress = Math.min(progress, 100);
      
      // 如果进度达到100%，解锁成就
      if (achievement.progress >= 100) {
        achievement.isUnlocked = true;
        achievement.unlockedAt = new Date().toISOString().split('T')[0];
        // 实际上应该由后端触发积分添加
        // this.addPoints(achievement.points, 'achievement', achievement.name, `解锁成就：${achievement.name}`);
        return true;
      }
    }
    return false;
  }

  // 批量更新成就进度
  updateMultipleAchievements(updates: Array<{id: number, progress: number}>): Array<number> {
    const newlyUnlocked: Array<number> = [];
    
    updates.forEach(update => {
      const unlocked = this.updateAchievementProgress(update.id, update.progress);
      if (unlocked) {
        newlyUnlocked.push(update.id);
      }
    });
    
    return newlyUnlocked;
  }

  // 获取成就统计信息
  getAchievementStats(): {
    total: number;
    unlocked: number;
    locked: number;
    completionRate: number;
    recentUnlocks: Achievement[];
  } {
    const unlocked = this.getUnlockedAchievements();
    
    return {
      total: this.achievements.length,
      unlocked: unlocked.length,
      locked: this.achievements.length - unlocked.length,
      completionRate: this.achievements.length > 0 ? Math.round((unlocked.length / this.achievements.length) * 100) : 0,
      recentUnlocks: unlocked
        .sort((a, b) => new Date(b.unlockedAt || '').getTime() - new Date(a.unlockedAt || '').getTime())
        .slice(0, 3)
    };
  }

  // 获取成就稀有度分布
  getRarityDistribution(): {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
  } {
    const distribution = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0
    };
    
    this.achievements.forEach(achievement => {
      distribution[achievement.rarity]++;
    });
    
    return distribution;
  }

  // 计算用户总积分
  calculateUserPoints(): number {
    return this.userPoints;
  }

  // 获取创作者等级信息
  getCreatorLevelInfo(): CreatorLevelInfo {
    const currentPoints = this.calculateUserPoints();
    
    // 找到当前等级和下一个等级
    let currentLevel: CreatorLevel = this.creatorLevels[0];
    let nextLevel: CreatorLevel | null = null;
    
    for (let i = 0; i < this.creatorLevels.length; i++) {
      if (currentPoints >= this.creatorLevels[i].requiredPoints) {
        currentLevel = this.creatorLevels[i];
        if (i < this.creatorLevels.length - 1) {
          nextLevel = this.creatorLevels[i + 1];
        } else {
          nextLevel = null;
        }
      } else {
        break;
      }
    }
    
    // 计算升级进度
    let pointsToNextLevel = 0;
    let levelProgress = 0;
    
    if (nextLevel) {
      pointsToNextLevel = nextLevel.requiredPoints - currentPoints;
      const levelRange = nextLevel.requiredPoints - currentLevel.requiredPoints;
      levelProgress = Math.min(100, Math.round(((currentPoints - currentLevel.requiredPoints) / levelRange) * 100));
    } else {
      pointsToNextLevel = 0;
      levelProgress = 100;
    }
    
    return {
      currentLevel,
      nextLevel,
      currentPoints,
      pointsToNextLevel,
      levelProgress
    };
  }

  // 获取所有创作者等级
  getAllCreatorLevels(): CreatorLevel[] {
    return [...this.creatorLevels];
  }

  // 获取单个创作者等级
  getCreatorLevelByLevel(level: number): CreatorLevel | undefined {
    return this.creatorLevels.find(levelInfo => levelInfo.level === level);
  }

  // 根据积分获取创作者等级
  getCreatorLevelByPoints(points: number): CreatorLevel {
    let level = this.creatorLevels[0];
    
    for (const levelInfo of this.creatorLevels) {
      if (points >= levelInfo.requiredPoints) {
        level = levelInfo;
      }
    }
    
    return level;
  }

  // 获取积分来源统计
  getPointsSourceStats(): PointsSourceStats {
    const stats = {
      achievement: 0,
      task: 0,
      daily: 0,
      consumption: 0,
      exchange: 0,
      other: 0
    };

    this.pointsRecords.forEach(record => {
      // 将'system'类型映射到'other'
      const statKey = record.type in stats ? record.type : 'other';
      stats[statKey as keyof PointsSourceStats] += record.points;
    });

    return stats;
  }

  // 获取最近积分记录
  getRecentPointsRecords(limit: number = 5): PointsRecord[] {
    return [...this.pointsRecords]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  // 计算可获取的积分
  calculateAvailablePoints(): number {
    // 计算未解锁成就的积分
    const lockedAchievementsPoints = this.achievements
      .filter(achievement => !achievement.isUnlocked)
      .reduce((total, achievement) => total + achievement.points, 0);

    // 模拟任务可获取积分
    const availableTaskPoints = 300; // 邀请好友150 + 参与主题活动200

    // 模拟每日可获取积分（假设每天5分）
    const dailyPoints = 5;

    return lockedAchievementsPoints + availableTaskPoints + dailyPoints;
  }

  // 获取积分统计信息
  getPointsStats() {
    const currentPoints = this.calculateUserPoints();
    const availablePoints = this.calculateAvailablePoints();
    const totalPossiblePoints = currentPoints + availablePoints;
    const sourceStats = this.getPointsSourceStats();
    const recentRecords = this.getRecentPointsRecords();

    return {
      currentPoints,
      availablePoints,
      totalPossiblePoints,
      sourceStats,
      recentRecords
    };
  }

  // 添加积分 (内部辅助，实际上由后端控制)
  private addPoints(points: number, type: PointsRecord['type'], source: string, description: string, relatedId?: string): void {
    const currentPoints = this.calculateUserPoints();
    const newPoints = currentPoints + points;
    
    this.pointsRecords.push({
      id: this.pointsRecords.length + 1,
      source,
      type,
      points,
      date: new Date().toISOString().split('T')[0],
      description,
      relatedId,
      balanceAfter: newPoints
    });
    this.userPoints = newPoints;
  }

  // 消费金额兑换积分
  convertCashToPoints(amount: number, description: string = '消费兑换积分', relatedId?: string): number {
    const points = Math.floor(amount * this.CASH_TO_POINTS_RATIO);
    this.addPoints(points, 'consumption', '消费兑换', description, relatedId);
    return points;
  }

  // 计算积分抵扣金额
  calculatePointsDiscount(totalAmount: number, pointsToUse: number): {
    discountAmount: number;
    actualPointsUsed: number;
    finalAmount: number;
  } {
    // 计算最大可抵扣金额
    const maxDiscountAmount = totalAmount * this.MAX_DISCOUNT_RATIO;
    
    // 计算可使用的积分对应的金额
    const availableDiscountAmount = (pointsToUse / this.POINTS_TO_CASH_RATIO);
    
    // 实际抵扣金额（取最小值）
    const discountAmount = Math.min(maxDiscountAmount, availableDiscountAmount);
    
    // 实际使用的积分
    const actualPointsUsed = Math.floor(discountAmount * this.POINTS_TO_CASH_RATIO);
    
    // 最终支付金额
    const finalAmount = totalAmount - discountAmount;
    
    return {
      discountAmount,
      actualPointsUsed,
      finalAmount
    };
  }

  // 使用积分抵扣消费
  usePointsForDiscount(totalAmount: number, pointsToUse: number, description: string = '积分抵扣消费', relatedId?: string): {
    discountAmount: number;
    actualPointsUsed: number;
    finalAmount: number;
  } {
    const currentPoints = this.calculateUserPoints();
    
    // 检查积分是否足够
    if (pointsToUse > currentPoints) {
      throw new Error('积分不足');
    }
    
    const { discountAmount, actualPointsUsed, finalAmount } = this.calculatePointsDiscount(totalAmount, pointsToUse);
    
    // 扣除积分
    this.addPoints(-actualPointsUsed, 'exchange', '积分抵扣', description, relatedId);
    
    // 添加消费记录
    this.consumptionRecords.push({
      id: this.consumptionRecords.length + 1,
      amount: totalAmount,
      pointsEarned: Math.floor(finalAmount * this.CASH_TO_POINTS_RATIO),
      pointsUsed: actualPointsUsed,
      finalAmount,
      date: new Date().toISOString().split('T')[0],
      description,
      relatedId
    });
    
    // 消费获得积分
    if (this.consumptionRecords[this.consumptionRecords.length - 1].pointsEarned > 0) {
      this.addPoints(
        this.consumptionRecords[this.consumptionRecords.length - 1].pointsEarned,
        'consumption',
        '消费获得',
        `${description}，获得${this.consumptionRecords[this.consumptionRecords.length - 1].pointsEarned}积分`,
        relatedId
      );
    }
    
    return {
      discountAmount,
      actualPointsUsed,
      finalAmount
    };
  }

  // 获取积分记录（支持筛选和搜索）
  getPointsRecords(filter?: {
    startDate?: string;
    endDate?: string;
    type?: PointsRecord['type'];
    search?: string;
  }, limit: number = 20, offset: number = 0): PointsRecord[] {
    let filteredRecords = [...this.pointsRecords];
    
    if (filter) {
      // 按时间范围筛选
      if (filter.startDate) {
        const startDate = filter.startDate;
        filteredRecords = filteredRecords.filter(record => record.date >= startDate);
      }
      
      if (filter.endDate) {
        const endDate = filter.endDate;
        filteredRecords = filteredRecords.filter(record => record.date <= endDate);
      }
      
      // 按类型筛选
      if (filter.type) {
        filteredRecords = filteredRecords.filter(record => record.type === filter.type);
      }
      
      // 按关键词搜索
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredRecords = filteredRecords.filter(record => 
          record.source.toLowerCase().includes(searchLower) ||
          record.description.toLowerCase().includes(searchLower)
        );
      }
    }
    
    // 排序并分页
    return filteredRecords
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(offset, offset + limit);
  }

  // 获取消费记录
  getConsumptionRecords(limit: number = 20, offset: number = 0): ConsumptionRecord[] {
    return [...this.consumptionRecords]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(offset, offset + limit);
  }
}

// 导出单例实例
const service = new AchievementService();
export default service;