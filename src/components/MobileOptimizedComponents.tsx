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
    <div className={clsx('w-full px-4 md:px-6 lg:px-8', className)}>
      {children}
    </div>
  );
};

// 2. 移动端卡片：优化圆角和阴影
export const MobileCard: React.FC<MobileBaseProps & { onClick?: () => void; noPadding?: boolean }> = ({ 
  children, 
  className, 
  isDark,
  onClick,
  noPadding = false
}) => {
  return (
    <motion.div
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={clsx(
        'rounded-xl mb-3 overflow-hidden transition-shadow duration-300',
        noPadding ? '' : 'p-4',
        isDark 
          ? 'bg-gray-800 ring-1 ring-gray-700 shadow-lg shadow-black/20' 
          : 'bg-white ring-1 ring-gray-100 shadow-sm shadow-gray-200/50',
        onClick ? 'cursor-pointer active:shadow-inner' : '',
        className
      )}
    >
      {children}
    </motion.div>
  );
};

// 3. 移动端按钮：最小点击区域 48x48dp
type MobileButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isDark?: boolean;
  isLoading?: boolean;
  block?: boolean;
  children?: React.ReactNode;
  icon?: React.ReactNode;
};

export const MobileButton: React.FC<MobileButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isDark,
  isLoading,
  block = false,
  icon,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none min-h-[44px] min-w-[44px] touch-manipulation select-none';
  
  const variants = {
    primary: isDark 
      ? 'bg-blue-600 text-white active:bg-blue-700 shadow-md shadow-blue-900/20' 
      : 'bg-blue-600 text-white active:bg-blue-700 shadow-md shadow-blue-500/30',
    secondary: isDark
      ? 'bg-gray-700 text-gray-200 active:bg-gray-600'
      : 'bg-gray-100 text-gray-900 active:bg-gray-200',
    outline: isDark
      ? 'border border-gray-600 text-gray-300 active:bg-gray-800'
      : 'border border-gray-300 text-gray-700 active:bg-gray-50',
    ghost: isDark
      ? 'text-gray-300 active:bg-gray-800/50'
      : 'text-gray-600 active:bg-gray-100',
    glass: isDark
      ? 'bg-white/10 backdrop-blur-md text-white border border-white/10 active:bg-white/20'
      : 'bg-white/70 backdrop-blur-md text-gray-900 border border-white/40 active:bg-white/90 shadow-sm',
  };

  const sizes = {
    sm: 'text-xs px-3 h-8 min-h-[32px]',
    md: 'text-sm px-4 h-10 min-h-[40px]',
    lg: 'text-base px-6 h-12 min-h-[48px]',
    icon: 'p-2 w-10 h-10 rounded-full',
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
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : icon ? (
        <span className={children ? "mr-2" : ""}>{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
};

// 4. 移动端输入框：最小高度 44dp
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  isDark?: boolean;
  error?: string;
  icon?: React.ReactNode;
}

export const MobileInput: React.FC<MobileInputProps> = ({
  label,
  isDark,
  error,
  className,
  icon,
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className={clsx('block text-sm font-medium mb-1.5 ml-1', isDark ? 'text-gray-300' : 'text-gray-700')}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={clsx(
            'w-full min-h-[44px] rounded-xl outline-none transition-all duration-200',
            icon ? 'pl-10 pr-4' : 'px-4',
            isDark 
              ? 'bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
              : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500 ml-1">{error}</p>}
    </div>
  );
};

// 5. 移动端标题：优化排版
export const MobileSectionHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode; isDark?: boolean }> = ({
  title,
  subtitle,
  action,
  isDark
}) => {
  return (
    <div className="flex items-center justify-between mb-4 mt-2 px-1">
      <div>
        <h3 className={clsx('text-lg font-bold tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
          {title}
        </h3>
        {subtitle && (
          <p className={clsx('text-xs mt-0.5', isDark ? 'text-gray-400' : 'text-gray-500')}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

// 6. 移动端网格列表
export const MobileGrid: React.FC<{ children: React.ReactNode; cols?: 2 | 3; gap?: 'sm' | 'md' | 'lg' }> = ({ 
  children, 
  cols = 2,
  gap = 'md'
}) => {
  const gaps = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  };
  
  return (
    <div className={clsx(
      'grid',
      cols === 2 ? 'grid-cols-2' : 'grid-cols-3',
      gaps[gap]
    )}>
      {children}
    </div>
  );
};

// 7. 毛玻璃面板：用于底部导航等浮层
export const MobileGlassPanel: React.FC<MobileBaseProps & { position?: 'bottom' | 'top' | 'center' }> = ({
  children,
  className,
  isDark,
  position = 'center'
}) => {
  return (
    <div className={clsx(
      'backdrop-blur-xl border transition-colors duration-300',
      isDark 
        ? 'bg-gray-900/80 border-gray-800/50' 
        : 'bg-white/80 border-gray-200/50',
      position === 'bottom' ? 'rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]' : '',
      position === 'top' ? 'rounded-b-2xl shadow-sm' : '',
      position === 'center' ? 'rounded-2xl shadow-lg' : '',
      className
    )}>
      {children}
    </div>
  );
};

// 8. 触摸按钮：专门用于图标按钮，保证点击区域
export const TouchButton: React.FC<MobileButtonProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      className={clsx(
        'flex items-center justify-center rounded-full min-w-[44px] min-h-[44px] transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default {
  Container: MobileContainer,
  Card: MobileCard,
  Button: MobileButton,
  Input: MobileInput,
  SectionHeader: MobileSectionHeader,
  Grid: MobileGrid,
  GlassPanel: MobileGlassPanel,
  TouchButton: TouchButton,
};