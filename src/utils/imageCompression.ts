export interface CompressionOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  mimeType: string;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  mimeType: 'image/jpeg'
};

export class ImageCompressionService {
  /**
   * 压缩图片
   */
  async compressImage(
    file: File,
    options: Partial<CompressionOptions> = {}
  ): Promise<File> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // 计算缩放比例
          if (width > opts.maxWidth || height > opts.maxHeight) {
            const ratio = Math.min(
              opts.maxWidth / width,
              opts.maxHeight / height
            );
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法获取 Canvas 上下文'));
            return;
          }

          // 绘制图片
          ctx.drawImage(img, 0, 0, width, height);

          // 转换为 Blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: opts.mimeType,
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                reject(new Error('图片压缩失败'));
              }
            },
            opts.mimeType,
            opts.quality
          );
        };

        img.onerror = () => {
          reject(new Error('图片加载失败'));
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * 批量压缩图片
   */
  async compressImages(
    files: File[],
    options: Partial<CompressionOptions> = {},
    onProgress?: (completed: number, total: number) => void
  ): Promise<File[]> {
    const results: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // 只压缩图片
      if (file.type.startsWith('image/')) {
        try {
          const compressed = await this.compressImage(file, options);
          results.push(compressed);
        } catch (error) {
          // 压缩失败时使用原图
          console.warn(`图片 ${file.name} 压缩失败，使用原图:`, error);
          results.push(file);
        }
      } else {
        results.push(file);
      }
      
      onProgress?.(i + 1, files.length);
    }
    
    return results;
  }

  /**
   * 获取图片尺寸
   */
  async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * 检查是否需要压缩
   */
  shouldCompress(file: File, maxSizeKB: number = 500): boolean {
    const sizeKB = file.size / 1024;
    
    // 图片文件且大于阈值
    if (file.type.startsWith('image/') && sizeKB > maxSizeKB) {
      return true;
    }
    
    return false;
  }
}

export const imageCompressionService = new ImageCompressionService();
