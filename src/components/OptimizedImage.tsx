// src/components/OptimizedImage.tsx

import { useState, useEffect, useRef, ImgHTMLAttributes, useCallback } from 'react';
import { resourceOptimizer } from '@/utils/performanceOptimization.tsx';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  priority?: boolean;
  placeholder?: string;
  aspectRatio?: string;
  quality?: number;
  sizes?: string;
  loading?: 'lazy' | 'eager' | 'auto';
  webp?: boolean;
  cache?: boolean;
  blur?: number;
  transitionDuration?: number;
}

// 图片缓存
const imageCache = new Map<string, string>();

const OptimizedImage = ({
  src,
  alt,
  priority = false,
  placeholder,
  aspectRatio,
  quality = 85,
  sizes,
  loading = 'lazy',
  webp = true,
  cache = true,
  blur = 0,
  transitionDuration = 300,
  className,
  onError,
  onLoad,
  ...props
}: OptimizedImageProps) => {
  const [optimizedSrc, setOptimizedSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // 优化图片加载的回调函数
  const optimizeImage = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);

      // 检查缓存
      const cacheKey = `${src}-${quality}-${webp}`;
      if (cache && imageCache.has(cacheKey)) {
        setOptimizedSrc(imageCache.get(cacheKey)!);
        return;
      }

      // 优化图片加载
      const optimized = await resourceOptimizer.optimizeImage(src, {
        quality,
        priority: priority ? 'high' : 'medium',
        webp: webp
      });

      // 缓存结果
      if (cache) {
        imageCache.set(cacheKey, optimized);
      }

      setOptimizedSrc(optimized);
    } catch (error) {
      // 安全处理错误，避免输出大量内存地址信息
      console.error('Image optimization failed:', error instanceof Error ? error.message : String(error));
      setIsError(true);
      setOptimizedSrc(src); // 降级到原始图片
    } finally {
      setIsLoading(false);
    }
  }, [src, quality, priority, webp, cache]);

  useEffect(() => {
    if (src) {
      optimizeImage();
    }
  }, [src, optimizeImage]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsError(true);
    setOptimizedSrc(src); // 降级到原始图片
    if (onError) {
      onError(e);
    }
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoading(false);
    if (onLoad) {
      onLoad(e);
    }
  };

  return (
    <div
      className={className}
      style={{
        aspectRatio,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 占位符 */}
      {isLoading && placeholder && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800"
          style={{
            filter: blur > 0 ? `blur(${blur}px)` : 'none'
          }}
        >
          {placeholder.includes('http') ? (
            <img
              src={placeholder}
              alt="Placeholder"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400 dark:text-gray-500">
              {placeholder}
            </div>
          )}
        </div>
      )}

      {/* 图片 */}
      {optimizedSrc && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          style={{
            transitionDuration: `${transitionDuration}ms`
          }}
          loading={loading}
          fetchPriority={priority ? 'high' : 'auto'}
          sizes={sizes}
          onError={handleError}
          onLoad={handleLoad}
          {...props}
        />
      )}

      {/* 错误状态 */}
      {isError && !optimizedSrc && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800"
        >
          <div className="text-gray-400 dark:text-gray-500">
            <i className="fas fa-image text-2xl"></i>
            <p className="mt-2 text-sm">图片加载失败</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;