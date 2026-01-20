import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { useEventService } from '@/hooks/useEventService';
import { Event } from '@/types';

// 审核类型
type AuditType = 'works' | 'events';

export default function EventAudit() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { getEvents, reviewEvent } = useEventService();
  
  // 审核类型
  const [auditType, setAuditType] = useState<AuditType>('events');
  
  // 活动列表
  const [events, setEvents] = useState<Event[]>([]);
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  
  // 选中的活动
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // 审核意见
  const [reviewComment, setReviewComment] = useState('');
  
  // 检查是否已登录且为管理员
  useEffect(() => {
    if (!isAuthenticated || !user || !user.isAdmin) {
      navigate('/login');
    } else {
      fetchEvents();
    }
  }, [isAuthenticated, user, navigate]);
  
  // 获取待审核的活动
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const eventsData = await getEvents({
        status: 'pending',
      });
      setEvents(eventsData);
    } catch (error) {
      toast.error('获取待审核活动失败，请稍后重试');
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
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">活动审核</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setAuditType('events')}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${auditType === 'events' 
              ? 'bg-red-600 text-white' 
              : isDark 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
          >
            活动审核
          </button>
          <button
            onClick={() => setAuditType('works')}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${auditType === 'works' 
              ? 'bg-red-600 text-white' 
              : isDark 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
          >
            作品审核
          </button>
        </div>
      </div>
      
      {auditType === 'events' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 待审核活动列表 */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border overflow-hidden shadow-sm">
              <div className={`p-4 font-medium ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                待审核活动 ({events.length})
              </div>
              
              {isLoading ? (
                <div className="p-8 text-center">
                  <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-2"></i>
                  <p>加载中...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="p-8 text-center">
                  <i className="fas fa-check-circle text-4xl text-green-500 mb-2"></i>
                  <p>暂无待审核活动</p>
                </div>
              ) : (
                <div className="divide-y">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className={`p-4 cursor-pointer transition-colors duration-200 ${selectedEvent?.id === event.id 
                        ? isDark ? 'bg-gray-700' : 'bg-blue-50' 
                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <h3 className="font-medium mb-1 line-clamp-1">{event.title}</h3>
                      <div className="flex items-center text-sm mb-2">
                        <i className="fas fa-calendar-alt mr-1 text-gray-400"></i>
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatDate(event.startTime)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <i className="fas fa-user mr-1 text-gray-400"></i>
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          组织者: {event.organizerId}
                        </span>
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
                <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3 className="font-medium">活动详情</h3>
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
                          <p>{selectedEvent.type === 'online' ? '线上活动' : '线下活动'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">活动地点</label>
                          <p>{selectedEvent.location || '未设置'}</p>
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
              </div>
            ) : (
              <div className="p-12 text-center">
                <i className="fas fa-info-circle text-4xl text-gray-400 mb-4"></i>
                <h3 className="text-lg font-medium mb-2">请选择一个活动进行审核</h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  从左侧列表中选择一个待审核的活动，查看详情并进行审核操作
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center">
          <i className="fas fa-tools text-4xl text-gray-400 mb-4"></i>
          <h3 className="text-lg font-medium mb-2">作品审核功能</h3>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            作品审核功能已迁移至新的审核系统，请使用左侧菜单的"内容审核"选项
          </p>
        </div>
      )}
    </motion.div>
  );
}