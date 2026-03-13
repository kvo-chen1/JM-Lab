import { toast } from 'sonner';

export type QuotaType =
  | 'works'
  | 'storage'
  | 'uploads'
  | 'api_calls'
  | 'ai_generations'
  | 'community_posts'
  | 'event_participations';

export interface QuotaLimit {
  type: QuotaType;
  limit: number;
  used: number;
  resetAt?: string;
}

export interface QuotaConfig {
  [key: string]: {
    free: number;
    premium: number;
    vip: number;
  };
}

const DEFAULT_QUOTA_CONFIG: QuotaConfig = {
  works: { free: 10, premium: 100, vip: 1000 },
  storage: { free: 100 * 1024 * 1024, premium: 10 * 1024 * 1024 * 1024, vip: 100 * 1024 * 1024 * 1024 },
  uploads: { free: 50, premium: 500, vip: 5000 },
  api_calls: { free: 1000, premium: 10000, vip: 100000 },
  ai_generations: { free: 10, premium: 100, vip: 1000 },
  community_posts: { free: 20, premium: 200, vip: 2000 },
  event_participations: { free: 5, premium: 50, vip: 500 },
};

type MembershipLevel = 'free' | 'premium' | 'vip';

interface UsageRecord {
  type: QuotaType;
  amount: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

class QuotaService {
  private quotas: Map<string, QuotaLimit[]> = new Map();
  private usageHistory: Map<string, UsageRecord[]> = new Map();
  private config: QuotaConfig;
  private listeners: Set<(userId: string, quotas: QuotaLimit[]) => void> = new Set();

  constructor(config: Partial<QuotaConfig> = {}) {
    this.config = { ...DEFAULT_QUOTA_CONFIG, ...config };
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const savedQuotas = localStorage.getItem('quota-quotas');
      const savedHistory = localStorage.getItem('quota-history');

      if (savedQuotas) {
        const parsed = JSON.parse(savedQuotas);
        Object.entries(parsed).forEach(([userId, quotas]) => {
          this.quotas.set(userId, quotas as QuotaLimit[]);
        });
      }

      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        Object.entries(parsed).forEach(([userId, history]) => {
          this.usageHistory.set(userId, history as UsageRecord[]);
        });
      }
    } catch (error) {
      console.error('[QuotaService] Failed to load from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const quotasObj: Record<string, QuotaLimit[]> = {};
      this.quotas.forEach((quotas, userId) => {
        quotasObj[userId] = quotas;
      });
      localStorage.setItem('quota-quotas', JSON.stringify(quotasObj));

      const historyObj: Record<string, UsageRecord[]> = {};
      this.usageHistory.forEach((history, userId) => {
        historyObj[userId] = history;
      });
      localStorage.setItem('quota-history', JSON.stringify(historyObj));
    } catch (error) {
      console.error('[QuotaService] Failed to save to storage:', error);
    }
  }

  initializeUserQuotas(userId: string, level: MembershipLevel = 'free'): QuotaLimit[] {
    const quotas: QuotaLimit[] = Object.entries(this.config).map(([type, limits]) => ({
      type: type as QuotaType,
      limit: limits[level],
      used: 0,
      resetAt: this.getNextResetDate(),
    }));

    this.quotas.set(userId, quotas);
    this.usageHistory.set(userId, []);
    this.saveToStorage();
    this.notifyListeners(userId, quotas);

    return quotas;
  }

  private getNextResetDate(): string {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString();
  }

  getUserQuotas(userId: string): QuotaLimit[] {
    return this.quotas.get(userId) || this.initializeUserQuotas(userId);
  }

  getQuota(userId: string, type: QuotaType): QuotaLimit | undefined {
    const quotas = this.getUserQuotas(userId);
    return quotas.find(q => q.type === type);
  }

  async consumeQuota(
    userId: string,
    type: QuotaType,
    amount: number = 1,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; remaining: number; limit: number }> {
    const quota = this.getQuota(userId, type);
    if (!quota) {
      return { success: false, remaining: 0, limit: 0 };
    }

    const newUsed = quota.used + amount;
    if (newUsed > quota.limit) {
      toast.error(`配额不足: ${this.getQuotaLabel(type)}`);
      return { success: false, remaining: quota.limit - quota.used, limit: quota.limit };
    }

    const quotas = this.getUserQuotas(userId);
    const index = quotas.findIndex(q => q.type === type);
    if (index !== -1) {
      quotas[index].used = newUsed;
    }

    const history = this.usageHistory.get(userId) || [];
    history.push({
      type,
      amount,
      timestamp: new Date().toISOString(),
      metadata,
    });
    this.usageHistory.set(userId, history);

    this.quotas.set(userId, quotas);
    this.saveToStorage();
    this.notifyListeners(userId, quotas);

    return {
      success: true,
      remaining: quota.limit - newUsed,
      limit: quota.limit,
    };
  }

  checkQuota(userId: string, type: QuotaType, amount: number = 1): boolean {
    const quota = this.getQuota(userId, type);
    if (!quota) return false;
    return quota.used + amount <= quota.limit;
  }

  getQuotaUsagePercentage(userId: string, type: QuotaType): number {
    const quota = this.getQuota(userId, type);
    if (!quota) return 0;
    return Math.min((quota.used / quota.limit) * 100, 100);
  }

  resetQuota(userId: string, type: QuotaType): void {
    const quotas = this.getUserQuotas(userId);
    const index = quotas.findIndex(q => q.type === type);
    if (index !== -1) {
      quotas[index].used = 0;
      quotas[index].resetAt = this.getNextResetDate();
      this.quotas.set(userId, quotas);
      this.saveToStorage();
      this.notifyListeners(userId, quotas);
      toast.success('配额已重置');
    }
  }

  resetAllQuotas(userId: string): void {
    const quotas = this.getUserQuotas(userId);
    quotas.forEach(quota => {
      quota.used = 0;
      quota.resetAt = this.getNextResetDate();
    });
    this.quotas.set(userId, quotas);
    this.saveToStorage();
    this.notifyListeners(userId, quotas);
    toast.success('所有配额已重置');
  }

  upgradeMembership(userId: string, newLevel: MembershipLevel): void {
    const quotas = this.getUserQuotas(userId);
    quotas.forEach(quota => {
      const newLimit = this.config[quota.type]?.[newLevel];
      if (newLimit) {
        quota.limit = newLimit;
      }
    });
    this.quotas.set(userId, quotas);
    this.saveToStorage();
    this.notifyListeners(userId, quotas);
    toast.success(`已升级到 ${newLevel} 会员`);
  }

  getUsageHistory(userId: string, type?: QuotaType): UsageRecord[] {
    const history = this.usageHistory.get(userId) || [];
    if (type) {
      return history.filter(h => h.type === type);
    }
    return history;
  }

  getQuotaLabel(type: QuotaType): string {
    const labels: Record<QuotaType, string> = {
      works: '作品数量',
      storage: '存储空间',
      uploads: '上传次数',
      api_calls: 'API调用',
      ai_generations: 'AI生成',
      community_posts: '社区发帖',
      event_participations: '活动参与',
    };
    return labels[type] || type;
  }

  formatQuotaValue(type: QuotaType, value: number): string {
    if (type === 'storage') {
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let unitIndex = 0;
      let formattedValue = value;
      while (formattedValue >= 1024 && unitIndex < units.length - 1) {
        formattedValue /= 1024;
        unitIndex++;
      }
      return `${formattedValue.toFixed(2)} ${units[unitIndex]}`;
    }
    return value.toString();
  }

  subscribe(
    userId: string,
    listener: (userId: string, quotas: QuotaLimit[]) => void
  ): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(userId: string, quotas: QuotaLimit[]): void {
    this.listeners.forEach(listener => listener(userId, quotas));
  }
}

export const quotaService = new QuotaService();

export default quotaService;
