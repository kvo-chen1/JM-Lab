import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

/**
 * 社区互动服务
 * 提供社区帖子的点赞、收藏等互动功能
 */

/**
 * 获取当前用户ID
 */
async function getCurrentUserId(): Promise<string | null> {
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
      .from('community_post_likes')
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
        .from('community_post_likes')
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
      .from('community_post_favorites')
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
export async function togglePostLike(postId: string): Promise<{ isLiked: boolean; likeCount: number }> {
  const userId = await getCurrentUserId();

  if (!userId) {
    toast.error('请先登录后再点赞');
    return { isLiked: false, likeCount: 0 };
  }

  try {
    // 检查当前状态
    const { data: existingLike, error: checkError } = await supabase
      .from('community_post_likes')
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
        .from('community_post_likes')
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
    } else {
      // 添加点赞
      const { error } = await supabase
        .from('community_post_likes')
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
    }

    // 获取最新的点赞数
    const { count } = await supabase
      .from('community_post_likes')
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
 */
export async function togglePostFavorite(postId: string): Promise<boolean> {
  const userId = await getCurrentUserId();

  if (!userId) {
    toast.error('请先登录后再收藏');
    return false;
  }

  try {
    // 检查当前状态
    const { data: existingFavorite, error: checkError } = await supabase
      .from('community_post_favorites')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('Failed to check favorite status:', checkError);
      toast.error('操作失败，请稍后重试');
      return false;
    }

    let isFavorited: boolean;

    if (existingFavorite) {
      // 取消收藏
      const { error } = await supabase
        .from('community_post_favorites')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to delete favorite:', error);
        toast.error('操作失败，请稍后重试');
        return true;
      }

      isFavorited = false;
      toast.success('已取消收藏');
    } else {
      // 添加收藏
      const { error } = await supabase
        .from('community_post_favorites')
        .insert({
          post_id: postId,
          user_id: userId,
        });

      if (error) {
        console.error('Failed to insert favorite:', error);
        toast.error('操作失败，请稍后重试');
        return false;
      }

      isFavorited = true;
      toast.success('已收藏到"我的收藏"');
    }

    return isFavorited;
  } catch (e) {
    console.warn('Error toggling favorite:', e);
    toast.error('操作失败，请稍后重试');
    return false;
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
      .from('community_post_favorites')
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
      .from('community_post_likes')
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
      .from('community_post_favorites')
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
