/**
 * 数据刷新管理 Hook
 * 提供自动刷新、手动刷新、页面可见性监听等功能
 */
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseDataRefreshOptions {
  /** 自动刷新间隔（毫秒），默认不自动刷新 */
  refreshInterval?: number;
  /** 页面可见时是否自动刷新，默认true */
  refreshOnVisible?: boolean;
  /** 初始是否立即刷新，默认true */
  immediate?: boolean;
}

interface UseDataRefreshReturn<T> {
  /** 当前数据 */
  data: T | null;
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 手动刷新数据 */
  refresh: () => Promise<void>;
  /** 最后刷新时间 */
  lastRefreshTime: Date | null;
}

/**
 * 数据刷新管理 Hook
 * @param fetchFn 数据获取函数
 * @param options 配置选项
 * @returns 数据、加载状态、错误信息和刷新方法
 */
export function useDataRefresh<T>(
  fetchFn: () => Promise<T>,
  options: UseDataRefreshOptions = {}
): UseDataRefreshReturn<T> {
  const {
    refreshInterval,
    refreshOnVisible = true,
    immediate = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // 刷新数据的核心函数
  const refresh = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('[useDataRefresh] 开始刷新数据');
      const result = await fetchFn();
      
      if (isMountedRef.current) {
        setData(result);
        setLastRefreshTime(new Date());
        console.log('[useDataRefresh] 数据刷新成功');
      }
    } catch (err: any) {
      console.error('[useDataRefresh] 数据刷新失败:', err);
      if (isMountedRef.current) {
        setError(err.message || '数据刷新失败');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn]);

  // 初始加载
  useEffect(() => {
    isMountedRef.current = true;
    
    if (immediate) {
      refresh();
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [immediate, refresh]);

  // 自动刷新
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        console.log('[useDataRefresh] 自动刷新触发');
        refresh();
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refreshInterval, refresh]);

  // 页面可见性变化监听
  useEffect(() => {
    if (!refreshOnVisible) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[useDataRefresh] 页面可见，触发刷新');
        refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshOnVisible, refresh]);

  return {
    data,
    loading,
    error,
    refresh,
    lastRefreshTime,
  };
}

/**
 * 购物车数据同步 Hook
 * 专门用于购物车数据的实时同步
 */
export function useCartSync(userId: string | null) {
  const [cartVersion, setCartVersion] = useState(0);

  // 触发购物车更新
  const triggerCartUpdate = useCallback(() => {
    console.log('[useCartSync] 触发购物车更新');
    setCartVersion(v => v + 1);
    // 同时触发全局事件，通知其他组件
    window.dispatchEvent(new CustomEvent('cart:updated'));
  }, []);

  // 监听购物车更新事件
  useEffect(() => {
    const handleCartUpdate = () => {
      console.log('[useCartSync] 收到购物车更新事件');
      setCartVersion(v => v + 1);
    };

    window.addEventListener('cart:updated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cart:updated', handleCartUpdate);
    };
  }, []);

  return {
    cartVersion,
    triggerCartUpdate,
  };
}

/**
 * 收藏数据同步 Hook
 * 专门用于收藏数据的实时同步
 */
export function useFavoritesSync(userId: string | null) {
  const [favoritesVersion, setFavoritesVersion] = useState(0);

  // 触发收藏更新
  const triggerFavoritesUpdate = useCallback(() => {
    console.log('[useFavoritesSync] 触发收藏更新');
    setFavoritesVersion(v => v + 1);
    window.dispatchEvent(new CustomEvent('favorites:updated'));
  }, []);

  // 监听收藏更新事件
  useEffect(() => {
    const handleFavoritesUpdate = () => {
      console.log('[useFavoritesSync] 收到收藏更新事件');
      setFavoritesVersion(v => v + 1);
    };

    window.addEventListener('favorites:updated', handleFavoritesUpdate);
    
    return () => {
      window.removeEventListener('favorites:updated', handleFavoritesUpdate);
    };
  }, []);

  return {
    favoritesVersion,
    triggerFavoritesUpdate,
  };
}

export default useDataRefresh;
