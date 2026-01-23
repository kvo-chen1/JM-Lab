import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
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
} from 'recharts';
import analyticsService, { 
  MetricType, 
  TimeRange, 
  GroupBy,
  AnalyticsQueryParams,
  WorkPerformance,
  UserActivity,
  ThemeTrend
} from '@/services/analyticsService';

// 图表类型
type ChartType = 'line' | 'bar' | 'pie';

// 颜色配置
const COLORS = {
  primary: '#ef4444',
  secondary: '#8b5cf6',
  tertiary: '#06b6d4',
  quaternary: '#f59e0b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

const CHART_COLORS = ['#ef4444', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'];

interface AnalyticsDashboardProps {
  userId?: string;
  initialMetric?: MetricType;
  initialTimeRange?: TimeRange;
}

// 图表卡片组件
const ChartCard: React.FC<{
  title: string;
  children: React.ReactNode;
  description?: string;
}> = ({ title, children, description }) => {
  const { isDark } = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-xl overflow-hidden shadow-md p-5 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {description}
          </p>
        )}
      </div>
      <div className="h-80">
        {children}
      </div>
    </motion.div>
  );
};

// 格式化数字，添加千分位分隔符
const formatNumber = (num: number | string): string => {
  const parsedNum = typeof num === 'string' ? parseFloat(num) : num;
  return parsedNum.toLocaleString('zh-CN');
};

// 格式化百分比，保留1位小数
const formatPercent = (num: number): string => {
  return num.toFixed(1);
};

// 数据卡片组件
const DataCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  color?: string;
  isPercent?: boolean;
  showTrend?: boolean;
  warning?: boolean;
}> = ({ title, value, change, icon, color = COLORS.primary, isPercent = false, showTrend = true, warning = false }) => {
  const { isDark } = useTheme();
  
  // 格式化显示值
  const displayValue = isPercent 
    ? `${formatPercent(typeof value === 'number' ? value : parseFloat(value as string))}%` 
    : formatNumber(value);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-xl p-4 shadow-md ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} flex items-center justify-between`}
    >
      <div>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
        <div className="flex items-center gap-2 mt-1">
          <h4 className="text-2xl font-bold" style={{ color }}>{displayValue}</h4>
          {warning && (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 p-1 rounded-full">
              <i className="fas fa-exclamation-triangle text-sm"></i>
            </div>
          )}
        </div>
        {change !== undefined && showTrend && (
          <p className={`text-xs mt-1 flex items-center ${change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-500'}`}>
            {change > 0 ? '↑' : change < 0 ? '↓' : '→'} {formatPercent(Math.abs(change))}%
          </p>
        )}
      </div>
      <div className={`p-3 rounded-full`} style={{ backgroundColor: `${color}20` }}>
        {icon}
      </div>
    </motion.div>
  );
};

// 表现卡片组件
const PerformanceCard: React.FC<{
  item: WorkPerformance | UserActivity | ThemeTrend;
  type: 'work' | 'user' | 'theme';
  onViewDetails?: () => void;
}> = ({ item, type, onViewDetails }) => {
  const { isDark } = useTheme();
  let content;

  if (type === 'work') {
    const work = item as WorkPerformance;
    content = (
      <>
        <img 
          src={work.thumbnail} 
          alt={work.title} 
          className="w-16 h-16 object-cover rounded-lg"
        />
        <div className="flex-1 ml-4">
          <h4 className="font-semibold truncate">{work.title}</h4>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            {work.category}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs flex items-center gap-1">
              <i className="fas fa-heart"></i> {work.metrics.likes}
            </span>
            <span className="text-xs flex items-center gap-1">
              <i className="fas fa-eye"></i> {work.metrics.views}
            </span>
            <span className="text-xs flex items-center gap-1">
              <i className="fas fa-comment"></i> {work.metrics.comments}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${work.trend === 'up' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : work.trend === 'down' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
            {work.trend === 'up' ? '↑ 上升' : work.trend === 'down' ? '↓ 下降' : '→ 稳定'}
          </span>
          <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            #{work.ranking}
          </span>
        </div>
      </>
    );
  } else if (type === 'user') {
    const user = item as UserActivity;
    content = (
      <>
        <img 
          src={user.avatar} 
          alt={user.username} 
          className="w-16 h-16 object-cover rounded-full"
        />
        <div className="flex-1 ml-4">
          <h4 className="font-semibold">{user.username}</h4>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs flex items-center gap-1">
              <i className="fas fa-image"></i> {user.metrics.worksCreated}
            </span>
            <span className="text-xs flex items-center gap-1">
              <i className="fas fa-heart"></i> {user.metrics.likesReceived}
            </span>
            <span className="text-xs flex items-center gap-1">
              <i className="fas fa-eye"></i> {user.metrics.viewsReceived}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            活跃度: {user.engagementScore}
          </span>
          <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            #{user.ranking}
          </span>
        </div>
      </>
    );
  } else {
    const theme = item as ThemeTrend;
    content = (
      <>
        <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '20' }}>
          <i className="fas fa-palette text-2xl" style={{ color: COLORS.primary }}></i>
        </div>
        <div className="flex-1 ml-4">
          <h4 className="font-semibold">{theme.theme}</h4>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            {theme.category}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs flex items-center gap-1">
              <i className="fas fa-fire"></i> {theme.popularity}
            </span>
            <span className={`text-xs flex items-center gap-1 ${theme.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {theme.growth > 0 ? '↑' : '↓'} {Math.abs(theme.growth)}%
            </span>
            <span className="text-xs flex items-center gap-1">
              <i className="fas fa-image"></i> {theme.worksCount}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            #{theme.ranking}
          </span>
        </div>
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex items-center p-3 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} cursor-pointer hover:shadow-md transition-shadow`}
      whileHover={{ scale: 1.02 }}
      onClick={onViewDetails}
    >
      {content}
    </motion.div>
  );
};

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userId,
  initialMetric = 'views',
  initialTimeRange = '30d',
}) => {
  const { isDark } = useTheme();
  const [activeMetric, setActiveMetric] = useState<MetricType>(initialMetric);
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  
  // 获取数据
  const queryParams: AnalyticsQueryParams = {
    metric: activeMetric,
    timeRange: timeRange,
    groupBy: groupBy,
    filters: {
      userId: userId,
    },
  };
  
  const metricsData = analyticsService.getMetricsData(queryParams);
  const metricsStats = analyticsService.getMetricsStats(metricsData);
  const topWorks = analyticsService.getWorksPerformance(5);
  const topUsers = analyticsService.getUserActivity(5);
  const topThemes = analyticsService.getThemeTrends(5);

  // 渲染图表
  const renderChart = () => {
    if (chartType === 'pie') {
      // 为饼图准备数据
      const pieData = metricsData.map((item, index) => ({
        name: item.label,
        value: item.value,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }));

      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={metricsData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="label" stroke={isDark ? '#9ca3af' : '#6b7280'} />
            <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
            <Tooltip
              contentStyle={{ 
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                borderColor: isDark ? '#374151' : '#e5e7eb',
                color: isDark ? '#f3f4f6' : '#111827',
              }}
            />
            <Legend />
            <Bar 
              dataKey="value" 
              name={activeMetric} 
              fill={COLORS.primary} 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    } else {
      // 默认折线图
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metricsData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="label" stroke={isDark ? '#9ca3af' : '#6b7280'} />
            <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
            <Tooltip
              contentStyle={{ 
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                borderColor: isDark ? '#374151' : '#e5e7eb',
                color: isDark ? '#f3f4f6' : '#111827',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              name={activeMetric} 
              stroke={COLORS.primary} 
              strokeWidth={2}
              dot={{ r: 4, fill: COLORS.primary }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* 数据概览卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard 
          title="总浏览量" 
          value={metricsStats.total} 
          change={metricsStats.growth} 
          icon={<i className="fas fa-eye" style={{ color: COLORS.primary }}></i>}
          color={COLORS.primary}
        />
        <DataCard 
          title="平均数据" 
          value={Math.round(metricsStats.average)} 
          change={metricsStats.growth} 
          icon={<i className="fas fa-chart-line" style={{ color: COLORS.secondary }}></i>}
          color={COLORS.secondary}
        />
        <DataCard 
          title="增长率" 
          value={metricsStats.growth} 
          icon={<i className="fas fa-arrow-trend-up" style={{ color: COLORS.success }}></i>}
          color={metricsStats.growth > 0 ? COLORS.success : metricsStats.growth < 0 ? COLORS.danger : COLORS.info}
          isPercent={true}
          showTrend={false}
        />
        <DataCard 
          title="峰值" 
          value={metricsStats.peak} 
          change={metricsStats.growth} 
          icon={<i className="fas fa-mountain" style={{ color: COLORS.warning }}></i>}
          color={COLORS.warning}
          warning={metricsStats.peak > metricsStats.average * 3} // 当峰值超过平均值3倍时显示警告
        />
      </div>

      {/* 图表控制栏 */}
      <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} flex flex-wrap gap-4 items-center`}>
        <div>
          <h3 className="font-semibold mb-2">数据指标</h3>
          <div className="flex flex-wrap gap-2">
            {(['works', 'likes', 'views', 'comments', 'shares', 'followers', 'participation'] as MetricType[]).map((metric) => (
              <button
                key={metric}
                onClick={() => setActiveMetric(metric)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${activeMetric === metric 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}`}
              >
                {metric === 'works' && '作品数'}
                {metric === 'likes' && '点赞数'}
                {metric === 'views' && '浏览量'}
                {metric === 'comments' && '评论数'}
                {metric === 'shares' && '分享数'}
                {metric === 'followers' && '关注数'}
                {metric === 'participation' && '参与度'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">时间范围</h3>
          <div className="flex flex-wrap gap-2">
            {(['7d', '30d', '90d', '1y', 'all'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${timeRange === range 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}`}
              >
                {range === '7d' && '最近7天'}
                {range === '30d' && '最近30天'}
                {range === '90d' && '最近90天'}
                {range === '1y' && '最近1年'}
                {range === 'all' && '全部时间'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">图表类型</h3>
          <div className="flex gap-2">
            {(['line', 'bar', 'pie'] as ChartType[]).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`p-2 rounded-lg transition-colors ${chartType === type 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}`}
                title={type === 'line' ? '折线图' : type === 'bar' ? '柱状图' : '饼图'}
              >
                {type === 'line' && <i className="fas fa-chart-line"></i>}
                {type === 'bar' && <i className="fas fa-chart-bar"></i>}
                {type === 'pie' && <i className="fas fa-chart-pie"></i>}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">分组方式</h3>
          <div className="flex flex-wrap gap-2">
            {(['day', 'week', 'month', 'year', 'category', 'theme'] as GroupBy[]).map((group) => (
              <button
                key={group}
                onClick={() => setGroupBy(group)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${groupBy === group 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}`}
              >
                {group === 'day' && '按日'}
                {group === 'week' && '按周'}
                {group === 'month' && '按月'}
                {group === 'year' && '按年'}
                {group === 'category' && '按分类'}
                {group === 'theme' && '按主题'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 主图表 */}
      <div id="guide-step-analytics-chart">
        <ChartCard 
          title="数据分析图表" 
          description={`显示${activeMetric}数据，按${timeRange}时间范围，以${groupBy}分组`}
        >
          {renderChart()}
        </ChartCard>
      </div>

      {/* 作品表现 */}
      <div>
        <h3 className="text-xl font-bold mb-4">热门作品表现</h3>
        <div className="space-y-3">
          {topWorks.map((work) => (
            <PerformanceCard 
              key={work.workId} 
              item={work} 
              type="work"
              onViewDetails={() => {}}
            />
          ))}
        </div>
      </div>

      {/* 热门创作者 */}
      <div>
        <h3 className="text-xl font-bold mb-4">热门创作者</h3>
        <div className="space-y-3">
          {topUsers.map((user) => (
            <PerformanceCard 
              key={user.userId} 
              item={user} 
              type="user"
              onViewDetails={() => {}}
            />
          ))}
        </div>
      </div>

      {/* 热门主题 */}
      <div>
        <h3 className="text-xl font-bold mb-4">热门主题趋势</h3>
        <div className="space-y-3">
          {topThemes.map((theme) => (
            <PerformanceCard 
              key={theme.theme} 
              item={theme} 
              type="theme"
              onViewDetails={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;