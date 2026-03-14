// 津脉社区帖子列表组件
import React, { useState } from 'react'
import { Heart, MessageCircle, Eye, Grid } from 'lucide-react'
import LazyImage from '../LazyImage'
import { AuthorCard } from './AuthorCard'
import type { PostWithAuthor } from '../../lib/supabase'

interface PostGridProps {
  posts: PostWithAuthor[]
  loading?: boolean
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
  onPostClick?: (post: PostWithAuthor) => void
  onLikeClick?: (post: PostWithAuthor) => void
  onAuthorClick?: (authorId: string) => void
}

// 帖子卡片组件
const PostCard: React.FC<{
  post: PostWithAuthor
  viewMode: 'grid' | 'list'
  onPostClick?: (post: PostWithAuthor) => void
  onLikeClick?: (post: PostWithAuthor) => void
  onAuthorClick?: (authorId: string) => void
}> = ({ post, viewMode, onPostClick, onLikeClick, onAuthorClick }) => {
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)

  // 处理点赞点击
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newLiked = !isLiked
    setIsLiked(newLiked)
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1)
    onLikeClick?.(post)
  }

  // 处理帖子点击
  const handlePostClick = () => {
    onPostClick?.(post)
  }

  // 处理作者点击
  const handleAuthorClick = () => {
    onAuthorClick?.(post.user_id || post.author_id || post.author?.id)
  }

  if (viewMode === 'grid') {
    // 判断是否为视频 - 使用 post.type 字段或 attachments/video_url
    const isVideo = post.type === 'video' || post.attachments?.[0]?.type === 'video' || post.video_url;
    const mediaUrl = post.attachments?.[0]?.url || post.video_url || post.thumbnail || post.cover_url;
    
    return (
      <div 
        className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:animate-bounce active:scale-95 cursor-pointer overflow-hidden group"
        onClick={handlePostClick}
      >
        {/* 媒体区域（图片或视频） */}
        <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
          {isVideo ? (
            <video
              src={mediaUrl}
              className="w-full h-full object-cover"
              muted
              loop
              autoPlay
              playsInline
              preload="metadata"
            />
          ) : (
            <LazyImage
              src={mediaUrl || 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=现代创意社区背景图，抽象艺术风格，渐变色彩&image_size=landscape_16_9'}
              alt={post.title}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              placeholder="blur"
            />
          )}
          {/* 视频标签 */}
          {isVideo && (
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              视频
            </div>
          )}
          {/* 悬停遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>

        {/* 内容区域 */}
        <div className="p-4">
          {/* 标题 */}
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
            {post.title}
          </h3>

          {/* 内容摘要 */}
          <p className="text-gray-600 text-xs line-clamp-2 mb-3">
            {post.content.substring(0, 100)}...
          </p>

          {/* 作者信息 */}
          <div className="flex items-center justify-between mb-3">
            <AuthorCard
              author={post.author}
              size="small"
              onClick={handleAuthorClick}
            />
          </div>

          {/* 互动数据 */}
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <div className="flex items-center space-x-4">
              {/* 点赞 */}
              <button
                onClick={handleLikeClick}
                className={`flex items-center space-x-1 hover:text-red-500 transition-colors ${
                  isLiked ? 'text-red-500' : ''
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likesCount}</span>
              </button>

              {/* 评论 */}
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>{post.comments_count || 0}</span>
              </div>

              {/* 浏览 */}
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{post.view_count}</span>
              </div>
            </div>

            {/* 时间 */}
            <span className="text-gray-400">
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // 列表视图
  // 判断是否为视频
  const isVideoList = post.type === 'video' || post.attachments?.[0]?.type === 'video' || post.video_url;
  const mediaUrlList = post.attachments?.[0]?.url || post.video_url || post.thumbnail || post.cover_url;
  
  return (
    <div 
      className="bg-white rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer p-4 group active:scale-98"
      onClick={handlePostClick}
    >
      <div className="flex space-x-4">
        {/* 媒体缩略图（图片或视频） */}
        <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden relative">
          {isVideoList ? (
            <>
              <video
                src={mediaUrlList}
                className="w-full h-full object-cover"
                muted
                loop
                autoPlay
                playsInline
                preload="metadata"
              />
              {/* 视频标签 */}
              <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
                视频
              </div>
            </>
          ) : (
            <LazyImage
              src={mediaUrlList || 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=现代创意社区缩略图，简洁设计&image_size=square'}
              alt={post.title}
              className="w-full h-full object-cover"
              placeholder="blur"
            />
          )}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 min-w-0">
          {/* 标题 */}
          <h3 className="font-semibold text-gray-900 text-base leading-tight mb-2 group-hover:text-blue-600 transition-colors">
            {post.title}
          </h3>

          {/* 内容摘要 */}
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {post.content.substring(0, 150)}...
          </p>

          {/* 作者信息 */}
          <div className="flex items-center justify-between mb-2">
            <AuthorCard
              author={post.author}
              size="small"
              onClick={handleAuthorClick}
            />
          </div>

          {/* 互动数据 */}
          <div className="flex items-center justify-between text-gray-500 text-sm">
            <div className="flex items-center space-x-6">
              {/* 点赞 */}
              <button
                onClick={handleLikeClick}
                className={`flex items-center space-x-1 hover:text-red-500 transition-colors ${
                  isLiked ? 'text-red-500' : ''
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likesCount}</span>
              </button>

              {/* 评论 */}
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>{post.comments_count || 0}</span>
              </div>

              {/* 浏览 */}
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{post.view_count}</span>
              </div>
            </div>

            {/* 时间 */}
            <span className="text-gray-400 text-xs">
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// 骨架屏组件
const PostSkeleton: React.FC<{ viewMode: 'grid' | 'list' }> = ({ viewMode }) => {
  if (viewMode === 'grid') {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse break-inside-avoid mb-6">
        <div className="aspect-video bg-gray-200" />
        <div className="p-4">
          <div className="h-4 bg-gray-200 rounded mb-2" />
          <div className="h-3 bg-gray-200 rounded mb-3 w-3/4" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-3 bg-gray-200 rounded w-8" />
              <div className="h-3 bg-gray-200 rounded w-8" />
              <div className="h-3 bg-gray-200 rounded w-8" />
            </div>
            <div className="h-3 bg-gray-200 rounded w-12" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
      <div className="flex space-x-4">
        <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-lg" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
          <div className="h-3 bg-gray-200 rounded mb-2 w-full" />
          <div className="h-3 bg-gray-200 rounded mb-3 w-5/6" />
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="h-3 bg-gray-200 rounded w-8" />
              <div className="h-3 bg-gray-200 rounded w-8" />
              <div className="h-3 bg-gray-200 rounded w-8" />
            </div>
            <div className="h-3 bg-gray-200 rounded w-12" />
          </div>
        </div>
      </div>
    </div>
  )
}

// 主组件
export const PostGrid: React.FC<PostGridProps> = ({
  posts,
  loading = false,
  viewMode: externalViewMode,
  onViewModeChange,
  onPostClick,
  onLikeClick,
  onAuthorClick
}) => {
  const [internalViewMode, setInternalViewMode] = useState<'grid' | 'list'>('grid')
  const viewMode = externalViewMode ?? internalViewMode

  // 处理视图模式切换
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setInternalViewMode(mode)
    onViewModeChange?.(mode)
  }

  // 生成骨架屏
  const skeletonPosts = Array.from({ length: 6 }, (_, i) => (
    <PostSkeleton key={`skeleton-${i}`} viewMode={viewMode} />
  ))

  if (loading) {
    return (
      <div className="space-y-6">
        {/* 视图切换按钮 */}
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* 骨架屏列表 */}
        <div className={viewMode === 'grid' 
          ? 'columns-1 md:columns-2 lg:columns-3 gap-6'
          : 'space-y-4'
        }>
          {skeletonPosts}
        </div>
      </div>
    )
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Grid className="w-12 h-12 mx-auto mb-4" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无内容</h3>
        <p className="text-gray-500">还没有发布任何内容，快来创建第一个帖子吧！</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 内容统计 */}
      <div className="flex items-center">
        <div className="text-sm text-gray-600">
          共 {posts.length} 条内容
        </div>
      </div>

      {/* 帖子列表 */}
      <div className={viewMode === 'grid' 
        ? 'columns-2 md:columns-2 lg:columns-3 gap-3 md:gap-6'
        : 'space-y-4'
      }>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            viewMode={viewMode}
            onPostClick={onPostClick}
            onLikeClick={onLikeClick}
            onAuthorClick={onAuthorClick}
          />
        ))}
      </div>
    </div>
  )
}

export default PostGrid
