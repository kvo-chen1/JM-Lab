import React, { useCallback, useRef, memo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './SearchBar.css'
import { apiClient } from '@/lib/apiClient'
import { useDebounce } from '@/hooks/useDebounce'
import { Search, X, Loader2 } from 'lucide-react'
import SearchDropdown from './SearchDropdown'

// 搜索结果类型枚举
export const SearchResultType = {
  WORK: 'work',
  USER: 'user',
  CATEGORY: 'category',
  TAG: 'tag',
  PAGE: 'page',
  HISTORY: 'history'
} as const;

export type SearchResultType = typeof SearchResultType[keyof typeof SearchResultType];

// 搜索建议项类型
export interface SearchSuggestion {
  id: string
  text: string
  type: SearchResultType
  icon?: string
  group?: string
  image?: string
  metadata?: {
    count?: number
    trend?: 'up' | 'down' | 'stable'
    timestamp?: string
  }
  onRemove?: () => void
}

// 高级筛选选项
export interface SearchFilters {
  type?: SearchResultType[]
  category?: string[]
  tags?: string[]
  dateRange?: { start: Date | null; end: Date | null }
  sortBy?: 'relevance' | 'latest' | 'popular'
}

interface SearchBarProps {
  search: string
  setSearch: (value: string) => void
  showSuggest: boolean
  setShowSuggest: (value: boolean) => void
  suggestions: SearchSuggestion[]
  isDark: boolean
  onSearch: (query: string, filters?: SearchFilters) => void
  onSuggestionSelect: (suggestion: SearchSuggestion) => void
  filters?: SearchFilters
  onFiltersChange?: (filters: SearchFilters) => void
  userId?: string | null
}

// 搜索历史项
interface SearchHistoryItem {
  id: string
  query: string
  created_at: string
}

// 热门搜索项
interface HotSearchItem {
  id: string
  query: string
  search_count: number
  trend_score: number
  category?: string
}

// 推荐搜索项
interface RecommendedItem {
  id: string
  keyword: string
  category?: string
  image?: string
  weight?: number
}

const SearchBar: React.FC<SearchBarProps> = memo(({
  search,
  setSearch,
  showSuggest,
  setShowSuggest,
  suggestions: propSuggestions,
  isDark,
  onSearch,
  onSuggestionSelect,
  filters = {},
  onFiltersChange,
  userId
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [hotSearches, setHotSearches] = useState<HotSearchItem[]>([]);
  const [recommendedSearches, setRecommendedSearches] = useState<RecommendedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 防抖搜索输入
  const debouncedSearch = useDebounce(search, 300);

  // 加载搜索历史
  const loadSearchHistory = useCallback(async () => {
    // 尝试从 props 或 localStorage 获取 userId
    const effectiveUserId = userId || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null);
    console.log('[SearchBar] loadSearchHistory called, userId from props:', userId, 'effective:', effectiveUserId);
    
    if (!effectiveUserId) {
      console.log('[SearchBar] No userId, skipping search history load');
      return;
    }
    
    try {
      console.log('[SearchBar] Fetching search history for user:', effectiveUserId);
      const response = await apiClient.get('/api/search/history?limit=8');
      console.log('[SearchBar] Search history response:', response);
      if (response.ok && response.data?.success) {
        setSearchHistory(response.data.data.history || []);
        console.log('[SearchBar] Search history loaded:', response.data.data.history);
      } else {
        console.log('[SearchBar] Search history response not ok:', response);
        // 如果 API 返回错误，尝试使用本地存储的搜索历史作为回退
        const localHistory = typeof window !== 'undefined' ? localStorage.getItem('recentSearches') : null;
        if (localHistory) {
          try {
            const parsed = JSON.parse(localHistory);
            const formatted = parsed.map((query: string, index: number) => ({
              id: `local_${index}`,
              query,
              created_at: new Date().toISOString()
            }));
            setSearchHistory(formatted);
            console.log('[SearchBar] Using local search history:', formatted);
          } catch (e) {
            console.error('[SearchBar] Failed to parse local history:', e);
          }
        }
      }
    } catch (err) {
      console.error('[SearchBar] 加载搜索历史失败:', err);
      // 使用本地存储的搜索历史作为回退
      const localHistory = typeof window !== 'undefined' ? localStorage.getItem('recentSearches') : null;
      if (localHistory) {
        try {
          const parsed = JSON.parse(localHistory);
          const formatted = parsed.map((query: string, index: number) => ({
            id: `local_${index}`,
            query,
            created_at: new Date().toISOString()
          }));
          setSearchHistory(formatted);
          console.log('[SearchBar] Using local search history as fallback:', formatted);
        } catch (e) {
          console.error('[SearchBar] Failed to parse local history:', e);
        }
      }
    }
  }, [userId]);

  // 加载热门搜索
  const loadHotSearches = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/search/hot?limit=8');
      if (response.ok && response.data?.success) {
        setHotSearches(response.data.data || []);
      }
    } catch (err) {
      console.error('加载热门搜索失败:', err);
    }
  }, []);

  // 加载推荐搜索
  const loadRecommendedSearches = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/search/suggestions?limit=8');
      if (response.ok && response.data?.success) {
        const items = response.data.data.map((item: any) => ({
          id: item.id,
          keyword: item.keyword,
          category: item.category,
          image: item.image,
          weight: item.weight
        }));
        setRecommendedSearches(items);
      }
    } catch (err) {
      console.error('加载推荐搜索失败:', err);
      // 使用默认推荐数据
      setRecommendedSearches([
        { id: '1', keyword: '国潮设计', category: 'design' },
        { id: '2', keyword: '纹样设计', category: 'design' },
        { id: '3', keyword: '品牌设计', category: 'design' },
        { id: '4', keyword: '非遗传承', category: 'culture' },
        { id: '5', keyword: '插画设计', category: 'design' },
        { id: '6', keyword: '文创产品', category: 'product' },
        { id: '7', keyword: '天津文化', category: 'culture' },
        { id: '8', keyword: 'IP设计', category: 'design' }
      ]);
    }
  }, []);

  // 保存搜索历史
  const saveSearchHistory = useCallback(async (query: string) => {
    if (!userId || !query.trim()) return;

    try {
      await apiClient.post('/api/search/history', {
        query: query.trim(),
        searchType: 'general',
        resultCount: 0
      });
      // 刷新搜索历史
      loadSearchHistory();
    } catch (err) {
      console.error('保存搜索历史失败:', err);
    }
  }, [userId, loadSearchHistory]);

  // 删除搜索历史
  const deleteSearchHistory = useCallback(async (historyId: string) => {
    try {
      await apiClient.delete(`/api/search/history/${historyId}`);
      loadSearchHistory();
    } catch (err) {
      console.error('删除搜索历史失败:', err);
    }
  }, [loadSearchHistory]);

  // 清空搜索历史
  const clearSearchHistory = useCallback(async () => {
    try {
      await apiClient.delete('/api/search/history');
      setSearchHistory([]);
    } catch (err) {
      console.error('清空搜索历史失败:', err);
    }
  }, []);

  // 组件挂载时加载数据
  useEffect(() => {
    if (isFocused) {
      loadSearchHistory();
      loadHotSearches();
      loadRecommendedSearches();
    }
  }, [isFocused, loadSearchHistory, loadHotSearches, loadRecommendedSearches]);

  // 当 userId 变化时重新加载搜索历史
  useEffect(() => {
    if (userId && isFocused) {
      loadSearchHistory();
    }
  }, [userId, isFocused, loadSearchHistory]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    setShowSuggest(true)
  }, [setSearch, setShowSuggest])

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setShowSuggest(true)
  }, [setShowSuggest])

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setTimeout(() => {
      setShowSuggest(false)
    }, 200)
  }, [setShowSuggest])

  const handleClear = useCallback(() => {
    setSearch('');
    inputRef.current?.focus();
  }, [setSearch]);

  const executeSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    
    setShowSuggest(false);
    onSearch(query.trim(), filters);
    saveSearchHistory(query.trim());
    inputRef.current?.blur();
  }, [onSearch, filters, setShowSuggest, saveSearchHistory]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (search.trim()) {
          executeSearch(search);
        }
        break;
      case 'Escape':
        setShowSuggest(false);
        inputRef.current?.blur();
        break;
    }
  }, [search, executeSearch, setShowSuggest]);

  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setSearch(suggestion.text);
    onSuggestionSelect(suggestion);
    saveSearchHistory(suggestion.text);
    // 延迟关闭下拉菜单，确保导航能够正常触发
    setTimeout(() => {
      setShowSuggest(false);
    }, 100);
  }, [setSearch, onSuggestionSelect, saveSearchHistory]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggest(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowSuggest]);

  return (
    <div
      ref={dropdownRef}
      className={`pinterest-search-wrapper ${isDark ? 'dark' : ''}`}
      style={{ position: 'relative', overflow: 'visible' }}
    >
      <div className={`pinterest-search-bar ${isFocused ? 'focused' : ''}`}>
        {/* Search Icon */}
        <div className="search-icon-wrapper">
          {isLoading ? (
            <Loader2 size={18} className="search-icon animate-spin" />
          ) : (
            <Search size={18} className="search-icon" />
          )}
        </div>
        
        {/* Input Field */}
        <input 
          ref={inputRef}
          value={search} 
          onChange={handleSearchChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="搜索" 
          aria-label="搜索"
          autoComplete="off"
        />
        
        {/* Clear Button */}
        <button 
          className={`clear-btn ${search.length > 0 ? 'visible' : ''}`} 
          onClick={handleClear}
          aria-label="清除搜索"
          type="button"
        >
          <X size={14} />
        </button>

        {/* Keyboard Shortcut Hint */}
        {!isFocused && !search && (
          <div className="keyboard-shortcut">
            <kbd>/</kbd>
          </div>
        )}
      </div>
      
      {/* Pinterest Style Search Dropdown */}
      <SearchDropdown
        show={showSuggest}
        isDark={isDark}
        isLoading={isLoading}
        search={search}
        searchHistory={searchHistory}
        hotSearches={hotSearches}
        recommendedSearches={recommendedSearches}
        error={error}
        onSelect={handleSuggestionSelect}
        onClearHistory={clearSearchHistory}
        onRemoveHistoryItem={deleteSearchHistory}
        onRetry={() => {
          setError(null);
          loadSearchHistory();
          loadHotSearches();
          loadRecommendedSearches();
        }}
      />
    </div>
  )
})

export default SearchBar
