/**
 * 天津文化专家服务
 * 提供天津传统文化、老字号、非遗技艺等专业知识支持
 */

import { supabase } from '@/lib/supabase';

// 文化元素类型
export type CulturalElementType = 
  | 'intangible_heritage'  // 非遗技艺
  | 'time_honored_brand'   // 老字号
  | 'folk_art'            // 民间艺术
  | 'architecture'        // 建筑文化
  | 'cuisine'             // 美食文化
  | 'history'             // 历史文化
  | 'custom'              // 民俗风情
  | 'pattern';            // 传统纹样

// 文化元素接口
export interface CulturalElement {
  id: string;
  name: string;
  type: CulturalElementType;
  description: string;
  history: string;
  characteristics: string[];
  cultural_significance: string;
  application_suggestions: string[];
  visual_elements: string[];
  color_palette: string[];
  related_elements: string[];
  images?: string[];
  tags: string[];
}

// 老字号品牌
export interface TimeHonoredBrand {
  id: string;
  name: string;
  founded_year: number;
  category: string;
  description: string;
  signature_products: string[];
  brand_story: string;
  cultural_value: string;
  design_elements: string[];
  cooperation_opportunities: string[];
}

// 非遗技艺
export interface IntangibleHeritage {
  id: string;
  name: string;
  level: 'national' | 'municipal' | 'district';
  category: string;
  description: string;
  inheritance: string;
  techniques: string[];
  representative_works: string[];
  innovation_suggestions: string[];
  collaboration_models: string[];
}

// 文化使用建议
export interface CulturalUsageGuide {
  element_name: string;
  appropriate_usage: string[];
  inappropriate_usage: string[];
  design_tips: string[];
  color_suggestions: string[];
  composition_suggestions: string[];
  cultural_taboos: string[];
}

// 天津文化知识库
const TIANJIN_CULTURAL_KNOWLEDGE: CulturalElement[] = [
  {
    id: 'yangliuqing_nianhua',
    name: '杨柳青年画',
    type: 'intangible_heritage',
    description: '中国四大木版年画之一，始于明代，盛于清代，以细腻的线条和鲜艳的色彩著称',
    history: '杨柳青年画起源于明代崇祯年间，距今已有400多年历史。因产于天津杨柳青镇而得名，与苏州桃花坞、山东潍坊、四川绵竹并称中国四大木版年画。',
    characteristics: [
      '木版套印与手工彩绘相结合',
      '线条流畅细腻，色彩鲜艳明快',
      '题材多为吉祥喜庆、戏曲故事、胖娃娃等',
      '采用散点透视，构图饱满'
    ],
    cultural_significance: '杨柳青年画是天津民俗文化的代表，体现了北方民间艺术的独特魅力，承载着人们对美好生活的向往。',
    application_suggestions: [
      '可提取年画中的胖娃娃形象进行现代化设计',
      '借鉴年画的鲜艳配色方案',
      '运用传统纹样进行几何化处理',
      '结合年画构图方式进行现代插画创作'
    ],
    visual_elements: ['胖娃娃', '莲花', '鲤鱼', '牡丹', '蝙蝠', '寿桃', '喜鹊'],
    color_palette: ['#E60012', '#FFD700', '#00A651', '#0066CC', '#FF6B9D'],
    related_elements: ['泥人张', '风筝魏', '剪纸'],
    tags: ['年画', '非遗', '民间艺术', '传统工艺']
  },
  {
    id: 'nirenzhang',
    name: '泥人张',
    type: 'intangible_heritage',
    description: '天津传统泥塑艺术，以形神兼备、色彩明快著称',
    history: '泥人张彩塑创始于清代道光年间，由张明山先生创立，至今已有180多年历史。其作品以人物塑造见长，被誉为"立体的画，无声的戏"。',
    characteristics: [
      '形神兼备，栩栩如生',
      '色彩明快，对比强烈',
      '题材广泛，包括历史人物、戏曲人物、民间故事等',
      '采用独特的"塑彩结合"技法'
    ],
    cultural_significance: '泥人张是天津城市文化名片，代表了中国泥塑艺术的最高水平，体现了民间艺人的高超技艺。',
    application_suggestions: [
      '提取泥人张人物造型的线条特点',
      '借鉴泥塑的色彩搭配方式',
      '将立体造型转化为平面插画元素',
      '结合现代IP形象设计'
    ],
    visual_elements: ['戏曲人物', '胖娃娃', '历史人物', '民俗场景'],
    color_palette: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'],
    related_elements: ['杨柳青年画', '风筝魏'],
    tags: ['泥塑', '非遗', '民间艺术', '彩塑']
  },
  {
    id: 'fengzhengwei',
    name: '风筝魏',
    type: 'intangible_heritage',
    description: '天津传统风筝制作技艺，以造型优美、飞行稳定著称',
    history: '风筝魏由魏元泰先生于清末创立，距今已有100多年历史。其制作的风筝可以拆叠收纳，飞行稳定，被誉为"风筝世家"。',
    characteristics: [
      '造型优美，结构精巧',
      '可拆叠，便于携带',
      '飞行稳定，抗风能力强',
      '彩绘精美，色彩艳丽'
    ],
    cultural_significance: '风筝魏代表了中国传统风筝制作的最高技艺，体现了天津工匠精神的传承。',
    application_suggestions: [
      '提取风筝的造型线条',
      '借鉴风筝的对称美学',
      '运用风筝的彩绘图案',
      '结合现代装饰设计'
    ],
    visual_elements: ['燕子', '蝴蝶', '蜻蜓', '龙', '凤', '人物'],
    color_palette: ['#FF6B9D', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'],
    related_elements: ['杨柳青年画', '剪纸'],
    tags: ['风筝', '非遗', '民间工艺', '传统技艺']
  },
  {
    id: 'goubuli',
    name: '狗不理包子',
    type: 'time_honored_brand',
    description: '天津著名小吃，始创于1858年，以"皮薄馅大、十八个褶"著称',
    history: '狗不理包子始创于清咸丰年间，由高贵友创立。因店主乳名"狗子"，卖包子时忙得顾不上理人，故得名"狗不理"。',
    characteristics: [
      '皮薄馅大，汤汁丰富',
      '每个包子有十八个褶',
      '选料讲究，制作精细',
      '口感鲜美，肥而不腻'
    ],
    cultural_significance: '狗不理包子是天津饮食文化的代表，被誉为"天津三绝"之首，是天津的城市名片。',
    application_suggestions: [
      '包子造型可用于可爱风格设计',
      '十八褶元素可用于图案设计',
      '蒸笼元素可用于传统风格包装',
      '结合美食IP形象设计'
    ],
    visual_elements: ['包子', '蒸笼', '十八褶', '汤汁'],
    color_palette: ['#F5F5DC', '#D4A574', '#8B4513', '#FFD700'],
    related_elements: ['十八街麻花', '耳朵眼炸糕'],
    tags: ['美食', '老字号', '天津三绝', '传统小吃']
  },
  {
    id: 'shibajie_mahua',
    name: '十八街麻花',
    type: 'time_honored_brand',
    description: '天津传统名点，以香、脆、酥、甜著称',
    history: '十八街麻花始创于1927年，因店铺位于天津十八街而得名。创始人范贵才、范贵林兄弟创新了麻花制作工艺。',
    characteristics: [
      '香酥脆甜，口感独特',
      '造型美观，层次分明',
      '久放不绵，便于保存',
      '选料考究，制作精细'
    ],
    cultural_significance: '十八街麻花是"天津三绝"之一，代表了天津传统糕点的制作水平。',
    application_suggestions: [
      '麻花造型可用于装饰图案',
      '螺旋纹理可用于背景设计',
      '金黄色调可用于配色方案',
      '结合传统包装设计'
    ],
    visual_elements: ['麻花', '螺旋', '芝麻', '金丝'],
    color_palette: ['#FFD700', '#DAA520', '#8B4513', '#F4A460'],
    related_elements: ['狗不理包子', '耳朵眼炸糕'],
    tags: ['美食', '老字号', '天津三绝', '传统糕点']
  },
  {
    id: 'wudadao',
    name: '五大道',
    type: 'architecture',
    description: '天津历史文化街区，拥有2000多栋小洋楼，被誉为"万国建筑博览馆"',
    history: '五大道地区是天津近代租界时期的建筑群，包括马场道、睦南道、大理道、常德道、重庆道五条道路，拥有英、法、意、德、西班牙等国风格的建筑。',
    characteristics: [
      '建筑风格多样，中西合璧',
      '小洋楼林立，环境幽静',
      '历史文化底蕴深厚',
      '名人故居众多'
    ],
    cultural_significance: '五大道是天津近代历史的见证，体现了中西文化交融的独特魅力，是天津重要的文化遗产。',
    application_suggestions: [
      '提取欧式建筑元素进行设计',
      '借鉴五大道的街道布局美学',
      '运用复古色调进行配色',
      '结合城市文化IP设计'
    ],
    visual_elements: ['小洋楼', '拱形窗', '铁艺门', '梧桐树', '街灯'],
    color_palette: ['#8B7355', '#D4C4B0', '#A0522D', '#708090', '#F5F5DC'],
    related_elements: ['意式风情区', '古文化街'],
    tags: ['建筑', '历史文化', '租界', '洋楼']
  }
];

// 文化使用指南
const CULTURAL_USAGE_GUIDES: CulturalUsageGuide[] = [
  {
    element_name: '杨柳青年画',
    appropriate_usage: [
      '春节主题设计',
      '喜庆吉祥图案',
      '儿童产品设计',
      '传统文化推广'
    ],
    inappropriate_usage: [
      '丧葬用品设计',
      '过于现代化的解构（可能失去文化韵味）',
      '与负面内容结合'
    ],
    design_tips: [
      '保留年画的喜庆氛围',
      '可以适度简化线条',
      '注意色彩的协调性',
      '尊重传统纹样的寓意'
    ],
    color_suggestions: [
      '主色调可用中国红配金黄',
      '辅以翠绿和粉红',
      '避免过于暗沉的色调'
    ],
    composition_suggestions: [
      '采用对称或均衡构图',
      '主体突出，背景简洁',
      '注意留白，避免过于拥挤'
    ],
    cultural_taboos: [
      '避免将吉祥图案与不吉利元素结合',
      '尊重传统寓意，不随意篡改',
      '注意胖娃娃形象的正面呈现'
    ]
  },
  {
    element_name: '泥人张',
    appropriate_usage: [
      '人物造型设计',
      '戏曲文化推广',
      '儿童教育产品',
      '艺术品衍生设计'
    ],
    inappropriate_usage: [
      '不尊重的变形或恶搞',
      '与低俗内容结合',
      '破坏传统形象的严肃性'
    ],
    design_tips: [
      '保留人物的生动表情',
      '注意服饰细节的准确性',
      '色彩搭配要明快但不俗气',
      '可以适度卡通化但保持神韵'
    ],
    color_suggestions: [
      '使用明快的粉彩色调',
      '肤色要自然红润',
      '服饰色彩要符合传统审美'
    ],
    composition_suggestions: [
      '突出人物主体',
      '姿态要生动自然',
      '可以添加简单的道具'
    ],
    cultural_taboos: [
      '避免对人物形象的不尊重处理',
      '注意戏曲人物的身份准确性',
      '尊重传统工艺的精湛性'
    ]
  }
];

class CulturalExpertService {
  private cache: Map<string, any> = new Map();
  private cacheExpiry = 30 * 60 * 1000; // 30分钟缓存

  /**
   * 搜索文化元素
   */
  async searchCulturalElements(
    query: string,
    type?: CulturalElementType,
    limit: number = 5
  ): Promise<CulturalElement[]> {
    // 检查缓存
    const cacheKey = `search_${query}_${type}_${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    // 本地搜索
    let results = TIANJIN_CULTURAL_KNOWLEDGE.filter(element => {
      const matchesQuery = 
        element.name.includes(query) ||
        element.description.includes(query) ||
        element.tags.some(tag => tag.includes(query));
      const matchesType = !type || element.type === type;
      return matchesQuery && matchesType;
    });

    // 尝试数据库搜索
    try {
      const { data, error } = await supabase
        .from('cultural_elements')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(limit);

      if (!error && data) {
        results = [...results, ...data];
      }
    } catch (error) {
      console.log('数据库搜索失败，使用本地数据');
    }

    // 去重并限制数量
    results = results.slice(0, limit);

    // 更新缓存
    this.cache.set(cacheKey, { data: results, timestamp: Date.now() });

    return results;
  }

  /**
   * 获取文化元素详情
   */
  getCulturalElementById(id: string): CulturalElement | null {
    return TIANJIN_CULTURAL_KNOWLEDGE.find(e => e.id === id) || null;
  }

  /**
   * 获取文化元素使用指南
   */
  getUsageGuide(elementName: string): CulturalUsageGuide | null {
    return CULTURAL_USAGE_GUIDES.find(g => g.element_name === elementName) || null;
  }

  /**
   * 获取所有文化元素
   */
  getAllCulturalElements(): CulturalElement[] {
    return [...TIANJIN_CULTURAL_KNOWLEDGE];
  }

  /**
   * 按类型获取文化元素
   */
  getElementsByType(type: CulturalElementType): CulturalElement[] {
    return TIANJIN_CULTURAL_KNOWLEDGE.filter(e => e.type === type);
  }

  /**
   * 获取相关文化元素
   */
  getRelatedElements(elementId: string): CulturalElement[] {
    const element = this.getCulturalElementById(elementId);
    if (!element) return [];

    return TIANJIN_CULTURAL_KNOWLEDGE.filter(e => 
      e.id !== elementId && 
      (e.related_elements.includes(element.name) ||
       element.related_elements.includes(e.name))
    );
  }

  /**
   * 生成文化使用建议
   */
  generateCulturalAdvice(
    elementId: string,
    usageScenario: string
  ): string {
    const element = this.getCulturalElementById(elementId);
    const guide = element ? this.getUsageGuide(element.name) : null;

    if (!element) {
      return '未找到相关文化元素信息。';
    }

    let advice = `## ${element.name} 使用建议\n\n`;
    advice += `**文化背景：** ${element.description}\n\n`;
    
    advice += `**核心特征：**\n`;
    element.characteristics.forEach(char => {
      advice += `- ${char}\n`;
    });
    advice += '\n';

    advice += `**针对「${usageScenario}」的应用建议：**\n`;
    element.application_suggestions.forEach(suggestion => {
      advice += `- ${suggestion}\n`;
    });
    advice += '\n';

    if (guide) {
      advice += `**设计要点：**\n`;
      guide.design_tips.forEach(tip => {
        advice += `- ${tip}\n`;
      });
      advice += '\n';

      if (guide.cultural_taboos.length > 0) {
        advice += `**注意事项：**\n`;
        guide.cultural_taboos.forEach(taboo => {
          advice += `⚠️ ${taboo}\n`;
        });
      }
    }

    advice += `\n**推荐配色：** ${element.color_palette.join('、')}\n`;
    advice += `**相关元素：** ${element.related_elements.join('、')}\n`;

    return advice;
  }

  /**
   * 文化合规性检查
   */
  checkCulturalCompliance(
    designDescription: string,
    culturalElements: string[]
  ): {
    isCompliant: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // 检查每个文化元素
    culturalElements.forEach(elementName => {
      const guide = this.getUsageGuide(elementName);
      if (!guide) return;

      // 检查不恰当使用
      guide.inappropriate_usage.forEach(inappropriate => {
        if (designDescription.toLowerCase().includes(inappropriate.toLowerCase())) {
          issues.push(`「${elementName}」可能不适合用于：${inappropriate}`);
        }
      });

      // 检查文化禁忌
      guide.cultural_taboos.forEach(taboo => {
        const keywords = taboo.replace(/[避免注意]/g, '').trim();
        if (designDescription.includes(keywords)) {
          issues.push(`「${elementName}」${taboo}`);
        }
      });
    });

    // 生成建议
    culturalElements.forEach(elementName => {
      const guide = this.getUsageGuide(elementName);
      if (guide && issues.length > 0) {
        suggestions.push(...guide.design_tips.slice(0, 3));
      }
    });

    return {
      isCompliant: issues.length === 0,
      issues: [...new Set(issues)],
      suggestions: [...new Set(suggestions)]
    };
  }

  /**
   * 推荐适合的文化元素
   */
  recommendCulturalElements(
    designType: string,
    style: string,
    targetAudience: string,
    limit: number = 3
  ): CulturalElement[] {
    const recommendations: CulturalElement[] = [];

    // 根据设计类型推荐
    if (designType.includes('春节') || designType.includes('喜庆')) {
      recommendations.push(...this.getElementsByType('intangible_heritage')
        .filter(e => e.name === '杨柳青年画'));
    }

    if (designType.includes('美食') || designType.includes('餐饮')) {
      recommendations.push(...this.getElementsByType('time_honored_brand'));
    }

    if (designType.includes('建筑') || designType.includes('城市')) {
      recommendations.push(...this.getElementsByType('architecture'));
    }

    // 根据风格推荐
    if (style.includes('传统') || style.includes('国潮')) {
      recommendations.push(...this.getElementsByType('intangible_heritage'));
    }

    if (style.includes('欧式') || style.includes('复古')) {
      recommendations.push(...this.getElementsByType('architecture'));
    }

    // 去重并限制数量
    const unique = recommendations.filter((e, i, arr) => 
      arr.findIndex(t => t.id === e.id) === i
    );

    return unique.slice(0, limit);
  }

  /**
   * 生成文化元素融合建议
   */
  generateFusionSuggestions(
    primaryElement: string,
    secondaryElement: string
  ): string {
    const primary = this.getCulturalElementById(primaryElement);
    const secondary = this.getCulturalElementById(secondaryElement);

    if (!primary || !secondary) {
      return '无法找到指定的文化元素。';
    }

    let suggestions = `## ${primary.name} × ${secondary.name} 融合建议\n\n`;
    
    suggestions += `**融合主题：** 将${primary.name}的${primary.characteristics[0]}与${secondary.name}的${secondary.characteristics[0]}相结合\n\n`;
    
    suggestions += `**视觉融合方案：**\n`;
    suggestions += `1. **色彩融合：** 结合${primary.name}的${primary.color_palette.slice(0, 2).join('、')}与${secondary.name}的${secondary.color_palette.slice(0, 2).join('、')}\n`;
    suggestions += `2. **元素提取：** 从${primary.name}提取「${primary.visual_elements.slice(0, 2).join('、')}」，从${secondary.name}提取「${secondary.visual_elements.slice(0, 2).join('、')}」\n`;
    suggestions += `3. **构图参考：** 参考${primary.name}的${primary.characteristics[1]}，结合${secondary.name}的${secondary.characteristics[1]}\n\n`;

    suggestions += `**应用场景：**\n`;
    suggestions += `- 文创产品设计\n`;
    suggestions += `- 品牌视觉设计\n`;
    suggestions += `- 包装装潢设计\n`;
    suggestions += `- 数字媒体设计\n\n`;

    suggestions += `**注意事项：**\n`;
    suggestions += `- 保持两种文化元素的平衡，避免主次不分\n`;
    suggestions += `- 尊重各自的文化内涵，避免不恰当的组合\n`;
    suggestions += `- 建议先制作草图，确认融合效果后再深入设计\n`;

    return suggestions;
  }

  /**
   * 获取天津文化概览
   */
  getTianjinCultureOverview(): string {
    return `## 天津文化概览\n\n` +
      `天津，一座拥有600多年历史的文化名城，是近代中国对外开放的窗口，也是传统文化与现代文明交融的典范。\n\n` +
      `**非遗技艺（${this.getElementsByType('intangible_heritage').length}项）：**\n` +
      this.getElementsByType('intangible_heritage').map(e => `• ${e.name}`).join('\n') + `\n\n` +
      `**老字号品牌（${this.getElementsByType('time_honored_brand').length}项）：**\n` +
      this.getElementsByType('time_honored_brand').map(e => `• ${e.name}`).join('\n') + `\n\n` +
      `**建筑文化（${this.getElementsByType('architecture').length}项）：**\n` +
      this.getElementsByType('architecture').map(e => `• ${e.name}`).join('\n') + `\n\n` +
      `**文化特色：**\n` +
      `- 中西合璧：租界历史留下的万国建筑与传统文化并存\n` +
      `- 码头文化：九河下梢的地理位置孕育的包容开放精神\n` +
      `- 曲艺之乡：相声、快板等民间艺术的繁荣发展\n` +
      `- 美食之都：狗不理、十八街麻花等闻名遐迩的特色小吃\n`;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// 导出单例实例
export const culturalExpertService = new CulturalExpertService();
