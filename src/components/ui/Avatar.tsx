// src/components/ui/Avatar.tsx

import React, { ReactNode, HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

// 头像大小类型
export type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';

// 头像形状类型
export type AvatarShape = 'circle' | 'rounded' | 'square';

// 头像状态类型
export type AvatarStatus = 'online' | 'offline' | 'away' | 'busy';

// 头像属性接口
interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  status?: AvatarStatus;
  statusPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  border?: boolean;
  borderColor?: string;
  glowEffect?: boolean;
  glowColor?: string;
  onClick?: () => void;
  children?: ReactNode; // 用于默认头像的文本或图标
}

// 头像组件
const Avatar = forwardRef<HTMLDivElement, AvatarProps>(({
  src,
  alt,
  size = 'medium',
  shape = 'circle',
  status,
  statusPosition = 'bottom-right',
  border = false,
  borderColor = 'border-white',
  glowEffect = false,
  glowColor = 'shadow-primary/30',
  onClick,
  children,
  className,
  ...props
}, ref) => {
  // 大小样式映射
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
    xlarge: 'w-24 h-24',
    xxlarge: 'w-32 h-32'
  };

  // 形状样式映射
  const shapeClasses = {
    circle: 'rounded-full',
    rounded: 'rounded-lg',
    square: 'rounded'
  };

  // 状态样式映射
  const statusClasses = {
    online: 'bg-success',
    offline: 'bg-gray-400',
    away: 'bg-warning',
    busy: 'bg-danger'
  };

  // 状态位置样式映射
  const statusPositionClasses = {
    'bottom-right': 'bottom-0 right-0 transform translate-x-1/2 translate-y-1/2',
    'bottom-left': 'bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2',
    'top-right': 'top-0 right-0 transform translate-x-1/2 -translate-y-1/2',
    'top-left': 'top-0 left-0 transform -translate-x-1/2 -translate-y-1/2'
  };

  // 构建完整的类名
  const avatarClasses = clsx(
    'relative flex items-center justify-center overflow-hidden',
    sizeClasses[size],
    shapeClasses[shape],
    border && `border-2 ${borderColor}`,
    glowEffect && `shadow-lg ${glowColor}`,
    onClick && 'cursor-pointer transition-transform duration-200 hover:scale-105',
    className
  );

  return (
    <div
      ref={ref}
      className={avatarClasses}
      onClick={onClick}
      {...props}
    >
      {/* 头像图片 */}
      {src ? (
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            if (children) {
              const parent = target.parentElement;
              if (parent) {
                const defaultAvatar = document.createElement('div');
                defaultAvatar.className = 'w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
                defaultAvatar.innerHTML = children as string;
                parent.appendChild(defaultAvatar);
              }
            }
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {children || (
            <i className="fas fa-user text-2xl"></i>
          )}
        </div>
      )}

      {/* 状态指示器 */}
      {status && (
        <div
          className={clsx(
            'absolute w-3 h-3 rounded-full border-2 border-white',
            statusClasses[status],
            statusPositionClasses[statusPosition]
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';

// 头像组属性接口
interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  maxVisible?: number;
  spacing?: 'none' | 'tight' | 'normal';
  overlap?: boolean;
}

// 头像组组件
export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(({
  children,
  maxVisible = 3,
  spacing = 'normal',
  overlap = true,
  className,
  ...props
}, ref) => {
  // 间距样式映射
  const spacingClasses = {
    none: 'space-x-0',
    tight: 'space-x-1',
    normal: 'space-x-2'
  };

  // 处理子元素
  const childArray = React.Children.toArray(children);
  const visibleChildren = childArray.slice(0, maxVisible);
  const remainingCount = childArray.length - maxVisible;

  return (
    <div
      ref={ref}
      className={clsx(
        'inline-flex items-center',
        spacingClasses[spacing],
        className
      )}
      {...props}
    >
      {visibleChildren.map((child, index) => (
        <div
          key={index}
          className={clsx(
            overlap && index > 0 && `-ml-2 relative z-${maxVisible - index}`
          )}
        >
          {child}
        </div>
      ))}
      
      {/* 剩余数量指示器 */}
      {remainingCount > 0 && (
        <div
          className={clsx(
            'flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-sm font-medium',
            overlap && `-ml-2`
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
});

AvatarGroup.displayName = 'AvatarGroup';

export default Avatar;