// Agent 编排器 - 负责 Agent 之间的任务委派和决策

import {
  AgentType,
  AgentDecision,
  AgentMessage,
  DelegationTask,
  AgentAction,
  getAgentConfig,
  AGENT_CONFIG,
  RequirementCollection,
  CollectedRequirementInfo
} from '../types/agent';
import { callQwenChat } from '@/services/llm/chatProviders';
import {
  ORCHESTRATOR_DECISION_PROMPT,
  getAgentSystemPrompt,
  buildDelegationPrompt,
  REQUIREMENT_COLLECTION_PROMPT,
  REQUIREMENT_SUMMARY_PROMPT,
  TASK_ASSIGNMENT_PROMPT,
  REQUIREMENT_INITIAL_PROMPT,
  REQUIREMENT_DEEP_DIVE_PROMPT,
  REQUIREMENT_CONFIRMATION_PROMPT,
  REQUIREMENT_INFERENCE_PROMPT,
  REQUIREMENT_PRIORITY_PROMPT
} from './agentPrompts';
import { callAgent, AIResponse } from './agentService';

// 对话上下文
export interface ConversationContext {
  currentAgent: AgentType;
  messages: AgentMessage[];
  taskDescription?: string;
  delegationHistory: DelegationTask[];
  requirementCollection?: RequirementCollection; // 需求收集状态
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

    // 如果是总监Agent，使用智能需求收集流程
    if (context.currentAgent === 'director' && context.requirementCollection) {
      return this.processDirectorInput(userMessage, context);
    }

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
   * 处理总监Agent的输入 - 智能需求收集流程
   */
  private async processDirectorInput(
    userMessage: string,
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    const reqCollection = context.requirementCollection!;

    console.log('[Orchestrator] Director input, stage:', reqCollection.stage);

    // 根据需求收集阶段处理
    switch (reqCollection.stage) {
      case 'initial':
        // 初始阶段：欢迎用户并询问基本信息
        return this.executeRequirementInitial(userMessage, context);

      case 'collecting':
        // 收集阶段：继续收集需求信息
        return this.executeRequirementDeepDive(userMessage, context);

      case 'confirming':
        // 确认阶段：展示总结并等待用户确认
        if (this.isConfirmation(userMessage)) {
          return this.executeTaskAssignment(context);
        } else {
          // 用户有修改意见，回到收集阶段
          return this.executeRequirementChange(userMessage, context);
        }

      case 'completed':
        // 已完成需求收集，正常处理
        const decision = await this.makeDecision(userMessage, context);
        return this.executeDecision(decision, userMessage, context);

      default:
        return this.executeRespond(userMessage, context);
    }
  }

  /**
   * 执行需求收集初始阶段
   */
  private async executeRequirementInitial(
    userMessage: string,
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    // 使用专门的初始阶段Prompt
    const response = await callAgent(
      REQUIREMENT_INITIAL_PROMPT,
      context.messages,
      userMessage,
      'director'
    );

    return {
      type: 'response',
      agent: 'director',
      content: response.content,
      aiResponse: response
    };
  }

  /**
   * 执行需求收集深入阶段
   */
  private async executeRequirementDeepDive(
    userMessage: string,
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    const reqCollection = context.requirementCollection!;

    // 构建深入阶段的Prompt
    const prompt = REQUIREMENT_DEEP_DIVE_PROMPT
      .replace('{{collectedInfo}}', JSON.stringify(reqCollection.collectedInfo, null, 2));

    const response = await callAgent(
      prompt,
      context.messages,
      userMessage,
      'director'
    );

    return {
      type: 'response',
      agent: 'director',
      content: response.content,
      aiResponse: response
    };
  }

  /**
   * 执行需求变更处理
   */
  private async executeRequirementChange(
    userMessage: string,
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    const reqCollection = context.requirementCollection!;

    // 构建变更处理的Prompt
    const prompt = `用户想要修改需求。原始需求：${JSON.stringify(reqCollection.collectedInfo)}。用户的修改：${userMessage}`;

    const response = await callAgent(
      prompt,
      context.messages,
      userMessage,
      'director'
    );

    return {
      type: 'response',
      agent: 'director',
      content: response.content,
      aiResponse: response
    };
  }

  /**
   * 执行需求收集
   */
  private async executeRequirementCollection(
    userMessage: string,
    context: ConversationContext,
    stage: 'initial' | 'collecting'
  ): Promise<OrchestratorResponse> {
    const reqCollection = context.requirementCollection!;
    
    // 构建需求收集Prompt
    const prompt = REQUIREMENT_COLLECTION_PROMPT
      .replace('{{collectedInfo}}', JSON.stringify(reqCollection.collectedInfo, null, 2))
      .replace('{{pendingQuestions}}', reqCollection.pendingQuestions.join('\n'));

    // 调用AI生成回复
    const response = await callAgent(
      prompt,
      context.messages,
      userMessage,
      'director'
    );

    return {
      type: 'response',
      agent: 'director',
      content: response.content,
      aiResponse: response
    };
  }

  /**
   * 执行需求总结展示
   */
  private async executeRequirementSummary(
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    const reqCollection = context.requirementCollection!;

    // 先进行需求优先级分析
    const priorityPrompt = REQUIREMENT_PRIORITY_PROMPT
      .replace('{{collectedInfo}}', JSON.stringify(reqCollection.collectedInfo, null, 2));

    let priorityAnalysis: any = {};
    try {
      const priorityResponse = await callQwenChat({
        model: 'qwen-turbo',
        messages: [{ role: 'user', content: priorityPrompt }],
        temperature: 0.3,
        max_tokens: 1000
      });

      // 解析优先级分析
      const jsonMatch = priorityResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
                       priorityResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        priorityAnalysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
    } catch (error) {
      console.warn('[Orchestrator] Priority analysis failed:', error);
    }

    // 构建总结Prompt
    const prompt = REQUIREMENT_SUMMARY_PROMPT
      .replace('{{collectedInfo}}', JSON.stringify(reqCollection.collectedInfo, null, 2));

    // 调用AI生成总结
    const response = await callAgent(
      prompt,
      context.messages,
      '请总结需求',
      'director'
    );

    // 构建增强的总结内容
    let enhancedContent = response.content;

    // 添加复杂度评估（如果有）
    if (priorityAnalysis.complexity) {
      const complexityEmoji = priorityAnalysis.complexity === 'complex' ? '🔴' :
                             priorityAnalysis.complexity === 'medium' ? '🟡' : '🟢';
      enhancedContent += `\n\n${complexityEmoji} **复杂度评估**: ${priorityAnalysis.complexity === 'complex' ? '复杂' : priorityAnalysis.complexity === 'medium' ? '中等' : '简单'}`;
    }

    // 添加预估时间（如果有）
    if (priorityAnalysis.estimatedTime) {
      enhancedContent += `\n⏱️ **预估时间**: ${priorityAnalysis.estimatedTime}`;
    }

    // 添加建议团队（如果有）
    if (priorityAnalysis.requiredAgents && priorityAnalysis.requiredAgents.length > 0) {
      const agentNames = priorityAnalysis.requiredAgents.map((agent: string) => {
        const config = AGENT_CONFIG[agent as keyof typeof AGENT_CONFIG];
        return config ? config.name : agent;
      });
      enhancedContent += `\n👥 **建议团队**: ${agentNames.join('、')}`;
    }

    enhancedContent += '\n\n✅ 确认无误的话，我将为你安排合适的团队成员。💡 如有修改请告诉我！';

    return {
      type: 'response',
      agent: 'director',
      content: enhancedContent,
      aiResponse: {
        ...response,
        metadata: {
          ...response.metadata,
          priorityAnalysis
        }
      }
    };
  }

  /**
   * 执行任务分配
   */
  private async executeTaskAssignment(
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    const reqCollection = context.requirementCollection!;
    
    // 构建任务分配Prompt
    const prompt = TASK_ASSIGNMENT_PROMPT
      .replace('{{collectedInfo}}', JSON.stringify(reqCollection.collectedInfo, null, 2));

    // 调用AI做分配决策
    const response = await callQwenChat({
      model: 'qwen-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000
    });

    // 解析分配决策
    const decision = this.parseAssignmentDecision(response);

    // 执行分配
    switch (decision.action) {
      case 'delegate':
        return this.executeDelegate(decision, '任务分配', context);
      case 'collaborate':
        return this.executeCollaborate(decision, '任务分配', context);
      default:
        return this.executeDelegate(decision, '任务分配', context);
    }
  }

  /**
   * 解析任务分配决策
   */
  private parseAssignmentDecision(response: string): AgentDecision {
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                       response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return {
          action: parsed.action || 'delegate',
          targetAgent: parsed.targetAgent,
          targetAgents: parsed.targetAgents,
          reasoning: parsed.reasoning || '基于需求分析的智能分配',
          taskContext: parsed.taskContext,
          message: parsed.message
        };
      }
    } catch (error) {
      console.error('[Orchestrator] Failed to parse assignment decision:', error);
    }

    // 智能默认分配 - 根据需求内容推断
    return this.getSmartDefaultAssignment();
  }

  /**
   * 获取智能默认分配
   */
  private getSmartDefaultAssignment(): AgentDecision {
    const context = this.currentContext;
    if (!context?.requirementCollection) {
      return {
        action: 'delegate',
        targetAgent: 'designer',
        reasoning: '默认分配给品牌设计师'
      };
    }

    const { collectedInfo } = context.requirementCollection;
    const projectType = collectedInfo.projectType?.toLowerCase() || '';

    // 根据项目类型智能分配
    if (projectType.includes('动画') || projectType.includes('视频')) {
      return {
        action: 'delegate',
        targetAgent: 'animator',
        reasoning: '动画视频项目分配给动画师'
      };
    }

    if (projectType.includes('插画') || projectType.includes('手绘')) {
      return {
        action: 'delegate',
        targetAgent: 'illustrator',
        reasoning: '插画项目分配给插画师'
      };
    }

    if (projectType.includes('文案') || projectType.includes('标语')) {
      return {
        action: 'delegate',
        targetAgent: 'copywriter',
        reasoning: '文案项目分配给文案策划'
      };
    }

    if (projectType.includes('调研') || projectType.includes('分析')) {
      return {
        action: 'delegate',
        targetAgent: 'researcher',
        reasoning: '调研项目分配给研究员'
      };
    }

    // 检查风格偏好
    const stylePreference = collectedInfo.stylePreference?.toLowerCase() || '';
    if (stylePreference.includes('手绘') || stylePreference.includes('插画')) {
      return {
        action: 'delegate',
        targetAgent: 'illustrator',
        reasoning: '手绘风格项目分配给插画师'
      };
    }

    // 默认分配给设计师
    return {
      action: 'delegate',
      targetAgent: 'designer',
      reasoning: '品牌设计项目分配给品牌设计师'
    };
  }

  /**
   * 检查用户是否确认需求
   */
  private isConfirmation(message: string): boolean {
    const confirmKeywords = ['确认', '没问题', '对的', '是的', '可以', '好', 'ok', '没问题'];
    const lowerMsg = message.toLowerCase();
    return confirmKeywords.some(keyword => lowerMsg.includes(keyword));
  }

  /**
   * 执行决策
   */
  private async executeDecision(
    decision: AgentDecision,
    userMessage: string,
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
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

    // 视频/动画相关关键词
    const videoKeywords = [
      '动画', '视频', '短片', '动效', 'gif', '表情包',
      'video', 'animation', 'motion', 'short film', 'clip',
      '短视频', '宣传片', '广告片', '片头', '片尾',
      '转场', '特效', 'mg动画', '二维动画', '三维动画'
    ];
    
    if (videoKeywords.some(keyword => lowerMsg.includes(keyword))) {
      return {
        action: 'delegate',
        targetAgent: 'animator',
        reasoning: '用户需要动画视频制作服务'
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

    // 协作模式：并行调用所有目标 Agents
    const collaborationPrompts = targetAgents.map(agent => {
      const systemPrompt = getAgentSystemPrompt(agent);
      const collaborationMessage = `协作任务：${userMessage}\n\n请从你的专业角度提供见解和建议。`;
      return callAgent(
        systemPrompt,
        context.messages,
        collaborationMessage,
        agent
      );
    });

    // 并行执行所有 Agent 调用
    const agentResponses = await Promise.all(collaborationPrompts);

    // 汇总所有 Agent 的响应
    let combinedContent = `我已组织团队成员进行协作分析：\n\n`;
    targetAgents.forEach((agent, index) => {
      const response = agentResponses[index];
      combinedContent += `**${AGENT_CONFIG[agent].name}**：${response.content}\n\n`;
    });

    combinedContent += `综合团队意见，我们建议：[综合建议将在此生成]`;

    return {
      type: 'collaboration',
      agent: 'director', // 由总监汇总
      content: combinedContent,
      aiResponse: {
        content: combinedContent,
        type: 'text',
        metadata: {
          collaborationResults: targetAgents.map((agent, index) => ({
            agent,
            content: agentResponses[index].content,
            timestamp: Date.now()
          }))
        }
      },
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
