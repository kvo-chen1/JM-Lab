import { Post, Comment } from './postService';

export type OfflineDataStatus = 'pending' | 'syncing' | 'synced' | 'failed';

// 离线数据历史记录
export interface OfflineData {
  id: string;
  type: SyncOperation['entity'];
  status: OfflineDataStatus;
  data: any;
  createdAt: number;
  syncedAt?: number;
  error?: string;
}

export interface OfflineConfig {
  autoSync: boolean;
  syncInterval: number;
  maxOfflineData: number;
  retryDelay: number;
}

export interface OfflineStatus {
  isOnline: boolean;
  syncing: boolean;
  pendingSync: number;
  lastSync: number | null;
}

// 同步操作类型
export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'post' | 'comment' | 'like';
  data: any;
  timestamp: number;
  attempts: number;
}

// 离线状态管理
export class OfflineService {
  private dbName = 'jinmai-offline-db';
  private version = 1;
  private db: IDBDatabase | null = null;
  private status: OfflineStatus = {
    isOnline: navigator.onLine,
    syncing: false,
    pendingSync: 0,
    lastSync: null
  };
  private config: OfflineConfig = {
    autoSync: true,
    syncInterval: 30000,
    maxOfflineData: 200,
    retryDelay: 5000
  };
  private offlineData: OfflineData[] = [];
  private statusListeners = new Set<(status: OfflineStatus) => void>();
  private autoSyncTimer: number | null = null;
  private configKey = 'jmzf_offline_config';
  private dataKey = 'jmzf_offline_data';

  constructor() {
    this.loadConfig();
    this.loadOfflineData();
    void this.refreshPendingSyncCount();

    window.addEventListener('online', () => {
      this.updateStatus({ isOnline: true });
    });
    window.addEventListener('offline', () => {
      this.updateStatus({ isOnline: false });
    });

    if (this.config.autoSync) {
      this.startAutoSync();
    }
  }

  // 初始化数据库
  async init(): Promise<void> {
    if (!('indexedDB' in window)) {
      throw new Error('IndexedDB is not supported');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建对象存储
        if (!db.objectStoreNames.contains('posts')) {
          const postsStore = db.createObjectStore('posts', { keyPath: 'id' });
          postsStore.createIndex('date', 'date', { unique: false });
          postsStore.createIndex('category', 'category', { unique: false });
        }

        if (!db.objectStoreNames.contains('drafts')) {
          const draftsStore = db.createObjectStore('drafts', { keyPath: 'id' });
          draftsStore.createIndex('lastModified', 'lastModified', { unique: false });
        }

        if (!db.objectStoreNames.contains('comments')) {
          const commentsStore = db.createObjectStore('comments', { keyPath: 'id' });
          commentsStore.createIndex('postId', 'postId', { unique: false });
          commentsStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // 检查网络状态
  isOnline(): boolean {
    return navigator.onLine;
  }

  // 添加网络状态监听
  addNetworkListener(callback: (online: boolean) => void): void {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }

  // 获取离线状态
  getStatus(): OfflineStatus {
    return this.status;
  }

  // 监听离线状态变化
  addStatusListener(listener: (status: OfflineStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  // 获取离线配置
  getConfig(): OfflineConfig {
    return this.config;
  }

  // 更新离线配置
  updateConfig(nextConfig: Partial<OfflineConfig>): void {
    this.config = { ...this.config, ...nextConfig };
    this.saveConfig();

    if (this.config.autoSync) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  // 获取离线数据历史
  getAllOfflineData(): OfflineData[] {
    return this.offlineData;
  }

  // 主动同步离线数据
  async syncData(): Promise<boolean> {
    if (!this.isOnline()) return false;

    this.updateStatus({ syncing: true });
    try {
      await this.processSyncQueue();
      await this.refreshPendingSyncCount();
      this.updateStatus({ syncing: false, lastSync: Date.now() });
      return true;
    } catch {
      this.updateStatus({ syncing: false });
      return false;
    }
  }

  // 重试失败的数据
  retryFailedData(): void {
    const failedItems = this.offlineData.filter(item => item.status === 'failed');
    failedItems.forEach(item => {
      this.updateOfflineRecord(item.id, { status: 'pending', error: undefined, syncedAt: undefined });
      void this.addToSyncQueue({
        id: item.id,
        type: 'create',
        entity: item.type,
        data: item.data
      });
    });
  }

  // 清除已同步数据
  clearSyncedData(): void {
    this.offlineData = this.offlineData.filter(item => item.status !== 'synced');
    this.saveOfflineData();
  }

  // 保存草稿
  async saveDraft(post: Post): Promise<void> {
    if (!this.db) await this.init();
    
    const draft = {
      ...post,
      lastModified: Date.now(),
      isDraft: true
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['drafts'], 'readwrite');
      const store = transaction.objectStore('drafts');
      const request = store.put(draft);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // 获取所有草稿
  async getDrafts(): Promise<Post[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['drafts'], 'readonly');
      const store = transaction.objectStore('drafts');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // 删除草稿
  async deleteDraft(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['drafts'], 'readwrite');
      const store = transaction.objectStore('drafts');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // 缓存作品数据
  async cachePosts(posts: Post[]): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['posts'], 'readwrite');
      const store = transaction.objectStore('posts');

      // 清空现有数据
      store.clear();

      // 添加新数据
      posts.forEach(post => {
        store.add(post);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // 获取缓存的帖子
  async getCachedPosts(): Promise<Post[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['posts'], 'readonly');
      const store = transaction.objectStore('posts');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // 添加同步操作到队列
  async addToSyncQueue(
    operation: Omit<SyncOperation, 'id' | 'timestamp' | 'attempts'> & {
      id?: string;
      timestamp?: number;
      attempts?: number;
    }
  ): Promise<void> {
    if (!this.db) await this.init();

    const syncOp: SyncOperation = {
      ...operation,
      id: operation.id || (Date.now().toString() + Math.random().toString(36).substr(2, 9)),
      timestamp: operation.timestamp || Date.now(),
      attempts: operation.attempts ?? 0
    };

    const existingIndex = this.offlineData.findIndex(item => item.id === syncOp.id);
    if (existingIndex >= 0) {
      this.updateOfflineRecord(syncOp.id, { status: 'pending', data: syncOp.data });
    } else {
      this.addOfflineRecord({
        id: syncOp.id,
        type: syncOp.entity,
        status: 'pending',
        data: syncOp.data,
        createdAt: syncOp.timestamp
      });
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.add(syncOp);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        void this.refreshPendingSyncCount();
        resolve();
      };
    });
  }

  // 获取同步队列
  async getSyncQueue(): Promise<SyncOperation[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // 处理同步队列
  async processSyncQueue(): Promise<void> {
    if (!this.isOnline()) return;

    const queue = await this.getSyncQueue();
    
    for (const operation of queue) {
      try {
        this.updateOfflineRecord(operation.id, { status: 'syncing' });
        // 这里应该调用实际的API
        // 例如：await apiService.syncOperation(operation);
        
        // 同步成功后从队列中删除
        await this.removeFromSyncQueue(operation.id);
        this.updateOfflineRecord(operation.id, { status: 'synced', syncedAt: Date.now(), error: undefined });
      } catch (error) {
        console.error('Sync operation failed:', error);
        await this.incrementAttempts(operation.id);
        this.updateOfflineRecord(operation.id, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'SYNC_FAILED'
        });
      }
    }
  }

  // 从同步队列中删除操作
  private async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        void this.refreshPendingSyncCount();
        resolve();
      };
    });
  }

  // 增加尝试次数
  private async incrementAttempts(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation && operation.attempts < 5) {
          operation.attempts += 1;
          const putRequest = store.put(operation);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          // 超过最大尝试次数，删除操作
          store.delete(id);
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // 获取存储使用情况
  async getStorageInfo(): Promise<{
    total: number;
    used: number;
    available: number;
    usagePercentage: number;
  }> {
    if (!navigator.storage || !navigator.storage.estimate) {
      return {
        total: 0,
        used: 0,
        available: 0,
        usagePercentage: 0
      };
    }

    const estimate = await navigator.storage.estimate();
    
    return {
      total: estimate.quota || 0,
      used: estimate.usage || 0,
      available: (estimate.quota || 0) - (estimate.usage || 0),
      usagePercentage: estimate.quota ? ((estimate.usage || 0) / estimate.quota) * 100 : 0
    };
  }

  private notifyStatus(): void {
    this.statusListeners.forEach(listener => listener(this.status));
  }

  private updateStatus(patch: Partial<OfflineStatus>): void {
    this.status = { ...this.status, ...patch };
    this.notifyStatus();
  }

  private loadConfig(): void {
    try {
      const raw = localStorage.getItem(this.configKey);
      if (raw) {
        this.config = { ...this.config, ...JSON.parse(raw) };
      }
    } catch {}
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(this.configKey, JSON.stringify(this.config));
    } catch {}
  }

  private loadOfflineData(): void {
    try {
      const raw = localStorage.getItem(this.dataKey);
      if (raw) {
        this.offlineData = JSON.parse(raw) as OfflineData[];
      }
    } catch {}
  }

  private saveOfflineData(): void {
    try {
      localStorage.setItem(this.dataKey, JSON.stringify(this.offlineData));
    } catch {}
  }

  private addOfflineRecord(record: OfflineData): void {
    this.offlineData = [record, ...this.offlineData].slice(0, this.config.maxOfflineData);
    this.saveOfflineData();
  }

  private updateOfflineRecord(id: string, patch: Partial<OfflineData>): void {
    const index = this.offlineData.findIndex(item => item.id === id);
    if (index < 0) return;
    this.offlineData[index] = { ...this.offlineData[index], ...patch };
    this.saveOfflineData();
  }

  private startAutoSync(): void {
    this.stopAutoSync();
    this.autoSyncTimer = window.setInterval(() => {
      void this.syncData();
    }, this.config.syncInterval);
  }

  private stopAutoSync(): void {
    if (this.autoSyncTimer) {
      window.clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }

  private async refreshPendingSyncCount(): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      this.updateStatus({ pendingSync: queue.length });
    } catch {}
  }
}

// 导出单例实例
export const offlineService = new OfflineService();
export default offlineService;
