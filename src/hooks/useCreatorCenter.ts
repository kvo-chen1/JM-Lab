import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import achievementService from '@/services/achievementService';

// 创作者统计数据接口
export interface CreatorStats {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  viewsChange: number;
  likesChange: number;
  commentsChange: number;
  sharesChange: number;
  followersCount: number;
}

// 作品数据接口
export interface CreatorWork {
  id: string;
  title: string;
  thumbnail?: string;
  views: number;
  likes: number;
  comments: number;
  createdAt: string;
  status: 'published' | 'draft' | 'archived';
}

// 创作者等级数据接口
export interface CreatorLevel {
  level: number;
  name: string;
  currentXP: number;
  nextLevelXP: number;
  progress: number;
}

// 收入数据接口
export interface CreatorRevenue {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingRevenue: number;
  withdrawableRevenue: number;
  revenueChange: number;
  lastMonthRevenue: number;
  totalWithdrawn: number;
}

// 商单任务接口
export interface BusinessTask {
  id: string;
  title: string;
  description: string;
  brandName: string;
  brandLogo?: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  requirements: string[];
  tags: string[];
  type: string;
  status: 'open' | 'closed' | 'completed';
  maxParticipants: number;
  currentParticipants: number;
  applied?: boolean;
}

// 收入明细接口
export interface RevenueRecord {
  id: string;
  amount: number;
  type: 'ads' | 'sponsorship' | 'tipping' | 'membership' | 'task' | 'withdrawal';
  description: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

// 趋势数据点
export interface TrendDataPoint {
  date: string;
  views: number;
  likes: number;
  comments: number;
}

// 使用创作者中心数据
export function useCreatorCenter() {
  const { user, isAuthenticated } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [works, setWorks] = useState<CreatorWork[]>([]);
  const [level, setLevel] = useState<CreatorLevel | null>(null);
  const [revenue, setRevenue] = useState<CreatorRevenue | null>(null);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [businessTasks, setBusinessTasks] = useState<BusinessTask[]>([]);
  const [revenueRecords, setRevenueRecords] = useState<RevenueRecord[]>([]);
  const [taskApplications, setTaskApplications] = useState<{taskId: string, status: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 从 useAuth 获取用户ID
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    } else {
      // 未登录状态，设置加载完成
      setLoading(false);
    }
  }, [user]);

  // 获取创作者统计数据
  const fetchStats = useCallback(async () => {
    if (!userId) return;

    try {
      // 先尝试获取作品的基本信息和浏览量
      const { data: worksData, error: worksError } = await supabase
        .from('works')
        .select('id, view_count')
        .eq('creator_id', userId);

      if (worksError) {
        console.warn('获取作品列表失败:', worksError);
        setStats({
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          viewsChange: 0,
          likesChange: 0,
          commentsChange: 0,
          sharesChange: 0,
        });
        return;
      }

      const workIds = worksData?.map(w => w.id) || [];
      
      // 计算总浏览量
      const totalViews = worksData?.reduce((sum, w) => sum + (w.view_count || 0), 0) || 0;
      
      // 从 works_likes 表获取点赞数
      const { data: likesData, error: likesError } = await supabase
        .from('works_likes')
        .select('work_id')
        .in('work_id', workIds);
      
      if (likesError) {
        console.warn('获取点赞数据失败:', likesError);
      }

      // 从 work_comments 表获取评论数
      // 注意：work_comments 表的 work_id 是 INTEGER 类型，而 works 表的 id 是 UUID
      // 这里可能需要根据实际数据关联方式来查询
      const { data: commentsData, error: commentsError } = await supabase
        .from('work_comments')
        .select('id');
      
      if (commentsError) {
        console.warn('获取评论数据失败:', commentsError);
      }

      // 从 work_shares 表获取分享数（用户作为发送者的分享）
      const { data: sharesData, error: sharesError } = await supabase
        .from('work_shares')
        .select('id')
        .eq('sender_id', userId);
      
      if (sharesError) {
        console.warn('获取分享数据失败:', sharesError);
      }

      // 计算统计数据
      const totalWorks = workIds.length;
      const totalLikes = likesData?.length || 0;
      const totalComments = commentsData?.length || 0;
      const totalShares = sharesData?.length || 0;
      
      // 获取用户粉丝数（从 follows 表查询）
      const { count: followersCount, error: followersError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);
      
      if (followersError) {
        console.warn('获取粉丝数失败:', followersError);
      }
      
      const finalFollowersCount = followersCount || 0;
      
      setStats({
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        viewsChange: 0,
        likesChange: 0,
        commentsChange: 0,
        sharesChange: 0,
        followersCount: finalFollowersCount,
      });
    } catch (err) {
      console.error('获取统计数据失败:', err);
      setStats({
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        viewsChange: 0,
        likesChange: 0,
        commentsChange: 0,
        sharesChange: 0,
        followersCount: 0,
      });
    }
  }, [userId]);

  // 获取作品列表
  const fetchWorks = useCallback(async () => {
    if (!userId) return;

    try {
      // 获取作品基本信息（包括浏览量）
      const { data, error } = await supabase
        .from('works')
        .select('id, title, thumbnail, view_count, created_at, status')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.warn('获取作品列表失败:', error);
        setWorks([]);
        return;
      }

      const workIds = data?.map(w => w.id) || [];

      // 获取每个作品的点赞数
      const { data: likesData, error: likesError } = await supabase
        .from('works_likes')
        .select('work_id')
        .in('work_id', workIds);

      if (likesError) {
        console.warn('获取点赞数据失败:', likesError);
      }

      // 计算每个作品的点赞数
      const likesCountMap: Record<string, number> = {};
      likesData?.forEach(like => {
        likesCountMap[like.work_id] = (likesCountMap[like.work_id] || 0) + 1;
      });

      const formattedWorks: CreatorWork[] = (data || []).map(work => ({
        id: work.id,
        title: work.title || '未命名作品',
        thumbnail: work.thumbnail,
        views: work.view_count || 0,
        likes: likesCountMap[work.id] || 0,
        comments: 0, // 暂无法获取
        createdAt: work.created_at,
        status: work.status || 'published',
      }));

      setWorks(formattedWorks);
    } catch (err) {
      console.error('获取作品列表失败:', err);
      setWorks([]);
    }
  }, [userId]);

  // 获取等级数据（使用成就等级体系）
  const fetchLevel = useCallback(async () => {
    if (!userId) return;

    try {
      // 初始化成就服务并获取等级信息
      await achievementService.initialize();
      await achievementService.fetchPointsStats(userId);
      const levelInfo = achievementService.getCreatorLevelInfo(userId);

      setLevel({
        level: levelInfo.currentLevel.level,
        name: levelInfo.currentLevel.name,
        currentXP: levelInfo.currentPoints,
        nextLevelXP: levelInfo.nextLevel?.requiredPoints || levelInfo.currentLevel.requiredPoints,
        progress: levelInfo.levelProgress,
      });
    } catch (err) {
      console.error('获取等级数据失败:', err);
      setLevel({
        level: 1,
        name: '创作新手',
        currentXP: 0,
        nextLevelXP: 100,
        progress: 0,
      });
    }
  }, [userId]);

  // 获取收入数据
  const fetchRevenue = useCallback(async () => {
    if (!userId) return;

    try {
      // 从 creator_revenue 表获取收入数据
      const { data: revenueData, error: revenueError } = await supabase
        .from('creator_revenue')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (revenueError && revenueError.code !== 'PGRST116') {
        console.warn('获取收入数据失败:', revenueError);
      }

      // 获取30天内的收入记录用于计算本月收入
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentRecords } = await supabase
        .from('revenue_records')
        .select('amount, created_at')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // 计算本月收入
      const monthlyRevenue = recentRecords?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

      // 计算收入变化率（与上月对比）
      const lastMonthStart = new Date();
      lastMonthStart.setDate(lastMonthStart.getDate() - 60);
      const lastMonthEnd = new Date();
      lastMonthEnd.setDate(lastMonthEnd.getDate() - 30);

      const { data: lastMonthRecords } = await supabase
        .from('revenue_records')
        .select('amount')
        .eq('user_id', userId)
        .gte('created_at', lastMonthStart.toISOString())
        .lt('created_at', lastMonthEnd.toISOString());

      const lastMonthRevenue = lastMonthRecords?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
      const revenueChange = lastMonthRevenue > 0 
        ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : 0;

      setRevenue({
        totalRevenue: revenueData?.total_revenue || 0,
        monthlyRevenue: monthlyRevenue || revenueData?.monthly_revenue || 0,
        pendingRevenue: revenueData?.pending_revenue || 0,
        withdrawableRevenue: revenueData?.withdrawable_revenue || 0,
        revenueChange,
        lastMonthRevenue: revenueData?.last_month_revenue || lastMonthRevenue || 0,
        totalWithdrawn: revenueData?.total_withdrawn || 0,
      });
    } catch (err) {
      console.error('获取收入数据失败:', err);
      setRevenue({
        totalRevenue: 0,
        monthlyRevenue: 0,
        pendingRevenue: 0,
        withdrawableRevenue: 0,
        revenueChange: 0,
        lastMonthRevenue: 0,
        totalWithdrawn: 0,
      });
    }
  }, [userId]);

  // 获取商单任务
  const fetchBusinessTasks = useCallback(async () => {
    if (!userId) return;

    try {
      // 获取所有开放的商单任务
      const { data: tasks, error: tasksError } = await supabase
        .from('business_tasks')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.warn('获取商单任务失败:', tasksError);
        setBusinessTasks([]);
        return;
      }

      // 获取用户已申请的任务
      const { data: applications } = await supabase
        .from('creator_task_applications')
        .select('task_id, status')
        .eq('creator_id', userId);

      const appliedTaskIds = new Map(applications?.map(a => [a.task_id, a.status]) || []);

      const formattedTasks: BusinessTask[] = (tasks || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        brandName: task.brand_name,
        brandLogo: task.brand_logo,
        budgetMin: task.budget_min,
        budgetMax: task.budget_max,
        deadline: task.deadline,
        requirements: task.requirements || [],
        tags: task.tags || [],
        type: task.type,
        status: task.status,
        maxParticipants: task.max_participants,
        currentParticipants: task.current_participants,
        applied: appliedTaskIds.has(task.id),
      }));

      setBusinessTasks(formattedTasks);
      setTaskApplications(applications?.map(a => ({ taskId: a.task_id, status: a.status })) || []);
    } catch (err) {
      console.error('获取商单任务失败:', err);
      setBusinessTasks([]);
    }
  }, [userId]);

  // 获取收入明细
  const fetchRevenueRecords = useCallback(async () => {
    if (!userId) return;

    try {
      const { data: records, error } = await supabase
        .from('revenue_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('获取收入明细失败:', error);
        setRevenueRecords([]);
        return;
      }

      const formattedRecords: RevenueRecord[] = (records || []).map(record => ({
        id: record.id,
        amount: record.amount,
        type: record.type,
        description: record.description,
        status: record.status,
        createdAt: record.created_at,
      }));

      setRevenueRecords(formattedRecords);
    } catch (err) {
      console.error('获取收入明细失败:', err);
      setRevenueRecords([]);
    }
  }, [userId]);

  // 申请商单任务
  const applyForTask = useCallback(async (taskId: string) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('creator_task_applications')
        .insert({
          task_id: taskId,
          creator_id: userId,
          status: 'applied',
        });

      if (error) {
        console.error('申请任务失败:', error);
        return false;
      }

      // 刷新任务列表
      await fetchBusinessTasks();
      return true;
    } catch (err) {
      console.error('申请任务失败:', err);
      return false;
    }
  }, [userId, fetchBusinessTasks]);

  // 创建提现申请
  const createWithdrawal = useCallback(async (amount: number, paymentMethod?: string, paymentAccount?: string) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('withdrawal_records')
        .insert({
          user_id: userId,
          amount,
          payment_method: paymentMethod,
          payment_account: paymentAccount,
          status: 'pending',
        });

      if (error) {
        console.error('创建提现申请失败:', error);
        return false;
      }

      // 刷新收入数据
      await fetchRevenue();
      return true;
    } catch (err) {
      console.error('创建提现申请失败:', err);
      return false;
    }
  }, [userId, fetchRevenue]);

  // 获取趋势数据
  const fetchTrendData = useCallback(async () => {
    if (!userId) return;

    try {
      // 获取最近7天的数据
      const days = 7;
      const data: TrendDataPoint[] = [];

      // 首先获取用户的所有作品和点赞
      const { data: allWorks } = await supabase
        .from('works')
        .select('id, created_at')
        .eq('creator_id', userId);

      const workIds = allWorks?.map(w => w.id) || [];

      const { data: allLikes } = await supabase
        .from('works_likes')
        .select('work_id, created_at')
        .in('work_id', workIds);

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dayStart = date.getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;

        // 统计当天的作品数
        const dayWorksCount = allWorks?.filter(w => {
          const workTime = typeof w.created_at === 'number' ? w.created_at : new Date(w.created_at).getTime();
          return workTime >= dayStart && workTime < dayEnd;
        }).length || 0;

        // 统计当天的点赞数
        const dayLikesCount = allLikes?.filter(l => {
          const likeTime = typeof l.created_at === 'number' ? l.created_at : new Date(l.created_at).getTime();
          return likeTime >= dayStart && likeTime < dayEnd;
        }).length || 0;

        data.push({
          date: date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
          views: dayWorksCount,
          likes: dayLikesCount,
          comments: 0,
        });
      }

      setTrendData(data);
    } catch (err) {
      console.error('获取趋势数据失败:', err);
      setTrendData([]);
    }
  }, [userId]);

  // 获取所有数据
  const fetchAllData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    await Promise.all([
      fetchStats(),
      fetchWorks(),
      fetchLevel(),
      fetchRevenue(),
      fetchTrendData(),
      fetchBusinessTasks(),
      fetchRevenueRecords(),
    ]);

    setLoading(false);
  }, [userId, fetchStats, fetchWorks, fetchLevel, fetchRevenue, fetchTrendData, fetchBusinessTasks, fetchRevenueRecords]);

  // 当用户ID变化时获取数据
  useEffect(() => {
    if (userId) {
      fetchAllData();
    }
  }, [userId, fetchAllData]);

  // 刷新数据
  const refresh = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    stats,
    works,
    level,
    revenue,
    trendData,
    businessTasks,
    revenueRecords,
    taskApplications,
    loading,
    error,
    refresh,
    applyForTask,
    createWithdrawal,
  };
}

export default useCreatorCenter;
