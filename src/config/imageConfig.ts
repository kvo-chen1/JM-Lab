/**
 * 图片加载优化配置
 * 提供全局图片优化策略和CDN配置
 */

// 图片CDN配置
export const IMAGE_CDN = {
  // Unsplash图片优化
  unsplash: {
    baseUrl: 'https://images.unsplash.com',
    params: {
      auto: 'format',
      fit: 'crop',
      q: 80,
    },
  },
  // 本地图片优化（如果使用图片CDN服务）
  local: {
    enabled: false,
    baseUrl: '',
  },
};

// 图片质量配置
export const IMAGE_QUALITY = {
  low: { quality: 60, width: 400 },
  medium: { quality: 75, width: 800 },
  high: { quality: 85, width: 1200 },
  ultra: { quality: 95, width: 2000 },
} as const;

// 响应式图片尺寸
export const RESPONSIVE_SIZES = [320, 640, 960, 1280, 1920];

// 图片格式优先级
export const IMAGE_FORMATS = ['avif', 'webp', 'jpeg'];

// 懒加载配置
export const LAZY_LOAD_CONFIG = {
  // 提前加载距离（像素）
  rootMargin: '200px',
  // 触发阈值
  threshold: 0.01,
  // 是否启用占位符
  enablePlaceholder: true,
  // 占位符颜色
  placeholderColor: '#f0f0f0',
};

// 图片缓存配置
export const IMAGE_CACHE_CONFIG = {
  // 缓存最大数量
  maxCacheSize: 100,
  // 缓存过期时间（毫秒）
  ttl: 5 * 60 * 1000, // 5分钟
  // 是否启用sessionStorage缓存
  enableSessionCache: true,
};

// 根据网络状况调整图片质量
export function getOptimalQuality(): keyof typeof IMAGE_QUALITY {
  if (typeof navigator === 'undefined') return 'high';
  
  const connection = (navigator as any).connection;
  if (!connection) return 'high';
  
  const effectiveType = connection.effectiveType;
  
  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
      return 'low';
    case '3g':
      return 'medium';
    case '4g':
    default:
      return 'high';
  }
}

// 根据设备类型调整图片尺寸
export function getOptimalWidth(): number {
  if (typeof window === 'undefined') return 1200;
  
  const width = window.innerWidth;
  
  if (width <= 375) return 400;
  if (width <= 768) return 800;
  if (width <= 1440) return 1200;
  return 1920;
}

// 构建优化后的图片URL
export function buildOptimizedImageUrl(
  src: string,
  options: {
    width?: number;
    quality?: number;
    format?: string;
  } = {}
): string {
  const { width = getOptimalWidth(), quality = 80, format } = options;
  
  // Unsplash图片优化
  if (src.includes('unsplash.com')) {
    const url = new URL(src);
    url.searchParams.set('w', width.toString());
    url.searchParams.set('q', quality.toString());
    url.searchParams.set('auto', 'format');
    if (format) {
      url.searchParams.set('fm', format);
    }
    return url.toString();
  }
  
  // 其他图片服务可以在这里添加
  
  return src;
}

// 生成srcSet
export function generateSrcSet(
  src: string,
  sizes: number[] = RESPONSIVE_SIZES
): string {
  return sizes
    .map(size => `${buildOptimizedImageUrl(src, { width: size })} ${size}w`)
    .join(', ');
}

// 生成sizes属性
export function generateSizes(): string {
  return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
}
