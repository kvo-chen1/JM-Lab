import { callQwenChat } from '@/services/llm/chatProviders';
import type { ChatMessage } from '../types';

export interface ChatContext {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  systemPrompt?: string;
}

export interface StreamResponse {
  content: string;
  isComplete: boolean;
}

// 系统提示词
const DEFAULT_SYSTEM_PROMPT = `你是津小脉 Skill Agent，一个专业的 AI 创作助手。你的任务是理解用户的需求，并调用相应的 Skill 技能来完成创作任务。

你可以帮助用户完成以下类型的任务：
1. 图片生成 - 根据描述生成图片、Logo设计、海报设计等
2. 文案创作 - 品牌文案、营销文案、社交媒体内容等
3. 配色方案 - 为品牌或设计项目推荐配色
4. 创意点子 - 提供营销创意、活动方案等
5. 联网搜索 - 搜索网络信息、查资料、获取最新资讯等

在对话中，你应该：
- 友好、专业地回应用户
- 理解用户的意图并确认需求细节
- 在生成内容前，先说明你的计划
- 生成完成后，询问用户是否需要调整
- 如果用户不满意，主动提供修改建议
- 当用户需要搜索网络信息时，调用联网搜索功能获取实时资讯

记住：你是助手，不是替代者。你的目标是帮助用户更好地完成创作。`;

// 创建聊天上下文
export const createChatContext = (
  history: ChatMessage[],
  systemPrompt: string = DEFAULT_SYSTEM_PROMPT
): ChatContext => {
  const messages = history.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'assistant' as const,
    content: msg.content,
  }));

  return {
    messages,
    systemPrompt,
  };
};

// 发送消息并获取流式响应
export const sendMessageStream = async (
  userMessage: string,
  context: ChatContext,
  onDelta: (delta: string) => void,
  signal?: AbortSignal
): Promise<string> => {
  const messages = [
    { role: 'system' as 'system', content: context.systemPrompt || DEFAULT_SYSTEM_PROMPT },
    ...context.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as 'user', content: userMessage },
  ];

  try {
    const response = await callQwenChat({
      model: 'qwen-turbo',
      messages,
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 2000,
      onDelta,
      signal,
    });

    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('请求已取消');
    }
    console.error('[ChatService] Error:', error);
    throw error;
  }
};

// 发送消息并获取完整响应（非流式）
export const sendMessage = async (
  userMessage: string,
  context: ChatContext,
  signal?: AbortSignal
): Promise<string> => {
  const messages = [
    { role: 'system' as 'system', content: context.systemPrompt || DEFAULT_SYSTEM_PROMPT },
    ...context.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as 'user', content: userMessage },
  ];

  try {
    const response = await callQwenChat({
      model: 'qwen-turbo',
      messages,
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 2000,
      signal,
    });

    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('请求已取消');
    }
    console.error('[ChatService] Error:', error);
    throw error;
  }
};

// 生成图片
export const generateImage = async (
  prompt: string,
  options?: {
    size?: '1024x1024' | '1024x1792' | '1792x1024';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
  },
  signal?: AbortSignal
): Promise<string> => {
  console.log('[ChatService] Generating image with prompt:', prompt);

  // 最大重试次数
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 调用真实的图片生成 API
      const { generateImage: generateImageAPI } = await import('@/services/imageGenerationService');

      const result = await generateImageAPI({
        prompt: prompt,
        size: options?.size || '1024x1024',
        model: 'qwen-image-2.0-pro',
        n: 1,
      });

      const imageUrl = result.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error('API 返回的图片 URL 为空');
      }

      console.log('[ChatService] Image generated successfully:', imageUrl);
      return imageUrl;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('图片生成失败');
      console.error(`[ChatService] Image generation failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);

      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 指数退避：1s, 2s
        console.log(`[ChatService] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // 所有重试都失败了，抛出错误
  throw new Error(lastError?.message || '图片生成失败，请稍后重试');
};

// 生成文案
export const generateCopy = async (
  prompt: string,
  type: 'brand' | 'marketing' | 'social',
  context: ChatContext,
  signal?: AbortSignal
): Promise<string> => {
  const typePrompts = {
    brand: '请为品牌创作一段宣传文案，要求：',
    marketing: '请创作一段营销文案，要求：',
    social: '请创作一段适合社交媒体发布的文案，要求：',
  };

  const fullPrompt = `${typePrompts[type]}${prompt}`;
  
  return sendMessage(fullPrompt, context, signal);
};

// 推荐配色方案
export const generateColorScheme = async (
  description: string,
  context: ChatContext,
  signal?: AbortSignal
): Promise<string> => {
  const prompt = `请根据以下描述推荐一套配色方案：
${description}

请提供：
1. 主色调（1-2个）
2. 辅助色（2-3个）
3. 文字色（深/浅各一个）
4. 每种颜色的 HEX 代码
5. 配色说明和使用建议`;

  return sendMessage(prompt, context, signal);
};

// 生成创意点子
export const generateIdeas = async (
  topic: string,
  count: number = 5,
  context: ChatContext,
  signal?: AbortSignal
): Promise<string> => {
  const prompt = `请围绕"${topic}"这个主题，提供${count}个创新的营销或设计点子。

对于每个点子，请说明：
1. 点子名称
2. 核心创意
3. 适用场景
4. 预期效果

请确保点子具有创意性和可执行性。`;

  return sendMessage(prompt, context, signal);
};

export default {
  createChatContext,
  sendMessageStream,
  sendMessage,
  generateImage,
  generateCopy,
  generateColorScheme,
  generateIdeas,
};
