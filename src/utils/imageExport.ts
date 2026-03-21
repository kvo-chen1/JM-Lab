/**
 * 图片导出工具
 * 使用 html2canvas 将 DOM 元素导出为图片
 */

import html2canvas from 'html2canvas';

export interface ExportOptions {
  format?: 'png' | 'jpg' | 'jpeg';
  quality?: number;
  scale?: number;
  backgroundColor?: string;
  filename?: string;
}

export interface ExportProgress {
  status: 'preparing' | 'rendering' | 'generating' | 'downloading' | 'completed' | 'error';
  progress: number; // 0-100
  message?: string;
}

/**
 * 导出 DOM 元素为图片
 */
export async function exportElementToImage(
  element: HTMLElement,
  options: ExportOptions = {},
  onProgress?: (progress: ExportProgress) => void
): Promise<string> {
  const {
    format = 'png',
    quality = 0.95,
    scale = 2,
    backgroundColor = '#ffffff',
    filename = 'poster',
  } = options;

  try {
    // 准备阶段
    onProgress?.({
      status: 'preparing',
      progress: 10,
      message: '准备导出...',
    });

    // 确保所有图片都已加载
    const images = element.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }
          })
      )
    );

    onProgress?.({
      status: 'rendering',
      progress: 30,
      message: '渲染画布...',
    });

    // 使用 html2canvas 渲染
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor,
      logging: false,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        // 在克隆的文档中可以做一些调整
        const clonedElement = clonedDoc.body.querySelector('[data-export-element]');
        if (clonedElement) {
          (clonedElement as HTMLElement).style.transform = 'none';
        }
      },
    });

    onProgress?.({
      status: 'generating',
      progress: 70,
      message: '生成图片...',
    });

    // 转换为图片数据
    const imageType = format === 'jpg' || format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(imageType, quality);

    onProgress?.({
      status: 'downloading',
      progress: 90,
      message: '开始下载...',
    });

    // 下载图片
    const link = document.createElement('a');
    link.download = `${filename}.${format}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onProgress?.({
      status: 'completed',
      progress: 100,
      message: '导出完成！',
    });

    return dataUrl;
  } catch (error) {
    console.error('[Image Export] Error:', error);
    onProgress?.({
      status: 'error',
      progress: 0,
      message: error instanceof Error ? error.message : '导出失败',
    });
    throw error;
  }
}

/**
 * 获取图片 Blob
 */
export async function getElementBlob(
  element: HTMLElement,
  options: Omit<ExportOptions, 'filename'> = {}
): Promise<Blob> {
  const { format = 'png', quality = 0.95, scale = 2, backgroundColor = '#ffffff' } = options;

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor,
    logging: false,
  });

  return new Promise((resolve, reject) => {
    const imageType = format === 'jpg' || format === 'jpeg' ? 'image/jpeg' : 'image/png';
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      imageType,
      quality
    );
  });
}

/**
 * 复制图片到剪贴板
 */
export async function copyImageToClipboard(
  element: HTMLElement,
  options: Omit<ExportOptions, 'filename'> = {}
): Promise<void> {
  try {
    const blob = await getElementBlob(element, options);

    // 检查浏览器是否支持 Clipboard API
    if (!navigator.clipboard || !navigator.clipboard.write) {
      throw new Error('浏览器不支持剪贴板 API');
    }

    const item = new ClipboardItem({ [blob.type]: blob });
    await navigator.clipboard.write([item]);
  } catch (error) {
    console.error('[Image Export] Copy failed:', error);
    throw error;
  }
}

/**
 * 预加载图片
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 批量预加载图片
 */
export async function preloadImages(srcs: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(srcs.map((src) => preloadImage(src)));
}

export default {
  exportElementToImage,
  getElementBlob,
  copyImageToClipboard,
  preloadImage,
  preloadImages,
};
