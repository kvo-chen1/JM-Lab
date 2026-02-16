import { useState, useEffect, useContext, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import organizerAnalyticsService, {
  TimeRange,
  DashboardStats,
  TrendData,
  ScoreDistribution,
  TopWorkDetail,
  Activity,
  EventSummary,
} from '@/services/organizerAnalyticsService';
import { eventParticipationService } from '@/services/eventParticipationService';
import { StatCard } from './components/StatCard';
import { TrendChart } from './components/TrendChart';
import { DistributionChart } from './components/DistributionChart';
import { RealtimeFeed } from './components/RealtimeFeed';
import { TopWorksTable } from './components/TopWorksTable';
import {
  CalendarDays,
  Upload,
  Eye,
  Heart,
  MessageCircle,
  Star,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Filter,
  ChevronDown,
  BarChart3,
  PieChart,
  Activity as ActivityIcon,
  Trophy,
  TrendingUp,
} from 'lucide-react';

// 时间范围选项
const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: 'today', label: '今日' },
  { value: '7d', label: '近7天' },
  { value: '30d', label: '近30天' },
  { value: '90d', label: '近90天' },
  { value: '1y', label: '近1年' },
  { value: 'all', label: '全部' },
];

// 趋势指标选项
const trendMetricOptions = [
  { value: 'submissions', label: '作品提交', color: '#3B82F6' },
  { value: 'views', label: '浏览量', color: '#10B981' },
  { value: 'likes', label: '点赞数', color: '#F59E0B' },
  { value: 'comments', label: '评论数', color: '#8B5CF6' },
  { value: 'all', label: '全部指标', color: '#6B7280' },
];

export default function AnalyticsDashboard() {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);

  // 状态
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [trendMetric, setTrendMetric] = useState<string>('submissions');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 数据状态
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistribution[]>([]);
  const [topWorks, setTopWorks] = useState<TopWorkDetail[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [events, setEvents] = useState<EventSummary[]>([]);

  // 加载数据
  const loadData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const [
        statsData,
        trendDataResult,
        distributionData,
        worksData,
        activitiesData,
        eventsData,
      ] = await Promise.all([
        organizerAnalyticsService.getDashboardStats(user.id, timeRange),
        organizerAnalyticsService.getWorksTrend(
          user.id,
          selectedEvent === 'all' ? undefined : selectedEvent,
          timeRange === 'today' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
        ),
        organizerAnalyticsService.getScoreDistribution(
          user.id,
          selectedEvent === 'all' ? undefined : selectedEvent
        ),
        organizerAnalyticsService.getTopWorks(
          user.id,
          selectedEvent === 'all' ? undefined : selectedEvent,
          10,
          'views'
        ),
        organizerAnalyticsService.getRecentActivities(user.id, 20),
        organizerAnalyticsService.getOrganizerEvents(user.id),
      ]);

      setStats(statsData);
      setTrendData(trendDataResult);
      setScoreDistribution(distributionData);
      setTopWorks(worksData);
      setActivities(activitiesData);
      setEvents(eventsData);
    } catch (error) {
      console.error('加载数据分析失败:', error);
      toast.error('加载数据失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, timeRange, selectedEvent]);

  // 刷新数据
  const refreshData = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    toast.success('数据已刷新');
  };

  // 初始加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 格式化数字
  const formatNumber = (num: number | undefined | null) => {
    return organizerAnalyticsService.formatNumber(num);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和工具栏 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            数据分析
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            实时查看活动数据、作品表现和用户参与度
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* 时间范围选择 */}
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className={`
                appearance-none pl-4 pr-10 py-2 rounded-xl border text-sm font-medium
                ${isDark
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500/20
              `}
            >
              {timeRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* 活动筛选 */}
          <div className="relative">
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className={`
                appearance-none pl-4 pr-10 py-2 rounded-xl border text-sm font-medium min-w-[140px]
                ${isDark
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500/20
              `}
            >
              <option value="all">全部活动</option>
              {events.map((event) => (
                <option key={event.event_id} value={event.event_id}>
                  {event.event_title}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* 刷新按钮 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={refreshData}
            disabled={isRefreshing}
            className={`
              p-2 rounded-xl border transition-all
              ${isDark
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                : 'bg-white border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>

          {/* 导出按钮 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
              bg-blue-600 hover:bg-blue-700 text-white transition-colors
            `}
          >
            <Download className="w-4 h-4" />
            导出报告
          </motion.button>
        </div>
      </motion.div>

      {/* 核心指标卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <StatCard
          title="作品总数"
          value={formatNumber(stats?.totalSubmissions || 0)}
          icon={Upload}
          color="blue"
          loading={isLoading}
        />
        <StatCard
          title="总投票数"
          value={formatNumber(stats?.totalVotes || 0)}
          icon={Eye}
          color="green"
          loading={isLoading}
        />
        <StatCard
          title="总点赞数"
          value={formatNumber(stats?.totalLikes || 0)}
          icon={Heart}
          color="pink"
          loading={isLoading}
        />
        <StatCard
          title="平均评分"
          value={stats?.avgScore ? stats.avgScore.toFixed(1) : '0.0'}
          icon={Star}
          color="orange"
          loading={isLoading}
        />
      </motion.div>

      {/* 第二行指标 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <StatCard
          title="活动数量"
          value={stats?.totalEvents || 0}
          icon={CalendarDays}
          color="purple"
          loading={isLoading}
        />
        <StatCard
          title="待审核作品"
          value={stats?.pendingReview || 0}
          icon={Clock}
          color="orange"
          loading={isLoading}
        />
      </motion.div>

      {/* 主内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：趋势图表 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`
            lg:col-span-2 rounded-2xl border p-6
            ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}
          `}
        >
          {/* 图表标题和指标选择 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                趋势分析
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {trendMetricOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTrendMetric(option.value)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${trendMetric === option.value
                      ? 'text-white'
                      : isDark
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                  style={{
                    backgroundColor: trendMetric === option.value ? option.color : undefined,
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 趋势图 */}
          <TrendChart
            data={trendData}
            metric={trendMetric as any}
            height={300}
          />
        </motion.div>

        {/* 右侧：实时活动 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className={`
            rounded-2xl border p-6
            ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}
          `}
        >
          <div className="flex items-center gap-2 mb-4">
            <ActivityIcon className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              实时动态
            </h3>
            <span className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-gray-500">实时更新</span>
            </span>
          </div>

          <RealtimeFeed activities={activities} loading={isLoading} />
        </motion.div>
      </div>

      {/* 第二行内容 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 评分分布 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`
            rounded-2xl border p-6
            ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}
          `}
        >
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              评分分布
            </h3>
          </div>

          <DistributionChart data={scoreDistribution} />
        </motion.div>

        {/* 热门作品排行 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className={`
            lg:col-span-2 rounded-2xl border p-6
            ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}
          `}
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              热门作品排行
            </h3>
          </div>

          <TopWorksTable works={topWorks} loading={isLoading} />
        </motion.div>
      </div>
    </div>
  );
}
