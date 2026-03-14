import { websocketService } from './websocketService';
import type {
  Notification,
  NotificationPushPayload,
  NotificationType,
  NotificationSettings
} from '../types/notification';
import {
  NOTIFICATION_SOUNDS,
  NOTIFICATION_PRIORITIES,
  getNotificationTypeConfig
} from '../types/notification';
import { notificationBatchService } from './notificationBatchService';

type NotificationCallback = (notification: Notification) => void;
type ConnectionCallback = (connected: boolean) => void;

class NotificationPushService {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private callbacks: NotificationCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private isInitialized = false;
  private userId: string | null = null;
  private settings: NotificationSettings | null = null;

  initialize(userId: string, settings: NotificationSettings): void {
    this.userId = userId;
    this.settings = settings;
    
    if (!this.isInitialized) {
      this.setupWebSocketListeners();
      this.preloadSounds();
      this.isInitialized = true;
    }

    this.connect();
  }

  private setupWebSocketListeners(): void {
    websocketService.on('notification', (data: Notification) => {
      this.handleIncomingNotification(data);
    });

    websocketService.on('notification_batch', (data: { notifications: Notification[] }) => {
      data.notifications.forEach(n => this.handleIncomingNotification(n));
    });

    websocketService.onOpen(() => {
      this.notifyConnectionChange(true);
      if (this.userId) {
        websocketService.send('subscribe_notifications', { userId: this.userId });
      }
    });

    websocketService.onClose(() => {
      this.notifyConnectionChange(false);
    });
  }

  private connect(): void {
    if (!websocketService.getConnectionStatus()) {
      websocketService.connect();
    } else if (this.userId) {
      websocketService.send('subscribe_notifications', { userId: this.userId });
    }
  }

  disconnect(): void {
    if (this.userId) {
      websocketService.send('unsubscribe_notifications', { userId: this.userId });
    }
    this.isInitialized = false;
    this.userId = null;
  }

  updateSettings(settings: NotificationSettings): void {
    this.settings = settings;
  }

  private handleIncomingNotification(notification: Notification): void {
    if (!this.settings || !this.settings.enabled) {
      return;
    }

    const shouldNotify = notificationBatchService.shouldNotify(
      notification.type,
      notification.priority,
      this.settings
    );

    if (shouldNotify.sound) {
      this.playSound(notification.type);
    }

    if (shouldNotify.desktop) {
      this.showDesktopNotification(notification);
    }

    this.callbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Notification callback error:', error);
      }
    });
  }

  private preloadSounds(): void {
    NOTIFICATION_SOUNDS.forEach(config => {
      const audio = new Audio(config.url);
      audio.volume = config.volume;
      audio.preload = 'auto';
      this.audioCache.set(config.type, audio);
    });
  }

  playSound(type: NotificationType | 'default'): void {
    if (!this.settings?.soundEnabled) return;

    try {
      const typeConfig = getNotificationTypeConfig(type as NotificationType);
      const soundType = typeConfig?.sound || 'default';
      
      let audio = this.audioCache.get(soundType);
      if (!audio) {
        audio = this.audioCache.get('default');
      }

      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(error => {
          console.warn('Failed to play notification sound:', error);
        });
      }
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }

  async requestDesktopPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Desktop notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async showDesktopNotification(notification: Notification): Promise<Notification | null> {
    if (!this.settings?.desktopEnabled) return null;

    const hasPermission = await this.requestDesktopPermission();
    if (!hasPermission) return null;

    try {
      const typeConfig = getNotificationTypeConfig(notification.type);
      const priorityConfig = NOTIFICATION_PRIORITIES[notification.priority];

      const options: NotificationOptions = {
        body: notification.content,
        icon: notification.senderAvatar || '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
        silent: !this.settings.soundEnabled,
        data: {
          id: notification.id,
          type: notification.type,
          link: notification.link
        }
      };

      if (notification.metadata?.image) {
        options.image = notification.metadata.image;
      }

      const desktopNotification = new Notification(notification.title, options);

      desktopNotification.onclick = () => {
        window.focus();
        if (notification.link) {
          window.location.href = notification.link;
        }
        desktopNotification.close();
      };

      if (priorityConfig.persistMs > 0) {
        setTimeout(() => {
          desktopNotification.close();
        }, priorityConfig.persistMs);
      }

      return notification;
    } catch (error) {
      console.error('Failed to show desktop notification:', error);
      return null;
    }
  }

  sendPushNotification(payload: NotificationPushPayload): void {
    websocketService.send('push_notification', payload);
  }

  sendNotificationToUser(
    recipientId: string,
    notification: Omit<Notification, 'id' | 'createdAt' | 'recipientId'>
  ): void {
    websocketService.send('send_notification', {
      recipientId,
      notification
    });
  }

  broadcastNotification(
    notification: Omit<Notification, 'id' | 'createdAt' | 'recipientId'>,
    filters?: {
      categories?: string[];
      priorities?: string[];
    }
  ): void {
    websocketService.send('broadcast_notification', {
      notification,
      filters
    });
  }

  onNotification(callback: NotificationCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.push(callback);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyConnectionChange(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('Connection callback error:', error);
      }
    });
  }

  isConnected(): boolean {
    return websocketService.getConnectionStatus();
  }

  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (websocketService.getConnectionStatus()) {
      return 'connected';
    }
    return 'disconnected';
  }

  async sendTestNotification(): Promise<void> {
    const testNotification: Notification = {
      id: `test-${Date.now()}`,
      type: 'system_announcement',
      category: 'system',
      priority: 'medium',
      status: 'unread',
      title: '测试通知',
      content: '这是一条测试通知消息',
      recipientId: this.userId || '',
      isRead: false,
      createdAt: new Date()
    };

    this.handleIncomingNotification(testNotification);
  }
}

export const notificationPushService = new NotificationPushService();
export default notificationPushService;
