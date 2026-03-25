/**
 * 插画师 Agent
 * 擅长手绘风格、角色设计、概念插画
 */

import { BaseAgent, AgentResponse, ExecutionContext } from './BaseAgent';
import { AgentType } from '../types/agent';
import { llmService } from '@/services/llmService';

export class IllustratorAgent extends BaseAgent {
  readonly type: AgentType = 'illustrator';
  readonly name = '津脉插画师';
  readonly description = '擅长手绘风格、角色设计和概念插画创作';

  /**
   * 处理用户消息
   */
  async handleMessage(message: string, context: ExecutionContext): Promise<AgentResponse> {
    return this.handleMessageWithErrorHandling(async () => {
      // 使用基类的上下文引用处理方法
      const contextResponse = await this.handleContextReference(
        message,
        context,
        (msg, ctx) => this.handleQuickGeneration(msg, ctx)
      );
      if (contextResponse) {
        return contextResponse;
      }

      // 检查是否是快速生成请求
      if (this.isQuickGenerationRequest(message)) {
        return this.handleQuickGeneration(message, context);
      }

      // 默认响应
      return this.handleDefault(message);
    });
  }

  /**
   * 快速生成处理 - 调用实际的图像生成服务
   */
  protected async handleQuickGeneration(
    message: string,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    console.log('[IllustratorAgent] 快速生成模式:', message);

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
        content: `✨ 我为您创作了以下插画作品：\n\n这些插画基于您的描述："${message}"`,
        type: 'text',
        metadata: {
          quickGeneration: true,
          prompt: message,
          generatedAt: Date.now(),
          images: images
        }
      };
    } catch (error) {
      console.error('[IllustratorAgent] 图像生成失败:', error);

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
        content: `✨ 我为您准备了以下插画参考（演示模式）：\n\n基于您的描述："${message}"\n\n*注：由于图像生成服务暂时不可用，显示的是参考图片。*`,
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

  /**
   * 默认处理
   */
  private handleDefault(message: string): AgentResponse {
    return this.createTextResponse(
      `你好！我是津脉插画师，擅长：\n\n• 角色设计与IP形象创作\n• 手绘风格插画\n• 概念艺术设计\n• 草图绘制\n\n请告诉我您想要创作什么类型的作品？`
    );
  }
}
