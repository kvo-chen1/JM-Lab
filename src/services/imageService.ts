// 图片服务层 - 统一管理图片请求、缓存和错误处理

// 图片缓存接口 - 增强版
interface ImageCacheItem {
  url: string;
  timestamp: number;
  success: boolean;
  loadTime?: number; // 加载时间（毫秒）
  size?: number; // 图片大小（字节）
  usageCount: number; // 使用次数，用于缓存替换策略
  lastUsed: number; // 最后使用时间，用于缓存替换策略
  width?: number; // 图片宽度
  height?: number; // 图片高度
  format?: string; // 图片格式
  quality?: number; // 图片质量
}

// 图片服务配置 - 增强版
interface ImageServiceConfig {
  maxCacheSize: number;
  cacheTTL: number; // 缓存过期时间（毫秒）
  maxRetries: number;
  retryDelay: (attempt: number) => number; // 重试延迟策略
  preloadDistance: number; // 预加载距离（像素）
  enableWebP: boolean; // 是否启用WebP格式
  enableAVIF: boolean; // 是否启用AVIF格式
  enableResponsiveLoading: boolean; // 是否启用响应式加载
  enablePriorityLoading: boolean; // 是否启用优先级加载
  enablePredictiveLoading: boolean; // 是否启用预测性加载
  enableImageCompression: boolean; // 是否启用图片压缩
  compressionQuality: number; // 默认压缩质量
  cacheStrategy: 'LRU' | 'LFU' | 'MRU'; // 缓存替换策略
}

// 响应式图片尺寸选项
const RESPONSIVE_SIZES = {
  sm: { width: 320, quality: 70 },
  md: { width: 640, quality: 80 },
  lg: { width: 1200, quality: 90 },
  xl: { width: 1920, quality: 95 },
};

// 默认配置 - 增强版
const DEFAULT_CONFIG: ImageServiceConfig = {
  maxCacheSize: 1000, // 进一步增加缓存大小，提高缓存命中率
  cacheTTL: 7 * 24 * 60 * 60 * 1000, // 延长缓存时间到7天
  maxRetries: 3,
  retryDelay: (attempt: number) => Math.min(300 * Math.pow(2, attempt) + Math.random() * 100, 2000), // 带随机抖动的重试延迟
  preloadDistance: 800, // 进一步增加预加载距离，提前加载图片
  enableWebP: true, // 是否启用WebP格式
  enableAVIF: true, // 是否启用AVIF格式
  enableResponsiveLoading: true, // 是否启用响应式加载
  enablePriorityLoading: true, // 是否启用优先级加载
  enablePredictiveLoading: true, // 是否启用预测性加载
  enableImageCompression: true, // 是否启用图片压缩
  compressionQuality: 85, // 默认压缩质量
  cacheStrategy: 'LRU', // 缓存替换策略：LRU, LFU, MRU
};

// 图片服务类 - 增强版
class ImageService {
  private cache: Map<string, ImageCacheItem> = new Map();
  private config: ImageServiceConfig;
  private inProgressRequests: Map<string, Promise<string>> = new Map();
  private preloadedUrls: Set<string> = new Set();
  private preloadObserver: IntersectionObserver | null = null;
  private stats = {
    totalRequests: 0,
    cacheHits: 0,
    loadSuccess: 0,
    loadFailed: 0,
    totalLoadTime: 0, // 总加载时间
    averageLoadTime: 0, // 平均加载时间
    totalSize: 0, // 总图片大小
    averageSize: 0, // 平均图片大小
    cacheHitRate: 0, // 缓存命中率
    successRate: 0, // 加载成功率
    preloadCount: 0, // 预加载数量
    preloadHitCount: 0, // 预加载命中数量
    preloadHitRate: 0, // 预加载命中率
  };
  private predictiveUrls: Set<string> = new Set(); // 预测性加载的URL集合
  private pageTransitionHistory: string[] = []; // 页面访问历史，用于预测性加载
  private concurrentPreloadLimit: number; // 并发预加载限制（动态调整）
  private pendingPreloads: string[] = []; // 等待预加载的URL队列
  private currentPreloadCount: number = 0; // 当前正在预加载的数量
  private networkCondition: 'slow' | 'medium' | 'fast' = 'medium'; // 网络条件
  private devicePerformance: 'low' | 'medium' | 'high' = 'medium'; // 设备性能

  constructor(config: Partial<ImageServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cleanupCache();
    this.initPreloadObserver();
    this.initPredictiveLoading();
    this.detectNetworkCondition();
    this.detectDevicePerformance();
    this.concurrentPreloadLimit = this.getDynamicPreloadLimit();
    // 监听网络条件变化
    this.setupNetworkListeners();
  }
  
  // 检测网络条件
  private detectNetworkCondition(): void {
    if ('connection' in navigator) {
      const connection = navigator.connection as any;
      
      // 初始网络条件检测
      this.updateNetworkCondition(connection);
    }
  }
  
  // 更新网络条件
  private updateNetworkCondition(connection: any): void {
    const effectiveType = connection.effectiveType || '4g';
    const downlink = connection.downlink || 10;
    
    if (effectiveType.includes('2g') || downlink < 1) {
      this.networkCondition = 'slow';
    } else if (effectiveType.includes('3g') || downlink < 5) {
      this.networkCondition = 'medium';
    } else {
      this.networkCondition = 'fast';
    }
  }
  
  // 检测设备性能
  private detectDevicePerformance(): void {
    // 基于设备硬件并发数和内存大小检测性能
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4;
    
    if (hardwareConcurrency <= 2 || memory <= 2) {
      this.devicePerformance = 'low';
    } else if (hardwareConcurrency <= 4 || memory <= 4) {
      this.devicePerformance = 'medium';
    } else {
      this.devicePerformance = 'high';
    }
  }
  
  // 动态调整预加载限制
  private getDynamicPreloadLimit(): number {
    // 基于网络条件和设备性能动态调整并发预加载限制
    let limit = 3;
    
    // 网络条件权重
    switch (this.networkCondition) {
      case 'slow':
        limit -= 1;
        break;
      case 'fast':
        limit += 2;
        break;
    }
    
    // 设备性能权重
    switch (this.devicePerformance) {
      case 'low':
        limit -= 1;
        break;
      case 'high':
        limit += 1;
        break;
    }
    
    // 确保限制在合理范围内
    return Math.max(1, Math.min(8, limit));
  }
  
  // 设置网络监听器
  private setupNetworkListeners(): void {
    if ('connection' in navigator) {
      const connection = navigator.connection as any;
      
      connection.addEventListener('change', () => {
        this.updateNetworkCondition(connection);
        this.concurrentPreloadLimit = this.getDynamicPreloadLimit();
      });
    }
  }

  // 初始化预加载观察者
  private initPreloadObserver(): void {
    if ('IntersectionObserver' in window) {
      // 根据设备性能和网络条件动态调整预加载距离
      const preloadDistance = this.getDynamicPreloadDistance();
      
      this.preloadObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // 元素进入预加载区域，预加载图片
              const imgUrl = entry.target.getAttribute('data-preload-img');
              if (imgUrl) {
                this.preloadImage(imgUrl);
              }
              this.preloadObserver?.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: `${preloadDistance}px 0px`,
          threshold: 0,
        }
      );
    }
  }
  
  // 获取动态预加载距离
  private getDynamicPreloadDistance(): number {
    // 基于设备性能和网络条件动态调整预加载距离
    let distance = this.config.preloadDistance;
    
    // 设备性能影响：高性能设备可以提前预加载
    switch (this.devicePerformance) {
      case 'high':
        distance += 200;
        break;
      case 'low':
        distance -= 150;
        break;
    }
    
    // 网络条件影响：慢网络减少预加载距离
    switch (this.networkCondition) {
      case 'slow':
        distance -= 200;
        break;
      case 'fast':
        distance += 150;
        break;
    }
    
    // 确保预加载距离在合理范围内
    return Math.max(100, Math.min(1000, distance));
  }

  // 初始化预测性加载
  private initPredictiveLoading(): void {
    if (!this.config.enablePredictiveLoading) return;
    
    // 监听页面导航事件，收集页面访问历史
    window.addEventListener('popstate', (event) => {
      this.updatePageTransitionHistory(window.location.pathname);
      this.predictiveLoadImages();
    });
    
    // 监听链接点击事件，预测下一个页面
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.href) {
        const url = new URL(link.href);
        if (url.origin === window.location.origin) {
          this.updatePageTransitionHistory(url.pathname);
          this.predictiveLoadImages();
        }
      }
    });
  }
  
  // 更新页面访问历史
  private updatePageTransitionHistory(path: string): void {
    // 限制历史记录长度，避免占用过多内存
    const maxHistoryLength = 10;
    this.pageTransitionHistory.push(path);
    if (this.pageTransitionHistory.length > maxHistoryLength) {
      this.pageTransitionHistory.shift();
    }
  }
  
  // 预测性加载图片
  private predictiveLoadImages(): void {
    // 简单的预测策略：基于页面访问历史，预测用户可能访问的下一个页面
    // 实际项目中可以使用更复杂的机器学习算法
    const currentPath = window.location.pathname;
    const nextPath = this.predictNextPage(currentPath);
    if (nextPath) {
      // 根据预测的下一个页面，加载相关图片
      this.loadPageImages(nextPath);
    }
  }
  
  // 预测下一个可能访问的页面
  private predictNextPage(currentPath: string): string | null {
    // 简单的预测策略：基于页面访问历史中当前页面后面出现最多的页面
    // 实际项目中可以使用更复杂的机器学习算法
    const nextPages: Record<string, number> = {};
    
    for (let i = 0; i < this.pageTransitionHistory.length - 1; i++) {
      if (this.pageTransitionHistory[i] === currentPath) {
        const nextPage = this.pageTransitionHistory[i + 1];
        nextPages[nextPage] = (nextPages[nextPage] || 0) + 1;
      }
    }
    
    // 找到出现次数最多的下一个页面
    let mostLikelyNextPage: string | null = null;
    let maxCount = 0;
    
    for (const [page, count] of Object.entries(nextPages)) {
      if (count > maxCount) {
        mostLikelyNextPage = page;
        maxCount = count;
      }
    }
    
    return mostLikelyNextPage;
  }
  
  // 加载页面相关的图片（模拟实现）
  private loadPageImages(pagePath: string): void {
    // 模拟实现：根据页面路径加载相关图片
    // 实际项目中可以根据路由配置或API获取页面需要的图片列表
    const pageImageMap: Record<string, string[]> = {
      '/home': ['/api/proxy/trae-api/home-banner.jpg', '/api/proxy/trae-api/featured-1.jpg', '/api/proxy/trae-api/featured-2.jpg'],
      '/explore': ['/api/proxy/trae-api/explore-banner.jpg', '/api/proxy/trae-api/popular-1.jpg', '/api/proxy/trae-api/popular-2.jpg'],
      '/create': ['/api/proxy/trae-api/create-banner.jpg', '/api/proxy/trae-api/tools-1.jpg', '/api/proxy/trae-api/tools-2.jpg'],
      '/community': ['/api/proxy/trae-api/community-banner.jpg', '/api/proxy/trae-api/discussion-1.jpg', '/api/proxy/trae-api/discussion-2.jpg'],
      '/dashboard': ['/api/proxy/trae-api/dashboard-banner.jpg', '/api/proxy/trae-api/stats-1.jpg', '/api/proxy/trae-api/stats-2.jpg'],
    };
    
    const images = pageImageMap[pagePath] || [];
    this.preloadImages(images);
  }
  
  // 清理过期缓存 - 实现不同的缓存策略
  private cleanupCache(): void {
    const now = Date.now();
    
    // 删除过期缓存
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.config.cacheTTL) {
        this.cache.delete(key);
      }
    }
    
    // 如果缓存超过最大大小，根据缓存策略删除条目
    while (this.cache.size > this.config.maxCacheSize) {
      let keyToDelete: string;
      
      switch (this.config.cacheStrategy) {
        case 'LRU':
          // 最近最少使用：删除最后使用时间最早的条目
          keyToDelete = Array.from(this.cache.entries())
            .sort((a, b) => a[1].lastUsed - b[1].lastUsed)[0][0];
          break;
        case 'LFU':
          // 最不经常使用：删除使用次数最少的条目
          keyToDelete = Array.from(this.cache.entries())
            .sort((a, b) => a[1].usageCount - b[1].usageCount)[0][0];
          break;
        case 'MRU':
          // 最近最常使用：删除最后使用时间最近的条目（适合大文件）
          keyToDelete = Array.from(this.cache.entries())
            .sort((a, b) => b[1].lastUsed - a[1].lastUsed)[0][0];
          break;
        default:
          // 默认使用LRU策略
          keyToDelete = Array.from(this.cache.entries())
            .sort((a, b) => a[1].lastUsed - b[1].lastUsed)[0][0];
          break;
      }
      
      this.cache.delete(keyToDelete);
    }
  }

  // 生成标准化的图片URL
  public normalizeUrl(url: string): string {
    try {
      // 清理URL，移除多余空格和无效字符
      let cleanedUrl = url.trim().replace(/[\s\t\n\r]+/g, '');
      
      // 检查是否为base64编码的图片数据
      if (cleanedUrl.startsWith('data:')) {
        return cleanedUrl;
      }
      
      // 检查是否为完整的URL
      const urlObj = cleanedUrl.startsWith('http') ? new URL(cleanedUrl) : new URL(cleanedUrl, window.location.origin);
      
      // 对于GitHub相关的图片URL，直接返回，不进行标准化处理
      if (urlObj.hostname.includes('github.com') || urlObj.hostname.includes('raw.githubusercontent.com')) {
        return urlObj.toString();
      }
      
      // 移除不必要的参数或标准化参数顺序
      const params = new URLSearchParams(urlObj.search);
      params.sort();
      urlObj.search = params.toString();
      
      // 移除URL末尾的斜杠
      if (urlObj.pathname.endsWith('/') && urlObj.pathname.length > 1) {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }
      
      return urlObj.toString();
    } catch (error) {
      console.error(`[ImageService] URL标准化失败: ${url}`, error);
      return url;
    }
  }

  // 检测浏览器支持的图片格式
  private detectSupportedFormats(): { webp: boolean; avif: boolean } {
    // 检测WebP支持
    const supportsWebP = (() => {
      try {
        return document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
      } catch {
        return false;
      }
    })();
    
    // 检测AVIF支持
    const supportsAVIF = (() => {
      try {
        return document.createElement('canvas').toDataURL('image/avif').indexOf('data:image/avif') === 0;
      } catch {
        return false;
      }
    })();
    
    return { webp: supportsWebP, avif: supportsAVIF };
  }
  
  // 生成响应式图片URL - 智能优化版
  public getResponsiveUrl(url: string, size: keyof typeof RESPONSIVE_SIZES = 'md', quality?: number): string {
    // 处理图片生成API的URL，检查代理路径或原始域名
    if (url.includes('/api/proxy/trae-api') || url.includes('trae-api-sg.mchost.guru')) {
      try {
        // 确保URL是完整的
        const urlObj = url.startsWith('http') ? new URL(url) : new URL(url, window.location.origin);
        
        // 注意：AI生成API返回302重定向，不要添加额外参数，否则可能导致重定向失败
        // 直接返回原始URL，让浏览器处理重定向
        return urlObj.toString();
      } catch (error) {
        return url;
      }
    }
    
    // 对于GitHub图片，不要添加响应式参数，直接返回原始URL
    if (url.includes('github.com') || url.includes('raw.githubusercontent.com')) {
      return url;
    }
    
    // 对于普通图片，生成响应式URL
    try {
      // 检查是否为完整的URL
      const urlObj = url.startsWith('http') ? new URL(url) : new URL(url, window.location.origin);
      const sizeInfo = RESPONSIVE_SIZES[size];
      const finalQuality = quality || sizeInfo.quality;
      
      // 添加响应式参数
      urlObj.searchParams.set('w', sizeInfo.width.toString());
      urlObj.searchParams.set('q', finalQuality.toString());
      
      return urlObj.toString();
    } catch (error) {
      // 如果URL处理失败，返回原始URL
      return url;
    }
  }

  // 生成低质量占位图URL - 优化版
  public getLowQualityUrl(url: string): string {
    // 处理图片生成API的URL，检查代理路径或原始域名
    if (url.includes('/api/proxy/trae-api') || url.includes('trae-api-sg.mchost.guru')) {
      try {
        // 确保URL是完整的
        const urlObj = url.startsWith('http') ? new URL(url) : new URL(url, window.location.origin);
        
        // 注意：AI生成API返回302重定向，不要添加额外参数，否则可能导致重定向失败
        // 直接返回原始URL
        return urlObj.toString();
      } catch (error) {
        return url;
      }
    }
    
    // 对于GitHub图片，不要添加低质量参数，直接返回原始URL
    if (url.includes('github.com') || url.includes('raw.githubusercontent.com')) {
      return url;
    }
    
    // 对于普通图片，生成低质量占位图URL
    try {
      // 检查是否为完整的URL
      const urlObj = url.startsWith('http') ? new URL(url) : new URL(url, window.location.origin);
      
      // 添加低质量参数
      urlObj.searchParams.set('w', '100');
      urlObj.searchParams.set('q', '20');
      
      return urlObj.toString();
    } catch (error) {
      // 如果URL处理失败，返回原始URL
      return url;
    }
  }

  // 生成备用图片URL - 根据alt文本生成不同的备用图片
  public getFallbackUrl(alt: string): string {
    // 检查当前部署环境，返回正确的占位图片路径
    // 对于GitHub Pages部署，需要包含base路径/jinmai-lab/
    // 对于Vercel部署（jinmai-lab.tech），直接使用根路径
    const isGithubPages = window.location.hostname.includes('github.io');
    const isVercel = window.location.hostname.includes('jinmai-lab.tech');
    const basePath = isGithubPages ? '/jinmai-lab/' : '/';
    return `${basePath}images/placeholder-image.jpg`;
  }

  // 检查URL是否为有效图片URL
  private isValidImageUrl(url: string): boolean {
    // 支持相对路径
    if (url.startsWith('/')) {
      return true;
    }
    
    // 支持base64编码的图片数据
    if (url.startsWith('data:')) {
      return true;
    }
    
    // 支持完整的HTTP/HTTPS URL
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  // 预加载图片 - 带并发控制
  public preloadImage(url: string): void {
    if (this.preloadedUrls.has(url)) {
      return;
    }
    
    this.preloadedUrls.add(url);
    this.pendingPreloads.push(url);
    this.stats.preloadCount++;
    this.processPreloadQueue();
  }
  
  // 处理预加载队列
  private processPreloadQueue(): void {
    // 如果当前正在预加载的图片数量小于限制，并且有待处理的预加载任务
    while (this.currentPreloadCount < this.concurrentPreloadLimit && this.pendingPreloads.length > 0) {
      const url = this.pendingPreloads.shift()!;
      this.loadPreloadImage(url);
    }
  }
  
  // 实际加载预加载图片
  private loadPreloadImage(url: string, retries: number = 0): void {
    this.currentPreloadCount++;
    
    const img = new Image();
    const startTime = Date.now();
    
    // 设置图片加载超时
    const timeoutId = setTimeout(() => {
      img.src = ''; // 中止图片加载
      this.handlePreloadError(url, retries);
    }, 5000);
    
    img.onload = () => {
      clearTimeout(timeoutId);
      const loadTime = Date.now() - startTime;
      this.updateImageStatus(url, true, img.naturalWidth * img.naturalHeight);
      this.stats.totalLoadTime += loadTime;
      this.stats.preloadHitCount++;
      this.currentPreloadCount--;
      this.processPreloadQueue(); // 继续处理队列中的下一个预加载任务
    };
    img.onerror = () => {
      clearTimeout(timeoutId);
      this.handlePreloadError(url, retries);
    };
    
    img.src = url;
  }
  
  // 处理预加载图片加载失败
  private handlePreloadError(url: string, retries: number): void {
    if (retries < this.config.maxRetries) {
      // 重试加载图片
      setTimeout(() => {
        this.loadPreloadImage(url, retries + 1);
      }, this.config.retryDelay(retries));
    } else {
      // 达到最大重试次数，标记为失败
      this.updateImageStatus(url, false);
      this.currentPreloadCount--;
      this.processPreloadQueue(); // 继续处理队列中的下一个预加载任务
    }
  }

  // 批量预加载图片
  public preloadImages(urls: string[]): void {
    urls.forEach(url => this.preloadImage(url));
  }

  // 观察元素以进行图片预加载
  public observeForPreload(element: HTMLElement, imgUrl: string): void {
    if (this.preloadObserver) {
      element.setAttribute('data-preload-img', imgUrl);
      this.preloadObserver.observe(element);
    }
  }

  // 验证图片URL是否可访问
  private async validateImageUrl(url: string, retries: number = 0): Promise<boolean> {
    if (!this.isValidImageUrl(url)) {
      return false;
    }

    try {
      // 实现手动超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 缩短超时时间

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const contentType = response.headers.get('content-type');
      return response.ok && (contentType?.startsWith('image/') || false);
    } catch (error) {
      if (retries < this.config.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay(retries)));
        return this.validateImageUrl(url, retries + 1);
      }
      return false;
    }
  }

  // 获取可靠的图片URL（包含验证和重试逻辑）- 增强版
  public async getReliableImageUrl(
    url: string,
    alt: string,
    options?: { priority?: boolean; validate?: boolean; size?: keyof typeof RESPONSIVE_SIZES; quality?: number }
  ): Promise<string> {
    const normalizedUrl = this.normalizeUrl(url);
    const { 
      priority = false, 
      validate = true, // 默认启用验证
      size = 'md',
      quality 
    } = options || {};

    this.stats.totalRequests++;

    // 清理过期缓存
    this.cleanupCache();

    // 检查缓存
    let cachedItem = this.cache.get(normalizedUrl);
    if (cachedItem) {
      // 更新缓存项的使用次数和最后使用时间
      cachedItem.usageCount++;
      cachedItem.lastUsed = Date.now();
      this.cache.set(normalizedUrl, cachedItem);
      
      this.stats.cacheHits++;
      return cachedItem.success ? this.getResponsiveUrl(normalizedUrl, size, quality) : this.getFallbackUrl(alt);
    }

    // 检查是否已有进行中的请求
    if (this.inProgressRequests.has(normalizedUrl)) {
      return this.inProgressRequests.get(normalizedUrl)!;
    }

    // 检查URL是否为有效格式
    if (!this.isValidImageUrl(normalizedUrl)) {
      // 无效URL，直接返回备用图片
      this.cache.set(normalizedUrl, {
        url: normalizedUrl,
        timestamp: Date.now(),
        success: false,
        usageCount: 1,
        lastUsed: Date.now(),
      });
      return this.getFallbackUrl(alt);
    }

    // 初始化缓存项，默认失败，后续通过验证或图片加载事件更新
    this.cache.set(normalizedUrl, {
      url: normalizedUrl,
      timestamp: Date.now(),
      success: false, // 默认认为失败，后续通过验证或加载事件修正
      usageCount: 1,
      lastUsed: Date.now(),
      format: this.detectSupportedFormats().avif ? 'avif' : (this.detectSupportedFormats().webp ? 'webp' : undefined),
      quality: quality || RESPONSIVE_SIZES[size].quality,
    });

    const finalUrl = this.getResponsiveUrl(normalizedUrl, size, quality);
    
    // 高优先级图片立即预加载
    if (priority) {
      this.preloadImage(finalUrl);
    }
    
    return finalUrl;
  }

  // 批量获取可靠的图片URL
  public async getReliableImageUrls(
    urls: { url: string; alt: string }[],
    options?: { priority?: boolean; validate?: boolean; size?: keyof typeof RESPONSIVE_SIZES; quality?: number }
  ): Promise<string[]> {
    return Promise.all(
      urls.map(({ url, alt }) => this.getReliableImageUrl(url, alt, options))
    );
  }

  // 更新缓存中的图片状态
  public updateImageStatus(url: string, success: boolean, size?: number): void {
    const normalizedUrl = this.normalizeUrl(url);
    
    if (success) {
      this.stats.loadSuccess++;
    } else {
      this.stats.loadFailed++;
    }
    
    // 获取现有缓存项，保留原有字段
    const existingItem = this.cache.get(normalizedUrl);
    
    // 计算平均加载时间和平均大小
    if (existingItem?.loadTime) {
      this.stats.totalLoadTime += existingItem.loadTime;
      const totalLoads = this.stats.loadSuccess + this.stats.loadFailed;
      this.stats.averageLoadTime = totalLoads > 0 ? Math.round(this.stats.totalLoadTime / totalLoads) : 0;
    }
    
    if (size) {
      this.stats.totalSize += size;
      const totalLoads = this.stats.loadSuccess + this.stats.loadFailed;
      this.stats.averageSize = totalLoads > 0 ? Math.round(this.stats.totalSize / totalLoads) : 0;
    }
    
    // 更新缓存命中率和成功率
    if (this.stats.totalRequests > 0) {
      this.stats.cacheHitRate = Math.round((this.stats.cacheHits / this.stats.totalRequests) * 100);
    }
    
    const totalLoads = this.stats.loadSuccess + this.stats.loadFailed;
    if (totalLoads > 0) {
      this.stats.successRate = Math.round((this.stats.loadSuccess / totalLoads) * 100);
    }
    
    // 更新预加载命中率
    if (this.stats.preloadCount > 0) {
      this.stats.preloadHitRate = Math.round((this.stats.preloadHitCount / this.stats.preloadCount) * 100);
    }
    
    // 设置或更新缓存项
    this.cache.set(normalizedUrl, {
      url: normalizedUrl,
      timestamp: Date.now(),
      success,
      size,
      usageCount: existingItem?.usageCount || 1,
      lastUsed: Date.now(), // 每次更新都刷新最后使用时间
      format: existingItem?.format,
      quality: existingItem?.quality,
      width: existingItem?.width,
      height: existingItem?.height,
      loadTime: existingItem?.loadTime,
    });
    
    // 清理过期缓存
    this.cleanupCache();
  }

  // 清除特定URL的缓存
  public clearCache(url?: string): void {
    if (url) {
      const normalizedUrl = this.normalizeUrl(url);
      this.cache.delete(normalizedUrl);
      this.preloadedUrls.delete(normalizedUrl);
    } else {
      this.cache.clear();
      this.preloadedUrls.clear();
    }
  }

  // 获取缓存统计信息
  public getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    successRate: number;
  } {
    const hitRate = this.stats.totalRequests > 0 
      ? Math.round((this.stats.cacheHits / this.stats.totalRequests) * 100) 
      : 0;
    
    const totalLoads = this.stats.loadSuccess + this.stats.loadFailed;
    const successRate = totalLoads > 0 
      ? Math.round((this.stats.loadSuccess / totalLoads) * 100) 
      : 0;
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxCacheSize,
      hitRate,
      successRate,
    };
  }

  // 获取性能统计信息
  public getPerformanceStats() {
    return { ...this.stats };
  }

  // 重置统计信息
  public resetStats(): void {
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      loadSuccess: 0,
      loadFailed: 0,
      totalLoadTime: 0,
      averageLoadTime: 0,
      totalSize: 0,
      averageSize: 0,
      cacheHitRate: 0,
      successRate: 0,
      preloadCount: 0,
      preloadHitCount: 0,
      preloadHitRate: 0,
    };
  }
}

// 创建单例实例
const imageService = new ImageService();

// 将文件转换为 Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// 图片上传功能扩展
// 设置：是否优先使用后端 API 上传（避免 Supabase Storage RLS 问题）
// 如果 Supabase Storage 已配置好 RLS 策略，可以设置为 false
const PREFER_BACKEND_UPLOAD = false;

// 默认 Storage bucket 名称
const DEFAULT_BUCKET = 'works';

export const uploadImage = async (file: File, folder: string = 'works'): Promise<string> => {
  try {
    // 动态导入 supabase 避免循环依赖
    const { supabaseAdmin, isSupabaseConfigured } = await import('@/lib/supabase');

    // 检查 supabase 是否配置正确
    if (!isSupabaseConfigured() || !supabaseAdmin || !supabaseAdmin.storage) {
      console.error('Supabase not configured, cannot upload image');
      throw new Error('Supabase 未配置，无法上传图片');
    }

    // 生成唯一文件名
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`; // 使用指定的子目录

    // 使用 supabaseAdmin 上传到 works bucket（绕过 RLS）
    const { error: uploadError } = await supabaseAdmin.storage
      .from(DEFAULT_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw new Error(`上传到 Supabase 失败: ${uploadError.message}`);
    }

    // 获取公开 URL
    const { data } = supabaseAdmin.storage
      .from(DEFAULT_BUCKET)
      .getPublicUrl(filePath);

    if (!data.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    console.log('[uploadImage] Image uploaded successfully:', data.publicUrl);
    return data.publicUrl;
  } catch (error: any) {
    console.error('Image upload failed:', error);
    throw new Error('图片上传失败: ' + (error.message || 'Unknown error'));
  }
};

// 头像 bucket 名称
const AVATARS_BUCKET = 'avatars';

// 专门用于上传头像的函数
export const uploadAvatar = async (file: File): Promise<string> => {
  try {
    // 动态导入 supabase 避免循环依赖
    const { supabaseAdmin, isSupabaseConfigured } = await import('@/lib/supabase');

    // 检查 supabase 是否配置正确
    if (!isSupabaseConfigured() || !supabaseAdmin || !supabaseAdmin.storage) {
      console.error('Supabase not configured, cannot upload avatar');
      throw new Error('Supabase 未配置，无法上传头像');
    }

    // 生成唯一文件名
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`; // 直接上传到 avatars bucket 根目录

    // 使用 supabaseAdmin 上传到 avatars bucket（绕过 RLS）
    const { error: uploadError } = await supabaseAdmin.storage
      .from(AVATARS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase avatar upload error:', uploadError);
      throw new Error(`上传到 Supabase 失败: ${uploadError.message}`);
    }

    // 获取公开 URL
    const { data } = supabaseAdmin.storage
      .from(AVATARS_BUCKET)
      .getPublicUrl(filePath);

    if (!data.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    console.log('[uploadAvatar] Avatar uploaded successfully:', data.publicUrl);
    return data.publicUrl;
  } catch (error: any) {
    console.error('Avatar upload failed:', error);
    throw new Error('头像上传失败: ' + (error.message || 'Unknown error'));
  }
};

// 后端 API 上传函数
async function uploadToBackend(file: File): Promise<string> {
  try {
    console.log('[uploadToBackend] Uploading file:', file.name, 'type:', file.type);
    
    // 将文件转换为 base64
    const base64Data = await fileToBase64(file);
    
    // 获取 token
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token');
    }
    
    // 调用后端 API 上传
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fileData: base64Data,
        fileName: file.name,
        fileType: file.type
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }
    
    const result = await response.json();
    console.log('[uploadToBackend] Upload successful:', result.data.url);
    
    // 返回完整的 URL
    return `${window.location.origin}${result.data.url}`;
  } catch (error) {
    console.error('[uploadToBackend] Upload failed:', error);
    // 如果后端上传也失败，使用 Blob URL 作为最终备用方案
    console.warn('Backend upload failed, using blob URL as final fallback');
    return URL.createObjectURL(file);
  }
}

// 视频上传功能
export const uploadVideo = async (file: File): Promise<string> => {
  try {
    console.log('[uploadVideo] Uploading video:', file.name, 'size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    
    // 复用图片上传逻辑，但使用视频专用的存储路径
    const { supabaseAdmin, isSupabaseConfigured } = await import('@/lib/supabase');
    
    // 检查 supabase 是否配置正确
    if (!isSupabaseConfigured() || !supabaseAdmin || !supabaseAdmin.storage) {
      console.error('Supabase not configured, cannot upload video');
      throw new Error('Supabase 未配置，无法上传视频');
    }
    
    // 生成唯一文件名
    const fileExt = file.name.split('.').pop() || 'mp4';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `videos/${fileName}`; // 使用 videos 子目录

    // 使用 supabaseAdmin 上传到 works bucket（绕过 RLS）
    const { error: uploadError } = await supabaseAdmin.storage
      .from(DEFAULT_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'video/mp4'
      });

    if (uploadError) {
      console.error('Supabase video upload error:', uploadError);
      throw new Error(`上传到 Supabase 失败: ${uploadError.message}`);
    }

    // 获取公开 URL
    const { data } = supabaseAdmin.storage
      .from(DEFAULT_BUCKET)
      .getPublicUrl(filePath);

    if (!data.publicUrl) {
      throw new Error('Failed to get public URL for video');
    }

    console.log('[uploadVideo] Video uploaded successfully:', data.publicUrl);
    return data.publicUrl;
  } catch (error: any) {
    console.error('Video upload failed:', error);
    throw new Error('视频上传失败: ' + (error.message || 'Unknown error'));
  }
};

// 下载视频并上传到永久存储
export const downloadAndUploadVideo = async (videoUrl: string): Promise<string> => {
  try {
    console.log('[downloadAndUploadVideo] Downloading video from:', videoUrl);
    
    // 使用后端代理下载视频（解决CORS问题）
    const proxyResponse = await fetch('/api/video/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoUrl })
    });
    
    if (!proxyResponse.ok) {
      const errorData = await proxyResponse.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to download video: ${proxyResponse.status}`);
    }
    
    const result = await proxyResponse.json();
    if (result.code !== 0 || !result.data?.base64) {
      throw new Error(result.message || 'Failed to download video');
    }
    
    console.log('[downloadAndUploadVideo] Video downloaded via proxy, size:', (result.data.size / 1024 / 1024).toFixed(2), 'MB');
    
    // 将base64转换为Blob
    const base64Data = result.data.base64;
    const base64Content = base64Data.split(',')[1];
    const contentType = result.data.type || 'video/mp4';
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });
    
    // 创建 File 对象
    const fileName = `video-${Date.now()}.mp4`;
    const file = new File([blob], fileName, { type: contentType });
    
    // 上传视频
    const uploadedUrl = await uploadVideo(file);
    console.log('[downloadAndUploadVideo] Video uploaded to:', uploadedUrl);
    
    return uploadedUrl;
  } catch (error: any) {
    console.error('[downloadAndUploadVideo] Failed:', error);
    throw new Error('视频下载或上传失败: ' + (error.message || 'Unknown error'));
  }
};

// 下载图片并上传到永久存储
export const downloadAndUploadImage = async (imageUrl: string, folder: string = 'works'): Promise<string> => {
  try {
    console.log('[downloadAndUploadImage] Downloading image from:', imageUrl);
    
    // 使用后端代理下载图片（解决CORS问题）
    const proxyResponse = await fetch('/api/image/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl })
    });
    
    if (!proxyResponse.ok) {
      const errorData = await proxyResponse.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to download image: ${proxyResponse.status}`);
    }
    
    const result = await proxyResponse.json();
    if (result.code !== 0 || !result.data?.base64) {
      throw new Error(result.message || 'Failed to download image');
    }
    
    console.log('[downloadAndUploadImage] Image downloaded via proxy, size:', (result.data.size / 1024).toFixed(2), 'KB');
    
    // 将base64转换为Blob
    const base64Data = result.data.base64;
    const base64Content = base64Data.split(',')[1];
    const contentType = result.data.type || 'image/jpeg';
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });
    
    // 创建 File 对象
    const fileName = `image-${Date.now()}.${contentType.split('/')[1] || 'jpg'}`;
    const file = new File([blob], fileName, { type: contentType });
    
    // 上传图片
    const uploadedUrl = await uploadImage(file, folder);
    console.log('[downloadAndUploadImage] Image uploaded to:', uploadedUrl);
    
    return uploadedUrl;
  } catch (error: any) {
    console.error('[downloadAndUploadImage] Failed:', error);
    throw new Error('图片下载或上传失败: ' + (error.message || 'Unknown error'));
  }
};

/**
 * 将 base64 图片数据上传到云存储，获取公网可访问的 URL
 * 用于图生视频等功能，因为 AI API 要求图片必须是公网 URL
 * @param base64Data base64 编码的图片数据 (data:image/...)
 * @returns 公网可访问的图片 URL
 */
export const uploadBase64Image = async (base64Data: string): Promise<string> => {
  try {
    console.log('[uploadBase64Image] Uploading base64 image...');
    
    // 验证 base64 数据格式
    if (!base64Data.startsWith('data:image/')) {
      throw new Error('Invalid base64 image data format');
    }
    
    // 解析 base64 数据
    const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid base64 image data format');
    }
    
    const imageType = matches[1];
    const base64Content = matches[2];
    
    // 将 base64 转换为 Blob
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: `image/${imageType}` });
    
    // 创建 File 对象
    const fileName = `image-${Date.now()}.${imageType}`;
    const file = new File([blob], fileName, { type: `image/${imageType}` });
    
    console.log('[uploadBase64Image] Created file:', fileName, 'size:', (file.size / 1024).toFixed(2), 'KB');
    
    // 使用现有的 uploadImage 函数上传
    const publicUrl = await uploadImage(file);
    
    console.log('[uploadBase64Image] Upload successful:', publicUrl);
    return publicUrl;
  } catch (error: any) {
    console.error('[uploadBase64Image] Failed:', error);
    throw new Error('图片上传失败: ' + (error.message || 'Unknown error'));
  }
};

/**
 * 检查 URL 是否为本地 base64 数据
 * @param url 图片 URL
 * @returns 是否为本地 base64 数据
 */
export const isLocalBase64Image = (url: string): boolean => {
  return url.startsWith('data:image/');
};

/**
 * 获取公网可访问的图片 URL
 * 如果图片是本地 base64，则自动上传到云存储
 * @param imageUrl 图片 URL（可能是 base64 或公网 URL）
 * @returns 公网可访问的图片 URL
 */
export const getPublicImageUrl = async (imageUrl: string): Promise<string> => {
  // 如果已经是公网 URL，直接返回
  if (!isLocalBase64Image(imageUrl)) {
    return imageUrl;
  }
  
  // 如果是本地 base64，上传到云存储
  console.log('[getPublicImageUrl] Local base64 detected, uploading to cloud...');
  return await uploadBase64Image(imageUrl);
};

export default imageService;