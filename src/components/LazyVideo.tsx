import React, { useState, useEffect, useRef, useMemo, forwardRef } from 'react';

// 导入共享的Intersection Observer相关变量
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
        rootMargin: '300px', // 提前300px开始加载，优化用户体验
        threshold: 0.01, // 只要有1%可见就开始加载
      }
    );
  }
};

interface LazyVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  poster?: string;
  alt?: string;
  className?: string;
  onLoad?: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void;
  onError?: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void;
  // 极简渲染模式：不使用任何容器或占位元素，直接输出<video>
  bare?: boolean;
  // 视频优先级
  priority?: boolean;
  // 加载动画类型
  loadingAnimation?: 'fade' | 'scale' | 'blur';
  // 是否自动播放
  autoPlay?: boolean;
  // 是否静音
  muted?: boolean;
  // 是否循环播放
  loop?: boolean;
  // 是否显示控制条
  controls?: boolean;
  // 是否在用户交互时才播放
  playsInline?: boolean;
}

const LazyVideo = React.memo(forwardRef<HTMLVideoElement, LazyVideoProps>(({
  src,
  poster,
  alt,
  className,
  onLoad,
  onError,
  bare = false,
  priority = false,
  loadingAnimation = 'fade',
  autoPlay = false,
  muted = true,
  loop = false,
  controls = true,
  playsInline = true,
  ...rest
}, ref) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isVisible, setIsVisible] = useState(bare ? true : false); // bare模式下直接可见
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 视频加载完成处理
  const handleLoad = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    setIsLoaded(true);
    setIsError(false);
    if (onLoad) {
      onLoad(e);
    }
  };
  
  // 视频加载失败处理
  const handleError = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    if (onError) {
      onError(event);
    }
    setIsError(true);
    setIsLoaded(false);
    
    // 阻止事件冒泡，避免影响父组件
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
  };
  
  // 当src变化时重置加载状态
  useEffect(() => {
    setIsLoaded(false);
    setIsError(false);
  }, [src]);

  // 观察视频是否进入视口
  useEffect(() => {
    if (bare) {
      // 极简模式不做懒加载观察
      setIsVisible(true);
      return;
    }
    // 优先级高的视频立即加载，不使用懒加载
    if (priority) {
      setIsVisible(true);
      return;
    }
    
    // 使用共享的Intersection Observer实例，降低初始延迟
    initSharedObserver();
    
    // 如果containerRef已经存在，检查可见性
    if (containerRef.current) {
      // 检查视频是否已经在视口中
      const rect = containerRef.current.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight + 200 && rect.bottom > -200;
      
      if (isInViewport) {
        setIsVisible(true);
      } else if (sharedObserver) {
        // 添加到共享observer，减少预加载距离以节省资源
        observerTargets.set(containerRef.current, () => setIsVisible(true));
        sharedObserver.observe(containerRef.current);
      } else {
        // 降级方案：直接加载视频
        setIsVisible(true);
      }
    }
    
    // 清理函数
    return () => {
      if (containerRef.current) {
        observerTargets.delete(containerRef.current);
        sharedObserver?.unobserve(containerRef.current);
      }
    };
  }, [priority]);

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
  
  // 视频容器样式
  const getVideoClasses = () => {
    const baseClasses = `block w-full h-full ${getLoadingAnimationClasses()}`;
    
    if (isLoaded) {
      if (loadingAnimation === 'fade') {
        return `${baseClasses} opacity-100`;
      } else if (loadingAnimation === 'scale') {
        return `${baseClasses} opacity-100 scale-100`;
      } else if (loadingAnimation === 'blur') {
        return `${baseClasses} opacity-100 blur-0`;
      }
      return `${baseClasses} opacity-100`;
    } else if (isError) {
      return `${baseClasses} opacity-0`;
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

  // bare模式：直接输出<video>，不包裹额外div，避免任何额外的布局影响
  if (bare) {
    // 从rest中移除alt属性，因为video标签不支持alt
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { alt: _alt, ...videoRest } = { alt, ...rest };
    return (
      <video
            ref={ref}
            src={src}
            poster={poster}
            className={getVideoClasses()}
            onLoadedData={handleLoad}
            onError={handleError}
            autoPlay={autoPlay && isVisible}
            muted={muted}
            loop={loop}
            controls={controls}
            playsInline={playsInline}
            {...videoRest}
          />
    );
  }

  // 默认模式：带容器与占位渲染
  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* 视频容器，自适应宽高比 */}
      <div 
        className="relative overflow-hidden w-full h-full"
      >
        {/* 视频元素 - 只在可见时渲染，实现真正的懒加载 */}
        {isVisible && (
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          (({ alt: _altProp, ...videoProps }: any) => (
            <video
              ref={ref}
              src={src}
              poster={poster}
              className={getVideoClasses()}
              onLoadedData={handleLoad}
              onError={handleError}
              autoPlay={autoPlay && isVisible}
              muted={muted}
              loop={loop}
              controls={controls}
              playsInline={playsInline}
              {...videoProps}
            />
          ))({ alt, ...rest })
        )}
        
        {/* 加载状态指示器 */}
        {isVisible && !isLoaded && !isError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20">
            <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* 加载失败状态 */}
        {isError && (
          <div className="absolute inset-0 z-20 w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center p-4">
              <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-2 text-sm text-gray-400">视频加载失败</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}));

LazyVideo.displayName = 'LazyVideo';

export default LazyVideo;