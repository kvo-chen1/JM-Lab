import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import postsApi, { Post } from '@/services/postService';
import { TianjinAvatar } from '@/components/TianjinStyleComponents';
import LazyImage from './LazyImage';
import LazyVideo from './LazyVideo';
import { toast } from 'sonner';
import WaterfallGallery, { GalleryItem } from './WaterfallGallery/WaterfallGallery';
import styles from './WaterfallGallery/WaterfallGallery.module.scss';
import type { UserProfile } from '@/lib/supabase';
import type { User as AuthUser } from '@/contexts/authContext';

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onLike: (id: string) => void;
  onComment: (id: string, content: string) => Promise<void>;
  onShare?: (id: string) => void;
  loading?: boolean;
  error?: string | null;
  currentUser?: UserProfile | AuthUser | null;
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
  currentUser,
}) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [commentText, setCommentText] = useState('');
  const [isImageFull, setIsImageFull] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Load related posts
  useEffect(() => {
    const loadRelated = async () => {
      if (post) {
        try {
          const all = await postsApi.getPosts();
          const related = all
            .filter(p => p.id !== post.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 12);
          setRelatedPosts(related);
        } catch (e) {
          console.error('Failed to load related posts', e);
        }
      }
    };
    loadRelated();
  }, [post]);

  // Reset state
  useEffect(() => {
    if (!isOpen) {
      setCommentText('');
      setIsImageFull(false);
    }
  }, [isOpen, post]);

  // Lock body scroll
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

  // 键盘无障碍支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isImageFull) setIsImageFull(false);
        else onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isImageFull, onClose]);

  // 点击遮罩关闭 (注意不要点击到内容)
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const handleSendComment = async () => {
    if (post && commentText.trim()) {
      await onComment(post.id, commentText);
      setCommentText('');
      toast.success('评论发送成功！');
    }
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  // 跳转到作者主页
  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post?.author) {
      const authorId = typeof post.author === 'object' ? post.author.id : post.author;
      // 简单判断是否是ID字符串
      if (authorId && authorId !== 'current-user') {
        navigate(`/author/${authorId}`);
      } else {
        // 如果没有ID或者是当前用户演示数据，可以跳到个人中心或提示
        navigate('/profile');
      }
    }
  };

  if (!isOpen) return null;

  // 转换相关作品为 GalleryItem
  const galleryItems: GalleryItem[] = relatedPosts.map(p => ({
    id: p.id,
    thumbnail: p.thumbnail,
    title: p.title,
    author: p.author,
    aspectRatio: Math.random() * (1.5 - 0.75) + 0.75
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto custom-scrollbar bg-black/65 backdrop-blur-sm" onClick={handleOverlayClick} ref={overlayRef}>
          {/* Close Button - Fixed Position */}
          <button 
            className="fixed top-6 right-6 z-[110] w-12 h-12 flex items-center justify-center rounded-full bg-transparent hover:bg-white/10 text-white transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="关闭详情页"
          >
            <i className="fas fa-times text-2xl drop-shadow-md"></i>
          </button>

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
            className="w-full min-h-screen flex flex-col items-center py-8 px-4 md:py-12 pointer-events-none"
          >
            {/* Card Content */}
            <div 
              className={`pointer-events-auto relative w-full max-w-[1000px] bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row mb-12 transition-colors duration-300`}
              ref={modalRef}
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
            >
              {loading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white dark:bg-gray-900">
                  <div className={styles.loader}><div className={styles.spinner}></div></div>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white dark:bg-gray-900 gap-4">
                  <p className="text-red-500">{error}</p>
                  <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-full">关闭</button>
                </div>
              )}

              {post && !loading && !error && (
                <>
                  {/* Left: Media Section (50-60% width) */}
                  <div className="w-full md:w-[55%] bg-gray-50 dark:bg-black relative group">
                    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center">
                       {/* Image/Video */}
                       {post.category === 'video' ? (
                         <div className="w-full h-full">
                           <LazyVideo 
                             ref={videoRef}
                             src={post.videoUrl || post.thumbnail}
                             poster={post.thumbnail}
                             alt={post.title}
                             className="w-full h-full object-contain"
                             controls={true}
                             autoPlay={false}
                             playsInline={true}
                           />
                         </div>
                       ) : (
                         <div 
                           className="w-full h-full cursor-zoom-in"
                           onClick={() => setIsImageFull(true)}
                         >
                           <LazyImage 
                             src={post.thumbnail} 
                             alt={post.title} 
                             className="w-full h-full object-cover md:rounded-l-[32px]"
                             priority={true}
                             quality="high"
                             bare
                           />
                         </div>
                       )}

                       {/* View Fullscreen Button Overlay */}
                       <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button 
                            className="w-10 h-10 bg-white/90 dark:bg-black/70 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsImageFull(true);
                            }}
                          >
                            <i className="fas fa-expand text-gray-800 dark:text-white text-sm"></i>
                          </button>
                       </div>
                    </div>
                  </div>

                  {/* Right: Info Section */}
                  <div className="w-full md:w-[45%] flex flex-col max-h-[800px] md:h-auto">
                    {/* Header Actions */}
                    <div className="px-6 py-6 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10">
                      <div className="flex gap-2">
                        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <i className="fas fa-ellipsis-h text-gray-700 dark:text-gray-300"></i>
                        </button>
                        <button 
                          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          onClick={() => onShare && onShare(post.id)}
                        >
                          <i className="fas fa-share-alt text-gray-700 dark:text-gray-300"></i>
                        </button>
                      </div>
                      <div className="flex gap-3">
                         <button 
                           onClick={() => onLike(post.id)}
                           className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
                             post.isLiked 
                               ? 'bg-red-500 text-white hover:bg-red-600' 
                               : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white'
                           }`}
                         >
                           {post.isLiked ? '已赞' : '点赞'}
                         </button>
                         <button className="px-5 py-2.5 rounded-full bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors shadow-sm">
                           保存
                         </button>
                      </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-4 custom-scrollbar">
                      {/* Title & Desc */}
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                        {post.title}
                      </h1>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 whitespace-pre-wrap">
                        {post.description || "暂无描述。"}
                      </p>

                      {/* Author */}
                      <div 
                        className="flex items-center gap-3 mb-6 cursor-pointer group/author"
                        onClick={handleAuthorClick}
                      >
                         <TianjinAvatar 
                           src={typeof post.author === 'object' ? (post.author?.avatar || '') : `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author || post.id}`}
                           alt="Author" 
                           size="md" 
                           className="group-hover/author:opacity-90 transition-opacity"
                         />
                         <div className="flex-1 min-w-0">
                           <div className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover/author:text-red-600 transition-colors">
                              {typeof post.author === 'object' ? post.author?.username : (post.author || '创作者')}
                           </div>
                           <div className="text-xs text-gray-500">
                              {post.views || 0} 浏览
                           </div>
                         </div>
                         <button 
                           className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold transition-colors"
                           onClick={(e) => {
                             e.stopPropagation();
                             // TODO: Implement follow logic
                             toast.success('已关注');
                           }}
                         >
                           关注
                         </button>
                      </div>

                      {/* Comments Header */}
                      <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          评论 <span className="text-sm font-normal text-gray-500">{post.commentCount || 0}</span>
                        </h3>
                        
                        {/* Comments List (Simplified) */}
                        <div className="space-y-4 mb-20">
                          {post.comments && post.comments.length > 0 ? (
                            post.comments.map(comment => (
                              <div key={comment.id} className="flex gap-2.5">
                                <TianjinAvatar 
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.id}`} 
                                  alt="User" 
                                  size="xs" 
                                />
                                <div className="flex-1">
                                   <div className="text-sm">
                                     <span className="font-bold mr-2">{currentUser?.username || '用户'}</span>
                                     <span className="text-gray-700 dark:text-gray-300">{comment.content}</span>
                                   </div>
                                   <div className="flex gap-3 mt-1 text-[10px] text-gray-500 font-medium">
                                      <span>{new Date(comment.date).toLocaleDateString()}</span>
                                      <button className="hover:text-gray-900 dark:hover:text-white">回复</button>
                                      <button className="hover:text-gray-900 dark:hover:text-white flex items-center gap-1">
                                        <i className="far fa-heart"></i> {comment.likes || 0}
                                      </button>
                                   </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-400 text-sm">
                              暂无评论，来抢沙发吧
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Sticky Comment Input */}
                    <div className="p-4 md:p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sticky bottom-0">
                      <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-3 transition-shadow focus-within:shadow-md focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900">
                         <TianjinAvatar 
                           src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=current`} 
                           alt="Me" 
                           size="xs" 
                         />
                         <input 
                           ref={commentInputRef}
                           value={commentText}
                           onChange={(e) => setCommentText(e.target.value)}
                           onKeyDown={handleCommentKeyDown}
                           placeholder="添加评论..."
                           className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500"
                         />
                         {commentText.trim() && (
                           <button 
                             onClick={handleSendComment}
                             className="text-red-600 font-bold text-sm px-2 hover:bg-red-50 rounded transition-colors"
                           >
                             发送
                           </button>
                         )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Related Works (Outside the card, white text on dark overlay) */}
            {post && !loading && !error && (
              <div className="w-full max-w-[1400px] pointer-events-auto px-4">
                <h3 className="text-xl font-bold text-white mb-6 text-center">更多精彩推荐</h3>
                <WaterfallGallery 
                  items={galleryItems}
                  onItemClick={(item) => {
                     // 简单跳转
                     window.location.href = `/square/${item.id}`;
                  }}
                  isLoading={false}
                />
              </div>
            )}
          </motion.div>

          {/* Fullscreen Preview Overlay */}
          <AnimatePresence>
            {isImageFull && post && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] bg-black flex items-center justify-center p-4 cursor-zoom-out"
                onClick={() => setIsImageFull(false)}
              >
                <img 
                  src={post.thumbnail} 
                  alt={post.title}
                  className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()} 
                />
                <button 
                  className="absolute top-6 right-6 text-white/80 hover:text-white p-2"
                  onClick={() => setIsImageFull(false)}
                >
                  <i className="fas fa-times text-3xl"></i>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PostDetailModal;
