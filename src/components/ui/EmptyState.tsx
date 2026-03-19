import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, PackageOpen } from 'lucide-react';
import './EmptyState.css';

export interface EmptyStateProps {
  /** 标题 */
  title: string;
  /** 描述 */
  description?: string;
  /** 图标 */
  icon?: LucideIcon;
  /** 自定义插图 */
  illustration?: React.ReactNode;
  /** 主操作按钮 */
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  /** 次操作按钮 */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 自定义类名 */
  className?: string;
}

/**
 * 空状态组件
 * 
 * 用于页面无数据时的友好提示和引导
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   title="暂无商单"
 *   description="您还没有发布任何商单，点击下方按钮开始"
 *   primaryAction={{ label: '发布商单', onClick: handlePublish }}
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = PackageOpen,
  illustration,
  primaryAction,
  secondaryAction,
  size = 'md',
  className = '',
}) => {
  // 尺寸配置
  const sizeConfig = {
    sm: {
      iconSize: 48,
      titleSize: 'text-base',
      descSize: 'text-sm',
    },
    md: {
      iconSize: 80,
      titleSize: 'text-xl',
      descSize: 'text-base',
    },
    lg: {
      iconSize: 120,
      titleSize: 'text-2xl',
      descSize: 'text-lg',
    },
  };

  const config = sizeConfig[size];

  // 动画配置
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0, 0, 0.2, 1],
      },
    },
  };

  return (
    <motion.div
      className={`empty-state empty-state--${size} ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      role="status"
      aria-live="polite"
    >
      {/* 插图/图标 */}
      <motion.div
        className="empty-state__illustration"
        variants={itemVariants}
      >
        {illustration || (
          <div className="empty-state__icon-wrapper">
            <Icon
              size={config.iconSize}
              strokeWidth={1.5}
              className="empty-state__icon"
            />
          </div>
        )}
      </motion.div>

      {/* 标题 */}
      <motion.h3
        className={`empty-state__title ${config.titleSize}`}
        variants={itemVariants}
      >
        {title}
      </motion.h3>

      {/* 描述 */}
      {description && (
        <motion.p
          className={`empty-state__description ${config.descSize}`}
          variants={itemVariants}
        >
          {description}
        </motion.p>
      )}

      {/* 操作按钮 */}
      {(primaryAction || secondaryAction) && (
        <motion.div
          className="empty-state__actions"
          variants={itemVariants}
        >
          {primaryAction && (
            <button
              className="empty-state__btn-primary"
              onClick={primaryAction.onClick}
            >
              {primaryAction.icon && (
                <primaryAction.icon size={18} />
              )}
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              className="empty-state__btn-secondary"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmptyState;
