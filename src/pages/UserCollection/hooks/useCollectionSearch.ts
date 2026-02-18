import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { CollectionItem, CollectionType } from '../types/collection';

/**
 * 搜索历史存储键
 */
const SEARCH_HISTORY_KEY = 'collection_search_history';

/**
 * 最大搜索历史数量
 */
const MAX_HISTORY_ITEMS = 10;

/**
 * 搜索选项
 */
export interface SearchOptions {
  /** 搜索字段 */
  fields: ('title' | 'description' | 'author' | 'tags')[];
  /** 是否区分大小写 */
  caseSensitive?: boolean;
  /** 是否全字匹配 */
  exactMatch?: boolean;
}

/**
 * 搜索结果
 */
export interface SearchResult {
  /** 过滤后的项目 */
  items: CollectionItem[];
  /** 搜索结果数量 */
  count: number;
  /** 是否正在搜索 */
  isSearching: boolean;
  /** 高亮映射 */
  highlights: Map<string, string[]>;
}

/**
 * 使用收藏搜索的 Hook
 */
export function useCollectionSearch(
  items: CollectionItem[],
  options: SearchOptions = { fields: ['title', 'description', 'author', 'tags'] }
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const searchStartTimeRef = useRef<number>(0);

  // 从 localStorage 加载搜索历史
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error);
    }
  }, []);

  // 保存搜索历史到 localStorage
  const saveSearchHistory = useCallback((history: string[]) => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  }, []);

  // 防抖后的搜索词
  const debouncedQuery = useDebounce(searchQuery, 300);

  /**
   * 添加搜索历史
   */
  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;

    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item !== query);
      const newHistory = [query, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      saveSearchHistory(newHistory);
      return newHistory;
    });
  }, [saveSearchHistory]);

  /**
   * 清除搜索历史
   */
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    saveSearchHistory([]);
  }, [saveSearchHistory]);

  /**
   * 从搜索历史中移除某一项
   */
  const removeFromHistory = useCallback((query: string) => {
    setSearchHistory((prev) => {
      const newHistory = prev.filter((item) => item !== query);
      saveSearchHistory(newHistory);
      return newHistory;
    });
  }, [saveSearchHistory]);

  /**
   * 高亮匹配文本
   */
  const highlightText = useCallback((text: string, query: string): string => {
    if (!query.trim()) return text;

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, options.caseSensitive ? 'g' : 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }, [options.caseSensitive]);

  /**
   * 检查项目是否匹配搜索条件
   */
  const matchesSearch = useCallback((item: CollectionItem, query: string): boolean => {
    if (!query.trim()) return true;

    const searchTerm = options.caseSensitive ? query : query.toLowerCase();

    for (const field of options.fields) {
      switch (field) {
        case 'title':
          const title = options.caseSensitive ? item.title : item.title.toLowerCase();
          if (options.exactMatch ? title === searchTerm : title.includes(searchTerm)) {
            return true;
          }
          break;

        case 'description':
          if (item.description) {
            const desc = options.caseSensitive ? item.description : item.description.toLowerCase();
            if (options.exactMatch ? desc === searchTerm : desc.includes(searchTerm)) {
              return true;
            }
          }
          break;

        case 'author':
          if (item.author?.name) {
            const authorName = options.caseSensitive ? item.author.name : item.author.name.toLowerCase();
            if (options.exactMatch ? authorName === searchTerm : authorName.includes(searchTerm)) {
              return true;
            }
          }
          break;

        case 'tags':
          if (item.tags && item.tags.length > 0) {
            const hasMatch = item.tags.some((tag) => {
              const tagLower = options.caseSensitive ? tag : tag.toLowerCase();
              return options.exactMatch ? tagLower === searchTerm : tagLower.includes(searchTerm);
            });
            if (hasMatch) return true;
          }
          break;
      }
    }

    return false;
  }, [options]);

  /**
   * 获取项目的高亮字段
   */
  const getHighlights = useCallback((item: CollectionItem, query: string): string[] => {
    const highlights: string[] = [];
    if (!query.trim()) return highlights;

    for (const field of options.fields) {
      switch (field) {
        case 'title':
          if (item.title.toLowerCase().includes(query.toLowerCase())) {
            highlights.push('title');
          }
          break;
        case 'description':
          if (item.description?.toLowerCase().includes(query.toLowerCase())) {
            highlights.push('description');
          }
          break;
        case 'author':
          if (item.author?.name.toLowerCase().includes(query.toLowerCase())) {
            highlights.push('author');
          }
          break;
        case 'tags':
          if (item.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))) {
            highlights.push('tags');
          }
          break;
      }
    }

    return highlights;
  }, [options.fields]);

  // 使用 ref 来跟踪是否已经为此查询添加了历史记录
  const lastQueryRef = useRef<string>('');

  // 执行搜索
  const searchResult = useMemo<SearchResult>(() => {
    searchStartTimeRef.current = performance.now();

    if (!debouncedQuery.trim()) {
      return {
        items,
        count: items.length,
        isSearching: false,
        highlights: new Map(),
      };
    }

    const filtered = items.filter((item) => matchesSearch(item, debouncedQuery));
    const highlights = new Map<string, string[]>();

    filtered.forEach((item) => {
      const itemHighlights = getHighlights(item, debouncedQuery);
      if (itemHighlights.length > 0) {
        highlights.set(item.id, itemHighlights);
      }
    });

    // 记录搜索耗时
    const duration = performance.now() - searchStartTimeRef.current;
    console.log(`[useCollectionSearch] 搜索完成: "${debouncedQuery}", 结果: ${filtered.length} 项, 耗时: ${duration.toFixed(2)}ms`);

    return {
      items: filtered,
      count: filtered.length,
      isSearching: false,
      highlights,
    };
  }, [items, debouncedQuery, matchesSearch, getHighlights]);

  // 单独使用 useEffect 处理搜索历史记录，避免在 useMemo 中调用 setState
  useEffect(() => {
    if (debouncedQuery.trim() && debouncedQuery !== lastQueryRef.current) {
      if (searchResult.count > 0) {
        addToHistory(debouncedQuery);
        lastQueryRef.current = debouncedQuery;
      }
    }
  }, [debouncedQuery, searchResult.count, addToHistory]);

  /**
   * 设置搜索词
   */
  const setSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  /**
   * 清除搜索
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // 计算是否正在搜索（防抖延迟期间或正在处理）
  const isSearchingState = debouncedQuery !== searchQuery;

  return {
    searchQuery,
    setSearch,
    clearSearch,
    searchResult: {
      ...searchResult,
      isSearching: isSearchingState,
    },
    searchHistory,
    clearHistory,
    removeFromHistory,
    highlightText,
    isSearching: isSearchingState,
  };
}

export default useCollectionSearch;
