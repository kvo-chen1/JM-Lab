// 事件总线实现，支持类型安全的事件订阅和发布

// 事件类型定义
export type EventType = 
  | 'auth:login'        // 用户登录成功
  | 'auth:logout'       // 用户登出成功
  | 'auth:update'       // 认证状态更新
  | 'auth:register'     // 用户注册成功
  | 'workflow:update'   // 工作流状态更新
  | 'workflow:reset'    // 工作流重置
  | '作品:创建'         // 作品创建成功
  | '作品:更新'         // 作品更新成功
  | '作品:发布'         // 作品发布成功
  | '作品:删除'         // 作品删除成功
  | '作品:审核'         // 作品审核状态变更
  | '社区:互动'         // 社区互动（点赞、评论等）
  | '社区:关注'         // 用户关注
  | '社区:取消关注'     // 用户取消关注
  | '数据:刷新'         // 数据需要刷新
  | '主题:切换'         // 主题切换
  | '语言:切换'         // 语言切换
  | '文件:上传开始'      // 文件上传开始
  | '文件:上传成功'      // 文件上传成功
  | '文件:上传失败'      // 文件上传失败
  | '请求:开始'         // 请求开始
  | '请求:成功'         // 请求成功
  | '请求:失败'         // 请求失败
  | '错误:发生'         // 错误发生

// 事件数据类型定义
export interface EventData {
  'auth:login': { userId: string; user: any }
  'auth:logout': undefined
  'auth:update': { isAuthenticated: boolean; user: any }
  'auth:register': { userId: string; user: any }
  'workflow:update': { state: any; changes: any }
  'workflow:reset': undefined
  '作品:创建': { workId: string; work: any }
  '作品:更新': { workId: string; work: any; changes: any }
  '作品:发布': { workId: string; work: any }
  '作品:删除': { workId: string }
  '作品:审核': { workId: string; status: 'pending' | 'approved' | 'rejected'; feedback?: string }
  '社区:互动': { type: 'like' | 'comment' | 'share'; workId: string; userId: string; data?: any }
  '社区:关注': { followerId: string; followingId: string }
  '社区:取消关注': { followerId: string; followingId: string }
  '数据:刷新': { type: string; payload?: any }
  '主题:切换': { theme: 'light' | 'dark' | 'system' }
  '语言:切换': { language: 'zh-CN' | 'en-US' | 'zh-TW' }
  '文件:上传开始': { file: File; options?: any }
  '文件:上传成功': { file: File; result: any; options?: any }
  '文件:上传失败': { file: File; error: any; options?: any }
  '请求:开始': { url: string; method: string; options?: any }
  '请求:成功': { url: string; method: string; data: any; options?: any }
  '请求:失败': { url: string; method: string; error: any; options?: any }
  '错误:发生': { error: any; context?: any }
}

// 事件监听器类型
export interface EventListener<T extends EventType> {
  callback: (data: EventData[T]) => void
  once?: boolean
  priority?: number
}

// 事件总线类
class EventBus {
  private listeners: Map<EventType, Map<string, EventListener<any>>> = new Map()
  private listenerIdCounter = 0

  /**
   * 订阅事件
   * @param event 事件类型
   * @param callback 回调函数
   * @param options 监听选项
   * @returns 监听ID，用于取消订阅
   */
  subscribe<T extends EventType>(
    event: T,
    callback: (data: EventData[T]) => void,
    options?: { once?: boolean; priority?: number }
  ): string {
    const listenerId = `listener_${this.listenerIdCounter++}`
    const listener: EventListener<T> = {
      callback,
      once: options?.once || false,
      priority: options?.priority || 0
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Map())
    }

    const eventListeners = this.listeners.get(event)!
    eventListeners.set(listenerId, listener)

    return listenerId
  }

  /**
   * 发布事件
   * @param event 事件类型
   * @param data 事件数据
   */
  publish<T extends EventType>(event: T, data: EventData[T]): void {
    const eventListeners = this.listeners.get(event)
    if (!eventListeners) return

    // 按优先级排序监听者（优先级高的先执行）
    const sortedListeners = Array.from(eventListeners.entries())
      .sort(([, a], [, b]) => (b.priority || 0) - (a.priority || 0))

    // 执行所有监听器
    for (const [listenerId, listener] of sortedListeners) {
      try {
        listener.callback(data)

        // 如果是一次性监听器，执行后移除
        if (listener.once) {
          eventListeners.delete(listenerId)
        }
      } catch (error) {
        console.error(`Event listener error for event '${event}':`, error)
      }
    }

    // 如果事件没有监听器了，清理该事件
    if (eventListeners.size === 0) {
      this.listeners.delete(event)
    }
  }

  /**
   * 取消订阅
   * @param event 事件类型
   * @param listenerId 监听器ID
   */
  unsubscribe<T extends EventType>(event: T, listenerId: string): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(listenerId)

      // 如果事件没有监听器了，清理该事件
      if (eventListeners.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  /**
   * 取消所有订阅
   * @param event 可选，指定事件类型，不指定则取消所有事件的订阅
   */
  unsubscribeAll<T extends EventType>(event?: T): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }

  /**
   * 订阅一次性事件
   * @param event 事件类型
   * @param callback 回调函数
   * @returns 监听器ID
   */
  once<T extends EventType>(event: T, callback: (data: EventData[T]) => void): string {
    return this.subscribe(event, callback, { once: true })
  }

  /**
   * 获取事件的监听器数量
   * @param event 事件类型
   * @returns 监听器数量
   */
  getListenerCount<T extends EventType>(event: T): number {
    const eventListeners = this.listeners.get(event)
    return eventListeners ? eventListeners.size : 0
  }

  /**
   * 获取所有注册的事件类型
   * @returns 事件类型数组
   */
  getRegisteredEvents(): EventType[] {
    return Array.from(this.listeners.keys())
  }

  /**
   * 清空所有事件监听器
   */
  clear(): void {
    this.listeners.clear()
  }
}

// 导出事件总线实例
const eventBus = new EventBus()
export default eventBus

// 导出事件总线类型
export type EventBusInstance = typeof eventBus
