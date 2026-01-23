/**
 * 性能优化工具函数
 * 包含代码分割、懒加载、缓存等优化策略
 */

import { lazy, LazyExoticComponent, ComponentType } from 'react';

/**
 * 路由懒加载配置
 * 根据页面访问频率和重要性进行分级加载
 */
export const ROUTE_PRIORITIES = {
  CRITICAL: 'critical',    // 关键页面，预加载
  HIGH: 'high',           // 高频访问页面，优先加载
  MEDIUM: 'medium',       // 中等频率页面
  LOW: 'low'             // 低频访问页面，延迟加载
} as const;

export type RoutePriority = typeof ROUTE_PRIORITIES[keyof typeof ROUTE_PRIORITIES];

/**
 * 优化的懒加载组件工厂函数
 * 支持不同的加载策略和错误处理
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    priority?: RoutePriority;
    retryCount?: number;
    timeout?: number;
    preload?: boolean;
  } = {}
): LazyExoticComponent<T> {
  const {
    priority = ROUTE_PRIORITIES.MEDIUM,
    retryCount = 1, // 减少重试次数，降低网络请求压力
    timeout = 5000, // 缩短超时时间，避免长时间等待
    preload = false
  } = options;

  // 优化预加载策略：只对关键组件立即预加载，其他组件在需要时加载
  // 减少不必要的预加载，降低初始加载时间和内存消耗
  if (preload && priority === ROUTE_PRIORITIES.CRITICAL) {
    // 只对关键组件立即预加载
    if (typeof window !== 'undefined') {
      importFn().catch(() => {
        // 预加载失败不影响应用运行，忽略错误
      });
    }
  }

  // 简化导入函数，移除不必要的重试和超时机制
  // 让React.lazy和Suspense处理加载状态
  const wrappedImportFn = async (): Promise<{ default: T }> => {
    let lastError: Error;
    
    // 只重试一次，避免不必要的网络请求
    for (let i = 0; i <= retryCount; i++) {
      try {
        return await importFn();
      } catch (error) {
        lastError = error as Error;
        
        if (i < retryCount) {
          // 简单延迟后重试
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    throw lastError!;
  };

  return lazy(wrappedImportFn);
}

/**
 * 组件预加载管理器
 * 管理组件的预加载策略
 */
export class ComponentPreloader {
  private static instance: ComponentPreloader;
  private preloadQueue: Map<string, () => Promise<any>> = new Map();
  private isPreloading = false;

  static getInstance(): ComponentPreloader {
    if (!ComponentPreloader.instance) {
      ComponentPreloader.instance = new ComponentPreloader();
    }
    return ComponentPreloader.instance;
  }

  /**
   * 注册需要预加载的组件
   */
  register(name: string, importFn: () => Promise<any>): void {
    this.preloadQueue.set(name, importFn);
  }

  /**
   * 批量预加载组件
   */
  async preloadComponents(names?: string[]): Promise<void> {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    const componentsToLoad = names || Array.from(this.preloadQueue.keys());
    
    try {
      // 使用 Promise.allSettled 并行加载，不阻塞主线程
      const loadPromises = componentsToLoad.map(async (name) => {
        const importFn = this.preloadQueue.get(name);
        if (importFn) {
          try {
            await importFn();
            console.log(`[Preloader] Component "${name}" preloaded successfully`);
          } catch (error) {
            console.warn(`[Preloader] Failed to preload component "${name}":`, error);
          }
        }
      });

      await Promise.allSettled(loadPromises);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * 在用户空闲时预加载
   */
  preloadOnIdle(): void {
    if (typeof window === 'undefined') return;
    
    const idleCallback = () => {
      this.preloadComponents();
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(idleCallback, { timeout: 10000 });
    } else {
      // 降级方案：使用 setTimeout
      setTimeout(idleCallback, 1000);
    }
  }

  /**
   * 清理已加载的组件
   */
  clear(): void {
    this.preloadQueue.clear();
  }
}

/**
 * 性能监控工具
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: Map<string, ((metric: number) => void)[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 记录性能指标
   */
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);

    // 触发观察者
    const observers = this.observers.get(name);
    if (observers) {
      observers.forEach(callback => callback(value));
    }
  }

  /**
   * 获取平均性能指标
   */
  getAverageMetric(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  /**
   * 添加性能观察者
   */
  addObserver(name: string, callback: (metric: number) => void): void {
    if (!this.observers.has(name)) {
      this.observers.set(name, []);
    }
    this.observers.get(name)!.push(callback);
  }

  /**
   * 测量函数执行时间
   */
  measureFunction<T extends (...args: any[]) => any>(
    name: string,
    fn: T
  ): T {
    return ((...args: Parameters<T>): ReturnType<T> => {
      const start = performance.now();
      
      try {
        const result = fn(...args);
        
        // 处理异步函数
        if (result instanceof Promise) {
          return result.finally(() => {
            const end = performance.now();
            this.recordMetric(`${name}_duration`, end - start);
          }) as ReturnType<T>;
        } else {
          const end = performance.now();
          this.recordMetric(`${name}_duration`, end - start);
          return result;
        }
      } catch (error) {
        const end = performance.now();
        this.recordMetric(`${name}_duration`, end - start);
        this.recordMetric(`${name}_error`, 1);
        throw error;
      }
    }) as T;
  }

  /**
   * 获取性能报告
   */
  getReport(): Record<string, { average: number; count: number; max: number; min: number }> {
    const report: Record<string, { average: number; count: number; max: number; min: number }> = {};
    
    for (const [name, values] of this.metrics) {
      if (values.length > 0) {
        report[name] = {
          average: this.getAverageMetric(name),
          count: values.length,
          max: Math.max(...values),
          min: Math.min(...values)
        };
      }
    }
    
    return report;
  }

  /**
   * 清理性能数据
   */
  clear(): void {
    this.metrics.clear();
    this.observers.clear();
  }
}

/**
 * 资源加载优化器
 */
export class ResourceOptimizer {
  private static instance: ResourceOptimizer;
  private loadedResources: Set<string> = new Set();
  private loadingPromises: Map<string, Promise<any>> = new Map();

  static getInstance(): ResourceOptimizer {
    if (!ResourceOptimizer.instance) {
      ResourceOptimizer.instance = new ResourceOptimizer();
    }
    return ResourceOptimizer.instance;
  }

  /**
   * 优化图片加载
   */
  async optimizeImage(src: string, options: {
    formats?: string[];
    sizes?: number[];
    quality?: number;
  } = {}): Promise<string> {
    const { formats = ['webp', 'avif'], sizes = [320, 640, 1024, 1600], quality = 85 } = options;
    
    // 如果已经加载过，直接返回
    if (this.loadedResources.has(src)) {
      return src;
    }

    // 检查是否正在加载
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    const loadPromise = this.loadOptimizedImage(src, formats, sizes, quality);
    this.loadingPromises.set(src, loadPromise);

    try {
      const result = await loadPromise;
      this.loadedResources.add(src);
      return result;
    } finally {
      this.loadingPromises.delete(src);
    }
  }

  private async loadOptimizedImage(
    src: string,
    formats: string[],
    sizes: number[],
    quality: number
  ): Promise<string> {
    // 创建优化的图片URL（这里可以根据实际需求实现）
    const optimizedSrc = this.generateOptimizedImageUrl(src, formats[0], sizes[0], quality);
    
    // 预加载图片
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(optimizedSrc);
      img.onerror = () => reject(new Error(`Failed to load image: ${optimizedSrc}`));
      img.src = optimizedSrc;
    });
  }

  private generateOptimizedImageUrl(src: string, format: string, size: number, quality: number): string {
    // 这里可以实现实际的图片优化逻辑
    // 例如添加查询参数来请求优化后的图片
    const url = new URL(src, window.location.origin);
    url.searchParams.set('format', format);
    url.searchParams.set('size', size.toString());
    url.searchParams.set('quality', quality.toString());
    return url.toString();
  }

  /**
   * 预加载关键资源
   */
  preloadResources(resources: string[]): Promise<void> {
    const loadPromises = resources.map(resource => {
      if (this.loadedResources.has(resource)) {
        return Promise.resolve();
      }

      return this.loadResource(resource);
    });

    return Promise.allSettled(loadPromises).then(() => {});
  }

  private async loadResource(resource: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = this.getResourceType(resource);
      link.href = resource;
      
      link.onload = () => {
        this.loadedResources.add(resource);
        resolve();
      };
      
      link.onerror = () => {
        reject(new Error(`Failed to preload resource: ${resource}`));
      };
      
      document.head.appendChild(link);
    });
  }

  private getResourceType(resource: string): string {
    const ext = resource.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'css':
        return 'style';
      case 'js':
        return 'script';
      case 'woff':
      case 'woff2':
      case 'ttf':
        return 'font';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
      case 'avif':
        return 'image';
      default:
        return 'fetch';
    }
  }
}

/**
 * 性能优化工具类
 * 提供统一的性能优化接口
 */
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private monitor: PerformanceMonitor;
  private preloader: ComponentPreloader;
  private resourceOptimizer: ResourceOptimizer;

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  private constructor() {
    this.monitor = PerformanceMonitor.getInstance();
    this.preloader = ComponentPreloader.getInstance();
    this.resourceOptimizer = ResourceOptimizer.getInstance();
  }

  /**
   * 初始化性能优化
   */
  initialize(): void {
    // 初始化性能监控
    this.setupPerformanceObserver();
    
    // 设置资源预加载
    this.setupResourcePreloading();
    
    // 设置组件预加载
    this.setupComponentPreloading();
  }

  private setupPerformanceObserver(): void {
    if (typeof window === 'undefined') return;

    // 监听LCP（最大内容绘制）
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.monitor.recordMetric('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // 监听FID（首次输入延迟）
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            this.monitor.recordMetric('FID', (entry as any).processingStart - entry.startTime);
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // 监听CLS（累积布局偏移）
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.monitor.recordMetric('CLS', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Failed to setup performance observers:', error);
      }
    }
  }

  private setupResourcePreloading(): void {
    // 优化资源预加载：只预加载实际存在的关键资源
    // 避免预加载不存在的资源，减少不必要的网络请求
    const criticalResources: string[] = [];
    
    // 只有在确认资源存在时才添加到预加载列表
    // 这里可以根据实际项目情况调整
    // this.resourceOptimizer.preloadResources(criticalResources);
  }

  private setupComponentPreloading(): void {
    // 在用户空闲时预加载高频组件
    this.preloader.preloadOnIdle();
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    return this.monitor.getReport();
  }

  /**
   * 优化图片加载
   */
  optimizeImage(src: string, options?: any) {
    return this.resourceOptimizer.optimizeImage(src, options);
  }

  /**
   * 注册预加载组件
   */
  registerPreloadComponent(name: string, importFn: () => Promise<any>) {
    this.preloader.register(name, importFn);
  }
}

// 导出单例实例
export const performanceOptimizer = PerformanceOptimizer.getInstance();
export const componentPreloader = ComponentPreloader.getInstance();
export const performanceMonitor = PerformanceMonitor.getInstance();
export const resourceOptimizer = ResourceOptimizer.getInstance();

// 默认导出性能优化器
export default performanceOptimizer;