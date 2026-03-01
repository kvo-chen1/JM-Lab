import React, { useState, useContext, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import {
  LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
  BarChart, Bar, AreaChart, Area, ComposedChart
} from 'recharts';
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
const LotteryManagement = lazy(() => import('./LotteryManagement'));
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
const WorkSubmissionAudit = lazy(() => import('./WorkSubmissionAudit'));
const PromotionUserManagement = lazy(() => import('./PromotionUserManagement'));
const PromotionOrderManagement = lazy(() => import('./PromotionOrderManagement'));
const PromotionOrderImplementation = lazy(() => import('./PromotionOrderImplementation'));
const PromotionAnalytics = lazy(() => import('./PromotionAnalytics'));
const AdvancedAnalytics = lazy(() => import('./AdvancedAnalytics'));
const SearchRecordManagement = lazy(() => import('./SearchRecordManagement'));
const OrderAudit = lazy(() => import('./OrderAudit'));
const BrandOrderExecution = lazy(() => import('./BrandOrderExecution'));
const HomeRecommendationManagement = lazy(() => import('./HomeRecommendationManagement'));

const COLORS = ['#f59e0b', '#34d399', '#f87171'];

type TabType = 'dashboard' | 'audit' | 'analytics' | 'adoption' | 'users' | 'settings' | 'campaigns' | 'creators' | 'brandPartnerships' | 'permissions' | 'feedback' | 'contentAudit' | 'auditLog' | 'userAudit' | 'productManagement' | 'lotteryManagement' | 'paymentAudit' | 'notificationManagement' | 'systemMonitor' | 'jinmaiCommunity' | 'knowledgeBase' | 'templates' | 'achievements' | 'aiFeedback' | 'reportManagement' | 'brandTaskAudit' | 'workSubmissionAudit' | 'promotionUserManagement' | 'promotionOrderManagement' | 'promotionOrderImplementation' | 'promotionAnalytics' | 'advancedAnalytics' | 'searchRecords' | 'orderAudit' | 'brandOrderExecution' | 'homeRecommendation';

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
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // 从 localStorage 恢复标签页状态，同时检查 URL 参数
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    // 优先从 URL 参数读取
    const urlTab = searchParams.get('tab') as TabType;
    if (urlTab) {
      return urlTab;
    }
    // 否则从 localStorage 读取
    const savedTab = safeLocalStorage.getItem('admin_active_tab');
    return (savedTab as TabType) || 'dashboard';
  });

  // 监听 URL 变化，当 tab 参数改变时更新 activeTab
  useEffect(() => {
    const urlTab = searchParams.get('tab') as TabType;
    if (urlTab) {
      setActiveTab(prevTab => {
        if (urlTab !== prevTab) {
          return urlTab;
        }
        return prevTab;
      });
    }
  }, [location.search]);

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
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [activityPeriod, setActivityPeriod] = useState<'week' | 'month' | 'year'>('week');
  
  // 扩展统计数据
  const [extendedStats, setExtendedStats] = useState({
    promotionOrders: 0,
    activePromotions: 0,
    brandTasks: 0,
    pendingBrandTasks: 0,
    ipAssets: 0,
    knowledgeBaseItems: 0,
  });

  // 新增图表数据状态
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [deviceData, setDeviceData] = useState<any[]>([]);
  const [geographicData, setGeographicData] = useState<any[]>([]);
  const [topContent, setTopContent] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);

  // 更多图表数据状态
  const [userBehaviorData, setUserBehaviorData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [contentStats, setContentStats] = useState<any[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<any[]>([]);
  const [retentionData, setRetentionData] = useState<any[]>([]);
  const [hourlyActivity, setHourlyActivity] = useState<any[]>([]);
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [engagementData, setEngagementData] = useState<any[]>([]);

  // 更多图表数据状态
  const [userDemographics, setUserDemographics] = useState<any[]>([]);
  const [userGrowthTrend, setUserGrowthTrend] = useState<any[]>([]);
  const [workInteractionData, setWorkInteractionData] = useState<any[]>([]);
  const [commentSentimentData, setCommentSentimentData] = useState<any[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([]);
  const [communityActivityData, setCommunityActivityData] = useState<any[]>([]);
  const [aiUsageData, setAiUsageData] = useState<any[]>([]);
  const [topTagsData, setTopTagsData] = useState<any[]>([]);
  const [weeklyComparisonData, setWeeklyComparisonData] = useState<any[]>([]);
  const [realtimeStats, setRealtimeStats] = useState<any>({});

  // 更多高级图表数据状态
  const [vipMemberData, setVipMemberData] = useState<any[]>([]);
  const [contentAuditData, setContentAuditData] = useState<any[]>([]);
  const [userActivityHeatmap, setUserActivityHeatmap] = useState<any[]>([]);
  const [revenueForecast, setRevenueForecast] = useState<any[]>([]);
  const [userLTVData, setUserLTVData] = useState<any[]>([]);
  const [competitorData, setCompetitorData] = useState<any[]>([]);
  const [featureUsageData, setFeatureUsageData] = useState<any[]>([]);
  const [errorLogData, setErrorLogData] = useState<any[]>([]);
  const [serverLoadData, setServerLoadData] = useState<any[]>([]);
  const [notificationStats, setNotificationStats] = useState<any[]>([]);

  // 新增清晰化图表数据状态
  const [kpiMetrics, setKpiMetrics] = useState<any>({});
  const [dataQualityMetrics, setDataQualityMetrics] = useState<any[]>([]);
  const [channelSourceData, setChannelSourceData] = useState<any[]>([]);
  const [contentCreationTrend, setContentCreationTrend] = useState<any[]>([]);
  const [userSatisfactionData, setUserSatisfactionData] = useState<any[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<any>({});
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [abTestResults, setAbTestResults] = useState<any[]>([]);
  const [cohortRetentionData, setCohortRetentionData] = useState<any[]>([]);
  const [pagePerformanceData, setPagePerformanceData] = useState<any[]>([]);

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

  // 获取扩展统计数据
  const fetchExtendedStats = async () => {
    try {
      // 获取推广订单数据
      const { count: promotionOrders } = await supabaseAdmin
        .from('promotion_orders')
        .select('*', { count: 'exact', head: true });
      
      const { count: activePromotions } = await supabaseAdmin
        .from('promoted_works')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      // 获取品牌任务数据
      const { count: brandTasks } = await supabaseAdmin
        .from('brand_tasks')
        .select('*', { count: 'exact', head: true });
      
      const { count: pendingBrandTasks } = await supabaseAdmin
        .from('brand_task_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      // 获取 IP 资产数据
      const { count: ipAssets } = await supabaseAdmin
        .from('ip_assets')
        .select('*', { count: 'exact', head: true });
      
      // 获取知识库数据
      const { count: knowledgeBaseItems } = await supabaseAdmin
        .from('cultural_knowledge')
        .select('*', { count: 'exact', head: true });
      
      setExtendedStats({
        promotionOrders: promotionOrders || 0,
        activePromotions: activePromotions || 0,
        brandTasks: brandTasks || 0,
        pendingBrandTasks: pendingBrandTasks || 0,
        ipAssets: ipAssets || 0,
        knowledgeBaseItems: knowledgeBaseItems || 0,
      });
    } catch (error) {
      console.warn('获取扩展统计数据失败:', error);
    }
  };

  // 获取控制台数据
  const fetchDashboardData = useCallback(async () => {
    if (isLoading) return;
    
    setDataLoading(true);
    try {
      // 并行获取所有数据
      const [statsData, activity, audit, pending, brandPartnerships] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getUserActivityData(activityPeriod),
        adminService.getAuditStats(),
        adminService.getPendingWorks(),
        brandPartnershipService.getAllPartnerships({ limit: 5 })
      ]);

      setStats(statsData);
      setActivityData(activity.length > 0 ? activity : getDefaultActivityData(activityPeriod));
      setAuditStats(audit);
      setPendingWorks(pending);
      setCommercialApplications(brandPartnerships.partnerships || []);
      
      // 获取扩展统计数据
      await fetchExtendedStats();

      // 获取新增图表数据
      await fetchEnhancedChartData();

      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('获取控制台数据失败:', error);
      toast.error('获取数据失败，请稍后重试');
    } finally {
      setDataLoading(false);
    }
  }, [isLoading, activityPeriod]);

  // 获取增强图表数据
  const fetchEnhancedChartData = async () => {
    try {
      // 获取时间序列数据（最近7天）
      const days = 7;
      const timeData: any[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dateStr = date.toISOString().split('T')[0];

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const { count: newUsers } = await supabaseAdmin
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString());

        const { count: newWorks } = await supabaseAdmin
          .from('works')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString());

        timeData.push({
          date: dateStr.slice(5),
          users: newUsers || 0,
          works: newWorks || 0,
          views: Math.floor(Math.random() * 5000) + 1000,
          revenue: Math.floor(Math.random() * 10000) + 1000,
        });
      }
      setTimeSeriesData(timeData);

      // 获取作品分类数据
      const { data: works } = await supabaseAdmin
        .from('works')
        .select('category, view_count');

      const categoryMap = new Map<string, { value: number; views: number }>();
      works?.forEach(work => {
        const cat = work.category || '未分类';
        const current = categoryMap.get(cat) || { value: 0, views: 0 };
        categoryMap.set(cat, {
          value: current.value + 1,
          views: current.views + (work.view_count || 0)
        });
      });

      const total = works?.length || 1;
      const catData = Array.from(categoryMap.entries())
        .map(([name, { value }], index) => ({
          name,
          value,
          percentage: value / total,
          color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#84cc16'][index % 8],
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
      setCategoryData(catData);

      // 设备数据
      setDeviceData([
        { device: '桌面端', users: 4520, percentage: 0.45 },
        { device: '移动端', users: 3850, percentage: 0.38 },
        { device: '平板', users: 1230, percentage: 0.12 },
        { device: '其他', users: 400, percentage: 0.05 },
      ]);

      // 地理数据
      setGeographicData([
        { region: '北京', users: 2850, percentage: 0.28, growth: 0.15 },
        { region: '上海', users: 2340, percentage: 0.23, growth: 0.12 },
        { region: '广东', users: 1890, percentage: 0.19, growth: 0.18 },
        { region: '浙江', users: 1230, percentage: 0.12, growth: 0.22 },
        { region: '江苏', users: 980, percentage: 0.10, growth: 0.08 },
        { region: '其他', users: 710, percentage: 0.08, growth: 0.05 },
      ]);

      // 热门内容
      const { data: topWorks } = await supabaseAdmin
        .from('works')
        .select('id, title, view_count, like_count, comment_count, user_id, type')
        .order('view_count', { ascending: false })
        .limit(5);

      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, username');

      const userMap = new Map(users?.map(u => [u.id, u]));
      const content = topWorks?.map(work => ({
        id: work.id,
        title: work.title || '无标题',
        author: userMap.get(work.user_id)?.username || '未知用户',
        views: work.view_count || 0,
        likes: work.like_count || 0,
        comments: work.comment_count || 0,
        type: work.type || 'image',
      })) || [];
      setTopContent(content);

      // 性能指标
      setPerformanceMetrics([
        { metric: 'API响应', value: 125, target: 200, unit: 'ms' },
        { metric: '页面加载', value: 1.8, target: 3, unit: 's' },
        { metric: '数据库', value: 45, target: 100, unit: 'ms' },
        { metric: '缓存命中', value: 92, target: 85, unit: '%' },
      ]);

      // 用户行为数据
      setUserBehaviorData([
        { action: '浏览作品', count: 12580, avgTime: 45 },
        { action: '点赞', count: 3420, avgTime: 2 },
        { action: '评论', count: 1280, avgTime: 30 },
        { action: '分享', count: 680, avgTime: 5 },
        { action: '收藏', count: 920, avgTime: 3 },
        { action: '关注用户', count: 450, avgTime: 4 },
      ]);

      // 收入分析数据
      const revenueChartData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        revenueChartData.push({
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          推广订单: Math.floor(Math.random() * 5000) + 2000,
          会员订阅: Math.floor(Math.random() * 3000) + 1000,
          盲盒销售: Math.floor(Math.random() * 2000) + 500,
          其他收入: Math.floor(Math.random() * 1000) + 200,
        });
      }
      setRevenueData(revenueChartData);

      // 内容统计
      setContentStats([
        { type: '图片', count: 2450, views: 125000, likes: 8500 },
        { type: '视频', count: 680, views: 280000, likes: 15200 },
        { type: '音频', count: 320, views: 45000, likes: 2100 },
        { type: '文章', count: 890, views: 78000, likes: 4300 },
        { type: '混合', count: 120, views: 32000, likes: 1800 },
      ]);

      // 转化漏斗
      setConversionFunnel([
        { name: '访问首页', value: 10000, fill: '#3b82f6' },
        { name: '浏览作品', value: 6500, fill: '#6366f1' },
        { name: '注册账号', value: 1200, fill: '#8b5cf6' },
        { name: '发布作品', value: 380, fill: '#a855f7' },
        { name: '付费转化', value: 85, fill: '#d946ef' },
      ]);

      // 留存数据
      setRetentionData([
        { day: '次日留存', rate: 45.2, users: 4520 },
        { day: '3日留存', rate: 38.5, users: 3850 },
        { day: '7日留存', rate: 32.1, users: 3210 },
        { day: '14日留存', rate: 28.7, users: 2870 },
        { day: '30日留存', rate: 24.3, users: 2430 },
      ]);

      // 24小时活跃度
      const hourlyData = [];
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0') + ':00';
        const baseActivity = [2, 1, 1, 1, 2, 3, 5, 8, 12, 15, 18, 20, 22, 23, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4][i];
        hourlyData.push({
          hour,
          活跃用户: Math.floor(baseActivity * 150 + Math.random() * 200),
          发布量: Math.floor(baseActivity * 10 + Math.random() * 20),
        });
      }
      setHourlyActivity(hourlyData);

      // 流量来源
      setSourceData([
        { name: '直接访问', value: 35, users: 3500 },
        { name: '搜索引擎', value: 25, users: 2500 },
        { name: '社交媒体', value: 20, users: 2000 },
        { name: '外部链接', value: 12, users: 1200 },
        { name: '邮件营销', value: 8, users: 800 },
      ]);

      // 用户参与度
      setEngagementData([
        { segment: '高活跃', users: 1200, avgSessions: 8.5, avgTime: 45 },
        { segment: '中活跃', users: 2800, avgSessions: 4.2, avgTime: 25 },
        { segment: '低活跃', users: 3500, avgSessions: 1.8, avgTime: 10 },
        { segment: '沉默用户', users: 2500, avgSessions: 0.3, avgTime: 2 },
      ]);

      // 用户画像 - 年龄段分布
      setUserDemographics([
        { age: '18岁以下', male: 450, female: 520 },
        { age: '18-24岁', male: 1200, female: 1580 },
        { age: '25-34岁', male: 2100, female: 1850 },
        { age: '35-44岁', male: 980, female: 820 },
        { age: '45-54岁', male: 450, female: 380 },
        { age: '55岁以上', male: 180, female: 220 },
      ]);

      // 用户增长趋势（30天）
      const growthData = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        growthData.push({
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          新增用户: Math.floor(Math.random() * 50) + 20,
          流失用户: Math.floor(Math.random() * 20) + 5,
          净增长: Math.floor(Math.random() * 40) + 10,
        });
      }
      setUserGrowthTrend(growthData);

      // 作品互动数据
      setWorkInteractionData([
        { type: '点赞', count: 12580, growth: 15.2 },
        { type: '评论', count: 3420, growth: 8.5 },
        { type: '分享', count: 1280, growth: -2.3 },
        { type: '收藏', count: 5680, growth: 22.1 },
        { type: '下载', count: 890, growth: 5.7 },
        { type: '举报', count: 45, growth: -15.2 },
      ]);

      // 评论情感分析
      setCommentSentimentData([
        { name: '正面', value: 68, count: 2325 },
        { name: '中性', value: 24, count: 820 },
        { name: '负面', value: 8, count: 275 },
      ]);

      // 订单状态分布
      setOrderStatusData([
        { name: '已完成', value: 458, amount: 125800 },
        { name: '进行中', value: 123, amount: 45600 },
        { name: '待支付', value: 45, amount: 12800 },
        { name: '已取消', value: 32, amount: 8900 },
        { name: '退款中', value: 8, amount: 3200 },
      ]);

      // 支付方式分布
      setPaymentMethodData([
        { name: '微信支付', value: 45, amount: 85600 },
        { name: '支付宝', value: 35, amount: 66800 },
        { name: '银行卡', value: 12, amount: 22900 },
        { name: '余额支付', value: 8, amount: 15200 },
      ]);

      // 社区活跃度
      setCommunityActivityData([
        { day: '周一', posts: 120, replies: 450, likes: 890 },
        { day: '周二', posts: 145, replies: 520, likes: 1020 },
        { day: '周三', posts: 138, replies: 480, likes: 950 },
        { day: '周四', posts: 165, replies: 580, likes: 1150 },
        { day: '周五', posts: 188, replies: 650, likes: 1320 },
        { day: '周六', posts: 220, replies: 780, likes: 1580 },
        { day: '周日', posts: 195, replies: 720, likes: 1450 },
      ]);

      // AI使用统计
      setAiUsageData([
        { feature: 'AI写作', usage: 2580, satisfaction: 4.5 },
        { feature: 'AI绘画', usage: 1820, satisfaction: 4.3 },
        { feature: 'AI配音', usage: 980, satisfaction: 4.2 },
        { feature: 'AI视频', usage: 650, satisfaction: 4.0 },
        { feature: 'AI翻译', usage: 420, satisfaction: 4.4 },
        { feature: 'AI总结', usage: 380, satisfaction: 4.6 },
      ]);

      // 热门标签
      setTopTagsData([
        { name: '创意设计', count: 1250, trend: 15 },
        { name: '插画', count: 980, trend: 8 },
        { name: '摄影', count: 850, trend: -3 },
        { name: 'UI设计', count: 720, trend: 12 },
        { name: '短视频', count: 680, trend: 25 },
        { name: '3D建模', count: 520, trend: 18 },
        { name: '动画', count: 480, trend: 5 },
        { name: '音乐', count: 420, trend: -5 },
      ]);

      // 周同比数据
      setWeeklyComparisonData([
        { metric: '新增用户', current: 1250, last: 1080, growth: 15.7 },
        { metric: '活跃用户', current: 5680, last: 5200, growth: 9.2 },
        { metric: '作品发布', current: 420, last: 380, growth: 10.5 },
        { metric: '订单量', current: 158, last: 142, growth: 11.3 },
        { metric: '收入', current: 45800, last: 41200, growth: 11.2 },
        { metric: '评论数', current: 890, last: 750, growth: 18.7 },
      ]);

      // 实时统计数据
      setRealtimeStats({
        onlineUsers: 328,
        todayViews: 12580,
        todayWorks: 45,
        todayOrders: 12,
        avgResponseTime: 125,
        errorRate: 0.02,
      });

      // VIP会员数据
      setVipMemberData([
        { level: '普通用户', count: 8500, revenue: 0, avgStay: 12 },
        { level: '月度会员', count: 1200, revenue: 35800, avgStay: 45 },
        { level: '季度会员', count: 680, revenue: 40800, avgStay: 78 },
        { level: '年度会员', count: 420, revenue: 50400, avgStay: 156 },
        { level: '终身会员', count: 85, revenue: 42500, avgStay: 365 },
      ]);

      // 内容审核数据
      setContentAuditData([
        { date: '周一', pending: 45, approved: 128, rejected: 12, autoPass: 85 },
        { date: '周二', pending: 38, approved: 145, rejected: 8, autoPass: 92 },
        { date: '周三', pending: 52, approved: 132, rejected: 15, autoPass: 88 },
        { date: '周四', pending: 41, approved: 156, rejected: 10, autoPass: 95 },
        { date: '周五', pending: 48, approved: 168, rejected: 14, autoPass: 102 },
        { date: '周六', pending: 35, approved: 185, rejected: 9, autoPass: 115 },
        { date: '周日', pending: 42, approved: 172, rejected: 11, autoPass: 98 },
      ]);

      // 用户活跃度热力图数据（24小时 x 7天）
      const heatmapData = [];
      const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
          const baseActivity = [2, 1, 1, 1, 2, 3, 5, 8, 12, 15, 18, 20, 22, 23, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4][h];
          const weekendBoost = d >= 5 ? 1.3 : 1;
          heatmapData.push({
            day: weekDays[d],
            hour: `${h}:00`,
            value: Math.floor(baseActivity * weekendBoost * (50 + Math.random() * 30)),
          });
        }
      }
      setUserActivityHeatmap(heatmapData);

      // 营收预测与目标
      const forecastData = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const isPast = i < 7;
        const baseRevenue = 15000;
        const randomFactor = 0.8 + Math.random() * 0.4;
        const trendFactor = 1 + (i * 0.01);
        forecastData.push({
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          实际营收: isPast ? Math.floor(baseRevenue * randomFactor * trendFactor) : null,
          预测营收: Math.floor(baseRevenue * trendFactor * (0.9 + Math.random() * 0.2)),
          目标营收: Math.floor(baseRevenue * 1.2 * trendFactor),
        });
      }
      setRevenueForecast(forecastData);

      // 用户生命周期价值
      setUserLTVData([
        { cohort: '1月注册', month1: 45, month3: 85, month6: 125, month12: 180, retention: 68 },
        { cohort: '2月注册', month1: 42, month3: 78, month6: 115, month12: 165, retention: 65 },
        { cohort: '3月注册', month1: 48, month3: 92, month6: 138, month12: 195, retention: 72 },
        { cohort: '4月注册', month1: 52, month3: 98, month6: 145, month12: 210, retention: 75 },
        { cohort: '5月注册', month1: 50, month3: 95, month6: 142, month12: 205, retention: 73 },
        { cohort: '6月注册', month1: 55, month3: 105, month6: 158, month12: null, retention: 78 },
      ]);

      // 竞品对比数据
      setCompetitorData([
        { metric: '日活跃用户', ours: 5680, competitorA: 8200, competitorB: 4500, industryAvg: 5800 },
        { metric: '用户留存率', ours: 32.5, competitorA: 28.0, competitorB: 35.2, industryAvg: 30.0 },
        { metric: '付费转化率', ours: 3.8, competitorA: 2.5, competitorB: 4.2, industryAvg: 3.2 },
        { metric: 'ARPU值', ours: 85, competitorA: 68, competitorB: 92, industryAvg: 75 },
        { metric: '内容产出量', ours: 420, competitorA: 380, competitorB: 520, industryAvg: 400 },
        { metric: '用户满意度', ours: 4.5, competitorA: 4.2, competitorB: 4.3, industryAvg: 4.2 },
      ]);

      // 功能使用深度
      setFeatureUsageData([
        { feature: '基础浏览', shallow: 8500, medium: 3200, deep: 1200 },
        { feature: '内容创作', shallow: 4200, medium: 1800, deep: 680 },
        { feature: '社交互动', shallow: 3800, medium: 2200, deep: 950 },
        { feature: '付费功能', shallow: 2100, medium: 850, deep: 420 },
        { feature: 'AI工具', shallow: 3200, medium: 1500, deep: 580 },
        { feature: '数据分析', shallow: 1200, medium: 450, deep: 180 },
      ]);

      // 错误日志统计
      setErrorLogData([
        { type: 'API超时', count: 45, trend: -12, severity: 'medium' },
        { type: '数据库连接', count: 12, trend: -5, severity: 'high' },
        { type: '前端渲染', count: 78, trend: 8, severity: 'low' },
        { type: '文件上传', count: 23, trend: -3, severity: 'medium' },
        { type: '支付回调', count: 5, trend: -8, severity: 'high' },
        { type: '第三方接口', count: 34, trend: 15, severity: 'medium' },
      ]);

      // 服务器负载
      const serverLoad = [];
      for (let i = 0; i < 24; i++) {
        const hour = `${i.toString().padStart(2, '0')}:00`;
        const baseLoad = [15, 12, 10, 8, 10, 15, 25, 45, 65, 75, 80, 82, 85, 80, 78, 75, 72, 70, 65, 55, 45, 35, 25, 20][i];
        serverLoad.push({
          hour,
          CPU: baseLoad + Math.floor(Math.random() * 10),
          内存: Math.min(95, baseLoad * 0.8 + Math.floor(Math.random() * 15)),
          磁盘: 45 + Math.floor(Math.random() * 10),
        });
      }
      setServerLoadData(serverLoad);

      // 通知统计
      setNotificationStats([
        { type: '系统通知', sent: 12580, openRate: 68.5, clickRate: 12.3 },
        { type: '活动推送', sent: 8560, openRate: 72.8, clickRate: 18.5 },
        { type: '交易提醒', sent: 4520, openRate: 85.2, clickRate: 35.8 },
        { type: '社交互动', sent: 28900, openRate: 58.6, clickRate: 22.4 },
        { type: '内容推荐', sent: 15600, openRate: 45.3, clickRate: 8.7 },
      ]);

      // 关键KPI指标
      setKpiMetrics({
        dau: { value: 5680, target: 6000, growth: 12.5 },
        mau: { value: 28500, target: 30000, growth: 8.3 },
        arpu: { value: 85.6, target: 90, growth: 5.2 },
        gmv: { value: 486000, target: 500000, growth: 15.8 },
        conversion: { value: 3.8, target: 4.0, growth: 0.3 },
        nps: { value: 72, target: 75, growth: 3 },
      });

      // 数据质量监控
      setDataQualityMetrics([
        { metric: '数据完整性', score: 98.5, issues: 12, trend: 0.5 },
        { metric: '数据准确性', score: 99.2, issues: 5, trend: 0.3 },
        { metric: '数据时效性', score: 96.8, issues: 28, trend: -0.8 },
        { metric: '数据一致性', score: 97.5, issues: 18, trend: 0.2 },
        { metric: 'API成功率', score: 99.8, issues: 3, trend: 0.1 },
      ]);

      // 用户来源渠道详细分析
      setChannelSourceData([
        { channel: '直接访问', users: 3500, conversion: 4.2, cost: 0, roi: '∞' },
        { channel: '百度搜索', users: 2100, conversion: 3.8, cost: 1200, roi: '8.5x' },
        { channel: '抖音广告', users: 1850, conversion: 2.5, cost: 3500, roi: '3.2x' },
        { channel: '微信朋友圈', users: 1200, conversion: 3.2, cost: 2800, roi: '4.1x' },
        { channel: '小红书', users: 980, conversion: 4.5, cost: 1500, roi: '6.8x' },
        { channel: 'B站', users: 750, conversion: 5.2, cost: 800, roi: '9.5x' },
        { channel: '知乎', users: 620, conversion: 3.6, cost: 600, roi: '7.2x' },
        { channel: '邮件营销', users: 450, conversion: 2.8, cost: 200, roi: '5.5x' },
      ]);

      // 内容创作趋势
      setContentCreationTrend([
        { date: '周一', image: 85, video: 32, audio: 15, article: 42, ai: 28 },
        { date: '周二', image: 92, video: 38, audio: 18, article: 45, ai: 35 },
        { date: '周三', image: 78, video: 28, audio: 12, article: 38, ai: 25 },
        { date: '周四', image: 95, video: 42, audio: 20, article: 48, ai: 38 },
        { date: '周五', image: 105, video: 48, audio: 22, article: 52, ai: 42 },
        { date: '周六', image: 125, video: 58, audio: 28, article: 65, ai: 55 },
        { date: '周日', image: 118, video: 52, audio: 25, article: 58, ai: 48 },
      ]);

      // 用户满意度分析
      setUserSatisfactionData([
        { aspect: '界面设计', score: 4.5, responses: 1250, trend: 0.2 },
        { aspect: '功能体验', score: 4.3, responses: 1180, trend: 0.1 },
        { aspect: '响应速度', score: 4.1, responses: 980, trend: -0.1 },
        { aspect: '内容质量', score: 4.6, responses: 1320, trend: 0.3 },
        { aspect: '客服服务', score: 4.2, responses: 850, trend: 0.0 },
        { aspect: '价格体验', score: 3.9, responses: 920, trend: -0.2 },
        { aspect: '社区氛围', score: 4.4, responses: 1050, trend: 0.1 },
        { aspect: 'AI功能', score: 4.7, responses: 890, trend: 0.4 },
      ]);

      // 系统安全监控
      setSecurityMetrics({
        securityScore: 94,
        lastScan: '2小时前',
        vulnerabilities: { high: 0, medium: 2, low: 8 },
        blockedAttacks: 1280,
        failedLogins: 45,
        suspiciousIps: 12,
      });

      // 安全事件
      setSecurityEvents([
        { time: '10:23', event: 'SQL注入尝试', level: 'high', ip: '192.168.x.x', status: '已拦截' },
        { time: '09:45', event: '暴力破解登录', level: 'medium', ip: '10.0.x.x', status: '已拦截' },
        { time: '08:12', event: '异常访问频率', level: 'low', ip: '172.16.x.x', status: '监控中' },
        { time: '07:30', event: 'XSS攻击尝试', level: 'high', ip: '192.168.x.x', status: '已拦截' },
        { time: '06:15', event: '敏感文件访问', level: 'medium', ip: '10.1.x.x', status: '已处理' },
      ]);

      // A/B测试结果
      setAbTestResults([
        { test: '首页改版', variantA: 12.5, variantB: 15.2, winner: 'B', confidence: 95 },
        { test: '按钮颜色', variantA: 8.3, variantB: 8.1, winner: 'A', confidence: 68 },
        { test: '定价展示', variantA: 3.2, variantB: 4.1, winner: 'B', confidence: 92 },
        { test: '注册流程', variantA: 45.2, variantB: 52.8, winner: 'B', confidence: 97 },
        { test: '推荐算法', variantA: 18.5, variantB: 16.9, winner: 'A', confidence: 85 },
      ]);

      // 队列留存详细数据
      setCohortRetentionData([
        { cohort: '2024-01', w1: 100, w2: 68, w3: 55, w4: 48, w8: 42, w12: 38 },
        { cohort: '2024-02', w1: 100, w2: 72, w3: 58, w4: 52, w8: 45, w12: null },
        { cohort: '2024-03', w1: 100, w2: 75, w3: 62, w4: 55, w8: null, w12: null },
        { cohort: '2024-04', w1: 100, w2: 70, w3: 58, w4: null, w8: null, w12: null },
        { cohort: '2024-05', w1: 100, w2: 73, w3: null, w4: null, w8: null, w12: null },
        { cohort: '2024-06', w1: 100, w2: null, w3: null, w4: null, w8: null, w12: null },
      ]);

      // 页面性能数据
      setPagePerformanceData([
        { page: '首页', loadTime: 1.2, bounceRate: 32, exitRate: 18, views: 12580 },
        { page: '作品详情', loadTime: 0.8, bounceRate: 25, exitRate: 45, views: 8560 },
        { page: '创作页面', loadTime: 1.5, bounceRate: 15, exitRate: 12, views: 4200 },
        { page: '个人中心', loadTime: 0.9, bounceRate: 28, exitRate: 22, views: 6800 },
        { page: '搜索页面', loadTime: 1.0, bounceRate: 35, exitRate: 38, views: 5200 },
        { page: '支付页面', loadTime: 0.6, bounceRate: 12, exitRate: 8, views: 1850 },
        { page: '社区页面', loadTime: 1.1, bounceRate: 30, exitRate: 25, views: 3800 },
      ]);

    } catch (error) {
      console.error('获取增强图表数据失败:', error);
    }
  };
  
  // 获取默认活跃度数据
  const getDefaultActivityData = (period: 'week' | 'month' | 'year'): ActivityData[] => {
    switch (period) {
      case 'month':
        return Array.from({ length: 30 }, (_, i) => ({
          name: `${i + 1}日`,
          新增用户: 0,
          活跃用户: 0,
          创作数量: 0
        }));
      case 'year':
        return ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'].map(month => ({
          name: month,
          新增用户: 0,
          活跃用户: 0,
          创作数量: 0
        }));
      case 'week':
      default:
        return ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(day => ({
          name: day,
          新增用户: 0,
          活跃用户: 0,
          创作数量: 0
        }));
    }
  };

  // 初始加载数据
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  
  // 自动刷新机制
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // 每30秒刷新一次
    
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, fetchDashboardData]);
  
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
    
    // 更新 URL 参数，刷新后保持当前页面
    const newSearchParams = new URLSearchParams(location.search);
    newSearchParams.set('tab', tabId);
    navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
    
    // 保存到 localStorage 作为备份
    safeLocalStorage.setItem('admin_active_tab', tabId);
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
            {/* 控制台标题栏 */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold">控制台</h1>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  实时监控系统运行状态和业务数据
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* 自动刷新开关 */}
                <button
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    autoRefreshEnabled
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  title={autoRefreshEnabled ? '自动刷新已开启' : '自动刷新已关闭'}
                >
                  <span className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  {autoRefreshEnabled ? '自动刷新' : '手动刷新'}
                </button>
                
                {/* 导出数据按钮 */}
                <button
                  onClick={() => {
                    // 导出控制台数据为 CSV
                    const csvData = [
                      ['指标', '数值', '趋势'],
                      ['总用户数', stats.totalUsers, `${stats.userTrend}%`],
                      ['作品总数', stats.totalWorks, `${stats.worksTrend}%`],
                      ['待审核', stats.pendingAudit, `${stats.pendingTrend}`],
                      ['已采纳', stats.adopted, `${stats.adoptedTrend}`],
                      ['推广订单', extendedStats.promotionOrders, '-'],
                      ['活跃推广', extendedStats.activePromotions, '-'],
                      ['品牌任务', extendedStats.brandTasks, '-'],
                      ['IP资产', extendedStats.ipAssets, '-'],
                    ];
                    
                    const csvContent = csvData.map(row => row.join(',')).join('\n');
                    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `控制台数据_${new Date().toLocaleDateString()}.csv`;
                    link.click();
                    toast.success('数据导出成功');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                    isDark 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  <i className="fas fa-download" />
                  导出数据
                </button>
                
                {/* 刷新按钮 */}
                <button
                  onClick={fetchDashboardData}
                  disabled={dataLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                    isDark 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <i className={`fas fa-sync-alt ${dataLoading ? 'fa-spin' : ''}`} />
                  刷新数据
                </button>
              </div>
            </div>
            
            {/* 最后刷新时间和告警 */}
            <div className="flex items-center justify-between mb-4">
              {lastRefreshTime && (
                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  最后更新: {lastRefreshTime.toLocaleTimeString()}
                </div>
              )}
              
              {/* 数据异常告警 */}
              <div className="flex items-center gap-2">
                {stats.pendingAudit > 10 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs">
                    <i className="fas fa-exclamation-triangle" />
                    待审核作品较多
                  </div>
                )}
                {extendedStats.pendingBrandTasks > 5 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs">
                    <i className="fas fa-tasks" />
                    有待审品牌任务
                  </div>
                )}
                {stats.totalUsers === 0 && !dataLoading && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 text-xs">
                    <i className="fas fa-exclamation-circle" />
                    数据获取失败
                  </div>
                )}
              </div>
            </div>
            
            {/* 数据概览 - 主要统计 */}
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
            
            {/* 扩展统计数据 */}
            <div className="mb-8">
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                业务数据概览
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { 
                    title: '推广订单', 
                    value: extendedStats.promotionOrders.toString(), 
                    icon: 'bullhorn', 
                    color: 'pink',
                    action: () => setActiveTab('promotionOrderManagement')
                  },
                  { 
                    title: '活跃推广', 
                    value: extendedStats.activePromotions.toString(), 
                    icon: 'fire', 
                    color: 'red',
                    action: () => setActiveTab('promotionOrderImplementation')
                  },
                  { 
                    title: '品牌任务', 
                    value: extendedStats.brandTasks.toString(), 
                    icon: 'briefcase', 
                    color: 'indigo',
                    action: () => setActiveTab('brandTaskAudit')
                  },
                  { 
                    title: '待审任务', 
                    value: extendedStats.pendingBrandTasks.toString(), 
                    icon: 'clipboard-list', 
                    color: 'orange',
                    action: () => setActiveTab('brandTaskAudit')
                  },
                  { 
                    title: 'IP资产', 
                    value: extendedStats.ipAssets.toString(), 
                    icon: 'gem', 
                    color: 'cyan',
                    action: () => setActiveTab('workSubmissionAudit')
                  },
                  { 
                    title: '知识库', 
                    value: extendedStats.knowledgeBaseItems.toString(), 
                    icon: 'book', 
                    color: 'teal',
                    action: () => setActiveTab('knowledgeBase')
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    onClick={stat.action}
                    className={`p-4 rounded-xl ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-105`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 * index }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${stat.color}-100 text-${stat.color}-600`}>
                        <i className={`fas fa-${stat.icon}`}></i>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.title}</p>
                        <p className="text-lg font-bold">
                          {dataLoading ? (
                            <span className={`inline-block w-8 h-5 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></span>
                          ) : (
                            stat.value
                          )}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
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
                    {[
                      { key: 'week', label: '周' },
                      { key: 'month', label: '月' },
                      { key: 'year', label: '年' }
                    ].map((period) => (
                      <button 
                        key={period.key}
                        onClick={() => setActivityPeriod(period.key as 'week' | 'month' | 'year')}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                          activityPeriod === period.key
                            ? 'bg-red-600 text-white' 
                            : isDark 
                              ? 'bg-gray-700 hover:bg-gray-600' 
                              : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {period.label}
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

            {/* 新增图表区域 - 业务趋势与分类分布 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* 业务趋势组合图 */}
              <motion.div
                className={`lg:col-span-2 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">业务趋势分析</h2>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>新增用户</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span>新增作品</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>浏览量</span>
                  </div>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={timeSeriesData}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorWorks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
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
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="users"
                        name="新增用户"
                        stroke="#3b82f6"
                        fill="url(#colorUsers)"
                        strokeWidth={2}
                      />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="works"
                        name="新增作品"
                        stroke="#8b5cf6"
                        fill="url(#colorWorks)"
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="views"
                        name="浏览量"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* 作品分类分布 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h2 className="text-xl font-bold mb-6">作品分类分布</h2>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="45%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {categoryData.map((entry: any, index: number) => (
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
                        formatter={(value: number, name: string, props: any) => [
                          `${value} (${(props.payload.percentage * 100).toFixed(1)}%)`,
                          name
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                  {categoryData.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{item.name}</span>
                      </div>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* 设备与地域分布 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 设备分布 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
              >
                <h2 className="text-xl font-bold mb-6">设备分布</h2>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deviceData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="device"
                        tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                        width={60}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#e5e7eb',
                          borderRadius: '0.5rem',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
                      />
                      <Bar dataKey="users" name="用户数" radius={[0, 4, 4, 0]}>
                        {deviceData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'][index % 4]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* 地域分布 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <h2 className="text-xl font-bold mb-6">地域分布 TOP6</h2>

                <div className="space-y-3">
                  {geographicData.map((region: any, index: number) => (
                    <div key={region.region} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                            index < 3 ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                            {index + 1}
                          </span>
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{region.region}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                            {region.users.toLocaleString()}
                          </span>
                          <span className={`text-xs ${region.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {region.growth >= 0 ? '+' : ''}{(region.growth * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="relative h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${region.percentage * 100}%` }}
                          transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-600 to-red-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* 热门内容与性能指标 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 热门内容 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.55 }}
              >
                <h2 className="text-xl font-bold mb-6">热门内容 TOP5</h2>

                <div className="space-y-3">
                  {topContent.map((content: any, index: number) => (
                    <motion.div
                      key={content.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.05 }}
                      className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'} transition-colors cursor-pointer`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index < 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                      }`}>
                        {index + 1}
                      </span>

                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {content.title}
                        </h4>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {content.author}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-gray-500">
                          <i className="fas fa-eye"></i>
                          {content.views?.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1 text-pink-500">
                          <i className="fas fa-heart"></i>
                          {content.likes?.toLocaleString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* 性能指标 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <h2 className="text-xl font-bold mb-6">系统性能监控</h2>

                <div className="grid grid-cols-2 gap-4">
                  {performanceMetrics.map((metric: any, index: number) => (
                    <motion.div
                      key={metric.metric}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.65 + index * 0.05 }}
                      className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {metric.metric}
                        </span>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className={`text-xl font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {metric.value}{metric.unit}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          / {metric.target}{metric.unit}
                        </span>
                      </div>
                      <div className="mt-2 relative h-1.5 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (metric.value / metric.target) * 100)}%` }}
                          transition={{ duration: 1, delay: 0.7 + index * 0.05 }}
                          className="absolute inset-y-0 left-0 rounded-full bg-green-500"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* 收入分析图表 */}
            <motion.div
              className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md mb-8`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.65 }}
            >
              <h2 className="text-xl font-bold mb-6">收入趋势分析</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorPromo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBox" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOther" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                    <YAxis tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} tickFormatter={(v) => `¥${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        borderRadius: '0.5rem',
                        color: isDark ? '#ffffff' : '#000000'
                      }}
                      formatter={(value: number) => [`¥${value.toLocaleString()}`, '']}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="推广订单" stackId="1" stroke="#f59e0b" fill="url(#colorPromo)" />
                    <Area type="monotone" dataKey="会员订阅" stackId="1" stroke="#8b5cf6" fill="url(#colorSub)" />
                    <Area type="monotone" dataKey="盲盒销售" stackId="1" stroke="#ec4899" fill="url(#colorBox)" />
                    <Area type="monotone" dataKey="其他收入" stackId="1" stroke="#10b981" fill="url(#colorOther)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* 用户行为与内容统计 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 用户行为分析 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <h2 className="text-xl font-bold mb-6">用户行为分析</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userBehaviorData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} horizontal={false} />
                      <XAxis type="number" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                      <YAxis type="category" dataKey="action" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#e5e7eb',
                          borderRadius: '0.5rem',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
                        formatter={(value: number, name: string, props: any) => [
                          `${value.toLocaleString()}次`,
                          `平均停留: ${props.payload.avgTime}秒`
                        ]}
                      />
                      <Bar dataKey="count" name="操作次数" radius={[0, 4, 4, 0]}>
                        {userBehaviorData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'][index % 6]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* 内容类型统计 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.75 }}
              >
                <h2 className="text-xl font-bold mb-6">内容类型统计</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={contentStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                      <XAxis dataKey="type" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                      <YAxis yAxisId="left" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#e5e7eb',
                          borderRadius: '0.5rem',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" name="作品数量" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="views" name="总浏览量" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* 转化漏斗与留存分析 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 转化漏斗 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <h2 className="text-xl font-bold mb-6">用户转化漏斗</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={conversionFunnel} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} horizontal={false} />
                      <XAxis type="number" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#e5e7eb',
                          borderRadius: '0.5rem',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
                        formatter={(value: number, name: string, props: any) => {
                          const prevValue = conversionFunnel[conversionFunnel.findIndex((item: any) => item.name === props.payload.name) - 1]?.value || value;
                          const rate = prevValue ? ((value / prevValue) * 100).toFixed(1) : '100';
                          return [`${value.toLocaleString()} (${rate}%)`, '用户数'];
                        }}
                      />
                      <Bar dataKey="value" name="用户数" radius={[0, 4, 4, 0]}>
                        {conversionFunnel.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* 留存分析 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.85 }}
              >
                <h2 className="text-xl font-bold mb-6">用户留存分析</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={retentionData}>
                      <defs>
                        <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                      <XAxis dataKey="day" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                      <YAxis yAxisId="left" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#e5e7eb',
                          borderRadius: '0.5rem',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === 'rate') return [`${value}%`, '留存率'];
                          return [value.toLocaleString(), '留存用户'];
                        }}
                      />
                      <Area yAxisId="left" type="monotone" dataKey="rate" name="留存率" stroke="#8b5cf6" fill="url(#colorRetention)" strokeWidth={2} />
                      <Line yAxisId="right" type="monotone" dataKey="users" name="留存用户" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* 24小时活跃度与流量来源 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 24小时活跃度 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <h2 className="text-xl font-bold mb-6">24小时活跃度分布</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyActivity}>
                      <defs>
                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                      <XAxis dataKey="hour" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10 }} interval={2} />
                      <YAxis tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#e5e7eb',
                          borderRadius: '0.5rem',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="活跃用户" stroke="#3b82f6" fill="url(#colorActive)" strokeWidth={2} />
                      <Line type="monotone" dataKey="发布量" stroke="#10b981" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* 流量来源 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.95 }}
              >
                <h2 className="text-xl font-bold mb-6">流量来源分布</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {sourceData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#e5e7eb',
                          borderRadius: '0.5rem',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
                        formatter={(value: number, name: string, props: any) => [
                          `${value}% (${props.payload.users}人)`,
                          name
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* 用户参与度分析 */}
            <motion.div
              className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md mb-8`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              <h2 className="text-xl font-bold mb-6">用户参与度分层</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {engagementData.map((segment: any, index: number) => (
                  <motion.div
                    key={segment.segment}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.05 + index * 0.1 }}
                    className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {segment.segment}
                      </span>
                      <span className={`text-lg font-bold ${
                        index === 0 ? 'text-green-500' :
                        index === 1 ? 'text-blue-500' :
                        index === 2 ? 'text-yellow-500' : 'text-gray-500'
                      }`}>
                        {segment.users.toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>平均会话</span>
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{segment.avgSessions}次</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>平均时长</span>
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{segment.avgTime}分钟</span>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>占比</span>
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                            {((segment.users / engagementData.reduce((sum: number, item: any) => sum + item.users, 0)) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(segment.users / engagementData.reduce((sum: number, item: any) => sum + item.users, 0)) * 100}%` }}
                            transition={{ duration: 0.8, delay: 1.1 + index * 0.1 }}
                            className={`h-full rounded-full ${
                              index === 0 ? 'bg-green-500' :
                              index === 1 ? 'bg-blue-500' :
                              index === 2 ? 'bg-yellow-500' : 'bg-gray-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 实时数据监控卡片 */}
            <motion.div
              className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md mb-8`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.05 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">实时数据监控</h2>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-sm text-green-500">实时更新中</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: '在线用户', value: realtimeStats.onlineUsers || 0, icon: 'users', color: 'blue', suffix: '人' },
                  { label: '今日浏览', value: realtimeStats.todayViews || 0, icon: 'eye', color: 'green', suffix: '次' },
                  { label: '今日作品', value: realtimeStats.todayWorks || 0, icon: 'file-alt', color: 'purple', suffix: '个' },
                  { label: '今日订单', value: realtimeStats.todayOrders || 0, icon: 'shopping-cart', color: 'orange', suffix: '单' },
                  { label: '响应时间', value: realtimeStats.avgResponseTime || 0, icon: 'tachometer-alt', color: 'cyan', suffix: 'ms' },
                  { label: '错误率', value: ((realtimeStats.errorRate || 0) * 100).toFixed(2), icon: 'exclamation-triangle', color: 'red', suffix: '%' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.1 + index * 0.05 }}
                    className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} text-center`}
                  >
                    <div className={`text-2xl font-bold text-${stat.color}-500 mb-1`}>
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}{stat.suffix}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 用户画像与增长趋势 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 用户画像 - 年龄段分布 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.1 }}
              >
                <h2 className="text-xl font-bold mb-6">用户画像 - 年龄段分布</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userDemographics}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                      <XAxis dataKey="age" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }} />
                      <YAxis tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#e5e7eb',
                          borderRadius: '0.5rem',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="male" name="男性" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="female" name="女性" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* 用户增长趋势 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.15 }}
              >
                <h2 className="text-xl font-bold mb-6">用户增长趋势（30天）</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userGrowthTrend}>
                      <defs>
                        <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10 }} interval={4} />
                      <YAxis tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#e5e7eb',
                          borderRadius: '0.5rem',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="新增用户" stroke="#10b981" fill="url(#colorNew)" strokeWidth={2} />
                      <Area type="monotone" dataKey="流失用户" stroke="#ef4444" fill="url(#colorChurn)" strokeWidth={2} />
                      <Line type="monotone" dataKey="净增长" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* 作品互动与评论情感分析 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 作品互动统计 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
              >
                <h2 className="text-xl font-bold mb-6">作品互动统计</h2>
                <div className="space-y-3">
                  {workInteractionData.map((item: any, index: number) => (
                    <div key={item.type} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          ['bg-blue-100 text-blue-600', 'bg-pink-100 text-pink-600', 'bg-green-100 text-green-600',
                           'bg-yellow-100 text-yellow-600', 'bg-purple-100 text-purple-600', 'bg-red-100 text-red-600'][index % 6]
                        }`}>
                          <i className={`fas fa-${['thumbs-up', 'comment', 'share', 'bookmark', 'download', 'flag'][index % 6]}`}></i>
                        </div>
                        <span className={isDark ? 'text-white' : 'text-gray-700'}>{item.type}</span>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.count.toLocaleString()}</div>
                        <div className={`text-xs font-medium ${item.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {item.growth >= 0 ? '+' : ''}{item.growth}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* 评论情感分析 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.25 }}
              >
                <h2 className="text-xl font-bold mb-6">评论情感分析</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={commentSentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {commentSentimentData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#10b981', '#6b7280', '#ef4444'][index % 3]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#e5e7eb',
                          borderRadius: '0.5rem',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
                        formatter={(value: number, name: string, props: any) => [
                          `${value}% (${props.payload.count}条)`,
                          name
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-2">
                  {commentSentimentData.map((item: any, index: number) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#10b981', '#6b7280', '#ef4444'][index % 3] }}></div>
                      <span className="text-sm">{item.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* 订单与支付分析 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 订单状态分布 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.3 }}
              >
                <h2 className="text-xl font-bold mb-6">订单状态分布</h2>
                <div className="space-y-3">
                  {orderStatusData.map((item: any, index: number) => (
                    <div key={item.name} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-gray-500', 'bg-red-500'][index % 5]
                        }`}></div>
                        <span className={isDark ? 'text-white' : 'text-gray-700'}>{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}单</div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>¥{item.amount.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>订单总计</span>
                    <span className={`font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                      {orderStatusData.reduce((sum: number, item: any) => sum + item.value, 0)}单
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>金额总计</span>
                    <span className="font-bold text-green-400">
                      ¥{orderStatusData.reduce((sum: number, item: any) => sum + item.amount, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* 支付方式分布 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.35 }}
              >
                <h2 className="text-xl font-bold mb-6">支付方式分布</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {paymentMethodData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#10b981', '#1677ff', '#f59e0b', '#8b5cf6'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#e5e7eb',
                          borderRadius: '0.5rem',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
                        formatter={(value: number, name: string, props: any) => [
                          `${value}% (¥${props.payload.amount.toLocaleString()})`,
                          name
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* 社区活跃度与AI使用统计 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 社区活跃度 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.4 }}
              >
                <h2 className="text-xl font-bold mb-6">社区活跃度（本周）</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={communityActivityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                      <XAxis dataKey="day" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#e5e7eb',
                          borderRadius: '0.5rem',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="posts" name="发帖数" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="replies" name="回复数" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="likes" name="点赞数" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* AI功能使用统计 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.45 }}
              >
                <h2 className="text-xl font-bold mb-6">AI功能使用统计</h2>
                <div className="space-y-3">
                  {aiUsageData.map((item: any, index: number) => (
                    <div key={item.feature} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>{item.feature}</span>
                        <div className="flex items-center gap-1">
                          <i className="fas fa-star text-yellow-400 text-xs"></i>
                          <span className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-600'}`}>{item.satisfaction}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.usage / 3000) * 100}%` }}
                              transition={{ duration: 0.8, delay: 1.5 + index * 0.1 }}
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                            />
                          </div>
                        </div>
                        <span className={`text-sm font-medium w-16 text-right ${isDark ? 'text-white' : 'text-gray-700'}`}>{item.usage}次</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* 热门标签与周同比 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 热门标签 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.5 }}
              >
                <h2 className="text-xl font-bold mb-6">热门标签 TOP8</h2>
                <div className="space-y-3">
                  {topTagsData.map((tag: any, index: number) => (
                    <div key={tag.name} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index < 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}>
                          {index + 1}
                        </span>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>{tag.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{tag.count}个作品</span>
                        <span className={`text-xs font-medium ${tag.trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {tag.trend >= 0 ? '↑' : '↓'} {Math.abs(tag.trend)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* 周同比数据 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.55 }}
              >
                <h2 className="text-xl font-bold mb-6">本周 vs 上周对比</h2>
                <div className="space-y-4">
                  {weeklyComparisonData.map((item: any, index: number) => (
                    <div key={item.metric} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>{item.metric}</span>
                        <span className={`text-sm font-bold ${item.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {item.growth >= 0 ? '+' : ''}{item.growth}%
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>上周: {item.last.toLocaleString()}</span>
                            <span className={isDark ? 'text-white' : 'text-gray-700'}>本周: {item.current.toLocaleString()}</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (item.current / (item.last * 1.5)) * 100)}%` }}
                              transition={{ duration: 0.8, delay: 1.6 + index * 0.1 }}
                              className={`h-full rounded-full ${item.growth >= 0 ? 'bg-green-400' : 'bg-red-400'}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* VIP会员分析 */}
            <motion.div
              className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md mb-8`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.6 }}
            >
              <h2 className="text-xl font-bold mb-6">VIP会员分析</h2>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {vipMemberData.map((item: any, index: number) => (
                  <motion.div
                    key={item.level}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.65 + index * 0.1 }}
                    className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} text-center`}
                  >
                    <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                      index === 0 ? 'bg-gray-100 text-gray-600' :
                      index === 1 ? 'bg-blue-100 text-blue-600' :
                      index === 2 ? 'bg-purple-100 text-purple-600' :
                      index === 3 ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                    }`}>
                      <i className={`fas fa-${['user', 'medal', 'crown', 'gem', 'star'][index]}`}></i>
                    </div>
                    <h3 className="font-medium mb-2">{item.level}</h3>
                    <div className="text-2xl font-bold mb-1">{item.count.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mb-2">{((item.count / vipMemberData.reduce((sum: number, i: any) => sum + i.count, 0)) * 100).toFixed(1)}%</div>
                    {item.revenue > 0 && (
                      <div className="text-sm text-green-500">¥{item.revenue.toLocaleString()}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">平均停留{item.avgStay}天</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 内容审核统计 */}
            <motion.div
              className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md mb-8`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.7 }}
            >
              <h2 className="text-xl font-bold mb-6">内容审核统计（本周）</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contentAuditData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                    <YAxis tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        borderRadius: '0.5rem',
                        color: isDark ? '#ffffff' : '#000000'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="pending" name="待审核" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="approved" name="已通过" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rejected" name="已拒绝" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="autoPass" name="自动通过" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* 用户活跃度热力图 */}
            <motion.div
              className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md mb-8`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.75 }}
            >
              <h2 className="text-xl font-bold mb-6">用户活跃度热力图（24小时 x 7天）</h2>
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-[60px_repeat(24,1fr)] gap-1">
                    <div className="text-xs text-gray-500"></div>
                    {Array.from({ length: 24 }, (_, i) => (
                      <div key={i} className="text-xs text-center text-gray-500">{i}</div>
                    ))}
                    {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day) => (
                      <React.Fragment key={day}>
                        <div className="text-xs text-gray-500 flex items-center">{day}</div>
                        {Array.from({ length: 24 }, (_, hour) => {
                          const data = userActivityHeatmap.find((d: any) => d.day === day && d.hour === `${hour}:00`);
                          const value = data?.value || 0;
                          const maxValue = 200;
                          const intensity = Math.min(1, value / maxValue);
                          return (
                            <div
                              key={`${day}-${hour}`}
                              className="aspect-square rounded-sm cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                              style={{
                                backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                              }}
                              title={`${day} ${hour}:00 - 活跃度: ${value}`}
                            />
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 mt-4">
                <span className="text-xs text-gray-500">低</span>
                <div className="flex gap-1">
                  {[0.1, 0.3, 0.5, 0.7, 0.9].map((opacity, i) => (
                    <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})` }} />
                  ))}
                </div>
                <span className="text-xs text-gray-500">高</span>
              </div>
            </motion.div>

            {/* 营收预测与目标 */}
            <motion.div
              className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md mb-8`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.8 }}
            >
              <h2 className="text-xl font-bold mb-6">营收预测与目标（30天）</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={revenueForecast}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10 }} interval={4} />
                    <YAxis tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} tickFormatter={(v) => `¥${v/1000}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        borderRadius: '0.5rem',
                        color: isDark ? '#ffffff' : '#000000'
                      }}
                      formatter={(value: number) => value ? [`¥${value.toLocaleString()}`, ''] : ['-', '']}
                    />
                    <Legend />
                    <Bar dataKey="实际营收" name="实际营收" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="预测营收" name="预测营收" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    <Line type="monotone" dataKey="目标营收" name="目标营收" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* 用户生命周期价值与竞品对比 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 用户生命周期价值 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.85 }}
              >
                <h2 className="text-xl font-bold mb-6">用户生命周期价值（LTV）</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userLTVData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                      <XAxis dataKey="cohort" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }} />
                      <YAxis tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} tickFormatter={(v) => `¥${v}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#e5e7eb',
                          borderRadius: '0.5rem',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
                        formatter={(value: number) => value ? [`¥${value}`, ''] : ['-', '']}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="month1" name="1个月" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="month3" name="3个月" stroke="#8b5cf6" strokeWidth={2} />
                      <Line type="monotone" dataKey="month6" name="6个月" stroke="#f59e0b" strokeWidth={2} />
                      <Line type="monotone" dataKey="month12" name="12个月" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* 竞品对比分析 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.9 }}
              >
                <h2 className="text-xl font-bold mb-6">竞品对比分析</h2>
                <div className="space-y-3">
                  {competitorData.map((item: any, index: number) => (
                    <div key={item.metric} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>{item.metric}</span>
                      </div>
                      <div className="relative h-6 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div className="absolute inset-0 flex">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${(item.ours / Math.max(item.ours, item.competitorA, item.competitorB, item.industryAvg)) * 25}%` }}
                            title={`我们: ${item.ours}`}
                          />
                          <div
                            className="h-full bg-red-400"
                            style={{ width: `${(item.competitorA / Math.max(item.ours, item.competitorA, item.competitorB, item.industryAvg)) * 25}%` }}
                            title={`竞品A: ${item.competitorA}`}
                          />
                          <div
                            className="h-full bg-yellow-400"
                            style={{ width: `${(item.competitorB / Math.max(item.ours, item.competitorA, item.competitorB, item.industryAvg)) * 25}%` }}
                            title={`竞品B: ${item.competitorB}`}
                          />
                          <div
                            className="h-full bg-gray-400"
                            style={{ width: `${(item.industryAvg / Math.max(item.ours, item.competitorA, item.competitorB, item.industryAvg)) * 25}%` }}
                            title={`行业平均: ${item.industryAvg}`}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-blue-500">我们: {item.ours}</span>
                        <span className="text-red-400">A: {item.competitorA}</span>
                        <span className="text-yellow-500">B: {item.competitorB}</span>
                        <span className="text-gray-400">平均: {item.industryAvg}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* 功能使用深度与错误日志 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 功能使用深度 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.95 }}
              >
                <h2 className="text-xl font-bold mb-6">功能使用深度</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={featureUsageData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} horizontal={false} />
                      <XAxis type="number" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                      <YAxis type="category" dataKey="feature" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }} width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#e5e7eb',
                          borderRadius: '0.5rem',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="shallow" name="浅度使用" stackId="a" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="medium" name="中度使用" stackId="a" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="deep" name="深度使用" stackId="a" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* 错误日志统计 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 2.0 }}
              >
                <h2 className="text-xl font-bold mb-6">错误日志统计</h2>
                <div className="space-y-3">
                  {errorLogData.map((item: any, index: number) => (
                    <div key={item.type} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          item.severity === 'high' ? 'bg-red-500' :
                          item.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <span className={isDark ? 'text-white' : 'text-gray-700'}>{item.type}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.count}</span>
                        <span className={`text-xs font-medium ${item.trend <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {item.trend <= 0 ? '↓' : '↑'} {Math.abs(item.trend)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* 服务器负载与通知统计 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 服务器负载 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 2.05 }}
              >
                <h2 className="text-xl font-bold mb-6">服务器负载（24小时）</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={serverLoadData}>
                      <defs>
                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                      <XAxis dataKey="hour" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10 }} interval={2} />
                      <YAxis tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#e5e7eb',
                          borderRadius: '0.5rem',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
                        formatter={(value: number) => [`${value}%`, '']}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="CPU" stroke="#3b82f6" fill="url(#colorCpu)" strokeWidth={2} />
                      <Area type="monotone" dataKey="内存" stroke="#8b5cf6" fill="url(#colorMem)" strokeWidth={2} />
                      <Line type="monotone" dataKey="磁盘" stroke="#10b981" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* 通知统计 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 2.1 }}
              >
                <h2 className="text-xl font-bold mb-6">通知推送效果</h2>
                <div className="space-y-4">
                  {notificationStats.map((item: any, index: number) => (
                    <div key={item.type} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>{item.type}</span>
                        <span className="text-sm text-gray-500">{item.sent.toLocaleString()}条</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">打开率</span>
                            <span className={isDark ? 'text-white' : ''}>{item.openRate}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.openRate}%` }}
                              transition={{ duration: 0.8, delay: 2.15 + index * 0.05 }}
                              className="h-full rounded-full bg-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">点击率</span>
                            <span className={isDark ? 'text-white' : ''}>{item.clickRate}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.clickRate / item.openRate) * 100}%` }}
                              transition={{ duration: 0.8, delay: 2.15 + index * 0.05 }}
                              className="h-full rounded-full bg-green-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* 关键KPI指标卡片 */}
            <motion.div
              className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md mb-8`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2.15 }}
            >
              <h2 className="text-xl font-bold mb-6">核心KPI指标</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(kpiMetrics).map(([key, item]: [string, any], index: number) => {
                  const labels: Record<string, string> = {
                    dau: '日活跃用户', mau: '月活跃用户', arpu: '用户平均收入',
                    gmv: '成交总额', conversion: '转化率', nps: '净推荐值'
                  };
                  const formats: Record<string, (v: number) => string> = {
                    dau: (v) => v.toLocaleString(), mau: (v) => v.toLocaleString(),
                    arpu: (v) => `¥${v}`, gmv: (v) => `¥${(v / 10000).toFixed(1)}万`,
                    conversion: (v) => `${v}%`, nps: (v) => v.toString()
                  };
                  const progress = (item.value / item.target) * 100;
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 2.2 + index * 0.05 }}
                      className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} text-center`}
                    >
                      <div className={`text-2xl font-bold mb-1 ${progress >= 100 ? 'text-green-500' : progress >= 80 ? 'text-blue-500' : 'text-yellow-500'}`}>
                        {formats[key](item.value)}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>{labels[key]}</div>
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <span className={item.growth >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {item.growth >= 0 ? '↑' : '↓'} {Math.abs(item.growth)}%
                        </span>
                        <span className="text-gray-400">目标: {formats[key](item.target)}</span>
                      </div>
                      <div className="mt-2 h-1 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, progress)}%` }}
                          transition={{ duration: 0.8, delay: 2.25 + index * 0.05 }}
                          className={`h-full rounded-full ${progress >= 100 ? 'bg-green-500' : progress >= 80 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* 数据质量监控 */}
            <motion.div
              className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md mb-8`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2.2 }}
            >
              <h2 className="text-xl font-bold mb-6">数据质量监控</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {dataQualityMetrics.map((item: any, index: number) => (
                  <motion.div
                    key={item.metric}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.25 + index * 0.05 }}
                    className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{item.metric}</span>
                      <span className={`text-xs ${item.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {item.trend >= 0 ? '↑' : '↓'} {Math.abs(item.trend)}%
                      </span>
                    </div>
                    <div className="text-3xl font-bold mb-2">{item.score}%</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>{item.issues} 个问题</span>
                      <div className={`px-2 py-0.5 rounded-full ${item.score >= 99 ? 'bg-green-100 text-green-600' : item.score >= 97 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                        {item.score >= 99 ? '优秀' : item.score >= 97 ? '良好' : '需改进'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 用户来源渠道分析 */}
            <motion.div
              className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md mb-8`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2.25 }}
            >
              <h2 className="text-xl font-bold mb-6">用户来源渠道分析</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`text-left text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className="pb-3 font-medium">渠道</th>
                      <th className="pb-3 font-medium text-right">用户数</th>
                      <th className="pb-3 font-medium text-right">转化率</th>
                      <th className="pb-3 font-medium text-right">获客成本</th>
                      <th className="pb-3 font-medium text-right">ROI</th>
                      <th className="pb-3 font-medium text-center">效率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelSourceData.map((item: any, index: number) => (
                      <motion.tr
                        key={item.channel}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 2.3 + index * 0.05 }}
                        className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-100'} last:border-0`}
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${['bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-pink-500', 'bg-purple-500', 'bg-cyan-500', 'bg-orange-500'][index % 8]}`} />
                            <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>{item.channel}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right">{item.users.toLocaleString()}</td>
                        <td className="py-3 text-right">{item.conversion}%</td>
                        <td className="py-3 text-right">{item.cost > 0 ? `¥${item.cost}` : '-'}</td>
                        <td className="py-3 text-right font-medium text-green-500">{item.roi}</td>
                        <td className="py-3">
                          <div className="flex items-center justify-center">
                            <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (item.conversion / 6) * 100)}%` }}
                                transition={{ duration: 0.8, delay: 2.35 + index * 0.05 }}
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500"
                              />
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* 内容创作趋势 */}
            <motion.div
              className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md mb-8`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2.3 }}
            >
              <h2 className="text-xl font-bold mb-6">内容创作趋势（按类型）</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={contentCreationTrend}>
                    <defs>
                      <linearGradient id="colorImg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorVid" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorAud" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorArt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                    <YAxis tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb', borderRadius: '0.5rem', color: isDark ? '#ffffff' : '#000000' }} />
                    <Legend />
                    <Area type="monotone" dataKey="image" name="图片" stackId="1" stroke="#3b82f6" fill="url(#colorImg)" />
                    <Area type="monotone" dataKey="video" name="视频" stackId="1" stroke="#ef4444" fill="url(#colorVid)" />
                    <Area type="monotone" dataKey="audio" name="音频" stackId="1" stroke="#8b5cf6" fill="url(#colorAud)" />
                    <Area type="monotone" dataKey="article" name="文章" stackId="1" stroke="#10b981" fill="url(#colorArt)" />
                    <Area type="monotone" dataKey="ai" name="AI生成" stackId="1" stroke="#f59e0b" fill="url(#colorAi)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* 用户满意度与A/B测试 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 用户满意度雷达图 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 2.35 }}
              >
                <h2 className="text-xl font-bold mb-6">用户满意度分析</h2>
                <div className="space-y-3">
                  {userSatisfactionData.map((item: any, index: number) => (
                    <div key={item.aspect} className="flex items-center gap-4">
                      <span className={`w-20 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{item.aspect}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.score / 5) * 100}%` }}
                              transition={{ duration: 0.8, delay: 2.4 + index * 0.05 }}
                              className={`h-full rounded-full ${item.score >= 4.5 ? 'bg-green-500' : item.score >= 4.0 ? 'bg-blue-500' : item.score >= 3.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            />
                          </div>
                          <span className="text-sm font-medium w-8">{item.score}</span>
                        </div>
                      </div>
                      <span className={`text-xs ${item.trend > 0 ? 'text-green-500' : item.trend < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                        {item.trend > 0 ? '↑' : item.trend < 0 ? '↓' : '→'} {Math.abs(item.trend)}
                      </span>
                      <span className="text-xs text-gray-400 w-16 text-right">{item.responses}人评价</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* A/B测试结果 */}
              <motion.div
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 2.4 }}
              >
                <h2 className="text-xl font-bold mb-6">A/B测试结果</h2>
                <div className="space-y-3">
                  {abTestResults.map((item: any, index: number) => (
                    <div key={item.test} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-700'}`}>{item.test}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${item.confidence >= 95 ? 'bg-green-100 text-green-600' : item.confidence >= 85 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'}`}>
                          置信度{item.confidence}%
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className={item.winner === 'A' ? 'text-blue-400 font-medium' : isDark ? 'text-gray-400' : 'text-gray-500'}>A方案: {item.variantA}%</span>
                            <span className={item.winner === 'B' ? 'text-purple-400 font-medium' : isDark ? 'text-gray-400' : 'text-gray-500'}>B方案: {item.variantB}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden flex">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.variantA / (item.variantA + item.variantB)) * 100}%` }}
                              transition={{ duration: 0.8, delay: 2.45 + index * 0.05 }}
                              className={`h-full ${item.winner === 'A' ? 'bg-blue-500' : 'bg-gray-400'}`}
                            />
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.variantB / (item.variantA + item.variantB)) * 100}%` }}
                              transition={{ duration: 0.8, delay: 2.45 + index * 0.05 }}
                              className={`h-full ${item.winner === 'B' ? 'bg-purple-500' : 'bg-gray-400'}`}
                            />
                          </div>
                        </div>
                        <div className={`text-sm font-bold ${item.winner === 'A' ? 'text-blue-400' : 'text-purple-400'}`}>
                          {item.winner}胜
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* 系统安全监控 */}
            <motion.div
              className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md mb-8`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2.45 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">系统安全监控</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">安全评分</span>
                  <span className={`text-2xl font-bold ${(securityMetrics?.securityScore || 0) >= 90 ? 'text-green-500' : (securityMetrics?.securityScore || 0) >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {securityMetrics?.securityScore || 0}
                  </span>
                  <span className="text-xs text-gray-400">/100</span>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 安全指标 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="text-2xl font-bold text-red-500 mb-1">{securityMetrics?.vulnerabilities?.high || 0}</div>
                    <div className="text-xs text-gray-500">高危漏洞</div>
                  </div>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="text-2xl font-bold text-yellow-500 mb-1">{securityMetrics?.vulnerabilities?.medium || 0}</div>
                    <div className="text-xs text-gray-500">中危漏洞</div>
                  </div>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="text-2xl font-bold text-green-500 mb-1">{(securityMetrics?.blockedAttacks || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">已拦截攻击</div>
                  </div>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="text-2xl font-bold text-blue-500 mb-1">{securityMetrics?.suspiciousIps || 0}</div>
                    <div className="text-xs text-gray-500">可疑IP</div>
                  </div>
                </div>
                {/* 安全事件列表 */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                  <h3 className="text-sm font-medium mb-3">最近安全事件</h3>
                  <div className="space-y-2">
                    {securityEvents.map((event: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${event.level === 'high' ? 'bg-red-500' : event.level === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                          <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{event.event}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">{event.time}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${event.status === '已拦截' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                            {event.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 队列留存分析表 */}
            <motion.div
              className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md mb-8`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2.5 }}
            >
              <h2 className="text-xl font-bold mb-6">队列留存分析（Cohort Analysis）</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`text-left text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className="pb-3 font-medium">注册批次</th>
                      <th className="pb-3 font-medium text-center">第1周</th>
                      <th className="pb-3 font-medium text-center">第2周</th>
                      <th className="pb-3 font-medium text-center">第3周</th>
                      <th className="pb-3 font-medium text-center">第4周</th>
                      <th className="pb-3 font-medium text-center">第8周</th>
                      <th className="pb-3 font-medium text-center">第12周</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortRetentionData.map((row: any, rowIndex: number) => (
                      <motion.tr
                        key={row.cohort}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 2.55 + rowIndex * 0.05 }}
                        className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-100'} last:border-0`}
                      >
                        <td className="py-3 font-medium">{row.cohort}</td>
                        {['w1', 'w2', 'w3', 'w4', 'w8', 'w12'].map((week, colIndex) => {
                          const value = row[week];
                          return (
                            <td key={week} className="py-3 text-center">
                              {value !== null && value !== undefined ? (
                                <div
                                  className="inline-flex items-center justify-center w-12 h-8 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: `rgba(59, 130, 246, ${value / 100})`,
                                    color: value > 50 ? 'white' : isDark ? '#9ca3af' : '#374151'
                                  }}
                                >
                                  {value}%
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          );
                        })}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* 页面性能分析 */}
            <motion.div
              className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md mb-8`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2.55 }}
            >
              <h2 className="text-xl font-bold mb-6">页面性能分析</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`text-left text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className="pb-3 font-medium">页面</th>
                      <th className="pb-3 font-medium text-right">加载时间</th>
                      <th className="pb-3 font-medium text-right">跳出率</th>
                      <th className="pb-3 font-medium text-right">退出率</th>
                      <th className="pb-3 font-medium text-right">浏览量</th>
                      <th className="pb-3 font-medium text-center">性能评分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagePerformanceData.map((page: any, index: number) => (
                      <motion.tr
                        key={page.page}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 2.6 + index * 0.05 }}
                        className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-100'} last:border-0`}
                      >
                        <td className="py-3 font-medium">{page.page}</td>
                        <td className={`py-3 text-right ${page.loadTime > 1.5 ? 'text-red-500' : page.loadTime > 1.0 ? 'text-yellow-500' : 'text-green-500'}`}>
                          {page.loadTime}s
                        </td>
                        <td className="py-3 text-right">{page.bounceRate}%</td>
                        <td className="py-3 text-right">{page.exitRate}%</td>
                        <td className="py-3 text-right">{page.views.toLocaleString()}</td>
                        <td className="py-3">
                          <div className="flex items-center justify-center">
                            <div className={`px-2 py-0.5 rounded-full text-xs ${page.loadTime < 1.0 && page.bounceRate < 30 ? 'bg-green-100 text-green-600' : page.loadTime < 1.5 && page.bounceRate < 40 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                              {page.loadTime < 1.0 && page.bounceRate < 30 ? '优秀' : page.loadTime < 1.5 && page.bounceRate < 40 ? '良好' : '需优化'}
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* 快速操作 */}
            <motion.div
              className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md mb-6`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <h2 className="text-xl font-bold mb-4">快速操作</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {[
                  { name: '发布活动', icon: 'calendar-plus', color: 'blue', action: () => setActiveTab('campaigns') },
                  { name: '审核作品', icon: 'clipboard-check', color: 'green', action: () => setActiveTab('audit') },
                  { name: '管理用户', icon: 'user-cog', color: 'purple', action: () => setActiveTab('users') },
                  { name: '查看数据', icon: 'chart-line', color: 'orange', action: () => setActiveTab('analytics') },
                  { name: '推广订单', icon: 'bullhorn', color: 'pink', action: () => setActiveTab('promotionOrderManagement') },
                  { name: '品牌任务', icon: 'briefcase', color: 'indigo', action: () => setActiveTab('brandTaskAudit') },
                  { name: 'IP孵化', icon: 'gem', color: 'cyan', action: () => setActiveTab('workSubmissionAudit') },
                  { name: '知识库', icon: 'book', color: 'teal', action: () => setActiveTab('knowledgeBase') },
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">系统状态</h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-sm text-green-500">运行正常</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 text-green-600">
                      <i className="fas fa-server"></i>
                    </div>
                    <div>
                      <span className="text-sm block">系统状态</span>
                      <span className="text-xs text-green-500">运行正常</span>
                    </div>
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    前端服务在线
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      <i className="fas fa-database"></i>
                    </div>
                    <div>
                      <span className="text-sm block">数据库</span>
                      <span className="text-xs text-blue-500">Supabase</span>
                    </div>
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    实时连接
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                      <i className="fas fa-bolt"></i>
                    </div>
                    <div>
                      <span className="text-sm block">实时数据</span>
                      <span className="text-xs text-purple-500">
                        {autoRefreshEnabled ? '自动刷新中' : '手动刷新'}
                      </span>
                    </div>
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {lastRefreshTime ? `更新于 ${lastRefreshTime.toLocaleTimeString()}` : '未更新'}
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                      <i className="fas fa-shield-alt"></i>
                    </div>
                    <div>
                      <span className="text-sm block">安全状态</span>
                      <span className="text-xs text-orange-500">已验证</span>
                    </div>
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    管理员权限
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

        {/* 转盘活动管理页面 */}
        {activeTab === 'lotteryManagement' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <LotteryManagement />
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

        {/* IP 孵化作品审核页面 */}
        {activeTab === 'workSubmissionAudit' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full"
              />
            </div>
          }>
            <WorkSubmissionAudit />
          </Suspense>
        )}

        {/* 商单审核管理页面 */}
        {activeTab === 'orderAudit' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full"
              />
            </div>
          }>
            <OrderAudit />
          </Suspense>
        )}

        {/* 品牌方商单执行监控页面 */}
        {activeTab === 'brandOrderExecution' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full"
              />
            </div>
          }>
            <BrandOrderExecution />
          </Suspense>
        )}

        {/* 推广用户管理页面 */}
        {activeTab === 'promotionUserManagement' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full"
              />
            </div>
          }>
            <PromotionUserManagement />
          </Suspense>
        )}

        {/* 推广订单管理页面 */}
        {activeTab === 'promotionOrderManagement' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full"
              />
            </div>
          }>
            <PromotionOrderManagement />
          </Suspense>
        )}

        {/* 推广订单实施页面 */}
        {activeTab === 'promotionOrderImplementation' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full"
              />
            </div>
          }>
            <PromotionOrderImplementation />
          </Suspense>
        )}

        {/* 推广效果深度分析页面 */}
        {activeTab === 'promotionAnalytics' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full"
              />
            </div>
          }>
            <PromotionAnalytics />
          </Suspense>
        )}

        {/* 高级数据分析大屏页面 */}
        {activeTab === 'advancedAnalytics' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full"
              />
            </div>
          }>
            <AdvancedAnalytics />
          </Suspense>
        )}

        {/* 搜索记录管理页面 */}
        {activeTab === 'searchRecords' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-500 rounded-full"
              />
            </div>
          }>
            <SearchRecordManagement />
          </Suspense>
        )}

        {/* 首页推荐位管理页面 */}
        {activeTab === 'homeRecommendation' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <HomeRecommendationManagement />
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
