import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Post } from '@/services/postService';
import { TianjinAvatar, TianjinButton, TianjinImage } from '@/components/TianjinStyleComponents';
import LazyImage from './LazyImage';

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onLike: (id: string) => void;
  onComment: (id: string, content: string) => void;
  onShare?: (id: string) => void;
  loading?: boolean;
  error?: string | null;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  isOpen,
  onClose,
  onLike,
  onComment,
  onShare,
  loading = false,
  error = null,
}) => {
  const { isDark } = useTheme();
  const [commentText, setCommentText] = useState('');
  const [isImageFull, setIsImageFull] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes or post changes
  useEffect(() => {
    if (!isOpen) {
      setCommentText('');
      setIsImageFull(false);
    }
  }, [isOpen, post]);

  // Lock body scroll when modal is open
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

  const handleSendComment = () => {
    if (post && commentText.trim()) {
      onComment(post.id, commentText);
      setCommentText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 lg:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className={`relative w-full h-full max-w-7xl max-h-[90vh] overflow-hidden rounded-none sm:rounded-2xl shadow-2xl flex flex-col lg:flex-row ${
              isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Loading State */}
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-inherit">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm opacity-70">正在加载精彩内容...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-inherit">
                <div className="text-center p-8">
                   <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4 text-red-500">
                     <i className="fas fa-exclamation-triangle text-2xl"></i>
                   </div>
                   <h3 className="text-lg font-bold mb-2">加载失败</h3>
                   <p className="opacity-70 mb-6">{error}</p>
                   <TianjinButton onClick={onClose} variant="secondary">关闭</TianjinButton>
                </div>
              </div>
            )}

            {post && (
              <>
                {/* Left: Image Viewer */}
                <div className={`relative flex-1 bg-black flex items-center justify-center overflow-hidden group ${isImageFull ? 'fixed inset-0 z-50' : ''}`}>
                  {/* Blurred Background for Image */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110"
                    style={{ backgroundImage: `url(${post.thumbnail})` }}
                  />
                  
                  {/* Main Image */}
                  <div className={`relative z-10 w-full h-full p-4 flex items-center justify-center transition-all duration-300 ${isImageFull ? 'p-0' : ''}`}>
                    <LazyImage 
                      src={post.thumbnail} 
                      alt={post.title} 
                      className={`max-w-full max-h-full object-contain shadow-2xl transition-transform duration-300 ${isImageFull ? 'scale-100' : 'group-hover:scale-[1.02]'}`}
                      fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMTAwIiBmaWxsPSIjZmZmZmZmIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNzAiIGZpbGw9IiM2NjY2NjYiLz4KPHN2ZyB4PSI3MCIgeT0iNzAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0id2hpdGUiLz4KPHJlY3QgeD0iODAiIHk9IjgwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNkY2RjZGMiLz4KPHJlY3QgeD0iOTAuNSIgeT0iOTEiIHdpZHRoPSIxOSIgaGVpZ2h0PSIxOCIgc3Ryb2tlPSIjNzc3Nzc3IiBzdHJva2Utb3BhY2l0eT0iMC41IiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+Cjwvc3ZnPg==" 
                      placeholder="skeleton" 
                      disableFallback={false} 
                    />
                  </div>

                  {/* Image Controls */}
                  <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setIsImageFull(!isImageFull)}
                      className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm transition-colors"
                      title={isImageFull ? "退出全屏" : "全屏查看"}
                    >
                      <i className={`fas ${isImageFull ? 'fa-compress' : 'fa-expand'}`}></i>
                    </button>
                    {isImageFull && (
                       <button 
                       onClick={() => setIsImageFull(false)}
                       className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm transition-colors"
                     >
                       <i className="fas fa-times"></i>
                     </button>
                    )}
                  </div>
                  
                  {/* Mobile Close Button (Overlay on Image) */}
                  <div className="lg:hidden absolute top-4 left-4 z-20">
                     <button 
                      onClick={onClose}
                      className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm transition-colors"
                    >
                      <i className="fas fa-arrow-left"></i>
                    </button>
                  </div>
                </div>

                {/* Right: Info & Interaction */}
                <div className={`flex flex-col w-full lg:w-[400px] xl:w-[450px] border-l ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'}`}>
                  
                  {/* Header */}
                  <div className={`p-5 border-b flex justify-between items-start gap-4 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                    <div className="flex-1 min-w-0">
                      <h2 className={`text-xl font-bold leading-tight mb-2 line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {post.title}
                      </h2>
                      <div className="flex items-center gap-2">
                         <TianjinAvatar 
                           src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.id}`} 
                           alt="Author" 
                           size="sm" 
                           variant="gradient"
                         />
                         <div className="text-xs">
                            <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                               {post.author || '津门创作者'}
                            </div>
                            <div className="opacity-50 text-[10px]">
                               {post.date} · {post.category === 'design' ? '设计' : '其他'}
                            </div>
                         </div>
                         <button className={`ml-auto text-xs px-3 py-1 rounded-full border transition-all ${
                           isDark 
                             ? 'border-gray-700 text-gray-300 hover:bg-gray-800' 
                             : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                         }`}>
                           关注
                         </button>
                      </div>
                    </div>
                    {/* Desktop Close Button */}
                    <button 
                      onClick={onClose}
                      className={`hidden lg:flex p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      <i className="fas fa-times text-lg"></i>
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                     {/* Stats Bar */}
                     <div className={`flex items-center justify-between mb-6 p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                        <div className="flex flex-col items-center flex-1 border-r border-gray-200 dark:border-gray-700 last:border-0">
                           <span className="text-lg font-bold">{post.likes}</span>
                           <span className="text-[10px] opacity-60">点赞</span>
                        </div>
                        <div className="flex flex-col items-center flex-1 border-r border-gray-200 dark:border-gray-700 last:border-0">
                           <span className="text-lg font-bold">{post.views || Math.floor(Math.random() * 1000)}</span>
                           <span className="text-[10px] opacity-60">浏览</span>
                        </div>
                        <div className="flex flex-col items-center flex-1">
                           <span className="text-lg font-bold">{post.shares || 0}</span>
                           <span className="text-[10px] opacity-60">分享</span>
                        </div>
                     </div>

                     {/* Description */}
                     {post.description && (
                       <div className={`mb-6 text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                         {post.description}
                       </div>
                     )}

                     {/* Tags */}
                     {(post.tags && post.tags.length > 0) && (
                       <div className="flex flex-wrap gap-2 mb-6">
                         {post.tags.map(tag => (
                           <span key={tag} className={`text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                             #{tag}
                           </span>
                         ))}
                       </div>
                     )}

                     <div className={`h-px w-full my-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}></div>

                     {/* Comments Section */}
                     <div>
                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                           评论 <span className="opacity-50 font-normal">{post.comments.length}</span>
                        </h3>
                        
                        {post.comments.length === 0 ? (
                           <div className="text-center py-8 opacity-50 text-sm">
                              <i className="far fa-comment-dots text-2xl mb-2"></i>
                              <p>暂无评论，快来抢沙发~</p>
                           </div>
                        ) : (
                           <div className="space-y-4">
                              {post.comments.map(comment => (
                                 <div key={comment.id} className="flex gap-3">
                                    <TianjinAvatar 
                                       src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.id}`} 
                                       alt={`用户${comment.id.slice(-4)}`} 
                                       size="xs" 
                                    />
                                    <div className="flex-1">
                                       <div className={`text-xs font-bold mb-0.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                          用户{comment.id.slice(-4)}
                                       </div>
                                       <div className={`text-sm mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                          {comment.content}
                                       </div>
                                       <div className="flex items-center gap-3 text-[10px] opacity-50">
                                          <span>{new Date(comment.date).toLocaleString()}</span>
                                          <button className="hover:text-blue-500">回复</button>
                                       </div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Footer Action Bar */}
                  <div className={`p-4 border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'}`}>
                     <div className="flex items-center gap-3 mb-3">
                        <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-full border transition-colors ${
                           isDark 
                             ? 'bg-gray-800 border-gray-700 focus-within:border-gray-600' 
                             : 'bg-gray-50 border-gray-200 focus-within:border-gray-300'
                        }`}>
                           <i className="far fa-edit opacity-50 ml-1"></i>
                           <input 
                             ref={commentInputRef}
                             value={commentText}
                             onChange={(e) => setCommentText(e.target.value)}
                             onKeyDown={handleKeyDown}
                             placeholder="说点什么..."
                             className="flex-1 bg-transparent border-none outline-none text-sm"
                           />
                           {commentText.trim() && (
                              <button 
                                onClick={handleSendComment}
                                className="text-blue-500 font-bold text-xs px-2 animate-fadeIn"
                              >
                                发送
                              </button>
                           )}
                        </div>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex gap-4">
                           <button 
                             onClick={() => onLike(post.id)}
                             className={`flex items-center gap-1.5 transition-transform active:scale-95 ${post.isLiked ? 'text-red-500' : 'opacity-70 hover:opacity-100'}`}
                           >
                              <i className={`${post.isLiked ? 'fas' : 'far'} fa-heart text-xl`}></i>
                              <span className="text-xs font-medium">{post.likes > 0 ? post.likes : '点赞'}</span>
                           </button>
                           <button 
                             className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-transform active:scale-95"
                             onClick={() => commentInputRef.current?.focus()}
                           >
                              <i className="far fa-comment text-xl"></i>
                              <span className="text-xs font-medium">{post.comments.length > 0 ? post.comments.length : '评论'}</span>
                           </button>
                           <button 
                             className={`flex items-center gap-1.5 transition-transform active:scale-95 ${post.isBookmarked ? 'text-yellow-500' : 'opacity-70 hover:opacity-100'}`}
                           >
                              <i className={`${post.isBookmarked ? 'fas' : 'far'} fa-star text-xl`}></i>
                              <span className="text-xs font-medium">{post.isBookmarked ? '已收藏' : '收藏'}</span>
                           </button>
                        </div>
                        <button 
                          onClick={() => onShare && onShare(post.id)}
                          className="opacity-70 hover:opacity-100 transition-transform active:scale-95"
                        >
                           <i className="fas fa-share-alt text-xl"></i>
                        </button>
                     </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PostDetailModal;
