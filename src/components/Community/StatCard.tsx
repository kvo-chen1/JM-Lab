import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  isDark: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'purple' | 'orange';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  value,
  label,
  isDark,
  color = 'primary',
  trend,
  delay = 0
}) => {
  // 安全处理：如果 Icon 未定义，使用空组件
  const SafeIcon = Icon || (() => null);

  const colorConfig = {
    primary: {
      bg: isDark 
        ? 'bg-gradient-to-br from-indigo-500/20 to-indigo-600/10' 
        : 'bg-gradient-to-br from-indigo-50 to-indigo-100/50',
      iconBg: isDark ? 'bg-indigo-500/20' : 'bg-indigo-100',
      iconColor: isDark ? 'text-indigo-400' : 'text-indigo-600',
      border: isDark ? 'border-indigo-500/20' : 'border-indigo-200',
      glow: isDark ? 'group-hover:shadow-indigo-500/20' : 'group-hover:shadow-indigo-500/10',
      trendPositive: 'text-emerald-400',
      trendNegative: 'text-rose-400'
    },
    success: {
      bg: isDark 
        ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10' 
        : 'bg-gradient-to-br from-emerald-50 to-emerald-100/50',
      iconBg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-100',
      iconColor: isDark ? 'text-emerald-400' : 'text-emerald-600',
      border: isDark ? 'border-emerald-500/20' : 'border-emerald-200',
      glow: isDark ? 'group-hover:shadow-emerald-500/20' : 'group-hover:shadow-emerald-500/10',
      trendPositive: 'text-emerald-400',
      trendNegative: 'text-rose-400'
    },
    warning: {
      bg: isDark 
        ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10' 
        : 'bg-gradient-to-br from-amber-50 to-amber-100/50',
      iconBg: isDark ? 'bg-amber-500/20' : 'bg-amber-100',
      iconColor: isDark ? 'text-amber-400' : 'text-amber-600',
      border: isDark ? 'border-amber-500/20' : 'border-amber-200',
      glow: isDark ? 'group-hover:shadow-amber-500/20' : 'group-hover:shadow-amber-500/10',
      trendPositive: 'text-emerald-400',
      trendNegative: 'text-rose-400'
    },
    error: {
      bg: isDark 
        ? 'bg-gradient-to-br from-rose-500/20 to-rose-600/10' 
        : 'bg-gradient-to-br from-rose-50 to-rose-100/50',
      iconBg: isDark ? 'bg-rose-500/20' : 'bg-rose-100',
      iconColor: isDark ? 'text-rose-400' : 'text-rose-600',
      border: isDark ? 'border-rose-500/20' : 'border-rose-200',
      glow: isDark ? 'group-hover:shadow-rose-500/20' : 'group-hover:shadow-rose-500/10',
      trendPositive: 'text-emerald-400',
      trendNegative: 'text-rose-400'
    },
    purple: {
      bg: isDark 
        ? 'bg-gradient-to-br from-violet-500/20 to-violet-600/10' 
        : 'bg-gradient-to-br from-violet-50 to-violet-100/50',
      iconBg: isDark ? 'bg-violet-500/20' : 'bg-violet-100',
      iconColor: isDark ? 'text-violet-400' : 'text-violet-600',
      border: isDark ? 'border-violet-500/20' : 'border-violet-200',
      glow: isDark ? 'group-hover:shadow-violet-500/20' : 'group-hover:shadow-violet-500/10',
      trendPositive: 'text-emerald-400',
      trendNegative: 'text-rose-400'
    },
    orange: {
      bg: isDark 
        ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/10' 
        : 'bg-gradient-to-br from-orange-50 to-orange-100/50',
      iconBg: isDark ? 'bg-orange-500/20' : 'bg-orange-100',
      iconColor: isDark ? 'text-orange-400' : 'text-orange-600',
      border: isDark ? 'border-orange-500/20' : 'border-orange-200',
      glow: isDark ? 'group-hover:shadow-orange-500/20' : 'group-hover:shadow-orange-500/10',
      trendPositive: 'text-emerald-400',
      trendNegative: 'text-rose-400'
    }
  };

  const theme = colorConfig[color];
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: delay * 0.1,
        ease: [0.34, 1.56, 0.64, 1]
      }}
      className={`
        group relative p-5 rounded-2xl 
        ${theme.bg} 
        border ${theme.border} 
        ${theme.glow}
        hover:shadow-lg 
        transition-all duration-300 
        cursor-default 
        overflow-hidden
      `}
    >
      {/* 背景装饰光晕 */}
      <div 
        className={`
          absolute -right-4 -top-4 w-24 h-24 rounded-full 
          opacity-30 blur-2xl 
          ${color === 'primary' ? 'bg-indigo-500' : 
            color === 'success' ? 'bg-emerald-500' : 
            color === 'warning' ? 'bg-amber-500' : 
            color === 'error' ? 'bg-rose-500' : 
            color === 'purple' ? 'bg-violet-500' : 'bg-orange-500'}
        `}
      />

      <div className="relative">
        {/* 图标容器 */}
        <div 
          className={`
            p-2.5 rounded-xl w-fit 
            ${theme.iconBg} 
            backdrop-blur-sm 
            shadow-sm
            transition-transform duration-300
            group-hover:scale-110
          `}
        >
          <SafeIcon size={22} className={theme.iconColor} />
        </div>

        {/* 数值和标签 */}
        <div className="mt-4">
          <div 
            className={`
              text-3xl font-bold tracking-tight tabular-nums
              ${isDark ? 'text-white' : 'text-slate-900'}
            `}
          >
            {displayValue}
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <span 
              className={`
                text-sm font-medium
                ${isDark ? 'text-slate-400' : 'text-slate-500'}
              `}
            >
              {label}
            </span>
            
            {trend && (
              <span 
                className={`
                  text-xs font-semibold px-1.5 py-0.5 rounded-full
                  ${trend.isPositive ? theme.trendPositive : theme.trendNegative}
                  ${isDark ? 'bg-white/10' : 'bg-black/5'}
                `}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
