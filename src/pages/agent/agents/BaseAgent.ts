/**
 * Agent 基类
 * 所有 Agent 的基类，提供基础功能
 */

import { AgentType, AgentMessage } from '../types/agent';

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  color?: string;
}

export interface AgentResponse {
  content: string;
  type: 'text' | 'image' | 'video' | 'structured';
  metadata?: Record<string, any>;
}

export interface ExecutionContext {
  userId: string;
  sessionId: string;
  message: string;
  history: AgentMessage[];
  parameters?: Record<string, any>;
  metadata?: Record<string, any>;
}

export abstract class BaseAgent {
  abstract readonly type: AgentType;
  abstract readonly name: string;
  abstract readonly description: string;

  protected config: AgentConfig;

  constructor(config: Partial<AgentConfig> = {}) {
    // 注意：抽象属性不能在构造函数中访问
    // config 将在子类中初始化或使用 getter 访问
    this.config = {
      id: config.id || '',
      name: config.name || '',
      description: config.description || '',
      ...config
    } as AgentConfig;
  }

  /**
   * 处理用户消息
   */
  abstract handleMessage(
    message: string,
    context: ExecutionContext
  ): Promise<AgentResponse>;

  // ==================== 响应构建 ====================

  protected createTextResponse(content: string, metadata?: Record<string, any>): AgentResponse {
    return {
      content,
      type: 'text',
      metadata
    };
  }

  protected createErrorResponse(message: string): AgentResponse {
    return {
      content: `抱歉，遇到了问题：${message}`,
      type: 'text',
      metadata: { error: true }
    };
  }

  // ==================== 工具方法 ====================

  protected extractKeywords(text: string): string[] {
    const words = text.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [];
    return words.map(w => w.toLowerCase());
  }

  protected containsKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some(kw => lowerText.includes(kw.toLowerCase()));
  }

  /**
   * 检查是否是引用上下文的语句
   */
  protected isContextReference(message: string): boolean {
    const contextKeywords = [
      '上面的', '上面的继续', '继续上面',
      '刚才', '刚才的', '之前的', '前面',
      '继续', '接着', '刚才说的',
      '上面那个', '之前那个', '刚才那个',
      '咋可能', '怎么可能'
    ];

    const lowerMsg = message.toLowerCase();
    return contextKeywords.some(kw => lowerMsg.includes(kw));
  }

  /**
   * 从历史对话中提取上下文
   */
  protected extractContextFromHistory(history: any[]): string {
    if (!history || history.length === 0) {
      return '';
    }

    const recentMessages = history.slice(-6);
    const userRequests = recentMessages
      .filter((msg: any) => msg.role === 'user')
      .map((msg: any) => msg.content)
      .filter((content: string) => {
        const lowerContent = content.toLowerCase();
        return !this.isContextReference(lowerContent);
      });

    return userRequests[userRequests.length - 1] || '';
  }

  /**
   * 标准错误处理包装器
   * 提取重复的错误处理逻辑
   */
  protected async handleMessageWithErrorHandling(
    handler: () => Promise<AgentResponse>
  ): Promise<AgentResponse> {
    try {
      return await handler();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '处理失败';
      return this.createErrorResponse(errorMessage);
    }
  }

  // ==================== Getter ====================

  get agentType(): AgentType {
    return this.type;
  }

  get agentName(): string {
    return this.name;
  }

  get agentDescription(): string {
    return this.description;
  }
}
