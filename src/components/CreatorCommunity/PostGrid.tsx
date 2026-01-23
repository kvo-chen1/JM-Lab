// 创作者社区帖子列表组件
import React, { useState, useEffect, useCallback } from 'react'
import { Heart, MessageCircle, Eye, Grid, List } from 'lucide-react'
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
  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAuthorClick?.(post.author_id)
  }

  if (viewMode === 'grid') {
    return (
      <div 
        className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:animate-bounce active:scale-95 cursor-pointer overflow-hidden group"
        onClick={handlePostClick}
      >
        {/* 图片区域 */}
        <div className="aspect-video bg-gray-100 relative overflow-hidden">
          <LazyImage
            src={post.attachments?.[0]?.url || 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=现代创意社区背景图，抽象艺术风格，渐变色彩&image_size=landscape_16_9'}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            placeholder="blur"
          />
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
  return (
    <div 
      className="bg-white rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer p-4 group active:scale-98"
      onClick={handlePostClick}
    >
      <div className="flex space-x-4">
        {/* 图片缩略图 */}
        <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
          <LazyImage
            src={post.attachments?.[0]?.url || 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=现代创意社区缩略图，简洁设计&image_size=square'}
            alt={post.title}
            className="w-full h-full object-cover"
            placeholder="blur"
          />
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
      {/* 视图切换和筛选 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          共 {posts.length} 条内容
        </div>
        
        {/* 视图模式切换 */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleViewModeChange('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="网格视图"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleViewModeChange('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="列表视图"
          >
            <List className="w-4 h-4" />
          </button>
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
