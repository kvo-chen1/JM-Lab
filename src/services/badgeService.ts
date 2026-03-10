/**
 * 徽章服务 - 提供徽章管理和发放功能
 */

// 徽章类型定义
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'achievement' | 'event' | 'social' | 'creativity' | 'special';
  points: number; // 获得徽章时奖励的积分
  criteria: string;
  isHidden: boolean; // 是否隐藏徽章
  isLimited: boolean; // 是否限时获取
  availableFrom?: number;
  availableUntil?: number;
  createdAt: number;
  updatedAt: number;
}

// 用户徽章类型定义
export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badgeName: string;
  obtainedAt: number;
  isEquipped: boolean;
  obtainedFrom?: string; // 获得来源
  createdAt: number;
  updatedAt: number;
}

// 徽章服务类
class BadgeService {
  private badges: Badge[] = [];
  private userBadges: UserBadge[] = [];
  private readonly BADGES_KEY = 'CREATIVE_BADGES';
  private readonly USER_BADGES_KEY = 'USER_BADGES';

  constructor() {
    this.loadBadges();
    this.loadUserBadges();
    this.initDefaultBadges();
  }

  /**
   * 初始化默认徽章
   */
  private initDefaultBadges() {
    const defaultBadges: Badge[] = [
      // 成就类徽章
      {
        id: 'badge-creative-newbie',
        name: '创作新手',
        description: '完成首次创作',
        icon: '🎨',
        rarity: 'common',
        category: 'achievement',
        points: 20,
        criteria: '完成首次创作',
        isHidden: false,
        isLimited: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'badge-content-creator',
        name: '内容创作者',
        description: '发布10篇作品',
        icon: '📝',
        rarity: 'rare',
        category: 'achievement',
        points: 50,
        criteria: '发布10篇作品',
        isHidden: false,
        isLimited: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'badge-popular-creator',
        name: '人气创作者',
        description: '作品获得100个点赞',
        icon: '⭐',
        rarity: 'epic',
        category: 'achievement',
        points: 100,
        criteria: '作品获得100个点赞',
        isHidden: false,
        isLimited: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'badge-master-creator',
        name: '创作大师',
        description: '发布50篇优质作品',
        icon: '👑',
        rarity: 'legendary',
        category: 'achievement',
        points: 200,
        criteria: '发布50篇优质作品',
        isHidden: false,
        isLimited: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      // 社交类徽章
      {
        id: 'badge-social-influencer',
        name: '社交达人',
        description: '分享作品获得50次转发',
        icon: '📤',
        rarity: 'rare',
        category: 'social',
        points: 60,
        criteria: '分享作品获得50次转发',
        isHidden: false,
        isLimited: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'badge-community-helper',
        name: '社区助手',
        description: '发表100条有价值的评论',
        icon: '💬',
        rarity: 'epic',
        category: 'social',
        points: 80,
        criteria: '发表100条有价值的评论',
        isHidden: false,
        isLimited: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      // 活动类徽章
      {
        id: 'badge-event-participant',
        name: '活动参与者',
        description: '参与5次主题活动',
        icon: '🎉',
        rarity: 'common',
        category: 'event',
        points: 30,
        criteria: '参与5次主题活动',
        isHidden: false,
        isLimited: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'badge-event-winner',
        name: '活动优胜者',
        description: '在活动中获得前三名',
        icon: '🏆',
        rarity: 'epic',
        category: 'event',
        points: 150,
        criteria: '在活动中获得前三名',
        isHidden: false,
        isLimited: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      // 特殊类徽章
      {
        id: 'badge-platform-founder',
        name: '平台创始人',
        description: '平台早期用户',
        icon: '🔰',
        rarity: 'legendary',
        category: 'special',
        points: 100,
        criteria: '平台早期注册用户',
        isHidden: false,
        isLimited: true,
        availableUntil: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30天后结束
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    // 检查并添加默认徽章（如果不存在）
    defaultBadges.forEach(badge => {
      const exists = this.badges.some(b => b.id === badge.id);
      if (!exists) {
        this.badges.push(badge);
      }
    });

    this.saveBadges();
  }

  /**
   * 从本地存储加载徽章
   */
  private loadBadges() {
    try {
      const stored = localStorage.getItem(this.BADGES_KEY);
      if (stored) {
        this.badges = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load badges:', error);
      this.badges = [];
    }
  }

  /**
   * 保存徽章到本地存储
   */
  private saveBadges() {
    try {
      localStorage.setItem(this.BADGES_KEY, JSON.stringify(this.badges));
    } catch (error) {
      console.error('Failed to save badges:', error);
    }
  }

  /**
   * 从本地存储加载用户徽章
   */
  private loadUserBadges() {
    try {
      const stored = localStorage.getItem(this.USER_BADGES_KEY);
      if (stored) {
        this.userBadges = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load user badges:', error);
      this.userBadges = [];
    }
  }

  /**
   * 保存用户徽章到本地存储
   */
  private saveUserBadges() {
    try {
      localStorage.setItem(this.USER_BADGES_KEY, JSON.stringify(this.userBadges));
    } catch (error) {
      console.error('Failed to save user badges:', error);
    }
  }

  /**
   * 获取所有徽章
   */
  getAllBadges(showHidden: boolean = false): Badge[] {
    const now = Date.now();
    return this.badges.filter(badge => {
      // 检查是否显示隐藏徽章
      if (!showHidden && badge.isHidden) {
        return false;
      }
      
      // 检查是否在有效期内
      const isAvailable = (!badge.availableFrom || badge.availableFrom <= now) &&
                        (!badge.availableUntil || badge.availableUntil >= now);
      return isAvailable;
    });
  }

  /**
   * 根据分类获取徽章
   */
  getBadgesByCategory(category: Badge['category']): Badge[] {
    return this.getAllBadges().filter(badge => badge.category === category);
  }

  /**
   * 根据稀有度获取徽章
   */
  getBadgesByRarity(rarity: Badge['rarity']): Badge[] {
    return this.getAllBadges().filter(badge => badge.rarity === rarity);
  }

  /**
   * 根据ID获取徽章
   */
  getBadgeById(id: string): Badge | undefined {
    return this.badges.find(badge => badge.id === id);
  }

  /**
   * 获取用户的徽章
   */
  getUserBadges(userId: string): UserBadge[] {
    return this.userBadges
      .filter(badge => badge.userId === userId)
      .sort((a, b) => b.obtainedAt - a.obtainedAt);
  }

  /**
   * 检查用户是否拥有徽章
   */
  hasBadge(userId: string, badgeId: string): boolean {
    return this.userBadges.some(
      userBadge => userBadge.userId === userId && userBadge.badgeId === badgeId
    );
  }

  /**
   * 授予用户徽章
   */
  grantBadge(userId: string, badgeId: string, obtainedFrom: string = '系统'): UserBadge | null {
    // 检查徽章是否存在
    const badge = this.getBadgeById(badgeId);
    if (!badge) {
      console.error('徽章不存在:', badgeId);
      return null;
    }

    // 检查用户是否已经拥有该徽章
    if (this.hasBadge(userId, badgeId)) {
      console.log('用户已经拥有该徽章:', badgeId);
      return this.userBadges.find(
        userBadge => userBadge.userId === userId && userBadge.badgeId === badgeId
      ) || null;
    }

    // 检查徽章是否在有效期内
    const now = Date.now();
    if (badge.availableFrom && badge.availableFrom > now) {
      console.error('徽章尚未开始发放:', badgeId);
      return null;
    }
    if (badge.availableUntil && badge.availableUntil < now) {
      console.error('徽章发放已结束:', badgeId);
      return null;
    }

    // 创建用户徽章记录
    const userBadge: UserBadge = {
      id: `user-badge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      badgeId,
      badgeName: badge.name,
      obtainedAt: now,
      isEquipped: false,
      obtainedFrom,
      createdAt: now,
      updatedAt: now
    };

    this.userBadges.push(userBadge);
    this.saveUserBadges();

    return userBadge;
  }

  /**
   * 批量授予用户徽章
   */
  grantBadges(userId: string, badgeIds: string[], obtainedFrom: string = '系统'): UserBadge[] {
    const grantedBadges: UserBadge[] = [];

    badgeIds.forEach(badgeId => {
      const userBadge = this.grantBadge(userId, badgeId, obtainedFrom);
      if (userBadge) {
        grantedBadges.push(userBadge);
      }
    });

    return grantedBadges;
  }

  /**
   * 装备/卸下徽章
   */
  toggleBadgeEquip(userId: string, badgeId: string): UserBadge | undefined {
    const userBadge = this.userBadges.find(
      ub => ub.userId === userId && ub.badgeId === badgeId
    );

    if (userBadge) {
      userBadge.isEquipped = !userBadge.isEquipped;
      userBadge.updatedAt = Date.now();
      this.saveUserBadges();
    }

    return userBadge;
  }

  /**
   * 获取用户已装备的徽章
   */
  getEquippedBadges(userId: string): UserBadge[] {
    return this.userBadges.filter(
      userBadge => userBadge.userId === userId && userBadge.isEquipped
    );
  }

  /**
   * 添加新徽章
   */
  addBadge(badge: Omit<Badge, 'id' | 'createdAt' | 'updatedAt'>): Badge {
    const newBadge: Badge = {
      ...badge,
      id: `badge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.badges.push(newBadge);
    this.saveBadges();

    return newBadge;
  }

  /**
   * 更新徽章信息
   */
  updateBadge(id: string, updates: Partial<Badge>): Badge | undefined {
    const badgeIndex = this.badges.findIndex(badge => badge.id === id);
    if (badgeIndex === -1) return undefined;

    this.badges[badgeIndex] = {
      ...this.badges[badgeIndex],
      ...updates,
      updatedAt: Date.now()
    };

    this.saveBadges();
    return this.badges[badgeIndex];
  }

  /**
   * 删除徽章
   */
  deleteBadge(id: string): boolean {
    const initialLength = this.badges.length;
    this.badges = this.badges.filter(badge => badge.id !== id);
    if (this.badges.length < initialLength) {
      this.saveBadges();
      return true;
    }
    return false;
  }

  /**
   * 获取徽章统计信息
   */
  getBadgeStats() {
    const stats = {
      total: this.badges.length,
      byRarity: {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0
      } as Record<Badge['rarity'], number>,
      byCategory: {} as Record<Badge['category'], number>
    };

    this.badges.forEach(badge => {
      stats.byRarity[badge.rarity]++;
      stats.byCategory[badge.category] = (stats.byCategory[badge.category] || 0) + 1;
    });

    return stats;
  }
}

// 导出单例实例
const badgeService = new BadgeService();
export default badgeService;
