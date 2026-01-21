// 作者主页
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
  MessageCircle
} from 'lucide-react'
import LazyImage from '../components/LazyImage'
import { PostGrid } from '../components/CreatorCommunity/PostGrid'
import { getUserProfile, getUserPosts, toggleFollow, checkUserFollowing } from '../lib/api'
import type { UserProfile, PostWithAuthor } from '../lib/supabase'

interface AuthorProfileProps {
  currentUser?: UserProfile
}

export const AuthorProfile: React.FC<AuthorProfileProps> = ({ currentUser }) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [author, setAuthor] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
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
        const [authorData, following] = await Promise.all([
          getUserProfile(id),
          currentUser ? checkUserFollowing(id) : Promise.resolve(false)
        ])

        if (authorData) {
          setAuthor(authorData)
          setIsFollowing(following)

          // 加载作者帖子
          const postsData = await getUserPosts(id)
          setPosts(postsData.posts)
        }
      } catch (error) {
        console.error('加载作者信息失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAuthor()
  }, [id, currentUser])

  // 处理关注/取消关注
  const handleFollow = async () => {
    if (!id || !currentUser) return

    try {
      const action = isFollowing ? 'unfollow' : 'follow'
      const success = await toggleFollow(id, action)
      
      if (success) {
        setIsFollowing(!isFollowing)
        // 更新粉丝数
        setAuthor(prev => prev ? {
          ...prev,
          followers_count: (prev.followers_count || 0) + (isFollowing ? -1 : 1)
        } : null)
      }
    } catch (error) {
      console.error('关注操作失败:', error)
    }
  }

  // 处理帖子点击
  const handlePostClick = (post: PostWithAuthor) => {
    navigate(`/post/${post.id}`)
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
      alert('链接已复制到剪贴板')
    }
  }

  // 处理私信
  const handleMessage = () => {
    // 这里可以实现私信功能
    alert('私信功能开发中...')
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-6">
            {/* 头像 */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <LazyImage
                  src={author.avatar_url || 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=默认用户头像，简洁现代风格&image_size=square'}
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
                <h1 className="text-3xl font-bold text-gray-900">{author.username}</h1>
                {author.is_verified && (
                  <div className="flex items-center space-x-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    <Award className="w-4 h-4" />
                    <span>认证创作者</span>
                  </div>
                )}
              </div>

              {author.bio && (
                <p className="text-gray-600 text-lg mb-4 leading-relaxed">
                  {author.bio}
                </p>
              )}

              {/* 统计信息 */}
              <div className="flex items-center space-x-8 text-sm text-gray-500 mb-6">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{author.followers_count || 0} 粉丝</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{author.following_count || 0} 关注</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Edit3 className="w-4 h-4" />
                  <span>{author.posts_count || 0} 作品</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>加入于 {new Date(author.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center space-x-4">
                {currentUser?.id !== author.id ? (
                  <>
                    <button
                      onClick={handleFollow}
                      className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                        isFollowing
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {isFollowing ? '已关注' : '关注'}
                    </button>
                    <button
                      onClick={handleMessage}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors font-medium"
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
                  className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* 联系信息 */}
          <div className="space-y-2 text-sm text-gray-600">
            {author.metadata?.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{author.metadata.location}</span>
              </div>
            )}
            {author.metadata?.website && (
              <div className="flex items-center space-x-2">
                <LinkIcon className="w-4 h-4" />
                <a 
                  href={author.metadata.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  {author.metadata.website}
                </a>
              </div>
            )}
            {author.metadata?.email && (
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <a 
                  href={`mailto:${author.metadata.email}`}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {author.metadata.email}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 作品展示区域 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        {/* 作品头部 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">作品集</h2>
          
          <div className="flex items-center space-x-4">
            {/* 搜索 */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索作品..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 筛选 */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部作品</option>
              <option value="popular">最受欢迎</option>
              <option value="recent">最新发布</option>
            </select>

            {/* 视图切换 */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 作品统计 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">总浏览量</p>
                <p className="text-2xl font-bold text-blue-900">
                  {posts.reduce((sum, post) => sum + post.view_count, 0).toLocaleString()}
                </p>
              </div>
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">总点赞数</p>
                <p className="text-2xl font-bold text-red-900">
                  {posts.reduce((sum, post) => sum + (post.likes_count || 0), 0).toLocaleString()}
                </p>
              </div>
              <Heart className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">总评论数</p>
                <p className="text-2xl font-bold text-green-900">
                  {posts.reduce((sum, post) => sum + (post.comments_count || 0), 0).toLocaleString()}
                </p>
              </div>
              <MessageCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* 作品列表 */}
        <PostGrid
          posts={posts}
          loading={loading}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onPostClick={handlePostClick}
        />
      </div>
    </div>
  )
}

export default AuthorProfile
