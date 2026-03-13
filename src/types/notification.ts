export type NotificationCategory = 
  | 'system' 
  | 'interaction' 
  | 'activity' 
  | 'creator' 
  | 'social' 
  | 'promotion' 
  | 'security';

export type NotificationType =
  | 'system_update'
  | 'system_maintenance'
  | 'system_announcement'
  | 'like'
  | 'comment'
  | 'reply'
  | 'mention'
  | 'follow'
  | 'share'
  | 'activity_start'
  | 'activity_reminder'
  | 'activity_end'
  | 'activity_award'
  | 'work_approved'
  | 'work_rejected'
  | 'work_featured'
  | 'new_follower_work'
  | 'collaboration_invite'
  | 'points_earned'
  | 'achievement_unlocked'
  | 'level_up'
  | 'promotion_apply'
  | 'promotion_approved'
  | 'promotion_rejected'
  | 'security_alert'
  | 'login_alert'
  | 'password_change'
  | 'task'
  | 'points'
  | 'message';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationStatus = 'unread' | 'read' | 'archived' | 'deleted';

export interface NotificationIconConfig {
  icon: string;
  color: string;
  bgColor: string;
  label: string;
}

export interface NotificationCategoryConfig {
  category: NotificationCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
  types: NotificationType[];
  priority: NotificationPriority;
  canDisable: boolean;
  canAggregate: boolean;
}

export interface NotificationTypeConfig {
  type: NotificationType;
  category: NotificationCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  defaultPriority: NotificationPriority;
  sound?: string;
  template?: {
    title: string;
    content: string;
  };
}

export interface NotificationPriorityConfig {
  priority: NotificationPriority;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  sound: boolean;
  desktop: boolean;
  persistMs: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  content: string;
  summary?: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  recipientId: string;
  communityId?: string;
  postId?: string;
  commentId?: string;
  workId?: string;
  activityId?: string;
  relatedId?: string;
  relatedType?: string;
  link?: string;
  isRead: boolean;
  readAt?: Date | string;
  createdAt: Date | string;
  expiresAt?: Date | string;
  metadata?: Record<string, any>;
  aggregatedCount?: number;
  aggregatedIds?: string[];
  groupedDate?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  desktopEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  categories: Record<NotificationCategory, boolean>;
  types: Record<NotificationType, boolean>;
  priorities: Record<NotificationPriority, boolean>;
  showPreview: boolean;
  maxNotifications: number;
  autoArchiveDays: number;
}

export interface NotificationBatchOperation {
  operation: 'mark_read' | 'mark_unread' | 'archive' | 'delete';
  notificationIds: string[];
  filters?: NotificationFilterOptions;
}

export interface NotificationFilterOptions {
  categories?: NotificationCategory[];
  types?: NotificationType[];
  priorities?: NotificationPriority[];
  status?: NotificationStatus[];
  unreadOnly?: boolean;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
}

export interface NotificationAggregate {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  count: number;
  latestNotification: Notification;
  notifications: Notification[];
  summary: string;
  createdAt: Date | string;
}

export interface NotificationDigest {
  id: string;
  userId: string;
  period: 'daily' | 'weekly';
  startDate: Date;
  endDate: Date;
  totalCount: number;
  unreadCount: number;
  categories: Record<NotificationCategory, number>;
  highlights: Notification[];
  summary: string;
  createdAt: Date;
}

export interface NotificationSoundConfig {
  type: NotificationType | 'default';
  url: string;
  volume: number;
}

export interface NotificationPushPayload {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  priority: NotificationPriority;
  icon?: string;
  image?: string;
  link?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: Record<string, any>;
}

export const NOTIFICATION_CATEGORIES: NotificationCategoryConfig[] = [
  {
    category: 'system',
    label: '系统通知',
    description: '平台公告、系统更新、维护通知等',
    icon: 'Bell',
    color: '#8B5CF6',
    types: ['system_update', 'system_maintenance', 'system_announcement'],
    priority: 'medium',
    canDisable: false,
    canAggregate: true
  },
  {
    category: 'interaction',
    label: '互动通知',
    description: '点赞、评论、回复、@提及等互动消息',
    icon: 'Heart',
    color: '#EC4899',
    types: ['like', 'comment', 'reply', 'mention', 'share'],
    priority: 'medium',
    canDisable: true,
    canAggregate: true
  },
  {
    category: 'activity',
    label: '活动通知',
    description: '活动开始、提醒、结束、获奖等通知',
    icon: 'Calendar',
    color: '#F59E0B',
    types: ['activity_start', 'activity_reminder', 'activity_end', 'activity_award'],
    priority: 'high',
    canDisable: true,
    canAggregate: true
  },
  {
    category: 'creator',
    label: '创作者通知',
    description: '作品审核、精选、合作邀请等通知',
    icon: 'Sparkles',
    color: '#10B981',
    types: ['work_approved', 'work_rejected', 'work_featured', 'new_follower_work', 'collaboration_invite'],
    priority: 'high',
    canDisable: true,
    canAggregate: true
  },
  {
    category: 'social',
    label: '社交通知',
    description: '关注、粉丝动态等社交消息',
    icon: 'Users',
    color: '#3B82F6',
    types: ['follow'],
    priority: 'low',
    canDisable: true,
    canAggregate: true
  },
  {
    category: 'promotion',
    label: '激励通知',
    description: '积分、成就、等级、推广等激励消息',
    icon: 'Gift',
    color: '#EF4444',
    types: ['points_earned', 'achievement_unlocked', 'level_up', 'promotion_apply', 'promotion_approved', 'promotion_rejected'],
    priority: 'medium',
    canDisable: true,
    canAggregate: true
  },
  {
    category: 'security',
    label: '安全通知',
    description: '账户安全、登录提醒等重要通知',
    icon: 'Shield',
    color: '#DC2626',
    types: ['security_alert', 'login_alert', 'password_change'],
    priority: 'urgent',
    canDisable: false,
    canAggregate: false
  }
];

export const NOTIFICATION_TYPES: Record<NotificationType, NotificationTypeConfig> = {
  system_update: {
    type: 'system_update',
    category: 'system',
    label: '系统更新',
    description: '平台功能更新通知',
    icon: 'RefreshCw',
    color: '#8B5CF6',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    defaultPriority: 'medium',
    template: { title: '系统更新', content: '平台已更新至最新版本，体验更多新功能' }
  },
  system_maintenance: {
    type: 'system_maintenance',
    category: 'system',
    label: '维护通知',
    description: '系统维护公告',
    icon: 'Wrench',
    color: '#F59E0B',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    defaultPriority: 'high',
    template: { title: '系统维护', content: '系统将进行维护，届时部分功能可能无法使用' }
  },
  system_announcement: {
    type: 'system_announcement',
    category: 'system',
    label: '平台公告',
    description: '重要平台公告',
    icon: 'Megaphone',
    color: '#3B82F6',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    defaultPriority: 'high',
    template: { title: '平台公告', content: '您有一条重要公告' }
  },
  like: {
    type: 'like',
    category: 'interaction',
    label: '点赞',
    description: '有人赞了您的作品或评论',
    icon: 'Heart',
    color: '#EC4899',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    defaultPriority: 'low',
    sound: 'like'
  },
  comment: {
    type: 'comment',
    category: 'interaction',
    label: '评论',
    description: '有人评论了您的作品',
    icon: 'MessageCircle',
    color: '#3B82F6',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    defaultPriority: 'medium',
    sound: 'message'
  },
  reply: {
    type: 'reply',
    category: 'interaction',
    label: '回复',
    description: '有人回复了您的评论',
    icon: 'Reply',
    color: '#10B981',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    defaultPriority: 'medium',
    sound: 'message'
  },
  mention: {
    type: 'mention',
    category: 'interaction',
    label: '@提及',
    description: '有人在内容中@了您',
    icon: 'AtSign',
    color: '#F59E0B',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    defaultPriority: 'high',
    sound: 'mention'
  },
  follow: {
    type: 'follow',
    category: 'social',
    label: '新粉丝',
    description: '有人关注了您',
    icon: 'UserPlus',
    color: '#3B82F6',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    defaultPriority: 'low'
  },
  share: {
    type: 'share',
    category: 'interaction',
    label: '分享',
    description: '有人分享了您的作品',
    icon: 'Share2',
    color: '#10B981',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    defaultPriority: 'low'
  },
  activity_start: {
    type: 'activity_start',
    category: 'activity',
    label: '活动开始',
    description: '您关注的活动已开始',
    icon: 'Play',
    color: '#10B981',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    defaultPriority: 'high',
    sound: 'task'
  },
  activity_reminder: {
    type: 'activity_reminder',
    category: 'activity',
    label: '活动提醒',
    description: '活动即将截止提醒',
    icon: 'Clock',
    color: '#F59E0B',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    defaultPriority: 'high',
    sound: 'task'
  },
  activity_end: {
    type: 'activity_end',
    category: 'activity',
    label: '活动结束',
    description: '活动已结束',
    icon: 'Flag',
    color: '#6B7280',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    defaultPriority: 'medium'
  },
  activity_award: {
    type: 'activity_award',
    category: 'activity',
    label: '获奖通知',
    description: '恭喜您在活动中获奖',
    icon: 'Trophy',
    color: '#F59E0B',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    defaultPriority: 'high',
    sound: 'points'
  },
  work_approved: {
    type: 'work_approved',
    category: 'creator',
    label: '作品通过',
    description: '您的作品已通过审核',
    icon: 'CheckCircle',
    color: '#10B981',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    defaultPriority: 'high',
    sound: 'task'
  },
  work_rejected: {
    type: 'work_rejected',
    category: 'creator',
    label: '作品退回',
    description: '您的作品未通过审核',
    icon: 'XCircle',
    color: '#EF4444',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    defaultPriority: 'high'
  },
  work_featured: {
    type: 'work_featured',
    category: 'creator',
    label: '作品精选',
    description: '您的作品被选为精选',
    icon: 'Star',
    color: '#F59E0B',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    defaultPriority: 'high',
    sound: 'points'
  },
  new_follower_work: {
    type: 'new_follower_work',
    category: 'creator',
    label: '关注更新',
    description: '您关注的创作者发布了新作品',
    icon: 'Image',
    color: '#3B82F6',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    defaultPriority: 'low'
  },
  collaboration_invite: {
    type: 'collaboration_invite',
    category: 'creator',
    label: '合作邀请',
    description: '您收到一个合作邀请',
    icon: 'Handshake',
    color: '#8B5CF6',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    defaultPriority: 'high',
    sound: 'message'
  },
  points_earned: {
    type: 'points_earned',
    category: 'promotion',
    label: '积分获得',
    description: '您获得了积分奖励',
    icon: 'Coins',
    color: '#F59E0B',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    defaultPriority: 'medium',
    sound: 'points'
  },
  achievement_unlocked: {
    type: 'achievement_unlocked',
    category: 'promotion',
    label: '成就解锁',
    description: '恭喜您解锁新成就',
    icon: 'Award',
    color: '#EC4899',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    defaultPriority: 'high',
    sound: 'points'
  },
  level_up: {
    type: 'level_up',
    category: 'promotion',
    label: '等级提升',
    description: '恭喜您等级提升',
    icon: 'TrendingUp',
    color: '#10B981',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    defaultPriority: 'high',
    sound: 'points'
  },
  promotion_apply: {
    type: 'promotion_apply',
    category: 'promotion',
    label: '推广申请',
    description: '您的推广申请已提交',
    icon: 'Send',
    color: '#3B82F6',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    defaultPriority: 'medium'
  },
  promotion_approved: {
    type: 'promotion_approved',
    category: 'promotion',
    label: '推广通过',
    description: '您的推广申请已通过',
    icon: 'CheckCircle',
    color: '#10B981',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    defaultPriority: 'high',
    sound: 'task'
  },
  promotion_rejected: {
    type: 'promotion_rejected',
    category: 'promotion',
    label: '推广拒绝',
    description: '您的推广申请未通过',
    icon: 'XCircle',
    color: '#EF4444',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    defaultPriority: 'high'
  },
  security_alert: {
    type: 'security_alert',
    category: 'security',
    label: '安全警报',
    description: '检测到账户安全风险',
    icon: 'AlertTriangle',
    color: '#DC2626',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    defaultPriority: 'urgent'
  },
  login_alert: {
    type: 'login_alert',
    category: 'security',
    label: '登录提醒',
    description: '检测到新设备登录',
    icon: 'LogIn',
    color: '#F59E0B',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    defaultPriority: 'high'
  },
  password_change: {
    type: 'password_change',
    category: 'security',
    label: '密码变更',
    description: '您的密码已更改',
    icon: 'Key',
    color: '#8B5CF6',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    defaultPriority: 'high'
  },
  task: {
    type: 'task',
    category: 'system',
    label: '任务通知',
    description: '任务相关通知',
    icon: 'CheckSquare',
    color: '#3B82F6',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    defaultPriority: 'medium'
  },
  points: {
    type: 'points',
    category: 'promotion',
    label: '积分通知',
    description: '积分相关通知',
    icon: 'Coins',
    color: '#F59E0B',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    defaultPriority: 'medium'
  },
  message: {
    type: 'message',
    category: 'social',
    label: '消息通知',
    description: '新消息通知',
    icon: 'MessageSquare',
    color: '#10B981',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    defaultPriority: 'medium'
  }
};

export const NOTIFICATION_PRIORITIES: Record<NotificationPriority, NotificationPriorityConfig> = {
  low: {
    priority: 'low',
    label: '低优先级',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-300 dark:border-gray-600',
    icon: 'Minus',
    sound: false,
    desktop: false,
    persistMs: 3000
  },
  medium: {
    priority: 'medium',
    label: '中优先级',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-300 dark:border-blue-600',
    icon: 'Circle',
    sound: true,
    desktop: true,
    persistMs: 5000
  },
  high: {
    priority: 'high',
    label: '高优先级',
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-300 dark:border-orange-600',
    icon: 'AlertCircle',
    sound: true,
    desktop: true,
    persistMs: 8000
  },
  urgent: {
    priority: 'urgent',
    label: '紧急',
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-300 dark:border-red-600',
    icon: 'AlertOctagon',
    sound: true,
    desktop: true,
    persistMs: 0
  }
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  soundEnabled: true,
  desktopEnabled: true,
  emailEnabled: true,
  pushEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  categories: {
    system: true,
    interaction: true,
    activity: true,
    creator: true,
    social: true,
    promotion: true,
    security: true
  },
  types: Object.keys(NOTIFICATION_TYPES).reduce((acc, type) => {
    acc[type as NotificationType] = true;
    return acc;
  }, {} as Record<NotificationType, boolean>),
  priorities: {
    low: true,
    medium: true,
    high: true,
    urgent: true
  },
  showPreview: true,
  maxNotifications: 100,
  autoArchiveDays: 30
};

export const NOTIFICATION_SOUNDS: NotificationSoundConfig[] = [
  { type: 'default', url: 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-confirmation-2870.mp3', volume: 0.5 },
  { type: 'like', url: 'https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-beep-221.mp3', volume: 0.4 },
  { type: 'comment', url: 'https://assets.mixkit.co/sfx/preview/mixkit-communication-telephone-1392.mp3', volume: 0.5 },
  { type: 'mention', url: 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-command-2851.mp3', volume: 0.5 },
  { type: 'task', url: 'https://assets.mixkit.co/sfx/preview/mixkit-checkout-confirmation-1117.mp3', volume: 0.5 },
  { type: 'points', url: 'https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3', volume: 0.6 },
  { type: 'message', url: 'https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2871.mp3', volume: 0.5 }
];

export function getNotificationTypeConfig(type: NotificationType): NotificationTypeConfig {
  return NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.system_announcement;
}

export function getNotificationCategoryConfig(category: NotificationCategory): NotificationCategoryConfig | undefined {
  return NOTIFICATION_CATEGORIES.find(c => c.category === category);
}

export function getNotificationPriorityConfig(priority: NotificationPriority): NotificationPriorityConfig {
  return NOTIFICATION_PRIORITIES[priority];
}

export function getNotificationIcon(type: NotificationType): string {
  return getNotificationTypeConfig(type).icon;
}

export function getNotificationColor(type: NotificationType): string {
  return getNotificationTypeConfig(type).color;
}

export function getNotificationBgColor(type: NotificationType): string {
  return getNotificationTypeConfig(type).bgColor;
}

export function getNotificationsByCategory(category: NotificationCategory): NotificationType[] {
  const config = getNotificationCategoryConfig(category);
  return config ? config.types : [];
}

export function isNotificationTypeEnabled(type: NotificationType, settings: NotificationSettings): boolean {
  const typeConfig = getNotificationTypeConfig(type);
  const categoryEnabled = settings.categories[typeConfig.category];
  const typeEnabled = settings.types[type];
  return categoryEnabled && typeEnabled;
}
