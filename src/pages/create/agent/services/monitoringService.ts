/**
 * 智能监控服务 - Intelligent Monitoring Service
 * 
 * 功能特性:
 * - 性能监控: 追踪API响应时间、内存使用、渲染性能
 * - 错误追踪: 自动捕获和上报错误
 * - 用户行为分析: 追踪用户交互模式
 * - 服务质量监控: 监控AI服务的可用性和质量
 * - 实时告警: 异常情况自动告警
 * - 健康检查: 系统健康状态监控
 */

import { indexedDBStorage, StoreName } from './indexedDBStorage';

// 监控配置
export interface MonitoringConfig {
  enabled: boolean;
  sampleRate: number; // 采样率 0-1
  errorTracking: boolean;
  performanceTracking: boolean;
  userBehaviorTracking: boolean;
  alertThresholds: AlertThresholds;
  reportInterval: number; // 上报间隔(ms)
  maxEventsPerBatch: number;
}

// 告警阈值
export interface AlertThresholds {
  apiResponseTime: number; // API响应时间阈值(ms)
  errorRate: number; // 错误率阈值(0-1)
  memoryUsage: number; // 内存使用阈值(MB)
  cpuUsage: number; // CPU使用阈值(0-1)
  failedRequests: number; // 连续失败请求阈值
}

// 监控事件
export interface MonitoringEvent {
  id: string;
  type: EventType;
  category: EventCategory;
  timestamp: number;
  sessionId: string;
  userId?: string;
  data: Record<string, any>;
  metadata: EventMetadata;
}

// 事件类型
export type EventType =
  | 'api_call'
  | 'api_error'
  | 'render_slow'
  | 'memory_warning'
  | 'user_action'
  | 'ai_response'
  | 'ai_error'
  | 'system_error'
  | 'performance_metric'
  | 'custom';

// 事件分类
export type EventCategory =
  | 'performance'
  | 'error'
  | 'user_behavior'
  | 'ai_service'
  | 'system';

// 事件元数据
export interface EventMetadata {
  url: string;
  userAgent: string;
  screenSize: string;
  viewport: string;
  referrer: string;
}

// 性能指标
export interface PerformanceMetrics {
  timestamp: number;
  navigationTiming?: NavigationTiming;
  resourceTiming?: ResourceTiming[];
  memoryInfo?: MemoryInfo;
  paintTiming?: PaintTiming;
  longTasks?: LongTask[];
  fps?: number;
}

// 导航计时
export interface NavigationTiming {
  dnsLookup: number;
  tcpConnection: number;
  serverResponse: number;
  domProcessing: number;
  resourceLoad: number;
  totalLoad: number;
}

// 资源计时
export interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: string;
}

// 内存信息
export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// 绘制计时
export interface PaintTiming {
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint?: number;
}

// 长任务
export interface LongTask {
  duration: number;
  startTime: number;
}

// 错误信息
export interface ErrorInfo {
  id: string;
  type: 'javascript' | 'resource' | 'promise' | 'api' | 'ai';
  message: string;
  stack?: string;
  source?: string;
  line?: number;
  column?: number;
  timestamp: number;
  userAgent: string;
  url: string;
  context?: Record<string, any>;
}

// 服务质量指标
export interface ServiceQualityMetrics {
  timestamp: number;
  serviceName: string;
  availability: number; // 可用性 0-1
  avgResponseTime: number;
  successRate: number;
  errorRate: number;
  requestCount: number;
  satisfactionScore?: number;
}

// 用户行为指标
export interface UserBehaviorMetrics {
  sessionId: string;
  timestamp: number;
  action: string;
  element?: string;
  duration?: number;
  path: string;
  referrer?: string;
  metadata?: Record<string, any>;
}

// 告警信息
export interface Alert {
  id: string;
  type: AlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  metadata: Record<string, any>;
}

// 告警类型
export type AlertType =
  | 'high_error_rate'
  | 'slow_api_response'
  | 'high_memory_usage'
  | 'service_unavailable'
  | 'ai_quality_degradation'
  | 'custom';

// 健康检查结果
export interface HealthCheckResult {
  timestamp: number;
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    message?: string;
  }[];
}

// 监控报告
export interface MonitoringReport {
  period: { start: number; end: number };
  summary: {
    totalEvents: number;
    errorCount: number;
    avgResponseTime: number;
    userSessions: number;
    pageViews: number;
  };
  performance: PerformanceMetrics;
  errors: ErrorInfo[];
  serviceQuality: ServiceQualityMetrics[];
  topIssues: { issue: string; count: number; severity: string }[];
}

// 默认配置
const DEFAULT_CONFIG: MonitoringConfig = {
  enabled: true,
  sampleRate: 1.0,
  errorTracking: true,
  performanceTracking: true,
  userBehaviorTracking: true,
  alertThresholds: {
    apiResponseTime: 5000,
    errorRate: 0.05,
    memoryUsage: 500,
    cpuUsage: 0.8,
    failedRequests: 5
  },
  reportInterval: 60000,
  maxEventsPerBatch: 100
};

class MonitoringService {
  private config: MonitoringConfig;
  private sessionId: string;
  private eventBuffer: MonitoringEvent[] = [];
  private errorBuffer: ErrorInfo[] = [];
  private performanceObserver?: PerformanceObserver;
  private longTaskObserver?: PerformanceObserver;
  private navigationObserver?: PerformanceObserver;
  private reportTimer?: number;
  private alertHandlers: ((alert: Alert) => void)[] = [];
  private consecutiveFailures: Map<string, number> = new Map();
  private serviceMetrics: Map<string, ServiceQualityMetrics> = new Map();

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    
    if (this.config.enabled) {
      this.initialize();
    }
  }

  // 初始化监控
  private initialize(): void {
    this.setupErrorTracking();
    this.setupPerformanceTracking();
    this.setupUserBehaviorTracking();
    this.startReporting();
  }

  // 生成会话ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 生成事件ID
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 生成告警ID
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 获取事件元数据
  private getEventMetadata(): EventMetadata {
    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      referrer: document.referrer
    };
  }

  // 设置错误追踪
  private setupErrorTracking(): void {
    if (!this.config.errorTracking) return;

    // JavaScript错误
    window.addEventListener('error', (event) => {
      this.trackError({
        type: 'javascript',
        message: event.message,
        stack: event.error?.stack,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    });

    // Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'promise',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    });

    // 资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target && (event.target as HTMLElement).tagName) {
        const target = event.target as HTMLElement;
        this.trackError({
          type: 'resource',
          message: `Failed to load resource: ${target.tagName}`,
          source: (target as any).src || (target as any).href,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        });
      }
    }, true);
  }

  // 设置性能追踪
  private setupPerformanceTracking(): void {
    if (!this.config.performanceTracking) return;

    // 长任务监控
    if ('PerformanceObserver' in window) {
      this.longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackEvent({
            id: this.generateEventId(),
            type: 'render_slow',
            category: 'performance',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            data: {
              duration: entry.duration,
              startTime: entry.startTime
            },
            metadata: this.getEventMetadata()
          });

          // 检查是否需要告警
          if (entry.duration > 50) {
            this.triggerAlert({
              id: this.generateAlertId(),
              type: 'slow_api_response',
              severity: entry.duration > 100 ? 'high' : 'medium',
              title: '检测到长任务',
              message: `主线程被阻塞 ${entry.duration.toFixed(2)}ms`,
              timestamp: Date.now(),
              resolved: false,
              metadata: { duration: entry.duration }
            });
          }
        }
      });

      try {
        this.longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.warn('Long task observation not supported');
      }

      // 导航计时
      this.navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.trackPerformanceMetrics({
              timestamp: Date.now(),
              navigationTiming: {
                dnsLookup: navEntry.domainLookupEnd - navEntry.domainLookupStart,
                tcpConnection: navEntry.connectEnd - navEntry.connectStart,
                serverResponse: navEntry.responseEnd - navEntry.requestStart,
                domProcessing: navEntry.domComplete - navEntry.domInteractive,
                resourceLoad: navEntry.loadEventEnd - navEntry.loadEventStart,
                totalLoad: navEntry.loadEventEnd - navEntry.startTime
              }
            });
          }
        }
      });

      try {
        this.navigationObserver.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        console.warn('Navigation observation not supported');
      }
    }

    // 内存监控
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          const usedMB = memory.usedJSHeapSize / 1048576;
          
          this.trackPerformanceMetrics({
            timestamp: Date.now(),
            memoryInfo: {
              usedJSHeapSize: memory.usedJSHeapSize,
              totalJSHeapSize: memory.totalJSHeapSize,
              jsHeapSizeLimit: memory.jsHeapSizeLimit
            }
          });

          // 内存告警
          if (usedMB > this.config.alertThresholds.memoryUsage) {
            this.triggerAlert({
              id: this.generateAlertId(),
              type: 'high_memory_usage',
              severity: usedMB > this.config.alertThresholds.memoryUsage * 1.5 ? 'critical' : 'high',
              title: '内存使用过高',
              message: `当前内存使用: ${usedMB.toFixed(2)}MB`,
              timestamp: Date.now(),
              resolved: false,
              metadata: { memoryUsage: usedMB }
            });
          }
        }
      }, 30000);
    }
  }

  // 设置用户行为追踪
  private setupUserBehaviorTracking(): void {
    if (!this.config.userBehaviorTracking) return;

    // 点击追踪
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.trackUserBehavior({
        sessionId: this.sessionId,
        timestamp: Date.now(),
        action: 'click',
        element: target.tagName + (target.id ? `#${target.id}` : '') + (target.className ? `.${target.className.split(' ').join('.')}` : ''),
        path: window.location.pathname,
        metadata: {
          text: target.textContent?.substring(0, 100),
          coordinates: { x: event.clientX, y: event.clientY }
        }
      });
    });

    // 页面可见性变化
    document.addEventListener('visibilitychange', () => {
      this.trackUserBehavior({
        sessionId: this.sessionId,
        timestamp: Date.now(),
        action: document.visibilityState === 'hidden' ? 'page_hide' : 'page_show',
        path: window.location.pathname
      });
    });

    // 路由变化 (用于SPA)
    const originalPushState = history.pushState;
    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.trackUserBehavior({
        sessionId: this.sessionId,
        timestamp: Date.now(),
        action: 'navigation',
        path: window.location.pathname,
        referrer: document.referrer
      });
    };
  }

  // 开始定时上报
  private startReporting(): void {
    this.reportTimer = window.setInterval(() => {
      this.flushEvents();
    }, this.config.reportInterval);
  }

  // 追踪事件
  trackEvent(event: Omit<MonitoringEvent, 'id' | 'sessionId' | 'metadata'> & { id?: string; metadata?: Partial<EventMetadata> }): void {
    if (!this.config.enabled) return;
    if (Math.random() > this.config.sampleRate) return;

    const fullEvent: MonitoringEvent = {
      ...event,
      id: event.id || this.generateEventId(),
      sessionId: this.sessionId,
      metadata: { ...this.getEventMetadata(), ...event.metadata },
      timestamp: event.timestamp || Date.now()
    };

    this.eventBuffer.push(fullEvent);

    // 立即保存重要事件
    if (event.category === 'error' || event.type === 'ai_error') {
      this.saveEventImmediately(fullEvent);
    }

    // 批量处理
    if (this.eventBuffer.length >= this.config.maxEventsPerBatch) {
      this.flushEvents();
    }
  }

  // 立即保存事件
  private async saveEventImmediately(event: MonitoringEvent): Promise<void> {
    try {
      await indexedDBStorage.save(StoreName.CACHE, {
        key: `event_${event.id}`,
        data: event,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  }

  // 追踪错误
  trackError(error: Omit<ErrorInfo, 'id'>): void {
    const errorInfo: ErrorInfo = {
      ...error,
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.errorBuffer.push(errorInfo);

    // 追踪错误事件
    this.trackEvent({
      type: error.type === 'ai' ? 'ai_error' : 'system_error',
      category: 'error',
      timestamp: error.timestamp,
      data: {
        errorId: errorInfo.id,
        message: error.message,
        type: error.type
      }
    });

    // 检查错误率告警
    this.checkErrorRateAlert();
  }

  // 检查错误率告警
  private checkErrorRateAlert(): void {
    const recentErrors = this.errorBuffer.filter(
      e => e.timestamp > Date.now() - 60000
    );
    const errorRate = recentErrors.length / Math.max(this.eventBuffer.length, 1);

    if (errorRate > this.config.alertThresholds.errorRate) {
      this.triggerAlert({
        id: this.generateAlertId(),
        type: 'high_error_rate',
        severity: errorRate > 0.2 ? 'critical' : 'high',
        title: '错误率过高',
        message: `最近1分钟错误率: ${(errorRate * 100).toFixed(2)}%`,
        timestamp: Date.now(),
        resolved: false,
        metadata: { errorRate, errorCount: recentErrors.length }
      });
    }
  }

  // 追踪性能指标
  trackPerformanceMetrics(metrics: Partial<PerformanceMetrics>): void {
    this.trackEvent({
      type: 'performance_metric',
      category: 'performance',
      timestamp: metrics.timestamp || Date.now(),
      data: metrics
    });
  }

  // 追踪用户行为
  trackUserBehavior(behavior: UserBehaviorMetrics): void {
    this.trackEvent({
      type: 'user_action',
      category: 'user_behavior',
      timestamp: behavior.timestamp,
      userId: behavior.sessionId,
      data: behavior
    });
  }

  // 追踪API调用
  trackApiCall(
    apiName: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    this.trackEvent({
      type: success ? 'api_call' : 'api_error',
      category: success ? 'performance' : 'error',
      timestamp: Date.now(),
      data: {
        apiName,
        duration,
        success,
        ...metadata
      }
    });

    // 更新服务质量指标
    this.updateServiceMetrics(apiName, duration, success);

    // 检查API响应时间告警
    if (duration > this.config.alertThresholds.apiResponseTime) {
      this.triggerAlert({
        id: this.generateAlertId(),
        type: 'slow_api_response',
        severity: duration > this.config.alertThresholds.apiResponseTime * 2 ? 'high' : 'medium',
        title: 'API响应缓慢',
        message: `${apiName} 响应时间: ${duration}ms`,
        timestamp: Date.now(),
        resolved: false,
        metadata: { apiName, duration }
      });
    }
  }

  // 追踪AI服务调用
  trackAiService(
    serviceName: string,
    duration: number,
    success: boolean,
    qualityScore?: number,
    metadata?: Record<string, any>
  ): void {
    this.trackEvent({
      type: success ? 'ai_response' : 'ai_error',
      category: 'ai_service',
      timestamp: Date.now(),
      data: {
        serviceName,
        duration,
        success,
        qualityScore,
        ...metadata
      }
    });

    // 更新AI服务质量指标
    this.updateServiceMetrics(serviceName, duration, success, qualityScore);

    // 检查连续失败
    if (!success) {
      const currentFailures = (this.consecutiveFailures.get(serviceName) || 0) + 1;
      this.consecutiveFailures.set(serviceName, currentFailures);

      if (currentFailures >= this.config.alertThresholds.failedRequests) {
        this.triggerAlert({
          id: this.generateAlertId(),
          type: 'service_unavailable',
          severity: 'critical',
          title: 'AI服务不可用',
          message: `${serviceName} 连续失败 ${currentFailures} 次`,
          timestamp: Date.now(),
          resolved: false,
          metadata: { serviceName, consecutiveFailures: currentFailures }
        });
      }
    } else {
      this.consecutiveFailures.set(serviceName, 0);
    }

    // 质量下降告警
    if (qualityScore !== undefined && qualityScore < 0.5) {
      this.triggerAlert({
        id: this.generateAlertId(),
        type: 'ai_quality_degradation',
        severity: qualityScore < 0.3 ? 'high' : 'medium',
        title: 'AI输出质量下降',
        message: `${serviceName} 质量评分: ${(qualityScore * 100).toFixed(1)}%`,
        timestamp: Date.now(),
        resolved: false,
        metadata: { serviceName, qualityScore }
      });
    }
  }

  // 更新服务质量指标
  private updateServiceMetrics(
    serviceName: string,
    duration: number,
    success: boolean,
    qualityScore?: number
  ): void {
    const existing = this.serviceMetrics.get(serviceName);
    const timestamp = Date.now();

    if (existing) {
      const totalRequests = existing.requestCount + 1;
      existing.avgResponseTime = 
        (existing.avgResponseTime * existing.requestCount + duration) / totalRequests;
      existing.successRate = 
        (existing.successRate * existing.requestCount + (success ? 1 : 0)) / totalRequests;
      existing.errorRate = 1 - existing.successRate;
      existing.requestCount = totalRequests;
      existing.timestamp = timestamp;
      
      if (qualityScore !== undefined) {
        existing.satisfactionScore = 
          ((existing.satisfactionScore || 0) * (totalRequests - 1) + qualityScore) / totalRequests;
      }
    } else {
      this.serviceMetrics.set(serviceName, {
        timestamp,
        serviceName,
        availability: success ? 1 : 0,
        avgResponseTime: duration,
        successRate: success ? 1 : 0,
        errorRate: success ? 0 : 1,
        requestCount: 1,
        satisfactionScore: qualityScore
      });
    }
  }

  // 触发告警
  private triggerAlert(alert: Alert): void {
    // 保存告警
    this.saveAlert(alert);

    // 通知所有处理器
    this.alertHandlers.forEach(handler => {
      try {
        handler(alert);
      } catch (error) {
        console.error('Alert handler error:', error);
      }
    });
  }

  // 保存告警
  private async saveAlert(alert: Alert): Promise<void> {
    try {
      await indexedDBStorage.save(StoreName.CACHE, {
        key: `alert_${alert.id}`,
        data: alert,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to save alert:', error);
    }
  }

  // 添加告警处理器
  onAlert(handler: (alert: Alert) => void): () => void {
    this.alertHandlers.push(handler);
    return () => {
      const index = this.alertHandlers.indexOf(handler);
      if (index > -1) {
        this.alertHandlers.splice(index, 1);
      }
    };
  }

  // 刷新事件到存储
  private async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      // 批量保存到IndexedDB
      for (const event of events) {
        await indexedDBStorage.save(StoreName.CACHE, {
          key: `event_${event.id}`,
          data: event,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to flush events:', error);
      // 失败时恢复缓冲区
      this.eventBuffer.unshift(...events);
    }
  }

  // 健康检查
  async healthCheck(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = [];
    const timestamp = Date.now();

    // 检查IndexedDB
    const dbStart = performance.now();
    try {
      await indexedDBStorage.save(StoreName.CACHE, {
        key: 'health_check',
        data: { timestamp },
        timestamp
      });
      checks.push({
        name: 'indexeddb',
        status: 'healthy',
        responseTime: performance.now() - dbStart
      });
    } catch (error) {
      checks.push({
        name: 'indexeddb',
        status: 'unhealthy',
        responseTime: performance.now() - dbStart,
        message: 'IndexedDB不可用'
      });
    }

    // 检查内存使用
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1048576;
      checks.push({
        name: 'memory',
        status: usedMB > this.config.alertThresholds.memoryUsage ? 'degraded' : 'healthy',
        responseTime: 0,
        message: `使用: ${usedMB.toFixed(2)}MB`
      });
    }

    // 检查错误率
    const recentErrors = this.errorBuffer.filter(e => e.timestamp > timestamp - 300000);
    const totalEvents = this.eventBuffer.length + recentErrors.length;
    const errorRate = recentErrors.length / Math.max(totalEvents, 1);
    checks.push({
      name: 'error_rate',
      status: errorRate > this.config.alertThresholds.errorRate ? 'degraded' : 'healthy',
      responseTime: 0,
      message: `错误率: ${(errorRate * 100).toFixed(2)}%`
    });

    // 确定整体状态
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;
    
    let overall: HealthCheckResult['overall'] = 'healthy';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    }

    return {
      timestamp,
      overall,
      checks
    };
  }

  // 生成监控报告
  async generateReport(period: { start: number; end: number } = {
    start: Date.now() - 86400000,
    end: Date.now()
  }): Promise<MonitoringReport> {
    // 获取缓存的事件
    const cachedEvents = await indexedDBStorage.getAll(StoreName.CACHE, {
      indexName: 'timestamp',
      range: { lower: period.start, upper: period.end }
    });

    const events = cachedEvents
      .filter((item: any) => item.key.startsWith('event_'))
      .map((item: any) => item.data as MonitoringEvent);

    const errors = this.errorBuffer.filter(
      e => e.timestamp >= period.start && e.timestamp <= period.end
    );

    // 计算汇总数据
    const totalEvents = events.length;
    const errorCount = errors.length;
    const apiEvents = events.filter(e => e.type === 'api_call');
    const avgResponseTime = apiEvents.length > 0
      ? apiEvents.reduce((sum, e) => sum + (e.data.duration || 0), 0) / apiEvents.length
      : 0;

    const sessions = new Set(events.map(e => e.sessionId));
    const pageViews = events.filter(e => e.type === 'user_action' && e.data.action === 'navigation').length;

    // 统计主要问题
    const issueCounts = new Map<string, number>();
    errors.forEach(error => {
      const key = `${error.type}: ${error.message}`;
      issueCounts.set(key, (issueCounts.get(key) || 0) + 1);
    });

    const topIssues = Array.from(issueCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue, count]) => ({
        issue,
        count,
        severity: count > 10 ? 'high' : count > 5 ? 'medium' : 'low'
      }));

    return {
      period,
      summary: {
        totalEvents,
        errorCount,
        avgResponseTime,
        userSessions: sessions.size,
        pageViews
      },
      performance: await this.getPerformanceMetrics(),
      errors,
      serviceQuality: Array.from(this.serviceMetrics.values()),
      topIssues
    };
  }

  // 获取性能指标
  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const metrics: PerformanceMetrics = {
      timestamp: Date.now()
    };

    // 内存信息
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metrics.memoryInfo = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }

    // 导航计时
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      metrics.navigationTiming = {
        dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcpConnection: navigation.connectEnd - navigation.connectStart,
        serverResponse: navigation.responseEnd - navigation.requestStart,
        domProcessing: navigation.domComplete - navigation.domInteractive,
        resourceLoad: navigation.loadEventEnd - navigation.loadEventStart,
        totalLoad: navigation.loadEventEnd - navigation.startTime
      };
    }

    return metrics;
  }

  // 获取服务质量指标
  getServiceQualityMetrics(serviceName?: string): ServiceQualityMetrics | ServiceQualityMetrics[] | undefined {
    if (serviceName) {
      return this.serviceMetrics.get(serviceName);
    }
    return Array.from(this.serviceMetrics.values());
  }

  // 更新配置
  updateConfig(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // 获取当前配置
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  // 销毁服务
  destroy(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }

    this.performanceObserver?.disconnect();
    this.longTaskObserver?.disconnect();
    this.navigationObserver?.disconnect();

    this.flushEvents();
  }
}

// 创建单例实例
export const monitoringService = new MonitoringService();

// 导出便捷函数
export const trackEvent = (event: Parameters<MonitoringService['trackEvent']>[0]) => 
  monitoringService.trackEvent(event);

export const trackError = (error: Parameters<MonitoringService['trackError']>[0]) => 
  monitoringService.trackError(error);

export const trackApiCall = (apiName: string, duration: number, success: boolean, metadata?: Record<string, any>) => 
  monitoringService.trackApiCall(apiName, duration, success, metadata);

export const trackAiService = (
  serviceName: string,
  duration: number,
  success: boolean,
  qualityScore?: number,
  metadata?: Record<string, any>
) => monitoringService.trackAiService(serviceName, duration, success, qualityScore, metadata);

export default monitoringService;
