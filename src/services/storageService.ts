import { supabase } from '@/lib/supabase';
import { uploadFile, deleteFile } from './storageServiceNew';

// 存储桶名称（现在作为文件夹使用）
const BRAND_LOGOS_FOLDER = 'brandlogos';
const BUSINESS_LICENSES_FOLDER = 'business-licenses';

// 允许的文件类型
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// 最大文件大小
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB for logos
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB for documents

interface UploadResult {
  url: string | null;
  error: string | null;
}

/**
 * 上传品牌Logo到存储服务
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

    // 3. 使用新的存储服务上传
    const publicUrl = await uploadFile(file, BRAND_LOGOS_FOLDER);

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
    // 从 URL 中提取路径
    const pathMatch = filePath.match(/\/uploads\/brandlogos\/(.+)/);
    if (pathMatch) {
      return await deleteFile(`brandlogos/${pathMatch[1]}`);
    }
    return false;
  } catch (error) {
    console.error('删除文件失败:', error);
    return false;
  }
}

/**
 * 上传营业执照到存储服务
 * @param file 要上传的文件
 * @param brandId 品牌ID（用于生成文件名）
 * @returns 上传结果，包含文件URL或错误信息
 */
export async function uploadBusinessLicense(file: File, brandId: string): Promise<UploadResult> {
  try {
    // 1. 验证文件类型
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      return {
        url: null,
        error: '只支持 JPG、PNG、WebP 格式的图片或 PDF 文档',
      };
    }

    // 2. 验证文件大小
    if (file.size > MAX_DOCUMENT_SIZE) {
      return {
        url: null,
        error: '文件大小不能超过 5MB',
      };
    }

    // 3. 使用新的存储服务上传
    const publicUrl = await uploadFile(file, BUSINESS_LICENSES_FOLDER);

    return {
      url: publicUrl,
      error: null,
    };
  } catch (error) {
    console.error('上传营业执照过程中发生错误:', error);
    return {
      url: null,
      error: '上传过程中发生错误，请重试',
    };
  }
}

/**
 * 删除营业执照
 * @param filePath 文件路径
 * @returns 是否删除成功
 */
export async function deleteBusinessLicense(filePath: string): Promise<boolean> {
  try {
    // 从 URL 中提取路径
    const pathMatch = filePath.match(/\/uploads\/business-licenses\/(.+)/);
    if (pathMatch) {
      return await deleteFile(`business-licenses/${pathMatch[1]}`);
    }
    return false;
  } catch (error) {
    console.error('删除营业执照失败:', error);
    return false;
  }
}

/**
 * 验证文件类型
 * @param file 要验证的文件
 * @param allowedTypes 允许的文件类型数组
 * @returns 是否通过验证
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * 验证文件大小
 * @param file 要验证的文件
 * @param maxSize 最大文件大小（字节）
 * @returns 是否通过验证
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
