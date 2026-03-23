import { SearchResultType } from '@/components/SearchBar'
import { workService } from '@/services/apiService'
import { behaviorAnalysisService } from '@/services/behaviorAnalysisService'
import { eventService, Event } from '@/services/eventService'
import { communityService } from '@/services/communityService'
import { getProducts, getMerchantProducts, Product } from '@/services/productService'
import { supabase } from '@/lib/supabase'

// 搜索结果类型
export interface SearchResult {
  id: string
  text: string
  type: SearchResultType
  icon?: string
}

// 搜索分类结果
export interface SearchClassificationResult {
  query: string
  primaryType: SearchResultType
  confidence: number
  suggestedResults: SearchResult[]
}

// 搜索服务类
class SearchService {
  // 模拟用户数据
  private mockUsers = [
    { id: '1', name: '张三', avatar: 'https://example.com/avatar1.jpg', works: 12, followers: 100 },
    { id: '2', name: '李四', avatar: 'https://example.com/avatar2.jpg', works: 8, followers: 80 },
    { id: '3', name: '王五', avatar: 'https://example.com/avatar3.jpg', works: 15, followers: 150 },
    { id: '4', name: '赵六', avatar: 'https://example.com/avatar4.jpg', works: 5, followers: 50 },
    { id: '5', name: '孙七', avatar: 'https://example.com/avatar5.jpg', works: 20, followers: 200 }
  ]

  // 模拟分类数据
  private mockCategories = [
    '全部', '国潮设计', '纹样设计', '品牌设计', '非遗传承', '插画设计', '工艺创新', '老字号品牌', 'IP设计', '包装设计'
  ]

  // 从作品中提取所有标签
  private async getAllTags(): Promise<string[]> {
    try {
      const works = await workService.getWorks();
      const tagsSet = new Set<string>();
      works.forEach(work => {
        if (work.tags) {
          work.tags.forEach(tag => tagsSet.add(tag));
        }
      });
      return Array.from(tagsSet);
    } catch (error) {
      console.error('获取标签失败:', error);
      return [];
    }
  }

  // 同步版本的getAllTags，用于需要立即返回的场景
  private getAllTagsSync(): string[] {
    // 返回一些默认标签，实际应用中可以从缓存或其他地方获取
    return ['国潮设计', '纹样设计', '品牌设计', '非遗传承', '插画设计', '工艺创新', '老字号品牌', 'IP设计', '包装设计'];
  }

  // 分析查询意图，确定主要结果类型
  classifyQuery(query: string): SearchClassificationResult {
    const lowerQuery = query.toLowerCase().trim()
    let primaryType: SearchResultType = SearchResultType.WORK
    let confidence = 0.5
    const suggestedResults: SearchResult[] = []

    // 1. 检查是否是特殊页面
    const specialPages = [
      { name: '共创向导', path: '/wizard', icon: 'fas fa-magic' },
      { name: '津脉广场', path: '/square', icon: 'fas fa-users' },
      { name: '创作中心', path: '/create', icon: 'fas fa-wand-magic-sparkles' },
      { name: '探索作品', path: '/explore', icon: 'fas fa-compass' },

    ]
    
    const exactPage = specialPages.find(page => page.name.toLowerCase() === lowerQuery)
    if (exactPage) {
      primaryType = SearchResultType.PAGE
      confidence = 0.99
      suggestedResults.push({
        id: exactPage.path,
        text: exactPage.name,
        type: SearchResultType.PAGE,
        icon: exactPage.icon || 'fas fa-file'
      })
    }

    // 2. 检查是否是精确的用户名
    const exactUser = this.mockUsers.find(user => user.name.toLowerCase() === lowerQuery)
    if (exactUser) {
      primaryType = SearchResultType.USER
      confidence = 0.95
      suggestedResults.push({
        id: exactUser.id,
        text: exactUser.name,
        type: SearchResultType.USER,
        icon: 'fas fa-user'
      })
    }

    // 2. 检查是否是精确的分类名
    const exactCategory = this.mockCategories.find(category => category.toLowerCase() === lowerQuery)
    if (exactCategory) {
      primaryType = SearchResultType.CATEGORY
      confidence = 0.9
      suggestedResults.push({
        id: exactCategory,
        text: exactCategory,
        type: SearchResultType.CATEGORY,
        icon: 'fas fa-folder'
      })
    }

    // 3. 检查是否是精确的标签名
    const exactTag = this.getAllTagsSync().find(tag => tag.toLowerCase() === lowerQuery)
    if (exactTag) {
      primaryType = SearchResultType.TAG
      confidence = 0.85
      suggestedResults.push({
        id: exactTag,
        text: exactTag,
        type: SearchResultType.TAG,
        icon: 'fas fa-tag'
      })
    }

    // 4. 生成搜索建议
    if (suggestedResults.length === 0) {
      // 从作品标题中搜索 - 暂时使用空数组，后续可以从API获取
      const workSuggestions: SearchResult[] = []

      // 从用户名中搜索
      const userSuggestions = this.mockUsers
        .filter(user => user.name.toLowerCase().includes(lowerQuery))
        .slice(0, 2)
        .map(user => ({
          id: user.id,
          text: user.name,
          type: SearchResultType.USER,
          icon: 'fas fa-user'
        }))

      // 从标签中搜索
      const tagSuggestions = this.getAllTagsSync()
        .filter(tag => tag.toLowerCase().includes(lowerQuery))
        .slice(0, 2)
        .map(tag => ({
          id: tag,
          text: tag,
          type: SearchResultType.TAG,
          icon: 'fas fa-tag'
        }))

      // 从分类中搜索
      const categorySuggestions = this.mockCategories
        .filter(category => category.toLowerCase().includes(lowerQuery))
        .slice(0, 2)
        .map(category => ({
          id: category,
          text: category,
          type: SearchResultType.CATEGORY,
          icon: 'fas fa-folder'
        }))

      // 5. 搜索特殊页面
      const specialPages = [
        { name: '共创向导', path: '/wizard', icon: 'fas fa-magic' },
        { name: '津脉广场', path: '/square', icon: 'fas fa-users' },
        { name: '创作中心', path: '/create', icon: 'fas fa-wand-magic-sparkles' },
        { name: '探索作品', path: '/explore', icon: 'fas fa-compass' },

      ]
      
      const pageSuggestions = specialPages
        .filter(page => page.name.toLowerCase().includes(lowerQuery))
        .slice(0, 3)
        .map(page => ({
          id: page.path,
          text: page.name,
          type: SearchResultType.PAGE,
          icon: page.icon
        }))

      // 合并所有建议
      suggestedResults.push(...pageSuggestions, ...workSuggestions, ...userSuggestions, ...tagSuggestions, ...categorySuggestions)

      // 确定主要类型
      if (pageSuggestions.length > 0) {
        primaryType = SearchResultType.PAGE
        confidence = 0.8
      } else if (workSuggestions.length > 0) {
        primaryType = SearchResultType.WORK
        confidence = 0.7
      } else if (userSuggestions.length > 0) {
        primaryType = SearchResultType.USER
        confidence = 0.6
      } else if (tagSuggestions.length > 0) {
        primaryType = SearchResultType.TAG
        confidence = 0.6
      } else if (categorySuggestions.length > 0) {
        primaryType = SearchResultType.CATEGORY
        confidence = 0.6
      }
    }

    return {
      query,
      primaryType,
      confidence,
      suggestedResults
    }
  }

  // 生成搜索建议
  generateSuggestions(query: string): SearchResult[] {
    const classification = this.classifyQuery(query)
    
    // 优化搜索建议排序，优先显示最相关的结果
    return classification.suggestedResults
      .sort((a, b) => {
        // 按类型优先级排序
        const typePriority: Record<string, number> = {
          [SearchResultType.PAGE]: 5,
          [SearchResultType.WORK]: 4,
          [SearchResultType.USER]: 3,
          [SearchResultType.CATEGORY]: 2,
          [SearchResultType.TAG]: 1,
          'history': 0
        };
        
        // 按文本长度排序（更具体的建议优先）
        const lengthDiff = a.text.length - b.text.length;
        
        return typePriority[b.type] - typePriority[a.type] || lengthDiff;
      })
      // 去重，避免重复建议
      .filter((suggestion, index, self) =>
        index === self.findIndex((s) => s.text === suggestion.text && s.type === suggestion.type)
      )
      // 限制建议数量，避免过多结果
      .slice(0, 8);
  }

  // 根据查询和类型生成重定向URL
  generateRedirectUrl(query: string, type: SearchResultType): string {
    const encodedQuery = encodeURIComponent(query)

    // 默认跳转到搜索结果页面
    return `/search?query=${encodedQuery}`
  }

  // 搜索所有类型的结果
  async searchAll(query: string): Promise<{
    works: any[]
    users: typeof SearchService.prototype.mockUsers
    categories: string[]
    tags: string[]
    events: Event[]
    communities: any[]
    brands: any[]
    products: Product[]
    games: any[]
  }> {
    const lowerQuery = query.toLowerCase().trim()

    try {
      // 并行获取所有数据
      const [worksData, eventsData, communitiesData, productsData] = await Promise.all([
        workService.getWorks(),
        eventService.getAllPublicEvents(),
        communityService.getCommunities(),
        getMerchantProducts({ searchQuery: query, status: 'active', limit: 50 })
      ]);

      // 从数据库搜索品牌 (使用 brand_partnerships 表)
      const { data: brandsData, error: brandsError } = await supabase
        .from('brand_partnerships')
        .select('*')
        .eq('status', 'approved')
        .or(`brand_name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (brandsError) {
        console.error('Failed to fetch brands:', brandsError);
      }

      console.log('Brand search query:', query, 'Results:', brandsData?.length || 0, brandsData);

      // 确保worksData是数组
      const safeWorksData = Array.isArray(worksData) ? worksData : [];

      // 搜索作品并按相关性排序
      const works = safeWorksData
        .map((work: any) => {
          let score = 0;
          const titleLower = work.title?.toLowerCase() || '';
          const descLower = work.description?.toLowerCase() || '';
          const creatorLower = work.author?.username?.toLowerCase() || work.creator?.toLowerCase() || work.username?.toLowerCase() || '';
          const tags = work.tags || [];

          // 精确匹配权重
          if (titleLower === lowerQuery) score += 100;
          if (creatorLower === lowerQuery) score += 80;
          if (tags.some((tag: string) => tag.toLowerCase() === lowerQuery)) score += 60;

          // 前缀匹配权重
          if (titleLower.startsWith(lowerQuery)) score += 50;
          if (creatorLower.startsWith(lowerQuery)) score += 40;
          if (tags.some((tag: string) => tag.toLowerCase().startsWith(lowerQuery))) score += 30;

          // 包含匹配权重
          if (titleLower.includes(lowerQuery)) score += 20;
          if (descLower.includes(lowerQuery)) score += 15;
          if (tags.some((tag: string) => tag.toLowerCase().includes(lowerQuery))) score += 10;
          if (creatorLower.includes(lowerQuery)) score += 10;

          return { ...work, score };
        })
        // 只保留有文本匹配的结果（score >= 10），排除仅靠热门度加权的结果
        .filter(work => work.score >= 10)
        .sort((a, b) => b.score - a.score);

      // 搜索用户（暂时使用模拟数据，等待用户API）
      const users = this.mockUsers.filter(user =>
        user.name.toLowerCase().includes(lowerQuery)
      )

      // 搜索分类
      const categories = this.mockCategories.filter(category =>
        category.toLowerCase().includes(lowerQuery)
      )

      // 搜索标签
      const tags = this.getAllTagsSync().filter(tag =>
        tag.toLowerCase().includes(lowerQuery)
      )

      // 搜索活动
      const events = (eventsData || []).filter((event: Event) =>
        event.title?.toLowerCase().includes(lowerQuery) ||
        event.description?.toLowerCase().includes(lowerQuery) ||
        event.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
      );

      // 搜索社群
      const communities = (communitiesData || []).filter((community: any) =>
        community.name?.toLowerCase().includes(lowerQuery) ||
        community.description?.toLowerCase().includes(lowerQuery)
      );

      // 品牌数据
      const brands = brandsData || [];

      // 商品数据
      if (productsData.error) {
        console.error('商品搜索失败:', productsData.error);
      }
      const products = productsData.data || [];
      console.log('商品搜索结果:', { query, count: products.length, error: productsData.error });

      // 搜索游戏数据（从 games 表）
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (gamesError) {
        console.error('Failed to fetch games:', gamesError);
      }

      // 游戏数据 - 如果数据库查询失败，使用本地游戏列表过滤
      let games: any[] = [];
      if (gamesData && gamesData.length > 0) {
        games = gamesData;
      } else {
        // 本地游戏列表作为回退
        const localGames = [
          { id: 'cultural-knowledge', title: '文化知识挑战', description: '测试你对天津地方文化和中国传统文化的了解', category: 'quiz', difficulty: 'medium', players: 12580, rating: 4.8 },
          { id: 'cultural-memory', title: '文化记忆游戏', description: '翻牌匹配相同的文化元素，挑战你的记忆力和文化知识', category: 'memory', difficulty: 'easy', players: 8920, rating: 4.6 },
          { id: 'matching-game', title: '文化连连看', description: '连接相同的文化图案，在限定时间内完成所有配对', category: 'matching', difficulty: 'easy', players: 7560, rating: 4.5 },
          { id: 'puzzle-game', title: '文化拼图', description: '将打乱的天津文化图片拼回原样，锻炼你的观察力和耐心', category: 'puzzle', difficulty: 'medium', players: 6230, rating: 4.7 },
          { id: 'sorting-game', title: '文化排序', description: '按照时间顺序或重要性排序文化事件和人物', category: 'sorting', difficulty: 'hard', players: 4890, rating: 4.4 },
          { id: 'riddle-game', title: '文化猜谜', description: '根据提示猜出天津文化相关的谜语，考验你的文化积累', category: 'riddle', difficulty: 'medium', players: 5670, rating: 4.3 },
          { id: 'timeline-game', title: '文化时间轴', description: '将历史事件按照正确的时间顺序排列，了解天津文化的发展历程', category: 'timeline', difficulty: 'hard', players: 3450, rating: 4.5 },
          { id: 'spot-difference', title: '文化找茬', description: '找出两幅天津文化图片中的不同之处，锻炼你的观察力', category: 'spot', difficulty: 'easy', players: 9120, rating: 4.6 },
          { id: 'pair-matching', title: '文化配对', description: '将相关的文化元素进行配对，考验你的文化知识关联能力', category: 'pair', difficulty: 'easy', players: 7650, rating: 4.5 },
          { id: 'wordchain-game', title: '成语接龙', description: '经典成语接龙游戏，考验你的成语积累和反应速度', category: 'wordchain', difficulty: 'medium', players: 6780, rating: 4.7 },
        ];
        const lowerQuery = query.toLowerCase().trim();
        games = localGames.filter(game =>
          game.title.toLowerCase().includes(lowerQuery) ||
          game.description.toLowerCase().includes(lowerQuery)
        );
      }

      return {
        works,
        users,
        categories,
        tags,
        events,
        communities,
        brands,
        products,
        games
      };
    } catch (error) {
      console.error('搜索失败:', error);
      return {
        works: [],
        users: [],
        categories: [],
        tags: [],
        events: [],
        communities: [],
        brands: [],
        products: [],
        games: []
      };
    }
  }

  // 跟踪搜索事件（用于分析）
  trackSearchEvent(event: {
    query: string
    resultType: SearchResultType
    clicked: boolean
    clickIndex?: number
    timestamp: number
    userId?: string
  }): void {
    // 记录到控制台
    console.log('Search Event:', event)

    // 记录到行为分析服务
    if (event.userId) {
      behaviorAnalysisService.recordSearchBehavior(
        event.userId,
        event.query,
        undefined,
        { resultType: event.resultType },
        event.clicked ? {
          type: event.resultType,
          id: `result_${event.clickIndex || 0}`,
          position: event.clickIndex
        } : undefined
      ).catch(err => console.warn('记录搜索行为失败:', err))
    }
  }

  /**
   * 执行搜索并记录行为
   */
  async searchWithTracking(
    query: string,
    userId?: string,
    filters?: Record<string, any>
  ): Promise<{
    works: any[]
    users: any[]
    categories: string[]
    tags: string[]
  }> {
    // 执行搜索
    const results = await this.searchAll(query)

    // 记录搜索行为
    if (userId) {
      const totalResults = results.works.length + results.users.length + results.categories.length + results.tags.length
      behaviorAnalysisService.recordSearchBehavior(
        userId,
        query,
        totalResults,
        filters
      ).catch(err => console.warn('记录搜索行为失败:', err))
    }

    return results
  }
}

// 导出单例实例
export const searchService = new SearchService()

export default searchService
