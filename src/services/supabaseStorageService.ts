// 存储服务 - 替代 Supabase Storage
import { uploadFile, uploadImage, deleteFile } from './storageServiceNew';

// 默认 bucket 名称（现在作为文件夹使用）
const DEFAULT_FOLDER = 'images';

/**
 * 上传图片到存储服务
 * @param file 图片文件
 * @param path 存储路径（如 'works/123/thumbnail.jpg'）
 * @returns 图片的公共 URL
 */
export async function uploadImageToStorage(
  file: File,
  path: string
): Promise<{ url: string; error?: string }> {
  try {
    // 从路径中提取文件夹
    const folder = path.split('/').slice(0, -1).join('/') || DEFAULT_FOLDER;
    
    // 使用新的存储服务上传
    const url = await uploadImage(file, folder);
    
    return { url };
  } catch (err: any) {
    console.error('[Storage] 上传异常:', err);
    return { url: '', error: err.message };
  }
}

/**
 * 上传 Base64 图片到存储服务
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
    const fileName = path.split('/').pop() || 'image.jpg';
    const file = new File([blob], fileName, { type: mimeType });

    return await uploadImageToStorage(file, path);
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
    // 从 URL 中提取路径
    const pathMatch = path.match(/\/uploads\/(.+)/);
    if (pathMatch) {
      const success = await deleteFile(pathMatch[1]);
      return { success };
    }
    
    // 直接尝试删除
    const success = await deleteFile(path);
    return { success };
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
  if (!path) return '';
  
  // 如果已经是完整 URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 如果已经是 /uploads 开头的路径，直接返回
  if (path.startsWith('/uploads/')) {
    return path;
  }
  
  // 构建完整 URL
  return `/uploads/${path}`;
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
class StorageService {
  /**
   * 上传文件到指定文件夹
   * @param folderName 文件夹名称
   * @param path 存储路径
   * @param file 文件对象
   * @param options 上传选项
   */
  async uploadFile(
    folderName: string,
    path: string,
    file: File,
    options: {
      onProgress?: (progress: number) => void;
      upsert?: boolean;
    } = {}
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      // 使用新的存储服务上传
      const folder = path.split('/').slice(0, -1).join('/') || folderName;
      const url = await uploadFile(file, folder);
      
      return { success: true, path: url };
    } catch (err: any) {
      console.error('[Storage] 上传异常:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * 从指定文件夹删除文件
   * @param folderName 文件夹名称
   * @param path 文件路径
   */
  async deleteFileFromFolder(folderName: string, path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const success = await deleteFile(`${folderName}/${path}`);
      return { success };
    } catch (err: any) {
      console.error('[Storage] 删除异常:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * 获取文件的公共 URL
   * @param folderName 文件夹名称
   * @param path 文件路径
   */
  getPublicUrl(folderName: string, path: string): string {
    return `/uploads/${folderName}/${path}`;
  }
}

export const storageService = new StorageService();

// 为了保持向后兼容，保留旧的导出名称
export const supabaseStorageService = storageService;
