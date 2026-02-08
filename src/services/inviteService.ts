/**
 * 邀请好友服务 - 提供邀请码生成、邀请追踪和积分奖励功能
 */

import pointsService from './pointsService';

// 邀请记录类型定义
export interface InviteRecord {
  id: string;
  inviterId: string; // 邀请人ID
  inviteeId?: string; // 被邀请人ID（注册后填充）
  inviteCode: string; // 邀请码
  status: 'pending' | 'registered' | 'completed'; // 状态：待注册、已注册、已完成
  rewardPoints: {
    inviter: number; // 邀请人奖励积分
    invitee: number; // 被邀请人奖励积分
  };
  createdAt: number;
  registeredAt?: number; // 注册时间
  completedAt?: number; // 完成时间（被邀请人完成首次任务）
  metadata?: {
    inviteeEmail?: string;
    inviteePhone?: string;
    source?: string; // 邀请来源：link、code、share
  };
}

// 邀请统计类型
export interface InviteStats {
  totalInvites: number; // 总邀请数
  registeredCount: number; // 已注册数
  completedCount: number; // 已完成数
  totalEarnedPoints: number; // 累计获得积分
  pendingPoints: number; // 待发放积分
}

// 邀请配置
const INVITE_CONFIG = {
  // 邀请码长度
  codeLength: 6,
  // 奖励配置
  rewards: {
    inviter: 150, // 邀请人获得积分
    invitee: 50,  // 被邀请人获得积分
  },
  // 额外奖励（当被邀请人完成首次创作）
  bonusRewards: {
    inviter: 100,
    invitee: 50,
  },
  // 邀请限制
  limits: {
    daily: 10,   // 每日邀请上限
    weekly: 50,  // 每周邀请上限
    monthly: 200, // 每月邀请上限
  }
};

// 邀请服务类
class InviteService {
  private inviteRecords: InviteRecord[] = [];
  private readonly RECORDS_KEY = 'INVITE_RECORDS';
  private readonly CODE_PREFIX = 'TJ'; // 邀请码前缀

  constructor() {
    this.loadRecords();
  }

  /**
   * 从本地存储加载邀请记录
   */
  private loadRecords() {
    try {
      const stored = localStorage.getItem(this.RECORDS_KEY);
      if (stored) {
        this.inviteRecords = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load invite records:', error);
      this.inviteRecords = [];
    }
  }

  /**
   * 保存邀请记录到本地存储
   */
  private saveRecords() {
    try {
      localStorage.setItem(this.RECORDS_KEY, JSON.stringify(this.inviteRecords));
    } catch (error) {
      console.error('Failed to save invite records:', error);
    }
  }

  /**
   * 生成随机邀请码
   */
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = this.CODE_PREFIX;
    for (let i = 0; i < INVITE_CONFIG.codeLength; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * 检查邀请码是否已存在
   */
  private isCodeExists(code: string): boolean {
    return this.inviteRecords.some(record => record.inviteCode === code);
  }

  /**
   * 生成唯一邀请码
   */
  private generateUniqueCode(): string {
    let code = this.generateInviteCode();
    let attempts = 0;
    while (this.isCodeExists(code) && attempts < 10) {
      code = this.generateInviteCode();
      attempts++;
    }
    return code;
  }

  /**
   * 检查邀请限制
   */
  private checkInviteLimits(inviterId: string): {
    canInvite: boolean;
    reason?: string;
    remaining?: number;
  } {
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date();
    monthStart.setDate(1);

    const userInvites = this.inviteRecords.filter(r => r.inviterId === inviterId);

    // 检查每日限制
    const dailyCount = userInvites.filter(r => {
      const date = new Date(r.createdAt).toISOString().split('T')[0];
      return date === today;
    }).length;
    if (dailyCount >= INVITE_CONFIG.limits.daily) {
      return {
        canInvite: false,
        reason: `今日邀请次数已达上限（${INVITE_CONFIG.limits.daily}次）`,
        remaining: 0
      };
    }

    // 检查每周限制
    const weeklyCount = userInvites.filter(r => r.createdAt >= weekStart.getTime()).length;
    if (weeklyCount >= INVITE_CONFIG.limits.weekly) {
      return {
        canInvite: false,
        reason: `本周邀请次数已达上限（${INVITE_CONFIG.limits.weekly}次）`,
        remaining: 0
      };
    }

    // 检查每月限制
    const monthlyCount = userInvites.filter(r => r.createdAt >= monthStart.getTime()).length;
    if (monthlyCount >= INVITE_CONFIG.limits.monthly) {
      return {
        canInvite: false,
        reason: `本月邀请次数已达上限（${INVITE_CONFIG.limits.monthly}次）`,
        remaining: 0
      };
    }

    return {
      canInvite: true,
      remaining: INVITE_CONFIG.limits.daily - dailyCount
    };
  }

  /**
   * 创建邀请
   */
  createInvite(inviterId: string, metadata?: InviteRecord['metadata']): {
    record: InviteRecord;
    inviteLink: string;
  } {
    // 检查邀请限制
    const limitCheck = this.checkInviteLimits(inviterId);
    if (!limitCheck.canInvite) {
      throw new Error(limitCheck.reason);
    }

    // 生成邀请码
    const inviteCode = this.generateUniqueCode();

    // 创建邀请记录
    const record: InviteRecord = {
      id: `invite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      inviterId,
      inviteCode,
      status: 'pending',
      rewardPoints: { ...INVITE_CONFIG.rewards },
      createdAt: Date.now(),
      metadata
    };

    this.inviteRecords.push(record);
    this.saveRecords();

    // 生成邀请链接
    const inviteLink = `${window.location.origin}/register?inviteCode=${inviteCode}`;

    return { record, inviteLink };
  }

  /**
   * 使用邀请码注册
   */
  registerWithInviteCode(inviteeId: string, inviteCode: string): InviteRecord {
    // 查找邀请记录
    const record = this.inviteRecords.find(r => r.inviteCode === inviteCode);
    if (!record) {
      throw new Error('无效的邀请码');
    }

    // 检查邀请状态
    if (record.status !== 'pending') {
      throw new Error('该邀请码已被使用');
    }

    // 检查是否自己邀请自己
    if (record.inviterId === inviteeId) {
      throw new Error('不能使用自己的邀请码');
    }

    // 更新邀请记录
    record.inviteeId = inviteeId;
    record.status = 'registered';
    record.registeredAt = Date.now();

    // 发放积分奖励
    // 邀请人奖励
    pointsService.addPoints(
      record.rewardPoints.inviter,
      '邀请好友',
      'achievement',
      `好友使用邀请码注册，获得 ${record.rewardPoints.inviter} 积分`,
      record.id
    );

    // 被邀请人奖励
    pointsService.addPoints(
      record.rewardPoints.invitee,
      '注册奖励',
      'system',
      `使用邀请码注册，获得 ${record.rewardPoints.invitee} 积分`,
      record.id
    );

    this.saveRecords();

    // 触发积分更新事件
    window.dispatchEvent(new CustomEvent('pointsUpdated', {
      detail: {
        type: 'earned',
        source: 'invite'
      }
    }));

    return record;
  }

  /**
   * 完成邀请（被邀请人完成首次任务）
   */
  completeInvite(inviteeId: string): InviteRecord | null {
    const record = this.inviteRecords.find(
      r => r.inviteeId === inviteeId && r.status === 'registered'
    );

    if (!record) return null;

    // 更新状态
    record.status = 'completed';
    record.completedAt = Date.now();

    // 发放额外奖励
    pointsService.addPoints(
      INVITE_CONFIG.bonusRewards.inviter,
      '邀请好友完成',
      'achievement',
      `好友完成首次任务，额外获得 ${INVITE_CONFIG.bonusRewards.inviter} 积分`,
      record.id
    );

    pointsService.addPoints(
      INVITE_CONFIG.bonusRewards.invitee,
      '任务奖励',
      'task',
      `完成首次任务，额外获得 ${INVITE_CONFIG.bonusRewards.invitee} 积分`,
      record.id
    );

    this.saveRecords();

    // 触发积分更新事件
    window.dispatchEvent(new CustomEvent('pointsUpdated', {
      detail: {
        type: 'earned',
        source: 'invite_bonus'
      }
    }));

    return record;
  }

  /**
   * 获取用户的邀请记录
   */
  getUserInvites(inviterId: string): InviteRecord[] {
    return this.inviteRecords
      .filter(record => record.inviterId === inviterId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 获取邀请统计
   */
  getInviteStats(inviterId: string): InviteStats {
    const userInvites = this.getUserInvites(inviterId);

    const registeredCount = userInvites.filter(r => r.status === 'registered' || r.status === 'completed').length;
    const completedCount = userInvites.filter(r => r.status === 'completed').length;

    const totalEarnedPoints = userInvites.reduce((total, record) => {
      if (record.status === 'registered' || record.status === 'completed') {
        return total + record.rewardPoints.inviter;
      }
      return total;
    }, 0) + (completedCount * INVITE_CONFIG.bonusRewards.inviter);

    const pendingPoints = userInvites
      .filter(r => r.status === 'pending')
      .length * INVITE_CONFIG.rewards.inviter;

    return {
      totalInvites: userInvites.length,
      registeredCount,
      completedCount,
      totalEarnedPoints,
      pendingPoints
    };
  }

  /**
   * 验证邀请码
   */
  validateInviteCode(inviteCode: string): {
    valid: boolean;
    record?: InviteRecord;
    reason?: string;
  } {
    const record = this.inviteRecords.find(r => r.inviteCode === inviteCode);

    if (!record) {
      return { valid: false, reason: '邀请码不存在' };
    }

    if (record.status !== 'pending') {
      return { valid: false, reason: '邀请码已被使用' };
    }

    return { valid: true, record };
  }

  /**
   * 获取邀请码信息
   */
  getInviteCodeInfo(inviteCode: string): InviteRecord | undefined {
    return this.inviteRecords.find(r => r.inviteCode === inviteCode);
  }

  /**
   * 获取用户的邀请码列表
   */
  getUserInviteCodes(inviterId: string): InviteRecord[] {
    return this.getUserInvites(inviterId).filter(r => r.status === 'pending');
  }

  /**
   * 检查用户是否被邀请
   */
  isUserInvited(inviteeId: string): boolean {
    return this.inviteRecords.some(r => r.inviteeId === inviteeId);
  }

  /**
   * 获取邀请人的ID
   */
  getInviterId(inviteeId: string): string | undefined {
    const record = this.inviteRecords.find(r => r.inviteeId === inviteeId);
    return record?.inviterId;
  }

  /**
   * 重置邀请服务（用于测试）
   */
  reset(): void {
    this.inviteRecords = [];
    localStorage.removeItem(this.RECORDS_KEY);
  }

  /**
   * 获取邀请配置
   */
  getInviteConfig(): typeof INVITE_CONFIG {
    return { ...INVITE_CONFIG };
  }
}

// 导出单例实例
const service = new InviteService();
export default service;
