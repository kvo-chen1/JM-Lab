/**
 * API网关服务
 * 统一管理所有API请求，实现请求转发、认证和限流等功能
 */

import apiClient from '../lib/apiClient';
import errorService from './errorService';
import { securityService } from './securityService';
import rbacService from './rbacService';
import eventBus from './eventBus';
import { EventType } from './eventBus';
import { ApiResponse } from '../types';

// API网关配置
export interface ApiGatewayConfig {
  baseUrl: string;
  timeout: number;
  retryCount: number;
  rateLimit: {
    enabled: boolean;
    requestsPerMinute: number;
  };
  enableLogging: boolean;
  enableMetrics: boolean;
}

// API请求上下文
export interface RequestContext {
  id: string;
  path: string;
  method: string;
  headers: Record<string, string>;
  body: any;
  params: Record<string, string>;
  query: Record<string, string>;
  userId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  statusCode?: number;
}

// API中间件接口
export interface ApiMiddleware {
  name: string;
  priority: number;
  process: <T>(context: RequestContext, next: () => Promise<ApiResponse<T>>) => Promise<ApiResponse<T>>;
}

// API路由配置
export interface ApiRoute {
  path: string;
  method: string;
  handler: <T>(context: RequestContext) => Promise<ApiResponse<T>>;
  middlewares?: string[];
  authRequired?: boolean;
  permissions?: string[];
  version?: string;
}

// API网关类
export class ApiGateway {
  private config: ApiGatewayConfig;
  private routes: Map<string, ApiRoute> = new Map();
  private middlewares: Map<string, ApiMiddleware> = new Map();
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  private metrics: {
    requests: number;
    errors: number;
    averageDuration: number;
    totalDuration: number;
  } = {
    requests: 0,
    errors: 0,
    averageDuration: 0,
    totalDuration: 0
  };

  constructor(config: ApiGatewayConfig) {
    this.config = config;
    this.initializeDefaultMiddlewares();
    this.initializeDefaultRoutes();
  }

  /**
   * 初始化默认中间件
   */
  private initializeDefaultMiddlewares(): void {
    // 请求日志中间件
    this.registerMiddleware({
      name: 'logging',
      priority: 10,
      process: async <T>(context: RequestContext, next: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> => {
        if (this.config.enableLogging) {
          console.log(`[API Gateway] ${context.method} ${context.path} - Request started`);
        }

        const response = await next();

        if (this.config.enableLogging) {
          console.log(`[API Gateway] ${context.method} ${context.path} - Request completed with status ${response.status}`);
        }

        return response;
      }
    });

    // 认证中间件
    this.registerMiddleware({
      name: 'authentication',
      priority: 20,
      process: async <T>(context: RequestContext, next: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> => {
        // 获取认证令牌
        const token = context.headers['authorization']?.replace('Bearer ', '') || 
                     context.headers['Authorization']?.replace('Bearer ', '') ||
                     localStorage.getItem('token');

        if (!token) {
          return {
            ok: false,
            status: 401,
            error: 'Unauthorized: Missing authentication token'
          };
        }

        try {
          // 验证令牌
          const decoded = securityService.verifyToken(token);
          context.userId = decoded.sub;

          // 验证令牌有效性
          const isValid = await securityService.validateToken(token);
          if (!isValid) {
            return {
              ok: false,
              status: 401,
              error: 'Unauthorized: Invalid or expired token'
            };
          }

          return next();
        } catch (error) {
          return {
            ok: false,
            status: 401,
            error: 'Unauthorized: Invalid token format'
          };
        }
      }
    });

    // 授权中间件
    this.registerMiddleware({
      name: 'authorization',
      priority: 30,
      process: async <T>(context: RequestContext, next: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> => {
        // 获取当前路由
        const routeKey = `${context.method}:${context.path}`;
        const route = this.routes.get(routeKey);

        if (route?.permissions && route.permissions.length > 0 && context.userId) {
          // 检查用户是否拥有所需权限
          for (const permission of route.permissions) {
            if (!rbacService.hasPermission(context.userId, permission)) {
              return {
                ok: false,
                status: 403,
                error: `Forbidden: Missing required permission: ${permission}`
              };
            }
          }
        }

        return next();
      }
    });

    // 限流中间件
    this.registerMiddleware({
      name: 'rateLimiting',
      priority: 40,
      process: async <T>(context: RequestContext, next: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> => {
        if (!this.config.rateLimit.enabled) {
          return next();
        }

        // 使用IP或用户ID作为限流键
        const key = context.userId || context.headers['x-forwarded-for'] || 'anonymous';
        const now = Date.now();
        const windowMs = 60 * 1000; // 1分钟

        let limitData = this.rateLimitStore.get(key);
        if (!limitData) {
          limitData = { count: 0, resetTime: now + windowMs };
          this.rateLimitStore.set(key, limitData);
        }

        // 如果超出时间窗口，重置计数
        if (now > limitData.resetTime) {
          limitData.count = 0;
          limitData.resetTime = now + windowMs;
        }

        // 检查是否超出限流
        if (limitData.count >= this.config.rateLimit.requestsPerMinute) {
          return {
            ok: false,
            status: 429,
            error: 'Too Many Requests: Rate limit exceeded'
          };
        }

        // 增加请求计数
        limitData.count++;

        const response = await next();

        return response;
      }
    });

    // 错误处理中间件
    this.registerMiddleware({
      name: 'errorHandling',
      priority: 50,
      process: async <T>(context: RequestContext, next: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> => {
        try {
          return await next();
        } catch (error) {
          // 记录错误
          errorService.logError(error as Error, {
            context: 'api-gateway',
            request: {
              method: context.method,
              path: context.path,
              params: context.params,
              query: context.query
            }
          });

          // 发布错误事件
          eventBus.emit(EventType.APP_ERROR, {
            error,
            context: {
              method: context.method,
              path: context.path,
              userId: context.userId
            }
          });

          return {
            ok: false,
            status: 500,
            error: 'Internal Server Error'
          };
        }
      }
    });

    // 指标收集中间件
    this.registerMiddleware({
      name: 'metrics',
      priority: 60,
      process: async <T>(context: RequestContext, next: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> => {
        const response = await next();

        if (this.config.enableMetrics) {
          // 更新指标
          this.metrics.requests++;
          
          if (!response.ok) {
            this.metrics.errors++;
          }

          // 更新平均响应时间
          if (context.duration) {
            this.metrics.totalDuration += context.duration;
            this.metrics.averageDuration = this.metrics.totalDuration / this.metrics.requests;
          }
        }

        return response;
      }
    });
  }

  /**
   * 初始化默认路由
   */
  private initializeDefaultRoutes(): void {
    // 健康检查路由
    this.registerRoute({
      path: '/api/health',
      method: 'GET',
      handler: async (): Promise<ApiResponse<{ status: string; timestamp: number }>> => {
        return {
          ok: true,
          status: 200,
          data: {
            status: 'ok',
            timestamp: Date.now()
          }
        };
      },
      authRequired: false
    });

    // 版本信息路由
    this.registerRoute({
      path: '/api/version',
      method: 'GET',
      handler: async (): Promise<ApiResponse<{ version: string; environment: string }>> => {
        return {
          ok: true,
          status: 200,
          data: {
            version: '1.0.0',
            environment: import.meta.env.MODE || 'development'
          }
        };
      },
      authRequired: false
    });
  }

  /**
   * 注册中间件
   */
  registerMiddleware(middleware: ApiMiddleware): void {
    this.middlewares.set(middleware.name, middleware);
  }

  /**
   * 注册路由
   */
  registerRoute(route: ApiRoute): void {
    const key = `${route.method}:${route.path}`;
    this.routes.set(key, route);
  }

  /**
   * 获取路由
   */
  getRoute(method: string, path: string): ApiRoute | undefined {
    return this.routes.get(`${method}:${path}`);
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 执行中间件链
   */
  private async executeMiddlewareChain<T>(
    context: RequestContext,
    middlewares: ApiMiddleware[],
    index: number,
    handler: () => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> {
    if (index >= middlewares.length) {
      return handler();
    }

    const middleware = middlewares[index];
    return middleware.process(context, () => this.executeMiddlewareChain(context, middlewares, index + 1, handler));
  }

  /**
   * 处理API请求
   */
  async handleRequest<T>(
    method: string,
    path: string,
    options: {
      headers?: Record<string, string>;
      body?: any;
      params?: Record<string, string>;
      query?: Record<string, string>;
      userId?: string;
    }
  ): Promise<ApiResponse<T>> {
    // 创建请求上下文
    const context: RequestContext = {
      id: this.generateRequestId(),
      path,
      method,
      headers: options.headers || {},
      body: options.body || {},
      params: options.params || {},
      query: options.query || {},
      userId: options.userId,
      startTime: Date.now()
    };

    // 发布请求开始事件
    eventBus.emit(EventType.APP_READY, {
      context: {
        requestId: context.id,
        method: context.method,
        path: context.path
      }
    });

    try {
      // 查找匹配的路由
      const route = this.getRoute(method, path);
      if (!route) {
        return {
          ok: false,
          status: 404,
          error: 'Not Found'
        };
      }

      // 获取所有中间件并按优先级排序
      const allMiddlewares = Array.from(this.middlewares.values())
        .sort((a, b) => a.priority - b.priority);

      // 执行中间件链和路由处理
      const response = await this.executeMiddlewareChain(
        context,
        allMiddlewares,
        0,
        async () => {
          try {
            // 调用路由处理函数
            return await route.handler(context);
          } catch (error) {
            return {
              ok: false,
              status: 500,
              error: 'Internal Server Error'
            };
          }
        }
      );

      // 更新请求上下文
      context.endTime = Date.now();
      context.duration = context.endTime - context.startTime;
      context.statusCode = response.status;

      // 发布请求完成事件
      eventBus.emit(EventType.APP_READY, {
        context: {
          requestId: context.id,
          method: context.method,
          path: context.path,
          status: response.status,
          duration: context.duration
        }
      });

      return response;
    } catch (error) {
      // 更新请求上下文
      context.endTime = Date.now();
      context.duration = context.endTime - context.startTime;
      context.statusCode = 500;

      // 记录错误
      errorService.logError(error as Error, {
        context: 'api-gateway',
        request: {
          method: context.method,
          path: context.path,
          params: context.params,
          query: context.query
        }
      });

      // 发布错误事件
      eventBus.emit(EventType.APP_ERROR, {
        error,
        context: {
          method: context.method,
          path: context.path,
          userId: context.userId
        }
      });

      return {
        ok: false,
        status: 500,
        error: 'Internal Server Error'
      };
    }
  }

  /**
   * 代理请求到外部服务
   */
  async proxyRequest<T>(
    url: string,
    options: {
      method?: string;
      headers?: Record<string, string>;
      body?: any;
      timeout?: number;
    }
  ): Promise<ApiResponse<T>> {
    try {
      // 使用apiClient发送请求
      const response = await apiClient.request<T>(url, {
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body,
        timeoutMs: options.timeout || this.config.timeout,
        retries: this.config.retryCount
      });

      return response;
    } catch (error) {
      errorService.logError(error as Error, {
        context: 'api-gateway-proxy',
        proxyUrl: url
      });

      return {
        ok: false,
        status: 500,
        error: 'Proxy Request Failed'
      };
    }
  }

  /**
   * 获取API网关指标
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * 重置API网关指标
   */
  resetMetrics() {
    this.metrics = {
      requests: 0,
      errors: 0,
      averageDuration: 0,
      totalDuration: 0
    };
  }

  /**
   * 清除速率限制存储
   */
  clearRateLimitStore() {
    this.rateLimitStore.clear();
  }
}

// 创建API网关实例
const apiGatewayConfig: ApiGatewayConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
  retryCount: 3,
  rateLimit: {
    enabled: true,
    requestsPerMinute: 60
  },
  enableLogging: import.meta.env.MODE === 'development',
  enableMetrics: true
};

// 导出API网关单例实例
const apiGateway = new ApiGateway(apiGatewayConfig);

export default apiGateway;
