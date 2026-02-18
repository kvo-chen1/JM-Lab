import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { behaviorAnalysisService } from '@/services/behaviorAnalysisService';

/**
 * 社区互动服务
 * 提供社区帖子的点赞、收藏等互动功能
 * 同时记录用户行为用于分析
 */

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
        return user.id;
      }
    } catch {
      // 解析失败，继续尝试其他方式
    }
  }

  // 尝试从 Supabase Auth 获取
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

/**
 * 检查用户是否已登录
 */
async function isUserLoggedIn(): Promise<boolean> {
  return !!(await getCurrentUserId());
}

/**
 * 获取帖子的点赞状态
 */
export async function getPostLikeState(postId: string): Promise<{ isLiked: boolean; likeCount: number }> {
  const userId = await getCurrentUserId();

  try {
    // 查询点赞数
    const { count: likeCount, error: countError } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (countError) {
      console.warn('Failed to get like count:', countError);
      return { isLiked: false, likeCount: 0 };
    }

    // 如果用户已登录，查询是否已点赞
    let isLiked = false;
    if (userId) {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        isLiked = true;
      }
    }

    return {
      isLiked,
      likeCount: likeCount || 0,
    };
  } catch (e) {
    console.warn('Error getting like state:', e);
    return { isLiked: false, likeCount: 0 };
  }
}

/**
 * 获取帖子的收藏状态
 */
export async function getPostFavoriteState(postId: string): Promise<boolean> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Failed to get favorite state:', error);
      return false;
    }

    return !!data;
  } catch (e) {
    console.warn('Error getting favorite state:', e);
    return false;
  }
}

/**
 * 切换帖子点赞状态
 */
export async function togglePostLike(postId: string, postTitle?: string): Promise<{ isLiked: boolean; likeCount: number }> {
  const userId = await getCurrentUserId();

  if (!userId) {
    toast.error('请先登录后再点赞');
    return { isLiked: false, likeCount: 0 };
  }

  try {
    // 检查当前状态
    const { data: existingLike, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('Failed to check like status:', checkError);
      toast.error('操作失败，请稍后重试');
      return { isLiked: false, likeCount: 0 };
    }

    let isLiked: boolean;

    if (existingLike) {
      // 取消点赞
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to delete like:', error);
        toast.error('操作失败，请稍后重试');
        return { isLiked: true, likeCount: 0 };
      }

      isLiked = false;
      toast.success('已取消点赞');

      // 记录取消点赞行为
      behaviorAnalysisService.recordSocialBehavior(
        userId,
        'post_unlike',
        postId,
        postTitle
      ).catch(err => console.warn('记录行为失败:', err));
    } else {
      // 添加点赞
      const { error } = await supabase
        .from('likes')
        .insert({
          post_id: postId,
          user_id: userId,
        });

      if (error) {
        console.error('Failed to insert like:', error);
        toast.error('操作失败，请稍后重试');
        return { isLiked: false, likeCount: 0 };
      }

      isLiked = true;
      toast.success('已点赞');

      // 记录点赞行为
      behaviorAnalysisService.recordSocialBehavior(
        userId,
        'post_like',
        postId,
        postTitle
      ).catch(err => console.warn('记录行为失败:', err));
    }

    // 获取最新的点赞数
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    return {
      isLiked,
      likeCount: count || 0,
    };
  } catch (e) {
    console.warn('Error toggling like:', e);
    toast.error('操作失败，请稍后重试');
    return { isLiked: false, likeCount: 0 };
  }
}

/**
 * 切换帖子收藏状态
 * 注意：此函数不显示 toast，由调用方负责显示
 */
export async function togglePostFavorite(postId: string, postTitle?: string): Promise<boolean> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error('请先登录后再收藏');
  }

  try {
    // 检查当前状态
    const { data: existingFavorite, error: checkError } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('Failed to check favorite status:', checkError);
      throw new Error('操作失败，请稍后重试');
    }

    let isFavorited: boolean;

    if (existingFavorite) {
      // 取消收藏
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to delete favorite:', error);
        throw new Error('操作失败，请稍后重试');
      }

      isFavorited = false;

      // 记录取消收藏行为
      behaviorAnalysisService.recordSocialBehavior(
        userId,
        'post_unfavorite',
        postId,
        postTitle
      ).catch(err => console.warn('记录行为失败:', err));
    } else {
      // 添加收藏
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          post_id: postId,
          user_id: userId,
        });

      if (error) {
        console.error('Failed to insert favorite:', error);
        throw new Error('操作失败，请稍后重试');
      }

      isFavorited = true;

      // 记录收藏行为
      behaviorAnalysisService.recordSocialBehavior(
        userId,
        'post_favorite',
        postId,
        postTitle
      ).catch(err => console.warn('记录行为失败:', err));
    }

    return isFavorited;
  } catch (e) {
    console.warn('Error toggling favorite:', e);
    throw e;
  }
}

/**
 * 获取用户收藏的所有社区帖子ID
 */
export async function getUserFavoritedPostIds(): Promise<string[]> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('post_id')
      .eq('user_id', userId);

    if (error) {
      console.warn('Failed to get favorites:', error);
      return [];
    }

    return data?.map(record => record.post_id) || [];
  } catch (e) {
    console.warn('Error getting favorites:', e);
    return [];
  }
}

/**
 * 获取用户点赞的所有社区帖子ID
 */
export async function getUserLikedPostIds(): Promise<string[]> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', userId);

    if (error) {
      console.warn('Failed to get likes:', error);
      return [];
    }

    return data?.map(record => record.post_id) || [];
  } catch (e) {
    console.warn('Error getting likes:', e);
    return [];
  }
}

/**
 * 批量获取帖子的互动状态
 */
export async function getBatchPostInteractions(postIds: string[]): Promise<Map<string, { isLiked: boolean; isFavorited: boolean; likeCount: number }>> {
  const result = new Map<string, { isLiked: boolean; isFavorited: boolean; likeCount: number }>();

  await Promise.all(
    postIds.map(async (id) => {
      const [likeState, isFavorited] = await Promise.all([
        getPostLikeState(id),
        getPostFavoriteState(id),
      ]);

      result.set(id, {
        isLiked: likeState.isLiked,
        isFavorited,
        likeCount: likeState.likeCount,
      });
    })
  );

  return result;
}

/**
 * 获取用户收藏数
 */
export async function getUserFavoritesCount(): Promise<number> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.warn('Failed to get favorites count:', error);
      return 0;
    }

    return count || 0;
  } catch (e) {
    console.warn('Error getting favorites count:', e);
    return 0;
  }
}

// 导出服务
export const communityInteractionService = {
  getPostLikeState,
  getPostFavoriteState,
  togglePostLike,
  togglePostFavorite,
  getUserFavoritedPostIds,
  getUserLikedPostIds,
  getBatchPostInteractions,
  getUserFavoritesCount,
};

export default communityInteractionService;
