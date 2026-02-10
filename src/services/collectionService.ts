import apiClient from '@/lib/apiClient';
import { supabase } from '@/lib/supabase';
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
  templateLikes: number; // 模板点赞数
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
    // 获取当前用户ID - 优先从 localStorage 获取，因为登录信息存储在那里
    let userId: string | null = null;
    let userStr: string | null = null;
    
    // 首先尝试从 localStorage 获取
    userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        userId = userData?.id || null;
        console.log('[getBookmarkedSquareWorks] Got userId from localStorage:', userId);
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
      }
    }
    
    // 如果 localStorage 没有，再尝试从 Supabase Auth 获取
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
      console.log('[getBookmarkedSquareWorks] Got userId from Supabase Auth:', userId);
    }
    
    if (!userId) {
      console.log('[getBookmarkedSquareWorks] No userId found');
      return [];
    }
    
    console.log('[getBookmarkedSquareWorks] Fetching bookmarks for user:', userId);

    // 从 Supabase bookmarks 表获取收藏
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('bookmarks')
      .select('post_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    console.log('[getBookmarkedSquareWorks] Bookmarks result:', { bookmarks, error: bookmarksError });

    if (bookmarksError) {
      console.error('Error fetching bookmarks:', bookmarksError);
      return [];
    }

    if (!bookmarks || bookmarks.length === 0) {
      console.log('[getBookmarkedSquareWorks] No bookmarks found');
      return [];
    }

    // 获取作品详情 - 从 works 表查询
    const workIds = bookmarks.map(b => b.post_id);
    console.log('[getBookmarkedSquareWorks] Work IDs:', workIds);

    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('*')
      .in('id', workIds);

    console.log('[getBookmarkedSquareWorks] Works result:', { worksCount: works?.length, error: worksError });

    if (worksError) {
      console.error('Error fetching works:', worksError);
      return [];
    }

    // 创建作品映射
    const worksMap = new Map();
    works?.forEach(work => {
      worksMap.set(work.id, work);
    });

    console.log('[getBookmarkedSquareWorks] Works map:', Array.from(worksMap.keys()));

    // 转换为 CollectionItem - 只返回存在的作品
    const result = bookmarks
      .filter((bookmark: any) => worksMap.has(bookmark.post_id)) // 只保留存在的作品
      .map((bookmark: any) => {
        const work = worksMap.get(bookmark.post_id);
        console.log('[getBookmarkedSquareWorks] Mapping bookmark:', bookmark.post_id, '-> work:', work?.title);
        return {
          id: bookmark.post_id?.toString() || '',
          title: work?.title || '未命名作品',
          thumbnail: work?.thumbnail || work?.cover_url || '/placeholder-image.jpg',
          type: CollectionType.SQUARE_WORK,
          category: work?.category || '其他',
          createdAt: bookmark.created_at && !isNaN(Date.parse(bookmark.created_at))
            ? new Date(bookmark.created_at).toISOString()
            : new Date().toISOString(),
          stats: {
            views: work?.views || work?.view_count || 0,
            likes: work?.likes || work?.likes_count || 0,
            comments: work?.comments || work?.comments_count || 0,
          },
          isBookmarked: true,
          isLiked: false,
          link: `/square/${bookmark.post_id}`,
          author: work?.creator_id ? {
            id: work.creator_id,
            name: work?.creator_name || work?.username || '未知作者',
            avatar: work?.creator_avatar || work?.avatar_url || '/default-avatar.jpg',
          } : undefined,
          description: work?.description || work?.content,
        };
      });

    console.log('[getBookmarkedSquareWorks] Final result count:', result.length);
    return result;
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
    // 获取当前用户ID
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      // 如果没有Supabase会话，尝试从localStorage获取
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          // 使用后端API获取点赞
          const response = await apiClient.get('/api/user/likes');
          if (response.ok && response.data) {
            return response.data.map((work: any) => ({
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
          }
        } catch (e) {
          console.error('Failed to parse user from localStorage:', e);
        }
      }
      return [];
    }

    // 从 Supabase likes 表获取点赞
    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select('post_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (likesError) {
      console.error('Error fetching likes:', likesError);
      return [];
    }

    if (!likes || likes.length === 0) {
      return [];
    }

    // 获取作品详情 - 从 works 表查询
    const workIds = likes.map(l => l.post_id);
    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('*')
      .in('id', workIds);

    if (worksError) {
      console.error('Error fetching works:', worksError);
      return [];
    }

    // 创建作品映射
    const worksMap = new Map();
    works?.forEach(work => {
      worksMap.set(work.id, work);
    });

    // 转换为 CollectionItem - 只返回存在的作品
    return likes
      .filter((like: any) => worksMap.has(like.post_id)) // 只保留存在的作品
      .map((like: any) => {
        const work = worksMap.get(like.post_id);
        return {
          id: like.post_id?.toString() || '',
          title: work?.title || '未命名作品',
          thumbnail: work?.thumbnail || work?.cover_url || '/placeholder-image.jpg',
          type: CollectionType.SQUARE_WORK,
          category: work?.category || '其他',
          createdAt: like.created_at && !isNaN(Date.parse(like.created_at))
            ? new Date(like.created_at).toISOString()
            : new Date().toISOString(),
          stats: {
            views: work?.views || work?.view_count || 0,
            likes: work?.likes || work?.likes_count || 0,
            comments: work?.comments || work?.comments_count || 0,
          },
          isBookmarked: false,
          isLiked: true,
          link: `/square/${like.post_id}`,
          author: work?.creator_id ? {
            id: work.creator_id,
            name: work?.creator_name || work?.username || '未知作者',
            avatar: work?.creator_avatar || work?.avatar_url || '/default-avatar.jpg',
          } : undefined,
          description: work?.description || work?.content,
        };
      });
  } catch (error) {
    handleError(error, '获取点赞作品失败');
    return [];
  }
}

// ============================================
// 津脉模板相关
// ============================================

/**
 * 获取用户收藏的模板
 */
async function getBookmarkedTemplates(
  sort: SortOption = SortOption.NEWEST
): Promise<CollectionItem[]> {
  try {
    // 获取当前用户ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return [];
    }

    // 从 Supabase template_favorites 表获取收藏的模板ID
    const { data: favorites, error: favoritesError } = await supabase
      .from('template_favorites')
      .select('template_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (favoritesError) {
      console.error('Error fetching template favorites:', favoritesError);
      return [];
    }

    if (!favorites || favorites.length === 0) {
      return [];
    }

    // 获取模板详情
    const templateIds = favorites.map(f => f.template_id);
    const { data: templates, error: templatesError } = await supabase
      .from('tianjin_templates')
      .select('*')
      .in('id', templateIds);

    if (templatesError) {
      console.error('Error fetching templates:', templatesError);
      return [];
    }

    // 创建模板映射
    const templatesMap = new Map();
    templates?.forEach(template => {
      templatesMap.set(template.id, template);
    });

    // 转换为 CollectionItem
    return favorites.map((favorite: any) => {
      const template = templatesMap.get(favorite.template_id);
      return {
        id: favorite.template_id?.toString() || '',
        title: template?.name || '未命名模板',
        thumbnail: template?.thumbnail || '/placeholder-image.jpg',
        type: CollectionType.TEMPLATE,
        category: template?.category || '其他',
        createdAt: favorite.created_at && !isNaN(Date.parse(favorite.created_at))
          ? new Date(favorite.created_at).toISOString()
          : new Date().toISOString(),
        stats: {
          views: template?.usage_count || 0,
          likes: template?.likes || 0,
          comments: 0,
        },
        isBookmarked: true,
        isLiked: false,
        link: `/tianjin?template=${favorite.template_id}`,
        description: template?.description,
        tags: template?.tags || [],
      };
    });
  } catch (error) {
    console.error('获取收藏模板失败:', error);
    return [];
  }
}

/**
 * 获取当前用户ID（兼容多种登录方式）
 */
async function getCurrentUserId(): Promise<string | null> {
  // 首先尝试从 Supabase Auth 获取
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch {
    // 继续尝试其他方式
  }

  // 尝试从 localStorage 获取用户信息
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user?.id) return user.id;
    } catch {
      // 解析失败
    }
  }

  return null;
}

/**
 * 获取用户点赞的模板
 */
async function getLikedTemplates(
  sort: SortOption = SortOption.NEWEST
): Promise<CollectionItem[]> {
  try {
    // 获取当前用户ID
    const userId = await getCurrentUserId();

    console.log('[getLikedTemplates] Current userId:', userId);

    if (!userId) {
      console.log('[getLikedTemplates] No userId, returning empty');
      return [];
    }

    // 从 Supabase template_likes 表获取点赞的模板ID
    const { data: likes, error: likesError } = await supabase
      .from('template_likes')
      .select('template_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    console.log('[getLikedTemplates] likes query result:', { likes, likesError });

    if (likesError) {
      console.error('Error fetching template likes:', likesError);
      return [];
    }

    if (!likes || likes.length === 0) {
      console.log('[getLikedTemplates] No likes found for user');
      return [];
    }

    // 获取模板详情
    const templateIds = likes.map(l => l.template_id);
    const { data: templates, error: templatesError } = await supabase
      .from('tianjin_templates')
      .select('*')
      .in('id', templateIds);

    if (templatesError) {
      console.error('Error fetching templates:', templatesError);
      return [];
    }

    // 创建模板映射
    const templatesMap = new Map();
    templates?.forEach(template => {
      templatesMap.set(template.id, template);
    });

    // 转换为 CollectionItem
    return likes.map((like: any) => {
      const template = templatesMap.get(like.template_id);
      return {
        id: like.template_id?.toString() || '',
        title: template?.name || '未命名模板',
        thumbnail: template?.thumbnail || '/placeholder-image.jpg',
        type: CollectionType.TEMPLATE,
        category: template?.category || '其他',
        createdAt: like.created_at && !isNaN(Date.parse(like.created_at))
          ? new Date(like.created_at).toISOString()
          : new Date().toISOString(),
        stats: {
          views: template?.usage_count || 0,
          likes: template?.likes || 0,
          comments: 0,
        },
        isBookmarked: false,
        isLiked: true,
        link: `/tianjin?template=${like.template_id}`,
        description: template?.description,
        tags: template?.tags || [],
      };
    });
  } catch (error) {
    console.error('获取点赞模板失败:', error);
    return [];
  }
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
    // 获取当前用户ID
    const userId = await getCurrentUserId();

    let squareWorkBookmarks = 0;
    let squareWorkLikes = 0;
    let templateBookmarks = 0;
    let templateLikes = 0;

    if (userId) {
      // 从 Supabase 获取广场作品收藏数量
      const { count: bookmarksCountResult, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (!bookmarksError && bookmarksCountResult !== null) {
        squareWorkBookmarks = bookmarksCountResult;
      }

      // 从 Supabase 获取广场作品点赞数量
      const { count: likesCountResult, error: likesError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (!likesError && likesCountResult !== null) {
        squareWorkLikes = likesCountResult;
      }

      // 从 Supabase 获取模板收藏数量
      const { count: templateFavoritesResult, error: templateFavoritesError } = await supabase
        .from('template_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (!templateFavoritesError && templateFavoritesResult !== null) {
        templateBookmarks = templateFavoritesResult;
      }

      // 从 Supabase 获取模板点赞数量
      const { count: templateLikesResult, error: templateLikesError } = await supabase
        .from('template_likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (!templateLikesError && templateLikesResult !== null) {
        templateLikes = templateLikesResult;
      }
    } else {
      // 如果没有Supabase会话，使用后端API
      const bookmarksRes = await apiClient.get('/api/user/bookmarks/count');
      squareWorkBookmarks = bookmarksRes.ok ? (bookmarksRes.data?.count || 0) : 0;

      const likesRes = await apiClient.get('/api/user/likes/count');
      squareWorkLikes = likesRes.ok ? (likesRes.data?.count || 0) : 0;
    }

    const totalBookmarks = squareWorkBookmarks + templateBookmarks;
    const totalLikes = squareWorkLikes + templateLikes;

    return {
      total: totalBookmarks,
      squareWork: squareWorkBookmarks,
      communityPost: 0,
      activity: 0,
      template: templateBookmarks,
      totalLikes: totalLikes,
      templateLikes: templateLikes,
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
      templateLikes: 0,
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
