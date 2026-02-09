import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import LazyImage from '@/components/LazyImage';
import { useTheme } from '@/hooks/useTheme';

interface Post {
  id: number;
  title: string;
  content: string;
  thumbnail?: string;
  videoUrl?: string;
  type?: string;
  user_id: string; // Supabase user_id is string (UUID)
  username?: string;
  avatar_url?: string;
  category_id: number;
  status: string;
  views: number;
  likes_count: number;
  comments_count: number;
  created_at: string; // Supabase returns string
  updated_at: string;
  user?: {
    username: string;
    avatar_url: string;
  };
}

interface User {
  id: string; // Supabase user_id is string (UUID)
  username: string;
  email: string;
  avatar_url?: string;
  posts_count?: number;
  likes_count?: number;  // 数据库字段名
  views?: number;        // 数据库字段名
  created_at: string;
  updated_at: string;
}

interface PointsLeaderboardUser {
  user_id: string;
  username: string;
  avatar_url: string;
  balance: number;
  total_earned: number;
  rank: number;
}

type LeaderboardType = 'posts' | 'users' | 'points';
type TimeRange = 'day' | 'week' | 'month' | 'all';
type SortBy = 'likes_count' | 'views' | 'comments_count' | 'posts_count' | 'balance' | 'total_earned';

const Leaderboard: React.FC = () => {
  const { theme } = useTheme();
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('users');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [sortBy, setSortBy] = useState<SortBy>('likes_count');
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pointsUsers, setPointsUsers] = useState<PointsLeaderboardUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ users_count: number; posts_count: number; total_points: number } | null>(null);
  const navigate = useNavigate();

  // 动态颜色类
  const activeBtnClass = theme === 'pink' 
    ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-900/40'
    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/40';
  
  const primaryBtnClass = theme === 'pink'
    ? 'bg-pink-600 hover:bg-pink-700'
    : 'bg-blue-600 hover:bg-blue-700';
    
  const textHoverClass = theme === 'pink'
    ? 'group-hover:text-pink-600 dark:group-hover:text-pink-400'
    : 'group-hover:text-blue-600 dark:group-hover:text-blue-400';

  const gradientText = theme === 'pink'
    ? 'from-pink-600 to-purple-600'
    : 'from-blue-600 to-cyan-600';

  useEffect(() => {
    // 测试 Supabase 连接
    console.log('[Leaderboard] Supabase client:', supabase);
    console.log('[Leaderboard] Environment check:', {
      url: import.meta.env.VITE_SUPABASE_URL,
      hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
    });
    fetchLeaderboard();
    fetchStats();
  }, [leaderboardType, timeRange, sortBy]);

  const fetchStats = async () => {
    try {
      if (!supabase) {
        console.error('[Leaderboard] Supabase client is not initialized');
        return;
      }
      
      console.log('[Leaderboard] Fetching stats...');
      
      const { count: usersCount, error: usersError } = await supabase.from('users').select('id', { count: 'exact', head: true });
      if (usersError) {
        console.error('[Leaderboard] Error fetching users count:', usersError);
      } else {
        console.log('[Leaderboard] Users count:', usersCount);
      }
      
      // 从 works 表获取作品总数（与津脉广场一致）
      const { count: postsCount, error: postsError } = await supabase.from('works').select('id', { count: 'exact', head: true }).eq('status', 'published').eq('visibility', 'public');
      if (postsError) {
        console.error('[Leaderboard] Error fetching works count:', postsError);
      } else {
        console.log('[Leaderboard] Works count:', postsCount);
      }

      // 获取总积分
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points_balance')
        .select('balance');
      const totalPoints = pointsData?.reduce((sum, item) => sum + (item.balance || 0), 0) || 0;
      
      setStats({
        users_count: usersCount || 0,
        posts_count: postsCount || 0,
        total_points: totalPoints
      });
    } catch (e) {
      console.error('[Leaderboard] Failed to fetch stats', e);
    }
  };



  // 添加本地缓存机制（带时间戳）
  const [cache, setCache] = useState<Record<string, { posts: Post[]; users: User[]; timestamp: number }>>({});
  const CACHE_DURATION = 60 * 1000; // 1分钟缓存

  const fetchLeaderboard = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    // 生成缓存键
    const cacheKey = `${leaderboardType}-${sortBy}-${timeRange}`;

    // 检查缓存（1分钟内有效）
    const cachedData = cache[cacheKey];
    const now = Date.now();

    if (!forceRefresh && cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
      // 使用缓存数据
      if (leaderboardType === 'posts') {
        setPosts(cachedData.posts);
      } else {
        setUsers(cachedData.users);
      }
      setLoading(false);
      return;
    }

    // 强制刷新或缓存过期，从服务器获取
    await fetchRemoteData(cacheKey);
  };

  const fetchRemoteData = async (cacheKey: string) => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');

      let query;
      
      // 构建时间范围查询
      // 注意：数据库中的 created_at 是 bigint (Unix 时间戳)，不是 ISO 字符串
      const now = new Date();
      let startTime = 0; // Default to all time (Unix timestamp)
      
      if (timeRange === 'day') {
        now.setHours(0, 0, 0, 0);
        startTime = Math.floor(now.getTime() / 1000);
      } else if (timeRange === 'week') {
        now.setDate(now.getDate() - 7);
        startTime = Math.floor(now.getTime() / 1000);
      } else if (timeRange === 'month') {
        now.setMonth(now.getMonth() - 1);
        startTime = Math.floor(now.getTime() / 1000);
      }

      if (leaderboardType === 'points') {
        // 积分排行榜 - 使用 points_leaderboard 视图
        const { data, error } = await supabase
          .from('points_leaderboard')
          .select('*')
          .order('balance', { ascending: false })
          .limit(20);

        console.log('[Leaderboard] Points query result:', { data, error });
        if (error) throw error;
        
        setPointsUsers(data as PointsLeaderboardUser[] || []);
        setCache(prev => ({ ...prev, [cacheKey]: { posts: [], users: [], pointsUsers: data as PointsLeaderboardUser[], timestamp: Date.now() } }));
      } else if (leaderboardType === 'posts') {
        // 从 works 表获取作品列表（与津脉广场使用相同的数据源）
        let worksQuery = supabase
          .from('works')
          .select('*')
          .eq('status', 'published')
          .eq('visibility', 'public');

        // 如果不是"全部"时间范围，添加时间筛选
        if (timeRange !== 'all') {
          worksQuery = worksQuery.gte('created_at', startTime);
        }

        console.log('[Leaderboard] Works query params:', { timeRange, startTime, sortBy });

        const { data: worksData, error: worksError } = await worksQuery
          .order(sortBy, { ascending: false })
          .limit(10);

        console.log('[Leaderboard] Works query result:', { worksData, worksError });

        if (worksError) throw worksError;
        if (!worksData || worksData.length === 0) {
          console.log('[Leaderboard] No works found');
          setPosts([]);
          return;
        }

        // 获取作者信息（works 表使用 creator_id 字段）
        const creatorIds = [...new Set(worksData.map(w => w.creator_id).filter(Boolean))].map(id => String(id));
        let users: any[] = [];
        if (creatorIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, username, avatar_url')
            .in('id', creatorIds);
          if (!usersError && usersData) {
            users = usersData;
          }
        }

        // 将 works 数据格式转换为 posts 格式
        const formattedPosts = worksData.map((work: any) => {
          const user = users.find(u => u.id === work.creator_id);
          return {
            id: work.id,
            title: work.title,
            content: work.description || work.content || '',
            thumbnail: work.thumbnail,
            videoUrl: work.video_url,
            type: work.type,
            images: work.images || [],
            user_id: work.creator_id,
            author_id: work.creator_id,
            username: user?.username || work.creator || 'Unknown',
            avatar_url: user?.avatar_url || work.author_avatar || '',
            category_id: work.category_id,
            status: work.status,
            views: work.views || 0,
            likes_count: work.likes_count || work.likes || 0,
            comments_count: work.comments_count || 0,
            created_at: work.created_at,
            updated_at: work.updated_at
          };
        });

        setPosts(formattedPosts);
        setCache(prev => ({ ...prev, [cacheKey]: { posts: formattedPosts, users: prev[cacheKey]?.users || [], timestamp: Date.now() } }));
      } else {
        // 用户排行榜排序字段映射：前端显示用的字段名 -> 数据库实际字段名
        const userSortByMap: Record<string, string> = {
          'likes_count': 'likes_count',
          'views': 'views',
          'posts_count': 'posts_count'
        };
        const dbSortBy = userSortByMap[sortBy] || 'likes_count';

        query = supabase
          .from('users')
          .select('*')
          .order(dbSortBy, { ascending: false })
          .limit(10);
          
        // If timeRange is not 'all', we might warn or just show all time. 
        // Let's just query all users sorted by the stat.
        
        const { data, error } = await query;
        console.log('[Leaderboard] Users query result:', { data, error });
        if (error) throw error;
        
        if (!data || data.length === 0) {
          console.log('[Leaderboard] No users found');
        } else {
          console.log(`[Leaderboard] Found ${data.length} users`);
        }
        
        setUsers(data as User[]);
        setCache(prev => ({ ...prev, [cacheKey]: { posts: prev[cacheKey]?.posts || [], users: data as User[], timestamp: Date.now() } }));
      }
    } catch (err: any) {
      console.error('API request failed:', err.message);
      setError(err.message || '获取数据失败');
    } finally {
      requestAnimationFrame(() => {
        setLoading(false);
      });
    }
  };

  const handlePostClick = (postId: string) => {
    // 跳转到津脉广场，并传递作品ID参数
    navigate(`/square?post=${postId}`);
  };

  const handleUserClick = (user: User) => {
    // 跳转到创作者个人主页
    navigate(`/author/${user.id}`);
  };



  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <div className="relative">
          <div className="absolute inset-0 bg-yellow-400 blur-sm opacity-50 rounded-full"></div>
          <div className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-lg border-2 border-white dark:border-gray-800">
            <span className="text-white font-bold text-sm md:text-lg">1</span>
          </div>
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <i className="fas fa-crown text-yellow-500 text-sm md:text-base drop-shadow-sm"></i>
          </div>
        </div>
      );
    }
    if (index === 1) {
      return (
        <div className="relative">
          <div className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 shadow-lg border-2 border-white dark:border-gray-800">
            <span className="text-white font-bold text-sm md:text-lg">2</span>
          </div>
        </div>
      );
    }
    if (index === 2) {
      return (
        <div className="relative">
          <div className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-orange-300 to-amber-600 shadow-lg border-2 border-white dark:border-gray-800">
            <span className="text-white font-bold text-sm md:text-lg">3</span>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 dark:bg-gray-700/50 font-bold text-gray-500 dark:text-gray-400 text-sm md:text-lg">
        {index + 1}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      {/* 顶部 Hero 区域 */}
      <div className="relative overflow-hidden bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800 pb-8 pt-6 md:pt-10">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-gradient-to-tr from-cyan-50 to-blue-50 dark:from-cyan-900/10 dark:to-blue-900/10 blur-3xl opacity-60"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3 flex items-center gap-3">
                  <span className={`bg-clip-text text-transparent bg-gradient-to-r ${gradientText}`}>
                    排行榜
                  </span>
                  <span className="text-2xl">🏆</span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-lg text-lg">
                  发现社区中最具影响力的创作者和最受欢迎的创意作品
                </p>
              </motion.div>
            </div>
            
            {/* 统计数据 */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex gap-4 md:gap-8"
            >
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">作品总数</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{stats ? stats.posts_count : '-'}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">创作者</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{stats ? stats.users_count : '-'}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">总积分</p>
                <p className="text-2xl md:text-3xl font-bold text-yellow-500">{stats ? stats.total_points.toLocaleString() : '-'}</p>
              </div>
            </motion.div>
          </div>

          {/* 筛选控制栏 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-2 shadow-sm border border-gray-200/50 dark:border-gray-700/50 flex flex-col lg:flex-row gap-4 justify-between items-center"
          >
            {/* 左侧：类型切换 */}
            <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl w-full lg:w-auto">
              <button
                onClick={() => setLeaderboardType('users')}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                  leaderboardType === 'users'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <i className="fas fa-users"></i>
                热门创作者
              </button>
              <button
                onClick={() => setLeaderboardType('posts')}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                  leaderboardType === 'posts'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <i className="fas fa-image"></i>
                热门作品
              </button>
              <button
                onClick={() => setLeaderboardType('points')}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                  leaderboardType === 'points'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <i className="fas fa-trophy"></i>
                积分排行
              </button>
            </div>

            {/* 右侧：筛选和排序 */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* 时间范围 */}
              <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl overflow-x-auto">
                {(['day', 'week', 'month', 'all'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`flex-1 min-w-[60px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      timeRange === range
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {range === 'day' && '今日'}
                    {range === 'week' && '本周'}
                    {range === 'month' && '本月'}
                    {range === 'all' && '总榜'}
                  </button>
                ))}
              </div>

              {/* 排序下拉框 */}
              <div className="relative min-w-[140px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-sort-amount-down text-gray-400 text-xs"></i>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="w-full pl-9 pr-8 py-2.5 bg-gray-100 dark:bg-gray-700/50 border-transparent focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block appearance-none transition-all cursor-pointer font-medium"
                >
                  {leaderboardType === 'posts' ? (
                    <>
                      <option value="likes_count">按点赞数</option>
                      <option value="views">按浏览量</option>
                      <option value="comments_count">按评论数</option>
                    </>
                  ) : (
                    <>
                      <option value="posts_count">按作品数</option>
                      <option value="likes_count">按总获赞</option>
                      <option value="views">按总浏览</option>
                    </>
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
                </div>
              </div>

              {/* 刷新按钮 */}
              <button
                onClick={() => fetchLeaderboard(true)}
                disabled={loading}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600/50 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="刷新数据"
              >
                <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
                刷新
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 内容展示区 */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 min-h-[400px]"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full"></div>
                </div>
              </div>
              <p className="mt-6 text-gray-500 dark:text-gray-400 font-medium animate-pulse">正在生成榜单数据...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-lg border border-red-100 dark:border-red-900/30"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-2xl text-red-500"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">数据加载失败</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                重试加载
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {leaderboardType === 'points' ? (
                <div className="w-full">
                  {/* 积分排行榜前三名 */}
                  {pointsUsers.length > 0 && (
                    <div className="flex flex-col md:flex-row justify-center items-end gap-4 md:gap-8 mb-12">
                      {/* 第二名 */}
                      {pointsUsers[1] && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="flex flex-col items-center order-2 md:order-1"
                        >
                          <div className="relative mb-4">
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full p-1 bg-gradient-to-br from-gray-300 to-gray-400">
                              <img
                                src={pointsUsers[1].avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(pointsUsers[1].username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                                alt={pointsUsers[1].username}
                                className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-800"
                              />
                            </div>
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white dark:border-gray-800">
                              2
                            </div>
                          </div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{pointsUsers[1].username}</h3>
                          <p className="text-yellow-500 font-bold text-xl">{pointsUsers[1].balance.toLocaleString()} 积分</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">累计获得 {pointsUsers[1].total_earned.toLocaleString()}</p>
                        </motion.div>
                      )}
                      
                      {/* 第一名 */}
                      {pointsUsers[0] && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0 }}
                          className="flex flex-col items-center order-1 md:order-2 -mt-4 md:-mt-8"
                        >
                          <div className="relative mb-4">
                            <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-30 rounded-full"></div>
                            <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full p-1 bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500">
                              <img
                                src={pointsUsers[0].avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(pointsUsers[0].username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                                alt={pointsUsers[0].username}
                                className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-800"
                              />
                            </div>
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                              <i className="fas fa-crown text-yellow-500 text-3xl drop-shadow-lg"></i>
                            </div>
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-white dark:border-gray-800">
                              1
                            </div>
                          </div>
                          <h3 className="font-bold text-xl text-gray-900 dark:text-white">{pointsUsers[0].username}</h3>
                          <p className="text-yellow-500 font-bold text-2xl">{pointsUsers[0].balance.toLocaleString()} 积分</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">累计获得 {pointsUsers[0].total_earned.toLocaleString()}</p>
                        </motion.div>
                      )}
                      
                      {/* 第三名 */}
                      {pointsUsers[2] && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="flex flex-col items-center order-3"
                        >
                          <div className="relative mb-4">
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full p-1 bg-gradient-to-br from-orange-300 to-amber-600">
                              <img
                                src={pointsUsers[2].avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(pointsUsers[2].username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                                alt={pointsUsers[2].username}
                                className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-800"
                              />
                            </div>
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white dark:border-gray-800">
                              3
                            </div>
                          </div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{pointsUsers[2].username}</h3>
                          <p className="text-yellow-500 font-bold text-xl">{pointsUsers[2].balance.toLocaleString()} 积分</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">累计获得 {pointsUsers[2].total_earned.toLocaleString()}</p>
                        </motion.div>
                      )}
                    </div>
                  )}
                  
                  {/* 积分排行榜列表 */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      <div className="col-span-2 md:col-span-1 text-center">排名</div>
                      <div className="col-span-6 md:col-span-7">用户</div>
                      <div className="col-span-4 md:col-span-2 text-right">当前积分</div>
                      <div className="hidden md:block col-span-2 text-right">累计获得</div>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {pointsUsers.slice(3).map((user, index) => (
                        <motion.div
                          key={user.user_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                          onClick={() => navigate(`/author/${user.user_id}`)}
                        >
                          <div className="col-span-2 md:col-span-1 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-bold">
                              {index + 4}
                            </span>
                          </div>
                          <div className="col-span-6 md:col-span-7 flex items-center gap-3">
                            <img
                              src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                              alt={user.username}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                            />
                            <span className="font-medium text-gray-900 dark:text-white truncate">{user.username}</span>
                          </div>
                          <div className="col-span-4 md:col-span-2 text-right">
                            <span className="font-bold text-yellow-500">{user.balance.toLocaleString()}</span>
                          </div>
                          <div className="hidden md:block col-span-2 text-right text-gray-500 dark:text-gray-400">
                            {user.total_earned.toLocaleString()}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : leaderboardType === 'posts' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post, index) => (
                    <motion.div 
                      key={post.id} 
                      layoutId={`post-${post.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden cursor-pointer transition-all duration-300"
                      onClick={() => handlePostClick(post.id)}
                    >
                      <div className="p-5 flex flex-col h-full">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-bold text-lg text-gray-900 dark:text-white line-clamp-2 ${textHoverClass} transition-colors mb-2`}>
                              {post.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span className="bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                                {post.category_id === 1 ? '插画' : '设计'}
                              </span>
                              <span>•</span>
                              <span>{new Date(post.created_at * 1000).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 -mt-2 -mr-2 scale-90">
                            {getRankBadge(index)}
                          </div>
                        </div>
                        
                        {/* 缩略图或视频预览 (如果有) */}
                        {(post.thumbnail || (post.images && post.images.length > 0) || post.videoUrl) && (
                          <div className="mb-4 rounded-xl overflow-hidden h-48 md:h-56 w-full relative">
                            {post.type === 'video' && post.videoUrl ? (
                              <video
                                src={post.videoUrl}
                                className="w-full h-full object-cover"
                                muted
                                loop
                                autoPlay
                                playsInline
                                preload="metadata"
                              />
                            ) : (
                              <LazyImage src={post.thumbnail || post.images[0]} alt={post.title} className="w-full h-full object-cover" />
                            )}
                            {post.type === 'video' && (
                              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                <i className="fas fa-video"></i>
                                视频
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed flex-1">
                          {post.content}
                        </p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700/50 mt-auto">
                          <div className="flex items-center gap-2">
                            {post.username && (
                              <img
                                src={post.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(post.username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&size=24`}
                                alt={post.username}
                                className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600 object-cover"
                              />
                            )}
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate max-w-[80px]">
                              {post.username || '用户'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1 group-hover:text-blue-500 transition-colors">
                              <i className="fas fa-eye"></i>
                              {post.views > 1000 ? `${(post.views / 1000).toFixed(1)}k` : post.views}
                            </span>
                            <span className="flex items-center gap-1 group-hover:text-pink-500 transition-colors">
                              <i className="fas fa-heart"></i>
                              {post.likes_count}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="w-full">
                  <div className="flex overflow-x-auto md:grid md:grid-cols-3 lg:grid-cols-4 gap-6 pb-8 md:pb-0 px-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {users.map((user, index) => (
                      <motion.div 
                        key={user.id} 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        whileHover={{ y: -8, transition: { duration: 0.2 } }}
                        className="min-w-[260px] md:min-w-0 bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden transition-all duration-300 cursor-pointer snap-center group relative flex flex-col"
                        onClick={() => handleUserClick(user)}
                      >
                        {/* 装饰背景 */}
                        <div className={`h-24 w-full absolute top-0 left-0 z-0 ${theme === 'pink' ? 'bg-gradient-to-br from-pink-50 via-purple-50 to-white dark:from-pink-900/20 dark:via-purple-900/20 dark:to-gray-800' : 'bg-gradient-to-br from-blue-50 via-cyan-50 to-white dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-gray-800'}`}></div>
                        
                        <div className="p-6 relative z-10 flex flex-col items-center flex-1">
                          <div className="absolute top-3 left-3">
                            {getRankBadge(index)}
                          </div>

                          {/* 头像 */}
                          <div className="mt-6 mb-4 relative">
                            <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-full transform scale-110 shadow-sm opacity-50"></div>
                            <LazyImage
                              src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                              alt={user.username}
                              className="w-24 h-24 rounded-full border-[3px] border-white dark:border-gray-800 shadow-md object-cover relative z-10 group-hover:scale-105 transition-transform duration-300"
                            />
                            {index < 3 && (
                              <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white text-xs font-bold px-2 py-0.5 rounded-full border-2 border-white dark:border-gray-800 shadow-sm">
                                TOP {index + 1}
                              </div>
                            )}
                          </div>
                          
                          <h3 className={`font-bold text-lg text-gray-900 dark:text-white truncate max-w-full mb-1 text-center ${textHoverClass} transition-colors`}>
                            {user.username}
                          </h3>
                          
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-full">
                            <i className="fas fa-calendar-alt text-xs opacity-70"></i>
                            加入于 {new Date(user.created_at * 1000).toLocaleDateString()}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-3 w-full mt-auto">
                            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700/50 group-hover:border-blue-200 dark:group-hover:border-blue-800/30 transition-colors">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide scale-90">作品</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">{user.posts_count || 0}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700/50 group-hover:border-pink-200 dark:group-hover:border-pink-800/30 transition-colors">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide scale-90">获赞</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">{user.likes_count ? (user.likes_count > 1000 ? `${(user.likes_count/1000).toFixed(1)}k` : user.likes_count) : 0}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>


    </div>
  );
};

export default Leaderboard;