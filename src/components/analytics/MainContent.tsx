import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAnalyticsStore } from '@/stores/useAnalyticsStore';
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
  AreaChart 
} from 'recharts';
import { 
  Eye, 
  TrendingUp, 
  Mountain, 
  BarChart3,
  AlertTriangle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { MetricType, TimeRange, GroupBy, ExportFormat } from '@/services/analyticsService';

type ChartType = 'line' | 'bar' | 'pie' | 'area';

interface MainContentProps {
  activeMetric: MetricType;
  timeRange: TimeRange;
  chartType: ChartType;
  groupBy: GroupBy;
  onExport: (format: ExportFormat) => void;
}

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

const metricConfig: Record<MetricType, { label: string; icon: typeof Eye; color: string; unit: string }> = {
  works: { label: '作品数', icon: BarChart3, color: '#8b5cf6', unit: '个' },
  likes: { label: '点赞数', icon: TrendingUp, color: '#ef4444', unit: '次' },
  views: { label: '浏览量', icon: Eye, color: '#3b82f6', unit: '次' },
  comments: { label: '评论数', icon: BarChart3, color: '#06b6d4', unit: '条' },
  shares: { label: '分享数', icon: TrendingUp, color: '#10b981', unit: '次' },
  followers: { label: '关注数', icon: TrendingUp, color: '#f59e0b', unit: '人' },
  participation: { label: '参与度', icon: BarChart3, color: '#ec4899', unit: '%' },
};

export default function MainContent({ 
  activeMetric, 
  timeRange, 
  chartType, 
  groupBy,
  onExport 
}: MainContentProps) {
  const { isDark } = useTheme();
  const { dataPoints: metricsData, stats: metricsStats, isLoading } = useAnalyticsStore();

  const cardClass = `${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-2xl overflow-hidden`;
  const currentMetric = metricConfig[activeMetric];

  const formatNumber = (num: number | string): string => {
    const parsedNum = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(parsedNum)) return '0';
    return parsedNum.toLocaleString('zh-CN');
  };

  const formatPercent = (num: number): string => {
    if (isNaN(num)) return '0.0';
    return num.toFixed(1);
  };

  // 数据卡片组件
  const DataCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color,
    isPercent = false,
    warning = false 
  }: { 
    title: string; 
    value: string | number; 
    change?: number; 
    icon: typeof Eye; 
    color: string;
    isPercent?: boolean;
    warning?: boolean;
  }) => {
    const displayValue = isPercent 
      ? `${formatPercent(typeof value === 'number' ? value : parseFloat(value as string))}%` 
      : formatNumber(value);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)' }}
        className={`${cardClass} p-5 transition-shadow`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{title}</p>
            <div className="flex items-center gap-2 mt-1">
              <h4 className="text-2xl font-bold" style={{ color }}>{displayValue}</h4>
              {warning && (
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              )}
            </div>
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${
                change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-slate-400'
              }`}>
                {change > 0 ? <ArrowUpRight className="w-3 h-3" /> : 
                 change < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                <span>{formatPercent(Math.abs(change))}%</span>
              </div>
            )}
          </div>
          <div 
            className="p-3 rounded-xl"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </div>
      </motion.div>
    );
  };

  // 渲染图表
  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-12 h-12 border-3 border-red-200 border-t-red-500 rounded-full"
          />
          <p className={`mt-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>正在加载数据...</p>
        </div>
      );
    }

    if (metricsData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-400">
          <BarChart3 className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">暂无分析数据</p>
          <p className="text-sm opacity-70 mt-1">请尝试调整筛选条件或稍后再试</p>
        </div>
      );
    }

    const chartData = metricsData.map((item, index) => ({
      ...item,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

    const commonTooltipStyle = {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      color: isDark ? '#f1f5f9' : '#0f172a',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    };

    if (chartType === 'pie') {
      const pieData = chartData.map((item) => ({
        name: item.label,
        value: item.value,
        color: item.color,
      }));

      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={3}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={commonTooltipStyle} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
            <XAxis
              dataKey="label"
              stroke={isDark ? '#64748b' : '#64748b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                // 确保日期格式正确显示
                if (typeof value === 'string' && value.includes('-')) {
                  return value;
                }
                return value;
              }}
            />
            <YAxis 
              stroke={isDark ? '#64748b' : '#64748b'} 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip contentStyle={commonTooltipStyle} />
            <Bar 
              dataKey="value" 
              name={currentMetric.label} 
              fill={currentMetric.color} 
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentMetric.color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={currentMetric.color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
            <XAxis
              dataKey="label"
              stroke={isDark ? '#64748b' : '#64748b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                // 确保日期格式正确显示
                if (typeof value === 'string' && value.includes('-')) {
                  return value;
                }
                return value;
              }}
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
              dataKey="value"
              name={currentMetric.label}
              stroke={currentMetric.color}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
            <XAxis
              dataKey="label"
              stroke={isDark ? '#64748b' : '#64748b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                // 确保日期格式正确显示
                if (typeof value === 'string' && value.includes('-')) {
                  return value;
                }
                return value;
              }}
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
              dataKey="value"
              name={currentMetric.label}
              stroke={currentMetric.color}
              strokeWidth={3}
              dot={{ r: 4, fill: currentMetric.color, strokeWidth: 2, stroke: isDark ? '#1e293b' : '#ffffff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* 关键指标卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard 
          title={`总${currentMetric.label}`}
          value={metricsStats.total} 
          change={metricsStats.growth} 
          icon={currentMetric.icon}
          color={currentMetric.color}
        />
        <DataCard 
          title="平均数据" 
          value={Math.round(metricsStats.average)} 
          change={metricsStats.growth} 
          icon={BarChart3}
          color={COLORS.secondary}
        />
        <DataCard 
          title="增长率" 
          value={metricsStats.growth} 
          icon={TrendingUp}
          color={metricsStats.growth > 0 ? COLORS.success : metricsStats.growth < 0 ? COLORS.danger : COLORS.info}
          isPercent={true}
        />
        <DataCard 
          title="峰值" 
          value={metricsStats.peak} 
          change={metricsStats.growth} 
          icon={Mountain}
          color={COLORS.warning}
          warning={metricsStats.peak > metricsStats.average * 3}
        />
      </div>

      {/* 主图表区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cardClass}
      >
        <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'} flex items-center justify-between`}>
          <div>
            <h3 className="font-semibold text-lg">{currentMetric.label}趋势分析</h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {timeRange === '7d' && '最近7天'}
              {timeRange === '30d' && '最近30天'}
              {timeRange === '90d' && '最近90天'}
              {timeRange === '1y' && '最近1年'}
              {timeRange === 'all' && '全部时间'}
              {' · '}
              {groupBy === 'day' && '按日'}
              {groupBy === 'week' && '按周'}
              {groupBy === 'month' && '按月'}
              {groupBy === 'year' && '按年'}
              {groupBy === 'category' && '按分类'}
              {groupBy === 'theme' && '按主题'}
              分组
            </p>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onExport('json')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isDark 
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              导出 JSON
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onExport('csv')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isDark 
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              导出 CSV
            </motion.button>
          </div>
        </div>
        <div className="p-6">
          {renderChart()}
        </div>
      </motion.div>

      {/* 数据洞察 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={cardClass}
      >
        <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" />
            数据洞察
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>增长趋势</span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {metricsStats.growth > 0 
                  ? `数据呈现上升趋势，较上期增长 ${formatPercent(metricsStats.growth)}%，表现良好。`
                  : metricsStats.growth < 0
                  ? `数据有所下降，较上期减少 ${formatPercent(Math.abs(metricsStats.growth))}%，建议关注。`
                  : '数据保持稳定，与上期持平。'}
              </p>
            </div>
            <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>平均水平</span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                平均{currentMetric.label}为 {formatNumber(Math.round(metricsStats.average))} {currentMetric.unit}，
                {metricsStats.peak > metricsStats.average * 2 
                  ? '峰值较高，存在明显的波动特征。'
                  : '数据分布相对均匀。'}
              </p>
            </div>
            <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Mountain className="w-4 h-4 text-orange-500" />
                <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>峰值分析</span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                最高{currentMetric.label}达到 {formatNumber(metricsStats.peak)} {currentMetric.unit}，
                {metricsStats.peak > metricsStats.average * 3 
                  ? '显著高于平均水平，可能存在异常值。'
                  : '处于正常范围内。'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
