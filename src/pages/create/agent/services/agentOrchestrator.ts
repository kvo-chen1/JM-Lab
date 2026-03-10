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
import { callEnhancedAgent, EnhancedAIResponse } from './enhancedAgentIntegration';
import { llmService } from '@/services/llmService';

// 对话上下文
export interface ConversationContext {
  currentAgent: AgentType;
  messages: AgentMessage[];
  taskDescription?: string;
  delegationHistory: DelegationTask[];
  requirementCollection?: RequirementCollection; // 需求收集状态
  selectedStyle?: string; // 用户选择的风格
  sessionId?: string; // 会话ID（用于增强功能）
  userId?: string; // 用户ID（用于增强功能）
  currentTask?: {
    type: string;
    requirements: {
      description?: string;
      style?: string;
      targetAudience?: string;
      usageScenario?: string;
      brandValues?: string;
    };
  };
}

// 编排器响应
export interface OrchestratorResponse {
  type: 'response' | 'delegation' | 'collaboration' | 'chain' | 'handoff' | 'image_generation' | 'generating';
  agent: AgentType;
  content: string;
  aiResponse?: AIResponse & { type?: string };
  delegationTask?: DelegationTask;
  collaborationAgents?: AgentType[];
  chainQueue?: AgentType[];
  generatedImage?: {
    url: string;
    prompt: string;
    description?: string;
    title?: string;
  };
  generatingPrompt?: string; // 生成中的提示词
}

/**
 * Agent 编排器类
 * 负责管理 Agent 之间的协作和任务流转
 */
export class AgentOrchestrator {
  private currentContext: ConversationContext | null = null;
  private enableEnhancedFeatures = true; // 是否启用增强功能

  /**
   * 设置当前上下文
   */
  setContext(context: ConversationContext) {
    this.currentContext = context;
  }

  /**
   * 设置是否启用增强功能
   */
  setEnhancedFeatures(enabled: boolean) {
    this.enableEnhancedFeatures = enabled;
  }

  /**
   * 智能调用Agent（自动选择增强版或基础版）
   */
  private async smartCallAgent(
    systemPrompt: string,
    messages: AgentMessage[],
    userMessage: string,
    agent: AgentType
  ): Promise<AIResponse> {
    // 如果启用了增强功能且有用户ID和会话ID，使用增强版
    if (this.enableEnhancedFeatures && 
        this.currentContext?.userId && 
        this.currentContext?.sessionId) {
      try {
        const enhancedResponse = await callEnhancedAgent(
          systemPrompt,
          messages,
          userMessage,
          agent,
          {
            userId: this.currentContext.userId,
            sessionId: this.currentContext.sessionId,
            enableIntentRecognition: true,
            enableEntityExtraction: true,
            enableContextTracking: true,
            enablePersonalization: true,
            enableMemory: true
          }
        );
        
        console.log('[Orchestrator] EnhancedAgent used:', {
          intent: enhancedResponse.detectedIntent,
          entities: enhancedResponse.extractedEntities?.length,
          personalized: enhancedResponse.personalized
        });
        
        return enhancedResponse;
      } catch (error) {
        console.warn('[Orchestrator] EnhancedAgent failed, falling back to basic:', error);
        // 降级到基础版本
        return callAgent(systemPrompt, messages, userMessage, agent);
      }
    }
    
    // 使用基础版本
    return callAgent(systemPrompt, messages, userMessage, agent);
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

    // 检测用户是否想要跳过需求收集直接生成
    if (this.isSkipToGeneration(userMessage)) {
      console.log('[Orchestrator] User wants to skip requirement collection');
      // 标记需求收集完成，使用默认信息
      reqCollection.stage = 'completed';
      reqCollection.collectedInfo = {
        ...reqCollection.collectedInfo,
        skipDetails: true,
        note: '用户选择跳过详细需求收集，使用默认配置'
      };

      // 直接进入任务分配或响应
      return this.executeTaskAssignment(context);
    }

    // 根据需求收集阶段处理
    switch (reqCollection.stage) {
      case 'initial':
        // 初始阶段：欢迎用户并询问基本信息
        return this.executeRequirementInitial(userMessage, context);

      case 'collecting':
        // 收集阶段：检测用户是否想要跳过并直接生成
        if (this.isSkipToGeneration(userMessage)) {
          console.log('[Orchestrator] User wants to skip and generate directly');
          reqCollection.stage = 'completed';
          // 直接触发图像生成
          return this.executeImageGeneration(userMessage, context);
        }
        if (this.isConfirmation(userMessage)) {
          console.log('[Orchestrator] User confirmed during collecting stage, proceeding to assignment');
          reqCollection.stage = 'completed';
          return this.executeTaskAssignment(context);
        }
        // 继续收集需求信息
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
    const response = await this.smartCallAgent(
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

    const response = await this.smartCallAgent(
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

    const response = await this.smartCallAgent(
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
    const response = await this.smartCallAgent(
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
        model: 'qwen-plus',
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
    const response = await this.smartCallAgent(
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
      model: 'qwen-plus',
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
   * 检测用户是否想要跳过需求收集直接生成
   */
  private isSkipToGeneration(message: string): boolean {
    const skipKeywords = [
      '直接生成', '直接开始', '开始生成', '生成吧', '开始吧',
      '不想', '不用了', '不需要', '不需要了', '跳过', '直接做',
      '就这样', '直接开始设计', '直接设计', '开始设计',
      '可以生成了', '可以开始了', '开始吧', '生成', '开始制作',
      '不用调整', '不用修改', '直接出图', '出图吧'
    ];
    const lowerMsg = message.toLowerCase();
    return skipKeywords.some(keyword => lowerMsg.includes(keyword));
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
        model: 'qwen-plus',
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
   * 检测是否是角色设计需求
   */
  private isCharacterDesignRequest(userMessage: string): boolean {
    const lowerMsg = userMessage.toLowerCase();
    const characterKeywords = [
      '角色设计', 'ip设计', 'ip形象', '形象设计', '角色形象',
      '设计一个角色', '设计一个ip', '创建角色', '创建形象',
      'character design', 'ip character', 'mascot design'
    ];
    return characterKeywords.some(keyword => lowerMsg.includes(keyword));
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

    // 检测角色设计需求 - 使用专门的向导式工作流
    if (this.isCharacterDesignRequest(userMessage)) {
      return {
        action: 'respond',
        reasoning: '用户需要角色设计服务，使用向导式工作流',
        taskContext: {
          taskType: 'character-design',
          requirements: userMessage,
          priority: 'high'
        }
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
   * 检测用户是否想要生成图像
   */
  private shouldGenerateImage(userMessage: string, context: ConversationContext): boolean {
    // 如果是设计师或插画师Agent，且用户表达了生成图像的意图
    if (context.currentAgent !== 'designer' && context.currentAgent !== 'illustrator') {
      return false;
    }

    const lowerMsg = userMessage.toLowerCase();

    // 检测生成图像的关键词
    const generationKeywords = [
      '生成', '画', '画一个', '画一下', '绘制', '创作', '设计',
      '生成图像', '生成图片', '画出来', '画个', '画幅',
      '开始设计', '开始画', '开始生成', '帮我画', '帮我生成',
      '你能画', '你能生成', '可以画', '可以生成'
    ];

    const hasGenerationIntent = generationKeywords.some(keyword => 
      lowerMsg.includes(keyword)
    );

    // 检测确认/同意类关键词（在需求收集完成后）
    const confirmationKeywords = ['可以', '好的', '行', '没问题', '确认', '就这样', '开始吧', '生成吧', '做吧'];
    const hasConfirmation = confirmationKeywords.some(keyword => 
      lowerMsg.includes(keyword)
    );

    // 如果有任务描述且用户确认，也触发生成
    const hasTaskDescription = !!context.currentTask?.requirements?.description;
    const shouldGenerate = hasGenerationIntent || (hasConfirmation && hasTaskDescription);

    console.log('[Orchestrator] 检测图像生成意图:', {
      userMessage,
      currentAgent: context.currentAgent,
      hasGenerationIntent,
      hasConfirmation,
      hasTaskDescription,
      shouldGenerate
    });

    return shouldGenerate;
  }

  /**
   * 执行图像生成
   */
  private async executeImageGeneration(
    userMessage: string,
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    console.log('[Orchestrator] 开始执行图像生成');
    console.log('[Orchestrator] 用户消息:', userMessage);
    console.log('[Orchestrator] 当前任务:', context.currentTask);
    console.log('[Orchestrator] 选择的风格:', context.selectedStyle);

    // 构建图像生成提示词
    // 优先使用用户选择的风格，其次是任务需求中的风格，最后是默认风格
    const selectedStyle = context.selectedStyle ||
                         context.currentTask?.requirements?.style ||
                         this.getStylePrompt(context.currentAgent);

    // 构建完整的提示词，包含用户的完整需求
    const taskDescription = context.currentTask?.requirements?.description || userMessage;
    const targetAudience = context.currentTask?.requirements?.targetAudience;
    const usageScenario = context.currentTask?.requirements?.usageScenario;

    // 构建详细的提示词
    let prompt = `${taskDescription}`;

    // 添加目标受众信息
    if (targetAudience) {
      prompt += `，目标受众是${targetAudience}`;
    }

    // 添加使用场景信息
    if (usageScenario) {
      prompt += `，使用场景为${usageScenario}`;
    }

    // 添加风格要求
    prompt += `，${selectedStyle}风格，高质量，精美细节，专业设计作品`;

    console.log('[Orchestrator] 生成的提示词:', prompt);

    // 先返回"生成中"状态
    return {
      type: 'generating',
      agent: context.currentAgent,
      content: `🎨 **开始生成设计稿**

正在根据你的需求创作${selectedStyle}风格的作品...

⏱️ 预计需要 10-30 秒，请稍候～`,
      generatingPrompt: prompt,
      aiResponse: {
        content: `🎨 **开始生成设计稿**

正在根据你的需求创作${selectedStyle}风格的作品...

⏱️ 预计需要 10-30 秒，请稍候～`,
        type: 'text'
      }
    };
  }

  /**
   * 继续执行图像生成（实际调用API）
   */
  private async continueImageGeneration(
    prompt: string,
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    console.log('[Orchestrator] 继续执行图像生成，提示词:', prompt);

    const selectedStyle = context.selectedStyle ||
                         context.currentTask?.requirements?.style ||
                         this.getStylePrompt(context.currentAgent);
    const taskDescription = context.currentTask?.requirements?.description || prompt;

    try {
      // 调用图像生成API
      const result = await llmService.generateImage({
        model: 'wanx-v1',
        prompt: prompt,
        size: '1024x1024',
        n: 1
      });

      console.log('[Orchestrator] 图像生成结果:', result);

      if (!result.ok) {
        throw new Error(result.error || '图像生成失败');
      }

      // 提取图像URL
      let imageUrl: string | undefined;
      if (result.data?.data && Array.isArray(result.data.data) && result.data.data.length > 0) {
        imageUrl = result.data.data[0].url;
      } else if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        imageUrl = result.data[0].url;
      }

      if (!imageUrl) {
        throw new Error('无法获取生成的图像URL');
      }

      // 生成成功后的回复内容
      const taskType = context.currentTask?.type || '设计';
      const content = `✨ **生成完成！**

我已经为你创作了${selectedStyle}风格的${taskType}作品，基于你的需求：「${taskDescription}」

看看效果如何？如果需要调整风格、颜色或细节，随时告诉我！`;

      return {
        type: 'image_generation',
        agent: context.currentAgent,
        content: content,
        generatedImage: {
          url: imageUrl,
          prompt: prompt
        }
      };
    } catch (error: any) {
      console.error('[Orchestrator] 图像生成失败:', error);

      // 返回错误响应
      return {
        type: 'response',
        agent: context.currentAgent,
        content: `❌ **生成失败**

抱歉，图像生成遇到了问题：${error.message}

可能的原因：
- 网络连接不稳定
- 服务器繁忙
- 提示词需要调整

请稍后重试，或者换一种描述方式告诉我你的需求～`
      };
    }
  }

  /**
   * 获取当前Agent的风格提示词
   */
  private getStylePrompt(agentType: AgentType): string {
    switch (agentType) {
      case 'designer':
        return '现代品牌设计风格，简洁专业';
      case 'illustrator':
        return '治愈冒险漫画风格，温暖手绘';
      case 'copywriter':
        return '文案配图风格';
      default:
        return '高质量插画风格';
    }
  }

  /**
   * 执行直接响应
   */
  private async executeRespond(
    userMessage: string,
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    // 首先检测是否应该生成图像
    if (this.shouldGenerateImage(userMessage, context)) {
      console.log('[Orchestrator] 检测到图像生成意图，执行图像生成');
      return this.executeImageGeneration(userMessage, context);
    }

    // 检测是否是角色设计需求，使用向导式工作流
    if (this.isCharacterDesignRequest(userMessage)) {
      console.log('[Orchestrator] 检测到角色设计需求，启动向导式工作流');
      return {
        type: 'response',
        agent: 'designer',
        content: '我来帮你设计一个独特的角色形象！请按照下方的向导逐步完成角色设定。',
        aiResponse: {
          content: '我来帮你设计一个独特的角色形象！请按照下方的向导逐步完成角色设定。',
          type: 'character-workflow'
        }
      };
    }

    try {
      const systemPrompt = getAgentSystemPrompt(context.currentAgent);
      const aiResponse = await this.smartCallAgent(
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
    } catch (error) {
      console.error('[Orchestrator] executeRespond error:', error);

      // 返回降级回复
      return {
        type: 'response',
        agent: context.currentAgent,
        content: `抱歉，服务暂时不可用。我是${AGENT_CONFIG[context.currentAgent].name}，请稍后再试，或者重新描述你的需求。`,
        aiResponse: {
          content: `抱歉，服务暂时不可用。我是${AGENT_CONFIG[context.currentAgent].name}，请稍后再试，或者重新描述你的需求。`,
          type: 'text'
        }
      };
    }
  }

  /**
   * 执行任务委派
   */
  private async executeDelegate(
    decision: AgentDecision,
    userMessage: string,
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    const targetAgent = decision.targetAgent || 'designer';
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

    const aiResponse = await this.smartCallAgent(
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
   * 执行协作 - 优化版：支持超时和错误处理
   */
  private async executeCollaborate(
    decision: AgentDecision,
    userMessage: string,
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    const targetAgents = decision.targetAgents || [decision.targetAgent || 'designer'];

    // 协作模式：并行调用所有目标 Agents，带超时和错误处理
    const collaborationPromises = targetAgents.map(async (agent) => {
      const systemPrompt = getAgentSystemPrompt(agent);
      const collaborationMessage = `协作任务：${userMessage}\n\n请从你的专业角度提供见解和建议。`;

      try {
        // 添加单个Agent超时控制（15秒）
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`${agent} 响应超时`)), 15000);
        });

        const response = await Promise.race([
          callAgent(systemPrompt, context.messages, collaborationMessage, agent),
          timeoutPromise
        ]);

        return { agent, response, success: true as const };
      } catch (error) {
        console.warn(`[Orchestrator] Agent ${agent} collaboration failed:`, error);
        return {
          agent,
          response: { content: '该成员暂时无法提供意见', type: 'text' as const },
          success: false as const,
          error: error instanceof Error ? error.message : '未知错误'
        };
      }
    });

    // 并行执行所有 Agent 调用，等待所有完成
    const agentResults = await Promise.all(collaborationPromises);

    // 分离成功和失败的结果
    const successfulResults = agentResults.filter(r => r.success);
    const failedResults = agentResults.filter(r => !r.success);

    // 汇总所有 Agent 的响应
    let combinedContent = `我已组织团队成员进行协作分析：\n\n`;

    successfulResults.forEach(({ agent, response }) => {
      const agentConfig = AGENT_CONFIG[agent as keyof typeof AGENT_CONFIG];
      const agentName = agentConfig?.name || agent;
      combinedContent += `**${agentName}**：${response.content}\n\n`;
    });

    // 如果有失败的，添加提示
    if (failedResults.length > 0) {
      combinedContent += `\n*注：${failedResults.length}位成员暂时无法参与讨论*\n\n`;
    }

    combinedContent += `综合团队意见，我们建议：根据以上专业分析，这是一个需要多维度考虑的创意任务。建议结合各位专家的意见，制定综合方案。`;

    return {
      type: 'collaboration',
      agent: 'director',
      content: combinedContent,
      aiResponse: {
        content: combinedContent,
        type: 'text',
        metadata: {
          collaborationResults: successfulResults.map(({ agent, response }) => ({
            agent,
            content: response.content,
            timestamp: Date.now()
          })),
          failedAgents: failedResults.map(({ agent, error }) => ({
            agent,
            error
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
    const aiResponse = await this.smartCallAgent(
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
   * 解析任务分配决策
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

    const aiResponse = await this.smartCallAgent(
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

    const aiResponse = await this.smartCallAgent(
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

      const aiResponse = await this.smartCallAgent(
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
