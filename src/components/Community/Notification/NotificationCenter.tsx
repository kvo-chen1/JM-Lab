import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Notification } from '@/services/communityService';
import { communityService } from '@/services/communityService';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  userId: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  isDark,
  userId
}) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载通知
  const loadNotifications = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await communityService.getNotifications(userId);
      setNotifications(data);
    } catch (err) {
      setError('加载通知失败');
      console.error('加载通知失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 标记通知为已读
  const markAsRead = async (notificationId: string) => {
    try {
      await communityService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('标记通知为已读失败:', err);
    }
  };

  // 标记所有通知为已读
  const markAllAsRead = async () => {
    try {
      await communityService.markAllNotificationsAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('标记所有通知为已读失败:', err);
    }
  };

  // 删除通知
  const deleteNotification = async (notificationId: string) => {
    try {
      await communityService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('删除通知失败:', err);
    }
  };

  // 处理通知点击
  const handleNotificationClick = async (notification: Notification) => {
    // 标记为已读
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // 如果有跳转链接，则跳转
    if (notification.link) {
      navigate(notification.link);
      onClose();
    } else if (notification.relatedId) {
      // 根据类型生成默认跳转链接
      let targetUrl = '';
      switch (notification.type) {
        case 'post_like':
        case 'post_comment':
        case 'comment_reply':
          targetUrl = `/community/post/${notification.relatedId}`;
          break;
        case 'community_join':
        case 'community_announcement':
          targetUrl = `/community/${notification.relatedId}`;
          break;
        case 'friend_request':
          targetUrl = '/friends';
          break;
        case 'message':
          targetUrl = '/messages';
          break;
      }
      if (targetUrl) {
        navigate(targetUrl);
        onClose();
      }
    }
  };

  // 当组件打开时加载通知
  useEffect(() => {
    if (isOpen && userId) {
      loadNotifications();
    }
  }, [isOpen, userId]);

  // 计算未读通知数量
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 bottom-0 w-80 md:w-96 bg-white dark:bg-gray-800 shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
        <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>通知中心</h3>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
            >
              全部已读
            </button>
          )}
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
            aria-label="关闭"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            {error}
            <button
              onClick={loadNotifications}
              className="mt-2 text-sm text-blue-500 hover:underline"
            >
              重试
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <i className="fas fa-bell-slash text-4xl mb-4 text-gray-400"></i>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>暂无通知</p>
            <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>当有新消息时，会显示在这里</p>
          </div>
        ) : (
          <div className="divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}">
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer ${!notification.isRead ? (isDark ? 'bg-gray-750/50' : 'bg-blue-50/30') : ''}`}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${notification.color}20` }}
                  >
                    <i 
                      className={notification.icon} 
                      style={{ color: notification.color }}
                    ></i>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {notification.title}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className={`text-xs ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {notification.content}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className={`text-xs ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                        >
                          标记已读
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {unreadCount > 0 ? `${unreadCount} 条未读` : '全部已读'}
          </span>
          <button
            onClick={loadNotifications}
            className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
          >
            <i className="fas fa-sync-alt mr-1"></i> 刷新
          </button>
        </div>
      )}
    </div>
  );
};

// 添加displayName便于调试
NotificationCenter.displayName = 'NotificationCenter';
