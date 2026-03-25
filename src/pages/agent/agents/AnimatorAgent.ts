/**
 * 动画师 Agent
 * 专注动画制作、视频编辑、动效设计、表情包制作
 */

import { BaseAgent, AgentResponse, ExecutionContext } from './BaseAgent';
import { AgentType } from '../types/agent';

export class AnimatorAgent extends BaseAgent {
  readonly type: AgentType = 'animator';
  readonly name = '津脉动画师';
  readonly description = '专注动效设计、视频制作和表情包创作';

  /**
   * 处理用户消息
   */
  async handleMessage(message: string, context: ExecutionContext): Promise<AgentResponse> {
    return this.handleMessageWithErrorHandling(async () => {
      // 默认响应
      return this.handleDefault(message);
    });
  }

  /**
   * 默认处理
   */
  private handleDefault(message: string): AgentResponse {
    return this.createTextResponse(
      `你好！我是津脉动画师，专注于：\n\n• 动画制作（2D/3D/动态图形）\n• 视频编辑与后期\n• 动效设计\n• 表情包创作\n\n请告诉我您需要什么样的动画服务？`
    );
  }
}
