import { useCallback, useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { recordUserAction, UserActionType } from '@/services/recommendationService';

interface UseUserBehaviorTrackingOptions {
  itemType: 'post' | 'challenge' | 'template' | 'user' | 'tag' | 'culturalElement';
  itemId: string;
  metadata?: Record<string, any>;
}

/**
 * 用户行为追踪 Hook
 * 用于在组件中方便地记录用户行为，用于个性化推荐
 * 
 * @example
 * const { trackView, trackLike, trackShare } = useUserBehaviorTracking({
 *   itemType: 'post',
 *   itemId: post.id,
 *   metadata: { category: post.category, tags: post.tags }
 * });
 * 
 * // 在组件中使用
 * useEffect(() => {
 *   trackView();
 * }, []);
 * 
 * <button onClick={trackLike}>点赞</button>
 */
export function useUserBehaviorTracking(options: UseUserBehaviorTrackingOptions) {
  const { user } = useContext(AuthContext);
  
  const getUserId = useCallback(() => {
    if (user?.id) return user.id;
    // 为未登录用户生成临时ID
    let deviceId = localStorage.getItem('jmzf_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('jmzf_device_id', deviceId);
    }
    return deviceId;
  }, [user]);

  const trackAction = useCallback((actionType: UserActionType, value?: number) => {
    const userId = getUserId();
    recordUserAction({
      userId,
      itemId: options.itemId,
      itemType: options.itemType,
      actionType,
      value,
      metadata: options.metadata
    });
  }, [getUserId, options]);

  // 浏览
  const trackView = useCallback(() => {
    trackAction('view', 1);
  }, [trackAction]);

  // 点赞
  const trackLike = useCallback(() => {
    trackAction('like', 5);
  }, [trackAction]);

  // 取消点赞
  const trackUnlike = useCallback(() => {
    trackAction('like', -5);
  }, [trackAction]);

  // 评论
  const trackComment = useCallback(() => {
    trackAction('comment', 8);
  }, [trackAction]);

  // 分享
  const trackShare = useCallback(() => {
    trackAction('share', 10);
  }, [trackAction]);

  // 收藏
  const trackSave = useCallback(() => {
    trackAction('save', 7);
  }, [trackAction]);

  // 取消收藏
  const trackUnsave = useCallback(() => {
    trackAction('save', -7);
  }, [trackAction]);

  // 提交/发布
  const trackSubmit = useCallback(() => {
    trackAction('submit', 12);
  }, [trackAction]);

  // 参与
  const trackParticipate = useCallback(() => {
    trackAction('participate', 15);
  }, [trackAction]);

  // 下载
  const trackDownload = useCallback(() => {
    trackAction('download', 6);
  }, [trackAction]);

  // 点击
  const trackClick = useCallback(() => {
    trackAction('click', 2);
  }, [trackAction]);

  // 搜索
  const trackSearch = useCallback((query: string) => {
    const userId = getUserId();
    recordUserAction({
      userId,
      itemId: `search_${Date.now()}`,
      itemType: 'tag',
      actionType: 'search',
      value: 3,
      metadata: { query }
    });
  }, [getUserId]);

  // 不喜欢
  const trackDislike = useCallback(() => {
    trackAction('dislike', -10);
  }, [trackAction]);

  // 隐藏
  const trackHide = useCallback(() => {
    trackAction('hide', -5);
  }, [trackAction]);

  return {
    trackView,
    trackLike,
    trackUnlike,
    trackComment,
    trackShare,
    trackSave,
    trackUnsave,
    trackSubmit,
    trackParticipate,
    trackDownload,
    trackClick,
    trackSearch,
    trackDislike,
    trackHide,
    // 原始方法，用于自定义行为
    trackAction
  };
}

/**
 * 简化的行为追踪 Hook
 * 用于只需要追踪特定行为的场景
 */
export function useTrackView(options: UseUserBehaviorTrackingOptions) {
  const { trackView } = useUserBehaviorTracking(options);
  
  return trackView;
}

export function useTrackInteraction(options: UseUserBehaviorTrackingOptions) {
  const { trackLike, trackComment, trackShare, trackSave } = useUserBehaviorTracking(options);
  
  return { trackLike, trackComment, trackShare, trackSave };
}

export default useUserBehaviorTracking;
