import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';

// 遵循 8dp 网格系统
const SPACING_UNIT = 8;

interface MobileBaseProps {
  children?: React.ReactNode;
  className?: string;
  isDark?: boolean;
}

// 1. 移动端容器：统一内边距 (16px = 2 * 8dp)
export const MobileContainer: React.FC<MobileBaseProps> = ({ children, className }) => {
  return (
    <div className={clsx('w-full px-4 md:px-0', className)}>
      {children}
    </div>
  );
};

// 2. 移动端卡片：优化圆角和阴影
export const MobileCard: React.FC<MobileBaseProps & { onClick?: () => void }> = ({ 
  children, 
  className, 
  isDark,
  onClick 
}) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={clsx(
        'rounded-xl p-4 mb-3 shadow-sm',
        isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-100',
        className
      )}
    >
      {children}
    </motion.div>
  );
};

// 3. 移动端按钮：最小点击区域 48x48dp
interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isDark?: boolean;
  isLoading?: boolean;
  block?: boolean;
}

export const MobileButton: React.FC<MobileButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isDark,
  isLoading,
  block = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none min-h-[48px] touch-manipulation';
  
  const variants = {
    primary: isDark 
      ? 'bg-blue-600 text-white active:bg-blue-700' 
      : 'bg-blue-600 text-white active:bg-blue-700 shadow-sm',
    secondary: isDark
      ? 'bg-gray-700 text-gray-200 active:bg-gray-600'
      : 'bg-gray-100 text-gray-900 active:bg-gray-200',
    outline: isDark
      ? 'border border-gray-600 text-gray-300 active:bg-gray-800'
      : 'border border-gray-300 text-gray-700 active:bg-gray-50',
    ghost: isDark
      ? 'text-gray-300 active:bg-gray-800'
      : 'text-gray-600 active:bg-gray-100',
  };

  const sizes = {
    sm: 'text-sm px-3',
    md: 'text-base px-4',
    lg: 'text-lg px-6',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        block ? 'w-full' : '',
        props.disabled || isLoading ? 'opacity-50 cursor-not-allowed' : '',
        className
      )}
      disabled={props.disabled || isLoading}
      {...props} // Framer motion props compatible via simpler button or use motion.button
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </motion.button>
  );
};

// 4. 移动端输入框：最小高度 48dp
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  isDark?: boolean;
  error?: string;
}

export const MobileInput: React.FC<MobileInputProps> = ({
  label,
  isDark,
  error,
  className,
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className={clsx('block text-sm font-medium mb-1', isDark ? 'text-gray-300' : 'text-gray-700')}>
          {label}
        </label>
      )}
      <input
        className={clsx(
          'w-full min-h-[48px] px-4 rounded-lg outline-none transition-all',
          isDark 
            ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500' 
            : 'bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          error ? 'border-red-500 focus:ring-red-500' : '',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

// 5. 移动端标题：优化排版
export const MobileSectionHeader: React.FC<{ title: string; action?: React.ReactNode; isDark?: boolean }> = ({
  title,
  action,
  isDark
}) => {
  return (
    <div className="flex items-center justify-between mb-3 mt-1">
      <h3 className={clsx('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
        {title}
      </h3>
      {action && <div>{action}</div>}
    </div>
  );
};

// 6. 移动端网格列表
export const MobileGrid: React.FC<{ children: React.ReactNode; cols?: 2 | 3 }> = ({ children, cols = 2 }) => {
  return (
    <div className={clsx(
      'grid gap-3',
      cols === 2 ? 'grid-cols-2' : 'grid-cols-3'
    )}>
      {children}
    </div>
  );
};

export default {
  Container: MobileContainer,
  Card: MobileCard,
  Button: MobileButton,
  Input: MobileInput,
  SectionHeader: MobileSectionHeader,
  Grid: MobileGrid,
};
