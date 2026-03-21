/**
 * 统一的模型调用工具
 * 根据当前选择的模型自动调用对应的API
 */

import { callQwenChat, callKimiChat } from '@/services/llm/chatProviders';

// 模型类型
export type LLMModelType = 'qwen' | 'kimi';

interface CallModelOptions {
  temperature?: number;
  max_tokens?: number;
  onDelta?: (chunk: string) => void;
}

// localStorage key
const CURRENT_MODEL_KEY = 'agent-current-model';

/**
 * 设置当前模型（由 AgentStore 调用）
 */
export function setCurrentModelInStorage(model: LLMModelType): void {
  try {
    localStorage.setItem(CURRENT_MODEL_KEY, model);
    console.log('[ModelCaller] Model saved to storage:', model);
  } catch (e) {
    console.error('[ModelCaller] Failed to save model:', e);
  }
}

/**
 * 从 storage 获取当前模型
 */
export function getCurrentModelFromStorage(): LLMModelType {
  try {
    const model = localStorage.getItem(CURRENT_MODEL_KEY) as LLMModelType;
    if (model && ['qwen', 'kimi'].includes(model)) {
      return model;
    }
  } catch (e) {
    console.error('[ModelCaller] Failed to get model:', e);
  }
  // 默认返回 qwen
  return 'qwen';
}

/**
 * 根据当前模型调用对应的API
 */
export async function callCurrentModel(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: CallModelOptions
): Promise<string> {
  // 获取当前模型
  const modelId = getCurrentModelFromStorage();

  console.log(`[ModelCaller] Using model: ${modelId}`);

  switch (modelId) {
    case 'kimi':
      // 使用阿里云 DashScope 的 Kimi 模型（kimi-k2.5），复用千问的 API Key
      return callKimiChat({
        model: 'kimi-k2.5',
        messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens || 1500,
        onDelta: options?.onDelta
      });
    case 'qwen':
    default:
      return callQwenChat({
        model: 'qwen3.5-122b-a10b',
        messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens || 1500,
        onDelta: options?.onDelta
      });
  }
}

/**
 * 获取当前模型ID
 */
export function getCurrentModelId(): LLMModelType {
  return getCurrentModelFromStorage();
}

/**
 * 检查当前是否是特定模型
 */
export function isModel(modelId: string): boolean {
  return getCurrentModelFromStorage() === modelId;
}
