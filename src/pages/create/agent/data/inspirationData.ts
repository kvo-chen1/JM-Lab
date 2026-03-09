/**
 * 灵感提示数据库
 */

import { InspirationHint } from '../types/agent';

export const inspirationData: InspirationHint[] = [
  // 风格提示
  {
    id: 'style-1',
    category: 'style',
    title: '现代极简',
    description: '简洁、干净的视觉效果，强调功能性和空间感',
    examplePrompt: '现代极简风格，简洁的线条，纯净的色彩，留白空间',
    tags: ['现代', '极简', '简洁']
  },
  {
    id: 'style-2',
    category: 'style',
    title: '赛博朋克',
    description: '未来科技感，霓虹灯光，高科技低生活的反差',
    examplePrompt: '赛博朋克风格，霓虹灯，未来城市，科技感，蓝紫色调',
    tags: ['未来', '科技', '霓虹']
  },
  {
    id: 'style-3',
    category: 'style',
    title: '国潮风',
    description: '融合中国传统文化元素与现代设计语言',
    examplePrompt: '国潮风格，中国传统纹样，红色和金色，现代设计感',
    tags: ['中国风', '传统', '潮流']
  },
  {
    id: 'style-4',
    category: 'style',
    title: '可爱卡通',
    description: 'Q 版造型，圆润线条，明快色彩',
    examplePrompt: '可爱卡通风格，Q 版造型，大眼睛，柔和色彩，萌系',
    tags: ['可爱', '卡通', 'Q 版']
  },
  {
    id: 'style-5',
    category: 'style',
    title: '复古怀旧',
    description: '怀旧色调，老照片质感，经典元素重现',
    examplePrompt: '复古风格，怀旧色调，老照片质感，80 年代元素',
    tags: ['复古', '怀旧', '经典']
  },

  // 主题提示
  {
    id: 'theme-1',
    category: 'theme',
    title: '自然生态',
    description: '以自然元素为主题，绿色环保，生机勃勃',
    examplePrompt: '自然主题，植物元素，绿色调，生态友好，生命力',
    tags: ['自然', '环保', '植物']
  },
  {
    id: 'theme-2',
    category: 'theme',
    title: '科技创新',
    description: '展现科技力量，智能化，数字化',
    examplePrompt: '科技主题，电路板元素，蓝色调，数字化，智能化',
    tags: ['科技', '智能', '数字化']
  },
  {
    id: 'theme-3',
    category: 'theme',
    title: '文化传承',
    description: '弘扬传统文化，历史底蕴，文化符号',
    examplePrompt: '文化主题，传统符号，历史元素，文化底蕴',
    tags: ['文化', '传统', '历史']
  },
  {
    id: 'theme-4',
    category: 'theme',
    title: '节日庆典',
    description: '喜庆热闹，节日氛围，传统节庆元素',
    examplePrompt: '节日主题，喜庆红色，灯笼烟花，团圆氛围',
    tags: ['节日', '庆典', '喜庆']
  },

  // 色彩提示
  {
    id: 'color-1',
    category: 'color',
    title: '温暖配色',
    description: '橙色、黄色等暖色调，给人温暖舒适的感觉',
    examplePrompt: '温暖色调，橙色黄色系，阳光感，温馨舒适',
    tags: ['暖色', '温馨', '阳光']
  },
  {
    id: 'color-2',
    category: 'color',
    title: '冷静配色',
    description: '蓝色、绿色等冷色调，给人冷静专业的感觉',
    examplePrompt: '冷静色调，蓝色绿色系，专业感，沉稳大气',
    tags: ['冷色', '专业', '沉稳']
  },
  {
    id: 'color-3',
    category: 'color',
    title: '对比配色',
    description: '强烈色彩对比，视觉冲击力强',
    examplePrompt: '对比色，互补色搭配，强烈视觉冲击，鲜明对比',
    tags: ['对比', '鲜明', '冲击']
  },
  {
    id: 'color-4',
    category: 'color',
    title: '莫兰迪色系',
    description: '低饱和度色彩，高级灰调，温柔雅致',
    examplePrompt: '莫兰迪色系，低饱和度，高级灰，温柔雅致',
    tags: ['莫兰迪', '高级灰', '雅致']
  },

  // 构图提示
  {
    id: 'composition-1',
    category: 'composition',
    title: '对称构图',
    description: '平衡稳定，庄重典雅',
    examplePrompt: '对称构图，左右平衡，稳定庄重，正式感',
    tags: ['对称', '平衡', '庄重']
  },
  {
    id: 'composition-2',
    category: 'composition',
    title: '三分法构图',
    description: '将画面分为九宫格，主体放在交叉点',
    examplePrompt: '三分法构图，九宫格，黄金分割，视觉焦点',
    tags: ['三分法', '黄金分割', '经典']
  },
  {
    id: 'composition-3',
    category: 'composition',
    title: '中心构图',
    description: '主体居中，突出强调',
    examplePrompt: '中心构图，主体突出，视觉集中，强调重点',
    tags: ['中心', '突出', '聚焦']
  },
  {
    id: 'composition-4',
    category: 'composition',
    title: '对角线构图',
    description: '沿对角线排布，动感活泼',
    examplePrompt: '对角线构图，动感活泼，视觉引导，不平衡美',
    tags: ['对角线', '动感', '活泼']
  },

  // 概念提示
  {
    id: 'concept-1',
    category: 'concept',
    title: '未来主义',
    description: '面向未来，创新前瞻，科技幻想',
    examplePrompt: '未来主义，前瞻性，创新科技，科幻元素',
    tags: ['未来', '创新', '科幻']
  },
  {
    id: 'concept-2',
    category: 'concept',
    title: '融合创新',
    description: '传统与现代融合，多元文化碰撞',
    examplePrompt: '融合创新，传统现代结合，多元文化，跨界碰撞',
    tags: ['融合', '创新', '多元']
  },
  {
    id: 'concept-3',
    category: 'concept',
    title: '可持续发展',
    description: '环保理念，绿色生态，社会责任',
    examplePrompt: '可持续发展，环保理念，绿色生态，社会责任',
    tags: ['环保', '可持续', '绿色']
  },
  {
    id: 'concept-4',
    category: 'concept',
    title: '情感连接',
    description: '强调情感共鸣，温暖人心',
    examplePrompt: '情感连接，温暖感人，情感共鸣，人文关怀',
    tags: ['情感', '温暖', '共鸣']
  }
];

/**
 * 按分类获取灵感提示
 */
export function getHintsByCategory(category: string): InspirationHint[] {
  return inspirationData.filter(hint => hint.category === category);
}

/**
 * 搜索灵感提示
 */
export function searchHints(keyword: string): InspirationHint[] {
  const lowerKeyword = keyword.toLowerCase();
  return inspirationData.filter(hint =>
    hint.title.toLowerCase().includes(lowerKeyword) ||
    hint.description.toLowerCase().includes(lowerKeyword) ||
    hint.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
  );
}

/**
 * 随机获取灵感提示
 */
export function getRandomHints(count: number = 5): InspirationHint[] {
  const shuffled = [...inspirationData].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * 获取所有分类
 */
export function getAllCategories(): string[] {
  return ['style', 'theme', 'color', 'composition', 'concept'];
}

/**
 * 分类中文映射
 */
export const categoryNames: Record<string, string> = {
  style: '风格',
  theme: '主题',
  color: '色彩',
  composition: '构图',
  concept: '概念'
};
