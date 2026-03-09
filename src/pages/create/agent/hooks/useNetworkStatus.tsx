/**
 * 网络状态检测 Hook
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * 网络质量等级
 */
export type NetworkQuality = 'online' | 'offline' | 'slow' | 'good';

/**
 * 网络状态接口
 */
export interface NetworkStatus {
  /** 是否在线 */
  isOnline: boolean;
  /** 网络质量 */
  quality: NetworkQuality;
  /** 下载速度 (kbps) */
  downlink?: number;
  /** 往返时延 (ms) */
  rtt?: number;
  /** 有效连接类型 */
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  /** 是否节省数据模式 */
  saveData?: boolean;
}

/**
 * 网络状态检测 Hook
 */
export function useNetworkStatus(): NetworkStatus & { checkNetwork: () => Promise<void> } {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    quality: navigator.onLine ? 'good' : 'offline',
    downlink: undefined,
    rtt: undefined,
    effectiveType: undefined,
    saveData: undefined
  });

  /**
   * 检测网络质量
   */
  const checkNetworkQuality = useCallback(async () => {
    if (!navigator.onLine) {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        quality: 'offline'
      }));
      return;
    }

    try {
      // 使用 Network Information API（如果支持）
      const connection = (navigator as any).connection || 
                         (navigator as any).mozConnection || 
                         (navigator as any).webkitConnection;

      if (connection) {
        const quality = getQualityFromEffectiveType(connection.effectiveType);
        setNetworkStatus({
          isOnline: true,
          quality,
          downlink: connection.downlink,
          rtt: connection.rtt,
          effectiveType: connection.effectiveType,
          saveData: connection.saveData
        });
      } else {
        // 降级方案：通过 ping 测试网络质量
        const rtt = await measureRTT();
        const quality = rtt < 100 ? 'good' : rtt < 300 ? 'slow' : 'offline';
        
        setNetworkStatus(prev => ({
          ...prev,
          isOnline: true,
          quality,
          rtt
        }));
      }
    } catch (error) {
      console.error('[NetworkStatus] Error checking network:', error);
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
        quality: 'good'
      }));
    }
  }, []);

  /**
   * 手动检查网络
   */
  const checkNetwork = useCallback(async () => {
    await checkNetworkQuality();
  }, [checkNetworkQuality]);

  useEffect(() => {
    // 初始检查
    checkNetworkQuality();

    // 监听在线/离线事件
    const handleOnline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: true }));
      checkNetworkQuality();
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        quality: 'offline'
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 定期检测网络质量
    const interval = setInterval(checkNetworkQuality, 30000); // 每 30 秒检测一次

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkNetworkQuality]);

  return {
    ...networkStatus,
    checkNetwork
  };
}

/**
 * 根据 effectiveType 判断网络质量
 */
function getQualityFromEffectiveType(effectiveType: string): NetworkQuality {
  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
      return 'slow';
    case '3g':
      return 'good';
    case '4g':
      return 'good';
    default:
      return 'good';
  }
}

/**
 * 测量 RTT（往返时延）
 */
async function measureRTT(): Promise<number> {
  const start = performance.now();
  
  try {
    // 尝试加载一个小资源来测量 RTT
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    await fetch('/favicon.ico', {
      method: 'HEAD',
      cache: 'no-cache',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const end = performance.now();
    return Math.round(end - start);
  } catch (error) {
    // 如果失败，返回一个较大的值
    return 1000;
  }
}

/**
 * 网络状态指示器组件
 */
export function NetworkIndicator() {
  const { isOnline, quality } = useNetworkStatus();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-500">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span>离线</span>
      </div>
    );
  }

  if (quality === 'slow') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-yellow-500">
        <span className="w-2 h-2 rounded-full bg-yellow-500" />
        <span>网络较慢</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-green-500">
      <span className="w-2 h-2 rounded-full bg-green-500" />
      <span>网络良好</span>
    </div>
  );
}
