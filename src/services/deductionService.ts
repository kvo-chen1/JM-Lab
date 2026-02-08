/**
 * 积分抵扣服务 - 提供订单积分抵扣计算和应用功能
 */

import pointsService from './pointsService';

// 抵扣记录类型定义
export interface DeductionRecord {
  id: string;
  userId: string;
  orderId: string;
  originalAmount: number; // 订单原金额
  pointsUsed: number; // 使用积分
  deductionAmount: number; // 抵扣金额
  finalAmount: number; // 最终支付金额
  status: 'pending' | 'applied' | 'cancelled' | 'refunded';
  createdAt: number;
  appliedAt?: number;
  cancelledAt?: number;
  metadata?: {
    productName?: string;
    productId?: string;
    category?: string;
    remark?: string;
  };
}

// 抵扣配置
const DEDUCTION_CONFIG = {
  // 积分兑换比例：100积分 = 1元
  ratio: 100,
  // 最大抵扣比例：订单金额的30%
  maxDeductionRatio: 0.3,
  // 最小订单金额（低于此金额不可使用积分抵扣）
  minOrderAmount: 10,
  // 最小抵扣积分
  minPoints: 100,
  // 最大抵扣积分（单次）
  maxPoints: 10000,
  // 积分使用限制
  limits: {
    daily: 5000,   // 每日最多使用积分
    weekly: 20000, // 每周最多使用积分
    monthly: 50000 // 每月最多使用积分
  }
};

// 抵扣服务类
class DeductionService {
  private deductionRecords: DeductionRecord[] = [];
  private readonly RECORDS_KEY = 'DEDUCTION_RECORDS';

  constructor() {
    this.loadRecords();
  }

  /**
   * 从本地存储加载抵扣记录
   */
  private loadRecords() {
    try {
      const stored = localStorage.getItem(this.RECORDS_KEY);
      if (stored) {
        this.deductionRecords = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load deduction records:', error);
      this.deductionRecords = [];
    }
  }

  /**
   * 保存抵扣记录到本地存储
   */
  private saveRecords() {
    try {
      localStorage.setItem(this.RECORDS_KEY, JSON.stringify(this.deductionRecords));
    } catch (error) {
      console.error('Failed to save deduction records:', error);
    }
  }

  /**
   * 计算可抵扣金额
   */
  calculateDeduction(orderAmount: number, pointsToUse: number, userId: string): {
    canDeduct: boolean;
    reason?: string;
    maxDeductiblePoints: number;
    maxDeductionAmount: number;
    suggestedPoints: number;
    suggestedDeduction: number;
    finalAmount: number;
  } {
    // 检查订单金额
    if (orderAmount < DEDUCTION_CONFIG.minOrderAmount) {
      return {
        canDeduct: false,
        reason: `订单金额需满 ${DEDUCTION_CONFIG.minOrderAmount} 元才可使用积分抵扣`,
        maxDeductiblePoints: 0,
        maxDeductionAmount: 0,
        suggestedPoints: 0,
        suggestedDeduction: 0,
        finalAmount: orderAmount
      };
    }

    // 计算最大可抵扣金额（订单金额的30%）
    const maxDeductionAmount = Math.floor(orderAmount * DEDUCTION_CONFIG.maxDeductionRatio * 100) / 100;

    // 计算最大可抵扣积分
    let maxDeductiblePoints = Math.floor(maxDeductionAmount * DEDUCTION_CONFIG.ratio);
    
    // 限制单次最大使用积分
    maxDeductiblePoints = Math.min(maxDeductiblePoints, DEDUCTION_CONFIG.maxPoints);

    // 获取用户当前积分
    const userPoints = pointsService.getCurrentPoints();

    // 检查用户积分是否足够
    if (userPoints < DEDUCTION_CONFIG.minPoints) {
      return {
        canDeduct: false,
        reason: `积分不足，至少需要 ${DEDUCTION_CONFIG.minPoints} 积分`,
        maxDeductiblePoints,
        maxDeductionAmount,
        suggestedPoints: 0,
        suggestedDeduction: 0,
        finalAmount: orderAmount
      };
    }

    // 检查积分使用限制
    const limitCheck = this.checkPointsLimits(userId, pointsToUse);
    if (!limitCheck.canUse) {
      return {
        canDeduct: false,
        reason: limitCheck.reason,
        maxDeductiblePoints,
        maxDeductionAmount,
        suggestedPoints: 0,
        suggestedDeduction: 0,
        finalAmount: orderAmount
      };
    }

    // 建议使用的积分（取用户输入、最大可抵扣、用户拥有的最小值）
    const suggestedPoints = Math.min(
      pointsToUse || maxDeductiblePoints,
      maxDeductiblePoints,
      userPoints
    );

    // 建议抵扣金额
    const suggestedDeduction = Math.floor((suggestedPoints / DEDUCTION_CONFIG.ratio) * 100) / 100;

    // 最终支付金额
    const finalAmount = Math.floor((orderAmount - suggestedDeduction) * 100) / 100;

    return {
      canDeduct: true,
      maxDeductiblePoints,
      maxDeductionAmount,
      suggestedPoints,
      suggestedDeduction,
      finalAmount: Math.max(finalAmount, 0)
    };
  }

  /**
   * 检查积分使用限制
   */
  private checkPointsLimits(userId: string, points: number): {
    canUse: boolean;
    reason?: string;
    remaining?: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  } {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const userRecords = this.deductionRecords.filter(
      r => r.userId === userId && r.status === 'applied'
    );

    // 计算各周期已使用积分
    const dailyPoints = userRecords
      .filter(r => new Date(r.appliedAt || r.createdAt).toISOString().split('T')[0] === today)
      .reduce((sum, r) => sum + r.pointsUsed, 0);

    const weeklyPoints = userRecords
      .filter(r => (r.appliedAt || r.createdAt) >= weekStart.getTime())
      .reduce((sum, r) => sum + r.pointsUsed, 0);

    const monthlyPoints = userRecords
      .filter(r => (r.appliedAt || r.createdAt) >= monthStart.getTime())
      .reduce((sum, r) => sum + r.pointsUsed, 0);

    // 检查每日限制
    if (dailyPoints + points > DEDUCTION_CONFIG.limits.daily) {
      return {
        canUse: false,
        reason: `每日积分抵扣上限为 ${DEDUCTION_CONFIG.limits.daily}，今日还可使用 ${DEDUCTION_CONFIG.limits.daily - dailyPoints} 积分`
      };
    }

    // 检查每周限制
    if (weeklyPoints + points > DEDUCTION_CONFIG.limits.weekly) {
      return {
        canUse: false,
        reason: `每周积分抵扣上限为 ${DEDUCTION_CONFIG.limits.weekly}`
      };
    }

    // 检查每月限制
    if (monthlyPoints + points > DEDUCTION_CONFIG.limits.monthly) {
      return {
        canUse: false,
        reason: `每月积分抵扣上限为 ${DEDUCTION_CONFIG.limits.monthly}`
      };
    }

    return {
      canUse: true,
      remaining: {
        daily: DEDUCTION_CONFIG.limits.daily - dailyPoints - points,
        weekly: DEDUCTION_CONFIG.limits.weekly - weeklyPoints - points,
        monthly: DEDUCTION_CONFIG.limits.monthly - monthlyPoints - points
      }
    };
  }

  /**
   * 创建抵扣记录（待应用）
   */
  createDeduction(
    userId: string,
    orderId: string,
    orderAmount: number,
    pointsToUse: number,
    metadata?: DeductionRecord['metadata']
  ): DeductionRecord {
    // 计算抵扣
    const calculation = this.calculateDeduction(orderAmount, pointsToUse, userId);
    
    if (!calculation.canDeduct) {
      throw new Error(calculation.reason);
    }

    // 检查用户积分
    const userPoints = pointsService.getCurrentPoints();
    if (userPoints < calculation.suggestedPoints) {
      throw new Error('积分不足');
    }

    // 创建抵扣记录
    const record: DeductionRecord = {
      id: `deduction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      orderId,
      originalAmount: orderAmount,
      pointsUsed: calculation.suggestedPoints,
      deductionAmount: calculation.suggestedDeduction,
      finalAmount: calculation.finalAmount,
      status: 'pending',
      createdAt: Date.now(),
      metadata
    };

    this.deductionRecords.push(record);
    this.saveRecords();

    return record;
  }

  /**
   * 应用抵扣（支付时）
   */
  applyDeduction(recordId: string): DeductionRecord | null {
    const record = this.deductionRecords.find(r => r.id === recordId);
    if (!record || record.status !== 'pending') {
      return null;
    }

    // 扣除积分
    pointsService.consumePoints(
      record.pointsUsed,
      '订单抵扣',
      'exchange',
      `订单 ${record.orderId} 抵扣 ${record.deductionAmount} 元，消耗 ${record.pointsUsed} 积分`,
      record.orderId
    );

    // 更新状态
    record.status = 'applied';
    record.appliedAt = Date.now();
    this.saveRecords();

    // 触发积分更新事件
    window.dispatchEvent(new CustomEvent('pointsUpdated', {
      detail: {
        type: 'spent',
        source: 'deduction',
        points: record.pointsUsed
      }
    }));

    return record;
  }

  /**
   * 取消抵扣（订单取消）
   */
  cancelDeduction(orderId: string): DeductionRecord | null {
    const record = this.deductionRecords.find(
      r => r.orderId === orderId && (r.status === 'pending' || r.status === 'applied')
    );
    if (!record) {
      return null;
    }

    // 如果已经应用，需要返还积分
    if (record.status === 'applied') {
      pointsService.addPoints(
        record.pointsUsed,
        '订单取消返还',
        'system',
        `订单 ${orderId} 取消，返还 ${record.pointsUsed} 积分`,
        orderId
      );

      // 触发积分更新事件
      window.dispatchEvent(new CustomEvent('pointsUpdated', {
        detail: {
          type: 'earned',
          source: 'deduction_refund',
          points: record.pointsUsed
        }
      }));
    }

    record.status = 'cancelled';
    record.cancelledAt = Date.now();
    this.saveRecords();

    return record;
  }

  /**
   * 获取用户的抵扣记录
   */
  getUserDeductions(userId: string, status?: DeductionRecord['status']): DeductionRecord[] {
    let records = this.deductionRecords.filter(r => r.userId === userId);
    if (status) {
      records = records.filter(r => r.status === status);
    }
    return records.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 获取抵扣统计
   */
  getDeductionStats(userId: string): {
    totalOrders: number;
    totalPointsUsed: number;
    totalDeductionAmount: number;
    totalSavings: number;
  } {
    const userRecords = this.deductionRecords.filter(
      r => r.userId === userId && r.status === 'applied'
    );

    return {
      totalOrders: userRecords.length,
      totalPointsUsed: userRecords.reduce((sum, r) => sum + r.pointsUsed, 0),
      totalDeductionAmount: userRecords.reduce((sum, r) => sum + r.deductionAmount, 0),
      totalSavings: userRecords.reduce((sum, r) => sum + r.deductionAmount, 0)
    };
  }

  /**
   * 获取抵扣配置
   */
  getConfig(): typeof DEDUCTION_CONFIG {
    return { ...DEDUCTION_CONFIG };
  }

  /**
   * 快速计算抵扣（不创建记录）
   */
  quickCalculate(orderAmount: number, pointsToUse: number, userId: string): {
    canDeduct: boolean;
    reason?: string;
    pointsUsed: number;
    deductionAmount: number;
    finalAmount: number;
    savingsRatio: number;
  } {
    const result = this.calculateDeduction(orderAmount, pointsToUse, userId);

    return {
      canDeduct: result.canDeduct,
      reason: result.reason,
      pointsUsed: result.suggestedPoints,
      deductionAmount: result.suggestedDeduction,
      finalAmount: result.finalAmount,
      savingsRatio: orderAmount > 0 ? (result.suggestedDeduction / orderAmount) * 100 : 0
    };
  }

  /**
   * 获取最大可抵扣信息
   */
  getMaxDeductionInfo(orderAmount: number, userId: string): {
    maxPoints: number;
    maxAmount: number;
    currentPoints: number;
    canDeduct: boolean;
  } {
    const calculation = this.calculateDeduction(orderAmount, 0, userId);
    const userPoints = pointsService.getCurrentPoints();

    return {
      maxPoints: Math.min(calculation.maxDeductiblePoints, userPoints),
      maxAmount: calculation.maxDeductionAmount,
      currentPoints: userPoints,
      canDeduct: calculation.canDeduct && userPoints >= DEDUCTION_CONFIG.minPoints
    };
  }

  /**
   * 重置服务（用于测试）
   */
  reset(): void {
    this.deductionRecords = [];
    localStorage.removeItem(this.RECORDS_KEY);
  }
}

// 导出单例实例
const service = new DeductionService();
export default service;
