// Agent案例状态管理Hook

import { useState, useCallback, useEffect } from 'react';
import { AgentCase, GetCasesParams, CasesTab } from '../types';
import { getAgentCases, getPopularTags } from '../services/agentCaseService';

interface UseAgentCasesReturn {
  cases: AgentCase[];
  loading: boolean;
  hasMore: boolean;
  total: number;
  currentTab: CasesTab;
  sort: 'newest' | 'popular';
  popularTags: string[];
  selectedTag: string | null;
  error: string | null;
  setCurrentTab: (tab: CasesTab) => void;
  setSort: (sort: 'newest' | 'popular') => void;
  setSelectedTag: (tag: string | null) => void;
  loadCases: (reset?: boolean) => Promise<void>;
  loadMore: () => void;
  refresh: () => Promise<void>;
}

export function useAgentCases(): UseAgentCasesReturn {
  const [cases, setCases] = useState<AgentCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [currentTab, setCurrentTab] = useState<CasesTab>('all');
  const [sort, setSort] = useState<'newest' | 'popular'>('newest');
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const LIMIT = 24;

  // 加载案例列表
  const loadCases = useCallback(async (reset = false) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const currentPage = reset ? 1 : page;
      
      const params: GetCasesParams = {
        page: currentPage,
        limit: LIMIT,
        sort,
        tag: selectedTag || undefined,
        source: currentTab === 'all' ? undefined : currentTab,
      };

      const response = await getAgentCases(params);

      if (reset) {
        setCases(response.cases);
      } else {
        setCases(prev => [...prev, ...response.cases]);
      }

      setTotal(response.total);
      setHasMore(response.hasMore);
      
      if (reset) {
        setPage(2);
      } else {
        setPage(prev => prev + 1);
      }
    } catch (err) {
      console.error('加载案例失败:', err);
      setError('加载案例失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [loading, page, sort, selectedTag]);

  // 加载更多
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadCases(false);
    }
  }, [loading, hasMore, loadCases]);

  // 刷新
  const refresh = useCallback(async () => {
    setPage(1);
    await loadCases(true);
  }, [loadCases]);

  // 加载热门标签
  const loadPopularTags = useCallback(async () => {
    try {
      const tags = await getPopularTags(10);
      setPopularTags(tags);
    } catch (err) {
      console.error('加载热门标签失败:', err);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadCases(true);
    loadPopularTags();
  }, []);

  // 筛选条件变化时重新加载
  useEffect(() => {
    setPage(1);
    loadCases(true);
  }, [sort, selectedTag, currentTab]);

  return {
    cases,
    loading,
    hasMore,
    total,
    currentTab,
    sort,
    popularTags,
    selectedTag,
    error,
    setCurrentTab,
    setSort,
    setSelectedTag,
    loadCases,
    loadMore,
    refresh,
  };
}

export default useAgentCases;
