import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { TianjinImage } from './TianjinStyleComponents';
import { communityService } from '@/services/communityService';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Shield, 
  UserCheck, 
  UserX,
  Settings,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Copy,
  RefreshCw,
  Filter,
  Download,
  Mail,
  Crown,
  Edit3,
  Eye,
  EyeOff,
  Lock,
  Globe,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Send,
  History,
  Pin,
  Calendar,
  AlertTriangle,
  CheckSquare,
  Square,
  X
} from 'lucide-react';

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

// 统计卡片组件 - 高级设计
const StatCard = ({
  icon: Icon,
  value,
  label,
  isDark,
  color = 'blue'
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  isDark: boolean;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}) => {
  const colorClasses = {
    blue: {
      bg: isDark ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10' : 'bg-gradient-to-br from-blue-50 to-blue-100/50',
      icon: isDark ? 'text-blue-400' : 'text-blue-600',
      border: isDark ? 'border-blue-500/20' : 'border-blue-200',
      glow: isDark ? 'group-hover:shadow-blue-500/20' : 'group-hover:shadow-blue-500/10'
    },
    green: {
      bg: isDark ? 'bg-gradient-to-br from-green-500/20 to-green-600/10' : 'bg-gradient-to-br from-green-50 to-green-100/50',
      icon: isDark ? 'text-green-400' : 'text-green-600',
      border: isDark ? 'border-green-500/20' : 'border-green-200',
      glow: isDark ? 'group-hover:shadow-green-500/20' : 'group-hover:shadow-green-500/10'
    },
    purple: {
      bg: isDark ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/10' : 'bg-gradient-to-br from-purple-50 to-purple-100/50',
      icon: isDark ? 'text-purple-400' : 'text-purple-600',
      border: isDark ? 'border-purple-500/20' : 'border-purple-200',
      glow: isDark ? 'group-hover:shadow-purple-500/20' : 'group-hover:shadow-purple-500/10'
    },
    orange: {
      bg: isDark ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/10' : 'bg-gradient-to-br from-orange-50 to-orange-100/50',
      icon: isDark ? 'text-orange-400' : 'text-orange-600',
      border: isDark ? 'border-orange-500/20' : 'border-orange-200',
      glow: isDark ? 'group-hover:shadow-orange-500/20' : 'group-hover:shadow-orange-500/10'
    },
    red: {
      bg: isDark ? 'bg-gradient-to-br from-red-500/20 to-red-600/10' : 'bg-gradient-to-br from-red-50 to-red-100/50',
      icon: isDark ? 'text-red-400' : 'text-red-600',
      border: isDark ? 'border-red-500/20' : 'border-red-200',
      glow: isDark ? 'group-hover:shadow-red-500/20' : 'group-hover:shadow-red-500/10'
    },
  };

  const theme = colorClasses[color];

  return (
    <div className={`group relative p-5 rounded-2xl ${theme.bg} border ${theme.border} ${theme.glow} hover:shadow-lg transition-all duration-300 cursor-default overflow-hidden`}>
      {/* 背景装饰 */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-30 blur-2xl ${color === 'blue' ? 'bg-blue-500' : color === 'green' ? 'bg-green-500' : color === 'purple' ? 'bg-purple-500' : color === 'orange' ? 'bg-orange-500' : 'bg-red-500'}`} />

      <div className="relative">
        <div className={`p-2.5 rounded-xl w-fit ${isDark ? 'bg-white/10' : 'bg-white/80'} backdrop-blur-sm shadow-sm`}>
          <Icon size={22} className={theme.icon} />
        </div>
        <div className="mt-4">
          <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} tracking-tight`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div className={`text-sm font-medium mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</div>
        </div>
      </div>
    </div>
  );
};

// 角色徽章组件 - 高级设计
const RoleBadge = ({ role, isDark }: { role: CommunityRole; isDark: boolean }) => {
  const roleConfig = {
    admin: {
      label: '管理员',
      bg: isDark ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/10' : 'bg-gradient-to-r from-purple-100 to-purple-50',
      text: isDark ? 'text-purple-300' : 'text-purple-700',
      border: isDark ? 'border-purple-500/30' : 'border-purple-200',
      icon: Crown,
      iconColor: isDark ? 'text-purple-400' : 'text-purple-600'
    },
    editor: {
      label: '编辑',
      bg: isDark ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/10' : 'bg-gradient-to-r from-blue-100 to-blue-50',
      text: isDark ? 'text-blue-300' : 'text-blue-700',
      border: isDark ? 'border-blue-500/30' : 'border-blue-200',
      icon: Edit3,
      iconColor: isDark ? 'text-blue-400' : 'text-blue-600'
    },
    member: {
      label: '成员',
      bg: isDark ? 'bg-gradient-to-r from-green-500/20 to-green-600/10' : 'bg-gradient-to-r from-green-100 to-green-50',
      text: isDark ? 'text-green-300' : 'text-green-700',
      border: isDark ? 'border-green-500/30' : 'border-green-200',
      icon: UserCheck,
      iconColor: isDark ? 'text-green-400' : 'text-green-600'
    },
  };

  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} shadow-sm`}>
      <Icon size={12} className={config.iconColor} />
      {config.label}
    </span>
  );
};

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

  // 获取当前用户
  const currentEmail = localStorage.getItem('userEmail') || 'user@example.com';

  // 加载数据
  useEffect(() => {
    if (!isOpen) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        // 加载成员列表
        const mockMembers: CommunityMember[] = [
          { id: '1', email: 'admin@example.com', username: '管理员', role: 'admin', joinedAt: '2024-01-01', isOnline: true, postCount: 45 },
          { id: '2', email: 'editor@example.com', username: '编辑小王', role: 'editor', joinedAt: '2024-01-15', isOnline: true, postCount: 23 },
          { id: '3', email: 'member1@example.com', username: '设计达人', role: 'member', joinedAt: '2024-02-01', isOnline: false, lastActive: '2小时前', postCount: 12 },
          { id: '4', email: 'member2@example.com', username: '创意小王子', role: 'member', joinedAt: '2024-02-10', isOnline: true, postCount: 8 },
          { id: '5', email: 'member3@example.com', username: '艺术爱好者', role: 'member', joinedAt: '2024-02-15', isOnline: false, lastActive: '1天前', postCount: 5 },
        ];
        setMembers(mockMembers);

        // 加载加入请求
        const mockRequests: JoinRequest[] = [
          { id: '1', userId: 'user1', username: '新用户A', requestMessage: '我对设计很感兴趣，希望能加入社群学习交流', createdAt: '2024-02-20T10:00:00Z' },
          { id: '2', userId: 'user2', username: '设计师B', requestMessage: '有3年UI设计经验，希望分享作品', createdAt: '2024-02-20T09:30:00Z' },
        ];
        setJoinRequests(mockRequests);

        // 加载公告
        const mockAnnouncements: Announcement[] = [
          {
            id: '1',
            title: '欢迎来到我们的社群！',
            content: '请大家遵守社群规则，文明交流，共同进步。',
            createdAt: '2024-01-01T00:00:00Z',
            isPinned: true,
            author: { username: '管理员' },
            readCount: 156
          },
          {
            id: '2',
            title: '本周设计分享活动',
            content: '本周五晚8点，我们将举办线上设计分享会，欢迎大家参加！',
            createdAt: '2024-02-18T10:00:00Z',
            isPinned: false,
            author: { username: '编辑小王' },
            readCount: 89
          },
        ];
        setAnnouncements(mockAnnouncements);

        // 加载社群设置
        const communityData = await communityService.getCommunity(community.id);
        if (communityData) {
          setJoinApprovalRequired(communityData.joinApprovalRequired || false);
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
    
    // TODO: 调用API发送邀请
    toast.success(`已向 ${inviteEmail} 发送邀请`);
    setInviteEmail('');
    setShowInviteModal(false);
  };

  // 更新成员角色
  const updateMemberRole = (memberId: string, newRole: CommunityRole) => {
    setMembers(prev => prev.map(member => 
      member.id === memberId ? { ...member, role: newRole } : member
    ));
    toast.success('成员角色已更新');
  };

  // 移除成员
  const removeMember = (memberId: string) => {
    if (!window.confirm('确定要移除该成员吗？')) return;
    
    setMembers(prev => prev.filter(member => member.id !== memberId));
    toast.success('成员已移除');
  };

  // 批量移除成员
  const batchRemoveMembers = () => {
    if (selectedMembers.size === 0) {
      toast.warning('请先选择成员');
      return;
    }
    if (!window.confirm(`确定要移除选中的 ${selectedMembers.size} 位成员吗？`)) return;
    
    setMembers(prev => prev.filter(member => !selectedMembers.has(member.id)));
    setSelectedMembers(new Set());
    toast.success(`已移除 ${selectedMembers.size} 位成员`);
  };

  // 处理加入请求
  const handleJoinRequest = (requestId: string, action: 'approve' | 'reject') => {
    const request = joinRequests.find(r => r.id === requestId);
    if (!request) return;

    if (action === 'approve') {
      // 添加到成员列表
      const newMember: CommunityMember = {
        id: request.userId,
        email: `${request.username}@example.com`,
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
  };

  // 发布公告
  const publishAnnouncement = () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      toast.warning('请填写标题和内容');
      return;
    }

    const newAnnouncement: Announcement = {
      id: editingAnnouncement?.id || Date.now().toString(),
      title: announcementTitle,
      content: announcementContent,
      createdAt: editingAnnouncement?.createdAt || new Date().toISOString(),
      updatedAt: editingAnnouncement ? new Date().toISOString() : undefined,
      isPinned: isAnnouncementPinned,
      author: { username: '当前用户' },
      readCount: 0
    };

    if (editingAnnouncement) {
      setAnnouncements(prev => prev.map(a => a.id === editingAnnouncement.id ? newAnnouncement : a));
      toast.success('公告已更新');
    } else {
      setAnnouncements(prev => [newAnnouncement, ...prev]);
      toast.success('公告已发布');
    }

    setAnnouncementTitle('');
    setAnnouncementContent('');
    setIsAnnouncementPinned(false);
    setEditingAnnouncement(null);
    setShowAnnouncementModal(false);
  };

  // 删除公告
  const deleteAnnouncement = (announcementId: string) => {
    if (!window.confirm('确定要删除这条公告吗？')) return;
    setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
    toast.success('公告已删除');
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
    try {
      await communityService.updateJoinApprovalSetting(community.id, joinApprovalRequired);
      toast.success('设置已保存');
    } catch (error) {
      toast.error('保存失败');
    }
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
    <div className={`fixed inset-0 z-50 ${isDark ? 'bg-black/70' : 'bg-black/50'} backdrop-blur-sm flex items-center justify-center p-0 md:p-4`}>
      <motion.div 
        className={`${isDark ? 'bg-gray-900' : 'bg-white'} shadow-2xl w-full h-full md:h-[90vh] md:max-w-6xl md:rounded-2xl overflow-hidden flex flex-col`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        {/* 头部 */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={community.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=random`}
                alt={community.name}
                className="w-12 h-12 rounded-xl object-cover"
              />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                社群管理
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {community.name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X size={24} />
          </button>
        </div>

        {/* 标签页导航 - 高级设计 */}
        <div className={`flex border-b ${isDark ? 'border-slate-700/50' : 'border-gray-200'} px-2`}>
          {[
            { id: 'members', label: '成员管理', icon: Users, count: members.length },
            { id: 'requests', label: '加入申请', icon: UserCheck, count: joinRequests.length },
            { id: 'announcements', label: '公告管理', icon: Bell, count: announcements.length },
            { id: 'settings', label: '社群设置', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ManagementTab)}
              className={`flex items-center gap-2 px-5 py-4 font-medium transition-all duration-300 relative mx-1 rounded-t-xl ${
                activeTab === tab.id
                  ? isDark ? 'text-blue-400 bg-slate-800/50' : 'text-blue-600 bg-blue-50/50'
                  : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'scale-110' : ''} />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === tab.id
                    ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                    : isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`}
                />
              )}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* 成员管理 */}
            {activeTab === 'members' && (
              <motion.div
                key="members"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* 统计卡片 */}
                <div className="grid grid-cols-4 gap-4">
                  <StatCard icon={Users} value={members.length} label="总成员" isDark={isDark} color="blue" />
                  <StatCard icon={Crown} value={members.filter(m => m.role === 'admin').length} label="管理员" isDark={isDark} color="purple" />
                  <StatCard icon={Edit3} value={members.filter(m => m.role === 'editor').length} label="编辑" isDark={isDark} color="green" />
                  <StatCard icon={UserCheck} value={members.filter(m => m.isOnline).length} label="在线" isDark={isDark} color="orange" />
                </div>

                {/* 操作栏 - 高级设计 */}
                <div className={`flex items-center gap-4 p-5 rounded-2xl ${isDark ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white border border-gray-100'} shadow-sm`}>
                  <div className="flex-1 relative group">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} size={18} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索成员姓名或邮箱..."
                      className={`w-full pl-11 pr-4 py-2.5 rounded-xl border transition-all duration-300 ${isDark ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-slate-900' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    />
                  </div>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`}
                  >
                    <Plus size={18} />
                    <span>邀请成员</span>
                  </button>
                  {selectedMembers.size > 0 && (
                    <button
                      onClick={batchRemoveMembers}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${isDark ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white' : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'}`}
                    >
                      <Trash2 size={18} />
                      <span>移除选中 ({selectedMembers.size})</span>
                    </button>
                  )}
                </div>

                {/* 成员列表 - 高级设计 */}
                <div className={`rounded-2xl border ${isDark ? 'border-slate-700/50' : 'border-gray-200'} overflow-hidden shadow-sm`}>
                  {filteredMembers.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center py-16 ${isDark ? 'bg-slate-800/30' : 'bg-white'}`}>
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                        <Users size={32} className={isDark ? 'text-slate-500' : 'text-gray-400'} />
                      </div>
                      <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>暂无成员</h3>
                      <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>邀请成员加入社群开始交流吧</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className={`${isDark ? 'bg-slate-800/80' : 'bg-gray-50/80'} backdrop-blur-sm`}>
                        <tr>
                          <th className="px-5 py-4 text-left">
                            <button
                              onClick={toggleSelectAll}
                              className="flex items-center gap-2 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            >
                              {selectedMembers.size === filteredMembers.length && filteredMembers.length > 0 ? (
                                <CheckSquare size={20} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                              ) : (
                                <Square size={20} className={isDark ? 'text-slate-500' : 'text-gray-400'} />
                              )}
                            </button>
                          </th>
                          <th className={`px-5 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>成员</th>
                          <th className={`px-5 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>角色</th>
                          <th className={`px-5 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>状态</th>
                          <th className={`px-5 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>加入时间</th>
                          <th className={`px-5 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>帖子数</th>
                          <th className={`px-5 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>操作</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-gray-100'}`}>
                        {filteredMembers.map((member) => (
                          <tr key={member.id} className={`${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-blue-50/30'} transition-all duration-200 group`}>
                            <td className="px-5 py-4">
                              <button
                                onClick={() => toggleMemberSelection(member.id)}
                                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                              >
                                {selectedMembers.has(member.id) ? (
                                  <CheckSquare size={20} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                                ) : (
                                  <Square size={20} className={isDark ? 'text-slate-500' : 'text-gray-400'} />
                                )}
                              </button>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className={`w-11 h-11 rounded-full flex items-center justify-center overflow-hidden shadow-md ${isDark ? 'bg-gradient-to-br from-slate-600 to-slate-700' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
                                    {member.avatar ? (
                                      <img src={member.avatar} alt={member.username} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                        {member.username[0]}
                                      </span>
                                    )}
                                  </div>
                                  {member.isOnline && (
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 ${isDark ? 'border-slate-800 bg-green-500' : 'border-white bg-green-500'} shadow-sm`}>
                                      <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{member.username}</div>
                                  <div className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{member.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <RoleBadge role={member.role} isDark={isDark} />
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${member.isOnline ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'}`} />
                                <span className={`text-sm font-medium ${member.isOnline ? 'text-green-600 dark:text-green-400' : isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                  {member.isOnline ? '在线' : member.lastActive || '离线'}
                                </span>
                              </div>
                            </td>
                            <td className={`px-5 py-4 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                              {new Date(member.joinedAt).toLocaleDateString('zh-CN')}
                            </td>
                            <td className={`px-5 py-4 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                              {member.postCount || 0}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <select
                                  value={member.role}
                                  onChange={(e) => updateMemberRole(member.id, e.target.value as CommunityRole)}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${isDark ? 'bg-slate-700 border-slate-600 text-white hover:border-slate-500' : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                >
                                  <option value="member">成员</option>
                                  <option value="editor">编辑</option>
                                  <option value="admin">管理员</option>
                                </select>
                                <button
                                  onClick={() => removeMember(member.id)}
                                  className={`p-2 rounded-lg transition-all duration-200 ${isDark ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-600'}`}
                                  title="移除成员"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                className="space-y-6"
              >
                <div className="grid grid-cols-3 gap-4">
                  <StatCard icon={UserCheck} value={joinRequests.filter(r => r.createdAt).length} label="待审核" isDark={isDark} color="orange" />
                  <StatCard icon={CheckCircle} value={156} label="本月通过" isDark={isDark} color="green" />
                  <StatCard icon={XCircle} value={12} label="本月拒绝" isDark={isDark} color="red" />
                </div>

                <div className={`rounded-2xl border ${isDark ? 'border-slate-700/50' : 'border-gray-200'} overflow-hidden shadow-sm`}>
                  {joinRequests.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center py-16 ${isDark ? 'bg-slate-800/30' : 'bg-white'}`}>
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                        <UserCheck size={32} className={isDark ? 'text-slate-500' : 'text-gray-400'} />
                      </div>
                      <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>暂无申请</h3>
                      <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>暂时没有待审核的加入申请</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {joinRequests.map((request) => (
                        <div key={request.id} className={`p-6 ${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'} transition-colors`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                {request.avatar ? (
                                  <img src={request.avatar} alt={request.username} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <span className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {request.username[0]}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{request.username}</div>
                                <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                  申请时间: {new Date(request.createdAt).toLocaleString('zh-CN')}
                                </div>
                                {request.requestMessage && (
                                  <div className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    "{request.requestMessage}"
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleJoinRequest(request.id, 'approve')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                              >
                                <CheckCircle size={16} />
                                <span>批准</span>
                              </button>
                              <button
                                onClick={() => handleJoinRequest(request.id, 'reject')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                              >
                                <XCircle size={16} />
                                <span>拒绝</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
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
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="grid grid-cols-3 gap-4 flex-1">
                    <StatCard icon={FileText} value={announcements.length} label="总公告" isDark={isDark} color="blue" />
                    <StatCard icon={Pin} value={announcements.filter(a => a.isPinned).length} label="置顶" isDark={isDark} color="purple" />
                    <StatCard icon={Eye} value={announcements.reduce((sum, a) => sum + a.readCount, 0)} label="总阅读" isDark={isDark} color="green" />
                  </div>
                  <button
                    onClick={() => setShowAnnouncementModal(true)}
                    className={`ml-4 flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                  >
                    <Plus size={18} />
                    <span>发布公告</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className={`group p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg ${isDark ? 'border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50' : 'border-gray-200 bg-white hover:bg-gray-50/50'} ${announcement.isPinned ? (isDark ? 'ring-1 ring-purple-500/30 shadow-purple-500/10' : 'ring-1 ring-purple-200 shadow-purple-500/5') : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            {announcement.isPinned && (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/10 text-purple-300 border border-purple-500/30' : 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border border-purple-200'}`}>
                                <Pin size={10} />
                                置顶
                              </span>
                            )}
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {announcement.title}
                            </h3>
                          </div>
                          <p className={`text-sm mb-4 leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                            {announcement.content}
                          </p>
                          <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                            <span className="flex items-center gap-1.5">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600'}`}>
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
                        <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => togglePinAnnouncement(announcement.id)}
                            className={`p-2 rounded-xl transition-all duration-200 ${announcement.isPinned ? (isDark ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' : 'bg-purple-100 text-purple-600 hover:bg-purple-200') : (isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500')}`}
                            title={announcement.isPinned ? '取消置顶' : '置顶公告'}
                          >
                            <Pin size={18} />
                          </button>
                          <button
                            onClick={() => editAnnouncement(announcement)}
                            className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                            title="编辑"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => deleteAnnouncement(announcement.id)}
                            className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-500 hover:text-red-600'}`}
                            title="删除"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
                className="space-y-6 max-w-2xl"
              >
                {/* 基本信息 - 高级设计 */}
                <div className={`p-6 rounded-2xl border ${isDark ? 'border-slate-700/50 bg-slate-800/30' : 'border-gray-200 bg-white'} shadow-sm`}>
                  <h3 className={`text-lg font-bold mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <Settings size={20} className={isDark ? 'text-blue-400' : 'text-blue-500'} />
                    基本信息
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        社群名称
                      </label>
                      <input
                        type="text"
                        value={communitySettings.name}
                        onChange={(e) => setCommunitySettings(prev => ({ ...prev, name: e.target.value }))}
                        className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-200 ${isDark ? 'bg-slate-900/50 border-slate-700 text-white focus:border-blue-500/50 focus:bg-slate-900' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        社群简介
                      </label>
                      <textarea
                        value={communitySettings.description}
                        onChange={(e) => setCommunitySettings(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-200 resize-none ${isDark ? 'bg-slate-900/50 border-slate-700 text-white focus:border-blue-500/50 focus:bg-slate-900' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      />
                    </div>
                  </div>
                </div>

                {/* 隐私设置 - 高级设计 */}
                <div className={`p-6 rounded-2xl border ${isDark ? 'border-slate-700/50 bg-slate-800/30' : 'border-gray-200 bg-white'} shadow-sm`}>
                  <h3 className={`text-lg font-bold mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <Shield size={20} className={isDark ? 'text-green-400' : 'text-green-500'} />
                    隐私设置
                  </h3>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-slate-900/30' : 'bg-gray-50'}">
                      <div>
                        <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>社群可见性</div>
                        <div className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          {privacy === 'public' ? '所有人都可以发现和加入' : '仅邀请成员可以加入'}
                        </div>
                      </div>
                      <button
                        onClick={() => setPrivacy(privacy === 'public' ? 'private' : 'public')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
                          privacy === 'public'
                            ? isDark ? 'bg-gradient-to-r from-green-600 to-green-500 text-white' : 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                            : isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {privacy === 'public' ? <Globe size={18} /> : <Lock size={18} />}
                        <span>{privacy === 'public' ? '公开' : '私密'}</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-slate-900/30' : 'bg-gray-50'}">
                      <div>
                        <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>加入审核</div>
                        <div className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          {joinApprovalRequired ? '需要管理员审核才能加入' : '无需审核，直接加入'}
                        </div>
                      </div>
                      <button
                        onClick={() => setJoinApprovalRequired(!joinApprovalRequired)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
                          joinApprovalRequired
                            ? isDark ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                            : isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {joinApprovalRequired ? <Shield size={18} /> : <CheckCircle size={18} />}
                        <span>{joinApprovalRequired ? '已开启' : '已关闭'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 功能模块 - 高级设计 */}
                <div className={`p-6 rounded-2xl border ${isDark ? 'border-slate-700/50 bg-slate-800/30' : 'border-gray-200 bg-white'} shadow-sm`}>
                  <h3 className={`text-lg font-bold mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <FileText size={20} className={isDark ? 'text-purple-400' : 'text-purple-500'} />
                    功能模块
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'allowPosts', label: '帖子功能', icon: FileText },
                      { key: 'allowChat', label: '聊天功能', icon: MessageSquare },
                      { key: 'allowComments', label: '评论功能', icon: MessageSquare },
                    ].map(({ key, label, icon: Icon }) => (
                      <div key={key} className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-slate-900/30' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                            <Icon size={18} className={isDark ? 'text-slate-400' : 'text-gray-500'} />
                          </div>
                          <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{label}</span>
                        </div>
                        <button
                          onClick={() => setCommunitySettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                          className={`w-14 h-7 rounded-full transition-all duration-300 relative ${
                            communitySettings[key as keyof typeof communitySettings]
                              ? isDark ? 'bg-gradient-to-r from-blue-600 to-blue-500' : 'bg-gradient-to-r from-blue-500 to-blue-600'
                              : isDark ? 'bg-slate-700' : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                              communitySettings[key as keyof typeof communitySettings] ? 'translate-x-8' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 保存按钮 - 高级设计 */}
                <div className="flex justify-end">
                  <button
                    onClick={saveSettings}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`}
                  >
                    <CheckCircle size={20} />
                    <span>保存设置</span>
                  </button>
                </div>

                {/* 危险操作 - 高级设计 */}
                <div className={`p-6 rounded-2xl border ${isDark ? 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-600/5' : 'border-red-200 bg-gradient-to-br from-red-50 to-red-100/50'} shadow-sm`}>
                  <h3 className={`text-lg font-bold mb-5 flex items-center gap-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    <AlertTriangle size={20} />
                    危险操作
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-bold ${isDark ? 'text-red-300' : 'text-red-700'}`}>删除社群</div>
                      <div className={`text-sm mt-1 ${isDark ? 'text-red-400/80' : 'text-red-600/80'}`}>
                        此操作不可撤销，所有数据将被永久删除
                      </div>
                    </div>
                    {onDeleteCommunity && (
                      <button
                        onClick={onDeleteCommunity}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${isDark ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white' : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'}`}
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

        {/* 邀请成员弹窗 - 高级设计 */}
        {showInviteModal && (
          <div className={`fixed inset-0 z-[60] ${isDark ? 'bg-black/80' : 'bg-black/60'} backdrop-blur-sm flex items-center justify-center p-4`}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`${isDark ? 'bg-slate-800 border border-slate-700/50' : 'bg-white border border-gray-100'} rounded-2xl shadow-2xl p-6 max-w-md w-full`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <Mail size={24} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                  </div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>邀请成员</h3>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    邮箱地址
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} size={18} />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="输入成员邮箱地址"
                      className={`w-full pl-11 pr-4 py-2.5 rounded-xl border transition-all duration-200 ${isDark ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-slate-900' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    分配角色
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as CommunityRole)}
                    className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-200 ${isDark ? 'bg-slate-900/50 border-slate-700 text-white focus:border-blue-500/50 focus:bg-slate-900' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  >
                    <option value="member">成员 - 普通社群成员</option>
                    <option value="editor">编辑 - 可管理帖子内容</option>
                    <option value="admin">管理员 - 拥有所有权限</option>
                  </select>
                </div>

                <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-900/30 border-slate-700/50' : 'bg-gray-50 border-gray-200'}`}>
                  <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    邀请链接
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      placeholder="点击右侧按钮生成邀请链接"
                      className={`flex-1 px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'bg-slate-900/50 border-slate-700 text-slate-400' : 'bg-white border-gray-200 text-gray-500'} focus:outline-none`}
                    />
                    <button
                      onClick={copyInviteLink}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`}
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className={`flex-1 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                  >
                    取消
                  </button>
                  <button
                    onClick={sendInvite}
                    className={`flex-1 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`}
                  >
                    发送邀请
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* 发布公告弹窗 - 高级设计 */}
        {showAnnouncementModal && (
          <div className={`fixed inset-0 z-[60] ${isDark ? 'bg-black/80' : 'bg-black/60'} backdrop-blur-sm flex items-center justify-center p-4`}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`${isDark ? 'bg-slate-800 border border-slate-700/50' : 'bg-white border border-gray-100'} rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                    <Bell size={24} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                  </div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
                  className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    公告标题
                  </label>
                  <input
                    type="text"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="输入公告标题"
                    className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-200 ${isDark ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-slate-900' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    公告内容
                  </label>
                  <textarea
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    placeholder="输入公告内容，支持多行文本..."
                    rows={6}
                    className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-200 resize-none ${isDark ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-slate-900' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsAnnouncementPinned(!isAnnouncementPinned)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
                      isAnnouncementPinned
                        ? isDark ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white' : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                        : isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-700'
                    }`}
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
                    className={`flex-1 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                  >
                    取消
                  </button>
                  <button
                    onClick={publishAnnouncement}
                    className={`flex-1 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`}
                  >
                    {editingAnnouncement ? '保存修改' : '发布公告'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CommunityManagement;
