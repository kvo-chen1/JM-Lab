/**
 * 创作模板服务模块
 * 提供模板的创建、读取、更新、删除等功能
 */

import { getPicsumUrl } from '@/utils/templateImageGenerator';

// 模板类型定义
export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  tags: string[];
  category: string;
  isOfficial: boolean;
  userId?: string;
  createdAt: number;
  updatedAt: number;
  usageCount: number;
  thumbnail?: string;
  // 新增模板元数据
  author?: string;
  version: string;
  rating?: number;
  downloadCount?: number;
  previewUrl?: string;
  isFeatured?: boolean;
  // 模板配置选项
  config?: {
    model?: string;
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    style?: string;
    resolution?: string;
    aspect_ratio?: string;
    duration?: number;
    fps?: number;
  };
  // 模板适用场景
  useCases: string[];
  // 模板语言
  language: string;
}

// 模板分类
export const TEMPLATE_CATEGORIES = [
  '国潮设计',
  '天津特色',
  '节日主题',
  '品牌包装',
  '插画设计',
  'IP设计',
  '数字艺术',
  '其他'
] as const;

// 模板服务类
class TemplateService {
  private templates: Template[] = [];
  private readonly STORAGE_KEY = 'CREATIVE_TEMPLATES';

  constructor() {
    this.loadTemplates();
    this.initOfficialTemplates();
  }

  /**
   * 初始化官方模板
   * 包含所有前台展示的模板：EXTENDED_TEMPLATES (30个) + jinMaiTemplates (8个)
   */
  private initOfficialTemplates() {
    const officialTemplates: Template[] = [
      // ========== 原有10个基础模板 ==========
      {
        id: 'official-1',
        name: '杨柳青年画风格模板',
        description: '融合杨柳青年画元素的现代设计模板',
        content: '【主题】杨柳青年画风格设计\n【色彩】传统中国红、金色、靛蓝\n【元素】娃娃、花卉、祥云纹\n【风格】工笔重彩+现代简约\n【应用场景】包装设计、海报、文创产品',
        tags: ['杨柳青', '国潮', '传统'],
        category: '天津特色',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('tianjin-yangliuqing-newyear-painting', 400, 400),
        version: '1.0.0',
        useCases: ['包装设计', '海报设计', '文创产品'],
        language: 'zh-CN',
        author: '官方模板',
        isFeatured: true,
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'traditional'
        }
      },
      {
        id: 'official-2',
        name: '天津小吃IP设计模板',
        description: '天津特色小吃的IP形象设计模板',
        content: '【主题】天津小吃IP形象\n【元素】天津小吃（狗不理包子、耳朵眼炸糕、十八街麻花）\n【风格】卡通可爱+津味特色\n【色彩】鲜艳明快，符合小吃特点\n【应用场景】IP设计、文创产品、品牌推广',
        tags: ['天津小吃', 'IP设计', '卡通'],
        category: '天津特色',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('tianjin-goubuli-famous-baozi', 400, 400),
        version: '1.0.0',
        useCases: ['IP设计', '文创产品', '品牌推广'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.8,
          top_p: 0.95,
          max_tokens: 2000,
          style: 'cartoon'
        }
      },
      {
        id: 'official-3',
        name: '国潮品牌包装模板',
        description: '适合国潮品牌的包装设计模板',
        content: '【主题】国潮品牌包装\n【色彩】中国红、墨黑、金色\n【元素】传统纹样（云纹、回纹、龙纹）\n【风格】传统与现代结合\n【应用场景】产品包装、礼盒设计、品牌推广',
        tags: ['国潮', '包装设计', '品牌'],
        category: '国潮设计',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('brand-collaboration-design', 400, 400),
        version: '1.0.0',
        useCases: ['产品包装', '礼盒设计', '品牌推广'],
        language: 'zh-CN',
        author: '官方模板',
        isFeatured: true,
        config: {
          model: 'kimi',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'luxury'
        }
      },
      {
        id: 'official-4',
        name: '节日主题海报模板',
        description: '适合各种节日的海报设计模板',
        content: '【主题】节日主题海报\n【色彩】根据节日调整（春节：红金；中秋：金黄；端午：青绿）\n【元素】节日特色元素（春节：灯笼、春联；中秋：月饼、月亮；端午：粽子、龙舟）\n【风格】喜庆热闹+现代设计\n【应用场景】节日海报、社交媒体推广、活动宣传',
        tags: ['节日', '海报设计', '宣传'],
        category: '节日主题',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('chinese-festival-celebration-poster', 400, 400),
        version: '1.0.0',
        useCases: ['节日海报', '社交媒体推广', '活动宣传'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'deepseek',
          temperature: 0.8,
          top_p: 0.95,
          max_tokens: 2000,
          style: 'festive'
        }
      },
      {
        id: 'official-5',
        name: '现代插画设计模板',
        description: '适合现代插画创作的模板',
        content: '【主题】现代插画设计\n【色彩】明亮清新、渐变色彩\n【元素】几何图形、抽象元素、人物\n【风格】扁平化、简约现代\n【应用场景】插画创作、社交媒体、绘本',
        tags: ['插画', '现代', '扁平化'],
        category: '插画设计',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('modern-flat-illustration-colorful', 400, 400),
        version: '1.0.0',
        useCases: ['插画创作', '社交媒体', '绘本'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.9,
          top_p: 0.95,
          max_tokens: 2000,
          style: 'modern'
        }
      },
      {
        id: 'official-6',
        name: 'IP角色设计模板',
        description: '适合IP角色创作的设计模板',
        content: '【主题】IP角色设计\n【色彩】鲜明独特、符合角色性格\n【元素】角色特征、服装、道具\n【风格】卡通、拟人化\n【应用场景】IP设计、游戏角色、动画角色',
        tags: ['IP设计', '角色设计', '卡通'],
        category: 'IP设计',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('tianjin-clay-figurine-colorful', 400, 400),
        version: '1.0.0',
        useCases: ['IP设计', '游戏角色', '动画角色'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'deepseek',
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'character'
        }
      },
      {
        id: 'official-7',
        name: '数字艺术创作模板',
        description: '适合数字艺术创作的模板',
        content: '【主题】数字艺术创作\n【色彩】大胆鲜明、对比强烈\n【元素】抽象图形、算法生成元素\n【风格】未来感、科技感\n【应用场景】数字艺术、NFT创作、新媒体艺术',
        tags: ['数字艺术', 'NFT', '科技感'],
        category: '数字艺术',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('tianjin-binhai-modern-architecture', 400, 400),
        version: '1.0.0',
        useCases: ['数字艺术', 'NFT创作', '新媒体艺术'],
        language: 'zh-CN',
        author: '官方模板',
        isFeatured: true,
        config: {
          model: 'kimi',
          temperature: 0.9,
          top_p: 0.95,
          max_tokens: 2000,
          style: 'futuristic'
        }
      },
      {
        id: 'official-8',
        name: '品牌包装设计模板',
        description: '适合品牌包装设计的模板',
        content: '【主题】品牌包装设计\n【色彩】品牌主色调、辅助色\n【元素】品牌Logo、产品信息、装饰元素\n【风格】简洁大气、品牌一致性\n【应用场景】产品包装、礼盒设计、品牌推广',
        tags: ['品牌包装', '设计', '商业'],
        category: '品牌包装',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('tianjin-traditional-brand-shop', 400, 400),
        version: '1.0.0',
        useCases: ['产品包装', '礼盒设计', '品牌推广'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.6,
          top_p: 0.8,
          max_tokens: 2000,
          style: 'professional'
        }
      },
      {
        id: 'official-9',
        name: '天津建筑风格模板',
        description: '融合天津建筑元素的设计模板',
        content: '【主题】天津建筑风格设计\n【色彩】砖红色、灰色、米色\n【元素】天津租界建筑、海河、桥梁\n【风格】中西合璧、历史感\n【应用场景】旅游宣传、城市品牌、文创产品',
        tags: ['天津', '建筑', '历史'],
        category: '天津特色',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('tianjin-wudadao-european-architecture', 400, 400),
        version: '1.0.0',
        useCases: ['旅游宣传', '城市品牌', '文创产品'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'deepseek',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'historical'
        }
      },
      {
        id: 'official-10',
        name: '春节主题设计模板',
        description: '适合春节主题创作的模板',
        content: '【主题】春节主题设计\n【色彩】中国红、金色、黑色\n【元素】灯笼、春联、福字、鞭炮\n【风格】喜庆热闹、传统吉祥\n【应用场景】春节海报、红包设计、节日宣传',
        tags: ['春节', '节日', '传统'],
        category: '节日主题',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('chinese-new-year-spring-festival', 400, 400),
        version: '1.0.0',
        useCases: ['春节海报', '红包设计', '节日宣传'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'kimi',
          temperature: 0.8,
          top_p: 0.95,
          max_tokens: 2000,
          style: 'festive'
        }
      },

      // ========== 节日主题模板 (6个) ==========
      {
        id: 'festival-1',
        name: '春节喜庆',
        description: '传统春节元素，红色喜庆氛围',
        content: '【主题】春节喜庆设计\n【色彩】中国红、金色\n【元素】灯笼、春联、福字\n【风格】传统喜庆\n【应用场景】春节海报、节日宣传',
        tags: ['春节', '喜庆', '传统'],
        category: '节日主题',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('chinese-festival-celebration', 400, 400),
        version: '1.0.0',
        useCases: ['节日海报', '社交媒体'],
        language: 'zh-CN',
        author: '官方模板',
        isFeatured: true,
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'festive'
        }
      },
      {
        id: 'festival-2',
        name: '中秋团圆',
        description: '月圆人团圆，典雅中秋主题',
        content: '【主题】中秋团圆设计\n【色彩】金黄、蓝色\n【元素】月亮、月饼、桂花\n【风格】典雅温馨\n【应用场景】中秋海报、礼品包装',
        tags: ['中秋', '团圆', '典雅'],
        category: '节日主题',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('chinese-mid-autumn-moon-festival', 400, 400),
        version: '1.0.0',
        useCases: ['节日海报', '包装设计'],
        language: 'zh-CN',
        author: '官方模板',
        isFeatured: true,
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'elegant'
        }
      },
      {
        id: 'festival-3',
        name: '端午龙舟',
        description: '龙舟竞渡，传承民俗文化',
        content: '【主题】端午龙舟设计\n【色彩】翠绿、青色\n【元素】龙舟、粽子、艾草\n【风格】传统民俗\n【应用场景】端午海报、文化宣传',
        tags: ['端午', '龙舟', '民俗'],
        category: '节日主题',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('chinese-dragon-boat-festival', 400, 400),
        version: '1.0.0',
        useCases: ['节日海报', '文化宣传'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'traditional'
        }
      },
      {
        id: 'festival-4',
        name: '元宵灯会',
        description: '灯火阑珊，浪漫元宵夜',
        content: '【主题】元宵灯会设计\n【色彩】暖黄、红色\n【元素】灯笼、灯谜、汤圆\n【风格】浪漫温馨\n【应用场景】元宵海报、活动宣传',
        tags: ['元宵', '灯会', '浪漫'],
        category: '节日主题',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('chinese-lantern-festival-night', 400, 400),
        version: '1.0.0',
        useCases: ['节日海报', '活动宣传'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'romantic'
        }
      },
      {
        id: 'festival-5',
        name: '重阳敬老',
        description: '登高望远，敬老爱老',
        content: '【主题】重阳敬老设计\n【色彩】暖色调、菊花黄\n【元素】菊花、登高、老人\n【风格】温馨敬老\n【应用场景】重阳海报、公益宣传',
        tags: ['重阳', '敬老', '温馨'],
        category: '节日主题',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('chinese-chongyang-festival', 400, 400),
        version: '1.0.0',
        useCases: ['节日海报', '公益宣传'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'warm'
        }
      },
      {
        id: 'festival-6',
        name: '国庆盛典',
        description: '盛世华诞，举国同庆',
        content: '【主题】国庆盛典设计\n【色彩】红色、金色\n【元素】五星红旗、烟花、天安门\n【风格】庄严喜庆\n【应用场景】国庆海报、庆典宣传',
        tags: ['国庆', '庆典', '爱国'],
        category: '节日主题',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('chinese-national-day-celebration', 400, 400),
        version: '1.0.0',
        useCases: ['节日海报', '庆典宣传'],
        language: 'zh-CN',
        author: '官方模板',
        isFeatured: true,
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'celebration'
        }
      },

      // ========== 行业模板 (8个) ==========
      {
        id: 'industry-1',
        name: '餐饮美食',
        description: '食欲感设计，美味诱惑',
        content: '【主题】餐饮美食设计\n【色彩】暖色调、食欲感\n【元素】食材、烹饪、美食\n【风格】美味诱人\n【应用场景】餐厅宣传、美食海报',
        tags: ['餐饮', '美食', '食欲'],
        category: '其他',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('food-delicious-cuisine', 400, 400),
        version: '1.0.0',
        useCases: ['餐厅宣传', '美食海报'],
        language: 'zh-CN',
        author: '官方模板',
        isFeatured: true,
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'appetizing'
        }
      },
      {
        id: 'industry-2',
        name: '茶叶茗品',
        description: '清雅茶道，文化传承',
        content: '【主题】茶叶茗品设计\n【色彩】清雅、自然\n【元素】茶叶、茶具、山水\n【风格】禅意清雅\n【应用场景】茶叶包装、品牌宣传',
        tags: ['茶叶', '茶道', '清雅'],
        category: '品牌包装',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('tea-ceremony-culture', 400, 400),
        version: '1.0.0',
        useCases: ['茶叶包装', '品牌宣传'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'zen'
        }
      },
      {
        id: 'industry-3',
        name: '酒类佳酿',
        description: '高贵典雅，品质之选',
        content: '【主题】酒类佳酿设计\n【色彩】金色、深色\n【元素】酒瓶、酒杯、酿造\n【风格】高贵典雅\n【应用场景】酒类包装、品牌宣传',
        tags: ['酒类', '典雅', '品质'],
        category: '品牌包装',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('wine-elegant-luxury', 400, 400),
        version: '1.0.0',
        useCases: ['酒类包装', '品牌宣传'],
        language: 'zh-CN',
        author: '官方模板',
        isFeatured: true,
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'luxury'
        }
      },
      {
        id: 'industry-4',
        name: '文创礼品',
        description: '文化创意，精致礼品',
        content: '【主题】文创礼品设计\n【色彩】多彩、创意\n【元素】文创元素、礼品、创意\n【风格】文化创意\n【应用场景】文创产品、礼品包装',
        tags: ['文创', '礼品', '创意'],
        category: '品牌包装',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('creative-gift-design', 400, 400),
        version: '1.0.0',
        useCases: ['文创产品', '礼品包装'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'creative'
        }
      },
      {
        id: 'industry-5',
        name: '零售百货',
        description: '现代商业，吸引客流',
        content: '【主题】零售百货设计\n【色彩】明快、现代\n【元素】商品、购物、促销\n【风格】现代商业\n【应用场景】商场宣传、促销活动',
        tags: ['零售', '商业', '现代'],
        category: '其他',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('retail-shopping-modern', 400, 400),
        version: '1.0.0',
        useCases: ['商场宣传', '促销活动'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'modern'
        }
      },
      {
        id: 'industry-6',
        name: '美妆护肤',
        description: '精致优雅，美丽绽放',
        content: '【主题】美妆护肤设计\n【色彩】粉色、优雅\n【元素】化妆品、护肤、美丽\n【风格】精致优雅\n【应用场景】美妆宣传、产品包装',
        tags: ['美妆', '护肤', '优雅'],
        category: '品牌包装',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('beauty-skincare-elegant', 400, 400),
        version: '1.0.0',
        useCases: ['美妆宣传', '产品包装'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'elegant'
        }
      },
      {
        id: 'industry-7',
        name: '家居生活',
        description: '温馨舒适，品质生活',
        content: '【主题】家居生活设计\n【色彩】温馨、自然\n【元素】家具、家居、生活\n【风格】温馨舒适\n【应用场景】家居宣传、产品展示',
        tags: ['家居', '生活', '温馨'],
        category: '其他',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('home-living-cozy', 400, 400),
        version: '1.0.0',
        useCases: ['家居宣传', '产品展示'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'cozy'
        }
      },
      {
        id: 'industry-8',
        name: '数码科技',
        description: '科技感强，未来已来',
        content: '【主题】数码科技设计\n【色彩】蓝紫、科技\n【元素】科技产品、数码、未来\n【风格】科技感\n【应用场景】科技宣传、产品发布',
        tags: ['数码', '科技', '未来'],
        category: '数字艺术',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('technology-digital-future', 400, 400),
        version: '1.0.0',
        useCases: ['科技宣传', '产品发布'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'tech'
        }
      },

      // ========== 津脉特色模板 (8个) ==========
      {
        id: 'jm-001',
        name: '杨柳青年画·连年有余',
        description: '传统年画风格，寓意吉祥',
        content: '【主题】杨柳青年画风格\n【色彩】红色、金色\n【元素】胖娃娃、鲤鱼、莲花\n【风格】传统年画\n【应用场景】年画创作、吉祥图案',
        tags: ['年画', '传统', '吉祥'],
        category: '天津特色',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 568,
        thumbnail: getPicsumUrl('yangliuqing-nianhua-traditional-folk-art', 400, 400),
        version: '1.0.0',
        useCases: ['年画创作', '吉祥图案'],
        language: 'zh-CN',
        author: '官方模板',
        isFeatured: true,
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'traditional'
        }
      },
      {
        id: 'jm-002',
        name: '泥人张·戏曲人物',
        description: '彩塑艺术，栩栩如生',
        content: '【主题】泥人张彩塑风格\n【色彩】鲜艳多彩\n【元素】京剧人物、彩塑、传统服饰\n【风格】彩塑艺术\n【应用场景】人物创作、戏曲艺术',
        tags: ['泥塑', '戏曲', '非遗'],
        category: '天津特色',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 423,
        thumbnail: getPicsumUrl('nirenzhang-clay-figurine-colorful-art', 400, 400),
        version: '1.0.0',
        useCases: ['人物创作', '戏曲艺术'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'colorful'
        }
      },
      {
        id: 'jm-003',
        name: '风筝魏·燕子风筝',
        description: '传统工艺，匠心独运',
        content: '【主题】风筝魏传统工艺\n【色彩】鲜艳、传统\n【元素】燕子风筝、竹骨、彩绘\n【风格】传统工艺\n【应用场景】风筝设计、传统工艺',
        tags: ['风筝', '工艺', '春天'],
        category: '天津特色',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 389,
        thumbnail: getPicsumUrl('fengzhengwei-kite-flying-sky-traditional', 400, 400),
        version: '1.0.0',
        useCases: ['风筝设计', '传统工艺'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'traditional'
        }
      },
      {
        id: 'jm-004',
        name: '天津之眼·夜景',
        description: '城市地标，璀璨夜色',
        content: '【主题】天津之眼夜景\n【色彩】璀璨、夜景\n【元素】摩天轮、海河、灯光\n【风格】现代都市\n【应用场景】城市宣传、夜景创作',
        tags: ['地标', '夜景', '现代'],
        category: '天津特色',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 892,
        thumbnail: getPicsumUrl('tianjin-eye-ferris-wheel-night-lights', 400, 400),
        version: '1.0.0',
        useCases: ['城市宣传', '夜景创作'],
        language: 'zh-CN',
        author: '官方模板',
        isFeatured: true,
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'modern'
        }
      },
      {
        id: 'jm-005',
        name: '狗不理包子·国潮',
        description: '老字号新演绎',
        content: '【主题】狗不理包子国潮\n【色彩】红色、喜庆\n【元素】包子、蒸汽、国潮\n【风格】国潮美食\n【应用场景】美食宣传、国潮设计',
        tags: ['美食', '老字号', '国潮'],
        category: '天津特色',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 567,
        thumbnail: getPicsumUrl('goubuli-baozi-steamed-buns-delicious', 400, 400),
        version: '1.0.0',
        useCases: ['美食宣传', '国潮设计'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'guochao'
        }
      },
      {
        id: 'jm-006',
        name: '五大道·民国风情',
        description: '历史建筑，欧陆风情',
        content: '【主题】五大道民国风情\n【色彩】复古、暖色\n【元素】欧式建筑、梧桐树、历史\n【风格】民国复古\n【应用场景】历史宣传、文化旅游',
        tags: ['历史', '建筑', '风情'],
        category: '天津特色',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 445,
        thumbnail: getPicsumUrl('wudadao-european-architecture-historic', 400, 400),
        version: '1.0.0',
        useCases: ['历史宣传', '文化旅游'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'vintage'
        }
      },
      {
        id: 'jm-007',
        name: '津门老字号·招牌',
        description: '传统招牌，百年传承',
        content: '【主题】津门老字号招牌\n【色彩】红色、金色\n【元素】传统招牌、老字号、牌匾\n【风格】传统商业\n【应用场景】招牌设计、品牌传承',
        tags: ['招牌', '老字号', '传统'],
        category: '天津特色',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 334,
        thumbnail: getPicsumUrl('tianjin-laozihao-traditional-signboard', 400, 400),
        version: '1.0.0',
        useCases: ['招牌设计', '品牌传承'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'traditional'
        }
      },
      {
        id: 'jm-008',
        name: '海河·津门水韵',
        description: '母亲河畔，城市脉络',
        content: '【主题】海河津门水韵\n【色彩】蓝色、水墨\n【元素】海河、桥梁、水韵\n【风格】水墨风格\n【应用场景】城市宣传、水墨创作',
        tags: ['海河', '水韵', '城市'],
        category: '天津特色',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 678,
        thumbnail: getPicsumUrl('haihe-river-tianjin-waterfront-city', 400, 400),
        version: '1.0.0',
        useCases: ['城市宣传', '水墨创作'],
        language: 'zh-CN',
        author: '官方模板',
        isFeatured: true,
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'ink'
        }
      },

      // ========== 风格模板 (8个) ==========
      {
        id: 'style-1',
        name: '国潮风尚',
        description: '传统与现代的完美融合',
        content: '【主题】国潮风尚设计\n【色彩】红金、传统\n【元素】传统元素、现代演绎\n【风格】国潮风格\n【应用场景】品牌设计、文创产品',
        tags: ['国潮', '传统', '现代'],
        category: '国潮设计',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('guochao-style-trendy-design', 400, 400),
        version: '1.0.0',
        useCases: ['品牌设计', '文创产品'],
        language: 'zh-CN',
        author: '官方模板',
        isFeatured: true,
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'guochao'
        }
      },
      {
        id: 'style-2',
        name: '极简主义',
        description: '少即是多，纯净美学',
        content: '【主题】极简主义设计\n【色彩】黑白、纯净\n【元素】简约线条、留白\n【风格】极简风格\n【应用场景】品牌设计、高端产品',
        tags: ['极简', '简约', '纯净'],
        category: '其他',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('minimalist-clean-design', 400, 400),
        version: '1.0.0',
        useCases: ['品牌设计', '高端产品'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.6,
          top_p: 0.8,
          max_tokens: 2000,
          style: 'minimalist'
        }
      },
      {
        id: 'style-3',
        name: '复古怀旧',
        description: '老上海风情，怀旧记忆',
        content: '【主题】复古怀旧设计\n【色彩】暖黄、复古\n【元素】老上海、怀旧元素\n【风格】复古风格\n【应用场景】复古品牌、文化宣传',
        tags: ['复古', '怀旧', '老上海'],
        category: '其他',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('vintage-retro-nostalgia', 400, 400),
        version: '1.0.0',
        useCases: ['复古品牌', '文化宣传'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'vintage'
        }
      },
      {
        id: 'style-4',
        name: '手绘插画',
        description: '温暖亲切，独特个性',
        content: '【主题】手绘插画设计\n【色彩】温暖、多彩\n【元素】手绘、插画、艺术\n【风格】手绘风格\n【应用场景】插画创作、文创产品',
        tags: ['手绘', '插画', '艺术'],
        category: '插画设计',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('hand-drawn-illustration-warm', 400, 400),
        version: '1.0.0',
        useCases: ['插画创作', '文创产品'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.9,
          top_p: 0.95,
          max_tokens: 2000,
          style: 'hand-drawn'
        }
      },
      {
        id: 'style-5',
        name: '水墨意境',
        description: '东方美学，意境深远',
        content: '【主题】水墨意境设计\n【色彩】黑白灰、水墨\n【元素】山水、水墨、东方\n【风格】水墨风格\n【应用场景】艺术创作、文化宣传',
        tags: ['水墨', '东方', '意境'],
        category: '插画设计',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('ink-wash-oriental-art', 400, 400),
        version: '1.0.0',
        useCases: ['艺术创作', '文化宣传'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'ink-wash'
        }
      },
      {
        id: 'style-6',
        name: '剪纸艺术',
        description: '民间艺术，精巧细腻',
        content: '【主题】剪纸艺术设计\n【色彩】红色、传统\n【元素】剪纸、民间艺术\n【风格】剪纸风格\n【应用场景】节日装饰、文化传承',
        tags: ['剪纸', '民间艺术', '传统'],
        category: '其他',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('paper-cutting-folk-art', 400, 400),
        version: '1.0.0',
        useCases: ['节日装饰', '文化传承'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'paper-cutting'
        }
      },
      {
        id: 'style-7',
        name: '青花瓷韵',
        description: '天青色等烟雨，经典传承',
        content: '【主题】青花瓷韵设计\n【色彩】蓝白、青花\n【元素】青花瓷、传统纹样\n【风格】青花瓷风格\n【应用场景】文创产品、高端包装',
        tags: ['青花瓷', '蓝白', '经典'],
        category: '国潮设计',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('blue-white-porcelain-classic', 400, 400),
        version: '1.0.0',
        useCases: ['文创产品', '高端包装'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'porcelain'
        }
      },
      {
        id: 'style-8',
        name: '敦煌飞天',
        description: '丝路瑰宝，艺术殿堂',
        content: '【主题】敦煌飞天设计\n【色彩】丰富、多彩\n【元素】飞天、敦煌、壁画\n【风格】敦煌风格\n【应用场景】艺术创作、文化宣传',
        tags: ['敦煌', '飞天', '艺术'],
        category: '国潮设计',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('dunhuang-flying-apsaras-art', 400, 400),
        version: '1.0.0',
        useCases: ['艺术创作', '文化宣传'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'dunhuang'
        }
      },

      // ========== 场景模板 (8个) ==========
      {
        id: 'scene-1',
        name: '产品包装',
        description: '精美包装，提升价值',
        content: '【主题】产品包装设计\n【色彩】品牌色、精美\n【元素】包装、品牌、产品\n【风格】包装风格\n【应用场景】产品包装、品牌展示',
        tags: ['包装', '品牌', '产品'],
        category: '品牌包装',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('product-packaging-design', 400, 400),
        version: '1.0.0',
        useCases: ['产品包装', '品牌展示'],
        language: 'zh-CN',
        author: '官方模板',
        isFeatured: true,
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'packaging'
        }
      },
      {
        id: 'scene-2',
        name: '社交媒体',
        description: '社交传播，引爆话题',
        content: '【主题】社交媒体设计\n【色彩】年轻、活力\n【元素】社交、媒体、传播\n【风格】社交风格\n【应用场景】社交媒体、内容传播',
        tags: ['社交', '媒体', '传播'],
        category: '其他',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('social-media-content', 400, 400),
        version: '1.0.0',
        useCases: ['社交媒体', '内容传播'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.9,
          top_p: 0.95,
          max_tokens: 2000,
          style: 'social'
        }
      },
      {
        id: 'scene-3',
        name: '门店空间',
        description: '空间设计，沉浸体验',
        content: '【主题】门店空间设计\n【色彩】品牌色、氛围\n【元素】空间、门店、体验\n【风格】空间风格\n【应用场景】门店设计、空间展示',
        tags: ['空间', '门店', '体验'],
        category: '其他',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('retail-space-interior', 400, 400),
        version: '1.0.0',
        useCases: ['门店设计', '空间展示'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'interior'
        }
      },
      {
        id: 'scene-4',
        name: '户外广告',
        description: '视觉冲击，吸引眼球',
        content: '【主题】户外广告设计\n【色彩】醒目、冲击\n【元素】户外、广告、视觉\n【风格】广告风格\n【应用场景】户外广告、品牌宣传',
        tags: ['户外', '广告', '视觉'],
        category: '其他',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('outdoor-advertising-billboard', 400, 400),
        version: '1.0.0',
        useCases: ['户外广告', '品牌宣传'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'advertising'
        }
      },
      {
        id: 'scene-5',
        name: '电商详情',
        description: '卖点突出，促进转化',
        content: '【主题】电商详情设计\n【色彩】明快、吸引\n【元素】电商、产品、详情\n【风格】电商风格\n【应用场景】电商详情、产品展示',
        tags: ['电商', '详情', '产品'],
        category: '其他',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('ecommerce-product-detail', 400, 400),
        version: '1.0.0',
        useCases: ['电商详情', '产品展示'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'ecommerce'
        }
      },
      {
        id: 'scene-6',
        name: '宣传海报',
        description: '海报设计，传播品牌',
        content: '【主题】宣传海报设计\n【色彩】醒目、吸引\n【元素】海报、宣传、品牌\n【风格】海报风格\n【应用场景】宣传海报、品牌推广',
        tags: ['海报', '宣传', '品牌'],
        category: '其他',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('promotional-poster-design', 400, 400),
        version: '1.0.0',
        useCases: ['宣传海报', '品牌推广'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'poster'
        }
      },
      {
        id: 'scene-7',
        name: '名片设计',
        description: '精致名片，商务必备',
        content: '【主题】名片设计\n【色彩】商务、精致\n【元素】名片、商务、品牌\n【风格】商务风格\n【应用场景】名片设计、商务展示',
        tags: ['名片', '商务', '精致'],
        category: '其他',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('business-card-design', 400, 400),
        version: '1.0.0',
        useCases: ['名片设计', '商务展示'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.6,
          top_p: 0.8,
          max_tokens: 2000,
          style: 'business'
        }
      },
      {
        id: 'scene-8',
        name: '画册手册',
        description: '品牌画册，全面展示',
        content: '【主题】画册手册设计\n【色彩】品牌色、丰富\n【元素】画册、手册、品牌\n【风格】画册风格\n【应用场景】画册设计、品牌展示',
        tags: ['画册', '手册', '品牌'],
        category: '品牌包装',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: getPicsumUrl('brochure-catalog-design', 400, 400),
        version: '1.0.0',
        useCases: ['画册设计', '品牌展示'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'brochure'
        }
      }
    ];

    // 检查并添加官方模板（如果不存在）
    officialTemplates.forEach(officialTemplate => {
      const exists = this.templates.some(t => t.id === officialTemplate.id);
      if (!exists) {
        this.templates.push(officialTemplate);
      }
    });

    this.saveTemplates();
  }

  /**
   * 从本地存储加载模板
   */
  private loadTemplates() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.templates = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      this.templates = [];
    }
  }

  /**
   * 保存模板到本地存储
   */
  private saveTemplates() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.templates));
    } catch (error) {
      console.error('Failed to save templates:', error);
    }
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): Template[] {
    return [...this.templates];
  }

  /**
   * 根据ID获取模板
   */
  getTemplateById(id: string): Template | undefined {
    return this.templates.find(t => t.id === id);
  }

  /**
   * 根据分类获取模板
   */
  getTemplatesByCategory(category: string): Template[] {
    return this.templates.filter(t => t.category === category);
  }

  /**
   * 根据标签获取模板
   */
  getTemplatesByTag(tag: string): Template[] {
    return this.templates.filter(t => t.tags.includes(tag));
  }

  /**
   * 搜索模板
   */
  searchTemplates(query: string): Template[] {
    const lowerQuery = query.toLowerCase();
    return this.templates.filter(t => 
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 创建模板
   */
  createTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'version' | 'useCases' | 'language'>): Template {
    const newTemplate: Template = {
      ...template,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
      version: '1.0.0',
      useCases: [],
      language: 'zh-CN',
      downloadCount: 0,
      rating: 0
    };

    this.templates.push(newTemplate);
    this.saveTemplates();
    return newTemplate;
  }

  /**
   * 更新模板
   */
  updateTemplate(id: string, updates: Partial<Template>): Template | undefined {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) {
      return undefined;
    }

    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      updatedAt: Date.now()
    };

    this.saveTemplates();
    return this.templates[index];
  }

  /**
   * 删除模板
   */
  deleteTemplate(id: string): boolean {
    const initialLength = this.templates.length;
    this.templates = this.templates.filter(t => t.id !== id || t.isOfficial);
    const deleted = this.templates.length < initialLength;
    
    if (deleted) {
      this.saveTemplates();
    }
    
    return deleted;
  }

  /**
   * 增加模板使用次数
   */
  incrementUsage(id: string): void {
    const template = this.templates.find(t => t.id === id);
    if (template) {
      template.usageCount++;
      this.saveTemplates();
    }
  }

  /**
   * 增加模板下载次数
   */
  incrementDownloadCount(id: string): void {
    const template = this.templates.find(t => t.id === id);
    if (template) {
      template.downloadCount = (template.downloadCount || 0) + 1;
      this.saveTemplates();
    }
  }

  /**
   * 为模板评分
   */
  rateTemplate(id: string, rating: number): void {
    const template = this.templates.find(t => t.id === id);
    if (template) {
      // 简单的平均评分计算，实际应用中可能需要更复杂的算法
      template.rating = rating;
      this.saveTemplates();
    }
  }

  /**
   * 获取模板下载次数
   */
  getDownloadCount(id: string): number {
    const template = this.templates.find(t => t.id === id);
    return template?.downloadCount || 0;
  }

  /**
   * 获取模板评分
   */
  getRating(id: string): number {
    const template = this.templates.find(t => t.id === id);
    return template?.rating || 0;
  }

  /**
   * 获取热门模板
   */
  getPopularTemplates(limit: number = 8): Template[] {
    return [...this.templates]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * 获取最新模板
   */
  getLatestTemplates(limit: number = 8): Template[] {
    return [...this.templates]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }
}

// 导出单例实例
const service = new TemplateService();
export default service;
