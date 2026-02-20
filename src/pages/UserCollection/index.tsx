import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { useContext } from 'react';

// 类型
import {
  CollectionType,
  ViewMode,
  TabType,
  CategoryFilter,
} from './types/collection';
import { SortOption } from '@/services/collectionService';

// Hooks
import { useCollections, useCollectionStats, useCollectionActions, useCollectionSearch } from './hooks';

// 组件
import {
  CollectionSidebar,
  CollectionGrid,
  CollectionEmpty,
  CollectionStats,
  ViewToggle,
  SortDropdown,
  CollectionSearch,
  SearchEmpty,
} from './components';

// 图标
import {
  Bookmark,
  Heart,
  LayoutGrid,
  Image,
  MessageSquare,
  Calendar,
  Layers,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';

// 分类配置
const categoryConfig: Omit<CategoryFilter, 'count'>[] = [
  { id: 'all', label: '全部收藏', icon: 'LayoutGrid', color: '#3b82f6' },
  { id: CollectionType.SQUARE_WORK, label: '广场作品', icon: 'Image', color: '#ef4444' },
  { id: CollectionType.COMMUNITY_POST, label: '社区帖子', icon: 'MessageSquare', color: '#8b5cf6' },
  { id: CollectionType.ACTIVITY, label: '活动', icon: 'Calendar', color: '#f59e0b' },
  { id: CollectionType.TEMPLATE, label: '作品模板', icon: 'Layers', color: '#10b981' },
];

export default function UserCollection() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading: authLoading } = useContext(AuthContext);

  // 状态
  const [activeTab, setActiveTab] = useState<TabType>(TabType.BOOKMARKS);
  const [activeFilter, setActiveFilter] = useState<CollectionType | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.NEWEST);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  const [totalBookmarks, setTotalBookmarks] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);

  // 数据获取
  const { items, isLoading, hasMore, total, refetch, loadMore, error } = useCollections({
    type: activeFilter,
    sort: sortOption,
    tab: activeTab,
    limit: 20,
  });

  const { stats, isLoading: statsLoading, refetch: refetchStats } = useCollectionStats();

  // 获取收藏和点赞的总数
  useEffect(() => {
    const fetchCounts = async () => {
      if (!user?.id) return;
      try {
        console.log('[UserCollection] Fetching bookmark and like counts...');
        const { collectionService, CollectionType } = await import('@/services/collectionService');
        
        // 获取所有类型的收藏
        const [bookmarksResult, likesResult] = await Promise.all([
          collectionService.getUserCollections({ type: 'all' }),
          collectionService.getUserLikes({ type: 'all' })
        ]);
        
        console.log('[UserCollection] Total bookmarks:', bookmarksResult.total, 'Total likes:', likesResult.total);
        setTotalBookmarks(bookmarksResult.total);
        setTotalLikes(likesResult.total);
      } catch (error) {
        console.error('获取收藏/点赞数量失败:', error);
      }
    };
    fetchCounts();
  }, [user?.id]);

  // 操作
  const { toggleBookmark, toggleLike, removeBookmark, removeLike } = useCollectionActions();

  // 搜索功能
  const {
    searchQuery,
    setSearch,
    clearSearch,
    searchResult,
    searchHistory,
    clearHistory,
    removeFromHistory,
    isSearching: isSearchLoading,
  } = useCollectionSearch(items, {
    fields: ['title', 'description', 'author', 'tags'],
  });

  // 使用搜索过滤后的数据
  const displayItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    return searchResult.items;
  }, [items, searchResult.items, searchQuery]);

  // 检查登录状态
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) {
      navigate('/login');
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  // 处理取消收藏（专门用于收藏页面）
  const handleRemoveBookmark = useCallback(
    async (id: string, type: CollectionType) => {
      const result = await removeBookmark(id, type);
      // result 为 false 表示取消收藏成功
      if (!result) {
        refetch();
        refetchStats();
      }
    },
    [removeBookmark, refetch, refetchStats]
  );

  // 处理取消点赞（专门用于点赞页面）
  const handleRemoveLike = useCallback(
    async (id: string, type: CollectionType) => {
      const result = await removeLike(id, type);
      // result 为 false 表示取消点赞成功
      if (!result) {
        refetch();
        refetchStats();
      }
    },
    [removeLike, refetch, refetchStats]
  );

  // 处理收藏切换（用于卡片内部的点赞按钮）
  const handleToggleBookmark = useCallback(
    async (id: string, type: CollectionType) => {
      const result = await toggleBookmark(id, type);
      if (result !== undefined) {
        refetchStats();
      }
    },
    [toggleBookmark, refetchStats]
  );

  // 处理点赞切换（用于卡片内部的点赞按钮）
  const handleToggleLike = useCallback(
    async (id: string, type: CollectionType) => {
      const result = await toggleLike(id, type);
      if (result !== undefined) {
        refetchStats();
      }
    },
    [toggleLike, refetchStats]
  );

  // 构建分类数据（带数量）- 使用 useMemo 优化，单次遍历计算
  const categories: CategoryFilter[] = useMemo(() => {
    const counts: Record<string, number> = {
      all: items.length,
      [CollectionType.SQUARE_WORK]: 0,
      [CollectionType.COMMUNITY_POST]: 0,
      [CollectionType.ACTIVITY]: 0,
      [CollectionType.TEMPLATE]: 0,
    };

    items.forEach((item) => {
      if (counts[item.type] !== undefined) {
        counts[item.type]++;
      }
    });

    return categoryConfig.map((cat) => ({
      ...cat,
      count: counts[cat.id] ?? 0,
    }));
  }, [items]);

  // 缓存右侧统计面板数据 - 复用 categories 的计算结果
  const collectionStatsData = useMemo(
    () => ({
      ...stats,
      total: activeTab === TabType.BOOKMARKS ? items.length : stats.total,
      totalLikes: activeTab === TabType.LIKES ? items.length : stats.totalLikes,
      squareWork: categories.find((c) => c.id === CollectionType.SQUARE_WORK)?.count ?? 0,
      communityPost: categories.find((c) => c.id === CollectionType.COMMUNITY_POST)?.count ?? 0,
      activity: categories.find((c) => c.id === CollectionType.ACTIVITY)?.count ?? 0,
      template: categories.find((c) => c.id === CollectionType.TEMPLATE)?.count ?? 0,
    }),
    [stats, activeTab, items.length, categories]
  );

  // 加载状态
  if (authLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className={`w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-4 ${
              isDark ? 'border-blue-500' : 'border-blue-600'
            }`} />
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>检查登录状态...</p>
          </div>
        </div>
      </main>
    );
  }

  // 错误状态
  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isDark ? 'bg-red-500/20' : 'bg-red-100'
            }`}>
              <AlertCircle className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            </div>
            <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              加载失败
            </h2>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {error.message || '获取收藏数据时发生错误，请稍后重试'}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => refetch()}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              重新加载
            </motion.button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* 页面头部 */}
      <div className={`${isDark ? 'bg-gray-900/50' : 'bg-gray-50/50'} backdrop-blur-sm border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="container mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* 标题区域 */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  我的收藏
                </h1>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  查看和管理您收藏与点赞的内容
                </p>
              </div>

              {/* 右侧：搜索框 + 统计卡片 */}
              <div className="flex items-center gap-4">
                {/* 搜索框 */}
                <CollectionSearch
                  value={searchQuery}
                  onChange={setSearch}
                  searchHistory={searchHistory}
                  onClearHistory={clearHistory}
                  onRemoveHistoryItem={removeFromHistory}
                  isSearching={isSearchLoading}
                  resultCount={searchResult.count}
                  placeholder="搜索标题、描述、作者或标签..."
                />

                {/* 统计卡片 */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`flex items-center gap-3 px-5 py-3 rounded-xl ${
                    isDark ? 'bg-gray-800' : 'bg-white'
                  } shadow-sm`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}>
                    <Bookmark className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总收藏</p>
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {isLoading ? '-' : totalBookmarks}
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`flex items-center gap-3 px-5 py-3 rounded-xl ${
                    isDark ? 'bg-gray-800' : 'bg-white'
                  } shadow-sm`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-pink-500/20' : 'bg-pink-100'
                  }`}>
                    <Heart className={`w-5 h-5 ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />
                  </div>
                  <div>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总点赞</p>
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {isLoading ? '-' : totalLikes}
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* 标签切换 */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(TabType.BOOKMARKS)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                  activeTab === TabType.BOOKMARKS
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : isDark
                      ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>我的收藏</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === TabType.BOOKMARKS
                    ? 'bg-white/20'
                    : isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  {activeTab === TabType.BOOKMARKS ? items.length : totalBookmarks}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(TabType.LIKES)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                  activeTab === TabType.LIKES
                    ? isDark
                      ? 'bg-pink-600 text-white'
                      : 'bg-pink-600 text-white shadow-lg shadow-pink-200'
                    : isDark
                      ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>我的点赞</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === TabType.LIKES
                    ? 'bg-white/20'
                    : isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  {activeTab === TabType.LIKES ? items.length : totalLikes}
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* 左侧边栏 */}
          <CollectionSidebar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            stats={{
              total: activeTab === TabType.BOOKMARKS ? items.length : totalBookmarks,
              totalLikes: activeTab === TabType.LIKES ? items.length : totalLikes,
            }}
            categories={categories}
            activeTab={activeTab}
          />

          {/* 中间内容区 */}
          <div className="flex-1 min-w-0">
            {/* 工具栏 */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center justify-between mb-6 p-4 rounded-xl ${
                isDark ? 'bg-gray-800/50' : 'bg-white/50'
              } backdrop-blur-sm`}
            >
              <div className="flex items-center gap-4">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  共 <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchQuery.trim() ? searchResult.count : total}
                  </span> 条内容
                  {searchQuery.trim() && (
                    <span className="ml-1">(搜索 "{searchQuery}")</span>
                  )}
                </span>
                {searchQuery.trim() && (
                  <button
                    onClick={clearSearch}
                    className={`text-sm flex items-center gap-1 transition-colors ${
                      isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    <X className="w-3 h-3" />
                    清除搜索
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <SortDropdown value={sortOption} onChange={setSortOption} />
                <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              </div>
            </motion.div>

            {/* 内容区域 */}
            <AnimatePresence mode="wait">
              {/* 搜索无结果状态 */}
              {searchQuery.trim() && displayItems.length === 0 ? (
                <SearchEmpty query={searchQuery} onClear={clearSearch} />
              ) : displayItems.length === 0 && !isLoading ? (
                <CollectionEmpty
                  type={activeTab === TabType.BOOKMARKS ? 'bookmarks' : 'likes'}
                  activeFilter={activeFilter}
                />
              ) : (
                <CollectionGrid
                  items={displayItems}
                  viewMode={viewMode}
                  isLoading={isLoading}
                  hasMore={hasMore && !searchQuery.trim()}
                  onLoadMore={loadMore}
                  onToggleBookmark={activeTab === TabType.BOOKMARKS ? handleRemoveBookmark : handleToggleBookmark}
                  onToggleLike={activeTab === TabType.LIKES ? handleRemoveLike : handleToggleLike}
                  activeTab={activeTab}
                />
              )}
            </AnimatePresence>
          </div>

          {/* 右侧边栏 */}
          <aside className="w-72 flex-shrink-0 hidden xl:block">
            <div className="sticky top-6 space-y-6">
              <CollectionStats
                stats={collectionStatsData}
                isLoading={isLoading}
                activeTab={activeTab}
              />

              {/* 快速操作 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm`}
              >
                <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  快速导航
                </h3>
                <div className="space-y-2">
                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={() => navigate('/square')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                      isDark
                        ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-200'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Image className="w-4 h-4 text-red-500" />
                    <span className="text-sm">浏览广场作品</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={() => navigate('/community')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                      isDark
                        ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-200'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">进入社区</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={() => navigate('/events')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                      isDark
                        ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-200'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span className="text-sm">查看活动</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={() => navigate('/tianjin')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                      isDark
                        ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-200'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm">浏览模板</span>
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
