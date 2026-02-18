/**
 * 性能监控工具
 * 用于收集和分析Web性能指标
 */

// 性能指标类型
export interface PerformanceMetrics {
  // 核心Web指标
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
  TTI?: number; // Time to Interactive
  
  // 自定义指标
  pageLoadTime?: number;
  domReadyTime?: number;
  resourceLoadTime?: number;
  apiResponseTime?: Record<string, number>;
  
  // 内存使用
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  
  // 导航信息
  navigationTiming?: PerformanceNavigationTiming;
}

// 性能监控配置
interface PerformanceMonitorConfig {
  enableWebVitals: boolean;
  enableResourceTiming: boolean;
  enableMemoryMonitoring: boolean;
  enableErrorTracking: boolean;
  sampleRate: number;
  reportUrl?: string;
  onMetricsCollected?: (metrics: PerformanceMetrics) => void;
}

// 默认配置
const defaultConfig: PerformanceMonitorConfig = {
  enableWebVitals: true,
  enableResourceTiming: true,
  enableMemoryMonitoring: true,
  enableErrorTracking: true,
  sampleRate: 1.0,
};

class PerformanceMonitor {
  private config: PerformanceMonitorConfig;
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];
  private isInitialized = false;

  constructor(config: Partial<PerformanceMonitorConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // 初始化性能监控
  init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    
    this.isInitialized = true;
    
    if (this.config.enableWebVitals) {
      this.observeWebVitals();
    }
    
    if (this.config.enableResourceTiming) {
      this.observeResourceTiming();
    }
    
    if (this.config.enableMemoryMonitoring) {
      this.startMemoryMonitoring();
    }
    
    if (this.config.enableErrorTracking) {
      this.setupErrorTracking();
    }
    
    // 页面加载完成后收集基础指标
    if (document.readyState === 'complete') {
      this.collectBasicMetrics();
    } else {
      window.addEventListener('load', () => this.collectBasicMetrics());
    }
  }

  // 观察核心Web指标
  private observeWebVitals(): void {
    // 观察 FCP
    this.observePaint('first-contentful-paint', (entry) => {
      this.metrics.FCP = entry.startTime;
      this.reportMetrics('FCP', entry.startTime);
    });

    // 观察 LCP
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.LCP = lastEntry.startTime;
      this.reportMetrics('LCP', lastEntry.startTime);
    });
    
    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.warn('LCP observation not supported');
    }

    // 观察 CLS
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.metrics.CLS = clsValue;
      this.reportMetrics('CLS', clsValue);
    });
    
    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (e) {
      console.warn('CLS observation not supported');
    }

    // 观察 FID
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = (entry as any).processingStart - entry.startTime;
        this.metrics.FID = fid;
        this.reportMetrics('FID', fid);
      }
    });
    
    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (e) {
      console.warn('FID observation not supported');
    }
  }

  // 观察绘制指标
  private observePaint(type: string, callback: (entry: PerformanceEntry) => void): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === type) {
          callback(entry);
        }
      }
    });
    
    try {
      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn(`${type} observation not supported`);
    }
  }

  // 观察资源加载时间
  private observeResourceTiming(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resourceEntry = entry as PerformanceResourceTiming;
        
        // 只监控API请求
        if (resourceEntry.initiatorType === 'xmlhttprequest' || 
            resourceEntry.initiatorType === 'fetch') {
          const duration = resourceEntry.duration;
          const url = resourceEntry.name;
          
          if (!this.metrics.apiResponseTime) {
            this.metrics.apiResponseTime = {};
          }
          
          // 简化URL作为key
          const key = url.split('?')[0].split('/').pop() || url;
          this.metrics.apiResponseTime[key] = duration;
          
          // 慢请求警告
          if (duration > 1000) {
            console.warn(`Slow API request: ${url} took ${duration.toFixed(2)}ms`);
          }
        }
      }
    });
    
    try {
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('Resource timing observation not supported');
    }
  }

  // 开始内存监控
  private startMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          this.metrics.memoryUsage = {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
          };
        }
      }, 30000); // 每30秒检查一次
    }
  }

  // 设置错误追踪
  private setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      console.error('Performance Monitor caught error:', event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Performance Monitor caught unhandled rejection:', event.reason);
    });
  }

  // 收集基础指标
  private collectBasicMetrics(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      this.metrics.navigationTiming = navigation;
      this.metrics.TTFB = navigation.responseStart - navigation.startTime;
      this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.startTime;
      this.metrics.domReadyTime = navigation.domContentLoadedEventEnd - navigation.startTime;
    }
    
    this.reportMetrics('basic', this.metrics);
  }

  // 报告指标
  private reportMetrics(type: string, value: unknown): void {
    if (this.config.onMetricsCollected) {
      this.config.onMetricsCollected(this.metrics);
    }
    
    if (this.config.reportUrl) {
      // 可以发送到远程服务器
      fetch(this.config.reportUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value, timestamp: Date.now() }),
        keepalive: true,
      }).catch(() => {
        // 静默失败
      });
    }
  }

  // 获取当前指标
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // 手动记录API响应时间
  recordApiResponseTime(apiName: string, duration: number): void {
    if (!this.metrics.apiResponseTime) {
      this.metrics.apiResponseTime = {};
    }
    this.metrics.apiResponseTime[apiName] = duration;
  }

  // 销毁监控器
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isInitialized = false;
  }
}

// 网络请求记录类型
export interface NetworkRequestRecord {
  url: string;
  method: string;
  duration: number;
  status: number;
  size: number;
  timestamp: number;
  fromCache: boolean;
  retries: number;
  error?: string;
}

// 网络请求记录数组
const networkRequests: NetworkRequestRecord[] = [];
const MAX_NETWORK_REQUESTS = 100; // 最多保留100条记录

// 记录网络请求
export function recordNetworkRequest(record: NetworkRequestRecord): void {
  networkRequests.push(record);
  
  // 限制记录数量
  if (networkRequests.length > MAX_NETWORK_REQUESTS) {
    networkRequests.shift();
  }
  
  // 在开发环境下输出日志
  if (import.meta.env.DEV) {
    const cacheInfo = record.fromCache ? '[CACHE]' : '';
    const errorInfo = record.error ? `[ERROR: ${record.error}]` : '';
    console.log(
      `[Network] ${record.method} ${record.url} ${record.status} ${record.duration.toFixed(2)}ms ${cacheInfo} ${errorInfo}`
    );
  }
}

// 获取所有网络请求记录
export function getNetworkRequests(): NetworkRequestRecord[] {
  return [...networkRequests];
}

// 清除网络请求记录
export function clearNetworkRequests(): void {
  networkRequests.length = 0;
}

// 导出单例实例
export const performanceMonitor = new PerformanceMonitor();

// 导出类以便需要时创建新实例
export default PerformanceMonitor;

// 导出初始化函数（兼容旧版调用方式）
export function initPerformanceMonitor(): void {
  performanceMonitor.init();
}