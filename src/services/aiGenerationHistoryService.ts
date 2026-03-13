import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  AIGenerationHistoryItem,
  AIGenerationHistoryFilter,
  AIGenerationHistorySort,
  AIGenerationHistoryPagination,
  AIGenerationHistoryListResponse,
  AIGenerationHistoryCreateParams,
  AIGenerationHistoryUpdateParams,
  AIGenerationHistoryBatchOperation,
  AIGenerationHistoryExportOptions,
  AIGenerationType,
  AIGenerationStatus,
} from '@/types/aiGenerationHistory';

const TABLE_NAME = 'ai_generation_history';

class AIGenerationHistoryService {
  private listeners: Array<(items: AIGenerationHistoryItem[]) => void> = [];
  private localCacheKey = 'ai_generation_history_cache';

  async create(params: AIGenerationHistoryCreateParams): Promise<{ success: boolean; data?: AIGenerationHistoryItem; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: '用户未登录' };
      }

      const now = new Date().toISOString();
      const insertData = {
        user_id: user.id,
        type: params.type,
        prompt: params.prompt,
        negative_prompt: params.negativePrompt || null,
        result_url: params.resultUrl || null,
        thumbnail_url: params.thumbnailUrl || params.resultUrl || null,
        status: params.status || 'completed',
        metadata: params.metadata || {},
        source: params.source || 'unknown',
        source_id: params.sourceId || null,
        is_favorite: false,
        tags: params.tags || [],
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[AIGenerationHistory] Create failed:', error);
        return { success: false, error: error.message };
      }

      const item = this.transformItem(data);
      this.notifyListeners();
      
      return { success: true, data: item };
    } catch (error: any) {
      console.error('[AIGenerationHistory] Create error:', error);
      return { success: false, error: error.message };
    }
  }

  async getById(id: string): Promise<AIGenerationHistoryItem | null> {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[AIGenerationHistory] Get by id failed:', error);
        return null;
      }

      return this.transformItem(data);
    } catch (error) {
      console.error('[AIGenerationHistory] Get by id error:', error);
      return null;
    }
  }

  async getList(
    filter: AIGenerationHistoryFilter = {},
    sort: AIGenerationHistorySort = { field: 'createdAt', order: 'desc' },
    pagination: AIGenerationHistoryPagination = { page: 1, pageSize: 20 }
  ): Promise<AIGenerationHistoryListResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          items: [],
          pagination: { ...pagination, total: 0, totalPages: 0 },
        };
      }

      let query = supabase
        .from(TABLE_NAME)
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      if (filter.type) {
        query = query.eq('type', filter.type);
      }

      if (filter.status) {
        query = query.eq('status', filter.status);
      }

      if (filter.isFavorite !== undefined) {
        query = query.eq('is_favorite', filter.isFavorite);
      }

      if (filter.startDate) {
        query = query.gte('created_at', filter.startDate.toISOString());
      }

      if (filter.endDate) {
        query = query.lte('created_at', filter.endDate.toISOString());
      }

      if (filter.keyword) {
        query = query.ilike('prompt', `%${filter.keyword}%`);
      }

      if (filter.tags && filter.tags.length > 0) {
        query = query.contains('tags', filter.tags);
      }

      const sortField = sort.field === 'createdAt' ? 'created_at' : 
                        sort.field === 'updatedAt' ? 'updated_at' : sort.field;
      query = query.order(sortField, { ascending: sort.order === 'asc' });

      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('[AIGenerationHistory] Get list failed:', error);
        return {
          items: [],
          pagination: { ...pagination, total: 0, totalPages: 0 },
        };
      }

      const items = (data || []).map(item => this.transformItem(item));
      const total = count || 0;
      const totalPages = Math.ceil(total / pagination.pageSize);

      return {
        items,
        pagination: { ...pagination, total, totalPages },
      };
    } catch (error) {
      console.error('[AIGenerationHistory] Get list error:', error);
      return {
        items: [],
        pagination: { ...pagination, total: 0, totalPages: 0 },
      };
    }
  }

  async update(id: string, params: AIGenerationHistoryUpdateParams): Promise<{ success: boolean; data?: AIGenerationHistoryItem; error?: string }> {
    try {
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (params.prompt !== undefined) updateData.prompt = params.prompt;
      if (params.negativePrompt !== undefined) updateData.negative_prompt = params.negativePrompt;
      if (params.resultUrl !== undefined) updateData.result_url = params.resultUrl;
      if (params.thumbnailUrl !== undefined) updateData.thumbnail_url = params.thumbnailUrl;
      if (params.status !== undefined) updateData.status = params.status;
      if (params.metadata !== undefined) updateData.metadata = params.metadata;
      if (params.isFavorite !== undefined) updateData.is_favorite = params.isFavorite;
      if (params.tags !== undefined) updateData.tags = params.tags;

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[AIGenerationHistory] Update failed:', error);
        return { success: false, error: error.message };
      }

      const item = this.transformItem(data);
      this.notifyListeners();
      
      return { success: true, data: item };
    } catch (error: any) {
      console.error('[AIGenerationHistory] Update error:', error);
      return { success: false, error: error.message };
    }
  }

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[AIGenerationHistory] Delete failed:', error);
        return { success: false, error: error.message };
      }

      this.notifyListeners();
      return { success: true };
    } catch (error: any) {
      console.error('[AIGenerationHistory] Delete error:', error);
      return { success: false, error: error.message };
    }
  }

  async batchOperation(operation: AIGenerationHistoryBatchOperation): Promise<{ success: boolean; affectedCount?: number; error?: string }> {
    try {
      const { ids, operation: op, tags } = operation;

      if (!ids || ids.length === 0) {
        return { success: false, error: '请选择要操作的记录' };
      }

      let affectedCount = 0;

      switch (op) {
        case 'delete': {
          const { error, count } = await supabase
            .from(TABLE_NAME)
            .delete()
            .in('id', ids);
          
          if (error) throw error;
          affectedCount = count || ids.length;
          toast.success(`已删除 ${affectedCount} 条记录`);
          break;
        }

        case 'favorite': {
          const { error, count } = await supabase
            .from(TABLE_NAME)
            .update({ is_favorite: true, updated_at: new Date().toISOString() })
            .in('id', ids);
          
          if (error) throw error;
          affectedCount = count || ids.length;
          toast.success(`已收藏 ${affectedCount} 条记录`);
          break;
        }

        case 'unfavorite': {
          const { error, count } = await supabase
            .from(TABLE_NAME)
            .update({ is_favorite: false, updated_at: new Date().toISOString() })
            .in('id', ids);
          
          if (error) throw error;
          affectedCount = count || ids.length;
          toast.success(`已取消收藏 ${affectedCount} 条记录`);
          break;
        }

        case 'addTags': {
          if (!tags || tags.length === 0) {
            return { success: false, error: '请提供要添加的标签' };
          }

          for (const id of ids) {
            const { data } = await supabase
              .from(TABLE_NAME)
              .select('tags')
              .eq('id', id)
              .single();
            
            const existingTags = data?.tags || [];
            const newTags = [...new Set([...existingTags, ...tags])];
            
            await supabase
              .from(TABLE_NAME)
              .update({ tags: newTags, updated_at: new Date().toISOString() })
              .eq('id', id);
            
            affectedCount++;
          }
          toast.success(`已为 ${affectedCount} 条记录添加标签`);
          break;
        }

        case 'removeTags': {
          if (!tags || tags.length === 0) {
            return { success: false, error: '请提供要移除的标签' };
          }

          for (const id of ids) {
            const { data } = await supabase
              .from(TABLE_NAME)
              .select('tags')
              .eq('id', id)
              .single();
            
            const existingTags = data?.tags || [];
            const newTags = existingTags.filter((t: string) => !tags.includes(t));
            
            await supabase
              .from(TABLE_NAME)
              .update({ tags: newTags, updated_at: new Date().toISOString() })
              .eq('id', id);
            
            affectedCount++;
          }
          toast.success(`已为 ${affectedCount} 条记录移除标签`);
          break;
        }
      }

      this.notifyListeners();
      return { success: true, affectedCount };
    } catch (error: any) {
      console.error('[AIGenerationHistory] Batch operation error:', error);
      return { success: false, error: error.message };
    }
  }

  async toggleFavorite(id: string): Promise<{ success: boolean; isFavorite?: boolean; error?: string }> {
    try {
      const { data: item } = await supabase
        .from(TABLE_NAME)
        .select('is_favorite')
        .eq('id', id)
        .single();

      if (!item) {
        return { success: false, error: '记录不存在' };
      }

      const newFavoriteStatus = !item.is_favorite;

      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ 
          is_favorite: newFavoriteStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) {
        console.error('[AIGenerationHistory] Toggle favorite failed:', error);
        return { success: false, error: error.message };
      }

      this.notifyListeners();
      return { success: true, isFavorite: newFavoriteStatus };
    } catch (error: any) {
      console.error('[AIGenerationHistory] Toggle favorite error:', error);
      return { success: false, error: error.message };
    }
  }

  async exportHistory(options: AIGenerationHistoryExportOptions): Promise<{ success: boolean; data?: string; filename?: string; error?: string }> {
    try {
      let items: AIGenerationHistoryItem[] = [];

      if (options.ids && options.ids.length > 0) {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select('*')
          .in('id', options.ids);

        if (error) throw error;
        items = (data || []).map(item => this.transformItem(item));
      } else {
        const result = await this.getList({}, { field: 'createdAt', order: 'desc' }, { page: 1, pageSize: 1000 });
        items = result.items;
      }

      if (items.length === 0) {
        return { success: false, error: '没有可导出的记录' };
      }

      let exportData: string;
      let filename: string;
      const timestamp = new Date().toISOString().split('T')[0];

      if (options.format === 'json') {
        const exportItems = options.includeMetadata ? items : items.map(item => ({
          id: item.id,
          type: item.type,
          prompt: item.prompt,
          resultUrl: item.resultUrl,
          isFavorite: item.isFavorite,
          tags: item.tags,
          createdAt: item.createdAt,
        }));
        exportData = JSON.stringify(exportItems, null, 2);
        filename = `ai-generation-history-${timestamp}.json`;
      } else {
        const headers = ['ID', '类型', '提示词', '结果URL', '收藏', '标签', '创建时间'];
        const rows = items.map(item => [
          item.id,
          item.type,
          `"${item.prompt.replace(/"/g, '""')}"`,
          item.resultUrl || '',
          item.isFavorite ? '是' : '否',
          item.tags.join(';'),
          item.createdAt,
        ]);
        exportData = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        filename = `ai-generation-history-${timestamp}.csv`;
      }

      return { success: true, data: exportData, filename };
    } catch (error: any) {
      console.error('[AIGenerationHistory] Export error:', error);
      return { success: false, error: error.message };
    }
  }

  async getStats(): Promise<{
    total: number;
    byType: Record<AIGenerationType, number>;
    byStatus: Record<AIGenerationStatus, number>;
    favorites: number;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          total: 0,
          byType: { image: 0, video: 0, text: 0 },
          byStatus: { pending: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 },
          favorites: 0,
        };
      }

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('type, status, is_favorite')
        .eq('user_id', user.id);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        byType: { image: 0, video: 0, text: 0 } as Record<AIGenerationType, number>,
        byStatus: { pending: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 } as Record<AIGenerationStatus, number>,
        favorites: 0,
      };

      data?.forEach(item => {
        stats.byType[item.type as AIGenerationType]++;
        stats.byStatus[item.status as AIGenerationStatus]++;
        if (item.is_favorite) stats.favorites++;
      });

      return stats;
    } catch (error) {
      console.error('[AIGenerationHistory] Get stats error:', error);
      return {
        total: 0,
        byType: { image: 0, video: 0, text: 0 },
        byStatus: { pending: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 },
        favorites: 0,
      };
    }
  }

  async getTags(): Promise<string[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return [];

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('tags')
        .eq('user_id', user.id);

      if (error) throw error;

      const allTags = new Set<string>();
      data?.forEach(item => {
        (item.tags || []).forEach((tag: string) => allTags.add(tag));
      });

      return Array.from(allTags).sort();
    } catch (error) {
      console.error('[AIGenerationHistory] Get tags error:', error);
      return [];
    }
  }

  subscribe(listener: (items: AIGenerationHistoryItem[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.getList().then(result => {
      this.listeners.forEach(listener => listener(result.items));
    });
  }

  private transformItem(data: any): AIGenerationHistoryItem {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      status: data.status,
      prompt: data.prompt,
      negativePrompt: data.negative_prompt,
      resultUrl: data.result_url,
      thumbnailUrl: data.thumbnail_url,
      metadata: data.metadata || {},
      source: data.source,
      sourceId: data.source_id,
      isFavorite: data.is_favorite || false,
      tags: data.tags || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export const aiGenerationHistoryService = new AIGenerationHistoryService();
