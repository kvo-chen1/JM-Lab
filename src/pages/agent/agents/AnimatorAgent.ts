/**
 * 动画师 Agent
 * 专注动画制作、视频编辑、动效设计、表情包制作
 */

import { BaseAgent, AgentResponse } from './BaseAgent';
import { AgentType } from '../types/agent';
import { ExecutionContext, UserIntent } from '../types/skill';
import { VideoGenerationSkill } from '../skills/creation/VideoGenerationSkill';
import { ImageGenerationSkill } from '../skills/creation/ImageGenerationSkill';
import { IntentRecognitionSkill } from '../skills/analysis/IntentRecognitionSkill';

export class AnimatorAgent extends BaseAgent {
  readonly type: AgentType = 'animator';
  readonly name = '津脉动画师';
  readonly description = '专注动效设计、视频制作和表情包创作';

  constructor() {
    super();

    // 注册动画师专属 Skill
    this.registerSkills([
      new VideoGenerationSkill(),
      new ImageGenerationSkill(),
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
        case 'animation':
          return this.handleAnimation(message, intent, context);

        case 'video':
          return this.handleVideoProduction(message, intent, context);

        case 'motion-design':
          return this.handleMotionDesign(message, intent, context);

        case 'sticker':
        case 'emoji':
          return this.handleStickerCreation(message, intent, context);

        default:
          return this.handleDefault(message, intent);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '处理失败';
      return this.createErrorResponse(errorMessage);
    }
  }

  /**
   * 处理动画制作请求
   */
  private async handleAnimation(
    message: string,
    intent: UserIntent,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    const videoSkill = this.getSkills().find(s => s.id === 'video-generation');

    if (videoSkill) {
      const result = await this.executeSkill(videoSkill, {
        ...context,
        message,
        parameters: {
          ...context.parameters,
          ...intent.entities,
          type: 'animation',
          prompt: this.buildAnimationPrompt(message, intent)
        }
      });

      if (result.success) {
        return this.buildResponse(result);
      }
    }

    return this.createTextResponse(
      '我来为您制作动画。请告诉我：\n• 动画类型（2D/3D/动态图形）\n• 时长要求\n• 风格偏好\n• 是否有参考素材',
      { intent: intent.type, stage: 'requirement-collection' }
    );
  }

  /**
   * 处理视频制作请求
   */
  private async handleVideoProduction(
    message: string,
    intent: UserIntent,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    const videoSkill = this.getSkills().find(s => s.id === 'video-generation');

    if (videoSkill) {
      const result = await this.executeSkill(videoSkill, {
        ...context,
        message,
        parameters: {
          ...context.parameters,
          ...intent.entities,
          type: 'video',
          prompt: this.buildVideoPrompt(message, intent)
        }
      });

      if (result.success) {
        return this.buildResponse(result);
      }
    }

    return this.createTextResponse(
      '我来为您制作视频。请提供：\n• 视频类型（宣传片/短视频/教程）\n• 目标时长\n• 分辨率要求\n• 脚本或主要内容',
      { intent: intent.type }
    );
  }

  /**
   * 处理动效设计请求
   */
  private async handleMotionDesign(
    message: string,
    intent: UserIntent,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    const videoSkill = this.getSkills().find(s => s.id === 'video-generation');

    if (videoSkill) {
      const result = await this.executeSkill(videoSkill, {
        ...context,
        message,
        parameters: {
          ...context.parameters,
          ...intent.entities,
          type: 'motion',
          prompt: this.buildMotionPrompt(message, intent)
        }
      });

      if (result.success) {
        return this.buildResponse(result);
      }
    }

    return this.createTextResponse(
      '我来为您设计动效。请描述：\n• 动效用途（Logo动画/转场/UI动效）\n• 风格要求\n• 时长限制',
      { intent: intent.type }
    );
  }

  /**
   * 处理表情包制作请求
   */
  private async handleStickerCreation(
    message: string,
    intent: UserIntent,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    const imageSkill = this.getSkills().find(s => s.id === 'image-generation');

    if (imageSkill) {
      // 表情包通常需要生成一系列表情
      const result = await this.executeSkill(imageSkill, {
        ...context,
        message,
        parameters: {
          ...context.parameters,
          ...intent.entities,
          type: 'sticker',
          prompt: this.buildStickerPrompt(message, intent)
        }
      });

      if (result.success) {
        return this.buildResponse(result);
      }
    }

    return this.createTextResponse(
      '我来为您制作表情包！请告诉我：\n• 表情包角色（已有IP或新建）\n• 表情主题（开心/生气/惊讶等）\n• 风格要求\n• 数量需求',
      { intent: intent.type }
    );
  }

  /**
   * 构建动画提示词
   */
  private buildAnimationPrompt(message: string, intent: UserIntent): string {
    const style = intent.entities?.style || '2D animation';
    const duration = intent.entities?.duration || 'short';
    
    return `${style}, ${duration} animation, ${message}, smooth motion, professional quality, high frame rate`;
  }

  /**
   * 构建视频提示词
   */
  private buildVideoPrompt(message: string, intent: UserIntent): string {
    const type = intent.entities?.videoType || 'promotional';
    const resolution = intent.entities?.resolution || '1080p';
    
    return `${type} video, ${resolution}, ${message}, cinematic, professional editing, high quality`;
  }

  /**
   * 构建动效提示词
   */
  private buildMotionPrompt(message: string, intent: UserIntent): string {
    const purpose = intent.entities?.purpose || 'logo animation';
    const style = intent.entities?.style || 'modern';
    
    return `motion design, ${purpose}, ${style} style, ${message}, smooth transitions, professional motion graphics`;
  }

  /**
   * 构建表情包提示词
   */
  private buildStickerPrompt(message: string, intent: UserIntent): string {
    const character = intent.entities?.character || 'cute character';
    const emotion = intent.entities?.emotion || 'happy';
    
    return `${character} sticker, ${emotion} expression, cute style, transparent background, emoji style, high quality`;
  }

  /**
   * 默认处理
   */
  private handleDefault(message: string, intent: UserIntent): AgentResponse {
    if (intent.clarificationNeeded) {
      return this.createTextResponse(
        intent.suggestedResponse || '能否详细描述一下您的动画需求？',
        { clarificationNeeded: true }
      );
    }

    return this.createTextResponse(
      `你好！我是津脉动画师，专注于：

• 动画制作（2D/3D/动态图形）
• 视频编辑与后期
• 动效设计
• 表情包创作

请告诉我您需要什么样的动画服务？`,
      { intent: intent.type }
    );
  }

  /**
   * 生成动画建议
   */
  async generateAnimationSuggestions(requirements: string): Promise<string[]> {
    const suggestions: string[] = [];

    if (requirements.includes('视频') || requirements.includes('宣传片')) {
      suggestions.push('建议先确定视频的核心信息和目标受众');
      suggestions.push('考虑视频的节奏和时长，短视频建议控制在30秒内');
    }

    if (requirements.includes('动画')) {
      suggestions.push('动画风格要与品牌调性保持一致');
      suggestions.push('考虑动画的帧率和流畅度要求');
    }

    if (requirements.includes('表情包') || requirements.includes(' sticker')) {
      suggestions.push('表情包要有辨识度，能传达清晰的情绪');
      suggestions.push('考虑不同平台对表情包尺寸的要求');
    }

    if (requirements.includes('动效')) {
      suggestions.push('动效要服务于内容，避免过度设计');
      suggestions.push('注意动效的时长，通常0.3-0.5秒为宜');
    }

    if (suggestions.length === 0) {
      suggestions.push('请提供更多动画需求细节，我可以给出更精准的建议');
    }

    return suggestions;
  }
}
