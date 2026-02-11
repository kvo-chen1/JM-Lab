/**
 * 推荐系统后端服务
 * 用于将用户行为数据同步到Supabase后端，支持跨设备推荐
 */

import { supabase } from '@/lib/supabase';
import { 
  UserAction, 
  UserPreference, 
  RecommendationFeedback,
  RecommendedItem 
} from './recommendationService';

// 本地存储键
const USER_ACTIONS_KEY = 'jmzf_user_actions';
const USER_PREFERENCES_KEY = 'jmzf_user_preferences';
const PENDING_SYNC_KEY = 'jmzf_pending_sync_actions';

/**
 * 将用户行为同步到后端
 */
export async function syncUserActionsToBackend(userId: string): Promise<boolean> {
  try {
    // 获取本地未同步的行为
    const pendingActions = getPendingSyncActions();
    if (pendingActions.length === 0) return true;

    // 批量插入到Supabase
    const { error } = await supabase
      .from('user_actions')
      .upsert(
        pendingActions.map(action => ({
          user_id: userId,
          item_id: action.itemId,
          item_type: action.itemType,
          action_type: action.actionType,
          value: action.value || 1,
          metadata: action.metadata,
          created_at: action.timestamp
        })),
        { onConflict: 'user_id,item_id,action_type,created_at' }
      );

    if (error) {
      console.error('同步用户行为失败:', error);
      return false;
    }

    // 清除已同步的行为
    clearPendingSyncActions();
    return true;
  } catch (error) {
    console.error('同步用户行为出错:', error);
    return false;
  }
}

/**
 * 从后端获取用户行为
 */
export async function fetchUserActionsFromBackend(
  userId: string, 
  days: number = 30
): Promise<UserAction[]> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabase
      .from('user_actions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取用户行为失败:', error);
      return [];
    }

    return data.map(row => ({
      id: row.id,
      userId: row.user_id,
      itemId: row.item_id,
      itemType: row.item_type,
      actionType: row.action_type,
      value: row.value,
      metadata: row.metadata,
      timestamp: row.created_at
    }));
  } catch (error) {
    console.error('获取用户行为出错:', error);
    return [];
  }
}

/**
 * 保存用户偏好到后端
 */
export async function saveUserPreferenceToBackend(
  userId: string, 
  preference: UserPreference
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        interests: preference.interests,
        cultural_elements: preference.culturalElements,
        categories: preference.categories,
        themes: preference.themes,
        tags: preference.tags,
        update_frequency: preference.updateFrequency,
        last_updated: preference.lastUpdated
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('保存用户偏好失败:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('保存用户偏好出错:', error);
    return false;
  }
}

/**
 * 从后端获取用户偏好
 */
export async function fetchUserPreferenceFromBackend(
  userId: string
): Promise<UserPreference | null> {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // 未找到记录
      console.error('获取用户偏好失败:', error);
      return null;
    }

    return {
      userId: data.user_id,
      interests: data.interests,
      culturalElements: data.cultural_elements,
      categories: data.categories,
      themes: data.themes,
      tags: data.tags,
      updateFrequency: data.update_frequency,
      lastUpdated: data.last_updated
    };
  } catch (error) {
    console.error('获取用户偏好出错:', error);
    return null;
  }
}

/**
 * 保存推荐反馈到后端
 */
export async function saveRecommendationFeedbackToBackend(
  userId: string,
  feedback: RecommendationFeedback
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('recommendation_feedback')
      .insert({
        user_id: userId,
        item_id: feedback.itemId,
        item_type: feedback.itemType,
        feedback_type: feedback.feedbackType,
        reason: feedback.reason,
        metadata: feedback.metadata,
        created_at: feedback.timestamp
      });

    if (error) {
      console.error('保存推荐反馈失败:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('保存推荐反馈出错:', error);
    return false;
  }
}

/**
 * 获取待同步的行为
 */
function getPendingSyncActions(): UserAction[] {
  const raw = localStorage.getItem(PENDING_SYNC_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * 添加待同步行为
 */
export function addPendingSyncAction(action: UserAction): void {
  const pending = getPendingSyncActions();
  pending.push(action);
  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
}

/**
 * 清除已同步的行为
 */
function clearPendingSyncActions(): void {
  localStorage.removeItem(PENDING_SYNC_KEY);
}

/**
 * 合并本地和后端数据
 */
export function mergeUserActions(
  localActions: UserAction[],
  backendActions: UserAction[]
): UserAction[] {
  const actionMap = new Map<string, UserAction>();
  
  // 先添加本地数据
  localActions.forEach(action => {
    const key = `${action.userId}_${action.itemId}_${action.actionType}_${action.timestamp}`;
    actionMap.set(key, action);
  });
  
  // 合并后端数据（后端数据优先级更高）
  backendActions.forEach(action => {
    const key = `${action.userId}_${action.itemId}_${action.actionType}_${action.timestamp}`;
    actionMap.set(key, action);
  });
  
  return Array.from(actionMap.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * 获取推荐内容（优先从后端获取，支持大数据量）
 */
export async function fetchRecommendationsFromBackend(
  userId: string,
  limit: number = 20
): Promise<RecommendedItem[]> {
  try {
    // 调用Supabase RPC函数获取推荐
    const { data, error } = await supabase
      .rpc('get_personalized_recommendations', {
        p_user_id: userId,
        p_limit: limit
      });

    if (error) {
      console.error('获取后端推荐失败:', error);
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      thumbnail: item.thumbnail,
      score: item.score,
      reason: item.reason,
      metadata: item.metadata
    }));
  } catch (error) {
    console.error('获取后端推荐出错:', error);
    return [];
  }
}

/**
 * 自动同步（在合适的时机调用）
 */
export async function autoSyncUserData(userId: string): Promise<void> {
  // 1. 同步行为数据到后端
  await syncUserActionsToBackend(userId);
  
  // 2. 从后端获取最新数据
  const backendActions = await fetchUserActionsFromBackend(userId);
  
  // 3. 合并数据
  const localActions = JSON.parse(localStorage.getItem(USER_ACTIONS_KEY) || '[]');
  const mergedActions = mergeUserActions(localActions, backendActions);
  
  // 4. 保存合并后的数据
  localStorage.setItem(USER_ACTIONS_KEY, JSON.stringify(mergedActions));
  
  // 5. 同步用户偏好
  const localPreference = JSON.parse(localStorage.getItem(USER_PREFERENCES_KEY) || '{}');
  if (localPreference.userId === userId) {
    await saveUserPreferenceToBackend(userId, localPreference);
  }
}

// 导出服务对象
export default {
  syncUserActionsToBackend,
  fetchUserActionsFromBackend,
  saveUserPreferenceToBackend,
  fetchUserPreferenceFromBackend,
  saveRecommendationFeedbackToBackend,
  addPendingSyncAction,
  fetchRecommendationsFromBackend,
  autoSyncUserData,
  mergeUserActions
};
