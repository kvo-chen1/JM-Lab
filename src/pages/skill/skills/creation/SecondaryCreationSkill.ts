/**
 * 二次创作 Skill
 * 基于原图和用户描述进行二次创作
 * 支持风格转换、元素提取、创意延伸等
 */

import { CreationSkill } from '../base/BaseSkill';
import type { UserIntent, ExecutionContext, SkillResult } from '../../types/skill';
import { generateImage } from '../../chat/services/chatService';

export interface SecondaryCreationParams {
  originalImageUrl: string;
  userRequest: string;
  recognitionResult?: string;
  creationType?: 'style_transfer' | 'element_extraction' | 'creative_extension' | 'redraw';
}

export class SecondaryCreationSkill extends CreationSkill {
  readonly id = 'secondary-creation';
  readonly name = '二次创作';
  readonly description = '基于原图和用户描述进行二次创作';

  readonly capabilities = [
    {
      id: 'style-transfer',
      name: '风格转换',
      description: '将图片转换为指定风格',
      parameters: [
        { name: 'originalImageUrl', type: 'string', required: true, description: '原图 URL' },
        { name: 'targetStyle', type: 'string', required: true, description: '目标风格' },
        { name: 'recognitionResult', type: 'string', required: false, description: '图片识别结果' }
      ]
    },
    {
      id: 'element-extraction',
      name: '元素提取',
      description: '提取图片中的特定元素',
      parameters: [
        { name: 'originalImageUrl', type: 'string', required: true, description: '原图 URL' },
        { name: 'elements', type: 'string', required: true, description: '要提取的元素' }
      ]
    },
    {
      id: 'creative-extension',
      name: '创意延伸',
      description: '基于原图进行创意延伸',
      parameters: [
        { name: 'originalImageUrl', type: 'string', required: true, description: '原图 URL' },
        { name: 'extensionIdea', type: 'string', required: true, description: '延伸创意' }
      ]
    },
    {
      id: 'redraw',
      name: '重新绘制',
      description: '基于原图重新绘制',
      parameters: [
        { name: 'originalImageUrl', type: 'string', required: true, description: '原图 URL' },
        { name: 'modifications', type: 'string', required: true, description: '修改要求' }
      ]
    }
  ];

  canHandle(intent: UserIntent): boolean {
    return intent.type === 'secondary-creation' ||
           intent.keywords.some(k => ['转换', '改编', '二次创作', '重新画', '改成', '变成'].includes(k)) ||
           (intent.entities.originalImageUrl !== undefined && intent.entities.userRequest !== undefined);
  }

  protected async doExecute(context: ExecutionContext): Promise<SkillResult> {
    const params: SecondaryCreationParams = {
      originalImageUrl: context.parameters?.originalImageUrl,
      userRequest: context.parameters?.userRequest || context.message,
      recognitionResult: context.parameters?.recognitionResult,
      creationType: context.parameters?.creationType || 'redraw'
    };

    if (!params.originalImageUrl) {
      return this.createErrorResult('缺少原图 URL 参数', false);
    }

    if (!params.userRequest || params.userRequest.trim() === '') {
      return this.createErrorResult('缺少创作需求描述', false);
    }

    try {
      // 构建创作提示词
      const creationPrompt = this.buildCreationPrompt(params);

      console.log('[SecondaryCreationSkill] 开始二次创作，提示词:', creationPrompt);

      // 调用图像生成
      const generatedImageUrl = await generateImage(creationPrompt);

      if (!generatedImageUrl) {
        return this.createErrorResult('二次创作失败：未返回图片 URL', true);
      }

      console.log('[SecondaryCreationSkill] 创作完成，图片 URL:', generatedImageUrl);

      // 创建结果
      const result = this.createSuccessResult(
        '✅ **二次创作完成**\n\n已根据您的需求和原图完成了创作。',
        'image',
        {
          imageUrl: generatedImageUrl,
          originalImageUrl: params.originalImageUrl,
          creationType: params.creationType,
          prompt: creationPrompt,
          userRequest: params.userRequest,
          createdAt: Date.now()
        }
      );

      return result;
    } catch (error) {
      console.error('[SecondaryCreationSkill] 创作失败:', error);
      return this.createErrorResult(
        `二次创作失败：${error instanceof Error ? error.message : '未知错误'}`,
        true,
        error instanceof Error ? error : null
      );
    }
  }

  /**
   * 构建创作提示词
   */
  private buildCreationPrompt(params: SecondaryCreationParams): string {
    const { originalImageUrl, userRequest, recognitionResult, creationType } = params;

    let prompt = '';

    switch (creationType) {
      case 'style_transfer':
        prompt = `请将这张图片转换为指定风格。

原图 URL: ${originalImageUrl}
${recognitionResult ? `原图描述：${recognitionResult}\n` : ''}
用户要求：${userRequest}

请保持原图的主要内容和构图，但将风格转换为用户要求的风格。`;
        break;

      case 'element_extraction':
        prompt = `请从这张图片中提取指定元素，并创建新的设计。

原图 URL: ${originalImageUrl}
${recognitionResult ? `原图描述：${recognitionResult}\n` : ''}
要提取的元素：${userRequest}

请提取用户指定的元素，并以清晰、独立的方式呈现。`;
        break;

      case 'creative_extension':
        prompt = `请基于这张图片进行创意延伸创作。

原图 URL: ${originalImageUrl}
${recognitionResult ? `原图描述：${recognitionResult}\n` : ''}
创意延伸要求：${userRequest}

请在原图的基础上进行创意发挥，实现用户的延伸想法。`;
        break;

      case 'redraw':
      default:
        prompt = `请根据这张图片和用户要求进行重新创作。

原图 URL: ${originalImageUrl}
${recognitionResult ? `原图描述：${recognitionResult}\n` : ''}
创作要求：${userRequest}

请参考原图的内容和风格，按照用户的要求进行创作。`;
        break;
    }

    return prompt;
  }

  /**
   * 判断创作类型
   */
  private inferCreationType(userRequest: string): SecondaryCreationParams['creationType'] {
    const lowerRequest = userRequest.toLowerCase();

    // 风格转换关键词
    if (lowerRequest.includes('风格') || lowerRequest.includes('转换成') || lowerRequest.includes('变成') ||
        lowerRequest.includes('水彩') || lowerRequest.includes('油画') || lowerRequest.includes('卡通') ||
        lowerRequest.includes('素描') || lowerRequest.includes('赛博朋克') || lowerRequest.includes('复古')) {
      return 'style_transfer';
    }

    // 元素提取关键词
    if (lowerRequest.includes('提取') || lowerRequest.includes('单独') || lowerRequest.includes('扣出')) {
      return 'element_extraction';
    }

    // 创意延伸关键词
    if (lowerRequest.includes('延伸') || lowerRequest.includes('扩展') || lowerRequest.includes('发展') ||
        lowerRequest.includes('创意') || lowerRequest.includes('想象')) {
      return 'creative_extension';
    }

    // 默认为重新绘制
    return 'redraw';
  }
}
