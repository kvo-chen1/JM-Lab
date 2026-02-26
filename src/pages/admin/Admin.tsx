import { useState, useContext, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'sonner';
import { adminService, type DashboardStats, type ActivityData, type AuditStats, type PendingWork } from '@/services/adminService';
import { brandPartnershipService } from '@/services/brandPartnershipService';
import achievementService from '@/services/achievementService';
import { supabaseAdmin } from '@/lib/supabaseClient';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useNavNotifications, type NavItemType } from '@/hooks/useNavNotifications';

// 懒加载数据分析页面
const DataAnalytics = lazy(() => import('./DataAnalytics'));
const StrategicAdoption = lazy(() => import('./StrategicAdoption'));
const Settings = lazy(() => import('./Settings'));

const PermissionManagement = lazy(() => import('./PermissionManagement'));
const FeedbackManagement = lazy(() => import('./FeedbackManagement'));

// 懒加载增强的审核管理模块
const ContentAudit = lazy(() => import('./ContentAudit'));
const AuditLog = lazy(() => import('./AuditLog'));
const UserAudit = lazy(() => import('./UserAudit'));
const EventManagement = lazy(() => import('./EventManagement'));
const ProductManagement = lazy(() => import('./ProductManagement'));
const PaymentAudit = lazy(() => import('./PaymentAudit'));
const NotificationManagement = lazy(() => import('./NotificationManagement'));
const SystemMonitor = lazy(() => import('./SystemMonitor'));

// 新增管理模块
const JinmaiCommunityManagement = lazy(() => import('./JinmaiCommunityManagement'));
const KnowledgeBaseManagement = lazy(() => import('./KnowledgeBaseManagement'));
const TemplateManagement = lazy(() => import('./TemplateManagement'));
const AchievementManagement = lazy(() => import('./AchievementManagement'));
const AIFeedbackManagement = lazy(() => import('./AIFeedbackManagement'));
const ReportManagement = lazy(() => import('./ReportManagement'));
const BrandTaskAudit = lazy(() => import('./BrandTaskAudit'));

const COLORS = ['#f59e0b', '#34d399', '#f87171'];

type TabType = 'dashboard' | 'audit' | 'analytics' | 'adoption' | 'users' | 'settings' | 'campaigns' | 'creators' | 'brandPartnerships' | 'permissions' | 'feedback' | 'contentAudit' | 'auditLog' | 'userAudit' | 'productManagement' | 'paymentAudit' | 'notificationManagement' | 'systemMonitor' | 'jinmaiCommunity' | 'knowledgeBase' | 'templates' | 'achievements' | 'aiFeedback' | 'reportManagement' | 'brandTaskAudit';

// 安全的 localStorage 操作
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // 忽略错误
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // 忽略错误
    }
  },
};

export default function Admin() {
  const { isDark } = useTheme();
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // 从 localStorage 恢复标签页状态
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const savedTab = safeLocalStorage.getItem('admin_active_tab');
    return (savedTab as TabType) || 'dashboard';
  });

  // 侧边栏收缩状态
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = safeLocalStorage.getItem('admin_sidebar_collapsed');
    return saved === 'true';
  });

  // 使用导航通知 hook
  const {
    notifications,
    markAsViewed,
    markAllAsViewed,
    refreshNotifications,
    isLoading: notificationsLoading,
    totalUnreadCount,
  } = useNavNotifications();

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

  // 用户管理页面统计数据
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    admins: 3,
  });
  const [userStatsLoading, setUserStatsLoading] = useState(false);

  // 用户管理弹窗状态
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalMode, setUserModalMode] = useState<'view' | 'edit'>('view');

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

  // 密码验证状态 - 从 sessionStorage 恢复（会话级别）
  const [isPasswordVerified, setIsPasswordVerified] = useState(() => {
    const verified = sessionStorage.getItem('admin_password_verified');
    return verified === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const ADMIN_PASSWORD = 'jm2026';

  // 页面加载完成后关闭 loading
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, []);

  // 保存标签页状态到 localStorage
  useEffect(() => {
    safeLocalStorage.setItem('admin_active_tab', activeTab);
  }, [activeTab]);

  // 保存侧边栏收缩状态到 localStorage
  useEffect(() => {
    safeLocalStorage.setItem('admin_sidebar_collapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  // 保存密码验证状态到 sessionStorage
  useEffect(() => {
    sessionStorage.setItem('admin_password_verified', isPasswordVerified.toString());
  }, [isPasswordVerified]);

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
    setUserStatsLoading(true);
    try {
      // 并行获取用户列表和统计数据
      const [result, statsResult] = await Promise.all([
        adminService.getUsers({
          page: userPage,
          limit: 10,
          status: userStatusFilter,
          search: userSearch,
        }),
        adminService.getUserStats(),
      ]);
      
      setUsers(result.users);
      setUserTotal(result.total);
      setUserStats(statsResult);
    } catch (error) {
      console.error('获取用户数据失败:', error);
      toast.error('获取用户数据失败');
    } finally {
      setUsersLoading(false);
      setUserStatsLoading(false);
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
          <div className={`h-screen ${isDark ? 'bg-gray-800' : 'bg-white'} fixed transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
            <div className="p-6">
              <div className={`h-8 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse mb-8 ${isSidebarCollapsed ? 'w-8 mx-auto' : 'w-32'}`}></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className={`h-10 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse ${isSidebarCollapsed ? 'w-10 mx-auto' : 'w-full'}`}></div>
                ))}
              </div>
            </div>
          </div>

          {/* 主内容骨架屏 */}
          <div className={`flex-1 p-8 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
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
  
  const handleTabChange = (tabId: string) => {
    // 如果切换到有通知的页面，标记为已查看
    if (notifications[tabId as NavItemType]?.count > 0) {
      markAsViewed(tabId as NavItemType);
    }
    setActiveTab(tabId as TabType);
  };

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* 侧边栏 - 使用新的 AdminSidebar 组件 */}
      <AdminSidebar
        isDark={isDark}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        user={user}
        onLogout={handleLogout}
        notifications={notifications}
        onMarkAsViewed={markAsViewed}
        totalUnreadCount={totalUnreadCount}
        isCollapsed={isSidebarCollapsed}
        onCollapse={setIsSidebarCollapsed}
      />

      {/* 主内容区 */}
      <main className={`flex-1 p-8 h-screen overflow-y-auto transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
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
                { title: '总用户数', value: userStats.totalUsers.toLocaleString(), icon: 'users', color: 'blue' },
                { title: '活跃用户', value: userStats.activeUsers.toLocaleString(), icon: 'user-check', color: 'green' },
                { title: '新增用户', value: userStats.newUsers.toLocaleString(), icon: 'user-plus', color: 'yellow' },
                { title: '管理员', value: userStats.admins.toLocaleString(), icon: 'shield-alt', color: 'purple' },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.title}</p>
                      <h3 className="text-xl font-bold">
                        {userStatsLoading ? (
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
                            <button 
                              onClick={() => {
                                setSelectedUser(user);
                                setUserModalMode('view');
                                setShowUserModal(true);
                              }}
                              className={`p-1.5 rounded ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}
                              title="查看详情"
                            >
                              <i className="fas fa-eye text-blue-500"></i>
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedUser(user);
                                setUserModalMode('edit');
                                setShowUserModal(true);
                              }}
                              className={`p-1.5 rounded ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}
                              title="编辑用户"
                            >
                              <i className="fas fa-edit text-green-500"></i>
                            </button>
                            <button 
                              onClick={async () => {
                                if (confirm(`确定要删除用户 "${user.username}" 吗？此操作不可恢复！`)) {
                                  const success = await adminService.deleteUser(user.id);
                                  if (success) {
                                    toast.success('用户已删除');
                                    fetchUsers();
                                  } else {
                                    toast.error('删除失败，请重试');
                                  }
                                }
                              }}
                              className={`p-1.5 rounded ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}
                              title="删除用户"
                            >
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

        {/* 用户详情/编辑弹窗 */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
            >
              {/* 弹窗头部 */}
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <h3 className="text-xl font-bold">
                  {userModalMode === 'view' ? '用户详情' : '编辑用户'}
                </h3>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
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
                    src={selectedUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`}
                    alt={selectedUser.username}
                    className="w-20 h-20 rounded-full object-cover border-2 border-red-500"
                  />
                  <div>
                    <h4 className="text-lg font-semibold">{selectedUser.username}</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      ID: {selectedUser.id}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      注册时间: {new Date(selectedUser.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* 统计数据 */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: '作品数', value: selectedUser.works_count || 0, icon: 'image' },
                    { label: '获赞数', value: selectedUser.total_likes || 0, icon: 'heart' },
                    { label: '会员等级', value: selectedUser.membership_level === 'free' ? '免费' : selectedUser.membership_level === 'premium' ? '高级' : 'VIP', icon: 'star' },
                    { label: '会员状态', value: selectedUser.membership_status === 'active' ? '有效' : '已过期', icon: 'check-circle' },
                  ].map((stat, index) => (
                    <div key={index} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
                      <i className={`fas fa-${stat.icon} text-2xl mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* 编辑表单（仅在编辑模式下显示） */}
                {userModalMode === 'edit' && (
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        用户名
                      </label>
                      <input
                        type="text"
                        value={selectedUser.username}
                        onChange={(e) => setSelectedUser({ ...selectedUser, username: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        邮箱
                      </label>
                      <input
                        type="email"
                        value={selectedUser.email || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        会员等级
                      </label>
                      <select
                        value={selectedUser.membership_level || 'free'}
                        onChange={(e) => setSelectedUser({ ...selectedUser, membership_level: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="free">免费会员</option>
                        <option value="premium">高级会员</option>
                        <option value="vip">VIP会员</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        会员状态
                      </label>
                      <select
                        value={selectedUser.membership_status || 'active'}
                        onChange={(e) => setSelectedUser({ ...selectedUser, membership_status: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="active">有效</option>
                        <option value="expired">已过期</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        用户状态
                      </label>
                      <select
                        value={selectedUser.status || 'active'}
                        onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="active">正常</option>
                        <option value="inactive">不活跃</option>
                        <option value="banned">禁用</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 查看模式详细信息 */}
                {userModalMode === 'view' && (
                  <div className="space-y-3">
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>邮箱</p>
                      <p className="font-medium">{selectedUser.email || '未设置'}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>年龄</p>
                      <p className="font-medium">{selectedUser.age || '未设置'}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>兴趣标签</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedUser.metadata?.tags && selectedUser.metadata.tags.length > 0 ? (
                          selectedUser.metadata.tags.map((tag: string, index: number) => (
                            <span key={index} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">暂无标签</span>
                        )}
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>会员到期时间</p>
                      <p className="font-medium">{selectedUser.membership_end ? new Date(selectedUser.membership_end).toLocaleDateString() : '永久有效'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 弹窗底部按钮 */}
              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3`}>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                  }}
                  className={`px-4 py-2 rounded-lg ${
                    isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  关闭
                </button>
                {userModalMode === 'edit' && (
                  <button
                    onClick={async () => {
                      try {
                        // 1. 更新用户基本信息
                        const { error: userError } = await supabaseAdmin
                          .from('users')
                          .update({
                            username: selectedUser.username,
                            email: selectedUser.email,
                            status: selectedUser.status,
                            updated_at: new Date().toISOString(),
                          })
                          .eq('id', selectedUser.id);

                        if (userError) throw userError;

                        // 2. 如果会员等级或状态发生变化，在 membership_orders 表中创建记录
                        if (selectedUser.membership_level !== 'free') {
                          // 计算过期时间（默认从现在起1年）
                          const expiresAt = new Date();
                          expiresAt.setFullYear(expiresAt.getFullYear() + 1);

                          const planNames: Record<string, string> = {
                            'premium': '高级会员',
                            'vip': 'VIP会员',
                          };

                          const { error: orderError } = await supabaseAdmin
                            .from('membership_orders')
                            .insert({
                              id: `admin_${Date.now()}_${selectedUser.id}`,
                              user_id: selectedUser.id,
                              plan: selectedUser.membership_level,
                              plan_name: planNames[selectedUser.membership_level] || selectedUser.membership_level,
                              period: 'yearly',
                              amount: selectedUser.membership_level === 'premium' ? 899 : 1799,
                              status: 'completed',
                              paid_at: new Date().toISOString(),
                              expires_at: expiresAt.toISOString(),
                            });

                          if (orderError) {
                            console.warn('创建会员订单失败:', orderError);
                          }
                        }

                        toast.success('用户信息已更新');
                        setShowUserModal(false);
                        setSelectedUser(null);
                        fetchUsers();
                      } catch (error) {
                        console.error('更新用户失败:', error);
                        toast.error('更新失败，请重试');
                      }
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

        {/* 支付审核页面 */}
        {activeTab === 'paymentAudit' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <PaymentAudit />
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

        {/* 津脉社区管理页面 */}
        {activeTab === 'jinmaiCommunity' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <JinmaiCommunityManagement />
          </Suspense>
        )}

        {/* 知识库管理页面 */}
        {activeTab === 'knowledgeBase' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <KnowledgeBaseManagement />
          </Suspense>
        )}

        {/* 作品模板管理页面 */}
        {activeTab === 'templates' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <TemplateManagement />
          </Suspense>
        )}

        {/* 成就管理页面 */}
        {activeTab === 'achievements' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <AchievementManagement />
          </Suspense>
        )}

        {/* AI反馈管理页面 */}
        {activeTab === 'aiFeedback' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <AIFeedbackManagement />
          </Suspense>
        )}

        {/* 举报管理页面 */}
        {activeTab === 'reportManagement' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <ReportManagement />
          </Suspense>
        )}

        {/* 品牌任务审核页面 */}
        {activeTab === 'brandTaskAudit' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <BrandTaskAudit />
          </Suspense>
        )}

        {/* 活动管理页面 */}
        {activeTab === 'campaigns' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full"
              />
            </div>
          }>
            <EventManagement />
          </Suspense>
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
                  <option value="1">创作新手</option>
                  <option value="2">创作爱好者</option>
                  <option value="3">创作达人</option>
                  <option value="4">创作精英</option>
                  <option value="5">创作大师</option>
                  <option value="6">创作宗师</option>
                  <option value="7">创作传奇</option>
                </select>
              </div>
            </div>
            
            {/* 创作者等级分布 */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
              {(() => {
                const levels = achievementService.getAllCreatorLevels();
                const levelColors = [
                  'gray', 'green', 'blue', 'purple', 'orange', 'red', 'yellow'
                ];
                return levels.map((level, index) => {
                  const count = creators.filter((c: any) => c.level === level.level || c.level === level.level.toString()).length;
                  return (
                    <div
                      key={level.level}
                      className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{level.icon} {level.name}</p>
                          <h3 className="text-xl font-bold">{count}</h3>
                        </div>
                        <div className={`p-2 rounded-full bg-${levelColors[index]}-100 text-${levelColors[index]}-600`}>
                          <span className="text-lg">{level.level}</span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
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
                            {(() => {
                              const levelNum = typeof creator.level === 'string' ? parseInt(creator.level) : creator.level;
                              const levelInfo = achievementService.getCreatorLevelByLevel(levelNum || 1);
                              const levelColors: Record<number, string> = {
                                1: 'bg-gray-100 text-gray-600',
                                2: 'bg-green-100 text-green-600',
                                3: 'bg-blue-100 text-blue-600',
                                4: 'bg-purple-100 text-purple-600',
                                5: 'bg-orange-100 text-orange-600',
                                6: 'bg-red-100 text-red-600',
                                7: 'bg-yellow-100 text-yellow-600',
                              };
                              return (
                                <span className={`px-2 py-1 rounded-full text-xs ${levelColors[levelNum || 1]}`}>
                                  {levelInfo?.icon} {levelInfo?.name || '创作新手'}
                                </span>
                              );
                            })()}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h4 className="font-medium mb-3">等级设置（7级成就体系）</h4>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {achievementService.getAllCreatorLevels().map((level) => (
                      <div key={level.level} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{level.icon}</span>
                            <span className="font-medium">{level.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              level.level <= 2 ? 'bg-gray-200 text-gray-600' :
                              level.level <= 4 ? 'bg-blue-100 text-blue-600' :
                              level.level <= 6 ? 'bg-purple-100 text-purple-600' :
                              'bg-yellow-100 text-yellow-600'
                            }`}>
                              LV.{level.level}
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isDark ? 'bg-gray-600' : 'bg-gray-200'
                          }`}>
                            {level.requiredPoints}积分
                          </span>
                        </div>
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {level.description}
                        </p>
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
                  <h4 className="font-medium mb-3">成就任务与奖励</h4>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {[
                      { name: '初次创作', desc: '完成第一篇作品', reward: '10积分', icon: 'star', rarity: 'common' },
                      { name: '活跃创作者', desc: '连续7天登录', reward: '20积分', icon: 'fire', rarity: 'common' },
                      { name: '人气王', desc: '获得100个点赞', reward: '50积分', icon: 'thumbs-up', rarity: 'rare' },
                      { name: '作品达人', desc: '发布10篇作品', reward: '80积分', icon: 'image', rarity: 'rare' },
                      { name: '文化传播者', desc: '使用5种不同文化元素', reward: '40积分', icon: 'book', rarity: 'rare' },
                      { name: '商业成功', desc: '作品被品牌采纳', reward: '200积分', icon: 'handshake', rarity: 'epic' },
                      { name: '传统文化大师', desc: '完成10个文化知识问答', reward: '300积分', icon: 'graduation-cap', rarity: 'legendary' },
                    ].map((task, index) => {
                      const rarityColors: Record<string, string> = {
                        common: isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600',
                        rare: isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-600',
                        epic: isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-600',
                        legendary: isDark ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-600',
                      };
                      return (
                        <div key={index} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <i className={`fas fa-${task.icon} ${
                                task.rarity === 'legendary' ? 'text-yellow-500' :
                                task.rarity === 'epic' ? 'text-purple-500' :
                                task.rarity === 'rare' ? 'text-blue-500' : 'text-gray-400'
                              }`}></i>
                              <div>
                                <span className="font-medium text-sm">{task.name}</span>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{task.desc}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${rarityColors[task.rarity]}`}>
                                {task.rarity === 'common' ? '普通' :
                                 task.rarity === 'rare' ? '稀有' :
                                 task.rarity === 'epic' ? '史诗' : '传说'}
                              </span>
                              <span className={`text-sm px-3 py-1 rounded-full ${
                                isDark ? 'bg-gray-600' : 'bg-gray-200'
                              }`}>
                                {task.reward}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setActiveTab('achievements')}
                    className="mt-4 w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm transition-colors"
                  >
                    管理成就任务
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 创作者详情/编辑弹窗 */}
        {showCreatorModal && selectedCreator && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
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
                    {(() => {
                      const levelNum = typeof selectedCreator.level === 'string' ? parseInt(selectedCreator.level) : selectedCreator.level;
                      const levelInfo = achievementService.getCreatorLevelByLevel(levelNum || 1);
                      const levelColors: Record<number, string> = {
                        1: 'bg-gray-100 text-gray-600',
                        2: 'bg-green-100 text-green-600',
                        3: 'bg-blue-100 text-blue-600',
                        4: 'bg-purple-100 text-purple-600',
                        5: 'bg-orange-100 text-orange-600',
                        6: 'bg-red-100 text-red-600',
                        7: 'bg-yellow-100 text-yellow-600',
                      };
                      return (
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${levelColors[levelNum || 1]}`}>
                          {levelInfo?.icon} {levelInfo?.name || '创作新手'}
                        </span>
                      );
                    })()}
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
