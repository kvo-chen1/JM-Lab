// src/components/ui/LoadingSpinner.tsx

import { ReactNode } from 'react';
import { clsx } from 'clsx';

// 加载器大小类型
export type SpinnerSize = 'small' | 'medium' | 'large' | 'xlarge';

// 加载器变体类型
export type SpinnerVariant = 'primary' | 'secondary' | 'accent' | 'light' | 'dark';

// 加载器属性接口
interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  fullScreen?: boolean;
  overlay?: boolean;
  message?: string;
  className?: string;
}

// 加载器组件
const LoadingSpinner = ({ 
  size = 'medium', 
  variant = 'primary', 
  fullScreen = false, 
  overlay = false, 
  message,
  className
}: SpinnerProps) => {
  // 大小样式映射
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  // 变体样式映射
  const variantClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
    light: 'text-white',
    dark: 'text-gray-800'
  };

  // 构建加载器类名
  const spinnerClasses = clsx(
    'animate-spin rounded-full border-4 border-t-transparent',
    sizeClasses[size],
    variantClasses[variant],
    className
  );

  // 全屏加载器
  if (fullScreen) {
    return (
      <div className={clsx(
        'fixed inset-0 flex items-center justify-center z-[70]',
        overlay ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'
      )}>
        <div className="flex flex-col items-center gap-4">
          <div className={spinnerClasses}></div>
          {message && (
            <p className="text-white text-lg font-medium">{message}</p>
          )}
        </div>
      </div>
    );
  }

  // 内联加载器
  return (
    <div className="flex items-center gap-2">
      <div className={spinnerClasses}></div>
      {message && (
        <span className="text-sm text-gray-600 dark:text-gray-400">{message}</span>
      )}
    </div>
  );
};

export default LoadingSpinner;