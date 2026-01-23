import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from 'sonner';

// 通知类型
export type NotificationType = 
  | 'community_join' 
  | 'community_leave' 
  | 'post_created' 
  | 'post_commented' 
  | 'post_liked' 
  | 'comment_replied' 
  | 'announcement' 
  | 'mention' 
  | 'moderation_approved' 
  | 'moderation_rejected' 
  | 'moderation_flagged' 
  | 'member_invited' 
  | 'member_joined' 
  | 'member_left';

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
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'status'>) => void;
  getUnreadNotifications: () => Notification[];
  getReadNotifications: () => Notification[];
  getArchivedNotifications: () => Notification[];
}

// 默认设置
const defaultSettings: NotificationSettings = {
  enabled: true,
  types: {
    community_join: true,
    community_leave: true,
    post_created: true,
    post_commented: true,
    post_liked: true,
    comment_replied: true,
    announcement: true,
    mention: true,
    moderation_approved: true,
    moderation_rejected: true,
    moderation_flagged: true,
    member_invited: true,
    member_joined: true,
    member_left: true
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
  // 状态管理
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [settings, setSettings] = useState<NotificationSettings>({
    ...defaultSettings,
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

  // 计算未读通知数量
  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  // 添加通知
  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'status'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      status: 'unread'
    };

    setNotifications(prev => [newNotification, ...prev]);

    // 显示 toast 通知
    if (settings.desktopNotifications) {
      toast({
        title: newNotification.title,
        description: newNotification.content,
        duration: 5000,
        type: newNotification.priority === 'urgent' || newNotification.priority === 'high' ? 'warning' : 'info',
        action: {
          label: '查看',
          onClick: () => {
            markAsRead(newNotification.id);
            if (newNotification.link) {
              // 检查是否为内部链接
              try {
                const notificationUrl = new URL(newNotification.link, window.location.origin);
                const currentOrigin = window.location.origin;
                
                if (notificationUrl.origin === currentOrigin) {
                  // 内部链接使用history.pushState实现无刷新跳转
                  window.history.pushState({}, '', notificationUrl.pathname + notificationUrl.search + notificationUrl.hash);
                  // 触发popstate事件，让React Router检测到路径变化
                  window.dispatchEvent(new PopStateEvent('popstate'));
                } else {
                  // 外部链接使用window.location.href
                  window.location.href = newNotification.link;
                }
              } catch (error) {
                // 处理无效URL的情况
                window.location.href = newNotification.link;
              }
            }
          }
        }
      });
    }
  };

  // 标记为已读
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id 
        ? { ...notification, status: 'read', readAt: new Date() }
        : notification
    ));
  };

  // 标记为未读
  const markAsUnread = (id: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id 
        ? { ...notification, status: 'unread', readAt: undefined }
        : notification
    ));
  };

  // 标记所有为已读
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => 
      notification.status === 'unread' 
        ? { ...notification, status: 'read', readAt: new Date() }
        : notification
    ));
  };

  // 归档通知
  const archiveNotification = (id: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id 
        ? { ...notification, status: 'archived' }
        : notification
    ));
  };

  // 删除通知
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // 恢复通知
  const restoreNotification = (id: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id 
        ? { ...notification, status: 'unread' }
        : notification
    ));
  };

  // 更新设置
  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  // 更新通知类型设置
  const updateNotificationTypeSetting = (type: NotificationType, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: enabled
      }
    }));
  };

  // 更新通知优先级设置
  const updateNotificationPrioritySetting = (priority: NotificationPriority, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      priorities: {
        ...prev.priorities,
        [priority]: enabled
      }
    }));
  };

  // 获取未读通知
  const getUnreadNotifications = () => {
    return notifications.filter(n => n.status === 'unread');
  };

  // 获取已读通知
  const getReadNotifications = () => {
    return notifications.filter(n => n.status === 'read');
  };

  // 获取归档通知
  const getArchivedNotifications = () => {
    return notifications.filter(n => n.status === 'archived');
  };

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
