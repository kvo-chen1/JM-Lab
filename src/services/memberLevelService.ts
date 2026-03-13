/**
 * 会员等级服务 - 会员等级体系、权益管理、升级条件
 */

import { supabase } from '@/lib/supabase';
import eventBus from '@/lib/eventBus';

export type MemberLevel = 
  | 'normal'
  | 'silver'
  | 'gold'
  | 'diamond'
  | 'platinum';

export type BenefitType = 
  | 'points_multiplier'
  | 'discount'
  | 'free_shipping'
  | 'priority_support'
  | 'exclusive_content'
  | 'early_access'
  | 'birthday_bonus'
  | 'monthly_gift'
  | 'storage'
  | 'api_limit'
  | 'custom_badge'
  | 'exclusive_events';

export interface MemberBenefit {
  id: string;
  type: BenefitType;
  name: string;
  description: string;
  value: number | string | boolean;
  icon: string;
  isActive: boolean;
}

export interface LevelConfig {
  level: MemberLevel;
  name: string;
  description: string;
  icon: string;
  color: string;
  minPoints: number;
  maxPoints: number;
  minSpent: number;
  minDays: number;
  benefits: MemberBenefit[];
  upgradeRewards: {
    points: number;
    badges: string[];
    coupons: string[];
  };
  maintainConditions: {
    monthlySpent?: number;
    monthlyActive?: boolean;
  };
  specialPerks: string[];
}

export interface UserLevelInfo {
  userId: string;
  currentLevel: MemberLevel;
  currentPoints: number;
  totalSpent: number;
  activeDays: number;
  levelProgress: number;
  nextLevel: MemberLevel | null;
  pointsToNextLevel: number;
  upgradeRequirements: string[];
  benefits: MemberBenefit[];
  levelHistory: LevelHistoryItem[];
  lastUpgradedAt: string | null;
  expiresAt: string | null;
}

export interface LevelHistoryItem {
  id: string;
  fromLevel: MemberLevel | null;
  toLevel: MemberLevel;
  reason: 'upgrade' | 'downgrade' | 'purchase' | 'system';
  points: number;
  createdAt: string;
}

export interface LevelTask {
  id: string;
  level: MemberLevel;
  name: string;
  description: string;
  type: 'points' | 'spent' | 'days' | 'task' | 'invite';
  target: number;
  current: number;
  isCompleted: boolean;
  reward: number;
}

class MemberLevelService {
  private readonly CACHE_KEY = 'MEMBER_LEVEL_CACHE';
  private cache: {
    configs: LevelConfig[] | null;
    lastUpdated: number;
  } = {
    configs: null,
    lastUpdated: 0,
  };

  private readonly CACHE_TTL = 10 * 60 * 1000;

  private readonly DEFAULT_LEVELS: LevelConfig[] = [
    {
      level: 'normal',
      name: '普通会员',
      description: '基础会员，享受基础权益',
      icon: 'User',
      color: '#9CA3AF',
      minPoints: 0,
      maxPoints: 999,
      minSpent: 0,
      minDays: 0,
      benefits: [
        { id: 'normal_points', type: 'points_multiplier', name: '积分倍率', description: '基础积分倍率', value: 1, icon: 'Star', isActive: true },
        { id: 'normal_storage', type: 'storage', name: '存储空间', description: '基础存储空间', value: '1GB', icon: 'HardDrive', isActive: true },
        { id: 'normal_api', type: 'api_limit', name: 'API调用', description: '每日API调用次数', value: 100, icon: 'Code', isActive: true },
      ],
      upgradeRewards: { points: 0, badges: [], coupons: [] },
      maintainConditions: {},
      specialPerks: [],
    },
    {
      level: 'silver',
      name: '白银会员',
      description: '白银会员，享受更多优惠',
      icon: 'Award',
      color: '#9CA3AF',
      minPoints: 1000,
      maxPoints: 4999,
      minSpent: 100,
      minDays: 7,
      benefits: [
        { id: 'silver_points', type: 'points_multiplier', name: '积分倍率', description: '积分获取倍率', value: 1.2, icon: 'Star', isActive: true },
        { id: 'silver_discount', type: 'discount', name: '专属折扣', description: '商品专属折扣', value: 0.95, icon: 'Percent', isActive: true },
        { id: 'silver_storage', type: 'storage', name: '存储空间', description: '扩展存储空间', value: '5GB', icon: 'HardDrive', isActive: true },
        { id: 'silver_api', type: 'api_limit', name: 'API调用', description: '每日API调用次数', value: 500, icon: 'Code', isActive: true },
        { id: 'silver_birthday', type: 'birthday_bonus', name: '生日礼遇', description: '生日当天双倍积分', value: true, icon: 'Gift', isActive: true },
      ],
      upgradeRewards: {
        points: 100,
        badges: ['silver_member'],
        coupons: ['silver_welcome'],
      },
      maintainConditions: {
        monthlySpent: 50,
        monthlyActive: true,
      },
      specialPerks: ['专属客服通道', '新品优先体验'],
    },
    {
      level: 'gold',
      name: '黄金会员',
      description: '黄金会员，尊享优质服务',
      icon: 'Crown',
      color: '#F59E0B',
      minPoints: 5000,
      maxPoints: 19999,
      minSpent: 500,
      minDays: 30,
      benefits: [
        { id: 'gold_points', type: 'points_multiplier', name: '积分倍率', description: '积分获取倍率', value: 1.5, icon: 'Star', isActive: true },
        { id: 'gold_discount', type: 'discount', name: '专属折扣', description: '商品专属折扣', value: 0.9, icon: 'Percent', isActive: true },
        { id: 'gold_shipping', type: 'free_shipping', name: '免运费', description: '实物商品免运费', value: true, icon: 'Truck', isActive: true },
        { id: 'gold_storage', type: 'storage', name: '存储空间', description: '扩展存储空间', value: '20GB', icon: 'HardDrive', isActive: true },
        { id: 'gold_api', type: 'api_limit', name: 'API调用', description: '每日API调用次数', value: 2000, icon: 'Code', isActive: true },
        { id: 'gold_birthday', type: 'birthday_bonus', name: '生日礼遇', description: '生日当天三倍积分', value: true, icon: 'Gift', isActive: true },
        { id: 'gold_support', type: 'priority_support', name: '优先客服', description: '优先客服支持', value: true, icon: 'Headphones', isActive: true },
        { id: 'gold_monthly', type: 'monthly_gift', name: '月度礼包', description: '每月积分礼包', value: 50, icon: 'Package', isActive: true },
      ],
      upgradeRewards: {
        points: 500,
        badges: ['gold_member', 'vip_creator'],
        coupons: ['gold_welcome', 'gold_discount'],
      },
      maintainConditions: {
        monthlySpent: 200,
        monthlyActive: true,
      },
      specialPerks: ['专属客服通道', '新品优先体验', '限量商品优先购', '专属活动邀请'],
    },
    {
      level: 'diamond',
      name: '钻石会员',
      description: '钻石会员，极致尊享体验',
      icon: 'Gem',
      color: '#8B5CF6',
      minPoints: 20000,
      maxPoints: 49999,
      minSpent: 2000,
      minDays: 90,
      benefits: [
        { id: 'diamond_points', type: 'points_multiplier', name: '积分倍率', description: '积分获取倍率', value: 2, icon: 'Star', isActive: true },
        { id: 'diamond_discount', type: 'discount', name: '专属折扣', description: '商品专属折扣', value: 0.85, icon: 'Percent', isActive: true },
        { id: 'diamond_shipping', type: 'free_shipping', name: '免运费', description: '实物商品免运费', value: true, icon: 'Truck', isActive: true },
        { id: 'diamond_storage', type: 'storage', name: '存储空间', description: '无限存储空间', value: 'unlimited', icon: 'HardDrive', isActive: true },
        { id: 'diamond_api', type: 'api_limit', name: 'API调用', description: '每日API调用次数', value: 10000, icon: 'Code', isActive: true },
        { id: 'diamond_birthday', type: 'birthday_bonus', name: '生日礼遇', description: '生日当天五倍积分+专属礼包', value: true, icon: 'Gift', isActive: true },
        { id: 'diamond_support', type: 'priority_support', name: '专属客服', description: '一对一专属客服', value: true, icon: 'Headphones', isActive: true },
        { id: 'diamond_monthly', type: 'monthly_gift', name: '月度礼包', description: '每月积分礼包', value: 200, icon: 'Package', isActive: true },
        { id: 'diamond_content', type: 'exclusive_content', name: '专属内容', description: '独家内容访问权', value: true, icon: 'Lock', isActive: true },
        { id: 'diamond_events', type: 'exclusive_events', name: '专属活动', description: '会员专属活动', value: true, icon: 'Calendar', isActive: true },
      ],
      upgradeRewards: {
        points: 2000,
        badges: ['diamond_member', 'vip_creator', 'elite_user'],
        coupons: ['diamond_welcome', 'diamond_discount', 'diamond_gift'],
      },
      maintainConditions: {
        monthlySpent: 500,
        monthlyActive: true,
      },
      specialPerks: ['专属客服通道', '新品优先体验', '限量商品优先购', '专属活动邀请', '定制化服务', '年度大礼包'],
    },
    {
      level: 'platinum',
      name: '铂金会员',
      description: '铂金会员，顶级尊享特权',
      icon: 'Sparkles',
      color: '#EC4899',
      minPoints: 50000,
      maxPoints: 999999,
      minSpent: 10000,
      minDays: 180,
      benefits: [
        { id: 'platinum_points', type: 'points_multiplier', name: '积分倍率', description: '积分获取倍率', value: 3, icon: 'Star', isActive: true },
        { id: 'platinum_discount', type: 'discount', name: '专属折扣', description: '商品专属折扣', value: 0.8, icon: 'Percent', isActive: true },
        { id: 'platinum_shipping', type: 'free_shipping', name: '免运费', description: '实物商品免运费+加急配送', value: true, icon: 'Truck', isActive: true },
        { id: 'platinum_storage', type: 'storage', name: '存储空间', description: '无限存储空间', value: 'unlimited', icon: 'HardDrive', isActive: true },
        { id: 'platinum_api', type: 'api_limit', name: 'API调用', description: '无限API调用', value: 'unlimited', icon: 'Code', isActive: true },
        { id: 'platinum_birthday', type: 'birthday_bonus', name: '生日礼遇', description: '生日当天十倍积分+专属大礼包', value: true, icon: 'Gift', isActive: true },
        { id: 'platinum_support', type: 'priority_support', name: 'VIP客服', description: '7x24小时专属客服经理', value: true, icon: 'Headphones', isActive: true },
        { id: 'platinum_monthly', type: 'monthly_gift', name: '月度礼包', description: '每月积分礼包', value: 500, icon: 'Package', isActive: true },
        { id: 'platinum_content', type: 'exclusive_content', name: '专属内容', description: '独家内容+内测功能', value: true, icon: 'Lock', isActive: true },
        { id: 'platinum_events', type: 'exclusive_events', name: '专属活动', description: '会员专属活动+线下聚会', value: true, icon: 'Calendar', isActive: true },
        { id: 'platinum_badge', type: 'custom_badge', name: '专属徽章', description: '定制化身份徽章', value: true, icon: 'Award', isActive: true },
        { id: 'platinum_early', type: 'early_access', name: '抢先体验', description: '新功能抢先体验', value: true, icon: 'Rocket', isActive: true },
      ],
      upgradeRewards: {
        points: 5000,
        badges: ['platinum_member', 'vip_creator', 'elite_user', 'legend'],
        coupons: ['platinum_welcome', 'platinum_discount', 'platinum_gift', 'platinum_vip'],
      },
      maintainConditions: {
        monthlySpent: 1000,
        monthlyActive: true,
      },
      specialPerks: ['专属客服通道', '新品优先体验', '限量商品优先购', '专属活动邀请', '定制化服务', '年度大礼包', '线下聚会邀请', '产品共创权'],
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
      console.warn('[MemberLevelService] 加载缓存失败:', error);
    }
  }

  private saveCache() {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('[MemberLevelService] 保存缓存失败:', error);
    }
  }

  private isCacheValid(): boolean {
    return Date.now() - this.cache.lastUpdated < this.CACHE_TTL;
  }

  async getLevelConfigs(): Promise<LevelConfig[]> {
    if (this.cache.configs && this.isCacheValid()) {
      return this.cache.configs;
    }

    try {
      const { data, error } = await supabase
        .from('member_level_configs')
        .select('*')
        .order('min_points', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const configs: LevelConfig[] = data.map((item) => ({
          level: item.level as MemberLevel,
          name: item.name,
          description: item.description,
          icon: item.icon,
          color: item.color,
          minPoints: item.min_points,
          maxPoints: item.max_points,
          minSpent: item.min_spent,
          minDays: item.min_days,
          benefits: item.benefits || [],
          upgradeRewards: item.upgrade_rewards,
          maintainConditions: item.maintain_conditions,
          specialPerks: item.special_perks || [],
        }));

        this.cache.configs = configs;
        this.cache.lastUpdated = Date.now();
        this.saveCache();
        return configs;
      }

      return this.DEFAULT_LEVELS;
    } catch (error) {
      console.error('[MemberLevelService] 获取等级配置失败:', error);
      return this.DEFAULT_LEVELS;
    }
  }

  async getLevelConfig(level: MemberLevel): Promise<LevelConfig | null> {
    const configs = await this.getLevelConfigs();
    return configs.find((c) => c.level === level) || null;
  }

  async getUserLevelInfo(userId: string): Promise<UserLevelInfo | null> {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('membership_level, total_spent, created_at')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const configs = await this.getLevelConfigs();
      const currentLevel = (userData?.membership_level as MemberLevel) || 'normal';

      const { data: pointsData } = await supabase
        .from('user_points_stats')
        .select('total_earned')
        .eq('user_id', userId)
        .single();

      const currentPoints = pointsData?.total_earned || 0;
      const totalSpent = userData?.total_spent || 0;

      const createdAt = new Date(userData?.created_at || Date.now());
      const activeDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      const currentLevelIndex = configs.findIndex((c) => c.level === currentLevel);
      const currentConfig = configs[currentLevelIndex];
      const nextConfig = configs[currentLevelIndex + 1];

      let levelProgress = 0;
      let pointsToNextLevel = 0;
      const upgradeRequirements: string[] = [];

      if (nextConfig) {
        const currentMin = currentConfig.minPoints;
        const nextMin = nextConfig.minPoints;
        const range = nextMin - currentMin;
        const current = currentPoints - currentMin;
        levelProgress = Math.min(100, Math.round((current / range) * 100));
        pointsToNextLevel = Math.max(0, nextMin - currentPoints);

        if (currentPoints < nextConfig.minPoints) {
          upgradeRequirements.push(`累计积分达到 ${nextConfig.minPoints} (当前: ${currentPoints})`);
        }
        if (totalSpent < nextConfig.minSpent) {
          upgradeRequirements.push(`累计消费达到 ¥${nextConfig.minSpent} (当前: ¥${totalSpent})`);
        }
        if (activeDays < nextConfig.minDays) {
          upgradeRequirements.push(`活跃天数达到 ${nextConfig.minDays} 天 (当前: ${activeDays} 天)`);
        }
      }

      const { data: historyData } = await supabase
        .from('member_level_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      const levelHistory: LevelHistoryItem[] = (historyData || []).map((item) => ({
        id: item.id,
        fromLevel: item.from_level as MemberLevel | null,
        toLevel: item.to_level as MemberLevel,
        reason: item.reason,
        points: item.points,
        createdAt: item.created_at,
      }));

      const { data: lastUpgrade } = await supabase
        .from('member_level_history')
        .select('created_at')
        .eq('user_id', userId)
        .eq('to_level', currentLevel)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        userId,
        currentLevel,
        currentPoints,
        totalSpent,
        activeDays,
        levelProgress,
        nextLevel: nextConfig?.level || null,
        pointsToNextLevel,
        upgradeRequirements,
        benefits: currentConfig.benefits,
        levelHistory,
        lastUpgradedAt: lastUpgrade?.created_at || null,
        expiresAt: null,
      };
    } catch (error) {
      console.error('[MemberLevelService] 获取用户等级信息失败:', error);
      return null;
    }
  }

  async checkAndUpgradeLevel(userId: string): Promise<{
    upgraded: boolean;
    oldLevel?: MemberLevel;
    newLevel?: MemberLevel;
    rewards?: any;
  }> {
    try {
      const levelInfo = await this.getUserLevelInfo(userId);
      if (!levelInfo) return { upgraded: false };

      const configs = await this.getLevelConfigs();
      const currentIndex = configs.findIndex((c) => c.level === levelInfo.currentLevel);

      for (let i = currentIndex + 1; i < configs.length; i++) {
        const nextConfig = configs[i];

        if (
          levelInfo.currentPoints >= nextConfig.minPoints &&
          levelInfo.totalSpent >= nextConfig.minSpent &&
          levelInfo.activeDays >= nextConfig.minDays
        ) {
          await this.upgradeUserLevel(userId, nextConfig.level, 'upgrade');

          return {
            upgraded: true,
            oldLevel: levelInfo.currentLevel,
            newLevel: nextConfig.level,
            rewards: nextConfig.upgradeRewards,
          };
        }
      }

      return { upgraded: false };
    } catch (error) {
      console.error('[MemberLevelService] 检查升级失败:', error);
      return { upgraded: false };
    }
  }

  private async upgradeUserLevel(
    userId: string,
    newLevel: MemberLevel,
    reason: 'upgrade' | 'downgrade' | 'purchase' | 'system'
  ): Promise<boolean> {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('membership_level')
        .eq('id', userId)
        .single();

      const oldLevel = userData?.membership_level as MemberLevel;

      await supabase
        .from('users')
        .update({ membership_level: newLevel, updated_at: new Date().toISOString() })
        .eq('id', userId);

      await supabase.from('member_level_history').insert({
        user_id: userId,
        from_level: oldLevel,
        to_level: newLevel,
        reason,
        points: 0,
        created_at: new Date().toISOString(),
      });

      const config = await this.getLevelConfig(newLevel);
      if (config?.upgradeRewards.points && config.upgradeRewards.points > 0) {
        const { pointsService } = await import('./pointsService');
        pointsService.addPoints(
          config.upgradeRewards.points,
          '会员升级奖励',
          'achievement',
          `升级为${config.name}`,
          `levelup_${newLevel}_${Date.now()}`
        );
      }

      eventBus.emit('member:levelUp', {
        userId,
        oldLevel,
        newLevel,
        rewards: config?.upgradeRewards,
      });

      return true;
    } catch (error) {
      console.error('[MemberLevelService] 升级失败:', error);
      return false;
    }
  }

  async getLevelTasks(userId: string): Promise<LevelTask[]> {
    try {
      const levelInfo = await this.getUserLevelInfo(userId);
      if (!levelInfo) return [];

      const configs = await this.getLevelConfigs();
      const currentIndex = configs.findIndex((c) => c.level === levelInfo.currentLevel);
      const nextConfig = configs[currentIndex + 1];

      if (!nextConfig) return [];

      const tasks: LevelTask[] = [
        {
          id: 'points_task',
          level: nextConfig.level,
          name: '累计积分',
          description: `累计获得 ${nextConfig.minPoints} 积分`,
          type: 'points',
          target: nextConfig.minPoints,
          current: levelInfo.currentPoints,
          isCompleted: levelInfo.currentPoints >= nextConfig.minPoints,
          reward: 0,
        },
        {
          id: 'spent_task',
          level: nextConfig.level,
          name: '累计消费',
          description: `累计消费 ¥${nextConfig.minSpent}`,
          type: 'spent',
          target: nextConfig.minSpent,
          current: levelInfo.totalSpent,
          isCompleted: levelInfo.totalSpent >= nextConfig.minSpent,
          reward: 0,
        },
        {
          id: 'days_task',
          level: nextConfig.level,
          name: '活跃天数',
          description: `活跃 ${nextConfig.minDays} 天`,
          type: 'days',
          target: nextConfig.minDays,
          current: levelInfo.activeDays,
          isCompleted: levelInfo.activeDays >= nextConfig.minDays,
          reward: 0,
        },
      ];

      return tasks;
    } catch (error) {
      console.error('[MemberLevelService] 获取升级任务失败:', error);
      return [];
    }
  }

  async getBenefitValue(userId: string, benefitType: BenefitType): Promise<number | string | boolean> {
    try {
      const levelInfo = await this.getUserLevelInfo(userId);
      if (!levelInfo) return false;

      const benefit = levelInfo.benefits.find((b) => b.type === benefitType);
      return benefit?.value ?? false;
    } catch (error) {
      console.error('[MemberLevelService] 获取权益值失败:', error);
      return false;
    }
  }

  async checkMaintainConditions(userId: string): Promise<{
    maintained: boolean;
    warnings: string[];
  }> {
    try {
      const levelInfo = await this.getUserLevelInfo(userId);
      if (!levelInfo) return { maintained: true, warnings: [] };

      const config = await this.getLevelConfig(levelInfo.currentLevel);
      if (!config || !config.maintainConditions) {
        return { maintained: true, warnings: [] };
      }

      const warnings: string[] = [];
      const conditions = config.maintainConditions;

      if (conditions.monthlySpent) {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const { data: orders } = await supabase
          .from('orders')
          .select('amount')
          .eq('user_id', userId)
          .gte('created_at', monthStart.toISOString());

        const monthlySpent = orders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;

        if (monthlySpent < conditions.monthlySpent) {
          warnings.push(`本月消费不足 ¥${conditions.monthlySpent}，当前 ¥${monthlySpent}`);
        }
      }

      return {
        maintained: warnings.length === 0,
        warnings,
      };
    } catch (error) {
      console.error('[MemberLevelService] 检查保级条件失败:', error);
      return { maintained: true, warnings: [] };
    }
  }

  clearCache() {
    this.cache = {
      configs: null,
      lastUpdated: 0,
    };
    localStorage.removeItem(this.CACHE_KEY);
  }
}

export const memberLevelService = new MemberLevelService();
export default memberLevelService;
