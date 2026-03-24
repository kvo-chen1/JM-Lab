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

// 生成状态锁，防止重复触发
const generationLock = {
  isGenerating: false,
  lastRequest: '',
  lastRequestTime: 0
};

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
 * 检查是否是快速生成请求
 */
export function isQuickGenerationRequest(message: string): boolean {
  const lowerMsg = message.toLowerCase();
  
  // 快速生成关键词
  const quickKeywords = [
    '生成', '画', '画一个', '画个', '画一张', '画幅',
    '做', '做个', '做一个', '来', '来张', '来个',
    '给我画', '帮我画', '给我生成', '帮我生成'
  ];
  
  // 检查是否包含快速生成关键词
  const hasQuickKeyword = quickKeywords.some(kw => lowerMsg.includes(kw));
  
  // 检查是否包含具体描述（至少4个字符）
  const hasSpecificDescription = message.length >= 4;
  
  // 检查是否不包含复杂需求指示词
  const complexIndicators = ['需求', '方案', '流程', '策略', '规划', '详细', '完整'];
  const hasComplexIndicator = complexIndicators.some(ind => lowerMsg.includes(ind));
  
  return hasQuickKeyword && hasSpecificDescription && !hasComplexIndicator;
}

/**
 * 使用 Agent 的 Skill 快速处理消息
 */
export async function processWithAgentSkill(
  message: string,
  context: ConversationContext
): Promise<OrchestratorResponse | null> {
  const { currentAgent, selectedStyle } = context;

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

  // 检查是否是快速生成请求
  if (!isQuickGenerationRequest(message)) {
    return null;
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

      // 从 metadata 中提取 imageUrl（可能叫 imageUrl 或 url）
      const imageUrl = response.metadata?.imageUrl || response.metadata?.url;

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
  // 1. 尝试 Skill 快速模式
  const skillResult = await processWithAgentSkill(message, context);
  if (skillResult) {
    return skillResult;
  }
  
  // 2. 返回 null，让 Orchestrator 使用普通流程
  return null;
}
