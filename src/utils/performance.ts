/**
 * 防抖函数
 * @param func 需要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖处理后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * 节流函数
 * @param func 需要节流的函数
 * @param limit 限制时间（毫秒）
 * @returns 节流处理后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 带有 leading 和 trailing 选项的节流函数
 * @param func 需要节流的函数
 * @param limit 限制时间（毫秒）
 * @param options 配置选项
 * @returns 节流处理后的函数
 */
export function advancedThrottle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): (...args: Parameters<T>) => void {
  const { leading = true, trailing = true } = options;
  let inThrottle: boolean;
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      if (leading) {
        func(...args);
        lastRan = Date.now();
      }
      inThrottle = true;
      
      const timerFunc = () => {
        if (trailing && Date.now() - lastRan >= limit) {
          func(...args);
          lastRan = Date.now();
        } else {
          inThrottle = false;
        }
      };
      
      lastFunc = setTimeout(timerFunc, limit);
    }
  };
}
