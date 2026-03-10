/**
 * 积分排行榜服务 - 提供不同时间维度的积分排行榜功能
 */

import pointsService from './pointsService';

// 排行榜类型
export type RankingType = 'daily' | 'weekly' | 'monthly' | 'total';

// 排行榜条目类型
export interface RankingEntry {
  userId: string;
  username: string;
  avatar?: string;
  points: number;
  rank: number;
  change: number; // 排名变化，正数表示上升，负数表示下降
  level?: number;
  badgesCount?: number;
  lastActiveAt?: number;
}

// 排行榜数据类型
export interface RankingData {
  type: RankingType;
  entries: RankingEntry[];
  updatedAt: number;
  period: {
    start: string;
    end: string;
  };
}

// 排行榜服务类
class RankingService {
  private rankings: { [key: string]: RankingData } = {};
  private readonly RANKING_KEY = 'POINT_RANKINGS';
  private readonly CACHE_DURATION = {
    daily: 1000 * 60 * 5, // 5分钟
    weekly: 1000 * 60 * 10, // 10分钟
    monthly: 1000 * 60 * 15, // 15分钟
    total: 1000 * 60 * 30 // 30分钟
  };

  constructor() {
    this.loadRankings();
  }

  /**
   * 从本地存储加载排行榜数据
   */
  private loadRankings() {
    try {
      const stored = localStorage.getItem(this.RANKING_KEY);
      if (stored) {
        this.rankings = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load rankings:', error);
      this.rankings = {};
    }
  }

  /**
   * 保存排行榜数据到本地存储
   */
  private saveRankings() {
    try {
      localStorage.setItem(this.RANKING_KEY, JSON.stringify(this.rankings));
    } catch (error) {
      console.error('Failed to save rankings:', error);
    }
  }

  /**
   * 生成时间段
   */
  private getPeriod(type: RankingType): { start: string; end: string } {
    const now = new Date();
    const end = now.toISOString().split('T')[0];
    const start = new Date();

    switch (type) {
      case 'daily':
        start.setDate(now.getDate());
        break;
      case 'weekly':
        start.setDate(now.getDate() - now.getDay());
        break;
      case 'monthly':
        start.setDate(1);
        break;
      case 'total':
        start.setFullYear(2000, 0, 1); // 从很早的时间开始
        break;
    }

    return {
      start: start.toISOString().split('T')[0],
      end
    };
  }

  /**
   * 检查排行榜是否需要更新
   */
  private shouldUpdate(type: RankingType): boolean {
    const ranking = this.rankings[type];
    if (!ranking) {
      return true;
    }

    const cacheDuration = this.CACHE_DURATION[type];
    return Date.now() - ranking.updatedAt > cacheDuration;
  }

  /**
   * 获取积分排行榜
   */
  getRanking(type: RankingType, limit: number = 50): RankingData {
    // 检查是否需要更新
    if (this.shouldUpdate(type)) {
      this.updateRanking(type);
    }

    const ranking = this.rankings[type];
    if (!ranking) {
      return {
        type,
        entries: [],
        updatedAt: Date.now(),
        period: this.getPeriod(type)
      };
    }

    // 返回限制数量的条目
    return {
      ...ranking,
      entries: ranking.entries.slice(0, limit)
    };
  }

  /**
   * 更新排行榜
   */
  updateRanking(type: RankingType): RankingData {
    const period = this.getPeriod(type);
    const entries: RankingEntry[] = [];

    // 模拟用户数据 - 实际应用中应该从后端获取
    const mockUsers = this.generateMockUsers();

    // 根据类型计算积分
    mockUsers.forEach(user => {
      let points = 0;

      switch (type) {
        case 'daily':
          points = user.dailyPoints;
          break;
        case 'weekly':
          points = user.weeklyPoints;
          break;
        case 'monthly':
          points = user.monthlyPoints;
          break;
        case 'total':
          points = user.totalPoints;
          break;
      }

      if (points > 0) {
        entries.push({
          userId: user.id,
          username: user.username,
          avatar: user.avatar,
          points,
          rank: 0, // 临时值，后面会计算
          change: 0,
          level: user.level,
          badgesCount: user.badgesCount,
          lastActiveAt: user.lastActiveAt
        });
      }
    });

    // 排序并计算排名
    entries.sort((a, b) => b.points - a.points);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // 计算排名变化
    const oldRanking = this.rankings[type];
    if (oldRanking) {
      entries.forEach(entry => {
        const oldEntry = oldRanking.entries.find(e => e.userId === entry.userId);
        if (oldEntry) {
          entry.change = oldEntry.rank - entry.rank;
        }
      });
    }

    // 创建新的排行榜数据
    const newRanking: RankingData = {
      type,
      entries,
      updatedAt: Date.now(),
      period
    };

    // 保存排行榜数据
    this.rankings[type] = newRanking;
    this.saveRankings();

    return newRanking;
  }

  /**
   * 批量更新所有排行榜
   */
  updateAllRankings(): { [key in RankingType]: RankingData } {
    const result: { [key in RankingType]: RankingData } = {
      daily: this.updateRanking('daily'),
      weekly: this.updateRanking('weekly'),
      monthly: this.updateRanking('monthly'),
      total: this.updateRanking('total')
    };

    return result;
  }

  /**
   * 获取用户在排行榜中的位置
   */
  getUserRankingPosition(userId: string, type: RankingType): RankingEntry | null {
    const ranking = this.getRanking(type);
    const userEntry = ranking.entries.find(entry => entry.userId === userId);
    
    if (userEntry) {
      return userEntry;
    }

    // 如果用户不在排行榜中，计算其位置
    const mockUsers = this.generateMockUsers();
    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      return null;
    }

    let points = 0;
    switch (type) {
      case 'daily':
        points = user.dailyPoints;
        break;
      case 'weekly':
        points = user.weeklyPoints;
        break;
      case 'monthly':
        points = user.monthlyPoints;
        break;
      case 'total':
        points = user.totalPoints;
        break;
    }

    // 计算排名
    const higherRankCount = ranking.entries.filter(entry => entry.points > points).length;
    const userRank = higherRankCount + 1;

    return {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      points,
      rank: userRank,
      change: 0,
      level: user.level,
      badgesCount: user.badgesCount,
      lastActiveAt: user.lastActiveAt
    };
  }

  /**
   * 获取排行榜统计信息
   */
  getRankingStats() {
    const stats = {
      totalUsers: 0,
      averagePoints: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        total: 0
      },
      topPoints: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        total: 0
      }
    };

    const mockUsers = this.generateMockUsers();
    stats.totalUsers = mockUsers.length;

    // 计算平均值和最高分
    mockUsers.forEach(user => {
      stats.averagePoints.daily += user.dailyPoints;
      stats.averagePoints.weekly += user.weeklyPoints;
      stats.averagePoints.monthly += user.monthlyPoints;
      stats.averagePoints.total += user.totalPoints;

      stats.topPoints.daily = Math.max(stats.topPoints.daily, user.dailyPoints);
      stats.topPoints.weekly = Math.max(stats.topPoints.weekly, user.weeklyPoints);
      stats.topPoints.monthly = Math.max(stats.topPoints.monthly, user.monthlyPoints);
      stats.topPoints.total = Math.max(stats.topPoints.total, user.totalPoints);
    });

    // 计算平均值
    Object.keys(stats.averagePoints).forEach(key => {
      stats.averagePoints[key as keyof typeof stats.averagePoints] /= stats.totalUsers;
    });

    return stats;
  }

  /**
   * 生成模拟用户数据
   */
  private generateMockUsers() {
    const users = [
      {
        id: 'user-1',
        username: '创作大师',
        avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20creator%20avatar%20male&image_size=square',
        dailyPoints: 50,
        weeklyPoints: 350,
        monthlyPoints: 1500,
        totalPoints: 10000,
        level: 7,
        badgesCount: 20,
        lastActiveAt: Date.now()
      },
      {
        id: 'user-2',
        username: '创意达人',
        avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=creative%20designer%20avatar%20female&image_size=square',
        dailyPoints: 45,
        weeklyPoints: 320,
        monthlyPoints: 1300,
        totalPoints: 8500,
        level: 6,
        badgesCount: 15,
        lastActiveAt: Date.now() - 3600000
      },
      {
        id: 'user-3',
        username: '艺术爱好者',
        avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=art%20enthusiast%20avatar%20young&image_size=square',
        dailyPoints: 40,
        weeklyPoints: 280,
        monthlyPoints: 1100,
        totalPoints: 7200,
        level: 5,
        badgesCount: 12,
        lastActiveAt: Date.now() - 7200000
      },
      {
        id: 'user-4',
        username: '设计新手',
        avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=design%20beginner%20avatar%20student&image_size=square',
        dailyPoints: 30,
        weeklyPoints: 210,
        monthlyPoints: 800,
        totalPoints: 5000,
        level: 4,
        badgesCount: 8,
        lastActiveAt: Date.now() - 10800000
      },
      {
        id: 'user-5',
        username: '内容创作者',
        avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=content%20creator%20avatar%20professional&image_size=square',
        dailyPoints: 35,
        weeklyPoints: 245,
        monthlyPoints: 950,
        totalPoints: 6000,
        level: 5,
        badgesCount: 10,
        lastActiveAt: Date.now() - 14400000
      },
      {
        id: 'user-6',
        username: '创意新手',
        avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=creative%20beginner%20avatar%20casual&image_size=square',
        dailyPoints: 20,
        weeklyPoints: 140,
        monthlyPoints: 500,
        totalPoints: 3000,
        level: 3,
        badgesCount: 5,
        lastActiveAt: Date.now() - 18000000
      },
      {
        id: 'user-7',
        username: '艺术大师',
        avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=art%20master%20avatar%20experienced&image_size=square',
        dailyPoints: 48,
        weeklyPoints: 336,
        monthlyPoints: 1400,
        totalPoints: 9000,
        level: 6,
        badgesCount: 18,
        lastActiveAt: Date.now() - 21600000
      },
      {
        id: 'user-8',
        username: '设计达人',
        avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=design%20expert%20avatar%20modern&image_size=square',
        dailyPoints: 32,
        weeklyPoints: 224,
        monthlyPoints: 850,
        totalPoints: 5500,
        level: 4,
        badgesCount: 9,
        lastActiveAt: Date.now() - 25200000
      }
    ];

    return users;
  }
}

// 导出单例实例
const rankingService = new RankingService();
export default rankingService;
