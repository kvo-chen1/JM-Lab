import { useCallback } from 'react';
import { componentPreloader } from '@/utils/performanceOptimization';
import { debounce } from '@/lib/utils';

export interface PrefetchOptions {
  includeData?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

const routeDataFetchers: Record<string, () => Promise<any>> = {};

export function registerRouteDataFetcher(route: string, fetcher: () => Promise<any>) {
  routeDataFetchers[route] = fetcher;
}

export function usePrefetch() {
  const prefetch = useCallback((id: string, options?: PrefetchOptions) => {
    if (!id) return;
    
    if (options?.includeData && routeDataFetchers[id]) {
      routeDataFetchers[id]().catch(() => {});
    }
    
    componentPreloader.preloadComponents([id]);
  }, []);

  const debouncedPrefetch = useCallback(debounce((id: string, options?: PrefetchOptions) => {
    prefetch(id, options);
  }, 300), [prefetch]);

  const prefetchRoute = useCallback((route: string) => {
    const routeKey = route.replace(/^\//, '');
    if (routeDataFetchers[routeKey]) {
      routeDataFetchers[routeKey]().catch(() => {});
    }
    componentPreloader.preloadComponents([routeKey]).catch(() => {});
  }, []);

  return { prefetch, debouncedPrefetch, prefetchRoute, registerRouteDataFetcher };
}
