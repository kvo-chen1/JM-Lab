// 数据状态管理服务
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import eventBus, { EventType } from './eventBus';
import { Work } from '../mock/works';
import { User } from '../contexts/authContext';

/**
 * 数据缓存配置
 */
interface CacheConfig {
  /**
   * 缓存过期时间（毫秒）
   */
  ttl: number;
  
  /**
   * 是否允许使用过期数据（stale-while-revalidate）
   */
  allowStale: boolean;
  
  /**
   * 过期后可使用的时间（毫秒）
   */
  staleTtl: number;
  
  /**
   * 是否自动刷新过期数据
   */
  autoRefresh: boolean;
}

/**
 * 数据缓存项
 */
interface CacheItem<T> {
  /**
   * 缓存数据
   */
  data: T;
  
  /**
   * 缓存创建时间
   */
  createdAt: number;
  
  /**
   * 缓存过期时间
   */
  expiresAt: number;
  
  /**
   * 缓存失效时间（超过此时间后不能再使用过期数据）
   */
  staleAt: number;
  
  /**
   * 是否正在刷新
   */
  isRefreshing: boolean;
}

/**
 * 数据状态接口
 */
export interface DataState {
  /**
   * 作品数据
   */
  works: {
    /**
     * 所有作品列表
     */
    all: Work[];
    
    /**
     * 精选作品
     */
    featured: Work[];
    
    /**
     * 按分类分组的作品
     */
    byCategory: Record<string, Work[]>;
    
    /**
     * 搜索结果
     */
    searchResults: Work[];
    
    /**
     * 作品详情缓存
     */
    details: Record<number, Work>;
  };
  
  /**
   * 用户数据
   */
  users: {
    /**
     * 当前用户
     */
    current: User | null;
    
    /**
     * 用户列表
     */
    list: User[];
    
    /**
     * 用户详情缓存
     */
    details: Record<string, User>;
  };
  
  /**
   * 分类数据
   */
  categories: Array<{ id: number; name: string; count: number }>;
  
  /**
   * 加载状态
   */
  loading: {
    /**
     * 作品相关加载状态
     */
    works: boolean;
    
    /**
     * 用户相关加载状态
     */
    users: boolean;
    
    /**
     * 分类相关加载状态
     */
    categories: boolean;
  };
  
  /**
   * 错误信息
   */
  errors: {
    /**
     * 作品相关错误
     */
    works: string | null;
    
    /**
     * 用户相关错误
     */
    users: string | null;
    
    /**
     * 分类相关错误
     */
    categories: string | null;
  };
  
  /**
   * 缓存配置
   */
  cacheConfig: CacheConfig;
  
  /**
   * 数据缓存
   */
  cache: Record<string, CacheItem<any>>;
}

/**
 * 数据状态操作接口
 */
export interface DataStateActions {
  /**
   * 设置所有作品
   */
  setWorks: (works: Work[]) => void;
  
  /**
   * 设置精选作品
   */
  setFeaturedWorks: (works: Work[]) => void;
  
  /**
   * 设置分类作品
   */
  setWorksByCategory: (category: string, works: Work[]) => void;
  
  /**
   * 设置作品详情
   */
  setWorkDetail: (work: Work) => void;
  
  /**
   * 添加新作品
   */
  addWork: (work: Work) => void;
  
  /**
   * 更新作品
   */
  updateWork: (id: number, updates: Partial<Work>) => void;
  
  /**
   * 删除作品
   */
  deleteWork: (id: number) => void;
  
  /**
   * 设置搜索结果
   */
  setSearchResults: (works: Work[]) => void;
  
  /**
   * 设置当前用户
   */
  setCurrentUser: (user: User | null) => void;
  
  /**
   * 设置用户列表
   */
  setUsers: (users: User[]) => void;
  
  /**
   * 设置用户详情
   */
  setUserDetail: (user: User) => void;
  
  /**
   * 设置分类列表
   */
  setCategories: (categories: Array<{ id: number; name: string; count: number }>) => void;
  
  /**
   * 设置加载状态
   */
  setLoading: (type: keyof DataState['loading'], isLoading: boolean) => void;
  
  /**
   * 设置错误信息
   */
  setError: (type: keyof DataState['errors'], error: string | null) => void;
  
  /**
   * 清除所有数据
   */
  clearAll: () => void;
  
  /**
   * 清除指定类型的数据
   */
  clearType: (type: 'works' | 'users' | 'categories') => void;
  
  /**
   * 缓存数据
   */
  cacheData: <T>(key: string, data: T, config?: Partial<CacheConfig>) => void;
  
  /**
   * 获取缓存数据
   */
  getCachedData: <T>(key: string) => T | null;
  
  /**
   * 检查缓存是否有效
   */
  isCacheValid: (key: string) => boolean;
  
  /**
   * 清除缓存
   */
  clearCache: (key?: string) => void;
  
  /**
   * 更新缓存配置
   */
  updateCacheConfig: (config: Partial<CacheConfig>) => void;
}

/**
 * 默认缓存配置
 */
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 30 * 60 * 1000, // 30分钟
  allowStale: true,
  staleTtl: 24 * 60 * 60 * 1000, // 24小时
  autoRefresh: true
};

/**
 * 默认数据状态
 */
const DEFAULT_DATA_STATE: DataState = {
  works: {
    all: [],
    featured: [],
    byCategory: {},
    searchResults: [],
    details: {}
  },
  users: {
    current: null,
    list: [],
    details: {}
  },
  categories: [],
  loading: {
    works: false,
    users: false,
    categories: false
  },
  errors: {
    works: null,
    users: null,
    categories: null
  },
  cacheConfig: DEFAULT_CACHE_CONFIG,
  cache: {}
};

/**
 * 数据状态存储
 */
export const useDataState = create<DataState & DataStateActions>()(
  persist(
    (set, get) => ({
      ...DEFAULT_DATA_STATE,
      
      // 作品相关操作
      setWorks: (works) => {
        set({ works: { ...get().works, all: works } });
        eventBus.emit(EventType.WORK_UPDATED, works);
      },
      
      setFeaturedWorks: (works) => {
        set({ works: { ...get().works, featured: works } });
      },
      
      setWorksByCategory: (category, works) => {
        set({ 
          works: { 
            ...get().works, 
            byCategory: { ...get().works.byCategory, [category]: works } 
          } 
        });
      },
      
      setWorkDetail: (work) => {
        set({ 
          works: { 
            ...get().works, 
            details: { ...get().works.details, [work.id]: work } 
          } 
        });
        eventBus.emit(EventType.WORK_UPDATED, work);
      },
      
      addWork: (work) => {
        set({ 
          works: { 
            ...get().works, 
            all: [work, ...get().works.all],
            featured: work.featured ? [work, ...get().works.featured] : get().works.featured
          } 
        });
        eventBus.emit(EventType.WORK_CREATED, work);
      },
      
      updateWork: (id, updates) => {
        set({ 
          works: { 
            ...get().works, 
            all: get().works.all.map(work => work.id === id ? { ...work, ...updates } : work),
            featured: get().works.featured.map(work => work.id === id ? { ...work, ...updates } : work),
            details: get().works.details[id] ? { 
              ...get().works.details, 
              [id]: { ...get().works.details[id], ...updates } 
            } : get().works.details
          } 
        });
        const updatedWork = get().works.all.find(work => work.id === id);
        if (updatedWork) {
          eventBus.emit(EventType.WORK_UPDATED, { ...updatedWork, ...updates });
        }
      },
      
      deleteWork: (id) => {
        set({ 
          works: { 
            ...get().works, 
            all: get().works.all.filter(work => work.id !== id),
            featured: get().works.featured.filter(work => work.id !== id),
            details: Object.fromEntries(
              Object.entries(get().works.details).filter(([key]) => parseInt(key) !== id)
            )
          } 
        });
        eventBus.emit(EventType.WORK_DELETED, id);
      },
      
      setSearchResults: (works) => {
        set({ works: { ...get().works, searchResults: works } });
      },
      
      // 用户相关操作
      setCurrentUser: (user) => {
        set({ users: { ...get().users, current: user } });
        if (user) {
          eventBus.emit(EventType.USER_UPDATED, user);
        }
      },
      
      setUsers: (users) => {
        set({ users: { ...get().users, list: users } });
      },
      
      setUserDetail: (user) => {
        set({ 
          users: { 
            ...get().users, 
            details: { ...get().users.details, [user.id]: user } 
          } 
        });
        eventBus.emit(EventType.USER_UPDATED, user);
      },
      
      // 分类相关操作
      setCategories: (categories) => {
        set({ categories });
        eventBus.emit(EventType.CATEGORY_UPDATED, categories);
      },
      
      // 加载状态操作
      setLoading: (type, isLoading) => {
        set({ loading: { ...get().loading, [type]: isLoading } });
      },
      
      // 错误信息操作
      setError: (type, error) => {
        set({ errors: { ...get().errors, [type]: error } });
        if (error) {
          eventBus.emit(EventType.APP_ERROR, { type, message: error });
        }
      },
      
      // 清除数据操作
      clearAll: () => {
        set({ ...DEFAULT_DATA_STATE });
      },
      
      clearType: (type) => {
        if (type === 'works') {
          set({ works: DEFAULT_DATA_STATE.works });
        } else if (type === 'users') {
          set({ users: DEFAULT_DATA_STATE.users });
        } else if (type === 'categories') {
          set({ categories: DEFAULT_DATA_STATE.categories });
        }
      },
      
      // 缓存操作
      cacheData: <T>(key: string, data: T, config?: Partial<CacheConfig>) => {
        const cacheConfig = { ...get().cacheConfig, ...config };
        const now = Date.now();
        const expiresAt = now + cacheConfig.ttl;
        const staleAt = expiresAt + cacheConfig.staleTtl;
        
        set({ 
          cache: { 
            ...get().cache, 
            [key]: { 
              data, 
              createdAt: now, 
              expiresAt, 
              staleAt, 
              isRefreshing: false 
            } 
          } 
        });
      },
      
      getCachedData: <T>(key: string): T | null => {
        const cacheItem = get().cache[key];
        if (!cacheItem) return null;
        
        const now = Date.now();
        const { allowStale } = get().cacheConfig;
        const { expiresAt, staleAt } = cacheItem;
        
        // 如果数据未过期，直接返回
        if (now < expiresAt) {
          return cacheItem.data as T;
        }
        
        // 如果数据已过期但还可以使用过期数据，返回数据并标记为需要刷新
        if (allowStale && now < staleAt) {
          // 如果不在刷新中，触发刷新
          if (!cacheItem.isRefreshing) {
            set({ 
              cache: { 
                ...get().cache, 
                [key]: { ...cacheItem, isRefreshing: true } 
              } 
            });
            // 触发数据刷新事件
            eventBus.emit(EventType.DATA_SYNC_STARTED, { key });
          }
          return cacheItem.data as T;
        }
        
        // 数据已完全失效，清除缓存
        set({ 
          cache: Object.fromEntries(
            Object.entries(get().cache).filter(([k]) => k !== key)
          ) 
        });
        return null;
      },
      
      isCacheValid: (key: string): boolean => {
        const cacheItem = get().cache[key];
        if (!cacheItem) return false;
        
        const now = Date.now();
        return now < cacheItem.expiresAt;
      },
      
      clearCache: (key?: string) => {
        if (key) {
          set({ 
            cache: Object.fromEntries(
              Object.entries(get().cache).filter(([k]) => k !== key)
            ) 
          });
        } else {
          set({ cache: {} });
        }
      },
      
      updateCacheConfig: (config: Partial<CacheConfig>) => {
        set({ cacheConfig: { ...get().cacheConfig, ...config } });
      }
    }),
    {
      name: 'data-state-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // 只持久化需要保存的数据
        users: { current: state.users.current },
        cacheConfig: state.cacheConfig,
        cache: state.cache
      })
    }
  )
);

/**
 * 数据状态服务
 */
export class DataStateService {
  private static instance: DataStateService;
  
  private constructor() {
    // 监听事件总线事件，更新数据状态
    eventBus.on(EventType.WORK_CREATED, (work) => {
      useDataState.getState().addWork(work);
    });
    
    eventBus.on(EventType.WORK_UPDATED, (work) => {
      if (Array.isArray(work)) {
        useDataState.getState().setWorks(work);
      } else {
        useDataState.getState().setWorkDetail(work);
      }
    });
    
    eventBus.on(EventType.WORK_DELETED, (id) => {
      useDataState.getState().deleteWork(id);
    });
    
    eventBus.on(EventType.USER_UPDATED, (user) => {
      useDataState.getState().setUserDetail(user);
    });
    
    eventBus.on(EventType.CATEGORY_UPDATED, (categories) => {
      useDataState.getState().setCategories(categories);
    });
  }
  
  /**
   * 获取单例实例
   */
  static getInstance(): DataStateService {
    if (!DataStateService.instance) {
      DataStateService.instance = new DataStateService();
    }
    return DataStateService.instance;
  }
  
  /**
   * 初始化数据状态服务
   */
  initialize(): void {
    eventBus.emit(EventType.DATA_SYNC_COMPLETED);
  }
  
  /**
   * 同步数据
   */
  async syncData(): Promise<void> {
    eventBus.emit(EventType.DATA_SYNC_STARTED);
    try {
      // 这里可以添加数据同步逻辑
      eventBus.emit(EventType.DATA_SYNC_COMPLETED);
    } catch (error) {
      eventBus.emit(EventType.DATA_SYNC_FAILED, error);
    }
  }
}

// 导出单例实例
export const dataStateService = DataStateService.getInstance();

export default useDataState;
