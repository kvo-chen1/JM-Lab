import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { motion, AnimatePresence } from 'framer-motion'
import { TianjinImage, TianjinButton } from '@/components/TianjinStyleComponents'
import searchService from '@/services/searchService'
import templateService, { Template } from '@/services/templateService'
import { tianjinActivityService, TianjinTemplate } from '@/services/tianjinActivityService'
import { SearchResultType } from '@/components/SearchBar'
import { Search, Users, Image, Calendar, MessageCircle, Building2, Grid3X3, Loader2, FileText } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// 工具函数
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 搜索分类类型
interface SearchCategory {
  id: string
  label: string
  icon: React.ReactNode
  type: SearchResultType | 'all'
}

// 搜索分类配置
const searchCategories: SearchCategory[] = [
  { id: 'all', label: '综合', icon: <Grid3X3 className="w-4 h-4" />, type: 'all' },
  { id: 'square', label: '津脉广场', icon: <Building2 className="w-4 h-4" />, type: SearchResultType.WORK },
  { id: 'works', label: '津脉作品', icon: <Image className="w-4 h-4" />, type: SearchResultType.WORK },
  { id: 'users', label: '用户', icon: <Users className="w-4 h-4" />, type: SearchResultType.USER },
  { id: 'events', label: '津脉活动', icon: <Calendar className="w-4 h-4" />, type: SearchResultType.PAGE },
  { id: 'community', label: '津脉社群', icon: <MessageCircle className="w-4 h-4" />, type: SearchResultType.PAGE },
  { id: 'brands', label: '品牌方', icon: <Building2 className="w-4 h-4" />, type: SearchResultType.CATEGORY },
]

// 排序选项
const sortOptions = [
  { id: 'relevance', label: '综合排序' },
  { id: 'latest', label: '最新发布' },
  { id: 'popular', label: '最多播放' },
  { id: 'likes', label: '最多点赞' },
]

// 搜索结果页面组件
export default function SearchResults() {
  const { isDark } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  
  // 从URL参数中获取搜索查询
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeSort, setActiveSort] = useState('relevance')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  
  // 搜索结果类型定义
  interface SearchResultsData {
    works: any[];
    users: any[];
    categories: string[];
    tags: string[];
    events: any[];
    communities: any[];
    templates: Template[];
    tianjinTemplates: TianjinTemplate[];
    brands: any[];
  }

  // 搜索结果
  const [searchResults, setSearchResults] = useState<SearchResultsData>({
    works: [],
    users: [],
    categories: [],
    tags: [],
    events: [],
    communities: [],
    templates: [],
    tianjinTemplates: [],
    brands: []
  })
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(true)
  // 空结果状态
  const [isNoResults, setIsNoResults] = useState(false)

  // 从URL参数中提取搜索查询和分类
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const searchQuery = params.get('query') || ''
    const categoryParam = params.get('category') || 'all'

    setQuery(searchQuery)
    setActiveCategory(categoryParam)

    // 只在搜索查询变化时执行搜索，分类切换不重新搜索
    if (searchQuery && searchQuery !== lastSearchQuery.current) {
      lastSearchQuery.current = searchQuery
      performSearch(searchQuery)
    } else if (!searchQuery) {
      setIsLoading(false)
      setIsNoResults(true)
    }
  }, [location.search])

  // 用于追踪上一次搜索查询
  const lastSearchQuery = useRef('')

  // 执行搜索
  const performSearch = async (searchQuery: string) => {
    setIsLoading(true)

    try {
      const results = await searchService.searchAll(searchQuery)

      // 获取所有模板（确保数据已加载），然后搜索
      const allTemplates = templateService.getAllTemplates()
      const lowerQuery = searchQuery.toLowerCase()
      const templates = allTemplates.filter((t: Template) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.content?.toLowerCase().includes(lowerQuery) ||
        t.category?.toLowerCase().includes(lowerQuery) ||
        t.tags.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
      )

      // 获取天津特色模板并搜索
      const allTianjinTemplates = await tianjinActivityService.getTemplates()
      const tianjinTemplates = allTianjinTemplates.filter((t: TianjinTemplate) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.category.toLowerCase().includes(lowerQuery) ||
        t.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
      )

      // 使用真实数据
      setSearchResults({
        ...results,
        templates,
        tianjinTemplates
      })

      const hasResults =
        results.works.length > 0 ||
        results.users.length > 0 ||
        results.categories.length > 0 ||
        results.tags.length > 0 ||
        results.events.length > 0 ||
        results.communities.length > 0 ||
        templates.length > 0 ||
        tianjinTemplates.length > 0 ||
        results.brands.length > 0

      setIsNoResults(!hasResults)
    } catch (error) {
      console.error('搜索失败:', error)
      setSearchResults({ works: [], users: [], categories: [], tags: [], events: [], communities: [], templates: [], tianjinTemplates: [], brands: [] })
      setIsNoResults(true)
    } finally {
      setIsLoading(false)
    }
  }

  // 处理分类切换
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId)
    const params = new URLSearchParams(location.search)
    params.set('category', categoryId)
    navigate(`${location.pathname}?${params.toString()}`, { replace: true })
  }

  // 处理结果点击
  const handleResultClick = (type: SearchResultType, value: string, id?: string) => {
    // 根据类型跳转到不同页面
    let url: string
    switch (type) {
      case SearchResultType.WORK:
        // 跳转到作品详情页面进行预览
        url = id ? `/post/${id}` : `/square?search=${encodeURIComponent(value)}`
        break
      case SearchResultType.USER:
        url = `/author/${id || value}`
        break
      case SearchResultType.CATEGORY:
        url = `/square?category=${encodeURIComponent(value)}`
        break
      case SearchResultType.TAG:
        url = `/square?tag=${encodeURIComponent(value)}`
        break
      default:
        url = `/square?search=${encodeURIComponent(value)}`
    }
    navigate(url)

    searchService.trackSearchEvent({
      query,
      resultType: type,
      clicked: true,
      timestamp: Date.now()
    })
  }

  // 获取当前分类的统计数量
  const getCategoryCount = (categoryId: string) => {
    switch (categoryId) {
      case 'all':
        return searchResults.works.length + searchResults.users.length + searchResults.events.length + searchResults.communities.length + searchResults.templates.length + searchResults.tianjinTemplates.length + searchResults.brands.length
      case 'square':
        return searchResults.works.length
      case 'works':
        return searchResults.templates.length + searchResults.tianjinTemplates.length
      case 'users':
        return searchResults.users.length
      case 'events':
        return searchResults.events.length
      case 'community':
        return searchResults.communities.length
      case 'brands':
        return searchResults.brands.length
      default:
        return 0
    }
  }

  // 渲染作品结果卡片
  const WorkCard = ({ work }: { work: any }) => {
    // 判断作品类型（图片或视频）
    const videoSrc = work.videoUrl || work.video_url ||
      (work.thumbnail && (work.thumbnail.endsWith('.mp4') || work.thumbnail.endsWith('.webm') || work.thumbnail.endsWith('.mov')) ? work.thumbnail : null)
    const isVideo = !!videoSrc || work.media_type === 'video' || work.type === 'video' || work.duration
    const imageUrl = work.thumbnail || work.image || work.image_url || work.cover_image || '/images/default-work.jpg'

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className={cn(
          "group cursor-pointer rounded-xl overflow-hidden transition-all duration-300",
          isDark
            ? "bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600"
            : "bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md"
        )}
        onClick={() => handleResultClick(SearchResultType.WORK, work.title, work.id)}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {/* 视频类型：自动播放 */}
          {isVideo && videoSrc ? (
            <>
              <video
                src={videoSrc}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                playsInline
                loop
                autoPlay
                preload="metadata"
              />
              {/* 视频标识 */}
              <div className="absolute top-2 right-2 z-10">
                <span className="text-[10px] px-2 py-1 rounded-full bg-black/60 text-white flex items-center gap-1">
                  <i className="fas fa-video"></i>
                  视频
                </span>
              </div>
            </>
          ) : (
            /* 图片类型 */
            <TianjinImage
              src={imageUrl}
              alt={work.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              quality="medium"
              loading="lazy"
            />
          )}
        </div>

        <div className="p-4">
          <h3 className={cn(
            "font-semibold text-base mb-2 line-clamp-2",
            isDark ? "text-gray-100" : "text-gray-900"
          )}>
            {work.title}
          </h3>

          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
              <TianjinImage
                src={work.creatorAvatar || work.author?.avatar || work.author_avatar || '/images/default-avatar.jpg'}
                alt={work.creator || work.author?.username || '创作者'}
                className="w-full h-full object-cover"
                disableFallback={false}
              />
            </div>
            <span className={cn(
              "text-sm truncate",
              isDark ? "text-gray-400" : "text-gray-600"
            )}>
              {work.creator || work.author?.username || work.author_name || '创作者'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className={cn(
              "flex items-center gap-1",
              isDark ? "text-gray-500" : "text-gray-400"
            )}>
              {isVideo ? <i className="far fa-play-circle" /> : <i className="far fa-eye" />}
              {work.views || work.view_count || 0} 次{isVideo ? '播放' : '浏览'}
            </span>
            {isVideo && work.duration && (
              <span className={cn(
                "flex items-center gap-1",
                isDark ? "text-gray-500" : "text-gray-400"
              )}>
                <i className="far fa-clock" />
                {work.duration}
              </span>
            )}
            <span className={cn(
              "flex items-center gap-1",
              isDark ? "text-gray-500" : "text-gray-400"
            )}>
              <i className="far fa-heart" />
              {work.likes || work.like_count || 0}
            </span>
          </div>
        </div>
      </motion.div>
    )
  }

  // 渲染模板结果卡片
  const TemplateCard = ({ template }: { template: Template }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group cursor-pointer rounded-xl overflow-hidden transition-all duration-300",
        isDark
          ? "bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600"
          : "bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md"
      )}
      onClick={() => navigate(`/create?template=${template.id}`)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <TianjinImage
          src={template.thumbnail || '/images/default-template.jpg'}
          alt={template.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          quality="medium"
          loading="lazy"
        />
        {/* 官方模板标识 */}
        {template.isOfficial && (
          <div className="absolute top-2 left-2 z-10">
            <span className="text-[10px] px-2 py-1 rounded-full bg-primary text-white flex items-center gap-1">
              <i className="fas fa-check-circle"></i>
              官方
            </span>
          </div>
        )}
        {/* 悬停遮罩 */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <TianjinButton variant="primary" size="sm">
            使用模板
          </TianjinButton>
        </div>
      </div>

      <div className="p-4">
        <h3 className={cn(
          "font-semibold text-base mb-2 line-clamp-1",
          isDark ? "text-gray-100" : "text-gray-900"
        )}>
          {template.name}
        </h3>

        <p className={cn(
          "text-sm mb-3 line-clamp-2",
          isDark ? "text-gray-400" : "text-gray-500"
        )}>
          {template.description}
        </p>

        <div className="flex items-center justify-between text-xs">
          <span className={cn(
            "flex items-center gap-1",
            isDark ? "text-gray-500" : "text-gray-400"
          )}>
            <FileText className="w-3 h-3" />
            {template.category}
          </span>
          <span className={cn(
            "flex items-center gap-1",
            isDark ? "text-gray-500" : "text-gray-400"
          )}>
            <i className="fas fa-download" />
            {template.usageCount || 0} 次使用
          </span>
        </div>
      </div>
    </motion.div>
  )

  // 渲染天津模板结果卡片
  const TianjinTemplateCard = ({ template }: { template: TianjinTemplate }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group cursor-pointer rounded-xl overflow-hidden transition-all duration-300",
        isDark
          ? "bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600"
          : "bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md"
      )}
      onClick={() => navigate(`/create?tianjinTemplate=${template.id}`)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <TianjinImage
          src={template.thumbnail}
          alt={template.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          quality="medium"
          loading="lazy"
        />
        {/* 精选标识 */}
        {template.isFeatured && (
          <div className="absolute top-2 left-2 z-10">
            <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500 text-white flex items-center gap-1">
              <i className="fas fa-star"></i>
              精选
            </span>
          </div>
        )}
        {/* 难度标识 */}
        <div className="absolute top-2 right-2 z-10">
          <span className={cn(
            "text-[10px] px-2 py-1 rounded-full",
            template.difficulty === 'easy'
              ? "bg-green-500 text-white"
              : template.difficulty === 'medium'
                ? "bg-yellow-500 text-white"
                : "bg-red-500 text-white"
          )}>
            {template.difficulty === 'easy' ? '简单' : template.difficulty === 'medium' ? '中等' : '困难'}
          </span>
        </div>
        {/* 悬停遮罩 */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <TianjinButton variant="primary" size="sm">
            使用模板
          </TianjinButton>
        </div>
      </div>

      <div className="p-4">
        <h3 className={cn(
          "font-semibold text-base mb-2 line-clamp-1",
          isDark ? "text-gray-100" : "text-gray-900"
        )}>
          {template.name}
        </h3>

        <p className={cn(
          "text-sm mb-3 line-clamp-2",
          isDark ? "text-gray-400" : "text-gray-500"
        )}>
          {template.description}
        </p>

        <div className="flex items-center justify-between text-xs">
          <span className={cn(
            "flex items-center gap-1",
            isDark ? "text-gray-500" : "text-gray-400"
          )}>
            <FileText className="w-3 h-3" />
            {template.category}
          </span>
          <span className={cn(
            "flex items-center gap-1",
            isDark ? "text-gray-500" : "text-gray-400"
          )}>
            <i className="fas fa-fire" />
            {template.usageCount} 次使用
          </span>
        </div>
      </div>
    </motion.div>
  )

  // 渲染品牌结果卡片
  const BrandCard = ({ brand }: { brand: any }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group cursor-pointer rounded-xl p-4 transition-all duration-300",
        isDark
          ? "bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600"
          : "bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md"
      )}
      onClick={() => navigate(`/brand/${brand.id}`)}
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
          {brand.brand_logo || brand.logo_url || brand.logo ? (
            <TianjinImage
              src={brand.brand_logo || brand.logo_url || brand.logo}
              alt={brand.brand_name || brand.name}
              className="w-full h-full object-cover"
              disableFallback={true}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-2xl font-bold">
              {(brand.brand_name || brand.name || '?').charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn(
              "font-semibold text-base truncate",
              isDark ? "text-gray-100" : "text-gray-900"
            )}>
              {brand.brand_name || brand.name}
            </h3>
            {(brand.is_verified || brand.status === 'approved') && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-0.5">
                <i className="fas fa-check-circle text-[8px]" />
                认证
              </span>
            )}
          </div>

          <p className={cn(
            "text-sm mb-2 line-clamp-2",
            isDark ? "text-gray-400" : "text-gray-500"
          )}>
            {brand.description}
          </p>

          <div className="flex items-center gap-3 text-xs">
            <span className={cn(
              "px-2 py-0.5 rounded-full",
              isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
            )}>
              {brand.category || '品牌'}
            </span>
            {brand.popularity && (
              <span className={cn(
                "flex items-center gap-1",
                isDark ? "text-gray-500" : "text-gray-400"
              )}>
                <i className="fas fa-fire" />
                热度 {brand.popularity}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )

  // 渲染用户结果卡片
  const UserCard = ({ user }: { user: any }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group cursor-pointer rounded-xl p-6 text-center transition-all duration-300",
        isDark 
          ? "bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600" 
          : "bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md"
      )}
      onClick={() => handleResultClick(SearchResultType.USER, user.name || user.username, user.id)}
    >
      <div className="relative w-20 h-20 mx-auto mb-4">
        <div className="w-full h-full rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-background ring-primary/30">
          <TianjinImage
            src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'}
            alt={user.name || user.username}
            className="w-full h-full object-cover"
            disableFallback={true}
          />
        </div>
      </div>
      
      <h3 className={cn(
        "font-semibold text-lg mb-1",
        isDark ? "text-gray-100" : "text-gray-900"
      )}>
        {user.name || user.username}
      </h3>
      
      <p className={cn(
        "text-sm mb-3",
        isDark ? "text-gray-400" : "text-gray-500"
      )}>
        {user.bio || '创意设计师'}
      </p>
      
      <div className={cn(
        "flex justify-center gap-4 text-sm mb-4",
        isDark ? "text-gray-400" : "text-gray-600"
      )}>
        <span>{user.works || 12} 作品</span>
        <span>{user.followers || 100} 粉丝</span>
      </div>
      
      <TianjinButton
        variant="secondary"
        size="sm"
        className="w-full"
        onClick={(e) => {
          e.stopPropagation()
          handleResultClick(SearchResultType.USER, user.name || user.username)
        }}
      >
        查看主页
      </TianjinButton>
    </motion.div>
  )

  // 渲染活动结果卡片
  const EventCard = ({ event }: { event: any }) => {
    // 格式化日期
    const formatDate = (timestamp: number) => {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    }

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className={cn(
          "group cursor-pointer rounded-xl overflow-hidden transition-all duration-300",
          isDark
            ? "bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600"
            : "bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md"
        )}
        onClick={() => navigate(`/events/${event.id}`)}
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          <TianjinImage
            src={event.imageUrl || '/images/default-event.jpg'}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            quality="medium"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">{event.title}</h3>
            <p className="text-white/80 text-sm">
              {formatDate(event.startDate)} - {formatDate(event.endDate)}
            </p>
          </div>
        </div>

        <div className="p-4">
          <p className={cn(
            "text-sm mb-3 line-clamp-2",
            isDark ? "text-gray-400" : "text-gray-600"
          )}>
            {event.description}
          </p>
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-xs px-2 py-1 rounded-full",
              event.status === 'published'
                ? isDark ? "bg-green-900/50 text-green-400" : "bg-green-100 text-green-700"
                : isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-600"
            )}>
              {event.status === 'published' ? '进行中' : '已结束'}
            </span>
            <TianjinButton variant="primary" size="sm">
              查看详情
            </TianjinButton>
          </div>
        </div>
      </motion.div>
    )
  }

  // 渲染社群结果卡片
  const CommunityCard = ({ community }: { community: any }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group cursor-pointer rounded-xl p-4 transition-all duration-300",
        isDark
          ? "bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600"
          : "bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md"
      )}
      onClick={() => navigate(`/community/${community.id}`)}
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          {community.avatar ? (
            <TianjinImage
              src={community.avatar}
              alt={community.name}
              className="w-full h-full object-cover"
              disableFallback={true}
            />
          ) : (
            <MessageCircle className={cn(
              "w-8 h-8",
              isDark ? "text-gray-500" : "text-gray-400"
            )} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-semibold text-base mb-1 truncate",
            isDark ? "text-gray-100" : "text-gray-900"
          )}>
            {community.name}
          </h3>

          <p className={cn(
            "text-sm mb-2 line-clamp-1",
            isDark ? "text-gray-400" : "text-gray-500"
          )}>
            {community.description || '暂无描述'}
          </p>

          <div className={cn(
            "flex items-center gap-3 text-xs",
            isDark ? "text-gray-500" : "text-gray-400"
          )}>
            <span>{community.member_count || 0} 成员</span>
            <span>{community.post_count || 0} 帖子</span>
          </div>
        </div>

        <TianjinButton variant="secondary" size="sm">
          进入
        </TianjinButton>
      </div>
    </motion.div>
  )

  // 根据当前分类渲染结果
  const renderResults = () => {
    const shouldShow = (category: string) => activeCategory === 'all' || activeCategory === category

    return (
      <div className="space-y-8">
        {/* 津脉广场 - 作品结果 */}
        {shouldShow('square') && searchResults.works.length > 0 && (
          <section>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {searchResults.works.map(work => (
                <WorkCard key={work.id} work={work} />
              ))}
            </div>
          </section>
        )}

        {/* 津脉作品 - 模板结果（包含两种模板） */}
        {shouldShow('works') && (searchResults.templates.length > 0 || searchResults.tianjinTemplates.length > 0) && (
          <section>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {searchResults.templates.map(template => (
                <TemplateCard key={template.id} template={template} />
              ))}
              {searchResults.tianjinTemplates.map(template => (
                <TianjinTemplateCard key={template.id} template={template} />
              ))}
            </div>
          </section>
        )}

        {/* 综合 - 显示作品和模板 */}
        {activeCategory === 'all' && (
          <>
            {searchResults.works.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={cn(
                    "text-lg font-semibold",
                    isDark ? "text-gray-200" : "text-gray-800"
                  )}>
                    津脉广场
                  </h2>
                  <button
                    onClick={() => handleCategoryChange('square')}
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    查看更多
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {searchResults.works.slice(0, 4).map(work => (
                    <WorkCard key={work.id} work={work} />
                  ))}
                </div>
              </section>
            )}

            {(searchResults.templates.length > 0 || searchResults.tianjinTemplates.length > 0) && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={cn(
                    "text-lg font-semibold",
                    isDark ? "text-gray-200" : "text-gray-800"
                  )}>
                    津脉作品
                  </h2>
                  <button
                    onClick={() => handleCategoryChange('works')}
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    查看更多
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {searchResults.templates.slice(0, 2).map(template => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                  {searchResults.tianjinTemplates.slice(0, 2).map(template => (
                    <TianjinTemplateCard key={template.id} template={template} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* 用户结果 */}
        {shouldShow('users') && searchResults.users.length > 0 && (
          <section>
            {activeCategory === 'all' && (
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn(
                  "text-lg font-semibold",
                  isDark ? "text-gray-200" : "text-gray-800"
                )}>
                  用户
                </h2>
                <button 
                  onClick={() => handleCategoryChange('users')}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  查看更多
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {searchResults.users.slice(0, activeCategory === 'all' ? 5 : undefined).map(user => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          </section>
        )}

        {/* 活动结果 */}
        {shouldShow('events') && searchResults.events.length > 0 && (
          <section>
            {activeCategory === 'all' && (
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn(
                  "text-lg font-semibold",
                  isDark ? "text-gray-200" : "text-gray-800"
                )}>
                  活动
                </h2>
                <button 
                  onClick={() => handleCategoryChange('events')}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  查看更多
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.events.slice(0, activeCategory === 'all' ? 3 : undefined).map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* 社群结果 */}
        {shouldShow('community') && searchResults.communities.length > 0 && (
          <section>
            {activeCategory === 'all' && (
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn(
                  "text-lg font-semibold",
                  isDark ? "text-gray-200" : "text-gray-800"
                )}>
                  社群
                </h2>
                <button 
                  onClick={() => handleCategoryChange('community')}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  查看更多
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {searchResults.communities.slice(0, activeCategory === 'all' ? 4 : undefined).map(community => (
                <CommunityCard key={community.id} community={community} />
              ))}
            </div>
          </section>
        )}

        {/* 品牌结果 */}
        {shouldShow('brands') && searchResults.brands.length > 0 && (
          <section>
            {activeCategory === 'all' && (
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn(
                  "text-lg font-semibold",
                  isDark ? "text-gray-200" : "text-gray-800"
                )}>
                  品牌方
                </h2>
                <button
                  onClick={() => handleCategoryChange('brands')}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  查看更多
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {searchResults.brands.slice(0, activeCategory === 'all' ? 4 : undefined).map(brand => (
                <BrandCard key={brand.id} brand={brand} />
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  // 渲染空结果状态
  const renderNoResults = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-20"
    >
      <div className={cn(
        "inline-flex items-center justify-center w-24 h-24 rounded-full mb-6",
        isDark ? "bg-gray-800" : "bg-gray-100"
      )}>
        <Search className={cn(
          "w-12 h-12",
          isDark ? "text-gray-600" : "text-gray-400"
        )} />
      </div>
      
      <h2 className={cn(
        "text-2xl font-bold mb-2",
        isDark ? "text-white" : "text-gray-900"
      )}>
        未找到相关结果
      </h2>
      
      <p className={cn(
        "mb-8",
        isDark ? "text-gray-400" : "text-gray-600"
      )}>
        尝试调整搜索关键词或查看其他分类
      </p>
      
      <div className="flex justify-center gap-3">
        <TianjinButton
          variant="primary"
          onClick={() => navigate('/square')}
        >
          浏览广场
        </TianjinButton>
        <TianjinButton
          variant="secondary"
          onClick={() => navigate('/')}
        >
          返回首页
        </TianjinButton>
      </div>
    </motion.div>
  )

  // 渲染加载状态
  const renderLoading = () => (
    <div className="flex justify-center items-center py-20">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className={cn(
          "w-12 h-12 animate-spin",
          isDark ? "text-blue-500" : "text-primary"
        )} />
        <p className={cn(
          "text-lg font-medium",
          isDark ? "text-gray-400" : "text-gray-600"
        )}>
          正在搜索...
        </p>
      </div>
    </div>
  )

  return (
    <div className={cn(
      "min-h-screen",
      isDark 
        ? "bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800" 
        : "bg-gradient-to-b from-gray-50 via-white to-gray-50"
    )}>
      {/* 页面头部 */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b">
        <div className={cn(
          "border-b",
          isDark 
            ? "bg-gray-900/80 border-gray-800" 
            : "bg-white/80 border-gray-200"
        )}>
          <div className="max-w-7xl mx-auto px-4 py-4">
            {/* 搜索框 */}
            <div className="flex items-center gap-4 mb-4">
              <div className={cn(
                "flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200",
                isDark 
                  ? "bg-gray-800/50 border-gray-700 focus-within:border-gray-600" 
                  : "bg-gray-50 border-gray-200 focus-within:border-gray-300 focus-within:bg-white"
              )}>
                <Search className={cn(
                  "w-5 h-5",
                  isDark ? "text-gray-500" : "text-gray-400"
                )} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      navigate(`/search?query=${encodeURIComponent(query)}`)
                    }
                  }}
                  placeholder="搜索感兴趣的内容..."
                  className={cn(
                    "flex-1 bg-transparent outline-none text-base",
                    isDark ? "text-white placeholder:text-gray-500" : "text-gray-900 placeholder:text-gray-400"
                  )}
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className={cn(
                      "p-1 rounded-full transition-colors",
                      isDark ? "hover:bg-gray-700 text-gray-500" : "hover:bg-gray-200 text-gray-400"
                    )}
                  >
                    <i className="fas fa-times" />
                  </button>
                )}
              </div>
              
              <TianjinButton
                variant="primary"
                onClick={() => navigate(`/search?query=${encodeURIComponent(query)}`)}
              >
                搜索
              </TianjinButton>
            </div>

            {/* 分类标签导航 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                {searchCategories.map((category) => {
                  const count = getCategoryCount(category.id)
                  const isActive = activeCategory === category.id

                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 border",
                        isActive
                          ? isDark
                            ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/30"
                            : "bg-[#C02C38] text-white border-[#C02C38] shadow-lg shadow-red-900/20"
                          : isDark
                            ? "text-gray-300 hover:text-white hover:bg-gray-800 border-gray-700 bg-gray-800/50"
                            : "text-gray-700 hover:text-gray-900 hover:bg-white border-gray-200 bg-white/80"
                      )}
                    >
                      <span className={cn(
                        "transition-colors",
                        isActive ? "text-white" : isDark ? "text-gray-400" : "text-gray-500"
                      )}>
                        {category.icon}
                      </span>
                      <span>{category.label}</span>
                      {count > 0 && (
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-bold min-w-[20px] text-center",
                          isActive
                            ? "bg-white/30 text-white"
                            : isDark
                              ? "bg-gray-700 text-gray-300 border border-gray-600"
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                        )}>
                          {count > 99 ? '99+' : count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* 排序下拉菜单 */}
              <div className="relative flex-shrink-0 ml-4">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                    isDark
                      ? "text-gray-300 hover:bg-gray-800"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <span>{sortOptions.find(s => s.id === activeSort)?.label}</span>
                  <i className={cn(
                    "fas fa-chevron-down text-xs transition-transform",
                    showSortDropdown && "rotate-180"
                  )} />
                </button>
                
                <AnimatePresence>
                  {showSortDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={cn(
                        "absolute right-0 top-full mt-2 w-32 rounded-xl shadow-lg border z-50",
                        isDark
                          ? "bg-gray-800 border-gray-700"
                          : "bg-white border-gray-200"
                      )}
                    >
                      {sortOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setActiveSort(option.id)
                            setShowSortDropdown(false)
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl",
                            activeSort === option.id
                              ? isDark
                                ? "bg-gray-700 text-white"
                                : "bg-gray-100 text-gray-900"
                              : isDark
                                ? "text-gray-300 hover:bg-gray-700"
                                : "text-gray-600 hover:bg-gray-50"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 页面内容 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 搜索结果统计 */}
        {!isLoading && !isNoResults && (
          <div className={cn(
            "mb-6 text-sm",
            isDark ? "text-gray-400" : "text-gray-600"
          )}>
            找到 <span className="font-semibold text-primary">{getCategoryCount(activeCategory)}</span> 个与 
            <span className="font-semibold mx-1">"{query}"</span> 
            相关的结果
          </div>
        )}

        {/* 加载状态 */}
        {isLoading && renderLoading()}
        
        {/* 空结果状态 */}
        {!isLoading && isNoResults && renderNoResults()}
        
        {/* 搜索结果 */}
        {!isLoading && !isNoResults && renderResults()}
      </div>
    </div>
  )
}
