// 简单的日志查看器工具

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  context?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  log(level: LogEntry['level'], message: string, data?: any, context?: any): void {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level,
      message,
      data,
      context
    };

    this.logs.push(entry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  info(message: string, data?: any, context?: any): void {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: any, context?: any): void {
    this.log('warn', message, data, context);
  }

  error(message: string, data?: any, context?: any): void {
    this.log('error', message, data, context);
  }

  debug(message: string, data?: any, context?: any): void {
    this.log('debug', message, data, context);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getRecentLogs(count: number): LogEntry[] {
    return this.logs.slice(-count);
  }

  clear(): void {
    this.logs = [];
  }

  // 别名方法，用于兼容
  clearLogs(): void {
    this.clear();
  }
}

export const logger = new Logger();
