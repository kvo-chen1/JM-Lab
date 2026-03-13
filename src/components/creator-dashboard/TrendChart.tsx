import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { TrendData } from '@/services/creatorDashboardService';
import { TimeGranularity } from '@/services/creatorDashboardService';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { 
  LineChart as LineChartIcon, 
  BarChart3, 
  AreaChart as AreaChartIcon,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  DollarSign
} from 'lucide-react';

interface TrendChartProps {
  data: TrendData[];
  loading?: boolean;
  granularity: TimeGranularity;
  onGranularityChange: (granularity: TimeGranularity) => void;
}

type ChartType = 'line' | 'bar' | 'area';
type MetricKey = 'views' | 'likes' | 'comments' | 'shares' | 'earnings';

const metricConfig: Record<MetricKey, { label: string; color: string; icon: React.ElementType }> = {
  views: { label: '浏览量', color: '#3b82f6', icon: Eye },
  likes: { label: '点赞数', color: '#ec4899', icon: Heart },
  comments: { label: '评论数', color: '#10b981', icon: MessageCircle },
  shares: { label: '分享数', color: '#8b5cf6', icon: Share2 },
  earnings: { label: '收益', color: '#22c55e', icon: DollarSign },
};

const TrendChart: React.FC<TrendChartProps> = ({
  data,
  loading,
  granularity,
  onGranularityChange,
}) => {
  const { isDark } = useTheme();
  const [chartType, setChartType] = useState<ChartType>('area');
  const [activeMetrics, setActiveMetrics] = useState<MetricKey[]>(['views', 'likes']);

  const granularityOptions: { value: TimeGranularity; label: string }[] = [
    { value: 'day', label: '按日' },
    { value: 'week', label: '按周' },
    { value: 'month', label: '按月' },
  ];

  const toggleMetric = (metric: MetricKey) => {
    setActiveMetrics(prev => 
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-xl border shadow-lg ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <p className={`text-sm mb-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }} 
              />
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                {entry.name}:
              </span>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {metricConfig[entry.dataKey as MetricKey]?.label === '收益'
                  ? `¥${entry.value.toLocaleString()}`
                  : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-slate-100'
      } shadow-sm`}>
        <div className="h-8 w-32 rounded bg-slate-200 dark:bg-slate-700 animate-pulse mb-4" />
        <div className="h-[300px] rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </div>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 10, left: 0, bottom: 0 },
    };

    const axisStyle = {
      stroke: isDark ? '#64748b' : '#94a3b8',
      fontSize: 12,
    };

    const gridStyle = {
      strokeDasharray: '3 3' as const,
      stroke: isDark ? '#334155' : '#e2e8f0',
      vertical: false,
    };

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart {...commonProps}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="date" {...axisStyle} tickLine={false} axisLine={false} />
            <YAxis {...axisStyle} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {activeMetrics.map(metric => (
              <Bar
                key={metric}
                dataKey={metric}
                name={metricConfig[metric].label}
                fill={metricConfig[metric].color}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart {...commonProps}>
            <defs>
              {activeMetrics.map(metric => (
                <linearGradient
                  key={metric}
                  id={`gradient-${metric}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={metricConfig[metric].color}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={metricConfig[metric].color}
                    stopOpacity={0}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="date" {...axisStyle} tickLine={false} axisLine={false} />
            <YAxis {...axisStyle} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {activeMetrics.map(metric => (
              <Area
                key={metric}
                type="monotone"
                dataKey={metric}
                name={metricConfig[metric].label}
                stroke={metricConfig[metric].color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#gradient-${metric})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart {...commonProps}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="date" {...axisStyle} tickLine={false} axisLine={false} />
          <YAxis {...axisStyle} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {activeMetrics.map(metric => (
            <Line
              key={metric}
              type="monotone"
              dataKey={metric}
              name={metricConfig[metric].label}
              stroke={metricConfig[metric].color}
              strokeWidth={2}
              dot={{ r: 3, fill: metricConfig[metric].color }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-2xl border ${
        isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-slate-100'
      } shadow-sm`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
            趋势分析
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex rounded-lg overflow-hidden border ${
            isDark ? 'border-slate-700' : 'border-slate-200'
          }`}>
            {granularityOptions.map(option => (
              <button
                key={option.value}
                onClick={() => onGranularityChange(option.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  granularity === option.value
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className={`flex rounded-lg overflow-hidden border ${
            isDark ? 'border-slate-700' : 'border-slate-200'
          }`}>
            {[
              { type: 'line' as ChartType, icon: LineChartIcon },
              { type: 'area' as ChartType, icon: AreaChartIcon },
              { type: 'bar' as ChartType, icon: BarChart3 },
            ].map(({ type, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`p-1.5 transition-colors ${
                  chartType === type
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(metricConfig) as MetricKey[]).map(metric => {
          const config = metricConfig[metric];
          const Icon = config.icon;
          const isActive = activeMetrics.includes(metric);
          
          return (
            <button
              key={metric}
              onClick={() => toggleMetric(metric)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'ring-2'
                  : isDark
                  ? 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              style={{
                backgroundColor: isActive ? `${config.color}20` : undefined,
                color: isActive ? config.color : undefined,
                ringColor: isActive ? config.color : undefined,
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {config.label}
            </button>
          );
        })}
      </div>

      {renderChart()}
    </motion.div>
  );
};

export default TrendChart;
