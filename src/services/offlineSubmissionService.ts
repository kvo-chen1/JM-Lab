import { toast } from 'sonner';

export interface OfflineSubmission {
  id: string;
  eventId: string;
  userId: string;
  participationId: string;
  formData: {
    title: string;
    description: string;
    tags: string[];
  };
  files: Array<{
    name: string;
    size: number;
    type: string;
    base64?: string;
    url?: string;
  }>;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  createdAt: number;
  error?: string;
}

class OfflineSubmissionService {
  private readonly STORAGE_KEY = 'offline_submissions';
  private readonly MAX_OFFLINE_ITEMS = 10;

  /**
   * 保存离线提交到本地
   */
  saveOfflineSubmission(submission: Omit<OfflineSubmission, 'id' | 'createdAt' | 'status'>): string {
    const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offlineItem: OfflineSubmission = {
      ...submission,
      id,
      status: 'pending',
      createdAt: Date.now()
    };

    const submissions = this.getOfflineSubmissions();
    
    // 检查是否已存在相同事件的待提交
    const existingIndex = submissions.findIndex(
      s => s.eventId === submission.eventId && s.status === 'pending'
    );

    if (existingIndex !== -1) {
      // 替换现有待提交
      submissions[existingIndex] = offlineItem;
    } else {
      // 添加新的
      submissions.unshift(offlineItem);
      
      // 限制离线项目数量
      if (submissions.length > this.MAX_OFFLINE_ITEMS) {
        submissions.pop();
      }
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(submissions));
    
    return id;
  }

  /**
   * 获取所有离线提交
   */
  getOfflineSubmissions(): OfflineSubmission[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * 获取待提交的离线项目
   */
  getPendingSubmissions(): OfflineSubmission[] {
    return this.getOfflineSubmissions().filter(s => s.status === 'pending');
  }

  /**
   * 更新离线提交状态
   */
  updateSubmissionStatus(
    id: string, 
    status: OfflineSubmission['status'], 
    error?: string
  ): void {
    const submissions = this.getOfflineSubmissions();
    const index = submissions.findIndex(s => s.id === id);
    
    if (index !== -1) {
      submissions[index].status = status;
      if (error) {
        submissions[index].error = error;
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(submissions));
    }
  }

  /**
   * 删除离线提交
   */
  removeOfflineSubmission(id: string): void {
    const submissions = this.getOfflineSubmissions();
    const filtered = submissions.filter(s => s.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  /**
   * 清除所有已完成的离线提交
   */
  clearCompletedSubmissions(): void {
    const submissions = this.getOfflineSubmissions();
    const filtered = submissions.filter(s => s.status !== 'completed');
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  /**
   * 检查是否支持离线
   */
  isOfflineSupported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator;
  }

  /**
   * 请求通知权限（用于离线提交完成提醒）
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * 发送本地通知
   */
  sendNotification(title: string, body: string): void {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }

  /**
   * 检查网络状态
   */
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * 监听网络状态变化
   */
  onNetworkChange(callback: (online: boolean) => void): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

export const offlineSubmissionService = new OfflineSubmissionService();
