// 主题样式索引文件
// 导出所有主题样式，便于统一管理和加载

// 导入各主题样式
import './blue.css';
import './green.css';

// 导出主题类型
export type Theme = 'light' | 'blue' | 'green';

// 导出主题配置接口
export interface ThemeConfig {
  value: Theme;
  label: string;
  icon: string;
}

// 导出主题配置列表
export const themeConfigs: ThemeConfig[] = [
  { value: 'light', label: '浅色', icon: 'fas fa-sun' },
  { value: 'blue', label: '蓝色', icon: 'fas fa-water' },
  { value: 'green', label: '绿色', icon: 'fas fa-leaf' }
];

// 导出主题切换顺序
export const themeOrder: Theme[] = ['light', 'blue', 'green'];
