// 缓存服务

// 缓存策略类型
export type CacheStrategy = 'memory' | 'localStorage' | 'sessionStorage' | 'none'

// 缓存项类型
interface CacheItem<T = any> {
  data: T
  timestamp: number
  ttl: number // 过期时间（毫秒）
  lastAccess?: number // 最后访问时间，用于LRU策略
  version?: string // 缓存版本，用于版本控制
}

// 缓存配置类型
interface CacheConfig {
  defaultTtl: number // 默认过期时间（毫秒）
  defaultStrategy: CacheStrategy
  maxMemoryItems: number // 内存缓存最大项数
  namespace?: string // 缓存命名空间
  enableLru?: boolean // 是否启用LRU策略
  enableVersioning?: boolean // 是否启用版本控制
  defaultVersion?: string // 默认缓存版本
}

// 内存缓存存储 - 实现LRU策略
class MemoryCache {
  private cache = new Map<string, CacheItem>()
  private maxItems: number
  private enableLru: boolean

  constructor(maxItems: number = 100, enableLru: boolean = true) {
    this.maxItems = maxItems
    this.enableLru = enableLru
  }

  set(key: string, value: CacheItem) {
    // 移除过期项
    this.removeExpiredItems()

    // 更新最后访问时间
    const now = Date.now()
    const cacheItem = {
      ...value,
      lastAccess: now
    }

    // 如果缓存已满，使用LRU策略移除项
    if (this.cache.size >= this.maxItems) {
      if (this.enableLru) {
        // 找到最后访问时间最早的项
        let oldestKey: string | undefined
        let oldestTime = Infinity
        
        for (const [k, item] of this.cache.entries()) {
          if (item.lastAccess && item.lastAccess < oldestTime) {
            oldestTime = item.lastAccess
            oldestKey = k
          }
        }
        
        if (oldestKey) {
          this.cache.delete(oldestKey)
        }
      } else {
        // 简单移除第一个项
        const firstKey = this.cache.keys().next().value
        if (firstKey) {
          this.cache.delete(firstKey)
        }
      }
    }

    this.cache.set(key, cacheItem)
  }

  get(key: string): CacheItem | undefined {
    const item = this.cache.get(key)
    if (item && !this.isExpired(item)) {
      // 更新最后访问时间
      item.lastAccess = Date.now()
      this.cache.set(key, item)
      return item
    }
    // 如果过期了，移除该项
    this.cache.delete(key)
    return undefined
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  getSize(): number {
    return this.cache.size
  }

  private isExpired(item: CacheItem): boolean {
    return Date.now() > item.timestamp + item.ttl
  }

  private removeExpiredItems() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp + item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// 缓存服务类
export class CacheService {
  private memoryCache: MemoryCache
  private config: CacheConfig

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      defaultTtl: config?.defaultTtl || 30 * 60 * 1000, // 默认30分钟
      defaultStrategy: config?.defaultStrategy || 'memory',
      maxMemoryItems: config?.maxMemoryItems || 100,
      namespace: config?.namespace || 'app',
      enableLru: config?.enableLru || true,
      enableVersioning: config?.enableVersioning || false,
      defaultVersion: config?.defaultVersion || '1.0'
    }
    this.memoryCache = new MemoryCache(this.config.maxMemoryItems, this.config.enableLru)
  }

  /**
   * 生成带命名空间和版本的缓存键
   */
  private generateKey(key: string, version?: string): string {
    const cacheVersion = version || (this.config.enableVersioning ? this.config.defaultVersion : undefined)
    const parts = [this.config.namespace, key]
    if (cacheVersion) {
      parts.push(cacheVersion)
    }
    return parts.join(':')
  }

  /**
   * 设置缓存
   */
  set<T>(
    key: string,
    data: T,
    options?: {
      ttl?: number
      strategy?: CacheStrategy
      version?: string
    }
  ): void {
    const ttl = options?.ttl || this.config.defaultTtl
    const strategy = options?.strategy || this.config.defaultStrategy
    const version = options?.version

    if (strategy === 'none') {
      return
    }

    const cacheKey = this.generateKey(key, version)
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version: version
    }

    switch (strategy) {
      case 'memory':
        this.memoryCache.set(cacheKey, cacheItem)
        break
      case 'localStorage':
        try {
          localStorage.setItem(cacheKey, JSON.stringify(cacheItem))
        } catch (error) {
          console.error('Failed to set localStorage:', error)
        }
        break
      case 'sessionStorage':
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(cacheItem))
        } catch (error) {
          console.error('Failed to set sessionStorage:', error)
        }
        break
    }
  }

  /**
   * 获取缓存
   */
  get<T>(
    key: string,
    options?: {
      strategy?: CacheStrategy
      version?: string
    }
  ): T | null {
    const strategy = options?.strategy || this.config.defaultStrategy
    const version = options?.version

    if (strategy === 'none') {
      return null
    }

    const cacheKey = this.generateKey(key, version)
    let cacheItem: CacheItem<T> | undefined

    switch (strategy) {
      case 'memory':
        cacheItem = this.memoryCache.get(cacheKey) as CacheItem<T> | undefined
        break
      case 'localStorage':
        try {
          const item = localStorage.getItem(cacheKey)
          if (item) {
            cacheItem = JSON.parse(item) as CacheItem<T>
            // 检查是否过期
            if (this.isExpired(cacheItem)) {
              localStorage.removeItem(cacheKey)
              cacheItem = undefined
            }
          }
        } catch (error) {
          console.error('Failed to get localStorage:', error)
        }
        break
      case 'sessionStorage':
        try {
          const item = sessionStorage.getItem(cacheKey)
          if (item) {
            cacheItem = JSON.parse(item) as CacheItem<T>
            // 检查是否过期
            if (this.isExpired(cacheItem)) {
              sessionStorage.removeItem(cacheKey)
              cacheItem = undefined
            }
          }
        } catch (error) {
          console.error('Failed to get sessionStorage:', error)
        }
        break
    }

    return cacheItem ? cacheItem.data : null
  }

  /**
   * 删除缓存
   */
  delete(key: string, options?: {
    strategy?: CacheStrategy
    version?: string
  }): void {
    const strategy = options?.strategy || this.config.defaultStrategy
    const version = options?.version

    if (strategy === 'none') {
      return
    }

    const cacheKey = this.generateKey(key, version)

    switch (strategy) {
      case 'memory':
        this.memoryCache.delete(cacheKey)
        break
      case 'localStorage':
        try {
          localStorage.removeItem(cacheKey)
        } catch (error) {
          console.error('Failed to delete localStorage:', error)
        }
        break
      case 'sessionStorage':
        try {
          sessionStorage.removeItem(cacheKey)
        } catch (error) {
          console.error('Failed to delete sessionStorage:', error)
        }
        break
    }

    // 同时删除其他策略中的相同键
    if (strategy) {
      this.deleteFromOtherStrategies(key, strategy, version)
    }
  }

  /**
   * 清除所有缓存
   */
  clear(strategy?: CacheStrategy): void {
    if (!strategy) {
      // 清除所有策略的缓存
      this.memoryCache.clear()
      try {
        // 只清除当前命名空间的缓存
        this.clearNamespaceFromStorage(localStorage)
      } catch (error) {
        console.error('Failed to clear localStorage:', error)
      }
      try {
        // 只清除当前命名空间的缓存
        this.clearNamespaceFromStorage(sessionStorage)
      } catch (error) {
        console.error('Failed to clear sessionStorage:', error)
      }
    } else {
      // 清除指定策略的缓存
      switch (strategy) {
        case 'memory':
          this.memoryCache.clear()
          break
        case 'localStorage':
          try {
            this.clearNamespaceFromStorage(localStorage)
          } catch (error) {
            console.error('Failed to clear localStorage:', error)
          }
          break
        case 'sessionStorage':
          try {
            this.clearNamespaceFromStorage(sessionStorage)
          } catch (error) {
            console.error('Failed to clear sessionStorage:', error)
          }
          break
      }
    }
  }

  /**
   * 从存储中清除指定命名空间的缓存
   */
  private clearNamespaceFromStorage(storage: Storage): void {
    const keysToRemove: string[] = []
    const namespacePrefix = `${this.config.namespace}:`
    
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key && key.startsWith(namespacePrefix)) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => storage.removeItem(key))
  }

  /**
   * 检查缓存是否存在且未过期
   */
  has(key: string, options?: {
    strategy?: CacheStrategy
    version?: string
  }): boolean {
    return this.get(key, options) !== null
  }

  /**
   * 缓存预热 - 预加载多个键值对
   */
  preload(items: Array<{
    key: string
    data: any
    ttl?: number
    strategy?: CacheStrategy
    version?: string
  }>): void {
    items.forEach(item => {
      this.set(item.key, item.data, {
        ttl: item.ttl,
        strategy: item.strategy,
        version: item.version
      })
    })
  }

  /**
   * 缓存预取 - 根据键预取数据
   */
  prefetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: {
      ttl?: number
      strategy?: CacheStrategy
      version?: string
    }
  ): Promise<T> {
    // 先检查缓存
    const cachedData = this.get<T>(key, options)
    if (cachedData) {
      return Promise.resolve(cachedData)
    }

    // 缓存不存在，执行获取函数并缓存结果
    return fetchFn().then(data => {
      this.set(key, data, options)
      return data
    })
  }

  /**
   * 获取缓存统计信息
   */
  getStats(strategy?: CacheStrategy): {
    memoryItems?: number
    localStorageItems?: number
    sessionStorageItems?: number
    namespace?: string
  } {
    const stats: any = {
      namespace: this.config.namespace
    }

    if (!strategy || strategy === 'memory') {
      stats.memoryItems = this.memoryCache.getSize()
    }

    if (!strategy || strategy === 'localStorage') {
      try {
        // 只统计当前命名空间的缓存项
        const namespacePrefix = `${this.config.namespace}:`
        let count = 0
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(namespacePrefix)) {
            count++
          }
        }
        stats.localStorageItems = count
      } catch (error) {
        console.error('Failed to get localStorage stats:', error)
      }
    }

    if (!strategy || strategy === 'sessionStorage') {
      try {
        // 只统计当前命名空间的缓存项
        const namespacePrefix = `${this.config.namespace}:`
        let count = 0
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (key && key.startsWith(namespacePrefix)) {
            count++
          }
        }
        stats.sessionStorageItems = count
      } catch (error) {
        console.error('Failed to get sessionStorage stats:', error)
      }
    }

    return stats
  }

  /**
   * 从其他策略中删除相同键
   */
  private deleteFromOtherStrategies(key: string, excludeStrategy: CacheStrategy, version?: string): void {
    const strategies: CacheStrategy[] = ['memory', 'localStorage', 'sessionStorage']
    strategies.forEach(strategy => {
      if (strategy !== excludeStrategy) {
        this.delete(key, {
          strategy: strategy,
          version: version
        })
      }
    })
  }

  /**
   * 检查缓存项是否过期
   */
  private isExpired(item: CacheItem): boolean {
    return Date.now() > item.timestamp + item.ttl
  }
}

// 创建单例实例
const cacheService = new CacheService()

export default cacheService
