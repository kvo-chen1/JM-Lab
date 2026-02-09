import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

interface InfoCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: 'none' | 'small' | 'medium' | 'large';
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  children,
  className = '',
  headerAction,
  icon,
  variant = 'default',
  padding = 'medium',
  shadow = 'medium'
}) => {
  const { isDark } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          border: 'border-primary-200 dark:border-primary-800',
          bg: 'bg-primary-50/50 dark:bg-primary-900/10',
          iconBg: 'bg-primary-100 dark:bg-primary-800',
          iconColor: 'text-primary-600 dark:text-primary-400'
        };
      case 'success':
        return {
          border: 'border-emerald-200 dark:border-emerald-800',
          bg: 'bg-emerald-50/50 dark:bg-emerald-900/10',
          iconBg: 'bg-emerald-100 dark:bg-emerald-800',
          iconColor: 'text-emerald-600 dark:text-emerald-400'
        };
      case 'warning':
        return {
          border: 'border-amber-200 dark:border-amber-800',
          bg: 'bg-amber-50/50 dark:bg-amber-900/10',
          iconBg: 'bg-amber-100 dark:bg-amber-800',
          iconColor: 'text-amber-600 dark:text-amber-400'
        };
      case 'danger':
        return {
          border: 'border-red-200 dark:border-red-800',
          bg: 'bg-red-50/50 dark:bg-red-900/10',
          iconBg: 'bg-red-100 dark:bg-red-800',
          iconColor: 'text-red-600 dark:text-red-400'
        };
      default:
        return {
          border: isDark ? 'border-gray-700' : 'border-gray-200',
          bg: isDark ? 'bg-gray-800' : 'bg-white',
          iconBg: isDark ? 'bg-gray-700' : 'bg-gray-100',
          iconColor: isDark ? 'text-gray-400' : 'text-gray-500'
        };
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case 'none': return 'p-0';
      case 'small': return 'p-3';
      case 'large': return 'p-6';
      default: return 'p-4';
    }
  };

  const getShadowStyles = () => {
    switch (shadow) {
      case 'none': return '';
      case 'small': return 'shadow-sm';
      case 'large': return 'shadow-lg';
      default: return 'shadow-card';
    }
  };

  const styles = getVariantStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        rounded-xl border ${styles.border} ${styles.bg} ${getShadowStyles()}
        transition-shadow duration-300 hover:shadow-card-hover
        ${className}
      `}
    >
      {(title || icon) && (
        <div className={`flex items-center justify-between ${padding === 'none' ? 'px-4 py-3 border-b ' + styles.border : getPaddingStyles() + ' pb-0'}`}>
          <div className="flex items-center gap-3">
            {icon && (
              <div className={`w-10 h-10 rounded-lg ${styles.iconBg} flex items-center justify-center ${styles.iconColor}`}>
                {icon}
              </div>
            )}
            {title && (
              <h3 className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {title}
              </h3>
            )}
          </div>
          {headerAction && (
            <div className="flex-shrink-0">
              {headerAction}
            </div>
          )}
        </div>
      )}
      <div className={getPaddingStyles()}>
        {children}
      </div>
    </motion.div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  icon,
  trend = 'neutral'
}) => {
  const { isDark } = useTheme();

  const getTrendColor = () => {
    if (trend === 'up') return 'text-emerald-600 dark:text-emerald-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
      className={`
        rounded-xl p-4 border transition-all duration-300
        ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {label}
          </p>
          <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {value}
          </p>
          {change !== undefined && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${getTrendColor()}`}>
              <span>{getTrendIcon()}</span>
              <span>{Math.abs(change)}%</span>
              <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>vs 上周</span>
            </p>
          )}
        </div>
        {icon && (
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}
          `}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InfoCard;
