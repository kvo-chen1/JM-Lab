/**
 * 文案策划 Agent
 * 专注品牌文案、标语创作、故事编写
 */

import { BaseAgent, AgentResponse } from './BaseAgent';
import { AgentType } from '../types/agent';
import { ExecutionContext, UserIntent } from '../types/skill';
import { TextGenerationSkill } from '../skills/creation/TextGenerationSkill';
import { IntentRecognitionSkill } from '../skills/analysis/IntentRecognitionSkill';

export class CopywriterAgent extends BaseAgent {
  readonly type: AgentType = 'copywriter';
  readonly name = '津脉文案策划';
  readonly description = '专注品牌文案、标语创作和内容策划';

  constructor() {
    super();

    // 注册文案策划专属 Skill
    this.registerSkills([
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
        case 'brand-copy':
        case 'brand-strategy':
          return this.handleBrandCopy(message, intent, context);

        case 'slogan':
          return this.handleSloganCreation(message, intent, context);

        case 'story':
          return this.handleStoryWriting(message, intent, context);

        case 'content':
          return this.handleContentCreation(message, intent, context);

        default:
          return this.handleDefault(message, intent);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '处理失败';
      return this.createErrorResponse(errorMessage);
    }
  }

  /**
   * 处理品牌文案请求
   */
  private async handleBrandCopy(
    message: string,
    intent: UserIntent,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    const textSkill = this.getSkills().find(s => s.id === 'text-generation');

    if (textSkill) {
      const result = await this.executeSkill(textSkill, {
        ...context,
        message,
        parameters: {
          ...context.parameters,
          ...intent.entities,
          type: 'brand-copy',
          prompt: this.buildBrandCopyPrompt(message, intent)
        }
      });

      if (result.success) {
        return this.buildResponse(result);
      }
    }

    return this.createTextResponse(
      '我来为您创作品牌文案。请告诉我：\n• 品牌名称和定位\n• 目标受众\n• 品牌调性（高端/亲民/年轻等）\n• 文案使用场景',
      { intent: intent.type, stage: 'requirement-collection' }
    );
  }

  /**
   * 处理标语创作请求
   */
  private async handleSloganCreation(
    message: string,
    intent: UserIntent,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    const textSkill = this.getSkills().find(s => s.id === 'text-generation');

    if (textSkill) {
      const result = await this.executeSkill(textSkill, {
        ...context,
        message,
        parameters: {
          ...context.parameters,
          ...intent.entities,
          type: 'slogan',
          prompt: this.buildSloganPrompt(message, intent)
        }
      });

      if (result.success) {
        return this.buildResponse(result);
      }
    }

    return this.createTextResponse(
      '我来为您创作标语。请提供：\n• 品牌或产品名称\n• 核心卖点\n• 目标受众\n• 标语风格偏好（简洁/诗意/有力等）',
      { intent: intent.type }
    );
  }

  /**
   * 处理故事编写请求
   */
  private async handleStoryWriting(
    message: string,
    intent: UserIntent,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    const textSkill = this.getSkills().find(s => s.id === 'text-generation');

    if (textSkill) {
      const result = await this.executeSkill(textSkill, {
        ...context,
        message,
        parameters: {
          ...context.parameters,
          ...intent.entities,
          type: 'story',
          prompt: this.buildStoryPrompt(message, intent)
        }
      });

      if (result.success) {
        return this.buildResponse(result);
      }
    }

    return this.createTextResponse(
      '我很乐意为您编写故事！请描述：\n• 故事主题\n• 目标受众\n• 故事类型（品牌故事/产品故事/角色故事）\n• 期望的篇幅和风格',
      { intent: intent.type }
    );
  }

  /**
   * 处理内容创作请求
   */
  private async handleContentCreation(
    message: string,
    intent: UserIntent,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    const textSkill = this.getSkills().find(s => s.id === 'text-generation');

    if (textSkill) {
      const result = await this.executeSkill(textSkill, {
        ...context,
        message,
        parameters: {
          ...context.parameters,
          ...intent.entities,
          type: 'content',
          prompt: this.buildContentPrompt(message, intent)
        }
      });

      if (result.success) {
        return this.buildResponse(result);
      }
    }

    return this.createTextResponse(
      '我来为您创作内容。请告诉我内容的用途和风格要求...',
      { intent: intent.type }
    );
  }

  /**
   * 构建品牌文案提示词
   */
  private buildBrandCopyPrompt(message: string, intent: UserIntent): string {
    const brand = intent.entities?.brand || '品牌';
    const tone = intent.entities?.tone || '专业';
    
    return `为${brand}创作品牌文案，风格：${tone}。需求：${message}。要求：有感染力、符合品牌调性、易于传播。`;
  }

  /**
   * 构建标语提示词
   */
  private buildSloganPrompt(message: string, intent: UserIntent): string {
    const brand = intent.entities?.brand || '品牌';
    const style = intent.entities?.style || '简洁有力';
    
    return `为${brand}创作标语，风格：${style}。核心信息：${message}。要求：简短易记、有传播力、体现品牌特色。提供3-5个选项。`;
  }

  /**
   * 构建故事提示词
   */
  private buildStoryPrompt(message: string, intent: UserIntent): string {
    const type = intent.entities?.storyType || '品牌故事';
    const length = intent.entities?.length || '中等篇幅';
    
    return `创作一个${type}，${length}。主题：${message}。要求：情节完整、情感真挚、有吸引力。`;
  }

  /**
   * 构建内容提示词
   */
  private buildContentPrompt(message: string, intent: UserIntent): string {
    const format = intent.entities?.format || '文章';
    const platform = intent.entities?.platform || '通用';
    
    return `创作${platform}平台的${format}内容。主题：${message}。要求：内容优质、结构清晰、符合平台调性。`;
  }

  /**
   * 默认处理
   */
  private handleDefault(message: string, intent: UserIntent): AgentResponse {
    if (intent.clarificationNeeded) {
      return this.createTextResponse(
        intent.suggestedResponse || '能否详细描述一下您的文案需求？',
        { clarificationNeeded: true }
      );
    }

    return this.createTextResponse(
      `你好！我是津脉文案策划，专注于：

• 品牌文案与定位
• 标语口号创作
• 品牌故事编写
• 内容营销策划

请告诉我您需要什么样的文案服务？`,
      { intent: intent.type }
    );
  }

  /**
   * 生成文案建议
   */
  async generateCopySuggestions(requirements: string): Promise<string[]> {
    const suggestions: string[] = [];

    if (requirements.includes('品牌')) {
      suggestions.push('建议先明确品牌核心价值和差异化优势');
      suggestions.push('确定品牌调性和语言风格');
    }

    if (requirements.includes('标语') || requirements.includes('口号')) {
      suggestions.push('标语要简短有力，最好在8个字以内');
      suggestions.push('考虑标语的记忆点和传播性');
    }

    if (requirements.includes('故事')) {
      suggestions.push('好的品牌故事要有情感共鸣点');
      suggestions.push('故事要真实可信，避免过度包装');
    }

    if (suggestions.length === 0) {
      suggestions.push('请提供更多文案需求细节，我可以给出更精准的建议');
    }

    return suggestions;
  }
}
