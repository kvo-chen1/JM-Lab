export interface FontConfig {
  name: string;
  weights: number[];
  subsets: string[];
  display: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

export class FontOptimizer {
  private static instance: FontOptimizer;
  private loadedFonts: Set<string> = new Set();
  private fontLoadingPromises: Map<string, Promise<void>> = new Map();

  static getInstance(): FontOptimizer {
    if (!FontOptimizer.instance) {
      FontOptimizer.instance = new FontOptimizer();
    }
    return FontOptimizer.instance;
  }

  private constructor() {
    this.initializeFontOptimization();
  }

  private initializeFontOptimization(): void {
    if (typeof window === 'undefined') return;

    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        console.log('[FontOptimizer] All fonts loaded');
      });
    }
  }

  async preloadFont(fontFamily: string, options: Partial<FontConfig> = {}): Promise<void> {
    if (this.loadedFonts.has(fontFamily)) {
      return Promise.resolve();
    }

    if (this.fontLoadingPromises.has(fontFamily)) {
      return this.fontLoadingPromises.get(fontFamily)!;
    }

    const promise = this.loadFont(fontFamily, options);
    this.fontLoadingPromises.set(fontFamily, promise);

    try {
      await promise;
      this.loadedFonts.add(fontFamily);
    } finally {
      this.fontLoadingPromises.delete(fontFamily);
    }
  }

  private async loadFont(fontFamily: string, options: Partial<FontConfig>): Promise<void> {
    if (typeof window === 'undefined' || !('fonts' in document)) {
      return Promise.resolve();
    }

    const { weights = [400], subsets = ['latin'] } = options;

    try {
      const fontFaceDescriptions = weights.flatMap(weight => 
        subsets.map(subset => `${fontFamily} ${weight} ${subset}`)
      );

      const promises = fontFaceDescriptions.map(desc => 
        document.fonts.load(desc)
      );

      await Promise.all(promises);
      console.log(`[FontOptimizer] Loaded font: ${fontFamily}`);
    } catch (error) {
      console.warn(`[FontOptimizer] Failed to load font ${fontFamily}:`, error);
    }
  }

  addFontDisplaySwap(): void {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-display: swap;
      }
      
      * {
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  }

  optimizeFontLoading(): void {
    if (typeof document === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const fontFamily = element.dataset.fontFamily;
            if (fontFamily && !this.loadedFonts.has(fontFamily)) {
              this.preloadFont(fontFamily);
            }
            observer.unobserve(element);
          }
        });
      },
      { rootMargin: '100px' }
    );

    document.querySelectorAll('[data-font-family]').forEach(el => {
      observer.observe(el);
    });
  }

  getFontLoadingStatus(): { loaded: string[]; loading: string[] } {
    return {
      loaded: Array.from(this.loadedFonts),
      loading: Array.from(this.fontLoadingPromises.keys())
    };
  }
}

export const fontOptimizer = FontOptimizer.getInstance();
export default fontOptimizer;
