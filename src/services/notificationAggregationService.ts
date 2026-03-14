import type {
  Notification,
  NotificationAggregate,
  NotificationType,
  NotificationCategory,
  NotificationDigest,
  NOTIFICATION_CATEGORIES
} from '../types/notification';

const AGGREGATION_WINDOW_MS = 5 * 60 * 1000;

const MAX_AGGREGATE_COUNT = 50;

export interface AggregationRule {
  type: NotificationType;
  groupBy: 'sender' | 'target' | 'none';
  maxCount: number;
  template: (count: number, notifications: Notification[]) => { title: string; content: string };
}

const AGGREGATION_RULES: Record<NotificationType, AggregationRule> = {
  like: {
    type: 'like',
    groupBy: 'target',
    maxCount: 50,
    template: (count, notifications) => {
      if (count === 1) {
        return { title: '新点赞', content: `${notifications[0].senderName} 赞了您的作品` };
      }
      const senders = [...new Set(notifications.map(n => n.senderName).filter(Boolean))];
      if (senders.length <= 3) {
        return { title: `${count} 个点赞`, content: `${senders.join('、')} 等人赞了您的作品` };
      }
      return { title: `${count} 个点赞`, content: `${senders.slice(0, 3).join('、')} 等共 ${count} 人赞了您的作品` };
    }
  },
  comment: {
    type: 'comment',
    groupBy: 'target',
    maxCount: 20,
    template: (count, notifications) => {
      if (count === 1) {
        return { title: '新评论', content: `${notifications[0].senderName} 评论了您的作品` };
      }
      return { title: `${count} 条评论`, content: `您的作品收到了 ${count} 条新评论` };
    }
  },
  reply: {
    type: 'reply',
    groupBy: 'target',
    maxCount: 20,
    template: (count, notifications) => {
      if (count === 1) {
        return { title: '新回复', content: `${notifications[0].senderName} 回复了您的评论` };
      }
      return { title: `${count} 条回复`, content: `您的评论收到了 ${count} 条回复` };
    }
  },
  mention: {
    type: 'mention',
    groupBy: 'none',
    maxCount: 10,
    template: (count, notifications) => {
      if (count === 1) {
        return { title: '有人@您', content: `${notifications[0].senderName} 在内容中提到了您` };
      }
      return { title: `${count} 次@提及`, content: `您被提及了 ${count} 次` };
    }
  },
  follow: {
    type: 'follow',
    groupBy: 'none',
    maxCount: 50,
    template: (count, notifications) => {
      if (count === 1) {
        return { title: '新粉丝', content: `${notifications[0].senderName} 关注了您` };
      }
      const senders = [...new Set(notifications.map(n => n.senderName).filter(Boolean))];
      if (senders.length <= 3) {
        return { title: `${count} 位新粉丝`, content: `${senders.join('、')} 关注了您` };
      }
      return { title: `${count} 位新粉丝`, content: `${senders.slice(0, 3).join('、')} 等共 ${count} 人关注了您` };
    }
  },
  share: {
    type: 'share',
    groupBy: 'target',
    maxCount: 20,
    template: (count, notifications) => {
      if (count === 1) {
        return { title: '作品被分享', content: `${notifications[0].senderName} 分享了您的作品` };
      }
      return { title: `${count} 次分享`, content: `您的作品被分享了 ${count} 次` };
    }
  },
  points_earned: {
    type: 'points_earned',
    groupBy: 'none',
    maxCount: 20,
    template: (count, notifications) => {
      const totalPoints = notifications.reduce((sum, n) => sum + (n.metadata?.points || 0), 0);
      if (count === 1) {
        return { title: '积分奖励', content: `您获得了 ${totalPoints} 积分` };
      }
      return { title: '积分奖励', content: `您累计获得了 ${totalPoints} 积分（${count} 次）` };
    }
  },
  activity_reminder: {
    type: 'activity_reminder',
    groupBy: 'target',
    maxCount: 10,
    template: (count, notifications) => {
      if (count === 1) {
        return { title: '活动提醒', content: notifications[0].content };
      }
      return { title: `${count} 个活动提醒`, content: `您有 ${count} 个活动即将截止` };
    }
  },
  new_follower_work: {
    type: 'new_follower_work',
    groupBy: 'none',
    maxCount: 20,
    template: (count, notifications) => {
      if (count === 1) {
        return { title: '关注更新', content: `您关注的创作者发布了新作品` };
      }
      return { title: `${count} 个新作品`, content: `您关注的创作者发布了 ${count} 个新作品` };
    }
  },
  system_update: {
    type: 'system_update',
    groupBy: 'none',
    maxCount: 5,
    template: (count, notifications) => ({
      title: '系统更新',
      content: count === 1 ? notifications[0].content : `系统有 ${count} 项更新`
    })
  },
  system_maintenance: {
    type: 'system_maintenance',
    groupBy: 'none',
    maxCount: 3,
    template: (count, notifications) => ({
      title: '系统维护',
      content: notifications[0].content
    })
  },
  system_announcement: {
    type: 'system_announcement',
    groupBy: 'none',
    maxCount: 5,
    template: (count, notifications) => ({
      title: '平台公告',
      content: notifications[0].content
    })
  },
  activity_start: {
    type: 'activity_start',
    groupBy: 'target',
    maxCount: 10,
    template: (count, notifications) => {
      if (count === 1) {
        return { title: '活动开始', content: notifications[0].content };
      }
      return { title: `${count} 个活动开始`, content: `您关注的 ${count} 个活动已开始` };
    }
  },
  activity_end: {
    type: 'activity_end',
    groupBy: 'target',
    maxCount: 10,
    template: (count, notifications) => {
      if (count === 1) {
        return { title: '活动结束', content: notifications[0].content };
      }
      return { title: `${count} 个活动结束`, content: `您参与的 ${count} 个活动已结束` };
    }
  },
  activity_award: {
    type: 'activity_award',
    groupBy: 'target',
    maxCount: 10,
    template: (count, notifications) => {
      if (count === 1) {
        return { title: '获奖通知', content: notifications[0].content };
      }
      return { title: `${count} 个获奖`, content: `恭喜！您在 ${count} 个活动中获奖` };
    }
  },
  work_approved: {
    type: 'work_approved',
    groupBy: 'target',
    maxCount: 10,
    template: (count, notifications) => {
      if (count === 1) {
        return { title: '作品通过', content: notifications[0].content };
      }
      return { title: `${count} 个作品通过`, content: `您有 ${count} 个作品通过审核` };
    }
  },
  work_rejected: {
    type: 'work_rejected',
    groupBy: 'target',
    maxCount: 10,
    template: (count, notifications) => {
      if (count === 1) {
        return { title: '作品退回', content: notifications[0].content };
      }
      return { title: `${count} 个作品退回`, content: `您有 ${count} 个作品未通过审核` };
    }
  },
  work_featured: {
    type: 'work_featured',
    groupBy: 'target',
    maxCount: 10,
    template: (count, notifications) => {
      if (count === 1) {
        return { title: '作品精选', content: notifications[0].content };
      }
      return { title: `${count} 个作品精选`, content: `恭喜！您有 ${count} 个作品被选为精选` };
    }
  },
  collaboration_invite: {
    type: 'collaboration_invite',
    groupBy: 'none',
    maxCount: 10,
    template: (count, notifications) => {
      if (count === 1) {
        return { title: '合作邀请', content: notifications[0].content };
      }
      return { title: `${count} 个合作邀请`, content: `您收到 ${count} 个合作邀请` };
    }
  },
  achievement_unlocked: {
    type: 'achievement_unlocked',
    groupBy: 'none',
    maxCount: 10,
    template: (count, notifications) => {
      if (count === 1) {
        return { title: '成就解锁', content: notifications[0].content };
      }
      return { title: `${count} 个成就解锁`, content: `恭喜！您解锁了 ${count} 个新成就` };
    }
  },
  level_up: {
    type: 'level_up',
    groupBy: 'none',
    maxCount: 5,
    template: (count, notifications) => ({
      title: '等级提升',
      content: notifications[0].content
    })
  },
  promotion_apply: {
    type: 'promotion_apply',
    groupBy: 'target',
    maxCount: 10,
    template: (count, notifications) => {
      if (count === 1) {
        return { title: '推广申请', content: notifications[0].content };
      }
      return { title: `${count} 个推广申请`, content: `您提交了 ${count} 个推广申请` };
    }
  },
  promotion_approved: {
    type: 'promotion_approved',
    groupBy: 'target',
    maxCount: 10,
    template: (count, notifications) => {
      if (count === 1) {
        return { title: '推广通过', content: notifications[0].content };
      }
      return { title: `${count} 个推广通过`, content: `您有 ${count} 个推广申请已通过` };
    }
  },
  promotion_rejected: {
    type: 'promotion_rejected',
    groupBy: 'target',
    maxCount: 10,
    template: (count, notifications) => {
      if (count === 1) {
        return { title: '推广拒绝', content: notifications[0].content };
      }
      return { title: `${count} 个推广拒绝`, content: `您有 ${count} 个推广申请未通过` };
    }
  },
  security_alert: {
    type: 'security_alert',
    groupBy: 'none',
    maxCount: 1,
    template: (count, notifications) => ({
      title: '安全警报',
      content: notifications[0].content
    })
  },
  login_alert: {
    type: 'login_alert',
    groupBy: 'none',
    maxCount: 5,
    template: (count, notifications) => {
      if (count === 1) {
        return { title: '登录提醒', content: notifications[0].content };
      }
      return { title: `${count} 次登录`, content: `检测到 ${count} 次新设备登录` };
    }
  },
  password_change: {
    type: 'password_change',
    groupBy: 'none',
    maxCount: 1,
    template: (count, notifications) => ({
      title: '密码变更',
      content: notifications[0].content
    })
  }
};

export function aggregateNotifications(
  notifications: Notification[],
  options?: {
    windowMs?: number;
    maxCount?: number;
  }
): NotificationAggregate[] {
  const windowMs = options?.windowMs || AGGREGATION_WINDOW_MS;
  const maxCount = options?.maxCount || MAX_AGGREGATE_COUNT;

  const groups = new Map<string, Notification[]>();

  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  for (const notification of sortedNotifications) {
    const rule = AGGREGATION_RULES[notification.type];
    if (!rule) {
      const key = `single-${notification.id}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(notification);
      continue;
    }

    const groupKey = generateGroupKey(notification, rule.groupBy);
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    
    const group = groups.get(groupKey)!;
    const latestInGroup = group[0];
    
    if (latestInGroup) {
      const timeDiff = new Date(latestInGroup.createdAt).getTime() - new Date(notification.createdAt).getTime();
      if (timeDiff > windowMs) {
        const newKey = `${groupKey}-${Date.now()}`;
        groups.set(newKey, [notification]);
        continue;
      }
    }
    
    if (group.length < maxCount) {
      group.push(notification);
    }
  }

  const aggregates: NotificationAggregate[] = [];

  for (const [, groupNotifications] of groups) {
    if (groupNotifications.length === 0) continue;

    const latestNotification = groupNotifications[0];
    const rule = AGGREGATION_RULES[latestNotification.type];
    
    const count = groupNotifications.length;
    const aggregatedIds = groupNotifications.map(n => n.id);

    let summary = latestNotification.content;
    if (rule && count > 1) {
      const template = rule.template(count, groupNotifications);
      summary = template.content;
    }

    aggregates.push({
      id: `agg-${latestNotification.id}`,
      type: latestNotification.type,
      category: latestNotification.category,
      count,
      latestNotification,
      notifications: groupNotifications,
      summary,
      createdAt: latestNotification.createdAt
    });
  }

  return aggregates.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function generateGroupKey(
  notification: Notification,
  groupBy: 'sender' | 'target' | 'none'
): string {
  const baseKey = `${notification.type}`;

  switch (groupBy) {
    case 'sender':
      return `${baseKey}-sender-${notification.senderId || 'unknown'}`;
    case 'target':
      const targetId = notification.workId || notification.postId || notification.activityId || notification.relatedId || 'unknown';
      return `${baseKey}-target-${targetId}`;
    case 'none':
    default:
      return baseKey;
  }
}

export function groupNotificationsByDate(
  notifications: Notification[]
): Map<string, Notification[]> {
  const groups = new Map<string, Notification[]>();
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  for (const notification of notifications) {
    const notificationDate = new Date(notification.createdAt);
    let groupKey: string;

    if (notificationDate >= today) {
      groupKey = 'today';
    } else if (notificationDate >= yesterday) {
      groupKey = 'yesterday';
    } else if (notificationDate >= thisWeek) {
      groupKey = 'thisWeek';
    } else if (notificationDate >= thisMonth) {
      groupKey = 'thisMonth';
    } else {
      groupKey = 'older';
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(notification);
  }

  return groups;
}

export function generateDigest(
  notifications: Notification[],
  period: 'daily' | 'weekly',
  userId: string
): NotificationDigest {
  const now = new Date();
  let startDate: Date;

  if (period === 'daily') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const periodNotifications = notifications.filter(
    n => new Date(n.createdAt) >= startDate
  );

  const totalCount = periodNotifications.length;
  const unreadCount = periodNotifications.filter(n => !n.isRead).length;

  const categories: Record<NotificationCategory, number> = {
    system: 0,
    interaction: 0,
    activity: 0,
    creator: 0,
    social: 0,
    promotion: 0,
    security: 0
  };

  for (const notification of periodNotifications) {
    categories[notification.category]++;
  }

  const highlights = periodNotifications
    .filter(n => n.priority === 'high' || n.priority === 'urgent')
    .slice(0, 5);

  const summary = generateDigestSummary(period, totalCount, unreadCount, categories);

  return {
    id: `digest-${userId}-${period}-${startDate.toISOString()}`,
    userId,
    period,
    startDate,
    endDate: now,
    totalCount,
    unreadCount,
    categories,
    highlights,
    summary,
    createdAt: now
  };
}

function generateDigestSummary(
  period: 'daily' | 'weekly',
  totalCount: number,
  unreadCount: number,
  categories: Record<NotificationCategory, number>
): string {
  const periodLabel = period === 'daily' ? '今日' : '本周';
  
  if (totalCount === 0) {
    return `${periodLabel}暂无新通知`;
  }

  const parts: string[] = [];
  
  if (categories.interaction > 0) {
    parts.push(`${categories.interaction} 条互动`);
  }
  if (categories.activity > 0) {
    parts.push(`${categories.activity} 条活动`);
  }
  if (categories.creator > 0) {
    parts.push(`${categories.creator} 条创作`);
  }
  if (categories.social > 0) {
    parts.push(`${categories.social} 条社交`);
  }
  if (categories.promotion > 0) {
    parts.push(`${categories.promotion} 条激励`);
  }
  if (categories.system > 0) {
    parts.push(`${categories.system} 条系统`);
  }
  if (categories.security > 0) {
    parts.push(`${categories.security} 条安全`);
  }

  const summary = `${periodLabel}共收到 ${totalCount} 条通知，其中 ${unreadCount} 条未读。包括：${parts.join('、')}。`;
  
  return summary;
}

export function getUnreadCountByCategory(
  notifications: Notification[]
): Record<NotificationCategory, number> {
  const counts: Record<NotificationCategory, number> = {
    system: 0,
    interaction: 0,
    activity: 0,
    creator: 0,
    social: 0,
    promotion: 0,
    security: 0
  };

  for (const notification of notifications) {
    if (!notification.isRead) {
      counts[notification.category]++;
    }
  }

  return counts;
}

export function getUnreadCountByPriority(
  notifications: Notification[]
): Record<string, number> {
  const counts: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0
  };

  for (const notification of notifications) {
    if (!notification.isRead) {
      counts[notification.priority]++;
    }
  }

  return counts;
}

export function shouldAggregate(
  type: NotificationType,
  settings: { enabled: boolean; categories: Record<NotificationCategory, boolean> }
): boolean {
  const categoryConfig = Object.values(NOTIFICATION_CATEGORIES).find(
    config => config.types.includes(type)
  );
  
  if (!categoryConfig) return false;
  
  return categoryConfig.canAggregate && settings.categories[categoryConfig.category];
}

export const notificationAggregationService = {
  aggregateNotifications,
  groupNotificationsByDate,
  generateDigest,
  getUnreadCountByCategory,
  getUnreadCountByPriority,
  shouldAggregate,
  AGGREGATION_RULES
};

export default notificationAggregationService;
