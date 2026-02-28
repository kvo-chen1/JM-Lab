/**
 * 用户行为追踪 Hook
 * 用于在组件中方便地追踪用户行为
 */

import { useCallback } from 'react';
import { analyticsTrackingService } from '../services/analyticsTrackingService';

export function useBehaviorTracker() {
  // 追踪作品浏览
  const trackWorkView = useCallback(async (workId: string, metadata?: Record<string, any>) => {
    try {
      await analyticsTrackingService.trackBehavior({
        action: 'view_work',
        work_id: workId,
        metadata: {
          duration: 0,
          ...metadata,
        },
      });
    } catch (error) {
      console.error('追踪作品浏览失败:', error);
    }
  }, []);

  // 追踪作品点击
  const trackWorkClick = useCallback(async (workId: string, metadata?: Record<string, any>) => {
    try {
      await analyticsTrackingService.trackBehavior({
        action: 'click_work',
        work_id: workId,
        metadata,
      });
    } catch (error) {
      console.error('追踪作品点击失败:', error);
    }
  }, []);

  // 追踪推广作品曝光
  const trackPromotedWorkView = useCallback(async (promotedWorkId: string, metadata?: Record<string, any>) => {
    try {
      await analyticsTrackingService.trackBehavior({
        action: 'view_promoted',
        promoted_work_id: promotedWorkId,
        metadata,
      });
    } catch (error) {
      console.error('追踪推广作品曝光失败:', error);
    }
  }, []);

  // 追踪推广作品点击
  const trackPromotedWorkClick = useCallback(async (promotedWorkId: string, metadata?: Record<string, any>) => {
    try {
      await analyticsTrackingService.trackBehavior({
        action: 'click_promoted',
        promoted_work_id: promotedWorkId,
        metadata,
      });
    } catch (error) {
      console.error('追踪推广作品点击失败:', error);
    }
  }, []);

  // 追踪点赞
  const trackLike = useCallback(async (workId: string, metadata?: Record<string, any>) => {
    try {
      await analyticsTrackingService.trackBehavior({
        action: 'like_work',
        work_id: workId,
        metadata,
      });
    } catch (error) {
      console.error('追踪点赞失败:', error);
    }
  }, []);

  // 追踪收藏
  const trackCollect = useCallback(async (workId: string, metadata?: Record<string, any>) => {
    try {
      await analyticsTrackingService.trackBehavior({
        action: 'collect_work',
        work_id: workId,
        metadata,
      });
    } catch (error) {
      console.error('追踪收藏失败:', error);
    }
  }, []);

  // 追踪分享
  const trackShare = useCallback(async (workId: string, metadata?: Record<string, any>) => {
    try {
      await analyticsTrackingService.trackBehavior({
        action: 'share_work',
        work_id: workId,
        metadata,
      });
    } catch (error) {
      console.error('追踪分享失败:', error);
    }
  }, []);

  // 追踪评论
  const trackComment = useCallback(async (workId: string, metadata?: Record<string, any>) => {
    try {
      await analyticsTrackingService.trackBehavior({
        action: 'comment_work',
        work_id: workId,
        metadata,
      });
    } catch (error) {
      console.error('追踪评论失败:', error);
    }
  }, []);

  // 追踪购买
  const trackPurchase = useCallback(async (workId: string, amount: number, metadata?: Record<string, any>) => {
    try {
      await analyticsTrackingService.trackBehavior({
        action: 'purchase_work',
        work_id: workId,
        metadata: {
          amount,
          ...metadata,
        },
      });
    } catch (error) {
      console.error('追踪购买失败:', error);
    }
  }, []);

  // 追踪转化事件
  const trackConversion = useCallback(async (
    promotedWorkId: string,
    conversionType: 'purchase' | 'signup' | 'download' | 'share' | 'follow',
    value?: number,
    metadata?: Record<string, any>
  ) => {
    try {
      await analyticsTrackingService.trackConversion({
        promoted_work_id: promotedWorkId,
        conversion_type: conversionType,
        conversion_value: value,
        metadata,
      });
    } catch (error) {
      console.error('追踪转化事件失败:', error);
    }
  }, []);

  return {
    trackWorkView,
    trackWorkClick,
    trackPromotedWorkView,
    trackPromotedWorkClick,
    trackLike,
    trackCollect,
    trackShare,
    trackComment,
    trackPurchase,
    trackConversion,
  };
}
