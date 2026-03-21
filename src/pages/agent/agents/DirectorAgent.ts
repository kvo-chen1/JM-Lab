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
   */
  async handleMessage(message: string, context: ExecutionContext): Promise<AgentResponse> {
    try {
      // 1. 识别意图
      const intent = await this.recognizeIntent(message);

      // 2. 处理不同类型的意图
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
   * 处理问候
   */
  private handleGreeting(): AgentResponse {
    return this.createTextResponse(
      `下午好！欢迎回来，我是津脉设计总监，很高兴再次为您服务。

我可以帮您完成：
• IP形象设计与孵化
• 品牌创意包装设计
• 老字号宣传海报设计
• 其他创意设计需求

今天想要设计什么？`,
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
   */
  private async handleImageGeneration(
    message: string,
    intent: UserIntent,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    // Director 可以直接生成，也可以委派给 Designer
    const imageSkill = this.getSkills().find(s => s.id === 'image-generation');

    if (imageSkill) {
      const result = await this.executeSkill(imageSkill, {
        ...context,
        message,
        parameters: {
          ...context.parameters,
          ...intent.entities
        }
      });

      if (result.success) {
        return this.buildResponse(result);
      }
    }

    return this.createTextResponse(
      '我来为您安排设计师进行创作。请稍等...',
      { delegation: 'designer', intent: intent.type }
    );
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
