/**
 * 品牌设计师 Agent
 * 专注视觉设计和图像生成
 */

import { BaseAgent, AgentResponse } from './BaseAgent';
import { AgentType } from '../types/agent';
import { ExecutionContext, UserIntent } from '../types/skill';
import { ImageGenerationSkill } from '../skills/creation/ImageGenerationSkill';
import { TextGenerationSkill } from '../skills/creation/TextGenerationSkill';
import { IntentRecognitionSkill } from '../skills/analysis/IntentRecognitionSkill';

export class DesignerAgent extends BaseAgent {
  readonly type: AgentType = 'designer';
  readonly name = '津脉品牌设计师';
  readonly description = '专注视觉设计和图像生成，擅长品牌视觉、海报设计、包装设计等';

  constructor() {
    super();

    // 注册 Designer Agent 的 Skill
    this.registerSkills([
      new ImageGenerationSkill(),
      new TextGenerationSkill(),
      new IntentRecognitionSkill()
    ]);
  }

  /**
   * 处理用户消息
   */
  async handleMessage(message: string, context: ExecutionContext): Promise<AgentResponse> {
    try {
      // 1. 识别意图
      const intent = await this.recognizeIntent(message);

      // 2. 如果需要澄清
      if (intent.clarificationNeeded && intent.suggestedResponse) {
        return this.createTextResponse(intent.suggestedResponse, {
          clarificationNeeded: true,
          intent: intent.type
        });
      }

      // 3. 查找匹配的 Skill
      const matches = this.findMatchingSkills(intent);

      if (matches.length === 0) {
        return this.createTextResponse(
          '我是品牌设计师，擅长视觉设计和图像生成。请告诉我您需要设计什么，比如海报、Logo、包装设计等。',
          { intent: intent.type }
        );
      }

      // 4. 执行最佳匹配的 Skill
      const bestMatch = matches[0];
      const skillContext: ExecutionContext = {
        ...context,
        message,
        parameters: {
          ...context.parameters,
          ...intent.entities
        }
      };

      const result = await this.executeSkill(bestMatch.skill, skillContext);

      if (!result.success) {
        return this.createErrorResponse(result.error?.message || '执行失败');
      }

      // 5. 构建响应
      return this.buildResponse(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '处理失败';
      return this.createErrorResponse(errorMessage);
    }
  }

  /**
   * 生成设计建议
   */
  async generateDesignSuggestions(requirements: string): Promise<string[]> {
    const suggestions: string[] = [];

    if (requirements.includes('品牌')) {
      suggestions.push('建议先确定品牌核心价值和目标受众');
      suggestions.push('可以考虑设计品牌Logo和视觉识别系统');
    }

    if (requirements.includes('海报')) {
      suggestions.push('确定海报的主题和传达的核心信息');
      suggestions.push('选择适合目标受众的视觉风格');
    }

    if (requirements.includes('包装')) {
      suggestions.push('考虑产品的定位和货架展示效果');
      suggestions.push('包装材料的选择也很重要');
    }

    if (suggestions.length === 0) {
      suggestions.push('请提供更多设计需求细节，我可以给出更精准的建议');
    }

    return suggestions;
  }
}
