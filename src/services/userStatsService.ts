// 用户统计服务
import { supabase } from '@/lib/supabaseClient';
import eventBus from '../lib/eventBus';

// 用户统计数据类型
export interface UserStats {
  userId: string;
  worksCount: number;
  followersCount: number;
  followingCount: number;
  favoritesCount: number;
  isInitialized: boolean;
  lastUpdated: string;
}

// 存储键常量
const USER_STATS_KEY = 'USER_STATS';
const USER_STATS_TABLE = 'user_stats';

class UserStatsService {
  private static instance: UserStatsService;
  private statsCache: Map<string, UserStats> = new Map();

  private constructor() {
    this.initializeEventListeners();
  }

  // 获取单例实例
  public static getInstance(): UserStatsService {
    if (!UserStatsService.instance) {
      UserStatsService.instance = new UserStatsService();
    }
    return UserStatsService.instance;
  }

  // 初始化事件监听器
  private initializeEventListeners(): void {
    // 监听用户注册事件，初始化统计数据
    eventBus.on('auth:register', async (userData) => {
      if (userData && userData.userId) {
        await this.initializeUserStats(userData.userId);
      }
    });

    // 监听用户登录事件，检查统计数据完整性
    eventBus.on('auth:login', async (userData) => {
      if (userData && userData.userId) {
        await this.checkStatsIntegrity(userData.userId);
      }
    });
  }

  // 初始化用户统计数据
  public async initializeUserStats(userId: string): Promise<UserStats> {
    try {
      // 创建初始统计数据
      const initialStats: UserStats = {
        userId,
        worksCount: 0,
        followersCount: 0,
        followingCount: 0,
        favoritesCount: 0,
        isInitialized: true,
        lastUpdated: new Date().toISOString()
      };

      // 存储到Supabase（如果可用）
      if (supabase) {
        try {
          await supabase.from(USER_STATS_TABLE).upsert(initialStats);
        } catch (supabaseError) {
          console.warn('Supabase统计数据初始化失败，使用localStorage:', supabaseError);
        }
      }

      // 存储到localStorage作为备份
      this.saveStatsToLocalStorage(userId, initialStats);
      
      // 更新缓存
      this.statsCache.set(userId, initialStats);

      console.log(`用户统计数据初始化成功: ${userId}`, initialStats);
      return initialStats;
    } catch (error) {
      console.error('初始化用户统计数据失败:', error);
      // 即使失败也返回默认值
      return this.getDefaultStats(userId);
    }
  }

  // 更新用户统计数据
  public async updateUserStats(userId: string, stats: Partial<UserStats>): Promise<UserStats> {
    try {
      // 获取当前统计数据
      const currentStats = await this.getUserStats(userId);
      
      // 合并更新
      const updatedStats: UserStats = {
        ...currentStats,
        ...stats,
        lastUpdated: new Date().toISOString()
      };

      // 存储到Supabase（如果可用）
      if (supabase) {
        try {
          await supabase.from(USER_STATS_TABLE).upsert(updatedStats);
        } catch (supabaseError) {
          console.warn('Supabase统计数据更新失败，使用localStorage:', supabaseError);
        }
      }

      // 存储到localStorage
      this.saveStatsToLocalStorage(userId, updatedStats);
      
      // 更新缓存
      this.statsCache.set(userId, updatedStats);

      console.log(`用户统计数据更新成功: ${userId}`, updatedStats);
      return updatedStats;
    } catch (error) {
      console.error('更新用户统计数据失败:', error);
      throw error;
    }
  }

  // 从 follows 表获取真实的关注数据
  private async fetchFollowStatsFromDB(userId: string): Promise<{ followingCount: number; followersCount: number } | null> {
    if (!supabase) return null;

    try {
      // 查询关注数（我关注的人）
      const { count: followingCount, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      if (followingError) {
        console.warn('获取关注数失败:', followingError);
      }

      // 查询粉丝数（关注我的人）
      const { count: followersCount, error: followersError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      if (followersError) {
        console.warn('获取粉丝数失败:', followersError);
      }

      return {
        followingCount: followingCount || 0,
        followersCount: followersCount || 0
      };
    } catch (error) {
      console.warn('从数据库获取关注数据失败:', error);
      return null;
    }
  }

  // 获取用户统计数据
  public async getUserStats(userId: string): Promise<UserStats> {
    // 先从缓存获取
    if (this.statsCache.has(userId)) {
      return this.statsCache.get(userId)!;
    }

    // 从 follows 表获取真实的关注数据
    const followStats = await this.fetchFollowStatsFromDB(userId);

    // 从Supabase获取（如果可用）
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from(USER_STATS_TABLE)
          .select('*')
          .eq('userId', userId)
          .single();

        if (data) {
          // 合并真实关注数据
          const mergedStats = {
            ...data,
            followingCount: followStats?.followingCount ?? data.followingCount ?? 0,
            followersCount: followStats?.followersCount ?? data.followersCount ?? 0,
          };
          this.statsCache.set(userId, mergedStats);
          return mergedStats;
        }
      } catch (supabaseError) {
        console.warn('Supabase获取统计数据失败，使用localStorage:', supabaseError);
      }
    }

    // 从localStorage获取
    const localStats = this.getStatsFromLocalStorage(userId);
    if (localStats) {
      // 合并真实关注数据
      const mergedStats = {
        ...localStats,
        followingCount: followStats?.followingCount ?? localStats.followingCount ?? 0,
        followersCount: followStats?.followersCount ?? localStats.followersCount ?? 0,
      };
      this.statsCache.set(userId, mergedStats);
      return mergedStats;
    }

    // 如果都没有，初始化新的统计数据
    const newStats = await this.initializeUserStats(userId);
    // 合并真实关注数据
    return {
      ...newStats,
      followingCount: followStats?.followingCount ?? 0,
      followersCount: followStats?.followersCount ?? 0,
    };
  }

  // 检查统计数据完整性
  public async checkStatsIntegrity(userId: string): Promise<boolean> {
    try {
      const stats = await this.getUserStats(userId);
      
      // 验证所有必需字段是否存在且有效
      const isComplete = 
        typeof stats.worksCount === 'number' && 
        typeof stats.followersCount === 'number' && 
        typeof stats.followingCount === 'number' && 
        typeof stats.favoritesCount === 'number';

      if (!isComplete || !stats.isInitialized) {
        console.warn(`用户统计数据不完整，重新初始化: ${userId}`);
        await this.initializeUserStats(userId);
        return false;
      }

      return true;
    } catch (error) {
      console.error('检查统计数据完整性失败:', error);
      await this.initializeUserStats(userId);
      return false;
    }
  }

  // 从localStorage获取统计数据
  private getStatsFromLocalStorage(userId: string): UserStats | null {
    try {
      const statsJson = localStorage.getItem(`${USER_STATS_KEY}_${userId}`);
      if (statsJson) {
        return JSON.parse(statsJson) as UserStats;
      }
    } catch (error) {
      console.error('从localStorage获取统计数据失败:', error);
    }
    return null;
  }

  // 保存统计数据到localStorage
  private saveStatsToLocalStorage(userId: string, stats: UserStats): void {
    try {
      localStorage.setItem(`${USER_STATS_KEY}_${userId}`, JSON.stringify(stats));
    } catch (error) {
      console.error('保存统计数据到localStorage失败:', error);
    }
  }

  // 获取默认统计数据
  private getDefaultStats(userId: string): UserStats {
    return {
      userId,
      worksCount: 0,
      followersCount: 0,
      followingCount: 0,
      favoritesCount: 0,
      isInitialized: false,
      lastUpdated: new Date().toISOString()
    };
  }

  // 清除用户统计数据缓存
  public clearCache(userId?: string): void {
    if (userId) {
      this.statsCache.delete(userId);
    } else {
      this.statsCache.clear();
    }
  }
}

// 导出单例实例
export default UserStatsService.getInstance();
