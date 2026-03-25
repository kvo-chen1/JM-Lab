// Agent 编排器 - 负责 Agent 之间的任务委派和决策

import {
  AgentType,
  AgentDecision,
  AgentMessage,
  DelegationTask,
  getAgentConfig,
  AGENT_CONFIG,
  RequirementCollection,
  PRESET_STYLES
} from '../types/agent';
import {
  ORCHESTRATOR_DECISION_PROMPT,
  getAgentSystemPrompt,
  buildDelegationPrompt,
  REQUIREMENT_COLLECTION_PROMPT,
  REQUIREMENT_SUMMARY_PROMPT,
  TASK_ASSIGNMENT_PROMPT,
  REQUIREMENT_INITIAL_PROMPT,
  REQUIREMENT_DEEP_DIVE_PROMPT,
  REQUIREMENT_PRIORITY_PROMPT
} from './agentPrompts';
import { callAgent, AIResponse } from './agentService';
import { callEnhancedAgent } from './enhancedAgentIntegration';
import { llmService } from '@/services/llmService';
import { detectMultiStepTask, MultiStepTaskResult, TaskStep } from './intentRecognition';
import { getWorkflowEngine, Workflow, WorkflowInstance } from './workflowEngine';

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

// 对话上下文
export interface ConversationContext {
  currentAgent: AgentType;
  messages: AgentMessage[];
  taskDescription?: string;
  delegationHistory: DelegationTask[];
  requirementCollection?: RequirementCollection; // 需求收集状态
  selectedStyle?: string; // 用户选择的风格
  selectedBrand?: string; // 用户选择的品牌
  excludedElements?: string[]; // 用户明确排除的元素
  sessionId?: string; // 会话 ID（用于增强功能）
  userId?: string; // 用户 ID（用于增强功能）
  mentionedWorks?: { id: string; name: string; title?: string; imageUrl?: string; description?: string; prompt?: string; style?: string; type?: 'image' | 'video' | 'text' }[]; // 引用的作品信息
  images?: { url: string; thumbnail?: string; name: string; size: number }[]; // 用户上传的图片
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
  type: 'response' | 'delegation' | 'collaboration' | 'chain' | 'handoff' | 'image_generation' | 'generating' | 'workflow' | 'style-options' | 'image' | 'error' | 'character-workflow';
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
  workflow?: {
    id: string;
    name: string;
    steps: TaskStep[];
    estimatedDuration: string;
    currentStepIndex: number;
  };
  metadata?: {
    showStyleSelector?: boolean;
    [key: string]: any;
  };
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
    // 获取引用的作品信息
    const mentionedWorks = this.currentContext?.mentionedWorks;

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
        
        // 将 mentionedWorks 添加到响应的 metadata 中
        if (mentionedWorks && mentionedWorks.length > 0) {
          enhancedResponse.metadata = {
            ...enhancedResponse.metadata,
            mentionedWorks
          };
        }
        
        console.log('[Orchestrator] EnhancedAgent used:', {
          intent: enhancedResponse.detectedIntent,
          entities: enhancedResponse.extractedEntities?.length,
          personalized: enhancedResponse.personalized
        });
        
        return enhancedResponse;
      } catch (error) {
        console.warn('[Orchestrator] EnhancedAgent failed, falling back to basic:', error);
        // 降级到基础版本
      }
    }
    
    // 使用智能版本（支持作品引用）
    try {
      const { callAgentIntelligent } = await import('./agentService');
      const intelligentResponse = await callAgentIntelligent(userMessage, agent, {
        history: messages,
        mentionedWorks,
        enableRAG: true,
        enableMemory: true,
        enableIntent: true
      });
      return intelligentResponse;
    } catch (error) {
      console.warn('[Orchestrator] Intelligent agent failed, falling back to basic:', error);
      // 降级到基础版本
      return callAgent(systemPrompt, messages, userMessage, agent);
    }
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
    console.log('[Orchestrator] Images:', context.images);

    // 如果用户上传了图片，先处理图片分析
    // 但如果用户在询问风格选择器，优先处理风格选择器的显示
    if (this.isAskingForStyleSelector(userMessage) && !context.selectedStyle) {
      console.log('[Orchestrator] 用户询问风格选择器，优先显示选择器');
      return {
        type: 'style-options',
        agent: context.currentAgent,
        content: '风格选择器在下方显示。请从下方选择一个你喜欢的风格，或者告诉我你想要的风格名称。',
        metadata: {
          showStyleSelector: true
        }
      };
    }

    if (context.images && context.images.length > 0) {
      return this.processImageMessage(userMessage, context);
    }

    // ===== 多步骤任务检测 =====
    const multiStepResult = detectMultiStepTask(userMessage);
    if (multiStepResult.isMultiStep) {
      console.log('[Orchestrator] 检测到多步骤任务:', multiStepResult);
      return this.executeMultiStepWorkflow(userMessage, context, multiStepResult);
    }

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
   * 执行多步骤工作流
   */
  private async executeMultiStepWorkflow(
    userMessage: string,
    context: ConversationContext,
    multiStepResult: MultiStepTaskResult
  ): Promise<OrchestratorResponse> {
    console.log('[Orchestrator] 执行多步骤工作流:', multiStepResult.workflowType);

    // 创建工作流实例
    const workflowEngine = getWorkflowEngine();
    const workflowInstance = workflowEngine.createWorkflow(multiStepResult.workflowType, {
      userMessage,
      steps: multiStepResult.steps
    });

    if (!workflowInstance) {
      console.warn('[Orchestrator] 工作流创建失败，降级到普通响应');
      return this.executeRespond(userMessage, context);
    }

    // 构建工作流介绍消息
    const stepsDescription = multiStepResult.steps.map((step, index) => 
      `${index + 1}. **${step.name}** - ${step.description}`
    ).join('\n');

    const content = `我理解您需要完成一个多步骤的设计项目。让我为您规划了以下执行计划：

**📋 项目执行计划**

${stepsDescription}

**⏱️ 预计总耗时**: ${multiStepResult.estimatedDuration}

这个项目需要分步骤完成，每个步骤完成后我会请您确认，满意后再继续下一步。

是否现在开始执行第一步：**${multiStepResult.steps[0].name}**？`;

    return {
      type: 'workflow',
      agent: 'director',
      content,
      workflow: {
        id: workflowInstance.id,
        name: multiStepResult.workflowType === 'brand-packaging-promotion' 
          ? '品牌设计+包装+宣传物料工作流'
          : multiStepResult.workflowType === 'brand-packaging'
          ? '品牌设计+包装工作流'
          : '多步骤设计工作流',
        steps: multiStepResult.steps,
        estimatedDuration: multiStepResult.estimatedDuration,
        currentStepIndex: 0
      },
      aiResponse: {
        content,
        type: 'workflow',
        metadata: {
          workflowType: multiStepResult.workflowType,
          steps: multiStepResult.steps,
          workflowInstanceId: workflowInstance.id
        }
      }
    };
  }

  /**
   * 处理包含图片的消息
   * 使用箭头函数确保 this 绑定正确
   */
  private processImageMessage = async (
    userMessage: string,
    context: ConversationContext
  ): Promise<OrchestratorResponse> => {
    const images = context.images!;
    const currentAgent = context.currentAgent;

    console.log('[Orchestrator] Processing image message:', images.length, 'images');

    // 构建图片分析提示词
    const imageDescriptions = images.map((img, idx) =>
      `[图片 ${idx + 1}]: ${img.name} (${(img.size / 1024).toFixed(1)}KB)`
    ).join('\n');

    // 根据当前 Agent 类型返回不同的响应
    switch (currentAgent) {
      case 'director':
        return {
          type: 'response',
          agent: 'director',
          content: `我收到了你上传的 ${images.length} 张图片：\n\n${imageDescriptions}\n\n请告诉我你想对这些图片做什么？例如：\n- 分析图片内容\n- 基于图片进行设计\n- 提取图片中的元素\n- 参考图片风格进行创作`
        };

      case 'illustrator':
        return {
          type: 'response',
          agent: 'illustrator',
          content: `我看到了你上传的参考图片。${userMessage ? '结合你的描述："' + userMessage + '"' : ''}\n\n${imageDescriptions}\n\n我会参考这些图片的风格和元素来进行插画设计。请告诉我更多关于你想要的设计细节。`
        };

      case 'designer':
        return {
          type: 'response',
          agent: 'designer',
          content: `收到图片参考！${userMessage ? '你的需求："' + userMessage + '"' : ''}\n\n${imageDescriptions}\n\n我会基于这些图片进行分析，并结合你的需求进行设计。有什么特别想要强调的元素吗？`
        };

      default:
        return {
          type: 'response',
          agent: currentAgent,
          content: `已收到 ${images.length} 张图片。\n\n${imageDescriptions}\n\n${userMessage ? '你的描述：' + userMessage : '请告诉我你想如何处理这些图片？'}`
        };
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

    // 检测用户是否询问历史记录
    if (this.isHistoryQuery(userMessage)) {
      console.log('[Orchestrator] 用户询问历史记录');
      return this.handleHistoryQuery(context);
    }

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
        // 初始阶段：检测用户输入是否已经包含设计类型
        const designTypeInfo = this.extractDesignTypeFromInput(userMessage);

        // 检测用户是否明确拒绝详细需求收集（快速开始模式）
        if (designTypeInfo.detected && this.isRejectingDetailCollection(userMessage)) {
          console.log('[Orchestrator] 用户拒绝详细收集，进入快速开始模式:', designTypeInfo.type);
          reqCollection.stage = 'completed';
          reqCollection.collectedInfo.projectType = designTypeInfo.type;
          reqCollection.collectedInfo.skipDetails = true;
          reqCollection.collectedInfo.note = '用户选择快速开始，使用默认配置';

          return {
            type: 'response',
            agent: 'director',
            content: `好的！我理解了你的需求。\n\n**项目类型**：${designTypeInfo.type}\n\n我将基于专业判断为你设计。如果你有任何具体的想法，随时可以告诉我。\n\n现在让我为你生成设计方案...`
          };
        }

        // 检测用户是否有明确的生成意图
        if (designTypeInfo.detected && this.hasGenerationIntent(userMessage)) {
          console.log('[Orchestrator] Director检测到生成意图，跳过需求收集直接生成:', designTypeInfo.type);
          // 设置基本任务信息
          reqCollection.stage = 'completed';
          reqCollection.collectedInfo.projectType = designTypeInfo.type;
          reqCollection.collectedInfo.skipDetails = true;
          reqCollection.collectedInfo.note = '用户明确请求生成，跳过详细需求收集';

          // 直接委派给设计师并执行生成
          return this.executeDirectGeneration(userMessage, context);
        }

        // 检测用户是否提供了足够详细的信息（快速开始模式）
        if (designTypeInfo.detected && this.shouldQuickStart(userMessage, reqCollection.collectedInfo)) {
          console.log('[Orchestrator] 用户提供了详细信息，进入快速开始模式:', designTypeInfo.type);
          reqCollection.stage = 'completed';
          reqCollection.collectedInfo.projectType = designTypeInfo.type;
          reqCollection.collectedInfo.skipDetails = true;
          reqCollection.collectedInfo.note = '用户提供了详细信息，快速开始';

          return {
            type: 'response',
            agent: 'director',
            content: `收到！你的需求很清晰。\n\n**项目类型**：${designTypeInfo.type}\n\n我会基于你提供的信息为你设计。如果需要调整，随时可以告诉我。\n\n现在让我为你生成设计方案...`
          };
        }

        if (designTypeInfo.detected) {
          // 用户已指定设计类型，但未提供详细信息，进入收集阶段
          console.log('[Orchestrator] 用户已指定设计类型:', designTypeInfo.type);
          reqCollection.stage = 'collecting';
          reqCollection.collectedInfo.projectType = designTypeInfo.type;

          // 直接响应，确认理解，不询问设计类型
          return {
            type: 'response',
            agent: 'director',
            content: `收到！你想做${designTypeInfo.type}。\n\n为了确保设计效果，我需要了解一个关键信息：\n\n**目标受众是谁？**\n比如：年轻人、儿童、商务人士、家庭用户等\n\n（如果你希望直接开始，可以说"直接开始"或"你决定"）`
          };
        }

        // 未检测到设计类型，正常进入初始询问
        return this.executeRequirementInitial(userMessage, context);

      case 'collecting':
        // 收集阶段：检测用户是否想要跳过并直接生成
        if (this.isSkipToGeneration(userMessage) || this.isRejectingDetailCollection(userMessage)) {
          console.log('[Orchestrator] User wants to skip and generate directly');
          reqCollection.stage = 'completed';
          reqCollection.collectedInfo.skipDetails = true;
          reqCollection.collectedInfo.note = '用户在收集阶段选择快速开始';

          return {
            type: 'response',
            agent: 'director',
            content: `好的！我将基于已收集的信息为你设计。\n\n**已了解的信息**：\n${this.formatCollectedInfo(reqCollection.collectedInfo)}\n\n现在让我为你生成设计方案...`
          };
        }

        // 检测用户是否提供了足够信息可以进入确认阶段
        if (this.shouldQuickStart(userMessage, reqCollection.collectedInfo)) {
          console.log('[Orchestrator] 收集阶段检测到足够信息，进入确认阶段');
          reqCollection.stage = 'confirming';
          return this.executeRequirementConfirmation(context);
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
      const priorityResponse = await callModelAPI(
        [{ role: 'user', content: priorityPrompt }],
        { temperature: 0.3, max_tokens: 1000 }
      );

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
   * 执行需求确认阶段
   * 展示已收集的信息并等待用户确认
   */
  private async executeRequirementConfirmation(
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    const reqCollection = context.requirementCollection!;

    // 格式化已收集的信息
    const infoLines = this.formatCollectedInfo(reqCollection.collectedInfo);

    const content = `很好！我已经收集了足够的信息。让我为你总结一下：

**已确认的需求：**
${infoLines}

**接下来我将：**
- 基于这些信息为你设计
- 如果需要调整，随时可以告诉我
- 准备好后就可以开始生成

确认无误的话，我将立即开始为你创作！`;

    return {
      type: 'response',
      agent: 'director',
      content: content
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
    const response = await callModelAPI(
      [{ role: 'user', content: prompt }],
      { temperature: 0.3, max_tokens: 1000 }
    );

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
    const currentAgent = context?.currentAgent || 'director'; // 使用当前Agent，默认为总监

    if (!context?.requirementCollection) {
      return {
        action: 'respond', // 改为respond，不切换Agent
        targetAgent: currentAgent,
        reasoning: '保持当前Agent继续服务'
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

    // 默认保持当前Agent，不自动切换
    return {
      action: 'respond',
      targetAgent: currentAgent,
      reasoning: '保持当前Agent继续服务'
    };
  }

  /**
   * 检查用户是否确认需求
   */
  private isConfirmation(message: string): boolean {
    const confirmKeywords = [
      '确认', '没问题', '对的', '是的', '可以', '好', 'ok', '没问题',
      '不错', '很好', '太棒了', '满意', '喜欢', '完美', '赞', '棒', '优秀'
    ];
    const lowerMsg = message.toLowerCase();
    return confirmKeywords.some(keyword => lowerMsg.includes(keyword));
  }

  /**
   * 格式化已收集的需求信息
   */
  private formatCollectedInfo(collectedInfo: any): string {
    const infoLines: string[] = [];

    if (collectedInfo.projectType) {
      infoLines.push(`- 项目类型：${collectedInfo.projectType}`);
    }
    if (collectedInfo.targetAudience) {
      infoLines.push(`- 目标受众：${collectedInfo.targetAudience}`);
    }
    if (collectedInfo.stylePreference) {
      infoLines.push(`- 风格偏好：${collectedInfo.stylePreference}`);
    }
    if (collectedInfo.usageScenario) {
      infoLines.push(`- 使用场景：${collectedInfo.usageScenario}`);
    }
    if (collectedInfo.brandTone) {
      infoLines.push(`- 品牌调性：${collectedInfo.brandTone}`);
    }
    if (collectedInfo.timeline) {
      infoLines.push(`- 时间要求：${collectedInfo.timeline}`);
    }

    return infoLines.length > 0 ? infoLines.join('\n') : '- 项目类型：已确认\n- 其他信息：使用默认配置';
  }

  /**
   * 检测用户是否有明确的生成意图
   * 严格匹配：必须包含明确的生成指令，而不是仅仅提到设计类型
   */
  private hasGenerationIntent(userMessage: string): boolean {
    const lowerMsg = userMessage.toLowerCase();

    // 严格的生成指令关键词（必须包含这些词才算有生成意图）
    const generationKeywords = [
      '生成', '画', '绘制', '创作', '画一个', '画一下', '画个', '画幅',
      '帮我生成', '帮我画', '直接生成', '直接画',
      '给我画', '给我生成', '做一个', '做个', '来一张', '来张'
    ];

    // 排除词：这些词表示用户只是咨询/寻求建议，不是要生成设计
    const exclusionKeywords = [
      '需求描述', '需求文档', '怎么写', '如何写', '模板', '框架',
      '灵感', '建议', '推荐', '参考', '例子', '案例', '名称', '名字',
      '叫什么', '怎么起', '如何起', '起名', '命名'
    ];

    // 如果包含排除词，不认为是生成意图
    if (exclusionKeywords.some(keyword => lowerMsg.includes(keyword))) {
      return false;
    }

    // 必须包含明确的生成指令
    return generationKeywords.some(keyword => lowerMsg.includes(keyword));
  }

  /**
   * 执行直接生成（跳过需求收集）
   */
  private async executeDirectGeneration(
    userMessage: string,
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    console.log('[Orchestrator] 执行直接生成流程');

    // 使用当前Agent，不强制切换
    const currentAgent = context.currentAgent;

    // 直接执行图像生成，保持当前Agent
    return this.executeImageGeneration(userMessage, {
      ...context,
      currentAgent
    });
  }

  /**
   * 检测用户是否想要跳过需求收集直接生成
   */
  private isSkipToGeneration(message: string): boolean {
    const lowerMsg = message.toLowerCase().trim();

    // 精确匹配：用户明确表达跳过/直接开始的意图
    const exactMatchKeywords = [
      '直接生成', '直接开始', '开始生成', '生成吧', '开始吧',
      '就这样', '直接开始设计', '直接设计', '开始设计',
      '不用调整', '不用修改', '直接出图', '出图吧',
      '直接做', '开始制作'
    ];

    // 否定词：用户明确拒绝详细收集
    const rejectionKeywords = [
      '不想', '不用了', '不需要', '不需要了', '跳过'
    ];

    // 检查精确匹配
    if (exactMatchKeywords.some(keyword => lowerMsg.includes(keyword))) {
      return true;
    }

    // 检查否定词（但排除"可以"等确认词）
    if (rejectionKeywords.some(keyword => lowerMsg.includes(keyword))) {
      return true;
    }

    // 单独检查"生成"和"开始"，但要求消息较短（避免误匹配）
    if ((lowerMsg === '生成' || lowerMsg === '开始') && lowerMsg.length <= 4) {
      return true;
    }

    return false;
  }

  /**
   * 检测用户是否在询问历史记录
   */
  private isHistoryQuery(message: string): boolean {
    const historyKeywords = [
      '前面', '之前', '刚才', '历史', '记录',
      '刚才的', '之前的', '刚才不是', '我前面',
      '刚才设计', '刚才做的', '刚才生成'
    ];
    const lowerMsg = message.toLowerCase();
    return historyKeywords.some(keyword => lowerMsg.includes(keyword));
  }

  /**
   * 处理历史记录查询
   */
  private async handleHistoryQuery(
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    // 获取之前的消息历史
    const messages = context.messages || [];
    
    // 查找之前的设计请求（用户消息通常是 'user' 角色，但这里使用类型断言）
    const lastDesignRequest = messages.slice().reverse().find(m => {
      const content = m.content?.toLowerCase() || '';
      // 检查是否是用户消息（role 为 'user' 或 content 不为空）
      const isUserMessage = m.role === ('user' as any) || 
                           (!m.metadata?.toolCalls && !m.metadata?.delegationInfo);
      return isUserMessage && (
        content.includes('设计') || content.includes('生成') ||
        content.includes('画') || content.includes('做')
      );
    });

    if (lastDesignRequest) {
      return {
        type: 'response',
        agent: 'director',
        content: `是的，我们刚才确实在进行设计。\n\n**你刚才说**：\n"${lastDesignRequest.content}"\n\n我们已经完成了这个设计，你可以在右侧画布中查看结果。\n\n如果需要调整或有新的想法，随时告诉我！`
      };
    }

    // 如果没有找到历史记录
    return {
      type: 'response',
      agent: 'director',
      content: `抱歉，我没有找到之前的设计记录。\n\n这是当前对话的开始，我们可以从头开始设计。\n\n请告诉我你想要设计什么？`
    };
  }

  /**
   * 从用户输入中识别设计类型
   */
  private extractDesignTypeFromInput(message: string): { type: string; detected: boolean } {
    const lowerMsg = message.toLowerCase();

    // 先提取品牌名，避免品牌名中的关键词被误识别
    const brandName = this.extractBrandFromMessage(message);
    let messageWithoutBrand = lowerMsg;
    if (brandName) {
      messageWithoutBrand = lowerMsg.replace(brandName.toLowerCase(), '');
    }

    // 设计类型关键词映射
    const designTypeMap = [
      { keywords: ['海报', 'poster', '宣传'], type: '海报设计' },
      { keywords: ['ip', '形象', '角色', 'character', 'mascot'], type: 'IP形象' },
      { keywords: ['品牌', 'brand', 'logo', 'vi'], type: '品牌设计' },
      { keywords: ['包装', 'package', '礼盒'], type: '包装设计' },
      { keywords: ['动画', '视频', 'video', 'animation'], type: '动画视频' },
      { keywords: ['插画', 'illustration', '手绘'], type: '插画设计' }
    ];

    for (const item of designTypeMap) {
      if (item.keywords.some(kw => messageWithoutBrand.includes(kw))) {
        return { type: item.type, detected: true };
      }
    }

    return { type: '', detected: false };
  }

  /**
   * 检测用户是否想要快速开始（提供了足够详细的需求）
   * 如果用户提供了设计类型 + 至少一个详细信息（风格/受众/场景），则允许快速开始
   */
  private shouldQuickStart(message: string, collectedInfo: any): boolean {
    const lowerMsg = message.toLowerCase();

    // 检查是否包含设计类型
    const designTypeInfo = this.extractDesignTypeFromInput(message);
    if (!designTypeInfo.detected) return false;

    // 检查是否包含详细信息（风格、受众、场景、颜色等）
    const detailKeywords = [
      // 风格相关
      '风格', 'style', '简约', '复古', '可爱', '酷炫', '温馨', '科技',
      '现代', '传统', '时尚', '古典', '清新', '华丽', '极简',
      // 受众相关
      '受众', 'audience', '年轻人', '儿童', '老人', '商务', '学生',
      '家庭', '女性', '男性', '职场', '宝宝', '亲子',
      // 场景相关
      '场景', 'scenario', '线上', '线下', '印刷', '社交媒体',
      '朋友圈', '宣传', '推广', '展示', '包装', '海报',
      // 颜色相关
      '颜色', 'color', '红色', '蓝色', '绿色', '黄色', '黑白',
      '暖色', '冷色', '鲜艳', '柔和', '深色', '浅色',
      // 元素相关
      '元素', 'element', '包含', '需要', '要有', '加上'
    ];

    const hasDetailInfo = detailKeywords.some(kw => lowerMsg.includes(kw));

    // 如果已有收集的信息，也算作有详细信息
    const hasCollectedInfo = collectedInfo && (
      collectedInfo.targetAudience ||
      collectedInfo.stylePreference ||
      collectedInfo.usageScenario ||
      collectedInfo.brandTone
    );

    return hasDetailInfo || hasCollectedInfo;
  }

  /**
   * 检测用户是否明确拒绝详细需求收集
   */
  private isRejectingDetailCollection(message: string): boolean {
    const rejectPatterns = [
      '不用问', '别问', '不需要问', '不用收集', '直接',
      '先做出来', '先做', '先看看', '先给我',
      '边做边', '一边做', '做着看', '试试',
      '简单点', '简单做', '随便', '随意',
      '你决定', '你来定', '你看着办', '专业判断'
    ];

    const lowerMsg = message.toLowerCase();
    return rejectPatterns.some(pattern => lowerMsg.includes(pattern));
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

      const response = await callModelAPI(
        [{ role: 'user', content: prompt }],
        { temperature: 0.3, max_tokens: 1000 } // 低温度以获得更确定的决策
      );

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
    const confirmKeywords = ['好的', '可以', '行', '都行', '没问题', '继续', '开始', '好', '嗯', '是的', '对', '好嘞', '收到', 'OK', 'ok'];
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

    // 设计类型关键词映射 - 用于更精准的Agent委派
    const designTypeKeywords = [
      // IP/插画类 -> illustrator
      { keywords: ['ip', '形象', '角色', '吉祥物', ' mascot', 'character', '插画', '手绘', '绘本', '漫画'], agent: 'illustrator' as AgentType, reason: '用户需要IP形象/插画创作服务' },
      // Logo/品牌类 -> designer
      { keywords: ['logo', '标志', '商标', '品牌', 'vi', '视觉', '品牌设计', '企业形象'], agent: 'designer' as AgentType, reason: '用户需要品牌视觉设计服务' },
      // 包装类 -> designer
      { keywords: ['包装', '礼盒', '盒子', '产品包装', 'package'], agent: 'designer' as AgentType, reason: '用户需要包装设计服务' },
      // 海报类 -> designer
      { keywords: ['海报', 'poster', '宣传', '广告', 'banner', '宣传物料'], agent: 'designer' as AgentType, reason: '用户需要海报设计服务' },
      // 文案类 -> copywriter
      { keywords: ['文案', '标语', '口号', 'slogan', '故事', '脚本', '台词', '内容', '编辑'], agent: 'copywriter' as AgentType, reason: '用户需要文案创作服务' },
      // 视频/动画类 -> animator
      { keywords: ['动画', '视频', '短片', '动效', 'gif', '表情包', 'video', 'animation', 'motion', '短视频', '宣传片', '片头', '片尾', '特效', 'mg动画'], agent: 'animator' as AgentType, reason: '用户需要动画视频制作服务' },
      // 调研类 -> researcher
      { keywords: ['调研', '市场', '分析', '竞品', '研究', '调查', '数据', '报告'], agent: 'researcher' as AgentType, reason: '用户需要市场调研服务' },
    ];

    // 遍历设计类型关键词，匹配则委派
    for (const item of designTypeKeywords) {
      if (item.keywords.some(keyword => lowerMsg.includes(keyword))) {
        return {
          action: 'delegate',
          targetAgent: item.agent,
          reasoning: item.reason
        };
      }
    }

    // 默认保持当前 Agent
    return {
      action: 'respond',
      reasoning: '继续当前对话'
    };
  }

  /**
   * 从用户消息中提取品牌名（@品牌名）
   */
  private extractBrandFromMessage(message: string): string | undefined {
    const brandRegex = /@([^\s,，.。!！?？]+)/g;
    const matches = message.match(brandRegex);
    if (matches && matches.length > 0) {
      // 返回第一个匹配的品牌名（去掉@符号）
      return matches[0].substring(1);
    }
    return undefined;
  }

  /**
   * 从用户消息中提取排除的元素（如"不是狗形象"中的"狗形象"）
   */
  private extractExcludedElements(message: string): string[] {
    const excludedElements: string[] = [];
    const lowerMsg = message.toLowerCase();

    // 匹配"不是..."、"不要..."、"排除..."等否定表达
    const exclusionPatterns = [
      /不是([\u4e00-\u9fa5]+)/g,
      /不要([\u4e00-\u9fa5]+)/g,
      /排除([\u4e00-\u9fa5]+)/g,
      /避免([\u4e00-\u9fa5]+)/g,
      /不要包含([\u4e00-\u9fa5]+)/g
    ];

    for (const pattern of exclusionPatterns) {
      let match;
      while ((match = pattern.exec(lowerMsg)) !== null) {
        if (match[1] && match[1].length >= 2) {
          excludedElements.push(match[1]);
        }
      }
    }

    return excludedElements;
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

    // 检测生成图像的关键词（更严格）
    const generationKeywords = [
      '生成', '画', '画一个', '画一下', '绘制', '创作',
      '生成图像', '生成图片', '画出来', '画个', '画幅',
      '开始画', '开始生成', '帮我画', '帮我生成',
      '你能画', '你能生成', '可以画', '可以生成'
    ];

    const hasGenerationIntent = generationKeywords.some(keyword =>
      lowerMsg.includes(keyword)
    );

    // 检测确认/同意类关键词（更严格：必须明确表达生成意图）
    // 收紧关键词列表，避免误触发
    const confirmationKeywords = ['确认生成', '确认设计', '就这样生成', '开始生成吧', '直接生成', '立即生成', '好了吗', '好了么', '可以了吗', '完成了吗', '生成了吗', '画好了吗', '做好了吗'];
    const hasConfirmation = confirmationKeywords.some(keyword =>
      lowerMsg.includes(keyword)
    );

    // 如果有任务描述且用户确认，也触发生成
    const hasTaskDescription = !!context.currentTask?.requirements?.description;

    // 检测修改/优化类关键词（当用户引用了作品时）
    const modificationKeywords = [
      '修改', '调整', '优化', '润色', '改一下', '调一下',
      '提升', '增强', '改变', '变换', '换个', '改成',
      '颜色', '色彩', '色调', '亮度', '对比度', '饱和度',
      '风格', '样式', '效果', '暖色', '冷色', '鲜艳', '柔和'
    ];
    const hasMentionedWorks = context.mentionedWorks && context.mentionedWorks.length > 0;
    const hasModificationIntent = modificationKeywords.some(keyword =>
      lowerMsg.includes(keyword)
    );
    const isModificationRequest = hasMentionedWorks && hasModificationIntent;

    // 新增：检查是否已选择风格
    const hasExplicitStyle = !!context.selectedStyle;

    // 修改触发条件：
    // 1. 有明确的生成意图关键词 + 已选择风格，或者
    // 2. 有明确的确认生成关键词 + 有任务描述 + 已选择风格，或者
    // 3. 是修改请求（引用作品 + 修改意图）
    const shouldGenerate = (hasGenerationIntent && hasExplicitStyle) ||
                           (hasConfirmation && hasTaskDescription && hasExplicitStyle) ||
                           isModificationRequest;

    console.log('[Orchestrator] 检测图像生成意图:', {
      userMessage,
      currentAgent: context.currentAgent,
      hasGenerationIntent,
      hasConfirmation,
      hasTaskDescription,
      hasExplicitStyle,
      hasMentionedWorks,
      hasModificationIntent,
      isModificationRequest,
      shouldGenerate
    });

    return shouldGenerate;
  }

  /**
   * 执行图像生成
   * 直接使用 llmService 生成图像
   */
  private async executeImageGeneration(
    userMessage: string,
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    console.log('[Orchestrator] 开始执行图像生成');

    // 检查是否已选择风格
    if (!context.selectedStyle) {
      return {
        type: 'style-options',
        agent: context.currentAgent,
        content: '在开始生成之前，请先选择一个你喜欢的风格。你可以从下方选择，或者告诉我你想要的风格。',
        metadata: { showStyleSelector: true }
      };
    }

    const taskDescription = context.currentTask?.requirements?.description || userMessage;
    const taskType = context.currentTask?.type || '设计';

    try {
      // 构建提示词
      const brandName = context.selectedBrand || this.extractBrandFromMessage(userMessage);
      let prompt = taskDescription;
      if (brandName) prompt = `为品牌"${brandName}"设计。${prompt}`;
      prompt += `\n风格要求：${context.selectedStyle}，高质量，精美细节，专业设计作品`;

      // 直接调用 llmService 生成图像
      const result = await llmService.generateImage({
        model: 'qwen-image-2.0-pro',
        prompt,
        size: '1024x1024',
        n: 1
      });

      if (!result.ok) throw new Error(result.error || '图像生成失败');

      const imageUrl = result.data?.data?.[0]?.url || result.data?.[0]?.url;
      if (!imageUrl) throw new Error('无法获取生成的图像URL');

      return this.wrapImageResponse(
        { data: { url: imageUrl, prompt }, content: '图片已生成' },
        context.currentAgent,
        taskType,
        context.selectedStyle
      );
    } catch (error: any) {
      return {
        type: 'response',
        agent: context.currentAgent,
        content: `❌ **生成失败**\n\n抱歉，图像生成遇到了问题：${error.message}\n\n请稍后重试，或者换一种描述方式告诉我你的需求～`,
        aiResponse: { content: `生成失败：${error.message}`, type: 'error' }
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
   * 检测用户是否在询问风格选择器
   */
  private isAskingForStyleSelector(userMessage: string): boolean {
    const lowerMsg = userMessage.toLowerCase();
    const styleSelectorKeywords = [
      '点击哪里', '点哪里', '选择器', '风格选择', '风格在哪', '选择风格',
      '怎么选择', '怎么选', '在哪里选', '没有按钮', '没有选项', '界面在哪',
      '怎么点击', '点什么', '怎么选风格', '风格怎么选'
    ];
    return styleSelectorKeywords.some(keyword => lowerMsg.includes(keyword));
  }

  /**
   * 执行直接响应
   */
  private async executeRespond(
    userMessage: string,
    context: ConversationContext
  ): Promise<OrchestratorResponse> {
    // 首先检测用户是否在询问风格选择器（且当前没有选风格）
    // 这个检测要放在 shouldGenerateImage 之前，避免关键词误触发
    if (this.isAskingForStyleSelector(userMessage) && !context.selectedStyle) {
      console.log('[Orchestrator] 用户询问风格选择器，重新显示选择器');
      return {
        type: 'style-options',
        agent: context.currentAgent,
        content: '风格选择器在下方显示。请从下方选择一个你喜欢的风格，或者告诉我你想要的风格名称。',
        metadata: {
          showStyleSelector: true
        }
      };
    }

    // 检测是否应该生成图像
    if (this.shouldGenerateImage(userMessage, context)) {
      console.log('[Orchestrator] 检测到图像生成意图，执行图像生成');
      return this.executeImageGeneration(userMessage, context);
    }

    // 检测是否是角色设计需求，使用向导式工作流
    if (this.isCharacterDesignRequest(userMessage)) {
      console.log('[Orchestrator] 检测到角色设计需求，启动向导式工作流');
      return {
        type: 'response',
        agent: context.currentAgent, // 使用当前Agent，避免硬编码切换
        content: '我来帮你设计一个独特的角色形象！请按照下方的向导逐步完成角色设定。',
        aiResponse: {
          content: '我来帮你设计一个独特的角色形象！请按照下方的向导逐步完成角色设定。',
          type: 'character-workflow'
        }
      };
    }

    try {
      // 从用户消息中提取品牌名（如果context中没有）
      const brandFromMessage = !context.selectedBrand ? this.extractBrandFromMessage(userMessage) : undefined;
      const effectiveBrand = context.selectedBrand || brandFromMessage;

      // 从用户消息中提取排除的元素
      const excludedElements = this.extractExcludedElements(userMessage);

      // 获取当前设计类型
      const projectType = context.currentTask?.type || context.requirementCollection?.collectedInfo?.projectType;

      const systemPrompt = getAgentSystemPrompt(context.currentAgent, effectiveBrand, context.selectedStyle, excludedElements, projectType);
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
    const projectType = context.currentTask?.type || context.requirementCollection?.collectedInfo?.projectType;
    const systemPrompt = getAgentSystemPrompt(targetAgent, context.selectedBrand, context.selectedStyle, undefined, projectType);

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
      const systemPrompt = getAgentSystemPrompt(agent, context.selectedBrand, context.selectedStyle);
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

    const systemPrompt = getAgentSystemPrompt(targetAgent, context.selectedBrand, context.selectedStyle);
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
    const systemPrompt = getAgentSystemPrompt(firstAgent, context.selectedBrand, context.selectedStyle);

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
    const systemPrompt = getAgentSystemPrompt(nextAgent, undefined, undefined); // chain 场景没有 selectedBrand 和 selectedStyle

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
      const systemPrompt = getAgentSystemPrompt(agent, context.selectedBrand, context.selectedStyle);
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
  // 先尝试 Skill 快速模式
  const { smartProcessMessage } = await import('./skillAgentAdapter');
  const skillResult = await smartProcessMessage(userMessage, context);
  
  if (skillResult) {
    console.log('[Orchestrator] 使用 Skill 快速模式');
    return skillResult;
  }
  
  // 使用普通流程
  return agentOrchestrator.processUserInput(userMessage, context);
}
