/**
 * @提及文本显示组件
 * 用于高亮显示内容中的@提及，并使其可点击
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { mentionService } from '@/services/mentionService';

interface MentionTextProps {
  content: string;
  className?: string;
  mentionClassName?: string;
  onMentionClick?: (username: string) => void;
  enableLinks?: boolean;
}

export const MentionText: React.FC<MentionTextProps> = ({
  content,
  className = '',
  mentionClassName = 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium',
  onMentionClick,
  enableLinks = true,
}) => {
  const navigate = useNavigate();

  // 解析内容，提取@提及和普通文本
  const parseContent = useCallback(() => {
    const parts: React.ReactNode[] = [];
    const mentionRegex = /@([a-zA-Z0-9_\u4e00-\u9fa5]+)/g;
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // 添加@提及前的普通文本
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.substring(lastIndex, match.index)}
          </span>
        );
      }

      const username = match[1];
      const fullMatch = match[0];

      // 添加@提及（可点击）
      if (enableLinks) {
        parts.push(
          <span
            key={`mention-${match.index}`}
            className={mentionClassName}
            onClick={(e) => {
              e.stopPropagation();
              if (onMentionClick) {
                onMentionClick(username);
              } else {
                // 默认行为：跳转到用户主页
                navigate(`/user/${username}`);
              }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (onMentionClick) {
                  onMentionClick(username);
                } else {
                  navigate(`/user/${username}`);
                }
              }
            }}
          >
            {fullMatch}
          </span>
        );
      } else {
        parts.push(
          <span
            key={`mention-${match.index}`}
            className={mentionClassName}
          >
            {fullMatch}
          </span>
        );
      }

      lastIndex = match.index + fullMatch.length;
    }

    // 添加剩余的普通文本
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  }, [content, mentionClassName, enableLinks, onMentionClick, navigate]);

  // 处理URL链接
  const renderWithLinks = useCallback(() => {
    const parts = parseContent();
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const result: React.ReactNode[] = [];

    parts.forEach((part, index) => {
      if (typeof part === 'string' || (part as any)?.type === 'span') {
        const text = typeof part === 'string' ? part : (part as any).props.children;
        
        if (typeof text === 'string') {
          const urlParts = text.split(urlRegex);
          const matches = text.match(urlRegex);

          urlParts.forEach((textPart, i) => {
            if (textPart) {
              result.push(<span key={`${index}-text-${i}`}>{textPart}</span>);
            }
            if (matches && matches[i]) {
              result.push(
                <a
                  key={`${index}-link-${i}`}
                  href={matches[i]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {matches[i]}
                </a>
              );
            }
          });
        } else {
          result.push(part);
        }
      } else {
        result.push(part);
      }
    });

    return result;
  }, [parseContent]);

  // 处理换行符
  const renderWithNewlines = useCallback((children: React.ReactNode[]) => {
    const result: React.ReactNode[] = [];

    children.forEach((child, index) => {
      if (typeof child === 'string' || (child as any)?.type === 'span') {
        const text = typeof child === 'string' ? child : (child as any).props.children;
        
        if (typeof text === 'string') {
          const lines = text.split('\n');
          lines.forEach((line, lineIndex) => {
            result.push(<span key={`${index}-line-${lineIndex}`}>{line}</span>);
            if (lineIndex < lines.length - 1) {
              result.push(<br key={`${index}-br-${lineIndex}`} />);
            }
          });
        } else {
          result.push(child);
        }
      } else {
        result.push(child);
      }
    });

    return result;
  }, []);

  const contentParts = renderWithLinks();
  const finalContent = renderWithNewlines(contentParts);

  return (
    <span className={`whitespace-pre-wrap break-words ${className}`}>
      {finalContent}
    </span>
  );
};

// 简化的@提及文本组件（仅高亮，不可点击）
export const MentionTextSimple: React.FC<Omit<MentionTextProps, 'enableLinks' | 'onMentionClick'>> = ({
  content,
  className = '',
  mentionClassName = 'text-blue-600 dark:text-blue-400 font-medium',
}) => {
  const parts: React.ReactNode[] = [];
  const mentionRegex = /@([a-zA-Z0-9_\u4e00-\u9fa5]+)/g;
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    parts.push(
      <span key={match.index} className={mentionClassName}>
        {match[0]}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return <span className={className}>{parts}</span>;
};

export default MentionText;
