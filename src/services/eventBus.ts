// 事件总线服务

/**
 * 事件类型枚举
 */
export enum EventType {
  // 用户相关事件
  USER_LOGIN = 'user:login',
  USER_LOGOUT = 'user:logout',
  USER_UPDATED = 'user:updated',
  USER_REGISTERED = 'user:registered',
  
  // 作品相关事件
  WORK_CREATED = 'work:created',
  WORK_UPDATED = 'work:updated',
  WORK_DELETED = 'work:deleted',
  WORK_LIKED = 'work:liked',
  WORK_UNLIKED = 'work:unliked',
  WORK_VIEWED = 'work:viewed',
  
  // 评论相关事件
  COMMENT_CREATED = 'comment:created',
  COMMENT_UPDATED = 'comment:updated',
  COMMENT_DELETED = 'comment:deleted',
  
  // 帖子相关事件
  POST_CREATED = 'post:created',
  POST_UPDATED = 'post:updated',
  POST_DELETED = 'post:deleted',
  
  // 分类相关事件
  CATEGORY_CREATED = 'category:created',
  CATEGORY_UPDATED = 'category:updated',
  CATEGORY_DELETED = 'category:deleted',
  
  // 搜索相关事件
  SEARCH_PERFORMED = 'search:performed',
  
  // 系统相关事件
  THEME_CHANGED = 'theme:changed',
  LANGUAGE_CHANGED = 'language:changed',
  APP_READY = 'app:ready',
  APP_ERROR = 'app:error',
  
  // 数据同步事件
  DATA_SYNC_STARTED = 'data:sync:started',
  DATA_SYNC_COMPLETED = 'data:sync:completed',
  DATA_SYNC_FAILED = 'data:sync:failed',
  
  // 模拟数据事件
  MOCK_DATA_TOGGLED = 'mock:data:toggled',
  MOCK_DATA_CONFIG_UPDATED = 'mock:data:config:updated'
}

/**
 * 事件处理器类型
 */
export type EventHandler<T = any> = (data: T) => void;

/**
 * 事件订阅接口
 */
export interface EventSubscription {
  /**
   * 取消订阅
   */
  unsubscribe: () => void;
}

/**
 * 事件总线接口
 */
export interface EventBus {
  /**
   * 订阅事件
   */
  on<T = any>(event: EventType, handler: EventHandler<T>): EventSubscription;
  
  /**
   * 订阅事件，只执行一次
   */
  once<T = any>(event: EventType, handler: EventHandler<T>): EventSubscription;
  
  /**
   * 取消订阅
   */
  off<T = any>(event: EventType, handler: EventHandler<T>): void;
  
  /**
   * 发布事件
   */
  emit<T = any>(event: EventType, data?: T): void;
  
  /**
   * 获取事件订阅数量
   */
  getSubscriptionCount(event?: EventType): number;
  
  /**
   * 清除所有订阅
   */
  clear(): void;
  
  /**
   * 清除指定事件的所有订阅
   */
  clearEvent(event: EventType): void;
}

/**
 * 事件总线实现
 */
class EventBusImpl implements EventBus {
  private subscriptions: Map<EventType, Set<EventHandler>> = new Map();
  private onceSubscriptions: Map<EventType, Set<EventHandler>> = new Map();
  private isDebugMode: boolean = false;

  /**
   * 设置调试模式
   */
  setDebugMode(debug: boolean): void {
    this.isDebugMode = debug;
  }

  /**
   * 订阅事件
   */
  on<T = any>(event: EventType, handler: EventHandler<T>): EventSubscription {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set());
    }
    this.subscriptions.get(event)!.add(handler as EventHandler);

    if (this.isDebugMode) {
      console.log(`[EventBus] 订阅事件: ${event}, 当前订阅数: ${this.subscriptions.get(event)!.size}`);
    }

    return {
      unsubscribe: () => this.off(event, handler)
    };
  }

  /**
   * 订阅事件，只执行一次
   */
  once<T = any>(event: EventType, handler: EventHandler<T>): EventSubscription {
    if (!this.onceSubscriptions.has(event)) {
      this.onceSubscriptions.set(event, new Set());
    }
    this.onceSubscriptions.get(event)!.add(handler as EventHandler);

    if (this.isDebugMode) {
      console.log(`[EventBus] 订阅事件（仅一次）: ${event}, 当前订阅数: ${this.onceSubscriptions.get(event)!.size}`);
    }

    return {
      unsubscribe: () => this.off(event, handler)
    };
  }

  /**
   * 取消订阅
   */
  off<T = any>(event: EventType, handler: EventHandler<T>): void {
    // 从常规订阅中移除
    if (this.subscriptions.has(event)) {
      this.subscriptions.get(event)!.delete(handler as EventHandler);
      if (this.subscriptions.get(event)!.size === 0) {
        this.subscriptions.delete(event);
      }
    }

    // 从一次性订阅中移除
    if (this.onceSubscriptions.has(event)) {
      this.onceSubscriptions.get(event)!.delete(handler as EventHandler);
      if (this.onceSubscriptions.get(event)!.size === 0) {
        this.onceSubscriptions.delete(event);
      }
    }

    if (this.isDebugMode) {
      console.log(`[EventBus] 取消订阅事件: ${event}`);
    }
  }

  /**
   * 发布事件
   */
  emit<T = any>(event: EventType, data?: T): void {
    if (this.isDebugMode) {
      console.log(`[EventBus] 发布事件: ${event}, 数据:`, data);
    }

    // 执行常规订阅的处理器
    if (this.subscriptions.has(event)) {
      for (const handler of this.subscriptions.get(event)!) {
        try {
          handler(data);
        } catch (error) {
          console.error(`[EventBus] 事件处理器执行失败: ${event}`, error);
        }
      }
    }

    // 执行一次性订阅的处理器并移除
    if (this.onceSubscriptions.has(event)) {
      const handlers = this.onceSubscriptions.get(event)!;
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (error) {
          console.error(`[EventBus] 一次性事件处理器执行失败: ${event}`, error);
        }
      }
      // 清空一次性订阅
      this.onceSubscriptions.delete(event);
    }
  }

  /**
   * 获取事件订阅数量
   */
  getSubscriptionCount(event?: EventType): number {
    if (event) {
      const regularCount = this.subscriptions.has(event) ? this.subscriptions.get(event)!.size : 0;
      const onceCount = this.onceSubscriptions.has(event) ? this.onceSubscriptions.get(event)!.size : 0;
      return regularCount + onceCount;
    } else {
      let total = 0;
      for (const handlers of this.subscriptions.values()) {
        total += handlers.size;
      }
      for (const handlers of this.onceSubscriptions.values()) {
        total += handlers.size;
      }
      return total;
    }
  }

  /**
   * 清除所有订阅
   */
  clear(): void {
    this.subscriptions.clear();
    this.onceSubscriptions.clear();
    if (this.isDebugMode) {
      console.log('[EventBus] 已清除所有事件订阅');
    }
  }

  /**
   * 清除指定事件的所有订阅
   */
  clearEvent(event: EventType): void {
    this.subscriptions.delete(event);
    this.onceSubscriptions.delete(event);
    if (this.isDebugMode) {
      console.log(`[EventBus] 已清除事件 ${event} 的所有订阅`);
    }
  }
}

// 导出单例实例
const eventBus = new EventBusImpl();

// 导出事件总线钩子，用于React组件
import { useEffect, useRef } from 'react';

export const useEventBus = <T = any>(
  event: EventType,
  handler: EventHandler<T>,
  deps: React.DependencyList = []
): void => {
  const handlerRef = useRef<EventHandler<T>>(handler);

  // 更新handler引用，避免闭包问题
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const subscription = eventBus.on(event, (data) => {
      handlerRef.current(data);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [event, ...deps]);
};

// 导出一次性事件总线钩子
export const useEventBusOnce = <T = any>(
  event: EventType,
  handler: EventHandler<T>,
  deps: React.DependencyList = []
): void => {
  const handlerRef = useRef<EventHandler<T>>(handler);
  const calledRef = useRef(false);

  // 更新handler引用，避免闭包问题
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const subscription = eventBus.once(event, (data) => {
      if (!calledRef.current) {
        calledRef.current = true;
        handlerRef.current(data);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [event, ...deps]);
};

export default eventBus;
export { eventBus, EventBusImpl };
