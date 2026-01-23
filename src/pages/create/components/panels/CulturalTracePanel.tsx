import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../../hooks/useCreateStore';
import tianjinCultureService from '@/services/tianjinCultureService';
import { KnowledgeItem, KNOWLEDGE_CATEGORIES } from '@/services/tianjinCultureService';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

const CulturalTracePanel: React.FC = () => {
  const { isDark } = useTheme();
  const { culturalInfoText, updateState } = useCreateStore();
  const [selectedCategory, setSelectedCategory] = useState<string>(KNOWLEDGE_CATEGORIES[0]);
  const [selectedKnowledge, setSelectedKnowledge] = useState<KnowledgeItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'detail'>('list');

  // 保存最近搜索
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    
    const updatedSearches = [
      query,
      ...recentSearches.filter(item => item !== query)
    ].slice(0, 5);
    
    setRecentSearches(updatedSearches);
    // 实际项目中应该保存到localStorage
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
  const displayedItems = searchQuery ? searchResults : knowledgeItems;

  // 处理知识项选择
  const handleKnowledgeSelect = (knowledge: KnowledgeItem) => {
    setSelectedKnowledge(knowledge);
    updateState({ culturalInfoText: knowledge.content });
    setShowSearchResults(false);
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
    setSelectedCategory(category);
    setSearchQuery('');
    setShowSearchResults(false);
    // 重置选择的知识项
    setSelectedKnowledge(null);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="mb-5">
        <div className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-gradient-to-r from-[#C02C38]/10 to-transparent' : 'bg-gradient-to-r from-[#C02C38]/5 to-transparent'}`}>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <i className="fas fa-landmark text-[#C02C38]"></i>
            <span>文化溯源</span>
          </h3>
          <p className="text-xs opacity-70">了解文化元素的历史背景和文化内涵，探索文化知识</p>
        </div>
        
        {/* 搜索框 */}
        <form onSubmit={handleSearchSubmit} className={`relative mb-4`}>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="fas fa-search text-sm opacity-50"></i>
          </div>
          <input
            type="text"
            placeholder="搜索文化知识..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-sm border shadow-sm ${isDark 
              ? 'bg-gray-800/90 border-gray-700 text-white focus:border-[#C02C38] focus:ring-[#C02C38]/30' 
              : 'bg-white/90 border-gray-200 text-gray-900 focus:border-[#C02C38] focus:ring-[#C02C38]/30'} focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-sm`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            aria-label="搜索文化知识"
          />
          
          {isLoading ? (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <i className="fas fa-spinner fa-spin text-sm opacity-70"></i>
            </div>
          ) : (
            <button 
              type="submit"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm opacity-70 hover:opacity-100 transition-opacity"
            >
              <i className="fas fa-search"></i>
            </button>
          )}
          
          {/* 搜索结果下拉 */}
          {showSearchResults && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto`}
            >
              {searchResults.slice(0, 5).map((result) => (
                <motion.div
                  key={result.id}
                  onClick={() => handleKnowledgeSelect(result)}
                  className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                  whileHover={{ x: 4 }}
                >
                  <h5 className="text-sm font-medium">{result.title}</h5>
                  <p className="text-xs opacity-70 mt-1 line-clamp-2">{result.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                      {result.category}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                      {result.subcategory}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
          
          {/* 空搜索结果 */}
          {showSearchResults && searchResults.length === 0 && searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-4 text-center`}
            >
              <i className="fas fa-search text-2xl opacity-50 mb-2"></i>
              <p className="text-sm">未找到相关知识</p>
              <p className="text-xs opacity-70 mt-1">尝试使用其他关键词搜索</p>
            </motion.div>
          )}
        </form>
        
        {/* 最近搜索 */}
        {!searchQuery && recentSearches.length > 0 && (
          <div className="mb-3">
            <h5 className="text-xs font-medium mb-2">最近搜索</h5>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    setSearchQuery(search);
                    saveRecentSearch(search);
                  }}
                  className={`px-3 py-1 rounded-full text-xs ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
                  whileTap={{ scale: 0.95 }}
                >
                  {search}
                  <span 
                    onClick={(e) => {
                      e.stopPropagation();
                      setRecentSearches(recentSearches.filter((_, i) => i !== index));
                    }}
                    className="ml-1 text-gray-400 hover:text-gray-500"
                  >
                    <i className="fas fa-times text-[8px]"></i>
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        )}
        
        {/* 分类选择 */}
        <div className="mb-5">
          <h5 className="text-xs font-medium mb-3 flex items-center gap-1.5">
            <i className="fas fa-tags text-[#C02C38]"></i>
            知识分类
          </h5>
          <div className="flex flex-wrap gap-2">
            {KNOWLEDGE_CATEGORIES.map((category, index) => (
              <motion.button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2.5 rounded-lg text-xs whitespace-nowrap transition-all duration-300 ease-in-out flex items-center gap-1.5 font-medium ${isDark 
                  ? selectedCategory === category 
                    ? 'bg-[#C02C38] text-white shadow-md' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300' 
                  : selectedCategory === category 
                    ? 'bg-[#C02C38] text-white shadow-md' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-gray-200'}`}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                tabIndex={0}
                role="tab"
                aria-selected={selectedCategory === category}
              >
                <i className={`fas fa-${index % 4 === 0 ? 'tag' : index % 4 === 1 ? 'book' : index % 4 === 2 ? 'history' : 'culture'} text-xs`}></i>
                <span>{category}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* 响应式网格布局 */}
      <div className="flex-1">
        {/* 大屏幕：两列布局 */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6">
          {/* 知识列表 - 占据5列 */}
          <div className={`lg:col-span-5 lg:h-full overflow-y-auto rounded-lg border ${isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-800' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} p-6 shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <i className="fas fa-list-ul text-xs"></i>
                {searchQuery ? '搜索结果' : '相关知识'}
                <span className="text-xs opacity-70 font-normal">({displayedItems.length})</span>
              </h4>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className={`text-xs flex items-center gap-1 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
                  aria-label="清除搜索"
                >
                  <i className="fas fa-times"></i>
                  <span>清除</span>
                </button>
              )}
            </div>
            
            <div className="space-y-3">
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
                    onClick={() => handleKnowledgeSelect(item)}
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
                    <div className="mb-3">
                      <div className="flex justify-between items-center">
                        <h5 className="text-sm font-medium leading-tight">{item.title}</h5>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700/80 text-gray-300' : 'bg-gray-100 text-gray-700'} backdrop-blur-sm`}>
                          {item.subcategory}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-xs opacity-70 leading-relaxed line-clamp-3">{item.content}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs">
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-center py-12"
                >
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5 ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                    <i className="fas fa-book-open text-4xl opacity-50"></i>
                  </div>
                  <p className="text-base font-medium mb-3">{searchQuery ? '未找到相关知识' : '暂无相关知识'}</p>
                  <p className="text-sm opacity-70 mb-6">{searchQuery ? '尝试使用其他关键词搜索' : '尝试切换其他分类或使用搜索'}</p>
                  
                  {!searchQuery ? (
                    <div className="flex flex-col gap-3">
                      <motion.button
                        onClick={() => {
                          const randomCategory = KNOWLEDGE_CATEGORIES[Math.floor(Math.random() * KNOWLEDGE_CATEGORIES.length)];
                          setSelectedCategory(randomCategory);
                        }}
                        className={`px-5 py-3 rounded-lg text-sm font-medium ${isDark 
                          ? 'bg-[#C02C38] text-white' 
                          : 'bg-[#C02C38] text-white'} transition-all duration-300 shadow-md hover:shadow-lg`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <i className="fas fa-random mr-2"></i>
                        随机浏览一个分类
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                          searchInput?.focus();
                        }}
                        className={`px-5 py-3 rounded-lg text-sm font-medium ${isDark 
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'} transition-all duration-300`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <i className="fas fa-search mr-2"></i>
                        开始搜索
                      </motion.button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {['天津', '民俗', '历史', '建筑', '饮食', '艺术'].map((keyword) => (
                          <motion.button
                            key={keyword}
                            onClick={() => {
                              setSearchQuery(keyword);
                              saveRecentSearch(keyword);
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark 
                              ? 'bg-gray-800/80 hover:bg-gray-700/90 text-gray-300' 
                              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'} transition-all duration-200 shadow-sm`}
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.05 }}
                          >
                            {keyword}
                          </motion.button>
                        ))}
                      </div>
                      <motion.button
                        onClick={() => setSearchQuery('')}
                        className={`px-5 py-3 rounded-lg text-sm font-medium ${isDark 
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'} transition-all duration-300`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <i className="fas fa-times mr-2"></i>
                        清除搜索
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* 知识详情 - 占据7列 */}
          <div className={`lg:col-span-7 lg:h-full overflow-y-auto rounded-lg border ${isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-800' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} p-6 shadow-lg`}>
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
                className="text-center py-20"
              >
                <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                  <i className="fas fa-info-circle text-5xl opacity-50"></i>
                </div>
                <p className="text-base font-medium mb-3">选择一个文化知识项查看详情</p>
                <p className="text-sm opacity-70 mb-8">点击左侧列表中的知识项获取详细信息</p>
                {knowledgeItems.length > 0 ? (
                  <motion.button
                    onClick={() => handleKnowledgeSelect(knowledgeItems[0])}
                    className={`px-5 py-3 rounded-lg text-sm font-medium ${isDark 
                      ? 'bg-[#C02C38] text-white' 
                      : 'bg-[#C02C38] text-white'} transition-all duration-300 shadow-md hover:shadow-lg`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="查看第一个知识"
                  >
                    <i className="fas fa-lightbulb mr-2"></i>
                    查看第一个知识
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={() => {
                      // 切换到一个有数据的分类
                      const randomCategory = KNOWLEDGE_CATEGORIES[Math.floor(Math.random() * KNOWLEDGE_CATEGORIES.length)];
                      setSelectedCategory(randomCategory);
                    }}
                    className={`px-5 py-3 rounded-lg text-sm font-medium ${isDark 
                      ? 'bg-[#C02C38] text-white' 
                      : 'bg-[#C02C38] text-white'} transition-all duration-300 shadow-md hover:shadow-lg`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="浏览其他分类"
                  >
                    <i className="fas fa-random mr-2"></i>
                    浏览其他分类
                  </motion.button>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* 平板和小屏幕：单列布局，带有标签页切换 */}
        <div className="lg:hidden flex flex-col h-full">
          {/* 标签页导航 */}
          <div className={`flex rounded-t-lg overflow-hidden mb-2 border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${isDark 
                ? activeTab === 'list' ? 'bg-gray-800 text-white' : 'bg-gray-900 text-gray-400' 
                : activeTab === 'list' ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-600'}`}
              aria-selected={activeTab === 'list'}
              role="tab"
            >
              <i className="fas fa-list-ul text-xs"></i>
              <span>{searchQuery ? '搜索结果' : '相关知识'} ({displayedItems.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('detail')}
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${isDark 
                ? activeTab === 'detail' ? 'bg-gray-800 text-white' : 'bg-gray-900 text-gray-400' 
                : activeTab === 'detail' ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-600'}`}
              aria-selected={activeTab === 'detail'}
              role="tab"
            >
              <i className="fas fa-info-circle text-xs"></i>
              <span>详细信息</span>
            </button>
          </div>

          {/* 知识列表 - 占据整个宽度 */}
          {activeTab === 'list' && (
            <div className={`h-[300px] overflow-y-auto rounded-lg border ${isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-800' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} p-6 shadow-lg mb-4`}>
              <div className="space-y-3">
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
                        setActiveTab('detail'); // 选择知识项后自动切换到详情标签页
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
                <div className="text-center py-10 text-xs opacity-50">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                    <i className="fas fa-book-open text-3xl"></i>
                  </div>
                  <p className="text-sm font-medium mb-2">{searchQuery ? '未找到相关知识' : '暂无相关知识'}</p>
                  <div className="mt-3 space-y-3">
                    {searchQuery ? (
                      <div className="space-y-2">
                        <p>尝试使用其他关键词搜索</p>
                        <div className="flex flex-wrap gap-2 justify-center mt-3">
                          {['天津', '民俗', '历史', '建筑', '饮食', '艺术'].map((keyword) => (
                            <motion.button
                              key={keyword}
                              onClick={() => {
                                setSearchQuery(keyword);
                                saveRecentSearch(keyword);
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs ${isDark 
                                ? 'bg-gray-800/80 hover:bg-gray-700/90' 
                                : 'bg-white/80 hover:bg-gray-50'} transition-colors shadow-sm backdrop-blur-sm`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {keyword}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p>尝试切换其他分类或使用搜索</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <motion.button
                            onClick={() => setSelectedCategory(KNOWLEDGE_CATEGORIES[1])}
                            className={`px-4 py-2 rounded-lg text-xs ${isDark 
                              ? 'bg-[#C02C38]/20 hover:bg-[#C02C38]/30 text-[#C02C38]' 
                              : 'bg-[#C02C38]/10 hover:bg-[#C02C38]/20 text-[#C02C38]'} transition-colors shadow-sm`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <i className="fas fa-random mr-1"></i>
                            随机浏览一个分类
                          </motion.button>
                          <button
                            onClick={() => {
                              const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                              searchInput?.focus();
                            }}
                            className={`px-4 py-2 rounded-lg text-xs ${isDark 
                              ? 'bg-gray-800/80 hover:bg-gray-700/90 text-white' 
                              : 'bg-white/80 hover:bg-gray-50 text-gray-900'} transition-colors shadow-sm`}
                          >
                            <i className="fas fa-search mr-1"></i>
                            开始搜索
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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