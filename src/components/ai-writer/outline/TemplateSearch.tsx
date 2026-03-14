import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import {
  Search,
  X,
  SlidersHorizontal,
  Clock,
  TrendingUp,
  FileText,
  Tag,
  History,
  Sparkles,
} from 'lucide-react';
import type { OutlineTemplate } from './types';

interface SearchFilters {
  query: string;
  categories: string[];
  tags: string[];
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  sortBy: 'relevance' | 'popular' | 'newest' | 'name';
  hasChildren: 'all' | 'with' | 'without';
  minSections: number;
  maxSections: number;
}

interface TemplateSearchProps {
  templates: OutlineTemplate[];
  onSearch: (filters: SearchFilters) => void;
  onClose: () => void;
  recentSearches: string[];
  onClearRecent: () => void;
}

export const TemplateSearch: React.FC<TemplateSearchProps> = ({
  templates,
  onSearch,
  onClose,
  recentSearches,
  onClearRecent,
}) => {
  const { isDark } = useTheme();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    categories: [],
    tags: [],
    dateRange: 'all',
    sortBy: 'relevance',
    hasChildren: 'all',
    minSections: 0,
    maxSections: 100,
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 提取所有分类和标签
  const allCategories = useCallback(() => {
    const cats = new Set<string>();
    templates.forEach((t) => cats.add(t.category));
    return Array.from(cats);
  }, [templates]);

  const allTags = useCallback(() => {
    const tags = new Set<string>();
    templates.forEach((t) => t.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags).slice(0, 20); // 限制显示数量
  }, [templates]);

  // 搜索建议
  useEffect(() => {
    if (filters.query.length > 1) {
      const query = filters.query.toLowerCase();
      const matched = templates
        .flatMap((t) => [t.name, t.description, ...(t.tags || [])])
        .filter((text) => text.toLowerCase().includes(query))
        .slice(0, 5);
      setSuggestions(matched);
      setShowSuggestions(matched.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [filters.query, templates]);

  // 执行搜索
  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearch(filters);
    }, 300);
    return () => clearTimeout(timeout);
  }, [filters, onSearch]);

  const handleQueryChange = (value: string) => {
    setFilters((prev) => ({ ...prev, query: value }));
  };

  const toggleCategory = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const toggleTag = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      categories: [],
      tags: [],
      dateRange: 'all',
      sortBy: 'relevance',
      hasChildren: 'all',
      minSections: 0,
      maxSections: 100,
    });
  };

  const activeFiltersCount =
    filters.categories.length +
    filters.tags.length +
    (filters.dateRange !== 'all' ? 1 : 0) +
    (filters.hasChildren !== 'all' ? 1 : 0) +
    (filters.minSections > 0 || filters.maxSections < 100 ? 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`rounded-2xl border shadow-xl overflow-hidden ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      {/* 搜索头部 */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            />
            <input
              ref={inputRef}
              type="text"
              value={filters.query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              placeholder="搜索模板、标签、描述..."
              className={`w-full pl-12 pr-10 py-3 rounded-xl text-base border transition-all ${
                isDark
                  ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              }`}
            />
            {filters.query && (
              <button
                onClick={() => handleQueryChange('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                  isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* 搜索建议 */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-lg overflow-hidden z-50 ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        handleQueryChange(suggestion);
                        setShowSuggestions(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2 ${
                        isDark
                          ? 'hover:bg-gray-700 text-gray-300'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Search className="w-4 h-4 text-gray-400" />
                      {suggestion}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              showAdvanced || activeFiltersCount > 0
                ? isDark
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                : isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            筛选
            {activeFiltersCount > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  isDark ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'
                }`}
              >
                {activeFiltersCount}
              </span>
            )}
          </button>

          <button
            onClick={onClose}
            className={`p-3 rounded-xl transition-colors ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 最近搜索 */}
        {!showAdvanced && filters.query === '' && recentSearches.length > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <History className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>最近搜索:</span>
            {recentSearches.slice(0, 5).map((search, index) => (
              <button
                key={index}
                onClick={() => handleQueryChange(search)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                  isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {search}
              </button>
            ))}
            <button
              onClick={onClearRecent}
              className={`text-xs underline ${isDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}
            >
              清除
            </button>
          </div>
        )}
      </div>

      {/* 高级筛选 */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}
          >
            <div className="p-4 space-y-4">
              {/* 分类筛选 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    分类
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allCategories().map((category) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        filters.categories.includes(category)
                          ? isDark
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                          : isDark
                          ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* 标签筛选 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    标签
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allTags().map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        filters.tags.includes(tag)
                          ? isDark
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-purple-100 text-purple-700 border border-purple-200'
                          : isDark
                          ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* 排序和时间范围 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      排序方式
                    </span>
                  </div>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))
                    }
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="relevance">相关度</option>
                    <option value="popular">最受欢迎</option>
                    <option value="newest">最新发布</option>
                    <option value="name">名称排序</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      时间范围
                    </span>
                  </div>
                  <select
                    value={filters.dateRange}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, dateRange: e.target.value as any }))
                    }
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="all">全部时间</option>
                    <option value="today">今天</option>
                    <option value="week">本周</option>
                    <option value="month">本月</option>
                    <option value="year">今年</option>
                  </select>
                </div>
              </div>

              {/* 章节数量范围 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    章节数量
                  </span>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {filters.minSections} - {filters.maxSections} 章
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={filters.minSections}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minSections: Math.min(parseInt(e.target.value), prev.maxSections),
                      }))
                    }
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.maxSections}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxSections: Math.max(parseInt(e.target.value), prev.minSections),
                      }))
                    }
                    className="flex-1"
                  />
                </div>
              </div>

              {/* 清除筛选 */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className={`w-full py-2 rounded-lg text-sm transition-colors ${
                    isDark
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  清除所有筛选
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 快捷筛选标签 */}
      {!showAdvanced && (
        <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Sparkles className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
            <button
              onClick={() => setFilters((prev) => ({ ...prev, sortBy: 'popular' }))}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filters.sortBy === 'popular'
                  ? isDark
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                  : isDark
                  ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-3 h-3 inline mr-1" />
              热门
            </button>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, sortBy: 'newest' }))}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filters.sortBy === 'newest'
                  ? isDark
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                  : isDark
                  ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Clock className="w-3 h-3 inline mr-1" />
              最新
            </button>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, sortBy: 'name' }))}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filters.sortBy === 'name'
                  ? isDark
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-purple-100 text-purple-700 border border-purple-200'
                  : isDark
                  ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              名称
            </button>
            {allCategories().slice(0, 4).map((category) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filters.categories.includes(category)
                    ? isDark
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-green-100 text-green-700 border border-green-200'
                    : isDark
                    ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TemplateSearch;
