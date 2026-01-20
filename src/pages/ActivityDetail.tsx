import { useState, useContext, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { Event } from '@/types';
import { useEventService } from '@/hooks/useEventService';
import { TianjinButton } from '@/components/TianjinStyleComponents';

// 导入UI组件
import { MediaGallery } from '@/components/MediaGallery';

// 格式化日期
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long',
  }).format(new Date(date));
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

export default function ActivityDetail() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const { getEvent, deleteEvent, publishEvent, unpublishEvent } = useEventService();
  
  // 活动详情
  const [event, setEvent] = useState<Event | null>(null);
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  
  // 初始化数据
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    
    if (!eventId) {
      toast.error('活动ID不存在');
      navigate('/activities');
      return;
    }
    
    fetchEventDetail();
  }, [isAuthenticated, user, navigate, eventId]);
  
  // 获取活动详情
  const fetchEventDetail = useCallback(async () => {
    if (!eventId) return;
    
    try {
      setIsLoading(true);
      const eventData = await getEvent(eventId);
      setEvent(eventData);
    } catch (error) {
      toast.error('获取活动详情失败，请稍后重试');
      navigate('/activities');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, getEvent, navigate]);
  
  // 处理删除活动
  const handleDelete = async () => {
    if (!eventId) return;
    
    if (window.confirm('确定要删除这个活动吗？此操作不可恢复。')) {
      try {
        await deleteEvent(eventId);
        toast.success('活动已删除');
        navigate('/activities');
      } catch (error) {
        toast.error('删除活动失败，请稍后重试');
      }
    }
  };
  
  // 处理发布活动
  const handlePublish = async () => {
    if (!eventId) return;
    
    try {
      const updatedEvent = await publishEvent(eventId);
      setEvent(updatedEvent);
      toast.success('活动已提交发布');
    } catch (error) {
      toast.error('发布活动失败，请稍后重试');
    }
  };
  
  // 处理撤销发布
  const handleUnpublish = async () => {
    if (!eventId) return;
    
    try {
      const updatedEvent = await unpublishEvent(eventId);
      setEvent(updatedEvent);
      toast.success('活动已撤销发布');
    } catch (error) {
      toast.error('撤销发布失败，请稍后重试');
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
          <p>加载中...</p>
        </div>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-circle text-4xl text-gray-400 mb-4"></i>
          <p>活动不存在或已被删除</p>
          <TianjinButton 
            onClick={() => navigate('/activities')}
            className="mt-4"
          >
            返回活动列表
          </TianjinButton>
        </div>
      </div>
    );
  }
  
  // 检查用户是否有权限编辑活动
  const canEdit = user?.isAdmin || event.organizerId === user?.id;
  
  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-5xl mx-auto">
        {/* 返回按钮 */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/activities')}
            className={`flex items-center text-sm ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <i className="fas fa-arrow-left mr-1"></i>
            返回活动列表
          </button>
        </div>
        
        {/* 活动标题和操作按钮 */}
        <div className={`rounded-xl overflow-hidden shadow-md ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          {/* 活动封面 */}
          <div className="aspect-video bg-gray-200 dark:bg-gray-700 overflow-hidden">
            {event.thumbnailUrl ? (
              <img
                src={event.thumbnailUrl}
                alt={event.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <i className="fas fa-images text-4xl text-gray-400"></i>
              </div>
            )}
          </div>
          
          <div className="p-6">
            {/* 活动状态 */}
            <div className="mb-4">
              <span className={`px-4 py-1 rounded-full text-sm font-medium ${getStatusStyle(event.status)}`}>
                {getStatusLabel(event.status)}
              </span>
            </div>
            
            {/* 活动标题 */}
            <h1 className="text-3xl font-bold mb-3">{event.title}</h1>
            
            {/* 活动描述 */}
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {event.description}
            </p>
            
            {/* 活动基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <i className="fas fa-calendar-alt text-red-600"></i>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">活动时间</h3>
                    <p>{formatDate(event.startTime)}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      至 {formatDate(event.endTime)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <i className="fas fa-map-marker-alt text-red-600"></i>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">活动地点</h3>
                    <p>{event.location || '未设置地点'}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <i className="fas fa-user-group text-red-600"></i>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">参与人数</h3>
                    <p>{event.participants} / {event.maxParticipants || '不限'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <i className="fas fa-tag text-red-600"></i>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">活动类型</h3>
                    <p>{event.type === 'online' ? '线上活动' : '线下活动'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 操作按钮 */}
            {canEdit && (
              <div className="flex flex-wrap gap-2 mb-6">
                <TianjinButton 
                  onClick={() => navigate(`/edit-activity/${event.id}`)}
                >
                  <i className="fas fa-edit mr-2"></i>
                  编辑活动
                </TianjinButton>
                
                {event.status === 'draft' && (
                  <TianjinButton 
                    onClick={handlePublish}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <i className="fas fa-paper-plane mr-2"></i>
                    提交发布
                  </TianjinButton>
                )}
                
                {event.status === 'pending' && (
                  <button
                    onClick={() => navigate(`/edit-activity/${event.id}`)}
                    className={`px-4 py-2 rounded-lg flex items-center transition-colors duration-200 ${isDark 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                  >
                    <i className="fas fa-edit mr-2"></i>
                    修改审核
                  </button>
                )}
                
                {event.status === 'published' && (
                  <button
                    onClick={handleUnpublish}
                    className={`px-4 py-2 rounded-lg flex items-center transition-colors duration-200 ${isDark 
                      ? 'bg-yellow-700 hover:bg-yellow-600 text-white' 
                      : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'}`}
                  >
                    <i className="fas fa-pause mr-2"></i>
                    暂停发布
                  </button>
                )}
                
                <button
                  onClick={handleDelete}
                  className={`px-4 py-2 rounded-lg flex items-center transition-colors duration-200 ${isDark 
                    ? 'bg-red-700 hover:bg-red-600 text-white' 
                    : 'bg-red-100 hover:bg-red-200 text-red-800'}`}
                >
                  <i className="fas fa-trash mr-2"></i>
                  删除活动
                </button>
              </div>
            )}
            
            {/* 活动内容 */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">活动详情</h2>
              <div 
                className={`p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
                dangerouslySetInnerHTML={{ __html: event.content }}
              />
            </div>
            
            {/* 多媒体资源 */}
            {event.media && event.media.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">多媒体资源</h2>
                <MediaGallery
                  media={event.media}
                  onChange={() => {}} // 详情页只读，不允许修改
                  allowMultiple={false}
                  allowVideos={true}
                  error={undefined}
                />
              </div>
            )}
            
            {/* 活动标签 */}
            {event.tags && event.tags.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">活动标签</h2>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* 活动统计信息 */}
            <div className={`p-4 rounded-lg mb-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <h2 className="text-lg font-bold mb-3">活动数据</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{event.viewCount}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>浏览次数</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{event.shareCount}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>分享次数</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{event.likeCount}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>点赞次数</p>
                </div>
              </div>
            </div>
            
            {/* 审核信息 */}
            {(event.status === 'rejected' || event.status === 'published') && (
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <h2 className="text-lg font-bold mb-3">审核信息</h2>
                <div className="space-y-2">
                  {event.status === 'rejected' && event.rejectionReason && (
                    <div>
                      <h3 className="font-medium mb-1">拒绝原因</h3>
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{event.rejectionReason}</p>
                    </div>
                  )}
                  
                  {event.审核人Id && (
                    <div>
                      <h3 className="font-medium mb-1">审核人</h3>
                      <p>{event.审核人Id}</p>
                    </div>
                  )}
                  
                  {event.审核时间 && (
                    <div>
                      <h3 className="font-medium mb-1">审核时间</h3>
                      <p>{formatDate(event.审核时间)}</p>
                    </div>
                  )}
                  
                  {event.publishedAt && (
                    <div>
                      <h3 className="font-medium mb-1">发布时间</h3>
                      <p>{formatDate(event.publishedAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}