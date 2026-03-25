/**
 * 步骤状态徽章组件
 * 显示步骤的状态图标和文字
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Circle, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  LucideIcon
} from 'lucide-react';
import { StepStatus, STATUS_CONFIG } from '../../types/thinking';

interface StepStatusBadgeProps {
  /** 状态 */
  status: StepStatus;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否显示文字 */
  showText?: boolean;
  /** 自定义类名 */
  className?: string;
}

/** 图标映射 */
const iconMap: Record<StepStatus, LucideIcon> = {
  pending: Circle,
  processing: Loader2,
  completed: CheckCircle2,
  error: XCircle
};

/** 尺寸配置 */
const sizeConfig = {
  sm: {
    icon: 'w-3 h-3',
    text: 'text-xs',
    gap: 'gap-1'
  },
  md: {
    icon: 'w-4 h-4',
    text: 'text-sm',
    gap: 'gap-1.5'
  },
  lg: {
    icon: 'w-5 h-5',
    text: 'text-base',
    gap: 'gap-2'
  }
};

export const StepStatusBadge: React.FC<StepStatusBadgeProps> = ({
  status,
  size = 'md',
  showText = false,
  className = ''
}) => {
  const config = STATUS_CONFIG[status];
  const Icon = iconMap[status];
  const sizeClasses = sizeConfig[size];

  return (
    <div className={`flex items-center ${sizeClasses.gap} ${className}`}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Icon 
          className={`${sizeClasses.icon} ${config.color} ${config.animate ? 'animate-spin' : ''}`}
        />
      </motion.div>
      
      {showText && (
        <motion.span
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className={`${sizeClasses.text} ${config.color} font-medium`}
        >
          {config.name}
        </motion.span>
      )}
    </div>
  );
};

export default StepStatusBadge;
