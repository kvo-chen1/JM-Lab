/**
 * 上下文管理器 - 兼容层
 * 已迁移到 smartContextCompressor.ts 和 dialogStateTracker.ts
 * 此文件保留以维持向后兼容
 */

import { AgentMessage } from '../types/agent';
import {
  getSmartContextCompressor
} from './smartContextCompressor';

// 上下文配置
export interface ContextConfig {
  maxTokens: number;
  reserveTokens: number;
  summaryThreshold: number;
  maxMessages: number;
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
  maxTokens: 3500,
  reserveTokens: 500,
  summaryThreshold: 2000,
  maxMessages: 50
};

/**
 * 上下文管理器（兼容层）
 */
export class ContextManager {
  private compressor = getSmartContextCompressor();
  private config: ContextConfig;

  constructor(config?: Partial<ContextConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 估算文本的Token数量
   */
  estimateTokens(text: string): number {
    if (typeof text !== 'string') {
      console.warn('[ContextManager] estimateTokens 收到非字符串:', typeof text, text);
      return 0;
    }
    const safeText = text || '';
    if (!safeText) return 0;
    
    const chineseChars = (safeText.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = safeText.split(/\s+/).filter(w => w.length > 0).length;
    const punctuations = (safeText.match(/[，。！？；：""''（）【】《》、,.!?;:'"()[\]{}]/g) || []).length;
    
    return Math.ceil(chineseChars * 1.5 + englishWords * 1.2 + punctuations * 0.5);
  }

  /**
   * 估算消息的Token数量
   */
  estimateMessageTokens(message: AgentMessage): number {
    const baseTokens = 4;
    const content = typeof message.content === 'string' ? message.content : '';
    const contentTokens = this.estimateTokens(content);
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

    // 使用新的智能压缩器
    const compressionResult = this.compressor.compressContext(
      messages,
      this.config.maxTokens,
      {
        preserveSystemMessages: true,
        preserveRecentMessages: 6,
        generateSummary: true
      }
    );

    return {
      messages: compressionResult.compressedMessages,
      summary: compressionResult.summary,
      removedCount: compressionResult.stats?.removedCount || 0,
      totalTokens: compressionResult.estimatedTokens
    };
  }

  /**
   * 智能截断长消息
   */
  truncateLongMessage(message: AgentMessage, maxLength: number = 1000): AgentMessage {
    const tokens = this.estimateTokens(message.content);
    
    if (tokens <= maxLength) {
      return message;
    }

    const truncated = message.content.slice(0, maxLength * 2);
    
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
      assistantMessages: messages.filter(m => m.role === 'assistant').length,
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
