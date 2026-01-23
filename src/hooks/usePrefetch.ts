import { useCallback } from 'react';
import { componentPreloader } from '@/utils/performanceOptimization';
import { debounce } from '@/lib/utils';

/**
 * Hook for prefetching resources and components
 * Used to implement "prefetch on hover" strategy
 */
export function usePrefetch() {
  const prefetch = useCallback((id: string) => {
    if (!id) return;
    // Preload component chunk
    componentPreloader.preloadComponents([id]);
  }, []);

  const debouncedPrefetch = useCallback(debounce((id: string) => {
    prefetch(id);
  }, 300), [prefetch]);

  return { prefetch, debouncedPrefetch };
}
