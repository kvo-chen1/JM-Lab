/**
 * 作品服务模块 - 提供作品相关功能
 */

import { supabase } from '@/lib/supabase';

// 作品类型定义
export interface Work {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

class WorkService {
  /**
   * 获取当前用户的作品列表
   * @param userId 可选的用户ID，如果不提供则尝试从 Supabase auth 获取
   */
  async getUserWorks(userId?: string): Promise<Work[]> {
    try {
      let targetUserId = userId;
      
      // 如果没有提供 userId，尝试从 Supabase auth 获取
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('[WorkService] 用户未登录，返回模拟数据');
          return this.getMockWorks();
        }
        targetUserId = user.id;
      }

      // 尝试从 works 表获取数据
      const { data, error } = await supabase
        .from('works')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('从数据库获取作品失败，使用模拟数据:', error);
        // 如果表不存在或查询失败，返回模拟数据
        return this.getMockWorks();
      }

      return (data || []).map(this.transformWorkData);
    } catch (error) {
      console.error('获取用户作品失败:', error);
      return this.getMockWorks();
    }
  }

  /**
   * 获取单个作品详情
   */
  async getWorkById(id: string): Promise<Work | null> {
    try {
      const { data, error } = await supabase
        .from('works')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('获取作品详情失败:', error);
        return null;
      }

      return data ? this.transformWorkData(data) : null;
    } catch (error) {
      console.error('获取作品详情失败:', error);
      return null;
    }
  }

  /**
   * 转换作品数据格式
   */
  private transformWorkData(data: any): Work {
    return {
      id: data.id,
      title: data.title || data.name || '未命名作品',
      description: data.description || '',
      category: data.category || data.type || '其他',
      thumbnail: data.thumbnail || data.cover_image || data.image_url,
      status: data.status || 'published',
      createdAt: data.created_at || data.createdAt,
      updatedAt: data.updated_at || data.updatedAt,
    };
  }

  /**
   * 获取模拟作品数据（用于开发测试）
   */
  private getMockWorks(): Work[] {
    return [
      {
        id: 'work-1',
        title: '津门古韵·杨柳青年画创新',
        description: '将传统杨柳青年画元素与现代插画风格融合，创作出具有天津特色的国潮插画系列',
        category: 'illustration',
        thumbnail: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=400&h=300&fit=crop',
        status: 'published',
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-01-15T10:00:00Z',
      },
      {
        id: 'work-2',
        title: '海河印象·纹样设计',
        description: '提取海河两岸建筑轮廓与传统纹样，设计出具有地域特色的装饰纹样',
        category: 'pattern',
        thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
        status: 'published',
        createdAt: '2026-01-10T09:00:00Z',
        updatedAt: '2026-01-10T09:00:00Z',
      },
      {
        id: 'work-3',
        title: '泥人张·3D数字藏品',
        description: '以天津泥人张传统技艺为灵感，创作3D数字艺术藏品',
        category: '3d_model',
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop',
        status: 'published',
        createdAt: '2026-01-05T14:00:00Z',
        updatedAt: '2026-01-05T14:00:00Z',
      },
    ];
  }
}

export const workService = new WorkService();
export default workService;
