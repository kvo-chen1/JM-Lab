/**
 * 数据验证层
 * 使用Zod为所有数据模型提供验证功能
 */

import { z } from 'zod';
import { User, Work, Comment, Post, Category, Tag, Community, Notification, Message, Conversation, Achievement, UserAchievement, PointsTransaction, Event, FileMetadata } from '../types';

// 基础实体验证schema
export const baseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isDeleted: z.boolean().optional(),
});

// 用户验证schema
export const userSchema = baseEntitySchema.extend({
  username: z.string().min(2).max(50),
  email: z.string().email(),
  avatar: z.string().url().optional(),
  phone: z.string().optional(),
  interests: z.array(z.string()).optional(),
  isAdmin: z.boolean().optional(),
  age: z.number().int().min(0).max(150).optional(),
  tags: z.array(z.string()).optional(),
  membershipLevel: z.enum(['free', 'premium', 'vip']),
  membershipStart: z.date().optional(),
  membershipEnd: z.date().optional(),
  membershipStatus: z.enum(['active', 'expired', 'pending']),
});

// 作品验证schema
export const workSchema = baseEntitySchema.extend({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  userId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  likes: z.number().int().min(0),
  views: z.number().int().min(0),
  comments: z.number().int().min(0),
  isPublic: z.boolean(),
  isFeatured: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  thumbnailUrl: z.string().url().optional(),
  fileUrl: z.string().url().optional(),
  type: z.enum(['image', 'video', 'audio', 'text', '3d']),
});

// 评论验证schema
export const commentSchema = baseEntitySchema.extend({
  content: z.string().min(1).max(1000),
  userId: z.string().uuid(),
  workId: z.string().uuid().optional(),
  postId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  likes: z.number().int().min(0),
  isApproved: z.boolean(),
});

// 帖子验证schema
export const postSchema = baseEntitySchema.extend({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  userId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  likes: z.number().int().min(0),
  views: z.number().int().min(0),
  comments: z.number().int().min(0),
  isPublic: z.boolean(),
  isPinned: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  type: z.enum(['article', 'discussion', 'question', 'announcement']),
});

// 分类验证schema
export const categorySchema = baseEntitySchema.extend({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
  icon: z.string().optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  type: z.enum(['work', 'post', 'event']),
});

// 标签验证schema
export const tagSchema = baseEntitySchema.extend({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  count: z.number().int().min(0),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
});

// 社区验证schema
export const communitySchema = baseEntitySchema.extend({
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(500),
  creatorId: z.string().uuid(),
  avatarUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
  members: z.number().int().min(0),
  posts: z.number().int().min(0),
  isPublic: z.boolean(),
  tags: z.array(z.string()).optional(),
  rules: z.array(z.string()).optional(),
});

// 通知验证schema
export const notificationSchema = baseEntitySchema.extend({
  userId: z.string().uuid(),
  type: z.enum(['like', 'comment', 'follow', 'system', 'mention']),
  content: z.string().min(1).max(200),
  isRead: z.boolean(),
  relatedEntityId: z.string().uuid().optional(),
  relatedEntityType: z.string().optional(),
  senderId: z.string().uuid().optional(),
});

// 消息验证schema
export const messageSchema = baseEntitySchema.extend({
  senderId: z.string().uuid(),
  receiverId: z.string().uuid(),
  content: z.string().min(1).max(1000),
  isRead: z.boolean(),
  conversationId: z.string().uuid(),
  type: z.enum(['text', 'image', 'video', 'audio', 'file']),
});

// 会话验证schema
export const conversationSchema = baseEntitySchema.extend({
  participants: z.array(z.string().uuid()).min(2),
  lastMessageId: z.string().uuid().optional(),
  lastMessageAt: z.date().optional(),
  isGroup: z.boolean(),
  groupName: z.string().optional(),
  groupAvatar: z.string().url().optional(),
});

// 成就验证schema
export const achievementSchema = baseEntitySchema.extend({
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(500),
  icon: z.string().optional(),
  points: z.number().int().min(0),
  type: z.enum(['badge', 'title', 'reward']),
  requirements: z.record(z.any()),
  isHidden: z.boolean().optional(),
});

// 用户成就验证schema
export const userAchievementSchema = baseEntitySchema.extend({
  userId: z.string().uuid(),
  achievementId: z.string().uuid(),
  unlockedAt: z.date(),
  progress: z.number().min(0).max(100).optional(),
  isCompleted: z.boolean(),
});

// 积分交易验证schema
export const pointsTransactionSchema = baseEntitySchema.extend({
  userId: z.string().uuid(),
  amount: z.number().int(),
  type: z.enum(['earn', 'spend']),
  reason: z.string().min(1).max(200),
  balanceAfter: z.number().int().min(0),
  relatedEntityId: z.string().uuid().optional(),
  relatedEntityType: z.string().optional(),
});

// 事件验证schema
export const eventSchema = baseEntitySchema.extend({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(1000),
  startTime: z.date(),
  endTime: z.date().gt(z.ref('startTime')),
  location: z.string().optional(),
  organizerId: z.string().uuid(),
  participants: z.number().int().min(0),
  maxParticipants: z.number().int().min(1).optional(),
  isPublic: z.boolean(),
  type: z.enum(['online', 'offline']),
  tags: z.array(z.string()).optional(),
  thumbnailUrl: z.string().url().optional(),
});

// 文件元数据验证schema
export const fileMetadataSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  size: z.number().int().min(0),
  type: z.string(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  uploadDate: z.date(),
  userId: z.string().uuid(),
  metadata: z.record(z.any()).optional(),
});

// 分页参数验证schema
export const paginationParamsSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// 搜索参数验证schema
export const searchParamsSchema = paginationParamsSchema.extend({
  query: z.string().min(1),
  filters: z.record(z.any()).optional(),
  categories: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string()).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  userId: z.string().uuid().optional(),
});

// API响应验证schema
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => {
  return z.object({
    ok: z.boolean(),
    status: z.number().int().min(100).max(599),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
    meta: z.object({
      pagination: z.object({
        page: z.number().int().min(1),
        pageSize: z.number().int().min(1),
        total: z.number().int().min(0),
        totalPages: z.number().int().min(0),
      }).optional(),
    }).optional(),
  });
};

// 应用错误验证schema
export const appErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  details: z.any().optional(),
  status: z.number().int().min(100).max(599).optional(),
  timestamp: z.date(),
  stack: z.string().optional(),
});

// 应用日志验证schema
export const appLogSchema = z.object({
  id: z.string().uuid(),
  level: z.enum(['debug', 'info', 'warn', 'error', 'fatal']),
  message: z.string().min(1),
  timestamp: z.date(),
  context: z.record(z.any()).optional(),
  userId: z.string().uuid().optional(),
  ip: z.string().ip().optional(),
  userAgent: z.string().optional(),
});

// 系统配置验证schema
export const systemConfigSchema = baseEntitySchema.extend({
  key: z.string().min(1).max(100),
  value: z.any(),
  description: z.string().optional(),
  category: z.string().min(1).max(50),
  isPublic: z.boolean(),
  updatedBy: z.string().uuid().optional(),
});

// 验证工具函数
export const validateData = <T>(schema: z.ZodSchema<T>, data: any): { success: boolean; data?: T; error?: string } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Validation failed' };
  }
};

// 安全解析工具函数
export const safeParseData = <T>(schema: z.ZodSchema<T>, data: any): T | null => {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
};

// 部分验证工具函数
export const partialValidateData = <T>(schema: z.ZodSchema<T>, data: any): { success: boolean; data?: Partial<T>; error?: string } => {
  try {
    const partialSchema = schema.partial();
    const validatedData = partialSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Partial validation failed' };
  }
};

// 验证器类型映射
export const validators = {
  user: userSchema,
  work: workSchema,
  comment: commentSchema,
  post: postSchema,
  category: categorySchema,
  tag: tagSchema,
  community: communitySchema,
  notification: notificationSchema,
  message: messageSchema,
  conversation: conversationSchema,
  achievement: achievementSchema,
  userAchievement: userAchievementSchema,
  pointsTransaction: pointsTransactionSchema,
  event: eventSchema,
  fileMetadata: fileMetadataSchema,
  paginationParams: paginationParamsSchema,
  searchParams: searchParamsSchema,
  appError: appErrorSchema,
  appLog: appLogSchema,
  systemConfig: systemConfigSchema,
};

export type ValidatorKey = keyof typeof validators;

// 通用验证器函数
export const validate = <K extends ValidatorKey>(key: K, data: any): { success: boolean; data?: z.infer<typeof validators[K]>; error?: string } => {
  return validateData(validators[key], data);
};

// 通用安全解析函数
export const safeParse = <K extends ValidatorKey>(key: K, data: any): z.infer<typeof validators[K]> | null => {
  return safeParseData(validators[key], data);
};
