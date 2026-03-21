/**
 * Agent UI 主题系统
 * 定义全局颜色、阴影、圆角、间距等设计变量
 */

// 主色调
export const colors = {
  primary: {
    DEFAULT: '#C02C38',
    light: '#E85D75',
    dark: '#9A1F2A',
    gradient: 'linear-gradient(135deg, #C02C38 0%, #E85D75 100%)',
    glow: 'rgba(192, 44, 56, 0.3)',
  },
  secondary: {
    DEFAULT: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
  },
  accent: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
};

// 深色模式颜色
export const darkTheme = {
  background: {
    primary: '#0A0A0F',
    secondary: '#111118',
    tertiary: '#15151A',
    elevated: '#1A1A22',
  },
  surface: {
    DEFAULT: '#1E1E28',
    hover: '#252532',
    active: '#2A2A3A',
  },
  border: {
    DEFAULT: 'rgba(255, 255, 255, 0.06)',
    hover: 'rgba(255, 255, 255, 0.1)',
    active: 'rgba(255, 255, 255, 0.15)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
    disabled: 'rgba(255, 255, 255, 0.3)',
  },
};

// 浅色模式颜色
export const lightTheme = {
  background: {
    primary: '#FAFAFA',
    secondary: '#F5F5F7',
    tertiary: '#FFFFFF',
    elevated: '#FFFFFF',
  },
  surface: {
    DEFAULT: '#FFFFFF',
    hover: '#F8F8FA',
    active: '#F0F0F5',
  },
  border: {
    DEFAULT: 'rgba(0, 0, 0, 0.06)',
    hover: 'rgba(0, 0, 0, 0.1)',
    active: 'rgba(0, 0, 0, 0.15)',
  },
  text: {
    primary: '#111111',
    secondary: 'rgba(0, 0, 0, 0.65)',
    tertiary: 'rgba(0, 0, 0, 0.45)',
    disabled: 'rgba(0, 0, 0, 0.25)',
  },
};

// 阴影系统
export const shadows = {
  sm: '0 2px 8px rgba(0, 0, 0, 0.08)',
  md: '0 4px 16px rgba(0, 0, 0, 0.12)',
  lg: '0 8px 32px rgba(0, 0, 0, 0.16)',
  xl: '0 12px 48px rgba(0, 0, 0, 0.2)',
  glow: {
    primary: '0 0 20px rgba(192, 44, 56, 0.4)',
    primarySm: '0 0 12px rgba(192, 44, 56, 0.3)',
    primaryLg: '0 0 32px rgba(192, 44, 56, 0.5)',
  },
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
};

// 圆角系统
export const radius = {
  none: '0',
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '18px',
  '2xl': '24px',
  full: '9999px',
};

// 间距系统
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
};

// 字体系统
export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", "Fira Code", "JetBrains Mono", monospace',
  },
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
};

// 动画缓动函数
export const easings = {
  default: [0.4, 0, 0.2, 1],
  in: [0.4, 0, 1, 1],
  out: [0, 0, 0.2, 1],
  inOut: [0.4, 0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  smooth: [0.25, 0.1, 0.25, 1],
};

// 动画时长
export const durations = {
  fast: '150ms',
  normal: '250ms',
  slow: '350ms',
  slower: '500ms',
};

// z-index 层级
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modal: 400,
  popover: 500,
  tooltip: 600,
  toast: 700,
};

// 过渡效果
export const transitions = {
  default: `all ${durations.normal} cubic-bezier(${easings.default.join(',')})`,
  fast: `all ${durations.fast} cubic-bezier(${easings.default.join(',')})`,
  slow: `all ${durations.slow} cubic-bezier(${easings.default.join(',')})`,
  colors: `color, background-color, border-color ${durations.normal} cubic-bezier(${easings.default.join(',')})`,
  transform: `transform ${durations.normal} cubic-bezier(${easings.default.join(',')})`,
  opacity: `opacity ${durations.normal} cubic-bezier(${easings.default.join(',')})`,
};

// 获取主题CSS变量
export function getThemeCSSVariables(isDark: boolean): Record<string, string> {
  const theme = isDark ? darkTheme : lightTheme;
  
  return {
    // 背景
    '--bg-primary': theme.background.primary,
    '--bg-secondary': theme.background.secondary,
    '--bg-tertiary': theme.background.tertiary,
    '--bg-elevated': theme.background.elevated,
    
    // 表面
    '--surface-default': theme.surface.DEFAULT,
    '--surface-hover': theme.surface.hover,
    '--surface-active': theme.surface.active,
    
    // 边框
    '--border-default': theme.border.DEFAULT,
    '--border-hover': theme.border.hover,
    '--border-active': theme.border.active,
    
    // 文字
    '--text-primary': theme.text.primary,
    '--text-secondary': theme.text.secondary,
    '--text-tertiary': theme.text.tertiary,
    '--text-disabled': theme.text.disabled,
    
    // 主色
    '--primary': colors.primary.DEFAULT,
    '--primary-light': colors.primary.light,
    '--primary-dark': colors.primary.dark,
    '--primary-gradient': colors.primary.gradient,
    '--primary-glow': colors.primary.glow,
    
    // 阴影
    '--shadow-sm': shadows.sm,
    '--shadow-md': shadows.md,
    '--shadow-lg': shadows.lg,
    '--shadow-xl': shadows.xl,
    '--shadow-glow': shadows.glow.primary,
    '--shadow-glow-sm': shadows.glow.primarySm,
    '--shadow-glow-lg': shadows.glow.primaryLg,
    
    // 圆角
    '--radius-sm': radius.sm,
    '--radius-md': radius.md,
    '--radius-lg': radius.lg,
    '--radius-xl': radius.xl,
    '--radius-2xl': radius['2xl'],
    '--radius-full': radius.full,
  };
}

// 导出默认主题配置
export const theme = {
  colors,
  darkTheme,
  lightTheme,
  shadows,
  radius,
  spacing,
  typography,
  easings,
  durations,
  zIndex,
  transitions,
  getThemeCSSVariables,
};

export default theme;
