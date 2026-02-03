import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { TianjinImage } from './TianjinStyleComponents';
import { communityService } from '@/services/communityService';

// 类型定义
export type CommunityRole = 'admin' | 'editor' | 'member';

export type CommunityPermission = 
  | 'manage_members' 
  | 'manage_posts' 
  | 'manage_announcements' 
  | 'manage_settings' 
  | 'manage_guidelines' 
  | 'view_analytics' 
  | 'create_posts' 
  | 'comment_posts' 
  | 'like_posts';

export type CommunityRolePermissions = Record<CommunityRole, CommunityPermission[]>;

export type Community = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  topic: string;
  avatar: string;
  isActive: boolean;
  isSpecial: boolean;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
  layoutType: 'standard' | 'compact' | 'expanded';
  enabledModules: {
    posts: boolean;
    chat: boolean;
    members: boolean;
    announcements: boolean;
  };
  creatorId?: string;
  createdAt?: string;
  updatedAt?: string;
};

interface CommunityManagementProps {
  isOpen: boolean;
  onClose: () => void;
  community: Community;
  isDark: boolean;
  onDeleteCommunity?: () => void;
}

const CommunityManagement: React.FC<CommunityManagementProps> = ({
  isOpen,
  onClose,
  community,
  isDark,
  onDeleteCommunity
}) => {
  // 状态管理
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<CommunityRole>('member');
  const [showPermissionSettings, setShowPermissionSettings] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [joinApprovalRequired, setJoinApprovalRequired] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 本地存储状态
  const [adminStore, setAdminStore] = useState<Record<string, string[]>>({
    [community.id]: ['user@example.com'] // 默认管理员
  });
  const [memberStore, setMemberStore] = useState<Record<string, string[]>>({
    [community.id]: ['user@example.com'] // 默认成员
  });
  const [roleStore, setRoleStore] = useState<Record<string, Record<string, CommunityRole>>>({
    [community.id]: {
      'user@example.com': 'admin' // 默认角色
    }
  });
  const [permissionStore, setPermissionStore] = useState<Record<string, CommunityRolePermissions>>({
    [community.id]: {
      admin: [
        'manage_members', 'manage_posts', 'manage_announcements', 'manage_settings', 
        'manage_guidelines', 'view_analytics', 'create_posts', 'comment_posts', 'like_posts'
      ],
      editor: [
        'manage_posts', 'view_analytics', 'create_posts', 'comment_posts', 'like_posts'
      ],
      member: [
        'create_posts', 'comment_posts', 'like_posts'
      ]
    }
  });
  const [announceStore, setAnnounceStore] = useState<Record<string, string>>({
    [community.id]: ''
  });
  const [privacyStore, setPrivacyStore] = useState<Record<string, 'public' | 'private'>>({
    [community.id]: 'public'
  });
  
  // 获取当前用户邮箱（从localStorage或其他地方获取）
  const currentEmail = localStorage.getItem('userEmail') || 'user@example.com';

  // 加载社区设置和待审核请求
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // 加载社区设置
        const communityData = await communityService.getCommunity(community.id);
        if (communityData) {
          // 假设getCommunity返回的对象包含joinApprovalRequired字段
          setJoinApprovalRequired(communityData.joinApprovalRequired || false);
        }
        
        // 加载待审核的加入请求
        const requests = await communityService.getPendingJoinRequests(community.id);
        setPendingRequests(requests);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [community.id]);

  // 默认角色权限
  const defaultRolePermissions: CommunityRolePermissions = {
    admin: [
      'manage_members', 'manage_posts', 'manage_announcements', 'manage_settings', 
      'manage_guidelines', 'view_analytics', 'create_posts', 'comment_posts', 'like_posts'
    ],
    editor: [
      'manage_posts', 'view_analytics', 'create_posts', 'comment_posts', 'like_posts'
    ],
    member: [
      'create_posts', 'comment_posts', 'like_posts'
    ]
  };

  // 判断是否为管理员
  const isAdmin = (communityId: string) => {
    return adminStore[communityId]?.includes(currentEmail) || false;
  };

  // 生成邀请链接
  const generateInviteLink = (communityId: string) => {
    // 生成唯一邀请码
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const link = `${window.location.origin}/join-community/${communityId}?code=${inviteCode}`;
    setInviteLink(link);
    
    // 复制到剪贴板
    navigator.clipboard.writeText(link).then(() => {
      toast.success('邀请链接已复制到剪贴板');
    }).catch(err => {
      console.error('复制失败:', err);
      toast.error('复制失败，请手动复制链接');
    });
  };

  // 更新角色权限
  const updateRolePermissions = (communityId: string, role: CommunityRole, permissions: CommunityPermission[]) => {
    const updatedPermissionStore = {
      ...permissionStore,
      [communityId]: {
        ...(permissionStore[communityId] || defaultRolePermissions),
        [role]: permissions
      }
    };
    
    setPermissionStore(updatedPermissionStore);
    toast.success('角色权限已更新');
  };

  // 添加成员
  const addMember = () => {
    const email = newMemberEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast.warning('请输入有效邮箱');
      return;
    }
    
    const updatedMemberStore = {
      ...memberStore,
      [community.id]: Array.from(new Set([
        ...(memberStore[community.id] || []), 
        email
      ]))
    };
    
    setMemberStore(updatedMemberStore);
    
    // 设置成员角色
    const updatedRoleStore = {
      ...roleStore,
      [community.id]: {
        ...(roleStore[community.id] || {}),
        [email]: selectedRole
      }
    };
    
    setRoleStore(updatedRoleStore);
    
    setNewMemberEmail('');
    toast.success('已添加成员');
  };

  // 移除成员
  const removeMemberFromManaged = (email: string) => {
    const updatedMemberStore = {
      ...memberStore,
      [community.id]: (memberStore[community.id] || []).filter(e => e !== email)
    };
    
    setMemberStore(updatedMemberStore);
    
    // 移除成员角色
    const updatedRoleStore = { ...roleStore };
    if (updatedRoleStore[community.id]) {
      const { [email]: removedRole, ...remainingRoles } = updatedRoleStore[community.id];
      updatedRoleStore[community.id] = remainingRoles;
      setRoleStore(updatedRoleStore);
    }
    
    toast.success('已移除成员');
  };

  // 设置社群公告
  const setAnnouncementForManaged = (text: string) => {
    const updatedAnnounceStore = {
      ...announceStore,
      [community.id]: text
    };
    
    setAnnounceStore(updatedAnnounceStore);
    toast.success('公告已更新');
  };

  // 切换社群隐私设置
  const togglePrivacyForManaged = () => {
    const currentPrivacy = privacyStore[community.id] || 'public';
    const updatedPrivacyStore: Record<string, 'public' | 'private'> = {
      ...privacyStore,
      [community.id]: currentPrivacy === 'public' ? 'private' : 'public'
    };
    
    setPrivacyStore(updatedPrivacyStore);
    toast.success(`社群已切换为${currentPrivacy === 'public' ? '私密' : '公开'}模式`);
  };

  // 设置成员角色
  const setMemberRole = (email: string, role: CommunityRole) => {
    const updatedRoleStore = {
      ...roleStore,
      [community.id]: {
        ...(roleStore[community.id] || {}),
        [email]: role
      }
    };
    
    setRoleStore(updatedRoleStore);
    
    // 如果设置为管理员，确保在adminStore中
    if (role === 'admin') {
      if (!adminStore[community.id]?.includes(email)) {
        const updatedAdminStore = {
          ...adminStore,
          [community.id]: [...(adminStore[community.id] || []), email]
        };
        setAdminStore(updatedAdminStore);
      }
    } else {
      // 如果从管理员降级，确保从adminStore中移除
      if (adminStore[community.id]?.includes(email)) {
        const updatedAdminStore = {
          ...adminStore,
          [community.id]: (adminStore[community.id] || []).filter(a => a !== email)
        };
        setAdminStore(updatedAdminStore);
      }
    }
    
    toast.success(`成员角色已更新为${role}`);
  };

  // 更新审核设置
  const updateJoinApprovalSetting = async (value: boolean) => {
    try {
      setLoading(true);
      await communityService.updateJoinApprovalSetting(community.id, value);
      setJoinApprovalRequired(value);
      toast.success(`审核设置已${value ? '开启' : '关闭'}`);
    } catch (error) {
      console.error('更新审核设置失败:', error);
      toast.error('更新审核设置失败');
    } finally {
      setLoading(false);
    }
  };

  // 批准加入请求
  const approveJoinRequest = async (requestId: string) => {
    try {
      setLoading(true);
      await communityService.approveJoinRequest(requestId, community.id);
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      toast.success('已批准加入请求');
    } catch (error) {
      console.error('批准加入请求失败:', error);
      toast.error('批准加入请求失败');
    } finally {
      setLoading(false);
    }
  };

  // 拒绝加入请求
  const rejectJoinRequest = async (requestId: string) => {
    try {
      setLoading(true);
      await communityService.rejectJoinRequest(requestId);
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      toast.success('已拒绝加入请求');
    } catch (error) {
      console.error('拒绝加入请求失败:', error);
      toast.error('拒绝加入请求失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 ${isDark ? 'bg-black/70' : 'bg-black/50'} backdrop-blur-sm flex items-center justify-center p-0 md:p-4`}>
      <motion.div 
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg p-6 max-w-2xl w-full h-full md:h-auto md:max-h-[80vh] overflow-y-auto rounded-none md:rounded-2xl`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">社群管理 - {community.name}</h3>
          <button 
            onClick={onClose} 
            className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} text-xl`}
          >
            ×
          </button>
        </div>
        
        {/* 社群信息 */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">社群信息</h4>
          <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} p-4 rounded-lg`}>
            <div className="flex items-center gap-4">
              <TianjinImage 
                src={community.avatar} 
                alt={community.name} 
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h5 className="font-medium text-lg mb-1">{community.name}</h5>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>{community.description}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    {community.memberCount} 成员
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    {community.topic}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    {privacyStore[community.id] === 'private' ? '私密' : '公开'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 成员管理 */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">成员管理</h4>
          
          {/* 邀请成员 */}
          <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} p-3 rounded-lg mb-4`}>
            <h5 className="text-sm font-medium mb-2">邀请成员</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input 
                value={newMemberEmail} 
                onChange={e => setNewMemberEmail(e.target.value)} 
                placeholder="添加成员邮箱" 
                className={`${isDark ? 'bg-gray-600 text-white ring-1 ring-gray-500' : 'bg-white text-gray-900 ring-1 ring-gray-300'} px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-purple-500' : 'focus:ring-pink-300'}`} 
              />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as CommunityRole)}
                className={`${isDark ? 'bg-gray-600 text-white ring-1 ring-gray-500' : 'bg-white text-gray-900 ring-1 ring-gray-300'} px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-purple-500' : 'focus:ring-pink-300'}`}
              >
                <option value="member">普通成员</option>
                <option value="editor">编辑</option>
                <option value="admin">管理员</option>
              </select>
              <button 
                onClick={addMember} 
                className={`${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'} px-3 py-2 rounded-lg text-sm`}
              >
                邀请
              </button>
            </div>
            
            {/* 邀请链接 */}
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <input 
                  value={inviteLink} 
                  readOnly
                  className={`flex-1 ${isDark ? 'bg-gray-600 text-white ring-1 ring-gray-500' : 'bg-white text-gray-900 ring-1 ring-gray-300'} px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-purple-500' : 'focus:ring-pink-300'}`} 
                />
                <button 
                  onClick={() => generateInviteLink(community.id)} 
                  className={`${isDark ? 'bg-green-600 text-white' : 'bg-green-500 text-white'} px-3 py-2 rounded-lg text-sm`}
                >
                  生成邀请链接
                </button>
              </div>
            </div>
          </div>
          
          {/* 成员列表 */}
          <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} p-3 rounded-lg`}>
            <h5 className="text-sm font-medium mb-2">成员列表</h5>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {[currentEmail, ...(memberStore[community.id] || [])].map((email, i) => {
                const memberRole = roleStore[community.id]?.[email] || 'member';
                return (
                  <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <div className="text-sm">{email}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 
                        memberRole === 'admin' ? 'bg-purple-600 text-white' : 
                        memberRole === 'editor' ? 'bg-blue-600 text-white' : 
                        'bg-green-600 text-white' : 
                        memberRole === 'admin' ? 'bg-purple-500 text-white' : 
                        memberRole === 'editor' ? 'bg-blue-500 text-white' : 
                        'bg-green-500 text-white'}`}>
                        {memberRole === 'admin' ? '管理员' : memberRole === 'editor' ? '编辑' : '成员'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {email !== currentEmail && (
                        <>
                          <select
                            value={memberRole}
                            onChange={(e) => setMemberRole(email, e.target.value as CommunityRole)}
                            className={`${isDark ? 'bg-gray-600 text-white ring-1 ring-gray-500' : 'bg-white text-gray-900 ring-1 ring-gray-300'} px-2 py-1 rounded-lg text-xs focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-purple-500' : 'focus:ring-pink-300'}`}
                          >
                            <option value="member">普通成员</option>
                            <option value="editor">编辑</option>
                            <option value="admin">管理员</option>
                          </select>
                          <button 
                            onClick={() => removeMemberFromManaged(email)} 
                            className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white'}`}
                          >
                            移除
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* 角色权限设置 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">角色权限设置</h4>
            <button
              onClick={() => setShowPermissionSettings(!showPermissionSettings)}
              className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
            >
              {showPermissionSettings ? '收起' : '展开'}
            </button>
          </div>
          
          {showPermissionSettings && (
            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} p-3 rounded-lg`}>
              {(['admin', 'editor', 'member'] as CommunityRole[]).map((role) => (
                <div key={role} className="space-y-2 mb-4">
                  <h5 className="text-sm font-medium capitalize">{role} 权限</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {([
                      { key: 'manage_members', label: '管理成员' },
                      { key: 'manage_posts', label: '管理帖子' },
                      { key: 'manage_announcements', label: '管理公告' },
                      { key: 'manage_settings', label: '管理设置' },
                      { key: 'manage_guidelines', label: '管理版规' },
                      { key: 'view_analytics', label: '查看分析' },
                      { key: 'create_posts', label: '创建帖子' },
                      { key: 'comment_posts', label: '评论帖子' },
                      { key: 'like_posts', label: '点赞帖子' }
                    ] as { key: CommunityPermission; label: string }[]).map((permission) => {
                      const currentPermissions = permissionStore[community.id]?.[role] || defaultRolePermissions[role];
                      const hasPermission = currentPermissions.includes(permission.key);
                      
                      return (
                        <div key={permission.key} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={hasPermission}
                            onChange={(e) => {
                              const updatedPermissions = e.target.checked
                                ? [...currentPermissions, permission.key]
                                : currentPermissions.filter(p => p !== permission.key);
                              updateRolePermissions(community.id, role, updatedPermissions);
                            }}
                            className={`${isDark ? 'accent-purple-500' : 'accent-pink-500'}`}
                          />
                          <label className="text-sm">{permission.label}</label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 社群设置 */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">社群设置</h4>
          <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} p-3 rounded-lg`}>
            {/* 隐私设置 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm">隐私设置</div>
                <button 
                  onClick={togglePrivacyForManaged} 
                  className={`text-xs px-3 py-1 rounded-full ${privacyStore[community.id] === 'private' ? (isDark ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-800') : (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')}`}
                >
                  {privacyStore[community.id] === 'private' ? '私密' : '公开'}
                </button>
              </div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {privacyStore[community.id] === 'private' ? '仅邀请成员可加入' : '所有人可加入'}
              </div>
            </div>
            
            {/* 审核设置 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm">加入审核</div>
                <button 
                  onClick={() => updateJoinApprovalSetting(!joinApprovalRequired)} 
                  className={`text-xs px-3 py-1 rounded-full ${joinApprovalRequired ? (isDark ? 'bg-green-600 text-white' : 'bg-green-500 text-white') : (isDark ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-800')}`}
                  disabled={loading}
                >
                  {joinApprovalRequired ? '开启' : '关闭'}
                </button>
              </div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {joinApprovalRequired ? '需要管理员审核才能加入' : '无需审核，直接加入'}
              </div>
            </div>
            
            {/* 公告设置 */}
            <div>
              <div className="text-sm mb-2">社群公告</div>
              <textarea 
                value={announceStore[community.id] || ''} 
                onChange={e => setAnnouncementForManaged(e.target.value)} 
                placeholder="输入社群公告" 
                className={`w-full h-20 ${isDark ? 'bg-gray-600 text-white ring-1 ring-gray-500' : 'bg-white text-gray-900 ring-1 ring-gray-300'} px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-purple-500' : 'focus:ring-pink-300'}`} 
              />
            </div>
          </div>
        </div>
        
        {/* 待审核加入请求 */}
        {joinApprovalRequired && (
          <div className="mb-6">
            <h4 className="font-medium mb-3">待审核加入请求</h4>
            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} p-3 rounded-lg`}>
              {loading ? (
                <div className="text-center py-4">加载中...</div>
              ) : pendingRequests.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className={`p-3 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-500' : 'bg-gray-300'}`}>
                            {request.user?.avatar ? (
                              <img src={request.user.avatar} alt={request.user.username} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-sm">{request.user?.username?.[0] || '?'}</span>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{request.user?.username || '未知用户'}</div>
                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {new Date(request.joined_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => approveJoinRequest(request.id)} 
                            className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-green-600 text-white' : 'bg-green-500 text-white'}`}
                            disabled={loading}
                          >
                            批准
                          </button>
                          <button 
                            onClick={() => rejectJoinRequest(request.id)} 
                            className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white'}`}
                            disabled={loading}
                          >
                            拒绝
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  暂无待审核的加入请求
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-3">
          {onDeleteCommunity && (
            <button 
              onClick={onDeleteCommunity} 
              className={`px-4 py-2 rounded-lg ${isDark ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-500 text-white hover:bg-red-600'} transition-colors`}
            >
              删除社群
            </button>
          )}
          <button 
            onClick={onClose} 
            className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'} transition-colors`}
          >
            关闭
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CommunityManagement;