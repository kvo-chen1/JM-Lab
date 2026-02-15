import React, { useState, useEffect, useRef, useMemo } from 'react';
import { processImageUrl, buildSrcSet, ImageQuality, ImageProcessingOptions } from '../utils/imageUrlUtils';
import { imageCacheManager } from '../utils/imageCacheManager';

// 导入共享的Intersection Observer相关变量
// 共享的Intersection Observer实例，减少创建实例的开销
let sharedObserver: IntersectionObserver | null = null;
let observerTargets = new Map<Element, () => void>();

// 初始化共享的Intersection Observer
const initSharedObserver = () => {
  if (!sharedObserver && 'IntersectionObserver' in window) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const callback = observerTargets.get(entry.target);
            if (callback) {
              callback();
              observerTargets.delete(entry.target);
              sharedObserver?.unobserve(entry.target);
            }
          }
        });
      },
      {
        rootMargin: '500px', // 提前500px开始加载，优化用户体验
        threshold: 0.01, // 只要有1%可见就开始加载
      }
    );
  }
};

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: React.ReactNode | 'blur' | 'color' | 'skeleton';
  className?: string;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  // 支持的宽高比
  ratio?: 'auto' | 'square' | 'landscape' | 'portrait';
  // 极简渲染模式：不使用任何容器或占位元素，直接输出<img>
  bare?: boolean;
  // 图片优先级
  priority?: boolean;
  // 图片质量
  quality?: ImageQuality;
  // 图片填充方式
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  // 图片定位方式
  position?: string;
  // 默认图片URL，当原始图片加载失败时使用
  fallbackSrc?: string;
  // 是否禁用fallback机制
  disableFallback?: boolean;
  // 是否启用渐进式加载
  progressive?: boolean;
  // 模糊占位符尺寸
  blurSize?: number;
  // 占位符颜色（仅当placeholder为'color'时使用）
  placeholderColor?: string;
  // 模糊占位符图片URL（仅当placeholder为'blur'时使用）
  blurPlaceholder?: string;
  // 加载动画类型
  loadingAnimation?: 'fade' | 'scale' | 'blur';
  // 是否启用响应式图片
  responsive?: boolean;
  // 响应式宽度数组，用于生成srcset
  responsiveWidths?: number[];
  // 图片格式
  format?: 'webp' | 'jpeg' | 'png';
  // 是否自动检测格式
  autoFormat?: boolean;
  // 图片格式集合（用于picture标签）
  formats?: Array<'webp' | 'avif' | 'jpeg' | 'png'>;
  // 响应式图片尺寸集合
  responsiveSizes?: number[];
  // 图片处理选项
  processingOptions?: Omit<ImageProcessingOptions, 'width' | 'height'>;
}

const LazyImage: React.FC<LazyImageProps> = React.memo(({ 
  src, 
  alt, 
  placeholder, 
  placeholderColor = '#f0f0f0',
  blurPlaceholder,
  className, 
  onLoad,
  onError,
  ratio = 'auto',
  fit = 'cover',
  bare = false,
  position,
  priority = false,
  quality = 'medium',
  fallbackSrc,
  disableFallback = false,
  progressive = true,
  blurSize = 10,
  loadingAnimation = 'fade',
  responsive = true,
  responsiveWidths = [320, 640, 1024, 1280, 1600],
  format,
  autoFormat = true,
  formats = ['webp', 'avif'],
  responsiveSizes = [320, 640, 1024, 1600, 2048],
  processingOptions = {},
  loading = 'lazy',
  ...rest 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isVisible, setIsVisible] = useState(bare ? true : false); // bare模式下直接可见
  const [retryCount, setRetryCount] = useState(0); // 重试次数计数器
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // 默认fallback图片 - 使用内联base64图片作为占位符，确保可靠加载
  // 使用简单的灰色矩形作为占位符（不含中文，避免编码问题）
  const defaultFallbackSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2UzZTZmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPkltYWdlPC90ZXh0Pjwvc3ZnPg=='
  
  // 备用图片服务 - 当原始图片加载失败时使用
  const getFallbackImageUrl = (alt: string) => {
    // 使用内联 SVG 作为占位图，避免外部服务不稳定
    // 使用英文文本避免编码问题
    const width = 600;
    const height = 400;
    const safeAlt = alt?.slice(0, 10) || 'Image';
    // 只使用 ASCII 字符避免编码问题
    const safeText = safeAlt.replace(/[^\x00-\x7F]/g, '?').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" fill="#e5e7eb"/><text x="50%" y="50%" font-family="Arial" font-size="24" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">${safeText}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };
  
  // 使用useMemo确保currentSrc与src同步更新，避免异步更新问题
  const currentSrc = useMemo(() => {
    // 首先检查src是否为空或无效
    if (!src || src.trim() === '') {
      return fallbackSrc || defaultFallbackSrc;
    }

    // 检查URL是否是trae-api的文本生成图片API
    if (src.includes('/api/proxy/trae-api/api/ide/v1/text_to_image') || src.includes('trae-api-sg.mchost.guru') || src.includes('trae-api-cn.mchost.guru')) {
      // 对于AI生成图片API，返回原始URL，让后端处理
      return src;
    }

    // 如果disableFallback为true，直接使用原始URL，不经过处理
    if (disableFallback) {
      return src;
    }

    // 检查是否是占位图服务（这些服务可能不稳定，直接使用fallback）
    const placeholderServices = [
      'placehold.co',
      'via.placeholder.com',
      'picsum.photos'
    ];
    const isPlaceholder = placeholderServices.some(service => src.includes(service));
    if (isPlaceholder) {
      console.log('[LazyImage] Detected placeholder service, using fallback:', src);
      return fallbackSrc || getFallbackImageUrl(alt) || defaultFallbackSrc;
    }

    // 检查是否是 data:image/svg+xml;base64,... 格式
    // 如果是，检查 base64 部分是否有效（只包含 base64 字符）
    if (src.startsWith('data:image/svg+xml;base64,')) {
      const base64Part = src.split(',')[1];
      if (base64Part) {
        // 检查是否只包含有效的 base64 字符
        const isValidBase64 = /^[A-Za-z0-9+/=]+$/.test(base64Part);
        if (!isValidBase64) {
          console.log('[LazyImage] Invalid base64 in data URL, using fallback:', src.substring(0, 50));
          return fallbackSrc || getFallbackImageUrl(alt) || defaultFallbackSrc;
        }
      }
    }

    // 使用新的图片处理选项处理URL
    try {
      const processedSrc = processImageUrl(src, {
        quality,
        responsive,
        autoFormat,
        format,
        ...processingOptions
      });

      // 确保返回有效的URL
      if (processedSrc && typeof processedSrc === 'string' && processedSrc.trim() !== '') {
        return processedSrc;
      }

      // 如果处理后的URL无效，返回原始URL
      return src;
    } catch (error) {
      console.error('Error processing image URL:', error);
      // 出错时返回原始URL或fallback
      return src || fallbackSrc || defaultFallbackSrc;
    }
  }, [src, fallbackSrc, disableFallback, quality, responsive, autoFormat, format, processingOptions, alt, getFallbackImageUrl, defaultFallbackSrc]);
  
  // 计算实际显示的图片URL，如果加载失败则使用fallback
  const displaySrc = useMemo(() => {
    // 如果已经出错且传入了fallbackSrc，直接使用fallbackSrc
    if (isError && fallbackSrc) {
      console.log('[LazyImage] Using fallbackSrc due to error:', fallbackSrc);
      return fallbackSrc;
    }
    
    // 如果已经重试过，优先使用传入的fallbackSrc
    if (retryCount >= 1) {
      const result = fallbackSrc || getFallbackImageUrl(alt) || defaultFallbackSrc;
      console.log('[LazyImage] Using fallback after retry:', { retryCount, result, fallbackSrc });
      return result;
    }
    
    // 确保currentSrc有效
    if (!currentSrc || currentSrc.trim() === '') {
      return fallbackSrc || defaultFallbackSrc;
    }
    
    return currentSrc;
  }, [isError, currentSrc, fallbackSrc, defaultFallbackSrc, alt, getFallbackImageUrl, retryCount]);
  
  // 构建响应式图片srcset
  const srcSet = useMemo(() => {
    // 只在响应式模式下构建srcset，且disableFallback为false时
    if (!responsive || disableFallback) {
      return undefined;
    }
    // src 为空或非字符串时不生成 srcSet
    if (!src || typeof src !== 'string') {
      return undefined;
    }
    if (src.startsWith('/') || src.startsWith('data:')) {
      return undefined;
    }
    
    // 构建srcset
    const result = buildSrcSet(src, responsiveWidths, quality);
    // 如果buildSrcSet返回空字符串，返回undefined
    return result || undefined;
  }, [src, responsive, disableFallback, responsiveWidths, quality]);
  
  // 构建sizes属性
  const sizes = useMemo(() => {
    if (!responsive) {
      return undefined;
    }
    
    // 根据设备宽度和图片在布局中的占比返回合适的sizes属性
    return '(max-width: 640px) calc(100vw - 2rem), (max-width: 1024px) calc(50vw - 2rem), (max-width: 1280px) calc(33vw - 2rem), calc(25vw - 2rem)';
  }, [responsive]);
  
  // 对于SVG数据URL，立即设置为已加载，因为它们是内联的，会立即加载
  const isSvgDataUrl = useMemo(() => {
    // src 为空时不视为 SVG data URL
    if (!src || typeof src !== 'string') {
      return false;
    }
    return src.startsWith('data:image/svg+xml');
  }, [src]);
  
  // 图片加载完成处理
  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // 检查图片是否有效（naturalWidth为0表示加载的内容不是图片）
    if (imgRef.current && imgRef.current.naturalWidth === 0) {
      // 内容不是有效的图片，触发错误处理
      handleError({} as React.SyntheticEvent<HTMLImageElement, Event>);
      return;
    }
    
    setIsLoaded(true);
    setIsError(false);
    if (onLoad) {
      onLoad(e);
    }
  };
  
  // 图片加载失败处理
  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log('[LazyImage] Image load error:', { src, alt, fallbackSrc, retryCount, isError });

    if (onError) {
      onError(event);
    }

    // 如果已经处于错误状态，不再处理（防止无限循环）
    if (isError) {
      console.log('[LazyImage] Already in error state, skipping');
      return;
    }

    // 阻止默认错误行为（防止显示损坏的图片图标）
    event.preventDefault();

    // 只有当disableFallback为false时，才显示错误状态UI
    if (!disableFallback) {
      // 如果已经重试过两次，不再重试
      if (retryCount >= 2) {
        console.log('[LazyImage] Max retries reached, showing error state');
        setIsError(true);
        setIsLoaded(true);
        return;
      }

      // 增加重试计数
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      console.log('[LazyImage] Retrying image load, new retry count:', newRetryCount);

      // 如果传入了fallbackSrc，或者已经重试过一次，使用fallback图片
      if (fallbackSrc || newRetryCount >= 1) {
        console.log('[LazyImage] Using fallbackSrc:', fallbackSrc || getFallbackImageUrl(alt));
        setIsError(true);
        setIsLoaded(true);
      } else if (newRetryCount >= 2) {
        // 重试两次后仍失败，显示错误状态
        console.log('[LazyImage] No fallbackSrc, showing error state after retries');
        setIsError(true);
        setIsLoaded(true);
      }
    }

    // 阻止事件冒泡，避免影响父组件
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
  };
  
  // 当src变化时重置加载状态
  useEffect(() => {
    // 重置所有相关状态，确保新图片能正确显示加载过程
    setIsLoaded(isSvgDataUrl); // SVG数据URL立即设置为已加载
    setIsError(false);
    setRetryCount(0); // 重置重试计数器
  }, [src, isSvgDataUrl]);

  // 移除了网络状态监听，减少不必要的性能开销

  // 观察图片是否进入视口
  useEffect(() => {
    if (bare) {
      // 极简模式不做懒加载观察
      setIsVisible(true);
      return;
    }
    // 优先级高的图片立即加载，不使用懒加载
    if (priority) {
      setIsVisible(true);
      return;
    }
    
    // 使用共享的Intersection Observer实例，降低初始延迟
    initSharedObserver();
    
    // 直接设置为可见，确保图片能够加载
    // 这样可以避免IntersectionObserver的兼容性问题
    setIsVisible(true);
    
    // 清理函数
    return () => {
      if (containerRef.current) {
        observerTargets.delete(containerRef.current);
        sharedObserver?.unobserve(containerRef.current);
      }
    };
  }, [priority]);

  // 修复：检查图片是否已经加载完成（例如从缓存加载）
  useEffect(() => {
    if (isVisible && imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        // 图片已加载且有效
        if (!isLoaded) {
          // 从缓存加载时，手动创建一个合成事件对象
          const syntheticEvent = {
            target: imgRef.current
          } as unknown as React.SyntheticEvent<HTMLImageElement, Event>;
          handleLoad(syntheticEvent);
        }
      }
    }
  }, [isVisible, displaySrc, isLoaded]);

  // 移除了预加载逻辑，减少不必要的性能开销
  
  // 加载动画样式
  const getLoadingAnimationClasses = () => {
    if (loadingAnimation === 'fade') {
      return 'transition-opacity duration-500 ease-in-out';
    } else if (loadingAnimation === 'scale') {
      return 'transition-all duration-500 ease-in-out transform';
    } else if (loadingAnimation === 'blur') {
      return 'transition-all duration-700 ease-in-out';
    }
    return 'transition-opacity duration-500 ease-in-out';
  };
  
  // 图片容器样式
  const getImageClasses = () => {
    const positionClass = position ? `object-${position}` : '';
    // 如果 ratio 是 auto，使用 h-auto 让图片自然撑开高度，否则使用 h-full 填充容器
    const heightClass = ratio === 'auto' ? 'h-auto' : 'h-full';
    // 添加 block 类以消除 img 标签底部的默认间隙
    // 在 bare 模式下，将传入的 className 也包含进来
    const baseClasses = `block w-full ${heightClass} object-${fit} ${positionClass} ${className} ${!disableFallback ? getLoadingAnimationClasses() : ''}`;
    
    // 当disableFallback为true时，始终显示图片，不使用动画效果
    if (disableFallback) {
      return `${baseClasses} opacity-100`;
    }
    
    if (isLoaded || isError) {
      if (loadingAnimation === 'fade') {
        return `${baseClasses} opacity-100`;
      } else if (loadingAnimation === 'scale') {
        return `${baseClasses} opacity-100 scale-100`;
      } else if (loadingAnimation === 'blur') {
        return `${baseClasses} opacity-100 blur-0`;
      }
      return `${baseClasses} opacity-100`;
    } else {
      // 加载过程中，根据动画类型设置不同的初始状态
      if (loadingAnimation === 'fade') {
        return `${baseClasses} opacity-0`;
      } else if (loadingAnimation === 'scale') {
        return `${baseClasses} opacity-0 scale-95`;
      } else if (loadingAnimation === 'blur') {
        return `${baseClasses} opacity-100 blur-sm`;
      }
      return `${baseClasses} opacity-0`;
    }
  };
  
  // 渲染内置占位符
  const renderBuiltInPlaceholder = () => {
    if (typeof placeholder === 'string') {
      switch (placeholder) {
        case 'blur':
          return blurPlaceholder ? (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img
                src={blurPlaceholder}
                alt={alt}
                className="w-full h-full object-cover filter blur-md transition-filter duration-300"
                aria-hidden="true"
                loading="eager"
              />
            </div>
          ) : null;
        case 'color':
          return (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundColor: placeholderColor }}
            ></div>
          );
        case 'skeleton':
          return (
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse"></div>
          );
        default:
          return null;
      }
    }
    return null;
  };

  // 自定义占位符
  const defaultPlaceholder = (
    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded-lg flex items-center justify-center">
      <i className="fas fa-image text-gray-400 dark:text-gray-500 text-2xl"></i>
    </div>
  );
  
  // bare模式：直接输出<img>，不包裹额外div，避免任何额外的布局影响
  if (bare) {
    console.log('[LazyImage] Bare mode render:', { alt, src, displaySrc, retryCount, isError });
    
    // 确保 displaySrc 不为空
    const safeDisplaySrc = displaySrc || fallbackSrc || defaultFallbackSrc;
    
    // 如果已经处于错误状态（使用fallback图片），禁用onError防止无限循环
    const isUsingFallback = isError || retryCount >= 1;
    
    return (
      <img
        key={safeDisplaySrc}
        ref={imgRef}
        src={safeDisplaySrc}
        alt={alt}
        className={getImageClasses()}
        onLoad={handleLoad}
        onError={isUsingFallback ? undefined : handleError}
        loading={loading}
        srcSet={srcSet}
        sizes={sizes}
        {...rest}
      />
    );
  }

  // 默认模式：带容器与占位渲染
  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* 图片容器，保持宽高比 */}
      <div 
        className="relative overflow-hidden"
        style={{
          width: '100%',
          // 始终设置宽高比，确保容器尺寸稳定，减少布局偏移
          aspectRatio: ratio === 'square' 
            ? '1 / 1' 
            : ratio === 'landscape' 
              ? '16 / 9' 
              : ratio === 'portrait' 
                ? '4 / 5' 
                : 'auto',
          // 为auto比例添加最小高度，仅在加载前占位，加载完成后由图片撑开
          ...(ratio === 'auto' && !isLoaded && { minHeight: '50px' })
        }}
      >
        {/* 内置占位符 - 仅当disableFallback为false时显示 */}
        {!isLoaded && !isError && !disableFallback && renderBuiltInPlaceholder()}
        
        {/* 图片元素 - 只在可见时渲染，实现真正的懒加载 */}
        {isVisible && (
          <img
            ref={imgRef}
            src={displaySrc}
            alt={alt}
            className={getImageClasses()}
            onLoad={handleLoad}
            onError={handleError}
            loading="eager"
            srcSet={srcSet}
            sizes={sizes}
            {...rest}
          />
        )}
        
        {/* 简化的加载状态指示器 - 仅显示旋转动画，减少DOM节点 */}
        {isVisible && !isLoaded && !isError && !disableFallback && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* 加载失败状态 - 显示fallback图片或错误提示 */}
        {isError && !disableFallback && (
          fallbackSrc ? (
            // 如果有fallbackSrc，显示fallback图片
            <img
              src={fallbackSrc}
              alt={alt}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            // 没有fallbackSrc，显示错误提示
            <div className="absolute inset-0 z-20 w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="text-center p-4">
                <svg className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">图片加载失败</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;
