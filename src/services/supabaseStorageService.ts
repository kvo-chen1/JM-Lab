// Supabase Storage 图片上传服务
import { supabase, supabaseAdmin } from '../lib/supabase';

// Storage bucket 名称
const BUCKET_NAME = 'images';

/**
 * 获取用于上传的 Supabase 客户端
 * 优先使用 admin 客户端绕过 RLS
 */
function getUploadClient() {
  // 优先使用 admin 客户端（有 service role key，可以绕过 RLS）
  if (supabaseAdmin) {
    return supabaseAdmin;
  }
  return supabase;
}

/**
 * 上传图片到 Supabase Storage
 * @param file 图片文件
 * @param path 存储路径（如 'works/123/thumbnail.jpg'）
 * @returns 图片的公共 URL
 */
export async function uploadImage(
  file: File,
  path: string
): Promise<{ url: string; error?: string }> {
  try {
    const client = getUploadClient();
    
    // 检查 Supabase 是否配置
    if (!client) {
      return { url: '', error: 'Supabase 未配置' };
    }

    // 上传文件
    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true, // 如果存在则覆盖
      });

    if (error) {
      console.error('[Storage] 上传失败:', error);
      return { url: '', error: error.message };
    }

    // 获取公共 URL（使用普通客户端即可）
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return { url: publicUrlData.publicUrl };
  } catch (err: any) {
    console.error('[Storage] 上传异常:', err);
    return { url: '', error: err.message };
  }
}

/**
 * 上传 Base64 图片到 Supabase Storage
 * @param base64String Base64 图片字符串
 * @param path 存储路径
 * @returns 图片的公共 URL
 */
export async function uploadBase64Image(
  base64String: string,
  path: string
): Promise<{ url: string; error?: string }> {
  try {
    // 解析 Base64
    const base64Data = base64String.split(',')[1]; // 去掉 data:image/jpeg;base64, 前缀
    const mimeType = base64String.match(/data:(.*?);/)?.[1] || 'image/jpeg';
    
    // 转换为 Blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    // 创建 File 对象
    const file = new File([blob], path.split('/').pop() || 'image.jpg', {
      type: mimeType,
    });

    return await uploadImage(file, path);
  } catch (err: any) {
    console.error('[Storage] Base64 上传异常:', err);
    return { url: '', error: err.message };
  }
}

/**
 * 删除图片
 * @param path 图片路径
 */
export async function deleteImage(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getUploadClient();
    
    if (!client) {
      return { success: false, error: 'Supabase 未配置' };
    }

    const { error } = await client.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('[Storage] 删除失败:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Storage] 删除异常:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 获取图片的公共 URL
 * @param path 图片路径
 */
export function getImageUrl(path: string): string {
  if (!supabase) {
    return '';
  }

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * 生成唯一的文件路径
 * @param workId 作品 ID
 * @param fileName 文件名
 */
export function generateFilePath(workId: string, fileName: string): string {
  const timestamp = Date.now();
  const extension = fileName.split('.').pop() || 'jpg';
  return `${workId}/${timestamp}.${extension}`;
}

// Storage 服务类
class SupabaseStorageService {
  /**
   * 上传文件到指定 bucket
   * @param bucketName bucket 名称
   * @param path 存储路径
   * @param file 文件对象
   * @param options 上传选项
   */
  async uploadFile(
    bucketName: string,
    path: string,
    file: File,
    options: {
      onProgress?: (progress: number) => void;
      upsert?: boolean;
    } = {}
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const client = getUploadClient();
      
      if (!client) {
        return { success: false, error: 'Supabase 未配置' };
      }

      const { upsert = true } = options;

      // 上传文件
      const { data, error } = await client.storage
        .from(bucketName)
        .upload(path, file, {
          cacheControl: '3600',
          upsert,
        });

      if (error) {
        console.error('[Storage] 上传失败:', error);
        return { success: false, error: error.message };
      }

      return { success: true, path: data.path };
    } catch (err: any) {
      console.error('[Storage] 上传异常:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * 从指定 bucket 删除文件
   * @param bucketName bucket 名称
   * @param path 文件路径
   */
  async deleteFile(bucketName: string, path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const client = getUploadClient();
      
      if (!client) {
        return { success: false, error: 'Supabase 未配置' };
      }

      const { error } = await client.storage
        .from(bucketName)
        .remove([path]);

      if (error) {
        console.error('[Storage] 删除失败:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.error('[Storage] 删除异常:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * 获取文件的公共 URL
   * @param bucketName bucket 名称
   * @param path 文件路径
   */
  getPublicUrl(bucketName: string, path: string): string {
    if (!supabase) {
      return '';
    }

    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(path);

    return data.publicUrl;
  }
}

export const supabaseStorageService = new SupabaseStorageService();
