import { useState, useContext, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import CreatorProfile from '../components/CreatorProfile';
import achievementService from '../services/achievementService';
import analyticsService from '../services/analyticsService';


import OnboardingGuide from '@/components/OnboardingGuide'

// 模拟数据
const performanceData = [
  { name: '一月', views: 4000, likes: 2400, comments: 240 },
  { name: '二月', views: 3000, likes: 1398, comments: 221 },
  { name: '三月', views: 2000, likes: 9800, comments: 229 },
  { name: '四月', views: 2780, likes: 3908, comments: 200 },
  { name: '五月', views: 1890, likes: 4800, comments: 218 },
  { name: '六月', views: 2390, likes: 3800, comments: 250 },
];

const recentWorks = [
  {
    id: 1,
    title: '国潮插画设计',
    thumbnail: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&h=400&fit=crop',
    status: '已发布',
    views: 1245,
    likes: 324,
    date: '2025-11-10',
    copyrightCertified: true
  },
  {
    id: 2,
    title: '老字号包装设计',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20brand%20packaging%20design',
    status: '审核中',
    views: 0,
    likes: 0,
    date: '2025-11-09',
    copyrightCertified: false
  },
  {
    id: 3,
    title: '传统纹样AI创作',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=AI%20generated%20traditional%20Chinese%20patterns',
    status: '草稿',
    views: 0,
    likes: 0,
    date: '2025-11-08',
    copyrightCertified: false
  },
];



export default function Dashboard() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatorProfile, setShowCreatorProfile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [creatorLevelInfo, setCreatorLevelInfo] = useState(() => achievementService.getCreatorLevelInfo());
  const [achievements, setAchievements] = useState(() => achievementService.getUnlockedAchievements());
  const [pointsStats, setPointsStats] = useState(() => achievementService.getPointsStats());
  const [worksPerformance, setWorksPerformance] = useState(() => analyticsService.getWorksPerformance(3));
  const [activePeriod, setActivePeriod] = useState<'周' | '月' | '年'>('月');
  // 作品操作菜单状态管理
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

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
  const pointsSourceStats = achievementService.getPointsSourceStats();
  
  // 根据activePeriod计算当前图表数据
  const chartData = () => {
    switch (activePeriod) {
      case '周':
        return [
          { name: '周一', views: 1200, likes: 800, comments: 120 },
          { name: '周二', views: 1500, likes: 900, comments: 150 },
          { name: '周三', views: 1800, likes: 1200, comments: 180 },
          { name: '周四', views: 1600, likes: 1000, comments: 160 },
          { name: '周五', views: 2000, likes: 1500, comments: 200 },
          { name: '周六', views: 2500, likes: 1800, comments: 250 },
          { name: '周日', views: 2200, likes: 1600, comments: 220 }
        ];
      case '月':
        return [
          { name: '一月', views: 4000, likes: 2400, comments: 240 },
          { name: '二月', views: 3000, likes: 1398, comments: 221 },
          { name: '三月', views: 2000, likes: 9800, comments: 229 },
          { name: '四月', views: 2780, likes: 3908, comments: 200 },
          { name: '五月', views: 1890, likes: 4800, comments: 218 },
          { name: '六月', views: 2390, likes: 3800, comments: 250 }
        ];
      case '年':
        return [
          { name: '2022', views: 12000, likes: 8000, comments: 1200 },
          { name: '2023', views: 15000, likes: 9000, comments: 1500 },
          { name: '2024', views: 18000, likes: 12000, comments: 1800 },
          { name: '2025', views: 22000, likes: 16000, comments: 2200 }
        ];
      default:
        return performanceData;
    }
  };
  const pieData = [
    { name: '成就', value: pointsSourceStats.achievement, color: '#60a5fa' },
    { name: '任务', value: pointsSourceStats.task, color: '#34d399' },
    { name: '每日', value: pointsSourceStats.daily, color: '#fbbf24' },
    { name: '消费', value: pointsSourceStats.consumption, color: '#f87171' },
    { name: '兑换', value: pointsSourceStats.exchange, color: '#a78bfa' },
    { name: '其他', value: pointsSourceStats.other, color: '#94a3b8' }
  ].filter(item => item.value > 0);
  
  // 检查是否已登录
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    } else {
      // 模拟加载数据
      setTimeout(() => {
        setIsLoading(false);
        // 中文注释：首次登录展示新手引导（按用户维度持久化）
        try {
          const key = `onboarded-${user.id}`
          const done = localStorage.getItem(key) === 'true'
          if (!done) setShowOnboarding(true)
        } catch {}
      }, 800);
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
      <OnboardingGuide
          isOpen={showOnboarding}
          onClose={(completed) => {
            try {
              if (user) {
                localStorage.setItem(`onboarded-${user.id}`, 'true')
              }
            } catch {}
            setShowOnboarding(false)
          }}
        />
      <main className="container mx-auto px-4 py-8">
        {/* 欢迎区域 */}
        <motion.div 
          className={`mb-8 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold mb-2">欢迎回来，{user?.username}！</h1>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                今天是个创作的好日子，您有 <span className="text-red-600 font-medium">3</span> 个作品待完成
              </p>
            </div>
            
            <motion.button
              onClick={handleCreateNew}
              className="mt-4 md:mt-0 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full flex items-center transition-colors min-h-[44px]"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              aria-label="开始创作"
            >
              <i className="fas fa-plus mr-2"></i>
              开始创作
            </motion.button>
          </div>
        </motion.div>
        
        {/* 创作者信息卡片 */}
        <motion.div 
          className={`mb-8 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row items-center md:items-start p-2 md:p-0">
              <div className="relative mb-6 md:mb-0 md:mr-6">
                {user?.avatar && user.avatar.trim() ? (
                  <div className="relative w-24 h-24 rounded-full">
                    <img 
                      src={user.avatar} 
                      alt={user.username || '用户头像'} 
                      className="w-full h-full rounded-full object-cover border-4 border-red-600"
                      loading="lazy" decoding="async"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const defaultAvatar = document.createElement('div');
                          defaultAvatar.className = `absolute inset-0 rounded-full flex items-center justify-center text-white font-bold text-3xl border-4 border-red-600 ${isDark ? 'bg-blue-600' : 'bg-orange-500'}`;
                          defaultAvatar.textContent = user?.username?.charAt(0) || 'U';
                          parent.appendChild(defaultAvatar);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl ${isDark ? 'bg-blue-600' : 'bg-orange-500'} border-4 border-red-600`}>
                    {user?.username?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold">
                  {creatorLevelInfo.levelProgress}%
                </div>
              </div>
              
              <div className="flex-1 w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div className="mb-4 md:mb-0">
                    <h2 className="text-xl font-bold mb-2">{user?.username}</h2>
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="bg-blue-100 text-blue-600 text-sm px-3 py-1 rounded-full">
                        {creatorLevelInfo.currentLevel.name} {creatorLevelInfo.currentLevel.icon}
                      </span>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {creatorLevelInfo.currentPoints} 积分
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                    {/* 会员中心入口 */}
                    <Link 
                      to="/membership"
                      className={`w-full px-4 py-3 rounded-lg min-h-[44px] bg-red-600 hover:bg-red-700 text-white transition-colors text-sm flex items-center justify-center`}
                    >
                      <i className="fas fa-crown mr-1.5"></i>
                      会员中心
                    </Link>
                    
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
                  <span>{creatorLevelInfo.currentLevel.name}</span>
                  <span className="text-right">{creatorLevelInfo.nextLevel ? `${creatorLevelInfo.nextLevel.name} (${creatorLevelInfo.nextLevel.requiredPoints}积分)` : '已达最高等级'}</span>
                </div>
                <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} mb-1`}>
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-red-600"
                    style={{ width: `${creatorLevelInfo.levelProgress}%` }}
                  ></div>
                </div>
              </div>
              
              {/* 成就徽章 */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {achievements.slice(0, 4).map((achievement) => (
                  <div 
                    key={achievement.id}
                    className={`flex items-center px-3 py-2 rounded-full text-sm ${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}
                  >
                    <i className={`fas fa-${achievement.icon} mr-1.5 text-yellow-500`}></i>
                    <span>{achievement.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* 创作者详情展开区域 */}
          {showCreatorProfile && (
            <CreatorProfile 
              creatorData={{
                level: creatorLevelInfo.currentLevel.name,
                levelProgress: creatorLevelInfo.levelProgress,
                points: creatorLevelInfo.currentPoints,
                achievements: achievements.map(achievement => ({
                  id: achievement.id,
                  name: achievement.name,
                  description: achievement.description,
                  icon: achievement.icon
                })),
                availableRewards: [
                  { id: 1, name: '高级素材包', description: '解锁20个高级文化素材', requirement: '完成5篇作品' },
                  { id: 2, name: '优先审核权', description: '作品审核时间缩短50%', requirement: '完成10篇作品' },
                ],
                tasks: [
                  { id: 1, title: '完成新手引导', status: 'completed' as const, reward: '50积分' },
                  { id: 2, title: '发布第一篇作品', status: 'completed' as const, reward: '100积分 + 素材包' },
                  { id: 3, title: '邀请一位好友', status: 'pending' as const, reward: '150积分' },
                  { id: 4, title: '参与一次主题活动', status: 'pending' as const, reward: '200积分' },
                ],
                commercialApplications: [
                  { id: 1, title: '国潮插画设计', brand: '老字号品牌A', status: '洽谈中', date: '2025-11-11' },
                  { id: 2, title: '传统纹样创新', brand: '老字号品牌B', status: '已采纳', date: '2025-11-05', revenue: '¥1,200' },
                ],
                pointsStats: pointsStats
              }}
              isDark={isDark}
            />
          )}
        </motion.div>
        
        {/* 数据概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { title: '总浏览量', value: '12,458', icon: 'eye', color: 'blue' },
            { title: '获赞总数', value: '3,245', icon: 'thumbs-up', color: 'red' },
            { title: '作品总数', value: '28', icon: 'image', color: 'green' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.title}</p>
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}-100 text-${stat.color}-600`}>
                  <i className={`far fa-${stat.icon} text-xl`}></i>
                </div>
              </div>
              <div className="mt-4 text-sm">
                <span className="text-green-500 flex items-center">
                  <i className="fas fa-arrow-up mr-1"></i>12.5%
                </span>
                <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>较上月</span>
              </div>
            </motion.div>
          ))}
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
                  // 中文注释：时间范围切换按钮——增大触控高度到44px，并标注选中状态
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
          
          {/* 最近作品 */}
          <motion.div 
            className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">最近作品</h2>
              <Link 
                to="/explore?filter=my-works" 
                className="text-red-600 hover:text-red-700 text-sm transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-red-300 focus:rounded-full"
                aria-label="查看全部作品"
                data-discover="true"
              >
                查看全部
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentWorks.map((work) => (
                <div key={work.id} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} transition-transform hover:scale-[1.02] relative`}>
                  <div className="flex items-start">
                    <div className="relative">
                      <img 
                        src={work.thumbnail} 
                        alt={work.title} 
                        className="w-16 h-16 rounded-lg object-cover mr-4"
                        loading="lazy" decoding="async"
                      />
                      {work.copyrightCertified && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          <i className="fas fa-shield-alt"></i>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{work.title}</h3>
                      <div className="flex items-center text-xs mb-2">
                        <span className={`px-2 py-0.5 rounded-full mr-2 ${work.status === '已发布' ? 'bg-green-100 text-green-600' : work.status === '审核中' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'}`}>
                          {work.status}
                        </span>
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {work.date}
                        </span>
                      </div>
                      <div className="flex items-center text-xs">
                        <span className="flex items-center mr-3">
                          <i className="far fa-eye mr-1"></i>
                          {work.views}
                        </span>
                        <span className="flex items-center">
                          <i className="far fa-thumbs-up mr-1"></i>{work.likes}
                        </span>
                      </div>
                    </div>
                    {/* 作品操作按钮 */}
                    <div className="relative ml-2 work-menu-container">
                      <button 
                        className={`text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors ${openMenuId === work.id ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300' : ''} work-actions-button`}
                        aria-label="更多操作"
                        type="button"
                        id={`work-actions-${work.id}`}
                        onClick={() => toggleMenu(work.id)}
                        aria-expanded={openMenuId === work.id}
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                      {/* 操作下拉菜单 */}
                      {openMenuId === work.id && (
                        <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-50 ${isDark ? 'bg-gray-700' : 'bg-white'} border border-gray-200 py-1 transition-all duration-200 ease-in-out`}>
                          <button 
                            className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-100 text-gray-700'} transition-colors flex items-center`}
                            onClick={() => {
                              navigate(`/explore/${work.id}`);
                              setOpenMenuId(null);
                            }}
                          >
                            <i className="far fa-eye mr-2"></i>
                            查看详情
                          </button>
                          <button 
                            className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-100 text-gray-700'} transition-colors flex items-center`}
                            onClick={() => {
                              navigate(`/create?id=${work.id}`);
                              setOpenMenuId(null);
                            }}
                          >
                            <i className="far fa-edit mr-2"></i>
                            编辑作品
                          </button>
                          {work.status === '草稿' && (
                            <button 
                              className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-100 text-gray-700'} transition-colors flex items-center`}
                              onClick={() => {
                                // 添加发布作品逻辑
                                alert('作品发布成功！');
                                setOpenMenuId(null);
                              }}
                            >
                              <i className="far fa-paper-plane mr-2"></i>
                              发布作品
                            </button>
                          )}
                          {work.status === '已发布' && (
                            <button 
                              className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-100 text-gray-700'} transition-colors flex items-center`}
                              onClick={() => {
                                // 添加复制作品逻辑
                                alert('作品复制成功！');
                                setOpenMenuId(null);
                              }}
                            >
                              <i className="far fa-copy mr-2"></i>
                              复制作品
                            </button>
                          )}
                          <button 
                            className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-600'} transition-colors flex items-center`}
                            onClick={() => {
                              // 添加删除作品逻辑
                              if (window.confirm('确定要删除此作品吗？')) {
                                alert('作品删除成功！');
                                setOpenMenuId(null);
                              }
                            }}
                          >
                            <i className="far fa-trash-alt mr-2"></i>
                            删除作品
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
                  <div className="text-3xl font-bold">{achievementService.getAchievementStats().completionRate}%</div>
                  <div className="text-sm text-green-500">
                    <i className="fas fa-arrow-up mr-1"></i>+5%
                  </div>
                </div>
                <div className="mt-3">
                  <div className={`h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-red-600" 
                      style={{ width: `${achievementService.getAchievementStats().completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* 成就解锁数量 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className="text-sm font-medium mb-2">已解锁成就</h3>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold">{achievementService.getUnlockedAchievements().length}</div>
                  <div className="text-sm text-gray-500">
                    / {achievementService.getAllAchievements().length}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-5 gap-1">
                  {achievementService.getAllAchievements().map((achievement, index) => (
                    <div 
                      key={index} 
                      className={`h-4 rounded-md ${achievement.isUnlocked ? 'bg-green-500' : isDark ? 'bg-gray-600' : 'bg-gray-200'}`} 
                      title={achievement.name}
                    ></div>
                  ))}
                </div>
              </div>
              
              {/* 积分统计 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className="text-sm font-medium mb-2">积分统计</h3>
                <div className="text-3xl font-bold">{creatorLevelInfo.currentPoints}</div>
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
                    // 这里可以添加签到逻辑
                    alert('签到成功！获得5积分');
                  }}
                >
                  <div className="absolute inset-0 bg-white/10"></div>
                  <div className="relative z-10">
                    <i className="fas fa-calendar-check text-4xl mb-2"></i>
                    <div className="mt-2">签到</div>
                  </div>
                </motion.div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                  连续签到 7 天
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
                  {/* 模拟签到记录 */}
                  {Array.from({ length: 30 }, (_, i) => (
                    <div 
                      key={i} 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${i % 2 === 0 ? 'bg-green-500 text-white' : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'}`}
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
            
            {/* 任务列表 */}
            <div className="space-y-4">
              {/* 新手任务 */}
              <div>
                <h3 className="text-sm font-medium mb-3">新手任务</h3>
                <div className="space-y-3">
                  {[
                    { id: 1, title: '完成新手引导', status: 'completed', reward: '50 积分', icon: 'fas fa-graduation-cap' },
                    { id: 2, title: '发布第一篇作品', status: 'completed', reward: '100 积分 + 素材包', icon: 'fas fa-paper-plane' },
                    { id: 3, title: '邀请一位好友', status: 'pending', reward: '150 积分', icon: 'fas fa-user-plus', route: '/friends' },
                    { id: 4, title: '参与一次主题活动', status: 'pending', reward: '200 积分', icon: 'fas fa-calendar-alt', route: '/events' }
                  ].map((task) => (
                    <motion.div 
                      key={task.id} 
                      className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} flex items-center justify-between`}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-600' : isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'} flex items-center justify-center mr-3`}>
                          <i className={task.icon}></i>
                        </div>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{task.reward}</div>
                        </div>
                      </div>
                      <motion.button 
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${task.status === 'completed' ? 'bg-green-100 text-green-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                        disabled={task.status === 'completed'}
                        whileHover={{ scale: task.status !== 'completed' ? 1.05 : 1 }}
                        whileTap={{ scale: task.status !== 'completed' ? 0.95 : 1 }}
                        onClick={() => {
                          if (task.status !== 'completed' && (task as any).route) {
                            navigate((task as any).route);
                          }
                        }}
                      >
                        {task.status === 'completed' ? '已完成' : '去完成'}
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* 每日任务 */}
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3">每日任务</h3>
                <div className="space-y-3">
                  {[
                    { id: 5, title: '登录平台', status: 'completed', reward: '2 积分', icon: 'fas fa-sign-in-alt' },
                    { id: 6, title: '浏览 5 个作品', status: 'completed', reward: '3 积分', icon: 'fas fa-eye', route: '/explore' },
                    { id: 7, title: '发表 1 条评论', status: 'pending', reward: '5 积分', icon: 'fas fa-comment', route: '/explore' },
                    { id: 8, title: '分享作品到社交平台', status: 'pending', reward: '10 积分', icon: 'fas fa-share-alt', route: '/explore' }
                  ].map((task) => (
                    <motion.div 
                      key={task.id} 
                      className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} flex items-center justify-between`}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-600' : isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'} flex items-center justify-center mr-3`}>
                          <i className={task.icon}></i>
                        </div>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{task.reward}</div>
                        </div>
                      </div>
                      <motion.button 
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${task.status === 'completed' ? 'bg-green-100 text-green-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                        disabled={task.status === 'completed'}
                        whileHover={{ scale: task.status !== 'completed' ? 1.05 : 1 }}
                        whileTap={{ scale: task.status !== 'completed' ? 0.95 : 1 }}
                        onClick={() => {
                          if (task.status !== 'completed' && (task as any).route) {
                            navigate((task as any).route);
                          }
                        }}
                      >
                        {task.status === 'completed' ? '已完成' : '去完成'}
                      </motion.button>
                    </motion.div>
                  ))}
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
                className="text-red-600 hover:text-red-700 text-sm transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-red-300 focus:rounded-full"
                aria-label="查看全部作品表现分析"
                data-discover="true"
              >
                查看全部
              </Link>
            </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {worksPerformance.map((work) => (
              <motion.div 
                key={work.workId} 
                className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} transition-all hover:shadow-lg`}
                whileHover={{ y: -5 }}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold">{work.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${work.trend === 'up' ? 'bg-green-100 text-green-600' : work.trend === 'down' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                    {work.trend === 'up' ? '↑ 上升' : work.trend === 'down' ? '↓ 下降' : '→ 稳定'}
                  </span>
                </div>
                
                <div className="mb-4">
                  <img 
                    src={work.thumbnail} 
                    alt={work.title} 
                    className="w-full h-32 object-cover rounded-lg"
                    loading="lazy"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>浏览量</span>
                    <span className="font-medium">{work.metrics.views}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>点赞数</span>
                    <span className="font-medium">{work.metrics.likes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>评论数</span>
                    <span className="font-medium">{work.metrics.comments}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>分享数</span>
                    <span className="font-medium">{work.metrics.shares}</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>互动率</span>
                    <span className="font-medium text-green-600">{Math.round(work.metrics.engagementRate * 100)}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* 创作工具推荐 */}
        <motion.div 
          className={`mt-8 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <h2 className="text-xl font-bold mb-6">推荐创作工具</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                title: '一键国潮设计', 
                description: 'AI自动生成符合国潮风格的设计作品',
                icon: 'palette',
                color: 'purple'
              },
              { 
                title: '文化资产嵌入', 
                description: '智能嵌入传统文化元素和纹样',
                icon: 'gem',
                color: 'yellow'
              },
              { 
                title: 'AI滤镜', 
                description: '应用独特的AI滤镜，增强作品表现力',
                icon: 'filter',
                color: 'blue'
              },
              { 
                title: '文化溯源', 
                description: '了解并展示设计中文化元素的来源',
                icon: 'book',
                color: 'green'
              },
            ].map((tool, index) => (
              <motion.div 
                key={index}
                className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border border-gray-200 transition-all hover:shadow-lg cursor-pointer`}
                whileHover={{ y: -5 }}
                // 中文注释：整卡可点击，跳转到对应创作工具页
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { 
                  if (e.key === 'Enter' || e.key === ' ') { 
                    e.preventDefault(); 
                    const id = tool.icon === 'palette' ? 'sketch' : tool.icon === 'gem' ? 'pattern' : tool.icon === 'filter' ? 'filter' : 'trace'
                    navigate(`/create?tool=${id}`)
                  } 
                }}
                onClick={() => { const id = tool.icon === 'palette' ? 'sketch' : tool.icon === 'gem' ? 'pattern' : tool.icon === 'filter' ? 'filter' : 'trace'; navigate(`/create?tool=${id}`) }}
              >
                <div className={`w-12 h-12 rounded-full bg-${tool.color}-100 text-${tool.color}-600 flex items-center justify-center mb-4`}>
                  <i className={`fas fa-${tool.icon} text-xl`}></i>
                </div>
                <h3 className="font-bold mb-2">{tool.title}</h3>
                <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{tool.description}</p>
                {/* 中文注释：工具卡片CTA按钮——增大触控高度到44px并增加无障碍标签 */}
                <button 
                  className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors min-h-[44px]"
                  aria-label={`使用 ${tool.title}`}
                  onClick={(e) => { 
                    // 中文注释：按钮点击跳转；阻止事件冒泡避免与整卡点击冲突
                    e.stopPropagation(); 
                    const id = tool.icon === 'palette' ? 'sketch' : tool.icon === 'gem' ? 'pattern' : tool.icon === 'filter' ? 'filter' : 'trace'; 
                    navigate(`/create?tool=${id}`) 
                  }}
                >
                  立即使用
                  <i className="fas fa-arrow-right ml-1 text-xs"></i>
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
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
