import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Grid3X3,
  Image,
  Users,
  Calendar,
  MessageCircle,
  Building2,
  FileText,
  ChevronRight
} from 'lucide-react'
import { SearchResultType } from '@/components/SearchBar'
import { SearchResultItem } from '@/services/advancedSearchService'
import { cn } from '@/lib/utils'

export type CategoryType =
  | 'all'
  | 'works'
  | 'users'
  | 'events'
  | 'communities'
  | 'brands'
  | 'templates'

export interface CategoryConfig {
  id: CategoryType
  label: string
  icon: React.ReactNode
  types: SearchResultType[]
}

const defaultCategories: CategoryConfig[] = [
  {
    id: 'all',
    label: '综合',
    icon: <Grid3X3 className="w-4 h-4" />,
    types: []
  },
  {
    id: 'works',
    label: '作品',
    icon: <Image className="w-4 h-4" />,
    types: [SearchResultType.WORK]
  },
  {
    id: 'users',
    label: '用户',
    icon: <Users className="w-4 h-4" />,
    types: [SearchResultType.USER]
  },
  {
    id: 'events',
    label: '活动',
    icon: <Calendar className="w-4 h-4" />,
    types: [SearchResultType.PAGE]
  },
  {
    id: 'communities',
    label: '社群',
    icon: <MessageCircle className="w-4 h-4" />,
    types: [SearchResultType.PAGE]
  },
  {
    id: 'brands',
    label: '品牌',
    icon: <Building2 className="w-4 h-4" />,
    types: [SearchResultType.CATEGORY]
  },
  {
    id: 'templates',
    label: '模板',
    icon: <FileText className="w-4 h-4" />,
    types: [SearchResultType.PAGE]
  }
]

interface SearchCategoryTabsProps {
  results: SearchResultItem[]
  activeCategory: CategoryType
  onCategoryChange: (category: CategoryType) => void
  categories?: CategoryConfig[]
  isDark?: boolean
  className?: string
}

const SearchCategoryTabs: React.FC<SearchCategoryTabsProps> = ({
  results,
  activeCategory,
  onCategoryChange,
  categories = defaultCategories,
  isDark = false,
  className
}) => {
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryType, number> = {
      all: results.length,
      works: 0,
      users: 0,
      events: 0,
      communities: 0,
      brands: 0,
      templates: 0
    }

    results.forEach(item => {
      switch (item.type) {
        case SearchResultType.WORK:
          counts.works++
          break
        case SearchResultType.USER:
          counts.users++
          break
        case SearchResultType.PAGE:
          counts.events++
          break
        case SearchResultType.CATEGORY:
          counts.brands++
          break
        default:
          break
      }
    })

    return counts
  }, [results])

  return (
    <div
      className={cn(
        'flex items-center gap-2 overflow-x-auto scrollbar-hide',
        className
      )}
    >
      {categories.map(category => {
        const count = categoryCounts[category.id]
        const isActive = activeCategory === category.id

        if (count === 0 && category.id !== 'all') return null

        return (
          <motion.button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 border flex-shrink-0',
              isActive
                ? isDark
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/30'
                  : 'bg-[#C02C38] text-white border-[#C02C38] shadow-lg shadow-red-900/20'
                : isDark
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800 border-gray-700 bg-gray-800/50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-white border-gray-200 bg-white/80'
            )}
          >
            <span
              className={cn(
                'transition-colors',
                isActive
                  ? 'text-white'
                  : isDark
                    ? 'text-gray-400'
                    : 'text-gray-500'
              )}
            >
              {category.icon}
            </span>
            <span>{category.label}</span>
            {count > 0 && (
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-bold min-w-[20px] text-center',
                  isActive
                    ? 'bg-white/30 text-white'
                    : isDark
                      ? 'bg-gray-700 text-gray-300 border border-gray-600'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                )}
              >
                {count > 99 ? '99+' : count}
              </span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

interface SearchResultsGridProps {
  results: SearchResultItem[]
  activeCategory: CategoryType
  onItemClick: (item: SearchResultItem) => void
  isDark?: boolean
  className?: string
}

const SearchResultsGrid: React.FC<SearchResultsGridProps> = ({
  results,
  activeCategory,
  onItemClick,
  isDark = false,
  className
}) => {
  const filteredResults = useMemo(() => {
    if (activeCategory === 'all') {
      return results
    }

    const categoryConfig = defaultCategories.find(c => c.id === activeCategory)
    if (!categoryConfig) return results

    return results.filter(item => categoryConfig.types.includes(item.type))
  }, [results, activeCategory])

  const groupedResults = useMemo(() => {
    if (activeCategory !== 'all') {
      return { [activeCategory]: filteredResults }
    }

    const groups: Record<string, SearchResultItem[]> = {}

    filteredResults.forEach(item => {
      let groupKey: string = 'other'

      switch (item.type) {
        case SearchResultType.WORK:
          groupKey = 'works'
          break
        case SearchResultType.USER:
          groupKey = 'users'
          break
        case SearchResultType.PAGE:
          groupKey = 'events'
          break
        case SearchResultType.CATEGORY:
          groupKey = 'brands'
          break
        default:
          groupKey = 'other'
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(item)
    })

    return groups
  }, [filteredResults, activeCategory])

  const groupLabels: Record<string, string> = {
    works: '作品',
    users: '用户',
    events: '活动',
    communities: '社群',
    brands: '品牌',
    templates: '模板',
    other: '其他'
  }

  if (filteredResults.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-20',
          className
        )}
      >
        <div
          className={cn(
            'w-24 h-24 rounded-full flex items-center justify-center mb-4',
            isDark ? 'bg-gray-800' : 'bg-gray-100'
          )}
        >
          <Grid3X3
            className={cn(
              'w-12 h-12',
              isDark ? 'text-gray-600' : 'text-gray-400'
            )}
          />
        </div>
        <p
          className={cn(
            'text-lg font-medium',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}
        >
          暂无搜索结果
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-8', className)}>
      {Object.entries(groupedResults).map(([groupKey, items]) => (
        <motion.div
          key={groupKey}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeCategory === 'all' && (
            <div className="flex items-center justify-between mb-4">
              <h2
                className={cn(
                  'text-lg font-semibold flex items-center gap-2',
                  isDark ? 'text-gray-200' : 'text-gray-800'
                )}
              >
                {groupLabels[groupKey] || groupKey}
                <span
                  className={cn(
                    'text-sm font-normal',
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  )}
                >
                  ({items.length})
                </span>
              </h2>
              <button
                className={cn(
                  'flex items-center gap-1 text-sm transition-colors',
                  isDark
                    ? 'text-blue-400 hover:text-blue-300'
                    : 'text-blue-600 hover:text-blue-700'
                )}
              >
                查看更多
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div
            className={cn(
              'grid gap-4',
              groupKey === 'users'
                ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                : groupKey === 'brands' || groupKey === 'communities'
                  ? 'grid-cols-1 md:grid-cols-2'
                  : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            )}
          >
            {items.map((item, index) => (
              <ResultCard
                key={item.id}
                item={item}
                onClick={() => onItemClick(item)}
                isDark={isDark}
                index={index}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

interface ResultCardProps {
  item: SearchResultItem
  onClick: () => void
  isDark: boolean
  index: number
}

const ResultCard: React.FC<ResultCardProps> = ({
  item,
  onClick,
  isDark,
  index
}) => {
  const isUser = item.type === SearchResultType.USER

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -4 }}
        onClick={onClick}
        className={cn(
          'group cursor-pointer rounded-xl p-6 text-center transition-all duration-300',
          isDark
            ? 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600'
            : 'bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md'
        )}
      >
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div
            className={cn(
              'w-full h-full rounded-full overflow-hidden ring-2 ring-offset-2',
              isDark ? 'ring-gray-700 ring-offset-gray-800' : 'ring-gray-200 ring-offset-white'
            )}
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className={cn(
                  'w-full h-full flex items-center justify-center text-2xl font-bold',
                  isDark
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                    : 'bg-gradient-to-br from-blue-400 to-purple-400 text-white'
                )}
              >
                {item.title.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <h3
          className={cn(
            'font-semibold text-base mb-1 truncate',
            isDark ? 'text-gray-100' : 'text-gray-900'
          )}
        >
          {item.title}
        </h3>

        {item.description && (
          <p
            className={cn(
              'text-sm mb-3 line-clamp-2',
              isDark ? 'text-gray-400' : 'text-gray-500'
            )}
          >
            {item.description}
          </p>
        )}

        <div
          className={cn(
            'flex justify-center gap-4 text-sm',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}
        >
          <span>{item.stats?.views || 0} 作品</span>
          <span>{item.stats?.likes || 0} 粉丝</span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={cn(
        'group cursor-pointer rounded-xl overflow-hidden transition-all duration-300',
        isDark
          ? 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600'
          : 'bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md'
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {item.image || item.thumbnail ? (
          <img
            src={item.image || item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className={cn(
              'w-full h-full flex items-center justify-center',
              isDark ? 'bg-gray-700' : 'bg-gray-200'
            )}
          >
            <Image
              className={cn(
                'w-12 h-12',
                isDark ? 'text-gray-600' : 'text-gray-400'
              )}
            />
          </div>
        )}

        {item.category && (
          <div className="absolute top-2 left-2 z-10">
            <span
              className={cn(
                'text-[10px] px-2 py-1 rounded-full',
                isDark
                  ? 'bg-gray-800/80 text-gray-300'
                  : 'bg-white/80 text-gray-600'
              )}
            >
              {item.category}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3
          className={cn(
            'font-semibold text-base mb-2 line-clamp-2',
            isDark ? 'text-gray-100' : 'text-gray-900'
          )}
        >
          {item.title}
        </h3>

        {item.author && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
              {item.author.avatar ? (
                <img
                  src={item.author.avatar}
                  alt={item.author.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div
                  className={cn(
                    'w-full h-full flex items-center justify-center text-xs font-bold',
                    isDark
                      ? 'bg-gray-600 text-gray-300'
                      : 'bg-gray-300 text-gray-600'
                  )}
                >
                  {item.author.name.charAt(0)}
                </div>
              )}
            </div>
            <span
              className={cn(
                'text-sm truncate',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}
            >
              {item.author.name}
            </span>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs">
          {item.stats?.views !== undefined && (
            <span
              className={cn(
                'flex items-center gap-1',
                isDark ? 'text-gray-500' : 'text-gray-400'
              )}
            >
              <i className="far fa-eye" />
              {item.stats.views}
            </span>
          )}
          {item.stats?.likes !== undefined && (
            <span
              className={cn(
                'flex items-center gap-1',
                isDark ? 'text-gray-500' : 'text-gray-400'
              )}
            >
              <i className="far fa-heart" />
              {item.stats.likes}
            </span>
          )}
          {item.stats?.comments !== undefined && (
            <span
              className={cn(
                'flex items-center gap-1',
                isDark ? 'text-gray-500' : 'text-gray-400'
              )}
            >
              <i className="far fa-comment" />
              {item.stats.comments}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export { SearchCategoryTabs, SearchResultsGrid }
export default SearchCategoryTabs
