/**
 * 权限检查钩子
 * 用于React组件中的权限验证
 */

import { useEffect, useState } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../contexts/authContext';
import authRbacIntegration from '../services/authRbacIntegration';
import { PermissionMiddlewareConfig } from '../middlewares/permissionMiddleware';

// 权限检查结果类型
export interface PermissionCheckResult {
  hasPermission: boolean;
  isLoading: boolean;
  missingPermissions: string[];
  missingRoles: string[];
  userId?: string;
}

// 权限检查钩子配置
export interface UsePermissionOptions extends PermissionMiddlewareConfig {
  skipInitialCheck?: boolean;
  recheckOnRoleChange?: boolean;
  recheckOnPermissionChange?: boolean;
}

/**
 * 权限检查钩子
 * 用于React组件中检查用户是否具有特定权限或角色
 * 
 * @param config 权限检查配置
 * @returns 权限检查结果
 */
export const usePermission = (config: UsePermissionOptions = {}): PermissionCheckResult => {
  const { 
    requireAuth = true,
    permissions = [],
    roles = [],
    allowAnonymous = false,
    skipInitialCheck = false,
    recheckOnRoleChange = true,
    recheckOnPermissionChange = true
  } = config;

  // 获取当前用户信息
  const { user, isAuthenticated } = useContext(AuthContext);
  
  // 权限检查结果状态
  const [result, setResult] = useState<PermissionCheckResult>({
    hasPermission: !requireAuth || allowAnonymous,
    isLoading: !skipInitialCheck,
    missingPermissions: [],
    missingRoles: [],
    userId: user?.id
  });

  // 执行权限检查
  const checkPermissions = () => {
    // 初始状态
    let hasPermission = !requireAuth || allowAnonymous;
    const missingPermissions: string[] = [];
    const missingRoles: string[] = [];
    const userId = user?.id;

    // 如果需要认证但用户未认证
    if (requireAuth && !isAuthenticated) {
      hasPermission = false;
    } 
    // 如果用户已认证，检查权限和角色
    else if (isAuthenticated && userId) {
      // 检查权限
      if (permissions.length > 0) {
        for (const permission of permissions) {
          if (!authRbacIntegration.hasPermission(userId, permission)) {
            missingPermissions.push(permission);
          }
        }
        
        if (missingPermissions.length > 0) {
          hasPermission = false;
        }
      }

      // 检查角色
      if (roles.length > 0) {
        const userRoles = authRbacIntegration.getUserRoles(userId);
        for (const role of roles) {
          if (!userRoles.includes(role)) {
            missingRoles.push(role);
          }
        }
        
        if (missingRoles.length > 0) {
          hasPermission = false;
        }
      }
    }

    // 更新结果
    setResult({
      hasPermission,
      isLoading: false,
      missingPermissions,
      missingRoles,
      userId
    });
  };

  // 初始检查
  useEffect(() => {
    if (!skipInitialCheck) {
      checkPermissions();
    } else {
      setResult(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  }, []);

  // 当用户信息变化时重新检查
  useEffect(() => {
    checkPermissions();
  }, [user, isAuthenticated]);

  // 当权限或角色配置变化时重新检查
  useEffect(() => {
    checkPermissions();
  }, [permissions, roles, requireAuth, allowAnonymous]);

  return result;
};

/**
 * 检查用户是否具有特定权限
 * 
 * @param permission 权限ID
 * @returns 是否具有该权限
 */
export const useHasPermission = (permission: string | string[]): boolean => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setHasPermission(false);
      return;
    }

    if (Array.isArray(permission)) {
      // 检查是否具有所有权限
      const hasAllPermissions = permission.every(perm => 
        authRbacIntegration.hasPermission(user.id, perm)
      );
      setHasPermission(hasAllPermissions);
    } else {
      // 检查是否具有单个权限
      const hasSinglePermission = authRbacIntegration.hasPermission(user.id, permission);
      setHasPermission(hasSinglePermission);
    }
  }, [user, isAuthenticated, permission]);

  return hasPermission;
};

/**
 * 检查用户是否具有特定角色
 * 
 * @param role 角色ID
 * @returns 是否具有该角色
 */
export const useHasRole = (role: string | string[]): boolean => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [hasRole, setHasRole] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setHasRole(false);
      return;
    }

    const userRoles = authRbacIntegration.getUserRoles(user.id);
    
    if (Array.isArray(role)) {
      // 检查是否具有所有角色
      const hasAllRoles = role.every(r => userRoles.includes(r));
      setHasRole(hasAllRoles);
    } else {
      // 检查是否具有单个角色
      const hasSingleRole = userRoles.includes(role);
      setHasRole(hasSingleRole);
    }
  }, [user, isAuthenticated, role]);

  return hasRole;
};

/**
 * 检查用户是否可以执行特定操作
 * 
 * @param resource 资源类型
 * @param action 操作类型
 * @returns 是否可以执行该操作
 */
export const useCan = (resource: string, action: string): boolean => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [can, setCan] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setCan(false);
      return;
    }

    const result = authRbacIntegration.can(user.id, resource, action);
    setCan(result);
  }, [user, isAuthenticated, resource, action]);

  return can;
};

/**
 * 管理员权限检查钩子
 * 
 * @returns 是否具有管理员权限
 */
export const useIsAdmin = (): boolean => {
  return useHasRole('admin');
};

/**
 * 内容审核员权限检查钩子
 * 
 * @returns 是否具有内容审核员权限
 */
export const useIsModerator = (): boolean => {
  return useHasRole('moderator');
};

/**
 * 数据分析员权限检查钩子
 * 
 * @returns 是否具有数据分析员权限
 */
export const useIsAnalyst = (): boolean => {
  return useHasRole('analyst');
};

/**
 * 权限守卫钩子
 * 用于保护路由或组件，根据权限返回不同的结果
 * 
 * @param config 权限检查配置
 * @param options 权限检查选项
 * @returns 权限检查结果，包括是否允许访问和重定向URL
 */
export const usePermissionGuard = (
  config: UsePermissionOptions = {},
  options: { redirectUrl?: string; fallbackUrl?: string } = {}
): {
  canAccess: boolean;
  redirectUrl?: string;
  isLoading: boolean;
} => {
  const permissionResult = usePermission(config);
  const { canAccess, redirectUrl } = options;
  
  const [result, setResult] = useState<{
    canAccess: boolean;
    redirectUrl?: string;
    isLoading: boolean;
  }>({
    canAccess: false,
    redirectUrl: undefined,
    isLoading: permissionResult.isLoading
  });

  useEffect(() => {
    if (permissionResult.isLoading) {
      return;
    }

    if (permissionResult.hasPermission) {
      setResult({
        canAccess: true,
        redirectUrl: undefined,
        isLoading: false
      });
    } else {
      // 如果没有权限，确定重定向URL
      const finalRedirectUrl = redirectUrl || config.redirectUrl || '/login';
      
      setResult({
        canAccess: false,
        redirectUrl: finalRedirectUrl,
        isLoading: false
      });
    }
  }, [permissionResult, redirectUrl, config.redirectUrl]);

  return result;
};

/**
 * 权限感知组件包装器钩子
 * 用于根据权限条件渲染不同的组件内容
 * 
 * @param config 权限检查配置
 * @returns 权限检查结果，可用于条件渲染
 */
export const usePermissionAware = (
  config: UsePermissionOptions = {}
): {
  render: (permittedContent: React.ReactNode, fallbackContent?: React.ReactNode) => React.ReactNode;
  hasPermission: boolean;
  isLoading: boolean;
} => {
  const permissionResult = usePermission(config);

  // 权限感知渲染函数
  const render = (
    permittedContent: React.ReactNode,
    fallbackContent: React.ReactNode = null
  ): React.ReactNode => {
    if (permissionResult.isLoading) {
      return null; // 或者返回加载指示器
    }

    return permissionResult.hasPermission ? permittedContent : fallbackContent;
  };

  return {
    render,
    hasPermission: permissionResult.hasPermission,
    isLoading: permissionResult.isLoading
  };
};

export default usePermission;
