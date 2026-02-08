/**
 * 增强版API缓存服务
 * 提供多级缓存策略：内存 -> sessionStorage -> localStorage
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  staleTtl?: number;
}

interface CacheOptions {
  ttl?: number; // 缓存有效期（毫秒）
  staleTtl?: number; // 过期后可使用的时间（毫秒）
  storage?: 'memory' | 'session' | 'local';
  key?: string; // 自定义缓存键
}

const DEFAULT_TTL = 5 * 60 * 1000; // 默认5分钟
const DEFAULT_STALE_TTL = 60 * 1000; // 默认1分钟

class CacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private maxMemorySize = 50; // 内存缓存最大条目数

  /**
   * 生成缓存键
   */
  private generateKey(url: string, params?: Record<string, any>): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `cache_${url}_${paramsStr}`;
  }

  /**
   * 获取缓存
   */
  get<T>(url: string, params?: Record<string, any>, options?: CacheOptions): T | null {
    const key = options?.key || this.generateKey(url, params);
    const storage = options?.storage || 'memory';

    // 先尝试内存缓存
    if (storage === 'memory' || storage === 'session' || storage === 'local') {
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && this.isValid(memoryEntry)) {
        return memoryEntry.data as T;
      }
    }

    // 尝试sessionStorage
    if (storage === 'session' || storage === 'local') {
      try {
        const sessionData = sessionStorage.getItem(key);
        if (sessionData) {
          const entry: CacheEntry<T> = JSON.parse(sessionData);
          if (this.isValid(entry)) {
            // 同步到内存缓存
            this.setMemory(key, entry);
            return entry.data;
          }
        }
      } catch (e) {
        console.warn('SessionStorage cache read failed:', e);
      }
    }

    // 尝试localStorage
    if (storage === 'local') {
      try {
        const localData = localStorage.getItem(key);
        if (localData) {
          const entry: CacheEntry<T> = JSON.parse(localData);
          if (this.isValid(entry)) {
            // 同步到内存和session缓存
            this.setMemory(key, entry);
            this.setSession(key, entry);
            return entry.data;
          }
        }
      } catch (e) {
        console.warn('LocalStorage cache read failed:', e);
      }
    }

    return null;
  }

  /**
   * 设置缓存
   */
  set<T>(url: string, data: T, params?: Record<string, any>, options?: CacheOptions): void {
    const key = options?.key || this.generateKey(url, params);
    const ttl = options?.ttl || DEFAULT_TTL;
    const staleTtl = options?.staleTtl || DEFAULT_STALE_TTL;
    const storage = options?.storage || 'memory';

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      staleTtl,
    };

    // 设置内存缓存
    if (storage === 'memory' || storage === 'session' || storage === 'local') {
      this.setMemory(key, entry);
    }

    // 设置sessionStorage
    if (storage === 'session' || storage === 'local') {
      this.setSession(key, entry);
    }

    // 设置localStorage
    if (storage === 'local') {
      this.setLocal(key, entry);
    }
  }

  /**
   * 检查缓存是否有效
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    const now = Date.now();
    const age = now - entry.timestamp;
    
    // 在TTL内，缓存有效
    if (age < entry.ttl) {
      return true;
    }
    
    // 在staleTtl内，缓存可用但应该刷新
    if (entry.staleTtl && age < entry.ttl + entry.staleTtl) {
      return true;
    }
    
    return false;
  }

  /**
   * 设置内存缓存
   */
  private setMemory<T>(key: string, entry: CacheEntry<T>): void {
    // LRU清理策略
    if (this.memoryCache.size >= this.maxMemorySize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    this.memoryCache.set(key, entry);
  }

  /**
   * 设置sessionStorage缓存
   */
  private setSession<T>(key: string, entry: CacheEntry<T>): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
      // 如果存储满了，清理旧数据
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        this.cleanupSessionStorage();
        try {
          sessionStorage.setItem(key, JSON.stringify(entry));
        } catch (e2) {
          console.warn('SessionStorage cache write failed:', e2);
        }
      }
    }
  }

  /**
   * 设置localStorage缓存
   */
  private setLocal<T>(key: string, entry: CacheEntry<T>): void {
    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
      // 如果存储满了，清理旧数据
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        this.cleanupLocalStorage();
        try {
          localStorage.setItem(key, JSON.stringify(entry));
        } catch (e2) {
          console.warn('LocalStorage cache write failed:', e2);
        }
      }
    }
  }

  /**
   * 清理sessionStorage中的过期缓存
   */
  private cleanupSessionStorage(): void {
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('cache_')) {
          const data = sessionStorage.getItem(key);
          if (data) {
            try {
              const entry: CacheEntry<any> = JSON.parse(data);
              if (!this.isValid(entry)) {
                sessionStorage.removeItem(key);
              }
            } catch {
              sessionStorage.removeItem(key);
            }
          }
        }
      }
    } catch (e) {
      console.warn('SessionStorage cleanup failed:', e);
    }
  }

  /**
   * 清理localStorage中的过期缓存
   */
  private cleanupLocalStorage(): void {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('cache_')) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const entry: CacheEntry<any> = JSON.parse(data);
              if (!this.isValid(entry)) {
                localStorage.removeItem(key);
              }
            } catch {
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (e) {
      console.warn('LocalStorage cleanup failed:', e);
    }
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.memoryCache.clear();
    
    // 清理sessionStorage
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('cache_')) {
          sessionStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn('SessionStorage clear failed:', e);
    }

    // 清理localStorage
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn('LocalStorage clear failed:', e);
    }
  }

  /**
   * 删除特定缓存
   */
  remove(url: string, params?: Record<string, any>, options?: CacheOptions): void {
    const key = options?.key || this.generateKey(url, params);
    const storage = options?.storage || 'memory';

    if (storage === 'memory' || storage === 'session' || storage === 'local') {
      this.memoryCache.delete(key);
    }

    if (storage === 'session' || storage === 'local') {
      try {
        sessionStorage.removeItem(key);
      } catch (e) {
        console.warn('SessionStorage remove failed:', e);
      }
    }

    if (storage === 'local') {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('LocalStorage remove failed:', e);
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { memory: number; session: number; local: number } {
    let sessionCount = 0;
    let localCount = 0;

    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('cache_')) sessionCount++;
      }
    } catch (e) {
      console.warn('SessionStorage stats failed:', e);
    }

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('cache_')) localCount++;
      }
    } catch (e) {
      console.warn('LocalStorage stats failed:', e);
    }

    return {
      memory: this.memoryCache.size,
      session: sessionCount,
      local: localCount,
    };
  }
}

// 导出单例实例
export const cacheService = new CacheService();

// 导出默认实例
export default cacheService;
