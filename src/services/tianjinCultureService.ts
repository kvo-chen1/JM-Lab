/**
 * 天津历史文化知识库服务
 * 提供天津历史、文化、艺术等相关知识的查询和管理功能
 */

import { getPicsumUrl } from '../utils/templateImageGenerator';

// 知识库条目类型定义
export interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  content: string;
  imageUrl?: string;
  relatedItems?: string[];
  sources?: string[];
  createdAt: number;
  updatedAt: number;
}

// 知识库分类配置
export interface CategoryConfig {
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}

export const KNOWLEDGE_CATEGORIES = [
  '历史人物',
  '历史事件',
  '文化遗产',
  '传统技艺',
  '民俗文化',
  '建筑风格',
  '地方小吃',
  '方言文化',
  '文学艺术',
  '宗教信仰'
] as const;

// 分类详细配置
export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  '历史人物': {
    name: '历史人物',
    icon: 'user-tie',
    color: '#C02C38',
    bgColor: 'rgba(192, 44, 56, 0.1)',
    description: '探索天津历史上的重要人物'
  },
  '历史事件': {
    name: '历史事件',
    icon: 'calendar-alt',
    color: '#2563EB',
    bgColor: 'rgba(37, 99, 235, 0.1)',
    description: '了解影响天津发展的重大事件'
  },
  '文化遗产': {
    name: '文化遗产',
    icon: 'landmark',
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.1)',
    description: '发现天津珍贵的文化遗产'
  },
  '传统技艺': {
    name: '传统技艺',
    icon: 'hands',
    color: '#7C3AED',
    bgColor: 'rgba(124, 58, 237, 0.1)',
    description: '传承百年的传统手工艺'
  },
  '民俗文化': {
    name: '民俗文化',
    icon: 'users',
    color: '#DC2626',
    bgColor: 'rgba(220, 38, 38, 0.1)',
    description: '体验天津独特的民俗风情'
  },
  '建筑风格': {
    name: '建筑风格',
    icon: 'building',
    color: '#0891B2',
    bgColor: 'rgba(8, 145, 178, 0.1)',
    description: '欣赏天津多元的建筑艺术'
  },
  '地方小吃': {
    name: '地方小吃',
    icon: 'utensils',
    color: '#EA580C',
    bgColor: 'rgba(234, 88, 12, 0.1)',
    description: '品尝地道的天津美食'
  },
  '方言文化': {
    name: '方言文化',
    icon: 'comment-dots',
    color: '#DB2777',
    bgColor: 'rgba(219, 39, 119, 0.1)',
    description: '学习有趣的天津方言'
  },
  '文学艺术': {
    name: '文学艺术',
    icon: 'palette',
    color: '#9333EA',
    bgColor: 'rgba(147, 51, 234, 0.1)',
    description: '感受天津的文学艺术魅力'
  },
  '宗教信仰': {
    name: '宗教信仰',
    icon: 'place-of-worship',
    color: '#4F46E5',
    bgColor: 'rgba(79, 70, 229, 0.1)',
    description: '了解天津的宗教文化'
  }
};

// 天津历史文化知识库数据
const tianjinKnowledgeBase: KnowledgeItem[] = [
  {
    id: 'tj-001',
    title: '杨柳青年画',
    category: '文化遗产',
    subcategory: '传统美术',
    content: '杨柳青年画是中国著名的民间木版年画之一，起源于天津市杨柳青镇，具有悠久的历史和独特的艺术风格。其特点是色彩鲜艳、线条流畅、形象生动，内容多以吉祥喜庆、历史故事、神话传说等为主题。杨柳青年画的制作工艺复杂，包括勾、刻、印、画、裱等多个环节，是中国民间艺术的瑰宝。',
    imageUrl: 'https://placehold.co/400x400/c02c38/ffffff?text=杨柳青年画',
    relatedItems: ['泥人张彩塑', '天津风筝魏'],
    sources: ['《中国民间美术史》', '《天津地方志》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-002',
    title: '泥人张彩塑',
    category: '传统技艺',
    subcategory: '雕塑艺术',
    content: '泥人张彩塑是天津著名的民间传统手工艺品，创始于清代道光年间，以张明山为代表。其作品以细腻的手法、逼真的形象和丰富的色彩著称，题材广泛，包括历史人物、民间故事、神话传说等。泥人张彩塑的制作工艺精湛，从取土、和泥、塑造到彩绘，每一个环节都需要高超的技艺和丰富的经验。',
    imageUrl: 'https://placehold.co/400x400/db2777/ffffff?text=泥人张彩塑',
    relatedItems: ['杨柳青年画', '天津风筝魏'],
    sources: ['《中国传统工艺全集》', '《天津民间艺术志》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-003',
    title: '天津方言',
    category: '方言文化',
    subcategory: '地方语言',
    content: '天津方言是中国北方方言的一种，具有独特的语音、词汇和语法特点。天津方言的语音特点包括一声变调、轻声较多、儿化音丰富等；词汇方面有很多独特的方言词，如“嘛”（什么）、“哏儿”（有趣）、“倍儿”（非常）等；语法上也有一些特殊的表达方式。天津方言生动活泼，富有表现力，是天津地域文化的重要组成部分。',
    imageUrl: 'https://placehold.co/400x400/7c3aed/ffffff?text=天津方言',
    relatedItems: ['天津民俗', '天津曲艺'],
    sources: ['《天津方言词典》', '《汉语方言大词典》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-004',
    title: '天津之眼',
    category: '建筑风格',
    subcategory: '现代建筑',
    content: '天津之眼是世界上唯一建在桥上的摩天轮，位于天津市红桥区海河畔，是天津的标志性建筑之一。摩天轮直径110米，轮外装挂48个360度透明座舱，每个座舱可乘坐8人，旋转一周约需30分钟。天津之眼不仅是一个游乐设施，也是欣赏天津城市风光的绝佳地点，尤其是夜晚灯光亮起时，美轮美奂。',
    imageUrl: 'https://placehold.co/400x400/2563eb/ffffff?text=天津之眼',
    relatedItems: ['海河', '天津夜景'],
    sources: ['天津旅游局官方网站', '《天津城市规划志》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-005',
    title: '狗不理包子',
    category: '地方小吃',
    subcategory: '传统美食',
    content: '狗不理包子是天津著名的传统小吃，始创于清代咸丰年间，以其皮薄、馅大、味道鲜美而闻名。其特点是选用优质面粉制作皮料，馅料讲究，制作工艺精细，每个包子有18个褶。狗不理包子的名称来源于创始人高贵有（乳名“狗子”），因其生意繁忙，顾不上搭理顾客，久而久之被称为“狗不理”。',
    imageUrl: 'https://placehold.co/400x400/ea580c/ffffff?text=狗不理包子',
    relatedItems: ['十八街麻花', '耳朵眼炸糕'],
    sources: ['《天津小吃志》', '《中国名小吃大全》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-006',
    title: '五大道建筑群',
    category: '建筑风格',
    subcategory: '近代建筑',
    content: '五大道位于天津市和平区，是天津近代建筑的集中地，拥有英、法、意、德、西班牙等国各式建筑2000多栋，其中风貌建筑300余栋。这些建筑风格多样，包括哥特式、罗马式、巴洛克式、文艺复兴式等，被誉为“万国建筑博览馆”。五大道是天津历史文化的重要载体，反映了天津近代的发展历程和多元文化融合的特点。',
    imageUrl: 'https://placehold.co/400x400/4f46e5/ffffff?text=五大道',
    relatedItems: ['意式风情区', '天津租界历史'],
    sources: ['《天津近代建筑志》', '《五大道历史文化街区保护规划》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-007',
    title: '天津时调',
    category: '文学艺术',
    subcategory: '曲艺',
    content: '天津时调是天津特有的曲艺形式，起源于清代，流行于天津及周边地区。它以天津方言演唱，曲调丰富，表现力强，内容多反映天津人民的生活和思想感情。天津时调的表演形式简单，通常由一人演唱，伴奏乐器主要有三弦、四胡等。其代表曲目有《放风筝》、《踢毽》、《大西厢》等。',
    imageUrl: 'https://placehold.co/400x400/9333ea/ffffff?text=天津时调',
    relatedItems: ['京韵大鼓', '天津快板'],
    sources: ['《中国曲艺志·天津卷》', '《天津曲艺史》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-008',
    title: '天后宫',
    category: '宗教信仰',
    subcategory: '道教',
    content: '天津天后宫俗称“娘娘宫”，位于南开区古文化街中心，是天津市区最古老的建筑群之一，也是中国北方最大的妈祖庙。天后宫始建于元代，明永乐年间重建，是天津城市发展的历史见证。天后宫内供奉着海神妈祖，每年农历三月二十三日是妈祖诞辰，届时会举行盛大的庙会活动，吸引众多信徒和游客前来朝拜。',
    imageUrl: 'https://placehold.co/400x400/dc2626/ffffff?text=天后宫',
    relatedItems: ['古文化街', '妈祖文化'],
    sources: ['《天津天后宫志》', '《中国道教宫观志》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-009',
    title: '十八街麻花',
    category: '地方小吃',
    subcategory: '传统美食',
    content: '十八街麻花是天津著名的传统小吃，始创于清代，因原店铺位于天津十八街而得名。其特点是香、酥、脆、甜，口感独特，久放不绵。制作工艺讲究，选用优质面粉、白糖、芝麻等原料，经过和面、搓条、拧花、油炸等多道工序制成。十八街麻花与狗不理包子、耳朵眼炸糕并称为"天津三绝"。',
    imageUrl: 'https://placehold.co/400x400/d97706/ffffff?text=十八街麻花',
    relatedItems: ['狗不理包子', '耳朵眼炸糕'],
    sources: ['《天津小吃志》', '《中国名小吃大全》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-010',
    title: '耳朵眼炸糕',
    category: '地方小吃',
    subcategory: '传统美食',
    content: '耳朵眼炸糕是天津传统名吃，始创于清代光绪年间，因店铺位于天津耳朵眼胡同而得名。炸糕选用优质糯米做皮，红豆沙做馅，经过油炸制成。其特点是外皮金黄酥脆，内馅香甜软糯，口感独特。耳朵眼炸糕与狗不理包子、十八街麻花并称为"天津三绝"，是天津最具代表性的传统小吃之一。',
    imageUrl: 'https://placehold.co/400x400/e11d48/ffffff?text=耳朵眼炸糕',
    relatedItems: ['狗不理包子', '十八街麻花'],
    sources: ['《天津小吃志》', '《中国名小吃大全》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-011',
    title: '天津风筝魏',
    category: '传统技艺',
    subcategory: '民间工艺',
    content: '天津风筝魏是中国著名的风筝制作世家，创始于清代同治年间，以魏元泰为代表。风筝魏的风筝以造型美观、色彩鲜艳、飞行稳定而著称，其制作工艺精湛，包括扎、糊、绘、放四个环节。风筝魏的风筝种类繁多，有软翅、硬翅、拍子、长串等多种类型，是中国传统风筝艺术的杰出代表。',
    imageUrl: 'https://placehold.co/400x400/0891b2/ffffff?text=天津风筝魏',
    relatedItems: ['杨柳青年画', '泥人张彩塑'],
    sources: ['《中国传统工艺全集》', '《天津民间艺术志》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-012',
    title: '海河',
    category: '建筑风格',
    subcategory: '自然景观',
    content: '海河是天津的母亲河，全长72公里，流经天津市区，是华北地区最大的水系之一。海河两岸风光秀丽，建筑林立，包括天津之眼、意式风情区、古文化街等著名景点。夜晚的海河灯光璀璨，游船穿梭，是天津最具魅力的城市景观之一。海河见证了天津的历史变迁，是天津城市发展的缩影。',
    imageUrl: 'https://placehold.co/400x400/0ea5e9/ffffff?text=海河',
    relatedItems: ['天津之眼', '意式风情区'],
    sources: ['《天津城市规划志》', '《海河志》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-013',
    title: '意式风情区',
    category: '建筑风格',
    subcategory: '近代建筑',
    content: '天津意式风情区位于河北区，是天津近代史上意大利租借地的遗址，拥有保存完整的意大利风格建筑群。区内有200多栋意大利风格建筑，包括别墅、花园、广场等，是中国唯一的意大利风格建筑群。意式风情区现已成为天津重要的文化旅游景点，集餐饮、娱乐、购物、观光于一体。',
    imageUrl: getPicsumUrl('yishifengqing-italian-style-architecture', 400, 400),
    relatedItems: ['五大道建筑群', '海河'],
    sources: ['《天津近代建筑志》', '《天津城市规划志》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-014',
    title: '天津相声',
    category: '文学艺术',
    subcategory: '曲艺',
    content: '天津是中国相声的发源地之一，相声艺术在天津有着深厚的群众基础和悠久的历史。天津相声以马三立、侯宝林等大师为代表，形成了独特的艺术风格。天津相声注重说、学、逗、唱四门基本功，语言幽默风趣，内容贴近生活，深受观众喜爱。天津的相声茶馆遍布全城，是体验天津民俗文化的重要场所。',
    imageUrl: getPicsumUrl('tianjin-xiangsheng-comedy-performance', 400, 400),
    relatedItems: ['天津时调', '天津快板'],
    sources: ['《中国曲艺志·天津卷》', '《天津曲艺史》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-015',
    title: '天津快板',
    category: '文学艺术',
    subcategory: '曲艺',
    content: '天津快板是天津特有的曲艺形式，起源于清代，流行于天津及周边地区。天津快板以竹板为伴奏乐器，表演者自击自唱，语言生动活泼，节奏明快有力。其内容多反映社会生活和民间故事，具有浓厚的地方特色。天津快板是天津民俗文化的重要组成部分，深受天津人民的喜爱。',
    imageUrl: 'https://placehold.co/400x400/10b981/ffffff?text=天津快板',
    relatedItems: ['天津相声', '天津时调'],
    sources: ['《中国曲艺志·天津卷》', '《天津曲艺史》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-016',
    title: '古文化街',
    category: '文化遗产',
    subcategory: '历史文化街区',
    content: '天津古文化街位于南开区，是一条以经营文化用品为主的商业步行街。街区内有天后宫、玉皇阁等历史建筑，以及众多传统店铺，经营杨柳青年画、泥人张彩塑、风筝魏风筝等天津传统工艺品。古文化街是天津传统文化的重要展示窗口，也是游客体验天津民俗文化的必到之地。',
    imageUrl: 'https://placehold.co/400x400/f97316/ffffff?text=古文化街',
    relatedItems: ['天后宫', '杨柳青年画'],
    sources: ['《天津地方志》', '《天津城市规划志》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

// 知识库服务类
class TianjinCultureService {
  private knowledgeBase: KnowledgeItem[] = tianjinKnowledgeBase;
  private readonly STORAGE_KEY = 'TIANJIN_CULTURE_KNOWLEDGE';

  constructor() {
    this.loadKnowledgeBase();
  }

  /**
   * 从本地存储加载知识库
   */
  private loadKnowledgeBase() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // 合并本地存储和默认数据，去重
        const merged = [...this.knowledgeBase];
        parsed.forEach((item: KnowledgeItem) => {
          const exists = merged.some(existing => existing.id === item.id);
          if (!exists) {
            merged.push(item);
          }
        });
        this.knowledgeBase = merged;
      }
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
    }
  }

  /**
   * 保存知识库到本地存储
   */
  private saveKnowledgeBase() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.knowledgeBase));
    } catch (error) {
      console.error('Failed to save knowledge base:', error);
    }
  }

  /**
   * 获取所有知识库条目
   */
  getAllKnowledge(): KnowledgeItem[] {
    return [...this.knowledgeBase];
  }

  /**
   * 根据ID获取知识库条目
   */
  getKnowledgeById(id: string): KnowledgeItem | undefined {
    return this.knowledgeBase.find(item => item.id === id);
  }

  /**
   * 根据分类获取知识库条目
   */
  getKnowledgeByCategory(category: string): KnowledgeItem[] {
    return this.knowledgeBase.filter(item => item.category === category);
  }

  /**
   * 根据子分类获取知识库条目
   */
  getKnowledgeBySubcategory(subcategory: string): KnowledgeItem[] {
    return this.knowledgeBase.filter(item => item.subcategory === subcategory);
  }

  /**
   * 搜索知识库条目
   */
  searchKnowledge(query: string): KnowledgeItem[] {
    const lowerQuery = query.toLowerCase();
    return this.knowledgeBase.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.content.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 添加知识库条目
   */
  addKnowledge(item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeItem {
    const newItem: KnowledgeItem = {
      ...item,
      id: `tj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.knowledgeBase.push(newItem);
    this.saveKnowledgeBase();
    return newItem;
  }

  /**
   * 更新知识库条目
   */
  updateKnowledge(id: string, updates: Partial<KnowledgeItem>): KnowledgeItem | undefined {
    const index = this.knowledgeBase.findIndex(item => item.id === id);
    if (index === -1) {
      return undefined;
    }

    this.knowledgeBase[index] = {
      ...this.knowledgeBase[index],
      ...updates,
      updatedAt: Date.now()
    };

    this.saveKnowledgeBase();
    return this.knowledgeBase[index];
  }

  /**
   * 删除知识库条目
   */
  deleteKnowledge(id: string): boolean {
    const initialLength = this.knowledgeBase.length;
    this.knowledgeBase = this.knowledgeBase.filter(item => item.id !== id);
    const deleted = this.knowledgeBase.length < initialLength;
    
    if (deleted) {
      this.saveKnowledgeBase();
    }
    
    return deleted;
  }

  /**
   * 获取相关条目
   */
  getRelatedItems(id: string): KnowledgeItem[] {
    const item = this.getKnowledgeById(id);
    if (!item || !item.relatedItems) {
      return [];
    }

    return item.relatedItems
      .map(relatedId => this.getKnowledgeById(relatedId))
      .filter((item): item is KnowledgeItem => item !== undefined);
  }
}

// 导出单例实例
const service = new TianjinCultureService();
export default service;
