import { useTheme } from '@/hooks/useTheme';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendData } from '@/services/organizerAnalyticsService';

interface TrendChartProps {
  data: TrendData[];
  metric?: 'submissions' | 'views' | 'likes' | 'comments' | 'all';
  height?: number;
  showGrid?: boolean;
}

const metricConfig = {
  submissions: {
    key: 'submissions_count',
    label: '作品提交',
    color: '#3B82F6',
    gradientId: 'colorSubmissions',
  },
  views: {
    key: 'views_count',
    label: '浏览量',
    color: '#10B981',
    gradientId: 'colorViews',
  },
  likes: {
    key: 'likes_count',
    label: '点赞数',
    color: '#F59E0B',
    gradientId: 'colorLikes',
  },
  comments: {
    key: 'comments_count',
    label: '评论数',
    color: '#8B5CF6',
    gradientId: 'colorComments',
  },
};

export function TrendChart({
  data,
  metric = 'submissions',
  height = 300,
  showGrid = true,
}: TrendChartProps) {
  const { isDark } = useTheme();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const config = metricConfig[metric];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`
            p-3 rounded-xl border shadow-lg
            ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
          `}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {formatDate(label)}
          </p>
          {metric === 'all' ? (
            <div className="space-y-1">
              {payload.map((entry: any, index: number) => (
                <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
                  {entry.name}: {entry.value}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-lg font-bold" style={{ color: config.color }}>
              {payload[0].value}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (metric === 'all') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
            </linearGradient>
          </defs>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#374151' : '#E5E7EB'}
              vertical={false}
            />
          )}
          <XAxis
            dataKey="stat_date"
            tickFormatter={formatDate}
            stroke={isDark ? '#6B7280' : '#9CA3AF'}
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke={isDark ? '#6B7280' : '#9CA3AF'}
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="submissions_count"
            name="作品提交"
            stroke="#3B82F6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorSubmissions)"
          />
          <Area
            type="monotone"
            dataKey="views_count"
            name="浏览量"
            stroke="#10B981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorViews)"
          />
          <Area
            type="monotone"
            dataKey="likes_count"
            name="点赞数"
            stroke="#F59E0B"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorLikes)"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={config.color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? '#374151' : '#E5E7EB'}
            vertical={false}
          />
        )}
        <XAxis
          dataKey="stat_date"
          tickFormatter={formatDate}
          stroke={isDark ? '#6B7280' : '#9CA3AF'}
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          stroke={isDark ? '#6B7280' : '#9CA3AF'}
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey={config.key}
          stroke={config.color}
          strokeWidth={2}
          fillOpacity={1}
          fill={`url(#${config.gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
