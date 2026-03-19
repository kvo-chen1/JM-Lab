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
  video_url?: string;
  content?: any;
  metadata?: any;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

class WorkService {
  /**
   * 获取所有已发布的作品（用于推荐位管理）
   */
  async getAllPublishedWorks(limit: number = 100): Promise<Work[]> {
    try {
      // 首先尝试查询公开且已发布的作品
      const { data, error } = await supabase
        .from('works')
        .select('*')
        .eq('is_public', true)
        .in('status', ['published', 'active', 'approved'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('获取公开作品失败:', error);
      }

      if (data && data.length > 0) {
        console.log('[WorkService] 获取到公开作品数量:', data.length);
        return data.map(item => this.transformWorkData(item));
      }

      // 如果没有公开作品，查询所有状态的作品（不限制 is_public）
      console.log('[WorkService] 尝试查询所有作品...');
      const { data: allData, error: allError } = await supabase
        .from('works')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (allError) {
        console.warn('获取所有作品失败:', allError);
        return this.getMockWorks();
      }

      console.log('[WorkService] 获取到所有作品数量:', allData?.length || 0);
      return (allData || []).map(item => this.transformWorkData(item));
    } catch (error) {
      console.error('获取作品失败:', error);
      return this.getMockWorks();
    }
  }

  /**
   * 获取当前用户的作品列表
   * @param userId 可选的用户 ID，如果不提供则尝试从 Supabase auth 获取
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

      return (data || []).map(item => this.transformWorkData(item));
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
    // 尝试多个可能的缩略图字段 - 按照数据库实际字段名
    const thumbnail = data.thumbnail_url || data.thumbnail || data.cover_image || data.image_url || 
                     data.poster || data.video_thumbnail ||
                     (data.metadata?.thumbnail) || (data.content?.thumbnail);
    
    // 尝试多个可能的视频 URL 字段 - 按照津脉广场的实现方式
    const videoUrl = data.videoUrl || data.video_url || data.video || 
                    (typeof data.content === 'object' && data.content?.videoUrl) ||
                    (typeof data.content === 'object' && data.content?.video_url) ||
                    (typeof data.content === 'object' && data.content?.video) ||
                    (typeof data.metadata === 'object' && data.metadata?.videoUrl) ||
                    (typeof data.metadata === 'object' && data.metadata?.video_url) ||
                    (typeof data.metadata === 'object' && data.metadata?.video) ||
                    (typeof data.content === 'string' && this.extractVideoFromContent(data.content)) ||
                    (typeof data.metadata === 'string' && this.extractVideoFromMetadata(data.metadata)) ||
                    // 检查缩略图是否是视频格式
                    (thumbnail && this.isVideoFormat(thumbnail) ? thumbnail : null);
    
    // 检查是否为视频类型
    const isVideoType = data.type === 'video' || data.category === 'video' || 
                       data.type === 'Video' || data.category === 'Video';
    
    // 如果是视频类型但没有单独的视频 URL，尝试使用缩略图作为视频源
    const effectiveVideoUrl = videoUrl || (isVideoType && thumbnail ? thumbnail : null);
    
    return {
      id: data.id,
      title: data.title || data.name || '未命名作品',
      description: data.description || '',
      category: data.category || data.type || '其他',
      thumbnail: thumbnail,
      video_url: effectiveVideoUrl,
      content: typeof data.content === 'string' ? JSON.parse(data.content) : data.content,
      metadata: typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata,
      status: data.status || 'published',
      createdAt: data.created_at || data.createdAt,
      updatedAt: data.updated_at || data.updatedAt,
    };
  }

  /**
   * 检查 URL 是否为视频格式
   */
  private isVideoFormat(url: string): boolean {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
  }

  /**
   * 从 content 字符串中提取视频 URL
   */
  private extractVideoFromContent(contentStr: string): string | null {
    try {
      const contentObj = JSON.parse(contentStr);
      if (typeof contentObj === 'object') {
        return contentObj.video_url || contentObj.video || contentObj.url || null;
      }
    } catch (e) {
      // 如果不是有效的 JSON，尝试查找 URL 模式
      const videoPattern = /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)(\?.*)?$/i;
      const urlMatch = contentStr.match(/https?:\/\/[^\s"'<>]+/g);
      if (urlMatch) {
        for (const url of urlMatch) {
          if (videoPattern.test(url)) {
            return url;
          }
        }
      }
    }
    return null;
  }

  /**
   * 从 metadata 字符串中提取视频 URL
   */
  private extractVideoFromMetadata(metadataStr: string): string | null {
    try {
      const metadataObj = JSON.parse(metadataStr);
      if (typeof metadataObj === 'object') {
        return metadataObj.video_url || metadataObj.video || metadataObj.file_url || null;
      }
    } catch (e) {
      // metadata 通常应该是对象格式，如果不是 JSON，可能没有视频信息
    }
    return null;
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
