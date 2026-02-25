import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { TianjinAvatar } from '@/components/TianjinStyleComponents';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { Comment } from '@/services/postService';
import type { UserProfile } from '@/lib/supabase';
import type { User as AuthUser } from '@/contexts/authContext';

// 常用表情列表
const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
  '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
  '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
  '👍', '👎', '👏', '🙌', '❤️', '💔', '🔥', '✨',
  '🎉', '💯', '😂', '🥺', '😭', '😤', '😡', '🥳',
];

interface MobileCommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  commentsLoading: boolean;
  commentCount: number;
  currentUser?: UserProfile | AuthUser | null;
  postId?: string;
  onSendComment: (content: string, images?: File[]) => Promise<void>;
  onLikeComment: (comment: Comment) => void;
  onDeleteComment: (commentId: string) => void;
  onReplyToComment: (comment: Comment) => void;
}

export const MobileCommentDrawer: React.FC<MobileCommentDrawerProps> = ({
  isOpen,
  onClose,
  comments,
  commentsLoading,
  commentCount,
  currentUser,
  postId,
  onSendComment,
  onLikeComment,
  onDeleteComment,
  onReplyToComment,
}) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [commentImages, setCommentImages] = useState<File[]>([]);
  const [commentImagePreviews, setCommentImagePreviews] = useState<string[]>([]);
  const [replyToComment, setReplyToComment] = useState<Comment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 4 - commentImages.length);
    if (newFiles.length === 0) return;

    setCommentImages(prev => [...prev, ...newFiles]);

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCommentImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // 移除图片
  const handleRemoveImage = (index: number) => {
    setCommentImages(prev => prev.filter((_, i) => i !== index));
    setCommentImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // 选择表情
  const handleEmojiSelect = (emoji: string) => {
    setCommentText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // 发送评论
  const handleSend = async () => {
    if (!commentText.trim() && commentImages.length === 0) {
      toast.error('请输入评论内容');
      return;
    }

    try {
      await onSendComment(commentText, commentImages);
      setCommentText('');
      setCommentImages([]);
      setCommentImagePreviews([]);
      setReplyToComment(null);
    } catch (error) {
      console.error('发送评论失败:', error);
    }
  };

  // 处理回复
  const handleReply = (comment: Comment) => {
    setReplyToComment(comment);
    inputRef.current?.focus();
    onReplyToComment(comment);
  };

  // 取消回复
  const handleCancelReply = () => {
    setReplyToComment(null);
  };

  // 将评论分为主评论和回复
  const mainComments = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => c.parentId);

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[200] touch-none"
          />

          {/* 抽屉 */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed bottom-0 left-0 right-0 z-[200] rounded-t-2xl flex flex-col ${
              isDark ? 'bg-gray-900' : 'bg-white'
            }`}
            style={{ height: '85vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 拖动条 */}
            <div className="flex items-center justify-center pt-3 pb-2 flex-shrink-0">
              <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
            </div>

            {/* 头部 */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button 
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <i className="fas fa-times text-gray-600 dark:text-gray-400"></i>
                </button>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {commentCount} 条评论
                </h3>
              </div>
            </div>

            {/* 评论列表 */}
            <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
              {commentsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-400 text-sm">加载评论中...</span>
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-4 pb-4">
                  {mainComments.map(comment => (
                    <div key={comment.id} className="group">
                      {/* 主评论 */}
                      <div className="flex gap-3">
                        <div 
                          className="flex-shrink-0 cursor-pointer"
                          onClick={() => comment.userId && navigate(`/author/${comment.userId}`)}
                        >
                          <TianjinAvatar
                            src={comment.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId || comment.id}`}
                            alt="User"
                            size="sm"
                            className="ring-2 ring-white dark:ring-gray-700"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span 
                              className={`font-semibold text-sm cursor-pointer hover:text-blue-600 transition-colors ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}
                              onClick={() => comment.userId && navigate(`/author/${comment.userId}`)}
                            >
                              {comment.author || '用户'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(comment.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className={`text-sm leading-relaxed mb-2 ${
                            isDark ? 'text-gray-200' : 'text-gray-700'
                          }`}>
                            {comment.content}
                          </div>
                          {/* 评论图片 */}
                          {comment.images && comment.images.length > 0 && (
                            <div className="flex gap-2 mb-2 flex-wrap">
                              {comment.images.map((imageUrl, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={imageUrl}
                                  alt={`评论图片 ${imgIndex + 1}`}
                                  className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                                />
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-4">
                            <button 
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                              onClick={() => onLikeComment(comment)}
                            >
                              <i className="far fa-heart"></i>
                              <span>{comment.likes || 0}</span>
                            </button>
                            <button 
                              className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                              onClick={() => handleReply(comment)}
                            >
                              回复
                            </button>
                            {currentUser && comment.userId === currentUser.id && (
                              <button 
                                onClick={() => onDeleteComment(comment.id)}
                                className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-auto"
                              >
                                删除
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 回复列表 */}
                      {replies.filter(r => r.parentId === comment.id).length > 0 && (
                        <div className="ml-11 mt-2 space-y-2">
                          {replies.filter(r => r.parentId === comment.id).map(reply => (
                            <div key={reply.id} className="flex gap-2">
                              <div 
                                className="flex-shrink-0 cursor-pointer"
                                onClick={() => reply.userId && navigate(`/author/${reply.userId}`)}
                              >
                                <TianjinAvatar
                                  src={reply.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.userId || reply.id}`}
                                  alt="User"
                                  size="xs"
                                  className="ring-2 ring-white dark:ring-gray-700"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span 
                                    className={`font-semibold text-xs cursor-pointer hover:text-blue-600 transition-colors ${
                                      isDark ? 'text-white' : 'text-gray-900'
                                    }`}
                                    onClick={() => reply.userId && navigate(`/author/${reply.userId}`)}
                                  >
                                    {reply.author || '用户'}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(reply.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                                <div className={`text-xs leading-relaxed mb-1 ${
                                  isDark ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  {reply.content}
                                </div>
                                <div className="flex items-center gap-3">
                                  <button 
                                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                                    onClick={() => onLikeComment(reply)}
                                  >
                                    <i className="far fa-heart text-xs"></i>
                                    <span>{reply.likes || 0}</span>
                                  </button>
                                  <button 
                                    className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                                    onClick={() => handleReply(reply)}
                                  >
                                    回复
                                  </button>
                                  {currentUser && reply.userId === currentUser.id && (
                                    <button 
                                      onClick={() => onDeleteComment(reply.id)}
                                      className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-auto"
                                    >
                                      删除
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
                  <div className="w-16 h-16 mb-3 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                    <i className="far fa-comments text-2xl text-gray-400"></i>
                  </div>
                  <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    暂无评论
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    来抢沙发，发表你的看法吧
                  </p>
                </div>
              )}
            </div>

            {/* 回复提示 */}
            {replyToComment && (
              <div className={`px-4 py-2 border-t ${isDark ? 'bg-blue-900/20 border-gray-800' : 'bg-blue-50 border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    回复 @{replyToComment.author || '用户'}
                  </span>
                  <button 
                    onClick={handleCancelReply}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <i className="fas fa-times text-xs"></i>
                  </button>
                </div>
              </div>
            )}

            {/* 图片预览 */}
            {commentImagePreviews.length > 0 && (
              <div className="flex gap-2 px-4 py-2 flex-wrap border-t border-gray-100 dark:border-gray-800">
                {commentImagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`预览 ${index + 1}`}
                      className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      <i className="fas fa-times text-[8px]"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 底部输入框 - 固定在底部 */}
            <div className={`px-4 py-3 border-t flex-shrink-0 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
              <div className={`flex items-center gap-2 rounded-full px-4 py-2 border ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
              }`}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={commentImages.length >= 4}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <i className="far fa-image text-lg"></i>
                </button>

                <textarea
                  ref={inputRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={replyToComment ? `回复 @${replyToComment.author}...` : "添加评论..."}
                  rows={1}
                  className={`flex-1 bg-transparent border-none outline-none text-sm resize-none overflow-hidden ${
                    isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                  }`}
                  style={{ minHeight: '20px', maxHeight: '60px' }}
                />

                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <i className="far fa-smile text-lg"></i>
                  </button>

                  {/* 表情选择器 */}
                  {showEmojiPicker && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setShowEmojiPicker(false)}
                      />
                      <div className={`absolute bottom-full right-0 mb-2 p-3 rounded-xl shadow-xl border z-50 w-64 ${
                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                        <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
                          {EMOJI_LIST.map((emoji, index) => (
                            <button
                              key={index}
                              onClick={() => handleEmojiSelect(emoji)}
                              className={`w-7 h-7 flex items-center justify-center rounded transition-colors text-lg ${
                                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                              }`}
                              style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif', lineHeight: 1.5 }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={handleSend}
                  disabled={!commentText.trim() && commentImages.length === 0}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                    commentText.trim() || commentImages.length > 0
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  <i className="fas fa-paper-plane text-xs"></i>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // 使用 createPortal 将抽屉渲染到 body，避免被父容器影响
  return createPortal(drawerContent, document.body);
};

export default MobileCommentDrawer;
