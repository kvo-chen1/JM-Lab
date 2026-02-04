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
  image?: string; // 对应的社群图片URL
  priority?: 'high' | 'medium' | 'low'; // 导航项优先级
}

// 导航分组类型定义
export interface NavGroup {
  title: string;
  items: NavItem[];
  id: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low'; // 分组优先级
}

// 核心功能导航项
export const coreNavItems: NavItem[] = [
  { id: 'home', path: '/', label: '首页', icon: 'fas fa-home', priority: 'high' },
  { id: 'create', path: '/create', label: '创作中心', icon: 'fas fa-tools', priority: 'high' },
  { id: 'events', path: '/cultural-events', label: '文化活动', icon: 'fas fa-calendar-alt', priority: 'medium' }

];

// 社区与互动导航项
export const communityNavItems: NavItem[] = [
  { id: 'square', path: '/square', label: '津脉广场', icon: 'fas fa-th-large', priority: 'high' },
  { id: 'community', path: '/community', label: '津脉社区', icon: 'fas fa-users', priority: 'high' },

];

// 天津老字号专区导航项
export const tianjinNavItems: NavItem[] = [
  { id: 'tianjin', path: '/tianjin', label: '特色专区', icon: 'fas fa-landmark', priority: 'high' },

  { id: 'knowledge', path: '/knowledge', label: '文化知识', icon: 'fas fa-book', priority: 'medium' },

];

// 激励与福利导航项
export const incentivesNavItems: NavItem[] = [
  { id: 'leaderboard', path: '/leaderboard', label: '人气排行', icon: 'fas fa-chart-line', priority: 'medium' },
  { id: 'points-mall', path: '/points-mall', label: '积分商城', icon: 'fas fa-gift', priority: 'medium' },
  { id: 'achievements', path: '/achievement-museum', label: '成就博物馆', icon: 'fas fa-trophy', priority: 'low' },
  { id: 'daily-checkin', path: '/daily-checkin', label: '每日签到', icon: 'fas fa-calendar-check', priority: 'low' },

];

// 娱乐与创意导航项
export const entertainmentNavItems: NavItem[] = [
  { id: 'particle-art', path: '/particle-art', label: '粒子艺术', icon: 'fas fa-palette', priority: 'low' },
  { id: 'games', path: '/games', label: '趣味游戏', icon: 'fas fa-gamepad', priority: 'low' },

];

// 商务与支持导航项
export const businessNavItems: NavItem[] = [
  { id: 'business', path: '/business', label: '商业合作', icon: 'fas fa-handshake', priority: 'medium' },
  { id: 'ip-incubation', path: '/ip-incubation', label: 'IP孵化中心', icon: 'fas fa-lightbulb', priority: 'low' },
  { id: 'help', path: '/help', label: '帮助中心', icon: 'fas fa-info-circle', priority: 'low' }
];

// 完整导航分组列表
export const navigationGroups: NavGroup[] = [
  {
    id: 'core',
    title: '核心功能',
    items: coreNavItems,
    priority: 'high'
  },
  {
    id: 'community',
    title: '社区与互动',
    items: communityNavItems,
    priority: 'high'
  },
  {
    id: 'tianjin',
    title: '天津老字号专区',
    items: tianjinNavItems,
    priority: 'medium'
  },
  {
    id: 'incentives',
    title: '激励与福利',
    items: incentivesNavItems,
    priority: 'medium'
  },
  {
    id: 'entertainment',
    title: '娱乐与创意',
    items: entertainmentNavItems,
    priority: 'low'
  },
  {
    id: 'business',
    title: '商务与支持',
    items: businessNavItems,
    priority: 'low'
  }
];

// 顶部导航项
export const topNavItems: NavItem[] = [
  { id: 'search', path: '#', label: '搜索', icon: 'fas fa-search', external: true },
  { id: 'notifications', path: '#', label: '通知', icon: 'fas fa-bell', external: true },
  { id: 'profile', path: '/dashboard', label: '个人中心', icon: 'fas fa-user', external: true }
];

// 底部导航项 (移动端)
export const bottomNavItems: NavItem[] = [
  { id: 'home', path: '/', label: '首页', icon: 'fas fa-home' },
  { id: 'create', path: '/create', label: '创作', icon: 'fas fa-plus-circle' },
  { id: 'square', path: '/square', label: '广场', icon: 'fas fa-th-large' },
  { id: 'dashboard', path: '/dashboard', label: '我的', icon: 'fas fa-user' }
];

// 快捷键配置
export const keyboardShortcuts = {
  '/': '聚焦搜索',
  't': '切换主题',
  'n': '打开通知',
  '?': '显示快捷键',
  '1': '首页',
  '2': '创作中心',
  '3': '津脉广场',
  '4': '津脉社区',
  '5': '天津特色专区',
  '6': '积分商城',
  '7': '个人中心'
};

// 最近访问记录配置
export const recentVisitsConfig = {
  maxItems: 6,
  storageKey: 'recentVisits'
};

// 导航动画配置
export const navigationAnimationConfig = {
  duration: 200,
  ease: 'ease-in-out',
  delay: 0
};