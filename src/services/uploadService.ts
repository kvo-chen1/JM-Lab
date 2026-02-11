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
  async getUserUploads(): Promise<{ data: UserUpload[] | null; error: Error | null }> {
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
      console.error('[UploadService] 获取上传作品失败:', error);
      return { data: null, error: error as Error };
    }
  }

  // 上传新作品
  async createUpload(input: CreateUploadInput): Promise<{ data: UserUpload | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      // 上传文件到存储
      const fileUrl = await uploadImage(input.file, 'user-uploads');
      
      // 生成缩略图（如果是图片）
      let thumbnailUrl = fileUrl;
      if (input.file.type.startsWith('image/')) {
        thumbnailUrl = fileUrl;
      }

      // 保存到数据库
      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          user_id: user.id,
          file_url: fileUrl,
          file_name: input.file.name,
          file_type: input.file.type,
          file_size: input.file.size,
          thumbnail_url: thumbnailUrl,
          title: input.title || input.file.name,
          description: input.description,
          tags: input.tags || []
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[UploadService] 上传作品失败:', error);
      return { data: null, error: error as Error };
    }
  }

  // 更新作品信息
  async updateUpload(id: string, input: UpdateUploadInput): Promise<{ data: UserUpload | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          title: input.title,
          description: input.description,
          tags: input.tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id) // 确保只能更新自己的数据
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
  async deleteUpload(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      // 先获取文件信息
      const { data: upload } = await supabase
        .from(this.tableName)
        .select('file_url')
        .eq('id', id)
        .eq('user_id', user.id)
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
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('[UploadService] 删除作品失败:', error);
      return { success: false, error: error as Error };
    }
  }

  // 获取单个作品详情
  async getUploadById(id: string): Promise<{ data: UserUpload | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[UploadService] 获取作品详情失败:', error);
      return { data: null, error: error as Error };
    }
  }

  // 搜索作品
  async searchUploads(query: string): Promise<{ data: UserUpload[] | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', user.id)
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
  async getUploadsByTag(tag: string): Promise<{ data: UserUpload[] | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', user.id)
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
