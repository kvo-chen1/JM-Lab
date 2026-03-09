/**
 * Agent 系统错误类型定义
 */

// 错误类型枚举
export enum AgentErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  GENERATION_ERROR = 'GENERATION_ERROR',
  TASK_QUEUE_ERROR = 'TASK_QUEUE_ERROR',
  COLLABORATION_ERROR = 'COLLABORATION_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 错误级别
export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Agent 错误接口
export interface AgentError {
  type: AgentErrorType;
  message: string;
  originalError?: Error;
  level: ErrorLevel;
  timestamp: number;
  retryable: boolean;
  context?: {
    agentType?: string;
    taskId?: string;
    queueId?: string;
    operation?: string;
    [key: string]: any;
  };
  recoverySuggestion?: string;
}

// 错误日志条目
interface ErrorLogEntry {
  error: AgentError;
  count: number;
  firstOccurrence: number;
  lastOccurrence: number;
}

// 错误日志存储
const ERROR_LOG_KEY = 'agent-error-logs';
const MAX_ERROR_LOGS = 100;

/**
 * 创建 AgentError 对象
 */
export function createAgentError(
  error: Error | any,
  type?: AgentErrorType,
  context?: AgentError['context']
): AgentError {
  // 判断错误类型
  const errorType = type || detectErrorType(error);

  // 判断错误级别
  const level = determineErrorLevel(errorType);

  // 判断是否可以重试
  const retryable = isRetryableError(errorType, error);

  // 获取恢复建议
  const recoverySuggestion = getRecoverySuggestion(errorType);

  return {
    type: errorType,
    message: error?.message || error?.toString() || 'Unknown error',
    originalError: error instanceof Error ? error : undefined,
    level,
    timestamp: Date.now(),
    retryable,
    context,
    recoverySuggestion
  };
}

/**
 * 检测错误类型
 */
function detectErrorType(error: any): AgentErrorType {
  const message = (error?.message || error?.toString() || '').toLowerCase();

  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return AgentErrorType.NETWORK_ERROR;
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return AgentErrorType.TIMEOUT_ERROR;
  }
  if (message.includes('api') || message.includes('request failed') || message.includes('http')) {
    return AgentErrorType.API_ERROR;
  }
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return AgentErrorType.VALIDATION_ERROR;
  }
  if (message.includes('generate') || message.includes('generation') || message.includes('image') || message.includes('video')) {
    return AgentErrorType.GENERATION_ERROR;
  }
  if (message.includes('queue') || message.includes('task')) {
    return AgentErrorType.TASK_QUEUE_ERROR;
  }
  if (message.includes('collaboration') || message.includes('delegate')) {
    return AgentErrorType.COLLABORATION_ERROR;
  }
  if (message.includes('memory') || message.includes('storage')) {
    return AgentErrorType.MEMORY_ERROR;
  }

  return AgentErrorType.UNKNOWN_ERROR;
}

/**
 * 判断错误级别
 */
function determineErrorLevel(type: AgentErrorType): ErrorLevel {
  switch (type) {
    case AgentErrorType.NETWORK_ERROR:
    case AgentErrorType.TIMEOUT_ERROR:
      return ErrorLevel.WARNING;
    case AgentErrorType.API_ERROR:
    case AgentErrorType.GENERATION_ERROR:
      return ErrorLevel.ERROR;
    case AgentErrorType.VALIDATION_ERROR:
      return ErrorLevel.INFO;
    case AgentErrorType.TASK_QUEUE_ERROR:
    case AgentErrorType.COLLABORATION_ERROR:
      return ErrorLevel.ERROR;
    case AgentErrorType.MEMORY_ERROR:
      return ErrorLevel.WARNING;
    default:
      return ErrorLevel.ERROR;
  }
}

/**
 * 判断错误是否可重试
 */
function isRetryableError(type: AgentErrorType, error: any): boolean {
  // 网络错误和超时错误通常可以重试
  if (type === AgentErrorType.NETWORK_ERROR || type === AgentErrorType.TIMEOUT_ERROR) {
    return true;
  }

  // API错误根据状态码判断
  if (type === AgentErrorType.API_ERROR) {
    const statusCode = error?.status || error?.statusCode;
    // 5xx 错误可以重试，4xx 错误通常不能重试
    if (statusCode >= 500 && statusCode < 600) {
      return true;
    }
    if (statusCode === 429) { // Too Many Requests
      return true;
    }
    return false;
  }

  // 生成错误有时可以重试
  if (type === AgentErrorType.GENERATION_ERROR) {
    // 检查是否是临时性错误
    const message = (error?.message || '').toLowerCase();
    if (message.includes('rate limit') || message.includes('busy') || message.includes('temporarily')) {
      return true;
    }
    return false;
  }

  return false;
}

/**
 * 获取恢复建议
 */
function getRecoverySuggestion(type: AgentErrorType): string {
  switch (type) {
    case AgentErrorType.NETWORK_ERROR:
      return '请检查网络连接，然后重试。如果问题持续，请稍后再次尝试。';
    case AgentErrorType.API_ERROR:
      return '服务暂时不可用，请稍后重试。如果问题持续，请联系支持团队。';
    case AgentErrorType.TIMEOUT_ERROR:
      return '请求超时，可能是网络延迟或服务器繁忙。请稍后重试。';
    case AgentErrorType.VALIDATION_ERROR:
      return '请检查输入数据是否符合要求，然后重试。';
    case AgentErrorType.GENERATION_ERROR:
      return '生成过程中出现问题，请尝试修改描述或稍后重试。';
    case AgentErrorType.TASK_QUEUE_ERROR:
      return '任务队列处理失败，系统将自动重试。';
    case AgentErrorType.COLLABORATION_ERROR:
      return '多Agent协作出现问题，将尝试简化流程继续处理。';
    case AgentErrorType.MEMORY_ERROR:
      return '数据存储出现问题，部分个性化功能可能受限。';
    default:
      return '发生未知错误，请稍后重试或联系支持团队。';
  }
}

/**
 * 错误日志记录器
 */
export class ErrorLogger {
  private static logs: ErrorLogEntry[] = [];
  private static initialized = false;

  /**
   * 初始化日志存储
   */
  static initialize(): void {
    if (this.initialized) return;

    try {
      const saved = localStorage.getItem(ERROR_LOG_KEY);
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch (error) {
      console.error('[ErrorLogger] Failed to load logs:', error);
    }

    this.initialized = true;
  }

  /**
   * 记录错误
   */
  static log(error: AgentError): void {
    this.initialize();

    // 查找是否已有相同的错误
    const existingLog = this.logs.find(log =>
      log.error.type === error.type &&
      log.error.message === error.message
    );

    if (existingLog) {
      existingLog.count++;
      existingLog.lastOccurrence = error.timestamp;
    } else {
      this.logs.push({
        error,
        count: 1,
        firstOccurrence: error.timestamp,
        lastOccurrence: error.timestamp
      });
    }

    // 限制日志数量
    if (this.logs.length > MAX_ERROR_LOGS) {
      this.logs = this.logs.slice(-MAX_ERROR_LOGS);
    }

    // 保存到本地存储
    this.save();

    // 控制台输出
    this.consoleOutput(error);
  }

  /**
   * 控制台输出
   */
  private static consoleOutput(error: AgentError): void {
    const prefix = `[AgentError:${error.type}]`;
    const message = `${prefix} ${error.message}`;

    switch (error.level) {
      case ErrorLevel.INFO:
        console.info(message, error);
        break;
      case ErrorLevel.WARNING:
        console.warn(message, error);
        break;
      case ErrorLevel.ERROR:
      case ErrorLevel.CRITICAL:
        console.error(message, error);
        break;
    }
  }

  /**
   * 保存日志
   */
  private static save(): void {
    try {
      localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(this.logs));
    } catch (error) {
      console.error('[ErrorLogger] Failed to save logs:', error);
    }
  }

  /**
   * 获取所有日志
   */
  static getLogs(): ErrorLogEntry[] {
    this.initialize();
    return [...this.logs];
  }

  /**
   * 获取错误统计
   */
  static getStats(): { total: number; byType: Record<string, number> } {
    this.initialize();

    const byType: Record<string, number> = {};
    let total = 0;

    this.logs.forEach(log => {
      byType[log.error.type] = (byType[log.error.type] || 0) + log.count;
      total += log.count;
    });

    return { total, byType };
  }

  /**
   * 获取最近的错误
   */
  static getRecentErrors(limit: number = 10): ErrorLogEntry[] {
    this.initialize();
    return this.logs
      .sort((a, b) => b.lastOccurrence - a.lastOccurrence)
      .slice(0, limit);
  }

  /**
   * 清除日志
   */
  static clear(): void {
    this.logs = [];
    try {
      localStorage.removeItem(ERROR_LOG_KEY);
    } catch (error) {
      console.error('[ErrorLogger] Failed to clear logs:', error);
    }
  }

  /**
   * 导出日志
   */
  static export(): string {
    this.initialize();
    return JSON.stringify(this.logs, null, 2);
  }
}

/**
 * 用户友好的错误消息生成器
 */
export function getUserFriendlyErrorMessage(error: AgentError): string {
  switch (error.type) {
    case AgentErrorType.NETWORK_ERROR:
      return '网络连接出现问题，请检查网络后重试。';
    case AgentErrorType.API_ERROR:
      return 'AI服务暂时不可用，请稍后再试。';
    case AgentErrorType.TIMEOUT_ERROR:
      return '请求处理时间较长，请耐心等待或稍后重试。';
    case AgentErrorType.GENERATION_ERROR:
      return '生成内容时遇到问题，请尝试修改描述后重试。';
    case AgentErrorType.VALIDATION_ERROR:
      return '输入信息不完整，请补充必要信息后重试。';
    case AgentErrorType.TASK_QUEUE_ERROR:
      return '任务处理队列繁忙，正在自动重试...';
    case AgentErrorType.COLLABORATION_ERROR:
      return '多Agent协作出现问题，已切换到单Agent模式继续处理。';
    case AgentErrorType.MEMORY_ERROR:
      return '个人偏好数据加载失败，使用默认设置继续。';
    default:
      return '抱歉，遇到了一些问题。请稍后重试。';
  }
}

/**
 * 错误恢复策略
 */
export interface RecoveryStrategy {
  canRecover: (error: AgentError) => boolean;
  recover: (error: AgentError) => Promise<boolean>;
  name: string;
}

/**
 * 默认恢复策略
 */
export const defaultRecoveryStrategies: RecoveryStrategy[] = [
  {
    name: 'network-retry',
    canRecover: (error) => error.type === AgentErrorType.NETWORK_ERROR,
    recover: async () => {
      // 等待网络恢复
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
    }
  },
  {
    name: 'api-fallback',
    canRecover: (error) => error.type === AgentErrorType.API_ERROR,
    recover: async () => {
      // 切换到备用API或降级模式
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    }
  },
  {
    name: 'generation-retry',
    canRecover: (error) => error.type === AgentErrorType.GENERATION_ERROR,
    recover: async () => {
      // 等待一段时间后重试生成
      await new Promise(resolve => setTimeout(resolve, 3000));
      return true;
    }
  }
];
