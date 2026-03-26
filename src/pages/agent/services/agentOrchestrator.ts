/**
 * Agent 编排器 V2 - 增强版
 * 集成 ThinkingRecorder、RequirementAnalysisService 和 DecisionEngine
 * 提供可视化的思考过程和智能决策能力
 */

import {
  AgentType,
  AgentMessage,
  DelegationTask,
  RequirementCollection,
  PRESET_STYLES
} from '../types/agent';
import { AIResponse } from './agentService';
import { llmService } from '@/services/llmService';
import { detectMultiStepTask, MultiStepTaskResult } from './intentRecognition';
import { getWorkflowEngine } from './workflowEngine';
import { 
  RequirementAnalysisService, 
  RequirementAnalysis,
  analyzeRequirements 
} from './requirementAnalysisService';
import { 
  DecisionEngine, 
  DecisionContext, 
  DecisionResult,
  makeDecision 
} from './decisionEngine';
import { DirectorAgent, directorAgent } from '../agents/DirectorAgent';
import { thinkingRecorder } from './ThinkingRecorder';
import { ThinkingStep, StepType } from '../types/thinking';

// 对话上下文
export interface ConversationContextV2 {
  currentAgent: AgentType;
  messages: AgentMessage[];
  taskDescription?: string;
  delegationHistory: DelegationTask[];
  requirementCollection?: RequirementCollection;
  selectedStyle?: string;
  selectedBrand?: string;
  excludedElements?: string[];
  sessionId?: string;
  userId?: string;
  mentionedWorks?: { id: string; name: string; title?: string; imageUrl?: string; description?: string; prompt?: string; style?: string; type?: 'image' | 'video' | 'text' }[];
  images?: { url: string; thumbnail?: string; name: string; size: number }[];
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
  // 新增：系统状态
  systemStatus?: {
    isGenerating: boolean;
    isThinking: boolean;
    currentOperation?: string;
  };
}

// 编排器响应
export interface OrchestratorResponseV2 {
  type: 'response' | 'delegation' | 'collaboration' | 'chain' | 'handoff' | 'image_generation' | 'generating' | 'workflow' | 'style-options' | 'image' | 'error' | 'character-workflow' | 'thinking';
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
  generatingPrompt?: string;
  workflow?: {
    id: string;
    name: string;
    steps: any[];
    estimatedDuration: string;
    currentStepIndex: number;
  };
  // 新增：思考过程
  thinkingSteps?: ThinkingStep[];
  // 新增：决策信息
  decisionInfo?: {
    action: string;
    reasoning: string;
    confidence: number;
    targetAgent?: AgentType;
    targetAgents?: AgentType[];
  };
  metadata?: {
    showStyleSelector?: boolean;
    requirementAnalysis?: RequirementAnalysis;
    [key: string]: any;
  };
}

/**
 * Agent 编排器类
 * 集成可视化思考过程和智能决策
 */
export class AgentOrchestrator {
  private currentContext: ConversationContextV2 | null = null;
  private requirementAnalysisService: RequirementAnalysisService;
  private decisionEngine: DecisionEngine;
  private directorAgent: DirectorAgent;

  constructor() {
    this.requirementAnalysisService = new RequirementAnalysisService();
    this.decisionEngine = new DecisionEngine();
    this.directorAgent = directorAgent;
  }

  /**
   * 设置当前上下文
   */
  setContext(context: ConversationContextV2) {
    this.currentContext = context;
  }

  /**
   * 处理用户输入 - 主入口
   * 集成 ThinkingRecorder 记录整个思考过程
   */
  async processUserInput(
    userMessage: string,
    context: ConversationContextV2
  ): Promise<OrchestratorResponseV2> {
    this.setContext(context);

    console.log('[OrchestratorV2] 开始处理用户输入:', userMessage);
    console.log('[OrchestratorV2] 当前Agent:', context.currentAgent);

    // 开始新的思考会话
    const sessionId = thinkingRecorder.startSession();
    console.log('[OrchestratorV2] 思考会话开始:', sessionId);

    try {
      // ===== 步骤1：意图识别 =====
      const intentStep = thinkingRecorder.startStep('intent', '意图识别');
      const intent = await this.recognizeIntent(userMessage, context);
      thinkingRecorder.endStep({
        summary: `识别到用户意图: ${intent.type}`,
        details: { intent, confidence: intent.confidence }
      });

      // ===== 步骤2：需求分析 =====
      const analysisStep = thinkingRecorder.startStep('analysis', '需求分析');
      const analysis = await this.analyzeRequirements(userMessage, context);
      thinkingRecorder.endStep({
        summary: `项目类型: ${analysis.projectType}, 完整度: ${this.requirementAnalysisService.evaluateCompleteness(analysis).toFixed(0)}%`,
        details: { 
          analysis,
          completeness: this.requirementAnalysisService.evaluateCompleteness(analysis)
        }
      });

      // ===== 步骤3：决策制定 =====
      const decisionStep = thinkingRecorder.startStep('decision', '调度决策');
      const decision = await this.makeSmartDecision(analysis, context);
      thinkingRecorder.endStep({
        summary: `决策: ${decision.action}, 目标Agent: ${decision.targetAgent || decision.targetAgents?.join(',') || 'N/A'}`,
        details: { decision }
      });

      // ===== 步骤4：执行决策 =====
      const executionStep = thinkingRecorder.startStep('execution', '执行决策');
      const result = await this.executeDecision(decision, userMessage, context, analysis);
      thinkingRecorder.endStep({
        summary: `执行完成: ${result.type}`,
        details: { resultType: result.type, agent: result.agent }
      });

      // 完成思考会话
      thinkingRecorder.completeSession();

      // 将思考过程添加到结果中
      result.thinkingSteps = thinkingRecorder.getSessionSteps();
      result.decisionInfo = {
        action: decision.action,
        reasoning: decision.reasoning,
        confidence: decision.confidence,
        targetAgent: decision.targetAgent,
        targetAgents: decision.targetAgents
      };
      result.metadata = {
        ...result.metadata,
        requirementAnalysis: analysis
      };

      console.log('[OrchestratorV2] 处理完成:', {
        type: result.type,
        agent: result.agent,
        decision: decision.action
      });

      return result;

    } catch (error) {
      console.error('[OrchestratorV2] 处理失败:', error);
      thinkingRecorder.markStepError(error instanceof Error ? error.message : '未知错误');
      thinkingRecorder.completeSession();

      // 返回错误响应
      return {
        type: 'error',
        agent: context.currentAgent,
        content: '抱歉，处理您的请求时遇到了问题。让我重新尝试...',
        thinkingSteps: thinkingRecorder.getSessionSteps()
      };
    }
  }

  /**
   * 意图识别
   */
  private async recognizeIntent(
    message: string,
    context: ConversationContextV2
  ): Promise<{ type: string; confidence: number }> {
    const lowerMsg = message.toLowerCase();

    // 简单意图识别
    if (/^(你好|您好|hello|hi|在吗)/.test(lowerMsg)) {
      return { type: 'greeting', confidence: 0.95 };
    }

    if (/(生成|创建|设计|制作|画).{0,5}(图|图片|海报|logo|ip|形象)/.test(lowerMsg)) {
      return { type: 'generation', confidence: 0.9 };
    }

    if (/(跳过|直接开始|你决定|随便)/.test(lowerMsg)) {
      return { type: 'quick_start', confidence: 0.85 };
    }

    if (/(修改|调整|改一下|不对)/.test(lowerMsg)) {
      return { type: 'modification', confidence: 0.8 };
    }

    if (/(多少钱|价格|费用|收费)/.test(lowerMsg)) {
      return { type: 'pricing', confidence: 0.85 };
    }

    return { type: 'general', confidence: 0.6 };
  }

  /**
   * 需求分析
   */
  private async analyzeRequirements(
    message: string,
    context: ConversationContextV2
  ): Promise<RequirementAnalysis> {
    // 使用需求分析服务
    return this.requirementAnalysisService.analyze(
      message,
      context.messages,
      { deepAnalysis: true, useHistory: true }
    );
  }

  /**
   * 智能决策
   */
  private async makeSmartDecision(
    analysis: RequirementAnalysis,
    context: ConversationContextV2
  ): Promise<DecisionResult> {
    // 构建决策上下文
    const decisionContext: DecisionContext = {
      userMessage: context.messages[context.messages.length - 1]?.content || '',
      requirementAnalysis: analysis,
      currentAgent: context.currentAgent,
      conversationHistory: context.messages,
      availableAgents: ['director', 'designer', 'illustrator', 'copywriter', 'animator', 'researcher'],
      systemStatus: {
        isGenerating: context.systemStatus?.isGenerating || false,
        currentTask: null,
        pendingDelegations: context.delegationHistory || [],
        isThinking: true
      }
    };

    // 使用决策引擎
    return this.decisionEngine.makeDecision(decisionContext);
  }

  /**
   * 执行决策
   */
  private async executeDecision(
    decision: DecisionResult,
    userMessage: string,
    context: ConversationContextV2,
    analysis: RequirementAnalysis
  ): Promise<OrchestratorResponseV2> {
    switch (decision.action) {
      case 'collect':
        return this.executeCollect(userMessage, context, analysis);

      case 'delegate':
        return this.executeDelegate(decision, userMessage, context, analysis);

      case 'collaborate':
        return this.executeCollaborate(decision, userMessage, context, analysis);

      case 'respond':
      default:
        return this.executeRespond(userMessage, context, analysis);
    }
  }

  /**
   * 执行信息收集
   */
  private async executeCollect(
    message: string,
    context: ConversationContextV2,
    analysis: RequirementAnalysis
  ): Promise<OrchestratorResponseV2> {
    // 使用 DirectorAgent 生成收集消息
    const response = await this.directorAgent.handleMessage(message, {
      userId: context.userId || 'anonymous',
      sessionId: context.sessionId || 'temp',
      message,
      history: context.messages
    });

    return {
      type: 'response',
      agent: 'director',
      content: response.content,
      aiResponse: response,
      metadata: {
        requirementAnalysis: analysis,
        showStyleSelector: !context.selectedStyle && this.shouldShowStyleSelector(analysis)
      }
    };
  }

  /**
   * 执行委派
   */
  private async executeDelegate(
    decision: DecisionResult,
    message: string,
    context: ConversationContextV2,
    analysis: RequirementAnalysis
  ): Promise<OrchestratorResponseV2> {
    const targetAgent = decision.targetAgent!;

    // 生成委派消息
    const delegationContent = this.generateDelegationContent(decision, analysis);

    // 创建委派任务
    const delegationTask: DelegationTask = {
      id: `task-${Date.now()}`,
      fromAgent: context.currentAgent,
      toAgent: targetAgent,
      task: analysis.requirements.description || message,
      status: 'pending',
      timestamp: Date.now()
    };

    return {
      type: 'delegation',
      agent: 'director',
      content: delegationContent,
      delegationTask,
      aiResponse: {
        content: delegationContent,
        type: 'delegation',
        metadata: {
          targetAgent,
          taskPlan: decision.plan
        }
      },
      metadata: {
        requirementAnalysis: analysis
      }
    };
  }

  /**
   * 执行协作
   */
  private async executeCollaborate(
    decision: DecisionResult,
    message: string,
    context: ConversationContextV2,
    analysis: RequirementAnalysis
  ): Promise<OrchestratorResponseV2> {
    const targetAgents = decision.targetAgents!;

    // 生成协作消息
    const collaborationContent = this.generateCollaborationContent(decision, analysis);

    return {
      type: 'collaboration',
      agent: 'director',
      content: collaborationContent,
      collaborationAgents: targetAgents,
      aiResponse: {
        content: collaborationContent,
        type: 'collaboration',
        metadata: {
          targetAgents,
          taskPlan: decision.plan
        }
      },
      metadata: {
        requirementAnalysis: analysis
      }
    };
  }

  /**
   * 执行响应
   */
  private async executeRespond(
    message: string,
    context: ConversationContextV2,
    analysis?: RequirementAnalysis
  ): Promise<OrchestratorResponseV2> {
    // 使用 DirectorAgent 生成响应
    const response = await this.directorAgent.handleMessage(message, {
      userId: context.userId || 'anonymous',
      sessionId: context.sessionId || 'temp',
      message,
      history: context.messages
    });

    return {
      type: 'response',
      agent: context.currentAgent,
      content: response.content,
      aiResponse: response,
      metadata: analysis ? { requirementAnalysis: analysis } : undefined
    };
  }

  /**
   * 生成委派内容
   */
  private generateDelegationContent(decision: DecisionResult, analysis: RequirementAnalysis): string {
    const { targetAgent, plan } = decision;
    const agentNames: Record<AgentType, string> = {
      'director': '津脉设计总监',
      'designer': '津脉品牌设计师',
      'illustrator': '津脉插画师',
      'copywriter': '津脉文案策划',
      'animator': '津脉动画师',
      'researcher': '津脉研究员',
      'system': '系统',
      'user': '用户'
    };

    let content = `**📋 需求分析完成！**\n\n`;
    
    content += `**项目概况**\n`;
    content += `- 类型：${this.getProjectTypeName(analysis.projectType)}\n`;
    content += `- 复杂度：${this.getComplexityLabel(analysis.complexity.level)}\n`;
    content += `- 预计用时：${analysis.complexity.estimatedTime}\n\n`;

    content += `**👥 团队配置**\n`;
    content += `根据您的需求，我安排 **${agentNames[targetAgent!]}** 来负责这个项目。\n\n`;
    content += `*${decision.reasoning}*\n\n`;

    if (plan) {
      content += `**📝 执行计划**\n`;
      plan.steps.forEach((step, i) => {
        content += `${i + 1}. **${step}**\n`;
      });
      content += '\n';
    }

    content += `现在让我为您开始创作，请稍候...`;

    return content;
  }

  /**
   * 生成协作内容
   */
  private generateCollaborationContent(decision: DecisionResult, analysis: RequirementAnalysis): string {
    const { targetAgents, plan } = decision;
    const agentNames: Record<AgentType, string> = {
      'director': '津脉设计总监',
      'designer': '津脉品牌设计师',
      'illustrator': '津脉插画师',
      'copywriter': '津脉文案策划',
      'animator': '津脉动画师',
      'researcher': '津脉研究员',
      'system': '系统',
      'user': '用户'
    };

    let content = `**🎯 这是一个综合性的设计项目！**\n\n`;
    
    content += `**项目复杂度：**${this.getComplexityLabel(analysis.complexity.level)}\n`;
    content += `**预计用时：**${analysis.complexity.estimatedTime}\n\n`;

    content += `**👥 专家团队协作**\n\n`;
    content += `我将组织以下团队成员协同完成：\n\n`;
    
    targetAgents!.forEach((agent, i) => {
      const role = i === 0 ? '主负责' : '协助';
      content += `${i + 1}. **${agentNames[agent]}** - ${role}\n`;
    });
    
    content += `\n*${decision.reasoning}*\n\n`;

    if (plan) {
      content += `**📋 协作流程**\n`;
      plan.steps.forEach((step, i) => {
        content += `${i + 1}. **${step}**\n`;
      });
      content += '\n';
    }

    content += `团队已就位，现在开始协作创作...`;

    return content;
  }

  /**
   * 判断是否显示风格选择器
   */
  private shouldShowStyleSelector(analysis: RequirementAnalysis): boolean {
    // 如果是图像生成相关项目，且未选择风格，则显示
    const imageRelatedTypes = ['ip-character', 'illustration', 'brand-design', 'poster'];
    return imageRelatedTypes.includes(analysis.projectType) && !analysis.requirements.stylePreference;
  }

  /**
   * 获取项目类型名称
   */
  private getProjectTypeName(type: string): string {
    const names: Record<string, string> = {
      'ip-character': 'IP形象设计',
      'brand-design': '品牌设计',
      'packaging': '包装设计',
      'poster': '海报设计',
      'animation': '动画视频',
      'illustration': '插画设计',
      'mixed': '综合设计项目',
      'unknown': '待确定'
    };
    return names[type] || type;
  }

  /**
   * 获取复杂度标签
   */
  private getComplexityLabel(level: string): string {
    const labels: Record<string, string> = {
      'simple': '🟢 简单',
      'medium': '🟡 中等',
      'complex': '🔴 复杂'
    };
    return labels[level] || level;
  }

  /**
   * 获取当前思考步骤
   */
  getCurrentThinkingSteps(): ThinkingStep[] {
    return thinkingRecorder.getSessionSteps();
  }

  /**
   * 是否正在思考
   */
  isThinking(): boolean {
    return thinkingRecorder.isSessionActive();
  }
}

// 为了向后兼容，保留旧类型名
export type ConversationContext = ConversationContextV2;
export type OrchestratorResponse = OrchestratorResponseV2;

// 导出单例实例
export const agentOrchestrator = new AgentOrchestrator();

// 导出便捷函数
export async function processWithOrchestrator(
  message: string,
  context: ConversationContextV2
): Promise<OrchestratorResponseV2> {
  return agentOrchestrator.processUserInput(message, context);
}
