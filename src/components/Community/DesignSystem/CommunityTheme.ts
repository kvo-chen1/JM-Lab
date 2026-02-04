// 津脉社区设计系统 - 主题配置
// 统一色彩、间距、动画等设计变量

export const communityColors = {
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
  },
  // 辅助色
  secondary: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },
  // 成功色
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
  },
  // 警告色
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
  },
  // 错误色
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
  },
  // 中性色
  gray: {
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
    950: '#030712',
  },
  // 天津文化特色色
  tianjin: {
    red: '#c41e3a',      // 天津红
    gold: '#d4af37',     // 传统金
    blue: '#1e3a5f',     // 海河蓝
    jade: '#00a86b',     // 翡翠绿
    paper: '#f5f5dc',    // 宣纸色
  }
};

// 间距系统
export const communitySpacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '2.5rem',  // 40px
  '3xl': '3rem',    // 48px
  '4xl': '4rem',    // 64px
};

// 圆角系统
export const communityRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};

// 阴影系统
export const communityShadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  glow: '0 0 20px rgba(59, 130, 246, 0.5)',
  'glow-lg': '0 0 40px rgba(59, 130, 246, 0.6)',
};

// 动画系统
export const communityAnimations = {
  // 过渡时间
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
  },
  // 缓动函数
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  // 关键帧
  keyframes: {
    fadeIn: {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    fadeInUp: {
      from: { opacity: '0', transform: 'translateY(20px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    fadeInDown: {
      from: { opacity: '0', transform: 'translateY(-20px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    scaleIn: {
      from: { opacity: '0', transform: 'scale(0.95)' },
      to: { opacity: '1', transform: 'scale(1)' },
    },
    slideInRight: {
      from: { opacity: '0', transform: 'translateX(20px)' },
      to: { opacity: '1', transform: 'translateX(0)' },
    },
    pulse: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.5' },
    },
    bounce: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-10px)' },
    },
    shimmer: {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
  },
};

// 字体系统
export const communityTypography = {
  fontFamily: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Z-index 层级系统
export const communityZIndex = {
  hide: -1,
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
  tooltip: 1800,
};

// 断点系统
export const communityBreakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// 生成 CSS 变量
export const generateCSSVariables = (isDark: boolean = false) => {
  const colors = isDark ? {
    background: communityColors.gray[900],
    surface: communityColors.gray[800],
    surfaceElevated: communityColors.gray[700],
    text: communityColors.gray[100],
    textSecondary: communityColors.gray[400],
    textMuted: communityColors.gray[500],
    border: communityColors.gray[700],
    borderHover: communityColors.gray[600],
  } : {
    background: communityColors.gray[50],
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    text: communityColors.gray[900],
    textSecondary: communityColors.gray[600],
    textMuted: communityColors.gray[400],
    border: communityColors.gray[200],
    borderHover: communityColors.gray[300],
  };

  return {
    '--jm-primary-50': communityColors.primary[50],
    '--jm-primary-100': communityColors.primary[100],
    '--jm-primary-500': communityColors.primary[500],
    '--jm-primary-600': communityColors.primary[600],
    '--jm-primary-700': communityColors.primary[700],
    '--jm-success-500': communityColors.success[500],
    '--jm-warning-500': communityColors.warning[500],
    '--jm-error-500': communityColors.error[500],
    '--jm-background': colors.background,
    '--jm-surface': colors.surface,
    '--jm-surface-elevated': colors.surfaceElevated,
    '--jm-text': colors.text,
    '--jm-text-secondary': colors.textSecondary,
    '--jm-text-muted': colors.textMuted,
    '--jm-border': colors.border,
    '--jm-border-hover': colors.borderHover,
    '--jm-tianjin-red': communityColors.tianjin.red,
    '--jm-tianjin-gold': communityColors.tianjin.gold,
    '--jm-tianjin-blue': communityColors.tianjin.blue,
    '--jm-radius-sm': communityRadius.sm,
    '--jm-radius-md': communityRadius.md,
    '--jm-radius-lg': communityRadius.lg,
    '--jm-radius-xl': communityRadius.xl,
    '--jm-shadow-sm': communityShadows.sm,
    '--jm-shadow-md': communityShadows.md,
    '--jm-shadow-lg': communityShadows.lg,
  } as React.CSSProperties;
};

// 社群主题生成器
export const generateCommunityTheme = (primaryColor?: string) => {
  const baseColor = primaryColor || communityColors.primary[500];
  
  return {
    primaryColor: baseColor,
    secondaryColor: communityColors.secondary[500],
    backgroundColor: communityColors.gray[50],
    textColor: communityColors.gray[900],
    accentColor: communityColors.tianjin.gold,
  };
};

export default {
  colors: communityColors,
  spacing: communitySpacing,
  radius: communityRadius,
  shadows: communityShadows,
  animations: communityAnimations,
  typography: communityTypography,
  zIndex: communityZIndex,
  breakpoints: communityBreakpoints,
  generateCSSVariables,
  generateCommunityTheme,
};
