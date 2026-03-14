import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Clock,
  TrendingUp,
  Sparkles,
  X,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SuggestionItem {
  id: string
  text: string
  type: 'history' | 'hot' | 'recommended' | 'autocomplete'
  icon?: React.ReactNode
  image?: string
  category?: string
  count?: number
  trend?: 'up' | 'down' | 'stable'
  timestamp?: string
  metadata?: Record<string, any>
}

interface EnhancedSearchDropdownProps {
  show: boolean
  isDark: boolean
  isLoading: boolean
  searchQuery: string
  searchHistory: SuggestionItem[]
  hotSearches: SuggestionItem[]
  recommendedSearches: SuggestionItem[]
  autocompleteSuggestions: SuggestionItem[]
  error: string | null
  onSelect: (suggestion: SuggestionItem) => void
  onClearHistory: () => void
  onRemoveHistoryItem: (id: string) => void
  onRetry: () => void
  className?: string
}

const EnhancedSearchDropdown: React.FC<EnhancedSearchDropdownProps> = ({
  show,
  isDark,
  isLoading,
  searchQuery,
  searchHistory,
  hotSearches,
  recommendedSearches,
  autocompleteSuggestions,
  error,
  onSelect,
  onClearHistory,
  onRemoveHistoryItem,
  onRetry,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'history' | 'hot'>('all')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  const hasQuery = searchQuery && searchQuery.trim().length > 0

  const allSuggestions = useMemo(() => {
    if (hasQuery) {
      return autocompleteSuggestions
    }

    const items: SuggestionItem[] = []

    if (activeTab === 'all' || activeTab === 'history') {
      items.push(...searchHistory.slice(0, 5))
    }

    if (activeTab === 'all' || activeTab === 'hot') {
      items.push(...hotSearches.slice(0, 5))
    }

    if (activeTab === 'all') {
      items.push(...recommendedSearches.slice(0, 5))
    }

    return items
  }, [hasQuery, autocompleteSuggestions, searchHistory, hotSearches, recommendedSearches, activeTab])

  useEffect(() => {
    setHighlightedIndex(-1)
  }, [searchQuery, activeTab])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!show) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex(prev =>
            prev < allSuggestions.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
          if (highlightedIndex >= 0 && allSuggestions[highlightedIndex]) {
            e.preventDefault()
            onSelect(allSuggestions[highlightedIndex])
          }
          break
        case 'Escape':
          setHighlightedIndex(-1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [show, highlightedIndex, allSuggestions, onSelect])

  const getTypeIcon = useCallback((type: SuggestionItem['type']) => {
    switch (type) {
      case 'history':
        return <Clock className="w-4 h-4" />
      case 'hot':
        return <TrendingUp className="w-4 h-4" />
      case 'recommended':
        return <Sparkles className="w-4 h-4" />
      case 'autocomplete':
        return <Search className="w-4 h-4" />
      default:
        return <Search className="w-4 h-4" />
    }
  }, [])

  const getTypeColor = useCallback(
    (type: SuggestionItem['type']) => {
      switch (type) {
        case 'history':
          return isDark ? 'text-gray-400' : 'text-gray-500'
        case 'hot':
          return isDark ? 'text-orange-400' : 'text-orange-500'
        case 'recommended':
          return isDark ? 'text-purple-400' : 'text-purple-500'
        case 'autocomplete':
          return isDark ? 'text-blue-400' : 'text-blue-500'
        default:
          return isDark ? 'text-gray-400' : 'text-gray-500'
      }
    },
    [isDark]
  )

  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-xl z-50 overflow-hidden',
          isDark
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200',
          className
        )}
      >
        {error && (
          <div
            className={cn(
              'flex items-center justify-between px-4 py-3 border-b',
              isDark ? 'border-gray-700 bg-red-900/20' : 'border-gray-200 bg-red-50'
            )}
          >
            <span className={cn('text-sm', isDark ? 'text-red-400' : 'text-red-600')}>
              {error}
            </span>
            <button
              onClick={onRetry}
              className={cn(
                'text-sm px-3 py-1 rounded-md transition-colors',
                isDark
                  ? 'text-red-400 hover:bg-red-900/30'
                  : 'text-red-600 hover:bg-red-100'
              )}
            >
              重试
            </button>
          </div>
        )}

        {hasQuery ? (
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className={cn('w-6 h-6 animate-spin', isDark ? 'text-gray-400' : 'text-gray-500')} />
              </div>
            ) : autocompleteSuggestions.length > 0 ? (
              <div className="py-2">
                {autocompleteSuggestions.map((suggestion, index) => (
                  <SuggestionRow
                    key={suggestion.id}
                    suggestion={suggestion}
                    isHighlighted={highlightedIndex === index}
                    isDark={isDark}
                    searchQuery={searchQuery}
                    onClick={() => onSelect(suggestion)}
                    getTypeIcon={getTypeIcon}
                    getTypeColor={getTypeColor}
                  />
                ))}
              </div>
            ) : (
              <div
                className={cn(
                  'flex flex-col items-center justify-center py-8',
                  isDark ? 'text-gray-400' : 'text-gray-500'
                )}
              >
                <Search className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">暂无搜索建议</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div
              className={cn(
                'flex items-center gap-1 px-3 py-2 border-b',
                isDark ? 'border-gray-700' : 'border-gray-200'
              )}
            >
              {(['all', 'history', 'hot'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                    activeTab === tab
                      ? isDark
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-blue-50 text-blue-600'
                      : isDark
                        ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  )}
                >
                  {tab === 'all' && '全部'}
                  {tab === 'history' && '历史'}
                  {tab === 'hot' && '热门'}
                </button>
              ))}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className={cn('w-6 h-6 animate-spin', isDark ? 'text-gray-400' : 'text-gray-500')} />
                </div>
              ) : (
                <>
                  {activeTab === 'all' && (
                    <>
                      {searchHistory.length > 0 && (
                        <SuggestionSection
                          title="最近搜索"
                          icon={<Clock className="w-4 h-4" />}
                          isDark={isDark}
                          action={
                            <button
                              onClick={onClearHistory}
                              className={cn(
                                'text-xs px-2 py-1 rounded-md transition-colors',
                                isDark
                                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                              )}
                            >
                              清空
                            </button>
                          }
                        >
                          <div className="grid grid-cols-2 gap-2">
                            {searchHistory.slice(0, 4).map((suggestion, index) => (
                              <HistoryItem
                                key={suggestion.id}
                                suggestion={suggestion}
                                isHighlighted={highlightedIndex === index}
                                isDark={isDark}
                                onClick={() => onSelect(suggestion)}
                                onRemove={() => onRemoveHistoryItem(suggestion.id)}
                              />
                            ))}
                          </div>
                        </SuggestionSection>
                      )}

                      {recommendedSearches.length > 0 && (
                        <SuggestionSection
                          title="为你推荐"
                          icon={<Sparkles className="w-4 h-4" />}
                          isDark={isDark}
                        >
                          <div className="grid grid-cols-2 gap-2">
                            {recommendedSearches.slice(0, 4).map((suggestion, index) => (
                              <RecommendItem
                                key={suggestion.id}
                                suggestion={suggestion}
                                isDark={isDark}
                                onClick={() => onSelect(suggestion)}
                              />
                            ))}
                          </div>
                        </SuggestionSection>
                      )}

                      {hotSearches.length > 0 && (
                        <SuggestionSection
                          title="热门搜索"
                          icon={<TrendingUp className="w-4 h-4" />}
                          isDark={isDark}
                        >
                          <div className="space-y-1">
                            {hotSearches.slice(0, 6).map((suggestion, index) => (
                              <HotSearchItem
                                key={suggestion.id}
                                suggestion={suggestion}
                                rank={index + 1}
                                isDark={isDark}
                                onClick={() => onSelect(suggestion)}
                              />
                            ))}
                          </div>
                        </SuggestionSection>
                      )}
                    </>
                  )}

                  {activeTab === 'history' && (
                    <>
                      {searchHistory.length > 0 ? (
                        <div className="py-2">
                          {searchHistory.map((suggestion, index) => (
                            <SuggestionRow
                              key={suggestion.id}
                              suggestion={suggestion}
                              isHighlighted={highlightedIndex === index}
                              isDark={isDark}
                              onClick={() => onSelect(suggestion)}
                              onRemove={() => onRemoveHistoryItem(suggestion.id)}
                              getTypeIcon={getTypeIcon}
                              getTypeColor={getTypeColor}
                              showRemove
                            />
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          icon={<Clock className="w-8 h-8" />}
                          text="暂无搜索历史"
                          isDark={isDark}
                        />
                      )}
                    </>
                  )}

                  {activeTab === 'hot' && (
                    <>
                      {hotSearches.length > 0 ? (
                        <div className="py-2">
                          {hotSearches.map((suggestion, index) => (
                            <HotSearchRow
                              key={suggestion.id}
                              suggestion={suggestion}
                              rank={index + 1}
                              isHighlighted={highlightedIndex === index}
                              isDark={isDark}
                              onClick={() => onSelect(suggestion)}
                            />
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          icon={<TrendingUp className="w-8 h-8" />}
                          text="暂无热门搜索"
                          isDark={isDark}
                        />
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )}

        <div
          className={cn(
            'flex items-center justify-between px-4 py-2 border-t text-xs',
            isDark ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'
          )}
        >
          <span>按 Enter 搜索，按 Esc 关闭</span>
          <span className="flex items-center gap-1">
            <kbd
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px]',
                isDark ? 'bg-gray-700' : 'bg-gray-100'
              )}
            >
              ↑↓
            </kbd>
            <span>导航</span>
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

interface SuggestionSectionProps {
  title: string
  icon: React.ReactNode
  isDark: boolean
  action?: React.ReactNode
  children: React.ReactNode
}

const SuggestionSection: React.FC<SuggestionSectionProps> = ({
  title,
  icon,
  isDark,
  action,
  children
}) => (
  <div className={cn('px-4 py-3', isDark ? 'border-b border-gray-700' : 'border-b border-gray-100')}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{icon}</span>
        <span className={cn('text-sm font-medium', isDark ? 'text-gray-200' : 'text-gray-700')}>
          {title}
        </span>
      </div>
      {action}
    </div>
    {children}
  </div>
)

interface SuggestionRowProps {
  suggestion: SuggestionItem
  isHighlighted: boolean
  isDark: boolean
  searchQuery?: string
  onClick: () => void
  onRemove?: () => void
  getTypeIcon: (type: SuggestionItem['type']) => React.ReactNode
  getTypeColor: (type: SuggestionItem['type']) => string
  showRemove?: boolean
}

const SuggestionRow: React.FC<SuggestionRowProps> = ({
  suggestion,
  isHighlighted,
  isDark,
  searchQuery,
  onClick,
  onRemove,
  getTypeIcon,
  getTypeColor,
  showRemove = false
}) => {
  const highlightText = (text: string, query: string) => {
    if (!query) return text

    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const index = lowerText.indexOf(lowerQuery)

    if (index === -1) return text

    const before = text.slice(0, index)
    const match = text.slice(index, index + query.length)
    const after = text.slice(index + query.length)

    return (
      <>
        {before}
        <span className={isDark ? 'text-blue-400 font-medium' : 'text-blue-600 font-medium'}>
          {match}
        </span>
        {after}
      </>
    )
  }

  return (
    <motion.div
      whileHover={{ backgroundColor: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 1)' }}
      onClick={onClick}
      className={cn(
        'flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors',
        isHighlighted && (isDark ? 'bg-gray-700/50' : 'bg-gray-100')
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className={cn('flex-shrink-0', getTypeColor(suggestion.type))}>
          {getTypeIcon(suggestion.type)}
        </span>
        <span className={cn('truncate', isDark ? 'text-gray-200' : 'text-gray-700')}>
          {searchQuery ? highlightText(suggestion.text, searchQuery) : suggestion.text}
        </span>
        {suggestion.category && (
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full flex-shrink-0',
              isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
            )}
          >
            {suggestion.category}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {suggestion.count && (
          <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
            {suggestion.count}
          </span>
        )}
        {showRemove && onRemove && (
          <button
            onClick={e => {
              e.stopPropagation()
              onRemove()
            }}
            className={cn(
              'p-1 rounded-md transition-colors',
              isDark
                ? 'text-gray-500 hover:text-gray-400 hover:bg-gray-700'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
            )}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <ArrowRight className={cn('w-4 h-4', isDark ? 'text-gray-600' : 'text-gray-400')} />
      </div>
    </motion.div>
  )
}

interface HistoryItemProps {
  suggestion: SuggestionItem
  isHighlighted: boolean
  isDark: boolean
  onClick: () => void
  onRemove: () => void
}

const HistoryItem: React.FC<HistoryItemProps> = ({
  suggestion,
  isHighlighted,
  isDark,
  onClick,
  onRemove
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      'relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all group',
      isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100',
      isHighlighted && (isDark ? 'ring-2 ring-blue-500' : 'ring-2 ring-blue-400')
    )}
  >
    <Clock className={cn('w-4 h-4 flex-shrink-0', isDark ? 'text-gray-500' : 'text-gray-400')} />
    <span className={cn('truncate text-sm', isDark ? 'text-gray-300' : 'text-gray-600')}>
      {suggestion.text}
    </span>
    <button
      onClick={e => {
        e.stopPropagation()
        onRemove()
      }}
      className={cn(
        'absolute right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity',
        isDark
          ? 'text-gray-500 hover:text-gray-400 hover:bg-gray-600'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
      )}
    >
      <X className="w-3 h-3" />
    </button>
  </motion.div>
)

interface RecommendItemProps {
  suggestion: SuggestionItem
  isDark: boolean
  onClick: () => void
}

const RecommendItem: React.FC<RecommendItemProps> = ({ suggestion, isDark, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all',
      isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
    )}
  >
    <Sparkles className={cn('w-4 h-4 flex-shrink-0', isDark ? 'text-purple-400' : 'text-purple-500')} />
    <span className={cn('truncate text-sm', isDark ? 'text-gray-300' : 'text-gray-600')}>
      {suggestion.text}
    </span>
    {suggestion.category && (
      <span
        className={cn(
          'text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0',
          isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
        )}
      >
        {suggestion.category}
      </span>
    )}
  </motion.div>
)

interface HotSearchItemProps {
  suggestion: SuggestionItem
  rank: number
  isDark: boolean
  onClick: () => void
}

const HotSearchItem: React.FC<HotSearchItemProps> = ({ suggestion, rank, isDark, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    onClick={onClick}
    className={cn(
      'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all',
      isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
    )}
  >
    <span
      className={cn(
        'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
        rank <= 3
          ? isDark
            ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white'
            : 'bg-gradient-to-br from-orange-400 to-red-400 text-white'
          : isDark
            ? 'bg-gray-700 text-gray-400'
            : 'bg-gray-200 text-gray-500'
      )}
    >
      {rank}
    </span>
    <span className={cn('flex-1 truncate text-sm', isDark ? 'text-gray-200' : 'text-gray-700')}>
      {suggestion.text}
    </span>
    {suggestion.trend === 'up' && (
      <TrendingUp className={cn('w-4 h-4', isDark ? 'text-green-400' : 'text-green-500')} />
    )}
  </motion.div>
)

interface HotSearchRowProps {
  suggestion: SuggestionItem
  rank: number
  isHighlighted: boolean
  isDark: boolean
  onClick: () => void
}

const HotSearchRow: React.FC<HotSearchRowProps> = ({
  suggestion,
  rank,
  isHighlighted,
  isDark,
  onClick
}) => (
  <motion.div
    whileHover={{ backgroundColor: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 1)' }}
    onClick={onClick}
    className={cn(
      'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors',
      isHighlighted && (isDark ? 'bg-gray-700/50' : 'bg-gray-100')
    )}
  >
    <span
      className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
        rank <= 3
          ? isDark
            ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white'
            : 'bg-gradient-to-br from-orange-400 to-red-400 text-white'
          : isDark
            ? 'bg-gray-700 text-gray-400'
            : 'bg-gray-200 text-gray-500'
      )}
    >
      {rank}
    </span>
    <div className="flex-1 min-w-0">
      <span className={cn('truncate', isDark ? 'text-gray-200' : 'text-gray-700')}>
        {suggestion.text}
      </span>
      {suggestion.category && (
        <span
          className={cn(
            'ml-2 text-xs px-2 py-0.5 rounded-full',
            isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
          )}
        >
          {suggestion.category}
        </span>
      )}
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
        {suggestion.count || suggestion.trend || ''}
      </span>
      {suggestion.trend === 'up' && (
        <TrendingUp className={cn('w-4 h-4', isDark ? 'text-green-400' : 'text-green-500')} />
      )}
      <ArrowRight className={cn('w-4 h-4', isDark ? 'text-gray-600' : 'text-gray-400')} />
    </div>
  </motion.div>
)

interface EmptyStateProps {
  icon: React.ReactNode
  text: string
  isDark: boolean
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, text, isDark }) => (
  <div className={cn('flex flex-col items-center justify-center py-8', isDark ? 'text-gray-500' : 'text-gray-400')}>
    <div className="mb-2 opacity-50">{icon}</div>
    <p className="text-sm">{text}</p>
  </div>
)

export default EnhancedSearchDropdown
