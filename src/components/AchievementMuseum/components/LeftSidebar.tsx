import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import {
  LayoutGrid,
  PenTool,
  Users,
  Star,
  Search,
  Filter,
  Grid3X3,
  List,
  Clock,
  RotateCcw,
  Target
} from 'lucide-react';
import type {
  AchievementFilter,
  ViewMode,
  AchievementStats
} from '../types';
import { rarityConfig, categoryConfig } from '../hooks/useAchievements';

interface LeftSidebarProps {
  filter: AchievementFilter;
  stats: AchievementStats | null;
  viewMode: ViewMode;
  onFilterChange: (updates: Partial<AchievementFilter>) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onResetFilter: () => void;
}

export default function LeftSidebar({
  filter,
  stats,
  viewMode,
  onFilterChange,
  onViewModeChange,
  onResetFilter,
}: LeftSidebarProps) {
  const { isDark } = useTheme();

  const hasActiveFilters = filter.rarity !== 'all' || filter.category !== 'all' || filter.searchQuery;

  return (
    <aside className={`w-64 flex-shrink-0 hidden lg:block ${isDark ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm`}>
      <div className="sticky top-20 p-4 space-y-6">
        {/* 搜索框 */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            value={filter.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="搜索成就..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-[#C02C38]/50'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#C02C38]/30'
            } border-2 outline-none`}
          />
          {filter.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '' })}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
            >
              <span className="sr-only">清除搜索</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 视图模式切换 */}
        <div>
          <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            视图模式
          </h3>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
            {[
              { mode: 'grid' as ViewMode, icon: Grid3X3, label: '网格' },
              { mode: 'list' as ViewMode, icon: List, label: '列表' },
              { mode: 'timeline' as ViewMode, icon: Clock, label: '时间轴' },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={`flex flex-col xl:flex-row items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 h-14 xl:h-auto ${
                  viewMode === mode
                    ? 'bg-white dark:bg-gray-700 text-[#C02C38] shadow-sm'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
                title={label}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="leading-none">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 分类筛选 */}
        <div>
          <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            成就分类
          </h3>
          <div className="space-y-1">
            {Object.values(categoryConfig).map((category) => {
              const Icon = category.icon === 'grid' ? LayoutGrid :
                          category.icon === 'pen-tool' ? PenTool :
                          category.icon === 'users' ? Users : Star;
              const isActive = filter.category === category.value;
              const count = stats ?
                (category.value === 'all' ? stats.total :
                 category.value === 'creation' ? Math.floor(stats.total * 0.4) :
                 category.value === 'community' ? Math.floor(stats.total * 0.35) :
                 Math.floor(stats.total * 0.25)) : 0;

              return (
                <motion.button
                  key={category.value}
                  onClick={() => onFilterChange({ category: category.value })}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? isDark
                        ? 'bg-[#C02C38]/20 text-[#C02C38] border border-[#C02C38]/30'
                        : 'bg-[#C02C38]/10 text-[#C02C38] border border-[#C02C38]/20'
                      : isDark
                        ? 'text-gray-300 hover:bg-gray-800'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isActive
                        ? 'bg-[#C02C38]/20'
                        : isDark ? 'bg-gray-800' : 'bg-gray-100'
                    }`}>
                      <Icon className="w-4 h-4" style={{ color: isActive ? '#C02C38' : category.color }} />
                    </div>
                    <span>{category.label}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive
                      ? isDark ? 'bg-[#C02C38]/20' : 'bg-[#C02C38]/10'
                      : isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* 稀有度筛选 */}
        <div>
          <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            稀有度
          </h3>
          <div className="space-y-1">
            <motion.button
              onClick={() => onFilterChange({ rarity: 'all' })}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                filter.rarity === 'all'
                  ? isDark
                    ? 'bg-gray-800 text-white border border-gray-700'
                    : 'bg-gray-100 text-gray-900 border border-gray-200'
                  : isDark
                    ? 'text-gray-400 hover:bg-gray-800/50'
                    : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4" />
                <span>全部稀有度</span>
              </div>
              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {stats?.total || 0}
              </span>
            </motion.button>

            {Object.values(rarityConfig).map((rarity) => {
              const isActive = filter.rarity === rarity.value;
              const count = stats?.rarityDistribution?.[rarity.value] || 0;

              return (
                <motion.button
                  key={rarity.value}
                  onClick={() => onFilterChange({ rarity: rarity.value })}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? isDark
                        ? `${rarity.darkBgColor} ${rarity.textColor} border ${rarity.darkBorderColor}`
                        : `${rarity.bgColor} ${rarity.textColor} border ${rarity.borderColor}`
                      : isDark
                        ? 'text-gray-400 hover:bg-gray-800/50'
                        : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: rarity.color }}
                    />
                    <span>{rarity.label}</span>
                  </div>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* 排序选项 */}
        <div>
          <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            排序方式
          </h3>
          <select
            value={filter.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
            className={`w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-gray-50 border-gray-200 text-gray-900'
            } border-2 outline-none focus:border-[#C02C38]/30`}
          >
            <option value="newest">最新解锁</option>
            <option value="oldest">最早解锁</option>
            <option value="progress">完成进度</option>
            <option value="points">积分高低</option>
          </select>
        </div>

        {/* 重置筛选 */}
        {hasActiveFilters && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onResetFilter}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isDark
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            重置筛选
          </motion.button>
        )}

        {/* 快捷统计 */}
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-[#C02C38]" />
            <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>完成进度</span>
          </div>
          <div className="flex items-end gap-1 mb-2">
            <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stats?.completionRate || 0}%
            </span>
            <span className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              ({stats?.unlocked || 0}/{stats?.total || 0})
            </span>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats?.completionRate || 0}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-[#C02C38] to-[#D04550]"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
