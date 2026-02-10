import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';

/**
 * 收藏项类型枚举
 */
export enum CollectionType {
  SQUARE_WORK = 'square_work',      // 广场作品
  COMMUNITY_POST = 'community_post', // 社区帖子
  ACTIVITY = 'activity',             // 活动
  TEMPLATE = 'template',             // 模板
}

/**
 * 排序选项
 */
export enum SortOption {
  NEWEST = 'newest',       // 最新收藏
  OLDEST = 'oldest',       // 最早收藏
  MOST_LIKED = 'likes',    // 最多点赞
  MOST_VIEWED = 'views',   // 最多浏览
}

/**
 * 收藏项统计信息
 */
export interface CollectionStats {
  views: number;
  likes: number;
  comments: number;
}

/**
 * 作者信息
 */
export interface CollectionAuthor {
  id: string;
  name: string;
  avatar: string;
}

/**
 * 统一收藏项接口
 */
export interface CollectionItem {
  id: string;
  title: string;
  thumbnail: string;
  type: CollectionType;
  category: string;
  createdAt: string;
  stats: CollectionStats;
  isBookmarked: boolean;
  isLiked: boolean;
  link: string;
  author?: CollectionAuthor;
  description?: string;
  tags?: string[];
}

/**
 * 收藏查询选项
 */
export interface CollectionOptions {
  type?: CollectionType | 'all';
  sort?: SortOption;
  page?: number;
  limit?: number;
}

/**
 * 收藏查询结果
 */
export interface CollectionResult {
  items: CollectionItem[];
  total: number;
  hasMore: boolean;
}

/**
 * 用户收藏统计
 */
export interface UserCollectionStats {
  total: number;
  squareWork: number;
  communityPost: number;
  activity: number;
  template: number;
  totalLikes: number;
}

// ============================================
// 辅助函数
// ============================================

/**
 * 处理错误
 */
function handleError(error: any, fallbackMessage: string): void {
  console.error(fallbackMessage, error);
  toast.error(fallbackMessage);
}

// ============================================
// 广场作品相关
// ============================================

/**
 * 获取用户收藏的广场作品
 */
async function getBookmarkedSquareWorks(
  sort: SortOption = SortOption.NEWEST
): Promise<CollectionItem[]> {
  try {
    const response = await apiClient.get('/api/user/bookmarks');
    if (!response.ok) {
      throw new Error(response.error || '获取收藏作品失败');
    }

    const works = response.data || [];

    // 转换为 CollectionItem
    return works.map((work: any) => ({
      id: work.id?.toString() || '',
      title: work.title || '未命名作品',
      thumbnail: work.thumbnail || work.cover_url || '/placeholder-image.jpg',
      type: CollectionType.SQUARE_WORK,
      category: work.category || '其他',
      createdAt: work.created_at && !isNaN(Date.parse(work.created_at)) 
        ? new Date(work.created_at).toISOString() 
        : new Date().toISOString(),
      stats: {
        views: work.views || 0,
        likes: work.likes || 0,
        comments: work.comments || 0,
      },
      isBookmarked: true,
      isLiked: false,
      link: `/explore/${work.id}`,
      author: work.creator_id ? {
        id: work.creator_id,
        name: work.username || work.creator_name || '未知作者',
        avatar: work.avatar_url || work.creator_avatar || '/default-avatar.jpg',
      } : undefined,
      description: work.description,
    }));
  } catch (error) {
    handleError(error, '获取收藏作品失败');
    return [];
  }
}

/**
 * 获取用户点赞的广场作品
 */
async function getLikedSquareWorks(
  sort: SortOption = SortOption.NEWEST
): Promise<CollectionItem[]> {
  try {
    const response = await apiClient.get('/api/user/likes');
    if (!response.ok) {
      throw new Error(response.error || '获取点赞作品失败');
    }

    const works = response.data || [];

    return works.map((work: any) => ({
      id: work.id?.toString() || '',
      title: work.title || '未命名作品',
      thumbnail: work.thumbnail || work.cover_url || '/placeholder-image.jpg',
      type: CollectionType.SQUARE_WORK,
      category: work.category || '其他',
      createdAt: work.created_at && !isNaN(Date.parse(work.created_at))
        ? new Date(work.created_at).toISOString()
        : new Date().toISOString(),
      stats: {
        views: work.views || 0,
        likes: work.likes || 0,
        comments: work.comments || 0,
      },
      isBookmarked: false,
      isLiked: true,
      link: `/explore/${work.id}`,
      author: work.creator_id ? {
        id: work.creator_id,
        name: work.username || work.creator_name || '未知作者',
        avatar: work.avatar_url || work.creator_avatar || '/default-avatar.jpg',
      } : undefined,
      description: work.description,
    }));
  } catch (error) {
    handleError(error, '获取点赞作品失败');
    return [];
  }
}

// ============================================
// 津脉模板相关 (暂不支持)
// ============================================

/**
 * 获取用户收藏的模板
 */
async function getBookmarkedTemplates(
  sort: SortOption = SortOption.NEWEST
): Promise<CollectionItem[]> {
  // 模板功能暂未实现，返回空数组
  return [];
}

/**
 * 获取用户点赞的模板
 */
async function getLikedTemplates(
  sort: SortOption = SortOption.NEWEST
): Promise<CollectionItem[]> {
  // 模板功能暂未实现，返回空数组
  return [];
}

// ============================================
// 社区帖子相关 (暂不支持)
// ============================================

/**
 * 获取用户收藏的社区帖子
 */
async function getBookmarkedCommunityPosts(
  sort: SortOption = SortOption.NEWEST
): Promise<CollectionItem[]> {
  // 社区帖子收藏功能暂未实现，返回空数组
  return [];
}

/**
 * 获取用户点赞的社区帖子
 */
async function getLikedCommunityPosts(
  sort: SortOption = SortOption.NEWEST
): Promise<CollectionItem[]> {
  // 社区帖子点赞功能暂未实现，返回空数组
  return [];
}

// ============================================
// 活动相关 (暂不支持)
// ============================================

/**
 * 获取用户收藏的活动
 */
async function getBookmarkedActivities(
  sort: SortOption = SortOption.NEWEST
): Promise<CollectionItem[]> {
  // 活动收藏功能暂未实现，返回空数组
  return [];
}

// ============================================
// 主要导出方法
// ============================================

/**
 * 获取用户所有收藏
 */
export async function getUserCollections(
  options: CollectionOptions = {}
): Promise<CollectionResult> {
  const { type = 'all', sort = SortOption.NEWEST, page = 1, limit = 20 } = options;

  let allItems: CollectionItem[] = [];

  // 根据类型获取数据
  if (type === 'all' || type === CollectionType.SQUARE_WORK) {
    const works = await getBookmarkedSquareWorks(sort);
    allItems = [...allItems, ...works];
  }

  if (type === 'all' || type === CollectionType.TEMPLATE) {
    const templates = await getBookmarkedTemplates(sort);
    allItems = [...allItems, ...templates];
  }

  if (type === 'all' || type === CollectionType.COMMUNITY_POST) {
    const posts = await getBookmarkedCommunityPosts(sort);
    allItems = [...allItems, ...posts];
  }

  if (type === 'all' || type === CollectionType.ACTIVITY) {
    const activities = await getBookmarkedActivities(sort);
    allItems = [...allItems, ...activities];
  }

  // 排序
  allItems.sort((a, b) => {
    switch (sort) {
      case SortOption.NEWEST:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case SortOption.OLDEST:
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case SortOption.MOST_LIKED:
        return b.stats.likes - a.stats.likes;
      case SortOption.MOST_VIEWED:
        return b.stats.views - a.stats.views;
      default:
        return 0;
    }
  });

  const total = allItems.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedItems = allItems.slice(start, end);

  return {
    items: paginatedItems,
    total,
    hasMore: end < total,
  };
}

/**
 * 获取用户所有点赞
 */
export async function getUserLikes(
  options: CollectionOptions = {}
): Promise<CollectionResult> {
  const { type = 'all', sort = SortOption.NEWEST, page = 1, limit = 20 } = options;

  let allItems: CollectionItem[] = [];

  if (type === 'all' || type === CollectionType.SQUARE_WORK) {
    const works = await getLikedSquareWorks(sort);
    allItems = [...allItems, ...works];
  }

  if (type === 'all' || type === CollectionType.TEMPLATE) {
    const templates = await getLikedTemplates(sort);
    allItems = [...allItems, ...templates];
  }

  if (type === 'all' || type === CollectionType.COMMUNITY_POST) {
    const posts = await getLikedCommunityPosts(sort);
    allItems = [...allItems, ...posts];
  }

  // 排序
  allItems.sort((a, b) => {
    switch (sort) {
      case SortOption.NEWEST:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case SortOption.OLDEST:
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case SortOption.MOST_LIKED:
        return b.stats.likes - a.stats.likes;
      case SortOption.MOST_VIEWED:
        return b.stats.views - a.stats.views;
      default:
        return 0;
    }
  });

  const total = allItems.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedItems = allItems.slice(start, end);

  return {
    items: paginatedItems,
    total,
    hasMore: end < total,
  };
}

/**
 * 获取用户收藏统计
 */
export async function getUserCollectionStats(): Promise<UserCollectionStats> {
  try {
    // 获取收藏数量
    const bookmarksRes = await apiClient.get('/api/user/bookmarks/count');
    const bookmarksCount = bookmarksRes.ok ? (bookmarksRes.data?.count || 0) : 0;

    // 获取点赞数量
    const likesRes = await apiClient.get('/api/user/likes/count');
    const likesCount = likesRes.ok ? (likesRes.data?.count || 0) : 0;

    return {
      total: bookmarksCount,
      squareWork: bookmarksCount, // 目前只支持作品收藏
      communityPost: 0,
      activity: 0,
      template: 0,
      totalLikes: likesCount,
    };
  } catch (error) {
    console.error('获取收藏统计失败:', error);
    return {
      total: 0,
      squareWork: 0,
      communityPost: 0,
      activity: 0,
      template: 0,
      totalLikes: 0,
    };
  }
}

/**
 * 切换收藏状态
 */
export async function toggleBookmark(
  id: string,
  type: CollectionType
): Promise<boolean> {
  try {
    // 目前只支持作品收藏
    if (type !== CollectionType.SQUARE_WORK) {
      toast.error('该类型暂不支持收藏');
      return false;
    }

    const response = await apiClient.post(`/api/works/${id}/bookmark`, {});
    if (!response.ok) {
      throw new Error(response.error || '操作失败');
    }

    const result = response.data;
    if (result.isBookmarked) {
      toast.success('已添加到收藏');
    } else {
      toast.success('已取消收藏');
    }
    return result.isBookmarked;
  } catch (error) {
    handleError(error, '操作失败，请重试');
    return false;
  }
}

/**
 * 切换点赞状态
 */
export async function toggleLike(
  id: string,
  type: CollectionType
): Promise<boolean> {
  try {
    // 目前只支持作品点赞
    if (type !== CollectionType.SQUARE_WORK) {
      toast.error('该类型暂不支持点赞');
      return false;
    }

    const response = await apiClient.post(`/api/works/${id}/like`, {});
    if (!response.ok) {
      throw new Error(response.error || '操作失败');
    }

    const result = response.data;
    if (result.isLiked) {
      toast.success('已点赞');
    } else {
      toast.success('已取消点赞');
    }
    return result.isLiked;
  } catch (error) {
    handleError(error, '操作失败，请重试');
    return false;
  }
}

// ============================================
// 导出服务
// ============================================
export const collectionService = {
  getUserCollections,
  getUserLikes,
  getUserCollectionStats,
  toggleBookmark,
  toggleLike,
  CollectionType,
  SortOption,
};

export default collectionService;
