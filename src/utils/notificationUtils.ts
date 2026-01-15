// 通知工具函数

// 声音提醒功能
const soundMap: Record<string, string> = {
  default: 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-confirmation-2870.mp3',
  like: 'https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-beep-221.mp3',
  message: 'https://assets.mixkit.co/sfx/preview/mixkit-communication-telephone-1392.mp3',
  mention: 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-command-2851.mp3',
  task: 'https://assets.mixkit.co/sfx/preview/mixkit-checkout-confirmation-1117.mp3',
  points: 'https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3',
};

// 播放通知声音
export const playNotificationSound = (type: string = 'default'): void => {
  try {
    const audio = new Audio(soundMap[type] || soundMap.default);
    audio.volume = 0.5;
    audio.play().catch(error => {
      console.warn('Failed to play notification sound:', error);
    });
  } catch (error) {
    console.warn('Notification sound not supported:', error);
  }
};

// 格式化通知时间
export const formatNotificationTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

// 请求桌面通知权限
export const requestDesktopNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// 发送桌面通知
export const sendDesktopNotification = (title: string, options: NotificationOptions = {}): void => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    new Notification(title, {
      icon: '/favicon.ico',
      ...options,
    });
  } catch (error) {
    console.warn('Failed to send desktop notification:', error);
  }
};

// 生成唯一通知ID
export const generateNotificationId = (): string => {
  return `n${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 清理过期通知
export const cleanupOldNotifications = (notifications: any[], maxAge: number = 30 * 24 * 60 * 60 * 1000): any[] => {
  const now = Date.now();
  return notifications.filter(notification => now - notification.timestamp < maxAge);
};

// 按日期分组通知
export const groupNotificationsByDate = (notifications: any[]): Record<string, any[]> => {
  return notifications.reduce((groups, notification) => {
    const date = new Date(notification.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, any[]>);
};
