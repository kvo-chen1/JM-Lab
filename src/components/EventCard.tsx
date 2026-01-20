import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Event } from '@/types';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  showActions?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onClick, 
  showActions = true 
}) => {
  const { isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  
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
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };
  
  return (
    <motion.div
      className={`rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* 封面图片 */}
      <div className="aspect-video bg-gray-200 dark:bg-gray-700 overflow-hidden">
        {event.thumbnailUrl ? (
          <img
            src={event.thumbnailUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-300"
            style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className="fas fa-images text-4xl text-gray-400"></i>
          </div>
        )}
        
        {/* 活动状态 */}
        <div className="absolute top-2 left-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(event.status)}`}>
            {getStatusLabel(event.status)}
          </span>
        </div>
        
        {/* 活动类型 */}
        <div className="absolute top-2 right-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
            {event.type === 'online' ? '线上' : '线下'}
          </span>
        </div>
      </div>
      
      {/* 活动信息 */}
      <div className="p-4">
        {/* 活动标题 */}
        <h3 className="text-lg font-bold mb-2 line-clamp-2">{event.title}</h3>
        
        {/* 活动描述 */}
        <p className={`mb-3 text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {event.description}
        </p>
        
        {/* 活动时间 */}
        <div className="flex items-center text-sm mb-3">
          <i className="fas fa-calendar-alt mr-2 text-red-600"></i>
          <span>{formatDate(event.startTime)} - {formatDate(event.endTime)}</span>
        </div>
        
        {/* 活动地点 */}
        {event.location && (
          <div className="flex items-center text-sm mb-4">
            <i className="fas fa-map-marker-alt mr-2 text-red-600"></i>
            <span className="line-clamp-1">{event.location}</span>
          </div>
        )}
        
        {/* 活动统计 */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <i className="fas fa-eye mr-1"></i>
              {event.viewCount}
            </span>
            <span className="flex items-center">
              <i className="fas fa-users mr-1"></i>
              {event.participants}
            </span>
            <span className="flex items-center">
              <i className="fas fa-heart mr-1"></i>
              {event.likeCount}
            </span>
          </div>
        </div>
        
        {/* 操作按钮 */}
        {showActions && (
          <div className="flex space-x-2">
            <button
              className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
            >
              <i className="fas fa-eye mr-1"></i>
              预览
            </button>
            <button
              className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${isDark 
                ? 'bg-blue-700 hover:bg-blue-600 text-white' 
                : 'bg-blue-100 hover:bg-blue-200 text-blue-800'}`}
            >
              <i className="fas fa-edit mr-1"></i>
              编辑
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};