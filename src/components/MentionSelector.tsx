/**
 * @提及选择器组件
 * 当用户输入@时显示成员列表供选择
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, X } from 'lucide-react';
import { mentionService, CommunityMember } from '@/services/mentionService';
import Avatar from '@/components/ui/Avatar';
import { useDebounce } from '@/hooks/useDebounce';

interface MentionSelectorProps {
  communityId: string;
  isOpen: boolean;
  searchQuery: string;
  onSelect: (member: CommunityMember) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

export const MentionSelector: React.FC<MentionSelectorProps> = ({
  communityId,
  isOpen,
  searchQuery,
  onSelect,
  onClose,
  position,
}) => {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 150);

  // 搜索成员
  useEffect(() => {
    console.log('[MentionSelector] Search effect triggered:', { isOpen, communityId, debouncedSearchQuery });
    if (!isOpen || !communityId) return;

    const searchMembers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('[MentionSelector] Searching members for community:', communityId);
        const results = await mentionService.searchCommunityMembers(
          communityId,
          debouncedSearchQuery,
          10
        );
        console.log('[MentionSelector] Search results:', results);
        setMembers(results);
        setSelectedIndex(0);
      } catch (err) {
        setError('搜索成员失败');
        console.error('Error searching members:', err);
      } finally {
        setIsLoading(false);
      }
    };

    searchMembers();
  }, [communityId, debouncedSearchQuery, isOpen]);

  // 键盘导航
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % members.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + members.length) % members.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (members[selectedIndex]) {
            onSelect(members[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [isOpen, members, selectedIndex, onSelect, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // 滚动选中项到视图
  useEffect(() => {
    const selectedElement = containerRef.current?.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  console.log('[MentionSelector] Rendering with position:', position, 'isOpen:', isOpen, 'members:', members, 'members.length:', members.length);

  if (!isOpen) return null;

  // 计算选择器位置，确保不超出视口
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const selectorWidth = 320;
  const selectorHeight = 280;
  
  let top = position?.top ?? 100;
  let left = position?.left ?? 100;
  
  // 确保不超出右边界
  if (left + selectorWidth > viewportWidth - 20) {
    left = viewportWidth - selectorWidth - 20;
  }
  
  // 确保不超出下边界（如果下方空间不足，显示在上方）
  if (top + selectorHeight > viewportHeight - 20) {
    top = top - selectorHeight - 150; // 输入框高度约150px
  }
  
  // 确保不超出左边界和上边界
  left = Math.max(20, left);
  top = Math.max(20, top);

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{
          top,
          left,
          minWidth: '280px',
          maxWidth: '320px',
        }}
      >
        {/* 搜索头部 */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <Search className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {searchQuery ? `搜索 "${searchQuery}"` : '选择成员'}
          </span>
          <button
            onClick={onClose}
            className="ml-auto p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* 成员列表 */}
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <User className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">{error}</p>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <User className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">
                {searchQuery ? '未找到匹配的成员' : '暂无成员'}
              </p>
            </div>
          ) : (
            <div className="py-1">
              {members.map((member, index) => (
                <button
                  key={member.userId}
                  data-index={index}
                  onClick={() => onSelect(member)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Avatar
                    src={member.avatarUrl}
                    alt={member.username}
                    size="small"
                  >
                    {member.username[0]?.toUpperCase()}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {member.username}
                    </p>
                    {member.bio && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {member.bio}
                      </p>
                    )}
                  </div>
                  {member.memberRole === 'admin' && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                      管理员
                    </span>
                  )}
                  {member.memberRole === 'moderator' && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                      版主
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            使用 ↑↓ 选择，Enter 确认，Esc 关闭
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MentionSelector;
