/**
 * 性能监控工具
 * 用于监控应用性能指标和用户体验
 */

// import { createLogger } from '@/services/errorService';
const createLogger = (name: string) => ({
  debug: (...args: any[]) => console.debug(`[${name}]`, ...args),
  info: (...args: any[]) => console.info(`[${name}]`, ...args),
  warn: (...args: any[]) => console.warn(`[${name}]`, ...args),
  error: (...args: any[]) => console.error(`[${name}]`, ...args),
});

// 性能指标接口
interface PerformanceMetrics {
  // 页面加载指标
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  
  // 自定义指标
  resourceLoadTime?: number;
  apiResponseTime?: number;
  renderTime?: number;
}

// 性能条目接口
interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  entryType: string;
}

// 性能监控配置
const MONITOR_CONFIG = {
  // 采样率（0-1）
  sampleRate: 0.1,
  // 上报阈值（毫秒）
  thresholds: {
    fcp: 1800,
    lcp: 2500,
    fid: 100,
    cls: 0.1,
    ttfb: 600,
  },
  // 最大缓存条目数
  maxCacheSize: 100,
};

// 性能数据缓存
const metricsCache: PerformanceMetrics[] = [];

/**
 * 检查是否启用性能监控
 */
function isMonitoringEnabled(): boolean {
  // 只在生产环境且采样率命中时启用
  if (import.meta.env.DEV) return false;
  return Math.random() < MONITOR_CONFIG.sampleRate;
}

/**
 * 初始化性能监控
 */
export function initPerformanceMonitor(): void {
  if (!isMonitoringEnabled()) {
    console.log('[PerformanceMonitor] 性能监控未启用（采样率未命中）');
    return;
  }

  console.log('[PerformanceMonitor] 初始化性能监控...');

  // 监控 Web Vitals 指标
  observeWebVitals();
  
  // 监控资源加载
  observeResourceLoading();
  
  // 监控长任务
  observeLongTasks();
  
  // 页面卸载时上报数据
  window.addEventListener('beforeunload', reportMetrics);
  
  // 定期上报（每30秒）
  setInterval(reportMetrics, 30000);
}

/**
 * 监控 Web Vitals 指标
 */
function observeWebVitals(): void {
  // 监听 FCP
  if ('PerformanceObserver' in window) {
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            recordMetric('fcp', entry.startTime);
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('[PerformanceMonitor] FCP 监控初始化失败:', e);
    }
  }

  // 监听 LCP
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        recordMetric('lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('[PerformanceMonitor] LCP 监控初始化失败:', e);
    }
  }

  // 监听 CLS
  if ('PerformanceObserver' in window) {
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        recordMetric('cls', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('[PerformanceMonitor] CLS 监控初始化失败:', e);
    }
  }

  // 监听 FID
  if ('PerformanceObserver' in window) {
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          recordMetric('fid', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('[PerformanceMonitor] FID 监控初始化失败:', e);
    }
  }

  // 获取 TTFB
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      recordMetric('ttfb', navigation.responseStart - navigation.startTime);
    }
  });
}

/**
 * 监控资源加载
 */
function observeResourceLoading(): void {
  if ('PerformanceObserver' in window) {
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          // 只监控慢资源（超过1秒）
          if (entry.duration > 1000) {
            console.warn('[PerformanceMonitor] 慢资源加载:', {
              name: entry.name,
              duration: entry.duration,
              size: entry.transferSize,
            });
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (e) {
      console.warn('[PerformanceMonitor] 资源监控初始化失败:', e);
    }
  }
}

/**
 * 监控长任务
 */
function observeLongTasks(): void {
  if ('PerformanceObserver' in window) {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          console.warn('[PerformanceMonitor] 长任务检测到:', {
            duration: entry.duration,
            startTime: entry.startTime,
          });
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.warn('[PerformanceMonitor] 长任务监控初始化失败:', e);
    }
  }
}

/**
 * 记录性能指标
 */
function recordMetric(name: keyof PerformanceMetrics, value: number): void {
  const metrics: PerformanceMetrics = { [name]: value };
  
  // 检查是否超过阈值
  const threshold = MONITOR_CONFIG.thresholds[name as keyof typeof MONITOR_CONFIG.thresholds];
  if (threshold && value > threshold) {
    console.warn(`[PerformanceMonitor] ${name} 超过阈值:`, {
      value,
      threshold,
      url: window.location.href,
    });
  }
  
  // 缓存指标
  metricsCache.push(metrics);
  
  // 限制缓存大小
  if (metricsCache.length > MONITOR_CONFIG.maxCacheSize) {
    metricsCache.shift();
  }
}

/**
 * 上报性能指标
 */
function reportMetrics(): void {
  if (metricsCache.length === 0) return;
  
  const reportData = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    metrics: [...metricsCache],
  };
  
  // 使用 sendBeacon 上报（如果可用）
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(reportData)], { type: 'application/json' });
    navigator.sendBeacon('/api/metrics/performance', blob);
  } else {
    // 降级方案：使用 fetch
    fetch('/api/metrics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
      keepalive: true,
    }).catch(() => {
      // 静默失败
    });
  }
  
  // 清空缓存
  metricsCache.length = 0;
}

/**
 * 手动测量函数执行时间
 */
export function measureFunction<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return function (...args: Parameters<T>): ReturnType<T> {
    const start = performance.now();
    const result = fn.apply(this, args);
    
    // 处理异步函数
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        console.log(`[PerformanceMonitor] ${name} 执行时间:`, duration.toFixed(2), 'ms');
      }) as ReturnType<T>;
    }
    
    const duration = performance.now() - start;
    console.log(`[PerformanceMonitor] ${name} 执行时间:`, duration.toFixed(2), 'ms');
    return result;
  } as T;
}

/**
 * 创建性能标记
 */
export function mark(name: string): void {
  if (performance.mark) {
    performance.mark(name);
  }
}

/**
 * 测量两个标记之间的时间
 */
export function measure(name: string, startMark: string, endMark: string): number | null {
  if (performance.measure) {
    try {
      const measure = performance.measure(name, startMark, endMark);
      return measure.duration;
    } catch (e) {
      console.warn('[PerformanceMonitor] 测量失败:', e);
      return null;
    }
  }
  return null;
}

/**
 * 获取当前性能数据
 */
export function getPerformanceData(): PerformanceMetrics[] {
  return [...metricsCache];
}

/**
 * 网络请求记录接口
 */
interface NetworkRequestRecord {
  url: string;
  method: string;
  duration: number;
  status: number;
  size: number;
  timestamp: number;
  fromCache?: boolean;
  retries?: number;
}

/**
 * 记录网络请求性能数据
 */
export function recordNetworkRequest(record: NetworkRequestRecord): void {
  // 只在开发环境记录详细日志
  if (import.meta.env.DEV) {
    console.log('[PerformanceMonitor] 网络请求:', {
      url: record.url,
      method: record.method,
      duration: record.duration,
      status: record.status,
      fromCache: record.fromCache,
    });
  }

  // 检查慢请求（超过1秒）
  if (record.duration > 1000) {
    console.warn('[PerformanceMonitor] 慢请求检测到:', {
      url: record.url,
      method: record.method,
      duration: record.duration,
    });
  }
}

/**
 * 清除性能数据
 */
export function clearPerformanceData(): void {
  metricsCache.length = 0;
}

// 模拟指标数据
function getMetrics() {
  return {
    fcp: performance.now(),
    lcp: performance.now(),
    fid: 0,
    cls: 0,
    ttfb: 0,
  };
}

// 模拟网络请求统计
function getNetworkRequestStats() {
  return {
    total: 0,
    success: 0,
    failed: 0,
    averageTime: 0,
  };
}

// 模拟组件渲染统计
function getComponentRenderStats() {
  return {
    total: 0,
    averageTime: 0,
    slowest: [],
  };
}

// 模拟内存使用
function getMemoryUsage() {
  return {
    used: 0,
    total: 0,
    percentage: 0,
  };
}

// 模拟审计
function runAudit() {
  return {
    score: 100,
    issues: [],
  };
}

// 清除指标
function clearMetrics() {
  clearPerformanceData();
}

// 性能监控器对象
export const performanceMonitor = {
  init: initPerformanceMonitor,
  measureFunction,
  mark,
  measure,
  getData: getPerformanceData,
  clear: clearPerformanceData,
  getMetrics,
  getNetworkRequestStats,
  getComponentRenderStats,
  getMemoryUsage,
  runAudit,
  clearMetrics,
};

// 导出默认对象
export default performanceMonitor;
