// src/components/ui/Button.tsx

import { ReactNode, ButtonHTMLAttributes, forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import { componentVariants } from '@/utils/designSystem';

// 按钮变体类型
export type ButtonVariant = keyof typeof componentVariants.button.variants.variant;

// 按钮大小类型
export type ButtonSize = keyof typeof componentVariants.button.variants.size;

// 按钮形状类型
export type ButtonShape = keyof typeof componentVariants.button.variants.shape;

// 按钮属性接口
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  rippleEffect?: boolean;
  className?: string;
}

// 按钮组件
const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'default',
  size = 'default',
  shape = 'default',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  rippleEffect = true,
  className,
  disabled,
  onClick,
  ...props
}, ref) => {
  const [rippleStyle, setRippleStyle] = useState({ display: 'none', left: '0px', top: '0px', width: '0px', height: '0px' });

  // 处理点击涟漪效果
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (rippleEffect) {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      setRippleStyle({ display: 'block', left: `${x}px`, top: `${y}px`, width: `${size}px`, height: `${size}px` });

      setTimeout(() => {
        setRippleStyle({ display: 'none', left: '0px', top: '0px', width: '0px', height: '0px' });
      }, 600);
    }

    // 调用原始点击事件
    if (onClick) {
      onClick(e);
    }
  };

  // 获取按钮变体样式
  const variantConfig = componentVariants.button.variants.variant[variant];
  const sizeConfig = componentVariants.button.variants.size[size];
  const shapeConfig = componentVariants.button.variants.shape[shape];

  // 构建完整的类名
  const buttonClasses = clsx(
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary relative overflow-hidden',
    variantConfig,
    sizeConfig,
    shapeConfig,
    fullWidth && 'w-full',
    loading && 'opacity-70 cursor-not-allowed',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {/* 涟漪效果元素 */}
      {rippleEffect && (
        <span
          className="absolute rounded-full bg-white/30 pointer-events-none transform scale-0 animate-ripple"
          style={rippleStyle}
        ></span>
      )}

      {/* 加载状态指示器 */}
      {loading && (
        <i className="fas fa-spinner animate-spin mr-2"></i>
      )}

      {/* 图标 */}
      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}

      {/* 按钮文本 */}
      <span>{children}</span>

      {/* 右侧图标 */}
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;