import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Search, Star, Sparkles, Shuffle, Heart } from 'lucide-react';
import { inspirationData, getAllCategories, categoryNames, getRandomHints } from '../data/inspirationData';
import type { InspirationHint } from '../types/agent';

interface InspirationHintsProps {
  onHintSelect: (hint: InspirationHint, autoSend?: boolean) => void;
  onClose: () => void;
}

export default function InspirationHints({ onHintSelect, onClose }: InspirationHintsProps) {
  const { isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [randomHints, setRandomHints] = useState<InspirationHint[]>(() => getRandomHints(5));

  const categories = useMemo(() => getAllCategories(), []);

  // 过滤提示
  const filteredHints = useMemo(() => {
    let hints = inspirationData;

    // 按分类过滤
    if (selectedCategory !== 'all') {
      hints = hints.filter(hint => hint.category === selectedCategory);
    }

    // 按搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      hints = hints.filter(hint =>
        hint.title.toLowerCase().includes(query) ||
        hint.description.toLowerCase().includes(query) ||
        hint.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 只显示收藏
    if (showFavoritesOnly) {
      hints = hints.filter(hint => favorites.has(hint.id));
    }

    return hints;
  }, [selectedCategory, searchQuery, showFavoritesOnly, favorites]);

  // 切换收藏
  const toggleFavorite = (hintId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(hintId)) {
        newFavorites.delete(hintId);
      } else {
        newFavorites.add(hintId);
      }
      return newFavorites;
    });
  };

  // 刷新随机推荐
  const refreshRandom = () => {
    setRandomHints(getRandomHints(5));
  };

  // 处理提示选择（普通灵感提示）
  const handleHintClick = (hint: InspirationHint) => {
    onHintSelect(hint, false); // 普通提示不自动发送
    toggleFavorite(hint.id);
  };

  // 处理"为你推荐"点击（自动发送）
  const handleRecommendedHintClick = (hint: InspirationHint) => {
    onHintSelect(hint, true); // 推荐项自动发送
    toggleFavorite(hint.id);
  };

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      {/* 头部 */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            灵感提示
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            关闭
          </button>
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`} />
          <input
            type="text"
            placeholder="搜索灵感提示..."
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
      <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-[#C02C38] text-white'
                : isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-[#C02C38] text-white'
                  : isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {categoryNames[category]}
            </button>
          ))}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              showFavoritesOnly
                ? 'bg-[#C02C38] text-white'
                : isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* 随机推荐 */}
      <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              为你推荐
            </span>
          </div>
          <button
            onClick={refreshRandom}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {randomHints.map(hint => (
            <button
              key={hint.id}
              onClick={() => handleRecommendedHintClick(hint)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              } transition-colors`}
            >
              {hint.title}
            </button>
          ))}
        </div>
      </div>

      {/* 提示列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredHints.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className={`w-12 h-12 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {showFavoritesOnly ? '还没有收藏的提示' : '没有找到相关提示'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredHints.map(hint => (
              <motion.div
                key={hint.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isDark
                    ? 'bg-gray-700/50 border-gray-600 hover:border-[#C02C38]'
                    : 'bg-white border-gray-200 hover:border-[#C02C38]'
                }`}
                onClick={() => handleHintClick(hint)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {hint.title}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {categoryNames[hint.category]}
                    </span>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleFavorite(hint.id);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      favorites.has(hint.id)
                        ? 'text-red-500 bg-red-500/10'
                        : isDark
                        ? 'text-gray-500 hover:bg-gray-600'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${favorites.has(hint.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {hint.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {hint.tags.map((tag, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2 py-0.5 rounded ${
                        isDark ? 'bg-gray-600 text-gray-400' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className={`mt-3 p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    示例提示词：
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {hint.examplePrompt}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
