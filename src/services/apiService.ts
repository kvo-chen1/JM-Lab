import apiClient from '../lib/apiClient';
import { Work } from '@/types';
import { validationService } from './validationService';
import { historyService } from './historyService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// 本地定义 User 类型以避免循环引用
interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  phone?: string;
  interests?: string[];
  isAdmin?: boolean;
  age?: number;
  tags?: string[];
  bio?: string;
  location?: string;
  occupation?: string;
  website?: string;
  github?: string;
  twitter?: string;
  coverImage?: string;
  metadata?: Record<string, any>;
  isNewUser?: boolean;
  worksCount?: number;
  followersCount?: number;
  followingCount?: number;
  favoritesCount?: number;
  membershipLevel: 'free' | 'premium' | 'vip';
  membershipStart?: string;
  membershipEnd?: string;
  membershipStatus: 'active' | 'expired' | 'pending';
}

// 统一API服务层
class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '';
  }

  /**
   * 设置是否使用模拟数据
   */
  setUseMockData(useMock: boolean): void {
    console.warn('[ApiService] Mock data mode is deprecated and removed.');
  }

  /**
   * 设置基础URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * 通用GET请求
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    // Extract cache options from params if present
    const cacheOptions = params?.cache;
    // Check if refresh is requested
    const forceRefresh = params?.refresh === true;
    // Remove cache and refresh from params so it's not sent as query param
    const { cache, refresh, ...queryParams } = params || {};
    
    // Build URL without cache/refresh params
    const requestUrl = this.buildUrl(endpoint, queryParams);
    console.log('[ApiService] GET', requestUrl, 'params:', queryParams, 'forceRefresh:', forceRefresh);
    
    // If forceRefresh is true, disable cache
    const finalCacheOptions = forceRefresh 
      ? { enabled: false } 
      : cacheOptions;
    
    const response = await apiClient.get<T>(requestUrl, { cache: finalCacheOptions });
    if (!response.ok) {
      throw new Error(response.error || '请求失败');
    }
    // 确保返回的数据类型正确
    return response.data as T;
  }

  /**
   * 通用POST请求
   */
  async post<T, B>(endpoint: string, body?: B): Promise<T> {
    const url = this.buildUrl(endpoint);
    const response = await apiClient.post<T, B>(url, body);
    if (!response.ok) {
      throw new Error(response.error || '请求失败');
    }
    return response.data as T;
  }

  /**
   * 通用PUT请求
   */
  async put<T, B>(endpoint: string, body?: B): Promise<T> {
    const url = this.buildUrl(endpoint);
    const response = await apiClient.put<T, B>(url, body);
    if (!response.ok) {
      throw new Error(response.error || '请求失败');
    }
    return response.data as T;
  }

  /**
   * 通用PATCH请求
   */
  async patch<T, B>(endpoint: string, body?: B): Promise<T> {
    const url = this.buildUrl(endpoint);
    const response = await apiClient.patch<T, B>(url, body);
    if (!response.ok) {
      throw new Error(response.error || '请求失败');
    }
    return response.data as T;
  }

  /**
   * 通用DELETE请求
   */
  async delete<T>(endpoint: string): Promise<T> {
    const url = this.buildUrl(endpoint);
    const response = await apiClient.delete<T>(url);
    if (!response.ok) {
      throw new Error(response.error || '请求失败');
    }
    return response.data as T;
  }

  /**
   * 构建完整URL
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    let url = `${this.baseUrl}${endpoint}`;
    
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    return url;
  }

  /**
   * 添加评论
   */
  async addComment(threadId: string, content: string, replyTo?: string): Promise<{
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    post_id: string;
    parent_id?: string;
  } | null> {
    try {
      const result = await apiClient.post<{
        id: string;
        content: string;
        created_at: string;
        user_id: string;
        post_id: string;
        parent_id?: string;
      }, { content: string; parent_id: string | null }>(`/api/posts/${threadId}/comments`, {
        content,
        parent_id: replyTo || null
      });

      if (!result.ok) {
        console.error('[ApiService.addComment] Failed:', result.status);
        return null;
      }

      return result.data || null;
    } catch (error) {
      console.error('[ApiService.addComment] Error:', error);
      return null;
    }
  }

  /**
   * 收藏帖子
   */
  async favoriteThread(threadId: string): Promise<{ success: boolean }> {
    try {
      // 获取当前用户ID（兼容多种登录方式）
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('请先登录后再收藏');
      }

      // 检查是否已收藏
      const { data: existingFavorite } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('post_id', threadId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingFavorite) {
        // 已经收藏过了
        return { success: true };
      }

      // 添加收藏
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          post_id: threadId,
          user_id: userId,
        });

      if (error) {
        console.error('[ApiService.favoriteThread] Error:', error);
        throw new Error('收藏失败');
      }

      return { success: true };
    } catch (error) {
      console.error('[ApiService.favoriteThread] Error:', error);
      throw error;
    }
  }

  /**
   * 获取当前用户ID（兼容多种登录方式）
   */
  private async getCurrentUserId(): Promise<string | null> {
    // 首先尝试从 localStorage 获取用户信息（后端登录方式）
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user?.id) {
          return user.id;
        }
      } catch {
        // 解析失败，继续尝试其他方式
      }
    }

    // 尝试从 Supabase Auth 获取
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        return user.id;
      }
    } catch {
      // 继续尝试其他方式
    }

    return null;
  }

  /**
   * 取消收藏帖子
   */
  async unfavoriteThread(threadId: string): Promise<{ success: boolean }> {
    try {
      // 获取当前用户ID（兼容多种登录方式）
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('请先登录');
      }

      // 删除收藏
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('post_id', threadId)
        .eq('user_id', userId);

      if (error) {
        console.error('[ApiService.unfavoriteThread] Error:', error);
        throw new Error('取消收藏失败');
      }

      return { success: true };
    } catch (error) {
      console.error('[ApiService.unfavoriteThread] Error:', error);
      throw error;
    }
  }

  /**
   * 点赞帖子
   */
  async likeThread(threadId: string): Promise<{ success: boolean }> {
    try {
      // 获取当前用户ID（兼容多种登录方式）
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('请先登录后再点赞');
      }

      // 检查是否已点赞
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', threadId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingLike) {
        // 已经点赞过了
        return { success: true };
      }

      // 添加点赞
      const { error } = await supabase
        .from('likes')
        .insert({
          post_id: threadId,
          user_id: userId,
        });

      if (error) {
        console.error('[ApiService.likeThread] Error:', error);
        throw new Error('点赞失败');
      }

      return { success: true };
    } catch (error) {
      console.error('[ApiService.likeThread] Error:', error);
      throw error;
    }
  }

  /**
   * 取消点赞帖子
   */
  async unlikeThread(threadId: string): Promise<{ success: boolean }> {
    try {
      // 获取当前用户ID（兼容多种登录方式）
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('请先登录');
      }

      // 删除点赞
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', threadId)
        .eq('user_id', userId);

      if (error) {
        console.error('[ApiService.unlikeThread] Error:', error);
        throw new Error('取消点赞失败');
      }

      return { success: true };
    } catch (error) {
      console.error('[ApiService.unlikeThread] Error:', error);
      throw error;
    }
  }
}

// 作品服务
class WorkService extends ApiService {
  /**
   * 获取作品列表
   */
  async getWorks(params?: {
    page?: number;
    limit?: number;
    category?: string;
    tags?: string[];
    featured?: boolean;
  }): Promise<Work[]> {
    return this.get<Work[]>('/api/works', params);
  }

  /**
   * 获取作品详情
   */
  async getWorkById(id: number | string): Promise<Work> {
    return this.get<Work>(`/api/works/${id}`);
  }

  /**
   * 创建作品
   */
  async createWork(work: Omit<Work, 'id'>): Promise<Work> {
    // 验证作品数据
    const validationResult = validationService.validateWork(work);
    if (!validationResult.success) {
      throw new Error(`作品数据验证失败: ${Object.values(validationResult.errors || {}).join(', ')}`);
    }
    const result = await this.post<Work, Omit<Work, 'id'>>('/api/works', work);
    void historyService.record('create_work', { title: result.title, id: result.id });
    return result;
  }

  /**
   * 更新作品
   */
  async updateWork(id: number | string, work: Partial<Work>): Promise<Work> {
    // 部分验证作品数据
    const validationResult = validationService.validateWorkPartial(work);
    if (!validationResult.success) {
      throw new Error(`作品数据验证失败: ${Object.values(validationResult.errors || {}).join(', ')}`);
    }
    return this.put<Work, Partial<Work>>(`/api/works/${id}`, work);
  }

  /**
   * 删除作品
   */
  async deleteWork(id: number | string): Promise<void> {
    return this.delete<void>(`/api/works/${id}`);
  }

  /**
   * 点赞作品
   */
  async likeWork(id: number | string): Promise<void> {
    await this.post<void, void>(`/api/works/${id}/like`);
    void historyService.record('like_work', { workId: id });
  }

  /**
   * 取消点赞作品
   */
  async unlikeWork(id: number | string): Promise<void> {
    return this.post<void, void>(`/api/works/${id}/unlike`);
  }
  
  /**
   * 发布作品到探索
   */
  async publishToExplore(workId: number, data: {
    category: string;
    tags: string[];
    culturalElements: string[];
    visibility: 'public' | 'private';
    isFeatured: boolean;
    scheduledPublishDate: string | null;
  }): Promise<{
    success: boolean;
    message: string;
    moderationStatus: 'pending' | 'approved' | 'rejected' | 'scheduled';
  }> {
    const result = await this.post<{
      success: boolean;
      message: string;
      moderationStatus: 'pending' | 'approved' | 'rejected' | 'scheduled';
    }, any>(`/api/works/${workId}/publish/explore`, data);
    void historyService.record('publish_work_explore', { workId, ...data });
    return result;
  }
  
  /**
   * 获取作品审核状态
   */
  async getModerationStatus(workId: number): Promise<{
    status: 'pending' | 'approved' | 'rejected' | 'scheduled';
    reviewedAt: string | null;
    rejectionReason: string | null;
    moderator: User | null;
  }> {
    return this.get<{
      status: 'pending' | 'approved' | 'rejected' | 'scheduled';
      reviewedAt: string | null;
      rejectionReason: string | null;
      moderator: User | null;
    }>(`/api/works/${workId}/moderation-status`);
  }
  
  /**
   * 审核作品
   */
  async moderateWork(workId: number, data: {
    status: 'approved' | 'rejected';
    reason: string | null;
    featured?: boolean;
    tags?: string[];
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.post<{
      success: boolean;
      message: string;
    }, any>(`/api/works/${workId}/moderate`, data);
  }
  
  /**
   * 获取待审核作品列表
   */
  async getPendingModerationWorks(params?: {
    page?: number;
    limit?: number;
  }): Promise<Array<Work & {
    moderationStatus: 'pending' | 'approved' | 'rejected' | 'scheduled';
    moderator?: User;
    reviewedAt: string | null;
  }>> {
    return this.get<Array<Work & {
      moderationStatus: 'pending' | 'approved' | 'rejected' | 'scheduled';
      moderator?: User;
      reviewedAt: string | null;
    }>>('/api/moderation/pending', params);
  }
  
  /**
   * 发布作品到社群
   */
  async publishToCommunity(workId: number, data: {
    communityId: string;
    visibility: 'public' | 'community' | 'private';
    scheduledPublishDate: string | null;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    const result = await this.post<{
      success: boolean;
      message: string;
    }, any>(`/api/works/${workId}/publish/community`, data);
    void historyService.record('publish_work_community', { workId, ...data });
    return result;
  }
  
  /**
   * 获取社群作品列表
   */
  async getCommunityPosts(communityId: string, params?: {
    page?: number;
    limit?: number;
    sortBy: 'latest' | 'popular' | 'trending';
    category?: string;
    tag?: string;
  }): Promise<Array<Work & {
    communityId: string;
    commentCount: number;
    engagementRate: number;
  }>> {
    return this.get<Array<Work & {
      communityId: string;
      commentCount: number;
      engagementRate: number;
    }>>(`/api/communities/${communityId}/posts`, params);
  }
  
  /**
   * 获取用户加入的社群列表
   */
  async getUserCommunities(userId: string): Promise<Array<{
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    memberCount: number;
    postCount: number;
    isPublic: boolean;
    isMember: boolean;
  }>> {
    return this.get<Array<{
      id: string;
      name: string;
      description: string;
      thumbnail: string;
      memberCount: number;
      postCount: number;
      isPublic: boolean;
      isMember: boolean;
    }>>(`/api/users/${userId}/communities`);
  }
  
  /**
   * 获取发布统计数据
   */
  async getPublishStats(): Promise<{
    successRate: number;
    totalPublished: number;
    totalPending: number;
    totalRejected: number;
    byCategory: Array<{
      category: string;
      count: number;
    }>;
    byDate: Array<{
      date: string;
      count: number;
    }>;
  }> {
    return this.get<{
      successRate: number;
      totalPublished: number;
      totalPending: number;
      totalRejected: number;
      byCategory: Array<{
        category: string;
        count: number;
      }>;
      byDate: Array<{
        date: string;
        count: number;
      }>;
    }>('/api/stats/publish');
  }
  
  /**
   * 获取作品互动统计
   */
  async getEngagementStats(workId: number): Promise<{
    likes: number;
    comments: number;
    shares: number;
    views: number;
    downloads: number;
    engagementRate: number;
    bySource: Array<{
      source: string;
      count: number;
    }>;
    byDate: Array<{
      date: string;
      count: number;
    }>;
  }> {
    return this.get<{
      likes: number;
      comments: number;
      shares: number;
      views: number;
      downloads: number;
      engagementRate: number;
      bySource: Array<{
        source: string;
        count: number;
      }>;
      byDate: Array<{
        date: string;
        count: number;
      }>;
    }>(`/api/stats/engagement/${workId}`);
  }
}

// 用户服务
class UserService extends ApiService {
  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<User> {
    return this.get<User>('/api/users/me');
  }

  /**
   * 更新用户信息
   */
  async updateUser(user: Partial<User>): Promise<User> {
    return this.put<User, Partial<User>>('/api/auth/me', user);
  }

  /**
   * 获取用户作品
   */
  async getUserWorks(userId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<Work[]> {
    return this.get<Work[]>(`/api/users/${userId}/works`, params);
  }

  /**
   * 获取用户统计数据
   */
  async getUserStats(userId: string): Promise<{
    worksCount: number;
    followersCount: number;
    followingCount: number;
    favoritesCount: number;
  }> {
    return this.get<{
      worksCount: number;
      followersCount: number;
      followingCount: number;
      favoritesCount: number;
    }>(`/api/users/${userId}/stats`);
  }

  /**
   * 更新用户统计数据
   */
  async updateUserStats(userId: string, stats: {
    worksCount?: number;
    followersCount?: number;
    followingCount?: number;
    favoritesCount?: number;
  }): Promise<{
    worksCount: number;
    followersCount: number;
    followingCount: number;
    favoritesCount: number;
  }> {
    return this.put<{
      worksCount: number;
      followersCount: number;
      followingCount: number;
      favoritesCount: number;
    }, any>(`/api/users/${userId}/stats`, stats);
  }

  /**
   * 初始化用户统计数据
   */
  async initializeUserStats(userId: string): Promise<{
    worksCount: number;
    followersCount: number;
    followingCount: number;
    favoritesCount: number;
    isInitialized: boolean;
  }> {
    return this.post<{
      worksCount: number;
      followersCount: number;
      followingCount: number;
      favoritesCount: number;
      isInitialized: boolean;
    }, any>(`/api/users/${userId}/stats/initialize`, {});
  }
}

// 分类服务
class CategoryService extends ApiService {
  /**
   * 获取所有分类
   */
  async getCategories(): Promise<Array<{ id: number; name: string; count: number }>> {
    return this.get<Array<{ id: number; name: string; count: number }>>('/api/categories');
  }

  /**
   * 获取分类下的作品
   */
  async getWorksByCategory(category: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<Work[]> {
    return this.get<Work[]>(`/api/categories/${category}/works`, params);
  }
}

// 评论服务
class CommentService extends ApiService {
  /**
   * 获取作品评论
   */
  async getWorkComments(workId: number, params?: {
    page?: number;
    limit?: number;
  }): Promise<Array<{
    id: number;
    content: string;
    user: User;
    created_at: string;
  }>> {
    return this.get<Array<{
      id: number;
      content: string;
      user: User;
      created_at: string;
    }>>(`/api/works/${workId}/comments`, params);
  }

  /**
   * 添加作品评论
   */
  async addWorkComment(workId: number, content: string): Promise<{
    id: number;
    content: string;
    user: User;
    created_at: string;
  }> {
    const result = await this.post<{
      id: number;
      content: string;
      user: User;
      created_at: string;
    }, { content: string }>(`/api/works/${workId}/comments`, { content });
    void historyService.record('comment_work', { workId, content, commentId: result.id });
    return result;
  }
}

// 搜索服务
class SearchService extends ApiService {
  /**
   * 搜索作品
   */
  async searchWorks(query: string, params?: {
    page?: number;
    limit?: number;
    category?: string;
  }): Promise<Work[]> {
    return this.get<Work[]>('/api/search/works', { query, ...params });
  }

  /**
   * 搜索用户
   */
  async searchUsers(query: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<User[]> {
    return this.get<User[]>('/api/search/users', { query, ...params });
  }
}

// 社群服务
class CommunityService extends ApiService {
  /**
   * 获取所有社群列表
   */
  async getCommunities(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    avatar: string;
    memberCount: number;
    topic: string;
    isActive: boolean;
    isSpecial: boolean;
    creatorId?: string;
    createdAt?: string;
    updatedAt?: string;
    theme?: {
      primaryColor?: string;
      secondaryColor?: string;
      backgroundColor?: string;
      textColor?: string;
    };
    layoutType?: 'standard' | 'compact' | 'expanded';
    enabledModules?: {
      posts?: boolean;
      chat?: boolean;
      members?: boolean;
      announcements?: boolean;
    };
  }>> {
    return this.get<Array<{
      id: string;
      name: string;
      description: string;
      avatar: string;
      memberCount: number;
      topic: string;
      isActive: boolean;
      isSpecial: boolean;
      creatorId?: string;
      createdAt?: string;
      updatedAt?: string;
      theme?: {
        primaryColor?: string;
        secondaryColor?: string;
        backgroundColor?: string;
        textColor?: string;
      };
      layoutType?: 'standard' | 'compact' | 'expanded';
      enabledModules?: {
        posts?: boolean;
        chat?: boolean;
        members?: boolean;
        announcements?: boolean;
      };
    }>>('/api/communities');
  }

  /**
   * 获取用户加入的社群列表
   */
  async getUserCommunities(userId: string): Promise<Array<{
    id: string;
    name: string;
    description: string;
    avatar: string;
    memberCount: number;
    topic: string;
    isActive: boolean;
    isSpecial: boolean;
    theme?: {
      primaryColor?: string;
      secondaryColor?: string;
      backgroundColor?: string;
      textColor?: string;
    };
    layoutType?: 'standard' | 'compact' | 'expanded';
    enabledModules?: {
      posts?: boolean;
      chat?: boolean;
      members?: boolean;
      announcements?: boolean;
    };
  }>> {
    return this.get<Array<{
      id: string;
      name: string;
      description: string;
      avatar: string;
      memberCount: number;
      topic: string;
      isActive: boolean;
      isSpecial: boolean;
      theme?: {
        primaryColor?: string;
        secondaryColor?: string;
        backgroundColor?: string;
        textColor?: string;
      };
      layoutType?: 'standard' | 'compact' | 'expanded';
      enabledModules?: {
        posts?: boolean;
        chat?: boolean;
        members?: boolean;
        announcements?: boolean;
      };
    }>>(`/api/users/${userId}/communities`);
  }

  /**
   * 获取单个社群详情
   */
  async getCommunity(communityId: string): Promise<{
    id: string;
    name: string;
    description: string;
    avatar: string;
    memberCount: number;
    topic: string;
    isActive: boolean;
    isSpecial: boolean;
    theme?: {
      primaryColor?: string;
      secondaryColor?: string;
      backgroundColor?: string;
      textColor?: string;
    };
    layoutType?: 'standard' | 'compact' | 'expanded';
    enabledModules?: {
      posts?: boolean;
      chat?: boolean;
      members?: boolean;
      announcements?: boolean;
    };
  }> {
    return this.get<{
      id: string;
      name: string;
      description: string;
      avatar: string;
      memberCount: number;
      topic: string;
      isActive: boolean;
      isSpecial: boolean;
      theme?: {
        primaryColor?: string;
        secondaryColor?: string;
        backgroundColor?: string;
        textColor?: string;
      };
      layoutType?: 'standard' | 'compact' | 'expanded';
      enabledModules?: {
        posts?: boolean;
        chat?: boolean;
        members?: boolean;
        announcements?: boolean;
      };
    }>(`/api/communities/${communityId}`);
  }

  /**
   * 创建社群
   */
  async createCommunity(data: {
    name: string;
    description: string;
    tags: string[];
    theme?: {
      primaryColor?: string;
      secondaryColor?: string;
      backgroundColor?: string;
      textColor?: string;
    };
    layoutType?: 'standard' | 'compact' | 'expanded';
    enabledModules?: {
      posts?: boolean;
      chat?: boolean;
      members?: boolean;
      announcements?: boolean;
    };
    avatar?: string;
    coverImage?: string;
    bookmarks?: Array<{
      id: string;
      name: string;
      icon: string;
    }>;
    guidelines?: string[];
  }): Promise<{
    id: string;
    name: string;
    description: string;
    avatar: string;
    memberCount: number;
    topic: string;
    isActive: boolean;
    isSpecial: boolean;
  }> {
    return this.post<{
      id: string;
      name: string;
      description: string;
      avatar: string;
      memberCount: number;
      topic: string;
      isActive: boolean;
      isSpecial: boolean;
    }, any>('/api/communities', data);
  }

  /**
   * 加入社群
   */
  async joinCommunity(communityId: string): Promise<void> {
    await this.post<void, void>(`/api/communities/${communityId}/join`);
    void historyService.record('join_community', { communityId });
  }

  /**
   * 退出社群
   */
  async leaveCommunity(communityId: string): Promise<void> {
    return this.post<void, void>(`/api/communities/${communityId}/leave`);
  }

  /**
   * 创建帖子
   */
  async createThread(data: {
    title: string;
    content: string;
    topic: string;
    communityId: string;
    images?: Array<string>;
  }): Promise<{
    id: string;
    title: string;
    content: string;
    createdAt: number;
    author: {
      id: string;
      username: string;
      avatar: string;
    };
    comments?: Array<{
      id: string;
      content: string;
      createdAt: number;
      user: {
        id: string;
        username: string;
        avatar: string;
      };
    }>;
    upvotes: number;
    isUpvoted?: boolean;
    isFavorited?: boolean;
    topic: string;
  }> {
    return this.post<{
      id: string;
      title: string;
      content: string;
      createdAt: number;
      author: {
        id: string;
        username: string;
        avatar: string;
      };
      comments?: Array<{
        id: string;
        content: string;
        createdAt: number;
        user: {
          id: string;
          username: string;
          avatar: string;
        };
      }>;
      upvotes: number;
      isUpvoted?: boolean;
      isFavorited?: boolean;
      topic: string;
    }, any>(`/api/communities/${data.communityId}/threads`, data);
  }

  /**
   * 删除消息
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    return this.delete<void>(`/api/messages/${messageId}`, { userId });
  }

  /**
   * 添加消息反应
   */
  async addReaction(messageId: string, reaction: string, userId: string): Promise<void> {
    return this.post<void, any>(`/api/messages/${messageId}/reactions`, { reaction, userId });
  }

  /**
   * 回复消息
   */
  async replyToMessage(messageId: string, content: string, userId: string): Promise<void> {
    return this.post<void, any>(`/api/messages/${messageId}/replies`, { content, userId });
  }
}

// 导出单例实例
export const apiService = new ApiService();
export const workService = new WorkService();
export const userService = new UserService();
export const categoryService = new CategoryService();
export const commentService = new CommentService();
export const searchService = new SearchService();
export const communityService = new CommunityService();

// 事件服务
class EventService extends ApiService {
  /**
   * 创建活动
   */
  async createEvent(eventData: any): Promise<any> {
    return this.post<any, any>('/api/events', eventData);
  }

  /**
   * 更新活动
   */
  async updateEvent(eventId: string, eventData: any): Promise<any> {
    return this.put<any, any>(`/api/events/${eventId}`, eventData);
  }

  /**
   * 发布活动
   */
  async publishEvent(eventId: string, publishData?: any): Promise<any> {
    return this.post<any, any>(`/api/events/${eventId}/publish`, publishData || {});
  }

  /**
   * 发布活动到津脉平台
   */
  async publishToJinmaiPlatform(eventId: string, data: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    requirements: string;
    rewards: string;
    visibility: 'public' | 'private';
  }): Promise<{
    success: boolean;
    message: string;
    platformEventId: string;
  }> {
    return this.post<{
      success: boolean;
      message: string;
      platformEventId: string;
    }, any>(`/api/events/${eventId}/publish/jinmai`, data);
  }

  /**
   * 获取活动列表
   */
  async getEvents(params?: any): Promise<any[]> {
    return this.get<any[]>('/api/events', params);
  }

  /**
   * 获取活动详情
   */
  async getEvent(eventId: string): Promise<any> {
    return this.get<any>(`/api/events/${eventId}`);
  }

  /**
   * 获取用户创建的活动
   */
  async getUserEvents(userId: string, params?: any): Promise<any[]> {
    return this.get<any[]>(`/api/users/${userId}/events`, params);
  }

  /**
   * 用户注册参与活动
   */
  async registerForEvent(eventId: string, userId: string): Promise<{
    success: boolean;
    message: string;
    registrationId: string;
    status: 'pending' | 'approved' | 'rejected';
  }> {
    const result = await this.post<{
      success: boolean;
      message: string;
      registrationId: string;
      status: 'pending' | 'approved' | 'rejected';
    }, any>(`/api/events/${eventId}/register`, { userId });
    void historyService.record('register_event', { eventId, userId });
    return result;
  }

  /**
   * 提交作品到活动
   */
  async submitEventWork(eventId: string, data: {
    workId: string;
    userId: string;
    description: string;
  }): Promise<{
    success: boolean;
    message: string;
    submissionId: string;
    status: 'pending' | 'approved' | 'rejected';
  }> {
    const result = await this.post<{
      success: boolean;
      message: string;
      submissionId: string;
      status: 'pending' | 'approved' | 'rejected';
    }, any>(`/api/events/${eventId}/submit`, data);
    void historyService.record('submit_event_work', { eventId, ...data });
    return result;
  }

  /**
   * 获取活动参与者列表
   */
  async getEventParticipants(eventId: string, params?: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'approved' | 'rejected';
  }): Promise<Array<{
    userId: string;
    username: string;
    avatar: string;
    registrationDate: string;
    status: 'pending' | 'approved' | 'rejected';
    submissionCount: number;
  }>> {
    // 直接使用 Supabase 查询
    try {
      const { data: participants, error } = await supabase
        .from('event_participants')
        .select(`
          id,
          user_id,
          status,
          created_at
        `)
        .eq('event_id', eventId);
      
      if (error) {
        console.error('[getEventParticipants] Supabase error:', error);
        // 回退到 API 调用
        return this.get<Array<{
          userId: string;
          username: string;
          avatar: string;
          registrationDate: string;
          status: 'pending' | 'approved' | 'rejected';
          submissionCount: number;
        }>>(`/api/events/${eventId}/participants`, params);
      }
      
      // 获取用户信息
      const userIds = [...new Set((participants || []).map((p: any) => p.user_id))];
      const { data: users } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', userIds.length > 0 ? userIds : ['']);
      
      const userMap = new Map(users?.map((u: any) => [u.id, { username: u.username, avatar: u.avatar_url }]) || []);

      // 转换数据格式
      return (participants || []).map((p: any) => {
        const user = userMap.get(p.user_id);
        return {
          userId: p.user_id,
          username: user?.username || '未知用户',
          avatar: user?.avatar || '',
          registrationDate: new Date(p.created_at).toISOString(),
          status: p.status === 'completed' ? 'approved' : p.status,
          submissionCount: 0
        };
      });
    } catch (err) {
      console.error('[getEventParticipants] Error:', err);
      // 回退到 API 调用
      return this.get<Array<{
        userId: string;
        username: string;
        avatar: string;
        registrationDate: string;
        status: 'pending' | 'approved' | 'rejected';
        submissionCount: number;
      }>>(`/api/events/${eventId}/participants`, params);
    }
  }

  /**
   * 获取活动提交作品列表
   */
  async getEventSubmissions(eventId: string, params?: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'approved' | 'rejected';
  }): Promise<Array<{
    submissionId: string;
    workId: string;
    workTitle: string;
    workThumbnail: string;
    userId: string;
    username: string;
    submissionDate: string;
    status: 'pending' | 'approved' | 'rejected';
    score?: number;
  }>> {
    return this.get<Array<{
      submissionId: string;
      workId: string;
      workTitle: string;
      workThumbnail: string;
      userId: string;
      username: string;
      submissionDate: string;
      status: 'pending' | 'approved' | 'rejected';
      score?: number;
    }>>(`/api/events/${eventId}/submissions`, params);
  }

  /**
   * 审核活动参与者
   */
  async approveParticipant(eventId: string, registrationId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.post<{
      success: boolean;
      message: string;
    }, any>(`/api/events/${eventId}/participants/${registrationId}/approve`, {});
  }

  /**
   * 拒绝活动参与者
   */
  async rejectParticipant(eventId: string, registrationId: string, reason: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.post<{
      success: boolean;
      message: string;
    }, any>(`/api/events/${eventId}/participants/${registrationId}/reject`, { reason });
  }

  /**
   * 审核活动提交作品
   */
  async reviewSubmission(eventId: string, submissionId: string, data: {
    status: 'approved' | 'rejected';
    score?: number;
    feedback?: string;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.post<{
      success: boolean;
      message: string;
    }, any>(`/api/events/${eventId}/submissions/${submissionId}/review`, data);
  }

  /**
   * 获取活动统计数据
   */
  async getEventStats(eventId: string): Promise<{
    participantCount: number;
    submissionCount: number;
    approvedParticipants: number;
    approvedSubmissions: number;
    engagementRate: number;
    byDate: Array<{
      date: string;
      registrations: number;
      submissions: number;
    }>;
  }> {
    return this.get<{
      participantCount: number;
      submissionCount: number;
      approvedParticipants: number;
      approvedSubmissions: number;
      engagementRate: number;
      byDate: Array<{
        date: string;
        registrations: number;
        submissions: number;
      }>;
    }>(`/api/events/${eventId}/stats`);
  }

  /**
   * 同步活动数据
   */
  async syncEventData(eventId: string): Promise<{
    success: boolean;
    message: string;
    syncedAt: string;
  }> {
    return this.post<{
      success: boolean;
      message: string;
      syncedAt: string;
    }, any>(`/api/events/${eventId}/sync`, {});
  }
}

// 导出单例实例
export const eventService = new EventService();

// 导出服务类型
export type { ApiService, WorkService, UserService, CategoryService, CommentService, SearchService, CommunityService, EventService };
