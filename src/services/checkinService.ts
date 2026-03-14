/**
 * 签到服务模块 - 提供每日签到和连续签到奖励功能
 */

import pointsService from './pointsService';

// 签到记录类型定义
export interface CheckinRecord {
  id: string;
  userId: string;
  date: string; // 格式：YYYY-MM-DD
  points: number;
  consecutiveDays: number;
  isBonus: boolean; // 是否为连续签到奖励
  createdAt: number;
}

// 签到状态类型
export interface CheckinStatus {
  todayChecked: boolean;
  consecutiveDays: number;
  lastCheckinDate: string | null;
  totalCheckins: number;
  currentStreak: number;
  longestStreak: number;
}

// 连续签到奖励配置
const STREAK_REWARDS = [
  { days: 1, points: 5 },
  { days: 3, points: 10 }, // 额外奖励
  { days: 7, points: 30 }, // 额外奖励
  { days: 30, points: 100 } // 额外奖励
];

// 签到服务类
class CheckinService {
  private checkinRecords: CheckinRecord[] = [];
  private readonly RECORDS_KEY = 'CHECKIN_RECORDS';

  constructor() {
    this.loadRecords();
  }

  /**
   * 从本地存储加载签到记录
   */
  private loadRecords() {
    try {
      const stored = localStorage.getItem(this.RECORDS_KEY);
      if (stored) {
        this.checkinRecords = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load checkin records:', error);
      this.checkinRecords = [];
    }
  }

  /**
   * 保存签到记录到本地存储
   */
  private saveRecords() {
    try {
      localStorage.setItem(this.RECORDS_KEY, JSON.stringify(this.checkinRecords));
    } catch (error) {
      console.error('Failed to save checkin records:', error);
    }
  }

  /**
   * 获取今日日期（YYYY-MM-DD格式）
   */
  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * 设置今日日期（用于测试）
   */
  setTodayDate?(date: string): void;

  /**
   * 计算两个日期之间的天数差
   */
  private calculateDaysDiff(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 获取用户签到状态
   */
  getCheckinStatus(userId: string): CheckinStatus {
    const userRecords = this.checkinRecords.filter(record => record.userId === userId);
    const sortedRecords = userRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const today = this.getTodayDate();
    const todayChecked = userRecords.some(record => record.date === today);
    
    let consecutiveDays = 0;
    let lastCheckinDate: string | null = null;
    let currentStreak = 0;
    let longestStreak = 0;
    
    if (sortedRecords.length > 0) {
      lastCheckinDate = sortedRecords[0].date;
      
      // 计算连续签到天数
      let tempStreak = 0;
      let previousDate: string | null = null;
      
      for (const record of sortedRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())) {
        if (previousDate === null) {
          tempStreak = 1;
        } else {
          const diff = this.calculateDaysDiff(previousDate, record.date);
          if (diff === 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        previousDate = record.date;
      }
      
      longestStreak = Math.max(longestStreak, tempStreak);
      
      // 计算当前连续签到天数
      if (!todayChecked) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastCheckinDate === yesterdayStr) {
          // 昨天签到了，今天还没签
          consecutiveDays = sortedRecords[0].consecutiveDays;
        } else if (lastCheckinDate !== today) {
          // 昨天没签到，连续天数重置
          consecutiveDays = 0;
        }
      } else {
        // 今天已经签到了
        consecutiveDays = sortedRecords[0].consecutiveDays;
      }
      
      currentStreak = consecutiveDays;
    }
    
    return {
      todayChecked,
      consecutiveDays,
      lastCheckinDate,
      totalCheckins: userRecords.length,
      currentStreak,
      longestStreak
    };
  }

  /**
   * 执行签到
   */
  checkin(userId: string): { record: CheckinRecord; totalPoints: number } {
    const today = this.getTodayDate();
    const status = this.getCheckinStatus(userId);
    
    // 检查今天是否已经签到
    if (status.todayChecked) {
      throw new Error('今天已经签到过了');
    }
    
    // 计算连续签到天数
    let consecutiveDays = 1;
    if (status.lastCheckinDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (status.lastCheckinDate === yesterdayStr) {
        // 连续签到
        consecutiveDays = status.consecutiveDays + 1;
      }
    }
    
    // 计算签到积分
    const basePoints = 5; // 基础签到积分
    let bonusPoints = 0;
    let isBonus = false;
    
    // 检查是否有连续签到奖励
    const streakReward = STREAK_REWARDS.find(reward => reward.days === consecutiveDays);
    if (streakReward) {
      bonusPoints = streakReward.points;
      isBonus = true;
    }
    
    const totalPoints = basePoints + bonusPoints;
    
    // 创建签到记录
    const record: CheckinRecord = {
      id: `checkin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      date: today,
      points: totalPoints,
      consecutiveDays,
      isBonus,
      createdAt: Date.now()
    };
    
    // 保存签到记录
    this.checkinRecords.push(record);
    this.saveRecords();
    
    // 使用积分服务记录积分变动
    pointsService.addPoints(
      totalPoints,
      '每日签到',
      'daily',
      `连续签到${consecutiveDays}天，获得${totalPoints}积分`
    );
    
    return { record, totalPoints };
  }

  /**
   * 获取用户签到记录
   */
  getUserCheckinRecords(userId: string, limit: number = 30): CheckinRecord[] {
    return this.checkinRecords
      .filter(record => record.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  /**
   * 获取用户指定月份的签到记录
   */
  getUserCheckinRecordsByMonth(userId: string, year: number, month: number): CheckinRecord[] {
    const monthStr = month.toString().padStart(2, '0');
    const monthPrefix = `${year}-${monthStr}`;
    
    return this.checkinRecords.filter(record => {
      return record.userId === userId && record.date.startsWith(monthPrefix);
    });
  }

  /**
   * 获取连续签到奖励配置
   */
  getStreakRewards(): typeof STREAK_REWARDS {
    return [...STREAK_REWARDS];
  }

  /**
   * 重置签到服务状态（用于测试）
   */
  reset(): void {
    this.checkinRecords = [];
    localStorage.removeItem(this.RECORDS_KEY);
  }

  /**
   * 计算补签所需积分
   */
  calculate补签Cost(consecutiveDays: number): number {
    // 补签成本随连续天数增加而增加
    return Math.min(5 + consecutiveDays * 2, 50);
  }

  /**
   * 执行补签
   */
  补签(userId: string, date: string): { record: CheckinRecord; cost: number } {
    const today = this.getTodayDate();
    
    // 检查是否为过去的日期
    if (date >= today) {
      throw new Error('只能补签过去的日期');
    }
    
    // 检查是否已经签到
    const existingRecord = this.checkinRecords.find(
      record => record.userId === userId && record.date === date
    );
    if (existingRecord) {
      throw new Error('该日期已经签到过了');
    }
    
    // 计算补签成本
    const status = this.getCheckinStatus(userId);
    const cost = this.calculate补签Cost(status.consecutiveDays);
    
    // 使用积分服务扣除补签积分
    pointsService.consumePoints(
      cost,
      '补签',
      'exchange',
      `补签${date}，消耗${cost}积分`
    );
    
    // 创建补签记录
    const record: CheckinRecord = {
      id: `checkin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      date,
      points: 0, // 补签不获得积分
      consecutiveDays: status.consecutiveDays + 1,
      isBonus: false,
      createdAt: Date.now()
    };
    
    // 保存补签记录
    this.checkinRecords.push(record);
    this.saveRecords();
    
    return { record, cost };
  }
}

// 导出单例实例
const service = new CheckinService();
export default service;
