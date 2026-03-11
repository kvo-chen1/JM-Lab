// Agent服务层 - 处理与AI相关的API调用

import { AgentMessage, DesignTask, GeneratedOutput, AgentType, PRESET_STYLES } from '../types/agent';
import { llmService } from '@/services/llmService';
import { callQwenChat, callKimiChat, callDeepseekChat } from '@/services/llm/chatProviders';
import { callCurrentModel } from './modelCaller';
import { aiGenerationService } from '@/services/aiGenerationService';
import {
  DIRECTOR_SYSTEM_PROMPT,
  DESIGNER_SYSTEM_PROMPT,
  REQUIREMENT_ANALYSIS_PROMPT,
  buildImageGenerationPrompt,
  STYLE_RECOMMENDATION_PROMPT,
  getAgentSystemPrompt
} from './agentPrompts';
import { getMemoryService } from './memoryService';
import { errorHandler, ErrorHandleResult } from './errorHandler';
import { AgentErrorType } from './errors';
import { getRAGService } from './ragService';
import { getPromptBuilder } from './promptBuilder';
import { getIntentRecognitionService, IntentType } from './intentRecognition';

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
      model: options?.model || 'qwen-plus',
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
 * 根据当前模型调用对应的API
 * 使用 modelCaller 中的统一调用函数
 */
async function callModelAPI(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: {
    temperature?: number;
    max_tokens?: number;
  }
): Promise<string> {
  // 使用 modelCaller 中的函数
  const { callCurrentModel } = await import('./modelCaller');
  return callCurrentModel(messages, options);
}

/**
 * 调用Agent获取完整响应 - 带增强错误处理
 */
export async function callAgent(
  systemPrompt: string,
  history: AgentMessage[],
  userMessage: string,
  agent: AgentType
): Promise<AIResponse> {
  // 获取记忆服务并构建记忆增强的Prompt
  const memoryService = getMemoryService();
  const enhancedPrompt = memoryService.buildMemoryEnhancedPrompt(systemPrompt, agent);

  const messages = [
    { role: 'system' as const, content: enhancedPrompt },
    ...history.map(m => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content
    })),
    { role: 'user' as const, content: userMessage }
  ];

  // 使用增强的错误处理
  const result = await errorHandler.handleWithRetry(
    async () => {
      console.log(`[Agent] Calling ${agent} agent...`);

      // 使用统一的模型调用函数
      const response = await callModelAPI(messages, {
        temperature: 0.7,
        max_tokens: 1500
      });

      console.log('[Agent] Raw response:', response);

      // 解析AI响应
      return parseAIResponse(response, agent);
    },
    {
      type: AgentErrorType.API_ERROR,
      agentType: agent,
      maxRetries: 2,
      retryDelay: 1000,
      onRetry: (attempt, error) => {
        console.log(`[Agent] Retry attempt ${attempt} for ${agent}: ${error.message}`);
      },
      onSuccess: (attempts) => {
        if (attempts > 0) {
          console.log(`[Agent] Successfully recovered after ${attempts} retries`);
        }
      }
    }
  );

  if (result.success && result.data) {
    // 记录Agent交互
    memoryService.recordAgentInteraction(agent, 5);
    return result.data;
  }

  // 如果重试都失败了，使用降级回复
  console.error('[Agent] API call failed after retries:', result.error);
  return generateFallbackResponse(userMessage, agent);
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
    const response = await callCurrentModel(
      [{ role: 'user', content: prompt }],
      { temperature: 0.7, max_tokens: 1000 }
    );

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
    // 首先获取用户的历史偏好
    const memoryService = getMemoryService();
    const preferredStyles = memoryService.getRecommendedStyles(3);

    const availableStyles = PRESET_STYLES.map(s =>
      `- ${s.id}: ${s.name} - ${s.description}`
    ).join('\n');

    const prompt = STYLE_RECOMMENDATION_PROMPT(requirements, availableStyles);
    const response = await callCurrentModel(
      [{ role: 'user', content: prompt }],
      { temperature: 0.7, max_tokens: 1000 }
    );

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const recommendedStyles = parsed.recommendedStyles || ['warm-color', 'color-pencil'];

      // 合并用户偏好和AI推荐，优先用户偏好
      const mergedStyles = [...new Set([...preferredStyles, ...recommendedStyles])].slice(0, 4);

      return {
        styles: mergedStyles,
        reasoning: parsed.reasoning || '根据您的需求和历史偏好推荐这些风格'
      };
    }
  } catch (error) {
    console.error('[Agent] Style recommendation failed:', error);
  }

  // 使用记忆服务获取默认推荐
  const memoryService = getMemoryService();
  const defaultStyles = memoryService.getRecommendedStyles(3);

  return {
    styles: defaultStyles.length > 0 ? defaultStyles : ['warm-color', 'color-pencil', 'crayon-cute'],
    reasoning: '根据您的历史偏好推荐这些风格'
  };
}

/**
 * 生成图像 - 带增强错误处理
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
  // 获取风格prompt
  const styleOption = PRESET_STYLES.find(s => s.id === style);
  const fullPrompt = styleOption
    ? `${prompt}, ${styleOption.prompt}`
    : prompt;

  console.log('[Agent] Generating image with prompt:', fullPrompt);

  // 使用增强的错误处理
  const result = await errorHandler.handleWithRetry(
    async () => {
      // 调用llmService的图像生成
      const apiResult = await llmService.generateImage({
        prompt: fullPrompt,
        size: `${options?.width || 1024}x${options?.height || 1024}`,
        n: options?.numImages || 1
      });

      if (apiResult.ok && apiResult.data?.data) {
        const images = apiResult.data.data;
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

      throw new Error(apiResult.error || 'Image generation failed');
    },
    {
      type: AgentErrorType.GENERATION_ERROR,
      maxRetries: 2,
      retryDelay: 2000,
      onRetry: (attempt, error) => {
        console.log(`[Agent] Image generation retry attempt ${attempt}: ${error.message}`);
      }
    }
  );

  if (result.success && result.data) {
    return result.data;
  }

  // 如果重试都失败了，返回模拟数据作为降级
  console.error('[Agent] Image generation failed after retries:', result.error);
  return generateMockImages(prompt, style, options);
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
    imageUrl?: string;
    aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3';
  }
): Promise<GeneratedOutput> {
  try {
    console.log('[Agent] Generating video with real API...');

    // 调用真实的视频生成服务
    const task = await aiGenerationService.generateVideo({
      prompt,
      imageUrl: options?.imageUrl,
      duration: options?.duration || 5,
      resolution: (options?.resolution as '720p' | '1080p' | '4k') || '720p',
      aspectRatio: options?.aspectRatio || '16:9',
      model: 'wan2.6-i2v-flash'
    });

    // 等待任务完成并获取结果
    return new Promise((resolve, reject) => {
      const checkTask = () => {
        const updatedTask = aiGenerationService.getTask(task.id);

        if (!updatedTask) {
          reject(new Error('任务不存在'));
          return;
        }

        if (updatedTask.status === 'completed' && updatedTask.result?.urls?.[0]) {
          const videoUrl = updatedTask.result.urls[0];
          resolve({
            id: task.id,
            type: 'video',
            url: videoUrl,
            thumbnail: videoUrl, // 视频URL也可以作为缩略图（第一帧）
            prompt,
            createdAt: task.createdAt
          });
        } else if (updatedTask.status === 'failed') {
          reject(new Error(updatedTask.error || '视频生成失败'));
        } else {
          // 继续轮询
          setTimeout(checkTask, 2000);
        }
      };

      // 开始轮询
      checkTask();

      // 设置超时（5分钟）
      setTimeout(() => {
        reject(new Error('视频生成超时，请稍后重试'));
      }, 300000);
    });
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

// ==================== 智能化增强函数 ====================

/**
 * 智能Agent调用 - 集成RAG、意图识别、动态Prompt构建
 */
export async function callAgentIntelligent(
  userMessage: string,
  agent: AgentType,
  options?: {
    history?: AgentMessage[];
    taskContext?: {
      type?: string;
      requirements?: Record<string, any>;
      stage?: string;
    };
    enableRAG?: boolean;
    enableMemory?: boolean;
    enableIntent?: boolean;
  }
): Promise<AIResponse & { metadata: { ragUsed: boolean; intentRecognized: string | null } }> {
  const promptBuilder = getPromptBuilder();
  const ragService = getRAGService();
  const intentService = getIntentRecognitionService();

  // 初始化RAG案例库（如果尚未初始化）
  await ragService.initializeCaseLibrary();

  // 构建智能Prompt
    const promptResult = await promptBuilder.buildPrompt({
      agent,
      userMessage,
      conversationHistory: options?.history?.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      })),
      taskContext: options?.taskContext,
      enableRAG: options?.enableRAG,
      enableMemory: options?.enableMemory,
      enableIntent: options?.enableIntent
    });

  console.log('[Agent] Intelligent prompt built:', {
    ragUsed: promptResult.metadata.ragUsed,
    memoryUsed: promptResult.metadata.memoryUsed,
    intent: promptResult.metadata.intentRecognized,
    estimatedTokens: promptResult.estimatedTokens
  });

  // 调用Agent
  const response = await callAgent(
    promptResult.systemPrompt,
    options?.history || [],
    userMessage,
    agent
  );

  return {
    ...response,
    metadata: {
      ...response.metadata,
      ragUsed: promptResult.metadata.ragUsed,
      intentRecognized: promptResult.metadata.intentRecognized
    }
  };
}

/**
 * 智能需求分析 - 集成意图识别和RAG
 */
export async function analyzeRequirementsIntelligent(
  userInput: string
): Promise<{
  intent: IntentType;
  entities: Record<string, string>;
  ragRecommendations: {
    styles: string[];
    cases: string[];
    insights: string[];
  };
  missingInfo: string[];
  confidence: number;
}> {
  const intentService = getIntentRecognitionService();
  const ragService = getRAGService();

  // 并行执行意图识别和RAG分析
  const [intentResult, ragAnalysis] = await Promise.all([
    intentService.recognizeIntent(userInput),
    ragService.analyzeAndRecommend(userInput)
  ]);

  // 提取风格推荐
  const styleRecommendations = ragAnalysis.styleRecommendations
    .slice(0, 3)
    .map(id => PRESET_STYLES.find(s => s.id === id)?.name || id);

  // 提取案例标题
  const caseTitles = ragAnalysis.cases.slice(0, 3).map(c => c.title);

  return {
    intent: intentResult.primaryIntent,
    entities: intentResult.entities,
    ragRecommendations: {
      styles: styleRecommendations,
      cases: caseTitles,
      insights: ragAnalysis.insights
    },
    missingInfo: intentResult.clarificationNeeded
      ? [intentResult.suggestedResponse || '需要更多信息']
      : [],
    confidence: intentResult.confidence
  };
}

/**
 * 生成智能设计建议 - 基于RAG
 */
export async function generateIntelligentDesignAdvice(
  requirements: string
): Promise<string> {
  const ragService = getRAGService();
  return await ragService.generateDesignAdvice(requirements, {
    includeCases: true,
    includeStyles: true
  });
}

/**
 * 初始化智能化服务
 */
export async function initializeIntelligentServices(): Promise<{
  ragInitialized: boolean;
  vectorStoreReady: boolean;
  promptBuilderReady: boolean;
}> {
  try {
    // 初始化RAG服务
    const ragService = getRAGService();
    await ragService.initializeCaseLibrary();

    // 检查向量存储
    const vectorStore = ragService['vectorStore'];
    const stats = vectorStore.getStats();

    // 检查Prompt构建器
    const promptBuilder = getPromptBuilder();
    const builderStats = promptBuilder.getStats();

    console.log('[Agent] Intelligent services initialized:', {
      ragCases: stats.total,
      vectorTypes: stats.byType,
      ragAvailable: builderStats.ragAvailable,
      memoryAvailable: builderStats.memoryAvailable
    });

    return {
      ragInitialized: stats.total > 0,
      vectorStoreReady: stats.total > 0,
      promptBuilderReady: builderStats.ragAvailable
    };
  } catch (error) {
    console.error('[Agent] Failed to initialize intelligent services:', error);
    return {
      ragInitialized: false,
      vectorStoreReady: false,
      promptBuilderReady: false
    };
  }
}
