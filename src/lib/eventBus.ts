/**
 * 事件总线 - 用于服务间通信
 * 提供类型安全的事件发布/订阅机制
 */

// 事件处理器类型
export type EventHandler<T = any> = (data: T) => void;

// 事件映射类型（由具体实现定义）
export type EventMap = Record<string, any>;

/**
 * 类型安全的事件发射器
 */
export class EventEmitter<Events extends EventMap = any> {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  /**
   * 监听事件
   */
  on<K extends keyof Events>(
    event: K,
    handler: EventHandler<Events[K]>
  ): () => void {
    const eventName = String(event);
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    
    this.listeners.get(eventName)!.add(handler as EventHandler);

    // 返回取消订阅函数
    return () => this.off(event, handler);
  }

  /**
   * 监听事件（只触发一次）
   */
  once<K extends keyof Events>(
    event: K,
    handler: EventHandler<Events[K]>
  ): void {
    const onceHandler = (data: Events[K]) => {
      this.off(event, onceHandler as EventHandler<Events[K]>);
      handler(data);
    };
    this.on(event, onceHandler as EventHandler<Events[K]>);
  }

  /**
   * 取消监听
   */
  off<K extends keyof Events>(
    event: K,
    handler: EventHandler<Events[K]>
  ): void {
    const eventName = String(event);
    const handlers = this.listeners.get(eventName);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.listeners.delete(eventName);
      }
    }
  }

  /**
   * 触发事件
   */
  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    const eventName = String(event);
    const handlers = this.listeners.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[EventEmitter] Error in handler for event "${eventName}":`, error);
        }
      });
    }
  }

  /**
   * 获取事件监听器数量
   */
  listenerCount<K extends keyof Events>(event: K): number {
    const eventName = String(event);
    return this.listeners.get(eventName)?.size || 0;
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * 获取所有事件名称
   */
  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }
}

// 定义全局事件类型
interface GlobalEvents {
  [key: string]: any;
}

/**
 * 全局事件总线
 */
export const eventBus = new EventEmitter<GlobalEvents>();

// 导出便捷函数
export function on<T = any>(event: string, handler: EventHandler<T>): () => void {
  return eventBus.on(event, handler);
}

export function once<T = any>(event: string, handler: EventHandler<T>): void {
  eventBus.once(event, handler);
}

export function off<T = any>(event: string, handler: EventHandler<T>): void {
  eventBus.off(event, handler);
}

export function emit<T = any>(event: string, data: T): void {
  eventBus.emit(event, data);
}

// 默认导出，兼容旧代码
export default eventBus;
