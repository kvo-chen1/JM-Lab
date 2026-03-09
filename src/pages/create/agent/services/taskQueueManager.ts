/**
 * 任务队列管理器
 * 用于管理链式任务的执行顺序和状态追踪
 */

import { AgentType } from '../types/agent';

/**
 * 任务状态枚举
 */
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

/**
 * 任务接口
 */
export interface ChainTask {
  id: string;
  type: string;
  name: string;
  agent: AgentType;
  description: string;
  status: TaskStatus;
  input?: any;
  output?: any;
  error?: string;
  dependsOn?: string[]; // 依赖的前置任务 ID
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

/**
 * 任务队列接口
 */
export interface TaskQueue {
  id: string;
  tasks: ChainTask[];
  currentTaskId?: string;
  status: 'pending' | 'running' | 'completed' | 'paused' | 'failed';
  createdAt: number;
  completedAt?: number;
}

/**
 * 任务队列管理器类
 */
export class TaskQueueManager {
  private queues: Map<string, TaskQueue> = new Map();
  private listeners: Set<() => void> = new Set();

  /**
   * 创建新的任务队列
   */
  createQueue(tasks: Omit<ChainTask, 'id' | 'status' | 'createdAt'>[]): TaskQueue {
    const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const chainTasks: ChainTask[] = tasks.map((task, index) => ({
      ...task,
      id: `task_${queueId}_${index}`,
      status: TaskStatus.PENDING,
      createdAt: Date.now(),
      dependsOn: index > 0 ? [`task_${queueId}_${index - 1}`] : []
    }));

    const queue: TaskQueue = {
      id: queueId,
      tasks: chainTasks,
      status: 'pending',
      createdAt: Date.now()
    };

    this.queues.set(queueId, queue);
    this.notifyListeners();

    return queue;
  }

  /**
   * 获取队列
   */
  getQueue(queueId: string): TaskQueue | undefined {
    return this.queues.get(queueId);
  }

  /**
   * 获取下一个可执行的任务
   */
  getNextTask(queueId: string): ChainTask | undefined {
    const queue = this.queues.get(queueId);
    if (!queue) return undefined;

    // 查找所有 pending 状态且依赖已满足的任务
    const pendingTask = queue.tasks.find(task => {
      if (task.status !== TaskStatus.PENDING) return false;
      
      // 检查依赖是否都已完成
      if (task.dependsOn && task.dependsOn.length > 0) {
        return task.dependsOn.every(depId => {
          const depTask = queue.tasks.find(t => t.id === depId);
          return depTask && depTask.status === TaskStatus.COMPLETED;
        });
      }
      
      return true;
    });

    return pendingTask;
  }

  /**
   * 开始执行任务
   */
  startTask(queueId: string, taskId: string): boolean {
    const queue = this.queues.get(queueId);
    if (!queue) return false;

    const task = queue.tasks.find(t => t.id === taskId);
    if (!task) return false;

    task.status = TaskStatus.RUNNING;
    task.startedAt = Date.now();
    queue.currentTaskId = taskId;
    queue.status = 'running';

    this.notifyListeners();
    return true;
  }

  /**
   * 完成任务
   */
  completeTask(queueId: string, taskId: string, output?: any): boolean {
    const queue = this.queues.get(queueId);
    if (!queue) return false;

    const task = queue.tasks.find(t => t.id === taskId);
    if (!task) return false;

    task.status = TaskStatus.COMPLETED;
    task.completedAt = Date.now();
    task.output = output;
    queue.currentTaskId = undefined;

    // 检查是否所有任务都已完成
    const allCompleted = queue.tasks.every(t => t.status === TaskStatus.COMPLETED);
    if (allCompleted) {
      queue.status = 'completed';
      queue.completedAt = Date.now();
    }

    this.notifyListeners();
    return true;
  }

  /**
   * 标记任务失败
   */
  failTask(queueId: string, taskId: string, error: string): boolean {
    const queue = this.queues.get(queueId);
    if (!queue) return false;

    const task = queue.tasks.find(t => t.id === taskId);
    if (!task) return false;

    task.status = TaskStatus.FAILED;
    task.error = error;
    task.completedAt = Date.now();
    queue.status = 'failed';

    // 标记后续依赖任务为跳过
    queue.tasks.forEach(t => {
      if (t.dependsOn?.includes(taskId)) {
        t.status = TaskStatus.SKIPPED;
      }
    });

    this.notifyListeners();
    return true;
  }

  /**
   * 暂停队列
   */
  pauseQueue(queueId: string): boolean {
    const queue = this.queues.get(queueId);
    if (!queue) return false;

    queue.status = 'paused';
    this.notifyListeners();
    return true;
  }

  /**
   * 恢复队列
   */
  resumeQueue(queueId: string): boolean {
    const queue = this.queues.get(queueId);
    if (!queue) return false;

    if (queue.status === 'paused') {
      queue.status = 'running';
    }
    this.notifyListeners();
    return true;
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(queueId: string, taskId: string): TaskStatus | undefined {
    const queue = this.queues.get(queueId);
    if (!queue) return undefined;

    const task = queue.tasks.find(t => t.id === taskId);
    return task?.status;
  }

  /**
   * 获取队列进度
   */
  getQueueProgress(queueId: string): { current: number; total: number; percentage: number } {
    const queue = this.queues.get(queueId);
    if (!queue) return { current: 0, total: 0, percentage: 0 };

    const completed = queue.tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const total = queue.tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      current: completed,
      total,
      percentage
    };
  }

  /**
   * 添加监听器
   */
  addListener(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }

  /**
   * 清理已完成的队列
   */
  cleanupCompletedQueues(): number {
    let cleaned = 0;
    this.queues.forEach((queue, queueId) => {
      if (queue.status === 'completed' || queue.status === 'failed') {
        this.queues.delete(queueId);
        cleaned++;
      }
    });
    this.notifyListeners();
    return cleaned;
  }
}

// 导出单例
export const taskQueueManager = new TaskQueueManager();
