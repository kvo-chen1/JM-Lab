/**
 * 动态详情模态框组件
 * 展示动态详情和评论
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import type { FeedItem, FeedComment } from '@/types/feed';
import feedService from '@/services/feedService';
import { VideoPlayer } from './VideoPlayer';
import {
  X,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Send,
  Loader2,
  Verified,
  BadgeCheck,
  Award,
  MapPin,
  ChevronLeft,
  Edit2,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';

interface FeedDetailModalProps {
  feed: FeedItem | null;
  isOpen: boolean;
  onClose: () => void;
  onLike: (feedId: string) => void;
  onCollect: (feedId: string) => void;
  onShare: (feedId: string) => void;
  onCommentAdded?: (feedId: string) => void;
  currentUserId?: string;
  currentUserName?: string;
  currentUserAvatar?: string;
}

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

// 格式化时间
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

// 获取认证图标
function getVerifiedIcon(type?: string) {
  switch (type) {
    case 'personal':
      return <BadgeCheck className="w-4 h-4 text-blue-500" />;
    case 'brand':
      return <Verified className="w-4 h-4 text-yellow-500" />;
    case 'official':
      return <Award className="w-4 h-4 text-red-500" />;
    default:
      return null;
  }
}

export function FeedDetailModal({
  feed,
  isOpen,
  onClose,
  onLike,
  onCollect,
  onShare,
  onCommentAdded,
  currentUserId,
  currentUserName,
  currentUserAvatar,
}: FeedDetailModalProps) {
  const { isDark } = useTheme();
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [localCommentsCount, setLocalCommentsCount] = useState(feed?.comments || 0);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 同步本地评论数与 feed 数据
  useEffect(() => {
    if (feed) {
      setLocalCommentsCount(feed.comments);
    }
  }, [feed?.comments, feed?.id]);

  // 加载评论
  useEffect(() => {
    if (feed && isOpen) {
      console.log('[FeedDetailModal] Loading comments for feed:', feed.id, 'title:', feed.title);
      loadComments(true);
    }
  }, [feed, isOpen]);

  const loadComments = async (isRefresh = false) => {
    if (!feed) return;
    
    setIsLoadingComments(true);
    try {
      const page = isRefresh ? 1 : commentPage;
      const response = await feedService.getComments(feed.id, page, 20);
      
      if (isRefresh) {
        setComments(response.comments);
        setCommentPage(2);
      } else {
        setComments(prev => [...prev, ...response.comments]);
        setCommentPage(prev => prev + 1);
      }
      
      setHasMoreComments(response.hasMore);
    } catch (error) {
      toast.error('加载评论失败');
    } finally {
      setIsLoadingComments(false);
    }
  };

  // 提交评论
  const handleSubmitComment = async () => {
    if (!feed || !newComment.trim()) return;

    console.log('[FeedDetailModal] Submitting comment with:', { currentUserId, currentUserName, currentUserAvatar });

    setIsSubmittingComment(true);
    try {
      const comment = await feedService.createComment(feed.id, newComment.trim(), undefined, currentUserId, currentUserName, currentUserAvatar);
      if (comment) {
        setComments(prev => [comment, ...prev]);
        setLocalCommentsCount(prev => prev + 1);
        setNewComment('');
        toast.success('评论发布成功');
        // 通知父组件评论已添加
        onCommentAdded?.(feed.id);
      } else {
        toast.error('评论发布失败，请检查是否已登录');
      }
    } catch (error) {
      toast.error('评论发布失败');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // 点赞评论
  const handleLikeComment = async (commentId: string) => {
    try {
      const result = await feedService.likeComment(commentId, currentUserId);
      if (result.success) {
        setComments(prev => prev.map(comment =>
          comment.id === commentId
            ? { ...comment, isLiked: result.isLiked, likes: result.likes }
            : comment
        ));
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 开始编辑评论
  const handleStartEdit = (comment: FeedComment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
    setActiveMenuId(null);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  // 保存编辑
  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const result = await feedService.updateComment(commentId, editContent.trim(), currentUserId);
      if (result.success && result.comment) {
        setComments(prev => prev.map(comment =>
          comment.id === commentId ? result.comment! : comment
        ));
        setEditingCommentId(null);
        setEditContent('');
        toast.success('评论已更新');
      } else {
        toast.error('更新失败，只能编辑自己的评论');
      }
    } catch (error) {
      toast.error('更新失败');
    }
  };

  // 删除评论
  const handleDeleteComment = async (commentId: string) => {
    try {
      const result = await feedService.deleteComment(commentId, currentUserId);
      if (result.success) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
        setLocalCommentsCount(prev => Math.max(0, prev - 1));
        setActiveMenuId(null);
        toast.success('评论已删除');
        // 通知父组件评论已删除
        onCommentAdded?.(feed?.id || '');
      } else {
        toast.error('删除失败，只能删除自己的评论');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 检查是否是当前用户的评论
  const isOwnComment = (comment: FeedComment) => {
    return currentUserId && comment.author.id === currentUserId;
  };

  // 开始回复评论
  const handleStartReply = (commentId: string) => {
    setReplyingToId(commentId);
    setReplyContent('');
  };

  // 取消回复
  const handleCancelReply = () => {
    setReplyingToId(null);
    setReplyContent('');
  };

  // 提交回复
  const handleSubmitReply = async (parentId: string) => {
    if (!feed || !replyContent.trim()) return;

    try {
      const comment = await feedService.createComment(
        feed.id,
        replyContent.trim(),
        parentId,
        currentUserId,
        currentUserName,
        currentUserAvatar
      );
      if (comment) {
        setComments(prev => [comment, ...prev]);
        setReplyingToId(null);
        setReplyContent('');
        toast.success('回复发布成功');
        onCommentAdded?.(feed.id);
      } else {
        toast.error('回复发布失败，请检查是否已登录');
      }
    } catch (error) {
      toast.error('回复发布失败');
    }
  };

  if (!feed) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* 模态框内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl ${
              isDark 
                ? 'bg-gray-900 border border-gray-800' 
                : 'bg-white border border-gray-100'
            }`}
          >
            {/* 头部 */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'border-gray-800' : 'border-gray-100'
            }`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark 
                      ? 'hover:bg-gray-800 text-gray-400' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  动态详情
                </h2>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-gray-800 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 内容区域 */}
            <div className="flex h-[calc(90vh-80px)]">
              {/* 左侧：动态内容 */}
              <div className={`flex-1 overflow-y-auto ${isDark ? 'border-r border-gray-800' : 'border-r border-gray-100'}`}>
                <div className="p-6">
                  {/* 作者信息 */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <img
                        src={feed.author.avatar}
                        alt={feed.author.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {feed.author.verified && (
                        <div className="absolute -bottom-1 -right-1">
                          {getVerifiedIcon(feed.author.verifiedType)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {feed.author.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                          {formatTime(feed.createdAt)}
                        </span>
                        {feed.location && (
                          <>
                            <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>·</span>
                            <span className={`flex items-center gap-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              <MapPin className="w-3 h-3" />
                              {feed.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 内容 */}
                  <p className={`text-base leading-relaxed whitespace-pre-wrap mb-4 ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {feed.content}
                  </p>

                  {/* 话题标签 */}
                  {feed.tags && feed.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {feed.tags.map((tag, index) => (
                        <span
                          key={index}
                          className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'} hover:underline cursor-pointer`}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 媒体内容 */}
                  {feed.media && feed.media.length > 0 && (
                    <div className={`grid gap-2 mb-6 ${
                      feed.media.length === 1 ? 'grid-cols-1' :
                      feed.media.length === 2 ? 'grid-cols-2' :
                      feed.media.length <= 4 ? 'grid-cols-2' :
                      'grid-cols-3'
                    }`}>
                      {feed.media.map((media, index) => (
                        <div
                          key={media.id}
                          className={`relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 ${
                            feed.media!.length === 1 ? 'aspect-video' : 'aspect-square'
                          }`}
                        >
                          {media.type === 'video' ? (
                            <VideoPlayer
                              src={media.url}
                              thumbnailUrl={media.thumbnailUrl}
                              className="w-full h-full"
                            />
                          ) : (
                            <img
                              src={media.url}
                              alt={`图片 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 互动按钮 */}
                  <div className={`flex items-center justify-between py-4 border-t ${
                    isDark ? 'border-gray-800' : 'border-gray-100'
                  }`}>
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => onLike(feed.id)}
                        className={`flex items-center gap-2 transition-colors ${
                          feed.isLiked
                            ? 'text-pink-500'
                            : isDark
                            ? 'text-gray-500 hover:text-pink-400'
                            : 'text-gray-500 hover:text-pink-500'
                        }`}
                      >
                        <Heart className={`w-6 h-6 ${feed.isLiked ? 'fill-current' : ''}`} />
                        <span className="font-medium">{formatNumber(feed.likes)}</span>
                      </button>

                      <button
                        className={`flex items-center gap-2 transition-colors ${
                          isDark 
                            ? 'text-gray-500 hover:text-blue-400' 
                            : 'text-gray-500 hover:text-blue-500'
                        }`}
                      >
                        <MessageCircle className="w-6 h-6" />
                        <span className="font-medium">{formatNumber(localCommentsCount)}</span>
                      </button>

                      <button
                        onClick={() => onShare(feed.id)}
                        className={`flex items-center gap-2 transition-colors ${
                          isDark 
                            ? 'text-gray-500 hover:text-green-400' 
                            : 'text-gray-500 hover:text-green-500'
                        }`}
                      >
                        <Share2 className="w-6 h-6" />
                        <span className="font-medium">{formatNumber(feed.shares)}</span>
                      </button>
                    </div>

                    <button
                      onClick={() => onCollect(feed.id)}
                      className={`transition-colors ${
                        feed.isCollected
                          ? 'text-yellow-500'
                          : isDark
                          ? 'text-gray-500 hover:text-yellow-400'
                          : 'text-gray-500 hover:text-yellow-500'
                      }`}
                    >
                      <Bookmark className={`w-6 h-6 ${feed.isCollected ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 右侧：评论区 */}
              <div className="w-96 flex flex-col">
                {/* 评论列表 */}
                <div className="flex-1 overflow-y-auto p-4">
                  <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    评论 ({formatNumber(localCommentsCount)})
                  </h3>

                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <img
                          src={comment.author.avatar}
                          alt={comment.author.name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {comment.author.name}
                              </span>
                              <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                {formatTime(comment.createdAt)}
                              </span>
                            </div>
                            {/* 更多操作菜单 */}
                            {isOwnComment(comment) && (
                              <div className="relative" ref={activeMenuId === comment.id ? menuRef : undefined}>
                                <button
                                  onClick={() => setActiveMenuId(activeMenuId === comment.id ? null : comment.id)}
                                  className={`p-1 rounded transition-colors ${
                                    isDark ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-400'
                                  }`}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                                {activeMenuId === comment.id && (
                                  <div className={`absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg z-10 min-w-[100px] ${
                                    isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
                                  }`}>
                                    <button
                                      onClick={() => handleStartEdit(comment)}
                                      className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors ${
                                        isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                                      }`}
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                      编辑
                                    </button>
                                    <button
                                      onClick={() => handleDeleteComment(comment.id)}
                                      className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      删除
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          {/* 编辑模式 */}
                          {editingCommentId === comment.id ? (
                            <div className="mt-2">
                              <input
                                type="text"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSaveEdit(comment.id);
                                  }
                                  if (e.key === 'Escape') {
                                    handleCancelEdit();
                                  }
                                }}
                                className={`w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors ${
                                  isDark
                                    ? 'bg-gray-800 text-white placeholder-gray-500 focus:bg-gray-750'
                                    : 'bg-gray-100 text-gray-900 placeholder-gray-400 focus:bg-gray-50'
                                }`}
                                autoFocus
                              />
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => handleSaveEdit(comment.id)}
                                  disabled={!editContent.trim()}
                                  className={`px-3 py-1 text-xs rounded transition-colors ${
                                    !editContent.trim()
                                      ? isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
                                      : 'bg-blue-500 text-white hover:bg-blue-600'
                                  }`}
                                >
                                  保存
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className={`px-3 py-1 text-xs rounded transition-colors ${
                                    isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                                  }`}
                                >
                                  取消
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className={`text-sm mt-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                {comment.content}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <button
                                  onClick={() => handleLikeComment(comment.id)}
                                  className={`flex items-center gap-1 text-xs transition-colors ${
                                    comment.isLiked
                                      ? 'text-pink-500'
                                      : isDark
                                      ? 'text-gray-500 hover:text-pink-400'
                                      : 'text-gray-500 hover:text-pink-500'
                                  }`}
                                >
                                  <Heart className={`w-3.5 h-3.5 ${comment.isLiked ? 'fill-current' : ''}`} />
                                  {comment.likes > 0 && comment.likes}
                                </button>
                                <button
                                  onClick={() => handleStartReply(comment.id)}
                                  className={`text-xs transition-colors ${
                                    isDark
                                      ? 'text-gray-500 hover:text-blue-400'
                                      : 'text-gray-500 hover:text-blue-500'
                                  }`}
                                >
                                  回复
                                </button>
                              </div>
                              {/* 回复输入框 */}
                              {replyingToId === comment.id && (
                                <div className="mt-3 flex gap-2">
                                  <input
                                    type="text"
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmitReply(comment.id);
                                      }
                                      if (e.key === 'Escape') {
                                        handleCancelReply();
                                      }
                                    }}
                                    placeholder={`回复 ${comment.author.name}...`}
                                    className={`flex-1 px-3 py-2 text-sm rounded-lg outline-none transition-colors ${
                                      isDark
                                        ? 'bg-gray-800 text-white placeholder-gray-500 focus:bg-gray-750'
                                        : 'bg-gray-100 text-gray-900 placeholder-gray-400 focus:bg-gray-50'
                                    }`}
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSubmitReply(comment.id)}
                                    disabled={!replyContent.trim()}
                                    className={`px-3 py-2 rounded-lg transition-colors ${
                                      !replyContent.trim()
                                        ? isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
                                        : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                                    }`}
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={handleCancelReply}
                                    className={`px-3 py-2 rounded-lg transition-colors ${
                                      isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                    {isLoadingComments && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className={`w-5 h-5 animate-spin ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      </div>
                    )}

                    {!isLoadingComments && hasMoreComments && comments.length > 0 && (
                      <button
                        onClick={() => loadComments(false)}
                        className={`w-full py-2 text-sm transition-colors ${
                          isDark 
                            ? 'text-gray-500 hover:text-gray-300' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        加载更多评论
                      </button>
                    )}

                    <div ref={commentsEndRef} />
                  </div>
                </div>

                {/* 评论输入框 */}
                <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmitComment();
                        }
                      }}
                      placeholder="写下你的评论..."
                      className={`flex-1 px-4 py-2 rounded-full text-sm outline-none transition-colors ${
                        isDark 
                          ? 'bg-gray-800 text-white placeholder-gray-500 focus:bg-gray-750' 
                          : 'bg-gray-100 text-gray-900 placeholder-gray-400 focus:bg-gray-50'
                      }`}
                    />
                    <button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || isSubmittingComment}
                      className={`p-2 rounded-full transition-colors ${
                        !newComment.trim() || isSubmittingComment
                          ? isDark 
                            ? 'text-gray-600 cursor-not-allowed' 
                            : 'text-gray-300 cursor-not-allowed'
                          : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                      }`}
                    >
                      {isSubmittingComment ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
