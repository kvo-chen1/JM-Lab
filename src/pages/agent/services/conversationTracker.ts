import { AgentMessage } from '../types/agent';
import { llmService } from '@/services/llmService';

// 对话主题跟踪器
export class ConversationTracker {
  private messages: AgentMessage[] = [];
  private currentTopic: string = '';
  private topicSummary: string = '';
  private messageCountSinceSummary: number = 0;
  private readonly SUMMARY_INTERVAL = 5; // 每5条消息总结一次

  // 添加消息到跟踪器
  addMessage(message: AgentMessage) {
    this.messages.push(message);
    this.messageCountSinceSummary++;

    // 检查是否需要自动总结
    if (this.messageCountSinceSummary >= this.SUMMARY_INTERVAL) {
      this.autoSummarizeTopic();
    }
  }

  // 获取当前主题
  getCurrentTopic(): string {
    return this.currentTopic;
  }

  // 获取主题摘要
  getTopicSummary(): string {
    return this.topicSummary;
  }

  // 获取最近的消息
  getRecentMessages(count: number = 10): AgentMessage[] {
    return this.messages.slice(-count);
  }

  // 自动总结当前主题
  private async autoSummarizeTopic() {
    if (this.messages.length < 3) return;

    try {
      const recentMessages = this.getRecentMessages(this.SUMMARY_INTERVAL);
      const conversationText = recentMessages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      const prompt = `请总结以下对话的核心主题和当前进展：

${conversationText}

请用简洁的语言总结：
1. 当前讨论的主题是什么？
2. 目前的进展如何？
3. 下一步应该做什么？

格式：
主题：XXX
进展：XXX
下一步：XXX`;

      const response = await llmService.generateResponse(prompt, {
        priority: 'low'
      });

      this.topicSummary = response;
      this.messageCountSinceSummary = 0;

      // 提取主题
      const topicMatch = response.match(/主题[：:]\s*(.+)/);
      if (topicMatch) {
        this.currentTopic = topicMatch[1].trim();
      }

      console.log('[ConversationTracker] 主题总结完成:', this.currentTopic);
    } catch (error) {
      console.error('[ConversationTracker] 主题总结失败:', error);
    }
  }

  // 手动总结主题
  async summarizeTopic(): Promise<string> {
    await this.autoSummarizeTopic();
    return this.topicSummary;
  }

  // 检查是否偏离主题
  async checkTopicDeviation(newMessage: string): Promise<{ isDeviated: boolean; deviationReason: string }> {
    if (!this.currentTopic || this.messages.length < 5) {
      return { isDeviated: false, deviationReason: '' };
    }

    try {
      const prompt = `请判断以下新消息是否偏离了当前讨论的主题。

当前主题：${this.currentTopic}
主题摘要：${this.topicSummary}

新消息：${newMessage}

请分析：
1. 这条消息是否与当前主题相关？
2. 如果偏离，偏离的原因是什么？

格式：
是否偏离：是/否
原因：简要说明`;

      const response = await llmService.generateResponse(prompt, {
        priority: 'low'
      });

      const isDeviated = response.includes('是否偏离：是') || response.includes('偏离：是');
      const reasonMatch = response.match(/原因[：:]\s*(.+)/);
      const deviationReason = reasonMatch ? reasonMatch[1].trim() : '';

      return { isDeviated, deviationReason };
    } catch (error) {
      console.error('[ConversationTracker] 偏离检测失败:', error);
      return { isDeviated: false, deviationReason: '' };
    }
  }

  // 重置跟踪器
  reset() {
    this.messages = [];
    this.currentTopic = '';
    this.topicSummary = '';
    this.messageCountSinceSummary = 0;
  }

  // 获取对话统计
  getStats() {
    return {
      totalMessages: this.messages.length,
      currentTopic: this.currentTopic,
      messageCountSinceSummary: this.messageCountSinceSummary
    };
  }
}

// 单例模式
let conversationTracker: ConversationTracker | null = null;

export function getConversationTracker(): ConversationTracker {
  if (!conversationTracker) {
    conversationTracker = new ConversationTracker();
  }
  return conversationTracker;
}

export function resetConversationTracker() {
  conversationTracker = null;
}
