import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useLocation, Link } from 'react-router-dom';

import GradientHero from '@/components/GradientHero'
import { isPrefetched } from '@/services/prefetch'
import { TianjinImage, TianjinButton } from '@/components/TianjinStyleComponents'
import { llmService } from '@/services/llmService'
import { BRANDS } from '@/lib/brands'
import imageService from '@/services/imageService'
import postsApi from '@/services/postService'
import { searchService } from '@/services/searchService'
import { SearchResultType } from '@/components/SearchBar'
// 导入mock数据
import { mockWorks, type Work } from '@/mock/works'
import MobileWaterfallWorks from '@/components/MobileWaterfallWorks'
import AdvancedTagFilter from '@/components/AdvancedTagFilter'
import { useResponsive } from '@/utils/responsiveDesign'


// 中文注释：本页专注作品探索，社区相关内容已迁移到创作者社区页面

// 分类数据
const categories = [
  '全部', '国潮设计', '纹样设计', '品牌设计', '非遗传承', '插画设计', '工艺创新', '老字号品牌', 'IP设计', '包装设计'
];

// 移除视频作品追加，减少初始数据量，提高页面加载速度
// 视频作品数据将在后续通过异步方式加载，或者放在单独的页面中展示
// 这样可以减少初始加载时间，提高页面跳转速度

// 防抖函数
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

export default function Explore() {
  const { theme } = useTheme();
  const { width } = useResponsive();
  const navigate = useNavigate();
  const location = useLocation();
  const [allWorks, setAllWorks] = useState<Work[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popularity' | 'newest' | 'mostViewed' | 'mostCommented' | 'originalOrder'>('originalOrder');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [relatedSearches, setRelatedSearches] = useState<string[]>([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  
  // 标签筛选相关状态
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const [favoriteTags, setFavoriteTags] = useState<string[]>([]);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [featuredAtStart, setFeaturedAtStart] = useState(true);
  const [featuredAtEnd, setFeaturedAtEnd] = useState(false);
  const featuredScrollRef = useRef<HTMLDivElement>(null);
  const tagsContainerRef = useRef<HTMLDivElement>(null);
  // 用于自动滚动标签栏的ref
  const autoScrollTagsRef = useRef<HTMLDivElement>(null);
  // 自动滚动标签栏的宽度
  const [autoScrollWidth, setAutoScrollWidth] = useState<number>(0);
  
  // 搜索建议相关状态
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // 搜索历史记录状态
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [maxHistoryItems, setMaxHistoryItems] = useState(10);
  
  // 初始化作品数据 - 直接使用mockWorks，避免多余的localStorage操作
  useEffect(() => {
    setAllWorks(mockWorks);
  }, []);
  
  // 简化标签处理逻辑，减少计算复杂度
  // 移除复杂的标签计数和排序逻辑
  const popularTags = useMemo(() => {
    // 直接返回固定的热门标签，减少计算复杂度
    return ['老字号品牌', '国潮设计', '非遗传承', 'IP设计', '品牌设计', '插画设计', '工艺创新', '纹样设计', '包装设计', '共创'];
  }, []);
  
  // 计算自动滚动标签栏的宽度
  useEffect(() => {
    const updateScrollWidth = () => {
      if (autoScrollTagsRef.current) {
        // 获取单个标签集合的宽度，然后减去容器宽度以实现完整滚动
        const singleSetWidth = autoScrollTagsRef.current.scrollWidth / 3;
        setAutoScrollWidth(singleSetWidth);
      }
    };
    
    // 初始化宽度
    updateScrollWidth();
    
    // 监听窗口大小变化，重新计算宽度
    window.addEventListener('resize', updateScrollWidth);
    
    return () => {
      window.removeEventListener('resize', updateScrollWidth);
    };
  }, [popularTags]);

  // 初始化收藏状态
  useEffect(() => {
    const bookmarkedIds = postsApi.getUserBookmarks();
    const initialBookmarked: Record<string, boolean> = {};
    bookmarkedIds.forEach(id => {
      initialBookmarked[id] = true;
    });
    setBookmarked(initialBookmarked);
  }, []);
  
  // 标签点击处理
  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // 监听精选作品滚动
  const handleFeaturedScroll = () => {
    if (!featuredScrollRef.current) return;
    const el = featuredScrollRef.current;
    setFeaturedAtStart(el.scrollLeft <= 10);
    setFeaturedAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 10);
  };

  // 滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // 从URL中获取查询参数
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    const search = params.get('search') || params.get('q');
    const tags = params.get('tags');
    
    if (category && category !== selectedCategory) {
      setSelectedCategory(category);
    }
    if (search && search !== searchQuery) {
      setSearchQuery(search);
      setShowSearchBar(true);
    }
    if (tags) {
      try {
        const tagArray = tags.split(',');
        if (tagArray.length > 0 && tagArray[0] !== '') {
          setSelectedTags(tagArray);
        }
      } catch (error) {
      }
    }
  }, [location.search]);

  // 筛选和排序作品 - 使用useMemo优化性能
  const filteredWorks = useMemo(() => {
    let result = mockWorks;

    // 按分类筛选
    if (selectedCategory !== '全部') {
      result = result.filter(w => w.category === selectedCategory);
    }

    // 按标签筛选
    if (selectedTags.length > 0) {
      result = result.filter(w => 
        selectedTags.every(tag => w.tags.includes(tag))
      );
    }

    // 按搜索词筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(w => 
        w.title.toLowerCase().includes(query) ||
        w.creator.toLowerCase().includes(query) ||
        w.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 排序
    switch (sortBy) {
      case 'popularity':
        result.sort((a, b) => b.likes - a.likes);
        break;
      case 'newest':
        result.sort((a, b) => b.id - a.id);
        break;
      case 'mostViewed':
        result.sort((a, b) => b.views - a.views);
        break;
      case 'mostCommented':
        result.sort((a, b) => b.comments - a.comments);
        break;
      case 'originalOrder':
        // 不排序，保持作品在文件中的原始顺序
        break;
      default:
        break;
    }

    return result;
  }, [selectedCategory, searchQuery, sortBy, selectedTags, mockWorks]);

  // 获取精选作品：按点赞数降序排序，取前十名
  const featuredWorks = useMemo(() => {
    // 按点赞数降序排序，取前十名
    return [...mockWorks]
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 10);
  }, [mockWorks]);

  // 更新搜索建议
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoadingSuggestions(true);
      try {
        const results = searchService.search(searchQuery).slice(0, 5);
        setSearchSuggestions(results);
      } catch (error) {
        console.error('获取搜索建议失败:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 处理搜索
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    
    // 记录搜索历史
    saveSearchHistory(searchQuery);
    
    setShowSuggestions(false);
    
    // 构建URL查询参数
    const params = new URLSearchParams();
    params.set('search', searchQuery);
    if (selectedCategory !== '全部') {
      params.set('category', selectedCategory);
    }
    
    // 更新URL
    navigate(`/explore?${params.toString()}`);
  }, [searchQuery, selectedCategory, navigate]);

  // 同步URL参数到状态
  useEffect(() => {
    const url = new URL(window.location.href);
    const search = url.searchParams.get('search');
    const category = url.searchParams.get('category');
    
    if (search) setSearchQuery(search);
    if (category) setSelectedCategory(category);
    
    // 清理URL参数
    url.searchParams.delete('search');
    url.searchParams.delete('category');
    window.history.replaceState({}, '', url.toString());
  }, []);

  // 处理清除搜索栏
  const handleClearSearchBar = useCallback(() => {
    setShowSearchBar(false);
    setSearchQuery('');
    navigate('/explore', { replace: true });
  }, [navigate]);

  // 保存搜索历史记录
  const saveSearchHistory = useCallback((query: string) => {
    if (!query.trim() || searchHistory.includes(query)) {
      return;
    }
    
    const updatedHistory = [query, ...searchHistory].slice(0, maxHistoryItems);
    setSearchHistory(updatedHistory);
    try {
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
    }
  }, [searchHistory, maxHistoryItems]);

  // 处理搜索输入变化
  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // 处理搜索回车键
  const handleSearchKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim()) {
        saveSearchHistory(searchQuery.trim());
      }
      setIsSearching(true);
      navigate(`/explore?search=${encodeURIComponent(searchQuery)}`, { replace: true });
      setTimeout(() => {
        setIsSearching(false);
      }, 500);
    }
  }, [searchQuery, saveSearchHistory, navigate]);

  // 处理作品点击
  const handleWorkClick = useCallback((id: number) => {
    navigate(`/explore/${id}`);
  }, [navigate]);
  
  // 处理标签选择
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };
  
  // 处理搜索建议点击
  const handleSuggestionClick = (suggestion: any) => {
    setSearchQuery(suggestion.text);
    setShowSuggestions(false);
    
    if (suggestion.type === SearchResultType.WORK) {
      navigate(`/explore/${suggestion.id}`);
    } else {
      handleSearch();
    }
  };
  
  // 处理搜索历史点击
  const handleHistoryClick = useCallback((history: string) => {
    setSearchQuery(history);
    setIsSearching(true);
    navigate(`/explore?search=${encodeURIComponent(searchQuery)}`, { replace: true });
    setTimeout(() => {
      setIsSearching(false);
    }, 500);
  }, [searchQuery, saveSearchHistory, navigate]);

  // 处理AI推荐搜索
  const handleAIRecommendation = useCallback(async (query: string) => {
    setIsAIThinking(true);
    setSearchQuery(query);
    try {
      const mockResults = [
        `${query} 设计`,
        `${query} 创意`,
        `${query} 风格`,
        `${query} 灵感`,
        `${query} 案例`
      ];
      setRelatedSearches(mockResults);
    } catch (error) {
    } finally {
      setIsAIThinking(false);
    }
  }, []);

  // 处理标签收藏切换
  const handleToggleFavorite = useCallback((tag: string) => {
    setFavoriteTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  // 处理标签移动
  const handleMoveFavorite = useCallback((tag: string, direction: number) => {
    setFavoriteTags(prev => {
      const index = prev.indexOf(tag);
      if (index === -1) return prev;
      
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newTags = [...prev];
      [newTags[index], newTags[newIndex]] = [newTags[newIndex], newTags[index]];
      return newTags;
    });
  }, []);

  // 处理标签选择
  const handleTagSelect = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  // 聚焦搜索输入框
  useEffect(() => {
    if (showSearchBar && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearchBar]);

  // 加载搜索历史记录
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('searchHistory');
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
    }
  }, []);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* 渐变背景 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={`absolute top-0 left-0 w-full h-[50vh] ${theme === 'dark' ? 'bg-gradient-to-b from-blue-900/20 to-transparent' : 'bg-gradient-to-b from-blue-100/50 to-transparent'}`} />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* 顶部标题栏 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              探索灵感
            </h1>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              发现津门文化的无限可能
            </p>
          </div>
          <div className="flex gap-4">
            <TianjinButton 
              variant="secondary"
              leftIcon={<i className="fas fa-search"></i>}
              onClick={() => setShowSearchBar(!showSearchBar)}
            >
              搜索
            </TianjinButton>
            <TianjinButton 
              variant="primary"
              onClick={() => navigate('/create')}
            >
              开始创作
            </TianjinButton>
          </div>
        </div>

        {/* 自动滚动标签栏 */}
        <div className="mb-8 overflow-hidden relative group">
          {/* 渐变遮罩 */}
          <div className={`absolute inset-y-0 left-0 w-12 z-10 bg-gradient-to-r ${theme === 'dark' ? 'from-gray-900' : 'from-gray-50'} opacity-70`}></div>
          <div className={`absolute inset-y-0 right-0 w-12 z-10 bg-gradient-to-l ${theme === 'dark' ? 'from-gray-900' : 'from-gray-50'} opacity-70`}></div>
          
          {/* 自动滚动的标签列表 */}
          <motion.div 
            ref={autoScrollTagsRef}
            className="flex gap-3 w-max"
            animate={{ x: [0, -autoScrollWidth] }}
            transition={{ 
              repeat: Infinity, 
              ease: "linear", 
              duration: 20,
              repeatType: "loop"
            }}
          >
            {[...popularTags, ...popularTags, ...popularTags].map((tag, index) => (
              <motion.button
                key={`${tag}-${index}`}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTagClick(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300
                  ${theme === 'dark' 
                    ? 'bg-gray-800/50 hover:bg-gray-700 text-gray-200 border border-gray-700/50' 
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-sm'
                  } flex items-center gap-2`}
              >
                <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-400 to-purple-400 flex items-center justify-center text-[10px] text-white">
                  #
                </span>
                {tag}
              </motion.button>
            ))}
          </motion.div>
        </div>
        
        {/* 搜索栏 */}
        {showSearchBar && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyDown={handleSearchKeyPress}
                placeholder="搜索作品、设计师、标签..."
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              {searchQuery && (
                <button
                  onClick={handleClearSearchBar}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>

            {/* 搜索建议 */}
            {searchSuggestions.length > 0 && (
              <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">搜索建议</h3>
                <div className="space-y-2">
                  {searchSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                    >
                      <span className="w-6 text-center mr-2">
                        {suggestion.type === SearchResultType.WORK && '🎨'}
                        {suggestion.type === SearchResultType.USER && '👤'}
                        {suggestion.type === SearchResultType.TAG && '🏷️'}
                        {suggestion.type === SearchResultType.CATEGORY && '📁'}
                        {suggestion.type === SearchResultType.PAGE && '📄'}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{suggestion.text}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {suggestion.type === SearchResultType.WORK && '作品'}
                          {suggestion.type === SearchResultType.USER && '设计师'}
                          {suggestion.type === SearchResultType.TAG && '标签'}
                          {suggestion.type === SearchResultType.CATEGORY && '分类'}
                          {suggestion.type === SearchResultType.PAGE && '页面'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 历史记录 */}
            {searchHistory.length > 0 && !searchQuery && (
              <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">历史记录</h3>
                  <button 
                    onClick={() => {
                      setSearchHistory([]);
                      localStorage.removeItem('searchHistory');
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    清空
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((history, index) => (
                    <button
                      key={index}
                      onClick={() => handleHistoryClick(history)}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {history}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* 标签筛选 */}
        <div className="mb-8">
          <AnimatePresence mode="wait">
            {tagsOpen ? (
              <AdvancedTagFilter
                key="advanced-filter"
                allTags={popularTags}
                selectedTags={selectedTags}
                onToggleTag={handleTagClick}
                onClose={() => setTagsOpen(false)}
                onClear={() => setSelectedTags([])}
              />
            ) : (
              <motion.div
                key="simple-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">热门标签</h2>
                  <button
                    onClick={() => setTagsOpen(true)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                  >
                    更多筛选 <i className="fas fa-filter text-xs"></i>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 h-8 overflow-hidden relative">
                  {popularTags.slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                  <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 dark:from-gray-900 to-transparent pointer-events-none"></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI 推荐 */}
        {relatedSearches.length > 0 && (
          <div className="mb-8 bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <i className="fas fa-robot text-blue-600 dark:text-blue-400"></i>
              <h3 className="font-bold text-blue-800 dark:text-blue-300">AI 猜你想找</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {relatedSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchQuery(search);
                    handleSearch();
                  }}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 精选作品轮播 */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">精选作品</h2>
            <button
              onClick={() => setSelectedCategory('全部')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              查看全部
            </button>
          </div>
          
          {/* 轮播容器 */}
          <div className="relative overflow-hidden">
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 sm:pb-4 scrollbar-hide">
              {featuredWorks.map((work, index) => (
                <motion.div
                  key={work.id}
                  className="flex-shrink-0 w-64 sm:w-72 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm cursor-pointer group"
                  onClick={() => handleWorkClick(work.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index, ease: "easeOut" }}
                  whileHover={{ 
                    scale: 1.03, 
                    boxShadow: theme === 'dark' 
                      ? '0 10px 25px rgba(0, 0, 0, 0.4)' 
                      : '0 10px 25px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <TianjinImage
                        src={work.thumbnail}
                        alt={work.title}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                    {work.category && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-xs text-white">
                        {work.category}
                      </div>
                    )}
                    
                    {/* 悬停时显示的标签 */}
                    <motion.div
                      className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5 opacity-0 group-hover:opacity-100"
                      initial={{ opacity: 0, y: 10 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
                    >
                      {work.tags.slice(0, 2).map((tag, ti) => (
                        <motion.span
                          key={ti}
                          className={`px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-xs rounded-full ${theme === 'dark' ? 'bg-white/20' : 'bg-black/60'}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileHover={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: 0.1 + ti * 0.05, ease: "easeOut" }}
                        >
                          {tag}
                        </motion.span>
                      ))}
                    </motion.div>
                  </div>
                  <motion.div 
                    className="p-3"
                    initial={{ y: 0 }}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <motion.h3 
                      className="font-bold text-gray-800 dark:text-white truncate"
                      whileHover={{ color: theme === 'dark' ? '#ffffff' : '#1f2937' }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      {work.title}
                    </motion.h3>
                    <motion.div 
                      className="flex items-center mt-2"
                      initial={{ opacity: 0.8 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <motion.div 
                        className="w-5 h-5 rounded-full overflow-hidden mr-2"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        <TianjinImage
                          src={work.creatorAvatar}
                          alt={work.creator}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
                        {work.creator}
                      </span>
                      <motion.div 
                        className="flex items-center text-xs text-gray-400"
                        whileHover={{ color: '#ef4444' }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        <i className="fas fa-heart mr-1"></i>
                        {work.likes}
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* 分类筛选 */}
        <div className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md py-4 mb-6 border-b border-gray-100 dark:border-gray-800 -mx-4 px-4">
          <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 作品列表 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {selectedCategory === '全部' ? '全部作品' : selectedCategory}
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({filteredWorks.length})
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">排序：</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border-none bg-transparent focus:ring-0 text-gray-600 dark:text-gray-300 cursor-pointer"
              >
                <option value="originalOrder">默认</option>
                <option value="popularity">最热</option>
                <option value="newest">最新</option>
                <option value="mostViewed">浏览最多</option>
              </select>
            </div>
          </div>

          {/* 瀑布流展示 */}
          {filteredWorks.length > 0 ? (
            <MobileWaterfallWorks 
              items={filteredWorks} 
              onClick={handleWorkClick} 
            />
          ) : (
            <div className="py-20 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">未找到相关作品</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                尝试更换关键词或筛选条件
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('全部');
                  setSearchQuery('');
                  setSelectedTags([]);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              >
                清除所有筛选
              </button>
            </div>
          )}
        </div>

        {/* 创作引导 */}
        <div className="my-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">激发你的创作灵感</h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              使用我们强大的AI工具，结合天津传统文化元素，创造出独一无二的设计作品。
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => navigate('/create')}
                className="px-8 py-3 bg-white text-blue-600 rounded-full font-bold hover:bg-blue-50 transition-colors shadow-lg"
              >
                开始创作
              </button>
              <button
                onClick={() => navigate('/community')}
                className="px-8 py-3 bg-blue-700/50 backdrop-blur-sm text-white rounded-full font-bold hover:bg-blue-700/70 transition-colors border border-blue-400/30"
              >
                加入社区
              </button>
            </div>
          </div>
        </div>

        {/* 推荐创作者 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">热门创作者</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate(`/user/${i}`)}
              >
                <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border-2 border-white dark:border-gray-700 shadow-md">
                  <TianjinImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-white text-sm mb-1">设计师{i}号</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {1000 + i * 123} 粉丝
                </p>
                <button className="w-full py-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-medium">
                  关注
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 底部CTA */}
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
          {filteredWorks.length > 0 && (
            [1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2 + i * 0.2 }}
                className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border-l-4 border-blue-500 flex items-center gap-3 max-w-xs cursor-pointer transform hover:scale-105 transition-transform"
                onClick={() => navigate('/create')}
              >
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                  <TianjinImage
                    src={`https://picsum.photos/100/100?random=${i + 100}`}
                    alt="Work"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">有人刚才使用了</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-white truncate">津门纹样生成器</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <i className="fas fa-magic text-xs"></i>
                </div>
              </motion.div>
            ))
          )}
          
          {filteredWorks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 3 }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl shadow-xl cursor-pointer hover:shadow-2xl transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">觉得这些作品很棒？</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    // 关闭提示
                  }}
                  className="text-white/70 hover:text-white"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <p className="text-sm text-blue-100 mb-3">你也可以轻松创作出这样的作品！</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate('/create')}
                  className="flex-1 bg-white text-blue-600 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors"
                >
                  立即尝试
                </button>
                <button 
                  className="px-3 py-1.5 bg-blue-700 text-white rounded-lg text-sm hover:bg-blue-800 transition-colors"
                  onClick={() => {
                    // 应用到创作中心
                    navigate('/create');
                  }}
                >
                  应用到创作中心
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* 底部信息 */}
        <div className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>共找到 {filteredWorks.length} 个作品</p>
          <p className="mt-1">探索更多中国传统品牌创意设计</p>
        </div>
        
        {/* 页脚 */}
        <footer className={`mt-16 border-t ${theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} py-6 px-4`}>
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              © 2025 AI共创平台. 保留所有权利
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="/about" className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors text-sm`}>关于我们</a>
              <a href="/privacy" className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors text-sm`}>隐私政策</a>
              <a href="/terms" className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors text-sm`}>服务条款</a>
              <a href="/help" className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors text-sm`}>帮助中心</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
