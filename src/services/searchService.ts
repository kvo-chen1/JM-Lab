import { SearchResultType } from '@/components/SearchBar'
import { workService } from '@/services/apiService'

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

    switch (type) {
      case SearchResultType.WORK:
        return `/square?search=${encodedQuery}`
      case SearchResultType.USER:
        return `/user?name=${encodedQuery}`
      case SearchResultType.CATEGORY:
        return `/square?category=${encodedQuery}`
      case SearchResultType.TAG:
        return `/square?tag=${encodedQuery}`
      case SearchResultType.PAGE:
        // 特殊页面直接返回路径
        const specialPages = [
          { name: '共创向导', path: '/wizard' },
          { name: '津脉广场', path: '/square' },
          { name: '创作中心', path: '/create' },
          { name: '探索作品', path: '/square' },

        ]
        const page = specialPages.find(p => p.name.toLowerCase() === query.toLowerCase())
        return page ? page.path : `/square?search=${encodedQuery}`
      default:
        return `/square?search=${encodedQuery}`
    }
  }

  // 搜索所有类型的结果
  async searchAll(query: string): Promise<{
    works: any[]
    users: typeof SearchService.prototype.mockUsers
    categories: string[]
    tags: string[]
  }> {
    const lowerQuery = query.toLowerCase().trim()

    try {
      // 从API获取作品数据
      const worksData = await workService.getWorks();
      
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
          
          // 热门度加权
          score += (work.likes || 0) * 0.1 + (work.views || 0) * 0.01;
          
          return { ...work, score };
        })
        .filter(work => work.score > 0)
        .sort((a, b) => b.score - a.score);

      // 搜索用户
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

      return {
        works,
        users,
        categories,
        tags
      };
    } catch (error) {
      console.error('搜索失败:', error);
      return {
        works: [],
        users: [],
        categories: [],
        tags: []
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
  }): void {
    // 这里可以实现搜索事件的跟踪逻辑，例如发送到分析服务
    console.log('Search Event:', event)
    // 实际项目中可以使用第三方分析服务如Google Analytics或自定义API
  }
}

// 导出单例实例
export const searchService = new SearchService()

export default searchService
