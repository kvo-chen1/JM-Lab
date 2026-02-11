// 风格预设服务 - 管理用户风格预设
import { supabase } from '@/lib/supabase';

export interface UserStylePreset {
  id: string;
  user_id: string;
  name: string;
  styles: string[];
  blend_ratio?: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface CreateStylePresetInput {
  name: string;
  styles: string[];
  blendRatio?: Record<string, number>;
}

export interface UpdateStylePresetInput {
  name?: string;
  styles?: string[];
  blendRatio?: Record<string, number>;
}

class StylePresetService {
  private readonly tableName = 'user_style_presets';

  // 获取当前用户的所有风格预设
  async getUserStylePresets(): Promise<{ data: UserStylePreset[] | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[StylePresetService] 获取风格预设失败:', error);
      return { data: null, error: error as Error };
    }
  }

  // 创建新的风格预设
  async createStylePreset(input: CreateStylePresetInput): Promise<{ data: UserStylePreset | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          user_id: user.id,
          name: input.name,
          styles: input.styles,
          blend_ratio: input.blendRatio || {}
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[StylePresetService] 创建风格预设失败:', error);
      return { data: null, error: error as Error };
    }
  }

  // 更新风格预设
  async updateStylePreset(id: string, input: UpdateStylePresetInput): Promise<{ data: UserStylePreset | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.styles !== undefined) updateData.styles = input.styles;
      if (input.blendRatio !== undefined) updateData.blend_ratio = input.blendRatio;

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[StylePresetService] 更新风格预设失败:', error);
      return { data: null, error: error as Error };
    }
  }

  // 删除风格预设
  async deleteStylePreset(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('[StylePresetService] 删除风格预设失败:', error);
      return { success: false, error: error as Error };
    }
  }

  // 获取单个风格预设详情
  async getStylePresetById(id: string): Promise<{ data: UserStylePreset | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[StylePresetService] 获取风格预设详情失败:', error);
      return { data: null, error: error as Error };
    }
  }

  // 应用风格预设到当前设计
  async applyStylePreset(presetId: string): Promise<{ styles: string[]; blendRatio: Record<string, number>; error: Error | null }> {
    try {
      const { data, error } = await this.getStylePresetById(presetId);
      
      if (error) throw error;
      if (!data) throw new Error('风格预设不存在');

      return {
        styles: data.styles,
        blendRatio: data.blend_ratio || {},
        error: null
      };
    } catch (error) {
      console.error('[StylePresetService] 应用风格预设失败:', error);
      return { styles: [], blendRatio: {}, error: error as Error };
    }
  }

  // 复制风格预设
  async duplicateStylePreset(id: string, newName?: string): Promise<{ data: UserStylePreset | null; error: Error | null }> {
    try {
      const { data: preset } = await this.getStylePresetById(id);
      if (!preset) {
        throw new Error('风格预设不存在');
      }

      return await this.createStylePreset({
        name: newName || `${preset.name} (复制)`,
        styles: preset.styles,
        blendRatio: preset.blend_ratio
      });
    } catch (error) {
      console.error('[StylePresetService] 复制风格预设失败:', error);
      return { data: null, error: error as Error };
    }
  }
}

export const stylePresetService = new StylePresetService();
export default stylePresetService;
