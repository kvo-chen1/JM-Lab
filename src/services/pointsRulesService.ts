/**
 * 积分规则配置服务 - 管理积分获取规则、翻倍活动等
 */

import { supabase } from '@/lib/supabase';
import eventBus from '@/lib/eventBus';

export type PointsRuleType = 
  | 'daily_checkin'
  | 'invite_friend'
  | 'participate_event'
  | 'create_work'
  | 'share_work'
  | 'comment'
  | 'like'
  | 'follow'
  | 'complete_profile'
  | 'first_purchase'
  | 'consume_points'
  | 'birthday'
  | 'anniversary'
  | 'special_event'
  | 'achievement_unlock'
  | 'level_up';

export type PointsMultiplierType = 'none' | 'daily' | 'weekly' | 'event' | 'vip';

export interface PointsRule {
  id: string;
  type: PointsRuleType;
  name: string;
  description: string;
  basePoints: number;
  maxPoints: number;
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
  cooldownMinutes: number;
  isActive: boolean;
  priority: number;
  conditions: PointsRuleCondition[];
  rewards: PointsRuleReward[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PointsRuleCondition {
  id: string;
  type: 'user_level' | 'membership' | 'task_completed' | 'time_range' | 'custom';
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between';
  value: any;
  description?: string;
}

export interface PointsRuleReward {
  id: string;
  type: 'points' | 'multiplier' | 'badge' | 'coupon';
  value: number | string;
  description?: string;
}

export interface PointsMultiplierEvent {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  type: PointsMultiplierType;
  startTime: string;
  endTime: string;
  applicableRules: PointsRuleType[] | 'all';
  targetUsers: 'all' | 'new' | 'vip' | 'custom';
  customUserIds?: string[];
  maxBonusPoints: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPointsStats {
  userId: string;
  totalEarned: number;
  totalSpent: number;
  todayEarned: number;
  weekEarned: number;
  monthEarned: number;
  consecutiveCheckins: number;
  maxConsecutiveCheckins: number;
  lastCheckinTime: string | null;
  rulesUsed: Record<PointsRuleType, number>;
  level: number;
  experience: number;
}

export interface CheckinReward {
  day: number;
  points: number;
  bonusPoints: number;
  badge?: string;
  specialReward?: string;
}

class PointsRulesService {
  private readonly CACHE_KEY = 'POINTS_RULES_CACHE';
  private cache: {
    rules: PointsRule[] | null;
    multipliers: PointsMultiplierEvent[] | null;
    lastUpdated: number;
  } = {
    rules: null,
    multipliers: null,
    lastUpdated: 0,
  };

  private readonly CACHE_TTL = 5 * 60 * 1000;

  private readonly DEFAULT_RULES: PointsRule[] = [
    {
      id: 'daily_checkin',
      type: 'daily_checkin',
      name: '每日签到',
      description: '每日签到获得积分奖励',
      basePoints: 10,
      maxPoints: 100,
      dailyLimit: 1,
      weeklyLimit: 7,
      monthlyLimit: 31,
      cooldownMinutes: 0,
      isActive: true,
      priority: 100,
      conditions: [],
      rewards: [
        { id: 'checkin_base', type: 'points', value: 10, description: '基础签到奖励' },
        { id: 'checkin_consecutive', type: 'multiplier', value: 1.5, description: '连续签到加成' },
      ],
      metadata: {
        consecutiveDays: [1, 2, 3, 4, 5, 6, 7],
        consecutiveBonus: [0, 5, 10, 15, 20, 30, 50],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'invite_friend',
      type: 'invite_friend',
      name: '邀请好友',
      description: '成功邀请好友注册获得积分',
      basePoints: 100,
      maxPoints: 1000,
      dailyLimit: 10,
      weeklyLimit: 50,
      monthlyLimit: 200,
      cooldownMinutes: 0,
      isActive: true,
      priority: 90,
      conditions: [
        { id: 'friend_verified', type: 'custom', operator: 'eq', value: true, description: '好友需完成验证' },
      ],
      rewards: [
        { id: 'invite_base', type: 'points', value: 100, description: '邀请奖励' },
        { id: 'invite_bonus', type: 'points', value: 50, description: '好友首次消费额外奖励' },
      ],
      metadata: {
        requireVerification: true,
        minFriendActivity: 1,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'participate_event',
      type: 'participate_event',
      name: '参与活动',
      description: '参与平台活动获得积分',
      basePoints: 20,
      maxPoints: 500,
      dailyLimit: 5,
      weeklyLimit: 20,
      monthlyLimit: 100,
      cooldownMinutes: 0,
      isActive: true,
      priority: 80,
      conditions: [],
      rewards: [
        { id: 'event_base', type: 'points', value: 20, description: '活动参与奖励' },
      ],
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'create_work',
      type: 'create_work',
      name: '创作作品',
      description: '创作并发布作品获得积分',
      basePoints: 30,
      maxPoints: 300,
      dailyLimit: 10,
      weeklyLimit: 50,
      monthlyLimit: 200,
      cooldownMinutes: 0,
      isActive: true,
      priority: 85,
      conditions: [
        { id: 'work_approved', type: 'custom', operator: 'eq', value: true, description: '作品需通过审核' },
      ],
      rewards: [
        { id: 'create_base', type: 'points', value: 30, description: '创作奖励' },
        { id: 'quality_bonus', type: 'multiplier', value: 2, description: '优质作品双倍积分' },
      ],
      metadata: {
        minQualityScore: 60,
        featuredBonus: 100,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'share_work',
      type: 'share_work',
      name: '分享作品',
      description: '分享作品到社交平台获得积分',
      basePoints: 5,
      maxPoints: 50,
      dailyLimit: 5,
      weeklyLimit: 25,
      monthlyLimit: 100,
      cooldownMinutes: 60,
      isActive: true,
      priority: 70,
      conditions: [],
      rewards: [
        { id: 'share_base', type: 'points', value: 5, description: '分享奖励' },
      ],
      metadata: {
        platforms: ['wechat', 'weibo', 'qq', 'douyin'],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'comment',
      type: 'comment',
      name: '发表评论',
      description: '发表优质评论获得积分',
      basePoints: 2,
      maxPoints: 20,
      dailyLimit: 10,
      weeklyLimit: 50,
      monthlyLimit: 200,
      cooldownMinutes: 5,
      isActive: true,
      priority: 60,
      conditions: [
        { id: 'min_length', type: 'custom', operator: 'gte', value: 10, description: '评论至少10字' },
      ],
      rewards: [
        { id: 'comment_base', type: 'points', value: 2, description: '评论奖励' },
      ],
      metadata: {
        minWords: 10,
        spamDetection: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'like',
      type: 'like',
      name: '点赞互动',
      description: '点赞他人作品获得积分',
      basePoints: 1,
      maxPoints: 10,
      dailyLimit: 20,
      weeklyLimit: 100,
      monthlyLimit: 400,
      cooldownMinutes: 1,
      isActive: true,
      priority: 50,
      conditions: [],
      rewards: [
        { id: 'like_base', type: 'points', value: 1, description: '点赞奖励' },
      ],
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'follow',
      type: 'follow',
      name: '关注用户',
      description: '关注创作者获得积分',
      basePoints: 3,
      maxPoints: 30,
      dailyLimit: 10,
      weeklyLimit: 50,
      monthlyLimit: 200,
      cooldownMinutes: 5,
      isActive: true,
      priority: 55,
      conditions: [],
      rewards: [
        { id: 'follow_base', type: 'points', value: 3, description: '关注奖励' },
      ],
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'complete_profile',
      type: 'complete_profile',
      name: '完善资料',
      description: '完善个人资料获得积分',
      basePoints: 50,
      maxPoints: 50,
      dailyLimit: 1,
      weeklyLimit: 1,
      monthlyLimit: 1,
      cooldownMinutes: 0,
      isActive: true,
      priority: 95,
      conditions: [],
      rewards: [
        { id: 'profile_base', type: 'points', value: 50, description: '完善资料奖励' },
      ],
      metadata: {
        requiredFields: ['avatar', 'nickname', 'bio', 'interests'],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'first_purchase',
      type: 'first_purchase',
      name: '首次消费',
      description: '首次消费获得额外积分奖励',
      basePoints: 200,
      maxPoints: 1000,
      dailyLimit: 1,
      weeklyLimit: 1,
      monthlyLimit: 1,
      cooldownMinutes: 0,
      isActive: true,
      priority: 99,
      conditions: [],
      rewards: [
        { id: 'first_base', type: 'points', value: 200, description: '首消奖励' },
        { id: 'first_multiplier', type: 'multiplier', value: 2, description: '首消双倍' },
      ],
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'consume_points',
      type: 'consume_points',
      name: '积分消费返利',
      description: '消费积分可获得返利',
      basePoints: 0,
      maxPoints: 500,
      dailyLimit: 10,
      weeklyLimit: 50,
      monthlyLimit: 200,
      cooldownMinutes: 0,
      isActive: true,
      priority: 75,
      conditions: [],
      rewards: [
        { id: 'consume_rebate', type: 'multiplier', value: 0.1, description: '10%返利' },
      ],
      metadata: {
        rebateRate: 0.1,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'birthday',
      type: 'birthday',
      name: '生日奖励',
      description: '生日当天获得积分奖励',
      basePoints: 100,
      maxPoints: 100,
      dailyLimit: 1,
      weeklyLimit: 1,
      monthlyLimit: 1,
      cooldownMinutes: 0,
      isActive: true,
      priority: 98,
      conditions: [],
      rewards: [
        { id: 'birthday_base', type: 'points', value: 100, description: '生日奖励' },
        { id: 'birthday_badge', type: 'badge', value: 'birthday_star', description: '生日徽章' },
      ],
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'achievement_unlock',
      type: 'achievement_unlock',
      name: '成就解锁',
      description: '解锁成就获得积分奖励',
      basePoints: 50,
      maxPoints: 500,
      dailyLimit: 10,
      weeklyLimit: 50,
      monthlyLimit: 200,
      cooldownMinutes: 0,
      isActive: true,
      priority: 88,
      conditions: [],
      rewards: [
        { id: 'achievement_base', type: 'points', value: 50, description: '成就奖励' },
      ],
      metadata: {
        achievementMultipliers: {
          bronze: 1,
          silver: 2,
          gold: 3,
          diamond: 5,
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'level_up',
      type: 'level_up',
      name: '等级提升',
      description: '会员等级提升获得积分奖励',
      basePoints: 200,
      maxPoints: 1000,
      dailyLimit: 1,
      weeklyLimit: 1,
      monthlyLimit: 1,
      cooldownMinutes: 0,
      isActive: true,
      priority: 92,
      conditions: [],
      rewards: [
        { id: 'levelup_base', type: 'points', value: 200, description: '升级奖励' },
        { id: 'levelup_multiplier', type: 'multiplier', value: 1.5, description: 'VIP额外加成' },
      ],
      metadata: {
        levelMultipliers: {
          silver: 1,
          gold: 1.5,
          diamond: 2,
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  constructor() {
    this.loadCache();
  }

  private loadCache() {
    try {
      const stored = localStorage.getItem(this.CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache = { ...this.cache, ...parsed };
      }
    } catch (error) {
      console.warn('[PointsRulesService] 加载缓存失败:', error);
    }
  }

  private saveCache() {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('[PointsRulesService] 保存缓存失败:', error);
    }
  }

  private isCacheValid(): boolean {
    return Date.now() - this.cache.lastUpdated < this.CACHE_TTL;
  }

  async getRules(): Promise<PointsRule[]> {
    if (this.cache.rules && this.isCacheValid()) {
      return this.cache.rules;
    }

    try {
      const { data, error } = await supabase
        .from('points_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const rules: PointsRule[] = data.map((item) => ({
          id: item.id,
          type: item.type as PointsRuleType,
          name: item.name,
          description: item.description,
          basePoints: item.base_points,
          maxPoints: item.max_points,
          dailyLimit: item.daily_limit,
          weeklyLimit: item.weekly_limit,
          monthlyLimit: item.monthly_limit,
          cooldownMinutes: item.cooldown_minutes,
          isActive: item.is_active,
          priority: item.priority,
          conditions: item.conditions || [],
          rewards: item.rewards || [],
          metadata: item.metadata || {},
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));

        this.cache.rules = rules;
        this.cache.lastUpdated = Date.now();
        this.saveCache();
        return rules;
      }

      return this.DEFAULT_RULES;
    } catch (error) {
      console.error('[PointsRulesService] 获取规则失败:', error);
      return this.DEFAULT_RULES;
    }
  }

  async getRule(type: PointsRuleType): Promise<PointsRule | null> {
    const rules = await this.getRules();
    return rules.find((r) => r.type === type) || null;
  }

  async getActiveMultipliers(): Promise<PointsMultiplierEvent[]> {
    if (this.cache.multipliers && this.isCacheValid()) {
      return this.cache.multipliers;
    }

    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('points_multiplier_events')
        .select('*')
        .eq('is_active', true)
        .lte('start_time', now)
        .gte('end_time', now);

      if (error) throw error;

      const multipliers: PointsMultiplierEvent[] = (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        multiplier: item.multiplier,
        type: item.type as PointsMultiplierType,
        startTime: item.start_time,
        endTime: item.end_time,
        applicableRules: item.applicable_rules || 'all',
        targetUsers: item.target_users,
        customUserIds: item.custom_user_ids,
        maxBonusPoints: item.max_bonus_points,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      this.cache.multipliers = multipliers;
      this.cache.lastUpdated = Date.now();
      this.saveCache();
      return multipliers;
    } catch (error) {
      console.error('[PointsRulesService] 获取翻倍活动失败:', error);
      return [];
    }
  }

  async getApplicableMultiplier(
    ruleType: PointsRuleType,
    userId: string
  ): Promise<number> {
    const multipliers = await this.getActiveMultipliers();
    let maxMultiplier = 1;

    for (const event of multipliers) {
      if (event.applicableRules !== 'all' && !event.applicableRules.includes(ruleType)) {
        continue;
      }

      if (event.targetUsers === 'custom' && event.customUserIds && !event.customUserIds.includes(userId)) {
        continue;
      }

      maxMultiplier = Math.max(maxMultiplier, event.multiplier);
    }

    return maxMultiplier;
  }

  async calculatePoints(
    ruleType: PointsRuleType,
    userId: string,
    context: Record<string, any> = {}
  ): Promise<{ points: number; multiplier: number; breakdown: any }> {
    const rule = await this.getRule(ruleType);
    if (!rule) {
      return { points: 0, multiplier: 1, breakdown: {} };
    }

    let basePoints = rule.basePoints;
    let totalMultiplier = 1;
    const breakdown: any = {
      base: basePoints,
      conditions: [],
      rewards: [],
      multipliers: [],
    };

    for (const condition of rule.conditions) {
      const met = await this.checkCondition(condition, userId, context);
      breakdown.conditions.push({
        id: condition.id,
        met,
        description: condition.description,
      });
      if (!met) {
        return { points: 0, multiplier: 1, breakdown };
      }
    }

    for (const reward of rule.rewards) {
      if (reward.type === 'points') {
        const points = typeof reward.value === 'number' ? reward.value : 0;
        basePoints += points;
        breakdown.rewards.push({
          id: reward.id,
          type: 'points',
          value: points,
          description: reward.description,
        });
      } else if (reward.type === 'multiplier') {
        const mult = typeof reward.value === 'number' ? reward.value : 1;
        totalMultiplier *= mult;
        breakdown.rewards.push({
          id: reward.id,
          type: 'multiplier',
          value: mult,
          description: reward.description,
        });
      }
    }

    const eventMultiplier = await this.getApplicableMultiplier(ruleType, userId);
    if (eventMultiplier > 1) {
      totalMultiplier *= eventMultiplier;
      breakdown.multipliers.push({
        type: 'event',
        value: eventMultiplier,
        description: '活动翻倍',
      });
    }

    const finalPoints = Math.min(
      Math.floor(basePoints * totalMultiplier),
      rule.maxPoints
    );

    breakdown.final = finalPoints;
    breakdown.totalMultiplier = totalMultiplier;

    return { points: finalPoints, multiplier: totalMultiplier, breakdown };
  }

  private async checkCondition(
    condition: PointsRuleCondition,
    userId: string,
    context: Record<string, any>
  ): Promise<boolean> {
    switch (condition.type) {
      case 'user_level':
        const userLevel = context.userLevel || 0;
        return this.compareValues(userLevel, condition.operator, condition.value);

      case 'membership':
        const membership = context.membership || 'free';
        return this.compareValues(membership, condition.operator, condition.value);

      case 'task_completed':
        return context.taskCompleted === true;

      case 'time_range':
        const now = new Date();
        const hours = now.getHours();
        return this.compareValues(hours, condition.operator, condition.value);

      case 'custom':
        return this.compareValues(context[condition.type], condition.operator, condition.value);

      default:
        return true;
    }
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'eq':
        return actual === expected;
      case 'ne':
        return actual !== expected;
      case 'gt':
        return actual > expected;
      case 'gte':
        return actual >= expected;
      case 'lt':
        return actual < expected;
      case 'lte':
        return actual <= expected;
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'between':
        return Array.isArray(expected) && expected.length === 2 && actual >= expected[0] && actual <= expected[1];
      default:
        return false;
    }
  }

  async getUserPointsStats(userId: string): Promise<UserPointsStats | null> {
    try {
      const { data, error } = await supabase
        .from('user_points_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        return {
          userId: data.user_id,
          totalEarned: data.total_earned,
          totalSpent: data.total_spent,
          todayEarned: data.today_earned,
          weekEarned: data.week_earned,
          monthEarned: data.month_earned,
          consecutiveCheckins: data.consecutive_checkins,
          maxConsecutiveCheckins: data.max_consecutive_checkins,
          lastCheckinTime: data.last_checkin_time,
          rulesUsed: data.rules_used || {},
          level: data.level,
          experience: data.experience,
        };
      }

      return this.createDefaultStats(userId);
    } catch (error) {
      console.error('[PointsRulesService] 获取用户统计失败:', error);
      return null;
    }
  }

  private async createDefaultStats(userId: string): Promise<UserPointsStats> {
    return {
      userId,
      totalEarned: 0,
      totalSpent: 0,
      todayEarned: 0,
      weekEarned: 0,
      monthEarned: 0,
      consecutiveCheckins: 0,
      maxConsecutiveCheckins: 0,
      lastCheckinTime: null,
      rulesUsed: {} as Record<PointsRuleType, number>,
      level: 1,
      experience: 0,
    };
  }

  getCheckinRewards(): CheckinReward[] {
    return [
      { day: 1, points: 10, bonusPoints: 0 },
      { day: 2, points: 10, bonusPoints: 5 },
      { day: 3, points: 10, bonusPoints: 10 },
      { day: 4, points: 10, bonusPoints: 15 },
      { day: 5, points: 10, bonusPoints: 20 },
      { day: 6, points: 10, bonusPoints: 30 },
      { day: 7, points: 10, bonusPoints: 50, badge: 'weekly_checkin', specialReward: '神秘礼包' },
    ];
  }

  clearCache() {
    this.cache = {
      rules: null,
      multipliers: null,
      lastUpdated: 0,
    };
    localStorage.removeItem(this.CACHE_KEY);
  }
}

export const pointsRulesService = new PointsRulesService();
export default pointsRulesService;
