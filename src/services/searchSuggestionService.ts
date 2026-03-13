import { supabase } from '@/lib/supabase'
import { apiClient } from '@/lib/apiClient'

export interface SearchSuggestion {
  id: string
  text: string
  type: 'history' | 'hot' | 'recommended' | 'autocomplete'
  count?: number
  trend?: 'up' | 'down' | 'stable'
  category?: string
  timestamp?: string
}

export interface SearchHistoryItem {
  id: string
  query: string
  searchType: string
  resultCount: number
  filters?: Record<string, any>
  createdAt: string
}

export interface HotSearchItem {
  id: string
  query: string
  searchCount: number
  trendScore: number
  category?: string
  lastSearchedAt: string
}

class SearchSuggestionService {
  private historyCache: SearchHistoryItem[] = []
  private hotSearchCache: HotSearchItem[] = []
  private lastHistoryFetch: number = 0
  private lastHotSearchFetch: number = 0
  private readonly CACHE_TTL = 60000

  async getSearchHistory(
    userId: string,
    options: { limit?: number; keyword?: string } = {}
  ): Promise<SearchHistoryItem[]> {
    const { limit = 10, keyword } = options

    try {
      const params = new URLSearchParams()
      params.append('limit', String(limit))
      if (keyword) {
        params.append('keyword', keyword)
      }

      const response = await apiClient.get<{
        success: boolean
        data: {
          history: Array<{
            id: string
            query: string
            search_type: string
            result_count: number
            filters?: Record<string, any>
            created_at: string
          }>
          pagination: { total: number }
        }
      }>(`/api/search/history?${params.toString()}`)

      if (response.ok && response.data?.success) {
        this.historyCache = response.data.data.history.map(item => ({
          id: item.id,
          query: item.query,
          searchType: item.search_type,
          resultCount: item.result_count,
          filters: item.filters,
          createdAt: item.created_at
        }))
        this.lastHistoryFetch = Date.now()
        return this.historyCache
      }

      return this.historyCache
    } catch (error) {
      console.error('Get search history error:', error)
      return this.historyCache
    }
  }

  async saveSearchHistory(
    userId: string,
    query: string,
    options: {
      searchType?: string
      resultCount?: number
      filters?: Record<string, any>
    } = {}
  ): Promise<boolean> {
    const { searchType = 'general', resultCount = 0, filters } = options

    try {
      const response = await apiClient.post('/api/search/history', {
        query: query.trim(),
        searchType,
        resultCount,
        filters
      })

      if (response.ok) {
        this.lastHistoryFetch = 0
        return true
      }

      return false
    } catch (error) {
      console.error('Save search history error:', error)
      return false
    }
  }

  async deleteSearchHistoryItem(userId: string, historyId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete(`/api/search/history/${historyId}`)

      if (response.ok) {
        this.historyCache = this.historyCache.filter(item => item.id !== historyId)
        return true
      }

      return false
    } catch (error) {
      console.error('Delete search history item error:', error)
      return false
    }
  }

  async clearSearchHistory(userId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete('/api/search/history')

      if (response.ok) {
        this.historyCache = []
        return true
      }

      return false
    } catch (error) {
      console.error('Clear search history error:', error)
      return false
    }
  }

  async getHotSearches(
    options: { limit?: number; category?: string; timeRange?: string } = {}
  ): Promise<HotSearchItem[]> {
    const { limit = 10, category, timeRange = '7d' } = options

    const now = Date.now()
    if (
      this.hotSearchCache.length > 0 &&
      now - this.lastHotSearchFetch < this.CACHE_TTL
    ) {
      let filtered = this.hotSearchCache
      if (category) {
        filtered = filtered.filter(item => item.category === category)
      }
      return filtered.slice(0, limit)
    }

    try {
      const params = new URLSearchParams()
      params.append('limit', String(limit))
      if (category) {
        params.append('category', category)
      }
      params.append('timeRange', timeRange)

      const response = await apiClient.get<{
        success: boolean
        data: Array<{
          id: string
          query: string
          search_count: number
          trend_score: number
          category?: string
          last_searched_at: string
        }>
      }>(`/api/search/hot?${params.toString()}`)

      if (response.ok && response.data?.success) {
        this.hotSearchCache = response.data.data.map(item => ({
          id: item.id,
          query: item.query,
          searchCount: item.search_count,
          trendScore: item.trend_score,
          category: item.category,
          lastSearchedAt: item.last_searched_at
        }))
        this.lastHotSearchFetch = now
        return this.hotSearchCache
      }

      return this.getDefaultHotSearches()
    } catch (error) {
      console.error('Get hot searches error:', error)
      return this.getDefaultHotSearches()
    }
  }

  async getAutocompleteSuggestions(
    query: string,
    options: { limit?: number; userId?: string } = {}
  ): Promise<SearchSuggestion[]> {
    const { limit = 10, userId } = options

    if (!query || query.trim().length === 0) {
      return []
    }

    const suggestions: SearchSuggestion[] = []
    const lowerQuery = query.toLowerCase().trim()

    try {
      const { data: works, error: worksError } = await supabase
        .from('works')
        .select('title, tags')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('status', 'published')
        .limit(5)

      if (!worksError && works) {
        const titleSet = new Set<string>()
        const tagSet = new Set<string>()

        works.forEach((work: any) => {
          if (
            work.title &&
            work.title.toLowerCase().includes(lowerQuery) &&
            !titleSet.has(work.title)
          ) {
            titleSet.add(work.title)
            suggestions.push({
              id: `work_title_${work.title}`,
              text: work.title,
              type: 'autocomplete',
              category: '作品'
            })
          }

          work.tags?.forEach((tag: string) => {
            if (
              tag.toLowerCase().includes(lowerQuery) &&
              !tagSet.has(tag)
            ) {
              tagSet.add(tag)
              suggestions.push({
                id: `tag_${tag}`,
                text: tag,
                type: 'autocomplete',
                category: '标签'
              })
            }
          })
        })
      }

      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `%${query}%`)
        .limit(3)

      if (!usersError && users) {
        users.forEach((user: any) => {
          if (user.username) {
            suggestions.push({
              id: `user_${user.id}`,
              text: user.username,
              type: 'autocomplete',
              category: '用户'
            })
          }
        })
      }

      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title')
        .ilike('title', `%${query}%`)
        .eq('status', 'published')
        .limit(3)

      if (!eventsError && events) {
        events.forEach((event: any) => {
          if (event.title) {
            suggestions.push({
              id: `event_${event.id}`,
              text: event.title,
              type: 'autocomplete',
              category: '活动'
            })
          }
        })
      }
    } catch (error) {
      console.error('Get autocomplete suggestions error:', error)
    }

    return suggestions.slice(0, limit)
  }

  async getRecommendedSearches(
    userId?: string,
    options: { limit?: number } = {}
  ): Promise<SearchSuggestion[]> {
    const { limit = 10 } = options

    try {
      const params = new URLSearchParams()
      params.append('limit', String(limit))

      const response = await apiClient.get<{
        success: boolean
        data: Array<{
          id: string
          keyword: string
          category?: string
          weight?: number
          is_hot?: boolean
        }>
      }>(`/api/search/suggestions?${params.toString()}`)

      if (response.ok && response.data?.success) {
        return response.data.data.map(item => ({
          id: item.id,
          text: item.keyword,
          type: 'recommended' as const,
          category: item.category,
          count: item.weight
        }))
      }

      return this.getDefaultRecommendations()
    } catch (error) {
      console.error('Get recommended searches error:', error)
      return this.getDefaultRecommendations()
    }
  }

  async getPersonalizedSuggestions(
    userId: string,
    query: string,
    options: { limit?: number } = {}
  ): Promise<SearchSuggestion[]> {
    const { limit = 10 } = options

    const suggestions: SearchSuggestion[] = []

    try {
      const history = await this.getSearchHistory(userId, { limit: 5 })
      const lowerQuery = query.toLowerCase()

      history.forEach(item => {
        if (item.query.toLowerCase().includes(lowerQuery)) {
          suggestions.push({
            id: item.id,
            text: item.query,
            type: 'history',
            timestamp: item.createdAt
          })
        }
      })

      const autocomplete = await this.getAutocompleteSuggestions(query, {
        limit: limit - suggestions.length,
        userId
      })
      suggestions.push(...autocomplete)
    } catch (error) {
      console.error('Get personalized suggestions error:', error)
    }

    return suggestions.slice(0, limit)
  }

  async trackSearchBehavior(
    userId: string | null,
    data: {
      searchQuery: string
      resultClicked?: boolean
      clickedResultId?: string
      clickedResultType?: string
      clickPosition?: number
      searchContext?: Record<string, any>
      deviceType?: string
    }
  ): Promise<void> {
    try {
      await apiClient.post('/api/search/track', {
        searchQuery: data.searchQuery,
        resultClicked: data.resultClicked || false,
        clickedResultId: data.clickedResultId,
        clickedResultType: data.clickedResultType,
        clickPosition: data.clickPosition,
        searchContext: data.searchContext,
        deviceType: data.deviceType || 'desktop'
      })
    } catch (error) {
      console.error('Track search behavior error:', error)
    }
  }

  private getDefaultHotSearches(): HotSearchItem[] {
    return [
      { id: '1', query: '国潮设计', searchCount: 1250, trendScore: 95.5, category: 'design', lastSearchedAt: new Date().toISOString() },
      { id: '2', query: '纹样设计', searchCount: 980, trendScore: 88.2, category: 'design', lastSearchedAt: new Date().toISOString() },
      { id: '3', query: '品牌设计', searchCount: 856, trendScore: 82.1, category: 'design', lastSearchedAt: new Date().toISOString() },
      { id: '4', query: '非遗传承', searchCount: 743, trendScore: 76.8, category: 'culture', lastSearchedAt: new Date().toISOString() },
      { id: '5', query: '插画设计', searchCount: 692, trendScore: 72.3, category: 'design', lastSearchedAt: new Date().toISOString() },
      { id: '6', query: '文创产品', searchCount: 621, trendScore: 68.5, category: 'product', lastSearchedAt: new Date().toISOString() },
      { id: '7', query: '天津文化', searchCount: 580, trendScore: 65.2, category: 'culture', lastSearchedAt: new Date().toISOString() },
      { id: '8', query: 'IP设计', searchCount: 534, trendScore: 61.8, category: 'design', lastSearchedAt: new Date().toISOString() }
    ]
  }

  private getDefaultRecommendations(): SearchSuggestion[] {
    return [
      { id: '1', text: '国潮设计', type: 'recommended', category: 'design', count: 100 },
      { id: '2', text: '纹样设计', type: 'recommended', category: 'design', count: 95 },
      { id: '3', text: '品牌设计', type: 'recommended', category: 'design', count: 90 },
      { id: '4', text: '非遗传承', type: 'recommended', category: 'culture', count: 85 },
      { id: '5', text: '插画设计', type: 'recommended', category: 'design', count: 80 },
      { id: '6', text: '文创产品', type: 'recommended', category: 'product', count: 85 },
      { id: '7', text: '天津文化', type: 'recommended', category: 'culture', count: 80 },
      { id: '8', text: 'IP设计', type: 'recommended', category: 'design', count: 65 }
    ]
  }

  clearCache(): void {
    this.historyCache = []
    this.hotSearchCache = []
    this.lastHistoryFetch = 0
    this.lastHotSearchFetch = 0
  }
}

export const searchSuggestionService = new SearchSuggestionService()
export default searchSuggestionService
