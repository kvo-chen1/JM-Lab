import React, { useState, useEffect } from 'react'
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
  Filter,
  Search,
  Award,
  BookOpen,
  Heart,
  Eye,
  MessageCircle,
  UserPlus,
  UserCheck
} from 'lucide-react'
import LazyImage from '../components/LazyImage'
import { PostGrid } from '../components/CreatorCommunity/PostGrid'
// 移除旧的API导入
// import { getUserProfile, getUserPosts, toggleFollow, checkUserFollowing } from '../lib/api'
// 导入新的postService
import postsApi, { Post, getAuthorById, checkUserFollowing, followUser, unfollowUser } from '../services/postService'
// 适配类型
import type { User } from '../contexts/authContext'
import { toast } from 'sonner'

interface AuthorProfileProps {
  currentUser?: User | null
}

export const AuthorProfile: React.FC<AuthorProfileProps> = ({ currentUser }) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  // 使用authContext中的User类型，或postService中的User类型，这里做适配
  const [author, setAuthor] = useState<any | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<'all' | 'popular' | 'recent'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // 加载作者信息
  useEffect(() => {
    const loadAuthor = async () => {
      if (!id) return

      try {
        setLoading(true)
        
        // 1. 获取作者信息 (从本地数据)
        const authorData = await getAuthorById(id)
        
        if (authorData) {
          setAuthor(authorData)
          
          // 2. 检查关注状态
          if (currentUser) {
            const following = await checkUserFollowing(id)
            setIsFollowing(following)
          }

          // 3. 加载作者帖子
          const allPosts = await postsApi.getPosts()
          const authorPosts = allPosts.filter(p => {
            if (typeof p.author === 'object' && p.author !== null) {
              // 使用解析出的作者真实ID进行匹配，而不是URL参数中的ID（可能是 'current-user'）
              return (p.author as any).id === authorData.id
            }
            return false
          })
          
          // 适配PostGrid组件期望的类型，确保字段结构正确
          const adaptedPosts = authorPosts.map(p => ({
            id: p.id,
            title: p.title,
            content: p.description || '',
            user_id: (p.author as any)?.id || id,
            author_id: (p.author as any)?.id || id,
            // 强制使用当前已加载的正确作者信息，覆盖帖子中可能过时的作者信息
            author: authorData,
            created_at: p.date || new Date().toISOString(),
            view_count: p.views || 0,
            likes_count: p.likes || 0,
            comments_count: p.commentCount || 0,
            attachments: p.thumbnail ? [{ url: p.thumbnail }] : [],
            // 确保没有循环引用
            isLiked: false,
            isBookmarked: false
          }))
          
          setPosts(adaptedPosts)
        } else {
          // 如果找不到作者，但ID是当前用户，可能还未发布作品
          if (currentUser && currentUser.id === id) {
             setAuthor(currentUser)
             setPosts([])
          } else {
            // 为未发布过帖子的用户创建默认作者信息
            const defaultAuthor = {
              id,
              username: id,
              email: `${id}@example.com`,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
              bio: '这位创作者还没有发布任何作品',
              followersCount: 0,
              followingCount: 0,
              created_at: new Date().toISOString()
            }
            setAuthor(defaultAuthor)
            setPosts([])
          }
        }
      } catch (error) {
        console.error('加载作者信息失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAuthor()
  }, [id, currentUser])

  // 处理添加好友/取消好友
  const handleFollow = async () => {
    if (!id || !currentUser) {
      toast.error('请先登录')
      return
    }

    try {
      if (isFollowing) {
        await unfollowUser(id)
        setIsFollowing(false)
        toast.success('已取消好友')
      } else {
        await followUser(id)
        setIsFollowing(true)
        toast.success('添加好友成功')
      }
      
      // 更新显示
      setAuthor((prev: any) => prev ? {
        ...prev,
        followersCount: (prev.followersCount || 0) + (isFollowing ? -1 : 1)
      } : null)
      
    } catch (error) {
      console.error('操作失败:', error)
      toast.error('操作失败，请重试')
    }
  }

  // 处理帖子点击
  const handlePostClick = (post: any) => {
    // 导航到广场详情页，使用路径参数而不是查询参数，适配Square页面的路由定义
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

  // 处理私信
  const handleMessage = () => {
    toast.info('私信功能开发中...')
  }

  // 骨架屏
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          {/* 头部横幅 */}
          <div className="h-48 bg-gray-200 rounded-xl mb-8" />
          
          {/* 个人信息 */}
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

          {/* 作品区域 */}
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 头部横幅 */}
      <div className="relative h-64 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-3xl font-bold mb-2">{author.username}</h1>
            {author.bio && (
              <p className="text-lg opacity-90">{author.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* 个人信息区域 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start space-x-6">
            {/* 头像 */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <LazyImage
                  src={author.avatar || author.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.username}`}
                  alt={author.username}
                  className="w-full h-full object-cover"
                  placeholder="blur"
                />
              </div>
              {/* 认证标识 */}
              {author.is_verified && (
                <div className="absolute -bottom-2 -right-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </div>

            {/* 基本信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{author.username}</h1>
                {author.is_verified && (
                  <div className="flex items-center space-x-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    <Award className="w-4 h-4" />
                    <span>认证创作者</span>
                  </div>
                )}
              </div>

              {author.bio && (
                <p className="text-gray-600 dark:text-gray-300 text-lg mb-4 leading-relaxed">
                  {author.bio}
                </p>
              )}

              {/* 统计信息 */}
              <div className="flex items-center space-x-8 text-sm text-gray-500 dark:text-gray-400 mb-6">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{author.followersCount || author.followers_count || 0} 粉丝</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{author.followingCount || author.following_count || 0} 关注</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Edit3 className="w-4 h-4" />
                  <span>{posts.length} 作品</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>加入于 {author.created_at || author.membershipStart ? new Date(author.created_at || author.membershipStart).toLocaleDateString() : '未知'}</span>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center space-x-4">
                {currentUser?.id && currentUser.id !== author.id ? (
                  <>
                    <button
                      onClick={handleFollow}
                      className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                        isFollowing
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      {isFollowing ? '已添加好友' : '添加好友'}
                    </button>
                    <button
                      onClick={handleMessage}
                      className="px-6 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                      私信
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate('/settings')}
                    className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors font-medium"
                  >
                    编辑资料
                  </button>
                )}
                
                <button
                  onClick={handleShare}
                  className="p-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* 联系信息 */}
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            {author.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{author.location}</span>
              </div>
            )}
            {author.email && (
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <a 
                  href={`mailto:${author.email}`}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {author.email}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 作品展示区域 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        {/* 作品头部 */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">作品集</h2>
          
          <div className="flex items-center space-x-4">
            {/* 搜索 */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索作品..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent dark:text-white"
              />
            </div>

            {/* 视图切换 */}
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
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
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 作品统计 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">总浏览量</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {posts.reduce((sum, post) => sum + (post.view_count || 0), 0).toLocaleString()}
                </p>
              </div>
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">总点赞数</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {posts.reduce((sum, post) => sum + (post.likes_count || 0), 0).toLocaleString()}
                </p>
              </div>
              <Heart className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">总评论数</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {posts.reduce((sum, post) => sum + (post.comments_count || 0), 0).toLocaleString()}
                </p>
              </div>
              <MessageCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* 作品列表 */}
        {posts.length > 0 ? (
          <PostGrid
            posts={posts}
            loading={loading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onPostClick={handlePostClick}
          />
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Edit3 className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">暂无作品</h3>
            <p className="text-gray-500 dark:text-gray-400">该作者尚未发布任何作品</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthorProfile
