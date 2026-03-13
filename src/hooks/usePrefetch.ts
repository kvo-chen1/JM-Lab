import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

interface PrefetchConfig {
  prefetchOnHover?: boolean;
  prefetchOnVisible?: boolean;
  delay?: number;
}

export function usePrefetch(config: PrefetchConfig = {}) {
  const { prefetchOnHover = true, prefetchOnVisible = true, delay = 100 } = config;
  const location = useLocation();
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const visibleObserverRef = useRef<IntersectionObserver | null>(null);
  const prefetchedRoutesRef = useRef<Set<string>>(new Set());

  const prefetchRoute = useCallback((route: string) => {
    if (prefetchedRoutesRef.current.has(route)) {
      return;
    }

    prefetchedRoutesRef.current.add(route);
    
    try {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'script';
      link.href = route;
      document.head.appendChild(link);
      console.log(`[usePrefetch] Prefetched route: ${route}`);
    } catch (error) {
      console.warn(`[usePrefetch] Failed to prefetch route ${route}:`, error);
    }
  }, []);

  const setupHoverPrefetch = useCallback((element: HTMLElement, route: string) => {
    if (!prefetchOnHover) return;

    const handleMouseEnter = () => {
      hoverTimerRef.current = setTimeout(() => {
        prefetchRoute(route);
      }, delay);
    };

    const handleMouseLeave = () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, [prefetchOnHover, delay, prefetchRoute]);

  const setupVisiblePrefetch = useCallback((element: HTMLElement, route: string) => {
    if (!prefetchOnVisible) return;

    if (!visibleObserverRef.current) {
      visibleObserverRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const targetRoute = entry.target.getAttribute('data-prefetch-route');
              if (targetRoute) {
                prefetchRoute(targetRoute);
              }
              visibleObserverRef.current?.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '200px' }
      );
    }

    element.setAttribute('data-prefetch-route', route);
    visibleObserverRef.current.observe(element);

    return () => {
      visibleObserverRef.current?.unobserve(element);
    };
  }, [prefetchOnVisible, prefetchRoute]);

  const prefetchRef = useCallback((element: HTMLElement | null, route: string) => {
    if (!element) return;

    const cleanupHover = setupHoverPrefetch(element, route);
    const cleanupVisible = setupVisiblePrefetch(element, route);

    return () => {
      cleanupHover?.();
      cleanupVisible?.();
    };
  }, [setupHoverPrefetch, setupVisiblePrefetch]);

  // 防抖预加载函数
  const debouncedPrefetch = useMemo(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    return (route: string) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        prefetchRoute(route);
      }, delay);
    };
  }, [prefetchRoute, delay]);

  useEffect(() => {
    prefetchedRoutesRef.current.clear();
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      if (visibleObserverRef.current) {
        visibleObserverRef.current.disconnect();
        visibleObserverRef.current = null;
      }
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  return {
    prefetchRef,
    prefetchRoute,
    debouncedPrefetch,
    isPrefetched: (route: string) => prefetchedRoutesRef.current.has(route)
  };
}

export default usePrefetch;
