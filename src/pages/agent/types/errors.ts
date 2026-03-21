/**
 * Agent 系统错误类型定义
 */

/**
 * 错误类型枚举
 */
export enum AgentErrorType {
  /** 网络错误 */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** API 错误 */
  API_ERROR = 'API_ERROR',
  /** 超时错误 */
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  /** 验证错误 */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  /** 生成错误 */
  GENERATION_ERROR = 'GENERATION_ERROR',
  /** 任务队列错误 */
  TASK_QUEUE_ERROR = 'TASK_QUEUE_ERROR',
  /** Agent 协作错误 */
  COLLABORATION_ERROR = 'COLLABORATION_ERROR',
  /** 未知错误 */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * 错误级别
 */
export enum ErrorLevel {
  /** 信息 - 不影响功能 */
  INFO = 'info',
  /** 警告 - 可能影响体验 */
  WARNING = 'warning',
  /** 错误 - 功能不可用 */
  ERROR = 'error',
  /** 严重错误 - 系统崩溃 */
  CRITICAL = 'critical'
}

/**
 * Agent 错误接口
 */
export interface AgentError {
  /** 错误类型 */
  type: AgentErrorType;
  /** 错误级别 */
  level: ErrorLevel;
  /** 错误消息 */
  message: string;
  /** 详细错误信息 */
  details?: string;
  /** 错误堆栈 */
  stack?: string;
  /** 发生时间 */
  timestamp: number;
  /** 相关 Agent 类型 */
  agentType?: string;
  /** 相关任务 ID */
  taskId?: string;
  /** 相关队列 ID */
  queueId?: string;
  /** 是否可重试 */
  retryable?: boolean;
  /** 建议的解决方案 */
  suggestedAction?: string;
}

/**
 * 错误信息映射表
 */
export const ERROR_MESSAGES: Record<AgentErrorType, { title: string; defaultAction: string }> = {
  [AgentErrorType.NETWORK_ERROR]: {
    title: '网络连接问题',
    defaultAction: '请检查网络连接，然后重试'
  },
  [AgentErrorType.API_ERROR]: {
    title: '服务响应异常',
    defaultAction: '服务暂时不可用，请稍后重试'
  },
  [AgentErrorType.TIMEOUT_ERROR]: {
    title: '请求超时',
    defaultAction: '请求处理时间过长，请重试或简化需求'
  },
  [AgentErrorType.VALIDATION_ERROR]: {
    title: '输入验证失败',
    defaultAction: '请检查输入内容是否符合要求'
  },
  [AgentErrorType.GENERATION_ERROR]: {
    title: '生成失败',
    defaultAction: '无法生成内容，请尝试修改描述或重试'
  },
  [AgentErrorType.TASK_QUEUE_ERROR]: {
    title: '任务执行错误',
    defaultAction: '任务执行失败，请重试或联系管理员'
  },
  [AgentErrorType.COLLABORATION_ERROR]: {
    title: '协作失败',
    defaultAction: 'Agent 协作出现问题，请重试'
  },
  [AgentErrorType.UNKNOWN_ERROR]: {
    title: '未知错误',
    defaultAction: '发生了意外错误，请重试或联系技术支持'
  }
};

/**
 * 从 Error 对象创建 AgentError
 */
export function createAgentError(
  error: Error | any,
  type: AgentErrorType = AgentErrorType.UNKNOWN_ERROR,
  context?: {
    agentType?: string;
    taskId?: string;
    queueId?: string;
  }
): AgentError {
  const errorConfig = ERROR_MESSAGES[type];
  
  return {
    type,
    level: ErrorLevel.ERROR,
    message: error.message || errorConfig.title,
    details: error.toString(),
    stack: error.stack,
    timestamp: Date.now(),
    agentType: context?.agentType,
    taskId: context?.taskId,
    queueId: context?.queueId,
    retryable: isRetryableError(type),
    suggestedAction: errorConfig.defaultAction
  };
}

/**
 * 判断错误是否可重试
 */
function isRetryableError(type: AgentErrorType): boolean {
  const retryableTypes = [
    AgentErrorType.NETWORK_ERROR,
    AgentErrorType.API_ERROR,
    AgentErrorType.TIMEOUT_ERROR,
    AgentErrorType.GENERATION_ERROR
  ];
  return retryableTypes.includes(type);
}

/**
 * 错误日志记录器
 */
export class ErrorLogger {
  private static logs: AgentError[] = [];
  private static maxLogs = 100;

  /**
   * 记录错误
   */
  static log(error: AgentError): void {
    this.logs.push(error);
    
    // 超出限制时移除最早的日志
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 在开发环境下输出到控制台
    if (process.env.NODE_ENV === 'development') {
      console.error('[Agent Error]', error);
    }
  }

  /**
   * 获取错误日志
   */
  static getLogs(): AgentError[] {
    return [...this.logs];
  }

  /**
   * 清除错误日志
   */
  static clear(): void {
    this.logs = [];
  }

  /**
   * 获取错误统计
   */
  static getStats(): { total: number; byType: Record<string, number> } {
    const stats = {
      total: this.logs.length,
      byType: {} as Record<string, number>
    };

    this.logs.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });

    return stats;
  }
}
