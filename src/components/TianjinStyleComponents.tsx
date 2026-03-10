/**
 * 天津风格组件库
 * 包含图片、头像、标签、空状态等常用组件
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';

// ========================================
// TianjinImage 组件
// ========================================

export interface TianjinImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  ratio?: 'square' | 'landscape' | 'portrait' | 'none';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  onClick?: () => void;
}

export const TianjinImage: React.FC<TianjinImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/images/placeholder-image.jpg',
  loading = 'lazy',
  priority = false,
  ratio = 'none',
  rounded = 'none',
  onClick,
}) => {
  const [error, setError] = useState(false);

  const ratioClasses = {
    square: 'aspect-square',
    landscape: 'aspect-video',
    portrait: 'aspect-[3/4]',
    none: '',
  };

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  const handleError = () => {
    setError(true);
  };

  return (
    <img
      src={error ? fallbackSrc : src}
      alt={alt}
      className={`${ratioClasses[ratio]} ${roundedClasses[rounded]} ${className}`}
      loading={priority ? 'eager' : loading}
      onError={handleError}
      onClick={onClick}
    />
  );
};

// ========================================
// TianjinAvatar 组件
// ========================================

export interface TianjinAvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  withBorder?: boolean;
  fallbackSrc?: string;
}

export const TianjinAvatar: React.FC<TianjinAvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  className = '',
  withBorder = true,
  fallbackSrc = '/images/default-avatar.png',
}) => {
  const [error, setError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const borderClass = withBorder ? 'ring-2 ring-white dark:ring-gray-700' : '';

  const handleError = () => {
    setError(true);
  };

  const displaySrc = error || !src ? fallbackSrc : src;

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={`${sizeClasses[size]} ${borderClass} rounded-full object-cover ${className}`}
      onError={handleError}
    />
  );
};

// ========================================
// TianjinTag 组件
// ========================================

export interface TianjinTagProps {
  children: React.ReactNode;
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'pink' | 'default';
  className?: string;
  onClick?: () => void;
}

export const TianjinTag: React.FC<TianjinTagProps> = ({
  children,
  color = 'default',
  className = '',
  onClick,
}) => {
  const colorClasses = {
    red: 'bg-red-100 text-red-700 border-red-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    pink: 'bg-pink-100 text-pink-700 border-pink-200',
    default: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses[color]} ${className}`}
      onClick={onClick}
    >
      {children}
    </span>
  );
};

// ========================================
// TianjinEmptyState 组件
// ========================================

export interface TianjinEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const TianjinEmptyState: React.FC<TianjinEmptyStateProps> = ({
  title = '暂无数据',
  description = '这里还没有内容',
  icon,
  action,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      {icon && (
        <div className="w-16 h-16 mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      {action && <div>{action}</div>}
    </motion.div>
  );
};

// ========================================
// YangliuqingCard 组件
// ========================================

export interface YangliuqingCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const YangliuqingCard: React.FC<YangliuqingCardProps> = ({
  children,
  className = '',
  onClick,
}) => {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50/80 to-orange-50/80 p-6 shadow-sm ${className}`}
      onClick={onClick}
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(251, 191, 36, 0.15)' }}
      transition={{ duration: 0.3 }}
    >
      {/* 装饰性边框 */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 via-orange-400 to-amber-400" />
      <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-amber-400 via-orange-400 to-amber-400" />
      
      {/* 角落装饰 */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-400 rounded-tl" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-400 rounded-tr" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-400 rounded-bl" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-amber-400 rounded-br" />
      
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

// ========================================
// TianjinButton 组件 (从 TianjinThemeComponents 重新导出)
// ========================================

export { TianjinButton } from './TianjinThemeComponents';

// ========================================
// 默认导出
// ========================================

export default {
  TianjinImage,
  TianjinAvatar,
  TianjinTag,
  TianjinEmptyState,
  YangliuqingCard,
};
