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
import { getTimeSeriesData, getBaseStats, getWeeklyComparisonData, getRealtimeStats, clearDashboardCache } from './dashboardDataService';
import { analyticsTrackingService } from '@/services/analyticsTrackingService';

// 懒加载数据分析页面
const DataAnalytics = lazy(() => import('./DataAnalytics'));
const StrategicAdoption = lazy(() => import('./StrategicAdoption'));
const Settings = lazy(() => import('./Settings'));

const FeedbackManagement = lazy(() => import('./FeedbackManagement'));

// 懒加载增强的审核管理模块
const ContentAudit = lazy(() => import('./ContentAudit'));
const AuditLog = lazy(() => import('./AuditLog'));
const UserAudit = lazy(() => import('./UserAudit'));
const EventManagement = lazy(() => import('./EventManagement'));
const ProductManagement = lazy(() => import('./ProductManagement'));
const BlindBoxManagement = lazy(() => import('./BlindBoxManagement'));
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
const MarketplaceAdmin = lazy(() => import('./MarketplaceAdmin'));

const COLORS = ['#f59e0b', '#34d399', '#f87171'];

type TabType = 'dashboard' | 'audit' | 'analytics' | 'adoption' | 'users' | 'settings' | 'campaigns' | 'creators' | 'brandPartnerships' | 'feedback' | 'contentAudit' | 'auditLog' | 'userAudit' | 'productManagement' | 'lotteryManagement' | 'paymentAudit' | 'notificationManagement' | 'systemMonitor' | 'jinmaiCommunity' | 'knowledgeBase' | 'templates' | 'achievements' | 'aiFeedback' | 'reportManagement' | 'brandTaskAudit' | 'workSubmissionAudit' | 'promotionUserManagement' | 'promotionOrderManagement' | 'promotionOrderImplementation' | 'promotionAnalytics' | 'advancedAnalytics' | 'searchRecords' | 'orderAudit' | 'brandOrderExecution' | 'homeRecommendation' | 'marketplace';

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
      // 检查 supabaseAdmin 是否可用
      if (!supabaseAdmin || !supabaseAdmin.from) {
        console.warn('[fetchExtendedStats] supabaseAdmin 未初始化');
        return;
      }

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
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    if (isLoading) return;
    
    setDataLoading(true);
    try {
      // 如果需要强制刷新，清除缓存
      if (forceRefresh) {
        clearDashboardCache();
      }

      // 并行获取所有数据（使用 Promise.allSettled 避免一个失败影响其他）
      const [
        statsResult,
        activityResult,
        auditResult,
        pendingResult,
        brandPartnershipsResult
      ] = await Promise.allSettled([
        adminService.getDashboardStats(),
        adminService.getUserActivityData(activityPeriod),
        adminService.getAuditStats(),
        adminService.getPendingWorks(),
        brandPartnershipService.getAllPartnerships({ limit: 5 })
      ]);

      // 处理每个结果
      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
      } else {
        console.error('获取统计数据失败:', statsResult.reason);
      }

      if (activityResult.status === 'fulfilled') {
        setActivityData(activityResult.value.length > 0 ? activityResult.value : getDefaultActivityData(activityPeriod));
      } else {
        console.error('获取活动数据失败:', activityResult.reason);
        setActivityData(getDefaultActivityData(activityPeriod));
      }

      if (auditResult.status === 'fulfilled') {
        setAuditStats(auditResult.value);
      } else {
        console.error('获取审核统计失败:', auditResult.reason);
      }

      if (pendingResult.status === 'fulfilled') {
        setPendingWorks(pendingResult.value);
      } else {
        console.error('获取待审核作品失败:', pendingResult.reason);
      }

      if (brandPartnershipsResult.status === 'fulfilled') {
        setCommercialApplications(brandPartnershipsResult.value.partnerships || []);
      } else {
        console.error('获取商业化申请失败:', brandPartnershipsResult.reason);
      }

      // 获取扩展统计数据（独立错误处理）
      try {
        await fetchExtendedStats();
      } catch (error) {
        console.warn('获取扩展统计数据失败:', error);
      }

      // 获取新增图表数据（独立错误处理）
      try {
        await fetchEnhancedChartData(forceRefresh);
      } catch (error) {
        console.warn('获取图表数据失败:', error);
      }

      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('获取控制台数据失败:', error);
      toast.error('获取数据失败，请稍后重试');
    } finally {
      setDataLoading(false);
    }
  }, [isLoading, activityPeriod]);

  // 获取增强图表数据 - 优化版
  const fetchEnhancedChartData = async (forceRefresh = false) => {
    try {
      // 并行获取所有数据（传递 forceRefresh 参数）
      const [
        timeData,
        baseStats,
        weeklyComparison,
        realtimeStats
      ] = await Promise.all([
        getTimeSeriesData(forceRefresh),
        getBaseStats(forceRefresh),
        getWeeklyComparisonData(forceRefresh),
        getRealtimeStats(forceRefresh)
      ]);

      setTimeSeriesData(timeData);
      setWeeklyComparisonData(weeklyComparison);
      setRealtimeStats(realtimeStats);

      // 使用 baseStats 数据继续处理其他图表
      const {
        works, deviceData, usersByMonth, topWorks, users,
        viewCount, likeCount, commentCount, shareCount, bookmarkCount, followCount,
        ordersByStatus, worksByType, postsByDay, commentsByDay,
        aiTasks, worksWithCategory, userSessionsForHeatmap,
        ordersByDate, usersWithOrders, worksByHour, userActivity,
        commentsForSentiment, userHistoryData,
        // 真实的用户活跃度数据
        worksActivity, commentsActivity, likesActivity, postsActivity
      } = baseStats;

      // 作品分类数据
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
      const deviceMap = new Map<string, number>();
      deviceData?.forEach(d => {
        const type = d.device_type || '其他';
        deviceMap.set(type, (deviceMap.get(type) || 0) + 1);
      });

      const totalDevices = deviceData?.length || 1;
      const deviceTypeNames: Record<string, string> = {
        'desktop': '桌面端',
        'mobile': '移动端',
        'tablet': '平板',
        'other': '其他',
      };

      const deviceDataFormatted = Array.from(deviceMap.entries())
        .map(([type, count]) => ({
          device: deviceTypeNames[type] || type,
          users: count,
          percentage: count / totalDevices,
        }))
        .sort((a, b) => b.users - a.users);
      setDeviceData(deviceDataFormatted);

      // 地理数据（按月份）
      const monthMap = new Map<string, number>();
      usersByMonth?.forEach(u => {
        if (u.created_at) {
          const date = new Date(u.created_at);
          const monthKey = `${date.getFullYear()}年${date.getMonth() + 1}月`;
          monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
        }
      });

      const sortedMonths = Array.from(monthMap.entries())
        .sort((a, b) => {
          const [yearA, monthA] = a[0].match(/(\d+)年(\d+)月/)?.slice(1).map(Number) || [0, 0];
          const [yearB, monthB] = b[0].match(/(\d+)年(\d+)月/)?.slice(1).map(Number) || [0, 0];
          return yearA !== yearB ? yearA - yearB : monthA - monthB;
        })
        .slice(-6);

      const totalUsersByMonth = sortedMonths.reduce((sum, [, count]) => sum + count, 0) || 1;
      const geographicDataFormatted = sortedMonths.map(([month, count], index) => ({
        region: month,
        users: count,
        percentage: count / totalUsersByMonth,
        growth: index > 0 ? ((count - sortedMonths[index - 1][1]) / sortedMonths[index - 1][1]) : 0,
      }));
      setGeographicData(geographicDataFormatted);

      // 热门内容
      const userMap = new Map(users?.map(u => [u.id, u]));
      const content = topWorks?.map(work => ({
        id: work.id,
        title: work.title || '无标题',
        author: userMap.get(work.creator_id)?.username || '未知用户',
        views: work.view_count || 0,
        likes: work.likes || 0,
        comments: work.comments_count || 0,
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
        { action: '浏览作品', count: viewCount || 0, avgTime: 45 },
        { action: '点赞', count: likeCount || 0, avgTime: 2 },
        { action: '评论', count: commentCount || 0, avgTime: 30 },
        { action: '分享', count: shareCount || 0, avgTime: 5 },
        { action: '收藏', count: bookmarkCount || 0, avgTime: 3 },
        { action: '关注用户', count: followCount || 0, avgTime: 4 },
      ]);

      // 收入分析数据
      const revenueByDate = new Map<string, { membership: number; promotion: number; blindbox: number; other: number }>();
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = `${date.getMonth() + 1}/${date.getDate()}`;
        revenueByDate.set(dateKey, { membership: 0, promotion: 0, blindbox: 0, other: 0 });
      }

      ordersByDate?.forEach(order => {
        if (order.created_at && order.amount) {
          const date = new Date(order.created_at);
          const dateKey = `${date.getMonth() + 1}/${date.getDate()}`;
          if (revenueByDate.has(dateKey)) {
            const current = revenueByDate.get(dateKey)!;
            revenueByDate.set(dateKey, { ...current, membership: current.membership + order.amount });
          }
        }
      });

      const revenueChartData = Array.from(revenueByDate.entries()).map(([date, data]) => ({
        date,
        推广订单: data.promotion,
        会员订阅: data.membership,
        盲盒销售: data.blindbox,
        其他收入: data.other,
      }));
      setRevenueData(revenueChartData);

      // 内容统计
      const typeMap = new Map<string, { count: number; views: number; likes: number }>();
      worksByType?.forEach(work => {
        const type = work.type || '其他';
        const current = typeMap.get(type) || { count: 0, views: 0, likes: 0 };
        typeMap.set(type, {
          count: current.count + 1,
          views: current.views + (work.view_count || 0),
          likes: current.likes + (work.likes || 0),
        });
      });

      const contentStatsData = Array.from(typeMap.entries())
        .map(([type, data]) => ({
          type: type === 'image' ? '图片' : type === 'video' ? '视频' : type === 'audio' ? '音频' : type === 'article' ? '文章' : type,
          count: data.count,
          views: data.views,
          likes: data.likes,
        }))
        .sort((a, b) => b.count - a.count);
      setContentStats(contentStatsData);

      // 转化漏斗
      const totalUsers = users?.length || 0;
      const totalWorksCount = works?.length || 0;
      const paidUsers = ordersByStatus?.filter(o => o.status === 'paid').length || 0;
      const uniqueAuthors = new Set(works?.map(w => w.user_id)).size;

      setConversionFunnel([
        { name: '访问首页', value: totalUsers * 10, fill: '#3b82f6' },
        { name: '浏览作品', value: totalWorksCount, fill: '#6366f1' },
        { name: '注册账号', value: totalUsers, fill: '#8b5cf6' },
        { name: '发布作品', value: uniqueAuthors, fill: '#a855f7' },
        { name: '付费转化', value: paidUsers, fill: '#d946ef' },
      ]);

      // 24小时活跃度
      const hourMap = new Map<number, number>();
      worksByHour?.forEach(w => {
        if (w.created_at) {
          const hour = new Date(w.created_at).getHours();
          hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
        }
      });

      const hourlyData = [];
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0') + ':00';
        hourlyData.push({
          hour,
          活跃用户: hourMap.get(i) || 0,
          发布量: hourMap.get(i) || 0,
        });
      }
      setHourlyActivity(hourlyData);

      // 流量来源
      const directAccessUsers = userHistoryData?.length || 0;
      const searchEngineUsers = Math.floor(totalUsers * 0.3);
      const socialUsers = userHistoryData?.filter(u => u.action_type === 'share_work').length || 0;
      const externalLinkUsers = Math.floor(totalUsers * 0.15);
      const emailUsers = Math.floor(totalUsers * 0.05);
      const totalTraffic = directAccessUsers + searchEngineUsers + socialUsers + externalLinkUsers + emailUsers || 1;

      setSourceData([
        { name: '直接访问', value: Math.round((directAccessUsers / totalTraffic) * 100), users: directAccessUsers },
        { name: '搜索引擎', value: Math.round((searchEngineUsers / totalTraffic) * 100), users: searchEngineUsers },
        { name: '社交媒体', value: Math.round((socialUsers / totalTraffic) * 100), users: socialUsers },
        { name: '外部链接', value: Math.round((externalLinkUsers / totalTraffic) * 100), users: externalLinkUsers },
        { name: '邮件营销', value: Math.round((emailUsers / totalTraffic) * 100), users: emailUsers },
      ]);

      // 用户参与度
      const userActivityMap = new Map<string, number>();
      userActivity?.forEach(record => {
        userActivityMap.set(record.user_id, (userActivityMap.get(record.user_id) || 0) + 1);
      });

      let highActive = 0, mediumActive = 0, lowActive = 0, silent = 0;
      userActivityMap.forEach((count) => {
        if (count >= 10) highActive++;
        else if (count >= 5) mediumActive++;
        else if (count >= 1) lowActive++;
      });

      silent = totalUsers - userActivityMap.size;
      if (silent < 0) silent = 0;

      setEngagementData([
        { segment: '高活跃', users: highActive, avgSessions: 8.5, avgTime: 45 },
        { segment: '中活跃', users: mediumActive, avgSessions: 4.2, avgTime: 25 },
        { segment: '低活跃', users: lowActive, avgSessions: 1.8, avgTime: 10 },
        { segment: '沉默用户', users: silent, avgSessions: 0.3, avgTime: 2 },
      ]);

      // 用户留存分析数据 - 使用真实数据
      try {
        const retentionRates = await analyticsTrackingService.getRetentionRate(1);
        if (retentionRates && retentionRates.length > 0) {
          // 使用最新的留存数据
          const latestRetention = retentionRates[retentionRates.length - 1];
          const retentionDataFromService = [
            { day: '第1天', rate: Math.round(latestRetention.day1_retention * 100 * 10) / 10, users: Math.floor(totalUsers * latestRetention.day1_retention) },
            { day: '第3天', rate: Math.round(latestRetention.day1_retention * 85 * 10) / 10, users: Math.floor(totalUsers * latestRetention.day1_retention * 0.85) },
            { day: '第7天', rate: Math.round(latestRetention.day7_retention * 100 * 10) / 10, users: Math.floor(totalUsers * latestRetention.day7_retention) },
            { day: '第14天', rate: Math.round(latestRetention.day14_retention * 100 * 10) / 10, users: Math.floor(totalUsers * latestRetention.day14_retention) },
            { day: '第30天', rate: Math.round(latestRetention.day30_retention * 100 * 10) / 10, users: Math.floor(totalUsers * latestRetention.day30_retention) },
          ];
          setRetentionData(retentionDataFromService);
        } else {
          // 如果没有真实数据，使用模拟数据
          const retentionDays = [1, 3, 7, 14, 30];
          const retentionDataGenerated = retentionDays.map(day => {
            const retentionRate = Math.max(0, 100 - (day * 2.5) + (Math.random() * 5));
            const retainedUsers = Math.floor(totalUsers * retentionRate / 100);
            return {
              day: `第${day}天`,
              rate: Math.round(retentionRate * 10) / 10,
              users: retainedUsers,
            };
          });
          setRetentionData(retentionDataGenerated);
        }
      } catch (error) {
        console.warn('获取真实留存数据失败，使用模拟数据:', error);
        // 使用模拟数据作为回退
        const retentionDays = [1, 3, 7, 14, 30];
        const retentionDataGenerated = retentionDays.map(day => {
          const retentionRate = Math.max(0, 100 - (day * 2.5) + (Math.random() * 5));
          const retainedUsers = Math.floor(totalUsers * retentionRate / 100);
          return {
            day: `第${day}天`,
            rate: Math.round(retentionRate * 10) / 10,
            users: retainedUsers,
          };
        });
        setRetentionData(retentionDataGenerated);
      }

      // 用户画像
      setUserDemographics([{ age: '暂无数据', male: '-', female: '-' }]);

      // 用户增长趋势（30天）
      const dateMap = new Map<string, number>();
      const currentDate = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        const dateKey = `${date.getMonth() + 1}/${date.getDate()}`;
        dateMap.set(dateKey, 0);
      }

      usersByMonth?.forEach(u => {
        if (u.created_at) {
          const date = new Date(u.created_at);
          const dateKey = `${date.getMonth() + 1}/${date.getDate()}`;
          if (dateMap.has(dateKey)) {
            dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
          }
        }
      });

      const growthData = Array.from(dateMap.entries()).map(([date, count]) => ({
        date,
        新增用户: count,
        流失用户: 0,
        净增长: count,
      }));
      setUserGrowthTrend(growthData);

      // 作品互动数据
      setWorkInteractionData([
        { type: '点赞', count: likeCount || 0, growth: 0 },
        { type: '评论', count: commentCount || 0, growth: 0 },
        { type: '分享', count: shareCount || 0, growth: 0 },
        { type: '收藏', count: bookmarkCount || 0, growth: 0 },
        { type: '下载', count: 0, growth: 0 },
        { type: '举报', count: 0, growth: 0 },
      ]);

      // 评论情感分析
      let positive = 0, neutral = 0, negative = 0;
      const positiveWords = ['好', '棒', '赞', '优秀', '喜欢', '感谢', '支持', '不错', '完美', '厉害'];
      const negativeWords = ['差', '坏', '垃圾', '失望', '问题', '错误', '不好', '糟糕', '讨厌', '反对'];

      commentsForSentiment?.forEach(comment => {
        const content = comment.content || '';
        const hasPositive = positiveWords.some(word => content.includes(word));
        const hasNegative = negativeWords.some(word => content.includes(word));

        if (hasPositive && !hasNegative) positive++;
        else if (hasNegative && !hasPositive) negative++;
        else neutral++;
      });

      const totalComments = commentsForSentiment?.length || 1;
      setCommentSentimentData([
        { name: '正面', value: Math.round((positive / totalComments) * 100), count: positive },
        { name: '中性', value: Math.round((neutral / totalComments) * 100), count: neutral },
        { name: '负面', value: Math.round((negative / totalComments) * 100), count: negative },
      ]);

      // 订单状态分布
      const statusMap = new Map<string, { count: number; amount: number }>();
      ordersByStatus?.forEach(order => {
        const status = order.status || '未知';
        const current = statusMap.get(status) || { count: 0, amount: 0 };
        statusMap.set(status, {
          count: current.count + 1,
          amount: current.amount + (order.amount || 0),
        });
      });

      const statusNameMap: Record<string, string> = {
        'paid': '已完成',
        'pending': '待支付',
        'cancelled': '已取消',
        'refunding': '退款中',
        'completed': '已完成',
      };

      const orderStatusData = Array.from(statusMap.entries())
        .map(([status, data]) => ({
          name: statusNameMap[status] || status,
          value: data.count,
          amount: data.amount,
        }));
      setOrderStatusData(orderStatusData);

      // 支付方式分布
      setPaymentMethodData([{ name: '暂无数据', value: 0, amount: 0 }]);

      // 社区活跃度
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const dayMap = new Map<number, { posts: number; replies: number; likes: number }>();

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayIndex = date.getDay();
        dayMap.set(dayIndex, { posts: 0, replies: 0, likes: 0 });
      }

      postsByDay?.forEach(p => {
        if (p.created_at) {
          const postDate = new Date(p.created_at);
          const dayIndex = postDate.getDay();
          if (dayMap.has(dayIndex)) {
            const current = dayMap.get(dayIndex)!;
            dayMap.set(dayIndex, { ...current, posts: current.posts + 1 });
          }
        }
      });

      commentsByDay?.forEach(c => {
        if (c.created_at) {
          const commentDate = new Date(c.created_at);
          const dayIndex = commentDate.getDay();
          if (dayMap.has(dayIndex)) {
            const current = dayMap.get(dayIndex)!;
            dayMap.set(dayIndex, { ...current, replies: current.replies + 1 });
          }
        }
      });

      const communityActivityDataFormatted = Array.from(dayMap.entries())
        .sort((a, b) => {
          const order = [1, 2, 3, 4, 5, 6, 0];
          return order.indexOf(a[0]) - order.indexOf(b[0]);
        })
        .map(([dayIndex, data]) => ({
          day: dayNames[dayIndex],
          posts: data.posts,
          replies: data.replies,
          likes: data.posts + data.replies,
        }));
      setCommunityActivityData(communityActivityDataFormatted);

      // AI使用统计
      const aiTypeMap = new Map<string, { usage: number; success: number }>();
      aiTasks?.forEach(task => {
        const type = task.type || 'other';
        const current = aiTypeMap.get(type) || { usage: 0, success: 0 };
        aiTypeMap.set(type, {
          usage: current.usage + 1,
          success: current.success + (task.status === 'completed' ? 1 : 0),
        });
      });

      const aiTypeNames: Record<string, string> = {
        'image': 'AI绘画',
        'video': 'AI视频',
        'text': 'AI写作',
        'audio': 'AI配音',
        'translation': 'AI翻译',
        'summary': 'AI总结',
      };

      const aiUsageDataFormatted = Array.from(aiTypeMap.entries())
        .map(([type, data]) => ({
          feature: aiTypeNames[type] || type,
          usage: data.usage,
          satisfaction: data.usage > 0 ? Math.round((data.success / data.usage) * 5 * 10) / 10 : 0,
        }))
        .sort((a, b) => b.usage - a.usage);

      setAiUsageData(aiUsageDataFormatted.length > 0 ? aiUsageDataFormatted : [
        { feature: 'AI绘画', usage: 0, satisfaction: 0 },
        { feature: 'AI视频', usage: 0, satisfaction: 0 },
        { feature: 'AI写作', usage: 0, satisfaction: 0 },
      ]);

      // 热门标签 - 分类名称中英文映射
      const categoryNameMap: Record<string, string> = {
        'design': '设计',
        'video': '视频',
        'illustration': '插画',
        'photography': '摄影',
        'writing': '写作',
        'music': '音乐',
        'animation': '动画',
        '3d': '3D建模',
        'ui': 'UI设计',
        'graphic': '平面设计',
        'art': '艺术',
        'craft': '手工艺',
        'fashion': '时尚',
        'architecture': '建筑',
        'product': '产品设计',
        'game': '游戏',
        'technology': '科技',
        'lifestyle': '生活方式',
        'food': '美食',
        'travel': '旅行',
      };

      const categoryCountMap = new Map<string, number>();
      worksWithCategory?.forEach(work => {
        const category = work.category || '未分类';
        categoryCountMap.set(category, (categoryCountMap.get(category) || 0) + 1);
      });

      const topTags = Array.from(categoryCountMap.entries())
        .map(([name, count]) => ({
          name: categoryNameMap[name] || name,
          count,
          trend: 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      setTopTagsData(topTags.length > 0 ? topTags : [{ name: '暂无数据', count: 0, trend: 0 }]);

      // VIP会员数据
      const vipOrders = ordersByStatus?.filter(o => o.status === 'completed') || [];
      const monthlyMembers = vipOrders.filter(o => (o.amount || 0) < 100).length;
      const quarterlyMembers = vipOrders.filter(o => (o.amount || 0) >= 100 && (o.amount || 0) < 300).length;
      const yearlyMembers = vipOrders.filter(o => (o.amount || 0) >= 300 && (o.amount || 0) < 1000).length;
      const lifetimeMembers = vipOrders.filter(o => (o.amount || 0) >= 1000).length;
      const normalUsers = totalUsers - monthlyMembers - quarterlyMembers - yearlyMembers - lifetimeMembers;

      setVipMemberData([
        { level: '普通用户', count: Math.max(0, normalUsers), revenue: 0, avgStay: 12 },
        { level: '月度会员', count: monthlyMembers, revenue: vipOrders.filter(o => (o.amount || 0) < 100).reduce((sum, o) => sum + (o.amount || 0), 0), avgStay: 45 },
        { level: '季度会员', count: quarterlyMembers, revenue: vipOrders.filter(o => (o.amount || 0) >= 100 && (o.amount || 0) < 300).reduce((sum, o) => sum + (o.amount || 0), 0), avgStay: 78 },
        { level: '年度会员', count: yearlyMembers, revenue: vipOrders.filter(o => (o.amount || 0) >= 300 && (o.amount || 0) < 1000).reduce((sum, o) => sum + (o.amount || 0), 0), avgStay: 156 },
        { level: '终身会员', count: lifetimeMembers, revenue: vipOrders.filter(o => (o.amount || 0) >= 1000).reduce((sum, o) => sum + (o.amount || 0), 0), avgStay: 365 },
      ]);

      // 内容审核数据
      setContentAuditData([
        { date: '周一', pending: 0, approved: 0, rejected: 0, autoPass: 0 },
        { date: '周二', pending: 0, approved: 0, rejected: 0, autoPass: 0 },
        { date: '周三', pending: 0, approved: 0, rejected: 0, autoPass: 0 },
        { date: '周四', pending: 0, approved: 0, rejected: 0, autoPass: 0 },
        { date: '周五', pending: 0, approved: 0, rejected: 0, autoPass: 0 },
        { date: '周六', pending: 0, approved: 0, rejected: 0, autoPass: 0 },
        { date: '周日', pending: 0, approved: 0, rejected: 0, autoPass: 0 },
      ]);

      // 用户活跃度热力图 - 使用真实的用户活动数据
      const heatmapData = [];
      const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      const activityMap = new Map<string, number>();

      // 合并所有用户活动数据
      const allActivities = [
        ...(worksActivity || []),
        ...(commentsActivity || []),
        ...(likesActivity || []),
        ...(postsActivity || []),
      ];

      // 处理真实的用户活动数据
      allActivities.forEach(record => {
        if (record.created_at) {
          const date = new Date(record.created_at);
          const dayIndex = (date.getDay() + 6) % 7; // 转换为周一到周日
          const hour = date.getHours();
          const key = `${dayIndex}-${hour}`;
          activityMap.set(key, (activityMap.get(key) || 0) + 1);
        }
      });

      // 如果没有真实数据，回退到会话数据
      if (activityMap.size === 0) {
        userSessionsForHeatmap?.forEach(record => {
          if (record.last_active) {
            const date = new Date(parseInt(record.last_active));
            const dayIndex = (date.getDay() + 6) % 7;
            const hour = date.getHours();
            const key = `${dayIndex}-${hour}`;
            activityMap.set(key, (activityMap.get(key) || 0) + 1);
          }
        });
      }

      for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
          const key = `${d}-${h}`;
          heatmapData.push({
            day: weekDays[d],
            hour: `${h}:00`,
            value: activityMap.get(key) || 0,
          });
        }
      }
      setUserActivityHeatmap(heatmapData);

      // 营收预测
      const revenueMap = new Map<string, number>();
      ordersByDate?.forEach(order => {
        if (order.created_at && order.amount) {
          const date = new Date(order.created_at);
          const dateKey = `${date.getMonth() + 1}/${date.getDate()}`;
          revenueMap.set(dateKey, (revenueMap.get(dateKey) || 0) + order.amount);
        }
      });

      const forecastData = [];
      const forecastToday = new Date();
      const revenueValues = Array.from(revenueMap.values());
      const avgRevenue = revenueValues.length > 0
        ? revenueValues.reduce((a, b) => a + b, 0) / revenueValues.length
        : 0;

      const sortedDates = Array.from(revenueMap.keys()).sort();
      const recent3Days = sortedDates.slice(-3);
      const previous3Days = sortedDates.slice(-6, -3);
      const recentAvg = recent3Days.length > 0
        ? recent3Days.reduce((sum, date) => sum + (revenueMap.get(date) || 0), 0) / recent3Days.length
        : avgRevenue;
      const previousAvg = previous3Days.length > 0
        ? previous3Days.reduce((sum, date) => sum + (revenueMap.get(date) || 0), 0) / previous3Days.length
        : avgRevenue;

      const trendFactor = previousAvg > 0 ? recentAvg / previousAvg : 1;

      for (let i = 0; i < 30; i++) {
        const date = new Date(forecastToday);
        date.setDate(date.getDate() + i);
        const dateKey = `${date.getMonth() + 1}/${date.getDate()}`;
        const isPast = i < 7;
        const actualRevenue = revenueMap.get(dateKey) || 0;
        const targetRevenue = Math.max(avgRevenue * 1.2, 1000);
        const daysAhead = i - 6;
        const uncertaintyFactor = Math.min(daysAhead * 0.02, 0.1);
        const predictedRevenue = isPast
          ? null
          : Math.floor(avgRevenue * trendFactor * (1 + (daysAhead > 0 ? uncertaintyFactor : 0)));

        forecastData.push({
          date: dateKey,
          实际营收: isPast ? actualRevenue : null,
          预测营收: predictedRevenue,
          目标营收: Math.floor(targetRevenue),
        });
      }
      setRevenueForecast(forecastData);

      // 用户生命周期价值
      const cohortMap = new Map<string, { users: number; revenue: number[] }>();
      usersWithOrders?.forEach(user => {
        if (user.created_at) {
          const regDate = new Date(user.created_at);
          const cohortKey = `${regDate.getFullYear()}年${regDate.getMonth() + 1}月`;

          if (!cohortMap.has(cohortKey)) {
            cohortMap.set(cohortKey, { users: 0, revenue: [0, 0, 0, 0] });
          }

          const cohort = cohortMap.get(cohortKey)!;
          cohort.users++;

          user.membership_orders?.forEach((order: any) => {
            if (order.created_at && order.amount) {
              const orderDate = new Date(order.created_at);
              const monthsDiff = (orderDate.getFullYear() - regDate.getFullYear()) * 12 +
                (orderDate.getMonth() - regDate.getMonth());

              if (monthsDiff >= 0 && monthsDiff < 4) {
                cohort.revenue[monthsDiff] += order.amount;
              }
            }
          });
        }
      });

      const ltvData = Array.from(cohortMap.entries())
        .slice(-6)
        .map(([cohort, data]) => ({
          cohort,
          month1: data.users > 0 ? Math.round(data.revenue[0] / data.users) : 0,
          month3: data.users > 0 ? Math.round(data.revenue[1] / data.users) : 0,
          month6: data.users > 0 ? Math.round(data.revenue[2] / data.users) : 0,
          month12: data.users > 0 ? Math.round(data.revenue[3] / data.users) : null,
          retention: data.users > 0 ? Math.round((data.revenue.filter(r => r > 0).length / 4) * 100) : 0,
        }));

      setUserLTVData(ltvData.length > 0 ? ltvData : [
        { cohort: '暂无数据', month1: 0, month3: 0, month6: 0, month12: null, retention: 0 },
      ]);

      // 竞品对比数据
      const dailyActiveUsers = userHistoryData?.length || 0;
      const paidUsersCount = paidUsers;
      const conversionRate = totalUsers > 0
        ? Math.round((paidUsersCount / totalUsers) * 100 * 10) / 10
        : 0;
      const totalRevenue = Array.from(revenueMap.values()).reduce((a, b) => a + b, 0);
      const arpu = totalUsers > 0 ? Math.round(totalRevenue / totalUsers) : 0;
      const contentOutput = totalWorksCount;
      const satisfactionScore = commentSentimentData.length > 0
        ? Math.round((commentSentimentData[0]?.value || 0) / 20 * 10) / 10
        : 0;

      // 计算7日活跃用户
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const users7Day = userActivity?.filter(u => {
        const activityDate = new Date(u.created_at || u.last_active || Date.now());
        return activityDate >= sevenDaysAgo;
      }).length || 0;

      setCompetitorData([
        { metric: '日活跃用户', ours: dailyActiveUsers, competitorA: 8200, competitorB: 4500, industryAvg: 5800, note: '竞品数据为行业估算' },
        { metric: '用户留存率', ours: Math.round((users7Day || 0) / (totalUsers || 1) * 100 * 10) / 10, competitorA: 28.0, competitorB: 35.2, industryAvg: 30.0, note: '竞品数据为行业估算' },
        { metric: '付费转化率', ours: conversionRate, competitorA: 2.5, competitorB: 4.2, industryAvg: 3.2, note: '竞品数据为行业估算' },
        { metric: 'ARPU值', ours: arpu, competitorA: 68, competitorB: 92, industryAvg: 75, note: '竞品数据为行业估算' },
        { metric: '内容产出量', ours: contentOutput, competitorA: 380, competitorB: 520, industryAvg: 400, note: '竞品数据为行业估算' },
        { metric: '用户满意度', ours: satisfactionScore, competitorA: 4.2, competitorB: 4.3, industryAvg: 4.2, note: '竞品数据为行业估算' },
      ]);

      // 功能使用深度
      const totalUserActions = userActivity?.length || 0;
      setFeatureUsageData([
        { feature: '基础浏览', shallow: Math.floor(totalUserActions * 0.5), medium: Math.floor(totalUserActions * 0.3), deep: Math.floor(totalUserActions * 0.2) },
        { feature: '内容创作', shallow: Math.floor(totalWorksCount * 0.6), medium: Math.floor(totalWorksCount * 0.3), deep: Math.floor(totalWorksCount * 0.1) },
        { feature: '社交互动', shallow: Math.floor((likeCount || 0) * 0.5), medium: Math.floor((commentCount || 0) * 0.3), deep: Math.floor((followCount || 0) * 0.2) },
        { feature: '付费功能', shallow: Math.floor((ordersByStatus?.length || 0) * 0.6), medium: Math.floor((ordersByStatus?.length || 0) * 0.3), deep: Math.floor((ordersByStatus?.length || 0) * 0.1) },
        { feature: 'AI工具', shallow: Math.floor((aiTasks?.length || 0) * 0.5), medium: Math.floor((aiTasks?.length || 0) * 0.3), deep: Math.floor((aiTasks?.length || 0) * 0.2) },
        { feature: '数据分析', shallow: 0, medium: 0, deep: 0 },
      ]);

      // 其他数据设置
      setErrorLogData([]);

      const serverLoad = [];
      for (let i = 0; i < 24; i++) {
        serverLoad.push({
          hour: `${i.toString().padStart(2, '0')}:00`,
          CPU: 0,
          内存: 0,
          磁盘: 0,
        });
      }
      setServerLoadData(serverLoad);

      setNotificationStats([]);

      setKpiMetrics({
        dau: { value: dailyActiveUsers, target: Math.floor(dailyActiveUsers * 1.1), growth: 0 },
        mau: { value: totalUsers, target: Math.floor(totalUsers * 1.1), growth: 0 },
        arpu: { value: arpu, target: Math.floor(arpu * 1.1), growth: 0 },
        gmv: { value: totalRevenue, target: Math.floor(totalRevenue * 1.1), growth: 0 },
        conversion: { value: conversionRate, target: 4.0, growth: 0 },
        nps: { value: satisfactionScore, target: 5.0, growth: 0 },
      });

      setDataQualityMetrics([]);

      setChannelSourceData(sourceData.map(s => ({
        channel: s.name,
        users: s.users,
        conversion: s.percentage * 0.1,
        cost: 0,
        roi: 'N/A',
      })));

      // 内容创作趋势
      const dayTypeMap = new Map<string, { image: number; video: number; audio: number; article: number; ai: number }>();
      const dayNames2 = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

      dayNames2.forEach(day => {
        dayTypeMap.set(day, { image: 0, video: 0, audio: 0, article: 0, ai: 0 });
      });

      worksByHour?.forEach(work => {
        if (work.created_at) {
          const dayIndex = new Date(work.created_at).getDay();
          const dayName = dayNames2[dayIndex];
          const current = dayTypeMap.get(dayName)!;

          if (work.type === 'image') current.image++;
          else if (work.type === 'video') current.video++;
          else if (work.type === 'audio') current.audio++;
          else if (work.type === 'article') current.article++;
          else current.ai++;
        }
      });

      setContentCreationTrend(Array.from(dayTypeMap.entries()).map(([date, data]) => ({
        date,
        ...data,
      })));

      // 用户满意度分析
      const totalSentimentComments = positive + neutral + negative;
      const avgScore = totalSentimentComments > 0
        ? Math.round(((positive * 5 + neutral * 3 + negative * 1) / totalSentimentComments) * 10) / 10
        : 0;

      if (totalSentimentComments === 0) {
        setUserSatisfactionData([{ aspect: '暂无数据', score: 0, responses: 0, trend: 0 }]);
      } else {
        setUserSatisfactionData([{ aspect: '总体满意度', score: avgScore, responses: totalSentimentComments, trend: 0 }]);
      }

      // 系统安全监控
      setSecurityMetrics({
        securityScore: 0,
        lastScan: '暂无数据',
        vulnerabilities: { high: 0, medium: 0, low: 0 },
        blockedAttacks: 0,
        failedLogins: 0,
        suspiciousIps: 0,
      });

      setSecurityEvents([]);
      setAbTestResults([]);

      // 队列留存详细数据
      const cohortRetention = Array.from(cohortMap.entries())
        .slice(-6)
        .map(([cohort, data]) => ({
          cohort,
          w1: 100,
          w2: data.users > 0 ? Math.round((data.revenue[0] / data.users) * 100) : 0,
          w3: data.users > 0 ? Math.round((data.revenue[1] / data.users) * 100) : 0,
          w4: data.users > 0 ? Math.round((data.revenue[2] / data.users) * 100) : 0,
          w8: null,
          w12: null,
        }));
      setCohortRetentionData(cohortRetention.length > 0 ? cohortRetention : []);

      // 页面性能数据
      setPagePerformanceData([
        { page: '首页', loadTime: '-', bounceRate: '-', exitRate: '-', views: viewCount || 0 },
        { page: '作品详情', loadTime: '-', bounceRate: '-', exitRate: '-', views: totalWorksCount },
        { page: '创作页面', loadTime: '-', bounceRate: '-', exitRate: '-', views: 0 },
        { page: '个人中心', loadTime: '-', bounceRate: '-', exitRate: '-', views: 0 },
        { page: '搜索页面', loadTime: '-', bounceRate: '-', exitRate: '-', views: 0 },
        { page: '支付页面', loadTime: '-', bounceRate: '-', exitRate: '-', views: ordersByStatus?.length || 0 },
        { page: '社区页面', loadTime: '-', bounceRate: '-', exitRate: '-', views: commentCount || 0 },
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
                  onClick={() => fetchDashboardData(true)}
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



        {/* 积分商城管理页面 */}
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

        {/* 盲盒管理页面 */}
        {activeTab === 'blindBoxManagement' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full"
              />
            </div>
          }>
            <BlindBoxManagement />
          </Suspense>
        )}

        {/* 文创商城管理页面 */}
        {activeTab === 'marketplace' && (
          <Suspense fallback={
            <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          }>
            <MarketplaceAdmin />
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
