/**
 * 文案策划 Agent
 * 专注品牌文案、标语创作、故事编写
 */

import { BaseAgent, AgentResponse, ExecutionContext } from './BaseAgent';
import { AgentType } from '../types/agent';

export class CopywriterAgent extends BaseAgent {
  readonly type: AgentType = 'copywriter';
  readonly name = '津脉文案策划';
  readonly description = '专注品牌文案、标语创作和内容策划';

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
      `你好！我是津脉文案策划，专注于：\n\n• 品牌文案与定位\n• 标语口号创作\n• 品牌故事编写\n• 内容营销策划\n\n请告诉我您需要什么样的文案服务？`
    );
  }
}
