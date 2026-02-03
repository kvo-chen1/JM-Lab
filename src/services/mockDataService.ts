import { Work } from '../mock/works';
import { User } from '../contexts/authContext';
import { mockDataConfigManager, MockDataModule } from '../config/mockDataConfig';

// 注意：模拟数据服务已禁用，系统现在使用真实数据API
// 此文件保留服务结构但禁用所有模拟数据功能

class MockWorkService {
  private works: Work[] = [];

  constructor() {
    console.warn('MockWorkService: 模拟数据已禁用，请使用真实数据API');
  }

  private async simulateDelay(): Promise<void> {
    // 模拟数据已禁用，不执行延迟
  }

  private simulateRandomError(): void {
    // 模拟数据已禁用，不执行错误模拟
  }

  private isModuleEnabled(): boolean {
    return false; // 始终返回false，禁用模拟数据
  }

  async getWorks(params?: {
    page?: number;
    limit?: number;
    category?: string;
    tags?: string[];
    featured?: boolean;
  }): Promise<Work[]> {
    console.warn('MockWorkService.getWorks: 模拟数据已禁用，请使用真实数据API');
    return [];
  }

  async getWorkById(id: number): Promise<Work> {
    console.warn('MockWorkService.getWorkById: 模拟数据已禁用，请使用真实数据API');
    throw new Error('模拟数据已禁用，请使用真实数据API');
  }

  async createWork(work: Omit<Work, 'id'>): Promise<Work> {
    console.warn('MockWorkService.createWork: 模拟数据已禁用，请使用真实数据API');
    throw new Error('模拟数据已禁用，请使用真实数据API');
  }

  async updateWork(id: number, updates: Partial<Work>): Promise<Work> {
    console.warn('MockWorkService.updateWork: 模拟数据已禁用，请使用真实数据API');
    throw new Error('模拟数据已禁用，请使用真实数据API');
  }

  async deleteWork(id: number): Promise<void> {
    console.warn('MockWorkService.deleteWork: 模拟数据已禁用，请使用真实数据API');
    throw new Error('模拟数据已禁用，请使用真实数据API');
  }

  async likeWork(id: number): Promise<void> {
    console.warn('MockWorkService.likeWork: 模拟数据已禁用，请使用真实数据API');
    throw new Error('模拟数据已禁用，请使用真实数据API');
  }

  async unlikeWork(id: number): Promise<void> {
    console.warn('MockWorkService.unlikeWork: 模拟数据已禁用，请使用真实数据API');
    throw new Error('模拟数据已禁用，请使用真实数据API');
  }

  async getTotalWorks(params?: {
    category?: string;
    tags?: string[];
    featured?: boolean;
  }): Promise<number> {
    console.warn('MockWorkService.getTotalWorks: 模拟数据已禁用，请使用真实数据API');
    return 0;
  }
}

class MockUserService {
  private users: User[] = [];

  constructor() {
    console.warn('MockUserService: 模拟数据已禁用，请使用真实数据API');
  }

  private async simulateDelay(): Promise<void> {
    // 模拟数据已禁用，不执行延迟
  }

  private simulateRandomError(): void {
    // 模拟数据已禁用，不执行错误模拟
  }

  private isModuleEnabled(): boolean {
    return false; // 始终返回false，禁用模拟数据
  }

  async getUsers(params?: {
    page?: number;
    limit?: number;
  }): Promise<User[]> {
    console.warn('MockUserService.getUsers: 模拟数据已禁用，请使用真实数据API');
    return [];
  }

  async getUserById(id: string): Promise<User> {
    console.warn('MockUserService.getUserById: 模拟数据已禁用，请使用真实数据API');
    throw new Error('模拟数据已禁用，请使用真实数据API');
  }
}

class MockCategoryService {
  private categories: Array<{ id: number; name: string; count: number }> = [];

  constructor() {
    console.warn('MockCategoryService: 模拟数据已禁用，请使用真实数据API');
  }

  private async simulateDelay(): Promise<void> {
    // 模拟数据已禁用，不执行延迟
  }

  private simulateRandomError(): void {
    // 模拟数据已禁用，不执行错误模拟
  }

  private isModuleEnabled(): boolean {
    return false; // 始终返回false，禁用模拟数据
  }

  async getCategories(): Promise<Array<{ id: number; name: string; count: number }>> {
    console.warn('MockCategoryService.getCategories: 模拟数据已禁用，请使用真实数据API');
    return [];
  }
}

// 导出单例实例
export const mockWorkService = new MockWorkService();
export const mockUserService = new MockUserService();
export const mockCategoryService = new MockCategoryService();

// 导出服务类型
export type { MockWorkService, MockUserService, MockCategoryService };
