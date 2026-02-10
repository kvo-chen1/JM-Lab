import { TianjinTemplate } from '@/services/tianjinActivityService';

/**
 * 模板提示词生成器
 * 根据模板信息自动生成AI创作提示词
 */

// 天津文化元素关键词库
const tianjinCulturalElements: Record<string, string[]> = {
  '节日主题': [
    '杨柳青年画风格', '传统中国红', '喜庆氛围', '灯笼元素', '剪纸艺术',
    '庙会场景', '传统民俗', '节日庆典', '天津特色年货', '古文化街热闹场景'
  ],
  '历史风情': [
    '五大道欧式建筑', '意式风情区', '天津卫老城', '近代历史建筑', '洋楼建筑群',
    '历史街区', '民国风情', '租界建筑', '历史文化', '传统胡同'
  ],
  '城市风光': [
    '海河夜景', '天津之眼', '津湾广场', '现代化CBD', '城市天际线',
    '海河两岸', '桥梁建筑', '城市倒影', '繁华都市', '滨水风光'
  ],
  '美食宣传': [
    '狗不理包子', '耳朵眼炸糕', '十八街麻花', '天津特色小吃', '传统美食',
    '美食摄影', '诱人食欲', '精致摆盘', '美食文化', '老字号风味'
  ],
  '品牌联名': [
    '老字号品牌', '传统与现代融合', '品牌升级', '文化传承', '创新设计',
    '品牌故事', '传统元素现代化', '文化IP', '品牌视觉', '联名设计'
  ],
  '夜游光影': [
    '海河灯光秀', '夜景摄影', '霓虹灯光', '城市夜景', '光影艺术',
    '夜间氛围', '灯光璀璨', '夜色迷人', '现代都市夜景', '灯光倒影'
  ],
  '城市休闲': [
    '海河滨水', '休闲生活', '城市公园', '慢生活', '市民休闲',
    '滨水步道', '城市绿洲', '放松氛围', '生活品质', '城市度假'
  ],
  '文博展陈': [
    '博物馆展览', '文化艺术', '文物展示', '历史文化', '艺术展览',
    '文化传承', '博物馆空间', '展陈设计', '文化氛围', '艺术品展示'
  ]
};

// 风格描述词库
const styleDescriptions: Record<string, string> = {
  '传统国潮': '传统中国风格与现代国潮元素结合，色彩鲜艳，构图饱满，具有强烈的视觉冲击力',
  '复古欧式': '复古欧式建筑风格，色调温暖，充满历史感，展现近代天津的洋楼风情',
  '现代都市': '现代都市风格，简洁大气，展现天津现代化城市面貌和繁华景象',
  '清新自然': '清新自然风格，色调柔和，展现天津的自然风光和休闲生活',
  '新中式': '新中式设计风格，传统元素与现代设计融合，典雅大气',
  '光影艺术': '光影艺术风格，强调灯光效果和夜间氛围，色彩丰富层次分明',
  '休闲生活': '生活化场景，轻松愉悦的氛围，展现天津人的休闲生活方式',
  '美食摄影': '美食摄影风格，色彩诱人，细节丰富，突出食物的质感和美味',
  '文化展览': '文化展览风格，庄重典雅，突出文化底蕴和艺术气息',
  '自然风光': '自然风光摄影风格，展现天津的自然美景和地理特色',
  '传统年画': '杨柳青年画风格，色彩鲜艳，线条流畅，充满传统民俗艺术特色',
  '美食插画': '美食插画风格，色彩明快，形象生动，具有手绘质感'
};

// 构图描述词库
const compositionDescriptions: Record<string, string> = {
  '节日主题': '中心对称构图，主体突出，周围环绕节日装饰元素',
  '历史风情': '景深构图，前景建筑清晰，背景虚化，营造历史纵深感',
  '城市风光': '广角构图，展现城市全景，天际线清晰，层次分明',
  '美食宣传': '特写构图，食物位于画面中心，背景简洁突出主体',
  '品牌联名': '平衡构图，品牌元素与设计元素和谐统一',
  '夜游光影': '低角度构图，强调灯光效果和城市夜景的璀璨',
  '城市休闲': '生活化构图，自然随意，展现真实的休闲场景',
  '文博展陈': '对称构图，庄重典雅，突出展品的文化艺术价值'
};

// 色彩描述词库
function generateColorDescription(colorScheme?: string[]): string {
  if (!colorScheme || colorScheme.length === 0) {
    return '色彩搭配和谐，符合主题氛围';
  }
  
  const colorNames = colorScheme.map(color => {
    // 简单的颜色名称映射
    const colorMap: Record<string, string> = {
      '#C41E3A': '中国红', '#FFD700': '金色', '#1a1a1a': '深黑',
      '#8B7355': '棕褐色', '#F5F5DC': '米色', '#2F4F4F': '深灰',
      '#9ACD32': '黄绿色', '#8B008B': '深紫色', '#FFF8DC': '米黄色',
      '#1E90FF': '亮蓝色', '#FFFFFF': '白色', '#FF6347': '番茄红',
      '#FFA500': '橙色', '#228B22': '森林绿', '#8B4513': '棕色',
      '#87CEEB': '天蓝色', '#90EE90': '浅绿色', '#FF6B6B': '珊瑚红',
      '#FFE66D': '淡黄色', '#4ECDC4': '青绿色', '#DC143C': '深红色',
      '#4A4A4A': '灰色', '#D4AF37': '金黄色', '#FFFFF0': '象牙白'
    };
    return colorMap[color.toUpperCase()] || color;
  });
  
  return `以${colorNames.join('、')}为主色调，色彩搭配${colorNames.length > 2 ? '丰富' : '简洁'}和谐`;
}

/**
 * 根据模板生成AI提示词
 */
export function generateTemplatePrompt(template: TianjinTemplate): string {
  const category = template.category || '节日主题';
  const style = template.style || '传统国潮';
  const culturalElements = tianjinCulturalElements[category] || tianjinCulturalElements['节日主题'];
  
  // 随机选择文化元素（2-3个）
  const selectedElements = culturalElements
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(Math.random() * 2) + 2);
  
  // 构建提示词
  const parts: string[] = [];
  
  // 1. 主体描述
  parts.push(`创作一幅${template.name}主题的作品`);
  
  // 2. 风格描述
  parts.push(styleDescriptions[style] || styleDescriptions['传统国潮']);
  
  // 3. 构图描述
  parts.push(compositionDescriptions[category] || compositionDescriptions['节日主题']);
  
  // 4. 色彩描述
  parts.push(generateColorDescription(template.colorScheme));
  
  // 5. 文化元素
  parts.push(`融入${selectedElements.join('、')}等天津特色文化元素`);
  
  // 6. 质量要求
  parts.push('高清画质，细节丰富，色彩饱满，具有艺术感染力');
  
  return parts.join('，');
}

/**
 * 生成模板的详细描述（用于预览）
 */
export function generateTemplateDescription(template: TianjinTemplate): string {
  const parts: string[] = [];
  
  parts.push(template.description || '');
  
  if (template.applicableScenes && template.applicableScenes.length > 0) {
    parts.push(`\n\n适用场景：${template.applicableScenes.join('、')}`);
  }
  
  if (template.tags && template.tags.length > 0) {
    parts.push(`\n标签：${template.tags.join('、')}`);
  }
  
  if (template.estimatedTime) {
    parts.push(`\n预计创作时间：${template.estimatedTime}`);
  }
  
  return parts.join('');
}

/**
 * 根据模板生成创作建议
 */
export function generateCreativeSuggestions(template: TianjinTemplate): string[] {
  const suggestions: string[] = [];
  const category = template.category || '节日主题';
  
  switch (category) {
    case '节日主题':
      suggestions.push('可以添加节日祝福语或活动信息');
      suggestions.push('适合用于节日海报、社交媒体分享');
      suggestions.push('建议配合传统音乐或节日氛围音效');
      break;
    case '历史风情':
      suggestions.push('适合文化旅游宣传、历史教育内容');
      suggestions.push('可以添加历史背景介绍文字');
      suggestions.push('建议配合古典音乐或民乐');
      break;
    case '城市风光':
      suggestions.push('适合城市形象宣传、旅游推广');
      suggestions.push('可以展示不同时间段的城市美景');
      suggestions.push('建议配合现代音乐或环境音效');
      break;
    case '美食宣传':
      suggestions.push('适合餐饮推广、美食节宣传');
      suggestions.push('可以添加店铺信息或优惠活动');
      suggestions.push('建议配合轻快的背景音乐');
      break;
    case '品牌联名':
      suggestions.push('适合品牌合作推广、产品发布');
      suggestions.push('可以添加品牌故事或合作理念');
      suggestions.push('建议配合品牌主题曲或现代音乐');
      break;
    default:
      suggestions.push('根据您的需求自由发挥创意');
      suggestions.push('可以添加个性化文字或Logo');
      suggestions.push('建议配合适合主题的背景音乐');
  }
  
  return suggestions;
}

/**
 * 生成模板的快捷提示词选项
 */
export function generateQuickPrompts(template: TianjinTemplate): string[] {
  const category = template.category || '节日主题';
  const basePrompt = generateTemplatePrompt(template);
  
  const quickPrompts: string[] = [];
  
  // 基础版本
  quickPrompts.push(basePrompt);
  
  // 增强版本（更详细）
  quickPrompts.push(`${basePrompt}，超高清画质，专业摄影级别，细节极致丰富`);
  
  // 简约版本
  quickPrompts.push(`${template.name}，${template.style || '传统'}风格，简洁大方`);
  
  // 创意版本
  quickPrompts.push(`${template.name}，创意构图，独特视角，艺术感强`);
  
  return quickPrompts;
}

export default {
  generateTemplatePrompt,
  generateTemplateDescription,
  generateCreativeSuggestions,
  generateQuickPrompts
};
