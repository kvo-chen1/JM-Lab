import { useTheme } from '@/hooks/useTheme'
import { useState, useMemo, useRef, useCallback, useEffect, lazy, Suspense } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import postsApi, { Post } from '@/services/postService'
import { SearchResultType } from '@/components/SearchBar'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

import { AuthContext } from '@/contexts/authContext'
import { useContext } from 'react'

import PostDetailModal from '@/components/PostDetailModal'
import { CreatePostModal } from '@/components/Community/Modals/CreatePostModal'


import apiClient from '@/lib/apiClient'

// 懒加载组件
const PostGrid = lazy(() => import('@/components/PostGrid'))
const SearchBar = lazy(() => import('@/components/SearchBar'))

export default function Square() {
  const { isDark } = useTheme()
  const params = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useContext(AuthContext)
  const [posts, setPosts] = useState<Post[]>([])
  
  // 搜索功能状态
  const [showSearchBar, setShowSearchBar] = useState(false)
  
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
    
    // 直接使用默认数据，避免调用不存在的API
    try {
      // 模拟网络延迟
      // await new Promise(resolve => setTimeout(resolve, 300));
      
      const items = DEFAULT_TAGS;
      const meta = {};
      
      // 缓存结果
      localStorage.setItem(TAGS_CACHE_KEY, JSON.stringify({
        data: { tags: items, meta },
        timestamp: Date.now()
      }))
      
      setTags(sortTagsByClicks(items, tagClicks))
      setTagMeta(meta)
    } catch (e) {
      setTags(DEFAULT_TAGS)
      setTagsError('加载失败')
    } finally {
      setTagsLoading(false)
    }
  }, [tagClicks, sortTagsByClicks])
  
  // 中文注释：精选社群数据（从API加载）
  type FeaturedCommunity = { name: string; members: number; path: string; official?: boolean; topic?: string; tags?: string[]; cover?: string; avatar?: string }
  const FEATURED_CACHE_KEY = 'jmzf_featured_cache'
  const FEATURED_CACHE_TIMEOUT = 10 * 60 * 1000 // 10分钟缓存

  const [featuredCommunities, setFeaturedCommunities] = useState<FeaturedCommunity[]>([])
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

    // 从API获取数据
    try {
      const response = await apiClient.get('/communities/featured')
      const items = response.data || []

      // 缓存结果
      localStorage.setItem(FEATURED_CACHE_KEY, JSON.stringify({
        data: items,
        timestamp: Date.now()
      }))

      setFeaturedCommunities(items)
    } catch (e) {
      setFeaturedCommunities([])
      setFeatError('加载失败')
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
    // 实现标签筛选逻辑
    setSearch(tag)
    console.log('标签筛选:', tag);
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false) // 中文注释：发布弹窗状态
  const sentinelRef = useRef<HTMLDivElement | null>(null) // 中文注释：无限滚动观察器锚点
  const thumbFileRef = useRef<HTMLInputElement | null>(null) // 中文注释：封面本地上传文件引用
  const loadingRef = useRef(false) // 中文注释：防止重复加载的标志
  
  // 中文注释：本地缓存机制，减少重复计算
  const cachedDataRef = useRef<Map<string, Post[]>>(new Map())
  
  

  
  // 优化初始数据加载：只加载必要的数据
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        // 清除缓存，确保获取最新数据
        await postsApi.clearAllCaches()
        const current = await postsApi.getPosts()
        
        if (Array.isArray(current)) {
          setPosts(current)
        } else {
          setPosts([])
        }
      } catch (error) {
        console.error('加载初始数据失败:', error)
        setPosts([])
      } finally {
        setIsLoading(false)
      }
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

  useEffect(() => {
    // 支持通过查询参数 ?post=xxx 打开详情（从排行榜跳转）
    const postId = searchParams.get('post')
    if (postId) {
      loadPostDetail(postId)
      // 清除查询参数，避免刷新时重复打开
      navigate('/square', { replace: true })
    }
  }, [searchParams])

  useEffect(() => {
    // 监听作品发布事件，当用户发布新作品到津脉广场时自动刷新
    const handleSquarePostsUpdated = async () => {
      console.log('收到广场作品更新事件，重新加载数据...');
      try {
        // 清除缓存，确保获取最新数据
        await postsApi.clearAllCaches();
        const current = await postsApi.getPosts();
        setPosts(current);
        // 重置分页，显示最新作品
        setPage(1);
        setHasMore(true);
      } catch (error) {
        console.error('刷新广场作品失败:', error);
      }
    };

    // 添加事件监听器
    window.addEventListener('square-posts-updated', handleSquarePostsUpdated);

    // 清理事件监听器
    return () => {
      window.removeEventListener('square-posts-updated', handleSquarePostsUpdated);
    };
  }, []);

  // 当posts状态更新时，如果当前有激活的帖子，确保它是最新的
  useEffect(() => {
    const updateActivePost = async () => {
      if (active) {
        // 直接从当前posts状态中查找，避免重新调用API
        const updatedPost = posts.find(p => p.id === active.id)
        if (updatedPost && JSON.stringify(updatedPost) !== JSON.stringify(active)) {
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
    
    // 添加posts数据，并修正当前用户的作者信息
    posts.forEach(p => {
      let post = p;
      if (user && p.author) {
        const authorId = typeof p.author === 'string' ? p.author : p.author.id;
        // 检查是否是当前用户发布的（ID匹配 或者 authorId是'current-user'）
        if (authorId === user.id || authorId === 'current-user') {
           post = {
             ...p,
             author: {
               id: user.id,
               username: user.username,
               email: user.email,
               avatar: user.avatar,
               isAdmin: user.isAdmin,
               membershipLevel: user.membershipLevel,
               membershipStatus: user.membershipStatus
             }
           };
        }
      }
      uniquePosts.set(post.id, post)
    })
    
    return Array.from(uniquePosts.values())
  }, [posts, user])
  
  // 按需合并数据，并确保数据不重复
  const merged = useMemo(() => {
    // 使用Map来确保唯一ID，避免重复
    const uniquePosts = new Map<string, Post>()
    
    // 先添加baseData
    baseData.forEach(p => uniquePosts.set(p.id, p))
    
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
  }, [baseData, sortBy, search, communityMode, selectedStyle, selectedTopic, favOnly, favorites])
  
  const viewList = useMemo(() => merged.slice(0, page * pageSize), [merged, page])
  
  // 优化：使用useCallback稳定like函数
  const like = useCallback(async (id: string) => {
    if (!user?.id) {
      toast.error('请先登录后再点赞')
      navigate('/login')
      return
    }
    try {
      await postsApi.likePost(id, user.id)
      const current = await postsApi.getPosts()
      setPosts(current)
      // 更新active状态中的点赞数
      if (active && active.id === id) {
        setActive(prev => prev ? { ...prev, likes: prev.likes + 1, isLiked: true } : null)
      }
      toast.success('点赞成功')
    } catch (error) {
      console.error('点赞失败:', error)
      toast.error('点赞失败，请稍后重试')
    }
  }, [active, user, navigate])
  
  // 优化：使用useCallback稳定addComment函数
  const addComment = useCallback(async (id: string, content: string) => {
    if (!content) return
    
    // 检查用户是否登录
    if (!user?.id) {
      toast.error('请先登录后再评论')
      navigate('/login')
      return
    }
    
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
        userReactions: [],
        author: user?.username || '匿名用户'
      }
      
      // 创建更新后的帖子对象
      const updatedActivePost = {
        ...active,
        comments: [...active.comments, newComment as any]
      }
      
      // 立即更新active状态，实现评论的实时显示
      setActive(updatedActivePost)
      console.log('Updated active post immediately:', updatedActivePost)
    }
    
    // 2. 然后调用API添加评论，确保数据持久化
    try {
      const updatedPost = await postsApi.addComment(id, content, undefined, user)
      console.log('Updated post from API:', updatedPost)
      
      // 3. 最后更新本地状态，确保数据同步
      if (updatedPost) {
        const current = await postsApi.getPosts()
        console.log('Current posts after API call:', current)
        setPosts(current)
      }
    } catch (error: any) {
      console.error('Failed to add comment:', error)
      toast.error(error.message || '评论失败，请重试')
    }
  }, [active, user, navigate])
  
  // 优化：使用useCallback稳定share函数
  const sharePost = useCallback((id: string) => {
    const url = location.origin + `/square/${id}`
    navigator.clipboard?.writeText(url)
    alert('作品链接已复制')
  }, [])
  
  // 优化：使用useCallback稳定toggleFavorite函数
  const toggleFavorite = useCallback(async (id: string) => {
    // 中文注释：收藏/取消收藏
    if (!user?.id) {
      toast.error('请先登录后再收藏')
      navigate('/login')
      return
    }
    
    const isCurrentlyFavorited = favorites.includes(id);
    
    // 先更新本地状态，提供即时反馈
    setFavorites(prev => {
      const has = prev.includes(id)
      const next = has ? prev.filter(x => x !== id) : [...prev, id]
      try { localStorage.setItem('jmzf_favs', JSON.stringify(next)) } catch {}
      return next
    });
    
    // 然后调用API更新服务器状态
    try {
      if (isCurrentlyFavorited) {
        await postsApi.unbookmarkPost(id, user.id);
        toast.success('已取消收藏')
      } else {
        await postsApi.bookmarkPost(id, user.id);
        toast.success('收藏成功')
      }
      
      // 更新active状态中的收藏状态
      if (active && active.id === id) {
        setActive(prev => prev ? { ...prev, isBookmarked: !isCurrentlyFavorited } : null);
      }
    } catch (error) {
      console.error('更新收藏状态失败:', error);
      toast.error('操作失败，请稍后重试')
      // 如果API调用失败，恢复本地状态
      setFavorites(favorites);
    }
  }, [active, favorites, user, navigate])
  
  // 优化：使用useCallback稳定deletePost函数
  const deletePost = useCallback(async (id: string) => {
    try {
      // 调用API删除帖子
      const success = await postsApi.deletePost(id);
      if (success) {
        // 重新获取最新的帖子数据
        const current = await postsApi.getPosts();
        setPosts(current);
        // 如果当前打开的详情是被删除的帖子，关闭详情
        if (active && active.id === id) {
          setActive(null);
        }
      }
    } catch (error) {
      console.error('删除帖子失败:', error);
    }
  }, [active])
  
  // 优化：使用useCallback稳定importExploreWorks函数
  const importExploreWorks = useCallback(() => {
    // 中文注释：导入探索页策展作品到广场视图
    setImportedExplore(true)
    alert('已导入策展作品')
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
  
  const handleCreatePost = async (data: any) => {
    try {
      const newPost: Partial<Post> = {
        title: data.title,
        description: data.content,
        thumbnail: data.images?.[0] || 'https://images.unsplash.com/photo-1558655146-d09347e0c766?q=80&w=2560&auto=format&fit=crop', // 默认图
        category: data.contentType === 'video' ? 'video' : 'design',
        tags: [data.topic],
        date: new Date().toISOString().split('T')[0],
        likes: 0,
        views: 0,
        comments: [],
        shares: 0,
        // author: user?.name || '当前用户', // 不再使用字符串
        // authorAvatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`, // 不再使用单独字段
        isLiked: false,
        isBookmarked: false,
        videoUrl: data.contentType === 'video' && data.images?.[0] ? data.images[0] : undefined
      }

      // 传入当前用户对象
      await postsApi.addPost(newPost as Post, user || undefined)
      toast.success('发布成功！')
      setIsCreateModalOpen(false);
      const current = await postsApi.getPosts();
      setPosts(current);
    } catch (error) {
      toast.error('发布失败');
      console.error(error);
    }
  };
  
  // 确保详情弹窗也显示最新的用户信息
  const hydratedActive = useMemo(() => {
    if (!active || !user) return active;
    
    const authorId = typeof active.author === 'string' ? active.author : active.author?.id;
    if (authorId === user.id || authorId === 'current-user') {
       return {
           ...active,
           author: {
             id: user.id,
             username: user.username,
             email: user.email,
             avatar: user.avatar,
             isAdmin: user.isAdmin,
             membershipLevel: user.membershipLevel,
             membershipStatus: user.membershipStatus
           }
       };
    }
    return active;
  }, [active, user]);


  return (
    <div className="min-h-screen">
      {/* 顶部导航栏 - Pinterest风格 */}
      <header className={`sticky top-0 z-50 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo和导航链接 */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <i className="fas fa-globe-asia text-blue-500 text-xl"></i>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/square" className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} border-b-2 border-blue-500 px-1 py-2`}>发现</Link>
              <Link to="/community" className={`text-sm font-medium ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} px-1 py-2`}>社区</Link>
              <Link to="/create" className={`text-sm font-medium ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} px-1 py-2`}>创作</Link>
            </nav>
          </div>
          
          {/* 搜索框 - Pinterest风格 */}
          <div className="flex-1 max-w-2xl mx-4 md:mx-6 relative z-30">
            <div className={`relative ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-full overflow-hidden`}>
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10"></i>
              <input 
                type="text" 
                placeholder="搜索作品、创作者或标签..." 
                className={`w-full pl-10 pr-4 py-2 rounded-full text-sm ${isDark ? 'bg-gray-800 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-blue-500 relative z-20`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    // 实现搜索逻辑
                    console.log('搜索:', search);
                  }
                }}
              />
            </div>
          </div>
          

        </div>
      </header>
      
      {/* 标签栏 - Pinterest风格 - 放在header外面，确保在搜索框下层 */}
      <div className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} overflow-x-auto sticky top-[72px] z-10 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="container mx-auto px-4 py-2 flex items-center gap-2 min-w-max">
          {tags.slice(0, 15).map((tag) => (
            <button 
              key={tag} 
              onClick={() => incTagClick(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 主要内容 */}
      <main className={`w-full min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>


        {/* 作品网格 */}
        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 aspect-square flex items-center justify-center">
                <div className="text-gray-400">加载中...</div>
              </div>
            ))}
          </div>
        }>
          <PostGrid
            posts={viewList}
            onLike={like}
            onComment={(id) => {
              loadPostDetail(id)
            }}
            onShare={sharePost}
            onBookmark={toggleFavorite}
            onDelete={deletePost}
            onPostClick={(id) => {
              loadPostDetail(id)
              // 更新URL但不跳转，保持模态框体验
              window.history.pushState({ modal: true }, '', `/post/${id}`)
            }}
            favorites={favorites}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            isDark={isDark}
          />
        </Suspense>

        {/* 加载更多指示器 */}
        <div ref={sentinelRef} className="h-16 flex items-center justify-center">
          {isLoadingMore && (
            <div className="text-gray-500">加载中...</div>
          )}
        </div>
      </main>



      {/* 详情弹窗 */}
      {hydratedActive && (
        <PostDetailModal
          post={hydratedActive}
          isOpen={!!active}
          onClose={() => {
            setActive(null)
            // 恢复URL
            if (window.history.state?.modal) {
              window.history.back()
            } else {
              window.history.pushState({}, '', '/square')
            }
          }}
          onLike={like}
          onComment={addComment}
          onShare={sharePost}
          loading={activeLoading}
          error={activeError}
          currentUser={user}
        />
      )}

      {/* 发布弹窗 */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePost}
        isDark={isDark}
        topics={DEFAULT_TAGS}
      />
    </div>
  )
}
