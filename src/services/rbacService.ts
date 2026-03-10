/**
 * 基于角色的访问控制（RBAC）服务
 * 管理用户角色和权限，实现细粒度的访问控制
 */

// 权限类型定义
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string; // 资源类型（如：post, user, admin等）
  action: string; // 操作类型（如：read, write, delete, admin等）
}

// 角色类型定义
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // 权限ID列表
  isSystemRole: boolean; // 是否为系统内置角色
}

// 用户角色关联类型定义
export interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy?: string;
}

// RBAC服务类
class RBACService {
  private permissions: Map<string, Permission> = new Map();
  private roles: Map<string, Role> = new Map();
  private userRoles: Map<string, Set<string>> = new Map(); // userId -> roleIds
  private storageKey = 'rbac_user_roles';
  private customRolesKey = 'rbac_custom_roles';

  constructor() {
    // 初始化系统默认权限和角色
    this.initializeDefaultPermissions();
    this.initializeDefaultRoles();
    // 从持久化存储加载数据
    this.loadFromStorage();
  }

  /**
   * 从localStorage加载用户角色和自定义角色
   */
  private loadFromStorage(): void {
    try {
      // 加载用户角色分配
      const storedUserRoles = localStorage.getItem(this.storageKey);
      if (storedUserRoles) {
        const parsed = JSON.parse(storedUserRoles);
        Object.entries(parsed).forEach(([userId, roleIds]) => {
          this.userRoles.set(userId, new Set(roleIds as string[]));
        });
      }

      // 加载自定义角色
      const storedCustomRoles = localStorage.getItem(this.customRolesKey);
      if (storedCustomRoles) {
        const customRoles: Role[] = JSON.parse(storedCustomRoles);
        customRoles.forEach(role => {
          // 只加载非系统角色（自定义角色）
          if (!role.isSystemRole) {
            this.roles.set(role.id, role);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load RBAC data from storage:', error);
    }
  }

  /**
   * 保存用户角色分配到localStorage
   */
  private saveUserRolesToStorage(): void {
    try {
      const data: Record<string, string[]> = {};
      this.userRoles.forEach((roleSet, userId) => {
        data[userId] = Array.from(roleSet);
      });
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save user roles to storage:', error);
    }
  }

  /**
   * 保存自定义角色到localStorage
   */
  private saveCustomRolesToStorage(): void {
    try {
      const customRoles = Array.from(this.roles.values()).filter(role => !role.isSystemRole);
      localStorage.setItem(this.customRolesKey, JSON.stringify(customRoles));
    } catch (error) {
      console.error('Failed to save custom roles to storage:', error);
    }
  }
  
  /**
   * 初始化系统默认权限
   */
  private initializeDefaultPermissions(): void {
    const defaultPermissions: Permission[] = [
      // 作品相关权限
      { id: 'post:read', name: '查看作品', description: '查看平台上的作品', category: '作品', resource: 'post', action: 'read' },
      { id: 'post:write', name: '创建作品', description: '创建新作品', category: '作品', resource: 'post', action: 'write' },
      { id: 'post:update', name: '编辑作品', description: '编辑自己的作品', category: '作品', resource: 'post', action: 'update' },
      { id: 'post:delete', name: '删除作品', description: '删除自己的作品', category: '作品', resource: 'post', action: 'delete' },
      { id: 'post:admin', name: '作品管理', description: '管理所有作品', category: '作品', resource: 'post', action: 'admin' },
      
      // 用户相关权限
      { id: 'user:read', name: '查看用户', description: '查看用户信息', category: '用户', resource: 'user', action: 'read' },
      { id: 'user:update', name: '更新用户', description: '更新自己的用户信息', category: '用户', resource: 'user', action: 'update' },
      { id: 'user:admin', name: '用户管理', description: '管理所有用户', category: '用户', resource: 'user', action: 'admin' },
      
      // 社区相关权限
      { id: 'community:comment', name: '发表评论', description: '在作品下发表评论', category: '社区', resource: 'community', action: 'comment' },
      { id: 'community:like', name: '点赞作品', description: '点赞平台上的作品', category: '社区', resource: 'community', action: 'like' },
      { id: 'community:share', name: '分享作品', description: '分享作品到外部平台', category: '社区', resource: 'community', action: 'share' },
      
      // 管理员相关权限
      { id: 'admin:dashboard', name: '访问管理后台', description: '访问管理员控制台', category: '管理员', resource: 'admin', action: 'dashboard' },
      { id: 'admin:settings', name: '修改系统设置', description: '修改平台系统设置', category: '管理员', resource: 'admin', action: 'settings' },
      { id: 'admin:roles', name: '管理角色权限', description: '管理用户角色和权限', category: '管理员', resource: 'admin', action: 'roles' },
      
      // 内容审核权限
      { id: 'content:review', name: '审核内容', description: '审核平台上的内容', category: '内容', resource: 'content', action: 'review' },
      { id: 'content:approve', name: '批准内容', description: '批准审核通过的内容', category: '内容', resource: 'content', action: 'approve' },
      { id: 'content:reject', name: '拒绝内容', description: '拒绝审核不通过的内容', category: '内容', resource: 'content', action: 'reject' },
      
      // 数据分析权限
      { id: 'analytics:view', name: '查看数据分析', description: '查看平台数据分析报告', category: '数据分析', resource: 'analytics', action: 'view' },
      { id: 'analytics:export', name: '导出数据分析', description: '导出数据分析报告', category: '数据分析', resource: 'analytics', action: 'export' },
    ];
    
    // 将默认权限添加到权限映射中
    defaultPermissions.forEach(permission => {
      this.permissions.set(permission.id, permission);
    });
  }
  
  /**
   * 初始化系统默认角色
   */
  private initializeDefaultRoles(): void {
    const defaultRoles: Role[] = [
      {
        id: 'user',
        name: '普通用户',
        description: '平台普通用户，拥有基本功能权限',
        permissions: [
          'post:read',
          'post:write',
          'post:update',
          'post:delete',
          'user:read',
          'user:update',
          'community:comment',
          'community:like',
          'community:share',
        ],
        isSystemRole: true
      },
      {
        id: 'admin',
        name: '管理员',
        description: '平台管理员，拥有所有管理权限',
        permissions: Array.from(this.permissions.keys()),
        isSystemRole: true
      },
      {
        id: 'moderator',
        name: '内容审核员',
        description: '负责审核平台上的内容',
        permissions: [
          'post:read',
          'user:read',
          'community:comment',
          'community:like',
          'content:review',
          'content:approve',
          'content:reject',
        ],
        isSystemRole: true
      },
      {
        id: 'analyst',
        name: '数据分析员',
        description: '负责查看和分析平台数据',
        permissions: [
          'post:read',
          'user:read',
          'analytics:view',
          'analytics:export',
        ],
        isSystemRole: true
      }
    ];
    
    // 将默认角色添加到角色映射中
    defaultRoles.forEach(role => {
      this.roles.set(role.id, role);
    });
  }
  
  /**
   * 获取所有权限
   */
  getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }
  
  /**
   * 根据ID获取权限
   */
  getPermission(permissionId: string): Permission | undefined {
    return this.permissions.get(permissionId);
  }
  
  /**
   * 根据资源和操作获取权限
   */
  getPermissionByResourceAndAction(resource: string, action: string): Permission | undefined {
    return Array.from(this.permissions.values()).find(
      perm => perm.resource === resource && perm.action === action
    );
  }
  
  /**
   * 获取所有角色
   */
  getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }
  
  /**
   * 根据ID获取角色
   */
  getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId);
  }
  
  /**
   * 根据名称获取角色
   */
  getRoleByName(name: string): Role | undefined {
    return Array.from(this.roles.values()).find(role => role.name.toLowerCase() === name.toLowerCase());
  }
  
  /**
   * 检查用户是否具有特定角色
   */
  hasRole(userId: string, roleId: string): boolean {
    const userRoleSet = this.userRoles.get(userId);
    return !!userRoleSet && userRoleSet.has(roleId);
  }
  
  /**
   * 获取用户的所有角色
   */
  getUserRoles(userId: string): string[] {
    const userRoleSet = this.userRoles.get(userId);
    return userRoleSet ? Array.from(userRoleSet) : [];
  }
  
  /**
   * 获取用户角色的详细信息
   */
  getUserRoleDetails(userId: string): Role[] {
    const roleIds = this.getUserRoles(userId);
    return roleIds.map(roleId => this.getRole(roleId)).filter((role): role is Role => role !== undefined);
  }
  
  /**
   * 为用户分配角色
   */
  assignRole(userId: string, roleId: string, assignedBy?: string): boolean {
    // 检查角色是否存在
    if (!this.roles.has(roleId)) {
      console.error(`Role not found: ${roleId}`);
      return false;
    }

    // 获取用户角色集合，如果不存在则创建
    let userRoleSet = this.userRoles.get(userId);
    if (!userRoleSet) {
      userRoleSet = new Set<string>();
      this.userRoles.set(userId, userRoleSet);
    }

    // 添加角色
    userRoleSet.add(roleId);
    // 持久化到存储
    this.saveUserRolesToStorage();
    return true;
  }
  
  /**
   * 从用户移除角色
   */
  removeRole(userId: string, roleId: string): boolean {
    // 获取用户角色集合
    const userRoleSet = this.userRoles.get(userId);
    if (!userRoleSet) {
      return false;
    }

    // 移除角色
    const result = userRoleSet.delete(roleId);
    if (result) {
      // 持久化到存储
      this.saveUserRolesToStorage();
    }
    return result;
  }
  
  /**
   * 替换用户的所有角色
   */
  replaceRoles(userId: string, roleIds: string[]): boolean {
    // 验证所有角色是否存在
    const invalidRoles = roleIds.filter(roleId => !this.roles.has(roleId));
    if (invalidRoles.length > 0) {
      console.error(`Invalid roles: ${invalidRoles.join(', ')}`);
      return false;
    }

    // 替换角色集合
    this.userRoles.set(userId, new Set(roleIds));
    // 持久化到存储
    this.saveUserRolesToStorage();
    return true;
  }
  
  /**
   * 检查用户是否具有特定权限
   */
  hasPermission(userId: string, permissionId: string): boolean {
    // 获取用户的所有角色
    const userRoleSet = this.userRoles.get(userId);
    if (!userRoleSet) {
      return false;
    }
    
    // 检查用户的任何一个角色是否具有该权限
    for (const roleId of userRoleSet) {
      const role = this.roles.get(roleId);
      if (role && role.permissions.includes(permissionId)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 检查用户是否具有特定资源的特定操作权限
   */
  can(userId: string, resource: string, action: string): boolean {
    // 获取资源-操作对应的权限
    const permission = this.getPermissionByResourceAndAction(resource, action);
    if (!permission) {
      return false;
    }
    
    // 检查用户是否具有该权限
    return this.hasPermission(userId, permission.id);
  }
  
  /**
   * 获取用户的所有权限
   */
  getUserPermissions(userId: string): Permission[] {
    // 获取用户的所有角色
    const userRoleSet = this.userRoles.get(userId);
    if (!userRoleSet) {
      return [];
    }
    
    // 收集所有角色的权限
    const permissionIds = new Set<string>();
    for (const roleId of userRoleSet) {
      const role = this.roles.get(roleId);
      if (role) {
        role.permissions.forEach(permId => permissionIds.add(permId));
      }
    }
    
    // 转换为权限对象
    return Array.from(permissionIds)
      .map(permId => this.permissions.get(permId))
      .filter((perm): perm is Permission => perm !== undefined);
  }
  
  /**
   * 检查角色是否具有特定权限
   */
  roleHasPermission(roleId: string, permissionId: string): boolean {
    const role = this.roles.get(roleId);
    return !!role && role.permissions.includes(permissionId);
  }
  
  /**
   * 为角色添加权限
   */
  addPermissionToRole(roleId: string, permissionId: string): boolean {
    // 检查角色和权限是否存在
    const role = this.roles.get(roleId);
    const permission = this.permissions.get(permissionId);
    
    if (!role || !permission) {
      console.error(`Invalid role or permission: roleId=${roleId}, permissionId=${permissionId}`);
      return false;
    }
    
    // 检查权限是否已存在
    if (role.permissions.includes(permissionId)) {
      return true; // 权限已存在，无需重复添加
    }
    
    // 添加权限
    role.permissions.push(permissionId);
    return true;
  }
  
  /**
   * 从角色移除权限
   */
  removePermissionFromRole(roleId: string, permissionId: string): boolean {
    // 检查角色是否存在
    const role = this.roles.get(roleId);
    if (!role) {
      console.error(`Role not found: ${roleId}`);
      return false;
    }
    
    // 检查权限是否存在
    const permissionIndex = role.permissions.indexOf(permissionId);
    if (permissionIndex === -1) {
      return true; // 权限不存在，无需移除
    }
    
    // 移除权限
    role.permissions.splice(permissionIndex, 1);
    return true;
  }
  
  /**
   * 创建新角色
   */
  createRole(role: Omit<Role, 'id'>): Role | null {
    // 生成唯一ID
    const roleId = `role_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // 验证权限是否都存在
    const invalidPermissions = role.permissions.filter(permId => !this.permissions.has(permId));
    if (invalidPermissions.length > 0) {
      console.error(`Invalid permissions: ${invalidPermissions.join(', ')}`);
      return null;
    }

    // 创建新角色
    const newRole: Role = {
      ...role,
      id: roleId
    };

    // 添加到角色映射
    this.roles.set(roleId, newRole);
    // 持久化到存储
    this.saveCustomRolesToStorage();
    return newRole;
  }
  
  /**
   * 更新角色信息
   */
  updateRole(roleId: string, roleData: Partial<Role>): boolean {
    // 检查角色是否存在
    const role = this.roles.get(roleId);
    if (!role) {
      console.error(`Role not found: ${roleId}`);
      return false;
    }

    // 如果更新了权限，验证所有权限是否存在
    if (roleData.permissions) {
      const invalidPermissions = roleData.permissions.filter(permId => !this.permissions.has(permId));
      if (invalidPermissions.length > 0) {
        console.error(`Invalid permissions: ${invalidPermissions.join(', ')}`);
        return false;
      }
    }

    // 更新角色信息
    const updatedRole = {
      ...role,
      ...roleData
    };

    // 保存更新后的角色
    this.roles.set(roleId, updatedRole);
    // 如果是自定义角色，持久化到存储
    if (!updatedRole.isSystemRole) {
      this.saveCustomRolesToStorage();
    }
    return true;
  }
  
  /**
   * 删除角色
   */
  deleteRole(roleId: string): boolean {
    // 检查角色是否存在
    const role = this.roles.get(roleId);
    if (!role) {
      return false;
    }

    // 系统内置角色不能删除
    if (role.isSystemRole) {
      console.error(`Cannot delete system role: ${roleId}`);
      return false;
    }

    // 从所有用户中移除该角色
    for (const [userId, roleSet] of this.userRoles.entries()) {
      roleSet.delete(roleId);
    }

    // 从角色映射中删除
    const result = this.roles.delete(roleId);
    if (result) {
      // 持久化到存储
      this.saveCustomRolesToStorage();
      this.saveUserRolesToStorage();
    }
    return result;
  }

  /**
   * 清除所有持久化数据（用于测试或重置）
   */
  clearPersistedData(): void {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.customRolesKey);
      this.userRoles.clear();
      // 只保留系统角色
      const systemRoles = Array.from(this.roles.values()).filter(role => role.isSystemRole);
      this.roles.clear();
      systemRoles.forEach(role => this.roles.set(role.id, role));
    } catch (error) {
      console.error('Failed to clear persisted RBAC data:', error);
    }
  }
}

// 导出单例实例
const rbacService = new RBACService();
export default rbacService;
