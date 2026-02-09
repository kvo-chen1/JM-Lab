import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface SettingItemProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function SettingItem({
  icon: Icon,
  title,
  description,
  children,
  className,
  disabled = false
}: SettingItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={clsx(
        'group relative',
        'bg-white dark:bg-[#1a1a1a]',
        'rounded-2xl',
        'border border-gray-200/50 dark:border-gray-800/50',
        'shadow-sm hover:shadow-md',
        'transition-all duration-200',
        'overflow-hidden',
        disabled && 'opacity-60 pointer-events-none',
        className
      )}
    >
      {/* 顶部渐变条装饰 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* 图标容器 */}
          <div className={clsx(
            'flex-shrink-0 w-12 h-12 rounded-xl',
            'bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900',
            'flex items-center justify-center',
            'group-hover:from-blue-50 group-hover:to-purple-50 dark:group-hover:from-blue-900/20 dark:group-hover:to-purple-900/20',
            'transition-all duration-200'
          )}>
            <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          </div>

          {/* 内容区域 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                {description}
              </p>
            )}

            {/* 控制元素容器 */}
            <div className="mt-4">
              {children}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Switch 开关组件
interface SettingSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function SettingSwitch({ checked, onChange, label }: SettingSwitchProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      {label && (
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative inline-flex h-6 w-11 items-center rounded-full',
          'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
          checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={clsx(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </label>
  );
}

// Select 选择器组件
interface SettingSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function SettingSelect({ value, onChange, options }: SettingSelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(
          'w-full appearance-none',
          'px-4 py-2.5 pr-10',
          'bg-gray-50 dark:bg-gray-800/50',
          'border border-gray-200 dark:border-gray-700',
          'rounded-xl',
          'text-sm text-gray-900 dark:text-gray-100',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
          'transition-all duration-200'
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

// Slider 滑块组件
interface SettingSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  showValue?: boolean;
}

export function SettingSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  showValue = true
}: SettingSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>}
          {showValue && (
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {value}px
            </span>
          )}
        </div>
      )}
      <div className="relative h-6 flex items-center">
        <div className="absolute w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-150"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className={clsx(
            'absolute w-full h-full opacity-0 cursor-pointer',
            'focus:outline-none'
          )}
        />
        <motion.div
          className="absolute w-5 h-5 bg-white dark:bg-gray-200 rounded-full shadow-md pointer-events-none"
          style={{ left: `calc(${percentage}% - 10px)` }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        />
      </div>
    </div>
  );
}

// Button 按钮组件
interface SettingButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: LucideIcon;
  fullWidth?: boolean;
  disabled?: boolean;
}

export function SettingButton({
  children,
  onClick,
  variant = 'primary',
  icon: Icon,
  fullWidth = false,
  disabled = false
}: SettingButtonProps) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md',
    secondary: 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100',
    danger: 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
  };

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center gap-2',
        'px-4 py-2.5 rounded-xl',
        'font-medium text-sm',
        'transition-all duration-200',
        fullWidth && 'w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        variants[variant]
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </motion.button>
  );
}

export default SettingItem;
