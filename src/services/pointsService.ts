/**
 * 积分管理服务 - 提供积分的获取、消耗和记录功能
 */



// 积分来源类型
export type PointsSource = 'achievement' | 'task' | 'daily' | 'consumption' | 'exchange' | 'system';

// 积分记录类型定义
export interface PointsRecord {
  id: number;
  source: string;
  type: PointsSource;
  points: number;
  date: string;
  description: string;
  relatedId?: string;
  balanceAfter: number;
}

// 积分变动类型
export interface PointsChange {
  id: number;
  source: string;
  type: PointsSource;
  points: number;
  date: string;
  description: string;
  relatedId?: string;
  balanceAfter: number;
  expiresAt?: number; // 积分过期时间戳
  isExpired?: boolean; // 是否已过期
}

// 积分限制配置
export interface PointsLimit {
  daily: number; // 每日上限
  weekly: number; // 每周上限
  monthly: number; // 每月上限
  yearly: number; // 每年上限
}

// 积分来源限制
export interface PointsSourceLimit {
  achievement: PointsLimit;
  task: PointsLimit;
  daily: PointsLimit;
  consumption: PointsLimit;
  other: PointsLimit;
}

// 积分过期通知
export interface PointsExpiryNotification {
  id: string;
  userId: string;
  points: number;
  expiresAt: number;
  notifiedAt: number;
  isRead: boolean;
  createdAt: number;
}

// 积分管理服务类
class PointsService {
  private readonly POINTS_RECORD_KEY = 'SECURE_POINTS_RECORDS';
  private pointsRecords: PointsChange[] = [];
  private currentPoints: number = 0;
  private cache: { [key: string]: any } = {};
  private readonly CACHE_KEYS = ['currentPoints', 'pointsRecords'];

  // 积分过期配置（毫秒）
  private readonly POINTS_EXPIRY = {
    default: 365 * 24 * 60 * 60 * 1000, // 默认1年
    achievement: 365 * 24 * 60 * 60 * 1000, // 成就积分1年
    task: 180 * 24 * 60 * 60 * 1000, // 任务积分6个月
    daily: 90 * 24 * 60 * 60 * 1000, // 每日积分3个月
    consumption: 365 * 24 * 60 * 60 * 1000, // 消费积分1年
  };

  // 积分获取限制
  private readonly POINTS_LIMITS: PointsSourceLimit = {
    achievement: {
      daily: 500,
      weekly: 2000,
      monthly: 5000,
      yearly: 50000
    },
    task: {
      daily: 300,
      weekly: 1500,
      monthly: 3000,
      yearly: 30000
    },
    daily: {
      daily: 50,
      weekly: 350,
      monthly: 1500,
      yearly: 15000
    },
    consumption: {
      daily: 1000,
      weekly: 5000,
      monthly: 20000,
      yearly: 200000
    },
    other: {
      daily: 200,
      weekly: 1000,
      monthly: 5000,
      yearly: 50000
    }
  };

  // 积分过期通知
  private expiryNotifications: PointsExpiryNotification[] = [];
  private readonly NOTIFICATION_KEY = 'POINTS_EXPIRY_NOTIFICATIONS';

  constructor() {
    this.loadPointsRecords();
    this.loadExpiryNotifications();
    this.checkExpiredPoints();
    this.calculateCurrentPoints();
  }

  /**
   * 从本地存储加载过期通知
   */
  private loadExpiryNotifications() {
    try {
      const stored = localStorage.getItem(this.NOTIFICATION_KEY);
      if (stored) {
        this.expiryNotifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load expiry notifications:', error);
      this.expiryNotifications = [];
    }
  }

  /**
   * 保存过期通知到本地存储
   */
  private saveExpiryNotifications() {
    try {
      localStorage.setItem(this.NOTIFICATION_KEY, JSON.stringify(this.expiryNotifications));
    } catch (error) {
      console.error('Failed to save expiry notifications:', error);
    }
  }

  /**
   * 从本地存储加载积分记录
   */
  private loadPointsRecords() {
    try {
      const stored = localStorage.getItem(this.POINTS_RECORD_KEY);
      if (stored) {
        this.pointsRecords = JSON.parse(stored);
      } else {
        // 初始化默认积分记录
        this.pointsRecords = [
          {
            id: 1,
            source: '系统初始化',
            type: 'system',
            points: 0,
            date: new Date().toISOString().split('T')[0],
            description: '初始积分',
            balanceAfter: 0
          }
        ];
        this.savePointsRecords();
      }
    } catch (error) {
      console.error('Failed to load points records:', error);
      this.pointsRecords = [];
    }
  }

  /**
   * 检查过期积分
   */
  private checkExpiredPoints() {
    const now = Date.now();
    let hasExpiredPoints = false;

    this.pointsRecords.forEach(record => {
      if (record.points > 0 && record.expiresAt && record.expiresAt < now && !record.isExpired) {
        record.isExpired = true;
        hasExpiredPoints = true;
      }
    });

    if (hasExpiredPoints) {
      this.savePointsRecords();
      this.calculateCurrentPoints();
    }
  }

  /**
   * 计算时间范围内的积分获取量
   */
  private calculatePointsInPeriod(type: PointsSource, startDate: string, endDate: string): number {
    return this.pointsRecords
      .filter(record => 
        record.type === type && 
        record.date >= startDate && 
        record.date <= endDate && 
        record.points > 0 && 
        !record.isExpired
      )
      .reduce((total, record) => total + record.points, 0);
  }

  /**
   * 检查积分获取是否超过限制
   */
  private checkPointsLimit(type: PointsSource, points: number): {
    canAdd: boolean;
    reason?: string;
    remaining?: {
      daily: number;
      weekly: number;
      monthly: number;
      yearly: number;
    };
  } {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // 计算时间范围
    const startOfDay = today;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
    
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfYearStr = startOfYear.toISOString().split('T')[0];

    // 获取对应类型的限制
    const limit = this.POINTS_LIMITS[type] || this.POINTS_LIMITS.other;

    // 计算当前获取量
    const dailyPoints = this.calculatePointsInPeriod(type, startOfDay, today);
    const weeklyPoints = this.calculatePointsInPeriod(type, startOfWeekStr, today);
    const monthlyPoints = this.calculatePointsInPeriod(type, startOfMonthStr, today);
    const yearlyPoints = this.calculatePointsInPeriod(type, startOfYearStr, today);

    // 检查是否超过限制
    const remaining = {
      daily: Math.max(0, limit.daily - dailyPoints),
      weekly: Math.max(0, limit.weekly - weeklyPoints),
      monthly: Math.max(0, limit.monthly - monthlyPoints),
      yearly: Math.max(0, limit.yearly - yearlyPoints)
    };

    if (dailyPoints + points > limit.daily) {
      return {
        canAdd: false,
        reason: `每日积分获取已达上限（${limit.daily}）`,
        remaining
      };
    }

    if (weeklyPoints + points > limit.weekly) {
      return {
        canAdd: false,
        reason: `每周积分获取已达上限（${limit.weekly}）`,
        remaining
      };
    }

    if (monthlyPoints + points > limit.monthly) {
      return {
        canAdd: false,
        reason: `每月积分获取已达上限（${limit.monthly}）`,
        remaining
      };
    }

    if (yearlyPoints + points > limit.yearly) {
      return {
        canAdd: false,
        reason: `每年积分获取已达上限（${limit.yearly}）`,
        remaining
      };
    }

    return {
      canAdd: true,
      remaining
    };
  }

  /**
   * 创建积分过期通知
   */
  private createExpiryNotification(userId: string, points: number, expiresAt: number) {
    const notification: PointsExpiryNotification = {
      id: `expiry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      points,
      expiresAt,
      notifiedAt: Date.now(),
      isRead: false,
      createdAt: Date.now()
    };

    this.expiryNotifications.push(notification);
    this.saveExpiryNotifications();

    return notification;
  }

  /**
   * 保存积分记录到本地存储
   */
  private savePointsRecords() {
    try {
      localStorage.setItem(this.POINTS_RECORD_KEY, JSON.stringify(this.pointsRecords));
    } catch (error) {
      console.error('Failed to save points records:', error);
    }
  }

  /**
   * 计算当前积分
   */
  private calculateCurrentPoints(): number {
    // 计算当前积分时排除已过期的积分
    this.currentPoints = this.pointsRecords
      .filter(record => !record.isExpired)
      .reduce((total, record) => total + record.points, 0);
    this.cache['currentPoints'] = this.currentPoints;
    return this.currentPoints;
  }

  /**
   * 获取当前积分
   */
  getCurrentPoints(): number {
    // 从缓存获取，提升性能
    if (this.cache['currentPoints'] !== undefined) {
      return this.cache['currentPoints'];
    }
    
    this.calculateCurrentPoints();
    return this.currentPoints;
  }

  /**
   * 获取积分记录
   */
  getPointsRecords(filter?: {
    startDate?: string;
    endDate?: string;
    type?: PointsSource;
    search?: string;
  }, limit: number = 20, offset: number = 0): PointsChange[] {
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

  /**
   * 获取最近积分记录
   */
  getRecentPointsRecords(limit: number = 5): PointsChange[] {
    // 使用缓存提升性能
    const cacheKey = `recentRecords_${limit}`;
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }
    
    const records = this.getPointsRecords(undefined, limit);
    this.cache[cacheKey] = records;
    return records;
  }

  /**
   * 添加积分
   */
  addPoints(points: number, source: string, type: PointsSource, description: string, relatedId?: string): PointsChange {
    // 检查积分获取是否超过限制
    const limitCheck = this.checkPointsLimit(type, points);
    if (!limitCheck.canAdd) {
      throw new Error(limitCheck.reason || '积分获取超过限制');
    }

    // 计算积分过期时间
    const expiryTime = this.POINTS_EXPIRY[type] || this.POINTS_EXPIRY.default;
    const expiresAt = Date.now() + expiryTime;

    // 计算新的积分余额（不包括过期积分）
    const newBalance = this.calculateCurrentPoints() + points;

    const newRecord: PointsChange = {
      id: this.pointsRecords.length + 1,
      source,
      type,
      points,
      date: new Date().toISOString().split('T')[0],
      description,
      relatedId,
      balanceAfter: newBalance,
      expiresAt,
      isExpired: false
    };
    
    this.pointsRecords.push(newRecord);
    this.calculateCurrentPoints();
    this.savePointsRecords();
    
    // 创建过期通知（提前7天通知）
    const notificationTime = expiresAt - (7 * 24 * 60 * 60 * 1000);
    if (notificationTime > Date.now()) {
      this.createExpiryNotification('current', points, expiresAt);
    }
    
    // 清除相关缓存
    this.clearCache();
    
    return newRecord;
  }

  /**
   * 消耗积分
   */
  consumePoints(points: number, source: string, type: PointsSource, description: string, relatedId?: string): PointsChange {
    if (points > this.currentPoints) {
      throw new Error('积分不足');
    }
    
    const newRecord: PointsChange = {
      id: this.pointsRecords.length + 1,
      source,
      type,
      points: -points,
      date: new Date().toISOString().split('T')[0],
      description,
      relatedId,
      balanceAfter: this.currentPoints - points
    };
    
    this.pointsRecords.push(newRecord);
    this.calculateCurrentPoints();
    this.savePointsRecords();
    
    // 清除相关缓存
    this.clearCache();
    
    return newRecord;
  }

  /**
   * 获取积分来源统计
   */
  getPointsSourceStats() {
    // 使用缓存提升性能
    if (this.cache['pointsSourceStats']) {
      return this.cache['pointsSourceStats'];
    }
    
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
      stats[statKey as keyof typeof stats] += record.points;
    });
    
    this.cache['pointsSourceStats'] = stats;
    return stats;
  }

  /**
   * 清除缓存
   */
  private clearCache(keys?: string[]) {
    if (keys) {
      keys.forEach(key => {
        delete this.cache[key];
      });
    } else {
      this.CACHE_KEYS.forEach(key => {
        delete this.cache[key];
      });
    }
  }

  /**
   * 重置缓存
   */
  resetCache() {
    this.cache = {};
  }

  /**
   * 获取积分过期通知
   */
  getExpiryNotifications(userId: string = 'current'): PointsExpiryNotification[] {
    return this.expiryNotifications
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 标记过期通知为已读
   */
  markExpiryNotificationAsRead(notificationId: string): boolean {
    const notification = this.expiryNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      this.saveExpiryNotifications();
      return true;
    }
    return false;
  }

  /**
   * 获取积分获取限制信息
   */
  getPointsLimitInfo(type: PointsSource): PointsLimit {
    return this.POINTS_LIMITS[type] || this.POINTS_LIMITS.other;
  }

  /**
   * 获取当前积分获取情况
   */
  getPointsUsageInfo(type: PointsSource): {
    used: {
      daily: number;
      weekly: number;
      monthly: number;
      yearly: number;
    };
    limit: PointsLimit;
    remaining: {
      daily: number;
      weekly: number;
      monthly: number;
      yearly: number;
    };
  } {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // 计算时间范围
    const startOfDay = today;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
    
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfYearStr = startOfYear.toISOString().split('T')[0];

    // 获取对应类型的限制
    const limit = this.getPointsLimitInfo(type);

    // 计算当前获取量
    const daily = this.calculatePointsInPeriod(type, startOfDay, today);
    const weekly = this.calculatePointsInPeriod(type, startOfWeekStr, today);
    const monthly = this.calculatePointsInPeriod(type, startOfMonthStr, today);
    const yearly = this.calculatePointsInPeriod(type, startOfYearStr, today);

    // 计算剩余量
    const remaining = {
      daily: Math.max(0, limit.daily - daily),
      weekly: Math.max(0, limit.weekly - weekly),
      monthly: Math.max(0, limit.monthly - monthly),
      yearly: Math.max(0, limit.yearly - yearly)
    };

    return {
      used: {
        daily,
        weekly,
        monthly,
        yearly
      },
      limit,
      remaining
    };
  }

  /**
   * 定期检查过期积分
   */
  checkExpiry() {
    this.checkExpiredPoints();
    return this.getExpiringPoints();
  }

  /**
   * 获取即将过期的积分
   */
  getExpiringPoints(days: number = 30): PointsChange[] {
    const now = Date.now();
    const futureDate = now + (days * 24 * 60 * 60 * 1000);

    return this.pointsRecords
      .filter(record => 
        record.points > 0 && 
        record.expiresAt && 
        record.expiresAt > now && 
        record.expiresAt <= futureDate && 
        !record.isExpired
      )
      .sort((a, b) => a.expiresAt! - b.expiresAt!);
  }
}

// 导出单例实例
const service = new PointsService();
export default service;
