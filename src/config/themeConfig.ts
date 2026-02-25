// src/config/themeConfig.ts

// 主题类型定义
export type Theme = 'light' | 'blue' | 'green' | 'pixel' | 'dark' | 'tianjin' | 'nirenzhang' | 'yangliuqing' | 'fengzhengwei' | 'guifaxiang' | 'goubuli' | 'tianjin-enhanced';

// 自定义主题接口
export interface CustomTheme {
  id: string;
  name: string;
  description?: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
  };
  createdAt: number;
  updatedAt: number;
}

// 主题配置项接口
interface ThemeConfig {
  value: Theme;
  label: string;
  icon: string;
  description?: string;
  isDefault?: boolean;
  isSystem?: boolean;
}

// 主题配置列表
export const themeConfig: ThemeConfig[] = [
  { value: 'light', label: '浅色', icon: 'fas fa-sun', description: '明亮清爽的默认主题', isDefault: true },
  { value: 'dark', label: '暗色', icon: 'fas fa-moon', description: '墨韵深空暗色主题，专业级深色体验' },
  { value: 'blue', label: '蓝色', icon: 'fas fa-water', description: '清新蓝色主题，带来宁静感' },
  { value: 'green', label: '绿色', icon: 'fas fa-leaf', description: '自然绿色主题，充满生机' },
  { value: 'pixel', label: '赛博像素', icon: 'fas fa-dungeon', description: '复古赛博朋克风格主题' },
  { value: 'tianjin', label: '津门雅韵', icon: 'fas fa-landmark', description: '天津城市特色主题，融合海河蓝、历史砖红、老字号文化元素，体现古今交融的城市气质' },
  { value: 'nirenzhang', label: '泥人张红', icon: 'fas fa-palette', description: '工艺美术主题，热烈红色调，用于重要操作和强调' },
  { value: 'yangliuqing', label: '杨柳青绿', icon: 'fas fa-tree', description: '天津杨柳青年画主题，石青配朱砂红，半印半绘工艺，色彩鲜艳明快' },
  { value: 'fengzhengwei', label: '风筝魏蓝', icon: 'fas fa-paper-plane', description: '传统技艺主题，清新蓝色调，用于信息提示和链接' },
  { value: 'guifaxiang', label: '桂发祥金', icon: 'fas fa-crown', description: '传统美食主题，尊贵金色调，用于VIP标识和会员等级' },
  { value: 'goubuli', label: '狗不理棕', icon: 'fas fa-bread-slice', description: '传统美食主题，温暖棕色调，用于暖色调装饰' },
  { value: 'tianjin-enhanced', label: '津门雅韵·深', icon: 'fas fa-city', description: '天津文化主题深化版，融合海河波纹、传统纹样、老字号元素，展现津门文化魅力', isSystem: true }
];


// 主题色彩增强配置
export const themeEnhancements = {
  // 色彩对比度增强
  contrast: {
    light: 1.2,
    dark: 1.25,
    blue: 1.15,
    green: 1.15,
    pixel: 1.3,
    tianjin: 1.18,
    nirenzhang: 1.2,
    yangliuqing: 1.15,
    fengzhengwei: 1.15,
    guifaxiang: 1.18,
    goubuli: 1.15,
    'tianjin-enhanced': 1.2
  },
  // 色彩饱和度优化
  saturation: {
    light: 1.05,
    dark: 1.1,
    blue: 1.1,
    green: 1.1,
    pixel: 1.2,
    tianjin: 1.08,
    nirenzhang: 1.15,
    yangliuqing: 1.1,
    fengzhengwei: 1.05,
    guifaxiang: 1.12,
    goubuli: 1.08,
    'tianjin-enhanced': 1.1
  },
  // 亮度调整
  brightness: {
    light: 1.0,
    dark: 0.9,
    blue: 1.0,
    green: 1.0,
    pixel: 0.85,
    tianjin: 1.02,
    nirenzhang: 1.0,
    yangliuqing: 1.02,
    fengzhengwei: 1.05,
    guifaxiang: 1.0,
    goubuli: 0.98,
    'tianjin-enhanced': 1.02
  },
  // 主题过渡动画
  transition: {
    duration: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    properties: ['background-color', 'color', 'border-color', 'text-shadow', 'box-shadow', 'background-image']
  },
  // 主题特定效果
  effects: {
    dark: {
      glow: true,
      intensity: 'medium',
      color: '#8B5CF6'
    },
    pixel: {
      glow: true,
      intensity: 'high',
      color: '#00ffff'
    },
    tianjin: {
      glow: true,
      intensity: 'medium',
      color: '#1E5F8E',
      waveAnimation: true,
      brickTexture: true
    },
    nirenzhang: {
      glow: true,
      intensity: 'high',
      color: '#C21807',
      artStyle: 'clay'
    },
    yangliuqing: {
      glow: true,
      intensity: 'medium',
      color: '#228B22',
      artStyle: 'painting'
    },
    fengzhengwei: {
      glow: true,
      intensity: 'low',
      color: '#87CEEB',
      artStyle: 'kite'
    },
    guifaxiang: {
      glow: true,
      intensity: 'high',
      color: '#C68E17',
      artStyle: 'golden'
    },
    goubuli: {
      glow: true,
      intensity: 'medium',
      color: '#8B4513',
      artStyle: 'warm'
    },
    'tianjin-enhanced': {
      glow: true,
      intensity: 'medium',
      color: '#1E5F8E',
      waveAnimation: true,
      brickTexture: true,
      patterns: ['cloud', 'wave', 'brick', 'huiwen'],
      animations: ['haihe-wave', 'tianjin-eye', 'kite-float', 'golden-shimmer'],
      culturalElements: {
        haihe: true,
        tianjinEye: true,
        laozihao: true,
        feiyi: true
      }
    }
  }
};

// 自动主题切换配置
export const autoThemeConfig = {
  // 时间范围配置
  timeRanges: {
    light: {
      start: '06:00',
      end: '18:00'
    },
    dark: {
      start: '18:00',
      end: '06:00'
    }
  },
  // 过渡时间（分钟）
  transitionMinutes: 30,
  // 地理位置感知（可选）
  geoAware: false,
  // 季节适配
  seasonAware: true
};

// 主题预设配置
export const themePresets = {
  // 推荐主题组合
  recommended: ['light', 'dark', 'blue', 'green', 'pixel', 'tianjin', 'nirenzhang', 'yangliuqing', 'fengzhengwei', 'guifaxiang', 'goubuli', 'tianjin-enhanced'] as Theme[],
  // 季节适配
  seasonal: {
    spring: 'green',
    summer: 'blue',
    autumn: 'light',
    winter: 'dark',
    festival: 'tianjin'
  },
  // 场景主题推荐
  场景: {
    reading: 'light',
    gaming: 'pixel',
    creative: 'blue',
    relaxation: 'green',
    cultural: 'tianjin-enhanced',
    travel: 'tianjin-enhanced',
    festival: 'tianjin-enhanced'
  }
};

// 默认主题配置
export const defaultTheme: Theme = 'pixel';

// 主题切换顺序
export const themeOrder: Theme[] = ['light', 'dark', 'blue', 'green', 'pixel', 'tianjin', 'nirenzhang', 'yangliuqing', 'fengzhengwei', 'guifaxiang', 'goubuli', 'tianjin-enhanced'];

// 有效的主题列表（用于验证）
export const validThemes: Theme[] = ['light', 'dark', 'blue', 'green', 'pixel', 'tianjin', 'nirenzhang', 'yangliuqing', 'fengzhengwei', 'guifaxiang', 'goubuli', 'tianjin-enhanced'];

// 检测系统主题偏好
export const getSystemTheme = (): 'light' | 'dark' => {
  // 检查是否在浏览器环境中
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) {
    return 'light'; // 默认返回浅色主题
  }
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// 获取当前时间对应的主题
export const getTimeBasedTheme = (): 'light' | 'dark' => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;
  
  const lightStart = 6 * 60; // 06:00
  const lightEnd = 18 * 60;  // 18:00
  
  if (currentTime >= lightStart && currentTime < lightEnd) {
    return 'light';
  } else {
    return 'dark';
  }
};

// 获取实际应用的主题
export const getAppliedTheme = (theme: Theme): Theme => {
  switch (theme) {
    case 'light':
    case 'dark':
    case 'blue':
    case 'green':
    case 'pixel':
    case 'tianjin':
    case 'nirenzhang':
    case 'yangliuqing':
    case 'fengzhengwei':
    case 'guifaxiang':
    case 'goubuli':
      return theme;
    default:
      return defaultTheme;
  }
};

// 验证主题是否有效
export const isValidTheme = (theme: string): theme is Theme => {
  return themeConfig.some(config => config.value === theme);
};

// 获取主题配置信息
export const getThemeConfig = (theme: Theme) => {
  return themeConfig.find(config => config.value === theme) || themeConfig[0];
};

// 获取主题变体配置
export const getThemeVariants = (theme: Theme) => {
  const baseTheme = getAppliedTheme(theme);
  // 这里应该从设计系统导入themes，暂时返回基础配置
  return {
    theme: baseTheme,
    ...themeEnhancements
  };
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

// 自定义主题管理函数

// 保存自定义主题到localStorage
export const saveCustomTheme = (theme: CustomTheme): void => {
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) {
    return;
  }
  
  const customThemes = getCustomThemes();
  const existingIndex = customThemes.findIndex(t => t.id === theme.id);
  
  if (existingIndex >= 0) {
    // 更新现有主题
    customThemes[existingIndex] = { ...theme, updatedAt: Date.now() };
  } else {
    // 添加新主题
    customThemes.push({ ...theme, createdAt: Date.now(), updatedAt: Date.now() });
  }
  
  localStorage.setItem('customThemes', JSON.stringify(customThemes));
};

// 从localStorage读取自定义主题
export const getCustomThemes = (): CustomTheme[] => {
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) {
    return [];
  }
  
  const savedThemes = localStorage.getItem('customThemes');
  if (!savedThemes) {
    return [];
  }
  
  try {
    return JSON.parse(savedThemes);
  } catch (error) {
    console.error('Failed to parse custom themes:', error);
    return [];
  }
};

// 删除自定义主题
export const deleteCustomTheme = (themeId: string): void => {
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) {
    return;
  }
  
  const customThemes = getCustomThemes();
  const filteredThemes = customThemes.filter(t => t.id !== themeId);
  localStorage.setItem('customThemes', JSON.stringify(filteredThemes));
};

// 获取自定义主题
export const getCustomTheme = (themeId: string): CustomTheme | null => {
  const customThemes = getCustomThemes();
  return customThemes.find(t => t.id === themeId) || null;
};

// 导出主题为JSON
export const exportTheme = (theme: Theme | CustomTheme): string => {
  if (typeof theme === 'string') {
    // 导出预设主题配置
    const themeConfig = getThemeConfig(theme);
    return JSON.stringify({
      type: 'preset',
      theme: theme,
      config: themeConfig,
      enhancements: themeEnhancements
    }, null, 2);
  } else {
    // 导出自定义主题
    return JSON.stringify({
      type: 'custom',
      theme: theme
    }, null, 2);
  }
};

// 导入主题从JSON
export const importTheme = (jsonString: string): Theme | CustomTheme | null => {
  try {
    const data = JSON.parse(jsonString);
    
    if (data.type === 'preset' && isValidTheme(data.theme)) {
      return data.theme;
    } else if (data.type === 'custom' && data.theme) {
      const customTheme = data.theme as CustomTheme;
      saveCustomTheme(customTheme);
      return customTheme;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to import theme:', error);
    return null;
  }
};
