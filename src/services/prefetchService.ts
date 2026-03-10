// src/services/prefetchService.ts

// 预加载资源类型
export type PrefetchableResource = {
  url: string;
  type: 'image' | 'script' | 'style' | 'document' | 'font';
  priority?: 'high' | 'medium' | 'low';
  relatedTo?: string;
  expectedVisitProbability?: number;
};

// 预加载配置
export interface PrefetchConfig {
  maxConcurrentRequests: number;
  maxRequestsPerSecond: number;
  minDelayBetweenRequests: number;
  prefetchDistance: number;
  resourceTimeout: number;
  enabled: boolean;
}

// 默认预加载配置
const DEFAULT_CONFIG: PrefetchConfig = {
  maxConcurrentRequests: 3,
  maxRequestsPerSecond: 5,
  minDelayBetweenRequests: 200,
  prefetchDistance: 2000,
  resourceTimeout: 5000,
  enabled: true
};

// 预加载服务类
class PrefetchService {
  private config: PrefetchConfig;
  private queue: PrefetchableResource[] = [];
  private activeRequests: Set<string> = new Set();
  private requestTimestamps: number[] = [];
  private isRunning: boolean = false;
  private observer: IntersectionObserver | null = null;
  private prefetchHistory: Set<string> = new Set();

  constructor(config?: Partial<PrefetchConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.init();
  }

  // 初始化预加载服务
  private init(): void {
    if (!this.config.enabled) return;
    this.initIntersectionObserver();
    this.startProcessingQueue();
  }

  // 初始化IntersectionObserver，用于观察页面中的可预加载资源
  private initIntersectionObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            this.handleElementInView(target);
            this.observer?.unobserve(target);
          }
        });
      },
      {
        rootMargin: `${this.config.prefetchDistance}px 0px`,
        threshold: 0.05
      }
    );

    // 观察页面中已有的可预加载资源
    this.observeExistingElements();

    // 监听页面变化，观察新添加的可预加载资源
    this.observeDOMChanges();
  }

  // 观察页面中已有的可预加载资源
  private observeExistingElements(): void {
    if (typeof document === 'undefined') return;

    // 观察所有带有data-prefetch属性的元素
    const elements = document.querySelectorAll('[data-prefetch]');
    elements.forEach((element) => {
      this.observer?.observe(element);
    });

    // 观察所有链接元素
    const links = document.querySelectorAll('a[href]');
    links.forEach((link) => {
      this.observer?.observe(link);
    });

    // 观察所有图片元素
    const images = document.querySelectorAll('img[src]');
    images.forEach((image) => {
      this.observer?.observe(image);
    });
  }

  // 监听DOM变化，观察新添加的可预加载资源
  private observeDOMChanges(): void {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (typeof HTMLElement !== 'undefined' && node instanceof HTMLElement) {
            this.observeElement(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 观察单个元素
  private observeElement(element: HTMLElement): void {
    if (typeof document === 'undefined') return;

    this.observer?.observe(element);
    
    // 递归观察子元素
    const children = element.querySelectorAll('*');
    children.forEach((child) => {
      if (typeof HTMLElement !== 'undefined' && child instanceof HTMLElement) {
        this.observer?.observe(child);
      }
    });
  }

  // 处理进入视口的元素
  private handleElementInView(element: HTMLElement): void {
    if (element.tagName === 'A') {
      const link = element as HTMLAnchorElement;
      this.prefetchLink(link.href, link.dataset.prefetchPriority as 'high' | 'medium' | 'low');
    } else if (element.tagName === 'IMG') {
      const img = element as HTMLImageElement;
      this.prefetchImage(img.src, img.dataset.prefetchPriority as 'high' | 'medium' | 'low');
    } else if (element.hasAttribute('data-prefetch')) {
      const url = element.dataset.prefetch;
      if (url) {
        const type = element.dataset.prefetchType as PrefetchableResource['type'] || 'document';
        const priority = element.dataset.prefetchPriority as 'high' | 'medium' | 'low' || 'medium';
        this.prefetchResource({ url, type, priority });
      }
    }
  }

  // 预加载链接
  public prefetchLink(url: string, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    if (this.shouldSkipPrefetch(url)) return;
    
    this.prefetchResource({
      url,
      type: 'document',
      priority
    });
  }

  // 预加载图片
  public prefetchImage(url: string, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    if (this.shouldSkipPrefetch(url)) return;
    
    this.prefetchResource({
      url,
      type: 'image',
      priority
    });
  }

  // 预加载资源
  public prefetchResource(resource: PrefetchableResource): void {
    if (this.shouldSkipPrefetch(resource.url)) return;
    
    this.queue.push(resource);
    this.queue.sort(this.sortQueue);
    this.processQueue();
  }

  // 判断是否应该跳过预加载
  private shouldSkipPrefetch(url: string): boolean {
    // 跳过已经预加载过的资源
    if (this.prefetchHistory.has(url)) return true;
    
    // 跳过hash链接
    if (url.startsWith('#')) return true;
    
    // 跳过mailto和tel链接
    if (url.startsWith('mailto:') || url.startsWith('tel:')) return true;
    
    // 只在浏览器环境中检查外部域名
    if (typeof window !== 'undefined') {
      try {
        const currentHost = window.location.host;
        const resourceUrl = new URL(url, window.location.href);
        if (resourceUrl.host !== currentHost) return true;
      } catch (error) {
        console.warn(`Invalid URL for prefetch: ${url}`, error);
        return true;
      }
    }
    
    return false;
  }

  // 排序预加载队列
  private sortQueue(a: PrefetchableResource, b: PrefetchableResource): number {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.priority || 'medium'];
    const bPriority = priorityOrder[b.priority || 'medium'];
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // 如果优先级相同，按照预期访问概率排序
    const aProbability = a.expectedVisitProbability || 0;
    const bProbability = b.expectedVisitProbability || 0;
    
    return bProbability - aProbability;
  }

  // 开始处理预加载队列
  private startProcessingQueue(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.processQueue();
  }

  // 处理预加载队列
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0 || this.activeRequests.size >= this.config.maxConcurrentRequests) {
      return;
    }
    
    // 检查请求速率限制
    if (!this.canMakeRequest()) {
      setTimeout(() => this.processQueue(), this.config.minDelayBetweenRequests);
      return;
    }
    
    const resource = this.queue.shift();
    if (!resource) return;
    
    this.activeRequests.add(resource.url);
    this.prefetchHistory.add(resource.url);
    this.recordRequestTimestamp();
    
    try {
      await this.fetchResource(resource);
    } catch (error) {
      console.error(`Failed to prefetch ${resource.url}:`, error);
    } finally {
      this.activeRequests.delete(resource.url);
      setTimeout(() => this.processQueue(), this.config.minDelayBetweenRequests);
    }
  }

  // 检查是否可以发起新请求
  private canMakeRequest(): boolean {
    const now = Date.now();
    
    // 过滤掉1秒前的请求
    this.requestTimestamps = this.requestTimestamps.filter(timestamp => now - timestamp < 1000);
    
    return this.requestTimestamps.length < this.config.maxRequestsPerSecond;
  }

  // 记录请求时间戳
  private recordRequestTimestamp(): void {
    this.requestTimestamps.push(Date.now());
  }

  // 实际获取资源
  private fetchResource(resource: PrefetchableResource): Promise<void> {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const signal = controller.signal;
      
      // 设置超时
      const timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error(`Prefetch timeout for ${resource.url}`));
      }, this.config.resourceTimeout);
      
      switch (resource.type) {
        case 'image':
          this.fetchImage(resource.url, signal).then(resolve).catch(reject).finally(() => clearTimeout(timeoutId));
          break;
        case 'script':
          this.fetchScript(resource.url, signal).then(resolve).catch(reject).finally(() => clearTimeout(timeoutId));
          break;
        case 'style':
          this.fetchStyle(resource.url, signal).then(resolve).catch(reject).finally(() => clearTimeout(timeoutId));
          break;
        case 'document':
          this.fetchDocument(resource.url, signal).then(resolve).catch(reject).finally(() => clearTimeout(timeoutId));
          break;
        case 'font':
          this.fetchFont(resource.url, signal).then(resolve).catch(reject).finally(() => clearTimeout(timeoutId));
          break;
        default:
          resolve();
          clearTimeout(timeoutId);
      }
    });
  }

  // 预加载图片
  private fetchImage(url: string, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve();
      img.onerror = () => resolve(); // 即使图片加载失败，也视为完成
      img.onabort = () => reject(new Error(`Prefetch aborted for ${url}`));
      
      if (signal.aborted) {
        img.src = '';
        reject(new Error(`Prefetch aborted for ${url}`));
        return;
      }
      
      signal.addEventListener('abort', () => {
        img.src = '';
        reject(new Error(`Prefetch aborted for ${url}`));
      });
    });
  }

  // 预加载脚本
  private fetchScript(url: string, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof document === 'undefined') {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = 'script';
      link.onload = () => resolve();
      link.onerror = () => resolve(); // 即使脚本加载失败，也视为完成
      link.onabort = () => reject(new Error(`Prefetch aborted for ${url}`));
      
      document.head.appendChild(link);
      
      if (signal.aborted) {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
        reject(new Error(`Prefetch aborted for ${url}`));
        return;
      }
      
      signal.addEventListener('abort', () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
        reject(new Error(`Prefetch aborted for ${url}`));
      });
    });
  }

  // 预加载样式
  private fetchStyle(url: string, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof document === 'undefined') {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = 'style';
      link.onload = () => resolve();
      link.onerror = () => resolve(); // 即使样式加载失败，也视为完成
      link.onabort = () => reject(new Error(`Prefetch aborted for ${url}`));
      
      document.head.appendChild(link);
      
      if (signal.aborted) {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
        reject(new Error(`Prefetch aborted for ${url}`));
        return;
      }
      
      signal.addEventListener('abort', () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
        reject(new Error(`Prefetch aborted for ${url}`));
      });
    });
  }

  // 预加载文档
  private fetchDocument(url: string, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof document === 'undefined') {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = 'document';
      link.onload = () => resolve();
      link.onerror = () => resolve(); // 即使文档加载失败，也视为完成
      link.onabort = () => reject(new Error(`Prefetch aborted for ${url}`));
      
      document.head.appendChild(link);
      
      if (signal.aborted) {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
        reject(new Error(`Prefetch aborted for ${url}`));
        return;
      }
      
      signal.addEventListener('abort', () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
        reject(new Error(`Prefetch aborted for ${url}`));
      });
    });
  }

  // 预加载字体
  private fetchFont(url: string, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof document === 'undefined') {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = 'font';
      link.onload = () => resolve();
      link.onerror = () => resolve(); // 即使字体加载失败，也视为完成
      link.onabort = () => reject(new Error(`Prefetch aborted for ${url}`));
      
      document.head.appendChild(link);
      
      if (signal.aborted) {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
        reject(new Error(`Prefetch aborted for ${url}`));
        return;
      }
      
      signal.addEventListener('abort', () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
        reject(new Error(`Prefetch aborted for ${url}`));
      });
    });
  }

  // 启用预加载服务
  public enable(): void {
    this.config.enabled = true;
    this.init();
  }

  // 禁用预加载服务
  public disable(): void {
    this.config.enabled = false;
    this.isRunning = false;
    this.queue = [];
    this.activeRequests.clear();
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  // 清除预加载历史
  public clearHistory(): void {
    this.prefetchHistory.clear();
  }

  // 获取预加载服务状态
  public getStatus(): {
    isEnabled: boolean;
    queueLength: number;
    activeRequests: number;
    prefetchHistoryCount: number;
  } {
    return {
      isEnabled: this.config.enabled,
      queueLength: this.queue.length,
      activeRequests: this.activeRequests.size,
      prefetchHistoryCount: this.prefetchHistory.size
    };
  }
}

// 创建预加载服务实例
export const prefetchService = new PrefetchService();

// 导出服务实例
export default prefetchService;
