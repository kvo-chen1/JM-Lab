import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collectionService,
  CollectionItem,
  CollectionType,
  CollectionOptions,
  UserCollectionStats,
  SortOption,
} from '@/services/collectionService';
import { UseCollectionsReturn } from '../types/collection';

interface UseCollectionsProps {
  type: CollectionType | 'all';
  sort: SortOption;
  tab: 'bookmarks' | 'likes';
  limit?: number;
}

export function useCollections({
  type,
  sort,
  tab,
  limit = 20,
}: UseCollectionsProps): UseCollectionsReturn {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);

  // 使用ref来跟踪最新的请求参数，避免竞态条件
  const latestRequestRef = useRef({ type, sort, tab, page: 1 });

  const fetchCollections = useCallback(async (pageNum: number, append: boolean = false) => {
    // 更新最新请求参数
    latestRequestRef.current = { type, sort, tab, page: pageNum };

    setIsLoading(true);
    setError(null);

    try {
      const options: CollectionOptions = {
        type,
        sort,
        page: pageNum,
        limit,
      };

      let result;
      if (tab === 'bookmarks') {
        result = await collectionService.getUserCollections(options);
      } else {
        result = await collectionService.getUserLikes(options);
      }

      // 检查这是否是最新的请求
      const currentRequest = latestRequestRef.current;
      if (
        currentRequest.type !== type ||
        currentRequest.sort !== sort ||
        currentRequest.tab !== tab ||
        currentRequest.page !== pageNum
      ) {
        // 这是一个过期的请求，忽略结果
        return;
      }

      if (append) {
        setItems(prev => [...prev, ...result.items]);
      } else {
        setItems(result.items);
      }

      setTotal(result.total);
      setHasMore(result.hasMore);
      setPage(pageNum);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('获取收藏失败');
      setError(error);
      console.error('获取收藏失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [type, sort, tab, limit]);

  // 初始加载和参数变化时重新获取
  useEffect(() => {
    setPage(1);
    fetchCollections(1, false);
  }, [type, sort, tab, fetchCollections]);

  const refetch = useCallback(async () => {
    await fetchCollections(1, false);
  }, [fetchCollections]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    await fetchCollections(page + 1, true);
  }, [isLoading, hasMore, page, fetchCollections]);

  return {
    items,
    isLoading,
    hasMore,
    total,
    error,
    refetch,
    loadMore,
  };
}

/**
 * 获取用户收藏统计
 */
export function useCollectionStats() {
  const [stats, setStats] = useState<UserCollectionStats>({
    total: 0,
    squareWork: 0,
    communityPost: 0,
    activity: 0,
    template: 0,
    totalLikes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await collectionService.getUserCollectionStats();
      setStats(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('获取统计失败');
      setError(error);
      console.error('获取收藏统计失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refetch };
}
