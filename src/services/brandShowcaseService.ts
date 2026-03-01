import { supabase } from '@/lib/supabase';

// 品牌展示信息类型定义
export interface BrandShowcase {
  id: string;
  brand_id: string;
  brand_name: string;
  brand_logo: string;
  brand_cover?: string;
  brand_slogan?: string;
  brand_value?: string;
  brand_story?: string;
  brand_history?: string;
  brand_culture?: string;
  brand_products?: string;
  brand_achievements?: string[];
  brand_gallery?: string[];
  brand_video?: string;
  brand_website?: string;
  brand_social?: {
    weibo?: string;
    wechat?: string;
    douyin?: string;
    xiaohongshu?: string;
  };
  contact_info?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  is_published: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  view_count: number;
  like_count: number;
}

// 创建/更新品牌展示请求类型
export interface BrandShowcaseRequest {
  brand_id: string;
  brand_name: string;
  brand_logo: string;
  brand_cover?: string;
  brand_slogan?: string;
  brand_value?: string;
  brand_story?: string;
  brand_history?: string;
  brand_culture?: string;
  brand_products?: string;
  brand_achievements?: string[];
  brand_gallery?: string[];
  brand_video?: string;
  brand_website?: string;
  brand_social?: {
    weibo?: string;
    wechat?: string;
    douyin?: string;
    xiaohongshu?: string;
  };
  contact_info?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  is_published?: boolean;
}

// 品牌展示服务类
class BrandShowcaseService {
  // 获取所有已发布的品牌展示
  async getPublishedShowcases(): Promise<BrandShowcase[]> {
    try {
      const { data, error } = await supabase
        .from('brand_showcases')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) {
        console.error('获取品牌展示失败:', error);
        // 如果表不存在，使用 localStorage 作为临时存储
        if (error.code === '42P01') {
          return this.getShowcasesFromLocal();
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('获取品牌展示失败:', error);
      return this.getShowcasesFromLocal();
    }
  }

  // 获取单个品牌展示详情
  async getShowcaseByBrandId(brandId: string): Promise<BrandShowcase | null> {
    try {
      const { data, error } = await supabase
        .from('brand_showcases')
        .select('*')
        .eq('brand_id', brandId)
        .single();

      if (error) {
        if (error.code === '42P01') {
          return this.getShowcaseFromLocal(brandId);
        }
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('获取品牌展示详情失败:', error);
      return this.getShowcaseFromLocal(brandId);
    }
  }

  // 获取我管理的品牌展示
  async getMyShowcases(userId?: string): Promise<BrandShowcase[]> {
    try {
      let currentUserId = userId;
      
      if (!currentUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.warn('用户未登录，无法获取品牌展示');
          return [];
        }
        currentUserId = session.user.id;
      }

      const { data, error } = await supabase
        .from('brand_showcases')
        .select('*')
        .eq('created_by', currentUserId)
        .order('updated_at', { ascending: false });

      if (error) {
        // 42P01 = 表不存在, PGRST205 = 表不存在(schema cache)
        if (error.code === '42P01' || error.code === 'PGRST205') {
          return this.getMyShowcasesFromLocal(currentUserId);
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('获取我的品牌展示失败:', error);
      return [];
    }
  }

  // 创建或更新品牌展示
  async saveShowcase(data: BrandShowcaseRequest, userId?: string): Promise<BrandShowcase | null> {
    // 获取当前用户 - 在 try 块外部定义，确保 catch 块可以访问
    let currentUserId = userId;
    if (!currentUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        currentUserId = session.user.id;
      }
    }

    if (!currentUserId) {
      console.warn('无法获取用户ID，使用 LocalStorage 保存');
      // 使用 LocalStorage 作为回退
      return this.saveShowcaseToLocal(data, 'unknown-user');
    }

    try {
      // 检查是否已存在该品牌的展示
      const { data: existing } = await supabase
        .from('brand_showcases')
        .select('id')
        .eq('brand_id', data.brand_id)
        .single();

      const showcaseData = {
        ...data,
        updated_at: new Date().toISOString(),
        ...(data.is_published && !existing ? { published_at: new Date().toISOString() } : {}),
      };

      if (existing) {
        // 更新
        const { data: updated, error } = await supabase
          .from('brand_showcases')
          .update(showcaseData)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          if (error.code === '42P01') {
            return this.saveShowcaseToLocal(data, currentUserId, existing.id);
          }
          throw error;
        }
        return updated;
      } else {
        // 创建
        const { data: created, error } = await supabase
          .from('brand_showcases')
          .insert([{
            ...showcaseData,
            created_by: currentUserId,
            created_at: new Date().toISOString(),
            view_count: 0,
            like_count: 0,
          }])
          .select()
          .single();

        if (error) {
          if (error.code === '42P01') {
            return this.saveShowcaseToLocal(data, currentUserId);
          }
          throw error;
        }
        return created;
      }
    } catch (error) {
      console.error('保存品牌展示失败:', error);
      // 如果出错，尝试使用 LocalStorage
      return this.saveShowcaseToLocal(data, currentUserId);
    }
  }

  // 发布/取消发布品牌展示
  async togglePublish(showcaseId: string, publish: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('brand_showcases')
        .update({
          is_published: publish,
          published_at: publish ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', showcaseId);

      if (error) {
        // 42P01 = 表不存在, PGRST205 = 表不存在(schema cache)
        if (error.code === '42P01' || error.code === 'PGRST205') {
          return this.togglePublishInLocal(showcaseId, publish);
        }
        throw error;
      }
      return true;
    } catch (error) {
      console.error('切换发布状态失败:', error);
      // 如果出错，尝试从 LocalStorage 切换
      return this.togglePublishInLocal(showcaseId, publish);
    }
  }

  // 删除品牌展示
  async deleteShowcase(showcaseId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('brand_showcases')
        .delete()
        .eq('id', showcaseId);

      if (error) {
        // 42P01 = 表不存在, PGRST205 = 表不存在(schema cache)
        if (error.code === '42P01' || error.code === 'PGRST205') {
          return this.deleteShowcaseFromLocal(showcaseId);
        }
        throw error;
      }
      return true;
    } catch (error) {
      console.error('删除品牌展示失败:', error);
      // 如果出错，尝试从 LocalStorage 删除
      return this.deleteShowcaseFromLocal(showcaseId);
    }
  }

  // 增加浏览量
  async incrementViewCount(brandId: string): Promise<void> {
    try {
      const { data: showcase } = await supabase
        .from('brand_showcases')
        .select('id, view_count')
        .eq('brand_id', brandId)
        .single();

      if (showcase) {
        await supabase
          .from('brand_showcases')
          .update({ view_count: (showcase.view_count || 0) + 1 })
          .eq('id', showcase.id);
      }
    } catch (error) {
      console.error('增加浏览量失败:', error);
    }
  }

  // ========== LocalStorage 回退方法 ==========

  private getLocalStorageKey(): string {
    return 'jmzf_brand_showcases';
  }

  private getShowcasesFromLocal(): BrandShowcase[] {
    try {
      const data = localStorage.getItem(this.getLocalStorageKey());
      const showcases = data ? JSON.parse(data) : [];
      return showcases.filter((s: BrandShowcase) => s.is_published);
    } catch {
      return [];
    }
  }

  private getShowcaseFromLocal(brandId: string): BrandShowcase | null {
    try {
      const data = localStorage.getItem(this.getLocalStorageKey());
      const showcases = data ? JSON.parse(data) : [];
      return showcases.find((s: BrandShowcase) => s.brand_id === brandId) || null;
    } catch {
      return null;
    }
  }

  private getMyShowcasesFromLocal(userId: string): BrandShowcase[] {
    try {
      const data = localStorage.getItem(this.getLocalStorageKey());
      console.log('LocalStorage 原始数据:', data);
      const showcases = data ? JSON.parse(data) : [];
      console.log('解析后的展示数据:', showcases);
      console.log('当前用户ID:', userId);
      const filtered = showcases.filter((s: BrandShowcase) => s.created_by === userId);
      console.log('过滤后的展示:', filtered);
      return filtered;
    } catch (error) {
      console.error('获取本地展示失败:', error);
      return [];
    }
  }

  private saveShowcaseToLocal(
    data: BrandShowcaseRequest,
    userId: string,
    existingId?: string
  ): BrandShowcase {
    const showcases = this.getAllShowcasesFromLocal();
    const now = new Date().toISOString();

    if (existingId) {
      const index = showcases.findIndex((s: BrandShowcase) => s.id === existingId);
      if (index !== -1) {
        showcases[index] = {
          ...showcases[index],
          ...data,
          updated_at: now,
        };
        localStorage.setItem(this.getLocalStorageKey(), JSON.stringify(showcases));
        return showcases[index];
      }
    }

    const newShowcase: BrandShowcase = {
      id: existingId || `local-${Date.now()}`,
      ...data,
      is_published: data.is_published || false,
      created_by: userId,
      created_at: now,
      updated_at: now,
      published_at: data.is_published ? now : undefined,
      view_count: 0,
      like_count: 0,
    };

    showcases.push(newShowcase);
    localStorage.setItem(this.getLocalStorageKey(), JSON.stringify(showcases));
    return newShowcase;
  }

  private togglePublishInLocal(showcaseId: string, publish: boolean): boolean {
    try {
      const showcases = this.getAllShowcasesFromLocal();
      const index = showcases.findIndex((s: BrandShowcase) => s.id === showcaseId);
      if (index !== -1) {
        showcases[index].is_published = publish;
        showcases[index].published_at = publish ? new Date().toISOString() : undefined;
        showcases[index].updated_at = new Date().toISOString();
        localStorage.setItem(this.getLocalStorageKey(), JSON.stringify(showcases));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private deleteShowcaseFromLocal(showcaseId: string): boolean {
    try {
      const showcases = this.getAllShowcasesFromLocal();
      const filtered = showcases.filter((s: BrandShowcase) => s.id !== showcaseId);
      localStorage.setItem(this.getLocalStorageKey(), JSON.stringify(filtered));
      return true;
    } catch {
      return false;
    }
  }

  private getAllShowcasesFromLocal(): BrandShowcase[] {
    try {
      const data = localStorage.getItem(this.getLocalStorageKey());
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}

export const brandShowcaseService = new BrandShowcaseService();
