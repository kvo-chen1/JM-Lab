import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
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
  Layers,
  ChevronRight,
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
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const eventDropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  // 数据状态
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistribution[]>([]);
  const [topWorks, setTopWorks] = useState<TopWorkDetail[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedEventData, setSelectedEventData] = useState<EventSummary | null>(null);

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
        organizerAnalyticsService.getDashboardStats(user.id, timeRange, selectedEvent === 'all' ? undefined : selectedEvent),
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
        organizerAnalyticsService.getRecentActivities(user.id, 20, selectedEvent === 'all' ? undefined : selectedEvent),
        organizerAnalyticsService.getOrganizerEvents(user.id),
      ]);

      setStats(statsData);
      setTrendData(trendDataResult);
      setScoreDistribution(distributionData);
      setTopWorks(worksData);
      setActivities(activitiesData);
      setEvents(eventsData);

      // 更新选中的活动数据
      if (selectedEvent !== 'all') {
        const event = eventsData.find(e => e.event_id === selectedEvent);
        setSelectedEventData(event || null);
      } else {
        setSelectedEventData(null);
      }
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

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEventDropdownOpen && eventDropdownRef.current && !eventDropdownRef.current.contains(event.target as Node)) {
        setIsEventDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEventDropdownOpen]);

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

          {/* 活动筛选 - 自定义下拉 */}
          <div className="relative" ref={eventDropdownRef}>
            <button
              onClick={() => {
                if (!isEventDropdownOpen && eventDropdownRef.current) {
                  const rect = eventDropdownRef.current.getBoundingClientRect();
                  setDropdownPosition({
                    top: rect.bottom + window.scrollY + 8,
                    right: window.innerWidth - rect.right - window.scrollX,
                  });
                }
                setIsEventDropdownOpen(!isEventDropdownOpen);
              }}
              className={`
                flex items-center gap-2 pl-4 pr-10 py-2 rounded-xl border text-sm font-medium min-w-[160px]
                ${isDark
                  ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                  : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors
              `}
            >
              <Layers className="w-4 h-4 text-blue-500" />
              <span className="truncate">
                {selectedEvent === 'all' ? '全部活动' : selectedEventData?.event_title || '选择活动'}
              </span>
            </button>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform ${isEventDropdownOpen ? 'rotate-180' : ''}`} />

            {/* 下拉菜单 - 使用 Portal 渲染到 body */}
            {isEventDropdownOpen && createPortal(
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    position: 'fixed',
                    top: dropdownPosition.top,
                    right: dropdownPosition.right,
                    zIndex: 9999,
                  }}
                  className={`
                    w-72 rounded-xl border shadow-2xl overflow-hidden
                    ${isDark
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                    }
                  `}
                >
                  {/* 全部活动选项 */}
                  <button
                    onClick={() => {
                      setSelectedEvent('all');
                      setIsEventDropdownOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                      ${selectedEvent === 'all'
                        ? (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600')
                        : (isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700')
                      }
                    `}
                  >
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center
                      ${selectedEvent === 'all'
                        ? 'bg-blue-500 text-white'
                        : (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')
                      }
                    `}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">全部活动</div>
                      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        查看所有活动的汇总数据
                      </div>
                    </div>
                    {selectedEvent === 'all' && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </button>

                  {/* 分隔线 */}
                  {events.length > 0 && (
                    <div className={`h-px mx-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  )}

                  {/* 活动列表 */}
                  <div className="max-h-64 overflow-y-auto py-2">
                    {events.length === 0 ? (
                      <div className={`px-4 py-4 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        暂无活动
                      </div>
                    ) : (
                      events.map((event) => (
                        <button
                          key={event.event_id}
                          onClick={() => {
                            setSelectedEvent(event.event_id);
                            setIsEventDropdownOpen(false);
                          }}
                          className={`
                            w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                            ${selectedEvent === event.event_id
                              ? (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600')
                              : (isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700')
                            }
                          `}
                        >
                          <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                            ${selectedEvent === event.event_id
                              ? 'bg-blue-500 text-white'
                              : (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')
                            }
                          `}>
                            {event.event_title.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{event.event_title}</div>
                            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {event.total_submissions} 作品 · {event.total_views} 浏览
                            </div>
                          </div>
                          {selectedEvent === event.event_id && (
                            <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>,
              document.body
            )}
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

      {/* 选中活动信息卡片 */}
      <AnimatePresence mode="wait">
        {selectedEventData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`
              rounded-2xl border p-5
              ${isDark ? 'bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-800/30' : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'}
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold
                  ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}
                `}>
                  {selectedEventData.event_title.charAt(0)}
                </div>
                <div>
                  <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedEventData.event_title}
                  </h3>
                  <div className={`flex items-center gap-4 text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" />
                      {selectedEventData.start_date && selectedEventData.end_date
                        ? `${new Date(selectedEventData.start_date).toLocaleDateString('zh-CN')} - ${new Date(selectedEventData.end_date).toLocaleDateString('zh-CN')}`
                        : '时间待定'}
                    </span>
                    <span className={`
                      px-2 py-0.5 rounded-full text-xs
                      ${selectedEventData.status === 'active' 
                        ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600')
                        : selectedEventData.status === 'ended'
                        ? (isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600')
                        : (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600')
                      }
                    `}>
                      {selectedEventData.status === 'active' ? '进行中' 
                        : selectedEventData.status === 'ended' ? '已结束' 
                        : '筹备中'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent('all')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
                `}
              >
                <span>查看全部</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 核心指标卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <StatCard
          title={selectedEventData ? "活动作品数" : "作品总数"}
          value={formatNumber(stats?.totalSubmissions || 0)}
          icon={Upload}
          color="blue"
          loading={isLoading}
        />
        <StatCard
          title={selectedEventData ? "活动投票数" : "总投票数"}
          value={formatNumber(stats?.totalVotes || 0)}
          icon={Eye}
          color="green"
          loading={isLoading}
        />
        <StatCard
          title={selectedEventData ? "活动点赞数" : "总点赞数"}
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
