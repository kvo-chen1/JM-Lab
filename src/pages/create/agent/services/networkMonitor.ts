/**
 * 网络状态监控服务
 * 解决无网络感知问题，提供离线检测和网络质量监控
 */

// 网络状态类型
export type NetworkStatus = 'online' | 'offline' | 'degraded' | 'checking';

// 网络质量指标
export interface NetworkQuality {
  latency: number;      // 延迟(ms)
  jitter: number;       // 抖动(ms)
  packetLoss: number;   // 丢包率(%)
  bandwidth: number;    // 带宽(Mbps)
}

// 网络状态详情
export interface NetworkState {
  status: NetworkStatus;
  lastChecked: number;
  quality?: NetworkQuality;
  errorCount: number;
  consecutiveFailures: number;
}

// 事件回调类型
type StatusChangeCallback = (data: { status: NetworkStatus; previousStatus: NetworkStatus }) => void;
type QualityUpdateCallback = (data: { quality: NetworkQuality }) => void;
type DegradedModeCallback = (data: { reason: string }) => void;
type RecoveryCallback = (data: { previousStatus: NetworkStatus }) => void;

/**
 * 网络状态监控服务
 */
export class NetworkMonitor {
  private state: NetworkState;
  private checkInterval: NodeJS.Timeout | null = null;
  private healthCheckUrl: string;
  private checkIntervalMs: number;
  private degradedThreshold: number;
  private offlineThreshold: number;
  private qualityHistory: number[] = [];
  private readonly MAX_QUALITY_HISTORY = 10;
  
  // 回调函数存储
  private statusChangeCallbacks: StatusChangeCallback[] = [];
  private qualityUpdateCallbacks: QualityUpdateCallback[] = [];
  private degradedModeCallbacks: DegradedModeCallback[] = [];
  private recoveryCallbacks: RecoveryCallback[] = [];

  constructor(options?: {
    healthCheckUrl?: string;
    checkIntervalMs?: number;
    degradedThreshold?: number;
    offlineThreshold?: number;
  }) {
    this.healthCheckUrl = options?.healthCheckUrl || '/api/health';
    this.checkIntervalMs = options?.checkIntervalMs || 30000;
    this.degradedThreshold = options?.degradedThreshold || 3000;
    this.offlineThreshold = options?.offlineThreshold || 3;
    
    this.state = {
      status: typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline',
      lastChecked: Date.now(),
      errorCount: 0,
      consecutiveFailures: 0
    };

    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('online', () => this.handleBrowserOnline());
    window.addEventListener('offline', () => this.handleBrowserOffline());
    this.startMonitoring();
    
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkNetworkStatus();
      }
    });
  }

  private handleBrowserOnline(): void {
    console.log('[NetworkMonitor] Browser reports online');
    this.updateStatus('checking');
    this.checkNetworkStatus();
  }

  private handleBrowserOffline(): void {
    console.log('[NetworkMonitor] Browser reports offline');
    this.updateStatus('offline');
  }

  startMonitoring(): void {
    if (this.checkInterval) return;
    
    this.checkInterval = setInterval(() => {
      this.checkNetworkStatus();
    }, this.checkIntervalMs);

    this.checkNetworkStatus();
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async checkNetworkStatus(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(this.healthCheckUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        headers: { 'X-Network-Check': '1' }
      });

      const latency = Date.now() - startTime;
      this.updateQualityHistory(latency);

      if (response.ok) {
        if (latency > this.degradedThreshold) {
          this.updateStatus('degraded');
          this.degradedModeCallbacks.forEach(cb => cb({ 
            reason: `High latency: ${latency}ms > ${this.degradedThreshold}ms` 
          }));
        } else {
          const previousStatus = this.state.status;
          if (previousStatus === 'offline' || previousStatus === 'degraded') {
            this.updateStatus('online');
            this.recoveryCallbacks.forEach(cb => cb({ previousStatus }));
          } else {
            this.updateStatus('online');
          }
        }

        this.state.consecutiveFailures = 0;
        
        this.state.quality = {
          latency,
          jitter: this.calculateJitter(),
          packetLoss: 0,
          bandwidth: 0
        };

        this.qualityUpdateCallbacks.forEach(cb => cb({ quality: this.state.quality! }));
      } else {
        this.handleCheckFailure(new Error(`HTTP ${response.status}`));
      }
    } catch (error) {
      this.handleCheckFailure(error as Error);
    }

    this.state.lastChecked = Date.now();
  }

  private handleCheckFailure(error: Error): void {
    console.warn('[NetworkMonitor] Health check failed:', error.message);
    
    this.state.consecutiveFailures++;
    this.state.errorCount++;

    if (this.state.consecutiveFailures >= this.offlineThreshold) {
      this.updateStatus('offline');
    } else if (this.state.status === 'online') {
      this.updateStatus('degraded');
    }
  }

  private updateStatus(newStatus: NetworkStatus): void {
    const previousStatus = this.state.status;
    
    if (previousStatus === newStatus) return;

    this.state.status = newStatus;
    
    console.log(`[NetworkMonitor] Status changed: ${previousStatus} -> ${newStatus}`);
    
    this.statusChangeCallbacks.forEach(cb => cb({ status: newStatus, previousStatus }));
  }

  private updateQualityHistory(latency: number): void {
    this.qualityHistory.push(latency);
    if (this.qualityHistory.length > this.MAX_QUALITY_HISTORY) {
      this.qualityHistory.shift();
    }
  }

  private calculateJitter(): number {
    if (this.qualityHistory.length < 2) return 0;
    
    let totalJitter = 0;
    for (let i = 1; i < this.qualityHistory.length; i++) {
      totalJitter += Math.abs(this.qualityHistory[i] - this.qualityHistory[i - 1]);
    }
    
    return Math.round(totalJitter / (this.qualityHistory.length - 1));
  }

  // 事件订阅方法
  on(event: 'status-change', callback: StatusChangeCallback): () => void;
  on(event: 'quality-update', callback: QualityUpdateCallback): () => void;
  on(event: 'degraded-mode', callback: DegradedModeCallback): () => void;
  on(event: 'recovery', callback: RecoveryCallback): () => void;
  on(event: string, callback: any): () => void {
    switch (event) {
      case 'status-change':
        this.statusChangeCallbacks.push(callback);
        return () => {
          const index = this.statusChangeCallbacks.indexOf(callback);
          if (index > -1) this.statusChangeCallbacks.splice(index, 1);
        };
      case 'quality-update':
        this.qualityUpdateCallbacks.push(callback);
        return () => {
          const index = this.qualityUpdateCallbacks.indexOf(callback);
          if (index > -1) this.qualityUpdateCallbacks.splice(index, 1);
        };
      case 'degraded-mode':
        this.degradedModeCallbacks.push(callback);
        return () => {
          const index = this.degradedModeCallbacks.indexOf(callback);
          if (index > -1) this.degradedModeCallbacks.splice(index, 1);
        };
      case 'recovery':
        this.recoveryCallbacks.push(callback);
        return () => {
          const index = this.recoveryCallbacks.indexOf(callback);
          if (index > -1) this.recoveryCallbacks.splice(index, 1);
        };
      default:
        return () => {};
    }
  }

  getStatus(): NetworkStatus {
    return this.state.status;
  }

  isOnline(): boolean {
    return this.state.status === 'online' || this.state.status === 'degraded';
  }

  isOffline(): boolean {
    return this.state.status === 'offline';
  }

  isDegraded(): boolean {
    return this.state.status === 'degraded';
  }

  getQuality(): NetworkQuality | undefined {
    return this.state.quality;
  }

  getState(): NetworkState {
    return { ...this.state };
  }

  getRecommendedAction(): string {
    switch (this.state.status) {
      case 'offline':
        return '请检查网络连接，恢复后将自动重试';
      case 'degraded':
        return '网络质量较差，部分功能可能受限';
      case 'online':
        return '网络正常';
      default:
        return '正在检查网络状态...';
    }
  }

  destroy(): void {
    this.stopMonitoring();
    this.statusChangeCallbacks = [];
    this.qualityUpdateCallbacks = [];
    this.degradedModeCallbacks = [];
    this.recoveryCallbacks = [];
  }
}

// 导出单例
export const networkMonitor = new NetworkMonitor();

export function isOnline(): boolean {
  return networkMonitor.isOnline();
}

export function isOffline(): boolean {
  return networkMonitor.isOffline();
}

export function getNetworkStatus(): NetworkStatus {
  return networkMonitor.getStatus();
}
