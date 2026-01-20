/**
 * 完整事件类型定义
 * 按业务领域分类事件，支持事件继承
 */

// 基础事件类型
export interface BaseEvent {
  eventId: string;
  eventType: string;
  timestamp: number;
  source: string;
  userId?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

// 用户相关事件
export interface UserEvent extends BaseEvent {
  user: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
}

// 用户登录事件
export interface UserLoginEvent extends UserEvent {
  loginMethod: string;
  ipAddress?: string;
  userAgent?: string;
  isNewUser?: boolean;
}

// 用户登出事件
export interface UserLogoutEvent extends UserEvent {
  reason?: string;
}

// 用户注册事件
export interface UserRegisteredEvent extends UserEvent {
  registrationMethod: string;
  referrer?: string;
}

// 用户更新事件
export interface UserUpdatedEvent extends UserEvent {
  changes: Record<string, any>;
  updatedBy?: string;
}

// 作品相关事件
export interface WorkEvent extends BaseEvent {
  work: {
    id: string;
    title: string;
    type: string;
    userId: string;
  };
}

// 作品创建事件
export interface WorkCreatedEvent extends WorkEvent {
  categoryId?: string;
  tags?: string[];
  isPublic: boolean;
}

// 作品更新事件
export interface WorkUpdatedEvent extends WorkEvent {
  changes: Record<string, any>;
  updatedBy?: string;
}

// 作品删除事件
export interface WorkDeletedEvent extends WorkEvent {
  deletedBy?: string;
  reason?: string;
}

// 作品点赞事件
export interface WorkLikedEvent extends WorkEvent {
  likerId: string;
  isLiked: boolean;
}

// 作品查看事件
export interface WorkViewedEvent extends WorkEvent {
  viewerId?: string;
  viewerIp?: string;
  duration?: number;
}

// 评论相关事件
export interface CommentEvent extends BaseEvent {
  comment: {
    id: string;
    content: string;
    userId: string;
    workId?: string;
    postId?: string;
    parentId?: string;
  };
}

// 评论创建事件
export interface CommentCreatedEvent extends CommentEvent {
  isApproved: boolean;
}

// 评论更新事件
export interface CommentUpdatedEvent extends CommentEvent {
  changes: Record<string, any>;
  updatedBy?: string;
}

// 评论删除事件
export interface CommentDeletedEvent extends CommentEvent {
  deletedBy?: string;
  reason?: string;
}

// 评论点赞事件
export interface CommentLikedEvent extends CommentEvent {
  likerId: string;
  isLiked: boolean;
}

// 帖子相关事件
export interface PostEvent extends BaseEvent {
  post: {
    id: string;
    title: string;
    type: string;
    userId: string;
  };
}

// 帖子创建事件
export interface PostCreatedEvent extends PostEvent {
  categoryId?: string;
  tags?: string[];
  isPublic: boolean;
  isPinned?: boolean;
}

// 帖子更新事件
export interface PostUpdatedEvent extends PostEvent {
  changes: Record<string, any>;
  updatedBy?: string;
}

// 帖子删除事件
export interface PostDeletedEvent extends PostEvent {
  deletedBy?: string;
  reason?: string;
}

// 帖子点赞事件
export interface PostLikedEvent extends PostEvent {
  likerId: string;
  isLiked: boolean;
}

// 帖子查看事件
export interface PostViewedEvent extends PostEvent {
  viewerId?: string;
  viewerIp?: string;
  duration?: number;
}

// 分类相关事件
export interface CategoryEvent extends BaseEvent {
  category: {
    id: string;
    name: string;
    type: string;
    slug: string;
  };
}

// 分类创建事件
export interface CategoryCreatedEvent extends CategoryEvent {
  parentId?: string;
  createdBy: string;
}

// 分类更新事件
export interface CategoryUpdatedEvent extends CategoryEvent {
  changes: Record<string, any>;
  updatedBy: string;
}

// 分类删除事件
export interface CategoryDeletedEvent extends CategoryEvent {
  deletedBy: string;
  reason?: string;
}

// 搜索相关事件
export interface SearchEvent extends BaseEvent {
  query: string;
  filters?: Record<string, any>;
  categories?: string[];
  tags?: string[];
  resultsCount?: number;
  duration?: number;
}

// 系统相关事件
export interface SystemEvent extends BaseEvent {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  error?: {
    code?: string;
    stack?: string;
    details?: any;
  };
  context?: Record<string, any>;
}

// 主题变更事件
export interface ThemeChangedEvent extends SystemEvent {
  oldTheme: string;
  newTheme: string;
  userId: string;
}

// 语言变更事件
export interface LanguageChangedEvent extends SystemEvent {
  oldLanguage: string;
  newLanguage: string;
  userId: string;
}

// 应用就绪事件
export interface AppReadyEvent extends SystemEvent {
  version: string;
  environment: string;
  uptime?: number;
}

// 应用错误事件
export interface AppErrorEvent extends SystemEvent {
  error: {
    code: string;
    message: string;
    stack?: string;
    details?: any;
  };
  request?: {
    method?: string;
    path?: string;
    params?: Record<string, any>;
    query?: Record<string, any>;
    body?: any;
  };
  user?: {
    id?: string;
    username?: string;
  };
}

// 数据同步相关事件
export interface DataSyncEvent extends BaseEvent {
  syncId: string;
  source: string;
  target: string;
  status: 'started' | 'completed' | 'failed' | 'in_progress';
  recordsProcessed?: number;
  recordsFailed?: number;
  duration?: number;
}

// 数据同步开始事件
export interface DataSyncStartedEvent extends DataSyncEvent {
  recordsTotal?: number;
  syncType: string;
  config?: Record<string, any>;
}

// 数据同步完成事件
export interface DataSyncCompletedEvent extends DataSyncEvent {
  recordsSynced: number;
  summary?: Record<string, any>;
}

// 数据同步失败事件
export interface DataSyncFailedEvent extends DataSyncEvent {
  error: {
    code: string;
    message: string;
    stack?: string;
    details?: any;
  };
  retryCount?: number;
}

// 模拟数据相关事件
export interface MockDataEvent extends BaseEvent {
  mockDataId?: string;
  config?: Record<string, any>;
}

// 模拟数据切换事件
export interface MockDataToggledEvent extends MockDataEvent {
  isEnabled: boolean;
  dataset?: string;
}

// 模拟数据配置更新事件
export interface MockDataConfigUpdatedEvent extends MockDataEvent {
  changes: Record<string, any>;
  updatedBy?: string;
}

// 认证相关事件
export interface AuthEvent extends BaseEvent {
  authId?: string;
  authType: string;
}

// 认证成功事件
export interface AuthSuccessEvent extends AuthEvent {
  userId: string;
  authMethod: string;
  tokenType?: string;
  expiresIn?: number;
}

// 认证失败事件
export interface AuthFailedEvent extends AuthEvent {
  reason: string;
  email?: string;
  username?: string;
}

// 权限相关事件
export interface PermissionEvent extends BaseEvent {
  permission: {
    id: string;
    name: string;
    resource: string;
    action: string;
  };
  userId?: string;
}

// 权限授予事件
export interface PermissionGrantedEvent extends PermissionEvent {
  grantedBy: string;
  grantedAt: Date;
}

// 权限撤销事件
export interface PermissionRevokedEvent extends PermissionEvent {
  revokedBy: string;
  revokedAt: Date;
  reason?: string;
}

// 角色相关事件
export interface RoleEvent extends BaseEvent {
  role: {
    id: string;
    name: string;
    description?: string;
  };
}

// 角色创建事件
export interface RoleCreatedEvent extends RoleEvent {
  permissions: string[];
  createdBy: string;
  isSystemRole: boolean;
}

// 角色更新事件
export interface RoleUpdatedEvent extends RoleEvent {
  changes: Record<string, any>;
  updatedBy: string;
}

// 角色删除事件
export interface RoleDeletedEvent extends RoleEvent {
  deletedBy: string;
  reason?: string;
}

// 角色分配事件
export interface RoleAssignedEvent extends RoleEvent {
  userId: string;
  assignedBy: string;
  assignedAt: Date;
}

// 角色移除事件
export interface RoleRemovedEvent extends RoleEvent {
  userId: string;
  removedBy: string;
  removedAt: Date;
  reason?: string;
}

// 积分相关事件
export interface PointsEvent extends BaseEvent {
  userId: string;
  amount: number;
  balance: number;
  transactionType: 'earn' | 'spend';
}

// 积分获取事件
export interface PointsEarnedEvent extends PointsEvent {
  reason: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

// 积分消费事件
export interface PointsSpentEvent extends PointsEvent {
  reason: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

// 通知相关事件
export interface NotificationEvent extends BaseEvent {
  notification: {
    id: string;
    type: string;
    content: string;
    recipientId: string;
  };
}

// 通知发送事件
export interface NotificationSentEvent extends NotificationEvent {
  status: 'sent' | 'failed';
  channel: string;
  error?: string;
}

// 通知阅读事件
export interface NotificationReadEvent extends NotificationEvent {
  readAt: Date;
}

// 所有事件类型联合类型
export type Event = 
  | UserLoginEvent
  | UserLogoutEvent
  | UserRegisteredEvent
  | UserUpdatedEvent
  | WorkCreatedEvent
  | WorkUpdatedEvent
  | WorkDeletedEvent
  | WorkLikedEvent
  | WorkViewedEvent
  | CommentCreatedEvent
  | CommentUpdatedEvent
  | CommentDeletedEvent
  | CommentLikedEvent
  | PostCreatedEvent
  | PostUpdatedEvent
  | PostDeletedEvent
  | PostLikedEvent
  | PostViewedEvent
  | CategoryCreatedEvent
  | CategoryUpdatedEvent
  | CategoryDeletedEvent
  | SearchEvent
  | ThemeChangedEvent
  | LanguageChangedEvent
  | AppReadyEvent
  | AppErrorEvent
  | DataSyncStartedEvent
  | DataSyncCompletedEvent
  | DataSyncFailedEvent
  | MockDataToggledEvent
  | MockDataConfigUpdatedEvent
  | AuthSuccessEvent
  | AuthFailedEvent
  | PermissionGrantedEvent
  | PermissionRevokedEvent
  | RoleCreatedEvent
  | RoleUpdatedEvent
  | RoleDeletedEvent
  | RoleAssignedEvent
  | RoleRemovedEvent
  | PointsEarnedEvent
  | PointsSpentEvent
  | NotificationSentEvent
  | NotificationReadEvent
  | BaseEvent
  | UserEvent
  | WorkEvent
  | CommentEvent
  | PostEvent
  | CategoryEvent
  | SystemEvent
  | DataSyncEvent
  | MockDataEvent
  | AuthEvent
  | PermissionEvent
  | RoleEvent
  | PointsEvent
  | NotificationEvent;

// 事件类型枚举
export enum EventType {
  // 用户相关事件
  USER_LOGIN = 'user:login',
  USER_LOGOUT = 'user:logout',
  USER_REGISTERED = 'user:registered',
  USER_UPDATED = 'user:updated',
  
  // 作品相关事件
  WORK_CREATED = 'work:created',
  WORK_UPDATED = 'work:updated',
  WORK_DELETED = 'work:deleted',
  WORK_LIKED = 'work:liked',
  WORK_UNLIKED = 'work:unliked',
  WORK_VIEWED = 'work:viewed',
  
  // 评论相关事件
  COMMENT_CREATED = 'comment:created',
  COMMENT_UPDATED = 'comment:updated',
  COMMENT_DELETED = 'comment:deleted',
  COMMENT_LIKED = 'comment:liked',
  COMMENT_UNLIKED = 'comment:unliked',
  
  // 帖子相关事件
  POST_CREATED = 'post:created',
  POST_UPDATED = 'post:updated',
  POST_DELETED = 'post:deleted',
  POST_LIKED = 'post:liked',
  POST_UNLIKED = 'post:unliked',
  POST_VIEWED = 'post:viewed',
  
  // 分类相关事件
  CATEGORY_CREATED = 'category:created',
  CATEGORY_UPDATED = 'category:updated',
  CATEGORY_DELETED = 'category:deleted',
  
  // 搜索相关事件
  SEARCH_PERFORMED = 'search:performed',
  
  // 系统相关事件
  THEME_CHANGED = 'theme:changed',
  LANGUAGE_CHANGED = 'language:changed',
  APP_READY = 'app:ready',
  APP_ERROR = 'app:error',
  
  // 数据同步事件
  DATA_SYNC_STARTED = 'data:sync:started',
  DATA_SYNC_COMPLETED = 'data:sync:completed',
  DATA_SYNC_FAILED = 'data:sync:failed',
  
  // 模拟数据事件
  MOCK_DATA_TOGGLED = 'mock:data:toggled',
  MOCK_DATA_CONFIG_UPDATED = 'mock:data:config:updated',
  
  // 认证相关事件
  AUTH_SUCCESS = 'auth:success',
  AUTH_FAILED = 'auth:failed',
  
  // 权限相关事件
  PERMISSION_GRANTED = 'permission:granted',
  PERMISSION_REVOKED = 'permission:revoked',
  
  // 角色相关事件
  ROLE_CREATED = 'role:created',
  ROLE_UPDATED = 'role:updated',
  ROLE_DELETED = 'role:deleted',
  ROLE_ASSIGNED = 'role:assigned',
  ROLE_REMOVED = 'role:removed',
  
  // 积分相关事件
  POINTS_EARNED = 'points:earned',
  POINTS_SPENT = 'points:spent',
  
  // 通知相关事件
  NOTIFICATION_SENT = 'notification:sent',
  NOTIFICATION_READ = 'notification:read',
}

// 事件优先级枚举
export enum EventPriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 10,
  CRITICAL = 15
}

// 事件过滤条件类型
export interface EventFilter {
  eventType?: string | string[];
  source?: string | string[];
  userId?: string;
  priority?: EventPriority | EventPriority[];
  metadata?: Record<string, any>;
}

// 事件处理器类型
export type EventHandler<T = Event> = (event: T) => void;

// 事件订阅选项
export interface EventSubscriptionOptions {
  priority?: EventPriority;
  filter?: EventFilter;
  delay?: number;
  once?: boolean;
  debounce?: number;
  throttle?: number;
  maxExecutions?: number;
}

// 事件订阅接口
export interface EventSubscription {
  unsubscribe: () => void;
  subscriptionId: string;
  eventType: string;
  options: EventSubscriptionOptions;
}

// 事件总线接口
export interface EnhancedEventBus {
  // 订阅事件
  on<T = Event>(eventType: string | string[], handler: EventHandler<T>, options?: EventSubscriptionOptions): EventSubscription;
  
  // 订阅事件，只执行一次
  once<T = Event>(eventType: string | string[], handler: EventHandler<T>, options?: EventSubscriptionOptions): EventSubscription;
  
  // 取消订阅
  off<T = Event>(eventType: string | string[], handler: EventHandler<T>): void;
  
  // 发布事件
  emit<T = Event>(eventType: string, eventData?: Omit<T, 'eventId' | 'eventType' | 'timestamp' | 'source'>, options?: { priority?: EventPriority; delay?: number }): string;
  
  // 获取事件订阅数量
  getSubscriptionCount(eventType?: string): number;
  
  // 清除所有订阅
  clear(): void;
  
  // 清除指定事件的所有订阅
  clearEvent(eventType: string): void;
  
  // 获取所有事件类型
  getAllEventTypes(): string[];
  
  // 设置事件总线调试模式
  setDebugMode(debug: boolean): void;
  
  // 获取事件总线状态
  getStatus(): {
    subscriptionCount: number;
    eventTypes: number;
    isDebugMode: boolean;
  };
  
  // 发布批量事件
  emitBatch<T = Event>(events: Array<{ eventType: string; eventData: Omit<T, 'eventId' | 'eventType' | 'timestamp' | 'source'>; options?: { priority?: EventPriority; delay?: number } }>): string[];
}
