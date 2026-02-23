/**
 * AI生成内容保存服务
 * 用于保存所有AI生成的内容到数据库
 */

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// AI生成记录接口
export interface AIGenerationRecord {
  id?: string;
  userId: string;
  type: 'image' | 'video' | 'text';
  prompt: string;
  resultUrl: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
  source?: string; // 来源页面/组件
  sourceId?: string; // 关联ID（如活动ID）
  createdAt?: string; // 创建时间
}

// 保存选项
export interface SaveOptions {
  source?: string;
  sourceId?: string;
  metadata?: Record<string, any>;
}

class AIGenerationSaveService {
  private readonly TABLE_NAME = 'ai_generations';

  /**
   * 保存AI生成记录到数据库
   */
  async saveGeneration(record: AIGenerationRecord): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('[AIGenerationSave] User not logged in, skipping database save');
        // 未登录时只保存到本地
        this.saveToLocal(record);
        return { success: true };
      }

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert({
          user_id: user.id,
          type: record.type,
          prompt: record.prompt,
          result_url: record.resultUrl,
          thumbnail_url: record.thumbnailUrl || record.resultUrl,
          metadata: record.metadata || {},
          source: record.source || 'unknown',
          source_id: record.sourceId,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('[AIGenerationSave] Database save failed:', error);
        // 数据库保存失败时，保存到本地
        this.saveToLocal(record);
        return { success: false, error: error.message };
      }

      console.log('[AIGenerationSave] Saved to database:', data.id);
      return { success: true, id: data.id };
    } catch (error: any) {
      console.error('[AIGenerationSave] Error saving generation:', error);
      // 出错时保存到本地
      this.saveToLocal(record);
      return { success: false, error: error.message };
    }
  }

  /**
   * 批量保存AI生成记录
   */
  async saveBatch(records: AIGenerationRecord[]): Promise<{ success: boolean; savedCount: number; error?: string }> {
    let savedCount = 0;
    
    for (const record of records) {
      const result = await this.saveGeneration(record);
      if (result.success) {
        savedCount++;
      }
    }

    return { 
      success: savedCount === records.length, 
      savedCount,
      error: savedCount < records.length ? `部分保存失败: ${savedCount}/${records.length}` : undefined
    };
  }

  /**
   * 保存到本地存储（作为备份）
   */
  private saveToLocal(record: AIGenerationRecord): void {
    try {
      const key = 'ai_generation_records';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift({
        ...record,
        savedAt: new Date().toISOString(),
        synced: false
      });
      // 限制本地存储数量
      if (existing.length > 200) {
        existing.pop();
      }
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.error('[AIGenerationSave] Local save failed:', error);
    }
  }

  /**
   * 同步本地未同步的记录到数据库
   */
  async syncLocalRecords(): Promise<{ success: boolean; syncedCount: number }> {
    try {
      const key = 'ai_generation_records';
      const localRecords = JSON.parse(localStorage.getItem(key) || '[]');
      const unsynced = localRecords.filter((r: any) => !r.synced);

      if (unsynced.length === 0) {
        return { success: true, syncedCount: 0 };
      }

      let syncedCount = 0;
      for (const record of unsynced) {
        const result = await this.saveGeneration({
          userId: record.userId,
          type: record.type,
          prompt: record.prompt,
          resultUrl: record.resultUrl,
          thumbnailUrl: record.thumbnailUrl,
          metadata: record.metadata,
          source: record.source,
          sourceId: record.sourceId
        });

        if (result.success) {
          record.synced = true;
          syncedCount++;
        }
      }

      // 更新本地存储
      localStorage.setItem(key, JSON.stringify(localRecords));

      return { success: true, syncedCount };
    } catch (error) {
      console.error('[AIGenerationSave] Sync failed:', error);
      return { success: false, syncedCount: 0 };
    }
  }

  /**
   * 获取用户的AI生成历史
   */
  async getUserGenerations(userId: string, options?: { type?: 'image' | 'video' | 'text'; limit?: number }): Promise<AIGenerationRecord[]> {
    try {
      let query = supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options?.type) {
        query = query.eq('type', options.type);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[AIGenerationSave] Fetch failed:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        type: item.type,
        prompt: item.prompt,
        resultUrl: item.result_url,
        thumbnailUrl: item.thumbnail_url,
        metadata: item.metadata,
        source: item.source,
        sourceId: item.source_id,
        createdAt: item.created_at
      }));
    } catch (error) {
      console.error('[AIGenerationSave] Error fetching generations:', error);
      return [];
    }
  }

  /**
   * 删除生成记录
   */
  async deleteGeneration(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[AIGenerationSave] Delete failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[AIGenerationSave] Error deleting generation:', error);
      return false;
    }
  }

  /**
   * 便捷的保存方法 - 图片生成
   */
  async saveImageGeneration(
    prompt: string,
    imageUrl: string,
    options?: SaveOptions
  ): Promise<{ success: boolean; id?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    return this.saveGeneration({
      userId: user?.id || 'anonymous',
      type: 'image',
      prompt,
      resultUrl: imageUrl,
      thumbnailUrl: imageUrl,
      source: options?.source,
      sourceId: options?.sourceId,
      metadata: options?.metadata
    });
  }

  /**
   * 便捷的保存方法 - 视频生成
   */
  async saveVideoGeneration(
    prompt: string,
    videoUrl: string,
    thumbnailUrl?: string,
    options?: SaveOptions
  ): Promise<{ success: boolean; id?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    return this.saveGeneration({
      userId: user?.id || 'anonymous',
      type: 'video',
      prompt,
      resultUrl: videoUrl,
      thumbnailUrl: thumbnailUrl || videoUrl,
      source: options?.source,
      sourceId: options?.sourceId,
      metadata: options?.metadata
    });
  }
}

export const aiGenerationSaveService = new AIGenerationSaveService();
