import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'cyan';
  onClick?: () => void;
  loading?: boolean;
}

const colorVariants = {
  blue: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-500/20 to-transparent',
  },
  green: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-500/20 to-transparent',
  },
  purple: {
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-500/20 to-transparent',
  },
  orange: {
    bg: 'bg-orange-500/10 dark:bg-orange-500/20',
    border: 'border-orange-200 dark:border-orange-800',
    icon: 'text-orange-600 dark:text-orange-400',
    gradient: 'from-orange-500/20 to-transparent',
  },
  pink: {
    bg: 'bg-pink-500/10 dark:bg-pink-500/20',
    border: 'border-pink-200 dark:border-pink-800',
    icon: 'text-pink-600 dark:text-pink-400',
    gradient: 'from-pink-500/20 to-transparent',
  },
  cyan: {
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    border: 'border-cyan-200 dark:border-cyan-800',
    icon: 'text-cyan-600 dark:text-cyan-400',
    gradient: 'from-cyan-500/20 to-transparent',
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'blue',
  onClick,
  loading = false,
}: StatCardProps) {
  const { isDark } = useTheme();
  const colors = colorVariants[color];

  const getTrendIcon = () => {
    if (trend === undefined) return null;
    if (trend > 0) return <TrendingUp className="w-3 h-3" />;
    if (trend < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (trend === undefined) return 'text-gray-500';
    if (trend > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (trend < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-500';
  };

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl border backdrop-blur-sm
        ${colors.bg} ${colors.border}
        ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-300
      `}
    >
      {/* 渐变背景 */}
      <div
        className={`
          absolute inset-0 bg-gradient-to-br ${colors.gradient}
          opacity-50 pointer-events-none
        `}
      />

      <div className="relative p-5">
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ) : (
          <>
            {/* 标题和图标 */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {title}
              </span>
              <div
                className={`
                  p-2 rounded-xl ${colors.bg}
                  ${colors.icon}
                `}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>

            {/* 数值 */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {value}
              </span>
            </div>

            {/* 趋势 */}
            {trend !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="font-medium">
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
                {trendLabel && (
                  <span className="text-gray-500 dark:text-gray-400">
                    {trendLabel}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
