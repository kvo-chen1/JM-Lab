/**
 * Skill Agent 适配器
 * 连接 AgentOrchestrator 和 Agent 的 Skill 能力
 * 实现快速响应模式
 */

import { AgentType, AgentMessage, OrchestratorResponse } from '../types/agent';
import { createAgent } from '../agents';
import { BaseAgent } from '../agents/BaseAgent';
import { ConversationContext } from './agentOrchestrator';
import { getAgentSystemPrompt } from './agentPrompts';
import { llmService } from '@/services/llmService';
import { intentAnalyzer, IntentAnalysis } from './intentAnalyzer';

// 生成状态锁，防止重复触发
const generationLock = {
  isGenerating: false,
  lastRequest: '',
  lastRequestTime: 0
};

/**
 * 简单的意图识别（替代 IntentRecognitionSkill）
 */
function recognizeIntentSimple(message: string): { type: string; confidence: number } {
  const lowerMsg = message.toLowerCase();

  // 图像生成意图
  const imageKeywords = ['画', '生成', '图像', '图片', '绘制', '创作', '设计', '插画', '海报', 'logo'];
  if (imageKeywords.some(k => lowerMsg.includes(k))) {
    return { type: 'image-generation', confidence: 0.8 };
  }

  // 视频生成意图
  const videoKeywords = ['视频', '动画', '动效', '短片'];
  if (videoKeywords.some(k => lowerMsg.includes(k))) {
    return { type: 'video-generation', confidence: 0.8 };
  }

  // 文案生成意图
  const textKeywords = ['文案', '文字', '写作', '标语', '口号'];
  if (textKeywords.some(k => lowerMsg.includes(k))) {
    return { type: 'text-generation', confidence: 0.8 };
  }

  // 问候意图
  const greetingKeywords = ['你好', '您好', 'hello', 'hi'];
  if (greetingKeywords.some(k => lowerMsg.includes(k))) {
    return { type: 'greeting', confidence: 0.9 };
  }

  // 默认：设计请求
  return { type: 'design-request', confidence: 0.6 };
}

/**
 * 检查是否可以执行生成
 */
function canExecuteGeneration(message: string): boolean {
  const now = Date.now();
  const cooldownPeriod = 3000; // 3秒冷却期

  // 检查是否是相同的请求在冷却期内
  if (generationLock.isGenerating ||
      (generationLock.lastRequest === message &&
       now - generationLock.lastRequestTime < cooldownPeriod)) {
    console.log('[SkillAgentAdapter] 生成被锁定，跳过重复请求');
    return false;
  }

  return true;
}

/**
 * 锁定生成状态
 */
function lockGeneration(message: string) {
  generationLock.isGenerating = true;
  generationLock.lastRequest = message;
  generationLock.lastRequestTime = Date.now();
}

/**
 * 解锁生成状态
 */
function unlockGeneration() {
  generationLock.isGenerating = false;
}

/**
 * 根据意图匹配最佳 Agent
 */
export function matchAgentByIntent(
  intentType: string,
  currentAgent: AgentType
): AgentType {
  // 咨询类意图优先匹配研究员或设计总监
  if (['trend-inquiry', 'knowledge-inquiry', 'comparison-inquiry', 'capability-inquiry'].includes(intentType)) {
    // 如果当前是研究员或设计总监，保持不变
    if (['researcher', 'director'].includes(currentAgent)) {
      return currentAgent;
    }
    // 否则切换到研究员
    return 'researcher';
  }

  // 设计类意图匹配设计师
  if (['design-request', 'image-generation'].includes(intentType)) {
    if (['designer', 'illustrator', 'director'].includes(currentAgent)) {
      return currentAgent;
    }
    return 'designer';
  }

  // 文案类意图匹配文案策划
  if (intentType === 'text-generation') {
    if (['copywriter', 'director'].includes(currentAgent)) {
      return currentAgent;
    }
    return 'copywriter';
  }

  // 视频类意图匹配动画师
  if (intentType === 'video-generation') {
    if (['animator', 'director'].includes(currentAgent)) {
      return currentAgent;
    }
    return 'animator';
  }

  // 默认保持当前 Agent
  return currentAgent;
}

/**
 * 检查是否是快速生成请求
 */
export function isQuickGenerationRequest(message: string): boolean {
  const lowerMsg = message.toLowerCase();

  // 排除询问类请求（这些不应该触发生成）
  const inquiryPatterns = [
    /(?:你|你们).*(?:能|可以|会).*(?:做什么|干什么|生成什么)/,
    /(?:你|你们).*(?:有|具备).*(?:什么|哪些).*(?:能力|技能|功能)/,
    /(?:你|你们).*(?:擅长|专长)/,
    /(?:你能|你可以).*(?:帮助|协助)/,
    /^(?:你能|你可以|你会)/,
    /(?:什么|哪些|怎么|如何).*(?:做|生成|画|设计)/,
    /(?:做|生成|画|设计).*(?:什么|哪些)/,
    /(?:能不能|会不会|可不可以).*(?:画|生成|做|设计)/,
    /(?:帮忙|帮助).*(?:想想|建议|推荐)/
  ];

  // 如果是询问类请求，不认为是快速生成
  const isInquiry = inquiryPatterns.some(pattern => pattern.test(lowerMsg));
  if (isInquiry) {
    return false;
  }

  // 快速生成关键词（必须是明确的生成指令）
  const quickKeywords = [
    '生成', '画', '画一个', '画个', '画一张', '画幅',
    '来张', '来个', '来一个', '来一幅',
    '给我画', '帮我画', '给我生成', '帮我生成',
    '设计一个', '设计个', '创建一个', '创建个',
    '做一张', '做一个', '做一幅', '做个',
    '创作', '绘制', '制作'
  ];

  // 检查是否包含快速生成关键词
  const hasQuickKeyword = quickKeywords.some(kw => lowerMsg.includes(kw));

  // 检查是否包含具体描述（至少4个字符）
  const hasSpecificDescription = message.length >= 4;

  // 检查是否不包含复杂需求指示词
  const complexIndicators = ['需求', '方案', '流程', '策略', '规划', '详细', '完整', '怎么做', '如何写', '如何设计'];
  const hasComplexIndicator = complexIndicators.some(ind => lowerMsg.includes(ind));

  // 额外检查：是否包含设计对象关键词（有明确的设计目标）
  const designTargets = ['logo', '海报', '图标', '插画', '形象', '角色', '包装', '品牌', '图形', '图', '画', '图片', '图像', '作品', '设计', '东西'];
  const hasDesignTarget = designTargets.some(target => lowerMsg.includes(target));

  // 如果包含"直接生成"等明确生成指令，放宽设计目标要求
  // 注意：单独的"开始"不应该触发快速生成，必须是"开始生成"或"生成"等完整指令
  const hasDirectGeneration = /(直接生成|立即生成|马上生成|现在生成|开始生成|生成吧)/.test(lowerMsg);

  // 单独的"开始"或"确认"不应该触发快速生成
  const isSimpleConfirmation = /^(开始|确认|好的|ok|yes|是|对)$/i.test(message.trim());
  if (isSimpleConfirmation) {
    return false;
  }

  return hasQuickKeyword && hasSpecificDescription && !hasComplexIndicator && (hasDesignTarget || hasDirectGeneration);
}

/**
 * 使用 Agent 的 Skill 快速处理消息
 * 集成智能意图分析
 */
export async function processWithAgentSkill(
  message: string,
  context: ConversationContext
): Promise<OrchestratorResponse | null> {
  const { currentAgent, selectedStyle, messages } = context;

  // 使用智能意图分析器分析用户意图
  intentAnalyzer.setContext({
    history: messages.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp })),
    currentAgent,
    selectedStyle
  });

  const intentAnalysis = intentAnalyzer.analyze(message);
  console.log('[SkillAgentAdapter] 意图分析结果:', intentAnalysis);

  // 根据意图分析结果调整处理策略
  // 如果是咨询意图，不进入快速生成模式
  if (intentAnalysis.primaryIntent === 'consult') {
    console.log('[SkillAgentAdapter] 咨询意图，不进入快速生成模式');
    return null;
  }

  // 如果是修改意图，保持当前 Agent
  if (intentAnalysis.primaryIntent === 'modify' && intentAnalysis.suggestedAgent) {
    console.log('[SkillAgentAdapter] 修改意图，使用当前 Agent:', intentAnalysis.suggestedAgent);
  }

  // 检查生成锁
  if (!canExecuteGeneration(message)) {
    return null;
  }

  // Designer、Illustrator 和 Director 都支持快速图像生成
  // Director 可以快速生成，也可以委派给 Designer
  const supportedAgents = ['designer', 'illustrator', 'director'];
  if (!supportedAgents.includes(currentAgent)) {
    return null;
  }

  // 检查是否是快速生成请求（使用增强的判断逻辑）
  if (!isQuickGenerationRequest(message)) {
    return null;
  }

  // 根据意图分析判断是否应该跳过风格选择
  // 如果用户明确要求跳过，或者置信度很高且已有足够信息
  if (intentAnalysis.shouldSkipSteps && selectedStyle) {
    console.log('[SkillAgentAdapter] 根据意图分析跳过步骤，直接生成');
  }

  // 检查是否已选择风格，如果没有则返回风格选择器
  if (!selectedStyle) {
    console.log('[SkillAgentAdapter] 未选择风格，返回风格选择器');
    return {
      type: 'response',
      agent: currentAgent,
      content: '在开始生成之前，请先选择一个你喜欢的风格。',
      aiResponse: {
        content: '在开始生成之前，请先选择一个你喜欢的风格。',
        type: 'style-options'
      }
    };
  }

  console.log(`[SkillAgentAdapter] 快速模式: ${currentAgent} 处理 "${message}"`);

  // 锁定生成状态
  lockGeneration(message);

  try {
    // 创建对应的 Agent
    const agent = createAgent(currentAgent);

    // 构建执行上下文
    const executionContext = {
      userId: context.userId || 'anonymous',
      sessionId: context.sessionId || 'default',
      message,
      history: context.messages,
      parameters: {
        prompt: message,
        fastMode: true,
        style: selectedStyle
      }
    };

    // 调用 Agent 的 handleMessage（会触发快速模式）
    const response = await agent.handleMessage(message, executionContext);

    // 检查是否是快速生成的响应
    if (response.metadata?.quickGeneration) {
      console.log('[SkillAgentAdapter] 快速生成成功');
      console.log('[SkillAgentAdapter] 响应 metadata:', response.metadata);

      // 从 metadata 中提取图片信息（支持多种格式）
      // 1. 优先检查 images 数组（Agent 返回的格式）
      // 2. 其次检查 imageUrl 或 url（旧格式）
      let imageUrl: string | undefined;
      let images: any[] | undefined;

      if (response.metadata?.images && Array.isArray(response.metadata.images) && response.metadata.images.length > 0) {
        // 新的 Agent 格式：返回 images 数组
        images = response.metadata.images;
        imageUrl = typeof images[0] === 'string' ? images[0] : images[0]?.url;
        console.log('[SkillAgentAdapter] 从 images 数组提取图片:', images.length, '张');
      } else {
        // 旧格式：直接返回 imageUrl 或 url
        imageUrl = response.metadata?.imageUrl || response.metadata?.url;
      }

      if (!imageUrl) {
        console.warn('[SkillAgentAdapter] 未找到 imageUrl，降级到普通模式');
        return {
          type: 'response',
          agent: currentAgent,
          content: response.content,
          aiResponse: {
            content: response.content
          }
        };
      }

      return {
        type: 'image_generation',
        agent: currentAgent,
        content: response.content,
        generatedImage: {
          url: imageUrl,
          prompt: response.metadata?.prompt || message,
          description: response.content
        },
        aiResponse: {
          content: response.content,
          type: 'image',
          metadata: {
            images: images || [imageUrl], // 返回所有图片或单个图片
            thinking: response.metadata?.thinking,
            skillExecution: {
              skillName: 'ImageGenerationSkill',
              executionTime: Date.now(),
              parameters: {
                prompt: message,
                style: selectedStyle
              }
            }
          }
        }
      };
    }

    // 不是快速模式，返回普通响应
    return {
      type: 'response',
      agent: currentAgent,
      content: response.content,
      aiResponse: {
        content: response.content,
        reasoning: response.metadata?.reasoning
      }
    };

  } catch (error) {
    console.error('[SkillAgentAdapter] 快速处理失败:', error);
    // 返回 null，让调用方降级到普通处理
    return null;
  } finally {
    // 解锁生成状态
    unlockGeneration();
  }
}

/**
 * 智能处理消息
 * 先尝试 Skill 快速模式，失败则返回 null 让 Orchestrator 处理
 */
export async function smartProcessMessage(
  message: string,
  context: ConversationContext
): Promise<OrchestratorResponse | null> {
  // 1. 使用简单的关键词匹配识别意图（替代 IntentRecognitionSkill）
  const intent = recognizeIntentSimple(message);
  console.log('[SkillAgentAdapter] 识别意图:', intent.type, '置信度:', intent.confidence);

  // 2. 根据意图匹配最佳 Agent
  const matchedAgent = matchAgentByIntent(intent.type, context.currentAgent);

  // 3. 如果是问候类意图，返回问候响应
  if (intent.type === 'greeting') {
    console.log('[SkillAgentAdapter] 问候类意图，匹配 Agent:', matchedAgent);

    return {
      type: 'respond',
      agent: matchedAgent,
      content: `你好！我是津脉${matchedAgent === 'director' ? '设计总监' : matchedAgent === 'designer' ? '品牌设计师' : matchedAgent === 'illustrator' ? '插画师' : matchedAgent === 'copywriter' ? '文案策划' : matchedAgent === 'animator' ? '动画师' : '研究员'}，有什么可以帮你的吗？`,
      aiResponse: {
        content: `你好！我是津脉${matchedAgent === 'director' ? '设计总监' : matchedAgent === 'designer' ? '品牌设计师' : matchedAgent === 'illustrator' ? '插画师' : matchedAgent === 'copywriter' ? '文案策划' : matchedAgent === 'animator' ? '动画师' : '研究员'}，有什么可以帮你的吗？`,
        type: 'text',
        metadata: {
          intent: intent.type,
          reasoning: `识别到问候意图，匹配${matchedAgent}处理`
        }
      }
    };
  }

  // 4. 如果是执行类意图，尝试快速生成模式
  if (['design-request', 'image-generation'].includes(intent.type)) {
    const skillResult = await processWithAgentSkill(message, context);
    if (skillResult) {
      return skillResult;
    }
  }

  // 5. 返回 null，让 Orchestrator 使用普通流程
  return null;
}
