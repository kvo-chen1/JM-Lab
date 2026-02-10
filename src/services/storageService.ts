import { supabase } from '@/lib/supabase';

// 存储桶名称
const BRAND_LOGOS_BUCKET = 'brandlogos';

// 允许的文件类型
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// 最大文件大小 (2MB)
const MAX_FILE_SIZE = 2 * 1024 * 1024;

interface UploadResult {
  url: string | null;
  error: string | null;
}

/**
 * 上传品牌Logo到 Supabase Storage
 * @param file 要上传的文件
 * @param brandName 品牌名称（用于生成文件名）
 * @returns 上传结果，包含文件URL或错误信息
 */
export async function uploadBrandLogo(file: File, brandName: string): Promise<UploadResult> {
  try {
    // 1. 验证文件类型
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        url: null,
        error: '只支持 JPG、PNG、WebP 格式的图片',
      };
    }

    // 2. 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return {
        url: null,
        error: '文件大小不能超过 2MB',
      };
    }

    // 3. 生成唯一的文件名（避免使用中文，使用随机字符串）
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileName = `logo_${timestamp}_${randomString}.${fileExt}`;
    const filePath = `${fileName}`;

    // 4. 上传文件到 Supabase Storage
    const { data, error } = await supabase.storage
      .from(BRAND_LOGOS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('上传文件失败:', error);
      return {
        url: null,
        error: `上传失败: ${error.message}`,
      };
    }

    // 5. 获取文件的公共 URL
    const { data: { publicUrl } } = supabase.storage
      .from(BRAND_LOGOS_BUCKET)
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      error: null,
    };
  } catch (error) {
    console.error('上传过程中发生错误:', error);
    return {
      url: null,
      error: '上传过程中发生错误，请重试',
    };
  }
}

/**
 * 删除品牌Logo
 * @param filePath 文件路径
 * @returns 是否删除成功
 */
export async function deleteBrandLogo(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(BRAND_LOGOS_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('删除文件失败:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('删除过程中发生错误:', error);
    return false;
  }
}

/**
 * 从URL中提取文件路径
 * @param url 文件的公共URL
 * @returns 文件路径
 */
export function getFilePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // 路径格式: /storage/v1/object/public/brand-logos/filename.jpg
    const bucketIndex = pathParts.indexOf(BRAND_LOGOS_BUCKET);
    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      return pathParts.slice(bucketIndex + 1).join('/');
    }
    return null;
  } catch {
    return null;
  }
}
