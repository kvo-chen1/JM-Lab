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
  badge?: string | number; // 徽章标记
}

// 导航分组类型定义
export interface NavGroup {
  title: string;
  items: NavItem[];
  id: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low'; // 分组优先级
  icon?: string; // 分组图标
}

// ==================== 新的导航分类结构 ====================

// 1. 🏠 平台首页 (Platform Home)
export const homeNavItems: NavItem[] = [
  { id: 'home', path: '/', label: '首页', icon: 'fas fa-home', priority: 'high' },
  { id: 'agent', path: '/create/agent', label: '津小脉 Agent', icon: 'fas fa-robot', priority: 'high', badge: 'NEW', description: '智能设计助手，AI驱动创意' }
];

// 2. ✨ 创作中心 (Creation Center)
export const creationNavItems: NavItem[] = [
  { id: 'create', path: '/create', label: '创作中心', icon: 'fas fa-tools', priority: 'high' },
  { id: 'ai-writer', path: '/ai-writer', label: 'AI智作文案', icon: 'fas fa-pen-nib', priority: 'high' },
  { id: 'wizard', path: '/wizard', label: '品牌向导', icon: 'fas fa-hat-wizard', priority: 'high' },
  { id: 'neo', path: '/neo', label: '灵感引擎', icon: 'fas fa-lightbulb', priority: 'medium', description: '激发创意灵感' }
];

// 3. 🎨 发现与探索 (Discover)
export const discoverNavItems: NavItem[] = [
  { id: 'square', path: '/square', label: '津脉广场', icon: 'fas fa-th-large', priority: 'high' },
  { id: 'community', path: '/community', label: '津脉社区', icon: 'fas fa-users', priority: 'high' },
  { id: 'leaderboard', path: '/leaderboard', label: '人气排行', icon: 'fas fa-chart-line', priority: 'medium' }
];

// 4. 🏛️ 津门文化 (Tianjin Culture)
export const cultureNavItems: NavItem[] = [
  { id: 'knowledge', path: '/knowledge', label: '文化知识库', icon: 'fas fa-book', priority: 'high' },
  { id: 'inspiration-mindmap', path: '/inspiration-mindmap', label: '津脉脉络', icon: 'fas fa-project-diagram', priority: 'high', description: '可视化创作思维导图' },
  { id: 'events', path: '/cultural-events', label: '文化活动', icon: 'fas fa-calendar-alt', priority: 'medium' }
];

// 5. 🎁 福利中心 (Rewards)
export const rewardsNavItems: NavItem[] = [
  { id: 'membership', path: '/membership', label: '会员中心', icon: 'fas fa-crown', priority: 'high', badge: 'VIP', description: '会员权益与升级' },
  { id: 'points-mall', path: '/points-mall', label: '积分商城', icon: 'fas fa-gift', priority: 'high' },
  { id: 'points-lottery', path: '/points-lottery', label: '幸运抽奖', icon: 'fas fa-dharmachakra', priority: 'high', badge: '新' },
  { id: 'achievements', path: '/achievement-museum', label: '成就博物馆', icon: 'fas fa-trophy', priority: 'medium' },
  { id: 'daily-checkin', path: '/checkin', label: '每日签到', icon: 'fas fa-calendar-check', priority: 'low' },
  { id: 'games', path: '/games', label: '趣味游戏', icon: 'fas fa-gamepad', priority: 'low', description: '休闲娱乐小游戏' }
];

// 6. 🛒 商业服务 (Business)
export const businessNavItems: NavItem[] = [
  { id: 'marketplace', path: '/marketplace', label: '津脉文创商城', icon: 'fas fa-store', priority: 'high', badge: '新', description: '津门老字号文创产品' },
  { id: 'creator-center', path: '/creator-center', label: '创作者中心', icon: 'fas fa-star', priority: 'high', badge: '新' },
  { id: 'merchant', path: '/merchant', label: '商家工作台', icon: 'fas fa-briefcase', priority: 'medium' },
  { id: 'organizer', path: '/organizer', label: '主办方中心', icon: 'fas fa-building', priority: 'medium' },
  { id: 'business', path: '/business', label: '品牌合作', icon: 'fas fa-handshake', priority: 'medium', description: '品牌合作与商业机会' },
  { id: 'ip-incubation', path: '/ip-incubation', label: 'IP孵化中心', icon: 'fas fa-lightbulb', priority: 'low', description: 'IP孵化与培育平台' },
  { id: 'help', path: '/help', label: '帮助中心', icon: 'fas fa-info-circle', priority: 'low', description: '使用帮助与文档' }
];

// ==================== 完整导航分组列表 (新结构) ====================
export const navigationGroups: NavGroup[] = [
  {
    id: 'home',
    title: '平台首页',
    items: homeNavItems,
    priority: 'high',
    icon: 'fas fa-home'
  },
  {
    id: 'creation',
    title: '创作中心',
    items: creationNavItems,
    priority: 'high',
    icon: 'fas fa-paint-brush'
  },
  {
    id: 'discover',
    title: '发现与探索',
    items: discoverNavItems,
    priority: 'high',
    icon: 'fas fa-compass'
  },
  {
    id: 'culture',
    title: '津门文化',
    items: cultureNavItems,
    priority: 'medium',
    icon: 'fas fa-landmark'
  },
  {
    id: 'rewards',
    title: '福利中心',
    items: rewardsNavItems,
    priority: 'medium',
    icon: 'fas fa-gift'
  },
  {
    id: 'business',
    title: '商业服务',
    items: businessNavItems,
    priority: 'low',
    icon: 'fas fa-briefcase'
  }
];

// ==================== 保持向后兼容的旧导出 (Deprecated) ====================
/** @deprecated 使用新的 navigationGroups */
export const coreNavItems: NavItem[] = [
  { id: 'home', path: '/', label: '首页', icon: 'fas fa-home', priority: 'high' },
  { id: 'agent', path: '/create/agent', label: '津小脉Agent', icon: 'fas fa-robot', priority: 'high', badge: 'NEW', description: '智能设计助手，AI驱动创意' },
  { id: 'create', path: '/create', label: '创作中心', icon: 'fas fa-tools', priority: 'high' },
  { id: 'wizard', path: '/wizard', label: '品牌向导', icon: 'fas fa-hat-wizard', priority: 'high' },
  { id: 'ai-writer', path: '/ai-writer', label: 'AI智作文案', icon: 'fas fa-pen-nib', priority: 'high' },
  { id: 'events', path: '/cultural-events', label: '文化活动', icon: 'fas fa-calendar-alt', priority: 'medium' }
];

/** @deprecated 使用新的 navigationGroups */
export const communityNavItems: NavItem[] = [
  { id: 'square', path: '/square', label: '津脉广场', icon: 'fas fa-th-large', priority: 'high' },
  { id: 'community', path: '/community', label: '津脉社区', icon: 'fas fa-users', priority: 'high' }
];

/** @deprecated 使用新的 navigationGroups */
export const tianjinNavItems: NavItem[] = [
  { id: 'tianjin', path: '/tianjin', label: '津脉作品', icon: 'fas fa-landmark', priority: 'high' },
  { id: 'inspiration-mindmap', path: '/inspiration-mindmap', label: '津脉脉络', icon: 'fas fa-project-diagram', priority: 'high', description: '可视化创作思维导图，记录灵感旅程' },
  { id: 'knowledge', path: '/knowledge', label: '文化知识', icon: 'fas fa-book', priority: 'medium' }
];

/** @deprecated 使用新的 navigationGroups */
export const incentivesNavItems: NavItem[] = [
  { id: 'leaderboard', path: '/leaderboard', label: '人气排行', icon: 'fas fa-chart-line', priority: 'medium' },
  { id: 'points-mall', path: '/points-mall', label: '积分商城', icon: 'fas fa-gift', priority: 'medium' },
  { id: 'points-lottery', path: '/points-lottery', label: '幸运抽奖', icon: 'fas fa-dharmachakra', priority: 'medium', badge: '新' },
  { id: 'achievements', path: '/achievement-museum', label: '成就博物馆', icon: 'fas fa-trophy', priority: 'low' },
  { id: 'daily-checkin', path: '/checkin', label: '每日签到', icon: 'fas fa-calendar-check', priority: 'low' },
  { id: 'games', path: '/games', label: '趣味游戏', icon: 'fas fa-gamepad', priority: 'low' }
];

/** @deprecated 使用新的 navigationGroups */
export const entertainmentNavItems: NavItem[] = [];

/** @deprecated 使用新的 navigationGroups */
export const oldBusinessNavItems: NavItem[] = [
  { id: 'marketplace', path: '/marketplace', label: '津脉文创商城', icon: 'fas fa-store', priority: 'high', badge: '新', description: '津门老字号文创产品交易平台' },
  { id: 'merchant', path: '/merchant', label: '商家工作台', icon: 'fas fa-briefcase', priority: 'high', badge: '新', description: '商家日常运营管理平台' },
  { id: 'business', path: '/business', label: '商业合作', icon: 'fas fa-handshake', priority: 'medium' },
  { id: 'organizer', path: '/organizer', label: '主办方中心', icon: 'fas fa-building', priority: 'medium' },
  { id: 'ip-incubation', path: '/ip-incubation', label: 'IP孵化中心', icon: 'fas fa-lightbulb', priority: 'low' },
  { id: 'creator-center', path: '/creator-center', label: '创作者中心', icon: 'fas fa-star', priority: 'high', badge: '新' },
  { id: 'help', path: '/help', label: '帮助中心', icon: 'fas fa-info-circle', priority: 'low' }
];

// ==================== 顶部和底部导航 ====================

// 顶部导航项
export const topNavItems: NavItem[] = [
  { id: 'search', path: '#', label: '搜索', icon: 'fas fa-search', external: true },
  { id: 'notifications', path: '/messages', label: '消息', icon: 'fas fa-bell', external: true },
  { id: 'profile', path: '/dashboard', label: '个人中心', icon: 'fas fa-user', external: true }
];

// 底部导航项 (移动端)
export const bottomNavItems: NavItem[] = [
  { id: 'home', path: '/', label: '首页', icon: 'fas fa-home' },
  { id: 'marketplace', path: '/marketplace', label: '商城', icon: 'fas fa-store' },
  { id: 'square', path: '/square', label: '广场', icon: 'fas fa-th-large' },
  { id: 'agent', path: '/create/agent', label: 'Agent', icon: 'fas fa-robot', badge: 'NEW' },
  { id: 'dashboard', path: '/dashboard', label: '我的', icon: 'fas fa-user' }
];

// ==================== 配置项 ====================

// 快捷键配置
export const keyboardShortcuts = {
  '/': '聚焦搜索',
  't': '切换主题',
  'n': '打开通知',
  '?': '显示快捷键',
  '1': '首页',
  '2': '创作中心',
  '3': '津脉文创商城',
  '4': '津脉广场',
  '5': '津脉社区',
  '6': '文化知识',
  '7': '积分商城',
  '8': '个人中心'
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

// 侧边栏样式配置
export const sidebarStyleConfig = {
  // 分组间距
  groupGap: '20px',
  // 分组内边距
  groupPadding: '12px',
  // 导航项间距
  itemGap: '6px',
  // 导航项内边距
  itemPadding: '10px 12px',
  // 圆角
  borderRadius: {
    group: '14px',
    item: '10px',
    badge: '4px'
  },
  // 动画时间
  animation: {
    hover: '200ms',
    collapse: '300ms',
    stagger: '50ms'
  }
};
