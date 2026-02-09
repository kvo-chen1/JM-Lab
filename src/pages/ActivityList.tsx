import { useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { Event } from '@/types';
import { useEventService } from '@/hooks/useEventService';
import { InfoCard, StatCard } from '@/components/InfoCard';
import eventBus from '@/services/enhancedEventBus';
import {
  CalendarDays,
  Users,
  Eye,
  Heart,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit3,
  Trash2,
  Send,
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  ChevronRight,
  LayoutGrid,
  List
} from 'lucide-react';

// 活动状态筛选类型
type StatusFilter = 'all' | 'draft' | 'pending' | 'published' | 'rejected';
type ViewMode = 'list' | 'grid';

// 状态配置
const statusConfig = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', icon: FileText },
  pending: { label: '审核中', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: Clock },
  published: { label: '已发布', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle2 },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: XCircle }
};

export default function ActivityList() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { getEvents, getUserEvents, deleteEvent } = useEventService();

  // 活动列表
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // 筛选条件
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'online' | 'offline'>('all');

  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // 初始化数据
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    fetchEvents();
  }, [isAuthenticated, user, navigate]);

  // 监听数据同步事件
  useEffect(() => {
    const handleEventCreated = (event: Event) => setEvents(prev => [event, ...prev]);
    const handleEventUpdated = (updatedEvent: { id: string, [key: string]: any }) => {
      setEvents(prev => prev.map(event => event.id === updatedEvent.id ? { ...event, ...updatedEvent } : event));
    };
    const handleEventDeleted = (deletedEvent: { id: string }) => {
      setEvents(prev => prev.filter(event => event.id !== deletedEvent.id));
    };

    eventBus.on('event:created', handleEventCreated);
    eventBus.on('event:updated', handleEventUpdated);
    eventBus.on('event:deleted', handleEventDeleted);

    return () => {
      eventBus.off('event:created', handleEventCreated);
      eventBus.off('event:updated', handleEventUpdated);
      eventBus.off('event:deleted', handleEventDeleted);
    };
  }, []);

  // 筛选变化时重新获取数据
  useEffect(() => {
    fetchEvents();
  }, [statusFilter, typeFilter, currentPage]);

  // 获取活动列表
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      let eventsData: Event[] = [];

      if (user?.isAdmin) {
        eventsData = await getEvents({
          search: searchQuery,
          status: statusFilter === 'all' ? undefined : statusFilter,
          type: typeFilter === 'all' ? undefined : typeFilter,
          page: currentPage,
          pageSize: pageSize,
        }) || [];
      } else {
        eventsData = await getUserEvents(user?.id || '', {
          search: searchQuery,
          status: statusFilter === 'all' ? undefined : statusFilter,
          type: typeFilter === 'all' ? undefined : typeFilter,
          page: currentPage,
          pageSize: pageSize,
        }) || [];
      }

      setEvents(eventsData);
    } catch (error) {
      toast.error('获取活动列表失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, [user, getEvents, getUserEvents, searchQuery, statusFilter, typeFilter, currentPage, pageSize]);

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEvents();
  };

  // 处理删除活动
  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('确定要删除这个活动吗？此操作不可恢复。')) {
      try {
        await deleteEvent(eventId);
        setEvents(prev => prev.filter(event => event.id !== eventId));
        toast.success('活动已删除');
      } catch (error) {
        toast.error('删除活动失败，请稍后重试');
      }
    }
  };

  // 处理状态更新
  const handleStatusUpdate = (eventId: string, newStatus: Event['status']) => {
    setEvents(prev => prev.map(event =>
      event.id === eventId ? { ...event, status: newStatus } : event
    ));
    toast.success(`活动状态已更新为${statusConfig[newStatus].label}`);
  };

  // 统计数据
  const stats = useMemo(() => {
    const total = events.length;
    const published = events.filter(e => e.status === 'published').length;
    const pending = events.filter(e => e.status === 'pending').length;
    const draft = events.filter(e => e.status === 'draft').length;
    const totalViews = events.reduce((sum, e) => sum + (e.viewCount || 0), 0);
    const totalParticipants = events.reduce((sum, e) => sum + (e.participants || 0), 0);

    return { total, published, pending, draft, totalViews, totalParticipants };
  }, [events]);

  // 即将开始的活动
  const upcomingEvents = useMemo(() => {
    return events
      .filter(e => e.status === 'published' && new Date(e.startTime) > new Date())
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5);
  }, [events]);

  // 格式化日期
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">活动管理</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">管理和查看所有活动</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/create/activity')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl shadow-primary transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            创建活动
          </motion.button>
        </motion.div>

        {/* 三栏布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左栏：统计概览 + 快捷筛选 (2列) */}
          <div className="lg:col-span-3 xl:col-span-2 space-y-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              <StatCard
                label="总活动数"
                value={stats.total}
                icon={<CalendarDays className="w-5 h-5" />}
              />
              <StatCard
                label="已发布"
                value={stats.published}
                icon={<CheckCircle2 className="w-5 h-5" />}
                trend="up"
              />
              <StatCard
                label="审核中"
                value={stats.pending}
                icon={<Clock className="w-5 h-5" />}
              />
              <StatCard
                label="总浏览"
                value={stats.totalViews.toLocaleString()}
                icon={<Eye className="w-5 h-5" />}
              />
            </div>

            {/* 快捷筛选 */}
            <InfoCard title="快速筛选" icon={<Filter className="w-5 h-5" />}>
              <div className="space-y-3">
                {(['all', 'published', 'pending', 'draft', 'rejected'] as StatusFilter[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      statusFilter === status
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {status === 'all' ? (
                        <LayoutGrid className="w-4 h-4" />
                      ) : (
                        <span className={`w-2 h-2 rounded-full ${statusConfig[status]?.color.split(' ')[0] || 'bg-gray-300'}`} />
                      )}
                      {status === 'all' ? '全部活动' : statusConfig[status]?.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {status === 'all' ? stats.total : events.filter(e => e.status === status).length}
                    </span>
                  </button>
                ))}
              </div>
            </InfoCard>

            {/* 即将开始的活动 */}
            {upcomingEvents.length > 0 && (
              <InfoCard title="即将开始" icon={<CalendarDays className="w-5 h-5" />} variant="primary">
                <div className="space-y-3">
                  {upcomingEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => navigate(`/activities/${event.id}`)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-bold">
                        {new Date(event.startTime).getDate()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <p className="text-xs text-gray-500">{formatDate(event.startTime)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </InfoCard>
            )}
          </div>

          {/* 中栏：活动列表 (7列) */}
          <div className="lg:col-span-6 xl:col-span-7">
            {/* 搜索和筛选 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-xl p-4 mb-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-card`}
            >
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索活动名称或描述..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-all duration-200 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-primary-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary-500'
                    } focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as 'all' | 'online' | 'offline')}
                    className={`px-4 py-2.5 rounded-lg border text-sm ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                  >
                    <option value="all">全部类型</option>
                    <option value="online">线上活动</option>
                    <option value="offline">线下活动</option>
                  </select>
                  <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>

            {/* 活动列表 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-card`}
            >
              {isLoading ? (
                <div className="p-16 text-center">
                  <motion.div
                    className="inline-block"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full" />
                  </motion.div>
                  <p className="mt-4 text-gray-500">加载中...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="p-16 text-center">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <CalendarDays className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">暂无活动</h3>
                  <p className="mt-2 text-gray-500">您还没有创建任何活动</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/create/activity')}
                    className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    创建第一个活动
                  </motion.button>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 p-4' : 'divide-y divide-gray-100 dark:divide-gray-700'}>
                  <AnimatePresence>
                    {events.map((event, index) => {
                      const StatusIcon = statusConfig[event.status].icon;

                      if (viewMode === 'grid') {
                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ y: -4 }}
                            className={`rounded-xl overflow-hidden border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-card hover:shadow-card-hover transition-all cursor-pointer`}
                            onClick={() => navigate(`/activities/${event.id}`)}
                          >
                            <div className="aspect-video relative">
                              {event.thumbnailUrl ? (
                                <img
                                  src={event.thumbnailUrl}
                                  alt={event.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                  <CalendarDays className="w-12 h-12 text-gray-400" />
                                </div>
                              )}
                              <div className="absolute top-3 left-3">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[event.status].color}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {statusConfig[event.status].label}
                                </span>
                              </div>
                            </div>
                            <div className="p-4">
                              <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{event.title}</h3>
                              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{event.description}</p>
                              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="w-3.5 h-3.5" />
                                  {formatDate(event.startTime)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5" />
                                  {event.participants || 0}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      }

                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className="group flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          {/* 封面 */}
                          <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                            {event.thumbnailUrl ? (
                              <img
                                src={event.thumbnailUrl}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <CalendarDays className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* 信息 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate">{event.title}</h3>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[event.status].color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusConfig[event.status].label}
                              </span>
                            </div>
                            <p className="mt-0.5 text-sm text-gray-500 truncate">{event.description}</p>
                            <div className="mt-1 flex items-center gap-4 text-xs text-gray-400">
                              <span>{formatDate(event.startTime)}</span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" /> {event.viewCount || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" /> {event.participants || 0}
                              </span>
                            </div>
                          </div>

                          {/* 操作 */}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => { e.stopPropagation(); navigate(`/activities/${event.id}`); }}
                              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => { e.stopPropagation(); navigate(`/edit-activity/${event.id}`); }}
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              <Edit3 className="w-4 h-4" />
                            </motion.button>
                            {event.status === 'draft' && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(event.id, 'pending'); }}
                                className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                              >
                                <Send className="w-4 h-4" />
                              </motion.button>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>

            {/* 分页 */}
            {!isLoading && events.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  共 {events.length} 个活动
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    上一页
                  </button>
                  <span className="px-4 py-2 text-sm">第 {currentPage} 页</span>
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={events.length < pageSize}
                    className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 右栏：活动日历 + 快捷操作 (3列) */}
          <div className="lg:col-span-3 space-y-6">
            {/* 快捷操作 */}
            <InfoCard title="快捷操作" icon={<MoreHorizontal className="w-5 h-5" />}>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/create/activity')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors text-left"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">创建新活动</span>
                </button>
                <button
                  onClick={() => setStatusFilter('draft')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors text-left"
                >
                  <FileText className="w-5 h-5" />
                  <span>查看草稿</span>
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors text-left"
                >
                  <Clock className="w-5 h-5" />
                  <span>审核中的活动</span>
                </button>
              </div>
            </InfoCard>

            {/* 活动日历 */}
            <InfoCard title="活动日历" icon={<CalendarDays className="w-5 h-5" />}>
              <ActivityMiniCalendar events={events} />
            </InfoCard>

            {/* 帮助提示 */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-primary-900/10 border-primary-800' : 'bg-primary-50 border-primary-200'} border`}>
              <h4 className="font-medium text-primary-700 dark:text-primary-300 mb-2">💡 小贴士</h4>
              <p className="text-sm text-primary-600 dark:text-primary-400">
                优质的活动封面和详细的描述能吸引更多参与者。记得添加活动标签，方便用户搜索发现。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 迷你日历组件
function ActivityMiniCalendar({ events }: { events: Event[] }) {
  const { isDark } = useTheme();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const days = ['日', '一', '二', '三', '四', '五', '六'];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const hasEventOnDay = (day: number) => {
    return events.some(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.getDate() === day &&
             eventDate.getMonth() === currentMonth &&
             eventDate.getFullYear() === currentYear;
    });
  };

  const isToday = (day: number) => {
    return today.getDate() === day &&
           today.getMonth() === currentMonth &&
           today.getFullYear() === currentYear;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            if (currentMonth === 0) {
              setCurrentMonth(11);
              setCurrentYear(currentYear - 1);
            } else {
              setCurrentMonth(currentMonth - 1);
            }
          }}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
        <span className="font-medium">{currentYear}年 {monthNames[currentMonth]}</span>
        <button
          onClick={() => {
            if (currentMonth === 11) {
              setCurrentMonth(0);
              setCurrentYear(currentYear + 1);
            } else {
              setCurrentMonth(currentMonth + 1);
            }
          }}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map(day => (
          <div key={day} className="text-xs text-gray-500 py-1">{day}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const hasEvent = hasEventOnDay(day);
          const isTodayDate = isToday(day);

          return (
            <div
              key={day}
              className={`
                aspect-square flex items-center justify-center text-sm rounded-lg cursor-pointer transition-all
                ${isTodayDate ? 'bg-primary-500 text-white font-bold' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                ${hasEvent && !isTodayDate ? 'font-semibold text-primary-600 dark:text-primary-400' : ''}
              `}
            >
              {day}
              {hasEvent && (
                <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isTodayDate ? 'bg-white' : 'bg-primary-500'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
