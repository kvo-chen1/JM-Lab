/**
 * Skill 抽象基类
 * 所有 Skill 的基类，提供通用实现
 */

import {
  ISkill,
  SkillMetadata,
  SkillCategory,
  Capability,
  UserIntent,
  ExecutionContext,
  SkillResult,
  AgentType,
  SkillResultType
} from '../../types/skill';

export interface BaseSkillConfig {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  enabled?: boolean;
}

export abstract class BaseSkill implements ISkill {
  // 抽象属性 - 子类必须实现
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly category: SkillCategory;
  abstract readonly capabilities: Capability[];

  // 可配置属性
  readonly version: string = '1.0.0';
  protected config: BaseSkillConfig;
  protected supportedAgents: AgentType[] = [];

  // 内部状态
  private initialized: boolean = false;
  private executionCount: number = 0;

  constructor(config: BaseSkillConfig = {}) {
    this.config = {
      timeout: 30000,
      maxRetries: 2,
      retryDelay: 1000,
      enabled: true,
      ...config
    };
  }

  // ==================== 抽象方法 - 子类必须实现 ====================

  /**
   * 检查是否可以处理该意图
   */
  abstract canHandle(intent: UserIntent): boolean;

  /**
   * 执行 Skill 的核心逻辑
   */
  protected abstract doExecute(context: ExecutionContext): Promise<SkillResult>;

  // ==================== 可选重写方法 ====================

  /**
   * 初始化 Skill
   */
  async initialize(config?: Record<string, any>): Promise<void> {
    if (this.initialized) return;

    this.config = { ...this.config, ...config };

    // 子类可以重写此方法进行自定义初始化
    await this.onInitialize();

    this.initialized = true;
    console.log(`[BaseSkill] Initialized: ${this.id}`);
  }

  /**
   * 销毁 Skill
   */
  async destroy(): Promise<void> {
    if (!this.initialized) return;

    // 子类可以重写此方法进行自定义清理
    await this.onDestroy();

    this.initialized = false;
    console.log(`[BaseSkill] Destroyed: ${this.id}`);
  }

  /**
   * 验证输入参数
   * 检查是否至少有一个 capability 的所有必填参数都满足
   */
  validateInput(input: Record<string, any>): boolean {
    // 检查是否有至少一个 capability 的参数全部满足
    for (const capability of this.capabilities) {
      if (!capability.parameters) {
        continue;
      }
      
      let allParamsSatisfied = true;
      for (const param of capability.parameters) {
        if (param.required && input[param.name] === undefined) {
          allParamsSatisfied = false;
          break;
        }
      }
      
      // 如果有一个 capability 的参数全部满足，则验证通过
      if (allParamsSatisfied) {
        return true;
      }
    }
    
    // 所有 capability 都有缺失的必填参数
    console.warn(`[BaseSkill] Missing required parameters for all capabilities`);
    return false;
  }

  // ==================== 核心执行逻辑 ====================

  /**
   * 执行 Skill（带错误处理和重试）
   */
  async execute(context: ExecutionContext): Promise<SkillResult> {
    if (!this.config.enabled) {
      return this.createErrorResult('Skill is disabled', false);
    }

    if (!this.initialized) {
      await this.initialize();
    }

    // 验证输入
    if (context.parameters && !this.validateInput(context.parameters)) {
      return this.createErrorResult('Invalid input parameters', false);
    }

    const startTime = Date.now();
    let lastError: Error | null = null;

    // 重试逻辑
    for (let attempt = 0; attempt <= (this.config.maxRetries || 0); attempt++) {
      try {
        // 超时控制
        const result = await this.executeWithTimeout(context);

        this.executionCount++;
        const executionTime = Date.now() - startTime;

        console.log(`[BaseSkill] Executed: ${this.id} (${executionTime}ms)`);

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`[BaseSkill] Execution attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < (this.config.maxRetries || 0)) {
          await this.delay(this.config.retryDelay || 1000);
        }
      }
    }

    // 所有重试都失败
    return this.createErrorResult(
      lastError?.message || 'Execution failed after retries',
      true,
      lastError
    );
  }

  /**
   * 带超时的执行
   */
  private async executeWithTimeout(context: ExecutionContext): Promise<SkillResult> {
    const timeout = this.config.timeout || 30000;

    return Promise.race([
      this.doExecute(context),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Execution timeout after ${timeout}ms`)), timeout);
      })
    ]);
  }

  // ==================== 辅助方法 ====================

  /**
   * 获取 Skill 元数据
   */
  getMetadata(): SkillMetadata {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      version: this.version,
      capabilities: this.capabilities,
      supportedAgents: this.supportedAgents,
      configSchema: this.getConfigSchema()
    };
  }

  /**
   * 获取配置 Schema
   */
  protected getConfigSchema(): Record<string, any> {
    return {
      type: 'object',
      properties: {
        timeout: { type: 'number', default: 30000 },
        maxRetries: { type: 'number', default: 2 },
        retryDelay: { type: 'number', default: 1000 },
        enabled: { type: 'boolean', default: true }
      }
    };
  }

  /**
   * 创建成功结果
   */
  protected createSuccessResult(
    content: string,
    type: SkillResultType = 'text',
    metadata?: Record<string, any>
  ): SkillResult {
    return {
      success: true,
      content,
      type,
      metadata
    };
  }

  /**
   * 创建错误结果
   */
  protected createErrorResult(
    message: string,
    retryable: boolean = true,
    originalError?: Error | null
  ): SkillResult {
    return {
      success: false,
      content: '',
      type: 'text',
      error: {
        code: 'SKILL_EXECUTION_ERROR',
        message,
        retryable
      },
      metadata: originalError ? { originalError: originalError.message } : undefined
    };
  }

  /**
   * 延迟
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 提取关键词
   */
  protected extractKeywords(text: string): string[] {
    // 简单的中文分词
    const words = text.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [];
    return words.map(w => w.toLowerCase());
  }

  /**
   * 检查文本是否包含关键词
   */
  protected containsKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some(kw => lowerText.includes(kw.toLowerCase()));
  }

  // ==================== 生命周期钩子 ====================

  /**
   * 初始化钩子 - 子类可重写
   */
  protected async onInitialize(): Promise<void> {
    // 默认空实现
  }

  /**
   * 销毁钩子 - 子类可重写
   */
  protected async onDestroy(): Promise<void> {
    // 默认空实现
  }

  // ==================== Getter ====================

  get isInitialized(): boolean {
    return this.initialized;
  }

  get isEnabled(): boolean {
    return this.config.enabled ?? true;
  }

  get executionStats(): { count: number; avgTime: number } {
    return {
      count: this.executionCount,
      avgTime: 0 // 可以扩展记录平均执行时间
    };
  }
}

// ==================== 分类基类 ====================

/**
 * 创作类 Skill 基类
 */
export abstract class CreationSkill extends BaseSkill {
  readonly category = SkillCategory.CREATION;

  protected createOutputResult(
    content: string,
    outputType: 'image' | 'video' | 'text' | 'audio',
    metadata?: Record<string, any>
  ): SkillResult {
    return this.createSuccessResult(content, outputType, metadata);
  }
}

/**
 * 分析类 Skill 基类
 */
export abstract class AnalysisSkill extends BaseSkill {
  readonly category = SkillCategory.ANALYSIS;

  protected createAnalysisResult(
    analysis: Record<string, any>,
    confidence: number
  ): SkillResult {
    return this.createSuccessResult(
      JSON.stringify(analysis),
      'structured',
      { analysis, confidence }
    );
  }
}

/**
 * 认知类 Skill 基类
 */
export abstract class CognitionSkill extends BaseSkill {
  readonly category = SkillCategory.COGNITION;
}

/**
 * 编排类 Skill 基类
 */
export abstract class OrchestrationSkill extends BaseSkill {
  readonly category = SkillCategory.ORCHESTRATION;
}

/**
 * 增强类 Skill 基类
 */
export abstract class EnhancementSkill extends BaseSkill {
  readonly category = SkillCategory.ENHANCEMENT;
}
