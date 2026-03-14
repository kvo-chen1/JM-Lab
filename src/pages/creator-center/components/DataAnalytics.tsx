import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Eye, 
  Heart, 
  MessageCircle,
  Share2,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useCreatorCenter } from '@/hooks/useCreatorCenter';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const timeRanges = [
  { id: '7d', label: '近7天' },
  { id: '30d', label: '近30天' },
  { id: '90d', label: '近90天' },
  { id: '1y', label: '近1年' },
];

const audienceData = [
  { name: '18-24岁', value: 35, color: '#3b82f6' },
  { name: '25-34岁', value: 40, color: '#8b5cf6' },
  { name: '35-44岁', value: 18, color: '#ec4899' },
  { name: '45岁以上', value: 7, color: '#10b981' },
];

const deviceData = [
  { name: '移动端', value: 68, color: '#3b82f6' },
  { name: '桌面端', value: 28, color: '#8b5cf6' },
  { name: '平板', value: 4, color: '#ec4899' },
];

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const DataAnalytics: React.FC = () => {
  const { isDark } = useTheme();
  const { stats, works, trendData, loading } = useCreatorCenter();
  const [timeRange, setTimeRange] = useState('7d');
  const [activeMetric, setActiveMetric] = useState('views');
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const metrics = stats ? [
    { id: 'views', label: '浏览量', value: formatNumber(stats.totalViews), change: `+${stats.viewsChange}%`, icon: Eye, positive: true },
    { id: 'likes', label: '点赞数', value: formatNumber(stats.totalLikes), change: `+${stats.likesChange}%`, icon: Heart, positive: true },
    { id: 'comments', label: '评论数', value: formatNumber(stats.totalComments), change: `+${stats.commentsChange}%`, icon: MessageCircle, positive: true },
    { id: 'shares', label: '分享数', value: formatNumber(stats.totalShares), change: `+${stats.sharesChange}%`, icon: Share2, positive: stats.sharesChange >= 0 },
  ] : [];

  // 构建作品排行数据
  const topWorks = works
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    .map((work, index) => ({
      title: work.title,
      views: formatNumber(work.views),
      likes: formatNumber(work.likes),
      comments: formatNumber(work.comments),
      growth: '+0%',
    }));

  // 构建24小时数据（使用趋势数据模拟）
  const hourlyData = trendData.map((d, i) => ({
    hour: d.date,
    views: d.views,
  }));

  const getChartColor = () => {
    switch (activeMetric) {
      case 'likes': return '#ec4899';
      case 'comments': return '#10b981';
      case 'shares': return '#8b5cf6';
      default: return '#3b82f6';
    }
  };

  // 等待认证状态检查
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // 未登录状态显示提示
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className={`p-6 rounded-2xl text-center ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-blue-500" />
          <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            数据中心
          </h2>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            登录后即可查看你的创作数据分析
          </p>
          <Link to="/login">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium"
            >
              立即登录
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            数据中心
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            深入了解你的创作表现和受众画像
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex rounded-lg overflow-hidden border ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            {timeRanges.map((range) => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  timeRange === range.id
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isDark 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Download className="w-4 h-4" />
            导出报告
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setActiveMetric(metric.id)}
              className={`p-5 rounded-2xl cursor-pointer transition-all ${
                activeMetric === metric.id
                  ? isDark
                    ? 'bg-blue-600/20 border-2 border-blue-500'
                    : 'bg-blue-50 border-2 border-blue-500'
                  : isDark
                  ? 'bg-gray-800 border border-gray-700'
                  : 'bg-white border border-gray-100'
              } shadow-sm`}
            >
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg ${
                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    activeMetric === metric.id ? 'text-blue-500' : 'text-gray-500'
                  }`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  metric.positive ? 'text-green-500' : 'text-red-500'
                }`}>
                  {metric.positive ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {metric.change}
                </div>
              </div>
              <div className="mt-4">
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {metric.value}
                </p>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {metric.label}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${
            isDark ? 'border-gray-700' : 'border-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                趋势分析
              </h2>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full`} style={{ backgroundColor: getChartColor() }} />
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {metrics.find(m => m.id === activeMetric)?.label}
                </span>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getChartColor()} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={getChartColor()} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="date" 
                    stroke={isDark ? '#9ca3af' : '#6b7280'}
                    fontSize={12}
                  />
                  <YAxis 
                    stroke={isDark ? '#9ca3af' : '#6b7280'}
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: isDark ? '#f3f4f6' : '#111827' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={activeMetric === 'views' ? 'views' : activeMetric === 'likes' ? 'likes' : 'comments'} 
                    stroke={getChartColor()} 
                    fillOpacity={1} 
                    fill="url(#colorMetric)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${
            isDark ? 'border-gray-700' : 'border-gray-100'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              24小时活跃分布
            </h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                  <XAxis 
                    dataKey="hour" 
                    stroke={isDark ? '#9ca3af' : '#6b7280'}
                    fontSize={10}
                  />
                  <YAxis 
                    stroke={isDark ? '#9ca3af' : '#6b7280'}
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="views" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${
            isDark ? 'border-gray-700' : 'border-gray-100'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              作品表现排行
            </h2>
            <div className="space-y-3">
              {topWorks.length > 0 ? topWorks.map((work, index) => (
                <motion.div
                  key={work.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-xl ${
                    isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    index < 3
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                      : isDark
                      ? 'bg-gray-600 text-gray-400'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {work.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {work.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {work.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {work.comments}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-green-500">
                      {work.growth}
                    </span>
                  </div>
                </motion.div>
              )) : (
                <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p>暂无作品数据</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${
            isDark ? 'border-gray-700' : 'border-gray-100'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              受众年龄分布
            </h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={audienceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {audienceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {audienceData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.name} ({item.value}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${
            isDark ? 'border-gray-700' : 'border-gray-100'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              设备分布
            </h2>
            <div className="space-y-4">
              {deviceData.map((device) => (
                <div key={device.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {device.name}
                    </span>
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {device.value}%
                    </span>
                  </div>
                  <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${device.value}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: device.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${
            isDark ? 'border-gray-700' : 'border-gray-100'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              关键指标
            </h2>
            <div className="space-y-4">
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    平均观看时长
                  </span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    2分34秒
                  </span>
                </div>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    互动率
                  </span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stats ? ((stats.totalLikes + stats.totalComments) / Math.max(stats.totalViews, 1) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    作品总数
                  </span>
                  <span className="font-semibold text-green-500">
                    {works.length}
                  </span>
                </div>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    平均作品浏览
                  </span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stats && works.length > 0 ? formatNumber(Math.round(stats.totalViews / works.length)) : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataAnalytics;
