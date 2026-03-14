import { useTheme } from '@/hooks/useTheme';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  count?: number;
  style?: React.CSSProperties;
}

/**
 * 通用骨架屏组件
 */
export function Skeleton({
  className = '',
  width,
  height,
  circle = false,
  count = 1,
  style
}: SkeletonProps) {
  const { isDark } = useTheme();

  const baseStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: circle ? '50%' : '0.5rem',
    ...style
  };

  const skeletonClass = `
    animate-pulse
    ${isDark ? 'bg-slate-800' : 'bg-gray-200'}
    ${className}
  `;

  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={skeletonClass}
            style={baseStyle}
          />
        ))}
      </>
    );
  }

  return <div className={skeletonClass} style={baseStyle} />;
}

/**
 * FAQ列表骨架屏
 */
export function FAQListSkeleton({ count = 5 }: { count?: number }) {
  const { isDark } = useTheme();

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`
            rounded-2xl border p-5
            ${isDark ? 'bg-slate-900/40 border-slate-800/50' : 'bg-white/70 border-gray-200/70'}
          `}
        >
          <div className="flex items-start gap-4">
            <Skeleton width={40} height={40} className="rounded-xl flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton width="80%" height={20} />
              <div className="flex items-center gap-3">
                <Skeleton width={60} height={14} />
                <Skeleton width={80} height={14} />
              </div>
            </div>
            <Skeleton width={32} height={32} className="rounded-lg flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 工单列表骨架屏
 */
export function TicketListSkeleton({ count = 3 }: { count?: number }) {
  const { isDark } = useTheme();

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`
            p-4 rounded-xl border
            ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton width={60} height={24} className="rounded-lg" />
              <Skeleton width="50%" height={20} />
            </div>
            <Skeleton width={80} height={16} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 侧边栏统计卡片骨架屏
 */
export function StatsCardSkeleton() {
  const { isDark } = useTheme();

  return (
    <div className={`
      p-4 rounded-2xl border
      ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-gray-50 border-gray-200'}
    `}>
      <Skeleton width={80} height={14} className="mb-3" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton width={14} height={14} circle />
              <Skeleton width={80} height={16} />
            </div>
            <Skeleton width={40} height={16} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 页面头部骨架屏
 */
export function PageHeaderSkeleton() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton width={48} height={48} className="rounded-2xl" />
        <div className="space-y-2">
          <Skeleton width={200} height={32} />
          <Skeleton width={300} height={16} />
        </div>
      </div>
      <Skeleton width="100%" height={56} className="rounded-2xl" />
    </div>
  );
}

/**
 * 热门问题列表骨架屏
 */
export function HotFAQListSkeleton({ count = 5 }: { count?: number }) {
  const { isDark } = useTheme();

  return (
    <div className={`
      rounded-2xl border overflow-hidden
      ${isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-gray-200'}
    `}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`
            flex items-center gap-3 p-3
            ${i !== count - 1 ? (isDark ? 'border-b border-slate-700/50' : 'border-b border-gray-100') : ''}
          `}
        >
          <Skeleton width={24} height={24} className="rounded-lg" />
          <Skeleton width="70%" height={16} className="flex-1" />
          <Skeleton width={14} height={14} />
        </div>
      ))}
    </div>
  );
}

/**
 * 联系支持卡片骨架屏
 */
export function ContactCardSkeleton({ count = 3 }: { count?: number }) {
  const { isDark } = useTheme();

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`
            flex items-center gap-3 p-3 rounded-xl
            ${isDark ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white border border-gray-200'}
          `}
        >
          <Skeleton width={40} height={40} className="rounded-lg" />
          <div className="flex-1 space-y-1">
            <Skeleton width={80} height={16} />
            <Skeleton width={120} height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 通用骨架盒子组件
 */
interface SkeletonBoxProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  rounded?: boolean;
  className?: string;
}

export function SkeletonBox({
  width,
  height,
  circle = false,
  rounded = false,
  className = ''
}: SkeletonBoxProps) {
  const { isDark } = useTheme();

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: circle ? '50%' : rounded ? '0.5rem' : undefined
  };

  return (
    <div
      className={`animate-pulse ${isDark ? 'bg-slate-800' : 'bg-gray-200'} ${className}`}
      style={style}
    />
  );
}

/**
 * 卡片骨架屏
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  const { isDark } = useTheme();

  return (
    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm ${className}`}>
      <div className="flex items-start gap-3 mb-4">
        <SkeletonBox width={40} height={40} circle />
        <div className="flex-1">
          <SkeletonBox width="60%" height={16} rounded className="mb-2" />
          <SkeletonBox width="40%" height={12} rounded />
        </div>
      </div>
      <SkeletonBox width="100%" height={80} rounded className="mb-3" />
      <div className="flex gap-2">
        <SkeletonBox width={60} height={24} rounded />
        <SkeletonBox width={60} height={24} rounded />
      </div>
    </div>
  );
}

/**
 * 列表项骨架屏
 */
export function SkeletonListItem({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <SkeletonBox width={32} height={32} circle />
      <div className="flex-1">
        <SkeletonBox width="70%" height={14} rounded className="mb-1" />
        <SkeletonBox width="40%" height={12} rounded />
      </div>
    </div>
  );
}

/**
 * 文本骨架屏
 */
interface SkeletonTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'p' | 'span';
  width?: string | number;
  lines?: number;
  className?: string;
}

export function SkeletonText({
  variant = 'p',
  width,
  lines = 1,
  className = ''
}: SkeletonTextProps) {
  const heightMap = {
    h1: 32,
    h2: 24,
    h3: 20,
    h4: 18,
    h5: 16,
    p: 14,
    span: 14
  };

  const height = heightMap[variant];

  if (lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBox
            key={i}
            width={i === lines - 1 ? '70%' : '100%'}
            height={height}
            rounded
          />
        ))}
      </div>
    );
  }

  return <SkeletonBox width={width || '100%'} height={height} rounded className={className} />;
}

/**
 * 头像骨架屏
 */
interface SkeletonAvatarProps {
  size?: number;
  className?: string;
}

export function SkeletonAvatar({ size = 40, className = '' }: SkeletonAvatarProps) {
  return <SkeletonBox width={size} height={size} circle className={className} />;
}

/**
 * 按钮骨架屏
 */
interface SkeletonButtonProps {
  width?: string | number;
  height?: number;
  className?: string;
}

export function SkeletonButton({
  width = '100px',
  height = 36,
  className = ''
}: SkeletonButtonProps) {
  return <SkeletonBox width={width} height={height} rounded className={className} />;
}

export default Skeleton;
