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
   * 检查是否是快速生成请求
   */
  protected isQuickGenerationRequest(message: string): boolean {
    const lowerMsg = message.toLowerCase();

    const inquiryPatterns = [
      /(?:你|你们).*(?:能|可以|会).*(?:做什么|干什么|生成什么)/,
      /(?:你|你们).*(?:有|具备).*(?:什么|哪些).*(?:能力|技能|功能)/,
      /(?:你|你们).*(?:擅长|专长)/,
      /(?:你能|你可以).*(?:帮助|协助)/,
      /^(?:你能|你可以|我会)/,
      /(?:什么|哪些|怎么|如何).*(?:做|生成|画|设计)/,
      /(?:做|生成|画|设计).*(?:什么|哪些)/,
      /(?:能不能|会不会|可不可以).*(?:画|生成|做|设计)/,
      /(?:帮忙|帮助).*(?:想想|建议|推荐)/
    ];

    const isInquiry = inquiryPatterns.some(pattern => pattern.test(lowerMsg));
    if (isInquiry) {
      return false;
    }

    const quickKeywords = [
      '生成', '画', '画一个', '画个', '画一张', '画幅',
      '来张', '来个', '来一个', '来一幅',
      '给我画', '帮我画', '给我生成', '帮我生成',
      '设计一个', '设计个', '创建一个', '创建个',
      '做一张', '做一个', '做一幅', '做个',
      '创作', '绘制', '制作'
    ];

    const hasQuickKeyword = quickKeywords.some(kw => lowerMsg.includes(kw));
    const hasSpecificDescription = message.length >= 4;
    const complexIndicators = ['需求', '方案', '流程', '策略', '规划', '详细', '完整', '怎么做', '如何写', '如何设计'];
    const hasComplexIndicator = complexIndicators.some(ind => lowerMsg.includes(ind));
    const designTargets = ['logo', '海报', '图标', '插画', '形象', '角色', '包装', '品牌', '图形', '图', '画', '图片', '图像'];
    const hasDesignTarget = designTargets.some(target => lowerMsg.includes(target));

    return hasQuickKeyword && hasSpecificDescription && !hasComplexIndicator && hasDesignTarget;
  }

  // ==================== 通用处理方法 ====================

  /**
   * 处理上下文引用
   * 提取重复的上下文引用处理逻辑
   */
  protected async handleContextReference(
    message: string,
    context: ExecutionContext,
    onQuickGeneration: (msg: string, ctx: ExecutionContext) => Promise<AgentResponse>
  ): Promise<AgentResponse | null> {
    if (!this.isContextReference(message)) {
      return null;
    }

    console.log(`[${this.name}] 检测到上下文引用:`, message);

    const previousContext = this.extractContextFromHistory(context.history || []);

    if (!previousContext) {
      return null;
    }

    console.log(`[${this.name}] 提取到上下文:`, previousContext);

    if (this.isQuickGenerationRequest(previousContext)) {
      return onQuickGeneration(previousContext, context);
    }

    return this.createTextResponse(
      `好的，我们继续处理"${previousContext}"。`,
      {
        continuedFrom: previousContext,
        isContextContinuation: true
      }
    );
  }

  /**
   * 处理快速生成请求
   * 子类可以重写此方法以实现实际的生成功能
   */
  protected async handleQuickGeneration(
    message: string,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    console.log(`[${this.name}] 快速生成模式:`, message);

    return {
      content: `✨ 我来为您创作这个作品！\n\n请稍等，我正在生成...`,
      type: 'text',
      metadata: {
        quickGeneration: true,
        prompt: message,
        generatedAt: Date.now()
      }
    };
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
