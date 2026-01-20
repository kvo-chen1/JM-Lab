import apiClient from '../lib/apiClient';
import { Work } from '../mock/works';
import { User } from '../contexts/authContext';
import { validationService } from './validationService';

// 统一API服务层
class ApiService {
  private baseUrl: string;
  private useMockData: boolean;

  constructor() {
    this.baseUrl = '';
    const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development';
    const useMock = typeof process !== 'undefined' && process.env && process.env.USE_MOCK_DATA !== 'false';
    this.useMockData = isDev && useMock;
  }

  /**
   * 设置基础URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * 切换是否使用模拟数据
   */
  setUseMockData(useMock: boolean): void {
    this.useMockData = useMock;
  }

  /**
   * 获取当前是否使用模拟数据
   */
  getUseMockData(): boolean {
    return this.useMockData;
  }

  /**
   * 通用GET请求
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = this.buildUrl(endpoint, params);
    const response = await apiClient.get<T>(url);
    if (!response.ok) {
      throw new Error(response.error || '请求失败');
    }
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
    if (this.getUseMockData()) {
      // 从模拟数据服务获取
      const { mockWorkService } = await import('./mockDataService');
      return mockWorkService.getWorks(params);
    }
    return this.get<Work[]>('/api/works', params);
  }

  /**
   * 获取作品详情
   */
  async getWorkById(id: number): Promise<Work> {
    if (this.getUseMockData()) {
      // 从模拟数据服务获取
      const { mockWorkService } = await import('./mockDataService');
      return mockWorkService.getWorkById(id);
    }
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
    return this.post<Work, Omit<Work, 'id'>>('/api/works', work);
  }

  /**
   * 更新作品
   */
  async updateWork(id: number, work: Partial<Work>): Promise<Work> {
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
  async deleteWork(id: number): Promise<void> {
    return this.delete<void>(`/api/works/${id}`);
  }

  /**
   * 点赞作品
   */
  async likeWork(id: number): Promise<void> {
    return this.post<void, void>(`/api/works/${id}/like`);
  }

  /**
   * 取消点赞作品
   */
  async unlikeWork(id: number): Promise<void> {
    return this.post<void, void>(`/api/works/${id}/unlike`);
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
    return this.put<User, Partial<User>>('/api/users/me', user);
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
    return this.post<{
      id: number;
      content: string;
      user: User;
      created_at: string;
    }, { content: string }>(`/api/works/${workId}/comments`, { content });
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

// 导出单例实例
export const apiService = new ApiService();
export const workService = new WorkService();
export const userService = new UserService();
export const categoryService = new CategoryService();
export const commentService = new CommentService();
export const searchService = new SearchService();

// 导出服务类型
export type { ApiService, WorkService, UserService, CategoryService, CommentService, SearchService };
