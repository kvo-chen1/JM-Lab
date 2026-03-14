/**
 * 图片优化工具
 * 提供图片格式转换、压缩、懒加载等功能
 */


export interface ImageOptimizationOptions {
  formats?: string[];
  sizes?: number[];
  quality?: number;
  lazy?: boolean;
  preload?: boolean;
  responsive?: boolean;
  priority?: 'high' | 'medium' | 'low';
  placeholder?: 'blur' | 'solid' | 'none';
  blurDataURL?: string;
  aspectRatio?: number;
}

export interface OptimizedImageResult {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  placeholder?: string;
  blurDataURL?: string;
  aspectRatio?: number;
}

/**
 * 图片优化管理器
 */
export class ImageOptimizer {
  private static instance: ImageOptimizer;
  private supportedFormats: Set<string> = new Set();
  private optimizationCache: Map<string, OptimizedImageResult> = new Map();
  private networkSpeed: 'slow-2g' | '2g' | '3g' | '4g' | '5g' = '4g';
  private deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  private constructor() {
    this.detectSupportedFormats();
    this.detectEnvironment();
  }

  /**
   * 检测环境信息
   */
  private detectEnvironment(): void {
    if (typeof window === 'undefined') return;

    // 检测网络速度
    if ('connection' in navigator) {
      const connection = navigator.connection as any;
      this.networkSpeed = connection.effectiveType || '4g';
    }

    // 检测设备类型
    const width = window.innerWidth;
    if (width < 768) this.deviceType = 'mobile';
    else if (width < 1024) this.deviceType = 'tablet';
    else this.deviceType = 'desktop';
  }

  /**
   * 检测浏览器支持的图片格式
   */
  private detectSupportedFormats(): void {
    if (typeof window === 'undefined') return;

    // WebP支持检测
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      if (webP.width === 1) {
        this.supportedFormats.add('webp');
      }
    };
    webP.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/v9U/5g=';

    // AVIF支持检测
    const avif = new Image();
    avif.onload = avif.onerror = () => {
      if (avif.width === 1) {
        this.supportedFormats.add('avif');
      }
    };
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAQAAAAEAAAAEGF2MUOBAAAAAAAAFWF2MUOCAAAACQYBAAEAAAAAABhhdmNCAAAA';
  }

  /**
   * 优化图片
   */
  async optimizeImage(
    src: string,
    alt: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImageResult> {
    const {
      formats = ['avif', 'webp', 'jpg'],
      sizes = [320, 640, 1024, 1600],
      quality = 85,
      lazy = true,
      preload = false,
      responsive = true,
      priority = 'medium',
      placeholder = 'blur',
      blurDataURL,
      aspectRatio
    } = options;

    // 检查缓存
    const cacheKey = `${src}_${JSON.stringify(options)}`;
    if (this.optimizationCache.has(cacheKey)) {
      return this.optimizationCache.get(cacheKey)!;
    }

    // 根据环境调整参数
    const adjustedOptions = this.adjustOptionsByEnvironment({
      formats,
      sizes,
      quality,
      priority
    });

    // 生成优化的图片结果
    const result = this.generateOptimizedImage(src, alt, {
      formats: adjustedOptions.formats,
      sizes: adjustedOptions.sizes,
      quality: adjustedOptions.quality,
      lazy,
      preload,
      responsive,
      priority: adjustedOptions.priority,
      placeholder,
      blurDataURL: blurDataURL || '',
      aspectRatio: aspectRatio || 0
    });

    // 缓存结果
    this.optimizationCache.set(cacheKey, result);

    // 预加载关键图片
    if (preload) {
      this.preloadImage(result.src, priority);
    }

    return result;
  }

  /**
   * 根据环境调整图片加载选项
   */
  private adjustOptionsByEnvironment(options: {
    formats: string[];
    sizes: number[];
    quality: number;
    priority: 'high' | 'medium' | 'low';
  }) {
    let { formats, sizes, quality, priority } = options;

    // 根据网络速度调整
    switch (this.networkSpeed) {
      case 'slow-2g':
      case '2g':
        // 降级到更低质量和更小尺寸
        quality = Math.max(60, quality - 20);
        sizes = sizes.slice(0, 2); // 只使用前两个尺寸
        formats = ['webp', 'jpg']; // 简化格式
        break;
      case '3g':
        // 适度降级
        quality = Math.max(70, quality - 10);
        sizes = sizes.slice(0, 3); // 使用前三个尺寸
        break;
      // 4g和5g保持默认
    }

    // 根据设备类型调整
    if (this.deviceType === 'mobile') {
      sizes = sizes.slice(0, 3); // 移动端使用更小尺寸
    }

    // 根据优先级调整
    if (priority === 'low') {
      quality = Math.max(60, quality - 15);
    }

    return { formats, sizes, quality, priority };
  }

  /**
   * 生成优化的图片
   */
  private generateOptimizedImage(
    src: string,
    alt: string,
    options: Required<ImageOptimizationOptions>
  ): OptimizedImageResult {
    const { formats, sizes, quality, lazy, responsive, priority, placeholder, blurDataURL, aspectRatio } = options;
    
    // 获取支持的格式（按优先级排序）
    const supportedFormats = formats.filter(format => 
      format === 'jpg' || this.supportedFormats.has(format)
    );

    if (supportedFormats.length === 0) {
      supportedFormats.push('jpg'); // 回退到JPG
    }

    // 生成优化的URL
    const optimizedUrls = this.generateOptimizedUrls(src, supportedFormats, sizes, quality);
    
    // 生成srcSet和sizes
    const srcSet = responsive ? this.generateSrcSet(optimizedUrls, sizes) : undefined;
    const sizesAttr = responsive ? this.generateSizes(sizes) : undefined;

    // 选择最佳格式作为src
    const bestFormat = supportedFormats[0];
    const bestSize = sizes[Math.floor(sizes.length / 2)]; // 选择中等大小
    const bestUrl = optimizedUrls.get(`${bestFormat}_${bestSize}`) || src;

    return {
      src: bestUrl,
      srcSet,
      sizes: sizesAttr,
      alt,
      loading: lazy ? 'lazy' : 'eager',
      decoding: 'async',
      placeholder: placeholder === 'blur' ? 'blur' : undefined,
      blurDataURL,
      aspectRatio
    };
  }

  /**
   * 生成优化的URL
   */
  private generateOptimizedUrls(
    src: string,
    formats: string[],
    sizes: number[],
    quality: number
  ): Map<string, string> {
    const urls = new Map<string, string>();
    const baseUrl = this.getBaseUrl(src);
    const extension = this.getFileExtension(src);

    formats.forEach(format => {
      sizes.forEach(size => {
        const key = `${format}_${size}`;
        const optimizedUrl = this.buildOptimizedUrl(baseUrl, extension, format, size, quality);
        urls.set(key, optimizedUrl);
      });
    });

    return urls;
  }

  /**
   * 构建优化的URL
   */
  private buildOptimizedUrl(
    baseUrl: string,
    originalExtension: string,
    targetFormat: string,
    size: number,
    quality: number
  ): string {
    // 这里可以根据实际的图片服务API来构建URL
    // 例如使用Unsplash、Cloudinary等服务
    
    try {
      const url = new URL(baseUrl);
      
      // 添加优化参数
      if (targetFormat !== originalExtension) {
        url.searchParams.set('format', targetFormat);
      }
      
      url.searchParams.set('w', size.toString());
      url.searchParams.set('q', quality.toString());
      
      // 特殊处理Unsplash图片
      if (baseUrl.includes('unsplash.com')) {
        return this.buildUnsplashUrl(baseUrl, size, quality, targetFormat);
      }
      
      // 特殊处理其他CDN服务
      if (baseUrl.includes('cloudinary.com')) {
        return this.buildCloudinaryUrl(baseUrl, size, quality, targetFormat);
      }

      return url.toString();
    } catch (error) {
      console.warn('Failed to build optimized URL:', error);
      return baseUrl;
    }
  }

  /**
   * 构建Unsplash优化URL
   */
  private buildUnsplashUrl(url: string, size: number, quality: number, format: string): string {
    // Unsplash URL优化
    const match = url.match(/photo-([a-zA-Z0-9]+)/);
    if (match) {
      const photoId = match[1];
      return `https://images.unsplash.com/photo-${photoId}?w=${size}&h=${Math.floor(size * 0.75)}&fit=crop&auto=format&quality=${quality}`;
    }
    return url;
  }

  /**
   * 构建Cloudinary优化URL
   */
  private buildCloudinaryUrl(url: string, size: number, quality: number, format: string): string {
    // Cloudinary URL优化
    const transformations = [
      `w_${size}`,
      `q_${quality}`,
      `f_${format}`,
      'c_fill',
      'g_auto'
    ].join(',');
    
    return url.replace('/upload/', `/upload/${transformations}/`);
  }

  /**
   * 生成srcSet
   */
  private generateSrcSet(urls: Map<string, string>, sizes: number[]): string {
    const entries: string[] = [];
    
    sizes.forEach(size => {
      urls.forEach((url, key) => {
        if (key.endsWith(`_${size}`)) {
          entries.push(`${url} ${size}w`);
        }
      });
    });

    return entries.join(', ');
  }

  /**
   * 生成sizes属性
   */
  private generateSizes(sizes: number[]): string {
    const breakpoints = [
      { size: 320, media: '(max-width: 640px)' },
      { size: 640, media: '(max-width: 1024px)' },
      { size: 1024, media: '(max-width: 1600px)' },
      { size: 1600, media: '(min-width: 1601px)' }
    ];

    return breakpoints
      .filter(bp => sizes.includes(bp.size))
      .map(bp => `${bp.media} ${bp.size}px`)
      .join(', ');
  }

  /**
   * 获取基础URL
   */
  private getBaseUrl(src: string): string {
    try {
      return new URL(src).toString();
    } catch {
      // 相对路径处理
      if (typeof window !== 'undefined') {
        return new URL(src, window.location.origin).toString();
      }
      return src;
    }
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const match = pathname.match(/\.([^.]+)$/);
      return match ? match[1].toLowerCase() : 'jpg';
    } catch {
      return 'jpg';
    }
  }

  /**
   * 预加载图片
   */
  private preloadImage(src: string, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    if (priority === 'high') {
      link.setAttribute('fetchpriority', 'high');
    }
    document.head.appendChild(link);
  }

  /**
   * 批量优化图片
   */
  async optimizeImages(
    images: Array<{ src: string; alt: string; options?: ImageOptimizationOptions }>
  ): Promise<OptimizedImageResult[]> {
    // 按优先级排序图片
    const sortedImages = images.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityA = a.options?.priority || 'medium';
      const priorityB = b.options?.priority || 'medium';
      return priorityOrder[priorityA] - priorityOrder[priorityB];
    });

    // 批量优化图片
    const promises = sortedImages.map(({ src, alt, options }) => 
      this.optimizeImage(src, alt, options)
    );
    
    return Promise.all(promises);
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.optimizationCache.clear();
  }

  /**
   * 获取支持的格式
   */
  getSupportedFormats(): string[] {
    return Array.from(this.supportedFormats);
  }

  /**
   * 生成模糊占位符
   */
  generateBlurPlaceholder(src: string, size: number = 16): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve('');
        return;
      }
      
      canvas.width = size;
      canvas.height = size;
      
      const img = new Image();
      img.onload = () => {
        // 绘制缩小的图片
        ctx.drawImage(img, 0, 0, size, size);
        
        // 应用模糊效果
        ctx.filter = 'blur(8px)';
        ctx.drawImage(canvas, 0, 0, size, size);
        
        // 转换为base64
        const dataURL = canvas.toDataURL('image/jpeg', 0.5);
        resolve(dataURL);
      };
      img.onerror = () => {
        resolve('');
      };
      img.src = src;
    });
  }
}

/**
 * 图片懒加载管理器
 */
export class LazyImageManager {
  private static instance: LazyImageManager;
  private observer: IntersectionObserver | null = null;
  private loadingImages: Set<string> = new Set();
  private retryAttempts: Map<string, number> = new Map();

  static getInstance(): LazyImageManager {
    if (!LazyImageManager.instance) {
      LazyImageManager.instance = new LazyImageManager();
    }
    return LazyImageManager.instance;
  }

  private constructor() {
    this.setupIntersectionObserver();
  }

  /**
   * 设置Intersection Observer
   */
  private setupIntersectionObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            this.observer?.unobserve(img);
          }
        });
      },
      {
        rootMargin: '100px', // 提前100px开始加载
        threshold: 0.01
      }
    );
  }

  /**
   * 观察图片元素
   */
  observeImage(img: HTMLImageElement): void {
    if (!this.observer) {
      // 降级方案：立即加载
      this.loadImage(img);
      return;
    }

    this.observer.observe(img);
  }

  /**
   * 加载图片
   */
  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    if (!src || this.loadingImages.has(src)) {
      return;
    }

    this.loadingImages.add(src);

    const tempImg = new Image();
    
    // 设置加载优先级
    if (img.getAttribute('fetchpriority') === 'high') {
      tempImg.fetchPriority = 'high';
    }
    
    tempImg.onload = () => {
      img.src = src;
      img.classList.remove('lazy');
      img.classList.add('loaded');
      this.loadingImages.delete(src);
      this.retryAttempts.delete(src);
      
      // 触发加载完成事件
      img.dispatchEvent(new CustomEvent('imageLoaded'));
    };

    tempImg.onerror = () => {
      this.loadingImages.delete(src);
      
      // 重试逻辑
      const attempts = this.retryAttempts.get(src) || 0;
      if (attempts < 2) {
        this.retryAttempts.set(src, attempts + 1);
        setTimeout(() => {
          this.loadImage(img);
        }, 1000 * (attempts + 1));
      } else {
        img.classList.add('error');
        this.retryAttempts.delete(src);
        
        // 触发加载错误事件
        img.dispatchEvent(new CustomEvent('imageError'));
      }
    };

    tempImg.src = src;
  }

  /**
   * 批量观察图片元素
   */
  observeImages(images: HTMLImageElement[]): void {
    images.forEach(img => this.observeImage(img));
  }

  /**
   * 断开观察器
   */
  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * 重新连接观察器
   */
  reconnect(): void {
    if (!this.observer) {
      this.setupIntersectionObserver();
    }
  }
}

// 导出单例实例
export const imageOptimizer = ImageOptimizer.getInstance();
export const lazyImageManager = LazyImageManager.getInstance();

// 默认导出
export default imageOptimizer;
