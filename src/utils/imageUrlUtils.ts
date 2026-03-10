// 处理图片URL的工具函数

/**
 * 图片质量等级
 */
export type ImageQuality = 'low' | 'medium' | 'high';

/**
 * 图片尺寸配置
 */
export interface ImageSize {
  width: number;
  height: number;
}

/**
 * 图片处理选项
 */
export interface ImageProcessingOptions {
  quality?: ImageQuality;
  width?: number;
  height?: number;
  format?: 'webp' | 'jpeg' | 'png';
  autoFormat?: boolean;
  responsive?: boolean;
}

/**
 * 将质量等级转换为具体的质量数值
 * @param quality 质量等级
 * @returns 质量数值 (0-100)
 */
export function qualityToValue(quality: ImageQuality): number {
  switch (quality) {
    case 'low':
      return 60;
    case 'medium':
      return 80;
    case 'high':
      return 95;
    default:
      return 80;
  }
}

/**
 * 检测浏览器是否支持WebP格式
 * @returns 是否支持WebP
 */
export function supportsWebP(): boolean {
  if (typeof window === 'undefined') {
    return true; // 服务端渲染默认支持
  }
  
  // 检查浏览器是否支持WebP
  try {
    const img = new Image();
    return img.srcset?.includes?.('webp') !== undefined || (window as any).createImageBitmap;
  } catch {
    return false;
  }
}

/**
 * 根据设备像素比和屏幕尺寸计算合适的图片尺寸
 * @param baseWidth 基础宽度
 * @param baseHeight 基础高度
 * @returns 计算后的图片尺寸
 */
export function calculateResponsiveSize(baseWidth: number, baseHeight: number): ImageSize {
  if (typeof window === 'undefined') {
    return { width: baseWidth, height: baseHeight };
  }
  
  // 获取设备像素比
  const dpr = Math.min(window.devicePixelRatio || 1, 2); // 最大支持2x
  
  // 获取屏幕宽度
  const screenWidth = window.innerWidth;
  
  // 根据屏幕宽度调整图片尺寸
  let scaleFactor = 1;
  if (screenWidth < 640) {
    // 移动端
    scaleFactor = 0.75;
  } else if (screenWidth < 1024) {
    // 平板
    scaleFactor = 1;
  }
  
  // 计算最终尺寸
  const width = Math.round(baseWidth * scaleFactor * dpr);
  const height = Math.round(baseHeight * scaleFactor * dpr);
  
  return { width, height };
}

/**
 * 处理图片URL，添加压缩和格式转换支持
 * @param url 原始图片URL
 * @param options 图片处理选项
 * @returns 处理后的图片URL
 */
export function processImageUrl(url: string, options: ImageProcessingOptions = {}): string {
  if (!url) {
    console.warn('Empty URL provided to processImageUrl');
    return '';
  }
  
  try {
    // 直接返回base64数据URL
    if (url.startsWith('data:')) {
      return url;
    }
    
    // 直接返回相对路径（本地存储的图片）
    if (url.startsWith('/')) {
      return url;
    }
    
    // 直接返回trae-api相关URL
    if (url.includes('trae-api')) {
      return url;
    }
    
    // 直接返回已知图片服务URL
    const knownImageServices = [
      'unsplash.com',
      'picsum.photos',
      'images.pexels.com',
      'pixabay.com',
      'cdn.pixabay.com',
      'i.imgur.com',
      'imgur.com',
      'via.placeholder.com',
      'placehold.co'
    ];
    
    for (const service of knownImageServices) {
      if (url.includes(service)) {
        return url;
      }
    }
    
    // 处理代理URL，提取真实URL
    if (url.includes('jinmalab.tech/proxy?url=')) {
      try {
        const urlObj = new URL(url);
        const realUrl = urlObj.searchParams.get('url');
        return realUrl || url;
      } catch (error) {
        console.warn('Failed to parse proxy URL, returning original:', url, error);
        return url;
      }
    }
    
    // 检测 Supabase Storage URL（已无法访问）
    if (url.includes('supabase.co/storage')) {
      console.warn('[processImageUrl] Supabase Storage URL detected (deprecated):', url.substring(0, 50));
      // 返回空字符串，让调用方使用 fallback 图片
      return '';
    }
    
    // 其他所有URL直接返回
    return url;
  } catch (error) {
    console.warn('Error processing URL, returning original:', url, error);
    return url;
  }
}

/**
 * 批量处理图片URL数组
 * @param urls 原始图片URL数组
 * @param options 图片处理选项
 * @returns 处理后的图片URL数组
 */
export function processImageUrls(urls: string[], options: ImageProcessingOptions = {}): string[] {
  return urls.map(url => processImageUrl(url, options));
}

/**
 * 生成内联 SVG 占位图
 * @param text 显示文本
 * @param width 宽度
 * @param height 高度
 * @param bgColor 背景色
 * @param textColor 文字色
 * @returns base64 编码的 SVG 数据 URL
 */
export function generatePlaceholderSvg(
  text: string = '图片',
  width: number = 600,
  height: number = 400,
  bgColor: string = '#e5e7eb',
  textColor: string = '#9ca3af'
): string {
  const safeText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 10);
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" fill="${bgColor}"/><text x="50%" y="50%" font-family="Arial" font-size="24" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${safeText}</text></svg>`;
  const base64 = typeof window !== 'undefined'
    ? btoa(unescape(encodeURIComponent(svg)))
    : Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * 构建响应式图片srcset属性
 * @param url 基础图片URL
 * @param widths 宽度数组
 * @param quality 质量等级
 * @returns srcset属性值
 */
export function buildSrcSet(url: string, widths: number[], quality: ImageQuality = 'medium'): string {
  if (!url || !widths || widths.length === 0) {
    return '';
  }
  
  // 检测是否支持WebP
  const useWebP = supportsWebP();
  const qualityValue = qualityToValue(quality);
  
  return widths
    .map(width => {
      // 为每个宽度构建URL
      try {
        const sizedUrl = processImageUrl(url, { 
          width, 
          quality, 
          autoFormat: true 
        });
        // 如果处理后的URL为空，但原始URL有效，使用原始URL
        return `${sizedUrl || url} ${width}w`;
      } catch (error) {
        console.error('Error building srcset for URL:', url, error);
        // 出错时使用原始URL
        return `${url} ${width}w`;
      }
    })
    .join(', ');
}
