/**
 * 品牌设计师 Agent
 * 专注视觉设计和图像生成
 */

import { BaseAgent, AgentResponse, ExecutionContext } from './BaseAgent';
import { AgentType } from '../types/agent';

export class DesignerAgent extends BaseAgent {
  readonly type: AgentType = 'designer';
  readonly name = '津脉品牌设计师';
  readonly description = '专注视觉设计和图像生成，擅长品牌视觉、海报设计、包装设计等';

  /**
   * 处理用户消息
   */
  async handleMessage(message: string, context: ExecutionContext): Promise<AgentResponse> {
    return this.handleMessageWithErrorHandling(async () => {
      // 默认响应 - 快速生成逻辑已移至 orchestrator
      return this.createTextResponse(
        '我是品牌设计师，擅长视觉设计和图像生成。请告诉我您需要设计什么，比如海报、Logo、包装设计等。'
      );
    });
  }
}
