/**
 * 增强版AI任务队列服务
 * 解决原版的卡壳和无响应问题
 * 
 * 主要改进：
 * 1. 添加任务超时机制
 * 2. 实现任务取消功能
 * 3. 添加任务进度追踪
 * 4. 优化错误处理和重试逻辑
 * 5. 添加资源限制和清理
 */

import { AgentError, AgentErrorType, createAgentError } from './errors';

// 任务状态类型
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';

// 任务优先级类型
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// 任务类型定义
export interface AITask {
  id: string;
  type: 'text' | 'image' | 'audio' | 'video' | '3d';
  prompt: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  result?: any;
  progress: number; // 0-100
  metadata?: Record<string, any>;
  abortController?: AbortController;
  timeoutId?: NodeJS.Timeout;
  retryCount: number;
}

// 任务配置
export interface TaskConfig {
  maxConcurrentTasks: number;
  defaultPriority: TaskPriority;
  retryAttempts: number;
  retryDelay: number;
  timeouts: {
    text: number;
    image: number;
    video: number;
    audio: number;
    '3d': number;
  };
}

// 任务执行器类型
export type TaskExecutor = (task: AITask, signal: AbortSignal) => Promise<any>;

// 任务事件回调
export interface TaskCallbacks {
  onProgress?: (taskId: string, progress: number, data?: any) => void;
  onComplete?: (taskId: string, result: any) => void;
  onError?: (taskId: string, error: AgentError) => void;
  onTimeout?: (taskId: string) => void;
  onCancel?: (taskId: string) => void;
}

// 默认配置
const DEFAULT_CONFIG: TaskConfig = {
  maxConcurrentTasks: 3,
  defaultPriority: 'medium',
  retryAttempts: 2,
  retryDelay: 1000,
  timeouts: {
    text: 30000,      // 30秒
    image: 300000,    // 5分钟
    video: 600000,    // 10分钟
    audio: 120000,    // 2分钟
    '3d': 300000      // 5分钟
  }
};

// 优先级权重
const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1
};

/**
 * 增强版AI任务队列服务
 */
export class EnhancedTaskQueueService {
  private queue: AITask[] = [];
  private runningTasks: Map<string, AITask> = new Map();
  private config: TaskConfig;
  private taskIdCounter: number = 0;
  private isProcessing: boolean = false;
  private taskExecutors: Map<string, TaskExecutor> = new Map();
  private callbacks: Map<string, TaskCallbacks> = new Map();
  private stats = {
    totalCreated: 0,
    totalCompleted: 0,
    totalFailed: 0,
    totalCancelled: 0,
    totalTimeout: 0
  };

  constructor(config?: Partial<TaskConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanupInterval();
  }

  /**
   * 创建任务ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${++this.taskIdCounter}`;
  }

  /**
   * 添加任务到队列
   */
  addTask(
    type: AITask['type'],
    prompt: string,
    options?: {
      priority?: TaskPriority;
      metadata?: Record<string, any>;
      callbacks?: TaskCallbacks;
    }
  ): AITask {
    const task: AITask = {
      id: this.generateTaskId(),
      type,
      prompt,
      priority: options?.priority || this.config.defaultPriority,
      status: 'pending',
      createdAt: Date.now(),
      progress: 0,
      metadata: options?.metadata,
      retryCount: 0
    };

    // 存储回调
    if (options?.callbacks) {
      this.callbacks.set(task.id, options.callbacks);
    }

    // 添加到队列
    this.queue.push(task);
    this.stats.totalCreated++;

    // 按优先级排序队列
    this.sortQueue();

    // 触发处理
    this.processQueue();

    console.log(`[TaskQueue] Task added: ${task.id}, type: ${type}, priority: ${task.priority}`);
    return task;
  }

  /**
   * 排序队列（按优先级）
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      const weightDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
      if (weightDiff !== 0) return weightDiff;
      return a.createdAt - b.createdAt; // 同优先级按时间
    });
  }

  /**
   * 处理队列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    if (this.queue.length === 0) return;
    if (this.runningTasks.size >= this.config.maxConcurrentTasks) return;

    this.isProcessing = true;

    try {
      const task = this.queue.find(t => t.status === 'pending');
      if (!task) {
        this.isProcessing = false;
        return;
      }

      // 从队列中移除
      this.queue = this.queue.filter(t => t.id !== task.id);

      // 更新状态
      task.status = 'running';
      task.startedAt = Date.now();
      task.abortController = new AbortController();

      // 添加到运行中任务
      this.runningTasks.set(task.id, task);

      // 设置超时
      this.setupTaskTimeout(task);

      // 执行任务
      this.executeTask(task);
    } finally {
      this.isProcessing = false;
      // 继续处理队列
      setTimeout(() => this.processQueue(), 0);
    }
  }

  /**
   * 设置任务超时
   */
  private setupTaskTimeout(task: AITask): void {
    const timeoutMs = this.config.timeouts[task.type] || this.config.timeouts.text;
    
    task.timeoutId = setTimeout(() => {
      this.handleTaskTimeout(task.id);
    }, timeoutMs);
  }

  /**
   * 处理任务超时
   */
  private handleTaskTimeout(taskId: string): void {
    const task = this.runningTasks.get(taskId);
    if (!task || task.status !== 'running') return;

    console.warn(`[TaskQueue] Task timeout: ${taskId}`);

    // 取消任务
    task.abortController?.abort();

    // 更新状态
    task.status = 'timeout';
    task.completedAt = Date.now();
    this.stats.totalTimeout++;

    // 从运行中移除
    this.runningTasks.delete(taskId);

    // 触发回调
    const callbacks = this.callbacks.get(taskId);
    if (callbacks?.onTimeout) {
      callbacks.onTimeout(taskId);
    }
    if (callbacks?.onError) {
      callbacks.onError(taskId, createAgentError(
        new Error(`Task timed out after ${this.config.timeouts[task.type]}ms`),
        AgentErrorType.TIMEOUT_ERROR,
        { taskId, taskType: task.type }
      ));
    }

    // 清理
    this.cleanupTask(taskId);
  }

  /**
   * 执行任务
   */
  private async executeTask(task: AITask): Promise<void> {
    const executor = this.taskExecutors.get(task.type);
    if (!executor) {
      this.handleTaskError(task.id, new Error(`No executor registered for task type: ${task.type}`));
      return;
    }

    try {
      // 执行并等待结果
      const result = await executor(task, task.abortController!.signal);

      // 检查是否已被取消
      if (task.status === 'cancelled') return;

      // 清理超时
      if (task.timeoutId) {
        clearTimeout(task.timeoutId);
        task.timeoutId = undefined;
      }

      // 更新状态
      task.status = 'completed';
      task.completedAt = Date.now();
      task.progress = 100;
      task.result = result;
      this.stats.totalCompleted++;

      // 从运行中移除
      this.runningTasks.delete(task.id);

      // 触发回调
      const callbacks = this.callbacks.get(task.id);
      if (callbacks?.onComplete) {
        callbacks.onComplete(task.id, result);
      }

      console.log(`[TaskQueue] Task completed: ${task.id}`);

      // 清理
      this.cleanupTask(task.id);
    } catch (error) {
      // 检查是否已被取消
      if (task.status === 'cancelled') return;

      await this.handleExecutionError(task.id, error as Error);
    }
  }

  /**
   * 处理执行错误
   */
  private async handleExecutionError(taskId: string, error: Error): Promise<void> {
    const task = this.runningTasks.get(taskId);
    if (!task) return;

    // 检查是否应该重试
    if (task.retryCount < this.config.retryAttempts && this.isRetryableError(error)) {
      task.retryCount++;
      console.log(`[TaskQueue] Retrying task ${taskId}, attempt ${task.retryCount}`);

      // 延迟后重试
      const delay = this.config.retryDelay * Math.pow(2, task.retryCount - 1);
      await new Promise(resolve => setTimeout(resolve, delay));

      // 重置状态
      task.status = 'running';
      task.progress = 0;

      // 重新设置超时
      this.setupTaskTimeout(task);

      // 重新执行
      this.executeTask(task);
      return;
    }

    // 重试耗尽，标记为失败
    this.handleTaskError(taskId, error);
  }

  /**
   * 判断错误是否可重试
   */
  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'network',
      'timeout',
      'rate limit',
      'temporary',
      'ECONNRESET',
      'ETIMEDOUT'
    ];
    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * 处理任务错误
   */
  private handleTaskError(taskId: string, error: Error): void {
    const task = this.runningTasks.get(taskId);
    if (!task) return;

    // 清理超时
    if (task.timeoutId) {
      clearTimeout(task.timeoutId);
      task.timeoutId = undefined;
    }

    // 更新状态
    task.status = 'failed';
    task.completedAt = Date.now();
    task.error = error.message;
    this.stats.totalFailed++;

    // 从运行中移除
    this.runningTasks.delete(taskId);

    // 触发回调
    const callbacks = this.callbacks.get(taskId);
    if (callbacks?.onError) {
      const agentError = createAgentError(error, AgentErrorType.API_ERROR, {
        taskId,
        taskType: task.type,
        retryCount: task.retryCount
      });
      callbacks.onError(taskId, agentError);
    }

    console.error(`[TaskQueue] Task failed: ${taskId}`, error);

    // 清理
    this.cleanupTask(taskId);
  }

  /**
   * 更新任务进度
   */
  updateTaskProgress(taskId: string, progress: number, data?: any): void {
    const task = this.runningTasks.get(taskId);
    if (!task) return;

    task.progress = Math.min(100, Math.max(0, progress));

    const callbacks = this.callbacks.get(taskId);
    if (callbacks?.onProgress) {
      callbacks.onProgress(taskId, task.progress, data);
    }
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): boolean {
    // 检查是否在队列中
    const queuedIndex = this.queue.findIndex(t => t.id === taskId);
    if (queuedIndex !== -1) {
      const task = this.queue[queuedIndex];
      task.status = 'cancelled';
      this.queue.splice(queuedIndex, 1);
      this.stats.totalCancelled++;

      const callbacks = this.callbacks.get(taskId);
      if (callbacks?.onCancel) {
        callbacks.onCancel(taskId);
      }

      this.cleanupTask(taskId);
      return true;
    }

    // 检查是否正在运行
    const runningTask = this.runningTasks.get(taskId);
    if (runningTask) {
      // 清理超时
      if (runningTask.timeoutId) {
        clearTimeout(runningTask.timeoutId);
        runningTask.timeoutId = undefined;
      }

      // 取消AbortController
      runningTask.abortController?.abort();

      // 更新状态
      runningTask.status = 'cancelled';
      runningTask.completedAt = Date.now();
      this.stats.totalCancelled++;

      // 从运行中移除
      this.runningTasks.delete(taskId);

      const callbacks = this.callbacks.get(taskId);
      if (callbacks?.onCancel) {
        callbacks.onCancel(taskId);
      }

      this.cleanupTask(taskId);
      return true;
    }

    return false;
  }

  /**
   * 注册任务执行器
   */
  registerTaskExecutor(type: AITask['type'], executor: TaskExecutor): void {
    this.taskExecutors.set(type, executor);
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): TaskStatus | undefined {
    const task = this.runningTasks.get(taskId);
    if (task) return task.status;

    const queuedTask = this.queue.find(t => t.id === taskId);
    return queuedTask?.status;
  }

  /**
   * 获取任务详情
   */
  getTask(taskId: string): AITask | undefined {
    return this.runningTasks.get(taskId) || this.queue.find(t => t.id === taskId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): AITask[] {
    return [...this.queue, ...Array.from(this.runningTasks.values())];
  }

  /**
   * 获取队列统计
   */
  getStats() {
    return {
      ...this.stats,
      pending: this.queue.length,
      running: this.runningTasks.size,
      totalActive: this.queue.length + this.runningTasks.size
    };
  }

  /**
   * 清空队列
   */
  clearQueue(): void {
    // 取消所有排队任务
    this.queue.forEach(task => {
      task.status = 'cancelled';
      const callbacks = this.callbacks.get(task.id);
      if (callbacks?.onCancel) {
        callbacks.onCancel(task.id);
      }
    });
    this.queue = [];

    // 取消所有运行中任务
    this.runningTasks.forEach((task, id) => {
      this.cancelTask(id);
    });
  }

  /**
   * 设置最大并发任务数
   */
  setMaxConcurrentTasks(max: number): void {
    this.config.maxConcurrentTasks = Math.max(1, max);
    this.processQueue();
  }

  /**
   * 更新任务超时配置
   */
  setTimeout(type: AITask['type'], timeoutMs: number): void {
    this.config.timeouts[type] = timeoutMs;
  }

  /**
   * 清理任务资源
   */
  private cleanupTask(taskId: string): void {
    // 延迟清理，允许回调执行
    setTimeout(() => {
      this.callbacks.delete(taskId);
    }, 1000);
  }

  /**
   * 定期清理
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      // 清理过期的回调（任务已完成但回调未清理）
      const expiredCallbacks: string[] = [];
      const now = Date.now();
      
      this.callbacks.forEach((_, taskId) => {
        const task = this.getTask(taskId);
        if (!task || (task.completedAt && now - task.completedAt > 60000)) {
          expiredCallbacks.push(taskId);
        }
      });

      expiredCallbacks.forEach(id => this.callbacks.delete(id));
    }, 60000); // 每分钟清理一次
  }
}

// 导出单例
export const enhancedTaskQueue = new EnhancedTaskQueueService();
