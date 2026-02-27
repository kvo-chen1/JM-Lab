import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
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
  Search,
  TrendingUp,
  Users,
  Clock,
  Download,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Target,
  Activity,
  Zap,
  Globe,
  CheckSquare,
  Square,
} from 'lucide-react';

// 图表颜色配置
const CHART_COLORS = {
  primary: '#ef4444',
  secondary: '#8b5cf6',
  tertiary: '#06b6d4',
  quaternary: '#f59e0b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

const PIE_COLORS = ['#ef4444', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6', '#f97316', '#84cc16'];

// 类型定义
interface SearchRecord {
  id: string;
  user_id: string | null;
  query: string;
  search_type: string;
  result_count: number;
  clicked_result_id: string | null;
  clicked_result_type: string | null;
  search_filters: Record<string, any>;
  search_duration_ms: number | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  username?: string;
  avatar_url?: string;
}

interface HotSearch {
  id: string;
  query: string;
  search_count: number;
  unique_searchers: number;
  trend_score: number;
  category: string | null;
  is_active: boolean;
  last_searched_at: string;
}

interface SearchStats {
  totalSearches: number;
  uniqueUsers: number;
  avgResultsPerSearch: number;
  clickThroughRate: number;
  searchesToday: number;
  searchesGrowth: number;
}

interface TrendData {
  date: string;
  searches: number;
  uniqueUsers: number;
  clicks: number;
}

interface HourlyDistribution {
  hour: number;
  count: number;
}

interface DeviceDistribution {
  name: string;
  value: number;
}

interface SearchTypeDistribution {
  name: string;
  value: number;
}

// 时间范围类型
type TimeRange = 'today' | '7d' | '30d' | '90d' | '1y' | 'custom' | 'all';

export default function SearchRecordManagement() {
  const { isDark } = useTheme();
  
  // 状态管理
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'analytics'>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  
  // 数据状态
  const [searchRecords, setSearchRecords] = useState<SearchRecord[]>([]);
  const [hotSearches, setHotSearches] = useState<HotSearch[]>([]);
  const [stats, setStats] = useState<SearchStats>({
    totalSearches: 0,
    uniqueUsers: 0,
    avgResultsPerSearch: 0,
    clickThroughRate: 0,
    searchesToday: 0,
    searchesGrowth: 0,
  });
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [hourlyDistribution, setHourlyDistribution] = useState<HourlyDistribution[]>([]);
  const [deviceDistribution, setDeviceDistribution] = useState<DeviceDistribution[]>([]);
  const [searchTypeDistribution, setSearchTypeDistribution] = useState<SearchTypeDistribution[]>([]);
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // 筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTypeFilter, setSearchTypeFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [hasClickFilter, setHasClickFilter] = useState<'all' | 'clicked' | 'not_clicked'>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // 选择状态
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // 获取时间范围的开始日期
  const getStartDate = useCallback(() => {
    const now = new Date();
    switch (timeRange) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0)).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
      case 'custom':
        return customDateRange.start ? new Date(customDateRange.start).toISOString() : new Date(0).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  }, [timeRange, customDateRange]);

  // 加载搜索统计数据
  const loadStats = useCallback(async () => {
    try {
      const startDate = getStartDate();
      const endDate = new Date().toISOString();
      
      // 获取总搜索次数
      const { count: totalCount, error: totalError } = await supabase
        .from('user_search_history')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      
      if (totalError) throw totalError;
      
      // 获取独立用户数
      const { data: uniqueUsersData, error: uniqueError } = await supabase
        .from('user_search_history')
        .select('user_id')
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      
      if (uniqueError) throw uniqueError;
      
      const uniqueUsers = new Set(uniqueUsersData?.map(r => r.user_id).filter(Boolean)).size;
      
      // 获取平均结果数
      const { data: avgData, error: avgError } = await supabase
        .from('user_search_history')
      .select('result_count')
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      
      if (avgError) throw avgError;
      
      const avgResults = avgData && avgData.length > 0
        ? avgData.reduce((sum, r) => sum + (r.result_count || 0), 0) / avgData.length
        : 0;
      
      // 获取点击率
      const { count: clickedCount, error: clickedError } = await supabase
        .from('user_search_history')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .not('clicked_result_id', 'is', null);
      
      if (clickedError) throw clickedError;
      
      const clickThroughRate = totalCount && totalCount > 0
        ? ((clickedCount || 0) / totalCount) * 100
        : 0;
      
      // 获取今日搜索数
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount, error: todayError } = await supabase
        .from('user_search_history')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());
      
      if (todayError) throw todayError;
      
      // 计算增长率（与前一天比较）
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const { count: yesterdayCount, error: yesterdayError } = await supabase
        .from('user_search_history')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString());
      
      if (yesterdayError) throw yesterdayError;
      
      const growth = yesterdayCount && yesterdayCount > 0
        ? (((todayCount || 0) - yesterdayCount) / yesterdayCount) * 100
        : 0;
      
      setStats({
        totalSearches: totalCount || 0,
        uniqueUsers,
        avgResultsPerSearch: Math.round(avgResults * 10) / 10,
        clickThroughRate: Math.round(clickThroughRate * 10) / 10,
        searchesToday: todayCount || 0,
        searchesGrowth: Math.round(growth * 10) / 10,
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  }, [getStartDate]);

  // 加载趋势数据
  const loadTrendData = useCallback(async () => {
    try {
      const startDate = new Date(getStartDate());
      const endDate = new Date();
      const days: TrendData[] = [];
      
      // 生成日期范围
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        days.push({
          date: dateStr,
          searches: 0,
          uniqueUsers: 0,
          clicks: 0,
        });
      }
      
      // 获取每日数据
      const { data, error } = await supabase
        .from('user_search_history')
        .select('created_at, user_id, clicked_result_id')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      if (error) throw error;
      
      // 聚合数据
      data?.forEach(record => {
        const dateStr = record.created_at.split('T')[0];
        const dayData = days.find(d => d.date === dateStr);
        if (dayData) {
          dayData.searches++;
          if (record.clicked_result_id) {
            dayData.clicks++;
          }
        }
      });
      
      setTrendData(days);
    } catch (error) {
      console.error('加载趋势数据失败:', error);
    }
  }, [getStartDate]);

  // 加载时段分布
  const loadHourlyDistribution = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_search_history')
        .select('created_at')
        .gte('created_at', getStartDate());
      
      if (error) throw error;
      
      const hourlyCounts = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: 0,
      }));
      
      data?.forEach(record => {
        const hour = new Date(record.created_at).getHours();
        hourlyCounts[hour].count++;
      });
      
      setHourlyDistribution(hourlyCounts);
    } catch (error) {
      console.error('加载时段分布失败:', error);
    }
  }, [getStartDate]);

  // 加载热门搜索
  const loadHotSearches = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('hot_searches')
        .select('*')
        .eq('is_active', true)
        .order('search_count', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      setHotSearches(data || []);
    } catch (error) {
      console.error('加载热门搜索失败:', error);
    }
  }, []);

  // 加载搜索记录
  const loadSearchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('user_search_history')
        .select(`
          *,
          users:user_id (username, avatar_url)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);
      
      // 应用时间筛选
      if (timeRange !== 'all') {
        query = query.gte('created_at', getStartDate());
      }
      
      // 应用搜索类型筛选
      if (searchTypeFilter !== 'all') {
        query = query.eq('search_type', searchTypeFilter);
      }
      
      // 应用点击筛选
      if (hasClickFilter === 'clicked') {
        query = query.not('clicked_result_id', 'is', null);
      } else if (hasClickFilter === 'not_clicked') {
        query = query.is('clicked_result_id', null);
      }
      
      // 应用关键词筛选
      if (searchQuery) {
        query = query.ilike('query', `%${searchQuery}%`);
      }
      
      // 应用用户筛选
      if (userFilter) {
        query = query.or(`user_id.eq.${userFilter},users.username.ilike.%${userFilter}%`);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      const formattedRecords = data?.map(record => ({
        ...record,
        username: record.users?.username,
        avatar_url: record.users?.avatar_url,
      })) || [];
      
      setSearchRecords(formattedRecords);
      setTotalRecords(count || 0);
    } catch (error) {
      console.error('加载搜索记录失败:', error);
      toast.error('加载搜索记录失败');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, timeRange, searchTypeFilter, hasClickFilter, searchQuery, userFilter, getStartDate]);

  // 加载设备分布
  const loadDeviceDistribution = useCallback(async () => {
    try {
      // 从 user_agent 解析设备类型
      const { data, error } = await supabase
        .from('user_search_history')
        .select('user_agent')
        .gte('created_at', getStartDate());
      
      if (error) throw error;
      
      let mobile = 0, desktop = 0, tablet = 0, unknown = 0;
      
      data?.forEach(record => {
        const ua = record.user_agent || '';
        if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
          mobile++;
        } else if (ua.includes('iPad') || ua.includes('Tablet')) {
          tablet++;
        } else if (ua.includes('Windows') || ua.includes('Mac') || ua.includes('Linux')) {
          desktop++;
        } else {
          unknown++;
        }
      });
      
      setDeviceDistribution([
        { name: '桌面端', value: desktop },
        { name: '移动端', value: mobile },
        { name: '平板', value: tablet },
        { name: '其他', value: unknown },
      ]);
    } catch (error) {
      console.error('加载设备分布失败:', error);
    }
  }, [getStartDate]);

  // 加载搜索类型分布
  const loadSearchTypeDistribution = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_search_history')
        .select('search_type')
        .gte('created_at', getStartDate());
      
      if (error) throw error;
      
      const typeCounts: Record<string, number> = {};
      data?.forEach(record => {
        const type = record.search_type || 'general';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      
      const distribution = Object.entries(typeCounts).map(([name, value]) => ({
        name: name === 'general' ? '普通搜索' : 
              name === 'image' ? '图片搜索' :
              name === 'user' ? '用户搜索' :
              name === 'tag' ? '标签搜索' : name,
        value,
      }));
      
      setSearchTypeDistribution(distribution);
    } catch (error) {
      console.error('加载搜索类型分布失败:', error);
    }
  }, [getStartDate]);

  // 刷新所有数据
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadStats(),
      loadTrendData(),
      loadHourlyDistribution(),
      loadHotSearches(),
      loadSearchRecords(),
      loadDeviceDistribution(),
      loadSearchTypeDistribution(),
    ]);
    setIsRefreshing(false);
    toast.success('数据已刷新');
  }, [loadStats, loadTrendData, loadHourlyDistribution, loadHotSearches, loadSearchRecords, loadDeviceDistribution, loadSearchTypeDistribution]);

  // 初始加载
  useEffect(() => {
    refreshData();
  }, []);

  // 当筛选条件变化时重新加载记录
  useEffect(() => {
    loadSearchRecords();
  }, [currentPage, pageSize, timeRange, searchTypeFilter, hasClickFilter, searchQuery, userFilter]);

  // 导出数据
  const handleExport = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      const headers = ['ID', '用户ID', '用户名', '搜索关键词', '搜索类型', '结果数', '是否点击', '搜索时间', 'IP地址'];
      const rows = searchRecords.map(r => [
        r.id,
        r.user_id || '游客',
        r.username || '未知',
        r.query,
        r.search_type,
        r.result_count,
        r.clicked_result_id ? '是' : '否',
        new Date(r.created_at).toLocaleString('zh-CN'),
        r.ip_address || '-',
      ]);

      const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `搜索记录_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const json = JSON.stringify({
        exportTime: new Date().toISOString(),
        timeRange,
        stats,
        records: searchRecords,
      }, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `搜索记录_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    toast.success(`已导出${format.toUpperCase()}格式数据`);
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRecords.size === 0) {
      toast.error('请先选择要删除的记录');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedRecords.size} 条记录吗？此操作不可恢复！`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_search_history')
        .delete()
        .in('id', Array.from(selectedRecords));

      if (error) throw error;

      toast.success(`已删除 ${selectedRecords.size} 条记录`);
      setSelectedRecords(new Set());
      setSelectAll(false);
      loadSearchRecords();
      loadStats();
    } catch (error) {
      console.error('删除记录失败:', error);
      toast.error('删除失败，请重试');
    }
  };

  // 切换选择
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecords(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(searchRecords.map(r => r.id)));
    }
    setSelectAll(!selectAll);
  };

  // 统计卡片组件
  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
    trend,
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
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
               trend === 'down' ? <TrendingUp className="w-4 h-4 rotate-180" /> : null}
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

  // 渲染概览页面
  const renderOverview = () => (
    <div className="space-y-6">
      {/* 关键指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="总搜索次数"
          value={stats.totalSearches.toLocaleString()}
          change={stats.searchesGrowth}
          trend={stats.searchesGrowth >= 0 ? 'up' : 'down'}
          icon={Search}
          color={CHART_COLORS.primary}
        />
        <StatCard
          title="独立用户"
          value={stats.uniqueUsers.toLocaleString()}
          icon={Users}
          color={CHART_COLORS.secondary}
        />
        <StatCard
          title="今日搜索"
          value={stats.searchesToday.toLocaleString()}
          icon={Activity}
          color={CHART_COLORS.tertiary}
        />
        <StatCard
          title="平均结果数"
          value={stats.avgResultsPerSearch}
          icon={Target}
          color={CHART_COLORS.quaternary}
        />
        <StatCard
          title="点击率"
          value={`${stats.clickThroughRate}%`}
          icon={Zap}
          color={CHART_COLORS.success}
        />
        <StatCard
          title="平均响应时间"
          value="< 100ms"
          icon={Clock}
          color={CHART_COLORS.info}
        />
      </div>

      {/* 趋势图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`lg:col-span-2 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg">搜索趋势</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                搜索次数和独立用户趋势
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="date" stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
              <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  borderColor: isDark ? '#374151' : '#e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="searches" name="搜索次数" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="clicks" name="点击次数" stroke={CHART_COLORS.success} strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 热门搜索 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg">热门搜索</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                搜索次数最多的关键词
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-orange-500" />
          </div>
          <div className="space-y-3">
            {hotSearches.slice(0, 8).map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-600' :
                    index === 1 ? 'bg-gray-200 text-gray-600' :
                    index === 2 ? 'bg-orange-100 text-orange-600' :
                    isDark ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium truncate max-w-[120px]">{item.query}</span>
                </div>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {item.search_count}次
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 时段分布和设备分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg">时段分布</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                24小时搜索热度分布
              </p>
            </div>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={hourlyDistribution}>
              <defs>
                <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.info} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={CHART_COLORS.info} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="hour" 
                stroke={isDark ? '#9ca3af' : '#6b7280'} 
                fontSize={12}
                tickFormatter={(value) => `${value}时`}
              />
              <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  borderColor: isDark ? '#374151' : '#e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value}次`, '搜索次数']}
                labelFormatter={(label) => `${label}:00 - ${label}:59`}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={CHART_COLORS.info}
                fillOpacity={1}
                fill="url(#colorHourly)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg">设备分布</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                用户设备类型统计
              </p>
            </div>
            <PieChartIcon className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex items-center">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={deviceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {deviceDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    borderColor: isDark ? '#374151' : '#e5e7eb',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {deviceDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );

  // 渲染记录列表页面
  const renderRecords = () => (
    <div className="space-y-4">
      {/* 筛选栏 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-4`}
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* 搜索框 */}
          <div className={`relative flex-1 min-w-[200px] ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-xl px-4 py-2`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索关键词..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none pl-8 text-sm"
            />
          </div>

          {/* 搜索类型筛选 */}
          <select
            value={searchTypeFilter}
            onChange={(e) => setSearchTypeFilter(e.target.value)}
            className={`px-4 py-2 rounded-xl text-sm ${
              isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <option value="all">所有类型</option>
            <option value="general">普通搜索</option>
            <option value="image">图片搜索</option>
            <option value="user">用户搜索</option>
            <option value="tag">标签搜索</option>
          </select>

          {/* 点击状态筛选 */}
          <select
            value={hasClickFilter}
            onChange={(e) => setHasClickFilter(e.target.value as any)}
            className={`px-4 py-2 rounded-xl text-sm ${
              isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <option value="all">所有记录</option>
            <option value="clicked">已点击</option>
            <option value="not_clicked">未点击</option>
          </select>

          {/* 展开更多筛选 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm ${
              showFilters
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
          </button>

          {/* 导出按钮 */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              导出CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm ${
                isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Download className="w-4 h-4" />
              JSON
            </button>
          </div>
        </div>

        {/* 更多筛选条件 */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-700/20"
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-xl px-4 py-2`}>
                  <input
                    type="text"
                    placeholder="用户ID或用户名..."
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="w-40 bg-transparent border-none outline-none text-sm"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 批量操作栏 */}
      {selectedRecords.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center justify-between px-4 py-3 rounded-xl ${
            isDark ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-blue-500" />
            <span className="text-sm">
              已选择 <strong>{selectedRecords.size}</strong> 条记录
            </span>
          </div>
          <button
            onClick={handleBatchDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            批量删除
          </button>
        </motion.div>
      )}

      {/* 记录表格 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2"
                  >
                    {selectAll ? (
                      <CheckSquare className="w-4 h-4 text-red-500" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">用户</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">搜索关键词</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">类型</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">结果数</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">点击</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">搜索时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-8 h-8 border-3 border-red-200 border-t-red-500 rounded-full mx-auto"
                    />
                  </td>
                </tr>
              ) : searchRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`px-4 py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>暂无搜索记录</p>
                  </td>
                </tr>
              ) : (
                searchRecords.map((record) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(record.id)}>
                        {selectedRecords.has(record.id) ? (
                          <CheckSquare className="w-4 h-4 text-red-500" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {record.user_id ? (
                          <>
                            <img
                              src={record.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${record.username}`}
                              alt={record.username}
                              className="w-8 h-8 rounded-full"
                            />
                            <span className="text-sm">{record.username || '未知用户'}</span>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <Globe className="w-4 h-4 text-gray-500" />
                            </div>
                            <span className="text-sm text-gray-500">游客</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium">{record.query}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        record.search_type === 'image'
                          ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30'
                          : record.search_type === 'user'
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                          : record.search_type === 'tag'
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700'
                      }`}>
                        {record.search_type === 'general' ? '普通' :
                         record.search_type === 'image' ? '图片' :
                         record.search_type === 'user' ? '用户' :
                         record.search_type === 'tag' ? '标签' : record.search_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{record.result_count}</td>
                    <td className="px-4 py-3">
                      {record.clicked_result_id ? (
                        <span className="flex items-center gap-1 text-green-500 text-sm">
                          <CheckSquare className="w-4 h-4" />
                          已点击
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(record.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          // 查看详情逻辑
                          toast.info(`查看记录: ${record.query}`);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Eye className="w-4 h-4 text-blue-500" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className={`px-4 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              共 {totalRecords} 条记录
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <option value={10}>10条/页</option>
              <option value={20}>20条/页</option>
              <option value={50}>50条/页</option>
              <option value={100}>100条/页</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {Array.from({ length: Math.min(5, Math.ceil(totalRecords / pageSize)) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    pageNum === currentPage
                      ? 'bg-red-600 text-white'
                      : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(Math.min(Math.ceil(totalRecords / pageSize), currentPage + 1))}
              disabled={currentPage >= Math.ceil(totalRecords / pageSize)}
              className={`p-2 rounded-lg transition-colors ${
                currentPage >= Math.ceil(totalRecords / pageSize)
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  // 渲染分析页面
  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* 搜索类型分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg">搜索类型分布</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                不同类型搜索的占比
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-cyan-500" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={searchTypeDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {searchTypeDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  borderColor: isDark ? '#374151' : '#e5e7eb',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg">搜索效果分析</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                搜索结果点击率趋势
              </p>
            </div>
            <Target className="w-5 h-5 text-green-500" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="date" stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
              <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  borderColor: isDark ? '#374151' : '#e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="clicks"
                name="点击次数"
                stroke={CHART_COLORS.success}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">搜索记录管理</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            管理用户搜索行为，分析搜索趋势和热门关键词
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* 时间范围选择 */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className={`bg-transparent border-none outline-none text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
            >
              <option value="today">今日</option>
              <option value="7d">最近7天</option>
              <option value="30d">最近30天</option>
              <option value="90d">最近90天</option>
              <option value="1y">最近1年</option>
            </select>
          </div>

          {/* 刷新按钮 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={refreshData}
            disabled={isRefreshing}
            className={`p-2 rounded-xl ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} shadow-sm transition-colors`}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''} ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </motion.button>
        </div>
      </div>

      {/* 标签页切换 */}
      <div className={`flex items-center gap-2 p-1 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {[
          { key: 'overview', label: '数据概览', icon: BarChart3 },
          { key: 'records', label: '搜索记录', icon: Search },
          { key: 'analytics', label: '深度分析', icon: Activity },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-red-600 text-white'
                : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'records' && renderRecords()}
          {activeTab === 'analytics' && renderAnalytics()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
