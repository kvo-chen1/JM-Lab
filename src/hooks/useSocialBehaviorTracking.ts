/**
 * 社交行为追踪 Hook
 * 用于记录用户的社交互动行为（点赞、评论、收藏、关注等）
 */

import { useCallback, useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import {
  behaviorAnalysisService,
  BehaviorType,
  TargetType,
} from '@/services/behaviorAnalysisService';

export interface UseSocialBehaviorTrackingOptions {
  postId?: string;
  postTitle?: string;
  workId?: string;
  workTitle?: string;
  userId?: string;
  userName?: string;
}

/**
 * 社交行为追踪 Hook
 * 记录点赞、评论、收藏、关注等社交行为
 */
export function useSocialBehaviorTracking(options: UseSocialBehaviorTrackingOptions = {}) {
  const { user } = useContext(AuthContext);
  const currentUserId = user?.id;

  /**
   * 记录帖子点赞行为
   */
  const trackPostLike = useCallback(
    async (postId: string, postTitle?: string, isUnlike: boolean = false) => {
      if (!currentUserId) return;

      await behaviorAnalysisService.recordSocialBehavior(
        currentUserId,
        isUnlike ? 'post_unlike' : 'post_like',
        postId,
        postTitle || options.postTitle,
        {
          postId,
          postTitle: postTitle || options.postTitle,
          action: isUnlike ? 'unlike' : 'like',
        }
      );
    },
    [currentUserId, options.postTitle]
  );

  /**
   * 记录帖子收藏行为
   */
  const trackPostFavorite = useCallback(
    async (postId: string, postTitle?: string, isUnfavorite: boolean = false) => {
      if (!currentUserId) return;

      await behaviorAnalysisService.recordSocialBehavior(
        currentUserId,
        isUnfavorite ? 'post_unfavorite' : 'post_favorite',
        postId,
        postTitle || options.postTitle,
        {
          postId,
          postTitle: postTitle || options.postTitle,
          action: isUnfavorite ? 'unfavorite' : 'favorite',
        }
      );
    },
    [currentUserId, options.postTitle]
  );

  /**
   * 记录帖子评论行为
   */
  const trackPostComment = useCallback(
    async (postId: string, commentId: string, commentContent: string, isDelete: boolean = false) => {
      if (!currentUserId) return;

      await behaviorAnalysisService.recordBehavior({
        userId: currentUserId,
        behaviorType: isDelete ? 'post_comment_delete' : 'post_comment',
        targetType: 'comment',
        targetId: commentId,
        targetTitle: commentContent.substring(0, 100),
        metadata: {
          postId,
          commentId,
          commentLength: commentContent.length,
          action: isDelete ? 'delete' : 'create',
        },
      });
    },
    [currentUserId]
  );

  /**
   * 记录帖子分享行为
   */
  const trackPostShare = useCallback(
    async (postId: string, postTitle?: string, sharePlatform?: string) => {
      if (!currentUserId) return;

      await behaviorAnalysisService.recordSocialBehavior(
        currentUserId,
        'post_share',
        postId,
        postTitle || options.postTitle,
        {
          postId,
          postTitle: postTitle || options.postTitle,
          sharePlatform,
        }
      );
    },
    [currentUserId, options.postTitle]
  );

  /**
   * 记录帖子浏览行为
   */
  const trackPostView = useCallback(
    async (postId: string, postTitle?: string, viewDuration?: number) => {
      if (!currentUserId) return;

      await behaviorAnalysisService.recordBehavior({
        userId: currentUserId,
        behaviorType: 'post_view',
        targetType: 'post',
        targetId: postId,
        targetTitle: postTitle || options.postTitle,
        metadata: {
          postId,
          postTitle: postTitle || options.postTitle,
          viewDuration,
          viewedAt: new Date().toISOString(),
        },
      });
    },
    [currentUserId, options.postTitle]
  );

  /**
   * 记录用户关注行为
   */
  const trackUserFollow = useCallback(
    async (targetUserId: string, targetUserName?: string, isUnfollow: boolean = false) => {
      if (!currentUserId) return;

      await behaviorAnalysisService.recordSocialBehavior(
        currentUserId,
        isUnfollow ? 'user_unfollow' : 'user_follow',
        targetUserId,
        targetUserName || options.userName,
        {
          targetUserId,
          targetUserName: targetUserName || options.userName,
          action: isUnfollow ? 'unfollow' : 'follow',
        }
      );
    },
    [currentUserId, options.userName]
  );

  /**
   * 记录作品点赞行为
   */
  const trackWorkLike = useCallback(
    async (workId: string, workTitle?: string, isUnlike: boolean = false) => {
      if (!currentUserId) return;

      await behaviorAnalysisService.recordWorkInteraction(
        currentUserId,
        isUnlike ? 'work_unlike' : 'work_like',
        workId,
        workTitle || options.workTitle,
        {
          workId,
          workTitle: workTitle || options.workTitle,
          action: isUnlike ? 'unlike' : 'like',
        }
      );
    },
    [currentUserId, options.workTitle]
  );

  /**
   * 记录作品收藏行为
   */
  const trackWorkFavorite = useCallback(
    async (workId: string, workTitle?: string, isUnfavorite: boolean = false) => {
      if (!currentUserId) return;

      await behaviorAnalysisService.recordWorkInteraction(
        currentUserId,
        isUnfavorite ? 'work_unfavorite' : 'work_favorite',
        workId,
        workTitle || options.workTitle,
        {
          workId,
          workTitle: workTitle || options.workTitle,
          action: isUnfavorite ? 'unfavorite' : 'favorite',
        }
      );
    },
    [currentUserId, options.workTitle]
  );

  /**
   * 记录作品浏览行为
   */
  const trackWorkView = useCallback(
    async (workId: string, workTitle?: string, viewDuration?: number) => {
      if (!currentUserId) return;

      await behaviorAnalysisService.recordWorkInteraction(
        currentUserId,
        'work_view',
        workId,
        workTitle || options.workTitle,
        {
          workId,
          workTitle: workTitle || options.workTitle,
          viewDuration,
          viewedAt: new Date().toISOString(),
        }
      );
    },
    [currentUserId, options.workTitle]
  );

  /**
   * 记录作品下载行为
   */
  const trackWorkDownload = useCallback(
    async (workId: string, workTitle?: string, downloadType?: string) => {
      if (!currentUserId) return;

      await behaviorAnalysisService.recordWorkInteraction(
        currentUserId,
        'work_download',
        workId,
        workTitle || options.workTitle,
        {
          workId,
          workTitle: workTitle || options.workTitle,
          downloadType,
        }
      );
    },
    [currentUserId, options.workTitle]
  );

  /**
   * 记录作品分享行为
   */
  const trackWorkShare = useCallback(
    async (workId: string, workTitle?: string, sharePlatform?: string) => {
      if (!currentUserId) return;

      await behaviorAnalysisService.recordWorkInteraction(
        currentUserId,
        'work_share',
        workId,
        workTitle || options.workTitle,
        {
          workId,
          workTitle: workTitle || options.workTitle,
          sharePlatform,
        }
      );
    },
    [currentUserId, options.workTitle]
  );

  /**
   * 通用的社交行为记录
   */
  const trackSocialAction = useCallback(
    async (
      behaviorType: BehaviorType,
      targetType: TargetType,
      targetId: string,
      targetTitle?: string,
      metadata?: Record<string, any>
    ) => {
      if (!currentUserId) return;

      await behaviorAnalysisService.recordBehavior({
        userId: currentUserId,
        behaviorType,
        targetType,
        targetId,
        targetTitle,
        metadata: {
          ...metadata,
          recordedAt: new Date().toISOString(),
        },
      });
    },
    [currentUserId]
  );

  return {
    // 帖子行为
    trackPostLike,
    trackPostFavorite,
    trackPostComment,
    trackPostShare,
    trackPostView,

    // 用户行为
    trackUserFollow,

    // 作品行为
    trackWorkLike,
    trackWorkFavorite,
    trackWorkView,
    trackWorkDownload,
    trackWorkShare,

    // 通用方法
    trackSocialAction,

    // 状态
    isLoggedIn: !!currentUserId,
  };
}

/**
 * 简化的帖子行为追踪 Hook
 */
export function usePostBehaviorTracking(postId: string, postTitle?: string) {
  const tracking = useSocialBehaviorTracking({ postId, postTitle });

  return {
    trackLike: (isUnlike?: boolean) => tracking.trackPostLike(postId, postTitle, isUnlike),
    trackFavorite: (isUnfavorite?: boolean) => tracking.trackPostFavorite(postId, postTitle, isUnfavorite),
    trackComment: (commentId: string, content: string, isDelete?: boolean) =>
      tracking.trackPostComment(postId, commentId, content, isDelete),
    trackShare: (platform?: string) => tracking.trackPostShare(postId, postTitle, platform),
    trackView: (duration?: number) => tracking.trackPostView(postId, postTitle, duration),
    isLoggedIn: tracking.isLoggedIn,
  };
}

/**
 * 简化的作品行为追踪 Hook
 */
export function useWorkBehaviorTracking(workId: string, workTitle?: string) {
  const tracking = useSocialBehaviorTracking({ workId, workTitle });

  return {
    trackLike: (isUnlike?: boolean) => tracking.trackWorkLike(workId, workTitle, isUnlike),
    trackFavorite: (isUnfavorite?: boolean) => tracking.trackWorkFavorite(workId, workTitle, isUnfavorite),
    trackView: (duration?: number) => tracking.trackWorkView(workId, workTitle, duration),
    trackDownload: (type?: string) => tracking.trackWorkDownload(workId, workTitle, type),
    trackShare: (platform?: string) => tracking.trackWorkShare(workId, workTitle, platform),
    isLoggedIn: tracking.isLoggedIn,
  };
}

export default useSocialBehaviorTracking;
