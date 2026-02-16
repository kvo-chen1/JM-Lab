/**
 * 搜索行为追踪 Hook
 * 用于记录用户的搜索行为
 */

import { useCallback, useContext, useRef } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { behaviorAnalysisService } from '@/services/behaviorAnalysisService';

export interface SearchEvent {
  query: string;
  timestamp: number;
  resultCount?: number;
  filters?: Record<string, any>;
  clickedResult?: {
    type: string;
    id: string;
    title?: string;
    position?: number;
  };
}

export interface UseSearchBehaviorTrackingOptions {
  onSearchRecorded?: (event: SearchEvent) => void;
}

/**
 * 搜索行为追踪 Hook
 * 记录搜索查询、结果点击、筛选等行为
 */
export function useSearchBehaviorTracking(options: UseSearchBehaviorTrackingOptions = {}) {
  const { user } = useContext(AuthContext);
  const currentUserId = user?.id;

  // 用于存储当前搜索会话的信息
  const currentSearchRef = useRef<{
    query: string;
    timestamp: number;
    resultCount?: number;
    filters?: Record<string, any>;
  } | null>(null);

  /**
   * 记录搜索查询
   */
  const trackSearch = useCallback(
    async (query: string, resultCount?: number, filters?: Record<string, any>) => {
      // 存储当前搜索信息
      currentSearchRef.current = {
        query,
        timestamp: Date.now(),
        resultCount,
        filters,
      };

      if (!currentUserId) return;

      await behaviorAnalysisService.recordSearchBehavior(
        currentUserId,
        query,
        resultCount,
        filters
      );

      options.onSearchRecorded?.({
        query,
        timestamp: Date.now(),
        resultCount,
        filters,
      });
    },
    [currentUserId, options.onSearchRecorded]
  );

  /**
   * 记录搜索结果点击
   */
  const trackSearchResultClick = useCallback(
    async (
      resultType: string,
      resultId: string,
      resultTitle?: string,
      position?: number
    ) => {
      if (!currentUserId) return;

      const currentSearch = currentSearchRef.current;

      await behaviorAnalysisService.recordSearchBehavior(
        currentUserId,
        currentSearch?.query || '',
        currentSearch?.resultCount,
        currentSearch?.filters,
        {
          type: resultType,
          id: resultId,
          title: resultTitle,
          position,
        }
      );
    },
    [currentUserId]
  );

  /**
   * 记录搜索筛选
   */
  const trackSearchFilter = useCallback(
    async (filterType: string, filterValue: string | string[]) => {
      if (!currentUserId) return;

      const currentSearch = currentSearchRef.current;

      await behaviorAnalysisService.recordBehavior({
        userId: currentUserId,
        behaviorType: 'search_filter',
        targetType: 'search_query',
        targetId: `filter_${Date.now()}`,
        targetTitle: `${filterType}: ${Array.isArray(filterValue) ? filterValue.join(',') : filterValue}`,
        metadata: {
          query: currentSearch?.query,
          filterType,
          filterValue,
          filteredAt: new Date().toISOString(),
        },
      });
    },
    [currentUserId]
  );

  /**
   * 记录搜索建议点击
   */
  const trackSearchSuggestionClick = useCallback(
    async (suggestion: string, suggestionType: string) => {
      if (!currentUserId) return;

      await behaviorAnalysisService.recordBehavior({
        userId: currentUserId,
        behaviorType: 'search_click_result',
        targetType: 'search_query',
        targetId: `suggestion_${Date.now()}`,
        targetTitle: suggestion,
        metadata: {
          suggestion,
          suggestionType,
          isSuggestion: true,
          clickedAt: new Date().toISOString(),
        },
      });
    },
    [currentUserId]
  );

  /**
   * 清除当前搜索会话
   */
  const clearSearchSession = useCallback(() => {
    currentSearchRef.current = null;
  }, []);

  /**
   * 获取当前搜索信息
   */
  const getCurrentSearch = useCallback(() => {
    return currentSearchRef.current;
  }, []);

  return {
    trackSearch,
    trackSearchResultClick,
    trackSearchFilter,
    trackSearchSuggestionClick,
    clearSearchSession,
    getCurrentSearch,
    currentSearch: currentSearchRef.current,
    isLoggedIn: !!currentUserId,
  };
}

/**
 * 页面浏览追踪 Hook
 * 记录页面访问和停留时间
 */
export function usePageViewTracking() {
  const { user } = useContext(AuthContext);
  const currentUserId = user?.id;
  const pageStartTimeRef = useRef<number>(Date.now());
  const currentPageRef = useRef<string>('');

  /**
   * 记录页面浏览
   */
  const trackPageView = useCallback(
    async (pagePath: string, pageTitle?: string, referrer?: string, metadata?: Record<string, any>) => {
      if (!currentUserId) return;

      // 如果有上一个页面，记录停留时间
      if (currentPageRef.current && pageStartTimeRef.current) {
        const duration = Date.now() - pageStartTimeRef.current;
        await behaviorAnalysisService.recordPageView(
          currentUserId,
          currentPageRef.current,
          undefined,
          undefined,
          {
            duration,
            exitAt: new Date().toISOString(),
          }
        );
      }

      // 记录新页面
      currentPageRef.current = pagePath;
      pageStartTimeRef.current = Date.now();

      await behaviorAnalysisService.recordPageView(
        currentUserId,
        pagePath,
        pageTitle,
        referrer,
        {
          ...metadata,
          entryAt: new Date().toISOString(),
        }
      );
    },
    [currentUserId]
  );

  /**
   * 记录页面停留时间（在页面离开时调用）
   */
  const trackPageDuration = useCallback(async () => {
    if (!currentUserId || !currentPageRef.current || !pageStartTimeRef.current) return;

    const duration = Date.now() - pageStartTimeRef.current;

    await behaviorAnalysisService.recordBehavior({
      userId: currentUserId,
      behaviorType: 'page_view',
      targetType: 'page',
      targetId: currentPageRef.current,
      metadata: {
        duration,
        exitAt: new Date().toISOString(),
      },
    });
  }, [currentUserId]);

  /**
   * 记录内容滚动
   */
  const trackContentScroll = useCallback(
    async (scrollDepth: number, contentId?: string) => {
      if (!currentUserId) return;

      await behaviorAnalysisService.recordBehavior({
        userId: currentUserId,
        behaviorType: 'content_scroll',
        targetType: 'page',
        targetId: contentId || currentPageRef.current || 'unknown',
        metadata: {
          scrollDepth,
          scrolledAt: new Date().toISOString(),
        },
      });
    },
    [currentUserId]
  );

  /**
   * 记录内容点击
   */
  const trackContentClick = useCallback(
    async (
      contentType: 'post' | 'work' | 'user' | 'tag' | 'link' | 'button',
      contentId: string,
      contentTitle?: string,
      clickContext?: Record<string, any>
    ) => {
      if (!currentUserId) return;

      await behaviorAnalysisService.recordContentClick(
        currentUserId,
        contentType,
        contentId,
        contentTitle,
        {
          pagePath: currentPageRef.current,
          ...clickContext,
        }
      );
    },
    [currentUserId]
  );

  return {
    trackPageView,
    trackPageDuration,
    trackContentScroll,
    trackContentClick,
    currentPage: currentPageRef.current,
    isLoggedIn: !!currentUserId,
  };
}

export default useSearchBehaviorTracking;
