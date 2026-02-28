/**
 * 首页推荐位管理服务
 * 用于管理首页推荐内容的配置、排序和预览
 */

import { supabaseAdmin } from '@/lib/supabaseClient';
import { toast } from 'sonner';

// 推荐项数据类型
export interface HomeRecommendationItem {
  id?: string;
  item_id: string;
  item_type: 'work' | 'event' | 'template' | 'challenge';
  title: string;
  description?: string;
  thumbnail?: string;
  order_index: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  click_count?: number;
  impression_count?: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  // 额外元数据
  metadata?: Record<string, any>;
}

// 操作日志类型
export interface RecommendationOperationLog {
  id?: string;
  operation_type: 'create' | 'update' | 'delete' | 'reorder' | 'activate' | 'deactivate';
  item_id: string;
  previous_value?: any;
  new_value?: any;
  operated_by: string;
  operated_at?: string;
  notes?: string;
}

// 撤销/恢复操作记录
export interface UndoRedoAction {
  id: string;
  type: 'undo' | 'redo';
  operation: RecommendationOperationLog;
  timestamp: string;
}

// 查询参数
export interface RecommendationQueryParams {
  page?: number;
  limit?: number;
  item_type?: string;
  is_active?: boolean;
  search?: string;
  order_by?: 'order_index' | 'created_at' | 'click_count';
  order_direction?: 'asc' | 'desc';
}

// 安全的 localStorage 操作
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // 忽略错误
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // 忽略错误
    }
  },
};

class HomeRecommendationService {
  private readonly tableName = 'home_recommendations';
  private readonly logTableName = 'recommendation_operation_logs';

  /**
   * 获取推荐列表
   */
  async getRecommendations(params: RecommendationQueryParams = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        item_type,
        is_active,
        search,
        order_by = 'order_index',
        order_direction = 'asc',
      } = params;

      let query = supabaseAdmin
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .order(order_by, { ascending: order_direction === 'asc' });

      // 筛选条件
      if (item_type) {
        query = query.eq('item_type', item_type);
      }

      if (is_active !== undefined) {
        query = query.eq('is_active', is_active);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // 分页
      const from = (page - 1) * limit;
      const to = page * limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        items: data || [],
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      console.error('获取推荐列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有激活的推荐项（按顺序）
   */
  async getActiveRecommendations() {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('获取激活推荐项失败:', error);
      throw error;
    }
  }

  /**
   * 创建推荐项
   */
  async createRecommendation(
    item: Omit<HomeRecommendationItem, 'id' | 'created_at' | 'updated_at'>,
    userId: string
  ) {
    try {
      // 检查是否已存在相同的 item_id
      const { data: existing } = await supabaseAdmin
        .from(this.tableName)
        .select('id')
        .eq('item_id', item.item_id)
        .eq('item_type', item.item_type)
        .single();

      if (existing) {
        throw new Error('该推荐项已存在');
      }

      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .insert([
          {
            ...item,
            created_by: userId,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // 记录操作日志
      await this.logOperation(
        {
          operation_type: 'create',
          item_id: data.item_id,
          new_value: data,
          operated_by: userId,
          notes: `创建推荐项：${data.title}`,
        },
        userId
      );

      toast.success('创建推荐项成功');
      return data;
    } catch (error) {
      console.error('创建推荐项失败:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('创建推荐项失败');
      }
      throw error;
    }
  }

  /**
   * 更新推荐项
   */
  async updateRecommendation(
    id: string,
    updates: Partial<HomeRecommendationItem>,
    userId: string
  ) {
    try {
      // 获取原始数据
      const { data: original } = await supabaseAdmin
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (!original) {
        throw new Error('推荐项不存在');
      }

      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // 记录操作日志
      await this.logOperation(
        {
          operation_type: 'update',
          item_id: id,
          previous_value: original,
          new_value: data,
          operated_by: userId,
          notes: `更新推荐项：${data.title}`,
        },
        userId
      );

      toast.success('更新推荐项成功');
      return data;
    } catch (error) {
      console.error('更新推荐项失败:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('更新推荐项失败');
      }
      throw error;
    }
  }

  /**
   * 删除推荐项
   */
  async deleteRecommendation(id: string, userId: string) {
    try {
      // 获取原始数据
      const { data: original } = await supabaseAdmin
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (!original) {
        throw new Error('推荐项不存在');
      }

      const { error } = await supabaseAdmin
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      // 记录操作日志
      await this.logOperation(
        {
          operation_type: 'delete',
          item_id: id,
          previous_value: original,
          operated_by: userId,
          notes: `删除推荐项：${original.title}`,
        },
        userId
      );

      toast.success('删除推荐项成功');
      return true;
    } catch (error) {
      console.error('删除推荐项失败:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('删除推荐项失败');
      }
      throw error;
    }
  }

  /**
   * 批量更新推荐项顺序（拖拽排序）
   */
  async reorderRecommendations(
    items: { id: string; order_index: number }[],
    userId: string
  ) {
    try {
      // 使用事务更新所有项目的顺序
      const updates = items.map((item) => ({
        id: item.id,
        updates: { order_index: item.order_index },
      }));

      // 批量更新
      for (const { id, updates: orderUpdate } of updates) {
        await supabaseAdmin
          .from(this.tableName)
          .update({
            ...orderUpdate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      }

      // 记录操作日志
      await this.logOperation(
        {
          operation_type: 'reorder',
          item_id: 'batch',
          new_value: items,
          operated_by: userId,
          notes: `批量调整推荐项顺序，共 ${items.length} 项`,
        },
        userId
      );

      toast.success('调整顺序成功');
      return true;
    } catch (error) {
      console.error('调整顺序失败:', error);
      toast.error('调整顺序失败');
      throw error;
    }
  }

  /**
   * 激活/停用推荐项
   */
  async toggleRecommendationStatus(id: string, userId: string) {
    try {
      const { data: original } = await supabaseAdmin
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (!original) {
        throw new Error('推荐项不存在');
      }

      const newStatus = !original.is_active;

      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .update({
          is_active: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // 记录操作日志
      await this.logOperation(
        {
          operation_type: newStatus ? 'activate' : 'deactivate',
          item_id: id,
          previous_value: original,
          new_value: data,
          operated_by: userId,
          notes: `${newStatus ? '激活' : '停用'}推荐项：${data.title}`,
        },
        userId
      );

      toast.success(newStatus ? '已激活推荐项' : '已停用推荐项');
      return data;
    } catch (error) {
      console.error('切换状态失败:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('切换状态失败');
      }
      throw error;
    }
  }

  /**
   * 记录操作日志
   */
  private async logOperation(
    log: Omit<RecommendationOperationLog, 'id' | 'operated_at'>,
    userId: string
  ) {
    try {
      await supabaseAdmin.from(this.logTableName).insert([
        {
          ...log,
          operated_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('记录操作日志失败:', error);
      // 日志记录失败不影响主操作
    }
  }

  /**
   * 获取操作日志
   */
  async getOperationLogs(params: {
    page?: number;
    limit?: number;
    item_id?: string;
    operation_type?: string;
    operated_by?: string;
  } = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        item_id,
        operation_type,
        operated_by,
      } = params;

      let query = supabaseAdmin
        .from(this.logTableName)
        .select('*', { count: 'exact' })
        .order('operated_at', { ascending: false });

      if (item_id) {
        query = query.eq('item_id', item_id);
      }

      if (operation_type) {
        query = query.eq('operation_type', operation_type);
      }

      if (operated_by) {
        query = query.eq('operated_by', operated_by);
      }

      const from = (page - 1) * limit;
      const to = page * limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        logs: data || [],
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      console.error('获取操作日志失败:', error);
      throw error;
    }
  }

  /**
   * 更新点击统计
   */
  async trackClick(itemId: string) {
    try {
      const { data, error } = await supabaseAdmin.rpc('increment_recommendation_click', {
        p_item_id: itemId,
      });

      if (error && error.code !== '42883') {
        // 42883 表示函数不存在，使用备用方案
        throw error;
      }

      // 备用方案：直接更新
      if (error?.code === '42883') {
        await supabaseAdmin.rpc('increment_home_rec_click', {
          p_id: itemId,
        });
      }

      return true;
    } catch (error) {
      console.error('记录点击失败:', error);
      return false;
    }
  }

  /**
   * 获取推荐项统计数据
   */
  async getRecommendationStats() {
    try {
      const { data, error } = await supabaseAdmin.from(this.tableName).select(`
        total_count:count,
        active_count:count(is_active).eq.true,
        inactive_count:count(is_active).eq.false,
        total_clicks:sum(click_count),
        total_impressions:sum(impression_count)
      `);

      if (error) throw error;

      return data?.[0] || {
        total_count: 0,
        active_count: 0,
        inactive_count: 0,
        total_clicks: 0,
        total_impressions: 0,
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return {
        total_count: 0,
        active_count: 0,
        inactive_count: 0,
        total_clicks: 0,
        total_impressions: 0,
      };
    }
  }

  /**
   * 保存到本地存储（用于撤销/恢复）
   */
  saveToLocalStorage(key: string, data: any) {
    const history = JSON.parse(safeLocalStorage.getItem('recommendation_history') || '[]');
    history.push({ key, data, timestamp: new Date().toISOString() });
    // 只保留最近 50 条记录
    const trimmedHistory = history.slice(-50);
    safeLocalStorage.setItem('recommendation_history', JSON.stringify(trimmedHistory));
  }

  /**
   * 从本地存储恢复（用于撤销/恢复）
   */
  getFromLocalStorage(key: string) {
    const history = JSON.parse(safeLocalStorage.getItem('recommendation_history') || '[]');
    return history.find((item: any) => item.key === key);
  }

  /**
   * 清除本地存储历史
   */
  clearLocalStorageHistory() {
    safeLocalStorage.removeItem('recommendation_history');
  }
}

export const homeRecommendationService = new HomeRecommendationService();
export default homeRecommendationService;
