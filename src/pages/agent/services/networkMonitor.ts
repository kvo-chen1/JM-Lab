/**
 * 网络监控服务
 * 监控网络状态并提供连接质量信息
 */

export enum NetworkStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  SLOW = 'slow',
  UNSTABLE = 'unstable'
}

export interface NetworkInfo {
  status: NetworkStatus;
  downlink?: number;
  rtt?: number;
  effectiveType?: string;
}

type NetworkEventType = 'status-change' | 'online' | 'offline';

interface NetworkEventData {
  status: NetworkStatus;
  previousStatus?: NetworkStatus;
  downlink?: number;
  rtt?: number;
  effectiveType?: string;
}

type NetworkEventListener = (data: NetworkEventData) => void;

class NetworkMonitor {
  private status: NetworkStatus = NetworkStatus.ONLINE;
  private previousStatus: NetworkStatus = NetworkStatus.ONLINE;
  private listeners: Set<(info: NetworkInfo) => void> = new Set();
  private eventListeners: Map<NetworkEventType, Set<NetworkEventListener>> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      // 监听在线/离线状态
      window.addEventListener('online', () => this.updateStatus(NetworkStatus.ONLINE));
      window.addEventListener('offline', () => this.updateStatus(NetworkStatus.OFFLINE));

      // 监听网络质量变化（如果支持）
      const connection = (navigator as any).connection;
      if (connection) {
        connection.addEventListener('change', () => this.handleConnectionChange());
        this.handleConnectionChange();
      }
    }
  }

  private handleConnectionChange() {
    const connection = (navigator as any).connection;
    if (!connection) return;

    const { downlink, rtt, effectiveType } = connection;
    
    let status = NetworkStatus.ONLINE;
    if (effectiveType === '2g' || downlink < 0.5) {
      status = NetworkStatus.SLOW;
    } else if (rtt > 500) {
      status = NetworkStatus.UNSTABLE;
    }

    this.updateStatus(status, { downlink, rtt, effectiveType });
  }

  private updateStatus(status: NetworkStatus, extra: Partial<NetworkInfo> = {}) {
    if (this.status !== status) {
      this.previousStatus = this.status;
      this.status = status;
      
      const info: NetworkInfo = { status, ...extra };
      this.listeners.forEach(listener => listener(info));
      
      // 触发事件
      const eventData: NetworkEventData = {
        status,
        previousStatus: this.previousStatus,
        ...extra
      };
      
      this.emit('status-change', eventData);
      
      if (status === NetworkStatus.ONLINE) {
        this.emit('online', eventData);
      } else if (status === NetworkStatus.OFFLINE) {
        this.emit('offline', eventData);
      }
    }
  }

  private emit(event: NetworkEventType, data: NetworkEventData) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  // 事件监听方法
  on(event: NetworkEventType, listener: NetworkEventListener): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
    
    // 立即触发一次当前状态
    if (event === 'status-change') {
      listener({
        status: this.status,
        previousStatus: this.previousStatus
      });
    }
    
    return () => {
      this.eventListeners.get(event)?.delete(listener);
    };
  }

  getStatus(): NetworkStatus {
    if (typeof navigator === 'undefined') return NetworkStatus.ONLINE;
    return navigator.onLine ? this.status : NetworkStatus.OFFLINE;
  }

  getInfo(): NetworkInfo {
    const connection = (navigator as any).connection;
    return {
      status: this.getStatus(),
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      effectiveType: connection?.effectiveType,
    };
  }

  onChange(listener: (info: NetworkInfo) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
  }
}

export const networkMonitor = new NetworkMonitor();
export default networkMonitor;
