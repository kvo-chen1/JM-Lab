import { handleSseStreamingResponse } from './streaming'
import type { Message } from '../llmService'

interface ChatCallParams {
  model: string
  messages: Message[]
  temperature?: number
  top_p?: number
  max_tokens?: number
  signal?: AbortSignal
  onDelta?: (chunk: string) => void
}

/**
 * 带有重试机制和超时控制的 Fetch
 * 优化：减少超时时间和重试延迟
 */
async function fetchWithRetry(url: string, options: RequestInit & { timeout?: number, retries?: number } = {}): Promise<Response> {
  // 优化：减少默认超时时间从 60 秒到 30 秒
  const { timeout = 30000, retries = 1, ...fetchOptions } = options;

  let lastError: any;

  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // 如果外部传入了 signal，需要合并 abort 事件
    if (fetchOptions.signal) {
      fetchOptions.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        controller.abort();
      });
      if (fetchOptions.signal.aborted) {
         clearTimeout(timeoutId);
         controller.abort();
      }
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // 如果是 5xx 错误，尝试重试
      if (response.status >= 500 && i < retries) {
        lastError = new Error(`Server Error: ${response.status}`);
        console.warn(`请求失败 ${response.status}，正在重试 (${i+1}/${retries})...`);
        // 优化：使用固定 500ms 延迟代替指数退避
        await new Promise(r => setTimeout(r, 500));
        continue;
      }

      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;

      // 如果是 AbortError（超时或用户取消），不重试
      if (error.name === 'AbortError') {
        throw error;
      }

      // 如果还有重试次数，等待后重试
      if (i < retries) {
        console.warn(`请求出错 ${error.message}，正在重试 (${i+1}/${retries})...`);
        // 优化：使用固定 500ms 延迟代替指数退避
        await new Promise(r => setTimeout(r, 500));
        continue;
      }
    }
  }

  throw lastError;
}

export async function callKimiChat(params: ChatCallParams): Promise<string> {
  const payload = {
    model: params.model,
    messages: params.messages.map(msg => ({ role: msg.role, content: msg.content })),
    stream: !!params.onDelta,
    temperature: params.temperature,
    top_p: params.top_p,
    max_tokens: params.max_tokens,
  };

  try {
    console.log('[KimiChat] Calling API with model:', params.model);
    
    // 如果是流式请求，直接使用 fetch 而不是 fetchWithRetry，避免重试导致的延迟
    if (params.onDelta) {
      const controller = new AbortController();
      if (params.signal) {
        params.signal.addEventListener('abort', () => controller.abort());
      }
      
      const response = await fetch('/api/kimi/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ }));
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }
      
      // 处理流式响应
      return handleSseStreamingResponse(response, params.onDelta);
    }
    
    const response = await fetchWithRetry('/api/kimi/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: params.signal,
      timeout: 30000, // 优化：从 120 秒减少到 30 秒
    });

    console.log('[KimiChat] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ }));
      const errorMessage = errorData.error?.message || errorData.error || response.statusText;
      console.error('[KimiChat] API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      // 针对 401 错误提供友好的提示
      if (response.status === 401) {
        throw new Error('Kimi API 密钥无效或缺失。请检查服务器配置或联系管理员。');
      }
      
      // 针对 403 错误（权限不足/访问被禁止）
      if (response.status === 403) {
        const detailedMessage = errorData.message || errorData.error?.message || '';
        console.error('[KimiChat] 403 Error details:', { errorData, detailedMessage });
        throw new Error(`Kimi API 访问被拒绝 (403)。可能原因：1. API Key 无效或过期 2. 账户余额不足 3. 请求频率超限。详细信息：${detailedMessage || '无'}`);
      }
      
      // 针对 429 错误（请求过于频繁）
      if (response.status === 429) {
        throw new Error('Kimi API 请求过于频繁，请稍后再试。');
      }
      
      // 针对 503 错误（服务不可用）
      if (response.status === 503) {
        throw new Error('Kimi 服务暂时不可用，请稍后再试。');
      }
      
      throw new Error(`Kimi API 请求失败：${response.status} - ${errorMessage}`);
    }

    const data = await response.json();
    const responseData = data.ok ? data.data : data;
    return responseData?.choices?.[0]?.message?.content || '未获取到响应';
  } catch (error: any) {
    // 如果是 AbortError（请求被取消），不记录为错误，这是正常行为
    if (error.name === 'AbortError') {
      console.log('[KimiChat] Request was aborted (normal behavior)');
      throw error;
    }
    console.error('Kimi Chat Error:', error);
    throw error;
  }
}

export async function callQwenChat(params: ChatCallParams): Promise<string> {
  const payload = {
    model: params.model,
    messages: params.messages.map(msg => ({ role: msg.role, content: msg.content })),
    stream: !!params.onDelta,
    temperature: params.temperature,
    top_p: params.top_p,
    max_tokens: params.max_tokens,
  };

  try {
    console.log('[QwenChat] Calling API with model:', params.model);
    
    // 如果是流式请求，直接使用 fetch 而不是 fetchWithRetry，避免重试导致的延迟
    if (params.onDelta) {
      const controller = new AbortController();
      if (params.signal) {
        params.signal.addEventListener('abort', () => controller.abort());
      }
      
      const response = await fetch('/api/qwen/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ }));
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }
      
      // 处理流式响应
      return handleSseStreamingResponse(response, params.onDelta);
    }
    
    const response = await fetchWithRetry('/api/qwen/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: params.signal,
      timeout: 30000, // 优化：从 120 秒减少到 30 秒
    });

    console.log('[QwenChat] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ }));
      const errorMessage = errorData.error?.message || errorData.error || response.statusText;
      console.error('[QwenChat] API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      // 针对 401 错误提供友好的提示
      if (response.status === 401) {
        throw new Error('通义千问 API 密钥无效或缺失。请检查服务器配置或联系管理员。');
      }
      
      // 针对 403 错误（权限不足/访问被禁止）
      if (response.status === 403) {
        throw new Error('通义千问 API 访问被拒绝。可能原因：1. API Key 无权访问该模型 2. 账户余额不足 3. 请求频率超限。请检查账户状态或联系管理员。');
      }
      
      // 针对 429 错误（请求过于频繁）
      if (response.status === 429) {
        throw new Error('通义千问 API 请求过于频繁，请稍后再试。');
      }
      
      // 针对 503 错误（服务不可用）
      if (response.status === 503) {
        throw new Error('通义千问服务暂时不可用，请稍后再试。');
      }
      
      throw new Error(`通义千问 API 请求失败：${response.status} - ${errorMessage}`);
    }

    const data = await response.json();
    console.log('[QwenChat] Raw response data:', JSON.stringify(data).substring(0, 500));
    const responseData = data.ok ? data.data : data;
    const finalData = responseData.data || responseData;
    console.log('[QwenChat] Final data:', JSON.stringify(finalData).substring(0, 500));
    const text = finalData.output?.text || finalData.choices?.[0]?.message?.content || '未获取到响应';
    console.log('[QwenChat] Extracted text:', text.substring(0, 100));
    return text;
  } catch (error: any) {
    // 如果是 AbortError（请求被取消），不记录为错误，这是正常行为
    if (error.name === 'AbortError') {
      console.log('[QwenChat] Request was aborted (normal behavior)');
      throw error;
    }
    console.error('Qwen Chat Error:', error);
    throw error;
  }
}
