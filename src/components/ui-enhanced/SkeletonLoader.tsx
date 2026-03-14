import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/designSystem';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rect' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const SkeletonLoader = ({
  className,
  variant = 'rect',
  width,
  height,
  count = 1,
}: SkeletonLoaderProps) => {
  const baseStyles = 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]';
  
  const variantStyles = {
    text: 'h-4 rounded',
    circle: 'rounded-full',
    rect: 'rounded-lg',
    card: 'rounded-xl',
  };

  const renderSkeleton = (index: number) => (
    <motion.div
      key={index}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      style={{ width, height }}
      className={cn(baseStyles, variantStyles[variant], className)}
    />
  );

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => renderSkeleton(index))}
    </div>
  );
};

interface SkeletonCardProps {
  className?: string;
  hasImage?: boolean;
  lines?: number;
}

export const SkeletonCard = ({
  className,
  hasImage = true,
  lines = 3,
}: SkeletonCardProps) => {
  return (
    <div className={cn('p-4 space-y-4', className)}>
      {hasImage && (
        <SkeletonLoader variant="rect" height="200px" className="w-full" />
      )}
      <div className="space-y-2">
        <SkeletonLoader variant="text" width="60%" />
        {Array.from({ length: lines }).map((_, index) => (
          <SkeletonLoader key={index} variant="text" width={index === lines - 1 ? '40%' : '100%'} />
        ))}
      </div>
    </div>
  );
};

interface SkeletonListProps {
  count?: number;
  className?: string;
}

export const SkeletonList = ({ count = 5, className }: SkeletonListProps) => {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 p-4">
          <SkeletonLoader variant="circle" width="40px" height="40px" />
          <div className="flex-1 space-y-2">
            <SkeletonLoader variant="text" width="50%" />
            <SkeletonLoader variant="text" width="80%" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
