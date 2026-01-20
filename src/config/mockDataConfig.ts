// 模拟数据配置

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
  /**
   * 是否全局启用模拟数据
   */
  enabled: boolean;
  
  /**
   * 各模块的模拟数据配置
   */
  modules: Record<MockDataModule, ModuleMockConfig>;
  
  /**
   * 模拟网络延迟（毫秒）
   */
  delay: number;
  
  /**
   * 模拟错误率（0-1）
   */
  errorRate: number;
  
  /**
   * 是否记录详细日志
   */
  verbose: boolean;
}

/**
 * 模块模拟数据配置接口
 */
export interface ModuleMockConfig {
  /**
   * 是否启用该模块的模拟数据
   */
  enabled: boolean;
  
  /**
   * 模拟数据生成规则
   */
  generationRules: {
    /**
     * 生成数据的数量
     */
    count: number;
    
    /**
     * 是否允许重复数据
     */
    allowDuplicates: boolean;
    
    /**
     * 数据更新频率（毫秒）
     */
    updateFrequency: number;
  };
}

/**
 * 默认模拟数据配置
 */
export const defaultMockDataConfig: MockDataConfig = {
  enabled: typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development',
  modules: {
    [MockDataModule.WORKS]: {
      enabled: true,
      generationRules: {
        count: 100,
        allowDuplicates: false,
        updateFrequency: 300000 // 5分钟更新一次
      }
    },
    [MockDataModule.USERS]: {
      enabled: true,
      generationRules: {
        count: 20,
        allowDuplicates: false,
        updateFrequency: 600000 // 10分钟更新一次
      }
    },
    [MockDataModule.CATEGORIES]: {
      enabled: true,
      generationRules: {
        count: 10,
        allowDuplicates: false,
        updateFrequency: 1800000 // 30分钟更新一次
      }
    },
    [MockDataModule.COMMENTS]: {
      enabled: true,
      generationRules: {
        count: 500,
        allowDuplicates: false,
        updateFrequency: 120000 // 2分钟更新一次
      }
    },
    [MockDataModule.LIKES]: {
      enabled: true,
      generationRules: {
        count: 1000,
        allowDuplicates: false,
        updateFrequency: 60000 // 1分钟更新一次
      }
    },
    [MockDataModule.POSTS]: {
      enabled: true,
      generationRules: {
        count: 150,
        allowDuplicates: false,
        updateFrequency: 180000 // 3分钟更新一次
      }
    }
  },
  delay: 300,
  errorRate: 0.05,
  verbose: false
};

/**
 * 模拟数据配置管理器
 */
export class MockDataConfigManager {
  private config: MockDataConfig;
  private static instance: MockDataConfigManager;

  private constructor() {
    this.config = { ...defaultMockDataConfig };
    this.loadFromLocalStorage();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): MockDataConfigManager {
    if (!MockDataConfigManager.instance) {
      MockDataConfigManager.instance = new MockDataConfigManager();
    }
    return MockDataConfigManager.instance;
  }

  /**
   * 获取当前配置
   */
  getConfig(): MockDataConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<MockDataConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveToLocalStorage();
  }

  /**
   * 更新模块配置
   */
  updateModuleConfig(module: MockDataModule, config: Partial<ModuleMockConfig>): void {
    this.config.modules[module] = {
      ...this.config.modules[module],
      ...config
    };
    this.saveToLocalStorage();
  }

  /**
   * 切换模拟数据全局开关
   */
  toggleEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveToLocalStorage();
  }

  /**
   * 切换模块模拟数据开关
   */
  toggleModuleEnabled(module: MockDataModule, enabled: boolean): void {
    this.config.modules[module].enabled = enabled;
    this.saveToLocalStorage();
  }

  /**
   * 从本地存储加载配置
   */
  private loadFromLocalStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const storedConfig = localStorage.getItem('mockDataConfig');
        if (storedConfig) {
          this.config = { ...this.config, ...JSON.parse(storedConfig) };
        }
      } catch (error) {
        console.error('Failed to load mock data config from localStorage:', error);
      }
    }
  }

  /**
   * 保存配置到本地存储
   */
  private saveToLocalStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mockDataConfig', JSON.stringify(this.config));
      } catch (error) {
        console.error('Failed to save mock data config to localStorage:', error);
      }
    }
  }

  /**
   * 重置配置到默认值
   */
  resetToDefaults(): void {
    this.config = { ...defaultMockDataConfig };
    this.saveToLocalStorage();
  }
}

// 导出单例实例
export const mockDataConfigManager = MockDataConfigManager.getInstance();
