import clsx from 'clsx';

// 骨架屏动画样式 - 优化为更平滑、更自然的动画效果
const skeletonAnimation = 'animate-[pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite] transition-all duration-300 ease-in-out';

// 统一的骨架屏颜色方案 - 使用渐变效果增强视觉体验
const skeletonColor = 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800';
const skeletonRounded = 'rounded-md';
const skeletonRoundedFull = 'rounded-full';

interface SkeletonProps {
  className?: string;
}

interface SkeletonBoxProps extends SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  circle?: boolean;
}

interface SkeletonTextProps extends SkeletonProps {
  lines?: number;
  width?: string | number | (string | number)[];
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
}

interface SkeletonCardProps extends SkeletonProps {
  image?: boolean;
  title?: boolean;
  description?: boolean;
  footer?: boolean;
}

interface SkeletonAvatarProps extends SkeletonProps {
  size?: number;
  rounded?: boolean;
}

/**
 * 基础骨架屏盒子组件
 */
export function SkeletonBox({
  width = '100%',
  height = '1rem',
  rounded = false,
  circle = false,
  className = '',
}: SkeletonBoxProps) {
  return (
    <div
      className={clsx(
        skeletonColor,
        skeletonAnimation,
        rounded && skeletonRounded,
        circle && skeletonRoundedFull,
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

/**
 * 文本骨架屏组件
 */
export function SkeletonText({
  lines = 1,
  width = '100%',
  variant = 'p',
  className = '',
}: SkeletonTextProps) {
  const Line = variant;
  const widths = Array.isArray(width) ? width : Array(lines).fill(width);

  return (
    <div className={className}>
      {widths.slice(0, lines).map((lineWidth, index) => (
        <Line
          key={index}
          className={clsx(
            skeletonColor,
            skeletonAnimation,
            'inline-block',
            skeletonRounded,
            'mb-2',
            variant === 'p' && 'h-4',
            variant.startsWith('h') && `h-${variant.slice(1)}`,
            'last:mb-0',
            'transition-all duration-300'
          )}
          style={{
            width: typeof lineWidth === 'number' ? `${lineWidth}px` : lineWidth,
            height: variant === 'p' ? '1rem' : variant === 'span' ? '1em' : `${parseInt(variant.slice(1)) * 0.3 + 0.8}rem`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * 卡片骨架屏组件
 */
export function SkeletonCard({
  image = true,
  title = true,
  description = true,
  footer = true,
  className = '',
}: SkeletonCardProps) {
  return (
    <div className={clsx('bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg', className)}>
      {image && (
        <div className="mb-4">
          <SkeletonBox width="100%" height="160px" rounded />
        </div>
      )}
      {title && (
        <div className="mb-2">
          <SkeletonText lines={1} width="80%" variant="h3" />
        </div>
      )}
      {description && (
        <div className="mb-4">
          <SkeletonText lines={2} width={['90%', '70%']} />
        </div>
      )}
      {footer && (
        <div className="flex items-center justify-between">
          <SkeletonBox width="60px" height="32px" rounded />
          <SkeletonBox width="80px" height="32px" rounded />
        </div>
      )}
    </div>
  );
}

/**
 * 头像骨架屏组件
 */
export function SkeletonAvatar({
  size = 40,
  rounded = false,
  className = '',
}: SkeletonAvatarProps) {
  return (
    <SkeletonBox
      width={size}
      height={size}
      rounded={rounded}
      circle={!rounded}
      className={clsx('transition-all duration-300', className)}
    />
  );
}

/**
 * 列表项骨架屏组件
 */
export function SkeletonListItem({
  className = '',
}: SkeletonProps) {
  return (
    <div className={clsx('flex items-center gap-3 py-3 border-b border-gray-200 dark:border-gray-700 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800', className)}>
      <SkeletonAvatar size={48} />
      <div className="flex-1">
        <SkeletonText lines={1} width="70%" variant="h4" />
        <SkeletonText lines={1} width="50%" />
      </div>
      <SkeletonBox width="24px" height="24px" rounded />
    </div>
  );
}

/**
 * 按钮骨架屏组件
 */
export function SkeletonButton({
  width = '100px',
  height = '40px',
  rounded = true,
  className = '',
}: Omit<SkeletonBoxProps, 'circle'>) {
  return (
    <SkeletonBox
      width={width}
      height={height}
      rounded={rounded}
      circle={false}
      className={clsx('transition-all duration-300', className)}
    />
  );
}

/**
 * 网格骨架屏组件
 */
export function SkeletonGrid({
  columns = 2,
  rows = 1,
  className = '',
}: {
  columns?: number;
  rows?: number;
  className?: string;
}) {
  const totalItems = columns * rows;

  return (
    <div className={clsx(`grid grid-cols-${columns} gap-4`, className)}>
      {Array.from({ length: totalItems }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

/**
 * 骨架屏包裹组件，用于统一管理骨架屏的显示和隐藏
 */
export function SkeletonWrapper({
  isLoading,
  children,
  skeleton,
}: {
  isLoading: boolean;
  children: React.ReactNode;
  skeleton: React.ReactNode;
}) {
  if (isLoading) {
    return skeleton;
  }
  return <>{children}</>;
}

// 导出默认骨架屏组件
export default SkeletonBox;