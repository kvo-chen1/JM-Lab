import { GeneratedResult, TraditionalPattern, AIFilter, ToolType } from './types';

export const aiGeneratedResults: GeneratedResult[] = [
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

export const traditionalPatterns: TraditionalPattern[] = [
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

export const aiFilters: AIFilter[] = [
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

export const stylePresets = [
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

export const toolOptions: Array<{ id: ToolType; name: string; icon: string }> = [
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
