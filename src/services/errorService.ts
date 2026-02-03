/**
 * 错误服务模块 - 提供错误处理、日志记录和监控功能
 */

import i18n from '../i18n/i18n';

// 错误类型定义
export interface ErrorInfo {
  errorId: string;
  errorType: string;
  errorName?: string;
  message: string;
  stackTrace?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
  deviceInfo: {
    browser: string;
    browserVersion: string;
    os: string;
    device: string;
  };
  context?: Record<string, any>;
  // 新增：错误严重程度
  severity?: 'low' | 'medium' | 'high';
  // 新增：错误发生位置
  location?: string;
}

// 错误预警配置
interface ErrorAlertConfig {
  threshold: number;
  timeWindow: number; // 时间窗口（毫秒）
  alertLevel: 'low' | 'medium' | 'high';
}

// 错误预警信息
interface ErrorAlert {
  alertId: string;
  timestamp: number;
  alertLevel: 'low' | 'medium' | 'high';
  errorCount: number;
  threshold: number;
  timeWindow: number;
  errorType?: string;
  message: string;
  isResolved: boolean;
}

// 错误日志存储 - 实现分级存储和更高效的错误管理
class ErrorLogger {
  private errors: ErrorInfo[] = [];
  private MAX_ERRORS = 100; // 最大存储错误数量
  private storageKey = 'ai_creation_platform_errors';
  private cache: Record<string, any> = {};
  private cacheExpiry = 5 * 60 * 1000; // 缓存有效期5分钟
  
  // 错误预警配置
  private alertConfigs: ErrorAlertConfig[] = [
    { threshold: 5, timeWindow: 60 * 60 * 1000, alertLevel: 'low' },     // 1小时内5个错误
    { threshold: 15, timeWindow: 60 * 60 * 1000, alertLevel: 'medium' },  // 1小时内15个错误
    { threshold: 30, timeWindow: 60 * 60 * 1000, alertLevel: 'high' },   // 1小时内30个错误
    { threshold: 100, timeWindow: 24 * 60 * 60 * 1000, alertLevel: 'high' } // 24小时内100个错误
  ];
  
  // 错误预警历史
  private alerts: ErrorAlert[] = [];
  private MAX_ALERTS = 50; // 最大存储预警数量
  private alertsStorageKey = 'ai_creation_platform_alerts';
  
  // 最近的错误计数，用于快速检查阈值
  private recentErrorCounts: Record<string, number> = {};

  constructor() {
    // 从本地存储加载错误日志和预警历史
    this.loadErrors();
    this.loadAlerts();
    
    // 初始化最近错误计数
    this.initializeRecentErrorCounts();
  }

  // 加载错误日志 - 优化：添加错误分级和排序
  private loadErrors(): void {
    try {
      const storedErrors = localStorage.getItem(this.storageKey);
      if (storedErrors) {
        const parsedErrors = JSON.parse(storedErrors);
        // 确保返回的是数组
        if (Array.isArray(parsedErrors)) {
          // 按时间倒序排序，最新的错误在前面
          this.errors = parsedErrors.sort((a, b) => b.timestamp - a.timestamp);
          // 限制错误数量
          if (this.errors.length > this.MAX_ERRORS) {
            this.errors = this.errors.slice(0, this.MAX_ERRORS);
          }
        } else {
          this.errors = [];
        }
      }
    } catch (error) {
      console.error('Failed to load error logs:', error);
      this.errors = [];
    }
    // 清除缓存
    this.clearCache();
  }

  // 处理循环引用的函数
  private safeStringify(obj: any): string {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    });
  }

  // 保存错误日志到本地存储 - 优化：实现分级存储策略
  private saveErrors(): void {
    try {
      // 1. 分级存储策略：
      // - 保留所有高优先级错误
      // - 保留70%的中优先级错误
      // - 保留30%的低优先级错误
      const highPriorityErrors = this.errors.filter(error => error.severity === 'high');
      const mediumPriorityErrors = this.errors.filter(error => error.severity === 'medium');
      const lowPriorityErrors = this.errors.filter(error => error.severity === 'low');

      // 计算各级别保留数量
      const totalReservedHigh = Math.min(highPriorityErrors.length, Math.floor(this.MAX_ERRORS * 0.5));
      const remainingSlots = this.MAX_ERRORS - totalReservedHigh;
      const totalReservedMedium = Math.min(mediumPriorityErrors.length, Math.floor(remainingSlots * 0.7));
      const totalReservedLow = Math.min(lowPriorityErrors.length, remainingSlots - totalReservedMedium);

      // 构建最终错误列表
      const finalErrors = [
        ...highPriorityErrors.slice(0, totalReservedHigh),
        ...mediumPriorityErrors.slice(0, totalReservedMedium),
        ...lowPriorityErrors.slice(0, totalReservedLow)
      ].sort((a, b) => b.timestamp - a.timestamp);

      // 保存到本地存储，使用safeStringify处理循环引用
      localStorage.setItem(this.storageKey, this.safeStringify(finalErrors));
    } catch (error) {
      const isQuotaError =
        error instanceof Error &&
        (error.name === 'QuotaExceededError' || error.message.includes('quota'));

      if (!isQuotaError) {
        console.error('Failed to save error logs:', error);
      }

      if (isQuotaError) {
        try {
          localStorage.removeItem(this.storageKey);
          const emergencyErrors = this.errors.slice(0, 5);
          localStorage.setItem(this.storageKey, this.safeStringify(emergencyErrors));
        } catch {
        }
      }
    }
    // 清除缓存
    this.clearCache();
  }

  // 记录错误 - 优化：添加错误去重和更高效的存储
  logError(error: ErrorInfo): void {
    // 1. 错误去重：避免相同错误短时间内重复记录
    const isDuplicate = this.errors.some(existingError => {
      return existingError.message === error.message && 
             existingError.errorType === error.errorType && 
             existingError.location === error.location &&
             Math.abs(existingError.timestamp - error.timestamp) < 60000; // 1分钟内的相同错误视为重复
    });

    if (isDuplicate) {
      return; // 跳过重复错误
    }

    // 2. 添加到错误列表开头
    this.errors.unshift(error);
    
    // 3. 保存到本地存储
    this.saveErrors();
    
    // 4. 发送错误到服务器 - 根据错误级别决定是否立即发送
    this.sendToServer(error);
    
    // 5. 检查错误阈值，可能触发预警
    this.checkErrorThresholds();
  }

  // 发送错误到服务器 - 优化：根据错误级别采用不同的发送策略
  private sendToServer(error: ErrorInfo): void {
    // 高优先级错误立即发送
    if (error.severity === 'high') {
      this.sendImmediate(error);
    } else {
      // 中低优先级错误延迟发送，避免过多请求
      this.sendDelayed(error);
    }
  }

  // 立即发送错误
  private sendImmediate(error: ErrorInfo): void {
    // 模拟API调用延迟
    setTimeout(() => {
      // console.log('Sending high priority error to server:', error);
      // 实际项目中，这里会发送HTTP请求到错误监控服务器
    }, 0);
  }

  // 延迟发送错误 - 实现批量发送
  private sendDelayed(error: ErrorInfo): void {
    // 简单的延迟发送实现
    setTimeout(() => {
      // console.log('Sending delayed error to server:', error);
      // 实际项目中，这里会实现批量发送逻辑
    }, 5000);
  }

  // 获取所有错误 - 优化：支持按级别和时间过滤
  getAllErrors(filters?: {
    severity?: 'low' | 'medium' | 'high';
    startTime?: number;
    endTime?: number;
    errorType?: string;
  }): ErrorInfo[] {
    let result = [...this.errors];

    // 应用过滤条件
    if (filters) {
      if (filters.severity) {
        result = result.filter(error => error.severity === filters.severity);
      }
      if (filters.startTime !== undefined) {
        result = result.filter(error => error.timestamp >= filters.startTime!);
      }
      if (filters.endTime !== undefined) {
        result = result.filter(error => error.timestamp <= filters.endTime!);
      }
      if (filters.errorType) {
        result = result.filter(error => error.errorType === filters.errorType);
      }
    }

    return result;
  }

  // 清除错误日志
  clearErrors(): void {
    this.errors = [];
    localStorage.removeItem(this.storageKey);
    this.clearCache();
  }

  // 清除指定级别的错误日志
  clearErrorsBySeverity(severity: 'low' | 'medium' | 'high'): void {
    this.errors = this.errors.filter(error => error.severity !== severity);
    this.saveErrors();
    this.clearCache();
  }

  // 获取错误统计 - 优化：添加更多统计维度
  getErrorStats(recentCount: number = 8): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byDevice: Record<string, number>;
    recent: ErrorInfo[];
    criticalErrors: ErrorInfo[];
    averageResolutionTime?: number;
    // 新增：预警相关统计
    alertStats: {
      total: number;
      unresolved: number;
      byLevel: Record<string, number>;
    };
  } {
    // 检查缓存
    const cacheKey = `errorStats_${recentCount}`;
    const now = Date.now();
    if (this.cache[cacheKey] && (now - this.cache[cacheKey].timestamp < this.cacheExpiry)) {
      return this.cache[cacheKey].data;
    }

    // 计算预警统计
    const alertByLevel = this.alerts.reduce((stats, alert) => {
      if (stats[alert.alertLevel]) {
        stats[alert.alertLevel]++;
      } else {
        stats[alert.alertLevel] = 1;
      }
      return stats;
    }, {} as Record<string, number>);

    const stats = {
      total: this.errors.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byDevice: {} as Record<string, number>,
      recent: recentCount > 0 ? this.errors.slice(0, recentCount) : [],
      criticalErrors: this.errors.filter(error => error.severity === 'high').slice(0, 10),
      alertStats: {
        total: this.alerts.length,
        unresolved: this.getUnresolvedAlertCount(),
        byLevel: alertByLevel
      }
    };

    // 按类型统计错误
    this.errors.forEach(error => {
      if (stats.byType[error.errorType]) {
        stats.byType[error.errorType]++;
      } else {
        stats.byType[error.errorType] = 1;
      }
    });

    // 按严重程度统计错误
    this.errors.forEach(error => {
      const severity = error.severity || 'medium';
      if (stats.bySeverity[severity]) {
        stats.bySeverity[severity]++;
      } else {
        stats.bySeverity[severity] = 1;
      }
    });

    // 按设备类型统计错误
    this.errors.forEach(error => {
      const device = error.deviceInfo.device;
      if (stats.byDevice[device]) {
        stats.byDevice[device]++;
      } else {
        stats.byDevice[device] = 1;
      }
    });

    // 缓存结果
    this.cache[cacheKey] = {
      data: stats,
      timestamp: now
    };

    return stats;
  }

  // 获取错误趋势 - 新增：支持按时间间隔获取错误趋势
  getErrorTrend(interval: number = 60 * 60 * 1000, timeRange: number = 24 * 60 * 60 * 1000): {
    intervals: Array<{
      startTime: number;
      endTime: number;
      count: number;
      bySeverity: Record<string, number>;
    }>;
    total: number;
  } {
    const now = Date.now();
    const startTime = now - timeRange;
    const intervals: Array<{
      startTime: number;
      endTime: number;
      count: number;
      bySeverity: Record<string, number>;
    }> = [];

    // 生成时间间隔
    let currentIntervalStart = startTime;
    while (currentIntervalStart < now) {
      const endTime = currentIntervalStart + interval;
      intervals.push({
        startTime: currentIntervalStart,
        endTime: endTime,
        count: 0,
        bySeverity: { high: 0, medium: 0, low: 0 }
      });
      currentIntervalStart = endTime;
    }

    // 统计每个时间间隔的错误数量
    this.errors.forEach(error => {
      if (error.timestamp >= startTime && error.timestamp < now) {
        const intervalIndex = Math.floor((error.timestamp - startTime) / interval);
        if (intervals[intervalIndex]) {
          intervals[intervalIndex].count++;
          const severity = error.severity || 'medium';
          intervals[intervalIndex].bySeverity[severity]++;
        }
      }
    });

    return {
      intervals,
      total: intervals.reduce((sum, interval) => sum + interval.count, 0)
    };
  }

  // 加载预警历史
  private loadAlerts(): void {
    try {
      const storedAlerts = localStorage.getItem(this.alertsStorageKey);
      if (storedAlerts) {
        const parsedAlerts = JSON.parse(storedAlerts);
        if (Array.isArray(parsedAlerts)) {
          this.alerts = parsedAlerts.sort((a, b) => b.timestamp - a.timestamp);
          if (this.alerts.length > this.MAX_ALERTS) {
            this.alerts = this.alerts.slice(0, this.MAX_ALERTS);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
      this.alerts = [];
    }
  }

  // 保存预警历史
  private saveAlerts(): void {
    try {
      localStorage.setItem(this.alertsStorageKey, JSON.stringify(this.alerts));
    } catch (error) {
      console.error('Failed to save alerts:', error);
      if (error instanceof Error && (error.name === 'QuotaExceededError' || error.message.includes('quota'))) {
          try {
              // 清空预警历史
              this.alerts = [];
              localStorage.removeItem(this.alertsStorageKey);
          } catch (e) {
              console.warn('LocalStorage is full and cleanup failed.');
          }
      }
    }
  }

  // 初始化最近错误计数
  private initializeRecentErrorCounts(): void {
    // 按不同时间窗口初始化错误计数
    const now = Date.now();
    
    // 计算不同时间窗口内的错误数量
    this.alertConfigs.forEach(config => {
      const cutoffTime = now - config.timeWindow;
      const errorCount = this.errors.filter(error => error.timestamp >= cutoffTime).length;
      this.recentErrorCounts[`${config.threshold}_${config.timeWindow}`] = errorCount;
    });
  }

  // 检查错误阈值
  private checkErrorThresholds(): void {
    const now = Date.now();
    let alertTriggered = false;

    // 检查每个预警配置
    this.alertConfigs.forEach(config => {
      const cutoffTime = now - config.timeWindow;
      const errorCount = this.errors.filter(error => error.timestamp >= cutoffTime).length;
      
      // 更新最近错误计数
      this.recentErrorCounts[`${config.threshold}_${config.timeWindow}`] = errorCount;

      // 检查是否超过阈值
      if (errorCount >= config.threshold) {
        // 检查最近是否已经触发过相同级别的预警
        const recentAlerts = this.alerts.filter(alert => 
          alert.alertLevel === config.alertLevel && 
          alert.timestamp > now - config.timeWindow &&
          !alert.isResolved
        );

        // 如果最近没有触发过相同级别的预警，则创建新预警
        if (recentAlerts.length === 0) {
          this.createAlert(config, errorCount);
          alertTriggered = true;
        }
      }
    });

    if (alertTriggered) {
      // 如果触发了预警，发送通知
      this.sendAlertNotification();
    }
  }

  // 创建预警
  private createAlert(config: ErrorAlertConfig, errorCount: number): void {
    const alertId = `alert_${Date.now().toString(36)}_${Math.random().toString(36).substr(2)}`;
    const now = Date.now();
    
    let alertMessage = '';
    if (config.timeWindow === 60 * 60 * 1000) {
      alertMessage = `在过去1小时内发生了${errorCount}个错误，超过了阈值${config.threshold}`;
    } else if (config.timeWindow === 24 * 60 * 60 * 1000) {
      alertMessage = `在过去24小时内发生了${errorCount}个错误，超过了阈值${config.threshold}`;
    } else {
      alertMessage = `在过去${config.timeWindow / (1000 * 60)}分钟内发生了${errorCount}个错误，超过了阈值${config.threshold}`;
    }

    const alert: ErrorAlert = {
      alertId,
      timestamp: now,
      alertLevel: config.alertLevel,
      errorCount,
      threshold: config.threshold,
      timeWindow: config.timeWindow,
      message: alertMessage,
      isResolved: false
    };

    // 添加到预警列表开头
    this.alerts.unshift(alert);
    
    // 限制预警数量
    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts = this.alerts.slice(0, this.MAX_ALERTS);
    }
    
    // 保存预警历史
    this.saveAlerts();
  }

  // 解决预警
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.alertId === alertId);
    if (alert) {
      alert.isResolved = true;
      this.saveAlerts();
    }
  }

  // 获取预警列表
  getAlerts(filters?: { 
    alertLevel?: 'low' | 'medium' | 'high';
    isResolved?: boolean;
    startTime?: number;
    endTime?: number;
  }): ErrorAlert[] {
    let result = [...this.alerts];

    // 应用过滤条件
    if (filters) {
      if (filters.alertLevel) {
        result = result.filter(alert => alert.alertLevel === filters.alertLevel);
      }
      if (filters.isResolved !== undefined) {
        result = result.filter(alert => alert.isResolved === filters.isResolved);
      }
      if (filters.startTime !== undefined) {
        result = result.filter(alert => alert.timestamp >= filters.startTime!);
      }
      if (filters.endTime !== undefined) {
        result = result.filter(alert => alert.timestamp <= filters.endTime!);
      }
    }

    return result;
  }

  // 获取未解决的预警数量
  getUnresolvedAlertCount(): number {
    return this.alerts.filter(alert => !alert.isResolved).length;
  }

  // 发送预警通知
  private sendAlertNotification(): void {
    // 检查浏览器是否支持通知
    if ('Notification' in window && Notification.permission === 'granted') {
      // 获取最新的未解决预警
      const latestAlert = this.alerts.find(alert => !alert.isResolved);
      if (latestAlert) {
        // 创建通知
        new Notification('错误预警', {
          body: latestAlert.message,
          icon: './icons/icon-192x192.svg',
          tag: 'error-alert',
          requireInteraction: latestAlert.alertLevel === 'high' // 高优先级预警需要用户交互
        });
      }
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      // 如果用户还没有决定是否允许通知，请求权限
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.sendAlertNotification();
        }
      });
    }
  }

  // 清除预警历史
  clearAlerts(): void {
    this.alerts = [];
    localStorage.removeItem(this.alertsStorageKey);
  }

  // 清除缓存
  private clearCache(): void {
    this.cache = {};
  }
}

// 错误代码映射 - 提供友好的错误提示
export const ERROR_MESSAGES: Record<string, string> = {
  // 网络相关错误
  'NETWORK_ERROR': '网络连接失败，请检查您的网络设置后重试。',
  'TIMEOUT_ERROR': '请求超时，请检查网络后重试，或切换至4G网络。',
  'SERVER_ERROR': '服务器暂时不可用，请稍后再试。',
  
  // 权限相关错误
  'PERMISSION_DENIED': '您没有权限执行此操作。',
  'AUTH_REQUIRED': '请先登录后再继续操作。',
  
  // 资源相关错误
  'RESOURCE_NOT_FOUND': '找不到请求的资源。',
  'RESOURCE_LOAD_FAILED': '资源加载失败，请检查网络后重试。',
  
  // 表单相关错误
  'VALIDATION_ERROR': '请检查您输入的信息是否正确。',
  'FIELD_REQUIRED': '{field} 不能为空。',
  
  // 协作相关错误
  'COLLABORATION_ERROR': '协作功能暂时不可用，请稍后再试。',
  'USER_NOT_FOUND': '找不到该用户。',
  'INVITE_ERROR': '邀请发送失败，请稍后再试。',
  
  // 模型相关错误
  'MODEL_SWITCH_ERROR': '模型切换失败，请稍后再试。',
  'MODEL_TIMEOUT': 'AI模型响应超时，请尝试切换其他模型。',
  'MODEL_ERROR': 'AI模型处理失败，请稍后再试。',
  
  // 天津素材相关错误
  'TIANJIN_ASSETS_ERROR': '天津素材库加载失败，请稍后再试。',
  '素材加载失败': '素材加载失败，请检查网络后重试，或切换至4G网络。',
  
  // 浏览器兼容性错误
  'BROWSER_COMPAT_ERROR': '您的浏览器版本过低，建议升级Chrome至90+版本以获得最佳体验。',
  
  // 默认错误
  'DEFAULT_ERROR': '操作失败，请稍后再试。'
};

// 错误修复建议
export const ERROR_FIX_SUGGESTIONS: Record<string, string[]> = {
  'NETWORK_ERROR': [
    '检查您的网络连接是否正常',
    '尝试刷新页面',
    '如果使用Wi-Fi，请尝试切换到移动数据',
    '清除浏览器缓存后重试'
  ],
  'BROWSER_COMPAT_ERROR': [
    '升级Chrome浏览器至90+版本',
    '使用其他现代浏览器如Firefox或Edge',
    '确保浏览器已启用JavaScript'
  ],
  'PERMISSION_DENIED': [
    '确认您有足够的权限执行此操作',
    '联系管理员获取帮助',
    '刷新页面并重试'
  ]
};

// 设备信息检测
const getDeviceInfo = (): {
  browser: string;
  browserVersion: string;
  os: string;
  device: string;
} => {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';
  let browserVersion = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';

  // 检测浏览器
  if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes('Safari')) {
    browser = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
    const match = userAgent.match(/Edg\/(\d+)/);
    if (match) browserVersion = match[1];
  }

  // 检测操作系统
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Macintosh')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
    device = 'Mobile';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
    device = 'Mobile';
  }

  return { browser, browserVersion, os, device };
};

// 生成错误ID
const generateErrorId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 错误服务类
class ErrorService {
  private logger = new ErrorLogger();

  /**
   * 获取友好的错误提示信息
   * @param errorCode 错误代码
   * @param params 替换参数（如字段名等）
   * @returns 格式化的错误信息
   */
  getFriendlyErrorMessage(errorCode: string, params: Record<string, string> = {}): string {
    // 使用i18n获取错误消息，支持多语言
    let message = i18n.t(`error.${errorCode}`) as string;
    
    // 如果i18n没有找到对应的错误消息，使用默认错误消息
    if (message === `error.${errorCode}`) {
      message = i18n.t('error.DEFAULT_ERROR') as string;
    }
    
    // 替换占位符
    Object.keys(params).forEach(key => {
      const placeholder = `{${key}}`;
      if (message.includes(placeholder)) {
        message = message.replace(placeholder, params[key]);
      }
    });
    
    return message;
  }

  /**
   * 获取错误修复建议
   * @param errorCode 错误代码
   * @returns 修复建议数组
   */
  getErrorFixSuggestions(errorCode: string): string[] {
    return ERROR_FIX_SUGGESTIONS[errorCode] || ['请尝试刷新页面后重试', '如果问题持续，请联系客服获取帮助'];
  }

  /**
   * 记录错误
   * @param error 错误对象或错误代码
   * @param context 错误上下文信息
   */
  logError(error: Error | string, context: Record<string, any> = {}): ErrorInfo {
    let errorType = 'UNKNOWN_ERROR';
    let message = '未知错误';
    let stackTrace = '';
    let errorName = 'Error';

    if (error instanceof Error) {
      message = error.message;
      stackTrace = error.stack || '';
      errorName = error.name;
      
      // 从错误名称提取错误类型
      if (errorName === 'TypeError') {
        errorType = 'TYPE_ERROR';
      } else if (errorName === 'ReferenceError') {
        errorType = 'REFERENCE_ERROR';
      } else if (errorName === 'RangeError') {
        errorType = 'RANGE_ERROR';
      } else if (errorName === 'SyntaxError') {
        errorType = 'SYNTAX_ERROR';
      } else if (errorName === 'URIError') {
        errorType = 'URI_ERROR';
      } else if (errorName === 'EvalError') {
        errorType = 'EVAL_ERROR';
      } else if (errorName === 'AggregateError') {
        errorType = 'AGGREGATE_ERROR';
      }
      
      // 从错误消息提取更具体的错误类型
      if (message.includes('NetworkError') || message.includes('Failed to fetch') || message.includes('net::ERR_')) {
        errorType = 'NETWORK_ERROR';
      } else if (message.includes('timeout') || message.includes('Timeout')) {
        errorType = 'TIMEOUT_ERROR';
      } else if (message.includes('Permission denied') || message.includes('permission')) {
        errorType = 'PERMISSION_DENIED';
      } else if (message.includes('Not found') || message.includes('404')) {
        errorType = 'RESOURCE_NOT_FOUND';
      } else if (message.includes('CORS') || message.includes('cross-origin')) {
        errorType = 'CORS_ERROR';
      } else if (message.includes('Invalid token') || message.includes('Unauthorized') || message.includes('401')) {
        errorType = 'AUTH_ERROR';
      } else if (message.includes('Forbidden') || message.includes('403')) {
        errorType = 'FORBIDDEN_ERROR';
      } else if (message.includes('Server') || message.includes('500')) {
        errorType = 'SERVER_ERROR';
      } else if (message.includes('Texture') || message.includes('texture')) {
        errorType = 'TEXTURE_ERROR';
      } else if (message.includes('Model') || message.includes('model')) {
        errorType = 'MODEL_ERROR';
      } else if (message.includes('Canvas') || message.includes('canvas')) {
        errorType = 'CANVAS_ERROR';
      } else if (message.includes('WebGL') || message.includes('webgl')) {
        errorType = 'WEBGL_ERROR';
      }
    } else {
      errorType = error;
      message = this.getFriendlyErrorMessage(error);
    }

    // 增强错误上下文
    const enhancedContext = {
      ...context,
      // 添加页面信息
      page: {
        url: window.location.href,
        path: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash
      },
      // 添加浏览器信息
      browser: {
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        isMobile: window.innerWidth < 768,
        scrollPosition: {
          x: window.scrollX,
          y: window.scrollY
        }
      },
      // 添加内存使用信息
      memory: 'performance' in window && 'memory' in performance 
        ? { 
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize, 
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
          } 
        : undefined,
      // 添加导航信息
      navigation: {
        referrer: document.referrer,
        navigationType: window.performance?.navigation?.type || 'unknown'
      },
      // 添加时间信息
      time: {
        timestamp: Date.now(),
        isoString: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    // 计算错误严重程度
    let severity: 'low' | 'medium' | 'high' = 'medium';
    const highSeverityErrors = ['SERVER_ERROR', 'AUTH_ERROR', 'NETWORK_ERROR', 'TIMEOUT_ERROR', 'PERMISSION_DENIED', 'FORBIDDEN_ERROR'];
    const lowSeverityErrors = ['TYPE_ERROR', 'REFERENCE_ERROR', 'SYNTAX_ERROR', 'URI_ERROR', 'RANGE_ERROR'];
    
    if (highSeverityErrors.includes(errorType)) {
      severity = 'high';
    } else if (lowSeverityErrors.includes(errorType)) {
      severity = 'low';
    }
    
    // 从堆栈跟踪中提取错误发生位置
    let location = '';
    if (stackTrace) {
      const stackLines = stackTrace.split('\n');
      // 查找第一个非errorService的堆栈行
      const appStackLine = stackLines.find(line => 
        line.includes('src/') && !line.includes('errorService')
      );
      if (appStackLine) {
        // 提取文件路径和行号
        const match = appStackLine.match(/(src\/[^:]+):(\d+):(\d+)/);
        if (match) {
          location = `${match[1]}:${match[2]}`;
        }
      }
    }
    
    const errorInfo: ErrorInfo = {
      errorId: generateErrorId(),
      errorType,
      errorName,
      message,
      stackTrace,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      deviceInfo: getDeviceInfo(),
      context: enhancedContext,
      severity,
      location
    };

    // 记录错误
    this.logger.logError(errorInfo);
    
    // 自动上报错误到服务器
    this.reportErrorToServer(errorInfo).catch(err => {
      console.warn('Failed to report error to server:', err);
    });
    
    return errorInfo;
  }

  /**
   * 获取错误日志统计
   */
  getErrorStats(recentCount: number = 8) {
    return this.logger.getErrorStats(recentCount);
  }

  /**
   * 获取错误分类统计
   * @param timeRange 时间范围（毫秒），默认24小时
   */
  getErrorCategoryStats(timeRange: number = 24 * 60 * 60 * 1000) {
    const allErrors = this.logger.getAllErrors();
    const cutoffTime = Date.now() - timeRange;
    const recentErrors = allErrors.filter(error => error.timestamp >= cutoffTime);
    
    // 按错误类型分类
    const categoryStats = recentErrors.reduce((stats, error) => {
      if (stats[error.errorType]) {
        stats[error.errorType]++;
      } else {
        stats[error.errorType] = 1;
      }
      return stats;
    }, {} as Record<string, number>);
    
    // 按设备类型分类
    const deviceStats = recentErrors.reduce((stats, error) => {
      const deviceType = error.deviceInfo.device;
      if (stats[deviceType]) {
        stats[deviceType]++;
      } else {
        stats[deviceType] = 1;
      }
      return stats;
    }, {} as Record<string, number>);
    
    // 按浏览器分类
    const browserStats = recentErrors.reduce((stats, error) => {
      const browser = `${error.deviceInfo.browser} v${error.deviceInfo.browserVersion}`;
      if (stats[browser]) {
        stats[browser]++;
      } else {
        stats[browser] = 1;
      }
      return stats;
    }, {} as Record<string, number>);
    
    // 按操作系统分类
    const osStats = recentErrors.reduce((stats, error) => {
      const os = error.deviceInfo.os;
      if (stats[os]) {
        stats[os]++;
      } else {
        stats[os] = 1;
      }
      return stats;
    }, {} as Record<string, number>);
    
    return {
      total: recentErrors.length,
      byCategory: categoryStats,
      byDevice: deviceStats,
      byBrowser: browserStats,
      byOS: osStats,
      timeRange,
      cutoffTime
    };
  }

  /**
   * 获取错误趋势统计
   * @param interval 时间间隔（毫秒），默认1小时
   * @param timeRange 时间范围（毫秒），默认24小时
   */
  getErrorTrendStats(interval: number = 60 * 60 * 1000, timeRange: number = 24 * 60 * 60 * 1000) {
    const allErrors = this.logger.getAllErrors();
    const cutoffTime = Date.now() - timeRange;
    const recentErrors = allErrors.filter(error => error.timestamp >= cutoffTime);
    
    // 按时间间隔分组
    const trendStats = recentErrors.reduce((stats, error) => {
      const intervalKey = Math.floor(error.timestamp / interval) * interval;
      if (stats[intervalKey]) {
        stats[intervalKey]++;
      } else {
        stats[intervalKey] = 1;
      }
      return stats;
    }, {} as Record<number, number>);
    
    // 转换为数组格式，便于图表展示
    const trendArray = Object.entries(trendStats)
      .map(([timestamp, count]) => ({
        timestamp: parseInt(timestamp),
        count
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
    
    return {
      trend: trendArray,
      interval,
      timeRange,
      cutoffTime
    };
  }

  /**
   * 上报错误到远程服务器
   * @param errorInfo 错误信息
   * @returns Promise<boolean> 上报是否成功
   */
  async reportErrorToServer(errorInfo: ErrorInfo): Promise<boolean> {
    try {
      // 检查是否配置了错误上报URL
      // 使用安全的方式访问环境变量，避免process未定义错误
      let reportUrl = '';
      // 检查window对象是否存在（浏览器环境）
      if (typeof window !== 'undefined') {
        // 从window对象获取环境变量（Vite构建时会注入）
        reportUrl = (window as any).env?.REACT_APP_ERROR_REPORT_URL || 
                   (window as any).env?.NEXT_PUBLIC_ERROR_REPORT_URL || 
                   '';
      }
      
      if (!reportUrl) {
        console.warn('错误上报URL未配置，跳过上报');
        return false;
      }
      
      // 发送错误报告
      const response = await fetch(reportUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorInfo),
        keepalive: true // 允许在页面卸载时继续发送请求
      });
      
      return response.ok;
    } catch (error) {
      console.error('错误上报失败:', error);
      return false;
    }
  }

  /**
   * 批量上报错误到远程服务器
   * @param limit 批量上报的最大数量
   * @returns Promise<number> 成功上报的错误数量
   */
  async batchReportErrors(limit: number = 10): Promise<number> {
    const stats = this.getErrorStats();
    const errorsToReport = stats.recent.slice(0, limit);
    
    let successCount = 0;
    for (const error of errorsToReport) {
      const success = await this.reportErrorToServer(error);
      if (success) {
        successCount++;
      }
    }
    
    return successCount;
  }

  clearErrors() {
    this.logger.clearErrors();
  }

  /**
   * 获取错误预警列表
   */
  getAlerts(filters?: {
    alertLevel?: 'low' | 'medium' | 'high';
    isResolved?: boolean;
    startTime?: number;
    endTime?: number;
  }) {
    return this.logger.getAlerts(filters);
  }

  /**
   * 解决错误预警
   */
  resolveAlert(alertId: string) {
    return this.logger.resolveAlert(alertId);
  }

  /**
   * 获取未解决的错误预警数量
   */
  getUnresolvedAlertCount() {
    return this.logger.getUnresolvedAlertCount();
  }

  /**
   * 清除错误预警历史
   */
  clearAlerts() {
    this.logger.clearAlerts?.();
  }

  /**
   * 检查浏览器兼容性
   */
  checkBrowserCompatibility(): {
    isCompatible: boolean;
    message?: string;
  } {
    const deviceInfo = getDeviceInfo();
    
    // 检查浏览器版本
    if (deviceInfo.browser === 'Chrome' && parseInt(deviceInfo.browserVersion) < 90) {
      return {
        isCompatible: false,
        message: this.getFriendlyErrorMessage('BROWSER_COMPAT_ERROR')
      };
    }
    
    return { isCompatible: true };
  }
}

// 导出单例实例
export default new ErrorService();
