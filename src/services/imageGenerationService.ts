/**
 * 图片生成服务
 * 调用 AI API 生成图片
 */

export interface GenerateImageParams {
  prompt: string;
  size?: string;
  model?: string;
  n?: number;
}

export interface GenerateImageResult {
  data?: Array<{
    url: string;
    revised_prompt?: string;
  }>;
  created?: number;
}

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 生成图片
 * 调用后端 API 生成图片，带重试机制
 */
export async function generateImage(
  params: GenerateImageParams,
  retryCount = 0
): Promise<GenerateImageResult> {
  const { prompt, size = '1024x1024', model = 'qwen-image-2.0-pro', n = 1 } = params;
  const maxRetries = 3;

  try {
    const response = await fetch('/api/qwen/images/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        size,
        model,
        n,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // 如果是 429 (Too Many Requests) 或 403 (Forbidden)，等待后重试
      if ((response.status === 429 || response.status === 403) && retryCount < maxRetries) {
        const waitTime = Math.pow(2, retryCount) * 2000; // 指数退避: 2s, 4s, 8s
        console.log(`[Image Generation] Rate limited, waiting ${waitTime}ms before retry ${retryCount + 1}/${maxRetries}`);
        await delay(waitTime);
        return generateImage(params, retryCount + 1);
      }
      
      throw new Error(errorData.message || `生成失败: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(result.error || result.message || '生成失败');
    }

    return result.data || {};
  } catch (error) {
    console.error('[Image Generation] Error:', error);
    throw error;
  }
}

/**
 * 批量生成图片（带延迟）
 */
export async function generateImagesWithDelay(
  items: Array<{ key: string; prompt: string; label: string }>,
  onProgress?: (key: string, url: string) => void,
  onError?: (key: string, error: Error) => void
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  const delayBetweenRequests = 3000; // 每个请求间隔 3 秒

  for (const item of items) {
    try {
      console.log(`[Image Generation] Generating ${item.label}...`);
      const result = await generateImage({ prompt: item.prompt });
      const url = result.data?.[0]?.url;
      
      if (url) {
        results[item.key] = url;
        onProgress?.(item.key, url);
      }
    } catch (error) {
      console.error(`[Image Generation] Failed to generate ${item.label}:`, error);
      onError?.(item.key, error as Error);
    }

    // 等待一段时间再发送下一个请求
    if (items.indexOf(item) < items.length - 1) {
      await delay(delayBetweenRequests);
    }
  }

  return results;
}

export default {
  generateImage,
  generateImagesWithDelay,
};
