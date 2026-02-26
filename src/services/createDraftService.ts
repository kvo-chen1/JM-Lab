/**
 * 创作中心草稿箱服务 - 保存草稿到 Supabase 数据库
 */

import { supabase } from '@/lib/supabase';

// 草稿类型
export interface CreateDraft {
  id: string;
  userId: string;
  name: string;
  description?: string;
  prompt?: string;
  selectedResult?: number | null;
  generatedResults: any[];
  activeTool: string;
  stylePreset?: string;
  currentStep: number;
  aiExplanation?: string;
  selectedPatternId?: string | null;
  patternOpacity?: number;
  patternScale?: number;
  patternRotation?: number;
  patternBlendMode?: string;
  patternTileMode?: string;
  patternPositionX?: number;
  patternPositionY?: number;
  tilePatternId?: string | null;
  tileMode?: string;
  tileSize?: number;
  tileSpacing?: number;
  tileRotation?: number;
  tileOpacity?: number;
  mockupSelectedTemplateId?: string | null;
  mockupShowWireframe?: boolean;
  traceSelectedKnowledgeId?: string | null;
  culturalInfoText?: string;
  createdAt: number;
  updatedAt: number;
  isSynced?: boolean;
}

class CreateDraftService {
  private readonly TABLE_NAME = 'create_drafts';

  /**
   * 获取当前登录用户
   */
  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  /**
   * 获取用户的所有草稿
   */
  async getUserDrafts(limit: number = 10): Promise<CreateDraft[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[CreateDraft] User not logged in, returning empty drafts');
        return [];
      }

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[CreateDraft] Failed to get drafts:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        name: item.name,
        description: item.description,
        prompt: item.prompt,
        selectedResult: item.selected_result,
        generatedResults: item.generated_results || [],
        activeTool: item.active_tool,
        stylePreset: item.style_preset,
        currentStep: item.current_step,
        aiExplanation: item.ai_explanation,
        selectedPatternId: item.selected_pattern_id,
        patternOpacity: item.pattern_opacity,
        patternScale: item.pattern_scale,
        patternRotation: item.pattern_rotation,
        patternBlendMode: item.pattern_blend_mode,
        patternTileMode: item.pattern_tile_mode,
        patternPositionX: item.pattern_position_x,
        patternPositionY: item.pattern_position_y,
        tilePatternId: item.tile_pattern_id,
        tileMode: item.tile_mode,
        tileSize: item.tile_size,
        tileSpacing: item.tile_spacing,
        tileRotation: item.tile_rotation,
        tileOpacity: item.tile_opacity,
        mockupSelectedTemplateId: item.mockup_selected_template_id,
        mockupShowWireframe: item.mockup_show_wireframe,
        traceSelectedKnowledgeId: item.trace_selected_knowledge_id,
        culturalInfoText: item.cultural_info_text,
        createdAt: new Date(item.created_at).getTime(),
        updatedAt: new Date(item.updated_at).getTime(),
        isSynced: true
      }));
    } catch (error) {
      console.error('[CreateDraft] Error getting drafts:', error);
      return [];
    }
  }

  /**
   * 保存草稿
   */
  async saveDraft(draft: Omit<CreateDraft, 'userId' | 'createdAt' | 'updatedAt' | 'isSynced'>): Promise<CreateDraft | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[CreateDraft] User not logged in, skipping draft save');
        return null;
      }

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .upsert({
          id: draft.id,
          user_id: user.id,
          name: draft.name,
          description: draft.description,
          prompt: draft.prompt,
          selected_result: draft.selectedResult,
          generated_results: draft.generatedResults,
          active_tool: draft.activeTool,
          style_preset: draft.stylePreset,
          current_step: draft.currentStep,
          ai_explanation: draft.aiExplanation,
          selected_pattern_id: draft.selectedPatternId,
          pattern_opacity: draft.patternOpacity,
          pattern_scale: draft.patternScale,
          pattern_rotation: draft.patternRotation,
          pattern_blend_mode: draft.patternBlendMode,
          pattern_tile_mode: draft.patternTileMode,
          pattern_position_x: draft.patternPositionX,
          pattern_position_y: draft.patternPositionY,
          tile_pattern_id: draft.tilePatternId,
          tile_mode: draft.tileMode,
          tile_size: draft.tileSize,
          tile_spacing: draft.tileSpacing,
          tile_rotation: draft.tileRotation,
          tile_opacity: draft.tileOpacity,
          mockup_selected_template_id: draft.mockupSelectedTemplateId,
          mockup_show_wireframe: draft.mockupShowWireframe,
          trace_selected_knowledge_id: draft.traceSelectedKnowledgeId,
          cultural_info_text: draft.culturalInfoText,
          created_at: new Date(draft.createdAt).toISOString(),
          updated_at: now
        })
        .select()
        .single();

      if (error) {
        console.error('[CreateDraft] Failed to save draft:', error);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description,
        prompt: data.prompt,
        selectedResult: data.selected_result,
        generatedResults: data.generated_results || [],
        activeTool: data.active_tool,
        stylePreset: data.style_preset,
        currentStep: data.current_step,
        aiExplanation: data.ai_explanation,
        selectedPatternId: data.selected_pattern_id,
        patternOpacity: data.pattern_opacity,
        patternScale: data.pattern_scale,
        patternRotation: data.pattern_rotation,
        patternBlendMode: data.pattern_blend_mode,
        patternTileMode: data.pattern_tile_mode,
        patternPositionX: data.pattern_position_x,
        patternPositionY: data.pattern_position_y,
        tilePatternId: data.tile_pattern_id,
        tileMode: data.tile_mode,
        tileSize: data.tile_size,
        tileSpacing: data.tile_spacing,
        tileRotation: data.tile_rotation,
        tileOpacity: data.tile_opacity,
        mockupSelectedTemplateId: data.mockup_selected_template_id,
        mockupShowWireframe: data.mockup_show_wireframe,
        traceSelectedKnowledgeId: data.trace_selected_knowledge_id,
        culturalInfoText: data.cultural_info_text,
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: new Date(data.updated_at).getTime(),
        isSynced: true
      };
    } catch (error) {
      console.error('[CreateDraft] Error saving draft:', error);
      return null;
    }
  }

  /**
   * 删除草稿
   */
  async deleteDraft(draftId: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[CreateDraft] User not logged in, cannot delete draft');
        return false;
      }

      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', draftId)
        .eq('user_id', user.id);

      if (error) {
        console.error('[CreateDraft] Failed to delete draft:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[CreateDraft] Error deleting draft:', error);
      return false;
    }
  }

  /**
   * 获取单个草稿
   */
  async getDraft(draftId: string): Promise<CreateDraft | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[CreateDraft] User not logged in, cannot get draft');
        return null;
      }

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('id', draftId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('[CreateDraft] Failed to get draft:', error);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description,
        prompt: data.prompt,
        selectedResult: data.selected_result,
        generatedResults: data.generated_results || [],
        activeTool: data.active_tool,
        stylePreset: data.style_preset,
        currentStep: data.current_step,
        aiExplanation: data.ai_explanation,
        selectedPatternId: data.selected_pattern_id,
        patternOpacity: data.pattern_opacity,
        patternScale: data.pattern_scale,
        patternRotation: data.pattern_rotation,
        patternBlendMode: data.pattern_blend_mode,
        patternTileMode: data.pattern_tile_mode,
        patternPositionX: data.pattern_position_x,
        patternPositionY: data.pattern_position_y,
        tilePatternId: data.tile_pattern_id,
        tileMode: data.tile_mode,
        tileSize: data.tile_size,
        tileSpacing: data.tile_spacing,
        tileRotation: data.tile_rotation,
        tileOpacity: data.tile_opacity,
        mockupSelectedTemplateId: data.mockup_selected_template_id,
        mockupShowWireframe: data.mockup_show_wireframe,
        traceSelectedKnowledgeId: data.trace_selected_knowledge_id,
        culturalInfoText: data.cultural_info_text,
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: new Date(data.updated_at).getTime(),
        isSynced: true
      };
    } catch (error) {
      console.error('[CreateDraft] Error getting draft:', error);
      return null;
    }
  }

  /**
   * 同步本地草稿到云端
   */
  async syncLocalDraftsToCloud(localDrafts: CreateDraft[]): Promise<number> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('[CreateDraft] User not logged in, skipping sync');
        return 0;
      }

      let syncedCount = 0;
      for (const draft of localDrafts) {
        // 检查是否已经是云端草稿（通过 ID 格式判断）
        if (!draft.id.startsWith('draft-')) {
          continue; // 跳过已经同步的草稿
        }

        const result = await this.saveDraft({
          ...draft,
          id: `cloud-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });
        if (result) {
          syncedCount++;
        }
      }

      console.log('[CreateDraft] Synced local drafts to cloud:', syncedCount);
      return syncedCount;
    } catch (error) {
      console.error('[CreateDraft] Error syncing to cloud:', error);
      return 0;
    }
  }
}

export const createDraftService = new CreateDraftService();
export default createDraftService;
