// src/components/ui/Badge.tsx
// @mention feature - Badge component

import React, { ReactNode, HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

// 徽章变体类型
export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'ghost';

// 徽章大小类型
export type BadgeSize = 'small' | 'medium' | 'large';

// 徽章形状类型
export type BadgeShape = 'rounded' | 'pill' | 'square';

// 徽章属性接口
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
  dot?: boolean;
  dotColor?: string;
  removable?: boolean;
  onRemove?: () => void;
  href?: string;
  target?: string;
}

// 变体样式映射
const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  danger: 'bg-destructive text-destructive-foreground',
  info: 'bg-info text-info-foreground',
  outline: 'border border-current text-gray-700 bg-transparent',
  ghost: 'text-gray-700 hover:bg-gray-100 bg-transparent'
};

// 大小样式映射
const sizeClasses: Record<BadgeSize, string> = {
  small: 'px-2 py-0.5 text-xs',
  medium: 'px-3 py-1 text-sm',
  large: 'px-4 py-1.5 text-base'
};

// 形状样式映射
const shapeClasses: Record<BadgeShape, string> = {
  rounded: 'rounded',
  pill: 'rounded-full',
  square: 'rounded-none'
};

// 徽章组件
const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({
  children,
  variant = 'default',
  size = 'medium',
  shape = 'pill',
  dot = false,
  dotColor = 'bg-current',
  removable = false,
  onRemove,
  href,
  target,
  className,
  ...props
}, ref) => {
  // 构建完整的类名
  const badgeClasses = clsx(
    'inline-flex items-center gap-1.5 font-medium transition-colors',
    variantClasses[variant],
    sizeClasses[size],
    shapeClasses[shape],
    href && 'cursor-pointer hover:opacity-80',
    className
  );

  // 徽章内容
  const content = (
    <>
      {/* 状态点 */}
      {dot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full', dotColor)} />
      )}
      
      {/* 徽章文本 */}
      <span>{children}</span>
      
      {/* 移除按钮 */}
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-1 -mr-0.5 rounded-full p-0.5 hover:bg-black/10 transition-colors"
          aria-label="Remove badge"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </>
  );

  // 如果是链接，渲染为 <a> 标签
  if (href) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        target={target}
        className={badgeClasses}
        {...props}
      >
        {content}
      </a>
    );
  }

  // 否则渲染为 <span> 标签
  return (
    <span
      ref={ref}
      className={badgeClasses}
      {...props}
    >
      {content}
    </span>
  );
});

Badge.displayName = 'Badge';

export { Badge };
export default Badge;
