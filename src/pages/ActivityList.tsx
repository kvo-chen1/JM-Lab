import { useState, useContext, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { Event } from '@/types';
import { useEventService } from '@/hooks/useEventService';
import { TianjinButton } from '@/components/TianjinStyleComponents';
import eventBus from '@/services/enhancedEventBus';

// 导入UI组件
import { Input, Select } from '@/components/ui/Form';
import { Pagination } from '@/components/ui/Pagination';

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
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
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
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* 页面容器 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题和操作按钮 */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold tracking-tight">活动管理</h1>
            <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>管理和查看所有活动</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/create-activity')}
            className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm ${isDark 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'} transition-all duration-200`}
          >
            <i className="fas fa-plus mr-2"></i>
            创建活动
          </motion.button>
        </motion.div>
        
        {/* 筛选和搜索区域 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={`rounded-xl p-6 mb-8 ${isDark ? 'bg-gray-800/50 backdrop-blur-sm' : 'bg-white'} shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
        >
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 搜索框 */}
              <div className="md:col-span-3 lg:col-span-1">
                <div className="relative">
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <Input
                    placeholder="搜索活动名称或描述"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 w-full rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                  />
                </div>
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
                  className={`rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
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
                  className={`rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isLoading}
                className={`inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm ${isDark 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'} transition-all duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    搜索中...
                  </>
                ) : (
                  <>
                    <i className="fas fa-search mr-2"></i>
                    搜索
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
        
        {/* 活动列表 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className={`rounded-xl overflow-hidden shadow-lg ${isDark ? 'bg-gray-800/50 backdrop-blur-sm' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
        >
          {isLoading ? (
            // 加载状态
            <div className="p-16 text-center">
              <motion.div 
                className={`inline-block p-4 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <i className="fas fa-circle-notch text-3xl text-blue-500"></i>
              </motion.div>
              <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>加载中...</p>
            </div>
          ) : events.length === 0 ? (
            // 空状态
            <div className="p-16 text-center">
              <div className={`inline-block p-4 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <i className="fas fa-calendar-times text-3xl text-gray-400"></i>
              </div>
              <h3 className="mt-4 text-lg font-medium">暂无活动</h3>
              <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>您还没有创建任何活动</p>
              <motion.button
                        whileHover={{ scale: 1.05, boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/create-activity')}
                        className={`mt-6 inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm ${isDark 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'} transition-all duration-200`}
                      >
                        <motion.i 
                          className="fas fa-plus mr-2"
                          whileHover={{ rotate: 90 }}
                          transition={{ duration: 0.3 }}
                        ></motion.i>
                        创建第一个活动
                      </motion.button>
            </div>
          ) : (
            // 活动列表
            <div>
              {/* 列表头部 */}
              <div className={`grid grid-cols-12 px-6 py-4 font-medium ${isDark ? 'bg-gray-700/80' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="col-span-12 sm:col-span-6">活动信息</div>
                <div className="col-span-6 sm:col-span-2">状态</div>
                <div className="col-span-6 sm:col-span-2">时间</div>
                <div className="col-span-12 sm:col-span-2">操作</div>
              </div>
              
              {/* 列表内容 */}
              <div className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {events.map((event, index) => (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * index }}
                    className={`grid grid-cols-12 px-6 py-5 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-all duration-200`}
                  >
                    {/* 活动信息 */}
                    <div className="col-span-12 sm:col-span-6 flex items-center">
                      <div className="mr-4 w-24 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                        {event.thumbnailUrl ? (
                          <img
                            src={event.thumbnailUrl}
                            alt={event.title}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=abstract%20event%20placeholder%20image%20minimal%20design&image_size=square';
                            }}
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                            <i className="fas fa-calendar-alt text-2xl"></i>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium line-clamp-1 text-sm sm:text-base">{event.title}</h3>
                        <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} line-clamp-1`}>
                          {event.description || '无描述'}
                        </p>
                      </div>
                    </div>
                    
                    {/* 状态 */}
                    <div className="col-span-6 sm:col-span-2 flex items-center">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusStyle(event.status)}`}>
                        {getStatusLabel(event.status)}
                      </span>
                    </div>
                    
                    {/* 时间 */}
                    <div className="col-span-6 sm:col-span-2 flex items-center text-sm">
                      {formatDate(event.startTime)} - {formatDate(event.endTime)}
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="col-span-12 sm:col-span-2 flex items-center justify-start sm:justify-end space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/activities/${event.id}`)}
                        className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-all duration-200 ${isDark 
                          ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                      >
                        <i className="fas fa-eye mr-1"></i>
                        预览
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/edit-activity/${event.id}`)}
                        className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-all duration-200 ${isDark 
                          ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                          : 'bg-blue-100 hover:bg-blue-200 text-blue-800'}`}
                      >
                        <i className="fas fa-edit mr-1"></i>
                        编辑
                      </motion.button>
                      
                      {event.status === 'draft' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleStatusUpdate(event.id, 'pending')}
                          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-all duration-200 ${isDark 
                            ? 'bg-green-600 hover:bg-green-500 text-white' 
                            : 'bg-green-100 hover:bg-green-200 text-green-800'}`}
                        >
                          <i className="fas fa-paper-plane mr-1"></i>
                          提交
                        </motion.button>
                      )}
                      
                      {event.status === 'pending' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleStatusUpdate(event.id, 'draft')}
                          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-all duration-200 ${isDark 
                            ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                        >
                          <i className="fas fa-times mr-1"></i>
                          撤回
                        </motion.button>
                      )}
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteEvent(event.id)}
                        className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-all duration-200 ${isDark 
                          ? 'bg-red-600 hover:bg-red-500 text-white' 
                          : 'bg-red-100 hover:bg-red-200 text-red-800'}`}
                      >
                        <i className="fas fa-trash mr-1"></i>
                        删除
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
        
        {/* 分页 */}
        {!isLoading && events.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="mt-8 flex justify-center"
          >
            <div className={`inline-flex items-center space-x-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}