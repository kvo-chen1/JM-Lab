/**
 * 文件上传服务
 */

import { toast } from 'sonner';

/**
 * 上传结果接口
 */
export interface UploadResult {
  url: string;
  name: string;
  size: number;
  type: string;
}

/**
 * 上传进度回调
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * 上传图片文件
 * 
 * @param file 图片文件
 * @param onProgress 进度回调
 * @returns 上传结果
 */
export async function uploadImage(
  file: File,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
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
    // 模拟上传进度
    if (onProgress) {
      onProgress(0);
      // 模拟上传过程
      await new Promise(resolve => setTimeout(resolve, 500));
      onProgress(30);
      await new Promise(resolve => setTimeout(resolve, 300));
      onProgress(60);
      await new Promise(resolve => setTimeout(resolve, 200));
      onProgress(80);
      await new Promise(resolve => setTimeout(resolve, 200));
      onProgress(100);
    }

    // TODO: 实际项目中应该上传到云存储
    // 这里使用本地 URL 作为示例
    const localUrl = URL.createObjectURL(file);

    toast.success('上传成功');

    return {
      url: localUrl,
      name: file.name,
      size: file.size,
      type: file.type
    };
  } catch (error: any) {
    console.error('[Upload] Error:', error);
    toast.error(`上传失败：${error.message}`);
    throw error;
  }
}

/**
 * 批量上传图片
 */
export async function uploadImages(
  files: File[],
  onProgress?: UploadProgressCallback
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadImage(files[i], onProgress);
      results.push(result);
    } catch (error) {
      console.error(`[Upload] Failed to upload ${files[i].name}:`, error);
      // 继续上传其他文件
    }
  }

  return results;
}

/**
 * 删除上传的文件
 */
export function deleteUpload(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
