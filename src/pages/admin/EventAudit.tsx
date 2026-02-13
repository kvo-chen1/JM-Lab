import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { useEventService } from '@/hooks/useEventService';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { Event } from '@/types';

// 审核类型
type AuditType = 'works' | 'events';

// 活动状态
type EventStatus = 'pending' | 'approved' | 'rejected' | 'ongoing' | 'ended' | 'cancelled';

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
  totalParticipants: number;
  averageAttendance: number;
}

// 活动分类接口
interface EventCategory {
  id: string;
  name: string;
  description: string;
  event_count: number;
  color: string;
}

// 扩展 Event 类型以适应 admin 需求
interface AdminEvent extends Event {
  category?: string;
  participantsList?: any[];
}

export default function EventAudit() {
  const { isDark } = useTheme();
  const { getEvents, reviewEvent } = useEventService();
  
  // 审核类型
  const [auditType, setAuditType] = useState<AuditType>('events');
  
  // 活动列表
  const [events, setEvents] = useState<AdminEvent[]>([]);
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  
  // 选中的活动
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  
  // 审核意见
  const [reviewComment, setReviewComment] = useState('');
  
  // 活动状态筛选
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  
  // 搜索关键词
  const [searchTerm, setSearchTerm] = useState('');
  
  // 活动统计
  const [stats, setStats] = useState<EventStats>({
    totalEvents: 0,
    pendingEvents: 0,
    ongoingEvents: 0,
    endedEvents: 0,
    totalParticipants: 0,
    averageAttendance: 0
  });
  
  // 参与者列表
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  
  // 活动分类
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // 当前视图
  const [currentView, setCurrentView] = useState<'list' | 'stats' | 'categories'>('list');
  
  // 批量选择
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);
  
  // 获取活动列表和分类
  useEffect(() => {
    fetchEvents(true); // 强制刷新缓存
    fetchCategories();
  }, []);
  
  // 获取活动列表
  const fetchEvents = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      console.log('[EventAudit] Fetching events...');
      
      // 从 Supabase 获取真实活动数据
      const { data: eventsData, error } = await supabaseAdmin
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[EventAudit] Supabase error:', error);
        throw error;
      }
      
      console.log('[EventAudit] Got events:', eventsData?.length || 0);
      
      // 转换数据格式
      const formattedEvents: AdminEvent[] = (eventsData || []).map((event: any) => ({
        id: event.id,
        title: event.title || event.name || '未命名活动',
        description: event.description || '',
        content: event.content || event.description || '',
        startTime: new Date(event.start_date || event.start_time || event.startTime),
        endTime: new Date(event.end_date || event.end_time || event.endTime),
        location: event.location || '',
        organizerId: event.organizer_id || event.creator_id || event.user_id || '',
        createdAt: new Date(event.created_at || Date.now()),
        updatedAt: new Date(event.updated_at || Date.now()),
        maxParticipants: event.max_participants || event.maxParticipants || 0,
        participants: event.participants_count || event.participants?.length || 0,
        participantsList: event.participants || [],
        category: event.category || 'other',
        tags: event.tags || [],
        media: event.media || event.images || [],
        isPublic: event.is_public !== false,
        type: event.type || event.event_type || 'offline',
        status: event.status || 'pending',
        viewCount: event.view_count || 0,
        shareCount: event.share_count || 0,
        likeCount: event.like_count || 0
      }));
      
      setEvents(formattedEvents);
      
      // 计算统计数据
      const now = new Date();
      const pendingCount = formattedEvents.filter(e => e.status === 'pending').length;
      console.log('[EventAudit] Pending events:', pendingCount);
      
      setStats({
        totalEvents: formattedEvents.length,
        pendingEvents: pendingCount,
        ongoingEvents: formattedEvents.filter(e => {
          const start = new Date(e.startTime);
          const end = new Date(e.endTime);
          return start <= now && end >= now;
        }).length,
        endedEvents: formattedEvents.filter(e => new Date(e.endTime) < now).length,
        totalParticipants: formattedEvents.reduce((sum, e) => sum + (typeof e.participants === 'number' ? e.participants : e.participantsList?.length || 0), 0),
        averageAttendance: formattedEvents.length > 0 
          ? Math.round(formattedEvents.reduce((sum, e) => sum + (typeof e.participants === 'number' ? e.participants : e.participantsList?.length || 0), 0) / formattedEvents.length)
          : 0
      });
    } catch (error) {
      console.error('[EventAudit] Fetch events error:', error);
      toast.error('获取活动列表失败，请稍后重试');
      setEvents([]);
      setStats({
        totalEvents: 0,
        pendingEvents: 0,
        ongoingEvents: 0,
        endedEvents: 0,
        totalParticipants: 0,
        averageAttendance: 0
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // 获取活动分类
  const fetchCategories = async () => {
    try {
      // 从 Supabase 获取活动分类数据
      const { data: categoriesData, error } = await supabaseAdmin
        .from('event_categories')
        .select('*');
      
      if (error) {
        console.warn('[EventAudit] 获取分类失败:', error);
        // 从现有活动统计生成分类
        const categoryMap = new Map<string, { name: string; count: number; color: string }>();
        events.forEach(event => {
          const cat = event.category || '其他';
          const existing = categoryMap.get(cat);
          if (existing) {
            existing.count++;
          } else {
            categoryMap.set(cat, {
              name: cat,
              count: 1,
              color: getCategoryColor(cat)
            });
          }
        });
        
        const generatedCategories: EventCategory[] = Array.from(categoryMap.entries()).map(([id, data], index) => ({
          id: id,
          name: data.name,
          description: `${data.name}类活动`,
          event_count: data.count,
          color: data.color
        }));
        
        setCategories(generatedCategories);
        return;
      }
      
      // 统计每个分类的活动数量
      const categoryCounts = new Map<string, number>();
      events.forEach(event => {
        const catId = event.category || 'other';
        categoryCounts.set(catId, (categoryCounts.get(catId) || 0) + 1);
      });
      
      const formattedCategories: EventCategory[] = (categoriesData || []).map((cat: any, index: number) => ({
        id: cat.id || `cat_${index}`,
        name: cat.name || cat.category_name || '未命名分类',
        description: cat.description || '',
        event_count: categoryCounts.get(cat.id) || categoryCounts.get(cat.name) || 0,
        color: cat.color || getCategoryColor(cat.name || cat.id)
      }));
      
      setCategories(formattedCategories);
    } catch (error) {
      console.error('[EventAudit] 获取分类失败:', error);
      setCategories([]);
    }
  };
  
  // 获取分类颜色
  const getCategoryColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      'workshop': '#3B82F6',
      'competition': '#EF4444',
      'exhibition': '#10B981',
      'lecture': '#F59E0B',
      'meetup': '#8B5CF6',
      'other': '#6B7280'
    };
    return colorMap[category] || '#6B7280';
  };
  
  // 获取参与者列表
  const fetchParticipants = async (eventId: string) => {
    try {
      setIsLoading(true);
      
      // 从 Supabase 获取真实的参与者数据
      // 尝试从 event_registrations 表获取
      const { data: registrations, error: regError } = await supabaseAdmin
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId);
      
      if (regError) {
        console.warn('[EventAudit] 从 event_registrations 获取失败:', regError);
      }
      
      // 如果 event_registrations 表不存在或没有数据，尝试从 events 表的 participants 字段获取
      let participantIds: string[] = [];
      
      if (registrations && registrations.length > 0) {
        participantIds = registrations.map((r: any) => r.user_id).filter(Boolean);
      } else {
        // 从当前选中的活动中获取参与者ID
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
      
      // 获取用户信息
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, username, avatar_url')
        .in('id', participantIds);
      
      if (usersError) {
        console.error('[EventAudit] 获取用户信息失败:', usersError);
        throw usersError;
      }
      
      // 格式化参与者数据
      const formattedParticipants: Participant[] = (users || []).map((user: any, index: number) => {
        const registration = registrations?.find((r: any) => r.user_id === user.id);
        return {
          id: user.id,
          user_id: user.id,
          username: user.username || '未知用户',
          avatar_url: user.avatar_url || `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=User%20avatar%20${index}`,
          registered_at: registration?.created_at 
            ? new Date(registration.created_at).getTime() 
            : Date.now() - Math.random() * 86400000 * 7,
          status: registration?.status === 'attended' ? 'attended' : 'registered',
          check_in_at: registration?.check_in_at 
            ? new Date(registration.check_in_at).getTime() 
            : undefined
        };
      });
      
      setParticipants(formattedParticipants);
      setShowParticipantsModal(true);
    } catch (error) {
      console.error('[EventAudit] 获取参与者列表失败:', error);
      toast.error('获取参与者列表失败');
      setParticipants([]);
      setShowParticipantsModal(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 审核通过
  const handleApprove = async () => {
    if (!selectedEvent) return;
    
    try {
      await reviewEvent(selectedEvent.id, 'approved', reviewComment);
      toast.success('活动已通过审核');
      fetchEvents();
      setSelectedEvent(null);
      setReviewComment('');
    } catch (error) {
      toast.error('审核失败，请稍后重试');
    }
  };
  
  // 审核拒绝
  const handleReject = async () => {
    if (!selectedEvent) return;
    
    try {
      await reviewEvent(selectedEvent.id, 'rejected', reviewComment);
      toast.success('活动已拒绝');
      fetchEvents();
      setSelectedEvent(null);
      setReviewComment('');
    } catch (error) {
      toast.error('审核失败，请稍后重试');
    }
  };
  
  // 批量审核
  const handleBatchApprove = async () => {
    try {
      setIsLoading(true);
      
      // 批量更新活动状态为 approved
      const eventIds = Array.from(selectedEvents);
      const { error } = await supabaseAdmin
        .from('events')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .in('id', eventIds);
      
      if (error) throw error;
      
      toast.success(`已批量通过 ${selectedEvents.size} 个活动`);
      setSelectedEvents(new Set());
      setIsBatchMode(false);
      fetchEvents();
    } catch (error) {
      console.error('[EventAudit] 批量审核失败:', error);
      toast.error('批量审核失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 更新活动状态
  const handleUpdateEventStatus = async (eventId: string, status: EventStatus) => {
    try {
      setIsLoading(true);
      
      // 使用 Supabase 更新活动状态
      const { error } = await supabaseAdmin
        .from('events')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);
      
      if (error) throw error;
      
      setEvents(prev => prev.map(e => 
        e.id === eventId ? { ...e, status: status as any } : e
      ));
      
      toast.success(`活动状态已更新为${getStatusName(status)}`);
    } catch (error) {
      console.error('[EventAudit] 更新活动状态失败:', error);
      toast.error('更新活动状态失败');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 切换批量选择
  const toggleEventSelection = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };
  
  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedEvents.size === filteredEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(filteredEvents.map(e => e.id)));
    }
  };
  
  // 筛选和排序活动
  const filteredEvents = events
    .filter(event => {
      if (statusFilter !== 'all' && event.status !== statusFilter) return false;
      if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // 格式化日期
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };
  
  // 格式化相对时间
  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };
  
  // 获取状态中文名称
  const getStatusName = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝',
      ongoing: '进行中',
      ended: '已结束',
      cancelled: '已取消'
    };
    return statusMap[status] || status;
  };
  
  // 获取状态样式
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-600';
      case 'approved':
        return 'bg-green-100 text-green-600';
      case 'rejected':
        return 'bg-red-100 text-red-600';
      case 'ongoing':
        return 'bg-blue-100 text-blue-600';
      case 'ended':
        return 'bg-gray-100 text-gray-600';
      case 'cancelled':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  // 获取活动类型名称
  const getEventTypeName = (type: string) => {
    return type === 'online' ? '线上活动' : '线下活动';
  };
  
  // 渲染统计视图
  const renderStatsView = () => (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold">{stats.totalEvents}</div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>活动总数</div>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingEvents}</div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>待审核</div>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-blue-600">{stats.ongoingEvents}</div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>进行中</div>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-gray-600">{stats.endedEvents}</div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>已结束</div>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-green-600">{stats.totalParticipants}</div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>总参与人数</div>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-purple-600">{stats.averageAttendance}</div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>平均参与人数</div>
        </div>
      </div>
      
      {/* 活动趋势图表占位 */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <h3 className="font-medium mb-4">活动趋势</h3>
        <div className="h-48 flex items-end justify-between gap-2">
          {Array(12).fill(null).map((_, i) => {
            const height = Math.random() * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full bg-red-600 rounded-t transition-all duration-500"
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-xs text-gray-500">{i + 1}月</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 分类分布 */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <h3 className="font-medium mb-4">活动分类分布</h3>
        <div className="space-y-3">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-4">
              <div className="w-24 text-sm">{cat.name}</div>
              <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(cat.event_count / stats.totalEvents) * 100}%`,
                    backgroundColor: cat.color
                  }}
                ></div>
              </div>
              <div className="w-12 text-right text-sm">{cat.event_count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  // 渲染分类管理视图
  const renderCategoriesView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">活动分类管理</h3>
        <button 
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          onClick={() => toast.info('添加分类功能开发中')}
        >
          <i className="fas fa-plus mr-2"></i>添加分类
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-start justify-between mb-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: cat.color }}
              >
                <i className="fas fa-tag text-xl"></i>
              </div>
              <div className="flex gap-2">
                <button 
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => toast.info('编辑分类功能开发中')}
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button 
                  className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                  onClick={() => toast.info('删除分类功能开发中')}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <h4 className="font-medium text-lg">{cat.name}</h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>{cat.description}</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{cat.event_count}</span>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>个活动</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
    >
      {/* 顶部导航 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold">活动管理</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCurrentView('list')}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${currentView === 'list' 
              ? 'bg-red-600 text-white' 
              : isDark 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
          >
            <i className="fas fa-list mr-2"></i>活动列表
          </button>
          <button
            onClick={() => setCurrentView('stats')}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${currentView === 'stats' 
              ? 'bg-red-600 text-white' 
              : isDark 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
          >
            <i className="fas fa-chart-bar mr-2"></i>数据统计
          </button>
          <button
            onClick={() => setCurrentView('categories')}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${currentView === 'categories' 
              ? 'bg-red-600 text-white' 
              : isDark 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
          >
            <i className="fas fa-tags mr-2"></i>分类管理
          </button>
        </div>
      </div>
      
      {currentView === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 活动列表 */}
          <div className="lg:col-span-1">
            {/* 筛选和搜索 */}
            <div className="mb-4 space-y-2">
              <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full px-4 py-2`}>
                <input
                  type="text"
                  placeholder="搜索活动..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-sm"
                />
                <i className={`fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}></i>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as EventStatus | 'all')}
                className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
              >
                <option value="all">全部状态</option>
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="ongoing">进行中</option>
                <option value="ended">已结束</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
            
            {/* 批量操作 */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBatchMode(!isBatchMode)}
                  className={`text-sm px-3 py-1 rounded ${isBatchMode ? 'bg-red-600 text-white' : isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  批量模式
                </button>
                <button
                  onClick={() => fetchEvents(true)}
                  className="text-sm px-3 py-1 rounded bg-blue-600 text-white"
                >
                  刷新
                </button>
                {isBatchMode && (
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm px-3 py-1 rounded bg-blue-600 text-white"
                  >
                    全选
                  </button>
                )}
              </div>
              {isBatchMode && selectedEvents.size > 0 && (
                <button
                  onClick={handleBatchApprove}
                  className="text-sm px-3 py-1 rounded bg-green-600 text-white"
                >
                  批量通过 ({selectedEvents.size})
                </button>
              )}
            </div>
            
            <div className="rounded-xl border overflow-hidden shadow-sm">
              <div className={`p-4 font-medium ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                活动列表 ({filteredEvents.length})
              </div>
              
              {isLoading ? (
                <div className="p-8 text-center">
                  <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-2"></i>
                  <p>加载中...</p>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="p-8 text-center">
                  <i className="fas fa-check-circle text-4xl text-green-500 mb-2"></i>
                  <p>暂无符合条件的活动</p>
                </div>
              ) : (
                <div className="divide-y max-h-[calc(100vh-400px)] overflow-y-auto">
                  {filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-4 cursor-pointer transition-colors duration-200 ${selectedEvent?.id === event.id 
                        ? isDark ? 'bg-gray-700' : 'bg-blue-50' 
                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                      onClick={() => isBatchMode ? toggleEventSelection(event.id) : setSelectedEvent(event)}
                    >
                      {isBatchMode && (
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={selectedEvents.has(event.id)}
                            onChange={() => toggleEventSelection(event.id)}
                            className="w-4 h-4 rounded border-gray-300"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium line-clamp-1 flex-1">{event.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${getStatusBadgeClass(event.status || 'pending')}`}>
                          {getStatusName(event.status || 'pending')}
                        </span>
                      </div>
                      <div className="flex items-center text-sm mb-1">
                        <i className="fas fa-calendar-alt mr-1 text-gray-400"></i>
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatDate(event.startTime)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm mb-1">
                        <i className="fas fa-user mr-1 text-gray-400"></i>
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          组织者: {event.organizerId}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <i className="fas fa-users mr-1"></i>
                          {typeof event.participants === 'number' ? event.participants : event.participantsList?.length || 0} / {event.maxParticipants || '不限'} 人
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchParticipants(event.id);
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          查看参与者
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* 活动详情和审核表单 */}
          <div className="lg:col-span-2">
            {selectedEvent ? (
              <div className="rounded-xl border overflow-hidden shadow-sm">
                {/* 活动详情 */}
                <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} flex justify-between items-center`}>
                  <h3 className="font-medium">活动详情</h3>
                  <div className="flex gap-2">
                    <select
                      value={selectedEvent.status}
                      onChange={(e) => handleUpdateEventStatus(selectedEvent.id, e.target.value as EventStatus)}
                      className={`px-3 py-1 rounded text-sm ${isDark ? 'bg-gray-600' : 'bg-white'} border`}
                    >
                      <option value="pending">待审核</option>
                      <option value="approved">已通过</option>
                      <option value="ongoing">进行中</option>
                      <option value="ended">已结束</option>
                      <option value="cancelled">已取消</option>
                    </select>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-medium mb-2">基本信息</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium mb-1">活动名称</label>
                          <p>{selectedEvent.title}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">活动类型</label>
                          <p>{getEventTypeName(selectedEvent.type)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">活动地点</label>
                          <p>{selectedEvent.location || '未设置'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">分类</label>
                          <p>{selectedEvent.category || '未分类'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">时间信息</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium mb-1">开始时间</label>
                          <p>{formatDate(selectedEvent.startTime)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">结束时间</label>
                          <p>{formatDate(selectedEvent.endTime)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">创建时间</label>
                          <p>{formatDate(selectedEvent.createdAt)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">人数限制</label>
                          <p>{selectedEvent.maxParticipants || '不限'} 人</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">活动描述</h4>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{selectedEvent.description}</p>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">活动内容</h4>
                    <div 
                      className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} overflow-auto max-h-40`}
                      dangerouslySetInnerHTML={{ __html: selectedEvent.content }}
                    />
                  </div>
                  
                  {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium mb-2">标签</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedEvent.tags.map((tag, index) => (
                          <span key={index} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedEvent.media && selectedEvent.media.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium mb-2">多媒体资源</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedEvent.media.slice(0, 3).map((media) => (
                          <div key={media.id} className="aspect-square rounded-lg overflow-hidden">
                            {media.type === 'image' ? (
                              <img
                                src={media.url}
                                alt={media.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <i className="fas fa-video text-2xl text-gray-400"></i>
                              </div>
                            )}
                          </div>
                        ))}
                        {selectedEvent.media.length > 3 && (
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-sm">+{selectedEvent.media.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 审核表单 */}
                {selectedEvent.status === 'pending' && (
                  <>
                    <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <h3 className="font-medium">审核操作</h3>
                    </div>
                    
                    <div className="p-6">
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">审核意见（可选）</label>
                        <textarea
                          className={`w-full p-3 rounded-lg ${isDark 
                            ? 'bg-gray-700 border border-gray-600' 
                            : 'bg-white border border-gray-200'}`}
                          rows={4}
                          placeholder="请输入审核意见..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                        ></textarea>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={handleReject}
                          className={`flex-1 py-2 px-4 rounded-lg transition-colors duration-200 ${isDark 
                            ? 'bg-red-700 hover:bg-red-600 text-white' 
                            : 'bg-red-100 hover:bg-red-200 text-red-800'}`}
                        >
                          拒绝
                        </button>
                        <button
                          onClick={handleApprove}
                          className={`flex-1 py-2 px-4 rounded-lg transition-colors duration-200 ${isDark 
                            ? 'bg-green-700 hover:bg-green-600 text-white' 
                            : 'bg-green-100 hover:bg-green-200 text-green-800'}`}
                        >
                          通过
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="p-12 text-center">
                <i className="fas fa-info-circle text-4xl text-gray-400 mb-4"></i>
                <h3 className="text-lg font-medium mb-2">请选择一个活动查看详情</h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  从左侧列表中选择一个活动，查看详情并进行管理操作
                </p>
              </div>
            )}
          </div>
        </div>
      ) : currentView === 'stats' ? (
        renderStatsView()
      ) : (
        renderCategoriesView()
      )}
      
      {/* 参与者列表弹窗 */}
      <AnimatePresence>
        {showParticipantsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowParticipantsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">参与者列表 ({participants.length})</h3>
                <button 
                  onClick={() => setShowParticipantsModal(false)}
                  className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div 
                      key={participant.id} 
                      className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={participant.avatar_url} 
                          alt={participant.username}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="font-medium">{participant.username}</div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            报名于 {formatRelativeTime(participant.registered_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {participant.status === 'attended' ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-600">
                            <i className="fas fa-check mr-1"></i>已签到
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-600">
                            已报名
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-600">
                <button
                  onClick={() => toast.info('导出功能开发中')}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <i className="fas fa-download mr-2"></i>导出名单
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
