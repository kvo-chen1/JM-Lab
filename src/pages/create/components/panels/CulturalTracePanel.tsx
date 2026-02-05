import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../../hooks/useCreateStore';
import tianjinCultureService from '@/services/tianjinCultureService';
import { KnowledgeItem, KNOWLEDGE_CATEGORIES, CATEGORY_CONFIG } from '@/services/tianjinCultureService';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

const CulturalTracePanel: React.FC = () => {
  const { isDark } = useTheme();
  const { culturalInfoText, updateState, traceSelectedCategoryId, traceSelectedKnowledgeId } = useCreateStore();
  
  // Use store state or default
  const selectedCategory = traceSelectedCategoryId || KNOWLEDGE_CATEGORIES[0];
  
  // Derive selectedKnowledge from ID
  const selectedKnowledge = React.useMemo(() => {
    if (!traceSelectedKnowledgeId) return null;
    return tianjinCultureService.getKnowledgeById(traceSelectedKnowledgeId);
  }, [traceSelectedKnowledgeId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'detail'>('list');
  
  // 分类横向滚动相关
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  // 收藏和浏览历史状态
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewHistory, setViewHistory] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  
  // 从localStorage加载收藏和历史
  useEffect(() => {
    const storedFavorites = localStorage.getItem('cultural_trace_favorites');
    const storedHistory = localStorage.getItem('cultural_trace_history');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
    if (storedHistory) {
      setViewHistory(JSON.parse(storedHistory));
    }
  }, []);
  
  // 检查是否可以滚动
  const checkScrollability = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };
  
  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, []);
  
  // 滚动分类标签
  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScrollability, 300);
    }
  };

  // 保存最近搜索
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    
    const updatedSearches = [
      query,
      ...recentSearches.filter(item => item !== query)
    ].slice(0, 5);
    
    setRecentSearches(updatedSearches);
  };

  // 搜索功能
  useEffect(() => {
    if (searchQuery) {
      setIsLoading(true);
      
      // 模拟搜索延迟
      const timer = setTimeout(() => {
        const results = tianjinCultureService.searchKnowledge(searchQuery);
        setSearchResults(results);
        setShowSearchResults(true);
        setIsLoading(false);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  // 添加数据加载状态管理
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  
  // 保存收藏到localStorage
  const saveFavorites = (newFavorites: string[]) => {
    setFavorites(newFavorites);
    localStorage.setItem('cultural_trace_favorites', JSON.stringify(newFavorites));
  };
  
  // 保存浏览历史到localStorage
  const saveViewHistory = (newHistory: string[]) => {
    setViewHistory(newHistory);
    localStorage.setItem('cultural_trace_history', JSON.stringify(newHistory));
  };
  
  // 切换收藏状态
  const toggleFavorite = (knowledgeId: string) => {
    const newFavorites = favorites.includes(knowledgeId)
      ? favorites.filter(id => id !== knowledgeId)
      : [...favorites, knowledgeId];
    saveFavorites(newFavorites);
  };
  
  // 添加到浏览历史
  const addToHistory = (knowledgeId: string) => {
    const newHistory = [knowledgeId, ...viewHistory.filter(id => id !== knowledgeId)].slice(0, 20);
    saveViewHistory(newHistory);
  };
  
  // 获取文化知识列表
  useEffect(() => {
    setIsDataLoading(true);
    
    // 模拟API请求延迟
    const timer = setTimeout(() => {
      const items = tianjinCultureService.getKnowledgeByCategory(selectedCategory);
      setKnowledgeItems(items);
      setIsDataLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [selectedCategory]);
  
  // 最终显示的知识列表
  const displayedItems = React.useMemo(() => {
    if (searchQuery) return searchResults;
    if (showFavorites) {
      return favorites
        .map(id => tianjinCultureService.getKnowledgeById(id))
        .filter((item): item is KnowledgeItem => item !== undefined);
    }
    return knowledgeItems;
  }, [searchQuery, searchResults, showFavorites, favorites, knowledgeItems]);

  // 处理知识项选择
  const handleKnowledgeSelect = (knowledge: KnowledgeItem) => {
    updateState({ traceSelectedKnowledgeId: knowledge.id, culturalInfoText: knowledge.content });
    addToHistory(knowledge.id);
    setShowSearchResults(false);
    // 移动端自动切换到详情标签
    if (window.innerWidth < 1024) {
      setActiveTab('detail');
    }
  };

  // 处理搜索提交
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      saveRecentSearch(searchQuery);
    }
  };

  // 处理分类切换
  const handleCategoryChange = (category: string) => {
    updateState({ traceSelectedCategoryId: category, traceSelectedKnowledgeId: null });
    setSearchQuery('');
    setShowSearchResults(false);
    setShowFavorites(false);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="mb-6">
        <div className={`rounded-xl p-5 mb-5 ${isDark ? 'bg-gradient-to-r from-[#C02C38]/10 to-transparent' : 'bg-gradient-to-r from-[#C02C38]/5 to-transparent'}`}>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <i className="fas fa-landmark text-[#C02C38]"></i>
            <span>文化溯源</span>
          </h3>
          <p className="text-xs opacity-70 leading-relaxed">了解文化元素的历史背景和文化内涵，探索文化知识</p>
        </div>
        
        {/* 搜索框 */}
        <form onSubmit={handleSearchSubmit} className={`relative mb-5`}>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="fas fa-search text-sm opacity-50"></i>
          </div>
          <input
            type="text"
            placeholder="搜索文化知识..."
            className={`w-full pl-10 pr-28 py-3 rounded-xl text-sm font-medium border shadow-sm ${isDark 
              ? 'bg-gray-800/90 border-gray-700 text-white focus:border-[#C02C38] focus:ring-[#C02C38]/30' 
              : 'bg-white/90 border-gray-200 text-gray-900 focus:border-[#C02C38] focus:ring-[#C02C38]/30'} focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-sm`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            aria-label="搜索文化知识"
          />
          
          {/* 搜索操作按钮组 */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {searchQuery && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}
              >
                <i className="fas fa-times text-xs"></i>
              </motion.button>
            )}
            
            {isLoading ? (
              <div className="p-2">
                <i className="fas fa-spinner fa-spin text-sm opacity-70"></i>
              </div>
            ) : (
              <button 
                type="submit"
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${searchQuery 
                  ? 'bg-[#C02C38] text-white hover:bg-[#A0232F] shadow-md' 
                  : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}
                disabled={!searchQuery}
              >
                搜索
              </button>
            )}
          </div>
          
          {/* 搜索结果下拉 */}
          <AnimatePresence>
            {showSearchResults && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className={`absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto`}
              >
                {/* 搜索结果头部 */}
                <div className={`sticky top-0 px-4 py-2 border-b ${isDark ? 'border-gray-700 bg-gray-800/95' : 'border-gray-100 bg-white/95'} backdrop-blur-sm flex items-center justify-between`}>
                  <span className="text-xs opacity-60">找到 {searchResults.length} 个结果</span>
                  <button 
                    onClick={() => setShowSearchResults(false)}
                    className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                
                {searchResults.slice(0, 6).map((result, idx) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => handleKnowledgeSelect(result)}
                    className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-all border-b last:border-b-0 ${isDark ? 'border-gray-700/50' : 'border-gray-100'} ${idx === 0 ? 'bg-[#C02C38]/5 dark:bg-[#C02C38]/10' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: CATEGORY_CONFIG[result.category]?.bgColor || 'rgba(192, 44, 56, 0.1)' }}
                      >
                        <i 
                          className={`fas fa-${CATEGORY_CONFIG[result.category]?.icon || 'tag'} text-xs`}
                          style={{ color: CATEGORY_CONFIG[result.category]?.color || '#C02C38' }}
                        ></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium truncate">{result.title}</h5>
                        <p className="text-xs opacity-60 mt-0.5 line-clamp-1">{result.content}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span 
                            className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{ 
                              backgroundColor: CATEGORY_CONFIG[result.category]?.bgColor,
                              color: CATEGORY_CONFIG[result.category]?.color
                            }}
                          >
                            {result.category}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                            {result.subcategory}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {searchResults.length > 6 && (
                  <div className={`px-4 py-2 text-center text-xs ${isDark ? 'text-gray-400 border-t border-gray-700' : 'text-gray-500 border-t border-gray-100'}`}>
                    还有 {searchResults.length - 6} 个结果，请使用更精确的关键词
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 空搜索结果 */}
          <AnimatePresence>
            {showSearchResults && searchResults.length === 0 && searchQuery && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                className={`absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 p-6 text-center`}
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-search text-xl opacity-40"></i>
                </div>
                <p className="text-sm font-medium mb-1">未找到相关知识</p>
                <p className="text-xs opacity-60">尝试使用其他关键词或浏览分类</p>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
        
        {/* 最近搜索 */}
        {!searchQuery && recentSearches.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-medium flex items-center gap-1.5">
                <i className="fas fa-history text-[#C02C38]"></i>
                最近搜索
              </h5>
              <button
                onClick={() => setRecentSearches([])}
                className="text-[10px] opacity-50 hover:opacity-100 transition-opacity"
              >
                清空
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {recentSearches.map((search, index) => (
                  <motion.button
                    key={search}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => {
                      setSearchQuery(search);
                      saveRecentSearch(search);
                    }}
                    className={`group px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-all ${isDark 
                      ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700' 
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'} hover:shadow-sm`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <i className="fas fa-search text-[10px] opacity-50"></i>
                    <span>{search}</span>
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        setRecentSearches(recentSearches.filter((_, i) => i !== index));
                      }}
                      className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <i className="fas fa-times text-[8px]"></i>
                    </span>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
        
        {/* 分类选择 */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <i className="fas fa-tags text-[#C02C38] text-xs"></i>
              <h5 className="text-xs font-medium">
                {showFavorites ? '我的收藏' : '知识分类'}
              </h5>
            </div>
            <div className="flex items-center gap-2">
              {/* 收藏夹切换按钮 */}
              <motion.button
                onClick={() => setShowFavorites(!showFavorites)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${showFavorites
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-sm'
                  : isDark
                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
              >
                <i className={`fas ${showFavorites ? 'fa-star' : 'fa-star-o'}`}></i>
                <span>收藏</span>
                {favorites.length > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${showFavorites ? 'bg-white/20' : 'bg-[#C02C38] text-white'}`}>
                    {favorites.length}
                  </span>
                )}
              </motion.button>
              
              {(canScrollLeft || canScrollRight) && !showFavorites && (
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => scrollCategories('left')}
                    disabled={!canScrollLeft}
                    className={`p-1 rounded transition-all ${canScrollLeft
                      ? 'text-gray-500 hover:text-[#C02C38] hover:bg-[#C02C38]/10'
                      : 'text-gray-300 cursor-not-allowed'}`}
                  >
                    <i className="fas fa-chevron-left text-xs"></i>
                  </button>
                  <button
                    onClick={() => scrollCategories('right')}
                    disabled={!canScrollRight}
                    className={`p-1 rounded transition-all ${canScrollRight
                      ? 'text-gray-500 hover:text-[#C02C38] hover:bg-[#C02C38]/10'
                      : 'text-gray-300 cursor-not-allowed'}`}
                  >
                    <i className="fas fa-chevron-right text-xs"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* 分类标签或收藏提示 */}
          {!showFavorites ? (
            <div
              ref={categoryScrollRef}
              onScroll={checkScrollability}
              className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {KNOWLEDGE_CATEGORIES.map((category, index) => {
                const config = CATEGORY_CONFIG[category];
                const isSelected = selectedCategory === category;
                return (
                  <motion.button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-4 py-3 rounded-xl text-xs whitespace-nowrap transition-all duration-300 ease-in-out flex items-center gap-2 font-medium flex-shrink-0 ${isDark
                      ? isSelected
                        ? 'shadow-lg'
                        : 'hover:bg-gray-800'
                      : isSelected
                        ? 'shadow-lg'
                        : 'hover:bg-gray-50 border border-gray-200'}`}
                    style={{
                      backgroundColor: isSelected ? config.color : isDark ? 'rgba(31, 41, 55, 0.8)' : 'white',
                      color: isSelected ? 'white' : isDark ? '#9CA3AF' : '#374151',
                      borderColor: isSelected ? config.color : undefined
                    }}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    tabIndex={0}
                    role="tab"
                    aria-selected={isSelected}
                    title={config.description}
                  >
                    <i className={`fas fa-${config.icon} text-xs`} style={{ color: isSelected ? 'white' : config.color }}></i>
                    <span>{category}</span>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-xl text-xs ${isDark ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-50 text-gray-500'}`}
            >
              <i className="fas fa-info-circle mr-1.5"></i>
              {favorites.length > 0
                ? `您已收藏 ${favorites.length} 条文化知识，在列表中查看`
                : '您还没有收藏任何知识，点击知识卡片上的收藏按钮添加'}
            </motion.div>
          )}
        </div>
      </div>

      {/* 响应式网格布局 */}
      <div className="flex-1">
        {/* 大屏幕和中等屏幕：两列布局 */}
        <div className="hidden md:grid md:grid-cols-12 md:gap-6">
          {/* 知识列表 - 占据5列 */}
          <div className={`md:col-span-5 md:h-full overflow-y-auto rounded-xl border ${isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-800' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} p-5 shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#C02C38]/20' : 'bg-[#C02C38]/10'}`}>
                  <i className="fas fa-list-ul text-sm text-[#C02C38]"></i>
                </div>
                <div>
                  <h4 className="text-sm font-semibold">
                    {searchQuery ? '搜索结果' : showFavorites ? '我的收藏' : '相关知识'}
                  </h4>
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    共 {displayedItems.length} 条
                  </span>
                </div>
              </div>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'} transition-all duration-300`}
                  aria-label="清除搜索"
                >
                  <i className="fas fa-times"></i>
                  <span>清除</span>
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {isDataLoading && !searchQuery ? (
                // 骨架屏加载状态
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className={`p-5 rounded-lg ${isDark ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-sm`}>
                    <div className="flex justify-between items-start">
                      <LoadingSkeleton variant="text" width="70%" height="16px" className="mb-2" />
                      <LoadingSkeleton variant="text" width="50px" height="16px" />
                    </div>
                    <LoadingSkeleton variant="text" width="100%" height="12px" className="mb-1" />
                    <LoadingSkeleton variant="text" width="80%" height="12px" className="mb-3" />
                    <div className="flex items-center gap-2">
                      <LoadingSkeleton variant="text" width="60px" height="12px" />
                      <LoadingSkeleton variant="text" width="80px" height="12px" />
                    </div>
                  </div>
                ))
              ) : (
                // 实际数据渲染
                displayedItems.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    onClick={() => handleKnowledgeSelect(item)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${isDark 
                      ? selectedKnowledge?.id === item.id 
                        ? 'bg-[#C02C38]/15 border-[#C02C38] shadow-md' 
                        : 'bg-gray-800/60 border-gray-700/50 hover:bg-gray-700/80 hover:border-gray-600' 
                      : selectedKnowledge?.id === item.id 
                        ? 'bg-[#C02C38]/8 border-[#C02C38]/30 shadow-md' 
                        : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'} backdrop-blur-sm`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    aria-selected={selectedKnowledge?.id === item.id}
                    role="listitem"
                  >
                    <div className="flex items-start gap-3">
                      {/* 左侧指示条 */}
                      <div className={`w-1 h-full min-h-[40px] rounded-full flex-shrink-0 ${selectedKnowledge?.id === item.id ? 'bg-[#C02C38]' : 'bg-transparent'}`} />
                      
                      <div className="flex-1 min-w-0">
                        {/* 标题行 */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h5 className="text-sm font-semibold leading-tight line-clamp-1">{item.title}</h5>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                            {item.subcategory}
                          </span>
                        </div>
                        
                        {/* 内容摘要 */}
                        <p className="text-xs opacity-60 leading-relaxed line-clamp-2 mb-2">{item.content}</p>
                        
                        {/* 底部信息 */}
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className={`flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <i className="fas fa-clock text-[10px]"></i>
                            历史文化
                          </span>
                          {item.relatedItems && item.relatedItems.length > 0 && (
                            <span className={`flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              <i className="fas fa-link text-[10px]"></i>
                              {item.relatedItems.length}个相关
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              {!isDataLoading && displayedItems.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                  className="flex flex-col items-center justify-center py-10 px-4"
                >
                  {/* 空状态插画 */}
                  <div className="relative mb-5">
                    <motion.div 
                      className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}
                      animate={{ 
                        rotate: [0, -5, 5, 0],
                        scale: [1, 1.02, 1]
                      }}
                      transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <i className={`fas ${searchQuery ? 'fa-search' : 'fa-book-open'} text-3xl bg-gradient-to-br from-[#C02C38] to-[#E85D75] bg-clip-text text-transparent`}></i>
                    </motion.div>
                    {/* 装饰元素 */}
                    <motion.div 
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C02C38]/20"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div 
                      className="absolute -bottom-1 -left-2 w-3 h-3 rounded-full bg-blue-400/30"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.8, 0.3] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                    />
                  </div>
                  
                  <h4 className="text-base font-semibold mb-1">
                    {searchQuery ? '未找到相关知识' : showFavorites ? '暂无收藏' : '暂无相关知识'}
                  </h4>
                  <p className="text-xs opacity-60 mb-5 max-w-[200px] mx-auto text-center leading-relaxed">
                    {searchQuery 
                      ? `未找到与 "${searchQuery}" 相关的知识` 
                      : showFavorites
                        ? '您还没有收藏任何知识，点击知识卡片上的收藏按钮添加'
                        : '该分类下暂时没有内容'}
                  </p>
                  
                  {/* 操作按钮区域 */}
                  <div className="w-full space-y-3">
                    {/* 热门分类推荐 */}
                    {!searchQuery && !showFavorites && (
                      <div className="mb-3">
                        <p className="text-xs opacity-40 mb-2 text-center">推荐分类</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {KNOWLEDGE_CATEGORIES.slice(0, 4).map((category, idx) => {
                            const config = CATEGORY_CONFIG[category];
                            return (
                              <motion.button
                                key={category}
                                onClick={() => handleCategoryChange(category)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${isDark 
                                  ? 'bg-gray-800/80 hover:bg-gray-700' 
                                  : 'bg-white hover:bg-gray-50 border border-gray-200'}`}
                                style={{ color: config.color }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                              >
                                <i className={`fas fa-${config.icon} mr-1 text-[10px]`}></i>
                                {category}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* 操作按钮 */}
                    <div className="flex gap-2 justify-center">
                      {!searchQuery ? (
                        <>
                          <motion.button
                            onClick={() => {
                              const randomCategory = KNOWLEDGE_CATEGORIES[Math.floor(Math.random() * KNOWLEDGE_CATEGORIES.length)];
                              updateState({ traceSelectedCategoryId: randomCategory, traceSelectedKnowledgeId: null });
                            }}
                            className="px-4 py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-[#C02C38] to-[#E85D75] text-white shadow-md hover:shadow-lg transition-all duration-300"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <i className="fas fa-dice mr-1.5"></i>
                            随机探索
                          </motion.button>
                          <motion.button
                            onClick={() => {
                              const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                              searchInput?.focus();
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${isDark 
                              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <i className="fas fa-search mr-1.5"></i>
                            搜索
                          </motion.button>
                        </>
                      ) : (
                        <>
                          <motion.button
                            onClick={() => setSearchQuery('')}
                            className={`px-4 py-2 rounded-lg text-xs font-medium ${isDark 
                              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-all duration-300`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <i className="fas fa-undo mr-1.5"></i>
                            清除搜索
                          </motion.button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* 知识详情 - 占据7列 */}
          <div className={`md:col-span-7 md:h-full overflow-y-auto rounded-xl border ${isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-800' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} p-5 shadow-lg`}>
            <div className="flex items-center gap-2 mb-5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}>
                <i className="fas fa-info-circle text-sm text-blue-500"></i>
              </div>
              <h4 className="text-sm font-semibold">详细信息</h4>
            </div>
            
            {selectedKnowledge ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                {/* 知识标题 */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h5 className="text-lg font-semibold leading-tight mb-3">{selectedKnowledge.title}</h5>
                  <div className="flex items-center text-xs opacity-70 space-x-3 flex-wrap">
                    <span 
                      className="px-3 py-1 rounded-full"
                      style={{ 
                        backgroundColor: CATEGORY_CONFIG[selectedKnowledge.category]?.bgColor || 'rgba(192, 44, 56, 0.1)',
                        color: CATEGORY_CONFIG[selectedKnowledge.category]?.color || '#C02C38'
                      }}
                    >
                      <i className={`fas fa-${CATEGORY_CONFIG[selectedKnowledge.category]?.icon || 'tag'} mr-1`}></i>
                      {selectedKnowledge.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full ${isDark ? 'bg-gray-700/80 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                      {selectedKnowledge.subcategory}
                    </span>
                  </div>
                </div>
                
                {/* 知识图片 */}
                {selectedKnowledge.imageUrl && (
                  <motion.div 
                    className="w-full rounded-lg overflow-hidden shadow-xl"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={selectedKnowledge.imageUrl}
                      alt={selectedKnowledge.title}
                      className="w-full h-auto object-cover transition-transform duration-500 hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/600x300?text=${encodeURIComponent(selectedKnowledge.title)}`;
                      }}
                      loading="lazy"
                    />
                  </motion.div>
                )}
                
                {/* 知识内容 */}
                <div>
                  <h6 className="text-xs font-medium mb-4 flex items-center gap-1.5">
                    <i className="fas fa-quote-left text-[#C02C38]"></i>
                    文化内涵
                  </h6>
                  <div className={`text-sm font-medium leading-relaxed whitespace-pre-line ${isDark ? 'text-gray-300' : 'text-gray-700'} p-5 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-sm`}>
                    {selectedKnowledge.content}
                  </div>
                </div>
                
                {/* 相关知识 */}
                {selectedKnowledge.relatedItems && selectedKnowledge.relatedItems.length > 0 && (
                  <div>
                    <h6 className="text-xs font-medium mb-4 flex items-center gap-1.5">
                      <i className="fas fa-link text-[#C02C38]"></i>
                      相关内容
                    </h6>
                    <div className="flex flex-wrap gap-3">
                      {selectedKnowledge.relatedItems.map((relatedId) => {
                        const relatedItem = tianjinCultureService.getKnowledgeById(relatedId);
                        return relatedItem ? (
                          <motion.button
                            key={relatedId}
                            onClick={() => handleKnowledgeSelect(relatedItem)}
                            className={`px-4 py-2 rounded-full text-xs ${isDark 
                              ? 'bg-gray-800/80 hover:bg-gray-700/90' 
                              : 'bg-white/80 hover:bg-gray-50'} transition-all duration-200 shadow-sm backdrop-blur-sm`}
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.05 }}
                            aria-label={`查看相关知识：${relatedItem.title}`}
                          >
                            {relatedItem.title}
                          </motion.button>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                
                {/* 操作按钮 */}
                <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <motion.button
                    onClick={() => selectedKnowledge && toggleFavorite(selectedKnowledge.id)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-300 ${favorites.includes(selectedKnowledge?.id || '')
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg shadow-orange-500/25'
                      : isDark
                        ? 'bg-gray-800/80 hover:bg-gray-700/90 text-gray-300'
                        : 'bg-white/80 hover:bg-gray-50 text-gray-700'} shadow-md hover:shadow-lg`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label={favorites.includes(selectedKnowledge?.id || '') ? '取消收藏' : '收藏'}
                  >
                    <i className={`fas ${favorites.includes(selectedKnowledge?.id || '') ? 'fa-star' : 'fa-star-o'}`}></i>
                    <span>{favorites.includes(selectedKnowledge?.id || '') ? '已收藏' : '收藏'}</span>
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      if (selectedKnowledge) {
                        navigator.clipboard.writeText(`${selectedKnowledge.title}\n\n${selectedKnowledge.content}`);
                      }
                    }}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${isDark
                      ? 'bg-gray-800/80 hover:bg-gray-700/90 text-gray-300'
                      : 'bg-white/80 hover:bg-gray-50 text-gray-700'} transition-all duration-300 shadow-md hover:shadow-lg`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="复制内容"
                  >
                    <i className="fas fa-copy"></i>
                    <span>复制</span>
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                  <i className="fas fa-hand-pointer text-2xl opacity-40"></i>
                </div>
                <p className="text-sm font-medium mb-1">选择一个文化知识项查看详情</p>
                <p className="text-xs opacity-60 mb-6">点击左侧列表中的知识项获取详细信息</p>
                {knowledgeItems.length > 0 ? (
                  <motion.button
                    onClick={() => handleKnowledgeSelect(knowledgeItems[0])}
                    className={`px-4 py-2 rounded-lg text-xs font-medium ${isDark 
                      ? 'bg-[#C02C38] text-white' 
                      : 'bg-[#C02C38] text-white'} transition-all duration-300 shadow-md hover:shadow-lg`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="查看第一个知识"
                  >
                    <i className="fas fa-lightbulb mr-1.5"></i>
                    查看第一个知识
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={() => {
                      const randomCategory = KNOWLEDGE_CATEGORIES[Math.floor(Math.random() * KNOWLEDGE_CATEGORIES.length)];
                      updateState({ traceSelectedCategoryId: randomCategory, traceSelectedKnowledgeId: null });
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-medium ${isDark 
                      ? 'bg-[#C02C38] text-white' 
                      : 'bg-[#C02C38] text-white'} transition-all duration-300 shadow-md hover:shadow-lg`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="浏览其他分类"
                  >
                    <i className="fas fa-random mr-1.5"></i>
                    浏览其他分类
                  </motion.button>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* 小屏幕：单列布局，带有标签页切换 */}
        <div className="md:hidden flex flex-col h-full">
          {/* 标签页导航 */}
          <div className={`flex rounded-t-lg overflow-hidden mb-3 border ${isDark ? 'border-gray-800' : 'border-gray-200'} shadow-sm`}>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-300 ${isDark 
                ? activeTab === 'list' ? 'bg-gray-800 text-white' : 'bg-gray-900 text-gray-400' 
                : activeTab === 'list' ? 'bg-white text-gray-900 border-b-2 border-[#C02C38]' : 'bg-gray-50 text-gray-600'}`}
              aria-selected={activeTab === 'list'}
              role="tab"
            >
              <i className={`fas fa-list-ul text-xs ${activeTab === 'list' ? 'text-[#C02C38]' : ''}`}></i>
              <span>{searchQuery ? '搜索结果' : '相关知识'} ({displayedItems.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('detail')}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-300 ${isDark 
                ? activeTab === 'detail' ? 'bg-gray-800 text-white' : 'bg-gray-900 text-gray-400' 
                : activeTab === 'detail' ? 'bg-white text-gray-900 border-b-2 border-[#C02C38]' : 'bg-gray-50 text-gray-600'}`}
              aria-selected={activeTab === 'detail'}
              role="tab"
            >
              <i className={`fas fa-info-circle text-xs ${activeTab === 'detail' ? 'text-[#C02C38]' : ''}`}></i>
              <span>详细信息</span>
            </button>
          </div>

          {/* 知识列表 - 占据整个宽度 */}
          {activeTab === 'list' && (
            <div className={`h-[320px] overflow-y-auto rounded-lg border ${isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-800' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} p-6 shadow-lg mb-4`}>
              <div className="space-y-4">
                {isDataLoading && !searchQuery ? (
                  // 骨架屏加载状态
                  Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-sm`}>
                      <div className="flex justify-between items-start">
                        <LoadingSkeleton variant="text" width="70%" height="16px" className="mb-2" />
                        <LoadingSkeleton variant="text" width="50px" height="16px" />
                      </div>
                      <LoadingSkeleton variant="text" width="100%" height="12px" className="mb-1" />
                      <LoadingSkeleton variant="text" width="80%" height="12px" className="mb-3" />
                      <div className="flex items-center gap-2">
                        <LoadingSkeleton variant="text" width="60px" height="12px" />
                        <LoadingSkeleton variant="text" width="80px" height="12px" />
                      </div>
                    </div>
                  ))
                ) : (
                  // 实际数据渲染
                  displayedItems.map((item) => (
                    <motion.div
                      key={item.id}
                      onClick={() => {
                        handleKnowledgeSelect(item);
                        setActiveTab('detail');
                      }}
                      className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${isDark 
                        ? selectedKnowledge?.id === item.id 
                          ? 'bg-[#C02C38]/15 border-l-4 border-[#C02C38] shadow-md' 
                          : 'bg-gray-800/80 hover:bg-gray-700/90' 
                        : selectedKnowledge?.id === item.id 
                          ? 'bg-[#C02C38]/10 border-l-4 border-[#C02C38] shadow-md' 
                          : 'bg-white/80 hover:bg-gray-50'} backdrop-blur-sm`}
                      whileHover={{ x: 4, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      aria-selected={selectedKnowledge?.id === item.id}
                      role="listitem"
                    >
                      <div className="flex justify-between items-start">
                        <h5 className="text-sm font-medium leading-tight">{item.title}</h5>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700/80 text-gray-300' : 'bg-gray-100 text-gray-700'} backdrop-blur-sm`}>
                          {item.subcategory}
                        </span>
                      </div>
                      <p className="text-xs opacity-70 mt-1 line-clamp-2 leading-relaxed">{item.content}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <i className="fas fa-clock"></i>
                          历史文化
                        </span>
                        {item.relatedItems && item.relatedItems.length > 0 && (
                          <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <i className="fas fa-link"></i>
                            {item.relatedItems.length}个相关
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
                {!isDataLoading && displayedItems.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8 px-4"
                  >
                    <div className="relative mb-4">
                      <motion.div 
                        className={`w-20 h-20 rounded-xl mx-auto flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}
                        animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.02, 1] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <i className={`fas ${searchQuery ? 'fa-search' : 'fa-book-open'} text-4xl bg-gradient-to-br from-[#C02C38] to-[#E85D75] bg-clip-text text-transparent`}></i>
                      </motion.div>
                    </div>
                    <h4 className="text-base font-semibold mb-1">
                      {searchQuery ? '未找到相关知识' : '暂无相关知识'}
                    </h4>
                    <p className="text-xs opacity-60 mb-4">
                      {searchQuery ? `未找到与 "${searchQuery}" 相关的内容` : '该分类下暂时没有内容'}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {searchQuery ? (
                        ['天津', '民俗', '历史', '建筑', '饮食', '艺术'].map((keyword) => (
                          <motion.button
                            key={keyword}
                            onClick={() => {
                              setSearchQuery(keyword);
                              saveRecentSearch(keyword);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs ${isDark 
                              ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-300' 
                              : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200'} transition-colors`}
                            whileTap={{ scale: 0.95 }}
                          >
                            {keyword}
                          </motion.button>
                        ))
                      ) : (
                        <>
                          <motion.button
                            onClick={() => {
                              const randomCategory = KNOWLEDGE_CATEGORIES[Math.floor(Math.random() * KNOWLEDGE_CATEGORIES.length)];
                              updateState({ traceSelectedCategoryId: randomCategory, traceSelectedKnowledgeId: null });
                            }}
                            className="px-4 py-2 rounded-lg text-xs bg-gradient-to-r from-[#C02C38] to-[#E85D75] text-white shadow-md"
                            whileTap={{ scale: 0.95 }}
                          >
                            <i className="fas fa-dice mr-1"></i>
                            随机探索
                          </motion.button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* 知识详情 - 占据剩余高度 */}
          {activeTab === 'detail' && (
            <div className={`flex-1 overflow-y-auto rounded-lg border ${isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-800' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} p-6 shadow-lg`}> 
              <h4 className="text-sm font-medium flex items-center gap-2 mb-4">
                <i className="fas fa-info-circle text-xs"></i>
                详细信息
              </h4>
              
              {selectedKnowledge ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  {/* 知识标题 */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h5 className="text-base font-semibold leading-tight mb-2">{selectedKnowledge.title}</h5>
                    <div className="flex items-center text-xs opacity-70 space-x-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full bg-[#C02C38]/10 text-[#C02C38]`}>
                        {selectedKnowledge.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700/80 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        {selectedKnowledge.subcategory}
                      </span>
                    </div>
                  </div>
                  
                  {/* 知识图片 */}
                  {selectedKnowledge.imageUrl && (
                    <motion.div 
                      className="w-full rounded-lg overflow-hidden shadow-xl"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                    >
                      <img
                        src={selectedKnowledge.imageUrl}
                        alt={selectedKnowledge.title}
                        className="w-full h-auto object-cover transition-transform duration-500 hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://via.placeholder.com/600x300?text=${encodeURIComponent(selectedKnowledge.title)}`;
                        }}
                        loading="lazy"
                      />
                    </motion.div>
                  )}
                  
                  {/* 知识内容 */}
                  <div>
                    <h6 className="text-xs font-medium mb-3 flex items-center gap-1.5">
                      <i className="fas fa-quote-left text-[#C02C38]"></i>
                      文化内涵
                    </h6>
                    <div className={`text-sm leading-relaxed whitespace-pre-line ${isDark ? 'text-gray-300' : 'text-gray-700'} p-4 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-sm`}>
                      {selectedKnowledge.content}
                    </div>
                  </div>
                  
                  {/* 相关知识 */}
                  {selectedKnowledge.relatedItems && selectedKnowledge.relatedItems.length > 0 && (
                    <div>
                      <h6 className="text-xs font-medium mb-3 flex items-center gap-1.5">
                        <i className="fas fa-link text-[#C02C38]"></i>
                        相关内容
                      </h6>
                      <div className="flex flex-wrap gap-2">
                        {selectedKnowledge.relatedItems.map((relatedId) => {
                          const relatedItem = tianjinCultureService.getKnowledgeById(relatedId);
                          return relatedItem ? (
                            <motion.button
                              key={relatedId}
                              onClick={() => handleKnowledgeSelect(relatedItem)}
                              className={`px-3 py-1.5 rounded-full text-xs ${isDark 
                                ? 'bg-gray-800/80 hover:bg-gray-700/90' 
                                : 'bg-white/80 hover:bg-gray-50'} transition-all duration-200 shadow-sm backdrop-blur-sm`}
                              whileTap={{ scale: 0.95 }}
                              whileHover={{ scale: 1.05 }}
                              aria-label={`查看相关知识：${relatedItem.title}`}
                            >
                              {relatedItem.title}
                            </motion.button>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* 操作按钮 */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      className={`flex-1 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 ${isDark 
                        ? 'bg-[#C02C38] hover:bg-[#A0232F] text-white' 
                        : 'bg-[#C02C38] hover:bg-[#A0232F] text-white'} transition-all duration-300 shadow-md hover:shadow-lg`}
                      aria-label="收藏"
                    >
                      <i className="fas fa-bookmark"></i>
                      <span>收藏</span>
                    </button>
                    <button
                      className={`flex-1 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 ${isDark 
                        ? 'bg-gray-800/80 hover:bg-gray-700/90 text-gray-300' 
                        : 'bg-white/80 hover:bg-gray-50 text-gray-700'} transition-all duration-300 shadow-md hover:shadow-lg`}
                      aria-label="分享"
                    >
                      <i className="fas fa-share"></i>
                      <span>分享</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-center py-16"
                >
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                    <i className="fas fa-info-circle text-3xl opacity-50"></i>
                  </div>
                  <p className="text-sm font-medium mb-3">选择一个文化知识项查看详情</p>
                  <p className="text-xs opacity-60 mb-6">点击上方知识列表中的知识项获取详细信息</p>
                  <motion.button
                    onClick={() => setActiveTab('list')}
                    className={`px-4 py-2.5 rounded-lg text-xs ${isDark 
                      ? 'bg-[#C02C38]/20 hover:bg-[#C02C38]/30 text-[#C02C38]' 
                      : 'bg-[#C02C38]/10 hover:bg-[#C02C38]/20 text-[#C02C38]'} transition-colors shadow-sm`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="返回知识列表"
                  >
                    <i className="fas fa-list-ul mr-1"></i>
                    返回知识列表
                  </motion.button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CulturalTracePanel;
