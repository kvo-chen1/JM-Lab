import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  MessageSquare,
  TrendingUp,
  Download,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Eye,
  Heart,
  RefreshCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { toast } from 'sonner';

// 时间范围选项
const timeRangeOptions = [
  { value: '7d', label: '最近7天' },
  { value: '30d', label: '最近30天' },
  { value: '90d', label: '最近90天' },
  { value: '1y', label: '最近1年' }
];

// 图表颜色配置
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

interface AnalyticsViewProps {
  isDark: boolean;
  communityId: string;
}

// 统计数据接口
interface CommunityStats {
  totalMembers: number;
  newMembers: number;
  memberGrowthRate: number;
  totalPosts: number;
  newPosts: number;
  postGrowthRate: number;
  totalComments: number;
  newComments: number;
  commentGrowthRate: number;
  totalViews: number;
  avgEngagementRate: number;
  activeMembers: number;
}

// 趋势数据接口
interface TrendData {
  date: string;
  members: number;
  posts: number;
  comments: number;
  views: number;
}

// 成员活动数据接口
interface MemberActivity {
  hour: string;
  active: number;
}

// 内容类型分布接口
interface ContentDistribution {
  name: string;
  value: number;
}

// 热门帖子接口
interface TopPost {
  id: string;
  title: string;
  author: string;
  views: number;
  likes: number;
  comments: number;
  engagement: number;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ isDark, communityId }) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [activityData, setActivityData] = useState<MemberActivity[]>([]);
  const [contentDistribution, setContentDistribution] = useState<ContentDistribution[]>([]);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 获取日期范围
  const getDateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    
    return { start, end };
  }, [timeRange]);

  // 获取统计数据
  const fetchAnalyticsData = async () => {
    if (!communityId) return;
    
    setIsRefreshing(true);
    try {
      const { start, end } = getDateRange;
      const startDate = start.toISOString();
      const endDate = end.toISOString();

      // 并行获取所有数据
      const [
        membersResult,
        newMembersResult,
        postsResult,
        newPostsResult,
        commentsResult,
        newCommentsResult
      ] = await Promise.all([
        // 总成员数
        supabaseAdmin
          .from('community_members')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityId),
        
        // 新增成员数
        supabaseAdmin
          .from('community_members')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)
          .gte('joined_at', startDate)
          .lte('joined_at', endDate),
        
        // 总帖子数
        supabaseAdmin
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityId),
        
        // 新增帖子数
        supabaseAdmin
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)
          .gte('created_at', startDate)
          .lte('created_at', endDate),
        
        // 总评论数
        supabaseAdmin
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityId),
        
        // 新增评论数
        supabaseAdmin
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)
          .gte('created_at', startDate)
          .lte('created_at', endDate)
      ]);

      // 计算统计数据
      const totalMembers = membersResult.count || 0;
      const newMembers = newMembersResult.count || 0;
      const totalPosts = postsResult.count || 0;
      const newPosts = newPostsResult.count || 0;
      const totalComments = commentsResult.count || 0;
      const newComments = newCommentsResult.count || 0;

      // 计算增长率（与上一周期比较）
      const prevStart = new Date(start);
      prevStart.setTime(start.getTime() - (end.getTime() - start.getTime()));
      const prevStartDate = prevStart.toISOString();

      const [prevMembersResult, prevPostsResult, prevCommentsResult] = await Promise.all([
        supabaseAdmin
          .from('community_members')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)
          .gte('joined_at', prevStartDate)
          .lt('joined_at', startDate),
        supabaseAdmin
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)
          .gte('created_at', prevStartDate)
          .lt('created_at', startDate),
        supabaseAdmin
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)
          .gte('created_at', prevStartDate)
          .lt('created_at', startDate)
      ]);

      const prevNewMembers = prevMembersResult.count || 0;
      const prevNewPosts = prevPostsResult.count || 0;
      const prevNewComments = prevCommentsResult.count || 0;

      const memberGrowthRate = prevNewMembers > 0 ? ((newMembers - prevNewMembers) / prevNewMembers) * 100 : 0;
      const postGrowthRate = prevNewPosts > 0 ? ((newPosts - prevNewPosts) / prevNewPosts) * 100 : 0;
      const commentGrowthRate = prevNewComments > 0 ? ((newComments - prevNewComments) / prevNewComments) * 100 : 0;

      setStats({
        totalMembers,
        newMembers,
        memberGrowthRate,
        totalPosts,
        newPosts,
        postGrowthRate,
        totalComments,
        newComments,
        commentGrowthRate,
        totalViews: totalPosts * 42, // 模拟数据
        avgEngagementRate: totalPosts > 0 ? ((totalComments + totalPosts) / totalPosts) * 100 : 0,
        activeMembers: Math.floor(totalMembers * 0.3) // 模拟活跃成员
      });

      // 获取趋势数据
      await fetchTrendData(start, end);
      
      // 获取活跃时段数据
      await fetchActivityData();
      
      // 获取内容分布
      await fetchContentDistribution();
      
      // 获取热门帖子
      await fetchTopPosts();

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('获取数据失败');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 获取趋势数据
  const fetchTrendData = async (start: Date, end: Date) => {
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const data: TrendData[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const [membersRes, postsRes, commentsRes] = await Promise.all([
        supabaseAdmin
          .from('community_members')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)
          .gte('joined_at', date.toISOString())
          .lt('joined_at', nextDate.toISOString()),
        supabaseAdmin
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString()),
        supabaseAdmin
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString())
      ]);

      data.push({
        date: dateStr.slice(5), // MM-DD
        members: membersRes.count || 0,
        posts: postsRes.count || 0,
        comments: commentsRes.count || 0,
        views: Math.floor(Math.random() * 100) + 50 // 模拟浏览量
      });
    }

    setTrendData(data);
  };

  // 获取活跃时段数据
  const fetchActivityData = async () => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const data: MemberActivity[] = hours.map(hour => ({
      hour,
      active: Math.floor(Math.random() * 50) + 10 // 模拟数据
    }));
    setActivityData(data);
  };

  // 获取内容分布
  const fetchContentDistribution = async () => {
    const { data: posts } = await supabaseAdmin
      .from('posts')
      .select('category')
      .eq('community_id', communityId);

    const categoryCount: Record<string, number> = {};
    posts?.forEach(post => {
      const category = post.category || '其他';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const distribution = Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value
    }));

    setContentDistribution(distribution.length > 0 ? distribution : [
      { name: '分享', value: 35 },
      { name: '讨论', value: 25 },
      { name: '问答', value: 20 },
      { name: '作品', value: 15 },
      { name: '其他', value: 5 }
    ]);
  };

  // 获取热门帖子
  const fetchTopPosts = async () => {
    const { data: posts } = await supabaseAdmin
      .from('posts')
      .select('id, title, user_id, view_count, created_at')
      .eq('community_id', communityId)
      .order('view_count', { ascending: false })
      .limit(5);

    if (posts && posts.length > 0) {
      const userIds = [...new Set(posts.map(p => p.user_id).filter(Boolean))];
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, username')
        .in('id', userIds);

      const userMap = new Map(users?.map(u => [u.id, u.username]) || []);

      const topPostsData: TopPost[] = posts.map(post => ({
        id: post.id,
        title: post.title,
        author: userMap.get(post.user_id) || '未知用户',
        views: post.view_count || 0,
        likes: Math.floor(Math.random() * 100),
        comments: Math.floor(Math.random() * 50),
        engagement: Math.floor(Math.random() * 30) + 10
      }));

      setTopPosts(topPostsData);
    }
  };

  // 导出数据
  const exportData = () => {
    const data = {
      stats,
      trendData,
      topPosts,
      exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `community-analytics-${communityId}-${timeRange}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('数据导出成功');
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [communityId, timeRange]);

  // 统计卡片组件
  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color 
  }: { 
    title: string; 
    value: number; 
    change: number; 
    icon: any; 
    color: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        p-6 rounded-2xl border transition-all duration-300
        ${isDark 
          ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70' 
          : 'bg-white border-gray-200 hover:shadow-lg'
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            {title}
          </p>
          <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {value.toLocaleString()}
          </h3>
          <div className={`flex items-center gap-1 mt-2 text-sm ${
            change >= 0 ? 'text-emerald-500' : 'text-rose-500'
          }`}>
            {change >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span>{Math.abs(change).toFixed(1)}%</span>
            <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>较上期</span>
          </div>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw size={40} className={isDark ? 'text-slate-500' : 'text-gray-400'} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            数据分析
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${isDark ? 'text-slate-400' : 'text-gray-500'}`}
          >
            查看社群的活跃数据和增长趋势
          </motion.p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 时间范围选择 */}
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className={`
                pl-4 pr-10 py-2.5 rounded-xl border text-sm font-medium
                transition-all duration-200 appearance-none cursor-pointer
                ${isDark 
                  ? 'bg-slate-800 border-slate-700 text-white hover:border-slate-600' 
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown 
              size={16} 
              className={`
                absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none
                ${isDark ? 'text-slate-400' : 'text-gray-400'}
              `} 
            />
          </div>

          {/* 刷新按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchAnalyticsData()}
            disabled={isRefreshing}
            className={`
              p-2.5 rounded-xl border transition-all duration-200
              ${isDark 
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }
              ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <motion.div
              animate={isRefreshing ? { rotate: 360 } : {}}
              transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
            >
              <RefreshCw size={20} />
            </motion.div>
          </motion.button>

          {/* 导出按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportData}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
              transition-all duration-200
              ${isDark 
                ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30' 
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }
            `}
          >
            <Download size={18} />
            <span>导出数据</span>
          </motion.button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="总成员数"
          value={stats?.totalMembers || 0}
          change={stats?.memberGrowthRate || 0}
          icon={Users}
          color="bg-gradient-to-br from-indigo-500 to-indigo-600"
        />
        <StatCard
          title="总帖子数"
          value={stats?.totalPosts || 0}
          change={stats?.postGrowthRate || 0}
          icon={MessageSquare}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="总评论数"
          value={stats?.totalComments || 0}
          change={stats?.commentGrowthRate || 0}
          icon={Activity}
          color="bg-gradient-to-br from-amber-500 to-amber-600"
        />
        <StatCard
          title="平均互动率"
          value={Math.round(stats?.avgEngagementRate || 0)}
          change={12.5}
          icon={TrendingUp}
          color="bg-gradient-to-br from-rose-500 to-rose-600"
        />
      </div>

      {/* 趋势图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 增长趋势 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`
            lg:col-span-2 p-6 rounded-2xl border
            ${isDark 
              ? 'bg-slate-800/50 border-slate-700/50' 
              : 'bg-white border-gray-200'
            }
          `}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              增长趋势
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>成员</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>帖子</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>评论</span>
              </div>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDark ? '#334155' : '#e5e7eb'} 
                />
                <XAxis 
                  dataKey="date" 
                  stroke={isDark ? '#64748b' : '#9ca3af'}
                  fontSize={12}
                />
                <YAxis 
                  stroke={isDark ? '#64748b' : '#9ca3af'}
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    color: isDark ? '#ffffff' : '#000000'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="members"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorMembers)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="posts"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorPosts)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="comments"
                  stroke="#f59e0b"
                  fill="transparent"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 内容分布 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`
            p-6 rounded-2xl border
            ${isDark 
              ? 'bg-slate-800/50 border-slate-700/50' 
              : 'bg-white border-gray-200'
            }
          `}
        >
          <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            内容分布
          </h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {contentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    color: isDark ? '#ffffff' : '#000000'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 space-y-2">
            {contentDistribution.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>
                    {item.name}
                  </span>
                </div>
                <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 活跃时段 & 热门帖子 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 活跃时段 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`
            p-6 rounded-2xl border
            ${isDark 
              ? 'bg-slate-800/50 border-slate-700/50' 
              : 'bg-white border-gray-200'
            }
          `}
        >
          <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            成员活跃时段
          </h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDark ? '#334155' : '#e5e7eb'} 
                />
                <XAxis 
                  dataKey="hour" 
                  stroke={isDark ? '#64748b' : '#9ca3af'}
                  fontSize={10}
                  interval={2}
                />
                <YAxis 
                  stroke={isDark ? '#64748b' : '#9ca3af'}
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    color: isDark ? '#ffffff' : '#000000'
                  }}
                />
                <Bar 
                  dataKey="active" 
                  fill="#8b5cf6" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 热门帖子 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`
            p-6 rounded-2xl border
            ${isDark 
              ? 'bg-slate-800/50 border-slate-700/50' 
              : 'bg-white border-gray-200'
            }
          `}
        >
          <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            热门帖子 TOP 5
          </h3>
          
          <div className="space-y-4">
            {topPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`
                  flex items-center gap-4 p-4 rounded-xl
                  ${isDark 
                    ? 'bg-slate-700/30 hover:bg-slate-700/50' 
                    : 'bg-gray-50 hover:bg-gray-100'
                  }
                  transition-colors cursor-pointer
                `}
              >
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                  ${index < 3 
                    ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white' 
                    : isDark ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-500'
                  }
                `}>
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {post.title}
                  </h4>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {post.author}
                  </p>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    <Eye size={14} />
                    <span>{post.views}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    <Heart size={14} />
                    <span>{post.likes}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    <MessageSquare size={14} />
                    <span>{post.comments}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsView;
