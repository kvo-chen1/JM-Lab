/**
 * IP 海报排版布局数据配置
 * 基于津小脉 IP 目录的 8 张排版示例图片
 */

import type { IPPosterLayout } from '@/types/ipPosterLayout';

// 津小脉 IP 排版布局数据
export const IP_POSTER_LAYOUTS: IPPosterLayout[] = [
  {
    id: 'jxm-001',
    name: '国潮风尚·雪豹小吉',
    description: '传统文化元素与现代设计的完美融合，暖色调，艺术字标题',
    thumbnail: '/images/jinxiaomi-ip/289a0978e1635838b6e3a4e111a51d5e.png',
    imagePath: '/津小脉 IP/289a0978e1635838b6e3a4e111a51d5e.png',
    category: ['guochao', 'classic'],
    tags: ['国潮', '暖色调', '艺术字', '传统文化'],
    width: 1200,
    height: 2000,
    aspectRatio: '3:5',
    usage: '适合 IP 形象展示、品牌宣传、文创产品介绍'
  },
  {
    id: 'jxm-002',
    name: '游戏风·瓦当神韵',
    description: '暗色背景，霓虹发光效果，多角色展示，科技感十足',
    thumbnail: '/images/jinxiaomi-ip/359c9b83b6029a90fded5b65d98b2aa5.png',
    imagePath: '/津小脉 IP/359c9b83b6029a90fded5b65d98b2aa5.png',
    category: ['game', 'modern'],
    tags: ['游戏风', '暗色调', '霓虹', '科技感'],
    width: 1200,
    height: 2200,
    aspectRatio: '6:11',
    usage: '适合游戏 IP、科技产品、年轻化品牌'
  },
  {
    id: 'jxm-003',
    name: '博物馆风·釉趣横生',
    description: '深色优雅背景，展品式展示，信息标签系统',
    thumbnail: '/images/jinxiaomi-ip/46dc6794c38d5a2f437efdb99b20197a.png',
    imagePath: '/津小脉 IP/46dc6794c38d5a2f437efdb99b20197a.png',
    category: ['museum', 'elegant'],
    tags: ['博物馆', '优雅', '深色', '展品式'],
    width: 1200,
    height: 2400,
    aspectRatio: '1:2',
    usage: '适合博物馆文创、高端品牌、艺术展览'
  },
  {
    id: 'jxm-004',
    name: '经典展示·津小脉',
    description: '主视觉大图 + 三视图 + 表情包网格，经典布局',
    thumbnail: '/images/jinxiaomi-ip/63b44f3371b2a11cae4cb4d2366b3c16.png',
    imagePath: '/津小脉 IP/63b44f3371b2a11cae4cb4d2366b3c16.png',
    category: ['classic'],
    tags: ['经典', '三视图', '表情包', '全面展示'],
    width: 1200,
    height: 1600,
    aspectRatio: '3:4',
    usage: '适合 IP 形象完整展示、设计文档、品牌手册'
  },
  {
    id: 'jxm-005',
    name: '清新简约·海河之夜',
    description: '清新色调，简洁布局，突出主体',
    thumbnail: '/images/jinxiaomi-ip/6c0dc612fea269ea5d26968523f75830.png',
    imagePath: '/津小脉 IP/6c0dc612fea269ea5d26968523f75830.png',
    category: ['classic', 'modern'],
    tags: ['清新', '简约', '明亮', '年轻化'],
    width: 1200,
    height: 1800,
    aspectRatio: '2:3',
    usage: '适合社交媒体、宣传推广、年轻品牌'
  },
  {
    id: 'jxm-006',
    name: '创意拼贴·天津印象',
    description: '创意拼贴布局，多元素组合，视觉丰富',
    thumbnail: '/images/jinxiaomi-ip/78ee589621ea779e863a3b3146544c73.png',
    imagePath: '/津小脉 IP/78ee589621ea779e863a3b3146544c73.png',
    category: ['modern', 'creative'],
    tags: ['创意', '拼贴', '丰富', '多元化'],
    width: 1200,
    height: 1800,
    aspectRatio: '2:3',
    usage: '适合创意展示、故事叙述、多场景呈现'
  },
  {
    id: 'jxm-007',
    name: '时尚潮流·都市脉动',
    description: '时尚现代风格，大胆用色，视觉冲击力强',
    thumbnail: '/images/jinxiaomi-ip/8be1c41fd813a03c983988cdeb59476f.png',
    imagePath: '/津小脉 IP/8be1c41fd813a03c983988cdeb59476f.png',
    category: ['modern', 'trendy'],
    tags: ['时尚', '潮流', '大胆', '视觉冲击'],
    width: 1200,
    height: 1800,
    aspectRatio: '2:3',
    usage: '适合潮流品牌、时尚活动、年轻市场'
  },
  {
    id: 'jxm-008',
    name: '文化传承·津门韵味',
    description: '传统文化底蕴，精致细节，文化气息浓厚',
    thumbnail: '/images/jinxiaomi-ip/c5dd16a47811114c3a47298d9f099c29.png',
    imagePath: '/津小脉 IP/c5dd16a47811114c3a47298d9f099c29.png',
    category: ['guochao', 'cultural'],
    tags: ['文化', '传统', '精致', '底蕴'],
    width: 1200,
    height: 2000,
    aspectRatio: '3:5',
    usage: '适合文化项目、非遗传承、城市形象'
  },
];

// 分类选项
export const IP_POSTER_CATEGORIES = [
  { id: 'all', name: '全部', icon: 'grid' },
  { id: 'guochao', name: '国潮风', icon: 'landmark' },
  { id: 'game', name: '游戏风', icon: 'gamepad' },
  { id: 'museum', name: '博物馆风', icon: 'university' },
  { id: 'classic', name: '经典款', icon: 'star' },
  { id: 'modern', name: '现代风', icon: 'sparkles' },
];

// 获取所有分类 ID
export const getAllCategories = (): string[] => {
  return IP_POSTER_CATEGORIES.map(cat => cat.id);
};

// 获取所有标签
export const getAllTags = (): string[] => {
  const tags = new Set<string>();
  IP_POSTER_LAYOUTS.forEach(layout => {
    layout.tags.forEach(tag => tags.add(tag));
  });
  return Array.from(tags);
};

// 根据 ID 获取排版
export const getLayoutById = (id: string): IPPosterLayout | undefined => {
  return IP_POSTER_LAYOUTS.find(layout => layout.id === id);
};

// 根据分类过滤排版
export const getLayoutsByCategory = (category: string): IPPosterLayout[] => {
  if (category === 'all') return IP_POSTER_LAYOUTS;
  return IP_POSTER_LAYOUTS.filter(layout => layout.category.includes(category));
};

// 搜索排版
export const searchLayouts = (query: string): IPPosterLayout[] => {
  const lowerQuery = query.toLowerCase();
  return IP_POSTER_LAYOUTS.filter(layout => 
    layout.name.toLowerCase().includes(lowerQuery) ||
    layout.description.toLowerCase().includes(lowerQuery) ||
    layout.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

// 默认排序
export const DEFAULT_LAYOUT_ORDER = IP_POSTER_LAYOUTS.map(layout => layout.id);
