import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import {
  eventNotificationService,
  type EventNotification,
  type NotificationType,
} from '@/services/eventNotificationService';
import { toast } from 'sonner';

interface ActivityNotificationPanelProps {
  userId: string;
}

export const ActivityNotificationPanel: React.FC<ActivityNotificationPanelProps> = ({
  userId,
}) => {
  const { isDark } = useTheme();
  const [notifications, setNotifications] = useState<EventNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // 加载通知
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();

    // 订阅实时通知
    const unsubscribe = eventNotificationService.subscribeToNotifications(userId, {
      onInsert: (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        toast.info(notification.title, {
          description: notification.content,
        });
      },
      onUpdate: (notification) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? notification : n))
        );
      },
      onDelete: (notificationId) => {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      },
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const { data } = await eventNotificationService.getUserNotifications(userId, {}, { pageSize: 5 });
      setNotifications(data);
    } catch (error) {
      console.error('加载通知失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await eventNotificationService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error('加载未读数失败:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const success = await eventNotificationService.markAsRead(notificationId);
      if (success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const success = await eventNotificationService.markAllAsRead(userId);
      if (success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
        toast.success('已全部标记为已读');
      }
    } catch (error) {
      console.error('标记全部已读失败:', error);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    const config = eventNotificationService.getNotificationTypeConfig(type);
    return config.icon;
  };

  const getNotificationColor = (type: NotificationType) => {
    const config = eventNotificationService.getNotificationTypeConfig(type);
    return config.color;
  };

  const getNotificationBgColor = (type: NotificationType) => {
    const config = eventNotificationService.getNotificationTypeConfig(type);
    return config.bgColor;
  };

  const displayedNotifications = showAll ? notifications : notifications.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 通知中心 */}
      <div className={`rounded-xl shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">通知中心</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className={`text-xs ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
            >
              全部已读
            </button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`h-16 rounded-lg animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <i className="fas fa-bell-slash text-3xl text-gray-400 mb-2"></i>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>暂无通知</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              <AnimatePresence>
                {displayedNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                      !notification.isRead ? (isDark ? 'bg-gray-700/30' : 'bg-blue-50/50') : ''
                    }`}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationBgColor(notification.type)}`}>
                        <i className={`fas ${getNotificationIcon(notification.type)} ${getNotificationColor(notification.type)} text-sm`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium truncate ${!notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1"></span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {notification.content}
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {eventNotificationService.formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {notifications.length > 5 && (
          <div className={`p-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'} text-center`}>
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-red-500 hover:text-red-600 font-medium"
            >
              {showAll ? '收起' : `查看全部 (${notifications.length})`}
            </button>
          </div>
        )}
      </div>

      {/* 活动日历 */}
      <div className={`rounded-xl shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className="font-semibold text-sm">活动日历</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
              <div key={day} className={`py-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 5; // 偏移以显示完整的日历
              const isToday = day === new Date().getDate();
              const hasEvent = [5, 12, 18, 25].includes(day);
              return (
                <div
                  key={i}
                  className={`aspect-square flex items-center justify-center text-xs rounded-lg ${
                    day < 1 || day > 31
                      ? 'invisible'
                      : isToday
                      ? 'bg-red-500 text-white'
                      : hasEvent
                      ? isDark
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-red-50 text-red-600'
                      : isDark
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {day > 0 && day <= 31 ? day : ''}
                  {hasEvent && !isToday && (
                    <span className="absolute bottom-0.5 w-1 h-1 bg-red-500 rounded-full"></span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 获奖展示 */}
      <div className={`rounded-xl shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className="font-semibold text-sm">获奖展示</h3>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-center py-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'}`}>
                <i className="fas fa-trophy text-2xl text-yellow-500"></i>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                您已获得 <span className="text-yellow-500 font-bold">3</span> 个奖项
              </p>
              <a
                href="/my-activities?filter=awarded"
                className="text-xs text-red-500 hover:text-red-600 mt-2 inline-block"
              >
                查看全部 →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityNotificationPanel;
