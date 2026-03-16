import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Settings,
  RefreshCw,
  Filter,
  Wifi,
  WifiOff,
  X,
  Check,
  Inbox
} from 'lucide-react';
import type {
  Notification,
  NotificationCategory,
  NotificationType,
  NotificationSettings
} from '../../types/notification';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES
} from '../../types/notification';
import { notificationAggregationService } from '../../services/notificationAggregationService';
import { notificationBatchService } from '../../services/notificationBatchService';
import { notificationPushService } from '../../services/notificationPushService';
import NotificationSettingsPanel from './NotificationSettingsPanel';
import NotificationBatchOperations from './NotificationBatchOperations';

interface NotificationCenterProps {
  userId: string;
  isDark?: boolean;
  onClose?: () => void;
}

type ViewMode = 'list' | 'settings' | 'batch';
type GroupMode = 'none' | 'date' | 'aggregate';

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userId,
  isDark = false,
  onClose
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(
    notificationBatchService.loadSettingsFromStorage()
  );
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [groupMode, setGroupMode] = useState<GroupMode>('date');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'all'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadSettings();

    notificationPushService.initialize(userId, settings);

    const unsubscribeNotification = notificationPushService.onNotification(
      (notification) => {
        setNotifications(prev => [notification, ...prev]);
      }
    );

    const unsubscribeConnection = notificationPushService.onConnectionChange(
      (connected) => {
        setIsConnected(connected);
      }
    );

    setIsConnected(notificationPushService.isConnected());

    return () => {
      unsubscribeNotification();
      unsubscribeConnection();
      notificationPushService.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    notificationPushService.updateSettings(settings);
  }, [settings]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const supabaseModule = await import('@/lib/supabaseClient');
      const supabase = supabaseModule.supabase;
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Failed to load notifications:', error);
        return;
      }

      if (data) {
        const formatted: Notification[] = data.map((item: any) => ({
          id: item.id,
          type: item.type as NotificationType,
          category: item.category as NotificationCategory || getCategoryFromType(item.type),
          priority: item.priority as Notification['priority'] || 'medium',
          status: item.status || (item.is_read ? 'read' : 'unread'),
          title: item.title,
          content: item.content,
          senderId: item.sender_id,
          senderName: item.sender_name,
          senderAvatar: item.sender_avatar,
          recipientId: item.user_id,
          communityId: item.community_id,
          postId: item.post_id,
          commentId: item.comment_id,
          workId: item.work_id,
          activityId: item.activity_id,
          relatedId: item.related_id,
          relatedType: item.related_type,
          link: item.link,
          isRead: item.is_read,
          readAt: item.read_at ? new Date(item.read_at) : undefined,
          createdAt: new Date(item.created_at),
          metadata: item.data || {}
        }));
        setNotifications(formatted);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    const loadedSettings = await notificationBatchService.loadSettingsFromDB(userId);
    setSettings(loadedSettings);
  };

  const getCategoryFromType = (type: string): NotificationCategory => {
    for (const cat of NOTIFICATION_CATEGORIES) {
      if (cat.types.includes(type as NotificationType)) {
        return cat.category;
      }
    }
    return 'system';
  };

  const handleSettingsChange = useCallback((newSettings: NotificationSettings) => {
    setSettings(newSettings);
  }, []);

  const handleBatchComplete = useCallback(() => {
    loadNotifications();
    setSelectedIds(new Set());
  }, []);

  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    if (activeCategory !== 'all') {
      result = result.filter(n => n.category === activeCategory);
    }

    if (showUnreadOnly) {
      result = result.filter(n => !n.isRead);
    }

    return result;
  }, [notifications, activeCategory, showUnreadOnly]);

  const groupedNotifications = useMemo(() => {
    if (groupMode === 'none') {
      return { all: filteredNotifications };
    }

    if (groupMode === 'aggregate') {
      const aggregates = notificationAggregationService.aggregateNotifications(filteredNotifications);
      const grouped: Record<string, Notification[]> = {};
      aggregates.forEach(agg => {
        grouped[agg.id] = agg.notifications;
      });
      return grouped;
    }

    return Object.fromEntries(
      notificationAggregationService.groupNotificationsByDate(filteredNotifications)
    );
  }, [filteredNotifications, groupMode]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.isRead).length,
    [notifications]
  );

  const categoryCounts = useMemo(
    () => notificationAggregationService.getUnreadCountByCategory(notifications),
    [notifications]
  );

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date() } : n)
    );
    await notificationBatchService.batchMarkAsRead([id], userId);
  }, [userId]);

  const dateGroupLabels: Record<string, string> = {
    today: '今天',
    yesterday: '昨天',
    thisWeek: '本周',
    thisMonth: '本月',
    older: '更早'
  };

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`flex-shrink-0 p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-900'}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                消息中心
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {unreadCount > 0 ? `${unreadCount} 条未读消息` : '暂无未读消息'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              isConnected
                ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'
                : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
            }`}>
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span>已连接</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>离线</span>
                </>
              )}
            </div>

            <button
              onClick={() => setViewMode(viewMode === 'settings' ? 'list' : 'settings')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'settings'
                  ? 'bg-blue-500 text-white'
                  : isDark
                  ? 'hover:bg-gray-700 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={loadNotifications}
              disabled={isLoading}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-gray-700 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-500'
              } ${isLoading ? 'opacity-50' : ''}`}
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'hover:bg-gray-700 text-gray-400'
                    : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {viewMode === 'list' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === 'all'
                  ? 'bg-blue-500 text-white'
                  : isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              全部
              {notifications.length > 0 && (
                <span className="ml-1 opacity-70">({notifications.length})</span>
              )}
            </button>

            {NOTIFICATION_CATEGORIES.map(cat => (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(cat.category)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.category
                    ? 'text-white'
                    : isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={activeCategory === cat.category ? { backgroundColor: cat.color } : {}}
              >
                {cat.label}
                {categoryCounts[cat.category] > 0 && (
                  <span className="ml-1 opacity-70">({categoryCounts[cat.category]})</span>
                )}
              </button>
            ))}

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                showUnreadOnly
                  ? 'bg-orange-500 text-white'
                  : isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              仅未读
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === 'settings' ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full overflow-y-auto p-4"
            >
              <NotificationSettingsPanel
                settings={settings}
                onSettingsChange={handleSettingsChange}
                userId={userId}
                isDark={isDark}
              />
            </motion.div>
          ) : viewMode === 'batch' ? (
            <motion.div
              key="batch"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full overflow-y-auto p-4"
            >
              <NotificationBatchOperations
                notifications={filteredNotifications}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onBatchComplete={handleBatchComplete}
                userId={userId}
                isDark={isDark}
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto p-4"
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Inbox className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                  <p className={`text-lg font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    暂无通知
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    当有新通知时会显示在这里
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedNotifications).map(([groupKey, groupNotifications]) => (
                    <div key={groupKey}>
                      {groupMode !== 'none' && (
                        <h3 className={`text-sm font-medium mb-3 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {dateGroupLabels[groupKey] || groupKey}
                        </h3>
                      )}
                      <div className="space-y-2">
                        {groupNotifications.map((notification) => {
                          const typeConfig = NOTIFICATION_TYPES[notification.type];
                          const priorityConfig = NOTIFICATION_PRIORITIES[notification.priority];

                          return (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`relative p-4 rounded-xl transition-all cursor-pointer ${
                                notification.isRead
                                  ? isDark ? 'bg-gray-800' : 'bg-white'
                                  : isDark
                                  ? 'bg-blue-900/20 border-l-4 border-blue-500'
                                  : 'bg-blue-50 border-l-4 border-blue-500'
                              } shadow-sm hover:shadow-md`}
                              onClick={() => {
                                if (!notification.isRead) {
                                  markAsRead(notification.id);
                                }
                                if (notification.link) {
                                  window.location.href = notification.link;
                                }
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: `${typeConfig?.color}20` }}
                                >
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: typeConfig?.color }}
                                  />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span
                                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                                      style={{
                                        backgroundColor: `${typeConfig?.color}20`,
                                        color: typeConfig?.color
                                      }}
                                    >
                                      {typeConfig?.label}
                                    </span>
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full ${priorityConfig.bgColor} ${priorityConfig.color}`}
                                    >
                                      {priorityConfig.label}
                                    </span>
                                    {!notification.isRead && (
                                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    )}
                                  </div>

                                  <h4 className={`font-medium mb-1 ${
                                    notification.isRead
                                      ? isDark ? 'text-gray-300' : 'text-gray-700'
                                      : isDark ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {notification.title}
                                  </h4>

                                  <p className={`text-sm line-clamp-2 ${
                                    isDark ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    {notification.content}
                                  </p>

                                  <div className="flex items-center gap-3 mt-2">
                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                      {formatTime(notification.createdAt)}
                                    </span>
                                    {notification.senderName && (
                                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        来自 {notification.senderName}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {notification.senderAvatar && (
                                  <img
                                    src={notification.senderAvatar}
                                    alt={notification.senderName}
                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                  />
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {viewMode === 'list' && filteredNotifications.length > 0 && (
        <div className={`flex-shrink-0 p-3 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGroupMode(groupMode === 'none' ? 'date' : groupMode === 'date' ? 'aggregate' : 'none')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  groupMode !== 'none'
                    ? 'bg-blue-500 text-white'
                    : isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Filter className="w-4 h-4" />
                {groupMode === 'none' ? '不分组' : groupMode === 'date' ? '按日期' : '聚合'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={async () => {
                    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
                    await notificationBatchService.batchMarkAsRead(unreadIds, userId);
                    loadNotifications();
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isDark
                      ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  全部已读
                </button>
              )}

              <button
                onClick={() => setViewMode('batch')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                批量管理
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function formatTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export default NotificationCenter;
