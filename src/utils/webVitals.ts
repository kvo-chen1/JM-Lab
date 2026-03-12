/**
 * Web Vitals 监控工具
 * 用于收集和报告核心 Web 指标 (Core Web Vitals)
 * 符合 Google 的 Core Web Vitals 标准
 */

// Web Vitals 指标类型
export interface WebVitalsMetric {
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id: string;
  navigationType?: string;
}

// 报告回调函数类型
type ReportCallback = (metric: WebVitalsMetric) => void;

// 指标阈值配置（根据 Google 标准）
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
};

/**
 * 获取指标评级
 */
function getRating(name: WebVitalsMetric['name'], value: number): WebVitalsMetric['rating'] {
  const threshold = THRESHOLDS[name];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 观察 Largest Contentful Paint (LCP)
 */
export function observeLCP(onReport: ReportCallback): () => void {
  if (!('PerformanceObserver' in window)) return () => {};

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as PerformanceEntry;
    
    const metric: WebVitalsMetric = {
      name: 'LCP',
      value: lastEntry.startTime,
      rating: getRating('LCP', lastEntry.startTime),
      id: generateId(),
    };
    
    onReport(metric);
  });

  try {
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    console.warn('LCP observation not supported');
    return () => {};
  }

  return () => observer.disconnect();
}

/**
 * 观察 First Input Delay (FID)
 */
export function observeFID(onReport: ReportCallback): () => void {
  if (!('PerformanceObserver' in window)) return () => {};

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const fidEntry = entry as PerformanceEventTiming;
      const value = fidEntry.processingStart - fidEntry.startTime;
      
      const metric: WebVitalsMetric = {
        name: 'FID',
        value,
        rating: getRating('FID', value),
        id: generateId(),
      };
      
      onReport(metric);
    }
  });

  try {
    observer.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    console.warn('FID observation not supported');
    return () => {};
  }

  return () => observer.disconnect();
}

/**
 * 观察 Cumulative Layout Shift (CLS)
 */
export function observeCLS(onReport: ReportCallback): () => void {
  if (!('PerformanceObserver' in window)) return () => {};

  let clsValue = 0;
  let sessionEntries: PerformanceEntry[] = [];

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const layoutShiftEntry = entry as any;
      
      // 只计算没有最近用户输入的布局偏移
      if (!layoutShiftEntry.hadRecentInput) {
        clsValue += layoutShiftEntry.value;
        sessionEntries.push(entry);
      }
    }

    const metric: WebVitalsMetric = {
      name: 'CLS',
      value: clsValue,
      rating: getRating('CLS', clsValue),
      id: generateId(),
    };
    
    onReport(metric);
  });

  try {
    observer.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    console.warn('CLS observation not supported');
    return () => {};
  }

  return () => observer.disconnect();
}

/**
 * 观察 First Contentful Paint (FCP)
 */
export function observeFCP(onReport: ReportCallback): () => void {
  if (!('PerformanceObserver' in window)) return () => {};

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        const metric: WebVitalsMetric = {
          name: 'FCP',
          value: entry.startTime,
          rating: getRating('FCP', entry.startTime),
          id: generateId(),
        };
        
        onReport(metric);
      }
    }
  });

  try {
    observer.observe({ entryTypes: ['paint'] });
  } catch (e) {
    console.warn('FCP observation not supported');
    return () => {};
  }

  return () => observer.disconnect();
}

/**
 * 观察 Time to First Byte (TTFB)
 */
export function observeTTFB(onReport: ReportCallback): () => void {
  if (!('performance' in window)) return () => {};

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (navigation) {
    const value = navigation.responseStart - navigation.startTime;
    
    const metric: WebVitalsMetric = {
      name: 'TTFB',
      value,
      rating: getRating('TTFB', value),
      id: generateId(),
      navigationType: navigation.type,
    };
    
    onReport(metric);
  }

  return () => {};
}

/**
 * 观察 Interaction to Next Paint (INP) - 实验性指标
 */
export function observeINP(onReport: ReportCallback): () => void {
  if (!('PerformanceObserver' in window)) return () => {};

  let maxDuration = 0;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const eventEntry = entry as PerformanceEventTiming;
      const duration = eventEntry.duration;
      
      if (duration > maxDuration) {
        maxDuration = duration;
        
        const metric: WebVitalsMetric = {
          name: 'INP',
          value: duration,
          rating: getRating('INP', duration),
          id: generateId(),
        };
        
        onReport(metric);
      }
    }
  });

  try {
    observer.observe({ entryTypes: ['event'] });
  } catch (e) {
    console.warn('INP observation not supported');
    return () => {};
  }

  return () => observer.disconnect();
}

/**
 * 初始化所有 Web Vitals 监控
 */
export function initWebVitalsMonitoring(
  onReport: ReportCallback,
  options: {
    reportAllChanges?: boolean;
    analyticsEndpoint?: string;
  } = {}
): () => void {
  const { analyticsEndpoint } = options;

  // 包装报告函数，添加日志和上报功能
  const wrappedReporter: ReportCallback = (metric) => {
    // 开发环境下输出日志
    if (import.meta.env.DEV) {
      const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'poor' ? '❌' : '⚠️';
      console.log(`[Web Vitals] ${emoji} ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
    }

    // 发送到分析端点
    if (analyticsEndpoint) {
      sendToAnalytics(analyticsEndpoint, metric);
    }

    // 调用原始回调
    onReport(metric);
  };

  // 启动所有观察器
  const cleanupFns = [
    observeCLS(wrappedReporter),
    observeFCP(wrappedReporter),
    observeFID(wrappedReporter),
    observeLCP(wrappedReporter),
    observeTTFB(wrappedReporter),
    // INP 是实验性指标，可选启用
    // observeINP(wrappedReporter),
  ];

  // 返回清理函数
  return () => {
    cleanupFns.forEach(fn => fn());
  };
}

/**
 * 发送指标到分析服务器
 */
function sendToAnalytics(endpoint: string, metric: WebVitalsMetric): void {
  const body = JSON.stringify({
    ...metric,
    url: window.location.href,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
  });

  // 使用 sendBeacon 或 fetch
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, body);
  } else {
    fetch(endpoint, {
      method: 'POST',
      body,
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {
      // 静默失败
    });
  }
}

/**
 * 获取所有 Web Vitals 指标摘要
 */
export function getWebVitalsSummary(): Record<string, { value: number; rating: string }> {
  const summary: Record<string, { value: number; rating: string }> = {};
  
  // 从 performance 对象获取可用指标
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (navigation) {
    const ttfb = navigation.responseStart - navigation.startTime;
    summary.TTFB = {
      value: ttfb,
      rating: getRating('TTFB', ttfb),
    };
  }

  return summary;
}

/**
 * 检查是否支持所有 Web Vitals API
 */
export function checkWebVitalsSupport(): Record<string, boolean> {
  return {
    performance: 'performance' in window,
    performanceObserver: 'PerformanceObserver' in window,
    performanceNavigation: 'PerformanceNavigationTiming' in window,
    paint: 'PerformanceObserver' in window && 'paint' in PerformanceObserver.supportedEntryTypes,
    largestContentfulPaint: 'PerformanceObserver' in window && 'largest-contentful-paint' in PerformanceObserver.supportedEntryTypes,
    layoutShift: 'PerformanceObserver' in window && 'layout-shift' in PerformanceObserver.supportedEntryTypes,
    firstInput: 'PerformanceObserver' in window && 'first-input' in PerformanceObserver.supportedEntryTypes,
    event: 'PerformanceObserver' in window && 'event' in PerformanceObserver.supportedEntryTypes,
  };
}

// 导出默认对象
export default {
  initWebVitalsMonitoring,
  observeCLS,
  observeFCP,
  observeFID,
  observeLCP,
  observeTTFB,
  observeINP,
  getWebVitalsSummary,
  checkWebVitalsSupport,
};
