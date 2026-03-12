import { supabase } from '@/lib/supabase';
import { useState, useContext, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { useGuide } from '@/contexts/GuideContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import {
  Bookmark,
  Heart,
  Settings,
  FileText,
  Users,
  Bell,
  TrendingUp,
  Calendar,
  Home,
  Compass,
  Sparkles,
  Award,
  Zap,
  MessageCircle,
  Share2,
  MoreHorizontal,
  ChevronRight,
  Edit3,
  Eye,
  ThumbsUp,
  Image,
  Clock,
  Target,
  Flame,
  Crown,
  Star,
  Gift,
  CheckCircle2,
  Plus,
  Trash2,
  MoreVertical
} from 'lucide-react';
import OptimizedImage from '../components/OptimizedImage';
import ActivityTimeline, { Activity } from '../components/ActivityTimeline';
import achievementService from '../services/achievementService';
import analyticsService, { WorkPerformance } from '../services/analyticsService';
import taskService, { Task } from '../services/taskService';
import { useCommunityLogic } from '@/hooks/useCommunityLogic';
import postsApi from '@/services/postService';
import PWAInstallButton from '@/components/PWAInstallButton'
import { useSupabasePoints } from '@/hooks/useSupabasePoints';
import MobileDashboard from '@/components/MobileDashboard';

// 模拟数据
const performanceData = [
  { name: '一月', views: 0, likes: 0, comments: 0 },
  { name: '二月', views: 0, likes: 0, comments: 0 },
  { name: '三月', views: 0, likes: 0, comments: 0 },
  { name: '四月', views: 0, likes: 0, comments: 0 },
  { name: '五月', views: 0, likes: 0, comments: 0 },
  { name: '六月', views: 0, likes: 0, comments: 0 },
];

const recentWorks: any[] = [];

// 导航菜单项
const navItems = [
  { icon: Home, label: '首页', href: '/', active: false },
  { icon: Compass, label: '广场', href: '/square', active: false },
  { icon: Sparkles, label: '创作', href: '/create', active: false },
  { icon: MessageCircle, label: '社区', href: '/community', active: false },
  { icon: Award, label: '成就', href: '/achievement-museum', active: false },
];

// 快捷操作项
const quickActions = [
  { icon: Bookmark, label: '我的收藏', count: 0, color: 'from-amber-400 to-orange-500', href: '/collection' },
  { icon: Heart, label: '我的点赞', count: 0, color: 'from-rose-400 to-pink-500', href: '/collection?tab=likes' },
  { icon: FileText, label: '草稿箱', count: 0, color: 'from-violet-400 to-purple-500', href: '/drafts' },
  { icon: Users, label: '好友', count: 0, color: 'from-emerald-400 to-teal-500', href: '/friends' },
  { icon: Bell, label: '通知', count: 0, color: 'from-blue-400 to-cyan-500', href: '/notifications' },
  { icon: Settings, label: '设置', count: undefined, color: 'from-gray-400 to-slate-500', href: '/settings' },
];

export default function Dashboard() {
  const { isDark } = useTheme();
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { startGuide } = useGuide();
  const [isLoading, setIsLoading] = useState(true);
  const [creatorLevelInfo, setCreatorLevelInfo] = useState(() => achievementService.getCreatorLevelInfo());
  const [achievements, setAchievements] = useState(() => achievementService.getUnlockedAchievements());
  const [worksPerformance, setWorksPerformance] = useState<WorkPerformance[]>([]);
  const [analyticsChartData, setAnalyticsChartData] = useState<any[] | null>(null);
  const [activePeriod, setActivePeriod] = useState<'周' | '月' | '年'>('月');
  const [noviceTasks, setNoviceTasks] = useState<Task[]>([]);
  const [dailyTasks, setDailyTasks] = useState<Task[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [activeContentTab, setActiveContentTab] = useState<'comprehensive' | 'hot' | 'latest'>('comprehensive');
  const [activeNav, setActiveNav] = useState('dashboard');
  const [isCheckInAnimating, setIsCheckInAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 使用 Supabase 积分服务
  const {
    balance,
    stats: pointsStats,
    hasCheckinToday,
    checkinRecords,
    checkin,
    isLoading: pointsLoading
  } = useSupabasePoints();

  const { threads, onUpvote, onToggleFavorite } = useCommunityLogic();

  const [quickNavCounts, setQuickNavCounts] = useState({
    bookmarks: 0,
    likes: 0,
    drafts: 0,
    friends: 0,
    notifications: 0,
  });

  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  const [comparisonData, setComparisonData] = useState({
    viewsChange: 12.5,
    likesChange: 8.3,
    worksChange: -2.1,
    followersChange: 5.7,
  });

  // 热门话题数据
  const [hotTopics, setHotTopics] = useState<Array<{ tag: string; count: string; hot: boolean }>>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  const isRealUser = user && user.id &&
    typeof user.id === 'string' &&
    !user.id.startsWith('phone_user_') &&
    !user.id.startsWith('temp_') &&
    user.id.length > 10;
  const [realUserWorks, setRealUserWorks] = useState<any[]>([]);
  const [realUserStats, setRealUserStats] = useState<any>(null);

  // 获取真实用户数据
  useEffect(() => {
    if (isRealUser && user?.id) {
      const fetchUserData = async () => {
        try {
          setIsLoading(true);
          let worksLoaded = false;

          const token = localStorage.getItem('token');
          if (token) {
            try {
              const worksResponse = await fetch(`/api/works?creator_id=${user.id}&limit=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (worksResponse.ok) {
                const result = await worksResponse.json();
                if (result.code === 0 && Array.isArray(result.data) && result.data.length > 0) {
                  const works = result.data;

                  const formattedWorks = works.map((w: any) => {
                    let workDate: string;
                    if (w.created_at) {
                      const timestamp = w.created_at > 10000000000 ? w.created_at : w.created_at * 1000;
                      workDate = new Date(timestamp).toLocaleDateString('zh-CN');
                    } else {
                      workDate = new Date().toLocaleDateString('zh-CN');
                    }

                    // 使用 view_count 字段（API 返回的字段）
                    const viewCount = w.view_count ?? w.views ?? 0;

                    return {
                      id: w.id?.toString() || '',
                      title: w.title || 'Untitled',
                      thumbnail: w.thumbnail || w.cover_url || '',
                      videoUrl: w.videoUrl || w.video_url || '',
                      type: w.type || 'image',
                      status: w.status === 'published' ? '已发布' : '草稿',
                      date: workDate,
                      views: viewCount,
                      likes: w.likes || 0,
                      metrics: {
                        views: viewCount,
                        likes: w.likes || 0,
                        comments: w.comments || 0,
                        shares: 0,
                        engagementRate: 0
                      }
                    };
                  });

                  formattedWorks.sort((a: any, b: any) => {
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                  });

                  setRealUserWorks(formattedWorks);
                  worksLoaded = true;

                  // API 返回的是 view_count 字段
                  const totalViews = works.reduce((sum: number, w: any) => sum + (w.view_count ?? w.views ?? 0), 0);
                  const totalLikes = works.reduce((sum: number, w: any) => sum + (w.likes || 0), 0);

                  setRealUserStats({
                    views_count: totalViews,
                    likes_count: totalLikes,
                    works_count: works.length,
                    level: 1,
                    points: 0
                  });
                }
              }

              const statsResponse = await fetch('/api/user/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (statsResponse.ok) {
                const statsResult = await statsResponse.json();
                if (statsResult.code === 0 && statsResult.data) {
                  setRealUserStats((prev: any) => ({
                    ...prev,
                    ...statsResult.data
                  }));
                }
              }
            } catch (apiError) {
              console.warn('[Dashboard] Backend API failed, falling back to Supabase:', apiError);
            }
          }

          if (!worksLoaded) {
            const { data: works, error: worksError } = await supabase
              .from('works')
              .select('*')
              .eq('creator_id', user.id)
              .order('created_at', { ascending: false });

            if (!worksError && works && works.length > 0) {
              const formattedWorks = works.map(w => {
                let workDate: string;
                if (w.created_at) {
                  workDate = new Date(w.created_at * 1000).toLocaleDateString('zh-CN');
                } else {
                  workDate = new Date().toLocaleDateString('zh-CN');
                }

                // 使用 views 字段（数据库实际字段），而不是 view_count
                const viewCount = w.views ?? w.view_count ?? 0;

                return {
                  id: w.id,
                  title: w.title,
                  thumbnail: w.thumbnail || w.cover_url || '',
                  videoUrl: w.video_url || '',
                  type: w.type || 'image',
                  status: w.status === 'published' ? '已发布' : '草稿',
                  date: workDate,
                  views: viewCount,
                  likes: w.likes || 0,
                  metrics: {
                    views: viewCount,
                    likes: w.likes || 0,
                    comments: w.comments || 0,
                    shares: 0,
                    engagementRate: 0
                  }
                };
              });
              setRealUserWorks(formattedWorks);

              // 使用 views 字段（数据库实际字段）
              const totalViews = works.reduce((sum, w) => sum + (w.views ?? w.view_count ?? 0), 0);
              const totalLikes = works.reduce((sum, w) => sum + (w.likes || 0), 0);

              setRealUserStats({
                views_count: totalViews,
                likes_count: totalLikes,
                works_count: works.length,
                level: 1,
                points: 0
              });
            }
          }

        } catch (error) {
          console.error('[Dashboard] Failed to fetch real user data:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUserData();

      const loadQuickNavCounts = async () => {
        try {
          const token = localStorage.getItem('token');

          if (token) {
            try {
              const response = await fetch('/api/user/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (response.ok) {
                const result = await response.json();
                if (result.code === 0 && result.data) {
                  setQuickNavCounts({
                    bookmarks: result.data.bookmarks_count || 0,
                    likes: result.data.likes_count || 0,
                    drafts: result.data.drafts_count || 0,
                    friends: result.data.friends_count || 0,
                    notifications: result.data.notifications_count || 0
                  });
                  return;
                }
              }
            } catch (apiError) {
              console.warn('[Dashboard] Backend API stats failed:', apiError);
            }
          }

          const { count: bookmarkCount } = await supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
          const { count: likeCount } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
          const { count: draftCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', user.id).eq('status', 'draft');

          setQuickNavCounts({
            bookmarks: bookmarkCount || 0,
            likes: likeCount || 0,
            drafts: draftCount || 0,
            friends: 0,
            notifications: 0
          });
        } catch (error) {
          console.error('[Dashboard] Failed to load quick nav counts:', error);
        }
      };

      loadQuickNavCounts();
    } else {
      setIsLoading(false);
    }
  }, [isRealUser, user?.id]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.work-menu-container') && !target.closest('.work-actions-button')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 加载作品表现数据
  useEffect(() => {
    const loadWorksPerformance = async () => {
      try {
        const data = await analyticsService.getWorksPerformance(3);
        setWorksPerformance(data);
      } catch (error) {
        console.warn('加载作品表现数据失败:', error);
      }
    };
    loadWorksPerformance();
  }, []);

  // 获取热门话题数据
  useEffect(() => {
    console.log('[Dashboard] Hot topics useEffect triggered');

    const fetchHotTopics = async () => {
      console.log('[Dashboard] Starting fetchHotTopics...');
      setIsLoadingTopics(true);

      try {
        // 从 works 表中获取所有标签
        console.log('[Dashboard] Querying Supabase for works...');
        const { data: works, error } = await supabase
          .from('works')
          .select('tags');

        console.log('[Dashboard] Supabase response:', { worksCount: works?.length, error });

        if (error) {
          console.error('[Dashboard] Supabase error:', error);
          throw error;
        }

        if (!works || works.length === 0) {
          console.log('[Dashboard] No works found in database');
          setHotTopics([
            { tag: '#国潮设计', count: '2.3k', hot: true },
            { tag: '#传统文化', count: '1.8k', hot: true },
            { tag: '#创意插画', count: '1.2k', hot: false },
            { tag: '#非遗传承', count: '956', hot: false },
          ]);
          return;
        }

        // 统计标签出现次数
        const tagCounts: Record<string, number> = {};
        let totalWorksWithTags = 0;

        works.forEach((work: any, index: number) => {
          if (index < 3) {
            console.log(`[Dashboard] Work ${index} tags:`, work.tags, 'Type:', typeof work.tags);
          }

          if (work.tags) {
            // 处理不同的数据格式
            let tagsArray: string[] = [];

            if (Array.isArray(work.tags)) {
              tagsArray = work.tags;
            } else if (typeof work.tags === 'string') {
              try {
                const parsed = JSON.parse(work.tags);
                tagsArray = Array.isArray(parsed) ? parsed : [work.tags];
              } catch {
                tagsArray = work.tags.split(',').map((t: string) => t.trim());
              }
            }

            if (tagsArray.length > 0) {
              totalWorksWithTags++;
              tagsArray.forEach((tag: string) => {
                if (tag && typeof tag === 'string') {
                  const cleanTag = tag.trim();
                  if (cleanTag) {
                    tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
                  }
                }
              });
            }
          }
        });

        console.log('[Dashboard] Total works with tags:', totalWorksWithTags);
        console.log('[Dashboard] Tag counts:', tagCounts);

        // 转换为数组并排序
        const sortedTags = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([tag, count], index) => ({
            tag: tag.startsWith('#') ? tag : `#${tag}`,
            count: count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString(),
            hot: index < 2
          }));

        console.log('[Dashboard] Final sorted tags:', sortedTags);

        if (sortedTags.length > 0) {
          setHotTopics(sortedTags);
        } else {
          console.log('[Dashboard] No tags found, using defaults');
          setHotTopics([
            { tag: '#国潮设计', count: '2.3k', hot: true },
            { tag: '#传统文化', count: '1.8k', hot: true },
            { tag: '#创意插画', count: '1.2k', hot: false },
            { tag: '#非遗传承', count: '956', hot: false },
          ]);
        }
      } catch (error) {
        console.error('[Dashboard] Error in fetchHotTopics:', error);
        setHotTopics([
          { tag: '#国潮设计', count: '2.3k', hot: true },
          { tag: '#传统文化', count: '1.8k', hot: true },
          { tag: '#创意插画', count: '1.2k', hot: false },
          { tag: '#非遗传承', count: '956', hot: false },
        ]);
      } finally {
        setIsLoadingTopics(false);
        console.log('[Dashboard] fetchHotTopics completed');
      }
    };

    fetchHotTopics();
  }, []);

  const toggleMenu = (id: number) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // 使用真实的积分统计数据
  const pointsSourceStats = pointsStats?.source_stats || {
    achievement: 0,
    task: 0,
    daily: 0,
    consumption: 0,
    exchange: 0,
    other: 0
  };

  // 从真实作品数据生成图表数据
  const generateChartDataFromWorks = () => {
    if (!realUserWorks || realUserWorks.length === 0) {
      return null;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (activePeriod) {
      case '周': {
        // 生成最近7天的数据
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const data = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dayName = days[date.getDay()];
          
          // 统计这一天的数据
          const dayWorks = realUserWorks.filter(w => {
            const workDate = new Date(w.date);
            return workDate.toDateString() === date.toDateString();
          });
          
          data.push({
            name: dayName,
            views: dayWorks.reduce((sum, w) => sum + (w.view_count || 0), 0),
            likes: dayWorks.reduce((sum, w) => sum + (w.likes || 0), 0),
            comments: dayWorks.reduce((sum, w) => sum + (w.metrics?.comments || 0), 0)
          });
        }
        return data;
      }
      case '月': {
        // 生成最近6个月的数据
        const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
        const data = [];
        for (let i = 5; i >= 0; i--) {
          const monthIndex = (currentMonth - i + 12) % 12;
          const year = currentYear - (currentMonth - i < 0 ? 1 : 0);

          // 统计这个月的作品数据
          const monthWorks = realUserWorks.filter(w => {
            const workDate = new Date(w.date);
            return workDate.getMonth() === monthIndex && workDate.getFullYear() === year;
          });

          data.push({
            name: monthNames[monthIndex],
            views: monthWorks.reduce((sum, w) => sum + (w.view_count || 0), 0),
            likes: monthWorks.reduce((sum, w) => sum + (w.likes || 0), 0),
            comments: monthWorks.reduce((sum, w) => sum + (w.metrics?.comments || 0), 0)
          });
        }
        return data;
      }
      case '年': {
        // 生成最近4年的数据
        const data = [];
        for (let i = 3; i >= 0; i--) {
          const year = currentYear - i;

          // 统计这一年的作品数据
          const yearWorks = realUserWorks.filter(w => {
            const workDate = new Date(w.date);
            return workDate.getFullYear() === year;
          });

          data.push({
            name: year.toString(),
            views: yearWorks.reduce((sum, w) => sum + (w.view_count || 0), 0),
            likes: yearWorks.reduce((sum, w) => sum + (w.likes || 0), 0),
            comments: yearWorks.reduce((sum, w) => sum + (w.metrics?.comments || 0), 0)
          });
        }
        return data;
      }
      default:
        return null;
    }
  };

  const chartData = () => {
    // 优先使用从真实作品生成的数据
    const realData = generateChartDataFromWorks();
    if (realData) {
      return realData;
    }

    // 如果没有真实数据，使用模拟数据
    switch (activePeriod) {
      case '周':
        return [
          { name: '周一', views: 0, likes: 0, comments: 0 },
          { name: '周二', views: 0, likes: 0, comments: 0 },
          { name: '周三', views: 0, likes: 0, comments: 0 },
          { name: '周四', views: 0, likes: 0, comments: 0 },
          { name: '周五', views: 0, likes: 0, comments: 0 },
          { name: '周六', views: 0, likes: 0, comments: 0 },
          { name: '周日', views: 0, likes: 0, comments: 0 }
        ];
      case '月':
        return [
          { name: '一月', views: 0, likes: 0, comments: 0 },
          { name: '二月', views: 0, likes: 0, comments: 0 },
          { name: '三月', views: 0, likes: 0, comments: 0 },
          { name: '四月', views: 0, likes: 0, comments: 0 },
          { name: '五月', views: 0, likes: 0, comments: 0 },
          { name: '六月', views: 0, likes: 0, comments: 0 }
        ];
      case '年':
        return [
          { name: '2022', views: 0, likes: 0, comments: 0 },
          { name: '2023', views: 0, likes: 0, comments: 0 },
          { name: '2024', views: 0, likes: 0, comments: 0 },
          { name: '2025', views: 0, likes: 0, comments: 0 }
        ];
      default:
        return performanceData;
    }
  };

  const rawPieData = [
    { name: '成就', value: pointsSourceStats.achievement || 0, color: '#60a5fa' },
    { name: '任务', value: pointsSourceStats.task || 0, color: '#34d399' },
    { name: '每日', value: pointsSourceStats.daily || 0, color: '#fbbf24' },
    { name: '消费', value: pointsSourceStats.consumption || 0, color: '#f87171' },
    { name: '兑换', value: pointsSourceStats.exchange || 0, color: '#a78bfa' },
    { name: '其他', value: pointsSourceStats.other || 0, color: '#94a3b8' }
  ];

  // 如果所有值都是0，显示默认数据
  const hasData = rawPieData.some(item => item.value > 0);
  const pieData = hasData ? rawPieData.filter(item => item.value > 0) : [
    { name: '暂无数据', value: 1, color: '#e5e7eb' }
  ];

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    } else {
      const loadData = async () => {
        try {
          await achievementService.initialize();
          setCreatorLevelInfo(achievementService.getCreatorLevelInfo());
          setAchievements(achievementService.getUnlockedAchievements());
          setPointsStats(achievementService.getPointsStats());

          const allTasks = taskService.getAllTasks();
          const enrichedTasks = allTasks.map(task => {
            const progress = taskService.getTaskProgress(user.id).find(p => p.taskId === task.id);
            return {
              ...task,
              status: (progress && progress.progress >= task.requirements.count) ? 'completed' : 'active'
            };
          });
          setNoviceTasks(enrichedTasks.filter(t => t.tags?.includes('新手任务')) as any);
          setDailyTasks(enrichedTasks.filter(t => t.tags?.includes('每日任务')) as any);
        } catch (error) {
          console.error('Failed to load achievement data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [isAuthenticated, user, navigate]);

  const handleCreateNew = () => {
    navigate('/create');
  };

  const handleCheckIn = async () => {
    if (hasCheckinToday) {
      return;
    }
    setIsCheckInAnimating(true);
    const result = await checkin();
    if (result.success) {
      setTimeout(() => {
        setIsCheckInAnimating(false);
      }, 1000);
    } else {
      setIsCheckInAnimating(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>加载中...</p>
        </div>
      </div>
    );
  }

  // 准备移动端组件需要的统计数据
  const mobileStats = {
    views: realUserStats?.views_count || 0,
    likes: realUserStats?.likes_count || 0,
    works: realUserStats?.works_count || 0,
    followers: realUserStats?.followers_count || 0
  };

  // 移动端使用专门的移动端组件
  if (isMobile) {
    return (
      <MobileDashboard
        user={user}
        isDark={isDark}
        onLogout={logout}
        stats={mobileStats}
        quickNavCounts={quickNavCounts}
        comparisonData={comparisonData}
      />
    );
  }

  const displayWorks = isRealUser ? realUserWorks : recentWorks;
  const stats = isRealUser ? realUserStats : null;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f8f9fc]'}`}>
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 py-6">
        {/* 顶部欢迎横幅 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 p-6 rounded-3xl ${isDark
            ? 'bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50'
            : 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl shadow-gray-200/50'
            }`}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${isDark ? 'from-white to-gray-400' : 'from-gray-900 to-gray-600'}`}>
                欢迎回来，{user?.username}！
              </h1>
              <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                今天是个创作的好日子，继续你的创作之旅吧
              </p>
            </div>
            <motion.button
              id="guide-step-dashboard-create"
              onClick={handleCreateNew}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl font-medium shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-shadow"
            >
              <Plus className="w-5 h-5" />
              开始创作
            </motion.button>
          </div>
        </motion.div>

        {/* 三栏式主体布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧栏 - 用户信息和导航 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 space-y-6"
          >
            {/* 用户卡片 */}
            <div className={`p-6 rounded-3xl ${isDark
              ? 'bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
              : 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-gray-200/30'
              }`}>
              <div className="flex flex-col items-center text-center">
                {/* 头像 */}
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500">
                    {(user?.avatar_url || user?.avatar) && (user?.avatar_url || user?.avatar)?.trim() ? (
                      <img
                        src={user?.avatar_url || user?.avatar}
                        alt={user.username}
                        className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-800"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white dark:border-gray-800">
                        {user?.username?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    <Crown className="w-4 h-4" />
                  </div>
                </div>

                {/* 用户信息 */}
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {user?.username}
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {creatorLevelInfo.currentLevel.name}
                </p>

                {/* 积分 */}
                <div className="flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className={`font-semibold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    {pointsLoading ? '...' : (balance?.balance || 0)} 积分
                  </span>
                </div>

                {/* 等级进度 */}
                <div className="w-full mt-6">
                  <div className="flex justify-between text-xs mb-2">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>等级进度</span>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      {Math.min(100, Math.round(((balance?.balance || 0) / (creatorLevelInfo.nextLevel?.requiredPoints || 100)) * 100))}%
                    </span>
                  </div>
                  <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, ((balance?.balance || 0) / (creatorLevelInfo.nextLevel?.requiredPoints || 100)) * 100)}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500"
                    />
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    距离 {creatorLevelInfo.nextLevel?.name || '下一级'} 还需 {Math.max(0, (creatorLevelInfo.nextLevel?.requiredPoints || 100) - (balance?.balance || 0))} 积分
                  </p>
                </div>
              </div>
            </div>

            {/* 主导航 */}
            <div className={`p-4 rounded-3xl ${isDark
              ? 'bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
              : 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-gray-200/30'
              }`}>
              <nav className="space-y-1">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = item.label === '首页' && activeNav === 'dashboard';
                  return (
                    <motion.div
                      key={item.label}
                      whileHover={{ x: 4 }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25'
                          : isDark
                            ? 'text-gray-300 hover:bg-gray-700/50'
                            : 'text-gray-600 hover:bg-gray-100/50'
                      }`}
                      onClick={() => navigate(item.href)}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </motion.div>
                  );
                })}
              </nav>
            </div>

            {/* 每日签到 */}
            <div id="guide-step-dashboard-checkin" className={`p-6 rounded-3xl ${isDark
              ? 'bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl border border-purple-500/20'
              : 'bg-gradient-to-br from-purple-50 to-blue-50 backdrop-blur-xl border border-purple-100'
              }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-purple-500" />
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>每日签到</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
                  连续 {checkinRecords[0]?.consecutive_days || 0} 天
                </span>
              </div>

              <motion.button
                onClick={handleCheckIn}
                whileHover={{ scale: hasCheckinToday ? 1 : 1.02 }}
                whileTap={{ scale: hasCheckinToday ? 1 : 0.98 }}
                disabled={hasCheckinToday}
                className={`w-full py-4 rounded-2xl font-semibold transition-all ${
                  hasCheckinToday
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 cursor-default'
                    : isCheckInAnimating
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                } text-white shadow-lg shadow-purple-500/25`}
              >
                {hasCheckinToday ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    今日已签到
                  </span>
                ) : isCheckInAnimating ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    签到中...
                  </span>
                ) : (
                  '立即签到 +5 积分'
                )}
              </motion.button>

              {/* 签到日历 */}
              <div className="grid grid-cols-7 gap-1 mt-4">
                {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                  <div key={day} className={`text-center text-xs py-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {day}
                  </div>
                ))}
                {Array.from({ length: 7 }, (_, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs ${
                      i === 3
                        ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                        : isDark
                          ? 'bg-gray-700/50 text-gray-500'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* 查看完整签到页面 */}
              <motion.button
                onClick={() => navigate('/checkin')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full mt-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isDark
                    ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                查看完整签到页面 →
              </motion.button>
            </div>
          </motion.div>

          {/* 中间主内容区 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-6 space-y-6"
          >
            {/* 数据概览卡片 */}
            <div id="guide-step-dashboard-stats" className="grid grid-cols-3 gap-4">
              {[
                {
                  title: '总浏览量',
                  value: stats?.views_count || 0,
                  icon: Eye,
                  change: comparisonData.viewsChange,
                  gradient: 'from-blue-500 to-cyan-500'
                },
                {
                  title: '获赞总数',
                  value: stats?.likes_count || 0,
                  icon: ThumbsUp,
                  change: comparisonData.likesChange,
                  gradient: 'from-rose-500 to-pink-500'
                },
                {
                  title: '作品总数',
                  value: stats?.works_count || displayWorks.length || 0,
                  icon: Image,
                  change: comparisonData.worksChange,
                  gradient: 'from-emerald-500 to-teal-500'
                }
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`p-5 rounded-2xl ${isDark
                      ? 'bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
                      : 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-gray-200/30'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.title}</p>
                        <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {(stat?.value || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3">
                      <span className={`text-xs flex items-center ${stat.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {stat.change >= 0 ? '↑' : '↓'} {Math.abs(stat.change)}%
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>较上月</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* 作品表现图表 */}
            <div className={`p-6 rounded-3xl ${isDark
              ? 'bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
              : 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-gray-200/30'
              }`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>作品表现趋势</h3>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>过去6个月的数据统计</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(['周', '月', '年'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setActivePeriod(period)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        period === activePeriod
                          ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25'
                          : isDark
                            ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData()}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="name" tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        borderRadius: '1rem',
                        color: isDark ? '#ffffff' : '#000000'
                      }}
                    />
                    <Area type="monotone" dataKey="views" name="浏览量" stroke="#60a5fa" fillOpacity={1} fill="url(#colorViews)" strokeWidth={2} />
                    <Area type="monotone" dataKey="likes" name="点赞数" stroke="#f87171" fillOpacity={1} fill="url(#colorLikes)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 最近作品 */}
            <div id="guide-step-dashboard-works" className={`p-6 rounded-3xl ${isDark
              ? 'bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
              : 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-gray-200/30'
              }`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                    <Image className="w-5 h-5" />
                  </div>
                  <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>最近作品</h3>
                </div>
                <button
                  onClick={() => navigate('/my-works')}
                  className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 font-medium"
                >
                  查看全部
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {displayWorks.length === 0 ? (
                  <div className={`text-center py-12 rounded-2xl ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                    <Image className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>暂无作品，快去创作吧！</p>
                    <button
                      onClick={handleCreateNew}
                      className="mt-4 px-6 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-sm font-medium"
                    >
                      开始创作
                    </button>
                  </div>
                ) : (
                  displayWorks.slice(0, 4).map((work, index) => (
                    <motion.div
                      key={work.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={`flex items-center gap-4 p-4 rounded-2xl ${isDark
                        ? 'bg-gray-700/30 hover:bg-gray-700/50'
                        : 'bg-gray-50 hover:bg-gray-100/50'
                        } transition-colors group relative`}
                    >
                      <div
                        className="relative w-16 h-16 rounded-xl overflow-hidden cursor-pointer"
                        onClick={() => navigate(`/work/${work.id}`)}
                      >
                        {work.type === 'video' && work.videoUrl ? (
                          <video
                            src={work.videoUrl}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            autoPlay
                            playsInline
                            preload="metadata"
                          />
                        ) : work.thumbnail ? (
                          <img
                            src={work.thumbnail}
                            alt={work.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                            <Image className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                          </div>
                        )}
                        {work.type === 'video' && (
                          <div className="absolute top-0.5 right-0.5 bg-black/60 text-white text-[8px] px-1 py-0.5 rounded-full">
                            <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => navigate(`/work/${work.id}`)}
                      >
                        <h4 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {work.title}
                        </h4>
                        <div className="flex items-center gap-4 mt-1 text-sm">
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{work.date}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            work.status === '已发布'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {work.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <Eye className="w-4 h-4" />
                          {work.view_count}
                        </span>
                        <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <Heart className="w-4 h-4" />
                          {work.likes}
                        </span>
                        {/* 删除按钮 */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('确定要删除此作品吗？此操作不可恢复。')) {
                              postsApi.deletePost(work.id).then((success) => {
                                if (success) {
                                  setRealUserWorks(prev => prev.filter(w => w.id !== work.id));
                                  setRealUserStats(prev => ({
                                    ...prev,
                                    works_count: Math.max(0, (prev?.works_count || 1) - 1)
                                  }));
                                }
                              });
                            }
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark
                              ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400'
                              : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                          }`}
                          title="删除作品"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* 成就展示 */}
            <div className={`p-6 rounded-3xl ${isDark
              ? 'bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
              : 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-gray-200/30'
              }`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>最近成就</h3>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已解锁 {achievements.length} 个成就</p>
                  </div>
                </div>
                <Link
                  to="/achievements"
                  className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 font-medium"
                >
                  查看全部
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {achievements.slice(0, 4).map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ y: -4 }}
                    className={`p-4 rounded-2xl text-center ${isDark
                      ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20'
                      : 'bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-100'
                      }`}
                  >
                    <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl mb-2 ${isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'}`}>
                      <i className={`fas fa-${achievement.icon} text-yellow-500`} />
                    </div>
                    <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                      {achievement.name}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      +{achievement.points} 积分
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* 右侧栏 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3 space-y-6"
          >
            {/* 快捷操作 */}
            <div id="guide-step-dashboard-quick-actions" className={`p-6 rounded-3xl ${isDark
              ? 'bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
              : 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-gray-200/30'
              }`}>
              <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>快捷操作</h3>
              <div className="grid grid-cols-3 gap-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  const count = quickNavCounts[action.label === '我的收藏' ? 'bookmarks' :
                    action.label === '我的点赞' ? 'likes' :
                      action.label === '草稿箱' ? 'drafts' :
                        action.label === '好友' ? 'friends' :
                          action.label === '通知' ? 'notifications' : ''];
                  return (
                    <motion.div
                      key={action.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 * index }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center p-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors relative cursor-pointer"
                      onClick={() => navigate(action.href)}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-lg mb-2`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {action.label}
                      </span>
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {count > 99 ? '99+' : count}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* 成就进度 */}
            <div className={`p-6 rounded-3xl ${isDark
              ? 'bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
              : 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-gray-200/30'
              }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 text-white">
                    <Award className="w-5 h-5" />
                  </div>
                  <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>成就进度</h3>
                </div>
                <Link to="/achievement-museum" className="text-xs text-amber-500 hover:text-amber-600 font-medium">
                  全部成就
                </Link>
              </div>

              <div className="space-y-3">
                {achievements.slice(0, 3).map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`p-4 rounded-2xl ${isDark
                      ? 'bg-gray-700/30'
                      : 'bg-gray-50'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${
                        achievement.rarity === 'legendary' ? 'from-yellow-400 to-amber-600 text-white' :
                        achievement.rarity === 'epic' ? 'from-purple-400 to-indigo-600 text-white' :
                        achievement.rarity === 'rare' ? 'from-blue-400 to-cyan-600 text-white' :
                        'from-gray-400 to-gray-600 text-white'
                      }`}>
                        <span className="text-lg">{achievement.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                          {achievement.name}
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {achievement.points} 积分 · {achievement.rarity === 'legendary' ? '传说' : achievement.rarity === 'epic' ? '史诗' : achievement.rarity === 'rare' ? '稀有' : '普通'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {achievements.length === 0 && (
                  <div className={`p-4 rounded-2xl text-center ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>暂无解锁的成就</p>
                    <Link to="/achievement-museum" className="text-xs text-amber-500 hover:text-amber-600 mt-1 inline-block">
                      去解锁成就 →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* 积分分布 */}
            <div className={`p-6 rounded-3xl ${isDark
              ? 'bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
              : 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-gray-200/30'
              }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>积分分布</h3>
              </div>

              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        borderRadius: '0.75rem',
                        color: isDark ? '#ffffff' : '#000000'
                      }}
                      formatter={(value) => [`${value} 积分`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                {pieData.slice(0, 4).map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.name}</span>
                    <span className={`text-xs font-medium ml-auto ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 热门话题 */}
            <div id="guide-step-dashboard-topics" className={`p-6 rounded-3xl ${isDark
              ? 'bg-gradient-to-br from-orange-900/20 to-red-900/20 backdrop-blur-xl border border-orange-500/20'
              : 'bg-gradient-to-br from-orange-50 to-red-50 backdrop-blur-xl border border-orange-100'
              }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>热门话题</h3>
              </div>

              <div className="space-y-3">
                {isLoadingTopics ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-orange-500"></div>
                  </div>
                ) : hotTopics.length > 0 ? hotTopics.map((topic, index) => (
                  <motion.div
                    key={topic.tag}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer ${isDark
                      ? 'bg-gray-800/50 hover:bg-gray-700/50'
                      : 'bg-white/50 hover:bg-white'
                      } transition-colors`}
                    onClick={() => navigate(`/explore?tag=${encodeURIComponent(topic.tag)}`)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {topic.tag}
                      </span>
                      {topic.hot && (
                        <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">
                          HOT
                        </span>
                      )}
                    </div>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {topic.count} 作品
                    </span>
                  </motion.div>
                )) : (
                  <div className={`text-center py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    暂无热门话题
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
