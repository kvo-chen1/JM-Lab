// 导入错误服务
import errorService from '../services/errorService';
import securityService from '../services/securityService';
import { recordNetworkRequest } from '../utils/performanceMonitor';
import eventBus from './eventBus'; // 导入事件总线

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions<TBody> {
  method?: HttpMethod
  headers?: Record<string, string>
  body?: TBody
  timeoutMs?: number
  retries?: number
  // 新增：缓存选项
  cache?: {
    enabled?: boolean
    ttl?: number // 缓存过期时间（毫秒）
    staleTtl?: number // 缓存过期后可使用的时间（毫秒）
    storageType?: CacheStorageType // 缓存存储类型
    key?: string // 自定义缓存键
    prefetch?: boolean // 是否预取数据
    revalidateOnFocus?: boolean // 窗口聚焦时重新验证
  }
  // 新增：防抖选项
  debounce?: {
    enabled?: boolean
    delay?: number // 防抖延迟（毫秒）
  }
  // 新增：节流选项
  throttle?: {
    enabled?: boolean
    limit?: number // 节流限制（毫秒）
  }
  // 新增：取消令牌
  signal?: AbortSignal
}

interface ApiResponse<T> {
  ok: boolean
  status: number
  data?: T
  error?: string
  fromCache?: boolean // 新增：是否来自缓存
}

// 定义ApiError类型
interface ApiError extends Error {
  status?: number
  data?: any
  path?: string
  method?: string
}

// 新增：中间件接口
interface Middleware {
  name: string
  // 中间件处理函数，接收请求上下文，返回修改后的上下文
  process: <TResp, TBody = unknown>(
    context: RequestContext<TResp, TBody>,
    next: () => Promise<ApiResponse<TResp>>
  ) => Promise<ApiResponse<TResp>>
}

// 新增：请求上下文
interface RequestContext<TResp, TBody = unknown> {
  path: string
  options: RequestOptions<TBody>
  method: HttpMethod
  url: string
  headers: Record<string, string>
  body?: TBody
  signal?: AbortSignal
  retries: number
  timeoutMs: number
  cacheKey: string
  isCacheEnabled: boolean
}

const DEFAULT_TIMEOUT = 10000
const DEFAULT_RETRIES = 1
const DEFAULT_CACHE_TTL = 60000 // 默认缓存时间1分钟
const DEFAULT_DEBOUNCE_DELAY = 300 // 默认防抖延迟300ms
const DEFAULT_THROTTLE_LIMIT = 1000 // 默认节流限制1秒

// 新增：中间件存储
const middlewares: Middleware[] = []

// 新增：注册中间件函数
export const registerMiddleware = (middleware: Middleware) => {
  middlewares.push(middleware)
}

// 新增：清除所有中间件函数
export const clearMiddlewares = () => {
  middlewares.length = 0
}

// 重试延迟配置
const baseDelay = 1000 // 基础延迟1秒
const jitter = 500 // 抖动延迟500ms
const maxDelay = 10000 // 最大延迟10秒

// 缓存存储类型
type CacheStorageType = 'memory' | 'session' | 'local'

// 缓存统计数据
interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  evictions: number
  size: number
}

// 新增：增强版缓存存储
class CacheStore {
  private cache: Map<string, { data: any; timestamp: number; ttl: number; staleTtl?: number }> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    size: 0
  }
  private storage: Storage | null = null
  private storageType: CacheStorageType
  private storagePrefix: string = 'api_cache_'

  constructor(storageType: CacheStorageType = 'memory') {
    this.storageType = storageType
    
    // 初始化持久化存储
    if (typeof window !== 'undefined') {
      if (storageType === 'session') {
        this.storage = sessionStorage
      } else if (storageType === 'local') {
        this.storage = localStorage
      }
      this.loadFromStorage()
    }
    
    // 定期清理过期缓存（每2分钟）
    this.cleanupInterval = setInterval(() => this.cleanupExpired(), 120000)
  }

  // 从持久化存储加载缓存
  private loadFromStorage(): void {
    if (!this.storage) return
    
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i)
        if (key && key.startsWith(this.storagePrefix)) {
          const actualKey = key.replace(this.storagePrefix, '')
          const item = this.storage.getItem(key)
          if (item) {
            const parsed = JSON.parse(item)
            this.cache.set(actualKey, parsed)
          }
        }
      }
      this.stats.size = this.cache.size
    } catch (error) {
      console.error('Failed to load cache from storage:', error)
    }
  }

  // 保存到持久化存储
  private saveToStorage(key: string, value: any): void {
    if (!this.storage) return
    
    try {
      this.storage.setItem(this.storagePrefix + key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to save cache to storage:', error)
      // 清理旧缓存以释放空间
      this.cleanupExpired()
    }
  }

  // 从持久化存储删除
  private removeFromStorage(key: string): void {
    if (!this.storage) return
    
    try {
      this.storage.removeItem(this.storagePrefix + key)
    } catch (error) {
      console.error('Failed to remove cache from storage:', error)
    }
  }

  // 获取缓存，支持stale-while-revalidate策略
  get(key: string, options?: { allowStale?: boolean }): { data: any; isStale: boolean } | null {
    const { allowStale = false } = options || {}
    const cached = this.cache.get(key)
    
    if (!cached) {
      this.stats.misses++
      return null
    }

    const now = Date.now()
    const isExpired = now - cached.timestamp > cached.ttl
    const isStale = isExpired && cached.staleTtl ? now - cached.timestamp > cached.staleTtl : isExpired
    
    if (isStale) {
      this.cache.delete(key)
      this.removeFromStorage(key)
      this.stats.evictions++
      this.stats.size--
      this.stats.misses++
      return null
    }
    
    this.stats.hits++
    return {
      data: cached.data,
      isStale: isExpired
    }
  }

  set(key: string, data: any, options?: { ttl?: number; staleTtl?: number }): void {
    const ttl = options?.ttl ?? DEFAULT_CACHE_TTL
    const staleTtl = options?.staleTtl ?? ttl * 2 // 默认stale时间为ttl的2倍
    
    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl,
      staleTtl
    }
    
    this.cache.set(key, cacheItem)
    this.saveToStorage(key, cacheItem)
    this.stats.sets++
    this.stats.size = this.cache.size
  }

  delete(key: string): void {
    this.cache.delete(key)
    this.removeFromStorage(key)
    this.stats.deletes++
    this.stats.size = this.cache.size
  }

  clear(): void {
    this.cache.clear()
    
    if (this.storage) {
      try {
        // 清除所有带有前缀的缓存项
        for (let i = 0; i < this.storage.length; i++) {
          const key = this.storage.key(i)
          if (key && key.startsWith(this.storagePrefix)) {
            this.storage.removeItem(key)
          }
        }
      } catch (error) {
        console.error('Failed to clear cache from storage:', error)
      }
    }
    
    this.stats.deletes += this.stats.size
    this.stats.size = 0
  }

  private cleanupExpired(): void {
    const now = Date.now()
    let evicted = 0
    
    for (const [key, cached] of this.cache.entries()) {
      const isStale = cached.staleTtl ? now - cached.timestamp > cached.staleTtl : now - cached.timestamp > cached.ttl
      if (isStale) {
        this.cache.delete(key)
        this.removeFromStorage(key)
        evicted++
      }
    }
    
    if (evicted > 0) {
      this.stats.evictions += evicted
      this.stats.size = this.cache.size
    }
  }

  // 获取缓存统计数据
  getStats(): CacheStats {
    return { ...this.stats }
  }

  // 获取所有缓存键
  getKeys(): string[] {
    return Array.from(this.cache.keys())
  }

  // 预取数据到缓存
  prefetch(key: string, data: any, options?: { ttl?: number; staleTtl?: number }): void {
    this.set(key, data, options)
  }

  // 销毁方法，清理定时器
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// 单例缓存实例
const cacheStore = new CacheStore()

// 新增：防抖存储
const debounceStore: Map<string, NodeJS.Timeout> = new Map()

// 新增：节流存储
const throttleStore: Map<string, { lastRan: number; inThrottle: boolean }> = new Map()

const getBaseUrl = () => {
  // 在开发环境下使用相对路径，让请求通过Vite代理
  // 在生产环境下可以配置为真实的API地址
  return ''
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: any
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('timeout')), timeoutMs)
  })
  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutId)
    return result as T
  } catch (e) {
    clearTimeout(timeoutId)
    throw e
  }
}

// 新增：生成缓存键
const generateCacheKey = (path: string, options: RequestOptions<any>): string => {
  const method = options.method || 'GET'
  const cacheKey = options.cache?.key
  
  if (cacheKey) return cacheKey
  
  // 对于GET请求，包含查询参数
  if (method === 'GET') {
    return `${method}:${path}`
  }
  
  // 对于其他请求，包含方法、路径和请求体摘要
  const bodyDigest = options.body ? JSON.stringify(options.body).substring(0, 100) : ''
  return `${method}:${path}:${bodyDigest}`
}

// 新增：防抖包装函数
const debounceRequest = <T>(
  key: string,
  fn: () => Promise<T>,
  delay: number
): Promise<T> => {
  return new Promise((resolve, reject) => {
    // 清除之前的防抖定时器
    const existingTimeout = debounceStore.get(key)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }
    
    // 设置新的防抖定时器
    const newTimeout = setTimeout(async () => {
      try {
        const result = await fn()
        resolve(result)
      } catch (error) {
        reject(error)
      } finally {
        debounceStore.delete(key)
      }
    }, delay) as NodeJS.Timeout
    
    debounceStore.set(key, newTimeout)
  })
}

// 新增：节流包装函数
const throttleRequest = <T>(
  key: string,
  fn: () => Promise<T>,
  limit: number
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const now = Date.now()
    const throttleData = throttleStore.get(key)
    
    if (!throttleData) {
      // 第一次执行
      throttleStore.set(key, { lastRan: now, inThrottle: false })
      fn().then(resolve).catch(reject)
    } else {
      const { lastRan, inThrottle } = throttleData
      const timeSinceLast = now - lastRan
      
      if (!inThrottle && timeSinceLast >= limit) {
        // 可以执行新请求
        throttleStore.set(key, { lastRan: now, inThrottle: false })
        fn().then(resolve).catch(reject)
      } else if (!inThrottle) {
        // 进入节流状态
        throttleStore.set(key, { lastRan, inThrottle: true })
        
        // 延迟执行
        const delay = limit - timeSinceLast
        setTimeout(async () => {
          try {
            const result = await fn()
            resolve(result)
          } catch (error) {
            reject(error)
          } finally {
            throttleStore.set(key, { lastRan: Date.now(), inThrottle: false })
          }
        }, delay)
      } else {
        // 已经在节流状态，拒绝新请求
        reject(new Error('Request throttled'))
      }
    }
  })
}

export async function apiRequest<TResp, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {}
): Promise<ApiResponse<TResp>> {
  const base = getBaseUrl()
  console.log(`[API Client] getBaseUrl() 返回: ${base}`)
  const url = base ? `${base}${path}` : path
  console.log(`[API Client] 构建的URL: ${url}`)
  const altUrl = path
  const method = options.method || 'GET'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT
  const retries = options.retries ?? DEFAULT_RETRIES
  
  // 生成请求键，用于缓存、防抖和节流
  const requestKey = generateCacheKey(path, options)
  
  // 检查缓存
  const cacheOptions = options.cache || {}
  const isCacheEnabled = cacheOptions.enabled !== false && method === 'GET'
  let cachedResult: { data: any; isStale: boolean } | null = null
  
  // 检查缓存
  if (isCacheEnabled) {
    cachedResult = cacheStore.get(requestKey, { allowStale: true })
    if (cachedResult) {
      // 记录缓存命中
      console.log(`API Cache Hit: ${method} ${path} (stale: ${cachedResult.isStale})`);
      
      // 发布缓存命中事件
      eventBus.publish('数据:刷新', { 
        type: 'api-cache-hit', 
        payload: { path, method, stale: cachedResult.isStale } 
      });
      
      // 如果数据过期但未失效，返回缓存数据并在后台重新验证
      if (cachedResult.isStale) {
        // 在后台重新验证缓存
        actualRequest()
          .catch(error => {
            console.warn('Cache revalidation failed:', error);
            // 记录缓存重新验证错误
            console.error(`Cache Revalidation Failed: ${method} ${path}`, error);
            // 发布缓存重新验证失败事件
            eventBus.publish('数据:刷新', { 
              type: 'api-cache-revalidation-failed', 
              payload: { path, method, error: error.message } 
            });
          });
      }
      
      // 记录网络请求性能数据（缓存命中）
      recordNetworkRequest({
        url: url,
        method,
        duration: 0, // 缓存命中，耗时为0
        status: 200,
        size: 0, // 缓存命中，不计算大小
        timestamp: Date.now(),
        fromCache: true,
        retries: 0,
      });
      
      return { ok: true, status: 200, data: cachedResult.data as TResp, fromCache: true }
    } else {
      // 记录缓存未命中
      console.log(`API Cache Miss: ${method} ${path}`);
    }
  }
  
  // 定义实际请求函数（使用函数声明，解决调用前未定义的问题）
  async function actualRequest(): Promise<ApiResponse<TResp>> {
    let attempt = 0
    let useFallback = false
    
    // 定义可重试的错误类型
    const retryableErrors = ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'TIMEOUT', 'NETWORK_ERROR', 'fetch failed', 'Failed to fetch']
    
    while (attempt <= retries) {
      try {
        // 构建请求URL：先尝试主URL，失败后尝试回退URL
        const target = useFallback ? altUrl : url
        
        // 记录请求开始时间
        const startTime = performance.now()
        const timestamp = Date.now()
        
        // 发布请求开始事件
        eventBus.publish('数据:刷新', { 
          type: 'api-request-start', 
          payload: { path, method, url: target, body: options.body, timestamp } 
        });
        
        console.log(`API Client: 开始请求 ${method} ${target}`)
        console.log(`API Client: 请求参数`, options.body)
        
        // 生成请求签名
        const bodyString = options.body ? JSON.stringify(options.body) : ''
        const signatureData = `${method}:${target}:${timestamp}:${bodyString}`
        const signature = await securityService.generateSignature(signatureData, timestamp)
        
        // 获取认证令牌
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        
        // 添加安全头和认证头
        const secureHeaders = {
          ...headers,
          'X-Request-Timestamp': timestamp.toString(),
          'X-Request-Signature': signature,
          'X-Request-Id': securityService.generateUUID(),
          ...(token && { 'Authorization': `Bearer ${token}` }),
        }
        
        // 记录请求开始
        const requestStartTime = Date.now()
        
        const fetchPromise = fetch(target, {
          method,
          headers: secureHeaders,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: options.signal,
        })
        
        const res = await withTimeout(fetchPromise, timeoutMs)
        
        // 计算请求耗时
        const endTime = performance.now()
        const duration = endTime - startTime
        const requestEndTime = Date.now()
        
        // 记录响应大小（从响应头获取）
        const contentLength = res.headers.get('content-length')
        const size = contentLength ? parseInt(contentLength, 10) : 0
        
        console.log(`API Client: 收到响应 ${method} ${target} ${res.status} (${duration.toFixed(2)}ms)`)
        
        // 解析响应
        const contentType = res.headers.get('content-type')
        let data: any
        if (contentType?.includes('application/json')) {
          try {
            data = await res.json()
          } catch (jsonError) {
            // 捕获JSON解析错误，提供友好的中文提示
            const errorMessage = jsonError instanceof Error ? jsonError.message : 'JSON解析错误'
            if (errorMessage.includes('Unexpected end of JSON input')) {
              data = { error: '服务器返回的JSON格式无效，缺少必要内容', originalError: errorMessage }
            } else {
              data = { error: '服务器返回的JSON格式无效', originalError: errorMessage }
            }
          }
        } else {
          // 非JSON响应作为文本处理
          data = await res.text()
        }
        
        // 处理成功响应
        if (res.ok) {
          // 统一API响应格式：无论后端返回什么格式，都统一转换为ApiResponse格式
          let responseData: any
          
          // 如果响应是ApiResponse格式，直接使用其data字段
          if (typeof data === 'object' && data !== null && 'ok' in data && 'data' in data) {
            const apiResponse = data as ApiResponse<TResp>
            responseData = apiResponse.data
          } else {
            // 否则，直接将响应数据作为data字段
            responseData = data
          }
          
          // 更新缓存
          if (isCacheEnabled && res.ok) {
            cacheStore.set(requestKey, responseData, {
              ttl: cacheOptions.ttl,
              staleTtl: cacheOptions.staleTtl
            })
            // 发布缓存更新事件
            eventBus.publish('数据:刷新', { 
              type: 'api-cache-updated', 
              payload: { path, method, cacheKey: requestKey } 
            });
          }
          
          // 记录网络请求性能数据
          recordNetworkRequest({
            url: target,
            method,
            duration,
            status: res.status,
            size,
            timestamp: requestStartTime,
            fromCache: false,
            retries: 0,
          })
          
          // 发布请求成功事件
          eventBus.publish('数据:刷新', { 
            type: 'api-request-success', 
            payload: { path, method, url: target, status: res.status, data: responseData, duration } 
          });
          
          // 返回统一格式的响应
          return { ok: true, status: res.status, data: responseData as TResp, fromCache: false }
        }
        
        // 处理错误响应
        let errorMessage: string
        let errorData: any = data
        
        // 统一错误信息格式
        if (typeof data === 'object' && data !== null) {
          // 如果是ApiResponse格式的错误，优先使用message字段（中文提示），如果没有则使用error字段
          if ('message' in data) {
            errorMessage = String(data.message || `Request failed with status ${res.status}`)
          } 
          // 如果没有message字段，再使用error字段
          else if ('error' in data) {
            errorMessage = String(data.error || `Request failed with status ${res.status}`)
          }
          // 如果是包含errors字段的错误（例如表单验证错误）
          else if ('errors' in data) {
            errorMessage = Array.isArray(data.errors) ? data.errors.join(', ') : String(data.errors || `Request failed with status ${res.status}`)
          }
          // 其他对象类型的错误
          else {
            errorMessage = JSON.stringify(data) || `Request failed with status ${res.status}`
          }
        } else {
          // 非对象类型的错误
          errorMessage = String(data || `Request failed with status ${res.status}`)
        }
        
        // 创建ApiError对象
        const error = new Error(errorMessage) as ApiError
        error.status = res.status
        error.data = errorData
        error.path = path
        error.method = method
        
        // 记录错误
        console.error(`API Error: ${method} ${path} ${res.status}`, error)
        
        // 记录网络请求性能数据（错误情况）
        recordNetworkRequest({
          url: target,
          method,
          duration,
          status: res.status,
          size,
          timestamp: requestStartTime,
          fromCache: false,
          retries: 0,
          error: errorMessage,
        })
        
        // 发布请求失败事件
        eventBus.publish('数据:刷新', { 
          type: 'api-request-error', 
          payload: { path, method, url: target, status: res.status, error: errorMessage, data: errorData, duration } 
        });
        
        // 抛出错误
        throw error
      } catch (error) {
        attempt++
        
        // 记录失败的请求
        console.error(`API Request Failed: ${method} ${path} (Attempt ${attempt}/${retries + 1})`, error)
        
        // 记录网络请求性能数据（失败情况）
        recordNetworkRequest({
          url: useFallback ? altUrl : url,
          method,
          duration: timeoutMs,
          status: 500,
          size: 0,
          timestamp: Date.now(),
          fromCache: false,
          retries: attempt - 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        
        // 发布请求重试事件
        const errorObj = error as Error
        eventBus.publish('数据:刷新', { 
          type: 'api-request-retry', 
          payload: { path, method, attempt, retries, error: errorObj.message, timeoutMs } 
        });
        
        // 如果是最后一次尝试，或者错误不可重试，抛出错误
        if (attempt > retries || !retryableErrors.some(code => error instanceof Error && error.message.includes(code))) {
          // 如果未使用回退URL，尝试使用回退URL
          if (!useFallback && altUrl) {
            useFallback = true
            attempt = 0
            continue
          }
          
          // 回退URL也失败了，返回统一格式的错误响应
          const finalError = error as Error
          const finalErrorMessage = finalError.message || 'Unknown error'
          
          // 发布请求最终失败事件
          eventBus.publish('数据:刷新', { 
            type: 'api-request-failed', 
            payload: { path, method, url: useFallback ? altUrl : url, error: finalErrorMessage, retries: attempt - 1 } 
          });
          
          return {
            ok: false,
            status: 500,
            error: finalErrorMessage,
            data: null as any,
            fromCache: false
          }
        }
        
        // 计算延迟时间（指数退避）
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1) + Math.random() * jitter, maxDelay)
        
        // 等待延迟后重试
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    // 这个return语句理论上不会被执行，因为while循环中已经处理了所有情况
    const finalErrorMessage = 'Max retries exceeded'
    eventBus.publish('数据:刷新', { 
      type: 'api-request-failed', 
      payload: { path, method, url: useFallback ? altUrl : url, error: finalErrorMessage, retries: retries } 
    });
    
    return {
      ok: false,
      status: 500,
      error: finalErrorMessage,
      data: null as any,
      fromCache: false
    }
  }
  
  // 新增：中间件执行逻辑
  // 构建请求上下文
  const context: RequestContext<TResp, TBody> = {
    path,
    options,
    method,
    url,
    headers,
    body: options.body,
    signal: options.signal,
    retries,
    timeoutMs,
    cacheKey: requestKey,
    isCacheEnabled
  }
  
  // 构建中间件链
  const executeMiddlewareChain = async (index: number): Promise<ApiResponse<TResp>> => {
    if (index >= middlewares.length) {
      // 所有中间件执行完毕，执行实际请求
      return actualRequest()
    }
    
    const middleware = middlewares[index]
    try {
      // 执行当前中间件
      return await middleware.process(context, () => executeMiddlewareChain(index + 1))
    } catch (error) {
      console.error(`Middleware ${middleware.name} failed:`, error)
      // 中间件执行失败，返回错误响应
      return {
        ok: false,
        status: 500,
        error: `Middleware ${middleware.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: null as any,
        fromCache: false
      }
    }
  }
  
  // 执行中间件链
  return executeMiddlewareChain(0)
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions<never>) => apiRequest<T, never>(path, { ...options, method: 'GET' }),
  post: <T, B = unknown>(path: string, body?: B, options?: RequestOptions<B>) => apiRequest<T, B>(path, { ...options, method: 'POST', body }),
  put: <T, B = unknown>(path: string, body?: B, options?: RequestOptions<B>) => apiRequest<T, B>(path, { ...options, method: 'PUT', body }),
  patch: <T, B = unknown>(path: string, body?: B, options?: RequestOptions<B>) => apiRequest<T, B>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions<never>) => apiRequest<T, never>(path, { ...options, method: 'DELETE' }),
  
  // 新增：中间件管理方法
  middleware: {
    // 注册中间件
    register: (middleware: Middleware) => registerMiddleware(middleware),
    // 清除所有中间件
    clearAll: () => clearMiddlewares(),
    // 获取所有注册的中间件
    getAll: () => [...middlewares],
  },
  
  // 缓存管理方法
  cache: {
    // 清理特定键的缓存
    clear: (key: string) => cacheStore.delete(key),
    // 清理所有缓存
    clearAll: () => cacheStore.clear(),
    // 获取缓存键
    getKey: (path: string, options?: RequestOptions<any>) => generateCacheKey(path, options || { method: 'GET' }),
    // 获取缓存统计数据
    getStats: () => cacheStore.getStats(),
    // 获取所有缓存键
    getKeys: () => cacheStore.getKeys(),
    // 预取数据到缓存
    prefetch: <T>(key: string, data: T, options?: { ttl?: number; staleTtl?: number }) => {
      cacheStore.prefetch(key, data, options)
    },
    // 手动验证缓存
    revalidate: <T>(path: string, options?: RequestOptions<never>) => {
      return apiRequest<T, never>(path, { ...options, method: 'GET', cache: { ...options?.cache, enabled: true } })
    },
  },
  
  // 防抖管理方法
  debounce: {
    // 清除特定键的防抖定时器
    clear: (key: string) => {
      const timeout = debounceStore.get(key)
      if (timeout) {
        clearTimeout(timeout)
        debounceStore.delete(key)
      }
    },
    // 清除所有防抖定时器
    clearAll: () => {
      for (const timeout of debounceStore.values()) {
        clearTimeout(timeout)
      }
      debounceStore.clear()
    },
  },
  
  // 节流管理方法
  throttle: {
    // 清除特定键的节流状态
    clear: (key: string) => throttleStore.delete(key),
    // 清除所有节流状态
    clearAll: () => throttleStore.clear(),
  },
  
  // 取消所有进行中的请求（通过AbortController）
  cancelAll: () => {
    // 这里可以实现更复杂的请求取消逻辑
    // 目前主要通过AbortSignal机制让调用方自行管理
    console.warn('apiClient.cancelAll() is not fully implemented. Use AbortSignal for request cancellation.')
  },
  
  // 性能监控方法
  performance: {
    // 获取缓存统计
    getCacheStats: () => cacheStore.getStats(),
  },
}

export default apiClient
