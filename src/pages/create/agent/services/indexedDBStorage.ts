// IndexedDB存储层 - 替代localStorage的大数据量存储方案

import { VectorItem } from './vectorStore';
import { FeedbackData } from './feedbackLoop';

// 数据库配置
const DB_NAME = 'AgentIntelligenceDB';
const DB_VERSION = 1;

// 存储表名
export enum StoreName {
  VECTORS = 'vectors',
  FEEDBACKS = 'feedbacks',
  BEHAVIORS = 'behaviors',
  USER_PROFILES = 'userProfiles',
  CONVERSATIONS = 'conversations',
  GENERATED_OUTPUTS = 'generatedOutputs',
  CACHE = 'cache'
}

// 存储配置
interface StoreConfig {
  keyPath: string;
  indexes: { name: string; keyPath: string; unique: boolean }[];
}

// 存储表配置
const STORE_CONFIGS: Record<StoreName, StoreConfig> = {
  [StoreName.VECTORS]: {
    keyPath: 'id',
    indexes: [
      { name: 'type', keyPath: 'metadata.type', unique: false },
      { name: 'timestamp', keyPath: 'metadata.createdAt', unique: false },
      { name: 'tags', keyPath: 'metadata.tags', unique: false, multiEntry: true }
    ] as any
  },
  [StoreName.FEEDBACKS]: {
    keyPath: 'id',
    indexes: [
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'timestamp', keyPath: 'timestamp', unique: false },
      { name: 'userId', keyPath: 'userId', unique: false },
      { name: 'sessionId', keyPath: 'sessionId', unique: false }
    ]
  },
  [StoreName.BEHAVIORS]: {
    keyPath: 'id',
    indexes: [
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'timestamp', keyPath: 'timestamp', unique: false },
      { name: 'sessionId', keyPath: 'sessionId', unique: false }
    ]
  },
  [StoreName.USER_PROFILES]: {
    keyPath: 'userId',
    indexes: [
      { name: 'lastUpdated', keyPath: 'lastUpdated', unique: false }
    ]
  },
  [StoreName.CONVERSATIONS]: {
    keyPath: 'id',
    indexes: [
      { name: 'timestamp', keyPath: 'timestamp', unique: false },
      { name: 'agent', keyPath: 'agent', unique: false }
    ]
  },
  [StoreName.GENERATED_OUTPUTS]: {
    keyPath: 'id',
    indexes: [
      { name: 'timestamp', keyPath: 'createdAt', unique: false },
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'style', keyPath: 'style', unique: false }
    ]
  },
  [StoreName.CACHE]: {
    keyPath: 'key',
    indexes: [
      { name: 'expiresAt', keyPath: 'expiresAt', unique: false }
    ]
  }
};

// 查询选项
export interface QueryOptions {
  indexName?: string;
  range?: IDBKeyRange;
  direction?: IDBCursorDirection;
  limit?: number;
  offset?: number;
}

/**
 * IndexedDB存储服务
 * 提供大数据量的本地存储能力
 */
export class IndexedDBStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    if (this.db) return;

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[IndexedDB] Failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[IndexedDB] Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('[IndexedDB] Upgrading database...');

        // 创建所有存储表
        for (const [storeName, config] of Object.entries(STORE_CONFIGS)) {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: config.keyPath });
            
            // 创建索引
            for (const index of config.indexes) {
              store.createIndex(index.name, index.keyPath, { unique: index.unique });
            }
            
            console.log(`[IndexedDB] Created store: ${storeName}`);
          }
        }
      };
    });
  }

  /**
   * 检查是否支持IndexedDB
   */
  isSupported(): boolean {
    return 'indexedDB' in window;
  }

  /**
   * 保存数据
   */
  async save<T>(storeName: StoreName, data: T): Promise<void> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 批量保存
   */
  async saveMany<T>(storeName: StoreName, dataList: T[]): Promise<void> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      let completed = 0;
      const total = dataList.length;

      for (const data of dataList) {
        const request = store.put(data);
        
        request.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };
        
        request.onerror = () => {
          reject(request.error);
        };
      }

      // 空数组直接resolve
      if (total === 0) resolve();
    });
  }

  /**
   * 根据ID获取
   */
  async get<T>(storeName: StoreName, id: string): Promise<T | undefined> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取所有数据
   */
  async getAll<T>(storeName: StoreName, options?: QueryOptions): Promise<T[]> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let request: IDBRequest;
      
      const direction = options?.direction || 'next';
      
      if (options?.indexName) {
        const index = store.index(options.indexName);
        request = options.range 
          ? index.openCursor(options.range, direction)
          : index.openCursor(null, direction);
      } else {
        request = options?.range
          ? store.openCursor(options.range, direction)
          : store.openCursor(null, direction);
      }

      const results: T[] = [];
      let skipped = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor) {
          // 处理offset
          if (options?.offset && skipped < options.offset) {
            skipped++;
            cursor.continue();
            return;
          }

          results.push(cursor.value);

          // 处理limit
          if (options?.limit && results.length >= options.limit) {
            resolve(results);
            return;
          }

          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 根据索引查询
   */
  async queryByIndex<T>(
    storeName: StoreName,
    indexName: string,
    value: any
  ): Promise<T[]> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 删除数据
   */
  async delete(storeName: StoreName, id: string): Promise<void> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 批量删除
   */
  async deleteMany(storeName: StoreName, ids: string[]): Promise<void> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      let completed = 0;
      
      for (const id of ids) {
        const request = store.delete(id);
        request.onsuccess = () => {
          completed++;
          if (completed === ids.length) resolve();
        };
        request.onerror = () => reject(request.error);
      }

      if (ids.length === 0) resolve();
    });
  }

  /**
   * 清空存储表
   */
  async clear(storeName: StoreName): Promise<void> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取数量
   */
  async count(storeName: StoreName, indexName?: string, value?: any): Promise<number> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let request: IDBRequest;
      
      if (indexName && value !== undefined) {
        const index = store.index(indexName);
        const range = IDBKeyRange.only(value);
        request = index.count(range);
      } else {
        request = store.count();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 缓存数据（带过期时间）
   */
  async setCache<T>(key: string, data: T, ttlMs: number = 3600000): Promise<void> {
    const cacheEntry = {
      key,
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs
    };
    
    await this.save(StoreName.CACHE, cacheEntry);
  }

  /**
   * 获取缓存
   */
  async getCache<T>(key: string): Promise<T | null> {
    const entry = await this.get<any>(StoreName.CACHE, key);
    
    if (!entry) return null;
    
    // 检查是否过期
    if (entry.expiresAt < Date.now()) {
      await this.delete(StoreName.CACHE, key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * 清理过期缓存
   */
  async cleanExpiredCache(): Promise<number> {
    const now = Date.now();
    const entries = await this.getAll<{ key: string; expiresAt: number }>(
      StoreName.CACHE,
      {
        indexName: 'expiresAt',
        range: IDBKeyRange.upperBound(now)
      }
    );

    for (const entry of entries) {
      await this.delete(StoreName.CACHE, entry.key);
    }

    return entries.length;
  }

  /**
   * 获取存储统计
   */
  async getStats(): Promise<{
    vectors: number;
    feedbacks: number;
    behaviors: number;
    conversations: number;
    totalSize: number;
  }> {
    const [vectors, feedbacks, behaviors, conversations] = await Promise.all([
      this.count(StoreName.VECTORS),
      this.count(StoreName.FEEDBACKS),
      this.count(StoreName.BEHAVIORS),
      this.count(StoreName.CONVERSATIONS)
    ]);

    // 估算总大小（粗略估计）
    const totalSize = (vectors + feedbacks + behaviors + conversations) * 1024;

    return {
      vectors,
      feedbacks,
      behaviors,
      conversations,
      totalSize
    };
  }

  /**
   * 导出所有数据
   */
  async exportAll(): Promise<{
    vectors: VectorItem[];
    feedbacks: FeedbackData[];
    timestamp: number;
  }> {
    const [vectors, feedbacks] = await Promise.all([
      this.getAll<VectorItem>(StoreName.VECTORS),
      this.getAll<FeedbackData>(StoreName.FEEDBACKS)
    ]);

    return {
      vectors,
      feedbacks,
      timestamp: Date.now()
    };
  }

  /**
   * 导入数据
   */
  async importAll(data: {
    vectors?: VectorItem[];
    feedbacks?: FeedbackData[];
  }): Promise<void> {
    if (data.vectors) {
      await this.saveMany(StoreName.VECTORS, data.vectors);
    }
    if (data.feedbacks) {
      await this.saveMany(StoreName.FEEDBACKS, data.feedbacks);
    }
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
      console.log('[IndexedDB] Database closed');
    }
  }
}

// 导出单例
let indexedDBInstance: IndexedDBStorage | null = null;

export function getIndexedDBStorage(): IndexedDBStorage {
  if (!indexedDBInstance) {
    indexedDBInstance = new IndexedDBStorage();
  }
  return indexedDBInstance;
}

export function resetIndexedDBStorage(): void {
  indexedDBInstance?.close();
  indexedDBInstance = null;
}

// 导出单例实例（供直接导入使用）
export const indexedDBStorage = getIndexedDBStorage();
