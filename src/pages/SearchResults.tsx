import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { TianjinImage, TianjinButton } from '@/components/TianjinStyleComponents'
import searchService from '@/services/searchService'
import { SearchResultType } from '@/components/SearchBar'

// 搜索结果页面组件
export default function SearchResults() {
  const { isDark } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  
  // 从URL参数中获取搜索查询
  const [query, setQuery] = useState('')
  // 搜索结果类型定义
  interface SearchResults {
    works: any[];
    users: any[];
    categories: string[];
    tags: string[];
  }
  // 搜索结果
  const [searchResults, setSearchResults] = useState<SearchResults>({
    works: [],
    users: [],
    categories: [],
    tags: []
  })
  // 加载状态
  const [isLoading, setIsLoading] = useState(true)
  // 空结果状态
  const [isNoResults, setIsNoResults] = useState(false)

  // 从URL参数中提取搜索查询
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const searchQuery = params.get('query') || ''
    setQuery(searchQuery)
    
    if (searchQuery) {
      // 执行搜索
      performSearch(searchQuery)
    } else {
      // 空搜索，直接返回
      setIsLoading(false)
      setIsNoResults(true)
    }
  }, [location.search])

  // 处理结果点击
  const handleResultClick = (type: SearchResultType, value: string) => {
    const url = searchService.generateRedirectUrl(value, type)
    navigate(url)
    
    // 跟踪搜索点击事件
    searchService.trackSearchEvent({
      query,
      resultType: type,
      clicked: true,
      timestamp: Date.now()
    })
  }

  // 渲染作品结果
  const renderWorkResults = () => {
    const works = searchResults?.works || []
    
    if (works.length === 0) return null
    
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <i className="fas fa-image text-blue-500"></i>
            作品结果 ({works.length})
          </h2>
          <button
            onClick={() => navigate(`/square?search=${encodeURIComponent(query)}`)} 
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            查看全部
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {works.map(work => (
            <div
              key={work.id}
              className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md dark:shadow-gray-700 hover:shadow-xl dark:hover:shadow-gray-500 transition-all duration-300 cursor-pointer hover:scale-105`}
              onClick={() => handleResultClick(SearchResultType.WORK, work.title)}
            >
              <div className="relative group">
                <TianjinImage
                  src={work.thumbnail}
                  alt={work.title}
                  className="w-full h-48 object-cover"
                  quality="medium"
                  loading="lazy"
                />
              </div>
              
              <div className="p-4">
                {/* 创作者信息 */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <TianjinImage
                      src={work.creatorAvatar}
                      alt={work.creator}
                      className="w-full h-full object-cover"
                      disableFallback={false}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{work.creator}</p>
                  </div>
                </div>

                {/* 作品标题 */}
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 line-clamp-2">{work.title}</h3>

                {/* 标签 */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {work.tags.slice(0, 3).map((tag: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 统计信息 */}
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <i className="far fa-heart"></i>
                    <span>{work.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <i className="far fa-comment"></i>
                    <span>{work.comments}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <i className="far fa-eye"></i>
                    <span>{work.views}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 渲染用户结果
  const renderUserResults = () => {
    const users = searchResults?.users || []
    
    if (users.length === 0) return null
    
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <i className="fas fa-user text-green-500"></i>
            用户结果 ({users.length})
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {users.map(user => (
            <div
              key={user.id}
              className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md dark:shadow-gray-700 hover:shadow-xl dark:hover:shadow-gray-500 transition-all duration-300 cursor-pointer hover:scale-105`}
              onClick={() => handleResultClick(SearchResultType.USER, user.name)}
            >
              <div className="p-6 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-primary/50">
                  <TianjinImage
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    disableFallback={true}
                  />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">{user.name}</h3>
                
                <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <span>{user.works} 作品</span>
                  <span>{user.followers} 粉丝</span>
                </div>
                
                <TianjinButton
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    handleResultClick(SearchResultType.USER, user.name)
                  }}
                >
                  查看主页
                </TianjinButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 渲染分类结果
  const renderCategoryResults = () => {
    const categories = searchResults?.categories || []
    
    if (categories.length === 0) return null
    
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <i className="fas fa-folder text-purple-500"></i>
            分类结果 ({categories.length})
          </h2>
        </div>
        
        <div className="flex flex-wrap gap-4">
          {categories.map(category => (
            <div
              key={category}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-gray-700 hover:shadow-xl dark:hover:shadow-gray-500 transition-all duration-300 cursor-pointer hover:scale-105 flex items-center gap-3 px-6 py-4 ring-2 ${isDark ? 'ring-gray-700 hover:ring-primary' : 'ring-gray-200 hover:ring-primary'}`}
              onClick={() => handleResultClick(SearchResultType.CATEGORY, category)}
            >
              <i className="fas fa-folder text-purple-500 text-xl"></i>
              <span className="text-lg font-medium text-gray-800 dark:text-gray-200">{category}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 渲染标签结果
  const renderTagResults = () => {
    const tags = searchResults?.tags || []
    
    if (tags.length === 0) return null
    
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <i className="fas fa-tag text-yellow-500"></i>
            标签结果 ({tags.length})
          </h2>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {tags.map(tag => (
            <div
              key={tag}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer hover:scale-110 shadow-md hover:shadow-lg ${isDark 
                ? 'bg-gray-800 text-gray-200 hover:bg-yellow-600 hover:text-white' 
                : 'bg-white text-gray-800 hover:bg-yellow-500 hover:text-white'}`}
              onClick={() => handleResultClick(SearchResultType.TAG, tag)}
            >
              <i className="fas fa-tag mr-2"></i>
              {tag}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 执行搜索
  const performSearch = async (searchQuery: string) => {
    setIsLoading(true)
    
    try {
      const results = await searchService.searchAll(searchQuery)
      setSearchResults(results)
      
      // 检查是否有任何结果
      const hasResults = 
        results.works.length > 0 ||
        results.users.length > 0 ||
        results.categories.length > 0 ||
        results.tags.length > 0
      
      setIsNoResults(!hasResults)
    } catch (error) {
      console.error('搜索失败:', error)
      setSearchResults({ works: [], users: [], categories: [], tags: [] })
      setIsNoResults(true)
    } finally {
      setIsLoading(false)
    }
  }

  // 渲染空结果状态
  const renderNoResults = () => {
    return (
      <div className="text-center py-20">
        <div className="inline-block p-6 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
          <i className="fas fa-search text-4xl text-gray-400 dark:text-gray-500"></i>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">未找到相关结果</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          尝试调整搜索关键词或查看其他分类
        </p>
        
        <TianjinButton
          variant="primary"
          onClick={() => navigate('/')}
        >
          返回首页
        </TianjinButton>
      </div>
    )
  }

  // 渲染加载状态
  const renderLoading = () => {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">正在搜索...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-b from-gray-50 via-white to-gray-50'}`}>
      {/* 页面头部 */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          搜索结果
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md dark:shadow-gray-700 mb-8">
          <div className="flex items-center gap-3">
            <i className="fas fa-search text-gray-500 dark:text-gray-400 text-xl"></i>
            <span className="text-lg text-gray-600 dark:text-gray-300">
              搜索关键词: <strong className="text-primary">{query}</strong>
            </span>
          </div>
        </div>
        
        {/* 加载状态 */}
        {isLoading ? renderLoading() : null}
        
        {/* 空结果状态 */}
        {!isLoading && isNoResults ? renderNoResults() : null}
        
        {/* 搜索结果 */}
        {!isLoading && !isNoResults && (
          <div>
            {renderWorkResults()}
            {renderUserResults()}
            {renderCategoryResults()}
            {renderTagResults()}
          </div>
        )}
      </div>
    </div>
  )
}
