/**
 * 灵感数据分析看板
 * 展示热点使用效果、创作趋势、用户画像等数据
 */

import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  Video,
  Heart,
  TrendingUp,
  TrendingDown,
  Zap,
  Award,
  Clock,
  Users,
  Target,
  BarChart3,
  Activity,
  Flame,
  Star,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { trendingService, TrendingStats } from '@/services/trendingService';
import { toast } from 'sonner';

interface InspirationStats {
  totalViews: number;
  totalVideos: number;
  totalLikes: number;
  avgGrowthRate: number;
  topCategory: string;
  bestPostingTime: string;
  userRank: number;
  totalCreators: number;
}

const InspirationAnalytics: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState<TrendingStats | null>(null);
  const [inspirationStats, setInspirationStats] = useState<InspirationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  // 加载数据
  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // 加载热点统计
      const trendingStats = await trendingService.getTrendingStats(
        timeRange === '7d' ? '24h' : timeRange === '30d' ? '7d' : '30d'
      );
      setStats(trendingStats);

      // 模拟灵感使用统计（实际应从 API 获取）
      const mockInspirationStats: InspirationStats = {
        totalViews: 280000000,
        totalVideos: 1563000,
        totalLikes: 8925000,
        avgGrowthRate: 15.5,
        topCategory: '津门文化',
        bestPostingTime: '19:00-21:00',
        userRank: 156,
        totalCreators: 5000,
      };
      setInspirationStats(mockInspirationStats);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化数字
  const formatNumber = (num: number): string => {
    if (num >= 100000000) {
      return (num / 100000000).toFixed(1) + '亿';
    }
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toString();
  };

  // 获取趋势图标
  const getTrendIcon = (positive: boolean) => {
    return positive ? (
      <TrendingUp className="w-4 h-4 text-emerald-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-rose-500" />
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg`}>
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              灵感数据看板
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              洞察创作趋势，把握流量密码
            </p>
          </div>
        </div>

        {/* 时间范围选择 */}
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                  : isDark
                  ? 'bg-gray-800 text-gray-400 hover:text-white'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              {range === '7d' ? '近 7 天' : range === '30d' ? '近 30 天' : '近 90 天'}
            </button>
          ))}
          <button
            onClick={loadAnalyticsData}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Eye className="w-6 h-6 text-blue-500" />}
          label="灵感带来曝光"
          value={formatNumber(inspirationStats?.totalViews || 0)}
          trend="+15%"
          trendPositive={true}
          isDark={isDark}
        />
        <StatCard
          icon={<Video className="w-6 h-6 text-emerald-500" />}
          label="使用灵感创作"
          value={formatNumber(inspirationStats?.totalVideos || 0)}
          trend="+22%"
          trendPositive={true}
          isDark={isDark}
        />
        <StatCard
          icon={<Heart className="w-6 h-6 text-pink-500" />}
          label="平均互动率"
          value="8.5%"
          trend="+3.2%"
          trendPositive={true}
          isDark={isDark}
        />
        <StatCard
          icon={<Flame className="w-6 h-6 text-amber-500" />}
          label="上升热点数"
          value={stats?.risingCount || 0}
          trend="+5"
          trendPositive={true}
          isDark={isDark}
        />
      </div>

      {/* 详细数据 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 热点趋势 */}
        <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                热点趋势
              </h3>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-700'
            }`}>
              实时
            </span>
          </div>

          {/* 模拟趋势图 */}
          <div className="h-48 flex items-end gap-2">
            {Array.from({ length: 24 }).map((_, i) => {
              const height = 30 + Math.random() * 70;
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex-1 rounded-t ${
                    i % 2 === 0
                      ? 'bg-gradient-to-t from-blue-500 to-cyan-500'
                      : 'bg-gradient-to-t from-indigo-500 to-purple-500'
                  }`}
                />
              );
            })}
          </div>

          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>0:00</span>
            <span>6:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
        </div>

        {/* 热门分类 */}
        <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-500" />
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                热门分类
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { name: '津门文化', value: 35, color: 'from-rose-500 to-pink-500', trend: '+12%' },
              { name: '天津美食', value: 28, color: 'from-amber-500 to-orange-500', trend: '+8%' },
              { name: '海河风光', value: 22, color: 'from-blue-500 to-indigo-500', trend: '+15%' },
              { name: '传统手艺', value: 15, color: 'from-emerald-500 to-teal-500', trend: '+5%' },
            ].map((category) => (
              <div key={category.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {category.name}
                  </span>
                  <span className="text-xs text-emerald-500">{category.trend}</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${category.value}%` }}
                    transition={{ duration: 1 }}
                    className={`h-full rounded-full bg-gradient-to-r ${category.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 最佳创作时间 */}
        <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-violet-500" />
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                最佳创作时间
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex-1 p-4 rounded-xl ${isDark ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-violet-50 border border-violet-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-violet-500" />
                <span className={`text-sm font-medium ${isDark ? 'text-violet-400' : 'text-violet-700'}`}>
                  黄金时段
                </span>
              </div>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                19:00 - 21:00
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                流量高峰，互动率最高
              </p>
            </div>

            <div className={`flex-1 p-4 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span className={`text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                  白银时段
                </span>
              </div>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                12:00 - 14:00
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                午休时间，稳定流量
              </p>
            </div>
          </div>
        </div>

        {/* 创作者排名 */}
        <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                创作者排名
              </h3>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
            }`}>
              前 3%
            </span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isDark ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-emerald-400 to-teal-400'
            }`}>
              <span className="text-2xl font-bold text-white">
                {inspirationStats?.userRank || 156}
              </span>
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>当前排名</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {inspirationStats?.userRank || 156} / {inspirationStats?.totalCreators || 5000}
              </p>
              <p className="text-xs text-emerald-500 mt-1">↑ 较上周上升 23 名</p>
            </div>
          </div>

          {/* 排名进度条 */}
          <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((inspirationStats?.userRank || 156) / (inspirationStats?.totalCreators || 5000)) * 100}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
            />
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            距离前 100 名还差 {(inspirationStats?.userRank || 156) - 100} 名
          </p>
        </div>
      </div>

      {/* 热门灵感 TOP10 */}
      <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              本周最佳灵感 TOP10
            </h3>
          </div>
          <button className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>
            <Download className="w-3 h-3" />
            导出报告
          </button>
        </div>

        <div className="space-y-2">
          {[
            { rank: 1, title: '狗不理包子制作技艺', usage: 15630, growth: '+25%' },
            { rank: 2, title: '天津之眼夜景航拍', usage: 12450, growth: '+18%' },
            { rank: 3, title: '天津话方言教学', usage: 9870, growth: '+32%' },
            { rank: 4, title: '泥人张非遗技艺', usage: 8560, growth: '+12%' },
            { rank: 5, title: '五大道历史建筑', usage: 7340, growth: '+15%' },
          ].map((item) => (
            <div
              key={item.rank}
              className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
              }`}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                item.rank <= 3
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
                  : isDark
                  ? 'bg-gray-700 text-gray-400'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {item.rank}
              </span>
              <div className="flex-1">
                <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {item.title}
                </h4>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatNumber(item.usage)} 人使用
                </p>
              </div>
              <span className="text-emerald-500 text-sm font-medium">
                {item.growth}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 统计卡片组件
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  trendPositive: boolean;
  isDark: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, trend, trendPositive, isDark }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${
          trendPositive ? 'text-emerald-500' : 'text-rose-500'
        }`}>
          {trendPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    </motion.div>
  );
};

export default InspirationAnalytics;
