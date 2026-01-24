import { useTheme } from '@/hooks/useTheme'
import { useState, useMemo, useRef, useCallback, useEffect, lazy, Suspense } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import postsApi, { Post } from '@/services/postService'
import { SearchResultType } from '@/components/SearchBar'
import { motion } from 'framer-motion'

import GradientHero from '@/components/GradientHero'
import CommunitySpotlight from '@/components/CommunitySpotlight'
import PostDetailModal from '@/components/PostDetailModal'
import { mockWorks } from '@/mock/works'
import apiClient from '@/lib/apiClient'

// 懒加载组件
const PostGrid = lazy(() => import('@/components/PostGrid'))
const SearchBar = lazy(() => import('@/components/SearchBar'))

export default function Square() {
  const { isDark } = useTheme()
  const params = useParams()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  
  // 中文注释：热门话题标签（支持按点击热度排序）
  const DEFAULT_TAGS = ['国潮设计', '非遗传承', '品牌联名', '校园活动', '文旅推广', '纹样设计', '插画设计', '工艺创新', '老字号品牌', 'IP设计', '包装设计', '共创设计', '数字艺术', '3D设计', 'AI设计']
  const TAG_KEY = 'jmzf_tag_clicks'
  const TAGS_CACHE_KEY = 'jmzf_tags_cache'
  const TAGS_CACHE_TIMEOUT = 5 * 60 * 1000 // 5分钟缓存
  
  const [tagClicks, setTagClicks] = useState<Record<string, number>>(() => {
    try { const raw = localStorage.getItem(TAG_KEY); return raw ? JSON.parse(raw) : {} } catch { return {} }
  })
  const [tags, setTags] = useState<string[]>(DEFAULT_TAGS)
  const [tagMeta, setTagMeta] = useState<Record<string, { weight?: number; group?: string; desc?: string }>>({})
  const [tagsLoading, setTagsLoading] = useState(false)
  const [tagsError, setTagsError] = useState<string | null>(null)
  
  // 优化：缓存排序函数，使用useCallback稳定它
  const sortTagsByClicks = useCallback((list: string[], clicks: Record<string, number>) => {
    const orderMap = new Map<string, number>(list.map((t, i) => [t, i]))
    return list.slice().sort((a, b) => {
      const ca = clicks[a] || 0
      const cb = clicks[b] || 0
      if (ca > 0 && cb > 0) return cb - ca
      if (ca > 0) return -1
      if (cb > 0) return 1
      return orderMap.get(a)! - orderMap.get(b)!
    })
  }, [])
  
  // 优化：懒加载标签数据，使用useCallback稳定它
  const loadTags = useCallback(async () => {
    // 检查缓存
    try {
      const cached = localStorage.getItem(TAGS_CACHE_KEY)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < TAGS_CACHE_TIMEOUT) {
          setTags(sortTagsByClicks(data.tags, tagClicks))
          setTagMeta(data.meta)
          return
        }
      }
    } catch {}
    
    setTagsLoading(true)
    setTagsError(null)
    
    try {
      const resp = await apiClient.get<{ ok: boolean; data: any[] }>('/api/community/tags')
      if (resp.ok && Array.isArray(resp.data?.data)) {
        const arr = resp.data!.data
        const items = arr.map((x: any) => String(x.name || ''))
        const meta = arr.reduce((acc: any, x: any) => {
          acc[x.name] = { weight: x.weight, group: x.group, desc: x.desc }
          return acc
        }, {})
        
        // 缓存结果
        localStorage.setItem(TAGS_CACHE_KEY, JSON.stringify({
          data: { tags: items, meta },
          timestamp: Date.now()
        }))
        
        setTags(sortTagsByClicks(items, tagClicks))
        setTagMeta(meta)
      } else {
        setTags(DEFAULT_TAGS)
        setTagsError(resp.error || '加载失败')
      }
    } catch (e) {
      setTags(DEFAULT_TAGS)
      setTagsError((e as Error)?.message || '网络错误')
    } finally {
      setTagsLoading(false)
    }
  }, [tagClicks, sortTagsByClicks])
  
  // 中文注释：精选社群数据（从本地API加载；失败回退本地静态）
  type FeaturedCommunity = { name: string; members: number; path: string; official?: boolean; topic?: string; tags?: string[] }
  const DEFAULT_FEATURED: FeaturedCommunity[] = [
    { name: '国潮共创组', members: 128, path: '/community?group=guochao' },
    { name: '非遗研究社', members: 96, path: '/community?group=heritage' },
    { name: '品牌联名工坊', members: 73, path: '/community?group=brand' },
  ]
  const FEATURED_CACHE_KEY = 'jmzf_featured_cache'
  const FEATURED_CACHE_TIMEOUT = 10 * 60 * 1000 // 10分钟缓存
  
  const [featuredCommunities, setFeaturedCommunities] = useState<FeaturedCommunity[]>(DEFAULT_FEATURED)
  const [featLoading, setFeatLoading] = useState(false)
  const [featError, setFeatError] = useState<string | null>(null)
  
  // 优化：加载精选社群数据，使用useCallback稳定它
  const loadFeaturedCommunities = useCallback(async () => {
    // 检查缓存
    try {
      const cached = localStorage.getItem(FEATURED_CACHE_KEY)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < FEATURED_CACHE_TIMEOUT) {
          setFeaturedCommunities(data)
          return
        }
      }
    } catch {}
    
    setFeatLoading(true)
    setFeatError(null)
    
    try {
      const resp = await apiClient.get<{ ok: boolean; data: any[] }>('/api/community/featured')
      if (resp.ok && Array.isArray(resp.data?.data)) {
        const arr = resp.data!.data
        const items = arr.map((x: any) => ({
          name: String(x.name || ''),
          members: Number(x.members) || 0,
          path: String(x.path || '/community'),
          official: Boolean(x.official),
          topic: x.topic ? String(x.topic) : undefined,
          tags: Array.isArray(x.tags) ? x.tags.map((t: any) => String(t)) : undefined,
        }))
        
        // 缓存结果
        localStorage.setItem(FEATURED_CACHE_KEY, JSON.stringify({
          data: items,
          timestamp: Date.now()
        }))
        
        setFeaturedCommunities(items)
      } else {
        setFeaturedCommunities(DEFAULT_FEATURED)
        setFeatError(resp.error || '加载失败')
      }
    } catch (e) {
      setFeaturedCommunities(DEFAULT_FEATURED)
      setFeatError((e as Error)?.message || '网络错误')
    } finally {
      setFeatLoading(false)
    }
  }, [])
  
  // 合并标签和社群加载的useEffect，避免重复
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadTags(), loadFeaturedCommunities()])
    }
    loadData()
  }, [loadTags, loadFeaturedCommunities])
  
  // 优化：使用useCallback稳定incTagClick函数
  const incTagClick = useCallback((tag: string) => {
    const next = { ...tagClicks, [tag]: (tagClicks[tag] || 0) + 1 }
    setTagClicks(next)
    try { localStorage.setItem(TAG_KEY, JSON.stringify(next)) } catch {}
    setTags(sortTagsByClicks(DEFAULT_TAGS, next))
  }, [tagClicks, sortTagsByClicks])
  
  // 中文注释：社区模式与筛选（风格/题材）
  const [communityMode, setCommunityMode] = useState<'all' | 'style' | 'topic'>('all')
  const [selectedStyle, setSelectedStyle] = useState<string>('全部')
  const [selectedTopic, setSelectedTopic] = useState<string>('全部')
  const [title, setTitle] = useState('') // 新帖子标题（中文注释：用于创建新帖子）
  const [thumb, setThumb] = useState('') // 新帖子缩略图URL（中文注释：用于展示封面）
  const [sortBy, setSortBy] = useState<'hot' | 'new'>('hot') // 排序方式（中文注释：hot按点赞、new按日期）
  const [search, setSearch] = useState('') // 搜索关键词（中文注释：支持标题/评论/风格/题材）
  const [showSuggest, setShowSuggest] = useState(false) // 中文注释：是否显示搜索联想下拉
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1) // 中文注释：分页页码
  const pageSize = 18 // 中文注释：每页展示数量（适配3列×6行）
  const [active, setActive] = useState<Post | null>(null) // 中文注释：详情弹窗当前帖子
  const [activeLoading, setActiveLoading] = useState(false) // 中文注释：详情加载状态
  const [activeError, setActiveError] = useState<string | null>(null) // 中文注释：详情加载错误
  const [favorites, setFavorites] = useState<string[]>(() => {
    // 中文注释：本地收藏列表（按帖子id存储）
    try { const raw = localStorage.getItem('jmzf_favs'); return raw ? JSON.parse(raw) : [] } catch { return [] }
  })
  const [favOnly, setFavOnly] = useState(false) // 中文注释：是否仅展示收藏作品
  const [importedExplore, setImportedExplore] = useState(true) // 中文注释：是否导入探索页作品（默认启用）
  const [isLoading, setIsLoading] = useState(true) // 中文注释：初始加载状态
  const [isLoadingMore, setIsLoadingMore] = useState(false) // 中文注释：加载更多状态
  const [hasMore, setHasMore] = useState(true) // 中文注释：是否还有更多数据
  const sentinelRef = useRef<HTMLDivElement | null>(null) // 中文注释：无限滚动观察器锚点
  const thumbFileRef = useRef<HTMLInputElement | null>(null) // 中文注释：封面本地上传文件引用
  const loadingRef = useRef(false) // 中文注释：防止重复加载的标志
  
  // 中文注释：本地缓存机制，减少重复计算
  const cachedDataRef = useRef<Map<string, Post[]>>(new Map())
  
  // 中文注释：广场初始示例作品（可作为冷启动内容）
  const SEED: Post[] = [
    { id: 'seed-1', title: '国潮插画设计', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20cultural%20illustration%20design&image_size=1024x1024', likes: 324, comments: [], date: '2025-11-01', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
    { id: 'seed-2', title: '麻花赛博朋克', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Tianjin%20mahua%20cyberpunk&image_size=1024x1024', likes: 512, comments: [], date: '2025-11-02', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
    { id: 'seed-3', title: '杨柳青年画海报', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Yangliuqing%20New%20Year%20poster%2C%20vibrant%20colors&image_size=1024x1024', likes: 338, comments: [], date: '2025-11-03', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  ]
  
  // 从探索页导入的策展作品
  const EXPLORE_SEEDS: Post[] = mockWorks.map((w) => ({
    id: `ex-${w.id}`,
    title: w.title,
    thumbnail: w.thumbnail,
    likes: w.likes,
    comments: [],
    date: new Date().toISOString().slice(0, 10),
    category: 'design',
    tags: [],
    description: '',
    views: 0,
    shares: 0,
    isFeatured: false,
    isDraft: false,
    completionStatus: 'completed',
    creativeDirection: '',
    culturalElements: [],
    colorScheme: [],
    toolsUsed: []
  }))
  
  useEffect(() => {
    // 优化初始数据加载：只加载必要的数据
    const loadInitialData = async () => {
      const current = await postsApi.getPosts()
      // 只加载前3个种子数据，其余数据按需加载
      const initialSeed = SEED.slice(0, 3)
      const merged = [...current, ...initialSeed]
      
      setPosts(merged)
      setIsLoading(false)
    }
    loadInitialData()
  }, [])
  
  // 动态加载资讯详情数据
  const loadPostDetail = async (id: string) => {
    setActiveLoading(true)
    setActiveError(null)
    
    try {
      // 模拟从服务器获取最新数据的延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 从API获取最新的帖子数据
      const allPosts = await postsApi.getPosts()
      let found = allPosts.find(p => p.id === id)
      
      if (!found) {
        // 如果在API数据中找不到，尝试从本地状态中查找（保留评论数据）
        found = posts.find(p => p.id === id)
        
        // 如果本地状态中也找不到，再从种子数据中查找
        if (!found) {
          found = SEED.find(s => s.id === id) || EXPLORE_SEEDS.find(s => s.id === id)
        }
      }
      
      if (found) {
        setActive(found)
      } else {
        setActiveError('未找到该资讯内容')
      }
    } catch (error) {
      setActiveError('加载资讯详情失败，请稍后重试')
      console.error('Failed to load post detail:', error)
    } finally {
      setActiveLoading(false)
    }
  }

  useEffect(() => {
    // 中文注释：支持通过路由参数直接打开详情
    const id = params.id
    if (id) {
      loadPostDetail(id)
    }
  }, [params.id])

  // 当posts状态更新时，如果当前有激活的帖子，确保它是最新的
  useEffect(() => {
    const updateActivePost = async () => {
      if (active) {
        const allPosts = await postsApi.getPosts()
        const updatedPost = allPosts.find(p => p.id === active.id)
        if (updatedPost) {
          setActive(updatedPost)
        }
      }
    }
    updateActivePost()
  }, [posts, active])
  
  // 中文注释：风格与题材词库（简单关键词匹配，用于社区分类）
  const STYLE_LIST = ['全部', '国潮', '极简', '复古', '赛博朋克', '手绘插画', '黑白线稿', '蓝白瓷']
  const TOPIC_LIST = ['全部', '老字号', '非遗', '京剧', '景德镇', '校园社团']
  const pickStyle = (title: string) => {
    const t = title.toLowerCase()
    if (/[国潮]/.test(title)) return '国潮'
    if (t.includes('cyberpunk') || /赛博/.test(title)) return '赛博朋克'
    if (/复古|vintage/i.test(title)) return '复古'
    if (/手绘|插画/.test(title)) return '手绘插画'
    if (/线稿|黑白/.test(title)) return '黑白线稿'
    if (/景德镇|青花瓷|蓝白/.test(title)) return '蓝白瓷'
    if (/极简|minimal/i.test(title)) return '极简'
    return '国潮'
  }
  const pickTopic = (title: string) => {
    if (/同仁堂|老字号/.test(title)) return '老字号'
    if (/非遗|技艺/.test(title)) return '非遗'
    if (/京剧|戏/.test(title)) return '京剧'
    if (/景德镇|瓷/.test(title)) return '景德镇'
    if (/高校|社团|校园/.test(title)) return '校园社团'
    return '老字号'
  }

  // 优化数据合并策略：只在必要时合并数据，并确保数据不重复
  const baseData = useMemo(() => {
    // 使用Map来确保唯一ID，避免重复
    const uniquePosts = new Map<string, Post>()
    
    // 添加posts数据
    posts.forEach(p => uniquePosts.set(p.id, p))
    // 添加SEED数据
    SEED.forEach(s => uniquePosts.set(s.id, s))
    
    return Array.from(uniquePosts.values())
  }, [posts])
  
  // 按需合并探索页数据，并确保数据不重复
  const merged = useMemo(() => {
    // 使用Map来确保唯一ID，避免重复
    const uniquePosts = new Map<string, Post>()
    
    // 先添加baseData
    baseData.forEach(p => uniquePosts.set(p.id, p))
    
    // 只在需要时添加探索页数据
    if (importedExplore) {
      EXPLORE_SEEDS.forEach(s => uniquePosts.set(s.id, s))
    }
    
    // 将Map转换为数组
    const list = Array.from(uniquePosts.values())
    
    // 优化过滤逻辑：减少计算量
    const query = search.trim().toLowerCase()
    let filtered = list
    
    if (query) {
      const advStyle = /^\s*(style|风格)\s*:\s*(.+?)\s*$/.exec(query)
      const advTopic = /^\s*(topic|题材)\s*:\s*(.+?)\s*$/.exec(query)
      
      filtered = list.filter(p => {
        if (advStyle) return pickStyle(p.title).toLowerCase() === advStyle[2].toLowerCase()
        if (advTopic) return pickTopic(p.title).toLowerCase() === advTopic[2].toLowerCase()
        
        // 只检查标题，减少计算量
        const inTitle = p.title.toLowerCase().includes(query)
        return inTitle
      })
    }
    
    // 优化社区过滤
    const communityFiltered = filtered.filter(p => {
      if (communityMode === 'style' && selectedStyle !== '全部') return pickStyle(p.title) === selectedStyle
      if (communityMode === 'topic' && selectedTopic !== '全部') return pickTopic(p.title) === selectedTopic
      return true
    })
    
    // 优化收藏过滤
    const favFiltered = favOnly ? communityFiltered.filter(p => favorites.includes(p.id)) : communityFiltered
    
    // 优化排序
    const sorted = [...favFiltered].sort((a, b) => {
      if (sortBy === 'hot') return (b.likes || 0) - (a.likes || 0)
      return (new Date(b.date).getTime()) - (new Date(a.date).getTime())
    })
    
    return sorted
  }, [baseData, sortBy, search, communityMode, selectedStyle, selectedTopic, favOnly, favorites, importedExplore])
  
  const viewList = useMemo(() => merged.slice(0, page * pageSize), [merged, page])
  
  // 优化：使用useCallback稳定like函数
  const like = useCallback(async (id: string) => {
    await postsApi.likePost(id)
    const current = await postsApi.getPosts()
    setPosts(current)
    // 更新active状态中的点赞数
    if (active && active.id === id) {
      setActive(prev => prev ? { ...prev, likes: prev.likes + 1 } : null)
    }
  }, [active])
  
  // 优化：使用useCallback稳定addComment函数
  const addComment = useCallback(async (id: string, content: string) => {
    if (!content) return
    console.log('Adding comment to post:', id, 'content:', content)
    
    // 1. 首先更新本地状态，确保评论能够立即显示
    if (active && active.id === id) {
      const newComment = {
        id: `c-${Date.now()}`,
        content,
        date: new Date().toISOString(),
        likes: 0,
        reactions: {
          like: 0,
          love: 0,
          laugh: 0,
          surprise: 0,
          sad: 0,
          angry: 0
        },
        replies: [],
        userReactions: []
      }
      
      // 创建更新后的帖子对象
      const updatedActivePost = {
        ...active,
        comments: [...active.comments, newComment]
      }
      
      // 立即更新active状态，实现评论的实时显示
      setActive(updatedActivePost)
      console.log('Updated active post immediately:', updatedActivePost)
    }
    
    // 2. 然后调用API添加评论，确保数据持久化
    const updatedPost = await postsApi.addComment(id, content)
    console.log('Updated post from API:', updatedPost)
    
    // 3. 最后更新本地状态，确保数据同步
    if (updatedPost) {
      const current = await postsApi.getPosts()
      console.log('Current posts after API call:', current)
      setPosts(current)
    }
  }, [active])
  
  // 优化：使用useCallback稳定share函数
  const sharePost = useCallback((id: string) => {
    const url = location.origin + `/square/${id}`
    navigator.clipboard?.writeText(url)
    alert('作品链接已复制')
  }, [])
  
  // 优化：使用useCallback稳定toggleFavorite函数
  const toggleFavorite = useCallback((id: string) => {
    // 中文注释：收藏/取消收藏
    setFavorites(prev => {
      const has = prev.includes(id)
      const next = has ? prev.filter(x => x !== id) : [...prev, id]
      try { localStorage.setItem('jmzf_favs', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])
  
  // 优化：使用useCallback稳定importExploreWorks函数
  const importExploreWorks = useCallback(() => {
    // 中文注释：导入探索页策展作品到广场视图
    setImportedExplore(true)
    alert(`已导入 ${EXPLORE_SEEDS.length} 条策展作品`)
  }, [])
  
  useEffect(() => {
    // 中文注释：优化无限滚动—防抖加载和性能优化
    const el = sentinelRef.current
    if (!el) return
    
    const ob = new IntersectionObserver((entries) => {
      const e = entries[0]
      // 只有当元素可见、不在加载中、还有更多数据时才加载
      if (e && e.isIntersecting && !loadingRef.current && hasMore) {
        loadingRef.current = true
        setIsLoadingMore(true)
        
        // 检查是否还有更多数据
        if (viewList.length >= merged.length) {
          setHasMore(false)
          loadingRef.current = false
          setIsLoadingMore(false)
          return
        }
        
        setPage(prev => prev + 1)
        // 设置延迟重置 loading 状态
        setTimeout(() => {
          loadingRef.current = false
          setIsLoadingMore(false)
        }, 500)
      }
    }, { 
      root: null, 
      rootMargin: '300px', // 增加预加载距离
      threshold: 0.1 
    })
    
    ob.observe(el)
    return () => ob.disconnect()
  }, [sentinelRef, merged, viewList.length, page, hasMore])
  
  // 中文注释：统计热门风格/题材（取前6个）
  // 优化：只统计当前显示的内容，减少计算量
  const topStyles = useMemo(() => {
    const map: Record<string, number> = {}
    viewList.forEach(p => { const s = pickStyle(p.title); map[s] = (map[s] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [viewList])
  
  const topTopics = useMemo(() => {
    const map: Record<string, number> = {}
    viewList.forEach(p => { const s = pickTopic(p.title); map[s] = (map[s] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [viewList])
  
  const suggestions = useMemo(() => {
    // 中文注释：根据输入生成联想（风格/题材优先）
    const q = search.trim().toLowerCase()
    if (!q) return []
    const styleSug = topStyles.map(([name]) => ({ 
      id: `style-${name}`, 
      text: `风格:${String(name)}`, 
      type: SearchResultType.CATEGORY 
    })).filter(s => s.text.toLowerCase().includes(q))
    const topicSug = topTopics.map(([name]) => ({ 
      id: `topic-${name}`, 
      text: `题材:${String(name)}`, 
      type: SearchResultType.TAG 
    })).filter(s => s.text.toLowerCase().includes(q))
    return [...styleSug, ...topicSug].slice(0, 8)
  }, [search, topStyles, topTopics])

  const gotoCommunity = (path?: string) => {
    // 中文注释：健壮的社群跳转——兼容绝对路径与查询参数，避免出现 /community/community 双重前缀
    const p = (path || '').trim()
    let target = '/community'
    if (p) {
      if (p.startsWith('/')) {
        // 中文注释：传入绝对路径（含 /community 前缀），直接跳转
        target = p
      } else if (p.startsWith('?')) {
        // 中文注释：仅传入查询参数，拼接到 /community
        target = `/community${p}`
      } else {
        // 中文注释：传入相对子路径，规范化为 /community/子路径
        target = `/community/${p}`
      }
    }
    navigate(target)
  }
  
  const createPost = async () => {
    // 中文注释：创建新帖子，基本校验
    const t = title.trim()
    const u = thumb.trim()
    if (!t) { alert('请输入标题'); return }
    const cover = u || `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(t)}&image_size=1024x1024`
    postsApi.addPost({
      title: t,
      thumbnail: cover,
      category: 'design',
      tags: [],
      description: '',
      creativeDirection: '',
      culturalElements: [],
      colorScheme: [],
      toolsUsed: []
    })
    setTitle('')
    setThumb('')
    const current = await postsApi.getPosts()
    setPosts(current)
  }

  return (
    <main className="max-w-7xl mx-auto px-2 sm:px-4 py-6 w-full">
      {/* 中文注释：统一使用通用渐变英雄组件 */}
      <GradientHero
        title="共创广场"
        subtitle={`热榜每周更新 · 当前作品 ${merged.length} 条 · 收藏 ${favorites.length} 条`}
        badgeText="Beta"
        theme="blue"
        size="md"
        showDecor={false}
        backgroundImage="https://picsum.photos/id/1035/1600/800"
        stats={[
          { label: '模式', value: communityMode === 'all' ? '全部' : communityMode === 'style' ? '风格' : '题材' },
          { label: '筛选', value: favOnly ? '收藏' : '全部' },
          { label: '排序', value: sortBy === 'hot' ? '热度' : '最新' },
          { label: '联动', value: importedExplore ? '已导入' : '未导入' },
        ]}
      />
      
      <CommunitySpotlight 
        tags={tags} 
        featuredCommunities={featuredCommunities}
        onTagClick={incTagClick}
        loading={tagsLoading || featLoading}
      />
      
      {/* Filter & Control Bar */}
      <div className={`mb-8 ${isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-white/80 border-gray-200'} backdrop-blur-xl border rounded-3xl shadow-lg p-1 transition-all duration-300 hover:shadow-xl`}>
        <div className="flex flex-col lg:flex-row gap-4 p-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-2xl">
           {/* Left: Community Mode Tabs */}
           <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2">
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} whitespace-nowrap flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-100/70 dark:bg-gray-800/70 shadow-sm`}>
                  <i className="fas fa-layer-group text-blue-500"></i>
                  <span>分区</span>
                </span>
                <div className={`flex p-1 rounded-xl ${isDark ? 'bg-gray-900/80' : 'bg-gray-100/80'} backdrop-blur-sm shadow-sm`}>
                  {[
                    { id: 'all', label: '全部' },
                    { id: 'style', label: '风格' },
                    { id: 'topic', label: '题材' }
                  ].map(tab => (
                    <motion.button
                      key={tab.id}
                      onClick={() => setCommunityMode(tab.id as any)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all min-w-[80px] text-center ${communityMode === tab.id ? (isDark ? 'bg-gray-700 text-white shadow-md' : 'bg-white text-gray-900 shadow-md') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-900')}`}
                    >
                      {tab.label}
                    </motion.button>
                  ))}
                </div>
                
                <div className="w-px h-6 bg-gray-300/50 dark:bg-gray-700/50 mx-2"></div>
                
                {/* Quick Toggles */}
                <motion.button 
                  onClick={() => setFavOnly(v => !v)} 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 min-h-[40px] ${favOnly ? 'bg-red-50 text-red-600 border-red-200 shadow-sm dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' : (isDark ? 'border-gray-700 text-gray-400 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}`}
                >
                  <i className={`fas fa-heart ${favOnly ? 'text-red-500' : ''}`}></i>
                  收藏
                </motion.button>
                <motion.button 
                  onClick={importExploreWorks} 
                  disabled={importedExplore}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 min-h-[40px] ${importedExplore ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed dark:bg-gray-800 dark:text-gray-600' : 'bg-green-50 text-green-600 border-green-200 shadow-sm hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'}`}
                >
                  <i className="fas fa-cloud-download-alt"></i>
                  {importedExplore ? '已导入' : '导入策展'}
                </motion.button>
              </div>

              {/* Filter Tags Area */}
              <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm">
                 {communityMode === 'all' && (
                   <div className="text-sm text-gray-500 dark:text-gray-400 italic px-3 py-2 rounded-lg bg-white/70 dark:bg-gray-700/70 shadow-sm">选择上方分区查看特定分类</div>
                 )}
                 {communityMode === 'style' && (
                    <>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mr-2 whitespace-nowrap px-3 py-1.5 rounded-full bg-white/80 dark:bg-gray-700/80 shadow-sm">风格:</span>
                      {STYLE_LIST.map(s => (
                        <motion.button 
                          key={s} 
                          onClick={() => setSelectedStyle(s)} 
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all border min-h-[36px] ${selectedStyle === s ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-md dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' : (isDark ? 'border-gray-700 text-gray-400 hover:border-gray-500' : 'border-gray-200 text-gray-600 hover:border-gray-300')}`}
                        >
                          {s}
                        </motion.button>
                      ))}
                    </>
                 )}
                 {communityMode === 'topic' && (
                    <>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mr-2 whitespace-nowrap px-3 py-1.5 rounded-full bg-white/80 dark:bg-gray-700/80 shadow-sm">题材:</span>
                      {TOPIC_LIST.map(s => (
                        <motion.button 
                          key={s} 
                          onClick={() => setSelectedTopic(s)} 
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all border min-h-[36px] ${selectedTopic === s ? 'bg-purple-50 text-purple-600 border-purple-200 shadow-md dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' : (isDark ? 'border-gray-700 text-gray-400 hover:border-gray-500' : 'border-gray-200 text-gray-600 hover:border-gray-300')}`}
                        >
                          {s}
                        </motion.button>
                      ))}
                    </>
                 )}
              </div>
           </div>

           {/* Right: Top Stats / Link */}
           <div className={`lg:w-64 flex flex-col justify-between gap-3 pl-0 lg:pl-6 lg:border-l ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
              <div className="flex flex-wrap gap-2">
                 {topStyles.slice(0, 3).map(([name, count]) => (
                   <motion.span 
                     key={name} 
                     whileHover={{ scale: 1.05, y: -2 }}
                     className={`text-[10px] px-3 py-1.5 rounded-full border ${isDark ? 'bg-gray-800/80 border-gray-700 text-gray-400' : 'bg-white/80 border-gray-200 text-gray-600'} shadow-sm font-medium`}
                   >
                     <span>{name}</span>
                     <span className="text-gray-500 dark:text-gray-500 ml-1">{count}</span>
                   </motion.span>
                 ))}
              </div>
              <motion.button
                onClick={() => navigate('/community')}
                whileHover={{ scale: 1.03, y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="mt-auto text-sm font-medium flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <i className="fas fa-rocket text-sm"></i>
                  <span>进入创作者社区</span>
                </span>
                <i className="fas fa-arrow-right transform group-hover:translate-x-2 transition-transform duration-300"></i>
              </motion.button>
           </div>
        </div>
      </div>
      
      {/* Post Grid Section */}
      <Suspense fallback={<div className="h-96 bg-gray-200/50 dark:bg-gray-800/50 rounded-xl animate-pulse"></div>}>
        <PostGrid
          posts={viewList}
          onPostClick={(post) => loadPostDetail(post.id)}
          onLike={like}
          onComment={(postId, text) => {
            addComment(postId, text)
          }}
          isDark={isDark}
        />
      </Suspense>
      
      {/* Loading More Indicator */}
      {isLoadingMore && (
        <div className="mt-8 flex justify-center items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500 dark:text-gray-400">加载更多...</span>
        </div>
      )}
      
      {/* Sentinel for Infinite Scroll */}
      <div ref={sentinelRef} className="h-16 mt-8"></div>
      
      {/* Post Detail Modal */}
      {active && (
        <PostDetailModal
          post={active}
          isOpen={!!active}
          onClose={() => setActive(null)}
          onLike={like}
          onComment={addComment}
          onShare={sharePost}
          loading={activeLoading}
          error={activeError}
        />
      )}
    </main>
  )
}
