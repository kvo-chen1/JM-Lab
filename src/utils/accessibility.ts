/**
 * 无障碍访问工具
 * 提供ARIA支持、键盘导航、屏幕阅读器优化等功能
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * ARIA角色和状态常量
 */
export const ARIA_ROLES = {
  // 文档结构角色
  ARTICLE: 'article',
  BANNER: 'banner',
  COMPLEMENTARY: 'complementary',
  CONTENTINFO: 'contentinfo',
  MAIN: 'main',
  NAVIGATION: 'navigation',
  REGION: 'region',
  SEARCH: 'search',
  
  // 小组件角色
  BUTTON: 'button',
  CHECKBOX: 'checkbox',
  GRID: 'grid',
  GRIDCELL: 'gridcell',
  LINK: 'link',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  PROGRESSBAR: 'progressbar',
  RADIO: 'radio',
  SLIDER: 'slider',
  SPINBUTTON: 'spinbutton',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
  TEXTBOX: 'textbox',
  
  // 复合小组件角色
  COMBOBOX: 'combobox',
  LISTBOX: 'listbox',
  RADIOGROUP: 'radiogroup',
  TABLIST: 'tablist',
  TREE: 'tree',
  
  // 实时区域角色
  ALERT: 'alert',
  LOG: 'log',
  MARQUEE: 'marquee',
  STATUS: 'status',
  TIMER: 'timer'
} as const;

/**
 * ARIA状态常量
 */
export const ARIA_STATES = {
  // 小部件属性
  AUTOCOMPLETE: 'aria-autocomplete',
  CHECKED: 'aria-checked',
  DISABLED: 'aria-disabled',
  EXPANDED: 'aria-expanded',
  HASPOPUP: 'aria-haspopup',
  HIDDEN: 'aria-hidden',
  INVALID: 'aria-invalid',
  LABEL: 'aria-label',
  LEVEL: 'aria-level',
  MULTILINE: 'aria-multiline',
  MULTISELECTABLE: 'aria-multiselectable',
  ORIENTATION: 'aria-orientation',
  PLACEHOLDER: 'aria-placeholder',
  PRESSED: 'aria-pressed',
  READONLY: 'aria-readonly',
  REQUIRED: 'aria-required',
  SELECTED: 'aria-selected',
  SORT: 'aria-sort',
  VALUEMAX: 'aria-valuemax',
  VALUEMIN: 'aria-valuemin',
  VALUENOW: 'aria-valuenow',
  VALUETEXT: 'aria-valuetext',
  
  // 实时区域属性
  ATOMIC: 'aria-atomic',
  BUSY: 'aria-busy',
  LIVE: 'aria-live',
  RELEVANT: 'aria-relevant'
} as const;

/**
 * 键盘导航键码
 */
export const KEY_CODES = {
  TAB: 9,
  ENTER: 13,
  ESCAPE: 27,
  SPACE: 32,
  ARROW_LEFT: 37,
  ARROW_UP: 38,
  ARROW_RIGHT: 39,
  ARROW_DOWN: 40,
  HOME: 36,
  END: 35,
  PAGE_UP: 33,
  PAGE_DOWN: 34
};

/**
 * 键盘导航Hook
 */
export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    loop?: boolean;
    autoFocus?: boolean;
    focusOnHover?: boolean;
  } = {}
) {
  const {
    orientation = 'vertical',
    loop = true,
    autoFocus = false,
    focusOnHover = false
  } = options;

  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);

  // 获取可聚焦元素
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const focusableSelector = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(containerRef.current.querySelectorAll(focusableSelector)) as HTMLElement[];
  }, [containerRef]);

  // 更新可聚焦元素列表
  useEffect(() => {
    const elements = getFocusableElements();
    setFocusableElements(elements);

    if (autoFocus && elements.length > 0) {
      elements[0].focus();
      setFocusedIndex(0);
    }
  }, [getFocusableElements, autoFocus]);

  // 处理键盘事件
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (focusableElements.length === 0) return;

    let newIndex = focusedIndex;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        if (orientation === 'horizontal' && event.key === 'ArrowDown') return;
        if (orientation === 'vertical' && event.key === 'ArrowRight') return;
        
        event.preventDefault();
        newIndex = focusedIndex + 1;
        if (newIndex >= focusableElements.length) {
          newIndex = loop ? 0 : focusedIndex;
        }
        break;

      case 'ArrowUp':
      case 'ArrowLeft':
        if (orientation === 'horizontal' && event.key === 'ArrowUp') return;
        if (orientation === 'vertical' && event.key === 'ArrowLeft') return;
        
        event.preventDefault();
        newIndex = focusedIndex - 1;
        if (newIndex < 0) {
          newIndex = loop ? focusableElements.length - 1 : 0;
        }
        break;

      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;

      case 'End':
        event.preventDefault();
        newIndex = focusableElements.length - 1;
        break;

      case 'Enter':
      case ' ':
        if (focusedIndex >= 0 && focusedIndex < focusableElements.length) {
          event.preventDefault();
          focusableElements[focusedIndex].click();
        }
        break;

      default:
        return;
    }

    if (newIndex !== focusedIndex && newIndex >= 0 && newIndex < focusableElements.length) {
      focusableElements[newIndex].focus();
      setFocusedIndex(newIndex);
    }
  }, [focusableElements, focusedIndex, loop, orientation]);

  // 绑定键盘事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, handleKeyDown]);

  // 处理鼠标悬停焦点
  useEffect(() => {
    if (!focusOnHover) return;

    const handleMouseEnter = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const index = focusableElements.indexOf(target);
      if (index !== -1) {
        target.focus();
        setFocusedIndex(index);
      }
    };

    focusableElements.forEach(element => {
      element.addEventListener('mouseenter', handleMouseEnter);
    });

    return () => {
      focusableElements.forEach(element => {
        element.removeEventListener('mouseenter', handleMouseEnter);
      });
    };
  }, [focusableElements, focusOnHover]);

  return {
    focusedIndex,
    focusableElements,
    focusNext: () => {
      if (focusedIndex < focusableElements.length - 1) {
        focusableElements[focusedIndex + 1].focus();
        setFocusedIndex(focusedIndex + 1);
      }
    },
    focusPrevious: () => {
      if (focusedIndex > 0) {
        focusableElements[focusedIndex - 1].focus();
        setFocusedIndex(focusedIndex - 1);
      }
    },
    focusFirst: () => {
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
        setFocusedIndex(0);
      }
    },
    focusLast: () => {
      if (focusableElements.length > 0) {
        focusableElements[focusableElements.length - 1].focus();
        setFocusedIndex(focusableElements.length - 1);
      }
    }
  };
}

/**
 * 屏幕阅读器Hook
 */
export function useScreenReader() {
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const announcementId = useRef(0);

  /**
   * 宣布消息给屏幕阅读器
   */
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const id = `announcement-${++announcementId.current}`;
    
    // 创建临时元素用于屏幕阅读器
    const element = document.createElement('div');
    element.id = id;
    element.setAttribute('aria-live', priority);
    element.setAttribute('aria-atomic', 'true');
    element.className = 'sr-only';
    element.textContent = message;
    
    document.body.appendChild(element);
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(element);
    }, 1000);
    
    setAnnouncements(prev => [...prev, message]);
  }, []);

  /**
   * 清除所有公告
   */
  const clearAnnouncements = useCallback(() => {
    setAnnouncements([]);
  }, []);

  return {
    announce,
    clearAnnouncements,
    announcements
  };
}

/**
 * ARIA属性生成器
 */
export function createAriaAttributes(config: {
  role?: string;
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  checked?: boolean;
  pressed?: boolean;
  valueNow?: number;
  valueMin?: number;
  valueMax?: number;
  valueText?: string;
  level?: number;
  orientation?: 'horizontal' | 'vertical';
  live?: 'off' | 'polite' | 'assertive';
  atomic?: boolean;
  busy?: boolean;
  relevant?: string;
  hidden?: boolean;
  hasPopup?: boolean | string;
  multiselectable?: boolean;
  readonly?: boolean;
  placeholder?: string;
  autocomplete?: string;
  sort?: 'none' | 'ascending' | 'descending' | 'other';
  [key: string]: any;
}) {
  const attributes: Record<string, string | boolean | undefined> = {};

  if (config.role) attributes.role = config.role;
  if (config.label) attributes['aria-label'] = config.label;
  if (config.labelledBy) attributes['aria-labelledby'] = config.labelledBy;
  if (config.describedBy) attributes['aria-describedby'] = config.describedBy;
  if (config.expanded !== undefined) attributes['aria-expanded'] = config.expanded;
  if (config.selected !== undefined) attributes['aria-selected'] = config.selected;
  if (config.disabled !== undefined) attributes['aria-disabled'] = config.disabled;
  if (config.invalid !== undefined) attributes['aria-invalid'] = config.invalid;
  if (config.required !== undefined) attributes['aria-required'] = config.required;
  if (config.checked !== undefined) attributes['aria-checked'] = config.checked;
  if (config.pressed !== undefined) attributes['aria-pressed'] = config.pressed;
  if (config.valueNow !== undefined) attributes['aria-valuenow'] = String(config.valueNow);
  if (config.valueMin !== undefined) attributes['aria-valuemin'] = String(config.valueMin);
  if (config.valueMax !== undefined) attributes['aria-valuemax'] = String(config.valueMax);
  if (config.valueText !== undefined) attributes['aria-valuetext'] = config.valueText;
  if (config.level !== undefined) attributes['aria-level'] = String(config.level);
  if (config.orientation) attributes['aria-orientation'] = config.orientation;
  if (config.live) attributes['aria-live'] = config.live;
  if (config.atomic !== undefined) attributes['aria-atomic'] = config.atomic;
  if (config.busy !== undefined) attributes['aria-busy'] = config.busy;
  if (config.relevant) attributes['aria-relevant'] = config.relevant;
  if (config.hidden !== undefined) attributes['aria-hidden'] = config.hidden;
  if (config.hasPopup !== undefined) attributes['aria-haspopup'] = config.hasPopup;
  if (config.multiselectable !== undefined) attributes['aria-multiselectable'] = config.multiselectable;
  if (config.readonly !== undefined) attributes['aria-readonly'] = config.readonly;
  if (config.placeholder) attributes['aria-placeholder'] = config.placeholder;
  if (config.autocomplete) attributes['aria-autocomplete'] = config.autocomplete;
  if (config.sort) attributes['aria-sort'] = config.sort;

  return attributes;
}

/**
 * 焦点管理Hook
 */
export function useFocusManager() {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);
  const [focusHistory, setFocusHistory] = useState<HTMLElement[]>([]);

  /**
   * 设置焦点到指定元素
   */
  const focusElement = useCallback((element: HTMLElement | null) => {
    if (element) {
      element.focus();
      setFocusedElement(element);
      
      setFocusHistory(prev => {
        const newHistory = [...prev];
        const index = newHistory.indexOf(element);
        if (index > -1) {
          newHistory.splice(index, 1);
        }
        newHistory.push(element);
        return newHistory.slice(-10); // 保留最近10个焦点元素
      });
    }
  }, []);

  /**
   * 返回上一个焦点元素
   */
  const focusPrevious = useCallback(() => {
    if (focusHistory.length > 1) {
      const previousElement = focusHistory[focusHistory.length - 2];
      focusElement(previousElement);
      setFocusHistory(prev => prev.slice(0, -1));
    }
  }, [focusElement, focusHistory]);

  /**
   * 捕获焦点到容器内
   */
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return {
    focusedElement,
    focusHistory,
    focusElement,
    focusPrevious,
    trapFocus
  };
}

/**
 * 高对比度模式检测
 */
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return {
    isHighContrast,
    highContrastClasses: isHighContrast ? 'high-contrast' : ''
  };
}

/**
 * 减少动画检测
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return {
    prefersReducedMotion,
    motionSafeClasses: prefersReducedMotion ? '' : 'motion-safe'
  };
}

/**
 * 颜色模式检测
 */
export function useColorScheme() {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | 'no-preference'>('no-preference');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setColorScheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => {
      setColorScheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return {
    colorScheme,
    isDarkMode: colorScheme === 'dark',
    isLightMode: colorScheme === 'light'
  };
}

export default {
  ARIA_ROLES,
  ARIA_STATES,
  KEY_CODES,
  useKeyboardNavigation,
  useScreenReader,
  createAriaAttributes,
  useFocusManager,
  useHighContrast,
  useReducedMotion,
  useColorScheme
};
