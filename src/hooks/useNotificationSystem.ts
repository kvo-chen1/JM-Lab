import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type {
  Notification,
  NotificationSettings,
  NotificationCategory,
  NotificationType,
  NotificationPriority,
  NotificationFilterOptions
} from '../types/notification';
import { notificationBatchService } from '../services/notificationBatchService';
import { notificationPushService } from '../services/notificationPushService';
import { notificationAggregationService } from '../services/notificationAggregationService';

interface UseNotificationSystemOptions {
  userId: string;
  autoLoad?: boolean;
  autoConnect?: boolean;
}

interface UseNotificationSystemReturn {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  isLoading: boolean;
  isConnected: boolean;
  categoryCounts: Record<NotificationCategory, number>;
  priorityCounts: Record<NotificationPriority, number>;
  loadNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  batchOperation: (operation: 'mark_read' | 'mark_unread' | 'archive' | 'delete', ids: string[]) => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  toggleCategory: (category: NotificationCategory) => void;
  toggleType: (type: NotificationType) => void;
  filterNotifications: (filters: NotificationFilterOptions) => Notification[];
  aggregateNotifications: (notifications?: Notification[]) => void;
  sendTestNotification: () => void;
}

export function useNotificationSystem(
  options: UseNotificationSystemOptions
): UseNotificationSystemReturn {
  const { userId, autoLoad = true, autoConnect = true } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(
    notificationBatchService.loadSettingsFromStorage()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (autoLoad) {
      loadNotifications();
      loadSettings();
    }

    if (autoConnect) {
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
      };
    }
  }, [userId, autoLoad, autoConnect]);

  useEffect(() => {
    notificationPushService.updateSettings(settings);
  }, [settings]);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
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
  }, [userId]);

  const loadSettings = useCallback(async () => {
    const loadedSettings = await notificationBatchService.loadSettingsFromDB(userId);
    setSettings(loadedSettings);
  }, [userId]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date() } : n)
    );
    await notificationBatchService.batchMarkAsRead([id], userId);
  }, [userId]);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length === 0) return;

    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true, readAt: new Date() }))
    );
    await notificationBatchService.batchMarkAsRead(unreadIds, userId);
  }, [notifications, userId]);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await notificationBatchService.batchDelete([id], userId);
  }, [userId]);

  const batchOperation = useCallback(async (
    operation: 'mark_read' | 'mark_unread' | 'archive' | 'delete',
    ids: string[]
  ) => {
    await notificationBatchService.executeBatchOperation(
      { operation, notificationIds: ids },
      userId
    );
    await loadNotifications();
  }, [userId, loadNotifications]);

  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await notificationBatchService.saveSettingsToDB(userId, updated);
  }, [userId, settings]);

  const toggleCategory = useCallback((category: NotificationCategory) => {
    const newSettings = notificationBatchService.updateCategorySetting(
      settings,
      category,
      !settings.categories[category]
    );
    setSettings(newSettings);
    notificationBatchService.saveSettingsToDB(userId, newSettings);
  }, [userId, settings]);

  const toggleType = useCallback((type: NotificationType) => {
    const newSettings = notificationBatchService.updateTypeSetting(
      settings,
      type,
      !settings.types[type]
    );
    setSettings(newSettings);
    notificationBatchService.saveSettingsToDB(userId, newSettings);
  }, [userId, settings]);

  const filterNotifications = useCallback((filters: NotificationFilterOptions) => {
    let result = [...notifications];

    if (filters.categories && filters.categories.length > 0) {
      result = result.filter(n => filters.categories!.includes(n.category));
    }

    if (filters.types && filters.types.length > 0) {
      result = result.filter(n => filters.types!.includes(n.type));
    }

    if (filters.priorities && filters.priorities.length > 0) {
      result = result.filter(n => filters.priorities!.includes(n.priority));
    }

    if (filters.unreadOnly) {
      result = result.filter(n => !n.isRead);
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        n =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query)
      );
    }

    return result;
  }, [notifications]);

  const aggregateNotifications = useCallback((notificationList?: Notification[]) => {
    return notificationAggregationService.aggregateNotifications(notificationList || notifications);
  }, [notifications]);

  const sendTestNotification = useCallback(() => {
    notificationPushService.sendTestNotification();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.isRead).length,
    [notifications]
  );

  const categoryCounts = useMemo(
    () => notificationAggregationService.getUnreadCountByCategory(notifications),
    [notifications]
  );

  const priorityCounts = useMemo(
    () => notificationAggregationService.getUnreadCountByPriority(notifications),
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    settings,
    isLoading,
    isConnected,
    categoryCounts,
    priorityCounts,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    batchOperation,
    updateSettings,
    toggleCategory,
    toggleType,
    filterNotifications,
    aggregateNotifications,
    sendTestNotification
  };
}

function getCategoryFromType(type: string): NotificationCategory {
  const { NOTIFICATION_CATEGORIES } = require('../types/notification');
  for (const cat of NOTIFICATION_CATEGORIES) {
    if (cat.types.includes(type)) {
      return cat.category;
    }
  }
  return 'system';
}

export default useNotificationSystem;
