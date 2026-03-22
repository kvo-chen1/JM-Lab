/**
 * 插画师 Agent
 * 擅长手绘风格、角色设计、概念插画
 */

import { BaseAgent, AgentResponse } from './BaseAgent';
import { AgentType } from '../types/agent';
import { ExecutionContext, UserIntent } from '../types/skill';
import { ImageGenerationSkill } from '../skills/creation/ImageGenerationSkill';
import { IntentRecognitionSkill } from '../skills/analysis/IntentRecognitionSkill';
import { TextGenerationSkill } from '../skills/creation/TextGenerationSkill';

export class IllustratorAgent extends BaseAgent {
  readonly type: AgentType = 'illustrator';
  readonly name = '津脉插画师';
  readonly description = '擅长手绘风格、角色设计和概念插画创作';

  constructor() {
    super();

    // 注册插画师专属 Skill
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

      // 2. 处理不同类型的意图
      switch (intent.type) {
        case 'character-design':
        case 'ip-character':
          return this.handleCharacterDesign(message, intent, context);

        case 'illustration':
          return this.handleIllustration(message, intent, context);

        case 'sketch':
          return this.handleSketch(message, intent, context);

        case 'concept-art':
          return this.handleConceptArt(message, intent, context);

        default:
          return this.handleDefault(message, intent);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '处理失败';
      return this.createErrorResponse(errorMessage);
    }
  }

  /**
   * 处理角色设计请求
   */
  private async handleCharacterDesign(
    message: string,
    intent: UserIntent,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    // 使用图像生成 Skill
    const imageSkill = this.getSkills().find(s => s.id === 'image-generation');

    if (imageSkill) {
      const result = await this.executeSkill(imageSkill, {
        ...context,
        message,
        parameters: {
          ...context.parameters,
          ...intent.entities,
          style: 'character-design',
          prompt: this.buildCharacterPrompt(message, intent)
        }
      });

      if (result.success) {
        return this.buildResponse(result);
      }
    }

    return this.createTextResponse(
      '我来为您设计这个角色。请告诉我更多细节，比如：\n• 角色的外貌特征\n• 服装风格\n• 性格特点\n• 希望的艺术风格',
      { intent: intent.type, stage: 'requirement-collection' }
    );
  }

  /**
   * 处理插画创作请求
   */
  private async handleIllustration(
    message: string,
    intent: UserIntent,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    const imageSkill = this.getSkills().find(s => s.id === 'image-generation');

    if (imageSkill) {
      const result = await this.executeSkill(imageSkill, {
        ...context,
        message,
        parameters: {
          ...context.parameters,
          ...intent.entities,
          style: 'illustration',
          prompt: this.buildIllustrationPrompt(message, intent)
        }
      });

      if (result.success) {
        return this.buildResponse(result);
      }
    }

    return this.createTextResponse(
      '我很乐意为您创作插画！请描述一下：\n• 插画的主题\n• 想要的风格（水彩/彩铅/数字绘画等）\n• 画面氛围\n• 主要元素',
      { intent: intent.type }
    );
  }

  /**
   * 处理草图绘制请求
   */
  private async handleSketch(
    message: string,
    intent: UserIntent,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    const imageSkill = this.getSkills().find(s => s.id === 'image-generation');

    if (imageSkill) {
      const result = await this.executeSkill(imageSkill, {
        ...context,
        message,
        parameters: {
          ...context.parameters,
          ...intent.entities,
          style: 'sketch',
          prompt: `sketch style, pencil drawing, ${message}, rough sketch, artistic`
        }
      });

      if (result.success) {
        return this.buildResponse(result);
      }
    }

    return this.createTextResponse(
      '我来为您绘制草图。请描述您想要的内容...',
      { intent: intent.type }
    );
  }

  /**
   * 处理概念艺术请求
   */
  private async handleConceptArt(
    message: string,
    intent: UserIntent,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    const imageSkill = this.getSkills().find(s => s.id === 'image-generation');

    if (imageSkill) {
      const result = await this.executeSkill(imageSkill, {
        ...context,
        message,
        parameters: {
          ...context.parameters,
          ...intent.entities,
          style: 'concept-art',
          prompt: `concept art, professional design, ${message}, detailed, high quality`
        }
      });

      if (result.success) {
        return this.buildResponse(result);
      }
    }

    return this.createTextResponse(
      '我来为您创作概念艺术。请描述您的想法...',
      { intent: intent.type }
    );
  }

  /**
   * 构建角色设计提示词
   */
  private buildCharacterPrompt(message: string, intent: UserIntent): string {
    const style = intent.entities?.style || 'anime style';
    const features = intent.entities?.features || '';
    
    return `character design, ${style}, ${message}, ${features}, full body, white background, professional character sheet, high quality, detailed`;
  }

  /**
   * 构建插画提示词
   */
  private buildIllustrationPrompt(message: string, intent: UserIntent): string {
    const style = intent.entities?.style || 'digital painting';
    const mood = intent.entities?.mood || 'peaceful';
    
    return `${style} illustration, ${mood} atmosphere, ${message}, artistic, detailed, high quality`;
  }

  /**
   * 默认处理
   */
  private handleDefault(message: string, intent: UserIntent): AgentResponse {
    if (intent.clarificationNeeded) {
      return this.createTextResponse(
        intent.suggestedResponse || '能否详细描述一下您的创作需求？',
        { clarificationNeeded: true }
      );
    }

    return this.createTextResponse(
      `你好！我是津脉插画师，擅长：

• 角色设计与IP形象创作
• 手绘风格插画
• 概念艺术设计
• 草图绘制

请告诉我您想要创作什么类型的作品？`,
      { intent: intent.type }
    );
  }

  /**
   * 生成插画建议
   */
  async generateIllustrationSuggestions(requirements: string): Promise<string[]> {
    const suggestions: string[] = [];

    if (requirements.includes('角色') || requirements.includes('人物')) {
      suggestions.push('建议先确定角色的性格和背景故事');
      suggestions.push('可以考虑设计角色的标志性服装或配饰');
    }

    if (requirements.includes('场景') || requirements.includes('背景')) {
      suggestions.push('确定画面的视角和构图');
      suggestions.push('考虑光影效果和氛围营造');
    }

    if (requirements.includes('风格')) {
      suggestions.push('可以参考一些优秀的插画作品获取灵感');
      suggestions.push('确定色彩方案和整体调性');
    }

    if (suggestions.length === 0) {
      suggestions.push('请提供更多创作需求细节，我可以给出更精准的建议');
    }

    return suggestions;
  }
}
