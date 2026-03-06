/**
 * 转盘活动管理后台服务
 * 提供转盘活动的CRUD操作和数据统计分析
 */

import { supabase, supabaseAdmin } from '@/lib/supabase';

// 转盘活动状态
export type LotteryStatus = 'draft' | 'active' | 'paused' | 'ended';

// 转盘奖品类型
export interface LotteryPrize {
  id: string;
  name: string;
  description?: string;
  probability: number; // 概率 0-1
  points: number; // 奖品价值（积分）
  stock: number; // 库存数量，-1表示无限
  imageUrl?: string;
  sortOrder: number;
  isEnabled: boolean;
  isRare?: boolean; // 是否稀有奖品
}

// 转盘活动
export interface LotteryActivity {
  id: string;
  name: string;
  description?: string;
  status: LotteryStatus;
  startTime: string;
  endTime: string;
  spinCost: number; // 每次抽奖消耗的积分
  dailyLimit: number; // 每人每日抽奖次数限制，-1表示无限制
  totalLimit: number; // 每人总抽奖次数限制，-1表示无限制
  prizes: LotteryPrize[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  totalSpins: number; // 总抽奖次数
  totalParticipants: number; // 总参与人数
}

// 用户抽奖记录
export interface UserSpinRecord {
  id: string;
  activityId: string;
  activityName: string;
  userId: string;
  username: string;
  avatar?: string;
  prizeId: string;
  prizeName: string;
  prizePoints: number;
  cost: number;
  spinTime: string;
  ip?: string;
  userAgent?: string;
}

// 活动统计
export interface LotteryStatistics {
  totalSpins: number;
  totalParticipants: number;
  totalCost: number; // 总消耗积分
  totalPrizeValue: number; // 总奖品价值
  winRate: number; // 中奖率
  topPrizes: { name: string; count: number }[]; // 热门奖品
  dailyStats: { date: string; spins: number; participants: number }[];
  hourlyStats: { hour: number; spins: number }[];
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 筛选条件
export interface LotteryFilter {
  keyword?: string;
  status?: LotteryStatus;
  startDate?: string;
  endDate?: string;
}

class LotteryAdminService {
  private readonly ACTIVITIES_TABLE = 'lottery_activities';
  private readonly PRIZES_TABLE = 'lottery_prizes';
  private readonly SPIN_RECORDS_TABLE = 'lottery_spin_records';

  // ========== 活动管理 ==========

  /**
   * 获取转盘活动列表
   */
  async getActivities(
    filter: LotteryFilter = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<LotteryActivity>> {
    try {
      let query = supabaseAdmin
        .from(this.ACTIVITIES_TABLE)
        .select('*', { count: 'exact' });

      // 应用筛选
      if (filter.keyword) {
        query = query.ilike('name', `%${filter.keyword}%`);
      }
      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      if (filter.startDate) {
        query = query.gte('start_time', filter.startDate);
      }
      if (filter.endDate) {
        query = query.lte('end_time', filter.endDate);
      }

      // 分页
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('获取转盘活动列表失败:', error);
        // 如果表不存在，返回空数据
        if (error.code === '42P01') {
          return {
            data: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
          };
        }
        throw new Error('获取转盘活动列表失败');
      }

      // 获取每个活动的奖品信息
      const activitiesWithPrizes = await Promise.all(
        (data || []).map(async (activity) => {
          const prizes = await this.getActivityPrizes(activity.id);
          return this.mapDbToActivity(activity, prizes);
        })
      );

      return {
        data: activitiesWithPrizes,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    } catch (error) {
      console.error('获取转盘活动列表失败:', error);
      // 返回空数据而不是抛出错误
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }
  }

  /**
   * 获取单个活动详情
   */
  async getActivityById(id: string): Promise<LotteryActivity | null> {
    const { data, error } = await supabaseAdmin
      .from(this.ACTIVITIES_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取活动详情失败:', error);
      return null;
    }

    if (!data) return null;

    const prizes = await this.getActivityPrizes(id);
    return this.mapDbToActivity(data, prizes);
  }

  /**
   * 创建转盘活动
   */
  async createActivity(
    activity: Omit<LotteryActivity, 'id' | 'createdAt' | 'updatedAt' | 'totalSpins' | 'totalParticipants'>,
    userId: string
  ): Promise<LotteryActivity> {
    // 插入活动基本信息
    const { data: activityData, error: activityError } = await supabaseAdmin
      .from(this.ACTIVITIES_TABLE)
      .insert({
        name: activity.name,
        description: activity.description,
        status: activity.status,
        start_time: activity.startTime,
        end_time: activity.endTime,
        spin_cost: activity.spinCost,
        daily_limit: activity.dailyLimit,
        total_limit: activity.totalLimit,
        created_by: userId,
      })
      .select()
      .single();

    if (activityError) {
      console.error('创建活动失败:', activityError);
      throw new Error('创建活动失败: ' + activityError.message);
    }

    // 插入奖品信息
    if (activity.prizes && activity.prizes.length > 0) {
      const prizesToInsert = activity.prizes.map((prize, index) => ({
        activity_id: activityData.id,
        name: prize.name,
        description: prize.description,
        probability: prize.probability,
        points: prize.points,
        stock: prize.stock,
        image_url: prize.imageUrl,
        sort_order: index,
        is_enabled: prize.isEnabled,
      }));

      const { error: prizesError } = await supabaseAdmin
        .from(this.PRIZES_TABLE)
        .insert(prizesToInsert);

      if (prizesError) {
        console.error('创建奖品失败:', prizesError);
        // 回滚：删除已创建的活动
        await this.deleteActivity(activityData.id);
        throw new Error('创建奖品失败: ' + prizesError.message);
      }
    }

    return this.getActivityById(activityData.id)!;
  }

  /**
   * 更新转盘活动
   */
  async updateActivity(
    id: string,
    activity: Partial<Omit<LotteryActivity, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<LotteryActivity> {
    // 更新活动基本信息
    const updateData: any = {};
    if (activity.name !== undefined) updateData.name = activity.name;
    if (activity.description !== undefined) updateData.description = activity.description;
    if (activity.status !== undefined) updateData.status = activity.status;
    if (activity.startTime !== undefined) updateData.start_time = activity.startTime;
    if (activity.endTime !== undefined) updateData.end_time = activity.endTime;
    if (activity.spinCost !== undefined) updateData.spin_cost = activity.spinCost;
    if (activity.dailyLimit !== undefined) updateData.daily_limit = activity.dailyLimit;
    if (activity.totalLimit !== undefined) updateData.total_limit = activity.totalLimit;

    const { error: activityError } = await supabaseAdmin
      .from(this.ACTIVITIES_TABLE)
      .update(updateData)
      .eq('id', id);

    if (activityError) {
      console.error('更新活动失败:', activityError);
      throw new Error('更新活动失败: ' + activityError.message);
    }

    // 更新奖品信息
    if (activity.prizes) {
      // 先删除原有奖品
      await supabaseAdmin
        .from(this.PRIZES_TABLE)
        .delete()
        .eq('activity_id', id);

      // 插入新奖品
      const prizesToInsert = activity.prizes.map((prize, index) => ({
        activity_id: id,
        name: prize.name,
        description: prize.description,
        probability: prize.probability,
        points: prize.points,
        stock: prize.stock,
        image_url: prize.imageUrl,
        sort_order: index,
        is_enabled: prize.isEnabled,
      }));

      const { error: prizesError } = await supabaseAdmin
        .from(this.PRIZES_TABLE)
        .insert(prizesToInsert);

      if (prizesError) {
        console.error('更新奖品失败:', prizesError);
        throw new Error('更新奖品失败: ' + prizesError.message);
      }
    }

    return this.getActivityById(id)!;
  }

  /**
   * 删除转盘活动
   */
  async deleteActivity(id: string): Promise<void> {
    // 先删除关联的奖品和记录
    await supabaseAdmin
      .from(this.PRIZES_TABLE)
      .delete()
      .eq('activity_id', id);

    await supabaseAdmin
      .from(this.SPIN_RECORDS_TABLE)
      .delete()
      .eq('activity_id', id);

    // 删除活动
    const { error } = await supabaseAdmin
      .from(this.ACTIVITIES_TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除活动失败:', error);
      throw new Error('删除活动失败: ' + error.message);
    }
  }

  /**
   * 更新活动状态
   */
  async updateActivityStatus(id: string, status: LotteryStatus): Promise<void> {
    const { error } = await supabaseAdmin
      .from(this.ACTIVITIES_TABLE)
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('更新活动状态失败:', error);
      throw new Error('更新活动状态失败: ' + error.message);
    }
  }

  // ========== 用户抽奖记录 ==========

  /**
   * 获取用户抽奖记录
   */
  async getSpinRecords(
    activityId?: string,
    userId?: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedResponse<UserSpinRecord>> {
    try {
      // 使用视图查询
      let query = supabaseAdmin
        .from('lottery_spin_records_with_users')
        .select('*', { count: 'exact' });

      if (activityId) {
        query = query.eq('activity_id', activityId);
      }
      if (userId) {
        query = query.eq('user_id', userId);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('获取抽奖记录失败:', error);
        // 如果表不存在，返回空数据
        if (error.code === '42P01') {
          return {
            data: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
          };
        }
        throw new Error('获取抽奖记录失败');
      }

      const records: UserSpinRecord[] = (data || []).map((item: any) => ({
        id: item.id,
        activityId: item.activity_id,
        activityName: item.activity_name || '',
        userId: item.user_id,
        username: item.username || '',
        avatar: item.avatar,
        prizeId: item.prize_id,
        prizeName: item.prize_name || '',
        prizePoints: item.prize_points || 0,
        cost: item.cost || 0,
        spinTime: item.created_at,
        ip: item.ip_address,
        userAgent: item.user_agent,
      }));

      return {
        data: records,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    } catch (error) {
      console.error('获取抽奖记录失败:', error);
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }
  }

  /**
   * 导出抽奖记录
   */
  async exportSpinRecords(
    activityId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<UserSpinRecord[]> {
    try {
      let query = supabaseAdmin
        .from('lottery_spin_records_with_users')
        .select('*');

      if (activityId) {
        query = query.eq('activity_id', activityId);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) {
        console.error('导出记录失败:', error);
        if (error.code === '42P01') {
          return [];
        }
        throw new Error('导出记录失败');
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        activityId: item.activity_id,
        activityName: item.activity_name || '',
        userId: item.user_id,
        username: item.username || '',
        avatar: item.avatar,
        prizeId: item.prize_id,
        prizeName: item.prize_name || '',
        prizePoints: item.prize_points || 0,
        cost: item.cost || 0,
        spinTime: item.created_at,
        ip: item.ip_address,
        userAgent: item.user_agent,
      }));
    } catch (error) {
      console.error('导出记录失败:', error);
      return [];
    }
  }

  // ========== 数据统计 ==========

  /**
   * 获取活动统计
   */
  async getActivityStatistics(activityId: string): Promise<LotteryStatistics> {
    try {
      // 使用 RPC 函数获取统计数据
      const { data: stats, error: statsError } = await supabaseAdmin
        .rpc('get_lottery_activity_stats', { p_activity_id: activityId });

      if (statsError) {
        console.error('获取活动统计失败:', statsError);
        if (statsError.code === '42883') {
          // 函数不存在，返回默认数据
          return this.getDefaultStatistics();
        }
      }

      const statData = stats?.[0] || { total_spins: 0, total_participants: 0, total_cost: 0, win_rate: 0 };

      // 获取热门奖品
      const { data: topPrizesData, error: topPrizesError } = await supabaseAdmin
        .rpc('get_lottery_top_prizes', { p_activity_id: activityId, p_limit: 5 });

      if (topPrizesError) {
        console.error('获取热门奖品失败:', topPrizesError);
      }

      const topPrizes = (topPrizesData || []).map((p: any) => ({
        name: p.name,
        count: Number(p.count),
      }));

      // 获取每日统计
      const { data: dailyData, error: dailyError } = await supabaseAdmin
        .rpc('get_lottery_daily_stats', { p_activity_id: activityId, p_days: 30 });

      if (dailyError) {
        console.error('获取每日统计失败:', dailyError);
      }

      const dailyStats = (dailyData || []).map((d: any) => ({
        date: d.date,
        spins: Number(d.spins),
        participants: Number(d.participants),
      }));

      // 获取每小时统计
      const { data: hourlyData, error: hourlyError } = await supabaseAdmin
        .rpc('get_lottery_hourly_stats', { p_activity_id: activityId });

      if (hourlyError) {
        console.error('获取小时统计失败:', hourlyError);
      }

      const hourlyMap: Record<number, number> = {};
      (hourlyData || []).forEach((h: any) => {
        hourlyMap[h.hour] = Number(h.spins);
      });

      const hourlyStats = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        spins: hourlyMap[i] || 0,
      }));

      return {
        totalSpins: Number(statData.total_spins) || 0,
        totalParticipants: Number(statData.total_participants) || 0,
        totalCost: Number(statData.total_cost) || 0,
        totalPrizeValue: 0, // 暂不计算
        winRate: Number(statData.win_rate) || 0,
        topPrizes,
        dailyStats,
        hourlyStats,
      };
    } catch (error) {
      console.error('获取活动统计失败:', error);
      return this.getDefaultStatistics();
    }
  }

  private getDefaultStatistics(): LotteryStatistics {
    return {
      totalSpins: 0,
      totalParticipants: 0,
      totalCost: 0,
      totalPrizeValue: 0,
      winRate: 0,
      topPrizes: [],
      dailyStats: [],
      hourlyStats: Array.from({ length: 24 }, (_, i) => ({ hour: i, spins: 0 })),
    };
  }

  // ========== 私有方法 ==========

  private async getActivityPrizes(activityId: string): Promise<LotteryPrize[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.PRIZES_TABLE)
        .select('*')
        .eq('activity_id', activityId)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('获取奖品列表失败:', error);
        if (error.code === '42P01') {
          return [];
        }
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        probability: item.probability,
        points: item.points,
        stock: item.stock,
        imageUrl: item.image_url,
        sortOrder: item.sort_order,
        isEnabled: item.is_enabled,
        isRare: item.is_rare,
      }));
    } catch (error) {
      console.error('获取奖品列表失败:', error);
      return [];
    }
  }

  private mapDbToActivity(dbData: any, prizes: LotteryPrize[]): LotteryActivity {
    return {
      id: dbData.id,
      name: dbData.name,
      description: dbData.description,
      status: dbData.status,
      startTime: dbData.start_time,
      endTime: dbData.end_time,
      spinCost: dbData.spin_cost,
      dailyLimit: dbData.daily_limit,
      totalLimit: dbData.total_limit,
      prizes,
      createdAt: dbData.created_at,
      updatedAt: dbData.updated_at,
      createdBy: dbData.created_by,
      totalSpins: dbData.total_spins || 0,
      totalParticipants: dbData.total_participants || 0,
    };
  }
}

export const lotteryAdminService = new LotteryAdminService();
export default lotteryAdminService;
