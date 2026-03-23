/**
 * 图片识别 Skill
 * 识别图片内容，生成详细描述
 */

import { AnalysisSkill } from '../base/BaseSkill';
import type { UserIntent, ExecutionContext, SkillResult } from '../../types/skill';
import { createChatContext, sendMessageStream } from '../../chat/services/chatService';

export class ImageRecognitionSkill extends AnalysisSkill {
  readonly id = 'image-recognition';
  readonly name = '图片识别';
  readonly description = '识别图片内容，生成详细描述';

  readonly capabilities = [
    {
      id: 'recognize-image',
      name: '识别图片',
      description: '分析图片内容，生成详细描述',
      parameters: [
        { name: 'imageUrl', type: 'string', required: true, description: '图片 URL' },
        { name: 'detailLevel', type: 'string', required: false, description: '详细程度：brief, detailed, comprehensive' }
      ]
    }
  ];

  canHandle(intent: UserIntent): boolean {
    return intent.type === 'image-recognition' ||
           intent.keywords.some(k => ['识别', '分析', '描述', '这张图', '这张图片'].includes(k)) ||
           (intent.entities.imageUrl !== undefined);
  }

  protected async doExecute(context: ExecutionContext): Promise<SkillResult> {
    const { imageUrl, detailLevel = 'detailed' } = context.parameters || {};

    if (!imageUrl) {
      return this.createErrorResult('缺少图片 URL 参数', false);
    }

    try {
      // 构建图片识别的提示词
      const recognitionPrompt = this.buildRecognitionPrompt(imageUrl, detailLevel);
      
      // 创建聊天上下文
      const chatContext = createChatContext(context.history || []);
      
      // 使用流式输出获取识别结果
      let recognitionResult = '';
      await sendMessageStream(
        recognitionPrompt,
        chatContext,
        (delta) => {
          recognitionResult += delta;
        },
        undefined // signal
      );

      if (!recognitionResult.trim()) {
        return this.createErrorResult('图片识别结果为空', true);
      }

      // 提取关键信息作为 metadata
      const metadata = this.extractMetadata(recognitionResult, imageUrl);

      return this.createSuccessResult(
        recognitionResult,
        'text',
        metadata
      );
    } catch (error) {
      console.error('[ImageRecognitionSkill] 识别失败:', error);
      return this.createErrorResult(
        `图片识别失败：${error instanceof Error ? error.message : '未知错误'}`,
        true,
        error instanceof Error ? error : null
      );
    }
  }

  /**
   * 构建图片识别提示词
   */
  private buildRecognitionPrompt(imageUrl: string, detailLevel: string): string {
    const detailInstructions: Record<string, string> = {
      brief: '请简要描述这张图片的主要内容（50 字以内）',
      detailed: '请详细描述这张图片，包括主要物体、场景、颜色和风格',
      comprehensive: '请全面分析这张图片，包括：1) 主要物体和元素 2) 场景和环境 3) 颜色和色调 4) 风格和艺术特点 5) 可能的用途或主题 6) 给人的感受或印象'
    };

    const instruction = detailInstructions[detailLevel] || detailInstructions.detailed;

    return `${instruction}。

图片 URL: ${imageUrl}

请基于图片内容进行描述，不要臆测不存在的内容。`;
  }

  /**
   * 从识别结果中提取 metadata
   */
  private extractMetadata(recognitionResult: string, imageUrl: string): Record<string, any> {
    // 简单的关键词提取
    const keywords: string[] = [];
    
    // 提取颜色相关词汇
    const colorPatterns = ['红色', '橙色', '黄色', '绿色', '青色', '蓝色', '紫色', '黑色', '白色', '灰色', '粉色', '金色', '银色'];
    colorPatterns.forEach(color => {
      if (recognitionResult.includes(color)) {
        keywords.push(color);
      }
    });

    // 提取风格相关词汇
    const stylePatterns = ['现代', '复古', '简约', '复杂', '抽象', '写实', '卡通', '科幻', '自然', '工业'];
    stylePatterns.forEach(style => {
      if (recognitionResult.includes(style)) {
        keywords.push(style);
      }
    });

    return {
      imageUrl,
      recognizedAt: Date.now(),
      keywords,
      objectCount: keywords.length,
      confidence: 0.9 // 模拟置信度
    };
  }
}
