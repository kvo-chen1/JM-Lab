export { default as advancedSearchService } from './advancedSearchService'
export { default as searchSortingService } from './searchSortingService'
export { default as searchSuggestionService } from './searchSuggestionService'

export type {
  AdvancedSearchFilters,
  SearchPagination,
  SearchResultItem,
  AdvancedSearchResult
} from './advancedSearchService'

export type {
  SortingWeights,
  UserPreferences,
  SearchContext
} from './searchSortingService'

export type {
  SearchSuggestion,
  SearchHistoryItem,
  HotSearchItem
} from './searchSuggestionService'
