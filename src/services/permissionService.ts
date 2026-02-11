import { supabase, supabaseAdmin } from '@/lib/supabase';

// 权限定义
export const PERMISSIONS = {
  // 控制台
  DASHBOARD_VIEW: { permission: 'dashboard:view', name: '查看控制台' },

  // 用户管理
  USERS_VIEW: { permission: 'users:view', name: '查看用户' },
  USERS_MANAGE: { permission: 'users:manage', name: '管理用户' },

  // 作品审核
  WORKS_AUDIT: { permission: 'works:audit', name: '审核作品' },

  // 活动管理
  EVENTS_VIEW: { permission: 'events:view', name: '查看活动' },
  EVENTS_MANAGE: { permission: 'events:manage', name: '管理活动' },

  // 数据分析
  ANALYTICS_VIEW: { permission: 'analytics:view', name: '查看数据分析' },

  // 品牌合作
  BRAND_VIEW: { permission: 'brand:view', name: '查看品牌合作' },
  BRAND_MANAGE: { permission: 'brand:manage', name: '管理品牌合作' },

  // 创作者管理
  CREATORS_VIEW: { permission: 'creators:view', name: '查看创作者' },
  CREATORS_MANAGE: { permission: 'creators:manage', name: '管理创作者' },

  // 订单管理
  ORDERS_VIEW: { permission: 'orders:view', name: '查看订单' },
  ORDERS_MANAGE: { permission: 'orders:manage', name: '管理订单' },

  // 权限管理
  ROLE_MANAGE: { permission: 'role:manage', name: '管理角色' },
  ADMIN_MANAGE: { permission: 'admin:manage', name: '管理管理员账号' },

  // 系统设置
  SETTINGS_MANAGE: { permission: 'settings:manage', name: '管理系统设置' },

  // 内容审核
  CONTENT_MODERATE: { permission: 'content:moderate', name: '内容审核' },

  // 日志
  LOGS_VIEW: { permission: 'logs:view', name: '查看操作日志' },
} as const;

// 权限分组
export const PERMISSION_GROUPS = [
  {
    name: '控制台',
    permissions: [PERMISSIONS.DASHBOARD_VIEW]
  },
  {
    name: '用户管理',
    permissions: [PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_MANAGE]
  },
  {
    name: '作品审核',
    permissions: [PERMISSIONS.WORKS_AUDIT]
  },
  {
    name: '活动管理',
    permissions: [PERMISSIONS.EVENTS_VIEW, PERMISSIONS.EVENTS_MANAGE]
  },
  {
    name: '数据分析',
    permissions: [PERMISSIONS.ANALYTICS_VIEW]
  },
  {
    name: '品牌合作',
    permissions: [PERMISSIONS.BRAND_VIEW, PERMISSIONS.BRAND_MANAGE]
  },
  {
    name: '创作者管理',
    permissions: [PERMISSIONS.CREATORS_VIEW, PERMISSIONS.CREATORS_MANAGE]
  },
  {
    name: '订单管理',
    permissions: [PERMISSIONS.ORDERS_VIEW, PERMISSIONS.ORDERS_MANAGE]
  },
  {
    name: '权限管理',
    permissions: [PERMISSIONS.ROLE_MANAGE, PERMISSIONS.ADMIN_MANAGE]
  },
  {
    name: '系统设置',
    permissions: [PERMISSIONS.SETTINGS_MANAGE]
  },
  {
    name: '内容审核',
    permissions: [PERMISSIONS.CONTENT_MODERATE]
  },
  {
    name: '操作日志',
    permissions: [PERMISSIONS.LOGS_VIEW]
  }
];

// 角色类型
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

// 权限类型
export interface Permission {
  permission: string;
  name: string;
}

// 管理员账号类型
export interface AdminAccount {
  id: string;
  user_id: string;
  role_id: string;
  username: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  status: 'active' | 'inactive' | 'suspended';
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  role?: Role;
}

// 操作日志类型
export interface OperationLog {
  id: string;
  admin_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  admin?: AdminAccount;
}

class PermissionService {
  // 获取所有角色
  async getRoles(): Promise<Role[]> {
    const { data, error } = await supabase
      .from('admin_roles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('获取角色列表失败:', error);
      throw error;
    }

    return data || [];
  }

  // 获取单个角色
  async getRoleById(roleId: string): Promise<Role | null> {
    const { data, error } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('id', roleId)
      .single();

    if (error) {
      console.error('获取角色详情失败:', error);
      return null;
    }

    return data;
  }

  // 创建角色
  async createRole(role: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role | null> {
    const { data, error } = await supabase
      .from('admin_roles')
      .insert(role)
      .select()
      .single();

    if (error) {
      console.error('创建角色失败:', error);
      throw error;
    }

    return data;
  }

  // 更新角色
  async updateRole(roleId: string, updates: Partial<Role>): Promise<boolean> {
    const { error } = await supabase
      .from('admin_roles')
      .update(updates)
      .eq('id', roleId);

    if (error) {
      console.error('更新角色失败:', error);
      return false;
    }

    return true;
  }

  // 删除角色
  async deleteRole(roleId: string): Promise<boolean> {
    // 检查是否有管理员使用该角色
    const { count, error: countError } = await supabase
      .from('admin_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', roleId);

    if (countError) {
      console.error('检查角色使用情况失败:', countError);
      return false;
    }

    if (count && count > 0) {
      throw new Error('该角色正在被使用，无法删除');
    }

    const { error } = await supabase
      .from('admin_roles')
      .delete()
      .eq('id', roleId);

    if (error) {
      console.error('删除角色失败:', error);
      return false;
    }

    return true;
  }

  // 获取所有管理员账号
  async getAdminAccounts(): Promise<AdminAccount[]> {
    const { data, error } = await supabase
      .from('admin_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取管理员账号失败:', error);
      throw error;
    }

    const accounts = data || [];
    const roleIds = [...new Set(accounts.filter(a => a.role_id).map(a => a.role_id))];

    // 批量获取角色信息
    let rolesMap: Record<string, Role> = {};
    if (roleIds.length > 0) {
      const { data: roles, error: rolesError } = await supabase
        .from('admin_roles')
        .select('*')
        .in('id', roleIds);
      if (!rolesError && roles) {
        rolesMap = roles.reduce((acc, r) => ({ ...acc, [r.id]: r }), {});
      }
    }

    // 合并数据
    return accounts.map(a => ({
      ...a,
      role: a.role_id ? rolesMap[a.role_id] : undefined
    }));
  }

  // 获取单个管理员账号
  async getAdminAccountById(adminId: string): Promise<AdminAccount | null> {
    const { data, error } = await supabase
      .from('admin_accounts')
      .select('*')
      .eq('id', adminId)
      .single();

    if (error) {
      console.error('获取管理员详情失败:', error);
      return null;
    }

    if (!data) return null;

    // 获取角色信息
    let role = undefined;
    if (data.role_id) {
      const { data: roleData, error: roleError } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('id', data.role_id)
        .single();
      if (!roleError && roleData) {
        role = roleData;
      }
    }

    return { ...data, role };
  }

  // 根据用户ID获取管理员账号
  async getAdminAccountByUserId(userId: string): Promise<AdminAccount | null> {
    const { data, error } = await supabase
      .from('admin_accounts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('获取管理员账号失败:', error);
      return null;
    }

    if (!data) return null;

    // 获取角色信息
    let role = undefined;
    if (data.role_id) {
      const { data: roleData, error: roleError } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('id', data.role_id)
        .single();
      if (!roleError && roleData) {
        role = roleData;
      }
    }

    return { ...data, role };
  }

  // 创建管理员账号
  async createAdminAccount(account: Omit<AdminAccount, 'id' | 'created_at' | 'updated_at' | 'last_login_at'>): Promise<AdminAccount | null> {
    const { data, error } = await supabase
      .from('admin_accounts')
      .insert(account)
      .select('*')
      .single();

    if (error) {
      console.error('创建管理员账号失败:', error);
      throw error;
    }

    if (!data) return null;

    // 获取角色信息
    let role = undefined;
    if (data.role_id) {
      const { data: roleData, error: roleError } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('id', data.role_id)
        .single();
      if (!roleError && roleData) {
        role = roleData;
      }
    }

    return { ...data, role };
  }

  // 更新管理员账号
  async updateAdminAccount(adminId: string, updates: Partial<AdminAccount>): Promise<boolean> {
    const { error } = await supabase
      .from('admin_accounts')
      .update(updates)
      .eq('id', adminId);

    if (error) {
      console.error('更新管理员账号失败:', error);
      return false;
    }

    return true;
  }

  // 删除管理员账号
  async deleteAdminAccount(adminId: string): Promise<boolean> {
    const { error } = await supabase
      .from('admin_accounts')
      .delete()
      .eq('id', adminId);

    if (error) {
      console.error('删除管理员账号失败:', error);
      return false;
    }

    return true;
  }

  // 更新最后登录时间
  async updateLastLogin(adminId: string): Promise<boolean> {
    const { error } = await supabase
      .from('admin_accounts')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', adminId);

    if (error) {
      console.error('更新登录时间失败:', error);
      return false;
    }

    return true;
  }

  // 检查权限
  async checkPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('check_admin_permission', {
          admin_user_id: userId,
          required_permission: permission
        });

      if (!error && data !== null) {
        return data;
      }
    } catch (error) {
      console.log('RPC调用失败，使用备用方案');
    }

    // 备用方案：直接查询
    try {
      const { data: adminData } = await supabase
        .from('admin_accounts')
        .select('role_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!adminData?.role_id) return false;

      const { data: roleData } = await supabase
        .from('admin_roles')
        .select('permissions')
        .eq('id', adminData.role_id)
        .single();

      if (!roleData?.permissions) return false;

      return roleData.permissions.some((p: any) => p.permission === permission);
    } catch (error) {
      console.error('检查权限失败:', error);
      return false;
    }
  }

  // 获取用户权限列表
  async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_admin_permissions', {
          admin_user_id: userId
        });

      if (!error && data) {
        return data;
      }
    } catch (error) {
      console.log('RPC调用失败，使用备用方案');
    }

    // 备用方案：直接查询
    try {
      const { data: adminData } = await supabase
        .from('admin_accounts')
        .select('role_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!adminData?.role_id) return [];

      const { data: roleData } = await supabase
        .from('admin_roles')
        .select('permissions')
        .eq('id', adminData.role_id)
        .single();

      return roleData?.permissions || [];
    } catch (error) {
      console.error('获取用户权限失败:', error);
      return [];
    }
  }

  // 获取操作日志
  async getOperationLogs(options?: {
    page?: number;
    limit?: number;
    adminId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ logs: OperationLog[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    let query = supabase
      .from('admin_operation_logs')
      .select('*', { count: 'exact' });

    if (options?.adminId) {
      query = query.eq('admin_id', options.adminId);
    }

    if (options?.action) {
      query = query.eq('action', options.action);
    }

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate);
    }

    if (options?.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('获取操作日志失败:', error);
      throw error;
    }

    const logs = data || [];
    const adminIds = [...new Set(logs.filter(l => l.admin_id).map(l => l.admin_id))];

    // 批量获取管理员信息
    let adminsMap: Record<string, any> = {};
    if (adminIds.length > 0) {
      const { data: admins, error: adminsError } = await supabase
        .from('admin_accounts')
        .select('id, username, email')
        .in('id', adminIds);
      if (!adminsError && admins) {
        adminsMap = admins.reduce((acc, a) => ({ ...acc, [a.id]: a }), {});
      }
    }

    // 合并数据
    const enrichedLogs = logs.map(l => ({
      ...l,
      admin: l.admin_id ? adminsMap[l.admin_id] || { username: '未知管理员' } : null
    }));

    return {
      logs: enrichedLogs,
      total: count || 0
    };
  }

  // 记录操作日志
  async logOperation(
    adminId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<string | null> {
    try {
      // 尝试使用RPC函数
      const { data, error } = await supabase
        .rpc('log_admin_operation', {
          p_admin_id: adminId,
          p_action: action,
          p_resource_type: resourceType,
          p_resource_id: resourceId,
          p_details: details
        });

      if (!error && data) {
        return data;
      }
    } catch (error) {
      console.log('RPC调用失败，使用备用方案');
    }

    // 备用方案：直接插入
    try {
      const { data, error } = await supabase
        .from('admin_operation_logs')
        .insert({
          admin_id: adminId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details
        })
        .select('id')
        .single();

      if (error) {
        console.error('记录操作日志失败:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('记录操作日志失败:', error);
      return null;
    }
  }

  // 获取管理员统计
  async getAdminStats(): Promise<{
    totalAdmins: number;
    activeAdmins: number;
    inactiveAdmins: number;
    suspendedAdmins: number;
    totalRoles: number;
    todayOperations: number;
  }> {
    try {
      // 获取管理员统计
      const { data: adminData, error: adminError } = await supabase
        .from('admin_accounts')
        .select('status');

      if (adminError) throw adminError;

      // 获取角色数量
      const { count: roleCount, error: roleError } = await supabase
        .from('admin_roles')
        .select('*', { count: 'exact', head: true });

      if (roleError) throw roleError;

      // 获取今日操作数
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: operationCount, error: operationError } = await supabase
        .from('admin_operation_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      if (operationError) throw operationError;

      const stats = {
        totalAdmins: adminData?.length || 0,
        activeAdmins: adminData?.filter(a => a.status === 'active').length || 0,
        inactiveAdmins: adminData?.filter(a => a.status === 'inactive').length || 0,
        suspendedAdmins: adminData?.filter(a => a.status === 'suspended').length || 0,
        totalRoles: roleCount || 0,
        todayOperations: operationCount || 0
      };

      return stats;
    } catch (error) {
      console.error('获取管理员统计失败:', error);
      return {
        totalAdmins: 0,
        activeAdmins: 0,
        inactiveAdmins: 0,
        suspendedAdmins: 0,
        totalRoles: 0,
        todayOperations: 0
      };
    }
  }
}

export const permissionService = new PermissionService();
