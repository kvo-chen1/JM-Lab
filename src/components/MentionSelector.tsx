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
  isDark?: boolean;
}

export const MentionSelector: React.FC<MentionSelectorProps> = ({
  communityId,
  isOpen,
  searchQuery,
  onSelect,
  onClose,
  position,
  isDark: propIsDark,
}) => {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  
  // 检测深色模式
  const isDark = propIsDark ?? document.documentElement.classList.contains('dark');
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

  console.log('[MentionSelector] Rendering with isOpen:', isOpen, 'position:', { top, left });

  if (!isOpen) return null;

  // 使用内联样式确保清晰显示
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: top || 100,
    left: left || 100,
    width: '320px',
    maxHeight: '400px',
    backgroundColor: '#ffffff',
    border: '2px solid #3b82f6',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
    zIndex: 999999,
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  return (
    <div
      ref={containerRef}
      style={containerStyle}
    >
        {/* 搜索头部 */}
        <div 
          className="flex items-center gap-3 px-5 py-4"
          style={{
            backgroundColor: isDark ? '#111827' : '#f3f4f6',
            borderBottom: `2px solid ${isDark ? '#374151' : '#d1d5db'}`,
          }}
        >
          <Search className="w-5 h-5" style={{ color: isDark ? '#9ca3af' : '#6b7280' }} />
          <span className="text-base font-semibold" style={{ color: isDark ? '#e5e7eb' : '#374151' }}>
            {searchQuery ? `搜索 "${searchQuery}"` : '选择成员'}
          </span>
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-lg transition-colors"
            style={{ 
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X className="w-5 h-5" style={{ color: isDark ? '#9ca3af' : '#6b7280' }} />
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
            <div style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }}>
              {members.map((member, index) => (
                <button
                  key={member.userId}
                  data-index={index}
                  onClick={() => onSelect(member)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all duration-150"
                  style={{
                    backgroundColor: index === selectedIndex 
                      ? (isDark ? '#1e40af' : '#dbeafe')
                      : (isDark ? '#1f2937' : '#ffffff'),
                  }}
                  onMouseEnter={(e) => {
                    setSelectedIndex(index);
                    if (index !== selectedIndex) {
                      e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = index === selectedIndex 
                      ? (isDark ? '#1e40af' : '#dbeafe')
                      : (isDark ? '#1f2937' : '#ffffff');
                  }}
                >
                  <Avatar
                    src={member.avatarUrl}
                    alt={member.username}
                    size="medium"
                  >
                    {member.username[0]?.toUpperCase()}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold truncate" style={{ color: isDark ? '#f9fafb' : '#111827' }}>
                      {member.username}
                    </p>
                    {member.bio && (
                      <p className="text-sm truncate" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                        {member.bio}
                      </p>
                    )}
                  </div>
                  {member.memberRole === 'admin' && (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}>
                      管理员
                    </span>
                  )}
                  {member.memberRole === 'moderator' && (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ backgroundColor: '#22c55e', color: '#ffffff' }}>
                      版主
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div 
          className="px-5 py-4"
          style={{
            backgroundColor: isDark ? '#111827' : '#f3f4f6',
            borderTop: `2px solid ${isDark ? '#374151' : '#d1d5db'}`,
          }}
        >
          <p className="text-sm font-medium" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
            使用 ↑↓ 选择，Enter 确认，Esc 关闭
          </p>
        </div>
      </div>
  );
};

export default MentionSelector;
