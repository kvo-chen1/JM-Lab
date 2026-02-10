// 作品之心类型定义

export type GenerationType = 'image' | 'video' | 'text';
export type GenerationStatus = 'idle' | 'generating' | 'completed' | 'error';
export type ViewMode = 'timeline' | 'tree' | 'network' | 'compare';

export interface StylePreset {
  id: string;
  name: string;
  description?: string;
  brand: string;
  tags: string[];
  prompt: string;
  engine: 'sdxl' | 'qwen' | 'doubao';
  textStyle: 'formal' | 'humorous' | 'creative' | 'poetic';
  videoParams?: {
    duration: number;
    resolution: '480p' | '720p' | '1080p';
    cameraFixed: boolean;
  };
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
}

export interface GenerationResult {
  id: string;
  type: GenerationType;
  url: string;
  thumbnail?: string;
  prompt: string;
  brand?: string;
  tags: string[];
  createdAt: number;
  isFavorite: boolean;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    size?: number;
  };
}

export interface InspirationNode {
  id: string;
  type: 'root' | 'iteration' | 'reference' | 'derivative';
  title: string;
  description?: string;
  imageUrl?: string;
  createdAt: number;
  parentId?: string;
  childrenIds: string[];
  prompt?: string;
  result?: GenerationResult;
}

export interface InspirationVein {
  id: string;
  name: string;
  rootNodeId: string;
  nodes: Record<string, InspirationNode>;
  createdAt: number;
  updatedAt: number;
}

export interface BrandStory {
  id: string;
  name: string;
  shortDesc: string;
  fullStory: string;
  founded: string;
  heritage: string;
  images: string[];
  tags: string[];
}

export interface CreativeTip {
  id: string;
  title: string;
  content: string;
  category: 'prompt' | 'style' | 'technique';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface AIDirection {
  id: string;
  text: string;
  category: 'style' | 'element' | 'composition' | 'color';
  confidence: number;
}

export interface GenerationProgress {
  status: GenerationStatus;
  progress: number;
  message: string;
  estimatedTime?: number;
}

export interface WorkHeartState {
  // 当前活动标签
  activeTab: 'create' | 'design' | 'results' | 'history' | 'vein';
  
  // 风格预设
  stylePresets: StylePreset[];
  selectedPresetId: string | null;
  
  // 当前创作参数
  currentBrand: string;
  selectedTags: string[];
  customTags: string[];
  prompt: string;
  selectedEngine: 'sdxl' | 'qwen' | 'doubao';
  
  // 生成状态
  generationStatus: GenerationProgress;
  generationResults: GenerationResult[];
  selectedResultId: string | null;
  
  // 灵感脉络
  inspirationVeins: InspirationVein[];
  currentVeinId: string | null;
  veinViewMode: ViewMode;
  
  // UI状态
  leftSidebarCollapsed: boolean;
  rightSidebarVisible: boolean;
  showPresetModal: boolean;
  showVeinModal: boolean;
  
  // 历史记录筛选
  historyFilter: 'all' | 'favorite' | 'image' | 'video';
  historySort: 'latest' | 'oldest';
  historySearch: string;
}

export interface WorkHeartActions {
  // 标签操作
  setActiveTab: (tab: WorkHeartState['activeTab']) => void;
  
  // 预设操作
  addPreset: (preset: Omit<StylePreset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePreset: (id: string, updates: Partial<StylePreset>) => void;
  deletePreset: (id: string) => void;
  selectPreset: (id: string | null) => void;
  
  // 创作参数
  setBrand: (brand: string) => void;
  toggleTag: (tag: string) => void;
  addCustomTag: (tag: string) => void;
  removeCustomTag: (tag: string) => void;
  setPrompt: (prompt: string) => void;
  setEngine: (engine: WorkHeartState['selectedEngine']) => void;
  
  // 生成操作
  startGeneration: () => void;
  updateProgress: (progress: Partial<GenerationProgress>) => void;
  completeGeneration: (result: GenerationResult) => void;
  failGeneration: (error: string) => void;
  cancelGeneration: () => void;
  
  // 结果操作
  selectResult: (id: string | null) => void;
  toggleFavorite: (id: string) => void;
  deleteResult: (id: string) => void;
  
  // 灵感脉络
  createVein: (name: string) => void;
  addNodeToVein: (veinId: string, node: Omit<InspirationNode, 'id' | 'createdAt'>) => void;
  setCurrentVein: (id: string | null) => void;
  setVeinViewMode: (mode: ViewMode) => void;
  
  // UI操作
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setHistoryFilter: (filter: WorkHeartState['historyFilter']) => void;
  setHistorySort: (sort: WorkHeartState['historySort']) => void;
  setHistorySearch: (search: string) => void;
}

// 品牌故事数据
export const BRAND_STORIES: Record<string, BrandStory> = {
  mahua: {
    id: 'mahua',
    name: '桂发祥十八街麻花',
    shortDesc: '始于清末，以多褶形态与香酥口感著称，传统工艺要求条条分明，不含水分。',
    fullStory: '桂发祥十八街麻花是天津传统名点，始创于清末民初。其特点是香、酥、脆、甜，久放不绵。制作时需将和好的面搓成细条，再拧成麻花状，经油炸而成。每一根麻花都有十八个褶，象征着吉祥如意。',
    founded: '清末民初',
    heritage: '国家级非物质文化遗产',
    images: [],
    tags: ['传统小吃', '非遗', '天津特产']
  },
  baozi: {
    id: 'baozi',
    name: '狗不理包子',
    shortDesc: '创始于光绪年间，皮薄馅大、鲜香味美，传承天津传统小吃的经典风味。',
    fullStory: '狗不理包子始创于清朝光绪年间，是天津"三绝"之首。其特点是皮薄馅大、十八个褶、肥而不腻。传说创始人高贵友乳名"狗子"，因生意太忙顾不上理人，故得名"狗不理"。',
    founded: '清光绪年间',
    heritage: '国家级非物质文化遗产',
    images: [],
    tags: ['传统小吃', '天津三绝', '百年老店']
  },
  niuren: {
    id: 'niuren',
    name: '泥人张彩塑',
    shortDesc: '以细腻彩塑著称，人物生动传神，见证天津手艺与美学传承。',
    fullStory: '泥人张彩塑是天津民间艺术珍品，创始于清代道光年间。其作品取材广泛，从神话传说到市井生活，无不栩栩如生。彩塑工艺复杂，需经捏制、阴干、烧制、彩绘等多道工序。',
    founded: '清道光年间',
    heritage: '国家级非物质文化遗产',
    images: [],
    tags: ['民间艺术', '彩塑', '传统工艺']
  },
  erduoyan: {
    id: 'erduoyan',
    name: '耳朵眼炸糕',
    shortDesc: '创建于清光绪年间的耳朵眼炸糕，外酥里糯、香甜不腻，是天津特色小吃代表。',
    fullStory: '耳朵眼炸糕始创于清光绪年间，因店铺位于耳朵眼胡同而得名。其特点是外酥里嫩、香甜适口，选用优质糯米和红豆沙为原料，经油炸而成，是天津"三绝"之一。',
    founded: '清光绪年间',
    heritage: '天津市级非物质文化遗产',
    images: [],
    tags: ['传统小吃', '天津三绝', '甜品']
  },
  laomeihua: {
    id: 'laomeihua',
    name: '老美华鞋店',
    shortDesc: '老美华鞋店始于民国时期，保留传统手工缝制技艺与"舒适耐穿"的品牌口碑。',
    fullStory: '老美华鞋店始创于1911年，以制作传统布鞋闻名。其千层底布鞋采用纯棉布和麻绳手工纳制，每平方寸要纳81针以上，工艺精湛，舒适耐穿，深受消费者喜爱。',
    founded: '1911年',
    heritage: '中华老字号',
    images: [],
    tags: ['传统服饰', '手工技艺', '中华老字号']
  },
  dafulai: {
    id: 'dafulai',
    name: '大福来锅巴菜',
    shortDesc: '大福来锅巴菜以糊辣香浓著称，讲究火候与调和，口感层次丰富。',
    fullStory: '大福来锅巴菜是天津传统早餐，始创于清代。以绿豆面煎饼切成条状，浇上特制的卤汁，配以香菜、辣椒油等调料。其特点是卤汁浓郁、锅巴筋道，是天津人最爱的早点之一。',
    founded: '清代',
    heritage: '天津市级非物质文化遗产',
    images: [],
    tags: ['传统小吃', '早餐', '地方特色']
  },
  guorenzhang: {
    id: 'guorenzhang',
    name: '果仁张',
    shortDesc: '果仁张为百年坚果老字号，以糖炒栗子闻名，香甜适口、粒粒饱满。',
    fullStory: '果仁张始创于1830年，是天津著名的坚果炒货老字号。其糖炒栗子选用迁西板栗，配以秘制糖浆，炒制出的栗子香甜软糯、易剥壳，是天津人冬季最爱的零食。',
    founded: '1830年',
    heritage: '中华老字号',
    images: [],
    tags: ['传统小吃', '坚果炒货', '中华老字号']
  },
  chatangli: {
    id: 'chatangli',
    name: '茶汤李',
    shortDesc: '茶汤李源自清末，茶汤细腻柔滑、甘香回甜，是老天津的温暖记忆。',
    fullStory: '茶汤李始创于清光绪年间，以龙嘴大铜壶冲制茶汤而闻名。选用优质糜子面，用沸水冲熟后配以红糖、白糖、青丝、红丝等调料，口感细腻香甜，是天津传统风味小吃。',
    founded: '清光绪年间',
    heritage: '天津市级非物质文化遗产',
    images: [],
    tags: ['传统小吃', '甜品', '地方特色']
  }
};

// 预设标签
export const PRESET_TAGS = [
  '国潮', '杨柳青年画', '传统纹样', '红蓝配色', 
  '泥人张风格', '风筝魏', '海河风光', '古文化街',
  '天津之眼', '五大道', '意式风情区', '相声元素'
];

// 创作技巧
export const CREATIVE_TIPS: CreativeTip[] = [
  {
    id: '1',
    title: '具体描述',
    content: '使用具体的形容词描述您想要的效果，例如："一只拿着糖葫芦的赛博朋克风格醒狮"',
    category: 'prompt',
    difficulty: 'beginner'
  },
  {
    id: '2',
    title: '文化融合',
    content: '结合天津文化元素，如："杨柳青年画风格"、"传统纹样"、"红蓝配色"',
    category: 'style',
    difficulty: 'beginner'
  },
  {
    id: '3',
    title: '品牌故事',
    content: '尝试不同的品牌故事，获取多样化的创作灵感',
    category: 'technique',
    difficulty: 'intermediate'
  },
  {
    id: '4',
    title: 'AI建议',
    content: '使用AI创意建议，扩展您的创作思路',
    category: 'technique',
    difficulty: 'beginner'
  },
  {
    id: '5',
    title: '预设管理',
    content: '利用预设管理功能，保存您常用的创作组合',
    category: 'technique',
    difficulty: 'intermediate'
  }
];
