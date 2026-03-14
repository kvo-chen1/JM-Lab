import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import type { OutlineTemplate } from './types';
import {
  Users,
  Share2,
  Link,
  Copy,
  Check,
  X,
  Mail,
  MessageSquare,
  Clock,
  UserPlus,
  Shield,
  Eye,
  Edit3,
  Send,
} from 'lucide-react';

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'active' | 'pending' | 'offline';
  lastActive?: number;
  color: string;
}

interface Comment {
  id: string;
  sectionId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: number;
  resolved: boolean;
  replies: Comment[];
}

interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  timestamp: number;
}

interface OutlineCollaborationProps {
  outline: OutlineTemplate;
  currentUser: Collaborator;
  onInvite: (email: string, role: string) => void;
  onUpdateCollaborator: (userId: string, updates: Partial<Collaborator>) => void;
  onRemoveCollaborator: (userId: string) => void;
  onAddComment: (sectionId: string, content: string) => void;
  onResolveComment: (commentId: string) => void;
  onClose: () => void;
}

const roleLabels: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  owner: {
    label: '所有者',
    icon: <Shield className="w-4 h-4" />,
    description: '完全控制权限，可以管理协作者',
  },
  editor: {
    label: '编辑者',
    icon: <Edit3 className="w-4 h-4" />,
    description: '可以编辑大纲内容和添加评论',
  },
  viewer: {
    label: '查看者',
    icon: <Eye className="w-4 h-4" />,
    description: '只能查看，不能编辑',
  },
};

const mockCollaborators: Collaborator[] = [
  {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
    role: 'owner',
    status: 'active',
    lastActive: Date.now(),
    color: '#3b82f6',
  },
  {
    id: '2',
    name: '李四',
    email: 'lisi@example.com',
    role: 'editor',
    status: 'active',
    lastActive: Date.now() - 5 * 60 * 1000,
    color: '#10b981',
  },
  {
    id: '3',
    name: '王五',
    email: 'wangwu@example.com',
    role: 'viewer',
    status: 'offline',
    lastActive: Date.now() - 2 * 60 * 60 * 1000,
    color: '#f59e0b',
  },
];

const mockComments: Comment[] = [
  {
    id: '1',
    sectionId: '1',
    userId: '2',
    userName: '李四',
    content: '这个章节的描述可以更详细一些，建议补充具体的实施步骤。',
    createdAt: Date.now() - 30 * 60 * 1000,
    resolved: false,
    replies: [],
  },
  {
    id: '2',
    sectionId: '2',
    userId: '3',
    userName: '王五',
    content: '数据需要更新到最新季度的。',
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    resolved: true,
    replies: [
      {
        id: '2-1',
        sectionId: '2',
        userId: '1',
        userName: '张三',
        content: '已更新，请查看。',
        createdAt: Date.now() - 1 * 60 * 60 * 1000,
        resolved: true,
        replies: [],
      },
    ],
  },
];

const mockActivities: Activity[] = [
  {
    id: '1',
    userId: '2',
    userName: '李四',
    action: '编辑了',
    target: '执行摘要',
    timestamp: Date.now() - 5 * 60 * 1000,
  },
  {
    id: '2',
    userId: '3',
    userName: '王五',
    action: '添加了评论到',
    target: '市场分析',
    timestamp: Date.now() - 30 * 60 * 1000,
  },
  {
    id: '3',
    userId: '1',
    userName: '张三',
    action: '创建了大纲',
    target: '',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
  },
];

export const OutlineCollaboration: React.FC<OutlineCollaborationProps> = ({
  outline,
  currentUser,
  onInvite,
  onUpdateCollaborator,
  onRemoveCollaborator,
  onAddComment,
  onResolveComment,
  onClose,
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'share' | 'comments' | 'activity'>('share');
  const [collaborators, setCollaborators] = useState<Collaborator[]>(mockCollaborators);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [activities] = useState<Activity[]>(mockActivities);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [copiedLink, setCopiedLink] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const handleCopyLink = () => {
    const shareLink = `${window.location.origin}/outline/${outline.id}?share=true`;
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    toast.success('链接已复制到剪贴板');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleInvite = () => {
    if (!inviteEmail) {
      toast.error('请输入邮箱地址');
      return;
    }
    onInvite(inviteEmail, inviteRole);
    toast.success(`已邀请 ${inviteEmail}`);
    setInviteEmail('');
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedSection) return;
    onAddComment(selectedSection, newComment);
    toast.success('评论已添加');
    setNewComment('');
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60 * 1000) return '刚刚';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  const renderShareTab = () => (
    <div className="space-y-6">
      {/* 分享链接 */}
      <div>
        <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          分享链接
        </h4>
        <div className="flex gap-2">
          <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border ${
            isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <Link className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <span className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {`${window.location.origin}/outline/${outline.id}?share=true`}
            </span>
          </div>
          <button
            onClick={handleCopyLink}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              copiedLink
                ? 'bg-green-600 text-white'
                : isDark
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedLink ? '已复制' : '复制'}
          </button>
        </div>
      </div>

      {/* 邀请协作者 */}
      <div>
        <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          邀请协作者
        </h4>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="输入邮箱地址..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm border ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className={`px-3 py-2 rounded-lg text-sm border ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <option value="editor">编辑者</option>
            <option value="viewer">查看者</option>
          </select>
          <button
            onClick={handleInvite}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            邀请
          </button>
        </div>
      </div>

      {/* 协作者列表 */}
      <div>
        <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          协作者 ({collaborators.length})
        </h4>
        <div className="space-y-2">
          {collaborators.map((collaborator) => (
            <div
              key={collaborator.id}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                isDark ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: collaborator.color }}
              >
                {collaborator.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {collaborator.name}
                  </span>
                  {collaborator.id === currentUser.id && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                    }`}>
                      我
                    </span>
                  )}
                </div>
                <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {collaborator.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                  isDark ? 'bg-gray-600 text-gray-300' : 'bg-white text-gray-600'
                }`}>
                  {roleLabels[collaborator.role].icon}
                  {roleLabels[collaborator.role].label}
                </span>
                <div className={`w-2 h-2 rounded-full ${
                  collaborator.status === 'active'
                    ? 'bg-green-500'
                    : collaborator.status === 'pending'
                    ? 'bg-amber-500'
                    : 'bg-gray-400'
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCommentsTab = () => (
    <div className="space-y-4">
      {/* 添加评论 */}
      <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        <select
          value={selectedSection || ''}
          onChange={(e) => setSelectedSection(e.target.value || null)}
          className={`w-full mb-3 px-3 py-2 rounded-lg text-sm border ${
            isDark
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          <option value="">选择章节...</option>
          {outline.sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.name}
            </option>
          ))}
        </select>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="添加评论..."
          rows={3}
          className={`w-full px-3 py-2 rounded-lg text-sm border resize-none ${
            isDark
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
              : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
          }`}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim() || !selectedSection}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            发送
          </button>
        </div>
      </div>

      {/* 评论列表 */}
      <div className="space-y-3 max-h-80 overflow-auto">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>暂无评论</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-4 rounded-lg border ${
                comment.resolved
                  ? isDark
                    ? 'bg-gray-800/50 border-gray-700 opacity-60'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                  : isDark
                  ? 'bg-gray-700/50 border-gray-600'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                  {comment.userName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {comment.userName}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {formatTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <button
                      onClick={() => onResolveComment(comment.id)}
                      className={`text-xs flex items-center gap-1 transition-colors ${
                        comment.resolved
                          ? 'text-green-500'
                          : isDark
                          ? 'text-gray-400 hover:text-gray-300'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      {comment.resolved ? '已解决' : '标记为已解决'}
                    </button>
                    <button className={`text-xs flex items-center gap-1 transition-colors ${
                      isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}>
                      回复
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderActivityTab = () => (
    <div className="space-y-3 max-h-96 overflow-auto">
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <Clock className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>暂无活动记录</p>
        </div>
      ) : (
        activities.map((activity) => (
          <div
            key={activity.id}
            className={`flex items-start gap-3 p-3 rounded-lg ${
              isDark ? 'bg-gray-700/30' : 'bg-gray-50'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
              {activity.userName.charAt(0)}
            </div>
            <div className="flex-1">
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="font-medium">{activity.userName}</span>
                {' '}{activity.action}{' '}
                {activity.target && (
                  <span className="font-medium">{activity.target}</span>
                )}
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {formatTime(activity.timestamp)}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className={`fixed right-0 top-0 bottom-0 w-96 border-l shadow-2xl z-[150] ${
        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      {/* 头部 */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>协作</h3>
        </div>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tab 切换 */}
      <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        {[
          { id: 'share', label: '分享', icon: <Share2 className="w-4 h-4" /> },
          { id: 'comments', label: '评论', icon: <MessageSquare className="w-4 h-4" />, badge: comments.filter(c => !c.resolved).length },
          { id: 'activity', label: '活动', icon: <Clock className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? isDark
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-blue-600 border-b-2 border-blue-600'
                : isDark
                ? 'text-gray-400 hover:text-gray-300'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge ? (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
              }`}>
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="p-4 overflow-auto" style={{ height: 'calc(100vh - 120px)' }}>
        {activeTab === 'share' && renderShareTab()}
        {activeTab === 'comments' && renderCommentsTab()}
        {activeTab === 'activity' && renderActivityTab()}
      </div>
    </motion.div>
  );
};

export default OutlineCollaboration;
