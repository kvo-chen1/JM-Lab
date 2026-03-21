/**
 * Agent 系统错误处理器 - 增强版
 */

import {
  AgentError,
  AgentErrorType,
  createAgentError,
  ErrorLogger,
  getUserFriendlyErrorMessage,
  RecoveryStrategy,
  defaultRecoveryStrategies
} from './errors';

/**
 * 错误处理回调类型
 */
export type ErrorHandlerCallback = (error: AgentError) => void;

/**
 * 错误处理结果
 */
export interface ErrorHandleResult<T> {
  success: boolean;
  data?: T;
  error?: AgentError;
  recovered: boolean;
}

/**
 * 错误处理器类 - 增强版
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private listeners: Set<ErrorHandlerCallback> = new Set();
  private recoveryStrategies: RecoveryStrategy[] = [...defaultRecoveryStrategies];
  private retryConfig: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  } = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 1.5
  };

  private constructor() {
    // 初始化错误日志记录器
    ErrorLogger.initialize();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ErrorHandler {
    if (!this.instance) {
      this.instance = new ErrorHandler();
    }
    return this.instance;
  }

  /**
   * 添加错误监听器
   */
  addListener(callback: ErrorHandlerCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * 处理错误
   */
  handleError(error: Error | any, context?: {
    type?: AgentErrorType;
    agentType?: string;
    taskId?: string;
    queueId?: string;
    operation?: string;
    [key: string]: any;
  }): AgentError {
    // 创建 AgentError 对象
    const agentError = createAgentError(error, context?.type, {
      agentType: context?.agentType,
      taskId: context?.taskId,
      queueId: context?.queueId,
      operation: context?.operation,
      ...context
    });

    // 记录错误日志
    ErrorLogger.log(agentError);

    // 通知所有监听器
    this.listeners.forEach(callback => {
      try {
        callback(agentError);
      } catch (e) {
        console.error('[ErrorHandler] Listener error:', e);
      }
    });

    return agentError;
  }

  /**
   * 处理网络错误
   */
  handleNetworkError(error: any, context?: any): AgentError {
    return this.handleError(error, {
      type: AgentErrorType.NETWORK_ERROR,
      ...context
    });
  }

  /**
   * 处理 API 错误
   */
  handleAPIError(error: any, context?: any): AgentError {
    return this.handleError(error, {
      type: AgentErrorType.API_ERROR,
      ...context
    });
  }

  /**
   * 处理超时错误
   */
  handleTimeoutError(error: any, context?: any): AgentError {
    return this.handleError(error, {
      type: AgentErrorType.TIMEOUT_ERROR,
      ...context
    });
  }

  /**
   * 处理生成错误
   */
  handleGenerationError(error: any, context?: any): AgentError {
    return this.handleError(error, {
      type: AgentErrorType.GENERATION_ERROR,
      ...context
    });
  }

  /**
   * 处理验证错误
   */
  handleValidationError(error: any, context?: any): AgentError {
    return this.handleError(error, {
      type: AgentErrorType.VALIDATION_ERROR,
      ...context
    });
  }

  /**
   * 处理内存错误
   */
  handleMemoryError(error: any, context?: any): AgentError {
    return this.handleError(error, {
      type: AgentErrorType.MEMORY_ERROR,
      ...context
    });
  }

  /**
   * 带重试的错误处理 - 增强版
   */
  async handleWithRetry<T>(
    operation: () => Promise<T>,
    context?: {
      type?: AgentErrorType;
      agentType?: string;
      taskId?: string;
      queueId?: string;
      operation?: string;
      maxRetries?: number;
      retryDelay?: number;
      backoffMultiplier?: number;
      onRetry?: (attempt: number, error: AgentError) => void;
      onSuccess?: (attempts: number) => void;
    }
  ): Promise<ErrorHandleResult<T>> {
    const maxRetries = context?.maxRetries ?? this.retryConfig.maxRetries;
    const retryDelay = context?.retryDelay ?? this.retryConfig.retryDelay;
    const backoffMultiplier = context?.backoffMultiplier ?? this.retryConfig.backoffMultiplier;

    let lastError: AgentError | undefined;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const result = await operation();

        // 成功后回调
        if (attempt > 0 && context?.onSuccess) {
          context.onSuccess(attempt);
        }

        return {
          success: true,
          data: result,
          recovered: attempt > 0
        };
      } catch (error: any) {
        // 创建 AgentError
        lastError = this.handleError(error, {
          type: context?.type,
          agentType: context?.agentType,
          taskId: context?.taskId,
          queueId: context?.queueId,
          operation: context?.operation
        });

        // 如果是最后一次尝试，跳出循环
        if (attempt === maxRetries) {
          break;
        }

        // 如果不可重试，直接返回错误
        if (!lastError.retryable) {
          return {
            success: false,
            error: lastError,
            recovered: false
          };
        }

        // 重试回调
        if (context?.onRetry) {
          context.onRetry(attempt + 1, lastError);
        }

        // 计算退避延迟
        const delay = retryDelay * Math.pow(backoffMultiplier, attempt);

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay));

        attempt++;
      }
    }

    // 所有重试都失败了
    return {
      success: false,
      error: lastError,
      recovered: false
    };
  }

  /**
   * 带降级策略的错误处理
   */
  async handleWithFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    context?: {
      type?: AgentErrorType;
      agentType?: string;
      taskId?: string;
      onFallback?: (error: AgentError) => void;
    }
  ): Promise<ErrorHandleResult<T>> {
    try {
      const result = await primaryOperation();
      return {
        success: true,
        data: result,
        recovered: false
      };
    } catch (error: any) {
      const agentError = this.handleError(error, {
        type: context?.type,
        agentType: context?.agentType,
        taskId: context?.taskId
      });

      // 回调通知降级
      if (context?.onFallback) {
        context.onFallback(agentError);
      }

      try {
        const fallbackResult = await fallbackOperation();
        return {
          success: true,
          data: fallbackResult,
          recovered: true
        };
      } catch (fallbackError: any) {
        const fallbackAgentError = this.handleError(fallbackError, {
          type: context?.type,
          agentType: context?.agentType,
          taskId: context?.taskId
        });

        return {
          success: false,
          error: fallbackAgentError,
          recovered: false
        };
      }
    }
  }

  /**
   * 尝试恢复错误
   */
  async tryRecover(error: AgentError): Promise<boolean> {
    for (const strategy of this.recoveryStrategies) {
      if (strategy.canRecover(error)) {
        try {
          console.log(`[ErrorHandler] Trying recovery strategy: ${strategy.name}`);
          const recovered = await strategy.recover(error);
          if (recovered) {
            console.log(`[ErrorHandler] Recovered using strategy: ${strategy.name}`);
            return true;
          }
        } catch (e) {
          console.error(`[ErrorHandler] Recovery strategy ${strategy.name} failed:`, e);
        }
      }
    }
    return false;
  }

  /**
   * 添加恢复策略
   */
  addRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
  }

  /**
   * 设置重试配置
   */
  setRetryConfig(config: Partial<typeof this.retryConfig>): void {
    this.retryConfig = {
      ...this.retryConfig,
      ...config
    };
  }

  /**
   * 获取重试配置
   */
  getRetryConfig(): typeof this.retryConfig {
    return { ...this.retryConfig };
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): { total: number; byType: Record<string, number> } {
    return ErrorLogger.getStats();
  }

  /**
   * 获取最近的错误
   */
  getRecentErrors(limit: number = 10) {
    return ErrorLogger.getRecentErrors(limit);
  }

  /**
   * 清除错误日志
   */
  clearErrorLogs(): void {
    ErrorLogger.clear();
  }

  /**
   * 导出错误日志
   */
  exportErrorLogs(): string {
    return ErrorLogger.export();
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserFriendlyMessage(error: AgentError): string {
    return getUserFriendlyErrorMessage(error);
  }
}

// 导出单例
export const errorHandler = ErrorHandler.getInstance();

/**
 * 错误处理装饰器 - 增强版
 */
export function handleErrors(options?: {
  type?: AgentErrorType;
  fallback?: any;
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: AgentError) => void;
  onSuccess?: () => void;
}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const handler = ErrorHandler.getInstance();

      try {
        let result;

        if (options?.maxRetries && options.maxRetries > 0) {
          // 使用重试机制
          const retryResult = await handler.handleWithRetry(
            () => originalMethod.apply(this, args),
            {
              type: options?.type,
              maxRetries: options.maxRetries,
              retryDelay: options?.retryDelay,
              onRetry: (attempt, error) => {
                console.log(`[handleErrors] Retry attempt ${attempt} for ${propertyKey}`);
              }
            }
          );

          if (!retryResult.success) {
            throw retryResult.error;
          }

          result = retryResult.data;
        } else {
          // 直接执行
          result = await originalMethod.apply(this, args);
        }

        // 成功回调
        if (options?.onSuccess) {
          options.onSuccess();
        }

        return result;
      } catch (error: any) {
        const agentError = handler.handleError(error, {
          type: options?.type,
          operation: propertyKey
        });

        // 错误回调
        if (options?.onError) {
          options.onError(agentError);
        }

        // 如果有 fallback，返回 fallback
        if (options?.fallback !== undefined) {
          return typeof options.fallback === 'function'
            ? options.fallback(agentError)
            : options.fallback;
        }

        // 否则重新抛出
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 便捷的错误处理函数
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  options?: {
    fallback?: T;
    errorMessage?: string;
    onError?: (error: AgentError) => void;
  }
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error: any) {
    const handler = ErrorHandler.getInstance();
    const agentError = handler.handleError(error);

    if (options?.onError) {
      options.onError(agentError);
    }

    if (options?.fallback !== undefined) {
      return options.fallback;
    }

    return undefined;
  }
}

/**
 * 创建错误边界包装器
 */
export function createErrorBoundary<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: {
    type?: AgentErrorType;
    fallback?: any;
    onError?: (error: AgentError) => void;
  }
): (...args: Parameters<T>) => Promise<any> {
  return async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      const handler = ErrorHandler.getInstance();
      const agentError = handler.handleError(error, { type: options?.type });

      if (options?.onError) {
        options.onError(agentError);
      }

      if (options?.fallback !== undefined) {
        return options.fallback;
      }

      throw error;
    }
  };
}
