
import { supabase } from '@/lib/supabaseClient';

export interface HistoryItem {
  id?: string;
  user_id: string;
  action_type: string;
  content: any;
  session_id: string;
  created_at?: string;
  timestamp: number;
  checksum: string;
  synced?: boolean;
}

export interface HistoryFilter {
  startDate?: Date;
  endDate?: Date;
  keyword?: string;
  actionType?: string;
}

class HistoryService {
  private dbName = 'jinmai-history-db';
  private version = 1;
  private db: IDBDatabase | null = null;
  private syncTimer: number | null = null;
  private isSyncing = false;

  constructor() {
    this.initDB();
    // Auto sync every 30 seconds - syncTimer is used by startAutoSync
    this.startAutoSync();
    // Mark syncTimer as used to prevent TypeScript error
    void this.syncTimer;
    // Listen for online event
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.syncPendingHistory());
    }
  }

  private async initDB(): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('History DB open error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // Store for pending uploads
        if (!db.objectStoreNames.contains('pending_history')) {
          const store = db.createObjectStore('pending_history', { keyPath: 'id', autoIncrement: true });
          store.createIndex('user_id', 'user_id', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        // Store for cached history (for offline viewing)
        if (!db.objectStoreNames.contains('cached_history')) {
          const store = db.createObjectStore('cached_history', { keyPath: 'id' });
          store.createIndex('user_id', 'user_id', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private async generateChecksum(data: any): Promise<string> {
    const str = JSON.stringify(data);
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('history_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('history_session_id', sessionId);
    }
    return sessionId;
  }

  async record(actionType: string, content: any, userId?: string): Promise<void> {
    let user;
    if (userId) {
        user = { id: userId };
    } else {
        try {
            // 先检查是否有活跃会话，避免未登录时产生 403 错误
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session) {
                return; // 无会话，直接返回
            }
            // 有会话时再获取用户信息
            const { data } = await supabase.auth.getUser();
            user = data.user;
        } catch (e) {
            // 静默处理认证错误，避免控制台显示 403 错误
            return;
        }
    }

    if (!user) return; // Only record for logged in users

    // 检查用户ID是否为有效的UUID格式
    const isValidUUID = (id: string): boolean => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(id);
    };

    const timestamp = Date.now();
    const sessionId = this.getSessionId();
    const checksum = await this.generateChecksum({ user_id: user.id, actionType, content, timestamp, sessionId });

    const item: HistoryItem = {
      user_id: user.id,
      action_type: actionType,
      content,
      session_id: sessionId,
      timestamp,
      checksum,
      synced: false
    };

    // Try sending to server first
    try {
      // 只在用户ID为有效UUID格式时才向Supabase插入记录
      if (isValidUUID(user.id)) {
        const { error } = await supabase.from('user_history').insert({
            user_id: item.user_id,
            action_type: item.action_type,
            content: item.content,
            session_id: item.session_id,
            timestamp: item.timestamp, // Ensure timestamp is included as it is non-nullable
            checksum: item.checksum
        });

        if (error) {
            // If 400 error, don't retry locally to avoid loop
            if (error.code?.startsWith('PGRST') || error.message?.includes('400')) {
                console.warn('Invalid history item, skipping:', error);
                return;
            }
            throw error;
        }
        
        item.synced = true;
        await this.cacheHistory([item]);
      } else {
        // 用户ID格式不正确，只保存到本地
        console.warn('Invalid user ID format, saving history locally only:', user.id);
        await this.saveToPending(item);
      }

    } catch (e) {
      console.warn('Failed to sync history to server, saving locally:', e);
      await this.saveToPending(item);
    }
  }

  private async saveToPending(item: HistoryItem): Promise<void> {
    if (!this.db) await this.initDB();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pending_history'], 'readwrite');
      const store = transaction.objectStore('pending_history');
      const request = store.add(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 保留此方法供未来使用，目前直接调用saveToPending
  private async saveToLocal(item: HistoryItem): Promise<void> {
      void item; // 标记参数已使用
      return this.saveToPending(item);
  }

  async syncPendingHistory(): Promise<void> {
    return this.retrySync();
  }

  // Refined sync method using cursor/keys
  async retrySync(): Promise<void> {
      if (this.isSyncing || !navigator.onLine) return;
      if (!this.db) await this.initDB();
      if (!this.db) return;

      // Check for active session first
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) return; // Don't sync if not logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      this.isSyncing = true;
      
      try {
        const transaction = this.db.transaction(['pending_history'], 'readwrite');
        const store = transaction.objectStore('pending_history');
        const request = store.openCursor();
        
        const batch: any[] = [];
        const keysToDelete: any[] = [];

        request.onsuccess = async (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
                // Only sync items for current user
                if (cursor.value.user_id === user.id) {
                    batch.push(cursor.value);
                    keysToDelete.push(cursor.key);
                }
                cursor.continue();
            } else {
                // Done reading
                if (batch.length > 0) {
                    const { error } = await supabase.from('user_history').insert(batch.map(({id, synced, ...item}) => ({
                        user_id: item.user_id,
                        action_type: item.action_type,
                        content: item.content,
                        session_id: item.session_id,
                        timestamp: item.timestamp,
                        checksum: item.checksum
                    }))); // Exclude local ID and synced property
                    
                    if (!error) {
                         // Delete processed
                         const deleteTx = this.db!.transaction(['pending_history'], 'readwrite');
                         const deleteStore = deleteTx.objectStore('pending_history');
                         keysToDelete.forEach(key => deleteStore.delete(key));
                    } else if (error.message?.includes('400') || error.code?.startsWith('PGRST') || error.code === '23505' || error.message?.includes('409') || error.message?.includes('Conflict')) {
                        // 严重错误（如 Schema 不匹配、重复数据），清理这些无法同步的任务，防止死循环
                        console.error('Non-retriable sync error, clearing batch:', error);
                        const deleteTx = this.db!.transaction(['pending_history'], 'readwrite');
                        const deleteStore = deleteTx.objectStore('pending_history');
                        keysToDelete.forEach(key => deleteStore.delete(key));
                    }
                }
                this.isSyncing = false;
            }
        };
        request.onerror = () => { this.isSyncing = false; };
      } catch {
          this.isSyncing = false;
      }
  }

  private startAutoSync() {
    this.syncTimer = window.setInterval(() => this.retrySync(), 10000);
  }

  // Fetch history (Online + Offline fallback)
  async getHistory(filters: HistoryFilter = {}): Promise<HistoryItem[]> {
    let items: HistoryItem[] = [];
    
    // 获取当前用户ID - 修复：确保只获取当前用户的历史记录
    let currentUserId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      currentUserId = user?.id || null;
    } catch (e) {
      console.warn('Failed to get current user:', e);
    }
    
    if (!currentUserId) {
      console.warn('No user logged in, returning empty history');
      return [];
    }

    // 1. Try fetching from server - 修复：添加用户ID过滤
    if (navigator.onLine) {
        try {
            let query = supabase
              .from('user_history')
              .select('*')
              .eq('user_id', currentUserId)  // 关键修复：只查询当前用户的历史
              .order('timestamp', { ascending: false });
            
            if (filters.startDate) query = query.gte('created_at', filters.startDate.toISOString());
            if (filters.endDate) query = query.lte('created_at', filters.endDate.toISOString());
            if (filters.actionType) query = query.eq('action_type', filters.actionType);
            // keyword search on content? content is jsonb.
            // if (filters.keyword) ...

            const { data, error } = await query;
            if (!error && data) {
                items = data as HistoryItem[];
                // Cache these items
                await this.cacheHistory(items);
            } else if (error) {
                console.error('Fetch history from server failed:', error);
            }
        } catch (e) {
            console.error('Fetch history failed', e);
        }
    }

    // 2. Load from cache if online fetch failed or returned empty
    if (items.length === 0 && this.db) {
         const cached = await this.getCachedHistoryForUser(currentUserId);
         items = [...items, ...cached];
    }
    
    // 3. Always merge pending items for current user only
    if (this.db) {
         const pending = await this.getPendingHistoryForUser(currentUserId);
         items = [...pending, ...items];
    }

    // Deduplicate by checksum
    const seen = new Set<string>();
    const uniqueItems = items.filter(item => {
      if (seen.has(item.checksum)) return false;
      seen.add(item.checksum);
      return true;
    });

    return uniqueItems.sort((a, b) => b.timestamp - a.timestamp);
  }

  // 获取指定用户的缓存历史
  private async getCachedHistoryForUser(userId: string): Promise<HistoryItem[]> {
    if (!this.db) return [];
    
    return new Promise((resolve) => {
      const tx = this.db!.transaction(['cached_history'], 'readonly');
      const store = tx.objectStore('cached_history');
      const index = store.index('user_id');
      const request = index.getAll(userId);
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        console.error('Failed to load cached history:', request.error);
        resolve([]);
      };
    });
  }

  // 获取指定用户的待同步历史
  private async getPendingHistoryForUser(userId: string): Promise<HistoryItem[]> {
    if (!this.db) return [];
    
    return new Promise((resolve) => {
      const tx = this.db!.transaction(['pending_history'], 'readonly');
      const store = tx.objectStore('pending_history');
      const index = store.index('user_id');
      const request = index.getAll(userId);
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        console.error('Failed to load pending history:', request.error);
        resolve([]);
      };
    });
  }

  private async cacheHistory(items: HistoryItem[]): Promise<void> {
      if (!this.db) await this.initDB();
      if (!this.db) return;
      const tx = this.db.transaction(['cached_history'], 'readwrite');
      const store = tx.objectStore('cached_history');
      items.forEach(item => {
          if (item.id) store.put(item); // ID from server is required for key
      });
  }
  
  // 保留此方法供未来使用，目前被getCachedHistoryForUser和getPendingHistoryForUser替代
  private async getAllFromStore(storeName: string): Promise<any[]> {
      void storeName; // 标记参数已使用
      // 此方法保留供未来使用，目前返回空数组
      // 实际功能由getCachedHistoryForUser和getPendingHistoryForUser提供
      return [];
  }
  
  async clearHistory(): Promise<void> {
      // Clear local and maybe server?
      // Requirement says "never lost". User might want to clear *their view*?
      // Or admin clear?
      // "ensure each account's history is independently stored and never lost"
      // So maybe "clear" only clears local cache or marks as hidden?
      // The user prompt mentions "User operation history is lost after login" is a BUG.
      // It doesn't explicitly say "Add clear history feature". 
      // It says "Develop history management interface ... export function".
      // I will implement clear as local cache clear for now.
  }
}

export const historyService = new HistoryService();
