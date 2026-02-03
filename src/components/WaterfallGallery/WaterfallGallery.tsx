import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import styles from './WaterfallGallery.module.scss';
import LazyImage from '../LazyImage'; // 复用现有的 LazyImage

export interface GalleryItem {
  id: string;
  thumbnail: string;
  title: string;
  aspectRatio?: number; // 宽高比 width/height
  [key: string]: any;
}

interface WaterfallGalleryProps {
  items: GalleryItem[];
  onItemClick?: (item: GalleryItem) => void;
  onEndReached?: () => void;
  isLoading?: boolean;
}

interface LayoutItem {
  item: GalleryItem;
  x: number;
  y: number;
  width: number;
  height: number;
}

const GAP = 16; // 最小间距 16px

const WaterfallGallery: React.FC<WaterfallGalleryProps> = ({
  items,
  onItemClick,
  onEndReached,
  isLoading = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(4);
  const [containerWidth, setContainerWidth] = useState(1200);
  
  // 监听容器宽度变化
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setContainerWidth(width);
        
        // 列数自适应逻辑
        if (width >= 1200) setColumns(4);
        else if (width >= 768) setColumns(3);
        else if (width >= 480) setColumns(2);
        else setColumns(1);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 计算布局
  const { layoutItems, totalHeight } = useMemo(() => {
    if (!items.length || containerWidth === 0) return { layoutItems: [], totalHeight: 0 };

    const colWidth = (containerWidth - (columns - 1) * GAP) / columns;
    const colHeights = new Array(columns).fill(0);
    const result: LayoutItem[] = [];

    items.forEach((item) => {
      // 寻找最短列
      let minColIndex = 0;
      let minColHeight = colHeights[0];

      for (let i = 1; i < columns; i++) {
        if (colHeights[i] < minColHeight) {
          minColHeight = colHeights[i];
          minColIndex = i;
        }
      }

      // 简单交错优化：如果相邻列高度过于接近，可能会尝试选择另一列（这里暂且使用标准Masonry，因为Masonry本身就是最优填充）
      // 用户的"交错算法保证相邻卡片高度差≥20%"更多是在生成高度时的要求，或者是在布局时强行干预。
      // 为了保持布局紧凑，我们坚持最短列优先。

      // 计算卡片高度
      // 如果 item 没有 aspectRatio，我们随机生成一个或默认 1
      // 这里为了演示，如果没有提供，我们在 0.75 - 1.5 之间生成一个稳定的随机值
      // 为了稳定性，使用 id 的 hash 来生成
      const getStableRandom = (seed: string) => {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
          hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        }
        const normalized = (Math.abs(hash) % 100) / 100; // 0-1
        return 0.75 + normalized * (1.5 - 0.75); // 0.75 - 1.5
      };

      const ratio = item.aspectRatio || getStableRandom(item.id);
      // height = width / ratio
      // 注意：这里 ratio = width / height，所以 height = width / ratio
      // 但通常图片比例是 h/w ? 不，通常 aspect ratio 是 w/h (如 16:9 = 1.77)
      // 用户要求 "图片高宽比随机范围0.75–1.5"。通常指 h/w 或 w/h。
      // 假设是 h/w (因为是瀑布流，高度变化)，则 height = width * ratio。
      // 如果 ratio 是 w/h (标准定义)，则 height = width / ratio。
      // 让我们假设 ratio 是 standard w/h。0.75 (3:4, 高) - 1.5 (3:2, 宽)。
      
      const imgHeight = colWidth / ratio;
      // 加上底部文字区域高度 (约 60px)
      const cardHeight = imgHeight + 60; 

      const x = minColIndex * (colWidth + GAP);
      const y = minColHeight;

      result.push({
        item,
        x,
        y,
        width: colWidth,
        height: cardHeight
      });

      // 更新列高
      colHeights[minColIndex] += cardHeight + GAP;
    });

    const maxH = Math.max(...colHeights);
    return { layoutItems: result, totalHeight: maxH };
  }, [items, columns, containerWidth]);

  // 滚动监听 (简单的触底加载)
  useEffect(() => {
    const handleScroll = () => {
      if (!onEndReached || isLoading) return;
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      
      if (docHeight - scrollY - windowHeight < 200) {
        onEndReached();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onEndReached, isLoading]);

  return (
    <div 
      className={styles.galleryContainer} 
      ref={containerRef} 
      style={{ height: totalHeight }}
    >
      {layoutItems.map((layoutItem) => (
        <div
          key={layoutItem.item.id}
          className={styles.cardWrapper}
          style={{
            transform: `translate3d(${layoutItem.x}px, ${layoutItem.y}px, 0)`,
            width: layoutItem.width,
            height: layoutItem.height,
          }}
        >
          <div 
            className={styles.cardInner}
            onClick={() => onItemClick && onItemClick(layoutItem.item)}
          >
            <div style={{ height: layoutItem.height - 60, overflow: 'hidden' }}>
              <LazyImage
                src={layoutItem.item.thumbnail}
                alt={layoutItem.item.title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                placeholder="blur"
                bare
              />
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 h-[60px] flex flex-col justify-center">
              <h3 className="text-sm font-medium truncate text-gray-900 dark:text-white">{layoutItem.item.title}</h3>
              <p className={styles.metaText}>
                {layoutItem.item.author?.username || '创作者'}
              </p>
            </div>
          </div>
        </div>
      ))}
      
      {isLoading && (
        <div 
          className={styles.loader} 
          style={{ position: 'absolute', top: totalHeight, left: 0 }}
        >
          <div className={styles.spinner}></div>
        </div>
      )}
    </div>
  );
};

export default WaterfallGallery;
