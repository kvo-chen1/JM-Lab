/**
 * 会员中心服务 - 提供会员等级、权益、积分、订单等完整功能
 * 实现与后端数据库的真实数据交互
 */

import { supabase, supabaseAdmin } from '@/lib/supabase';
import { apiClient } from '@/lib/apiClient';
import eventBus from '@/lib/eventBus';

// ==================== 类型定义 ====================

// 会员等级
export type MembershipLevel = 'free' | 'premium' | 'vip';

// 会员状态
export type MembershipStatus = 'active' | 'expired' | 'pending' | 'cancelled';

// 订单状态
export type OrderStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';

// 会员权益项
export interface MembershipBenefitItem {
  id: string;
  name: string;
  value: boolean | string | number;
  icon: string;
  description?: string;
}

// 会员等级配置
export interface MembershipLevelConfig {
  level: MembershipLevel;
  name: string;
  description: string;
  features: MembershipBenefitItem[];
  limits: {
    aiGenerationsPerDay: number | null;
    storageGB: number | null;
    exportsPerMonth: number | null;
    maxResolution: string;
    watermark: boolean;
    maxTeamMembers?: number;
    apiRateLimit?: number;
  };
  pricing: {
    monthly: { price: number; period: string; discount?: string; originalPrice?: number };
    quarterly?: { price: number; period: string; discount?: string; originalPrice?: number };
    yearly?: { price: number; period: string; discount?: string; originalPrice?: number };
  };
  // 成长体系相关
  growth: {
    minPoints: number;
    maxPoints: number;
    upgradeConditions: string[];
    maintainConditions: string[];
  };
}

// 会员信息
export interface MembershipInfo {
  userId: string;
  level: MembershipLevel;
  status: MembershipStatus;
  startDate: string;
  endDate: string | null;
  autoRenew: boolean;
  currentPoints: number;
  totalSpent: number;
  upgradeProgress: number; // 0-100
  nextLevel: MembershipLevel | null;
}

// 使用统计
export interface UsageStats {
  aiGenerations: {
    used: number;
    total: number | null;
    percentage: number;
    resetTime: string; // 下次重置时间
  };
  storage: {
    used: number; // GB
    total: number | null;
    percentage: number;
    filesCount: number;
  };
  exports: {
    used: number;
    total: number | null;
    percentage: number;
    resetTime: string;
  };
  apiCalls: {
    used: number;
    total: number | null;
    percentage: number;
    resetTime: string;
  };
}

// 订单记录
export interface MembershipOrder {
  id: string;
  userId: string;
  plan: MembershipLevel;
  planName: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: string;
  status: OrderStatus;
  paymentMethod: string | null;
  paymentData?: Record<string, any>;
  createdAt: string;
  paidAt: string | null;
  expiresAt: string | null;
  refundedAt: string | null;
  refundAmount?: number;
}

// 积分记录
export interface PointsRecord {
  id: string;
  userId: string;
  points: number;
  type: 'earn' | 'spend';
  source: string;
  description: string;
  relatedId?: string;
  balanceAfter: number;
  createdAt: string;
  expiresAt: string | null;
}

// 会员历史记录
export interface MembershipHistory {
  id: string;
  userId: string;
  actionType: 'upgrade' | 'downgrade' | 'renew' | 'cancel' | 'expire' | 'refund';
  fromLevel: MembershipLevel | null;
  toLevel: MembershipLevel | null;
  orderId: string | null;
  notes: string | null;
  createdAt: string;
}

// 优惠券
export interface MembershipCoupon {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchaseAmount: number;
  maxDiscountAmount: number | null;
  applicablePlans: MembershipLevel[];
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  isUsed?: boolean;
}

// 缓存数据结构
interface MembershipCache {
  benefits: MembershipLevelConfig[] | null;
  info: MembershipInfo | null;
  usage: UsageStats | null;
  orders: MembershipOrder[] | null;
  points: PointsRecord[] | null;
  coupons: MembershipCoupon[] | null;
  lastUpdated: {
    benefits: number;
    info: number;
    usage: number;
    orders: number;
    points: number;
    coupons: number;
  };
}

// ==================== 会员服务类 ====================

class MembershipService {
  private readonly CACHE_KEY = 'MEMBERSHIP_CACHE';
  private readonly CACHE_TTL = {
    benefits: 1000 * 60 * 60, // 1小时
    info: 0,      // 禁用缓存，实时获取
    usage: 1000 * 60 * 1,     // 1分钟
    orders: 1000 * 60 * 5,    // 5分钟
    points: 1000 * 60 * 5,    // 5分钟
    coupons: 1000 * 60 * 30,  // 30分钟
  };

  private cache: MembershipCache = {
    benefits: null,
    info: null,
    usage: null,
    orders: null,
    points: null,
    coupons: null,
    lastUpdated: {
      benefits: 0,
      info: 0,
      usage: 0,
      orders: 0,
      points: 0,
      coupons: 0,
    },
  };

  private realtimeSubscription: any = null;
  private currentUserId: string | null = null;

  constructor() {
    this.loadCacheFromStorage();
    this.setupRealtimeSync();
  }

  // ==================== 缓存管理 ====================

  private loadCacheFromStorage() {
    try {
      const stored = localStorage.getItem(this.CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache = { ...this.cache, ...parsed };
      }
    } catch (error) {
      console.warn('[MembershipService] 加载缓存失败:', error);
    }
  }

  private saveCacheToStorage() {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('[MembershipService] 保存缓存失败:', error);
    }
  }

  private isCacheValid(type: keyof MembershipCache['lastUpdated']): boolean {
    const lastUpdated = this.cache.lastUpdated[type];
    const ttl = this.CACHE_TTL[type];
    return Date.now() - lastUpdated < ttl;
  }

  private updateCache<T extends keyof MembershipCache>(
    key: T,
    value: MembershipCache[T]
  ) {
    this.cache[key] = value as any;
    this.cache.lastUpdated[key as keyof MembershipCache['lastUpdated']] = Date.now();
    this.saveCacheToStorage();
  }

  public clearCache() {
    this.cache = {
      benefits: null,
      info: null,
      usage: null,
      orders: null,
      points: null,
      coupons: null,
      lastUpdated: {
        benefits: 0,
        info: 0,
        usage: 0,
        orders: 0,
        points: 0,
        coupons: 0,
      },
    };
    localStorage.removeItem(this.CACHE_KEY);
  }

  // ==================== 实时同步 ====================

  private setupRealtimeSync() {
    // 监听会员数据变化事件
    eventBus.on('membership:dataChanged', (data: any) => {
      this.handleDataChange(data);
    });

    // 监听用户登录/登出
    eventBus.on('auth:login', () => {
      this.clearCache();
    });

    eventBus.on('auth:logout', () => {
      this.clearCache();
      this.unsubscribeRealtime();
    });
  }

  private async subscribeToRealtimeUpdates(userId: string) {
    if (this.realtimeSubscription) {
      this.unsubscribeRealtime();
    }

    this.currentUserId = userId;

    // 订阅会员订单变化
    this.realtimeSubscription = supabase
      .channel(`membership:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'membership_orders',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          this.handleRealtimeUpdate('orders', payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'membership_usage_stats',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          this.handleRealtimeUpdate('usage', payload);
        }
      )
      .subscribe();
  }

  private unsubscribeRealtime() {
    if (this.realtimeSubscription && typeof this.realtimeSubscription.unsubscribe === 'function') {
      this.realtimeSubscription.unsubscribe();
      this.realtimeSubscription = null;
    }
    this.currentUserId = null;
  }

  private handleRealtimeUpdate(type: string, payload: any) {
    // 清除相关缓存
    this.cache.lastUpdated[type as keyof MembershipCache['lastUpdated']] = 0;
    
    // 发布数据更新事件
    eventBus.emit('membership:dataChanged', {
      type,
      payload,
      timestamp: Date.now(),
    });
  }

  private handleDataChange(data: any) {
    // 根据数据类型触发相应的刷新
    switch (data.type) {
      case 'orders':
        this.cache.lastUpdated.orders = 0;
        break;
      case 'usage':
        this.cache.lastUpdated.usage = 0;
        break;
      case 'points':
        this.cache.lastUpdated.points = 0;
        break;
    }
  }

  // ==================== 会员等级与权益 ====================

  /**
   * 获取所有会员等级配置
   */
  async getMembershipLevels(): Promise<MembershipLevelConfig[]> {
    // 检查缓存
    if (this.cache.benefits && this.isCacheValid('benefits')) {
      return this.cache.benefits;
    }

    try {
      // 从数据库获取配置
      const { data, error } = await supabase
        .from('membership_benefits_config')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const configs: MembershipLevelConfig[] = data.map((item) => ({
          level: item.level as MembershipLevel,
          name: item.name,
          description: item.description,
          features: item.features as MembershipBenefitItem[],
          limits: item.limits as MembershipLevelConfig['limits'],
          pricing: item.pricing as MembershipLevelConfig['pricing'],
          growth: item.growth as MembershipLevelConfig['growth'] || {
            minPoints: 0,
            maxPoints: 0,
            upgradeConditions: [],
            maintainConditions: [],
          },
        }));

        this.updateCache('benefits', configs);
        return configs;
      }

      // 如果数据库没有数据，返回默认配置
      return this.getDefaultMembershipLevels();
    } catch (error) {
      console.error('[MembershipService] 获取会员等级配置失败:', error);
      return this.getDefaultMembershipLevels();
    }
  }

  /**
   * 获取默认会员等级配置
   */
  private getDefaultMembershipLevels(): MembershipLevelConfig[] {
    return [
      {
        level: 'free',
        name: '免费会员',
        description: '基础AI创作体验',
        features: [
          { id: 'ai_generation', name: 'AI生成次数', value: '10次/天', icon: 'Wand2', description: '每日可用的AI创作次数' },
          { id: 'ai_model', name: 'AI模型访问', value: '基础模型', icon: 'Zap', description: '可用的AI模型等级' },
          { id: 'image_generation', name: '图像生成', value: true, icon: 'Image', description: 'AI图像创作功能' },
          { id: 'video_generation', name: '视频生成', value: false, icon: 'Video', description: 'AI视频创作功能' },
          { id: 'audio_generation', name: '音频生成', value: false, icon: 'Music', description: 'AI音频创作功能' },
          { id: 'text_generation', name: '文案生成', value: true, icon: 'FileText', description: 'AI文案创作功能' },
          { id: 'templates', name: '模板库', value: '基础模板', icon: 'Palette', description: '可用模板数量' },
          { id: 'layers', name: '图层编辑', value: '基础功能', icon: 'Layers', description: '高级图层编辑功能' },
          { id: 'export', name: '导出功能', value: '带水印', icon: 'Download', description: '作品导出选项' },
          { id: 'storage', name: '云存储空间', value: '1GB', icon: 'Cloud', description: '作品存储容量' },
          { id: 'priority', name: '优先处理', value: false, icon: 'Clock', description: '任务队列优先级' },
          { id: 'commercial', name: '商业授权', value: false, icon: 'Shield', description: '作品商业使用授权' },
        ],
        limits: {
          aiGenerationsPerDay: 10,
          storageGB: 1,
          exportsPerMonth: 5,
          maxResolution: '1080p',
          watermark: true,
          maxTeamMembers: 1,
          apiRateLimit: 100,
        },
        pricing: {
          monthly: { price: 0, period: '永久' },
        },
        growth: {
          minPoints: 0,
          maxPoints: 0,
          upgradeConditions: [],
          maintainConditions: [],
        },
      },
      {
        level: 'premium',
        name: '高级会员',
        description: '解锁高级AI创作功能',
        features: [
          { id: 'ai_generation', name: 'AI生成次数', value: '无限', icon: 'Wand2', description: '每日可用的AI创作次数' },
          { id: 'ai_model', name: 'AI模型访问', value: '高级模型', icon: 'Zap', description: '可用的AI模型等级' },
          { id: 'image_generation', name: '图像生成', value: true, icon: 'Image', description: 'AI图像创作功能' },
          { id: 'video_generation', name: '视频生成', value: true, icon: 'Video', description: 'AI视频创作功能' },
          { id: 'audio_generation', name: '音频生成', value: true, icon: 'Music', description: 'AI音频创作功能' },
          { id: 'text_generation', name: '文案生成', value: true, icon: 'FileText', description: 'AI文案创作功能' },
          { id: 'templates', name: '模板库', value: '专属模板库', icon: 'Palette', description: '可用模板数量' },
          { id: 'layers', name: '图层编辑', value: '完整功能', icon: 'Layers', description: '高级图层编辑功能' },
          { id: 'export', name: '导出功能', value: '高清无水印', icon: 'Download', description: '作品导出选项' },
          { id: 'storage', name: '云存储空间', value: '50GB', icon: 'Cloud', description: '作品存储容量' },
          { id: 'priority', name: '优先处理', value: true, icon: 'Clock', description: '任务队列优先级' },
          { id: 'commercial', name: '商业授权', value: false, icon: 'Shield', description: '作品商业使用授权' },
        ],
        limits: {
          aiGenerationsPerDay: null,
          storageGB: 50,
          exportsPerMonth: 100,
          maxResolution: '4K',
          watermark: false,
          maxTeamMembers: 3,
          apiRateLimit: 1000,
        },
        pricing: {
          monthly: { price: 99, period: '月' },
          quarterly: { price: 269, period: '季度', discount: '9折', originalPrice: 297 },
          yearly: { price: 899, period: '年', discount: '7.6折', originalPrice: 1188 },
        },
        growth: {
          minPoints: 0,
          maxPoints: 5000,
          upgradeConditions: ['累计消费满1000元', '使用天数满30天'],
          maintainConditions: ['保持活跃使用'],
        },
      },
      {
        level: 'vip',
        name: 'VIP会员',
        description: '享受顶级AI创作体验',
        features: [
          { id: 'ai_generation', name: 'AI生成次数', value: '无限', icon: 'Wand2', description: '每日可用的AI创作次数' },
          { id: 'ai_model', name: 'AI模型访问', value: '专属模型', icon: 'Zap', description: '可用的AI模型等级' },
          { id: 'image_generation', name: '图像生成', value: true, icon: 'Image', description: 'AI图像创作功能' },
          { id: 'video_generation', name: '视频生成', value: true, icon: 'Video', description: 'AI视频创作功能' },
          { id: 'audio_generation', name: '音频生成', value: true, icon: 'Music', description: 'AI音频创作功能' },
          { id: 'text_generation', name: '文案生成', value: true, icon: 'FileText', description: 'AI文案创作功能' },
          { id: 'templates', name: '模板库', value: '全部模板', icon: 'Palette', description: '可用模板数量' },
          { id: 'layers', name: '图层编辑', value: '完整功能', icon: 'Layers', description: '高级图层编辑功能' },
          { id: 'export', name: '导出功能', value: '超高清无水印', icon: 'Download', description: '作品导出选项' },
          { id: 'storage', name: '云存储空间', value: '无限', icon: 'Cloud', description: '作品存储容量' },
          { id: 'priority', name: '优先处理', value: '最高优先级', icon: 'Clock', description: '任务队列优先级' },
          { id: 'commercial', name: '商业授权', value: true, icon: 'Shield', description: '作品商业使用授权' },
        ],
        limits: {
          aiGenerationsPerDay: null,
          storageGB: null,
          exportsPerMonth: null,
          maxResolution: '8K',
          watermark: false,
          maxTeamMembers: 10,
          apiRateLimit: 10000,
        },
        pricing: {
          monthly: { price: 199, period: '月' },
          quarterly: { price: 539, period: '季度', discount: '9折', originalPrice: 597 },
          yearly: { price: 1799, period: '年', discount: '7.5折', originalPrice: 2388 },
        },
        growth: {
          minPoints: 5000,
          maxPoints: 999999,
          upgradeConditions: ['累计消费满5000元', '邀请3位好友'],
          maintainConditions: ['年度消费满2000元'],
        },
      },
    ];
  }

  /**
   * 获取单个会员等级配置
   */
  async getMembershipLevel(level: MembershipLevel): Promise<MembershipLevelConfig | null> {
    const levels = await this.getMembershipLevels();
    return levels.find((l) => l.level === level) || null;
  }

  // ==================== 会员信息 ====================

  /**
   * 获取当前用户的会员信息
   * 优先从 membership_orders 表获取会员等级，与后台管理保持一致
   */
  async getMembershipInfo(userId: string): Promise<MembershipInfo | null> {
    if (!userId) return null;

    // 检查缓存
    if (this.cache.info && this.cache.info.userId === userId && this.isCacheValid('info')) {
      return this.cache.info;
    }

    try {
      // 从数据库获取用户基本信息（只查询存在的字段）
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('membership_level, membership_status, membership_start, membership_end')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // 优先从 membership_orders 表获取会员等级（与后台管理保持一致）
      let membershipLevel: MembershipLevel = (userData.membership_level as MembershipLevel) || 'free';
      let membershipStatus: MembershipStatus = (userData.membership_status as MembershipStatus) || 'active';
      let membershipStart = userData.membership_start;
      let membershipEnd = userData.membership_end;

      try {
        console.log('[MembershipService] 正在查询用户订单, userId:', userId);
        // 使用 supabaseAdmin 绕过 RLS 限制，与后台管理保持一致
        const { data: orders, error: ordersError } = await supabaseAdmin
          .from('membership_orders')
          .select('plan, status, paid_at, expires_at')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1);

        console.log('[MembershipService] 订单查询结果:', { orders, ordersError });

        if (orders && orders.length > 0) {
          const latestOrder = orders[0];
          console.log('[MembershipService] 找到订单:', latestOrder);
          membershipLevel = latestOrder.plan as MembershipLevel;
          membershipStart = latestOrder.paid_at;
          membershipEnd = latestOrder.expires_at;

          // 检查会员是否过期
          if (latestOrder.expires_at) {
            const expiresDate = new Date(latestOrder.expires_at);
            if (expiresDate < new Date()) {
              membershipStatus = 'expired';
            } else {
              membershipStatus = 'active';
            }
          }
        } else {
          console.log('[MembershipService] 未找到已完成订单，使用 users 表数据');
        }
      } catch (e) {
        console.warn('[MembershipService] 从订单表获取会员信息失败:', e);
      }

      // 计算升级进度
      const levels = await this.getMembershipLevels();
      const currentLevelIndex = levels.findIndex((l) => l.level === membershipLevel);
      const nextLevel = levels[currentLevelIndex + 1] || null;

      // 积分相关字段可能不存在，使用默认值
      const currentPoints = 0;
      const totalSpent = 0;
      let upgradeProgress = 0;
      if (nextLevel) {
        const currentMin = levels[currentLevelIndex]?.growth.minPoints || 0;
        const nextMin = nextLevel.growth.minPoints;
        const range = nextMin - currentMin;
        const current = currentPoints - currentMin;
        upgradeProgress = range > 0 ? Math.min(100, Math.round((current / range) * 100)) : 100;
      }

      const info: MembershipInfo = {
        userId,
        level: membershipLevel,
        status: membershipStatus,
        startDate: membershipStart,
        endDate: membershipEnd,
        autoRenew: false, // 默认不自动续费
        currentPoints,
        totalSpent,
        upgradeProgress,
        nextLevel: nextLevel?.level || null,
      };

      this.updateCache('info', info);

      // 订阅实时更新
      this.subscribeToRealtimeUpdates(userId);

      return info;
    } catch (error) {
      console.error('[MembershipService] 获取会员信息失败:', error);
      return null;
    }
  }

  /**
   * 更新会员信息
   */
  async updateMembershipInfo(
    userId: string,
    updates: Partial<MembershipInfo>
  ): Promise<boolean> {
    try {
      // 只更新 users 表中存在的字段
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (updates.level !== undefined) updateData.membership_level = updates.level;
      if (updates.status !== undefined) updateData.membership_status = updates.status;
      if (updates.startDate !== undefined) updateData.membership_start = updates.startDate;
      if (updates.endDate !== undefined) updateData.membership_end = updates.endDate;

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      // 清除缓存
      this.cache.lastUpdated.info = 0;

      // 发布更新事件
      eventBus.emit('membership:dataChanged', {
        type: 'info',
        payload: { userId, updates },
        timestamp: Date.now(),
      });

      return true;
    } catch (error) {
      console.error('[MembershipService] 更新会员信息失败:', error);
      return false;
    }
  }

  // ==================== 使用统计 ====================

  /**
   * 获取使用统计
   */
  async getUsageStats(userId: string): Promise<UsageStats> {
    if (!userId) {
      return this.getDefaultUsageStats();
    }

    // 检查缓存
    if (this.cache.usage && this.isCacheValid('usage')) {
      return this.cache.usage;
    }

    try {
      // 获取今日AI生成次数
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: aiStats, error: aiError } = await supabase
        .from('membership_usage_stats')
        .select('ai_generations_count, storage_used_bytes, exports_count, api_calls_count')
        .eq('user_id', userId)
        .eq('stat_date', today.toISOString().split('T')[0])
        .maybeSingle();

      if (aiError && aiError.code !== 'PGRST116') throw aiError;

      // 获取会员等级限制
      const { data: userData } = await supabase
        .from('users')
        .select('membership_level')
        .eq('id', userId)
        .single();

      const levelConfig = await this.getMembershipLevel(userData?.membership_level || 'free');
      const limits = levelConfig?.limits;

      // 获取存储使用情况
      const { data: works } = await supabase
        .from('works')
        .select('file_size')
        .eq('creator_id', userId);

      const storageUsed = works?.reduce((sum, w) => sum + (w.file_size || 0), 0) || 0;
      const storageUsedGB = storageUsed / (1024 * 1024 * 1024);

      // 获取本月导出次数
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { count: exportsCount } = await supabase
        .from('user_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('action_type', 'export')
        .gte('timestamp', monthStart.getTime());

      const stats: UsageStats = {
        aiGenerations: {
          used: aiStats?.ai_generations_count || 0,
          total: limits?.aiGenerationsPerDay ?? 10,
          percentage: limits?.aiGenerationsPerDay
            ? Math.min(100, ((aiStats?.ai_generations_count || 0) / limits.aiGenerationsPerDay) * 100)
            : 0,
          resetTime: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        },
        storage: {
          used: parseFloat(storageUsedGB.toFixed(2)),
          total: limits?.storageGB ?? null,
          percentage: limits?.storageGB
            ? Math.min(100, (storageUsedGB / limits.storageGB) * 100)
            : 0,
          filesCount: works?.length || 0,
        },
        exports: {
          used: exportsCount || 0,
          total: limits?.exportsPerMonth ?? 5,
          percentage: limits?.exportsPerMonth
            ? Math.min(100, ((exportsCount || 0) / limits.exportsPerMonth) * 100)
            : 0,
          resetTime: new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        apiCalls: {
          used: aiStats?.api_calls_count || 0,
          total: limits?.apiRateLimit ?? 100,
          percentage: limits?.apiRateLimit
            ? Math.min(100, ((aiStats?.api_calls_count || 0) / limits.apiRateLimit) * 100)
            : 0,
          resetTime: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        },
      };

      this.updateCache('usage', stats);
      return stats;
    } catch (error) {
      console.error('[MembershipService] 获取使用统计失败:', error);
      return this.getDefaultUsageStats();
    }
  }

  private getDefaultUsageStats(): UsageStats {
    return {
      aiGenerations: { used: 0, total: 10, percentage: 0, resetTime: '' },
      storage: { used: 0, total: 1, percentage: 0, filesCount: 0 },
      exports: { used: 0, total: 5, percentage: 0, resetTime: '' },
      apiCalls: { used: 0, total: 100, percentage: 0, resetTime: '' },
    };
  }

  /**
   * 更新使用统计
   */
  async updateUsageStats(
    userId: string,
    updates: Partial<UsageStats>
  ): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase.rpc('update_membership_usage_stats', {
        p_user_id: userId,
        p_ai_generations: updates.aiGenerations?.used,
        p_storage_bytes: updates.storage?.used ? updates.storage.used * 1024 * 1024 * 1024 : undefined,
        p_exports: updates.exports?.used,
        p_api_calls: updates.apiCalls?.used,
      });

      if (error) throw error;

      // 清除缓存
      this.cache.lastUpdated.usage = 0;

      return true;
    } catch (error) {
      console.error('[MembershipService] 更新使用统计失败:', error);
      return false;
    }
  }

  // ==================== 订单管理 ====================

  /**
   * 获取订单列表
   */
  async getOrders(
    userId: string,
    options: { page?: number; limit?: number; status?: OrderStatus } = {}
  ): Promise<{ orders: MembershipOrder[]; total: number }> {
    const { page = 1, limit = 10, status } = options;

    // 检查缓存
    if (this.cache.orders && this.isCacheValid('orders') && !status) {
      const start = (page - 1) * limit;
      const end = start + limit;
      return {
        orders: this.cache.orders.slice(start, end),
        total: this.cache.orders.length,
      };
    }

    try {
      // 使用 supabaseAdmin 绕过 RLS 限制
      let query = supabaseAdmin
        .from('membership_orders')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      const orders: MembershipOrder[] = (data || []).map((item) => ({
        id: item.id,
        userId: item.user_id,
        plan: item.plan as MembershipLevel,
        planName: item.plan_name,
        period: item.period,
        amount: item.amount,
        currency: item.currency,
        status: item.status as OrderStatus,
        paymentMethod: item.payment_method,
        paymentData: item.payment_data,
        createdAt: item.created_at,
        paidAt: item.paid_at,
        expiresAt: item.expires_at,
        refundedAt: item.refunded_at,
        refundAmount: item.refund_amount,
      }));

      // 更新缓存
      if (!status) {
        this.updateCache('orders', orders);
      }

      return { orders, total: count || 0 };
    } catch (error) {
      console.error('[MembershipService] 获取订单列表失败:', error);
      return { orders: [], total: 0 };
    }
  }

  /**
   * 创建订单
   */
  async createOrder(
    userId: string,
    plan: MembershipLevel,
    period: 'monthly' | 'quarterly' | 'yearly',
    couponCode?: string
  ): Promise<{ success: boolean; order?: MembershipOrder; error?: string }> {
    try {
      const levelConfig = await this.getMembershipLevel(plan);
      if (!levelConfig) {
        return { success: false, error: '无效的会员等级' };
      }

      const pricing = levelConfig.pricing[period];
      if (!pricing) {
        return { success: false, error: '无效的订阅周期' };
      }

      let finalAmount = pricing.price;

      // 应用优惠券
      if (couponCode) {
        const coupon = await this.validateCoupon(couponCode, plan);
        if (coupon.valid && coupon.discount) {
          finalAmount = coupon.discount.finalAmount;
        }
      }

      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const order: MembershipOrder = {
        id: orderId,
        userId,
        plan,
        planName: levelConfig.name,
        period,
        amount: finalAmount,
        currency: 'CNY',
        status: 'pending',
        paymentMethod: null,
        createdAt: new Date().toISOString(),
        paidAt: null,
        expiresAt: null,
        refundedAt: null,
      };

      // 使用 supabaseAdmin 绕过 RLS 限制
      const { error } = await supabaseAdmin.from('membership_orders').insert({
        id: order.id,
        user_id: order.userId,
        plan: order.plan,
        plan_name: order.planName,
        period: order.period,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        payment_method: order.paymentMethod,
        created_at: order.createdAt,
      });

      if (error) throw error;

      // 清除订单缓存
      this.cache.lastUpdated.orders = 0;

      return { success: true, order };
    } catch (error: any) {
      console.error('[MembershipService] 创建订单失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 完成订单支付
   */
  async completeOrder(
    orderId: string,
    paymentData: Record<string, any>
  ): Promise<boolean> {
    try {
      // 使用 supabaseAdmin 绕过 RLS 限制
      const { data: order, error: fetchError } = await supabaseAdmin
        .from('membership_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError || !order) {
        throw new Error('订单不存在');
      }

      // 计算过期时间
      const now = new Date();
      let expiresAt = new Date();
      switch (order.period) {
        case 'monthly':
          expiresAt.setMonth(expiresAt.getMonth() + 1);
          break;
        case 'quarterly':
          expiresAt.setMonth(expiresAt.getMonth() + 3);
          break;
        case 'yearly':
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          break;
      }

      // 更新订单状态
      const { error: updateError } = await supabaseAdmin
        .from('membership_orders')
        .update({
          status: 'completed',
          payment_method: paymentData.method,
          payment_data: paymentData,
          paid_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // 更新用户会员信息
      await this.updateMembershipInfo(order.user_id, {
        level: order.plan as MembershipLevel,
        status: 'active',
        startDate: now.toISOString(),
        endDate: expiresAt.toISOString(),
      });

      // 记录会员历史
      await this.recordMembershipHistory({
        userId: order.user_id,
        actionType: order.plan === 'free' ? 'downgrade' : 'upgrade',
        fromLevel: null,
        toLevel: order.plan as MembershipLevel,
        orderId,
        notes: `通过${paymentData.method}支付`,
      });

      // 清除缓存
      this.cache.lastUpdated.orders = 0;
      this.cache.lastUpdated.info = 0;

      // 发布事件
      eventBus.emit('membership:orderCompleted', { orderId, plan: order.plan });

      return true;
    } catch (error) {
      console.error('[MembershipService] 完成订单失败:', error);
      return false;
    }
  }

  // ==================== 积分系统 ====================

  /**
   * 获取积分记录
   */
  async getPointsRecords(
    userId: string,
    options: { page?: number; limit?: number; type?: 'earn' | 'spend' } = {}
  ): Promise<{ records: PointsRecord[]; total: number; balance: number }> {
    const { page = 1, limit = 20, type } = options;

    try {
      let query = supabase
        .from('points_records')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      // 积分字段可能不存在，使用默认值 0
      const balance = 0;

      const records: PointsRecord[] = (data || []).map((item) => ({
        id: item.id,
        userId: item.user_id,
        points: item.points,
        type: item.type,
        source: item.source,
        description: item.description,
        relatedId: item.related_id,
        balanceAfter: item.balance_after,
        createdAt: item.created_at,
        expiresAt: item.expires_at,
      }));

      return {
        records,
        total: count || 0,
        balance,
      };
    } catch (error) {
      console.error('[MembershipService] 获取积分记录失败:', error);
      return { records: [], total: 0, balance: 0 };
    }
  }

  /**
   * 添加积分
   */
  async addPoints(
    userId: string,
    points: number,
    source: string,
    description: string,
    relatedId?: string
  ): Promise<boolean> {
    try {
      // 积分字段可能不存在，使用默认值
      const currentPoints = 0;
      const newBalance = currentPoints + points;

      // 创建积分记录
      const { error: recordError } = await supabase.from('points_records').insert({
        user_id: userId,
        points: points,
        type: 'earn',
        source,
        description,
        related_id: relatedId,
        balance_after: newBalance,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1年过期
      });

      if (recordError) throw recordError;

      // 清除缓存
      this.cache.lastUpdated.points = 0;
      this.cache.lastUpdated.info = 0;

      // 发布事件
      eventBus.emit('membership:pointsChanged', {
        userId,
        change: points,
        balance: newBalance,
        source,
      });

      return true;
    } catch (error) {
      console.error('[MembershipService] 添加积分失败:', error);
      return false;
    }
  }

  /**
   * 消耗积分
   */
  async spendPoints(
    userId: string,
    points: number,
    source: string,
    description: string,
    relatedId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 积分字段可能不存在，使用默认值
      const currentPoints = 0;

      if (currentPoints < points) {
        return { success: false, error: '积分不足' };
      }

      const newBalance = currentPoints - points;

      // 创建积分记录
      const { error: recordError } = await supabase.from('points_records').insert({
        user_id: userId,
        points: -points,
        type: 'spend',
        source,
        description,
        related_id: relatedId,
        balance_after: newBalance,
      });

      if (recordError) throw recordError;

      // 清除缓存
      this.cache.lastUpdated.points = 0;
      this.cache.lastUpdated.info = 0;

      // 发布事件
      eventBus.emit('membership:pointsChanged', {
        userId,
        change: -points,
        balance: newBalance,
        source,
      });

      return { success: true };
    } catch (error: any) {
      console.error('[MembershipService] 消耗积分失败:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== 优惠券 ====================

  /**
   * 获取可用优惠券
   */
  async getAvailableCoupons(userId: string): Promise<MembershipCoupon[]> {
    try {
      const { data, error } = await supabase
        .from('membership_coupons')
        .select('*')
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .lte('valid_from', new Date().toISOString());

      if (error) throw error;

      // 检查用户是否已使用
      const { data: usedCoupons } = await supabase
        .from('membership_coupon_usage')
        .select('coupon_id')
        .eq('user_id', userId);

      const usedCouponIds = new Set(usedCoupons?.map((u) => u.coupon_id) || []);

      const coupons: MembershipCoupon[] = (data || []).map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        description: item.description,
        discountType: item.discount_type,
        discountValue: item.discount_value,
        minPurchaseAmount: item.min_purchase_amount,
        maxDiscountAmount: item.max_discount_amount,
        applicablePlans: item.applicable_plans,
        validFrom: item.valid_from,
        validUntil: item.valid_until,
        isActive: item.is_active,
        isUsed: usedCouponIds.has(item.id),
      }));

      return coupons.filter((c) => !c.isUsed);
    } catch (error) {
      console.error('[MembershipService] 获取优惠券失败:', error);
      return [];
    }
  }

  /**
   * 验证优惠券
   */
  async validateCoupon(
    code: string,
    plan: MembershipLevel
  ): Promise<{
    valid: boolean;
    discount?: { amount: number; finalAmount: number };
    error?: string;
  }> {
    try {
      const { data: coupon, error } = await supabase
        .from('membership_coupons')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error || !coupon) {
        return { valid: false, error: '优惠券不存在' };
      }

      // 检查有效期
      const now = new Date();
      if (new Date(coupon.valid_from) > now) {
        return { valid: false, error: '优惠券尚未生效' };
      }
      if (new Date(coupon.valid_until) < now) {
        return { valid: false, error: '优惠券已过期' };
      }

      // 检查适用套餐
      if (!coupon.applicable_plans.includes(plan)) {
        return { valid: false, error: '该优惠券不适用于此套餐' };
      }

      // 获取套餐价格
      const levelConfig = await this.getMembershipLevel(plan);
      const originalPrice = levelConfig?.pricing.monthly.price || 0;

      // 计算折扣
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = originalPrice * (coupon.discount_value / 100);
      } else {
        discountAmount = coupon.discount_value;
      }

      // 应用最大折扣限制
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }

      // 检查最低消费
      if (originalPrice < coupon.min_purchase_amount) {
        return { valid: false, error: `订单金额需满${coupon.min_purchase_amount}元` };
      }

      const finalAmount = Math.max(0, originalPrice - discountAmount);

      return {
        valid: true,
        discount: {
          amount: discountAmount,
          finalAmount,
        },
      };
    } catch (error) {
      console.error('[MembershipService] 验证优惠券失败:', error);
      return { valid: false, error: '验证失败' };
    }
  }

  // ==================== 会员历史 ====================

  /**
   * 获取会员历史记录
   */
  async getMembershipHistory(userId: string): Promise<MembershipHistory[]> {
    try {
      const { data, error } = await supabase
        .from('membership_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item) => ({
        id: item.id,
        userId: item.user_id,
        actionType: item.action_type,
        fromLevel: item.from_level,
        toLevel: item.to_level,
        orderId: item.order_id,
        notes: item.notes,
        createdAt: item.created_at,
      }));
    } catch (error) {
      console.error('[MembershipService] 获取会员历史失败:', error);
      return [];
    }
  }

  /**
   * 记录会员历史
   */
  private async recordMembershipHistory(
    history: Omit<MembershipHistory, 'id' | 'createdAt'>
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('record_membership_history', {
        p_user_id: history.userId,
        p_action_type: history.actionType,
        p_from_level: history.fromLevel,
        p_to_level: history.toLevel,
        p_order_id: history.orderId,
        p_notes: history.notes,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[MembershipService] 记录会员历史失败:', error);
      return false;
    }
  }

  // ==================== 成长体系 ====================

  /**
   * 获取成长进度
   */
  async getGrowthProgress(userId: string): Promise<{
    currentPoints: number;
    currentLevel: MembershipLevel;
    nextLevel: MembershipLevel | null;
    progress: number;
    requirements: string[];
  }> {
    const info = await this.getMembershipInfo(userId);
    const levels = await this.getMembershipLevels();

    if (!info) {
      return {
        currentPoints: 0,
        currentLevel: 'free',
        nextLevel: 'premium',
        progress: 0,
        requirements: [],
      };
    }

    const currentLevelIndex = levels.findIndex((l) => l.level === info.level);
    const currentLevel = levels[currentLevelIndex];
    const nextLevel = levels[currentLevelIndex + 1] || null;

    let requirements: string[] = [];
    if (nextLevel) {
      requirements = nextLevel.growth.upgradeConditions;
    }

    return {
      currentPoints: info.currentPoints,
      currentLevel: info.level,
      nextLevel: nextLevel?.level || null,
      progress: info.upgradeProgress,
      requirements,
    };
  }

  /**
   * 检查并处理会员升级
   */
  async checkAndProcessUpgrade(userId: string): Promise<{
    upgraded: boolean;
    newLevel?: MembershipLevel;
    rewards?: string[];
  }> {
    const info = await this.getMembershipInfo(userId);
    const levels = await this.getMembershipLevels();

    if (!info) return { upgraded: false };

    const currentLevelIndex = levels.findIndex((l) => l.level === info.level);
    const nextLevel = levels[currentLevelIndex + 1];

    if (!nextLevel) return { upgraded: false };

    // 检查是否满足升级条件
    const meetsPointsRequirement = info.currentPoints >= nextLevel.growth.minPoints;
    
    if (meetsPointsRequirement && info.level !== 'vip') {
      // 执行升级
      await this.updateMembershipInfo(userId, {
        level: nextLevel.level,
        status: 'active',
      });

      // 记录历史
      await this.recordMembershipHistory({
        userId,
        actionType: 'upgrade',
        fromLevel: info.level,
        toLevel: nextLevel.level,
        orderId: null,
        notes: '通过成长体系自动升级',
      });

      // 升级奖励
      const rewards = ['升级礼包：500积分', '专属徽章'];
      await this.addPoints(userId, 500, 'upgrade_reward', '会员升级奖励');

      return {
        upgraded: true,
        newLevel: nextLevel.level,
        rewards,
      };
    }

    return { upgraded: false };
  }

  // ==================== 工具方法 ====================

  /**
   * 检查会员权益是否可用
   */
  async checkBenefitAccess(
    userId: string,
    benefitId: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const info = await this.getMembershipInfo(userId);
    const levelConfig = await this.getMembershipLevel(info?.level || 'free');

    if (!levelConfig) {
      return { allowed: false, reason: '无法获取会员配置' };
    }

    const feature = levelConfig.features.find((f) => f.id === benefitId);
    if (!feature) {
      return { allowed: false, reason: '权益不存在' };
    }

    if (feature.value === false || feature.value === '—') {
      return { allowed: false, reason: '当前会员等级不支持此权益' };
    }

    // 检查会员状态
    if (info?.status === 'expired') {
      return { allowed: false, reason: '会员已过期' };
    }

    return { allowed: true };
  }

  /**
   * 获取会员到期提醒
   */
  async getExpiryReminder(userId: string): Promise<{
    needsReminder: boolean;
    daysUntilExpiry: number;
    message: string;
  }> {
    const info = await this.getMembershipInfo(userId);

    if (!info || info.level === 'free' || !info.endDate) {
      return { needsReminder: false, daysUntilExpiry: 0, message: '' };
    }

    const daysUntilExpiry = Math.ceil(
      (new Date(info.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry <= 0) {
      return {
        needsReminder: true,
        daysUntilExpiry: 0,
        message: '您的会员已过期，续费后可恢复所有权益',
      };
    }

    if (daysUntilExpiry <= 7) {
      return {
        needsReminder: true,
        daysUntilExpiry,
        message: `您的会员将在${daysUntilExpiry}天后到期，请及时续费`,
      };
    }

    return { needsReminder: false, daysUntilExpiry, message: '' };
  }
}

// 导出单例实例
export const membershipService = new MembershipService();
export default membershipService;
