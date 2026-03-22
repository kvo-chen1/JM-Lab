/**
 * IP 海报排版库组件
 * 展示和管理 IP 海报排版模板
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Search, Star, Heart, X, Grid3X3, LayoutTemplate, Film, BookOpen, Sparkles, Landmark, Gamepad2 } from 'lucide-react';
import { ipPosterService } from '@/services/ipPosterService';
import type { IPPosterLayout } from '@/types/ipPosterLayout';
import { IP_POSTER_CATEGORIES } from '@/data/ipPosterLayouts';

interface IPPosterLibraryProps {
  onLayoutSelect: (layout: IPPosterLayout) => void;
  onClose: () => void;
  currentLayoutId?: string;
}

// 分类图标映射
const categoryIcons: Record<string, React.ReactNode> = {
  all: <Grid3X3 className="w-3.5 h-3.5" />,
  guochao: <Landmark className="w-3.5 h-3.5" />,
  game: <Gamepad2 className="w-3.5 h-3.5" />,
  museum: <BookOpen className="w-3.5 h-3.5" />,
  classic: <Star className="w-3.5 h-3.5" />,
  modern: <Sparkles className="w-3.5 h-3.5" />,
};

export default function IPPosterLibrary({ onLayoutSelect, onClose, currentLayoutId }: IPPosterLibraryProps) {
  const { isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // 从本地存储加载收藏
  useEffect(() => {
    const saved = localStorage.getItem('ipPosterFavorites');
    if (saved) {
      setFavorites(new Set(JSON.parse(saved)));
    }
  }, []);

  // 保存收藏到本地存储
  useEffect(() => {
    localStorage.setItem('ipPosterFavorites', JSON.stringify([...favorites]));
  }, [favorites]);

  // 过滤排版布局
  const filteredLayouts = useMemo(() => {
    let layouts = ipPosterService.getAllLayouts();

    // 按分类过滤
    if (selectedCategory !== 'all') {
      layouts = layouts.filter(layout => layout.category.includes(selectedCategory));
    }

    // 按搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      layouts = layouts.filter(layout =>
        layout.name.toLowerCase().includes(query) ||
        layout.description.toLowerCase().includes(query) ||
        layout.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 只显示收藏
    if (showFavoritesOnly) {
      layouts = layouts.filter(layout => favorites.has(layout.id));
    }

    return layouts;
  }, [selectedCategory, searchQuery, showFavoritesOnly, favorites]);

  // 切换收藏
  const toggleFavorite = (layoutId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(layoutId)) {
        newFavorites.delete(layoutId);
      } else {
        newFavorites.add(layoutId);
      }
      return newFavorites;
    });
  };

  // 处理排版选择
  const handleLayoutClick = (layout: IPPosterLayout) => {
    onLayoutSelect(layout);
  };

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      {/* 头部 */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-[#C02C38]" />
            <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              IP 海报排版库
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
              {ipPosterService.getAllLayouts().length} 种排版
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
            placeholder="搜索排版..."
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
        <div className="flex items-center justify-between gap-1">
          {IP_POSTER_CATEGORIES.map(category => {
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 justify-center ${
                  selectedCategory === category.id
                    ? 'bg-[#C02C38] text-white'
                    : isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {categoryIcons[category.id] || categoryIcons.all}
                <span className="truncate">{category.name}</span>
              </button>
            );
          })}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 justify-center ${
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

      {/* 排版网格 */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {filteredLayouts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <LayoutTemplate className={`w-12 h-12 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {showFavoritesOnly ? '还没有收藏的排版' : '没有找到相关排版'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-3"
            >
              {filteredLayouts.map((layout, index) => (
                <motion.div
                  key={layout.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all ${
                    currentLayoutId === layout.id
                      ? 'ring-2 ring-[#C02C38] border-[#C02C38]'
                      : isDark
                      ? 'bg-gray-700/50 border-gray-600 hover:border-[#C02C38]'
                      : 'bg-white border-gray-200 hover:border-[#C02C38]'
                  }`}
                  onClick={() => handleLayoutClick(layout)}
                >
                  {/* 缩略图 */}
                  <div className="aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={layout.thumbnail}
                      alt={layout.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300"%3E%3Crect fill="%23ddd" width="200" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E图片加载失败%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    {/* 选中标记 */}
                    {currentLayoutId === layout.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#C02C38] flex items-center justify-center">
                        <Star className="w-4 h-4 text-white fill-current" />
                      </div>
                    )}
                    {/* 收藏按钮 */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleFavorite(layout.id);
                      }}
                      className={`absolute top-2 left-2 p-1.5 rounded-full transition-colors ${
                        favorites.has(layout.id)
                          ? 'bg-red-500 text-white'
                          : 'bg-black/50 text-white hover:bg-black/70'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${favorites.has(layout.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  {/* 信息 */}
                  <div className="p-3">
                    <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {layout.name}
                    </h4>
                    <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {layout.description}
                    </p>
                    {/* 标签 */}
                    {layout.tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {layout.tags.slice(0, 2).map((tag, i) => (
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部提示 */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          点击排版卡片即可应用到当前设计
        </p>
      </div>
    </div>
  );
}
