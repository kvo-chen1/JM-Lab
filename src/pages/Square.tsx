import { useTheme } from '@/hooks/useTheme'
import { useState, useMemo, useRef, useCallback, useEffect, lazy, Suspense } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import postsApi, { Post } from '@/services/postService'
import { SearchResultType } from '@/components/SearchBar'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

import { AuthContext } from '@/contexts/authContext'
import { useContext } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'

import { CreatePostModal } from '@/components/Community/Modals/CreatePostModal'
import ShareSelector from '@/components/ShareSelector'
import PublishToSquareModal from '@/components/PublishToSquareModal'


import apiClient from '@/lib/apiClient'

// 懒加载组件
const PostGrid = lazy(() => import('@/components/PostGrid'))
const SearchBar = lazy(() => import('@/components/SearchBar'))
// 移动端瀑布流组件
const MobileWorksGallery = lazy(() => import('@/pages/MobileWorksGallery'))

export default function Square() {
  const { isDark } = useTheme()
  const params = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useContext(AuthContext)
  const { addNotification } = useNotifications()
  
  // 检测是否为移动端（屏幕宽度小于 768px）
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 768
  })
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // 初始化
    handleResize()
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
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
  // 已移除弹窗相关状态，点击作品直接跳转到独立页面
  // const [active, setActive] = useState<Post | null>(null)
  // const [activeLoading, setActiveLoading] = useState(false)
  // const [activeError, setActiveError] = useState<string | null>(null)
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
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false) // 中文注释：上传作品到广场弹窗状态
  const sentinelRef = useRef<HTMLDivElement | null>(null) // 中文注释：无限滚动观察器锚点
  const thumbFileRef = useRef<HTMLInputElement | null>(null) // 中文注释：封面本地上传文件引用
  const loadingRef = useRef(false) // 中文注释：防止重复加载的标志

  // 分享功能状态
  const [shareTarget, setShareTarget] = useState<{
    postId: string;
    post: Post;
  } | null>(null)

  // 中文注释：本地缓存机制，减少重复计算
  const cachedDataRef = useRef<Map<string, Post[]>>(new Map())

  // 从URL参数中读取搜索关键词
  useEffect(() => {
    const searchQuery = searchParams.get('search')
    if (searchQuery) {
      setSearch(searchQuery)
    }
  }, [searchParams])

  // 优化初始数据加载：只加载必要的数据
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        // 清除缓存，确保获取最新数据
        await postsApi.clearAllCaches()

        // 从数据库同步收藏列表到本地状态
        if (user?.id) {
          try {
            const bookmarkedIds = await postsApi.getUserBookmarks(user.id)
            setFavorites(bookmarkedIds)
            localStorage.setItem('jmzf_favs', JSON.stringify(bookmarkedIds))
          } catch (error) {
            console.warn('同步收藏列表失败:', error)
          }
        }

        // 津脉广场只显示作品（works表），不显示帖子（posts表）
        const current = await postsApi.getPosts(undefined, user?.id, false, 'works')

        if (Array.isArray(current)) {
          // 调试：检查视频帖子数据
          const videoPosts = current.filter(p => p.category === 'video' || p.type === 'video');
          console.log('Video posts loaded:', videoPosts.map(p => ({
            id: p.id,
            title: p.title,
            videoUrl: p.videoUrl,
            thumbnail: p.thumbnail?.substring(0, 50),
            category: p.category,
            type: p.type
          })));
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
  }, [user?.id])
  
  // 已移除 loadPostDetail 函数，点击作品直接跳转到独立页面 /post/:id

  useEffect(() => {
    // 监听作品发布事件，当用户发布新作品到津脉广场时自动刷新
    const handleSquarePostsUpdated = async () => {
      console.log('收到广场作品更新事件，重新加载数据...');
      try {
        // 清除缓存，确保获取最新数据
        await postsApi.clearAllCaches();
        const current = await postsApi.getPosts(undefined, user?.id, false, 'works');
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
    
    // 找到当前帖子
    const targetPost = posts.find(p => p.id === id)
    if (!targetPost) return
    
    // 乐观更新：先更新本地状态
    const newIsLiked = !targetPost.isLiked
    const newLikes = newIsLiked ? (targetPost.likes || 0) + 1 : Math.max(0, (targetPost.likes || 0) - 1)
    
    // 更新 posts 列表中的状态
    setPosts(prev => prev.map(p => 
      p.id === id 
        ? { ...p, isLiked: newIsLiked, likes: newLikes }
        : p
    ))
    
    try {
      if (newIsLiked) {
        await postsApi.likePost(id, user.id)
        toast.success('点赞成功')
        
        // 创建通知给作品作者
        if (targetPost.authorId && targetPost.authorId !== user.id) {
          addNotification({
            type: 'post_liked',
            title: '有人赞了你的作品',
            content: `${user.username || '有人'}赞了你的作品"${targetPost.title || '无标题'}"`,
            senderId: user.id,
            senderName: user.username || '匿名用户',
            senderAvatar: user.avatar || user.avatar_url || '',
            recipientId: targetPost.authorId,
            postId: id,
            priority: 'low',
            link: `/square?id=${id}`
          })
        }
      } else {
        await postsApi.unlikePost(id, user.id)
        toast.success('已取消点赞')
      }
    } catch (error) {
      console.error('点赞操作失败:', error)
      // 出错时回滚状态
      setPosts(prev => prev.map(p => 
        p.id === id 
          ? { ...p, isLiked: targetPost.isLiked, likes: targetPost.likes }
          : p
      ))
      toast.error('操作失败，请稍后重试')
    }
  }, [user, navigate, addNotification, posts])
  
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
    
    // 调用API添加评论，确保数据持久化
    try {
      const updatedPost = await postsApi.addComment(id, content, undefined, user)
      console.log('Updated post from API:', updatedPost)

      // 3. 最后更新本地状态，确保数据同步
      if (updatedPost) {
        const current = await postsApi.getPosts(undefined, user?.id, false, 'works')
        console.log('Current posts after API call:', current)
        setPosts(current)

        // 创建通知给作品作者
        const commentedPost = current.find(p => p.id === id)
        if (commentedPost && commentedPost.authorId && commentedPost.authorId !== user.id) {
          addNotification({
            type: 'post_commented',
            title: '有人评论了你的作品',
            content: `${user.username || '有人'}评论了你的作品"${commentedPost.title || '无标题'}"`,
            senderId: user.id,
            senderName: user.username || '匿名用户',
            senderAvatar: user.avatar || user.avatar_url || '',
            recipientId: commentedPost.authorId,
            postId: id,
            priority: 'medium',
            link: `/square?id=${id}`
          })
        }
      }
    } catch (error: any) {
      console.error('Failed to add comment:', error)
      toast.error(error.message || '评论失败，请重试')
    }
  }, [user, navigate, addNotification])
  
  // 优化：使用useCallback稳定share函数
  const sharePost = useCallback((id: string) => {
    const post = posts.find(p => p.id === id)
    if (post) {
      setShareTarget({ postId: id, post })
    }
  }, [posts])

  // 关闭分享对话框
  const closeShare = useCallback(() => {
    setShareTarget(null)
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
    const newBookmarkStatus = !isCurrentlyFavorited;

    // 先更新本地状态，提供即时反馈
    setFavorites(prev => {
      const has = prev.includes(id)
      const next = has ? prev.filter(x => x !== id) : [...prev, id]
      try { localStorage.setItem('jmzf_favs', JSON.stringify(next)) } catch {}
      return next
    });

    // 同时更新 posts 数组中的收藏状态
    setPosts(prev => prev.map(p =>
      p.id === id
        ? { ...p, isBookmarked: newBookmarkStatus }
        : p
    ));

    // 然后调用API更新服务器状态
    try {
      if (isCurrentlyFavorited) {
        await postsApi.unbookmarkPost(id, user.id);
        toast.success('已取消收藏')
      } else {
        await postsApi.bookmarkPost(id, user.id);
        toast.success('收藏成功')
      }

    } catch (error) {
      console.error('更新收藏状态失败:', error);
      toast.error('操作失败，请稍后重试')
      // 如果API调用失败，恢复本地状态
      setFavorites(favorites);
      // 恢复 posts 数组中的状态
      setPosts(prev => prev.map(p =>
        p.id === id
          ? { ...p, isBookmarked: isCurrentlyFavorited }
          : p
      ));
    }
  }, [favorites, user, navigate, posts])
  
  // 优化：使用useCallback稳定deletePost函数
  const deletePost = useCallback(async (id: string) => {
    try {
      // 调用API删除帖子
      const success = await postsApi.deletePost(id);
      if (success) {
        // 重新获取最新的作品数据
        const current = await postsApi.getPosts(undefined, user?.id, false, 'works');
        setPosts(current);
      }
    } catch (error) {
      console.error('删除帖子失败:', error);
    }
  }, [])
  
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
      // 根据内容类型获取媒体URL
      let mediaUrl: string | undefined;
      if (data.contentType === 'video' && data.videos?.[0]) {
        mediaUrl = data.videos[0];
      } else if (data.contentType === 'image' && data.images?.[0]) {
        mediaUrl = data.images[0];
      }
      
      const newPost: Partial<Post> = {
        title: data.title,
        description: data.content,
        thumbnail: mediaUrl || 'https://images.unsplash.com/photo-1558655146-d09347e0c766?q=80&w=2560&auto=format&fit=crop', // 默认图
        category: data.contentType === 'video' ? 'video' : 'design',
        tags: [data.topic],
        date: new Date().toISOString().split('T')[0],
        likes: 0,
        views: 0,
        comments: [],
        shares: 0,
        isLiked: false,
        isBookmarked: false,
        videoUrl: data.contentType === 'video' && data.videos?.[0] ? data.videos[0] : undefined
      }

      // 传入当前用户对象
      await postsApi.addPost(newPost as Post, user || undefined)
      toast.success('发布成功！')
      setIsCreateModalOpen(false);
      const current = await postsApi.getPosts(undefined, user?.id, false, 'works');
      setPosts(current);
    } catch (error) {
      toast.error('发布失败');
      console.error(error);
    }
  };
  
  // 将 Post 数据转换为移动端瀑布流所需的 ArtworkItem 格式
  const artworksForMobile = useMemo(() => {
    return viewList.map((post, index) => {
      // 获取作者信息
      const authorId = typeof post.author === 'string' ? post.author : post.author?.id || 'unknown';
      const authorName = typeof post.author === 'string' ? post.author : post.author?.username || '未知用户';
      // 使用 Dicebear API 生成基于作者ID的头像，确保每个用户有唯一的默认头像
      const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorId}&backgroundColor=b6e3f4`;
      const authorAvatar = typeof post.author === 'string' 
        ? defaultAvatar
        : (post.author?.avatar && post.author.avatar.trim() !== '' 
            ? post.author.avatar 
            : defaultAvatar);
      
      // 根据索引交替使用不同的宽高比，创建错落有致的瀑布流效果
      // 使用更大的宽高比，让图片更长、更美观
      const aspectRatios = [1.2, 1.5, 1.8, 1.0, 1.4, 1.6];
      const aspectRatio = aspectRatios[index % aspectRatios.length];
      
      return {
        id: post.id,
        title: post.title,
        imageUrl: post.thumbnail || 'https://images.unsplash.com/photo-1558655146-d09347e0c766?q=80&w=2560&auto=format&fit=crop',
        aspectRatio: aspectRatio,
        author: {
          id: authorId,
          name: authorName,
          avatar: authorAvatar
        },
        likes: post.likes || 0,
        views: post.views || 0,
        tags: post.tags || [],
        createdAt: post.date || new Date().toISOString(),
        isLiked: post.isLiked || false,
        isBookmarked: post.isBookmarked || false,
        // 视频相关字段
        isVideo: post.category === 'video' || post.type === 'video',
        videoUrl: post.videoUrl
      };
    });
  }, [viewList]);
  
  // 已移除 hydratedActive，点击作品直接跳转到独立页面


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
          <div id="guide-step-explore-search" className="flex-1 max-w-2xl mx-4 md:mx-6 relative flex items-center gap-2">
            <div className={`relative flex-1 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-full overflow-hidden`}>
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="搜索作品、创作者或标签..."
                className={`w-full pl-10 pr-4 py-2 rounded-full text-sm ${isDark ? 'bg-gray-800 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
            
            {/* 津脉活动快捷键 - 移动端显示 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/cultural-events')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all md:hidden ${
                isDark
                  ? 'bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30'
                  : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>活动</span>
            </motion.button>

            {/* 上传作品按钮 - 移动端显示 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPublishModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all md:hidden ${
                isDark
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30 hover:bg-blue-600/30'
                  : 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>发布</span>
            </motion.button>
          </div>
          

        </div>
      </header>
      
      {/* 标签栏 - Pinterest风格 - 放在header外面，确保在搜索框下层 - 仅桌面端显示 */}
      {!isMobile && (
        <div id="guide-step-explore-tags" className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} overflow-x-auto sticky top-[72px] z-10 ${isDark ? 'bg-gray-900' : 'bg-white'} scrollbar-hide`}>
          <div className="px-4 py-1 flex items-center gap-2">
            {tags.slice(0, 15).map((tag) => (
              <button
                key={tag}
                onClick={() => incTagClick(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 主要内容 */}
      <main className={`w-full min-h-screen transition-colors duration-300 overflow-x-hidden ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>


        {/* 作品网格 - 移动端使用瀑布流，桌面端使用 PostGrid */}
        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 aspect-square flex items-center justify-center">
                <div className="text-gray-400">加载中...</div>
              </div>
            ))}
          </div>
        }>
          {isMobile ? (
            // 移动端：两列瀑布流布局
            <MobileWorksGallery
              artworks={artworksForMobile}
              onLoadMore={async () => {
                // 触发加载更多
                if (!loadingRef.current && hasMore) {
                  loadingRef.current = true
                  setIsLoadingMore(true)
                  
                  if (viewList.length >= merged.length) {
                    setHasMore(false)
                    loadingRef.current = false
                    setIsLoadingMore(false)
                    return
                  }
                  
                  setPage(prev => prev + 1)
                  setTimeout(() => {
                    loadingRef.current = false
                    setIsLoadingMore(false)
                  }, 500)
                }
              }}
              onArtworkClick={(artwork) => {
                navigate(`/post/${artwork.id}`)
              }}
              onAuthorClick={(authorId) => {
                navigate(`/profile/${authorId}`)
              }}
              onLike={async (artworkId) => {
                await like(artworkId)
              }}
              onBookmark={async (artworkId) => {
                await toggleFavorite(artworkId)
              }}
              onShare={(artwork) => {
                const post = viewList.find(p => p.id === artwork.id)
                if (post) {
                  sharePost(post.id)
                }
              }}
              loading={isLoading}
              hasMore={hasMore}
            />
          ) : (
            // 桌面端：原有 PostGrid 布局
            <PostGrid
              posts={viewList}
              onLike={like}
              onComment={(id) => {
                navigate(`/post/${id}`)
              }}
              onShare={sharePost}
              onBookmark={toggleFavorite}
              onDelete={deletePost}
              onPostClick={(id) => {
                navigate(`/post/${id}`)
              }}
              favorites={favorites}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              isDark={isDark}
            />
          )}
        </Suspense>

        {/* 加载更多指示器 - 仅在桌面端显示，移动端由瀑布流组件内部处理 */}
        {!isMobile && (
          <div ref={sentinelRef} className="h-16 flex items-center justify-center">
            {isLoadingMore && (
              <div className="text-gray-500">加载中...</div>
            )}
          </div>
        )}
      </main>



      {/* 已移除 PostDetailModal 弹窗，点击作品直接跳转到独立页面 /post/:id */}

      {/* 发布弹窗 */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePost}
        isDark={isDark}
        topics={DEFAULT_TAGS}
      />

      {/* 分享选择弹窗 */}
      {shareTarget && (
        <ShareSelector
          isOpen={!!shareTarget}
          onClose={closeShare}
          shareData={{
            type: 'work',
            id: shareTarget.post.id,
            title: shareTarget.post.title,
            description: shareTarget.post.description,
            thumbnail: shareTarget.post.thumbnail,
            videoUrl: shareTarget.post.videoUrl,
            url: `${location.origin}/square/${shareTarget.post.id}`,
            author: shareTarget.post.author ? {
              name: shareTarget.post.author.username || '未知用户',
              avatar: shareTarget.post.author.avatar
            } : undefined
          }}
          userId={user?.id || ''}
          userName={user?.username || '用户'}
          userAvatar={user?.avatar}
        />
      )}

      {/* 上传作品到广场弹窗 */}
      <PublishToSquareModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
      />
    </div>
  )
}
