/**
 * 支持@提及的输入框组件
 * 用于帖子、评论、聊天等场景
 */

import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { MentionSelector } from './MentionSelector';
import { mentionService, CommunityMember } from '@/services/mentionService';

export interface MentionInputRef {
  getContent: () => string;
  setContent: (content: string) => void;
  focus: () => void;
  getMentionedUserIds: () => string[];
}

interface MentionInputProps {
  communityId: string;
  placeholder?: string;
  initialContent?: string;
  onChange?: (content: string) => void;
  onMentionSelect?: (member: CommunityMember) => void;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
  rows?: number;
  selectorPosition?: 'cursor' | 'below' | 'modal-right';
  modalRef?: React.RefObject<HTMLElement>;
}

export const MentionInput = forwardRef<MentionInputRef, MentionInputProps>(
  (
    {
      communityId,
      placeholder = '输入内容，使用 @ 提及成员...',
      initialContent = '',
      onChange,
      onMentionSelect,
      disabled = false,
      maxLength,
      className = '',
      rows = 4,
      selectorPosition: selectorPositionType = 'below',
      modalRef,
    },
    ref
  ) => {
    const [content, setContent] = useState(initialContent);
    const [isMentionSelectorOpen, setIsMentionSelectorOpen] = useState(false);
    const [mentionSearchQuery, setMentionSearchQuery] = useState('');
    const [selectorPosition, setSelectorPosition] = useState({ top: 0, left: 0 });
    const [mentionedUsers, setMentionedUsers] = useState<Map<string, CommunityMember>>(new Map());
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      getContent: () => content,
      setContent: (newContent: string) => {
        setContent(newContent);
        // 重新提取已提及的用户
        extractMentionedUsers(newContent);
      },
      focus: () => textareaRef.current?.focus(),
      getMentionedUserIds: () => Array.from(mentionedUsers.keys()),
    }));

    // 从内容中提取已提及的用户
    const extractMentionedUsers = useCallback(async (text: string) => {
      const usernames = mentionService.extractMentions(text);
      const newMentionedUsers = new Map<string, CommunityMember>();

      // 获取每个提及用户的详细信息
      for (const username of usernames) {
        try {
          const members = await mentionService.searchCommunityMembers(
            communityId,
            username,
            1
          );
          if (members.length > 0 && members[0].username === username) {
            newMentionedUsers.set(members[0].userId, members[0]);
          }
        } catch (error) {
          console.error('Error fetching mentioned user:', error);
        }
      }

      setMentionedUsers(newMentionedUsers);
    }, [communityId]);

    // 处理输入变化
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setContent(newContent);
      onChange?.(newContent);

      // 检查是否触发了@提及
      const cursorPosition = e.target.selectionStart;
      const query = mentionService.getCurrentMentionQuery(newContent, cursorPosition);

      console.log('[MentionInput] Input changed:', newContent, 'Cursor:', cursorPosition, 'Query:', query);

      if (query !== null) {
        console.log('[MentionInput] Opening mention selector');
        // 计算选择器位置
        updateSelectorPosition();
        setMentionSearchQuery(query);
        setIsMentionSelectorOpen(true);
      } else {
        setIsMentionSelectorOpen(false);
      }
    };

    // 更新选择器位置
    const updateSelectorPosition = () => {
      const textarea = textareaRef.current;
      const container = containerRef.current;
      if (!textarea || !container) {
        console.log('[MentionInput] Textarea or container ref is null');
        return;
      }

      let newPosition = { top: 0, left: 0 };

      if (selectorPositionType === 'modal-right') {
        // 显示在模态框右侧 - 查找模态框元素
        const modalElement = document.querySelector('[class*="max-w-lg"], [class*="max-w-2xl"], [class*="max-w-4xl"]');
        if (modalElement) {
          const modalRect = modalElement.getBoundingClientRect();
          newPosition = {
            top: modalRect.top + 150, // 模态框顶部下方150px
            left: modalRect.right + 10, // 模态框右侧10px
          };
          console.log('[MentionInput] Modal found, position:', modalRect);
        } else {
          console.log('[MentionInput] Modal element not found, using textarea position');
          // 如果找不到模态框，使用输入框位置
          const textareaRect = textarea.getBoundingClientRect();
          newPosition = {
            top: textareaRect.bottom + window.scrollY,
            left: textareaRect.left + window.scrollX,
          };
        }
      } else {
        // 默认显示在输入框下方
        const textareaRect = textarea.getBoundingClientRect();
        newPosition = {
          top: textareaRect.bottom + window.scrollY,
          left: textareaRect.left + window.scrollX,
        };
      }
      
      console.log('[MentionInput] Setting selector position:', newPosition, 'type:', selectorPositionType);
      setSelectorPosition(newPosition);
    };

    // 获取光标在textarea中的坐标（相对于视口）
    const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
      const rect = element.getBoundingClientRect();
      const textBeforeCursor = element.value.substring(0, position);
      const lines = textBeforeCursor.split('\n');
      const currentLineIndex = lines.length - 1;
      const currentLineText = lines[currentLineIndex];
      
      // 获取textarea的样式
      const style = getComputedStyle(element);
      const lineHeight = parseInt(style.lineHeight) || 24;
      const fontSize = parseInt(style.fontSize) || 14;
      const paddingTop = parseInt(style.paddingTop) || 12;
      const paddingLeft = parseInt(style.paddingLeft) || 16;
      
      // 计算光标位置
      const top = rect.top + paddingTop + (currentLineIndex * lineHeight) + lineHeight;
      const left = rect.left + paddingLeft + (currentLineText.length * fontSize * 0.6);
      
      console.log('[getCaretCoordinates] Calculated position:', { 
        top, 
        left, 
        rectTop: rect.top,
        rectLeft: rect.left,
        currentLineIndex, 
        currentLineTextLength: currentLineText.length,
        lineHeight,
        fontSize,
        paddingTop,
        paddingLeft
      });
      
      return { top, left };
    };

    // 处理成员选择
    const handleMemberSelect = (member: CommunityMember) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPosition = textarea.selectionStart;
      const { newContent, newCursorPosition } = mentionService.insertMention(
        content,
        cursorPosition,
        member.username
      );

      setContent(newContent);
      onChange?.(newContent);
      setMentionedUsers(prev => new Map(prev).set(member.userId, member));
      setIsMentionSelectorOpen(false);
      onMentionSelect?.(member);

      // 设置新的光标位置
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    };

    // 处理键盘事件
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // 当@选择器打开时，让选择器处理键盘事件
      if (isMentionSelectorOpen) {
        if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
          return;
        }
      }
    };

    // 处理粘贴事件
    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      // 可以在这里处理粘贴内容的特殊逻辑
      // 例如：粘贴的图片、链接等
    };

    // 初始提取提及用户
    useEffect(() => {
      if (initialContent) {
        extractMentionedUsers(initialContent);
      }
    }, [initialContent, extractMentionedUsers]);

    return (
      <div ref={containerRef} className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          rows={rows}
          className={`
            w-full px-4 py-3 
            bg-white dark:bg-gray-800 
            border border-gray-300 dark:border-gray-600 
            rounded-lg 
            text-gray-900 dark:text-gray-100 
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-none
            ${className}
          `}
        />
        
        {/* 字符计数 */}
        {maxLength && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {content.length}/{maxLength}
          </div>
        )}

        {/* @提及选择器 - 使用Portal渲染到body */}
        {isMentionSelectorOpen && (
          <MentionSelector
            communityId={communityId}
            isOpen={isMentionSelectorOpen}
            searchQuery={mentionSearchQuery}
            onSelect={handleMemberSelect}
            onClose={() => setIsMentionSelectorOpen(false)}
            position={selectorPosition}
          />
        )}
      </div>
    );
  }
);

MentionInput.displayName = 'MentionInput';

export default MentionInput;
