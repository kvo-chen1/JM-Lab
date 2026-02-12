/**
 * 灵感脉络行为追踪Hook
 * 自动记录用户在灵感脉络中的创作行为
 */

import { useCallback, useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { behaviorAnalysisService, BehaviorType, TargetType } from '@/services/behaviorAnalysisService';
import { MindNode } from '@/components/InspirationMindMap/types';

export interface UseMindMapBehaviorTrackingOptions {
  mindMapId?: string;
  mindMapTitle?: string;
}

export function useMindMapBehaviorTracking(options: UseMindMapBehaviorTrackingOptions = {}) {
  const { user } = useContext(AuthContext);
  const userId = user?.id;

  /**
   * 记录脉络创建行为
   */
  const trackMindMapCreate = useCallback(
    async (mindMapId: string, title: string) => {
      if (!userId) return;

      await behaviorAnalysisService.recordBehavior({
        userId,
        behaviorType: 'mindmap_create',
        targetType: 'mindmap',
        targetId: mindMapId,
        targetTitle: title,
        metadata: {
          createdAt: new Date().toISOString(),
        },
      });
    },
    [userId]
  );

  /**
   * 记录脉络编辑行为
   */
  const trackMindMapEdit = useCallback(
    async (updates: Partial<{ title: string; layoutType: string; theme: string }>) => {
      if (!userId || !options.mindMapId) return;

      await behaviorAnalysisService.recordBehavior({
        userId,
        behaviorType: 'mindmap_edit',
        targetType: 'mindmap',
        targetId: options.mindMapId,
        targetTitle: options.mindMapTitle,
        metadata: {
          updates,
          editedAt: new Date().toISOString(),
        },
      });
    },
    [userId, options.mindMapId, options.mindMapTitle]
  );

  /**
   * 记录脉络删除行为
   */
  const trackMindMapDelete = useCallback(
    async (mindMapId: string, title: string) => {
      if (!userId) return;

      await behaviorAnalysisService.recordBehavior({
        userId,
        behaviorType: 'mindmap_delete',
        targetType: 'mindmap',
        targetId: mindMapId,
        targetTitle: title,
        metadata: {
          deletedAt: new Date().toISOString(),
        },
      });
    },
    [userId]
  );

  /**
   * 记录节点创建行为
   */
  const trackNodeCreate = useCallback(
    async (nodeId: string, node: Partial<MindNode>) => {
      if (!userId || !options.mindMapId) return;

      await behaviorAnalysisService.recordBehavior({
        userId,
        behaviorType: 'node_create',
        targetType: 'node',
        targetId: nodeId,
        targetTitle: node.title,
        metadata: {
          mapId: options.mindMapId,
          category: node.category,
          hasDescription: !!node.description,
          hasTags: !!node.tags && node.tags.length > 0,
          createdAt: new Date().toISOString(),
        },
      });
    },
    [userId, options.mindMapId]
  );

  /**
   * 记录节点编辑行为
   */
  const trackNodeEdit = useCallback(
    async (nodeId: string, nodeTitle: string, updates: Partial<MindNode>) => {
      if (!userId || !options.mindMapId) return;

      await behaviorAnalysisService.recordBehavior({
        userId,
        behaviorType: 'node_edit',
        targetType: 'node',
        targetId: nodeId,
        targetTitle: nodeTitle,
        metadata: {
          mapId: options.mindMapId,
          category: updates.category,
          editedAt: new Date().toISOString(),
        },
      });
    },
    [userId, options.mindMapId]
  );

  /**
   * 记录节点删除行为
   */
  const trackNodeDelete = useCallback(
    async (nodeId: string, nodeTitle: string, category?: string) => {
      if (!userId || !options.mindMapId) return;

      await behaviorAnalysisService.recordBehavior({
        userId,
        behaviorType: 'node_delete',
        targetType: 'node',
        targetId: nodeId,
        targetTitle: nodeTitle,
        metadata: {
          mapId: options.mindMapId,
          category,
          deletedAt: new Date().toISOString(),
        },
      });
    },
    [userId, options.mindMapId]
  );

  /**
   * 记录AI建议请求行为
   */
  const trackAISuggestionRequest = useCallback(
    async (nodeId: string, nodeTitle: string, suggestionType: string) => {
      if (!userId || !options.mindMapId) return;

      await behaviorAnalysisService.recordBehavior({
        userId,
        behaviorType: 'ai_suggestion_request',
        targetType: 'node',
        targetId: nodeId,
        targetTitle: nodeTitle,
        metadata: {
          mapId: options.mindMapId,
          suggestionType,
          requestedAt: new Date().toISOString(),
        },
      });
    },
    [userId, options.mindMapId]
  );

  /**
   * 记录AI建议应用行为
   */
  const trackAISuggestionApply = useCallback(
    async (nodeId: string, nodeTitle: string, suggestionType: string) => {
      if (!userId || !options.mindMapId) return;

      await behaviorAnalysisService.recordBehavior({
        userId,
        behaviorType: 'ai_suggestion_apply',
        targetType: 'node',
        targetId: nodeId,
        targetTitle: nodeTitle,
        metadata: {
          mapId: options.mindMapId,
          suggestionType,
          appliedAt: new Date().toISOString(),
        },
      });
    },
    [userId, options.mindMapId]
  );

  /**
   * 记录故事生成行为
   */
  const trackStoryGenerate = useCallback(
    async (storyId?: string, storyTitle?: string) => {
      if (!userId || !options.mindMapId) return;

      await behaviorAnalysisService.recordBehavior({
        userId,
        behaviorType: 'story_generate',
        targetType: 'story',
        targetId: storyId,
        targetTitle: storyTitle,
        metadata: {
          mapId: options.mindMapId,
          generatedAt: new Date().toISOString(),
        },
      });
    },
    [userId, options.mindMapId]
  );

  /**
   * 记录使用天津老字号元素行为
   */
  const trackBrandInspirationUse = useCallback(
    async (brandId: string, brandName: string, elementName: string) => {
      if (!userId || !options.mindMapId) return;

      await behaviorAnalysisService.recordBehavior({
        userId,
        behaviorType: 'brand_inspiration_use',
        targetType: 'brand',
        targetId: brandId,
        targetTitle: brandName,
        metadata: {
          mapId: options.mindMapId,
          brandId,
          brandName,
          elementName,
          usedAt: new Date().toISOString(),
        },
      });
    },
    [userId, options.mindMapId]
  );

  /**
   * 记录布局切换行为
   */
  const trackLayoutChange = useCallback(
    async (fromLayout: string, toLayout: string) => {
      if (!userId || !options.mindMapId) return;

      await behaviorAnalysisService.recordBehavior({
        userId,
        behaviorType: 'layout_change',
        targetType: 'mindmap',
        targetId: options.mindMapId,
        targetTitle: options.mindMapTitle,
        metadata: {
          fromLayout,
          toLayout,
          changedAt: new Date().toISOString(),
        },
      });
    },
    [userId, options.mindMapId, options.mindMapTitle]
  );

  /**
   * 记录主题切换行为
   */
  const trackThemeChange = useCallback(
    async (fromTheme: string, toTheme: string) => {
      if (!userId || !options.mindMapId) return;

      await behaviorAnalysisService.recordBehavior({
        userId,
        behaviorType: 'theme_change',
        targetType: 'mindmap',
        targetId: options.mindMapId,
        targetTitle: options.mindMapTitle,
        metadata: {
          fromTheme,
          toTheme,
          changedAt: new Date().toISOString(),
        },
      });
    },
    [userId, options.mindMapId, options.mindMapTitle]
  );

  /**
   * 记录导出行为
   */
  const trackExport = useCallback(
    async (format: string, nodeCount: number) => {
      if (!userId || !options.mindMapId) return;

      await behaviorAnalysisService.recordBehavior({
        userId,
        behaviorType: 'export',
        targetType: 'mindmap',
        targetId: options.mindMapId,
        targetTitle: options.mindMapTitle,
        metadata: {
          format,
          nodeCount,
          exportedAt: new Date().toISOString(),
        },
      });
    },
    [userId, options.mindMapId, options.mindMapTitle]
  );

  /**
   * 记录导入行为
   */
  const trackImport = useCallback(
    async (format: string, nodeCount: number) => {
      if (!userId) return;

      await behaviorAnalysisService.recordBehavior({
        userId,
        behaviorType: 'import',
        targetType: 'mindmap',
        metadata: {
          format,
          nodeCount,
          importedAt: new Date().toISOString(),
        },
      });
    },
    [userId]
  );

  /**
   * 批量记录行为
   */
  const trackBehaviors = useCallback(
    async (
      behaviors: Array<{
        type: BehaviorType;
        targetType?: TargetType;
        targetId?: string;
        targetTitle?: string;
        metadata?: Record<string, any>;
      }>
    ) => {
      if (!userId) return;

      const records = behaviors.map((b) => ({
        userId,
        behaviorType: b.type,
        targetType: b.targetType,
        targetId: b.targetId,
        targetTitle: b.targetTitle,
        metadata: {
          ...b.metadata,
          mapId: options.mindMapId,
          recordedAt: new Date().toISOString(),
        },
      }));

      await behaviorAnalysisService.recordBehaviors(records);
    },
    [userId, options.mindMapId]
  );

  return {
    // 脉络行为
    trackMindMapCreate,
    trackMindMapEdit,
    trackMindMapDelete,

    // 节点行为
    trackNodeCreate,
    trackNodeEdit,
    trackNodeDelete,

    // AI行为
    trackAISuggestionRequest,
    trackAISuggestionApply,

    // 故事行为
    trackStoryGenerate,

    // 文化元素行为
    trackBrandInspirationUse,

    // 设置行为
    trackLayoutChange,
    trackThemeChange,

    // 导入导出行为
    trackExport,
    trackImport,

    // 批量记录
    trackBehaviors,

    // 是否已登录
    isLoggedIn: !!userId,
  };
}

export default useMindMapBehaviorTracking;
