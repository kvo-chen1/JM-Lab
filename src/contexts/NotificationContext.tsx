import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

// 通知类型
export type NotificationType =
  | 'community_join'
  | 'community_leave'
  | 'post_created'
  | 'post_commented'
  | 'post_liked'
  | 'work_liked'
  | 'comment_replied'
  | 'announcement'
  | 'mention'
  | 'moderation_approved'
  | 'moderation_rejected'
  | 'moderation_flagged'
  | 'member_invited'
  | 'member_joined'
  | 'member_left'
  | 'ranking_published'
  | 'feedback_resolved'
  | 'feedback_replied';

// 通知优先级
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// 通知状态
export type NotificationStatus = 'unread' | 'read' | 'archived';

// 通知接口
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  communityId?: string;
  postId?: string;
  commentId?: string;
  createdAt: Date;
  readAt?: Date;
  status: NotificationStatus;
  priority: NotificationPriority;
  link?: string;
}

// 通知设置接口
export interface NotificationSettings {
  enabled: boolean;
  types: Record<NotificationType, boolean>;
  priorities: Record<NotificationPriority, boolean>;
  emailNotifications: boolean;
  pushNotifications: boolean;
  desktopNotifications: boolean;
  soundEnabled: boolean;
  showPreview: boolean;
}

// 添加通知的选项接口
export interface AddNotificationOptions {
  onActionClick?: () => void;
}

// 上下文接口
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  markAllAsRead: () => void;
  archiveNotification: (id: string) => void;
  deleteNotification: (id: string) => void;
  restoreNotification: (id: string) => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  updateNotificationTypeSetting: (type: NotificationType, enabled: boolean) => void;
  updateNotificationPrioritySetting: (priority: NotificationPriority, enabled: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'status'>, options?: AddNotificationOptions) => void;
  getUnreadNotifications: () => Notification[];
  getReadNotifications: () => Notification[];
  getArchivedNotifications: () => Notification[];
}

// 从 localStorage 读取设置
const loadSettingsFromStorage = (): Partial<NotificationSettings> => {
  try {
    const notificationsEnabled = localStorage.getItem('notificationsEnabled');
    const notificationSound = localStorage.getItem('notificationSound');
    const notificationFrequency = localStorage.getItem('notificationFrequency');

    return {
      enabled: notificationsEnabled ? JSON.parse(notificationsEnabled) : true,
      soundEnabled: notificationSound ? JSON.parse(notificationSound) : true,
      desktopNotifications: notificationsEnabled ? JSON.parse(notificationsEnabled) : true,
    };
  } catch {
    return {};
  }
};

// 默认设置
const defaultSettings: NotificationSettings = {
  enabled: true,
  types: {
    community_join: true,
    community_leave: true,
    post_created: true,
    post_commented: true,
    post_liked: true,
    work_liked: true,
    comment_replied: true,
    announcement: true,
    mention: true,
    moderation_approved: true,
    moderation_rejected: true,
    moderation_flagged: true,
    member_invited: true,
    member_joined: true,
    member_left: true,
    ranking_published: true,
    feedback_resolved: true,
    feedback_replied: true
  },
  priorities: {
    low: true,
    medium: true,
    high: true,
    urgent: true
  },
  emailNotifications: true,
  pushNotifications: true,
  desktopNotifications: true,
  soundEnabled: true,
  showPreview: true
};

// 创建上下文
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// 上下文提供者组件
interface NotificationProviderProps {
  children: ReactNode;
  initialNotifications?: Notification[];
  initialSettings?: Partial<NotificationSettings>;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  initialNotifications = [],
  initialSettings = {}
}) => {
  // 获取当前用户
  const { user } = useAuth();

  // 状态管理
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  // 从 localStorage 加载保存的设置
  const savedSettings = loadSettingsFromStorage();
  const [settings, setSettings] = useState<NotificationSettings>({
    ...defaultSettings,
    ...savedSettings,
    ...initialSettings,
    types: {
      ...defaultSettings.types,
      ...initialSettings.types
    },
    priorities: {
      ...defaultSettings.priorities,
      ...initialSettings.priorities
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // 监听 localStorage 变化，同步设置
  useEffect(() => {
    const handleStorageChange = () => {
      const newSettings = loadSettingsFromStorage();
      setSettings(prev => ({
        ...prev,
        ...newSettings
      }));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 从 Supabase 加载通知
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load notifications:', error);
        return;
      }

      if (data) {
        // 转换数据库格式为前端格式
        const formattedNotifications: Notification[] = data.map((item: any) => {
          // 从 data JSONB 字段中提取额外信息
          const extraData = item.data || {};

          return {
            id: item.id,
            type: item.type as NotificationType,
            title: item.title,
            content: item.content,
            senderId: item.sender_id || '',
            senderName: extraData.sender_name || item.sender_name || '',
            senderAvatar: extraData.sender_avatar || '',
            recipientId: item.user_id,
            communityId: extraData.community_id || item.community_id,
            postId: extraData.post_id || item.post_id,
            commentId: extraData.comment_id || item.comment_id,
            createdAt: new Date(item.created_at),
            readAt: item.read_at ? new Date(item.read_at) : undefined,
            status: item.is_read ? 'read' : 'unread',
            priority: (extraData.priority as NotificationPriority) || item.priority || 'medium',
            link: item.link
          };
        });

        setNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // 组件挂载时加载通知
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // 计算未读通知数量
  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  // 添加通知（同时保存到 Supabase）
  const addNotification = useCallback(async (
    notification: Omit<Notification, 'id' | 'createdAt' | 'status'>,
    options?: AddNotificationOptions
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      status: 'unread'
    };

    // 先更新本地状态
    setNotifications(prev => [newNotification, ...prev]);

    // 保存到 Supabase
    try {
      console.log('[addNotification] Saving notification:', newNotification);

      // 构建插入数据，只包含数据库中存在的字段
      const insertData: any = {
        type: newNotification.type,
        title: newNotification.title,
        content: newNotification.content,
        user_id: newNotification.recipientId,
        sender_id: newNotification.senderId || null,
        link: newNotification.link || null,
        is_read: false,
        created_at: new Date().toISOString()
      };

      // 可选字段：只在有值时才添加
      if (newNotification.communityId) {
        insertData.data = { ...insertData.data, community_id: newNotification.communityId };
      }
      if (newNotification.postId) {
        insertData.data = { ...insertData.data, post_id: newNotification.postId };
      }
      if (newNotification.commentId) {
        insertData.data = { ...insertData.data, comment_id: newNotification.commentId };
      }
      if (newNotification.senderName) {
        insertData.data = { ...insertData.data, sender_name: newNotification.senderName };
      }
      if ((newNotification as any).senderAvatar) {
        insertData.data = { ...insertData.data, sender_avatar: (newNotification as any).senderAvatar };
      }
      if (newNotification.priority) {
        insertData.data = { ...insertData.data, priority: newNotification.priority };
      }

      const { error } = await supabase
        .from('notifications')
        .insert(insertData);

      if (error) {
        console.error('[addNotification] Failed to save notification to Supabase:', error);
      } else {
        console.log('[addNotification] Notification saved successfully');
      }
    } catch (error) {
      console.error('Error saving notification:', error);
    }

    // 播放通知声音
    if (settings.soundEnabled && settings.enabled) {
      try {
        // 使用 Web Audio API 生成提示音
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // 设置声音频率和类型
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        // 设置音量包络
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        // 播放声音
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch {
        // 忽略音频播放错误
      }
    }

    // 显示 toast 通知
    if (settings.desktopNotifications && settings.enabled) {
      const toastFn =
        newNotification.priority === 'urgent' || newNotification.priority === 'high'
          ? toast.warning
          : toast.info;

      toastFn(newNotification.title, {
        description: newNotification.content,
        duration: 5000,
        action: {
          label: '查看',
          onClick: () => {
            markAsRead(newNotification.id);
            // 优先使用传入的自定义回调
            if (options?.onActionClick) {
              options.onActionClick();
            } else if (newNotification.link) {
              // 如果没有自定义回调，使用默认导航
              try {
                const notificationUrl = new URL(newNotification.link, window.location.origin);
                const currentOrigin = window.location.origin;

                if (notificationUrl.origin === currentOrigin) {
                  // 使用 window.location.href 进行导航，确保页面正确跳转
                  window.location.href = newNotification.link;
                } else {
                  window.location.href = newNotification.link;
                }
              } catch {
                window.location.href = newNotification.link;
              }
            }
          }
        }
      });
    }
  }, [settings.desktopNotifications, settings.soundEnabled, settings.enabled]);

  // 标记为已读（同时更新 Supabase）
  const markAsRead = useCallback(async (id: string) => {
    // 先更新本地状态
    setNotifications(prev => prev.map(notification =>
      notification.id === id
        ? { ...notification, status: 'read', readAt: new Date() }
        : notification
    ));

    // 更新 Supabase
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: Math.floor(Date.now() / 1000)
        })
        .eq('id', id);

      if (error) {
        console.error('Failed to mark notification as read in Supabase:', error);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // 标记为未读
  const markAsUnread = useCallback((id: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id 
        ? { ...notification, status: 'unread', readAt: undefined }
        : notification
    ));
  }, []);

  // 标记所有为已读（同时更新 Supabase）
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    // 先更新本地状态
    setNotifications(prev => prev.map(notification =>
      notification.status === 'unread'
        ? { ...notification, status: 'read', readAt: new Date() }
        : notification
    ));

    // 更新 Supabase
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: Math.floor(Date.now() / 1000)
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Failed to mark all notifications as read in Supabase:', error);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user?.id]);

  // 归档通知
  const archiveNotification = useCallback((id: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id 
        ? { ...notification, status: 'archived' }
        : notification
    ));
  }, []);

  // 删除通知（同时从 Supabase 删除）
  const deleteNotification = useCallback(async (id: string) => {
    // 先更新本地状态
    setNotifications(prev => prev.filter(notification => notification.id !== id));

    // 从 Supabase 删除
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete notification from Supabase:', error);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  // 恢复通知
  const restoreNotification = useCallback((id: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id 
        ? { ...notification, status: 'unread' }
        : notification
    ));
  }, []);

  // 更新设置
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  }, []);

  // 更新通知类型设置
  const updateNotificationTypeSetting = useCallback((type: NotificationType, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: enabled
      }
    }));
  }, []);

  // 更新通知优先级设置
  const updateNotificationPrioritySetting = useCallback((priority: NotificationPriority, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      priorities: {
        ...prev.priorities,
        [priority]: enabled
      }
    }));
  }, []);

  // 获取未读通知
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => n.status === 'unread');
  }, [notifications]);

  // 获取已读通知
  const getReadNotifications = useCallback(() => {
    return notifications.filter(n => n.status === 'read');
  }, [notifications]);

  // 获取归档通知
  const getArchivedNotifications = useCallback(() => {
    return notifications.filter(n => n.status === 'archived');
  }, [notifications]);

  // 上下文值
  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    settings,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    restoreNotification,
    updateSettings,
    updateNotificationTypeSetting,
    updateNotificationPrioritySetting,
    addNotification,
    getUnreadNotifications,
    getReadNotifications,
    getArchivedNotifications
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// 自定义钩子
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// 带导航功能的通知钩子
export const useNotificationWithNavigate = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationWithNavigate must be used within a NotificationProvider');
  }
  
  return {
    ...context,
    // 包装 addNotification 以支持导航
    addNotificationWithNavigate: (
      notification: Omit<Notification, 'id' | 'createdAt' | 'status'>,
      navigate: (path: string) => void
    ) => {
      context.addNotification(notification, {
        onActionClick: () => {
          if (notification.link) {
            try {
              if (typeof navigate === 'function') {
                navigate(notification.link);
              } else {
                // 如果 navigate 函数不存在，使用 window.location.href 进行导航
                window.location.href = notification.link;
              }
            } catch (error) {
              // 如果导航失败，使用 window.location.href 作为备用方案
              window.location.href = notification.link;
            }
          }
        }
      });
    }
  };
};
