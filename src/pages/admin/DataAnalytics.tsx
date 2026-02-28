import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { adminService } from '@/services/adminService';
import { supabase } from '@/lib/supabaseClient';
import AdvancedAnalytics from './AdvancedAnalytics';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Download,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Image,
  AlertTriangle,
  Bell,
  Filter,
  Clock,
  Zap,
  ChevronDown,
  X,
  CheckCircle,
} from 'lucide-react';

// 图表颜色配置
const CHART_COLORS = {
  primary: '#ef4444',    // 红色
  secondary: '#8b5cf6',  // 紫色
  tertiary: '#06b6d4',   // 青色
  quaternary: '#f59e0b', // 橙色
  success: '#10b981',    // 绿色
  warning: '#f59e0b',    // 黄色
  danger: '#ef4444',     // 红色
  info: '#3b82f6',       // 蓝色
};

const PIE_COLORS = ['#ef4444', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6'];

// 时间范围类型
type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';

// 图表类型
type ChartType = 'line' | 'bar' | 'area' | 'composed';

// 数据指标类型
type MetricType = 'users' | 'works' | 'views' | 'likes';

// 业务维度筛选
type BusinessFilter = 'all' | 'category' | 'creator_level' | 'content_type';

// 趋势数据类型
interface TrendData {
  date: string;
  users: number;
  works: number;
  views: number;
  likes: number;
  cumulativeUsers?: number;
  cumulativeWorks?: number;
}

// 设备分布数据类型
interface DeviceData {
  name: string;
  value: number;
  count?: number;
}

// 热门内容数据类型
interface TopContent {
  id: string;
  title: string;
  views: number;
  likes: number;
  author: string;
}

// 预警规则类型
interface AlertRule {
  id: string;
  metric: MetricType;
  threshold: number;
  operator: 'gt' | 'lt';
  enabled: boolean;
}

// 预警记录类型
interface Alert {
  id: string;
  ruleId: string;
  metric: MetricType;
  message: string;
  severity: 'warning' | 'error';
  timestamp: number;
  acknowledged: boolean;
}

export default function DataAnalytics() {
  const { isDark } = useTheme();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [chartType, setChartType] = useState<ChartType>('line');
  const [activeMetric, setActiveMetric] = useState<MetricType>('users');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<TrendData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(true);
  const [isAdvancedView, setIsAdvancedView] = useState(false);

  // 业务维度筛选
  const [businessFilter, setBusinessFilter] = useState<BusinessFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // 表格分页状态
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);

  // 详细数据图表状态
  const [detailChartMetric, setDetailChartMetric] = useState<string>('users');
  const detailChartColors: Record<string, string> = {
    users: '#ef4444',
    works: '#8b5cf6',
    views: '#3b82f6',
    likes: '#10b981',
    cumulativeUsers: '#f59e0b',
    cumulativeWorks: '#ec4899',
  };

  // 预警相关状态
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    { id: '1', metric: 'users', threshold: -20, operator: 'lt', enabled: true },
    { id: '2', metric: 'views', threshold: -30, operator: 'lt', enabled: true },
    { id: '3', metric: 'likes', threshold: 1000, operator: 'gt', enabled: false },
  ]);

  // 统计数据
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWorks: 0,
    totalViews: 0,
    totalLikes: 0,
    userGrowth: 0,
    worksGrowth: 0,
    viewsGrowth: 0,
    likesGrowth: 0,
  });

  // 设备分布数据
  const [deviceData, setDeviceData] = useState<DeviceData[]>([
    { name: '桌面端', value: 45 },
    { name: '移动端', value: 40 },
    { name: '平板', value: 15 },
  ]);

  // 用户来源数据
  const [sourceData, setSourceData] = useState<DeviceData[]>([
    { name: '直接访问', value: 35 },
    { name: '搜索引擎', value: 28 },
    { name: '社交媒体', value: 22 },
    { name: '外部链接', value: 15 },
  ]);

  // 热门内容数据
  const [topContentData, setTopContentData] = useState<TopContent[]>([]);

  // 实时订阅引用
  const subscriptionRef = useRef<any>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 检查预警规则
  const checkAlerts = useCallback((newStats: typeof stats) => {
    const newAlerts: Alert[] = [];

    alertRules.forEach(rule => {
      if (!rule.enabled) return;

      let currentValue = 0;
      let metricName = '';

      switch (rule.metric) {
        case 'users':
          currentValue = newStats.userGrowth;
          metricName = '用户增长';
          break;
        case 'works':
          currentValue = newStats.worksGrowth;
          metricName = '作品增长';
          break;
        case 'views':
          currentValue = newStats.viewsGrowth;
          metricName = '浏览量增长';
          break;
        case 'likes':
          currentValue = newStats.totalLikes;
          metricName = '点赞数';
          break;
      }

      const isTriggered = rule.operator === 'gt'
        ? currentValue > rule.threshold
        : currentValue < rule.threshold;

      if (isTriggered) {
        const alert: Alert = {
          id: `${rule.id}-${Date.now()}`,
          ruleId: rule.id,
          metric: rule.metric,
          message: rule.operator === 'lt'
            ? `${metricName}下降超过 ${Math.abs(rule.threshold)}%，当前为 ${currentValue}%`
            : `${metricName}超过 ${rule.threshold}，当前为 ${currentValue}`,
          severity: rule.operator === 'lt' && rule.threshold < -30 ? 'error' : 'warning',
          timestamp: Date.now(),
          acknowledged: false,
        };
        newAlerts.push(alert);
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50)); // 最多保留50条
      newAlerts.forEach(alert => {
        toast.warning(alert.message, {
          duration: 5000,
          icon: <AlertTriangle className="w-5 h-5" />,
        });
      });
    }
  }, [alertRules]);

  // 加载数据
  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);

    try {
      // 并行获取所有数据
      const [overview, trendData, devices, sources, topContent] = await Promise.all([
        adminService.getAnalyticsOverview(timeRange),
        Promise.all([
          adminService.getTrendData(timeRange, 'users'),
          adminService.getTrendData(timeRange, 'works'),
          adminService.getTrendData(timeRange, 'views'),
          adminService.getTrendData(timeRange, 'likes'),
        ]),
        adminService.getDeviceDistribution(timeRange),
        adminService.getSourceDistribution(timeRange),
        adminService.getTopContent(5),
      ]);

      // 更新统计数据
      setStats({
        totalUsers: overview.totalUsers,
        totalWorks: overview.totalWorks,
        totalViews: overview.totalViews,
        totalLikes: overview.totalLikes,
        userGrowth: overview.userGrowth,
        worksGrowth: overview.worksGrowth,
        viewsGrowth: overview.viewsGrowth,
        likesGrowth: overview.likesGrowth,
      });

      // 检查预警
      checkAlerts({
        totalUsers: overview.totalUsers,
        totalWorks: overview.totalWorks,
        totalViews: overview.totalViews,
        totalLikes: overview.totalLikes,
        userGrowth: overview.userGrowth,
        worksGrowth: overview.worksGrowth,
        viewsGrowth: overview.viewsGrowth,
        likesGrowth: overview.likesGrowth,
      });

      // 合并趋势数据并计算累计值
      const [usersTrend, worksTrend, viewsTrend, likesTrend] = trendData;
      console.log('[DataAnalytics] usersTrend 前5条:', usersTrend.slice(0, 5));
      console.log('[DataAnalytics] worksTrend 前5条:', worksTrend.slice(0, 5));
      let cumulativeUsers = 0;
      let cumulativeWorks = 0;

      const mergedData: TrendData[] = usersTrend.map((item, index) => {
        cumulativeUsers += item.value;
        cumulativeWorks += worksTrend[index]?.value || 0;

        return {
          date: item.date,
          users: item.value,
          works: worksTrend[index]?.value || 0,
          views: viewsTrend[index]?.value || 0,
          likes: likesTrend[index]?.value || 0,
          cumulativeUsers,
          cumulativeWorks,
        };
      });
      console.log('[DataAnalytics] mergedData 前10条:', mergedData.slice(0, 10));
      setData(mergedData);

      // 更新设备和来源数据
      console.log('[DataAnalytics] 设备数据:', devices);
      console.log('[DataAnalytics] 来源数据:', sources);
      setDeviceData(devices);
      setSourceData(sources);

      // 更新热门内容
      setTopContentData(topContent);

      // 更新最后更新时间
      setLastUpdated(new Date());
    } catch (error) {
      console.error('加载数据失败:', error);
      if (showLoading) {
        toast.error('加载数据失败，请稍后重试');
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [timeRange, checkAlerts]);

  // 设置实时更新
  useEffect(() => {
    // 初始加载
    loadData();

    if (isRealtimeEnabled) {
      // 设置定时刷新（每30秒）
      refreshIntervalRef.current = setInterval(() => {
        loadData(false);
      }, 30000);

      // 设置 Supabase 实时订阅
      subscriptionRef.current = supabase
        .channel('analytics-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'users' },
          () => {
            loadData(false);
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'works' },
          () => {
            loadData(false);
          }
        )
        .subscribe();
    }

    return () => {
      // 清理定时器和订阅
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [loadData, isRealtimeEnabled]);

  // 导出数据
  const handleExport = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      const headers = ['日期', '新用户', '作品数', '浏览量', '点赞数', '累计用户', '累计作品'];
      const rows = data.map(item => [
        item.date,
        item.users,
        item.works,
        item.views,
        item.likes,
        item.cumulativeUsers,
        item.cumulativeWorks,
      ]);

      const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `数据分析_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const json = JSON.stringify({
        exportTime: new Date().toISOString(),
        timeRange,
        stats,
        data,
      }, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `数据分析_${timeRange}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    toast.success(`已导出${format.toUpperCase()}格式数据`);
  };

  // 刷新数据
  const handleRefresh = () => {
    loadData();
    toast.success('数据已刷新');
  };

  // 确认预警
  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? { ...a, acknowledged: true } : a
    ));
  };

  // 清除所有预警
  const clearAllAlerts = () => {
    setAlerts([]);
    toast.success('已清除所有预警');
  };

  // 未确认的预警数量
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged).length;

  // 渲染主图表
  const renderMainChart = () => {
    if (isLoading && data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[400px]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
          />
        </div>
      );
    }

    const metricColors = {
      users: CHART_COLORS.primary,
      works: CHART_COLORS.secondary,
      views: CHART_COLORS.info,
      likes: CHART_COLORS.danger,
    };

    const metricLabels = {
      users: '新用户',
      works: '新作品',
      views: '浏览量',
      likes: '点赞数',
    };

    const commonTooltipStyle = {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      color: isDark ? '#f1f5f9' : '#0f172a',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    };

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
            <XAxis
              dataKey="date"
              stroke={isDark ? '#64748b' : '#64748b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={isDark ? '#64748b' : '#64748b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip contentStyle={commonTooltipStyle} />
            <Bar
              dataKey={activeMetric}
              name={metricLabels[activeMetric]}
              fill={metricColors[activeMetric]}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metricColors[activeMetric]} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={metricColors[activeMetric]} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
            <XAxis
              dataKey="date"
              stroke={isDark ? '#64748b' : '#64748b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={isDark ? '#64748b' : '#64748b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip contentStyle={commonTooltipStyle} />
            <Area
              type="monotone"
              dataKey={activeMetric}
              name={metricLabels[activeMetric]}
              stroke={metricColors[activeMetric]}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorMetric)"
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'composed') {
      // 组合图表：显示所有指标
      return (
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
            <XAxis
              dataKey="date"
              stroke={isDark ? '#64748b' : '#64748b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={isDark ? '#64748b' : '#64748b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              yAxisId="left"
            />
            <YAxis
              stroke={isDark ? '#64748b' : '#64748b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              yAxisId="right"
              orientation="right"
            />
            <Tooltip contentStyle={commonTooltipStyle} />
            <Legend />
            <Bar dataKey="users" name="新用户" fill={CHART_COLORS.primary} yAxisId="left" radius={[4, 4, 0, 0]} />
            <Bar dataKey="works" name="新作品" fill={CHART_COLORS.secondary} yAxisId="left" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="views" name="浏览量" stroke={CHART_COLORS.info} strokeWidth={2} yAxisId="right" />
            <Line type="monotone" dataKey="likes" name="点赞数" stroke={CHART_COLORS.danger} strokeWidth={2} yAxisId="right" />
          </ComposedChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
            <XAxis
              dataKey="date"
              stroke={isDark ? '#64748b' : '#64748b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={isDark ? '#64748b' : '#64748b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip contentStyle={commonTooltipStyle} />
            <Line
              type="monotone"
              dataKey={activeMetric}
              name={metricLabels[activeMetric]}
              stroke={metricColors[activeMetric]}
              strokeWidth={3}
              dot={{ r: 4, fill: metricColors[activeMetric], strokeWidth: 2, stroke: isDark ? '#1e293b' : '#ffffff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  };

  // 统计卡片组件
  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
    trend
  }: {
    title: string;
    value: string | number;
    change?: number;
    icon: any;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)' }}
      className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400'
            }`}>
              {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> :
               trend === 'down' ? <ArrowDownRight className="w-4 h-4" /> : null}
              <span>{change > 0 ? '+' : ''}{change}%</span>
              <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs ml-1`}>较上期</span>
            </div>
          )}
        </div>
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );

  // 如果是高级视图模式，直接渲染高级大屏组件
  if (isAdvancedView) {
    return (
      <div className="h-full">
        <AdvancedAnalytics onExitAdvancedView={() => setIsAdvancedView(false)} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* 页面标题和操作栏 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">数据分析</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            全面了解平台运营数据和用户行为趋势
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* 实时更新开关 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsRealtimeEnabled(!isRealtimeEnabled)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              isRealtimeEnabled
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Zap className={`w-4 h-4 ${isRealtimeEnabled ? 'fill-current' : ''}`} />
            {isRealtimeEnabled ? '实时更新中' : '实时更新已关闭'}
          </motion.button>

          {/* 预警按钮 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAlerts(!showAlerts)}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              unacknowledgedAlerts > 0
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Bell className="w-4 h-4" />
            预警
            {unacknowledgedAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unacknowledgedAlerts}
              </span>
            )}
          </motion.button>

          {/* 筛选按钮 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              showFilterPanel
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
          </motion.button>

          {/* 时间范围选择 */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => {
                setTimeRange(e.target.value as TimeRange);
                setTablePage(1); // 切换时间范围时重置分页
              }}
              className={`bg-transparent border-none outline-none text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
            >
              <option value="7d">最近7天</option>
              <option value="30d">最近30天</option>
              <option value="90d">最近90天</option>
              <option value="1y">最近1年</option>
              <option value="all">全部时间</option>
            </select>
          </div>

          {/* 刷新按钮 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRefresh}
            className={`p-2 rounded-xl ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} shadow-sm transition-colors`}
          >
            <RefreshCw className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </motion.button>

          {/* 高级大屏切换按钮 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAdvancedView(!isAdvancedView)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg ${
              isAdvancedView
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 shadow-blue-500/30 text-white'
                : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {isAdvancedView ? '退出高级大屏' : '高级大屏'}
          </motion.button>

          {/* 导出按钮 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            导出数据
          </motion.button>
        </div>
      </div>

      {/* 最后更新时间 */}
      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        最后更新: {lastUpdated.toLocaleString('zh-CN')}
        {isRealtimeEnabled && (
          <span className="ml-2 inline-flex items-center gap-1 text-green-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            实时更新中
          </span>
        )}
      </div>

      {/* 预警面板 */}
      <AnimatePresence>
        {showAlerts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden`}
          >
            <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                数据预警
              </h3>
              {alerts.length > 0 && (
                <button
                  onClick={clearAllAlerts}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  清除全部
                </button>
              )}
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>暂无预警信息</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg flex items-start justify-between ${
                        alert.severity === 'error'
                          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                          : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                          alert.severity === 'error' ? 'text-red-500' : 'text-yellow-500'
                        }`} />
                        <div>
                          <p className={`text-sm font-medium ${
                            alert.severity === 'error' ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'
                          }`}>
                            {alert.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(alert.timestamp).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          确认
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 筛选面板 */}
      <AnimatePresence>
        {showFilterPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden`}
          >
            <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-500" />
                数据筛选
              </h3>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  业务维度
                </label>
                <select
                  value={businessFilter}
                  onChange={(e) => setBusinessFilter(e.target.value as BusinessFilter)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  <option value="all">全部</option>
                  <option value="category">按分类</option>
                  <option value="creator_level">按创作者等级</option>
                  <option value="content_type">按内容类型</option>
                </select>
              </div>
              {businessFilter === 'category' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    作品分类
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-gray-200'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    <option value="all">全部分类</option>
                    <option value="国潮设计">国潮设计</option>
                    <option value="非遗传承">非遗传承</option>
                    <option value="老字号品牌">老字号品牌</option>
                    <option value="IP设计">IP设计</option>
                    <option value="插画设计">插画设计</option>
                  </select>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="总用户数"
          value={stats.totalUsers.toLocaleString()}
          change={stats.userGrowth}
          trend={stats.userGrowth >= 0 ? 'up' : 'down'}
          icon={Users}
          color={CHART_COLORS.primary}
        />
        <StatCard
          title="总作品数"
          value={stats.totalWorks.toLocaleString()}
          change={stats.worksGrowth}
          trend={stats.worksGrowth >= 0 ? 'up' : 'down'}
          icon={Image}
          color={CHART_COLORS.secondary}
        />
        <StatCard
          title="总浏览量"
          value={stats.totalViews.toLocaleString()}
          change={stats.viewsGrowth}
          trend={stats.viewsGrowth >= 0 ? 'up' : 'down'}
          icon={Eye}
          color={CHART_COLORS.info}
        />
        <StatCard
          title="总点赞数"
          value={stats.totalLikes.toLocaleString()}
          change={stats.likesGrowth}
          trend={stats.likesGrowth >= 0 ? 'up' : 'down'}
          icon={Heart}
          color={CHART_COLORS.danger}
        />
      </div>

      {/* 主图表区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden`}
      >
        {/* 图表头部 */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">趋势分析</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                查看各项指标的变化趋势
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* 指标选择 */}
              {chartType !== 'composed' && (
                <div className="flex items-center gap-2">
                  {[
                    { key: 'users', label: '用户', icon: Users },
                    { key: 'works', label: '作品', icon: Image },
                    { key: 'views', label: '浏览', icon: Eye },
                    { key: 'likes', label: '点赞', icon: Heart },
                  ].map(({ key, label, icon: Icon }) => (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveMetric(key as MetricType)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                        activeMetric === key
                          ? 'bg-red-600 text-white'
                          : isDark
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* 图表类型选择 */}
              <div className={`flex items-center gap-1 p-1 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                {[
                  { key: 'line', icon: Activity, label: '折线' },
                  { key: 'bar', icon: BarChart3, label: '柱状' },
                  { key: 'area', icon: TrendingUp, label: '面积' },
                  { key: 'composed', icon: Share2, label: '组合' },
                ].map(({ key, icon: Icon, label }) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setChartType(key as ChartType)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                      chartType === key
                        ? isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                        : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title={label}
                  >
                    <Icon className="w-3 h-3" />
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 图表内容 */}
        <div className="p-6">
          {renderMainChart()}
        </div>
      </motion.div>

      {/* 数据分布和热门内容 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 设备分布 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden`}
        >
          <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-purple-500" />
              设备分布
            </h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {deviceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    color: isDark ? '#f1f5f9' : '#0f172a',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {deviceData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-blue-600 dark:text-blue-400">{item.count || 0}人</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 用户来源 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden`}
        >
          <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Share2 className="w-5 h-5 text-cyan-500" />
              用户来源
            </h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {sourceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    color: isDark ? '#f1f5f9' : '#0f172a',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {sourceData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-blue-600 dark:text-blue-400">{item.count || 0}人</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 热门内容 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden`}
        >
          <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              热门内容
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-8 h-8 border-3 border-red-200 border-t-red-500 rounded-full"
                  />
                </div>
              ) : topContentData.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无热门内容</p>
                </div>
              ) : (
                topContentData.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`flex items-start gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'} transition-colors cursor-pointer`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-600' :
                      index === 1 ? 'bg-gray-200 text-gray-600' :
                      index === 2 ? 'bg-orange-100 text-orange-600' :
                      isDark ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">{item.title}</h4>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.author}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="flex items-center gap-1 text-gray-400">
                          <Eye className="w-3 h-3" />
                          {item.views.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 text-gray-400">
                          <Heart className="w-3 h-3" />
                          {item.likes.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* 详细数据趋势图表 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden`}
      >
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">详细数据趋势</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                查看各项指标的详细趋势变化
              </p>
            </div>

            {/* 数据指标切换按钮 */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { key: 'users', label: '新用户', color: '#ef4444', icon: Users },
                { key: 'works', label: '新作品', color: '#8b5cf6', icon: Image },
                { key: 'views', label: '浏览量', color: '#3b82f6', icon: Eye },
                { key: 'likes', label: '点赞数', color: '#10b981', icon: Heart },
                { key: 'cumulativeUsers', label: '累计用户', color: '#f59e0b', icon: Users },
                { key: 'cumulativeWorks', label: '累计作品', color: '#ec4899', icon: Image },
              ].map(({ key, label, color, icon: Icon }) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDetailChartMetric(key as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    detailChartMetric === key
                      ? 'text-white'
                      : isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={{
                    backgroundColor: detailChartMetric === key ? color : undefined,
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* 折线图表 */}
        <div className="p-6">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="detailChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={detailChartColors[detailChartMetric]}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={detailChartColors[detailChartMetric]}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? '#334155' : '#e2e8f0'}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke={isDark ? '#64748b' : '#64748b'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                angle={data.length > 20 ? -45 : 0}
                textAnchor={data.length > 20 ? 'end' : 'middle'}
                height={data.length > 20 ? 60 : 30}
              />
              <YAxis
                stroke={isDark ? '#64748b' : '#64748b'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const value = payload[0].value as number;
                    const metricLabels: Record<string, string> = {
                      users: '新用户',
                      works: '新作品',
                      views: '浏览量',
                      likes: '点赞数',
                      cumulativeUsers: '累计用户',
                      cumulativeWorks: '累计作品',
                    };
                    return (
                      <div
                        className={`p-3 rounded-lg shadow-lg border ${
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-100'
                            : 'bg-white border-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-xs text-gray-500 mb-1">{label}</p>
                        <p className="text-lg font-bold" style={{ color: detailChartColors[detailChartMetric] }}>
                          {value?.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {metricLabels[detailChartMetric]}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey={detailChartMetric}
                stroke={detailChartColors[detailChartMetric]}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#detailChartGradient)"
              />
              <Line
                type="monotone"
                dataKey={detailChartMetric}
                stroke={detailChartColors[detailChartMetric]}
                strokeWidth={3}
                dot={{ r: 3, fill: detailChartColors[detailChartMetric], strokeWidth: 2, stroke: isDark ? '#1e293b' : '#ffffff' }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 图表数据摘要 */}
        <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} grid grid-cols-2 md:grid-cols-4 gap-4`}>
          {(() => {
            const values = data.map(d => (d as any)[detailChartMetric] || 0);
            const total = values.reduce((a, b) => a + b, 0);
            const avg = values.length > 0 ? Math.round(total / values.length) : 0;
            const max = values.length > 0 ? Math.max(...values) : 0;
            const min = values.length > 0 ? Math.min(...values) : 0;
            return [
              { label: '总计', value: total.toLocaleString() },
              { label: '平均值', value: avg.toLocaleString() },
              { label: '最高值', value: max.toLocaleString() },
              { label: '最低值', value: min.toLocaleString() },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
                <p className="text-lg font-bold" style={{ color: detailChartColors[detailChartMetric] }}>
                  {stat.value}
                </p>
              </div>
            ));
          })()}
        </div>
      </motion.div>

      {/* 详细数据表格 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden`}
      >
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          <div>
            <h3 className="font-semibold text-lg">详细数据</h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              每日新增数据统计
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleExport('json')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              导出 JSON
            </motion.button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">新用户</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">新作品</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">浏览量</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">点赞数</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">累计用户</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">累计作品</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-8 h-8 border-3 border-red-200 border-t-red-500 rounded-full mx-auto"
                    />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`px-6 py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    暂无数据
                  </td>
                </tr>
              ) : (
                data
                  .slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize)
                  .map((item, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.users}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.works}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.views.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.likes}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                        {item.cumulativeUsers?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600 dark:text-purple-400">
                        {item.cumulativeWorks?.toLocaleString()}
                      </td>
                    </motion.tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页控制 */}
        {data.length > 0 && (
          <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              共 {data.length} 条数据，每页
              <select
                value={tablePageSize}
                onChange={(e) => {
                  setTablePageSize(Number(e.target.value));
                  setTablePage(1);
                }}
                className={`mx-2 px-2 py-1 rounded text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border`}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={data.length}>全部</option>
              </select>
              条
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTablePage(p => Math.max(1, p - 1))}
                disabled={tablePage === 1}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tablePage === 1
                    ? isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                上一页
              </button>

              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                第 {tablePage} / {Math.ceil(data.length / tablePageSize)} 页
              </span>

              <button
                onClick={() => setTablePage(p => Math.min(Math.ceil(data.length / tablePageSize), p + 1))}
                disabled={tablePage >= Math.ceil(data.length / tablePageSize)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tablePage >= Math.ceil(data.length / tablePageSize)
                    ? isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
