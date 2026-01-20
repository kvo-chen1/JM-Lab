import * as React from 'react';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns?: number;
  isDark: boolean;
  height?: number | string;
  itemHeight?: number;
  overscan?: number;
}

// 真正的虚拟滚动组件，只渲染可见区域的项目
export default function VirtualList<T>({
  items,
  renderItem,
  columns = 3,
  isDark,
  height = 'auto',
  itemHeight = 250,
  overscan = 5,
}: VirtualListProps<T>) {
  // 使用状态跟踪响应式列数
  const [columnCount, setColumnCount] = React.useState(columns);
  
  // 虚拟滚动相关状态和Refs
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const scrollTopRef = React.useRef(0);
  const [visibleItems, setVisibleItems] = React.useState<{ start: number; end: number }>({ start: 0, end: overscan });
  
  // 响应式列数处理
  React.useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      
      let newColumns = columns;
      if (window.innerWidth < 640) {
        newColumns = 1;
      } else if (window.innerWidth < 768) {
        newColumns = 2;
      } else if (window.innerWidth < 1024) {
        newColumns = 3;
      } else if (window.innerWidth < 1280) {
        newColumns = 4;
      } else {
        newColumns = Math.min(columns, 5);
      }
      
      setColumnCount(newColumns);
    };

    // 初始设置
    handleResize();
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [columns]);
  
  // 计算可见区域的项目
  const calculateVisibleItems = React.useCallback(() => {
    if (!containerRef.current) return;
    
    const containerHeight = containerRef.current.clientHeight;
    const scrollTop = scrollTopRef.current;
    
    // 计算可见区域的起始和结束索引（考虑列数）
    const itemsPerRow = columnCount;
    const rowsPerPage = Math.ceil(containerHeight / itemHeight);
    
    const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endRow = Math.min(Math.ceil(items.length / itemsPerRow), startRow + rowsPerPage + overscan * 2);
    
    const startIndex = startRow * itemsPerRow;
    const endIndex = Math.min(items.length, endRow * itemsPerRow);
    
    setVisibleItems({ start: startIndex, end: endIndex });
  }, [columnCount, items.length, itemHeight, overscan]);
  
  // 处理滚动事件
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    scrollTopRef.current = e.currentTarget.scrollTop;
    calculateVisibleItems();
  }, [calculateVisibleItems]);
  
  // 初始计算可见区域
  React.useEffect(() => {
    calculateVisibleItems();
  }, [calculateVisibleItems, columnCount, items.length]);
  
  // 计算总高度
  const totalHeight = Math.ceil(items.length / columnCount) * itemHeight;
  
  // 获取可见区域的项目
  const visibleItemsArray = items.slice(visibleItems.start, visibleItems.end);
  
  // 计算偏移量
  const offsetY = Math.floor(visibleItems.start / columnCount) * itemHeight;
  
  return (
    <div 
      ref={containerRef}
      className={`${isDark ? 'bg-gray-900' : 'bg-white'} overflow-y-auto`}
      style={{
        height: height,
        scrollbarWidth: 'thin',
        scrollbarColor: isDark ? '#4a5568 #1f2937' : '#d1d5db #f3f4f6',
        WebkitOverflowScrolling: 'touch', // 启用原生触摸滚动优化
        scrollBehavior: 'smooth', // 平滑滚动
      }}
      onScroll={handleScroll}
      data-virtual-list
    >
      {/* 占位元素，用于创建滚动条 */}
      <div 
        ref={contentRef}
        style={{ 
          height: totalHeight,
          position: 'relative'
        }}
      >
        {/* 可见区域的项目 */}
        <div 
          className="grid gap-4 p-2 absolute top-0 left-0 right-0"
          style={{
            gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
            transform: `translateY(${offsetY}px)`,
          }}
        >
          {visibleItemsArray.map((item, index) => (
            <React.Fragment key={visibleItems.start + index}>
              {renderItem(item, visibleItems.start + index)}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* 自定义滚动条样式 - 只影响当前组件 */}
      <style>{`
        /* 滚动条样式 - 只影响当前组件 */
        [data-virtual-list]::-webkit-scrollbar {
          width: 8px;
        }
        [data-virtual-list]::-webkit-scrollbar-track {
          background: ${isDark ? '#1f2937' : '#f3f4f6'};
          border-radius: 4px;
        }
        [data-virtual-list]::-webkit-scrollbar-thumb {
          background: ${isDark ? '#4a5568' : '#d1d5db'};
          border-radius: 4px;
        }
        [data-virtual-list]::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#718096' : '#9ca3af'};
        }
      `}</style>
    </div>
  );
}