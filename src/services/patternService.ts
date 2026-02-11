// 纹样服务 - 管理用户纹样收藏和自定义纹样
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { uploadImage } from './imageService';
import { TRADITIONAL_PATTERNS } from '@/constants/creativeData';

export interface UserPattern {
  id: string;
  user_id: string;
  pattern_id?: number;
  custom_pattern_url?: string;
  name?: string;
  category?: string;
  is_custom: boolean;
  created_at: string;
}

export interface CreatePatternInput {
  patternId?: number;
  customFile?: File;
  name?: string;
  category?: string;
}

export interface UpdatePatternInput {
  name?: string;
  category?: string;
}

class PatternService {
  private readonly tableName = 'user_patterns';

  // 获取所有传统纹样
  getTraditionalPatterns() {
    return TRADITIONAL_PATTERNS;
  }

  // 获取当前用户的所有纹样收藏
  async getUserPatterns(): Promise<{ data: UserPattern[] | null; error: Error | null }> {
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
      console.error('[PatternService] 获取纹样收藏失败:', error);
      return { data: null, error: error as Error };
    }
  }

  // 收藏传统纹样
  async addTraditionalPattern(patternId: number): Promise<{ data: UserPattern | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      // 查找纹样信息
      const pattern = TRADITIONAL_PATTERNS.find(p => p.id === patternId);
      if (!pattern) {
        throw new Error('纹样不存在');
      }

      // 检查是否已收藏
      const { data: existing } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', user.id)
        .eq('pattern_id', patternId)
        .single();

      if (existing) {
        throw new Error('该纹样已收藏');
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          user_id: user.id,
          pattern_id: patternId,
          name: pattern.name,
          category: '传统纹样',
          is_custom: false
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[PatternService] 添加纹样收藏失败:', error);
      return { data: null, error: error as Error };
    }
  }

  // 上传自定义纹样
  async addCustomPattern(file: File, name?: string, category?: string): Promise<{ data: UserPattern | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      // 上传文件
      const fileUrl = await uploadImage(file, 'custom-patterns');

      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          user_id: user.id,
          custom_pattern_url: fileUrl,
          name: name || file.name,
          category: category || '自定义',
          is_custom: true
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[PatternService] 上传自定义纹样失败:', error);
      return { data: null, error: error as Error };
    }
  }

  // 更新纹样信息
  async updatePattern(id: string, input: UpdatePatternInput): Promise<{ data: UserPattern | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          name: input.name,
          category: input.category
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[PatternService] 更新纹样失败:', error);
      return { data: null, error: error as Error };
    }
  }

  // 删除纹样收藏
  async deletePattern(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      // 获取纹样信息
      const { data: pattern } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (pattern && pattern.is_custom && pattern.custom_pattern_url) {
        // 删除存储中的文件
        const filePath = pattern.custom_pattern_url.split('/').pop();
        if (filePath) {
          await supabaseAdmin.storage
            .from('works')
            .remove([`custom-patterns/${filePath}`]);
        }
      }

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('[PatternService] 删除纹样失败:', error);
      return { success: false, error: error as Error };
    }
  }

  // 检查是否已收藏某个纹样
  async isPatternFavorited(patternId: number): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('user_id', user.id)
        .eq('pattern_id', patternId)
        .single();

      return !!data;
    } catch {
      return false;
    }
  }

  // 切换纹样收藏状态
  async togglePatternFavorite(patternId: number): Promise<{ isFavorited: boolean; error: Error | null }> {
    try {
      const isFavorited = await this.isPatternFavorited(patternId);
      
      if (isFavorited) {
        // 取消收藏
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('用户未登录');

        await supabase
          .from(this.tableName)
          .delete()
          .eq('user_id', user.id)
          .eq('pattern_id', patternId);
        
        return { isFavorited: false, error: null };
      } else {
        // 添加收藏
        const { error } = await this.addTraditionalPattern(patternId);
        return { isFavorited: !error, error };
      }
    } catch (error) {
      console.error('[PatternService] 切换收藏状态失败:', error);
      return { isFavorited: false, error: error as Error };
    }
  }

  // 按分类获取纹样
  async getPatternsByCategory(category: string): Promise<{ data: UserPattern[] | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', user.id)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[PatternService] 按分类获取纹样失败:', error);
      return { data: null, error: error as Error };
    }
  }
}

export const patternService = new PatternService();
export default patternService;
