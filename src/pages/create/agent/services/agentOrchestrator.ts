// Agent 编排器 - 负责 Agent 之间的任务委派和决策

import {
  AgentType,
  AgentDecision,
  AgentMessage,
  DelegationTask,
  AgentAction,
  getAgentConfig,
  AGENT_CONFIG
} from '../types/agent';
import { callQwenChat } from '@/services/llm/chatProviders';
import {
  ORCHESTRATOR_DECISION_PROMPT,
  getAgentSystemPrompt,
  buildDelegationPrompt
} from './agentPrompts';
import { callAgent, AIResponse } from './agentService';

// 对话上下文
export interface ConversationContext {
  currentAgent: AgentType;
  messages: AgentMessage[];
  taskDescription?: string;
  delegationHistory: DelegationTask[];
}

// 编排器响应
export interface OrchestratorResponse {
  type: 'response' | 'delegation' | 'collaboration' | 'chain' | 'handoff';
  agent: AgentType;
  content: string;
  aiResponse?: AIResponse;
  delegationTask?: DelegationTask;
  collaborationAgents?: AgentType[];
  chainQueue?: AgentType[];
}

/**
 * Agent 编排器类
 * 负责管理 Agent 之间的协作和任务流转
 */
export class AgentOrchestrator {
  private currentContext: ConversationContext | null = null;

  /**
   * 设置当前上下文
   */
  setContext(context: ConversationContext) {
    this.currentContext = context;
  }

  /**
   * 处理用户输入
   * 这是主要的入口方法，负责决策并执行相应的动作
   */
  async processUserInput(
    userMessage: string,
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    this.setContext(context);

    console.log('[Orchestrator] Processing user input:', userMessage);
    console.log('[Orchestrator] Current agent:', context.currentAgent);

    // 1. 让 AI 做决策
    const decision = await this.makeDecision(userMessage, context);
    console.log('[Orchestrator] Decision:', decision);

    // 2. 根据决策执行相应动作
    switch (decision.action) {
      case 'respond':
        return this.executeRespond(userMessage, context);

      case 'delegate':
        return this.executeDelegate(decision, userMessage, context);

      case 'collaborate':
        return this.executeCollaborate(decision, userMessage, context);

      case 'handoff':
        return this.executeHandoff(decision, userMessage, context);

      case 'chain':
        return this.executeChain(decision, userMessage, context);

      default:
        // 默认直接响应
        return this.executeRespond(userMessage, context);
    }
  }

  /**
   * AI 决策引擎
   * 分析用户输入和当前上下文，决定采取什么动作
   */
  private async makeDecision(
    userMessage: string,
    context: ConversationContext
  ): Promise<AgentDecision> {
    try {
      const prompt = this.buildDecisionPrompt(userMessage, context);

      const response = await callQwenChat({
        model: 'qwen-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3, // 低温度以获得更确定的决策
        max_tokens: 1000
      });

      // 解析决策结果
      return this.parseDecisionResponse(response);
    } catch (error) {
      console.error('[Orchestrator] Decision making failed:', error);
      // 降级到默认决策
      return this.getDefaultDecision(userMessage, context);
    }
  }

  /**
   * 构建决策 Prompt
   */
  private buildDecisionPrompt(
    userMessage: string,
    context: ConversationContext
  ): string {
    const currentAgentConfig = getAgentConfig(context.currentAgent);
    const recentMessages = context.messages.slice(-5);

    return ORCHESTRATOR_DECISION_PROMPT(
      userMessage,
      context.currentAgent,
      currentAgentConfig?.capabilities || [],
      recentMessages,
      context.delegationHistory
    );
  }

  /**
   * 解析决策响应
   */
  private parseDecisionResponse(response: string): AgentDecision {
    try {
      // 尝试提取 JSON
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                       response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return {
          action: parsed.action || 'respond',
          targetAgent: parsed.targetAgent,
          targetAgents: parsed.targetAgents,
          reasoning: parsed.reasoning || '默认决策',
          taskContext: parsed.taskContext,
          requiresUserConfirmation: parsed.requiresUserConfirmation || false,
          message: parsed.message
        };
      }
    } catch (e) {
      console.warn('[Orchestrator] Failed to parse decision JSON:', e);
    }

    // 默认返回 respond
    return {
      action: 'respond',
      reasoning: '解析失败，默认直接响应'
    };
  }

  /**
   * 获取默认决策
   */
  private getDefaultDecision(
    userMessage: string,
    context: ConversationContext
  ): AgentDecision {
    const lowerMsg = userMessage.toLowerCase();

    // 检查是否是确认/同意类消息（继续当前对话）
    const confirmKeywords = ['好的', '可以', '行', '都行', '没问题', '继续', '开始', '好', '嗯', '是的', '对'];
    const isConfirmMessage = confirmKeywords.some(keyword => lowerMsg.includes(keyword));

    if (isConfirmMessage) {
      return {
        action: 'respond',
        reasoning: '用户确认继续，保持当前 Agent 处理'
      };
    }

    // 简单的规则判断
    if (lowerMsg.includes('插画') || lowerMsg.includes('手绘')) {
      return {
        action: 'delegate',
        targetAgent: 'illustrator',
        reasoning: '用户需要插画相关服务'
      };
    }

    if (lowerMsg.includes('文案') || lowerMsg.includes('标语') || lowerMsg.includes('故事')) {
      return {
        action: 'delegate',
        targetAgent: 'copywriter',
        reasoning: '用户需要文案创作服务'
      };
    }

    if (lowerMsg.includes('动画') || lowerMsg.includes('视频')) {
      return {
        action: 'delegate',
        targetAgent: 'animator',
        reasoning: '用户需要动画视频服务'
      };
    }

    if (lowerMsg.includes('调研') || lowerMsg.includes('市场') || lowerMsg.includes('分析')) {
      return {
        action: 'delegate',
        targetAgent: 'researcher',
        reasoning: '用户需要市场调研服务'
      };
    }

    // 默认保持当前 Agent
    return {
      action: 'respond',
      reasoning: '继续当前对话'
    };
  }

  /**
   * 执行直接响应
   */
  private async executeRespond(
    userMessage: string,
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    const systemPrompt = getAgentSystemPrompt(context.currentAgent);
    const aiResponse = await callAgent(
      systemPrompt,
      context.messages,
      userMessage,
      context.currentAgent
    );

    return {
      type: 'response',
      agent: context.currentAgent,
      content: aiResponse.content,
      aiResponse
    };
  }

  /**
   * 执行任务委派
   */
  private async executeDelegate(
    decision: AgentDecision,
    userMessage: string,
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    const targetAgent = decision.targetAgent!;
    const fromAgent = context.currentAgent;

    // 创建委派任务记录
    const delegationTask: DelegationTask = {
      id: `delegation-${Date.now()}`,
      fromAgent,
      toAgent: targetAgent,
      taskDescription: decision.taskContext?.requirements || userMessage,
      context: decision.reasoning,
      status: 'in_progress',
      createdAt: Date.now()
    };

    // 构建委派消息（包含上下文传递）
    const delegationMessage = buildDelegationPrompt(
      fromAgent,
      targetAgent,
      decision.taskContext?.requirements || userMessage,
      decision.reasoning,
      context.messages
    );

    // 调用目标 Agent
    const systemPrompt = getAgentSystemPrompt(targetAgent);

    // 构建历史消息（包含上下文）
    const historyMessages: AgentMessage[] = context.messages.map(msg => ({
      ...msg,
      id: msg.id || Date.now().toString()
    }));

    const aiResponse = await callAgent(
      systemPrompt,
      historyMessages, // 传递完整对话上下文
      delegationMessage,
      targetAgent
    );

    return {
      type: 'delegation',
      agent: targetAgent,
      content: aiResponse.content,
      aiResponse,
      delegationTask
    };
  }

  /**
   * 执行协作
   */
  private async executeCollaborate(
    decision: AgentDecision,
    userMessage: string,
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    const targetAgents = decision.targetAgents || [decision.targetAgent!];

    // 协作模式下，先由当前 Agent 响应，然后并行调用其他 Agents
    const systemPrompt = getAgentSystemPrompt(context.currentAgent);
    const aiResponse = await callAgent(
      systemPrompt,
      context.messages,
      userMessage,
      context.currentAgent
    );

    return {
      type: 'collaboration',
      agent: context.currentAgent,
      content: aiResponse.content,
      aiResponse,
      collaborationAgents: targetAgents
    };
  }

  /**
   * 执行交接
   */
  private async executeHandoff(
    decision: AgentDecision,
    userMessage: string,
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    const targetAgent = decision.targetAgent!;

    // 交接：完全转移控制权给新 Agent
    const handoffMessage = `我是${AGENT_CONFIG[context.currentAgent].name}，现在将任务交接给你。

用户需求：${userMessage}

请继续为用户提供服务。`;

    const systemPrompt = getAgentSystemPrompt(targetAgent);
    const aiResponse = await callAgent(
      systemPrompt,
      [], // 清空历史，新 Agent 接管
      handoffMessage,
      targetAgent
    );

    return {
      type: 'handoff',
      agent: targetAgent,
      content: aiResponse.content,
      aiResponse
    };
  }

  /**
   * 执行 Agent 链
   */
  private async executeChain(
    decision: AgentDecision,
    userMessage: string,
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    // 构建 Agent 队列
    const chainQueue = decision.targetAgents || [decision.targetAgent!];

    // 当前只执行第一个 Agent，后续通过队列处理
    const firstAgent = chainQueue[0];
    const systemPrompt = getAgentSystemPrompt(firstAgent);

    const chainMessage = `这是一个多步骤任务的第 1/${chainQueue.length} 步。

任务描述：${decision.taskContext?.requirements || userMessage}

请完成你的部分，后续会由其他同事继续。`;

    const aiResponse = await callAgent(
      systemPrompt,
      [],
      chainMessage,
      firstAgent
    );

    return {
      type: 'chain',
      agent: firstAgent,
      content: aiResponse.content,
      aiResponse,
      chainQueue: chainQueue.slice(1) // 剩余队列
    };
  }

  /**
   * 继续执行 Agent 链的下一步
   */
  async continueChain(
    previousResult: string,
    remainingQueue: AgentType[],
    originalTask: string
  ): Promise<OrchestratorResponse | null> {
    if (remainingQueue.length === 0) return null;

    const nextAgent = remainingQueue[0];
    const systemPrompt = getAgentSystemPrompt(nextAgent);

    const chainMessage = `这是一个多步骤任务的第 ${remainingQueue.length}/${remainingQueue.length + 1} 步。

原始任务：${originalTask}

上一步的结果：${previousResult}

请基于以上信息继续完成任务。`;

    const aiResponse = await callAgent(
      systemPrompt,
      [],
      chainMessage,
      nextAgent
    );

    return {
      type: 'chain',
      agent: nextAgent,
      content: aiResponse.content,
      aiResponse,
      chainQueue: remainingQueue.slice(1)
    };
  }

  /**
   * 并行调用多个 Agents（用于协作）
   */
  async collaborateWithAgents(
    agents: AgentType[],
    taskDescription: string,
    context: ConversationContext
  ): Promise<Map<AgentType, AIResponse>> {
    const results = new Map<AgentType, AIResponse>();

    // 并行调用所有 Agents
    const promises = agents.map(async (agent) => {
      const systemPrompt = getAgentSystemPrompt(agent);
      const collaborateMessage = `这是一个协作任务，你需要与${agents.length - 1}位同事一起完成。

任务描述：${taskDescription}

请专注于你的专业领域，提供你的部分。`;

      const aiResponse = await callAgent(
        systemPrompt,
        [],
        collaborateMessage,
        agent
      );

      results.set(agent, aiResponse);
    });

    await Promise.all(promises);
    return results;
  }
}

// 导出单例实例
export const agentOrchestrator = new AgentOrchestrator();

// 导出便捷函数
export async function processWithOrchestrator(
  userMessage: string,
  context: ConversationContext
): Promise<OrchestratorResponse> {
  return agentOrchestrator.processUserInput(userMessage, context);
}
