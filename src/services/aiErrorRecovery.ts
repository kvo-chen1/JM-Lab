/**
 * AI智能错误恢复服务
 * 实现智能错误检测、诊断、恢复策略
 */

// 错误类型
export type AIErrorType =
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'API_ERROR'
  | 'VALIDATION_ERROR'
  | 'CONTEXT_OVERFLOW'
  | 'RATE_LIMIT_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'UNKNOWN_ERROR';

// 错误信息
export interface AIError {
  type: AIErrorType;
  message: string;
  code?: string;
  timestamp: number;
  context?: Record<string, any>;
  recoverable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// 恢复策略
export interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;
  applicableErrors: AIErrorType[];
  action: (error: AIError, context: RecoveryContext) => Promise<RecoveryResult>;
  priority: number;
  maxRetries: number;
  backoffStrategy: 'fixed' | 'linear' | 'exponential';
  backoffDelay: number;
}

// 恢复上下文
export interface RecoveryContext {
  attemptCount: number;
  lastAttemptTime: number;
  originalInput: string;
  sessionId: string;
  userPreferences: Record<string, any>;
  fallbackOptions: string[];
}

// 恢复结果
export interface RecoveryResult {
  success: boolean;
  action: string;
  message: string;
  newInput?: string;
  suggestedAlternatives?: string[];
  requiresUserAction?: boolean;
  userActionPrompt?: string;
}

// 错误模式
export interface ErrorPattern {
  pattern: RegExp;
  type: AIErrorType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
}

class AIErrorRecovery {
  private errorPatterns: ErrorPattern[] = [];
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private errorHistory: AIError[] = [];
  private recoveryStats: Map<string, { attempts: number; successes: number }> = new Map();

  constructor() {
    this.initializeErrorPatterns();
    this.initializeRecoveryStrategies();
  }

  /**
   * 初始化错误模式
   */
  private initializeErrorPatterns(): void {
    this.errorPatterns = [
      {
        pattern: /timeout|timed out|连接超时/i,
        type: 'TIMEOUT_ERROR',
        severity: 'medium',
        recoverable: true
      },
      {
        pattern: /network|网络|connection|连接/i,
        type: 'NETWORK_ERROR',
        severity: 'medium',
        recoverable: true
      },
      {
        pattern: /rate limit|too many requests|限流/i,
        type: 'RATE_LIMIT_ERROR',
        severity: 'medium',
        recoverable: true
      },
      {
        pattern: /authentication|auth|unauthorized|认证|授权/i,
        type: 'AUTHENTICATION_ERROR',
        severity: 'high',
        recoverable: false
      },
      {
        pattern: /context.*overflow|token.*limit|上下文.*溢出/i,
        type: 'CONTEXT_OVERFLOW',
        severity: 'medium',
        recoverable: true
      },
      {
        pattern: /validation|invalid|验证失败|参数错误/i,
        type: 'VALIDATION_ERROR',
        severity: 'low',
        recoverable: true
      },
      {
        pattern: /api.*error|服务.*错误|server.*error/i,
        type: 'API_ERROR',
        severity: 'high',
        recoverable: true
      }
    ];
  }

  /**
   * 初始化恢复策略
   */
  private initializeRecoveryStrategies(): void {
    // 重试策略
    this.registerStrategy({
      id: 'retry',
      name: '简单重试',
      description: '直接重试原始请求',
      applicableErrors: ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'API_ERROR'],
      action: async (error, context) => {
        await this.delay(this.calculateBackoff(context));
        return {
          success: true,
          action: 'retry',
          message: '正在重试...'
        };
      },
      priority: 100,
      maxRetries: 3,
      backoffStrategy: 'exponential',
      backoffDelay: 1000
    });

    // 上下文压缩策略
    this.registerStrategy({
      id: 'compress_context',
      name: '压缩上下文',
      description: '压缩对话上下文以解决上下文溢出问题',
      applicableErrors: ['CONTEXT_OVERFLOW'],
      action: async (error, context) => {
        return {
          success: true,
          action: 'compress_context',
          message: '正在优化对话上下文...',
          newInput: this.compressInput(context.originalInput)
        };
      },
      priority: 90,
      maxRetries: 2,
      backoffStrategy: 'fixed',
      backoffDelay: 500
    });

    // 简化输入策略
    this.registerStrategy({
      id: 'simplify_input',
      name: '简化输入',
      description: '将复杂请求分解为简单请求',
      applicableErrors: ['VALIDATION_ERROR', 'CONTEXT_OVERFLOW'],
      action: async (error, context) => {
        const simplified = this.simplifyInput(context.originalInput);
        return {
          success: true,
          action: 'simplify',
          message: '正在简化您的请求...',
          newInput: simplified,
          suggestedAlternatives: this.generateAlternatives(context.originalInput)
        };
      },
      priority: 80,
      maxRetries: 2,
      backoffStrategy: 'fixed',
      backoffDelay: 500
    });

    // 限流等待策略
    this.registerStrategy({
      id: 'rate_limit_wait',
      name: '限流等待',
      description: '等待限流解除后重试',
      applicableErrors: ['RATE_LIMIT_ERROR'],
      action: async (error, context) => {
        const waitTime = 60000; // 1分钟
        await this.delay(waitTime);
        return {
          success: true,
          action: 'wait_and_retry',
          message: `服务繁忙，已等待${waitTime / 1000}秒后重试...`
        };
      },
      priority: 85,
      maxRetries: 1,
      backoffStrategy: 'fixed',
      backoffDelay: 60000
    });

    // 降级策略
    this.registerStrategy({
      id: 'fallback',
      name: '服务降级',
      description: '使用备用服务或简化回复',
      applicableErrors: ['API_ERROR', 'NETWORK_ERROR', 'TIMEOUT_ERROR'],
      action: async (error, context) => {
        return {
          success: true,
          action: 'fallback',
          message: '正在使用备用方案...',
          suggestedAlternatives: context.fallbackOptions
        };
      },
      priority: 70,
      maxRetries: 1,
      backoffStrategy: 'fixed',
      backoffDelay: 1000
    });

    // 用户介入策略
    this.registerStrategy({
      id: 'user_intervention',
      name: '需要用户介入',
      description: '需要用户确认或提供额外信息',
      applicableErrors: ['AUTHENTICATION_ERROR', 'VALIDATION_ERROR'],
      action: async (error, context) => {
        return {
          success: false,
          action: 'user_intervention',
          message: '需要您的协助',
          requiresUserAction: true,
          userActionPrompt: this.generateUserPrompt(error)
        };
      },
      priority: 60,
      maxRetries: 0,
      backoffStrategy: 'fixed',
      backoffDelay: 0
    });
  }

  /**
   * 注册恢复策略
   */
  registerStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.set(strategy.id, strategy);
  }

  /**
   * 分析错误
   */
  analyzeError(error: Error | string, context?: Record<string, any>): AIError {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const timestamp = Date.now();

    // 匹配错误模式
    for (const pattern of this.errorPatterns) {
      if (pattern.pattern.test(errorMessage)) {
        const aiError: AIError = {
          type: pattern.type,
          message: errorMessage,
          timestamp,
          context,
          recoverable: pattern.recoverable,
          severity: pattern.severity
        };
        this.errorHistory.push(aiError);
        return aiError;
      }
    }

    // 未知错误
    const unknownError: AIError = {
      type: 'UNKNOWN_ERROR',
      message: errorMessage,
      timestamp,
      context,
      recoverable: false,
      severity: 'medium'
    };
    this.errorHistory.push(unknownError);
    return unknownError;
  }

  /**
   * 尝试恢复
   */
  async attemptRecovery(
    error: AIError,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    // 查找适用的恢复策略
    const strategies = this.findApplicableStrategies(error);

    for (const strategy of strategies) {
      // 检查重试次数
      const stats = this.recoveryStats.get(strategy.id) || { attempts: 0, successes: 0 };
      if (stats.attempts >= strategy.maxRetries) {
        continue;
      }

      try {
        // 执行恢复策略
        const result = await strategy.action(error, context);

        // 更新统计
        stats.attempts++;
        if (result.success) {
          stats.successes++;
        }
        this.recoveryStats.set(strategy.id, stats);

        return result;
      } catch (recoveryError) {
        console.error(`恢复策略 ${strategy.id} 失败:`, recoveryError);
      }
    }

    // 所有策略都失败
    return {
      success: false,
      action: 'failed',
      message: '无法自动恢复，请稍后重试或联系支持',
      requiresUserAction: true,
      userActionPrompt: '抱歉，遇到了暂时无法解决的问题。您可以：\n1. 稍后重试\n2. 简化您的请求\n3. 联系客服支持'
    };
  }

  /**
   * 查找适用的恢复策略
   */
  private findApplicableStrategies(error: AIError): RecoveryStrategy[] {
    const strategies: RecoveryStrategy[] = [];

    for (const strategy of this.recoveryStrategies.values()) {
      if (strategy.applicableErrors.includes(error.type)) {
        strategies.push(strategy);
      }
    }

    // 按优先级排序
    return strategies.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 计算退避时间
   */
  private calculateBackoff(context: RecoveryContext): number {
    const strategy = this.recoveryStrategies.get('retry');
    if (!strategy) return 1000;

    const baseDelay = strategy.backoffDelay;
    const attempt = context.attemptCount;

    switch (strategy.backoffStrategy) {
      case 'linear':
        return baseDelay * attempt;
      case 'exponential':
        return baseDelay * Math.pow(2, attempt - 1);
      case 'fixed':
      default:
        return baseDelay;
    }
  }

  /**
   * 压缩输入
   */
  private compressInput(input: string): string {
    // 移除冗余内容
    return input
      .replace(/\s+/g, ' ')
      .replace(/[，。；！？,;!?]+/g, ' ')
      .substring(0, 500);
  }

  /**
   * 简化输入
   */
  private simplifyInput(input: string): string {
    // 提取核心需求
    const patterns = [
      /(?:帮我|请|想要|需要)\s*(.+?)(?:[,，。]|$)/,
      /(?:生成|创建|设计|做)\s*(.+?)(?:[,，。]|$)/,
      /(?:查询|了解|知道)\s*(.+?)(?:[,，。]|$)/
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return input.substring(0, 200);
  }

  /**
   * 生成替代方案
   */
  private generateAlternatives(input: string): string[] {
    const alternatives: string[] = [];

    // 根据输入类型生成替代方案
    if (input.includes('图') || input.includes('画')) {
      alternatives.push('生成一张简单的概念图');
      alternatives.push('先提供设计建议');
    }

    if (input.includes('设计') || input.includes('方案')) {
      alternatives.push('提供设计思路和建议');
      alternatives.push('推荐相关文化元素');
    }

    if (input.includes('文化') || input.includes('历史')) {
      alternatives.push('简要介绍相关文化');
      alternatives.push('推荐学习资源');
    }

    alternatives.push('分步骤完成您的需求');
    alternatives.push('联系人工客服协助');

    return alternatives;
  }

  /**
   * 生成用户提示
   */
  private generateUserPrompt(error: AIError): string {
    switch (error.type) {
      case 'AUTHENTICATION_ERROR':
        return '您的登录状态已过期，请重新登录后重试。';
      case 'VALIDATION_ERROR':
        return '您的输入格式不正确，请检查：\n1. 是否包含特殊字符\n2. 长度是否合适\n3. 必填项是否完整';
      case 'CONTEXT_OVERFLOW':
        return '对话内容过长，建议：\n1. 开启新对话\n2. 简化当前问题\n3. 分多次询问';
      default:
        return '遇到了技术问题，请稍后重试或联系支持。';
    }
  }

  /**
   * 延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): {
    totalErrors: number;
    errorByType: Record<AIErrorType, number>;
    recoveryRate: number;
    recentErrors: AIError[];
  } {
    const errorByType: Record<string, number> = {};
    let recoveredErrors = 0;

    for (const error of this.errorHistory) {
      errorByType[error.type] = (errorByType[error.type] || 0) + 1;
      if (error.recoverable) {
        recoveredErrors++;
      }
    }

    const totalErrors = this.errorHistory.length;
    const recoveryRate = totalErrors > 0 ? recoveredErrors / totalErrors : 0;

    // 最近24小时的错误
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentErrors = this.errorHistory.filter(e => e.timestamp > oneDayAgo);

    return {
      totalErrors,
      errorByType: errorByType as Record<AIErrorType, number>,
      recoveryRate,
      recentErrors
    };
  }

  /**
   * 获取恢复统计
   */
  getRecoveryStats(): Array<{
    strategyId: string;
    attempts: number;
    successes: number;
    successRate: number;
  }> {
    const stats: Array<{
      strategyId: string;
      attempts: number;
      successes: number;
      successRate: number;
    }> = [];

    for (const [id, stat] of this.recoveryStats) {
      stats.push({
        strategyId: id,
        attempts: stat.attempts,
        successes: stat.successes,
        successRate: stat.attempts > 0 ? stat.successes / stat.attempts : 0
      });
    }

    return stats.sort((a, b) => b.successRate - a.successRate);
  }

  /**
   * 清理历史记录
   */
  cleanupHistory(daysToKeep: number = 30): void {
    const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    this.errorHistory = this.errorHistory.filter(e => e.timestamp > cutoff);
  }

  /**
   * 预测潜在错误
   */
  predictPotentialErrors(input: string, context?: Record<string, any>): AIError[] {
    const predictions: AIError[] = [];

    // 检查上下文长度
    if (input.length > 2000) {
      predictions.push({
        type: 'CONTEXT_OVERFLOW',
        message: '输入内容过长，可能导致上下文溢出',
        timestamp: Date.now(),
        context,
        recoverable: true,
        severity: 'medium'
      });
    }

    // 检查复杂指令
    if (this.isComplexCommand(input)) {
      predictions.push({
        type: 'VALIDATION_ERROR',
        message: '复杂指令可能需要分解执行',
        timestamp: Date.now(),
        context,
        recoverable: true,
        severity: 'low'
      });
    }

    // 检查历史错误模式
    const similarErrors = this.findSimilarErrors(input);
    predictions.push(...similarErrors);

    return predictions;
  }

  /**
   * 判断是否复杂指令
   */
  private isComplexCommand(input: string): boolean {
    const complexityIndicators = [
      /(并且|同时|另外|然后|接着)/g,
      /(先.*再.*最后)/,
      /(第一步|第二步|第三步)/
    ];

    let score = 0;
    for (const pattern of complexityIndicators) {
      const matches = input.match(pattern);
      if (matches) {
        score += matches.length;
      }
    }

    return score >= 3;
  }

  /**
   * 查找相似错误
   */
  private findSimilarErrors(input: string): AIError[] {
    const similar: AIError[] = [];
    const keywords = input.toLowerCase().split(/\s+/);

    for (const error of this.errorHistory.slice(-50)) {
      const errorKeywords = error.message.toLowerCase().split(/\s+/);
      const commonKeywords = keywords.filter(k => errorKeywords.includes(k));

      if (commonKeywords.length >= 2) {
        similar.push(error);
      }
    }

    return similar.slice(0, 3);
  }
}

export const aiErrorRecovery = new AIErrorRecovery();
export default AIErrorRecovery;
