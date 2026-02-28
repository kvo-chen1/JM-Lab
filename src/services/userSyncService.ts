/**
 * 用户数据同步服务
 * 
 * 解决用户状态同步延迟问题，提供统一的用户数据管理
 * 支持多标签页同步、本地存储与数据库同步、实时更新
 * 
 * @module services/userSyncService
 */

import eventBus from '@/lib/eventBus';
import { DateFormatter } from '@/utils/dateFormatter';

// 类型定义
export interface UserData {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  avatar_url?: string;
  [key: string]: any;
}

export interface SyncOptions {
  /** 是否立即同步到服务器 */
  immediate?: boolean;
  /** 是否通知其他组件 */
  notify?: boolean;
  /** 是否更新本地存储 */
  persist?: boolean;
}

// 常量定义
const STORAGE_KEY = 'user_data';
const SYNC_EVENT = 'user:sync';
const UPDATE_EVENT = 'user:update';
const LOGOUT_EVENT = 'user:logout';
const DEBOUNCE_DELAY = 300; // 防抖延迟 (毫秒)

/**
 * 用户数据同步服务类
 */
class UserSyncService {
  private currentUser: UserData | null = null;
  private syncQueue: Array<() => Promise<void>> = [];
  private isSyncing = false;
  private debounceTimer: any = null;
  private lastSyncTime: number = 0;
  private syncInterval: number = 30000; // 默认 30 秒同步一次
  private initialized = false;

  /**
   * 初始化服务
   */
  init(): void {
    if (this.initialized) {
      return;
    }

    // 从本地存储加载用户数据
    this.loadFromStorage();

    // 监听其他标签页的用户数据变化
    this.setupStorageListener();

    // 监听事件总线的登出事件
    eventBus.subscribe(LOGOUT_EVENT, () => {
      this.clear();
    });

    // 定期同步用户数据
    this.startPeriodicSync();

    this.initialized = true;
    console.log('[UserSyncService] Initialized');
  }

  /**
   * 设置当前用户数据
   * @param user - 用户数据
   * @param options - 同步选项
   */
  setUser(user: UserData | null, options: SyncOptions = {}): void {
    const { immediate = false, notify = true, persist = true } = options;

    this.currentUser = user;

    // 更新本地存储
    if (persist && user) {
      this.saveToStorage(user);
    }

    // 通知其他组件
    if (notify) {
      this.notifyUpdate(user);
    }

    // 同步到服务器
    if (immediate) {
      this.syncToServer(user);
    } else {
      this.scheduleSync(user);
    }
  }

  /**
   * 获取当前用户数据
   * @returns 当前用户数据
   */
  getUser(): UserData | null {
    return this.currentUser;
  }

  /**
   * 获取用户 ID
   * @returns 用户 ID
   */
  getUserId(): string | null {
    return this.currentUser?.id || null;
  }

  /**
   * 更新用户数据的部分字段
   * @param partial - 部分用户数据
   * @param options - 同步选项
   */
  updateUser(partial: Partial<UserData>, options: SyncOptions = {}): void {
    if (!this.currentUser) {
      console.warn('[UserSyncService] Cannot update user, no user logged in');
      return;
    }

    const updatedUser = {
      ...this.currentUser,
      ...partial,
      updated_at: DateFormatter.now(),
    };

    this.setUser(updatedUser, options);
  }

  /**
   * 从服务器刷新用户数据
   * @param fetchUserFn - 获取用户数据的函数
   */
  async refreshUser(fetchUserFn: () => Promise<UserData | null>): Promise<boolean> {
    try {
      const userData = await fetchUserFn();
      
      if (userData) {
        this.setUser(userData, { immediate: false, notify: true, persist: true });
        return true;
      } else {
        console.warn('[UserSyncService] Failed to fetch user data');
        return false;
      }
    } catch (error) {
      console.error('[UserSyncService] Error refreshing user:', error);
      return false;
    }
  }

  /**
   * 清空用户数据 (登出时调用)
   */
  clear(): void {
    this.currentUser = null;
    this.removeFromStorage();
    this.notifyLogout();
    console.log('[UserSyncService] User data cleared');
  }

  /**
   * 从本地存储加载用户数据
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // 验证数据有效性
        if (parsed && parsed.id) {
          this.currentUser = parsed;
          console.log('[UserSyncService] Loaded user from storage:', parsed.id);
        } else {
          console.warn('[UserSyncService] Invalid user data in storage');
          this.removeFromStorage();
        }
      }
    } catch (error) {
      console.error('[UserSyncService] Error loading from storage:', error);
    }
  }

  /**
   * 保存用户数据到本地存储
   * @param user - 用户数据
   */
  private saveToStorage(user: UserData): void {
    try {
      const dataToSave = {
        ...user,
        _synced_at: DateFormatter.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('[UserSyncService] Error saving to storage:', error);
    }
  }

  /**
   * 从本地存储移除用户数据
   */
  private removeFromStorage(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[UserSyncService] Error removing from storage:', error);
    }
  }

  /**
   * 设置存储事件监听器 (多标签页同步)
   */
  private setupStorageListener(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const userData = JSON.parse(event.newValue);
          
          // 如果是当前用户，忽略
          if (this.currentUser?.id === userData.id) {
            return;
          }

          // 更新当前用户数据
          this.currentUser = userData;
          this.notifyUpdate(userData);
          
          console.log('[UserSyncService] User data updated from another tab');
        } catch (error) {
          console.error('[UserSyncService] Error handling storage event:', error);
        }
      }
    });
  }

  /**
   * 调度同步任务 (防抖)
   * @param user - 用户数据
   */
  private scheduleSync(user: UserData): void {
    // 清除之前的定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // 添加同步任务到队列
    this.syncQueue.push(async () => {
      await this.syncToServer(user);
    });

    // 设置新的定时器
    this.debounceTimer = setTimeout(() => {
      this.processSyncQueue();
    }, DEBOUNCE_DELAY);
  }

  /**
   * 处理同步队列
   */
  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;

    try {
      // 获取最新的同步任务
      const latestSync = this.syncQueue[this.syncQueue.length - 1];
      
      // 清空队列
      this.syncQueue = [];
      
      // 执行同步
      if (latestSync) {
        await latestSync();
      }
    } catch (error) {
      console.error('[UserSyncService] Error processing sync queue:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 同步到服务器
   * @param user - 用户数据
   */
  private async syncToServer(user: UserData): Promise<void> {
    // 检查同步频率
    const now = Date.now();
    if (now - this.lastSyncTime < this.syncInterval) {
      return;
    }

    this.lastSyncTime = now;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        console.warn('[UserSyncService] No token available for server sync');
        return;
      }

      // 使用新的数据库函数同步用户数据
      const response = await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          sync_type: 'full_sync',
          sync_data: {
            username: user.username,
            avatar: user.avatar || user.avatar_url,
            email: user.email,
            bio: user.bio,
            location: user.location,
            website: user.website,
          },
          device_info: {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            platform: typeof navigator !== 'undefined' ? navigator.platform : undefined,
            language: typeof navigator !== 'undefined' ? navigator.language : undefined,
          },
          synced_at: DateFormatter.now(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 || result.success) {
          console.log('[UserSyncService] User data synced to server successfully');
        } else {
          console.warn('[UserSyncService] Server sync returned error:', result);
        }
      } else {
        console.warn('[UserSyncService] Server sync failed with status:', response.status);
      }
    } catch (error) {
      console.error('[UserSyncService] Error syncing to server:', error);
    }
  }

  /**
   * 通知其他组件用户数据更新
   * @param user - 用户数据
   */
  private notifyUpdate(user: UserData | null): void {
    eventBus.emit(UPDATE_EVENT, user);
  }

  /**
   * 通知其他组件用户登出
   */
  private notifyLogout(): void {
    eventBus.emit(LOGOUT_EVENT);
  }

  /**
   * 启动定期同步
   */
  private startPeriodicSync(): void {
    // 每 30 秒检查一次是否需要同步
    setInterval(() => {
      if (this.currentUser && this.syncQueue.length === 0 && !this.isSyncing) {
        // 如果超过同步间隔，触发同步
        const now = Date.now();
        if (now - this.lastSyncTime > this.syncInterval) {
          this.scheduleSync(this.currentUser);
        }
      }
    }, 10000);
  }

  /**
   * 立即同步用户数据到服务器
   */
  forceSync(): Promise<void> {
    if (!this.currentUser) {
      return Promise.resolve();
    }

    return this.syncToServer(this.currentUser);
  }

  /**
   * 监听用户数据更新
   * @param callback - 回调函数
   * @returns 取消订阅函数
   */
  onUserUpdate(callback: (user: UserData | null) => void): () => void {
    const listenerId = eventBus.subscribe(UPDATE_EVENT, callback);
    return () => {
      eventBus.unsubscribe(UPDATE_EVENT, listenerId);
    };
  }

  /**
   * 监听用户登出
   * @param callback - 回调函数
   * @returns 取消订阅函数
   */
  onUserLogout(callback: () => void): () => void {
    const listenerId = eventBus.subscribe(LOGOUT_EVENT, callback);
    return () => {
      eventBus.unsubscribe(LOGOUT_EVENT, listenerId);
    };
  }
}

// 导出单例
export const userSyncService = new UserSyncService();

// 默认导出
export default userSyncService;
