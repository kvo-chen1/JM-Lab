import { useTheme } from '@/hooks/useTheme';
import { CollectionGridProps, ViewMode } from '../types/collection';
import { CollectionCard } from './CollectionCard';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useCallback } from 'react';

export function CollectionGrid({
  items,
  viewMode,
  isLoading,
  hasMore,
  onLoadMore,
  onToggleBookmark,
  onToggleLike,
  activeTab,
}: CollectionGridProps) {
  const { isDark } = useTheme();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 无限滚动
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  // 网格布局类名
  const gridClassName = viewMode === ViewMode.GRID
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
    : 'flex flex-col gap-4';

  return (
    <div className="flex-1 min-w-0">
      {/* 内容网格 */}
      <div className={gridClassName}>
        {items.map((item) => (
          <div key={`${item.type}-${item.id}`}>
            <CollectionCard
              item={item}
              viewMode={viewMode}
              onToggleBookmark={onToggleBookmark}
              onToggleLike={onToggleLike}
              activeTab={activeTab}
            />
          </div>
        ))}
      </div>

      {/* 加载更多触发器 */}
      <div ref={loadMoreRef} className="h-10" />

      {/* 加载状态 */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <p className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            加载中...
          </p>
        </div>
      )}

      {/* 没有更多数据 */}
      {!hasMore && items.length > 0 && !isLoading && (
        <div className="text-center py-8">
          <div className={`w-16 h-px mx-auto mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            已经到底啦
          </p>
        </div>
      )}
    </div>
  );
}
