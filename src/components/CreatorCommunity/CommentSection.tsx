// 津脉社区评论组件 - 优化版
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Send, MoreVertical, Flag, Trash2, CornerDownRight, Edit3, ChevronDown, ChevronUp } from 'lucide-react'
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
  onEditComment?: (commentId: string, content: string) => Promise<void>
  loading?: boolean
  maxDepth?: number
}

// 单个评论组件
const CommentItem: React.FC<{
  comment: CommentWithAuthor
  currentUser?: UserProfile
  onReply: (commentId: string, username: string) => void
  onLike: (commentId: string) => void
  onAddComment: (content: string, parentId: string) => void
  onDelete?: (commentId: string) => Promise<void>
  onReport?: (commentId: string) => Promise<void>
  onEdit?: (commentId: string, content: string) => Promise<void>
  depth?: number
  maxDepth?: number
  isLast?: boolean
}> = ({ 
  comment, 
  currentUser, 
  onReply, 
  onLike, 
  onAddComment,
  onDelete, 
  onReport,
  onEdit,
  depth = 0,
  maxDepth = 3,
  isLast = false
}) => {
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0)
  const [showMenu, setShowMenu] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [showReplies, setShowReplies] = useState(depth < 2)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLike = useCallback(() => {
    const newLiked = !isLiked
    setIsLiked(newLiked)
    setLikesCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1))
    onLike(comment.id)
  }, [isLiked, comment.id, onLike])

  const handleReply = useCallback(() => {
    onReply(comment.id, comment.author?.username || '用户')
    setShowReplyForm(true)
  }, [comment.id, comment.author?.username, onReply])

  const handleSubmitReply = useCallback(() => {
    if (replyContent.trim()) {
      onAddComment(replyContent, comment.id)
      setReplyContent('')
      setShowReplyForm(false)
    }
  }, [replyContent, comment.id, onAddComment])

  const handleEdit = useCallback(() => {
    if (isEditing && editContent.trim() && editContent !== comment.content) {
      onEdit?.(comment.id, editContent.trim())
    }
    setIsEditing(!isEditing)
    setShowMenu(false)
  }, [isEditing, editContent, comment.id, comment.content, onEdit])

  const handleDelete = useCallback(() => {
    if (confirm('确定要删除这条评论吗？')) {
      onDelete?.(comment.id)
    }
    setShowMenu(false)
  }, [comment.id, onDelete])

  const handleReport = useCallback(() => {
    onReport?.(comment.id)
    setShowMenu(false)
  }, [comment.id, onReport])

  const isOwnComment = currentUser?.id === comment.author_id
  const hasReplies = comment.replies && comment.replies.length > 0
  const canShowMoreReplies = depth < maxDepth && hasReplies

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${depth > 0 ? 'ml-4 md:ml-8' : ''}`}
    >
      <div className="flex space-x-3 py-3">
        {/* 头像 */}
        <div className="flex-shrink-0">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full overflow-hidden ring-2 ring-offset-1 ring-offset-white dark:ring-offset-gray-800 ring-transparent hover:ring-blue-300 transition-all cursor-pointer"
          >
            <LazyImage
              src={comment.author?.avatar_url || 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=默认用户头像，简洁现代风格&image_size=square'}
              alt={comment.author?.username || '用户'}
              className="w-full h-full object-cover"
              placeholder="blur"
            />
          </motion.div>
        </div>

        {/* 评论内容 */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl rounded-tl-sm px-4 py-3">
            {/* 评论头部 */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {comment.author?.username || '用户'}
                </span>
                {comment.author?.is_verified && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                )}
                <span className="text-gray-400 text-xs">
                  {new Date(comment.created_at).toLocaleString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {comment.is_edited && (
                  <span className="text-gray-400 text-xs">(已编辑)</span>
                )}
              </div>

              {/* 更多菜单 */}
              <div className="relative" ref={menuRef}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </motion.button>

                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-8 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20"
                    >
                      {isOwnComment ? (
                        <>
                          <button
                            onClick={handleEdit}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>{isEditing ? '保存' : '编辑'}</span>
                          </button>
                          <button
                            onClick={handleDelete}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>删除</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleReport}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                        >
                          <Flag className="w-4 h-4" />
                          <span>举报</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 评论内容 */}
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setIsEditing(false); setEditContent(comment.content); }}
                    className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={!editContent.trim()}
                    className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
            )}

            {/* 评论操作 */}
            <div className="flex items-center gap-4 mt-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLike}
                className={`flex items-center gap-1.5 text-xs transition-colors ${
                  isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likesCount > 0 && likesCount}</span>
              </motion.button>
              
              {depth < maxDepth && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReply}
                  className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>回复</span>
                </motion.button>
              )}
            </div>
          </div>

          {/* 回复表单 */}
          <AnimatePresence>
            {showReplyForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 ml-2"
              >
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`回复 @${comment.author?.username || '用户'}...`}
                      className="w-full pl-4 pr-12 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSubmitReply()
                        }
                      }}
                      autoFocus
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim()}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                        replyContent.trim() 
                          ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10' 
                          : 'text-gray-400'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </div>
                  <button
                    onClick={() => { setShowReplyForm(false); setReplyContent(''); }}
                    className="px-3 py-2 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 子评论 */}
          {hasReplies && canShowMoreReplies && (
            <div className="mt-2">
              <motion.button
                whileHover={{ x: 2 }}
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 mb-2"
              >
                {showReplies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>{showReplies ? '收起回复' : `查看 ${comment.replies!.length} 条回复`}</span>
              </motion.button>
              
              <AnimatePresence>
                {showReplies && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-l-2 border-gray-200 dark:border-gray-700 pl-2"
                  >
                    {comment.replies!.map((reply, index) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        currentUser={currentUser}
                        onReply={onReply}
                        onLike={onLike}
                        onAddComment={onAddComment}
                        onDelete={onDelete}
                        onReport={onReport}
                        onEdit={onEdit}
                        depth={depth + 1}
                        maxDepth={maxDepth}
                        isLast={index === comment.replies!.length - 1}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// 评论输入组件
const CommentInput: React.FC<{
  onSubmit: (content: string) => Promise<void>
  placeholder?: string
  loading?: boolean
  replyingTo?: { id: string; username: string } | null
  onCancelReply?: () => void
}> = ({ onSubmit, placeholder = '写下你的评论...', loading = false, replyingTo, onCancelReply }) => {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [replyingTo])

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmit(content.trim())
      setContent('')
      onCancelReply?.()
    } catch (error) {
      console.error('发表评论失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      {replyingTo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
        >
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <CornerDownRight className="w-4 h-4" />
            <span>回复 @{replyingTo.username}</span>
          </div>
          <button
            onClick={onCancelReply}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <i className="fas fa-times"></i>
          </button>
        </motion.div>
      )}
      
      <div className="flex gap-3">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={replyingTo ? `回复 @${replyingTo.username}...` : placeholder}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder-gray-400"
            rows={3}
            disabled={loading || isSubmitting}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.metaKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
            <span>按 Cmd + Enter 快速发送</span>
            <span>{content.length}/500</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!content.trim() || loading || isSubmitting}
            className="px-5 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg shadow-blue-500/30"
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>
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
  onEditComment,
  loading = false,
  maxDepth = 3
}) => {
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest')

  const handleAddComment = async (content: string, parentId?: string) => {
    await onAddComment(content, parentId)
    setReplyingTo(null)
  }

  const handleReply = (commentId: string, username: string) => {
    setReplyingTo({ id: commentId, username })
  }

  const sortedComments = React.useMemo(() => {
    const sorted = [...comments]
    switch (sortBy) {
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      case 'popular':
        return sorted.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
  }, [comments, sortBy])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-5 md:p-6">
        {/* 评论头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              评论
            </h3>
            <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-full">
              {comments.length}
            </span>
          </div>
          
          {/* 排序选项 */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { id: 'newest', label: '最新' },
              { id: 'oldest', label: '最早' },
              { id: 'popular', label: '热门' },
            ].map(option => (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  sortBy === option.id
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 评论输入 */}
        {currentUser && (
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full overflow-hidden">
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
                  onSubmit={(content) => handleAddComment(content, replyingTo?.id)}
                  placeholder="分享你的想法..."
                  loading={loading}
                  replyingTo={replyingTo}
                  onCancelReply={() => setReplyingTo(null)}
                />
              </div>
            </div>
          </div>
        )}

        {/* 评论列表 */}
        <div className="space-y-2">
          {sortedComments.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">还没有评论</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">成为第一个发表评论的人吧！</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {sortedComments.map((comment, index) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUser={currentUser}
                  onReply={handleReply}
                  onLike={onLikeComment}
                  onAddComment={handleAddComment}
                  onDelete={onDeleteComment}
                  onReport={onReportComment}
                  onEdit={onEditComment}
                  maxDepth={maxDepth}
                  isLast={index === sortedComments.length - 1}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* 加载更多 */}
        {sortedComments.length > 0 && sortedComments.length >= 20 && (
          <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
            >
              加载更多评论
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CommentSection
