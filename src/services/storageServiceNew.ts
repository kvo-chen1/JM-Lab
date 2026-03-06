/**
 * 新的存储服务 - 替代 Supabase Storage
 * 使用本地服务器 API 或 S3 兼容存储
 */

import apiClient from '../lib/apiClient';

// 存储配置
const STORAGE_TYPE = import.meta.env.VITE_STORAGE_TYPE || 'local';
const STORAGE_API_URL = import.meta.env.VITE_STORAGE_API_URL || '/api/storage';
const STORAGE_BASE_URL = import.meta.env.VITE_STORAGE_BASE_URL || '/uploads';

// 上传进度回调类型
export type UploadProgressCallback = (progress: number, stage: 'uploading' | 'processing') => void;

/**
 * 上传文件到存储
 * @param file 要上传的文件
 * @param folder 目标文件夹 (works, avatars, drafts, temp, patterns, knowledge)
 * @param onProgress 进度回调
 * @returns 上传后的文件 URL
 */
export const uploadFile = async (
  file: File,
  folder: string = 'temp',
  onProgress?: UploadProgressCallback
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // 使用 XMLHttpRequest 以便跟踪上传进度
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // 监听上传进度
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress, 'uploading');
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success && response.data?.url) {
              console.log('[StorageService] 上传成功:', response.data.url);
              resolve(response.data.url);
            } else {
              reject(new Error(response.error || '上传失败'));
            }
          } catch {
            reject(new Error('解析响应失败'));
          }
        } else {
          let errorMessage = '上传失败';
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMessage = errorData.error || `HTTP ${xhr.status}`;
          } catch {
            errorMessage = `上传失败: HTTP ${xhr.status}`;
          }
          reject(new Error(errorMessage));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('网络错误，上传失败'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('上传已取消'));
      });

      const uploadUrl = `${STORAGE_API_URL}/${folder}`;
      xhr.open('POST', uploadUrl, true);
      xhr.send(formData);
    });
  } catch (error: any) {
    console.error('[StorageService] 上传失败:', error);
    throw new Error('文件上传失败: ' + (error.message || 'Unknown error'));
  }
};

/**
 * 上传图片
 * @param file 图片文件
 * @param folder 目标文件夹
 * @param onProgress 进度回调
 * @returns 上传后的图片 URL
 */
export const uploadImage = async (
  file: File,
  folder: string = 'works',
  onProgress?: UploadProgressCallback
): Promise<string> => {
  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`不支持的图片类型: ${file.type}`);
  }
  
  return uploadFile(file, folder, onProgress);
};

/**
 * 上传视频
 * @param file 视频文件
 * @param folder 目标文件夹
 * @param onProgress 进度回调
 * @returns 上传后的视频 URL
 */
export const uploadVideo = async (
  file: File,
  folder: string = 'works',
  onProgress?: UploadProgressCallback
): Promise<string> => {
  // 验证文件类型
  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`不支持的视频类型: ${file.type}`);
  }
  
  return uploadFile(file, folder, onProgress);
};

/**
 * 删除文件
 * @param path 文件路径 (格式: folder/filename)
 * @returns 是否删除成功
 */
export const deleteFile = async (path: string): Promise<boolean> => {
  try {
    const response = await apiClient.delete(`${STORAGE_API_URL}/${path}`);
    return response.ok;
  } catch (error) {
    console.error('[StorageService] 删除失败:', error);
    return false;
  }
};

/**
 * 获取文件的公开 URL
 * @param path 文件路径
 * @returns 完整的文件 URL
 */
export const getPublicUrl = (path: string): string => {
  // 如果已经是完整 URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 如果已经是 /uploads 开头的路径，直接返回
  if (path.startsWith('/uploads/')) {
    return path;
  }
  
  // 构建完整 URL
  return `${STORAGE_BASE_URL}/${path}`;
};

/**
 * 从 URL 中提取文件路径
 * @param url 文件 URL
 * @returns 文件路径
 */
export const extractPathFromUrl = (url: string): string | null => {
  // 如果是本地存储 URL
  if (url.includes('/uploads/')) {
    const match = url.match(/\/uploads\/(.*)/);
    return match ? match[1] : null;
  }
  
  return null;
};

/**
 * 检查文件是否存在
 * @param path 文件路径
 * @returns 是否存在
 */
export const fileExists = async (path: string): Promise<boolean> => {
  try {
    const response = await fetch(`${STORAGE_API_URL}/${path}`, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

// 导出配置检查函数
export const isStorageConfigured = (): boolean => {
  return !!STORAGE_API_URL;
};

// 导出存储类型
export const getStorageType = (): string => {
  return STORAGE_TYPE;
};

// 默认导出
export default {
  uploadFile,
  uploadImage,
  uploadVideo,
  deleteFile,
  getPublicUrl,
  extractPathFromUrl,
  fileExists,
  isStorageConfigured,
  getStorageType,
};
