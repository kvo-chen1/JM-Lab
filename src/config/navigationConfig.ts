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
}

// 导航分组类型定义
export interface NavGroup {
  title: string;
  items: NavItem[];
  id: string;
  description?: string;
}

// 平台首页导航项
export const platformNavItems: NavItem[] = [
  { id: 'home', path: '/', label: '首页', icon: 'fas fa-home' },
  { id: 'create', path: '/create', label: '创作中心', icon: 'fas fa-tools' }
];

// 创作中心导航项 (已合并至平台首页)
export const creationNavItems: NavItem[] = [
];

// 作品与社区导航项
export const communityNavItems: NavItem[] = [
  { id: 'explore', path: '/explore', label: '探索作品', icon: 'fas fa-compass' },
  { id: 'square', path: '/square', label: '共创广场', icon: 'fas fa-th-large' },
  { id: 'creator-community', path: '/community', label: '创作者社群', icon: 'fas fa-users', search: '?context=creator' }
];

// 活动与挑战导航项
export const eventsNavItems: NavItem[] = [
];

// 发现天津导航项
export const discoveryNavItems: NavItem[] = [
  { id: 'tianjin', path: '/tianjin', label: '天津专区', icon: 'fas fa-landmark' },
  { id: 'events', path: '/cultural-events', label: '天津文化活动', icon: 'fas fa-calendar-alt' },
  { id: 'tianjin-map', path: '/tianjin/map', label: '天津老字号地图', icon: 'fas fa-map-marked-alt' },
  { id: 'knowledge', path: '/cultural-knowledge', label: '天津文化知识', icon: 'fas fa-book' }
];

// 趣味与激励导航项
export const entertainmentNavItems: NavItem[] = [
  { id: 'particle-art', path: '/particle-art', label: '粒子艺术', icon: 'fas fa-palette' },
  { id: 'games', path: '/games', label: '趣味游戏', icon: 'fas fa-gamepad' },
  { id: 'points-mall', path: '/points-mall', label: '积分商城', icon: 'fas fa-gift' },
  { id: 'leaderboard', path: '/leaderboard', label: '人气排行', icon: 'fas fa-chart-line' }
];

// 更多服务导航项 (Updated)
export const moreNavItems: NavItem[] = [
  { id: 'business', path: '/business', label: '商业合作', icon: 'fas fa-handshake' },
  { id: 'news', path: '/cultural-news', label: '文化资讯', icon: 'fas fa-newspaper' },
  { id: 'about', path: '/about', label: '关于我们', icon: 'fas fa-info-circle' }
];

// 完整导航分组列表
export const navigationGroups: NavGroup[] = [
  {
    id: 'platform',
    title: '平台首页',
    items: platformNavItems
  },
  // {
  //   id: 'creation',
  //   title: '创作中心',
  //   items: creationNavItems
  // },
  {
    id: 'community',
    title: '作品与社区',
    items: communityNavItems
  },
  // {
  //   id: 'events',
  //   title: '活动与挑战',
  //   items: eventsNavItems
  // },
  {
    id: 'discovery',
    title: '发现天津',
    items: discoveryNavItems
  },
  {
    id: 'entertainment',
    title: '趣味与激励',
    items: entertainmentNavItems
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
