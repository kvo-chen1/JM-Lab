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
  username?: string;
  avatar: string;
}

/**
 * 媒体类型
 */
export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'other';

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
  mediaType?: MediaType;
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
    // 获取当前用户ID
    const userId = await getCurrentUserId();

    if (!userId) {
      console.log('[getBookmarkedSquareWorks] No userId found');
      return [];
    }

    console.log('[getBookmarkedSquareWorks] Fetching bookmarks for user:', userId);

    // 首先尝试从后端 API 获取收藏
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      try {
        console.log('[getBookmarkedSquareWorks] Trying backend API...');
        const response = await fetch('/api/user/bookmarks', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          console.log('[getBookmarkedSquareWorks] Backend API success:', result);
          console.log('[getBookmarkedSquareWorks] First item:', result.data?.[0]);
          console.log('[getBookmarkedSquareWorks] First item author:', result.data?.[0]?.author);
          if (result.data && result.data.length > 0) {
            // 收集所有需要查询作者的作品
            const worksWithoutAuthor = result.data.filter((work: any) => !work.author && (work.creator_id || work.user_id));
            
            // 获取作者信息
            let authorsMap = new Map();
            if (worksWithoutAuthor.length > 0) {
              const creatorIds = worksWithoutAuthor.map((w: any) => w.creator_id || w.user_id).filter(Boolean);
              console.log('[getBookmarkedSquareWorks] Fetching authors for IDs:', creatorIds);
              
              const { data: users, error: usersError } = await supabase
                .from('users')
                .select('id, username, avatar_url')
                .in('id', creatorIds);
              
              if (!usersError && users) {
                console.log('[getBookmarkedSquareWorks] Fetched authors:', users);
                users.forEach(user => {
                  authorsMap.set(user.id, user);
                });
              }
            }
            
            // 后端返回的作品数据，转换为 CollectionItem
            return result.data.map((work: any) => {
              // 优先使用 work.author，如果没有则尝试从 authorsMap 获取
              let author = work.author;
              if (!author && (work.creator_id || work.user_id)) {
                const user = authorsMap.get(work.creator_id || work.user_id);
                if (user) {
                  author = {
                    id: user.id,
                    name: user.username || '未知用户',
                    username: user.username,
                    avatar: user.avatar_url || '/default-avatar.png'
                  };
                }
              }
              
              return {
                id: work.id?.toString() || '',
                title: work.title || '未命名作品',
                thumbnail: work.thumbnail || work.cover_url || '/placeholder-image.jpg',
                type: CollectionType.SQUARE_WORK,
                category: work.category || '其他',
                createdAt: work.created_at || new Date().toISOString(),
                stats: {
                  views: work.views || work.view_count || 0,
                  likes: work.likes || work.likes_count || 0,
                  comments: work.comments || work.comments_count || 0
                },
                author: author ? {
                  id: author.id?.toString() || '',
                  name: author.username || author.name || '未知用户',
                  username: author.username,
                  avatar: author.avatar || author.avatar_url || '/default-avatar.png'
                } : undefined,
                isBookmarked: true,
                isLiked: false,
                link: `/square/${work.id}`,
                mediaType: work.media_type || 'image',
              };
            });
          }
          console.log('[getBookmarkedSquareWorks] Backend API returned empty data');
          return [];
        } else {
          console.warn('[getBookmarkedSquareWorks] Backend API failed:', response.status);
        }
      } catch (error) {
        console.warn('[getBookmarkedSquareWorks] Backend API error:', error);
      }
    }

    // 如果后端 API 不可用，尝试从 Supabase 获取
    console.log('[getBookmarkedSquareWorks] Trying Supabase...');
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('works_bookmarks')
      .select('work_id, created_at')
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
    const workIds = bookmarks.map(b => b.work_id);
    console.log('[getBookmarkedSquareWorks] Work IDs:', workIds);

    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('*')
      .in('id', workIds);

    console.log('[getBookmarkedSquareWorks] Works result:', { worksCount: works?.length, error: worksError, firstWork: works?.[0] });

    if (worksError) {
      console.error('Error fetching works:', worksError);
      return [];
    }

    // 获取所有作者ID
    const creatorIds = works?.map(w => w.creator_id).filter(Boolean) || [];
    console.log('[getBookmarkedSquareWorks] Creator IDs:', creatorIds);

    // 获取作者信息（头像等）
    let usersMap = new Map();
    if (creatorIds.length > 0) {
      console.log('[getBookmarkedSquareWorks] Fetching users for IDs:', creatorIds);
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', creatorIds);
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
      } else {
        console.log('[getBookmarkedSquareWorks] Users fetched:', users);
        users?.forEach(user => {
          usersMap.set(user.id, user);
        });
        console.log('[getBookmarkedSquareWorks] Users map:', Array.from(usersMap.entries()));
      }
    }

    // 创建作品映射
    const worksMap = new Map();
    works?.forEach(work => {
      worksMap.set(work.id, work);
    });

    console.log('[getBookmarkedSquareWorks] Works map:', Array.from(worksMap.keys()));

    // 转换为 CollectionItem - 只返回存在的作品
    const result = bookmarks
      .filter((bookmark: any) => worksMap.has(bookmark.work_id)) // 只保留存在的作品
      .map((bookmark: any) => {
        const work = worksMap.get(bookmark.work_id);
        const user = usersMap.get(work?.creator_id);
        console.log('[getBookmarkedSquareWorks] Mapping bookmark:', bookmark.work_id, '-> work:', work?.title, 'creator_id:', work?.creator_id, '-> user:', user);
        return {
          id: bookmark.work_id?.toString() || '',
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
          link: `/square/${bookmark.work_id}`,
          author: work?.creator_id ? {
            id: work.creator_id,
            name: work?.creator || user?.username || '未知作者',
            avatar: user?.avatar_url || '/default-avatar.jpg',
          } : undefined,
          description: work?.description || work?.content,
          mediaType: work?.media_type || 'image',
        };
      });

    console.log('[getBookmarkedSquareWorks] Final result count:', result.length, 'first item author:', result[0]?.author);
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
    const userId = await getCurrentUserId();

    if (!userId) {
      return [];
    }

    console.log('[getLikedSquareWorks] Fetching likes for user:', userId);

    // 首先尝试从后端 API 获取点赞列表
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      try {
        console.log('[getLikedSquareWorks] Trying backend API...');
        const response = await fetch('/api/user/likes', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          console.log('[getLikedSquareWorks] Backend API success:', result);
          console.log('[getLikedSquareWorks] First item:', result.data?.[0]);
          console.log('[getLikedSquareWorks] First item author:', result.data?.[0]?.author);
          if (result.data && Array.isArray(result.data)) {
            // 收集所有需要查询作者的作品
            const worksWithoutAuthor = result.data.filter((work: any) => !work.author && (work.creator_id || work.user_id));
            
            // 获取作者信息
            let authorsMap = new Map();
            if (worksWithoutAuthor.length > 0) {
              const creatorIds = worksWithoutAuthor.map((w: any) => w.creator_id || w.user_id).filter(Boolean);
              console.log('[getLikedSquareWorks] Fetching authors for IDs:', creatorIds);
              
              const { data: users, error: usersError } = await supabase
                .from('users')
                .select('id, username, avatar_url')
                .in('id', creatorIds);
              
              if (!usersError && users) {
                console.log('[getLikedSquareWorks] Fetched authors:', users);
                users.forEach(user => {
                  authorsMap.set(user.id, user);
                });
              }
            }
            
            // 后端返回的作品数据，转换为 CollectionItem
            return result.data.map((work: any) => {
              // 优先使用 work.author，如果没有则尝试从 authorsMap 获取
              let author = work.author;
              if (!author && (work.creator_id || work.user_id)) {
                const user = authorsMap.get(work.creator_id || work.user_id);
                if (user) {
                  author = {
                    id: user.id,
                    name: user.username || '未知用户',
                    username: user.username,
                    avatar: user.avatar_url || '/default-avatar.png'
                  };
                }
              }
              
              return {
                id: work.id?.toString() || '',
                title: work.title || '未命名作品',
                thumbnail: work.thumbnail || work.cover_url || '/placeholder-image.jpg',
                type: CollectionType.SQUARE_WORK,
                category: work.category || '其他',
                createdAt: work.created_at || new Date().toISOString(),
                stats: {
                  views: work.views || work.view_count || 0,
                  likes: work.likes || work.likes_count || 0,
                  comments: work.comments || work.comments_count || 0
                },
                author: author ? {
                  id: author.id?.toString() || '',
                  name: author.username || author.name || '未知用户',
                  username: author.username,
                  avatar: author.avatar || author.avatar_url || '/default-avatar.png'
                } : undefined,
                isLiked: true,
                isBookmarked: false,
                link: `/square/${work.id}`,
                mediaType: work.media_type || 'image',
              };
            });
          }
          console.log('[getLikedSquareWorks] Backend API returned empty data');
          return [];
        } else {
          console.warn('[getLikedSquareWorks] Backend API failed:', response.status);
        }
      } catch (error) {
        console.warn('[getLikedSquareWorks] Backend API error:', error);
      }
    }

    // 如果后端 API 不可用，尝试从 Supabase 获取
    console.log('[getLikedSquareWorks] Trying Supabase...');
    const { data: likes, error: likesError } = await supabase
      .from('works_likes')
      .select('work_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (likesError) {
      console.error('Error fetching likes:', likesError);
      return [];
    }

    if (!likes || likes.length === 0) {
      console.log('[getLikedSquareWorks] No likes found');
      return [];
    }

    // 获取作品详情 - 从 works 表查询
    const workIds = likes.map(l => l.work_id);
    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('*')
      .in('id', workIds);

    if (worksError) {
      console.error('Error fetching works:', worksError);
      return [];
    }

    // 获取所有作者ID
    const creatorIds = works?.map(w => w.creator_id).filter(Boolean) || [];

    // 获取作者信息（头像等）
    let usersMap = new Map();
    if (creatorIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', creatorIds);
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
      } else {
        users?.forEach(user => {
          usersMap.set(user.id, user);
        });
      }
    }

    // 创建作品映射
    const worksMap = new Map();
    works?.forEach(work => {
      worksMap.set(work.id, work);
    });

    // 转换为 CollectionItem - 只返回存在的作品
    return likes
      .filter((like: any) => worksMap.has(like.work_id)) // 只保留存在的作品
      .map((like: any) => {
        const work = worksMap.get(like.work_id);
        const user = usersMap.get(work?.creator_id);
        return {
          id: like.work_id?.toString() || '',
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
          link: `/square/${like.work_id}`,
          author: work?.creator_id ? {
            id: work.creator_id,
            name: work?.creator || user?.username || '未知作者',
            avatar: user?.avatar_url || '/default-avatar.jpg',
          } : undefined,
          description: work?.description || work?.content,
          mediaType: work?.media_type || 'image',
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
  // 首先尝试从 localStorage 获取用户信息（后端登录方式）
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user?.id) {
        console.log('[getCurrentUserId] Got userId from localStorage:', user.id);
        return user.id;
      }
    } catch {
      // 解析失败，继续尝试其他方式
    }
  }

  // 尝试从 Supabase Auth 获取
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      console.log('[getCurrentUserId] Got userId from Supabase Auth:', user.id);
      return user.id;
    }
  } catch {
    // 继续尝试其他方式
  }

  console.log('[getCurrentUserId] No userId found');
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

    if (!userId) {
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

    console.log('[getUserCollectionStats] Fetching stats for user:', userId);

    // 首先尝试从后端 API 获取统计数据
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      try {
        console.log('[getUserCollectionStats] Trying backend API...');
        const response = await fetch('/api/user/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          console.log('[getUserCollectionStats] Backend API success:', result);
          if (result.data) {
            // 后端返回的统计数据
            return {
              total: result.data.bookmarks_count || 0,
              squareWork: result.data.bookmarks_count || 0,
              communityPost: 0,
              activity: 0,
              template: 0,
              totalLikes: result.data.likes_count || 0,
              templateLikes: 0,
            };
          }
        } else {
          console.warn('[getUserCollectionStats] Backend API failed:', response.status);
        }
      } catch (error) {
        console.warn('[getUserCollectionStats] Backend API error:', error);
      }
    }

    // 如果后端 API 不可用，从 Supabase 获取
    console.log('[getUserCollectionStats] Trying Supabase...');

    // 获取广场作品收藏 - 只统计实际存在的作品
    let squareWorkBookmarks = 0;
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('works_bookmarks')
      .select('work_id')
      .eq('user_id', userId);

    if (!bookmarksError && bookmarks && bookmarks.length > 0) {
      const workIds = bookmarks.map(b => b.work_id);
      const { data: existingWorks } = await supabase
        .from('works')
        .select('id')
        .in('id', workIds);
      const existingWorkIds = new Set(existingWorks?.map(w => w.id) || []);
      squareWorkBookmarks = bookmarks.filter(b => existingWorkIds.has(b.work_id)).length;
    }

    // 获取广场作品点赞 - 只统计实际存在的作品
    let squareWorkLikes = 0;
    const { data: likes, error: likesError } = await supabase
      .from('works_likes')
      .select('work_id')
      .eq('user_id', userId);

    if (!likesError && likes && likes.length > 0) {
      const workIds = likes.map(l => l.work_id);
      const { data: existingWorks } = await supabase
        .from('works')
        .select('id')
        .in('id', workIds);
      const existingWorkIds = new Set(existingWorks?.map(w => w.id) || []);
      squareWorkLikes = likes.filter(l => existingWorkIds.has(l.work_id)).length;
    }

    // 获取模板收藏 - 只统计实际存在的模板
    let templateBookmarks = 0;
    const { data: templateFavorites, error: templateFavoritesError } = await supabase
      .from('template_favorites')
      .select('template_id')
      .eq('user_id', userId);

    if (!templateFavoritesError && templateFavorites && templateFavorites.length > 0) {
      const templateIds = templateFavorites.map(f => f.template_id);
      const { data: existingTemplates } = await supabase
        .from('tianjin_templates')
        .select('id')
        .in('id', templateIds);
      const existingTemplateIds = new Set(existingTemplates?.map(t => t.id) || []);
      templateBookmarks = templateFavorites.filter(f => existingTemplateIds.has(f.template_id)).length;
    }

    // 获取模板点赞 - 只统计实际存在的模板
    let templateLikes = 0;
    const { data: templateLikesData, error: templateLikesError } = await supabase
      .from('template_likes')
      .select('template_id')
      .eq('user_id', userId);

    if (!templateLikesError && templateLikesData && templateLikesData.length > 0) {
      const templateIds = templateLikesData.map(l => l.template_id);
      const { data: existingTemplates } = await supabase
        .from('tianjin_templates')
        .select('id')
        .in('id', templateIds);
      const existingTemplateIds = new Set(existingTemplates?.map(t => t.id) || []);
      templateLikes = templateLikesData.filter(l => existingTemplateIds.has(l.template_id)).length;
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

    // 获取当前用户ID
    const userId = await getCurrentUserId();
    if (!userId) {
      toast.error('请先登录');
      return false;
    }

    // 首先尝试使用后端 API
    try {
      const response = await apiClient.post(`/api/works/${id}/bookmark`, {});
      if (response.ok && response.data) {
        const result = response.data;
        if (result.isBookmarked) {
          toast.success('已添加到收藏');
        } else {
          toast.success('已取消收藏');
        }
        return result.isBookmarked;
      }
    } catch (apiError) {
      console.warn('[toggleBookmark] API failed, falling back to Supabase:', apiError);
    }

    // 后端 API 失败，使用 Supabase 直接操作
    console.log('[toggleBookmark] Using Supabase fallback');
    
    // 检查是否已收藏
    const { data: existingBookmark } = await supabase
      .from('works_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .eq('work_id', id)
      .single();

    if (existingBookmark) {
      // 取消收藏
      const { error: deleteError } = await supabase
        .from('works_bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('work_id', id);

      if (deleteError) {
        console.error('[toggleBookmark] Delete error:', deleteError);
        throw deleteError;
      }
      toast.success('已取消收藏');
      return false;
    } else {
      // 添加收藏
      const { error: insertError } = await supabase
        .from('works_bookmarks')
        .insert({
          user_id: userId,
          work_id: id,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('[toggleBookmark] Insert error:', insertError);
        throw insertError;
      }
      toast.success('已添加到收藏');
      return true;
    }
  } catch (error) {
    console.error('[toggleBookmark] Error:', error);
    handleError(error, '操作失败，请重试');
    return false;
  }
}

/**
 * 取消收藏（专门用于收藏页面）
 */
export async function removeBookmark(
  id: string,
  type: CollectionType
): Promise<boolean> {
  try {
    // 目前只支持作品收藏
    if (type !== CollectionType.SQUARE_WORK) {
      toast.error('该类型暂不支持收藏');
      return false;
    }

    // 获取当前用户ID
    const userId = await getCurrentUserId();
    if (!userId) {
      toast.error('请先登录');
      return false;
    }

    // 首先尝试使用后端 API 删除收藏
    try {
      const response = await apiClient.delete(`/api/works/${id}/bookmark`);
      if (response.ok) {
        toast.success('已取消收藏');
        return false; // 返回 false 表示未收藏状态
      }
    } catch (apiError) {
      console.warn('[removeBookmark] API failed, falling back to Supabase:', apiError);
    }

    // 后端 API 失败，使用 Supabase 直接操作
    console.log('[removeBookmark] Using Supabase fallback');

    // 直接删除收藏记录
    const { error: deleteError } = await supabase
      .from('works_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('work_id', id);

    if (deleteError) {
      console.error('[removeBookmark] Delete error:', deleteError);
      throw deleteError;
    }
    toast.success('已取消收藏');
    return false;
  } catch (error) {
    console.error('[removeBookmark] Error:', error);
    handleError(error, '取消收藏失败，请重试');
    return true; // 返回 true 表示操作失败，保持原状态
  }
}

/**
 * 取消点赞（专门用于点赞页面）
 */
export async function removeLike(
  id: string,
  type: CollectionType
): Promise<boolean> {
  try {
    // 目前只支持作品点赞
    if (type !== CollectionType.SQUARE_WORK) {
      toast.error('该类型暂不支持点赞');
      return false;
    }

    // 获取当前用户ID
    const userId = await getCurrentUserId();
    if (!userId) {
      toast.error('请先登录');
      return false;
    }

    // 首先尝试使用后端 API 删除点赞
    try {
      const response = await apiClient.delete(`/api/works/${id}/like`);
      if (response.ok) {
        toast.success('已取消点赞');
        return false; // 返回 false 表示未点赞状态
      }
    } catch (apiError) {
      console.warn('[removeLike] API failed, falling back to Supabase:', apiError);
    }

    // 后端 API 失败，使用 Supabase 直接操作
    console.log('[removeLike] Using Supabase fallback');

    // 直接删除点赞记录
    const { error: deleteError } = await supabase
      .from('works_likes')
      .delete()
      .eq('user_id', userId)
      .eq('work_id', id);

    if (deleteError) {
      console.error('[removeLike] Delete error:', deleteError);
      throw deleteError;
    }
    toast.success('已取消点赞');
    return false;
  } catch (error) {
    console.error('[removeLike] Error:', error);
    handleError(error, '取消点赞失败，请重试');
    return true; // 返回 true 表示操作失败，保持原状态
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

    // 获取当前用户ID
    const userId = await getCurrentUserId();
    if (!userId) {
      toast.error('请先登录');
      return false;
    }

    // 首先尝试使用后端 API
    try {
      const response = await apiClient.post(`/api/works/${id}/like`, {});
      if (response.ok && response.data) {
        const result = response.data;
        if (result.isLiked) {
          toast.success('已点赞');
        } else {
          toast.success('已取消点赞');
        }
        return result.isLiked;
      }
    } catch (apiError) {
      console.warn('[toggleLike] API failed, falling back to Supabase:', apiError);
    }

    // 后端 API 失败，使用 Supabase 直接操作
    console.log('[toggleLike] Using Supabase fallback');
    
    // 检查是否已点赞
    const { data: existingLike } = await supabase
      .from('works_likes')
      .select('*')
      .eq('user_id', userId)
      .eq('work_id', id)
      .single();

    if (existingLike) {
      // 取消点赞
      const { error: deleteError } = await supabase
        .from('works_likes')
        .delete()
        .eq('user_id', userId)
        .eq('work_id', id);

      if (deleteError) {
        console.error('[toggleLike] Delete error:', deleteError);
        throw deleteError;
      }
      toast.success('已取消点赞');
      return false;
    } else {
      // 添加点赞
      const { error: insertError } = await supabase
        .from('works_likes')
        .insert({
          user_id: userId,
          work_id: id,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('[toggleLike] Insert error:', insertError);
        throw insertError;
      }
      toast.success('已点赞');
      return true;
    }
  } catch (error) {
    console.error('[toggleLike] Error:', error);
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
  getBookmarkedSquareWorks,
  getLikedSquareWorks,
  toggleBookmark,
  toggleLike,
  removeBookmark,
  removeLike,
  CollectionType,
  SortOption,
};

export default collectionService;
