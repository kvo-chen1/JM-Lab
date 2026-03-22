// 上传作品服务 - 管理用户上传的作品
import { uploadImage } from './imageService';
import { getLocalApiUrl } from '@/config/api';

export interface UserUpload {
  id: string;
  user_id: string;
  file_url: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  thumbnail_url?: string;
  title?: string;
  description?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateUploadInput {
  file: File;
  title?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateUploadInput {
  title?: string;
  description?: string;
  tags?: string[];
}

// 获取 token
function getToken(): string | null {
  return localStorage.getItem('token');
}

// 获取用户ID
function getUserId(): string | null {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user?.id || null;
    }
  } catch (e) {
    console.warn('[UploadService] 解析用户信息失败:', e);
  }
  return null;
}

class UploadService {
  private readonly tableName = 'user_uploads';

  // 获取当前用户的所有上传作品
  async getUserUploads(userId?: string): Promise<{ data: UserUpload[] | null; error: Error | null }> {
    try {
      const targetUserId = userId || getUserId();
      
      if (!targetUserId) {
        throw new Error('用户未登录');
      }

      console.log('[UploadService] 获取用户上传作品，用户ID:', targetUserId);

      const token = getToken();
      if (!token) {
        throw new Error('未找到认证 token');
      }

      // 使用后端 API 获取作品列表
      const apiUrl = getLocalApiUrl();
      const response = await fetch(`${apiUrl}/api/works?creator_id=${targetUserId}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `获取作品失败: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.code !== 0) {
        throw new Error(result.message || '获取作品失败');
      }

      // 转换数据格式
      const uploads: UserUpload[] = (result.data || []).map((work: any) => ({
        id: work.id,
        user_id: work.creator_id,
        file_url: work.cover_url || work.thumbnail || '',
        file_name: work.title,
        file_type: 'image/png',
        file_size: 0,
        thumbnail_url: work.thumbnail || work.cover_url || '',
        title: work.title,
        description: work.description,
        tags: work.tags || [],
        created_at: work.created_at,
        updated_at: work.updated_at
      }));

      console.log('[UploadService] 获取作品成功:', uploads.length);
      return { data: uploads, error: null };
    } catch (error) {
      console.error('[UploadService] 获取作品失败:', error);
      return { data: null, error: error as Error };
    }
  }

  // 上传新作品
  async createUpload(input: CreateUploadInput, userId?: string): Promise<{ data: UserUpload | null; error: Error | null }> {
    try {
      const targetUserId = userId || getUserId();
      
      if (!targetUserId) {
        throw new Error('用户未登录');
      }

      const token = getToken();
      if (!token) {
        throw new Error('未找到认证 token');
      }

      console.log('[UploadService] 开始上传，用户ID:', targetUserId);

      // 上传文件到存储
      console.log('[UploadService] 上传文件到存储...');
      const fileUrl = await uploadImage(input.file, 'user-uploads');
      console.log('[UploadService] 文件上传成功:', fileUrl);
      
      // 生成缩略图（如果是图片）
      let thumbnailUrl = fileUrl;
      if (input.file.type.startsWith('image/')) {
        thumbnailUrl = fileUrl;
      }

      // 使用后端 API 创建作品
      const apiUrl = getLocalApiUrl();
      const response = await fetch(`${apiUrl}/api/works`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: input.title || input.file.name,
          description: input.description || '',
          cover_url: fileUrl,
          thumbnail: thumbnailUrl,
          tags: input.tags || [],
          source: '创作中心',
          media: [{ type: 'image', url: fileUrl }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `创建作品失败: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.code !== 0) {
        throw new Error(result.message || '创建作品失败');
      }

      const work = result.data;
      
      // 转换为 UserUpload 格式
      const upload: UserUpload = {
        id: work.id,
        user_id: work.creator_id,
        file_url: work.cover_url || work.thumbnail || '',
        file_name: work.title,
        file_type: input.file.type,
        file_size: input.file.size,
        thumbnail_url: work.thumbnail || work.cover_url || '',
        title: work.title,
        description: work.description,
        tags: work.tags || [],
        created_at: work.created_at,
        updated_at: work.updated_at
      };

      console.log('[UploadService] 创建作品成功:', upload);
      return { data: upload, error: null };
    } catch (error) {
      console.error('[UploadService] 上传作品失败:', error);
      return { data: null, error: error as Error };
    }
  }

  // 更新作品
  async updateUpload(uploadId: string, input: UpdateUploadInput): Promise<{ data: UserUpload | null; error: Error | null }> {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('未找到认证 token');
      }

      console.log('[UploadService] 更新作品:', uploadId);

      // 使用后端 API 更新作品
      const apiUrl = getLocalApiUrl();
      const response = await fetch(`${apiUrl}/api/works/${uploadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: input.title,
          description: input.description,
          tags: input.tags
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `更新作品失败: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.code !== 0) {
        throw new Error(result.message || '更新作品失败');
      }

      const work = result.data;
      
      // 转换为 UserUpload 格式
      const upload: UserUpload = {
        id: work.id,
        user_id: work.creator_id,
        file_url: work.image_url,
        file_name: work.title,
        file_type: 'image/png',
        file_size: 0,
        thumbnail_url: work.thumbnail_url || work.image_url,
        title: work.title,
        description: work.description,
        tags: work.tags || [],
        created_at: work.created_at,
        updated_at: work.updated_at
      };

      console.log('[UploadService] 更新作品成功:', upload);
      return { data: upload, error: null };
    } catch (error) {
      console.error('[UploadService] 更新作品失败:', error);
      return { data: null, error: error as Error };
    }
  }

  // 删除作品
  async deleteUpload(uploadId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('未找到认证 token');
      }

      console.log('[UploadService] 删除作品:', uploadId);

      // 使用后端 API 删除作品
      const apiUrl = getLocalApiUrl();
      const response = await fetch(`${apiUrl}/api/works/${uploadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `删除作品失败: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.code !== 0) {
        throw new Error(result.message || '删除作品失败');
      }

      console.log('[UploadService] 删除作品成功:', uploadId);
      return { success: true, error: null };
    } catch (error) {
      console.error('[UploadService] 删除作品失败:', error);
      return { success: false, error: error as Error };
    }
  }
}

export const uploadService = new UploadService();
export default uploadService;
