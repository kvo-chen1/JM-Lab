import { useState, useEffect, useRef, ImgHTMLAttributes, useCallback, useMemo } from 'react';
import { imageOptimizer, type OptimizedImageResult } from '@/utils/imageOptimization';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  src: string;
  alt: string;
  priority?: boolean;
  placeholder?: string;
  aspectRatio?: string;
  quality?: number;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  webp?: boolean;
  avif?: boolean;
  cache?: boolean;
  blur?: number;
  transitionDuration?: number;
  responsiveSizes?: number[];
  fetchPriority?: 'high' | 'low' | 'auto';
  blurDataURL?: string;
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
  avif = true,
  cache = true,
  blur = 0,
  transitionDuration = 300,
  className,
  onError,
  onLoad,
  responsiveSizes = [320, 640, 1024, 1600],
  fetchPriority = 'auto',
  blurDataURL,
  ...props
}: OptimizedImageProps) => {
  const [optimizedResult, setOptimizedResult] = useState<OptimizedImageResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const formats = useMemo(() => {
    const f: string[] = [];
    if (avif) f.push('avif');
    if (webp) f.push('webp');
    f.push('jpg');
    return f;
  }, [avif, webp]);

  const optimizeImage = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);

      const cacheKey = `${src}_${quality}_${formats.join('_')}_${responsiveSizes.join('_')}`;
      
      const result = await imageOptimizer.optimizeImage(src, alt, {
        formats,
        sizes: responsiveSizes,
        quality,
        lazy: loading === 'lazy',
        preload: priority,
        responsive: true,
        priority: priority ? 'high' : 'medium',
        placeholder: blurDataURL ? 'blur' : 'none',
        blurDataURL,
        aspectRatio: aspectRatio ? parseFloat(aspectRatio) : undefined
      });

      setOptimizedResult(result);
    } catch (error) {
      console.error('Image optimization failed:', error instanceof Error ? error.message : String(error));
      setIsError(true);
      setOptimizedResult({
        src,
        alt,
        loading: loading as 'lazy' | 'eager'
      });
    } finally {
      setIsLoading(false);
    }
  }, [src, alt, quality, formats, responsiveSizes, loading, priority, blurDataURL, aspectRatio]);

  useEffect(() => {
    if (src) {
      optimizeImage();
    }
  }, [src, optimizeImage]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsError(true);
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
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800"
        >
          {blurDataURL ? (
            <img
              src={blurDataURL}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: 'blur(20px)', transform: 'scale(1.1)' }}
            />
          ) : placeholder ? (
              placeholder.includes('http') ? (
                <img
                  src={placeholder}
                  alt="Placeholder"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 dark:text-gray-500">
                  {placeholder}
                </div>
              )
            ) : null}
        </div>
      )}

      {optimizedResult && (
        <img
          ref={imgRef}
          src={optimizedResult.src}
          srcSet={optimizedResult.srcSet}
          sizes={optimizedResult.sizes || sizes}
          alt={optimizedResult.alt}
          className={`w-full h-full object-cover transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          style={{
            transitionDuration: `${transitionDuration}ms`
          }}
          loading={optimizedResult.loading || loading}
          decoding={optimizedResult.decoding || 'async'}
          fetchPriority={priority ? 'high' : fetchPriority}
          onError={handleError}
          onLoad={handleLoad}
          {...props}
        />
      )}

      {isError && !optimizedResult?.src && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800"
        >
          <div className="text-gray-400 dark:text-gray-500 text-center">
            <i className="fas fa-image text-2xl mb-2"></i>
            <p className="text-sm">图片加载失败</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;