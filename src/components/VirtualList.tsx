import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight: number;
  overscan?: number;
  className?: string;
  onScrollEnd?: () => void;
  emptyComponent?: ReactNode;
  loadingComponent?: ReactNode;
  isLoading?: boolean;
}

/**
 * 虚拟滚动列表组件
 * 用于优化长列表渲染性能
 */
export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  overscan = 5,
  className = '',
  onScrollEnd,
  emptyComponent,
  loadingComponent,
  isLoading = false
}: VirtualListProps<T>) {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // 计算可见区域
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  const visibleItems = items.slice(startIndex, endIndex);

  // 监听容器大小变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    setContainerHeight(container.clientHeight);

    return () => resizeObserver.disconnect();
  }, []);

  // 处理滚动
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);

    // 检测是否滚动到底部
    if (onScrollEnd) {
      const { scrollTop, scrollHeight, clientHeight } = target;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        onScrollEnd();
      }
    }
  }, [onScrollEnd]);

  // 空状态
  if (items.length === 0 && !isLoading) {
    return (
      <div
        ref={containerRef}
        className={`
          overflow-auto
          ${isDark ? 'bg-slate-900' : 'bg-white'}
          ${className}
        `}
      >
        {emptyComponent || (
          <div className="flex items-center justify-center h-40 text-gray-500">
            暂无数据
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`
        overflow-auto relative
        ${isDark ? 'bg-slate-900' : 'bg-white'}
        ${className}
      `}
      style={{ willChange: 'transform' }}
    >
      {/* 占位容器 */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* 可见项目 */}
        {visibleItems.map((item, index) => {
          const actualIndex = startIndex + index;
          const top = actualIndex * itemHeight;

          return (
            <div
              key={actualIndex}
              className="absolute left-0 right-0"
              style={{
                top,
                height: itemHeight,
                willChange: 'transform'
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>

      {/* 加载更多指示器 */}
      {isLoading && loadingComponent}
    </div>
  );
}

/**
 * 虚拟网格组件
 * 用于优化网格布局的长列表
 */
interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  columnCount: number;
  itemHeight: number;
  gap?: number;
  overscan?: number;
  className?: string;
  onScrollEnd?: () => void;
}

export function VirtualGrid<T>({
  items,
  renderItem,
  columnCount,
  itemHeight,
  gap = 16,
  overscan = 2,
  className = '',
  onScrollEnd
}: VirtualGridProps<T>) {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const rowCount = Math.ceil(items.length / columnCount);
  const totalHeight = rowCount * itemHeight + (rowCount - 1) * gap;

  const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
  const visibleRowCount = Math.ceil(containerHeight / (itemHeight + gap)) + overscan * 2;
  const endRow = Math.min(rowCount, startRow + visibleRowCount);

  // 监听容器大小
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    setContainerHeight(container.clientHeight);

    return () => resizeObserver.disconnect();
  }, []);

  // 处理滚动
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);

    if (onScrollEnd) {
      const { scrollTop, scrollHeight, clientHeight } = target;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        onScrollEnd();
      }
    }
  }, [onScrollEnd]);

  // 生成可见项目
  const visibleItems: Array<{ item: T; index: number; row: number; col: number }> = [];
  for (let row = startRow; row < endRow; row++) {
    for (let col = 0; col < columnCount; col++) {
      const index = row * columnCount + col;
      if (index < items.length) {
        visibleItems.push({ item: items[index], index, row, col });
      }
    }
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`
        overflow-auto
        ${isDark ? 'bg-slate-900' : 'bg-white'}
        ${className}
      `}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          className="grid absolute inset-x-0"
          style={{
            gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
            gap,
            top: startRow * (itemHeight + gap)
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 动态高度虚拟列表
 * 用于项目高度不固定的场景
 */
interface DynamicVirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number, style: React.CSSProperties) => ReactNode;
  estimateItemHeight: (item: T, index: number) => number;
  overscan?: number;
  className?: string;
  onScrollEnd?: () => void;
}

export function DynamicVirtualList<T>({
  items,
  renderItem,
  estimateItemHeight,
  overscan = 5,
  className = '',
  onScrollEnd
}: DynamicVirtualListProps<T>) {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const itemPositionsRef = useRef<Array<{ top: number; height: number }>>([]);

  // 计算项目位置
  const calculatePositions = useCallback(() => {
    const positions: Array<{ top: number; height: number }> = [];
    let currentTop = 0;

    items.forEach((item, index) => {
      const height = estimateItemHeight(item, index);
      positions.push({ top: currentTop, height });
      currentTop += height;
    });

    itemPositionsRef.current = positions;
    return currentTop;
  }, [items, estimateItemHeight]);

  const totalHeight = calculatePositions();

  // 计算可见范围
  const positions = itemPositionsRef.current;
  let startIndex = 0;
  for (let i = 0; i < positions.length; i++) {
    if (positions[i].top + positions[i].height > scrollTop) {
      startIndex = Math.max(0, i - overscan);
      break;
    }
  }

  let endIndex = positions.length;
  for (let i = startIndex; i < positions.length; i++) {
    if (positions[i].top > scrollTop + containerHeight) {
      endIndex = Math.min(positions.length, i + overscan);
      break;
    }
  }

  // 监听容器大小
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    setContainerHeight(container.clientHeight);

    return () => resizeObserver.disconnect();
  }, []);

  // 处理滚动
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);

    if (onScrollEnd) {
      const { scrollTop, scrollHeight, clientHeight } = target;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        onScrollEnd();
      }
    }
  }, [onScrollEnd]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`
        overflow-auto
        ${isDark ? 'bg-slate-900' : 'bg-white'}
        ${className}
      `}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {positions.slice(startIndex, endIndex).map((position, idx) => {
          const actualIndex = startIndex + idx;
          return (
            <div
              key={actualIndex}
              className="absolute left-0 right-0"
              style={{
                top: position.top,
                minHeight: position.height
              }}
            >
              {renderItem(items[actualIndex], actualIndex, {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VirtualList;
