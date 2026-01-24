import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Post } from '@/services/postService';
import { TianjinAvatar, TianjinButton, TianjinImage } from '@/components/TianjinStyleComponents';
import LazyImage from './LazyImage';
import { toast } from 'sonner';

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onLike: (id: string) => void;
  onComment: (id: string, content: string) => Promise<void>;
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

  const handleSendComment = async () => {
    if (post && commentText.trim()) {
      await onComment(post.id, commentText);
      setCommentText('');
      // 评论成功反馈
      toast.success('评论发送成功！', {
        duration: 2000,
        position: 'top-center',
      });
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
                  <img 
                    src={post.thumbnail} 
                    alt={post.title} 
                    className={`absolute inset-0 w-full h-full object-cover shadow-2xl transition-transform duration-300 ${isImageFull ? 'scale-100' : 'group-hover:scale-[1.02]'}`}
                  />

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
                     <div className="mt-8">
                        <div className="flex items-center justify-between mb-6">
                           <h3 className="text-lg font-bold flex items-center gap-2">
                              <i className="far fa-comment text-blue-500"></i>
                              评论 
                              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                {post.comments.length}
                              </span>
                           </h3>
                        </div>
                        
                        {post.comments.length === 0 ? (
                           <div className="flex flex-col items-center justify-center py-10 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                              <i className="far fa-comment-dots text-3xl mb-3 text-gray-400 dark:text-gray-500"></i>
                              <h4 className="text-sm font-medium mb-1">暂无评论</h4>
                              <p className="text-xs opacity-60 max-w-xs">快来发表第一条评论，分享你的想法吧~</p>
                              <button 
                                className="mt-4 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" 
                                onClick={() => commentInputRef.current?.focus()}
                              >
                                发表评论
                              </button>
                           </div>
                        ) : (
                           <div className="space-y-5">
                              {post.comments.map(comment => (
                                 <div key={comment.id} className="flex gap-3 pb-4 border-b last:border-b-0 last:pb-0 border-gray-100 dark:border-gray-800">
                                    <TianjinAvatar 
                                       src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.id}`} 
                                       alt={`用户${comment.id.slice(-4)}`} 
                                       size="sm" 
                                       variant="gradient"
                                    />
                                    <div className="flex-1">
                                       <div className="flex items-center justify-between mb-1">
                                          <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                             用户{comment.id.slice(-4)}
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                             {new Date(comment.date).toLocaleString()}
                                          </div>
                                       </div>
                                       <div className={`text-sm mb-2 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                          {comment.content}
                                       </div>
                                       <div className="flex items-center gap-4 text-xs opacity-60">
                                          <button className="hover:text-blue-500 transition-colors flex items-center gap-1">
                                            <i className="far fa-comment"></i>
                                            回复
                                          </button>
                                          <button className="hover:text-red-500 transition-colors flex items-center gap-1">
                                            <i className="far fa-heart"></i>
                                            点赞
                                          </button>
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
                     <div className="flex items-center gap-3 mb-2">
                        <div className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-full border transition-all duration-200 ${isDark ? 'bg-gray-800 border-gray-700 focus-within:border-blue-500 focus-within:bg-gray-750' : 'bg-gray-50 border-gray-200 focus-within:border-blue-500 focus-within:bg-white'}`}>
                           <i className="far fa-comment opacity-50 ml-0 text-sm"></i>
                           <input 
                             ref={commentInputRef}
                             value={commentText}
                             onChange={(e) => setCommentText(e.target.value)}
                             onKeyDown={handleKeyDown}
                             placeholder="分享你的想法..."
                             className="flex-1 bg-transparent border-none outline-none text-sm placeholder-opacity-50"
                             maxLength={200}
                           />
                           {commentText.trim() && (
                              <button 
                                onClick={handleSendComment}
                                className="text-white bg-blue-500 hover:bg-blue-600 font-bold text-xs px-3 py-1.5 rounded-full transition-all duration-200 shadow-sm hover:shadow"
                              >
                                发送
                              </button>
                           )}
                        </div>
                     </div>
                     <div className="text-xs text-right opacity-50 mb-1">
                       {commentText.length}/200
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
