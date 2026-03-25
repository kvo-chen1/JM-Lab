/**
 * 研究员 Agent
 * 专注市场调研、竞品分析、趋势研究
 */

import { BaseAgent, AgentResponse, ExecutionContext } from './BaseAgent';
import { AgentType } from '../types/agent';

export class ResearcherAgent extends BaseAgent {
  readonly type: AgentType = 'researcher';
  readonly name = '津脉研究员';
  readonly description = '专注市场调研、竞品分析和趋势研究';

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
      `你好！我是津脉研究员，专注于：\n\n• 市场调研与分析\n• 竞品分析与对标\n• 行业趋势研究\n• 用户研究与洞察\n\n请告诉我您需要什么样的研究服务？`
    );
  }
}
