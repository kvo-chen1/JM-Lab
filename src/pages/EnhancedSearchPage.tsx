import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, Loader2, X } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { TianjinButton } from '@/components/TianjinStyleComponents'
import SearchFilterPanel, { FilterState } from '@/components/SearchFilterPanel'
import { SearchCategoryTabs, SearchResultsGrid, CategoryType } from '@/components/SearchCategoryTabs'
import advancedSearchService, { SearchResultItem } from '@/services/advancedSearchService'
import searchSuggestionService from '@/services/searchSuggestionService'
import searchSortingService from '@/services/searchSortingService'
import { cn } from '@/lib/utils'

const EnhancedSearchPage: React.FC = () => {
  const { isDark } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [aggregations, setAggregations] = useState<{
    types: { type: string; count: number }[]
    tags: { tag: string; count: number }[]
    categories: { category: string; count: number }[]
  } | undefined>()

  const [filters, setFilters] = useState<FilterState>({
    types: [],
    tags: [],
    categories: [],
    dateRange: { start: null, end: null },
    creator: {},
    sortBy: 'relevance',
    sortOrder: 'desc'
  })

  const [userPreferences, setUserPreferences] = useState<{
    preferredCategories?: string[]
    preferredTags?: string[]
    preferredAuthors?: string[]
  }>()

  useEffect(() => {
    const urlQuery = searchParams.get('query') || ''
    const urlCategory = (searchParams.get('category') as CategoryType) || 'all'
    const urlSortBy = (searchParams.get('sortBy') as FilterState['sortBy']) || 'relevance'

    setQuery(urlQuery)
    setActiveCategory(urlCategory)
    setFilters(prev => ({ ...prev, sortBy: urlSortBy }))

    if (urlQuery) {
      performSearch(urlQuery, filters, 1)
    }
  }, [location.search])

  useEffect(() => {
    const loadUserPreferences = async () => {
      const userId = localStorage.getItem('userId')
      if (userId) {
        try {
          const response = await fetch('/api/search/preferences', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          })
          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              setUserPreferences({
                preferredCategories: data.data.preferred_categories,
                preferredTags: data.data.preferred_tags,
                preferredAuthors: data.data.preferred_authors
              })
            }
          }
        } catch (error) {
          console.error('Load user preferences error:', error)
        }
      }
    }

    loadUserPreferences()
  }, [])

  const performSearch = useCallback(
    async (
      searchQuery: string,
      searchFilters: FilterState,
      page: number
    ) => {
      if (!searchQuery.trim()) {
        setResults([])
        setTotalResults(0)
        setTotalPages(0)
        return
      }

      setIsLoading(true)

      try {
        const searchResult = await advancedSearchService.advancedSearch(
          {
            keyword: searchQuery,
            types: searchFilters.types.length > 0 ? searchFilters.types : undefined,
            tags: searchFilters.tags.length > 0 ? searchFilters.tags : undefined,
            categories:
              searchFilters.categories.length > 0 ? searchFilters.categories : undefined,
            dateRange: searchFilters.dateRange.start
              ? {
                  start: searchFilters.dateRange.start || undefined,
                  end: searchFilters.dateRange.end || undefined
                }
              : undefined,
            creator: searchFilters.creator.id || searchFilters.creator.name
              ? searchFilters.creator
              : undefined,
            sortBy: searchFilters.sortBy,
            sortOrder: searchFilters.sortOrder
          },
          { page, pageSize: 20 }
        )

        const sortedItems = searchSortingService.sortResults(
          searchResult.items,
          searchFilters.sortBy === 'relevance' ? 'personalized' : searchFilters.sortBy,
          searchFilters.sortOrder,
          userPreferences,
          { query: searchQuery, timestamp: Date.now() }
        )

        setResults(sortedItems)
        setTotalResults(searchResult.total)
        setCurrentPage(page)
        setTotalPages(searchResult.totalPages)
        setAggregations(searchResult.aggregations)

        const userId = localStorage.getItem('userId')
        if (userId) {
          searchSuggestionService.saveSearchHistory(userId, searchQuery, {
            resultCount: searchResult.total,
            filters: searchFilters
          })
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
        setTotalResults(0)
        setTotalPages(0)
      } finally {
        setIsLoading(false)
      }
    },
    [userPreferences]
  )

  const handleSearch = useCallback(() => {
    if (!query.trim()) return

    const params = new URLSearchParams()
    params.set('query', query)
    params.set('category', activeCategory)
    params.set('sortBy', filters.sortBy)

    navigate(`/search?${params.toString()}`, { replace: true })
    performSearch(query, filters, 1)
  }, [query, activeCategory, filters, navigate, performSearch])

  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters)
      if (query) {
        performSearch(query, newFilters, 1)
      }
    },
    [query, performSearch]
  )

  const handleCategoryChange = useCallback(
    (category: CategoryType) => {
      setActiveCategory(category)

      const params = new URLSearchParams(searchParams)
      params.set('category', category)
      navigate(`/search?${params.toString()}`, { replace: true })
    },
    [navigate, searchParams]
  )

  const handleResultClick = useCallback(
    (item: SearchResultItem) => {
      const userId = localStorage.getItem('userId')
      if (userId) {
        searchSuggestionService.trackSearchBehavior(userId, {
          searchQuery: query,
          resultClicked: true,
          clickedResultId: item.id,
          clickedResultType: item.type,
          clickPosition: results.findIndex(r => r.id === item.id)
        })
      }

      switch (item.type) {
        case 'work':
          navigate(`/post/${item.id}`)
          break
        case 'user':
          navigate(`/author/${item.author?.id || item.id}`)
          break
        case 'page':
          navigate(`/events/${item.id}`)
          break
        default:
          navigate(`/search?query=${encodeURIComponent(item.title)}`)
      }
    },
    [query, results, navigate]
  )

  const handleLoadMore = useCallback(() => {
    if (currentPage < totalPages && !isLoading) {
      performSearch(query, filters, currentPage + 1)
    }
  }, [currentPage, totalPages, isLoading, query, filters, performSearch])

  const handleClearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setTotalResults(0)
    setTotalPages(0)
    navigate('/search')
  }, [navigate])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.types.length > 0) count++
    if (filters.tags.length > 0) count++
    if (filters.categories.length > 0) count++
    if (filters.dateRange.start || filters.dateRange.end) count++
    if (filters.creator.id || filters.creator.name) count++
    return count
  }, [filters])

  return (
    <div
      className={cn(
        'min-h-screen',
        isDark
          ? 'bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800'
          : 'bg-gradient-to-b from-gray-50 via-white to-gray-50'
      )}
    >
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b">
        <div
          className={cn(
            'border-b',
            isDark
              ? 'bg-gray-900/80 border-gray-800'
              : 'bg-white/80 border-gray-200'
          )}
        >
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4 mb-4">
              <div
                className={cn(
                  'flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200',
                  isDark
                    ? 'bg-gray-800/50 border-gray-700 focus-within:border-gray-600'
                    : 'bg-gray-50 border-gray-200 focus-within:border-gray-300 focus-within:bg-white'
                )}
              >
                <Search
                  className={cn('w-5 h-5', isDark ? 'text-gray-500' : 'text-gray-400')}
                />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleSearch()
                    }
                  }}
                  placeholder="搜索感兴趣的内容..."
                  className={cn(
                    'flex-1 bg-transparent outline-none text-base',
                    isDark
                      ? 'text-white placeholder:text-gray-500'
                      : 'text-gray-900 placeholder:text-gray-400'
                  )}
                />
                {query && (
                  <button
                    onClick={handleClearSearch}
                    className={cn(
                      'p-1 rounded-full transition-colors',
                      isDark
                        ? 'hover:bg-gray-700 text-gray-500'
                        : 'hover:bg-gray-200 text-gray-400'
                    )}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <TianjinButton variant="primary" onClick={handleSearch}>
                搜索
              </TianjinButton>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors',
                  isDark
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span className="hidden sm:inline">筛选</span>
                {activeFilterCount > 0 && (
                  <span
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded-full',
                      isDark
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-500 text-white'
                    )}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            <SearchCategoryTabs
              results={results}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
              isDark={isDark}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex-shrink-0"
              >
                <SearchFilterPanel
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  aggregations={aggregations}
                  isDark={isDark}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 min-w-0">
            {!isLoading && results.length > 0 && (
              <div
                className={cn(
                  'mb-6 text-sm',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}
              >
                找到{' '}
                <span className="font-semibold text-primary">{totalResults}</span>{' '}
                个与
                <span className="font-semibold mx-1">"{query}"</span>相关的结果
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2
                  className={cn(
                    'w-12 h-12 animate-spin',
                    isDark ? 'text-blue-500' : 'text-primary'
                  )}
                />
                <p
                  className={cn(
                    'mt-4 text-lg font-medium',
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  )}
                >
                  正在搜索...
                </p>
              </div>
            ) : results.length > 0 ? (
              <>
                <SearchResultsGrid
                  results={results}
                  activeCategory={activeCategory}
                  onItemClick={handleResultClick}
                  isDark={isDark}
                />

                {currentPage < totalPages && (
                  <div className="flex justify-center mt-8">
                    <TianjinButton
                      variant="secondary"
                      onClick={handleLoadMore}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          加载中...
                        </>
                      ) : (
                        '加载更多'
                      )}
                    </TianjinButton>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div
                  className={cn(
                    'w-24 h-24 rounded-full flex items-center justify-center mb-6',
                    isDark ? 'bg-gray-800' : 'bg-gray-100'
                  )}
                >
                  <Search
                    className={cn(
                      'w-12 h-12',
                      isDark ? 'text-gray-600' : 'text-gray-400'
                    )}
                  />
                </div>
                <h2
                  className={cn(
                    'text-2xl font-bold mb-2',
                    isDark ? 'text-white' : 'text-gray-900'
                  )}
                >
                  未找到相关结果
                </h2>
                <p
                  className={cn(
                    'mb-8',
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  )}
                >
                  尝试调整搜索关键词或筛选条件
                </p>
                <div className="flex gap-3">
                  <TianjinButton variant="primary" onClick={() => navigate('/square')}>
                    浏览广场
                  </TianjinButton>
                  <TianjinButton
                    variant="secondary"
                    onClick={() => {
                      setFilters({
                        types: [],
                        tags: [],
                        categories: [],
                        dateRange: { start: null, end: null },
                        creator: {},
                        sortBy: 'relevance',
                        sortOrder: 'desc'
                      })
                    }}
                  >
                    重置筛选
                  </TianjinButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedSearchPage
