/**
 * 增强版事件总线服务
 * 添加事件过滤、优先级、延迟执行、防抖和节流等功能
 */

import { 
  Event, 
  EventPriority, 
  EventFilter, 
  EventHandler, 
  EventSubscriptionOptions, 
  EventSubscription, 
  EnhancedEventBus 
} from '../types/events';
import errorService from './errorService';

// 事件订阅存储项
interface SubscriptionItem {
  subscriptionId: string;
  handler: EventHandler;
  options: EventSubscriptionOptions;
  eventTypes: string[];
  executionCount: number;
  lastExecution: number;
  debounceTimeout?: NodeJS.Timeout;
  throttleLastRan?: number;
  throttleTimeout?: NodeJS.Timeout;
}

// 事件队列项
interface EventQueueItem {
  event: Event;
  priority: EventPriority;
  timestamp: number;
  delay?: number;
  delayTimeout?: NodeJS.Timeout;
}

// 增强版事件总线实现
export class EnhancedEventBusImpl implements EnhancedEventBus {
  private subscriptions: Map<string, SubscriptionItem[]> = new Map();
  private eventQueue: EventQueueItem[] = [];
  private isProcessingQueue: boolean = false;
  private eventTypes: Set<string> = new Set();
  private isDebugMode: boolean = false;
  private queueProcessingTimeout: NodeJS.Timeout | null = null;

  /**
   * 生成唯一订阅ID
   */
  private generateSubscriptionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 生成唯一事件ID
   */
  private generateEventId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 检查事件是否匹配过滤条件
   */
  private matchesFilter(event: Event, filter?: EventFilter): boolean {
    if (!filter) return true;

    // 检查事件类型
    if (filter.eventType) {
      const eventTypes = Array.isArray(filter.eventType) ? filter.eventType : [filter.eventType];
      if (!eventTypes.includes(event.eventType)) return false;
    }

    // 检查事件源
    if (filter.source) {
      const sources = Array.isArray(filter.source) ? filter.source : [filter.source];
      if (!sources.includes(event.source)) return false;
    }

    // 检查用户ID
    if (filter.userId && event.userId !== filter.userId) return false;

    // 检查元数据
    if (filter.metadata) {
      for (const [key, value] of Object.entries(filter.metadata)) {
        if (event.metadata?.[key] !== value) return false;
      }
    }

    return true;
  }

  /**
   * 订阅事件
   */
  on<T = Event>(eventType: string | string[], handler: EventHandler<T>, options?: EventSubscriptionOptions): EventSubscription {
    const eventTypes = Array.isArray(eventType) ? eventType : [eventType];
    const subscriptionId = this.generateSubscriptionId();
    
    // 注册所有事件类型
    eventTypes.forEach(type => this.eventTypes.add(type));

    // 创建订阅项
    const subscriptionItem: SubscriptionItem = {
      subscriptionId,
      handler: handler as EventHandler,
      options: {
        priority: EventPriority.NORMAL,
        once: false,
        ...options
      },
      eventTypes,
      executionCount: 0,
      lastExecution: 0
    };

    // 添加到订阅存储
    eventTypes.forEach(type => {
      if (!this.subscriptions.has(type)) {
        this.subscriptions.set(type, []);
      }
      this.subscriptions.get(type)!.push(subscriptionItem);
    });

    if (this.isDebugMode) {
      console.log(`[EnhancedEventBus] 订阅事件: ${eventTypes.join(', ')}, 订阅ID: ${subscriptionId}`);
    }

    // 返回订阅对象
    return {
      unsubscribe: () => this.unsubscribe(subscriptionId),
      subscriptionId,
      eventType: Array.isArray(eventType) ? eventType[0] : eventType,
      options: subscriptionItem.options
    };
  }

  /**
   * 订阅事件，只执行一次
   */
  once<T = Event>(eventType: string | string[], handler: EventHandler<T>, options?: EventSubscriptionOptions): EventSubscription {
    return this.on(eventType, handler, {
      ...options,
      once: true
    });
  }

  /**
   * 取消订阅
   */
  off<T = Event>(eventType: string | string[], handler: EventHandler<T>): void {
    const eventTypes = Array.isArray(eventType) ? eventType : [eventType];

    eventTypes.forEach(type => {
      const typeSubscriptions = this.subscriptions.get(type);
      if (typeSubscriptions) {
        const filtered = typeSubscriptions.filter(item => item.handler !== handler);
        if (filtered.length === 0) {
          this.subscriptions.delete(type);
        } else {
          this.subscriptions.set(type, filtered);
        }
      }
    });

    if (this.isDebugMode) {
      console.log(`[EnhancedEventBus] 取消订阅事件: ${eventTypes.join(', ')}`);
    }
  }

  /**
   * 取消订阅（通过订阅ID）
   */
  private unsubscribe(subscriptionId: string): void {
    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      const filtered = subscriptions.filter(item => item.subscriptionId !== subscriptionId);
      if (filtered.length === 0) {
        this.subscriptions.delete(eventType);
      } else {
        this.subscriptions.set(eventType, filtered);
      }
    }

    if (this.isDebugMode) {
      console.log(`[EnhancedEventBus] 通过ID取消订阅: ${subscriptionId}`);
    }
  }

  /**
   * 发布事件
   */
  emit<T = Event>(eventType: string, eventData?: Omit<T, 'eventId' | 'eventType' | 'timestamp' | 'source'>, options?: { priority?: EventPriority; delay?: number }): string {
    // 注册事件类型
    this.eventTypes.add(eventType);

    // 创建完整事件对象
    const event: Event = {
      eventId: this.generateEventId(),
      eventType,
      timestamp: Date.now(),
      source: 'EnhancedEventBus',
      ...eventData
    } as Event;

    // 获取事件优先级
    const priority = options?.priority || EventPriority.NORMAL;

    if (this.isDebugMode) {
      console.log(`[EnhancedEventBus] 发布事件: ${eventType}, 事件ID: ${event.eventId}, 优先级: ${priority}`);
    }

    // 创建事件队列项
    const queueItem: EventQueueItem = {
      event,
      priority,
      timestamp: Date.now()
    };

    // 如果有延迟，设置延迟执行
    if (options?.delay) {
      queueItem.delay = options.delay;
      queueItem.delayTimeout = setTimeout(() => {
        this.processEvent(event, priority);
      }, options.delay);
    } else {
      // 立即处理事件
      this.processEvent(event, priority);
    }

    return event.eventId;
  }

  /**
   * 处理单个事件
   */
  private processEvent(event: Event, priority: EventPriority): void {
    // 获取该事件类型的所有订阅
    const subscriptions = this.subscriptions.get(event.eventType) || [];
    
    if (subscriptions.length === 0) {
      if (this.isDebugMode) {
        console.log(`[EnhancedEventBus] 事件 ${event.eventType} 没有订阅者`);
      }
      return;
    }

    // 按优先级排序订阅
    const sortedSubscriptions = [...subscriptions].sort((a, b) => {
      return (b.options.priority || EventPriority.NORMAL) - (a.options.priority || EventPriority.NORMAL);
    });

    // 处理每个订阅
    for (const subscription of sortedSubscriptions) {
      try {
        // 检查过滤条件
        if (!this.matchesFilter(event, subscription.options.filter)) {
          continue;
        }

        // 检查防抖设置
        if (subscription.options.debounce) {
          this.handleDebounce(event, subscription);
          continue;
        }

        // 检查节流设置
        if (subscription.options.throttle) {
          this.handleThrottle(event, subscription);
          continue;
        }

        // 检查最大执行次数
        if (subscription.options.maxExecutions && subscription.executionCount >= subscription.options.maxExecutions) {
          this.unsubscribe(subscription.subscriptionId);
          continue;
        }

        // 执行事件处理器
        this.executeHandler(event, subscription);
      } catch (error) {
        errorService.logError(error as Error, {
          context: 'EnhancedEventBus',
          action: 'processEvent',
          eventType: event.eventType,
          subscriptionId: subscription.subscriptionId
        });
      }
    }
  }

  /**
   * 执行事件处理器
   */
  private executeHandler(event: Event, subscription: SubscriptionItem): void {
    // 执行处理器
    subscription.handler(event);
    
    // 更新执行统计
    subscription.executionCount++;
    subscription.lastExecution = Date.now();

    if (this.isDebugMode) {
      console.log(`[EnhancedEventBus] 执行事件处理器: ${event.eventType}, 订阅ID: ${subscription.subscriptionId}`);
    }

    // 如果是一次性订阅，执行后取消订阅
    if (subscription.options.once) {
      this.unsubscribe(subscription.subscriptionId);
      return;
    }

    // 检查最大执行次数
    if (subscription.options.maxExecutions && subscription.executionCount >= subscription.options.maxExecutions) {
      this.unsubscribe(subscription.subscriptionId);
    }
  }

  /**
   * 处理防抖
   */
  private handleDebounce(event: Event, subscription: SubscriptionItem): void {
    const debounceTime = subscription.options.debounce || 300;

    // 清除之前的防抖定时器
    if (subscription.debounceTimeout) {
      clearTimeout(subscription.debounceTimeout);
    }

    // 设置新的防抖定时器
    subscription.debounceTimeout = setTimeout(() => {
      this.executeHandler(event, subscription);
      subscription.debounceTimeout = undefined;
    }, debounceTime);
  }

  /**
   * 处理节流
   */
  private handleThrottle(event: Event, subscription: SubscriptionItem): void {
    const throttleTime = subscription.options.throttle || 1000;
    const now = Date.now();

    // 如果距离上次执行时间小于节流时间，且没有等待中的节流执行
    if (subscription.throttleLastRan && (now - subscription.throttleLastRan < throttleTime)) {
      // 如果已经有节流定时器，不重复设置
      if (!subscription.throttleTimeout) {
        subscription.throttleTimeout = setTimeout(() => {
          this.executeHandler(event, subscription);
          subscription.throttleLastRan = Date.now();
          subscription.throttleTimeout = undefined;
        }, throttleTime - (now - subscription.throttleLastRan));
      }
      return;
    }

    // 立即执行
    this.executeHandler(event, subscription);
    subscription.throttleLastRan = now;
  }

  /**
   * 获取事件订阅数量
   */
  getSubscriptionCount(eventType?: string): number {
    if (eventType) {
      const typeSubscriptions = this.subscriptions.get(eventType);
      return typeSubscriptions ? typeSubscriptions.length : 0;
    } else {
      let total = 0;
      for (const subscriptions of this.subscriptions.values()) {
        total += subscriptions.length;
      }
      return total;
    }
  }

  /**
   * 清除所有订阅
   */
  clear(): void {
    // 清除所有定时器
    for (const subscriptions of this.subscriptions.values()) {
      for (const subscription of subscriptions) {
        if (subscription.debounceTimeout) {
          clearTimeout(subscription.debounceTimeout);
        }
        if (subscription.throttleTimeout) {
          clearTimeout(subscription.throttleTimeout);
        }
      }
    }

    // 清除事件队列和定时器
    this.clearEventQueue();

    // 清除所有订阅
    this.subscriptions.clear();
    this.eventTypes.clear();

    if (this.isDebugMode) {
      console.log('[EnhancedEventBus] 已清除所有事件订阅和事件队列');
    }
  }

  /**
   * 清除指定事件的所有订阅
   */
  clearEvent(eventType: string): void {
    // 清除该事件类型的所有订阅
    const subscriptions = this.subscriptions.get(eventType);
    if (subscriptions) {
      // 清除所有相关定时器
      for (const subscription of subscriptions) {
        if (subscription.debounceTimeout) {
          clearTimeout(subscription.debounceTimeout);
        }
        if (subscription.throttleTimeout) {
          clearTimeout(subscription.throttleTimeout);
        }
      }

      this.subscriptions.delete(eventType);
      this.eventTypes.delete(eventType);

      if (this.isDebugMode) {
        console.log(`[EnhancedEventBus] 已清除事件 ${eventType} 的所有订阅`);
      }
    }
  }

  /**
   * 清除事件队列
   */
  private clearEventQueue(): void {
    // 清除所有延迟事件定时器
    for (const queueItem of this.eventQueue) {
      if (queueItem.delayTimeout) {
        clearTimeout(queueItem.delayTimeout);
      }
    }

    // 清空事件队列
    this.eventQueue = [];

    // 清除队列处理定时器
    if (this.queueProcessingTimeout) {
      clearTimeout(this.queueProcessingTimeout);
      this.queueProcessingTimeout = null;
    }

    this.isProcessingQueue = false;
  }

  /**
   * 获取所有事件类型
   */
  getAllEventTypes(): string[] {
    return Array.from(this.eventTypes);
  }

  /**
   * 设置事件总线调试模式
   */
  setDebugMode(debug: boolean): void {
    this.isDebugMode = debug;
    console.log(`[EnhancedEventBus] 调试模式已${debug ? '开启' : '关闭'}`);
  }

  /**
   * 获取事件总线状态
   */
  getStatus(): {
    subscriptionCount: number;
    eventTypes: number;
    isDebugMode: boolean;
  } {
    return {
      subscriptionCount: this.getSubscriptionCount(),
      eventTypes: this.eventTypes.size,
      isDebugMode: this.isDebugMode
    };
  }

  /**
   * 发布批量事件
   */
  emitBatch<T = Event>(events: Array<{ eventType: string; eventData: Omit<T, 'eventId' | 'eventType' | 'timestamp' | 'source'>; options?: { priority?: EventPriority; delay?: number } }>): string[] {
    const eventIds: string[] = [];

    for (const eventData of events) {
      const eventId = this.emit(eventData.eventType, eventData.eventData, eventData.options);
      eventIds.push(eventId);
    }

    return eventIds;
  }

  /**
   * 获取事件总线统计信息
   */
  getStats(): {
    subscriptions: {
      total: number;
      byEvent: Record<string, number>;
      byPriority: Record<string, number>;
    };
    events: {
      totalTypes: number;
      allTypes: string[];
    };
    queue: {
      size: number;
      priorityCounts: Record<string, number>;
    };
    debug: boolean;
  } {
    // 计算按事件类型的订阅数量
    const byEvent: Record<string, number> = {};
    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      byEvent[eventType] = subscriptions.length;
    }

    // 计算按优先级的订阅数量
    const byPriority: Record<string, number> = {
      [EventPriority.LOW]: 0,
      [EventPriority.NORMAL]: 0,
      [EventPriority.HIGH]: 0,
      [EventPriority.CRITICAL]: 0
    };
    for (const subscriptions of this.subscriptions.values()) {
      for (const subscription of subscriptions) {
        const priority = subscription.options.priority || EventPriority.NORMAL;
        byPriority[priority] = (byPriority[priority] || 0) + 1;
      }
    }

    // 计算按优先级的事件队列数量
    const priorityCounts: Record<string, number> = {
      [EventPriority.LOW]: 0,
      [EventPriority.NORMAL]: 0,
      [EventPriority.HIGH]: 0,
      [EventPriority.CRITICAL]: 0
    };
    for (const queueItem of this.eventQueue) {
      priorityCounts[queueItem.priority] = (priorityCounts[queueItem.priority] || 0) + 1;
    }

    return {
      subscriptions: {
        total: this.getSubscriptionCount(),
        byEvent,
        byPriority
      },
      events: {
        totalTypes: this.eventTypes.size,
        allTypes: Array.from(this.eventTypes)
      },
      queue: {
        size: this.eventQueue.length,
        priorityCounts
      },
      debug: this.isDebugMode
    };
  }
}

// 导出单例实例
const enhancedEventBus = new EnhancedEventBusImpl();

// 导出事件总线钩子，用于React组件
import { useEffect, useRef } from 'react';

export const useEnhancedEventBus = <T = Event>(
  eventType: string | string[],
  handler: EventHandler<T>,
  options?: EventSubscriptionOptions,
  deps: React.DependencyList = []
): void => {
  const handlerRef = useRef<EventHandler<T>>(handler);

  // 更新handler引用，避免闭包问题
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const subscription = enhancedEventBus.on<T>(eventType, (event) => {
      handlerRef.current(event);
    }, options);

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [eventType, options, ...deps]);
};

// 导出一次性事件总线钩子
export const useEnhancedEventBusOnce = <T = Event>(
  eventType: string | string[],
  handler: EventHandler<T>,
  options?: EventSubscriptionOptions,
  deps: React.DependencyList = []
): void => {
  useEnhancedEventBus(eventType, handler, { ...options, once: true }, deps);
};

export default enhancedEventBus;
export { enhancedEventBus };
