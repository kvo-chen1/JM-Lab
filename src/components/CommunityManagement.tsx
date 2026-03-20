import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Shield, 
  UserCheck,
  Settings,
  Bell,
  CheckCircle,
  XCircle,
  Copy,
  Mail,
  Crown,
  Edit3,
  Eye,
  Lock,
  Globe,
  MessageSquare,
  FileText,
  Pin,
  Calendar,
  AlertTriangle,
  CheckSquare,
  Square,
  X,
  UserPlus
} from 'lucide-react';

// 导入新组件
import StatCard from './Community/StatCard';
import RoleBadge, { CommunityRole } from './Community/RoleBadge';
import CommunityTabs from './Community/CommunityTabs';

// 导入样式
import '@/styles/community-management.css';

// 类型定义
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

interface CommunityMember {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  role: CommunityRole;
  joinedAt: string;
  isOnline?: boolean;
  lastActive?: string;
  postCount?: number;
}

interface JoinRequest {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  requestMessage?: string;
  createdAt: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isPinned: boolean;
  author: {
    username: string;
    avatar?: string;
  };
  readCount: number;
}

interface CommunityManagementProps {
  isOpen: boolean;
  onClose: () => void;
  community: Community;
  isDark: boolean;
  onDeleteCommunity?: () => void;
}

// Tab 类型
type ManagementTab = 'members' | 'requests' | 'announcements' | 'settings';

// 成员列表项组件
const MemberListItem = ({ 
  member, 
  isDark, 
  isSelected, 
  onSelect,
  onRoleChange,
  onRemove
}: { 
  member: CommunityMember;
  isDark: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onRoleChange: (role: CommunityRole) => void;
  onRemove: () => void;
}) => {
  return (
    <motion.tr 
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`
        group transition-all duration-200
        ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}
        ${isSelected ? (isDark ? 'bg-indigo-500/10' : 'bg-indigo-50') : ''}
      `}
    >
      <td className="px-5 py-4">
        <button
          onClick={onSelect}
          className="p-1 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        >
          {isSelected ? (
            <CheckSquare size={20} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
          ) : (
            <Square size={20} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
          )}
        </button>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`
              w-11 h-11 rounded-full flex items-center justify-center overflow-hidden
              ${isDark ? 'bg-gradient-to-br from-slate-600 to-slate-700' : 'bg-gradient-to-br from-slate-100 to-slate-200'}
            `}>
              {member.avatar ? (
                <img src={member.avatar} alt={member.username} className="w-full h-full object-cover" />
              ) : (
                <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {member.username[0]}
                </span>
              )}
            </div>
            {member.isOnline && (
              <div className={`
                absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2
                ${isDark ? 'border-slate-800 bg-emerald-500' : 'border-white bg-emerald-500'}
              `}>
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
              </div>
            )}
          </div>
          <div>
            <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {member.username}
            </div>
            <div className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              {member.email}
            </div>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <RoleBadge role={member.role} isDark={isDark} size="sm" />
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${member.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
          <span className={`text-sm font-medium ${member.isOnline ? 'text-emerald-600 dark:text-emerald-400' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {member.isOnline ? '在线' : member.lastActive || '离线'}
          </span>
        </div>
      </td>
      <td className={`px-5 py-4 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {new Date(member.joinedAt).toLocaleDateString('zh-CN')}
      </td>
      <td className={`px-5 py-4 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {member.postCount || 0}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <select
            value={member.role}
            onChange={(e) => onRoleChange(e.target.value as CommunityRole)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200
              ${isDark 
                ? 'bg-slate-700 border-slate-600 text-white hover:border-slate-500' 
                : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'}
              focus:outline-none focus:ring-2 focus:ring-indigo-500/20
            `}
          >
            <option value="member">成员</option>
            <option value="editor">编辑</option>
            <option value="admin">管理员</option>
          </select>
          <button
            onClick={onRemove}
            className={`
              p-2 rounded-lg transition-all duration-200
              ${isDark 
                ? 'hover:bg-rose-500/20 text-slate-400 hover:text-rose-400' 
                : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'}
            `}
            title="移除成员"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
};

// 空状态组件
const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  isDark,
  action
}: { 
  icon: React.ElementType;
  title: string;
  description: string;
  isDark: boolean;
  action?: React.ReactNode;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`
      flex flex-col items-center justify-center py-16 px-4
      ${isDark ? 'bg-slate-800/30' : 'bg-white'}
    `}
  >
    <div className={`
      w-20 h-20 rounded-2xl flex items-center justify-center mb-4
      ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}
    `}>
      <Icon size={32} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
    </div>
    <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
      {title}
    </h3>
    <p className={`text-sm text-center max-w-sm mb-4 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
      {description}
    </p>
    {action}
  </motion.div>
);

const CommunityManagement: React.FC<CommunityManagementProps> = ({
  isOpen,
  onClose,
  community,
  isDark,
  onDeleteCommunity
}) => {
  // 状态管理
  const [activeTab, setActiveTab] = useState<ManagementTab>('members');
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 成员管理状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CommunityRole>('member');
  const [inviteLink, setInviteLink] = useState('');
  
  // 公告管理状态
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [isAnnouncementPinned, setIsAnnouncementPinned] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  
  // 设置状态
  const [joinApprovalRequired, setJoinApprovalRequired] = useState(false);
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [communitySettings, setCommunitySettings] = useState({
    name: community.name,
    description: community.description,
    allowPosts: true,
    allowChat: true,
    allowComments: true,
  });

  // 标签页配置
  const tabs = useMemo(() => [
    { id: 'members', label: '管理成员', icon: Users, count: members.length },
    { id: 'requests', label: '加入申请', icon: UserCheck, count: joinRequests.length },
    { id: 'announcements', label: '公告管理', icon: Bell, count: announcements.length },
    { id: 'settings', label: '社群设置', icon: Settings },
  ], [members.length, joinRequests.length, announcements.length]);

  // 加载数据
  useEffect(() => {
    if (!isOpen) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('请先登录');
          return;
        }

        // 加载成员列表
        const membersResponse = await fetch(`/api/communities/${community.id}/members`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (membersResponse.ok) {
          const membersResult = await membersResponse.json();
          if (membersResult.code === 0 && Array.isArray(membersResult.data)) {
            // 转换数据格式以匹配组件期望的格式
            const formattedMembers = membersResult.data.map((m: any) => ({
              id: m.id,
              email: m.email || '',
              username: m.username,
              avatar: m.avatar,
              role: m.role,
              joinedAt: m.joined_at,
              isOnline: m.is_online,
              lastActive: m.last_active,
              postCount: m.post_count || 0
            }));
            setMembers(formattedMembers);
          }
        }

        // 加载加入请求
        const requestsResponse = await fetch(`/api/communities/${community.id}/join-requests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (requestsResponse.ok) {
          const requestsResult = await requestsResponse.json();
          if (requestsResult.code === 0 && Array.isArray(requestsResult.data)) {
            const formattedRequests = requestsResult.data.map((r: any) => ({
              id: r.id,
              userId: r.user_id,
              username: r.username,
              avatar: r.avatar,
              requestMessage: r.request_message,
              createdAt: r.created_at
            }));
            setJoinRequests(formattedRequests);
          }
        }

        // 加载公告
        const announcementsResponse = await fetch(`/api/communities/${community.id}/announcements`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (announcementsResponse.ok) {
          const announcementsResult = await announcementsResponse.json();
          if (announcementsResult.code === 0 && Array.isArray(announcementsResult.data)) {
            const formattedAnnouncements = announcementsResult.data.map((a: any) => ({
              id: a.id,
              title: a.title,
              content: a.content,
              createdAt: a.created_at,
              updatedAt: a.updated_at,
              isPinned: a.is_pinned,
              author: {
                username: a.author_name,
                avatar: a.author_avatar
              },
              readCount: a.read_count || 0
            }));
            setAnnouncements(formattedAnnouncements);
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        toast.error('加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, community.id]);

  // 过滤成员
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(member => 
      member.username.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  // 生成邀请链接
  const generateInviteLink = () => {
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const link = `${window.location.origin}/join-community/${community.id}?code=${inviteCode}`;
    setInviteLink(link);
  };

  // 复制邀请链接
  const copyInviteLink = () => {
    if (!inviteLink) {
      generateInviteLink();
      return;
    }
    navigator.clipboard.writeText(inviteLink);
    toast.success('邀请链接已复制到剪贴板');
  };

  // 发送邀请
  const sendInvite = () => {
    if (!inviteEmail.trim()) {
      toast.warning('请输入邮箱地址');
      return;
    }
    
    toast.success(`已向 ${inviteEmail} 发送邀请`);
    setInviteEmail('');
    setShowInviteModal(false);
  };

  // 更新成员角色
  const updateMemberRole = async (memberId: string, newRole: CommunityRole) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('请先登录');
      return;
    }

    try {
      const response = await fetch(`/api/communities/${community.id}/members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        setMembers(prev => prev.map(member => 
          member.id === memberId ? { ...member, role: newRole } : member
        ));
        toast.success('成员角色已更新');
      } else {
        const result = await response.json();
        toast.error(result.message || '更新成员角色失败');
      }
    } catch (error) {
      console.error('更新成员角色失败:', error);
      toast.error('更新成员角色失败');
    }
  };

  // 移除成员
  const removeMember = async (memberId: string) => {
    if (!window.confirm('确定要移除该成员吗？')) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('请先登录');
      return;
    }

    try {
      const response = await fetch(`/api/communities/${community.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMembers(prev => prev.filter(member => member.id !== memberId));
        toast.success('成员已移除');
      } else {
        const result = await response.json();
        toast.error(result.message || '移除成员失败');
      }
    } catch (error) {
      console.error('移除成员失败:', error);
      toast.error('移除成员失败');
    }
  };

  // 批量移除成员
  const batchRemoveMembers = async () => {
    if (selectedMembers.size === 0) {
      toast.warning('请先选择成员');
      return;
    }
    if (!window.confirm(`确定要移除选中的 ${selectedMembers.size} 位成员吗？`)) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('请先登录');
      return;
    }

    let successCount = 0;
    for (const memberId of selectedMembers) {
      try {
        const response = await fetch(`/api/communities/${community.id}/members/${memberId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) successCount++;
      } catch (error) {
        console.error('移除成员失败:', memberId, error);
      }
    }

    setMembers(prev => prev.filter(member => !selectedMembers.has(member.id)));
    setSelectedMembers(new Set());
    toast.success(`已移除 ${successCount} 位成员`);
  };

  // 处理加入请求
  const handleJoinRequest = async (requestId: string, action: 'approve' | 'reject') => {
    const request = joinRequests.find(r => r.id === requestId);
    if (!request) return;

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('请先登录');
      return;
    }

    try {
      const response = await fetch(`/api/communities/${community.id}/join-requests/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        if (action === 'approve') {
          const newMember: CommunityMember = {
            id: request.userId,
            email: '',
            username: request.username,
            avatar: request.avatar,
            role: 'member',
            joinedAt: new Date().toISOString(),
            isOnline: false,
            postCount: 0
          };
          setMembers(prev => [...prev, newMember]);
          toast.success(`已批准 ${request.username} 的加入请求`);
        } else {
          toast.success(`已拒绝 ${request.username} 的加入请求`);
        }
        setJoinRequests(prev => prev.filter(r => r.id !== requestId));
      } else {
        const result = await response.json();
        toast.error(result.message || '处理申请失败');
      }
    } catch (error) {
      console.error('处理加入请求失败:', error);
      toast.error('处理申请失败');
    }
  };

  // 发布公告
  const publishAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      toast.warning('请填写标题和内容');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('请先登录');
      return;
    }

    try {
      if (editingAnnouncement) {
        // 更新公告
        const response = await fetch(`/api/communities/${community.id}/announcements/${editingAnnouncement.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: announcementTitle,
            content: announcementContent,
            isPinned: isAnnouncementPinned
          })
        });

        if (response.ok) {
          const result = await response.json();
          const updatedAnnouncement: Announcement = {
            ...editingAnnouncement,
            title: announcementTitle,
            content: announcementContent,
            isPinned: isAnnouncementPinned,
            updatedAt: new Date().toISOString()
          };
          setAnnouncements(prev => prev.map(a => a.id === editingAnnouncement.id ? updatedAnnouncement : a));
          toast.success('公告已更新');
        } else {
          const result = await response.json();
          toast.error(result.message || '更新公告失败');
        }
      } else {
        // 创建公告
        const response = await fetch(`/api/communities/${community.id}/announcements`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: announcementTitle,
            content: announcementContent,
            isPinned: isAnnouncementPinned
          })
        });

        if (response.ok) {
          const result = await response.json();
          const newAnnouncement: Announcement = {
            id: result.data.id,
            title: announcementTitle,
            content: announcementContent,
            createdAt: new Date().toISOString(),
            isPinned: isAnnouncementPinned,
            author: { username: '我' },
            readCount: 0
          };
          setAnnouncements(prev => [newAnnouncement, ...prev]);
          toast.success('公告已发布');
        } else {
          const result = await response.json();
          toast.error(result.message || '发布公告失败');
        }
      }

      setAnnouncementTitle('');
      setAnnouncementContent('');
      setIsAnnouncementPinned(false);
      setEditingAnnouncement(null);
      setShowAnnouncementModal(false);
    } catch (error) {
      console.error('发布公告失败:', error);
      toast.error('发布公告失败');
    }
  };

  // 删除公告
  const deleteAnnouncement = async (announcementId: string) => {
    if (!window.confirm('确定要删除这条公告吗？')) return;

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('请先登录');
      return;
    }

    try {
      const response = await fetch(`/api/communities/${community.id}/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
        toast.success('公告已删除');
      } else {
        const result = await response.json();
        toast.error(result.message || '删除公告失败');
      }
    } catch (error) {
      console.error('删除公告失败:', error);
      toast.error('删除公告失败');
    }
  };

  // 编辑公告
  const editAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementTitle(announcement.title);
    setAnnouncementContent(announcement.content);
    setIsAnnouncementPinned(announcement.isPinned);
    setShowAnnouncementModal(true);
  };

  // 置顶/取消置顶公告
  const togglePinAnnouncement = (announcementId: string) => {
    setAnnouncements(prev => prev.map(a => 
      a.id === announcementId ? { ...a, isPinned: !a.isPinned } : a
    ));
    toast.success('操作成功');
  };

  // 保存设置
  const saveSettings = async () => {
    toast.success('设置已保存');
  };

  // 切换成员选择
  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredMembers.map(m => m.id)));
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[70] ${isDark ? 'bg-black/70' : 'bg-black/50'} backdrop-blur-sm flex items-center justify-center p-0 md:p-4`}>
      <motion.div 
        className={`
          ${isDark ? 'bg-slate-900' : 'bg-white'} 
          shadow-2xl w-full h-full md:h-[90vh] md:max-w-6xl md:rounded-2xl 
          overflow-hidden flex flex-col
        `}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* 头部 */}
        <div className={`
          flex items-center justify-between px-6 py-4 border-b
          ${isDark ? 'border-slate-700/50' : 'border-slate-200'}
        `}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={community.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=random`}
                alt={community.name}
                className="w-12 h-12 rounded-xl object-cover shadow-md"
              />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                社群管理
              </h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {community.name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`
              p-2 rounded-lg transition-all duration-200
              ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'}
            `}
          >
            <X size={24} />
          </button>
        </div>

        {/* 标签页导航 */}
        <CommunityTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as ManagementTab)}
          isDark={isDark}
        />

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6 cm-scrollbar">
          <AnimatePresence mode="wait">
            {/* 成员管理 */}
            {activeTab === 'members' && (
              <motion.div
                key="members"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* 统计卡片 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard 
                    icon={Users} 
                    value={members.length} 
                    label="总成员" 
                    isDark={isDark} 
                    color="primary"
                    delay={0}
                    trend={{ value: 12, isPositive: true }}
                  />
                  <StatCard 
                    icon={Crown} 
                    value={members.filter(m => m.role === 'admin').length} 
                    label="管理员" 
                    isDark={isDark} 
                    color="purple"
                    delay={1}
                  />
                  <StatCard 
                    icon={Edit3} 
                    value={members.filter(m => m.role === 'editor').length} 
                    label="编辑" 
                    isDark={isDark} 
                    color="success"
                    delay={2}
                  />
                  <StatCard 
                    icon={UserCheck} 
                    value={members.filter(m => m.isOnline).length} 
                    label="在线" 
                    isDark={isDark} 
                    color="orange"
                    delay={3}
                  />
                </div>

                {/* 操作栏 */}
                <div className={`
                  flex flex-col md:flex-row items-start md:items-center gap-4 p-5 rounded-2xl
                  ${isDark ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white border border-slate-100'}
                  shadow-sm
                `}>
                  <div className="flex-1 relative group w-full md:w-auto">
                    <Search className={`
                      absolute left-4 top-1/2 -translate-y-1/2 transition-colors
                      ${isDark ? 'text-slate-500 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-500'}
                    `} size={18} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索成员姓名或邮箱..."
                      className={`
                        w-full pl-11 pr-4 py-2.5 rounded-xl border transition-all duration-300
                        ${isDark 
                          ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:bg-slate-900' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'}
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                      `}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className={`
                        flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold
                        transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5
                        ${isDark 
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white' 
                          : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white'}
                      `}
                    >
                      <UserPlus size={18} />
                      <span>邀请成员</span>
                    </button>
                    
                    {selectedMembers.size > 0 && (
                      <button
                        onClick={batchRemoveMembers}
                        className={`
                          flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold
                          transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5
                          ${isDark 
                            ? 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white' 
                            : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white'}
                        `}
                      >
                        <Trash2 size={18} />
                        <span className="hidden md:inline">移除选中 ({selectedMembers.size})</span>
                        <span className="md:hidden">({selectedMembers.size})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 成员列表 */}
                <div className={`
                  rounded-2xl border overflow-hidden shadow-sm
                  ${isDark ? 'border-slate-700/50' : 'border-slate-200'}
                `}>
                  {filteredMembers.length === 0 ? (
                    <EmptyState
                      icon={Users}
                      title={searchQuery ? '未找到匹配的成员' : '暂无成员'}
                      description={searchQuery ? '请尝试其他搜索条件' : '邀请成员加入社群开始交流吧'}
                      isDark={isDark}
                      action={
                        !searchQuery && (
                          <button
                            onClick={() => setShowInviteModal(true)}
                            className={`
                              flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold
                              transition-all duration-300
                              ${isDark 
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                                : 'bg-indigo-500 hover:bg-indigo-600 text-white'}
                            `}
                          >
                            <UserPlus size={18} />
                            <span>邀请成员</span>
                          </button>
                        )
                      }
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px]">
                        <thead className={`
                          ${isDark ? 'bg-slate-800/80' : 'bg-slate-50/80'}
                          backdrop-blur-sm
                        `}>
                          <tr>
                            <th className="px-5 py-4 text-left">
                              <button
                                onClick={toggleSelectAll}
                                className="flex items-center gap-2 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                              >
                                {selectedMembers.size === filteredMembers.length && filteredMembers.length > 0 ? (
                                  <CheckSquare size={20} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                                ) : (
                                  <Square size={20} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                                )}
                              </button>
                            </th>
                            <th className={`px-5 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>成员</th>
                            <th className={`px-5 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>角色</th>
                            <th className={`px-5 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>状态</th>
                            <th className={`px-5 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>加入时间</th>
                            <th className={`px-5 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>帖子数</th>
                            <th className={`px-5 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>操作</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                          <AnimatePresence>
                            {filteredMembers.map((member) => (
                              <MemberListItem
                                key={member.id}
                                member={member}
                                isDark={isDark}
                                isSelected={selectedMembers.has(member.id)}
                                onSelect={() => toggleMemberSelection(member.id)}
                                onRoleChange={(role) => updateMemberRole(member.id, role)}
                                onRemove={() => removeMember(member.id)}
                              />
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 加入申请 */}
            {activeTab === 'requests' && (
              <motion.div
                key="requests"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* 统计卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard 
                    icon={UserCheck} 
                    value={joinRequests.length} 
                    label="待审核" 
                    isDark={isDark} 
                    color="warning"
                    delay={0}
                  />
                  <StatCard 
                    icon={CheckCircle} 
                    value={156} 
                    label="本月通过" 
                    isDark={isDark} 
                    color="success"
                    delay={1}
                    trend={{ value: 8, isPositive: true }}
                  />
                  <StatCard 
                    icon={XCircle} 
                    value={12} 
                    label="本月拒绝" 
                    isDark={isDark} 
                    color="error"
                    delay={2}
                  />
                </div>

                {/* 申请列表 */}
                <div className={`
                  rounded-2xl border overflow-hidden shadow-sm
                  ${isDark ? 'border-slate-700/50' : 'border-slate-200'}
                `}>
                  {joinRequests.length === 0 ? (
                    <EmptyState
                      icon={UserCheck}
                      title="暂无申请"
                      description="暂时没有待审核的加入申请"
                      isDark={isDark}
                    />
                  ) : (
                    <div className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                      <AnimatePresence>
                        {joinRequests.map((request, index) => (
                          <motion.div
                            key={request.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            className={`
                              p-6 transition-colors
                              ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}
                            `}
                          >
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className={`
                                  w-12 h-12 rounded-full flex items-center justify-center
                                  ${isDark ? 'bg-slate-700' : 'bg-slate-200'}
                                `}>
                                  {request.avatar ? (
                                    <img src={request.avatar} alt={request.username} className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    <span className={`text-lg font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                      {request.username[0]}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {request.username}
                                  </div>
                                  <div className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                    申请时间: {new Date(request.createdAt).toLocaleString('zh-CN')}
                                  </div>
                                  {request.requestMessage && (
                                    <div className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                      "{request.requestMessage}"
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleJoinRequest(request.id, 'approve')}
                                  className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium
                                    transition-all duration-200
                                    ${isDark 
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'}
                                  `}
                                >
                                  <CheckCircle size={16} />
                                  <span>批准</span>
                                </button>
                                <button
                                  onClick={() => handleJoinRequest(request.id, 'reject')}
                                  className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium
                                    transition-all duration-200
                                    ${isDark 
                                      ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                                      : 'bg-rose-500 hover:bg-rose-600 text-white'}
                                  `}
                                >
                                  <XCircle size={16} />
                                  <span>拒绝</span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 公告管理 */}
            {activeTab === 'announcements' && (
              <motion.div
                key="announcements"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* 统计和操作栏 */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="grid grid-cols-3 gap-4 flex-1 w-full md:w-auto">
                    <StatCard 
                      icon={FileText} 
                      value={announcements.length} 
                      label="总公告" 
                      isDark={isDark} 
                      color="primary"
                      delay={0}
                    />
                    <StatCard 
                      icon={Pin} 
                      value={announcements.filter(a => a.isPinned).length} 
                      label="置顶" 
                      isDark={isDark} 
                      color="purple"
                      delay={1}
                    />
                    <StatCard 
                      icon={Eye} 
                      value={announcements.reduce((sum, a) => sum + a.readCount, 0)} 
                      label="总阅读" 
                      isDark={isDark} 
                      color="success"
                      delay={2}
                    />
                  </div>
                  <button
                    onClick={() => setShowAnnouncementModal(true)}
                    className={`
                      flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold
                      transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5
                      ${isDark 
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white' 
                        : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white'}
                    `}
                  >
                    <Plus size={18} />
                    <span>发布公告</span>
                  </button>
                </div>

                {/* 公告列表 */}
                <div className="space-y-4">
                  <AnimatePresence>
                    {announcements.map((announcement, index) => (
                      <motion.div
                        key={announcement.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
                          group p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg
                          ${isDark 
                            ? 'border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50' 
                            : 'border-slate-200 bg-white hover:bg-slate-50/50'}
                          ${announcement.isPinned 
                            ? (isDark ? 'ring-1 ring-violet-500/30 shadow-violet-500/10' : 'ring-1 ring-violet-200 shadow-violet-500/5') 
                            : ''}
                        `}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              {announcement.isPinned && (
                                <span className={`
                                  inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
                                  ${isDark 
                                    ? 'bg-gradient-to-r from-violet-500/20 to-violet-600/10 text-violet-300 border border-violet-500/30' 
                                    : 'bg-gradient-to-r from-violet-100 to-violet-50 text-violet-700 border border-violet-200'}
                                `}>
                                  <Pin size={10} />
                                  置顶
                                </span>
                              )}
                              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {announcement.title}
                              </h3>
                            </div>
                            <p className={`text-sm mb-4 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                              {announcement.content}
                            </p>
                            <div className={`flex flex-wrap items-center gap-4 text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                              <span className="flex items-center gap-1.5">
                                <div className={`
                                  w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                                  ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}
                                `}>
                                  {announcement.author.username[0]}
                                </div>
                                {announcement.author.username}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Calendar size={14} />
                                {new Date(announcement.createdAt).toLocaleDateString('zh-CN')}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Eye size={14} />
                                {announcement.readCount} 阅读
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => togglePinAnnouncement(announcement.id)}
                              className={`
                                p-2 rounded-xl transition-all duration-200
                                ${announcement.isPinned 
                                  ? (isDark 
                                      ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30' 
                                      : 'bg-violet-100 text-violet-600 hover:bg-violet-200')
                                  : (isDark 
                                      ? 'hover:bg-slate-700 text-slate-400' 
                                      : 'hover:bg-slate-100 text-slate-500')
                                }
                              `}
                              title={announcement.isPinned ? '取消置顶' : '置顶公告'}
                            >
                              <Pin size={18} />
                            </button>
                            <button
                              onClick={() => editAnnouncement(announcement)}
                              className={`
                                p-2 rounded-xl transition-all duration-200
                                ${isDark 
                                  ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' 
                                  : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'}
                              `}
                              title="编辑"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button
                              onClick={() => deleteAnnouncement(announcement.id)}
                              className={`
                                p-2 rounded-xl transition-all duration-200
                                ${isDark 
                                  ? 'hover:bg-rose-500/20 text-slate-400 hover:text-rose-400' 
                                  : 'hover:bg-rose-50 text-slate-500 hover:text-rose-600'}
                              `}
                              title="删除"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* 社群设置 */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 max-w-3xl"
              >
                {/* 基本信息 */}
                <div className={`
                  p-6 rounded-2xl border shadow-sm
                  ${isDark ? 'border-slate-700/50 bg-slate-800/30' : 'border-slate-200 bg-white'}
                `}>
                  <h3 className={`text-lg font-bold mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <Settings size={20} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
                    基本信息
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        社群名称
                      </label>
                      <input
                        type="text"
                        value={communitySettings.name}
                        onChange={(e) => setCommunitySettings(prev => ({ ...prev, name: e.target.value }))}
                        className={`
                          w-full px-4 py-2.5 rounded-xl border transition-all duration-200
                          ${isDark 
                            ? 'bg-slate-900/50 border-slate-700 text-white focus:border-indigo-500/50 focus:bg-slate-900' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:bg-white'}
                          focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                        `}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        社群简介
                      </label>
                      <textarea
                        value={communitySettings.description}
                        onChange={(e) => setCommunitySettings(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className={`
                          w-full px-4 py-2.5 rounded-xl border transition-all duration-200 resize-none
                          ${isDark 
                            ? 'bg-slate-900/50 border-slate-700 text-white focus:border-indigo-500/50 focus:bg-slate-900' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:bg-white'}
                          focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                        `}
                      />
                    </div>
                  </div>
                </div>

                {/* 隐私设置 */}
                <div className={`
                  p-6 rounded-2xl border shadow-sm
                  ${isDark ? 'border-slate-700/50 bg-slate-800/30' : 'border-slate-200 bg-white'}
                `}>
                  <h3 className={`text-lg font-bold mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <Shield size={20} className={isDark ? 'text-emerald-400' : 'text-emerald-500'} />
                    隐私设置
                  </h3>
                  <div className="space-y-4">
                    <div className={`
                      flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl gap-4
                      ${isDark ? 'bg-slate-900/30' : 'bg-slate-50'}
                    `}>
                      <div>
                        <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>社群可见性</div>
                        <div className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {privacy === 'public' ? '所有人都可以发现和加入' : '仅邀请成员可以加入'}
                        </div>
                      </div>
                      <button
                        onClick={() => setPrivacy(privacy === 'public' ? 'private' : 'public')}
                        className={`
                          flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold
                          transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5
                          ${privacy === 'public'
                            ? (isDark 
                                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white' 
                                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white')
                            : (isDark 
                                ? 'bg-slate-700 text-slate-300' 
                                : 'bg-slate-200 text-slate-700')
                          }
                        `}
                      >
                        {privacy === 'public' ? <Globe size={18} /> : <Lock size={18} />}
                        <span>{privacy === 'public' ? '公开' : '私密'}</span>
                      </button>
                    </div>
                    
                    <div className={`
                      flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl gap-4
                      ${isDark ? 'bg-slate-900/30' : 'bg-slate-50'}
                    `}>
                      <div>
                        <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>加入审核</div>
                        <div className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {joinApprovalRequired ? '需要管理员审核才能加入' : '无需审核，直接加入'}
                        </div>
                      </div>
                      <button
                        onClick={() => setJoinApprovalRequired(!joinApprovalRequired)}
                        className={`
                          flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold
                          transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5
                          ${joinApprovalRequired
                            ? (isDark 
                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white' 
                                : 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white')
                            : (isDark 
                                ? 'bg-slate-700 text-slate-300' 
                                : 'bg-slate-200 text-slate-700')
                          }
                        `}
                      >
                        {joinApprovalRequired ? <Shield size={18} /> : <CheckCircle size={18} />}
                        <span>{joinApprovalRequired ? '已开启' : '已关闭'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 功能模块 */}
                <div className={`
                  p-6 rounded-2xl border shadow-sm
                  ${isDark ? 'border-slate-700/50 bg-slate-800/30' : 'border-slate-200 bg-white'}
                `}>
                  <h3 className={`text-lg font-bold mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <FileText size={20} className={isDark ? 'text-violet-400' : 'text-violet-500'} />
                    功能模块
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'allowPosts', label: '帖子功能', icon: FileText },
                      { key: 'allowChat', label: '聊天功能', icon: MessageSquare },
                      { key: 'allowComments', label: '评论功能', icon: MessageSquare },
                    ].map(({ key, label, icon: Icon }) => {
                      // 安全处理：如果 Icon 未定义，使用空组件
                      const SafeIcon = Icon || (() => null);
                      return (
                        <div 
                          key={key} 
                          className={`
                            flex items-center justify-between p-4 rounded-xl transition-all duration-200
                            ${isDark ? 'hover:bg-slate-900/30' : 'hover:bg-slate-50'}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                              <SafeIcon size={18} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                            </div>
                            <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{label}</span>
                          </div>
                          <button
                            onClick={() => setCommunitySettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                            className={`
                              w-14 h-7 rounded-full transition-all duration-300 relative
                              ${communitySettings[key as keyof typeof communitySettings]
                                ? (isDark 
                                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500' 
                                    : 'bg-gradient-to-r from-indigo-500 to-indigo-600')
                                : (isDark ? 'bg-slate-700' : 'bg-slate-300')
                              }
                            `}
                          >
                            <div
                              className={`
                                absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300
                                ${communitySettings[key as keyof typeof communitySettings] ? 'translate-x-8' : 'translate-x-1'}
                              `}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 保存按钮 */}
                <div className="flex justify-end">
                  <button
                    onClick={saveSettings}
                    className={`
                      flex items-center gap-2 px-8 py-3 rounded-xl font-bold
                      transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5
                      ${isDark 
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white' 
                        : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white'}
                    `}
                  >
                    <CheckCircle size={20} />
                    <span>保存设置</span>
                  </button>
                </div>

                {/* 危险操作 */}
                <div className={`
                  p-6 rounded-2xl border shadow-sm
                  ${isDark 
                    ? 'border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-rose-600/5' 
                    : 'border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100/50'}
                `}>
                  <h3 className={`text-lg font-bold mb-5 flex items-center gap-2 ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                    <AlertTriangle size={20} />
                    危险操作
                  </h3>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className={`font-bold ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>删除社群</div>
                      <div className={`text-sm mt-1 ${isDark ? 'text-rose-400/80' : 'text-rose-600/80'}`}>
                        此操作不可撤销，所有数据将被永久删除
                      </div>
                    </div>
                    {onDeleteCommunity && (
                      <button
                        onClick={onDeleteCommunity}
                        className={`
                          flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold
                          transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5
                          ${isDark 
                            ? 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white' 
                            : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white'}
                        `}
                      >
                        <Trash2 size={18} />
                        <span>删除社群</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 邀请成员弹窗 */}
        <AnimatePresence>
          {showInviteModal && (
            <div className={`fixed inset-0 z-[60] ${isDark ? 'bg-black/80' : 'bg-black/60'} backdrop-blur-sm flex items-center justify-center p-4`}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`
                  ${isDark ? 'bg-slate-800 border border-slate-700/50' : 'bg-white border border-slate-100'} 
                  rounded-2xl shadow-2xl p-6 max-w-md w-full
                `}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                      <Mail size={24} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                    </div>
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>邀请成员</h3>
                  </div>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className={`
                      p-2 rounded-xl transition-all duration-200
                      ${isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'}
                    `}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      邮箱地址
                    </label>
                    <div className="relative">
                      <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="输入成员邮箱地址"
                        className={`
                          w-full pl-11 pr-4 py-2.5 rounded-xl border transition-all duration-200
                          ${isDark 
                            ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:bg-slate-900' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'}
                          focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                        `}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      分配角色
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as CommunityRole)}
                      className={`
                        w-full px-4 py-2.5 rounded-xl border transition-all duration-200
                        ${isDark 
                          ? 'bg-slate-900/50 border-slate-700 text-white focus:border-indigo-500/50 focus:bg-slate-900' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:bg-white'}
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                      `}
                    >
                      <option value="member">成员 - 普通社群成员</option>
                      <option value="editor">编辑 - 可管理帖子内容</option>
                      <option value="admin">管理员 - 拥有所有权限</option>
                    </select>
                  </div>

                  <div className={`
                    p-5 rounded-xl border
                    ${isDark ? 'bg-slate-900/30 border-slate-700/50' : 'bg-slate-50 border-slate-200'}
                  `}>
                    <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      邀请链接
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        placeholder="点击右侧按钮生成邀请链接"
                        className={`
                          flex-1 px-4 py-2.5 rounded-xl border text-sm
                          ${isDark 
                            ? 'bg-slate-900/50 border-slate-700 text-slate-400' 
                            : 'bg-white border-slate-200 text-slate-500'}
                          focus:outline-none
                        `}
                      />
                      <button
                        onClick={copyInviteLink}
                        className={`
                          flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold
                          transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5
                          ${isDark 
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white' 
                            : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white'}
                        `}
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowInviteModal(false)}
                      className={`
                        flex-1 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200
                        ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}
                      `}
                    >
                      取消
                    </button>
                    <button
                      onClick={sendInvite}
                      className={`
                        flex-1 px-5 py-2.5 rounded-xl font-semibold
                        transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5
                        ${isDark 
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white' 
                          : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white'}
                      `}
                    >
                      发送邀请
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 发布公告弹窗 */}
        <AnimatePresence>
          {showAnnouncementModal && (
            <div className={`fixed inset-0 z-[60] ${isDark ? 'bg-black/80' : 'bg-black/60'} backdrop-blur-sm flex items-center justify-center p-4`}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`
                  ${isDark ? 'bg-slate-800 border border-slate-700/50' : 'bg-white border border-slate-100'} 
                  rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto
                `}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
                      <Bell size={24} className={isDark ? 'text-violet-400' : 'text-violet-600'} />
                    </div>
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {editingAnnouncement ? '编辑公告' : '发布公告'}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowAnnouncementModal(false);
                      setEditingAnnouncement(null);
                      setAnnouncementTitle('');
                      setAnnouncementContent('');
                      setIsAnnouncementPinned(false);
                    }}
                    className={`
                      p-2 rounded-xl transition-all duration-200
                      ${isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'}
                    `}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      公告标题
                    </label>
                    <input
                      type="text"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      placeholder="输入公告标题"
                      className={`
                        w-full px-4 py-2.5 rounded-xl border transition-all duration-200
                        ${isDark 
                          ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:bg-slate-900' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'}
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                      `}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      公告内容
                    </label>
                    <textarea
                      value={announcementContent}
                      onChange={(e) => setAnnouncementContent(e.target.value)}
                      placeholder="输入公告内容，支持多行文本..."
                      rows={6}
                      className={`
                        w-full px-4 py-2.5 rounded-xl border transition-all duration-200 resize-none
                        ${isDark 
                          ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:bg-slate-900' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'}
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                      `}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsAnnouncementPinned(!isAnnouncementPinned)}
                      className={`
                        flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold
                        transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5
                        ${isAnnouncementPinned
                          ? (isDark 
                              ? 'bg-gradient-to-r from-violet-600 to-violet-500 text-white' 
                              : 'bg-gradient-to-r from-violet-500 to-violet-600 text-white')
                          : (isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700')
                        }
                      `}
                    >
                      <Pin size={18} />
                      <span>{isAnnouncementPinned ? '已置顶' : '置顶公告'}</span>
                    </button>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowAnnouncementModal(false);
                        setEditingAnnouncement(null);
                        setAnnouncementTitle('');
                        setAnnouncementContent('');
                        setIsAnnouncementPinned(false);
                      }}
                      className={`
                        flex-1 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200
                        ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}
                      `}
                    >
                      取消
                    </button>
                    <button
                      onClick={publishAnnouncement}
                      className={`
                        flex-1 px-5 py-2.5 rounded-xl font-semibold
                        transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5
                        ${isDark 
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white' 
                          : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white'}
                      `}
                    >
                      {editingAnnouncement ? '保存修改' : '发布公告'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default CommunityManagement;
