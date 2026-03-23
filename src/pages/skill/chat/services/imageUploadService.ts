/**
 * 图片上传服务
 * 处理 Skill 聊天中的图片上传逻辑
 */

import { uploadImage } from '@/services/storageServiceNew';
import { PastedImage } from '@/components/ImagePasteInput';
import { Attachment } from '../types';
import { toast } from 'sonner';

/**
 * 上传粘贴的图片到 Supabase 存储
 * @param images 粘贴的图片数组
 * @param userId 用户 ID
 * @returns 上传后的附件数组
 */
export async function uploadPastedImages(
  images: PastedImage[],
  userId: string
): Promise<Attachment[]> {
  if (!images || images.length === 0) {
    return [];
  }

  console.log('[imageUploadService] 开始上传图片:', images.length, '张');
  
  const attachments: Attachment[] = [];
  const uploadPromises = images.map(async (image, index) => {
    console.log(`[imageUploadService] 上传第 ${index + 1} 张图片:`, image.name, image.size, 'bytes');
    try {
      // 验证图片
      if (!image.file.type.startsWith('image/')) {
        toast.error(`文件 "${image.name}" 不是有效的图片格式`);
        return null;
      }

      // 验证文件大小（最大 10MB）
      const maxSize = 10 * 1024 * 1024;
      if (image.size > maxSize) {
        toast.error(`图片 "${image.name}" 超过 10MB 限制`);
        return null;
      }

      // 生成唯一的文件名
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const fileExt = image.file.name.split('.').pop() || 'png';
      const fileName = `skill_${userId}_${timestamp}_${randomStr}.${fileExt}`;

      // 上传到 Supabase（使用文件夹名称，而不是完整路径）
      const publicUrl = await uploadImage(image.file, 'skills');

      console.log('[imageUploadService] 上传返回的 URL:', publicUrl);

      if (!publicUrl) {
        toast.error(`图片 "${image.name}" 上传失败`);
        return null;
      }

      // 确保 URL 是完整的（如果不是以 http 开头，则添加后端服务器地址）
      const fullUrl = publicUrl.startsWith('http') ? publicUrl : `${window.location.origin}${publicUrl}`;
      console.log('[imageUploadService] 完整的 URL:', fullUrl);

      // 获取图片尺寸信息
      const dimensions = await getImageDimensions(image.preview);

      // 创建附件对象
      const attachment: Attachment = {
        id: `att_${timestamp}_${randomStr}`,
        type: 'image',
        url: fullUrl,
        thumbnailUrl: fullUrl,
        title: image.name,
        status: 'completed',
        metadata: {
          width: dimensions.width,
          height: dimensions.height,
          size: image.size,
          format: fileExt,
        },
      };

      return attachment;
    } catch (error) {
      console.error('上传图片失败:', error);
      toast.error(`图片 "${image.name}" 上传失败：${error instanceof Error ? error.message : '未知错误'}`);
      return null;
    }
  });

  const results = await Promise.all(uploadPromises);
  
  // 过滤掉失败的上传
  for (const result of results) {
    if (result) {
      attachments.push(result);
    }
  }

  if (attachments.length === 0) {
    toast.error('没有图片上传成功');
  } else if (attachments.length < images.length) {
    toast.warning(`成功上传 ${attachments.length}/${images.length} 张图片`);
  } else {
    toast.success(`成功上传 ${attachments.length} 张图片`);
  }

  return attachments;
}

/**
 * 获取图片尺寸
 */
function getImageDimensions(imageSrc: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
    };
    img.src = imageSrc;
  });
}

/**
 * 上传单个图片文件
 * @param file 图片文件
 * @param userId 用户 ID
 * @param category 分类（用于组织文件路径）
 * @returns 公共访问 URL
 */
export async function uploadSingleImage(
  file: File,
  userId: string,
  category: string = 'general'
): Promise<string | null> {
  try {
    // 验证文件
    if (!file.type.startsWith('image/')) {
      throw new Error('不是有效的图片文件');
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('图片大小超过 10MB 限制');
    }

    // 生成文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${category}_${userId}_${timestamp}_${randomStr}.${fileExt}`;

    // 上传（使用文件夹名称）
    const publicUrl = await uploadImage(file, category);

    if (!publicUrl) {
      throw new Error('上传失败');
    }

    return publicUrl;
  } catch (error) {
    console.error('上传单个图片失败:', error);
    toast.error(`图片上传失败：${error instanceof Error ? error.message : '未知错误'}`);
    return null;
  }
}
