/**
 * 成就服务模块 - 提供创作成就相关功能
 */
import apiClient from '../lib/apiClient';
import { toast } from 'sonner';

// 创作者等级类型定义
export interface CreatorLevel {
  level: number;
  name: string;
  icon: string;
  requiredPoints: number;
  benefits: string[];
  权益?: string[]; // 保留中文属性以兼容旧代码
  description: string;
}

// 成就类型定义
export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'creation' | 'community' | 'special';
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
  totalLevels: number;
  levelUpNotifications: LevelUpNotification[];
}

// 等级提升通知类型
export interface LevelUpNotification {
  id: string;
  userId: string;
  fromLevel?: number;
  toLevel?: number;
  oldLevel?: number;
  newLevel?: number;
  points: number;
  notifiedAt: number;
  isRead?: boolean;
  createdAt?: number;
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
    { level: 1, name: '创作新手', icon: '🌱', requiredPoints: 0, benefits: ['基础创作工具', '作品发布权限', '社区评论权限', '每日签到奖励'], description: '刚刚开始创作之旅的新手' },
    { level: 2, name: '创作爱好者', icon: '✏️', requiredPoints: 100, benefits: ['高级创作工具', '模板库访问', '作品打赏权限', '积分商城9折'], description: '热爱创作的积极用户' },
    { level: 3, name: '创作达人', icon: '🌟', requiredPoints: 300, benefits: ['AI创意助手', '专属客服支持', '作品推广机会', '积分商城8折', '徽章解锁权限'], description: '创作能力突出的达人' },
    { level: 4, name: '创作精英', icon: '🏆', requiredPoints: 600, benefits: ['精英创作工具', '优先活动邀请', '作品商业化机会', '积分商城7折', '专属创作空间'], description: '创作领域的精英人物' },
    { level: 5, name: '创作大师', icon: '🎨', requiredPoints: 1000, benefits: ['大师创作工具', '线下活动邀请', '品牌合作机会', '积分商城6折', '大师认证标识'], description: '创作领域的大师级人物' },
    { level: 6, name: '创作宗师', icon: '👑', requiredPoints: 2000, benefits: ['宗师创作工具', '全球作品展示', '平台顾问身份', '积分商城5折', '定制化创作工具'], description: '创作界的宗师级人物' },
    { level: 7, name: '创作传奇', icon: '💎', requiredPoints: 5000, benefits: ['传奇创作工具', 'IP孵化支持', '平台荣誉殿堂', '积分商城4折', '专属商务合作'], description: '创作界的传奇人物' }
  ];

  // 等级提升通知数据
  private levelUpNotifications: LevelUpNotification[] = [];

  // 基础成就定义 (静态数据)
  private baseAchievements: Omit<Achievement, 'progress' | 'isUnlocked' | 'unlockedAt'>[] = [
    {
      id: 1,
      name: '初次创作',
      description: '完成第一篇创作作品',
      icon: 'star',
      rarity: 'common',
      category: 'creation',
      criteria: '完成1篇作品',
      points: 10
    },
    {
      id: 2,
      name: '活跃创作者',
      description: '连续7天登录平台',
      icon: 'fire',
      rarity: 'common',
      category: 'community',
      criteria: '连续登录7天',
      points: 20
    },
    {
      id: 3,
      name: '人气王',
      description: '获得100个点赞',
      icon: 'thumbs-up',
      rarity: 'rare',
      category: 'community',
      criteria: '获得100个点赞',
      points: 50
    },
    {
      id: 4,
      name: '文化传播者',
      description: '使用5种不同文化元素',
      icon: 'book',
      rarity: 'rare',
      category: 'creation',
      criteria: '使用5种不同文化元素',
      points: 40
    },
    {
      id: 5,
      name: '作品达人',
      description: '发布10篇作品',
      icon: 'image',
      rarity: 'rare',
      category: 'creation',
      criteria: '发布10篇作品',
      points: 80
    },
    {
      id: 6,
      name: '商业成功',
      description: '作品被品牌采纳',
      icon: 'handshake',
      rarity: 'epic',
      category: 'special',
      criteria: '作品被品牌采纳1次',
      points: 200
    },
    {
      id: 7,
      name: '传统文化大师',
      description: '精通传统文化知识',
      icon: 'graduation-cap',
      rarity: 'legendary',
      category: 'special',
      criteria: '完成10个文化知识问答',
      points: 300
    },
    // 创作成就 - 普通
    {
      id: 8,
      name: '创作新手',
      description: '发布3篇作品',
      icon: 'pen-tool',
      rarity: 'common',
      category: 'creation',
      criteria: '发布3篇作品',
      points: 15
    },
    {
      id: 9,
      name: '多产作者',
      description: '发布50篇作品',
      icon: 'layers',
      rarity: 'rare',
      category: 'creation',
      criteria: '发布50篇作品',
      points: 100
    },
    {
      id: 10,
      name: '创作狂人',
      description: '发布100篇作品',
      icon: 'zap',
      rarity: 'epic',
      category: 'creation',
      criteria: '发布100篇作品',
      points: 200
    },
    {
      id: 11,
      name: '创作传奇',
      description: '发布500篇作品',
      icon: 'crown',
      rarity: 'legendary',
      category: 'creation',
      criteria: '发布500篇作品',
      points: 1000
    },
    // 社区成就 - 普通
    {
      id: 12,
      name: '点赞新手',
      description: '获得10个点赞',
      icon: 'heart',
      rarity: 'common',
      category: 'community',
      criteria: '获得10个点赞',
      points: 10
    },
    {
      id: 13,
      name: '受欢迎',
      description: '获得500个点赞',
      icon: 'award',
      rarity: 'rare',
      category: 'community',
      criteria: '获得500个点赞',
      points: 80
    },
    {
      id: 14,
      name: '超级明星',
      description: '获得1000个点赞',
      icon: 'star',
      rarity: 'epic',
      category: 'community',
      criteria: '获得1000个点赞',
      points: 150
    },
    {
      id: 15,
      name: '评论达人',
      description: '发表评论50次',
      icon: 'message-circle',
      rarity: 'rare',
      category: 'community',
      criteria: '发表评论50次',
      points: 60
    },
    {
      id: 16,
      name: '收藏专家',
      description: '收藏100个作品',
      icon: 'bookmark',
      rarity: 'rare',
      category: 'community',
      criteria: '收藏100个作品',
      points: 70
    },
    {
      id: 17,
      name: '分享大使',
      description: '分享作品30次',
      icon: 'share-2',
      rarity: 'rare',
      category: 'community',
      criteria: '分享作品30次',
      points: 50
    },
    // 连续登录成就
    {
      id: 18,
      name: '坚持就是胜利',
      description: '连续登录30天',
      icon: 'calendar',
      rarity: 'rare',
      category: 'community',
      criteria: '连续登录30天',
      points: 100
    },
    {
      id: 19,
      name: '忠实用户',
      description: '连续登录100天',
      icon: 'calendar-check',
      rarity: 'epic',
      category: 'community',
      criteria: '连续登录100天',
      points: 300
    },
    {
      id: 20,
      name: '年度用户',
      description: '连续登录365天',
      icon: 'calendar-days',
      rarity: 'legendary',
      category: 'community',
      criteria: '连续登录365天',
      points: 1000
    },
    // AI创作成就
    {
      id: 21,
      name: 'AI探索者',
      description: '使用AI生成10张图片',
      icon: 'cpu',
      rarity: 'common',
      category: 'creation',
      criteria: '使用AI生成10张图片',
      points: 20
    },
    {
      id: 22,
      name: 'AI创作者',
      description: '使用AI生成100张图片',
      icon: 'sparkles',
      rarity: 'rare',
      category: 'creation',
      criteria: '使用AI生成100张图片',
      points: 100
    },
    {
      id: 23,
      name: '视频创作者',
      description: '发布10个视频作品',
      icon: 'video',
      rarity: 'rare',
      category: 'creation',
      criteria: '发布10个视频作品',
      points: 80
    },
    {
      id: 24,
      name: '视频大师',
      description: '发布50个视频作品',
      icon: 'film',
      rarity: 'epic',
      category: 'creation',
      criteria: '发布50个视频作品',
      points: 250
    },
    // 特殊成就
    {
      id: 25,
      name: '文化守护者',
      description: '使用10种不同文化元素',
      icon: 'shield',
      rarity: 'epic',
      category: 'special',
      criteria: '使用10种不同文化元素',
      points: 150
    },
    {
      id: 26,
      name: '津门传承者',
      description: '创作20个天津文化相关作品',
      icon: 'landmark',
      rarity: 'epic',
      category: 'special',
      criteria: '创作20个天津文化相关作品',
      points: 200
    },
    {
      id: 27,
      name: '完美主义者',
      description: '获得10个作品评分超过90分',
      icon: 'target',
      rarity: 'epic',
      category: 'special',
      criteria: '获得10个作品评分超过90分',
      points: 180
    },
    {
      id: 28,
      name: '社交达人',
      description: '获得100个粉丝',
      icon: 'users',
      rarity: 'rare',
      category: 'community',
      criteria: '获得100个粉丝',
      points: 100
    },
    {
      id: 29,
      name: '意见领袖',
      description: '获得1000个粉丝',
      icon: 'user-check',
      rarity: 'epic',
      category: 'community',
      criteria: '获得1000个粉丝',
      points: 300
    },
    {
      id: 30,
      name: '津脉之星',
      description: '登上排行榜前10名',
      icon: 'trophy',
      rarity: 'legendary',
      category: 'special',
      criteria: '登上排行榜前10名',
      points: 500
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
  
  // 上次的等级，用于检测等级变化
  private lastLevel: number = 1;

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
    this.lastLevel = 1;
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
        // 保存旧积分和等级
        const oldPoints = this.userPoints;
        const oldLevel = this.lastLevel;
        
        // 更新积分数据，确保total是数字
        this.userPoints = typeof response.data.total === 'number' ? response.data.total : 0;
        this.pointsRecords = response.data.records.map(r => {
          // 处理日期格式兼容性
          let timestamp: number;
          if (typeof r.created_at === 'string') {
            // 如果是 ISO 日期字符串，直接解析
            timestamp = new Date(r.created_at).getTime();
          } else if (typeof r.created_at === 'number') {
            // 如果已经是数字（毫秒时间戳）
            timestamp = r.created_at;
          } else {
            // 默认值
            timestamp = Date.now();
          }
          
          return {
            id: r.id,
            source: r.source,
            type: r.type as any,
            points: r.points,
            date: new Date(timestamp).toISOString().split('T')[0],
            description: r.description,
            balanceAfter: r.balance_after,
            created_at: timestamp
          };
        });
        
        // 检测等级变化
        const newLevelInfo = this.getCreatorLevelInfo();
        this.lastLevel = newLevelInfo.currentLevel.level;
        
        // 如果等级提升，显示通知
        if (newLevelInfo.currentLevel.level > oldLevel) {
          this.showLevelUpNotification(newLevelInfo.currentLevel);
        }
      }
    } catch (error) {
      console.error('Fetch points stats failed:', error);
      // 确保在获取失败时，积分值为0
      this.userPoints = 0;
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

  // 更新成就进度 - 调用后端API
  async updateAchievementProgress(id: number, progress: number): Promise<boolean> {
    try {
      const achievement = this.getAchievementById(id);
      if (!achievement || achievement.isUnlocked) {
        return false;
      }

      // 调用后端API更新进度
      const response = await apiClient.post<{ unlocked: boolean; achievement?: Achievement }>(
        `/api/user/achievements/${id}/progress`,
        { progress }
      );

      if (response.ok && response.data) {
        // 更新本地数据
        const updatedAchievement = this.achievements.find(a => a.id === id);
        if (updatedAchievement) {
          updatedAchievement.progress = Math.min(progress, 100);
          
          // 如果后端返回已解锁，更新解锁状态
          if (response.data.unlocked) {
            updatedAchievement.isUnlocked = true;
            updatedAchievement.unlockedAt = new Date().toISOString().split('T')[0];
            
            // 显示解锁通知
            toast.success(
              `🏆 解锁成就：${updatedAchievement.name}`,
              {
                description: updatedAchievement.description,
                duration: 5000,
              }
            );
            
            // 刷新积分数据（后端会自动添加成就积分）
            await this.fetchPointsStats();
            
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Update achievement progress failed:', error);
      // 网络失败时回退到本地更新
      return this.updateAchievementProgressLocal(id, progress);
    }
  }

  // 本地更新成就进度（回退方案）
  private updateAchievementProgressLocal(id: number, progress: number): boolean {
    const achievement = this.getAchievementById(id);
    if (achievement && !achievement.isUnlocked) {
      achievement.progress = Math.min(progress, 100);
      
      // 如果进度达到100%，解锁成就
      if (achievement.progress >= 100) {
        achievement.isUnlocked = true;
        achievement.unlockedAt = new Date().toISOString().split('T')[0];
        return true;
      }
    }
    return false;
  }

  // 批量更新成就进度
  async updateMultipleAchievements(updates: Array<{id: number, progress: number}>): Promise<Array<number>> {
    const newlyUnlocked: Array<number> = [];
    
    for (const update of updates) {
      const unlocked = await this.updateAchievementProgress(update.id, update.progress);
      if (unlocked) {
        newlyUnlocked.push(update.id);
      }
    }
    
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
    return Math.max(0, this.userPoints);
  }

  // 获取创作者等级信息
  getCreatorLevelInfo(userId: string = 'current'): CreatorLevelInfo {
    const currentPoints = this.calculateUserPoints();
    
    // 找到当前等级和下一个等级
    let currentLevel: CreatorLevel = this.creatorLevels[0];
    let nextLevel: CreatorLevel | null = null;
    let currentLevelIndex = 0;
    
    // 遍历所有等级，找到当前等级和其索引
    for (let i = 0; i < this.creatorLevels.length; i++) {
      if (currentPoints >= this.creatorLevels[i].requiredPoints) {
        currentLevel = this.creatorLevels[i];
        currentLevelIndex = i;
      } else {
        break;
      }
    }
    
    // 找到下一个等级
    if (currentLevelIndex < this.creatorLevels.length - 1) {
      nextLevel = this.creatorLevels[currentLevelIndex + 1];
    }
    
    // 计算升级进度
    let pointsToNextLevel = 0;
    let levelProgress = 0;
    
    if (nextLevel) {
      pointsToNextLevel = nextLevel.requiredPoints - currentPoints;
      const levelRange = nextLevel.requiredPoints - currentLevel.requiredPoints;
      // 确保进度计算正确，当currentPoints等于currentLevel.requiredPoints时，进度为0%
      levelProgress = Math.min(100, Math.max(0, Math.round(((currentPoints - currentLevel.requiredPoints) / levelRange) * 100)));
    } else {
      pointsToNextLevel = 0;
      levelProgress = 100;
    }
    
    // 获取用户的等级提升通知
    const userNotifications = this.levelUpNotifications.filter(
      notification => notification.userId === userId
    ).sort((a, b) => b.notifiedAt - a.notifiedAt);

    return {
      currentLevel,
      nextLevel,
      currentPoints,
      pointsToNextLevel,
      levelProgress,
      totalLevels: this.creatorLevels.length,
      levelUpNotifications: userNotifications
    };
  }

  // 记录等级提升通知
  private recordLevelUpNotification(userId: string, fromLevel: number, toLevel: number, points: number): LevelUpNotification {
    const notification: LevelUpNotification = {
      id: `level-up-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      fromLevel,
      toLevel,
      points,
      notifiedAt: Date.now(),
      isRead: false,
      createdAt: Date.now()
    };

    this.levelUpNotifications.push(notification);
    return notification;
  }

  // 标记等级提升通知为已读
  markLevelUpNotificationAsRead(notificationId: string): boolean {
    const notification = this.levelUpNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      return true;
    }
    return false;
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
  
  // 显示等级提升通知
  private showLevelUpNotification(level: CreatorLevel): void {
    toast.success(
      `🎉 等级提升！`,
      {
        description: `恭喜您升级为${level.icon} ${level.name}`,
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        },
        icon: level.icon,
      }
    );
  }
}

// 导出单例实例
const service = new AchievementService();
export default service;