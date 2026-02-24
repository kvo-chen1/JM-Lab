/**
 * 关注用户横向滚动列表组件
 * 参考哔哩哔哩设计风格
 */

import { useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import type { FeedAuthor } from '@/types/feed';
import { ChevronLeft, ChevronRight, Wind } from 'lucide-react';

interface FollowingUsersBarProps {
  users: FeedAuthor[];
  selectedUserId?: string | null;
  onSelectUser: (userId: string | null) => void;
}

export function FollowingUsersBar({ users, selectedUserId, onSelectUser }: FollowingUsersBarProps) {
  const { isDark } = useTheme();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // 如果没有关注用户，不显示此组件
  if (users.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* 左箭头 */}
      <button
        onClick={() => scroll('left')}
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-md ${
          isDark
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-400'
            : 'bg-white hover:bg-gray-50 text-gray-500'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* 用户列表容器 */}
      <div
        ref={scrollContainerRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide px-8 py-3"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* 全部动态选项 */}
        <button
          onClick={() => onSelectUser(null)}
          className="flex flex-col items-center gap-2 flex-shrink-0 group"
        >
          <div className={`relative w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all duration-200 ${
            selectedUserId === null
              ? 'bg-[#00aeec] text-white'
              : isDark
                ? 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'
                : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
          }`}>
            <Wind className="w-6 h-6" />
          </div>
          <span className={`text-xs text-center max-w-[60px] truncate transition-colors ${
            selectedUserId === null
              ? 'text-[#00aeec] font-medium'
              : isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            全部动态
          </span>
        </button>

        {/* 关注的用户 */}
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onSelectUser(user.id)}
            className="flex flex-col items-center gap-2 flex-shrink-0 group"
          >
            <div className={`relative w-[52px] h-[52px] rounded-full overflow-hidden transition-all duration-200 ${
              selectedUserId === user.id
                ? 'ring-2 ring-[#00aeec] ring-offset-1 ' + (isDark ? 'ring-offset-gray-950' : 'ring-offset-[#f1f2f3]')
                : ''
            }`}>
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
              />
              {/* 更新提示小红点 */}
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#ff6699] rounded-full border-2 border-white dark:border-gray-950" />
            </div>
            <span className={`text-xs text-center max-w-[60px] truncate transition-colors ${
              selectedUserId === user.id
                ? 'text-[#00aeec] font-medium'
                : isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {user.name}
            </span>
          </button>
        ))}
      </div>

      {/* 右箭头 */}
      <button
        onClick={() => scroll('right')}
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-md ${
          isDark
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-400'
            : 'bg-white hover:bg-gray-50 text-gray-500'
        }`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
