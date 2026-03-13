interface PendingRequest {
  promise: Promise<any>;
  resolvers: Array<(value: any) => void>;
  rejecters: Array<(error: any) => void>;
}

interface QueuedRequest {
  key: string;
  fn: () => Promise<any>;
  priority: number;
  timestamp: number;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableStatuses: number[];
}

interface PrefetchRule {
  pattern: RegExp;
  ttl: number;
  prefetchOnHover?: boolean;
  prefetchOnVisible?: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryableStatuses: [429, 500, 502, 503, 504],
};

const DEFAULT_PREFETCH_RULES: PrefetchRule[] = [
  { pattern: /^\/api\/works\/\d+$/, ttl: 60000, prefetchOnHover: true },
  { pattern: /^\/api\/users\/\w+$/, ttl: 120000, prefetchOnHover: true },
];

class ApiOptimizer {
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue: boolean = false;
  private maxConcurrentRequests: number = 5;
  private activeRequests: number = 0;
  private retryConfig: RetryConfig;
  private prefetchRules: PrefetchRule[];
  private prefetchCache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(options: {
    maxConcurrentRequests?: number;
    retryConfig?: Partial<RetryConfig>;
    prefetchRules?: PrefetchRule[];
  } = {}) {
    this.maxConcurrentRequests = options.maxConcurrentRequests || 5;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...options.retryConfig };
    this.prefetchRules = options.prefetchRules || DEFAULT_PREFETCH_RULES;
  }

  generateRequestKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  async dedupeRequest<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const existing = this.pendingRequests.get(key);
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.resolvers.push(resolve);
        existing.rejecters.push(reject);
      });
    }

    const promise = requestFn();
    const pending: PendingRequest = {
      promise,
      resolvers: [],
      rejecters: [],
    };
    this.pendingRequests.set(key, pending);

    try {
      const result = await promise;
      pending.resolvers.forEach(resolve => resolve(result));
      return result;
    } catch (error) {
      pending.rejecters.forEach(reject => reject(error));
      throw error;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  async requestWithRetry<T>(
    requestFn: () => Promise<T>,
    shouldRetry?: (error: any, attempt: number) => boolean
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        if (attempt === this.retryConfig.maxRetries) {
          break;
        }

        const shouldRetryRequest = shouldRetry 
          ? shouldRetry(error, attempt)
          : this.isRetryableError(error);

        if (!shouldRetryRequest) {
          break;
        }

        const delay = this.calculateBackoff(attempt);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private isRetryableError(error: any): boolean {
    if (error.status && this.retryConfig.retryableStatuses.includes(error.status)) {
      return true;
    }
    if (error.name === 'AbortError') {
      return false;
    }
    if (!navigator.onLine) {
      return true;
    }
    return false;
  }

  private calculateBackoff(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(2, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  enqueueRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        key,
        fn: requestFn,
        priority,
        timestamp: Date.now(),
      });

      this.requestQueue.sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return a.timestamp - b.timestamp;
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    if (this.activeRequests >= this.maxConcurrentRequests) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
      const request = this.requestQueue.shift()!;
      this.activeRequests++;

      this.dedupeRequest(request.key, request.fn)
        .then(result => {
          this.activeRequests--;
          this.processQueue();
        })
        .catch(error => {
          this.activeRequests--;
          this.processQueue();
        });
    }

    this.isProcessingQueue = false;
  }

  async prefetch(url: string, options?: RequestInit): Promise<void> {
    const key = this.generateRequestKey(url, options);
    const rule = this.prefetchRules.find(r => r.pattern.test(url));

    if (!rule) {
      return;
    }

    try {
      const response = await fetch(url, { ...options, method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        this.prefetchCache.set(key, {
          data,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.warn('[ApiOptimizer] Prefetch failed:', url, error);
    }
  }

  getPrefetched<T>(url: string, options?: RequestInit): T | null {
    const key = this.generateRequestKey(url, options);
    const cached = this.prefetchCache.get(key);

    if (!cached) {
      return null;
    }

    const rule = this.prefetchRules.find(r => r.pattern.test(url));
    if (rule && Date.now() - cached.timestamp > rule.ttl) {
      this.prefetchCache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  batchRequests<T, R>(
    requests: Array<{ id: string; data: T }>,
    batchFn: (batch: Array<{ id: string; data: T }>) => Promise<Map<string, R>>,
    options: { maxBatchSize?: number; batchWindow?: number } = {}
  ): Promise<Map<string, R>> {
    const { maxBatchSize = 10, batchWindow = 50 } = options;

    return new Promise((resolve, reject) => {
      let batch: Array<{ id: string; data: T }> = [];
      let timeoutId: NodeJS.Timeout | null = null;

      const processBatch = async () => {
        try {
          const result = await batchFn(batch);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      for (const request of requests) {
        batch.push(request);

        if (batch.length >= maxBatchSize) {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          processBatch();
          batch = [];
        } else if (!timeoutId) {
          timeoutId = setTimeout(processBatch, batchWindow);
        }
      }

      if (batch.length > 0 && !timeoutId) {
        processBatch();
      }
    });
  }

  getStats(): {
    pendingRequests: number;
    queuedRequests: number;
    activeRequests: number;
    prefetchCacheSize: number;
  } {
    return {
      pendingRequests: this.pendingRequests.size,
      queuedRequests: this.requestQueue.length,
      activeRequests: this.activeRequests,
      prefetchCacheSize: this.prefetchCache.size,
    };
  }

  clear(): void {
    this.pendingRequests.clear();
    this.requestQueue = [];
    this.prefetchCache.clear();
  }
}

export const apiOptimizer = new ApiOptimizer();

export function withOptimization<T>(
  url: string,
  requestFn: () => Promise<T>,
  options?: {
    dedupe?: boolean;
    retry?: boolean;
    priority?: number;
  }
): Promise<T> {
  const { dedupe = true, retry = true, priority = 0 } = options || {};
  const key = apiOptimizer.generateRequestKey(url);

  let promise: Promise<T>;

  if (dedupe) {
    promise = apiOptimizer.dedupeRequest(key, requestFn);
  } else {
    promise = requestFn();
  }

  if (retry) {
    promise = apiOptimizer.requestWithRetry(() => promise);
  }

  return promise;
}

export default apiOptimizer;
