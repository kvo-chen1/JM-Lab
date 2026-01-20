/**
 * 权限检查中间件
 * 用于API请求和组件渲染前的权限验证
 */

import { NextFunction, Request, Response } from 'express';
import { ApiResponse } from '../types';
import authRbacIntegration from '../services/authRbacIntegration';
import errorService from '../services/errorService';
import eventBus from '../services/enhancedEventBus';
import { EventType } from '../types/events';

// 权限检查中间件配置
export interface PermissionMiddlewareConfig {
  requireAuth?: boolean;
  permissions?: string[];
  roles?: string[];
  allowAnonymous?: boolean;
  errorMessage?: string;
  redirectUrl?: string;
  logUnauthorizedAccess?: boolean;
}

// API权限检查中间件
export class PermissionMiddleware {
  private config: PermissionMiddlewareConfig;

  constructor(config: PermissionMiddlewareConfig = {}) {
    this.config = {
      requireAuth: true,
      allowAnonymous: false,
      logUnauthorizedAccess: true,
      ...config
    };
  }

  /**
   * Express中间件函数，用于API请求权限检查
   */
  public expressMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      this.checkApiPermission(req, res, next);
    };
  }

  /**
   * 检查API请求权限
   */
  private checkApiPermission(req: Request, res: Response, next: NextFunction): void {
    const userId = req.user?.id as string || req.headers['x-user-id'] as string;

    // 检查是否需要认证
    if (this.config.requireAuth && !userId) {
      const errorResponse: ApiResponse<null> = {
        ok: false,
        status: 401,
        error: this.config.errorMessage || 'Unauthorized: Authentication required'
      };

      if (this.config.logUnauthorizedAccess) {
        this.logUnauthorizedAccess(req, 'Missing authentication', userId);
      }

      res.status(401).json(errorResponse);
      return;
    }

    // 检查权限
    if (this.config.permissions && this.config.permissions.length > 0 && userId) {
      const hasPermission = this.config.permissions.some(permission => {
        return authRbacIntegration.hasPermission(userId, permission);
      });

      if (!hasPermission) {
        const errorResponse: ApiResponse<null> = {
          ok: false,
          status: 403,
          error: this.config.errorMessage || 'Forbidden: Insufficient permissions'
        };

        if (this.config.logUnauthorizedAccess) {
          this.logUnauthorizedAccess(req, 'Insufficient permissions', userId);
        }

        res.status(403).json(errorResponse);
        return;
      }
    }

    // 检查角色
    if (this.config.roles && this.config.roles.length > 0 && userId) {
      const userRoles = authRbacIntegration.getUserRoles(userId);
      const hasRole = this.config.roles.some(role => userRoles.includes(role));

      if (!hasRole) {
        const errorResponse: ApiResponse<null> = {
          ok: false,
          status: 403,
          error: this.config.errorMessage || 'Forbidden: Insufficient role permissions'
        };

        if (this.config.logUnauthorizedAccess) {
          this.logUnauthorizedAccess(req, 'Insufficient role permissions', userId);
        }

        res.status(403).json(errorResponse);
        return;
      }
    }

    // 权限检查通过，继续执行
    next();
  }

  /**
   * 日志记录未授权访问
   */
  private logUnauthorizedAccess(req: Request, reason: string, userId?: string): void {
    // 记录错误
    errorService.logError(new Error('Unauthorized access attempt'), {
      context: 'permission-middleware',
      reason,
      request: {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        query: req.query,
        params: req.params
      },
      userId
    });

    // 发布未授权访问事件
    eventBus.emit(EventType.APP_ERROR, {
      error: {
        code: 'UNAUTHORIZED_ACCESS',
        message: `Unauthorized access attempt: ${reason}`,
        details: {
          method: req.method,
          path: req.path,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        }
      },
      context: {
        userId,
        requestId: req.headers['x-request-id'] as string
      }
    });
  }

  /**
   * React组件权限检查函数
   */
  public checkComponentPermission(userId?: string): boolean {
    // 检查是否需要认证
    if (this.config.requireAuth && !userId) {
      return false;
    }

    // 检查权限
    if (this.config.permissions && this.config.permissions.length > 0 && userId) {
      const hasPermission = this.config.permissions.some(permission => {
        return authRbacIntegration.hasPermission(userId, permission);
      });

      if (!hasPermission) {
        return false;
      }
    }

    // 检查角色
    if (this.config.roles && this.config.roles.length > 0 && userId) {
      const userRoles = authRbacIntegration.getUserRoles(userId);
      const hasRole = this.config.roles.some(role => userRoles.includes(role));

      if (!hasRole) {
        return false;
      }
    }

    return true;
  }

  /**
   * 检查用户是否有特定权限
   */
  public static hasPermission(userId: string, permission: string): boolean {
    return authRbacIntegration.hasPermission(userId, permission);
  }

  /**
   * 检查用户是否可以执行特定操作
   */
  public static can(userId: string, resource: string, action: string): boolean {
    return authRbacIntegration.can(userId, resource, action);
  }

  /**
   * 检查用户是否有特定角色
   */
  public static hasRole(userId: string, role: string): boolean {
    const userRoles = authRbacIntegration.getUserRoles(userId);
    return userRoles.includes(role);
  }

  /**
   * 批量检查用户权限
   */
  public static checkPermissions(userId: string, permissions: string[]): {
    hasAll: boolean;
    hasAny: boolean;
    missingPermissions: string[];
  } {
    const missingPermissions: string[] = [];

    for (const permission of permissions) {
      if (!authRbacIntegration.hasPermission(userId, permission)) {
        missingPermissions.push(permission);
      }
    }

    return {
      hasAll: missingPermissions.length === 0,
      hasAny: missingPermissions.length < permissions.length,
      missingPermissions
    };
  }

  /**
   * 批量检查用户角色
   */
  public static checkRoles(userId: string, roles: string[]): {
    hasAll: boolean;
    hasAny: boolean;
    missingRoles: string[];
  } {
    const userRoles = authRbacIntegration.getUserRoles(userId);
    const missingRoles: string[] = [];

    for (const role of roles) {
      if (!userRoles.includes(role)) {
        missingRoles.push(role);
      }
    }

    return {
      hasAll: missingRoles.length === 0,
      hasAny: missingRoles.length < roles.length,
      missingRoles
    };
  }

  /**
   * 创建特定权限的中间件实例
   */
  public static create(config: PermissionMiddlewareConfig): PermissionMiddleware {
    return new PermissionMiddleware(config);
  }

  /**
   * 创建需要认证的中间件
   */
  public static requireAuth(config: Omit<PermissionMiddlewareConfig, 'requireAuth'> = {}): PermissionMiddleware {
    return new PermissionMiddleware({
      ...config,
      requireAuth: true
    });
  }

  /**
   * 创建允许匿名访问的中间件
   */
  public static allowAnonymous(config: Omit<PermissionMiddlewareConfig, 'allowAnonymous'> = {}): PermissionMiddleware {
    return new PermissionMiddleware({
      ...config,
      allowAnonymous: true,
      requireAuth: false
    });
  }

  /**
   * 创建需要特定权限的中间件
   */
  public static requirePermissions(permissions: string[], config: Omit<PermissionMiddlewareConfig, 'permissions'> = {}): PermissionMiddleware {
    return new PermissionMiddleware({
      ...config,
      permissions
    });
  }

  /**
   * 创建需要特定角色的中间件
   */
  public static requireRoles(roles: string[], config: Omit<PermissionMiddlewareConfig, 'roles'> = {}): PermissionMiddleware {
    return new PermissionMiddleware({
      ...config,
      roles
    });
  }

  /**
   * 创建管理员权限中间件
   */
  public static requireAdmin(config: Omit<PermissionMiddlewareConfig, 'roles'> = {}): PermissionMiddleware {
    return new PermissionMiddleware({
      ...config,
      roles: ['admin']
    });
  }

  /**
   * 创建内容审核员权限中间件
   */
  public static requireModerator(config: Omit<PermissionMiddlewareConfig, 'roles'> = {}): PermissionMiddleware {
    return new PermissionMiddleware({
      ...config,
      roles: ['moderator']
    });
  }
}

// 默认权限中间件实例
export const defaultPermissionMiddleware = new PermissionMiddleware();

// 导出常用中间件便捷方法
export const requireAuth = PermissionMiddleware.requireAuth().expressMiddleware();
export const allowAnonymous = PermissionMiddleware.allowAnonymous().expressMiddleware();
export const requireAdmin = PermissionMiddleware.requireAdmin().expressMiddleware();
export const requireModerator = PermissionMiddleware.requireModerator().expressMiddleware();

// 导出创建中间件的便捷函数
export const createPermissionMiddleware = (config: PermissionMiddlewareConfig): (req: Request, res: Response, next: NextFunction) => void => {
  return new PermissionMiddleware(config).expressMiddleware();
};

export default PermissionMiddleware;
