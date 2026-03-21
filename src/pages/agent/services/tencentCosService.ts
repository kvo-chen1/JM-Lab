/**
 * 腾讯云 COS 上传服务 - 前端
 * 使用后端 API 上传文件到腾讯云 COS
 */

import { toast } from 'sonner';

export interface COSUploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
  type: string;
}

export type UploadProgressCallback = (progress: number) => void;

/**
 * 上传图片到腾讯云 COS
 * 
 * @param file 图片文件
 * @param onProgress 进度回调
 * @returns 上传结果
 */
export async function uploadImageToCOS(
  file: File,
  onProgress?: UploadProgressCallback
): Promise<COSUploadResult> {
  console.log('[COS] Starting upload for file:', file.name, 'type:', file.type, 'size:', file.size);
  
  // 验证文件类型
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('不支持的图片格式，请上传 JPG、PNG、GIF 或 WebP 格式');
  }

  // 验证文件大小（最大 10MB）
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('图片大小不能超过 10MB');
  }

  try {
    if (onProgress) onProgress(10);

    // 创建 FormData
    const formData = new FormData();
    formData.append('file', file);

    if (onProgress) onProgress(30);

    // 调用后端 API 上传到 COS
    const response = await fetch('/api/storage/uploads', {
      method: 'POST',
      body: formData,
    });

    if (onProgress) onProgress(70);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '上传失败' }));
      throw new Error(errorData.error || `上传失败: ${response.status}`);
    }

    const result = await response.json();

    if (onProgress) onProgress(100);

    console.log('[COS] Upload successful:', result.data);
    toast.success('上传成功');

    return {
      url: result.data.url,
      path: result.data.path,
      name: file.name,
      size: result.data.size,
      type: result.data.mimetype,
    };
  } catch (error: any) {
    console.error('[COS] Error:', error);
    toast.error(`上传失败：${error.message}`);
    throw error;
  }
}

/**
 * 批量上传图片到 COS
 */
export async function uploadImagesToCOS(
  files: File[],
  onProgress?: UploadProgressCallback
): Promise<COSUploadResult[]> {
  console.log('[COS] Starting batch upload for', files.length, 'files');
  const results: COSUploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const overallProgress = Math.round((i / files.length) * 100);
      if (onProgress) onProgress(overallProgress);
      
      const result = await uploadImageToCOS(files[i]);
      results.push(result);
      console.log(`[COS] File ${i + 1}/${files.length} uploaded successfully`);
    } catch (error) {
      console.error(`[COS] Failed to upload ${files[i].name}:`, error);
      // 继续上传其他文件
    }
  }

  if (onProgress) onProgress(100);
  console.log('[COS] Batch upload complete:', results.length, 'files uploaded');
  return results;
}

/**
 * 从 COS 删除文件
 */
export async function deleteImageFromCOS(url: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/storage/${encodeURIComponent(url)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('删除失败');
    }

    console.log('[COS] File deleted successfully:', url);
    return true;
  } catch (error) {
    console.error('[COS] Failed to delete:', error);
    return false;
  }
}
