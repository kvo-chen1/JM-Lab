import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { supabaseAdmin } from '@/lib/supabaseClient';
import {
  Users,
  FileText,
  MessageCircle,
  TrendingUp,
  Eye,
  Heart,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Pin,
  Trash2,
  Pause,
  Play,
  X,
  LayoutGrid,
  List,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  UserPlus,
  MessageSquare,
  ThumbsUp,
  MoreVertical,
  Flame,
  Target,
  Zap,
  Settings,
  Plus
} from 'lucide-react';

// 类型定义
interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  cover_image: string | null;
  member_count: number;
  posts_count: number;
  status: 'active' | 'inactive' | 'banned';
  created_at: string;
  creator_id: string;
  creator_name?: string;
  category?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  community_id: string;
  community_name: string;
  images: string[];
  likes_count: number;
  comments_count: number;
  views: number;
  is_pinned: boolean;
  is_announcement: boolean;
  status: 'active' | 'deleted' | 'hidden';
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  post_id: string;
  post_title: string;
  likes_count: number;
  status: 'active' | 'deleted' | 'hidden';
  created_at: string;
}

interface ActivityItem {
  id: string;
  type: 'post' | 'comment' | 'join' | 'like';
  user_name: string;
  user_avatar: string | null;
  content: string;
  target: string;
  created_at: string;
}

interface CommunityStats {
  totalCommunities: number;
  activeCommunities: number;
  totalPosts: number;
  totalComments: number;
  todayNewPosts: number;
  todayNewComments: number;
  totalMembers: number;
  todayNewMembers: number;
  weekPosts: number;
  weekComments: number;
  hotCommunity: Community | null;
  activeUsers: number;
}

// 标签页类型
 type TabType = 'overview' | 'communities' | 'posts' | 'comments';

export default function JinmaiCommunityManagement() {
  const { isDark } = useTheme();

  // 标签页状态 - 默认显示社群管理
  const [activeTab, setActiveTab] = useState<TabType>('communities');

  // 数据状态
  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<CommunityStats>({
    totalCommunities: 0,
    activeCommunities: 0,
    totalPosts: 0,
    totalComments: 0,
    todayNewPosts: 0,
    todayNewComments: 0,
    totalMembers: 0,
    todayNewMembers: 0,
    weekPosts: 0,
    weekComments: 0,
    hotCommunity: null,
    activeUsers: 0
  });

  // UI状态
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedItem, setSelectedItem] = useState<Community | Post | Comment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const pageSize = 10;

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // 基础统计
      const { count: totalCommunities } = await supabaseAdmin
        .from('communities')
        .select('*', { count: 'exact', head: true });

      const { count: activeCommunities } = await supabaseAdmin
        .from('communities')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: totalPosts } = await supabaseAdmin
        .from('posts')
        .select('*', { count: 'exact', head: true });

      const { count: totalComments } = await supabaseAdmin
        .from('comments')
        .select('*', { count: 'exact', head: true });

      const { count: todayNewPosts } = await supabaseAdmin
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      const { count: todayNewComments } = await supabaseAdmin
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // 成员统计
      const { count: totalMembers } = await supabaseAdmin
        .from('community_members')
        .select('*', { count: 'exact', head: true });

      const { count: todayNewMembers } = await supabaseAdmin
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .gte('joined_at', today);

      // 本周统计
      const { count: weekPosts } = await supabaseAdmin
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo);

      const { count: weekComments } = await supabaseAdmin
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo);

      // 获取最热门的社群
      const { data: hotCommunities } = await supabaseAdmin
        .from('communities')
        .select('*')
        .order('member_count', { ascending: false })
        .limit(1);

      // 获取活跃用户数量（最近7天有活动的用户）
      const { count: activeUsers } = await supabaseAdmin
        .from('posts')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', weekAgo);

      setStats({
        totalCommunities: totalCommunities || 0,
        activeCommunities: activeCommunities || 0,
        totalPosts: totalPosts || 0,
        totalComments: totalComments || 0,
        todayNewPosts: todayNewPosts || 0,
        todayNewComments: todayNewComments || 0,
        totalMembers: totalMembers || 0,
        todayNewMembers: todayNewMembers || 0,
        weekPosts: weekPosts || 0,
        weekComments: weekComments || 0,
        hotCommunity: hotCommunities && hotCommunities.length > 0 ? {
          id: hotCommunities[0].id,
          name: hotCommunities[0].name,
          description: hotCommunities[0].description || '',
          avatar_url: hotCommunities[0].avatar,
          cover_image: hotCommunities[0].cover_image,
          member_count: hotCommunities[0].member_count || 0,
          posts_count: hotCommunities[0].posts_count || 0,
          status: hotCommunities[0].is_active ? 'active' : 'inactive',
          created_at: hotCommunities[0].created_at,
          creator_id: hotCommunities[0].creator_id,
          category: hotCommunities[0].topic || '其他'
        } as Community : null,
        activeUsers: activeUsers || 0
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  // 获取最近活动
  const fetchActivities = async () => {
    try {
      // 获取最近的帖子
      const { data: recentPosts } = await supabaseAdmin
        .from('posts')
        .select('id, title, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // 获取最近的评论
      const { data: recentComments } = await supabaseAdmin
        .from('comments')
        .select('id, content, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // 获取用户信息
      const userIds = [
        ...(recentPosts || []).map(p => p.user_id),
        ...(recentComments || []).map(c => c.user_id)
      ].filter(Boolean);

      let userMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: usersData } = await supabaseAdmin
          .from('users')
          .select('id, username, avatar_url')
          .in('id', [...new Set(userIds)]);

        if (usersData) {
          userMap = usersData.reduce((acc: Record<string, any>, user: any) => {
            acc[user.id] = user;
            return acc;
          }, {});
        }
      }

      const activities: ActivityItem[] = [
        ...(recentPosts || []).map(post => ({
          id: `post-${post.id}`,
          type: 'post' as const,
          user_name: userMap[post.user_id]?.username || '未知用户',
          user_avatar: userMap[post.user_id]?.avatar_url,
          content: `发布了新帖子`,
          target: post.title || '无标题',
          created_at: post.created_at
        })),
        ...(recentComments || []).map(comment => ({
          id: `comment-${comment.id}`,
          type: 'comment' as const,
          user_name: userMap[comment.user_id]?.username || '未知用户',
          user_avatar: userMap[comment.user_id]?.avatar_url,
          content: `发表了评论`,
          target: comment.content.slice(0, 30) + (comment.content.length > 30 ? '...' : ''),
          created_at: comment.created_at
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);

      setActivities(activities);
    } catch (error) {
      console.error('获取活动失败:', error);
    }
  };

  // 获取社群列表
  const fetchCommunities = async () => {
    setLoading(true);
    try {
      let query = supabaseAdmin
        .from('communities')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const creatorIds = (data || []).map((item: any) => item.creator_id).filter(Boolean);
      let creatorMap: Record<string, any> = {};

      if (creatorIds.length > 0) {
        const { data: usersData } = await supabaseAdmin
          .from('users')
          .select('id, username, avatar_url')
          .in('id', creatorIds);

        if (usersData) {
          creatorMap = usersData.reduce((acc: Record<string, any>, user: any) => {
            acc[user.id] = user;
            return acc;
          }, {});
        }
      }

      const formattedCommunities: Community[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        avatar_url: item.avatar,
        cover_image: item.cover_image,
        member_count: item.member_count || 0,
        posts_count: item.posts_count || 0,
        status: item.is_active ? 'active' : 'inactive',
        created_at: item.created_at,
        updated_at: item.updated_at,
        creator_id: item.creator_id,
        creator_name: creatorMap[item.creator_id]?.username || '未知用户',
        category: item.topic || '其他'
      }));

      setCommunities(formattedCommunities);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('获取社群列表失败:', error);
      toast.error('获取社群列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取帖子列表
  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabaseAdmin
        .from('posts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const userIds = (data || []).map((item: any) => item.user_id || item.author_id).filter(Boolean);
      let userMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: usersData } = await supabaseAdmin
          .from('users')
          .select('id, username, avatar_url')
          .in('id', userIds);

        if (usersData) {
          userMap = usersData.reduce((acc: Record<string, any>, user: any) => {
            acc[user.id] = user;
            return acc;
          }, {});
        }
      }

      const communityIds = (data || []).map((item: any) => item.community_id).filter(Boolean);
      let communityMap: Record<string, any> = {};

      if (communityIds.length > 0) {
        const { data: communitiesData } = await supabaseAdmin
          .from('communities')
          .select('id, name')
          .in('id', communityIds);

        if (communitiesData) {
          communityMap = communitiesData.reduce((acc: Record<string, any>, comm: any) => {
            acc[comm.id] = comm;
            return acc;
          }, {});
        }
      }

      const formattedPosts: Post[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title || '无标题',
        content: item.content || '',
        author_id: item.user_id || item.author_id,
        author_name: userMap[item.user_id || item.author_id]?.username || '未知用户',
        author_avatar: userMap[item.user_id || item.author_id]?.avatar_url,
        community_id: item.community_id,
        community_name: communityMap[item.community_id]?.name || '未知社群',
        images: item.images || item.attachments || [],
        likes_count: item.likes_count || item.likes || 0,
        comments_count: item.comments_count || 0,
        views: item.view_count || 0,
        is_pinned: item.is_pinned || false,
        is_announcement: item.is_announcement || false,
        status: 'active',
        created_at: item.created_at
      }));

      setPosts(formattedPosts);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('获取帖子列表失败:', error);
      toast.error('获取帖子列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取评论列表
  const fetchComments = async () => {
    setLoading(true);
    try {
      let query = supabaseAdmin
        .from('comments')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (searchQuery) {
        query = query.ilike('content', `%${searchQuery}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const userIds = (data || []).map((item: any) => item.user_id).filter(Boolean);
      let userMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: usersData } = await supabaseAdmin
          .from('users')
          .select('id, username, avatar_url')
          .in('id', userIds);

        if (usersData) {
          userMap = usersData.reduce((acc: Record<string, any>, user: any) => {
            acc[user.id] = user;
            return acc;
          }, {});
        }
      }

      const postIds = (data || []).map((item: any) => item.post_id).filter(Boolean);
      let postMap: Record<string, any> = {};

      if (postIds.length > 0) {
        const { data: postsData } = await supabaseAdmin
          .from('posts')
          .select('id, title')
          .in('id', postIds);

        if (postsData) {
          postMap = postsData.reduce((acc: Record<string, any>, post: any) => {
            acc[post.id] = post;
            return acc;
          }, {});
        }
      }

      const formattedComments: Comment[] = (data || []).map((item: any) => ({
        id: item.id,
        content: item.content || '',
        author_id: item.user_id,
        author_name: userMap[item.user_id]?.username || '未知用户',
        author_avatar: userMap[item.user_id]?.avatar_url,
        post_id: item.post_id,
        post_title: postMap[item.post_id]?.title || '未知帖子',
        likes_count: 0,
        status: 'active',
        created_at: item.created_at
      }));

      setComments(formattedComments);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('获取评论列表失败:', error);
      toast.error('获取评论列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 更新社群状态
  const updateCommunityStatus = async (communityId: string, status: 'active' | 'inactive') => {
    try {
      const { error } = await supabaseAdmin
        .from('communities')
        .update({ is_active: status === 'active', updated_at: new Date().toISOString() })
        .eq('id', communityId);

      if (error) throw error;

      toast.success(`社群已${status === 'active' ? '启用' : '禁用'}`);
      fetchCommunities();
      fetchStats();
    } catch (error) {
      console.error('更新社群状态失败:', error);
      toast.error('更新社群状态失败');
    }
  };

  // 删除社群
  const deleteCommunity = async (communityId: string) => {
    if (!confirm('确定要删除这个社群吗？此操作不可恢复！')) return;

    try {
      const { error } = await supabaseAdmin
        .from('communities')
        .delete()
        .eq('id', communityId);

      if (error) throw error;

      toast.success('社群已删除');
      fetchCommunities();
      fetchStats();
    } catch (error) {
      console.error('删除社群失败:', error);
      toast.error('删除社群失败');
    }
  };

  // 删除帖子
  const deletePost = async (postId: string) => {
    if (!confirm('确定要删除这个帖子吗？')) return;

    try {
      const { error } = await supabaseAdmin
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast.success('帖子已删除');
      fetchPosts();
      fetchStats();
    } catch (error) {
      console.error('删除帖子失败:', error);
      toast.error('删除帖子失败');
    }
  };

  // 删除评论
  const deleteComment = async (commentId: string) => {
    if (!confirm('确定要删除这个评论吗？')) return;

    try {
      const { error } = await supabaseAdmin
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast.success('评论已删除');
      fetchComments();
      fetchStats();
    } catch (error) {
      console.error('删除评论失败:', error);
      toast.error('删除评论失败');
    }
  };

  // 置顶/取消置顶帖子
  const togglePinPost = async (postId: string, isPinned: boolean) => {
    try {
      const { error } = await supabaseAdmin
        .from('posts')
        .update({ is_pinned: !isPinned, updated_at: new Date().toISOString() })
        .eq('id', postId);

      if (error) throw error;

      toast.success(isPinned ? '帖子已取消置顶' : '帖子已置顶');
      fetchPosts();
    } catch (error) {
      console.error('置顶操作失败:', error);
      toast.error('置顶操作失败');
    }
  };

  // 查看详情
  const viewDetail = (item: Community | Post | Comment) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  // 刷新数据
  const refreshData = () => {
    fetchStats();
    fetchActivities();
    if (activeTab === 'communities') fetchCommunities();
    else if (activeTab === 'posts') fetchPosts();
    else if (activeTab === 'comments') fetchComments();
  };

  // 初始化加载
  useEffect(() => {
    fetchStats();
    fetchActivities();
    fetchCommunities(); // 默认加载社群列表
  }, []);

  // 标签页切换时加载数据
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
    if (activeTab === 'communities') fetchCommunities();
    else if (activeTab === 'posts') fetchPosts();
    else if (activeTab === 'comments') fetchComments();
  }, [activeTab]);

  // 分页、筛选、搜索变化时重新加载
  useEffect(() => {
    if (activeTab === 'communities') fetchCommunities();
    else if (activeTab === 'posts') fetchPosts();
    else if (activeTab === 'comments') fetchComments();
  }, [currentPage, statusFilter, searchQuery]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // 统计卡片组件
  const StatCard = ({ title, value, icon: Icon, trend, trendUp, color, subtitle }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl ${isDark ? 'bg-gray-800/80' : 'bg-white'} p-5 shadow-lg backdrop-blur-sm`}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-full -mr-12 -mt-12`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} text-white shadow-lg`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
              {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend}
            </div>
          )}
        </div>
        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
        {subtitle && <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{subtitle}</p>}
      </div>
    </motion.div>
  );

  // 活动图标
  const ActivityIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'post':
        return <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div>;
      case 'comment':
        return <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" /></div>;
      case 'join':
        return <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"><UserPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" /></div>;
      case 'like':
        return <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><Heart className="w-4 h-4 text-red-600 dark:text-red-400" /></div>;
      default:
        return <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><Activity className="w-4 h-4 text-gray-600 dark:text-gray-400" /></div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">津脉社区管理</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            实时监控社区动态，管理社群、帖子和评论
          </p>
        </div>
        <button
          onClick={refreshData}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            isDark
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              : 'bg-white hover:bg-gray-50 text-gray-700 shadow-sm'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>刷新数据</span>
        </button>
      </div>

      {/* 统计概览卡片 - 始终显示 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="社群总数"
          value={stats.totalCommunities}
          icon={Users}
          trend="+12%"
          trendUp={true}
          color="from-blue-500 to-blue-600"
          subtitle={`${stats.activeCommunities} 个活跃`}
        />
        <StatCard
          title="帖子总数"
          value={stats.totalPosts}
          icon={FileText}
          trend="+23%"
          trendUp={true}
          color="from-purple-500 to-purple-600"
          subtitle={`${stats.todayNewPosts} 个今日新增`}
        />
        <StatCard
          title="评论总数"
          value={stats.totalComments}
          icon={MessageCircle}
          trend="+8%"
          trendUp={true}
          color="from-orange-500 to-orange-600"
          subtitle={`${stats.todayNewComments} 个今日新增`}
        />
        <StatCard
          title="成员总数"
          value={stats.totalMembers}
          icon={UserPlus}
          trend="+15%"
          trendUp={true}
          color="from-green-500 to-green-600"
          subtitle={`${stats.todayNewMembers} 个今日加入`}
        />
      </div>

      {/* 标签页导航 - 整合所有管理功能 */}
      <div className={`p-1.5 rounded-xl ${isDark ? 'bg-gray-800/80' : 'bg-white'} shadow-lg inline-flex`}>
        {[
          { id: 'communities', name: '社群管理', icon: Users },
          { id: 'posts', name: '帖子管理', icon: FileText },
          { id: 'comments', name: '评论管理', icon: MessageCircle },
          { id: 'overview', name: '数据概览', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
                : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="font-medium">{tab.name}</span>
          </button>
        ))}
      </div>

      {/* 搜索和筛选栏 */}
      <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800/80' : 'bg-white'} shadow-lg`}>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[280px]">
            <div className={`relative flex items-center ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} rounded-xl`}>
              <Search className="w-5 h-5 absolute left-4 text-gray-400" />
              <input
                type="text"
                placeholder={
                  activeTab === 'communities' ? '搜索社群名称...' :
                  activeTab === 'posts' ? '搜索帖子标题或内容...' :
                  activeTab === 'comments' ? '搜索评论内容...' :
                  '搜索...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full px-4 py-3 pl-12 rounded-xl bg-transparent border-none outline-none ${
                  isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
          </div>

          {activeTab === 'communities' && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className={`px-4 py-3 rounded-xl border-none outline-none cursor-pointer ${
                  isDark ? 'bg-gray-700/50 text-white' : 'bg-gray-100 text-gray-900'
                }`}
              >
                <option value="all">全部状态</option>
                <option value="active">活跃</option>
                <option value="inactive">禁用</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-xl transition-all ${
                viewMode === 'list'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : isDark ? 'bg-gray-700/50 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-xl transition-all ${
                viewMode === 'grid'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : isDark ? 'bg-gray-700/50 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* 新增按钮 */}
          {activeTab === 'communities' && (
            <button
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>新建社群</span>
            </button>
          )}
        </div>
      </div>

      {/* 数据列表区域 */}
      <AnimatePresence mode="wait">
        {activeTab === 'communities' && (
          <motion.div
            key="communities"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`rounded-2xl ${isDark ? 'bg-gray-800/80' : 'bg-white'} shadow-lg overflow-hidden`}
          >
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                  <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
                </div>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>加载中...</p>
              </div>
            ) : communities.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>暂无社群数据</p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">社群信息</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">创建者</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">成员数</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">帖子数</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">状态</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">创建时间</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {communities.map((community) => (
                      <tr key={community.id} className={`${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'} transition-colors`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={community.avatar_url || 'https://via.placeholder.com/48'}
                              alt={community.name}
                              className="w-12 h-12 rounded-xl object-cover shadow-md"
                            />
                            <div>
                              <p className="font-semibold">{community.name}</p>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate max-w-[200px]`}>
                                {community.description || '暂无描述'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{community.creator_name}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-medium">{community.member_count}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-medium">{community.posts_count}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                            community.status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${community.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            {community.status === 'active' ? '活跃' : '禁用'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            {new Date(community.created_at).toLocaleDateString('zh-CN')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => viewDetail(community)}
                              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                              title="查看详情"
                            >
                              <Eye className="w-4 h-4 text-blue-500" />
                            </button>
                            {community.status === 'active' ? (
                              <button
                                onClick={() => updateCommunityStatus(community.id, 'inactive')}
                                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                title="禁用"
                              >
                                <Pause className="w-4 h-4 text-yellow-500" />
                              </button>
                            ) : (
                              <button
                                onClick={() => updateCommunityStatus(community.id, 'active')}
                                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                title="启用"
                              >
                                <Play className="w-4 h-4 text-green-500" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteCommunity(community.id)}
                              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                              title="删除"
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
            ) : (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {communities.map((community) => (
                  <motion.div
                    key={community.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} hover:shadow-lg transition-all`}
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={community.avatar_url || 'https://via.placeholder.com/64'}
                        alt={community.name}
                        className="w-16 h-16 rounded-xl object-cover shadow-md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold truncate">{community.name}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            community.status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {community.status === 'active' ? '活跃' : '禁用'}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                          {community.description || '暂无描述'}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            <Users className="w-4 h-4 inline mr-1" />
                            {community.member_count}
                          </span>
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            <FileText className="w-4 h-4 inline mr-1" />
                            {community.posts_count}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-4 pt-4 border-t dark:border-gray-600">
                      <button
                        onClick={() => viewDetail(community)}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4 text-blue-500" />
                      </button>
                      {community.status === 'active' ? (
                        <button
                          onClick={() => updateCommunityStatus(community.id, 'inactive')}
                          className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                          title="禁用"
                        >
                          <Pause className="w-4 h-4 text-yellow-500" />
                        </button>
                      ) : (
                        <button
                          onClick={() => updateCommunityStatus(community.id, 'active')}
                          className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                          title="启用"
                        >
                          <Play className="w-4 h-4 text-green-500" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteCommunity(community.id)}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* 分页 */}
            {!loading && totalPages > 1 && (
              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  共 {totalCount} 条记录，第 {currentPage}/{totalPages} 页
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-colors ${
                      currentPage === 1
                        ? 'opacity-50 cursor-not-allowed'
                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? 'opacity-50 cursor-not-allowed'
                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'posts' && (
          <motion.div
            key="posts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`rounded-2xl ${isDark ? 'bg-gray-800/80' : 'bg-white'} shadow-lg overflow-hidden`}
          >
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                  <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
                </div>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>加载中...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>暂无帖子数据</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">帖子信息</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">作者</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">社群</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">互动数据</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {posts.map((post) => (
                      <tr key={post.id} className={`${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'} transition-colors`}>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-4">
                            {post.images && post.images.length > 0 && (
                              <img
                                src={post.images[0]}
                                alt={post.title}
                                className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow-md"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=No+Image';
                                }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{post.title}</p>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate max-w-[300px]`}>
                                {post.content}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                {post.is_pinned && (
                                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">置顶</span>
                                )}
                                {post.is_announcement && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">公告</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <img
                              src={post.author_avatar || 'https://via.placeholder.com/32'}
                              alt={post.author_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{post.author_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm px-3 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                            {post.community_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`text-sm flex items-center justify-center gap-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4 text-red-500" />
                              {post.likes_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4 text-blue-500" />
                              {post.comments_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4 text-green-500" />
                              {post.views}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => viewDetail(post)}
                              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                              title="查看详情"
                            >
                              <Eye className="w-4 h-4 text-blue-500" />
                            </button>
                            <button
                              onClick={() => togglePinPost(post.id, post.is_pinned)}
                              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                              title={post.is_pinned ? '取消置顶' : '置顶'}
                            >
                              <Pin className={`w-4 h-4 ${post.is_pinned ? 'text-red-500' : 'text-gray-400'}`} />
                            </button>
                            <button
                              onClick={() => deletePost(post.id)}
                              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                              title="删除"
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

            {/* 分页 */}
            {!loading && totalPages > 1 && (
              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  共 {totalCount} 条记录，第 {currentPage}/{totalPages} 页
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-colors ${
                      currentPage === 1
                        ? 'opacity-50 cursor-not-allowed'
                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? 'opacity-50 cursor-not-allowed'
                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'comments' && (
          <motion.div
            key="comments"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`rounded-2xl ${isDark ? 'bg-gray-800/80' : 'bg-white'} shadow-lg overflow-hidden`}
          >
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                  <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
                </div>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>加载中...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>暂无评论数据</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">评论内容</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">作者</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">所属帖子</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">点赞数</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {comments.map((comment) => (
                      <tr key={comment.id} className={`${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'} transition-colors`}>
                        <td className="px-6 py-4">
                          <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} truncate max-w-[400px]`}>
                            {comment.content}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <img
                              src={comment.author_avatar || 'https://via.placeholder.com/32'}
                              alt={comment.author_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{comment.author_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} truncate max-w-[200px] block`}>
                            {comment.post_title}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-medium flex items-center justify-center gap-1">
                            <Heart className="w-4 h-4 text-red-500" />
                            {comment.likes_count}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => viewDetail(comment)}
                              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                              title="查看详情"
                            >
                              <Eye className="w-4 h-4 text-blue-500" />
                            </button>
                            <button
                              onClick={() => deleteComment(comment.id)}
                              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                              title="删除"
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

            {/* 分页 */}
            {!loading && totalPages > 1 && (
              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  共 {totalCount} 条记录，第 {currentPage}/{totalPages} 页
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-colors ${
                      currentPage === 1
                        ? 'opacity-50 cursor-not-allowed'
                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? 'opacity-50 cursor-not-allowed'
                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* 左侧主内容区 - 占2列 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 本周趋势 */}
              <div className={`p-5 rounded-2xl ${isDark ? 'bg-gray-800/80' : 'bg-white'} shadow-lg`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold">本周趋势</h3>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    最近7天
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-purple-500" />
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>新增帖子</span>
                    </div>
                    <p className="text-2xl font-bold">{stats.weekPosts}</p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>日均 {Math.round(stats.weekPosts / 7)} 个</p>
                  </div>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-4 h-4 text-orange-500" />
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>新增评论</span>
                    </div>
                    <p className="text-2xl font-bold">{stats.weekComments}</p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>日均 {Math.round(stats.weekComments / 7)} 个</p>
                  </div>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>活跃用户</span>
                    </div>
                    <p className="text-2xl font-bold">{stats.activeUsers}</p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>本周发帖用户</p>
                  </div>
                </div>
              </div>

              {/* 热门社群 */}
              {stats.hotCommunity && (
                <div className={`p-5 rounded-2xl ${isDark ? 'bg-gray-800/80' : 'bg-white'} shadow-lg`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-red-500" />
                      <h3 className="font-semibold">热门社群</h3>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400`}>
                      TOP 1
                    </span>
                  </div>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-start gap-4">
                      <img
                        src={stats.hotCommunity.avatar_url || 'https://via.placeholder.com/64'}
                        alt={stats.hotCommunity.name}
                        className="w-16 h-16 rounded-xl object-cover shadow-md"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg">{stats.hotCommunity.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            stats.hotCommunity.status === 'active'
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {stats.hotCommunity.status === 'active' ? '活跃' : '禁用'}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'} line-clamp-2`}>
                          {stats.hotCommunity.description || '暂无描述'}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className={`text-sm flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Users className="w-4 h-4" />
                            {stats.hotCommunity.member_count} 成员
                          </span>
                          <span className={`text-sm flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <FileText className="w-4 h-4" />
                            {stats.hotCommunity.posts_count} 帖子
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 右侧边栏 - 占1列 */}
            <div className="space-y-6">
              {/* 实时动态 */}
              <div className={`p-5 rounded-2xl ${isDark ? 'bg-gray-800/80' : 'bg-white'} shadow-lg`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold">实时动态</h3>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                    实时
                  </span>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin">
                  {activities.length === 0 ? (
                    <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">暂无动态</p>
                    </div>
                  ) : (
                    activities.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-start gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-700/30 hover:bg-gray-700/50' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}
                      >
                        <ActivityIcon type={activity.type} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{activity.user_name}</span>
                            <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}> {activity.content}</span>
                          </p>
                          <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {activity.target}
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            {new Date(activity.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* 社区健康度 */}
              <div className={`p-5 rounded-2xl ${isDark ? 'bg-gray-800/80' : 'bg-white'} shadow-lg`}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold">社区健康度</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>活跃度</span>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                    <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className="h-full w-[85%] bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>互动率</span>
                      <span className="text-sm font-medium">72%</span>
                    </div>
                    <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className="h-full w-[72%] bg-gradient-to-r from-green-500 to-green-600 rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>内容质量</span>
                      <span className="text-sm font-medium">90%</span>
                    </div>
                    <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className="h-full w-[90%] bg-gradient-to-r from-purple-500 to-purple-600 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 详情弹窗 */}
      <AnimatePresence>
        {showDetailModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
              onClick={e => e.stopPropagation()}
            >
              {/* 弹窗头部 */}
              <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                <h3 className="text-xl font-bold">
                  {'title' in selectedItem ? '帖子详情' : 'content' in selectedItem && 'post_title' in selectedItem ? '评论详情' : '社群详情'}
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 弹窗内容 */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {'title' in selectedItem && !('post_title' in selectedItem) ? (
                  // 帖子详情
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">{selectedItem.title}</h4>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        <Users className="w-4 h-4 inline mr-1" />
                        {selectedItem.author_name}
                      </span>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        {selectedItem.community_name}
                      </span>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        {new Date(selectedItem.created_at).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap`}>
                      {selectedItem.content}
                    </p>
                    {selectedItem.images && selectedItem.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {selectedItem.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt=""
                            className="rounded-lg object-cover h-32 w-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x128?text=No+Image';
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-6 pt-4 border-t dark:border-gray-700">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-red-500" />
                        {selectedItem.likes_count} 点赞
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4 text-blue-500" />
                        {selectedItem.comments_count} 评论
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4 text-green-500" />
                        {selectedItem.views} 浏览
                      </span>
                    </div>
                  </div>
                ) : 'content' in selectedItem && 'post_title' in selectedItem ? (
                  // 评论详情
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedItem.author_avatar || 'https://via.placeholder.com/48'}
                        alt={selectedItem.author_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium">{selectedItem.author_name}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(selectedItem.created_at).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap`}>
                      {selectedItem.content}
                    </p>
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>所属帖子</p>
                      <p className="font-medium">{selectedItem.post_title}</p>
                    </div>
                  </div>
                ) : (
                  // 社群详情
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={(selectedItem as Community).avatar_url || 'https://via.placeholder.com/80'}
                        alt={(selectedItem as Community).name}
                        className="w-20 h-20 rounded-xl object-cover shadow-lg"
                      />
                      <div>
                        <h4 className="text-lg font-semibold">{(selectedItem as Community).name}</h4>
                        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {(selectedItem as Community).description || '暂无描述'}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                            (selectedItem as Community).status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${(selectedItem as Community).status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            {(selectedItem as Community).status === 'active' ? '活跃' : '禁用'}
                          </span>
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            <Users className="w-4 h-4 inline mr-1" />
                            {(selectedItem as Community).member_count} 成员
                          </span>
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            <FileText className="w-4 h-4 inline mr-1" />
                            {(selectedItem as Community).posts_count} 帖子
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
