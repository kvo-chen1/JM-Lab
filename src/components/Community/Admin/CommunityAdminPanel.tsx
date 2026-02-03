import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ModerationPanel, { ModerationContent, ModerationRule } from '../Moderation/ModerationPanel';

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
  communityId,
  community,
  members = [],
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
  // 状态管理
  const [activeTab, setActiveTab] = useState<'members' | 'announcement' | 'moderation' | 'settings'>('members');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<CommunityRole>('member');
  const [currentAnnouncement, setCurrentAnnouncement] = useState(announcement);
  const [editingCommunity, setEditingCommunity] = useState<Partial<Community> | null>(null);
  const [inviteLink, setInviteLink] = useState('');

  // 生成邀请链接
  const generateInviteLink = () => {
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
    
    onUpdateAnnouncement(currentAnnouncement.trim());
    toast.success('公告已发布');
  };

  // 保存社群设置
  const handleSaveSettings = () => {
    if (!editingCommunity) return;
    
    onUpdateCommunity(editingCommunity);
    setEditingCommunity(null);
    toast.success('社群设置已更新');
  };

  // 管理成员功能
  const renderMembersTab = () => (
    <div className="space-y-6">
      {/* 成员统计 */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="text-2xl font-bold mb-1">{members.length}</div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>总成员数</div>
        </div>
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="text-2xl font-bold mb-1">{members.filter(m => m.role === 'admin').length}</div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>管理员</div>
        </div>
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="text-2xl font-bold mb-1">{members.filter(m => m.role === 'member').length}</div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>普通成员</div>
        </div>
      </div>

      {/* 添加成员 */}
      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h3 className="font-medium mb-3">添加成员</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="email"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            placeholder="输入邮箱地址"
            className={`${isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-500'}`}
          />
          <select
            value={newMemberRole}
            onChange={(e) => setNewMemberRole(e.target.value as CommunityRole)}
            className={`${isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-500'}`}
          >
            <option value="member">普通成员</option>
            <option value="editor">编辑</option>
            <option value="admin">管理员</option>
          </select>
          <button
            onClick={handleAddMember}
            className={`${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-3 py-2 rounded-lg font-medium transition-colors`}
          >
            邀请
          </button>
        </div>
      </div>

      {/* 邀请链接 */}
      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h3 className="font-medium mb-3">邀请链接</h3>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inviteLink}
            readOnly
            className={`flex-1 ${isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border px-3 py-2 rounded-lg focus:outline-none`}
          />
          <button
            onClick={generateInviteLink}
            className={`${isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white px-3 py-2 rounded-lg font-medium transition-colors`}
          >
            生成链接
          </button>
        </div>
      </div>

      {/* 成员列表 */}
      <div>
        <h3 className="font-medium mb-3">成员列表</h3>
        <div className="space-y-2">
          {members.length === 0 ? (
            <div className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>暂无成员</p>
            </div>
          ) : (
            members.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-between`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'} flex items-center justify-center`}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{member.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${isDark ? 
                    member.role === 'admin' ? 'bg-purple-600 text-white' : 
                    member.role === 'editor' ? 'bg-blue-600 text-white' : 
                    'bg-green-600 text-white' : 
                    member.role === 'admin' ? 'bg-purple-500 text-white' : 
                    member.role === 'editor' ? 'bg-blue-500 text-white' : 
                    'bg-green-500 text-white'}`}>
                    {member.role === 'admin' ? '管理员' : member.role === 'editor' ? '编辑' : '成员'}
                  </span>
                  <select
                    value={member.role}
                    onChange={(e) => onUpdateMemberRole(member.id, e.target.value as CommunityRole)}
                    className={`${isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border px-2 py-1 rounded-lg text-sm focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-500'}`}
                  >
                    <option value="member">普通成员</option>
                    <option value="editor">编辑</option>
                    <option value="admin">管理员</option>
                  </select>
                  <button
                    onClick={() => onRemoveMember(member.id)}
                    className={`${isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white px-2 py-1 rounded-lg text-sm transition-colors`}
                  >
                    移除
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // 发布公告功能
  const renderAnnouncementTab = () => (
    <div className="space-y-6">
      {/* 公告编辑 */}
      <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h3 className="font-medium mb-4">发布公告</h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              公告内容
            </label>
            <textarea
              value={currentAnnouncement}
              onChange={(e) => setCurrentAnnouncement(e.target.value)}
              placeholder="输入社群公告内容..."
              rows={6}
              className={`w-full ${isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-500'}`}
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handlePublishAnnouncement}
              className={`${isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white px-6 py-3 rounded-lg font-medium transition-colors`}
            >
              发布公告
            </button>
          </div>
        </div>
      </div>

      {/* 历史公告 */}
      <div>
        <h3 className="font-medium mb-3">历史公告</h3>
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          {announcement ? (
            <div className="space-y-2">
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                最后更新: {new Date().toLocaleString()}
              </div>
              <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {announcement}
              </div>
            </div>
          ) : (
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              暂无公告
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // 审核管理功能
  const renderModerationTab = () => (
    <ModerationPanel
      isDark={isDark}
      communityId={communityId}
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

  // 社群设置功能
  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* 基本信息 */}
      <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h3 className="font-medium mb-4">基本信息</h3>
        {editingCommunity ? (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                社群名称
              </label>
              <input
                type="text"
                value={editingCommunity.name || ''}
                onChange={(e) => setEditingCommunity({ ...editingCommunity, name: e.target.value })}
                className={`w-full ${isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-500'}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                社群简介
              </label>
              <textarea
                value={editingCommunity.description || ''}
                onChange={(e) => setEditingCommunity({ ...editingCommunity, description: e.target.value })}
                rows={3}
                className={`w-full ${isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-500'}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                社群标签
              </label>
              <input
                type="text"
                value={editingCommunity.tags?.join(', ') || ''}
                onChange={(e) => setEditingCommunity({ ...editingCommunity, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                placeholder="标签，逗号分隔"
                className={`w-full ${isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-500'}`}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleSaveSettings}
                className={`${isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-2 rounded-lg font-medium transition-colors`}
              >
                保存
              </button>
              <button
                onClick={() => setEditingCommunity(null)}
                className={`${isDark ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} ${isDark ? 'text-white' : 'text-gray-800'} px-4 py-2 rounded-lg font-medium transition-colors`}
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>社群名称</div>
                <div className="font-medium">{community?.name}</div>
              </div>
              <button
                onClick={() => setEditingCommunity(community)}
                className={`${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-3 py-1 rounded-lg text-sm transition-colors`}
              >
                编辑
              </button>
            </div>
            <div className="border-t ${isDark ? 'border-gray-600' : 'border-gray-200'} pt-4">
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>社群简介</div>
              <div className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{community?.description}</div>
            </div>
            <div className="border-t ${isDark ? 'border-gray-600' : 'border-gray-200'} pt-4">
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>社群标签</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {community?.tags.map((tag, index) => (
                  <span key={index} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 高级设置 */}
      <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h3 className="font-medium mb-4">高级设置</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">隐私设置</div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>设置社群可见性</div>
            </div>
            <button
              className={`px-4 py-2 rounded-lg ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
            >
              公开
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">内容审核</div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>设置内容审核规则</div>
            </div>
            <button
              className={`px-4 py-2 rounded-lg ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
            >
              配置
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">删除社群</div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>永久删除该社群</div>
            </div>
            <button
              className={`px-4 py-2 rounded-lg ${isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white transition-colors`}
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`w-full ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} min-h-screen`}>
      {/* 顶部导航 */}
      <div className={`sticky top-0 z-10 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">社群管理</h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {community?.name || '管理您的社群'}
            </p>
          </div>
          <div>
            <button
              onClick={() => window.history.back()}
              className={`${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} px-4 py-2 rounded-lg font-medium transition-colors`}
            >
              返回
            </button>
          </div>
        </div>
      </div>

      {/* 管理功能选项卡 */}
      <div className={`sticky top-16 z-10 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="px-6">
          <div className="flex space-x-1">
            {[
              { id: 'members', label: '管理成员', icon: '👥' },
              { id: 'announcement', label: '发布公告', icon: '📢' },
              { id: 'moderation', label: '审核管理', icon: '🛡️' },
              { id: 'settings', label: '社群设置', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium transition-colors ${activeTab === tab.id ? 
                  isDark ? 'bg-gray-700 text-white border-b-2 border-blue-500' : 'bg-gray-100 text-gray-900 border-b-2 border-blue-500' : 
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
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