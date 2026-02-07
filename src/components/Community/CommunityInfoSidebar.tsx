import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { Community } from '@/services/communityService';
import { TianjinAvatar } from '@/components/TianjinStyleComponents';
import { 
  Users, 
  Activity, 
  Eye, 
  MessageCircle, 
  Bookmark, 
  TrendingUp, 
  Shield, 
  Calendar,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Megaphone,
  Settings,
  MoreHorizontal,
  Crown,
  Hash,
  Link as LinkIcon,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

interface CommunityInfoSidebarProps {
  isDark: boolean;
  community?: Community;
  members?: string[];
  onlineCount?: number;
  isJoined?: boolean;
  onJoinCommunity?: (id: string) => void;
  admins?: string[];
  memberCount?: number;
  weeklyVisitors?: number;
  weeklyInteractions?: number;
  createdDate?: string;
  creator?: string;
  isAdmin?: boolean;
}

// 版规类型
interface Rule {
  id: number;
  title: string;
  content: string;
}

// 热门帖子类型
interface HotPost {
  id: string;
  title: string;
  comments: number;
  upvotes: number;
  thumbnail?: string;
}

// 活跃成员类型
interface ActiveMember {
  id: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  lastActive: string;
}

// 近期活动类型
interface RecentEvent {
  id: string;
  type: 'join' | 'post' | 'announcement' | 'milestone';
  title: string;
  timestamp: string;
  user?: {
    username: string;
    avatar?: string;
  };
}

// 统计卡片组件
const StatCard = ({ 
  icon: Icon, 
  value, 
  label, 
  isDark, 
  trend,
  color = 'blue'
}: { 
  icon: React.ElementType; 
  value: string | number; 
  label: string; 
  isDark: boolean;
  trend?: { value: number; isPositive: boolean };
  color?: 'blue' | 'green' | 'purple' | 'orange';
}) => {
  const colorClasses = {
    blue: isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600',
    green: isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600',
    purple: isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600',
    orange: isDark ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600',
  };

  return (
    <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-white'} border ${isDark ? 'border-gray-700/50' : 'border-gray-100'} hover:shadow-md transition-all duration-300 group`}>
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color]} transition-transform group-hover:scale-110`}>
          <Icon size={16} />
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <div className="mt-2">
        <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</div>
      </div>
    </div>
  );
};

// 可折叠板块组件
const CollapsibleSection = ({
  title,
  icon: Icon,
  children,
  isDark,
  defaultExpanded = false,
  badge
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isDark: boolean;
  defaultExpanded?: boolean;
  badge?: number | string;
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800/30' : 'bg-gray-50/50'} border ${isDark ? 'border-gray-700/30' : 'border-gray-200/50'}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-3 transition-colors ${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-100/50'}`}
      >
        <div className="flex items-center gap-2">
          <Icon size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
          <span className={`font-medium text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {badge !== undefined && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
              {badge}
            </span>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
          </motion.div>
        </div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 管理功能按钮组件
const AdminActionButton = ({
  icon: Icon,
  label,
  onClick,
  isDark,
  color = 'blue'
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  isDark: boolean;
  color?: 'blue' | 'green' | 'orange' | 'purple';
}) => {
  const colorClasses = {
    blue: isDark ? 'hover:bg-blue-500/10 hover:text-blue-400' : 'hover:bg-blue-50 hover:text-blue-600',
    green: isDark ? 'hover:bg-green-500/10 hover:text-green-400' : 'hover:bg-green-50 hover:text-green-600',
    orange: isDark ? 'hover:bg-orange-500/10 hover:text-orange-400' : 'hover:bg-orange-50 hover:text-orange-600',
    purple: isDark ? 'hover:bg-purple-500/10 hover:text-purple-400' : 'hover:bg-purple-50 hover:text-purple-600',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isDark ? 'text-gray-300 bg-gray-800/50' : 'text-gray-700 bg-gray-50'} ${colorClasses[color]} border ${isDark ? 'border-gray-700/50' : 'border-gray-200'} hover:shadow-md`}
    >
      <Icon size={14} />
      <span>{label}</span>
    </button>
  );
};

// 空状态组件
const EmptyState = ({ message, icon: Icon, isDark }: { message: string; icon: React.ElementType; isDark: boolean }) => (
  <div className={`flex flex-col items-center justify-center py-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
    <Icon size={32} className="mb-2 opacity-50" />
    <span className="text-xs">{message}</span>
  </div>
);

export const CommunityInfoSidebar: React.FC<CommunityInfoSidebarProps> = ({
  isDark,
  community,
  members = [],
  onlineCount = 0,
  isJoined = false,
  onJoinCommunity,
  admins = [],
  memberCount = 0,
  weeklyVisitors = 0,
  weeklyInteractions = 0,
  createdDate = '',
  creator = '',
  isAdmin = false,
}) => {
  if (!community) return null;

  const navigate = useNavigate();
  
  // 状态管理
  const [expandedRules, setExpandedRules] = useState<number[]>([]);
  const [creatorInfo, setCreatorInfo] = useState<{ username: string; avatar?: string } | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [activeMembers, setActiveMembers] = useState<ActiveMember[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [hotPosts, setHotPosts] = useState<HotPost[]>([]);

  // 获取创建者信息
  useEffect(() => {
    const fetchCreatorInfo = async () => {
      if (community.creatorId) {
        try {
          const response = await fetch(`/api/users/${community.creatorId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.code === 0 && result.data) {
              setCreatorInfo({
                username: result.data.username || '未知用户',
                avatar: result.data.avatar
              });
            }
          }
        } catch (err) {
          console.error('Failed to fetch creator info:', err);
        }
      }
    };
    
    fetchCreatorInfo();
  }, [community.creatorId]);

  // 模拟获取活跃成员数据
  useEffect(() => {
    // TODO: 替换为真实API调用
    const mockActiveMembers: ActiveMember[] = [
      { id: '1', username: '设计达人', isOnline: true, lastActive: '刚刚' },
      { id: '2', username: '创意小王子', isOnline: true, lastActive: '2分钟前' },
      { id: '3', username: '艺术爱好者', isOnline: false, lastActive: '1小时前' },
    ];
    setActiveMembers(mockActiveMembers);
  }, [community.id]);

  // 模拟获取近期活动
  useEffect(() => {
    // TODO: 替换为真实API调用
    const mockEvents: RecentEvent[] = [
      { id: '1', type: 'join', title: '新成员加入', timestamp: '5分钟前', user: { username: '新用户123' } },
      { id: '2', type: 'post', title: '发布了新帖子', timestamp: '30分钟前', user: { username: '设计达人' } },
      { id: '3', type: 'milestone', title: '社群成员突破100人', timestamp: '2小时前' },
    ];
    setRecentEvents(mockEvents);
  }, [community.id]);

  // 模拟获取热门帖子
  useEffect(() => {
    // TODO: 替换为真实API调用
    const mockHotPosts: HotPost[] = [
      { id: '1', title: '分享我的设计作品集，欢迎大家点评', comments: 23, upvotes: 156 },
      { id: '2', title: '2024年UI设计趋势预测', comments: 45, upvotes: 234 },
      { id: '3', title: '如何提升设计效率？我的工具分享', comments: 18, upvotes: 89 },
    ];
    setHotPosts(mockHotPosts);
  }, [community.id]);

  // 处理加入社群
  const handleJoin = async () => {
    if (!onJoinCommunity || isJoining) return;
    setIsJoining(true);
    try {
      await onJoinCommunity(community.id);
      toast.success(isJoined ? '已退出社群' : '成功加入社群！');
    } catch (error) {
      toast.error('操作失败，请重试');
    } finally {
      setIsJoining(false);
    }
  };

  // 处理用户点击
  const handleUserClick = (username: string) => {
    navigate(`/author/${encodeURIComponent(username)}`);
  };

  // 使用社群真实数据
  const communityTags = community.tags || [];
  const communityBookmarks = community.bookmarks || [];
  const communityGuidelines = community.guidelines || [];

  // 切换版规展开/折叠状态
  const toggleRuleExpansion = (id: number) => {
    setExpandedRules(prev => 
      prev.includes(id) 
        ? prev.filter(ruleId => ruleId !== id) 
        : [...prev, id]
    );
  };

  // 模拟版规数据
  const rules: Rule[] = communityGuidelines.length > 0 ? 
    communityGuidelines.map((content, index) => ({
      id: index + 1,
      title: `规则 ${index + 1}`,
      content
    })) : [
    { id: 1, title: '文明交流', content: '请遵守基本的网络礼仪，尊重他人，不得发布攻击性、歧视性或违法内容。' },
    { id: 2, title: '内容相关', content: '请发布与本社区主题相关的内容，无关内容可能会被管理员移除。' },
    { id: 3, title: '原创保护', content: '鼓励原创内容，转载请注明出处，尊重知识产权。' },
    { id: 4, title: '禁止广告', content: '未经允许，请勿在社群内发布商业广告或推广信息。' }
  ];

  // 获取事件图标
  const getEventIcon = (type: RecentEvent['type']) => {
    switch (type) {
      case 'join': return UserPlus;
      case 'post': return MessageCircle;
      case 'announcement': return Megaphone;
      case 'milestone': return Crown;
      default: return Activity;
    }
  };

  // 获取事件颜色
  const getEventColor = (type: RecentEvent['type']) => {
    switch (type) {
      case 'join': return 'text-green-500 bg-green-500/10';
      case 'post': return 'text-blue-500 bg-blue-500/10';
      case 'announcement': return 'text-orange-500 bg-orange-500/10';
      case 'milestone': return 'text-purple-500 bg-purple-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className={`flex-shrink-0 flex flex-col h-full ${isDark ? 'bg-gray-900' : 'bg-gray-50'} lg:w-80 xl:w-96 md:sticky md:top-0 md:h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent`}>
      {/* 社群头部卡片 */}
      <div className={`relative p-5 ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20 ${isDark ? 'bg-blue-500' : 'bg-blue-400'} blur-3xl`} />
          <div className={`absolute -bottom-20 -left-20 w-40 h-40 rounded-full opacity-20 ${isDark ? 'bg-purple-500' : 'bg-purple-400'} blur-3xl`} />
        </div>

        <div className="relative">
          {/* 社群头像和名称 */}
          <div className="flex items-start gap-4">
            <div className="relative">
              <img
                src={community.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=random`}
                alt={community.name}
                className="w-16 h-16 rounded-2xl object-cover shadow-lg ring-2 ring-white/20"
              />
              {community.isSpecial && (
                <div className="absolute -top-1 -right-1 p-1 bg-yellow-500 rounded-full">
                  <Crown size={10} className="text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className={`text-lg font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {community.name}
              </h2>
              <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {community.description}
              </p>
            </div>
          </div>

          {/* 加入按钮 */}
          <button
            onClick={handleJoin}
            disabled={isJoining}
            className={`w-full mt-4 py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              isJoined
                ? isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : isDark
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/25'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25'
            } ${isJoining ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isJoining ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Activity size={16} />
              </motion.div>
            ) : isJoined ? (
              <>
                <CheckCircle2 size={16} />
                <span>已加入</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>加入社群</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 创建者信息 */}
      <div className="p-4">
        <div 
          onClick={() => handleUserClick(creatorInfo?.username || creator || '@社区管理员')}
          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${isDark ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-white hover:bg-gray-50'} border ${isDark ? 'border-gray-700/50' : 'border-gray-200'} hover:shadow-md`}
        >
          <div className="relative">
            <TianjinAvatar 
              size="sm" 
              src={creatorInfo?.avatar || ''} 
              alt="创建者" 
              className="w-10 h-10"
            />
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${isDark ? 'border-gray-800 bg-green-500' : 'border-white bg-green-500'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {creatorInfo?.username || creator || '社区管理员'}
            </div>
            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {createdDate || community.createdAt 
                ? `创建于 ${new Date(community.createdAt || '').toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}`
                : '社群创建者'
              }
            </div>
          </div>
          <Crown size={16} className={isDark ? 'text-yellow-500' : 'text-yellow-600'} />
        </div>
      </div>

      {/* 统计数据 */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Users}
            value={memberCount > 0 ? memberCount : community.memberCount || 0}
            label="成员"
            isDark={isDark}
            color="blue"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            icon={Activity}
            value={onlineCount}
            label="在线"
            isDark={isDark}
            color="green"
          />
          <StatCard
            icon={Eye}
            value={weeklyVisitors > 0 ? weeklyVisitors : '0'}
            label="本周访客"
            isDark={isDark}
            color="purple"
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            icon={MessageCircle}
            value={weeklyInteractions > 0 ? weeklyInteractions : '0'}
            label="本周互动"
            isDark={isDark}
            color="orange"
            trend={{ value: 23, isPositive: true }}
          />
        </div>
      </div>

      {/* 社群标签 */}
      {communityTags.length > 0 && (
        <div className="px-4 pb-4">
          <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800/30' : 'bg-gray-50'} border ${isDark ? 'border-gray-700/30' : 'border-gray-200/50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Hash size={14} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
              <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>社群标签</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {communityTags.map((tag, index) => (
                <span
                  key={index}
                  onClick={() => navigate(`/community/discovery?tag=${encodeURIComponent(tag)}`)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 ${
                    isDark
                      ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } border ${isDark ? 'border-gray-600/30' : 'border-gray-200'}`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 可折叠功能模块 */}
      <div className="px-4 pb-4 space-y-3">
        {/* 社区书签 */}
        <CollapsibleSection
          title="社区书签"
          icon={Bookmark}
          isDark={isDark}
          badge={communityBookmarks.length}
        >
          {communityBookmarks.length === 0 ? (
            <EmptyState message="暂无书签" icon={Bookmark} isDark={isDark} />
          ) : (
            <div className="space-y-1.5">
              {communityBookmarks.map((bookmark) => (
                <button
                  key={bookmark.id}
                  onClick={() => window.open(bookmark.url, '_blank')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    isDark
                      ? 'text-gray-300 hover:bg-gray-700/50'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <LinkIcon size={14} />
                  <span className="truncate">{bookmark.name}</span>
                </button>
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* 热门帖子 */}
        <CollapsibleSection
          title="热门帖子"
          icon={TrendingUp}
          isDark={isDark}
          defaultExpanded={true}
          badge={hotPosts.length}
        >
          {hotPosts.length === 0 ? (
            <EmptyState message="暂无热门帖子" icon={TrendingUp} isDark={isDark} />
          ) : (
            <div className="space-y-2">
              {hotPosts.map((post, index) => (
                <div
                  key={post.id}
                  onClick={() => navigate(`/community/${community.id}/post/${post.id}`)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    isDark
                      ? 'bg-gray-800/30 hover:bg-gray-800/50'
                      : 'bg-white hover:bg-gray-50'
                  } border ${isDark ? 'border-gray-700/30' : 'border-gray-200/50'}`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`text-xs font-bold ${index < 3 ? (isDark ? 'text-yellow-500' : 'text-yellow-600') : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>
                      #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium line-clamp-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {post.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          <MessageCircle size={10} />
                          {post.comments}
                        </span>
                        <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          <TrendingUp size={10} />
                          {post.upvotes}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* 社群版规 */}
        <CollapsibleSection
          title={`${community.name} 版规`}
          icon={Shield}
          isDark={isDark}
          badge={rules.length}
        >
          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`rounded-lg overflow-hidden ${isDark ? 'bg-gray-800/30' : 'bg-white'} border ${isDark ? 'border-gray-700/30' : 'border-gray-200/50'}`}
              >
                <button
                  onClick={() => toggleRuleExpansion(rule.id)}
                  className="w-full px-3 py-2 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                      {rule.id}
                    </span>
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                      {rule.title}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedRules.includes(rule.id) ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={14} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {expandedRules.includes(rule.id) && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className={`px-3 pb-3 text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {rule.content}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* 活跃成员 */}
        <CollapsibleSection
          title="活跃成员"
          icon={Users}
          isDark={isDark}
          badge={activeMembers.length}
        >
          {activeMembers.length === 0 ? (
            <EmptyState message="暂无活跃成员" icon={Users} isDark={isDark} />
          ) : (
            <div className="space-y-2">
              {activeMembers.map((member) => (
                <div
                  key={member.id}
                  onClick={() => handleUserClick(member.username)}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    isDark
                      ? 'hover:bg-gray-700/30'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="relative">
                    <TianjinAvatar
                      size="sm"
                      src={member.avatar || ''}
                      alt={member.username}
                      className="w-8 h-8"
                    />
                    {member.isOnline && (
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${isDark ? 'border-gray-800 bg-green-500' : 'border-white bg-green-500'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                      {member.username}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {member.isOnline ? '在线' : member.lastActive}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* 近期活动 */}
        <CollapsibleSection
          title="近期活动"
          icon={Calendar}
          isDark={isDark}
          badge={recentEvents.length}
        >
          {recentEvents.length === 0 ? (
            <EmptyState message="暂无近期活动" icon={Calendar} isDark={isDark} />
          ) : (
            <div className="space-y-2">
              {recentEvents.map((event) => {
                const EventIcon = getEventIcon(event.type);
                return (
                  <div
                    key={event.id}
                    className={`flex items-start gap-3 p-2 rounded-lg ${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-100'} transition-colors`}
                  >
                    <div className={`p-1.5 rounded-lg ${getEventColor(event.type)}`}>
                      <EventIcon size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {event.title}
                      </p>
                      {event.user && (
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {event.user.username}
                        </p>
                      )}
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-0.5`}>
                        {event.timestamp}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CollapsibleSection>
      </div>

      {/* 管理员功能区 */}
      {isAdmin && (
        <div className="px-4 pb-6">
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} border ${isDark ? 'border-gray-700/50' : 'border-gray-200'} shadow-lg`}>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
              <span className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>管理功能</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <AdminActionButton
                icon={Users}
                label="成员管理"
                onClick={() => navigate(`/community/${community.id}/admin?tab=members`)}
                isDark={isDark}
                color="blue"
              />
              <AdminActionButton
                icon={Megaphone}
                label="发布公告"
                onClick={() => navigate(`/community/${community.id}/admin?tab=announcement`)}
                isDark={isDark}
                color="green"
              />
              <AdminActionButton
                icon={Shield}
                label="审核管理"
                onClick={() => navigate(`/community/${community.id}/admin?tab=moderation`)}
                isDark={isDark}
                color="orange"
              />
              <AdminActionButton
                icon={Settings}
                label="社群设置"
                onClick={() => navigate(`/community/${community.id}/admin?tab=settings`)}
                isDark={isDark}
                color="purple"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityInfoSidebar;
