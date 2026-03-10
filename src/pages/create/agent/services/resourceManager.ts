/**
 * 资源管理器
 * 管理内存、存储等资源，防止内存泄漏
 */

import { useAgentStore } from '../hooks/useAgentStore';
import { getMemoryService } from './memoryService';

// 资源限制配置
export interface ResourceLimits {
  maxMessages: number;
  maxBehaviorRecords: number;
  maxCachedResponses: number;
  maxGeneratedContent: number;
  maxTasks: number;
  cleanupIntervalMs: number;
}

// 资源使用情况
export interface ResourceUsage {
  messages: number;
  behaviorRecords: number;
  cachedResponses: number;
  generatedContent: number;
  tasks: number;
  memoryEstimate: number; // 估算内存使用（MB）
}

// 默认配置
const DEFAULT_LIMITS: ResourceLimits = {
  maxMessages: 100,
  maxBehaviorRecords: 500,
  maxCachedResponses: 50,
  maxGeneratedContent: 20,
  maxTasks: 100,
  cleanupIntervalMs: 60000 // 1分钟
};

/**
 * 资源管理器
 */
export class ResourceManager {
  private limits: ResourceLimits;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(limits?: Partial<ResourceLimits>) {
    this.limits = { ...DEFAULT_LIMITS, ...limits };
  }

  /**
   * 启动资源管理
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.limits.cleanupIntervalMs);

    console.log('[ResourceManager] Started');
  }

  /**
   * 停止资源管理
   */
  stop(): void {
    if (!this.isRunning) return;

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.isRunning = false;
    console.log('[ResourceManager] Stopped');
  }

  /**
   * 执行清理
   */
  private performCleanup(): void {
    try {
      this.cleanupMessages();
      this.cleanupBehaviorRecords();
      this.cleanupCachedResponses();
      this.cleanupGeneratedContent();
      this.cleanupTasks();
    } catch (error) {
      console.error('[ResourceManager] Cleanup error:', error);
    }
  }

  /**
   * 清理消息
   */
  private cleanupMessages(): void {
    const store = useAgentStore.getState();
    const messages = store.messages;

    if (messages.length <= this.limits.maxMessages) return;

    // 保留最近的消息
    const toKeep = messages.slice(-this.limits.maxMessages);
    const removed = messages.length - toKeep.length;

    // 归档旧消息（可选）
    const toArchive = messages.slice(0, removed);
    this.archiveMessages(toArchive);

    // 更新状态
    store.setMessages(toKeep);

    console.log(`[ResourceManager] Cleaned up ${removed} old messages`);
  }

  /**
   * 归档消息
   */
  private archiveMessages(messages: any[]): void {
    // 可以保存到IndexedDB或发送到服务器
    try {
      const archived = JSON.parse(localStorage.getItem('archived_messages') || '[]');
      archived.push({
        timestamp: Date.now(),
        messages: messages
      });
      
      // 只保留最近10次归档
      if (archived.length > 10) {
        archived.shift();
      }
      
      localStorage.setItem('archived_messages', JSON.stringify(archived));
    } catch (error) {
      console.warn('[ResourceManager] Failed to archive messages:', error);
    }
  }

  /**
   * 清理行为记录
   */
  private cleanupBehaviorRecords(): void {
    const memoryService = getMemoryService();
    const records = memoryService.getBehaviorRecords();
    
    if (records.length <= this.limits.maxBehaviorRecords) return;

    // 保留最近的行为记录
    const toKeep = records.slice(-this.limits.maxBehaviorRecords);
    
    // 更新内存服务
    memoryService.setBehaviorRecords(toKeep);

    console.log(`[ResourceManager] Cleaned up ${records.length - toKeep.length} behavior records`);
  }

  /**
   * 清理缓存的响应
   */
  private cleanupCachedResponses(): void {
    // 清理LLM服务的缓存
    const cacheKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('llm_cache_')
    );

    if (cacheKeys.length <= this.limits.maxCachedResponses) return;

    // 按时间排序，删除最旧的
    const sortedKeys = cacheKeys
      .map(key => ({
        key,
        timestamp: parseInt(localStorage.getItem(`${key}_timestamp`) || '0')
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    const toDelete = sortedKeys.slice(0, sortedKeys.length - this.limits.maxCachedResponses);
    
    toDelete.forEach(({ key }) => {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_timestamp`);
    });

    console.log(`[ResourceManager] Cleaned up ${toDelete.length} cached responses`);
  }

  /**
   * 清理生成的内容
   */
  private cleanupGeneratedContent(): void {
    const store = useAgentStore.getState();
    const content = store.generatedOutputs;

    if (!content || content.length <= this.limits.maxGeneratedContent) return;

    // 保留最近的内容
    const toKeep = content.slice(-this.limits.maxGeneratedContent);
    store.setGeneratedContent(toKeep);

    console.log(`[ResourceManager] Cleaned up ${content.length - toKeep.length} generated content items`);
  }

  /**
   * 清理任务记录
   */
  private cleanupTasks(): void {
    // 当前store中没有tasks数组，只有currentTask
    // 如果需要清理任务历史，需要添加相应的数据结构
    // 暂时跳过
  }

  /**
   * 获取资源使用情况
   */
  getUsage(): ResourceUsage {
    const store = useAgentStore.getState();
    const messages = store.messages || [];
    const generatedOutputs = store.generatedOutputs || [];

    // 估算内存使用（粗略估计）
    const messageSize = JSON.stringify(messages).length * 2; // UTF-16
    const contentSize = JSON.stringify(generatedOutputs).length * 2;
    const memoryEstimate = Math.round((messageSize + contentSize) / 1024 / 1024 * 100) / 100;

    const memoryService = getMemoryService();
    
    return {
      messages: messages.length,
      behaviorRecords: memoryService.getBehaviorRecords().length,
      cachedResponses: Object.keys(localStorage).filter(k => k.startsWith('llm_cache_')).length,
      generatedContent: generatedOutputs.length,
      tasks: 0, // 当前store中没有tasks数组
      memoryEstimate
    };
  }

  /**
   * 检查资源是否超限
   */
  isOverLimit(): boolean {
    const usage = this.getUsage();
    return (
      usage.messages > this.limits.maxMessages ||
      usage.behaviorRecords > this.limits.maxBehaviorRecords ||
      usage.cachedResponses > this.limits.maxCachedResponses ||
      usage.generatedContent > this.limits.maxGeneratedContent ||
      usage.tasks > this.limits.maxTasks
    );
  }

  /**
   * 获取资源警告
   */
  getWarnings(): string[] {
    const usage = this.getUsage();
    const warnings: string[] = [];

    if (usage.messages > this.limits.maxMessages * 0.9) {
      warnings.push(`消息数量接近上限 (${usage.messages}/${this.limits.maxMessages})`);
    }
    if (usage.behaviorRecords > this.limits.maxBehaviorRecords * 0.9) {
      warnings.push(`行为记录接近上限 (${usage.behaviorRecords}/${this.limits.maxBehaviorRecords})`);
    }
    if (usage.memoryEstimate > 50) {
      warnings.push(`内存使用较高 (${usage.memoryEstimate}MB)`);
    }

    return warnings;
  }

  /**
   * 立即执行清理
   */
  forceCleanup(): void {
    this.performCleanup();
  }

  /**
   * 更新限制配置
   */
  updateLimits(limits: Partial<ResourceLimits>): void {
    this.limits = { ...this.limits, ...limits };
  }

  /**
   * 获取当前限制
   */
  getLimits(): ResourceLimits {
    return { ...this.limits };
  }

  /**
   * 销毁资源管理器
   */
  destroy(): void {
    this.stop();
  }
}

// 导出单例
export const resourceManager = new ResourceManager();

// 导出便捷函数
export function startResourceManagement(): void {
  resourceManager.start();
}

export function stopResourceManagement(): void {
  resourceManager.stop();
}

export function getResourceUsage(): ResourceUsage {
  return resourceManager.getUsage();
}

export function forceCleanup(): void {
  resourceManager.forceCleanup();
}

export function getResourceManager(): ResourceManager {
  return resourceManager;
}
