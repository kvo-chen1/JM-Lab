/**
 * Skill 抽象基类
 */

import {
  SkillCategory
} from '../../types/skill';
import type {
  ISkill,
  SkillMetadata,
  Capability,
  UserIntent,
  ExecutionContext,
  SkillResult
} from '../../types/skill';

export interface BaseSkillConfig {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  enabled?: boolean;
}

export abstract class BaseSkill implements ISkill {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly category: SkillCategory;
  abstract readonly capabilities: Capability[];

  readonly version: string = '1.0.0';
  protected config: BaseSkillConfig;
  protected supportedAgents: string[] = [];

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

  abstract canHandle(intent: UserIntent): boolean;
  protected abstract doExecute(context: ExecutionContext): Promise<SkillResult>;

  async initialize(config?: Record<string, any>): Promise<void> {
    if (this.initialized) return;
    this.config = { ...this.config, ...config };
    await this.onInitialize();
    this.initialized = true;
  }

  async destroy(): Promise<void> {
    if (!this.initialized) return;
    await this.onDestroy();
    this.initialized = false;
  }

  validateInput(input: Record<string, any>): boolean {
    for (const capability of this.capabilities) {
      if (capability.parameters) {
        for (const param of capability.parameters) {
          if (param.required && input[param.name] === undefined) {
            console.warn(`[BaseSkill] Missing required parameter: ${param.name}`);
            return false;
          }
        }
      }
    }
    return true;
  }

  async execute(context: ExecutionContext): Promise<SkillResult> {
    if (!this.config.enabled) {
      return this.createErrorResult('Skill is disabled', false);
    }

    if (!this.initialized) {
      await this.initialize();
    }

    if (context.parameters && !this.validateInput(context.parameters)) {
      return this.createErrorResult('Invalid input parameters', false);
    }

    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= (this.config.maxRetries || 0); attempt++) {
      try {
        const result = await this.executeWithTimeout(context);
        this.executionCount++;
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < (this.config.maxRetries || 0)) {
          await this.delay(this.config.retryDelay || 1000);
        }
      }
    }

    return this.createErrorResult(
      lastError?.message || 'Execution failed after retries',
      true,
      lastError
    );
  }

  private async executeWithTimeout(context: ExecutionContext): Promise<SkillResult> {
    const timeout = this.config.timeout || 30000;
    return Promise.race([
      this.doExecute(context),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Execution timeout after ${timeout}ms`)), timeout);
      })
    ]);
  }

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

  protected createSuccessResult(
    content: string,
    type: SkillResult['type'] = 'text',
    metadata?: Record<string, any>
  ): SkillResult {
    return { success: true, content, type, metadata };
  }

  protected createErrorResult(
    message: string,
    retryable: boolean = true,
    originalError?: Error | null
  ): SkillResult {
    return {
      success: false,
      content: '',
      type: 'text',
      error: { code: 'SKILL_EXECUTION_ERROR', message, retryable },
      metadata: originalError ? { originalError: originalError.message } : undefined
    };
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected onInitialize(): Promise<void> { return Promise.resolve(); }
  protected onDestroy(): Promise<void> { return Promise.resolve(); }

  get isInitialized(): boolean { return this.initialized; }
  get isEnabled(): boolean { return this.config.enabled ?? true; }
}

export abstract class CreationSkill extends BaseSkill {
  readonly category = SkillCategory.CREATION;
}

export abstract class AnalysisSkill extends BaseSkill {
  readonly category = SkillCategory.ANALYSIS;
}
