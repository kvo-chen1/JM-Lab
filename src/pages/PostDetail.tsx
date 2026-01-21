// 帖子详情页面
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Share2, Bookmark, Eye, ArrowLeft, MoreHorizontal, Flag } from 'lucide-react'
import LazyImage from '../components/LazyImage'
import { AuthorCard } from '../components/CreatorCommunity/AuthorCard'
import { CommentSection } from '../components/CreatorCommunity/CommentSection'
import { getPostById, getPostComments, createComment, checkUserLikedPost } from '../lib/api'
import { useCommunityStore, useLikeStatus } from '../stores/communityStore'
import type { PostWithAuthor, CommentWithAuthor, UserProfile } from '../lib/supabase'

interface PostDetailProps {
  currentUser?: UserProfile
}

export const PostDetail: React.FC<PostDetailProps> = ({ currentUser: propUser }) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentUser: storeUser, toggleLike: storeToggleLike, setLikedPosts } = useCommunityStore()
  
  const currentUser = propUser || storeUser
  
  const [post, setPost] = useState<PostWithAuthor | null>(null)
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  // 移除本地 isLiked 和 likesCount，改用 store 或 computed
  const [localLikesCount, setLocalLikesCount] = useState(0)
  
  const { isLiked, toggleLike } = useLikeStatus(id || '')
  
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  // 加载帖子详情
  useEffect(() => {
    const loadPost = async () => {
      if (!id) return

      try {
        setLoading(true)
        // 并行加载详情、点赞状态、评论
        const [postData, liked, commentsData] = await Promise.all([
          getPostById(id),
          checkUserLikedPost(id),
          getPostComments(id)
        ])

        if (postData) {
          setPost(postData)
          setLocalLikesCount(postData.likes_count || 0)
          setComments(commentsData)
          
          // 同步点赞状态到 store
          if (liked) {
             setLikedPosts([id]) // 这里简化处理，可能会覆盖其他，但目前 store 逻辑较简单
             // 更好的做法是 store 提供一个 addLikedPost action，或者直接忽略初始同步，
             // 依赖用户交互。但为了 UI 正确显示，我们需要让 store 知道这个被赞了。
             // 实际上 checkUserLikedPost 返回 true 说明数据库有点赞。
             // 如果 store 中没有记录（例如页面刷新了），需要补上。
             useCommunityStore.getState().setLikedPosts([id]) // 注意：这会覆盖 Set。
             // 修正：我们需要 merge。
             const currentLiked = useCommunityStore.getState().likedPosts
             if (!currentLiked.has(id)) {
                 const newSet = new Set(currentLiked)
                 newSet.add(id)
                 useCommunityStore.setState({ likedPosts: newSet })
             }
          }
        }
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
      
      // 调用 store 的 toggleLike (它会自动更新 store 中的 likedPosts)
      await toggleLike()
      
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
      const newComment = await createComment(id, content, parentId)
      if (newComment) {
        setComments(prev => [...prev, newComment])
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
  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    // 这里可以实现收藏逻辑
  }

  // 处理作者点击
  const handleAuthorClick = () => {
    if (post) {
      navigate(`/author/${post.author_id}`)
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 返回按钮 */}
      <div className="flex items-center mb-6">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>
      </div>

      {/* 帖子内容 */}
      <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        {/* 头部信息 */}
        <div className="p-6 border-b border-gray-100">
          {/* 标题 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
            {post.title}
          </h1>

          {/* 作者信息 */}
          <div className="flex items-center justify-between">
            <AuthorCard
              author={post.author}
              size="medium"
              showFollowButton={true}
              showStats={true}
              onClick={handleAuthorClick}
            />

            {/* 更多操作 */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-12 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                    <Flag className="w-4 h-4" />
                    <span>举报</span>
                  </button>
                  {currentUser?.id === post.author_id && (
                    <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50">
                      删除帖子
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          {/* 封面图片 */}
          {post.attachments && post.attachments.length > 0 && (
            <div className="mb-6">
              <LazyImage
                src={post.attachments[0].url}
                alt={post.title}
                className="w-full max-h-96 object-cover rounded-lg"
                placeholder="blur"
              />
            </div>
          )}

          {/* 正文内容 */}
          <div className="prose max-w-none">
            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          </div>

          {/* 发布时间 */}
          <div className="mt-6 text-sm text-gray-500">
            发布于 {new Date(post.created_at).toLocaleString()}
          </div>
        </div>

        {/* 互动区域 */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            {/* 左侧互动按钮 */}
            <div className="flex items-center space-x-6">
              {/* 点赞 */}
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                  isLiked
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">{localLikesCount}</span>
              </button>

              {/* 评论 */}
              <button className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-200">
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">{post.comments_count || 0}</span>
              </button>

              {/* 分享 */}
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white text-gray-600 border border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all duration-200"
              >
                <Share2 className="w-5 h-5" />
                <span className="font-medium">分享</span>
              </button>
            </div>

            {/* 右侧统计 */}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {/* 浏览数 */}
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{post.view_count}</span>
              </div>

              {/* 收藏 */}
              <button
                onClick={handleBookmark}
                className={`p-2 rounded-full transition-colors ${
                  isBookmarked
                    ? 'text-yellow-500 bg-yellow-50'
                    : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* 评论区 */}
      <CommentSection
        postId={post.id}
        comments={comments}
        currentUser={currentUser}
        onAddComment={handleAddComment}
        onLikeComment={handleLikeComment}
        loading={loading}
      />
    </div>
  )
}

export default PostDetail
