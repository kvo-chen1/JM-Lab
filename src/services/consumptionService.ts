/**
 * 消费返积分服务 - 提供消费积分计算、发放和管理功能
 */

import pointsService from './pointsService';

// 消费记录类型定义
export interface ConsumptionRecord {
  id: string;
  userId: string;
  orderId: string;
  amount: number; // 消费金额（元）
  points: number; // 获得积分
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  createdAt: number;
  confirmedAt?: number;
  cancelledAt?: number;
  refundedAt?: number;
  metadata?: {
    productName?: string;
    productId?: string;
    category?: string;
    paymentMethod?: string;
    remark?: string;
  };
}

// 消费积分配置
const CONSUMPTION_CONFIG = {
  // 积分兑换比例：1元 = 1积分
  ratio: 1,
  // 积分上限配置
  limits: {
    daily: 1000,   // 每日上限
    weekly: 5000,  // 每周上限
    monthly: 20000, // 每月上限
    yearly: 200000, // 每年上限
    perOrder: 10000, // 单笔订单上限
  },
  // 确认期限（消费后多少天确认积分，防止退款）
  confirmationDays: 7,
  // 特殊类别加成
  categoryBonus: {
    'vip': 1.5,      // VIP会员购买 1.5倍
    'course': 1.2,   // 课程购买 1.2倍
    'service': 1.1,  // 服务购买 1.1倍
    'product': 1.0,  // 普通商品 1倍
  }
};

// 消费服务类
class ConsumptionService {
  private consumptionRecords: ConsumptionRecord[] = [];
  private readonly RECORDS_KEY = 'CONSUMPTION_RECORDS';

  constructor() {
    this.loadRecords();
    this.processPendingRecords();
  }

  /**
   * 从本地存储加载消费记录
   */
  private loadRecords() {
    try {
      const stored = localStorage.getItem(this.RECORDS_KEY);
      if (stored) {
        this.consumptionRecords = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load consumption records:', error);
      this.consumptionRecords = [];
    }
  }

  /**
   * 保存消费记录到本地存储
   */
  private saveRecords() {
    try {
      localStorage.setItem(this.RECORDS_KEY, JSON.stringify(this.consumptionRecords));
    } catch (error) {
      console.error('Failed to save consumption records:', error);
    }
  }

  /**
   * 计算消费可获得积分
   */
  calculatePoints(amount: number, category: string = 'product'): {
    basePoints: number;
    bonusPoints: number;
    totalPoints: number;
    bonusRate: number;
  } {
    // 基础积分 = 消费金额 * 比例
    const basePoints = Math.floor(amount * CONSUMPTION_CONFIG.ratio);

    // 获取类别加成
    const bonusRate = CONSUMPTION_CONFIG.categoryBonus[category as keyof typeof CONSUMPTION_CONFIG.categoryBonus] || 1;

    // 计算加成积分
    const totalPoints = Math.floor(basePoints * bonusRate);
    const bonusPoints = totalPoints - basePoints;

    return {
      basePoints,
      bonusPoints,
      totalPoints,
      bonusRate
    };
  }

  /**
   * 检查消费积分限制
   */
  private checkConsumptionLimits(userId: string, points: number): {
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
    const weekStart = new Date();
    weekStart.setDate(now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const userRecords = this.consumptionRecords.filter(r => r.userId === userId);

    // 计算各周期已获得积分
    const dailyPoints = userRecords
      .filter(r => new Date(r.createdAt).toISOString().split('T')[0] === today && r.status === 'confirmed')
      .reduce((sum, r) => sum + r.points, 0);

    const weeklyPoints = userRecords
      .filter(r => r.createdAt >= weekStart.getTime() && r.status === 'confirmed')
      .reduce((sum, r) => sum + r.points, 0);

    const monthlyPoints = userRecords
      .filter(r => r.createdAt >= monthStart.getTime() && r.status === 'confirmed')
      .reduce((sum, r) => sum + r.points, 0);

    const yearlyPoints = userRecords
      .filter(r => r.createdAt >= yearStart.getTime() && r.status === 'confirmed')
      .reduce((sum, r) => sum + r.points, 0);

    // 检查单笔上限
    if (points > CONSUMPTION_CONFIG.limits.perOrder) {
      return {
        canAdd: false,
        reason: `单笔订单积分上限为 ${CONSUMPTION_CONFIG.limits.perOrder}`
      };
    }

    // 检查每日上限
    if (dailyPoints + points > CONSUMPTION_CONFIG.limits.daily) {
      return {
        canAdd: false,
        reason: `每日消费积分上限为 ${CONSUMPTION_CONFIG.limits.daily}，今日还可获得 ${CONSUMPTION_CONFIG.limits.daily - dailyPoints} 积分`
      };
    }

    // 检查每周上限
    if (weeklyPoints + points > CONSUMPTION_CONFIG.limits.weekly) {
      return {
        canAdd: false,
        reason: `每周消费积分上限为 ${CONSUMPTION_CONFIG.limits.weekly}`
      };
    }

    // 检查每月上限
    if (monthlyPoints + points > CONSUMPTION_CONFIG.limits.monthly) {
      return {
        canAdd: false,
        reason: `每月消费积分上限为 ${CONSUMPTION_CONFIG.limits.monthly}`
      };
    }

    // 检查每年上限
    if (yearlyPoints + points > CONSUMPTION_CONFIG.limits.yearly) {
      return {
        canAdd: false,
        reason: `每年消费积分上限为 ${CONSUMPTION_CONFIG.limits.yearly}`
      };
    }

    return {
      canAdd: true,
      remaining: {
        daily: CONSUMPTION_CONFIG.limits.daily - dailyPoints - points,
        weekly: CONSUMPTION_CONFIG.limits.weekly - weeklyPoints - points,
        monthly: CONSUMPTION_CONFIG.limits.monthly - monthlyPoints - points,
        yearly: CONSUMPTION_CONFIG.limits.yearly - yearlyPoints - points
      }
    };
  }

  /**
   * 创建消费记录（积分待确认）
   */
  createConsumption(
    userId: string,
    orderId: string,
    amount: number,
    category: string = 'product',
    metadata?: ConsumptionRecord['metadata']
  ): ConsumptionRecord {
    // 计算可获得积分
    const { totalPoints } = this.calculatePoints(amount, category);

    // 检查限制
    const limitCheck = this.checkConsumptionLimits(userId, totalPoints);
    if (!limitCheck.canAdd) {
      throw new Error(limitCheck.reason);
    }

    // 创建消费记录
    const record: ConsumptionRecord = {
      id: `consumption-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      orderId,
      amount,
      points: totalPoints,
      status: 'pending',
      createdAt: Date.now(),
      metadata
    };

    this.consumptionRecords.push(record);
    this.saveRecords();

    return record;
  }

  /**
   * 确认消费积分（过了退款期）
   */
  confirmConsumption(recordId: string): ConsumptionRecord | null {
    const record = this.consumptionRecords.find(r => r.id === recordId);
    if (!record || record.status !== 'pending') {
      return null;
    }

    // 更新状态
    record.status = 'confirmed';
    record.confirmedAt = Date.now();

    // 发放积分
    pointsService.addPoints(
      record.points,
      '消费返积分',
      'consumption',
      `消费 ${record.amount} 元，获得 ${record.points} 积分`,
      record.orderId
    );

    this.saveRecords();

    // 触发积分更新事件
    window.dispatchEvent(new CustomEvent('pointsUpdated', {
      detail: {
        type: 'earned',
        source: 'consumption',
        points: record.points
      }
    }));

    return record;
  }

  /**
   * 取消消费（退款）
   */
  cancelConsumption(orderId: string): ConsumptionRecord | null {
    const record = this.consumptionRecords.find(
      r => r.orderId === orderId && (r.status === 'pending' || r.status === 'confirmed')
    );
    if (!record) {
      return null;
    }

    // 如果已经确认并发放了积分，需要扣除
    if (record.status === 'confirmed') {
      pointsService.consumePoints(
        record.points,
        '消费退款',
        'consumption',
        `订单 ${orderId} 退款，扣除 ${record.points} 积分`,
        orderId
      );

      // 触发积分更新事件
      window.dispatchEvent(new CustomEvent('pointsUpdated', {
        detail: {
          type: 'spent',
          source: 'consumption_refund',
          points: record.points
        }
      }));
    }

    record.status = 'cancelled';
    record.cancelledAt = Date.now();
    this.saveRecords();

    return record;
  }

  /**
   * 处理待确认的记录（自动确认）
   */
  private processPendingRecords() {
    const now = Date.now();
    const confirmationTime = CONSUMPTION_CONFIG.confirmationDays * 24 * 60 * 60 * 1000;

    let hasUpdates = false;
    this.consumptionRecords.forEach(record => {
      if (
        record.status === 'pending' &&
        now - record.createdAt >= confirmationTime
      ) {
        this.confirmConsumption(record.id);
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      this.saveRecords();
    }
  }

  /**
   * 获取用户的消费记录
   */
  getUserConsumptions(userId: string, status?: ConsumptionRecord['status']): ConsumptionRecord[] {
    let records = this.consumptionRecords.filter(r => r.userId === userId);
    if (status) {
      records = records.filter(r => r.status === status);
    }
    return records.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 获取消费统计
   */
  getConsumptionStats(userId: string): {
    totalAmount: number;
    totalPoints: number;
    pendingPoints: number;
    confirmedPoints: number;
    orderCount: number;
  } {
    const userRecords = this.consumptionRecords.filter(r => r.userId === userId);

    return {
      totalAmount: userRecords.reduce((sum, r) => sum + r.amount, 0),
      totalPoints: userRecords.reduce((sum, r) => sum + r.points, 0),
      pendingPoints: userRecords
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + r.points, 0),
      confirmedPoints: userRecords
        .filter(r => r.status === 'confirmed')
        .reduce((sum, r) => sum + r.points, 0),
      orderCount: userRecords.length
    };
  }

  /**
   * 获取消费配置
   */
  getConfig(): typeof CONSUMPTION_CONFIG {
    return { ...CONSUMPTION_CONFIG };
  }

  /**
   * 获取待确认积分
   */
  getPendingPoints(userId: string): number {
    return this.consumptionRecords
      .filter(r => r.userId === userId && r.status === 'pending')
      .reduce((sum, r) => sum + r.points, 0);
  }

  /**
   * 重置服务（用于测试）
   */
  reset(): void {
    this.consumptionRecords = [];
    localStorage.removeItem(this.RECORDS_KEY);
  }
}

// 导出单例实例
const service = new ConsumptionService();
export default service;
