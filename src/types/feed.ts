/**
 * 动态内容展示系统类型定义
 * 参考哔哩哔哩动态页面设计
 */

import { BaseEntity, User } from './index';

// 动态内容类型
export type FeedContentType = 
  | 'text'        // 纯文本动态
  | 'image'       // 图文动态
  | 'video'       // 视频动态
  | 'article'     // 专栏文章
  | 'share'       // 分享动态
  | 'activity'    // 活动通知
  | 'community';  // 社群通知

// 动态发布者类型
export type FeedAuthorType = 'user' | 'brand' | 'official';

// 动态作者信息
export interface FeedAuthor {
  id: string;
  type: FeedAuthorType;
  name: string;
  avatar: string;
  verified?: boolean;
  verifiedType?: 'personal' | 'brand' | 'official';
  bio?: string;
  followersCount?: number;
  isFollowing?: boolean;
}

// 动态内容中的媒体文件
export interface FeedMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number; // 视频时长（秒）
  size?: number;
}

// 动态分享的目标内容
export interface FeedShareTarget {
  id: string;
  type: 'work' | 'post' | 'activity' | 'user' | 'community';
  title: string;
  description?: string;
  thumbnailUrl?: string;
  author?: FeedAuthor;
  url: string;
}

// 动态评论
export interface FeedComment {
  id: string;
  author: FeedAuthor;
  content: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
  replies?: FeedComment[];
  replyCount?: number;
}

// 动态内容
export interface FeedItem extends BaseEntity {
  author: FeedAuthor;
  contentType: FeedContentType;
  title?: string;           // 作品标题
  content: string;          // 动态内容/描述
  media?: FeedMedia[];
  shareTarget?: FeedShareTarget;
  tags?: string[];
  location?: string;

  // 数据来源类型，用于跳转路由判断
  sourceType?: 'post' | 'work' | 'community' | 'announcement';
  
  // 社群ID（用于@提及功能）
  communityId?: string;

  // 互动数据
  likes: number;
  comments: number;
  shares: number;
  views: number;

  // 用户互动状态
  isLiked?: boolean;
  isCollected?: boolean;
  isShared?: boolean;

  // 置顶和推荐
  isPinned?: boolean;
  isRecommended?: boolean;

  // 评论列表（可选，用于详情页）
  commentList?: FeedComment[];
}

// 动态筛选类型
export type FeedFilterType = 
  | 'all'        // 全部
  | 'community'  // 社群
  | 'video'      // 视频
  | 'image'      // 图文
  | 'article'    // 专栏
  | 'activity'   // 活动
  | 'brand';     // 品牌

// 动态排序方式
export type FeedSortType = 'latest' | 'hot' | 'recommend';

// 动态列表查询参数
export interface FeedQueryParams {
  filter?: FeedFilterType;
  sort?: FeedSortType;
  page?: number;
  pageSize?: number;
  userId?: string;
  brandId?: string;
  currentUserId?: string; // 当前用户ID，用于活动筛选（获取自己及关注用户的活动）
}

// 发布动态请求
export interface CreateFeedRequest {
  contentType: FeedContentType;
  title?: string;
  content: string;
  media?: Omit<FeedMedia, 'id'>[];
  tags?: string[];
  location?: string;
  shareTargetId?: string;
  shareTargetType?: FeedShareTarget['type'];
}

// 热搜条目
export interface HotSearchItem {
  id: string;
  rank: number;
  title: string;
  heat: number;
  trend: 'up' | 'down' | 'stable';
  isNew?: boolean;
  isHot?: boolean;
  category?: string;
}

// 推荐用户/品牌
export interface RecommendedUser {
  id: string;
  type: FeedAuthorType;
  name: string;
  avatar: string;
  bio: string;
  followersCount: number;
  worksCount?: number;
  isFollowing?: boolean;
}

// 推荐社群
export interface RecommendedCommunity {
  id: string;
  name: string;
  avatar: string;
  description: string;
  membersCount: number;
  postsCount: number;
  isJoined?: boolean;
}

// 社区中心公告
export interface CommunityAnnouncement {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'activity' | 'feature';
  createdAt: string;
  isRead?: boolean;
  link?: string;
}

// 动态统计信息
export interface FeedStats {
  totalFeeds: number;
  todayFeeds: number;
  totalViews: number;
  totalInteractions: number;
}

// 用户动态设置
export interface FeedUserSettings {
  notifyOnLike: boolean;
  notifyOnComment: boolean;
  notifyOnFollow: boolean;
  notifyOnActivity: boolean;
  showRecommendations: boolean;
  autoPlayVideo: boolean;
}
