/**
 * IP 形象设计示例数据
 * 包含多个完整的 IP 形象设计案例
 */

import type { IPCharacterDesign, IPCharacterListItem } from '@/types/ipCharacter';

// 津小脉 - 天津文化主题 IP
export const jinXiaoMaiDesign: IPCharacterDesign = {
  base: {
    id: 'jin-xiao-mai',
    name: '津小脉',
    englishName: 'JinXiaoMai',
    subtitle: '津脉智坊官方吉祥物',
    description: '在海河之畔，千年文化汇聚成一滴晶莹的水珠。这颗水珠吸收了天津卫的天地灵气，化身为津脉精灵——津小脉。',
    story: `她承载着津门故里的文化记忆，也拥有连接未来的智慧力量。

津小脉诞生于海河与渤海交汇之处，融合了天津独特的码头文化、曲艺文化和美食文化。她的身体由晶莹剔透的水珠构成，象征着天津"九河下梢"的水文化特征。

每当创作者灵感枯竭时，津小脉便会化作流光，将创意的火花重新点燃。她是连接传统与未来的桥梁，是津门文化的数字化身。`,
    createdAt: '2024-01-15',
    updatedAt: '2024-03-20',
  },
  mainVisual: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=800&fit=crop',
  colorScheme: [
    {
      primary: '#4A90D9',
      secondary: '#48C9B0',
      accent: '#76D7C4',
      background: '#F0F9FF',
      text: '#1E3A5F',
      name: '海河蓝',
      description: '源自天津母亲河海河的颜色，代表智慧与包容',
    },
    {
      primary: '#48C9B0',
      secondary: '#76D7C4',
      accent: '#A3E4D7',
      background: '#F0FDFA',
      text: '#134E4A',
      name: '翡翠绿',
      description: '象征生机与创造力，代表天津的活力',
    },
    {
      primary: '#F4D03F',
      secondary: '#F7DC6F',
      accent: '#F9E79F',
      background: '#FFFBEB',
      text: '#92400E',
      name: '星辰金',
      description: '代表天津的历史底蕴和文化传承',
    },
  ],
  threeViews: {
    front: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop',
    side: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop',
    back: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop',
  },
  emojis: [
    {
      id: 'smile',
      name: '微笑',
      image: '😊',
      description: '欢迎、默认状态',
    },
    {
      id: 'happy',
      name: '开心',
      image: '😄',
      description: '创作成功、收到赞赏',
    },
    {
      id: 'thinking',
      name: '思考',
      image: '🤔',
      description: '优化建议、分析问题',
    },
    {
      id: 'surprised',
      name: '惊讶',
      image: '😲',
      description: '发现新功能、收到礼物',
    },
    {
      id: 'cheer',
      name: '加油',
      image: '💪',
      description: '鼓励用户、任务进行中',
    },
    {
      id: 'love',
      name: '喜爱',
      image: '😍',
      description: '喜欢作品、表达感谢',
    },
    {
      id: 'cool',
      name: '酷炫',
      image: '😎',
      description: '展示成果、自信满满',
    },
    {
      id: 'sleep',
      name: '休息',
      image: '😴',
      description: '加载中、等待状态',
    },
  ],
  actionPoses: [
    {
      id: 'welcome',
      name: '欢迎',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=400&fit=crop',
      description: '双臂张开，热情欢迎用户',
    },
    {
      id: 'creation',
      name: '创作',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=400&fit=crop',
      description: '手持画笔，专注创作中',
    },
    {
      id: 'celebration',
      name: '庆祝',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=400&fit=crop',
      description: '跳跃欢呼，庆祝成功',
    },
    {
      id: 'guidance',
      name: '指引',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=400&fit=crop',
      description: '手指前方，引导用户',
    },
    {
      id: 'reading',
      name: '阅读',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=400&fit=crop',
      description: '手捧书卷，认真学习',
    },
    {
      id: 'flying',
      name: '飞翔',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=400&fit=crop',
      description: '腾空而起，自由翱翔',
    },
  ],
  posters: [
    {
      id: 'spring-festival',
      title: '春节限定',
      image: 'https://images.unsplash.com/photo-1548625361-1d6e22ac6ce8?w=600&h=800&fit=crop',
      description: '身着红色唐装，手持灯笼',
      style: '传统节日',
    },
    {
      id: 'haihe-night',
      title: '海河夜景',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=800&fit=crop',
      description: '天津之眼背景，流光溢彩',
      style: '城市风光',
    },
    {
      id: 'quyi',
      title: '曲艺天津',
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=800&fit=crop',
      description: '相声快板，曲艺传承',
      style: '文化主题',
    },
    {
      id: 'tech',
      title: '科技未来',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=800&fit=crop',
      description: '赛博朋克风格，未来感',
      style: '科技主题',
    },
  ],
  merchandise: [
    {
      id: 'plush-toy',
      name: '毛绒玩偶',
      image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=400&fit=crop',
      description: '超软毛绒材质，30cm高',
      category: 'toy',
    },
    {
      id: 'notebook',
      name: '手账本',
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=400&fit=crop',
      description: '精美插画内页，烫金封面',
      category: 'stationery',
    },
    {
      id: 'tshirt',
      name: '文化T恤',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
      description: '纯棉材质，津味设计',
      category: 'apparel',
    },
    {
      id: 'keychain',
      name: '钥匙扣',
      image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=400&h=400&fit=crop',
      description: '亚克力材质，双面印刷',
      category: 'accessories',
    },
    {
      id: 'sticker',
      name: '表情包贴纸',
      image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop',
      description: '防水材质，全套8张',
      category: 'stationery',
    },
    {
      id: 'phone-case',
      name: '手机壳',
      image: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=400&h=400&fit=crop',
      description: 'TPU软壳，全包保护',
      category: 'accessories',
    },
  ],
  designDescription: {
    inspiration: '天津海河文化、码头文化、曲艺文化',
    concept: '以"水滴"为核心元素，融合天津"九河下梢"的地理特征，创造一个既具有地域文化特色，又充满未来科技感的IP形象',
    target: '18-35岁的年轻创作者群体，特别是对天津文化感兴趣的用户',
    features: [
      '水滴造型的身体，晶莹剔透',
      '海河蓝色的渐变头发',
      '流光溢彩的飘带装饰',
      '智能化的表情系统',
      '可变换的节日限定皮肤',
    ],
    culturalElements: [
      '海河波纹元素',
      '天津之眼轮廓',
      '杨柳青年画色彩',
      '泥人张造型风格',
    ],
  },
  applicationScenes: [
    {
      id: 'homepage',
      name: '首页欢迎',
      icon: '🏠',
      description: '用户首次访问时的欢迎动画',
      examples: ['引导注册', '功能介绍', '活动推广'],
    },
    {
      id: 'creation',
      name: 'AI创作助手',
      icon: '🎨',
      description: '创作过程中的智能引导',
      examples: ['提示词建议', '风格推荐', '优化指导'],
    },
    {
      id: 'ip-incubation',
      name: 'IP孵化进度',
      icon: '📦',
      description: '配合5阶段孵化流程展示',
      examples: ['阶段提示', '进度展示', '成果预览'],
    },
    {
      id: 'mall',
      name: '商城装饰',
      icon: '🛒',
      description: '文创商城的氛围营造',
      examples: ['商品推荐', '活动宣传', '优惠券发放'],
    },
    {
      id: 'community',
      name: '社区互动',
      icon: '💬',
      description: '社区聊天和互动提示',
      examples: ['消息提醒', '点赞反馈', '评论互动'],
    },
    {
      id: 'loading',
      name: '加载动画',
      icon: '⏳',
      description: '页面加载时的等待动画',
      examples: ['数据加载', '图片处理', 'AI生成'],
    },
    {
      id: 'achievement',
      name: '成就系统',
      icon: '🏆',
      description: '用户成就达成时的庆祝',
      examples: ['等级提升', '徽章获得', '任务完成'],
    },
    {
      id: 'festival',
      name: '节日营销',
      icon: '🎁',
      description: '节日限定活动和红包封面',
      examples: ['春节红包', '中秋祝福', '国庆活动'],
    },
  ],
  costumes: [
    {
      id: 'spring-festival',
      name: '春节限定',
      image: 'https://images.unsplash.com/photo-1548625361-1d6e22ac6ce8?w=300&h=400&fit=crop',
      description: '红色唐装配金色装饰',
      theme: '传统节日',
    },
    {
      id: 'dragon-boat',
      name: '端午限定',
      image: 'https://images.unsplash.com/photo-1560167016-022b78a0258e?w=300&h=400&fit=crop',
      description: '青绿色汉服配香囊',
      theme: '传统节日',
    },
    {
      id: 'mid-autumn',
      name: '中秋限定',
      image: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=300&h=400&fit=crop',
      description: '月白色长裙配玉兔',
      theme: '传统节日',
    },
    {
      id: 'cyberpunk',
      name: '赛博朋克',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=400&fit=crop',
      description: '霓虹灯光与机械元素',
      theme: '科技未来',
    },
    {
      id: 'quyi',
      name: '曲艺天津',
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=400&fit=crop',
      description: '大褂长衫配折扇',
      theme: '传统文化',
    },
  ],
  lineDrawings: [
    {
      id: 'front',
      name: '正面线稿',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop',
      description: '标准正面视角线稿图',
    },
    {
      id: 'side',
      name: '侧面线稿',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop',
      description: '90度侧面视角线稿图',
    },
    {
      id: 'back',
      name: '背面线稿',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop',
      description: '背面视角线稿图',
    },
    {
      id: 'expressions',
      name: '表情线稿',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop',
      description: '多种表情变化线稿',
    },
  ],
  designer: {
    name: '津脉设计团队',
    bio: '专注于天津文化数字化传承的设计团队',
  },
  tags: ['天津', '文化', '水滴', '科技', '传统', '吉祥物'],
  category: 'culture',
};

// 辽辽 - 斑海豹 IP
export const liaoLiaoDesign: IPCharacterDesign = {
  base: {
    id: 'liao-liao',
    name: '辽辽',
    englishName: 'LiaoLiao',
    subtitle: '渤海湾斑海豹吉祥物',
    description: '我是渤小斑，渤海湾特有的斑海豹！冰面滑行快如闪电，水下潜游灵动矫健。',
    story: `圆滚滚的身子和斑点皮毛是我的标志，最爱懒洋洋晒太阳，但守护冰海家园才是正经事！

辽辽诞生于渤海湾的冰海之中，是这片海域的守护精灵。他性格活泼开朗，喜欢运动和冒险，同时也非常关心海洋环境的保护。`,
    createdAt: '2024-02-01',
    updatedAt: '2024-03-15',
  },
  mainVisual: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=1200&h=800&fit=crop',
  colorScheme: [
    {
      primary: '#1E88E5',
      secondary: '#64B5F6',
      accent: '#90CAF9',
      background: '#E3F2FD',
      text: '#0D47A1',
      name: '海洋蓝',
      description: '渤海湾的深邃蓝色',
    },
    {
      primary: '#FFFFFF',
      secondary: '#F5F5F5',
      accent: '#E0E0E0',
      background: '#FAFAFA',
      text: '#424242',
      name: '冰雪白',
      description: '纯净的冰海白色',
    },
    {
      primary: '#FFB300',
      secondary: '#FFD54F',
      accent: '#FFECB3',
      background: '#FFF8E1',
      text: '#FF6F00',
      name: '阳光金',
      description: '温暖的阳光色调',
    },
  ],
  threeViews: {
    front: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=400&h=600&fit=crop',
    side: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=400&h=600&fit=crop',
    back: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=400&h=600&fit=crop',
  },
  emojis: [
    { id: 'smile', name: '微笑', image: '😊', description: '友好问候' },
    { id: 'happy', name: '开心', image: '😄', description: '获得奖牌' },
    { id: 'cool', name: '酷炫', image: '😎', description: '运动风采' },
    { id: 'sleep', name: '休息', image: '😴', description: '晒太阳' },
    { id: 'swim', name: '游泳', image: '🏊', description: '水下潜游' },
    { id: 'cheer', name: '加油', image: '💪', description: '比赛助威' },
  ],
  actionPoses: [
    { id: 'victory', name: '胜利', image: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=300&h=400&fit=crop', description: '高举奖牌' },
    { id: 'running', name: '奔跑', image: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=300&h=400&fit=crop', description: '冰面滑行' },
    { id: 'celebration', name: '庆祝', image: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=300&h=400&fit=crop', description: '欢呼跳跃' },
    { id: 'cycling', name: '骑车', image: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=300&h=400&fit=crop', description: '骑自行车' },
    { id: 'cheering', name: '加油', image: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=300&h=400&fit=crop', description: '摇旗助威' },
    { id: 'basketball', name: '打球', image: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=300&h=400&fit=crop', description: '打篮球' },
    { id: 'soccer', name: '踢球', image: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=300&h=400&fit=crop', description: '踢足球' },
    { id: 'swimming', name: '游泳', image: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=300&h=400&fit=crop', description: '自由泳' },
  ],
  posters: [
    { id: 'sports', title: '运动主题', image: 'https://images.unsplash.com/photo-1461896836934- voices-7f520f69f6b8?w=600&h=800&fit=crop', description: '各项运动展示', style: '运动' },
    { id: 'ocean', title: '海洋保护', image: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=600&h=800&fit=crop', description: '守护蓝色家园', style: '环保' },
    { id: 'winter', title: '冰雪世界', image: 'https://images.unsplash.com/photo-1517299321609-52687d1bc55a?w=600&h=800&fit=crop', description: '冰海嬉戏', style: '冬季' },
  ],
  merchandise: [
    { id: 'plush', name: '斑海豹玩偶', image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=400&fit=crop', description: '仿真毛绒材质', category: 'toy' },
    { id: 'medal', name: '纪念奖牌', image: 'https://images.unsplash.com/photo-1560167016-022b78a0258e?w=400&h=400&fit=crop', description: '金属材质', category: 'accessories' },
    { id: 'towel', name: '运动毛巾', image: 'https://images.unsplash.com/photo-1563291074-2bf8677ac0e5?w=400&h=400&fit=crop', description: '吸汗速干', category: 'apparel' },
  ],
  designDescription: {
    inspiration: '渤海湾斑海豹、海洋运动、环保理念',
    concept: '以斑海豹为原型，结合运动元素，创造一个活泼可爱、充满正能量的吉祥物形象',
    target: '运动爱好者、环保倡导者、儿童群体',
    features: [
      '圆滚滚的斑海豹身体',
      '护目镜和围巾装饰',
      '运动装备搭配',
      '活泼可爱的表情',
      '环保主题配色',
    ],
    culturalElements: [
      '渤海湾地理特征',
      '斑海豹生物特征',
      '运动赛事元素',
      '海洋环保理念',
    ],
  },
  applicationScenes: [
    { id: 'sports', name: '体育赛事', icon: '🏅', description: '运动会吉祥物', examples: ['开幕式', '颁奖仪式', '宣传海报'] },
    { id: 'education', name: '环保教育', icon: '🌊', description: '海洋保护宣传', examples: ['科普活动', '环保讲座', '公益广告'] },
    { id: 'tourism', name: '旅游推广', icon: '🏖️', description: '滨海旅游代言', examples: ['景区导览', '旅游纪念品', '宣传册'] },
  ],
  tags: ['斑海豹', '海洋', '运动', '环保', '吉祥物'],
  category: 'mascot',
};

// 所有 IP 形象列表
export const ipCharacterList: IPCharacterListItem[] = [
  {
    id: 'jin-xiao-mai',
    name: '津小脉',
    englishName: 'JinXiaoMai',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop',
    category: 'culture',
    tags: ['天津', '文化', '水滴', '科技'],
    createdAt: '2024-01-15',
  },
  {
    id: 'liao-liao',
    name: '辽辽',
    englishName: 'LiaoLiao',
    thumbnail: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=400&h=400&fit=crop',
    category: 'mascot',
    tags: ['斑海豹', '海洋', '运动', '环保'],
    createdAt: '2024-02-01',
  },
];

// 获取 IP 形象详情
export function getIPCharacterById(id: string): IPCharacterDesign | undefined {
  const characters: Record<string, IPCharacterDesign> = {
    'jin-xiao-mai': jinXiaoMaiDesign,
    'liao-liao': liaoLiaoDesign,
  };
  return characters[id];
}

// 获取所有 IP 形象列表
export function getAllIPCharacters(): IPCharacterListItem[] {
  return ipCharacterList;
}

// 按分类筛选
export function getIPCharactersByCategory(category: string): IPCharacterListItem[] {
  return ipCharacterList.filter(item => item.category === category);
}
