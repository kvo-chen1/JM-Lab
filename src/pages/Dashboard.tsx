import { useState, useContext, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import CreatorProfile from '../components/CreatorProfile';
import OptimizedImage from '../components/OptimizedImage';
import achievementService from '../services/achievementService';
import analyticsService from '../services/analyticsService';
import taskService, { Task } from '../services/taskService';
import checkinService from '../services/checkinService';
import { useCommunityLogic } from '@/hooks/useCommunityLogic';


import PWAInstallButton from '@/components/PWAInstallButton'

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


export default function Dashboard() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatorProfile, setShowCreatorProfile] = useState(false);
  const [creatorLevelInfo, setCreatorLevelInfo] = useState(() => achievementService.getCreatorLevelInfo());
  const [achievements, setAchievements] = useState(() => achievementService.getUnlockedAchievements());
  const [pointsStats, setPointsStats] = useState(() => achievementService.getPointsStats());
  const [worksPerformance, setWorksPerformance] = useState(() => analyticsService.getWorksPerformance(3));
  // 新增：图表数据状态
  const [analyticsChartData, setAnalyticsChartData] = useState<any[] | null>(null);
  const [activePeriod, setActivePeriod] = useState<'周' | '月' | '年'>('月');
  const [noviceTasks, setNoviceTasks] = useState<Task[]>([]);
  const [dailyTasks, setDailyTasks] = useState<Task[]>([]);
  // 作品操作菜单状态管理
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  // 动态内容导航状态
  const [activeContentTab, setActiveContentTab] = useState<'comprehensive' | 'hot' | 'latest'>('comprehensive');
  
  // 使用社区逻辑钩子获取动态数据
  const { threads, onUpvote, onToggleFavorite } = useCommunityLogic();

  // 判断是否为真实用户（非手机号模拟用户）
  const isRealUser = user && !user.id.startsWith('phone_user_');
  const [realUserWorks, setRealUserWorks] = useState<any[]>([]);
  const [realUserStats, setRealUserStats] = useState<any>(null);

  // 获取真实用户数据
  useEffect(() => {
    if (isRealUser && user?.id) {
      const fetchUserData = async () => {
        try {
          setIsLoading(true);
          // 并行请求所有用户数据
          const [worksRes, statsRes, achievementsRes, tasksRes, analyticsRes] = await Promise.all([
            fetch(`/api/user/works?userId=${user.id}`),
            fetch(`/api/user/stats?userId=${user.id}`),
            fetch(`/api/user/achievements?userId=${user.id}`),
            fetch(`/api/user/tasks?userId=${user.id}`),
            fetch(`/api/user/analytics?userId=${user.id}`)
          ]);
          
          // 处理作品数据
          if (worksRes.ok) {
            const worksData = await worksRes.json();
            if (worksData.code === 0) {
              setRealUserWorks(worksData.data || []);
            } else {
              console.warn('Works API returned error:', worksData.message);
            }
          } else {
            console.warn('Works API request failed:', worksRes.status);
          }
          
          // 处理统计数据
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            if (statsData.code === 0) {
              const data = statsData.data;
              setRealUserStats(data);
              
              // Update level info with real data
              if (data) {
                setCreatorLevelInfo(prev => ({
                  ...prev,
                  currentLevel: { 
                    ...prev.currentLevel,
                    id: data.level || 1, 
                    name: `创作Lv.${data.level || 1}`, 
                    icon: (data.level || 1) === 1 ? 'seedling' : (data.level || 1) === 2 ? 'tree' : 'crown',
                  },
                  nextLevel: (data.level || 1) < 4 ? { 
                    ...prev.nextLevel!,
                    id: (data.level || 1) + 1, 
                    name: `创作Lv.${(data.level || 1) + 1}`, 
                    requiredPoints: data.next_level_points || 100
                  } : null,
                  currentPoints: data.points || 0,
                  pointsToNextLevel: (data.next_level_points || 100) - (data.points || 0),
                  levelProgress: data.level_progress || 0
                }));
              }
            } else {
              console.warn('Stats API returned error:', statsData.message);
            }
          } else {
            console.warn('Stats API request failed:', statsRes.status);
          }
          
          // 处理成就数据
          if (achievementsRes.ok) {
            const achievementsData = await achievementsRes.json();
            if (achievementsData.code === 0) {
              setAchievements(achievementsData.data.achievements || []);
              setPointsStats(achievementsData.data.pointsStats || pointsStats);
            } else {
              console.warn('Achievements API returned error:', achievementsData.message);
            }
          } else {
            console.warn('Achievements API request failed:', achievementsRes.status);
          }
          
          // 处理任务数据
          if (tasksRes.ok) {
            const tasksData = await tasksRes.json();
            if (tasksData.code === 0) {
              setNoviceTasks(tasksData.data.noviceTasks || []);
              setDailyTasks(tasksData.data.dailyTasks || []);
            } else {
              console.warn('Tasks API returned error:', tasksData.message);
            }
          } else {
            console.warn('Tasks API request failed:', tasksRes.status);
          }
          
          // 处理分析数据
          if (analyticsRes.ok) {
            const analyticsData = await analyticsRes.json();
            if (analyticsData.code === 0) {
              const data = analyticsData.data;
              // 智能处理不同格式的返回数据
              if (Array.isArray(data)) {
                setWorksPerformance(data);
              } else if (data && typeof data === 'object') {
                // 如果包含 works 字段且是数组
                if (Array.isArray(data.works)) {
                  setWorksPerformance(data.works);
                }
                // 如果包含 chartData 字段
                if (Array.isArray(data.chartData)) {
                  setAnalyticsChartData(data.chartData);
                }
                // 如果 data 本身包含 list 字段（常见分页格式）
                if (Array.isArray(data.list)) {
                  setWorksPerformance(data.list);
                }
              }
            } else {
              console.warn('Analytics API returned error:', analyticsData.message);
            }
          } else {
            console.warn('Analytics API request failed:', analyticsRes.status);
          }
        } catch (error) {
          console.error('Failed to fetch real user data:', error);
          // 错误时保持现有状态，不清除数据
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchUserData();
    } else {
      setIsLoading(false);
    }
  }, [isRealUser, user?.id, pointsStats, worksPerformance]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 检查点击目标是否在菜单内部
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

  // 切换菜单显示
  const toggleMenu = (id: number) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };
  
  // 准备积分来源饼图数据
  const pointsSourceStats = pointsStats?.pointsSourceStats || achievementService.getPointsSourceStats();
  
  // 根据activePeriod计算当前图表数据
  const chartData = () => {
    // 检查是否有真实的分析数据
    if (isRealUser && analyticsChartData && analyticsChartData.length > 0) {
      return analyticsChartData;
    }
    
    // 兼容旧逻辑：如果worksPerformance中有chartData（虽然类型定义不支持，但运行时可能存在）
    if (isRealUser && worksPerformance && (worksPerformance as any).chartData) {
      return (worksPerformance as any).chartData;
    }
    
    // 如果没有真实数据，返回基于时间段的默认数据
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
  const pieData = [
    { name: '成就', value: pointsSourceStats.achievement || 0, color: '#60a5fa' },
    { name: '任务', value: pointsSourceStats.task || 0, color: '#34d399' },
    { name: '每日', value: pointsSourceStats.daily || 0, color: '#fbbf24' },
    { name: '消费', value: pointsSourceStats.consumption || 0, color: '#f87171' },
    { name: '兑换', value: pointsSourceStats.exchange || 0, color: '#a78bfa' },
    { name: '其他', value: pointsSourceStats.other || 0, color: '#94a3b8' }
  ].filter(item => item.value > 0);
  
  // 检查是否已登录并加载数据
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    } else {
      // 加载成就和积分数据
      const loadData = async () => {
        try {
          await achievementService.initialize();
          setCreatorLevelInfo(achievementService.getCreatorLevelInfo());
          setAchievements(achievementService.getUnlockedAchievements());
          setPointsStats(achievementService.getPointsStats());

          // 加载任务数据
          const allTasks = taskService.getAllTasks();
          // 更新任务状态
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
  
  return (
    <>
      <main className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 中间内容区 */}
          <div className="lg:col-span-12">
            {/* 欢迎区域 */}
        <motion.div 
          className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 backdrop-blur-sm border border-gray-700' : 'bg-gradient-to-br from-white to-red-50 shadow-md border border-red-50'} relative overflow-hidden`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 装饰元素 */}
          <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-red-500/10 rounded-full blur-3xl -mr-8 sm:-mr-16 -mt-8 sm:-mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-blue-500/10 rounded-full blur-3xl -ml-4 sm:-ml-8 -mb-4 sm:-mb-8"></div>
          
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-4">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600">欢迎回来，{user?.username}！</h1>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm leading-relaxed`}>
            今天是个创作的好日子，您有 <span className="text-red-600 font-medium animate-pulse">0</span> 个作品待完成
          </p>
        </div>
        
        <motion.button
          id="guide-step-dashboard-create"
          onClick={handleCreateNew}
          className="w-full sm:w-auto mt-2 sm:mt-0 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 sm:px-6 py-3 rounded-full flex items-center justify-center gap-2 transition-all duration-300 min-h-[48px] shadow-lg hover:shadow-xl hover:shadow-red-500/20"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
          aria-label="开始创作"
        >
          <i className="fas fa-magic text-lg"></i>
          <span className="font-semibold">开始创作</span>
        </motion.button>
      </div>
    </motion.div>
        
        {/* 创作者信息卡片 */}
        <motion.div 
          className={`mb-8 p-6 rounded-2xl ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 backdrop-blur-sm border border-gray-700' : 'bg-white shadow-md border border-gray-100'} relative overflow-hidden`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* 装饰元素 */}
          <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-red-500/10 rounded-full blur-3xl -mr-8 sm:-mr-16 -mt-8 sm:-mt-16"></div>
          <div className="flex flex-col md:flex-row items-center md:items-start p-3 md:p-0 gap-4 sm:gap-6">
              <div className="relative">
                {user?.avatar && user.avatar.trim() ? (
                  <div className="relative w-20 sm:w-24 h-20 sm:h-24 rounded-full group">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 to-orange-500 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                    <OptimizedImage
                      src={user.avatar}
                      alt={user.username || '用户头像'}
                      priority={true}
                      placeholder="加载中..."
                      className="w-full h-full rounded-full object-cover border-3 sm:border-4 border-red-600 transition-transform duration-300 group-hover:scale-105 relative z-10"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const defaultAvatar = document.createElement('div');
                          defaultAvatar.className = `absolute inset-0 rounded-full flex items-center justify-center text-white font-bold text-2xl sm:text-3xl border-3 sm:border-4 border-red-600 bg-gradient-to-r from-blue-600 to-red-600`;
                          defaultAvatar.textContent = user?.username?.charAt(0) || 'U';
                          parent.appendChild(defaultAvatar);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className={`w-20 sm:w-24 h-20 sm:h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl sm:text-3xl bg-gradient-to-r from-blue-600 to-red-600 border-3 sm:border-4 border-red-600 relative overflow-hidden group`}>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {user?.username?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-red-600 text-white w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg group-hover:scale-110 transition-transform duration-200">
                  {creatorLevelInfo.levelProgress}%
                </div>
              </div>
              
              <div className="flex-1 w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                  <div className="mb-4 md:mb-0">
                    <h2 className="text-xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600">{user?.username}</h2>
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="bg-gradient-to-r from-blue-100 to-red-100 text-blue-600 text-sm px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                        <i className="fas fa-crown text-yellow-500"></i>
                        {creatorLevelInfo.currentLevel.name} {creatorLevelInfo.currentLevel.icon}
                      </span>
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} flex items-center gap-1`}>
                        <i className="fas fa-star text-yellow-500"></i>
                        {creatorLevelInfo.currentPoints} 积分
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">

                    
                    
                    {/* 安装应用按钮 - 仅在可安装时显示 */}
                    <PWAInstallButton variant="dashboard" isDark={isDark} />
                    
                    {/* 中文注释：移动端优化——详情切换按钮触控区统一至少44px，并增加无障碍属性 */}
                    <button 
                      onClick={() => setShowCreatorProfile(!showCreatorProfile)}
                      className={`w-full px-4 py-3 rounded-lg min-h-[44px] ${
                        isDark 
                          ? 'bg-gray-700 hover:bg-gray-600' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      } transition-colors text-sm`}
                      aria-expanded={showCreatorProfile}
                      aria-label={showCreatorProfile ? '收起创作者详情' : '查看创作者详情'}
                    >
                      {showCreatorProfile ? '收起详情' : '查看创作者详情'}
                    </button>
                  </div>
                </div>
              
              {/* 等级进度条 */}
              <div className="mb-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{creatorLevelInfo.currentLevel.name}</span>
                  <span className="text-right text-sm">
                    {creatorLevelInfo.nextLevel ? (
                      `${creatorLevelInfo.nextLevel.name} (${Math.max(0, creatorLevelInfo.nextLevel.requiredPoints - creatorLevelInfo.currentPoints)}积分升级)`
                    ) : '已达最高等级'}
                  </span>
                </div>
                <div className={`h-3 rounded-full ${isDark ? 'bg-gray-700/80' : 'bg-gray-200'} mb-1 overflow-hidden`}>
                  <motion.div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-red-600 flex items-center justify-end pr-2"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, creatorLevelInfo.levelProgress))}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  >
                    {creatorLevelInfo.levelProgress > 5 && (
                      <span className="text-xs text-white font-bold">{Math.round(creatorLevelInfo.levelProgress)}%</span>
                    )}
                  </motion.div>
                </div>
              </div>
              
              {/* 成就徽章 */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {achievements.slice(0, 4).map((achievement) => (
                  <motion.div 
                    key={achievement.id}
                    className={`flex items-center px-3 py-2 rounded-full text-sm ${isDark ? 'bg-gray-700/80 backdrop-blur-sm hover:bg-gray-600' : 'bg-white hover:bg-gray-50 border border-gray-200'} transition-all duration-300 hover:shadow-md hover:-translate-y-1`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <i className={`fas fa-${achievement.icon} mr-1.5 text-yellow-500`}></i>
                    <span>{achievement.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          
          {/* 创作者详情展开区域 */}
          {showCreatorProfile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CreatorProfile 
                creatorData={{level: creatorLevelInfo.currentLevel.name,levelProgress: creatorLevelInfo.levelProgress,points: creatorLevelInfo.currentPoints,achievements: achievements.map(achievement => ({
                    id: achievement.id,name: achievement.name,description: achievement.description,icon: achievement.icon
                  })),availableRewards: [
                    { id: 1, name: '高级素材包', description: '解锁20个高级文化素材', requirement: '完成5篇作品' },
                    { id: 2, name: '优先审核权', description: '作品审核时间缩短50%', requirement: '完成10篇作品' },
                  ],tasks: [
                    { id: 1, title: '完成新手引导', status: 'completed' as const, reward: '50积分' },
                    { id: 2, title: '发布第一篇作品', status: 'completed' as const, reward: '100积分 + 素材包' },
                    { id: 3, title: '邀请一位好友', status: 'pending' as const, reward: '150积分' },
                    { id: 4, title: '参与一次主题活动', status: 'pending' as const, reward: '200积分' },
                  ],commercialApplications: [
                    { id: 1, title: '国潮插画设计', brand: '老字号品牌A', status: '洽谈中', date: '2025-11-11' },
                    { id: 2, title: '传统纹样创新', brand: '老字号品牌B', status: '已采纳', date: '2025-11-05', revenue: '¥1,200' },
                  ],pointsStats: pointsStats
                }}
                isDark={isDark}
              />
            </motion.div>
          )}
        </motion.div>
        
        {/* 数据概览 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {
            [
              { title: '总浏览量', value: isRealUser ? (realUserStats?.views_count || realUserStats?.total_views || 0).toLocaleString() : '0', icon: 'eye', color: 'blue' },
              { title: '获赞总数', value: isRealUser ? (realUserStats?.likes_count || realUserStats?.total_likes || 0).toLocaleString() : '0', icon: 'thumbs-up', color: 'red' },
              { title: '作品总数', value: isRealUser ? (realUserStats?.works_count || realUserStats?.total_works || realUserWorks.length || 0).toLocaleString() : '0', icon: 'image', color: 'green' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className={`p-4 sm:p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.title}</p>
                    <h3 className="text-xl sm:text-2xl font-bold">{stat.value}</h3>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-full bg-${stat.color}-100 text-${stat.color}-600`}>
                    <i className={`far fa-${stat.icon} text-lg sm:text-xl`}></i>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 text-sm">
                  <span className="text-green-500 flex items-center">
                    <i className="fas fa-arrow-up mr-1"></i>12.5%
                  </span>
                  <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>较上月</span>
                </div>
              </motion.div>
            ))
          }
        </div>
        
        {/* 图表和最近作品 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 数据图表 */}
          <motion.div 
            className={`lg:col-span-2 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">作品表现趋势</h2>
              <div className="flex space-x-2">
                {(['周', '月', '年'] as const).map((period) => (
                  <button 
                    key={period}
                    type="button"
                    className={`px-4 py-2 rounded-lg text-sm min-h-[44px] ${period === activePeriod ? 'bg-red-600 text-white' : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                    aria-pressed={period === activePeriod}
                    onClick={() => setActivePeriod(period)}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            
            <motion.div 
              className="h-80"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              key={activePeriod}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: isDark ? '#9ca3af' : '#4b5563' }}
                    axisLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fill: isDark ? '#9ca3af' : '#4b5563' }}
                    axisLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#e5e7eb',
                      borderRadius: '0.5rem',
                      color: isDark ? '#ffffff' : '#000000'
                    }} 
                  />
                  <Bar dataKey="views" name="浏览量" fill="#60a5fa" radius={[4, 4, 0, 0]} animationDuration={1000} />
                  <Bar dataKey="likes" name="点赞数" fill="#f87171" radius={[4, 4, 0, 0]} animationDuration={1000} />
                  <Bar dataKey="comments" name="评论数" fill="#34d399" radius={[4, 4, 0, 0]} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </motion.div>
          
          {/* 最近作品模块，调整标题字号让整体更柔和 */}
          <motion.div 
            className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">最近作品</h2>
              <Link 
                to="/explore?filter=my-works" 
                className="text-red-600 hover:text-red-700 text-sm transition-all hover:underline hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300 focus:rounded-full"
                aria-label="查看全部作品"
                data-discover="true"
              >
                查看全部
              </Link>
            </div>
            
            <div className="space-y-3">
              {(isRealUser ? realUserWorks : recentWorks).length === 0 && isRealUser ? (
                 <div className="text-center py-8 text-gray-500">
                   <p>暂无作品，快去创作吧！</p>
                 </div>
              ) : (isRealUser ? realUserWorks : recentWorks).map((work) => (
                <motion.div 
                  key={work.id} 
                  className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/80 backdrop-blur-sm border border-gray-600' : 'bg-white border border-gray-100 shadow-sm'} transition-all hover:shadow-md hover:border-red-200 relative group`}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-500 group-hover:border-red-300 transition-colors">
                        <OptimizedImage
                          src={work.thumbnail}
                          alt={work.title}
                          placeholder={work.title.charAt(0)}
                          aspectRatio="1/1"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const defaultImg = document.createElement('div');
                              defaultImg.className = `w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-500 dark:from-gray-700 dark:to-gray-600 dark:text-gray-400 font-semibold`;
                              defaultImg.textContent = work.title.charAt(0);
                              parent.appendChild(defaultImg);
                            }
                          }}
                        />
                      </div>
                      {work.copyrightCertified && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                          <i className="fas fa-shield-alt"></i>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 ml-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-base font-semibold mb-1 group-hover:text-red-600 transition-colors">{work.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${work.status === '已发布' ? 'bg-green-100 text-green-600' : work.status === '审核中' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'}`}>
                          {work.status}
                        </span>
                      </div>
                      <div className="flex items-center text-xs mb-2">
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1`}>
                          <i className="far fa-calendar-alt text-xs"></i>
                          {work.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                          <i className="far fa-eye text-gray-500"></i>
                          {work.views.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                          <i className="far fa-thumbs-up text-gray-500"></i>
                          {work.likes.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {/* 作品操作按钮 */}
                    <div className="relative ml-2 work-menu-container">
                      <motion.button 
                        className={`text-gray-400 hover:text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-all ${openMenuId === work.id ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'hover:bg-gray-100 dark:hover:bg-gray-600'} work-actions-button`}
                        aria-label="更多操作"
                        type="button"
                        id={`work-actions-${work.id}`}
                        onClick={() => toggleMenu(work.id)}
                        aria-expanded={openMenuId === work.id}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </motion.button>
                      {/* 操作下拉菜单 */}
                      {openMenuId === work.id && (
                        <motion.div 
                          className={`absolute right-0 mt-2 w-48 rounded-lg shadow-xl z-50 ${isDark ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'} py-1 transition-all duration-200 ease-in-out`}
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                          <button 
                            className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-50 text-gray-700'} transition-colors flex items-center gap-2 hover:bg-opacity-80`}
                            onClick={() => {
                              navigate(`/explore/${work.id}`);
                              setOpenMenuId(null);
                            }}
                          >
                            <i className="far fa-eye w-4 text-center"></i>
                            查看详情
                          </button>
                          <button 
                            className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-50 text-gray-700'} transition-colors flex items-center gap-2 hover:bg-opacity-80`}
                            onClick={() => {
                              navigate(`/create?id=${work.id}`);
                              setOpenMenuId(null);
                            }}
                          >
                            <i className="far fa-edit w-4 text-center"></i>
                            编辑作品
                          </button>
                          {work.status === '草稿' && (
                            <button 
                              className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-50 text-gray-700'} transition-colors flex items-center gap-2 hover:bg-opacity-80`}
                              onClick={() => {
                                alert('作品发布成功！');
                                setOpenMenuId(null);
                              }}
                            >
                              <i className="far fa-paper-plane w-4 text-center"></i>
                              发布作品
                            </button>
                          )}
                          {work.status === '已发布' && (
                            <button 
                              className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-50 text-gray-700'} transition-colors flex items-center gap-2 hover:bg-opacity-80`}
                              onClick={() => {
                                alert('作品复制成功！');
                                setOpenMenuId(null);
                              }}
                            >
                              <i className="far fa-copy w-4 text-center"></i>
                              复制作品
                            </button>
                          )}
                          <button 
                            className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-600'} transition-colors flex items-center gap-2 hover:bg-opacity-80`}
                            onClick={() => {
                              if (window.confirm('确定要删除此作品吗？')) {
                                alert('作品删除成功！');
                                setOpenMenuId(null);
                              }
                            }}
                          >
                            <i className="far fa-trash-alt w-4 text-center"></i>
                            删除作品
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        
        {/* 积分来源分布和成就统计 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* 积分来源分布饼图 */}
          <motion.div 
            className={`lg:col-span-1 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">积分来源分布</h2>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#e5e7eb',
                      borderRadius: '0.5rem',
                      color: isDark ? '#ffffff' : '#000000'
                    }} 
                    formatter={(value) => [`${value} 积分`, '数量']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* 积分来源图例 */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm">{item.name}</span>
                  <span className="ml-auto text-sm font-medium">{item.value} 积分</span>
                </div>
              ))}
            </div>
          </motion.div>
          
          {/* 成就统计 */}
          <motion.div 
            className={`lg:col-span-2 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">成就统计</h2>
              <Link 
                to="/achievements" 
                className="text-red-600 hover:text-red-700 text-sm transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-red-300 focus:rounded-full"
                aria-label="查看全部成就"
                data-discover="true"
              >
                查看全部
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 成就完成率 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className="text-sm font-medium mb-2">成就完成率</h3>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold">{pointsStats?.completionRate || achievementService.getAchievementStats().completionRate}%</div>
                  <div className="text-sm text-green-500">
                    <i className="fas fa-arrow-up mr-1"></i>+5%
                  </div>
                </div>
                <div className="mt-3">
                  <div className={`h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-red-600" 
                      style={{ width: `${pointsStats?.completionRate || achievementService.getAchievementStats().completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* 成就解锁数量 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className="text-sm font-medium mb-2">已解锁成就</h3>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold">{achievements.length}</div>
                  <div className="text-sm text-gray-500">
                    / {pointsStats?.totalAchievements || achievementService.getAllAchievements().length}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-5 gap-1">
                  {Array.from({ length: pointsStats?.totalAchievements || achievementService.getAllAchievements().length }).map((_, index) => (
                    <div 
                      key={index} 
                      className={`h-4 rounded-md ${index < achievements.length ? 'bg-green-500' : isDark ? 'bg-gray-600' : 'bg-gray-200'}`} 
                    ></div>
                  ))}
                </div>
              </div>
              
              {/* 积分统计 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className="text-sm font-medium mb-2">积分统计</h3>
                <div className="text-2xl font-bold">{creatorLevelInfo.currentPoints}</div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-green-500">
                      <i className="fas fa-arrow-up mr-1"></i>{pointsStats.availablePoints} 可获取
                    </span>
                  </div>
                  <div className="text-xs">
                    距离升级: {creatorLevelInfo.pointsToNextLevel} 积分
                  </div>
                </div>
              </div>
            </div>
            
            {/* 最近解锁的成就 */}
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">最近解锁的成就</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {achievementService.getUnlockedAchievements()
                  .sort((a, b) => new Date(b.unlockedAt || '').getTime() - new Date(a.unlockedAt || '').getTime())
                  .slice(0, 4)
                  .map((achievement) => (
                    <div key={achievement.id} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} flex flex-col items-center`}>
                      <div className={`w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mb-2`}>
                        <i className={`fas fa-${achievement.icon} text-xl`}></i>
                      </div>
                      <h4 className="font-medium text-sm text-center mb-1">{achievement.name}</h4>
                      <p className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{achievement.points} 积分</p>
                      <div className={`mt-2 text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {achievement.unlockedAt && new Date(achievement.unlockedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* 任务中心和每日签到 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* 每日签到 */}
          <motion.div 
            className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">每日签到</h2>
            </div>
            
            <div className="flex flex-col items-center">
              {/* 签到按钮 */}
              <div className="relative mb-6">
                <motion.div 
                  className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold relative overflow-hidden cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    alert('签到成功！获得5积分');
                  }}
                >
                  <div className="absolute inset-0 bg-white/10"></div>
                  <div className="relative z-10">
                    <i className="fas fa-calendar-check text-4xl mb-2"></i>
                    <div className="mt-2">签到</div>
                  </div>
                </motion.div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-500 text-white text-xs px-3 py-1 rounded-full">
                  连续签到 0 天
                </div>
              </div>
              
              {/* 签到奖励 */}
              <div className="text-center mb-4">
                <div className="text-lg font-medium mb-1">今日签到奖励</div>
                <div className="text-2xl font-bold text-green-500">5 积分</div>
              </div>
              
              {/* 签到日历 */}
              <div className="w-full">
                <div className="grid grid-cols-7 gap-1">
                  {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                    <div key={day} className="text-center text-xs font-medium py-1">{day}</div>
                  ))}
                  {/* 模拟签到记录 - 初始化为空 */}
                  {Array.from({ length: 30 }, (_, i) => (
                    <div 
                      key={i} 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'}`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* 任务中心 */}
          <motion.div 
            className={`lg:col-span-2 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">任务中心</h2>
              <Link 
                to="/tasks" 
                className="text-red-600 hover:text-red-700 text-sm transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-red-300 focus:rounded-full"
                aria-label="查看全部任务"
                data-discover="true"
              >
                查看全部
              </Link>
            </div>
            
            <div className="space-y-4">
              {/* 新手任务 */}
              <div>
                <h3 className="text-sm font-medium mb-3">新手任务</h3>
                <div className="space-y-3">
                  {noviceTasks.map((task) => (
                    <motion.div 
                      key={task.id} 
                      className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} flex items-center justify-between`}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-600' : isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'} flex items-center justify-center mr-3`}>
                          <i className="fas fa-tasks"></i>
                        </div>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{task.reward.points} 积分</div>
                        </div>
                      </div>
                      <motion.button 
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${task.status === 'completed' ? 'bg-green-100 text-green-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                        disabled={task.status === 'completed'}
                        whileHover={{ scale: task.status !== 'completed' ? 1.05 : 1 }}
                        whileTap={{ scale: task.status !== 'completed' ? 0.95 : 1 }}
                        onClick={() => {
                          // TODO: 跳转到对应任务
                        }}
                      >
                        {task.status === 'completed' ? '已完成' : '去完成'}
                      </motion.button>
                    </motion.div>
                  ))}
                  {noviceTasks.length === 0 && <div className="text-gray-500 text-sm">暂无新手任务</div>}
                </div>
              </div>
              
              {/* 每日任务 */}
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3">每日任务</h3>
                <div className="space-y-3">
                  {dailyTasks.map((task) => (
                    <motion.div 
                      key={task.id} 
                      className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} flex items-center justify-between`}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-600' : isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'} flex items-center justify-center mr-3`}>
                          <i className="fas fa-calendar-day"></i>
                        </div>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{task.reward.points} 积分</div>
                        </div>
                      </div>
                      <motion.button 
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${task.status === 'completed' ? 'bg-green-100 text-green-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                        disabled={task.status === 'completed'}
                        whileHover={{ scale: task.status !== 'completed' ? 1.05 : 1 }}
                        whileTap={{ scale: task.status !== 'completed' ? 0.95 : 1 }}
                        onClick={() => {
                          // TODO
                        }}
                      >
                        {task.status === 'completed' ? '已完成' : '去完成'}
                      </motion.button>
                    </motion.div>
                  ))}
                   {dailyTasks.length === 0 && <div className="text-gray-500 text-sm">暂无每日任务</div>}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* 作品表现分析 */}
        <motion.div 
          className={`mt-8 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">作品表现分析</h2>
              <Link 
                to="/analytics/works" 
                className="text-red-600 hover:text-red-700 text-sm transition-all hover:underline hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300 focus:rounded-full"
                aria-label="查看全部作品表现分析"
                data-discover="true"
              >
                查看全部
              </Link>
            </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.isArray(worksPerformance) && worksPerformance.map((work) => (
              <motion.div 
                key={work.workId} 
                className={`p-5 rounded-xl ${isDark ? 'bg-gray-700/80 backdrop-blur-sm border border-gray-600' : 'bg-white shadow-sm border border-gray-100'} transition-all hover:shadow-xl hover:border-red-200 group`}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-base group-hover:text-red-600 transition-colors">{work.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${work.trend === 'up' ? 'bg-green-100 text-green-600' : work.trend === 'down' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'} group-hover:shadow-md transition-all`}>
                    {work.trend === 'up' ? '↑ 上升' : work.trend === 'down' ? '↓ 下降' : '→ 稳定'}
                  </span>
                </div>
                
                <div className="mb-4 overflow-hidden rounded-lg relative">
                  <img 
                    src={work.thumbnail} 
                    alt={work.title} 
                    className="w-full h-36 object-cover rounded-lg transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const defaultImg = document.createElement('div');
                        defaultImg.className = `w-full h-36 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-500 dark:from-gray-700 dark:to-gray-600 dark:text-gray-400 text-2xl font-bold`;
                        defaultImg.textContent = work.title.charAt(0);
                        parent.appendChild(defaultImg);
                      }
                    }}
                  />
                  {/* 图片悬停时显示的渐变遮罩 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-start p-3">
                    <span className={`text-xs text-white font-medium bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm`}>
                      {work.category}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <i className="far fa-eye text-xs"></i>
                      浏览量
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{work.metrics.views.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <i className="far fa-heart text-xs"></i>
                      点赞数
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{work.metrics.likes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <i className="far fa-comment text-xs"></i>
                      评论数
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{work.metrics.comments.toLocaleString()}</span>       
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <i className="far fa-share-square text-xs"></i>
                      分享数
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{work.metrics.shares.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>互动率</span>
                    <span className="font-bold text-green-600 flex items-center gap-1">
                      <i className="fas fa-arrow-up text-xs"></i>
                      {Math.round(work.metrics.engagementRate * 100)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 动态内容区域 */}
        <motion.div
          className={`mt-8 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          {/* 区块主标题 */}
          <h2 className="text-lg md:text-xl font-semibold mb-6">
            {activeContentTab === 'comprehensive' && '综合动态'}
            {activeContentTab === 'hot' && '热门话题'}
            {activeContentTab === 'latest' && '最新发布'}
          </h2>

          {/* 根据选中的标签显示不同内容 */}
          <div className="space-y-4">
            {/* 综合动态 - 显示所有动态 */}
            {activeContentTab === 'comprehensive' && threads.length > 0 ? (
              threads.map((thread) => (
                <div key={thread.id} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} transition-transform hover:scale-[1.02]`}>
                  <div className="flex items-start">
                    <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'} flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0`}>
                      {thread.title.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-base">{thread.title}</h3>
                      <span className="text-xs text-red-600">#{thread.topic}</span>  
                    </div>
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mb-3 line-clamp-2`}>{thread.content}</p>
                      <div className="flex items-center text-xs">
                        <button
                          onClick={() => onUpvote(thread.id)}
                          className={`mr-4 flex items-center ${isDark ? 'text-gray-400 hover:text-red-500' : 'text-gray-600 hover:text-red-600'} transition-colors`}
                        >
                          <i className="far fa-thumbs-up mr-1"></i>
                          {thread.upvotes || 0}
                        </button>
                        <span className={`mr-4 ${isDark ? 'text-gray-500' : 'text-gray-500'} flex items-center`}>
                          <i className="far fa-comment mr-1"></i>
                          {thread.replies?.length || 0}
                        </span>
                        <span className={`${isDark ? 'text-gray-500' : 'text-gray-500'} flex items-center`}>
                          <i className="far fa-clock mr-1"></i>
                          {new Date(thread.createdAt).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : activeContentTab === 'comprehensive' ? (
              <div className={`p-8 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
                <i className="far fa-newspaper text-4xl mb-3 text-gray-400"></i>       
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>暂无动态内容</p>
              </div>
            ) : null}

            {/* 热门话题 - 按点赞数排序 */}
            {activeContentTab === 'hot' && threads.length > 0 ? (
              [...threads]
                .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
                .map((thread) => (
                  <div key={thread.id} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} transition-transform hover:scale-[1.02]`}>
                    <div className="flex items-start">
                      <div className={`w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0`}>
                        🔥
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{thread.title}</h3>
                          <span className="text-xs text-red-600">#{thread.topic}</span>
                        </div>
                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mb-3 line-clamp-2`}>{thread.content}</p>
                        <div className="flex items-center text-xs">
                          <button
                            onClick={() => onUpvote(thread.id)}
                            className={`mr-4 flex items-center ${isDark ? 'text-gray-400 hover:text-red-500' : 'text-gray-600 hover:text-red-600'} transition-colors`}        
                          >
                            <i className="far fa-thumbs-up mr-1"></i>
                            {thread.upvotes || 0}
                          </button>
                          <span className={`mr-4 ${isDark ? 'text-gray-500' : 'text-gray-500'} flex items-center`}>
                            <i className="far fa-comment mr-1"></i>
                            {thread.replies?.length || 0}
                          </span>
                          <span className={`${isDark ? 'text-gray-500' : 'text-gray-500'} flex items-center`}>
                            <i className="far fa-clock mr-1"></i>
                            {new Date(thread.createdAt).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
              ))
            ) : activeContentTab === 'hot' ? (
              <div className={`p-8 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
                <i className="far fa-fire text-4xl mb-3 text-gray-400"></i>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>暂无热门话题</p>
              </div>
            ) : null}

            {/* 最新发布 - 按时间排序 */}
            {activeContentTab === 'latest' && threads.length > 0 ? (
              [...threads]
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((thread) => (
                  <div key={thread.id} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} transition-transform hover:scale-[1.02]`}>
                    <div className="flex items-start">
                      <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-blue-600' : 'bg-blue-100'} text-blue-600 flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0`}>
                        <i className="far fa-clock"></i>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{thread.title}</h3>
                          <span className="text-xs text-red-600">#{thread.topic}</span>
                        </div>
                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mb-3 line-clamp-2`}>{thread.content}</p>
                        <div className="flex items-center text-xs">
                          <button
                            onClick={() => onUpvote(thread.id)}
                            className={`mr-4 flex items-center ${isDark ? 'text-gray-400 hover:text-red-500' : 'text-gray-600 hover:text-red-600'} transition-colors`}        
                          >
                            <i className="far fa-thumbs-up mr-1"></i>
                            {thread.upvotes || 0}
                          </button>
                          <span className={`mr-4 ${isDark ? 'text-gray-500' : 'text-gray-500'} flex items-center`}>
                            <i className="far fa-comment mr-1"></i>
                            {thread.replies?.length || 0}
                          </span>
                          <span className={`${isDark ? 'text-gray-500' : 'text-gray-500'} flex items-center`}>
                            <i className="far fa-clock mr-1"></i>
                            {new Date(thread.createdAt).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            ) : activeContentTab === 'latest' ? (
              <div className={`p-8 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
                <i className="far fa-clock text-4xl mb-3 text-gray-400"></i>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>暂无最新发布</p>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </div>
      </main>

      <footer className={`border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} py-6 px-4 z-10 relative`}>
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>      
            © 2025 津脉智坊. 保留所有权利
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="/privacy" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>隐私政策</a>     
            <a href="/terms" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>服务条款</a>       
            <a href="/help" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>帮助中心</a>        
          </div>
        </div>
      </footer>
    </>
  );
}