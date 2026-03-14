import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { analyticsTrackingService } from '@/services/analyticsTrackingService';
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  RefreshCw,
  Activity,
  Users,
  Calendar,
  DollarSign,
  Eye,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Monitor,
  Funnel,
  Flame,
  Sparkles,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  UserPlus,
  Edit,
  Send,
  Heart,
  Package,
  Gift,
  Crown,
  LineChart,
  Share2,
  X
} from 'lucide-react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ==================== 类型定义 ====================

interface RealTimeStats {
  activeUsers: number;
  viewsPerMinute: number;
  newUsers: number;
  newWorks: number;
  newOrders: number;
  revenue: number;
}

interface UserFunnelData {
  stage: string;
  count: number;
  conversionRate: number;
  icon: any;
}

interface CohortData {
  period: string;
  users: number;
  day1: number;
  day7: number;
  day14: number;
  day30: number;
}

interface RevenueBreakdown {
  source: string;
  amount: number;
  percentage: number;
  trend: number;
  icon: any;
  color: string;
}

interface ChannelROI {
  channel: string;
  cost: number;
  revenue: number;
  roi: number;
  conversions: number;
  ctr: number;
}

interface HotTopic {
  topic: string;
  heat: number;
  trend: 'up' | 'down' | 'stable';
  growth: number;
  relatedWorks: number;
  prediction: string;
}

interface UserDemographics {
  ageGroups: { group: string; percentage: number }[];
  gender: { type: string; percentage: number }[];
  topCities: { city: string; percentage: number }[];
  activeHours: { hour: number; percentage: number }[];
  interests: { interest: string; count: number; percentage: number }[];
}

interface WorkPropagationNode {
  work_id: string;
  work_title: string;
  creator_id: string;
  creator_name: string;
  view_count: number;
  share_count: number;
  like_count: number;
  comment_count: number;
  propagation_score: number;
  propagation_path: string[];
  created_at: string;
}

// ==================== 工具函数 ====================

const formatNumber = (num: number | undefined | null): string => {
  if (!num) return '0';
  if (num >= 100000000) return (num / 100000000).toFixed(2) + '亿';
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
  return num.toLocaleString();
};

const formatCurrency = (num: number | undefined | null): string => {
  if (!num) return '¥0.00';
  return '¥' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatPercent = (num: number | undefined | null): string => {
  if (!num) return '0.00%';
  return (num * 100).toFixed(2) + '%';
};

const COLORS = {
  primary: ['#ef4444', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4'],
  revenue: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'],
  funnel: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'],
};

// ==================== 主组件 ====================

interface AdvancedAnalyticsProps {
  onExitAdvancedView?: () => void;
  embedded?: boolean;
}

export default function AdvancedAnalytics({ onExitAdvancedView, embedded = false }: AdvancedAnalyticsProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(30000); // 30 秒
  const containerRef = useRef<HTMLDivElement>(null);

  // 实时数据
  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats>({
    activeUsers: 0,
    viewsPerMinute: 0,
    newUsers: 0,
    newWorks: 0,
    newOrders: 0,
    revenue: 0,
  });

  // 用户行为漏斗数据
  const [userFunnelData, setUserFunnelData] = useState<UserFunnelData[]>([]);

  // 留存率数据
  const [cohortData, setCohortData] = useState<CohortData[]>([]);

  // 收入分析数据
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown[]>([]);

  // ROI 分析数据
  const [channelROI, setChannelROI] = useState<ChannelROI[]>([]);

  // 热点预测数据
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);

  // 用户画像数据
  const [userDemographics, setUserDemographics] = useState<UserDemographics>({
    ageGroups: [],
    gender: [],
    topCities: [],
    activeHours: [],
    interests: [],
  });

  // 作品传播数据
  const [hotPropagationWorks, setHotPropagationWorks] = useState<WorkPropagationNode[]>([]);

  // ==================== 数据获取 ====================

  const fetchAnalyticsData = useCallback(async () => {
    try {
      console.log('开始获取高级分析数据...');

      // 1. 获取实时数据
      await fetchRealTimeStats();

      // 2. 获取用户行为漏斗
      await fetchUserFunnel();

      // 3. 获取留存率数据
      await fetchCohortData();

      // 4. 获取收入分析
      await fetchRevenueBreakdown();

      // 5. 获取 ROI 分析
      await fetchChannelROI();

      // 6. 获取热点预测
      await fetchHotTopics();

      // 7. 获取用户画像
      await fetchUserDemographics();

      // 8. 获取作品传播数据
      await fetchPropagationData();

      console.log('高级分析数据获取完成');
    } catch (error) {
      console.error('获取高级分析数据失败:', error);
      toast.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取实时数据
  const fetchRealTimeStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/analytics/realtime-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取实时统计数据失败');
      }

      const result = await response.json();
      if (result.code === 0 && result.data) {
        setRealTimeStats({
          activeUsers: result.data.activeUsers || 0,
          viewsPerMinute: result.data.viewsPerMinute || 0,
          newUsers: result.data.newUsers || 0,
          newWorks: result.data.newWorks || 0,
          newOrders: result.data.newOrders || 0,
          revenue: result.data.revenue || 0,
        });
      }
    } catch (error) {
      console.error('获取实时数据失败:', error);
    }
  };

  // 获取用户行为漏斗
  const fetchUserFunnel = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/analytics/conversion-funnel', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取转化漏斗数据失败');
      }

      const result = await response.json();
      if (result.code === 0 && result.data) {
        const funnel: UserFunnelData[] = (result.data || []).map((item: any) => ({
          stage: item.stage,
          count: item.count,
          conversionRate: item.conversion_rate,
          icon: item.stage === '注册用户' ? UserPlus :
                 item.stage === '创作用户' ? Edit :
                 item.stage === '发布用户' ? Send : Heart,
        }));
        setUserFunnelData(funnel);
      }
    } catch (error) {
      console.error('获取漏斗数据失败:', error);
    }
  };

  // 获取留存率数据
  const fetchCohortData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/analytics/retention', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取留存率数据失败');
      }

      const result = await response.json();
      if (result.code === 0 && result.data) {
        const cohorts: CohortData[] = (result.data || []).map((item: any) => ({
          period: item.period,
          users: item.total_users,
          day1: Math.floor(item.total_users * item.day1_retention),
          day7: Math.floor(item.total_users * item.day7_retention),
          day14: Math.floor(item.total_users * item.day14_retention),
          day30: Math.floor(item.total_users * item.day30_retention),
        }));
        setCohortData(cohorts);
      }
    } catch (error) {
      console.error('获取留存数据失败:', error);
    }
  };

  // 获取收入分析
  const fetchRevenueBreakdown = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/analytics/revenue', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取收入数据失败');
      }

      const result = await response.json();
      if (result.code === 0 && result.data) {
        const { promotionRevenue, membershipRevenue, blindBoxRevenue, totalRevenue } = result.data;

        const breakdown: RevenueBreakdown[] = [
          {
            source: '推广订单',
            amount: promotionRevenue || 0,
            percentage: totalRevenue > 0 ? (promotionRevenue || 0) / totalRevenue : 0,
            trend: 15.2,
            icon: ShoppingCart,
            color: '#10b981',
          },
          {
            source: '会员订阅',
            amount: membershipRevenue || 0,
            percentage: totalRevenue > 0 ? (membershipRevenue || 0) / totalRevenue : 0,
            trend: 8.5,
            icon: Crown,
            color: '#3b82f6',
          },
          {
            source: '盲盒销售',
            amount: blindBoxRevenue || 0,
            percentage: totalRevenue > 0 ? (blindBoxRevenue || 0) / totalRevenue : 0,
            trend: 12.3,
            icon: Gift,
            color: '#8b5cf6',
          },
          {
            source: '其他收入',
            amount: 0,
            percentage: 0,
            trend: 0,
            icon: Package,
            color: '#f59e0b',
          },
        ];

        setRevenueBreakdown(breakdown);
      }
    } catch (error) {
      console.error('获取收入数据失败:', error);
    }
  };

  // 获取 ROI 分析
  const fetchChannelROI = async () => {
    try {
      // 暂时使用模拟数据，后续可以添加专门的 API
      const channels: ChannelROI[] = [
        {
          channel: '信息流广告',
          cost: 5000,
          revenue: 15000,
          roi: 2.0,
          conversions: 45,
          ctr: 0.035,
        },
        {
          channel: '社交媒体',
          cost: 3000,
          revenue: 8000,
          roi: 1.67,
          conversions: 32,
          ctr: 0.042,
        },
        {
          channel: '搜索引擎',
          cost: 4000,
          revenue: 12000,
          roi: 2.0,
          conversions: 38,
          ctr: 0.028,
        },
        {
          channel: 'KOL 合作',
          cost: 8000,
          revenue: 25000,
          roi: 2.13,
          conversions: 65,
          ctr: 0.055,
        },
        {
          channel: '内容营销',
          cost: 2000,
          revenue: 6000,
          roi: 2.0,
          conversions: 28,
          ctr: 0.038,
        },
      ];

      setChannelROI(channels);
    } catch (error) {
      console.error('获取 ROI 数据失败:', error);
    }
  };

  // 获取热点预测
  const fetchHotTopics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/analytics/hot-topics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取热点话题数据失败');
      }

      const result = await response.json();
      if (result.code === 0 && result.data) {
        const topics: HotTopic[] = (result.data || []).map((item: any) => ({
          topic: item.tag,
          heat: item.heat_score,
          trend: item.trend === 'rising' ? 'up' : item.trend === 'falling' ? 'down' : 'stable',
          growth: item.growth_rate,
          relatedWorks: item.work_count,
          prediction: item.trend === 'rising' ? '预计未来 7 天热度持续上升' :
                      item.trend === 'falling' ? '热度有所下降' : '保持稳定增长态势',
        }));
        setHotTopics(topics);
      }
    } catch (error) {
      console.error('获取热点数据失败:', error);
    }
  };

  // 获取用户画像
  const fetchUserDemographics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/analytics/demographics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取用户画像数据失败');
      }

      const result = await response.json();
      if (result.code === 0 && result.data) {
        setUserDemographics({
          ageGroups: result.data.age_groups || [],
          gender: result.data.gender_distribution || [],
          topCities: result.data.top_cities || [],
          activeHours: result.data.active_hours || [],
          interests: result.data.interests || [],
        });
      }
    } catch (error) {
      console.error('获取用户画像失败:', error);
    }
  };

  // 获取作品传播数据
  const fetchPropagationData = async () => {
    try {
      // 使用 analyticsTrackingService 获取热门传播作品
      const propagationWorks = await analyticsTrackingService.getHotPropagationWorks(10);
      setHotPropagationWorks(propagationWorks);
    } catch (error) {
      console.error('获取作品传播数据失败:', error);
    }
  };

  // 自动刷新
  useEffect(() => {
    fetchAnalyticsData();

    if (autoRefresh) {
      const interval = setInterval(fetchAnalyticsData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchAnalyticsData]);

  // 全屏切换
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  // ==================== 渲染辅助组件 ====================

  const RealTimeCard = ({ icon: Icon, title, value, unit, color }: any) => (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-sm border ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-${color}-500/10`}>
          <Icon className={`w-6 h-6 text-${color}-500`} />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-500">实时</span>
        </div>
      </div>
      <div className="text-3xl font-bold mb-1">
        {typeof value === 'number' ? formatNumber(value) : value}
        {unit && <span className="text-lg ml-1 text-gray-400">{unit}</span>}
      </div>
      <div className="text-sm text-gray-400">{title}</div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>加载数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`space-y-6 ${embedded ? '' : 'min-h-screen'} ${isFullScreen ? 'p-4' : embedded ? 'py-4' : 'p-6'}`}>
      {/* 页面标题 - 仅在非嵌入模式下显示 */}
      {!embedded && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (onExitAdvancedView) {
                  onExitAdvancedView();
                } else {
                  navigate('/admin?tab=analytics');
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              返回数据分析
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Monitor className="w-6 h-6 text-blue-500" />
                高级数据分析大屏
              </h1>
              <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                实时数据监控 · 用户行为分析 · 业务洞察
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                autoRefresh
                  ? isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
                  : isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {autoRefresh ? '自动刷新中' : '自动刷新'}
            </button>
            <button
              onClick={fetchAnalyticsData}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>
            <button
              onClick={toggleFullScreen}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              {isFullScreen ? '退出全屏' : '全屏模式'}
            </button>
          </div>
        </div>
      )}

      {/* 嵌入模式下的简化标题栏 */}
      {embedded && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold">高级数据分析</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              实时数据监控 · 用户行为分析 · 业务洞察
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                autoRefresh
                  ? isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-700'
                  : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {autoRefresh ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {autoRefresh ? '自动刷新中' : '自动刷新'}
            </button>
            <button
              onClick={fetchAnalyticsData}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {onExitAdvancedView && (
              <button
                onClick={onExitAdvancedView}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 实时数据卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <RealTimeCard
          icon={Users}
          title="活跃用户"
          value={realTimeStats.activeUsers}
          color="blue"
        />
        <RealTimeCard
          icon={Eye}
          title="浏览/分钟"
          value={realTimeStats.viewsPerMinute}
          color="purple"
        />
        <RealTimeCard
          icon={UserPlus}
          title="新增用户"
          value={realTimeStats.newUsers}
          color="green"
        />
        <RealTimeCard
          icon={Edit}
          title="新增作品"
          value={realTimeStats.newWorks}
          color="orange"
        />
        <RealTimeCard
          icon={ShoppingCart}
          title="新增订单"
          value={realTimeStats.newOrders}
          color="pink"
        />
        <RealTimeCard
          icon={DollarSign}
          title="今日收入"
          value={formatCurrency(realTimeStats.revenue)}
          color="yellow"
        />
      </div>

      {/* 用户行为漏斗 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Funnel className="w-5 h-5 inline-block mr-2 text-blue-500" />
              用户行为转化漏斗
            </h3>
          </div>
          <div className="space-y-4">
            {userFunnelData.map((stage, index) => (
              <motion.div
                key={stage.stage}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className={`p-2 rounded-lg bg-${['blue', 'purple', 'green', 'orange'][index]}-500/10`}>
                    <stage.icon className={`w-5 h-5 text-${['blue', 'purple', 'green', 'orange'][index]}-500`} />
                  </div>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{stage.stage}</span>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatNumber(stage.count)} 人
                  </span>
                </div>
                <div className="relative h-8 ml-12">
                  <div className={`absolute inset-0 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stage.conversionRate * 100}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className={`absolute inset-0 rounded-lg bg-gradient-to-r from-${['blue', 'purple', 'green', 'orange'][index]}-500 to-${['blue', 'purple', 'green', 'orange'][index]}-400`}
                    style={{ opacity: 0.8 }}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-white">
                    {formatPercent(stage.conversionRate)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 留存率分析 */}
        <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Calendar className="w-5 h-5 inline-block mr-2 text-green-500" />
              用户留存 Cohort 分析
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={cohortData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="period" stroke={isDark ? '#9ca3af' : '#6b7280'} />
              <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#fff',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="day1" name="次日留存" stackId="a" fill="#3b82f6" />
              <Bar dataKey="day7" name="7 日留存" stackId="a" fill="#8b5cf6" />
              <Bar dataKey="day14" name="14 日留存" stackId="a" fill="#10b981" />
              <Bar dataKey="day30" name="30 日留存" stackId="a" fill="#f59e0b" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 收入分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <DollarSign className="w-5 h-5 inline-block mr-2 text-green-500" />
              收入来源分析
            </h3>
          </div>
          <div className="space-y-4">
            {revenueBreakdown.map((item, index) => (
              <motion.div
                key={item.source}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${item.color}20` }}>
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.source}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(item.amount)}
                    </span>
                    <div className={`flex items-center text-xs ${
                      item.trend > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {item.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(item.trend)}%
                    </div>
                  </div>
                </div>
                <div className="relative h-2 rounded-full bg-gray-200 dark:bg-gray-600">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage * 100}%` }}
                    transition={{ duration: 1, delay: index * 0.05 }}
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ROI 分析 */}
        <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <LineChart className="w-5 h-5 inline-block mr-2 text-purple-500" />
              渠道 ROI 分析
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    渠道
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    投入
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    产出
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    ROI
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    转化
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    CTR
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {channelROI.map((channel, index) => (
                  <tr key={channel.channel} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <td className={`px-4 py-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {channel.channel}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {formatCurrency(channel.cost)}
                    </td>
                    <td className={`px-4 py-3 text-green-500`}>
                      {formatCurrency(channel.revenue)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        channel.roi >= 2 ? 'bg-green-100 text-green-700' :
                        channel.roi >= 1 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {channel.roi.toFixed(1)}x
                      </span>
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {formatNumber(channel.conversions)}
                    </td>
                    <td className={`px-4 py-3 ${
                      channel.ctr > 0.05 ? 'text-green-500' : 'text-gray-500'
                    }`}>
                      {formatPercent(channel.ctr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 热点预测和用户画像 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 热点预测 */}
        <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Flame className="w-5 h-5 inline-block mr-2 text-red-500" />
              热点话题预测
            </h3>
            <Sparkles className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {hotTopics.map((topic, index) => (
              <motion.div
                key={topic.topic}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} border-l-4 ${
                  topic.trend === 'up' ? 'border-green-500' :
                  topic.trend === 'down' ? 'border-red-500' : 'border-yellow-500'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {topic.topic}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        topic.heat >= 90 ? 'bg-red-100 text-red-700' :
                        topic.heat >= 80 ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        热度 {topic.heat}
                      </span>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {topic.prediction}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center text-sm font-bold ${
                      topic.trend === 'up' ? 'text-green-500' :
                      topic.trend === 'down' ? 'text-red-500' : 'text-yellow-500'
                    }`}>
                      {topic.trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> :
                       topic.trend === 'down' ? <TrendingDown className="w-4 h-4 mr-1" /> :
                       <Activity className="w-4 h-4 mr-1" />}
                      {topic.growth > 0 ? '+' : ''}{topic.growth}%
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatNumber(topic.relatedWorks)} 作品
                    </div>
                  </div>
                </div>
                <div className="relative h-1.5 rounded-full bg-gray-200 dark:bg-gray-600">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${topic.heat}%` }}
                    transition={{ duration: 1, delay: index * 0.05 }}
                    className={`absolute inset-0 rounded-full ${
                      topic.heat >= 90 ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                      topic.heat >= 80 ? 'bg-gradient-to-r from-orange-500 to-yellow-500' :
                      'bg-gradient-to-r from-yellow-500 to-green-500'
                    }`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 用户画像 */}
        <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Users className="w-5 h-5 inline-block mr-2 text-blue-500" />
              用户画像分析
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* 年龄分布 */}
            <div>
              <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                年龄分布
              </h4>
              <div className="space-y-2">
                {userDemographics.ageGroups.map((item, index) => (
                  <div key={item.group}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{item.group}</span>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{formatPercent(item.percentage)}</span>
                    </div>
                    <div className="relative h-1.5 rounded-full bg-gray-200 dark:bg-gray-600">
                      <div
                        className="absolute inset-0 rounded-full bg-blue-500"
                        style={{ width: `${item.percentage * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 性别分布 */}
            <div>
              <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                性别分布
              </h4>
              <div className="space-y-2">
                {userDemographics.gender.map((item, index) => (
                  <div key={item.type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{item.type}</span>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{formatPercent(item.percentage)}</span>
                    </div>
                    <div className="relative h-1.5 rounded-full bg-gray-200 dark:bg-gray-600">
                      <div
                        className={`absolute inset-0 rounded-full ${
                          item.type === '女性' ? 'bg-pink-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${item.percentage * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 城市分布 */}
            <div className="col-span-2">
              <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                TOP 5 城市
              </h4>
              <div className="flex items-end gap-2 h-20">
                {userDemographics.topCities.map((item, index) => (
                  <div key={item.city} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-purple-500 to-pink-500 transition-all"
                      style={{ height: `${item.percentage * 300}%` }}
                    />
                    <span className="text-xs text-gray-500">{item.city}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 兴趣分布 */}
            <div className="col-span-2">
              <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                兴趣分布 TOP 10
              </h4>
              <div className="space-y-2">
                {userDemographics.interests.slice(0, 10).map((item) => (
                  <div key={item.interest}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{item.interest}</span>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                        {item.count}人 ({formatPercent(item.percentage)})
                      </span>
                    </div>
                    <div className="relative h-1.5 rounded-full bg-gray-200 dark:bg-gray-600">
                      <div
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-blue-500"
                        style={{ width: `${item.percentage * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 作品传播分析 */}
        <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Share2 className="w-5 h-5 inline-block mr-2 text-orange-500" />
              作品传播分析
            </h3>
          </div>
          
          {hotPropagationWorks.length > 0 ? (
            <div className="space-y-4">
              {hotPropagationWorks.map((work, index) => (
                <motion.div
                  key={work.work_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {work.work_title}
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        创作者：{work.creator_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          传播分数
                        </div>
                        <div className="text-lg font-bold text-orange-500">
                          {work.propagation_score}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div className="text-center">
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        浏览
                      </div>
                      <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {work.view_count}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        分享
                      </div>
                      <div className="text-lg font-semibold text-green-500">
                        {work.share_count}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        点赞
                      </div>
                      <div className="text-lg font-semibold text-pink-500">
                        {work.like_count}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        评论
                      </div>
                      <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {work.comment_count}
                      </div>
                    </div>
                  </div>
                  
                  {/* 传播影响力条 */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        影响力
                      </span>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                        估算覆盖：{Math.round(work.propagation_score / 10)}人
                      </span>
                    </div>
                    <div className="relative h-2 rounded-full bg-gray-200 dark:bg-gray-600">
                      <div
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 to-red-500"
                        style={{ width: `${Math.min(100, (work.propagation_score / 100) * 100)}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <Share2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无传播数据</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
