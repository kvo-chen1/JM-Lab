// 导航项ID到翻译键名的映射
export const navItemIdToTranslationKey: Record<string, string> = {
  // 核心导航
  'home': 'sidebar.home',
  'explore': 'sidebar.exploreWorks',
  'create': 'sidebar.creationCenter',
  'inspiration': 'sidebar.inspirationEngine',
  'knowledge': 'sidebar.culturalKnowledge',
  
  // 社区与互动
  'community': 'sidebar.coCreationCommunity',
  'friends': 'common.friends',
  'leaderboard': 'sidebar.popularityRanking',
  
  // 天津文化
  'tianjin': 'sidebar.tianjinSpecialZone',
  'tianjin-map': 'sidebar.tianjinMap',
  'events': 'sidebar.culturalActivities',
  'news': 'sidebar.culturalNews',
  
  // 激励与福利
  'points-mall': 'sidebar.pointsMall',
  'membership': 'header.membershipCenter',
  'achievements': 'common.achievements',
  'daily-checkin': 'common.dailyCheckin',
  
  // 娱乐与创意
  'particle-art': 'sidebar.particleArt',
  'games': 'sidebar.funGames',
  'lab': 'sidebar.newWindowLab',
  'ip-incubation': 'common.ipIncubationCenter',
  
  // 商务与支持
  'business': 'sidebar.businessCooperation',
  'help': 'sidebar.aboutUs'
};

// 导航分组ID到翻译键名的映射
export const navGroupIdToTranslationKey: Record<string, string> = {
  'core': 'sidebar.platform',
  'community': 'sidebar.community',
  'tianjin': 'sidebar.tianjinFeatures',
  'incentives': 'sidebar.incentives',
  'entertainment': 'sidebar.entertainment',
  'business': 'sidebar.moreServices'
};
