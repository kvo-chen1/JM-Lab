import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTypewriterOptions {
  /** 打字速度（毫秒/字符） */
  speed?: number;
  /** 是否立即显示全部 */
  immediate?: boolean;
  /** 完成后的回调 */
  onComplete?: () => void;
  /** 每打一个字后的回调 */
  onChar?: (char: string, index: number) => void;
}

interface UseTypewriterReturn {
  /** 当前显示的文本 */
  displayText: string;
  /** 是否已完成 */
  isComplete: boolean;
  /** 当前打字索引 */
  currentIndex: number;
  /** 跳过动画，立即显示全部 */
  skip: () => void;
  /** 暂停打字 */
  pause: () => void;
  /** 继续打字 */
  resume: () => void;
  /** 是否暂停中 */
  isPaused: boolean;
}

/**
 * 打字机效果 Hook
 * 
 * 使用示例：
 * ```typescript
 * const { displayText, isComplete, skip } = useTypewriter('Hello World', {
 *   speed: 50,
 *   onComplete: () => console.log('Done!')
 * });
 * ```
 */
export const useTypewriter = (
  text: string,
  options: UseTypewriterOptions = {}
): UseTypewriterReturn => {
  const { speed = 30, immediate = false, onComplete, onChar } = options;
  
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSkippedRef = useRef(false);
  
  // 清理定时器
  const clearTimeoutRef = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  // 跳过动画，立即显示全部
  const skip = useCallback(() => {
    clearTimeoutRef();
    isSkippedRef.current = true;
    setDisplayText(text);
    setCurrentIndex(text.length);
    setIsComplete(true);
    onComplete?.();
  }, [text, onComplete, clearTimeoutRef]);
  
  // 暂停
  const pause = useCallback(() => {
    setIsPaused(true);
    clearTimeoutRef();
  }, [clearTimeoutRef]);
  
  // 继续
  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);
  
  // 打字动画
  useEffect(() => {
    // 如果立即显示或已跳过，直接显示全部
    if (immediate || isSkippedRef.current) {
      setDisplayText(text);
      setCurrentIndex(text.length);
      setIsComplete(true);
      onComplete?.();
      return;
    }
    
    // 重置状态
    setDisplayText('');
    setCurrentIndex(0);
    setIsComplete(false);
    isSkippedRef.current = false;
    
    let index = 0;
    
    const typeNextChar = () => {
      if (isSkippedRef.current || isPaused) return;
      
      if (index < text.length) {
        const char = text[index];
        setDisplayText(prev => prev + char);
        setCurrentIndex(index + 1);
        onChar?.(char, index);
        index++;
        
        // 计算延迟（标点符号稍微停顿）
        let delay = speed;
        if (/[。！？.!?]/.test(char)) {
          delay = speed * 3;
        } else if (/[，,;；]/.test(char)) {
          delay = speed * 2;
        }
        
        timeoutRef.current = setTimeout(typeNextChar, delay);
      } else {
        setIsComplete(true);
        onComplete?.();
      }
    };
    
    // 开始打字
    timeoutRef.current = setTimeout(typeNextChar, speed);
    
    return () => {
      clearTimeoutRef();
    };
  }, [text, speed, immediate, onComplete, onChar, isPaused, clearTimeoutRef]);
  
  return {
    displayText,
    isComplete,
    currentIndex,
    skip,
    pause,
    resume,
    isPaused,
  };
};

/**
 * 批量打字机效果 Hook
 * 用于批量生成场景，支持多行文本的打字机效果
 */
export const useBatchTypewriter = (
  lines: string[],
  options: UseTypewriterOptions & {
    /** 行与行之间的延迟 */
    lineDelay?: number;
  } = {}
): {
  displayLines: string[];
  isComplete: boolean;
  currentLineIndex: number;
  skip: () => void;
} => {
  const { lineDelay = 100, ...typewriterOptions } = options;
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayLines, setDisplayLines] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  
  const currentLine = lines[currentLineIndex] || '';
  const { displayText, isComplete: lineComplete, skip } = useTypewriter(
    currentLine,
    {
      ...typewriterOptions,
      onComplete: () => {
        if (currentLineIndex < lines.length - 1) {
          // 还有下一行，延迟后继续
          setTimeout(() => {
            setDisplayLines(prev => [...prev, displayText]);
            setCurrentLineIndex(prev => prev + 1);
          }, lineDelay);
        } else {
          // 全部完成
          setDisplayLines(prev => [...prev, displayText]);
          setIsComplete(true);
          options.onComplete?.();
        }
      },
    }
  );
  
  return {
    displayLines: [...displayLines, displayText],
    isComplete,
    currentLineIndex,
    skip,
  };
};

export default useTypewriter;
