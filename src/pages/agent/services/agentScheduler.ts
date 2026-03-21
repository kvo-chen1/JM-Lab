/**
 * Agent统一调度器
 * 整合所有服务，提供统一的Agent操作入口
 * 
 * 主要功能：
 * 1. 统一处理用户输入
 * 2. 协调任务队列和状态管理
 * 3. 网络状态感知
 * 4. 上下文优化
 * 5. 资源管理
 */

import { AgentMessage, AgentType } from '../types/agent';
import { enhancedTaskQueue, TaskCallbacks, AITask } from './enhancedTaskQueue';
import { networkMonitor, NetworkStatus } from './networkMonitor';
import { contextManager, OptimizedContext } from './contextManager';
import { AgentError, AgentErrorType, createAgentError } from './errors';
import { agentOrchestrator, ConversationContext } from './agentOrchestrator';
import { generateImage, generateVideo } from './agentService';
import { useAgentStore } from '../hooks/useAgentStore';

// 调度器配置
export interface SchedulerConfig {
  enableContextOptimization: boolean;
  enableNetworkCheck: boolean;
  defaultTimeout: number;
  maxRetries: number;
}

// 用户输入
export interface UserInput {
  content: string;
  type: 'text' | 'image';
  attachments?: Array<{
    type: string;
    url: string;
    name?: string;
  }>;
  metadata?: Record<string, any>;
}

// Agent响应
export interface AgentResponse {
  success: boolean;
  message?: AgentMessage;
  error?: AgentError;
  taskId?: string;
  metadata?: {
    optimized?: boolean;
    tokensRemoved?: number;
    networkStatus?: NetworkStatus;
    processingTime?: number;
  };
}

// 默认配置
const DEFAULT_CONFIG: SchedulerConfig = {
  enableContextOptimization: true,
  enableNetworkCheck: false, // 禁用网络检查，避免误报离线
  defaultTimeout: 30000,
  maxRetries: 2
};

/**
 * Agent统一调度器
 */
export class AgentScheduler {
  private config: SchedulerConfig;
  private isInitialized: boolean = false;
  private activeTasks: Map<string, {
    startTime: number;
    callbacks: Set<(response: AgentResponse) => void>;
  }> = new Map();

  constructor(config?: Partial<SchedulerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.init();
  }

  /**
   * 初始化调度器
   */
  private init(): void {
    if (this.isInitialized) return;

    // 注册任务执行器
    this.registerTaskExecutors();

    // 监听网络状态变化
    if (this.config.enableNetworkCheck) {
      networkMonitor.on('status-change', ({ status, previousStatus }) => {
        this.handleNetworkStatusChange(status, previousStatus);
      });
    }

    this.isInitialized = true;
    console.log('[AgentScheduler] Initialized');
  }

  /**
   * 注册任务执行器
   */
  private registerTaskExecutors(): void {
    // 文本生成执行器
    enhancedTaskQueue.registerTaskExecutor('text', async (task, signal) => {
      return this.executeTextTask(task, signal);
    });

    // 图像生成执行器
    enhancedTaskQueue.registerTaskExecutor('image', async (task, signal) => {
      return this.executeImageTask(task, signal);
    });

    // 视频生成执行器
    enhancedTaskQueue.registerTaskExecutor('video', async (task, signal) => {
      return this.executeVideoTask(task, signal);
    });
  }

  /**
   * 处理用户输入（统一入口）
   */
  async processUserInput(
    input: UserInput,
    options?: {
      agentType?: AgentType;
      callbacks?: {
        onProgress?: (progress: number) => void;
        onComplete?: (response: AgentResponse) => void;
        onError?: (error: AgentError) => void;
      };
    }
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    // 1. 检查网络状态
    if (this.config.enableNetworkCheck && networkMonitor.isOffline()) {
      const offlineResponse: AgentResponse = {
        success: false,
        error: createAgentError(
          new Error('当前处于离线状态，请检查网络连接'),
          AgentErrorType.NETWORK_ERROR
        ),
        metadata: {
          networkStatus: 'offline',
          processingTime: Date.now() - startTime
        }
      };
      options?.callbacks?.onError?.(offlineResponse.error!);
      return offlineResponse;
    }

    // 2. 获取当前Agent类型
    const store = useAgentStore.getState();
    const agentType = options?.agentType || store.currentAgent;

    // 3. 添加用户消息到状态
    store.addMessage({
      role: 'user',
      content: input.content,
      type: input.type
    });

    // 4. 优化上下文（如果需要）
    let optimizedContext: OptimizedContext | undefined;
    let messages: AgentMessage[] = [];

    if (this.config.enableContextOptimization) {
      // 从store获取所有消息
      const allMessages = this.getMessagesFromStore(store);
      optimizedContext = contextManager.optimizeContext(allMessages);
      messages = optimizedContext.messages;
    }

    // 5. 创建任务
    const taskCallbacks: TaskCallbacks = {
      onProgress: (taskId, progress) => {
        options?.callbacks?.onProgress?.(progress);
      },
      onComplete: (taskId, result) => {
        const response: AgentResponse = {
          success: true,
          message: result.message,
          taskId,
          metadata: {
            optimized: !!optimizedContext?.removedCount,
            tokensRemoved: optimizedContext?.removedCount,
            networkStatus: networkMonitor.getStatus(),
            processingTime: Date.now() - startTime
          }
        };

        // 添加助手消息到状态
        if (result.message) {
          store.addMessage(result.message);
        }

        // 清理活跃任务
        this.activeTasks.delete(taskId);

        options?.callbacks?.onComplete?.(response);
      },
      onError: (taskId, error) => {
        const response: AgentResponse = {
          success: false,
          error,
          taskId,
          metadata: {
            processingTime: Date.now() - startTime
          }
        };

        // 添加错误消息到状态
        store.addMessage({
          role: 'system',
          content: `抱歉，处理您的请求时出现了问题：${error.message}`,
          type: 'text'
        });

        // 清理活跃任务
        this.activeTasks.delete(taskId);

        options?.callbacks?.onError?.(error);
        options?.callbacks?.onComplete?.(response);
      },
      onTimeout: (taskId) => {
        const timeoutError = createAgentError(
          new Error('请求处理超时，请稍后重试'),
          AgentErrorType.TIMEOUT_ERROR,
          { taskId }
        );

        const response: AgentResponse = {
          success: false,
          error: timeoutError,
          taskId,
          metadata: {
            processingTime: Date.now() - startTime
          }
        };

        // 添加超时消息到状态
        store.addMessage({
          role: 'system',
          content: '抱歉，处理您的请求超时了。可能是网络问题或服务器繁忙，请稍后重试。',
          type: 'text'
        });

        // 清理活跃任务
        this.activeTasks.delete(taskId);

        options?.callbacks?.onError?.(timeoutError);
        options?.callbacks?.onComplete?.(response);
      }
    };

    // 6. 添加到任务队列
    const task = enhancedTaskQueue.addTask('text', input.content, {
      priority: 'high',
      metadata: {
        agentType,
        messages
      },
      callbacks: taskCallbacks
    });

    // 记录活跃任务
    this.activeTasks.set(task.id, {
      startTime,
      callbacks: new Set()
    });

    // 7. 返回初始响应（任务已创建）
    return {
      success: true,
      taskId: task.id,
      metadata: {
        optimized: !!optimizedContext?.removedCount,
        tokensRemoved: optimizedContext?.removedCount,
        networkStatus: networkMonitor.getStatus()
      }
    };
  }

  /**
   * 从store获取消息列表
   */
  private getMessagesFromStore(store: any): AgentMessage[] {
    // 尝试从store获取消息
    if (store.messages && Array.isArray(store.messages)) {
      return store.messages;
    }
    return [];
  }

  /**
   * 执行文本任务
   */
  private async executeTextTask(task: AITask, signal: AbortSignal): Promise<any> {
    const { agentType, messages } = task.metadata || {};

    // 构建对话上下文
    const context: ConversationContext = {
      currentAgent: agentType || 'director',
      messages: messages || [],
      delegationHistory: []
    };

    // 调用Agent编排器处理
    const response = await agentOrchestrator.processUserInput(
      task.prompt,
      context
    );

    // 检查是否被取消
    if (signal.aborted) {
      throw new Error('Task was cancelled');
    }

    return {
      message: {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        type: 'text',
        agentType
      }
    };
  }

  /**
   * 执行图像任务
   */
  private async executeImageTask(task: AITask, signal: AbortSignal): Promise<any> {
    const results = await generateImage(
      task.prompt,
      task.metadata?.style,
      {
        width: task.metadata?.size?.width,
        height: task.metadata?.size?.height
      }
    );

    if (signal.aborted) {
      throw new Error('Task was cancelled');
    }

    // 返回第一个结果
    const result = results[0];
    return {
      content: {
        type: 'image',
        url: result.url,
        metadata: { style: result.style }
      }
    };
  }

  /**
   * 执行视频任务
   */
  private async executeVideoTask(task: AITask, signal: AbortSignal): Promise<any> {
    const result = await generateVideo(
      task.prompt,
      {
        imageUrl: task.metadata?.imageUrl,
        duration: task.metadata?.duration
      }
    );

    if (signal.aborted) {
      throw new Error('Task was cancelled');
    }

    return {
      content: {
        type: 'video',
        url: result.url,
        metadata: { style: result.style }
      }
    };
  }

  /**
   * 处理网络状态变化
   */
  private handleNetworkStatusChange(
    status: NetworkStatus,
    previousStatus: NetworkStatus
  ): void {
    console.log(`[AgentScheduler] Network status: ${previousStatus} -> ${status}`);

    const store = useAgentStore.getState();

    switch (status) {
      case 'offline':
        // 网络断开，添加提示消息
        store.addMessage({
          role: 'system',
          content: '⚠️ 网络连接已断开，请检查网络设置。恢复后将自动重试未完成的请求。',
          type: 'text'
        });
        break;

      case 'online':
        // 网络恢复
        if (previousStatus === 'offline') {
          store.addMessage({
            role: 'system',
            content: '✅ 网络连接已恢复',
            type: 'text'
          });
        }
        break;

      case 'degraded':
        // 网络质量差
        store.addMessage({
          role: 'system',
          content: '⚠️ 网络质量较差，响应可能会变慢',
          type: 'text'
        });
        break;
    }
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): boolean {
    return enhancedTaskQueue.cancelTask(taskId);
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): string | undefined {
    return enhancedTaskQueue.getTaskStatus(taskId);
  }

  /**
   * 获取活跃任务列表
   */
  getActiveTasks(): Array<{ taskId: string; startTime: number }> {
    return Array.from(this.activeTasks.entries()).map(([taskId, info]) => ({
      taskId,
      startTime: info.startTime
    }));
  }

  /**
   * 获取调度器统计
   */
  getStats() {
    const queueStats = enhancedTaskQueue.getStats();
    return {
      ...queueStats,
      activeTasks: this.activeTasks.size,
      networkStatus: networkMonitor.getStatus()
    };
  }

  /**
   * 清空所有任务
   */
  clearAllTasks(): void {
    enhancedTaskQueue.clearQueue();
    this.activeTasks.clear();
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 销毁调度器
   */
  destroy(): void {
    this.clearAllTasks();
    networkMonitor.destroy();
    this.isInitialized = false;
  }
}

// 导出单例
export const agentScheduler = new AgentScheduler();

// 导出便捷函数
export async function sendMessage(
  content: string,
  options?: {
    agentType?: AgentType;
    onProgress?: (progress: number) => void;
  }
): Promise<AgentResponse> {
  return agentScheduler.processUserInput(
    { content, type: 'text' },
    {
      agentType: options?.agentType,
      callbacks: {
        onProgress: options?.onProgress
      }
    }
  );
}

export function cancelTask(taskId: string): boolean {
  return agentScheduler.cancelTask(taskId);
}

export function getSchedulerStats() {
  return agentScheduler.getStats();
}
