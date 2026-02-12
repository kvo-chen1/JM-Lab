import { useState, useContext, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'sonner';
import { adminService, type DashboardStats, type ActivityData, type AuditStats, type PendingWork } from '@/services/adminService';
import { brandPartnershipService } from '@/services/brandPartnershipService';

// 懒加载数据分析页面
const DataAnalytics = lazy(() => import('./DataAnalytics'));
const StrategicAdoption = lazy(() => import('./StrategicAdoption'));
const Settings = lazy(() => import('./Settings'));
const OrderManagement = lazy(() => import('./OrderManagement'));
const PermissionManagement = lazy(() => import('./PermissionManagement'));
const FeedbackManagement = lazy(() => import('./FeedbackManagement'));

// 懒加载增强的审核管理模块
const ContentAudit = lazy(() => import('./ContentAudit'));
const AuditLog = lazy(() => import('./AuditLog'));
const UserAudit = lazy(() => import('./UserAudit'));
const EventAudit = lazy(() => import('./EventAudit'));
const ProductManagement = lazy(() => import('./ProductManagement'));
const NotificationManagement = lazy(() => import('./NotificationManagement'));
const SystemMonitor = lazy(() => import('./SystemMonitor'));

// 新增管理模块
const CommunityManagement = lazy(() => import('./CommunityManagement'));
const ContentManagement = lazy(() => import('./ContentManagement'));

const COLORS = ['#f59e0b', '#34d399', '#f87171'];

type TabType = 'dashboard' | 'audit' | 'analytics' | 'adoption' | 'users' | 'settings' | 'campaigns' | 'creators' | 'brandPartnerships' | 'orders' | 'permissions' | 'feedback' | 'contentAudit' | 'auditLog' | 'userAudit' | 'eventAudit' | 'productManagement' | 'notificationManagement' | 'systemMonitor' | 'communities' | 'contentManagement';

export default function Admin() {
  const { isDark } = useTheme();
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  
  // 真实数据状态
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalWorks: 0,
    pendingAudit: 0,
    adopted: 0,
    userTrend: 0,
    worksTrend: 0,
    pendingTrend: 0,
    adoptedTrend: 0
  });
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [auditStats, setAuditStats] = useState<AuditStats[]>([
    { name: '待审核', value: 0 },
    { name: '已通过', value: 0 },
    { name: '已拒绝', value: 0 }
  ]);
  const [pendingWorks, setPendingWorks] = useState<PendingWork[]>([]);
  const [commercialApplications, setCommercialApplications] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  // 活动管理状态
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventSearch, setEventSearch] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState('all');
  const [eventActiveTab, setEventActiveTab] = useState<'pending' | 'list'>('list'); // 活动管理标签页状态
  
  // 创作者管理状态
  const [creators, setCreators] = useState<any[]>([]);
  const [creatorsLoading, setCreatorsLoading] = useState(false);
  const [creatorSearch, setCreatorSearch] = useState('');
  const [creatorLevelFilter, setCreatorLevelFilter] = useState('all');
  const [selectedCreator, setSelectedCreator] = useState<any>(null);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [creatorModalMode, setCreatorModalMode] = useState<'view' | 'edit'>('view');
  
  // 密码验证状态
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const ADMIN_PASSWORD = 'jm2026';
  
  // 页面加载完成后关闭 loading
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, []);
  
  // 密码验证处理
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsPasswordVerified(true);
      toast.success('密码验证成功');
    } else {
      toast.error('密码错误，请重试');
      setPasswordInput('');
    }
  };

  // 获取控制台数据
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (isLoading) return;
      
      setDataLoading(true);
      try {
        // 并行获取所有数据
        const [statsData, activity, audit, pending, brandPartnerships] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getUserActivityData(),
          adminService.getAuditStats(),
          adminService.getPendingWorks(),
          brandPartnershipService.getAllPartnerships({ limit: 5 })
        ]);

        setStats(statsData);
        setActivityData(activity.length > 0 ? activity : [
          { name: '周一', 新增用户: 0, 活跃用户: 0, 创作数量: 0 },
          { name: '周二', 新增用户: 0, 活跃用户: 0, 创作数量: 0 },
          { name: '周三', 新增用户: 0, 活跃用户: 0, 创作数量: 0 },
          { name: '周四', 新增用户: 0, 活跃用户: 0, 创作数量: 0 },
          { name: '周五', 新增用户: 0, 活跃用户: 0, 创作数量: 0 },
          { name: '周六', 新增用户: 0, 活跃用户: 0, 创作数量: 0 },
          { name: '周日', 新增用户: 0, 活跃用户: 0, 创作数量: 0 }
        ]);
        setAuditStats(audit);
        setPendingWorks(pending);
        setCommercialApplications(brandPartnerships.partnerships || []);
      } catch (error) {
        console.error('获取控制台数据失败:', error);
        toast.error('获取数据失败，请稍后重试');
      } finally {
        setDataLoading(false);
      }
    };

    fetchDashboardData();
  }, [isLoading]);
  
  // 获取用户数据
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const result = await adminService.getUsers({
        page: userPage,
        limit: 10,
        status: userStatusFilter,
        search: userSearch,
      });
      
      setUsers(result.users);
      setUserTotal(result.total);
    } catch (error) {
      console.error('获取用户数据失败:', error);
      toast.error('获取用户数据失败');
    } finally {
      setUsersLoading(false);
    }
  };
  
  // 当切换到用户管理标签时获取用户数据
  useEffect(() => {
    if (activeTab === 'users' && !isLoading) {
      fetchUsers();
    }
  }, [activeTab, isLoading, userPage, userStatusFilter, userSearch]);

  // 获取活动数据
  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const result = await adminService.getEvents({
        status: eventStatusFilter === 'all' ? undefined : eventStatusFilter,
      });
      setEvents(result.events);
    } catch (error) {
      console.error('获取活动数据失败:', error);
      toast.error('获取活动数据失败');
    } finally {
      setEventsLoading(false);
    }
  };

  // 当切换到活动管理标签时获取活动数据
  useEffect(() => {
    if (activeTab === 'campaigns' && !isLoading) {
      fetchEvents();
    }
  }, [activeTab, isLoading, eventStatusFilter]);

  // 获取创作者数据
  const fetchCreators = async () => {
    setCreatorsLoading(true);
    try {
      const result = await adminService.getCreators({
        level: creatorLevelFilter === 'all' ? undefined : creatorLevelFilter,
      });
      setCreators(result.creators);
    } catch (error) {
      console.error('获取创作者数据失败:', error);
      toast.error('获取创作者数据失败');
    } finally {
      setCreatorsLoading(false);
    }
  };

  // 当切换到创作者管理标签时获取创作者数据
  useEffect(() => {
    if (activeTab === 'creators' && !isLoading) {
      fetchCreators();
    }
  }, [activeTab, isLoading, creatorLevelFilter]);
  
  const handleLogout = () => {
    logout();
    toast.success('已成功登出');
    navigate('/login');
  };
  
  const handleApprove = async (id: string | number) => {
    const success = await adminService.auditWork(id.toString(), 'approve');
    if (success) {
      toast.success('已通过审核');
      // 刷新待审核列表
      const pending = await adminService.getPendingWorks();
      setPendingWorks(pending);
      // 刷新统计数据
      const newStats = await adminService.getDashboardStats();
      setStats(newStats);
      const newAudit = await adminService.getAuditStats();
      setAuditStats(newAudit);
    } else {
      toast.error('审核失败，请重试');
    }
  };

  const handleReject = async (id: string | number) => {
    const success = await adminService.auditWork(id.toString(), 'reject');
    if (success) {
      toast.success('已拒绝审核');
      // 刷新待审核列表
      const pending = await adminService.getPendingWorks();
      setPendingWorks(pending);
      // 刷新统计数据
      const newStats = await adminService.getDashboardStats();
      setStats(newStats);
      const newAudit = await adminService.getAuditStats();
      setAuditStats(newAudit);
    } else {
      toast.error('审核失败，请重试');
    }
  };

  const handleAudit = async (id: string | number, action: 'approved' | 'rejected') => {
    const success = await adminService.auditWork(id.toString(), action === 'approved' ? 'approve' : 'reject');
    if (success) {
      toast.success(action === 'approved' ? '已通过审核' : '已拒绝审核');
      // 刷新待审核列表
      const pending = await adminService.getPendingWorks();
      setPendingWorks(pending);
      // 刷新统计数据
      const newStats = await adminService.getDashboardStats();
      setStats(newStats);
      const newAudit = await adminService.getAuditStats();
      setAuditStats(newAudit);
    } else {
      toast.error('审核失败，请重试');
    }
  };
  
  // 密码验证界面
  if (!isPasswordVerified) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-md p-8 rounded-2xl shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-lock text-white text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold mb-2">管理后台</h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              请输入密码继续访问
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                访问密码
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="请输入密码"
                className={`w-full px-4 py-3 rounded-xl border ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-red-500`}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
            >
              进入后台
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
            >
              返回首页
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 骨架屏加载状态
  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} text-white`}>
        <div className="flex">
          {/* 侧边栏骨架屏 */}
          <div className={`w-64 h-screen ${isDark ? 'bg-gray-800' : 'bg-white'} fixed`}>
            <div className="p-6">
              <div className={`h-8 w-32 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse mb-8`}></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className={`h-10 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                ))}
              </div>
            </div>
          </div>
          
          {/* 主内容骨架屏 */}
          <div className="ml-64 flex-1 p-8">
            <div className="space-y-8">
              <div className="flex justify-between">
                <div className={`h-8 w-40 rounded ${isDark ? 'bg-gray-800' : 'bg-white'} animate-pulse`}></div>
                <div className={`h-10 w-10 rounded-full ${isDark ? 'bg-gray-800' : 'bg-white'} animate-pulse`}></div>
              </div>
              
              {/* 数据概览骨架屏 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-32 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} animate-pulse`}></div>
                ))}
              </div>
              
              {/* 图表骨架屏 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-2 h-80 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} animate-pulse`}></div>
                <div className={`h-80 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} animate-pulse`}></div>
              </div>
              
              {/* 列表骨架屏 */}
              <div className={`rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} p-6 animate-pulse`}>
                <div className={`h-6 w-1/4 rounded mb-6 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center">
                      <div className={`h-12 w-12 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} mr-4`}></div>
                      <div className="flex-1">
                        <div className={`h-4 w-1/3 rounded mb-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                        <div className={`h-3 w-1/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                      </div>
                      <div className={`h-10 w-24 rounded ml-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* 侧边栏 */}
      <aside className={`w-64 h-screen ${isDark ? 'bg-gray-800' : 'bg-white'} border-r ${isDark ? 'border-gray-700' : 'border-gray-200'} fixed z-30 flex flex-col`}>
        <div className="p-6 flex-shrink-0">
          <div className="flex items-center space-x-1 mb-6">
            <span className="text-xl font-bold text-red-600">AI</span>
            <span className="text-xl font-bold">共创</span>
            <span className="ml-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">管理端</span>
          </div>
        </div>
        
        {/* 导航菜单 - 可滚动区域 */}
        <nav className="flex-1 overflow-y-auto px-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent min-h-0">
          <ul className="space-y-1">
             {[
                { id: 'dashboard', name: '控制台', icon: 'tachometer-alt' },
                { id: 'campaigns', name: '活动管理', icon: 'calendar-alt' },
                { id: 'eventAudit', name: '活动审核', icon: 'clipboard-check' },
                { id: 'communities', name: '社群管理', icon: 'users-cog' },
                { id: 'contentManagement', name: '内容管理', icon: 'newspaper' },
                { id: 'contentAudit', name: '内容审核', icon: 'file-alt' },
                { id: 'analytics', name: '数据分析', icon: 'chart-bar' },
                { id: 'adoption', name: '品牌管理', icon: 'star' },
                { id: 'users', name: '用户管理', icon: 'users' },
                { id: 'userAudit', name: '用户审计', icon: 'user-shield' },
                { id: 'creators', name: '创作者管理', icon: 'trophy' },
                { id: 'productManagement', name: '商品管理', icon: 'box' },
                { id: 'orders', name: '订单管理', icon: 'shopping-cart' },
                { id: 'feedback', name: '反馈管理', icon: 'comments' },
                { id: 'permissions', name: '权限管理', icon: 'user-lock' },
                { id: 'auditLog', name: '审计日志', icon: 'history' },
                { id: 'notificationManagement', name: '消息通知', icon: 'bell' },
                { id: 'systemMonitor', name: '系统监控', icon: 'server' },
                { id: 'settings', name: '系统设置', icon: 'cog' },
              ].map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`w-full flex items-center px-3 py-2 rounded-xl transition-all ${
                    activeTab === item.id
                      ? 'bg-red-600 text-white'
                      : isDark
                        ? 'hover:bg-gray-700'
                        : 'hover:bg-gray-100'
                  }`}
                >
                  <i className={`fas fa-${item.icon} mr-2 w-4 text-center text-sm`}></i>
                  <span className="text-sm">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* 用户信息 */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <img 
              src={user?.avatar || 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Admin%20avatar'} 
              alt={user?.username || '管理员'} 
              className="h-10 w-10 rounded-full mr-3"
            />
            <div className="flex-1">
              <p className="font-medium">{user?.username}</p>
              <p className="text-xs opacity-70">管理员</p>
            </div>
            <button 
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 transition-colors"
              aria-label="退出登录"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </aside>
      
      {/* 主内容区 */}
      <main className="ml-64 flex-1 p-8 h-screen overflow-y-auto">
        {/* 顶部导航 */}
        <div className="flex justify-between items-center mb-8">
           <h1 className="text-2xl font-bold">
             {activeTab === 'dashboard' && '管理控制台'}
             {activeTab === 'audit' && '审核活动发布'}
             {activeTab === 'analytics' && '数据分析'}
             {activeTab === 'adoption' && '品牌管理'}
             {activeTab === 'users' && '用户管理'}
             {activeTab === 'campaigns' && '活动管理'}
             {activeTab === 'creators' && '创作者管理'}
             {activeTab === 'orders' && '订单管理'}
             {activeTab === 'feedback' && '反馈管理'}
             {activeTab === 'permissions' && '权限管理'}
             {activeTab === 'settings' && '系统设置'}
             {activeTab === 'contentAudit' && '内容审核管理'}
             {activeTab === 'auditLog' && '审计日志'}
             {activeTab === 'userAudit' && '用户行为审计'}
             {activeTab === 'eventAudit' && '活动审核管理'}
             {activeTab === 'productManagement' && '商品管理'}
             {activeTab === 'notificationManagement' && '消息通知管理'}
             {activeTab === 'systemMonitor' && '系统监控'}
             {activeTab === 'communities' && '社群管理'}
             {activeTab === 'contentManagement' && '内容管理'}
           </h1>
          
          <div className="flex items-center space-x-4">
            <div className={`relative ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-full px-4 py-2`}>
              <input
                type="text"
                placeholder="搜索..."
                className="bg-transparent border-none outline-none w-40 text-sm"
              />
              <i className="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
            
            <button 
              onClick={() => navigate('/events')}
              className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} transition-colors flex items-center`}
            >
              <i className="fas fa-globe mr-2"></i>
              津脉活动
            </button>
            
            <button 
              onClick={() => navigate('/my-activities')}
              className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} transition-colors flex items-center`}
            >
              <i className="fas fa-user mr-2"></i>
              我的活动
            </button>
            
            <div className="relative">
              <button className={`p-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-white'} transition-colors`}>
                <i className="far fa-bell"></i>
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
        
        {/* 控制台内容 */}
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* 数据概览 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {[
                { 
                  title: '总用户数', 
                  value: stats.totalUsers.toLocaleString(), 
                  icon: 'users', 
                  color: 'blue', 
                  trend: stats.userTrend >= 0 ? `+${stats.userTrend}%` : `${stats.userTrend}%` 
                },
                { 
                  title: '作品总数', 
                  value: stats.totalWorks.toLocaleString(), 
                  icon: 'image', 
                  color: 'green', 
                  trend: stats.worksTrend >= 0 ? `+${stats.worksTrend}%` : `${stats.worksTrend}%` 
                },
                { 
                  title: '待审核', 
                  value: stats.pendingAudit.toString(), 
                  icon: 'clock', 
                  color: 'yellow', 
                  trend: stats.pendingTrend >= 0 ? `+${stats.pendingTrend}` : `${stats.pendingTrend}` 
                },
                { 
                  title: '已采纳', 
                  value: stats.adopted.toString(), 
                  icon: 'check-circle', 
                  color: 'purple', 
                  trend: stats.adoptedTrend >= 0 ? `+${stats.adoptedTrend}` : `${stats.adoptedTrend}` 
                },
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
                      <h3 className="text-2xl font-bold">
                        {dataLoading ? (
                          <span className={`inline-block w-16 h-8 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></span>
                        ) : (
                          stat.value
                        )}
                      </h3>
                    </div>
                    <div className={`p-3 rounded-full bg-${stat.color}-100 text-${stat.color}-600`}>
                      <i className={`fas fa-${stat.icon} text-xl`}></i>
                    </div>
                  </div>
                  <div className="mt-4 text-sm">
                    <span className={stat.title === '待审核' ? 'text-yellow-500' : 'text-green-500'}>
                      {dataLoading ? '-' : stat.trend}
                    </span>
                    <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {stat.title === '待审核' ? '较昨日' : '较上月'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* 图表区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* 用户活跃度图表 */}
              <motion.div 
                className={`lg:col-span-2 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">用户活跃度与创作趋势</h2>
                  <div className="flex space-x-2">
                    {['周', '月', '年'].map((period) => (
                      <button 
                        key={period}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          period === '周' 
                            ? 'bg-red-600 text-white' 
                            : isDark 
                              ? 'bg-gray-700 hover:bg-gray-600' 
                              : 'bg-gray-100 hover:bg-gray-200'
                        } transition-colors`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={activityData}
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
                      <Legend />
                      <Line type="monotone" dataKey="新增用户" stroke="#60a5fa" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="活跃用户" stroke="#34d399" />
                      <Line type="monotone" dataKey="创作数量" stroke="#f87171" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
              
              {/* 活动发布审核统计 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h2 className="text-xl font-bold mb-6">活动发布审核统计</h2>
                
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={auditStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {auditStats.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#e5e7eb',
                          borderRadius: '0.5rem',
                          color: isDark ? '#ffffff' : '#000000'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-4 space-y-2">
                  {auditStats.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span>{item.name}</span>
                      </div>
                      <span>{dataLoading ? '-' : item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
            
            {/* 快速操作 */}
            <motion.div
              className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md mb-6`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <h2 className="text-xl font-bold mb-4">快速操作</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: '发布活动', icon: 'calendar-plus', color: 'blue', action: () => setActiveTab('campaigns') },
                  { name: '审核作品', icon: 'clipboard-check', color: 'green', action: () => setActiveTab('audit') },
                  { name: '管理用户', icon: 'user-cog', color: 'purple', action: () => setActiveTab('users') },
                  { name: '查看数据', icon: 'chart-line', color: 'orange', action: () => setActiveTab('analytics') },
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={item.action}
                    className={`p-4 rounded-xl ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} transition-all hover:scale-105`}
                  >
                    <div className={`w-10 h-10 rounded-lg bg-${item.color}-100 text-${item.color}-600 flex items-center justify-center mb-2 mx-auto`}>
                      <i className={`fas fa-${item.icon} text-lg`}></i>
                    </div>
                    <span className="text-sm font-medium">{item.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* 待处理事项 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 待审核作品 */}
              <motion.div 
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">待审核作品</h2>
                  <button 
                    onClick={() => setActiveTab('audit')}
                    className="text-red-600 hover:text-red-700 text-sm transition-colors"
                  >
                    查看全部
                  </button>
                </div>
                
                <div className="space-y-4">
                  {dataLoading ? (
                    // 加载骨架屏
                    [1, 2, 3].map((i) => (
                      <div key={i} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex items-start">
                          <div className={`w-16 h-16 rounded-lg mr-4 ${isDark ? 'bg-gray-600' : 'bg-gray-200'} animate-pulse`}></div>
                          <div className="flex-1">
                            <div className={`h-4 w-1/3 rounded mb-2 ${isDark ? 'bg-gray-600' : 'bg-gray-200'} animate-pulse`}></div>
                            <div className={`h-3 w-1/2 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-200'} animate-pulse`}></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : pendingWorks.length === 0 ? (
                    // 空状态
                    <div className={`p-8 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
                      <i className="fas fa-check-circle text-4xl text-green-500 mb-3"></i>
                      <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>暂无待审核作品</p>
                    </div>
                  ) : (
                    // 真实数据
                    pendingWorks.map((submission) => (
                      <div key={submission.id} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} transition-transform hover:scale-[1.02]`}>
                        <div className="flex items-start">
                          <img 
                            src={submission.thumbnail} 
                            alt={submission.title} 
                            className="w-16 h-16 rounded-lg object-cover mr-4"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium mb-1">{submission.title}</h3>
                            <div className="flex items-center text-xs mb-2">
                              <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mr-4`}>
                                创作者：{submission.creator}
                              </span>
                              <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                提交时间：{submission.submitTime}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleReject(submission.id)}
                              className={`p-2 rounded-lg ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                              aria-label="拒绝"
                            >
                              <i className="fas fa-times text-red-500"></i>
                            </button>
                            <button 
                              onClick={() => handleApprove(submission.id)}
                              className={`p-2 rounded-lg ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                              aria-label="通过"
                            >
                              <i className="fas fa-check text-green-500"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
              
              {/* 品牌入驻申请 */}
              <motion.div 
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">品牌入驻申请</h2>
                  <button 
                    onClick={() => setActiveTab('adoption')}
                    className="text-red-600 hover:text-red-700 text-sm transition-colors"
                  >
                    查看全部
                  </button>
                </div>
                
                <div className="space-y-4">
                  {dataLoading ? (
                    // 加载骨架屏
                    [1, 2, 3].map((i) => (
                      <div key={i} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex items-start">
                          <div className={`w-16 h-16 rounded-lg mr-4 ${isDark ? 'bg-gray-600' : 'bg-gray-200'} animate-pulse`}></div>
                          <div className="flex-1">
                            <div className={`h-4 w-1/3 rounded mb-2 ${isDark ? 'bg-gray-600' : 'bg-gray-200'} animate-pulse`}></div>
                            <div className={`h-3 w-1/2 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-200'} animate-pulse`}></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : commercialApplications.length === 0 ? (
                    // 空状态
                    <div className={`p-8 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
                      <i className="fas fa-building text-4xl text-gray-400 mb-3"></i>
                      <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>暂无品牌入驻申请</p>
                    </div>
                  ) : (
                    // 真实数据
                    commercialApplications.slice(0, 5).map((app) => (
                      <div key={app.id} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} transition-transform hover:scale-[1.02]`}>
                        <div className="flex items-start">
                          <img 
                            src={app.brand_logo || 'https://via.placeholder.com/64'} 
                            alt={app.brand_name} 
                            className="w-16 h-16 rounded-lg object-cover mr-4"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium mb-1">{app.brand_name}</h3>
                            <div className="flex items-center text-xs mb-2">
                              <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mr-4`}>
                                联系人：{app.contact_name}
                              </span>
                              <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {app.contact_phone}
                              </span>
                            </div>
                            <div className="flex items-center text-xs">
                              <span className={`${
                                app.status === 'approved' 
                                  ? 'bg-green-100 text-green-600' 
                                  : app.status === 'negotiating'
                                    ? 'bg-yellow-100 text-yellow-600'
                                    : app.status === 'rejected'
                                      ? 'bg-red-100 text-red-600'
                                      : 'bg-blue-100 text-blue-600'
                              } px-2 py-0.5 rounded-full`}>
                                {app.status === 'approved' ? '已通过' : 
                                 app.status === 'negotiating' ? '洽谈中' : 
                                 app.status === 'rejected' ? '已拒绝' : '待审核'}
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={() => setActiveTab('adoption')}
                            className={`p-2 rounded-lg ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                          >
                            <i className="fas fa-arrow-right text-gray-400"></i>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>

            {/* 系统状态 */}
            <motion.div
              className={`mt-6 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h2 className="text-xl font-bold mb-4">系统状态</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm">系统运行正常</span>
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    已运行 15 天 8 小时
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">数据库连接正常</span>
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    响应时间 23ms
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm">存储空间</span>
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    已使用 67%
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm">API 调用</span>
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    今日 12,458 次
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* 审核活动发布页面 */}
        {activeTab === 'audit' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          >
            <h2 className="text-xl font-bold mb-6">审核活动发布</h2>
            
            <div className="grid grid-cols-1 gap-4">
              {pendingWorks.map((submission) => (
                <div key={submission.id} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} transition-transform hover:scale-[1.02]`}>
                  <div className="flex flex-col md:flex-row">
                    <img 
                      src={submission.thumbnail} 
                      alt={submission.title} 
                      className="w-full md:w-48 h-48 object-cover rounded-lg mb-4 md:mb-0 md:mr-6"
                    />
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg">{submission.title}</h3>
                        <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-600 text-sm">
                          待审核
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <p className="mb-2">
                          <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mr-2`}>创作者：</span>
                          {submission.creator}
                        </p>
                        <p>
                          <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mr-2`}>提交时间：</span>
                          {submission.submitTime}
                        </p>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">文化元素分析</h4>
                        <div className="flex flex-wrap gap-2">
                          {['云纹', '传统色彩', '书法元素'].map((element, index) => (
                            <span key={index} className={`px-2 py-1 rounded-full text-xs ${
                              isDark ? 'bg-gray-600' : 'bg-gray-200'
                            }`}>
                              {element}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <label className="flex items-center text-sm mb-2">
                            <input 
                              type="checkbox" 
                              className="mr-2 rounded text-red-600 focus:ring-red-500" 
                            />
                            标记为需修改
                          </label>
                          <textarea
                            placeholder="审核意见（可选）"
                            className={`w-full p-2 rounded-lg text-sm h-16 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                              isDark 
                                ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400 border' 
                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border'
                            }`}
                          ></textarea>
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-4">
                          <button 
                            onClick={() => handleReject(submission.id)}
                            className={`px-4 py-2 rounded-lg ${
                              isDark 
                                ? 'bg-gray-600 hover:bg-gray-500' 
                                : 'bg-gray-200 hover:bg-gray-300'
                            } transition-colors text-sm`}
                          >
                            拒绝
                          </button>
                          <button 
                            onClick={() => handleApprove(submission.id)}
                            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors text-sm"
                          >
                            通过
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 分页 */}
            <div className="mt-8 flex justify-center">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((page) => (
                  <button 
                    key={page}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      page === 1 
                        ? 'bg-red-600 text-white' 
                        : isDark 
                          ? 'bg-gray-700 hover:bg-gray-600' 
                          : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        
         {/* 用户管理页面 */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">用户管理</h2>
              <div className="flex space-x-2">
                <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full px-4 py-1.5`}>
                  <input
                    type="text"
                    placeholder="搜索用户..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="bg-transparent border-none outline-none w-40 text-sm"
                  />
                  <i className="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
                </div>
                <select 
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
                >
                  <option value="all">全部状态</option>
                  <option value="active">活跃</option>
                  <option value="inactive">不活跃</option>
                </select>
              </div>
            </div>
            
            {/* 用户数据概览 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { title: '总用户数', value: stats.totalUsers.toLocaleString(), icon: 'users', color: 'blue' },
                { title: '活跃用户', value: Math.round(stats.totalUsers * 0.6).toLocaleString(), icon: 'user-check', color: 'green' },
                { title: '新增用户', value: Math.round(stats.totalUsers * 0.05).toLocaleString(), icon: 'user-plus', color: 'yellow' },
                { title: '管理员', value: '3', icon: 'shield-alt', color: 'purple' },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.title}</p>
                      <h3 className="text-xl font-bold">
                        {dataLoading ? (
                          <span className={`inline-block w-12 h-6 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-200'} animate-pulse`}></span>
                        ) : (
                          stat.value
                        )}
                      </h3>
                    </div>
                    <div className={`p-2 rounded-full bg-${stat.color}-100 text-${stat.color}-600`}>
                      <i className={`fas fa-${stat.icon} text-lg`}></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 用户列表 */}
            <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <table className="min-w-full">
                <thead>
                  <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">用户名</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">邮箱</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">年龄</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">兴趣标签</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">注册时间</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">会员等级</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">会员状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">到期时间</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {usersLoading ? (
                    // 加载状态
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center">
                        <div className="flex items-center justify-center">
                          <i className="fas fa-spinner fa-spin text-xl mr-2"></i>
                          <span>加载用户数据中...</span>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    // 无数据状态
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center">
                        <div className="text-gray-400">
                          <i className="fas fa-users text-4xl mb-2"></i>
                          <p>暂无用户数据</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // 真实用户数据
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm">{user.id}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center">
                            <img 
                              src={user.avatar_url || `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=User%20avatar%20${user.username}`} 
                              alt={user.username} 
                              className="w-8 h-8 rounded-full mr-3" 
                            />
                            <span>{user.username}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{user.email}</td>
                        <td className="px-4 py-3 text-sm">{user.age || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {user.metadata?.tags && user.metadata.tags.length > 0 ? (
                              user.metadata.tags.map((tag: string, index: number) => (
                                <span key={index} className={`px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-xs">暂无标签</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${user.membership_level === 'free' ? 'bg-gray-100 text-gray-600' : user.membership_level === 'premium' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                            {user.membership_level === 'free' ? '免费会员' : user.membership_level === 'premium' ? '高级会员' : 'VIP会员'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${user.membership_status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {user.membership_status === 'active' ? '有效' : user.membership_status === 'expired' ? '已过期' : '待处理'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {user.membership_end ? new Date(user.membership_end).toLocaleDateString() : '-'}  
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex space-x-2">
                            <button className={`p-1.5 rounded ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}>
                              <i className="fas fa-eye text-blue-500"></i>
                            </button>
                            <button className={`p-1.5 rounded ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}>
                              <i className="fas fa-edit text-green-500"></i>
                            </button>
                            <button className={`p-1.5 rounded ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}>
                              <i className="fas fa-trash text-red-500"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* 分页 */}
            <div className="mt-8 flex justify-center items-center gap-4">
              <div className="flex space-x-1">
                <button
                  onClick={() => setUserPage(Math.max(1, userPage - 1))}
                  disabled={userPage === 1}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    userPage === 1 
                      ? 'opacity-50 cursor-not-allowed' 
                      : isDark 
                        ? 'bg-gray-700 hover:bg-gray-600' 
                        : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                
                {Array.from({ length: Math.min(5, Math.ceil(userTotal / 10)) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button 
                      key={pageNum}
                      onClick={() => setUserPage(pageNum)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        pageNum === userPage 
                          ? 'bg-red-600 text-white' 
                          : isDark 
                            ? 'bg-gray-700 hover:bg-gray-600' 
                            : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setUserPage(Math.min(Math.ceil(userTotal / 10), userPage + 1))}
                  disabled={userPage >= Math.ceil(userTotal / 10)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    userPage >= Math.ceil(userTotal / 10)
                      ? 'opacity-50 cursor-not-allowed' 
                      : isDark 
                        ? 'bg-gray-700 hover:bg-gray-600' 
                        : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                共 {userTotal} 条记录
              </span>
            </div>
          </motion.div>
        )}
        
        {/* 数据分析页面 */}
        {activeTab === 'analytics' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <DataAnalytics />
          </Suspense>
        )}
        
        {/* 品牌入驻页面 */}
        {activeTab === 'adoption' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <StrategicAdoption />
          </Suspense>
        )}
        
        {/* 系统设置页面 */}
        {activeTab === 'settings' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <Settings />
          </Suspense>
        )}

        {/* 订单管理页面 */}
        {activeTab === 'orders' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <OrderManagement />
          </Suspense>
        )}

        {/* 权限管理页面 */}
        {activeTab === 'permissions' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <PermissionManagement />
          </Suspense>
        )}

        {/* 反馈管理页面 */}
        {activeTab === 'feedback' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <FeedbackManagement />
          </Suspense>
        )}

        {/* 内容审核管理页面 */}
        {activeTab === 'contentAudit' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <ContentAudit />
          </Suspense>
        )}

        {/* 审计日志页面 */}
        {activeTab === 'auditLog' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <AuditLog />
          </Suspense>
        )}

        {/* 用户行为审计页面 */}
        {activeTab === 'userAudit' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <UserAudit />
          </Suspense>
        )}

        {/* 活动审核管理页面 */}
        {activeTab === 'eventAudit' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <EventAudit />
          </Suspense>
        )}

        {/* 商品管理页面 */}
        {activeTab === 'productManagement' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <ProductManagement />
          </Suspense>
        )}

        {/* 消息通知管理页面 */}
        {activeTab === 'notificationManagement' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <NotificationManagement />
          </Suspense>
        )}

        {/* 系统监控页面 */}
        {activeTab === 'systemMonitor' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <SystemMonitor />
          </Suspense>
        )}

        {/* 社群管理页面 */}
        {activeTab === 'communities' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <CommunityManagement />
          </Suspense>
        )}

        {/* 内容管理页面 */}
        {activeTab === 'contentManagement' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <ContentManagement />
          </Suspense>
        )}

        {/* 活动管理页面（合并审核活动发布） */}
        {activeTab === 'campaigns' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">活动管理</h2>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
                <i className="fas fa-plus mr-2"></i>
                创建活动
              </button>
            </div>

            {/* 标签切换：活动审核 / 活动列表 */}
            <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
              {[
                { id: 'pending', label: `活动审核 (${pendingWorks.length})` },
                { id: 'list', label: '活动列表' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setEventActiveTab(tab.id as 'pending' | 'list')}
                  className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
                    eventActiveTab === tab.id
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {eventActiveTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* 活动审核标签页 */}
            {eventActiveTab === 'pending' && (
              <div className="space-y-4">
                <h3 className="font-medium mb-4">待审核活动</h3>
                {pendingWorks.length === 0 ? (
                  <div className={`p-8 text-center rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <i className="fas fa-check-circle text-4xl text-green-500 mb-3"></i>
                    <p className="text-gray-500">暂无待审核的活动</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {pendingWorks.map((submission) => (
                      <div key={submission.id} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} transition-transform hover:scale-[1.02]`}>
                        <div className="flex flex-col md:flex-row">
                          <img 
                            src={submission.thumbnail} 
                            alt={submission.title} 
                            className="w-full md:w-48 h-32 object-cover rounded-lg mb-4 md:mb-0 md:mr-4"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium">{submission.title}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                submission.status === 'pending' 
                                  ? 'bg-yellow-100 text-yellow-600' 
                                  : 'bg-green-100 text-green-600'
                              }`}>
                                {submission.status === 'pending' ? '待审核' : '已通过'}
                              </span>
                            </div>
                            <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {submission.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span><i className="fas fa-user mr-1"></i>{submission.creator}</span>
                                <span><i className="fas fa-calendar mr-1"></i>{submission.date}</span>
                              </div>
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => handleAudit(submission.id, 'approved')}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                                >
                                  通过
                                </button>
                                <button 
                                  onClick={() => handleAudit(submission.id, 'rejected')}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                                >
                                  拒绝
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 活动列表标签页 */}
            {eventActiveTab === 'list' && (
              <>
                {/* 活动数据概览 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  {[
                    { title: '已发布', value: events.filter((e: any) => e.status === 'published').length.toString(), icon: 'activity', color: 'blue' },
                    { title: '总活动数', value: events.length.toString(), icon: 'calendar-alt', color: 'green' },
                    { title: '待审核', value: events.filter((e: any) => e.status === 'pending').length.toString(), icon: 'clock', color: 'yellow' },
                    { title: '草稿', value: events.filter((e: any) => e.status === 'draft').length.toString(), icon: 'file-alt', color: 'gray' },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.title}</p>
                          <h3 className="text-xl font-bold">{stat.value}</h3>
                        </div>
                        <div className={`p-2 rounded-full bg-${stat.color}-100 text-${stat.color}-600`}>
                          <i className={`fas fa-${stat.icon} text-lg`}></i>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 活动列表 */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">活动列表</h3>
                    <div className="flex space-x-2">
                      <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full px-4 py-1.5`}>
                        <input
                          type="text"
                          placeholder="搜索活动..."
                          value={eventSearch}
                          onChange={(e) => setEventSearch(e.target.value)}
                          className="bg-transparent border-none outline-none w-40 text-sm"
                        />
                        <i className="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
                      </div>
                      <select
                        value={eventStatusFilter}
                        onChange={(e) => setEventStatusFilter(e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
                        } border`}
                      >
                        <option value="all">全部状态</option>
                        <option value="published">已发布</option>
                        <option value="pending">待审核</option>
                        <option value="draft">草稿</option>
                        <option value="rejected">已拒绝</option>
                      </select>
                    </div>
                  </div>

                  <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <table className="min-w-full">
                      <thead>
                        <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <th className="px-4 py-3 text-left text-sm font-medium">活动名称</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">开始日期</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">结束日期</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">参与人数</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">提交作品</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {eventsLoading ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-10 text-center">
                              <div className="flex items-center justify-center">
                                <i className="fas fa-spinner fa-spin text-xl mr-2"></i>
                                <span>加载活动数据中...</span>
                              </div>
                            </td>
                          </tr>
                        ) : events.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-10 text-center">
                              <div className="text-gray-400">
                                <i className="fas fa-calendar text-4xl mb-2"></i>
                                <p>暂无活动数据</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          events
                            .filter((campaign: any) =>
                              eventSearch === '' || campaign.name?.toLowerCase().includes(eventSearch.toLowerCase())
                            )
                            .map((campaign: any) => (
                              <tr key={campaign.id} className="hover:bg-gray-700/50">
                                <td className="px-4 py-3 text-sm">{campaign.name || campaign.title || '未命名活动'}</td>
                                <td className="px-4 py-3 text-sm">{campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : '-'}</td>
                                <td className="px-4 py-3 text-sm">{campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : '-'}</td>
                                <td className="px-4 py-3 text-sm">{campaign.participants_count || 0}</td>
                                <td className="px-4 py-3 text-sm">{campaign.submissions_count || 0}</td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    campaign.status === 'published'
                                      ? 'bg-green-100 text-green-600'
                                      : campaign.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-600'
                                        : campaign.status === 'draft'
                                          ? 'bg-gray-100 text-gray-600'
                                          : 'bg-red-100 text-red-600'
                                  }`}>
                                    {campaign.status === 'published' ? '已发布' :
                                     campaign.status === 'pending' ? '待审核' :
                                     campaign.status === 'draft' ? '草稿' : '已拒绝'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <div className="flex space-x-2">
                                    <button className={`p-1.5 rounded ${
                                      isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                                    }`}>
                                      <i className="fas fa-eye text-blue-500"></i>
                                    </button>
                                    <button className={`p-1.5 rounded ${
                                      isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                                    }`}>
                                      <i className="fas fa-edit text-green-500"></i>
                                    </button>
                                    <button className={`p-1.5 rounded ${
                                      isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                                    }`}>
                                      <i className="fas fa-chart-bar text-purple-500"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
        
        {/* 创作者管理页面 */}
        {activeTab === 'creators' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">创作者管理</h2>
              <div className="flex space-x-2">
                <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full px-4 py-1.5`}>
                  <input
                    type="text"
                    placeholder="搜索创作者..."
                    value={creatorSearch}
                    onChange={(e) => setCreatorSearch(e.target.value)}
                    className="bg-transparent border-none outline-none w-40 text-sm"
                  />
                  <i className="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
                </div>
                <select 
                  value={creatorLevelFilter}
                  onChange={(e) => setCreatorLevelFilter(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
                  } border`}
                >
                  <option value="all">全部等级</option>
                  <option value="beginner">新锐创作者</option>
                  <option value="advanced">资深创作者</option>
                  <option value="master">大师级创作者</option>
                </select>
              </div>
            </div>
            
            {/* 创作者等级分布 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { title: '新锐创作者', value: creators.filter((c: any) => c.level === 'beginner').length.toString(), icon: 'star', color: 'blue' },
                { title: '资深创作者', value: creators.filter((c: any) => c.level === 'advanced').length.toString(), icon: 'award', color: 'purple' },
                { title: '大师级创作者', value: creators.filter((c: any) => c.level === 'master').length.toString(), icon: 'trophy', color: 'yellow' },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.title}</p>
                      <h3 className="text-xl font-bold">{stat.value}</h3>
                    </div>
                    <div className={`p-2 rounded-full bg-${stat.color}-100 text-${stat.color}-600`}>
                      <i className={`fas fa-${stat.icon} text-lg`}></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 创作者列表 */}
            <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
              <table className="min-w-full">
                <thead>
                  <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <th className="px-4 py-3 text-left text-sm font-medium">创作者</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">等级</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">作品数</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">获赞数</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">采纳数</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {creatorsLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center">
                        <div className="flex items-center justify-center">
                          <i className="fas fa-spinner fa-spin text-xl mr-2"></i>
                          <span>加载创作者数据中...</span>
                        </div>
                      </td>
                    </tr>
                  ) : creators.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center">
                        <div className="text-gray-400">
                          <i className="fas fa-users text-4xl mb-2"></i>
                          <p>暂无创作者数据</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    creators
                      .filter((creator: any) => 
                        creatorSearch === '' || creator.username?.toLowerCase().includes(creatorSearch.toLowerCase())
                      )
                      .map((creator: any) => (
                        <tr key={creator.id} className="hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center">
                              <img 
                                src={creator.avatar_url || `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=User%20avatar%20${creator.username}`} 
                                alt={creator.username} 
                                className="w-8 h-8 rounded-full mr-3"
                              />
                              <span>{creator.username}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              creator.level === 'master' 
                                ? 'bg-yellow-100 text-yellow-600' 
                                : creator.level === 'advanced'
                                  ? 'bg-purple-100 text-purple-600'
                                  : 'bg-blue-100 text-blue-600'
                            }`}>
                              {creator.level === 'master' ? '大师级创作者' : 
                               creator.level === 'advanced' ? '资深创作者' : '新锐创作者'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{creator.works}</td>
                          <td className="px-4 py-3 text-sm">{creator.likes}</td>
                          <td className="px-4 py-3 text-sm">{creator.adopted}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              creator.status === 'active' 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {creator.status === 'active' ? '活跃' : '不活跃'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => {
                                  setSelectedCreator(creator);
                                  setCreatorModalMode('view');
                                  setShowCreatorModal(true);
                                }}
                                className={`p-1.5 rounded ${
                                  isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                                title="查看详情"
                              >
                                <i className="fas fa-eye text-blue-500"></i>
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedCreator(creator);
                                  setCreatorModalMode('edit');
                                  setShowCreatorModal(true);
                                }}
                                className={`p-1.5 rounded ${
                                  isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                                title="编辑"
                              >
                                <i className="fas fa-edit text-green-500"></i>
                              </button>
                              <button 
                                onClick={() => {
                                  toast.success(`已为 ${creator.username} 颁发荣誉徽章`);
                                }}
                                className={`p-1.5 rounded ${
                                  isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                                title="颁发荣誉"
                              >
                                <i className="fas fa-trophy text-yellow-500"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* 创作者激励管理 */}
            <div>
              <h3 className="font-medium mb-4">激励体系管理</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h4 className="font-medium mb-3">等级设置</h4>
                  <div className="space-y-4">
                    {[
                      { name: '新锐创作者', threshold: '0积分', benefits: ['基础素材库', '社区互动权限'] },
                      { name: '资深创作者', threshold: '1500积分', benefits: ['高级素材库', '优先审核权', '专属客服'] },{ name: '大师级创作者', threshold: '5000积分', benefits: ['独家AI模型', '线下活动邀请', '品牌对接优先'] },
                    ].map((level, index) => (
                      <div key={index} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{level.name}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isDark ? 'bg-gray-600' : 'bg-gray-200'
                          }`}>
                            {level.threshold}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {level.benefits.map((benefit, i) => (
                            <span key={i} className={`text-xs px-2 py-1 rounded-full ${
                              isDark ? 'bg-gray-600' : 'bg-gray-200'
                            }`}>
                              {benefit}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h4 className="font-medium mb-3">任务与奖励</h4>
                  <div className="space-y-3">
                    {[
                      { name: '完成首篇创作', reward: '100积分 + 素材包' },
                      { name: '连续登录7天', reward: '50积分' },
                      { name: '作品获赞100次', reward: '200积分' },
                      { name: '作品被采纳', reward: '500积分 + 分成资格' },
                    ].map((task, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span>{task.name}</span>
                        <span className={`text-sm px-3 py-1 rounded-full ${
                          isDark ? 'bg-gray-700' : 'bg-gray-100'
                        }`}>
                          {task.reward}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm transition-colors">
                    添加新任务
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 创作者详情/编辑弹窗 */}
        {showCreatorModal && selectedCreator && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
            >
              {/* 弹窗头部 */}
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <h3 className="text-xl font-bold">
                  {creatorModalMode === 'view' ? '创作者详情' : '编辑创作者'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreatorModal(false);
                    setSelectedCreator(null);
                  }}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              {/* 弹窗内容 */}
              <div className="p-6 space-y-6">
                {/* 基本信息 */}
                <div className="flex items-center gap-4">
                  <img
                    src={selectedCreator.avatar_url || `https://via.placeholder.com/100`}
                    alt={selectedCreator.username}
                    className="w-20 h-20 rounded-full object-cover border-2 border-red-500"
                  />
                  <div>
                    <h4 className="text-lg font-semibold">{selectedCreator.username}</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      ID: {selectedCreator.id}
                    </p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${
                      selectedCreator.level === 'master'
                        ? 'bg-yellow-100 text-yellow-600'
                        : selectedCreator.level === 'advanced'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-blue-100 text-blue-600'
                    }`}>
                      {selectedCreator.level === 'master' ? '大师级创作者' :
                       selectedCreator.level === 'advanced' ? '资深创作者' : '新锐创作者'}
                    </span>
                  </div>
                </div>

                {/* 统计数据 */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: '作品数', value: selectedCreator.works || 0, icon: 'image' },
                    { label: '获赞数', value: selectedCreator.likes || 0, icon: 'heart' },
                    { label: '采纳数', value: selectedCreator.adopted || 0, icon: 'check-circle' },
                    { label: '积分', value: selectedCreator.points || 0, icon: 'star' },
                  ].map((stat, index) => (
                    <div key={index} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
                      <i className={`fas fa-${stat.icon} text-2xl mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* 编辑表单（仅在编辑模式下显示） */}
                {creatorModalMode === 'edit' && (
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        创作者等级
                      </label>
                      <select
                        value={selectedCreator.level}
                        onChange={(e) => setSelectedCreator({ ...selectedCreator, level: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="beginner">新锐创作者</option>
                        <option value="advanced">资深创作者</option>
                        <option value="master">大师级创作者</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        状态
                      </label>
                      <select
                        value={selectedCreator.status}
                        onChange={(e) => setSelectedCreator({ ...selectedCreator, status: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="active">活跃</option>
                        <option value="inactive">不活跃</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        积分
                      </label>
                      <input
                        type="number"
                        value={selectedCreator.points || 0}
                        onChange={(e) => setSelectedCreator({ ...selectedCreator, points: parseInt(e.target.value) })}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        备注
                      </label>
                      <textarea
                        rows={3}
                        placeholder="添加管理员备注..."
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* 最近活动（仅在查看模式下显示） */}
                {creatorModalMode === 'view' && (
                  <div>
                    <h5 className="font-medium mb-3">最近活动</h5>
                    <div className={`space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                        <i className="fas fa-upload text-blue-500"></i>
                        <span className="flex-1">发布了新作品《创意海报设计》</span>
                        <span className="text-xs">2小时前</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                        <i className="fas fa-heart text-red-500"></i>
                        <span className="flex-1">作品获得 50 个赞</span>
                        <span className="text-xs">5小时前</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                        <i className="fas fa-check-circle text-green-500"></i>
                        <span className="flex-1">作品被品牌方采纳</span>
                        <span className="text-xs">1天前</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 弹窗底部按钮 */}
              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3`}>
                <button
                  onClick={() => {
                    setShowCreatorModal(false);
                    setSelectedCreator(null);
                  }}
                  className={`px-4 py-2 rounded-lg ${
                    isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  关闭
                </button>
                {creatorModalMode === 'edit' && (
                  <button
                    onClick={() => {
                      toast.success(`已保存 ${selectedCreator.username} 的修改`);
                      setShowCreatorModal(false);
                      setSelectedCreator(null);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                  >
                    保存修改
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
