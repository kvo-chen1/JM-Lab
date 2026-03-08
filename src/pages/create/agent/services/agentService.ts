// Agent服务层 - 处理与AI相关的API调用

import { AgentMessage, DesignTask, GeneratedOutput, AgentType, PRESET_STYLES } from '../types/agent';
import { llmService } from '@/services/llmService';
import { callQwenChat } from '@/services/llm/chatProviders';
import {
  DIRECTOR_SYSTEM_PROMPT,
  DESIGNER_SYSTEM_PROMPT,
  REQUIREMENT_ANALYSIS_PROMPT,
  buildImageGenerationPrompt,
  STYLE_RECOMMENDATION_PROMPT,
  getAgentSystemPrompt
} from './agentPrompts';

// AI响应类型
export interface AIResponse {
  content: string;
  type: 'text' | 'style-options' | 'satisfaction-check' | 'derivative-options' | 'delegation' | 'collaboration';
  thinking?: string;
  switchToDesigner?: boolean;
  metadata?: {
    suggestedStyles?: string[];
    images?: string[];
    delegationInfo?: {
      fromAgent: AgentType;
      toAgent: AgentType;
      reasoning: string;
    };
    [key: string]: any;
  };
}

/**
 * 流式调用千问API生成响应
 */
export async function* streamQwenResponse(
  messages: AgentMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    onDelta?: (delta: string) => void;
  }
): AsyncGenerator<string, void, unknown> {
  const formattedMessages = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
    timestamp: Date.now()
  }));

  try {
    // 使用callQwenChat调用千问API
    const response = await callQwenChat({
      model: options?.model || 'qwen-turbo',
      messages: formattedMessages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 1500,
      onDelta: options?.onDelta
    });

    // 模拟流式输出 - 逐字输出
    const words = response.split('');
    for (const word of words) {
      await new Promise(resolve => setTimeout(resolve, 20));
      yield word;
    }
  } catch (error) {
    console.error('[Agent] Stream error:', error);
    throw error;
  }
}

/**
 * 调用Agent获取完整响应
 */
export async function callAgent(
  systemPrompt: string,
  history: AgentMessage[],
  userMessage: string,
  agent: AgentType
): Promise<AIResponse> {
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.map(m => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content
    })),
    { role: 'user' as const, content: userMessage }
  ];

  try {
    console.log(`[Agent] Calling ${agent} agent...`);

    const response = await callQwenChat({
      model: 'qwen-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 1500
    });

    console.log('[Agent] Raw response:', response);

    // 解析AI响应
    return parseAIResponse(response, agent);
  } catch (error) {
    console.error('[Agent] API call failed:', error);
    // 降级到本地回复
    return generateFallbackResponse(userMessage, agent);
  }
}

/**
 * 解析AI响应
 */
function parseAIResponse(response: string, agent: AgentType): AIResponse {
  const trimmedResponse = response.trim();

  // 首先尝试提取JSON（支持markdown代码块）
  try {
    // 尝试匹配markdown代码块中的JSON
    const codeBlockMatch = trimmedResponse.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      const parsed = JSON.parse(codeBlockMatch[1]);
      return {
        content: parsed.content || trimmedResponse,
        type: parsed.type || 'text',
        thinking: parsed.thinking,
        switchToDesigner: parsed.switchToDesigner || false,
        metadata: parsed.metadata || {}
      };
    }

    // 尝试匹配普通JSON对象（整个响应就是一个JSON）
    if (trimmedResponse.startsWith('{') && trimmedResponse.endsWith('}')) {
      const parsed = JSON.parse(trimmedResponse);
      return {
        content: parsed.content || trimmedResponse,
        type: parsed.type || 'text',
        thinking: parsed.thinking,
        switchToDesigner: parsed.switchToDesigner || false,
        metadata: parsed.metadata || {}
      };
    }

    // 尝试匹配JSON对象（在文本中提取）
    const jsonMatch = trimmedResponse.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        content: parsed.content || trimmedResponse,
        type: parsed.type || 'text',
        thinking: parsed.thinking,
        switchToDesigner: parsed.switchToDesigner || false,
        metadata: parsed.metadata || {}
      };
    }
  } catch (e) {
    console.warn('[Agent] Failed to parse JSON response, trying markdown format');
  }

  // 尝试解析Markdown键值对格式（**key**: value）
  try {
    // 匹配 **content**: 后面的内容，直到遇到下一个 ** 开头的键
    const contentMatch = trimmedResponse.match(/^\*\*content\*\*\s*:\s*([\s\S]*?)(?=\n\*\*\w+\*\*\s*:|$)/im);
    const typeMatch = trimmedResponse.match(/\*\*type\*\*\s*:\s*(\w+)/i);
    const thinkingMatch = trimmedResponse.match(/\*\*thinking\*\*\s*:\s*([\s\S]*?)(?=\n\*\*\w+\*\*\s*:|$)/i);

    if (contentMatch) {
      return {
        content: contentMatch[1].trim(),
        type: (typeMatch?.[1] as any) || 'text',
        thinking: thinkingMatch?.[1]?.trim(),
        switchToDesigner: false
      };
    }
  } catch (e) {
    console.warn('[Agent] Failed to parse markdown format, using raw text');
  }

  // 如果解析失败，返回原始文本
  return {
    content: trimmedResponse,
    type: 'text',
    switchToDesigner: false
  };
}

/**
 * 降级回复 - 当API失败时使用
 */
function generateFallbackResponse(userMessage: string, agent: AgentType): AIResponse {
  const lowerMsg = userMessage.toLowerCase();

  // 根据 Agent 类型提供不同的降级回复
  switch (agent) {
    case 'director':
      return generateDirectorFallback(lowerMsg);
    case 'designer':
      return generateDesignerFallback(lowerMsg);
    case 'illustrator':
      return generateIllustratorFallback(lowerMsg);
    case 'copywriter':
      return generateCopywriterFallback(lowerMsg);
    case 'animator':
      return generateAnimatorFallback(lowerMsg);
    case 'researcher':
      return generateResearcherFallback(lowerMsg);
    default:
      return {
        content: '收到你的消息了，我正在处理中，请稍等片刻...',
        type: 'text',
        switchToDesigner: false
      };
  }
}

function generateDirectorFallback(lowerMsg: string): AIResponse {
  if (lowerMsg.includes('ip') || lowerMsg.includes('形象')) {
    return {
      content: `收到！你想要设计一个IP形象，这是个很棒的想法！🎨\n\n为了帮你设计出最合适的形象，我需要了解几个关键点：\n\n1. **这个IP形象的主要用途是什么？**\n2. **目标受众是谁？**\n3. **你希望传达什么样的感觉？**\n\n请告诉我这些信息，我会安排合适的同事为你创作！`,
      type: 'text',
      switchToDesigner: false
    };
  }

  return {
    content: `好的，我理解你的需求了！\n\n为了确保设计效果，能否告诉我更多细节？比如：\n• 目标受众是谁？\n• 有什么特别的要求或偏好吗？\n• 最终用途是什么？\n\n了解清楚后，我会指派专业的同事开始创作！`,
    type: 'text',
    switchToDesigner: false
  };
}

function generateDesignerFallback(lowerMsg: string): AIResponse {
  if (lowerMsg.includes('风格') || lowerMsg.includes('开始')) {
    return {
      content: '太好了！我已经了解了你的需求。现在让我为你展示一些风格选项，你可以选择最喜欢的设计风格：',
      type: 'style-options',
      thinking: '根据用户需求分析，推荐适合的设计风格',
      metadata: {
        suggestedStyles: ['warm-color', 'crayon-cute', 'color-pencil']
      }
    };
  }

  return {
    content: '明白！我正在分析你的需求，准备为你设计。请稍等片刻...',
    type: 'text'
  };
}

function generateIllustratorFallback(lowerMsg: string): AIResponse {
  return {
    content: '你好！我是津脉插画师。🎨\n\n我会用我的画笔为你的创意赋予独特的艺术灵魂。请告诉我你想要的风格感觉，我们开始创作吧！',
    type: 'text'
  };
}

function generateCopywriterFallback(lowerMsg: string): AIResponse {
  return {
    content: '你好！我是津脉文案策划。✍️\n\n我会为你的品牌创作独特的文案和故事。请告诉我品牌的核心价值和目标受众，我来为你创作！',
    type: 'text'
  };
}

function generateAnimatorFallback(lowerMsg: string): AIResponse {
  return {
    content: '你好！我是津脉动画师。🎬\n\n我可以为你的创意制作动画和视频。请告诉我你想要什么样的动画效果？',
    type: 'text'
  };
}

function generateResearcherFallback(lowerMsg: string): AIResponse {
  return {
    content: '你好！我是津脉研究员。📊\n\n我会帮你分析市场趋势和竞品。请告诉我你想研究的方向，我来为你提供分析报告！',
    type: 'text'
  };
}

/**
 * 分析设计需求
 */
export async function analyzeDesignRequirements(
  description: string
): Promise<{
  type: 'ip-character' | 'brand-packaging' | 'poster' | 'custom';
  keywords: string[];
  suggestions: string[];
}> {
  try {
    const prompt = REQUIREMENT_ANALYSIS_PROMPT(description);
    const response = await callQwenChat({
      model: 'qwen-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    });

    // 解析JSON响应
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        type: parsed.type || 'custom',
        keywords: parsed.keywords || ['设计', '创意'],
        suggestions: parsed.suggestions || ['考虑目标受众', '确定风格方向']
      };
    }
  } catch (error) {
    console.error('[Agent] Analysis failed:', error);
  }

  // 降级到本地分析
  return localAnalyzeRequirements(description);
}

/**
 * 本地需求分析（降级方案）
 */
function localAnalyzeRequirements(description: string): {
  type: 'ip-character' | 'brand-packaging' | 'poster' | 'custom';
  keywords: string[];
  suggestions: string[];
} {
  const lowerDesc = description.toLowerCase();

  let type: 'ip-character' | 'brand-packaging' | 'poster' | 'custom' = 'custom';
  if (lowerDesc.includes('ip') || lowerDesc.includes('形象') || lowerDesc.includes('角色')) {
    type = 'ip-character';
  } else if (lowerDesc.includes('包装') || lowerDesc.includes('品牌')) {
    type = 'brand-packaging';
  } else if (lowerDesc.includes('海报') || lowerDesc.includes('宣传')) {
    type = 'poster';
  }

  return {
    type,
    keywords: ['设计', '创意', '品牌'],
    suggestions: ['考虑目标受众', '确定风格方向', '准备参考素材']
  };
}

/**
 * 推荐设计风格
 */
export async function recommendStyles(
  requirements: string
): Promise<{ styles: string[]; reasoning: string }> {
  try {
    const availableStyles = PRESET_STYLES.map(s =>
      `- ${s.id}: ${s.name} - ${s.description}`
    ).join('\n');

    const prompt = STYLE_RECOMMENDATION_PROMPT(requirements, availableStyles);
    const response = await callQwenChat({
      model: 'qwen-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        styles: parsed.recommendedStyles || ['warm-color', 'color-pencil'],
        reasoning: parsed.reasoning || '根据您的需求推荐这些风格'
      };
    }
  } catch (error) {
    console.error('[Agent] Style recommendation failed:', error);
  }

  // 默认推荐
  return {
    styles: ['warm-color', 'color-pencil', 'crayon-cute'],
    reasoning: '这些风格适合大多数设计需求，温馨且富有创意'
  };
}

/**
 * 生成图像
 */
export async function generateImage(
  prompt: string,
  style?: string,
  options?: {
    width?: number;
    height?: number;
    numImages?: number;
  }
): Promise<GeneratedOutput[]> {
  try {
    // 获取风格prompt
    const styleOption = PRESET_STYLES.find(s => s.id === style);
    const fullPrompt = styleOption
      ? `${prompt}, ${styleOption.prompt}`
      : prompt;

    console.log('[Agent] Generating image with prompt:', fullPrompt);

    // 调用llmService的图像生成
    const result = await llmService.generateImage({
      prompt: fullPrompt,
      size: `${options?.width || 1024}x${options?.height || 1024}`,
      n: options?.numImages || 1
    });

    if (result.ok && result.data?.data) {
      const images = result.data.data;
      return images.map((img: any, i: number) => ({
        id: `generated-${Date.now()}-${i}`,
        type: 'image' as const,
        url: img.url,
        thumbnail: img.url,
        prompt: fullPrompt,
        style,
        createdAt: Date.now()
      }));
    }

    throw new Error(result.error || 'Image generation failed');
  } catch (error) {
    console.error('[Agent] Image generation failed:', error);
    // 返回模拟数据作为降级
    return generateMockImages(prompt, style, options);
  }
}

/**
 * 模拟图像生成（降级方案）
 */
function generateMockImages(
  prompt: string,
  style?: string,
  options?: { numImages?: number }
): GeneratedOutput[] {
  const numImages = options?.numImages || 4;

  return Array.from({ length: numImages }, (_, i) => ({
    id: `generated-${Date.now()}-${i}`,
    type: 'image' as const,
    url: `https://images.unsplash.com/photo-${1618005182384 + i}-a83a8bd57fbe?w=800&h=800&fit=crop`,
    thumbnail: `https://images.unsplash.com/photo-${1618005182384 + i}-a83a8bd57fbe?w=200&h=200&fit=crop`,
    prompt,
    style,
    createdAt: Date.now()
  }));
}

/**
 * 生成视频
 */
export async function generateVideo(
  prompt: string,
  options?: {
    duration?: number;
    resolution?: string;
  }
): Promise<GeneratedOutput> {
  try {
    console.log('[Agent] Generating video...');
    // 这里可以调用视频生成API
    // 目前返回模拟数据
    return {
      id: `video-${Date.now()}`,
      type: 'video',
      url: 'https://example.com/video.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=800&fit=crop',
      prompt,
      createdAt: Date.now()
    };
  } catch (error) {
    console.error('[Agent] Video generation failed:', error);
    throw error;
  }
}

/**
 * 联网搜索
 */
export async function webSearch(query: string): Promise<any[]> {
  // 这里可以集成真实的搜索API
  // 目前返回模拟数据
  return [
    {
      title: '设计趋势2024',
      snippet: '今年最流行的设计风格包括...',
      url: 'https://example.com/design-trends'
    },
    {
      title: '品牌设计案例',
      snippet: '优秀的品牌设计案例分析...',
      url: 'https://example.com/cases'
    }
  ];
}

/**
 * 保存对话历史
 */
export function saveConversationHistory(
  taskId: string,
  messages: AgentMessage[]
): void {
  const history = {
    taskId,
    messages,
    savedAt: Date.now()
  };
  localStorage.setItem(`agent-history-${taskId}`, JSON.stringify(history));
}

/**
 * 加载对话历史
 */
export function loadConversationHistory(taskId: string): AgentMessage[] | null {
  const saved = localStorage.getItem(`agent-history-${taskId}`);
  if (saved) {
    const history = JSON.parse(saved);
    return history.messages;
  }
  return null;
}

/**
 * 导出任务报告
 */
export function exportTaskReport(task: DesignTask): string {
  const report = {
    taskId: task.id,
    title: task.title,
    type: task.type,
    requirements: task.requirements,
    outputs: task.outputs,
    createdAt: new Date(task.createdAt).toISOString(),
    completedAt: new Date(task.updatedAt).toISOString()
  };

  return JSON.stringify(report, null, 2);
}
