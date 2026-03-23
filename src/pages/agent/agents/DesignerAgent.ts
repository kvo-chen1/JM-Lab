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
   * 支持快速模式：简单请求直接执行Skill，复杂请求走完整LLM流程
   */
  async handleMessage(message: string, context: ExecutionContext): Promise<AgentResponse> {
    try {
      // 1. 检查是否是快速生成请求（直接生成图像）
      if (this.isQuickGenerationRequest(message)) {
        return this.handleQuickGeneration(message, context);
      }

      // 2. 识别意图
      const intent = await this.recognizeIntent(message);

      // 3. 如果需要澄清
      if (intent.clarificationNeeded && intent.suggestedResponse) {
        return this.createTextResponse(intent.suggestedResponse, {
          clarificationNeeded: true,
          intent: intent.type
        });
      }

      // 4. 查找匹配的 Skill
      const matches = this.findMatchingSkills(intent);

      if (matches.length === 0) {
        return this.createTextResponse(
          '我是品牌设计师，擅长视觉设计和图像生成。请告诉我您需要设计什么，比如海报、Logo、包装设计等。',
          { intent: intent.type }
        );
      }

      // 5. 执行最佳匹配的 Skill
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

      // 6. 构建响应
      return this.buildResponse(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '处理失败';
      return this.createErrorResponse(errorMessage);
    }
  }

  /**
   * 检查是否是快速生成请求
   * 特征：包含明确的生成指令 + 具体描述
   */
  private isQuickGenerationRequest(message: string): boolean {
    const lowerMsg = message.toLowerCase();
    
    // 快速生成关键词
    const quickKeywords = [
      '生成', '画', '画一个', '画个', '画一张', '画幅',
      '做', '做个', '做一个', '来', '来张', '来个',
      '给我画', '帮我画', '给我生成', '帮我生成'
    ];
    
    // 检查是否包含快速生成关键词
    const hasQuickKeyword = quickKeywords.some(kw => lowerMsg.includes(kw));
    
    // 检查是否包含具体描述（至少4个字符）
    const hasSpecificDescription = message.length >= 4;
    
    // 检查是否不包含复杂需求指示词
    const complexIndicators = ['需求', '方案', '流程', '策略', '规划', '详细', '完整'];
    const hasComplexIndicator = complexIndicators.some(ind => lowerMsg.includes(ind));
    
    return hasQuickKeyword && hasSpecificDescription && !hasComplexIndicator;
  }

  /**
   * 快速生成处理
   * 直接执行图像生成Skill，跳过LLM对话
   */
  private async handleQuickGeneration(
    message: string, 
    context: ExecutionContext
  ): Promise<AgentResponse> {
    console.log('[DesignerAgent] 快速生成模式:', message);
    
    try {
      // 直接获取图像生成Skill
      const imageSkill = this.getSkills().find(s => s.id === 'image-generation');
      
      if (!imageSkill) {
        return this.createErrorResponse('图像生成服务暂时不可用');
      }

      // 构建Skill执行上下文
      const skillContext: ExecutionContext = {
        ...context,
        message,
        parameters: {
          prompt: message,
          fastMode: true
        }
      };

      // 执行Skill
      const result = await this.executeSkill(imageSkill, skillContext);

      if (!result.success) {
        return this.createErrorResponse(result.error?.message || '图像生成失败');
      }

      // 快速包装响应
      return {
        content: `✨ 已为您生成设计作品！\n\n您看怎么样？如果需要调整，可以告诉我：\n• 修改颜色、风格\n• 调整构图、元素\n• 重新生成`,
        type: result.type as any,
        metadata: {
          ...result.metadata,
          quickGeneration: true,
          generatedAt: Date.now()
        }
      };
    } catch (error) {
      console.error('[DesignerAgent] 快速生成失败:', error);
      // 快速模式失败，降级到普通处理
      return this.createTextResponse(
        '我来为您设计这个作品，请稍等...',
        { fallback: true }
      );
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
