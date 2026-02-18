export interface Template {
  id: string;
  title: string;
  style: string;
  icon: string;
  desc: string;
  // 详细描述字段
  detailDescription?: {
    designPhilosophy: string;
    coreFeatures: string[];
    applicableScenarios: string[];
    visualStyle: string;
    usageSteps: string[];
    expectedEffect: string;
  };
}

export interface Competition {
  id: string;
  title: string;
  desc: string;
  deadline: string;
  organizer: string;
  prize: string;
  status: 'ongoing' | 'upcoming' | 'ended';
  category: string;
}

export interface CreativeTemplate {
  id: string;
  name: string;
  icon: string;
  desc: string;
  content: string;
  // 详细描述字段
  detailDescription?: {
    designPhilosophy: string;
    coreFeatures: string[];
    applicableScenarios: string[];
    visualStyle: string;
    usageSteps: string[];
    expectedEffect: string;
  };
}

export interface BrandFont {
  id: string;
  name: string;
  desc: string;
}

export interface GeneratedResult {
  id: number;
  thumbnail: string;
  score: number;
}

export interface TraditionalPattern {
  id: number;
  name: string;
  thumbnail: string;
  description: string;
}

export interface AIFilter {
  id: number;
  name: string;
  thumbnail: string;
  description: string;
  intensity: number;
  category: string;
}

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
}

// 新的工具类型 - 6个核心智能工具 + 基础功能
export type ToolType = 'sketch' | 'upload' | 'enhance' | 'style' | 'layout' | 'culture' | 'refinement' | 'prompt' | 'ai-assistant';

export interface ToolOption {
  id: ToolType;
  name: string;
  icon: string;
  description: string;
  color: string;
  features: string[];
}

// 保持向后兼容的旧工具类型
export type LegacyToolType = 'pattern' | 'filter' | 'trace' | 'remix' | 'mockup' | 'tile';

// 扩展模板库 - 30+模板
export const EXTENDED_TEMPLATES = [
  // 节日主题 (6个)
  { 
    id: 'festival-1', 
    name: '春节喜庆', 
    category: 'festival', 
    thumbnail: 'https://images.unsplash.com/photo-1548504769-900b70ed122e?w=400&h=300&fit=crop',
    description: '传统春节元素，红色喜庆氛围',
    features: ['中国红', '金色点缀', '传统纹样', '福字元素'],
    popular: true 
  },
  { 
    id: 'festival-2', 
    name: '中秋团圆', 
    category: 'festival', 
    thumbnail: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=400&h=300&fit=crop',
    description: '月圆人团圆，典雅中秋主题',
    features: ['月亮元素', '桂花飘香', '蓝金配色', '团圆寓意'],
    popular: true 
  },
  { 
    id: 'festival-3', 
    name: '端午龙舟', 
    category: 'festival', 
    thumbnail: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&h=300&fit=crop',
    description: '龙舟竞渡，传承民俗文化',
    features: ['龙舟元素', '翠绿配色', '粽子图案', '艾草香囊'],
  },
  { 
    id: 'festival-4', 
    name: '元宵灯会', 
    category: 'festival', 
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop',
    description: '灯火阑珊，浪漫元宵夜',
    features: ['灯笼元素', '暖黄灯光', '灯谜互动', '团圆氛围'],
  },
  { 
    id: 'festival-5', 
    name: '重阳敬老', 
    category: 'festival', 
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    description: '登高望远，敬老爱老',
    features: ['菊花元素', '登高意境', '暖色调', '敬老主题'],
  },
  { 
    id: 'festival-6', 
    name: '国庆盛典', 
    category: 'festival', 
    thumbnail: 'https://images.unsplash.com/photo-1533294160622-d5fece760881?w=400&h=300&fit=crop',
    description: '盛世华诞，举国同庆',
    features: ['五星红旗', '红色主调', '烟花元素', '爱国情怀'],
    popular: true 
  },
  
  // 行业模板 (8个)
  { 
    id: 'industry-1', 
    name: '餐饮美食', 
    category: 'industry', 
    thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
    description: '食欲感设计，美味诱惑',
    features: ['暖色调', '食材展示', '食欲感', '烟火气'],
    popular: true 
  },
  { 
    id: 'industry-2', 
    name: '茶叶茗品', 
    category: 'industry', 
    thumbnail: 'https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?w=400&h=300&fit=crop',
    description: '清雅茶道，文化传承',
    features: ['山水意境', '清雅配色', '茶具元素', '禅意氛围'],
  },
  { 
    id: 'industry-3', 
    name: '酒类佳酿', 
    category: 'industry', 
    thumbnail: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop',
    description: '高贵典雅，品质之选',
    features: ['金色点缀', '高贵典雅', '历史感', '品质彰显'],
    popular: true 
  },
  { 
    id: 'industry-4', 
    name: '文创礼品', 
    category: 'industry', 
    thumbnail: 'https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=400&h=300&fit=crop',
    description: '文化创意，精致礼品',
    features: ['传统元素', '现代演绎', '精致工艺', '文化内涵'],
    new: true 
  },
  { 
    id: 'industry-5', 
    name: '零售百货', 
    category: 'industry', 
    thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
    description: '现代商业，吸引客流',
    features: ['明快配色', '现代感', '促销元素', '吸引力强'],
  },
  { 
    id: 'industry-6', 
    name: '美妆护肤', 
    category: 'industry', 
    thumbnail: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop',
    description: '精致优雅，美丽绽放',
    features: ['粉色系', '精致感', '优雅气质', '女性化'],
    new: true 
  },
  { 
    id: 'industry-7', 
    name: '家居生活', 
    category: 'industry', 
    thumbnail: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=300&fit=crop',
    description: '温馨舒适，品质生活',
    features: ['温馨色调', '舒适感', '生活气息', '品质感'],
  },
  { 
    id: 'industry-8', 
    name: '数码科技', 
    category: 'industry', 
    thumbnail: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop',
    description: '科技感强，未来已来',
    features: ['蓝紫配色', '几何线条', '科技感', '未来感'],
    new: true 
  },
  
  // 风格模板 (8个)
  { 
    id: 'style-1', 
    name: '国潮风尚', 
    category: 'style', 
    thumbnail: 'https://images.unsplash.com/photo-1582739501019-5c4aa6e949d9?w=400&h=300&fit=crop',
    description: '传统与现代的完美融合',
    features: ['传统元素', '现代演绎', '文化自信', '年轻时尚'],
    popular: true 
  },
  { 
    id: 'style-2', 
    name: '极简主义', 
    category: 'style', 
    thumbnail: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400&h=300&fit=crop',
    description: '少即是多，纯净美学',
    features: ['留白艺术', '纯净配色', '简约线条', '高端大气'],
  },
  { 
    id: 'style-3', 
    name: '复古怀旧', 
    category: 'style', 
    thumbnail: 'https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=400&h=300&fit=crop',
    description: '老上海风情，怀旧记忆',
    features: ['怀旧色调', '老上海风', '复古元素', '情怀满满'],
  },
  { 
    id: 'style-4', 
    name: '手绘插画', 
    category: 'style', 
    thumbnail: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop',
    description: '温暖亲切，独特个性',
    features: ['手绘风格', '温暖色调', '独特个性', '艺术感强'],
    new: true 
  },
  { 
    id: 'style-5', 
    name: '水墨意境', 
    category: 'style', 
    thumbnail: 'https://images.unsplash.com/photo-1564074714615-5759a33fe09a?w=400&h=300&fit=crop',
    description: '东方美学，意境深远',
    features: ['水墨风格', '黑白灰调', '意境深远', '东方美学'],
  },
  { 
    id: 'style-6', 
    name: '剪纸艺术', 
    category: 'style', 
    thumbnail: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300&fit=crop',
    description: '民间艺术，精巧细腻',
    features: ['剪纸元素', '红色主调', '精巧细腻', '民间艺术'],
    new: true 
  },
  { 
    id: 'style-7', 
    name: '青花瓷韵', 
    category: 'style', 
    thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    description: '天青色等烟雨，经典传承',
    features: ['青花元素', '蓝白配色', '经典传承', '雅致高贵'],
  },
  { 
    id: 'style-8', 
    name: '敦煌飞天', 
    category: 'style', 
    thumbnail: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300&fit=crop',
    description: '丝路瑰宝，艺术殿堂',
    features: ['敦煌元素', '飞天图案', '丰富色彩', '艺术殿堂'],
    new: true 
  },
  
  // 场景模板 (8个)
  { 
    id: 'scene-1', 
    name: '产品包装', 
    category: 'scene', 
    thumbnail: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=300&fit=crop',
    description: '精美包装，提升价值',
    features: ['包装设计', '品牌展示', '环保材质', '精美工艺'],
    popular: true 
  },
  { 
    id: 'scene-2', 
    name: '社交媒体', 
    category: 'scene', 
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop',
    description: '社交传播，引爆话题',
    features: ['年轻化', '传播性强', '平台适配', '互动元素'],
  },
  { 
    id: 'scene-3', 
    name: '门店空间', 
    category: 'scene', 
    thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
    description: '空间设计，沉浸体验',
    features: ['空间设计', '品牌氛围', '沉浸体验', '视觉统一'],
  },
  { 
    id: 'scene-4', 
    name: '户外广告', 
    category: 'scene', 
    thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=300&fit=crop',
    description: '视觉冲击，吸引眼球',
    features: ['视觉冲击', '远距离识别', '简洁有力', '吸引眼球'],
  },
  { 
    id: 'scene-5', 
    name: '电商详情', 
    category: 'scene', 
    thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
    description: '卖点突出，促进转化',
    features: ['卖点展示', '图文结合', '转化导向', '信息清晰'],
  },
  { 
    id: 'scene-6', 
    name: '宣传海报', 
    category: 'scene', 
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
    description: '海报设计，传播品牌',
    features: ['海报设计', '视觉冲击', '信息传达', '品牌展示'],
  },
  { 
    id: 'scene-7', 
    name: '名片设计', 
    category: 'scene', 
    thumbnail: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=300&fit=crop',
    description: '精致名片，商务必备',
    features: ['名片设计', '精致小巧', '信息完整', '商务风格'],
  },
  { 
    id: 'scene-8', 
    name: '画册手册', 
    category: 'scene', 
    thumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop',
    description: '品牌画册，全面展示',
    features: ['画册设计', '内容丰富', '视觉统一', '品牌展示'],
  },
];

// 保持向后兼容
export const TEMPLATES: Template[] = [
  {
    id: 't1',
    title: '节日促销海报',
    style: 'festive promotion poster, vibrant red and gold',
    icon: 'gifts',
    desc: '适合春节、中秋等传统节日营销',
    detailDescription: {
      designPhilosophy: '本模板以"喜庆祥和、吸引眼球"为核心设计理念，专为传统节日促销活动而设计。设计灵感源自中国传统节庆文化，将红色、金色等喜庆色彩与现代商业海报设计手法相结合，打造既有节日氛围又具商业吸引力的促销海报。',
      coreFeatures: [
        '智能节日配色：自动匹配春节红、中秋金等传统节日色彩，支持渐变、撞色等多种配色方案',
        '促销元素库：内置折扣标签、倒计时、优惠券等100+促销元素，支持一键添加',
        '文案模板：提供节日促销文案模板，涵盖满减、折扣、赠品等多种促销形式',
        '多尺寸适配：自动适配A4、A3、易拉宝、灯箱等多种线下物料尺寸'
      ],
      applicableScenarios: [
        '春节、中秋等传统节日促销活动',
        '店庆、周年庆等商业庆典活动',
        '新品上市、限时抢购等营销活动',
        '商场、超市等线下门店促销',
        '电商平台节日专题页面'
      ],
      visualStyle: '采用"喜庆商业风格"，以红色、金色为主色调，搭配白色或深色背景形成强烈对比。促销信息使用大号字体突出显示，配合爆炸贴、箭头、星星等装饰元素增强视觉冲击力。整体布局遵循F型视觉动线，确保促销信息一目了然。',
      usageSteps: [
        '选择品牌并上传Logo',
        '选择节日主题（春节/中秋/端午等）',
        '输入促销信息（折扣力度、活动时间等）',
        '从元素库中选择促销装饰元素',
        '调整布局并导出多种尺寸'
      ],
      expectedEffect: '使用该模板可快速产出具有强烈节日氛围和商业吸引力的促销海报，有效提升促销活动的关注度和转化率。传统与现代的结合既能唤起消费者的文化认同感，又能满足现代审美需求。'
    }
  },
  {
    id: 't2',
    title: '极简产品包装',
    style: 'minimalist product packaging design, clean white background',
    icon: 'box-open',
    desc: '现代简约风格，突出产品本身',
    detailDescription: {
      designPhilosophy: '本模板遵循"少即是多"的极简主义设计哲学，通过大量留白、简洁线条和克制的色彩运用，让产品本身成为视觉焦点。设计摒弃多余的装饰元素，强调材质质感与工艺细节，传达品牌的高端品质感和现代审美。',
      coreFeatures: [
        '极简布局系统：采用黄金分割比例，自动计算最佳留白区域',
        '材质质感库：提供纸张、金属、玻璃、陶瓷等多种材质纹理',
        '字体排版工具：智能推荐适合极简风格的字体组合',
        '工艺效果预览：支持烫金、压纹、UV等工艺效果可视化预览'
      ],
      applicableScenarios: [
        '高端消费品包装设计',
        '科技产品简约包装',
        '护肤品、化妆品包装',
        '食品精品礼盒包装',
        '文创产品极简包装'
      ],
      visualStyle: '采用"现代极简风格"，以白色、米色、灰色等中性色为主色调，搭配单色系或双色配色方案。字体选择无衬线字体，字号对比强烈。包装结构简洁，强调开箱体验。整体呈现干净、高级、国际化的视觉感受。',
      usageSteps: [
        '上传产品图片或3D模型',
        '选择包装材质和工艺',
        '设计品牌Logo和文字信息位置',
        '调整留白比例和视觉层次',
        '预览并导出包装展开图'
      ],
      expectedEffect: '使用该模板可设计出具有高级感和国际范的产品包装，提升产品档次和品牌价值。极简设计不仅降低印刷成本，还能在众多竞品中脱颖而出，吸引追求品质生活的消费者。'
    }
  },
  {
    id: 't3',
    title: '社交媒体封面',
    style: 'social media cover, trendy layout, bold typography',
    icon: 'hashtag',
    desc: '适配各平台尺寸的封面设计',
    detailDescription: {
      designPhilosophy: '本模板以"吸睛第一、传播为王"为设计理念，针对社交媒体平台的传播特性进行优化。设计强调视觉冲击力、信息传达效率和品牌识别度，确保在各种尺寸和场景下都能保持良好的展示效果。',
      coreFeatures: [
        '多平台适配：自动适配微信、微博、抖音、小红书等主流平台封面尺寸',
        '动态效果支持：提供GIF、视频封面等动态效果设计模板',
        '热点元素库：实时更新热门话题、流行色彩、 trending 元素',
        '数据可视化：支持将数据、图表融入封面设计'
      ],
      applicableScenarios: [
        '品牌官方账号封面设计',
        '活动专题页面封面',
        '产品发布预告封面',
        '直播预告封面',
        '个人IP形象封面'
      ],
      visualStyle: '采用"潮流社交风格"，色彩鲜明大胆，字体粗壮有力。布局灵活多变，支持居中、左右分割、全屏等多种构图方式。善用emoji、贴纸、标签等社交元素增强互动感。整体风格年轻、活力、具有传播性。',
      usageSteps: [
        '选择目标社交平台',
        '上传品牌素材或选择模板背景',
        '编辑标题文案和标签',
        '添加装饰元素和特效',
        '预览各平台展示效果并导出'
      ],
      expectedEffect: '使用该模板可设计出高点击率、高传播性的社交媒体封面，提升品牌在社交平台的曝光度和互动率。适配多平台的特性确保一次设计，全平台使用，大大提高工作效率。'
    }
  },
  {
    id: 't4',
    title: '国潮插画KV',
    style: 'Guochao illustration, traditional chinese patterns mixed with modern art',
    icon: 'paint-brush',
    desc: '传统与现代融合的插画风格',
    detailDescription: {
      designPhilosophy: '本模板以"传统新生、文化自信"为核心理念，将中国传统绘画技法、纹样元素与现代插画风格相融合。设计既保留传统文化的神韵，又注入现代艺术的活力，打造具有强烈文化辨识度和时代感的视觉作品。',
      coreFeatures: [
        '国潮元素库：内置龙凤、祥云、山水、花鸟等500+传统元素',
        '笔刷工具：提供水墨、工笔、剪纸等传统绘画风格笔刷',
        '配色方案：收录传统中国色、宫廷色、敦煌色等经典配色',
        '构图模板：提供对称、散点、留白等传统构图方式'
      ],
      applicableScenarios: [
        '品牌主视觉KV设计',
        '文创产品插画设计',
        '节日主题海报设计',
        '品牌联名活动视觉',
        '城市文化宣传设计'
      ],
      visualStyle: '采用"新国潮插画风格"，线条流畅有力，色彩浓郁饱满。融合工笔画的精细与写意画的洒脱，将传统元素以现代扁平化、几何化的方式重新演绎。整体风格既有东方韵味，又具国际视野。',
      usageSteps: [
        '确定主题和核心元素',
        '选择传统元素进行组合',
        '绘制或调整插画主体',
        '应用传统配色方案',
        '添加文案并调整整体构图'
      ],
      expectedEffect: '使用该模板可创作出具有强烈文化特色和视觉冲击力的国潮插画作品，有效传递品牌文化内涵，引发消费者情感共鸣。在国潮兴起的当下，这种风格能显著提升品牌的文化价值和话题性。'
    }
  },
];

export const COMPETITIONS: Competition[] = [
  {
    id: 'jinmai_1770559558068',
    title: '2025 天津老字号品牌创新设计大赛',
    desc: '面向设计师和创意团队征集天津老字号品牌的创新设计方案，包括品牌视觉、包装设计、文创产品等',
    deadline: '2025-12-31',
    organizer: '津脉平台',
    prize: '金奖5万元、银奖3万元、铜奖1万元',
    status: 'ongoing',
    category: '品牌设计'
  }
];

export const CREATIVE_TEMPLATES: CreativeTemplate[] = [
  // 节日主题
  {
    id: 'ct1',
    name: '春节营销',
    icon: 'fa-gift',
    desc: '新春佳节专属营销方案',
    content: '${brand} 春节营销设计；主色中国红+金色；包含传统纹样与节日元素；营造喜庆氛围。',
    detailDescription: {
      designPhilosophy: '本模板以"辞旧迎新、喜庆祥和"为核心设计理念，深度融合中国传统春节文化元素与现代商业营销需求。设计灵感源自千年春节民俗，将团圆、祝福、兴旺的美好寓意转化为视觉语言，为品牌打造具有强烈节日氛围的营销视觉方案。',
      coreFeatures: [
        '智能配色系统：自动匹配中国红（#C02C38）与富贵金的经典组合，支持渐变、撞色等多种配色方案',
        '传统纹样库：内置祥云、福字、剪纸、灯笼等200+传统元素，支持一键替换与组合',
        '文案生成器：基于AI的春节营销文案智能生成，涵盖对联、祝福语、促销语等',
        '多场景适配：自动适配海报、社交媒体、电商详情页、线下物料等多种尺寸'
      ],
      applicableScenarios: [
        '春节促销活动视觉设计',
        '新年礼盒包装设计',
        '品牌春节主题社交媒体传播',
        '线下门店春节氛围营造',
        '春节限定产品发布'
      ],
      visualStyle: '采用"新中式喜庆风格"，在保留传统红色基调的基础上，融入现代简约设计手法。通过大面积留白与重点元素的对比，营造出既有传统韵味又不失现代感的视觉效果。金色点缀提升品质感，传统纹样以现代几何化方式呈现，避免过于繁复。',
      usageSteps: [
        '选择品牌并上传Logo',
        '从纹样库中选择适合的春节元素',
        '输入促销信息或让AI生成文案',
        '调整配色方案（推荐保持红金配色）',
        '选择输出尺寸并生成'
      ],
      expectedEffect: '使用该模板可快速产出具有专业水准的春节营销物料，预计设计效率提升80%以上。视觉呈现能够有效激发消费者的节日情感共鸣，提升品牌好感度与购买转化率。传统与现代的完美融合，既彰显品牌文化底蕴，又符合当代审美趋势。'
    }
  },
  {
    id: 'ct2',
    name: '中秋礼盒',
    icon: 'fa-moon',
    desc: '中秋团圆主题设计',
    content: '${brand} 中秋礼盒设计；月兔、桂花元素；典雅蓝金配色；传递团圆祝福。',
    detailDescription: {
      designPhilosophy: '以"月圆人团圆"的千古情怀为设计原点，将中秋节的诗意美学与品牌礼赠文化相结合。设计灵感取自古典诗词中的中秋意境——"但愿人长久，千里共婵娟"，通过月、桂、兔等经典意象，营造典雅高贵的礼盒视觉体验。',
      coreFeatures: [
        '月相设计系统：提供新月、弦月、满月等多种月相视觉元素',
        '桂花元素库：包含桂花、桂叶、桂花香囊等精致图案',
        '立体盒型预览：3D展示礼盒展开效果与立体效果',
        '烫金工艺模拟：智能模拟烫金、压纹等高端工艺效果'
      ],
      applicableScenarios: [
        '中秋礼品包装设计',
        '月饼礼盒外观设计',
        '高端客户答谢礼品',
        '员工福利礼品定制',
        '品牌联名中秋礼盒'
      ],
      visualStyle: '主打"雅致蓝金风格"，以靛蓝、月白为主色调，搭配香槟金点缀，营造出宁静致远的东方美学意境。设计强调留白与呼吸感，通过细腻的线条勾勒和精致的图案装饰，传递出低调奢华的品质感。',
      usageSteps: [
        '选择礼盒类型（方形/圆形/异形）',
        '上传品牌Logo和中秋主题元素',
        '选择月相与桂花装饰方案',
        '配置烫金/压纹工艺参数',
        '生成3D预览并导出设计稿'
      ],
      expectedEffect: '礼盒设计呈现出高雅的东方美学气质，能够有效提升礼品的附加值与收藏价值。精致的视觉呈现让收礼者感受到品牌的用心与诚意，强化品牌与传统文化的美好联想。'
    }
  },
  {
    id: 'ct3',
    name: '端午安康',
    icon: 'fa-water',
    desc: '端午节传统文化设计',
    content: '${brand} 端午主题设计；龙舟、粽子元素；翠绿配色；传承民俗文化。',
    detailDescription: {
      designPhilosophy: '传承屈原精神，弘扬端午文化。本模板以"安康吉祥"为设计主旨，将龙舟竞渡的激昂、粽叶飘香的温馨、艾草菖蒲的清香融入现代设计语言，为品牌打造兼具文化内涵与商业价值的端午主题视觉方案。',
      coreFeatures: [
        '龙舟动态元素：提供龙舟竞渡的动态视觉方案',
        '粽叶纹理库：真实粽叶纹理与卡通化图案双版本',
        '香囊挂饰设计：传统香囊造型的现代演绎',
        '五毒驱邪元素：融入传统辟邪文化的现代设计'
      ],
      applicableScenarios: [
        '端午节产品包装设计',
        '粽子礼盒外观设计',
        '品牌端午营销活动',
        '企业端午福利定制',
        '文创产品开发'
      ],
      visualStyle: '采用"清新翠绿风格"，以粽叶绿、艾草青为主色调，搭配米白、赭石等自然色系。设计强调自然材质感与手工艺温度，通过手绘风格的图案和质朴的配色，传递出返璞归真的生活态度。',
      usageSteps: [
        '选择设计方向（传统/现代/卡通）',
        '配置品牌信息与端午文案',
        '选择龙舟或粽叶作为主视觉',
        '添加香囊、艾草等装饰元素',
        '生成并预览效果'
      ],
      expectedEffect: '设计作品能够有效传达端午节的传统文化内涵，同时满足现代商业传播需求。清新的视觉风格符合当代消费者对健康、自然的追求，有助于提升品牌形象与产品销量。'
    }
  },
  {
    id: 'ct4',
    name: '国庆盛典',
    icon: 'fa-flag',
    desc: '国庆节爱国主题设计',
    content: '${brand} 国庆主题设计；红色主调；五星元素；展现爱国情怀。',
    detailDescription: {
      designPhilosophy: '以"盛世华诞、举国同庆"为设计核心，将爱国主义情怀与品牌社会责任相结合。设计灵感源自五星红旗的庄严、天安门城楼的宏伟、烟花绽放的绚烂，打造具有强烈视觉冲击力和情感感染力的国庆主题视觉方案。',
      coreFeatures: [
        '国旗元素系统：规范使用五星、红旗等爱国元素',
        '烟花绽放效果：多种烟花绽放的视觉特效方案',
        '城市天际线库：包含北京、上海等城市地标剪影',
        '红色渐变工具：专业的红色系渐变配色方案'
      ],
      applicableScenarios: [
        '国庆节品牌营销活动',
        '爱国主题公益宣传',
        '企业国庆庆典活动',
        '国庆限定产品发布',
        '红色文化旅游推广'
      ],
      visualStyle: '主打"庄严红色风格"，以国旗红为主色调，搭配金色、白色形成强烈对比。设计强调庄重感与仪式感，通过大气的版式布局和富有张力的视觉元素，传递出浓烈的爱国情怀与民族自豪感。',
      usageSteps: [
        '选择设计场景（线上/线下/产品）',
        '配置品牌Logo与国庆文案',
        '选择城市天际线或烟花元素',
        '调整红色渐变方案',
        '生成多尺寸物料'
      ],
      expectedEffect: '设计作品具有强烈的视觉冲击力和情感共鸣力，能够有效激发受众的爱国热情。规范的国旗元素使用展现品牌的社会责任感，有助于提升品牌美誉度与公众认同度。'
    }
  },

  // 行业模板
  {
    id: 'ct5',
    name: '餐饮美食',
    icon: 'fa-utensils',
    desc: '餐饮行业专属设计方案',
    content: '${brand} 餐饮品牌设计；食欲感配色；食材元素；突出美味诱惑。',
    detailDescription: {
      designPhilosophy: '以"色、香、味"的感官体验为设计原点，将美食的诱人特质转化为视觉语言。设计强调食欲感与烟火气的营造，通过精心设计的色彩、构图和光影，让观者在视觉上就能感受到食物的美味与温度。',
      coreFeatures: [
        '食欲感配色：暖橙、焦糖、奶油等提升食欲的专业配色',
        '蒸汽烟雾效果：智能添加食物热气腾腾的视觉效果',
        '食材展示布局：专业的食材陈列与摆盘设计方案',
        '烟火气滤镜：模拟真实餐厅环境的氛围滤镜'
      ],
      applicableScenarios: [
        '餐厅品牌视觉设计',
        '菜单与点餐界面设计',
        '美食摄影后期处理',
        '外卖平台店铺装修',
        '美食节活动宣传'
      ],
      visualStyle: '采用"温暖食欲风格"，以暖色调为主，强调食物的新鲜感与美味度。设计注重光影的细腻表现，通过高光、阴影的精心处理，让食物呈现出诱人的质感。同时融入木质、陶瓷等自然材质元素，营造温馨的用餐氛围。',
      usageSteps: [
        '上传美食图片或选择示例图',
        '选择菜品类型（中餐/西餐/甜点等）',
        '应用食欲感配色方案',
        '添加蒸汽/烟雾效果',
        '生成菜单或海报设计'
      ],
      expectedEffect: '设计作品能够有效激发观者的食欲与消费欲望，提升餐厅的进店率与点单率。专业的视觉呈现增强品牌的品质感与可信度，有助于在激烈的市场竞争中脱颖而出。'
    }
  },
  {
    id: 'ct6',
    name: '茶叶茗品',
    icon: 'fa-mug-hot',
    desc: '茶叶品牌雅致设计',
    content: '${brand} 茶叶品牌设计；山水意境；清雅配色；传递茶道文化。',
    detailDescription: {
      designPhilosophy: '以"茶道精神、东方美学"为设计核心，将茶文化的清雅、禅意、自然之美融入现代商业设计。设计灵感源自中国山水画的意境、茶器的温润质感、茶园的自然风光，打造具有文化底蕴与品质感的茶叶品牌视觉方案。',
      coreFeatures: [
        '山水意境生成：AI生成水墨山水背景',
        '茶器元素库：紫砂壶、盖碗、茶杯等精致茶器图案',
        '禅意配色系统：青绿、赭石、米白等禅意色彩',
        '书法字体库：集成多种书法字体用于品牌展示'
      ],
      applicableScenarios: [
        '茶叶品牌包装设计',
        '茶具产品视觉设计',
        '茶文化空间设计',
        '茶叶电商详情页',
        '茶道体验活动策划'
      ],
      visualStyle: '主打"清雅禅意风格"，以青绿、米白、赭石等自然色系为主，营造出宁静致远的东方美学意境。设计强调留白与意境，通过山水、云雾、茶器等元素的巧妙运用，传递出茶文化的深厚内涵与生活美学。',
      usageSteps: [
        '选择茶叶品类（绿茶/红茶/乌龙等）',
        '配置品牌名称与产地信息',
        '选择山水意境或茶器作为主视觉',
        '应用禅意配色方案',
        '添加书法字体元素'
      ],
      expectedEffect: '设计作品呈现出高雅的文化品位与艺术价值，能够有效提升茶叶产品的档次与溢价空间。清雅脱俗的视觉风格与茶文化内涵完美契合，有助于建立品牌的高端形象与文化内涵。'
    }
  },
  {
    id: 'ct7',
    name: '酒类佳酿',
    icon: 'fa-wine-bottle',
    desc: '酒类产品高端设计',
    content: '${brand} 酒类包装设计；高贵典雅；金色点缀；彰显品质与历史。',
    detailDescription: {
      designPhilosophy: '以"岁月沉淀、品质传承"为设计主旨，将酒文化的醇厚、优雅、历史感转化为视觉语言。设计灵感源自酒窖的深邃、酒液的晶莹、酒标的历史传承，为酒类品牌打造具有高端质感与文化内涵的视觉方案。',
      coreFeatures: [
        '酒液质感模拟：真实酒液光泽与流动效果',
        '酒标设计系统：传统与现代酒标设计模板',
        '年份标识工具：专业的年份与限量版标识设计',
        '高端工艺效果：烫金、压纹、UV等工艺模拟'
      ],
      applicableScenarios: [
        '白酒/红酒/洋酒包装设计',
        '酒品牌视觉升级',
        '酒类电商详情页',
        '酒窖空间设计',
        '酒类品鉴活动策划'
      ],
      visualStyle: '采用"高贵典雅风格"，以深红、金色、黑色为主色调，营造出奢华尊贵的视觉氛围。设计强调质感与细节，通过精致的图案、考究的字体、高端的工艺效果，传递出酒类产品的高品质与历史积淀。',
      usageSteps: [
        '选择酒类类型与档次定位',
        '上传酒瓶造型或选择模板',
        '设计酒标与品牌标识',
        '应用高端工艺效果',
        '生成包装展开图'
      ],
      expectedEffect: '设计作品具有强烈的品质感与档次感，能够有效提升酒类产品的品牌价值与市场竞争力。精致的视觉呈现让产品在众多竞品中脱颖而出，有助于吸引高端消费群体。'
    }
  },
  {
    id: 'ct8',
    name: '文创礼品',
    icon: 'fa-gift',
    desc: '文化创意礼品设计',
    content: '${brand} 文创礼品设计；传统元素现代化；实用美观；适合作为伴手礼。',
    detailDescription: {
      designPhilosophy: '以"文化传承、创意表达"为设计核心，将传统文化元素与现代设计语言相融合。设计强调文化故事的讲述与情感价值的传递，通过独特的创意设计，让文创产品成为文化传播的载体与情感连接的纽带。',
      coreFeatures: [
        '文化元素库：集成传统纹样、历史符号、民间艺术等',
        '故事场景构建：基于文化故事的场景化设计',
        '多品类适配：支持文具、饰品、家居等多种品类',
        'IP形象设计：文创IP角色的设计与管理'
      ],
      applicableScenarios: [
        '博物馆文创产品开发',
        '城市伴手礼设计',
        '企业文化礼品定制',
        '非遗文创产品设计',
        '文创品牌视觉设计'
      ],
      visualStyle: '主打"新国潮风格"，将传统元素以现代设计手法重新演绎，既保留文化内核又符合当代审美。设计强调趣味性与实用性，通过巧妙的创意转化，让传统文化以年轻、时尚的方式呈现。',
      usageSteps: [
        '选择文化主题或IP形象',
        '选择产品品类与材质',
        '配置品牌信息与文化故事',
        '应用文化元素进行设计',
        '生成产品效果图'
      ],
      expectedEffect: '设计作品具有独特的文化价值与创意魅力，能够有效吸引年轻消费群体。文化故事的融入增强产品的情感价值与收藏意义，有助于提升品牌文化影响力与产品附加值。'
    }
  },
  {
    id: 'ct9',
    name: '零售百货',
    icon: 'fa-shopping-bag',
    desc: '零售品牌商业设计',
    content: '${brand} 零售品牌设计；明快配色；现代感强；吸引年轻消费者。',
    detailDescription: {
      designPhilosophy: '以"吸引客流、促进转化"为商业目标，将现代零售美学与消费者心理学相结合。设计强调视觉冲击力与信息传达效率，通过明快活泼的视觉语言，打造具有吸引力的商业空间与营销物料。',
      coreFeatures: [
        '促销标签系统：多种促销标签与价格展示方案',
        '商品陈列模板：专业的商品摆放与展示设计',
        '视觉动线规划：引导消费者视线的布局设计',
        '季节性主题：春夏秋冬四季营销主题方案'
      ],
      applicableScenarios: [
        '商场/超市视觉设计',
        '促销活动物料设计',
        '商品包装设计',
        '会员营销物料',
        '新店开业宣传'
      ],
      visualStyle: '采用"明快现代风格"，以高饱和度色彩为主，强调视觉冲击力与吸引力。设计注重信息的清晰传达，通过合理的版式布局与醒目的视觉元素，快速抓住消费者注意力并传递促销信息。',
      usageSteps: [
        '选择零售业态类型',
        '配置促销信息与商品图片',
        '选择陈列模板与布局',
        '应用品牌配色方案',
        '生成系列物料'
      ],
      expectedEffect: '设计作品具有强烈的商业吸引力，能够有效提升门店客流量与商品转化率。明快的视觉风格营造愉悦的购物氛围，有助于提升消费者购物体验与品牌好感度。'
    }
  },

  // 场景模板
  {
    id: 'ct10',
    name: '产品包装',
    icon: 'fa-box',
    desc: '设计独特的品牌包装方案',
    content: '${brand} 产品包装设计；突出品牌特色；环保材质与现代工艺结合。',
    detailDescription: {
      designPhilosophy: '以"保护产品、传递价值、吸引购买"为设计三重目标，将包装的功能性与艺术性完美结合。设计强调品牌识别度与货架表现力的提升，通过独特的包装视觉，让产品在激烈的市场竞争中脱颖而出。',
      coreFeatures: [
        '盒型库：100+标准盒型与异形盒型',
        '展开图生成：自动生成立体包装展开图',
        '货架模拟：3D模拟产品在货架上的展示效果',
        '环保材质库：可持续包装材质与工艺方案'
      ],
      applicableScenarios: [
        '食品包装设计',
        '化妆品包装设计',
        '电子产品包装设计',
        '礼品包装设计',
        '电商快递包装设计'
      ],
      visualStyle: '根据产品属性灵活调整风格，既可简约现代，也可华丽复古。设计强调包装的立体感与触感表现，通过材质、工艺、结构的综合设计，打造令人印象深刻的开箱体验。',
      usageSteps: [
        '选择产品类型与盒型',
        '配置品牌视觉元素',
        '设计平面展开图',
        '预览立体效果',
        '生成印刷文件'
      ],
      expectedEffect: '包装设计具有强烈的品牌识别度与货架吸引力，能够有效提升产品的市场竞争力与溢价能力。精致的包装体验增强消费者对品牌的好感与忠诚度。'
    }
  },
  {
    id: 'ct11',
    name: '社交媒体',
    icon: 'fa-share-alt',
    desc: '适合各平台的社交传播内容',
    content: '${brand} 社交媒体视觉；年轻化设计；适合小红书/微博/抖音传播。',
    detailDescription: {
      designPhilosophy: '以"快速传播、引发互动"为设计核心，将社交媒体的传播特性与品牌内容策略相结合。设计强调内容的可读性与分享性，通过吸睛的视觉设计，提升内容的曝光率与互动率。',
      coreFeatures: [
        '平台尺寸库：支持小红书、抖音、微博、微信等多平台尺寸',
        '热点追踪：结合实时热点的内容创意建议',
        '互动元素：投票、问答、抽奖等互动组件',
        '数据可视化：将数据转化为易读的信息图表'
      ],
      applicableScenarios: [
        '品牌社交媒体运营',
        'KOL/KOC内容创作',
        '热点营销事件',
        '用户UGC活动',
        '直播预告与回顾'
      ],
      visualStyle: '采用"年轻化潮流风格"，紧跟社交媒体审美趋势，强调个性化与话题性。设计注重视觉冲击力与信息密度，通过大胆的配色、趣味的排版、吸睛的标题，快速抓住用户注意力。',
      usageSteps: [
        '选择目标平台与内容类型',
        '输入文案或让AI生成',
        '选择配图或生成AI图片',
        '应用平台专属模板',
        '一键发布或导出'
      ],
      expectedEffect: '社交媒体内容具有高度的传播性与互动性，能够有效提升品牌曝光度与粉丝活跃度。紧跟潮流的设计风格增强品牌的年轻化形象，有助于与目标受众建立情感连接。'
    }
  },
  {
    id: 'ct12',
    name: '品牌联名',
    icon: 'fa-handshake',
    desc: '跨界联名的创意设计方案',
    content: '${brand} 跨界联名设计；融合双方品牌元素；创造独特视觉记忆点。',
    detailDescription: {
      designPhilosophy: '以"1+1>2"的协同效应为设计目标，将两个品牌的DNA进行创造性融合。设计强调双方品牌元素的平衡与对话，通过独特的视觉语言，创造出具有话题性与收藏价值联名产品。',
      coreFeatures: [
        '品牌融合工具：智能融合两个品牌的视觉元素',
        '联名标识设计：专业的联名Logo与标识设计',
        '限量编号系统：限量版产品的编号与认证设计',
        '故事场景构建：联名背后的品牌故事视觉化'
      ],
      applicableScenarios: [
        '跨界品牌联名产品',
        '艺术家联名系列',
        'IP授权联名合作',
        '品牌周年庆联名',
        '公益联名项目'
      ],
      visualStyle: '风格取决于联名双方的品牌属性，可能是传统与现代的碰撞，也可能是东方与西方的融合。设计强调视觉的和谐与张力，通过巧妙的元素组合，展现联名的独特价值与创意魅力。',
      usageSteps: [
        '选择联名双方品牌',
        '上传双方品牌资产',
        '选择融合方式（并列/融合/碰撞）',
        '设计联名标识',
        '生成联名系列产品'
      ],
      expectedEffect: '联名设计具有强烈的话题性与传播力，能够有效吸引双方品牌的粉丝群体。独特的视觉呈现提升产品的收藏价值与稀缺性，有助于创造营销热点与销售佳绩。'
    }
  },
  {
    id: 'ct13',
    name: '门店空间',
    icon: 'fa-store',
    desc: '线下门店空间设计方案',
    content: '${brand} 门店空间设计；传统与现代融合；营造沉浸式品牌体验。',
    detailDescription: {
      designPhilosophy: '以"沉浸式品牌体验"为设计核心，将品牌文化转化为可感知的空间语言。设计强调空间的叙事性与体验感，通过视觉、材质、光影的综合设计，打造令人难忘的品牌空间。',
      coreFeatures: [
        '空间布局规划：专业的商业空间布局设计',
        'SI系统设计：连锁品牌空间识别系统',
        '灯光氛围模拟：不同场景的灯光效果模拟',
        '材质搭配方案：墙面、地面、家具材质搭配'
      ],
      applicableScenarios: [
        '品牌旗舰店设计',
        '连锁门店SI设计',
        '快闪店/概念店设计',
        '展览展示空间',
        '办公空间品牌墙'
      ],
      visualStyle: '根据品牌定位灵活调整风格，从极简现代到复古奢华均可驾驭。设计强调空间的整体性与细节品质，通过统一的设计语言，在不同触点传递一致的品牌体验。',
      usageSteps: [
        '选择空间类型与面积',
        '配置品牌视觉系统',
        '规划功能分区与动线',
        '选择材质与灯光方案',
        '生成效果图与施工图'
      ],
      expectedEffect: '门店空间具有强烈的品牌识别度与体验感，能够有效提升顾客的停留时间与购买意愿。一致的空间体验强化品牌形象，有助于建立品牌忠诚度与口碑传播。'
    }
  },
  {
    id: 'ct14',
    name: '户外广告',
    icon: 'fa-bullhorn',
    desc: '户外大型广告设计',
    content: '${brand} 户外广告设计；视觉冲击力强；远距离识别度高；吸引眼球。',
    detailDescription: {
      designPhilosophy: '以"远距离识别、瞬间吸引"为设计原则，将户外广告的特殊传播环境纳入设计考量。设计强调视觉的冲击力与信息的简洁性，通过大胆的色彩、简洁的图形、醒目的文字，在瞬间抓住受众注意力。',
      coreFeatures: [
        '远距离识别测试：模拟不同距离下的视觉效果',
        '动态效果设计：LED大屏的动态视觉方案',
        '环境融合分析：广告与周边环境的融合度分析',
        '法规合规检查：广告内容法规合规性检测'
      ],
      applicableScenarios: [
        '高速公路广告牌',
        '城市LED大屏',
        '公交地铁广告',
        '楼宇电梯广告',
        '户外灯箱广告'
      ],
      visualStyle: '采用"高对比度简洁风格"，以大面积纯色背景配合简洁图形，确保远距离识别度。设计强调信息的层级分明，通过字体大小、色彩对比的精心设计，让核心信息在3秒内被准确接收。',
      usageSteps: [
        '选择广告位类型与尺寸',
        '配置品牌核心信息',
        '设计简洁有力的视觉',
        '进行远距离识别测试',
        '生成高清输出文件'
      ],
      expectedEffect: '户外广告具有极高的识别度与记忆度，能够在嘈杂的环境中脱颖而出。简洁有力的信息传达提升广告效果，有助于实现品牌曝光与信息传递的双重目标。'
    }
  },
  {
    id: 'ct15',
    name: '电商详情',
    icon: 'fa-shopping-cart',
    desc: '电商平台详情页设计',
    content: '${brand} 电商详情页；卖点突出；图文结合；促进转化。',
    detailDescription: {
      designPhilosophy: '以"提升转化、降低跳失"为设计目标，将电商用户的行为路径与购买决策心理融入设计。设计强调信息的清晰呈现与信任感的建立，通过专业的视觉设计，提升商品的点击率与转化率。',
      coreFeatures: [
        '卖点提炼工具：AI智能提炼产品核心卖点',
        '场景图生成：产品使用场景的智能合成',
        '对比展示：产品前后对比、竞品对比展示',
        '信任背书设计：认证、评价、销量等信任元素'
      ],
      applicableScenarios: [
        '淘宝/天猫详情页',
        '京东详情页',
        '拼多多详情页',
        '抖音小店详情页',
        '独立站产品页'
      ],
      visualStyle: '采用"信息清晰风格"，以白色或浅色背景为主，确保产品图片的突出显示。设计注重信息的层级与逻辑，通过合理的版式布局，引导用户逐步了解产品并产生购买欲望。',
      usageSteps: [
        '上传产品图片与参数',
        '提炼核心卖点与文案',
        '选择详情页模块组合',
        '生成场景图与对比图',
        '导出长图或切片'
      ],
      expectedEffect: '电商详情页具有清晰的逻辑与强烈的转化导向，能够有效提升商品的转化率与客单价。专业的视觉呈现增强产品的品质感与可信度，有助于降低用户的决策成本与购买顾虑。'
    }
  },

  // 风格模板
  {
    id: 'ct16',
    name: '国潮风尚',
    icon: 'fa-dragon',
    desc: '国潮风格现代演绎',
    content: '${brand} 国潮风格设计；传统元素现代化；年轻时尚；文化自信。',
    detailDescription: {
      designPhilosophy: '以"文化自信、传统新生"为设计核心，将中国传统文化元素以当代设计手法重新演绎。设计强调东方美学的现代表达，通过传统与现代的创造性融合，打造具有文化认同感与时尚感的视觉方案。',
      coreFeatures: [
        '传统元素库：龙、凤、祥云、瑞兽等传统图案',
        '现代演绎工具：传统元素的现代化变形与重组',
        '国潮配色系统：朱砂红、琉璃黄、青花蓝等国潮色彩',
        '书法字体库：集成多种书法字体与篆刻效果'
      ],
      applicableScenarios: [
        '国潮品牌视觉设计',
        '传统文化产品包装',
        '文创产品设计',
        '国风服饰设计',
        '国潮营销活动'
      ],
      visualStyle: '主打"新中式国潮风格"，将传统元素以扁平化、几何化、波普化的现代手法重新演绎。设计强调色彩的饱和度与对比度，通过大胆的色彩碰撞与图形组合，展现年轻一代的文化自信与审美态度。',
      usageSteps: [
        '选择传统文化主题',
        '从元素库中选择传统图案',
        '应用现代演绎手法',
        '配置国潮配色方案',
        '生成系列设计'
      ],
      expectedEffect: '设计作品具有强烈的文化辨识度与时尚感，能够有效吸引年轻消费群体。国潮风格的视觉呈现增强品牌的文化属性与话题性，有助于在社交媒体上引发传播与讨论。'
    }
  },
  {
    id: 'ct17',
    name: '极简主义',
    icon: 'fa-minus',
    desc: '极简风格纯净设计',
    content: '${brand} 极简设计；留白艺术；少即是多；高端大气。',
    detailDescription: {
      designPhilosophy: '以"少即是多"为设计哲学，将极简主义的美学原则贯彻到每一个设计细节。设计强调留白的力量与本质的呈现，通过精简的视觉元素，传递出高端、纯粹、永恒的品牌价值。',
      coreFeatures: [
        '留白计算工具：科学的留白比例计算',
        '网格系统：严谨的版式网格辅助设计',
        '单色配色：黑白灰及单色系配色方案',
        '无衬线字体：精选极简风格字体库'
      ],
      applicableScenarios: [
        '高端品牌视觉设计',
        '科技产品设计',
        '建筑空间设计',
        '生活方式品牌',
        '艺术展览设计'
      ],
      visualStyle: '采用"纯粹极简风格"，以大量留白配合精简的视觉元素，营造出宁静、高级的视觉氛围。设计强调材质的真实质感与细节的精致处理，通过克制的色彩与简洁的图形，传递出品牌的品质与态度。',
      usageSteps: [
        '确定核心视觉元素',
        '应用网格系统规划布局',
        '配置留白与间距',
        '选择单色或极简配色',
        '精修细节与质感'
      ],
      expectedEffect: '设计作品具有高度的艺术价值与品牌辨识度，能够有效提升品牌的档次与溢价能力。极简的视觉风格传递出品牌的自信与专注，有助于建立高端、专业的品牌形象。'
    }
  },
  {
    id: 'ct18',
    name: '复古怀旧',
    icon: 'fa-history',
    desc: '复古风格情怀设计',
    content: '${brand} 复古设计；老上海风情；怀旧色调；唤起记忆。',
    detailDescription: {
      designPhilosophy: '以"时光倒流、情怀再现"为设计主旨，将特定年代的美学特征与文化记忆融入现代设计。设计强调怀旧情绪的营造与历史感的还原，通过复古的视觉语言，唤起受众的情感共鸣与美好回忆。',
      coreFeatures: [
        '年代滤镜库：20-80年代各时期特色滤镜',
        '复古字体库：老报纸、老广告特色字体',
        '做旧效果：纸张泛黄、划痕、褪色等效果',
        '老物件元素：vintage物品与装饰图案'
      ],
      applicableScenarios: [
        '复古品牌视觉设计',
        '老字号品牌焕新',
        '怀旧主题营销活动',
        '复古风格产品包装',
        '历史题材影视宣传'
      ],
      visualStyle: '根据目标年代灵活调整风格，可能是民国风的老上海韵味，也可能是80年代的怀旧色彩。设计强调历史质感的还原，通过做旧效果、复古配色、年代字体的综合运用，营造出穿越时空的怀旧氛围。',
      usageSteps: [
        '选择目标年代与风格',
        '应用年代滤镜与做旧效果',
        '选择复古字体与元素',
        '配置怀旧配色方案',
        '添加复古装饰细节'
      ],
      expectedEffect: '设计作品具有强烈的情感感染力与话题性，能够有效唤起目标受众的怀旧情绪与情感共鸣。复古风格的视觉呈现增强品牌的文化厚度与故事性，有助于建立独特的品牌个性与记忆点。'
    }
  },
  {
    id: 'ct19',
    name: '科技感',
    icon: 'fa-microchip',
    desc: '科技风格未来设计',
    content: '${brand} 科技风格设计；几何线条；蓝紫配色；未来感十足。',
    detailDescription: {
      designPhilosophy: '以"未来已来"为设计愿景，将前沿科技元素与未来主义美学融入视觉设计。设计强调技术的先进性与未来的可能性，通过充满科技感的视觉语言，传递出品牌的创新精神与前瞻视野。',
      coreFeatures: [
        '几何线条工具：科技感几何图形与线条生成',
        '数据可视化：将数据转化为科技感的图表',
        '光效库：霓虹、光晕、粒子等光效元素',
        '未来字体：科技感无衬线字体库'
      ],
      applicableScenarios: [
        '科技公司品牌设计',
        '互联网产品设计',
        '智能硬件包装',
        '科幻题材宣传',
        '创新科技活动'
      ],
      visualStyle: '采用"未来科技风格"，以深蓝、紫色、青色为主色调，配合高亮度的荧光色点缀。设计强调几何线条与光效的运用，通过简洁的图形、流动的光线、数字化的元素，营造出充满未来感的视觉体验。',
      usageSteps: [
        '选择科技主题与方向',
        '应用几何线条构建框架',
        '添加光效与粒子元素',
        '配置科技蓝紫配色',
        '生成动态或静态效果'
      ],
      expectedEffect: '设计作品具有强烈的科技感与未来感，能够有效传递品牌的创新精神与技术实力。前卫的视觉风格吸引年轻、高端的受众群体，有助于建立行业领先的品牌形象。'
    }
  },
  {
    id: 'ct20',
    name: '手绘插画',
    icon: 'fa-paint-brush',
    desc: '手绘风格温暖设计',
    content: '${brand} 手绘插画设计；温暖亲切；独特个性；艺术感强。',
    detailDescription: {
      designPhilosophy: '以"手绘温度、独特个性"为设计核心，将手绘艺术的独特魅力与商业设计需求相结合。设计强调作品的独特性与艺术感，通过手绘的笔触与质感，传递出品牌的温度与态度。',
      coreFeatures: [
        '手绘风格转换：将图片转换为手绘风格',
        '插画元素库：多种风格的手绘插画元素',
        '笔触模拟：铅笔、水彩、马克笔等笔触效果',
        '手绘字体：手写风格字体库'
      ],
      applicableScenarios: [
        '文创品牌视觉设计',
        '儿童产品设计',
        '生活方式品牌',
        '独立品牌设计',
        '艺术展览宣传'
      ],
      visualStyle: '采用"温暖手绘风格"，以柔和的色彩与自然的笔触为主，营造出亲切、温暖的视觉氛围。设计强调不完美中的美感与手工的温度，通过独特的绘画风格，展现品牌的个性与态度。',
      usageSteps: [
        '选择手绘风格（水彩/铅笔/马克笔等）',
        '上传参考图或选择元素',
        '应用手绘风格转换',
        '添加手绘装饰元素',
        '调整色彩与笔触'
      ],
      expectedEffect: '设计作品具有独特的艺术价值与辨识度，能够有效区别于工业化设计。手绘的温度与个性增强品牌的亲和力与独特性，有助于建立情感连接与品牌忠诚度。'
    }
  },
];

export const BRAND_FONTS: BrandFont[] = [
  { id: 'SimSun', name: '宋体', desc: '传统典雅' },
  { id: 'KaiTi', name: '楷体', desc: '书法韵味' },
  { id: 'Heiti', name: '黑体', desc: '现代简约' },
  { id: 'FangSong', name: '仿宋', desc: '古典雅致' },
  { id: 'LiSu', name: '隶书', desc: '古朴庄重' },
];

// 生成内联 SVG 占位图的辅助函数 - 优化版，带有渐变背景和装饰元素
const generateSvgPlaceholder = (text: string, color: string = '#3b82f6') => {
  // 定义渐变色彩方案
  const gradients = [
    { from: '#667eea', to: '#764ba2' }, // 紫蓝渐变
    { from: '#f093fb', to: '#f5576c' }, // 粉紫渐变
    { from: '#4facfe', to: '#00f2fe' }, // 青蓝渐变
    { from: '#43e97b', to: '#38f9d7' }, // 绿青渐变
    { from: '#fa709a', to: '#fee140' }, // 粉黄渐变
    { from: '#30cfd0', to: '#330867' }, // 青紫渐变
    { from: '#a8edea', to: '#fed6e3' }, // 淡雅渐变
    { from: '#ff9a9e', to: '#fecfef' }, // 粉色渐变
  ];

  // 根据文本内容选择渐变（保持一致性）
  const gradientIndex = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
  const gradient = gradients[gradientIndex];

  // 对文本进行 XML 转义，防止特殊字符破坏 SVG
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const svg = `<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- 主渐变 -->
      <linearGradient id="mainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${gradient.from};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${gradient.to};stop-opacity:1" />
      </linearGradient>
      <!-- 装饰圆形渐变 -->
      <radialGradient id="circleGrad1" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style="stop-color:white;stop-opacity:0.3" />
        <stop offset="100%" style="stop-color:white;stop-opacity:0" />
      </radialGradient>
      <radialGradient id="circleGrad2" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style="stop-color:white;stop-opacity:0.2" />
        <stop offset="100%" style="stop-color:white;stop-opacity:0" />
      </radialGradient>
      <!-- 阴影滤镜 -->
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="black" flood-opacity="0.15"/>
      </filter>
    </defs>

    <!-- 背景 -->
    <rect width="600" height="400" fill="url(#mainGrad)"/>

    <!-- 装饰圆形 -->
    <circle cx="100" cy="80" r="120" fill="url(#circleGrad1)"/>
    <circle cx="500" cy="320" r="150" fill="url(#circleGrad2)"/>
    <circle cx="550" cy="50" r="80" fill="url(#circleGrad1)"/>
    <circle cx="50" cy="350" r="100" fill="url(#circleGrad2)"/>

    <!-- 装饰线条 -->
    <line x1="0" y1="200" x2="600" y2="200" stroke="white" stroke-width="1" stroke-opacity="0.1"/>
    <line x1="300" y1="0" x2="300" y2="400" stroke="white" stroke-width="1" stroke-opacity="0.1"/>

    <!-- 主内容容器 -->
    <g transform="translate(300, 200)" filter="url(#shadow)">
      <!-- 图标背景圆 -->
      <circle cx="0" cy="-30" r="50" fill="white" fill-opacity="0.95"/>

      <!-- 魔法棒图标 -->
      <g transform="translate(-15, -45) scale(1.2)">
        <path d="M12 2L2 22l5-5 5 5L22 2l-5 5-5-5z" fill="${gradient.from}" opacity="0.8"/>
        <circle cx="20" cy="6" r="2" fill="${gradient.to}"/>
        <circle cx="6" cy="18" r="1.5" fill="${gradient.to}"/>
      </g>

      <!-- 文字 -->
      <text x="0" y="50" font-family="Arial, 'Microsoft YaHei', 'PingFang SC', sans-serif" font-size="24" font-weight="600" fill="white" text-anchor="middle">${escapedText}</text>
      <text x="0" y="80" font-family="Arial, 'Microsoft YaHei', 'PingFang SC', sans-serif" font-size="14" fill="white" fill-opacity="0.8" text-anchor="middle">AI 智能创作</text>
    </g>

    <!-- 角落装饰点 -->
    <g fill="white" fill-opacity="0.4">
      <circle cx="30" cy="30" r="3"/>
      <circle cx="45" cy="30" r="2"/>
      <circle cx="30" cy="45" r="2"/>
      <circle cx="570" cy="370" r="3"/>
      <circle cx="555" cy="370" r="2"/>
      <circle cx="570" cy="355" r="2"/>
    </g>
  </svg>`;

  // 使用 UTF-8 编码的 base64，支持中文
  const utf8Bytes = new TextEncoder().encode(svg);
  const base64 = btoa(String.fromCharCode(...utf8Bytes));
  return `data:image/svg+xml;base64,${base64}`;
};

export const AI_GENERATED_RESULTS: GeneratedResult[] = [
  {
    id: 1,
    thumbnail: generateSvgPlaceholder('点击生成'),
    score: 85,
  },
  {
    id: 2,
    thumbnail: generateSvgPlaceholder('AI创意'),
    score: 78,
  },
  {
    id: 3,
    thumbnail: generateSvgPlaceholder('传统设计'),
    score: 92,
  },
  {
    id: 4,
    thumbnail: generateSvgPlaceholder('国潮风格'),
    score: 75,
  },
];

export const TRADITIONAL_PATTERNS: TraditionalPattern[] = [
  {
    id: 1,
    name: '云纹',
    thumbnail: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=300&h=200&fit=crop',
    description: '象征吉祥如意，常用于传统服饰和建筑',
  },
  {
    id: 2,
    name: '龙纹',
    thumbnail: 'https://images.unsplash.com/photo-1515405295579-ba7b45403062?w=300&h=200&fit=crop',
    description: '象征权力与尊贵，中国传统文化的重要象征',
  },
  {
    id: 3,
    name: '凤纹',
    thumbnail: 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=300&h=200&fit=crop',
    description: '象征美好与幸福，常与龙纹配合使用',
  },
  {
    id: 4,
    name: '回纹',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
    description: '寓意吉祥绵延，是传统装饰中常见的纹样',
  },
  {
    id: 5,
    name: '花卉纹',
    thumbnail: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=300&h=200&fit=crop',
    description: '象征自然与生机，常见牡丹、莲花等纹样',
  },
  {
    id: 6,
    name: '几何纹',
    thumbnail: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=300&h=200&fit=crop',
    description: '简洁明快，富有节奏感和韵律感',
  },
];

export const AI_FILTERS: AIFilter[] = [
  {
    id: 1,
    name: '复古胶片',
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=200&fit=crop',
    description: '模拟经典胶片效果，带有温暖的色调和轻微的颗粒感',
    intensity: 50,
    category: '风格化'
  },
  {
    id: 2,
    name: '赛博朋克',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=200&fit=crop',
    description: '高对比度，霓虹色调，营造未来科技感',
    intensity: 50,
    category: '风格化'
  },
  {
    id: 3,
    name: '水墨风格',
    thumbnail: 'https://images.unsplash.com/photo-1564074714615-5759a33fe09a?w=300&h=200&fit=crop',
    description: '模拟中国传统水墨画效果，黑白分明，意境悠远',
    intensity: 50,
    category: '艺术化'
  },
  {
    id: 4,
    name: '日系清新',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
    description: '明亮的色调，柔和的对比度，营造清新自然的氛围',
    intensity: 50,
    category: '风格化'
  },
  {
    id: 5,
    name: '油画效果',
    thumbnail: 'https://images.unsplash.com/photo-1513309914637-65c205798940?w=300&h=200&fit=crop',
    description: '模拟油画笔触效果，色彩丰富，质感强烈',
    intensity: 50,
    category: '艺术化'
  },
  {
    id: 6,
    name: '黑白经典',
    thumbnail: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=300&h=200&fit=crop',
    description: '经典黑白效果，高对比度，突出主体',
    intensity: 50,
    category: '基础'
  },
  {
    id: 7,
    name: '洛可可风格',
    thumbnail: 'https://images.unsplash.com/photo-1519187707322-b145631d7c6c?w=300&h=200&fit=crop',
    description: '华丽的装饰效果，柔和的曲线和丰富的细节',
    intensity: 50,
    category: '艺术化'
  },
  {
    id: 8,
    name: '故障艺术',
    thumbnail: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=300&h=200&fit=crop',
    description: '模拟数字故障效果，带有错位和色彩偏移',
    intensity: 50,
    category: '创意'
  }
];

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'chinese-traditional',
    name: '中国传统',
    description: '融合中国传统艺术元素，如国画、书法、传统纹样等',
    thumbnail: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&h=400&fit=crop',
    category: '传统'
  },
  {
    id: 'modern-minimalist',
    name: '现代简约',
    description: '简洁的线条，中性色调，注重功能性和空间感',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop',
    category: '现代'
  },
  {
    id: 'vintage-retro',
    name: '复古怀旧',
    description: '怀旧的色彩和纹理，模拟旧时光的质感',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=400&fit=crop',
    category: '复古'
  },
  {
    id: 'art-deco',
    name: '装饰艺术',
    description: '几何图形，大胆的色彩对比，奢华的装饰元素',
    thumbnail: 'https://images.unsplash.com/photo-1519187707322-b145631d7c6c?w=600&h=400&fit=crop',
    category: '艺术'
  },
  {
    id: 'japanese-wabi-sabi',
    name: '日式侘寂',
    description: '自然材质，简约美学，强调不完美和岁月痕迹',
    thumbnail: 'https://images.unsplash.com/photo-1564074714615-5759a33fe09a?w=600&h=400&fit=crop',
    category: '传统'
  },
  {
    id: 'scandinavian',
    name: '北欧风格',
    description: '明亮的色彩，自然材质，简约实用的设计理念',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
    category: '现代'
  },
  {
    id: 'neon-futurism',
    name: '霓虹未来',
    description: '霓虹色彩，未来主义元素，科技感十足',
    thumbnail: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=600&h=400&fit=crop',
    category: '未来'
  },
  {
    id: 'bohemian',
    name: '波西米亚',
    description: '丰富的色彩和图案，自由奔放的设计风格',
    thumbnail: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=600&h=400&fit=crop',
    category: '艺术'
  }
];

// 新的工具选项 - 4个核心智能工具
export const TOOL_OPTIONS: ToolOption[] = [
  {
    id: 'sketch',
    name: 'AI创作',
    icon: 'magic',
    description: '智能生成创意作品',
    color: '#C02C38',
    features: ['文生图', '图生图', '智能扩图']
  },
  {
    id: 'ai-assistant',
    name: 'AI助手',
    icon: 'robot',
    description: '基于千问大模型的智能创作助手',
    color: '#8B5CF6',
    features: ['图片生成', '视频生成', 'AI对话', '提示词优化']
  },
  {
    id: 'upload',
    name: '上传作品',
    icon: 'upload',
    description: '上传本地作品进行编辑',
    color: '#3B82F6',
    features: ['支持多种格式', '批量上传']
  },
  {
    id: 'refinement',
    name: '图片完善',
    icon: 'paint-brush',
    description: '基于AI的图片二次编辑',
    color: '#06B6D4',
    features: ['图生图', '智能扩图', '局部重绘']
  },
  {
    id: 'enhance',
    name: '智能美化',
    icon: 'wand-magic-sparkles',
    description: 'AI一键优化作品效果',
    color: '#8B5CF6',
    features: ['智能滤镜', '画质增强', '色彩优化', '一键美化']
  },
  {
    id: 'style',
    name: '风格实验室',
    icon: 'palette',
    description: '探索无限风格可能',
    color: '#F59E0B',
    features: ['风格迁移', '多风格融合', '国潮转换', '复古效果']
  },
  {
    id: 'prompt',
    name: '提示词助手',
    icon: 'keyboard',
    description: 'AI优化和生成提示词',
    color: '#84CC16',
    features: ['提示词优化', '质量分析', '模板库', '历史管理']
  },
  {
    id: 'layout',
    name: '智能排版',
    icon: 'th-large',
    description: 'AI自动排版多平台适配',
    color: '#10B981',
    features: ['智能布局', '多平台尺寸', '一键适配', '模板库']
  },
  {
    id: 'culture',
    name: '文化智库',
    icon: 'landmark',
    description: '文化灵感与场景预览',
    color: '#EC4899',
    features: ['文化溯源', '元素推荐', '场景预览', '知识库']
  }
];

// 旧版工具选项（保持向后兼容）
export const LEGACY_TOOL_OPTIONS = [
  { id: 'pattern', name: '纹样嵌入', icon: 'th' },
  { id: 'filter', name: 'AI滤镜', icon: 'filter' },
  { id: 'trace', name: '文化溯源', icon: 'book-open' },
  { id: 'remix', name: '风格重混', icon: 'random' },
  { id: 'mockup', name: '模型预览', icon: 'box-open' },
  { id: 'tile', name: '图案平铺', icon: 'border-all' }
];
