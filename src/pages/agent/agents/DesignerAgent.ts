/**
 * 品牌设计师 Agent
 * 专注视觉设计和图像生成
 */

import { BaseAgent, AgentResponse, ExecutionContext } from './BaseAgent';
import { AgentType } from '../types/agent';
import { llmService } from '@/services/llmService';

export class DesignerAgent extends BaseAgent {
  readonly type: AgentType = 'designer';
  readonly name = '津脉品牌设计师';
  readonly description = '专注视觉设计和图像生成，擅长品牌视觉、海报设计、包装设计等';

  /**
   * 处理用户消息
   */
  async handleMessage(message: string, context: ExecutionContext): Promise<AgentResponse> {
    return this.handleMessageWithErrorHandling(async () => {
      // 检查是否是快速生成请求
      if (this.isQuickGenerationRequest(message)) {
        return this.handleQuickGeneration(message, context);
      }

      // 默认响应
      return this.createTextResponse(
        '我是品牌设计师，擅长视觉设计和图像生成。请告诉我您需要设计什么，比如海报、Logo、包装设计等。'
      );
    });
  }

  /**
   * 快速生成处理 - 调用实际的图像生成服务
   */
  protected async handleQuickGeneration(
    message: string,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    console.log('[DesignerAgent] 快速生成模式:', message);

    try {
      // 直接调用 llmService 生成图像
      const result = await llmService.generateImage({
        model: 'qwen-image-2.0-pro',
        prompt: message,
        size: '1024x1024',
        n: 4
      });

      if (!result.ok || !result.data?.data) {
        throw new Error(result.error || '图像生成失败');
      }

      const images = result.data.data.map((img: any, i: number) => ({
        id: `generated-${Date.now()}-${i}`,
        type: 'image' as const,
        url: img.url,
        thumbnail: img.url,
        prompt: message,
        style: undefined,
        createdAt: Date.now()
      }));

      return {
        content: `✨ 我为您生成了以下设计作品：\n\n这些设计基于您的描述："${message}"`,
        type: 'text',
        metadata: {
          quickGeneration: true,
          prompt: message,
          generatedAt: Date.now(),
          images: images
        }
      };
    } catch (error) {
      console.error('[DesignerAgent] 图像生成失败:', error);

      // 返回降级响应 - 使用模拟图片
      const mockImages = Array.from({ length: 4 }, (_, i) => ({
        id: `mock-${Date.now()}-${i}`,
        type: 'image' as const,
        url: `https://images.unsplash.com/photo-${1618005182384 + i}-a83a8bd57fbe?w=800&h=800&fit=crop`,
        thumbnail: `https://images.unsplash.com/photo-${1618005182384 + i}-a83a8bd57fbe?w=200&h=200&fit=crop`,
        prompt: message,
        style: undefined,
        createdAt: Date.now()
      }));

      return {
        content: `✨ 我为您准备了以下设计参考（演示模式）：\n\n基于您的描述："${message}"\n\n*注：由于图像生成服务暂时不可用，显示的是参考图片。*`,
        type: 'text',
        metadata: {
          quickGeneration: true,
          prompt: message,
          generatedAt: Date.now(),
          images: mockImages,
          isMock: true,
          error: error instanceof Error ? error.message : '生成失败'
        }
      };
    }
  }
}
