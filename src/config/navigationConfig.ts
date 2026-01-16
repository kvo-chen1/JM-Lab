// src/config/navigationConfig.ts

// 导航项类型定义
export interface NavItem {
  path: string;
  label: string;
  icon: string;
  id: string;
  description?: string;
  children?: NavItem[];
  external?: boolean;
  search?: string;
}

// 导航分组类型定义
export interface NavGroup {
  title: string;
  items: NavItem[];
  id: string;
  description?: string;
}

// 核心导航项
export const coreNavItems: NavItem[] = [
  { id: 'home', path: '/', label: '首页', icon: 'fas fa-home' },
  { id: 'explore', path: '/explore', label: '探索作品', icon: 'fas fa-compass' },
  { id: 'create', path: '/create', label: '创作中心', icon: 'fas fa-tools' },
  { id: 'tools', path: '/tools', label: '创作工具', icon: 'fas fa-wand-magic-sparkles' },
  { id: 'inspiration', path: '/neo', label: '灵感引擎', icon: 'fas fa-bolt' },
  { id: 'knowledge', path: '/cultural-knowledge', label: '文化知识', icon: 'fas fa-book' }
];

// 共创功能导航项
export const cocreationNavItems: NavItem[] = [
  { id: 'guide', path: '/wizard', label: '共创向导', icon: 'fas fa-hat-wizard' },
  { id: 'square', path: '/square', label: '共创广场', icon: 'fas fa-th-large' },
  { id: 'community', path: '/community', label: '共创社群', icon: 'fas fa-user-friends', search: '?context=cocreation&tab=joined' },
  { id: 'creator-community', path: '/community', label: '创作者社群', icon: 'fas fa-users', search: '?context=creator' }
];

// 天津特色导航项
export const tianjinNavItems: NavItem[] = [
  { id: 'tianjin', path: '/tianjin', label: '天津专区', icon: 'fas fa-landmark' },
  { id: 'tianjin-map', path: '/tianjin-map', label: '天津地图', icon: 'fas fa-map-marked-alt' },
  { id: 'events', path: '/cultural-events', label: '文化活动', icon: 'fas fa-calendar-alt' },
  { id: 'news', path: '/cultural-news', label: '文化资讯', icon: 'fas fa-newspaper' }
];

// 更多服务导航项
export const moreNavItems: NavItem[] = [
  { id: 'particle-art', path: '/particle-art', label: '粒子艺术', icon: 'fas fa-palette' },
  { id: 'leaderboard', path: '/leaderboard', label: '人气排行', icon: 'fas fa-chart-line' },
  { id: 'games', path: '/games', label: '趣味游戏', icon: 'fas fa-gamepad' },
  { id: 'lab', path: '/lab', label: '新窗实验室', icon: 'fas fa-window-restore' },
  { id: 'points-mall', path: '/points-mall', label: '积分商城', icon: 'fas fa-gift' },
  { id: 'business', path: '/business', label: '商业合作', icon: 'fas fa-handshake' },
  { id: 'developers', path: '/developers', label: '开发者API', icon: 'fas fa-code' },
  { id: 'about', path: '/about', label: '关于我们', icon: 'fas fa-info-circle' }
];

// 完整导航分组列表
export const navigationGroups: NavGroup[] = [
  {
    id: 'core',
    title: '常用功能',
    items: coreNavItems
  },
  {
    id: 'cocreation',
    title: '共创功能',
    items: cocreationNavItems
  },
  {
    id: 'tianjin',
    title: '天津特色',
    items: tianjinNavItems
  },
  {
    id: 'more',
    title: '更多服务',
    items: moreNavItems
  }
];

// 顶部导航项
export const topNavItems: NavItem[] = [
  { id: 'search', path: '#', label: '搜索', icon: 'fas fa-search', external: true },
  { id: 'notifications', path: '#', label: '通知', icon: 'fas fa-bell', external: true },
  { id: 'friends', path: '/friends', label: '好友', icon: 'fas fa-users', external: true },
  { id: 'profile', path: '/dashboard', label: '个人中心', icon: 'fas fa-user', external: true }
];

// 快捷键配置
export const keyboardShortcuts = {
  '/': '聚焦搜索',
  't': '切换主题',
  'b': '折叠侧边栏',
  '1': '首页',
  '2': '探索作品',
  '3': '创作中心',
  '4': '灵感引擎',
  '5': '共创向导',
  '6': '共创广场',
  '7': '文化知识',
  '8': '天津专区',
  '9': '人气排行',
  '0': '关于我们'
};
