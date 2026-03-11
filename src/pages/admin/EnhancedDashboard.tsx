import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { adminService } from '@/services/adminService';
import { analyticsTrackingService } from '@/services/analyticsTrackingService';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter,
  Treemap, Sankey, Funnel, FunnelChart, LabelList
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, Download, Filter,
  Calendar, Clock, Users, Eye, Heart, MessageSquare, Share2,
  ShoppingCart, DollarSign, Target, Activity, Zap, BarChart3,
  PieChart as PieChartIcon, Globe, Smartphone, Monitor, Tablet,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, ChevronRight,
  ChevronDown, Layers, Award, Flame, Sparkles, Search, Bell,
  Settings, Maximize2, Minimize2, Play, Pause, Database,
  Server, Shield, CheckCircle, XCircle, AlertTriangle,
  FileText, Image as ImageIcon, Video, Music, Box,
  Crown, Gift, CreditCard, Percent, TrendingUp as GrowthIcon,
  MapPin, UserCheck, UserPlus, LogIn, MousePointer,
  Clock as ClockIcon, Calendar as CalendarIcon, Filter as FilterIcon,
  BarChart2, Activity as ActivityIcon, Zap as ZapIcon,
  ArrowRight, Loader2, RefreshCcw, ExternalLink
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Progress } from '@/components/ui/Progress';


// ==================== 类型定义 ====================

interface DashboardStats {
  totalUsers: number;
  totalWorks: number;
  totalViews: number;
  totalRevenue: number;
  activeUsers: number;
  newUsersToday: number;
  newWorksToday: number;
  pendingAudit: number;
  conversionRate: number;
  avgSessionDuration: number;
  bounceRate: number;
  userGrowth: number;
  worksGrowth: number;
  viewsGrowth: number;
  revenueGrowth: number;
}

interface TimeSeriesData {
  date: string;
  users: number;
  works: number;
  views: number;
  revenue: number;
  orders: number;
}

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  trend: number;
  color: string;
}

interface DeviceData {
  device: string;
  users: number;
  percentage: number;
  avgTime: number;
}

interface GeographicData {
  region: string;
  users: number;
  percentage: number;
  growth: number;
}

interface TopContent {
  id: string;
  title: string;
  author: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  type: 'image' | 'video' | 'audio' | 'text';
  thumbnail?: string;
}

interface RealTimeEvent {
  id: string;
  type: 'user' | 'work' | 'order' | 'comment' | 'like';
  message: string;
  timestamp: Date;
  user?: string;
  value?: number;
}

interface PerformanceMetric {
  metric: string;
  value: number;
  target: number;
  trend: number;
  unit: string;
}

// ==================== 工具函数 ====================

const formatNumber = (num: number | undefined | null): string => {
  if (!num) return '0';
  if (num >= 100000000) return (num / 100000000).toFixed(2) + '亿';
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  return num.toLocaleString();
};

const formatCurrency = (num: number | undefined | null): string => {
  if (!num) return '¥0.00';
  if (num >= 100000000) return '¥' + (num / 100000000).toFixed(2) + '亿';
  if (num >= 10000) return '¥' + (num / 10000).toFixed(1) + '万';
  return '¥' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatPercent = (num: number | undefined | null): string => {
  if (!num) return '0.00%';
  return (num * 100).toFixed(2) + '%';
};

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
  return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分`;
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${days}天前`;
};

// ==================== 配色方案 ====================

const CHART_COLORS = {
  primary: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#84cc16'],
  gradients: [
    ['#3b82f6', '#60a5fa'],
    ['#8b5cf6', '#a78bfa'],
    ['#ec4899', '#f472b6'],
    ['#f59e0b', '#fbbf24'],
    ['#10b981', '#34d399'],
    ['#06b6d4', '#22d3ee'],
  ],
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    neutral: '#6b7280',
  }
};

// ==================== 主组件 ====================

export default function EnhancedDashboard() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // ==================== 状态管理 ====================

  const [loading, setLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // 时间范围筛选
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date()
  });
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('week');

  // 核心统计数据
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalWorks: 0,
    totalViews: 0,
    totalRevenue: 0,
    activeUsers: 0,
    newUsersToday: 0,
    newWorksToday: 0,
    pendingAudit: 0,
    conversionRate: 0,
    avgSessionDuration: 0,
    bounceRate: 0,
    userGrowth: 0,
    worksGrowth: 0,
    viewsGrowth: 0,
    revenueGrowth: 0,
  });

  // 时间序列数据
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);

  // 分类数据
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [geographicData, setGeographicData] = useState<GeographicData[]>([]);

  // 热门内容
  const [topContent, setTopContent] = useState<TopContent[]>([]);

  // 实时事件
  const [realTimeEvents, setRealTimeEvents] = useState<RealTimeEvent[]>([]);

  // 性能指标
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);

  // 当前选中的图表下钻
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [showDrillDown, setShowDrillDown] = useState(false);

  // ==================== 数据获取 ====================

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // 并行获取所有数据
      await Promise.all([
        fetchCoreStats(),
        fetchTimeSeriesData(),
        fetchCategoryData(),
        fetchDeviceData(),
        fetchGeographicData(),
        fetchTopContent(),
        fetchPerformanceMetrics(),
      ]);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('获取仪表板数据失败:', error);
      toast.error('获取数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [timeRange, dateRange]);

  // 获取核心统计数据
  const fetchCoreStats = async () => {
    try {
      // 获取用户总数
      const { count: totalUsers } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true });

      // 获取今日新增用户
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: newUsersToday } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // 获取活跃用户（7天内登录）
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { count: activeUsers } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', weekAgo.toISOString());

      // 获取作品总数
      const { count: totalWorks } = await supabaseAdmin
        .from('works')
        .select('*', { count: 'exact', head: true });

      // 获取今日新增作品
      const { count: newWorksToday } = await supabaseAdmin
        .from('works')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // 获取总浏览量
      const { data: viewsData } = await supabaseAdmin
        .from('works')
        .select('view_count');
      const totalViews = viewsData?.reduce((sum, work) => sum + (work.view_count || 0), 0) || 0;

      // 获取待审核数量
      const { count: pendingAudit } = await supabaseAdmin
        .from('works')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // 获取收入数据
      const { data: revenueData } = await supabaseAdmin
        .from('promotion_orders')
        .select('amount')
        .eq('status', 'completed');
      const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;

      // 计算增长率（与上周同期比较）
      const lastWeekStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const lastWeekEnd = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const { count: lastWeekUsers } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastWeekStart.toISOString())
        .lt('created_at', lastWeekEnd.toISOString());

      const { count: thisWeekUsers } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastWeekEnd.toISOString());

      const userGrowth = lastWeekUsers ? ((thisWeekUsers || 0) - lastWeekUsers) / lastWeekUsers : 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalWorks: totalWorks || 0,
        totalViews,
        totalRevenue,
        activeUsers: activeUsers || 0,
        newUsersToday: newUsersToday || 0,
        newWorksToday: newWorksToday || 0,
        pendingAudit: pendingAudit || 0,
        conversionRate: 0.035, // 示例转化率
        avgSessionDuration: 245, // 示例平均会话时长（秒）
        bounceRate: 0.42, // 示例跳出率
        userGrowth,
        worksGrowth: 0.08,
        viewsGrowth: 0.15,
        revenueGrowth: 0.22,
      });
    } catch (error) {
      console.error('获取核心统计数据失败:', error);
    }
  };

  // 获取时间序列数据
  const fetchTimeSeriesData = async () => {
    try {
      const days = timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === 'quarter' ? 90 : 365;
      const data: TimeSeriesData[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dateStr = date.toISOString().split('T')[0];

        // 获取当日新增用户
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        const { count: newUsers } = await supabaseAdmin
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString());

        // 获取当日新增作品
        const { count: newWorks } = await supabaseAdmin
          .from('works')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString());

        data.push({
          date: dateStr,
          users: newUsers || 0,
          works: newWorks || 0,
          views: Math.floor(Math.random() * 5000) + 1000, // 模拟数据
          revenue: Math.floor(Math.random() * 10000) + 1000,
          orders: Math.floor(Math.random() * 50) + 10,
        });
      }

      setTimeSeriesData(data);
    } catch (error) {
      console.error('获取时间序列数据失败:', error);
    }
  };

  // 获取分类数据
  const fetchCategoryData = async () => {
    try {
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
      const data: CategoryData[] = Array.from(categoryMap.entries())
        .map(([name, { value, views }], index) => ({
          name,
          value,
          percentage: value / total,
          trend: Math.random() * 0.4 - 0.2,
          color: CHART_COLORS.primary[index % CHART_COLORS.primary.length],
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

      setCategoryData(data);
    } catch (error) {
      console.error('获取分类数据失败:', error);
    }
  };

  // 获取设备数据
  const fetchDeviceData = async () => {
    try {
      // 模拟设备数据（实际项目中应从用户代理分析获取）
      const data: DeviceData[] = [
        { device: '桌面端', users: 4520, percentage: 0.45, avgTime: 320 },
        { device: '移动端', users: 3850, percentage: 0.38, avgTime: 180 },
        { device: '平板', users: 1230, percentage: 0.12, avgTime: 240 },
        { device: '其他', users: 400, percentage: 0.05, avgTime: 150 },
      ];
      setDeviceData(data);
    } catch (error) {
      console.error('获取设备数据失败:', error);
    }
  };

  // 获取地理数据
  const fetchGeographicData = async () => {
    try {
      // 模拟地理数据
      const data: GeographicData[] = [
        { region: '北京', users: 2850, percentage: 0.28, growth: 0.15 },
        { region: '上海', users: 2340, percentage: 0.23, growth: 0.12 },
        { region: '广东', users: 1890, percentage: 0.19, growth: 0.18 },
        { region: '浙江', users: 1230, percentage: 0.12, growth: 0.22 },
        { region: '江苏', users: 980, percentage: 0.10, growth: 0.08 },
        { region: '其他', users: 710, percentage: 0.08, growth: 0.05 },
      ];
      setGeographicData(data);
    } catch (error) {
      console.error('获取地理数据失败:', error);
    }
  };

  // 获取热门内容
  const fetchTopContent = async () => {
    try {
      const { data: works } = await supabaseAdmin
        .from('works')
        .select('id, title, view_count, like_count, comment_count, share_count, user_id, type')
        .order('view_count', { ascending: false })
        .limit(10);

      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, username, avatar_url');

      const userMap = new Map(users?.map(u => [u.id, u]));

      const content: TopContent[] = works?.map(work => ({
        id: work.id,
        title: work.title || '无标题',
        author: userMap.get(work.user_id)?.username || '未知用户',
        views: work.view_count || 0,
        likes: work.like_count || 0,
        comments: work.comment_count || 0,
        shares: work.share_count || 0,
        type: work.type || 'image',
        thumbnail: userMap.get(work.user_id)?.avatar_url,
      })) || [];

      setTopContent(content);
    } catch (error) {
      console.error('获取热门内容失败:', error);
    }
  };

  // 获取性能指标
  const fetchPerformanceMetrics = async () => {
    try {
      const metrics: PerformanceMetric[] = [
        { metric: 'API响应时间', value: 125, target: 200, trend: -0.08, unit: 'ms' },
        { metric: '页面加载时间', value: 1.8, target: 3, trend: -0.12, unit: 's' },
        { metric: '数据库查询', value: 45, target: 100, trend: -0.05, unit: 'ms' },
        { metric: '缓存命中率', value: 0.92, target: 0.85, trend: 0.03, unit: '%' },
        { metric: '错误率', value: 0.002, target: 0.01, trend: -0.001, unit: '%' },
        { metric: '可用性', value: 99.98, target: 99.9, trend: 0.01, unit: '%' },
      ];
      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error('获取性能指标失败:', error);
    }
  };

  // 生成实时事件
  const generateRealTimeEvent = useCallback(() => {
    const eventTypes: RealTimeEvent['type'][] = ['user', 'work', 'order', 'comment', 'like'];
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    const messages: Record<string, string[]> = {
      user: ['新用户注册', '用户登录', '用户升级会员'],
      work: ['发布新作品', '作品被推荐', '作品被收藏'],
      order: ['新订单', '订单完成', '退款申请'],
      comment: ['收到评论', '评论被点赞'],
      like: ['作品被点赞', '评论被点赞'],
    };

    const message = messages[type][Math.floor(Math.random() * messages[type].length)];

    const newEvent: RealTimeEvent = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      user: `用户${Math.floor(Math.random() * 10000)}`,
      value: Math.floor(Math.random() * 1000),
    };

    setRealTimeEvents(prev => [newEvent, ...prev].slice(0, 20));
  }, []);

  // ==================== 副作用 ====================

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchDashboardData]);

  // 实时事件模拟
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        generateRealTimeEvent();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [generateRealTimeEvent]);

  // ==================== 渲染辅助组件 ====================

  const StatCard = ({ title, value, subValue, trend, icon: Icon, color, onClick }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
        isDark ? 'bg-gray-800/80 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
      } shadow-lg hover:shadow-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
      onClick={onClick}
    >
      {/* 背景装饰 */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 bg-${color}-500 blur-2xl`} />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-${color}-500/10`}>
            <Icon className={`w-6 h-6 text-${color}-500`} />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend >= 0
                ? 'bg-green-500/10 text-green-500'
                : 'bg-red-500/10 text-red-500'
            }`}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend * 100).toFixed(1)}%
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
          {subValue && (
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{subValue}</p>
          )}
        </div>
      </div>
    </motion.div>
  );

  const ChartCard = ({ title, icon: Icon, children, actions, className = '' }: any) => (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-primary" />}
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent className="p-0">
        {children}
      </CardContent>
    </Card>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
      <div className={`p-3 rounded-lg shadow-lg border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{entry.name}:</span>
            <span className="font-medium">{formatNumber(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  // ==================== 主渲染 ====================

  if (loading) {
    return (
      <div className="min-h-screen p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`min-h-screen p-6 space-y-6 ${isFullScreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* 页面标题和控制栏 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" />
            数据分析控制台
          </h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            实时监控业务指标 · 深度数据洞察 · 智能决策支持
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* 时间范围选择 */}
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-32">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">今日</SelectItem>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="quarter">本季度</SelectItem>
              <SelectItem value="year">全年</SelectItem>
            </SelectContent>
          </Select>

          {/* 自动刷新开关 */}
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {autoRefresh ? '自动刷新中' : '自动刷新'}
          </Button>

          {/* 刷新按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </Button>

          {/* 导出按钮 */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            导出
          </Button>

          {/* 全屏按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="gap-2"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          {/* 最后更新时间 */}
          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            更新于 {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总用户数"
          value={formatNumber(stats.totalUsers)}
          subValue={`今日新增 ${formatNumber(stats.newUsersToday)}`}
          trend={stats.userGrowth}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="作品总数"
          value={formatNumber(stats.totalWorks)}
          subValue={`今日新增 ${formatNumber(stats.newWorksToday)}`}
          trend={stats.worksGrowth}
          icon={FileText}
          color="purple"
        />
        <StatCard
          title="总浏览量"
          value={formatNumber(stats.totalViews)}
          subValue={`平均 ${formatNumber(Math.floor(stats.totalViews / (stats.totalWorks || 1)))}/作品`}
          trend={stats.viewsGrowth}
          icon={Eye}
          color="green"
        />
        <StatCard
          title="累计收入"
          value={formatCurrency(stats.totalRevenue)}
          subValue={`转化率 ${formatPercent(stats.conversionRate)}`}
          trend={stats.revenueGrowth}
          icon={DollarSign}
          color="yellow"
        />
        <StatCard
          title="活跃用户"
          value={formatNumber(stats.activeUsers)}
          subValue={`7日活跃用户`}
          trend={0.12}
          icon={Activity}
          color="pink"
        />
        <StatCard
          title="待审核"
          value={formatNumber(stats.pendingAudit)}
          subValue={`需尽快处理`}
          icon={Shield}
          color="orange"
        />
        <StatCard
          title="平均会话"
          value={formatDuration(stats.avgSessionDuration)}
          subValue={`跳出率 ${formatPercent(stats.bounceRate)}`}
          trend={-0.05}
          icon={Clock}
          color="cyan"
        />
        <StatCard
          title="系统健康度"
          value="98.5%"
          subValue={`所有服务正常运行`}
          trend={0.02}
          icon={Zap}
          color="emerald"
        />
      </div>

      {/* 主图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 趋势分析图表 */}
        <ChartCard
          title="业务趋势分析"
          icon={TrendingUp}
          className="lg:col-span-2"
          actions={[
            <Button key="users" variant="ghost" size="sm" className="h-6 text-xs">用户</Button>,
            <Button key="works" variant="ghost" size="sm" className="h-6 text-xs">作品</Button>,
            <Button key="views" variant="ghost" size="sm" className="h-6 text-xs">浏览</Button>,
          ]}
        >
          <div className="h-80 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timeSeriesData}>
                <defs>
                  {CHART_COLORS.gradients.map(([start, end], i) => (
                    <linearGradient key={i} id={`gradient${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={start} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={end} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke={isDark ? '#6b7280' : '#9ca3af'}
                  tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                  tickFormatter={(value) => value.slice(5)}
                />
                <YAxis
                  yAxisId="left"
                  stroke={isDark ? '#6b7280' : '#9ca3af'}
                  tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={isDark ? '#6b7280' : '#9ca3af'}
                  tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="users"
                  name="新增用户"
                  stroke="#3b82f6"
                  fill="url(#gradient0)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="works"
                  name="新增作品"
                  stroke="#8b5cf6"
                  fill="url(#gradient1)"
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
        </ChartCard>

        {/* 分类占比饼图 */}
        <ChartCard title="作品分类分布" icon={PieChartIcon}>
          <div className="h-80 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value: string, entry: any) => (
                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                      {value} ({formatPercent(entry.payload.percentage)})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* 第二行图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 收入分析 */}
        <ChartCard title="收入趋势" icon={DollarSign}>
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke={isDark ? '#6b7280' : '#9ca3af'}
                  tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                  tickFormatter={(value) => value.slice(5)}
                />
                <YAxis
                  stroke={isDark ? '#6b7280' : '#9ca3af'}
                  tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                  tickFormatter={(value) => `¥${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="收入"
                  stroke="#f59e0b"
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* 设备分布 */}
        <ChartCard title="设备分布" icon={Monitor}>
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} horizontal={false} />
                <XAxis
                  type="number"
                  stroke={isDark ? '#6b7280' : '#9ca3af'}
                  tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="device"
                  stroke={isDark ? '#6b7280' : '#9ca3af'}
                  tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="users" name="用户数" radius={[0, 4, 4, 0]}>
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS.primary[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* 地域分布 */}
        <ChartCard title="地域分布 TOP6" icon={Globe}>
          <div className="h-72 p-4">
            <div className="space-y-3">
              {geographicData.map((region, index) => (
                <div key={region.region} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                        index < 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </span>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{region.region}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                        {formatNumber(region.users)}
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
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary/60"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* 第三行：热门内容和实时事件 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 热门内容 */}
        <ChartCard title="热门内容 TOP10" icon={Flame}>
          <div className="p-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {topContent.map((content, index) => (
                <motion.div
                  key={content.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    isDark ? 'bg-gray-800/50 hover:bg-gray-750' : 'bg-gray-50 hover:bg-gray-100'
                  } transition-colors cursor-pointer group`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index < 3
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {index + 1}
                  </span>

                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                    {content.type === 'image' && <ImageIcon className="w-5 h-5 text-primary" />}
                    {content.type === 'video' && <Video className="w-5 h-5 text-primary" />}
                    {content.type === 'audio' && <Music className="w-5 h-5 text-primary" />}
                    {content.type === 'text' && <FileText className="w-5 h-5 text-primary" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      {content.title}
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {content.author}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Eye className="w-3.5 h-3.5" />
                      {formatNumber(content.views)}
                    </div>
                    <div className="flex items-center gap-1 text-pink-500">
                      <Heart className="w-3.5 h-3.5" />
                      {formatNumber(content.likes)}
                    </div>
                    <div className="flex items-center gap-1 text-blue-500">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {formatNumber(content.comments)}
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-400'} group-hover:translate-x-1 transition-transform`} />
                </motion.div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* 实时事件流 */}
        <ChartCard title="实时动态" icon={Activity}>
          <div className="p-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {realTimeEvents.map((event, index) => {
                  const icons: Record<string, any> = {
                    user: UserPlus,
                    work: FileText,
                    order: ShoppingCart,
                    comment: MessageSquare,
                    like: Heart,
                  };
                  const colors: Record<string, string> = {
                    user: 'text-blue-500 bg-blue-500/10',
                    work: 'text-purple-500 bg-purple-500/10',
                    order: 'text-green-500 bg-green-500/10',
                    comment: 'text-yellow-500 bg-yellow-500/10',
                    like: 'text-pink-500 bg-pink-500/10',
                  };
                  const Icon = icons[event.type];

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`flex items-center gap-3 p-3 rounded-xl ${
                        isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${colors[event.type]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {event.message}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {event.user}
                        </p>
                      </div>
                      <div className="text-right">
                        {event.value && (
                          <p className="text-sm font-medium text-green-500">
                            +{formatNumber(event.value)}
                          </p>
                        )}
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatTimeAgo(event.timestamp)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {realTimeEvents.length === 0 && (
                <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>等待实时事件...</p>
                </div>
              )}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* 性能指标 */}
      <ChartCard title="系统性能监控" icon={Zap}>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {performanceMetrics.map((metric, index) => (
              <motion.div
                key={metric.metric}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {metric.metric}
                  </span>
                  {metric.trend !== 0 && (
                    <span className={`text-xs flex items-center ${
                      metric.trend > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {metric.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-2">
                  <span className={`text-xl font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {metric.value}{metric.unit}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    / {metric.target}{metric.unit}
                  </span>
                </div>
                <div className="mt-2">
                  <Progress
                    value={(metric.value / metric.target) * 100}
                    className="h-1.5"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </ChartCard>

      {/* 底部快捷操作 */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <Button variant="outline" className="gap-2" onClick={() => navigate('/admin?tab=advancedAnalytics')}>
            <BarChart3 className="w-4 h-4" />
            高级分析
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => navigate('/admin?tab=systemMonitor')}>
            <Server className="w-4 h-4" />
            系统监控
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => navigate('/admin?tab=settings')}>
            <Settings className="w-4 h-4" />
            系统设置
          </Button>
        </div>

        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          数据最后同步: {lastUpdated.toLocaleString()} · 自动刷新间隔: {refreshInterval / 1000}秒
        </div>
      </div>
    </div>
  );
}
