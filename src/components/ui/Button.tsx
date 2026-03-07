// src/components/ui/Button.tsx

import { ReactNode, ButtonHTMLAttributes, forwardRef, useState } from 'react';
import { clsx } from 'clsx';

// 按钮变体类型
export type ButtonVariant = 'default' | 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';

// 按钮大小类型
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

// 按钮形状类型
export type ButtonShape = 'default' | 'rounded' | 'circle';

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

// 变体样式映射
const variantStyles: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'hover:bg-gray-100 text-gray-900',
  link: 'text-blue-600 underline-offset-4 hover:underline',
};

// 大小样式映射
const sizeStyles: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2',
  sm: 'h-8 px-3 text-sm',
  lg: 'h-12 px-6 text-lg',
  icon: 'h-10 w-10 p-2',
};

// 形状样式映射
const shapeStyles: Record<ButtonShape, string> = {
  default: 'rounded-md',
  rounded: 'rounded-lg',
  circle: 'rounded-full',
};

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
  rippleEffect = false,
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
      const rippleSize = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - rippleSize / 2;
      const y = e.clientY - rect.top - rippleSize / 2;

      setRippleStyle({ 
        display: 'block', 
        left: `${x}px`, 
        top: `${y}px`, 
        width: `${rippleSize}px`, 
        height: `${rippleSize}px` 
      });

      setTimeout(() => {
        setRippleStyle({ display: 'none', left: '0px', top: '0px', width: '0px', height: '0px' });
      }, 600);
    }

    if (onClick) {
      onClick(e);
    }
  };

  // 构建完整的类名
  const buttonClasses = clsx(
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 relative overflow-hidden',
    variantStyles[variant],
    sizeStyles[size],
    shapeStyles[shape],
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
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
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

export { Button };
export default Button;
