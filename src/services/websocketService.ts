// WebSocket服务管理

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Record<string, ((data: any) => void)[]> = {};
  private lifecycleListeners: Record<string, (() => void)[]> = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private url: string;
  private isConnected = false;

  constructor() {
    this.url = this.getWebSocketUrl();
  }

  // 获取WebSocket URL，兼容多种环境
  private getWebSocketUrl(): string {
    // 优先使用 Vite 环境变量
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }
    
    // 兼容 CRA 环境变量 (需要安全访问 process)
    try {
      if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_WS_URL) {
        return process.env.REACT_APP_WS_URL;
      }
    } catch (e) {
      // 忽略访问 process 时的错误
    }
    
    return 'ws://localhost:3022/ws';
  }

  // 连接WebSocket
  connect(): void {
    if (this.socket && this.isConnected) {
      console.log('WebSocket已经连接');
      return;
    }

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log('WebSocket连接成功');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.triggerLifecycle('open');
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, payload } = data;
          
          if (type && this.listeners[type]) {
            this.listeners[type].forEach(callback => {
              try {
                callback(payload);
              } catch (error) {
                console.error('事件处理错误:', error);
              }
            });
          }
        } catch (error) {
          console.error('消息解析错误:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket错误:', error);
        this.triggerLifecycle('error', error);
      };

      this.socket.onclose = () => {
        console.log('WebSocket连接关闭');
        this.isConnected = false;
        this.triggerLifecycle('close');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      this.triggerLifecycle('error', error);
      this.attemptReconnect();
    }
  }

  // 触发生命周期事件
  private triggerLifecycle(event: string, data?: any): void {
    if (this.lifecycleListeners[event]) {
      this.lifecycleListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`生命周期事件 ${event} 处理错误:`, error);
        }
      });
    }
  }

  // 监听连接打开
  onOpen(callback: () => void): void {
    if (!this.lifecycleListeners['open']) {
      this.lifecycleListeners['open'] = [];
    }
    this.lifecycleListeners['open'].push(callback);
  }

  // 监听连接关闭
  onClose(callback: () => void): void {
    if (!this.lifecycleListeners['close']) {
      this.lifecycleListeners['close'] = [];
    }
    this.lifecycleListeners['close'].push(callback);
  }

  // 监听连接错误
  onError(callback: (error: any) => void): void {
    if (!this.lifecycleListeners['error']) {
      this.lifecycleListeners['error'] = [];
    }
    this.lifecycleListeners['error'].push(callback as any);
  }

  // 断开WebSocket连接
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.listeners = {};
    }
  }

  // 发送消息
  send(type: string, payload: any): void {
    if (this.socket && this.isConnected) {
      try {
        this.socket.send(JSON.stringify({ type, payload }));
      } catch (error) {
        console.error('消息发送失败:', error);
      }
    } else {
      console.warn('WebSocket未连接，无法发送消息');
      this.connect();
    }
  }

  // 监听事件
  on(type: string, callback: (data: any) => void): void {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }

  // 移除事件监听器
  off(type: string, callback: (data: any) => void): void {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
    }
  }

  // 尝试重连
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`尝试重连WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('WebSocket重连失败，已达到最大尝试次数');
    }
  }

  // 检查连接状态
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// 导出单例实例
export const websocketService = new WebSocketService();
