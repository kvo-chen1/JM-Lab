import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// 流式内容显示组件属性
interface StreamingContentDisplayProps {
  // 要显示的完整内容
  content: string;
  // 是否正在生成中
  isGenerating: boolean;
  // 生成速度（字符/秒）
  speed?: number;
  // 是否启用打字机效果
  enableTypingEffect?: boolean;
  // 自定义样式类名
  className?: string;
  // 暗色模式
  isDark?: boolean;
  // 内容生成完成回调
  onComplete?: () => void;
  // 内容更新回调
  onUpdate?: (displayedContent: string) => void;
  // 是否支持Markdown渲染
  supportMarkdown?: boolean;
  // 是否显示光标
  showCursor?: boolean;
  // 光标样式
  cursorStyle?: 'block' | 'line' | 'underline';
}

// 中文文本处理工具
class ChineseTextProcessor {
  // 判断字符是否为中文
  static isChinese(char: string): boolean {
    return /[\u4e00-\u9fa5]/.test(char);
  }

  // 判断字符是否为标点符号
  static isPunctuation(char: string): boolean {
    return /[，。！？、；：""''（）【】《》…—～]/.test(char);
  }

  // 判断字符是否为英文单词的一部分
  static isWordChar(char: string): boolean {
    return /[a-zA-Z0-9_]/.test(char);
  }

  // 将文本分割成可显示的单元（考虑中文特性）
  static splitIntoUnits(text: string): string[] {
    const units: string[] = [];
    let i = 0;

    while (i < text.length) {
      const char = text[i];

      // 处理换行符
      if (char === '\n') {
        units.push('\n');
        i++;
        continue;
      }

      // 处理中文字符（包括标点）
      if (this.isChinese(char) || this.isPunctuation(char)) {
        units.push(char);
        i++;
        continue;
      }

      // 处理英文单词和数字
      if (this.isWordChar(char)) {
        let word = char;
        i++;
        while (i < text.length && this.isWordChar(text[i])) {
          word += text[i];
          i++;
        }
        units.push(word);
        continue;
      }

      // 处理空格和其他特殊字符
      if (char === ' ') {
        // 合并连续空格
        let spaces = char;
        i++;
        while (i < text.length && text[i] === ' ') {
          spaces += text[i];
          i++;
        }
        units.push(spaces);
        continue;
      }

      // 其他字符单独处理
      units.push(char);
      i++;
    }

    return units;
  }

  // 计算显示延迟（中文标点停顿更久）
  static getDisplayDelay(char: string, baseSpeed: number): number {
    // 句子结束标点停顿更久
    if (/[。！？…]/.test(char)) {
      return baseSpeed * 3;
    }
    // 逗号、分号停顿稍久
    if (/[，；：]/.test(char)) {
      return baseSpeed * 1.5;
    }
    // 其他标点
    if (this.isPunctuation(char)) {
      return baseSpeed * 1.2;
    }
    // 换行符
    if (char === '\n') {
      return baseSpeed * 2;
    }
    // 普通字符
    return baseSpeed;
  }
}

// 流式内容显示组件
export const StreamingContentDisplay: React.FC<StreamingContentDisplayProps> = ({
  content,
  isGenerating,
  speed = 30,
  enableTypingEffect = true,
  className,
  isDark = false,
  onComplete,
  onUpdate,
  supportMarkdown = true,
  showCursor = true,
  cursorStyle = 'line'
}) => {
  // 已显示的内容
  const [displayedContent, setDisplayedContent] = useState('');
  // 当前显示到的索引
  const [currentIndex, setCurrentIndex] = useState(0);
  // 文本单元数组
  const [textUnits, setTextUnits] = useState<string[]>([]);
  // 是否已完成显示
  const [isComplete, setIsComplete] = useState(false);
  // 用于存储timeout ID
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // 用于存储requestAnimationFrame ID
  const rafRef = useRef<number | null>(null);
  // 开始时间
  const startTimeRef = useRef<number>(0);
  // 内容容器ref
  const contentRef = useRef<HTMLDivElement>(null);

  // 将内容分割成单元
  useEffect(() => {
    const units = ChineseTextProcessor.splitIntoUnits(content);
    setTextUnits(units);
    setCurrentIndex(0);
    setDisplayedContent('');
    setIsComplete(false);
    startTimeRef.current = Date.now();
  }, [content]);

  // 流式显示逻辑
  useEffect(() => {
    // 如果不启用打字机效果，直接显示全部内容
    if (!enableTypingEffect) {
      setDisplayedContent(content);
      setIsComplete(true);
      onComplete?.();
      return;
    }

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // 如果已完成或没有内容，不执行
    if (isComplete || textUnits.length === 0) {
      return;
    }

    // 计算基础延迟（毫秒/字符）
    const baseDelay = 1000 / speed;

    // 流式显示函数
    const streamNext = () => {
      if (currentIndex >= textUnits.length) {
        setIsComplete(true);
        onComplete?.();
        return;
      }

      const unit = textUnits[currentIndex];
      const newDisplayed = textUnits.slice(0, currentIndex + 1).join('');

      setDisplayedContent(newDisplayed);
      setCurrentIndex(prev => prev + 1);
      onUpdate?.(newDisplayed);

      // 计算下一个单元的延迟
      const delay = ChineseTextProcessor.getDisplayDelay(unit, baseDelay);

      timeoutRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(streamNext);
      }, delay);
    };

    // 开始流式显示
    if (isGenerating) {
      rafRef.current = requestAnimationFrame(streamNext);
    } else {
      // 如果不在生成中，直接显示全部
      setDisplayedContent(content);
      setIsComplete(true);
      onComplete?.();
    }

    // 清理函数
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [content, isGenerating, speed, enableTypingEffect, currentIndex, textUnits, isComplete, onComplete, onUpdate]);

  // 自动滚动到底部
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [displayedContent]);

  // 渲染光标
  const renderCursor = () => {
    if (!showCursor || isComplete) return null;

    const cursorClasses = clsx(
      'inline-block animate-pulse',
      {
        'w-2 h-5 bg-current': cursorStyle === 'block',
        'w-0.5 h-5 bg-current': cursorStyle === 'line',
        'w-3 h-0.5 bg-current translate-y-1': cursorStyle === 'underline',
      }
    );

    return <span className={cursorClasses} />;
  };

  // 渲染内容（支持简单的Markdown格式）
  const renderContent = () => {
    if (!supportMarkdown) {
      return (
        <>
          {displayedContent}
          {renderCursor()}
        </>
      );
    }

    // 简单的Markdown解析
    const lines = displayedContent.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, lineIndex) => {
      // 处理标题
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={lineIndex} className="text-lg font-bold mt-3 mb-2">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={lineIndex} className="text-xl font-bold mt-4 mb-2">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <h1 key={lineIndex} className="text-2xl font-bold mt-4 mb-3">
            {line.replace('# ', '')}
          </h1>
        );
      }
      // 处理列表项
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li key={lineIndex} className="ml-4 list-disc">
            {parseInlineMarkdown(line.replace(/^[-*] /, ''))}
          </li>
        );
      }
      // 处理数字列表
      else if (/^\d+\.\s/.test(line)) {
        elements.push(
          <li key={lineIndex} className="ml-4 list-decimal">
            {parseInlineMarkdown(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
      }
      // 处理引用
      else if (line.startsWith('> ')) {
        elements.push(
          <blockquote
            key={lineIndex}
            className={clsx(
              'border-l-4 pl-4 my-2 italic',
              isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-600'
            )}
          >
            {line.replace('> ', '')}
          </blockquote>
        );
      }
      // 处理代码块
      else if (line.startsWith('```')) {
        // 代码块处理（简化版）
        elements.push(
          <pre
            key={lineIndex}
            className={clsx(
              'p-3 rounded-lg my-2 overflow-x-auto font-mono text-sm',
              isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'
            )}
          >
            <code>{line.replace('```', '')}</code>
          </pre>
        );
      }
      // 处理普通段落
      else if (line.trim()) {
        elements.push(
          <p key={lineIndex} className="mb-2 leading-relaxed">
            {parseInlineMarkdown(line)}
          </p>
        );
      }
      // 空行
      else {
        elements.push(<br key={lineIndex} />);
      }
    });

    return (
      <>
        {elements}
        {renderCursor()}
      </>
    );
  };

  // 解析行内Markdown（粗体、斜体、代码等）
  const parseInlineMarkdown = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    // 处理粗体 **text**
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      // 添加匹配前的文本
      if (match.index > lastIndex) {
        parts.push(
          <span key={key++}>
            {parseInlineItalic(remaining.substring(lastIndex, match.index))}
          </span>
        );
      }
      // 添加粗体文本
      parts.push(
        <strong key={key++} className="font-bold">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    // 添加剩余文本
    if (lastIndex < text.length) {
      parts.push(
        <span key={key++}>
          {parseInlineItalic(remaining.substring(lastIndex))}
        </span>
      );
    }

    return parts.length > 0 ? parts : text;
  };

  // 解析斜体
  const parseInlineItalic = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let key = 0;

    // 处理斜体 *text* 或 _text_
    const italicRegex = /[*_](.*?)[*_]/g;
    let lastIndex = 0;
    let match;

    while ((match = italicRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={key++}>
            {parseInlineCode(text.substring(lastIndex, match.index))}
          </span>
        );
      }
      parts.push(
        <em key={key++} className="italic">
          {match[1]}
        </em>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(
        <span key={key++}>
          {parseInlineCode(text.substring(lastIndex))}
        </span>
      );
    }

    return parts.length > 0 ? parts : text;
  };

  // 解析行内代码
  const parseInlineCode = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let key = 0;

    // 处理行内代码 `code`
    const codeRegex = /`(.*?)`/g;
    let lastIndex = 0;
    let match;

    while ((match = codeRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={key++}>{text.substring(lastIndex, match.index)}</span>);
      }
      parts.push(
        <code
          key={key++}
          className={clsx(
            'px-1.5 py-0.5 rounded text-sm font-mono',
            isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'
          )}
        >
          {match[1]}
        </code>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(<span key={key++}>{text.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : text;
  };

  // 计算显示进度
  const progress = textUnits.length > 0 ? (currentIndex / textUnits.length) * 100 : 0;

  return (
    <div className={clsx('relative', className)}>
      {/* 内容显示区域 */}
      <div
        ref={contentRef}
        className={clsx(
          'overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent',
          isDark ? 'text-gray-100' : 'text-gray-800'
        )}
      >
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {renderContent()}
        </div>
      </div>

      {/* 进度指示器 */}
      {isGenerating && !isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 flex items-center gap-2"
        >
          <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={clsx(
                'h-full rounded-full',
                isDark ? 'bg-blue-500' : 'bg-blue-600'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <span className={clsx(
            'text-xs font-medium',
            isDark ? 'text-gray-400' : 'text-gray-500'
          )}>
            {Math.round(progress)}%
          </span>
        </motion.div>
      )}

      {/* 完成指示 */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            'mt-2 text-xs flex items-center gap-1',
            isDark ? 'text-green-400' : 'text-green-600'
          )}
        >
          <i className="fas fa-check-circle" />
          <span>生成完成</span>
        </motion.div>
      )}
    </div>
  );
};

// 流式消息气泡组件
interface StreamingMessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  isGenerating?: boolean;
  isDark?: boolean;
  avatar?: React.ReactNode;
  timestamp?: number;
  speed?: number;
  enableTypingEffect?: boolean;
  onComplete?: () => void;
}

export const StreamingMessageBubble: React.FC<StreamingMessageBubbleProps> = ({
  role,
  content,
  isGenerating = false,
  isDark = false,
  avatar,
  timestamp,
  speed = 30,
  enableTypingEffect = true,
  onComplete
}) => {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* 头像 */}
      {avatar && (
        <div className="flex-shrink-0">
          {avatar}
        </div>
      )}

      {/* 消息内容 */}
      <div className={clsx(
        'max-w-[80%]',
        isUser ? 'items-end' : 'items-start'
      )}>
        {/* 用户名/时间 */}
        <div className={clsx(
          'flex items-center gap-2 mb-1',
          isUser ? 'justify-end' : 'justify-start'
        )}>
          <span className={clsx(
            'text-xs font-medium',
            isDark ? 'text-gray-400' : 'text-gray-500'
          )}>
            {isUser ? '我' : 'AI助手'}
          </span>
          {timestamp && (
            <span className={clsx(
              'text-[10px]',
              isDark ? 'text-gray-600' : 'text-gray-400'
            )}>
              {new Date(timestamp).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </div>

        {/* 消息气泡 */}
        <div className={clsx(
          'rounded-2xl px-4 py-3 shadow-sm',
          isUser
            ? clsx(
                'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-md',
                isDark ? 'shadow-purple-500/20' : 'shadow-purple-500/30'
              )
            : clsx(
                isDark
                  ? 'bg-gray-800 text-gray-100 rounded-bl-md border border-gray-700'
                  : 'bg-white text-gray-800 rounded-bl-md border border-gray-200',
                'shadow-lg'
              )
        )}>
          {isUser ? (
            // 用户消息直接显示
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {content}
            </div>
          ) : (
            // AI消息使用流式显示
            <StreamingContentDisplay
              content={content}
              isGenerating={isGenerating}
              speed={speed}
              enableTypingEffect={enableTypingEffect}
              isDark={isDark}
              onComplete={onComplete}
              supportMarkdown={true}
              showCursor={isGenerating}
              cursorStyle="line"
              className="text-sm leading-relaxed"
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

// 流式内容生成Hook
interface UseStreamingContentOptions {
  speed?: number;
  enableTypingEffect?: boolean;
  onComplete?: () => void;
  onUpdate?: (content: string) => void;
}

interface UseStreamingContentReturn {
  displayedContent: string;
  isComplete: boolean;
  progress: number;
  startStreaming: (content: string) => void;
  stopStreaming: () => void;
  reset: () => void;
}

export const useStreamingContent = (
  options: UseStreamingContentOptions = {}
): UseStreamingContentReturn => {
  const {
    speed = 30,
    enableTypingEffect = true,
    onComplete,
    onUpdate
  } = options;

  const [displayedContent, setDisplayedContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [textUnits, setTextUnits] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);

  // 开始流式显示
  const startStreaming = useCallback((content: string) => {
    const units = ChineseTextProcessor.splitIntoUnits(content);
    setTextUnits(units);
    setCurrentIndex(0);
    setDisplayedContent('');
    setIsComplete(false);
    setProgress(0);
    setIsStreaming(true);
  }, []);

  // 停止流式显示
  const stopStreaming = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    setIsStreaming(false);
  }, []);

  // 重置
  const reset = useCallback(() => {
    stopStreaming();
    setDisplayedContent('');
    setIsComplete(false);
    setProgress(0);
    setCurrentIndex(0);
    setTextUnits([]);
  }, [stopStreaming]);

  // 流式显示逻辑
  useEffect(() => {
    if (!isStreaming || !enableTypingEffect) {
      if (!enableTypingEffect && textUnits.length > 0) {
        setDisplayedContent(textUnits.join(''));
        setIsComplete(true);
        setProgress(100);
        onComplete?.();
      }
      return;
    }

    if (currentIndex >= textUnits.length) {
      setIsComplete(true);
      setIsStreaming(false);
      onComplete?.();
      return;
    }

    const baseDelay = 1000 / speed;
    const unit = textUnits[currentIndex];
    const delay = ChineseTextProcessor.getDisplayDelay(unit, baseDelay);

    timeoutRef.current = setTimeout(() => {
      const newContent = textUnits.slice(0, currentIndex + 1).join('');
      setDisplayedContent(newContent);
      setCurrentIndex(prev => prev + 1);
      setProgress(((currentIndex + 1) / textUnits.length) * 100);
      onUpdate?.(newContent);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isStreaming, currentIndex, textUnits, speed, enableTypingEffect, onComplete, onUpdate]);

  return {
    displayedContent,
    isComplete,
    progress,
    startStreaming,
    stopStreaming,
    reset
  };
};

// 导出默认组件
export default StreamingContentDisplay;
