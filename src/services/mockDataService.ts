import { Work } from '../mock/works';
import { User } from '../contexts/authContext';
import { originalWorks } from '../mock/works';
import { mockDataConfigManager, MockDataModule } from '../config/mockDataConfig';

// 模拟数据服务
class MockWorkService {
  private works: Work[];

  constructor() {
    this.works = [...originalWorks];
  }

  /**
   * 模拟网络延迟
   */
  private async simulateDelay(): Promise<void> {
    const config = mockDataConfigManager.getConfig();
    if (config.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, config.delay));
    }
  }

  /**
   * 模拟随机错误
   */
  private simulateRandomError(): void {
    const config = mockDataConfigManager.getConfig();
    if (Math.random() < config.errorRate) {
      throw new Error('模拟网络错误');
    }
  }

  /**
   * 检查模块是否启用
   */
  private isModuleEnabled(): boolean {
    const config = mockDataConfigManager.getConfig();
    return config.enabled && config.modules[MockDataModule.WORKS].enabled;
  }

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
    await this.simulateDelay();
    this.simulateRandomError();

    let filteredWorks = [...this.works];

    // 按分类过滤
    if (params?.category) {
      filteredWorks = filteredWorks.filter(work => work.category === params.category);
    }

    // 按标签过滤
    if (params?.tags && params.tags.length > 0) {
      filteredWorks = filteredWorks.filter(work => 
        params.tags?.some(tag => work.tags.includes(tag))
      );
    }

    // 按精选状态过滤
    if (params?.featured !== undefined) {
      filteredWorks = filteredWorks.filter(work => work.featured === params.featured);
    }

    // 分页
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return filteredWorks.slice(startIndex, endIndex);
  }

  /**
   * 获取作品详情
   */
  async getWorkById(id: number): Promise<Work> {
    await this.simulateDelay();
    this.simulateRandomError();

    const work = this.works.find(work => work.id === id);
    if (!work) {
      throw new Error('作品不存在');
    }
    return work;
  }

  /**
   * 创建作品
   */
  async createWork(work: Omit<Work, 'id'>): Promise<Work> {
    await this.simulateDelay();
    this.simulateRandomError();

    const newId = Math.max(...this.works.map(work => work.id)) + 1;
    const newWork: Work = {
      ...work,
      id: newId
    };
    this.works.unshift(newWork);
    return newWork;
  }

  /**
   * 更新作品
   */
  async updateWork(id: number, updates: Partial<Work>): Promise<Work> {
    await this.simulateDelay();
    this.simulateRandomError();

    const index = this.works.findIndex(work => work.id === id);
    if (index === -1) {
      throw new Error('作品不存在');
    }

    this.works[index] = {
      ...this.works[index],
      ...updates
    };
    return this.works[index];
  }

  /**
   * 删除作品
   */
  async deleteWork(id: number): Promise<void> {
    await this.simulateDelay();
    this.simulateRandomError();

    const index = this.works.findIndex(work => work.id === id);
    if (index === -1) {
      throw new Error('作品不存在');
    }
    this.works.splice(index, 1);
  }

  /**
   * 点赞作品
   */
  async likeWork(id: number): Promise<void> {
    await this.simulateDelay();
    this.simulateRandomError();

    const work = this.works.find(work => work.id === id);
    if (!work) {
      throw new Error('作品不存在');
    }
    work.likes += 1;
  }

  /**
   * 取消点赞作品
   */
  async unlikeWork(id: number): Promise<void> {
    await this.simulateDelay();
    this.simulateRandomError();

    const work = this.works.find(work => work.id === id);
    if (!work) {
      throw new Error('作品不存在');
    }
    if (work.likes > 0) {
      work.likes -= 1;
    }
  }

  /**
   * 获取作品总数
   */
  async getTotalWorks(params?: {
    category?: string;
    tags?: string[];
    featured?: boolean;
  }): Promise<number> {
    await this.simulateDelay();
    this.simulateRandomError();

    let filteredWorks = [...this.works];

    // 按分类过滤
    if (params?.category) {
      filteredWorks = filteredWorks.filter(work => work.category === params.category);
    }

    // 按标签过滤
    if (params?.tags && params.tags.length > 0) {
      filteredWorks = filteredWorks.filter(work => 
        params.tags?.some(tag => work.tags.includes(tag))
      );
    }

    // 按精选状态过滤
    if (params?.featured !== undefined) {
      filteredWorks = filteredWorks.filter(work => work.featured === params.featured);
    }

    return filteredWorks.length;
  }
}

// 模拟用户服务
class MockUserService {
  private users: User[];

  constructor() {
    this.users = [
      {
        id: '1',
        username: '设计师小明',
        email: 'xiaoming@example.com',
        avatar_url: 'https://picsum.photos/100/100?random=1',
        bio: '热爱设计，专注国潮文化',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        role: 'user',
        is_active: true
      },
      {
        id: '2',
        username: '创意总监小李',
        email: 'xiaoli@example.com',
        avatar_url: 'https://picsum.photos/100/100?random=2',
        bio: '10年设计经验，擅长品牌设计',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        role: 'admin',
        is_active: true
      }
    ];
  }

  /**
   * 模拟网络延迟
   */
  private async simulateDelay(): Promise<void> {
    const config = mockDataConfigManager.getConfig();
    if (config.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, config.delay));
    }
  }

  /**
   * 模拟随机错误
   */
  private simulateRandomError(): void {
    const config = mockDataConfigManager.getConfig();
    if (Math.random() < config.errorRate) {
      throw new Error('模拟网络错误');
    }
  }

  /**
   * 检查模块是否启用
   */
  private isModuleEnabled(): boolean {
    const config = mockDataConfigManager.getConfig();
    return config.enabled && config.modules[MockDataModule.USERS].enabled;
  }

  /**
   * 获取用户列表
   */
  async getUsers(params?: {
    page?: number;
    limit?: number;
  }): Promise<User[]> {
    await this.simulateDelay();
    this.simulateRandomError();

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return this.users.slice(startIndex, endIndex);
  }

  /**
   * 获取用户详情
   */
  async getUserById(id: string): Promise<User> {
    await this.simulateDelay();
    this.simulateRandomError();

    const user = this.users.find(user => user.id === id);
    if (!user) {
      throw new Error('用户不存在');
    }
    return user;
  }
}

// 模拟分类服务
class MockCategoryService {
  private categories: Array<{ id: number; name: string; count: number }>;

  constructor() {
    this.categories = [
      { id: 1, name: '国潮设计', count: 20 },
      { id: 2, name: '纹样设计', count: 15 },
      { id: 3, name: '品牌设计', count: 12 },
      { id: 4, name: '非遗传承', count: 8 },
      { id: 5, name: '插画设计', count: 25 },
      { id: 6, name: '工艺创新', count: 10 },
      { id: 7, name: '老字号品牌', count: 7 },
      { id: 8, name: 'IP设计', count: 18 },
      { id: 9, name: '包装设计', count: 14 },
      { id: 10, name: '字体设计', count: 9 }
    ];
  }

  /**
   * 模拟网络延迟
   */
  private async simulateDelay(): Promise<void> {
    const config = mockDataConfigManager.getConfig();
    if (config.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, config.delay));
    }
  }

  /**
   * 模拟随机错误
   */
  private simulateRandomError(): void {
    const config = mockDataConfigManager.getConfig();
    if (Math.random() < config.errorRate) {
      throw new Error('模拟网络错误');
    }
  }

  /**
   * 检查模块是否启用
   */
  private isModuleEnabled(): boolean {
    const config = mockDataConfigManager.getConfig();
    return config.enabled && config.modules[MockDataModule.CATEGORIES].enabled;
  }

  /**
   * 获取所有分类
   */
  async getCategories(): Promise<Array<{ id: number; name: string; count: number }>> {
    await this.simulateDelay();
    this.simulateRandomError();
    return [...this.categories];
  }
}

// 导出单例实例
export const mockWorkService = new MockWorkService();
export const mockUserService = new MockUserService();
export const mockCategoryService = new MockCategoryService();

// 导出服务类型
export type { MockWorkService, MockUserService, MockCategoryService };
