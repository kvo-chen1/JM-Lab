import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import './StatsCard.css';

export type StatsCardVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

export interface StatsCardProps {
  /** 卡片标题 */
  title: string;
  /** 数值 */
  value: number;
  /** 图标组件 */
  icon: LucideIcon;
  /** 变体样式 */
  variant?: StatsCardVariant;
  /** 趋势值（百分比或数值） */
  trend?: number;
  /** 趋势标签 */
  trendLabel?: string;
  /** 是否选中 */
  isSelected?: boolean;
  /** 是否加载中 */
  isLoading?: boolean;
  /** 点击回调 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 统计卡片组件
 * 
 * 用于展示关键数据的卡片组件，支持多种状态样式和交互动效
 * 
 * @example
 * ```tsx
 * <StatsCard
 *   title="全部商单"
 *   value={128}
 *   icon={Package}
 *   variant="primary"
 *   trend={12}
 *   trendLabel="较上月"
 * />
 * ```
 */
export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  variant = 'primary',
  trend,
  trendLabel,
  isSelected = false,
  isLoading = false,
  onClick,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(value);

  // 数字动画效果
  useEffect(() => {
    if (isLoading) return;

    const duration = 500;
    const startTime = performance.now();
    const startValue = prevValueRef.current;
    const endValue = value;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用 easeOutQuart 缓动函数
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      
      const currentValue = Math.round(startValue + (endValue - startValue) * easeProgress);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValueRef.current = value;
      }
    };

    requestAnimationFrame(animate);
  }, [value, isLoading]);

  // 变体样式配置
  const variantStyles = {
    primary: {
      borderColor: 'var(--color-primary-500)',
      iconBg: 'var(--color-primary-50)',
      iconColor: 'var(--color-primary-600)',
      valueColor: 'var(--color-primary-600)',
    },
    success: {
      borderColor: 'var(--color-success-500)',
      iconBg: 'var(--color-success-50)',
      iconColor: 'var(--color-success-600)',
      valueColor: 'var(--color-success-600)',
    },
    warning: {
      borderColor: 'var(--color-warning-500)',
      iconBg: 'var(--color-warning-50)',
      iconColor: 'var(--color-warning-600)',
      valueColor: 'var(--color-warning-600)',
    },
    error: {
      borderColor: 'var(--color-error-500)',
      iconBg: 'var(--color-error-50)',
      iconColor: 'var(--color-error-600)',
      valueColor: 'var(--color-error-600)',
    },
    neutral: {
      borderColor: 'var(--color-gray-500)',
      iconBg: 'var(--color-gray-50)',
      iconColor: 'var(--color-gray-600)',
      valueColor: 'var(--color-gray-600)',
    },
  };

  const styles = variantStyles[variant];

  // 趋势方向和颜色
  const getTrendInfo = () => {
    if (trend === undefined) return null;
    
    if (trend > 0) {
      return {
        icon: '↑',
        color: 'var(--color-success-600)',
        bgColor: 'var(--color-success-50)',
      };
    } else if (trend < 0) {
      return {
        icon: '↓',
        color: 'var(--color-error-600)',
        bgColor: 'var(--color-error-50)',
      };
    }
    return {
      icon: '→',
      color: 'var(--color-gray-500)',
      bgColor: 'var(--color-gray-100)',
    };
  };

  const trendInfo = getTrendInfo();

  if (isLoading) {
    return (
      <div className={`stats-card stats-card--loading ${className}`}>
        <div className="stats-card__skeleton">
          <div className="skeleton skeleton-circle" style={{ width: 48, height: 48 }} />
          <div className="stats-card__skeleton-content">
            <div className="skeleton skeleton-text" style={{ width: '60%' }} />
            <div className="skeleton skeleton-text" style={{ width: '40%', height: 32 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`stats-card ${isSelected ? 'stats-card--selected' : ''} ${onClick ? 'stats-card--clickable' : ''} ${className}`}
      style={{
        '--card-border-color': styles.borderColor,
        '--card-selected-bg': `${styles.borderColor}15`,
      } as React.CSSProperties}
      onClick={onClick}
      whileHover={onClick ? { y: -2, boxShadow: 'var(--shadow-lg)' } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-pressed={isSelected}
    >
      {/* 图标 */}
      <div
        className="stats-card__icon"
        style={{
          backgroundColor: styles.iconBg,
          color: styles.iconColor,
        }}
      >
        <Icon size={24} strokeWidth={2} />
      </div>

      {/* 内容 */}
      <div className="stats-card__content">
        <span className="stats-card__title">{title}</span>
        <span
          className="stats-card__value"
          style={{ color: styles.valueColor }}
        >
          {displayValue.toLocaleString()}
        </span>
        
        {/* 趋势 */}
        {trendInfo && (
          <motion.div
            className="stats-card__trend"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <span
              className="stats-card__trend-badge"
              style={{
                color: trendInfo.color,
                backgroundColor: trendInfo.bgColor,
              }}
            >
              {trendInfo.icon} {Math.abs(trend)}%
            </span>
            {trendLabel && (
              <span className="stats-card__trend-label">{trendLabel}</span>
            )}
          </motion.div>
        )}
      </div>

      {/* 选中指示器 */}
      {isSelected && (
        <motion.div
          className="stats-card__indicator"
          layoutId="stats-card-indicator"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.div>
  );
};

export default StatsCard;
