/**
 * 津脉广场 - 移动端瀑布流作品展示页面
 * 
 * 功能特性：
 * - 双列瀑布流布局，自适应图片高度
 * - 图片懒加载与渐进式加载动画
 * - 优雅的悬停/触摸交互效果
 * - 响应式设计，完美适配移动端
 * - 高性能渲染，支持无限滚动
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, Share2, MoreHorizontal, Loader2 } from 'lucide-react';
import LazyImage from '../components/LazyImage';
import { useResponsive } from '../utils/responsiveDesign';

// 作品数据类型定义
export interface ArtworkItem {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  aspectRatio: number; // 宽高比 height/width
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  likes: number;
  views: number;
  tags: string[];
  createdAt: string;
  isLiked?: boolean;
  // 视频相关字段
  isVideo?: boolean;
  videoUrl?: string;
}

interface MobileWorksGalleryProps {
  artworks?: ArtworkItem[];
  onLoadMore?: () => Promise<void>;
  onArtworkClick?: (artwork: ArtworkItem) => void;
  onAuthorClick?: (authorId: string) => void;
  onLike?: (artworkId: string) => Promise<void>;
  onShare?: (artwork: ArtworkItem) => void;
  loading?: boolean;
  hasMore?: boolean;
}

// 骨架屏组件 - Pinterest 风格
const SkeletonCard: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
    <div className="relative bg-gray-200 dark:bg-gray-700 animate-pulse" style={{ aspectRatio: '3/4' }}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
    </div>
    <div className="px-2 pt-2 pb-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3 mt-1" />
    </div>
  </div>
);

// 加载更多指示器
const LoadingMore: React.FC = () => (
  <div className="flex items-center justify-center py-6 gap-2 text-gray-500">
    <Loader2 className="w-5 h-5 animate-spin" />
    <span className="text-sm">加载更多精彩作品...</span>
  </div>
);

// 视频播放器组件 - 支持自动播放和视口检测
interface VideoPlayerProps {
  videoUrl: string;
  poster: string;
  isHovered: boolean;
  onLoaded: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, poster, isHovered, onLoaded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInViewport, setIsInViewport] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // 使用 Intersection Observer 检测视频是否在视口内
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInViewport(entry.isIntersecting);
        });
      },
      { threshold: 0.5 } // 50% 可见时触发
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, []);

  // 控制视频播放/暂停
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isLoaded) return;

    if (isInViewport) {
      // 在视口内且加载完成，自动播放
      video.play().catch(() => {
        // 自动播放被阻止，静默处理
      });
    } else {
      // 不在视口内，暂停播放
      video.pause();
    }
  }, [isInViewport, isLoaded]);

  const handleLoadedData = () => {
    setIsLoaded(true);
    onLoaded();
  };

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      poster={poster}
      className={`w-full h-full object-cover transition-all duration-700 ${
        isHovered ? 'scale-110' : 'scale-100'
      }`}
      muted
      loop
      playsInline
      preload="metadata"
      onLoadedData={handleLoadedData}
    />
  );
};

// 单个作品卡片组件
interface ArtworkCardProps {
  artwork: ArtworkItem;
  index: number;
  onClick?: (artwork: ArtworkItem) => void;
  onAuthorClick?: (authorId: string) => void;
  onLike?: (artworkId: string) => Promise<void>;
  onShare?: (artwork: ArtworkItem) => void;
}

const ArtworkCard: React.FC<ArtworkCardProps> = ({
  artwork,
  index,
  onClick,
  onAuthorClick,
  onLike,
  onShare
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(artwork.isLiked || false);
  const [likeCount, setLikeCount] = useState(artwork.likes);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showTouchFeedback, setShowTouchFeedback] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLikeLoading) return;
    
    setIsLikeLoading(true);
    try {
      await onLike?.(artwork.id);
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(artwork);
  };

  const handleTouchStart = () => {
    setShowTouchFeedback(true);
    // 触觉反馈
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleTouchEnd = () => {
    setTimeout(() => setShowTouchFeedback(false), 150);
  };

  // 计算动画延迟，实现错落有致的入场效果
  const animationDelay = (index % 6) * 0.08;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: animationDelay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 break-inside-avoid"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(artwork)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 图片容器 - 使用实际宽高比，让图片更大 */}
      <div 
        className="relative overflow-hidden w-full"
        style={{ 
          aspectRatio: `${1}/${artwork.aspectRatio}`,
          minHeight: '200px'
        }}
      >
        {/* 骨架屏占位 */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        )}
        
        {/* 主图片/视频 - 使用 bare 模式避免额外容器 */}
        {artwork.isVideo && artwork.videoUrl ? (
          // 视频作品：使用 VideoPlayer 组件
          <VideoPlayer
            videoUrl={artwork.videoUrl}
            poster={artwork.imageUrl}
            isHovered={isHovered}
            onLoaded={() => setImageLoaded(true)}
          />
        ) : (
          // 图片作品
          <LazyImage
            src={artwork.imageUrl}
            alt={artwork.title}
            className={`w-full h-full object-cover transition-all duration-700 ${
              isHovered ? 'scale-110' : 'scale-100'
            } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            placeholder="color"
            quality="high"
            bare={true}
          />
        )}

        {/* 渐变遮罩 - 悬停时显示 */}
        <motion.div
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none"
        />

        {/* 悬停信息层 */}
        <motion.div
          initial={false}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            y: isHovered ? 0 : 10
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="absolute inset-0 flex flex-col justify-end p-3 pointer-events-none"
        >
          <h3 className="text-white font-medium text-sm line-clamp-2 mb-2 drop-shadow-lg">
            {artwork.title}
          </h3>
          
          {/* 快捷操作按钮 */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={handleLike}
              disabled={isLikeLoading}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                isLiked 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''} ${isLikeLoading ? 'animate-pulse' : ''}`} />
              <span>{likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}</span>
            </button>
            
            <button
              onClick={handleShare}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition-all duration-200"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>分享</span>
            </button>
          </div>
        </motion.div>

        {/* 标签徽章 */}
        {artwork.tags.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {artwork.tags.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-black/40 backdrop-blur-sm text-white text-[10px] rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 底部信息区 - Pinterest 风格：只显示标题，紧贴图片 */}
      <div className="px-2 py-2">
        <h3 className="text-[13px] font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
          {artwork.title}
        </h3>
      </div>
    </motion.article>
  );
};

// 主组件
const MobileWorksGallery: React.FC<MobileWorksGalleryProps> = ({
  artworks = [],
  onLoadMore,
  onArtworkClick,
  onAuthorClick,
  onLike,
  onShare,
  loading = false,
  hasMore = true
}) => {
  const { width } = useResponsive();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayArtworks, setDisplayArtworks] = useState<ArtworkItem[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 初始化显示数据
  useEffect(() => {
    setDisplayArtworks(artworks);
  }, [artworks]);

  // 无限滚动加载
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !onLoadMore) return;
    
    setIsLoadingMore(true);
    try {
      await onLoadMore();
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, onLoadMore]);

  // 设置 Intersection Observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { rootMargin: '200px' }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [handleLoadMore, hasMore]);

  // 将作品分配到两列，实现瀑布流效果
  const { leftColumn, rightColumn } = useMemo(() => {
    const left: ArtworkItem[] = [];
    const right: ArtworkItem[] = [];
    
    displayArtworks.forEach((artwork, index) => {
      if (index % 2 === 0) {
        left.push(artwork);
      } else {
        right.push(artwork);
      }
    });
    
    return { leftColumn: left, rightColumn: right };
  }, [displayArtworks]);

  // 计算列间距 - Pinterest 风格更紧凑
  const gap = width < 375 ? 8 : 12;
  const padding = width < 375 ? 8 : 12;

  // 初始加载骨架屏数量
  const skeletonCount = 6;

  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden"
      style={{ padding: `${padding}px` }}
    >
      {/* 瀑布流容器 */}
      <div 
        className="flex w-full"
        style={{ gap: `${gap}px` }}
      >
        {/* 左列 */}
        <div className="flex-1 flex flex-col min-w-0" style={{ gap: `${gap}px` }}>
          <AnimatePresence mode="popLayout">
            {loading && displayArtworks.length === 0 ? (
              // 初始加载骨架屏
              Array.from({ length: skeletonCount / 2 }).map((_, i) => (
                <SkeletonCard key={`skeleton-left-${i}`} />
              ))
            ) : (
              leftColumn.map((artwork, index) => (
                <ArtworkCard
                  key={artwork.id}
                  artwork={artwork}
                  index={index * 2}
                  onClick={onArtworkClick}
                  onAuthorClick={onAuthorClick}
                  onLike={onLike}
                  onShare={onShare}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* 右列 */}
        <div className="flex-1 flex flex-col min-w-0" style={{ gap: `${gap}px` }}>
          <AnimatePresence mode="popLayout">
            {loading && displayArtworks.length === 0 ? (
              // 初始加载骨架屏
              Array.from({ length: skeletonCount / 2 }).map((_, i) => (
                <SkeletonCard key={`skeleton-right-${i}`} />
              ))
            ) : (
              rightColumn.map((artwork, index) => (
                <ArtworkCard
                  key={artwork.id}
                  artwork={artwork}
                  index={index * 2 + 1}
                  onClick={onArtworkClick}
                  onAuthorClick={onAuthorClick}
                  onLike={onLike}
                  onShare={onShare}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 加载更多触发器 */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-4">
          {isLoadingMore && <LoadingMore />}
        </div>
      )}

      {/* 无更多数据提示 */}
      {!hasMore && displayArtworks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-gray-400 text-sm"
        >
          已经到底啦，去看看其他精彩作品吧～
        </motion.div>
      )}

      {/* 空状态 */}
      {!loading && displayArtworks.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-gray-400"
        >
          <div className="w-24 h-24 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">暂无作品</p>
          <p className="text-sm">快来发布你的第一个作品吧！</p>
        </motion.div>
      )}
    </div>
  );
};

export default MobileWorksGallery;
