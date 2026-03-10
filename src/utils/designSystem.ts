/**
 * 设计系统配置
 * 定义统一的设计规范和组件标准
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并Tailwind CSS类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 设计令牌（Design Tokens）
 */
export const designTokens = {
  // 颜色系统
  colors: {
    // 主色调
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    },
    
    // 次要色调
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617'
    },
    
    // 成功色调
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16'
    },
    
    // 警告色调
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03'
    },
    
    // 错误色调
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a'
    },
    
    // 信息色调
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    },
    
    // 品牌色调
    brand: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49'
    },
    
    // 强调色调
    accent: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#ec4899',
      600: '#db2777',
      700: '#be185d',
      800: '#9d174d',
      900: '#831843',
      950: '#500724'
    },
    
    // 中性色调
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712'
    },
    
    // 功能色调
    functional: {
      // 背景色
      background: '#ffffff',
      foreground: '#020617',
      
      // 卡片色
      card: '#ffffff',
      cardForeground: '#020617',
      
      // 弹窗色
      popover: '#ffffff',
      popoverForeground: '#020617',
      
      // 边框色
      border: '#e2e8f0',
      input: '#e2e8f0',
      ring: '#2563eb',
      
      // 文字色
      text: {
        primary: '#020617',
        secondary: '#64748b',
        muted: '#94a3b8',
        inverse: '#ffffff'
      },
      
      // 背景色变体
      bg: {
        primary: '#ffffff',
        secondary: '#f8fafc',
        muted: '#f1f5f9',
        accent: '#f1f5f9'
      }
    },
    
    // 渐变色配置
    gradients: {
      primary: 'from-primary-500 to-primary-700',
      secondary: 'from-secondary-400 to-secondary-600',
      success: 'from-success-400 to-success-600',
      warning: 'from-warning-400 to-warning-600',
      error: 'from-error-400 to-error-600',
      info: 'from-info-400 to-info-600',
      brand: 'from-brand-400 to-brand-600',
      accent: 'from-accent-400 to-accent-600',
      rainbow: 'from-red-500 via-yellow-500 to-green-500',
      sunset: 'from-orange-500 via-red-500 to-purple-500',
      ocean: 'from-blue-500 via-cyan-500 to-teal-500',
      forest: 'from-green-500 via-teal-500 to-cyan-500',
      // 新增渐变效果
      cosmic: 'from-purple-600 via-pink-500 to-orange-400',
      nebulous: 'from-indigo-600 via-blue-500 to-cyan-400',
      fire: 'from-red-500 via-orange-400 to-yellow-300',
      ice: 'from-blue-300 via-cyan-200 to-teal-300',
      gold: 'from-yellow-400 via-amber-500 to-orange-400',
      silver: 'from-gray-300 via-gray-400 to-gray-500',
      bronze: 'from-amber-600 via-orange-500 to-red-400',
      // 微妙渐变
      subtlePrimary: 'from-primary-50 to-primary-100',
      subtleSecondary: 'from-secondary-50 to-secondary-100',
      subtleAccent: 'from-accent-50 to-accent-100',
      // 深色模式渐变
      darkPrimary: 'from-primary-600 to-primary-800',
      darkAccent: 'from-accent-600 to-accent-800',
      darkGradient: 'from-secondary-900 to-secondary-950'
    }
  },
  
  // 字体系统
  typography: {
    // 字体族
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
      serif: ['ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace']
    },
    
    // 字体大小
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }]
    },
    
    // 字体权重
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900'
    },
    
    // 字间距
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em'
    },
    
    // 行高
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2'
    }
  },
  
  // 间距系统
  spacing: {
    // 基础间距（4px为基准）
    0: '0px',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
    32: '8rem',    // 128px
    40: '10rem',   // 160px
    48: '12rem',   // 192px
    56: '14rem',   // 224px
    64: '16rem',   // 256px
    
    // 负数间距
    '-1': '-0.25rem',
    '-2': '-0.5rem',
    '-3': '-0.75rem',
    '-4': '-1rem',
    '-5': '-1.25rem',
    '-6': '-1.5rem',
    '-8': '-2rem',
    '-10': '-2.5rem',
    '-12': '-3rem'
  },
  
  // 圆角系统
  borderRadius: {
    none: '0px',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    '4xl': '2rem',    // 32px
    full: '9999px'
  },
  
  // 阴影系统
  shadows: {
    // 基础阴影
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
    
    // 增强阴影
    elevated: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
    card: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
    dropdown: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
    modal: '0 25px 50px -12px rgb(0 0 0 / 0.25), 0 10px 10px -5px rgb(0 0 0 / 0.04)'
  },
  
  // 动画系统
  animations: {
    // 过渡时间
    duration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms'
    },
    
    // 缓动函数
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      
      // 弹性缓动
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      
      // 其他缓动
      easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
      easeOutQuart: 'cubic-bezier(0.165, 0.84, 0.44, 1)'
    },
    
    // 动画关键帧
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' }
      },
      fadeOut: {
        '0%': { opacity: '1' },
        '100%': { opacity: '0' }
      },
      slideIn: {
        '0%': { transform: 'translateY(10px)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' }
      },
      slideOut: {
        '0%': { transform: 'translateY(0)', opacity: '1' },
        '100%': { transform: 'translateY(10px)', opacity: '0' }
      },
      scaleIn: {
        '0%': { transform: 'scale(0.95)', opacity: '0' },
        '100%': { transform: 'scale(1)', opacity: '1' }
      },
      scaleOut: {
        '0%': { transform: 'scale(1)', opacity: '1' },
        '100%': { transform: 'scale(0.95)', opacity: '0' }
      },
      slideInLeft: {
        '0%': { transform: 'translateX(-10px)', opacity: '0' },
        '100%': { transform: 'translateX(0)', opacity: '1' }
      },
      slideInRight: {
        '0%': { transform: 'translateX(10px)', opacity: '0' },
        '100%': { transform: 'translateX(0)', opacity: '1' }
      },
      slideOutLeft: {
        '0%': { transform: 'translateX(0)', opacity: '1' },
        '100%': { transform: 'translateX(-10px)', opacity: '0' }
      },
      slideOutRight: {
        '0%': { transform: 'translateX(0)', opacity: '1' },
        '100%': { transform: 'translateX(10px)', opacity: '0' }
      },
      pulse: {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.5' }
      },
      bounceIn: {
        '0%': { transform: 'scale(0.3)', opacity: '0' },
        '50%': { transform: 'scale(1.05)', opacity: '1' },
        '70%': { transform: 'scale(0.9)', opacity: '1' },
        '100%': { transform: 'scale(1)', opacity: '1' }
      },
      bounceOut: {
        '0%': { transform: 'scale(1)', opacity: '1' },
        '25%': { transform: 'scale(0.95)', opacity: '1' },
        '50%': { transform: 'scale(1.1)', opacity: '0' },
        '100%': { transform: 'scale(0.3)', opacity: '0' }
      },
      // 新增动画关键帧
      // 淡入缩放
      fadeInScale: {
        '0%': { opacity: '0', transform: 'scale(0.98)' },
        '100%': { opacity: '1', transform: 'scale(1)' }
      },
      fadeOutScale: {
        '0%': { opacity: '1', transform: 'scale(1)' },
        '100%': { opacity: '0', transform: 'scale(0.98)' }
      },
      // 弹跳效果
      bounceUp: {
        '0%': { transform: 'translateY(0)' },
        '25%': { transform: 'translateY(-10px)' },
        '50%': { transform: 'translateY(0)' },
        '75%': { transform: 'translateY(-5px)' },
        '100%': { transform: 'translateY(0)' }
      },
      bounceDown: {
        '0%': { transform: 'translateY(0)' },
        '25%': { transform: 'translateY(10px)' },
        '50%': { transform: 'translateY(0)' },
        '75%': { transform: 'translateY(5px)' },
        '100%': { transform: 'translateY(0)' }
      },
      // 摇摆效果
      shake: {
        '0%, 100%': { transform: 'translateX(0)' },
        '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
        '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' }
      },
      // 旋转效果
      spinSlow: {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' }
      },
      // 呼吸效果
      breathe: {
        '0%, 100%': { transform: 'scale(1)', opacity: '1' },
        '50%': { transform: 'scale(1.05)', opacity: '0.8' }
      },
      // 闪光效果
      shimmer: {
        '0%': { backgroundPosition: '-1000px 0' },
        '100%': { backgroundPosition: '1000px 0' }
      },
      // 波浪效果
      wave: {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-10px)' }
      },
      // 翻转动画
      flipIn: {
        '0%': { transform: 'perspective(400px) rotateX(90deg)', opacity: '0' },
        '100%': { transform: 'perspective(400px) rotateX(0)', opacity: '1' }
      },
      flipOut: {
        '0%': { transform: 'perspective(400px) rotateX(0)', opacity: '1' },
        '100%': { transform: 'perspective(400px) rotateX(90deg)', opacity: '0' }
      }
    }
  },
  
  // 断点系统
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  
  // z-index系统
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800
  },
  
  // 尺寸系统
  sizes: {
    // 容器宽度
    container: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    },
    
    // 组件高度
    height: {
      button: {
        sm: '2.25rem',   // 36px
        default: '2.5rem', // 40px
        lg: '2.75rem'    // 44px
      },
      input: {
        sm: '2rem',      // 32px
        default: '2.5rem', // 40px
        lg: '2.75rem'    // 44px
      }
    },
    
    // 组件宽度
    width: {
      sidebar: {
        collapsed: '72px',
        default: '180px',
        expanded: '320px'
      },
      header: {
        height: '4rem'  // 64px
      }
    }
  }
};

/**
 * 主题配置
 */
export const themes = {
  light: {
    background: '#ffffff',
    foreground: '#020617',
    card: '#ffffff',
    cardForeground: '#020617',
    popover: '#ffffff',
    popoverForeground: '#020617',
    primary: '#2563eb',
    primaryForeground: '#ffffff',
    secondary: '#f1f5f9',
    secondaryForeground: '#0f172a',
    muted: '#f8fafc',
    mutedForeground: '#64748b',
    accent: '#f1f5f9',
    accentForeground: '#0f172a',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#e2e8f0',
    input: '#e2e8f0',
    ring: '#2563eb'
  },
  
  dark: {
    background: '#020617',
    foreground: '#ffffff',
    card: '#0f172a',
    cardForeground: '#ffffff',
    popover: '#1e293b',
    popoverForeground: '#ffffff',
    primary: '#3b82f6',
    primaryForeground: '#ffffff',
    secondary: '#1e293b',
    secondaryForeground: '#f8fafc',
    muted: '#334155',
    mutedForeground: '#94a3b8',
    accent: '#475569',
    accentForeground: '#f8fafc',
    destructive: '#7f1d1d',
    destructiveForeground: '#ffffff',
    border: '#334155',
    input: '#334155',
    ring: '#3b82f6'
  },
  
  blue: {
    background: '#f0f9ff',
    foreground: '#0c4a6e',
    card: '#ffffff',
    cardForeground: '#0c4a6e',
    popover: '#ffffff',
    popoverForeground: '#0c4a6e',
    primary: '#0ea5e9',
    primaryForeground: '#ffffff',
    secondary: '#e0f2fe',
    secondaryForeground: '#0c4a6e',
    muted: '#f0f9ff',
    mutedForeground: '#075985',
    accent: '#bae6fd',
    accentForeground: '#0c4a6e',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#bae6fd',
    input: '#bae6fd',
    ring: '#0ea5e9'
  },
  
  green: {
    background: '#f0fdf4',
    foreground: '#14532d',
    card: '#ffffff',
    cardForeground: '#14532d',
    popover: '#ffffff',
    popoverForeground: '#14532d',
    primary: '#22c55e',
    primaryForeground: '#ffffff',
    secondary: '#dcfce7',
    secondaryForeground: '#14532d',
    muted: '#f0fdf4',
    mutedForeground: '#166534',
    accent: '#bbf7d0',
    accentForeground: '#14532d',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#bbf7d0',
    input: '#bbf7d0',
    ring: '#22c55e'
  },
  
  pixel: {
    background: '#121212',
    foreground: '#ffffff',
    card: '#1e1e1e',
    cardForeground: '#ffffff',
    popover: '#2d2d2d',
    popoverForeground: '#ffffff',
    primary: '#ff3e3e',
    primaryForeground: '#ffffff',
    secondary: '#2d2d2d',
    secondaryForeground: '#ffffff',
    muted: '#3d3d3d',
    mutedForeground: '#cccccc',
    accent: '#ff6b35',
    accentForeground: '#ffffff',
    destructive: '#ff3e3e',
    destructiveForeground: '#ffffff',
    border: '#3d3d3d',
    input: '#3d3d3d',
    ring: '#ff3e3e'
  }
};

/**
 * 组件变体配置
 */
export const componentVariants = {
  // 按钮变体
  button: {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        accent: 'bg-accent text-accent-foreground hover:bg-accent/90',
        gradient: 'bg-gradient-to-r from-primary to-brand text-white hover:from-primary/90 hover:to-brand/90',
        ghostGradient: 'border border-primary/20 text-primary hover:bg-primary/10',
        success: 'bg-success text-success-foreground hover:bg-success/90',
        warning: 'bg-warning text-warning-foreground hover:bg-warning/90'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        xl: 'h-12 rounded-md px-10',
        '2xl': 'h-14 rounded-md px-12',
        icon: 'h-10 w-10',
        iconSm: 'h-8 w-8',
        iconLg: 'h-12 w-12'
      },
      shape: {
        default: 'rounded-md',
        full: 'rounded-full',
        square: 'rounded-none',
        pill: 'rounded-full',
        circle: 'rounded-full aspect-square'
      }
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shape: 'default'
    }
  },
  
  // 卡片变体
  card: {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        outline: 'border border-border bg-card text-card-foreground',
        ghost: 'bg-transparent text-foreground',
        elevated: 'bg-card text-card-foreground shadow-lg hover:shadow-xl',
        gradient: 'bg-gradient-to-br from-card to-card/95 text-card-foreground',
        bordered: 'border border-border bg-card text-card-foreground',
        glass: 'bg-white/80 backdrop-blur-md border border-white/20 shadow-lg',
        darkGlass: 'bg-card/80 backdrop-blur-md border border-border/50 shadow-lg'
      },
      size: {
        default: 'rounded-lg',
        sm: 'rounded-md',
        lg: 'rounded-xl',
          xl: 'rounded-2xl',
          '2xl': 'rounded-3xl',
          none: 'rounded-none',
          pill: 'rounded-full',
        circle: 'rounded-full'
      },
      shadow: {
        default: 'shadow-sm',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
          xl: 'shadow-xl',
          '2xl': 'shadow-2xl',
          none: 'shadow-none',
          elevated: 'shadow-lg hover:shadow-xl',
        floating: 'shadow-md hover:shadow-lg transform hover:-translate-y-1'
      }
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shadow: 'default'
    }
  },
  
  // 输入框变体
  input: {
    variants: {
      variant: {
        default: 'border border-input bg-background',
        outline: 'border border-input bg-background',
        filled: 'bg-muted border-transparent',
        flushed: 'border-b border-input bg-transparent rounded-none',
        glass: 'bg-white/80 backdrop-blur-md border border-white/20',
        darkGlass: 'bg-card/80 backdrop-blur-md border border-border/50',
        error: 'border-destructive bg-background',
        success: 'border-success bg-background',
        warning: 'border-warning bg-background',
        disabled: 'border-input bg-muted opacity-70',
        focused: 'border-ring bg-background ring-2 ring-ring/20'
      },
      size: {
        default: 'h-10 px-3',
        sm: 'h-8 px-2',
        lg: 'h-12 px-4',
        xl: 'h-14 px-5',
        xs: 'h-7 px-2',
        textarea: 'min-h-[80px] px-3 py-2',
        textareaSm: 'min-h-[60px] px-2 py-1',
        textareaLg: 'min-h-[120px] px-4 py-3'
      },
      shape: {
        default: 'rounded-md',
        sm: 'rounded-sm',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        full: 'rounded-full',
        none: 'rounded-none'
      }
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shape: 'default'
    }
  },
  
  // 徽章变体
  badge: {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'border border-border text-foreground',
        accent: 'bg-accent text-accent-foreground',
        success: 'bg-success text-success-foreground',
        warning: 'bg-warning text-warning-foreground',
        info: 'bg-info text-info-foreground',
        brand: 'bg-brand text-brand-foreground',
        gradient: 'bg-gradient-to-r from-primary to-brand text-white',
        outlineGradient: 'border border-primary/20 text-primary',
        ghost: 'bg-transparent text-foreground hover:bg-accent',
        pill: 'bg-primary text-primary-foreground rounded-full',
        dot: 'bg-primary text-primary-foreground rounded-full w-2 h-2'
      },
      size: {
        default: 'text-xs px-2.5 py-0.5',
        sm: 'text-[10px] px-1.5 py-0',
        lg: 'text-sm px-3 py-1',
        xl: 'text-base px-4 py-1.5',
        xs: 'text-[9px] px-1 py-0',
        dot: 'w-2 h-2',
        dotSm: 'w-1.5 h-1.5',
        dotLg: 'w-3 h-3'
      },
      shape: {
        default: 'rounded-md',
        full: 'rounded-full',
        square: 'rounded-none',
        pill: 'rounded-full',
        circle: 'rounded-full aspect-square'
      }
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shape: 'default'
    }
  },
  
  // 头像变体
  avatar: {
    variants: {
      size: {
        sm: 'h-8 w-8',
        default: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16'
      },
      variant: {
        default: 'rounded-full',
        square: 'rounded-md',
        none: 'rounded-none'
      }
    },
    
    defaultVariants: {
      size: 'default',
      variant: 'default'
    }
  },
  
  // 分隔符变体
  separator: {
    variants: {
      orientation: {
        horizontal: 'h-[1px] w-full',
        vertical: 'h-full w-[1px]'
      },
      variant: {
        default: 'bg-border',
        light: 'bg-border/50',
        heavy: 'bg-border/80'
      }
    },
    
    defaultVariants: {
      orientation: 'horizontal',
      variant: 'default'
    }
  },
  
  // 骨架屏变体
  skeleton: {
    variants: {
      variant: {
        default: 'bg-muted',
        pulse: 'bg-muted animate-pulse',
        shimmer: 'bg-gradient-to-r from-muted via-muted/80 to-muted animate-shimmer'
      },
      shape: {
        rect: 'rounded',
        circle: 'rounded-full',
        text: 'h-4 w-full rounded'
      }
    },
    
    defaultVariants: {
      variant: 'default',
      shape: 'rect'
    }
  },
  
  // 工具提示变体
  tooltip: {
    variants: {
      placement: {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
      },
      size: {
        default: 'px-3 py-2 text-sm',
        sm: 'px-2 py-1 text-xs',
        lg: 'px-4 py-2 text-base'
      }
    },
    
    defaultVariants: {
      placement: 'top',
      size: 'default'
    }
  },
  
  // 新增：标签变体
  tag: {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        accent: 'bg-accent text-accent-foreground',
        success: 'bg-success text-success-foreground',
        warning: 'bg-warning text-warning-foreground',
        error: 'bg-error text-error-foreground',
        info: 'bg-info text-info-foreground',
        outline: 'border border-border text-foreground',
        ghost: 'bg-transparent text-foreground hover:bg-accent',
        gradient: 'bg-gradient-to-r from-primary to-brand text-white'
      },
      size: {
        default: 'text-xs px-3 py-1',
        sm: 'text-xs px-2 py-0.5',
        lg: 'text-sm px-4 py-1.5',
        xl: 'text-base px-5 py-2'
      },
      shape: {
        default: 'rounded-full',
        sm: 'rounded-md',
        lg: 'rounded-full',
        pill: 'rounded-full',
        square: 'rounded-none'
      }
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shape: 'default'
    }
  },
  
  // 新增：进度条变体
  progress: {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-secondary',
        success: 'bg-success',
        warning: 'bg-warning',
        error: 'bg-error',
        info: 'bg-info',
        accent: 'bg-accent',
        gradient: 'bg-gradient-to-r from-primary to-brand',
        striped: 'bg-primary bg-stripes',
        animated: 'bg-primary bg-stripes animate-stripes'
      },
      size: {
        default: 'h-2',
        sm: 'h-1.5',
        lg: 'h-3',
        xl: 'h-4',
        xs: 'h-1'
      },
      shape: {
        default: 'rounded-full',
        sm: 'rounded-md',
        lg: 'rounded-full',
        square: 'rounded-none'
      }
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shape: 'default'
    }
  },
  
  // 新增：开关变体
  switch: {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-secondary',
        success: 'bg-success',
        warning: 'bg-warning',
        error: 'bg-error',
        info: 'bg-info',
        accent: 'bg-accent',
        gradient: 'bg-gradient-to-r from-primary to-brand'
      },
      size: {
        default: 'w-12 h-6',
        sm: 'w-10 h-5',
        lg: 'w-14 h-7',
        xl: 'w-16 h-8'
      }
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  },
  
  // 新增：滑块变体
  slider: {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-secondary',
        success: 'bg-success',
        warning: 'bg-warning',
        error: 'bg-error',
        info: 'bg-info',
        accent: 'bg-accent',
        gradient: 'bg-gradient-to-r from-primary to-brand'
      },
      size: {
        default: 'h-2',
        sm: 'h-1.5',
        lg: 'h-3',
        xl: 'h-4'
      }
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
};

/**
 * 响应式工具函数
 */
export const responsiveUtils = {
  /**
   * 生成响应式类名
   */
  createResponsiveClass: (baseClass: string, breakpoints: Record<string, string>) => {
    const classes = [baseClass];
    
    Object.entries(breakpoints).forEach(([breakpoint, modifier]) => {
      if (breakpoint === 'default') {
        classes.push(`${baseClass}-${modifier}`);
      } else {
        classes.push(`${breakpoint}:${baseClass}-${modifier}`);
      }
    });
    
    return classes.join(' ');
  },
  
  /**
   * 生成响应式网格类名
   */
  createGridClasses: (columns: Record<string, number>, gap?: Record<string, number>) => {
    const classes: string[] = [];
    
    Object.entries(columns).forEach(([breakpoint, cols]) => {
      const prefix = breakpoint === 'default' ? '' : `${breakpoint}:`;
      classes.push(`${prefix}grid-cols-${cols}`);
    });
    
    if (gap) {
      Object.entries(gap).forEach(([breakpoint, gapSize]) => {
        const prefix = breakpoint === 'default' ? '' : `${breakpoint}:`;
        classes.push(`${prefix}gap-${gapSize}`);
      });
    }
    
    return classes.join(' ');
  },
  
  /**
   * 生成响应式间距类名
   */
  createSpacingClasses: (spacing: Record<string, Record<string, number>>) => {
    const classes: string[] = [];
    
    Object.entries(spacing).forEach(([breakpoint, properties]) => {
      const prefix = breakpoint === 'default' ? '' : `${breakpoint}:`;
      
      Object.entries(properties).forEach(([property, value]) => {
        classes.push(`${prefix}${property}-${value}`);
      });
    });
    
    return classes.join(' ');
  }
};

/**
 * 无障碍工具函数
 */
export const a11yUtils = {
  /**
   * 生成屏幕阅读器文本
   */
  createScreenReaderText: (text: string) => {
    return `sr-only ${text}`;
  },
  
  /**
   * 生成焦点管理类名
   */
  createFocusClasses: (type: 'default' | 'ring' | 'outline' = 'default') => {
    switch (type) {
      case 'ring':
        return 'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
      case 'outline':
        return 'focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
      default:
        return 'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
    }
  },
  
  /**
   * 生成ARIA属性
   */
  createAriaAttributes: (attributes: Record<string, string | boolean | undefined>) => {
    return Object.entries(attributes)
      .filter(([_, value]) => value !== undefined && value !== false)
      .reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>);
  }
};

/**
 * 动画工具函数
 */
export const animationUtils = {
  /**
   * 生成过渡类名
   */
  createTransitionClasses: (
    properties: string[] = ['all'],
    duration: string = 'duration-200',
    easing: string = 'ease-in-out'
  ) => {
    return [
      `transition-${properties.join('-')}`,
      duration,
      easing
    ].join(' ');
  },
  
  /**
   * 生成动画类名
   */
  createAnimationClasses: (
    animation: string,
    duration?: string,
    delay?: string,
    iteration?: string
  ) => {
    const classes = [animation];
    
    if (duration) classes.push(duration);
    if (delay) classes.push(delay);
    if (iteration) classes.push(iteration);
    
    return classes.join(' ');
  },
  
  /**
   * 生成加载动画类名
   */
  createLoadingClasses: (type: 'spinner' | 'pulse' | 'dots' = 'spinner') => {
    switch (type) {
      case 'spinner':
        return 'animate-spin';
      case 'pulse':
        return 'animate-pulse';
      case 'dots':
        return 'animate-bounce';
      default:
        return 'animate-spin';
    }
  }
};

export default {
  cn,
  designTokens,
  themes,
  componentVariants,
  responsiveUtils,
  a11yUtils,
  animationUtils
};
