/**
 * 插画师 Agent
 * 擅长手绘风格、角色设计、概念插画
 */

import { BaseAgent, AgentResponse, ExecutionContext } from './BaseAgent';
import { AgentType } from '../types/agent';

export class IllustratorAgent extends BaseAgent {
  readonly type: AgentType = 'illustrator';
  readonly name = '津脉插画师';
  readonly description = '擅长手绘风格、角色设计和概念插画创作';

  /**
   * 处理用户消息
   */
  async handleMessage(message: string, context: ExecutionContext): Promise<AgentResponse> {
    return this.handleMessageWithErrorHandling(async () => {
      // 默认响应 - 快速生成逻辑已移至 orchestrator
      return this.createTextResponse(
        `你好！我是津脉插画师，擅长：\n\n• 角色设计与IP形象创作\n• 手绘风格插画\n• 概念艺术设计\n• 草图绘制\n\n请告诉我您想要创作什么类型的作品？`
      );
    });
  }
}
