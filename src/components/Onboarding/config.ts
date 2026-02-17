import { OnboardingConfig } from './types';

export const onboardingConfig: OnboardingConfig = {
  allowSkip: true,
  showProgress: true,
  autoStart: true,
  completionReward: {
    points: 100,
    badge: 'explorer'
  },
  steps: [
    // 步骤 1: 欢迎页面 - 全屏展示
    {
      id: 'welcome',
      title: '欢迎来到津脉智坊',
      subtitle: '开启您的创意之旅',
      description: '在这里，AI 将成为您的创作伙伴。探索无限可能，让创意触手可及。',
      icon: 'sparkles',
      targetPath: '/dashboard',
      targetId: null,
      placement: 'fullscreen',
      primaryAction: '开始探索',
      animation: 'scale'
    },
    
    // 步骤 2: 仪表盘 - 创作中心概览
    {
      id: 'dashboard',
      title: '您的创作中心',
      subtitle: '一站式管理',
      description: '仪表盘汇集了您的作品数据、创作进度和个性化推荐，让您随时掌握创作动态。',
      icon: 'layout-dashboard',
      targetPath: '/dashboard',
      targetId: 'dashboard-container',
      placement: 'center',
      primaryAction: '下一步',
      showPulse: true,
      animation: 'fade'
    },
    
    // 步骤 3: 创作工坊 - 开始创作
    {
      id: 'create',
      title: '创作工坊',
      subtitle: '释放无限创意',
      description: '在这里，您可以使用 AI 绘画、文案生成、品牌设计等多种工具，将创意变为现实。',
      icon: 'wand-2',
      targetPath: '/create',
      targetId: 'create-workspace',
      placement: 'center',
      primaryAction: '下一步',
      showPulse: true,
      animation: 'bounce'
    },
    
    // 步骤 4: 草稿箱 - 管理创作
    {
      id: 'drafts',
      title: '草稿箱',
      subtitle: '保存灵感随时继续',
      description: '所有未完成的创作都会自动保存在草稿箱中，您可以随时打开继续编辑。',
      icon: 'file-edit',
      targetPath: '/drafts',
      targetId: 'drafts-container',
      placement: 'center',
      primaryAction: '下一步',
      animation: 'fade'
    },
    
    // 步骤 5: 我的作品 - 管理作品
    {
      id: 'my-works',
      title: '我的作品',
      subtitle: '展示您的创作成果',
      description: '查看和管理您发布的所有作品，了解作品的浏览量、点赞数等数据表现。',
      icon: 'image',
      targetPath: '/my-works',
      targetId: 'my-works-container',
      placement: 'center',
      primaryAction: '下一步',
      animation: 'fade'
    },
    
    // 步骤 6: 津脉广场 - 发现灵感
    {
      id: 'square',
      title: '津脉广场',
      subtitle: '发现灵感',
      description: '浏览社区精选作品，关注热门标签，与创作者互动交流。在这里找到属于您的创作灵感。',
      icon: 'compass',
      targetPath: '/square',
      targetId: 'square-container',
      placement: 'center',
      primaryAction: '下一步',
      showPulse: true,
      animation: 'fade'
    },
    
    // 步骤 7: 社区 - 创作者互动
    {
      id: 'community',
      title: '创作者社区',
      subtitle: '连接志同道合',
      description: '加入社区，参与话题讨论，分享创作心得，结识志同道合的创作者朋友。',
      icon: 'users',
      targetPath: '/community',
      targetId: 'community-feed',
      placement: 'center',
      primaryAction: '下一步',
      showPulse: true,
      animation: 'fade'
    },
    
    // 步骤 8: 好友与聊天 - 社交互动
    {
      id: 'friends',
      title: '好友与聊天',
      subtitle: '实时交流互动',
      description: '添加好友，与创作者一对一交流，分享创作经验，建立深厚的创作友谊。',
      icon: 'message-circle',
      targetPath: '/friends',
      targetId: 'friends-container',
      placement: 'center',
      primaryAction: '下一步',
      animation: 'slide'
    },
    
    // 步骤 9: 排行榜 - 竞技激励
    {
      id: 'leaderboard',
      title: '创作者排行榜',
      subtitle: '看看谁最活跃',
      description: '查看全站创作者排名，了解热门作品和优秀创作者，激发您的创作热情。',
      icon: 'trophy',
      targetPath: '/leaderboard',
      targetId: 'leaderboard-container',
      placement: 'center',
      primaryAction: '下一步',
      animation: 'scale'
    },
    
    // 步骤 10: 文化活动 - 参与赛事
    {
      id: 'events',
      title: '文化活动',
      subtitle: '参与精彩赛事',
      description: '参加平台举办的各类文化创作活动和比赛，展示才华，赢取丰厚奖励。',
      icon: 'calendar',
      targetPath: '/events',
      targetId: 'events-container',
      placement: 'center',
      primaryAction: '下一步',
      showPulse: true,
      animation: 'fade'
    },
    
    // 步骤 11: 天津文化 - 地域特色
    {
      id: 'tianjin',
      title: '天津文化',
      subtitle: '探索津门特色',
      description: '了解天津独特的文化底蕴，将津门元素融入您的创作中，打造具有地域特色的作品。',
      icon: 'map-pin',
      targetPath: '/tianjin',
      targetId: 'tianjin-container',
      placement: 'center',
      primaryAction: '下一步',
      animation: 'fade'
    },
    
    // 步骤 12: 知识库 - 学习成长
    {
      id: 'knowledge',
      title: '文化知识库',
      subtitle: '学习提升技能',
      description: '浏览丰富的创作教程、文化知识和技巧分享，不断提升您的创作能力。',
      icon: 'book-open',
      targetPath: '/knowledge',
      targetId: 'knowledge-container',
      placement: 'center',
      primaryAction: '下一步',
      animation: 'fade'
    },
    
    // 步骤 13: 数据分析 - 了解成长
    {
      id: 'analytics',
      title: '数据洞察',
      subtitle: '了解您的成长',
      description: '查看作品数据、互动统计和趋势分析。数据帮助您更好地了解受众，优化创作方向。',
      icon: 'bar-chart-3',
      targetPath: '/analytics',
      targetId: 'analytics-dashboard',
      placement: 'center',
      primaryAction: '下一步',
      showPulse: true,
      animation: 'scale'
    },
    
    // 步骤 14: 积分商城 - 兑换奖励
    {
      id: 'points-mall',
      title: '积分商城',
      subtitle: '创作有回报',
      description: '通过创作和互动获得积分，在积分商城兑换各种虚拟道具和实物奖励。',
      icon: 'gift',
      targetPath: '/points-mall',
      targetId: 'points-mall-container',
      placement: 'center',
      primaryAction: '下一步',
      animation: 'bounce'
    },
    
    // 步骤 15: 会员中心 - 尊享特权
    {
      id: 'membership',
      title: '会员中心',
      subtitle: '解锁更多特权',
      description: '成为会员，享受更多创作工具、专属素材、优先审核等尊贵特权。',
      icon: 'crown',
      targetPath: '/membership',
      targetId: 'membership-container',
      placement: 'center',
      primaryAction: '下一步',
      animation: 'scale'
    },
    
    // 步骤 16: 设置 - 个性化配置
    {
      id: 'settings',
      title: '个性化设置',
      subtitle: '打造专属空间',
      description: '切换主题颜色、开启深色模式、自定义偏好设置，让平台成为您最舒适的创作环境。',
      icon: 'settings',
      targetPath: '/settings',
      targetId: 'settings-container',
      placement: 'center',
      primaryAction: '下一步',
      showPulse: true,
      animation: 'fade'
    },
    
    // 步骤 17: 完成引导
    {
      id: 'complete',
      title: '准备就绪',
      subtitle: '开始您的创作之旅',
      description: '您已经了解了平台的核心功能。现在，让我们开始创作属于您的精彩作品吧！',
      icon: 'check-circle',
      targetPath: '/',
      targetId: null,
      placement: 'fullscreen',
      primaryAction: '开始创作',
      animation: 'scale'
    }
  ]
};

export default onboardingConfig;
