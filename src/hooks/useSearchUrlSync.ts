import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { FilterState } from '@/components/SearchFilterPanel'
import { CategoryType } from '@/components/SearchCategoryTabs'

interface UseSearchUrlSyncOptions {
  defaultFilters?: Partial<FilterState>
  defaultCategory?: CategoryType
}

interface UseSearchUrlSyncReturn {
  query: string
  setQuery: (query: string) => void
  filters: FilterState
  setFilters: (filters: FilterState) => void
  activeCategory: CategoryType
  setActiveCategory: (category: CategoryType) => void
  page: number
  setPage: (page: number) => void
  updateUrl: (updates?: Partial<UrlUpdateParams>) => void
  resetFilters: () => void
}

interface UrlUpdateParams {
  query?: string
  category?: CategoryType
  filters?: Partial<FilterState>
  page?: number
}

const defaultFilterState: FilterState = {
  types: [],
  tags: [],
  categories: [],
  dateRange: { start: null, end: null },
  creator: {},
  sortBy: 'relevance',
  sortOrder: 'desc'
}

export function useSearchUrlSync(
  options: UseSearchUrlSyncOptions = {}
): UseSearchUrlSyncReturn {
  const { defaultFilters = {}, defaultCategory = 'all' } = options

  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [query, setQueryState] = useState<string>(() => {
    return searchParams.get('query') || ''
  })

  const [filters, setFiltersState] = useState<FilterState>(() => {
    const urlFilters: Partial<FilterState> = {}

    const types = searchParams.get('types')
    if (types) {
      urlFilters.types = types.split(',').filter(Boolean)
    }

    const tags = searchParams.get('tags')
    if (tags) {
      urlFilters.tags = tags.split(',').filter(Boolean)
    }

    const categories = searchParams.get('categories')
    if (categories) {
      urlFilters.categories = categories.split(',').filter(Boolean)
    }

    const dateStart = searchParams.get('dateStart')
    const dateEnd = searchParams.get('dateEnd')
    if (dateStart || dateEnd) {
      urlFilters.dateRange = {
        start: dateStart ? new Date(dateStart) : null,
        end: dateEnd ? new Date(dateEnd) : null
      }
    }

    const creatorId = searchParams.get('creatorId')
    const creatorName = searchParams.get('creatorName')
    if (creatorId || creatorName) {
      urlFilters.creator = {
        id: creatorId || undefined,
        name: creatorName || undefined
      }
    }

    const sortBy = searchParams.get('sortBy') as FilterState['sortBy']
    if (sortBy) {
      urlFilters.sortBy = sortBy
    }

    const sortOrder = searchParams.get('sortOrder') as FilterState['sortOrder']
    if (sortOrder) {
      urlFilters.sortOrder = sortOrder
    }

    return {
      ...defaultFilterState,
      ...defaultFilters,
      ...urlFilters
    }
  })

  const [activeCategory, setActiveCategoryState] = useState<CategoryType>(() => {
    return (searchParams.get('category') as CategoryType) || defaultCategory
  })

  const [page, setPageState] = useState<number>(() => {
    const pageParam = searchParams.get('page')
    return pageParam ? parseInt(pageParam, 10) : 1
  })

  useEffect(() => {
    const urlQuery = searchParams.get('query') || ''
    const urlCategory = (searchParams.get('category') as CategoryType) || defaultCategory
    const urlPage = searchParams.get('page')
    const urlSortBy = searchParams.get('sortBy')

    if (urlQuery !== query) {
      setQueryState(urlQuery)
    }

    if (urlCategory !== activeCategory) {
      setActiveCategoryState(urlCategory)
    }

    const newPage = urlPage ? parseInt(urlPage, 10) : 1
    if (newPage !== page) {
      setPageState(newPage)
    }

    if (urlSortBy && urlSortBy !== filters.sortBy) {
      setFiltersState(prev => ({ ...prev, sortBy: urlSortBy as FilterState['sortBy'] }))
    }
  }, [location.search])

  const updateUrl = useCallback(
    (updates?: Partial<UrlUpdateParams>) => {
      const newParams = new URLSearchParams()

      const finalQuery = updates?.query ?? query
      const finalCategory = updates?.category ?? activeCategory
      const finalFilters = updates?.filters
        ? { ...filters, ...updates.filters }
        : filters
      const finalPage = updates?.page ?? page

      if (finalQuery) {
        newParams.set('query', finalQuery)
      }

      if (finalCategory && finalCategory !== 'all') {
        newParams.set('category', finalCategory)
      }

      if (finalFilters.types && finalFilters.types.length > 0) {
        newParams.set('types', finalFilters.types.join(','))
      }

      if (finalFilters.tags && finalFilters.tags.length > 0) {
        newParams.set('tags', finalFilters.tags.join(','))
      }

      if (finalFilters.categories && finalFilters.categories.length > 0) {
        newParams.set('categories', finalFilters.categories.join(','))
      }

      if (finalFilters.dateRange.start) {
        newParams.set('dateStart', finalFilters.dateRange.start.toISOString())
      }

      if (finalFilters.dateRange.end) {
        newParams.set('dateEnd', finalFilters.dateRange.end.toISOString())
      }

      if (finalFilters.creator.id) {
        newParams.set('creatorId', finalFilters.creator.id)
      }

      if (finalFilters.creator.name) {
        newParams.set('creatorName', finalFilters.creator.name)
      }

      if (finalFilters.sortBy && finalFilters.sortBy !== 'relevance') {
        newParams.set('sortBy', finalFilters.sortBy)
      }

      if (finalFilters.sortOrder && finalFilters.sortOrder !== 'desc') {
        newParams.set('sortOrder', finalFilters.sortOrder)
      }

      if (finalPage > 1) {
        newParams.set('page', String(finalPage))
      }

      const searchString = newParams.toString()
      const newUrl = searchString ? `${location.pathname}?${searchString}` : location.pathname

      navigate(newUrl, { replace: true })
    },
    [query, activeCategory, filters, page, location.pathname, navigate]
  )

  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery)
      updateUrl({ query: newQuery, page: 1 })
    },
    [updateUrl]
  )

  const setFilters = useCallback(
    (newFilters: FilterState) => {
      setFiltersState(newFilters)
      updateUrl({ filters: newFilters, page: 1 })
    },
    [updateUrl]
  )

  const setActiveCategory = useCallback(
    (category: CategoryType) => {
      setActiveCategoryState(category)
      updateUrl({ category, page: 1 })
    },
    [updateUrl]
  )

  const setPage = useCallback(
    (newPage: number) => {
      setPageState(newPage)
      updateUrl({ page: newPage })
    },
    [updateUrl]
  )

  const resetFilters = useCallback(() => {
    const resetState: FilterState = {
      ...defaultFilterState,
      ...defaultFilters
    }
    setFiltersState(resetState)
    updateUrl({ filters: resetState, page: 1 })
  }, [defaultFilters, updateUrl])

  return {
    query,
    setQuery,
    filters,
    setFilters,
    activeCategory,
    setActiveCategory,
    page,
    setPage,
    updateUrl,
    resetFilters
  }
}

export default useSearchUrlSync
