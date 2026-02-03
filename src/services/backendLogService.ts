// 后端日志服务 - 用于前端与后端日志系统交互

// 日志级别类型
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

// 日志数据类型
export interface LogData {
  level: LogLevel
  message: string
  timestamp: number
  userId?: string
  sessionId?: string
  requestId?: string
  context?: Record<string, any>
  error?: {
    name?: string
    message: string
    stack?: string
  }
  metadata?: Record<string, any>
}

// 异常追踪数据类型
export interface TraceData {
  traceId: string
  spanId: string
  parentSpanId?: string
  startTime: number
  endTime?: number
  duration?: number
  operationName: string
  status: 'ok' | 'error'
  attributes?: Record<string, any>
  events?: Array<{
    name: string
    timestamp: number
    attributes?: Record<string, any>
  }>
  error?: {
    name?: string
    message: string
    stack?: string
  }
}

// 后端日志服务类
class BackendLogService {
  private apiUrl: string
  private requestId: string
  private sessionId: string
  private userId?: string
  private enableConsoleLogging: boolean

  constructor() {
    // 从环境变量获取API URL
    this.apiUrl = this.getApiUrl()
    // 生成会话ID
    this.sessionId = this.generateSessionId()
    // 生成请求ID
    this.requestId = this.generateRequestId()
    // 启用控制台日志记录
    this.enableConsoleLogging = true
  }

  // 获取API URL
  private getApiUrl(): string {
    let url = ''
    if (typeof window !== 'undefined') {
      url = (window as any).env?.REACT_APP_BACKEND_LOG_API_URL || 
             (window as any).env?.NEXT_PUBLIC_BACKEND_LOG_API_URL || 
             ''
    }
    return url
  }

  // 生成会话ID
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 生成请求ID
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 设置用户ID
  setUserId(userId: string): void {
    this.userId = userId
  }

  // 设置请求ID
  setRequestId(requestId: string): void {
    this.requestId = requestId
  }

  // 生成新的请求ID
  generateNewRequestId(): string {
    this.requestId = this.generateRequestId()
    return this.requestId
  }

  // 记录日志
  log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const logData: LogData = {
      level,
      message,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      requestId: this.requestId,
      context
    }

    // 发送日志到后端
    this.sendLog(logData)

    // 如果启用控制台日志记录，则记录到控制台
    if (this.enableConsoleLogging) {
      this.consoleLog(logData)
    }
  }

  // 记录错误日志
  error(message: string, error: Error, context?: Record<string, any>): void {
    const logData: LogData = {
      level: 'error',
      message,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      requestId: this.requestId,
      context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }

    // 发送日志到后端
    this.sendLog(logData)

    // 如果启用控制台日志记录，则记录到控制台
    if (this.enableConsoleLogging) {
      this.consoleLog(logData)
    }
  }

  // 记录信息日志
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context)
  }

  // 记录警告日志
  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context)
  }

  // 记录调试日志
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context)
  }

  // 记录致命错误日志
  fatal(message: string, error: Error, context?: Record<string, any>): void {
    const logData: LogData = {
      level: 'fatal',
      message,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      requestId: this.requestId,
      context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }

    // 发送日志到后端
    this.sendLog(logData)

    // 如果启用控制台日志记录，则记录到控制台
    if (this.enableConsoleLogging) {
      this.consoleLog(logData)
    }
  }

  // 发送日志到后端
  private async sendLog(logData: LogData): Promise<boolean> {
    try {
      if (!this.apiUrl) {
        console.warn('后端日志API URL未配置，跳过发送日志')
        return false
      }

      // 使用fetch发送日志
      const response = await fetch(`${this.apiUrl}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': logData.requestId || '',
          'X-Session-Id': logData.sessionId || ''
        } as HeadersInit,
        body: JSON.stringify(logData),
        keepalive: true
      })

      return response.ok
    } catch (error) {
      console.error('发送日志到后端失败:', error)
      return false
    }
  }

  // 记录到控制台
  private consoleLog(logData: LogData): void {
    const { level, message, context, error } = logData
    const timestamp = new Date(logData.timestamp).toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${logData.requestId}]`

    switch (level) {
      case 'debug':
        console.debug(prefix, message, context)
        if (error) console.debug(prefix, 'Error:', error)
        break
      case 'info':
        console.info(prefix, message, context)
        if (error) console.info(prefix, 'Error:', error)
        break
      case 'warn':
        console.warn(prefix, message, context)
        if (error) console.warn(prefix, 'Error:', error)
        break
      case 'error':
        console.error(prefix, message, context)
        if (error) console.error(prefix, 'Error:', error)
        break
      case 'fatal':
        console.error(prefix, message, context)
        if (error) console.error(prefix, 'Error:', error)
        break
    }
  }

  // 开始追踪
  startTrace(operationName: string, parentSpanId?: string): string {
    const traceId = this.generateRequestId()
    const spanId = this.generateRequestId()

    const traceData: TraceData = {
      traceId,
      spanId,
      parentSpanId,
      startTime: Date.now(),
      operationName,
      status: 'ok'
    }

    // 发送追踪数据到后端
    this.sendTrace(traceData)

    return spanId
  }

  // 结束追踪
  endTrace(spanId: string, status: 'ok' | 'error' = 'ok', error?: Error, attributes?: Record<string, any>): void {
    const startTime = Date.now()
    const endTime = Date.now()
    const traceData: TraceData = {
      traceId: this.requestId,
      spanId,
      startTime,
      endTime,
      duration: endTime - startTime,
      operationName: 'unknown',
      status,
      attributes
    }

    if (error) {
      traceData.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }

    // 发送追踪数据到后端
    this.sendTrace(traceData)
  }

  // 发送追踪数据到后端
  private async sendTrace(traceData: TraceData | Partial<TraceData>): Promise<boolean> {
    try {
      if (!this.apiUrl) {
        console.warn('后端日志API URL未配置，跳过发送追踪数据')
        return false
      }

      // 使用fetch发送追踪数据
      const response = await fetch(`${this.apiUrl}/traces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': this.requestId,
          'X-Session-Id': this.sessionId
        },
        body: JSON.stringify(traceData),
        keepalive: true
      })

      return response.ok
    } catch (error) {
      console.error('发送追踪数据到后端失败:', error)
      return false
    }
  }

  // 记录追踪事件
  recordTraceEvent(spanId: string, eventName: string, attributes?: Record<string, any>): void {
    const traceData: Partial<TraceData> = {
      traceId: this.requestId,
      spanId,
      events: [
        {
          name: eventName,
          timestamp: Date.now(),
          attributes
        }
      ]
    }

    // 发送追踪事件到后端
    this.sendTrace(traceData)
  }

  // 启用/禁用控制台日志记录
  setConsoleLogging(enabled: boolean): void {
    this.enableConsoleLogging = enabled
  }

  // 获取会话ID
  getSessionId(): string {
    return this.sessionId
  }

  // 获取请求ID
  getRequestId(): string {
    return this.requestId
  }

  // 获取当前用户ID
  getUserId(): string | undefined {
    return this.userId
  }

  // 批量发送日志
  async batchSendLogs(logs: LogData[]): Promise<boolean> {
    try {
      if (!this.apiUrl) {
        console.warn('后端日志API URL未配置，跳过批量发送日志')
        return false
      }

      // 使用fetch批量发送日志
      const response = await fetch(`${this.apiUrl}/logs/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId
        },
        body: JSON.stringify(logs),
        keepalive: true
      })

      return response.ok
    } catch (error) {
      console.error('批量发送日志到后端失败:', error)
      return false
    }
  }
}

// 创建单例实例
const backendLogService = new BackendLogService()

export default backendLogService
