/**
 * 上下文管理器
 * 解决Token超限问题，智能管理对话上下文
 */

import { AgentMessage } from '../types/agent';

// 上下文配置
export interface ContextConfig {
  maxTokens: number;           // 最大Token数
  reserveTokens: number;       // 为回复预留的Token数
  summaryThreshold: number;    // 触发摘要的Token阈值
  maxMessages: number;         // 最大消息数
}

// Token估算结果
export interface TokenEstimate {
  total: number;
  byMessage: Map<string, number>;
}

// 上下文优化结果
export interface OptimizedContext {
  messages: AgentMessage[];
  summary?: string;
  removedCount: number;
  totalTokens: number;
}

// 默认配置
const DEFAULT_CONFIG: ContextConfig = {
  maxTokens: 3500,        // 留500给回复
  reserveTokens: 500,
  summaryThreshold: 2000,
  maxMessages: 50
};

/**
 * 上下文管理器
 */
export class ContextManager {
  private config: ContextConfig;

  constructor(config?: Partial<ContextConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 估算文本的Token数量
   * 使用粗略估计：中文字符约1.5个token，英文单词约1个token
   */
  estimateTokens(text: string): number {
    // 确保 text 是字符串
    if (typeof text !== 'string') {
      console.warn('[ContextManager] estimateTokens 收到非字符串:', typeof text, text);
      return 0;
    }
    const safeText = text || '';
    if (!safeText) return 0;
    
    // 统计中文字符
    const chineseChars = (safeText.match(/[\u4e00-\u9fa5]/g) || []).length;
    
    // 统计英文单词（包括数字）
    const englishWords = safeText.split(/\s+/).filter(w => w.length > 0).length;
    
    // 统计标点符号
    const punctuations = (safeText.match(/[，。！？；：""''（）【】《》、,.!?;:'"()[\]{}]/g) || []).length;
    
    // 粗略估算
    return Math.ceil(chineseChars * 1.5 + englishWords * 1.2 + punctuations * 0.5);
  }

  /**
   * 估算消息的Token数量
   */
  estimateMessageTokens(message: AgentMessage): number {
    // 基础开销（角色标记等）
    const baseTokens = 4;
    // 内容Token - 确保 content 是字符串
    const content = typeof message.content === 'string' ? message.content : '';
    const contentTokens = this.estimateTokens(content);
    // 元数据Token（如果有）
    const metadataTokens = message.metadata ? this.estimateTokens(JSON.stringify(message.metadata)) : 0;
    
    return baseTokens + contentTokens + metadataTokens;
  }

  /**
   * 估算整个上下文的Token数量
   */
  estimateContextTokens(messages: AgentMessage[]): TokenEstimate {
    const byMessage = new Map<string, number>();
    let total = 0;

    for (const message of messages) {
      const tokens = this.estimateMessageTokens(message);
      byMessage.set(message.id || '', tokens);
      total += tokens;
    }

    return { total, byMessage };
  }

  /**
   * 优化上下文
   * 当Token数超过限制时，智能截断或摘要
   */
  optimizeContext(messages: AgentMessage[]): OptimizedContext {
    // 如果消息数超过限制，先截断
    if (messages.length > this.config.maxMessages) {
      messages = messages.slice(-this.config.maxMessages);
    }

    const estimate = this.estimateContextTokens(messages);
    
    // 如果Token数在限制内，直接返回
    if (estimate.total <= this.config.maxTokens) {
      return {
        messages,
        removedCount: 0,
        totalTokens: estimate.total
      };
    }

    // 需要优化
    return this.performOptimization(messages, estimate);
  }

  /**
   * 执行优化
   */
  private performOptimization(
    messages: AgentMessage[],
    estimate: TokenEstimate
  ): OptimizedContext {
    const availableTokens = this.config.maxTokens;
    let currentTokens = estimate.total;
    const optimized: AgentMessage[] = [];
    let removedCount = 0;
    let summary: string | undefined;

    // 策略1：保留系统消息和最近的用户消息
    const systemMessages = messages.filter(m => m.role === 'system');
    const nonSystemMessages = messages.filter(m => m.role !== 'system');

    // 计算系统消息占用的Token
    let systemTokens = 0;
    for (const msg of systemMessages) {
      systemTokens += estimate.byMessage.get(msg.id || '') || 0;
    }

    // 保留系统消息
    optimized.push(...systemMessages);
    currentTokens = systemTokens;

    // 从后向前遍历非系统消息，保留最近的直到Token限制
    const recentMessages: AgentMessage[] = [];
    for (let i = nonSystemMessages.length - 1; i >= 0; i--) {
      const msg = nonSystemMessages[i];
      const msgTokens = estimate.byMessage.get(msg.id || '') || 0;

      if (currentTokens + msgTokens <= availableTokens) {
        recentMessages.unshift(msg);
        currentTokens += msgTokens;
      } else {
        removedCount++;
        
        // 如果这是第一条被移除的消息，生成摘要
        if (!summary && i >= 0) {
          const removedMessages = nonSystemMessages.slice(0, i + 1);
          summary = this.generateSummary(removedMessages);
          
          // 添加摘要消息
          if (summary) {
            const summaryTokens = this.estimateTokens(summary);
            if (currentTokens + summaryTokens <= availableTokens) {
              const summaryMessage: AgentMessage = {
                id: `summary-${Date.now()}`,
                role: 'system',
                content: `[历史对话摘要] ${summary}`,
                timestamp: Date.now(),
                type: 'text'
              };
              optimized.splice(systemMessages.length, 0, summaryMessage);
              currentTokens += summaryTokens;
            }
          }
        }
      }
    }

    // 添加保留的最近消息
    optimized.push(...recentMessages);

    return {
      messages: optimized,
      summary,
      removedCount,
      totalTokens: currentTokens
    };
  }

  /**
   * 生成摘要
   */
  private generateSummary(messages: AgentMessage[]): string {
    if (messages.length === 0) return '';

    // 提取关键信息
    const topics: string[] = [];
    const userRequests: string[] = [];
    const assistantResponses: string[] = [];

    for (const msg of messages) {
      if (msg.role === 'user') {
        // 提取用户请求的前20个字符
        const preview = msg.content.slice(0, 20) + (msg.content.length > 20 ? '...' : '');
        userRequests.push(preview);
      } else if (msg.role !== 'system') {
        // 提取Agent回复的前30个字符（非用户、非系统消息视为Agent回复）
        const preview = msg.content.slice(0, 30) + (msg.content.length > 30 ? '...' : '');
        assistantResponses.push(preview);
      }
    }

    // 生成简洁摘要
    const parts: string[] = [];
    
    if (userRequests.length > 0) {
      parts.push(`用户讨论了: ${userRequests.slice(-2).join('、')}`);
    }
    
    if (assistantResponses.length > 0) {
      parts.push(`助手提供了关于${assistantResponses.slice(-1)[0]?.slice(0, 15)}...的建议`);
    }

    return parts.join('；');
  }

  /**
   * 智能截断长消息
   */
  truncateLongMessage(message: AgentMessage, maxLength: number = 1000): AgentMessage {
    const tokens = this.estimateTokens(message.content);
    
    if (tokens <= maxLength) {
      return message;
    }

    // 截断内容
    const truncated = message.content.slice(0, maxLength * 2); // 粗略估计
    
    return {
      ...message,
      content: truncated + '... [内容已截断]'
    };
  }

  /**
   * 添加上下文标记
   */
  addContextMarkers(messages: AgentMessage[]): AgentMessage[] {
    if (messages.length === 0) return messages;

    const marked: AgentMessage[] = [];
    let hasStartMarker = false;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      
      // 在第一条非系统消息前添加开始标记
      if (!hasStartMarker && msg.role !== 'system') {
        marked.push({
          id: `marker-start-${Date.now()}`,
          role: 'system',
          content: '[对话开始]',
          timestamp: Date.now(),
          type: 'text'
        });
        hasStartMarker = true;
      }

      marked.push(msg);
    }

    return marked;
  }

  /**
   * 获取上下文统计
   */
  getContextStats(messages: AgentMessage[]): {
    messageCount: number;
    totalTokens: number;
    userMessages: number;
    assistantMessages: number;
    systemMessages: number;
  } {
    const estimate = this.estimateContextTokens(messages);
    
    return {
      messageCount: messages.length,
      totalTokens: estimate.total,
      userMessages: messages.filter(m => m.role === 'user').length,
      assistantMessages: messages.filter(m => m.role !== 'system').length,
      systemMessages: messages.filter(m => m.role === 'system').length
    };
  }

  /**
   * 检查是否需要优化
   */
  needsOptimization(messages: AgentMessage[]): boolean {
    if (messages.length > this.config.maxMessages) return true;
    
    const estimate = this.estimateContextTokens(messages);
    return estimate.total > this.config.maxTokens;
  }

  /**
   * 获取优化建议
   */
  getOptimizationSuggestion(messages: AgentMessage[]): string {
    const stats = this.getContextStats(messages);
    const estimate = this.estimateContextTokens(messages);

    if (estimate.total > this.config.maxTokens) {
      const excess = estimate.total - this.config.maxTokens;
      return `上下文Token数(${estimate.total})超过限制(${this.config.maxTokens})，超出${excess}个Token，建议清理历史消息`;
    }

    if (messages.length > this.config.maxMessages) {
      return `消息数量(${messages.length})超过限制(${this.config.maxMessages})，建议清理旧消息`;
    }

    return '上下文状态良好';
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ContextConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): ContextConfig {
    return { ...this.config };
  }
}

// 导出单例
export const contextManager = new ContextManager();

// 导出便捷函数
export function optimizeContext(messages: AgentMessage[]): OptimizedContext {
  return contextManager.optimizeContext(messages);
}

export function estimateTokens(text: string): number {
  return contextManager.estimateTokens(text);
}

export function needsOptimization(messages: AgentMessage[]): boolean {
  return contextManager.needsOptimization(messages);
}
