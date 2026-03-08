// 导航项ID到翻译键名的映射
export const navItemIdToTranslationKey: Record<string, string> = {
  // 平台首页
  'home': 'sidebar.home',
  'agent': 'sidebar.agent',
  
  // 创作中心
  'create': 'sidebar.creationCenter',
  'ai-writer': 'sidebar.aiWriter',
  'wizard': 'sidebar.brandWizard',
  'neo': 'sidebar.inspirationEngine',
  
  // 发现与探索
  'square': 'sidebar.square',
  'community': 'sidebar.community',
  'leaderboard': 'sidebar.popularityRanking',
  
  // 津门文化
  'knowledge': 'sidebar.culturalKnowledge',
  'inspiration-mindmap': 'sidebar.mindMap',
  'events': 'sidebar.culturalActivities',
  
  // 福利中心
  'points-mall': 'sidebar.pointsMall',
  'points-lottery': 'sidebar.lottery',
  'achievements': 'common.achievements',
  'daily-checkin': 'common.dailyCheckin',
  
  // 商业服务
  'marketplace': 'sidebar.marketplace',
  'creator-center': 'sidebar.creatorCenter',
  'merchant': 'sidebar.merchant',
  'organizer': 'sidebar.organizer',
  
  // 向后兼容
  'explore': 'sidebar.exploreWorks',
  'friends': 'common.friends',
  'tianjin': 'sidebar.tianjinSpecialZone',
  'tianjin-map': 'sidebar.tianjinMap',
  'news': 'sidebar.culturalNews',
  'membership': 'header.membershipCenter',
  'games': 'sidebar.funGames',
  'lab': 'sidebar.newWindowLab',
  'ip-incubation': 'common.ipIncubationCenter',
  'business': 'sidebar.businessCooperation',
  'help': 'sidebar.aboutUs'
};

// 导航分组ID到翻译键名的映射
export const navGroupIdToTranslationKey: Record<string, string> = {
  // 新分组
  'home': 'sidebar.group.home',
  'creation': 'sidebar.group.creation',
  'discover': 'sidebar.group.discover',
  'culture': 'sidebar.group.culture',
  'rewards': 'sidebar.group.rewards',
  'business': 'sidebar.group.business',
  
  // 向后兼容
  'core': 'sidebar.platform',
  'community': 'sidebar.community',
  'tianjin': 'sidebar.tianjinFeatures',
  'incentives': 'sidebar.incentives',
  'entertainment': 'sidebar.entertainment'
};
