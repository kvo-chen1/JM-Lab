// WebSocket实时通信服务

import eventBus from './enhancedEventBus';
import { EventType } from '../types/events';
import errorService from './errorService';
import securityService from './securityService';
import { validate } from '../lib/dataValidator';

// WebSocket消息类型
export interface WebSocketMessage {
  type: string;
  payload?: any;
  id?: string;
  correlationId?: string;
  timestamp?: number;
  senderId?: string;
  recipientId?: string;
  channel?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  requiresAck?: boolean;
}

// WebSocket连接状态
export type WebSocketConnectionState = 'connecting' | 'open' | 'closing' | 'closed' | 'error';

// WebSocket回调函数
export interface WebSocketCallbacks {
  onOpen?: () => void;
  onClose?: (code: number, reason: string) => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onReconnecting?: (attempt: number, maxAttempts: number) => void;
  onReconnected?: () => void;
  onMaxReconnectAttempts?: () => void;
  // 协作相关回调
  onSessionJoin?: (data: any) => void;
  onUserJoined?: (data: any) => void;
  onUserLeft?: (data: any) => void;
  onTextEdit?: (data: any) => void;
  onCursorUpdate?: (data: any) => void;
  onSelectionUpdate?: (data: any) => void;
}

// WebSocket配置
export interface WebSocketConfig {
  url: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  maxReconnectDelay: number;
  heartbeatInterval: number;
  enableHeartbeat: boolean;
  enableEventBusIntegration: boolean;
  enableMessageValidation: boolean;
  enableMessageQueue: boolean;
  enableBinarySupport: boolean;
  defaultChannel: string;
}

// WebSocket消息队列项
export interface WebSocketQueueItem {
  message: WebSocketMessage;
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
  timestamp: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

// WebSocket服务类
export class WebSocketService {
  private ws: WebSocket | null = null;
  private callbacks: WebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private isConnecting = false;
  private isReconnecting = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketQueueItem[] = [];
  private messageAcks: Map<string, { resolve: (value?: any) => void; timeout: NodeJS.Timeout }> = new Map();
  private subscriptions: Set<string> = new Set();
  private config: WebSocketConfig;
  private connectionState: WebSocketConnectionState = 'closed';
  private lastActivity: number = Date.now();

  constructor(config?: Partial<WebSocketConfig>) {
    // 从环境变量获取WebSocket URL，支持开发和生产环境
    const wsProtocol = import.meta.env.PROD ? 'wss:' : 'ws:';
    const wsHost = import.meta.env.VITE_WEBSOCKET_HOST || 
                   (import.meta.env.PROD ? window.location.host : 'localhost:3021');
    const wsPath = import.meta.env.VITE_WEBSOCKET_PATH || '/ws';
    
    // 默认配置
    this.config = {
      url: `${wsProtocol}//${wsHost}${wsPath}`,
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      maxReconnectDelay: 30000,
      heartbeatInterval: 30000,
      enableHeartbeat: true,
      enableEventBusIntegration: true,
      enableMessageValidation: true,
      enableMessageQueue: true,
      enableBinarySupport: false,
      defaultChannel: 'default',
      ...config
    };
  }

  /**
   * 连接WebSocket服务器
   */
  connect(sessionId?: string, userId?: string, username?: string): Promise<boolean> {
    // 将参数转换为params对象
    const params: Record<string, string> = {};
    if (sessionId) params.sessionId = sessionId;
    if (userId) params.userId = userId;
    if (username) params.username = username;

    return new Promise((resolve, reject) => {
      // 如果已经连接或正在连接，直接返回
      if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
        resolve(true);
        return;
      }

      this.isConnecting = true;
      this.connectionState = 'connecting';

      try {
        // 构建WebSocket URL
        const url = this.buildWebSocketUrl(params);
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('WebSocket连接已建立');
          this.handleConnectionOpen();
          this.isConnecting = false;
          this.isReconnecting = false;
          this.reconnectAttempts = 0;
          this.connectionState = 'open';
          this.lastActivity = Date.now();
          
          // 发布连接建立事件
          if (this.config.enableEventBusIntegration) {
            eventBus.emit(EventType.APP_READY, {
              context: {
                service: 'websocket',
                status: 'connected',
                url: this.config.url
              }
            });
          }
          
          resolve(true);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket连接已关闭', event.code, event.reason);
          this.handleConnectionClose(event.code, event.reason);
          this.isConnecting = false;
          this.connectionState = 'closed';
          this.lastActivity = Date.now();
          
          // 尝试自动重连
          this.attemptReconnect();
          
          // 发布连接关闭事件
          if (this.config.enableEventBusIntegration) {
            eventBus.emit(EventType.APP_ERROR, {
              error: {
                code: 'WEBSOCKET_DISCONNECTED',
                message: `WebSocket连接已关闭: ${event.code} ${event.reason}`
              },
              context: {
                service: 'websocket',
                code: event.code,
                reason: event.reason
              }
            });
          }
          
          resolve(false);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket错误:', error);
          this.handleConnectionError(error);
          this.isConnecting = false;
          this.connectionState = 'error';
          this.lastActivity = Date.now();
          
          // 发布连接错误事件
          if (this.config.enableEventBusIntegration) {
            eventBus.emit(EventType.APP_ERROR, {
              error: {
                code: 'WEBSOCKET_ERROR',
                message: 'WebSocket连接错误'
              },
              context: {
                service: 'websocket',
                error
              }
            });
          }
          
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.lastActivity = Date.now();
          
          try {
            if (event.data instanceof Blob) {
              // 处理二进制数据
              this.handleBinaryMessage(event.data);
            } else {
              // 处理文本消息
              const message = JSON.parse(event.data);
              this.handleMessage(message);
            }
          } catch (error) {
            console.error('WebSocket消息解析错误:', error);
            errorService.logError(error as Error, {
              context: 'websocket',
              action: 'onmessage',
              rawData: event.data
            });
          }
        };
      } catch (error) {
        console.error('WebSocket连接失败:', error);
        this.isConnecting = false;
        this.connectionState = 'error';
        
        // 发布连接失败事件
        if (this.config.enableEventBusIntegration) {
          eventBus.emit(EventType.APP_ERROR, {
            error: {
              code: 'WEBSOCKET_CONNECT_FAILED',
              message: 'WebSocket连接失败'
            },
            context: {
              service: 'websocket',
              error
            }
          });
        }
        
        reject(error);
      }
    });
  }

  /**
   * 断开WebSocket连接
   */
  disconnect(code: number = 1000, reason: string = '用户主动断开'): Promise<void> {
    return new Promise((resolve) => {
      // 清除所有定时器
      this.clearAllTimers();
      
      // 重置状态
      this.isConnecting = false;
      this.isReconnecting = false;
      this.reconnectAttempts = 0;
      this.connectionState = 'closing';

      // 关闭WebSocket连接
      if (this.ws) {
        this.ws.onclose = () => {
          this.ws = null;
          this.connectionState = 'closed';
          this.handleConnectionClose(code, reason);
          resolve();
        };
        this.ws.close(code, reason);
      } else {
        this.connectionState = 'closed';
        this.handleConnectionClose(code, reason);
        resolve();
      }
      
      // 清空消息队列
      this.clearMessageQueue();
      
      // 清空消息确认映射
      this.clearMessageAcks();
    });
  }

  /**
   * 发送WebSocket消息
   */
  send(message: Partial<WebSocketMessage>): Promise<any> {
    return new Promise((resolve, reject) => {
      // 构建完整消息对象
      const fullMessage: WebSocketMessage = {
        id: securityService.generateUUID(),
        type: 'message',
        timestamp: Date.now(),
        priority: 'normal',
        requiresAck: false,
        channel: this.config.defaultChannel,
        ...message
      };

      // 消息验证
      if (this.config.enableMessageValidation) {
        const validationResult = validate('appLog', fullMessage);
        if (!validationResult.success) {
          const error = new Error(`WebSocket消息验证失败: ${validationResult.error}`);
          errorService.logError(error, {
            context: 'websocket',
            action: 'send',
            message: fullMessage
          });
          reject(error);
          return;
        }
      }

      // 如果需要确认，保存确认回调
      if (fullMessage.requiresAck) {
        this.messageAcks.set(fullMessage.id!, {
          resolve,
          timeout: setTimeout(() => {
            this.messageAcks.delete(fullMessage.id!);
            reject(new Error('WebSocket消息确认超时'));
          }, 10000)
        });
      }

      // 检查连接状态
      if (this.ws?.readyState !== WebSocket.OPEN) {
        if (this.config.enableMessageQueue) {
          // 添加到消息队列
          this.addToMessageQueue(fullMessage, resolve, reject);
        } else {
          const error = new Error('WebSocket未连接，无法发送消息');
          errorService.logError(error, {
            context: 'websocket',
            action: 'send',
            message: fullMessage
          });
          reject(error);
        }
        return;
      }

      // 直接发送消息
      this.sendImmediate(fullMessage);
      
      // 如果不需要确认，直接解析
      if (!fullMessage.requiresAck) {
        resolve();
      }
    });
  }

  /**
   * 立即发送WebSocket消息
   */
  private sendImmediate(message: WebSocketMessage): void {
    try {
      this.ws?.send(JSON.stringify(message));
      this.lastActivity = Date.now();
      
      // 发布消息发送事件
      if (this.config.enableEventBusIntegration) {
        eventBus.emit(EventType.APP_READY, {
          context: {
            service: 'websocket',
            action: 'send',
            messageType: message.type,
            messageId: message.id
          }
        });
      }
    } catch (error) {
      console.error('WebSocket发送消息失败:', error);
      errorService.logError(error as Error, {
        context: 'websocket',
        action: 'sendImmediate',
        message
      });
    }
  }

  /**
   * 发送文本编辑操作
   */
  sendTextEdit(operation: 'insert' | 'delete', position: number, text: string = '', length: number = 0): Promise<any> {
    return this.send({
      type: 'text_edit',
      payload: {
        operation,
        position,
        text,
        length
      }
    });
  }

  /**
   * 发送光标移动
   */
  sendCursorMove(position: number): Promise<any> {
    return this.send({
      type: 'cursor_move',
      payload: {
        position
      }
    });
  }

  /**
   * 发送选择变化
   */
  sendSelectionChange(start: number, end: number): Promise<any> {
    return this.send({
      type: 'selection_change',
      payload: {
        start,
        end
      }
    });
  }

  /**
   * 发送心跳消息
   */
  private sendHeartbeat(): void {
    this.send({
      type: 'ping',
      payload: {
        timestamp: Date.now(),
        lastActivity: this.lastActivity
      }
    }).catch(error => {
      console.warn('WebSocket心跳发送失败:', error);
    });
  }

  /**
   * 订阅WebSocket主题
   */
  subscribe(topic: string): void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.add(topic);
      this.send({
        type: 'subscribe',
        payload: {
          topic
        }
      });
    }
  }

  /**
   * 取消订阅WebSocket主题
   */
  unsubscribe(topic: string): void {
    if (this.subscriptions.has(topic)) {
      this.subscriptions.delete(topic);
      this.send({
        type: 'unsubscribe',
        payload: {
          topic
        }
      });
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: WebSocketMessage): void {
    this.lastActivity = Date.now();
    
    // 调用通用消息回调
    this.callbacks.onMessage?.(message);
    
    // 处理消息确认
    if (message.type === 'ack') {
      this.handleMessageAck(message);
      return;
    }
    
    // 处理心跳响应
    if (message.type === 'pong') {
      return;
    }
    
    // 协作相关消息处理
    switch (message.type) {
      case 'session_joined':
        this.callbacks.onSessionJoin?.(message.payload);
        break;
      case 'user_joined':
        this.callbacks.onUserJoined?.(message.payload);
        break;
      case 'user_left':
        this.callbacks.onUserLeft?.(message.payload);
        break;
      case 'text_edit':
        this.callbacks.onTextEdit?.(message.payload);
        break;
      case 'cursor_update':
        this.callbacks.onCursorUpdate?.(message.payload);
        break;
      case 'selection_update':
        this.callbacks.onSelectionUpdate?.(message.payload);
        break;
      case 'error':
        console.error('WebSocket服务器错误:', message.payload?.message);
        errorService.logError(new Error(message.payload?.message), {
          context: 'websocket',
          action: 'handleMessage',
          message
        });
        break;
      default:
        console.warn('未知的WebSocket消息类型:', message.type);
    }
    
    // 事件总线集成
    if (this.config.enableEventBusIntegration) {
      eventBus.emit(`websocket:${message.type}`, message);
    }
    
    // 如果消息需要确认，发送确认消息
    if (message.requiresAck && message.id) {
      this.send({
        type: 'ack',
        id: securityService.generateUUID(),
        correlationId: message.id,
        payload: {
          messageId: message.id,
          timestamp: Date.now()
        }
      });
    }
  }

  /**
   * 处理二进制消息
   */
  private handleBinaryMessage(data: Blob): void {
    if (this.config.enableBinarySupport) {
      console.log('接收到二进制数据:', data.size, 'bytes');
      // 这里可以添加二进制数据处理逻辑
    } else {
      console.warn('接收到二进制数据，但二进制支持已禁用');
    }
  }

  /**
   * 处理连接建立
   */
  private handleConnectionOpen(): void {
    // 启动心跳检测
    if (this.config.enableHeartbeat) {
      this.startHeartbeat();
    }
    
    // 调用连接建立回调
    this.callbacks.onOpen?.();
    
    // 发送队列中的消息
    this.sendMessageQueue();
    
    // 重新订阅所有主题
    this.resubscribeTopics();
  }

  /**
   * 处理连接关闭
   */
  private handleConnectionClose(code: number, reason: string): void {
    // 停止心跳检测
    this.stopHeartbeat();
    
    // 调用连接关闭回调
    this.callbacks.onClose?.(code, reason);
  }

  /**
   * 处理连接错误
   */
  private handleConnectionError(error: Event): void {
    // 调用错误回调
    this.callbacks.onError?.(error);
    
    // 记录错误
    errorService.logError(new Error('WebSocket连接错误'), {
      context: 'websocket',
      action: 'handleConnectionError',
      error
    });
  }

  /**
   * 处理消息确认
   */
  private handleMessageAck(message: WebSocketMessage): void {
    if (message.correlationId) {
      const ackEntry = this.messageAcks.get(message.correlationId);
      if (ackEntry) {
        clearTimeout(ackEntry.timeout);
        this.messageAcks.delete(message.correlationId);
        ackEntry.resolve(message.payload);
      }
    }
  }

  /**
   * 尝试重新连接
   */
  private attemptReconnect(): void {
    if (this.isReconnecting || this.reconnectAttempts >= this.config.reconnectAttempts) {
      // 达到最大重连次数
      this.callbacks.onMaxReconnectAttempts?.();
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    // 计算重连延迟（指数退避）
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) + Math.random() * 1000,
      this.config.maxReconnectDelay
    );

    // 调用重连开始回调
    this.callbacks.onReconnecting?.(this.reconnectAttempts, this.config.reconnectAttempts);

    // 设置重连定时器
    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect();
        this.callbacks.onReconnected?.();
      } catch (error) {
        console.error(`WebSocket重连失败 (${this.reconnectAttempts}/${this.config.reconnectAttempts}):`, error);
        this.attemptReconnect();
      }
    }, delay);
  }

  /**
   * 构建WebSocket URL
   */
  private buildWebSocketUrl(params?: Record<string, string>): string {
    const url = new URL(this.config.url);
    
    // 添加查询参数
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    return url.toString();
  }

  /**
   * 启动心跳检测
   */
  private startHeartbeat(): void {
    if (!this.heartbeatInterval) {
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat();
      }, this.config.heartbeatInterval);
    }
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 添加消息到队列
   */
  private addToMessageQueue(message: WebSocketMessage, resolve: (value?: any) => void, reject: (reason?: any) => void): void {
    this.messageQueue.push({
      message,
      resolve,
      reject,
      timestamp: Date.now(),
      priority: message.priority || 'normal'
    });
    
    // 按优先级排序
    this.messageQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 发送消息队列中的消息
   */
  private sendMessageQueue(): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return;
    }
    
    const queueCopy = [...this.messageQueue];
    this.messageQueue = [];
    
    queueCopy.forEach(item => {
      this.sendImmediate(item.message);
      if (!item.message.requiresAck) {
        item.resolve();
      }
    });
  }

  /**
   * 清空消息队列
   */
  private clearMessageQueue(): void {
    this.messageQueue.forEach(item => {
      item.reject(new Error('WebSocket连接已关闭，消息发送失败'));
    });
    this.messageQueue = [];
  }

  /**
   * 清空消息确认映射
   */
  private clearMessageAcks(): void {
    this.messageAcks.forEach(ack => {
      clearTimeout(ack.timeout);
      ack.resolve(new Error('WebSocket连接已关闭，消息确认失败'));
    });
    this.messageAcks.clear();
  }

  /**
   * 重新订阅所有主题
   */
  private resubscribeTopics(): void {
    this.subscriptions.forEach(topic => {
      this.send({
        type: 'subscribe',
        payload: {
          topic
        }
      });
    });
  }

  /**
   * 清除所有定时器
   */
  private clearAllTimers(): void {
    this.stopHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * 设置回调函数
   */
  setCallbacks(callbacks: WebSocketCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * 单独设置回调函数
   */
  onOpen(callback: () => void): void {
    this.callbacks.onOpen = callback;
  }

  onClose(callback: (code: number, reason: string) => void): void {
    this.callbacks.onClose = callback;
  }

  onError(callback: (error: Event) => void): void {
    this.callbacks.onError = callback;
  }

  onMessage(callback: (message: WebSocketMessage) => void): void {
    this.callbacks.onMessage = callback;
  }

  onReconnecting(callback: (attempt: number, maxAttempts: number) => void): void {
    this.callbacks.onReconnecting = callback;
  }

  onReconnected(callback: () => void): void {
    this.callbacks.onReconnected = callback;
  }

  onMaxReconnectAttempts(callback: () => void): void {
    this.callbacks.onMaxReconnectAttempts = callback;
  }

  onSessionJoin(callback: (data: any) => void): void {
    this.callbacks.onSessionJoin = callback;
  }

  onUserJoined(callback: (data: any) => void): void {
    this.callbacks.onUserJoined = callback;
  }

  onUserLeft(callback: (data: any) => void): void {
    this.callbacks.onUserLeft = callback;
  }

  onTextEdit(callback: (data: any) => void): void {
    this.callbacks.onTextEdit = callback;
  }

  onCursorUpdate(callback: (data: any) => void): void {
    this.callbacks.onCursorUpdate = callback;
  }

  onSelectionUpdate(callback: (data: any) => void): void {
    this.callbacks.onSelectionUpdate = callback;
  }

  /**
   * 获取连接状态
   */
  getConnectionState(): WebSocketConnectionState {
    return this.connectionState;
  }

  /**
   * 获取配置
   */
  getConfig(): WebSocketConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<WebSocketConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    connectionState: WebSocketConnectionState;
    reconnectAttempts: number;
    messageQueueSize: number;
    subscribedTopics: number;
    messageAcksSize: number;
    lastActivity: number;
    uptime?: number;
  } {
    return {
      connectionState: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      messageQueueSize: this.messageQueue.length,
      subscribedTopics: this.subscriptions.size,
      messageAcksSize: this.messageAcks.size,
      lastActivity: this.lastActivity
    };
  }
}

// 创建单例实例
export const websocketService = new WebSocketService();
export default websocketService;