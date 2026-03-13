import { useState, useEffect, useCallback } from 'react';

export interface AccessibilityConfig {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
}

const DEFAULT_CONFIG: AccessibilityConfig = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  screenReaderOptimized: false,
  keyboardNavigation: true,
};

class AccessibilityManager {
  private config: AccessibilityConfig;
  private listeners: Set<(config: AccessibilityConfig) => void> = new Set();

  constructor() {
    const saved = localStorage.getItem('accessibility-config');
    this.config = saved ? JSON.parse(saved) : { ...DEFAULT_CONFIG };
    this.applyConfig();
    this.checkSystemPreferences();
  }

  private checkSystemPreferences(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (!this.config.reducedMotion) {
        this.setConfig({ reducedMotion: true });
      }
    }
  }

  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  setConfig(updates: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...updates };
    localStorage.setItem('accessibility-config', JSON.stringify(this.config));
    this.applyConfig();
    this.notifyListeners();
  }

  private applyConfig(): void {
    const root = document.documentElement;

    root.classList.toggle('high-contrast', this.config.highContrast);
    root.classList.toggle('large-text', this.config.largeText);
    root.classList.toggle('reduced-motion', this.config.reducedMotion);
    root.classList.toggle('screen-reader-optimized', this.config.screenReaderOptimized);

    if (this.config.largeText) {
      root.style.fontSize = '120%';
    } else {
      root.style.fontSize = '';
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.config));
  }

  subscribe(listener: (config: AccessibilityConfig) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  setFocus(element: HTMLElement): void {
    if (element) {
      element.setAttribute('tabindex', '-1');
      element.focus();
    }
  }

  trapFocus(container: HTMLElement, initialFocus?: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    if (initialFocus) {
      initialFocus.focus();
    } else if (firstElement) {
      firstElement.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  skipLink(targetId: string): void {
    const target = document.getElementById(targetId);
    if (target) {
      this.setFocus(target);
    }
  }

  resetToDefaults(): void {
    this.config = { ...DEFAULT_CONFIG };
    localStorage.removeItem('accessibility-config');
    this.applyConfig();
    this.notifyListeners();
  }
}

export const accessibilityManager = new AccessibilityManager();

export function useHighContrast() {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const config = accessibilityManager.getConfig();
    setHighContrast(config.highContrast);

    const unsubscribe = accessibilityManager.subscribe((config) => {
      setHighContrast(config.highContrast);
    });

    return unsubscribe;
  }, []);

  const toggleHighContrast = useCallback(() => {
    const config = accessibilityManager.getConfig();
    accessibilityManager.setConfig({ highContrast: !config.highContrast });
  }, []);

  return { highContrast, toggleHighContrast };
}

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const config = accessibilityManager.getConfig();
    setReducedMotion(config.reducedMotion);

    const unsubscribe = accessibilityManager.subscribe((config) => {
      setReducedMotion(config.reducedMotion);
    });

    return unsubscribe;
  }, []);

  const toggleReducedMotion = useCallback(() => {
    const config = accessibilityManager.getConfig();
    accessibilityManager.setConfig({ reducedMotion: !config.reducedMotion });
  }, []);

  return { reducedMotion, toggleReducedMotion };
}

export function useScreenReader() {
  const [screenReaderOptimized, setScreenReaderOptimized] = useState(false);

  useEffect(() => {
    const config = accessibilityManager.getConfig();
    setScreenReaderOptimized(config.screenReaderOptimized);

    const unsubscribe = accessibilityManager.subscribe((config) => {
      setScreenReaderOptimized(config.screenReaderOptimized);
    });

    return unsubscribe;
  }, []);

  return { screenReaderOptimized };
}

export function useKeyboardNavigation() {
  const [keyboardNavigation, setKeyboardNavigation] = useState(true);

  useEffect(() => {
    const config = accessibilityManager.getConfig();
    setKeyboardNavigation(config.keyboardNavigation);

    const unsubscribe = accessibilityManager.subscribe((config) => {
      setKeyboardNavigation(config.keyboardNavigation);
    });

    return unsubscribe;
  }, []);

  return { keyboardNavigation };
}

export function createAriaAttributes(options: {
  label?: string;
  describedBy?: string;
  role?: string;
  live?: 'polite' | 'assertive' | 'off';
  expanded?: boolean;
  hidden?: boolean;
  pressed?: boolean;
  selected?: boolean;
  current?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  hasPopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
}): Record<string, string | boolean> {
  const attrs: Record<string, string | boolean> = {};

  if (options.label) attrs['aria-label'] = options.label;
  if (options.describedBy) attrs['aria-describedby'] = options.describedBy;
  if (options.role) attrs['role'] = options.role;
  if (options.live) attrs['aria-live'] = options.live;
  if (options.expanded !== undefined) attrs['aria-expanded'] = options.expanded;
  if (options.hidden !== undefined) attrs['aria-hidden'] = options.hidden;
  if (options.pressed !== undefined) attrs['aria-pressed'] = options.pressed;
  if (options.selected !== undefined) attrs['aria-selected'] = options.selected;
  if (options.current !== undefined) attrs['aria-current'] = options.current;
  if (options.hasPopup !== undefined) attrs['aria-haspopup'] = options.hasPopup;

  return attrs;
}

export function withAccessibility<T extends HTMLElement>(
  element: T,
  options: {
    label?: string;
    describedBy?: string;
    role?: string;
    live?: 'polite' | 'assertive' | 'off';
  }
): T {
  if (options.label) {
    element.setAttribute('aria-label', options.label);
  }
  if (options.describedBy) {
    element.setAttribute('aria-describedby', options.describedBy);
  }
  if (options.role) {
    element.setAttribute('role', options.role);
  }
  if (options.live) {
    element.setAttribute('aria-live', options.live);
  }
  return element;
}

export default accessibilityManager;
