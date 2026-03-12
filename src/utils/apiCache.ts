/**
 * API 请求缓存工具
 * 提供请求级缓存，减少重复请求，提升性能
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl: number; // 缓存时间（毫秒）
  maxSize: number; // 最大缓存条目数
}

const DEFAULT_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 默认5分钟
  maxSize: 100, // 最多100条缓存
};

class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 生成缓存键
   */
  private generateKey(url: string, params?: Record<string, any>): string {
    if (!params) return url;
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);
    return `${url}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * 获取缓存数据
   */
  get<T>(url: string, params?: Record<string, any>): T | null {
    const key = this.generateKey(url, params);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // 检查是否过期
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * 设置缓存数据
   */
  set<T>(url: string, data: T, params?: Record<string, any>, ttl?: number): void {
    const key = this.generateKey(url, params);
    
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttl || this.config.ttl),
    });
  }

  /**
   * 删除缓存
   */
  invalidate(url: string, params?: Record<string, any>): void {
    const key = this.generateKey(url, params);
    this.cache.delete(key);
  }

  /**
   * 根据 URL 模式删除缓存
   */
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      ttl: this.config.ttl,
    };
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// 导出单例实例
export const apiCache = new APICache();

/**
 * 带缓存的 fetch 函数
 */
export async function fetchWithCache<T>(
  url: string,
  options?: RequestInit & { params?: Record<string, any>; ttl?: number; skipCache?: boolean }
): Promise<T> {
  const { params, ttl, skipCache, ...fetchOptions } = options || {};

  // 如果不跳过缓存，先尝试从缓存获取
  if (!skipCache) {
    const cached = apiCache.get<T>(url, params);
    if (cached !== null) {
      return cached;
    }
  }

  // 构建完整 URL
  const fullUrl = params
    ? `${url}?${new URLSearchParams(params).toString()}`
    : url;

  const response = await fetch(fullUrl, fetchOptions);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  // 缓存结果
  if (!skipCache) {
    apiCache.set(url, data, params, ttl);
  }

  return data as T;
}

/**
 * Supabase 查询缓存包装器
 */
export function withCache<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  cacheKey: string,
  ttl?: number
): () => Promise<{ data: T | null; error: any }> {
  return async () => {
    // 尝试从缓存获取
    const cached = apiCache.get<T>(cacheKey);
    if (cached !== null) {
      return { data: cached, error: null };
    }

    // 执行查询
    const result = await queryFn();

    // 缓存成功结果
    if (!result.error && result.data) {
      apiCache.set(cacheKey, result.data, undefined, ttl);
    }

    return result;
  };
}

/**
 * 缓存装饰器（用于类方法）
 */
export function Cacheable(ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}.${propertyKey}:${JSON.stringify(args)}`;
      
      const cached = apiCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      apiCache.set(cacheKey, result, undefined, ttl);
      return result;
    };

    return descriptor;
  };
}

/**
 * 手动清除缓存的工具函数
 */
export const cacheUtils = {
  /**
   * 清除所有缓存
   */
  clearAll: () => apiCache.clear(),

  /**
   * 清除特定 URL 的缓存
   */
  invalidate: (url: string, params?: Record<string, any>) => 
    apiCache.invalidate(url, params),

  /**
   * 根据模式清除缓存
   */
  invalidatePattern: (pattern: RegExp) => apiCache.invalidatePattern(pattern),

  /**
   * 清理过期缓存
   */
  cleanup: () => apiCache.cleanup(),

  /**
   * 获取缓存统计
   */
  getStats: () => apiCache.getStats(),
};

export default apiCache;
