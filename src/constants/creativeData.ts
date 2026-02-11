export interface Template {
  id: string;
  title: string;
  style: string;
  icon: string;
  desc: string;
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

export type ToolType = 'sketch' | 'upload' | 'pattern' | 'filter' | 'trace' | 'remix' | 'layout' | 'mockup' | 'tile';

export interface ToolOption {
  id: ToolType;
  name: string;
  icon: string;
}

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
  { id: 't1', title: '节日促销海报', style: 'festive promotion poster, vibrant red and gold', icon: 'gifts', desc: '适合春节、中秋等传统节日营销' },
  { id: 't2', title: '极简产品包装', style: 'minimalist product packaging design, clean white background', icon: 'box-open', desc: '现代简约风格，突出产品本身' },
  { id: 't3', title: '社交媒体封面', style: 'social media cover, trendy layout, bold typography', icon: 'hashtag', desc: '适配各平台尺寸的封面设计' },
  { id: 't4', title: '国潮插画KV', style: 'Guochao illustration, traditional chinese patterns mixed with modern art', icon: 'paint-brush', desc: '传统与现代融合的插画风格' },
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
  { id: 'ct1', name: '春节营销', icon: 'fa-gift', desc: '新春佳节专属营销方案', content: '${brand} 春节营销设计；主色中国红+金色；包含传统纹样与节日元素；营造喜庆氛围。' },
  { id: 'ct2', name: '中秋礼盒', icon: 'fa-moon', desc: '中秋团圆主题设计', content: '${brand} 中秋礼盒设计；月兔、桂花元素；典雅蓝金配色；传递团圆祝福。' },
  { id: 'ct3', name: '端午安康', icon: 'fa-water', desc: '端午节传统文化设计', content: '${brand} 端午主题设计；龙舟、粽子元素；翠绿配色；传承民俗文化。' },
  { id: 'ct4', name: '国庆盛典', icon: 'fa-flag', desc: '国庆节爱国主题设计', content: '${brand} 国庆主题设计；红色主调；五星元素；展现爱国情怀。' },
  
  // 行业模板
  { id: 'ct5', name: '餐饮美食', icon: 'fa-utensils', desc: '餐饮行业专属设计方案', content: '${brand} 餐饮品牌设计；食欲感配色；食材元素；突出美味诱惑。' },
  { id: 'ct6', name: '茶叶茗品', icon: 'fa-mug-hot', desc: '茶叶品牌雅致设计', content: '${brand} 茶叶品牌设计；山水意境；清雅配色；传递茶道文化。' },
  { id: 'ct7', name: '酒类佳酿', icon: 'fa-wine-bottle', desc: '酒类产品高端设计', content: '${brand} 酒类包装设计；高贵典雅；金色点缀；彰显品质与历史。' },
  { id: 'ct8', name: '文创礼品', icon: 'fa-gift', desc: '文化创意礼品设计', content: '${brand} 文创礼品设计；传统元素现代化；实用美观；适合作为伴手礼。' },
  { id: 'ct9', name: '零售百货', icon: 'fa-shopping-bag', desc: '零售品牌商业设计', content: '${brand} 零售品牌设计；明快配色；现代感强；吸引年轻消费者。' },
  
  // 场景模板
  { id: 'ct10', name: '产品包装', icon: 'fa-box', desc: '设计独特的品牌包装方案', content: '${brand} 产品包装设计；突出品牌特色；环保材质与现代工艺结合。' },
  { id: 'ct11', name: '社交媒体', icon: 'fa-share-alt', desc: '适合各平台的社交传播内容', content: '${brand} 社交媒体视觉；年轻化设计；适合小红书/微博/抖音传播。' },
  { id: 'ct12', name: '品牌联名', icon: 'fa-handshake', desc: '跨界联名的创意设计方案', content: '${brand} 跨界联名设计；融合双方品牌元素；创造独特视觉记忆点。' },
  { id: 'ct13', name: '门店空间', icon: 'fa-store', desc: '线下门店空间设计方案', content: '${brand} 门店空间设计；传统与现代融合；营造沉浸式品牌体验。' },
  { id: 'ct14', name: '户外广告', icon: 'fa-bullhorn', desc: '户外大型广告设计', content: '${brand} 户外广告设计；视觉冲击力强；远距离识别度高；吸引眼球。' },
  { id: 'ct15', name: '电商详情', icon: 'fa-shopping-cart', desc: '电商平台详情页设计', content: '${brand} 电商详情页；卖点突出；图文结合；促进转化。' },
  
  // 风格模板
  { id: 'ct16', name: '国潮风尚', icon: 'fa-dragon', desc: '国潮风格现代演绎', content: '${brand} 国潮风格设计；传统元素现代化；年轻时尚；文化自信。' },
  { id: 'ct17', name: '极简主义', icon: 'fa-minus', desc: '极简风格纯净设计', content: '${brand} 极简设计；留白艺术；少即是多；高端大气。' },
  { id: 'ct18', name: '复古怀旧', icon: 'fa-history', desc: '复古风格情怀设计', content: '${brand} 复古设计；老上海风情；怀旧色调；唤起记忆。' },
  { id: 'ct19', name: '科技感', icon: 'fa-microchip', desc: '科技风格未来设计', content: '${brand} 科技风格设计；几何线条；蓝紫配色；未来感十足。' },
  { id: 'ct20', name: '手绘插画', icon: 'fa-paint-brush', desc: '手绘风格温暖设计', content: '${brand} 手绘插画设计；温暖亲切；独特个性；艺术感强。' },
];

export const BRAND_FONTS: BrandFont[] = [
  { id: 'SimSun', name: '宋体', desc: '传统典雅' },
  { id: 'KaiTi', name: '楷体', desc: '书法韵味' },
  { id: 'Heiti', name: '黑体', desc: '现代简约' },
  { id: 'FangSong', name: '仿宋', desc: '古典雅致' },
  { id: 'LiSu', name: '隶书', desc: '古朴庄重' },
];

export const AI_GENERATED_RESULTS: GeneratedResult[] = [
  {
    id: 1,
    thumbnail: 'https://picsum.photos/id/1015/600/400',
    score: 85,
  },
  {
    id: 2,
    thumbnail: 'https://picsum.photos/id/1002/600/400',
    score: 78,
  },
  {
    id: 3,
    thumbnail: 'https://picsum.photos/id/1003/600/400',
    score: 92,
  },
  {
    id: 4,
    thumbnail: 'https://picsum.photos/id/1004/600/400',
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

export const TOOL_OPTIONS: ToolOption[] = [
  { id: 'sketch', name: '一键设计', icon: 'magic' },
  { id: 'upload', name: '上传作品', icon: 'upload' },
  { id: 'pattern', name: '纹样嵌入', icon: 'th' },
  { id: 'filter', name: 'AI滤镜', icon: 'filter' },
  { id: 'trace', name: '文化溯源', icon: 'book-open' },
  { id: 'remix', name: '风格重混', icon: 'random' },
  { id: 'layout', name: '版式生成', icon: 'th-large' },
  { id: 'mockup', name: '模型预览', icon: 'box-open' },
  { id: 'tile', name: '图案平铺', icon: 'border-all' }
];
