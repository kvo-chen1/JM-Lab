import React from 'react';
import { motion } from 'framer-motion';
import './StatusBadge.css';

export type StatusVariant = 
  | 'pending'      // 审核中
  | 'approved'     // 已通过
  | 'rejected'     // 已驳回
  | 'active'       // 进行中
  | 'closed'       // 已结束
  | 'draft'        // 草稿
  | 'completed';   // 已完成

export interface StatusBadgeProps {
  /** 状态类型 */
  variant: StatusVariant;
  /** 显示文本（可选，默认使用预设文本） */
  children?: React.ReactNode;
  /** 是否带动画 */
  animated?: boolean;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 自定义类名 */
  className?: string;
}

/**
 * 状态标签组件
 * 
 * 用于展示商单、任务等实体的状态
 * 
 * @example
 * ```tsx
 * <StatusBadge variant="pending">审核中</StatusBadge>
 * <StatusBadge variant="approved" animated />
 * ```
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  children,
  animated = false,
  size = 'md',
  className = '',
}) => {
  // 预设文本
  const defaultLabels: Record<StatusVariant, string> = {
    pending: '审核中',
    approved: '已通过',
    rejected: '已驳回',
    active: '进行中',
    closed: '已结束',
    draft: '草稿',
    completed: '已完成',
  };

  const displayText = children || defaultLabels[variant];

  // 尺寸样式
  const sizeClasses = {
    sm: 'status-badge--sm',
    md: 'status-badge--md',
    lg: 'status-badge--lg',
  };

  const badge = (
    <span
      className={`status-badge status-badge--${variant} ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label={`状态: ${displayText}`}
    >
      {/* 状态指示点 */}
      <span className="status-badge__dot" />
      
      {/* 文本 */}
      <span className="status-badge__text">{displayText}</span>
    </span>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
      >
        {badge}
      </motion.div>
    );
  }

  return badge;
};

export default StatusBadge;
