import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Event } from '@/types';
import MobileEventCard from './MobileEventCard';
import { 
  Search, 
  SlidersHorizontal, 
  ChevronDown,
  Loader2,
  Sparkles,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  X
} from 'lucide-react';
import { SortOption } from '@/hooks/useEventFilters';

interface MobileEventGridProps {
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
}

const sortOptions: { value: SortOption; label: string; icon: React.ElementType }[] = [
  { value: 'latest', label: '最新', icon: Clock },
  { value: 'upcoming', label: '即将开始', icon: Calendar },
  { value: 'popular', label: '热度', icon: TrendingUp },
  { value: 'participants', label: '参与人数', icon: Users },
];

// 品牌色彩
const brandColors = {
  primary: '#E53935',
  primaryLight: '#FF6F60',
  primaryDark: '#AB000D',
};

export default function MobileEventGrid({
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
}: MobileEventGridProps) {
  const { isDark } = useTheme();
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 滚动动画
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 50], [1, 0.95]);
  const headerY = useTransform(scrollY, [0, 50], [0, -2]);

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
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  // Focus search input when shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const selectedSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || '排序';

  // 将事件分成两列（瀑布流效果）
  const leftColumn = events.filter((_, index) => index % 2 === 0);
  const rightColumn = events.filter((_, index) => index % 2 === 1);

  return (
    <div className="flex-1 min-w-0">
      {/* 顶部控制栏 - 移动端优化 */}
      <motion.div 
        style={{ opacity: headerOpacity, y: headerY }}
        className={`sticky top-0 z-20 px-3 py-3 mb-4 rounded-2xl shadow-sm backdrop-blur-xl ${
          isDark ? 'bg-gray-800/90 border border-gray-700/50' : 'bg-white/90 border border-gray-100'
        }`}
      >
        {/* 搜索栏 - 可展开 */}
        <AnimatePresence mode="wait">
          {showSearch ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3"
            >
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                  )}
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="搜索活动..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className={`w-full pl-9 pr-9 py-2.5 rounded-xl text-sm transition-all border ${
                    isDark 
                      ? 'bg-gray-900/50 border-gray-700 focus:border-red-500 text-white placeholder-gray-500' 
                      : 'bg-gray-50 border-gray-200 focus:border-red-500 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-red-500/10`}
                />
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* 控制按钮行 */}
        <div className="flex items-center justify-between gap-2">
          {/* 左侧：搜索按钮 + 结果统计 */}
          <div className="flex items-center gap-2 flex-1">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSearch(!showSearch)}
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                showSearch 
                  ? 'bg-red-500 text-white' 
                  : isDark 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Search className="w-4 h-4" />
            </motion.button>

            {/* 结果统计 */}
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  加载中
                </span>
              ) : (
                <span>
                  共 <span className="font-semibold" style={{ color: brandColors.primary }}>{events.length}</span> 个活动
                </span>
              )}
            </div>
          </div>

          {/* 右侧：排序下拉 */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                isDark 
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-xs">{selectedSortLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {showSortDropdown && (
                <>
                  {/* 遮罩 */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowSortDropdown(false)}
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                    style={{ top: 'auto', bottom: 'auto' }}
                  />
                  {/* 下拉菜单 */}
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute right-0 mt-2 w-40 rounded-xl shadow-lg border z-50 overflow-hidden ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                    }`}
                  >
                    {sortOptions.map((option, index) => {
                      const Icon = option.icon;
                      return (
                        <motion.button
                          key={option.value}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => {
                            setSortBy(option.value);
                            setShowSortDropdown(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
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
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* 活动列表 - 两列瀑布流布局 */}
      <AnimatePresence mode="wait">
        {isLoading && events.length === 0 ? (
          // 骨架屏 - 两列
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`animate-pulse rounded-2xl ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}
                style={{ height: i % 2 === 0 ? '220px' : '200px' }}
              />
            ))}
          </motion.div>
        ) : events.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            {/* 左列 */}
            <div className="flex flex-col gap-3">
              {leftColumn.map((event, index) => (
                <MobileEventCard
                  key={event.id}
                  event={event}
                  onClick={() => onEventClick(event)}
                  index={index * 2}
                />
              ))}
            </div>
            
            {/* 右列 - 添加顶部偏移创造瀑布流效果 */}
            <div className="flex flex-col gap-3 pt-6">
              {rightColumn.map((event, index) => (
                <MobileEventCard
                  key={event.id}
                  event={event}
                  onClick={() => onEventClick(event)}
                  index={index * 2 + 1}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          // 空状态
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex flex-col items-center justify-center py-16 px-4 rounded-3xl border-2 border-dashed ${
              isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className={`p-5 rounded-full mb-5 ${isDark ? 'bg-gray-700' : 'bg-white shadow-sm'}`}
            >
              <Sparkles className={`w-10 h-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </motion.div>
            <h3 className="text-lg font-bold mb-2">暂无相关活动</h3>
            <p className={`text-center max-w-xs mb-5 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchQuery 
                ? '没有找到匹配的活动，试试其他关键词吧'
                : '当前筛选条件下没有找到活动'}
            </p>
            {searchQuery && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearchQuery('')}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 transition-all"
              >
                清除搜索
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 加载更多 */}
      {(hasMore || isLoading) && events.length > 0 && (
        <div ref={loadMoreRef} className="mt-6 flex justify-center">
          {isLoading ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full ${
                isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">加载更多...</span>
            </motion.div>
          ) : (
            <div className="h-8" />
          )}
        </div>
      )}

      {/* 底部间距 */}
      <div className="h-8" />
    </div>
  );
}
