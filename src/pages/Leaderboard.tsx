import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '@/lib/apiClient';
import GradientHero from '@/components/GradientHero';
import LazyImage from '@/components/LazyImage';
import { useTheme } from '@/hooks/useTheme';

interface Post {
  id: number;
  title: string;
  content: string;
  thumbnail?: string;
  user_id: number;
  username?: string;
  avatar_url?: string;
  category_id: number;
  status: string;
  views: number;
  likes_count: number;
  comments_count: number;
  created_at: number;
  updated_at: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  posts_count?: number;
  total_likes?: number;
  total_views?: number;
  created_at: number;
  updated_at: number;
}

type LeaderboardType = 'posts' | 'users';
type TimeRange = 'day' | 'week' | 'month' | 'all';
type SortBy = 'likes_count' | 'views' | 'comments_count' | 'posts_count';

// Mock data for posts
const mockPosts: Post[] = [
  {
    id: 1,
    title: '国潮插画设计',
    content: '这是一个关于国潮风格的插画设计作品，融合了传统元素与现代设计理念。',
    user_id: 1,
    username: '设计师小明',
    avatar_url: 'https://via.placeholder.com/64?text=设计师小明',
    category_id: 1,
    status: 'published',
    views: 1234,
    likes_count: 456,
    comments_count: 78,
    created_at: Date.now() - 86400000,
    updated_at: Date.now() - 86400000
  },
  {
    id: 2,
    title: '赛博朋克风格海报',
    content: '赛博朋克风格的海报设计，展现了未来科技感与城市夜景的融合。',
    user_id: 2,
    username: '插画师小红',
    avatar_url: 'https://via.placeholder.com/64?text=插画师小红',
    category_id: 2,
    status: 'published',
    views: 987,
    likes_count: 321,
    comments_count: 56,
    created_at: Date.now() - 172800000,
    updated_at: Date.now() - 172800000
  },
  {
    id: 3,
    title: '传统纹样现代化设计',
    content: '将传统纹样重新设计，应用于现代产品包装，展现传统文化的新活力。',
    user_id: 3,
    username: '设计师小李',
    avatar_url: 'https://via.placeholder.com/64?text=设计师小李',
    category_id: 3,
    status: 'published',
    views: 765,
    likes_count: 234,
    comments_count: 45,
    created_at: Date.now() - 259200000,
    updated_at: Date.now() - 259200000
  },
  {
    id: 4,
    title: '水墨风格动画短片',
    content: '使用传统水墨技法制作的动画短片，讲述了一个关于自然与人文的故事。',
    user_id: 4,
    username: '动画师小王',
    avatar_url: 'https://via.placeholder.com/64?text=动画师小王',
    category_id: 4,
    status: 'published',
    views: 543,
    likes_count: 189,
    comments_count: 34,
    created_at: Date.now() - 345600000,
    updated_at: Date.now() - 345600000
  },
  {
    id: 5,
    title: '民俗文化主题摄影',
    content: '民俗文化主题的摄影作品，记录了各地的传统节日与习俗。',
    user_id: 5,
    username: '摄影师小张',
    avatar_url: 'https://via.placeholder.com/64?text=摄影师小张',
    category_id: 5,
    status: 'published',
    views: 321,
    likes_count: 123,
    comments_count: 23,
    created_at: Date.now() - 432000000,
    updated_at: Date.now() - 432000000
  }
];

// Mock data for users
const mockUsers: User[] = [
  {
    id: 1,
    username: '设计师小明',
    email: 'xiaoming@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=设计师小明',
    posts_count: 12,
    total_likes: 2345,
    total_views: 15678,
    created_at: Date.now() - 31536000000,
    updated_at: Date.now() - 86400000
  },
  {
    id: 2,
    username: '插画师小红',
    email: 'xiaohong@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=插画师小红',
    posts_count: 8,
    total_likes: 1890,
    total_views: 12345,
    created_at: Date.now() - 2592000000,
    updated_at: Date.now() - 172800000
  },
  {
    id: 3,
    username: '设计师小李',
    email: 'xiaoli@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=设计师小李',
    posts_count: 15,
    total_likes: 2100,
    total_views: 14567,
    created_at: Date.now() - 1814400000,
    updated_at: Date.now() - 259200000
  },
  {
    id: 4,
    username: '动画师小王',
    email: 'xiaowang@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=动画师小王',
    posts_count: 6,
    total_likes: 1567,
    total_views: 10987,
    created_at: Date.now() - 1209600000,
    updated_at: Date.now() - 345600000
  },
  {
    id: 5,
    username: '摄影师小张',
    email: 'xiaozhang@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=摄影师小张',
    posts_count: 20,
    total_likes: 2890,
    total_views: 18765,
    created_at: Date.now() - 907200000,
    updated_at: Date.now() - 432000000
  },
  {
    id: 6,
    username: 'UI设计师小刘',
    email: 'xiaoliu@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=UI设计师小刘',
    posts_count: 14,
    total_likes: 1987,
    total_views: 13456,
    created_at: Date.now() - 777600000,
    updated_at: Date.now() - 518400000
  },
  {
    id: 7,
    username: '平面设计师小陈',
    email: 'xiaochen@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=平面设计师小陈',
    posts_count: 11,
    total_likes: 1765,
    total_views: 11234,
    created_at: Date.now() - 691200000,
    updated_at: Date.now() - 604800000
  },
  {
    id: 8,
    username: '3D设计师小周',
    email: 'xiaozhou@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=3D设计师小周',
    posts_count: 9,
    total_likes: 2012,
    total_views: 16789,
    created_at: Date.now() - 604800000,
    updated_at: Date.now() - 691200000
  },
  {
    id: 9,
    username: '视频编辑小吴',
    email: 'xiaowu@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=视频编辑小吴',
    posts_count: 7,
    total_likes: 1654,
    total_views: 10987,
    created_at: Date.now() - 518400000,
    updated_at: Date.now() - 777600000
  },
  {
    id: 10,
    username: '动效设计师小郑',
    email: 'xiaozheng@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=动效设计师小郑',
    posts_count: 13,
    total_likes: 2234,
    total_views: 14567,
    created_at: Date.now() - 432000000,
    updated_at: Date.now() - 864000000
  },
  {
    id: 11,
    username: '游戏设计师小冯',
    email: 'xiaofeng@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=游戏设计师小冯',
    posts_count: 10,
    total_likes: 1987,
    total_views: 13456,
    created_at: Date.now() - 345600000,
    updated_at: Date.now() - 950400000
  },
  {
    id: 12,
    username: '交互设计师小沈',
    email: 'xishenshen@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=交互设计师小沈',
    posts_count: 16,
    total_likes: 2456,
    total_views: 17890,
    created_at: Date.now() - 259200000,
    updated_at: Date.now() - 1036800000
  }
];

// Helper function to sort mock data by different criteria
const sortMockData = <T extends Post | User>(data: T[], sortBy: SortBy): T[] => {
  return [...data].sort((a, b) => {
    if (sortBy === 'likes_count') {
      return (b as any).likes_count - (a as any).likes_count;
    } else if (sortBy === 'views') {
      return (b as any).views - (a as any).views;
    } else if (sortBy === 'comments_count') {
      return (b as any).comments_count - (a as any).comments_count;
    } else if (sortBy === 'posts_count') {
      return (b as any).posts_count - (a as any).posts_count;
    }
    return 0;
  });
};

const Leaderboard: React.FC = () => {
  const { theme } = useTheme();
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('users');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [sortBy, setSortBy] = useState<SortBy>('likes_count');
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
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

  const focusRingClass = theme === 'pink'
    ? 'focus:ring-pink-500'
    : 'focus:ring-blue-500';

  const gradientText = theme === 'pink'
    ? 'from-pink-600 to-purple-600'
    : 'from-blue-600 to-cyan-600';

  useEffect(() => {
    fetchLeaderboard();
  }, [leaderboardType, timeRange, sortBy]);

  // 键盘事件监听，支持Esc键关闭弹窗
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDetailOpen) {
        handleCloseDetail();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetailOpen]);

  // 添加本地缓存机制
  const [cache, setCache] = useState<Record<string, { posts: Post[]; users: User[] }>>({});
  
  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    
    // 生成缓存键
    const cacheKey = `${leaderboardType}-${sortBy}-${timeRange}`;
    
    // 检查缓存
    if (cache[cacheKey]) {
      if (leaderboardType === 'posts') {
        setPosts(cache[cacheKey].posts);
      } else {
        setUsers(cache[cacheKey].users);
      }
      setLoading(false);
      return;
    }
    
    // 优化：立即使用mock数据作为初始加载，然后异步更新API数据
    const sortedMockPosts = sortMockData(mockPosts, sortBy);
    const sortedMockUsers = sortMockData(mockUsers, sortBy);
    
    if (leaderboardType === 'posts') {
      setPosts(sortedMockPosts);
    } else {
      setUsers(sortedMockUsers);
    }
    
    // 使用mock数据更新缓存
    setCache(prev => ({
      ...prev, 
      [cacheKey]: {
        ...prev[cacheKey] || { posts: [], users: [] },
        posts: sortedMockPosts,
        users: sortedMockUsers
      }
    }));
    
    try {
      // 优化API请求：减少超时时间，去除重试
      if (leaderboardType === 'posts') {
        const response = await apiClient.get(`/api/leaderboard/posts?sortBy=${sortBy}&timeRange=${timeRange}&limit=10`, {
          timeoutMs: 5000,
          retries: 0
        });
        const data = Array.isArray(response.data) && response.data.length > 0 ? response.data as Post[] : sortedMockPosts;
        setPosts(data);
        setCache(prev => ({ ...prev, [cacheKey]: { ...prev[cacheKey] || { posts: [], users: [] }, posts: data } }));
      } else {
        const response = await apiClient.get(`/api/leaderboard/users?sortBy=${sortBy}&timeRange=${timeRange}&limit=10`, {
          timeoutMs: 5000,
          retries: 0
        });
        const data = Array.isArray(response.data) && response.data.length > 0 ? response.data as User[] : sortedMockUsers;
        setUsers(data);
        setCache(prev => ({ ...prev, [cacheKey]: { ...prev[cacheKey] || { posts: [], users: [] }, users: data } }));
      }
    } catch (err: any) {
      // API请求失败时，继续使用mock数据，不显示错误
      console.log('API请求失败，使用mock数据:', err.message);
      // 不设置错误状态，保持使用mock数据
    } finally {
      // 使用requestAnimationFrame确保UI流畅更新
      requestAnimationFrame(() => {
        setLoading(false);
      });
    }
  };

  const handlePostClick = (postId: number) => {
    navigate(`/explore/${postId}`);
  };

  const handleUserClick = async (user: User) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
    setIsLoadingDetail(true);
    
    // 获取用户热门作品
    try {
      // 使用mock数据筛选用户的热门作品
      const sortedPosts = mockPosts.filter(post => post.user_id === user.id)
        .sort((a, b) => b.likes_count - a.likes_count)
        .slice(0, 3);
      setUserPosts(sortedPosts);
    } catch (error) {
      console.error('Failed to fetch user posts:', error);
      setUserPosts([]);
    } finally {
      // 使用requestAnimationFrame确保UI流畅更新
      requestAnimationFrame(() => {
        setIsLoadingDetail(false);
      });
    }
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setTimeout(() => {
      setSelectedUser(null);
      setUserPosts([]);
    }, 300);
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
                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{posts.length > 0 ? '12.5k+' : '-'}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">创作者</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{users.length > 0 ? '8.2k+' : '-'}</p>
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
              {leaderboardType === 'posts' ? (
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
                              <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 -mt-2 -mr-2 scale-90">
                            {getRankBadge(index)}
                          </div>
                        </div>
                        
                        {/* 缩略图 (如果有) */}
                        {post.thumbnail && (
                          <div className="mb-4 rounded-xl overflow-hidden h-32 w-full">
                             <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
                          </div>
                        )}

                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed flex-1">
                          {post.content}
                        </p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700/50 mt-auto">
                          <div className="flex items-center gap-2">
                            {post.username && (
                              <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(post.username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&size=24`}
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
                            <img
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                              alt={user.username}
                              className="w-24 h-24 rounded-full border-[3px] border-white dark:border-gray-800 shadow-md object-cover relative z-10 group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
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
                            加入于 {new Date(user.created_at).toLocaleDateString()}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-3 w-full mt-auto">
                            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700/50 group-hover:border-blue-200 dark:group-hover:border-blue-800/30 transition-colors">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide scale-90">作品</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">{user.posts_count || 0}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700/50 group-hover:border-pink-200 dark:group-hover:border-pink-800/30 transition-colors">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide scale-90">获赞</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">{user.total_likes ? (user.total_likes > 1000 ? `${(user.total_likes/1000).toFixed(1)}k` : user.total_likes) : 0}</p>
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

      {/* 创作者详情弹窗 */}
      <AnimatePresence>
        {isDetailOpen && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseDetail}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[85vh] overflow-y-auto scrollbar-hide"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 弹窗头部 */}
              <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
                <button
                  onClick={handleCloseDetail}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm transition-colors z-10"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              {/* 弹窗内容 */}
              <div className="px-8 pb-8 -mt-16 relative">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-32 h-32 p-1 bg-white dark:bg-gray-800 rounded-full shadow-lg">
                    <img
                      src={selectedUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedUser.username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                      alt={selectedUser.username}
                      className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-800"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-4 mb-1">{selectedUser.username}</h3>
                  <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm">
                    <i className="fas fa-envelope opacity-70"></i>
                    {selectedUser.email}
                  </p>
                </div>

                {/* 统计数据 */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-700/50">
                    <div className="w-10 h-10 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
                      <i className="fas fa-image"></i>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">作品数量</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedUser.posts_count || 0}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-700/50">
                    <div className="w-10 h-10 mx-auto bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400 mb-2">
                      <i className="fas fa-heart"></i>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">总点赞数</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedUser.total_likes || 0}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-700/50">
                    <div className="w-10 h-10 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 mb-2">
                      <i className="fas fa-eye"></i>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">总浏览量</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedUser.total_views || 0}</p>
                  </div>
                </div>

                {/* 热门作品 */}
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <i className="fas fa-fire text-red-500"></i>
                    热门作品
                  </h4>
                  
                  {isLoadingDetail ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 animate-pulse flex gap-4">
                          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : userPosts.length > 0 ? (
                    <div className="space-y-3">
                      {userPosts.map((post) => (
                        <div 
                          key={post.id} 
                          className="group bg-white dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 hover:border-blue-200 dark:hover:border-blue-500/30 transition-all cursor-pointer flex gap-4 items-center"
                          onClick={() => {
                            handleCloseDetail();
                            setTimeout(() => handlePostClick(post.id), 300);
                          }}
                        >
                          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center text-gray-400">
                            <i className="fas fa-image text-xl"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-gray-900 dark:text-white truncate mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{post.title}</h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">{post.content}</p>
                            <div className="flex gap-3 text-xs text-gray-400">
                              <span className="flex items-center gap-1"><i className="fas fa-eye"></i> {post.views}</span>
                              <span className="flex items-center gap-1"><i className="fas fa-heart"></i> {post.likes_count}</span>
                            </div>
                          </div>
                          <i className="fas fa-chevron-right text-gray-300 dark:text-gray-600 group-hover:translate-x-1 transition-transform"></i>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                      <p>暂无公开作品</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Leaderboard;
