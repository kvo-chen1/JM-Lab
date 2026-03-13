import { SearchResultItem } from './advancedSearchService'

export interface SortingWeights {
  relevance: number
  popularity: number
  recency: number
  personalization: number
}

export interface UserPreferences {
  preferredCategories?: string[]
  preferredTags?: string[]
  preferredAuthors?: string[]
  viewHistory?: string[]
  likeHistory?: string[]
}

export interface SearchContext {
  query: string
  timestamp: number
  deviceType?: 'desktop' | 'mobile' | 'tablet'
  sessionId?: string
}

class SearchSortingService {
  private defaultWeights: SortingWeights = {
    relevance: 0.4,
    popularity: 0.25,
    recency: 0.2,
    personalization: 0.15
  }

  sortResults(
    results: SearchResultItem[],
    sortBy: 'relevance' | 'latest' | 'popular' | 'mostLiked' | 'mostViewed' | 'personalized',
    sortOrder: 'asc' | 'desc' = 'desc',
    userPreferences?: UserPreferences,
    context?: SearchContext
  ): SearchResultItem[] {
    const sorted = [...results]

    switch (sortBy) {
      case 'relevance':
        return this.sortByRelevance(sorted, sortOrder, userPreferences, context)
      case 'latest':
        return this.sortByRecency(sorted, sortOrder)
      case 'popular':
        return this.sortByPopularity(sorted, sortOrder)
      case 'mostLiked':
        return this.sortByLikes(sorted, sortOrder)
      case 'mostViewed':
        return this.sortByViews(sorted, sortOrder)
      case 'personalized':
        return this.sortByPersonalization(sorted, sortOrder, userPreferences, context)
      default:
        return this.sortByRelevance(sorted, sortOrder, userPreferences, context)
    }
  }

  private sortByRelevance(
    results: SearchResultItem[],
    sortOrder: string,
    userPreferences?: UserPreferences,
    context?: SearchContext
  ): SearchResultItem[] {
    return results
      .map(item => ({
        ...item,
        score: this.calculateRelevanceScore(item, userPreferences, context)
      }))
      .sort((a, b) => {
        const diff = (b.score || 0) - (a.score || 0)
        return sortOrder === 'desc' ? diff : -diff
      })
  }

  private sortByRecency(results: SearchResultItem[], sortOrder: string): SearchResultItem[] {
    return results.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      const diff = dateB - dateA
      return sortOrder === 'desc' ? diff : -diff
    })
  }

  private sortByPopularity(results: SearchResultItem[], sortOrder: string): SearchResultItem[] {
    return results
      .map(item => ({
        ...item,
        score: this.calculatePopularityScore(item)
      }))
      .sort((a, b) => {
        const diff = (b.score || 0) - (a.score || 0)
        return sortOrder === 'desc' ? diff : -diff
      })
  }

  private sortByLikes(results: SearchResultItem[], sortOrder: string): SearchResultItem[] {
    return results.sort((a, b) => {
      const likesA = a.stats?.likes || 0
      const likesB = b.stats?.likes || 0
      const diff = likesB - likesA
      return sortOrder === 'desc' ? diff : -diff
    })
  }

  private sortByViews(results: SearchResultItem[], sortOrder: string): SearchResultItem[] {
    return results.sort((a, b) => {
      const viewsA = a.stats?.views || 0
      const viewsB = b.stats?.views || 0
      const diff = viewsB - viewsA
      return sortOrder === 'desc' ? diff : -diff
    })
  }

  private sortByPersonalization(
    results: SearchResultItem[],
    sortOrder: string,
    userPreferences?: UserPreferences,
    context?: SearchContext
  ): SearchResultItem[] {
    if (!userPreferences) {
      return this.sortByRelevance(results, sortOrder, userPreferences, context)
    }

    return results
      .map(item => ({
        ...item,
        score: this.calculatePersonalizedScore(item, userPreferences, context)
      }))
      .sort((a, b) => {
        const diff = (b.score || 0) - (a.score || 0)
        return sortOrder === 'desc' ? diff : -diff
      })
  }

  calculateRelevanceScore(
    item: SearchResultItem,
    userPreferences?: UserPreferences,
    context?: SearchContext
  ): number {
    let score = item.score || 50

    if (context?.query) {
      const queryLower = context.query.toLowerCase()
      const titleLower = item.title.toLowerCase()
      const descLower = (item.description || '').toLowerCase()

      if (titleLower === queryLower) {
        score += 30
      } else if (titleLower.startsWith(queryLower)) {
        score += 20
      } else if (titleLower.includes(queryLower)) {
        score += 10
      }

      if (descLower.includes(queryLower)) {
        score += 5
      }

      if (item.tags?.some(tag => tag.toLowerCase().includes(queryLower))) {
        score += 15
      }
    }

    score += this.calculatePopularityScore(item) * 0.3

    if (userPreferences) {
      score += this.calculatePersonalizationBonus(item, userPreferences) * 0.2
    }

    return Math.min(score, 100)
  }

  calculatePopularityScore(item: SearchResultItem): number {
    const views = item.stats?.views || 0
    const likes = item.stats?.likes || 0
    const comments = item.stats?.comments || 0
    const favorites = item.stats?.favorites || 0

    const viewScore = Math.min(views / 1000, 25)
    const likeScore = Math.min(likes / 100, 25)
    const commentScore = Math.min(comments / 50, 25)
    const favoriteScore = Math.min(favorites / 50, 25)

    return viewScore + likeScore + commentScore + favoriteScore
  }

  calculatePersonalizedScore(
    item: SearchResultItem,
    userPreferences: UserPreferences,
    context?: SearchContext
  ): number {
    let score = this.calculateRelevanceScore(item, userPreferences, context)

    score += this.calculatePersonalizationBonus(item, userPreferences)

    return Math.min(score, 100)
  }

  private calculatePersonalizationBonus(
    item: SearchResultItem,
    userPreferences: UserPreferences
  ): number {
    let bonus = 0

    if (userPreferences.preferredCategories && item.category) {
      if (userPreferences.preferredCategories.includes(item.category)) {
        bonus += 15
      }
    }

    if (userPreferences.preferredTags && item.tags) {
      const matchingTags = item.tags.filter(tag =>
        userPreferences.preferredTags!.includes(tag)
      )
      bonus += matchingTags.length * 5
    }

    if (userPreferences.preferredAuthors && item.author?.id) {
      if (userPreferences.preferredAuthors.includes(item.author.id)) {
        bonus += 20
      }
    }

    if (userPreferences.viewHistory && userPreferences.viewHistory.includes(item.id)) {
      bonus -= 10
    }

    if (userPreferences.likeHistory && userPreferences.likeHistory.includes(item.id)) {
      bonus += 10
    }

    return bonus
  }

  calculateRecencyScore(item: SearchResultItem): number {
    if (!item.createdAt) return 0

    const now = Date.now()
    const created = new Date(item.createdAt).getTime()
    const ageInDays = (now - created) / (1000 * 60 * 60 * 24)

    if (ageInDays < 1) return 100
    if (ageInDays < 7) return 80
    if (ageInDays < 30) return 60
    if (ageInDays < 90) return 40
    if (ageInDays < 180) return 20
    return 10
  }

  multiDimensionalSort(
    results: SearchResultItem[],
    weights: Partial<SortingWeights> = {},
    userPreferences?: UserPreferences,
    context?: SearchContext
  ): SearchResultItem[] {
    const finalWeights = { ...this.defaultWeights, ...weights }

    return results
      .map(item => {
        const relevanceScore = this.calculateRelevanceScore(item, userPreferences, context)
        const popularityScore = this.calculatePopularityScore(item)
        const recencyScore = this.calculateRecencyScore(item)
        const personalizationScore = userPreferences
          ? this.calculatePersonalizedScore(item, userPreferences, context)
          : 50

        const finalScore =
          relevanceScore * finalWeights.relevance +
          popularityScore * finalWeights.popularity +
          recencyScore * finalWeights.recency +
          personalizationScore * finalWeights.personalization

        return {
          ...item,
          score: finalScore
        }
      })
      .sort((a, b) => (b.score || 0) - (a.score || 0))
  }

  diversifyResults(
    results: SearchResultItem[],
    diversityFactor: number = 0.3
  ): SearchResultItem[] {
    if (results.length <= 1) return results

    const diversified: SearchResultItem[] = []
    const remaining = [...results]
    const seenCategories = new Set<string>()
    const seenAuthors = new Set<string>()

    diversified.push(remaining.shift()!)

    while (remaining.length > 0) {
      let bestIndex = 0
      let bestScore = -Infinity

      for (let i = 0; i < remaining.length; i++) {
        const item = remaining[i]
        let diversityScore = item.score || 0

        if (item.category && !seenCategories.has(item.category)) {
          diversityScore += 20 * diversityFactor
        }

        if (item.author?.id && !seenAuthors.has(item.author.id)) {
          diversityScore += 15 * diversityFactor
        }

        if (diversityScore > bestScore) {
          bestScore = diversityScore
          bestIndex = i
        }
      }

      const selected = remaining.splice(bestIndex, 1)[0]
      diversified.push(selected)

      if (selected.category) {
        seenCategories.add(selected.category)
      }
      if (selected.author?.id) {
        seenAuthors.add(selected.author.id)
      }
    }

    return diversified
  }

  setWeights(weights: Partial<SortingWeights>): void {
    this.defaultWeights = { ...this.defaultWeights, ...weights }
  }

  getWeights(): SortingWeights {
    return { ...this.defaultWeights }
  }
}

export const searchSortingService = new SearchSortingService()
export default searchSortingService
