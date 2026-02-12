/**
 * 模板图片URL生成工具
 * 使用可靠的免费图片服务生成与模板主题匹配的图片
 */

// 使用固定的种子值确保图片一致性
const generateSeed = (templateName: string): number => {
  let hash = 0;
  for (let i = 0; i < templateName.length; i++) {
    const char = templateName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 10000;
};

/**
 * 使用 Picsum 获取随机图片（带特定种子）
 * @param seed 种子值
 * @param width 图片宽度
 * @param height 图片高度
 * @returns Picsum图片URL
 */
export function getPicsumUrl(seed: string, width: number = 800, height: number = 600): string {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

/**
 * 模板主题图片配置
 * 为每个模板主题配置最合适的图片种子
 * 使用 Picsum 的 seed 功能确保图片与主题匹配且稳定
 */
export interface ImageConfig {
  seed: string;
  fallbackSeed?: string;
}

export const templateImageConfigs: Record<string, ImageConfig> = {
  // ========== 原有12个模板 ==========
  '津沽文化节主题模板': { seed: 'tianjin-culture-festival-red-lanterns' },
  '五大道历史风情模板': { seed: 'tianjin-wudadao-european-architecture' },
  '静海葡萄节活动模板': { seed: 'tianjin-jinghai-grape-vineyard' },
  '海河风光模板': { seed: 'tianjin-haihe-river-cityscape' },
  '老字号联名模板': { seed: 'tianjin-traditional-brand-shop' },
  '夜游光影视觉模板': { seed: 'tianjin-night-city-lights' },
  '海河滨水休闲模板': { seed: 'tianjin-riverside-leisure-park' },
  '北塘海鲜美食模板': { seed: 'tianjin-beitang-seafood-feast' },
  '文博展陈主题模板': { seed: 'tianjin-museum-exhibition' },
  '蓟州长城风光模板': { seed: 'tianjin-jizhou-great-wall' },
  '天津小吃宣传模板': { seed: 'tianjin-street-food-dumplings' },
  '杨柳青年画主题模板': { seed: 'tianjin-yangliuqing-folk-art' },

  // ========== 新增城市风光模板 ==========
  '天津之眼摩天轮模板': { seed: 'tianjin-eye-ferris-wheel-night' },
  '天津港工业风模板': { seed: 'tianjin-port-industrial-cranes' },
  '天津大学校园模板': { seed: 'tianjin-university-campus-spring' },
  '南开大学风光模板': { seed: 'nankai-university-historic-campus' },
  '滨海新区现代建筑模板': { seed: 'tianjin-binhai-modern-architecture' },

  // ========== 新增历史风情模板 ==========
  '意式风情区模板': { seed: 'tianjin-italian-style-town-cobblestone' },
  '独乐寺古建筑模板': { seed: 'tianjin-dule-temple-ancient' },
  '天津鼓楼模板': { seed: 'tianjin-drum-tower-traditional' },
  '天津解放桥模板': { seed: 'tianjin-jiefang-bridge-steel' },
  '天津利顺德大饭店模板': { seed: 'tianjin-astor-house-hotel' },

  // ========== 新增文博展陈模板 ==========
  '瓷房子艺术模板': { seed: 'tianjin-porcelain-house-ceramic' },
  '泥人张彩塑模板': { seed: 'tianjin-clay-figurine-colorful' },
  '天津博物馆文化模板': { seed: 'tianjin-museum-cultural' },
  '天津大剧院艺术模板': { seed: 'tianjin-grand-theatre-modern' },

  // ========== 新增城市休闲模板 ==========
  '盘山风景区模板': { seed: 'tianjin-panshan-mountain-scenic' },
  '风筝魏风筝模板': { seed: 'tianjin-weis-kite-flying' },

  // ========== 新增美食宣传模板 ==========
  '狗不理包子制作模板': { seed: 'tianjin-goubuli-baozi-making' },

  // ========== 新增节日主题模板 ==========
  '古文化街民俗模板': { seed: 'tianjin-ancient-culture-street' },
  '天津相声文化模板': { seed: 'tianjin-crosstalk-performance-stage' },

  // ========== 新增夜游光影模板 ==========
  '滨海新区夜景模板': { seed: 'tianjin-binhai-night-cityscape' },

  // ========== 津门老字号系列模板 ==========
  '狗不理包子老字号模板': { seed: 'tianjin-goubuli-famous-baozi' },
  '耳朵眼炸糕老字号模板': { seed: 'tianjin-erduoyan-fried-cake' },
  '十八街麻花老字号模板': { seed: 'tianjin-18th-street-mahua' },
  '桂发祥麻花老字号模板': { seed: 'tianjin-guifaxiang-mahua' },
  '崩豆张老字号模板': { seed: 'tianjin-bengdouzhang-roasted-beans' },
  '皮糖张老字号模板': { seed: 'tianjin-pitangzhang-peanut-candy' },
  '果仁张老字号模板': { seed: 'tianjin-guorenzhang-nuts' },
  '泥人张老字号模板': { seed: 'tianjin-nirenzhang-clay-art' },
  '风筝魏老字号模板': { seed: 'tianjin-fengzhengwei-kite-craft' },
  '杨柳青年画老字号模板': { seed: 'tianjin-yangliuqing-newyear-painting' },
  '老美华鞋店老字号模板': { seed: 'tianjin-laomeihua-cloth-shoes' },
  '盛锡福帽子老字号模板': { seed: 'tianjin-shengxifu-hat-shop' },
  '正兴德茶叶老字号模板': { seed: 'tianjin-zhengxingde-tea-house' },
  '达仁堂药店老字号模板': { seed: 'tianjin-darentang-medicine-shop' },
  '隆顺榕药店老字号模板': { seed: 'tianjin-longshunrong-pharmacy' },
  '劝业场商场老字号模板': { seed: 'tianjin-quanyechang-department-store' },
  '亨得利钟表老字号模板': { seed: 'tianjin-hengdeli-watch-shop' },
  '海鸥手表老字号模板': { seed: 'tianjin-seagull-watch-brand' },
};

/**
 * 获取模板图片URL
 * @param templateName 模板名称
 * @param width 图片宽度
 * @param height 图片高度
 * @returns 图片URL
 */
export function getTemplateImageUrl(templateName: string, width: number = 800, height: number = 600): string {
  const config = templateImageConfigs[templateName];
  
  if (!config) {
    // 使用模板名称生成默认seed
    const defaultSeed = templateName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    return getPicsumUrl(defaultSeed, width, height);
  }

  return getPicsumUrl(config.seed, width, height);
}

/**
 * 获取模板预览图数组
 * @param templateName 模板名称
 * @param count 预览图数量
 * @returns 预览图URL数组
 */
export function getTemplatePreviewImages(templateName: string, count: number = 2): string[] {
  const images: string[] = [];
  const config = templateImageConfigs[templateName];
  const baseSeed = config?.seed || templateName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

  for (let i = 0; i < count; i++) {
    images.push(getPicsumUrl(`${baseSeed}-preview-${i}`, 800, 600));
  }

  return images;
}

/**
 * 分类默认图片映射
 */
export const categoryDefaultImages: Record<string, string> = {
  '节日主题': getPicsumUrl('chinese-festival-celebration', 800, 600),
  '历史风情': getPicsumUrl('historic-architecture-heritage', 800, 600),
  '城市风光': getPicsumUrl('city-skyline-urban', 800, 600),
  '美食宣传': getPicsumUrl('chinese-food-delicious', 800, 600),
  '品牌联名': getPicsumUrl('brand-collaboration-design', 800, 600),
  '夜游光影': getPicsumUrl('city-night-lights', 800, 600),
  '城市休闲': getPicsumUrl('urban-park-leisure', 800, 600),
  '文博展陈': getPicsumUrl('museum-exhibition-art', 800, 600),
  '津门老字号': getPicsumUrl('traditional-chinese-shop-storefront', 800, 600),
};
