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
    let completed = 0;

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
    const pendingItems = items.filter(item => item.status === 'id