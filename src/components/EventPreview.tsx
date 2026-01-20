import { useState, useMemo } from 'react';
import { EventCreateRequest, Media } from '@/types';
import { useTheme } from '@/hooks/useTheme';

interface EventPreviewProps {
  event: EventCreateRequest;
}

export const EventPreview: React.FC<EventPreviewProps> = ({ event }) => {
  const { isDark } = useTheme();
  
  // 获取封面图片
  const coverImage = useMemo(() => {
    return event.media.length > 0 ? event.media[0] : null;
  }, [event.media]);
  
  // 格式化日期
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  return (
    <div className={`rounded-xl overflow-hidden shadow-md ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
      {/* 封面图片 */}
      <div className="aspect-video bg-gray-200 dark:bg-gray-700 overflow-hidden">
        {coverImage ? (
          coverImage.type === 'image' ? (
            <img
              src={coverImage.url}
              alt={coverImage.altText || coverImage.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative">
              <video
                src={coverImage.url}
                className="w-full h-full object-cover"
                preload="metadata"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <i className="fas fa-play-circle text-white text-4xl"></i>
              </div>
            </div>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
            <i className="fas fa-images text-4xl text-gray-400"></i>
          </div>
        )}
      </div>
      
      {/* 活动信息 */}
      <div className="p-4">
        {/* 活动状态标签 */}
        <div className="mb-2">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
            {event.type === 'online' ? '线上活动' : '线下活动'}
          </span>
        </div>
        
        {/* 活动标题 */}
        <h3 className="text-lg font-bold mb-2 line-clamp-2">
          {event.title || '未设置标题'}
        </h3>
        
        {/* 活动描述 */}
        <p className={`mb-4 text-sm line-clamp-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {event.description || '未设置描述'}
        </p>
        
        {/* 活动时间和地点 */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm">
            <i className="fas fa-calendar-alt mr-2 text-red-600"></i>
            <span>{formatDate(event.startTime)} - {formatDate(event.endTime)}</span>
          </div>
          
          {event.location && (
            <div className="flex items-center text-sm">
              <i className="fas fa-map-marker-alt mr-2 text-red-600"></i>
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
          
          {event.maxParticipants && (
            <div className="flex items-center text-sm">
              <i className="fas fa-users mr-2 text-red-600"></i>
              <span>限{event.maxParticipants}人参与</span>
            </div>
          )}
        </div>
        
        {/* 活动标签 */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {event.tags.map((tag, index) => (
              <span 
                key={index} 
                className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        {/* 媒体预览 */}
        {event.media.length > 1 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">媒体资源</h4>
            <div className="grid grid-cols-3 gap-2">
              {event.media.slice(1, 4).map((item, index) => (
                <div key={item.id} className="aspect-square rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.altText || item.name}
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
              
              {event.media.length > 4 && (
                <div className="aspect-square rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    +{event.media.length - 4}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 内容预览 */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">活动内容</h4>
          <div className={`p-3 rounded-lg text-sm ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            {event.content ? (
              <div
                className="line-clamp-4"
                dangerouslySetInnerHTML={{ __html: event.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...' }}
              />
            ) : (
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>未设置活动内容</p>
            )}
          </div>
        </div>
        
        {/* 发布设置 */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>发布状态</span>
            <span className="font-medium">{event.isPublic ? '公开' : '私密'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};