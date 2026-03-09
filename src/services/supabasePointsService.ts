/**
 * Supabase 积分服务 - 与数据库交互的积分服务
 * 支持实时记录每个用户的积分情况，真实反应且持久性保存
 */

import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// 类型定义
export interface PointsRecord {
  id: string;
  user_id: string;
  points: number;
  type: 'earned' | 'spent' | 'adjustment';
  source: string;
  source_type: 'achievement' | 'task' | 'daily' | 'consumption' | 'exchange' | 'system' | 'invite' | 'checkin';
  description: string;
  balance_after: number;
  related_id?: string;
  related_type?: string;
  metadata: Record<string, any>;
  created_at: string;
  expires_at?: string;
}

export interface UserPointsBalance {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  version: number;
  last_updated_at: string;
  created_at: string;
}

export interface PointsRule {
  id: string;
  name: string;
  description: string;
  rule_type: 'earn' | 'spend' | 'limit';
  source_type: string;
  points: number;
  daily_limit?: number;
  weekly_limit?: number;
  monthly_limit?: number;
  yearly_limit?: number;
  is_active: boolean;
  conditions: Record<string, any>;
}

export interface CheckinRecord {
  id: string;
  user_id: string;
  checkin_date: string;
  consecutive_days: number;
  points_earned: number;
  is_bonus: boolean;
  bonus_points: number;
  is_retroactive: boolean;
  created_at: string;
}

export interface TaskRecord {
  id: string;
  user_id: string;
  task_id: string;
  task_type: 'daily' | 'weekly' | 'monthly' | 'event' | 'achievement';
  task_title: string;
  progress: number;
  target: number;
  status: 'active' | 'completed' | 'expired';
  points_reward: number;
  completed_at?: string;
  expires_at?: string;
}

export interface ExchangeRecord {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  product_category: string;
  points_cost: number;
  quantity: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  created_at: string;
}

export interface InviteRecord {
  id: string;
  inviter_id: string;
  invitee_id?: string;
  invite_code: string;
  status: 'pending' | 'registered' | 'completed';
  inviter_points: number;
  invitee_points: number;
  created_at: string;
}

export interface ConsumptionRecord {
  id: string;
  user_id: string;
  order_id: string;
  order_amount: number;
  category: string;
  points: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  created_at: string;
}

export interface PointsStats {
  current_balance: number;
  total_earned: number;
  total_spent: number;
  today_earned: number;
  week_earned: number;
  month_earned: number;
  source_stats: Record<string, number>;
}

// Supabase 积分服务类
class SupabasePointsService {
  private realtimeChannels: Map<string, RealtimeChannel> = new Map();

  // ==================== 用户积分余额 ====================

  /**
   * 获取用户当前积分余额
   */
  async getUserBalance(userId: string): Promise<UserPointsBalance | null> {
    const { data, error } = await supabase
      .from('user_points_balance')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('获取用户积分余额失败:', error);
      return null;
    }

    // 如果没有记录，返回默认的零积分对象
    if (!data) {
      return {
        id: '',
        user_id: userId,
        balance: 0,
        total_earned: 0,
        total_spent: 0,
        version: 1,
        last_updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
    }

    return data;
  }

  /**
   * 获取当前登录用户的积分余额
   */
  async getCurrentUserBalance(): Promise<UserPointsBalance | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return this.getUserBalance(user.id);
  }

  /**
   * 订阅用户积分余额变化（Realtime）
   */
  subscribeToBalanceChanges(userId: string, callback: (balance: UserPointsBalance) => void): () => void {
    const channelName = `user_points_balance:${userId}`;
    
    // 如果已存在订阅，先取消
    if (this.realtimeChannels.has(channelName)) {
      this.realtimeChannels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_points_balance',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as UserPointsBalance);
        }
      )
      .subscribe();

    this.realtimeChannels.set(channelName, channel);

    // 返回取消订阅函数
    return () => {
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
      this.realtimeChannels.delete(channelName);
    };
  }

  // ==================== 积分记录 ====================

  /**
   * 获取用户积分记录
   */
  async getPointsRecords(
    userId: string,
    options: {
      type?: 'earned' | 'spent' | 'adjustment';
      sourceType?: string;
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<{ records: PointsRecord[]; count: number }> {
    const { type, sourceType, limit = 20, offset = 0, startDate, endDate } = options;

    let query = supabase
      .from('points_records')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (sourceType) {
      query = query.eq('source_type', sourceType);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('获取积分记录失败:', error);
      return { records: [], count: 0 };
    }

    return { records: data || [], count: count || 0 };
  }

  /**
   * 添加积分（使用RPC函数）
   */
  async addPoints(
    userId: string,
    points: number,
    source: string,
    sourceType: PointsRecord['source_type'],
    description: string,
    metadata: Record<string, any> = {}
  ): Promise<{ success: boolean; newBalance?: number; recordId?: string; error?: string }> {
    const { data, error } = await supabase.rpc('update_user_points_balance', {
      p_user_id: userId,
      p_points: Math.abs(points),
      p_type: 'earned',
      p_source: source,
      p_source_type: sourceType,
      p_description: description,
      p_metadata: metadata
    });

    if (error) {
      console.error('添加积分失败:', error);
      return { success: false, error: error.message };
    }

    return {
      success: data.success,
      newBalance: data.new_balance,
      recordId: data.record_id,
      error: data.error_message
    };
  }

  /**
   * 消耗积分（使用RPC函数）
   */
  async consumePoints(
    userId: string,
    points: number,
    source: string,
    sourceType: PointsRecord['source_type'],
    description: string,
    metadata: Record<string, any> = {}
  ): Promise<{ success: boolean; newBalance?: number; recordId?: string; error?: string }> {
    const { data, error } = await supabase.rpc('update_user_points_balance', {
      p_user_id: userId,
      p_points: -Math.abs(points),
      p_type: 'spent',
      p_source: source,
      p_source_type: sourceType,
      p_description: description,
      p_metadata: metadata
    });

    if (error) {
      console.error('消耗积分失败:', error);
      return { success: false, error: error.message };
    }

    return {
      success: data.success,
      newBalance: data.new_balance,
      recordId: data.record_id,
      error: data.error_message
    };
  }

  /**
   * 订阅积分记录变化（Realtime）
   */
  subscribeToPointsRecords(userId: string, callback: (record: PointsRecord) => void): () => void {
    const channelName = `points_records:${userId}`;
    
    if (this.realtimeChannels.has(channelName)) {
      this.realtimeChannels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'points_records',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as PointsRecord);
        }
      )
      .subscribe();

    this.realtimeChannels.set(channelName, channel);

    return () => {
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
      this.realtimeChannels.delete(channelName);
    };
  }

  // ==================== 积分统计 ====================

  /**
   * 获取用户积分统计
   */
  async getUserPointsStats(userId: string): Promise<PointsStats | null> {
    const { data, error } = await supabase.rpc('get_user_points_stats', {
      p_user_id: userId
    });

    if (error) {
      console.error('获取积分统计失败:', error);
      return null;
    }

    return data;
  }

  // ==================== 积分规则 ====================

  /**
   * 获取所有活跃的积分规则
   */
  async getActivePointsRules(): Promise<PointsRule[]> {
    const { data, error } = await supabase
      .from('points_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) {
      console.error('获取积分规则失败:', error);
      return [];
    }

    return data || [];
  }

  /**
   * 根据来源类型获取积分规则
   */
  async getPointsRuleBySourceType(sourceType: string): Promise<PointsRule | null> {
    const { data, error } = await supabase
      .from('points_rules')
      .select('*')
      .eq('source_type', sourceType)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('获取积分规则失败:', error);
      return null;
    }

    return data;
  }

  // ==================== 签到 ====================

  /**
   * 创建签到记录
   */
  async createCheckinRecord(record: Omit<CheckinRecord, 'id' | 'created_at'>): Promise<CheckinRecord | null> {
    // 先检查今天是否已经签到
    const { hasCheckin, record: existingRecord } = await this.getTodayCheckinStatus(record.user_id);
    if (hasCheckin && existingRecord) {
      console.log('今日已签到，返回已有记录');
      return existingRecord;
    }

    const { data, error } = await supabase
      .from('checkin_records')
      .insert(record)
      .select()
      .single();

    if (error) {
      // 如果是唯一约束冲突，说明已经签到了
      if (error.code === '23505' || error.message?.includes('unique constraint')) {
        console.log('签到记录已存在，获取已有记录');
        const { record: existing } = await this.getTodayCheckinStatus(record.user_id);
        return existing || null;
      }
      console.error('创建签到记录失败:', error);
      return null;
    }

    return data;
  }

  /**
   * 获取用户签到记录
   */
  async getUserCheckinRecords(userId: string, limit: number = 30): Promise<CheckinRecord[]> {
    const { data, error } = await supabase
      .from('checkin_records')
      .select('*')
      .eq('user_id', userId)
      .order('checkin_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('获取签到记录失败:', error);
      return [];
    }

    return data || [];
  }

  /**
   * 获取今日签到状态
   */
  async getTodayCheckinStatus(userId: string): Promise<{ hasCheckin: boolean; record?: CheckinRecord }> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('checkin_records')
      .select('*')
      .eq('user_id', userId)
      .eq('checkin_date', today)
      .single();

    if (error || !data) {
      return { hasCheckin: false };
    }

    return { hasCheckin: true, record: data };
  }

  // ==================== 任务 ====================

  /**
   * 创建或更新任务记录
   */
  async upsertTaskRecord(record: Partial<TaskRecord> & { user_id: string; task_id: string }): Promise<TaskRecord | null> {
    const { data, error } = await supabase
      .from('task_records')
      .upsert(record, { onConflict: 'user_id,task_id' })
      .select()
      .single();

    if (error) {
      console.error('更新任务记录失败:', error);
      return null;
    }

    return data;
  }

  /**
   * 获取用户任务记录
   */
  async getUserTaskRecords(
    userId: string,
    options: { status?: string; taskType?: string } = {}
  ): Promise<TaskRecord[]> {
    let query = supabase
      .from('task_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.taskType) {
      query = query.eq('task_type', options.taskType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('获取任务记录失败:', error);
      return [];
    }

    return data || [];
  }

  // ==================== 邀请 ====================

  /**
   * 创建邀请记录
   */
  async createInviteRecord(record: Omit<InviteRecord, 'id' | 'created_at'>): Promise<InviteRecord | null> {
    const { data, error } = await supabase
      .from('invite_records')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('创建邀请记录失败:', error);
      return null;
    }

    return data;
  }

  /**
   * 根据邀请码获取邀请记录
   */
  async getInviteByCode(inviteCode: string): Promise<InviteRecord | null> {
    const { data, error } = await supabase
      .from('invite_records')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();

    if (error) {
      console.error('获取邀请记录失败:', error);
      return null;
    }

    return data;
  }

  /**
   * 更新邀请记录（被邀请人注册）
   */
  async updateInviteOnRegister(inviteCode: string, inviteeId: string): Promise<boolean> {
    const { error } = await supabase
      .from('invite_records')
      .update({
        invitee_id: inviteeId,
        status: 'registered',
        registered_at: new Date().toISOString()
      })
      .eq('invite_code', inviteCode);

    if (error) {
      console.error('更新邀请记录失败:', error);
      return false;
    }

    return true;
  }

  /**
   * 获取用户邀请统计
   */
  async getUserInviteStats(userId: string): Promise<{
    totalInvites: number;
    registeredCount: number;
    completedCount: number;
    totalPoints: number;
  }> {
    const { data, error } = await supabase
      .from('invite_records')
      .select('*')
      .eq('inviter_id', userId);

    if (error || !data) {
      return { totalInvites: 0, registeredCount: 0, completedCount: 0, totalPoints: 0 };
    }

    return {
      totalInvites: data.length,
      registeredCount: data.filter(r => r.status === 'registered' || r.status === 'completed').length,
      completedCount: data.filter(r => r.status === 'completed').length,
      totalPoints: data.reduce((sum, r) => sum + r.inviter_points, 0)
    };
  }

  // ==================== 消费返积分 ====================

  /**
   * 创建消费返积分记录
   */
  async createConsumptionRecord(record: Omit<ConsumptionRecord, 'id' | 'created_at'>): Promise<ConsumptionRecord | null> {
    const { data, error } = await supabase
      .from('consumption_records')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('创建消费记录失败:', error);
      return null;
    }

    return data;
  }

  /**
   * 确认消费返积分
   */
  async confirmConsumptionRecord(recordId: string): Promise<boolean> {
    const { error } = await supabase
      .from('consumption_records')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      })
      .eq('id', recordId);

    if (error) {
      console.error('确认消费记录失败:', error);
      return false;
    }

    return true;
  }

  /**
   * 获取用户消费返积分记录
   */
  async getUserConsumptionRecords(userId: string, status?: string): Promise<ConsumptionRecord[]> {
    let query = supabase
      .from('consumption_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('获取消费记录失败:', error);
      return [];
    }

    return data || [];
  }

  // ==================== 积分兑换 ====================

  /**
   * 创建兑换记录
   */
  async createExchangeRecord(record: Omit<ExchangeRecord, 'id' | 'created_at'>): Promise<ExchangeRecord | null> {
    const { data, error } = await supabase
      .from('exchange_records')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('创建兑换记录失败:', error);
      return null;
    }

    return data;
  }

  /**
   * 获取用户兑换记录
   */
  async getUserExchangeRecords(userId: string, status?: string): Promise<ExchangeRecord[]> {
    let query = supabase
      .from('exchange_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('获取兑换记录失败:', error);
      return [];
    }

    return data || [];
  }

  /**
   * 更新兑换记录状态
   */
  async updateExchangeStatus(recordId: string, status: ExchangeRecord['status']): Promise<boolean> {
    const { error } = await supabase
      .from('exchange_records')
      .update({ status })
      .eq('id', recordId);

    if (error) {
      console.error('更新兑换状态失败:', error);
      return false;
    }

    return true;
  }

  /**
   * 订阅兑换记录变化（Realtime）
   */
  subscribeToExchangeRecords(userId: string, callback: (record: ExchangeRecord) => void): () => void {
    const channelName = `exchange_records:${userId}`;
    
    if (this.realtimeChannels.has(channelName)) {
      this.realtimeChannels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exchange_records',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as ExchangeRecord);
        }
      )
      .subscribe();

    this.realtimeChannels.set(channelName, channel);

    return () => {
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
      this.realtimeChannels.delete(channelName);
    };
  }

  // ==================== 积分限制 ====================

  /**
   * 检查积分限制
   */
  async checkPointsLimit(
    userId: string,
    sourceType: string,
    points: number,
    periodType: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily'
  ): Promise<{ canAdd: boolean; remaining: number; limit: number; used: number }> {
    const { data, error } = await supabase.rpc('check_points_limit', {
      p_user_id: userId,
      p_source_type: sourceType,
      p_points: points,
      p_period_type: periodType
    });

    if (error) {
      console.error('检查积分限制失败:', error);
      return { canAdd: false, remaining: 0, limit: 0, used: 0 };
    }

    return {
      canAdd: data.can_add,
      remaining: data.remaining,
      limit: data.limit_amount,
      used: data.used_amount
    };
  }

  // ==================== 积分排行榜 ====================

  /**
   * 获取积分排行榜
   */
  async getPointsLeaderboard(limit: number = 100): Promise<Array<{
    user_id: string;
    username: string;
    avatar_url: string;
    balance: number;
    rank: number;
  }>> {
    const { data, error } = await supabase
      .from('points_leaderboard')
      .select('*')
      .limit(limit);

    if (error) {
      console.error('获取排行榜失败:', error);
      return [];
    }

    return data || [];
  }

  // ==================== 清理 ====================

  /**
   * 取消所有实时订阅
   */
  unsubscribeAll(): void {
    this.realtimeChannels.forEach((channel) => {
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
    });
    this.realtimeChannels.clear();
  }
}

// 导出单例实例
export const supabasePointsService = new SupabasePointsService();
export default supabasePointsService;
