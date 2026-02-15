import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  MapPin, 
  Calendar, 
  Users, 
  Edit3, 
  Share2, 
  Mail, 
  Link as LinkIcon,
  Grid,
  List,
  Search,
  Award,
  BookOpen,
  Heart,
  Eye,
  MessageCircle,
  UserPlus,
  UserCheck,
  TrendingUp,
  Clock,
  Filter,
  ChevronDown,
  Globe,
  Github,
  Twitter,
  MoreHorizontal,
  Flag,
  Camera,
  Image as ImageIcon,
  Video,
  FileText,
  Sparkles,
  Zap,
  Target,
  Medal,
  Activity,
  ArrowUpRight,
  LayoutDashboard,
  X,
  Send
} from 'lucide-react'
import LazyImage from '../components/LazyImage'
import { PostGrid } from '../components/CreatorCommunity/PostGrid'
import postsApi, { Post, getAuthorById, checkUserFollowing, followUser, unfollowUser } from '../services/postService'
import { supabase } from '../lib/supabase'
import type { User } from '../contexts/authContext'
import { toast } from 'sonner'
import { sendDirectMessage, checkIsFriend, sendFriendRequest } from '../services/messageService'

interface AuthorProfileProps {
  currentUser?: User | null
}

// 活动类型定义
interface UserActivity {
  id: string
  type: 'post' | 'like' | 'comment' | 'follow'
  content: string
  target?: string
  createdAt: string
}

// 成就徽章类型
interface Achievement {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  unlockedAt?: string
  progress?: number
  maxProgress?: number
}

// 筛选类型
 type FilterType = 'all' | 'image' | 'video' | 'article'
 type SortType = 'recent' | 'popular' | 'comments'

export const AuthorProfile: React.FC<AuthorProfileProps> = ({ currentUser }) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [author, setAuthor] = useState<any | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortType, setSortType] = useState<SortType>('recent')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [activeTab, setActiveTab] = useState<'works' | 'activity' | 'achievements'>('works')
  const [isOnline] = useState(true) // 模拟在线状态
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  
  // 私信对话框状态
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageContent, setMessageContent] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  // 模拟成就数据
  const achievements: Achievement[] = useMemo(() => [
    { id: '1', name: '初出茅庐', description: '发布第一个作品', icon: <Sparkles className="w-5 h-5" />, unlockedAt: '2024-01-01', progress: 1, maxProgress: 1 },
    { id: '2', name: '人气新星', description: '获得100个赞', icon: <Zap className="w-5 h-5" />, unlockedAt: '2024-01-10', progress: 100, maxProgress: 100 },
    { id: '3', name: '创作达人', description: '发布10个作品', icon: <Target className="w-5 h-5" />, progress: 5, maxProgress: 10 },
    { id: '4', name: '社区领袖', description: '获得1000个粉丝', icon: <Medal className="w-5 h-5" />, progress: 50, maxProgress: 1000 },
  ], [])

  // 加载作者信息
  useEffect(() => {
    const loadAuthor = async () => {
      if (!id) return

      try {
        setLoading(true)
        console.log('[AuthorProfile] 开始加载作者，URL ID:', id)

        const authorData = await getAuthorById(id)
        console.log('[AuthorProfile] 获取到作者数据:', authorData)

        // 如果没有获取到作者数据，使用默认数据
        if (!authorData) {
          console.log('[AuthorProfile] 未获取到作者数据，使用默认数据')
          const defaultAuthor = {
            id,
            username: id,
            email: `${id}@example.com`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
            bio: '这位创作者还没有发布任何作品',
            followersCount: 0,
            followingCount: 0,
            created_at: new Date().toISOString(),
            location: '未知地点',
            stats: { totalViews: 0, totalLikes: 0, totalComments: 0, streakDays: 0 }
          }
          setAuthor(defaultAuthor)
          setPosts([])
          setLoading(false)
          return
        }

        // 使用 postsApi 获取作品数据
        console.log('[AuthorProfile] 使用 postsApi 获取作品，用户ID:', authorData.id)
        const allPosts = await postsApi.getPosts()
        console.log('[AuthorProfile] 获取到所有作品:', allPosts.length)

          // 过滤出当前用户的作品
          console.log('[AuthorProfile] 第一个作品的作者信息:', allPosts[0]?.author)
          console.log('[AuthorProfile] 当前页面用户ID:', authorData.id, '类型:', typeof authorData.id)
          const userPosts = allPosts.filter(post => {
            const postAuthorId = typeof post.author === 'object' ? post.author?.id : post.author
            console.log('[AuthorProfile] 比较:', postAuthorId, '===', authorData.id, '结果:', postAuthorId === authorData.id)
            return postAuthorId === authorData.id
          })
          console.log('[AuthorProfile] 过滤后用户作品:', userPosts.length)

          // 计算真实的统计数据（优先使用后端返回的数据）
          const totalViews = authorData.viewsCount || userPosts.reduce((sum, post) => sum + (Number(post.viewCount) || Number(post.views) || 0), 0)
          const totalLikes = authorData.likesCount || userPosts.reduce((sum, post) => sum + (Number(post.likesCount) || Number(post.likes) || 0), 0)
          const totalComments = 0

          // 计算创作天数
          let streakDays = 0
          if (userPosts.length > 0) {
            const dates = userPosts.map(p => new Date(p.date || p.created_at).getTime())
            const earliestDate = new Date(Math.min(...dates))
            const now = new Date()
            streakDays = Math.max(1, Math.floor((now.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)))
          }

          // 获取真实的粉丝数和关注数（优先使用后端返回的数据）
          let followersCount = authorData.followersCount || 0
          let followingCount = authorData.followingCount || 0
          try {
            // 检查 ID 是否是有效的 UUID 格式（Supabase follows 表使用 UUID）
            const isValidUUID = (id: string) => {
              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
              return uuidRegex.test(id)
            }

            if (isValidUUID(authorData.id)) {
              // 获取粉丝数（关注该用户的人数）
              const { count: followers, error: followersError } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', authorData.id)

              if (!followersError && followers !== null) {
                followersCount = followers
              }

              // 获取关注数（该用户关注的人数）
              const { count: following, error: followingError } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', authorData.id)

              if (!followingError && following !== null) {
                followingCount = following
              }
            } else {
              console.log('[AuthorProfile] ID 不是 UUID 格式，跳过粉丝数查询:', authorData.id)
            }

            console.log('[AuthorProfile] 粉丝/关注数据:', { followersCount, followingCount })
          } catch (error) {
            console.error('[AuthorProfile] 获取粉丝数失败:', error)
          }

          // 调试日志
          console.log('[AuthorProfile] 用户统计数据:', {
            userId: authorData.id,
            worksCount: userPosts.length,
            totalViews,
            totalLikes,
            totalComments,
            streakDays,
            followersCount,
            followingCount
          })

          if (currentUser) {
            const following = await checkUserFollowing(currentUser.id, id)
            setIsFollowing(following)
          }

          // 转换作品数据格式
          const adaptedPosts = userPosts.map(p => ({
            id: p.id.toString(),
            title: p.title,
            content: p.content || p.description || '',
            user_id: authorData.id,
            author_id: authorData.id,
            author: authorData,
            created_at: p.date || p.created_at,
            view_count: p.viewCount || p.views || 0,
            likes_count: p.likesCount || p.likes || 0,
            comments_count: 0,
            attachments: p.thumbnail ? [{ url: p.thumbnail }] : [],
            category: p.category,
            tags: p.tags || [],
            isLiked: false,
            isBookmarked: false,
            video_url: p.videoUrl || p.video_url,
            type: p.type
          }))
          
          setPosts(adaptedPosts)

          setAuthor({
            ...authorData,
            followersCount,
            followingCount,
            location: '天津, 中国',
            website: 'https://example.com',
            socialLinks: {
              github: 'https://github.com',
              twitter: 'https://twitter.com',
              weibo: 'https://weibo.com'
            },
            stats: {
              totalViews,
              totalLikes,
              totalComments,
              streakDays
            }
          })
      } catch (error) {
        console.error('加载作者信息失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAuthor()
  }, [id, currentUser])

  // 加载用户活动数据
  useEffect(() => {
    const loadActivities = async () => {
      if (!id || activeTab !== 'activity') return

      try {
        setActivitiesLoading(true)
        const { data, error } = await supabase
          .from('user_activities')
          .select('id, activity_type, content, target_id, target_type, target_title, created_at')
          .eq('user_id', id)
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) {
          console.error('获取用户活动失败:', error)
          return
        }

        const formattedActivities: UserActivity[] = (data || []).map(item => ({
          id: item.id,
          type: item.activity_type as 'post' | 'like' | 'comment' | 'follow',
          content: item.content,
          target: item.target_title || undefined,
          createdAt: item.created_at
        }))

        setActivities(formattedActivities)
      } catch (error) {
        console.error('加载用户活动失败:', error)
      } finally {
        setActivitiesLoading(false)
      }
    }

    loadActivities()
  }, [id, activeTab])

  // 筛选和排序作品
  const filteredPosts = useMemo(() => {
    let result = [...posts]
    
    // 搜索筛选
    if (searchTerm) {
      result = result.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    // 类型筛选
    if (filterType !== 'all') {
      result = result.filter(post => {
        if (filterType === 'image') return post.attachments?.length > 0 && !post.video_url && post.type !== 'video'
        if (filterType === 'video') return post.video_url || post.type === 'video'
        if (filterType === 'article') return post.content?.length > 500
        return true
      })
    }
    
    // 排序
    result.sort((a, b) => {
      if (sortType === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (sortType === 'popular') {
        return (b.likes_count || 0) - (a.likes_count || 0)
      } else if (sortType === 'comments') {
        return (b.comments_count || 0) - (a.comments_count || 0)
      }
      return 0
    })
    
    return result
  }, [posts, searchTerm, filterType, sortType])

  // 处理关注/取消关注
  const handleFollow = async () => {
    if (!id || !currentUser) {
      toast.error('请先登录')
      return
    }

    try {
      console.log('[AuthorProfile] 执行关注操作:', { 
        targetUserId: id, 
        currentUserId: currentUser.id,
        isFollowing,
        isOwnProfile 
      })
      
      if (isFollowing) {
        const result = await unfollowUser(currentUser.id, id)
        if (result) {
          setIsFollowing(false)
          toast.success('已取消关注')
          setAuthor((prev: any) => prev ? {
            ...prev,
            followersCount: Math.max(0, (prev.followersCount || 0) - 1)
          } : null)
        } else {
          toast.error('取消关注失败')
        }
      } else {
        const result = await followUser(currentUser.id, id)
        if (result) {
          setIsFollowing(true)
          toast.success('关注成功')
          setAuthor((prev: any) => prev ? {
            ...prev,
            followersCount: (prev.followersCount || 0) + 1
          } : null)
        } else {
          toast.error('关注失败，可能已经是好友或网络问题')
        }
      }
    } catch (error: any) {
      console.error('[AuthorProfile] 关注操作失败:', error)
      toast.error(error.message || '操作失败，请重试')
    }
  }

  // 处理帖子点击
  const handlePostClick = (post: any) => {
    navigate(`/square/${post.id}`)
  }

  // 处理分享
  const handleShare = async () => {
    if (navigator.share && author) {
      try {
        await navigator.share({
          title: `${author.username} 的主页`,
          text: author.bio || `${author.username} 的创作者主页`,
          url: window.location.href
        })
      } catch (error) {
        console.error('分享失败:', error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('链接已复制到剪贴板')
    }
  }

  // 处理私信 - 跳转到私信页面
  const handleMessage = () => {
    if (!currentUser) {
      toast.error('请先登录')
      return
    }
    if (isOwnProfile) {
      toast.error('不能给自己发送私信')
      return
    }
    // 跳转到私信页面
    navigate(`/chat/${id}`)
  }

  // 发送私信 - 使用 Supabase
  const handleSendMessage = async () => {
    if (!messageContent.trim() || !id || !currentUser) return
    
    setSendingMessage(true)
    try {
      // 检查是否是好友关系
      const isFriend = await checkIsFriend(currentUser.id, id)
      
      if (!isFriend) {
        // 先发送好友请求
        try {
          await sendFriendRequest(currentUser.id, id)
          toast.success('已发送好友请求，对方接受后即可聊天')
          setSendingMessage(false)
          return
        } catch (friendError: any) {
          // 如果已经是好友，继续发送消息
          if (friendError.message !== 'ALREADY_FRIENDS') {
            console.log('好友请求可能已存在，继续发送消息')
          }
        }
      }
      
      // 发送消息
      await sendDirectMessage(currentUser.id, id, messageContent.trim())
      
      toast.success('私信发送成功')
      setMessageContent('')
      setShowMessageModal(false)
    } catch (error: any) {
      console.error('发送私信失败:', error)
      toast.error(error.message || '发送失败，请重试')
    } finally {
      setSendingMessage(false)
    }
  }

  // 处理举报
  const handleReport = () => {
    toast.info('举报功能开发中...')
  }

  // 处理编辑封面
  const handleEditCover = () => {
    toast.info('封面编辑功能开发中...')
  }

  // 获取活动图标
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post': return <Edit3 className="w-4 h-4 text-blue-500" />
      case 'like': return <Heart className="w-4 h-4 text-red-500" />
      case 'comment': return <MessageCircle className="w-4 h-4 text-green-500" />
      case 'follow': return <UserPlus className="w-4 h-4 text-purple-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  // 骨架屏
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-xl mb-8" />
          <div className="flex items-start space-x-6 mb-8">
            <div className="w-24 h-24 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-8 bg-gray-200 rounded w-48 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-96 mb-4" />
              <div className="flex items-center space-x-6">
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-20" />
              </div>
            </div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-64" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!author) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <div className="text-gray-400 mb-4">
          <Users className="w-16 h-16 mx-auto mb-4" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">用户不存在</h2>
        <p className="text-gray-500 mb-6">您访问的用户可能已被删除或不存在</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          返回首页
        </button>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === author.id

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 头部横幅 */}
      <div 
        className="relative h-64 md:h-80 rounded-xl mb-8 overflow-hidden"
        style={(author.coverImage || author.cover_image) ? {
          backgroundImage: `url(${author.coverImage || author.cover_image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
      >
        {/* 默认渐变背景 */}
        {!(author.coverImage || author.cover_image) && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        )}
        
        {/* 动态背景效果 */}
        <div className="absolute inset-0 bg-black bg-opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* 装饰性元素 - 只在没有封面时显示 */}
        {!(author.coverImage || author.cover_image) && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        )}
        
        {/* 编辑封面按钮 */}
        {isOwnProfile && (
          <button
            onClick={handleEditCover}
            className="absolute top-4 right-4 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">更换封面</span>
          </button>
        )}
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">{author.username}</h1>
            {author.bio && (
              <p className="text-lg opacity-90 max-w-2xl mx-auto px-4 drop-shadow-md">{author.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* 个人信息区域 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* 头像 */}
            <div className="relative flex-shrink-0 group">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-xl">
                <LazyImage
                  src={author.avatar || author.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.username}`}
                  alt={author.username}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  placeholder="blur"
                  ratio="square"
                />
              </div>
              
              {/* 在线状态指示器 */}
              {isOnline && (
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-700" title="在线" />
              )}
              
              {/* 认证标识 */}
              {author.is_verified && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-700 shadow-lg">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
              
              {/* 编辑头像按钮 */}
              {isOwnProfile && (
                <button className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </button>
              )}
            </div>

            {/* 基本信息 */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{author.username}</h1>
                {author.is_verified && (
                  <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                    <Award className="w-4 h-4" />
                    <span>认证创作者</span>
                  </div>
                )}
              </div>

              {author.bio && (
                <p className="text-gray-600 dark:text-gray-300 text-base mb-4 leading-relaxed max-w-xl">
                  {author.bio}
                </p>
              )}

              {/* 统计信息 */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 md:gap-8 text-sm text-gray-500 dark:text-gray-400 mb-6">
                <div className="flex items-center gap-2 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold text-gray-900 dark:text-white">{author.followersCount || author.followers_count || 0}</span>
                  <span>粉丝</span>
                </div>
                <div className="flex items-center gap-2 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-semibold text-gray-900 dark:text-white">{author.followingCount || author.following_count || 0}</span>
                  <span>关注</span>
                </div>
                <div className="flex items-center gap-2 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer">
                  <Edit3 className="w-4 h-4" />
                  <span className="font-semibold text-gray-900 dark:text-white">{posts.length}</span>
                  <span>作品</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>加入于 {author.created_at || author.membershipStart ? new Date(author.created_at || author.membershipStart).toLocaleDateString('zh-CN') : '未知'}</span>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                {!isOwnProfile ? (
                  <>
                    <button
                      onClick={handleFollow}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all duration-200 ${
                        isFollowing
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                          : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30'
                      }`}
                    >
                      {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      {isFollowing ? '已关注' : '关注'}
                    </button>
                    <button
                      onClick={handleMessage}
                      className="px-6 py-2.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                      私信
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/settings')}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors font-medium shadow-lg shadow-blue-500/30"
                    >
                      <Edit3 className="w-4 h-4" />
                      编辑资料
                    </button>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      个人中心
                    </button>
                  </>
                )}

                <button
                  onClick={handleShare}
                  className="p-2.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="分享"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                
                {!isOwnProfile && (
                  <div className="relative">
                    <button
                      onClick={handleReport}
                      className="p-2.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-full hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                      title="举报"
                    >
                      <Flag className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 联系信息 */}
          <div className="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-400 min-w-[200px]">
            {author.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{author.location}</span>
              </div>
            )}
            {author.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href={`mailto:${author.email}`} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  {author.email}
                </a>
              </div>
            )}
            {author.website && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <a href={author.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1">
                  个人网站
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            )}
            
            {/* 社交链接 */}
            {author.socialLinks && (
              <div className="flex items-center gap-2 mt-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                {author.socialLinks.github && (
                  <a href={author.socialLinks.github} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <Github className="w-4 h-4" />
                  </a>
                )}
                {author.socialLinks.twitter && (
                  <a href={author.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 数据概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{(author.stats?.totalViews || 0).toLocaleString()}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">总浏览量</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between mb-2">
            <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
            <TrendingUp className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100">{(author.stats?.totalLikes || 0).toLocaleString()}</p>
          <p className="text-sm text-red-600 dark:text-red-400">总点赞数</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-2">
            <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">{(author.stats?.totalComments || 0).toLocaleString()}</p>
          <p className="text-sm text-green-600 dark:text-green-400">总评论数</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-purple-500 font-medium">连续{author.stats?.streakDays || 0}天</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{author.stats?.streakDays || 0}</p>
          <p className="text-sm text-purple-600 dark:text-purple-400">创作天数</p>
        </div>
      </div>

      {/* 标签页切换 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* 标签页头部 */}
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('works')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${
              activeTab === 'works'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Grid className="w-4 h-4" />
            作品集
            <span className="ml-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
              {posts.length}
            </span>
            {activeTab === 'works' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${
              activeTab === 'activity'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            动态
            {activeTab === 'activity' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${
              activeTab === 'achievements'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            成就
            {activeTab === 'achievements' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        </div>

        {/* 标签页内容 */}
        <div className="p-6 md:p-8">
          {activeTab === 'works' && (
            <>
              {/* 作品筛选栏 */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  {/* 类型筛选 */}
                  <div className="relative">
                    <button
                      onClick={() => setShowFilterMenu(!showFilterMenu)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Filter className="w-4 h-4" />
                      <span>
                        {filterType === 'all' && '全部类型'}
                        {filterType === 'image' && '图片'}
                        {filterType === 'video' && '视频'}
                        {filterType === 'article' && '文章'}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {showFilterMenu && (
                      <div className="absolute top-full left-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                        <button
                          onClick={() => { setFilterType('all'); setShowFilterMenu(false); }}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${filterType === 'all' ? 'text-blue-600' : ''}`}
                        >
                          <Grid className="w-4 h-4" /> 全部类型
                        </button>
                        <button
                          onClick={() => { setFilterType('image'); setShowFilterMenu(false); }}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${filterType === 'image' ? 'text-blue-600' : ''}`}
                        >
                          <ImageIcon className="w-4 h-4" /> 图片
                        </button>
                        <button
                          onClick={() => { setFilterType('video'); setShowFilterMenu(false); }}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${filterType === 'video' ? 'text-blue-600' : ''}`}
                        >
                          <Video className="w-4 h-4" /> 视频
                        </button>
                        <button
                          onClick={() => { setFilterType('article'); setShowFilterMenu(false); }}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${filterType === 'article' ? 'text-blue-600' : ''}`}
                        >
                          <FileText className="w-4 h-4" /> 文章
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 排序选项 */}
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setSortType('recent')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        sortType === 'recent'
                          ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      最新
                    </button>
                    <button
                      onClick={() => setSortType('popular')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        sortType === 'popular'
                          ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      最热
                    </button>
                    <button
                      onClick={() => setSortType('comments')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        sortType === 'comments'
                          ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      最多评论
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* 搜索 */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="搜索作品..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent dark:text-white w-full md:w-64"
                    />
                  </div>

                  {/* 视图切换 */}
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      title="网格视图"
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      title="列表视图"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 作品列表 */}
              {filteredPosts.length > 0 ? (
                <PostGrid
                  posts={filteredPosts}
                  loading={loading}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  onPostClick={handlePostClick}
                />
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Edit3 className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {searchTerm ? '没有找到匹配的作品' : '暂无作品'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    {searchTerm 
                      ? '尝试使用其他关键词搜索，或清除筛选条件查看全部作品'
                      : isOwnProfile 
                        ? '你还没有发布任何作品，点击下方的按钮开始创作吧！'
                        : '该作者尚未发布任何作品，关注后可以在第一时间看到更新'
                    }
                  </p>
                  {isOwnProfile && (
                    <button
                      onClick={() => navigate('/create')}
                      className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors font-medium shadow-lg shadow-blue-500/30"
                    >
                      开始创作
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">最近动态</h3>
              
              {activitiesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length > 0 ? (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-10 h-10 bg-white dark:bg-gray-600 rounded-full flex items-center justify-center shadow-sm">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white">
                        {activity.content}
                        {activity.target && (
                          <span className="text-blue-600 dark:text-blue-400 ml-1">{activity.target}</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(activity.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Activity className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">暂无动态</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    该用户还没有任何活动记录，关注后可以在第一时间看到更新
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">成就徽章</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      achievement.unlockedAt
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-700'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 opacity-70'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        achievement.unlockedAt
                          ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                      }`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{achievement.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{achievement.description}</p>
                        
                        {/* 进度条 */}
                        {achievement.maxProgress && achievement.maxProgress > 1 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                              <span>进度</span>
                              <span>{achievement.progress}/{achievement.maxProgress}</span>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${((achievement.progress || 0) / (achievement.maxProgress || 1)) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {achievement.unlockedAt && (
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                            解锁于 {new Date(achievement.unlockedAt).toLocaleDateString('zh-CN')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 私信对话框 */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* 对话框头部 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <img
                  src={author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`}
                  alt={author?.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    发送私信给 {author?.username}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isFollowing ? '已关注' : '未关注'} · 直接发送消息
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMessageModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 消息输入区 */}
            <div className="p-4">
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder={`给 ${author?.username} 发送消息...`}
                className="w-full h-32 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400"
                disabled={sendingMessage}
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-gray-400">
                  {messageContent.length}/500
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowMessageModal(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    disabled={sendingMessage}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageContent.trim() || sendingMessage}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sendingMessage ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        发送中...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        发送
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuthorProfile
