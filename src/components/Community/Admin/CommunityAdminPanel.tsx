import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { 
  Users, 
  Crown, 
  Edit3, 
  UserCheck,
  Bell,
  Shield,
  Settings,
  Search,
  Mail,
  Link as LinkIcon,
  Copy,
  CheckCircle,
  XCircle,
  FileText,
  Pin,
  Eye,
  Trash2,
  AlertTriangle,
  X,
  UserPlus,
  ChevronLeft
} from 'lucide-react';
import ModerationPanel, { ModerationContent, ModerationRule } from '../Moderation/ModerationPanel';
import { supabase } from '@/lib/supabaseClient';

// 导入优化后的组件
import StatCard from '../StatCard';
import RoleBadge from '../RoleBadge';
import CommunityTabs from '../CommunityTabs';

// 导入样式
import '@/styles/community-management.css';

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

export interface Community {
  id: string;
  name: string;
  description: string;
  cover: string;
  tags: string[];
  bookmarks: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
  members: number;
}

interface CommunityMember {
  id: string;
  email: string;
  name: string;
  role: CommunityRole;
  joinedAt: Date;
}

interface CommunityAdminPanelProps {
  isDark: boolean;
  communityId: string;
  community: Community | null;
  members: CommunityMember[];
  pendingContent: ModerationContent[];
  approvedContent: ModerationContent[];
  rejectedContent: ModerationContent[];
  moderationRules: ModerationRule[];
  announcement: string;
  isAdmin: boolean;
  onAddMember: (email: string, role: CommunityRole) => void;
  onRemoveMember: (memberId: string) => void;
  onUpdateMemberRole: (memberId: string, role: CommunityRole) => void;
  onUpdateAnnouncement: (content: string) => void;
  onUpdateCommunity: (community: Partial<Community>) => void;
  onApproveContent: (contentId: string) => void;
  onRejectContent: (contentId: string, reason: string) => void;
  onAddModerationRule: (rule: Omit<ModerationRule, 'id'>) => void;
  onUpdateModerationRule: (rule: ModerationRule) => void;
  onDeleteModerationRule: (ruleId: string) => void;
}

const CommunityAdminPanel: React.FC<CommunityAdminPanelProps> = ({
  isDark,
  communityId: propCommunityId,
  community,
  members: propMembers = [],
  pendingContent = [],
  approvedContent = [],
  rejectedContent = [],
  moderationRules = [],
  announcement = '',
  isAdmin,
  onAddMember,
  onRemoveMember,
  onUpdateMemberRole,
  onUpdateAnnouncement,
  onUpdateCommunity,
  onApproveContent,
  onRejectContent,
  onAddModerationRule,
  onUpdateModerationRule,
  onDeleteModerationRule
}) => {
  // 获取路由参数
  const params = useParams();
  const actualCommunityId = propCommunityId || params.id || '';

  // 状态管理
  const [activeTab, setActiveTab] = useState('members');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<CommunityRole>('member');
  const [currentAnnouncement, setCurrentAnnouncement] = useState(announcement);
  const [editingCommunity, setEditingCommunity] = useState<Partial<Community> | null>(null);
  const [inviteLink, setInviteLink] = useState('');

  // 成员数据状态
  const [members, setMembers] = useState<CommunityMember[]>(propMembers);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // 成员搜索和筛选
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<CommunityRole | 'all'>('all');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);

  // 公告管理
  const [announcementHistory, setAnnouncementHistory] = useState<Array<{id: string; content: string; createdAt: Date; author: string}>>([]);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  // 社群设置
  const [communityVisibility, setCommunityVisibility] = useState<'public' | 'private'>('public');
  const [joinApprovalRequired, setJoinApprovalRequired] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 获取社区成员数据
  useEffect(() => {
    const fetchMembers = async () => {
      if (!actualCommunityId) return;

      setIsLoadingMembers(true);
      try {
        // 先获取社区成员列表
        const { data: membersData, error: membersError } = await supabase
          .from('community_members')
          .select('user_id, role, joined_at')
          .eq('community_id', actualCommunityId);

        if (membersError) {
          console.error('Failed to fetch members:', membersError);
          toast.error('获取成员列表失败');
          return;
        }

        if (membersData && membersData.length > 0) {
          // 获取用户ID列表
          const userIds = membersData.map(m => m.user_id);

          // 再获取用户信息
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, username, email, avatar_url')
            .in('id', userIds);

          if (usersError) {
            console.error('Failed to fetch users:', usersError);
          }

          // 合并数据
          const userMap = new Map(usersData?.map(u => [u.id, u]) || []);

          const formattedMembers: CommunityMember[] = membersData.map(m => {
            const user = userMap.get(m.user_id);
            return {
              id: m.user_id,
              email: user?.email || '',
              name: user?.username || '未知用户',
              role: (m.role as CommunityRole) || 'member',
              joinedAt: new Date(m.joined_at)
            };
          });
          setMembers(formattedMembers);
        } else {
          setMembers([]);
        }
      } catch (error) {
        console.error('Error fetching members:', error);
        toast.error('获取成员列表失败');
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [actualCommunityId]);

  // 生成邀请链接
  const generateInviteLink = () => {
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const link = `${window.location.origin}/join-community/${actualCommunityId}?code=${inviteCode}`;
    setInviteLink(link);
    
    // 复制到剪贴板
    navigator.clipboard.writeText(link).then(() => {
      toast.success('邀请链接已复制到剪贴板');
    }).catch(err => {
      console.error('复制失败:', err);
      toast.error('复制失败，请手动复制链接');
    });
  };

  // 添加成员
  const handleAddMember = () => {
    if (!newMemberEmail.trim()) {
      toast.warning('请输入邮箱地址');
      return;
    }
    
    onAddMember(newMemberEmail.trim(), newMemberRole);
    setNewMemberEmail('');
    setNewMemberRole('member');
  };

  // 发布公告
  const handlePublishAnnouncement = () => {
    if (!currentAnnouncement.trim()) {
      toast.warning('请输入公告内容');
      return;
    }
    
    const newAnnouncement = {
      id: Date.now().toString(),
      content: currentAnnouncement.trim(),
      createdAt: new Date(),
      author: '当前用户'
    };
    
    setAnnouncementHistory(prev => [newAnnouncement, ...prev]);
    onUpdateAnnouncement(currentAnnouncement.trim());
    setCurrentAnnouncement('');
    toast.success('公告已发布');
  };

  // 编辑公告
  const handleEditAnnouncement = (id: string, content: string) => {
    setEditingAnnouncementId(id);
    setCurrentAnnouncement(content);
  };

  // 保存编辑的公告
  const handleSaveEditAnnouncement = () => {
    if (!currentAnnouncement.trim()) {
      toast.warning('请输入公告内容');
      return;
    }
    
    setAnnouncementHistory(prev => prev.map(ann => 
      ann.id === editingAnnouncementId 
        ? { ...ann, content: currentAnnouncement.trim() }
        : ann
    ));
    
    onUpdateAnnouncement(currentAnnouncement.trim());
    setEditingAnnouncementId(null);
    setCurrentAnnouncement('');
    toast.success('公告已更新');
  };

  // 删除公告
  const handleDeleteAnnouncement = (id: string) => {
    if (window.confirm('确定要删除这条公告吗？')) {
      setAnnouncementHistory(prev => prev.filter(ann => ann.id !== id));
      toast.success('公告已删除');
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingAnnouncementId(null);
    setCurrentAnnouncement('');
  };

  // 保存社群设置
  const handleSaveSettings = () => {
    if (!editingCommunity) return;
    
    onUpdateCommunity(editingCommunity);
    setEditingCommunity(null);
    toast.success('社群设置已更新');
  };

  // 筛选成员
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(memberSearchQuery.toLowerCase());
    const matchesRole = memberRoleFilter === 'all' || member.role === memberRoleFilter;
    return matchesSearch && matchesRole;
  });

  // 批量选择成员
  const toggleMemberSelection = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredMembers.map(m => m.id)));
    }
  };

  // 批量移除成员
  const handleBatchRemove = () => {
    if (selectedMembers.size === 0) return;
    
    if (window.confirm(`确定要移除选中的 ${selectedMembers.size} 位成员吗？`)) {
      selectedMembers.forEach(memberId => {
        onRemoveMember(memberId);
      });
      setSelectedMembers(new Set());
      setIsBatchMode(false);
      toast.success(`已移除 ${selectedMembers.size} 位成员`);
    }
  };

  // 批量修改角色
  const handleBatchUpdateRole = (role: CommunityRole) => {
    if (selectedMembers.size === 0) return;
    
    selectedMembers.forEach(memberId => {
      onUpdateMemberRole(memberId, role);
    });
    setSelectedMembers(new Set());
    setIsBatchMode(false);
    toast.success(`已将 ${selectedMembers.size} 位成员设置为${role === 'admin' ? '管理员' : role === 'editor' ? '编辑' : '成员'}`);
  };

  // 管理成员功能 - 高级设计
  const renderMembersTab = () => (
    <div className="space-y-6">
      {/* 成员统计 - 使用优化后的 StatCard 组件 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={Users} 
          value={isLoadingMembers ? '...' : members.length} 
          label="总成员" 
          isDark={isDark} 
          color="primary"
          delay={0}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard 
          icon={Crown} 
          value={isLoadingMembers ? '...' : members.filter(m => m.role === 'admin').length} 
          label="管理员" 
          isDark={isDark} 
          color="purple"
          delay={1}
        />
        <StatCard 
          icon={Edit3} 
          value={isLoadingMembers ? '...' : members.filter(m => m.role === 'editor').length} 
          label="编辑" 
          isDark={isDark} 
          color="success"
          delay={2}
        />
        <StatCard 
          icon={UserCheck} 
          value={isLoadingMembers ? '...' : members.filter(m => m.role === 'member').length} 
          label="普通成员" 
          isDark={isDark} 
          color="orange"
          delay={3}
        />
      </div>

      {/* 添加成员 - 高级设计 */}
      <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-100'}`}>
        <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <span className="text-lg">➕</span>
          添加成员
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">✉️</span>
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="输入邮箱地址"
              className={`w-full pl-11 pr-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-slate-900' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>
          <select
            value={newMemberRole}
            onChange={(e) => setNewMemberRole(e.target.value as CommunityRole)}
            className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-slate-900/50 border-slate-700 text-white focus:border-blue-500/50 focus:bg-slate-900' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          >
            <option value="member">普通成员</option>
            <option value="editor">编辑</option>
            <option value="admin">管理员</option>
          </select>
          <button
            onClick={handleAddMember}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`}
          >
            邀请
          </button>
        </div>
      </div>

      {/* 邀请链接 - 高级设计 */}
      <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-100'}`}>
        <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <span className="text-lg">🔗</span>
          邀请链接
        </h3>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={inviteLink}
            readOnly
            placeholder="点击右侧按钮生成邀请链接"
            className={`flex-1 px-4 py-3 rounded-xl border text-sm ${isDark ? 'bg-slate-900/50 border-slate-700 text-slate-400' : 'bg-gray-50 border-gray-200 text-gray-500'} focus:outline-none`}
          />
          <button
            onClick={generateInviteLink}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap ${isDark ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'}`}
          >
            生成链接
          </button>
        </div>
      </div>

      {/* 成员搜索和筛选 - 新增 */}
      <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-100'}`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
              placeholder="搜索成员姓名或邮箱..."
              className={`w-full pl-11 pr-4 py-2.5 rounded-xl border transition-all duration-200 ${isDark ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-slate-900' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>
          <select
            value={memberRoleFilter}
            onChange={(e) => setMemberRoleFilter(e.target.value as CommunityRole | 'all')}
            className={`px-4 py-2.5 rounded-xl border transition-all duration-200 ${isDark ? 'bg-slate-900/50 border-slate-700 text-white focus:border-blue-500/50 focus:bg-slate-900' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          >
            <option value="all">所有角色</option>
            <option value="admin">管理员</option>
            <option value="editor">编辑</option>
            <option value="member">普通成员</option>
          </select>
          <button
            onClick={() => setIsBatchMode(!isBatchMode)}
            className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${isBatchMode ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : (isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}`}
          >
            {isBatchMode ? '✓ 完成' : '☰ 批量操作'}
          </button>
        </div>

        {/* 批量操作工具栏 */}
        {isBatchMode && selectedMembers.size > 0 && (
          <div className={`mt-4 pt-4 border-t flex items-center gap-3 ${isDark ? 'border-slate-700/50' : 'border-gray-100'}`}>
            <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              已选择 {selectedMembers.size} 位成员
            </span>
            <div className="flex-1" />
            <select
              onChange={(e) => handleBatchUpdateRole(e.target.value as CommunityRole)}
              className={`px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              defaultValue=""
            >
              <option value="" disabled>批量设置角色</option>
              <option value="admin">设为管理员</option>
              <option value="editor">设为编辑</option>
              <option value="member">设为成员</option>
            </select>
            <button
              onClick={handleBatchRemove}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
            >
              🗑️ 批量移除
            </button>
          </div>
        )}
      </div>

      {/* 成员列表 - 高级设计 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <span className="text-lg">📋</span>
            成员列表
            <span className={`text-sm font-normal px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
              {filteredMembers.length}
            </span>
          </h3>
          {isBatchMode && filteredMembers.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className={`text-sm font-medium transition-colors ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
            >
              {selectedMembers.size === filteredMembers.length ? '取消全选' : '全选'}
            </button>
          )}
        </div>
        <div className={`rounded-2xl border overflow-hidden shadow-sm ${isDark ? 'border-slate-700/50' : 'border-gray-200'}`}>
          {filteredMembers.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-16 ${isDark ? 'bg-slate-800/30' : 'bg-white'}`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                <span className="text-3xl">👥</span>
              </div>
              <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {memberSearchQuery ? '未找到匹配的成员' : '暂无成员'}
              </h3>
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                {memberSearchQuery ? '请尝试其他搜索条件' : '邀请成员加入社群开始交流吧'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
              {filteredMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-5 flex items-center gap-4 transition-all duration-200 group ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-blue-50/30'} ${selectedMembers.has(member.id) ? (isDark ? 'bg-blue-500/10' : 'bg-blue-50/50') : ''}`}
                >
                  {/* 批量选择复选框 */}
                  {isBatchMode && (
                    <button
                      onClick={() => toggleMemberSelection(member.id)}
                      className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                        selectedMembers.has(member.id)
                          ? (isDark ? 'bg-blue-500 border-blue-500' : 'bg-blue-500 border-blue-500')
                          : (isDark ? 'border-slate-600 hover:border-slate-500' : 'border-gray-300 hover:border-gray-400')
                      }`}
                    >
                      {selectedMembers.has(member.id) && <span className="text-white text-sm">✓</span>}
                    </button>
                  )}
                  
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold shadow-md flex-shrink-0 ${isDark ? 'bg-gradient-to-br from-slate-600 to-slate-700 text-slate-200' : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600'}`}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{member.name}</div>
                    <div className={`text-sm truncate ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{member.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RoleBadge role={member.role} isDark={isDark} size="sm" />
                    {!isBatchMode && (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) => onUpdateMemberRole(member.id, e.target.value as CommunityRole)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${isDark ? 'bg-slate-700 border-slate-600 text-white hover:border-slate-500' : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        >
                          <option value="member">普通成员</option>
                          <option value="editor">编辑</option>
                          <option value="admin">管理员</option>
                        </select>
                        <button
                          onClick={() => onRemoveMember(member.id)}
                          className={`p-2.5 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-600'}`}
                          title="移除成员"
                        >
                          <span className="text-lg">🗑️</span>
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // 发布公告功能 - 高级设计
  const renderAnnouncementTab = () => (
    <div className="space-y-6">
      {/* 公告编辑 */}
      <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-100'}`}>
        <h3 className={`font-bold mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <span className="text-xl">📝</span>
          发布公告
        </h3>
        <div className="space-y-5">
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              公告内容
            </label>
            <textarea
              value={currentAnnouncement}
              onChange={(e) => setCurrentAnnouncement(e.target.value)}
              placeholder="输入社群公告内容，支持多行文本..."
              rows={6}
              className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 resize-none ${isDark ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-slate-900' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handlePublishAnnouncement}
              className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${isDark ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'}`}
            >
              📢 发布公告
            </button>
          </div>
        </div>
      </div>

      {/* 历史公告 - 高级设计 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <span className="text-xl">📜</span>
            历史公告
            <span className={`text-sm font-normal px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
              {announcementHistory.length}
            </span>
          </h3>
        </div>
        <div className="space-y-4">
          {announcementHistory.length === 0 ? (
            <div className={`p-8 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-100'}`}>
              <div className={`flex flex-col items-center justify-center py-8 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                <span className="text-4xl mb-3">📭</span>
                <p className="font-medium">暂无公告</p>
                <p className="text-sm mt-1">发布第一条公告通知社群成员</p>
              </div>
            </div>
          ) : (
            announcementHistory.map((ann, index) => (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg ${isDark ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70' : 'bg-white border-gray-100 hover:bg-gray-50/50'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                      <span className="mr-2">🕐</span>
                      {ann.createdAt.toLocaleString('zh-CN')}
                      <span className="mx-2">·</span>
                      <span>{ann.author}</span>
                    </div>
                    {editingAnnouncementId === ann.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={currentAnnouncement}
                          onChange={(e) => setCurrentAnnouncement(e.target.value)}
                          rows={4}
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 resize-none ${isDark ? 'bg-slate-900/50 border-slate-700 text-white focus:border-blue-500/50 focus:bg-slate-900' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEditAnnouncement}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                          >
                            💾 保存
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                          >
                            ❌ 取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={`${isDark ? 'text-slate-300' : 'text-gray-700'} leading-relaxed whitespace-pre-wrap`}>
                        {ann.content}
                      </div>
                    )}
                  </div>
                  {editingAnnouncementId !== ann.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleEditAnnouncement(ann.id, ann.content)}
                        className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-500 hover:text-red-600'}`}
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // 审核管理功能
  const renderModerationTab = () => (
    <ModerationPanel
      isDark={isDark}
      communityId={actualCommunityId}
      isAdmin={isAdmin}
      pendingContent={pendingContent}
      approvedContent={approvedContent}
      rejectedContent={rejectedContent}
      rules={moderationRules}
      onApproveContent={onApproveContent}
      onRejectContent={onRejectContent}
      onAddRule={onAddModerationRule}
      onUpdateRule={onUpdateModerationRule}
      onDeleteRule={onDeleteModerationRule}
    />
  );

  // 社群设置功能 - 高级设计
  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* 基本信息 - 高级设计 */}
      <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-100'}`}>
        <h3 className={`font-bold mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <span className="text-xl">ℹ️</span>
          基本信息
        </h3>
        {editingCommunity ? (
          <div className="space-y-5">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                社群名称
              </label>
              <input
                type="text"
                value={editingCommunity.name || ''}
                onChange={(e) => setEditingCommunity({ ...editingCommunity, name: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-slate-900/50 border-slate-700 text-white focus:border-blue-500/50 focus:bg-slate-900' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                社群简介
              </label>
              <textarea
                value={editingCommunity.description || ''}
                onChange={(e) => setEditingCommunity({ ...editingCommunity, description: e.target.value })}
                rows={3}
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 resize-none ${isDark ? 'bg-slate-900/50 border-slate-700 text-white focus:border-blue-500/50 focus:bg-slate-900' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                社群标签
              </label>
              <input
                type="text"
                value={editingCommunity.tags?.join(', ') || ''}
                onChange={(e) => setEditingCommunity({ ...editingCommunity, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                placeholder="标签，逗号分隔"
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isDark ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-slate-900' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingCommunity(null)}
                className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
              >
                取消
              </button>
              <button
                onClick={handleSaveSettings}
                className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${isDark ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'}`}
              >
                💾 保存
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-sm font-medium mb-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>社群名称</div>
                <div className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{community?.name || '未设置'}</div>
              </div>
              <button
                onClick={() => setEditingCommunity(community)}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`}
              >
                ✏️ 编辑
              </button>
            </div>
            <div className={`border-t pt-4 ${isDark ? 'border-slate-700/50' : 'border-gray-100'}`}>
              <div className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>社群简介</div>
              <div className={`${isDark ? 'text-slate-300' : 'text-gray-700'} leading-relaxed`}>{community?.description || '暂无简介'}</div>
            </div>
            <div className={`border-t pt-4 ${isDark ? 'border-slate-700/50' : 'border-gray-100'}`}>
              <div className={`text-sm font-medium mb-3 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>社群标签</div>
              <div className="flex flex-wrap gap-2">
                {community?.tags && community.tags.length > 0 ? (
                  community.tags.map((tag, index) => (
                    <span key={index} className={`px-3 py-1.5 rounded-full text-sm font-medium ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>暂无标签</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 高级设置 - 高级设计 */}
      <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-100'}`}>
        <h3 className={`font-bold mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <span className="text-xl">⚙️</span>
          高级设置
        </h3>
        <div className="space-y-4">
          {/* 社群可见性 */}
          <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-slate-900/30' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-white'} shadow-sm`}>
                <span className="text-xl">{communityVisibility === 'public' ? '🌐' : '🔒'}</span>
              </div>
              <div>
                <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>社群可见性</div>
                <div className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                  {communityVisibility === 'public' ? '所有人都可以发现和加入' : '仅邀请成员可以加入'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setCommunityVisibility(communityVisibility === 'public' ? 'private' : 'public')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
                communityVisibility === 'public'
                  ? (isDark ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white')
                  : (isDark ? 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white' : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white')
              }`}
            >
              {communityVisibility === 'public' ? '🌐 公开' : '🔒 私密'}
            </button>
          </div>

          {/* 加入审核 */}
          <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-slate-900/30' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-white'} shadow-sm`}>
                <span className="text-xl">{joinApprovalRequired ? '🛡️' : '✅'}</span>
              </div>
              <div>
                <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>加入审核</div>
                <div className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                  {joinApprovalRequired ? '需要管理员审核才能加入' : '无需审核，直接加入'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setJoinApprovalRequired(!joinApprovalRequired)}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
                joinApprovalRequired
                  ? (isDark ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white')
                  : (isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-700')
              }`}
            >
              {joinApprovalRequired ? '🛡️ 已开启' : '✅ 已关闭'}
            </button>
          </div>

          {/* 删除社群 */}
          <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-red-500/20' : 'bg-red-100'} shadow-sm`}>
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <div className={`font-semibold ${isDark ? 'text-red-400' : 'text-red-700'}`}>删除社群</div>
                <div className={`text-sm mt-1 ${isDark ? 'text-red-400/70' : 'text-red-600/70'}`}>永久删除该社群，此操作不可撤销</div>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${isDark ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white' : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'}`}
            >
              🗑️ 删除
            </button>
          </div>
        </div>
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className={`fixed inset-0 z-[70] ${isDark ? 'bg-black/80' : 'bg-black/60'} backdrop-blur-sm flex items-center justify-center p-4`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`${isDark ? 'bg-slate-800 border border-slate-700/50' : 'bg-white border border-gray-100'} rounded-2xl shadow-2xl p-6 max-w-md w-full`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>确认删除社群</h3>
            </div>
            <p className={`mb-6 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              您确定要删除 <span className="font-semibold">{community?.name}</span> 吗？此操作将永久删除所有数据，包括成员、帖子和设置，且无法恢复。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`flex-1 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
              >
                取消
              </button>
              <button
                onClick={() => {
                  toast.success('社群已删除');
                  setShowDeleteConfirm(false);
                  window.history.back();
                }}
                className={`flex-1 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${isDark ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white' : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'}`}
              >
                🗑️ 确认删除
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`w-full ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} min-h-screen`}>
      {/* 顶部导航 - 使用 Lucide 图标 */}
      <div className={`sticky top-0 z-10 ${isDark ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white/90 border-gray-200'} border-b px-6 py-4 backdrop-blur-md`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border border-indigo-500/20' : 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200'}`}>
              <Users size={24} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>社群管理</h1>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {community?.name || '管理您的社群'}
              </p>
            </div>
          </div>
          <div>
            <button
              onClick={() => window.history.back()}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
            >
              <ChevronLeft size={18} />
              <span>返回</span>
            </button>
          </div>
        </div>
      </div>

      {/* 管理功能选项卡 - 使用优化后的 CommunityTabs 组件 */}
      <div className={`sticky top-16 z-10 ${isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white/80 border-gray-200'} border-b backdrop-blur-sm`}>
        <div className="px-6">
          <CommunityTabs
            tabs={[
              { id: 'members', label: '管理成员', icon: Users, count: members.length },
              { id: 'announcement', label: '发布公告', icon: Bell },
              { id: 'moderation', label: '审核管理', icon: Shield },
              { id: 'settings', label: '社群设置', icon: Settings }
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isDark={isDark}
          />
        </div>
      </div>

      {/* 内容区域 */}
      <div className="px-6 py-8">
        {activeTab === 'members' && renderMembersTab()}
        {activeTab === 'announcement' && renderAnnouncementTab()}
        {activeTab === 'moderation' && renderModerationTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>
    </div>
  );
};

export default CommunityAdminPanel;