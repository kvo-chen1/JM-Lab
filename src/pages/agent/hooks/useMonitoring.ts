import { useEffect, useRef } from 'react';
import { monitoringService } from '../services/monitoringService';

/**
 * 监控 Hook
 * 自动初始化和清理监控服务
 */
export function useMonitoring() {
  const monitoringRef = useRef(monitoringService);

  useEffect(() => {
    const monitoring = monitoringRef.current;

    // 设置全局错误处理
    const handleError = (event: ErrorEvent) => {
      monitoring.trackError({
        error: event.error,
        type: 'uncaught_error',
        category: 'system',
        metadata: {
          url: window.location.href,
          userAgent: navigator.userAgent
        }
      });
    };

    // 设置性能监控
    const observePerformance = () => {
      // 使用 Performance Observer 监控长任务
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > 50) { // 超过50ms的任务
                monitoring.trackEvent({
                  type: 'performance',
                  name: 'long_task',
                  data: {
                    duration: entry.duration,
                    startTime: entry.startTime
                  },
                  timestamp: Date.now()
                });
              }
            }
          });
          observer.observe({ entryTypes: ['longtask'] });
          return observer;
        } catch (e) {
          console.warn('[useMonitoring] PerformanceObserver not supported');
        }
      }
      return null;
    };

    // 添加错误监听
    window.addEventListener('error', handleError);

    // 启动性能监控
    const performanceObserver = observePerformance();

    console.log('[useMonitoring] Monitoring started');

    // 清理函数
    return () => {
      window.removeEventListener('error', handleError);
      if (performanceObserver) {
        performanceObserver.disconnect();
      }
      console.log('[useMonitoring] Monitoring stopped');
    };
  }, []);

  return monitoringRef.current;
}

export default useMonitoring;
