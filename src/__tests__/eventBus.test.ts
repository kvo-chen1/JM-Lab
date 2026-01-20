// 事件总线测试用例
import eventBus from '../lib/eventBus'

// 测试事件总线的基本功能
describe('Event Bus Basic Functionality', () => {
  // 测试前清理事件总线
  beforeEach(() => {
    eventBus.clear()
  })
  
  // 测试后清理事件总线
  afterEach(() => {
    eventBus.clear()
  })
  
  // 测试事件订阅和发布
  test('should subscribe to and publish events', () => {
    const mockCallback = jest.fn()
    
    // 订阅事件
    const listenerId = eventBus.subscribe('auth:login', mockCallback)
    
    // 发布事件
    const testData = { userId: '123', user: { username: 'testuser', email: 'test@example.com' } }
    eventBus.publish('auth:login', testData)
    
    // 验证回调函数被调用
    expect(mockCallback).toHaveBeenCalledTimes(1)
    expect(mockCallback).toHaveBeenCalledWith(testData)
    
    // 取消订阅
    eventBus.unsubscribe('auth:login', listenerId)
    
    // 再次发布事件，验证回调函数不再被调用
    eventBus.publish('auth:login', testData)
    expect(mockCallback).toHaveBeenCalledTimes(1)
  })
  
  // 测试一次性事件
  test('should handle once events', () => {
    const mockCallback = jest.fn()
    
    // 订阅一次性事件
    eventBus.once('auth:logout', mockCallback)
    
    // 第一次发布事件，回调函数应该被调用
    eventBus.publish('auth:logout', undefined)
    expect(mockCallback).toHaveBeenCalledTimes(1)
    
    // 第二次发布事件，回调函数不应该被调用
    eventBus.publish('auth:logout', undefined)
    expect(mockCallback).toHaveBeenCalledTimes(1)
  })
  
  // 测试事件优先级
  test('should respect event priority', () => {
    const order: number[] = []
    
    // 订阅低优先级事件
    eventBus.subscribe('作品:创建', () => order.push(1), { priority: 1 })
    
    // 订阅高优先级事件
    eventBus.subscribe('作品:创建', () => order.push(2), { priority: 2 })
    
    // 订阅默认优先级事件
    eventBus.subscribe('作品:创建', () => order.push(3))
    
    // 发布事件
    eventBus.publish('作品:创建', { workId: '123', work: { title: 'Test Work' } })
    
    // 验证事件按优先级顺序执行
    expect(order).toEqual([2, 1, 3])
  })
  
  // 测试多个事件监听器
  test('should handle multiple listeners for the same event', () => {
    const mockCallback1 = jest.fn()
    const mockCallback2 = jest.fn()
    const mockCallback3 = jest.fn()
    
    // 订阅同一个事件的多个监听器
    eventBus.subscribe('作品:发布', mockCallback1)
    eventBus.subscribe('作品:发布', mockCallback2)
    eventBus.subscribe('作品:发布', mockCallback3)
    
    // 发布事件
    const testData = { workId: '123', work: { title: 'Test Work' } }
    eventBus.publish('作品:发布', testData)
    
    // 验证所有回调函数都被调用
    expect(mockCallback1).toHaveBeenCalledTimes(1)
    expect(mockCallback2).toHaveBeenCalledTimes(1)
    expect(mockCallback3).toHaveBeenCalledTimes(1)
    
    // 验证所有回调函数都接收到了正确的数据
    expect(mockCallback1).toHaveBeenCalledWith(testData)
    expect(mockCallback2).toHaveBeenCalledWith(testData)
    expect(mockCallback3).toHaveBeenCalledWith(testData)
  })
  
  // 测试事件总线的清理功能
  test('should clear all listeners', () => {
    const mockCallback1 = jest.fn()
    const mockCallback2 = jest.fn()
    
    // 订阅不同类型的事件
    eventBus.subscribe('auth:login', mockCallback1)
    eventBus.subscribe('作品:创建', mockCallback2)
    
    // 清理所有事件监听器
    eventBus.clear()
    
    // 发布事件，验证回调函数不再被调用
    eventBus.publish('auth:login', { userId: '123', user: { username: 'testuser' } })
    eventBus.publish('作品:创建', { workId: '123', work: { title: 'Test Work' } })
    
    expect(mockCallback1).not.toHaveBeenCalled()
    expect(mockCallback2).not.toHaveBeenCalled()
  })
  
  // 测试取消特定事件的所有监听器
  test('should unsubscribe all listeners for a specific event', () => {
    const mockCallback1 = jest.fn()
    const mockCallback2 = jest.fn()
    
    // 订阅同一个事件的多个监听器
    eventBus.subscribe('作品:删除', mockCallback1)
    eventBus.subscribe('作品:删除', mockCallback2)
    
    // 取消特定事件的所有监听器
    eventBus.unsubscribeAll('作品:删除')
    
    // 发布事件，验证回调函数不再被调用
    eventBus.publish('作品:删除', { workId: '123' })
    
    expect(mockCallback1).not.toHaveBeenCalled()
    expect(mockCallback2).not.toHaveBeenCalled()
  })
  
  // 测试获取事件监听器数量
  test('should get correct listener count', () => {
    // 初始状态下，事件监听器数量为0
    expect(eventBus.getListenerCount('auth:login')).toBe(0)
    
    // 订阅一个事件
    eventBus.subscribe('auth:login', jest.fn())
    expect(eventBus.getListenerCount('auth:login')).toBe(1)
    
    // 订阅另一个相同类型的事件
    eventBus.subscribe('auth:login', jest.fn())
    expect(eventBus.getListenerCount('auth:login')).toBe(2)
    
    // 订阅不同类型的事件
    eventBus.subscribe('auth:logout', jest.fn())
    expect(eventBus.getListenerCount('auth:login')).toBe(2)
    expect(eventBus.getListenerCount('auth:logout')).toBe(1)
  })
  
  // 测试获取注册的事件类型
  test('should get registered event types', () => {
    // 初始状态下，没有注册的事件类型
    expect(eventBus.getRegisteredEvents()).toEqual([])
    
    // 订阅不同类型的事件
    eventBus.subscribe('auth:login', jest.fn())
    eventBus.subscribe('auth:logout', jest.fn())
    eventBus.subscribe('作品:创建', jest.fn())
    
    // 验证注册的事件类型
    const registeredEvents = eventBus.getRegisteredEvents()
    expect(registeredEvents).toHaveLength(3)
    expect(registeredEvents).toContain('auth:login')
    expect(registeredEvents).toContain('auth:logout')
    expect(registeredEvents).toContain('作品:创建')
  })
})

// 测试事件总线在不同模块之间的通信
describe('Event Bus Cross-Module Communication', () => {
  // 测试前清理事件总线
  beforeEach(() => {
    eventBus.clear()
  })
  
  // 测试后清理事件总线
  afterEach(() => {
    eventBus.clear()
  })
  
  // 测试不同模块之间的事件通信
  test('should communicate between different modules', () => {
    // 模拟模块A：订阅作品创建事件
    const moduleA_Callback = jest.fn()
    eventBus.subscribe('作品:创建', moduleA_Callback)
    
    // 模拟模块B：订阅作品发布事件
    const moduleB_Callback = jest.fn()
    eventBus.subscribe('作品:发布', moduleB_Callback)
    
    // 模拟模块C：订阅作品审核事件
    const moduleC_Callback = jest.fn()
    eventBus.subscribe('作品:审核', moduleC_Callback)
    
    // 模拟作品创建流程
    const workData = { workId: '123', work: { title: 'Test Work', status: 'draft' } }
    const publishData = { workId: '123', work: { title: 'Test Work', status: 'published' } }
    const reviewData = { workId: '123', status: 'approved' as 'approved', feedback: 'Good work!' }
    
    // 发布作品创建事件
    eventBus.publish('作品:创建', workData)
    expect(moduleA_Callback).toHaveBeenCalledWith(workData)
    expect(moduleB_Callback).not.toHaveBeenCalled()
    expect(moduleC_Callback).not.toHaveBeenCalled()
    
    // 发布作品发布事件
    eventBus.publish('作品:发布', publishData)
    expect(moduleA_Callback).toHaveBeenCalledTimes(1)
    expect(moduleB_Callback).toHaveBeenCalledWith(publishData)
    expect(moduleC_Callback).not.toHaveBeenCalled()
    
    // 发布作品审核事件
    eventBus.publish('作品:审核', reviewData)
    expect(moduleA_Callback).toHaveBeenCalledTimes(1)
    expect(moduleB_Callback).toHaveBeenCalledTimes(1)
    expect(moduleC_Callback).toHaveBeenCalledWith(reviewData)
  })
  
  // 测试数据刷新事件
  test('should handle data refresh events', () => {
    const mockCallback = jest.fn()
    
    // 订阅数据刷新事件
    eventBus.subscribe('数据:刷新', mockCallback)
    
    // 发布不同类型的数据刷新事件
    const refreshData1 = { type: 'user:update', payload: { userId: '123', changes: { username: 'newname' } } }
    const refreshData2 = { type: '作品:update', payload: { workId: '456', changes: { title: 'New Title' } } }
    const refreshData3 = { type: 'community:update', payload: { userId: '123', action: 'follow' } }
    
    eventBus.publish('数据:刷新', refreshData1)
    eventBus.publish('数据:刷新', refreshData2)
    eventBus.publish('数据:刷新', refreshData3)
    
    // 验证回调函数被调用了3次
    expect(mockCallback).toHaveBeenCalledTimes(3)
    expect(mockCallback).toHaveBeenNthCalledWith(1, refreshData1)
    expect(mockCallback).toHaveBeenNthCalledWith(2, refreshData2)
    expect(mockCallback).toHaveBeenNthCalledWith(3, refreshData3)
  })
})

// 测试事件总线的边缘情况
describe('Event Bus Edge Cases', () => {
  // 测试前清理事件总线
  beforeEach(() => {
    eventBus.clear()
  })
  
  // 测试后清理事件总线
  afterEach(() => {
    eventBus.clear()
  })
  
  // 测试取消不存在的事件监听器
  test('should handle unsubscribe of non-existent listeners', () => {
    // 订阅一个事件
    const listenerId = eventBus.subscribe('auth:login', jest.fn())
    
    // 取消订阅一个不存在的事件类型
    expect(() => {
      eventBus.unsubscribe('auth:logout', listenerId)
    }).not.toThrow()
    
    // 取消订阅一个不存在的监听器ID
    expect(() => {
      eventBus.unsubscribe('auth:login', 'non-existent-listener-id')
    }).not.toThrow()
    
    // 验证原始监听器仍然存在
    expect(eventBus.getListenerCount('auth:login')).toBe(1)
  })
  
  // 测试发布不存在的事件类型
  test('should handle publishing non-existent event types', () => {
    // 发布一个不存在的事件类型，不应该抛出错误
    expect(() => {
      // 使用类型断言绕过TypeScript类型检查，测试边缘情况
      eventBus.publish('non-existent-event' as any, { data: 'test' })
    }).not.toThrow()
  })
  
  // 测试大量事件监听器
  test('should handle a large number of listeners', () => {
    const callbackCount = 10
    const mockCallbacks = Array.from({ length: callbackCount }, () => jest.fn())
    
    // 订阅大量事件监听器
    mockCallbacks.forEach(callback => {
      eventBus.subscribe('作品:创建', callback)
    })
    
    // 验证监听器数量
    expect(eventBus.getListenerCount('作品:创建')).toBe(callbackCount)
    
    // 发布事件
    const testData = { workId: '123', work: { title: 'Test Work' } }
    eventBus.publish('作品:创建', testData)
    
    // 验证所有回调函数都被调用
    mockCallbacks.forEach(callback => {
      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(testData)
    })
  })
})
