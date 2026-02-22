import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Thread } from '@/pages/Community';
import { TianjinAvatar } from '@/components/TianjinStyleComponents';
import { toast } from 'sonner';
import { X, MessageCircle, ThumbsUp, Share2, Bookmark, Send, Smile, MoreHorizontal, Flag, Trash2 } from 'lucide-react';
import { communityService } from '@/services/communityService';
import { supabase } from '@/lib/supabase';

// 常用表情列表
const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
  '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
  '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '👍', '👎', '👏', '🙌', '👐', '🤝', '🙏', '✌️',
  '🔥', '💯', '⭐', '✨', '⚡', '💥', '🎉', '🎊',
];

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: string;
  authorAvatar?: string;
  authorId?: string;
  likes?: number;
}

interface ThreadDetailModalProps {
  thread: Thread | null;
  communityId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    id: string;
    username: string;
    avatar?: string;
  } | null;
  onPostChange?: (thread: Thread) => void;
}

const ThreadDetailModal: React.FC<ThreadDetailModalProps> = ({
  thread,
  communityId,
  isOpen,
  onClose,
  currentUser,
  onPostChange,
}) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // 初始化点赞状态和数量
  useEffect(() => {
    if (thread) {
      setUpvoteCount(thread.upvotes || 0);
      checkUserUpvoteStatus();
      checkUserBookmarkStatus();
    }
  }, [thread?.id]);

  // 加载评论
  useEffect(() => {
    if (thread?.id && isOpen) {
      loadComments();
    }
  }, [thread?.id, isOpen]);

  // 点击外部关闭表情选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 检查用户是否已点赞
  const checkUserUpvoteStatus = async () => {
    if (!thread?.id || !currentUser?.id) return;
    try {
      const { data } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', thread.id)
        .eq('user_id', currentUser.id)
        .single();
      setHasUpvoted(!!data);
    } catch (error) {
      // 未点赞时查询会报错，这是正常的
      setHasUpvoted(false);
    }
  };

  // 检查用户是否已收藏
  const checkUserBookmarkStatus = async () => {
    if (!thread?.id || !currentUser?.id) return;
    try {
      const { data } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('post_id', thread.id)
        .eq('user_id', currentUser.id)
        .single();
      setIsBookmarked(!!data);
    } catch (error) {
      // 未收藏时查询会报错，这是正常的
      setIsBookmarked(false);
    }
  };

  const loadComments = async () => {
    if (!thread?.id) return;
    setIsLoading(true);
    try {
      const threadData = await communityService.getThread(thread.id);
      if (threadData.comments) {
        const formattedComments = threadData.comments.map((c: any) => ({
          id: c.id,
          content: c.content,
          createdAt: c.created_at || new Date(c.createdAt).toISOString(),
          author: c.author || '未知用户',
          authorAvatar: c.authorAvatar || '',
          authorId: c.authorId,
          likes: c.likes || 0,
        }));
        setComments(formattedComments);
      }
    } catch (error) {
      console.error('加载评论失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !thread?.id || !currentUser) return;

    setIsSubmitting(true);
    try {
      await communityService.addComment(thread.id, currentUser.id, newComment.trim());
      toast.success('评论发布成功');
      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('发布评论失败:', error);
      toast.error('评论发布失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async () => {
    if (!thread?.id || !currentUser) {
      toast.error('请先登录');
      return;
    }
    try {
      await communityService.toggleLike(thread.id, currentUser.id, hasUpvoted ? 'unlike' : 'like');
      
      // 更新本地状态
      if (hasUpvoted) {
        setUpvoteCount(prev => Math.max(0, prev - 1));
        toast.success('取消点赞');
      } else {
        setUpvoteCount(prev => prev + 1);
        toast.success('点赞成功');
      }
      setHasUpvoted(!hasUpvoted);
      
      // 通知父组件更新
      if (onPostChange && thread) {
        onPostChange({
          ...thread,
          upvotes: hasUpvoted ? (thread.upvotes || 0) - 1 : (thread.upvotes || 0) + 1
        });
      }
    } catch (error) {
      console.error('点赞失败:', error);
      toast.error('操作失败');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('链接已复制到剪贴板');
  };

  const handleBookmark = async () => {
    if (!thread?.id || !currentUser) {
      toast.error('请先登录');
      return;
    }
    
    try {
      if (isBookmarked) {
        // 取消收藏
        await supabase
          .from('bookmarks')
          .delete()
          .eq('post_id', thread.id)
          .eq('user_id', currentUser.id);
        toast.success('取消收藏');
      } else {
        // 添加收藏
        await supabase
          .from('bookmarks')
          .insert({
            post_id: thread.id,
            user_id: currentUser.id,
            created_at: new Date().toISOString()
          });
        toast.success('收藏成功');
      }
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('收藏操作失败:', error);
      toast.error('操作失败');
    }
  };

  const insertEmoji = (emoji: string) => {
    setNewComment(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isAuthor = currentUser?.id === thread?.authorId;

  if (!isOpen || !thread) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
            isDark ? 'bg-gray-900' : 'bg-white'
          }`}
          onClick={e => e.stopPropagation()}
        >
          {/* 关闭按钮 - 毛玻璃效果 */}
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 z-20 p-2 rounded-full transition-colors backdrop-blur-xl ${
              isDark 
                ? 'hover:bg-gray-800/80 text-gray-400 bg-gray-900/50' 
                : 'hover:bg-gray-100/80 text-gray-600 bg-white/50'
            }`}
          >
            <X size={24} />
          </button>

          <div className="flex flex-col md:flex-row h-[90vh] md:h-[80vh]">
            {/* 左侧：帖子内容 */}
            <div className={`flex-1 overflow-y-auto ${
              isDark ? 'bg-gray-900' : 'bg-white'
            }`}>
              {/* 顶部作者信息 - 固定定位 */}
              <div 
                className={`sticky top-0 z-10 px-6 py-4 border-b ${
                  isDark 
                    ? 'bg-gray-900 border-gray-800' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <TianjinAvatar
                    size="md"
                    src={thread.authorAvatar || ''}
                    alt={thread.author || '用户'}
                    className="w-10 h-10"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-sm truncate ${
                      isDark ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {thread.author || '未知用户'}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {formatDate(thread.createdAt)}
                    </p>
                  </div>
                  
                  {/* 更多操作菜单 */}
                  <div className="relative" ref={moreMenuRef}>
                    <button
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className={`p-2 rounded-full transition-colors ${
                        isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    
                    <AnimatePresence>
                      {showMoreMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`absolute right-0 top-full mt-2 w-40 rounded-xl shadow-lg border z-30 ${
                            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                          }`}
                        >
                          <button
                            onClick={() => {
                              toast.info('举报功能开发中');
                              setShowMoreMenu(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 rounded-xl ${
                              isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <Flag size={16} />
                            举报内容
                          </button>
                          {isAuthor && (
                            <button
                              onClick={() => {
                                toast.info('删除功能开发中');
                                setShowMoreMenu(false);
                              }}
                              className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 rounded-xl text-red-500 ${
                                isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                              }`}
                            >
                              <Trash2 size={16} />
                              删除帖子
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* 帖子内容区域 */}
              <div className="p-6 md:p-8">
                {/* 标题 */}
                <h1 className={`text-2xl md:text-3xl font-bold mb-4 ${
                  isDark ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  {thread.title}
                </h1>

                {/* 话题标签 */}
                {thread.topic && (
                  <div className="mb-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                    }`}>
                      #{thread.topic}
                    </span>
                  </div>
                )}

                {/* 内容 */}
                <div className={`prose max-w-none mb-6 ${
                  isDark ? 'prose-invert text-gray-300' : 'text-gray-700'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{thread.content}</p>
                </div>

                {/* 图片 */}
                {thread.images && thread.images.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {thread.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`图片 ${index + 1}`}
                        className="w-full rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => window.open(image, '_blank')}
                      />
                    ))}
                  </div>
                )}

                {/* 视频 */}
                {thread.videos && thread.videos.length > 0 && (
                  <div className="space-y-4 mb-6">
                    {thread.videos.map((video, index) => (
                      <video
                        key={index}
                        src={video}
                        controls
                        className="w-full rounded-xl"
                      />
                    ))}
                  </div>
                )}

                {/* 操作栏 */}
                <div className={`flex items-center gap-4 pt-6 border-t ${
                  isDark ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <button
                    onClick={handleUpvote}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      hasUpvoted
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                        : isDark
                        ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <ThumbsUp size={18} className={hasUpvoted ? 'fill-current' : ''} />
                    <span>{upvoteCount}</span>
                  </button>

                  <button
                    onClick={handleBookmark}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      isBookmarked
                        ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30'
                        : isDark
                        ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Bookmark size={18} className={isBookmarked ? 'fill-current' : ''} />
                    <span>{isBookmarked ? '已收藏' : '收藏'}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                      isDark
                        ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Share2 size={18} />
                    <span>分享</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 右侧：评论区 */}
            <div className={`w-full md:w-96 border-t md:border-t-0 md:border-l ${
              isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex flex-col h-full">
                {/* 评论标题 */}
                <div 
                  className={`sticky top-0 z-10 px-4 py-3 border-b ${
                    isDark 
                      ? 'bg-gray-900 border-gray-800' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <h3 className={`font-semibold flex items-center gap-2 ${
                    isDark ? 'text-gray-100' : 'text-gray-900'
                  }`}>
                    <MessageCircle size={20} />
                    评论 ({comments.length})
                  </h3>
                </div>

                {/* 评论列表 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className={`text-center py-8 ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
                      <p>暂无评论</p>
                      <p className="text-sm mt-1">来抢沙发吧~</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-xl ${
                          isDark ? 'bg-gray-800/50' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <TianjinAvatar
                            size="sm"
                            src={comment.authorAvatar || ''}
                            alt={comment.author}
                            className="w-8 h-8"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className={`font-medium text-sm ${
                                isDark ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {comment.author}
                              </span>
                              <span className={`text-xs ${
                                isDark ? 'text-gray-600' : 'text-gray-400'
                              }`}>
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className={`mt-1 text-sm ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* 评论输入框 */}
                <div className={`p-4 border-t ${
                  isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
                }`}>
                  {currentUser ? (
                    <form onSubmit={handleSubmitComment}>
                      <div className={`flex items-center gap-2 p-2 rounded-xl border ${
                        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="写下你的评论..."
                          className={`flex-1 bg-transparent border-none outline-none text-sm ${
                            isDark ? 'text-gray-100 placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'
                          }`}
                        />
                        
                        {/* 表情按钮 */}
                        <div className="relative" ref={emojiPickerRef}>
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                            }`}
                          >
                            <Smile size={18} />
                          </button>
                          
                          <AnimatePresence>
                            {showEmojiPicker && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`absolute bottom-full right-0 mb-2 p-3 rounded-xl shadow-lg border z-20 ${
                                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                }`}
                              >
                                <div className="grid grid-cols-8 gap-1 w-64">
                                  {EMOJI_LIST.map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => insertEmoji(emoji)}
                                      className={`p-1 text-lg rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* 发送按钮 */}
                        <button
                          type="submit"
                          disabled={!newComment.trim() || isSubmitting}
                          className={`p-2 rounded-lg transition-colors ${
                            newComment.trim()
                              ? 'bg-blue-500 text-white hover:bg-blue-600'
                              : isDark
                              ? 'bg-gray-700 text-gray-500'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className={`text-center py-3 rounded-xl ${
                      isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <button
                        onClick={() => navigate('/login')}
                        className="text-blue-500 hover:underline"
                      >
                        登录
                      </button>
                      后发表评论
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ThreadDetailModal;
