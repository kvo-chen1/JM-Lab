/**
 * 性能监控仪表板
 * 实时显示应用性能指标
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cacheService } from '@/services/cacheService';

interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
  resourceLoadTime: number | null;
  apiResponseTime: number | null;
  memoryUsage: number | null;
}

interface CacheStats {
  memory: number;
  session: number;
  local: number;
}

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    resourceLoadTime: null,
    apiResponseTime: null,
    memoryUsage: null,
  });

  const [cacheStats, setCacheStats] = useState<CacheStats>({ memory: 0, session: 0, local: 0 });
  const [isVisible, setIsVisible] = useState(false);

  // 收集性能指标
  const collectMetrics = useCallback(() => {
    const newMetrics: Partial<PerformanceMetrics> = {};

    // 使用Performance API获取指标
    if ('performance' in window) {
      const perf = window.performance;
      
      // Navigation Timing
      const navEntry = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry) {
        newMetrics.ttfb = navEntry.responseStart - navEntry.startTime;
        newMetrics.resourceLoadTime = navEntry.loadEventEnd - navEntry.domContentLoadedEventEnd;
      }

      // Memory Usage
      if ('memory' in perf) {
        const memory = (perf as any).memory;
        newMetrics.memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      }
    }

    // Web Vitals (如果可用)
    if ('web-vitals' in window) {
      // 这些值会在下面的effect中更新
    }

    setMetrics(prev => ({ ...prev, ...newMetrics }));
  }, []);

  // 收集缓存统计
  const collectCacheStats = useCallback(() => {
    const stats = cacheService.getStats();
    setCacheStats(stats);
  }, []);

  useEffect(() => {
    // 初始收集
    collectMetrics();
    collectCacheStats();

    // 定期更新
    const metricsInterval = setInterval(collectMetrics, 5000);
    const cacheInterval = setInterval(collectCacheStats, 10000);

    // 监听Web Vitals
    const observeWebVitals = () => {
      if ('PerformanceObserver' in window) {
        // FCP
        try {
          const fcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              if (entry.name === 'first-contentful-paint') {
                setMetrics(prev => ({ ...prev, fcp: Math.round(entry.startTime) }));
              }
            });
          });
          fcpObserver.observe({ entryTypes: ['paint'] });
        } catch (e) {
          console.warn('FCP observation failed:', e);
        }

        // LCP
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
              setMetrics(prev => ({ ...prev, lcp: Math.round(lastEntry.startTime) }));
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          console.warn('LCP observation failed:', e);
        }

        // CLS
        try {
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            });
            setMetrics(prev => ({ ...prev, cls: Math.round(clsValue * 1000) / 1000 }));
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          console.warn('CLS observation failed:', e);
        }

        // FID
        try {
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              const delay = entry.processingStart - entry.startTime;
              setMetrics(prev => ({ ...prev, fid: Math.round(delay) }));
            });
          });
          fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (e) {
          console.warn('FID observation failed:', e);
        }
      }
    };

    observeWebVitals();

    return () => {
      clearInterval(metricsInterval);
      clearInterval(cacheInterval);
    };
  }, [collectMetrics, collectCacheStats]);

  // 格式化时间显示
  const formatTime = (ms: number | null): string => {
    if (ms === null) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // 获取指标状态颜色
  const getMetricColor = (name: keyof PerformanceMetrics, value: number | null): string => {
    if (value === null) return 'text-gray-400';
    
    const thresholds: Record<string, { good: number; poor: number }> = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      ttfb: { good: 600, poor: 1000 },
    };

    const threshold = thresholds[name];
    if (!threshold) return 'text-gray-600';

    if (value <= threshold.good) return 'text-green-600';
    if (value <= threshold.poor) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
      >
        性能监控
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">性能监控</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="p-4 space-y-4">
          {/* Web Vitals */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Web Vitals</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">FCP:</span>
                <span className={getMetricColor('fcp', metrics.fcp)}>
                  {formatTime(metrics.fcp)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">LCP:</span>
                <span className={getMetricColor('lcp', metrics.lcp)}>
                  {formatTime(metrics.lcp)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">FID:</span>
                <span className={getMetricColor('fid', metrics.fid)}>
                  {formatTime(metrics.fid)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CLS:</span>
                <span className={getMetricColor('cls', metrics.cls)}>
                  {metrics.cls?.toFixed(3) ?? '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">TTFB:</span>
                <span className={getMetricColor('ttfb', metrics.ttfb)}>
                  {formatTime(metrics.ttfb)}
                </span>
              </div>
            </div>
          </div>

          {/* 资源加载 */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">资源加载</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">资源加载时间:</span>
                <span className="text-gray-800">{formatTime(metrics.resourceLoadTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">内存使用:</span>
                <span className="text-gray-800">
                  {metrics.memoryUsage ? `${metrics.memoryUsage}MB` : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* 缓存统计 */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">缓存统计</h4>
            <div className="grid grid-cols-3 gap-2 text-sm text-center">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-500 text-xs">内存</div>
                <div className="font-semibold text-gray-800">{cacheStats.memory}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-500 text-xs">Session</div>
                <div className="font-semibold text-gray-800">{cacheStats.session}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-500 text-xs">Local</div>
                <div className="font-semibold text-gray-800">{cacheStats.local}</div>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                cacheService.clear();
                collectCacheStats();
              }}
              className="flex-1 bg-gray-100 text-gray-700 py-1 px-3 rounded text-sm hover:bg-gray-200 transition-colors"
            >
              清除缓存
            </button>
            <button
              onClick={() => {
                collectMetrics();
                collectCacheStats();
              }}
              className="flex-1 bg-blue-100 text-blue-700 py-1 px-3 rounded text-sm hover:bg-blue-200 transition-colors"
            >
              刷新
            </button>
          </div>
        </div>
    </div>
  );
};

export default PerformanceDashboard;
