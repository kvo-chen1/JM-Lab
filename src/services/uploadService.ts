// 上传作品服务 - 管理用户上传的作品
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { uploadImage } from './imageService';

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

class UploadService {
  private readonly tableName = 'user_uploads';

  // 获取当前用户的所有上传作品
  async getUserUploads(userId?: string): Promise<{ data: UserUpload[] | null; error: Error | null }> {
    try {
      // 优先使用传入的 userId，否则从 supabase auth 获取
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('用户未登录');
        }
        targetUserId = user.id;
      }

      console.log('[UploadService] 获取用户上传作品，用户ID:', targetUserId);

      // 使用 supabaseAdmin 绕过 RLS 策略
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[UploadService] 获取上传作品数据库错误:', error);
        throw error;
      }
      
      console.log('[UploadService] 获取上传作品成功，数量:', data?.length || 0);
      return { data, error: null };
    } catch (error) {
      console.error('[UploadService] 获取上传作品失败:', error);
      return { data: null, error: error as Error };
    }
  }

  // 上传新作品
  async createUpload(input: CreateUploadInput, userId?: string): Promise<{ data: UserUpload | null; error: Error | null }> {
    try {
      // 优先使用传入的 userId，否则从 supabase auth 获取
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('用户未登录');
        }
        targetUserId = user.id;
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

      // 准备插入数据
      const insertData = {
        user_id: targetUserId,
        file_url: fileUrl,
        file_name: input.file.name,
        file_type: input.file.type,
        file_size: input.file.size,
        thumbnail_url: thumbnailUrl,
        title: input.title || input.file.name,
        description: input.description,
        tags: input.tags || []
      };
      console.log('[UploadService] 准备插入数据库:', insertData);

      // 保存到数据库 - 使用 supabaseAdmin 绕过 RLS 策略
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[UploadService] 数据库插入失败:', error);
        throw error;
      }
      
      console.log('[UploadService] 数据库插入成功:', data);
      return { data, error: null };
    } catch (error) {
      console.error('[UploadService] 上传作品失败:', error);
      return { data: null, error: error as Error };
    }
  }

  // 更新作品信息
  async updateUpload(id: string, input: UpdateUploadInput, userId?: string): Promise<{ data: UserUpload | null; error: Error | null }> {
    try {
      // 优先使用传入的 userId，否则从 supabase auth 获取
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('用户未登录');
        }
        targetUserId = user.id;
      }

      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .update({
          title: input.title,
          description: input.description,
          tags: input.tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', targetUserId) // 确保只能更新自己的数据
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[UploadService] 更新作品失败:', error);
      return { data: null, error: error as Error };
    }
  }

  // 删除作品
  async deleteUpload(id: string, userId?: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      // 优先使用传入的 userId，否则从 supabase auth 获取
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('用户未登录');
        }
        targetUserId = user.id;
      }

      // 先获取文件信息
      const { data: upload } = await supabaseAdmin
        .from(this.tableName)
        .select('file_url')
        .eq('id', id)
        .eq('user_id', targetUserId)
        .single();

      if (upload) {
        // 从存储中删除文件
        const filePath = upload.file_url.split('/').pop();
        if (filePath) {
          await supabaseAdmin.storage
            .from('works')
            .remove([`user-uploads/${filePath}`]);
        }
      }

      // 从数据库删除记录
      const { error } = await supabaseAdmin
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', targetUserId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('[UploadService] 删除作品失败:', error);
      return { success: false, error: error as Error };
    }
  }

  // 获取单个作品详情
  async getUploadById(id: string, userId?: string): Promise<{ data: UserUpload | null; error: Error | null }> {
    try {
      // 优先使用传入的 userId，否则从 supabase auth 获取
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('用户未登录');
        }
        targetUserId = user.id;
      }

      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .eq('user_id', targetUserId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[UploadService] 获取作品详情失败:', error);
      return { data: null, error: error as Error };
    }
  }

  // 搜索作品
  async searchUploads(query: string, userId?: string): Promise<{ data: UserUpload[] | null; error: Error | null }> {
    try {
      // 优先使用传入的 userId，否则从 supabase auth 获取
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('用户未登录');
        }
        targetUserId = user.id;
      }

      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('*')
        .eq('user_id', targetUserId)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[UploadService] 搜索作品失败:', error);
      return { data: null, error: error as Error };
    }
  }

  // 按标签筛选作品
  async getUploadsByTag(tag: string, userId?: string): Promise<{ data: UserUpload[] | null; error: Error | null }> {
    try {
      // 优先使用传入的 userId，否则从 supabase auth 获取
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('用户未登录');
        }
        targetUserId = user.id;
      }

      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('*')
        .eq('user_id', targetUserId)
        .contains('tags', [tag])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[UploadService] 按标签获取作品失败:', error);
      return { data: null, error: error as Error };
    }
  }
}

export const uploadService = new UploadService();
export default uploadService;
