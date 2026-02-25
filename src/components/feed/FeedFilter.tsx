/**
 * 动态筛选组件
 * 支持按类型筛选和排序
 */

import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import type { FeedFilterType, FeedSortType } from '@/types/feed';
import {
  Clock,
  Flame,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

interface FeedFilterProps {
  activeFilter: FeedFilterType;
  activeSort: FeedSortType;
  onFilterChange: (filter: FeedFilterType) => void;
  onSortChange: (sort: FeedSortType) => void;
}

const filterItems: { id: FeedFilterType; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'community', label: '社群' },
  { id: 'video', label: '视频' },
  { id: 'image', label: '图文' },
  { id: 'article', label: '专栏' },
  { id: 'activity', label: '活动' },
];

const sortItems: { id: FeedSortType; label: string; icon: typeof Clock }[] = [
  { id: 'latest', label: '最新发布', icon: Clock },
  { id: 'hot', label: '热门', icon: Flame },
  { id: 'recommend', label: '推荐', icon: Sparkles },
];

export function FeedFilter({ 
  activeFilter, 
  activeSort, 
  onFilterChange, 
  onSortChange 
}: FeedFilterProps) {
  const { isDark } = useTheme();
  const activeSortItem = sortItems.find(item => item.id === activeSort);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`sticky top-2 z-10 mt-4 rounded-2xl ${
        isDark 
          ? 'bg-gray-900/95 border border-gray-800 backdrop-blur-sm' 
          : 'bg-white/95 border border-gray-100 shadow-sm backdrop-blur-sm'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* 筛选标签 */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {filterItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                console.log('[FeedFilter] Filter clicked:', item.id);
                onFilterChange(item.id);
              }}
              className={`relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === item.id
                  ? isDark
                    ? 'text-white'
                    : 'text-gray-900'
                  : isDark
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {activeFilter === item.id && (
                <motion.div
                  layoutId="filterBackground"
                  className={`absolute inset-0 rounded-full ${
                    isDark ? 'bg-gray-800' : 'bg-gray-100'
                  }`}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          ))}
        </div>

        {/* 排序下拉菜单 */}
        <div className="relative group">
          <button
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              isDark 
                ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            {activeSortItem && (
              <>
                <activeSortItem.icon className="w-4 h-4" />
                <span>{activeSortItem.label}</span>
              </>
            )}
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* 下拉选项 */}
          <div className={`absolute right-0 top-full mt-2 w-40 rounded-xl overflow-hidden shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all ${
            isDark 
              ? 'bg-gray-900 border border-gray-800' 
              : 'bg-white border border-gray-100'
          }`}>
            {sortItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSortChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  activeSort === item.id
                    ? isDark
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'bg-blue-50 text-blue-600'
                    : isDark
                    ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
