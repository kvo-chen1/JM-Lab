// 管理后台数据服务
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';

export interface DashboardStats {
  totalUsers: number;
  totalWorks: number;
  pendingAudit: number;
  adopted: number;
  userTrend: number; // 较上月增长率
  worksTrend: number; // 较上月增长率
  pendingTrend: number; // 较昨日增长
  adoptedTrend: number; // 较上月增长
}

export interface ActivityData {
  name: string;
  新增用户: number;
  活跃用户: number;
  创作数量: number;
}

export interface AuditStats {
  name: string;
  value: number;
}

export interface PendingWork {
  id: string;
  title: string;
  creator: string;
  creatorId: string;
  thumbnail: string;
  submitTime: string;
  status: string;
}

export interface CommercialApplication {
  id: string;
  title: string;
  creator: string;
  thumbnail: string;
  brand: string;
  status: string;
  applyTime: string;
}

// 积分规则类型（适配现有数据库表结构）
interface PointsRule {
  id: string;
  name: string;
  description: string;
  rule_type: string;
  source_type: string;
  points: number;
  daily_limit: number;
  weekly_limit: number | null;
  monthly_limit: number | null;
  yearly_limit: number | null;
  is_active: boolean;
  priority: number;
  conditions: Record<string, any>;
  created_at: string;
  updated_at: string;
}

class AdminService {
  // 获取控制台统计数据 - 直接从 Supabase 获取，确保数据一致性
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // 获取总用户数
      const { count: totalUsers, error: userError } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (userError) {
        console.warn('获取总用户数失败:', userError);
      }

      // 获取作品总数
      const { count: totalWorks, error: worksError } = await supabaseAdmin
        .from('works')
        .select('*', { count: 'exact', head: true });
      
      if (worksError) {
        console.warn('获取作品总数失败:', worksError);
      }

      // 获取待审核数量
      const { count: pendingAudit, error: pendingError } = await supabaseAdmin
        .from('works')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (pendingError) {
        console.warn('获取待审核数失败:', pendingError);
      }

      // 获取已采纳的活动数量（已发布的活动）
      const { count: adopted, error: adoptedError } = await supabaseAdmin
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');
      
      if (adoptedError) {
        console.warn('获取已采纳数失败:', adoptedError);
      }

      // 计算趋势（与上月比较）
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthStr = lastMonth.toISOString();

      // 获取上月用户数
      const { count: lastMonthUsers } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', lastMonthStr);

      // 获取上月作品数
      const { count: lastMonthWorks } = await supabaseAdmin
        .from('works')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', lastMonthStr);

      // 获取上月已采纳活动数
      const { count: lastMonthAdopted } = await supabaseAdmin
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .lt('created_at', lastMonthStr);

      // 获取昨日待审核数
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { count: yesterdayPending } = await supabaseAdmin
        .from('works')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .lt('created_at', yesterday.toISOString());

      // 计算各项趋势
      const userTrend = (lastMonthUsers || 0) > 0
        ? Math.round(((totalUsers || 0) - (lastMonthUsers || 0)) / (lastMonthUsers || 1) * 100)
        : 0;

      const worksTrend = (lastMonthWorks || 0) > 0
        ? Math.round(((totalWorks || 0) - (lastMonthWorks || 0)) / (lastMonthWorks || 1) * 100)
        : 0;

      const adoptedTrend = (lastMonthAdopted || 0) > 0
        ? Math.round(((adopted || 0) - (lastMonthAdopted || 0)) / (lastMonthAdopted || 1) * 100)
        : 0;

      const pendingTrend = (pendingAudit || 0) - (yesterdayPending || 0);

      return {
        totalUsers: totalUsers || 0,
        totalWorks: totalWorks || 0,
        pendingAudit: pendingAudit || 0,
        adopted: adopted || 0,
        userTrend,
        worksTrend,
        pendingTrend,
        adoptedTrend
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return this.getDefaultDashboardStats();
    }
  }

  // 默认统计数据
  private getDefaultDashboardStats(): DashboardStats {
    return {
      totalUsers: 0,
      totalWorks: 0,
      pendingAudit: 0,
      adopted: 0,
      userTrend: 0,
      worksTrend: 0,
      pendingTrend: 0,
      adoptedTrend: 0
    };
  }

  // 获取用户活跃度数据（支持周/月/年）
  async getUserActivityData(period: 'week' | 'month' | 'year' = 'week'): Promise<ActivityData[]> {
    try {
      const data: ActivityData[] = [];
      const now = new Date();
      
      // 根据周期确定数据点数量和标签
      let dataPoints: number;
      let labels: string[];
      let dateInterval: number; // 每个数据点之间的天数
      
      switch (period) {
        case 'month':
          dataPoints = 30;
          dateInterval = 1;
          labels = Array.from({ length: 30 }, (_, i) => `${i + 1}日`);
          break;
        case 'year':
          dataPoints = 12;
          dateInterval = 30;
          labels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
          break;
        case 'week':
        default:
          dataPoints = 7;
          dateInterval = 1;
          labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
          break;
      }

      for (let i = dataPoints - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i * dateInterval);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        // 获取当日新增用户
        let newUsers = 0;
        try {
          const { count } = await supabaseAdmin
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfDay.toISOString())
            .lte('created_at', endOfDay.toISOString());
          newUsers = count || 0;
        } catch (e) {
          console.warn('获取当日新增用户失败:', e);
        }

        // 获取当日活跃用户（通过 user_behavior_logs 表统计）
        let activeUsers = 0;
        try {
          const { count } = await supabaseAdmin
            .from('user_behavior_logs')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfDay.toISOString())
            .lte('created_at', endOfDay.toISOString());
          // 估算活跃用户数为行为日志记录数的 1/10（去重）
          activeUsers = Math.round((count || 0) / 10);
        } catch (e) {
          console.warn('获取当日活跃用户失败:', e);
        }

        // 获取当日创作数量（从 works 表）
        let worksCount = 0;
        try {
          const { count } = await supabaseAdmin
            .from('works')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfDay.toISOString())
            .lte('created_at', endOfDay.toISOString());
          worksCount = count || 0;
        } catch (e) {
          console.warn('获取当日创作数量失败:', e);
        }

        data.push({
          name: labels[dataPoints - 1 - i],
          新增用户: newUsers,
          活跃用户: activeUsers || Math.round(newUsers * 1.5),
          创作数量: worksCount
        });
      }

      return data;
    } catch (error) {
      console.error('获取活跃度数据失败:', error);
      return [];
    }
  }

  // 获取内容审核统计数据
  async getAuditStats(): Promise<AuditStats[]> {
    try {
      // 待审核（从 works 表）
      let pending = 0;
      try {
        const { count } = await supabaseAdmin
          .from('works')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        pending = count || 0;
      } catch (e) {
        console.warn('获取待审核数失败:', e);
      }

      // 已通过（从 works 表）
      let approved = 0;
      try {
        const { count } = await supabaseAdmin
          .from('works')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published');
        approved = count || 0;
      } catch (e) {
        console.warn('获取已通过数失败:', e);
      }

      // 已拒绝（从 works 表）
      let rejected = 0;
      try {
        const { count } = await supabaseAdmin
          .from('works')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'rejected');
        rejected = count || 0;
      } catch (e) {
        console.warn('获取已拒绝数失败:', e);
      }

      return [
        { name: '待审核', value: pending },
        { name: '已通过', value: approved },
        { name: '已拒绝', value: rejected }
      ];
    } catch (error) {
      console.error('获取审核统计失败:', error);
      return [
        { name: '待审核', value: 0 },
        { name: '已通过', value: 0 },
        { name: '已拒绝', value: 0 }
      ];
    }
  }

  // 获取待审核作品列表
  async getPendingWorks(): Promise<PendingWork[]> {
    try {
      const { data: works, error } = await supabaseAdmin
        .from('works')
        .select('id, title, thumbnail, creator_id, created_at, status')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (!works || works.length === 0) return [];

      // 获取创作者信息
      const creatorIds = works.map(w => w.creator_id).filter(Boolean);
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, username')
        .in('id', creatorIds);

      const userMap = new Map(users?.map(u => [u.id, u.username]) || []);

      return works.map(work => ({
        id: work.id,
        title: work.title,
        creator: userMap.get(work.creator_id) || '未知用户',
        creatorId: work.creator_id,
        thumbnail: work.thumbnail || 'https://via.placeholder.com/150',
        submitTime: new Date(work.created_at).toLocaleString('zh-CN'),
        status: work.status
      }));
    } catch (error) {
      console.error('获取待审核作品失败:', error);
      return [];
    }
  }

  // 审核作品
  async auditWork(workId: string, action: 'approve' | 'reject'): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('works')
        .update({ 
          status: action === 'approve' ? 'published' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', workId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('审核作品失败:', error);
      return false;
    }
  }

  // 获取数据分析概览统计
  async getAnalyticsOverview(timeRange: '7d' | '30d' | '90d' | '1y' | 'all' = '30d'): Promise<{
    totalUsers: number;
    totalWorks: number;
    totalViews: number;
    totalLikes: number;
    userGrowth: number;
    worksGrowth: number;
    viewsGrowth: number;
    likesGrowth: number;
  }> {
    try {
      const now = new Date();
      let startDate: Date;
      let prevStartDate: Date;
      
      switch (timeRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          prevStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          prevStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          prevStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          prevStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
          prevStartDate = new Date(0);
      }

      // 获取累计总用户数（所有用户）
      const { count: totalUsers } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true });

      // 获取累计总作品数（所有作品）
      const { count: totalWorks } = await supabaseAdmin
        .from('works')
        .select('*', { count: 'exact', head: true });

      // 获取累计总浏览量（所有作品的 views 总和）
      const { data: viewsData } = await supabaseAdmin
        .from('works')
        .select('views');
      const totalViews = viewsData?.reduce((sum, work) => sum + (work.views || 0), 0) || 0;

      // 获取累计总点赞数（所有作品的 likes 总和）
      const { data: likesData } = await supabaseAdmin
        .from('works')
        .select('likes');
      const totalLikes = likesData?.reduce((sum, work) => sum + (work.likes || 0), 0) || 0;

      // 获取当前时间段新增用户数
      const { count: currentPeriodUsers } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      // 获取上一时间段新增用户数
      const { count: prevPeriodUsers } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // 获取当前时间段新增作品数
      const { count: currentPeriodWorks } = await supabaseAdmin
        .from('works')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      // 获取上一时间段新增作品数
      const { count: prevPeriodWorks } = await supabaseAdmin
        .from('works')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // 获取当前时间段新增浏览量
      const { data: currentViewsData } = await supabaseAdmin
        .from('works')
        .select('views')
        .gte('created_at', startDate.toISOString());
      const currentViews = currentViewsData?.reduce((sum, work) => sum + (work.views || 0), 0) || 0;

      // 获取上一时间段新增浏览量
      const { data: prevViewsData } = await supabaseAdmin
        .from('works')
        .select('views')
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());
      const prevViews = prevViewsData?.reduce((sum, work) => sum + (work.views || 0), 0) || 0;

      // 获取当前时间段新增点赞数
      const { data: currentLikesData } = await supabaseAdmin
        .from('works')
        .select('likes')
        .gte('created_at', startDate.toISOString());
      const currentLikes = currentLikesData?.reduce((sum, work) => sum + (work.likes || 0), 0) || 0;

      // 获取上一时间段新增点赞数
      const { data: prevLikesData } = await supabaseAdmin
        .from('works')
        .select('likes')
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());
      const prevLikes = prevLikesData?.reduce((sum, work) => sum + (work.likes || 0), 0) || 0;

      // 计算增长率（基于时间段内新增数据）
      const userGrowth = prevPeriodUsers && prevPeriodUsers > 0 
        ? Math.round(((currentPeriodUsers || 0) - prevPeriodUsers) / prevPeriodUsers * 100) 
        : (currentPeriodUsers || 0) > 0 ? 100 : 0;
      const worksGrowth = prevPeriodWorks && prevPeriodWorks > 0 
        ? Math.round(((currentPeriodWorks || 0) - prevPeriodWorks) / prevPeriodWorks * 100) 
        : (currentPeriodWorks || 0) > 0 ? 100 : 0;
      const viewsGrowth = prevViews > 0 
        ? Math.round((currentViews - prevViews) / prevViews * 100) 
        : currentViews > 0 ? 100 : 0;
      const likesGrowth = prevLikes > 0 
        ? Math.round((currentLikes - prevLikes) / prevLikes * 100) 
        : currentLikes > 0 ? 100 : 0;

      return {
        totalUsers: totalUsers || 0,
        totalWorks: totalWorks || 0,
        totalViews,
        totalLikes,
        userGrowth,
        worksGrowth,
        viewsGrowth,
        likesGrowth,
      };
    } catch (error) {
      console.error('获取数据分析概览失败:', error);
      return {
        totalUsers: 0,
        totalWorks: 0,
        totalViews: 0,
        totalLikes: 0,
        userGrowth: 0,
        worksGrowth: 0,
        viewsGrowth: 0,
        likesGrowth: 0,
      };
    }
  }

  // 获取趋势数据
  async getTrendData(
    timeRange: '7d' | '30d' | '90d' | '1y' | 'all' = '30d',
    metric: 'users' | 'works' | 'views' | 'likes' = 'users'
  ): Promise<{ date: string; value: number }[]> {
    try {
      const now = new Date();
      let days = 30;

      switch (timeRange) {
        case '7d': days = 7; break;
        case '30d': days = 30; break;
        case '90d': days = 90; break;
        case '1y': days = 365; break;
        case 'all': days = 365; break;
      }

      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days + 1);
      startDate.setHours(0, 0, 0, 0);

      // 生成日期数组（使用统一的格式）
      const dateArray: string[] = [];
      const dateKeyMap = new Map<string, string>(); // 用于存储 ISO 日期到显示日期的映射

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        // 使用统一的格式：M月D日
        const displayDate = `${date.getMonth() + 1}月${date.getDate()}日`;
        const isoDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
        dateArray.push(displayDate);
        dateKeyMap.set(isoDate, displayDate);
      }

      // 按日期分组统计
      const dateMap = new Map<string, number>();

      // 初始化所有日期为0
      dateArray.forEach(dateStr => {
        dateMap.set(dateStr, 0);
      });

      // 批量获取数据
      let rawData: any[] = [];

      if (metric === 'users') {
        const { data } = await supabaseAdmin
          .from('users')
          .select('created_at')
          .order('created_at', { ascending: true });
        rawData = data || [];
      } else if (metric === 'works') {
        const { data } = await supabaseAdmin
          .from('works')
          .select('created_at, views, likes')
          .order('created_at', { ascending: true });
        rawData = data || [];
      } else if (metric === 'views' || metric === 'likes') {
        // 对于 views 和 likes，查询 analytics_daily_stats 每日统计表
        const { data } = await supabaseAdmin
          .from('analytics_daily_stats')
          .select('stat_date, page_views, total_likes')
          .gte('stat_date', startDate.toISOString().split('T')[0])
          .order('stat_date', { ascending: true });

        if (data && data.length > 0) {
          // 使用每日统计数据
          data.forEach(item => {
            const dateStr = item.stat_date as string;
            const displayDate = dateKeyMap.get(dateStr);
            if (displayDate) {
              const value = metric === 'views' ? (item.page_views || 0) : (item.total_likes || 0);
              dateMap.set(displayDate, value);
            }
          });

          // 转换为数组格式并返回
          const result: { date: string; value: number }[] = [];
          dateArray.forEach(dateStr => {
            result.push({ date: dateStr, value: dateMap.get(dateStr) || 0 });
          });
          return result;
        }

        // 如果没有每日统计数据，尝试从 works 表估算
        // 注意：这里统计的是每日新增作品的 views/likes 总和，不是真实的每日浏览/点赞数
        const { data: worksData } = await supabaseAdmin
          .from('works')
          .select('created_at, views, likes')
          .order('created_at', { ascending: true });
        rawData = worksData || [];
      }

      // 统计每天的数据
      let matchedCount = 0;
      rawData.forEach((item, index) => {
        // 处理数字时间戳（毫秒或秒）
        let createdAt = item.created_at;
        if (typeof createdAt === 'number') {
          if (createdAt < 1e12) {
            createdAt = createdAt * 1000;
          }
        }

        const itemDate = new Date(createdAt);

        // 只统计在日期范围内的数据
        if (itemDate >= startDate && itemDate <= now) {
          matchedCount++;
          const isoDate = itemDate.toISOString().split('T')[0];
          const displayDate = dateKeyMap.get(isoDate);

          if (displayDate) {
            if (metric === 'users' || metric === 'works') {
              dateMap.set(displayDate, (dateMap.get(displayDate) || 0) + 1);
            } else if (metric === 'views') {
              // 对于 views，使用作品的 views 字段（累积值）
              // 这里简单处理：将作品的 views 分配到创建日期
              dateMap.set(displayDate, (dateMap.get(displayDate) || 0) + (item.views || 0));
            } else if (metric === 'likes') {
              dateMap.set(displayDate, (dateMap.get(displayDate) || 0) + (item.likes || 0));
            }
          }
        }

        // 打印前3条数据的处理情况用于调试
        if (index < 3) {
          console.log(`[getTrendData] ${metric} - 数据${index}:`, {
            created_at: item.created_at,
            parsedDate: itemDate.toISOString(),
            inRange: itemDate >= startDate && itemDate <= now,
            isoDate: itemDate.toISOString().split('T')[0],
            displayDate: dateKeyMap.get(itemDate.toISOString().split('T')[0]),
            views: item.views,
            likes: item.likes
          });
        }
      });

      console.log(`[getTrendData] ${metric} - 原始数据条数:`, rawData.length);
      console.log(`[getTrendData] ${metric} - 匹配日期范围的数据:`, matchedCount);
      console.log(`[getTrendData] ${metric} - 统计结果:`, Array.from(dateMap.entries()));

      // 转换为数组格式
      const data: { date: string; value: number }[] = [];
      dateArray.forEach(dateStr => {
        data.push({ date: dateStr, value: dateMap.get(dateStr) || 0 });
      });

      return data;
    } catch (error) {
      console.error('获取趋势数据失败:', error);
      return [];
    }
  }

  // 获取设备分布数据
  async getDeviceDistribution(timeRange: '7d' | '30d' | '90d' | '1y' | 'all' = '30d'): Promise<{ name: string; value: number; count?: number }[]> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return this.estimateDeviceDistribution();
      }

      const response = await fetch('/api/admin/analytics/devices', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      // 调试日志
      console.log('[AdminService] 设备分布 API 响应:', result);
      if (result.data) {
        console.log('[AdminService] 设备分布 data 详情:', JSON.stringify(result.data, null, 2));
      }

      if (response.ok && result.code === 0 && result.data) {
        return result.data;
      }

      // 如果 API 调用失败，返回估算数据
      return this.estimateDeviceDistribution();
    } catch (error) {
      console.error('获取设备分布数据失败:', error);
      return this.estimateDeviceDistribution();
    }
  }

  // 基于当前时间估算设备分布（无数据时的默认方案）
  private estimateDeviceDistribution(): { name: string; value: number; count: number }[] {
    // 根据当前时段估算：工作时间桌面端多，晚间移动端多
    const hour = new Date().getHours();
    const isWorkTime = hour >= 9 && hour < 18;
    
    if (isWorkTime) {
      return [
        { name: '桌面端', value: 55, count: 0 },
        { name: '移动端', value: 35, count: 0 },
        { name: '平板', value: 10, count: 0 },
      ];
    } else {
      return [
        { name: '移动端', value: 50, count: 0 },
        { name: '桌面端', value: 35, count: 0 },
        { name: '平板', value: 15, count: 0 },
      ];
    }
  }

  // 获取用户来源数据
  async getSourceDistribution(timeRange: '7d' | '30d' | '90d' | '1y' | 'all' = '30d'): Promise<{ name: string; value: number; count?: number }[]> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return this.getDefaultSourceDistribution();
      }

      const response = await fetch('/api/admin/analytics/sources', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      // 调试日志
      console.log('[AdminService] 流量来源 API 响应:', result);
      if (result.data) {
        console.log('[AdminService] 流量来源 data 详情:', JSON.stringify(result.data, null, 2));
      }

      if (response.ok && result.code === 0 && result.data) {
        return result.data;
      }

      // 如果 API 调用失败，返回默认数据
      return this.getDefaultSourceDistribution();
    } catch (error) {
      console.error('获取用户来源数据失败:', error);
      return this.getDefaultSourceDistribution();
    }
  }

  // 默认来源分布数据
  private getDefaultSourceDistribution(): { name: string; value: number; count: number }[] {
    return [
      { name: '直接访问', value: 35, count: 0 },
      { name: '搜索引擎', value: 28, count: 0 },
      { name: '社交媒体', value: 22, count: 0 },
      { name: '外部链接', value: 15, count: 0 },
    ];
  }

  // 获取热门内容
  async getTopContent(limit: number = 5): Promise<{
    id: string;
    title: string;
    views: number;
    likes: number;
    author: string;
  }[]> {
    try {
      const { data: works, error } = await supabaseAdmin
        .from('works')
        .select('id, title, views, likes, creator_id')
        .order('views', { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!works || works.length === 0) return [];

      // 获取创作者信息
      const creatorIds = works.map(w => w.creator_id).filter(Boolean);
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, username')
        .in('id', creatorIds);

      const userMap = new Map(users?.map(u => [u.id, u.username]) || []);

      return works.map(work => ({
        id: work.id,
        title: work.title,
        views: work.views || 0,
        likes: work.likes || 0,
        author: userMap.get(work.creator_id) || '未知用户',
      }));
    } catch (error) {
      console.error('获取热门内容失败:', error);
      return [];
    }
  }

  // ==================== 商业化申请管理 ====================

  // 获取商业化申请统计
  async getCommercialStats(): Promise<{
    totalApplications: number;
    pendingReview: number;
    approved: number;
    rejected: number;
    negotiating: number;
    totalValue: number;
  }> {
    try {
      // 获取总数
      const { count: total } = await supabaseAdmin
        .from('commercial_applications')
        .select('*', { count: 'exact', head: true });

      // 获取各状态数量
      const { count: pending } = await supabaseAdmin
        .from('commercial_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: approved } = await supabaseAdmin
        .from('commercial_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { count: rejected } = await supabaseAdmin
        .from('commercial_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected');

      const { count: negotiating } = await supabaseAdmin
        .from('commercial_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'negotiating');

      // 获取总预算价值
      const { data: budgetData } = await supabaseAdmin
        .from('commercial_applications')
        .select('budget')
        .eq('status', 'approved');
      
      const totalValue = budgetData?.reduce((sum, item) => sum + (item.budget || 0), 0) || 0;

      return {
        totalApplications: total || 0,
        pendingReview: pending || 0,
        approved: approved || 0,
        rejected: rejected || 0,
        negotiating: negotiating || 0,
        totalValue,
      };
    } catch (error) {
      console.error('获取商业化统计失败:', error);
      return {
        totalApplications: 0,
        pendingReview: 0,
        approved: 0,
        rejected: 0,
        negotiating: 0,
        totalValue: 0,
      };
    }
  }

  // 获取商业化申请列表
  async getCommercialApplications(status?: string): Promise<{
    id: string;
    workId: string;
    workTitle: string;
    workThumbnail: string;
    creator: string;
    creatorAvatar: string;
    brand: string;
    brandLogo: string;
    status: 'pending' | 'approved' | 'rejected' | 'negotiating';
    submitDate: string;
    budget: number;
    description: string;
    culturalElements: string[];
    commercialValue: number;
    marketPotential: number;
  }[]> {
    try {
      let query = supabaseAdmin
        .from('commercial_applications')
        .select('*, works(id, title, thumbnail, creator_id)');

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: applications, error } = await query
        .order('submit_date', { ascending: false });

      if (error) throw error;
      if (!applications || applications.length === 0) return [];

      // 获取创作者信息
      const creatorIds = applications.map(app => app.creator_id).filter(Boolean);
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, username, avatar_url')
        .in('id', creatorIds);

      const userMap = new Map(users?.map(u => [u.id, { name: u.username, avatar: u.avatar_url }]) || []);

      return applications.map(app => ({
        id: app.id.toString(),
        workId: app.work_id?.toString() || '',
        workTitle: app.works?.title || '未知作品',
        workThumbnail: app.works?.thumbnail || 'https://via.placeholder.com/400',
        creator: userMap.get(app.creator_id)?.name || '未知用户',
        creatorAvatar: userMap.get(app.creator_id)?.avatar || 'https://via.placeholder.com/100',
        brand: app.brand_name,
        brandLogo: app.brand_logo || 'https://via.placeholder.com/100',
        status: app.status,
        submitDate: new Date(app.submit_date).toLocaleDateString('zh-CN'),
        budget: app.budget || 0,
        description: app.description || '',
        culturalElements: app.cultural_elements || [],
        commercialValue: app.commercial_value || 0,
        marketPotential: app.market_potential || 0,
      }));
    } catch (error) {
      console.error('获取商业化申请失败:', error);
      return [];
    }
  }

  // 更新商业化申请状态
  async updateCommercialStatus(
    applicationId: string, 
    status: 'pending' | 'approved' | 'rejected' | 'negotiating'
  ): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('commercial_applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('更新商业化申请状态失败:', error);
      return false;
    }
  }

  // 获取商业化申请评论
  async getCommercialComments(applicationId: string): Promise<{
    id: string;
    author: string;
    avatar: string;
    content: string;
    date: string;
  }[]> {
    try {
      const { data: comments, error } = await supabaseAdmin
        .from('commercial_application_comments')
        .select('*, users(id, username, avatar_url)')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!comments || comments.length === 0) return [];

      return comments.map(comment => ({
        id: comment.id.toString(),
        author: comment.users?.username || '未知用户',
        avatar: comment.users?.avatar_url || 'https://via.placeholder.com/100',
        content: comment.content,
        date: new Date(comment.created_at).toLocaleString('zh-CN'),
      }));
    } catch (error) {
      console.error('获取评论失败:', error);
      return [];
    }
  }

  // 添加商业化申请评论
  async addCommercialComment(
    applicationId: string,
    authorId: string,
    content: string
  ): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('commercial_application_comments')
        .insert({
          application_id: applicationId,
          author_id: authorId,
          content,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('添加评论失败:', error);
      return false;
    }
  }

  // ==================== 积分规则管理 ====================

  // 获取所有积分规则
  async getPointsRules(): Promise<PointsRule[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('points_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取积分规则失败:', error);
      return [];
    }
  }

  // 创建积分规则
  async createPointsRule(rule: Partial<PointsRule>): Promise<PointsRule | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('points_rules')
        .insert([{
          ...rule,
          rule_type: rule.rule_type || 'earn',
          source_type: rule.source_type || 'system',
          priority: rule.priority || 100,
          is_active: rule.is_active ?? true,
          conditions: rule.conditions || {},
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('创建积分规则失败:', error);
      return null;
    }
  }

  // 更新积分规则
  async updatePointsRule(id: string, rule: Partial<PointsRule>): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('points_rules')
        .update({ ...rule, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('更新积分规则失败:', error);
      return false;
    }
  }

  // 删除积分规则
  async deletePointsRule(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('points_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('删除积分规则失败:', error);
      return false;
    }
  }

  // ==================== 系统设置管理 ====================

  // 获取所有设置
  async getAllSettings(): Promise<Record<string, string>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('site_settings')
        .select('key, value');

      if (error) throw error;
      
      const settings: Record<string, string> = {};
      data?.forEach(item => {
        settings[item.key] = item.value;
      });
      
      return settings;
    } catch (error) {
      console.error('获取设置失败:', error);
      return {};
    }
  }

  // 获取指定分类的设置
  async getSettingsByCategory(category: string): Promise<Record<string, string>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('site_settings')
        .select('key, value')
        .eq('category', category);

      if (error) throw error;
      
      const settings: Record<string, string> = {};
      data?.forEach(item => {
        settings[item.key] = item.value;
      });
      
      return settings;
    } catch (error) {
      console.error('获取设置失败:', error);
      return {};
    }
  }

  // 更新设置
  async updateSetting(key: string, value: string, changedBy?: string): Promise<boolean> {
    try {
      // 获取旧值
      const { data: oldData } = await supabaseAdmin
        .from('site_settings')
        .select('value')
        .eq('key', key)
        .single();

      // 更新设置
      const { error } = await supabaseAdmin
        .from('site_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);

      if (error) throw error;

      // 记录历史
      await supabaseAdmin
        .from('settings_history')
        .insert({
          setting_key: key,
          old_value: oldData?.value,
          new_value: value,
          changed_by: changedBy,
        });

      return true;
    } catch (error) {
      console.error('更新设置失败:', error);
      return false;
    }
  }

  // 批量更新设置
  async updateSettings(settings: Record<string, string>, changedBy?: string): Promise<boolean> {
    try {
      for (const [key, value] of Object.entries(settings)) {
        await this.updateSetting(key, value, changedBy);
      }
      return true;
    } catch (error) {
      console.error('批量更新设置失败:', error);
      return false;
    }
  }

  // 获取存储使用统计
  async getStorageStats(): Promise<{
    totalSize: number;
    usedSize: number;
    fileCount: number;
    backupSize: number;
  }> {
    try {
      // 获取作品数量作为文件数估算
      const { count: worksCount } = await supabaseAdmin
        .from('works')
        .select('*', { count: 'exact', head: true });

      // 获取用户头像数量
      const { count: usersCount } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true });

      // 估算存储使用量（假设每个作品平均2MB，每个头像100KB）
      const estimatedWorksSize = (worksCount || 0) * 2 * 1024 * 1024;
      const estimatedAvatarsSize = (usersCount || 0) * 100 * 1024;
      const usedSize = estimatedWorksSize + estimatedAvatarsSize;

      return {
        totalSize: 100 * 1024 * 1024 * 1024, // 100GB 假设总容量
        usedSize,
        fileCount: (worksCount || 0) + (usersCount || 0),
        backupSize: Math.floor(usedSize * 0.3), // 估算备份占30%
      };
    } catch (error) {
      console.error('获取存储统计失败:', error);
      return {
        totalSize: 0,
        usedSize: 0,
        fileCount: 0,
        backupSize: 0,
      };
    }
  }

  // ==================== 用户管理 ====================

  // 获取用户统计数据（总用户数、活跃用户、新增用户、管理员数量）
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    admins: number;
  }> {
    try {
      // 获取总用户数
      const { count: totalUsers } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true });

      // 获取最近7天内登录的用户数（活跃用户）
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      let activeUsers = 0;
      try {
        const { count } = await supabaseAdmin
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('last_login', sevenDaysAgo.toISOString());
        activeUsers = count || 0;
      } catch (e) {
        // 如果没有 last_login 字段，使用估算值
        activeUsers = Math.round((totalUsers || 0) * 0.6);
      }

      // 获取今日新增用户数
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let newUsers = 0;
      try {
        const { count } = await supabaseAdmin
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString());
        newUsers = count || 0;
      } catch (e) {
        newUsers = 0;
      }

      // 获取管理员数量
      let admins = 0;
      try {
        const { count } = await supabaseAdmin
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin');
        admins = count || 0;
      } catch (e) {
        // 如果没有 role 字段，默认返回3
        admins = 3;
      }

      return {
        totalUsers: totalUsers || 0,
        activeUsers,
        newUsers,
        admins: admins || 3,
      };
    } catch (error) {
      console.error('获取用户统计数据失败:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsers: 0,
        admins: 3,
      };
    }
  }

  // 获取用户列表
  async getUsers(options?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{
    users: any[];
    total: number;
  }> {
    try {
      const { page = 1, limit = 20, status, search } = options || {};
      
      let query = supabaseAdmin
        .from('users')
        .select('*', { count: 'exact' });

      // 状态筛选
      if (status && status !== 'all') {
        // 假设用户表有 status 字段，如果没有需要添加
        // query = query.eq('status', status);
      }

      // 搜索
      if (search) {
        query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // 分页
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // 获取每个用户的作品数和获赞数
      const usersWithStats = await Promise.all(
        (data || []).map(async (user) => {
          // 获取用户作品数
          const { count: worksCount } = await supabaseAdmin
            .from('works')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', user.id);

          // 获取用户获赞数
          const { data: worksData } = await supabaseAdmin
            .from('works')
            .select('likes')
            .eq('creator_id', user.id);
          
          const totalLikes = worksData?.reduce((sum, work) => sum + (work.likes || 0), 0) || 0;

          // 从 membership_orders 表获取用户当前会员等级
          let membership_level = 'free';
          let membership_status = 'active';
          let membership_end = null;
          
          try {
            const { data: orders } = await supabaseAdmin
              .from('membership_orders')
              .select('plan, status, expires_at')
              .eq('user_id', user.id)
              .eq('status', 'completed')
              .order('created_at', { ascending: false })
              .limit(1);
            
            if (orders && orders.length > 0) {
              const latestOrder = orders[0];
              membership_level = latestOrder.plan;
              
              // 检查会员是否过期
              if (latestOrder.expires_at) {
                const expiresDate = new Date(latestOrder.expires_at);
                if (expiresDate < new Date()) {
                  membership_status = 'expired';
                }
              }
              membership_end = latestOrder.expires_at;
            }
          } catch (e) {
            // 如果查询失败，使用默认值
            console.warn('获取会员信息失败:', e);
          }

          return {
            ...user,
            works_count: worksCount || 0,
            total_likes: totalLikes,
            status: user.status || 'active',
            membership_level,
            membership_status,
            membership_end,
          };
        })
      );

      return {
        users: usersWithStats,
        total: count || 0,
      };
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return { users: [], total: 0 };
    }
  }

  // 获取用户详情
  async getUserDetail(userId: string): Promise<any | null> {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (!user) return null;

      // 获取用户作品数
      const { count: worksCount } = await supabaseAdmin
        .from('works')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId);

      // 获取用户获赞数
      const { data: worksData } = await supabaseAdmin
        .from('works')
        .select('likes')
        .eq('creator_id', userId);
      
      const totalLikes = worksData?.reduce((sum, work) => sum + (work.likes || 0), 0) || 0;

      // 获取用户活动记录（user_activities 表可能不存在）
      let activities: any[] = [];
      try {
        const { data: activitiesData } = await supabaseAdmin
          .from('user_activities')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);
        activities = activitiesData || [];
      } catch (e) {
        // user_activities 表不存在，返回空数组
        activities = [];
      }

      // 从 membership_orders 表获取用户当前会员等级
      let membership_level = 'free';
      let membership_status = 'active';
      let membership_end = null;
      
      try {
        const { data: orders } = await supabaseAdmin
          .from('membership_orders')
          .select('plan, status, expires_at')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (orders && orders.length > 0) {
          const latestOrder = orders[0];
          membership_level = latestOrder.plan;
          
          // 检查会员是否过期
          if (latestOrder.expires_at) {
            const expiresDate = new Date(latestOrder.expires_at);
            if (expiresDate < new Date()) {
              membership_status = 'expired';
            }
          }
          membership_end = latestOrder.expires_at;
        }
      } catch (e) {
        console.warn('获取会员信息失败:', e);
      }

      return {
        ...user,
        works_count: worksCount || 0,
        total_likes: totalLikes,
        activities: activities,
        status: user.status || 'active',
        membership_level,
        membership_status,
        membership_end,
      };
    } catch (error) {
      console.error('获取用户详情失败:', error);
      return null;
    }
  }

  // 更新用户状态
  async updateUserStatus(userId: string, status: 'active' | 'inactive' | 'banned'): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('更新用户状态失败:', error);
      return false;
    }
  }

  // 删除用户
  async deleteUser(userId: string): Promise<boolean> {
    try {
      // 先删除用户相关数据
      await supabaseAdmin.from('works').delete().eq('creator_id', userId);
      await supabaseAdmin.from('posts').delete().eq('author_id', userId);
      await supabaseAdmin.from('comments').delete().eq('author_id', userId);
      
      // 删除用户
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('删除用户失败:', error);
      return false;
    }
  }

  // ==================== 内容审核 ====================

  // 获取内容列表（作品、评论等）
  async getContents(options?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }): Promise<{
    contents: any[];
    total: number;
  }> {
    try {
      const { page = 1, limit = 20, status = 'all', type = 'all' } = options || {};
      
      let allContents: any[] = [];

      // 获取作品
      if (type === 'all' || type === 'work') {
        let worksQuery = supabaseAdmin
          .from('works')
          .select('*', { count: 'exact' })
          .eq('source', '津脉广场') // 只获取津脉广场的作品
          .is('event_id', null); // 排除活动作品

        const { data: works } = await worksQuery
          .order('created_at', { ascending: false });

        console.log(`[adminService.getContents] Raw works from DB:`, works?.length || 0);
        if (works && works.length > 0) {
          console.log(`[adminService.getContents] First work source:`, works[0].source, 'event_id:', works[0].event_id);
        }

        if (works) {
          // 过滤掉可疑的作品（标题太短、没有有效缩略图的）
          const validWorks = works.filter(work => {
            const thumbnail = work.thumbnail || work.cover_url || '';
            const hasValidThumbnail = thumbnail &&
                                     thumbnail.length > 0 &&
                                     thumbnail !== 'EMPTY' &&
                                     !thumbnail.toLowerCase().includes('empty');
            const hasValidTitle = work.title && work.title.length >= 3;
            return hasValidThumbnail && hasValidTitle;
          });

          console.log(`[adminService.getContents] Filtered ${works.length} works to ${validWorks.length} valid works`);
          
          // 调试：显示被过滤掉的作品
          const filteredOutWorks = works.filter(work => {
            const thumbnail = work.thumbnail || work.cover_url || '';
            const hasValidThumbnail = thumbnail &&
                                     thumbnail.length > 0 &&
                                     thumbnail !== 'EMPTY' &&
                                     !thumbnail.toLowerCase().includes('empty');
            const hasValidTitle = work.title && work.title.length >= 3;
            return !(hasValidThumbnail && hasValidTitle);
          });
          if (filteredOutWorks.length > 0) {
            console.log('[adminService.getContents] Filtered out works:', filteredOutWorks.map(w => ({
              id: w.id,
              title: w.title,
              source: w.source,
              thumbnail: w.thumbnail?.substring(0, 30)
            })));
          }

          // 获取创作者信息
          const creatorIds = validWorks.map(w => w.creator_id).filter(Boolean);
          const { data: users } = await supabaseAdmin
            .from('users')
            .select('id, username, avatar_url')
            .in('id', creatorIds);

          const userMap = new Map(users?.map(u => [u.id, u]) || []);

          const formattedWorks = validWorks.map(work => {
            const formattedWork = {
              ...work,
              type: 'work',
              author: userMap.get(work.creator_id)?.username || '未知用户',
              author_avatar: userMap.get(work.creator_id)?.avatar_url,
              status: work.status || 'approved', // 如果没有状态，默认为 approved
            };
            return formattedWork;
          });

          // 如果指定了状态筛选，在前端进行过滤
          if (status !== 'all') {
            allContents = [...allContents, ...formattedWorks.filter(w => w.status === status)];
          } else {
            allContents = [...allContents, ...formattedWorks];
          }
        }
      }

      // 获取评论
      if (type === 'all' || type === 'comment') {
        let commentsQuery = supabaseAdmin
          .from('comments')
          .select('*', { count: 'exact' });

        const { data: comments } = await commentsQuery
          .order('created_at', { ascending: false });

        if (comments) {
          // 过滤掉可疑的评论（内容太短）
          const validComments = comments.filter(comment => {
            const hasValidContent = comment.content && comment.content.length >= 3;
            return hasValidContent;
          });

          console.log(`[adminService.getContents] Filtered ${comments.length} comments to ${validComments.length} valid comments`);

          // 获取评论者信息
          const authorIds = validComments.map(c => c.author_id).filter(Boolean);
          const { data: users } = await supabaseAdmin
            .from('users')
            .select('id, username, avatar_url')
            .in('id', authorIds);

          const userMap = new Map(users?.map(u => [u.id, u]) || []);

          const formattedComments = validComments.map(comment => ({
            ...comment,
            type: 'comment',
            title: comment.content?.substring(0, 50) + '...',
            author: userMap.get(comment.author_id)?.username || '未知用户',
            author_avatar: userMap.get(comment.author_id)?.avatar_url,
            status: comment.status || 'approved', // 如果没有状态，默认为 approved
          }));

          // 如果指定了状态筛选，在前端进行过滤
          if (status !== 'all') {
            allContents = [...allContents, ...formattedComments.filter(c => c.status === status)];
          } else {
            allContents = [...allContents, ...formattedComments];
          }
        }
      }

      // 排序和分页
      allContents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      const total = allContents.length;
      const from = (page - 1) * limit;
      const to = from + limit;
      const paginatedContents = allContents.slice(from, to);

      return {
        contents: paginatedContents,
        total,
      };
    } catch (error) {
      console.error('获取内容列表失败:', error);
      return { contents: [], total: 0 };
    }
  }

  // 审核内容
  async auditContent(contentId: string, contentType: string, action: 'approve' | 'reject', reason?: string): Promise<boolean> {
    try {
      if (contentType === 'work') {
        const { error } = await supabaseAdmin
          .from('works')
          .update({ 
            status: action === 'approve' ? 'published' : 'rejected',
            audit_reason: reason,
            updated_at: new Date().toISOString()
          })
          .eq('id', contentId);

        if (error) throw error;
      } else if (contentType === 'comment') {
        const { error } = await supabaseAdmin
          .from('comments')
          .update({ 
            status: action === 'approve' ? 'approved' : 'rejected',
            audit_reason: reason,
            updated_at: new Date().toISOString()
          })
          .eq('id', contentId);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('审核内容失败:', error);
      return false;
    }
  }

  // 删除内容
  async deleteContent(contentId: string, contentType: string): Promise<boolean> {
    try {
      if (contentType === 'work') {
        // 先删除关联数据
        await supabaseAdmin.from('works_likes').delete().eq('work_id', contentId);
        await supabaseAdmin.from('works_bookmarks').delete().eq('work_id', contentId);
        await supabaseAdmin.from('work_comments').delete().eq('work_id', contentId);
        
        // 删除作品
        const { error } = await supabaseAdmin
          .from('works')
          .delete()
          .eq('id', contentId);

        if (error) throw error;
      } else if (contentType === 'comment') {
        const { error } = await supabaseAdmin
          .from('comments')
          .delete()
          .eq('id', contentId);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('删除内容失败:', error);
      return false;
    }
  }

  // ==================== 活动管理 ====================

  // 获取活动列表
  async getEvents(options?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    events: any[];
    total: number;
  }> {
    try {
      const { page = 1, limit = 20, status } = options || {};
      
      console.log('[AdminService] 获取活动列表, status:', status);
      
      // 使用普通客户端查询，因为 events 表有 RLS 策略
      // 管理员应该能看到所有活动
      let query = supabase
        .from('events')
        .select('*', { count: 'exact' });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('[AdminService] 查询活动失败:', error);
        throw error;
      }

      console.log('[AdminService] 获取到活动:', data?.length, '条, 总数:', count);

      return {
        events: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('获取活动列表失败:', error);
      return { events: [], total: 0 };
    }
  }

  // 创建活动
  async createEvent(eventData: any): Promise<any | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('events')
        .insert([{
          ...eventData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('创建活动失败:', error);
      return null;
    }
  }

  // 更新活动
  async updateEvent(eventId: string, eventData: any): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('events')
        .update({
          ...eventData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('更新活动失败:', error);
      return false;
    }
  }

  // 删除活动
  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('删除活动失败:', error);
      return false;
    }
  }

  // ==================== 创作者管理 ====================

  // 获取创作者列表
  async getCreators(options?: {
    page?: number;
    limit?: number;
    level?: string;
  }): Promise<{
    creators: any[];
    total: number;
  }> {
    try {
      const { page = 1, limit = 20, level } = options || {};
      
      // 获取所有有作品的用户作为创作者
      const { data: works, error: worksError } = await supabaseAdmin
        .from('works')
        .select('creator_id')
        .not('creator_id', 'is', null);

      if (worksError) throw worksError;

      // 获取创作者ID列表（去重）
      const creatorIds = [...new Set(works?.map(w => w.creator_id) || [])];
      
      if (creatorIds.length === 0) {
        return { creators: [], total: 0 };
      }

      // 获取创作者信息
      let query = supabaseAdmin
        .from('users')
        .select('*')
        .in('id', creatorIds);

      const { data: users, error } = await query;

      if (error) throw error;

      // 计算每个创作者的统计数据
      const creatorsWithStats = await Promise.all(
        (users || []).map(async (user) => {
          // 获取作品数
          const { count: worksCount } = await supabaseAdmin
            .from('works')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', user.id);

          // 获取获赞数
          const { data: userWorks } = await supabaseAdmin
            .from('works')
            .select('likes')
            .eq('creator_id', user.id);
          
          const totalLikes = userWorks?.reduce((sum, work) => sum + (work.likes || 0), 0) || 0;

          // 获取被采纳数（published 状态）
          const { count: adoptedCount } = await supabaseAdmin
            .from('works')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', user.id)
            .eq('status', 'published');

          // 根据作品数和获赞数计算等级
          let creatorLevel = 'beginner';
          if ((worksCount || 0) >= 50 || totalLikes >= 5000) {
            creatorLevel = 'master';
          } else if ((worksCount || 0) >= 20 || totalLikes >= 1500) {
            creatorLevel = 'advanced';
          }

          return {
            ...user,
            works: worksCount || 0,
            likes: totalLikes,
            adopted: adoptedCount || 0,
            level: creatorLevel,
            status: user.status || 'active',
          };
        })
      );

      // 按等级筛选
      let filteredCreators = creatorsWithStats;
      if (level && level !== 'all') {
        filteredCreators = creatorsWithStats.filter(c => c.level === level);
      }

      // 分页
      const total = filteredCreators.length;
      const from = (page - 1) * limit;
      const to = from + limit;
      const paginatedCreators = filteredCreators.slice(from, to);

      return {
        creators: paginatedCreators,
        total,
      };
    } catch (error) {
      console.error('获取创作者列表失败:', error);
      return { creators: [], total: 0 };
    }
  }

  // 通知管理相关方法
  async getNotifications() {
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('获取通知列表失败:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('获取通知列表失败:', error);
      return [];
    }
  }

  async createNotification(notification: {
    title: string;
    content: string;
    type: string;
    target: string;
    scheduled_at?: number;
    target_users?: string[];
  }) {
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_notifications')
        .insert({
          ...notification,
          status: notification.scheduled_at ? 'scheduled' : 'draft',
          created_at: new Date().toISOString(),
          recipients_count: 0,
          read_count: 0,
          click_count: 0
        })
        .select()
        .single();

      if (error) {
        console.error('创建通知失败:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('创建通知失败:', error);
      throw error;
    }
  }

  async sendNotification(id: string) {
    try {
      // 获取通知详情
      const { data: notification, error: fetchError } = await supabaseAdmin
        .from('admin_notifications')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !notification) {
        throw new Error('通知不存在');
      }

      // 获取目标用户
      let targetUsers: string[] = [];
      if (notification.target === 'all') {
        const { data: users, error: usersError } = await supabaseAdmin
          .from('users')
          .select('id');
        if (usersError) {
          console.error('获取用户列表失败:', usersError);
          throw usersError;
        }
        targetUsers = users?.map(u => u.id) || [];
      } else if (notification.target === 'vip') {
        const { data: users, error: usersError } = await supabaseAdmin
          .from('users')
          .select('id')
          .in('membership_level', ['premium', 'vip', 'gold', 'platinum']);
        if (usersError) {
          console.error('获取VIP用户列表失败:', usersError);
          throw usersError;
        }
        targetUsers = users?.map(u => u.id) || [];
      } else if (notification.target === 'specific' && notification.target_users) {
        targetUsers = notification.target_users;
      }

      if (targetUsers.length === 0) {
        throw new Error('没有目标用户');
      }

      // 向每个用户发送系统消息（使用 notifications 表，与消息中心兼容）
      const batchSize = 100; // 每批插入100条，避免超出限制
      const batches = Math.ceil(targetUsers.length / batchSize);
      let successCount = 0;

      for (let i = 0; i < batches; i++) {
        const batch = targetUsers.slice(i * batchSize, (i + 1) * batchSize);
        const userNotifications = batch.map(userId => ({
          user_id: userId,
          title: notification.title,
          content: notification.content,
          type: 'system', // 系统通知类型
          is_read: false,
          created_at: new Date().toISOString(),
          sender_id: null, // 系统消息没有发送者
          data: {
            admin_notification_id: id,
            notification_type: notification.type,
            target: notification.target
          }
        }));

        const { error: insertError } = await supabaseAdmin
          .from('notifications')
          .insert(userNotifications);

        if (insertError) {
          console.error(`批量插入通知失败 (批次 ${i + 1}/${batches}):`, insertError);
        } else {
          successCount += batch.length;
        }
      }

      // 更新通知状态
      const { error: updateError } = await supabaseAdmin
        .from('admin_notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          recipients_count: successCount
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      return { success: true, recipients_count: successCount };
    } catch (error) {
      console.error('发送通知失败:', error);
      throw error;
    }
  }

  async deleteNotification(id: string) {
    try {
      // 删除已发送的系统通知（从用户的消息中心中删除）
      const { data: adminNotif } = await supabaseAdmin
        .from('admin_notifications')
        .select('status')
        .eq('id', id)
        .single();

      if (adminNotif?.status === 'sent') {
        // 如果已发送，需要删除用户消息中心中的对应消息
        await supabaseAdmin
          .from('notifications')
          .delete()
          .eq('data->admin_notification_id', id);
      }

      // 删除管理后台的通知记录
      const { error } = await supabaseAdmin
        .from('admin_notifications')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('删除通知失败:', error);
      throw error;
    }
  }

  async getNotificationStats() {
    try {
      // 获取所有已发送通知
      const { data: notifications, error } = await supabaseAdmin
        .from('admin_notifications')
        .select('*')
        .eq('status', 'sent');

      if (error) {
        console.warn('获取通知统计失败:', error);
        return {
          totalSent: 0,
          totalRead: 0,
          totalClick: 0,
          readRate: 0,
          clickRate: 0,
          dailyStats: [],
          typeDistribution: []
        };
      }

      const totalSent = notifications?.reduce((sum, n) => sum + (n.recipients_count || 0), 0) || 0;
      const totalRead = notifications?.reduce((sum, n) => sum + (n.read_count || 0), 0) || 0;
      const totalClick = notifications?.reduce((sum, n) => sum + (n.click_count || 0), 0) || 0;

      // 生成近7天的统计数据
      const dailyStats = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        
        const dayNotifications = notifications?.filter(n => {
          const sentDate = new Date(n.sent_at);
          return sentDate.toDateString() === date.toDateString();
        }) || [];

        dailyStats.push({
          date: dateStr,
          sent: dayNotifications.reduce((sum, n) => sum + (n.recipients_count || 0), 0),
          read: dayNotifications.reduce((sum, n) => sum + (n.read_count || 0), 0),
          click: dayNotifications.reduce((sum, n) => sum + (n.click_count || 0), 0)
        });
      }

      // 类型分布
      const typeCount: Record<string, number> = {};
      notifications?.forEach(n => {
        typeCount[n.type] = (typeCount[n.type] || 0) + 1;
      });

      const typeDistribution = Object.entries(typeCount).map(([name, value]) => ({
        name: name === 'system' ? '系统通知' :
              name === 'activity' ? '活动通知' :
              name === 'reminder' ? '提醒通知' :
              name === 'marketing' ? '营销通知' : name,
        value
      }));

      return {
        totalSent,
        totalRead,
        totalClick,
        readRate: totalSent > 0 ? (totalRead / totalSent) * 100 : 0,
        clickRate: totalSent > 0 ? (totalClick / totalSent) * 100 : 0,
        dailyStats,
        typeDistribution
      };
    } catch (error) {
      console.error('获取通知统计失败:', error);
      return {
        totalSent: 0,
        totalRead: 0,
        totalClick: 0,
        readRate: 0,
        clickRate: 0,
        dailyStats: [],
        typeDistribution: []
      };
    }
  }
}

export const adminService = new AdminService();
