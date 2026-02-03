// 确保 React 核心模块正确加载
import React, { useState, useEffect, createContext, ReactNode, useContext, useMemo, useCallback } from 'react';
import {
  Theme,
  themeConfig,
  defaultTheme,
  themeOrder,
  getAppliedTheme,
  initializeTheme,
  saveThemeToLocalStorage
} from '@/config/themeConfig';

// 自定义主题接口
interface CustomTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    border: string;
    input: string;
    ring: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
      inverse: string;
    };
  };
}

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  availableThemes: typeof themeConfig;
  previewTheme: (theme: Theme) => void;
  resetPreview: () => void;
  createCustomTheme: (customTheme: CustomTheme) => void;
  customThemes: CustomTheme[];
  exportThemeConfig: () => string;
  importThemeConfig: (config: string) => boolean;
  recommendedThemes: Theme[];
}

// 创建 ThemeContext
export const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
  availableThemes: themeConfig,
  previewTheme: () => {},
  resetPreview: () => {},
  createCustomTheme: () => {},
  customThemes: [],
  exportThemeConfig: () => '',
  importThemeConfig: () => false,
  recommendedThemes: ['light', 'dark', 'system']
});

interface ThemeProviderProps {
  children: ReactNode;
}

// 创建 ThemeProvider 组件
export function ThemeProvider({ children }: ThemeProviderProps) {
  // 服务器端和客户端初始状态必须完全一致，避免hydration错误
  // 初始状态始终使用defaultTheme，在客户端挂载后再更新
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [previewingTheme, setPreviewingTheme] = useState<Theme | null>(null);
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);

  // 在客户端挂载后，从localStorage读取并更新主题
  useEffect(() => {
    const savedTheme = initializeTheme();
    if (savedTheme !== theme) {
      setTheme(savedTheme);
    }

    // 加载自定义主题
    const savedCustomThemes = localStorage.getItem('customThemes');
    if (savedCustomThemes) {
      try {
        setCustomThemes(JSON.parse(savedCustomThemes));
      } catch (error) {
        console.error('Failed to load custom themes:', error);
      }
    }
  }, []);

  // 更新主题类到DOM
  const updateThemeClass = useCallback((targetTheme: Theme = theme) => {
    // 只在浏览器环境中执行DOM操作
    if (typeof document !== 'undefined') {
      const appliedTheme = getAppliedTheme(previewingTheme || targetTheme);
      
      // 添加过渡效果类
      document.documentElement.classList.add('transition-colors', 'duration-300', 'ease-in-out');
      
      // 清除所有主题类
      const allThemes = themeConfig.map(config => config.value);
      document.documentElement.classList.remove(...allThemes);
      
      // 添加当前主题类（浅色主题不需要添加类，使用默认样式）
      if (appliedTheme !== 'light') {
        document.documentElement.classList.add(appliedTheme);
      }
      
      // 300ms后移除过渡效果类，避免影响其他动画
      setTimeout(() => {
        document.documentElement.classList.remove('transition-colors', 'duration-300', 'ease-in-out');
      }, 300);
    }
  }, [theme, previewingTheme]);

  // 主题变化时更新类名和localStorage
  useEffect(() => {
    // 避免在服务器端渲染时执行
    if (typeof window === 'undefined') return;
    
    // 使用requestAnimationFrame优化DOM更新，减少卡顿
    const frameId = requestAnimationFrame(() => {
      updateThemeClass();
      if (!previewingTheme) {
        saveThemeToLocalStorage(theme);
      }
    });
    
    return () => cancelAnimationFrame(frameId);
  }, [theme, previewingTheme, updateThemeClass]);

  // 优化toggleTheme函数，使用主题顺序数组
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const currentIndex = themeOrder.indexOf(prevTheme);
      return themeOrder[(currentIndex + 1) % themeOrder.length];
    });
  }, []);

  // 主题预览功能
  const previewTheme = useCallback((previewTheme: Theme) => {
    setPreviewingTheme(previewTheme);
  }, []);

  // 重置预览
  const resetPreview = useCallback(() => {
    setPreviewingTheme(null);
  }, []);

  // 创建自定义主题
  const createCustomTheme = useCallback((customTheme: CustomTheme) => {
    setCustomThemes(prev => {
      const updated = [...prev, customTheme];
      localStorage.setItem('customThemes', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // 导出主题配置
  const exportThemeConfig = useCallback(() => {
    const config = {
      currentTheme: theme,
      customThemes: customThemes,
      timestamp: new Date().toISOString()
    };
    return JSON.stringify(config, null, 2);
  }, [theme, customThemes]);

  // 导入主题配置
  const importThemeConfig = useCallback((config: string) => {
    try {
      const parsed = JSON.parse(config);
      if (parsed.currentTheme) {
        setTheme(parsed.currentTheme);
      }
      if (parsed.customThemes) {
        setCustomThemes(parsed.customThemes);
        localStorage.setItem('customThemes', JSON.stringify(parsed.customThemes));
      }
      return true;
    } catch (error) {
      console.error('Failed to import theme config:', error);
      return false;
    }
  }, []);

  // 确定当前是否为深色模式
  // 确保服务器端和客户端初始状态一致，避免hydration不匹配
  const isDark = useMemo(() => {
    // 初始化时（主题为defaultTheme），始终返回false，与初始theme状态匹配
    if (theme === defaultTheme && !previewingTheme) {
      return false;
    }
    
    const currentTheme = previewingTheme || theme;
    const appliedTheme = getAppliedTheme(currentTheme);
    const darkThemes = ['dark', 'pixel', 'cyber', 'neon', 'cosmic'];
    return darkThemes.includes(appliedTheme);
  }, [theme, previewingTheme]);

  // 推荐主题
  const recommendedThemes = useMemo(() => {
    return ['light', 'dark', 'system', 'auto'] as Theme[];
  }, []);

  // 优化上下文值，减少组件重新渲染
  const value = useMemo(() => ({
    theme,
    isDark,
    toggleTheme,
    setTheme,
    availableThemes: themeConfig,
    previewTheme,
    resetPreview,
    createCustomTheme,
    customThemes,
    exportThemeConfig,
    importThemeConfig,
    recommendedThemes
  }), [theme, isDark, setTheme, toggleTheme, previewTheme, resetPreview, createCustomTheme, customThemes, exportThemeConfig, importThemeConfig, recommendedThemes]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
