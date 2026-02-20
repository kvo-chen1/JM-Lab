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
          if (result.data && Array.isArray(result.data)) {
            if (result.data.length > 0) {
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
                    // 将 user.id 转换为字符串，以匹配 work.creator_id
                    authorsMap.set(String(user.id), user);
                  });
                }
              }

              // 后端返回的作品数据，转换为 CollectionItem
              return result.data.map((work: any) => {
                // 优先使用 work.author，如果没有则尝试从 authorsMap 获取
                let author = work.author;
                if (!author && (work.creator_id || work.user_id)) {
                  // 将 creator_id 转换为字符串，以匹配 authorsMap 的 key
                  const user = authorsMap.get(String(work.creator_id || work.user_id));
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
                  link: `/works/${work.id}`,
                  mediaType: work.media_type || 'image',
                };
              });
            } else {
              console.log('[getBookmarkedSquareWorks] Backend API returned empty data, trying Supabase...');
              // 继续执行 Supabase 备用方案
            }
          } else {
            console.log('[getBookmarkedSquareWorks] Backend API returned invalid data, trying Supabase...');
            // 继续执行 Supabase 备用方案
          }
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
          // 将 user.id 转换为字符串，以匹配 work.creator_id
          usersMap.set(String(user.id), user);
        });
        console.log('[getBookmarkedSquareWorks] Users map:', Array.from(usersMap.entries()));
      }
    }

    // 创建作品映射 - 使用字符串类型的 key 以匹配 bookmark.work_id
    const worksMap = new Map();
    works?.forEach(work => {
      // 将 work.id 转换为字符串，以匹配 bookmark.work_id
      worksMap.set(String(work.id), work);
    });

    console.log('[getBookmarkedSquareWorks] Works map:', Array.from(worksMap.keys()));

    // 转换为 CollectionItem - 只返回存在的作品
    const result = bookmarks
      .filter((bookmark: any) => worksMap.has(String(bookmark.work_id))) // 只保留存在的作品
      .map((bookmark: any) => {
        const work = worksMap.get(String(bookmark.work_id));
        // 将 creator_id 转换为字符串，以匹配 usersMap 的 key
        const user = usersMap.get(String(work?.creator_id));
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
          link: `/works/${bookmark.work_id}`,
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
            if (result.data.length > 0) {
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
                    // 将 user.id 转换为字符串，以匹配 work.creator_id
                    authorsMap.set(String(user.id), user);
                  });
                }
              }
              
              // 后端返回的作品数据，转换为 CollectionItem
              return result.data.map((work: any) => {
                // 优先使用 work.author，如果没有则尝试从 authorsMap 获取
                let author = work.author;
                if (!author && (work.creator_id || work.user_id)) {
                  // 将 creator_id 转换为字符串，以匹配 authorsMap 的 key
                  const user = authorsMap.get(String(work.creator_id || work.user_id));
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
                  link: `/works/${work.id}`,
                  mediaType: work.media_type || 'image',
                };
              });
            } else {
              console.log('[getLikedSquareWorks] Backend API returned empty data, trying Supabase...');
              // 继续执行 Supabase 备用方案
            }
          } else {
            console.log('[getLikedSquareWorks] Backend API returned invalid data, trying Supabase...');
            // 继续执行 Supabase 备用方案
          }
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
          // 将 user.id 转换为字符串，以匹配 work.creator_id
          usersMap.set(String(user.id), user);
        });
      }
    }

    // 创建作品映射 - 使用字符串类型的 key 以匹配 like.work_id
    const worksMap = new Map();
    works?.forEach(work => {
      // 将 work.id 转换为字符串，以匹配 like.work_id
      worksMap.set(String(work.id), work);
    });

    // 转换为 CollectionItem - 只返回存在的作品
    return likes
      .filter((like: any) => worksMap.has(String(like.work_id))) // 只保留存在的作品
      .map((like: any) => {
        const work = worksMap.get(String(like.work_id));
        // 将 creator_id 转换为字符串，以匹配 usersMap 的 key
        const user = usersMap.get(String(work?.creator_id));
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
          link: `/works/${like.work_id}`,
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
    console.log('[getBookmarkedTemplates] Template IDs:', templateIds);
    
    const { data: templates, error: templatesError } = await supabase
      .from('tianjin_templates')
      .select('*')
      .in('id', templateIds);
    
    console.log('[getBookmarkedTemplates] Templates query result:', { templatesCount: templates?.length, templatesError });
    console.log('[getBookmarkedTemplates] Templates data:', JSON.stringify(templates, null, 2));
    console.log('[getBookmarkedTemplates] Templates type:', typeof templates, Array.isArray(templates));

    if (templatesError) {
      console.error('Error fetching templates:', templatesError);
      return [];
    }

    // 创建模板映射
    const templatesMap = new Map();
    templates?.forEach(template => {
      templatesMap.set(template.id, template);
    });
    
    console.log('[getBookmarkedTemplates] Templates map size:', templatesMap.size);
    console.log('[getBookmarkedTemplates] Templates map keys:', Array.from(templatesMap.keys()));
    console.log('[getBookmarkedTemplates] First template:', templates?.[0]);
    console.log('[getBookmarkedTemplates] First template name:', templates?.[0]?.name);

    // 转换为 CollectionItem
    return favorites.map((favorite: any) => {
      // 将 template_id 转换为整数，以匹配 templatesMap 的键类型
      const templateIdInt = parseInt(favorite.template_id, 10);
      const template = templatesMap.get(templateIdInt);
      console.log('[getBookmarkedTemplates] Looking up template:', { templateId: favorite.template_id, templateIdInt, found: !!template, templateName: template?.name });
      return {
        id: favorite.template_id?.toString() || '',
        title: template?.title || template?.name || '未命名模板',
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
 * 返回整数类型以匹配数据库字段类型
 */
async function getCurrentUserId(): Promise<number | string | null> {
  // 首先尝试从 localStorage 获取用户信息（后端登录方式）
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user?.id) {
        console.log('[getCurrentUserId] Got userId from localStorage:', user.id);
        // 尝试转换为整数，如果失败则返回原始值
        const userIdInt = parseInt(user.id, 10);
        return isNaN(userIdInt) ? user.id : userIdInt;
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
      // 尝试转换为整数，如果失败则返回原始值
      const userIdInt = parseInt(user.id, 10);
      return isNaN(userIdInt) ? user.id : userIdInt;
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
      // 将 template_id 转换为整数，以匹配 templatesMap 的键类型
      const templateIdInt = parseInt(like.template_id, 10);
      const template = templatesMap.get(templateIdInt);
      return {
        id: like.template_id?.toString() || '',
        title: template?.title || template?.name || '未命名模板',
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
// 社区帖子相关
// ============================================

/**
 * 获取用户收藏的社区帖子
 */
async function getBookmarkedCommunityPosts(
  sort: SortOption = SortOption.NEWEST
): Promise<CollectionItem[]> {
  try {
    // 获取当前用户ID
    const userId = await getCurrentUserId();

    if (!userId) {
      console.log('[getBookmarkedCommunityPosts] No userId found');
      return [];
    }

    console.log('[getBookmarkedCommunityPosts] Fetching bookmarks for user:', userId);

    // 从 bookmarks 表获取收藏的帖子ID
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('bookmarks')
      .select('post_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (bookmarksError) {
      console.error('Error fetching community post bookmarks:', bookmarksError);
      return [];
    }

    if (!bookmarks || bookmarks.length === 0) {
      console.log('[getBookmarkedCommunityPosts] No bookmarks found');
      return [];
    }

    // 获取帖子详情 - 从 posts 表查询
    const postIds = bookmarks.map(b => b.post_id);
    console.log('[getBookmarkedCommunityPosts] Post IDs:', postIds);

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .in('id', postIds);

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return [];
    }

    // 获取所有作者ID - 尝试多种可能的字段名
    const authorIds = posts?.map(p => {
      const id = p.author_id || p.creator_id || p.user_id || p.author || p.authorId || p.creatorId || p.userId;
      return id;
    }).filter(Boolean) || [];

    // 获取作者信息（头像等）
    let usersMap = new Map();
    if (authorIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', authorIds);

      if (usersError) {
        console.error('Error fetching users:', usersError);
      } else {
        users?.forEach(user => {
          usersMap.set(user.id, user);
        });
      }
    }

    // 创建帖子映射
    const postsMap = new Map();
    posts?.forEach(post => {
      postsMap.set(post.id, post);
    });

    // 获取所有帖子的点赞数
    const allPostIds = posts?.map(p => p.id) || [];
    let likesCountMap = new Map();
    if (allPostIds.length > 0) {
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('post_id')
        .in('post_id', allPostIds);
      
      if (!likesError && likesData) {
        // 统计每个帖子的点赞数
        likesData.forEach((like: any) => {
          const count = likesCountMap.get(like.post_id) || 0;
          likesCountMap.set(like.post_id, count + 1);
        });
      }
    }

    // 获取当前用户点赞的帖子
    const { data: userLikes } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', allPostIds);
    const userLikedPostIds = new Set(userLikes?.map((l: any) => l.post_id) || []);

    // 转换为 CollectionItem - 只返回存在的帖子
    return bookmarks
      .filter((bookmark: any) => postsMap.has(bookmark.post_id))
      .map((bookmark: any) => {
        const post = postsMap.get(bookmark.post_id);
        
        // 获取作者ID - 尝试多种可能的字段名
        const authorId = post?.author_id || post?.creator_id || post?.user_id || post?.author || post?.authorId || post?.creatorId || post?.userId;
        const user = usersMap.get(authorId);
        
        // 获取帖子图片 - 按照优先级尝试不同字段
        let thumbnail = '';
        if (post?.attachments && Array.isArray(post.attachments) && post.attachments.length > 0) {
          // attachments 可能是对象数组或字符串数组
          const firstAttachment = post.attachments[0];
          thumbnail = typeof firstAttachment === 'string' ? firstAttachment : (firstAttachment?.url || '');
        } else if (post?.images && Array.isArray(post.images) && post.images.length > 0) {
          thumbnail = post.images[0];
        } else if (typeof post?.attachments === 'string') {
          thumbnail = post.attachments;
        } else if (post?.thumbnail) {
          thumbnail = post.thumbnail;
        } else if (post?.cover_url) {
          thumbnail = post.cover_url;
        } else if (post?.image_url) {
          thumbnail = post.image_url;
        }
        
        // 如果没有找到图片，使用空字符串而不是占位图，让前端决定是否显示
        const finalThumbnail = thumbnail || '';
        
        // 获取作者名称 - 尝试多种可能的字段
        const authorName = post?.author?.username || post?.author?.name || post?.creator || post?.creator_name || post?.user?.username || user?.username || '未知作者';
        
        // 获取作者头像 - 尝试多种可能的字段
        const authorAvatar = post?.author?.avatar || post?.author?.avatar_url || post?.creator_avatar || post?.user?.avatar_url || user?.avatar_url || '/default-avatar.jpg';
        
        // 获取实际的点赞数
        const actualLikes = likesCountMap.get(bookmark.post_id) || post?.likes || post?.likes_count || 0;
        
        return {
          id: bookmark.post_id?.toString() || '',
          title: post?.title || '未命名帖子',
          thumbnail: finalThumbnail,
          type: CollectionType.COMMUNITY_POST,
          category: post?.category || '社区',
          createdAt: bookmark.created_at && !isNaN(Date.parse(bookmark.created_at))
            ? new Date(bookmark.created_at).toISOString()
            : new Date().toISOString(),
          stats: {
            views: post?.views || post?.view_count || 0,
            likes: actualLikes,
            comments: post?.comments || post?.comments_count || 0,
          },
          isBookmarked: true,
          isLiked: userLikedPostIds.has(bookmark.post_id),
          link: `/post/${bookmark.post_id}`,
          author: authorId ? {
            id: authorId,
            name: authorName,
            avatar: authorAvatar,
          } : undefined,
          description: post?.content || post?.description,
          tags: post?.tags || [],
          mediaType: post?.media_type || 'image',
        };
      });
  } catch (error) {
    console.error('获取收藏社区帖子失败:', error);
    return [];
  }
}

/**
 * 获取用户点赞的社区帖子
 */
async function getLikedCommunityPosts(
  sort: SortOption = SortOption.NEWEST
): Promise<CollectionItem[]> {
  try {
    // 获取当前用户ID
    const userId = await getCurrentUserId();

    if (!userId) {
      console.log('[getLikedCommunityPosts] No userId found');
      return [];
    }

    console.log('[getLikedCommunityPosts] Fetching likes for user:', userId);

    // 从 likes 表获取点赞的帖子ID
    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select('post_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (likesError) {
      console.error('Error fetching community post likes:', likesError);
      return [];
    }

    if (!likes || likes.length === 0) {
      console.log('[getLikedCommunityPosts] No likes found');
      return [];
    }

    // 获取帖子详情 - 从 posts 表查询
    const postIds = likes.map(l => l.post_id);
    console.log('[getLikedCommunityPosts] Post IDs:', postIds);

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .in('id', postIds);

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return [];
    }

    // 获取所有作者ID - 尝试多种可能的字段名
    const authorIds = posts?.map(p => {
      const id = p.author_id || p.creator_id || p.user_id || p.author || p.authorId || p.creatorId || p.userId;
      return id;
    }).filter(Boolean) || [];

    // 获取作者信息（头像等）
    let usersMap = new Map();
    if (authorIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', authorIds);

      if (usersError) {
        console.error('Error fetching users:', usersError);
      } else {
        users?.forEach(user => {
          usersMap.set(user.id, user);
        });
      }
    }

    // 创建帖子映射
    const postsMap = new Map();
    posts?.forEach(post => {
      postsMap.set(post.id, post);
    });

    // 获取所有帖子的点赞数
    const allPostIds = posts?.map(p => p.id) || [];
    let likesCountMap = new Map();
    if (allPostIds.length > 0) {
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('post_id')
        .in('post_id', allPostIds);
      
      if (!likesError && likesData) {
        // 统计每个帖子的点赞数
        likesData.forEach((like: any) => {
          const count = likesCountMap.get(like.post_id) || 0;
          likesCountMap.set(like.post_id, count + 1);
        });
      }
    }

    // 转换为 CollectionItem - 只返回存在的帖子
    return likes
      .filter((like: any) => postsMap.has(like.post_id))
      .map((like: any) => {
        const post = postsMap.get(like.post_id);
        
        // 获取作者ID - 尝试多种可能的字段名
        const authorId = post?.author_id || post?.creator_id || post?.user_id || post?.author || post?.authorId || post?.creatorId || post?.userId;
        const user = usersMap.get(authorId);
        
        // 获取帖子图片 - 按照优先级尝试不同字段
        let thumbnail = '';
        if (post?.attachments && Array.isArray(post.attachments) && post.attachments.length > 0) {
          // attachments 可能是对象数组或字符串数组
          const firstAttachment = post.attachments[0];
          thumbnail = typeof firstAttachment === 'string' ? firstAttachment : (firstAttachment?.url || '');
        } else if (post?.images && Array.isArray(post.images) && post.images.length > 0) {
          thumbnail = post.images[0];
        } else if (typeof post?.attachments === 'string') {
          thumbnail = post.attachments;
        } else if (post?.thumbnail) {
          thumbnail = post.thumbnail;
        } else if (post?.cover_url) {
          thumbnail = post.cover_url;
        } else if (post?.image_url) {
          thumbnail = post.image_url;
        }
        
        // 如果没有找到图片，使用空字符串而不是占位图，让前端决定是否显示
        const finalThumbnail = thumbnail || '';
        
        // 获取作者名称 - 尝试多种可能的字段
        const authorName = post?.author?.username || post?.author?.name || post?.creator || post?.creator_name || post?.user?.username || user?.username || '未知作者';
        
        // 获取作者头像 - 尝试多种可能的字段
        const authorAvatar = post?.author?.avatar || post?.author?.avatar_url || post?.creator_avatar || post?.user?.avatar_url || user?.avatar_url || '/default-avatar.jpg';
        
        // 获取实际的点赞数
        const actualLikes = likesCountMap.get(like.post_id) || post?.likes || post?.likes_count || 0;
        
        return {
          id: like.post_id?.toString() || '',
          title: post?.title || '未命名帖子',
          thumbnail: finalThumbnail,
          type: CollectionType.COMMUNITY_POST,
          category: post?.category || '社区',
          createdAt: like.created_at && !isNaN(Date.parse(like.created_at))
            ? new Date(like.created_at).toISOString()
            : new Date().toISOString(),
          stats: {
            views: post?.views || post?.view_count || 0,
            likes: actualLikes,
            comments: post?.comments || post?.comments_count || 0,
          },
          isBookmarked: false,
          isLiked: true,
          link: `/post/${like.post_id}`,
          author: authorId ? {
            id: authorId,
            name: authorName,
            avatar: authorAvatar,
          } : undefined,
          description: post?.content || post?.description,
          tags: post?.tags || [],
          mediaType: post?.media_type || 'image',
        };
      });
  } catch (error) {
    console.error('获取点赞社区帖子失败:', error);
    return [];
  }
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
  try {
    // 获取当前用户ID
    const userId = await getCurrentUserId();

    if (!userId) {
      console.log('[getBookmarkedActivities] No userId found');
      return [];
    }

    console.log('[getBookmarkedActivities] Fetching bookmarks for user:', userId);

    // 注意：后端 API 返回的数据可能不准确，暂时禁用后端 API，只使用 Supabase
    // 后续可以重新启用后端 API，但需要确保后端数据正确
    console.log('[getBookmarkedActivities] Skipping backend API, using Supabase only...');

    // 如果后端 API 不可用，尝试从 Supabase 获取
    // 注意：这里假设使用 event_bookmarks 表，如果不存在需要创建
    console.log('[getBookmarkedActivities] Trying Supabase...');
    
    // 检查 event_bookmarks 表是否存在
    let bookmarks;
    try {
      // 将 userId 转换为字符串，以匹配 event_bookmarks 表的 user_id 字段类型
      const userIdStr = String(userId);
      console.log('[getBookmarkedActivities] Fetching bookmarks for user:', userIdStr);
      
      const { data, error } = await supabase
        .from('event_bookmarks')
        .select('event_id, created_at')
        .eq('user_id', userIdStr)
        .order('created_at', { ascending: false });
      
      if (error) {
        // 表不存在或其他错误
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('[getBookmarkedActivities] event_bookmarks table does not exist');
          return [];
        }
        console.error('[getBookmarkedActivities] Error fetching bookmarks:', error);
        return [];
      }
      bookmarks = data;
    } catch (error) {
      console.error('[getBookmarkedActivities] Error accessing event_bookmarks:', error);
      return [];
    }

    console.log('[getBookmarkedActivities] Bookmarks from DB:', bookmarks);
    
    if (!bookmarks || bookmarks.length === 0) {
      console.log('[getBookmarkedActivities] No bookmarks found');
      return [];
    }

    // 获取活动详情
    const eventIds = bookmarks.map(b => b.event_id);
    console.log('[getBookmarkedActivities] Event IDs from bookmarks:', eventIds);
    
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .in('id', eventIds);
    
    console.log('[getBookmarkedActivities] Events query result:', { events, eventsError });

    if (eventsError) {
      console.error('[getBookmarkedActivities] Error fetching events:', eventsError);
      return [];
    }

    console.log('[getBookmarkedActivities] Fetched events:', events);

    // 创建活动映射 - 只包含有效的活动（必须有start_time和end_time）
    const eventsMap = new Map();
    events?.forEach(event => {
      // 验证活动数据的完整性：活动必须有start_time和end_time字段
      if (event.start_time && event.end_time) {
        eventsMap.set(String(event.id), event);
      } else {
        console.warn('[getBookmarkedActivities] Skipping invalid event (missing start_time or end_time):', event.id, event.title);
      }
    });

    console.log('[getBookmarkedActivities] Valid events map size:', eventsMap.size);

    // 转换为 CollectionItem - 只返回有效的活动
    const result = bookmarks
      .filter((bookmark: any) => eventsMap.has(String(bookmark.event_id)))
      .map((bookmark: any) => {
        const event = eventsMap.get(String(bookmark.event_id));
        console.log('[getBookmarkedActivities] Processing event:', {
          id: event?.id,
          title: event?.title,
          description: event?.description,
          category: event?.category,
          image_url: event?.image_url,
          thumbnail_url: event?.thumbnail_url,
          cover_url: event?.cover_url,
        });
        return {
          id: bookmark.event_id?.toString() || '',
          title: event?.title || '未命名活动',
          thumbnail: event?.thumbnail_url || event?.image_url || event?.cover_url || '/placeholder-image.jpg',
          type: CollectionType.ACTIVITY,
          category: '活动',
          createdAt: bookmark.created_at && !isNaN(Date.parse(bookmark.created_at))
            ? new Date(bookmark.created_at).toISOString()
            : new Date().toISOString(),
          stats: {
            views: event?.view_count || event?.views || 0,
            likes: event?.like_count || event?.likes || 0,
            comments: event?.comments || 0,
          },
          isBookmarked: true,
          isLiked: false,
          link: `/events/${bookmark.event_id}/works`,
          description: event?.description,
          tags: event?.tags || [],
          mediaType: 'image',
        };
      });
    
    console.log('[getBookmarkedActivities] Final result count:', result.length);
    result.forEach((item, index) => {
      console.log(`[getBookmarkedActivities] Result ${index}:`, { id: item.id, title: item.title, type: item.type });
    });
    return result;
  } catch (error) {
    console.error('[getBookmarkedActivities] Error:', error);
    return [];
  }
}

/**
 * 获取用户点赞的活动
 */
async function getLikedActivities(
  sort: SortOption = SortOption.NEWEST
): Promise<CollectionItem[]> {
  try {
    // 获取当前用户ID
    const userId = await getCurrentUserId();

    if (!userId) {
      console.log('[getLikedActivities] No userId found');
      return [];
    }

    console.log('[getLikedActivities] Fetching likes for user:', userId);

    // 首先尝试从后端 API 获取点赞列表
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      try {
        console.log('[getLikedActivities] Trying backend API...');
        const response = await fetch('/api/user/likes?type=event', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          console.log('[getLikedActivities] Backend API success:', result);
          if (result.data && Array.isArray(result.data) && result.data.length > 0) {
            // 后端返回的活动数据，转换为 CollectionItem
            // 过滤掉无效的活动（必须有 start_time 和 end_time）
            const validEvents = result.data.filter((event: any) => {
              const isValid = event.start_time && event.end_time;
              if (!isValid) {
                console.warn('[getLikedActivities] Skipping invalid event from backend API (missing start_time or end_time):', event.id, event.title);
              }
              return isValid;
            });
            
            console.log('[getLikedActivities] Valid events from backend API:', validEvents.length, 'of', result.data.length);
            
            return validEvents.map((event: any) => ({
              id: event.id?.toString() || '',
              title: event.title || '未命名活动',
              thumbnail: event.image_url || event.cover_url || '/placeholder-image.jpg',
              type: CollectionType.ACTIVITY,
              category: event.category || '活动',
              createdAt: event.created_at || new Date().toISOString(),
              stats: {
                views: event.views || event.view_count || 0,
                likes: event.likes || event.likes_count || 0,
                comments: event.comments || event.comments_count || 0,
              },
              isBookmarked: false,
              isLiked: true,
              link: `/events/${event.id}`,
              author: event.organizer ? {
                id: event.organizer.id?.toString() || '',
                name: event.organizer.name || event.organizer.username || '未知组织者',
                avatar: event.organizer.avatar || event.organizer.avatar_url || '/default-avatar.jpg',
              } : undefined,
              description: event.description,
              tags: event.tags || [],
              mediaType: 'image',
            }));
          }
          console.log('[getLikedActivities] Backend API returned empty data, trying Supabase...');
        } else {
          console.warn('[getLikedActivities] Backend API failed:', response.status);
        }
      } catch (error) {
        console.warn('[getLikedActivities] Backend API error:', error);
      }
    }

    // 如果后端 API 不可用，尝试从 Supabase 获取
    // 注意：这里假设使用 event_likes 表，如果不存在需要创建
    console.log('[getLikedActivities] Trying Supabase...');
    
    // 检查 event_likes 表是否存在
    let likes;
    try {
      // 将 userId 转换为字符串，以匹配 event_likes 表的 user_id 字段类型
      const userIdStr = String(userId);
      console.log('[getLikedActivities] Fetching likes for user:', userIdStr);
      
      const { data, error } = await supabase
        .from('event_likes')
        .select('event_id, created_at')
        .eq('user_id', userIdStr)
        .order('created_at', { ascending: false });
      
      if (error) {
        // 表不存在或其他错误
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('[getLikedActivities] event_likes table does not exist');
          return [];
        }
        console.error('[getLikedActivities] Error fetching likes:', error);
        return [];
      }
      likes = data;
    } catch (error) {
      console.error('[getLikedActivities] Error accessing event_likes:', error);
      return [];
    }

    if (!likes || likes.length === 0) {
      console.log('[getLikedActivities] No likes found');
      return [];
    }

    // 获取活动详情
    const eventIds = likes.map(l => l.event_id);
    console.log('[getLikedActivities] Event IDs from likes:', eventIds);
    
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .in('id', eventIds);

    if (eventsError) {
      console.error('[getLikedActivities] Error fetching events:', eventsError);
      return [];
    }

    console.log('[getLikedActivities] Fetched events:', events?.length || 0);
    console.log('[getLikedActivities] Events data:', events?.map((e: any) => ({ id: e.id, title: e.title, start_time: e.start_time, end_time: e.end_time })));

    // 创建活动映射 - 只包含有效的活动（必须有start_time和end_time）
    const eventsMap = new Map();
    events?.forEach(event => {
      // 验证活动数据的完整性：活动必须有start_time和end_time字段
      if (event.start_time && event.end_time) {
        eventsMap.set(String(event.id), event);
      } else {
        console.warn('[getLikedActivities] Skipping invalid event (missing start_time or end_time):', event.id, event.title);
      }
    });

    console.log('[getLikedActivities] Valid events map size:', eventsMap.size);

    // 转换为 CollectionItem - 只返回有效的活动
    return likes
      .filter((like: any) => eventsMap.has(String(like.event_id)))
      .map((like: any) => {
        const event = eventsMap.get(String(like.event_id));
        return {
          id: like.event_id?.toString() || '',
          title: event?.title || '未命名活动',
          thumbnail: event?.thumbnail_url || event?.image_url || event?.cover_url || '/placeholder-image.jpg',
          type: CollectionType.ACTIVITY,
          category: '活动',
          createdAt: like.created_at && !isNaN(Date.parse(like.created_at))
            ? new Date(like.created_at).toISOString()
            : new Date().toISOString(),
          stats: {
            views: event?.view_count || event?.views || 0,
            likes: event?.like_count || event?.likes || 0,
            comments: event?.comments || 0,
          },
          isBookmarked: false,
          isLiked: true,
          link: `/events/${like.event_id}`,
          description: event?.description,
          tags: event?.tags || [],
          mediaType: 'image',
        };
      });
  } catch (error) {
    console.error('[getLikedActivities] Error:', error);
    return [];
  }
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

  if (type === 'all' || type === CollectionType.ACTIVITY) {
    const activities = await getLikedActivities(sort);
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
            // 后端返回的统计数据 - 使用后端返回的详细分类数据
            return {
              total: result.data.total_bookmarks || result.data.bookmarks_count || 0,
              squareWork: result.data.square_work_bookmarks || result.data.bookmarks_count || 0,
              communityPost: result.data.community_post_bookmarks || 0,
              activity: result.data.activity_bookmarks || 0,
              template: result.data.template_bookmarks || 0,
              totalLikes: result.data.total_likes || result.data.likes_count || 0,
              templateLikes: result.data.template_likes || 0,
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

    // 统一将 userId 转换为字符串，以匹配数据库字段类型
    const userIdStr = String(userId);
    console.log('[getUserCollectionStats] Using userIdStr:', userIdStr);

    // 获取广场作品收藏 - 只统计实际存在的作品
    let squareWorkBookmarks = 0;
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('works_bookmarks')
      .select('work_id')
      .eq('user_id', userIdStr);

    console.log('[getUserCollectionStats] works_bookmarks query:', { bookmarksCount: bookmarks?.length, error: bookmarksError });

    if (!bookmarksError && bookmarks && bookmarks.length > 0) {
      const workIds = bookmarks.map(b => b.work_id);
      const { data: existingWorks } = await supabase
        .from('works')
        .select('id')
        .in('id', workIds);
      // 将 work.id 转换为字符串，以匹配 bookmark.work_id
      const existingWorkIds = new Set(existingWorks?.map(w => String(w.id)) || []);
      squareWorkBookmarks = bookmarks.filter(b => existingWorkIds.has(String(b.work_id))).length;
    }

    // 获取广场作品点赞 - 只统计实际存在的作品
    let squareWorkLikes = 0;
    const { data: likes, error: likesError } = await supabase
      .from('works_likes')
      .select('work_id')
      .eq('user_id', userIdStr);

    console.log('[getUserCollectionStats] works_likes query:', { likesCount: likes?.length, error: likesError });

    if (!likesError && likes && likes.length > 0) {
      const workIds = likes.map(l => l.work_id);
      const { data: existingWorks } = await supabase
        .from('works')
        .select('id')
        .in('id', workIds);
      // 将 work.id 转换为字符串，以匹配 like.work_id
      const existingWorkIds = new Set(existingWorks?.map(w => String(w.id)) || []);
      squareWorkLikes = likes.filter(l => existingWorkIds.has(String(l.work_id))).length;
    }

    // 获取模板收藏 - 只统计实际存在的模板
    let templateBookmarks = 0;
    const { data: templateFavorites, error: templateFavoritesError } = await supabase
      .from('template_favorites')
      .select('template_id')
      .eq('user_id', userIdStr);

    console.log('[getUserCollectionStats] template_favorites query:', { favoritesCount: templateFavorites?.length, error: templateFavoritesError });

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
      .eq('user_id', userIdStr);

    console.log('[getUserCollectionStats] template_likes query:', { likesCount: templateLikesData?.length, error: templateLikesError });

    if (!templateLikesError && templateLikesData && templateLikesData.length > 0) {
      const templateIds = templateLikesData.map(l => l.template_id);
      const { data: existingTemplates } = await supabase
        .from('tianjin_templates')
        .select('id')
        .in('id', templateIds);
      const existingTemplateIds = new Set(existingTemplates?.map(t => t.id) || []);
      templateLikes = templateLikesData.filter(l => existingTemplateIds.has(l.template_id)).length;
    }

    // 获取社区帖子收藏 - 只统计实际存在的帖子
    let communityPostBookmarks = 0;
    const { data: postBookmarks, error: postBookmarksError } = await supabase
      .from('bookmarks')
      .select('post_id')
      .eq('user_id', userIdStr);

    console.log('[getUserCollectionStats] bookmarks query:', { bookmarksCount: postBookmarks?.length, error: postBookmarksError });

    if (!postBookmarksError && postBookmarks && postBookmarks.length > 0) {
      const postIds = postBookmarks.map(b => b.post_id);
      const { data: existingPosts } = await supabase
        .from('posts')
        .select('id')
        .in('id', postIds);
      const existingPostIds = new Set(existingPosts?.map(p => p.id) || []);
      communityPostBookmarks = postBookmarks.filter(b => existingPostIds.has(b.post_id)).length;
    }

    // 获取社区帖子点赞 - 只统计实际存在的帖子
    let communityPostLikes = 0;
    const { data: postLikes, error: postLikesError } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', userIdStr);

    if (!postLikesError && postLikes && postLikes.length > 0) {
      const postIds = postLikes.map(l => l.post_id);
      const { data: existingPosts } = await supabase
        .from('posts')
        .select('id')
        .in('id', postIds);
      const existingPostIds = new Set(existingPosts?.map(p => p.id) || []);
      communityPostLikes = postLikes.filter(l => existingPostIds.has(l.post_id)).length;
    }

    // 获取活动收藏 - 只统计实际存在的活动
    let activityBookmarks = 0;
    try {
      const { data: eventBookmarks, error: eventBookmarksError } = await supabase
        .from('event_bookmarks')
        .select('event_id')
        .eq('user_id', userIdStr);

      console.log('[getUserCollectionStats] event_bookmarks query:', { bookmarksCount: eventBookmarks?.length, error: eventBookmarksError });

      if (!eventBookmarksError && eventBookmarks && eventBookmarks.length > 0) {
        const eventIds = eventBookmarks.map(b => b.event_id);
        const { data: existingEvents } = await supabase
          .from('events')
          .select('id')
          .in('id', eventIds);
        const existingEventIds = new Set(existingEvents?.map(e => String(e.id)) || []);
        activityBookmarks = eventBookmarks.filter(b => existingEventIds.has(String(b.event_id))).length;
      }
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('[getUserCollectionStats] event_bookmarks table does not exist');
      } else {
        console.error('[getUserCollectionStats] Error fetching event bookmarks:', error);
      }
    }

    // 获取活动点赞 - 只统计实际存在的活动
    let activityLikes = 0;
    try {
      const { data: eventLikes, error: eventLikesError } = await supabase
        .from('event_likes')
        .select('event_id')
        .eq('user_id', userIdStr);

      if (!eventLikesError && eventLikes && eventLikes.length > 0) {
        const eventIds = eventLikes.map(l => l.event_id);
        const { data: existingEvents } = await supabase
          .from('events')
          .select('id')
          .in('id', eventIds);
        const existingEventIds = new Set(existingEvents?.map(e => String(e.id)) || []);
        activityLikes = eventLikes.filter(l => existingEventIds.has(String(l.event_id))).length;
      }
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('[getUserCollectionStats] event_likes table does not exist');
      } else {
        console.error('[getUserCollectionStats] Error fetching event likes:', error);
      }
    }

    const totalBookmarks = squareWorkBookmarks + templateBookmarks + communityPostBookmarks + activityBookmarks;
    const totalLikes = squareWorkLikes + templateLikes + communityPostLikes + activityLikes;

    console.log('[getUserCollectionStats] Final stats:', {
      totalBookmarks,
      squareWorkBookmarks,
      templateBookmarks,
      communityPostBookmarks,
      activityBookmarks,
      totalLikes,
      squareWorkLikes,
      templateLikes,
      communityPostLikes,
      activityLikes,
    });

    return {
      total: totalBookmarks,
      squareWork: squareWorkBookmarks,
      communityPost: communityPostBookmarks,
      activity: activityBookmarks,
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
    // 获取当前用户ID
    const userId = await getCurrentUserId();
    if (!userId) {
      toast.error('请先登录');
      return false;
    }

    // 根据类型处理不同的收藏逻辑
    if (type === CollectionType.SQUARE_WORK) {
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
    } else if (type === CollectionType.COMMUNITY_POST) {
      // 社区帖子收藏 - 使用 bookmarks 表
      // 检查是否已收藏
      const { data: existingBookmark } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .eq('post_id', id)
        .single();

      if (existingBookmark) {
        // 取消收藏
        const { error: deleteError } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', userId)
          .eq('post_id', id);

        if (deleteError) {
          console.error('[toggleBookmark] Delete error:', deleteError);
          throw deleteError;
        }
        toast.success('已取消收藏');
        return false;
      } else {
        // 添加收藏
        const { error: insertError } = await supabase
          .from('bookmarks')
          .insert({
            user_id: userId,
            post_id: id,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('[toggleBookmark] Insert error:', insertError);
          throw insertError;
        }
        toast.success('已添加到收藏');
        return true;
      }
    } else if (type === CollectionType.ACTIVITY) {
      // 活动收藏 - 使用 event_bookmarks 表
      try {
        const userIdStr = String(userId);
        
        // 检查是否已收藏
        const { data: existingBookmark, error: checkError } = await supabase
          .from('event_bookmarks')
          .select('*')
          .eq('user_id', userIdStr)
          .eq('event_id', id)
          .single();

        if (checkError && checkError.code === '42P01') {
          console.warn('[toggleBookmark] event_bookmarks table does not exist');
          toast.error('活动收藏功能暂未开通');
          return false;
        }

        if (existingBookmark) {
          // 取消收藏
          const { error: deleteError } = await supabase
            .from('event_bookmarks')
            .delete()
            .eq('user_id', userIdStr)
            .eq('event_id', id);

          if (deleteError) {
            console.error('[toggleBookmark] Delete error:', deleteError);
            throw deleteError;
          }
          toast.success('已取消收藏');
          return false;
        } else {
          // 添加收藏
          const { error: insertError } = await supabase
            .from('event_bookmarks')
            .insert({
              user_id: userIdStr,
              event_id: id,
              created_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('[toggleBookmark] Insert error:', insertError);
            throw insertError;
          }
          toast.success('已添加到收藏');
          return true;
        }
      } catch (error: any) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('[toggleBookmark] event_bookmarks table does not exist');
          toast.error('活动收藏功能暂未开通');
          return false;
        }
        throw error;
      }
    } else if (type === CollectionType.TEMPLATE) {
      // 模板收藏 - 使用 template_favorites 表
      try {
        const userIdStr = String(userId);
        
        // 检查是否已收藏
        const { data: existingBookmark, error: checkError } = await supabase
          .from('template_favorites')
          .select('*')
          .eq('user_id', userIdStr)
          .eq('template_id', id)
          .single();

        if (checkError && checkError.code === '42P01') {
          console.warn('[toggleBookmark] template_favorites table does not exist');
          toast.error('模板收藏功能暂未开通');
          return false;
        }

        if (existingBookmark) {
          // 取消收藏
          const { error: deleteError } = await supabase
            .from('template_favorites')
            .delete()
            .eq('user_id', userIdStr)
            .eq('template_id', id);

          if (deleteError) {
            console.error('[toggleBookmark] Delete error:', deleteError);
            throw deleteError;
          }
          toast.success('已取消收藏');
          return false;
        } else {
          // 添加收藏
          const { error: insertError } = await supabase
            .from('template_favorites')
            .insert({
              user_id: userIdStr,
              template_id: id,
              created_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('[toggleBookmark] Insert error:', insertError);
            throw insertError;
          }
          toast.success('已添加到收藏');
          return true;
        }
      } catch (error: any) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('[toggleBookmark] template_favorites table does not exist');
          toast.error('模板收藏功能暂未开通');
          return false;
        }
        throw error;
      }
    } else {
      toast.error('该类型暂不支持收藏');
      return false;
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
    // 获取当前用户ID
    const userId = await getCurrentUserId();
    if (!userId) {
      toast.error('请先登录');
      return false;
    }

    if (type === CollectionType.SQUARE_WORK) {
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
    } else if (type === CollectionType.COMMUNITY_POST) {
      // 社区帖子收藏 - 使用 bookmarks 表
      const { error: deleteError } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', id);

      if (deleteError) {
        console.error('[removeBookmark] Delete error:', deleteError);
        throw deleteError;
      }
      toast.success('已取消收藏');
      return false;
    } else if (type === CollectionType.ACTIVITY) {
      // 活动收藏 - 使用 event_bookmarks 表
      try {
        const userIdStr = String(userId);
        
        const { error: deleteError } = await supabase
          .from('event_bookmarks')
          .delete()
          .eq('user_id', userIdStr)
          .eq('event_id', id);

        if (deleteError && deleteError.code === '42P01') {
          console.warn('[removeBookmark] event_bookmarks table does not exist');
          toast.error('活动收藏功能暂未开通');
          return true; // 返回 true 表示操作失败
        }

        if (deleteError) {
          console.error('[removeBookmark] Delete error:', deleteError);
          throw deleteError;
        }
        toast.success('已取消收藏');
        return false;
      } catch (error: any) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('[removeBookmark] event_bookmarks table does not exist');
          toast.error('活动收藏功能暂未开通');
          return true; // 返回 true 表示操作失败
        }
        throw error;
      }
    } else if (type === CollectionType.TEMPLATE) {
      // 模板收藏 - 使用 template_favorites 表
      try {
        const userIdStr = String(userId);
        
        const { error: deleteError } = await supabase
          .from('template_favorites')
          .delete()
          .eq('user_id', userIdStr)
          .eq('template_id', id);

        if (deleteError && deleteError.code === '42P01') {
          console.warn('[removeBookmark] template_favorites table does not exist');
          toast.error('模板收藏功能暂未开通');
          return true; // 返回 true 表示操作失败
        }

        if (deleteError) {
          console.error('[removeBookmark] Delete error:', deleteError);
          throw deleteError;
        }
        toast.success('已取消收藏');
        return false;
      } catch (error: any) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('[removeBookmark] template_favorites table does not exist');
          toast.error('模板收藏功能暂未开通');
          return true; // 返回 true 表示操作失败
        }
        throw error;
      }
    } else {
      toast.error('该类型暂不支持收藏');
      return false;
    }
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
    // 获取当前用户ID
    const userId = await getCurrentUserId();
    if (!userId) {
      toast.error('请先登录');
      return false;
    }

    if (type === CollectionType.SQUARE_WORK) {
      // 广场作品点赞 - 使用 works_likes 表
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
    } else if (type === CollectionType.ACTIVITY) {
      // 活动点赞 - 使用 event_likes 表
      try {
        const userIdStr = String(userId);
        
        const { error: deleteError } = await supabase
          .from('event_likes')
          .delete()
          .eq('user_id', userIdStr)
          .eq('event_id', id);

        if (deleteError && deleteError.code === '42P01') {
          console.warn('[removeLike] event_likes table does not exist');
          toast.error('活动点赞功能暂未开通');
          return true; // 返回 true 表示操作失败
        }

        if (deleteError) {
          console.error('[removeLike] Delete error:', deleteError);
          throw deleteError;
        }
        toast.success('已取消点赞');
        return false;
      } catch (error: any) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('[removeLike] event_likes table does not exist');
          toast.error('活动点赞功能暂未开通');
          return true; // 返回 true 表示操作失败
        }
        throw error;
      }
    } else if (type === CollectionType.TEMPLATE) {
      // 模板点赞 - 使用 template_likes 表
      try {
        const userIdStr = String(userId);
        
        const { error: deleteError } = await supabase
          .from('template_likes')
          .delete()
          .eq('user_id', userIdStr)
          .eq('template_id', id);

        if (deleteError && deleteError.code === '42P01') {
          console.warn('[removeLike] template_likes table does not exist');
          toast.error('模板点赞功能暂未开通');
          return true; // 返回 true 表示操作失败
        }

        if (deleteError) {
          console.error('[removeLike] Delete error:', deleteError);
          throw deleteError;
        }
        toast.success('已取消点赞');
        return false;
      } catch (error: any) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('[removeLike] template_likes table does not exist');
          toast.error('模板点赞功能暂未开通');
          return true; // 返回 true 表示操作失败
        }
        throw error;
      }
    } else if (type === CollectionType.COMMUNITY_POST) {
      // 社区帖子点赞 - 使用 likes 表
      try {
        const userIdStr = String(userId);
        
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', userIdStr)
          .eq('post_id', id);

        if (deleteError && deleteError.code === '42P01') {
          console.warn('[removeLike] likes table does not exist');
          toast.error('社区帖子点赞功能暂未开通');
          return true; // 返回 true 表示操作失败
        }

        if (deleteError) {
          console.error('[removeLike] Delete error:', deleteError);
          throw deleteError;
        }
        
        // 更新 posts 表的 likes_count
        try {
          const { data: currentPost } = await supabase
            .from('posts')
            .select('likes_count')
            .eq('id', id)
            .single();
          
          if (currentPost) {
            const newLikesCount = Math.max((currentPost.likes_count || 0) - 1, 0);
            await supabase
              .from('posts')
              .update({ likes_count: newLikesCount })
              .eq('id', id);
          }
        } catch (e) {
          console.log('[removeLike] Failed to update likes_count');
        }
        
        toast.success('已取消点赞');
        return false;
      } catch (error: any) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('[removeLike] likes table does not exist');
          toast.error('社区帖子点赞功能暂未开通');
          return true; // 返回 true 表示操作失败
        }
        throw error;
      }
    } else {
      toast.error('该类型暂不支持点赞');
      return false;
    }
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
    // 获取当前用户ID
    const userId = await getCurrentUserId();
    if (!userId) {
      toast.error('请先登录');
      return false;
    }

    if (type === CollectionType.SQUARE_WORK) {
      // 广场作品点赞
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
    } else if (type === CollectionType.ACTIVITY) {
      // 活动点赞 - 使用 event_likes 表
      try {
        const userIdStr = String(userId);
        
        // 检查是否已点赞
        const { data: existingLike, error: checkError } = await supabase
          .from('event_likes')
          .select('*')
          .eq('user_id', userIdStr)
          .eq('event_id', id)
          .single();

        if (checkError && checkError.code === '42P01') {
          console.warn('[toggleLike] event_likes table does not exist');
          toast.error('活动点赞功能暂未开通');
          return false;
        }

        if (existingLike) {
          // 取消点赞
          const { error: deleteError } = await supabase
            .from('event_likes')
            .delete()
            .eq('user_id', userIdStr)
            .eq('event_id', id);

          if (deleteError) {
            console.error('[toggleLike] Delete error:', deleteError);
            throw deleteError;
          }
          toast.success('已取消点赞');
          return false;
        } else {
          // 添加点赞
          const { error: insertError } = await supabase
            .from('event_likes')
            .insert({
              user_id: userIdStr,
              event_id: id,
              created_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('[toggleLike] Insert error:', insertError);
            throw insertError;
          }
          toast.success('已点赞');
          return true;
        }
      } catch (error: any) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('[toggleLike] event_likes table does not exist');
          toast.error('活动点赞功能暂未开通');
          return false;
        }
        throw error;
      }
    } else if (type === CollectionType.TEMPLATE) {
      // 模板点赞 - 使用 template_likes 表
      try {
        const userIdStr = String(userId);
        
        // 检查是否已点赞
        const { data: existingLike, error: checkError } = await supabase
          .from('template_likes')
          .select('*')
          .eq('user_id', userIdStr)
          .eq('template_id', id)
          .single();

        if (checkError && checkError.code === '42P01') {
          console.warn('[toggleLike] template_likes table does not exist');
          toast.error('模板点赞功能暂未开通');
          return false;
        }

        if (existingLike) {
          // 取消点赞
          const { error: deleteError } = await supabase
            .from('template_likes')
            .delete()
            .eq('user_id', userIdStr)
            .eq('template_id', id);

          if (deleteError) {
            console.error('[toggleLike] Delete error:', deleteError);
            throw deleteError;
          }
          toast.success('已取消点赞');
          return false;
        } else {
          // 添加点赞
          const { error: insertError } = await supabase
            .from('template_likes')
            .insert({
              user_id: userIdStr,
              template_id: id,
              created_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('[toggleLike] Insert error:', insertError);
            throw insertError;
          }
          toast.success('已点赞');
          return true;
        }
      } catch (error: any) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('[toggleLike] template_likes table does not exist');
          toast.error('模板点赞功能暂未开通');
          return false;
        }
        throw error;
      }
    } else if (type === CollectionType.COMMUNITY_POST) {
      // 社区帖子点赞 - 使用 likes 表
      try {
        const userIdStr = String(userId);
        
        // 检查是否已点赞
        const { data: existingLike, error: checkError } = await supabase
          .from('likes')
          .select('*')
          .eq('user_id', userIdStr)
          .eq('post_id', id)
          .single();

        if (checkError && checkError.code === '42P01') {
          console.warn('[toggleLike] likes table does not exist');
          toast.error('社区帖子点赞功能暂未开通');
          return false;
        }

        if (existingLike) {
          // 取消点赞
          const { error: deleteError } = await supabase
            .from('likes')
            .delete()
            .eq('user_id', userIdStr)
            .eq('post_id', id);

          if (deleteError) {
            console.error('[toggleLike] Delete error:', deleteError);
            throw deleteError;
          }
          
          // 更新 posts 表的 likes_count
          try {
            const { data: currentPost } = await supabase
              .from('posts')
              .select('likes_count')
              .eq('id', id)
              .single();
            
            if (currentPost) {
              const newLikesCount = Math.max((currentPost.likes_count || 0) - 1, 0);
              await supabase
                .from('posts')
                .update({ likes_count: newLikesCount })
                .eq('id', id);
            }
          } catch (e) {
            console.log('[toggleLike] Failed to update likes_count');
          }
          
          toast.success('已取消点赞');
          return false;
        } else {
          // 添加点赞
          const { error: insertError } = await supabase
            .from('likes')
            .insert({
              user_id: userIdStr,
              post_id: id,
              created_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('[toggleLike] Insert error:', insertError);
            throw insertError;
          }
          
          // 更新 posts 表的 likes_count
          try {
            const { data: currentPost } = await supabase
              .from('posts')
              .select('likes_count')
              .eq('id', id)
              .single();
            
            if (currentPost) {
              const newLikesCount = (currentPost.likes_count || 0) + 1;
              await supabase
                .from('posts')
                .update({ likes_count: newLikesCount })
                .eq('id', id);
            }
          } catch (e) {
            console.log('[toggleLike] Failed to update likes_count');
          }
          
          toast.success('已点赞');
          return true;
        }
      } catch (error: any) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('[toggleLike] likes table does not exist');
          toast.error('社区帖子点赞功能暂未开通');
          return false;
        }
        throw error;
      }
    } else {
      toast.error('该类型暂不支持点赞');
      return false;
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
