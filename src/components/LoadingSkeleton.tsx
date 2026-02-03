/**
 * 优化加载骨架组件
 * 提供更美观和性能友好的加载状态展示
 */

import React, { useEffect, useState } from 'react';
import { performanceMonitor } from '@/utils/performanceOptimization.tsx';

interface LoadingSkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular' | 'card' | 'list' | 'grid';
  width?: string | number;
  height?: string | number;
  count?: number;
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  // 高级配置
  gradientColors?: string[];
  animationDuration?: number;
  shimmerEffect?: boolean;
  showContentPlaceholder?: boolean;
}

/**
 * 基础骨架屏组件
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'rectangular',
  width = '100%',
  height = '1rem',
  count = 1,
  animation = 'pulse',
  className = '',
  style = {},
  children,
  gradientColors = ['#f3f4f6', '#e5e7eb', '#f3f4f6'],
  animationDuration = 1.5,
  shimmerEffect = false,
  showContentPlaceholder = false
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 性能监控：记录骨架屏显示时间
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric('skeleton_display_duration', duration);
    };
  }, []);

  // 根据主题动态调整颜色
  const getGradientColors = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      return ['#374151', '#4b5563', '#374151'];
    }
    return gradientColors;
  };

  const getBorderRadius = () => {
    switch (variant) {
      case 'circular':
        return '50%';
      case 'card':
        return '12px';
      case 'text':
        return '4px';
      default:
        return '8px';
    }
  };

  const skeletonStyle: React.CSSProperties = {
    width,
    height,
    borderRadius: getBorderRadius(),
    ...style
  };

  const renderSkeleton = () => {
    if (animation === 'none') {
      return (
        <div
          className={`skeleton-static ${className}`}
          style={{
            ...skeletonStyle,
            backgroundColor: getGradientColors()[0],
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {showContentPlaceholder && (
            <div className="skeleton-content-placeholder">
              {children}
            </div>
          )}
        </div>
      );
    }

    if (shimmerEffect) {
      return (
        <div
          className={`skeleton-shimmer ${className}`}
          style={{
            ...skeletonStyle,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: getGradientColors()[0]
          }}
        >
          <div
            className="shimmer-wave"
            style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: `linear-gradient(90deg, transparent, ${getGradientColors()[1]}, transparent)`,
              animation: `shimmer ${animationDuration}s infinite`
            }}
          />
          {showContentPlaceholder && (
            <div className="skeleton-content-placeholder">
              {children}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        className={`skeleton-animated ${animation} ${className}`}
        style={{
          ...skeletonStyle,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: getGradientColors()[0]
        }}
      >
        <div
          className="skeleton-gradient"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `linear-gradient(90deg, ${getGradientColors()[0]}, ${getGradientColors()[1]}, ${getGradientColors()[2]})`,
            backgroundSize: '200% 100%',
            animation: animation === 'pulse' 
              ? `pulse ${animationDuration}s ease-in-out infinite` 
              : `wave ${animationDuration}s linear infinite`
          }}
        />
        {showContentPlaceholder && (
          <div className="skeleton-content-placeholder">
            {children}
          </div>
        )}
      </div>
    );
  };

  // 使用CSS-in-JS方式添加动画样式
  useEffect(() => {
    // 创建样式元素
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.4;
        }
      }

      @keyframes wave {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }

      @keyframes shimmer {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }
    `;
    
    // 添加到文档头部
    document.head.appendChild(style);
    
    // 清理函数
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-wrapper">
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
};

/**
 * 卡片骨架屏
 */
interface CardSkeletonProps {
  count?: number;
  showHeader?: boolean;
  showMedia?: boolean;
  showContent?: boolean;
  showActions?: boolean;
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  count = 1,
  showHeader = true,
  showMedia = true,
  showContent = true,
  showActions = true,
  className = ''
}) => {
  return (
    <div className={`card-skeleton-container ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card-skeleton bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* 头部 */}
          {showHeader && (
            <div className="card-header p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <LoadingSkeleton variant="circular" width={40} height={40} />
                <div className="flex-1">
                  <LoadingSkeleton variant="text" width="60%" height="1rem" className="mb-2" />
                  <LoadingSkeleton variant="text" width="40%" height="0.75rem" />
                </div>
              </div>
            </div>
          )}

          {/* 媒体内容 */}
          {showMedia && (
            <div className="card-media aspect-video bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
              <LoadingSkeleton variant="rectangular" width="100%" height="100%" />
            </div>
          )}

          {/* 内容 */}
          {showContent && (
            <div className="card-content p-4">
              <LoadingSkeleton variant="text" width="80%" height="1.25rem" className="mb-3" />
              <LoadingSkeleton variant="text" width="100%" height="0.875rem" className="mb-2" />
              <LoadingSkeleton variant="text" width="90%" height="0.875rem" className="mb-2" />
              <LoadingSkeleton variant="text" width="60%" height="0.875rem" />
            </div>
          )}

          {/* 操作按钮 */}
          {showActions && (
            <div className="card-actions p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <LoadingSkeleton variant="rectangular" width="80px" height="32px" />
                <LoadingSkeleton variant="rectangular" width="80px" height="32px" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * 列表骨架屏
 */
interface ListSkeletonProps {
  count?: number;
  showAvatar?: boolean;
  showActions?: boolean;
  className?: string;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  count = 3,
  showAvatar = true,
  showActions = true,
  className = ''
}) => {
  return (
    <div className={`list-skeleton-container ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="list-skeleton-item flex items-center space-x-4 p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          {showAvatar && (
            <LoadingSkeleton variant="circular" width={48} height={48} />
          )}
          
          <div className="flex-1 min-w-0">
            <LoadingSkeleton variant="text" width="40%" height="1rem" className="mb-2" />
            <LoadingSkeleton variant="text" width="70%" height="0.875rem" className="mb-1" />
            <LoadingSkeleton variant="text" width="50%" height="0.75rem" />
          </div>

          {showActions && (
            <div className="flex-shrink-0">
              <LoadingSkeleton variant="rectangular" width="60px" height="24px" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * 网格骨架屏
 */
interface GridSkeletonProps {
  columns?: number;
  count?: number;
  itemHeight?: number;
  className?: string;
}

export const GridSkeleton: React.FC<GridSkeletonProps> = ({
  columns = 3,
  count = 6,
  itemHeight = 200,
  className = ''
}) => {
  return (
    <div 
      className={`grid-skeleton-container ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '1rem'
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="grid-skeleton-item">
          <LoadingSkeleton 
            variant="rectangular" 
            width="100%" 
            height={itemHeight}
            className="rounded-lg"
          />
        </div>
      ))}
    </div>
  );
};

/**
 * 内容骨架屏
 */
interface ContentSkeletonProps {
  paragraphs?: number;
  linesPerParagraph?: number;
  showTitle?: boolean;
  showImage?: boolean;
  className?: string;
}

export const ContentSkeleton: React.FC<ContentSkeletonProps> = ({
  paragraphs = 3,
  linesPerParagraph = 3,
  showTitle = true,
  showImage = false,
  className = ''
}) => {
  return (
    <div className={`content-skeleton-container ${className}`}>
      {showTitle && (
        <LoadingSkeleton variant="text" width="60%" height="2rem" className="mb-6" />
      )}

      {showImage && (
        <LoadingSkeleton variant="rectangular" width="100%" height="200px" className="mb-6 rounded-lg" />
      )}

      {Array.from({ length: paragraphs }).map((_, pIndex) => (
        <div key={pIndex} className="paragraph-skeleton mb-4">
          {Array.from({ length: linesPerParagraph }).map((_, lIndex) => {
            const isLastLine = lIndex === linesPerParagraph - 1;
            const width = isLastLine ? '70%' : '100%';
            return (
              <LoadingSkeleton 
                key={lIndex}
                variant="text" 
                width={width} 
                height="1rem" 
                className={lIndex < linesPerParagraph - 1 ? 'mb-2' : ''}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

/**
 * 智能骨架屏管理器
 * 根据内容类型自动选择合适的骨架屏
 */
interface SmartSkeletonProps {
  type: 'card' | 'list' | 'grid' | 'content' | 'text' | 'custom';
  count?: number;
  className?: string;
  // 自定义配置
  customProps?: any;
}

export const SmartSkeleton: React.FC<SmartSkeletonProps> = ({
  type,
  count = 1,
  className = '',
  customProps = {}
}) => {
  useEffect(() => {
    // 记录骨架屏类型使用统计
    performanceMonitor.recordMetric(`skeleton_type_${type}`, 1);
  }, [type]);

  switch (type) {
    case 'card':
      return <CardSkeleton count={count} className={className} {...customProps} />;
    
    case 'list':
      return <ListSkeleton count={count} className={className} {...customProps} />;
    
    case 'grid':
      return <GridSkeleton count={count} className={className} {...customProps} />;
    
    case 'content':
      return <ContentSkeleton className={className} {...customProps} />;
    
    case 'text':
      return <LoadingSkeleton variant="text" count={count} className={className} {...customProps} />;
    
    case 'custom':
      return <LoadingSkeleton className={className} {...customProps} />;
    
    default:
      return <LoadingSkeleton count={count} className={className} />;
  }
};

/**
 * 骨架屏包装器
 * 自动显示骨架屏直到内容加载完成
 */
interface SkeletonWrapperProps {
  loading: boolean;
  skeletonType: SmartSkeletonProps['type'];
  skeletonCount?: number;
  skeletonProps?: any;
  children: React.ReactNode;
  className?: string;
  minLoadingTime?: number; // 最小显示时间，避免闪烁
}

export const SkeletonWrapper: React.FC<SkeletonWrapperProps> = ({
  loading,
  skeletonType,
  skeletonCount = 1,
  skeletonProps = {},
  children,
  className = '',
  minLoadingTime = 300
}) => {
  const [shouldShowSkeleton, setShouldShowSkeleton] = useState(loading);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    if (!loading) {
      // 确保最小显示时间
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadingTime - elapsed);
      
      const timer = setTimeout(() => {
        setShouldShowSkeleton(false);
      }, remaining);

      return () => clearTimeout(timer);
    } else {
      setShouldShowSkeleton(true);
    }
  }, [loading, startTime, minLoadingTime]);

  if (shouldShowSkeleton) {
    return (
      <div className={`skeleton-wrapper-container ${className}`}>
        <SmartSkeleton 
          type={skeletonType} 
          count={skeletonCount} 
          {...skeletonProps} 
        />
      </div>
    );
  }

  return <>{children}</>;
};

export default LoadingSkeleton;