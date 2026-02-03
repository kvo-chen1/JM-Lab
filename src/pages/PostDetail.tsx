// 帖子详情页面 - Pinterest风格
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Share2, Bookmark, ArrowLeft, MoreHorizontal, Flag, Search, Home, Compass, Plus, User, Eye, Save } from 'lucide-react'
import LazyImage from '../components/LazyImage'
import { AuthorCard } from '../components/CreatorCommunity/AuthorCard'
import { CommentSection } from '../components/CreatorCommunity/CommentSection'
import postsApi, { Post } from '../services/postService'
import { useCommunityStore, useLikeStatus } from '../stores/communityStore'
import type { CommentWithAuthor, UserProfile } from '../lib/supabase'

interface PostDetailProps {
  currentUser?: UserProfile
}

export const PostDetail: React.FC<PostDetailProps> = ({ currentUser: propUser }) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentUser: storeUser, toggleLike: storeToggleLike, setLikedPosts } = useCommunityStore()
  
  const currentUser = propUser || storeUser
  
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [localLikesCount, setLocalLikesCount] = useState(0)
  const [recommendedPosts, setRecommendedPosts] = useState<Post[]>([])
  const [leftRecommendedPosts, setLeftRecommendedPosts] = useState<Post[]>([])
  
  const { isLiked, toggleLike } = useLikeStatus(id || '')
  
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  // 加载帖子详情和推荐作品
  useEffect(() => {
    const loadPost = async () => {
      if (!id) return

      try {
        setLoading(true)
        // 从 postsApi 获取帖子数据
        const allPosts = await postsApi.getPosts()
        const postData = allPosts.find(p => p.id === id)

        if (postData) {
          setPost(postData)
          setLocalLikesCount(postData.likes || 0)
          setComments([]) // 使用帖子自带的评论数据
          setIsBookmarked(postData.isBookmarked || false)
          
          // 同步点赞状态到 store
          if (postData.isLiked) {
            const currentLiked = useCommunityStore.getState().likedPosts
            if (!currentLiked.has(id)) {
                const newSet = new Set(currentLiked)
                newSet.add(id)
                useCommunityStore.setState({ likedPosts: newSet })
            }
          }
        }

        // 获取推荐作品（排除当前帖子）
        const recommended = allPosts.filter(p => p.id !== id).slice(0, 16)
        // 分成左右两部分推荐
        setRecommendedPosts(recommended.slice(0, 8))
        setLeftRecommendedPosts(recommended.slice(8, 16))
      } catch (error) {
        console.error('加载帖子详情失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [id])

  // 处理点赞
  const handleLike = async () => {
    if (!id) return

    try {
      // 乐观更新本地计数
      setLocalLikesCount(prev => isLiked ? prev - 1 : prev + 1)
      
      // 使用 postsApi 进行点赞操作
      if (isLiked) {
        await postsApi.unlikePost(id)
      } else {
        await postsApi.likePost(id)
      }
      
      // 更新本地帖子状态
      const updatedPost = await postsApi.getPosts().then(posts => posts.find(p => p.id === id))
      if (updatedPost) {
        setPost(updatedPost)
        setLocalLikesCount(updatedPost.likes || 0)
      }
      
    } catch (error) {
      console.error('点赞操作失败:', error)
      // 回滚
      setLocalLikesCount(prev => isLiked ? prev + 1 : prev - 1)
    }
  }

  // 处理添加评论
  const handleAddComment = async (content: string, parentId?: string) => {
    if (!id) return

    try {
      const updatedPost = await postsApi.addComment(id, content, parentId)
      if (updatedPost) {
        setPost(updatedPost)
      }
    } catch (error) {
      console.error('添加评论失败:', error)
    }
  }

  // 处理点赞评论
  const handleLikeComment = async (commentId: string) => {
    // 这里可以实现评论点赞逻辑
    console.log('点赞评论:', commentId)
  }

  // 处理分享
  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content.substring(0, 100),
          url: window.location.href
        })
      } catch (error) {
        console.error('分享失败:', error)
      }
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href)
      alert('链接已复制到剪贴板')
    }
  }

  // 处理收藏
  const handleBookmark = async () => {
    if (!id) return

    try {
      // 乐观更新本地状态
      setIsBookmarked(!isBookmarked)
      
      // 使用 postsApi 进行收藏操作
      if (isBookmarked) {
        await postsApi.unbookmarkPost(id)
      } else {
        await postsApi.bookmarkPost(id)
      }
      
      // 更新本地帖子状态
      const updatedPost = await postsApi.getPosts().then(posts => posts.find(p => p.id === id))
      if (updatedPost) {
        setPost(updatedPost)
        setIsBookmarked(updatedPost.isBookmarked || false)
      }
    } catch (error) {
      console.error('收藏操作失败:', error)
      // 回滚
      setIsBookmarked(!isBookmarked)
    }
  }

  // 处理作者点击
  const handleAuthorClick = () => {
    if (post && post.author) {
      if (typeof post.author === 'object' && post.author.id) {
        navigate(`/author/${post.author.id}`)
      } else if (typeof post.author === 'string') {
        navigate(`/author/${post.author}`)
      }
    }
  }

  // 处理返回
  const handleBack = () => {
    navigate(-1)
  }

  // 骨架屏
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          {/* 返回按钮 */}
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-gray-200 rounded-full mr-3" />
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>

          {/* 标题 */}
          <div className="h-8 bg-gray-200 rounded mb-4 w-3/4" />

          {/* 作者信息 */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gray-200 rounded-full" />
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
              <div className="h-3 bg-gray-200 rounded w-32" />
            </div>
          </div>

          {/* 内容 */}
          <div className="space-y-3 mb-8">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>

          {/* 互动按钮 */}
          <div className="flex items-center space-x-6 mb-8">
            <div className="h-8 bg-gray-200 rounded w-20" />
            <div className="h-8 bg-gray-200 rounded w-20" />
            <div className="h-8 bg-gray-200 rounded w-20" />
          </div>

          {/* 评论区 */}
          <div className="border-t pt-8">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
            <div className="space-y-4">
              <div className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="text-gray-400 mb-4">
          <MessageCircle className="w-16 h-16 mx-auto mb-4" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">帖子不存在</h2>
        <p className="text-gray-500 mb-6">您访问的帖子可能已被删除或不存在</p>
        <button
          onClick={handleBack}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          返回
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航栏 - Pinterest风格 */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          {/* 左侧导航 */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleBack} 
              className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200"
              title="返回"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="font-bold text-xl text-red-500">Pinterest</div>
          </div>
          
          {/* 右侧保存按钮 */}
          <div>
            <button className="px-4 py-1.5 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors flex items-center space-x-1">
              <Save className="w-4 h-4" />
              <span>保存</span>
            </button>
          </div>
        </div>
      </header>

      {/* 主要内容 - 左右布局 */}
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左侧：帖子详情 */}
          <div className="lg:w-1/2">
            {/* 帖子卡片 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              {/* 作者信息 */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img 
                    src={currentUser?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'} 
                    alt="作者头像"
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{currentUser?.username || currentUser?.email?.split('@')[0] || '我'}</h3>
                    <p className="text-xs text-gray-500">{new Date(post.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-all duration-200"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* 图片内容 */}
              {post.thumbnail && (
                <div className="w-full overflow-hidden">
                  <LazyImage
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-full object-cover"
                    placeholder="blur"
                  />
                </div>
              )}

              {/* 操作按钮栏 */}
              <div className="p-4 flex items-center space-x-4 border-t border-gray-100">
                <button 
                  onClick={handleLike}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                    isLiked
                      ? 'bg-red-100 text-red-500'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="点赞"
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </button>
                
                <button 
                  className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 text-gray-600 transition-all duration-300"
                  title="评论"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
                
                <button 
                  onClick={handleShare}
                  className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 text-gray-600 transition-all duration-300"
                  title="分享"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                
                <div className="flex-1"></div>
                
                <button 
                  onClick={handleBookmark}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                    isBookmarked
                      ? 'bg-red-100 text-red-500'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="收藏"
                >
                  <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* 帖子信息 */}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 leading-tight">{post.title}</h2>
                
                {/* 标签 */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-200 transition-all duration-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* 统计信息 */}
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{post.views || 0} 次浏览</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Heart className="w-3.5 h-3.5" />
                    <span>{localLikesCount} 人喜欢</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{post.shares || 0} 次分享</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 评论区 */}
            <div className="bg-white rounded-xl shadow-sm mb-6">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">评论 ({post.commentCount || post.comments.length || 0})</h3>
              </div>
              
              <div className="p-4">
                {/* 评论输入框 */}
                <div className="flex space-x-3 mb-6">
                  <img 
                    src={currentUser?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'} 
                    alt="你的头像"
                    className="w-9 h-9 rounded-full object-cover border border-gray-200"
                  />
                  <input 
                    type="text" 
                    placeholder="添加评论..."
                    className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all duration-200"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        handleAddComment(e.currentTarget.value.trim())
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                </div>
                
                {/* 评论列表 */}
                {post.comments.length > 0 ? (
                  <div className="space-y-5">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        <img 
                          src={currentUser?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'} 
                          alt="评论者头像"
                          className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        />
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-semibold text-gray-900 text-sm">{currentUser?.username || currentUser?.email?.split('@')[0] || '我'}</span>
                              <span className="text-xs text-gray-500">{new Date(comment.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
                          </div>
                          <div className="flex items-center space-x-4 mt-1.5">
                            <button className="text-xs text-gray-500 hover:text-red-500 font-medium transition-colors">赞 ({comment.likes})</button>
                            <button className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors">回复</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-lg">
                    <MessageCircle className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm font-medium">暂无评论，快来抢沙发吧！</p>
                  </div>
                )}
              </div>
            </div>

            {/* 左侧底部：推荐作品瀑布流 */}
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">你可能喜欢的作品</h3>
              <div className="grid grid-cols-3 gap-2">
                {leftRecommendedPosts.map((recommendedPost, index) => (
                  <div 
                    key={recommendedPost.id} 
                    className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                    onClick={() => navigate(`/post/${recommendedPost.id}`)}
                    style={{
                      gridRowEnd: index % 3 === 0 ? 'span 2' : 'span 1',
                      height: 'auto'
                    }}
                  >
                    <img 
                      src={recommendedPost.thumbnail} 
                      alt={recommendedPost.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：推荐作品瀑布流 */}
          <div className="lg:w-1/2">
            <div className="sticky top-20">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">推荐作品集</h3>
              <div className="grid grid-cols-2 gap-2">
                {recommendedPosts.map((recommendedPost, index) => (
                  <div 
                    key={recommendedPost.id} 
                    className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] cursor-pointer relative"
                    onClick={() => navigate(`/post/${recommendedPost.id}`)}
                    style={{
                      gridRowEnd: index % 2 === 0 ? 'span 2' : 'span 1',
                      height: 'auto'
                    }}
                  >
                    <img 
                      src={recommendedPost.thumbnail} 
                      alt={recommendedPost.title}
                      className="w-full h-full object-cover"
                    />
                    {/* 右上角保存按钮 */}
                    <div className="absolute top-2 right-2">
                      <button className="bg-white/80 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center hover:bg-white transition-colors">
                        <Save className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PostDetail
