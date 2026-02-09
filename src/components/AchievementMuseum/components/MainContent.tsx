import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import {
  Trophy,
  LayoutGrid,
  List,
  Clock,
  ChevronDown,
  Filter,
  SlidersHorizontal,
  X
} from 'lucide-react';
import type {
  Achievement,
  AchievementStats,
  UserAchievementInfo,
  AchievementFilter,
  ViewMode,
  CreatorLevel
} from '../types';
import AchievementCard from './AchievementCard';
import StatsPanel from './StatsPanel';
import EmptyState from './EmptyState';
import { categoryConfig } from '../hooks/useAchievements';

interface MainContentProps {
  achievements: Achievement[];
  filteredAchievements: Achievement[];
  stats: AchievementStats | null;
  userInfo: UserAchievementInfo | null;
  filter: AchievementFilter;
  viewMode: ViewMode;
  isLoading: boolean;
  onFilterChange: (updates: Partial<AchievementFilter>) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onResetFilter: () => void;
  onAchievementClick: (achievement: Achievement) => void;
}

export default function MainContent({
  achievements,
  filteredAchievements,
  stats,
  userInfo,
  filter,
  viewMode,
  isLoading,
  onFilterChange,
  onViewModeChange,
  onResetFilter,
  onAchievementClick,
}: MainContentProps) {
  const { isDark } = useTheme();
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // 获取空状态类型
  const getEmptyStateType = (): 'search' | 'filter' | 'all' => {
    if (filter.searchQuery) return 'search';
    if (filter.rarity !== 'all' || filter.category !== 'all') return 'filter';
    return 'all';
  };

  return (
    <main className="flex-1 min-w-0">
      <div className="p-4 lg:p-6 space-y-6">
        {/* 页面标题和面包屑 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <div className={`flex items-center gap-2 text-xs mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <span>首页</span>
              <span>/</span>
              <span>创作中心</span>
              <span>/</span>
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>成就博物馆</span>
            </div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              创作成就博物馆
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              记录你的创作足迹，解锁专属成就徽章
            </p>
          </div>

          {/* 移动端筛选按钮 */}
          <button
            onClick={() => setShowMobileFilter(true)}
            className={`lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              isDark
                ? 'bg-gray-800 text-gray-300 border border-gray-700'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
            {(filter.rarity !== 'all' || filter.category !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-[#C02C38]" />
            )}
          </button>
        </motion.div>

        {/* 统计面板 */}
        <StatsPanel stats={stats} userInfo={userInfo} />

        {/* 内容区域 */}
        <div>
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className={`text-lg font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                {filter.category === 'all' ? '全部成就' : (categoryConfig[filter.category]?.label || '成就')}
              </h2>
              <span className={`text-sm px-2.5 py-1 rounded-full ${
                isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
              }`}>
                {filteredAchievements.length} 项
              </span>
            </div>

            {/* 视图切换 - 桌面端 */}
            <div className={`hidden lg:flex items-center gap-1 p-1 rounded-xl ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              {[
                { mode: 'grid' as ViewMode, icon: LayoutGrid },
                { mode: 'list' as ViewMode, icon: List },
                { mode: 'timeline' as ViewMode, icon: Clock },
              ].map(({ mode, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => onViewModeChange(mode)}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === mode
                      ? isDark
                        ? 'bg-gray-700 text-[#C02C38]'
                        : 'bg-white text-[#C02C38] shadow-sm'
                      : isDark
                        ? 'text-gray-400 hover:text-gray-200'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title={mode === 'grid' ? '网格视图' : mode === 'list' ? '列表视图' : '时间轴视图'}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* 成就列表 */}
          {isLoading ? (
            // 加载状态
            <div className={`grid gap-4 ${
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                : 'grid-cols-1'
            }`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-2xl p-5 animate-pulse ${
                    isDark ? 'bg-gray-800/50' : 'bg-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <div className="flex-1 space-y-2">
                      <div className={`h-4 rounded w-3/4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                      <div className={`h-3 rounded w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                      <div className={`h-3 rounded w-2/3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAchievements.length === 0 ? (
            // 空状态
            <EmptyState
              type={getEmptyStateType()}
              onReset={filter.searchQuery || filter.rarity !== 'all' || filter.category !== 'all' ? onResetFilter : undefined}
            />
          ) : (
            // 成就列表
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4'
                    : viewMode === 'list'
                      ? 'space-y-3'
                      : 'space-y-0 pl-2'
                }
              >
                {(filteredAchievements || []).map((achievement, index) => (
                  achievement && (
                    <AchievementCard
                      key={achievement.id || index}
                      achievement={achievement}
                      viewMode={viewMode}
                      index={index}
                      onClick={() => onAchievementClick(achievement)}
                    />
                  )
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* 移动端筛选抽屉 */}
      <AnimatePresence>
        {showMobileFilter && (
          <>
            {/* 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilter(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            {/* 抽屉 */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed right-0 top-0 bottom-0 w-80 z-50 lg:hidden ${
                isDark ? 'bg-gray-900' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>筛选</h3>
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-64px)]">
                {/* 分类筛选 */}
                <div>
                  <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    成就分类
                  </h4>
                  <div className="space-y-2">
                    {Object.values(categoryConfig).map((category) => (
                      <button
                        key={category.value}
                        onClick={() => {
                          onFilterChange({ category: category.value });
                          setShowMobileFilter(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                          filter.category === category.value
                            ? isDark
                              ? 'bg-[#C02C38]/20 text-[#C02C38]'
                              : 'bg-[#C02C38]/10 text-[#C02C38]'
                            : isDark
                              ? 'text-gray-300 hover:bg-gray-800'
                              : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span>{category.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 稀有度筛选 */}
                <div>
                  <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    稀有度
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        onFilterChange({ rarity: 'all' });
                        setShowMobileFilter(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl text-sm text-left transition-all ${
                        filter.rarity === 'all'
                          ? isDark
                            ? 'bg-gray-800 text-white'
                            : 'bg-gray-100 text-gray-900'
                          : isDark
                            ? 'text-gray-400 hover:bg-gray-800/50'
                            : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      全部稀有度
                    </button>
                  </div>
                </div>

                {/* 排序 */}
                <div>
                  <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    排序方式
                  </h4>
                  <select
                    value={filter.sortBy}
                    onChange={(e) => {
                      onFilterChange({ sortBy: e.target.value as any });
                      setShowMobileFilter(false);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm ${
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    } border-2 outline-none`}
                  >
                    <option value="newest">最新解锁</option>
                    <option value="oldest">最早解锁</option>
                    <option value="progress">完成进度</option>
                    <option value="points">积分高低</option>
                  </select>
                </div>

                {/* 重置按钮 */}
                <button
                  onClick={() => {
                    onResetFilter();
                    setShowMobileFilter(false);
                  }}
                  className="w-full py-3 rounded-xl text-sm font-medium bg-[#C02C38] text-white hover:bg-[#D04550] transition-colors"
                >
                  重置所有筛选
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
