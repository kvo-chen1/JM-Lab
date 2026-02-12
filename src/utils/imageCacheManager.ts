// 使用浏览器内置的performance API
const performance = typeof window !== 'undefined' ? window.performance : {
  now: () => Date.now(),
  mark: () => {},
  measure: () => {}
} as unknown as Performance;

interface ImageCacheEntry {
  src: string;
  blob: Blob | null;
  timestamp: number;
  size: number;
  loadTime: number;
  error: boolean;
}

interface PreloadRequest {
  src: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  callback?: (success: boolean) => void;
}

class ImageCacheManager {
  private cache = new Map<string, ImageCacheEntry>();
  private preloadQueue: PreloadRequest[] = [];
  private isPreloading = false;
  private maxCacheSize = 50 * 1024 * 1024;
  private currentCacheSize = 0;
  private cacheTTL = 30 * 60 * 1000;

  constructor() {
    if (typeof window !== 'undefined') {
      this.cleanupExpiredCache();
      setInterval(() => this.cleanupExpiredCache(), 5 * 60 * 1000);
    }
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.cacheTTL) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.currentCacheSize -= entry.size;
      }
      this.cache.delete(key);
    });

    if (expiredKeys.length > 0) {
      performance.mark('image_cache_cleanup', {
        detail: { removedCount: expiredKeys.length }
      });
    }
  }

  private evictLRU(): void {
    if (this.currentCacheSize <= this.maxCacheSize) return;

    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    let evictedCount = 0;
    for (const [key, entry] of entries) {
      if (this.currentCacheSize <= this.maxCacheSize * 0.8) break;

      this.currentCacheSize -= entry.size;
      this.cache.delete(key);
      evictedCount++;
    }

    if (evictedCount > 0) {
      performance.mark('image_cache_evict', {
        detail: { evictedCount }
      });
    }
  }

  async loadImage(src: string): Promise<Blob | null> {
    const startTime = performance.now();

    try {
      const response = await fetch(src, {
        cache: 'force-cache',
        mode: 'no-cors'
      });

      const blob = await response.blob();
      const loadTime = performance.now() - startTime;

      const entry: ImageCacheEntry = {
        src,
        blob,
        timestamp: Date.now(),
        size: blob.size,
        loadTime,
        error: false
      };

      this.evictLRU();

      if (this.currentCacheSize + blob.size <= this.maxCacheSize) {
        this.cache.set(src, entry);
        this.currentCacheSize += blob.size;
      }

      performance.mark('image_load', {
        detail: {
          src,
          loadTime,
          size: blob.size,
          cached: false
        }
      });

      return blob;
    } catch (error) {
      const loadTime = performance.now() - startTime;

      this.cache.set(src, {
        src,
        blob: null,
        timestamp: Date.now(),
        size: 0,
        loadTime,
        error: true
      });

      performance.mark('image_load_error', {
        detail: { src, loadTime, error }
      });

      return null;
    }
  }

  getCachedImage(src: string): Blob | null {
    const entry = this.cache.get(src);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(src);
      this.currentCacheSize -= entry.size;
      return null;
    }

    performance.mark('image_cache_hit', {
      detail: { src, loadTime: entry.loadTime }
    });

    return entry.blob;
  }

  async getOrLoadImage(src: string): Promise<Blob | null> {
    const cached = this.getCachedImage(src);
    if (cached !== null) {
      return cached;
    }

    return this.loadImage(src);
  }

  preloadImage(src: string, priority: PreloadRequest['priority'] = 'medium', callback?: PreloadRequest['callback']): void {
    const request: PreloadRequest = { src, priority, callback };

    if (priority === 'critical') {
      this.preloadQueue.unshift(request);
    } else {
      this.preloadQueue.push(request);
    }

    if (!this.isPreloading) {
      this.processPreloadQueue();
    }
  }

  private async processPreloadQueue(): Promise<void> {
    if (this.preloadQueue.length === 0) {
      this.isPreloading = false;
      return;
    }

    this.isPreloading = true;

    const request = this.preloadQueue.shift()!;
    const cached = this.getCachedImage(request.src);

    if (cached) {
      request.callback?.(true);
      this.processPreloadQueue();
      return;
    }

    try {
      await this.loadImage(request.src);
      request.callback?.(true);
    } catch (error) {
      request.callback?.(false);
    }

    this.processPreloadQueue();
  }

  preloadImages(urls: string[], priority: PreloadRequest['priority'] = 'medium'): void {
    urls.forEach(url => this.preloadImage(url, priority));
  }

  clearCache(): void {
    this.cache.clear();
    this.currentCacheSize = 0;
    performance.mark('image_cache_clear');
  }

  getCacheStats(): {
    size: number;
    count: number;
    maxSize: number;
    usage: number;
  } {
    return {
      size: this.currentCacheSize,
      count: this.cache.size,
      maxSize: this.maxCacheSize,
      usage: (this.currentCacheSize / this.maxCacheSize) * 100
    };
  }

  isCached(src: string): boolean {
    const entry = this.cache.get(src);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(src);
      this.currentCacheSize -= entry.size;
      return false;
    }

    return true;
  }
}

export const imageCacheManager = new ImageCacheManager();
export default imageCacheManager;
