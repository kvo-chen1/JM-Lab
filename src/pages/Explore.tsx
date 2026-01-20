import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
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
  const sentinelRef = useRef<HTMLDivElement>(null);
  
  // 搜索建议相关状态
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // 搜索历史记录状态
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [maxHistoryItems, setMaxHistoryItems] = useState(10);
  
  // 分页和无限滚动
  const [page, setPage] = useState(1);
  // 优化分页大小，减少初始加载的图片数量，避免请求拥堵
  const pageSize = 9; // 从18调整为9，减少初始加载的图片数量
  
  // 初始化作品数据 - 直接使用mockWorks，避免多余的localStorage操作
  useEffect(() => {
    setAllWorks(mockWorks);
  }, []);

  // 初始化收藏状态
  useEffect(() => {
    const bookmarkedIds = postsApi.getUserBookmarks();
    const initialBookmarked: Record<string, boolean> = {};
    bookmarkedIds.forEach(id => {
      initialBookmarked[id] = true;
    });
    setBookmarked(initialBookmarked);
  }, []);
  
  // 简化标签处理逻辑，减少计算复杂度
  // 移除复杂的标签计数和排序逻辑
  const popularTags = useMemo(() => {
    // 直接返回固定的热门标签，减少计算复杂度
    return ['老字号品牌', '国潮设计', '非遗传承', 'IP设计', '品牌设计', '插画设计', '工艺创新', '纹样设计', '包装设计', '共创'];
  }, []);
  
  // 简化AI标签推荐，直接返回固定数据
  const aiTagRecommendations = useMemo(() => {
    return {
      hits: ['老字号品牌', '国潮设计', '非遗传承'],
      novel: ['数字非遗', '文化创意', '传统工艺']
    };
  }, []);
  
  // 合并热门标签和所有标签的显示逻辑，减少重复计算
  const filteredTags = useMemo(() => {
    if (!tagQuery) return popularTags;
    const query = tagQuery.toLowerCase();
    return popularTags.filter(tag => tag.toLowerCase().includes(query));
  }, [popularTags, tagQuery]);
  
  // 加载收藏标签
  useEffect(() => {
    try {
      const saved = localStorage.getItem('TOOLS_FAVORITE_TAGS');
      if (saved) {
        setFavoriteTags(JSON.parse(saved));
      }
    } catch (error) {
    }
  }, []);

  // 保存收藏标签
  useEffect(() => {
    try {
      localStorage.setItem('TOOLS_FAVORITE_TAGS', JSON.stringify(favoriteTags));
    } catch (error) {
    }
  }, [favoriteTags]);
  
  // 切换标签收藏 (已优化为handleToggleFavorite)
  // 移动收藏标签顺序 (已优化为handleMoveFavorite)
  
  // 渲染高亮标签（已移至useCallback优化版本）
  
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

  // 使用ref跟踪上一次的核心筛选条件
  const prevCoreFiltersRef = useRef({ 
    category: '全部', 
    search: '', 
    sortBy: 'originalOrder' 
  });

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
  }, [selectedCategory, searchQuery, sortBy, selectedTags]);

  // 监听核心筛选条件变化，重置分页
  useEffect(() => {
    const prev = prevCoreFiltersRef.current;
    const hasCoreFilterChanged = prev.category !== selectedCategory || 
                                 prev.search !== searchQuery || 
                                 prev.sortBy !== sortBy;
    
    // 只有在核心筛选条件变化时才重置分页
    if (hasCoreFilterChanged) {
      setPage(1);
      // 更新ref值
      prevCoreFiltersRef.current = { 
        category: selectedCategory, 
        search: searchQuery, 
        sortBy: sortBy 
      };
    }
  }, [selectedCategory, searchQuery, sortBy]);

  // 获取精选作品：按点赞数降序排序，取前十名
  const featuredWorks = useMemo(() => {
    // 按点赞数降序排序，取前十名
    return [...mockWorks]
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 10);
  }, []);
  
  // 分页作品
  const pagedWorks = useMemo(() => {
    return filteredWorks.slice(0, page * pageSize);
  }, [filteredWorks, page]);

  // 缓存的分类按钮数据
  const categoryButtonsData = useMemo(() => [
    { title: '精选', subtitle: '优选', category: '全部', icon: '✨' },
    { title: '风格', subtitle: '融合', category: '国潮设计', icon: '🎨' },
    { title: '效率', subtitle: '提升', category: '工艺创新', icon: '⚡' },
    { title: '协作', subtitle: '共创', category: 'IP设计', icon: '🤝' }
  ], []);

  // 缓存的推荐分类数据
  const recommendedCategories = useMemo(() => 
    categories.slice(1, 7),
    []
  );

  // 缓存的标签高亮渲染函数
  const renderHighlightedTag = useCallback((tag: string, query: string) => {
    if (!query) return tag;
    const index = tag.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return tag;
    
    return (
      <>
        {tag.substring(0, index)}
        <span className="bg-yellow-200 dark:bg-yellow-600">{tag.substring(index, index + query.length)}</span>
        {tag.substring(index + query.length)}
      </>
    );
  }, []);

  // 处理分类选择
  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category);
    const url = new URL(window.location.href);
    if (category === '全部') {
      url.searchParams.delete('category');
    } else {
      url.searchParams.set('category', category);
    }
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
  
  // 实现无限滚动，优化阈值和根边距，让加载更及时
  useEffect(() => {
    // 添加防抖机制，避免频繁触发加载
    let timeoutId: NodeJS.Timeout;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagedWorks.length < filteredWorks.length) {
          // 使用防抖，避免快速滚动时频繁触发
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            setPage(prev => prev + 1);
          }, 200);
        }
      },
      { 
        threshold: 0.05, // 降低阈值，更灵敏地检测
        rootMargin: '0px 0px 300px 0px' // 增大根边距，提前更多触发加载
      }
    );
    
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    
    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
      clearTimeout(timeoutId);
    };
  }, [pagedWorks.length, filteredWorks.length]);
  
  // 优化：在标签页可见时才执行无限滚动逻辑
  useEffect(() => {
    let isVisible = true;
    
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 处理搜索
  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      saveSearchHistory(searchQuery.trim());
    }
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

  // 处理清空标签
  const handleClearTags = useCallback(() => {
    setSelectedTags([]);
  }, []);

  // 处理清空搜索历史
  const handleClearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('searchHistory');
    } catch (error) {
    }
  }, []);

  // 处理从历史记录中移除单个项目
  const handleRemoveFromHistory = useCallback((query: string) => {
    const updatedHistory = searchHistory.filter(item => item !== query);
    setSearchHistory(updatedHistory);
    try {
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
    }
  }, [searchHistory]);

  // 生成搜索建议
  const generateSuggestions = useCallback(debounce(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchSuggestions([]);
      return;
    }
    
    setIsLoadingSuggestions(true);
    try {
      const suggestions = searchService.generateSuggestions(query);
      setSearchSuggestions(suggestions);
    } catch (error) {
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, 300), []);

  // 监听搜索查询变化，生成搜索建议
  useEffect(() => {
    if (searchQuery && showSearchBar) {
      generateSuggestions(searchQuery);
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, showSearchBar, generateSuggestions]);

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

  // 清除搜索历史记录
  const clearSearchHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('searchHistory');
    } catch (error) {
    }
  };

  // 从搜索历史记录中移除单个项目
  const removeFromHistory = (query: string) => {
    const updatedHistory = searchHistory.filter(item => item !== query);
    setSearchHistory(updatedHistory);
    try {
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
    }
  };

  // 点击外部关闭搜索建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer && !searchContainer.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800">
      {/* 顶部红色框 - 优化版 */}
      <div 
        className="relative overflow-hidden py-6 px-4 sm:py-10 md:py-16 sm:px-8 rounded-3xl mx-2 sm:mx-4 mt-2 sm:mt-4 shadow-2xl max-w-[95vw] mx-auto max-w-9xl group"
        style={{
          backgroundImage: 'url(https://picsum.photos/id/1048/2000/1000)', // 使用picsum提供的可靠图片，ID为1048是中国传统建筑图片
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* 背景遮罩层 - 优化渐变，保证左侧文字可读性 */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-0"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          {/* 标题和副标题 */}
          <div className="text-center md:text-left flex-1">
            <h1 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-white drop-shadow-xl leading-tight tracking-tight mb-3 sm:mb-4"
            >
              探索中国传统品牌<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-200 to-amber-200">新创意</span>
            </h1>
            <p 
              className="text-gray-200 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto md:mx-0 leading-relaxed font-light"
            >
              汇聚全国品牌设计佳作，感受传统美学与现代设计的完美融合
            </p>
          </div>
          
          {/* 标签区 - 玻璃拟态卡片 */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full md:w-auto md:min-w-[350px] lg:min-w-[400px]">
            {categoryButtonsData.map((item, index) => (
              <button
                key={index}
                className="relative overflow-hidden px-4 py-3 sm:px-6 sm:py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-left transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:scale-[1.02] hover:shadow-2xl group/card"
                onClick={() => handleCategorySelect(item.category)}
                aria-label={`查看${item.category}作品`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl filter drop-shadow-lg group-hover/card:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-white tracking-wide">{item.title}</div>
                    <div className="text-xs text-gray-300 font-light mt-0.5 tracking-wider uppercase opacity-80 group-hover/card:opacity-100 transition-opacity">{item.subtitle}</div>
                  </div>
                </div>
                {/* 悬停光效 */}
                <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover/card:animate-shine" />
              </button>
            ))}
            </div>
          </div>
      </div>

      {/* 搜索区 */}
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-between mb-6 sm:mb-8">
          <div className="flex-1 max-w-3xl">
            <div className="relative search-container">
              {showSearchBar ? (
                <div className="flex items-center rounded-3xl shadow-xl overflow-hidden transition-all duration-500 dark:shadow-gray-700/50 hover:shadow-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-850 transform hover:-translate-y-1 sm:shadow-2xl sm:hover:shadow-3xl">
                  {/* 搜索图标 */}
                  <div className="px-3 py-3 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 flex items-center justify-center sm:px-4 sm:py-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 dark:text-red-400 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="搜索作品、设计师或标签..."
                    className="flex-1 px-3 py-3 border-0 bg-white dark:bg-gray-850 text-gray-900 dark:text-white focus:outline-none focus:ring-0 text-sm font-medium placeholder-gray-400 dark:placeholder-gray-500 sm:px-4 sm:py-3 sm:text-base"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onKeyPress={handleSearchKeyPress}
                  />
                  
                  {/* 搜索按钮 */}
                  <button
                    onClick={handleSearch}
                    className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white px-3 py-3 rounded-r-3xl flex items-center gap-2 font-semibold transition-all duration-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 sm:px-6 sm:py-3 sm:gap-2 sm:shadow-xl sm:hover:shadow-2xl"
                  >
                    {isSearching ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin sm:w-5 sm:h-5"></div>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-xs sm:text-sm">搜索</span>
                      </>
                    )}
                  </button>
                  
                  {/* 清除按钮 */}
                  <button
                    onClick={handleClearSearchBar}
                    className="mr-2 bg-white dark:bg-gray-850 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-full shadow-md transition-all duration-300 transform hover:scale-110 hover:shadow-lg sm:mr-3 sm:p-2 sm:shadow-lg sm:hover:shadow-xl"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-300 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSearchBar(true)}
                  className="w-full flex items-center justify-between px-5 py-3 bg-gradient-to-r from-white to-gray-50 dark:from-gray-850 dark:to-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 border-2 border-red-100 dark:border-red-900/30 hover:border-red-200 dark:hover:border-red-800/50 sm:px-6 sm:py-4"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-gray-500 dark:text-gray-400 font-semibold text-base sm:text-lg">搜索作品、设计师或标签...</span>
                  </div>
                  <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 sm:p-3.5 sm:shadow-xl sm:hover:shadow-2xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </button>
              )}
              
              {/* 搜索建议下拉菜单 */}
              {showSuggestions && ((searchSuggestions.length > 0 || isLoadingSuggestions) || searchHistory.length > 0) && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-850 rounded-3xl shadow-3xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                >
                  {/* 搜索历史记录 */}
                  {searchHistory.length > 0 && !searchQuery && (
                    <div>
                      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <span className="text-red-600 dark:text-red-400">🕒</span>
                          搜索历史
                        </h4>
                        <button
                          onClick={handleClearSearchHistory}
                          className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          清除
                        </button>
                      </div>
                      <ul>
                        {searchHistory.map((item, index) => (
                          <li key={index}>
                            <button
                              onClick={() => {
                                setSearchQuery(item);
                                setShowSuggestions(false);
                                handleSearch();
                              }}
                              className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 group"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-red-600 dark:text-red-400">🔍</span>
                                <span className="font-medium text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                  {item}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFromHistory(item);
                                }}
                                className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* 搜索建议 */}
                  {isLoadingSuggestions ? (
                    <div className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-500 dark:text-gray-400">加载搜索建议...</span>
                      </div>
                    </div>
                  ) : searchSuggestions.length > 0 ? (
                    <div>
                      {searchHistory.length > 0 && !searchQuery && (
                        <div className="border-b border-gray-200 dark:border-gray-700"></div>
                      )}
                      <ul className="max-h-96 overflow-y-auto">
                        {searchSuggestions.map((suggestion, index) => (
                          <li key={index}>
                            <button
                              onClick={() => {
                                setSearchQuery(suggestion.text);
                                setShowSuggestions(false);
                                handleSearch();
                              }}
                              className="w-full text-left px-6 py-4 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 group"
                            >
                              <div className="text-red-600 dark:text-red-400 text-lg">
                                {suggestion.type === SearchResultType.WORK && '🎨'}
                                {suggestion.type === SearchResultType.USER && '👤'}
                                {suggestion.type === SearchResultType.TAG && '🏷️'}
                                {suggestion.type === SearchResultType.CATEGORY && '📁'}
                                {suggestion.type === SearchResultType.PAGE && '📄'}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                  {suggestion.text}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {suggestion.type === SearchResultType.WORK && '作品'}
                                  {suggestion.type === SearchResultType.USER && '设计师'}
                                  {suggestion.type === SearchResultType.TAG && '标签'}
                                  {suggestion.type === SearchResultType.CATEGORY && '分类'}
                                  {suggestion.type === SearchResultType.PAGE && '页面'}
                                </div>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : !isLoadingSuggestions && searchQuery ? (
                    <div className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      未找到相关搜索建议
                    </div>
                  ) : null}
                </motion.div>
              )}
            </div>
          </div>
          
          {/* 排序选项 */}
          <div className="flex items-center gap-3 bg-white dark:bg-gray-850 p-3 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">排序:</span>
              <div className="relative">
                <select
                  className="appearance-none px-5 py-3 bg-gradient-to-r from-white to-gray-50 dark:from-gray-850 dark:to-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="originalOrder">原始顺序</option>
                  <option value="popularity">热门作品</option>
                  <option value="newest">最新发布</option>
                  <option value="mostViewed">最多浏览</option>
                  <option value="mostCommented">最多评论</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI相关搜索推荐 */}
        {relatedSearches.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">AI推荐搜索</h3>
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
                <div
                key={work.id}
                className="flex-shrink-0 w-full sm:w-80 md:w-96 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md dark:shadow-gray-700 hover:shadow-lg dark:hover:shadow-gray-600 transition-all cursor-pointer"
                onClick={() => navigate(`/explore/${work.id}`)}
              >
                  <div className="relative">
                    {work.videoUrl ? (
                      <div className="relative">
                        <TianjinImage
                          src={work.thumbnail}
                          alt={work.title}
                          className="w-full h-48 object-cover"
                          ratio="landscape"
                          imageTag={work.imageTag}
                          priority={index < 6} /* 提高精选作品的优先级 */
                          quality={index < 12 ? 'high' : 'medium'}
                          loading="lazy"
                          disableFallback={true}
                        />
                        {/* 视频播放按钮 */}
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <TianjinImage
                        src={work.thumbnail}
                        alt={work.title}
                        className="w-full h-48 object-cover"
                        ratio="landscape"
                        imageTag={work.imageTag}
                        priority={index < 6} /* 提高精选作品的优先级 */
                        quality={index < 12 ? 'high' : 'medium'}
                        loading="lazy"
                        disableFallback={false}
                      />
                    )}
                    
                    {/* 创作者信息悬浮 */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black bg-opacity-70 to-transparent p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                          <TianjinImage
                          src={work.creatorAvatar}
                          alt={work.creator}
                          className="w-full h-full object-cover"
                          disableFallback={false}
                        />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{work.creator}</p>
                          <p className="text-white text-xs opacity-90">{work.category}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 line-clamp-1">{work.title}</h3>
                    
                    {/* 标签 */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {work.tags.slice(0, 3).map((tag: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {/* 统计信息 */}
                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{work.likes + (liked[work.id] ? 1 : 0)}</span>
                    </div>
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{work.comments}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{work.views}</span>
                      </div>
                    </div>
                  </div>
                </div>
                ))}
              </div>
          </div>
        </div>

        {/* 分类筛选 */}
        <div className="mb-6 sm:mb-8 overflow-x-auto">
          <div className="flex gap-2 sm:gap-3 min-w-max pb-1 sm:pb-2">
            {categories.map((category) => (
              <motion.button
                key={category}
                onClick={() => handleCategorySelect(category)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full whitespace-nowrap transition-all duration-300 text-sm sm:text-base font-medium ${selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-lg dark:shadow-blue-900/50'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'}`}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 热门分类 */}
        <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4">热门分类</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
              {['国潮', '非遗', '极简', '赛博朋克', '3D艺术', '插画', 'UI设计'].map((category) => (
                <motion.button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 py-2 sm:px-4 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md hover:shadow-xl ${theme === 'dark'
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
                    : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200'}`}
                >
                  <span className="text-red-600 mr-1.5">#</span>
                  {category}
                </motion.button>
              ))}
            </div>
          </div>
        
        {/* 标签筛选按钮 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">标签筛选</h3>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTagsOpen(!tagsOpen)}
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              {tagsOpen ? '收起标签' : '展开标签'}
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${tagsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.button>
          </div>
          
          {/* 已选择标签 */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              {selectedTags.map((tag) => (
                <div key={tag} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs sm:text-sm">
                  <span>{tag}</span>
                  <button
                    onClick={() => handleTagSelect(tag)}
                    className="text-blue-800 dark:text-blue-200 hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* 标签筛选面板 */}
          {tagsOpen && (
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-gray-700 p-3 sm:p-4 border border-gray-300 dark:border-gray-700"
              ref={tagsContainerRef}
            >
              {/* 标签搜索 */}
              <div className="mb-3 sm:mb-4">
                <input
                  type="text"
                  placeholder="搜索标签..."
                  value={tagQuery}
                  onChange={(e) => setTagQuery(e.target.value)}
                  className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              
              {/* 收藏标签 */}
              {favoriteTags.length > 0 && (
                <div className="mb-3 sm:mb-4">
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">收藏的标签</h4>
                    <button onClick={() => setFavoriteTags([])} className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors">
                      清空收藏
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {favoriteTags.map((tag) => (
                      <div key={tag} className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleTagSelect(tag)}
                          className={`px-2.5 py-1 rounded-full text-xs sm:text-sm transition-colors ${
                            selectedTags.includes(tag)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {tag}
                        </button>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleMoveFavorite(tag, -1)} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">▲</button>
                          <button onClick={() => handleMoveFavorite(tag, 1)} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">▼</button>
                          <button onClick={() => handleToggleFavorite(tag)} className="text-xs text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400">
                            <i className="fas fa-star"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 热门标签 */}
              <div className="mb-3 sm:mb-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">热门标签</h4>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {filteredTags.map(tag => (
                    <div key={`pop-${tag}`} className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleTagSelect(tag)}
                        className={`px-2.5 py-1 rounded-full text-xs sm:text-sm transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {renderHighlightedTag(tag, tagQuery)}
                      </button>
                      <button onClick={() => handleToggleFavorite(tag)} className="text-xs text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400">
                        <i className="far fa-star"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* AI标签推荐 */}
              {(aiTagRecommendations.hits.length > 0 || aiTagRecommendations.novel.length > 0) && (
                <div className="mb-3 sm:mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">AI标签推荐</h4>
                  {aiTagRecommendations.hits.length > 0 && (
                    <div className="mb-1.5 sm:mb-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">命中已有标签</div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {aiTagRecommendations.hits.map(tag => (
                          <button key={`ai-hit-${tag}`} onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev : [...prev, tag])} className={`px-2.5 py-1 rounded-full text-xs sm:text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition-colors`}>
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiTagRecommendations.novel.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">推荐新标签</div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {aiTagRecommendations.novel.map(tag => (
                          <button key={`ai-novel-${tag}`} onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev : [...prev, tag])} className={`px-2.5 py-1 rounded-full text-xs sm:text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors`}>
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* 所有标签 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">所有标签</h4>
                <div className="max-h-48 overflow-y-auto pr-2">
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {filteredTags.map(tag => (
                    <div key={`all-${tag}`} className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleTagSelect(tag)}
                        className={`px-2.5 py-1 rounded-full text-xs sm:text-sm transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {renderHighlightedTag(tag, tagQuery)}
                      </button>
                      <button onClick={() => handleToggleFavorite(tag)} className="text-xs text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400">
                        <i className="far fa-star"></i>
                      </button>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-3 sm:mt-4">
                <button
                  onClick={handleClearTags}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs sm:text-sm"
                >
                  清空
                </button>
                <button
                  onClick={() => setTagsOpen(false)}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium"
                >
                  完成
                </button>
              </div>
              </div>
            )}
          </div>

        {/* 作品网格 */}
        <div id="works-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {isLoading ? (
            // 加载状态
            Array.from({ length: 12 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md dark:shadow-gray-700 animate-pulse"
              >
                <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                  </div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-3"></div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded-full w-12"></div>
                    <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded-full w-16"></div>
                    <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded-full w-14"></div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-10"></div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-10"></div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-10"></div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded-full w-16"></div>
                    <div className="h-7 bg-gray-300 dark:bg-gray-600 rounded-lg w-24"></div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : pagedWorks.length === 0 ? (
            // 无结果状态
            <div className="col-span-full text-center py-20 bg-white dark:bg-gray-850 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-red-500 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">未找到相关作品</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                尝试调整搜索关键词，或浏览推荐分类和热门作品，发现更多精彩内容
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    setSelectedCategory('全部');
                    setSearchQuery('');
                    navigate('/explore', { replace: true });
                  }}
                  className="px-8 py-3 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                >
                  浏览全部作品
                </button>
                <button
                  onClick={() => setShowSearchBar(true)}
                  className="px-8 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg"
                >
                  重新搜索
                </button>
              </div>
              
              {/* 推荐分类 */}
          <div className="mt-12 max-w-md mx-auto">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">推荐分类</h4>
            <div className="flex flex-wrap gap-3 justify-center">
              {recommendedCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    handleCategorySelect(category);
                    setSearchQuery('');
                    navigate('/explore', { replace: true });
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors border border-gray-200 dark:border-gray-600"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
            </div>
          ) : (
            // 作品列表
            pagedWorks.map((work, index) => (
              <motion.div
                key={work.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02, duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md dark:shadow-gray-700 hover:shadow-xl dark:hover:shadow-gray-500 transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/explore/${work.id}`)}
              >
                <div className="relative group">
                  {/* 作品缩略图 */}
                  {work.videoUrl ? (
                    // 视频作品
                    <div className="relative">
                      <TianjinImage
                        src={work.thumbnail}
                        alt={work.title}
                        className="w-full h-48 object-cover"
                        ratio="landscape"
                        imageTag={work.imageTag}
                        priority={index < 6} /* 为视频缩略图添加优先级 */
                        disableFallback={false}
                      />
                      {/* 视频播放按钮 */}
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      {/* 视频时长 */}
                      {work.duration && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {work.duration}
                        </div>
                      )}
                    </div>
                  ) : (
                    // 图片作品
                    <TianjinImage
                      src={work.thumbnail}
                      alt={work.title}
                      className="w-full h-48 object-cover"
                      ratio="landscape"
                      imageTag={work.imageTag}
                      priority={index < 6} /* 增加优先加载的图片数量 */
                      quality={index < 12 ? 'high' : 'medium'} /* 优化质量设置 */
                      loading="lazy"
                      disableFallback={false}
                    />
                  )}
                  
                  {/* 联名徽章 */}
                  {work.tags.includes('联名') && (
                    <div className="absolute top-3 left-3">
                      <span className={`text-xs px-2 py-1 rounded-full backdrop-blur ${work.category === '老字号品牌' ? 'bg-amber-600/80 ring-1 ring-amber-500/50 text-white' : 'bg-blue-600/80 ring-1 ring-blue-500/50 text-white'}`}>
                        联名
                      </span>
                    </div>
                  )}
                  
                  {/* 悬停时显示的操作按钮 */}
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); setLiked(prev => ({ ...prev, [work.id]: !prev[work.id] })); }}
                        className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors shadow-md hover:shadow-lg"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-all duration-300 ${liked[work.id] ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          const stringId = work.id.toString();
                          setBookmarked(prev => { 
                            const isBookmarked = prev[stringId] || false;
                            const newState: Record<string, boolean> = { ...prev, [stringId]: !isBookmarked }; 
                            if (newState[stringId]) {
                              postsApi.bookmarkPost(stringId);
                            } else {
                              postsApi.unbookmarkPost(stringId);
                            }
                            return newState; 
                          }); 
                        }}
                        className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors shadow-md hover:shadow-lg"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-all duration-300 ${bookmarked[work.id.toString()] ? 'fill-blue-500 text-blue-500 scale-110' : 'text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          // 分享功能实现
                          const shareUrl = `${window.location.origin}/explore/${work.id}`;
                          navigator.clipboard.writeText(shareUrl)
                            .then(() => {
                              toast.success('分享链接已复制到剪贴板');
                            })
                            .catch(() => {
                              toast.error('复制链接失败，请手动复制');
                            });
                        }}
                        className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors shadow-md hover:shadow-lg"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </motion.button>
                    </div>
                </div>

                {/* 作品信息 */}
                <div className="p-4">
                  {/* 创作者信息 */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <TianjinImage
                          src={work.creatorAvatar}
                          alt={work.creator}
                          className="w-full h-full object-cover"
                          ratio="square"
                          disableFallback={true}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{work.creator}</p>
                    </div>
                  </div>

                  {/* 作品标题 */}
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 line-clamp-2">{work.title}</h3>

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {work.tags.slice(0, 3).map((tag: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                    {work.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs">
                        +{work.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* 统计信息 */}
                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{work.likes + (liked[work.id] ? 1 : 0)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{work.comments}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{work.views}</span>
                    </div>
                  </div>

                  {/* 作品分类标签 */}
                  <div className="mt-3 flex justify-between items-center">
                    <span className={`text-sm px-2 py-0.5 rounded-full ${work.category === '老字号品牌' ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {work.category}
                    </span>
                    <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); navigate(`/explore/${work.id}`); }}
                    className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
                    aria-label={`查看作品 ${work.title} 的详情`}
                  >
                    查看详情
                  </motion.button>
                  </div>

                  {/* 应用到创作中心按钮 */}
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      const prompt = `${work.title} · ${work.category} · ${work.tags.join(' / ')}`;
                      navigate(`/create?from=explore&prompt=${encodeURIComponent(prompt)}`);
                    }}
                    className="w-full mt-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    应用到创作中心
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* 底部信息 */}
        <div className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>共找到 {filteredWorks.length} 个作品</p>
          <p className="mt-1">探索更多中国传统品牌创意设计</p>
        </div>
        
        {/* 无限滚动哨兵 */}
        <div className="text-center mt-10">
          {page * pageSize < filteredWorks.length ? (
            <div ref={sentinelRef} className="h-10">
              <div className="animate-pulse text-gray-500 dark:text-gray-400">加载更多...</div>
            </div>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">已加载全部</span>
          )}
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

