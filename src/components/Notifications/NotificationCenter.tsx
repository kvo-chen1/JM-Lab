import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useNotifications, Notification } from '@/contexts/NotificationContext';

interface NotificationCenterProps {
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
}

// 通知视图类型
type NotificationView = 'all' | 'unread' | 'read' | 'archived';

// 通知类型过滤器
type NotificationTypeFilter = 'all' | 'community' | 'post' | 'comment' | 'mention' | 'moderation' | 'announcement';

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  isDark, 
  isOpen, 
  onClose 
}) => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAsUnread, 
    markAllAsRead, 
    archiveNotification, 
    deleteNotification, 
    restoreNotification,
    getUnreadNotifications,
    getReadNotifications,
    getArchivedNotifications
  } = useNotifications();
  
  // 添加导航钩子
  const navigate = useNavigate();
  
  // 状态管理
  const [activeView, setActiveView] = useState<NotificationView>('all');
  const [activeTypeFilter, setActiveTypeFilter] = useState<NotificationTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 关闭通知中心
  const handleClose = () => {
    onClose();
  };
  
  // 获取当前视图的通知
  const getCurrentViewNotifications = () => {
    switch (activeView) {
      case 'unread':
        return getUnreadNotifications();
      case 'read':
        return getReadNotifications();
      case 'archived':
        return getArchivedNotifications();
      default:
        return notifications;
    }
  };
  
  // 过滤通知
  const filteredNotifications = getCurrentViewNotifications().filter(notification => {
    // 类型过滤
    const matchesType = activeTypeFilter === 'all' ||
      (activeTypeFilter === 'community' &&
        (notification.type === 'community_join' ||
         notification.type === 'community_leave' ||
         notification.type === 'member_invited' ||
         notification.type === 'member_joined' ||
         notification.type === 'member_left')) ||
      (activeTypeFilter === 'post' &&
        (notification.type === 'post_created' ||
         notification.type === 'post_commented' ||
         notification.type === 'post_liked')) ||
      (activeTypeFilter === 'comment' &&
        (notification.type === 'comment_replied')) ||
      (activeTypeFilter === 'mention' &&
        (notification.type === 'mention')) ||
      (activeTypeFilter === 'moderation' &&
        (notification.type === 'moderation_approved' ||
         notification.type === 'moderation_rejected' ||
         notification.type === 'moderation_flagged')) ||
      (activeTypeFilter === 'announcement' &&
        (notification.type === 'announcement' ||
         notification.type === 'ranking_published')) ||
      (activeTypeFilter === 'task' &&
        (notification.type === 'ranking_published'));
    
    // 搜索过滤
    const matchesSearch = searchQuery === '' || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.senderName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesSearch;
  });
  
  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) {
      return '刚刚';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    } else if (diff < 604800000) {
      return `${Math.floor(diff / 86400000)}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };
  
  // 获取通知图标
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'community_join':
      case 'community_leave':
        return 'fas fa-users';
      case 'post_created':
        return 'fas fa-file-alt';
      case 'post_commented':
      case 'comment_replied':
        return 'fas fa-comment';
      case 'post_liked':
        return 'fas fa-heart';
      case 'announcement':
        return 'fas fa-bullhorn';
      case 'mention':
        return 'fas fa-at';
      case 'moderation_approved':
        return 'fas fa-check-circle';
      case 'moderation_rejected':
        return 'fas fa-times-circle';
      case 'moderation_flagged':
        return 'fas fa-flag';
      case 'member_invited':
        return 'fas fa-envelope';
      case 'member_joined':
        return 'fas fa-user-plus';
      case 'member_left':
        return 'fas fa-user-minus';
      case 'ranking_published':
        return 'fas fa-trophy';
      default:
        return 'fas fa-bell';
    }
  };
  
  // 获取通知颜色
  const getNotificationColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'low':
        return isDark ? 'text-blue-400' : 'text-blue-600';
      case 'medium':
        return isDark ? 'text-green-400' : 'text-green-600';
      case 'high':
        return isDark ? 'text-yellow-400' : 'text-yellow-600';
      case 'urgent':
        return isDark ? 'text-red-400' : 'text-red-600';
      default:
        return isDark ? 'text-gray-400' : 'text-gray-600';
    }
  };
  
  // 点击通知
  const handleNotificationClick = (notification: Notification) => {
    if (notification.status === 'unread') {
      markAsRead(notification.id);
    }
    
    if (notification.link) {
      navigate(notification.link);
      handleClose();
    }
  };
  
  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
            onClick={handleClose}
          />
          
          {/* 通知中心 */}
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className={`fixed top-0 right-0 h-full w-full max-w-md z-50 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl flex flex-col`}
          >
            {/* 通知中心头部 */}
            <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between sticky top-0 z-10 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>通知中心</h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {unreadCount > 0 ? `${unreadCount} 条未读通知` : '暂无未读通知'}
                </p>
              </div>
              
              <button
                onClick={handleClose}
                className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
              >
                <i className={`fas fa-times ${isDark ? 'text-gray-300' : 'text-gray-600'}`}></i>
              </button>
            </div>
            
            {/* 搜索和过滤 */}
            <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              {/* 搜索框 */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="搜索通知..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full px-4 py-2 pl-10 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <i className={`fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
                </div>
              </div>
              
              {/* 视图切换 */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { id: 'all' as NotificationView, label: '全部', count: notifications.length },
                  { id: 'unread' as NotificationView, label: '未读', count: unreadCount },
                  { id: 'read' as NotificationView, label: '已读', count: getReadNotifications().length },
                  { id: 'archived' as NotificationView, label: '归档', count: getArchivedNotifications().length }
                ].map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view.id as NotificationView)}
                    className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium text-sm transition-colors ${activeView === view.id ? 
                      `${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}` : 
                      `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                    }`}
                  >
                    {view.label} <span className={`ml-1 text-xs ${activeView === view.id ? 'opacity-100' : 'opacity-80'}`}>{view.count}</span>
                  </button>
                ))}
              </div>
              
              {/* 类型过滤 */}
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {[
                  { id: 'all' as NotificationTypeFilter, label: '全部类型' },
                  { id: 'community' as NotificationTypeFilter, label: '社群' },
                  { id: 'post' as NotificationTypeFilter, label: '帖子' },
                  { id: 'comment' as NotificationTypeFilter, label: '评论' },
                  { id: 'mention' as NotificationTypeFilter, label: '提及' },
                  { id: 'moderation' as NotificationTypeFilter, label: '审核' },
                  { id: 'announcement' as NotificationTypeFilter, label: '公告' }
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveTypeFilter(filter.id as NotificationTypeFilter)}
                    className={`px-3 py-1.5 rounded-full whitespace-nowrap text-sm transition-colors ${activeTypeFilter === filter.id ? 
                      `${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}` : 
                      `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              
              {/* 批量操作 */}
              {activeView !== 'archived' && filteredNotifications.length > 0 && (
                <div className="flex justify-end mt-3">
                  <button
                    onClick={markAllAsRead}
                    className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
                  >
                    全部标记为已读
                  </button>
                </div>
              )}
            </div>
            
            {/* 通知列表 */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredNotifications.length === 0 ? (
                <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <i className="fas fa-inbox text-4xl mb-3"></i>
                  <p>暂无通知</p>
                  {searchQuery !== '' && (
                    <p className="text-sm mt-1">没有找到匹配的通知</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${isDark ? 
                        notification.status === 'unread' ? 'bg-blue-900/20 border-l-4 border-blue-500' : 'bg-gray-700' : 
                        notification.status === 'unread' ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'}
                        hover:shadow-md`}
                      onClick={() => handleNotificationClick(notification)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {/* 通知头部 */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* 通知图标 */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <i className={`${getNotificationIcon(notification.type)} ${getNotificationColor(notification.priority)} text-xl`}></i>
                          </div>
                          
                          {/* 通知内容 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>
                                {notification.title}
                              </h3>
                              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} ml-2`}>
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'} truncate`}>
                              {notification.content}
                            </p>
                            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                              发送者: {notification.senderName}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* 通知操作 */}
                      <div className="flex gap-2 mt-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        {notification.status === 'unread' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'} hover:opacity-80`}
                          >
                            标记为已读
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsUnread(notification.id);
                            }}
                            className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'} hover:opacity-80`}
                          >
                            标记为未读
                          </button>
                        )}
                        
                        {activeView !== 'archived' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveNotification(notification.id);
                            }}
                            className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'} hover:opacity-80`}
                          >
                            归档
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              restoreNotification(notification.id);
                            }}
                            className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'} hover:opacity-80`}
                          >
                            恢复
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600'} hover:opacity-80`}
                        >
                          删除
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;
