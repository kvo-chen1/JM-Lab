// src/components/ui/Input.tsx

import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { clsx } from 'clsx';
import { componentVariants } from '@/utils/designSystem';

// 输入框变体类型
export type InputVariant = keyof typeof componentVariants.input.variants.variant;

// 输入框大小类型
export type InputSize = keyof typeof componentVariants.input.variants.size;

// 输入框形状类型
export type InputShape = keyof typeof componentVariants.input.variants.shape;

// 输入框属性接口
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  variant?: InputVariant;
  size?: InputSize;
  shape?: InputShape;
  containerClassName?: string;
  className?: string;
}

// 输入框组件
const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  icon,
  variant = 'default',
  size = 'default',
  shape = 'default',
  containerClassName,
  className,
  type,
  ...props
}, ref) => {
  // 获取输入框变体样式
  const variantConfig = componentVariants.input.variants.variant[variant];
  const sizeConfig = componentVariants.input.variants.size[size];
  const shapeConfig = componentVariants.input.variants.shape[shape];

  return (
    <div className={clsx('space-y-2', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={clsx(
            'w-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
            variantConfig,
            sizeConfig,
            shapeConfig,
            icon && 'pl-10',
            error && 'border-destructive focus:ring-destructive',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;