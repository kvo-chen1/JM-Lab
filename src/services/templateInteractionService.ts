/*
 * 模板互动服务模块
 * 提供模板点赞、收藏等互动功能
 * 优先使用 Supabase 数据库，失败时使用 localStorage 作为降级方案
 */

import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

// 用户互动数据存储键（localStorage 降级方案）
const STORAGE_KEYS = {
  LIKED_TEMPLATES: 'tianjin_liked_templates',
  FAVORITED_TEMPLATES: 'tianjin_favorited_templates',
  TEMPLATE_LIKE_COUNTS: 'tianjin_template_like_counts',
  TEMPLATE_USAGE_COUNTS: 'tianjin_template_usage_counts',
} as const;

// 模板互动状态接口
export interface TemplateInteractionState {
  isLiked: boolean;
  isFavorited: boolean;
  likeCount: number;
  usageCount: number;
}

// 用户互动记录接口
interface UserInteractionRecord {
  templateId: number;
  timestamp: number;
}

/**
 * 获取当前用户ID
 */
async function getCurrentUserId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  // 首先尝试从 Supabase Auth 获取当前用户
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch {
    // 继续尝试其他方式
  }
  
  // 尝试从 localStorage 获取用户信息（兼容性）
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
 * 检查用户是否已登录
 */
async function isUserLoggedIn(): Promise<boolean> {
  return !!(await getCurrentUserId());
}

/**
 * 从 localStorage 获取数据
 */
function getStorageData<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * 保存数据到 localStorage
 */
function setStorageData<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save data to ${key}:`, error);
  }
}

/**
 * 检查错误是否是权限错误（401 或 RLS）
 */
function isAuthError(error: any): boolean {
  if (!error) return false;
  // 检查各种可能的权限错误
  if (error.code === '42501') return true; // RLS 错误
  if (error.code === '401') return true; // Unauthorized
  if (error.message?.includes('row-level security')) return true;
  if (error.message?.includes('Unauthorized')) return true;
  return false;
}

/**
 * 获取模板的点赞状态（从 Supabase）
 */
export async function getTemplateLikeState(templateId: number): Promise<{ isLiked: boolean; likeCount: number }> {
  const userId = await getCurrentUserId();
  
  // 查询点赞数
  try {
    const { count: likeCount, error: countError } = await supabase
      .from('template_likes')
      .select('*', { count: 'exact', head: true })
      .eq('template_id', templateId);
    
    if (countError) {
      console.warn('Failed to get like count from Supabase:', countError);
      // 降级到 localStorage
      return getTemplateLikeStateFromLocal(templateId);
    }
    
    // 如果用户已登录，查询是否已点赞
    let isLiked = false;
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('template_likes')
          .select('id')
          .eq('template_id', templateId)
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!error && data) {
          isLiked = true;
        }
      } catch (e) {
        // 忽略错误
      }
    }
    
    return {
      isLiked,
      likeCount: likeCount || 0,
    };
  } catch (e) {
    console.warn('Error getting like state:', e);
    return getTemplateLikeStateFromLocal(templateId);
  }
}

/**
 * 从 localStorage 获取点赞状态（降级方案）
 */
function getTemplateLikeStateFromLocal(templateId: number): { isLiked: boolean; likeCount: number } {
  const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}')?.id : null;
  const likedTemplates = userId 
    ? getStorageData<UserInteractionRecord>(`${STORAGE_KEYS.LIKED_TEMPLATES}_${userId}`)
    : [];
  const isLiked = likedTemplates.some(record => record.templateId === templateId);
  
  const likeCounts = getStorageData<{ templateId: number; count: number }>(STORAGE_KEYS.TEMPLATE_LIKE_COUNTS);
  const likeCountRecord = likeCounts.find(c => c.templateId === templateId);
  
  return {
    isLiked,
    likeCount: likeCountRecord?.count || 0,
  };
}

/**
 * 获取模板的收藏状态（从 Supabase）
 */
export async function getTemplateFavoriteState(templateId: number): Promise<boolean> {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    // 未登录，使用 localStorage
    return getTemplateFavoriteStateFromLocal(templateId);
  }
  
  try {
    const { data, error } = await supabase
      .from('template_favorites')
      .select('id')
      .eq('template_id', templateId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error && isAuthError(error)) {
      // 权限错误，降级到 localStorage
      return getTemplateFavoriteStateFromLocal(templateId);
    }
    
    return !!data;
  } catch (e) {
    console.warn('Error getting favorite state:', e);
    return getTemplateFavoriteStateFromLocal(templateId);
  }
}

/**
 * 从 localStorage 获取收藏状态（降级方案）
 */
function getTemplateFavoriteStateFromLocal(templateId: number): boolean {
  const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}')?.id : null;
  if (!userId) return false;
  
  const favoritedTemplates = getStorageData<UserInteractionRecord>(`${STORAGE_KEYS.FAVORITED_TEMPLATES}_${userId}`);
  return favoritedTemplates.some(record => record.templateId === templateId);
}

/**
 * 切换模板点赞状态（同步到 Supabase）
 */
export async function toggleTemplateLike(templateId: number): Promise<{ isLiked: boolean; likeCount: number }> {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    // 未登录，使用 localStorage
    return toggleTemplateLikeLocal(templateId);
  }
  
  try {
    // 检查当前状态
    const { data: existingLike, error: checkError } = await supabase
      .from('template_likes')
      .select('id')
      .eq('template_id', templateId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError && isAuthError(checkError)) {
      // 权限错误，降级到 localStorage
      return toggleTemplateLikeLocal(templateId);
    }
    
    let isLiked: boolean;
    
    if (existingLike) {
      // 取消点赞
      const { error } = await supabase
        .from('template_likes')
        .delete()
        .eq('template_id', templateId)
        .eq('user_id', userId);
      
      if (error) {
        if (isAuthError(error)) {
          return toggleTemplateLikeLocal(templateId);
        }
        console.error('Failed to delete like:', error);
        toast.error('操作失败，请稍后重试');
        return { isLiked: true, likeCount: 0 };
      }
      
      isLiked = false;
      toast.success('已取消点赞');
    } else {
      // 添加点赞
      const { error } = await supabase
        .from('template_likes')
        .insert({
          template_id: templateId,
          user_id: userId,
        });
      
      if (error) {
        if (isAuthError(error)) {
          return toggleTemplateLikeLocal(templateId);
        }
        console.error('Failed to insert like:', error);
        toast.error('操作失败，请稍后重试');
        return { isLiked: false, likeCount: 0 };
      }
      
      isLiked = true;
      toast.success('已点赞');
    }
    
    // 获取最新的点赞数
    const { count } = await supabase
      .from('template_likes')
      .select('*', { count: 'exact', head: true })
      .eq('template_id', templateId);
    
    return {
      isLiked,
      likeCount: count || 0,
    };
  } catch (e) {
    console.warn('Error toggling like:', e);
    return toggleTemplateLikeLocal(templateId);
  }
}

/**
 * 本地切换点赞状态（降级方案）
 */
function toggleTemplateLikeLocal(templateId: number): { isLiked: boolean; likeCount: number } {
  const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}')?.id : 'anonymous';
  const storageKey = `${STORAGE_KEYS.LIKED_TEMPLATES}_${userId}`;
  const likedTemplates = getStorageData<UserInteractionRecord>(storageKey);
  
  const existingIndex = likedTemplates.findIndex(record => record.templateId === templateId);
  let isLiked: boolean;
  
  if (existingIndex >= 0) {
    likedTemplates.splice(existingIndex, 1);
    isLiked = false;
    toast.success('已取消点赞');
  } else {
    likedTemplates.push({ templateId, timestamp: Date.now() });
    isLiked = true;
    toast.success('已点赞');
  }
  
  setStorageData(storageKey, likedTemplates);
  
  const likeCounts = getStorageData<{ templateId: number; count: number }>(STORAGE_KEYS.TEMPLATE_LIKE_COUNTS);
  const countIndex = likeCounts.findIndex(c => c.templateId === templateId);
  
  if (countIndex >= 0) {
    likeCounts[countIndex].count = Math.max(0, likeCounts[countIndex].count + (isLiked ? 1 : -1));
  } else {
    likeCounts.push({ templateId, count: isLiked ? 1 : 0 });
  }
  
  setStorageData(STORAGE_KEYS.TEMPLATE_LIKE_COUNTS, likeCounts);
  
  return {
    isLiked,
    likeCount: likeCounts.find(c => c.templateId === templateId)?.count || 0,
  };
}

/**
 * 切换模板收藏状态（同步到 Supabase）
 */
export async function toggleTemplateFavorite(templateId: number): Promise<boolean> {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    // 未登录，使用 localStorage
    return toggleTemplateFavoriteLocal(templateId);
  }
  
  try {
    // 检查当前状态
    const { data: existingFavorite, error: checkError } = await supabase
      .from('template_favorites')
      .select('id')
      .eq('template_id', templateId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError && isAuthError(checkError)) {
      // 权限错误，降级到 localStorage
      return toggleTemplateFavoriteLocal(templateId);
    }
    
    let isFavorited: boolean;
    
    if (existingFavorite) {
      // 取消收藏
      const { error } = await supabase
        .from('template_favorites')
        .delete()
        .eq('template_id', templateId)
        .eq('user_id', userId);
      
      if (error) {
        if (isAuthError(error)) {
          return toggleTemplateFavoriteLocal(templateId);
        }
        console.error('Failed to delete favorite:', error);
        toast.error('操作失败，请稍后重试');
        return true;
      }
      
      isFavorited = false;
      toast.success('已取消收藏');
    } else {
      // 添加收藏
      const { error } = await supabase
        .from('template_favorites')
        .insert({
          template_id: templateId,
          user_id: userId,
        });
      
      if (error) {
        if (isAuthError(error)) {
          return toggleTemplateFavoriteLocal(templateId);
        }
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
    return toggleTemplateFavoriteLocal(templateId);
  }
}

/**
 * 本地切换收藏状态（降级方案）
 */
function toggleTemplateFavoriteLocal(templateId: number): boolean {
  const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}')?.id : 'anonymous';
  const storageKey = `${STORAGE_KEYS.FAVORITED_TEMPLATES}_${userId}`;
  const favoritedTemplates = getStorageData<UserInteractionRecord>(storageKey);
  
  const existingIndex = favoritedTemplates.findIndex(record => record.templateId === templateId);
  let isFavorited: boolean;
  
  if (existingIndex >= 0) {
    favoritedTemplates.splice(existingIndex, 1);
    isFavorited = false;
    toast.success('已取消收藏');
  } else {
    favoritedTemplates.push({ templateId, timestamp: Date.now() });
    isFavorited = true;
    toast.success('已收藏到"我的收藏"');
  }
  
  setStorageData(storageKey, favoritedTemplates);
  return isFavorited;
}

/**
 * 记录模板使用次数
 */
export function recordTemplateUsage(templateId: number): void {
  const usageCounts = getStorageData<{ templateId: number; count: number }>(STORAGE_KEYS.TEMPLATE_USAGE_COUNTS);
  const countIndex = usageCounts.findIndex(c => c.templateId === templateId);
  
  if (countIndex >= 0) {
    usageCounts[countIndex].count += 1;
  } else {
    usageCounts.push({ templateId, count: 1 });
  }
  
  setStorageData(STORAGE_KEYS.TEMPLATE_USAGE_COUNTS, usageCounts);
}

/**
 * 获取模板使用次数
 */
export function getTemplateUsageCount(templateId: number): number {
  const usageCounts = getStorageData<{ templateId: number; count: number }>(STORAGE_KEYS.TEMPLATE_USAGE_COUNTS);
  return usageCounts.find(c => c.templateId === templateId)?.count || 0;
}

/**
 * 获取用户收藏的所有模板ID（从 Supabase）
 */
export async function getUserFavoritedTemplateIds(): Promise<number[]> {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    // 未登录，使用 localStorage
    return getUserFavoritedTemplateIdsFromLocal();
  }
  
  try {
    const { data, error } = await supabase
      .from('template_favorites')
      .select('template_id')
      .eq('user_id', userId);
    
    if (error && isAuthError(error)) {
      return getUserFavoritedTemplateIdsFromLocal();
    }
    
    return data?.map(record => record.template_id) || [];
  } catch (e) {
    console.warn('Error getting favorites:', e);
    return getUserFavoritedTemplateIdsFromLocal();
  }
}

/**
 * 从 localStorage 获取收藏ID（降级方案）
 */
function getUserFavoritedTemplateIdsFromLocal(): number[] {
  const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}')?.id : null;
  if (!userId) return [];
  
  const favoritedTemplates = getStorageData<UserInteractionRecord>(`${STORAGE_KEYS.FAVORITED_TEMPLATES}_${userId}`);
  return favoritedTemplates.map(record => record.templateId);
}

/**
 * 获取用户点赞的所有模板ID
 */
export async function getUserLikedTemplateIds(): Promise<number[]> {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    return getUserLikedTemplateIdsFromLocal();
  }
  
  try {
    const { data, error } = await supabase
      .from('template_likes')
      .select('template_id')
      .eq('user_id', userId);
    
    if (error && isAuthError(error)) {
      return getUserLikedTemplateIdsFromLocal();
    }
    
    return data?.map(record => record.template_id) || [];
  } catch (e) {
    console.warn('Error getting likes:', e);
    return getUserLikedTemplateIdsFromLocal();
  }
}

/**
 * 从 localStorage 获取点赞ID（降级方案）
 */
function getUserLikedTemplateIdsFromLocal(): number[] {
  const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}')?.id : null;
  if (!userId) return [];
  
  const likedTemplates = getStorageData<UserInteractionRecord>(`${STORAGE_KEYS.LIKED_TEMPLATES}_${userId}`);
  return likedTemplates.map(record => record.templateId);
}

/**
 * 批量获取模板的互动状态
 */
export async function getBatchTemplateInteractions(templateIds: number[]): Promise<Map<number, TemplateInteractionState>> {
  const result = new Map<number, TemplateInteractionState>();
  
  await Promise.all(
    templateIds.map(async (id) => {
      const likeState = await getTemplateLikeState(id);
      const isFavorited = await getTemplateFavoriteState(id);
      const usageCount = getTemplateUsageCount(id);
      
      result.set(id, {
        isLiked: likeState.isLiked,
        isFavorited,
        likeCount: likeState.likeCount,
        usageCount,
      });
    })
  );
  
  return result;
}

/**
 * 同步互动数据到服务器（当用户登录后）
 */
export async function syncInteractionsToServer(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;
  
  console.log('Syncing template interactions to server...');
  
  // 获取 localStorage 中的数据
  const localFavorites = getStorageData<UserInteractionRecord>(`${STORAGE_KEYS.FAVORITED_TEMPLATES}_${userId}`);
  const localLikes = getStorageData<UserInteractionRecord>(`${STORAGE_KEYS.LIKED_TEMPLATES}_${userId}`);
  
  // 同步收藏
  for (const record of localFavorites) {
    try {
      await supabase
        .from('template_favorites')
        .upsert({
          template_id: record.templateId,
          user_id: userId,
        }, { onConflict: 'user_id,template_id' });
    } catch (e) {
      console.warn('Failed to sync favorite:', e);
    }
  }
  
  // 同步点赞
  for (const record of localLikes) {
    try {
      await supabase
        .from('template_likes')
        .upsert({
          template_id: record.templateId,
          user_id: userId,
        }, { onConflict: 'user_id,template_id' });
    } catch (e) {
      console.warn('Failed to sync like:', e);
    }
  }
  
  console.log('Sync completed');
}

/**
 * 获取用户收藏数（从 Supabase）
 */
export async function getUserFavoritesCount(): Promise<number> {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    // 未登录，使用 localStorage
    return getUserFavoritedTemplateIdsFromLocal().length;
  }
  
  try {
    const { count, error } = await supabase
      .from('template_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (error && isAuthError(error)) {
      return getUserFavoritedTemplateIdsFromLocal().length;
    }
    
    return count || 0;
  } catch (e) {
    console.warn('Error getting favorites count:', e);
    return getUserFavoritedTemplateIdsFromLocal().length;
  }
}

/**
 * 获取平台总点赞数（从 Supabase）
 */
export async function getTotalLikesCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('template_likes')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.warn('Failed to get total likes count from Supabase:', error);
      return 0;
    }
    
    return count || 0;
  } catch (e) {
    console.warn('Error getting total likes count:', e);
    return 0;
  }
}

/**
 * 获取平台总使用次数（从 Supabase tianjin_templates 表）
 */
export async function getTotalUsageCount(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('tianjin_templates')
      .select('usage_count');
    
    if (error) {
      console.warn('Failed to get total usage count from Supabase:', error);
      return 0;
    }
    
    return data?.reduce((sum, item) => sum + (item.usage_count || 0), 0) || 0;
  } catch (e) {
    console.warn('Error getting total usage count:', e);
    return 0;
  }
}

// 导出服务
export const templateInteractionService = {
  getTemplateLikeState,
  getTemplateFavoriteState,
  toggleTemplateLike,
  toggleTemplateFavorite,
  recordTemplateUsage,
  getTemplateUsageCount,
  getUserFavoritedTemplateIds,
  getUserLikedTemplateIds,
  getBatchTemplateInteractions,
  syncInteractionsToServer,
  getUserFavoritesCount,
  getTotalLikesCount,
  getTotalUsageCount,
};

export default templateInteractionService;
