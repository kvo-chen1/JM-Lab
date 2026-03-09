/**
 * 认证和RBAC集成服务
 * 实现认证系统与RBAC系统的无缝集成
 */

import { AuthContext, User } from '../contexts/authContext';
import rbacService from './rbacService';
import eventBus from './eventBus';
import { EventType } from './eventBus';
import securityService from './securityService';
import errorService from './errorService';
import { Permission, Role, UserRole } from '../types';

// 认证和RBAC集成配置
export interface AuthRbacConfig {
  defaultRoles: string[];
  enableAutoRoleAssignment: boolean;
  enablePermissionCache: boolean;
  cacheExpiry: number;
  enableEventSync: boolean;
}

// 权限缓存项
export interface PermissionCacheItem {
  permissions: string[];
  timestamp: number;
  expiry: number;
}

// 认证和RBAC集成服务类
export class AuthRbacIntegration {
  private config: AuthRbacConfig;
  private permissionCache: Map<string, PermissionCacheItem> = new Map();
  private userRolesCache: Map<string, string[]> = new Map();
  private eventListeners: { [key: string]: any } = {};

  constructor(config: AuthRbacConfig) {
    this.config = config;
    this.initializeEventListeners();
  }

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners(): void {
    // 用户登录事件
    this.eventListeners[EventType.USER_LOGIN] = eventBus.on(EventType.USER_LOGIN, async (user: User) => {
      await this.handleUserLogin(user);
    });

    // 用户注册事件
    this.eventListeners[EventType.USER_REGISTERED] = eventBus.on(EventType.USER_REGISTERED, async (user: User) => {
      await this.handleUserRegistered(user);
    });

    // 用户登出事件
    this.eventListeners[EventType.USER_LOGOUT] = eventBus.on(EventType.USER_LOGOUT, (user: User) => {
      this.handleUserLogout(user);
    });

    // 用户更新事件
    this.eventListeners[EventType.USER_UPDATED] = eventBus.on(EventType.USER_UPDATED, async (user: User) => {
      await this.handleUserUpdated(user);
    });

    // 清除过期缓存
    setInterval(() => this.cleanupExpiredCache(), 3600000); // 每小时清理一次
  }

  /**
   * 处理用户登录
   */
  private async handleUserLogin(user: User): Promise<void> {
    try {
      if (!user?.id) {
        return;
      }

      // 检查用户是否已有角色
      const existingRoles = rbacService.getUserRoles(user.id);
      if (existingRoles.length === 0 && this.config.enableAutoRoleAssignment) {
        // 自动分配默认角色
        this.config.defaultRoles.forEach(roleId => {
          rbacService.assignRole(user.id, roleId);
        });
      }

      // 刷新权限缓存
      this.refreshUserPermissions(user.id);

      // 发布角色分配事件
      eventBus.emit('auth:roles_assigned', {
        userId: user.id,
        roles: rbacService.getUserRoles(user.id)
      });
    } catch (error) {
      errorService.logError(error as Error, {
        context: 'auth-rbac-integration',
        action: 'handleUserLogin',
        userId: user?.id
      });
    }
  }

  /**
   * 处理用户注册
   */
  private async handleUserRegistered(user: User): Promise<void> {
    try {
      if (!user?.id) {
        return;
      }

      // 自动分配默认角色
      if (this.config.enableAutoRoleAssignment) {
        this.config.defaultRoles.forEach(roleId => {
          rbacService.assignRole(user.id, roleId);
        });
      }

      // 刷新权限缓存
      this.refreshUserPermissions(user.id);

      // 发布角色分配事件
      eventBus.emit('auth:roles_assigned', {
        userId: user.id,
        roles: rbacService.getUserRoles(user.id)
      });
    } catch (error) {
      errorService.logError(error as Error, {
        context: 'auth-rbac-integration',
        action: 'handleUserRegistered',
        userId: user?.id
      });
    }
  }

  /**
   * 处理用户登出
   */
  private handleUserLogout(user: User): void {
    try {
      if (!user?.id) {
        return;
      }

      // 清除用户权限缓存
      this.clearUserCache(user.id);
    } catch (error) {
      errorService.logError(error as Error, {
        context: 'auth-rbac-integration',
        action: 'handleUserLogout',
        userId: user?.id
      });
    }
  }

  /**
   * 处理用户更新
   */
  private async handleUserUpdated(user: User): Promise<void> {
    try {
      if (!user?.id) {
        return;
      }

      // 刷新用户权限缓存
      this.refreshUserPermissions(user.id);
    } catch (error) {
      errorService.logError(error as Error, {
        context: 'auth-rbac-integration',
        action: 'handleUserUpdated',
        userId: user?.id
      });
    }
  }

  /**
   * 刷新用户权限缓存
   */
  public refreshUserPermissions(userId: string): void {
    try {
      // 获取用户权限
      const permissions = rbacService.getUserPermissions(userId);
      const permissionIds = permissions.map(perm => perm.id);

      // 更新权限缓存
      if (this.config.enablePermissionCache) {
        this.permissionCache.set(userId, {
          permissions: permissionIds,
          timestamp: Date.now(),
          expiry: Date.now() + this.config.cacheExpiry
        });
      }

      // 更新角色缓存
      this.userRolesCache.set(userId, rbacService.getUserRoles(userId));

      // 发布权限更新事件
      eventBus.emit('auth:permissions_updated', {
        userId,
        permissions: permissionIds
      });
    } catch (error) {
      errorService.logError(error as Error, {
        context: 'auth-rbac-integration',
        action: 'refreshUserPermissions',
        userId
      });
    }
  }

  /**
   * 检查用户是否具有特定权限
   */
  public hasPermission(userId: string, permissionId: string): boolean {
    try {
      // 检查权限缓存
      if (this.config.enablePermissionCache) {
        const cacheItem = this.permissionCache.get(userId);
        if (cacheItem && cacheItem.expiry > Date.now()) {
          return cacheItem.permissions.includes(permissionId);
        }
      }

      // 缓存未命中，直接调用RBAC服务
      const result = rbacService.hasPermission(userId, permissionId);

      // 更新缓存
      this.refreshUserPermissions(userId);

      return result;
    } catch (error) {
      errorService.logError(error as Error, {
        context: 'auth-rbac-integration',
        action: 'hasPermission',
        userId,
        permissionId
      });
      return false;
    }
  }

  /**
   * 检查用户是否可以执行特定操作
   */
  public can(userId: string, resource: string, action: string): boolean {
    try {
      // 检查权限缓存
      if (this.config.enablePermissionCache) {
        const cacheItem = this.permissionCache.get(userId);
        if (cacheItem && cacheItem.expiry > Date.now()) {
          // 构建权限ID并检查
          const permissionId = `${resource}:${action}`;
          return cacheItem.permissions.includes(permissionId);
        }
      }

      // 缓存未命中，直接调用RBAC服务
      const result = rbacService.can(userId, resource, action);

      // 更新缓存
      this.refreshUserPermissions(userId);

      return result;
    } catch (error) {
      errorService.logError(error as Error, {
        context: 'auth-rbac-integration',
        action: 'can',
        userId,
        resource,
        action
      });
      return false;
    }
  }

  /**
   * 获取用户的所有权限
   */
  public getUserPermissions(userId: string): Permission[] {
    try {
      // 检查权限缓存
      if (this.config.enablePermissionCache) {
        const cacheItem = this.permissionCache.get(userId);
        if (cacheItem && cacheItem.expiry > Date.now()) {
          // 从缓存中构建权限对象
          return cacheItem.permissions.map(permId => {
            const perm = rbacService.getPermission(permId);
            return perm || { id: permId, name: permId, description: '', category: '', resource: '', action: '' };
          }).filter(perm => perm !== undefined) as Permission[];
        }
      }

      // 缓存未命中，直接调用RBAC服务
      const permissions = rbacService.getUserPermissions(userId);

      // 更新缓存
      this.refreshUserPermissions(userId);

      return permissions;
    } catch (error) {
      errorService.logError(error as Error, {
        context: 'auth-rbac-integration',
        action: 'getUserPermissions',
        userId
      });
      return [];
    }
  }

  /**
   * 获取用户的所有角色
   */
  public getUserRoles(userId: string): string[] {
    try {
      // 检查角色缓存
      const cachedRoles = this.userRolesCache.get(userId);
      if (cachedRoles) {
        return cachedRoles;
      }

      // 缓存未命中，直接调用RBAC服务
      const roles = rbacService.getUserRoles(userId);

      // 更新缓存
      this.userRolesCache.set(userId, roles);

      return roles;
    } catch (error) {
      errorService.logError(error as Error, {
        context: 'auth-rbac-integration',
        action: 'getUserRoles',
        userId
      });
      return [];
    }
  }

  /**
   * 获取用户角色的详细信息
   */
  public getUserRoleDetails(userId: string): Role[] {
    try {
      // 直接调用RBAC服务，因为角色信息可能频繁变化
      const roles = rbacService.getUserRoleDetails(userId);
      return roles;
    } catch (error) {
      errorService.logError(error as Error, {
        context: 'auth-rbac-integration',
        action: 'getUserRoleDetails',
        userId
      });
      return [];
    }
  }

  /**
   * 为用户分配角色
   */
  public assignRole(userId: string, roleId: string, assignedBy?: string): boolean {
    try {
      const result = rbacService.assignRole(userId, roleId, assignedBy);
      
      // 更新缓存
      this.refreshUserPermissions(userId);

      // 发布角色分配事件
      eventBus.emit('auth:role_assigned', {
        userId,
        roleId,
        assignedBy
      });

      return result;
    } catch (error) {
      errorService.logError(error as Error, {
        context: 'auth-rbac-integration',
        action: 'assignRole',
        userId,
        roleId
      });
      return false;
    }
  }

  /**
   * 从用户移除角色
   */
  public removeRole(userId: string, roleId: string): boolean {
    try {
      const result = rbacService.removeRole(userId, roleId);
      
      // 更新缓存
      this.refreshUserPermissions(userId);

      // 发布角色移除事件
      eventBus.emit('auth:role_removed', {
        userId,
        roleId
      });

      return result;
    } catch (error) {
      errorService.logError(error as Error, {
        context: 'auth-rbac-integration',
        action: 'removeRole',
        userId,
        roleId
      });
      return false;
    }
  }

  /**
   * 替换用户的所有角色
   */
  public replaceRoles(userId: string, roleIds: string[]): boolean {
    try {
      const result = rbacService.replaceRoles(userId, roleIds);
      
      // 更新缓存
      this.refreshUserPermissions(userId);

      // 发布角色替换事件
      eventBus.emit('auth:roles_replaced', {
        userId,
        roleIds
      });

      return result;
    } catch (error) {
      errorService.logError(error as Error, {
        context: 'auth-rbac-integration',
        action: 'replaceRoles',
        userId,
        roleIds
      });
      return false;
    }
  }

  /**
   * 为角色添加权限
   */
  public addPermissionToRole(roleId: string, permissionId: string): boolean {
    try {
      const result = rbacService.addPermissionToRole(roleId, permissionId);
      
      // 清除所有用户的权限缓存，因为角色权限变更影响所有拥有该角色的用户
      this.clearAllCaches();

      // 发布权限添加事件
      eventBus.emit('auth:permission_added_to_role', {
        roleId,
        permissionId
      });

      return result;
    } catch (error) {
      errorService.logError(error as Error, {
        context: 'auth-rbac-integration',
        action: 'addPermissionToRole',
        roleId,
        permissionId
      });
      return false;
    }
  }

  /**
   * 从角色移除权限
   */
  public removePermissionFromRole(roleId: string, permissionId: string): boolean {
    try {
      const result = rbacService.removePermissionFromRole(roleId, permissionId);
      
      // 清除所有用户的权限缓存，因为角色权限变更影响所有拥有该角色的用户
      this.clearAllCaches();

      // 发布权限移除事件
      eventBus.emit('auth:permission_removed_from_role', {
        roleId,
        permissionId
      });

      return result;
    } catch (error) {
      errorService.logError(error as Error, {
        context: 'auth-rbac-integration',
        action: 'removePermissionFromRole',
        roleId,
        permissionId
      });
      return false;
    }
  }

  /**
   * 清除用户的缓存
   */
  public clearUserCache(userId: string): void {
    this.permissionCache.delete(userId);
    this.userRolesCache.delete(userId);
  }

  /**
   * 清除所有缓存
   */
  public clearAllCaches(): void {
    this.permissionCache.clear();
    this.userRolesCache.clear();
  }

  /**
   * 清理过期缓存
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    
    // 清理权限缓存
    for (const [userId, cacheItem] of this.permissionCache.entries()) {
      if (cacheItem.expiry < now) {
        this.permissionCache.delete(userId);
      }
    }
  }

  /**
   * 获取集成服务状态
   */
  public getStatus(): {
    config: AuthRbacConfig;
    cacheStats: {
      permissionCacheSize: number;
      userRolesCacheSize: number;
    };
    eventListeners: string[];
  } {
    return {
      config: this.config,
      cacheStats: {
        permissionCacheSize: this.permissionCache.size,
        userRolesCacheSize: this.userRolesCache.size
      },
      eventListeners: Object.keys(this.eventListeners)
    };
  }

  /**
   * 销毁集成服务
   */
  public destroy(): void {
    // 移除所有事件监听器
    for (const eventType in this.eventListeners) {
      const listener = this.eventListeners[eventType];
      if (listener && typeof listener.unsubscribe === 'function') {
        listener.unsubscribe();
      }
    }

    // 清除所有缓存
    this.clearAllCaches();
  }
}

// 集成服务配置
const authRbacConfig: AuthRbacConfig = {
  defaultRoles: ['user'],
  enableAutoRoleAssignment: true,
  enablePermissionCache: true,
  cacheExpiry: 3600000, // 1小时
  enableEventSync: true
};

// 导出集成服务单例实例
const authRbacIntegration = new AuthRbacIntegration(authRbacConfig);

export default authRbacIntegration;
