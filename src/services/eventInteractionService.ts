import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * 活动互动服务
 * 提供活动的收藏等互动功能
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
 * 获取活动的收藏状态
 */
export async function getEventFavoriteState(eventId: string): Promise<boolean> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('event_favorites')
      .select('id')
      .eq('event_id', eventId)
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
 * 切换活动收藏状态
 */
export async function toggleEventFavorite(eventId: string): Promise<boolean> {
  const userId = await getCurrentUserId();

  if (!userId) {
    toast.error('请先登录后再收藏');
    return false;
  }

  try {
    // 检查当前状态
    const { data: existingFavorite, error: checkError } = await supabase
      .from('event_favorites')
      .select('id')
      .eq('event_id', eventId)
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
        .from('event_favorites')
        .delete()
        .eq('event_id', eventId)
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
        .from('event_favorites')
        .insert({
          event_id: eventId,
          user_id: userId,
        });

      if (error) {
        console.error('Failed to insert favorite:', error);
        toast.error('操作失败，请稍后重试');
        return false;
      }

      isFavorited = true;
      toast.success('已收藏活动到"我的收藏"');
    }

    return isFavorited;
  } catch (e) {
    console.warn('Error toggling favorite:', e);
    toast.error('操作失败，请稍后重试');
    return false;
  }
}

/**
 * 获取用户收藏的所有活动ID
 */
export async function getUserFavoritedEventIds(): Promise<string[]> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('event_favorites')
      .select('event_id')
      .eq('user_id', userId);

    if (error) {
      console.warn('Failed to get favorites:', error);
      return [];
    }

    return data?.map(record => record.event_id) || [];
  } catch (e) {
    console.warn('Error getting favorites:', e);
    return [];
  }
}

/**
 * 批量获取活动的收藏状态
 */
export async function getBatchEventInteractions(eventIds: string[]): Promise<Map<string, boolean>> {
  const result = new Map<string, boolean>();

  await Promise.all(
    eventIds.map(async (id) => {
      const isFavorited = await getEventFavoriteState(id);
      result.set(id, isFavorited);
    })
  );

  return result;
}

/**
 * 获取用户活动收藏数
 */
export async function getUserFavoritesCount(): Promise<number> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from('event_favorites')
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

/**
 * 获取活动的收藏数
 */
export async function getEventFavoriteCount(eventId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('event_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    if (error) {
      console.warn('Failed to get event favorite count:', error);
      return 0;
    }

    return count || 0;
  } catch (e) {
    console.warn('Error getting event favorite count:', e);
    return 0;
  }
}

// 导出服务
export const eventInteractionService = {
  getEventFavoriteState,
  toggleEventFavorite,
  getUserFavoritedEventIds,
  getBatchEventInteractions,
  getUserFavoritesCount,
  getEventFavoriteCount,
};

export default eventInteractionService;
