// src/components/ui/Card.tsx

import React, { ReactNode, HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

// 卡片变体类型
export type CardVariant = 'default' | 'outlined' | 'elevated' | 'ghost';

// 卡片大小类型
export type CardSize = 'small' | 'medium' | 'large';

// 卡片阴影类型
export type CardShadow = 'none' | 'sm' | 'md' | 'lg' | 'xl';

// 卡片属性接口
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  shadow?: CardShadow;
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

// 变体样式映射
const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white border border-gray-200',
  outlined: 'bg-transparent border-2 border-gray-300',
  elevated: 'bg-white shadow-card border-0',
  ghost: 'bg-transparent border-0'
};

// 大小样式映射
const sizeClasses: Record<CardSize, string> = {
  small: 'p-4',
  medium: 'p-6',
  large: 'p-8'
};

// 阴影样式映射
const shadowClasses: Record<CardShadow, string> = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl'
};

// 卡片组件
const Card = forwardRef<HTMLDivElement, CardProps>((props, ref) => {
  const {
    children,
    variant = 'default',
    size = 'medium',
    shadow = 'none',
    hoverable = false,
    clickable = false,
    onClick,
    className,
    ...rest
  } = props;

  const cardClasses = clsx(
    'rounded-lg transition-all duration-200',
    variantClasses[variant],
    sizeClasses[size],
    shadow !== 'none' && shadowClasses[shadow],
    hoverable && 'hover:shadow-card-hover hover:-translate-y-1',
    clickable && 'cursor-pointer',
    className
  );

  return (
    <div
      ref={ref}
      className={cardClasses}
      onClick={onClick}
      {...rest}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

// 卡片头部组件
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>((props, ref) => {
  const { children, className, ...rest } = props;
  return (
    <div
      ref={ref}
      className={clsx('mb-4', className)}
      {...rest}
    >
      {children}
    </div>
  );
});

CardHeader.displayName = 'CardHeader';

// 卡片标题组件
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>((props, ref) => {
  const { children, className, ...rest } = props;
  return (
    <h3
      ref={ref}
      className={clsx('text-lg font-semibold text-gray-900', className)}
      {...rest}
    >
      {children}
    </h3>
  );
});

CardTitle.displayName = 'CardTitle';

// 卡片描述组件
interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>((props, ref) => {
  const { children, className, ...rest } = props;
  return (
    <p
      ref={ref}
      className={clsx('text-sm text-gray-500 mt-1', className)}
      {...rest}
    >
      {children}
    </p>
  );
});

CardDescription.displayName = 'CardDescription';

// 卡片内容组件
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>((props, ref) => {
  const { children, className, ...rest } = props;
  return (
    <div
      ref={ref}
      className={clsx('', className)}
      {...rest}
    >
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';

// 卡片底部组件
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>((props, ref) => {
  const { children, className, ...rest } = props;
  return (
    <div
      ref={ref}
      className={clsx('mt-4 flex items-center justify-between', className)}
      {...rest}
    >
      {children}
    </div>
  );
});

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export default Card;
