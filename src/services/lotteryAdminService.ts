/**
 * 转盘活动管理后台服务
 * 提供转盘活动的CRUD操作和数据统计分析
 */

import { supabase, supabaseAdmin } from '@/lib/supabaseClient';

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
    let query = supabaseAdmin
      .from(this.SPIN_RECORDS_TABLE)
      .select(`
        *,
        activity:activity_id (name),
        user:user_id (username, avatar)
      `, { count: 'exact' });

    if (activityId) {
      query = query.eq('activity_id', activityId);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (startDate) {
      query = query.gte('spin_time', startDate);
    }
    if (endDate) {
      query = query.lte('spin_time', endDate);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('spin_time', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('获取抽奖记录失败:', error);
      throw new Error('获取抽奖记录失败');
    }

    const records: UserSpinRecord[] = (data || []).map((item: any) => ({
      id: item.id,
      activityId: item.activity_id,
      activityName: item.activity?.name || '',
      userId: item.user_id,
      username: item.user?.username || '',
      avatar: item.user?.avatar,
      prizeId: item.prize_id,
      prizeName: item.prize_name,
      prizePoints: item.prize_points,
      cost: item.cost,
      spinTime: item.spin_time,
      ip: item.ip,
      userAgent: item.user_agent,
    }));

    return {
      data: records,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * 导出抽奖记录
   */
  async exportSpinRecords(
    activityId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<UserSpinRecord[]> {
    let query = supabaseAdmin
      .from(this.SPIN_RECORDS_TABLE)
      .select(`
        *,
        activity:activity_id (name),
        user:user_id (username, avatar)
      `);

    if (activityId) {
      query = query.eq('activity_id', activityId);
    }
    if (startDate) {
      query = query.gte('spin_time', startDate);
    }
    if (endDate) {
      query = query.lte('spin_time', endDate);
    }

    const { data, error } = await query
      .order('spin_time', { ascending: false });

    if (error) {
      console.error('导出记录失败:', error);
      throw new Error('导出记录失败');
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      activityId: item.activity_id,
      activityName: item.activity?.name || '',
      userId: item.user_id,
      username: item.user?.username || '',
      avatar: item.user?.avatar,
      prizeId: item.prize_id,
      prizeName: item.prize_name,
      prizePoints: item.prize_points,
      cost: item.cost,
      spinTime: item.spin_time,
      ip: item.ip,
      userAgent: item.user_agent,
    }));
  }

  // ========== 数据统计 ==========

  /**
   * 获取活动统计
   */
  async getActivityStatistics(activityId: string): Promise<LotteryStatistics> {
    // 获取总抽奖次数
    const { count: totalSpins, error: spinsError } = await supabaseAdmin
      .from(this.SPIN_RECORDS_TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', activityId);

    if (spinsError) {
      console.error('获取总抽奖次数失败:', spinsError);
    }

    // 获取参与人数（去重）
    const { data: participants, error: participantsError } = await supabaseAdmin
      .from(this.SPIN_RECORDS_TABLE)
      .select('user_id')
      .eq('activity_id', activityId);

    if (participantsError) {
      console.error('获取参与人数失败:', participantsError);
    }

    const uniqueParticipants = new Set(participants?.map(p => p.user_id)).size;

    // 获取总消耗和总奖品价值
    const { data: stats, error: statsError } = await supabaseAdmin
      .from(this.SPIN_RECORDS_TABLE)
      .select('cost, prize_points')
      .eq('activity_id', activityId);

    if (statsError) {
      console.error('获取统计数据失败:', statsError);
    }

    const totalCost = stats?.reduce((sum, item) => sum + (item.cost || 0), 0) || 0;
    const totalPrizeValue = stats?.reduce((sum, item) => sum + (item.prize_points || 0), 0) || 0;

    // 获取中奖率（有奖品记录 / 总记录）
    const { count: winCount, error: winError } = await supabaseAdmin
      .from(this.SPIN_RECORDS_TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', activityId)
      .gt('prize_points', 0);

    if (winError) {
      console.error('获取中奖数失败:', winError);
    }

    const winRate = totalSpins ? ((winCount || 0) / totalSpins) * 100 : 0;

    // 获取热门奖品
    const { data: prizeStats, error: prizeError } = await supabaseAdmin
      .from(this.SPIN_RECORDS_TABLE)
      .select('prize_name')
      .eq('activity_id', activityId)
      .gt('prize_points', 0);

    if (prizeError) {
      console.error('获取奖品统计失败:', prizeError);
    }

    const prizeCount: Record<string, number> = {};
    prizeStats?.forEach(item => {
      prizeCount[item.prize_name] = (prizeCount[item.prize_name] || 0) + 1;
    });

    const topPrizes = Object.entries(prizeCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 获取每日统计（最近30天）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: dailyData, error: dailyError } = await supabaseAdmin
      .from(this.SPIN_RECORDS_TABLE)
      .select('spin_time, user_id')
      .eq('activity_id', activityId)
      .gte('spin_time', thirtyDaysAgo.toISOString());

    if (dailyError) {
      console.error('获取每日统计失败:', dailyError);
    }

    const dailyMap: Record<string, { spins: number; participants: Set<string> }> = {};
    dailyData?.forEach(item => {
      const date = item.spin_time.split('T')[0];
      if (!dailyMap[date]) {
        dailyMap[date] = { spins: 0, participants: new Set() };
      }
      dailyMap[date].spins++;
      dailyMap[date].participants.add(item.user_id);
    });

    const dailyStats = Object.entries(dailyMap)
      .map(([date, data]) => ({
        date,
        spins: data.spins,
        participants: data.participants.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 获取每小时统计
    const hourlyMap: Record<number, number> = {};
    dailyData?.forEach(item => {
      const hour = new Date(item.spin_time).getHours();
      hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
    });

    const hourlyStats = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      spins: hourlyMap[i] || 0,
    }));

    return {
      totalSpins: totalSpins || 0,
      totalParticipants: uniqueParticipants,
      totalCost,
      totalPrizeValue,
      winRate,
      topPrizes,
      dailyStats,
      hourlyStats,
    };
  }

  // ========== 私有方法 ==========

  private async getActivityPrizes(activityId: string): Promise<LotteryPrize[]> {
    const { data, error } = await supabaseAdmin
      .from(this.PRIZES_TABLE)
      .select('*')
      .eq('activity_id', activityId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('获取奖品列表失败:', error);
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
    }));
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
