/**
 * 设计系统UI组件
 * 基于设计系统规范构建的基础组件
 */

import React from 'react';
import { motion } from 'framer-motion';
import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner';
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
    const stateClasses = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    const widthClasses = fullWidth ? 'w-full' : '';
    const roundedClasses = rounded ? 'rounded-full' : '';
    
    const classes = cn(
      baseClasses,
      variantClasses,
      sizeClasses,
      stateClasses,
      widthClasses,
      roundedClasses,
      className
    );

    const MotionButton = motion.button as React.ForwardRefExoticComponent<
      React.ButtonHTMLAttributes<HTMLButtonElement> & 
      React.RefAttributes<HTMLButtonElement>
    >;

    return (
      <MotionButton
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        whileHover={!disabled && !isLoading ? { 
          scale: 1.02,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        } : {}}
        whileTap={!disabled && !isLoading ? { 
          scale: 0.98,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        } : {}}
        transition={{ 
          type: 'spring', 
          stiffness: 400, 
          damping: 17 
        }}
        {...props}
      >
        {isLoading && (
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 1, 
              repeat: Infinity, 
              ease: 'linear' 
            }}
            className="-ml-1 mr-2 h-4 w-4"
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
          </motion.svg>
        )}
        {leftIcon && !isLoading && (
          <motion.span 
            className="mr-2"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            {leftIcon}
          </motion.span>
        )}
        {isLoading && loadingText ? (
          loadingText
        ) : (
          <motion.span
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.span>
        )}
        {rightIcon && !isLoading && (
          <motion.span 
            className="ml-2"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            {rightIcon}
          </motion.span>
        )}
      </MotionButton>
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
  animation?: 'pulse' | 'shimmer' | 'none';
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ 
    className, 
    variant = 'rect',
    width,
    height,
    animation = 'shimmer',
    ...props 
  }, ref) => {
    const variantClasses = {
      text: 'h-4 w-full rounded',
      rect: 'rounded',
      circle: 'rounded-full'
    }[variant];
    
    const animationClasses = {
      pulse: 'animate-pulse bg-muted',
      shimmer: 'bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer',
      none: 'bg-muted'
    }[animation];
    
    const classes = cn(
      animationClasses,
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
 * 骨架屏列表组件 - 快速创建列表骨架屏
 */
interface SkeletonListProps {
  count?: number;
  itemHeight?: string | number;
  gap?: string;
  className?: string;
  children?: React.ReactNode;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 3,
  itemHeight = '80px',
  gap = '4',
  className,
  children
}) => {
  return (
    <div className={cn('space-y-' + gap, className)}>
      {children || Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          variant="rect"
          height={itemHeight}
          width="100%"
        />
      ))}
    </div>
  );
};

/**
 * 卡片骨架屏组件
 */
interface SkeletonCardProps {
  showImage?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  descriptionLines?: number;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showImage = true,
  showTitle = true,
  showDescription = true,
  descriptionLines = 2,
  className
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {showImage && (
        <Skeleton variant="rect" height="200px" width="100%" />
      )}
      <div className="space-y-3">
        {showTitle && (
          <Skeleton variant="text" width="60%" />
        )}
        {showDescription && (
          <div className="space-y-2">
            {Array.from({ length: descriptionLines }).map((_, index) => (
              <Skeleton 
                key={index} 
                variant="text" 
                width={index === descriptionLines - 1 ? '80%' : '100%'} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

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

/**
 * 空状态组件
 */
interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  size?: 'sm' | 'default' | 'lg';
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ 
    className, 
    icon, 
    title = '暂无数据', 
    description, 
    action,
    size = 'default',
    children,
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'py-8',
      default: 'py-12',
      lg: 'py-16'
    }[size];
    
    const iconSize = {
      sm: 'w-12 h-12',
      default: 'w-16 h-16',
      lg: 'w-20 h-20'
    }[size];
    
    const titleSize = {
      sm: 'text-lg',
      default: 'text-xl',
      lg: 'text-2xl'
    }[size];

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center text-center',
          sizeClasses,
          className
        )}
        {...props}
      >
        {icon && (
          <div className={cn(
            'mb-4 text-muted-foreground',
            iconSize
          )}>
            {icon}
          </div>
        )}
        
        {title && (
          <h3 className={cn(
            'font-semibold text-foreground mb-2',
            titleSize
          )}>
            {title}
          </h3>
        )}
        
        {description && (
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {description}
          </p>
        )}
        
        {action && (
          <div className="mt-2">
            {action}
          </div>
        )}
        
        {children}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

/**
 * 下拉菜单组件
 */
interface DropdownProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  open: controlledOpen,
  onOpenChange,
  children,
  align = 'start',
  side = 'bottom'
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  
  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };
  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleOpenChange(false);
      }
    };
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);
  
  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0'
  }[align];
  
  const sideClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  }[side];
  
  return (
    <div className="relative inline-block" ref={containerRef}>
      <div onClick={() => handleOpenChange(!open)}>
        {trigger}
      </div>
      
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={cn(
            'absolute z-50 min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
            sideClasses,
            alignClasses
          )}
        >
          {children}
        </motion.div>
      )}
    </div>
  );
};

/**
 * 下拉菜单选项组件
 */
interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
  icon?: React.ReactNode;
}

export const DropdownItem = React.forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ className, inset, icon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
          inset && 'pl-8',
          className
        )}
        {...props}
      >
        {icon && <span className="mr-2 h-4 w-4">{icon}</span>}
        {children}
      </button>
    );
  }
);

DropdownItem.displayName = 'DropdownItem';

/**
 * 下拉菜单分组标题组件
 */
interface DropdownLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

export const DropdownLabel = React.forwardRef<HTMLDivElement, DropdownLabelProps>(
  ({ className, inset, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'px-2 py-1.5 text-sm font-semibold text-foreground',
          inset && 'pl-8',
          className
        )}
        {...props}
      />
    );
  }
);

DropdownLabel.displayName = 'DropdownLabel';

/**
 * 下拉菜单分隔符组件
 */
export const DropdownSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
});

DropdownSeparator.displayName = 'DropdownSeparator';

/**
 * 标签页组件 - Tabs
 */
interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;
  
  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };
  
  return (
    <div className={cn('w-full', className)}>
      <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
        {children}
      </TabsContext.Provider>
    </div>
  );
};

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

/**
 * 标签页列表组件
 */
interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
          className
        )}
        role="tablist"
        {...props}
      />
    );
  }
);

TabsList.displayName = 'TabsList';

/**
 * 标签页触发器组件
 */
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = useTabsContext();
    const isSelected = value === selectedValue;
    
    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isSelected}
        data-state={isSelected ? 'active' : 'inactive'}
        onClick={() => onValueChange(value)}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          isSelected
            ? 'bg-background text-foreground shadow-sm'
            : 'hover:bg-background/50 hover:text-foreground',
          className
        )}
        {...props}
      />
    );
  }
);

TabsTrigger.displayName = 'TabsTrigger';

/**
 * 标签页内容组件
 */
interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const { value: selectedValue } = useTabsContext();
    const isSelected = value === selectedValue;
    
    if (!isSelected) return null;
    
    return (
      <motion.div
        ref={ref}
        role="tabpanel"
        data-state={isSelected ? 'active' : 'inactive'}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
        {...props}
      />
    );
  }
);

TabsContent.displayName = 'TabsContent';

/**
 * 进度条组件
 */
interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className, 
    value = 0, 
    max = 100,
    variant = 'default',
    size = 'default',
    showLabel = false,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    const variantClasses = {
      default: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      error: 'bg-destructive'
    }[variant];
    
    const sizeClasses = {
      sm: 'h-1',
      default: 'h-2',
      lg: 'h-4'
    }[size];
    
    return (
      <div ref={ref} className={cn('relative', className)} {...props}>
        <div className={cn('w-full overflow-hidden rounded-full bg-secondary', sizeClasses)}>
          <motion.div
            className={cn('h-full rounded-full', variantClasses)}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        {showLabel && (
          <span className="absolute right-0 top-0 text-xs text-muted-foreground">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

/**
 * 开关组件
 */
interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ 
    className, 
    checked: controlledChecked, 
    onCheckedChange,
    disabled,
    ...props 
  }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState(false);
    const isControlled = controlledChecked !== undefined;
    const checked = isControlled ? controlledChecked : internalChecked;
    
    const handleToggle = () => {
      if (disabled) return;
      const newValue = !checked;
      if (!isControlled) {
        setInternalChecked(newValue);
      }
      onCheckedChange?.(newValue);
    };
    
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        data-state={checked ? 'checked' : 'unchecked'}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-primary' : 'bg-input',
          className
        )}
        {...props}
      >
        <motion.span
          className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0"
          initial={false}
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    );
  }
);

Switch.displayName = 'Switch';

/**
 * Toast 通知工具函数（集成 sonner）
 */

export const toast = {
  success: (message: string, options?: any) => sonnerToast.success(message, options),
  error: (message: string, options?: any) => sonnerToast.error(message, options),
  warning: (message: string, options?: any) => sonnerToast.warning(message, options),
  info: (message: string, options?: any) => sonnerToast.info(message, options),
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
  loading: (message: string, options?: any) => sonnerToast.loading(message, options),
  custom: sonnerToast.custom
};

export const Toaster = SonnerToaster;

/**
 * 选择器组件 - Select
 */
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface SelectProps {
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  options?: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  multiple?: boolean;
  maxSelected?: number;
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  value: controlledValue,
  defaultValue,
  onValueChange,
  options = [],
  placeholder = '请选择',
  searchPlaceholder = '搜索...',
  disabled = false,
  searchable = false,
  multiple = false,
  maxSelected,
  size = 'default',
  className
}) => {
  const [internalValue, setInternalValue] = React.useState<string | string[]>(
    defaultValue || (multiple ? [] : '')
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;
  
  const handleValueChange = (newValue: string | string[]) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };
  
  const handleOptionClick = (optionValue: string) => {
    if (disabled) return;
    
    if (multiple) {
      const currentValue = Array.isArray(value) ? value : [];
      let newValue: string[];
      
      if (currentValue.includes(optionValue)) {
        newValue = currentValue.filter(v => v !== optionValue);
      } else {
        if (maxSelected && currentValue.length >= maxSelected) {
          return;
        }
        newValue = [...currentValue, optionValue];
      }
      
      handleValueChange(newValue);
    } else {
      handleValueChange(optionValue);
      setIsOpen(false);
    }
  };
  
  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleValueChange(multiple ? [] : '');
  };
  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getSelectedLabel = () => {
    if (multiple) {
      const selectedOptions = options.filter(opt => 
        Array.isArray(value) && value.includes(opt.value)
      );
      if (selectedOptions.length === 0) return placeholder;
      if (selectedOptions.length === 1) return selectedOptions[0].label;
      return `${selectedOptions.length} 项已选择`;
    } else {
      const selectedOption = options.find(opt => opt.value === value);
      return selectedOption ? selectedOption.label : placeholder;
    }
  };
  
  const isSelected = (optionValue: string) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };
  
  const sizeClasses = {
    sm: 'h-8 text-xs px-2',
    default: 'h-10 text-sm px-3',
    lg: 'h-12 text-base px-4'
  }[size];
  
  return (
    <div className="relative" ref={containerRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-200 cursor-pointer',
          sizeClasses,
          disabled && 'opacity-50 cursor-not-allowed',
          isOpen && 'ring-2 ring-ring ring-offset-2',
          className
        )}
      >
        <span className={cn(
          'truncate',
          (!multiple && !value) || (multiple && Array.isArray(value) && value.length === 0)
            ? 'text-muted-foreground'
            : 'text-foreground'
        )}>
          {getSelectedLabel()}
        </span>
        <div className="flex items-center gap-2">
          {((!multiple && value) || (multiple && Array.isArray(value) && value.length > 0)) && (
            <button
              onClick={clearSelection}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <motion.svg
            className={cn('w-4 h-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </div>
      </div>
      
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="absolute z-50 w-full mt-1 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {searchable && (
            <div className="p-2 border-b border-border">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 px-2 text-sm bg-transparent border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>
          )}
          
          <div className="max-h-60 overflow-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                无匹配选项
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleOptionClick(option.value)}
                  disabled={option.disabled}
                  className={cn(
                    'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
                    option.disabled
                      ? 'opacity-50 pointer-events-none'
                      : 'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                    isSelected(option.value) && 'bg-accent text-accent-foreground'
                  )}
                >
                  {multiple && (
                    <div className={cn(
                      'mr-2 h-4 w-4 border rounded-sm flex items-center justify-center',
                      isSelected(option.value)
                        ? 'bg-primary border-primary'
                        : 'border-input'
                    )}>
                      {isSelected(option.value) && (
                        <svg className="h-3 w-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  )}
                  {option.icon && <span className="mr-2">{option.icon}</span>}
                  <span className="flex-1">{option.label}</span>
                  {!multiple && isSelected(option.value) && (
                    <svg className="h-4 w-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

/**
 * 表单容器组件
 */
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSubmit?: (values: any) => void | Promise<void>;
  children?: React.ReactNode;
  className?: string;
}

export const Form: React.FC<FormProps> = ({
  onSubmit,
  children,
  className,
  ...props
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      const formData = new FormData(e.target as HTMLFormElement);
      const values = Object.fromEntries(formData.entries());
      onSubmit(values);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('space-y-4', className)}
      {...props}
    >
      {children}
    </form>
  );
};

/**
 * 表单字段组件
 */
interface FormFieldProps {
  name?: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  children?: React.ReactNode;
  required?: boolean;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  description,
  error,
  children,
  required = false,
  className
}) => {
  const id = React.useId();

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <FormLabel htmlFor={id} required={required}>
          {label}
        </FormLabel>
      )}
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<any>, { id, name })
        : children}
      {description && (
        <FormDescription>{description}</FormDescription>
      )}
      {error && (
        <FormMessage>{error}</FormMessage>
      )}
    </div>
  );
};

/**
 * 表单标签组件
 */
interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, required = false, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="text-destructive ml-1">*</span>
        )}
      </label>
    );
  }
);

FormLabel.displayName = 'FormLabel';

/**
 * 表单描述组件
 */
export const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-[0.8rem] text-muted-foreground', className)}
      {...props}
    />
  );
});

FormDescription.displayName = 'FormDescription';

/**
 * 表单消息（错误提示）组件
 */
export const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-[0.8rem] font-medium text-destructive', className)}
      {...props}
    >
      {children}
    </p>
  );
});

FormMessage.displayName = 'FormMessage';

/**
 * 单选框组件
 */
interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className={cn('flex items-center gap-2 cursor-pointer', className)}>
        <input
          type="radio"
          ref={ref}
          className="peer sr-only"
          {...props}
        />
        <div className="relative flex items-center justify-center">
          <div className="h-4 w-4 rounded-full border-2 border-input peer-checked:border-primary peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2 transition-colors" />
          <div className="absolute h-2 w-2 rounded-full bg-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity" />
        </div>
        {label && (
          <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Radio.displayName = 'Radio';

/**
 * 单选框组组件
 */
interface RadioGroupProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  value: controlledValue,
  defaultValue,
  onValueChange,
  children,
  orientation = 'vertical',
  className
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  const orientationClasses = orientation === 'horizontal' ? 'flex gap-4' : 'space-y-2';

  return (
    <div className={cn(orientationClasses, className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === Radio) {
          return React.cloneElement(child as React.ReactElement<any>, {
            checked: child.props.value === value,
            onChange: () => handleValueChange(child.props.value)
          });
        }
        return child;
      })}
    </div>
  );
};

/**
 * 复选框组件
 */
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className={cn('flex items-center gap-2 cursor-pointer', className)}>
        <input
          type="checkbox"
          ref={ref}
          className="peer sr-only"
          {...props}
        />
        <div className="relative flex items-center justify-center">
          <div className="h-4 w-4 rounded border-2 border-input peer-checked:border-primary peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2 transition-colors" />
          <svg
            className="absolute h-3 w-3 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        {label && (
          <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

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
  SkeletonList,
  SkeletonCard,
  Tooltip,
  EmptyState,
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Progress,
  Switch,
  toast,
  Toaster,
  Select,
  Form,
  FormField,
  FormLabel,
  FormDescription,
  FormMessage,
  Radio,
  RadioGroup,
  Checkbox
};