import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  CheckCircle,
  XCircle,
  Trash2,
  UserPlus,
  ChevronLeft,
  BarChart3,
  Clock
} from 'lucide-react';
import ModerationPanel, { ModerationContent, ModerationRule } from '../Moderation/ModerationPanel';
import { supabase } from '@/lib/supabaseClient';

// 导入三栏布局组件
import ThreeColumnLayout from './ThreeColumnLayout';
import AdminSidebar from './AdminSidebar';
import RightSidebar from './RightSidebar';
import DashboardView from './DashboardView';

// 导入优化后的组件
import StatCard from '../StatCard';
import RoleBadge from '../RoleBadge';

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
  onAddMember?: (email: string, role: CommunityRole) => void;
  onRemoveMember?: (memberId: string) => void;
  onUpdateMemberRole?: (memberId: string, role: CommunityRole) => void;
  onUpdateAnnouncement?: (content: string) => void;
  onUpdateCommunity?: (community: Partial<Community>) => void;
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

  // 状态管理 - 默认显示概览页
  const [activeTab, setActiveTab] = useState('dashboard');
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

  // 社群创建者ID
  const [creatorId, setCreatorId] = useState<string>('');

  // 获取社区成员数据
  useEffect(() => {
    const fetchMembers = async () => {
      if (!actualCommunityId) return;

      setIsLoadingMembers(true);
      try {
        // 先获取社群信息（包括创建者）
        const { data: communityData, error: communityError } = await supabase
          .from('communities')
          .select('creator_id')
          .eq('id', actualCommunityId)
          .single();
        
        if (communityError) {
          console.error('Failed to fetch community:', communityError);
        } else if (communityData) {
          setCreatorId(communityData.creator_id);
        }

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
            const isCreator = m.user_id === communityData?.creator_id;
            return {
              id: m.user_id,
              email: user?.email || '',
              name: user?.username || '未知用户',
              role: isCreator ? 'admin' : ((m.role as CommunityRole) || 'member'),
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
    
    navigator.clipboard.writeText(link).then(() => {
      toast.success('邀请链接已复制到剪贴板');
    }).catch(err => {
      console.error('复制失败:', err);
      toast.error('复制失败，请手动复制链接');
    });
  };

  // 添加成员到数据库
  const handleAddMemberToDB = async (email: string, role: CommunityRole) => {
    try {
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, username, email')
        .eq('email', email)
        .limit(1);
      
      if (userError || !users || users.length === 0) {
        toast.error('未找到该邮箱对应的用户');
        return false;
      }
      
      const user = users[0];
      
      const { data: existingMember } = await supabase
        .from('community_members')
        .select('*')
        .eq('community_id', actualCommunityId)
        .eq('user_id', user.id)
        .single();
      
      if (existingMember) {
        toast.error('该用户已经是社群成员');
        return false;
      }
      
      const { error: insertError } = await supabase
        .from('community_members')
        .insert({
          community_id: actualCommunityId,
          user_id: user.id,
          role: role,
          joined_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Failed to add member:', insertError);
        toast.error('添加成员失败');
        return false;
      }
      
      const newMember: CommunityMember = {
        id: user.id,
        email: user.email || '',
        name: user.username || '未知用户',
        role: role,
        joinedAt: new Date()
      };
      setMembers(prev => [...prev, newMember]);
      toast.success('成员已添加');
      return true;
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('添加成员失败');
      return false;
    }
  };

  // 筛选成员
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(memberSearchQuery.toLowerCase());
    const matchesRole = memberRoleFilter === 'all' || member.role === memberRoleFilter;
    return matchesSearch && matchesRole;
  });

  // 从数据库移除成员
  const handleRemoveMemberFromDB = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', actualCommunityId)
        .eq('user_id', memberId);
      
      if (error) {
        console.error('Failed to remove member:', error);
        toast.error('移除成员失败');
        return false;
      }
      
      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast.success('成员已移除');
      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('移除成员失败');
      return false;
    }
  };

  // 更新成员角色
  const handleUpdateMemberRoleInDB = async (memberId: string, role: CommunityRole) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ role })
        .eq('community_id', actualCommunityId)
        .eq('user_id', memberId);
      
      if (error) {
        console.error('Failed to update member role:', error);
        toast.error('更新角色失败');
        return false;
      }
      
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, role } : m
      ));
      toast.success('角色已更新');
      return true;
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('更新角色失败');
      return false;
    }
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
    onUpdateAnnouncement?.(currentAnnouncement.trim());
    setCurrentAnnouncement('');
    toast.success('公告已发布');
  };

  // 保存社群设置
  const handleSaveSettings = () => {
    if (!editingCommunity) return;
    
    onUpdateCommunity?.(editingCommunity);
    setEditingCommunity(null);
    toast.success('社群设置已更新');
  };

  // 渲染成员管理内容
  const renderMembersContent = () => (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          成员管理
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${isDark ? 'text-slate-400' : 'text-gray-500'}`}
        >
          管理社群成员、权限和邀请
        </motion.p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Users} 
          value={isLoadingMembers ? '...' : members.length} 
          label="总成员" 
          isDark={isDark} 
          color="primary"
          delay={0}
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

      {/* 添加成员 */}
      <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-100'}`}>
        <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <UserPlus size={20} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
          添加成员
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Mail size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
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
            onClick={async () => {
              if (!newMemberEmail.trim()) {
                toast.warning('请输入邮箱地址');
                return;
              }
              const success = await handleAddMemberToDB(newMemberEmail.trim(), newMemberRole);
              if (success) {
                setNewMemberEmail('');
                setNewMemberRole('member');
              }
            }}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`}
          >
            邀请
          </button>
        </div>
      </div>

      {/* 邀请链接 */}
      <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-100'}`}>
        <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <LinkIcon size={20} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
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

      {/* 成员搜索和筛选 */}
      <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-100'}`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
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
        </div>
      </div>

      {/* 成员列表 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Users size={20} />
            成员列表
            <span className={`text-sm font-normal px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
              {filteredMembers.length}
            </span>
          </h3>
        </div>
        <div className={`rounded-2xl border overflow-hidden shadow-sm ${isDark ? 'border-slate-700/50' : 'border-gray-200'}`}>
          {filteredMembers.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-16 ${isDark ? 'bg-slate-800/30' : 'bg-white'}`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                <Users size={32} className={isDark ? 'text-slate-500' : 'text-gray-400'} />
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
                  className={`p-5 flex items-center gap-4 transition-all duration-200 group ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-blue-50/30'}`}
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold shadow-md flex-shrink-0 ${isDark ? 'bg-gradient-to-br from-slate-600 to-slate-700 text-slate-200' : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600'}`}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{member.name}</div>
                    <div className={`text-sm truncate ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{member.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RoleBadge role={member.role} isDark={isDark} size="sm" isCreator={member.id === creatorId} />
                    {member.id !== creatorId && (
                      <>
                        <select
                          value={member.role}
                          onChange={async (e) => {
                            const newRole = e.target.value as CommunityRole;
                            await handleUpdateMemberRoleInDB(member.id, newRole);
                          }}
                          className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${isDark ? 'bg-slate-700 border-slate-600 text-white hover:border-slate-500' : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        >
                          <option value="member">普通成员</option>
                          <option value="editor">编辑</option>
                          <option value="admin">管理员</option>
                        </select>
                        <button
                          onClick={async () => {
                            if (window.confirm(`确定要移除成员 ${member.name} 吗？`)) {
                              await handleRemoveMemberFromDB(member.id);
                            }
                          }}
                          className={`p-2.5 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-600'}`}
                          title="移除成员"
                        >
                          <Trash2 size={18} />
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

  // 渲染公告发布内容
  const renderAnnouncementContent = () => (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          发布公告
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${isDark ? 'text-slate-400' : 'text-gray-500'}`}
        >
          向社群成员发送重要通知和更新
        </motion.p>
      </div>

      {/* 公告编辑 */}
      <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-100'}`}>
        <h3 className={`font-bold mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Bell size={20} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
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
              <Bell size={18} className="inline mr-2" />
              发布公告
            </button>
          </div>
        </div>
      </div>

      {/* 历史公告 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <CheckCircle size={20} />
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
                <Bell size={32} className="mb-3 opacity-50" />
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
                      <Clock size={14} className="inline mr-1" />
                      {ann.createdAt.toLocaleString('zh-CN')}
                      <span className="mx-2">·</span>
                      <span>{ann.author}</span>
                    </div>
                    <div className={`${isDark ? 'text-slate-300' : 'text-gray-700'} leading-relaxed whitespace-pre-wrap`}>
                      {ann.content}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('确定要删除这条公告吗？')) {
                        setAnnouncementHistory(prev => prev.filter(a => a.id !== ann.id));
                        toast.success('公告已删除');
                      }
                    }}
                    className={`p-2 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100 ${isDark ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-500 hover:text-red-600'}`}
                    title="删除"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // 渲染社群设置内容
  const renderSettingsContent = () => (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          社群设置
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${isDark ? 'text-slate-400' : 'text-gray-500'}`}
        >
          配置社群的基本信息和权限设置
        </motion.p>
      </div>

      {/* 基本信息 */}
      <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-100'}`}>
        <h3 className={`font-bold mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Settings size={20} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
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
                <CheckCircle size={18} className="inline mr-2" />
                保存
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
                <Edit3 size={18} className="inline mr-2" />
                编辑
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

      {/* 高级设置 */}
      <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-100'}`}>
        <h3 className={`font-bold mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Shield size={20} className={isDark ? 'text-violet-400' : 'text-violet-600'} />
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
              <Trash2 size={18} className="inline mr-2" />
              删除
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
                <Trash2 size={18} className="inline mr-2" />
                确认删除
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );

  // 渲染主内容区
  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            isDark={isDark}
            memberCount={members.length}
            adminCount={members.filter(m => m.role === 'admin').length}
            editorCount={members.filter(m => m.role === 'editor').length}
            regularMemberCount={members.filter(m => m.role === 'member').length}
            pendingCount={pendingContent.length}
            announcementCount={announcementHistory.length}
            onNavigate={setActiveTab}
            activities={activities.map(a => ({
              id: a.id,
              user: a.user,
              action: a.content,
              time: a.time,
              type: a.type === 'join' ? 'join' : 
                   a.type === 'post' ? 'post' : 
                   a.type === 'announcement' ? 'announcement' : 'role'
            }))}
          />
        );
      case 'members':
        return renderMembersContent();
      case 'announcement':
        return renderAnnouncementContent();
      case 'moderation':
        return (
          <div className="space-y-6">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                审核管理
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`${isDark ? 'text-slate-400' : 'text-gray-500'}`}
              >
                审核社群内容和成员发布
              </motion.p>
            </div>
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
          </div>
        );
      case 'settings':
        return renderSettingsContent();
      case 'analytics':
        return (
          <div className="space-y-6">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                数据分析
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`${isDark ? 'text-slate-400' : 'text-gray-500'}`}
              >
                查看社群的活跃数据和增长趋势
              </motion.p>
            </div>
            <div className={`p-12 rounded-2xl border text-center ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-100'}`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                <BarChart3 size={40} className={isDark ? 'text-slate-500' : 'text-gray-400'} />
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>数据分析功能开发中</h3>
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>敬请期待更多功能</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // 活动数据状态
  const [activities, setActivities] = useState<Array<{id: string; type: 'join' | 'post' | 'announcement' | 'role_change'; user: string; content: string; time: string}>>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // 获取社群活动数据
  useEffect(() => {
    const fetchActivities = async () => {
      if (!actualCommunityId) return;

      setIsLoadingActivities(true);
      try {
        // 获取社群成员加入记录
        const { data: membersData, error: membersError } = await supabase
          .from('community_members')
          .select('user_id, joined_at')
          .eq('community_id', actualCommunityId)
          .order('joined_at', { ascending: false })
          .limit(10);

        if (membersError) {
          console.error('Failed to fetch member activities:', membersError);
        }

        // 获取社群帖子发布记录
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('author_id, title, created_at')
          .eq('community_id', actualCommunityId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (postsError) {
          console.error('Failed to fetch post activities:', postsError);
        }

        // 获取用户信息
        const userIds = [
          ...(membersData?.map(m => m.user_id) || []),
          ...(postsData?.map(p => p.author_id) || [])
        ];
        const uniqueUserIds = [...new Set(userIds)];

        let usersMap = new Map();
        if (uniqueUserIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, username')
            .in('id', uniqueUserIds);
          
          usersMap = new Map(usersData?.map(u => [u.id, u.username]) || []);
        }

        // 合并活动数据
        const allActivities: Array<{id: string; type: 'join' | 'post' | 'announcement' | 'role_change'; user: string; content: string; time: Date}> = [];

        // 添加成员加入活动
        membersData?.forEach(m => {
          allActivities.push({
            id: `join-${m.user_id}-${m.joined_at}`,
            type: 'join',
            user: usersMap.get(m.user_id) || '未知用户',
            content: '加入了社群',
            time: new Date(m.joined_at)
          });
        });

        // 添加帖子发布活动
        postsData?.forEach(p => {
          allActivities.push({
            id: `post-${p.author_id}-${p.created_at}`,
            type: 'post',
            user: usersMap.get(p.author_id) || '未知用户',
            content: `发布了新作品《${p.title}》`,
            time: new Date(p.created_at)
          });
        });

        // 按时间排序并格式化
        const sortedActivities = allActivities
          .sort((a, b) => b.time.getTime() - a.time.getTime())
          .slice(0, 10)
          .map(activity => ({
            ...activity,
            time: formatTimeAgo(activity.time)
          }));

        setActivities(sortedActivities);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    fetchActivities();
  }, [actualCommunityId]);

  // 格式化时间为"x分钟/小时/天前"
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 30) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 在线成员数据（基于真实成员数据）
  const onlineMembers = members.slice(0, 5).map(m => ({
    id: m.id,
    name: m.name,
    role: m.role
  }));

  return (
    <ThreeColumnLayout
      isDark={isDark}
      leftSidebar={
        <AdminSidebar
          isDark={isDark}
          communityName={community?.name || '社群管理'}
          communityCover={community?.cover}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingCount={pendingContent.length}
          memberCount={members.length}
        />
      }
      mainContent={
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderMainContent()}
          </motion.div>
        </AnimatePresence>
      }
      rightSidebar={
        <RightSidebar
          isDark={isDark}
          communityName={community?.name || ''}
          communityCover={community?.cover}
          memberCount={members.length}
          onlineCount={onlineMembers.length}
          activities={activities}
          onlineMembers={onlineMembers}
          onAddMember={() => setActiveTab('members')}
          onGenerateInvite={generateInviteLink}
        />
      }
    />
  );
};

export default CommunityAdminPanel;
