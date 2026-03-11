/**
 * 津币服务 - 提供津币余额查询、消费、发放等核心功能
 * 实现与后端数据库的真实数据交互
 */

import { supabase, supabaseAdmin } from '@/lib/supabase';
import eventBus from '@/lib/eventBus';

// ==================== 类型定义 ====================

// 津币记录类型
export type JinbiRecordType = 'grant' | 'earn' | 'spend' | 'purchase' | 'refund' | 'expire';

// 津币记录
export interface JinbiRecord {
  id: string;
  userId: string;
  amount: number;
  type: JinbiRecordType;
  source: string;
  sourceType?: string;
  description: string;
  balanceAfter: number;
  relatedId?: string;
  relatedType?: string;
  expiresAt?: string;
  metadata: Record<string, any>;
  createdAt: string;
}

// 津币余额
export interface JinbiBalance {
  userId: string;
  totalBalance: number;
  availableBalance: number;
  frozenBalance: number;
  totalEarned: number;
  totalSpent: number;
  lastUpdated: string;
}

// 津币消费明细
export interface JinbiConsumptionDetail {
  id: string;
  userId: string;
  recordId: string;
  serviceType: string;
  serviceParams: Record<string, any>;
  jinbiCost: number;
  actualCost: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
}

// 津币套餐
export interface JinbiPackage {
  id: string;
  name: string;
  description?: string;
  jinbiAmount: number;
  price: number;
  currency: string;
  bonusJinbi: number;
  isActive: boolean;
  sortOrder: number;
}

// 服务计费标准
export interface ServicePricing {
  id: string;
  serviceType: string;
  serviceSubtype?: string;
  name: string;
  description?: string;
  baseCost: number;
  params: Record<string, any>;
  isActive: boolean;
}

// 会员津币配置
export interface MembershipJinbiConfig {
  level: string;
  monthlyGrant: number;
  dailyCheckinBase: number;
  dailyCheckinMax: number;
  concurrentLimit: number;
  discountRate: number;
  storageGb?: number;
}

// 消费结果
export interface ConsumeResult {
  success: boolean;
  error?: string;
  recordId?: string;
  actualCost?: number;
}

// 缓存数据结构
interface JinbiCache {
  balance: JinbiBalance | null;
  packages: JinbiPackage[] | null;
  pricing: ServicePricing[] | null;
  lastUpdated: {
    balance: number;
    packages: number;
    pricing: number;
  };
}

// ==================== 服务配置 ====================

// 服务类型常量
export const SERVICE_TYPES = {
  AGENT_CHAT: 'agent_chat',
  IMAGE_GEN: 'image_gen',
  VIDEO_GEN: 'video_gen',
  TEXT_GEN: 'text_gen',
  AUDIO_GEN: 'audio_gen',
  EXPORT: 'export',
} as const;

// 缓存时间配置
const CACHE_TTL = {
  balance: 1000 * 30,      // 30秒
  packages: 1000 * 60 * 5, // 5分钟
  pricing: 1000 * 60 * 10, // 10分钟
};

// ==================== 津币服务类 ====================

class JinbiService {
  private readonly CACHE_KEY = 'JINBI_CACHE';
  
  private cache: JinbiCache = {
    balance: null,
    packages: null,
    pricing: null,
    lastUpdated: {
      balance: 0,
      packages: 0,
      pricing: 0,
    },
  };

  constructor() {
    this.loadCacheFromStorage();
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
      console.warn('[JinbiService] 加载缓存失败:', error);
    }
  }

  private saveCacheToStorage() {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('[JinbiService] 保存缓存失败:', error);
    }
  }

  private isCacheValid(type: keyof JinbiCache['lastUpdated']): boolean {
    const lastUpdated = this.cache.lastUpdated[type];
    const ttl = CACHE_TTL[type];
    return Date.now() - lastUpdated < ttl;
  }

  private updateCache<T extends keyof JinbiCache>(
    key: T,
    value: JinbiCache[T]
  ) {
    this.cache[key] = value as any;
    this.cache.lastUpdated[key as keyof JinbiCache['lastUpdated']] = Date.now();
    this.saveCacheToStorage();
  }

  public clearCache() {
    this.cache = {
      balance: null,
      packages: null,
      pricing: null,
      lastUpdated: {
        balance: 0,
        packages: 0,
        pricing: 0,
      },
    };
    localStorage.removeItem(this.CACHE_KEY);
  }

  // ==================== 余额管理 ====================

  /**
   * 获取用户津币余额
   */
  async getBalance(userId: string): Promise<JinbiBalance | null> {
    if (!userId) return null;

    // 检查缓存
    if (this.cache.balance?.userId === userId && this.isCacheValid('balance')) {
      return this.cache.balance;
    }

    try {
      const { data, error } = await supabase
        .from('user_jinbi_balance')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // 如果没有记录，创建默认记录
        if (error.code === 'PGRST116') {
          return this.createDefaultBalance(userId);
        }
        throw error;
      }

      const balance: JinbiBalance = {
        userId: data.user_id,
        totalBalance: data.total_balance,
        availableBalance: data.available_balance,
        frozenBalance: data.frozen_balance,
        totalEarned: data.total_earned,
        totalSpent: data.total_spent,
        lastUpdated: data.last_updated,
      };

      this.updateCache('balance', balance);
      return balance;
    } catch (error) {
      console.error('[JinbiService] 获取余额失败:', error);
      return null;
    }
  }

  /**
   * 创建默认余额记录
   */
  private async createDefaultBalance(userId: string): Promise<JinbiBalance> {
    try {
      const { data, error } = await supabase
        .from('user_jinbi_balance')
        .insert({
          user_id: userId,
          total_balance: 0,
          available_balance: 0,
          frozen_balance: 0,
          total_earned: 0,
          total_spent: 0,
        })
        .select()
        .single();

      if (error) throw error;

      const balance: JinbiBalance = {
        userId: data.user_id,
        totalBalance: data.total_balance,
        availableBalance: data.available_balance,
        frozenBalance: data.frozen_balance,
        totalEarned: data.total_earned,
        totalSpent: data.total_spent,
        lastUpdated: data.last_updated,
      };

      this.updateCache('balance', balance);
      return balance;
    } catch (error) {
      console.error('[JinbiService] 创建默认余额失败:', error);
      return {
        userId,
        totalBalance: 0,
        availableBalance: 0,
        frozenBalance: 0,
        totalEarned: 0,
        totalSpent: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * 检查余额是否充足
   */
  async checkBalance(userId: string, requiredAmount: number): Promise<{ sufficient: boolean; balance?: number; error?: string }> {
    const balance = await this.getBalance(userId);
    
    if (!balance) {
      return { sufficient: false, error: '无法获取余额信息' };
    }

    if (balance.availableBalance < requiredAmount) {
      return { 
        sufficient: false, 
        balance: balance.availableBalance,
        error: `津币余额不足，需要 ${requiredAmount}，当前 ${balance.availableBalance}` 
      };
    }

    return { sufficient: true, balance: balance.availableBalance };
  }

  // ==================== 津币消费 ====================

  /**
   * 消费津币
   */
  async consumeJinbi(
    userId: string,
    amount: number,
    serviceType: string,
    description: string,
    options: {
      serviceParams?: Record<string, any>;
      relatedId?: string;
      relatedType?: string;
    } = {}
  ): Promise<ConsumeResult> {
    if (!userId || amount <= 0) {
      return { success: false, error: '参数错误' };
    }

    try {
      // 1. 检查余额
      const balanceCheck = await this.checkBalance(userId, amount);
      if (!balanceCheck.sufficient) {
        return { success: false, error: balanceCheck.error };
      }

      // 2. 获取当前余额
      const currentBalance = balanceCheck.balance || 0;
      const newBalance = currentBalance - amount;

      // 3. 创建消费记录
      const { data: record, error: recordError } = await supabase
        .from('jinbi_records')
        .insert({
          user_id: userId,
          amount: -amount,
          type: 'spend',
          source: serviceType,
          description,
          balance_after: newBalance,
          related_id: options.relatedId,
          related_type: options.relatedType,
        })
        .select()
        .single();

      if (recordError) throw recordError;

      // 4. 创建消费明细
      await supabase.from('jinbi_consumption_details').insert({
        user_id: userId,
        record_id: record.id,
        service_type: serviceType,
        service_params: options.serviceParams || {},
        jinbi_cost: amount,
        actual_cost: amount,
        status: 'completed',
      });

      // 5. 更新余额（先获取当前总消费金额）
      const { data: currentBalanceData } = await supabase
        .from('user_jinbi_balance')
        .select('total_spent')
        .eq('user_id', userId)
        .single();
      
      const currentTotalSpent = currentBalanceData?.total_spent || 0;
      
      const { error: updateError } = await supabase
        .from('user_jinbi_balance')
        .update({
          total_balance: newBalance,
          available_balance: newBalance,
          total_spent: currentTotalSpent + amount,
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // 6. 清除缓存
      this.cache.lastUpdated.balance = 0;

      // 7. 发布事件
      eventBus.emit('jinbi:consumed', {
        userId,
        amount,
        serviceType,
        newBalance,
        recordId: record.id,
      });

      return { success: true, recordId: record.id, actualCost: amount };
    } catch (error: any) {
      console.error('[JinbiService] 消费津币失败:', error);
      return { success: false, error: error.message || '消费失败' };
    }
  }

  /**
   * 预扣津币（用于异步操作）
   */
  async freezeJinbi(
    userId: string,
    amount: number,
    serviceType: string
  ): Promise<{ success: boolean; freezeId?: string; error?: string }> {
    try {
      const balance = await this.getBalance(userId);
      if (!balance || balance.availableBalance < amount) {
        return { success: false, error: '余额不足' };
      }

      const newAvailable = balance.availableBalance - amount;
      const newFrozen = balance.frozenBalance + amount;

      const { error } = await supabase
        .from('user_jinbi_balance')
        .update({
          available_balance: newAvailable,
          frozen_balance: newFrozen,
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      this.cache.lastUpdated.balance = 0;

      return { success: true, freezeId: `${userId}_${Date.now()}` };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 确认消费（解冻并扣款）
   */
  async confirmConsumption(
    userId: string,
    amount: number,
    freezeId: string
  ): Promise<ConsumeResult> {
    return this.consumeJinbi(userId, amount, 'confirmed', '确认消费');
  }

  /**
   * 取消预扣（解冻）
   */
  async unfreezeJinbi(
    userId: string,
    amount: number,
    freezeId: string
  ): Promise<boolean> {
    try {
      const balance = await this.getBalance(userId);
      if (!balance) return false;

      const newAvailable = balance.availableBalance + amount;
      const newFrozen = Math.max(0, balance.frozenBalance - amount);

      const { error } = await supabase
        .from('user_jinbi_balance')
        .update({
          available_balance: newAvailable,
          frozen_balance: newFrozen,
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      this.cache.lastUpdated.balance = 0;
      return true;
    } catch (error) {
      console.error('[JinbiService] 解冻津币失败:', error);
      return false;
    }
  }

  // ==================== 津币发放 ====================

  /**
   * 发放津币
   */
  async grantJinbi(
    userId: string,
    amount: number,
    source: string,
    description: string,
    options: {
      expiresAt?: string;
      relatedId?: string;
      relatedType?: string;
    } = {}
  ): Promise<{ success: boolean; error?: string; recordId?: string }> {
    if (!userId || amount <= 0) {
      return { success: false, error: '参数错误' };
    }

    try {
      // 1. 获取当前余额
      const balance = await this.getBalance(userId);
      const currentBalance = balance?.totalBalance || 0;
      const newBalance = currentBalance + amount;

      // 2. 创建发放记录
      const { data: record, error: recordError } = await supabase
        .from('jinbi_records')
        .insert({
          user_id: userId,
          amount: amount,
          type: 'grant',
          source,
          description,
          balance_after: newBalance,
          related_id: options.relatedId,
          related_type: options.relatedType,
          expires_at: options.expiresAt,
        })
        .select()
        .single();

      if (recordError) throw recordError;

      // 3. 更新余额
      const { error: updateError } = await supabase
        .from('user_jinbi_balance')
        .update({
          total_balance: newBalance,
          available_balance: newBalance,
          total_earned: supabase.rpc('increment', { x: amount }),
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // 4. 清除缓存
      this.cache.lastUpdated.balance = 0;

      // 5. 发布事件
      eventBus.emit('jinbi:granted', {
        userId,
        amount,
        source,
        newBalance,
        recordId: record.id,
      });

      return { success: true, recordId: record.id };
    } catch (error: any) {
      console.error('[JinbiService] 发放津币失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 赚取津币（任务、签到等）
   */
  async earnJinbi(
    userId: string,
    amount: number,
    source: string,
    description: string,
    options: {
      expiresAt?: string;
      relatedId?: string;
    } = {}
  ): Promise<{ success: boolean; error?: string }> {
    return this.grantJinbi(userId, amount, source, description, {
      ...options,
      relatedType: 'earn',
    });
  }

  // ==================== 津币记录查询 ====================

  /**
   * 获取津币记录
   */
  async getRecords(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      type?: JinbiRecordType;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<{ records: JinbiRecord[]; total: number }> {
    const { page = 1, limit = 20, type, startDate, endDate } = options;

    try {
      let query = supabase
        .from('jinbi_records')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error, count } = await query.range(
        (page - 1) * limit,
        page * limit - 1
      );

      if (error) throw error;

      const records: JinbiRecord[] = (data || []).map((item) => ({
        id: item.id,
        userId: item.user_id,
        amount: item.amount,
        type: item.type,
        source: item.source,
        sourceType: item.source_type,
        description: item.description,
        balanceAfter: item.balance_after,
        relatedId: item.related_id,
        relatedType: item.related_type,
        expiresAt: item.expires_at,
        metadata: item.metadata || {},
        createdAt: item.created_at,
      }));

      return { records, total: count || 0 };
    } catch (error) {
      console.error('[JinbiService] 获取记录失败:', error);
      return { records: [], total: 0 };
    }
  }

  /**
   * 获取消费明细
   */
  async getConsumptionDetails(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      serviceType?: string;
    } = {}
  ): Promise<{ details: JinbiConsumptionDetail[]; total: number }> {
    const { page = 1, limit = 20, serviceType } = options;

    try {
      let query = supabase
        .from('jinbi_consumption_details')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (serviceType) {
        query = query.eq('service_type', serviceType);
      }

      const { data, error, count } = await query.range(
        (page - 1) * limit,
        page * limit - 1
      );

      if (error) throw error;

      const details: JinbiConsumptionDetail[] = (data || []).map((item) => ({
        id: item.id,
        userId: item.user_id,
        recordId: item.record_id,
        serviceType: item.service_type,
        serviceParams: item.service_params || {},
        jinbiCost: item.jinbi_cost,
        actualCost: item.actual_cost,
        status: item.status,
        createdAt: item.created_at,
      }));

      return { details, total: count || 0 };
    } catch (error) {
      console.error('[JinbiService] 获取消费明细失败:', error);
      return { details: [], total: 0 };
    }
  }

  // ==================== 津币套餐 ====================

  /**
   * 获取津币套餐
   */
  async getPackages(): Promise<JinbiPackage[]> {
    // 检查缓存
    if (this.cache.packages && this.isCacheValid('packages')) {
      return this.cache.packages;
    }

    try {
      const { data, error } = await supabase
        .from('jinbi_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const packages: JinbiPackage[] = (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        jinbiAmount: item.jinbi_amount,
        price: item.price,
        currency: item.currency,
        bonusJinbi: item.bonus_jinbi,
        isActive: item.is_active,
        sortOrder: item.sort_order,
      }));

      this.updateCache('packages', packages);
      return packages;
    } catch (error) {
      console.error('[JinbiService] 获取套餐失败:', error);
      return [];
    }
  }

  // ==================== 服务计费标准 ====================

  /**
   * 获取服务计费标准
   */
  async getServicePricing(): Promise<ServicePricing[]> {
    // 检查缓存
    if (this.cache.pricing && this.isCacheValid('pricing')) {
      return this.cache.pricing;
    }

    try {
      const { data, error } = await supabase
        .from('service_pricing')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const pricing: ServicePricing[] = (data || []).map((item) => ({
        id: item.id,
        serviceType: item.service_type,
        serviceSubtype: item.service_subtype,
        name: item.name,
        description: item.description,
        baseCost: item.base_cost,
        params: item.params || {},
        isActive: item.is_active,
      }));

      this.updateCache('pricing', pricing);
      return pricing;
    } catch (error) {
      console.error('[JinbiService] 获取计费标准失败:', error);
      return [];
    }
  }

  /**
   * 获取特定服务的计费
   */
  async getServiceCost(
    serviceType: string,
    serviceSubtype?: string
  ): Promise<number> {
    const pricing = await this.getServicePricing();
    const service = pricing.find(
      (p) =>
        p.serviceType === serviceType &&
        (serviceSubtype ? p.serviceSubtype === serviceSubtype : true)
    );
    return service?.baseCost || 0;
  }

  // ==================== 会员津币配置 ====================

  /**
   * 获取会员津币配置
   */
  async getMembershipConfig(level: string): Promise<MembershipJinbiConfig | null> {
    try {
      const { data, error } = await supabase
        .from('membership_jinbi_config')
        .select('*')
        .eq('level', level)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      return {
        level: data.level,
        monthlyGrant: data.monthly_grant,
        dailyCheckinBase: data.daily_checkin_base,
        dailyCheckinMax: data.daily_checkin_max,
        concurrentLimit: data.concurrent_limit,
        discountRate: data.discount_rate,
        storageGb: data.storage_gb,
      };
    } catch (error) {
      console.error('[JinbiService] 获取会员配置失败:', error);
      return null;
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 计算实际消费（考虑会员折扣）
   */
  async calculateActualCost(
    userId: string,
    baseCost: number
  ): Promise<number> {
    try {
      // 获取用户会员等级
      const { data: userData } = await supabase
        .from('users')
        .select('membership_level')
        .eq('id', userId)
        .single();

      const config = await this.getMembershipConfig(userData?.membership_level || 'free');
      const discountRate = config?.discountRate || 1;

      return Math.ceil(baseCost * discountRate);
    } catch (error) {
      return baseCost;
    }
  }

  /**
   * 获取本月统计
   */
  async getMonthlyStats(userId: string): Promise<{
    earned: number;
    spent: number;
    netChange: number;
  }> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('jinbi_records')
        .select('amount, type')
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString());

      if (error) throw error;

      let earned = 0;
      let spent = 0;

      (data || []).forEach((record) => {
        if (record.amount > 0) {
          earned += record.amount;
        } else {
          spent += Math.abs(record.amount);
        }
      });

      return {
        earned,
        spent,
        netChange: earned - spent,
      };
    } catch (error) {
      console.error('[JinbiService] 获取月度统计失败:', error);
      return { earned: 0, spent: 0, netChange: 0 };
    }
  }
}

// 导出单例实例
export const jinbiService = new JinbiService();
export default jinbiService;
