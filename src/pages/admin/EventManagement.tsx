import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { useEventService } from '@/hooks/useEventService';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { Event } from '@/types';
import {
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  BarChart3,
  Tag,
  Plus,
  RefreshCw,
  MapPin,
  TrendingUp,
  Activity,
  LayoutGrid,
  List,
  MoreVertical,
  ArrowUpRight,
  Sparkles,
  Layers,
  Timer,
  CheckCheck,
  FileEdit,
  Trash2,
  ChevronRight,
  Percent,
  Target
} from 'lucide-react';

// 活动状态
type EventStatus = 'pending' | 'approved' | 'rejected' | 'ongoing' | 'ended' | 'cancelled' | 'draft';

// 视图类型
type ViewType = 'list' | 'stats' | 'categories';

// 参与者接口
interface Participant {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  registered_at: number;
  status: 'registered' | 'attended' | 'cancelled';
  check_in_at?: number;
}

// 活动统计接口
interface EventStats {
  totalEvents: number;
  pendingEvents: number;
  ongoingEvents: number;
  endedEvents: number;
  draftEvents: number;
  totalParticipants: number;
  averageAttendance: number;
  approvalRate: number;
}

// 活动分类接口
interface EventCategory {
  id: string;
  name: string;
  description: string;
  event_count: number;
  color: string;
}

// 扩展 Event 类型
interface AdminEvent extends Event {
  category?: string;
  participantsList?: any[];
  participants_count?: number;
}

// 玻璃拟态卡片
const GlassCard = ({
  children,
  className = '',
  isDark,
  hover = true
}: {
  children: React.ReactNode;
  className?: string;
  isDark: boolean;
  hover?: boolean;
}) => (
  <div
    className={`
      relative overflow-hidden rounded-2xl
      ${isDark
        ? 'bg-white/5 border-white/10'
        : 'bg-white/80 border-white/50'
      }
      backdrop-blur-xl
      border
      shadow-lg shadow-black/5
      ${hover ? 'hover:shadow-xl hover:shadow-black/10 transition-all duration-300' : ''}
      ${className}
    `}
  >
    {/* 顶部光晕效果 */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    {children}
  </div>
);

// 渐变统计卡片
const GradientStatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  trend,
  delay = 0
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  gradient: string;
  trend?: { value: string; positive: boolean };
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="relative group"
  >
    <div className={`
      relative overflow-hidden rounded-2xl p-6
      ${gradient}
      shadow-lg shadow-black/20
    `}>
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/70 text-sm font-medium">{title}</p>
            <h3 className="text-3xl font-bold text-white mt-2">{value}</h3>
            {subtitle && <p className="text-white/60 text-xs mt-1">{subtitle}</p>}
          </div>
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>

        {trend && (
          <div className="flex items-center gap-2 mt-4">
            <span className={`text-xs px-2 py-1 rounded-full ${trend.positive ? 'bg-white/20 text-white' : 'bg-white/10 text-white/80'}`}>
              {trend.positive ? '+' : ''}{trend.value}
            </span>
            <span className="text-white/50 text-xs">较上月</span>
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

// 状态徽章 - 新拟态设计
const StatusBadge = ({ status }: { status: EventStatus }) => {
  const configs: Record<string, { label: string; className: string; dot: string }> = {
    pending: {
      label: '待审核',
      className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      dot: 'bg-amber-500'
    },
    approved: {
      label: '已通过',
      className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      dot: 'bg-emerald-500'
    },
    rejected: {
      label: '已拒绝',
      className: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
      dot: 'bg-rose-500'
    },
    ongoing: {
      label: '进行中',
      className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      dot: 'bg-blue-500'
    },
    ended: {
      label: '已结束',
      className: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
      dot: 'bg-slate-500'
    },
    cancelled: {
      label: '已取消',
      className: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
      dot: 'bg-gray-500'
    },
    draft: {
      label: '草稿',
      className: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      dot: 'bg-purple-500'
    }
  };

  const config = configs[status] || configs.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === 'ongoing' ? 'animate-pulse' : ''}`} />
      {config.label}
    </span>
  );
};

// 环形进度组件
const CircularProgress = ({ value, size = 60, strokeWidth = 4, color = '#3B82F6' }: { value: number; size?: number; strokeWidth?: number; color?: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold">{Math.round(value)}%</span>
      </div>
    </div>
  );
};

export default function EventManagement() {
  const { isDark } = useTheme();
  const { reviewEvent } = useEventService();

  // 状态
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [listViewMode, setListViewMode] = useState<'card' | 'table'>('card');
  const [stats, setStats] = useState<EventStats>({
    totalEvents: 0,
    pendingEvents: 0,
    ongoingEvents: 0,
    endedEvents: 0,
    draftEvents: 0,
    totalParticipants: 0,
    averageAttendance: 0,
    approvalRate: 0
  });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 获取活动列表
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const { data: eventsData, error } = await supabaseAdmin
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 调试：打印所有活动的原始状态
      console.log('=== 数据库原始数据 ===');
      (eventsData || []).forEach((e: any, i: number) => {
        console.log(`活动${i + 1}: ${e.title || e.name}, 状态: ${e.status}, 结束时间: ${e.end_date || e.end_time}`);
      });

      const now = new Date();

      const formattedEvents: AdminEvent[] = (eventsData || []).map((event: any) => {
        // 尝试多种可能的图片字段
        let mediaArray: any[] = [];
        if (event.media && event.media.length > 0) {
          mediaArray = event.media;
        } else if (event.images && event.images.length > 0) {
          mediaArray = event.images;
        } else if (event['图片网址']) {
          mediaArray = [event['图片网址']];
        } else if (event.image_url) {
          mediaArray = [event.image_url];
        } else if (event.cover_image) {
          mediaArray = [event.cover_image];
        } else if (event.thumbnail) {
          mediaArray = [event.thumbnail];
        }

        // 解析时间
        const startTime = new Date(event.start_date || event.start_time || event.startTime);
        const endTime = new Date(event.end_date || event.end_time || event.endTime);

        // 自动判断活动状态（基于时间）
        let eventStatus = event.status || 'pending';
        const dbStatus = (event.status || '').toLowerCase();

        // 首先处理明确的数据库状态（这些状态不受时间影响）
        if (dbStatus === 'draft' || dbStatus === 'unpublished') {
          eventStatus = 'draft';
        } else if (dbStatus === 'rejected' || dbStatus === 'denied' || dbStatus === 'refused') {
          eventStatus = 'rejected';
        } else if (dbStatus === 'pending' || dbStatus === 'awaiting' || dbStatus === 'review') {
          eventStatus = 'pending';
        } else if (dbStatus === 'completed' || dbStatus === 'finished' || dbStatus === 'ended' || dbStatus === 'closed') {
          eventStatus = 'ended';
        } else if (dbStatus === 'approved' || dbStatus === 'published' || dbStatus === 'active') {
          // 对于已批准的活动，根据时间判断具体状态
          if (endTime < now) {
            eventStatus = 'ended';
          } else if (startTime <= now && endTime >= now) {
            eventStatus = 'ongoing';
          } else {
            eventStatus = 'approved';
          }
        } else {
          // 默认情况：根据时间判断
          if (endTime < now) {
            eventStatus = 'ended';
          } else if (startTime <= now && endTime >= now) {
            eventStatus = 'ongoing';
          }
        }

        return {
          id: event.id,
          title: event.title || event.name || '未命名活动',
          description: event.description || '',
          content: event.content || event.description || '',
          startTime,
          endTime,
          location: event.location || '',
          organizerId: event.organizer_id || event.creator_id || event.user_id || '',
          createdAt: new Date(event.created_at || Date.now()),
          updatedAt: new Date(event.updated_at || Date.now()),
          maxParticipants: event.max_participants || event.maxParticipants || 0,
          participants: event.participants_count || event.participants?.length || 0,
          participants_count: event.participants_count || 0,
          participantsList: event.participants || [],
          category: event.category || 'other',
          tags: event.tags || [],
          media: mediaArray,
          isPublic: event.is_public !== false,
          type: event.type || event.event_type || 'offline',
          status: eventStatus,
          viewCount: event.view_count || 0,
          shareCount: event.share_count || 0,
          likeCount: event.like_count || 0
        };
      });

      setEvents(formattedEvents);

      const pendingCount = formattedEvents.filter(e => e.status === 'pending').length;
      const draftCount = formattedEvents.filter(e => e.status === 'draft').length;
      const approvedCount = formattedEvents.filter(e => e.status === 'approved' || e.status === 'ongoing' || e.status === 'ended').length;

      console.log('=== 统计信息 ===');
      console.log('总活动数:', formattedEvents.length);
      console.log('待审核:', pendingCount);
      console.log('草稿:', draftCount);
      console.log('已结束:', formattedEvents.filter(e => e.status === 'ended').length);

      setStats({
        totalEvents: formattedEvents.length,
        pendingEvents: pendingCount,
        ongoingEvents: formattedEvents.filter(e => {
          const start = new Date(e.startTime);
          const end = new Date(e.endTime);
          return start <= now && end >= now;
        }).length,
        endedEvents: formattedEvents.filter(e => new Date(e.endTime) < now).length,
        draftEvents: draftCount,
        totalParticipants: formattedEvents.reduce((sum, e) => sum + (e.participants_count || 0), 0),
        averageAttendance: formattedEvents.length > 0
          ? Math.round(formattedEvents.reduce((sum, e) => sum + (e.participants_count || 0), 0) / formattedEvents.length)
          : 0,
        approvalRate: formattedEvents.length > 0 ? (approvedCount / formattedEvents.length) * 100 : 0
      });

      fetchCategories(formattedEvents);
    } catch (error) {
      console.error('获取活动列表失败:', error);
      toast.error('获取活动列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取分类
  const fetchCategories = (eventsData?: AdminEvent[]) => {
    const eventsToProcess = eventsData || events;
    const categoryMap = new Map<string, { name: string; count: number; color: string }>();

    const colorMap: Record<string, string> = {
      'workshop': '#6366F1',
      'competition': '#EC4899',
      'exhibition': '#10B981',
      'lecture': '#F59E0B',
      'meetup': '#8B5CF6',
      'other': '#6B7280',
      '文化活动': '#F97316',
      '创意比赛': '#EF4444',
      '线上活动': '#06B6D4',
      '线下活动': '#84CC16'
    };

    eventsToProcess.forEach(event => {
      const cat = event.category || '其他';
      const existing = categoryMap.get(cat);
      if (existing) {
        existing.count++;
      } else {
        categoryMap.set(cat, { name: cat, count: 1, color: colorMap[cat] || '#6B7280' });
      }
    });

    if (categoryMap.size === 0) {
      ['文化活动', '创意比赛', '线上活动', '线下活动'].forEach((cat) => {
        categoryMap.set(cat, { name: cat, count: 0, color: colorMap[cat] || '#6B7280' });
      });
    }

    const generatedCategories: EventCategory[] = Array.from(categoryMap.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      description: `${data.name}类活动`,
      event_count: data.count,
      color: data.color
    }));

    setCategories(generatedCategories);
  };

  // 获取参与者
  const fetchParticipants = async (eventId: string) => {
    try {
      const { data: registrations } = await supabaseAdmin
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId);

      let participantIds: string[] = [];

      if (registrations && registrations.length > 0) {
        participantIds = registrations.map((r: any) => r.user_id).filter(Boolean);
      } else {
        const currentEvent = events.find(e => e.id === eventId);
        if (currentEvent?.participantsList && currentEvent.participantsList.length > 0) {
          participantIds = currentEvent.participantsList.map((p: any) =>
            typeof p === 'string' ? p : p.userId || p.user_id
          ).filter(Boolean);
        }
      }

      if (participantIds.length === 0) {
        setParticipants([]);
        setShowParticipantsModal(true);
        return;
      }

      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, username, avatar_url')
        .in('id', participantIds);

      const formattedParticipants: Participant[] = (users || []).map((user: any) => {
        const registration = registrations?.find((r: any) => r.user_id === user.id);
        return {
          id: user.id,
          user_id: user.id,
          username: user.username || '未知用户',
          avatar_url: user.avatar_url,
          registered_at: registration?.created_at
            ? new Date(registration.created_at).getTime()
            : Date.now(),
          status: registration?.status === 'attended' ? 'attended' : 'registered',
          check_in_at: registration?.check_in_at
            ? new Date(registration.check_in_at).getTime()
            : undefined
        };
      });

      setParticipants(formattedParticipants);
      setShowParticipantsModal(true);
    } catch (error) {
      console.error('获取参与者失败:', error);
      toast.error('获取参与者失败');
    }
  };

  // 审核操作
  const handleApprove = async () => {
    if (!selectedEvent) return;
    try {
      await reviewEvent(selectedEvent.id, 'approved', reviewComment);
      toast.success('活动已通过审核');
      fetchEvents();
      setSelectedEvent(null);
      setReviewComment('');
    } catch (error) {
      toast.error('审核失败');
    }
  };

  const handleReject = async () => {
    if (!selectedEvent) return;
    try {
      await reviewEvent(selectedEvent.id, 'rejected', reviewComment);
      toast.success('活动已拒绝');
      fetchEvents();
      setSelectedEvent(null);
      setReviewComment('');
    } catch (error) {
      toast.error('审核失败');
    }
  };

  const handleUpdateStatus = async (eventId: string, status: EventStatus) => {
    try {
      const { error } = await supabaseAdmin
        .from('events')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', eventId);

      if (error) throw error;
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: status as any } : e));
      toast.success('状态已更新');
    } catch (error) {
      toast.error('更新失败');
    }
  };

  // 批量操作
  const handleBatchApprove = async () => {
    try {
      const eventIds = Array.from(selectedEvents);
      const { error } = await supabaseAdmin
        .from('events')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .in('id', eventIds);

      if (error) throw error;
      toast.success(`已批量通过 ${selectedEvents.size} 个活动`);
      setSelectedEvents(new Set());
      setIsBatchMode(false);
      fetchEvents();
    } catch (error) {
      toast.error('批量审核失败');
    }
  };

  const toggleEventSelection = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedEvents.size === filteredEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(filteredEvents.map(e => e.id)));
    }
  };

  // 筛选和排序
  const filteredEvents = useMemo(() => {
    return events
      .filter(event => {
        // 默认排除草稿状态的活动，除非用户明确选择查看草稿
        if (statusFilter === 'all' && event.status === 'draft') return false;
        if (statusFilter !== 'all' && event.status !== statusFilter) return false;
        if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [events, statusFilter, searchTerm]);

  // 初始化
  useEffect(() => {
    fetchEvents();
  }, []);

  // 格式化日期
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const formatFullDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  // 渲染统计视图
  const renderStatsView = () => (
    <div className="space-y-6">
      {/* 主统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <GradientStatCard
          title="活动总数"
          value={stats.totalEvents}
          subtitle="本月新增 12 个"
          icon={Layers}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
          trend={{ value: '12%', positive: true }}
          delay={0}
        />
        <GradientStatCard
          title="待审核"
          value={stats.pendingEvents}
          subtitle="需要尽快处理"
          icon={Timer}
          gradient="bg-gradient-to-br from-amber-400 to-orange-500"
          delay={0.1}
        />
        <GradientStatCard
          title="进行中"
          value={stats.ongoingEvents}
          subtitle="当前活跃活动"
          icon={Activity}
          gradient="bg-gradient-to-br from-emerald-400 to-teal-500"
          trend={{ value: '5%', positive: true }}
          delay={0.2}
        />
        <GradientStatCard
          title="总参与"
          value={stats.totalParticipants.toLocaleString()}
          subtitle="累计报名人数"
          icon={Users}
          gradient="bg-gradient-to-br from-blue-400 to-indigo-500"
          trend={{ value: '8%', positive: true }}
          delay={0.3}
        />
      </div>

      {/* 详细数据区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 活动趋势 */}
        <GlassCard isDark={isDark} className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">活动趋势</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>过去12个月的活动发布情况</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>发布数量</span>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-3">
            {Array.from({ length: 12 }, (_, i) => {
              const height = 25 + Math.random() * 75;
              const isHigh = height > 70;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
                    className={`w-full rounded-t-lg transition-all duration-300 cursor-pointer relative ${
                      isHigh
                        ? 'bg-gradient-to-t from-blue-500 to-blue-400'
                        : 'bg-gradient-to-t from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600'
                    } group-hover:from-blue-500 group-hover:to-blue-400`}
                  >
                    {/* 悬停提示 */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {Math.round(height * 2)} 个
                    </div>
                  </motion.div>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{i + 1}月</span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* 审核通过率 */}
        <GlassCard isDark={isDark} className="p-6">
          <h3 className="text-lg font-semibold mb-2">审核通过率</h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-6`}>活动审核的整体通过情况</p>
          <div className="flex items-center justify-center">
            <CircularProgress value={stats.approvalRate} size={140} strokeWidth={10} color="#10B981" />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已通过</p>
              <p className="text-xl font-bold text-emerald-500">
                {events.filter(e => ['approved', 'ongoing', 'ended'].includes(e.status)).length}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已拒绝</p>
              <p className="text-xl font-bold text-rose-500">
                {events.filter(e => e.status === 'rejected').length}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 分类分布 */}
      <GlassCard isDark={isDark} className="p-6">
        <h3 className="text-lg font-semibold mb-6">分类分布</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'} hover:bg-white/10 transition-colors cursor-pointer group`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: cat.color }}
                >
                  <Tag className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{cat.name}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{cat.event_count} 个活动</p>
                </div>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.totalEvents > 0 ? (cat.event_count / stats.totalEvents) * 100 : 0}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );

  // 渲染分类视图
  const renderCategoriesView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">活动分类</h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>管理活动分类和标签</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => toast.info('添加分类功能开发中')}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow"
        >
          <Plus className="w-4 h-4" />
          添加分类
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat, index) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <GlassCard isDark={isDark} className="p-6 group cursor-pointer" hover>
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110"
                  style={{ backgroundColor: cat.color, boxShadow: `0 8px 30px ${cat.color}40` }}
                >
                  <Tag className="w-7 h-7" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); toast.info('编辑功能开发中'); }}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}
                  >
                    <FileEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toast.info('删除功能开发中'); }}
                    className={`p-2 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h4 className="font-semibold text-xl mb-1">{cat.name}</h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-4`}>{cat.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{cat.event_count}</span>
                  <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>个活动</span>
                </div>
                <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-600' : 'text-gray-400'} group-hover:translate-x-1 transition-transform`} />
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // 渲染列表视图
  const renderListView = () => (
    <div className="space-y-6">
      {/* 快速筛选标签 */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: '全部活动', value: 'all', count: stats.totalEvents, color: 'from-gray-500 to-gray-600' },
          { label: '待审核', value: 'pending', count: stats.pendingEvents, color: 'from-amber-400 to-orange-500' },
          { label: '进行中', value: 'ongoing', count: stats.ongoingEvents, color: 'from-blue-400 to-indigo-500' },
          { label: '已结束', value: 'ended', count: stats.endedEvents, color: 'from-slate-400 to-slate-500' },
          { label: '草稿', value: 'draft', count: stats.draftEvents, color: 'from-purple-400 to-purple-500' },
        ].map((item) => (
          <motion.button
            key={item.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStatusFilter(item.value as EventStatus | 'all')}
            className={`relative overflow-hidden px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              statusFilter === item.value
                ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                : `${isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-white hover:bg-gray-50 text-gray-600'} border ${isDark ? 'border-white/10' : 'border-gray-200'}`
            }`}
          >
            <span className="flex items-center gap-2">
              {item.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                statusFilter === item.value ? 'bg-white/20' : isDark ? 'bg-white/10' : 'bg-gray-100'
              }`}>
                {item.count}
              </span>
            </span>
          </motion.button>
        ))}
      </div>

      {/* 工具栏 */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex gap-3 w-full lg:w-auto">
          <div className={`relative flex-1 lg:flex-none ${isDark ? 'bg-white/5' : 'bg-white'} rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} focus-within:ring-2 focus-within:ring-blue-500/50 transition-all`}>
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="搜索活动名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full lg:w-72 pl-10 pr-4 py-2.5 bg-transparent text-sm focus:outline-none rounded-xl`}
            />
          </div>
        </div>

        <div className="flex gap-2 w-full lg:w-auto">
          {isBatchMode && selectedEvents.size > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleBatchApprove}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-500/25"
            >
              <CheckCheck className="w-4 h-4" />
              批量通过 ({selectedEvents.size})
            </motion.button>
          )}
          <button
            onClick={() => setIsBatchMode(!isBatchMode)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isBatchMode
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                : `${isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-white hover:bg-gray-50 text-gray-600'} border ${isDark ? 'border-white/10' : 'border-gray-200'}`
            }`}
          >
            <Filter className="w-4 h-4" />
            批量模式
          </button>
          <button
            onClick={() => fetchEvents()}
            className={`p-2.5 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-gray-50'} border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <div className={`flex rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} overflow-hidden`}>
            <button
              onClick={() => setListViewMode('card')}
              className={`p-2.5 transition-all ${listViewMode === 'card' ? 'bg-blue-500 text-white' : isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-gray-50'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setListViewMode('table')}
              className={`p-2.5 transition-all ${listViewMode === 'table' ? 'bg-blue-500 text-white' : isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 批量选择提示 */}
      <AnimatePresence>
        {isBatchMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`flex items-center gap-4 p-4 rounded-xl ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'} border`}
          >
            <input
              type="checkbox"
              checked={selectedEvents.size === filteredEvents.length && filteredEvents.length > 0}
              onChange={toggleSelectAll}
              className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm">
              已选择 <span className="font-semibold text-blue-500">{selectedEvents.size}</span> 个活动
            </span>
            {selectedEvents.size > 0 && (
              <button
                onClick={() => setSelectedEvents(new Set())}
                className="text-sm text-gray-500 hover:text-gray-700 ml-auto"
              >
                清空选择
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 调试信息 */}
      {console.log('当前筛选:', statusFilter, '显示活动数:', filteredEvents.length, '活动状态:', filteredEvents.map(e => e.status))}

      {/* 活动列表 - 卡片视图 */}
      {listViewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`h-56 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-100'} animate-pulse`} />
              ))
            ) : filteredEvents.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`col-span-full py-20 text-center rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'} border ${isDark ? 'border-white/10' : 'border-gray-200'} border-dashed`}
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-blue-500" />
                </div>
                <p className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>暂无活动</p>
                <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>点击右上角创建新活动</p>
              </motion.div>
            ) : (
              filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <GlassCard isDark={isDark} className="group cursor-pointer h-full" hover>
                    {/* 封面图区域 */}
                    <div className="h-44 relative overflow-hidden">
                      {(() => {
                        // 获取图片URL的辅助函数
                        const getImageUrl = () => {
                          if (!event.media || event.media.length === 0) return null;
                          const firstMedia = event.media[0];
                          if (typeof firstMedia === 'string') return firstMedia;
                          if (firstMedia?.url) return firstMedia.url;
                          if (firstMedia?.src) return firstMedia.src;
                          if (firstMedia?.image_url) return firstMedia.image_url;
                          return null;
                        };
                        const imageUrl = getImageUrl();
                        const hasImage = !!imageUrl;
                        return (
                          <>
                            {hasImage && (
                              <img
                                src={imageUrl}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                onError={(e) => {
                                  // 图片加载失败时隐藏
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 flex items-center justify-center transition-opacity ${hasImage ? 'opacity-0' : 'opacity-100'}`}>
                              <Sparkles className="w-12 h-12 text-blue-400/50" />
                            </div>
                          </>
                        );
                      })()}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* 批量选择 */}
                      {isBatchMode && (
                        <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedEvents.has(event.id)}
                            onChange={() => toggleEventSelection(event.id)}
                            className="w-5 h-5 rounded border-white/30 bg-white/20 backdrop-blur"
                          />
                        </div>
                      )}

                      {/* 状态标签 */}
                      <div className="absolute top-4 right-4">
                        <StatusBadge status={event.status as EventStatus} />
                      </div>

                      {/* 底部信息 */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="font-semibold text-lg text-white line-clamp-1">{event.title}</h3>
                        <p className="text-white/70 text-sm mt-1">{formatDate(event.startTime)}</p>
                      </div>
                    </div>

                    {/* 内容区域 */}
                    <div className="p-5">
                      <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate max-w-[100px]">{event.location || '线上'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          <span>{event.participants_count || 0} 人</span>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                            isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                          查看
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); fetchParticipants(event.id); }}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                            isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                          }`}
                        >
                          <Users className="w-4 h-4" />
                          参与者
                        </button>
                        {event.status === 'pending' && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUpdateStatus(event.id, 'approved'); }}
                              className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUpdateStatus(event.id, 'rejected'); }}
                              className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 活动列表 - 表格视图 */}
      {listViewMode === 'table' && (
        <GlassCard isDark={isDark} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${isDark ? 'bg-white/5' : 'bg-gray-50/80'}`}>
                  {isBatchMode && (
                    <th className="px-6 py-4 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selectedEvents.size === filteredEvents.length && filteredEvents.length > 0}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 rounded border-gray-300"
                      />
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">活动信息</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">时间</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">状态</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">参与人数</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={isBatchMode ? 6 : 5} className="px-6 py-12 text-center">
                      <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-500" />
                    </td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={isBatchMode ? 6 : 5} className="px-6 py-12 text-center">
                      <Calendar className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                      <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>暂无活动</p>
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => (
                    <tr
                      key={event.id}
                      onClick={() => !isBatchMode && setSelectedEvent(event)}
                      className={`${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors cursor-pointer group`}
                    >
                      {isBatchMode && (
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedEvents.has(event.id)}
                            onChange={() => toggleEventSelection(event.id)}
                            className="w-5 h-5 rounded border-gray-300"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {event.location || '线上活动'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(event.startTime)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={event.status as EventStatus} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {event.participants_count || 0} / {event.maxParticipants || '不限'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'} transition-colors`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); fetchParticipants(event.id); }}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'} transition-colors`}
                          >
                            <Users className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">津脉活动管理</h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>管理和审核津脉平台所有活动</p>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow"
        >
          <Plus className="w-5 h-5" />
          创建活动
        </motion.button>
      </div>

      {/* 视图切换标签 */}
      <div className={`inline-flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
        {[
          { id: 'list' as const, label: '活动列表', icon: List },
          { id: 'stats' as const, label: '数据统计', icon: BarChart3 },
          { id: 'categories' as const, label: '分类管理', icon: Tag },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentView(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              currentView === tab.id
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : `${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {currentView === 'list' && renderListView()}
          {currentView === 'stats' && renderStatsView()}
          {currentView === 'categories' && renderCategoriesView()}
        </motion.div>
      </AnimatePresence>

      {/* 活动详情弹窗 */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-2xl`}
            >
              {/* 弹窗头部 */}
              <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${isDark ? 'border-white/10 bg-gray-900/95' : 'border-gray-100 bg-white/95'} backdrop-blur-xl`}>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">{selectedEvent.title}</h2>
                  <StatusBadge status={selectedEvent.status as EventStatus} />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedEvent.status}
                    onChange={(e) => handleUpdateStatus(selectedEvent.id, e.target.value as EventStatus)}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <option value="pending">待审核</option>
                    <option value="approved">已通过</option>
                    <option value="ongoing">进行中</option>
                    <option value="ended">已结束</option>
                    <option value="rejected">已拒绝</option>
                    <option value="draft">草稿</option>
                  </select>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 弹窗内容 */}
              <div className="p-6 space-y-6">
                {/* 信息网格 */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: '开始时间', value: formatFullDate(selectedEvent.startTime), icon: Clock },
                    { label: '结束时间', value: formatFullDate(selectedEvent.endTime), icon: Timer },
                    { label: '活动地点', value: selectedEvent.location || '线上活动', icon: MapPin },
                    { label: '参与人数', value: `${selectedEvent.participants_count || 0} / ${selectedEvent.maxParticipants || '不限'}`, icon: Users },
                  ].map((item, i) => (
                    <div key={i} className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <item.icon className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.label}</p>
                      </div>
                      <p className="font-medium">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* 描述 */}
                <div>
                  <h3 className="font-semibold mb-3">活动描述</h3>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                    {selectedEvent.description || '暂无描述'}
                  </p>
                </div>

                {/* 审核操作 */}
                {selectedEvent.status === 'pending' && (
                  <div className={`p-5 rounded-xl ${isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'} border`}>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5 text-amber-500" />
                      审核操作
                    </h3>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="输入审核意见（可选）..."
                      className={`w-full p-4 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}
                      rows={3}
                    />
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handleReject}
                        className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors"
                      >
                        拒绝
                      </button>
                      <button
                        onClick={handleApprove}
                        className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
                      >
                        通过
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 参与者弹窗 */}
      <AnimatePresence>
        {showParticipantsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowParticipantsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md max-h-[80vh] overflow-hidden rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-2xl flex flex-col`}
            >
              <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                <div>
                  <h3 className="text-lg font-bold">参与者列表</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>共 {participants.length} 人</p>
                </div>
                <button
                  onClick={() => setShowParticipantsModal(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {participants.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <Users className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>暂无参与者</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {participants.map((p) => (
                      <div key={p.id} className={`flex items-center gap-3 p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <img
                          src={p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`}
                          alt={p.username}
                          className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-700"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{p.username}</p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            报名于 {formatRelativeTime(p.registered_at)}
                          </p>
                        </div>
                        {p.status === 'attended' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                            已签到
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500">
                            已报名
                          </span>
                        )}
                      </div>
                    ))}
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
