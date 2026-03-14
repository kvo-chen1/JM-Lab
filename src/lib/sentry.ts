import * as Sentry from '@sentry/react';

/**
 * Sentry 错误监控配置
 * 用于收集应用错误和性能数据
 */

// Sentry DSN - 实际使用时需要替换为真实的 DSN
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';

// 环境配置
const ENVIRONMENT = import.meta.env.MODE || 'development';
const RELEASE = import.meta.env.VITE_APP_VERSION || '0.0.8';

/**
 * 初始化 Sentry
 */
export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('[Sentry] DSN not configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: RELEASE,
    
    // 性能监控配置
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    
    // 错误采样率
    sampleRate: 1.0,
    
    // 启用调试模式（仅开发环境）
    debug: ENVIRONMENT === 'development',
    
    // 启用会话重放（用于复现错误）
    replaysSessionSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    
    // 集成配置
    integrations: [
      // 浏览器追踪
      Sentry.browserTracingIntegration(),
      // 会话重放
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    
    // 错误过滤
    beforeSend(event) {
      // 过滤掉非生产环境的某些错误
      if (ENVIRONMENT !== 'production') {
        return event;
      }
      
      // 过滤掉已知的无害错误
      const errorMessage = event.exception?.values?.[0]?.value || '';
      const filteredErrors = [
        'ResizeObserver loop limit exceeded',
        'Network request failed',
        'Failed to fetch',
      ];
      
      if (filteredErrors.some(msg => errorMessage.includes(msg))) {
        return null;
      }
      
      return event;
    },
    
    // 标签配置
    initialScope: {
      tags: {
        app: 'jinmai-lab',
        version: RELEASE,
      },
    },
  });

  console.log('[Sentry] Initialized successfully');
}

/**
 * 设置用户上下文
 */
export function setUserContext(user: { id: string; email?: string; username?: string } | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * 添加面包屑
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * 捕获异常
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * 捕获消息
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * 设置标签
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

/**
 * 设置额外上下文
 */
export function setExtra(key: string, value: any) {
  Sentry.setExtra(key, value);
}

/**
 * 性能监控 - 开始事务
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startInactiveSpan({ name, op });
}

/**
 * 性能监控 - 开始 span
 */
export function startSpan(name: string, op: string) {
  return Sentry.startInactiveSpan({ name, op });
}

// 导出 Sentry 实例
export { Sentry };
