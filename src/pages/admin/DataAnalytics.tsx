import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { adminService } from '@/services/adminService';
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
  Image
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
type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

// 图表类型
type ChartType = 'line' | 'bar' | 'area';

// 数据指标类型
type MetricType = 'users' | 'works' | 'views' | 'likes';

// 趋势数据类型
interface TrendData {
  date: string;
  users: number;
  works: number;
  views: number;
  likes: number;
}

// 设备分布数据类型
interface DeviceData {
  name: string;
  value: number;
}

// 热门内容数据类型
interface TopContent {
  id: string;
  title: string;
  views: number;
  likes: number;
  author: string;
}

export default function DataAnalytics() {
  const { isDark } = useTheme();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [activeMetric, setActiveMetric] = useState<MetricType>('users');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<TrendData[]>([]);
  
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

  // 加载数据
  const loadData = useCallback(async () => {
    setIsLoading(true);
    
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
        adminService.getDeviceDistribution(),
        adminService.getSourceDistribution(),
        adminService.getTopContent(5),
      ]);

      // 更新统计数据 - 使用累计总数
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

      // 合并趋势数据
      const [usersTrend, worksTrend, viewsTrend, likesTrend] = trendData;
      const mergedData: TrendData[] = usersTrend.map((item, index) => ({
        date: item.date,
        users: item.value,
        works: worksTrend[index]?.value || 0,
        views: viewsTrend[index]?.value || 0,
        likes: likesTrend[index]?.value || 0,
      }));
      setData(mergedData);

      // 更新设备和来源数据
      setDeviceData(devices);
      setSourceData(sources);

      // 更新热门内容
      setTopContentData(topContent);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 导出数据
  const handleExport = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      const headers = ['日期', '新用户', '作品数', '浏览量', '点赞数'];
      const rows = data.map(item => [
        item.date,
        item.users,
        item.works,
        item.views,
        item.likes,
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
      const json = JSON.stringify(data, null, 2);
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

  // 渲染主图表
  const renderMainChart = () => {
    if (isLoading) {
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
        
        <div className="flex items-center gap-3">
          {/* 时间范围选择 */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
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

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="新增用户" 
          value={stats.totalUsers.toLocaleString()} 
          change={stats.userGrowth}
          trend={stats.userGrowth >= 0 ? 'up' : 'down'}
          icon={Users}
          color={CHART_COLORS.primary}
        />
        <StatCard 
          title="新增作品" 
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
            
            <div className="flex items-center gap-3">
              {/* 指标选择 */}
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
              
              {/* 图表类型选择 */}
              <div className={`flex items-center gap-1 p-1 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                {[
                  { key: 'line', icon: Activity, label: '折线' },
                  { key: 'bar', icon: BarChart3, label: '柱状' },
                  { key: 'area', icon: TrendingUp, label: '面积' },
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
                  <span className="font-medium">{item.value}%</span>
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
                  <span className="font-medium">{item.value}%</span>
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

      {/* 详细数据表格 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden`}
      >
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          <h3 className="font-semibold text-lg">详细数据</h3>
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">新用户</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">新作品</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">浏览量</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">点赞数</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-8 h-8 border-3 border-red-200 border-t-red-500 rounded-full mx-auto"
                    />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`px-6 py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    暂无数据
                  </td>
                </tr>
              ) : (
                data.slice(0, 10).map((item, index) => (
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
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
