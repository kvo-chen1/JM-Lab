/**
 * 性能优化工具函数
 * 包含代码分割、懒加载、缓存等优化策略
 */

import { lazy, LazyExoticComponent, ComponentType, Suspense } from 'react';

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
 * 用户角色类型
 */
export type UserRole = 'guest' | 'user' | 'creator' | 'admin';

/**
 * 优化的懒加载组件工厂函数
 * 支持不同的加载策略和错误处理
 */
export interface PreloadableComponent<T extends ComponentType<any>> extends LazyExoticComponent<T> {
  preload: () => Promise<{ default: T }>;
  preloadOnInteraction?: (element: HTMLElement) => void;
}

/**
 * 智能代码分割配置
 */
export interface CodeSplitConfig {
  role?: UserRole;
  networkSpeed?: 'slow-2g' | '2g' | '3g' | '4g' | '5g';
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  priority?: RoutePriority;
}

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
    name?: string; // 组件名称，用于注册到预加载器
    roleBased?: UserRole[]; // 基于角色的加载
    deviceBased?: ('mobile' | 'tablet' | 'desktop')[]; // 基于设备的加载
  } = {}
): PreloadableComponent<T> {
  const {
    priority = ROUTE_PRIORITIES.MEDIUM,
    retryCount = 2, // 增加重试次数
    timeout = 30000, // 增加超时时间到30秒，避免开发环境加载失败
    preload = false,
    name,
    roleBased,
    deviceBased
  } = options;

  // 检测用户角色
  const getUserRole = (): UserRole => {
    if (typeof window === 'undefined') return 'guest';
    const user = localStorage.getItem('user');
    if (!user) return 'guest';
    try {
      const parsedUser = JSON.parse(user);
      if (parsedUser.role === 'admin') return 'admin';
      if (parsedUser.role === 'creator') return 'creator';
      return 'user';
    } catch {
      return 'guest';
    }
  };

  // 检测设备类型
  const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  // 检测网络速度
  const getNetworkSpeed = (): string => {
    if (typeof window === 'undefined') return '4g';
    if ('connection' in navigator) {
      const connection = navigator.connection as any;
      return connection.effectiveType || '4g';
    }
    return '4g';
  };

  // 检查是否应该加载组件
  const shouldLoadComponent = (): boolean => {
    // 检查角色
    if (roleBased && roleBased.length > 0) {
      const userRole = getUserRole();
      if (!roleBased.includes(userRole)) {
        return false;
      }
    }

    // 检查设备
    if (deviceBased && deviceBased.length > 0) {
      const deviceType = getDeviceType();
      if (!deviceBased.includes(deviceType)) {
        return false;
      }
    }

    return true;
  };

  // 包装导入函数，添加重试逻辑和条件加载
  const wrappedImportFn = async (): Promise<{ default: T }> => {
    // 检查是否应该加载组件
    if (!shouldLoadComponent()) {
      throw new Error('Component not available for current user role or device');
    }

    let lastError: Error;
    const networkSpeed = getNetworkSpeed();
    const timeoutMultiplier = networkSpeed === 'slow-2g' ? 4 : networkSpeed === '2g' ? 3 : networkSpeed === '3g' ? 2 : 1;
    const adjustedTimeout = timeout * timeoutMultiplier;

    // 只重试一次，避免不必要的网络请求
    for (let i = 0; i <= retryCount; i++) {
      try {
        // 添加超时处理
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Component load timeout')), adjustedTimeout);
        });

        const result = await Promise.race([importFn(), timeoutPromise]);
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (i < retryCount) {
          // 指数退避重试
          const retryDelay = 500 * (i + 1);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    throw lastError!;
  };

  // 创建 Lazy 组件
  const LazyComponent = lazy(wrappedImportFn) as PreloadableComponent<T>;

  // 添加 preload 方法
  LazyComponent.preload = wrappedImportFn;

  // 添加基于交互的预加载方法
  LazyComponent.preloadOnInteraction = (element: HTMLElement) => {
    if (!element) return;

    const handleInteraction = () => {
      wrappedImportFn().catch(() => {
        // 预加载失败不影响应用运行，忽略错误
      });
      // 移除事件监听器
      element.removeEventListener('mouseenter', handleInteraction);
      element.removeEventListener('touchstart', handleInteraction);
    };

    // 添加事件监听器
    element.addEventListener('mouseenter', handleInteraction, { once: true });
    element.addEventListener('touchstart', handleInteraction, { once: true });
  };

  // 如果提供了名称，注册到预加载器
  if (name) {
    ComponentPreloader.getInstance().register(name, wrappedImportFn);
  }

  // 优化预加载策略：只对关键组件立即预加载
  if (preload && priority === ROUTE_PRIORITIES.CRITICAL) {
    if (typeof window !== 'undefined' && shouldLoadComponent()) {
      wrappedImportFn().catch(() => {
        // 预加载失败不影响应用运行，忽略错误
      });
    }
  }

  return LazyComponent;
}

/**
 * 智能代码分割组件
 * 根据用户角色、网络速度和设备类型动态加载组件
 */
export function createSmartSplitComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  config: CodeSplitConfig,
  fallback?: React.ReactNode
) {
  const LazyComponent = createLazyComponent(importFn, {
    priority: config.priority,
  });

  return function SmartSplitComponent(props: React.ComponentProps<T>) {
    const finalFallback = fallback !== undefined ? fallback : <div>Loading...</div>;
    return (
      <Suspense fallback={finalFallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * 组件预加载管理器
 * 管理组件的预加载策略
 */
export class ComponentPreloader {
  private static instance: ComponentPreloader;
  private preloadQueue: Map<string, () => Promise<any>> = new Map();
  private isPreloading = false;
  private userRole: UserRole = 'guest';
  private deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';

  static getInstance(): ComponentPreloader {
    if (!ComponentPreloader.instance) {
      ComponentPreloader.instance = new ComponentPreloader();
    }
    return ComponentPreloader.instance;
  }

  private constructor() {
    this.detectEnvironment();
  }

  /**
   * 检测环境信息
   */
  private detectEnvironment(): void {
    if (typeof window === 'undefined') return;

    // 检测用户角色
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const parsedUser = JSON.parse(user);
        if (parsedUser.role === 'admin') this.userRole = 'admin';
        else if (parsedUser.role === 'creator') this.userRole = 'creator';
        else if (parsedUser.role) this.userRole = 'user';
      }
    } catch {
      // 忽略错误
    }

    // 检测设备类型
    const width = window.innerWidth;
    if (width < 768) this.deviceType = 'mobile';
    else if (width < 1024) this.deviceType = 'tablet';
    else this.deviceType = 'desktop';
  }

  /**
   * 注册需要预加载的组件
   */
  register(name: string, importFn: () => Promise<any>, options?: {
    roleBased?: UserRole[];
    deviceBased?: ('mobile' | 'tablet' | 'desktop')[];
  }): void {
    const { roleBased, deviceBased } = options || {};

    // 检查是否符合角色和设备要求
    const shouldRegister = (!roleBased || roleBased.includes(this.userRole)) &&
                          (!deviceBased || deviceBased.includes(this.deviceType));

    if (shouldRegister) {
      this.preloadQueue.set(name, importFn);
    }
  }

  /**
   * 批量预加载组件
   */
  async preloadComponents(names?: string[]): Promise<void> {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    const componentsToLoad = names || Array.from(this.preloadQueue.keys());
    
    try {
      // 检测网络速度
      const networkSpeed = this.getNetworkSpeed();
      const batchSize = networkSpeed === '4g' || networkSpeed === '5g' ? 5 : 3;
      
      // 分批加载，避免网络拥塞
      for (let i = 0; i < componentsToLoad.length; i += batchSize) {
        const batch = componentsToLoad.slice(i, i + batchSize);
        
        // 使用 Promise.allSettled 并行加载，不阻塞主线程
        const loadPromises = batch.map(async (name) => {
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
        
        // 在慢速网络下添加延迟
        if (networkSpeed === 'slow-2g' || networkSpeed === '2g') {
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else if (networkSpeed === '3g') {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * 获取网络速度
   */
  private getNetworkSpeed(): 'slow-2g' | '2g' | '3g' | '4g' | '5g' {
    if (typeof window === 'undefined' || !('connection' in navigator)) {
      return '4g';
    }

    const connection = navigator.connection as any;
    return connection.effectiveType || '4g';
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
   * 在用户导航前预加载
   * @param nextRoute 下一个路由
   */
  preloadOnNavigation(nextRoute: string): void {
    if (typeof window === 'undefined') return;

    // 路由到组件名称的映射
    const routeToComponentMap: Record<string, string[]> = {
      '/': ['home', 'explore'],
      '/explore': ['explore', 'workDetail'],
      '/create': ['create', 'studio', 'aiWriter'],
      '/community': ['community', 'feed'],
      '/dashboard': ['dashboard', 'analytics'],
    };

    const components = routeToComponentMap[nextRoute] || [];
    if (components.length > 0) {
      this.preloadComponents(components);
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
  private networkSpeed: 'slow-2g' | '2g' | '3g' | '4g' | '5g' = '4g';
  private deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  private isOnline: boolean = true;

  static getInstance(): ResourceOptimizer {
    if (!ResourceOptimizer.instance) {
      ResourceOptimizer.instance = new ResourceOptimizer();
    }
    return ResourceOptimizer.instance;
  }

  private constructor() {
    this.detectEnvironment();
    this.setupNetworkListeners();
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

    // 检测在线状态
    this.isOnline = navigator.onLine;
  }

  /**
   * 设置网络状态监听器
   */
  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    // 监听网络状态变化
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('[ResourceOptimizer] Network status: online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('[ResourceOptimizer] Network status: offline');
    });

    // 监听网络速度变化
    if ('connection' in navigator) {
      const connection = navigator.connection as any;
      connection.addEventListener('change', () => {
        this.networkSpeed = connection.effectiveType || '4g';
        console.log(`[ResourceOptimizer] Network speed changed to: ${this.networkSpeed}`);
      });
    }
  }

  /**
   * 优化图片加载
   */
  async optimizeImage(src: string, options: {
    formats?: string[];
    sizes?: number[];
    quality?: number;
    priority?: 'high' | 'medium' | 'low';
  } = {}): Promise<string> {
    const { 
      formats = ['webp', 'avif'], 
      sizes = [320, 640, 1024, 1600], 
      quality = 85,
      priority = 'medium'
    } = options;
    
    // 如果已经加载过，直接返回
    if (this.loadedResources.has(src)) {
      return src;
    }

    // 检查是否正在加载
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    // 根据网络速度和设备类型调整参数
    const adjustedOptions = this.adjustOptionsByEnvironment({
      formats,
      sizes,
      quality,
      priority
    });

    const loadPromise = this.loadOptimizedImage(
      src, 
      adjustedOptions.formats, 
      adjustedOptions.sizes, 
      adjustedOptions.quality,
      adjustedOptions.priority
    );
    this.loadingPromises.set(src, loadPromise);

    try {
      const result = await loadPromise;
      this.loadedResources.add(src);
      return result;
    } finally {
      this.loadingPromises.delete(src);
    }
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
        sizes = [sizes[0]]; // 只使用最小尺寸
        formats = ['webp']; // 只使用webp格式
        break;
      case '3g':
        // 适度降级
        quality = Math.max(70, quality - 10);
        sizes = sizes.slice(0, 2); // 使用前两个尺寸
        break;
      // 4g和5g保持默认
    }

    // 根据设备类型调整
    if (this.deviceType === 'mobile') {
      sizes = sizes.slice(0, 2); // 移动端使用更小尺寸
    }

    // 根据优先级调整
    if (priority === 'low') {
      quality = Math.max(60, quality - 15);
    }

    return { formats, sizes, quality, priority };
  }

  private async loadOptimizedImage(
    src: string,
    formats: string[],
    sizes: number[],
    quality: number,
    priority: 'high' | 'medium' | 'low'
  ): Promise<string> {
    // 创建优化的图片URL
    const optimizedSrc = this.generateOptimizedImageUrl(src, formats[0], sizes[0], quality);
    
    // 创建图片元素
    const img = new Image();
    
    // 根据优先级设置加载策略
    if (priority === 'high') {
      img.fetchPriority = 'high';
    } else if (priority === 'low') {
      img.loading = 'lazy';
    }
    
    // 预加载图片
    return new Promise((resolve, reject) => {
      img.onload = () => resolve(optimizedSrc);
      img.onerror = () => {
        // 降级到原始图片
        console.warn(`[ResourceOptimizer] Failed to load optimized image: ${optimizedSrc}`);
        resolve(src);
      };
      img.src = optimizedSrc;
    });
  }

  private generateOptimizedImageUrl(src: string, format: string, size: number, quality: number): string {
    // 这里可以实现实际的图片优化逻辑
    // 例如添加查询参数来请求优化后的图片
    try {
      const url = new URL(src, window.location.origin);
      url.searchParams.set('format', format);
      url.searchParams.set('size', size.toString());
      url.searchParams.set('quality', quality.toString());
      return url.toString();
    } catch (error) {
      // 如果URL解析失败，返回原始URL
      console.warn(`[ResourceOptimizer] Failed to parse image URL: ${src}`);
      return src;
    }
  }

  /**
   * 智能资源预加载
   * 根据网络速度和设备类型调整预加载策略
   */
  async smartPreload(resources: Array<{
    url: string;
    type: 'script' | 'style' | 'font' | 'image' | 'fetch';
    priority?: 'high' | 'medium' | 'low';
  }>): Promise<void> {
    if (!this.isOnline) {
      console.log('[ResourceOptimizer] Offline mode: skipping preload');
      return;
    }

    // 根据网络速度过滤资源
    const filteredResources = this.filterResourcesByNetworkSpeed(resources);
    
    // 根据优先级排序
    const sortedResources = filteredResources.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return (priorityOrder[a.priority || 'medium'] || 1) - (priorityOrder[b.priority || 'medium'] || 1);
    });

    // 分批加载资源
    const batchSize = this.networkSpeed === '4g' || this.networkSpeed === '5g' ? 5 : 3;
    
    for (let i = 0; i < sortedResources.length; i += batchSize) {
      const batch = sortedResources.slice(i, i + batchSize);
      
      const loadPromises = batch.map(resource => this.loadResource(resource.url, resource.type));
      await Promise.allSettled(loadPromises);
      
      // 在慢速网络下添加延迟
      if (this.networkSpeed === 'slow-2g' || this.networkSpeed === '2g') {
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else if (this.networkSpeed === '3g') {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  /**
   * 根据网络速度过滤资源
   */
  private filterResourcesByNetworkSpeed(resources: Array<{
    url: string;
    type: 'script' | 'style' | 'font' | 'image' | 'fetch';
    priority?: 'high' | 'medium' | 'low';
  }>): Array<{
    url: string;
    type: 'script' | 'style' | 'font' | 'image' | 'fetch';
    priority?: 'high' | 'medium' | 'low';
  }> {
    // 在慢速网络下只加载高优先级资源
    if (this.networkSpeed === 'slow-2g' || this.networkSpeed === '2g') {
      return resources.filter(resource => resource.priority === 'high');
    }
    
    // 在3G网络下加载高和中优先级资源
    if (this.networkSpeed === '3g') {
      return resources.filter(resource => resource.priority !== 'low');
    }
    
    // 在4G和5G网络下加载所有资源
    return resources;
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

  private async loadResource(resource: string, type?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = type || this.getResourceType(resource);
      link.href = resource;
      
      link.onload = () => {
        this.loadedResources.add(resource);
        resolve();
      };
      
      link.onerror = () => {
        console.warn(`[ResourceOptimizer] Failed to preload resource: ${resource}`);
        resolve(); // 失败时不阻塞其他资源加载
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

  /**
   * 预加载关键字体
   */
  preloadFonts(fonts: Array<{
    url: string;
    format: string;
    weight?: string;
    style?: string;
  }>): Promise<void> {
    const loadPromises = fonts.map(font => {
      if (this.loadedResources.has(font.url)) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.href = font.url;
        link.crossOrigin = 'anonymous';
        
        if (font.format) {
          link.setAttribute('type', `font/${font.format}`);
        }
        
        link.onload = () => {
          this.loadedResources.add(font.url);
          resolve();
        };
        
        link.onerror = () => {
          console.warn(`[ResourceOptimizer] Failed to preload font: ${font.url}`);
          resolve();
        };
        
        document.head.appendChild(link);
      });
    });

    return Promise.allSettled(loadPromises).then(() => {});
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
  private initialized: boolean = false;

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
   * 初始化性能优化 - 延迟非关键初始化以减少启动开销
   */
  initialize(): void {
    if (this.initialized) return;
    
    // 立即初始化关键性能监控（LCP、FID）
    this.setupCriticalPerformanceObserver();
    
    // 延迟初始化非关键功能
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.setupResourcePreloading();
        this.setupComponentPreloading();
        this.setupNavigationPreloading();
      }, { timeout: 5000 });
    } else {
      // 降级方案：延迟执行
      setTimeout(() => {
        this.setupResourcePreloading();
        this.setupComponentPreloading();
        this.setupNavigationPreloading();
      }, 2000);
    }
    
    this.initialized = true;
    if (import.meta.env.DEV) {
      console.log('[PerformanceOptimizer] Initialized successfully');
    }
  }

  private setupCriticalPerformanceObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      // 只监听最关键的 LCP（最大内容绘制）
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.monitor.recordMetric('LCP', lastEntry.startTime);
        if (import.meta.env.DEV) {
          console.log(`[PerformanceOptimizer] LCP recorded: ${lastEntry.startTime.toFixed(2)}ms`);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // 延迟设置其他性能监控
      setTimeout(() => {
        this.setupExtendedPerformanceObserver();
      }, 5000);
    } catch (error) {
      console.warn('Failed to setup critical performance observers:', error);
    }
  }

  private setupExtendedPerformanceObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      // 监听FID（首次输入延迟）
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          const fid = (entry as any).processingStart - entry.startTime;
          this.monitor.recordMetric('FID', fid);
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
      console.warn('Failed to setup extended performance observers:', error);
    }
  }

  private setupResourcePreloading(): void {
    if (typeof window === 'undefined') return;

    // 检查网络速度，在慢速网络下跳过预加载
    const connection = (navigator as any).connection;
    if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
      if (import.meta.env.DEV) {
        console.log('[PerformanceOptimizer] Slow network detected, skipping resource preloading');
      }
      return;
    }

    // 延迟预加载，避免阻塞关键渲染路径
    setTimeout(() => {
      // 只预加载最关键的字体
      const fonts = [
        {
          url: '/assets/fa-solid-900-8GirhLYJ.woff2',
          format: 'woff2',
          weight: 'normal',
          style: 'normal'
        }
      ];
      
      // 静默预加载，不阻塞主线程
      this.resourceOptimizer.preloadFonts(fonts).catch(() => {
        // 静默失败
      });
    }, 3000);
  }

  private setupComponentPreloading(): void {
    // 在用户空闲时预加载高频组件
    this.preloader.preloadOnIdle();
  }

  private setupNavigationPreloading(): void {
    if (typeof window === 'undefined') return;

    // 监听导航事件，预加载可能的下一个路由
    window.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest('a') as HTMLAnchorElement;
      
      if (anchor && anchor.href && anchor.origin === window.location.origin) {
        try {
          const url = new URL(anchor.href);
          const path = url.pathname;
          
          // 预加载导航目标
          this.preloader.preloadOnNavigation(path);
        } catch (error) {
          console.warn('Failed to preload on navigation:', error);
        }
      }
    });
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
  registerPreloadComponent(name: string, importFn: () => Promise<any>, options?: {
    roleBased?: UserRole[];
    deviceBased?: ('mobile' | 'tablet' | 'desktop')[];
  }) {
    this.preloader.register(name, importFn, options);
  }

  /**
   * 智能预加载资源
   */
  async smartPreloadResources(resources: Array<{
    url: string;
    type: 'script' | 'style' | 'font' | 'image' | 'fetch';
    priority?: 'high' | 'medium' | 'low';
  }>): Promise<void> {
    return this.resourceOptimizer.smartPreload(resources);
  }

  /**
   * 预加载字体资源
   */
  async preloadFonts(fonts: Array<{
    url: string;
    format: string;
    weight?: string;
    style?: string;
  }>): Promise<void> {
    return this.resourceOptimizer.preloadFonts(fonts);
  }

  /**
   * 测量函数执行时间
   */
  measureFunction<T extends (...args: any[]) => any>(
    name: string,
    fn: T
  ): T {
    return this.monitor.measureFunction(name, fn);
  }

  /**
   * 记录自定义性能指标
   */
  recordMetric(name: string, value: number): void {
    this.monitor.recordMetric(name, value);
  }
}


// 导出单例实例
export const performanceOptimizer = PerformanceOptimizer.getInstance();
export const componentPreloader = ComponentPreloader.getInstance();
export const performanceMonitor = PerformanceMonitor.getInstance();
export const resourceOptimizer = ResourceOptimizer.getInstance();

// 默认导出性能优化器
export default performanceOptimizer;