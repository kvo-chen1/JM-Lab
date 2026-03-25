/**
 * 设计总监 Agent
 * 统筹全局，负责需求分析和任务分配
 */

import { BaseAgent, AgentResponse, ExecutionContext } from './BaseAgent';
import { AgentType } from '../types/agent';

export class DirectorAgent extends BaseAgent {
  readonly type: AgentType = 'director';
  readonly name = '津脉设计总监';
  readonly description = '统筹全局，负责需求分析、任务分配和项目质量把控';

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

      // 问候语处理
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('你好') || lowerMsg.includes('您好') || lowerMsg.includes('hello')) {
        return this.handleGreeting();
      }

      // 默认响应
      return this.handleDefault(message);
    });
  }

  /**
   * 快速生成处理 - 分析设计类型并委派给合适的 Agent
   */
  protected async handleQuickGeneration(
    message: string,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    console.log('[DirectorAgent] 快速生成请求:', message);

    const designType = this.analyzeDesignType(message);
    const targetAgent = this.selectAgentForDesignType(designType);

    return {
      content: `收到！您想要做${designType}设计。为了确保设计效果，我需要先了解一些关键信息：\n\n**目标受众是谁？**\n比如：年轻人、儿童、商务人士、家庭用户等\n\n**风格偏好？**\n比如：简约现代、复古传统、可爱活泼、专业稳重等`,
      type: 'text',
      metadata: {
        delegation: targetAgent,
        designType,
        originalRequest: message
      }
    };
  }

  /**
   * 分析设计类型
   */
  private analyzeDesignType(message: string): string {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('ip') || lowerMsg.includes('形象') || lowerMsg.includes('角色')) {
      return 'IP形象';
    }
    if (lowerMsg.includes('品牌') || lowerMsg.includes('logo') || lowerMsg.includes('vi')) {
      return '品牌';
    }
    if (lowerMsg.includes('包装') || lowerMsg.includes('礼盒')) {
      return '包装';
    }
    if (lowerMsg.includes('海报') || lowerMsg.includes('宣传')) {
      return '海报';
    }
    if (lowerMsg.includes('插画') || lowerMsg.includes('手绘')) {
      return '插画';
    }
    if (lowerMsg.includes('动画') || lowerMsg.includes('视频')) {
      return '动画视频';
    }

    return '品牌/IP';
  }

  /**
   * 根据设计类型选择 Agent
   */
  private selectAgentForDesignType(designType: string): AgentType {
    switch (designType) {
      case 'IP形象':
      case '插画':
        return 'illustrator';
      case '动画视频':
        return 'animator';
      case '品牌':
      case '包装':
      case '海报':
      default:
        return 'designer';
    }
  }

  /**
   * 处理问候
   */
  private handleGreeting(): AgentResponse {
    return this.createTextResponse(
      `您好！欢迎来到津脉设计～\n\n我是津脉设计总监，专注于将您的创意转化为惊艳的视觉作品。无论是品牌形象、包装设计还是创意海报，我都能为您提供专业的设计服务。\n\n今天想创作什么内容呢？`,
      { type: 'greeting' }
    );
  }

  /**
   * 默认处理
   */
  private handleDefault(message: string): AgentResponse {
    return this.createTextResponse(
      `我理解您的需求。作为设计总监，我可以：\n\n• 分析您的设计需求\n• 制定项目计划\n• 协调团队成员\n• 把控设计质量\n\n请告诉我更多关于您的项目信息。`
    );
  }
}
