/**
 * 动态评论抽屉组件
 * 模仿B站风格 - 点击评论按钮在动态下方展开评论区域
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import type { FeedItem, FeedComment } from '@/types/feed';
import feedService from '@/services/feedService';
import { getFollowingList, getFollowersList } from '@/services/postService';
import {
  Heart,
  MessageCircle,
  Send,
  Loader2,
  MoreHorizontal,
  Edit2,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface FeedCommentDrawerProps {
  feed: FeedItem;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  currentUserName?: string;
  currentUserAvatar?: string;
  onCommentAdded?: (feedId: string) => void;
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

export function FeedCommentDrawer({
  feed,
  isOpen,
  onClose,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onCommentAdded,
}: FeedCommentDrawerProps) {
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
  const [sortType, setSortType] = useState<'hot' | 'latest'>('hot');
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // @提及相关状态
  const [isMentionSelectorOpen, setIsMentionSelectorOpen] = useState(false);
  const [mentionSearchQuery, setMentionSearchQuery] = useState('');
  interface Friend {
    id: string;
    username: string;
    avatar_url?: string;
  }
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);

  // 加载好友列表
  useEffect(() => {
    if (!currentUserId) return;

    const loadFriends = async () => {
      try {
        const [following, followers] = await Promise.all([
          getFollowingList().catch(() => []),
          getFollowersList().catch(() => []),
        ]);

        const followerIds = new Set(followers.map((u) => u.id));
        const mutualFriends = following.filter((user) => followerIds.has(user.id));

        const friendsList = mutualFriends.map((user) => ({
          id: user.id,
          username: user.username || user.name,
          avatar_url: user.avatar_url,
        }));

        setFriends(friendsList);
      } catch (e) {
        console.error('[FeedCommentDrawer] Failed to load friends:', e);
      }
    };

    loadFriends();
  }, [currentUserId]);

  // 监听评论内容变化，检测@提及
  useEffect(() => {
    if (!newComment) {
      setIsMentionSelectorOpen(false);
      return;
    }

    const input = commentInputRef.current;
    const cursorPosition = input?.selectionStart || newComment.length;
    const textBeforeCursor = newComment.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const query = textBeforeCursor.substring(lastAtIndex + 1);
      if (!query.includes(' ')) {
        setMentionSearchQuery(query);
        const filtered = friends.filter((friend) =>
          friend.username?.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredFriends(filtered);
        setIsMentionSelectorOpen(true);
        return;
      }
    }

    setIsMentionSelectorOpen(false);
  }, [newComment, friends]);

  // 加载评论
  useEffect(() => {
    if (isOpen) {
      loadComments(true);
    }
  }, [isOpen, sortType]);

  const loadComments = async (isRefresh = false) => {
    setIsLoadingComments(true);
    try {
      const page = isRefresh ? 1 : commentPage;
      const response = await feedService.getComments(feed.id, page, 20);

      if (isRefresh) {
        setComments(response.comments);
        setCommentPage(2);
      } else {
        setComments((prev) => [...prev, ...response.comments]);
        setCommentPage((prev) => prev + 1);
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
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const comment = await feedService.createComment(
        feed.id,
        newComment.trim(),
        undefined,
        currentUserId,
        currentUserName,
        currentUserAvatar
      );
      if (comment) {
        setComments((prev) => [comment, ...prev]);
        setNewComment('');
        toast.success('评论发布成功');
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
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? { ...comment, isLiked: result.isLiked, likes: result.likes }
              : comment
          )
        );
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
        setComments((prev) =>
          prev.map((comment) => (comment.id === commentId ? result.comment! : comment))
        );
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
        setComments((prev) => prev.filter((comment) => comment.id !== commentId));
        setActiveMenuId(null);
        toast.success('评论已删除');
        onCommentAdded?.(feed.id);
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
    if (!replyContent.trim()) return;

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
        setComments((prev) => [comment, ...prev]);
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

  // 选择好友@提及
  const handleSelectMention = (friend: any) => {
    const input = commentInputRef.current;
    const cursorPosition = input?.selectionStart || newComment.length;
    const textBeforeCursor = newComment.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const textBeforeAt = newComment.substring(0, lastAtIndex);
    const textAfterCursor = newComment.substring(cursorPosition);
    const newContent = textBeforeAt + '@' + friend.username + ' ' + textAfterCursor;
    setNewComment(newContent);
    setIsMentionSelectorOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={`overflow-hidden border-t ${
            isDark ? 'border-gray-800' : 'border-gray-100'
          }`}
        >
          <div className={`p-4 ${isDark ? 'bg-gray-900/50' : 'bg-gray-50/50'}`}>
            {/* 评论头部 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  评论 {formatNumber(feed.comments)}
                </h4>
                <div className="flex items-center gap-2 text-sm">
                  <button
                    onClick={() => setSortType('hot')}
                    className={`transition-colors ${
                      sortType === 'hot'
                        ? isDark
                          ? 'text-blue-400'
                          : 'text-blue-600'
                        : isDark
                        ? 'text-gray-500 hover:text-gray-300'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    最热
                  </button>
                  <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>|</span>
                  <button
                    onClick={() => setSortType('latest')}
                    className={`transition-colors ${
                      sortType === 'latest'
                        ? isDark
                          ? 'text-blue-400'
                          : 'text-blue-600'
                        : isDark
                        ? 'text-gray-500 hover:text-gray-300'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    最新
                  </button>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-1 rounded-lg transition-colors ${
                  isDark
                    ? 'hover:bg-gray-800 text-gray-500'
                    : 'hover:bg-gray-200 text-gray-400'
                }`}
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            </div>

            {/* 评论输入框 */}
            <div className="flex gap-3 mb-4 relative">
              <img
                src={currentUserAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                alt="当前用户"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 relative">
                <input
                  ref={commentInputRef}
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                  placeholder={friends.length > 0 ? '写下你的评论... 使用 @ 提及好友' : '写下你的评论...'}
                  className={`w-full px-4 py-2 pr-10 rounded-full text-sm outline-none transition-colors ${
                    isDark
                      ? 'bg-gray-800 text-white placeholder-gray-500 focus:bg-gray-750'
                      : 'bg-white text-gray-900 placeholder-gray-400 focus:bg-gray-50 border border-gray-200'
                  }`}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${
                    !newComment.trim() || isSubmittingComment
                      ? isDark
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-300 cursor-not-allowed'
                      : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                  }`}
                >
                  {isSubmittingComment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>

                {/* @提及选择器 */}
                {isMentionSelectorOpen && filteredFriends.length > 0 && (
                  <div
                    className={`absolute left-0 right-0 bottom-full mb-2 rounded-xl shadow-xl overflow-hidden z-20 ${
                      isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                    }`}
                  >
                    <div
                      className={`px-3 py-2 text-xs font-medium border-b ${
                        isDark
                          ? 'border-gray-700 text-gray-400'
                          : 'border-gray-100 text-gray-500'
                      }`}
                    >
                      选择好友
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {filteredFriends.map((friend) => (
                        <button
                          key={friend.id}
                          onClick={() => handleSelectMention(friend)}
                          className={`w-full flex items-center gap-2 px-3 py-2 transition-colors ${
                            isDark
                              ? 'hover:bg-gray-700 text-gray-200'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <img
                            src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                            alt={friend.username}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-sm">{friend.username}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 评论列表 */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
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
                        <span
                          className={`font-medium text-sm ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          {comment.author.name}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                          {formatTime(comment.createdAt)}
                        </span>
                      </div>
                      {/* 更多操作菜单 */}
                      {isOwnComment(comment) && (
                        <div
                          className="relative"
                          ref={activeMenuId === comment.id ? menuRef : undefined}
                        >
                          <button
                            onClick={() =>
                              setActiveMenuId(activeMenuId === comment.id ? null : comment.id)
                            }
                            className={`p-1 rounded transition-colors ${
                              isDark
                                ? 'hover:bg-gray-800 text-gray-500'
                                : 'hover:bg-gray-200 text-gray-400'
                            }`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {activeMenuId === comment.id && (
                            <div
                              className={`absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg z-10 min-w-[100px] ${
                                isDark
                                  ? 'bg-gray-800 border border-gray-700'
                                  : 'bg-white border border-gray-100'
                              }`}
                            >
                              <button
                                onClick={() => handleStartEdit(comment)}
                                className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors ${
                                  isDark
                                    ? 'hover:bg-gray-700 text-gray-300'
                                    : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                编辑
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
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
                                ? isDark
                                  ? 'text-gray-600 cursor-not-allowed'
                                  : 'text-gray-300 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            保存
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                              isDark
                                ? 'text-gray-400 hover:text-gray-300'
                                : 'text-gray-500 hover:text-gray-700'
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
                                  ? isDark
                                    ? 'text-gray-600 cursor-not-allowed'
                                    : 'text-gray-300 cursor-not-allowed'
                                  : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                              }`}
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelReply}
                              className={`px-3 py-2 rounded-lg transition-colors ${
                                isDark
                                  ? 'text-gray-400 hover:text-gray-300'
                                  : 'text-gray-500 hover:text-gray-700'
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
                  <Loader2
                    className={`w-5 h-5 animate-spin ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  />
                </div>
              )}

              {!isLoadingComments && hasMoreComments && comments.length > 0 && (
                <button
                  onClick={() => loadComments(false)}
                  className={`w-full py-2 text-sm transition-colors ${
                    isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  加载更多评论
                </button>
              )}

              <div ref={commentsEndRef} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
