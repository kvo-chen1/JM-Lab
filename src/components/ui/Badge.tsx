// src/components/ui/Badge.tsx

import { ReactNode, HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { componentVariants } from '@/utils/designSystem';

// 徽章变体类型
export type BadgeVariant = keyof typeof componentVariants.badge.variants.variant;

// 徽章大小类型
export type BadgeSize = keyof typeof componentVariants.badge.variants.size;

// 徽章形状类型
export type BadgeShape = keyof typeof componentVariants.badge.variants.shape;

// 徽章属性接口
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
  dot?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  animated?: boolean;
  glowEffect?: boolean;
  className?: string;
}

// 徽章组件
const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({
  children,
  variant = 'default',
  size = 'default',
  shape = 'default',
  dot = false,
  icon,
  iconPosition = 'left',
  animated = false,
  glowEffect = false,
  className,
  ...props
}, ref) => {
  // 获取徽章变体样式
  const variantConfig = componentVariants.badge.variants.variant[variant];
  const sizeConfig = componentVariants.badge.variants.size[size];
  const shapeConfig = componentVariants.badge.variants.shape[shape];

  // 特殊效果样式
  const effectClasses = {
    animated: animated ? 'animate-pulse' : '',
    glow: glowEffect ? 'shadow-lg shadow-primary/30' : ''
  };

  // 构建完整的类名
  const badgeClasses = clsx(
    'inline-flex items-center justify-center font-medium transition-all duration-200',
    variantConfig,
    sizeConfig,
    shapeConfig,
    effectClasses.animated,
    effectClasses.glow,
    dot && 'w-2 h-2 p-0',
    className
  );

  // 点样式徽章（无文本）
  if (dot) {
    return (
      <span
        ref={ref}
        className={badgeClasses}
        {...props}
      />
    );
  }

  return (
    <span
      ref={ref}
      className={badgeClasses}
      {...props}
    >
      {/* 图标 */}
      {icon && iconPosition === 'left' && (
        <span className="mr-1.5">{icon}</span>
      )}

      {/* 文本 */}
      <span>{children}</span>

      {/* 右侧图标 */}
      {icon && iconPosition === 'right' && (
        <span className="ml-1.5">{icon}</span>
      )}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;