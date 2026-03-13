import { supabase } from '@/lib/supabase'
import { SearchResultType } from '@/components/SearchBar'

export interface AdvancedSearchFilters {
  keyword?: string
  types?: SearchResultType[]
  tags?: string[]
  categories?: string[]
  dateRange?: {
    start?: Date
    end?: Date
  }
  creator?: {
    id?: string
    name?: string
  }
  sortBy?: 'relevance' | 'latest' | 'popular' | 'mostLiked' | 'mostViewed'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchPagination {
  page: number
  pageSize: number
}

export interface SearchResultItem {
  id: string
  type: SearchResultType
  title: string
  description?: string
  image?: string
  thumbnail?: string
  createdAt?: string
  updatedAt?: string
  author?: {
    id: string
    name: string
    avatar?: string
  }
  stats?: {
    views?: number
    likes?: number
    comments?: number
    favorites?: number
  }
  tags?: string[]
  category?: string
  score?: number
}

export interface AdvancedSearchResult {
  items: SearchResultItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  aggregations?: {
    types: { type: string; count: number }[]
    tags: { tag: string; count: number }[]
    categories: { category: string; count: number }[]
  }
}

class AdvancedSearchService {
  async advancedSearch(
    filters: AdvancedSearchFilters,
    pagination: SearchPagination = { page: 1, pageSize: 20 }
  ): Promise<AdvancedSearchResult> {
    const { keyword, types, tags, categories, dateRange, creator, sortBy = 'relevance', sortOrder = 'desc' } = filters
    const { page, pageSize } = pagination

    const results: SearchResultItem[] = []
    let totalCount = 0
    const typeCounts: Map<string, number> = new Map()
    const tagCounts: Map<string, number> = new Map()
    const categoryCounts: Map<string, number> = new Map()

    const shouldSearchWorks = !types || types.includes(SearchResultType.WORK) || types.length === 0
    const shouldSearchUsers = !types || types.includes(SearchResultType.USER) || types.length === 0
    const shouldSearchEvents = !types || types.includes(SearchResultType.PAGE) || types.length === 0

    if (shouldSearchWorks) {
      const worksResult = await this.searchWorks(filters, pagination)
      results.push(...worksResult.items)
      totalCount += worksResult.total
      worksResult.items.forEach(item => {
        typeCounts.set(SearchResultType.WORK, (typeCounts.get(SearchResultType.WORK) || 0) + 1)
        item.tags?.forEach(tag => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1))
        if (item.category) categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1)
      })
    }

    if (shouldSearchUsers) {
      const usersResult = await this.searchUsers(filters, pagination)
      results.push(...usersResult.items)
      totalCount += usersResult.total
      usersResult.items.forEach(item => {
        typeCounts.set(SearchResultType.USER, (typeCounts.get(SearchResultType.USER) || 0) + 1)
      })
    }

    if (shouldSearchEvents) {
      const eventsResult = await this.searchEvents(filters, pagination)
      results.push(...eventsResult.items)
      totalCount += eventsResult.total
      eventsResult.items.forEach(item => {
        typeCounts.set(SearchResultType.PAGE, (typeCounts.get(SearchResultType.PAGE) || 0) + 1)
        item.tags?.forEach(tag => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1))
      })
    }

    const sortedResults = this.sortResults(results, sortBy, sortOrder)

    const startIndex = (page - 1) * pageSize
    const paginatedResults = sortedResults.slice(startIndex, startIndex + pageSize)

    return {
      items: paginatedResults,
      total: totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      aggregations: {
        types: Array.from(typeCounts.entries()).map(([type, count]) => ({ type, count })),
        tags: Array.from(tagCounts.entries())
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20),
        categories: Array.from(categoryCounts.entries())
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      }
    }
  }

  private async searchWorks(
    filters: AdvancedSearchFilters,
    pagination: SearchPagination
  ): Promise<{ items: SearchResultItem[]; total: number }> {
    const { keyword, tags, categories, dateRange, creator } = filters

    try {
      let query = supabase
        .from('works')
        .select('*', { count: 'exact' })
        .eq('status', 'published')

      if (keyword) {
        query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`)
      }

      if (tags && tags.length > 0) {
        query = query.contains('tags', tags)
      }

      if (categories && categories.length > 0) {
        query = query.in('category', categories)
      }

      if (dateRange?.start) {
        query = query.gte('created_at', dateRange.start.toISOString())
      }

      if (dateRange?.end) {
        query = query.lte('created_at', dateRange.end.toISOString())
      }

      if (creator?.id) {
        query = query.eq('author_id', creator.id)
      }

      if (creator?.name) {
        query = query.ilike('author_name', `%${creator.name}%`)
      }

      const { page, pageSize } = pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      query = query.range(from, to).order('created_at', { ascending: false })

      const { data, count, error } = await query

      if (error) {
        console.error('Search works error:', error)
        return { items: [], total: 0 }
      }

      const items: SearchResultItem[] = (data || []).map(work => ({
        id: work.id,
        type: SearchResultType.WORK,
        title: work.title,
        description: work.description,
        image: work.image_url || work.thumbnail,
        thumbnail: work.thumbnail,
        createdAt: work.created_at,
        updatedAt: work.updated_at,
        author: {
          id: work.author_id,
          name: work.author_name || '未知作者',
          avatar: work.author_avatar
        },
        stats: {
          views: work.view_count || 0,
          likes: work.like_count || 0,
          comments: work.comment_count || 0,
          favorites: work.favorite_count || 0
        },
        tags: work.tags || [],
        category: work.category,
        score: this.calculateRelevanceScore(work, keyword)
      }))

      return { items, total: count || 0 }
    } catch (error) {
      console.error('Search works error:', error)
      return { items: [], total: 0 }
    }
  }

  private async searchUsers(
    filters: AdvancedSearchFilters,
    pagination: SearchPagination
  ): Promise<{ items: SearchResultItem[]; total: number }> {
    const { keyword, creator } = filters

    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })

      const searchTerm = keyword || creator?.name
      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`)
      }

      const { page, pageSize } = pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      query = query.range(from, to)

      const { data, count, error } = await query

      if (error) {
        console.error('Search users error:', error)
        return { items: [], total: 0 }
      }

      const items: SearchResultItem[] = (data || []).map(user => ({
        id: user.id,
        type: SearchResultType.USER,
        title: user.username || '未知用户',
        description: user.bio,
        image: user.avatar_url,
        thumbnail: user.avatar_url,
        createdAt: user.created_at,
        author: {
          id: user.id,
          name: user.username || '未知用户',
          avatar: user.avatar_url
        },
        stats: {
          views: 0,
          likes: 0,
          comments: 0,
          favorites: 0
        },
        score: this.calculateUserRelevanceScore(user, searchTerm)
      }))

      return { items, total: count || 0 }
    } catch (error) {
      console.error('Search users error:', error)
      return { items: [], total: 0 }
    }
  }

  private async searchEvents(
    filters: AdvancedSearchFilters,
    pagination: SearchPagination
  ): Promise<{ items: SearchResultItem[]; total: number }> {
    const { keyword, tags, dateRange } = filters

    try {
      let query = supabase
        .from('events')
        .select('*', { count: 'exact' })
        .eq('status', 'published')

      if (keyword) {
        query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`)
      }

      if (tags && tags.length > 0) {
        query = query.contains('tags', tags)
      }

      if (dateRange?.start) {
        query = query.gte('start_date', dateRange.start.toISOString())
      }

      if (dateRange?.end) {
        query = query.lte('end_date', dateRange.end.toISOString())
      }

      const { page, pageSize } = pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      query = query.range(from, to).order('created_at', { ascending: false })

      const { data, count, error } = await query

      if (error) {
        console.error('Search events error:', error)
        return { items: [], total: 0 }
      }

      const items: SearchResultItem[] = (data || []).map(event => ({
        id: event.id,
        type: SearchResultType.PAGE,
        title: event.title,
        description: event.description,
        image: event.cover_image || event.image_url,
        thumbnail: event.cover_image || event.image_url,
        createdAt: event.created_at,
        author: {
          id: event.organizer_id,
          name: event.organizer_name || '主办方',
          avatar: undefined
        },
        stats: {
          views: event.view_count || 0,
          likes: event.like_count || 0,
          comments: 0,
          favorites: event.participant_count || 0
        },
        tags: event.tags || [],
        score: this.calculateRelevanceScore(event, keyword)
      }))

      return { items, total: count || 0 }
    } catch (error) {
      console.error('Search events error:', error)
      return { items: [], total: 0 }
    }
  }

  private calculateRelevanceScore(item: any, keyword?: string): number {
    if (!keyword) return 50

    let score = 0
    const lowerKeyword = keyword.toLowerCase()
    const title = (item.title || '').toLowerCase()
    const description = (item.description || '').toLowerCase()

    if (title === lowerKeyword) {
      score += 100
    } else if (title.startsWith(lowerKeyword)) {
      score += 80
    } else if (title.includes(lowerKeyword)) {
      score += 60
    }

    if (description.includes(lowerKeyword)) {
      score += 20
    }

    if (item.tags && Array.isArray(item.tags)) {
      if (item.tags.some((tag: string) => tag.toLowerCase() === lowerKeyword)) {
        score += 40
      } else if (item.tags.some((tag: string) => tag.toLowerCase().includes(lowerKeyword))) {
        score += 20
      }
    }

    const viewCount = item.view_count || item.views || 0
    const likeCount = item.like_count || item.likes || 0
    score += Math.min(viewCount / 100, 10)
    score += Math.min(likeCount / 10, 10)

    return Math.min(score, 100)
  }

  private calculateUserRelevanceScore(user: any, keyword?: string): number {
    if (!keyword) return 50

    let score = 0
    const lowerKeyword = keyword.toLowerCase()
    const username = (user.username || '').toLowerCase()
    const bio = (user.bio || '').toLowerCase()

    if (username === lowerKeyword) {
      score += 100
    } else if (username.startsWith(lowerKeyword)) {
      score += 80
    } else if (username.includes(lowerKeyword)) {
      score += 60
    }

    if (bio.includes(lowerKeyword)) {
      score += 20
    }

    return Math.min(score, 100)
  }

  private sortResults(
    results: SearchResultItem[],
    sortBy: string,
    sortOrder: string
  ): SearchResultItem[] {
    const sorted = [...results]

    switch (sortBy) {
      case 'relevance':
        sorted.sort((a, b) => (b.score || 0) - (a.score || 0))
        break
      case 'latest':
        sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateB - dateA
        })
        break
      case 'popular':
        sorted.sort((a, b) => {
          const viewsA = a.stats?.views || 0
          const viewsB = b.stats?.views || 0
          return viewsB - viewsA
        })
        break
      case 'mostLiked':
        sorted.sort((a, b) => {
          const likesA = a.stats?.likes || 0
          const likesB = b.stats?.likes || 0
          return likesB - likesA
        })
        break
      case 'mostViewed':
        sorted.sort((a, b) => {
          const viewsA = a.stats?.views || 0
          const viewsB = b.stats?.views || 0
          return viewsB - viewsA
        })
        break
      default:
        sorted.sort((a, b) => (b.score || 0) - (a.score || 0))
    }

    if (sortOrder === 'asc') {
      sorted.reverse()
    }

    return sorted
  }

  async getSearchSuggestions(query: string, limit: number = 10): Promise<string[]> {
    if (!query || query.trim().length === 0) {
      return []
    }

    const suggestions: Set<string> = new Set()
    const lowerQuery = query.toLowerCase()

    try {
      const { data: works } = await supabase
        .from('works')
        .select('title, tags')
        .ilike('title', `%${query}%`)
        .limit(5)

      works?.forEach((work: any) => {
        if (work.title && work.title.toLowerCase().includes(lowerQuery)) {
          suggestions.add(work.title)
        }
        work.tags?.forEach((tag: string) => {
          if (tag.toLowerCase().includes(lowerQuery)) {
            suggestions.add(tag)
          }
        })
      })

      const { data: users } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', `%${query}%`)
        .limit(3)

      users?.forEach((user: any) => {
        if (user.username) {
          suggestions.add(user.username)
        }
      })
    } catch (error) {
      console.error('Get search suggestions error:', error)
    }

    return Array.from(suggestions).slice(0, limit)
  }

  async getHotSearches(limit: number = 10): Promise<{ query: string; count: number }[]> {
    try {
      const { data, error } = await supabase
        .from('search_statistics')
        .select('query, count')
        .order('count', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Get hot searches error:', error)
        return this.getDefaultHotSearches()
      }

      return data || this.getDefaultHotSearches()
    } catch (error) {
      console.error('Get hot searches error:', error)
      return this.getDefaultHotSearches()
    }
  }

  private getDefaultHotSearches(): { query: string; count: number }[] {
    return [
      { query: '国潮设计', count: 1250 },
      { query: '纹样设计', count: 980 },
      { query: '品牌设计', count: 856 },
      { query: '非遗传承', count: 743 },
      { query: '插画设计', count: 692 },
      { query: '文创产品', count: 621 },
      { query: '天津文化', count: 580 },
      { query: 'IP设计', count: 534 }
    ]
  }
}

export const advancedSearchService = new AdvancedSearchService()
export default advancedSearchService
