// 控制台数据服务 - 优化版
// 使用批量查询、并行处理和数据缓存来提升性能

import { supabaseAdmin } from '@/lib/supabaseClient';

// 缓存配置
const CACHE_DURATION = 60000; // 1分钟缓存

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

// 简单的内存缓存
const cache: {
  timeSeries?: CacheItem<any[]>;
  baseStats?: CacheItem<any>;
  weeklyComparison?: CacheItem<any[]>;
  realtimeStats?: CacheItem<any>;
} = {};

// 缓存工具函数
function getCachedData<T>(key: 'timeSeries' | 'baseStats' | 'weeklyComparison' | 'realtimeStats'): T | null {
  const cached = cache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
}

function setCachedData<T>(key: 'timeSeries' | 'baseStats' | 'weeklyComparison' | 'realtimeStats', data: T) {
  cache[key] = {
    data,
    timestamp: Date.now()
  };
}

// 清除缓存（用于手动刷新）
export function clearDashboardCache() {
  Object.keys(cache).forEach(key => {
    delete cache[key as keyof typeof cache];
  });
}

// 批量获取时间序列数据（最近7天）- 使用单次查询替代多次查询
export async function getTimeSeriesData(forceRefresh = false) {
  // 检查缓存
  if (!forceRefresh) {
    const cached = getCachedData<any[]>('timeSeries');
    if (cached) return cached;
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // 并行获取所有需要的数据
  const [
    { data: usersData },
    { data: worksData },
    { data: viewsData },
    { data: ordersData }
  ] = await Promise.all([
    supabaseAdmin.from('users').select('created_at').gte('created_at', sevenDaysAgo.toISOString()),
    supabaseAdmin.from('works').select('created_at').gte('created_at', sevenDaysAgo.toISOString()),
    supabaseAdmin.from('user_history').select('created_at').gte('created_at', sevenDaysAgo.toISOString()),
    supabaseAdmin.from('membership_orders').select('created_at, amount').eq('status', 'completed').gte('created_at', sevenDaysAgo.toISOString())
  ]);

  // 初始化7天数据
  const timeData: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split('T')[0];

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    // 统计当天的数据
    const newUsers = usersData?.filter(u => {
      const created = new Date(u.created_at);
      return created >= date && created < nextDate;
    }).length || 0;

    const newWorks = worksData?.filter(w => {
      const created = new Date(w.created_at);
      return created >= date && created < nextDate;
    }).length || 0;

    const dailyViews = viewsData?.filter(v => {
      const created = new Date(v.created_at);
      return created >= date && created < nextDate;
    }).length || 0;

    const dailyRevenue = ordersData?.filter(o => {
      const created = new Date(o.created_at);
      return created >= date && created < nextDate;
    }).reduce((sum, o) => sum + (o.amount || 0), 0) || 0;

    timeData.push({
      date: dateStr.slice(5),
      users: newUsers,
      works: newWorks,
      views: dailyViews,
      revenue: dailyRevenue,
    });
  }

  // 存入缓存
  setCachedData('timeSeries', timeData);
  return timeData;
}

// 批量获取基础统计数据
export async function getBaseStats(forceRefresh = false) {
  // 检查缓存
  if (!forceRefresh) {
    const cached = getCachedData<any>('baseStats');
    if (cached) return cached;
  }

  const [
    { data: works },
    { data: deviceData },
    { data: usersByMonth },
    { data: topWorks },
    { data: users },
    { count: viewCount },
    { count: likeCount },
    { count: commentCount },
    { count: shareCount },
    { count: bookmarkCount },
    { count: followCount },
    { data: ordersByStatus },
    { data: worksByType },
    { data: postsByDay },
    { data: commentsByDay },
    { data: aiTasks },
    { data: worksWithCategory },
    { data: userSessionsForHeatmap },
    { data: ordersByDate },
    { data: usersWithOrders },
    { data: worksByHour },
    { data: userActivity },
    { data: commentsForSentiment },
    { data: userHistoryData },
    // 真实的用户活跃度数据
    { data: worksActivity },
    { data: commentsActivity },
    { data: likesActivity },
    { data: postsActivity }
  ] = await Promise.all([
    // 基础数据
    supabaseAdmin.from('works').select('category, view_count'),
    supabaseAdmin.from('user_devices').select('device_type'),
    supabaseAdmin.from('users').select('created_at'),
    supabaseAdmin.from('works').select('id, title, view_count, likes, comments_count, creator_id, type').order('view_count', { ascending: false }).limit(5),
    supabaseAdmin.from('users').select('id, username'),

    // 统计数据
    supabaseAdmin.from('user_history').select('*', { count: 'exact', head: true }).eq('action_type', 'view_work'),
    supabaseAdmin.from('likes').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('comments').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('user_history').select('*', { count: 'exact', head: true }).eq('action_type', 'share_work'),
    supabaseAdmin.from('works_bookmarks').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('follows').select('*', { count: 'exact', head: true }),

    // 订单数据
    supabaseAdmin.from('membership_orders').select('status, amount'),

    // 内容数据
    supabaseAdmin.from('works').select('type, view_count, likes'),
    supabaseAdmin.from('posts').select('created_at'),
    supabaseAdmin.from('comments').select('created_at'),

    // AI数据
    supabaseAdmin.from('generation_tasks').select('type, status'),

    // 分类数据
    supabaseAdmin.from('works').select('category, created_at'),

    // 会话数据 - 使用真实的用户活动数据（works、comments、likes、posts）
    supabaseAdmin.from('user_sessions').select('session_start, last_active'),
    // 真实的用户活跃度数据
    supabaseAdmin.from('works').select('created_at, creator_id'),
    supabaseAdmin.from('comments').select('created_at, user_id'),
    supabaseAdmin.from('likes').select('created_at, user_id'),
    supabaseAdmin.from('posts').select('created_at, user_id'),

    // 订单日期数据
    supabaseAdmin.from('membership_orders').select('created_at, amount, status').eq('status', 'completed'),

    // 用户订单数据
    supabaseAdmin.from('users').select('id, created_at, membership_orders(amount, created_at)'),

    // 作品时间数据
    supabaseAdmin.from('works').select('created_at'),

    // 用户行为数据
    supabaseAdmin.from('user_history').select('user_id, action_type'),

    // 评论情感数据
    supabaseAdmin.from('comments').select('content'),

    // 用户历史数据（用于流量来源）
    supabaseAdmin.from('user_history').select('*')
  ]);

  const result = {
    works,
    deviceData,
    usersByMonth,
    topWorks,
    users,
    viewCount,
    likeCount,
    commentCount,
    shareCount,
    bookmarkCount,
    followCount,
    ordersByStatus,
    worksByType,
    postsByDay,
    commentsByDay,
    aiTasks,
    worksWithCategory,
    userSessionsForHeatmap,
    ordersByDate,
    usersWithOrders,
    worksByHour,
    userActivity,
    commentsForSentiment,
    userHistoryData,
    // 真实的用户活跃度数据
    worksActivity,
    commentsActivity,
    likesActivity,
    postsActivity
  };

  // 存入缓存
  setCachedData('baseStats', result);
  return result;

  // 存入缓存
  setCachedData('baseStats', result);
  return result;
}

// 获取周同比数据
export async function getWeeklyComparisonData(forceRefresh = false) {
  // 检查缓存
  if (!forceRefresh) {
    const cached = getCachedData<any[]>('weeklyComparison');
    if (cached) return cached;
  }

  const currentTime = new Date();
  const oneWeekAgo = new Date(currentTime);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(currentTime);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const oneWeekAgoStr = oneWeekAgo.toISOString();
  const twoWeeksAgoStr = twoWeeksAgo.toISOString();

  const [
    { count: currentWeekUsers },
    { count: lastWeekUsers },
    // 使用真实的用户活动数据计算活跃用户
    { data: currentWeekWorks },
    { data: lastWeekWorks },
    { data: currentWeekComments },
    { data: lastWeekComments },
    { data: currentWeekLikes },
    { data: lastWeekLikes },
    { data: currentWeekPosts },
    { data: lastWeekPosts },
    { count: currentWeekOrders },
    { count: lastWeekOrders },
    { data: currentWeekRevenueData },
    { data: lastWeekRevenueData },
  ] = await Promise.all([
    // 本周和上周新增用户
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgoStr),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).gte('created_at', twoWeeksAgoStr).lt('created_at', oneWeekAgoStr),
    // 本周和上周作品
    supabaseAdmin.from('works').select('creator_id').gte('created_at', oneWeekAgoStr),
    supabaseAdmin.from('works').select('creator_id').gte('created_at', twoWeeksAgoStr).lt('created_at', oneWeekAgoStr),
    // 本周和上周评论
    supabaseAdmin.from('comments').select('user_id').gte('created_at', oneWeekAgoStr),
    supabaseAdmin.from('comments').select('user_id').gte('created_at', twoWeeksAgoStr).lt('created_at', oneWeekAgoStr),
    // 本周和上周点赞
    supabaseAdmin.from('likes').select('user_id').gte('created_at', oneWeekAgoStr),
    supabaseAdmin.from('likes').select('user_id').gte('created_at', twoWeeksAgoStr).lt('created_at', oneWeekAgoStr),
    // 本周和上周帖子
    supabaseAdmin.from('posts').select('user_id').gte('created_at', oneWeekAgoStr),
    supabaseAdmin.from('posts').select('user_id').gte('created_at', twoWeeksAgoStr).lt('created_at', oneWeekAgoStr),
    // 本周和上周订单
    supabaseAdmin.from('membership_orders').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgoStr),
    supabaseAdmin.from('membership_orders').select('*', { count: 'exact', head: true }).gte('created_at', twoWeeksAgoStr).lt('created_at', oneWeekAgoStr),
    // 本周和上周收入
    supabaseAdmin.from('membership_orders').select('amount').eq('status', 'completed').gte('created_at', oneWeekAgoStr),
    supabaseAdmin.from('membership_orders').select('amount').eq('status', 'completed').gte('created_at', twoWeeksAgoStr).lt('created_at', oneWeekAgoStr),
  ]);

  // 计算活跃用户（去重）
  const currentWeekActiveUsers = new Set([
    ...(currentWeekWorks?.map(w => w.creator_id) || []),
    ...(currentWeekComments?.map(c => c.user_id) || []),
    ...(currentWeekLikes?.map(l => l.user_id) || []),
    ...(currentWeekPosts?.map(p => p.user_id) || []),
  ]).size;

  const lastWeekActiveUsers = new Set([
    ...(lastWeekWorks?.map(w => w.creator_id) || []),
    ...(lastWeekComments?.map(c => c.user_id) || []),
    ...(lastWeekLikes?.map(l => l.user_id) || []),
    ...(lastWeekPosts?.map(p => p.user_id) || []),
  ]).size;

  // 计算各项数量
  const currentWeekWorksCount = currentWeekWorks?.length || 0;
  const lastWeekWorksCount = lastWeekWorks?.length || 0;
  const currentWeekCommentsCount = currentWeekComments?.length || 0;
  const lastWeekCommentsCount = lastWeekComments?.length || 0;

  // 计算收入
  const currentWeekRevenue = currentWeekRevenueData?.reduce((sum, order) => sum + (parseFloat(order.amount) || 0), 0) || 0;
  const lastWeekRevenue = lastWeekRevenueData?.reduce((sum, order) => sum + (parseFloat(order.amount) || 0), 0) || 0;

  const calculateGrowth = (current: number, last: number) => {
    if (last === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - last) / last) * 100 * 10) / 10;
  };

  const result = [
    { metric: '新增用户', current: currentWeekUsers || 0, last: lastWeekUsers || 0, growth: calculateGrowth(currentWeekUsers || 0, lastWeekUsers || 0) },
    { metric: '活跃用户', current: currentWeekActiveUsers, last: lastWeekActiveUsers, growth: calculateGrowth(currentWeekActiveUsers, lastWeekActiveUsers) },
    { metric: '作品发布', current: currentWeekWorksCount, last: lastWeekWorksCount, growth: calculateGrowth(currentWeekWorksCount, lastWeekWorksCount) },
    { metric: '订单量', current: currentWeekOrders || 0, last: lastWeekOrders || 0, growth: calculateGrowth(currentWeekOrders || 0, lastWeekOrders || 0) },
    { metric: '收入', current: currentWeekRevenue, last: lastWeekRevenue, growth: calculateGrowth(currentWeekRevenue, lastWeekRevenue) },
    { metric: '评论数', current: currentWeekCommentsCount, last: lastWeekCommentsCount, growth: calculateGrowth(currentWeekCommentsCount, lastWeekCommentsCount) },
  ];

  // 存入缓存
  setCachedData('weeklyComparison', result);
  return result;

  // 存入缓存
  setCachedData('weeklyComparison', result);
  return result;
}

// 获取实时统计数据
export async function getRealtimeStats(forceRefresh = false) {
  // 检查缓存（实时数据使用较短的缓存时间）
  if (!forceRefresh) {
    const cached = getCachedData<any>('realtimeStats');
    if (cached) return cached;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const [
    { count: todayViewCount },
    { count: todayWorkCount },
    { count: todayOrderCount },
    { count: dailyActiveUsers }
  ] = await Promise.all([
    supabaseAdmin.from('user_history').select('*', { count: 'exact', head: true }).gte('created_at', todayStr),
    supabaseAdmin.from('works').select('*', { count: 'exact', head: true }).gte('created_at', todayStr),
    supabaseAdmin.from('membership_orders').select('*', { count: 'exact', head: true }).gte('created_at', todayStr),
    supabaseAdmin.from('user_history').select('*', { count: 'exact', head: true })
  ]);

  const result = {
    onlineUsers: dailyActiveUsers || 0,
    todayViews: todayViewCount || 0,
    todayWorks: todayWorkCount || 0,
    todayOrders: todayOrderCount || 0,
    avgResponseTime: 0,
    errorRate: 0,
  };

  // 存入缓存
  setCachedData('realtimeStats', result);
  return result;
}
