import { useState, useContext, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { Event } from '@/types';
import { useEventService } from '@/hooks/useEventService';
import { TianjinButton } from '@/components/TianjinStyleComponents';
import eventBus from '@/services/enhancedEventBus';

// 导入UI组件
import { Input, Select, Checkbox } from '@/components/ui/Form';
import { Pagination } from '@/components/ui/Pagination';
import { EventCard } from '@/components/EventCard';

// 活动状态筛选类型
type StatusFilter = 'all' | 'draft' | 'pending' | 'published' | 'rejected';

export default function ActivityList() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { getEvents, getUserEvents, deleteEvent } = useEventService();
  
  // 活动列表
  const [events, setEvents] = useState<Event[]>([]);
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  
  // 筛选条件
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'online' | 'offline'>('all');
  
  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
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
    // 活动创建事件
    const handleEventCreated = (event: Event) => {
      setEvents(prev => [...prev, event]);
    };
    
    // 活动更新事件
    const handleEventUpdated = (updatedEvent: { id: string, [key: string]: any }) => {
      setEvents(prev => prev.map(event => 
        event.id === updatedEvent.id ? { ...event, ...updatedEvent } : event
      ));
    };
    
    // 活动删除事件
    const handleEventDeleted = (deletedEvent: { id: string }) => {
      setEvents(prev => prev.filter(event => event.id !== deletedEvent.id));
    };
    
    // 注册事件监听器
    eventBus.on('event:created', handleEventCreated);
    eventBus.on('event:updated', handleEventUpdated);
    eventBus.on('event:deleted', handleEventDeleted);
    
    // 清理事件监听器
    return () => {
      eventBus.off('event:created', handleEventCreated);
      eventBus.off('event:updated', handleEventUpdated);
      eventBus.off('event:deleted', handleEventDeleted);
    };
  }, []);
  
  // 筛选变化时重新获取数据
  useEffect(() => {
    fetchEvents();
  }, [statusFilter, typeFilter, currentPage, pageSize]);
  
  // 获取活动列表
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 这里应该根据用户权限获取活动列表
      // 管理员可以查看所有活动，普通用户只能查看自己创建的活动
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
      // 模拟总页数，实际应该从API返回
      setTotalPages(Math.ceil(eventsData.length / pageSize));
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
    // 这里应该调用更新活动状态的API
    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, status: newStatus } : event
    ));
    toast.success(`活动状态已更新为${getStatusLabel(newStatus)}`);
  };
  
  // 获取状态标签
  const getStatusLabel = (status: Event['status']) => {
    const statusMap: Record<Event['status'], string> = {
      draft: '草稿',
      pending: '审核中',
      published: '已发布',
      rejected: '已拒绝'
    };
    return statusMap[status];
  };
  
  // 获取状态样式
  const getStatusStyle = (status: Event['status']) => {
    const styleMap: Record<Event['status'], string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return styleMap[status];
  };
  
  // 格式化日期
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));
  };
  
  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* 页面标题和操作按钮 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">活动管理</h1>
          <TianjinButton 
            onClick={() => navigate('/create-activity')}
          >
            <i className="fas fa-plus mr-2"></i>
            创建活动
          </TianjinButton>
        </div>
        
        {/* 筛选和搜索区域 */}
        <div className={`rounded-xl p-4 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 搜索框 */}
              <div className="md:col-span-3 lg:col-span-1">
                <Input
                  placeholder="搜索活动名称或描述"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              
              {/* 状态筛选 */}
              <div>
                <Select
                  label="状态"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  options={[
                    { value: 'all', label: '全部状态' },
                    { value: 'draft', label: '草稿' },
                    { value: 'pending', label: '审核中' },
                    { value: 'published', label: '已发布' },
                    { value: 'rejected', label: '已拒绝' }
                  ]}
                />
              </div>
              
              {/* 类型筛选 */}
              <div>
                <Select
                  label="类型"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as 'all' | 'online' | 'offline')}
                  options={[
                    { value: 'all', label: '全部类型' },
                    { value: 'online', label: '线上活动' },
                    { value: 'offline', label: '线下活动' }
                  ]}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <TianjinButton 
                type="submit"
                disabled={isLoading}
              >
                <i className="fas fa-search mr-2"></i>
                搜索
              </TianjinButton>
            </div>
          </form>
        </div>
        
        {/* 活动列表 */}
        <div className={`rounded-xl overflow-hidden shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          {isLoading ? (
            // 加载状态
            <div className="p-8 text-center">
              <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
              <p>加载中...</p>
            </div>
          ) : events.length === 0 ? (
            // 空状态
            <div className="p-8 text-center">
              <i className="fas fa-calendar-times text-4xl text-gray-400 mb-4"></i>
              <p>暂无活动</p>
              <TianjinButton 
                onClick={() => navigate('/create-activity')}
                className="mt-4"
              >
                <i className="fas fa-plus mr-2"></i>
                创建第一个活动
              </TianjinButton>
            </div>
          ) : (
            // 活动列表
            <div>
              {/* 列表头部 */}
              <div className={`grid grid-cols-12 p-4 font-medium ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="col-span-6">活动信息</div>
                <div className="col-span-2">状态</div>
                <div className="col-span-2">时间</div>
                <div className="col-span-2">操作</div>
              </div>
              
              {/* 列表内容 */}
              <div className="divide-y">
                {events.map((event) => (
                  <div 
                    key={event.id}
                    className={`grid grid-cols-12 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200`}
                  >
                    {/* 活动信息 */}
                    <div className="col-span-6 flex items-center">
                      <div className="mr-4 w-20 h-12 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                        {event.thumbnailUrl && (
                          <img
                            src={event.thumbnailUrl}
                            alt={event.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                            }}
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium line-clamp-1">{event.title}</h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} line-clamp-1`}>
                          {event.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* 状态 */}
                    <div className="col-span-2 flex items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(event.status)}`}>
                        {getStatusLabel(event.status)}
                      </span>
                    </div>
                    
                    {/* 时间 */}
                    <div className="col-span-2 flex items-center text-sm">
                      {formatDate(event.startTime)} - {formatDate(event.endTime)}
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="col-span-2 flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/activities/${event.id}`)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors duration-200 ${isDark 
                          ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                      >
                        <i className="fas fa-eye mr-1"></i>
                        预览
                      </button>
                      
                      <button
                        onClick={() => navigate(`/edit-activity/${event.id}`)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors duration-200 ${isDark 
                          ? 'bg-blue-700 hover:bg-blue-600 text-white' 
                          : 'bg-blue-100 hover:bg-blue-200 text-blue-800'}`}
                      >
                        <i className="fas fa-edit mr-1"></i>
                        编辑
                      </button>
                      
                      {event.status === 'draft' && (
                        <button
                          onClick={() => handleStatusUpdate(event.id, 'pending')}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors duration-200 ${isDark 
                            ? 'bg-green-700 hover:bg-green-600 text-white' 
                            : 'bg-green-100 hover:bg-green-200 text-green-800'}`}
                        >
                          <i className="fas fa-paper-plane mr-1"></i>
                          提交
                        </button>
                      )}
                      
                      {event.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(event.id, 'draft')}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors duration-200 ${isDark 
                            ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                        >
                          <i className="fas fa-times mr-1"></i>
                          撤回
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors duration-200 ${isDark 
                          ? 'bg-red-700 hover:bg-red-600 text-white' 
                          : 'bg-red-100 hover:bg-red-200 text-red-800'}`}
                      >
                        <i className="fas fa-trash mr-1"></i>
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* 分页 */}
        {!isLoading && events.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>
    </div>
  );
}