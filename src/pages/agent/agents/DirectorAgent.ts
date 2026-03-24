/**
 * 设计总监 Agent
 * 统筹全局，负责需求分析和任务分配
 */

import { BaseAgent, AgentResponse } from './BaseAgent';
import { AgentType } from '../types/agent';
import { ExecutionContext, UserIntent } from '../types/skill';
import { IntentRecognitionSkill } from '../skills/analysis/IntentRecognitionSkill';
import { RequirementAnalysisSkill } from '../skills/analysis/RequirementAnalysisSkill';
import { ImageGenerationSkill } from '../skills/creation/ImageGenerationSkill';

export class DirectorAgent extends BaseAgent {
  readonly type: AgentType = 'director';
  readonly name = '津脉设计总监';
  readonly description = '统筹全局，负责需求分析、任务分配和项目质量把控';

  constructor() {
    super();

    // 注册 Director Agent 的 Skill
    this.registerSkills([
      new IntentRecognitionSkill(),
      new RequirementAnalysisSkill(),
      new ImageGenerationSkill() // Director 也可以直接生成
    ]);
  }

  /**
   * 处理用户消息
   * 支持快速模式：简单请求直接执行Skill，复杂请求走完整LLM流程
   */
  async handleMessage(message: string, context: ExecutionContext): Promise<AgentResponse> {
    try {
      // 1. 检查是否是引用上下文的语句
      if (this.isContextReference(message)) {
        console.log('[DirectorAgent] 检测到上下文引用:', message);
        
        // 从历史中提取上下文
        const previousContext = this.extractContextFromHistory(context.history || []);
        
        if (previousContext) {
          console.log('[DirectorAgent] 提取到上下文:', previousContext);
          
          // 如果之前的请求是快速生成请求，继续执行
          if (this.isQuickGenerationRequest(previousContext)) {
            return this.handleQuickGeneration(previousContext, context);
          }
          
          // 否则，使用之前的上下文继续对话
          return this.createTextResponse(
            `好的，我们继续处理"${previousContext}"。请稍等，我正在为您生成...`,
            { 
              continuedFrom: previousContext,
              isContextContinuation: true 
            }
          );
        }
      }

      // 2. 检查是否是快速生成请求（直接生成图像）
      if (this.isQuickGenerationRequest(message)) {
        return this.handleQuickGeneration(message, context);
      }

      // 3. 识别意图
      const intent = await this.recognizeIntent(message);

      // 3. 处理不同类型的意图
      switch (intent.type) {
        case 'greeting':
          return this.handleGreeting();

        case 'requirement-collection':
        case 'design-request':
          return this.handleDesignRequest(message, intent, context);

        case 'image-generation':
          return this.handleImageGeneration(message, intent, context);

        case 'confirmation':
          return this.createTextResponse('好的，我会继续推进项目。');

        case 'rejection':
          return this.createTextResponse('收到，我会调整方案。请告诉我您的具体想法。');

        default:
          return this.handleDefault(message, intent);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '处理失败';
      return this.createErrorResponse(errorMessage);
    }
  }

  /**
   * 快速生成处理
   * 总监不直接生成，而是先收集需求，然后委派给专业 Agent
   */
  private async handleQuickGeneration(
    message: string,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    console.log('[DirectorAgent] 快速生成请求，转为需求收集:', message);

    // 分析设计类型
    const designType = this.analyzeDesignType(message);

    // 根据设计类型确定委派目标
    const targetAgent = this.selectAgentForDesignType(designType);

    // 返回委派响应，让 Orchestrator 处理实际的委派
    return {
      content: `收到！您想要做${designType}设计。为了确保设计效果，我需要先了解一些关键信息：\n\n**目标受众是谁？**\n比如：年轻人、儿童、商务人士、家庭用户等\n\n**风格偏好？**\n比如：简约现代、复古传统、可爱活泼、专业稳重等\n\n（如果你希望直接开始，可以说"直接开始"或"你决定"）`,
      type: 'text',
      metadata: {
        delegation: targetAgent,
        designType,
        originalRequest: message,
        showThinkingProcess: true,
        thinking: {
          userRequirement: `用户想要生成：${message}`,
          modelSelection: {
            model: '需求分析',
            reason: '作为设计总监，我需要先了解用户的完整需求，然后委派给最适合的专业Agent。'
          },
          promptDesign: {
            strategy: '通过询问目标受众和风格偏好来收集关键信息',
            finalPrompt: message
          }
        }
      }
    };
  }

  /**
   * 分析设计类型
   */
  private analyzeDesignType(message: string): string {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('ip') || lowerMsg.includes('形象') || lowerMsg.includes('角色')) {
      return 'IP形象';
    }
    if (lowerMsg.includes('品牌') || lowerMsg.includes('logo') || lowerMsg.includes('vi')) {
      return '品牌';
    }
    if (lowerMsg.includes('包装') || lowerMsg.includes('礼盒')) {
      return '包装';
    }
    if (lowerMsg.includes('海报') || lowerMsg.includes('宣传')) {
      return '海报';
    }
    if (lowerMsg.includes('插画') || lowerMsg.includes('手绘')) {
      return '插画';
    }
    if (lowerMsg.includes('动画') || lowerMsg.includes('视频')) {
      return '动画视频';
    }

    return '品牌/IP';
  }

  /**
   * 根据设计类型选择 Agent
   */
  private selectAgentForDesignType(designType: string): AgentType {
    switch (designType) {
      case 'IP形象':
      case '插画':
        return 'illustrator';
      case '动画视频':
        return 'animator';
      case '品牌':
      case '包装':
      case '海报':
      default:
        return 'designer';
    }
  }

  /**
   * 处理问候
   */
  private handleGreeting(): AgentResponse {
    return this.createTextResponse(
      `您好！欢迎来到津脉设计～

我是津脉设计总监，专注于将您的创意转化为惊艳的视觉作品。无论是品牌形象、包装设计还是创意海报，我都能为您提供专业的设计服务。

今天想创作什么内容呢？`,
      { type: 'greeting' }
    );
  }

  /**
   * 处理设计请求
   */
  private async handleDesignRequest(
    message: string,
    intent: UserIntent,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    // 使用需求分析 Skill
    const analysisSkill = this.getSkills().find(s => s.id === 'requirement-analysis');

    if (analysisSkill) {
      const result = await this.executeSkill(analysisSkill, {
        ...context,
        message,
        parameters: { description: message }
      });

      if (result.success && result.metadata?.analysis) {
        const analysis = result.metadata.analysis;

        // 根据分析结果决定下一步
        if (analysis.missingInfo?.length > 0) {
          return this.createTextResponse(
            `我了解了您的需求。为了给您最好的设计方案，我还需要了解：

${analysis.missingInfo.map((info: string) => `• ${info}`).join('\n')}

您可以告诉我这些信息吗？`,
            { analysis, stage: 'requirement-collection' }
          );
        }

        // 需求完整，开始规划
        return this.createTextResponse(
          `收到！根据您的需求，我建议按以下步骤进行：

1. **需求确认**：${analysis.projectType}
2. **风格探索**：确定${analysis.stylePreference || '适合的风格'}
3. **方案设计**：制作初稿
4. **优化调整**：根据反馈完善

我现在就可以开始第一步，为您生成设计参考。请稍等...`,
          { analysis, stage: 'planning' }
        );
      }
    }

    // 降级处理
    return this.createTextResponse(
      '收到您的设计需求。我会安排合适的团队成员为您服务。请告诉我更多细节，比如：\n• 设计类型（Logo/海报/包装等）\n• 目标受众\n• 风格偏好',
      { intent: intent.type }
    );
  }

  /**
   * 处理图像生成请求
   * 总监不直接生成，而是委派给专业 Agent
   */
  private async handleImageGeneration(
    message: string,
    intent: UserIntent,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    // 分析设计类型并确定委派目标
    const designType = this.analyzeDesignType(message);
    const targetAgent = this.selectAgentForDesignType(designType);

    console.log(`[DirectorAgent] 图像生成请求，委派给 ${targetAgent}`);

    // 返回委派响应
    return {
      content: `我来为您安排${targetAgent === 'illustrator' ? '插画师' : targetAgent === 'animator' ? '动画师' : '品牌设计师'}进行创作。\n\n为了确保设计效果，请告诉我：\n\n**目标受众是谁？**\n比如：年轻人、儿童、商务人士等\n\n**风格偏好？**\n比如：简约现代、复古传统、可爱活泼等`,
      type: 'text',
      metadata: {
        delegation: targetAgent,
        designType,
        originalRequest: message,
        showThinkingProcess: true,
        thinking: {
          userRequirement: `用户想要生成图像：${message}`,
          modelSelection: {
            model: 'Agent委派',
            reason: `根据设计类型"${designType}"，委派给专业的${targetAgent}处理。`
          },
          promptDesign: {
            strategy: '先收集需求和风格偏好，再委派给专业Agent执行生成',
            finalPrompt: message
          }
        }
      }
    };
  }

  /**
   * 默认处理
   */
  private handleDefault(message: string, intent: UserIntent): AgentResponse {
    if (intent.clarificationNeeded) {
      return this.createTextResponse(
        intent.suggestedResponse || '能否详细描述一下您的需求？',
        { clarificationNeeded: true }
      );
    }

    return this.createTextResponse(
      `我理解您可能需要${intent.type === 'unclear' ? '设计服务' : '相关帮助'}。

作为设计总监，我可以：
• 分析您的设计需求
• 制定项目计划
• 协调团队成员
• 把控设计质量

请告诉我更多关于您的项目信息。`,
      { intent: intent.type }
    );
  }

  /**
   * 委派任务给其他 Agent
   */
  async delegateTask(agentType: AgentType, task: string): Promise<AgentResponse> {
    return this.createTextResponse(
      `我已将任务委派给${agentType}处理：${task}`,
      { delegation: agentType, task }
    );
  }
}
