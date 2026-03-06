import { supabase } from '@/lib/supabase';
import { TianjinTemplate } from './tianjinActivityService';

/**
 * 模板使用记录服务
 * 记录用户选择和使用模板的行为
 */

export interface TemplateUsageRecord {
  id?: string;
  user_id: string;
  template_id: number;
  template_name: string;
  template_category: string;
  template_style?: string;
  prompt_used: string;
  created_at?: string;
}

export interface TemplateUsageStats {
  totalUsages: number;
  uniqueTemplates: number;
  favoriteCategory: string;
  recentUsages: TemplateUsageRecord[];
}

export const templateUsageService = {
  /**
   * 保存模板使用记录
   * 当用户点击"使用模板"时调用
   */
  async saveTemplateUsage(
    userId: string,
    template: TianjinTemplate,
    prompt: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 检查是否已存在相同的记录（避免重复）
      const { data: existingRecord } = await supabase
        .from('template_usage_records')
        .select('id')
        .eq('user_id', userId)
        .eq('template_id', template.id)
        .gte('created_at', new Date(Date.now() - 60000).toISOString()) // 1分钟内不重复记录
        .single();

      if (existingRecord) {
        return { success: true }; // 已存在近期记录，不重复保存
      }

      const { error } = await supabase
        .from('template_usage_records')
        .insert({
          user_id: userId,
          template_id: template.id,
          template_name: template.name,
          template_category: template.category,
          template_style: template.style,
          prompt_used: prompt,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('保存模板使用记录失败:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('保存模板使用记录异常:', error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * 获取用户的模板使用统计
   */
  async getUserTemplateStats(userId: string): Promise<TemplateUsageStats> {
    try {
      const { data, error } = await supabase
        .from('template_usage_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取模板使用统计失败:', error);
        return {
          totalUsages: 0,
          uniqueTemplates: 0,
          favoriteCategory: '',
          recentUsages: []
        };
      }

      const records = data || [];
      
      // 计算统计数据
      const uniqueTemplateIds = new Set(records.map(r => r.template_id));
      
      // 找出最喜欢的分类
      const categoryCount: Record<string, number> = {};
      records.forEach(r => {
        categoryCount[r.template_category] = (categoryCount[r.template_category] || 0) + 1;
      });
      const favoriteCategory = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

      return {
        totalUsages: records.length,
        uniqueTemplates: uniqueTemplateIds.size,
        favoriteCategory,
        recentUsages: records.slice(0, 10)
      };
    } catch (error) {
      console.error('获取模板使用统计异常:', error);
      return {
        totalUsages: 0,
        uniqueTemplates: 0,
        favoriteCategory: '',
        recentUsages: []
      };
    }
  },

  /**
   * 获取用户最近使用的模板
   */
  async getUserRecentTemplates(userId: string, limit: number = 5): Promise<TemplateUsageRecord[]> {
    try {
      const { data, error } = await supabase
        .from('template_usage_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('获取最近使用模板失败:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('获取最近使用模板异常:', error);
      return [];
    }
  },

  /**
   * 获取热门模板（按使用次数排序）
   */
  async getPopularTemplates(limit: number = 10): Promise<{ template_id: number; count: number; template_name: string }[]> {
    try {
      const { data, error } = await supabase
        .from('template_usage_records')
        .select('template_id, template_name')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('获取热门模板失败:', error);
        return [];
      }

      // 统计每个模板的使用次数
      const usageCount: Record<number, { count: number; name: string }> = {};
      data?.forEach(record => {
        if (!usageCount[record.template_id]) {
          usageCount[record.template_id] = { count: 0, name: record.template_name };
        }
        usageCount[record.template_id].count++;
      });

      // 排序并返回
      return Object.entries(usageCount)
        .map(([id, info]) => ({
          template_id: parseInt(id),
          count: info.count,
          template_name: info.name
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('获取热门模板异常:', error);
      return [];
    }
  },

  /**
   * 删除用户的模板使用记录
   */
  async deleteUsageRecord(userId: string, recordId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('template_usage_records')
        .delete()
        .eq('id', recordId)
        .eq('user_id', userId);

      if (error) {
        console.error('删除模板使用记录失败:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('删除模板使用记录异常:', error);
      return false;
    }
  },

  /**
   * 获取用户的模板使用历史（用于"最近使用"功能）
   */
  async getUserTemplateHistory(userId: string): Promise<TemplateUsageRecord[]> {
    try {
      const { data, error } = await supabase
        .from('template_usage_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取模板使用历史失败:', error);
        return [];
      }

      // 去重，只保留每个模板的最新记录
      const seen = new Set<number>();
      const uniqueRecords: TemplateUsageRecord[] = [];
      
      (data || []).forEach(record => {
        if (!seen.has(record.template_id)) {
          seen.add(record.template_id);
          uniqueRecords.push(record);
        }
      });

      return uniqueRecords;
    } catch (error) {
      console.error('获取模板使用历史异常:', error);
      return [];
    }
  }
};

export default templateUsageService;
