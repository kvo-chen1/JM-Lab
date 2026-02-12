import apiClient from '@/lib/apiClient'
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
 * 带有重试机制和超时控制的Fetch
 */
async function fetchWithRetry(url: string, options: RequestInit & { timeout?: number, retries?: number } = {}): Promise<Response> {
  const { timeout = 30000, retries = 2, ...fetchOptions } = options;
  
  let lastError: any;
  
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // 如果外部传入了signal，需要合并abort事件
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
      
      // 如果是5xx错误，尝试重试
      if (response.status >= 500 && i < retries) {
        lastError = new Error(`Server Error: ${response.status}`);
        console.warn(`请求失败 ${response.status}，正在重试 (${i+1}/${retries})...`);
        // 指数退避
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
        continue;
      }
      
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;
      
      // 如果是AbortError（超时或用户取消），不重试
      if (error.name === 'AbortError') {
        throw error;
      }
      
      // 如果还有重试次数，等待后重试
      if (i < retries) {
        console.warn(`请求出错 ${error.message}，正在重试 (${i+1}/${retries})...`);
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
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
    const response = await fetchWithRetry('/api/kimi/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: params.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ }));
      const errorMessage = errorData.error?.message || errorData.error || response.statusText;
      throw new Error(`Kimi API请求失败: ${response.status} - ${errorMessage}`);
    }

    if (params.onDelta) {
      return handleSseStreamingResponse(response, params.onDelta);
    }

    const data = await response.json();
    const responseData = data.ok ? data.data : data;
    return responseData?.choices?.[0]?.message?.content || '未获取到响应';
  } catch (error: any) {
    console.error('Kimi Chat Error:', error);
    throw error;
  }
}

export async function callDeepseekChat(params: ChatCallParams): Promise<string> {
  const payload = {
    model: params.model,
    messages: params.messages.map(msg => ({ role: msg.role, content: msg.content })),
    stream: !!params.onDelta,
    temperature: params.temperature,
    top_p: params.top_p,
    max_tokens: params.max_tokens,
  };

  try {
    const response = await fetchWithRetry('/api/deepseek/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: params.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ }));
      const errorMessage = errorData.error?.message || errorData.error || response.statusText;
      throw new Error(`DeepSeek API请求失败: ${response.status} - ${errorMessage}`);
    }

    if (params.onDelta) {
      return handleSseStreamingResponse(response, params.onDelta);
    }

    const data = await response.json();
    const responseData = data.ok ? data.data : data;
    return responseData?.choices?.[0]?.message?.content || '未获取到响应';
  } catch (error: any) {
    console.error('DeepSeek Chat Error:', error);
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
    const response = await fetchWithRetry('/api/qwen/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: params.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ }));
      const errorMessage = errorData.error?.message || errorData.error || response.statusText;
      throw new Error(`通义千问API请求失败: ${response.status} - ${errorMessage}`);
    }

    if (params.onDelta) {
      return handleSseStreamingResponse(response, params.onDelta);
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
    console.error('Qwen Chat Error:', error);
    throw error;
  }
}
