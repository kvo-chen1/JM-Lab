// 津脉社区评论组件
import React, { useState, useEffect } from 'react'
import { Heart, MessageCircle, Send, MoreVertical, Flag, Trash2 } from 'lucide-react'
import LazyImage from '../LazyImage'
import type { CommentWithAuthor, UserProfile } from '../../lib/supabase'

interface CommentSectionProps {
  postId: string
  comments: CommentWithAuthor[]
  currentUser?: UserProfile
  onAddComment: (content: string, parentId?: string) => Promise<void>
  onLikeComment: (commentId: string) => Promise<void>
  onDeleteComment?: (commentId: string) => Promise<void>
  onReportComment?: (commentId: string) => Promise<void>
  loading?: boolean
}

// 单个评论组件
const CommentItem: React.FC<{
  comment: CommentWithAuthor
  currentUser?: UserProfile
  onReply: (commentId: string) => void
  onLike: (commentId: string) => void
  onAddComment: (content: string, parentId: string) => void
  onDelete?: (commentId: string) => Promise<void>
  onReport?: (commentId: string) => Promise<void>
  depth?: number
}> = ({ 
  comment, 
  currentUser, 
  onReply, 
  onLike, 
  onAddComment,
  onDelete, 
  onReport,
  depth = 0 
}) => {
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [showMenu, setShowMenu] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')

  useEffect(() => {
    // 这里可以添加检查用户是否点赞的逻辑
    setLikesCount(0) // 默认值，实际应该从API获取
  }, [comment.id])

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1)
    onLike(comment.id)
  }

  const handleReply = () => {
    onReply(comment.id)
    setShowReplyForm(true)
  }

  const handleSubmitReply = () => {
    if (replyContent.trim()) {
      onAddComment(replyContent, comment.id)
      setReplyContent('')
      setShowReplyForm(false)
    }
  }

  const isOwnComment = currentUser?.id === comment.author_id

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className="flex space-x-3 mb-4">
        {/* 头像 */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
            <LazyImage
              src={comment.author.avatar_url || 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=默认用户头像，简洁现代风格&image_size=square'}
              alt={comment.author.username}
              className="w-full h-full object-cover"
              placeholder="blur"
            />
          </div>
        </div>

        {/* 评论内容 */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg p-3">
            {/* 评论头部 */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 text-sm">
                  {comment.author.username}
                </span>
                {comment.author.is_verified && (
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <span className="text-gray-500 text-xs">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>

              {/* 更多菜单 */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-8 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    {isOwnComment ? (
                      <button
                        onClick={() => {
                          onDelete?.(comment.id)
                          setShowMenu(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>删除</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onReport?.(comment.id)
                          setShowMenu(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Flag className="w-4 h-4" />
                        <span>举报</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 评论内容 */}
            <p className="text-gray-800 text-sm mb-2 leading-relaxed">
              {comment.content}
            </p>

            {/* 评论操作 */}
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 hover:text-red-500 transition-colors ${
                  isLiked ? 'text-red-500' : ''
                }`}
              >
                <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likesCount}</span>
              </button>
              <button
                onClick={handleReply}
                className="flex items-center space-x-1 hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                <span>回复</span>
              </button>
            </div>
          </div>

          {/* 回复表单 */}
          {showReplyForm && (
            <div className="mt-3 ml-11">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="写下你的回复..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmitReply()
                    }
                  }}
                />
                <button
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim()}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 子评论 */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUser={currentUser}
                  onReply={onReply}
                  onLike={onLike}
                  onAddComment={onAddComment}
                  onDelete={onDelete}
                  onReport={onReport}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 评论输入组件
const CommentInput: React.FC<{
  onSubmit: (content: string) => Promise<void>
  placeholder?: string
  loading?: boolean
}> = ({ onSubmit, placeholder = '写下你的评论...', loading = false }) => {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmit(content.trim())
      setContent('')
    } catch (error) {
      console.error('发表评论失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex space-x-3">
      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          disabled={loading || isSubmitting}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
        />
      </div>
      <div className="flex-shrink-0">
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || loading || isSubmitting}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? '发表中...' : '发表'}</span>
        </button>
      </div>
    </div>
  )
}

// 主评论组件
export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  comments,
  currentUser,
  onAddComment,
  onLikeComment,
  onDeleteComment,
  onReportComment,
  loading = false
}) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const handleAddComment = async (content: string, parentId?: string) => {
    await onAddComment(content, parentId)
    setReplyingTo(null)
  }

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6">
        {/* 评论头部 */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            评论 ({comments.length})
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <MessageCircle className="w-4 h-4" />
            <span>最新评论</span>
          </div>
        </div>

        {/* 评论输入 */}
        {currentUser && (
          <div className="mb-6">
            <div className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                  <LazyImage
                    src={currentUser.avatar_url || 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=默认用户头像，简洁现代风格&image_size=square'}
                    alt={currentUser.username}
                    className="w-full h-full object-cover"
                    placeholder="blur"
                  />
                </div>
              </div>
              <div className="flex-1">
                <CommentInput
                  onSubmit={(content) => handleAddComment(content)}
                  placeholder="写下你的评论..."
                  loading={loading}
                />
              </div>
            </div>
          </div>
        )}

        {/* 评论列表 */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">还没有评论，快来发表第一条评论吧！</p>
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUser={currentUser}
                onReply={handleReply}
                onLike={onLikeComment}
                onAddComment={handleAddComment}
                onDelete={onDeleteComment}
                onReport={onReportComment}
              />
            ))
          )}
        </div>

        {/* 加载更多 */}
        {comments.length > 0 && (
          <div className="text-center mt-6">
            <button className="px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
              加载更多评论
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CommentSection
