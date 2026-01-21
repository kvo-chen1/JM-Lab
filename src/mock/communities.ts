// 社群mock数据

export interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  topic: string;
  avatar: string;
  cover?: string; // 兼容旧代码使用的 cover 字段
  isActive: boolean;
  // 社群标签
  tags: string[];
  // 社区书签
  bookmarks: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
  // 自定义风格配置
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  // 布局配置
  layoutType?: 'standard' | 'compact' | 'expanded';
  // 功能模块配置
  enabledModules?: {
    posts?: boolean;
    chat?: boolean;
    members?: boolean;
    announcements?: boolean;
  };
  // 特殊标记
  isSpecial?: boolean;
}

// 创作者社群列表
export const mockCommunities: Community[] = [
  {
    id: 'c-guochao',
    name: '国潮设计社群',
    description: '讨论国潮视觉、品牌联名与配色体系',
    memberCount: 1286,
    topic: '国潮',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Guochao%20design%20community%20banner',
    isActive: true,
    tags: ['国潮', '设计', '品牌', '配色', '联名'],
    bookmarks: [
      { id: 'bm-1', name: '规则', icon: 'fas fa-book' },
      { id: 'bm-2', name: '资源库', icon: 'fas fa-layer-group' },
      { id: 'bm-3', name: '官方网站', icon: 'fas fa-globe' }
    ]
  },
  {
    id: 'c-heritage',
    name: '非遗数字化社群',
    description: '分享非遗数字化案例与教育传播',
    memberCount: 986,
    topic: '非遗',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Intangible%20heritage%20digital%20community%20banner',
    isActive: true,
    tags: ['非遗', '数字化', '教育', '传播', '文化'],
    bookmarks: [
      { id: 'bm-4', name: '非遗资源', icon: 'fas fa-book' },
      { id: 'bm-5', name: '案例库', icon: 'fas fa-layer-group' }
    ]
  },
  {
    id: 'c-ip',
    name: 'IP联名与授权',
    description: '围绕IP设计与商业授权的合作讨论',
    memberCount: 742,
    topic: 'IP',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=IP%20collaboration%20and%20licensing%20community%20banner',
    isActive: true,
    tags: ['IP', '授权', '联名', '品牌', '案例'],
    bookmarks: [
      { id: 'bm-6', name: 'IP库', icon: 'fas fa-database' },
      { id: 'bm-7', name: '授权规则', icon: 'fas fa-shield-alt' },
      { id: 'bm-8', name: '成功案例', icon: 'fas fa-trophy' }
    ]
  },
  {
    id: 'c-peking-opera',
    name: '京剧视觉社群',
    description: '京剧元素的现代视觉化与海报设计讨论',
    memberCount: 812,
    topic: '京剧',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Peking%20opera%20visual%20community%20banner%2C%20bold%20graphics',
    isActive: true
  },
  {
    id: 'c-jingdezhen',
    name: '景德镇陶瓷文创社群',
    description: '蓝白瓷与陶瓷文创的设计分享与交流',
    memberCount: 654,
    topic: '景德镇',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Jingdezhen%20ceramics%20community%20banner%2C%20blue%20and%20white',
    isActive: true
  },
  {
    id: 'c-laozihao',
    name: '老字号品牌策略社群',
    description: '围绕老字号品牌现代化策略与视觉系统建设',
    memberCount: 932,
    topic: '老字号',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Time-honored%20brand%20strategy%20community%20banner',
    isActive: true
  },
  {
    id: 'c-college-club',
    name: '高校社团联名社群',
    description: '高校社团与品牌联名的企划与视觉讨论',
    memberCount: 1014,
    topic: '高校',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=College%20club%20collaboration%20community%20banner',
    isActive: true
  },
  {
    id: 'c-color-palette',
    name: '东方配色研究社群',
    description: '传统色体系与东方配色的应用研究',
    memberCount: 723,
    topic: '配色',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Oriental%20color%20palette%20community%20banner',
    isActive: true
  },
  {
    id: 'c-ip-ops',
    name: 'IP运营与授权社群',
    description: 'IP商业授权、联名运营与案例拆解',
    memberCount: 845,
    topic: 'IP',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=IP%20operations%20and%20licensing%20community%20banner',
    isActive: true
  },
  {
    id: 'c-illustration',
    name: '插画手绘与线稿社群',
    description: '手绘插画、线稿风格与数字化处理交流',
    memberCount: 689,
    topic: '插画',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Hand-drawn%20illustration%20community%20banner%2C%20flat%20style',
    isActive: true
  },
  {
    id: 'c-craft-innovation',
    name: '工艺创新与再设计社群',
    description: '传统工艺现代创新与再设计实践分享',
    memberCount: 571,
    topic: '工艺创新',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Craft%20innovation%20community%20banner',
    isActive: true
  },
  {
    id: 'c-heritage-edu',
    name: '非遗教育传播社群',
    description: '非遗文化的教学传播与活动策划讨论',
    memberCount: 800,
    topic: '非遗',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Intangible%20heritage%20education%20community%20banner',
    isActive: true
  },
  {
    id: 'c-minimal-brand',
    name: '极简品牌视觉社群',
    description: '极简风格的品牌视觉系统与落地应用讨论',
    memberCount: 705,
    topic: '极简',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Minimalist%20brand%20visual%20community%20banner',
    isActive: true
  },
  {
    id: 'c-retro-poster',
    name: '复古海报设计社群',
    description: '复古风格的海报设计、字体与排版研究',
    memberCount: 790,
    topic: '复古',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Retro%20poster%20design%20community%20banner',
    isActive: true
  },
  {
    id: 'c-cyberpunk',
    name: '赛博朋克视觉社群',
    description: '赛博朋克风格的霓虹视觉与未来题材创作',
    memberCount: 668,
    topic: '赛博朋克',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Cyberpunk%20visual%20community%20banner%2C%20neon',
    isActive: true
  },
  {
    id: 'c-lineart',
    name: '黑白线稿插画社群',
    description: '线稿风格的创作分享与数字化处理技巧',
    memberCount: 612,
    topic: '插画',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Lineart%20black%20and%20white%20illustration%20community%20banner',
    isActive: true
  },
  {
    id: 'c-pattern-lab',
    name: '传统纹样研究社群',
    description: '传统纹样的图案提取、延展与现代应用',
    memberCount: 874,
    topic: '纹样',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Traditional%20pattern%20research%20community%20banner',
    isActive: true
  },
  {
    id: 'c-typeface',
    name: '字体设计与应用社群',
    description: '中文字体设计、版式排版与品牌应用案例',
    memberCount: 839,
    topic: '字体',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Chinese%20typeface%20design%20community%20banner',
    isActive: true
  },
  {
    id: 'c-merch',
    name: '国潮周边产品社群',
    description: '国潮礼品、周边开发与供应链协作交流',
    memberCount: 921,
    topic: '国潮',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Guochao%20merch%20community%20banner',
    isActive: true
  },
  {
    id: 'c-education-kv',
    name: '教育KV与信息图社群',
    description: '教育主题KV设计与信息图表现方法交流',
    memberCount: 702,
    topic: 'KV',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Education%20KV%20and%20infographic%20community%20banner',
    isActive: true
  },
  {
    id: 'c-oldbrand-campaign',
    name: '老字号联名企划社群',
    description: '老字号品牌的联名企划与商业合作讨论',
    memberCount: 965,
    topic: '老字号',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Time-honored%20brand%20collaboration%20community%20banner',
    isActive: true
  },
  {
    id: 'c-ip-family',
    name: 'IP亲子活动社群',
    description: '亲子向IP活动的视觉与互动设计分享',
    memberCount: 731,
    topic: 'IP',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=IP%20family%20event%20community%20banner',
    isActive: true
  },
  {
    id: 'c-wayfinding',
    name: '导视系统与空间视觉社群',
    description: '空间导视系统、环境图形与人群动线设计',
    memberCount: 644,
    topic: '空间',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Wayfinding%20system%20community%20banner',
    isActive: true
  },
  {
    id: 'c-packaging',
    name: '文创包装设计社群',
    description: '文创产品包装结构、材质与视觉系统交流',
    memberCount: 858,
    topic: '包装',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Cultural%20product%20packaging%20design%20community%20banner',
    isActive: true
  },
  {
    id: 'c-festival',
    name: '节日主题视觉社群',
    description: '节日活动KV与主题视觉的创意与执行',
    memberCount: 796,
    topic: '节日',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Festival%20theme%20visual%20community%20banner',
    isActive: true
  },
  {
    id: 'c-color-chinese-red',
    name: '中国红品牌KV社群',
    description: '中国红主题的品牌KV与整套物料表现',
    memberCount: 882,
    topic: '中国红',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Chinese%20red%20brand%20KV%20community%20banner',
    isActive: true
  },
  {
    id: 'c-ip-campus',
    name: '校园社团IP联名社群',
    description: '校园社团IP与品牌的跨界联名合作交流',
    memberCount: 1002,
    topic: '校园',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Campus%20club%20IP%20collaboration%20community%20banner',
    isActive: true
  },
  {
    id: 'c-bluewhite',
    name: '青花瓷图形再设计社群',
    description: '青花瓷元素的现代图形再设计与视觉化',
    memberCount: 648,
    topic: '青花瓷',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Blue%20and%20white%20porcelain%20graphic%20redesign%20community%20banner',
    isActive: true
  },
  {
    id: 'c-heritage-process',
    name: '非遗技艺流程社群',
    description: '非遗技艺流程梳理、信息图与教学素材',
    memberCount: 774,
    topic: '非遗',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Intangible%20heritage%20process%20community%20banner',
    isActive: true
  },
  {
    id: 'c-illustration-street',
    name: '国潮街头插画社群',
    description: '街头风格的国潮插画创作与风格研究',
    memberCount: 867,
    topic: '国潮',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Guochao%20street%20illustration%20community%20banner',
    isActive: true
  },
  {
    id: 'c-graphic-system',
    name: '视觉系统与延展社群',
    description: '品牌视觉系统化设计与多场景延展规范',
    memberCount: 733,
    topic: '视觉系统',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Brand%20visual%20system%20community%20banner',
    isActive: true
  },
  {
    id: 'c-colorsystem',
    name: '传统色与色彩系统社群',
    description: '传统色彩体系、配色方法与设计落地分享',
    memberCount: 711,
    topic: '配色',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Traditional%20colors%20and%20palette%20community%20banner',
    isActive: true
  },
  {
    id: 'c-ai-art',
    name: 'AI艺术生成社群',
    description: '分享AI生成艺术的提示词、风格与实战案例',
    memberCount: 978,
    topic: 'AI',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=AI%20art%20generation%20community%20banner%2C%20modern%20style',
    isActive: true
  },
  {
    id: 'c-photography',
    name: '摄影与后期社群',
    description: '摄影构图、色彩校正与后期调色技巧交流',
    memberCount: 812,
    topic: '摄影',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Photography%20and%20post%20processing%20community%20banner',
    isActive: true
  },
  {
    id: 'c-3d-modeling',
    name: '3D建模与渲染社群',
    description: '3D建模、材质贴图与渲染表现方法讨论',
    memberCount: 895,
    topic: '3D',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=3D%20modeling%20and%20rendering%20community%20banner',
    isActive: true
  },
  {
    id: 'c-game-art',
    name: '游戏美术社群',
    description: '游戏角色、场景与UI的美术风格与规范',
    memberCount: 936,
    topic: '游戏',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Game%20art%20community%20banner',
    isActive: true
  },
  {
    id: 'c-anime',
    name: '二次元插画社群',
    description: '动漫风插画的线稿、上色与风格化技巧',
    memberCount: 884,
    topic: '二次元',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Anime%20illustration%20community%20banner',
    isActive: true
  },
  {
    id: 'c-calligraphy',
    name: '书法与字形社群',
    description: '书法临摹、字形结构与现代化应用分享',
    memberCount: 721,
    topic: '书法',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Calligraphy%20and%20letterform%20community%20banner',
    isActive: true
  },
  {
    id: 'c-streetwear',
    name: '潮流服饰视觉社群',
    description: '潮流服饰图形、面料工艺与视觉企划交流',
    memberCount: 803,
    topic: '潮流',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Streetwear%20visual%20community%20banner',
    isActive: true
  },
  {
    id: 'c-travel-culture',
    name: '旅行地文化视觉社群',
    description: '地方文化IP、旅游海报与城市品牌研究',
    memberCount: 768,
    topic: '旅游',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Travel%20culture%20visual%20community%20banner',
    isActive: true
  },
  {
    id: 'c-folk-music',
    name: '国风音乐视觉社群',
    description: '国风音乐的封面、舞台视觉与周边设计',
    memberCount: 746,
    topic: '国风',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Chinese%20folk%20music%20visual%20community%20banner',
    isActive: true
  },
  {
    id: 'c-motion-graphics',
    name: '动效与视频包装社群',
    description: 'MG动效、片头包装与剪辑节奏方法交流',
    memberCount: 829,
    topic: '动效',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Motion%20graphics%20community%20banner',
    isActive: true
  },
  {
    id: 'c-ui-ux',
    name: 'UI/UX设计社群',
    description: '产品界面、交互策略与设计系统规范讨论',
    memberCount: 914,
    topic: 'UI设计',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=UI%20UX%20design%20community%20banner',
    isActive: true
  },
  {
    id: 'c-data-viz',
    name: '数据可视化社群',
    description: '信息图、可视化叙事与数据图形表达方法',
    memberCount: 777,
    topic: '数据可视化',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Data%20visualization%20community%20banner',
    isActive: true
  },
  {
    id: 'c-arch-visual',
    name: '建筑与空间视觉社群',
    description: '建筑摄影、空间导视与环境图形设计交流',
    memberCount: 732,
    topic: '空间',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Architectural%20visual%20community%20banner',
    isActive: true
  },
  {
    id: 'c-product-design',
    name: '工业产品外观设计社群',
    description: '产品外观、结构细节与量产落地经验交流',
    memberCount: 756,
    topic: '工业设计',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Industrial%20product%20design%20community%20banner',
    isActive: true
  },
  {
    id: 'c-printmaking',
    name: '版画与手工印刷社群',
    description: '丝网印刷、油印木刻与手工印刷工艺交流',
    memberCount: 669,
    topic: '版画',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Printmaking%20community%20banner',
    isActive: true
  },
  {
    id: 'c-ar-vr',
    name: 'AR/VR互动设计社群',
    description: '增强现实与虚拟现实的交互体验与视觉表达',
    memberCount: 802,
    topic: 'AR',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=AR%20VR%20interaction%20design%20community%20banner',
    isActive: true
  },
  {
    id: 'c-metaverse',
    name: '元宇宙活动视觉社群',
    description: '虚拟活动与沉浸式场景的视觉企划与执行',
    memberCount: 735,
    topic: '元宇宙',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Metaverse%20event%20visual%20community%20banner',
    isActive: true
  },
  {
    id: 'c-creative-coding',
    name: '创意编程与生成设计社群',
    description: 'p5.js、Processing与生成式图形的美学探索',
    memberCount: 889,
    topic: '编程',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Creative%20coding%20and%20generative%20design%20community%20banner',
    isActive: true
  },
  {
    id: 'c-data-story',
    name: '数据叙事与信息架构社群',
    description: '数据故事、信息架构与可读性设计的实践方法',
    memberCount: 718,
    topic: '数据',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Data%20storytelling%20and%20information%20architecture%20community%20banner',
    isActive: true
  },
  {
    id: 'c-product-photo',
    name: '产品摄影与布光社群',
    description: '电商产品摄影、布光与修图流程经验分享',
    memberCount: 786,
    topic: '摄影',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Product%20photography%20lighting%20community%20banner',
    isActive: true
  },
  {
    id: 'c-cosplay-design',
    name: 'Cosplay服饰与造型社群',
    description: '服饰打版、材质工艺与角色造型视觉表达',
    memberCount: 741,
    topic: 'Cosplay',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Cosplay%20costume%20design%20community%20banner',
    isActive: true
  },
  {
    id: 'c-exhibition',
    name: '博物馆与展陈设计社群',
    description: '展陈策展、展板信息与空间动线的视觉设计',
    memberCount: 728,
    topic: '展陈',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Museum%20exhibition%20design%20community%20banner',
    isActive: true
  },
  {
    id: 'c-children-book',
    name: '儿童绘本插画社群',
    description: '儿童向绘本的角色塑造与叙事图像表达',
    memberCount: 764,
    topic: '绘本',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Children%20book%20illustration%20community%20banner',
    isActive: true
  },
  {
    id: 'c-indie-brand',
    name: '独立品牌孵化社群',
    description: '小众品牌定位、风格系统与启动物料实战',
    memberCount: 915,
    topic: '品牌',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Indie%20brand%20incubation%20community%20banner',
    isActive: true
  },
  {
    id: 'c-tea-ceremony-brand',
    name: '茶文化与仪式品牌社群',
    description: '茶文化视觉、礼仪器具与仪式体验品牌设计',
    memberCount: 679,
    topic: '茶文化',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tea%20culture%20brand%20community%20banner',
    isActive: true
  },
  {
    id: 'c-festival-stage',
    name: '节庆舞台与灯光视觉社群',
    description: '舞台美术、灯光设计与活动视觉系统化落地',
    memberCount: 801,
    topic: '舞台',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Festival%20stage%20lighting%20visual%20community%20banner',
    isActive: true
  },
  {
    id: 'c-nft-collectibles',
    name: '数字藏品与NFT视觉社群',
    description: '数字藏品的视觉风格、发行策略与合规讨论',
    memberCount: 688,
    topic: 'NFT',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=NFT%20digital%20collectibles%20community%20banner',
    isActive: true
  },
  {
    id: 'c-retro-pixel',
    name: '像素复古艺术社群',
    description: '像素风图形创作与复古游戏视觉研究交流',
    memberCount: 744,
    topic: '像素',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Retro%20pixel%20art%20community%20banner',
    isActive: true
  },
  {
    id: 'c-sci-fi-concept',
    name: '科幻概念设计社群',
    description: '硬核科幻风格的概念场景与载具设定分享',
    memberCount: 873,
    topic: '科幻',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Sci-fi%20concept%20design%20community%20banner',
    isActive: true
  },
  {
    id: 'c-storyboard-comic',
    name: '漫画分镜与叙事社群',
    description: '镜头语言、节奏把控与叙事分镜的实战技巧',
    memberCount: 792,
    topic: '漫画',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Storyboard%20comic%20community%20banner',
    isActive: true
  },
  {
    id: 'c-motion-capture',
    name: '动作捕捉与角色表现社群',
    description: '动作捕捉流程、绑定与角色表现的技术美术',
    memberCount: 709,
    topic: '动捕',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Motion%20capture%20and%20character%20performance%20community%20banner',
    isActive: true
  },
  {
    id: 'c-wearable-design',
    name: '可穿戴与交互设备设计社群',
    description: '智能穿戴产品的交互体验与外观风格探索',
    memberCount: 737,
    topic: '穿戴',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Wearable%20device%20design%20community%20banner',
    isActive: true
  },
  {
    id: 'c-sustainable-packaging',
    name: '可持续包装与环保材质社群',
    description: '低碳包装结构、环保材质与循环设计方法',
    memberCount: 755,
    topic: '包装',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Sustainable%20packaging%20community%20banner',
    isActive: true
  },
  {
    id: 'c-hackathon',
    name: '创意黑客松与协作社群',
    description: '跨学科协作、快速原型与创意竞赛活动分享',
    memberCount: 803,
    topic: '协作',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Hackathon%20creative%20collaboration%20community%20banner',
    isActive: true
  },
  {
    id: 'c-hand-lettering',
    name: '手写字与品牌字系社群',
    description: '手写字风格化、变体设计与品牌字系包装',
    memberCount: 786,
    topic: '手写字',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Hand%20lettering%20brand%20typeface%20community%20banner',
    isActive: true
  }
];

// 用户加入的社群ID列表
export const userJoinedCommunities: string[] = ['c-guochao', 'c-heritage', 'c-ip', 'c-illustration', 'c-ui-ux'];

// 根据话题获取推荐社群
export const getCommunitiesByTopic = (topic: string): Community[] => {
  return mockCommunities.filter(community => community.topic === topic || topic === '全部');
};

// 获取用户加入的社群
export const getUserCommunities = (): Community[] => {
  return mockCommunities.filter(community => userJoinedCommunities.includes(community.id));
};

// 推荐社群
export const recommendedCommunities = JSON.parse(JSON.stringify(mockCommunities)); // 深拷贝，避免直接引用导致的修改问题
