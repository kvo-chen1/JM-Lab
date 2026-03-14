import { workService } from './apiService';
import { toast } from 'sonner';

export type ModerationAction = 'approve' | 'reject';

export interface ModerationItem {
  id: number;
  title: string;
  thumbnail?: string;
  author: string;
  createdAt: string;
  currentStatus: 'pending' | 'approved' | 'rejected' | 'scheduled';
  selected: boolean;
  action?: ModerationAction;
  reason?: string;
  featured?: boolean;
  tags?: string[];
  status: 'idle' | 'processing' | 'success' | 'error';
  error?: string;
}

interface BatchModerationConfig {
  maxConcurrent: number;
  onProgress?: (completed: number, total: number, currentItem?: ModerationItem) => void;
  onComplete?: (results: ModerationItem[]) => void;
  onError?: (item: ModerationItem, error: Error) => void;
}

class BatchModerationService {
  private items: ModerationItem[] = [];
  private isRunning: boolean = false;
  private config: BatchModerationConfig = {
    maxConcurrent: 5,
  };

  setConfig(config: Partial<BatchModerationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  setItems(items: Omit<ModerationItem, 'selected' | 'action' | 'reason' | 'featured' | 'tags' | 'status' | 'error'>[]): void {
    this.items = items.map(item => ({
      ...item,
      selected: false,
      status: 'idle' as const,
    }));
  }

  getItems(): ModerationItem[] {
    return [...this.items];
  }

  toggleSelect(id: number): void {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items[index].selected = !this.items[index].selected;
    }
  }

  selectAll(): void {
    this.items.forEach(item => {
      item.selected = true;
    });
  }

  deselectAll(): void {
    this.items.forEach(item => {
      item.selected = false;
    });
  }

  setItemAction(id: number, action: ModerationAction, reason?: string): void {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items[index].action = action;
      this.items[index].reason = reason;
    }
  }

  setBulkAction(action: ModerationAction, reason?: string): void {
    this.items
      .filter(item => item.selected)
      .forEach(item => {
        item.action = action;
        item.reason = reason;
      });
  }

  setItemFeatured(id: number, featured: boolean): void {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items[index].featured = featured;
    }
  }

  setItemTags(id: number, tags: string[]): void {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items[index].tags = tags;
    }
  }

  async startModeration(): Promise<ModerationItem[]> {
    if (this.isRunning) {
      console.warn('[BatchModerationService] Moderation already in progress');
      return this.items;
    }

    const selectedItems = this.items.filter(item => item.selected && item.action);
    if (selectedItems.length === 0) {
      toast.error('请先选择作品并设置审核操作');
      return this.items;
    }

    this.isRunning = true;
    const total = selectedItems.length;
    const completed = 0;

    try {
      await this.processQueue(selectedItems, completed, total);
    } finally {
      this.isRunning = false;
    }

    if (this.config.onComplete) {
      this.config.onComplete(this.items);
    }

    return this.items;
  }

  private async processQueue(items: ModerationItem[], completed: number, total: number): Promise<void> {
    const pendingItems = items.filter(item => item.status === 'idle' && item.action);
    if (pendingItems.length === 0) return;

    const activeCount = items.filter(item => item.status === 'processing').length;
    const availableSlots = this.config.maxConcurrent - activeCount;
    if (availableSlots <= 0) return;

    const itemsToProcess = pendingItems.slice(0, availableSlots);

    await Promise.all(
      itemsToProcess.map(item => this.processItem(item, items, completed, total))
    );
  }

  private async processItem(
    item: ModerationItem,
    allItems: ModerationItem[],
    completed: number,
    total: number
  ): Promise<void> {
    const index = this.items.findIndex(i => i.id === item.id);
    if (index === -1) return;

    this.items[index].status = 'processing';
    this.emitProgress(completed, total, this.items[index]);

    try {
      if (item.action === 'approve') {
        await workService.moderateWork(item.id, {
          status: 'approved',
          reason: null,
          featured: item.featured,
          tags: item.tags,
        });
      } else if (item.action === 'reject') {
        await workService.moderateWork(item.id, {
          status: 'rejected',
          reason: item.reason || null,
        });
      }

      this.items[index].status = 'success';
      this.items[index].currentStatus = item.action === 'approve' ? 'approved' : 'rejected';
      completed++;
      this.emitProgress(completed, total, this.items[index]);

      toast.success(`作品 "${item.title}" 审核${item.action === 'approve' ? '通过' : '拒绝'}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      this.items[index].status = 'error';
      this.items[index].error = errorMessage;

      if (this.config.onError) {
        this.config.onError(this.items[index], error instanceof Error ? error : new Error(errorMessage));
      }

      toast.error(`作品 "${item.title}" 审核失败: ${errorMessage}`);
    }

    await this.processQueue(allItems, completed, total);
  }

  private emitProgress(completed: number, total: number, currentItem?: ModerationItem): void {
    if (this.config.onProgress) {
      this.config.onProgress(completed, total, currentItem);
    }
  }

  getStats(): {
    total: number;
    selected: number;
    pending: number;
    processing: number;
    success: number;
    error: number;
    approved: number;
    rejected: number;
  } {
    const total = this.items.length;
    const selected = this.items.filter(item => item.selected).length;
    const pending = this.items.filter(item => item.status === 'idle' && item.selected).length;
    const processing = this.items.filter(item => item.status === 'processing').length;
    const success = this.items.filter(item => item.status === 'success').length;
    const error = this.items.filter(item => item.status === 'error').length;
    const approved = this.items.filter(item => item.action === 'approve' && item.selected).length;
    const rejected = this.items.filter(item => item.action === 'reject' && item.selected).length;

    return { total, selected, pending, processing, success, error, approved, rejected };
  }

  isModerationRunning(): boolean {
    return this.isRunning;
  }

  resetItems(): void {
    this.items = this.items.map(item => ({
      ...item,
      status: 'idle' as const,
      error: undefined,
    }));
  }

  clear(): void {
    this.items = [];
  }
}

export const batchModerationService = new BatchModerationService();

export default batchModerationService;
