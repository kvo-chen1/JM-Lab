import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Event } from '@/types';
import EventCard from './EventCard';
import { 
  Search, 
  SlidersHorizontal, 
  LayoutGrid, 
  List, 
  ChevronDown,
  Loader2,
  Sparkles,
  Calendar,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';
import { SortOption } from '@/hooks/useEventFilters';

interface EventGridProps {
  events: Event[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  onEventClick: (event: Event) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  totalCount?: number;
  selectedDate?: Date | null;
  onClearDateFilter?: () => void;
}

const sortOptions: { value: SortOption; label: string; icon: React.ElementType }[] = [
  { value: 'latest', label: '最新发布', icon: Clock },
  { value: 'upcoming', label: '即将开始', icon: Calendar },
  { value: 'popular', label: '热度最高', icon: TrendingUp },
  { value: 'participants', label: '参与人数', icon: Users },
];

export default function EventGrid({
  events,
  isLoading,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  onEventClick,
  hasMore = false,
  onLoadMore,
  totalCount = 0,
  selectedDate,
  onClearDateFilter,
}: EventGridProps) {
  const { isDark } = useTheme();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSearching(true);
    setSearchQuery(e.target.value);
  };

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  const selectedSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || '排序';

  return (
    <div className="flex-1 min-w-0">
      {/* 顶部控制栏 */}
      <div className={`sticky top-0 z-20 p-4 sm:p-6 mb-6 rounded-2xl shadow-sm backdrop-blur-xl ${
        isDark ? 'bg-gray-800/80 border border-gray-700' : 'bg-white/80 border border-gray-100'
      }`}>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 搜索框 */}
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              {isSearching ? (
                <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
              )}
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜索活动名称、描述或标签..."
              value={searchQuery}
              onChange={handleSearchChange}
              className={`w-full pl-12 pr-4 py-3 rounded-xl text-sm transition-all border ${
                isDark 
                  ? 'bg-gray-900/50 border-gray-700 focus:border-red-500 text-white placeholder-gray-500' 
                  : 'bg-gray-50 border-gray-200 focus:border-red-500 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-4 focus:ring-red-500/10`}
              style={{ paddingLeft: '44px' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <span className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              </button>
            )}
          </div>

          {/* 控制按钮组 */}
          <div className="flex items-center gap-2">
            {/* 排序下拉 */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isDark 
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">{selectedSortLabel}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showSortDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg border z-30 ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                    }`}
                  >
                    {sortOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value);
                            setShowSortDropdown(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                            sortBy === option.value
                              ? isDark 
                                ? 'bg-red-500/20 text-red-400' 
                                : 'bg-red-50 text-red-600'
                              : isDark 
                                ? 'hover:bg-gray-700 text-gray-300' 
                                : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {option.label}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 视图切换 */}
            <div className={`flex rounded-xl p-1 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                    : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                    : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 结果统计 */}
        <div className="mt-4 flex items-center justify-between">
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                加载中...
              </span>
            ) : (
              <span>
                共找到 <span className="font-semibold text-red-500">{events.length}</span> 个活动
                {totalCount > 0 && events.length < totalCount && (
                  <span className="ml-1">/ {totalCount} 个总活动</span>
                )}
              </span>
            )}
          </div>
          
          {/* 日期筛选提示 */}
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
                isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{selectedDate.getMonth() + 1}月{selectedDate.getDate()}日</span>
              {onClearDateFilter && (
                <button
                  onClick={onClearDateFilter}
                  className="ml-1 hover:text-red-700 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* 活动列表 */}
      <AnimatePresence mode="wait">
        {isLoading && events.length === 0 ? (
          // 骨架屏
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
              : 'space-y-4'
            }
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`animate-pulse ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                } rounded-2xl ${viewMode === 'grid' ? 'h-80' : 'h-32'}`}
              />
            ))}
          </motion.div>
        ) : events.length > 0 ? (
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
              : 'space-y-4'
            }
          >
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <EventCard
                  event={event}
                  onClick={() => onEventClick(event)}
                  viewMode={viewMode}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          // 空状态
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex flex-col items-center justify-center py-20 px-4 rounded-3xl border-2 border-dashed ${
              isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className={`p-6 rounded-full mb-6 ${isDark ? 'bg-gray-700' : 'bg-white shadow-sm'}`}>
              <Sparkles className={`w-12 h-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <h3 className="text-xl font-bold mb-2">暂无相关活动</h3>
            <p className={`text-center max-w-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchQuery 
                ? '没有找到匹配的活动，试试其他关键词吧'
                : '当前筛选条件下没有找到活动，换个筛选条件试试'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 transition-all hover:scale-105"
              >
                清除搜索
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 加载更多 */}
      {(hasMore || isLoading) && events.length > 0 && (
        <div ref={loadMoreRef} className="mt-8 flex justify-center">
          {isLoading ? (
            <div className={`flex items-center gap-2 px-6 py-3 rounded-full ${
              isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
            }`}>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>加载更多...</span>
            </div>
          ) : (
            <div className="h-10" /> // Spacer for intersection observer
          )}
        </div>
      )}
    </div>
  );
}
