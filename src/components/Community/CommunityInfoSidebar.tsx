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
  const [realMemberCount, setRealMemberCount] = useState<number>(memberCount || community?.memberCount || 0);
  const [communityStats, setCommunityStats] = useState({
    weeklyVisitors: weeklyVisitors,
    weeklyInteractions: weeklyInteractions
  });

  // 获取创建者信息
  useEffect(() => {
    const fetchCreatorInfo = async () => {
      const creatorId = community.creatorId || creator;
      if (creatorId) {
        try {
          console.log('[CommunityInfoSidebar] Fetching creator info for ID:', creatorId);
          const response = await fetch(`/api/users/${creatorId}`);
          console.log('[CommunityInfoSidebar] Creator API response:', response.status);
          if (response.ok) {
            const result = await response.json();
            console.log('[CommunityInfoSidebar] Creator API result:', result);
            if (result.code === 0 && result.data) {
              setCreatorInfo({
                username: result.data.username || '未知用户',
                avatar: result.data.avatar || result.data.avatar_url
              });
            } else {
              console.warn('[CommunityInfoSidebar] Creator API returned error:', result);
            }
          } else {
            console.error('[CommunityInfoSidebar] Failed to fetch creator info:', response.status);
          }
        } catch (err) {
          console.error('[CommunityInfoSidebar] Failed to fetch creator info:', err);
        }
      } else {
        console.log('[CommunityInfoSidebar] No creator ID available');
      }
    };

    fetchCreatorInfo();
  }, [community.creatorId, creator]);

  // 获取社区统计数据（真实数据）
  const [onlineCountState, setOnlineCountState] = useState<number>(onlineCount || 0);

  useEffect(() => {
    const fetchCommunityStats = async () => {
      if (!community?.id) return;

      try {
        // 先更新用户在社区的活跃时间（标记在线）
        const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
        if (session?.user?.id) {
          const { supabaseAdmin } = await import('@/lib/supabaseClient');
          const now = Math.floor(Date.now() / 1000);
          const { error: updateError } = await supabaseAdmin
            .from('community_members')
            .update({ last_active: now })
            .eq('community_id', community.id)
            .eq('user_id', session.user.id);
          
          if (updateError) {
            console.error('[CommunityInfoSidebar] Failed to update last_active:', updateError);
          }
        }

        const response = await fetch(`/api/communities/${community.id}/stats`);
        if (response.ok) {
          const result = await response.json();
          if (result.code === 0 && result.data) {
            console.log('[CommunityInfoSidebar] Community stats:', result.data);
            setCommunityStats({
              weeklyVisitors: result.data.weekly_visitors || 0,
              weeklyInteractions: result.data.weekly_interactions || 0
            });
            // 更新在线人数
            setOnlineCountState(result.data.online_count || 0);
          }
        }
      } catch (error) {
        console.error('[CommunityInfoSidebar] Failed to fetch community stats:', error);
      }
    };

    fetchCommunityStats();

    // 每1秒更新一次统计数据
    const interval = setInterval(fetchCommunityStats, 1000);
    return () => clearInterval(interval);
  }, [community.id]);

  // 获取真实成员数量
  useEffect(() => {
    const fetchRealMemberCount = async () => {
      if (!community?.id) return;

      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { count, error } = await supabase
          .from('community_members')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', community.id);

        if (error) {
          console.error('[CommunityInfoSidebar] Failed to fetch member count:', error);
          return;
        }

        if (count !== null && count !== undefined) {
          console.log('[CommunityInfoSidebar] Real member count:', count);
          setRealMemberCount(count);
        }
      } catch (error) {
        console.error('[CommunityInfoSidebar] Error fetching member count:', error);
      }
    };

    fetchRealMemberCount();
  }, [community.id]);

  // 获取活跃成员数据（真实数据）
  useEffect(() => {
    const fetchActiveMembers = async () => {
      if (!community?.id) return;

      try {
        // 获取社区成员
        const { supabase } = await import('@/lib/supabaseClient');
        const { supabaseAdmin } = await import('@/lib/supabaseClient');
        const { data: members, error: membersError } = await supabase
          .from('community_members')
          .select('user_id, role, joined_at')
          .eq('community_id', community.id)
          .limit(5);

        if (membersError) throw membersError;

        // 获取成员的用户信息（使用 admin 客户端绕过 RLS）
        const userIds = members?.map(m => m.user_id) || [];
        let usersData: any[] = [];
        if (userIds.length > 0) {
          const { data: users, error: usersError } = await supabaseAdmin
            .from('users')
            .select('id, username, avatar_url')
            .in('id', userIds);
          if (!usersError && users) {
            usersData = users;
          } else if (usersError) {
            console.error('[CommunityInfoSidebar] Failed to fetch users:', usersError);
          }
        }

        // 转换为活跃成员格式
        const activeMembersList: ActiveMember[] = (members || []).map((member, index) => {
          const user = usersData.find(u => u.id === member.user_id);
          const username = user?.username || '未知用户';
          const avatar = user?.avatar_url;
          // 模拟在线状态（前2个显示在线）
          const isOnline = index < 2;
          const lastActive = isOnline ? '刚刚' : `${Math.floor(Math.random() * 60) + 1}分钟前`;

          return {
            id: member.user_id,
            username,
            avatar,
            isOnline,
            lastActive
          };
        });

        setActiveMembers(activeMembersList);
      } catch (error) {
        console.error('[CommunityInfoSidebar] Failed to fetch active members:', error);
        setActiveMembers([]);
      }
    };

    fetchActiveMembers();
  }, [community.id]);

  // 获取近期活动（真实数据）
  useEffect(() => {
    const fetchRecentEvents = async () => {
      if (!community?.id) return;

      try {
        // 获取社区成员加入记录（从 community_members 表）
        const { communityService } = await import('@/services/communityService');
        const { supabase } = await import('@/lib/supabaseClient');
        const { supabaseAdmin } = await import('@/lib/supabaseClient');
        const { data: members, error: membersError } = await supabase
          .from('community_members')
          .select('user_id, joined_at')
          .eq('community_id', community.id)
          .order('joined_at', { ascending: false })
          .limit(3);

        if (membersError) throw membersError;

        // 获取成员的用户信息（使用 admin 客户端）
        const userIds = members?.map(m => m.user_id) || [];
        let usersData: any[] = [];
        if (userIds.length > 0) {
          const { data: users, error: usersError } = await supabaseAdmin
            .from('users')
            .select('id, username')
            .in('id', userIds);
          if (!usersError && users) {
            usersData = users;
          }
        }

        // 获取最新帖子
        const threads = await communityService.getThreadsByCommunity(community.id);
        const recentThreads = threads.slice(0, 2);

        // 构建活动列表
        const events: RecentEvent[] = [];

        // 添加成员加入活动
        members?.forEach((member, index) => {
          const user = usersData.find(u => u.id === member.user_id);
          const username = user?.username || '未知用户';
          // joined_at 是 ISO 日期字符串，直接使用
          const joinDate = new Date(member.joined_at);
          const timeAgo = getTimeAgo(joinDate);
          events.push({
            id: `join-${member.user_id}`,
            type: 'join',
            title: '新成员加入',
            timestamp: timeAgo,
            user: { username }
          });
        });

        // 添加新帖子活动
        recentThreads.forEach(thread => {
          const timeAgo = getTimeAgo(new Date(thread.createdAt));
          events.push({
            id: `post-${thread.id}`,
            type: 'post',
            title: '发布了新帖子',
            timestamp: timeAgo,
            user: { username: thread.author || '未知用户' }
          });
        });

        // 如果成员数达到里程碑，添加里程碑活动
        if ((memberCount || 0) >= 10 && (memberCount || 0) % 10 === 0) {
          events.push({
            id: 'milestone',
            type: 'milestone',
            title: `社群成员突破${memberCount}人`,
            timestamp: '刚刚'
          });
        }

        setRecentEvents(events.slice(0, 4));
      } catch (error) {
        console.error('[CommunityInfoSidebar] Failed to fetch recent events:', error);
        setRecentEvents([]);
      }
    };

    fetchRecentEvents();
  }, [community.id, memberCount]);

  // 辅助函数：计算时间差
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    return date.toLocaleDateString();
  };

  // 获取热门帖子（真实数据）
  useEffect(() => {
    const fetchHotPosts = async () => {
      if (!community?.id) return;

      try {
        // 使用 communityService 获取社区帖子
        const { communityService } = await import('@/services/communityService');
        const threads = await communityService.getThreadsByCommunity(community.id);

        // 按点赞数排序，取前3个作为热门帖子
        const sortedPosts = threads
          .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
          .slice(0, 3)
          .map((thread, index) => ({
            id: thread.id,
            title: thread.title || '无标题',
            comments: thread.comments?.length || 0,
            upvotes: thread.upvotes || 0,
            thumbnail: thread.images?.[0] || undefined
          }));

        setHotPosts(sortedPosts);
      } catch (error) {
        console.error('[CommunityInfoSidebar] Failed to fetch hot posts:', error);
        setHotPosts([]);
      }
    };

    fetchHotPosts();
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
              {creatorInfo?.username || '社群创建者'}
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
            value={realMemberCount > 0 ? realMemberCount : community.memberCount || 0}
            label="成员"
            isDark={isDark}
            color="blue"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            icon={Activity}
            value={onlineCountState > 0 ? onlineCountState : onlineCount}
            label="在线"
            isDark={isDark}
            color="green"
          />
          <StatCard
            icon={Eye}
            value={communityStats.weeklyVisitors > 0 ? communityStats.weeklyVisitors : '0'}
            label="本周访客"
            isDark={isDark}
            color="purple"
          />
          <StatCard
            icon={MessageCircle}
            value={communityStats.weeklyInteractions > 0 ? communityStats.weeklyInteractions : '0'}
            label="本周互动"
            isDark={isDark}
            color="orange"
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
                  onClick={() => bookmark.url && window.open(bookmark.url, '_blank')}
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
