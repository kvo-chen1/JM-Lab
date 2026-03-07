// src/components/ui/Input.tsx

import React, { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

// 输入框变体类型
export type InputVariant = 'default' | 'filled' | 'outlined' | 'ghost';

// 输入框大小类型
export type InputSize = 'small' | 'medium' | 'large';

// 输入框形状类型
export type InputShape = 'rounded' | 'pill' | 'square';

// 输入框属性接口
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  inputSize?: InputSize;
  shape?: InputShape;
  error?: boolean;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

// 变体样式映射
const variantClasses: Record<InputVariant, string> = {
  default: 'bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
  filled: 'bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-200',
  outlined: 'bg-transparent border-2 border-gray-300 focus:border-blue-500',
  ghost: 'bg-transparent border-0 focus:bg-gray-50'
};

// 大小样式映射
const sizeClasses: Record<InputSize, string> = {
  small: 'px-3 py-1.5 text-sm',
  medium: 'px-4 py-2 text-base',
  large: 'px-5 py-3 text-lg'
};

// 形状样式映射
const shapeClasses: Record<InputShape, string> = {
  rounded: 'rounded-md',
  pill: 'rounded-full',
  square: 'rounded-none'
};

// 输入框组件
const Input = forwardRef<HTMLInputElement, InputProps>(({
  variant = 'default',
  inputSize = 'medium',
  shape = 'rounded',
  error = false,
  errorMessage,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  disabled,
  ...props
}, ref) => {
  const inputClasses = clsx(
    'transition-all duration-200 outline-none',
    variantClasses[variant],
    sizeClasses[inputSize],
    shapeClasses[shape],
    error && 'border-red-500 focus:border-red-500 focus:ring-red-200',
    disabled && 'opacity-50 cursor-not-allowed bg-gray-100',
    fullWidth && 'w-full',
    (leftIcon || rightIcon) && 'flex items-center gap-2',
    className
  );

  return (
    <div className={clsx(fullWidth && 'w-full')}>
      <div className={clsx('relative', fullWidth && 'w-full')}>
        {/* 左侧图标 */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          className={clsx(
            inputClasses,
            leftIcon && 'pl-10',
            rightIcon && 'pr-10'
          )}
          disabled={disabled}
          {...props}
        />
        
        {/* 右侧图标 */}
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {/* 错误信息 */}
      {error && errorMessage && (
        <p className="mt-1 text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export { Input };
export default Input;
