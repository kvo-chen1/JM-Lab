/**
 * 统一数据模型库
 * 定义所有模块共享的数据类型
 */

// 基础实体类型
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted?: boolean;
}

// 用户相关类型
export interface User extends BaseEntity {
  username: string;
  email: string;
  avatar?: string;
  phone?: string;
  interests?: string[];
  isAdmin?: boolean;
  age?: number;
  tags?: string[];
  bio?: string;
  location?: string;
  occupation?: string;
  website?: string;
  github?: string;
  twitter?: string;
  coverImage?: string;
  metadata?: Record<string, any>;
  worksCount?: number;
  followersCount?: number;
  followingCount?: number;
  favoritesCount?: number;
  isNewUser?: boolean;
  membershipLevel: 'free' | 'premium' | 'vip';
  membershipStart?: Date | string; // Allow string for compatibility
  membershipEnd?: Date | string; // Allow string for compatibility
  membershipStatus: 'active' | 'expired' | 'pending';
}

// 作品相关类型
export interface Work extends BaseEntity {
  title: string;
  description?: string;
  userId: string;
  categoryId?: string;
  tags?: string[];
  likes: number;
  views: number;
  comments: number;
  isPublic: boolean;
  isFeatured?: boolean;
  metadata?: Record<string, any>;
  thumbnailUrl?: string;
  fileUrl?: string;
  type: 'image' | 'video' | 'audio' | 'text' | '3d';
}

// 评论相关类型
export interface Comment extends BaseEntity {
  content: string;
  userId: string;
  workId?: string;
  postId?: string;
  parentId?: string;
  likes: number;
  isApproved: boolean;
}

// 帖子相关类型
export interface Post extends BaseEntity {
  title: string;
  content: string;
  userId: string;
  categoryId?: string;
  tags?: string[];
  likes: number;
  views: number;
  comments: number;
  isPublic: boolean;
  isPinned?: boolean;
  isFeatured?: boolean;
  type: 'article' | 'discussion' | 'question' | 'announcement' | 'video' | 'image';
}

// 分类相关类型
export interface Category extends BaseEntity {
  name: string;
  description?: string;
  parentId?: string;
  icon?: string;
  slug: string;
  type: 'work' | 'post' | 'event';
}

// 标签相关类型
export interface Tag extends BaseEntity {
  name: string;
  description?: string;
  count: number;
  slug: string;
}

// 社区相关类型
export interface Community extends BaseEntity {
  name: string;
  description: string;
  creatorId: string;
  avatarUrl?: string;
  coverUrl?: string;
  members: number;
  posts: number;
  isPublic: boolean;
  tags?: string[];
  rules?: string[];
}

// 通知相关类型
export interface Notification extends BaseEntity {
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'system' | 'mention';
  content: string;
  isRead: boolean;
  relatedEntityId?: string;
  relatedEntityType?: string;
  senderId?: string;
}

// 消息相关类型
export interface Message extends BaseEntity {
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  conversationId: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
}

// 会话相关类型
export interface Conversation extends BaseEntity {
  participants: string[];
  lastMessageId?: string;
  lastMessageAt?: Date;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
}

// 权限相关类型
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
}

// 角色相关类型
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
}

// 用户角色关联类型
export interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy?: string;
}

// 活动相关类型
export interface Event extends BaseEntity {
  title: string;
  description: string;
  content: string; // 富文本内容
  startTime: Date;
  endTime: Date;
  location?: string;
  organizerId: string;
  participants: number;
  maxParticipants?: number;
  isPublic: boolean;
  type: 'online' | 'offline';
  tags?: string[];
  thumbnailUrl?: string;
  media: Media[]; // 多媒体资源列表
  status: 'draft' | 'pending' | 'published' | 'rejected'; // 发布状态
  publishedAt?: Date;
  rejectionReason?: string;
 审核人Id?: string;
 审核时间?: Date;
  viewCount: number;
  shareCount: number;
  likeCount: number;
}

// 媒体资源类型
export interface Media {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  name: string;
  size: number;
  uploadDate: Date;
  order: number;
  altText?: string;
}

// 活动创建请求类型
export interface EventCreateRequest {
  title: string;
  description: string;
  content: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  type: 'online' | 'offline';
  tags?: string[];
  media: Media[];
  isPublic: boolean;
  maxParticipants?: number;
  status?: 'draft' | 'pending' | 'published' | 'rejected';
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  pushToCommunity?: boolean;
  applyForRecommendation?: boolean;
}

// 活动更新请求类型
export interface EventUpdateRequest {
  title?: string;
  description?: string;
  content?: string;
  startTime?: Date;
  endTime?: Date;
  location?: string;
  type?: 'online' | 'offline';
  tags?: string[];
  media?: Media[];
  isPublic?: boolean;
  maxParticipants?: number;
  status?: 'draft' | 'pending' | 'published' | 'rejected';
}

// 活动发布请求类型
export interface EventPublishRequest {
  eventId: string;
  notes?: string;
}

// 积分相关类型
export interface PointsTransaction extends BaseEntity {
  userId: string;
  amount: number;
  type: 'earn' | 'spend';
  reason: string;
  balanceAfter: number;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

// 成就相关类型
export interface Achievement extends BaseEntity {
  name: string;
  description: string;
  icon?: string;
  points: number;
  type: 'badge' | 'title' | 'reward';
  requirements: Record<string, any>;
  isHidden?: boolean;
}

// 用户成就相关类型
export interface UserAchievement extends BaseEntity {
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  progress?: number;
  isCompleted: boolean;
}

// API响应类型
export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    [key: string]: any;
  };
}

// 分页请求类型
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 搜索请求类型
export interface SearchParams extends PaginationParams {
  query: string;
  filters?: Record<string, any>;
  categories?: string[];
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  userId?: string;
}

// 排序请求类型
export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// 过滤请求类型
export interface FilterParams {
  [key: string]: any;
}

// 文件上传相关类型
export interface FileUpload {
  file: File;
  metadata?: Record<string, any>;
  onProgress?: (progress: number) => void;
}

// 文件元数据类型
export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
  uploadDate: Date;
  userId: string;
  metadata?: Record<string, any>;
}

// 错误相关类型
export interface AppError {
  code: string;
  message: string;
  details?: any;
  status?: number;
  timestamp: Date;
  stack?: string;
}

// 日志相关类型
export interface AppLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

// 系统配置相关类型
export interface SystemConfig {
  id: string;
  key: string;
  value: any;
  description?: string;
  category: string;
  isPublic: boolean;
  updatedBy?: string;
}

// 活动参与记录类型
export interface ActivityParticipation extends BaseEntity {
  userId: string;
  eventId: string;
  event: Event;
  status: 'registered' | 'submitted' | 'reviewing' | 'completed' | 'awarded' | 'cancelled';
  progress: number; // 0-100
  currentStep: number; // 1: 报名成功, 2: 作品提交, 3: 评审中, 4: 结果公布
  submittedWorkId?: string;
  ranking?: number;
  award?: string;
  registrationDate: Date;
  submissionDate?: Date;
}
