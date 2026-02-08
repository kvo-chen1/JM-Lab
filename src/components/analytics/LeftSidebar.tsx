import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { 
  BarChart3, 
  Heart, 
  Eye, 
  MessageCircle, 
  Share2, 
  Users, 
  Activity,
  Image,
  Calendar,
  LineChart,
  PieChart,
  AreaChart,
  Clock,
  ChevronDown,
  Filter
} from 'lucide-react';
import { useState } from 'react';
import { MetricType, TimeRange, GroupBy } from '@/services/analyticsService';

type ChartType = 'line' | 'bar' | 'pie' | 'area';

interface LeftSidebarProps {
  activeMetric: MetricType;
  setActiveMetric: (metric: MetricType) => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  chartType: ChartType;
  setChartType: (type: ChartType) => void;
  groupBy: GroupBy;
  setGroupBy: (group: GroupBy) => void;
}

const metrics = [
  { id: 'works' as MetricType, label: '作品数', icon: Image, color: '#8b5cf6' },
  { id: 'likes' as MetricType, label: '点赞数', icon: Heart, color: '#ef4444' },
  { id: 'views' as MetricType, label: '浏览量', icon: Eye, color: '#3b82f6' },
  { id: 'comments' as MetricType, label: '评论数', icon: MessageCircle, color: '#06b6d4' },
  { id: 'shares' as MetricType, label: '分享数', icon: Share2, color: '#10b981' },
  { id: 'followers' as MetricType, label: '关注数', icon: Users, color: '#f59e0b' },
  { id: 'participation' as MetricType, label: '参与度', icon: Activity, color: '#ec4899' },
];

const timeRanges = [
  { id: '7d' as TimeRange, label: '最近7天' },
  { id: '30d' as TimeRange, label: '最近30天' },
  { id: '90d' as TimeRange, label: '最近90天' },
  { id: '1y' as TimeRange, label: '最近1年' },
  { id: 'all' as TimeRange, label: '全部时间' },
];

const chartTypes = [
  { id: 'line' as ChartType, label: '折线图', icon: LineChart },
  { id: 'bar' as ChartType, label: '柱状图', icon: BarChart3 },
  { id: 'pie' as ChartType, label: '饼图', icon: PieChart },
  { id: 'area' as ChartType, label: '面积图', icon: AreaChart },
];

const groupOptions = [
  { id: 'day' as GroupBy, label: '按日' },
  { id: 'week' as GroupBy, label: '按周' },
  { id: 'month' as GroupBy, label: '按月' },
  { id: 'year' as GroupBy, label: '按年' },
  { id: 'category' as GroupBy, label: '按分类' },
  { id: 'theme' as GroupBy, label: '按主题' },
];

export default function LeftSidebar({
  activeMetric,
  setActiveMetric,
  timeRange,
  setTimeRange,
  chartType,
  setChartType,
  groupBy,
  setGroupBy,
}: LeftSidebarProps) {
  const { isDark } = useTheme();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const cardClass = `${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-2xl overflow-hidden`;

  return (
    <div className="space-y-4">
      {/* 数据指标选择 */}
      <div className={cardClass}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-red-500" />
            数据指标
          </h3>
        </div>
        <div className="p-2">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const isActive = activeMetric === metric.id;
            return (
              <motion.button
                key={metric.id}
                onClick={() => setActiveMetric(metric.id)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mb-1 ${
                  isActive
                    ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                    : `${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-50'}`
                }`}
              >
                <Icon 
                  className="w-4 h-4" 
                  style={{ color: isActive ? metric.color : undefined }}
                />
                <span className="font-medium">{metric.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeMetric"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 时间范围选择 */}
      <div className={cardClass}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            时间范围
          </h3>
        </div>
        <div className="p-3">
          <div className="flex flex-wrap gap-2">
            {timeRanges.map((range) => (
              <motion.button
                key={range.id}
                onClick={() => setTimeRange(range.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  timeRange === range.id
                    ? 'bg-red-500 text-white shadow-md'
                    : `${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`
                }`}
              >
                {range.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* 图表类型 */}
      <div className={cardClass}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <LineChart className="w-4 h-4 text-purple-500" />
            图表类型
          </h3>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-4 gap-2">
            {chartTypes.map((type) => {
              const Icon = type.icon;
              const isActive = chartType === type.id;
              return (
                <motion.button
                  key={type.id}
                  onClick={() => setChartType(type.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={type.label}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                      : `${isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-50'}`
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px]">{type.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 分组方式 */}
      <div className={cardClass}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-500" />
            分组方式
          </h3>
        </div>
        <div className="p-3">
          <div className="flex flex-wrap gap-2">
            {groupOptions.map((group) => (
              <motion.button
                key={group.id}
                onClick={() => setGroupBy(group.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  groupBy === group.id
                    ? 'bg-red-500 text-white shadow-md'
                    : `${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`
                }`}
              >
                {group.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* 高级筛选 */}
      <div className={cardClass}>
        <motion.button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`w-full px-4 py-3 flex items-center justify-between ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'} transition-colors`}
        >
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Filter className="w-4 h-4 text-orange-500" />
            高级筛选
          </h3>
          <motion.div
            animate={{ rotate: showAdvanced ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </motion.div>
        </motion.button>
        <motion.div
          initial={false}
          animate={{ height: showAdvanced ? 'auto' : 0, opacity: showAdvanced ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="px-4 pb-4 space-y-3">
            <div>
              <label className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1 block`}>
                最小数值
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-red-500"
              />
            </div>
            <div>
              <label className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1 block`}>
                数据标签
              </label>
              <input
                type="text"
                placeholder="输入标签筛选..."
                className={`w-full px-3 py-2 rounded-lg text-sm border ${
                  isDark 
                    ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400'
                } focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
