import type { ElementType, Bounds, IsolatedElement, CardPosition } from '../hooks/useCanvasStore';

export interface DetectedElement {
  id: string;
  name: string;
  type: ElementType;
  bounds: Bounds;
  confidence: number;
}

export interface ElementDetectionResult {
  elements: DetectedElement[];
}

export interface IsolationResult {
  elementId: string;
  isolatedImageUrl: string;
  maskUrl?: string;
}

// 模拟检测到的元素数据（用于开发测试）
const MOCK_DETECTED_ELEMENTS: DetectedElement[] = [
  {
    id: 'elem_1',
    name: '包装盒',
    type: 'product',
    bounds: { x: 50, y: 50, width: 200, height: 200 },
    confidence: 0.95,
  },
  {
    id: 'elem_2',
    name: '杯子',
    type: 'product',
    bounds: { x: 300, y: 100, width: 150, height: 180 },
    confidence: 0.92,
  },
  {
    id: 'elem_3',
    name: '信封',
    type: 'product',
    bounds: { x: 100, y: 300, width: 180, height: 120 },
    confidence: 0.88,
  },
  {
    id: 'elem_4',
    name: '卡片',
    type: 'product',
    bounds: { x: 350, y: 320, width: 120, height: 80 },
    confidence: 0.85,
  },
];

/**
 * 分析图片并识别可分离的元素
 * 第一阶段：使用 AI 视觉模型分析图片内容
 * 
 * TODO: 后续需要接入真实的 AI 图像识别服务
 */
export async function detectElements(imageUrl: string): Promise<ElementDetectionResult> {
  console.log('[ElementIsolation] 开始检测图片元素:', imageUrl.substring(0, 50));
  
  // 模拟 API 调用延迟
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // 返回模拟数据
  return {
    elements: MOCK_DETECTED_ELEMENTS.map(el => ({
      ...el,
      id: `${el.id}_${Date.now()}`,
    })),
  };
}

/**
 * 分离指定元素
 * 使用图像处理技术分离元素
 * 
 * TODO: 后续需要接入真实的图像分割服务（如 SAM 模型或 Remove.bg API）
 */
export async function isolateElement(
  imageUrl: string,
  bounds: Bounds,
  elementName: string
): Promise<IsolationResult> {
  console.log('[ElementIsolation] 开始分离元素:', elementName, bounds);
  
  // 模拟 API 调用延迟
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 目前返回原图作为占位，后续需要实现真实的图像分割
  // 可以使用以下方案：
  // 1. 使用 Canvas 裁剪指定区域
  // 2. 调用 Remove.bg API 移除背景
  // 3. 使用 SAM (Segment Anything Model) 进行智能分割
  
  return {
    elementId: `isolated_${Date.now()}`,
    isolatedImageUrl: imageUrl, // 暂时返回原图
  };
}

/**
 * 批量分离多个元素
 */
export async function isolateElements(
  imageUrl: string,
  detectionResult: ElementDetectionResult
): Promise<IsolationResult[]> {
  console.log('[ElementIsolation] 开始批量分离元素，数量:', detectionResult.elements.length);
  
  // 并行处理多个元素的分离
  const promises = detectionResult.elements.map(el => 
    isolateElement(imageUrl, el.bounds, el.name)
  );
  
  return Promise.all(promises);
}

/**
 * 创建默认的 IsolatedElement 对象
 */
export function createDefaultIsolatedElement(
  detectedElement: DetectedElement,
  parentWorkId: string,
  isolatedImageUrl: string,
  index: number
): IsolatedElement {
  // 计算默认位置，让元素在画布上均匀分布
  const cols = 3;
  const col = index % cols;
  const row = Math.floor(index / cols);
  const gap = 40;
  const startX = 100;
  const startY = 100;
  
  return {
    id: detectedElement.id,
    parentWorkId,
    name: detectedElement.name,
    type: detectedElement.type,
    originalBounds: detectedElement.bounds,
    isolatedImageUrl,
    position: {
      x: startX + col * (detectedElement.bounds.width + gap),
      y: startY + row * (detectedElement.bounds.height + gap),
      width: detectedElement.bounds.width,
      height: detectedElement.bounds.height,
    },
    transform: {
      scale: 1,
      rotation: 0,
      flipX: false,
      flipY: false,
    },
    style: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      opacity: 100,
      blendMode: 'normal',
    },
    isVisible: true,
    isLocked: false,
    zIndex: index,
  };
}

/**
 * 使用 Canvas 裁剪图片指定区域
 * 这是一个简单的元素分离实现，仅做裁剪，不移除背景
 */
export async function cropImageRegion(
  imageUrl: string,
  bounds: Bounds
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = bounds.width;
        canvas.height = bounds.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建 canvas context'));
          return;
        }
        
        // 绘制裁剪区域
        ctx.drawImage(
          img,
          bounds.x,
          bounds.y,
          bounds.width,
          bounds.height,
          0,
          0,
          bounds.width,
          bounds.height
        );
        
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = imageUrl;
  });
}

/**
 * 使用 AI 服务进行智能元素识别和分离
 * 这是完整的流程：检测 -> 分离 -> 创建元素对象
 */
export async function performElementIsolation(
  imageUrl: string,
  parentWorkId: string
): Promise<IsolatedElement[]> {
  console.log('[ElementIsolation] 开始完整的元素分离流程');
  
  try {
    // 1. 检测元素
    const detectionResult = await detectElements(imageUrl);
    
    if (detectionResult.elements.length === 0) {
      console.warn('[ElementIsolation] 未检测到可分离的元素');
      return [];
    }
    
    // 2. 分离每个元素（使用裁剪作为临时方案）
    const isolatedElements: IsolatedElement[] = [];
    
    for (let i = 0; i < detectionResult.elements.length; i++) {
      const detected = detectionResult.elements[i];
      
      try {
        // 使用 Canvas 裁剪
        const croppedUrl = await cropImageRegion(imageUrl, detected.bounds);
        
        // 创建 IsolatedElement 对象
        const element = createDefaultIsolatedElement(
          detected,
          parentWorkId,
          croppedUrl,
          i
        );
        
        isolatedElements.push(element);
      } catch (error) {
        console.error(`[ElementIsolation] 分离元素失败: ${detected.name}`, error);
      }
    }
    
    console.log('[ElementIsolation] 元素分离完成，共', isolatedElements.length, '个');
    return isolatedElements;
  } catch (error) {
    console.error('[ElementIsolation] 元素分离流程失败:', error);
    throw error;
  }
}
