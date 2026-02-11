import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import {
  permissionService,
  PERMISSION_GROUPS,
  type Role,
  type Permission,
  PERMISSIONS
} from '@/services/permissionService';
import {
  Shield,
  Users,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  Search,
  Key,
  UserPlus,
  MoreVertical,
  Lock,
  Unlock,
  Clock,
  Activity
} from 'lucide-react';
import { AuthContext } from '@/contexts/authContext';

// 角色名称映射
const roleNameMap: Record<string, string> = {
  'super_admin': '超级管理员',
  'admin': '管理员',
  'moderator': '审核员',
  'operator': '运营'
};

// 角色描述映射
const roleDescMap: Record<string, string> = {
  'super_admin': '拥有系统的所有权限，可以管理其他管理员账号和角色',
  'admin': '拥有大部分管理权限，可以管理用户、内容和订单',
  'moderator': '主要负责内容审核和作品审核',
  'operator': '负责日常运营工作，包括活动管理和订单处理'
};

export default function PermissionManagement() {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);

  // 标签页状态
  const [activeTab, setActiveTab] = useState<'roles' | 'admins' | 'logs'>('roles');

  // 角色管理状态
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // 管理员账号状态
  const [admins, setAdmins] = useState<any[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);

  // 操作日志状态
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);

  // 统计信息
  const [stats, setStats] = useState({
    totalAdmins: 0,
    activeAdmins: 0,
    totalRoles: 0,
    todayOperations: 0
  });

  // 表单状态
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  const [adminForm, setAdminForm] = useState({
    username: '',
    email: '',
    phone: '',
    role_id: '',
    status: 'active' as 'active' | 'inactive' | 'suspended'
  });

  // 加载数据
  useEffect(() => {
    loadRoles();
    loadAdmins();
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab, logsPage]);

  const loadRoles = async () => {
    setRolesLoading(true);
    try {
      const data = await permissionService.getRoles();
      setRoles(data);
    } catch (error) {
      toast.error('加载角色列表失败');
    } finally {
      setRolesLoading(false);
    }
  };

  const loadAdmins = async () => {
    setAdminsLoading(true);
    try {
      const data = await permissionService.getAdminAccounts();
      setAdmins(data);
    } catch (error) {
      toast.error('加载管理员列表失败');
    } finally {
      setAdminsLoading(false);
    }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const { logs: data, total } = await permissionService.getOperationLogs({
        page: logsPage,
        limit: 20
      });
      setLogs(data);
      setLogsTotal(total);
    } catch (error) {
      toast.error('加载操作日志失败');
    } finally {
      setLogsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await permissionService.getAdminStats();
      setStats(data);
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  // 角色操作
  const handleCreateRole = async () => {
    if (!roleForm.name.trim()) {
      toast.error('请输入角色名称');
      return;
    }

    try {
      const permissions: Permission[] = roleForm.permissions.map(p => {
        const perm = Object.values(PERMISSIONS).find(perm => perm.permission === p);
        return perm || { permission: p, name: p };
      });

      await permissionService.createRole({
        name: roleForm.name,
        description: roleForm.description,
        permissions
      });

      toast.success('角色创建成功');
      setShowRoleModal(false);
      resetRoleForm();
      loadRoles();
      loadStats();
    } catch (error: any) {
      toast.error(error.message || '创建角色失败');
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    try {
      const permissions: Permission[] = roleForm.permissions.map(p => {
        const perm = Object.values(PERMISSIONS).find(perm => perm.permission === p);
        return perm || { permission: p, name: p };
      });

      await permissionService.updateRole(editingRole.id, {
        name: roleForm.name,
        description: roleForm.description,
        permissions
      });

      toast.success('角色更新成功');
      setShowRoleModal(false);
      setEditingRole(null);
      resetRoleForm();
      loadRoles();
    } catch (error: any) {
      toast.error(error.message || '更新角色失败');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('确定要删除这个角色吗？')) return;

    try {
      await permissionService.deleteRole(roleId);
      toast.success('角色删除成功');
      loadRoles();
      loadStats();
    } catch (error: any) {
      toast.error(error.message || '删除角色失败');
    }
  };

  // 管理员操作
  const handleCreateAdmin = async () => {
    if (!adminForm.username.trim() || !adminForm.email.trim() || !adminForm.role_id) {
      toast.error('请填写完整信息');
      return;
    }

    try {
      await permissionService.createAdminAccount({
        user_id: crypto.randomUUID(), // 临时UUID，实际应该关联真实用户
        username: adminForm.username,
        email: adminForm.email,
        phone: adminForm.phone,
        role_id: adminForm.role_id,
        status: adminForm.status,
        created_by: user?.id
      });

      toast.success('管理员账号创建成功');
      setShowAdminModal(false);
      resetAdminForm();
      loadAdmins();
      loadStats();
    } catch (error: any) {
      toast.error(error.message || '创建管理员账号失败');
    }
  };

  const handleUpdateAdmin = async () => {
    if (!editingAdmin) return;

    try {
      await permissionService.updateAdminAccount(editingAdmin.id, {
        username: adminForm.username,
        email: adminForm.email,
        phone: adminForm.phone,
        role_id: adminForm.role_id,
        status: adminForm.status
      });

      toast.success('管理员账号更新成功');
      setShowAdminModal(false);
      setEditingAdmin(null);
      resetAdminForm();
      loadAdmins();
      loadStats();
    } catch (error: any) {
      toast.error(error.message || '更新管理员账号失败');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('确定要删除这个管理员账号吗？')) return;

    try {
      await permissionService.deleteAdminAccount(adminId);
      toast.success('管理员账号删除成功');
      loadAdmins();
      loadStats();
    } catch (error: any) {
      toast.error(error.message || '删除管理员账号失败');
    }
  };

  const handleToggleAdminStatus = async (admin: any) => {
    const newStatus = admin.status === 'active' ? 'inactive' : 'active';
    try {
      await permissionService.updateAdminAccount(admin.id, { status: newStatus });
      toast.success(`管理员账号已${newStatus === 'active' ? '启用' : '禁用'}`);
      loadAdmins();
      loadStats();
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 表单重置
  const resetRoleForm = () => {
    setRoleForm({
      name: '',
      description: '',
      permissions: []
    });
  };

  const resetAdminForm = () => {
    setAdminForm({
      username: '',
      email: '',
      phone: '',
      role_id: '',
      status: 'active'
    });
  };

  // 编辑角色
  const startEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions.map(p => p.permission)
    });
    setShowRoleModal(true);
  };

  // 编辑管理员
  const startEditAdmin = (admin: any) => {
    setEditingAdmin(admin);
    setAdminForm({
      username: admin.username,
      email: admin.email,
      phone: admin.phone || '',
      role_id: admin.role_id,
      status: admin.status
    });
    setShowAdminModal(true);
  };

  // 切换权限组展开
  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  };

  // 切换权限选择
  const togglePermission = (permission: string) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  // 全选/取消全选权限组
  const toggleGroupPermissions = (groupPermissions: Permission[], selected: boolean) => {
    const permissionKeys = groupPermissions.map(p => p.permission);
    setRoleForm(prev => ({
      ...prev,
      permissions: selected
        ? [...new Set([...prev.permissions, ...permissionKeys])]
        : prev.permissions.filter(p => !permissionKeys.includes(p))
    }));
  };

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-600';
      case 'inactive':
        return 'bg-gray-100 text-gray-600';
      case 'suspended':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '正常';
      case 'inactive':
        return '禁用';
      case 'suspended':
        return '暂停';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: '管理员总数', value: stats.totalAdmins, icon: Users, color: 'blue' },
          { title: '活跃管理员', value: stats.activeAdmins, icon: Shield, color: 'green' },
          { title: '角色数量', value: stats.totalRoles, icon: Key, color: 'purple' },
          { title: '今日操作', value: stats.todayOperations, icon: Activity, color: 'orange' }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.title}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 标签页切换 */}
      <div className={`flex space-x-1 p-1 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {[
          { id: 'roles', label: '角色管理', icon: Key },
          { id: 'admins', label: '管理员账号', icon: Users },
          { id: 'logs', label: '操作日志', icon: Clock }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-red-600 text-white shadow-md'
                : isDark
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 角色管理 */}
      {activeTab === 'roles' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">角色管理</h2>
            <button
              onClick={() => {
                setEditingRole(null);
                resetRoleForm();
                setShowRoleModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>创建角色</span>
            </button>
          </div>

          {rolesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((role) => (
                <motion.div
                  key={role.id}
                  layout
                  className={`p-6 rounded-xl border-2 transition-all ${
                    isDark
                      ? 'border-gray-700 hover:border-gray-600 bg-gray-700/50'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                        <Shield className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{roleNameMap[role.name] || role.name}</h3>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {role.permissions.length} 项权限
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => startEditRole(role)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                        }`}
                      >
                        <Edit2 className="w-4 h-4 text-blue-500" />
                      </button>
                      {!['super_admin', 'admin', 'moderator', 'operator'].includes(role.name) && (
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                          }`}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {roleDescMap[role.name] || role.description || '暂无描述'}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {role.permissions.slice(0, 5).map((perm, index) => (
                      <span
                        key={index}
                        className={`text-xs px-2 py-1 rounded-full ${
                          isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {perm.name}
                      </span>
                    ))}
                    {role.permissions.length > 5 && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                      }`}>
                        +{role.permissions.length - 5}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* 管理员账号 */}
      {activeTab === 'admins' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">管理员账号</h2>
            <button
              onClick={() => {
                setEditingAdmin(null);
                resetAdminForm();
                setShowAdminModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>添加管理员</span>
            </button>
          </div>

          {adminsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <table className="min-w-full">
                <thead>
                  <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <th className="px-4 py-3 text-left text-sm font-medium">管理员</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">角色</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">联系方式</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">最后登录</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={admin.avatar_url || `https://ui-avatars.com/api/?name=${admin.username}&background=random`}
                            alt={admin.username}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-medium">{admin.username}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {admin.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          admin.role?.name === 'super_admin'
                            ? 'bg-red-100 text-red-600'
                            : admin.role?.name === 'admin'
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {roleNameMap[admin.role?.name] || admin.role?.name || '未知角色'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {admin.phone || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(admin.status)}`}>
                          {getStatusText(admin.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {admin.last_login_at
                          ? new Date(admin.last_login_at).toLocaleString()
                          : '从未登录'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => startEditAdmin(admin)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                            }`}
                          >
                            <Edit2 className="w-4 h-4 text-blue-500" />
                          </button>
                          <button
                            onClick={() => handleToggleAdminStatus(admin)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                            }`}
                          >
                            {admin.status === 'active' ? (
                              <Lock className="w-4 h-4 text-yellow-500" />
                            ) : (
                              <Unlock className="w-4 h-4 text-green-500" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteAdmin(admin.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                            }`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* 操作日志 */}
      {activeTab === 'logs' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">操作日志</h2>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              共 {logsTotal} 条记录
            </span>
          </div>

          {logsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                          <Activity className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {log.admin?.username || '未知管理员'}
                            <span className={`text-sm ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {log.action}
                            </span>
                          </p>
                          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {log.resource_type}
                            {log.resource_id && ` - ${log.resource_id}`}
                          </p>
                          {log.details && (
                            <pre className={`text-xs mt-2 p-2 rounded ${
                              isDark ? 'bg-gray-800' : 'bg-gray-100'
                            }`}>
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 分页 */}
              {logsTotal > 20 && (
                <div className="mt-6 flex justify-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                      disabled={logsPage === 1}
                      className="px-3 py-2 rounded-lg disabled:opacity-50"
                    >
                      上一页
                    </button>
                    <span className="px-4 py-2">
                      {logsPage} / {Math.ceil(logsTotal / 20)}
                    </span>
                    <button
                      onClick={() => setLogsPage(p => p + 1)}
                      disabled={logsPage >= Math.ceil(logsTotal / 20)}
                      className="px-3 py-2 rounded-lg disabled:opacity-50"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* 角色编辑弹窗 */}
      <AnimatePresence>
        {showRoleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl ${
                isDark ? 'bg-gray-800' : 'bg-white'
              } shadow-xl`}
            >
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <h3 className="text-xl font-bold">
                  {editingRole ? '编辑角色' : '创建角色'}
                </h3>
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    setEditingRole(null);
                    resetRoleForm();
                  }}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* 角色名称 */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    角色名称
                  </label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="请输入角色名称"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-red-500`}
                  />
                </div>

                {/* 角色描述 */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    角色描述
                  </label>
                  <textarea
                    value={roleForm.description}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="请输入角色描述"
                    rows={3}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-red-500`}
                  />
                </div>

                {/* 权限选择 */}
                <div>
                  <label className={`block text-sm font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    权限配置
                  </label>
                  <div className="space-y-3">
                    {PERMISSION_GROUPS.map((group) => {
                      const isExpanded = expandedGroups.includes(group.name);
                      const groupPermissionKeys = group.permissions.map(p => p.permission);
                      const selectedCount = roleForm.permissions.filter(p =>
                        groupPermissionKeys.includes(p)
                      ).length;
                      const allSelected = selectedCount === group.permissions.length;

                      return (
                        <div
                          key={group.name}
                          className={`rounded-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                        >
                          <button
                            onClick={() => toggleGroup(group.name)}
                            className={`w-full px-4 py-3 flex items-center justify-between ${
                              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                              <span className="font-medium">{group.name}</span>
                              {selectedCount > 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                                  {selectedCount}/{group.permissions.length}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGroupPermissions(group.permissions, !allSelected);
                              }}
                              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                                allSelected
                                  ? 'bg-red-600 text-white'
                                  : isDark
                                    ? 'bg-gray-600 text-gray-300'
                                    : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {allSelected ? '取消全选' : '全选'}
                            </button>
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className={`px-4 pb-4 space-y-2 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                  {group.permissions.map((perm) => (
                                    <label
                                      key={perm.permission}
                                      className="flex items-center space-x-3 py-2 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={roleForm.permissions.includes(perm.permission)}
                                        onChange={() => togglePermission(perm.permission)}
                                        className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                      />
                                      <span className="text-sm">{perm.name}</span>
                                    </label>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}>
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    setEditingRole(null);
                    resetRoleForm();
                  }}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  取消
                </button>
                <button
                  onClick={editingRole ? handleUpdateRole : handleCreateRole}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  {editingRole ? '保存修改' : '创建角色'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 管理员编辑弹窗 */}
      <AnimatePresence>
        {showAdminModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
            >
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <h3 className="text-xl font-bold">
                  {editingAdmin ? '编辑管理员' : '添加管理员'}
                </h3>
                <button
                  onClick={() => {
                    setShowAdminModal(false);
                    setEditingAdmin(null);
                    resetAdminForm();
                  }}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    用户名
                  </label>
                  <input
                    type="text"
                    value={adminForm.username}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="请输入用户名"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-red-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    邮箱
                  </label>
                  <input
                    type="email"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="请输入邮箱"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-red-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    手机号
                  </label>
                  <input
                    type="tel"
                    value={adminForm.phone}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="请输入手机号"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-red-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    角色
                  </label>
                  <select
                    value={adminForm.role_id}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, role_id: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-red-500`}
                  >
                    <option value="">请选择角色</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {roleNameMap[role.name] || role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    状态
                  </label>
                  <select
                    value={adminForm.status}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-red-500`}
                  >
                    <option value="active">正常</option>
                    <option value="inactive">禁用</option>
                    <option value="suspended">暂停</option>
                  </select>
                </div>
              </div>

              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}>
                <button
                  onClick={() => {
                    setShowAdminModal(false);
                    setEditingAdmin(null);
                    resetAdminForm();
                  }}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  取消
                </button>
                <button
                  onClick={editingAdmin ? handleUpdateAdmin : handleCreateAdmin}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  {editingAdmin ? '保存修改' : '添加管理员'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
