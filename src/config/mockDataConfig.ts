// 注意：模拟数据配置已禁用，系统现在使用真实数据API
// 此文件保留配置结构但禁用所有模拟数据功能

/**
 * 模拟数据模块枚举
 */
export enum MockDataModule {
  WORKS = 'works',
  USERS = 'users',
  CATEGORIES = 'categories',
  COMMENTS = 'comments',
  LIKES = 'likes',
  POSTS = 'posts'
}

/**
 * 模拟数据配置接口
 */
export interface MockDataConfig {
  enabled: boolean;
  modules: Record<MockDataModule, ModuleMockConfig>;
  delay: number;
  errorRate: number;
  verbose: boolean;
}

/**
 * 模块模拟数据配置接口
 */
export interface ModuleMockConfig {
  enabled: boolean;
  generationRules: {
    count: number;
    allowDuplicates: boolean;
    updateFrequency: number;
  };
}

/**
 * 默认模拟数据配置 - 已禁用所有模拟数据
 */
export const defaultMockDataConfig: MockDataConfig = {
  enabled: false, // 已禁用
  modules: {
    [MockDataModule.WORKS]: {
      enabled: false, // 已禁用
      generationRules: {
        count: 0,
        allowDuplicates: false,
        updateFrequency: 0
      }
    },
    [MockDataModule.USERS]: {
      enabled: false, // 已禁用
      generationRules: {
        count: 0,
        allowDuplicates: false,
        updateFrequency: 0
      }
    },
    [MockDataModule.CATEGORIES]: {
      enabled: false, // 已禁用
      generationRules: {
        count: 0,
        allowDuplicates: false,
        updateFrequency: 0
      }
    },
    [MockDataModule.COMMENTS]: {
      enabled: false, // 已禁用
      generationRules: {
        count: 0,
        allowDuplicates: false,
        updateFrequency: 0
      }
    },
    [MockDataModule.LIKES]: {
      enabled: false, // 已禁用
      generationRules: {
        count: 0,
        allowDuplicates: false,
        updateFrequency: 0
      }
    },
    [MockDataModule.POSTS]: {
      enabled: false, // 已禁用
      generationRules: {
        count: 0,
        allowDuplicates: false,
        updateFrequency: 0
      }
    }
  },
  delay: 0,
  errorRate: 0,
  verbose: false
};

/**
 * 模拟数据配置管理器 - 已禁用功能
 */
export class MockDataConfigManager {
  private config: MockDataConfig;
  private static instance: MockDataConfigManager;

  private constructor() {
    this.config = { ...defaultMockDataConfig };
  }

  static getInstance(): MockDataConfigManager {
    if (!MockDataConfigManager.instance) {
      MockDataConfigManager.instance = new MockDataConfigManager();
    }
    return MockDataConfigManager.instance;
  }

  getConfig(): MockDataConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<MockDataConfig>): void {
    console.warn('MockDataConfigManager: 模拟数据已禁用，无法更新配置');
  }

  updateModuleConfig(module: MockDataModule, config: Partial<ModuleMockConfig>): void {
    console.warn('MockDataConfigManager: 模拟数据已禁用，无法更新模块配置');
  }

  toggleEnabled(enabled: boolean): void {
    console.warn('MockDataConfigManager: 模拟数据已禁用，无法切换开关');
  }

  toggleModuleEnabled(module: MockDataModule, enabled: boolean): void {
    console.warn('MockDataConfigManager: 模拟数据已禁用，无法切换模块开关');
  }

  resetToDefaults(): void {
    this.config = { ...defaultMockDataConfig };
    console.warn('MockDataConfigManager: 配置已重置为默认值（模拟数据已禁用）');
  }
}

// 导出单例实例
export const mockDataConfigManager = MockDataConfigManager.getInstance();
