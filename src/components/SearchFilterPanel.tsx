import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Filter,
  X,
  ChevronDown,
  Calendar,
  Tag,
  Layers,
  RotateCcw,
  Check
} from 'lucide-react'
import { SearchResultType } from '@/components/SearchBar'
import { cn } from '@/lib/utils'

export interface FilterState {
  types: SearchResultType[]
  tags: string[]
  categories: string[]
  dateRange: {
    start: Date | null
    end: Date | null
  }
  creator: {
    id?: string
    name?: string
  }
  sortBy: 'relevance' | 'latest' | 'popular' | 'mostLiked' | 'mostViewed'
  sortOrder: 'asc' | 'desc'
}

interface SearchFilterPanelProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  aggregations?: {
    types: { type: string; count: number }[]
    tags: { tag: string; count: number }[]
    categories: { category: string; count: number }[]
  }
  isDark?: boolean
  className?: string
}

const typeLabels: Record<string, string> = {
  [SearchResultType.WORK]: '作品',
  [SearchResultType.USER]: '用户',
  [SearchResultType.CATEGORY]: '分类',
  [SearchResultType.TAG]: '标签',
  [SearchResultType.PAGE]: '页面',
  [SearchResultType.HISTORY]: '历史'
}

const sortOptions = [
  { value: 'relevance', label: '相关度' },
  { value: 'latest', label: '最新发布' },
  { value: 'popular', label: '最受欢迎' },
  { value: 'mostLiked', label: '最多点赞' },
  { value: 'mostViewed', label: '最多浏览' }
] as const

const datePresets = [
  { label: '今天', days: 1 },
  { label: '最近7天', days: 7 },
  { label: '最近30天', days: 30 },
  { label: '最近3个月', days: 90 },
  { label: '最近一年', days: 365 }
]

const SearchFilterPanel: React.FC<SearchFilterPanelProps> = ({
  filters,
  onFiltersChange,
  aggregations,
  isDark = false,
  className
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['type', 'sort'])
  )

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }, [])

  const handleTypeToggle = useCallback((type: SearchResultType) => {
    onFiltersChange({
      ...filters,
      types: filters.types.includes(type)
        ? filters.types.filter(t => t !== type)
        : [...filters.types, type]
    })
  }, [filters, onFiltersChange])

  const handleTagToggle = useCallback((tag: string) => {
    onFiltersChange({
      ...filters,
      tags: filters.tags.includes(tag)
        ? filters.tags.filter(t => t !== tag)
        : [...filters.tags, tag]
    })
  }, [filters, onFiltersChange])

  const handleCategoryToggle = useCallback((category: string) => {
    onFiltersChange({
      ...filters,
      categories: filters.categories.includes(category)
        ? filters.categories.filter(c => c !== category)
        : [...filters.categories, category]
    })
  }, [filters, onFiltersChange])

  const handleDatePreset = useCallback((days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)

    onFiltersChange({
      ...filters,
      dateRange: { start, end }
    })
  }, [filters, onFiltersChange])

  const handleClearDateRange = useCallback(() => {
    onFiltersChange({
      ...filters,
      dateRange: { start: null, end: null }
    })
  }, [filters, onFiltersChange])

  const handleSortChange = useCallback((sortBy: FilterState['sortBy']) => {
    onFiltersChange({
      ...filters,
      sortBy
    })
  }, [filters, onFiltersChange])

  const handleClearFilters = useCallback(() => {
    onFiltersChange({
      types: [],
      tags: [],
      categories: [],
      dateRange: { start: null, end: null },
      creator: {},
      sortBy: 'relevance',
      sortOrder: 'desc'
    })
  }, [onFiltersChange])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.types.length > 0) count++
    if (filters.tags.length > 0) count++
    if (filters.categories.length > 0) count++
    if (filters.dateRange.start || filters.dateRange.end) count++
    if (filters.creator.id || filters.creator.name) count++
    return count
  }, [filters])

  const availableTypes = useMemo(() => {
    if (!aggregations?.types) {
      return Object.values(SearchResultType).map(type => ({
        type,
        count: 0
      }))
    }
    return aggregations.types
  }, [aggregations])

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-200',
        isDark
          ? 'bg-gray-800/50 border-gray-700'
          : 'bg-white border-gray-200 shadow-sm',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3 border-b',
          isDark ? 'border-gray-700' : 'border-gray-200'
        )}
      >
        <div className="flex items-center gap-2">
          <Filter className={cn('w-4 h-4', isDark ? 'text-gray-400' : 'text-gray-500')} />
          <span
            className={cn(
              'font-medium text-sm',
              isDark ? 'text-gray-200' : 'text-gray-700'
            )}
          >
            筛选条件
          </span>
          {activeFilterCount > 0 && (
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                isDark
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-blue-100 text-blue-600'
              )}
            >
              {activeFilterCount}
            </span>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={handleClearFilters}
            className={cn(
              'flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors',
              isDark
                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            )}
          >
            <RotateCcw className="w-3 h-3" />
            重置
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        <FilterSection
          title="排序方式"
          icon={<Layers className="w-4 h-4" />}
          isExpanded={expandedSections.has('sort')}
          onToggle={() => toggleSection('sort')}
          isDark={isDark}
        >
          <div className="grid grid-cols-2 gap-2">
            {sortOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all',
                  filters.sortBy === option.value
                    ? isDark
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                    : isDark
                      ? 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                )}
              >
                <span>{option.label}</span>
                {filters.sortBy === option.value && (
                  <Check className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>
        </FilterSection>

        <FilterSection
          title="内容类型"
          icon={<Layers className="w-4 h-4" />}
          isExpanded={expandedSections.has('type')}
          onToggle={() => toggleSection('type')}
          isDark={isDark}
        >
          <div className="flex flex-wrap gap-2">
            {availableTypes.map(({ type, count }) => (
              <button
                key={type}
                onClick={() => handleTypeToggle(type as SearchResultType)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all',
                  filters.types.includes(type as SearchResultType)
                    ? isDark
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                    : isDark
                      ? 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                )}
              >
                <span>{typeLabels[type] || type}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      'text-xs',
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </FilterSection>

        {aggregations?.categories && aggregations.categories.length > 0 && (
          <FilterSection
            title="分类"
            icon={<Tag className="w-4 h-4" />}
            isExpanded={expandedSections.has('category')}
            onToggle={() => toggleSection('category')}
            isDark={isDark}
          >
            <div className="flex flex-wrap gap-2">
              {aggregations.categories.map(({ category, count }) => (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all',
                    filters.categories.includes(category)
                      ? isDark
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                      : isDark
                        ? 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700'
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  )}
                >
                  <span>{category}</span>
                  <span
                    className={cn(
                      'text-xs',
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    )}
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </FilterSection>
        )}

        {aggregations?.tags && aggregations.tags.length > 0 && (
          <FilterSection
            title="标签"
            icon={<Tag className="w-4 h-4" />}
            isExpanded={expandedSections.has('tag')}
            onToggle={() => toggleSection('tag')}
            isDark={isDark}
          >
            <div className="flex flex-wrap gap-2">
              {aggregations.tags.slice(0, 15).map(({ tag, count }) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all',
                    filters.tags.includes(tag)
                      ? isDark
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                      : isDark
                        ? 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700'
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  )}
                >
                  <span>{tag}</span>
                  <span
                    className={cn(
                      'text-xs',
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    )}
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </FilterSection>
        )}

        <FilterSection
          title="时间范围"
          icon={<Calendar className="w-4 h-4" />}
          isExpanded={expandedSections.has('date')}
          onToggle={() => toggleSection('date')}
          isDark={isDark}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {datePresets.map(preset => (
                <button
                  key={preset.days}
                  onClick={() => handleDatePreset(preset.days)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm transition-all',
                    isDark
                      ? 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {filters.dateRange.start && (
              <div
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-sm',
                  isDark ? 'bg-gray-700/30' : 'bg-gray-50'
                )}
              >
                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                  {filters.dateRange.start.toLocaleDateString('zh-CN')}
                  {filters.dateRange.end &&
                    ` - ${filters.dateRange.end.toLocaleDateString('zh-CN')}`}
                </span>
                <button
                  onClick={handleClearDateRange}
                  className={cn(
                    'p-1 rounded-md transition-colors',
                    isDark
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </FilterSection>
      </div>
    </div>
  )
}

interface FilterSectionProps {
  title: string
  icon: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
  isDark: boolean
  children: React.ReactNode
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  icon,
  isExpanded,
  onToggle,
  isDark,
  children
}) => {
  return (
    <div
      className={cn(
        'rounded-lg border transition-all',
        isDark ? 'border-gray-700' : 'border-gray-200'
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center justify-between w-full px-3 py-2.5 transition-colors',
          isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
        )}
      >
        <div className="flex items-center gap-2">
          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
            {icon}
          </span>
          <span
            className={cn(
              'text-sm font-medium',
              isDark ? 'text-gray-200' : 'text-gray-700'
            )}
          >
            {title}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform',
            isDark ? 'text-gray-400' : 'text-gray-500',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SearchFilterPanel
