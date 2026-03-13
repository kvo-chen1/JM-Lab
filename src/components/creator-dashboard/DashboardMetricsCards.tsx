import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { AggregatedMetrics } from '@/services/creatorDashboardService';

interface MetricCardProps {
  title: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ElementType;
  color: string;
  format?: 'number' | 'currency' | 'percent';
  isDark: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
  format = 'number',
  isDark,
}) => {
  const formatValue = (val: number): string => {
    if (format === 'currency') {
      return `¥${val.toLocaleString('zh-CN')}`;
    }
    if (format === 'percent') {
      return `${val.toFixed(1)}%`;
    }
    if (val >= 10000) {
      return `${(val / 10000).toFixed(1)}万`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`;
    }
    return val.toLocaleString('zh-CN');
  };

  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400';
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)' }}
      className={`p-5 rounded-2xl border transition-all ${
        isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-slate-100'
      } shadow-sm`}
    >
      <div className="flex items-start justify-between">
        <div 
          className="p-3 rounded-xl"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
      </div>
      <div className="mt-4">
        <h4 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {formatValue(value)}
        </h4>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {title}
        </p>
      </div>
    </motion.div>
  );
};

interface DashboardMetrics {
  views: AggregatedMetrics;
  likes: AggregatedMetrics;
  comments: AggregatedMetrics;
  shares: AggregatedMetrics;
  favorites: AggregatedMetrics;
  followers: AggregatedMetrics;
  earnings: AggregatedMetrics;
  engagement: AggregatedMetrics;
}

interface DashboardMetricsCardsProps {
  metrics: DashboardMetrics | null;
  loading?: boolean;
}

const DashboardMetricsCards: React.FC<DashboardMetricsCardsProps> = ({ metrics, loading }) => {
  const { isDark } = useTheme();

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div 
            key={i}
            className={`p-5 rounded-2xl border animate-pulse ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
            }`}
          >
            <div className={`h-10 w-10 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`} />
            <div className={`h-6 w-20 mt-4 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`} />
            <div className={`h-4 w-16 mt-2 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`} />
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const cardsData = [
    { 
      title: '浏览量', 
      data: metrics.views, 
      icon: Eye, 
      color: '#3b82f6',
      format: 'number' as const 
    },
    { 
      title: '点赞数', 
      data: metrics.likes, 
      icon: Heart, 
      color: '#ec4899',
      format: 'number' as const 
    },
    { 
      title: '评论数', 
      data: metrics.comments, 
      icon: MessageCircle, 
      color: '#10b981',
      format: 'number' as const 
    },
    { 
      title: '分享数', 
      data: metrics.shares, 
      icon: Share2, 
      color: '#8b5cf6',
      format: 'number' as const 
    },
    { 
      title: '收藏数', 
      data: metrics.favorites, 
      icon: Bookmark, 
      color: '#f59e0b',
      format: 'number' as const 
    },
    { 
      title: '新增粉丝', 
      data: metrics.followers, 
      icon: Users, 
      color: '#06b6d4',
      format: 'number' as const 
    },
    { 
      title: '收益', 
      data: metrics.earnings, 
      icon: DollarSign, 
      color: '#22c55e',
      format: 'currency' as const 
    },
    { 
      title: '互动率', 
      data: metrics.engagement, 
      icon: TrendingUp, 
      color: '#f43f5e',
      format: 'percent' as const 
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cardsData.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <MetricCard
            title={card.title}
            value={card.data.current}
            change={card.data.changePercent}
            trend={card.data.trend}
            icon={card.icon}
            color={card.color}
            format={card.format}
            isDark={isDark}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default DashboardMetricsCards;
