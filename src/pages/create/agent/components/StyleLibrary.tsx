import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Search, Star, Heart, X, ChevronRight, Sparkles, Grid3X3, Layers } from 'lucide-react';
import { PRESET_STYLES } from '../types/agent';
import type { StyleOption } from '../types/agent';

interface StyleLibraryProps {
  onStyleSelect: (style: StyleOption) => void;
  onClose: () => void;
  currentStyle?: string;
}

// 风格分类
const STYLE_CATEGORIES = [
  { id: 'all', name: '全部', icon: Grid3X3 },
  { id: 'art', name: '艺术插画', icon: Sparkles },
  { id: 'cute', name: '童趣可爱', icon: Heart },
  { id: 'culture', name: '国潮文化', icon: Layers },
  { id: 'modern', name: '现代风格', icon: Star },
];

// 扩展风格数据（添加分类）
const EXTENDED_STYLES: StyleOption[] = [
  ...PRESET_STYLES.map(s => ({ ...s, category: ['art'], tags: [s.name] })),
  // 国潮风格
  {
    id: 'guochao',
    name: '国潮风尚',
    thumbnail: 'https://images.unsplash.com/photo-1582739501019-5c4aa6e949d9?w=200&h=200&fit=crop',
    description: '传统与现代的完美融合',
    prompt: 'Chinese trendy style, traditional elements with modern design, bold colors, cultural fusion',
    category: ['culture'],
    tags: ['国潮', '传统', '现代']
  },
  {
    id: 'ink',
    name: '水墨意境',
    thumbnail: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&h=200&fit=crop',
    description: '东方美学，意境深远',
    prompt: 'Chinese ink wash painting style, elegant brushstrokes, oriental aesthetics, poetic atmosphere',
    category: ['culture'],
    tags: ['水墨', '东方', '意境']
  },
  {
    id: 'bluewhite',
    name: '青花瓷韵',
    thumbnail: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&h=200&fit=crop',
    description: '天青色等烟雨，经典传承',
    prompt: 'Blue and white porcelain style, classic Chinese pattern, elegant blue tones, traditional craft',
    category: ['culture'],
    tags: ['青花瓷', '经典', '优雅']
  },
  {
    id: 'dunhuang',
    name: '敦煌飞天',
    thumbnail: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=200&h=200&fit=crop',
    description: '丝路瑰宝，艺术殿堂',
    prompt: 'Dunhuang flying apsara style, silk road art, golden tones, ancient murals, graceful figures',
    category: ['culture'],
    tags: ['敦煌', '飞天', '壁画']
  },
  {
    id: 'paper',
    name: '剪纸艺术',
    thumbnail: 'https://images.unsplash.com/photo-1544531585-9847b68c8c86?w=200&h=200&fit=crop',
    description: '民间艺术，精巧细腻',
    prompt: 'Chinese paper cutting style, folk art, intricate patterns, red and gold colors, traditional craft',
    category: ['culture'],
    tags: ['剪纸', '民间', '红色']
  },
  {
    id: 'calligraphy',
    name: '书法韵味',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
    description: '笔墨纸砚，文化传承',
    prompt: 'Chinese calligraphy style, elegant brush strokes, ink and wash, artistic typography',
    category: ['culture'],
    tags: ['书法', '笔墨', '文化']
  },
  // 现代风格
  {
    id: 'minimal',
    name: '极简主义',
    thumbnail: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=200&h=200&fit=crop',
    description: '少即是多，纯净美学',
    prompt: 'Minimalist style, clean lines, simple shapes, neutral colors, modern design',
    category: ['modern'],
    tags: ['极简', '现代', '简约']
  },
  {
    id: 'retro',
    name: '复古怀旧',
    thumbnail: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=200&h=200&fit=crop',
    description: '老上海风情，怀旧记忆',
    prompt: 'Retro vintage style, nostalgic atmosphere, warm tones, old Shanghai charm, classic elegance',
    category: ['modern'],
    tags: ['复古', '怀旧', '经典']
  },
  {
    id: 'neon',
    name: '赛博朋克',
    thumbnail: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=200&h=200&fit=crop',
    description: '霓虹未来，科技感十足',
    prompt: 'Cyberpunk style, neon lights, futuristic city, high tech, vibrant purple and blue colors',
    category: ['modern'],
    tags: ['赛博朋克', '科技', '霓虹']
  },
  {
    id: 'nordic',
    name: '北欧风格',
    thumbnail: 'https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=200&h=200&fit=crop',
    description: '明亮色彩，简约实用',
    prompt: 'Nordic Scandinavian style, bright colors, cozy atmosphere, natural elements, hygge feeling',
    category: ['modern'],
    tags: ['北欧', '简约', '温馨']
  },
  // 童趣风格
  {
    id: 'cartoon',
    name: '卡通动漫',
    thumbnail: 'https://images.unsplash.com/photo-1560167016-022b78a0258e?w=200&h=200&fit=crop',
    description: '活泼可爱，色彩缤纷',
    prompt: 'Cartoon anime style, vibrant colors, cute characters, playful atmosphere, manga inspired',
    category: ['cute'],
    tags: ['卡通', '动漫', '可爱']
  },
  {
    id: 'kawaii',
    name: '日式萌系',
    thumbnail: 'https://images.unsplash.com/photo-1560961911-29346f3d148c?w=200&h=200&fit=crop',
    description: '软萌治愈，少女心满满',
    prompt: 'Kawaii Japanese style, super cute, pastel colors, soft and fluffy, adorable characters',
    category: ['cute'],
    tags: ['萌系', '治愈', '粉色']
  },
  {
    id: 'fairy',
    name: '童话梦幻',
    thumbnail: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&h=200&fit=crop',
    description: '梦幻仙境，童话世界',
    prompt: 'Fairy tale fantasy style, magical atmosphere, enchanted forest, whimsical creatures, dreamy colors',
    category: ['cute'],
    tags: ['童话', '梦幻', '魔法']
  },
];

export default function StyleLibrary({ onStyleSelect, onClose, currentStyle }: StyleLibraryProps) {
  const { isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // 从本地存储加载收藏
  useEffect(() => {
    const saved = localStorage.getItem('styleLibraryFavorites');
    if (saved) {
      setFavorites(new Set(JSON.parse(saved)));
    }
  }, []);

  // 保存收藏到本地存储
  useEffect(() => {
    localStorage.setItem('styleLibraryFavorites', JSON.stringify([...favorites]));
  }, [favorites]);

  // 过滤风格
  const filteredStyles = useMemo(() => {
    let styles = EXTENDED_STYLES;

    // 按分类过滤
    if (selectedCategory !== 'all') {
      styles = styles.filter(style => style.category?.includes(selectedCategory));
    }

    // 按搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      styles = styles.filter(style =>
        style.name.toLowerCase().includes(query) ||
        style.description.toLowerCase().includes(query) ||
        style.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 只显示收藏
    if (showFavoritesOnly) {
      styles = styles.filter(style => favorites.has(style.id));
    }

    return styles;
  }, [selectedCategory, searchQuery, showFavoritesOnly, favorites]);

  // 切换收藏
  const toggleFavorite = (styleId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(styleId)) {
        newFavorites.delete(styleId);
      } else {
        newFavorites.add(styleId);
      }
      return newFavorites;
    });
  };

  // 处理风格选择
  const handleStyleClick = (style: StyleOption) => {
    onStyleSelect(style);
  };

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      {/* 头部 */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#C02C38]" />
            <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              风格库
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
              {EXTENDED_STYLES.length} 种风格
            </span>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`} />
          <input
            type="text"
            placeholder="搜索风格..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            } focus:outline-none focus:ring-2 focus:ring-[#C02C38]`}
          />
        </div>
      </div>

      {/* 分类标签 */}
      <div className={`px-3 py-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          {STYLE_CATEGORIES.map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 justify-center mx-0.5 ${
                  selectedCategory === category.id
                    ? 'bg-[#C02C38] text-white'
                    : isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="truncate">{category.name}</span>
              </button>
            );
          })}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 justify-center mx-0.5 ${
              showFavoritesOnly
                ? 'bg-[#C02C38] text-white'
                : isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            <span className="truncate">收藏</span>
          </button>
        </div>
      </div>

      {/* 风格网格 */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredStyles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Layers className={`w-12 h-12 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {showFavoritesOnly ? '还没有收藏的风格' : '没有找到相关风格'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredStyles.map((style, index) => (
              <motion.div
                key={style.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all ${
                  currentStyle === style.id
                    ? 'ring-2 ring-[#C02C38] border-[#C02C38]'
                    : isDark
                    ? 'bg-gray-700/50 border-gray-600 hover:border-[#C02C38]'
                    : 'bg-white border-gray-200 hover:border-[#C02C38]'
                }`}
                onClick={() => handleStyleClick(style)}
              >
                {/* 缩略图 */}
                <div className="aspect-square overflow-hidden">
                  <img
                    src={style.thumbnail}
                    alt={style.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  {/* 选中标记 */}
                  {currentStyle === style.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#C02C38] flex items-center justify-center">
                      <Star className="w-4 h-4 text-white fill-current" />
                    </div>
                  )}
                  {/* 收藏按钮 */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleFavorite(style.id);
                    }}
                    className={`absolute top-2 left-2 p-1.5 rounded-full transition-colors ${
                      favorites.has(style.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-black/50 text-white hover:bg-black/70'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${favorites.has(style.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
                {/* 信息 */}
                <div className="p-3">
                  <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {style.name}
                  </h4>
                  <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {style.description}
                  </p>
                  {/* 标签 */}
                  {style.tags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {style.tags.slice(0, 2).map((tag, i) => (
                        <span
                          key={i}
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            isDark ? 'bg-gray-600 text-gray-400' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          点击风格卡片即可应用到当前设计
        </p>
      </div>
    </div>
  );
}
