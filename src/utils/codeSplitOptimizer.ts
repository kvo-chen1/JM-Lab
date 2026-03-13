export interface ChunkOptimizationConfig {
  maxChunkSize: number;
  minChunkSize: number;
  sharedDependencies: string[];
}

export class CodeSplitOptimizer {
  private static instance: CodeSplitOptimizer;
  private loadedChunks: Set<string> = new Set();
  private loadingChunks: Map<string, Promise<any>> = new Map();
  private prefetchQueue: string[] = [];

  static getInstance(): CodeSplitOptimizer {
    if (!CodeSplitOptimizer.instance) {
      CodeSplitOptimizer.instance = new CodeSplitOptimizer();
    }
    return CodeSplitOptimizer.instance;
  }

  private constructor() {}

  async lazyLoad<T>(
    importFn: () => Promise<T>,
    chunkName: string,
    options: { priority?: 'high' | 'low' | 'normal'; prefetch?: boolean } = {}
  ): Promise<T> {
    const { priority = 'normal', prefetch = false } = options;

    if (this.loadedChunks.has(chunkName)) {
      const cached = this.loadingChunks.get(chunkName);
      if (cached) return cached;
    }

    if (this.loadingChunks.has(chunkName)) {
      return this.loadingChunks.get(chunkName)!;
    }

    if (prefetch && priority === 'low') {
      this.addToPrefetchQueue(chunkName);
    }

    const promise = importFn();
    this.loadingChunks.set(chunkName, promise);

    try {
      const result = await promise;
      this.loadedChunks.add(chunkName);
      this.loadingChunks.delete(chunkName);
      console.log(`[CodeSplitOptimizer] Loaded chunk: ${chunkName}`);
      return result;
    } catch (error) {
      this.loadingChunks.delete(chunkName);
      console.error(`[CodeSplitOptimizer] Failed to load chunk ${chunkName}:`, error);
      throw error;
    }
  }

  private addToPrefetchQueue(chunkName: string): void {
    if (!this.prefetchQueue.includes(chunkName)) {
      this.prefetchQueue.push(chunkName);
      this.processPrefetchQueue();
    }
  }

  private processPrefetchQueue(): void {
    if (typeof window === 'undefined') return;

    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.processQueue(), { timeout: 2000 });
    } else {
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  private processQueue(): void {
    const chunk = this.prefetchQueue.shift();
    if (chunk) {
      console.log(`[CodeSplitOptimizer] Prefetching chunk: ${chunk}`);
    }
  }

  prefetchRoute(route: string): void {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'script';
    link.href = route;
    document.head.appendChild(link);
    console.log(`[CodeSplitOptimizer] Prefetched route: ${route}`);
  }

  getChunkLoadingStatus(): { loaded: string[]; loading: string[]; prefetch: string[] } {
    return {
      loaded: Array.from(this.loadedChunks),
      loading: Array.from(this.loadingChunks.keys()),
      prefetch: [...this.prefetchQueue]
    };
  }

  clearCache(): void {
    this.loadedChunks.clear();
    this.loadingChunks.clear();
    this.prefetchQueue = [];
    console.log('[CodeSplitOptimizer] Cache cleared');
  }
}

export const codeSplitOptimizer = CodeSplitOptimizer.getInstance();
export default codeSplitOptimizer;
