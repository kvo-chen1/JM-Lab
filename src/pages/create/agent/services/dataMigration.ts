// 数据迁移服务 - 从localStorage迁移到IndexedDB

import { getIndexedDBStorage, StoreName } from './indexedDBStorage';

// 迁移进度
export interface MigrationProgress {
  total: number;
  completed: number;
  currentTable: string;
  status: 'pending' | 'migrating' | 'completed' | 'failed';
  errors: string[];
}

// 迁移配置
export interface MigrationConfig {
  // 是否保留localStorage数据（迁移后不删除）
  keepLocalStorage: boolean;
  // 批量大小
  batchSize: number;
  // 是否跳过已存在的数据
  skipExisting: boolean;
}

// 默认配置
const DEFAULT_CONFIG: MigrationConfig = {
  keepLocalStorage: true,
  batchSize: 100,
  skipExisting: true
};

// localStorage键映射
const LOCALSTORAGE_KEYS = {
  vectors: 'agent-vector-store',
  feedbacks: 'agent-feedback-data',
  behaviors: 'agent-behavior-records',
  userProfiles: 'agent-user-profile',
  memories: 'agent-memory'
};

/**
 * 数据迁移服务
 * 负责将数据从localStorage迁移到IndexedDB
 */
export class DataMigrationService {
  private indexedDB = getIndexedDBStorage();
  private progress: MigrationProgress = {
    total: 0,
    completed: 0,
    currentTable: '',
    status: 'pending',
    errors: []
  };
  private onProgressCallback?: (progress: MigrationProgress) => void;

  /**
   * 检查是否需要迁移
   */
  async needsMigration(): Promise<boolean> {
    // 检查localStorage中是否有数据
    const hasLocalData = Object.values(LOCALSTORAGE_KEYS).some(key => {
      const data = localStorage.getItem(key);
      return data && data.length > 2; // 不是空数组或空对象
    });

    if (!hasLocalData) return false;

    // 检查IndexedDB中是否已有数据
    try {
      const stats = await this.indexedDB.getStats();
      const hasIndexedDBData = stats.vectors > 0 || stats.feedbacks > 0;
      
      // 如果IndexedDB已有数据，且localStorage也有数据，可能需要迁移
      return hasLocalData && !hasIndexedDBData;
    } catch {
      // IndexedDB未初始化，需要迁移
      return hasLocalData;
    }
  }

  /**
   * 执行迁移
   */
  async migrate(config: Partial<MigrationConfig> = {}): Promise<MigrationProgress> {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    
    this.progress = {
      total: 0,
      completed: 0,
      currentTable: '',
      status: 'migrating',
      errors: []
    };

    try {
      // 初始化IndexedDB
      await this.indexedDB.initialize();

      // 计算总数据量
      await this.calculateTotal();

      // 迁移各个表
      await this.migrateVectors(fullConfig);
      await this.migrateFeedbacks(fullConfig);
      await this.migrateBehaviors(fullConfig);
      await this.migrateUserProfiles(fullConfig);

      this.progress.status = 'completed';
      
      // 如果不保留localStorage，清理数据
      if (!fullConfig.keepLocalStorage) {
        this.clearLocalStorage();
      }

      console.log('[DataMigration] Migration completed:', this.progress);
      return this.progress;
    } catch (error) {
      this.progress.status = 'failed';
      this.progress.errors.push(error instanceof Error ? error.message : String(error));
      console.error('[DataMigration] Migration failed:', error);
      return this.progress;
    }
  }

  /**
   * 设置进度回调
   */
  onProgress(callback: (progress: MigrationProgress) => void): void {
    this.onProgressCallback = callback;
  }

  /**
   * 计算总数据量
   */
  private async calculateTotal(): Promise<void> {
    let total = 0;

    for (const [table, key] of Object.entries(LOCALSTORAGE_KEYS)) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            total += parsed.length;
          } else {
            total += 1;
          }
        } catch {
          total += 1;
        }
      }
    }

    this.progress.total = total;
    this.notifyProgress();
  }

  /**
   * 迁移向量数据
   */
  private async migrateVectors(config: MigrationConfig): Promise<void> {
    this.progress.currentTable = 'vectors';
    this.notifyProgress();

    const data = localStorage.getItem(LOCALSTORAGE_KEYS.vectors);
    if (!data) return;

    try {
      const vectors = JSON.parse(data);
      if (!Array.isArray(vectors)) return;

      // 分批迁移
      for (let i = 0; i < vectors.length; i += config.batchSize) {
        const batch = vectors.slice(i, i + config.batchSize);
        
        if (config.skipExisting) {
          // 检查是否已存在
          for (const vector of batch) {
            const existing = await this.indexedDB.get(StoreName.VECTORS, vector.id);
            if (!existing) {
              await this.indexedDB.save(StoreName.VECTORS, vector);
            }
          }
        } else {
          await this.indexedDB.saveMany(StoreName.VECTORS, batch);
        }

        this.progress.completed += batch.length;
        this.notifyProgress();
      }
    } catch (error) {
      this.progress.errors.push(`Vectors migration failed: ${error}`);
      console.error('[DataMigration] Vectors migration failed:', error);
    }
  }

  /**
   * 迁移反馈数据
   */
  private async migrateFeedbacks(config: MigrationConfig): Promise<void> {
    this.progress.currentTable = 'feedbacks';
    this.notifyProgress();

    const data = localStorage.getItem(LOCALSTORAGE_KEYS.feedbacks);
    if (!data) return;

    try {
      const feedbacks = JSON.parse(data);
      if (!Array.isArray(feedbacks)) return;

      for (let i = 0; i < feedbacks.length; i += config.batchSize) {
        const batch = feedbacks.slice(i, i + config.batchSize);
        
        if (config.skipExisting) {
          for (const feedback of batch) {
            const existing = await this.indexedDB.get(StoreName.FEEDBACKS, feedback.id);
            if (!existing) {
              await this.indexedDB.save(StoreName.FEEDBACKS, feedback);
            }
          }
        } else {
          await this.indexedDB.saveMany(StoreName.FEEDBACKS, batch);
        }

        this.progress.completed += batch.length;
        this.notifyProgress();
      }
    } catch (error) {
      this.progress.errors.push(`Feedbacks migration failed: ${error}`);
      console.error('[DataMigration] Feedbacks migration failed:', error);
    }
  }

  /**
   * 迁移行为数据
   */
  private async migrateBehaviors(config: MigrationConfig): Promise<void> {
    this.progress.currentTable = 'behaviors';
    this.notifyProgress();

    const data = localStorage.getItem(LOCALSTORAGE_KEYS.behaviors);
    if (!data) return;

    try {
      const behaviors = JSON.parse(data);
      if (!Array.isArray(behaviors)) return;

      for (let i = 0; i < behaviors.length; i += config.batchSize) {
        const batch = behaviors.slice(i, i + config.batchSize);
        
        if (config.skipExisting) {
          for (const behavior of batch) {
            const existing = await this.indexedDB.get(StoreName.BEHAVIORS, behavior.id);
            if (!existing) {
              await this.indexedDB.save(StoreName.BEHAVIORS, behavior);
            }
          }
        } else {
          await this.indexedDB.saveMany(StoreName.BEHAVIORS, batch);
        }

        this.progress.completed += batch.length;
        this.notifyProgress();
      }
    } catch (error) {
      this.progress.errors.push(`Behaviors migration failed: ${error}`);
      console.error('[DataMigration] Behaviors migration failed:', error);
    }
  }

  /**
   * 迁移用户画像
   */
  private async migrateUserProfiles(config: MigrationConfig): Promise<void> {
    this.progress.currentTable = 'userProfiles';
    this.notifyProgress();

    const data = localStorage.getItem(LOCALSTORAGE_KEYS.userProfiles);
    if (!data) return;

    try {
      const profile = JSON.parse(data);
      
      // 确保 profile 有 userId
      if (!profile || !profile.userId) {
        console.warn('[DataMigration] 跳过无效的 profile 数据:', profile);
        this.progress.completed += 1;
        this.notifyProgress();
        return;
      }
      
      if (config.skipExisting) {
        const existing = await this.indexedDB.get(StoreName.USER_PROFILES, profile.userId);
        if (!existing) {
          await this.indexedDB.save(StoreName.USER_PROFILES, profile);
        }
      } else {
        await this.indexedDB.save(StoreName.USER_PROFILES, profile);
      }

      this.progress.completed += 1;
      this.notifyProgress();
    } catch (error) {
      this.progress.errors.push(`UserProfiles migration failed: ${error}`);
      console.error('[DataMigration] UserProfiles migration failed:', error);
    }
  }

  /**
   * 清理localStorage
   */
  private clearLocalStorage(): void {
    for (const key of Object.values(LOCALSTORAGE_KEYS)) {
      localStorage.removeItem(key);
    }
    console.log('[DataMigration] Cleared localStorage');
  }

  /**
   * 通知进度更新
   */
  private notifyProgress(): void {
    if (this.onProgressCallback) {
      this.onProgressCallback({ ...this.progress });
    }
  }

  /**
   * 获取迁移进度
   */
  getProgress(): MigrationProgress {
    return { ...this.progress };
  }

  /**
   * 导出localStorage数据（用于备份）
   */
  exportLocalStorageData(): Record<string, any> {
    const data: Record<string, any> = {};
    
    for (const [table, key] of Object.entries(LOCALSTORAGE_KEYS)) {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          data[table] = JSON.parse(value);
        } catch {
          data[table] = value;
        }
      }
    }

    return data;
  }

  /**
   * 导入数据到IndexedDB（从备份）
   */
  async importFromBackup(data: Record<string, any>): Promise<void> {
    await this.indexedDB.initialize();

    if (data.vectors) {
      await this.indexedDB.saveMany(StoreName.VECTORS, data.vectors);
    }
    if (data.feedbacks) {
      await this.indexedDB.saveMany(StoreName.FEEDBACKS, data.feedbacks);
    }
    if (data.behaviors) {
      await this.indexedDB.saveMany(StoreName.BEHAVIORS, data.behaviors);
    }
    if (data.userProfiles) {
      await this.indexedDB.save(StoreName.USER_PROFILES, data.userProfiles);
    }

    console.log('[DataMigration] Imported from backup');
  }
}

// 导出单例
let migrationInstance: DataMigrationService | null = null;

export function getDataMigrationService(): DataMigrationService {
  if (!migrationInstance) {
    migrationInstance = new DataMigrationService();
  }
  return migrationInstance;
}

export function resetDataMigrationService(): void {
  migrationInstance = null;
}
