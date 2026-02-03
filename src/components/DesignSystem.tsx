/**
 * 设计系统UI组件
 * 基于设计系统规范构建的基础组件
 */

import React from 'react';
import { cn, designTokens, componentVariants, a11yUtils, animationUtils } from '@/utils/designSystem';

/**
 * 按钮组件
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  rounded?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'default', 
    isLoading = false,
    loadingText,
    leftIcon,
    rightIcon,
    fullWidth = false,
    rounded = false,
    children,
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200';
    const variantClasses = componentVariants.button.variants.variant[variant];
    const sizeClasses = componentVariants.button.variants.size[size];
    const stateClasses = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:shadow-md active:shadow-sm';
    const widthClasses = fullWidth ? 'w-full' : '';
    const roundedClasses = rounded ? 'rounded-full' : '';
    const interactiveClasses = 'transform hover:-translate-y-0.5 active:translate-y-0';
    
    const classes = cn(
      baseClasses,
      variantClasses,
      sizeClasses,
      stateClasses,
      widthClasses,
      roundedClasses,
      interactiveClasses,
      className
    );

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {leftIcon && !isLoading && <span className="mr-2 transform transition-transform duration-200 hover:scale-110">{leftIcon}</span>}
        {isLoading && loadingText ? loadingText : <span className="transform transition-transform duration-200 hover:scale-105">{children}</span>}
        {rightIcon && !isLoading && <span className="ml-2 transform transition-transform duration-200 hover:scale-110">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * 卡片组件
 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'none';
  interactive?: boolean;
  elevated?: boolean;
  hoverable?: boolean;
  compact?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'default',
    interactive = false,
    elevated = false,
    hoverable = false,
    compact = false,
    children,
    ...props 
  }, ref) => {
    const baseClasses = 'relative overflow-hidden';
    const variantClasses = componentVariants.card.variants.variant[variant];
    const sizeClasses = componentVariants.card.variants.size[size];
    const interactiveClasses = interactive ? 'cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:translate-y-0' : '';
    const hoverableClasses = hoverable && !interactive ? 'transition-all duration-300 hover:shadow-md' : '';
    const elevatedClasses = elevated ? 'shadow-xl' : 'shadow-sm';
    const compactClasses = compact ? 'p-4' : 'p-6';
    
    const classes = cn(
      baseClasses,
      variantClasses,
      sizeClasses,
      interactiveClasses,
      hoverableClasses,
      elevatedClasses,
      compactClasses,
      className
    );

    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * 卡片头部
 */
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
  compact?: boolean;
  align?: 'start' | 'center' | 'end';
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, bordered = false, compact = false, align = 'start', children, ...props }, ref) => {
    const baseClasses = `flex flex-col space-y-1.5 ${compact ? 'p-4' : 'p-6'}`;
    const borderedClasses = bordered ? 'border-b border-border' : '';
    const alignClasses = align === 'center' ? 'items-center text-center' : align === 'end' ? 'items-end text-right' : 'items-start';
    
    const classes = cn(baseClasses, borderedClasses, alignClasses, className);

    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

/**
 * 卡片标题
 */
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: 'sm' | 'default' | 'lg' | 'xl';
  truncated?: boolean;
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', size = 'default', truncated = false, children, ...props }, ref) => {
    const sizeClasses = size === 'sm' ? 'text-xl font-semibold' : 
                       size === 'lg' ? 'text-3xl font-bold' : 
                       size === 'xl' ? 'text-4xl font-bold' : 
                       'text-2xl font-semibold';
    const truncatedClasses = truncated ? 'truncate' : '';
    
    const classes = cn(
      sizeClasses,
      'leading-none tracking-tight',
      truncatedClasses,
      className
    );

    return (
      <Component
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardTitle.displayName = 'CardTitle';

/**
 * 卡片描述
 */
interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  compact?: boolean;
}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, compact = false, children, ...props }, ref) => {
    const sizeClasses = compact ? 'text-xs' : 'text-sm';
    const classes = cn(sizeClasses, 'text-muted-foreground', className);

    return (
      <p
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </p>
    );
  }
);

CardDescription.displayName = 'CardDescription';

/**
 * 卡片内容
 */
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, compact = false, children, ...props }, ref) => {
    const paddingClasses = compact ? 'p-4 pt-0' : 'p-6 pt-0';
    const classes = cn(paddingClasses, className);

    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

/**
 * 卡片底部
 */
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
  compact?: boolean;
  align?: 'start' | 'center' | 'end' | 'between';
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, bordered = false, compact = false, align = 'start', children, ...props }, ref) => {
    const baseClasses = `flex ${compact ? 'p-4 pt-0' : 'p-6 pt-0'}`;
    const borderedClasses = bordered ? 'border-t border-border mt-4' : '';
    const alignClasses = align === 'center' ? 'justify-center items-center' : 
                        align === 'end' ? 'justify-end items-center' : 
                        align === 'between' ? 'justify-between items-center' : 
                        'items-center';
    
    const classes = cn(baseClasses, borderedClasses, alignClasses, className);

    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

/**
 * 输入框组件
 */
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'outline' | 'filled' | 'flushed';
  size?: 'default' | 'sm' | 'lg';
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = 'text',
    variant = 'default', 
    size = 'default',
    error = false,
    leftIcon,
    rightIcon,
    ...props 
  }, ref) => {
    const baseClasses = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200';
    const variantClasses = componentVariants.input.variants.variant[variant];
    const sizeClasses = componentVariants.input.variants.size[size];
    const errorClasses = error ? 'border-destructive focus-visible:ring-destructive' : '';
    const interactiveClasses = 'hover:border-ring/50 hover:shadow-sm focus-visible:shadow-md';
    
    const inputClasses = cn(baseClasses, variantClasses, sizeClasses, errorClasses, interactiveClasses, className);

    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            inputClasses,
            leftIcon && 'pl-10',
            rightIcon && 'pr-10'
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * 标签组件
 */
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  rounded?: boolean;
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'default',
    rounded = false,
    children,
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
    const variantClasses = {
      default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80 hover:shadow-md',
      secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-md',
      destructive: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80 hover:shadow-md',
      outline: 'text-foreground hover:bg-accent hover:text-accent-foreground'
    }[variant];
    
    const sizeClasses = {
      default: 'text-xs',
      sm: 'px-1.5 py-0 text-[10px]',
      lg: 'px-3 py-1 text-sm'
    }[size];
    
    const roundedClasses = rounded ? 'rounded-full' : '';
    const interactiveClasses = 'transform hover:-translate-y-0.5 active:translate-y-0';
    
    const classes = cn(baseClasses, variantClasses, sizeClasses, roundedClasses, interactiveClasses, className);

    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

/**
 * 头像组件
 */
interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'default' | 'lg' | 'xl';
  src?: string;
  alt?: string;
  fallback?: string;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ 
    className, 
    size = 'default',
    src,
    alt,
    fallback,
    children,
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'h-8 w-8 text-xs',
      default: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-lg'
    }[size];
    
    const classes = cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      sizeClasses,
      className
    );

    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      >
        {src ? (
          <img
            className="aspect-square h-full w-full"
            src={src}
            alt={alt}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
            <span className="text-muted-foreground font-medium">
              {fallback || children?.toString().charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

/**
 * 分隔符组件
 */
interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ 
    className, 
    orientation = 'horizontal', 
    decorative = false,
    ...props 
  }, ref) => {
    const classes = cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      className
    );

    return (
      <div
        ref={ref}
        className={classes}
        role={decorative ? 'none' : 'separator'}
        aria-orientation={orientation}
        {...props}
      />
    );
  }
);

Separator.displayName = 'Separator';

/**
 * 骨架屏组件
 */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ 
    className, 
    variant = 'rect',
    width,
    height,
    ...props 
  }, ref) => {
    const variantClasses = {
      text: 'h-4 w-full rounded',
      rect: 'rounded',
      circle: 'rounded-full'
    }[variant];
    
    const classes = cn(
      'animate-pulse bg-muted',
      variantClasses,
      className
    );

    const style = {
      width: width || (variant === 'text' ? '100%' : undefined),
      height: height || (variant === 'text' ? '1rem' : undefined)
    };

    return (
      <div
        ref={ref}
        className={classes}
        style={style}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

/**
 * 工具提示组件
 */
interface TooltipProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'content'> {
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  placement = 'top',
  delay = 200,
  disabled = false,
  className,
  ...props 
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (disabled) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const placementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }[placement];

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-border',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-border',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-border',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-border'
  }[placement];

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>
      
      {isVisible && !disabled && (
        <div
          className={cn(
            'absolute z-50 px-3 py-2 text-sm text-popover-foreground bg-popover border border-border rounded-md shadow-md',
            placementClasses,
            className
          )}
          role="tooltip"
          {...props}
        >
          {content}
          <div
            className={cn(
              'absolute w-0 h-0 border-4',
              arrowClasses
            )}
          />
        </div>
      )}
    </div>
  );
};

export default {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Badge,
  Avatar,
  Separator,
  Skeleton,
  Tooltip
};