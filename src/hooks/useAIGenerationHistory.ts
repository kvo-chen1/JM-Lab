import { useState, useEffect, useCallback } from 'react';
import { aiGenerationHistoryService } from '@/services/aiGenerationHistoryService';
import {
  AIGenerationHistoryItem,
  AIGenerationHistoryFilter,
  AIGenerationHistorySort,
  AIGenerationHistoryPagination,
} from '@/types/aiGenerationHistory';

interface UseAIGenerationHistoryOptions {
  initialFilter?: AIGenerationHistoryFilter;
  initialSort?: AIGenerationHistorySort;
  initialPagination?: Partial<AIGenerationHistoryPagination>;
  autoFetch?: boolean;
}

interface UseAIGenerationHistoryReturn {
  items: AIGenerationHistoryItem[];
  loading: boolean;
  error: string | null;
  pagination: AIGenerationHistoryPagination;
  stats: {
    total: number;
    byType: { image: number; video: number; text: number };
    byStatus: { pending: number; processing: number; completed: number; failed: number; cancelled: number };
    favorites: number;
  };
  filter: AIGenerationHistoryFilter;
  sort: AIGenerationHistorySort;
  setFilter: (filter: AIGenerationHistoryFilter) => void;
  setSort: (sort: AIGenerationHistorySort) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  refresh: () => Promise<void>;
  create: (params: Parameters<typeof aiGenerationHistoryService.create>[0]) => Promise<{ success: boolean; data?: AIGenerationHistoryItem; error?: string }>;
  update: (id: string, params: Parameters<typeof aiGenerationHistoryService.update>[1]) => Promise<{ success: boolean; data?: AIGenerationHistoryItem; error?: string }>;
  remove: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleFavorite: (id: string) => Promise<{ success: boolean; isFavorite?: boolean; error?: string }>;
  batchOperation: (operation: Parameters<typeof aiGenerationHistoryService.batchOperation>[0]) => Promise<{ success: boolean; affectedCount?: number; error?: string }>;
  exportHistory: (options: Parameters<typeof aiGenerationHistoryService.exportHistory>[0]) => Promise<{ success: boolean; data?: string; filename?: string; error?: string }>;
}

export function useAIGenerationHistory(options: UseAIGenerationHistoryOptions = {}): UseAIGenerationHistoryReturn {
  const {
    initialFilter = {},
    initialSort = { field: 'createdAt', order: 'desc' },
    initialPagination = { page: 1, pageSize: 20 },
    autoFetch = true,
  } = options;

  const [items, setItems] = useState<AIGenerationHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<AIGenerationHistoryPagination>({
    ...initialPagination,
    total: 0,
    totalPages: 0,
  });
  const [filter, setFilter] = useState<AIGenerationHistoryFilter>(initialFilter);
  const [sort, setSort] = useState<AIGenerationHistorySort>(initialSort);
  const [stats, setStats] = useState({
    total: 0,
    byType: { image: 0, video: 0, text: 0 },
    byStatus: { pending: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 },
    favorites: 0,
  });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiGenerationHistoryService.getList(filter, sort, {
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setItems(result.items);
      setPagination(prev => ({ ...prev, ...result.pagination }));
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [filter, sort, pagination.page, pagination.pageSize]);

  const fetchStats = useCallback(async () => {
    const result = await aiGenerationHistoryService.getStats();
    setStats(result);
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchItems();
      fetchStats();
    }
  }, [autoFetch, fetchItems, fetchStats]);

  useEffect(() => {
    const unsubscribe = aiGenerationHistoryService.subscribe(() => {
      fetchItems();
      fetchStats();
    });
    return unsubscribe;
  }, [fetchItems, fetchStats]);

  const setFilterWrapper = useCallback((newFilter: AIGenerationHistoryFilter) => {
    setFilter(newFilter);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const setSortWrapper = useCallback((newSort: AIGenerationHistorySort) => {
    setSort(newSort);
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setPagination(prev => ({ ...prev, page: 1, pageSize }));
  }, []);

  const refresh = useCallback(async () => {
    await fetchItems();
    await fetchStats();
  }, [fetchItems, fetchStats]);

  const create = useCallback(async (params: Parameters<typeof aiGenerationHistoryService.create>[0]) => {
    const result = await aiGenerationHistoryService.create(params);
    if (result.success) {
      await refresh();
    }
    return result;
  }, [refresh]);

  const update = useCallback(async (id: string, params: Parameters<typeof aiGenerationHistoryService.update>[1]) => {
    const result = await aiGenerationHistoryService.update(id, params);
    if (result.success) {
      await refresh();
    }
    return result;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    const result = await aiGenerationHistoryService.delete(id);
    if (result.success) {
      await refresh();
    }
    return result;
  }, [refresh]);

  const toggleFavorite = useCallback(async (id: string) => {
    const result = await aiGenerationHistoryService.toggleFavorite(id);
    if (result.success) {
      await refresh();
    }
    return result;
  }, [refresh]);

  const batchOperation = useCallback(async (operation: Parameters<typeof aiGenerationHistoryService.batchOperation>[0]) => {
    const result = await aiGenerationHistoryService.batchOperation(operation);
    if (result.success) {
      await refresh();
    }
    return result;
  }, [refresh]);

  const exportHistory = useCallback(async (options: Parameters<typeof aiGenerationHistoryService.exportHistory>[0]) => {
    return aiGenerationHistoryService.exportHistory(options);
  }, []);

  return {
    items,
    loading,
    error,
    pagination,
    stats,
    filter,
    sort,
    setFilter: setFilterWrapper,
    setSort: setSortWrapper,
    setPage,
    setPageSize,
    refresh,
    create,
    update,
    remove,
    toggleFavorite,
    batchOperation,
    exportHistory,
  };
}
