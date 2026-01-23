// src/config/themeConfig.ts

// 主题类型定义
export type Theme = 'light' | 'blue' | 'green';

// 主题配置项接口
interface ThemeConfig {
  value: Theme;
  label: string;
  icon: string;
}

// 主题配置列表
export const themeConfig: ThemeConfig[] = [
  { value: 'light', label: '浅色', icon: 'fas fa-sun' },
  { value: 'blue', label: '蓝色', icon: 'fas fa-water' },
  { value: 'green', label: '绿色', icon: 'fas fa-leaf' }
];

// 主题色彩增强配置
export const themeEnhancements = {
  // 色彩对比度增强
  contrast: {
    light: 1.2,
    blue: 1.15,
    green: 1.15
  },
  // 色彩饱和度优化
  saturation: {
    light: 1.05,
    blue: 1.1,
    green: 1.1
  }
};

// 默认主题配置
export const defaultTheme: Theme = 'light';

// 主题切换顺序
export const themeOrder: Theme[] = ['light', 'blue', 'green'];

// 检测系统主题偏好
export const getSystemTheme = (): 'light' | 'dark' => {
  // 检查是否在浏览器环境中
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) {
    return 'light'; // 默认返回浅色主题
  }
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// 获取实际应用的主题
export const getAppliedTheme = (theme: Theme): 'light' | 'blue' | 'green' => {
  return theme;
};

// 保存主题到localStorage
export const saveThemeToLocalStorage = (theme: Theme): void => {
  // 检查是否在浏览器环境中
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) {
    return;
  }
  
  localStorage.setItem('theme', theme);
};

// 从localStorage读取主题
export const getThemeFromLocalStorage = (): Theme | null => {
  // 检查是否在浏览器环境中
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) {
    return null;
  }
  
  const savedTheme = localStorage.getItem('theme') as Theme | null;
  return savedTheme;
};

// 初始化主题
export const initializeTheme = (): Theme => {
  // 检查是否在浏览器环境中
  const isBrowser = typeof window !== 'undefined';
  
  if (isBrowser) {
    const savedTheme = getThemeFromLocalStorage();
    if (savedTheme) {
      return savedTheme;
    }
    // 服务器端和客户端初始主题必须完全一致，避免hydration错误
    // 移除设备类型检测，始终返回defaultTheme作为初始值
    // 后续可以通过用户交互或系统偏好设置更改主题
    return defaultTheme;
  }
  
  // 服务器端渲染时返回默认主题
  return defaultTheme;
};