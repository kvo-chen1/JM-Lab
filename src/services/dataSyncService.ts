/**
 * 数据同步服务
 * 确保多设备间数据一致性，实现离线数据同步和冲突解决
 */

import { ApiResponse, BaseEntity, User, Work, Comment, Post } from '../types';
import apiClient from '../lib/apiClient';
import { websocketService } from './websocketService';
import eventBus from './enhancedEventBus';
import { EventType } from '../types/events';
import errorService from './errorService';
import { validate } from '../lib/dataValidator';
import authRbacIntegration from './authRbacIntegration';

// 同步操作类型
export type SyncOperationType = 'create' | 'update' | 'delete' | 'sync' | 'batch';

// 同步优先级
export type SyncPriority = 'low' | 'normal' | 'high' | 'critical';

// 同步状态
export type SyncStatus = 'pending' | 'syncing' | 'completed' | 'failed' | 'conflicted' | 'skipped';

// 冲突解决策略
export type ConflictResolutionStrategy = 'server_wins' | 'client_wins' | 'merge';

// 同步操作
export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  entityType: string;
  entityId: string;
  payload: any;
  timestamp: number;
  priority: SyncPriority;
  status: SyncStatus;
  error?: string;
  retryCount: number;
  maxRetries: number;
  lastAttempt: number;
}

// 同步配置
export interface SyncConfig {
  enabled: boolean;
  interval: number;
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
  conflictResolution: ConflictResolutionStrategy;
  syncOnLogin: boolean;
  syncOnLogout: boolean;
  syncOnNetworkChange: boolean;
  syncOnFocus: boolean;
  enableOfflineSupport: boolean;
  enableConflictDetection: boolean;
  enableDeltaSync: boolean;
  entitiesToSync: string[];
  offlineStorageLimit: number;
}

// 同步统计信息
export interface SyncStats {
  totalOperations: number;
  completedOperations: number;
  failedOperations: number;
  conflictedOperations: number;
  bytesSynced: number;
  lastSyncTime: number;
  averageSyncTime: number;
  syncHistory: Array<{
    timestamp: number;
    duration: number;
    operations: number;
    status: 'success' | 'partial' | 'failed';
  }>;
}

// 同步服务事件类型
export enum SyncEventType {
  SYNC_STARTED = 'sync:started',
  SYNC_COMPLETED = 'sync:completed',
  SYNC_FAILED = 'sync:failed',
  OPERATION_STARTED = 'sync:operation_started',
  OPERATION_COMPLETED = 'sync:operation_completed',
  OPERATION_FAILED = 'sync:operation_failed',
  OPERATION_CONFLICTED = 'sync:operation_conflicted',
  CONFLICT_RESOLVED = 'sync:conflict_resolved',
  OFFLINE_CHANGES_DETECTED = 'sync:offline_changes_detected',
  SYNC_CONFIG_UPDATED = 'sync:config_updated',
  SYNC_STATS_UPDATED = 'sync:stats_updated',
  NETWORK_STATUS_CHANGED = 'sync:network_status_changed',
  SYNC_QUEUE_UPDATED = 'sync:queue_updated'
}

// 数据同步服务类
export class DataSyncService {
  private config: SyncConfig;
  private syncQueue: SyncOperation[] = [];
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private networkStatus: 'online' | 'offline' = 'online';
  private lastSyncTime: number = 0;
  private stats: SyncStats;
  private offlineChanges: Map<string, SyncOperation[]> = new Map();
  private conflictResolutionHandlers: Map<string, (conflict: any) => any> = new Map();
  private isInitialized: boolean = false;

  constructor(config: Partial<SyncConfig> = {}) {
    // 默认配置
    this.config = {
      enabled: true,
      interval: 30000, // 30秒
      batchSize: 50,
      retryAttempts: 3,
      retryDelay: 5000,
      conflictResolution: 'server_wins',
      syncOnLogin: true,
      syncOnLogout: false,
      syncOnNetworkChange: true,
      syncOnFocus: true,
      enableOfflineSupport: true,
      enableConflictDetection: true,
      enableDeltaSync: true,
      entitiesToSync: ['work', 'comment', 'post', 'user', 'event'],
      offlineStorageLimit: 1000,
      ...config
    };

    // 初始化统计信息
    this.stats = {
      totalOperations: 0,
      completedOperations: 0,
      failedOperations: 0,
      conflictedOperations: 0,
      bytesSynced: 0,
      lastSyncTime: 0,
      averageSyncTime: 0,
      syncHistory: []
    };
  }

  /**
   * 初始化同步服务
   */
  public initialize(): void {
    if (this.isInitialized) return;

    // 注册事件监听器
    this.registerEventListeners();

    // 检查网络状态
    this.networkStatus = navigator.onLine ? 'online' : 'offline';

    // 启动定时同步
    if (this.config.enabled) {
      this.startPeriodicSync();
    }

    // 初始化离线存储
    this.initOfflineStorage();

    this.isInitialized = true;

    // 发布初始化事件
    eventBus.emit(SyncEventType.SYNC_CONFIG_UPDATED, this.config);
  }

  /**
   * 注册事件监听器
   */
  private registerEventListeners(): void {
    // 网络状态变化
    window.addEventListener('online', () => this.handleNetworkChange(true));
    window.addEventListener('offline', () => this.handleNetworkChange(false));

    // 窗口聚焦事件
    window.addEventListener('focus', () => {
      if (this.config.syncOnFocus) {
        this.sync();
      }
    });

    // 用户登录事件
    eventBus.on(EventType.USER_LOGIN, () => {
      if (this.config.syncOnLogin) {
        this.sync();
      }
    });

    // 用户登出事件
    eventBus.on(EventType.USER_LOGOUT, () => {
      if (this.config.syncOnLogout) {
        this.sync();
      }
    });

    // WebSocket消息事件
    websocketService.on('sync_update', (payload) => {
      this.handleRemoteUpdate(payload);
    });
  }

  /**
   * 处理网络状态变化
   */
  private handleNetworkChange(isOnline: boolean): void {
    const oldStatus = this.networkStatus;
    this.networkStatus = isOnline ? 'online' : 'offline';

    // 发布网络状态变化事件
    eventBus.emit(SyncEventType.NETWORK_STATUS_CHANGED, {
      oldStatus,
      newStatus: this.networkStatus
    });

    // 如果从离线变为在线，执行同步
    if (!oldStatus && isOnline) {
      this.sync();
    }
  }

  /**
   * 处理远程更新
   */
  private handleRemoteUpdate(payload: any): void {
    const { entityType, entityId, operation, data } = payload;

    // 验证远程数据
    if (!validate(entityType, data).success) {
      errorService.logError(new Error('Invalid remote sync data'), {
        context: 'data-sync',
        action: 'handleRemoteUpdate',
        payload
      });
      return;
    }

    // 应用远程更新
    this.applyRemoteUpdate(entityType, entityId, operation, data);

    // 发布远程更新事件
    eventBus.emit(SyncEventType.OPERATION_COMPLETED, {
      entityType,
      entityId,
      operation,
      data
    });
  }

  /**
   * 应用远程更新
   */
  private applyRemoteUpdate(entityType: string, entityId: string, operation: SyncOperationType, data: any): void {
    // 这里应该根据实体类型和操作类型应用更新
    // 例如：更新本地存储、通知UI组件等
    console.log(`Applying remote update: ${operation} ${entityType} ${entityId}`);

    // 根据操作类型处理
    switch (operation) {
      case 'create':
        this.handleCreateEntity(entityType, data);
        break;
      case 'update':
        this.handleUpdateEntity(entityType, entityId, data);
        break;
      case 'delete':
        this.handleDeleteEntity(entityType, entityId);
        break;
      default:
        console.warn(`Unknown operation type: ${operation}`);
    }
  }

  /**
   * 处理实体创建
   */
  private handleCreateEntity(entityType: string, data: any): void {
    // 根据实体类型创建本地记录
    switch (entityType) {
      case 'work':
        // 处理作品创建
        eventBus.emit(EventType.WORK_CREATED, data);
        break;
      case 'comment':
        // 处理评论创建
        eventBus.emit(EventType.COMMENT_CREATED, data);
        break;
      case 'post':
        // 处理帖子创建
        eventBus.emit(EventType.POST_CREATED, data);
        break;
      case 'user':
        // 处理用户创建
        eventBus.emit(EventType.USER_REGISTERED, data);
        break;
      case 'event':
        // 处理活动创建
        eventBus.emit('event:created', data);
        break;
      default:
        console.warn(`Unknown entity type: ${entityType}`);
    }
  }

  /**
   * 处理实体更新
   */
  private handleUpdateEntity(entityType: string, entityId: string, data: any): void {
    // 根据实体类型更新本地记录
    switch (entityType) {
      case 'work':
        // 处理作品更新
        eventBus.emit(EventType.WORK_UPDATED, { id: entityId, ...data });
        break;
      case 'comment':
        // 处理评论更新
        eventBus.emit(EventType.COMMENT_UPDATED, { id: entityId, ...data });
        break;
      case 'post':
        // 处理帖子更新
        eventBus.emit(EventType.POST_UPDATED, { id: entityId, ...data });
        break;
      case 'user':
        // 处理用户更新
        eventBus.emit(EventType.USER_UPDATED, { id: entityId, ...data });
        break;
      case 'event':
        // 处理活动更新
        eventBus.emit('event:updated', { id: entityId, ...data });
        break;
      default:
        console.warn(`Unknown entity type: ${entityType}`);
    }
  }

  /**
   * 处理实体删除
   */
  private handleDeleteEntity(entityType: string, entityId: string): void {
    // 根据实体类型删除本地记录
    switch (entityType) {
      case 'work':
        // 处理作品删除
        eventBus.emit(EventType.WORK_DELETED, { id: entityId });
        break;
      case 'comment':
        // 处理评论删除
        eventBus.emit(EventType.COMMENT_DELETED, { id: entityId });
        break;
      case 'post':
        // 处理帖子删除
        eventBus.emit(EventType.POST_DELETED, { id: entityId });
        break;
      case 'user':
        // 处理用户删除
        eventBus.emit(EventType.USER_LOGOUT, { id: entityId });
        break;
      case 'event':
        // 处理活动删除
        eventBus.emit('event:deleted', { id: entityId });
        break;
      default:
        console.warn(`Unknown entity type: ${entityType}`);
    }
  }

  /**
   * 启动定时同步
   */
  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.sync();
    }, this.config.interval);
  }

  /**
   * 停止定时同步
   */
  public stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * 执行同步
   */
  public async sync(): Promise<SyncStats> {
    if (this.isSyncing) {
      return this.stats;
    }

    this.isSyncing = true;
    const startTime = Date.now();

    // 发布同步开始事件
    eventBus.emit(SyncEventType.SYNC_STARTED, {
      timestamp: startTime,
      config: this.config
    });

    try {
      // 获取待同步的操作
      const pendingOperations = this.getPendingOperations();
      if (pendingOperations.length === 0) {
        this.completeSync(startTime, 0, 'success');
        return this.stats;
      }

      // 按优先级排序
      const sortedOperations = this.sortOperationsByPriority(pendingOperations);

      // 分批处理
      const batches = this.batchOperations(sortedOperations, this.config.batchSize);
      let totalProcessed = 0;
      let totalFailed = 0;

      for (const batch of batches) {
        const batchResult = await this.processBatch(batch);
        totalProcessed += batchResult.processed;
        totalFailed += batchResult.failed;

        // 如果失败的操作超过一定比例，停止同步
        if (batchResult.failed / batch.length > 0.5) {
          break;
        }
      }

      // 完成同步
      this.completeSync(startTime, totalProcessed, totalFailed === 0 ? 'success' : 'partial');
      return this.stats;
    } catch (error) {
      // 处理同步失败
      this.handleSyncFailure(startTime, error as Error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }



  /**
   * 分批处理操作
   */
  private batchOperations(operations: SyncOperation[], batchSize: number): SyncOperation[][] {
    const batches: SyncOperation[][] = [];
    for (let i = 0; i < operations.length; i += batchSize) {
      batches.push(operations.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * 处理同步批次
   */
  private async processBatch(batch: SyncOperation[]): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    for (const operation of batch) {
      try {
        await this.processOperation(operation);
        processed++;
      } catch (error) {
        failed++;
        this.handleOperationFailure(operation, error as Error);
      }
    }

    return { processed, failed };
  }

  /**
   * 处理单个同步操作
   */
  private async processOperation(operation: SyncOperation): Promise<void> {
    // 发布操作开始事件
    eventBus.emit(SyncEventType.OPERATION_STARTED, operation);

    // 更新操作状态
    operation.status = 'syncing';
    operation.lastAttempt = Date.now();
    this.updateOperation(operation);

    try {
      // 执行同步操作
      const result = await this.executeSyncOperation(operation);

      // 更新操作状态为完成
      operation.status = 'completed';
      this.updateOperation(operation);

      // 发布操作完成事件
      eventBus.emit(SyncEventType.OPERATION_COMPLETED, operation);

      return result;
    } catch (error) {
      // 处理操作失败
      this.handleOperationFailure(operation, error as Error);
      throw error;
    }
  }

  /**
   * 执行同步操作
   */
  private async executeSyncOperation(operation: SyncOperation): Promise<any> {
    const { type, entityType, entityId, payload } = operation;
    let url = `/api/sync/${entityType}`;

    // 根据操作类型构建请求
    switch (type) {
      case 'create':
        return await apiClient.post(url, payload);
      case 'update':
        return await apiClient.put(`${url}/${entityId}`, payload);
      case 'delete':
        return await apiClient.delete(`${url}/${entityId}`);
      case 'sync':
        return await apiClient.get(`${url}/sync`, {
          params: { since: this.lastSyncTime }
        });
      case 'batch':
        return await apiClient.post(`${url}/batch`, payload);
      default:
        throw new Error(`Unknown sync operation: ${type}`);
    }
  }

  /**
   * 处理操作失败
   */
  private handleOperationFailure(operation: SyncOperation, error: Error): void {
    // 更新操作状态
    operation.retryCount++;
    operation.error = error.message;

    if (operation.retryCount < operation.maxRetries) {
      // 重试操作
      operation.status = 'pending';
    } else {
      // 标记为失败
      operation.status = 'failed';
    }

    this.updateOperation(operation);

    // 发布操作失败事件
    eventBus.emit(SyncEventType.OPERATION_FAILED, {
      operation,
      error
    });

    // 记录错误
    errorService.logError(error, {
      context: 'data-sync',
      action: 'executeSyncOperation',
      operation
    });
  }

  /**
   * 完成同步
   */
  private completeSync(startTime: number, operations: number, status: 'success' | 'partial' | 'failed'): void {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // 更新统计信息
    this.lastSyncTime = endTime;
    this.stats.lastSyncTime = endTime;
    this.stats.totalOperations += operations;
    
    if (status === 'success') {
      this.stats.completedOperations += operations;
    } else if (status === 'failed') {
      this.stats.failedOperations += operations;
    }

    // 更新平均同步时间
    this.stats.totalSyncTime += duration;
    this.stats.averageSyncTime = this.stats.totalSyncTime / this.stats.syncHistory.length;

    // 添加到同步历史
    this.stats.syncHistory.push({
      timestamp: startTime,
      duration,
      operations,
      status
    });

    // 保留最近100条历史记录
    if (this.stats.syncHistory.length > 100) {
      this.stats.syncHistory.shift();
    }

    // 发布同步完成事件
    eventBus.emit(SyncEventType.SYNC_COMPLETED, {
      timestamp: endTime,
      duration,
      operations,
      status,
      stats: this.stats
    });

    // 发布统计更新事件
    eventBus.emit(SyncEventType.SYNC_STATS_UPDATED, this.stats);

    this.isSyncing = false;
  }

  /**
   * 处理同步失败
   */
  private handleSyncFailure(startTime: number, error: Error): void {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // 添加到同步历史
    this.stats.syncHistory.push({
      timestamp: startTime,
      duration,
      operations: 0,
      status: 'failed'
    });

    // 发布同步失败事件
    eventBus.emit(SyncEventType.SYNC_FAILED, {
      timestamp: endTime,
      duration,
      error: error.message,
      stats: this.stats
    });

    // 记录错误
    errorService.logError(error, {
      context: 'data-sync',
      action: 'sync',
      config: this.config
    });

    this.isSyncing = false;
  }

  /**
   * 获取待同步的操作
   */
  private getPendingOperations(): SyncOperation[] {
    return this.syncQueue.filter(op => op.status === 'pending' || (op.status === 'failed' && op.retryCount < op.maxRetries));
  }

  /**
   * 按优先级排序操作
   */
  private sortOperationsByPriority(operations: SyncOperation[]): SyncOperation[] {
    const priorityOrder: Record<SyncPriority, number> = { critical: 4, high: 3, normal: 2, low: 1 };
    return [...operations].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }

  /**
   * 初始化离线存储
   */
  private initOfflineStorage(): void {
    const request = indexedDB.open('TraeAppDB', 1);

    request.onerror = (event) => {
      console.error('Failed to open IndexedDB:', event);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      this.loadQueueFromStorage(db);
    };
  }

  /**
   * 从离线存储加载队列
   */
  private loadQueueFromStorage(db: IDBDatabase): void {
    const transaction = db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const request = store.getAll();

    request.onsuccess = () => {
      const operations = request.result as SyncOperation[];
      if (operations.length > 0) {
        this.syncQueue = [...this.syncQueue, ...operations];
        // 去重
        const uniqueOps = new Map();
        this.syncQueue.forEach(op => uniqueOps.set(op.id, op));
        this.syncQueue = Array.from(uniqueOps.values());
        
        eventBus.emit(SyncEventType.SYNC_QUEUE_UPDATED, {
          queueSize: this.syncQueue.length,
          operation: 'load'
        });
        
        // 尝试同步
        if (this.networkStatus === 'online') {
          this.sync();
        }
      }
    };
  }

  /**
   * 保存操作到离线存储
   */
  private saveOperationToStorage(operation: SyncOperation): void {
    const request = indexedDB.open('TraeAppDB', 1);
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      store.put(operation);
    };
  }

  /**
   * 从离线存储删除操作
   */
  private removeOperationFromStorage(operationId: string): void {
    const request = indexedDB.open('TraeAppDB', 1);
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      store.delete(operationId);
    };
  }

  /**
   * 添加同步操作
   */
  public addOperation(operation: SyncOperation): string {
    // 验证操作
    if (!validate('syncOperation', operation).success) {
      throw new Error('Invalid sync operation');
    }

    // 添加到队列
    this.syncQueue.push(operation);
    this.saveOperationToStorage(operation);

    // 发布队列更新事件
    eventBus.emit(SyncEventType.SYNC_QUEUE_UPDATED, {
      queueSize: this.syncQueue.length,
      operation: 'add',
      operationId: operation.id
    });

    // 如果配置了立即同步，执行同步
    if (operation.priority === 'critical' || operation.priority === 'high') {
      this.sync();
    }

    return operation.id;
  }

  /**
   * 更新同步操作
   */
  private updateOperation(operation: SyncOperation): void {
    const index = this.syncQueue.findIndex(op => op.id === operation.id);
    if (index !== -1) {
      this.syncQueue[index] = operation;
      this.saveOperationToStorage(operation);

      // 发布队列更新事件
      eventBus.emit(SyncEventType.SYNC_QUEUE_UPDATED, {
        metadata: {
          queueSize: this.syncQueue.length,
          operation: 'update',
          operationId: operation.id
        }
      });
    }
  }

  /**
   * 删除同步操作
   */
  public removeOperation(operationId: string): boolean {
    const initialLength = this.syncQueue.length;
    this.syncQueue = this.syncQueue.filter(op => op.id !== operationId);
    this.removeOperationFromStorage(operationId);

    if (this.syncQueue.length < initialLength) {
      // 发布队列更新事件
      eventBus.emit(SyncEventType.SYNC_QUEUE_UPDATED, {
        metadata: {
          queueSize: this.syncQueue.length,
          operation: 'remove',
          operationId
        }
      });
      return true;
    }

    return false;
  }

  /**
   * 清空同步队列
   */
  public clearQueue(): void {
    this.syncQueue = [];

    // 发布队列更新事件
    eventBus.emit(SyncEventType.SYNC_QUEUE_UPDATED, {
      metadata: {
        queueSize: 0,
        operation: 'clear'
      }
    });
  }

  /**
   * 获取同步队列
   */
  public getQueue(): SyncOperation[] {
    return [...this.syncQueue];
  }

  /**
   * 获取同步统计信息
   */
  public getStats(): SyncStats {
    return { ...this.stats };
  }

  /**
   * 更新同步配置
   */
  public updateConfig(config: Partial<SyncConfig>): SyncConfig {
    this.config = { ...this.config, ...config };

    // 如果启用了同步，启动定时同步
    if (this.config.enabled) {
      this.startPeriodicSync();
    } else {
      this.stopPeriodicSync();
    }

    // 发布配置更新事件
    eventBus.emit(SyncEventType.SYNC_CONFIG_UPDATED, {
      metadata: this.config
    });

    return this.config;
  }

  /**
   * 获取同步配置
   */
  public getConfig(): SyncConfig {
    return { ...this.config };
  }

  /**
   * 注册冲突解决处理器
   */
  public registerConflictResolver(entityType: string, resolver: (conflict: any) => any): void {
    this.conflictResolutionHandlers.set(entityType, resolver);
  }

  /**
   * 取消注册冲突解决处理器
   */
  public unregisterConflictResolver(entityType: string): void {
    this.conflictResolutionHandlers.delete(entityType);
  }

  /**
   * 获取冲突解决处理器
   */
  public getConflictResolver(entityType: string): ((conflict: any) => any) | undefined {
    return this.conflictResolutionHandlers.get(entityType);
  }

  /**
   * 销毁同步服务
   */
  public destroy(): void {
    // 停止定时同步
    this.stopPeriodicSync();

    // 清空队列
    this.clearQueue();

    // 重置统计信息
    this.stats = {
      totalOperations: 0,
      completedOperations: 0,
      failedOperations: 0,
      conflictedOperations: 0,
      bytesSynced: 0,
      lastSyncTime: 0,
      averageSyncTime: 0,
      syncHistory: []
    };

    this.isInitialized = false;
  }

  /**
   * 强制同步特定实体
   */
  public async syncEntity(entityType: string, entityId: string): Promise<ApiResponse<SyncStats>> {
    // 创建并添加同步操作
    const operation: SyncOperation = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'sync',
      entityType,
      entityId,
      payload: null,
      timestamp: Date.now(),
      priority: 'high',
      status: 'pending',
      retryCount: 0,
      maxRetries: this.config.retryAttempts,
      lastAttempt: 0
    };

    // 添加到队列
    this.addOperation(operation);

    // 执行同步
    try {
      const stats = await this.sync();
      return {
        ok: true,
        status: 200,
        data: stats
      };
    } catch (error) {
      return {
        ok: false,
        status: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 批量同步实体
   */
  public async syncEntities(entityType: string, entityIds: string[]): Promise<ApiResponse<SyncStats>> {
    // 创建批量同步操作
    const operation: SyncOperation = {
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'batch',
      entityType,
      entityId: 'batch',
      payload: entityIds,
      timestamp: Date.now(),
      priority: 'normal',
      status: 'pending',
      retryCount: 0,
      maxRetries: this.config.retryAttempts,
      lastAttempt: 0
    };

    // 添加到队列
    this.addOperation(operation);

    // 执行同步
    try {
      const stats = await this.sync();
      return {
        ok: true,
        status: 200,
        data: stats
      };
    } catch (error) {
      return {
        ok: false,
        status: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// 创建单例实例
const dataSyncService = new DataSyncService();

export default dataSyncService;
