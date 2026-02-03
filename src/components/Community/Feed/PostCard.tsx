import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Thread } from '@/pages/Community';
import { TianjinAvatar } from '@/components/TianjinStyleComponents';

interface PostCardProps {
  isDark: boolean;
  thread: Thread & { comments?: any[] };
  onUpvote: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAddComment: (threadId: string, content: string) => void;
  onClick: (id: string) => void;
  isFavorited?: boolean;
}

// Lightbox 组件
const ImageLightbox = ({ src, onClose }: { src: string; onClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.img
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        src={src}
        alt="Full size"
        className="max-w-full max-h-full object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-white/10"
      >
        <i className="fas fa-times text-2xl"></i>
      </button>
    </motion.div>
  );
};

export const PostCard: React.FC<PostCardProps> = ({
  isDark,
  thread,
  onUpvote,
  onToggleFavorite,
  onAddComment,
  onClick,
  isFavorited = false
}) => {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentContent.trim()) {
      onAddComment(thread.id, commentContent.trim());
      setCommentContent('');
      setShowCommentInput(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {lightboxImage && (
          <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />
        )}
      </AnimatePresence>

      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        onClick={() => onClick(thread.id)}
        className={`flex flex-col md:flex-row rounded-xl overflow-hidden border mb-4 cursor-pointer transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:shadow-xl' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xl'}`}
        data-testid="post-card"
      >
        {/* Desktop Left Vote Column */}
        <div className={`hidden md:flex w-12 flex-col items-center p-3 gap-1 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => { e.stopPropagation(); onUpvote(thread.id); }}
            className={`p-2 rounded-full hover:bg-gray-200/20 transition-colors ${isDark ? 'text-gray-400 hover:text-orange-500' : 'text-gray-500 hover:text-orange-600'}`}
            data-testid="like-button"
          >
            <i className="fas fa-arrow-up text-lg"></i>
          </motion.button>
          <span className={`text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-900'}`} data-testid="like-count">
            {thread.upvotes || 0}
          </span>
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => e.stopPropagation()}
            className={`p-2 rounded-full hover:bg-gray-200/20 transition-colors ${isDark ? 'text-gray-400 hover:text-blue-500' : 'text-gray-500 hover:text-blue-600'}`}
          >
            <i className="fas fa-arrow-down text-lg"></i>
          </motion.button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="p-4">
            {/* Header: User & Time */}
            <div className="flex items-center gap-2 mb-2 text-xs">
              <TianjinAvatar size="xs" src={thread.authorAvatar || ''} alt={thread.author || '创作者'} className="w-8 h-8" />
              <div className="flex flex-col">
                <span className={`font-bold text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {thread.author || '用户'}
                </span>
                <div className="flex items-center gap-1 text-xs">
                  <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {new Date(thread.createdAt).toLocaleDateString()}
                  </span>
                  {thread.topic && (
                    <>
                      <span className={`${isDark ? 'text-gray-600' : 'text-gray-400'}`}>•</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${isDark ? 'bg-gray-700 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>
                        {thread.topic}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Title */}
            <h3 className={`text-lg font-bold mb-2 leading-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {thread.title}
            </h3>

            {/* Content Preview */}
            <div className={`text-sm mb-4 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {thread.content}
            </div>

            {/* Post Images */}
            {thread.images && thread.images.length > 0 && (
              <div className={`mt-3 grid gap-2 ${thread.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {thread.images.map((imageUrl, index) => (
                  <div 
                    key={index} 
                    className={`relative rounded-xl overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-100'} ${thread.images!.length === 3 && index === 0 ? 'col-span-2' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxImage(imageUrl);
                    }}
                  >
                    <img 
                      src={imageUrl} 
                      alt={`Post image ${index + 1}`} 
                      className="w-full h-48 md:h-64 object-cover transition-transform duration-500 hover:scale-105 cursor-zoom-in"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Action Bar / Desktop Footer */}
          <div className={`flex items-center justify-between px-4 py-3 mt-auto ${isDark ? 'bg-gray-800/50 border-t border-gray-700' : 'bg-gray-50 border-t border-gray-100'}`}>
            
            {/* Mobile Vote Buttons (Hidden on Desktop) */}
            <div className="flex md:hidden items-center gap-1 bg-gray-200/20 dark:bg-gray-700/50 rounded-full px-2 py-1">
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={(e) => { e.stopPropagation(); onUpvote(thread.id); }}
                className={`p-1.5 rounded-full ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              >
                <i className="fas fa-arrow-up"></i>
              </motion.button>
              <span className={`text-xs font-bold px-1 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                {thread.upvotes || 0}
              </span>
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={(e) => e.stopPropagation()}
                className={`p-1.5 rounded-full ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              >
                <i className="fas fa-arrow-down"></i>
              </motion.button>
            </div>

            <div className="flex items-center gap-4">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setShowCommentInput(!showCommentInput); 
                }}
                className={`flex items-center gap-2 text-xs md:text-sm font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <i className="far fa-comment-alt text-lg"></i>
                <span>{thread.comments?.length || 0}</span>
                <span className="hidden sm:inline">评论</span>
              </motion.button>
              
              <div className="relative">
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setShowShareMenu(!showShareMenu); 
                    setShowMoreMenu(false);
                  }}
                  className={`flex items-center gap-2 text-xs md:text-sm font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  <i className="far fa-share-square text-lg"></i>
                  <span className="hidden sm:inline">分享</span>
                </motion.button>
                
                {/* 分享菜单 */}
                {showShareMenu && (
                  <div className={`absolute bottom-full right-0 mb-2 w-48 rounded-lg shadow-lg z-50 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border p-2`}>
                    <div className="flex flex-col space-y-1">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          // 复制链接到剪贴板
                          navigator.clipboard.writeText(window.location.origin + `/community/post/${thread.id}`);
                          setShowShareMenu(false);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        <i className="fas fa-link"></i>
                        <span>复制链接</span>
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setShowShareMenu(false);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        <i className="fab fa-weixin"></i>
                        <span>微信分享</span>
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setShowShareMenu(false);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        <i className="fas fa-envelope"></i>
                        <span>邮件分享</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
                <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(thread.id); }}
                    className={`flex items-center gap-2 text-xs md:text-sm font-medium transition-colors ${isFavorited ? 'text-yellow-500' : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800')}`}
                >
                    <i className={`${isFavorited ? 'fas' : 'far'} fa-bookmark text-lg`}></i>
                    <span className="hidden sm:inline">{isFavorited ? '已收藏' : '收藏'}</span>
                </motion.button>
                
                <div className="relative">
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setShowMoreMenu(!showMoreMenu); 
                          setShowShareMenu(false);
                        }}
                        className={`flex items-center gap-2 text-xs md:text-sm font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                        <i className="fas fa-ellipsis-h text-lg"></i>
                    </motion.button>
                    
                    {/* 更多选项菜单 */}
                    {showMoreMenu && (
                      <div className={`absolute bottom-full right-0 mb-2 w-48 rounded-lg shadow-lg z-50 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border p-2`}>
                        <div className="flex flex-col space-y-1">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setShowMoreMenu(false);
                            }}
                            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                          >
                            <i className="fas fa-history"></i>
                            <span>查看编辑历史</span>
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setShowMoreMenu(false);
                            }}
                            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                          >
                            <i className="fas fa-flag"></i>
                            <span>举报</span>
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setShowMoreMenu(false);
                            }}
                            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                          >
                            <i className="fas fa-ban"></i>
                            <span>屏蔽作者</span>
                          </button>
                        </div>
                      </div>
                    )}
                </div>
            </div>
          </div>
          
          {/* Comment Input Section */}
          <AnimatePresence>
            {showCommentInput && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`overflow-hidden border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'}`}
              >
                <div className="p-3">
                  <form onSubmit={handleCommentSubmit} className="flex gap-3">
                    <TianjinAvatar size="xs" src="" alt="当前用户" className="w-8 h-8 mt-1" />
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="写下你的评论..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        className={`w-full pl-4 pr-12 py-2.5 rounded-xl text-sm ${isDark ? 'bg-gray-700 text-white border-transparent focus:bg-gray-600' : 'bg-white text-gray-900 border-gray-200 focus:bg-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!commentContent.trim()}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${commentContent.trim() ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-400'}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <i className="fas fa-paper-plane"></i>
                      </button>
                    </div>
                  </form>
                  
                  {/* Latest Comments Preview */}
                  {thread.comments && thread.comments.length > 0 && (
                    <div className="mt-4 space-y-3 px-11">
                      {thread.comments.slice(0, 3).map((comment, index) => (
                        <div key={comment.id || index} className="flex gap-2">
                          <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                            {comment.user}:
                          </span>
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {comment.content}
                          </span>
                        </div>
                      ))}
                      {thread.comments.length > 3 && (
                        <button 
                          className={`text-xs font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
                          onClick={(e) => { e.stopPropagation(); onClick(thread.id); }}
                        >
                          查看全部 {thread.comments.length} 条评论
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
};
