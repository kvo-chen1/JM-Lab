import { workService } from './apiService';
import { toast } from 'sonner';

export interface BatchWorkItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  files: File[];
  status: 'pending' | 'uploading' | 'validating' | 'submitting' | 'success' | 'error';
  progress?: number;
  error?: string;
}

interface BatchSubmissionConfig {
  maxConcurrent: number;
  retryCount: number;
  onProgress?: (completed: number, total: number, currentItem?: BatchWorkItem) => void;
  onComplete?: (results: BatchWorkItem[]) => void;
  onError?: (item: BatchWorkItem, error: Error) => void;
}

class BatchSubmissionService {
  private queue: BatchWorkItem[] = [];
  private isRunning: boolean = false;
  private config: BatchSubmissionConfig = {
    maxConcurrent: 3,
    retryCount: 2,
  };

  setConfig(config: Partial<BatchSubmissionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  addToQueue(item: Omit<BatchWorkItem, 'status' | 'progress' | 'error'>): void {
    this.queue.push({
      ...item,
      status: 'pending',
    });
  }

  addMultipleToQueue(items: Array<Omit<BatchWorkItem, 'status' | 'progress' | 'error'>>): void {
    items.forEach(item => this.addToQueue(item));
  }

  clearQueue(): void {
    this.queue = [];
  }

  getQueue(): BatchWorkItem[] {
    return [...this.queue];
  }

  removeFromQueue(itemId: string): void {
    this.queue = this.queue.filter(item => item.id !== itemId);
  }

  updateQueueItem(itemId: string, updates: Partial<BatchWorkItem>): void {
    const index = this.queue.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.queue[index] = { ...this.queue[index], ...updates };
    }
  }

  async startSubmission(): Promise<BatchWorkItem[]> {
    if (this.isRunning) {
      console.warn('[BatchSubmissionService] Submission already in progress');
      return this.queue;
    }

    this.isRunning = true;
    const total = this.queue.length;
    const completed = 0;

    try {
      await this.processQueue(completed, total);
    } finally {
      this.isRunning = false;
    }

    if (this.config.onComplete) {
      this.config.onComplete(this.queue);
    }

    return this.queue;
  }

  private async processQueue(completed: number, total: number): Promise<void> {
    const pendingItems = this.queue.filter(item => item.status === 'pending');
    if (pendingItems.length === 0) return;

    const activeCount = this.queue.filter(item => 
      ['uploading', 'validating', 'submitting'].includes(item.status)
    ).length;

    const availableSlots = this.config.maxConcurrent - activeCount;
    if (availableSlots <= 0) return;

    const itemsToProcess = pendingItems.slice(0, availableSlots);

    await Promise.all(
      itemsToProcess.map(item => this.processItem(item, completed, total))
    );
  }

  private async processItem(item: BatchWorkItem, completed: number, total: number): Promise<void> {
    this.updateQueueItem(item.id, { status: 'validating', progress: 10 });
    this.emitProgress(completed, total, item);

    try {
      await this.validateItem(item);

      this.updateQueueItem(item.id, { status: 'uploading', progress: 30 });
      this.emitProgress(completed, total, item);

      const uploadedFiles = await this.uploadFiles(item);

      this.updateQueueItem(item.id, { status: 'submitting', progress: 70 });
      this.emitProgress(completed, total, item);

      await this.submitWork(item, uploadedFiles);

      this.updateQueueItem(item.id, { status: 'success', progress: 100 });
      completed++;
      this.emitProgress(completed, total, item);

      toast.success(`作品 "${item.title}" 提交成功`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      this.updateQueueItem(item.id, { 
        status: 'error', 
        error: errorMessage 
      });

      if (this.config.onError) {
        this.config.onError(item, error instanceof Error ? error : new Error(errorMessage));
      }

      toast.error(`作品 "${item.title}" 提交失败: ${errorMessage}`);
    }

    await this.processQueue(completed, total);
  }

  private async validateItem(item: BatchWorkItem): Promise<void> {
    if (!item.title.trim()) {
      throw new Error('作品标题不能为空');
    }
    if (item.files.length === 0) {
      throw new Error('请至少上传一个文件');
    }
  }

  private async uploadFiles(item: BatchWorkItem): Promise<string[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(item.files.map((_, index) => `file-${item.id}-${index}`));
      }, 1000);
    });
  }

  private async submitWork(item: BatchWorkItem, fileUrls: string[]): Promise<void> {
    const workData = {
      title: item.title,
      description: item.description,
      tags: item.tags,
      files: fileUrls,
    };

    await workService.createWork(workData as any);
  }

  private emitProgress(completed: number, total: number, currentItem?: BatchWorkItem): void {
    if (this.config.onProgress) {
      this.config.onProgress(completed, total, currentItem);
    }
  }

  getStats(): {
    total: number;
    pending: number;
    processing: number;
    success: number;
    error: number;
  } {
    const total = this.queue.length;
    const pending = this.queue.filter(item => item.status === 'pending').length;
    const processing = this.queue.filter(item => 
      ['uploading', 'validating', 'submitting'].includes(item.status)
    ).length;
    const success = this.queue.filter(item => item.status === 'success').length;
    const error = this.queue.filter(item => item.status === 'error').length;

    return { total, pending, processing, success, error };
  }

  isSubmissionRunning(): boolean {
    return this.isRunning;
  }

  retryFailedItems(): Promise<BatchWorkItem[]> {
    const failedItems = this.queue.filter(item => item.status === 'error');
    failedItems.forEach(item => {
      this.updateQueueItem(item.id, { 
        status: 'pending', 
        error: undefined,
        progress: undefined 
      });
    });

    return this.startSubmission();
  }
}

export const batchSubmissionService = new BatchSubmissionService();

export default batchSubmissionService;
