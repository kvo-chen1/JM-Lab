import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Thread } from '@/pages/Community';
import { TianjinAvatar } from '@/components/TianjinStyleComponents';
import { HoverCard, FadeIn } from '@/components/Community/DesignSystem';

interface PostCardProps {
  isDark: boolean;
  thread: Thread & { comments?: any[] };
  onUpvote: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAddComment: (threadId: string, content: string) => void;
  onClick: (id: string) => void;
  isFavorited?: boolean;
  index?: number;
}

// Lightbox 组件
const ImageLightbox = ({ src, onClose }: { src: string; onClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.img
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
        src={src}
        alt="Full size"
        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        onClick={onClose}
        className="absolute top-6 right-6 text-white p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <i className="fas fa-times text-xl"></i>
      </motion.button>
    </motion.div>
  );
};

// 图片网格组件
const ImageGrid = ({ 
  images, 
  isDark, 
  onImageClick 
}: { 
  images: string[]; 
  isDark: boolean;
  onImageClick: (url: string) => void;
}) => {
  const getGridClass = () => {
    switch (images.length) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-2 grid-rows-2';
      case 4: return 'grid-cols-2 grid-rows-2';
      default: return 'grid-cols-2 grid-rows-2';
    }
  };

  return (
    <div className={`mt-4 grid gap-2 ${getGridClass()}`}>
      {images.slice(0, 4).map((imageUrl, index) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className={`relative rounded-xl overflow-hidden border cursor-zoom-in group ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          } ${
            images.length === 3 && index === 0 ? 'col-span-2 row-span-1' : ''
          } ${
            images.length > 4 && index === 3 ? 'relative' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onImageClick(imageUrl);
          }}
        >
          <div className="aspect-[4/3] overflow-hidden">
            <img 
              src={imageUrl} 
              alt={`Post image ${index + 1}`} 
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
              loading="lazy"
            />
          </div>
          {images.length > 4 && index === 3 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">+{images.length - 4}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </motion.div>
      ))}
    </div>
  );
};

// 投票按钮组件
const VoteButtons = ({ 
  upvotes, 
  isDark, 
  onUpvote,
  isVertical = true 
}: { 
  upvotes: number; 
  isDark: boolean;
  onUpvote: (e: React.MouseEvent) => void;
  isVertical?: boolean;
}) => {
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasVoted(!hasVoted);
    onUpvote(e);
  };

  if (isVertical) {
    return (
      <div className={`hidden md:flex w-14 flex-col items-center p-3 gap-2 rounded-l-xl ${
        isDark ? 'bg-gray-800/30' : 'bg-gray-50/50'
      }`}>
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          onClick={handleVote}
          className={`p-2 rounded-xl transition-all duration-200 ${
            hasVoted 
              ? 'text-orange-500 bg-orange-500/10' 
              : `${isDark ? 'text-gray-400 hover:text-orange-500 hover:bg-gray-700' : 'text-gray-500 hover:text-orange-600 hover:bg-gray-200'}`
          }`}
        >
          <i className="fas fa-arrow-up text-lg"></i>
        </motion.button>
        <motion.span 
          key={upvotes}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className={`text-sm font-bold ${
            hasVoted ? 'text-orange-500' : (isDark ? 'text-gray-300' : 'text-gray-900')
          }`}
        >
          {upvotes || 0}
        </motion.span>
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          onClick={(e) => e.stopPropagation()}
          className={`p-2 rounded-xl transition-all duration-200 ${
            isDark ? 'text-gray-400 hover:text-blue-500 hover:bg-gray-700' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-200'
          }`}
        >
          <i className="fas fa-arrow-down text-lg"></i>
        </motion.button>
      </div>
    );
  }

  return (
    <div className={`flex md:hidden items-center gap-1 rounded-full px-2 py-1 ${
      isDark ? 'bg-gray-700/50' : 'bg-gray-100'
    }`}>
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={handleVote}
        className={`p-1.5 rounded-full transition-colors ${
          hasVoted ? 'text-orange-500' : (isDark ? 'text-gray-400' : 'text-gray-500')
        }`}
      >
        <i className="fas fa-arrow-up text-sm"></i>
      </motion.button>
      <span className={`text-xs font-bold px-1 ${
        hasVoted ? 'text-orange-500' : (isDark ? 'text-gray-300' : 'text-gray-900')
      }`}>
        {upvotes || 0}
      </span>
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={(e) => e.stopPropagation()}
        className={`p-1.5 rounded-full transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
      >
        <i className="fas fa-arrow-down text-sm"></i>
      </motion.button>
    </div>
  );
};

// 操作按钮组件
const ActionButton = ({ 
  icon, 
  label, 
  count, 
  isDark, 
  onClick,
  isActive = false,
  activeColor = 'text-blue-500'
}: { 
  icon: string;
  label?: string;
  count?: number;
  isDark: boolean;
  onClick: (e: React.MouseEvent) => void;
  isActive?: boolean;
  activeColor?: string;
}) => (
  <motion.button 
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`flex items-center gap-1.5 text-xs md:text-sm font-medium transition-all duration-200 px-2 py-1 rounded-lg ${
      isActive 
        ? activeColor 
        : (isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100')
    }`}
  >
    <i className={`${icon} text-base`}></i>
    {count !== undefined && <span>{count}</span>}
    {label && <span className="hidden sm:inline">{label}</span>}
  </motion.button>
);

// 下拉菜单组件
const DropdownMenu = ({ 
  isOpen, 
  onClose, 
  items, 
  isDark 
}: { 
  isOpen: boolean;
  onClose: () => void;
  items: { icon: string; label: string; onClick: () => void; danger?: boolean }[];
  isDark: boolean;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className={`absolute bottom-full right-0 mb-2 w-52 rounded-xl shadow-xl z-50 overflow-hidden ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}
          >
            <div className="py-1">
              {items.map((item, index) => (
                <button 
                  key={index}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    item.onClick();
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    item.danger 
                      ? (isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50')
                      : (isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')
                  }`}
                >
                  <i className={`${item.icon} w-4`}></i>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const PostCard: React.FC<PostCardProps> = ({
  isDark,
  thread,
  onUpvote,
  onToggleFavorite,
  onAddComment,
  onClick,
  isFavorited = false,
  index = 0
}) => {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCommentSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (commentContent.trim()) {
      onAddComment(thread.id, commentContent.trim());
      setCommentContent('');
      setShowCommentInput(false);
    }
  }, [commentContent, thread.id, onAddComment]);

  const handleShare = useCallback((type: string) => {
    const url = `${window.location.origin}/community/post/${thread.id}`;
    switch (type) {
      case 'copy':
        navigator.clipboard.writeText(url);
        break;
      case 'weixin':
        // 微信分享逻辑
        break;
      case 'weibo':
        window.open(`https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(thread.title)}`);
        break;
    }
    setShowShareMenu(false);
  }, [thread.id, thread.title]);

  const shareMenuItems = [
    { icon: 'fas fa-link', label: '复制链接', onClick: () => handleShare('copy') },
    { icon: 'fab fa-weixin', label: '微信分享', onClick: () => handleShare('weixin') },
    { icon: 'fab fa-weibo', label: '微博分享', onClick: () => handleShare('weibo') },
  ];

  const moreMenuItems = [
    { icon: 'fas fa-history', label: '查看编辑历史', onClick: () => {} },
    { icon: 'fas fa-flag', label: '举报内容', onClick: () => {}, danger: true },
    { icon: 'fas fa-ban', label: '屏蔽作者', onClick: () => {}, danger: true },
  ];

  const contentPreview = thread.content?.slice(0, 200);
  const hasMoreContent = thread.content?.length > 200;

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
        transition={{ delay: index * 0.05, duration: 0.3 }}
        className={`group relative flex flex-col md:flex-row rounded-2xl overflow-hidden border mb-4 cursor-pointer transition-all duration-300 ${
          isDark 
            ? 'bg-gray-800/80 border-gray-700/50 hover:border-gray-600 hover:shadow-xl hover:shadow-black/20' 
            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-200/50'
        }`}
        data-testid="post-card"
      >
        {/* Desktop Left Vote Column */}
        <VoteButtons 
          upvotes={thread.upvotes || 0} 
          isDark={isDark} 
          onUpvote={(e) => onUpvote(thread.id)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 md:p-5">
            {/* Header: User & Time */}
            <div className="flex items-center gap-3 mb-3">
              <HoverCard scale={1.1}>
                <TianjinAvatar 
                  size="md" 
                  src={thread.authorAvatar || ''} 
                  alt={thread.author || '创作者'} 
                  className="w-10 h-10 ring-2 ring-offset-2 ring-offset-transparent ring-gray-200 dark:ring-gray-700"
                />
              </HoverCard>
              <div className="flex flex-col min-w-0">
                <span className={`font-semibold text-sm truncate ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {thread.author || '用户'}
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                    {new Date(thread.createdAt).toLocaleDateString('zh-CN', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {thread.topic && (
                    <>
                      <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>•</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                        isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                      }`}>
                        #{thread.topic}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Title */}
            <h3 className={`text-lg md:text-xl font-bold mb-3 leading-snug line-clamp-2 group-hover:text-blue-500 transition-colors ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {thread.title}
            </h3>

            {/* Content Preview */}
            <div className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <p className={!isExpanded && hasMoreContent ? 'line-clamp-3' : ''}>
                {isExpanded ? thread.content : contentPreview}
              </p>
              {hasMoreContent && (
                <button
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                  className={`mt-2 text-sm font-medium hover:underline ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}
                >
                  {isExpanded ? '收起' : '展开更多'}
                </button>
              )}
            </div>

            {/* Post Images */}
            {thread.images && thread.images.length > 0 && (
              <ImageGrid 
                images={thread.images} 
                isDark={isDark}
                onImageClick={setLightboxImage}
              />
            )}
          </div>

          {/* Action Bar */}
          <div className={`flex items-center justify-between px-4 py-3 mt-auto border-t ${
            isDark ? 'border-gray-700/50 bg-gray-800/30' : 'border-gray-100 bg-gray-50/50'
          }`}>
            {/* Left: Mobile Vote + Comments */}
            <div className="flex items-center gap-3">
              <VoteButtons 
                upvotes={thread.upvotes || 0} 
                isDark={isDark} 
                onUpvote={(e) => onUpvote(thread.id)}
                isVertical={false}
              />
              
              <ActionButton 
                icon="far fa-comment-alt"
                label="评论"
                count={thread.comments?.length || 0}
                isDark={isDark}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setShowCommentInput(!showCommentInput); 
                }}
                isActive={showCommentInput}
              />
            </div>

            {/* Center: Share */}
            <div className="relative">
              <ActionButton 
                icon="far fa-share-square"
                label="分享"
                isDark={isDark}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setShowShareMenu(!showShareMenu);
                  setShowMoreMenu(false);
                }}
              />
              <DropdownMenu 
                isOpen={showShareMenu}
                onClose={() => setShowShareMenu(false)}
                items={shareMenuItems}
                isDark={isDark}
              />
            </div>

            {/* Right: Favorite + More */}
            <div className="flex items-center gap-1">
              <ActionButton 
                icon={isFavorited ? 'fas fa-bookmark' : 'far fa-bookmark'}
                label={isFavorited ? '已收藏' : '收藏'}
                isDark={isDark}
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(thread.id); }}
                isActive={isFavorited}
                activeColor="text-yellow-500"
              />
              
              <div className="relative">
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setShowMoreMenu(!showMoreMenu);
                    setShowShareMenu(false);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <i className="fas fa-ellipsis-h"></i>
                </motion.button>
                <DropdownMenu 
                  isOpen={showMoreMenu}
                  onClose={() => setShowMoreMenu(false)}
                  items={moreMenuItems}
                  isDark={isDark}
                />
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
                transition={{ duration: 0.2 }}
                className={`overflow-hidden border-t ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50'}`}
              >
                <div className="p-4">
                  <form onSubmit={handleCommentSubmit} className="flex gap-3">
                    <TianjinAvatar size="sm" src="" alt="当前用户" className="w-9 h-9 mt-0.5" />
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="写下你的评论..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        className={`w-full pl-4 pr-14 py-3 rounded-xl text-sm transition-all ${
                          isDark 
                            ? 'bg-gray-700 text-white border-transparent focus:bg-gray-600 placeholder-gray-500' 
                            : 'bg-white text-gray-900 border-gray-200 focus:bg-white placeholder-gray-400'
                        } border focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      <motion.button
                        type="submit"
                        disabled={!commentContent.trim()}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                          commentContent.trim() 
                            ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10' 
                            : 'text-gray-400'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <i className="fas fa-paper-plane"></i>
                      </motion.button>
                    </div>
                  </form>
                  
                  {/* Latest Comments Preview */}
                  {thread.comments && thread.comments.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {thread.comments.slice(0, 3).map((comment, idx) => (
                        <motion.div 
                          key={comment.id || idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex gap-2 items-start"
                        >
                          <span className={`text-xs font-semibold shrink-0 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                            {comment.user}
                          </span>
                          <span className={`text-xs line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {comment.content}
                          </span>
                        </motion.div>
                      ))}
                      {thread.comments.length > 3 && (
                        <motion.button 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`text-xs font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
                          onClick={(e) => { e.stopPropagation(); onClick(thread.id); }}
                        >
                          查看全部 {thread.comments.length} 条评论 →
                        </motion.button>
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

export default PostCard;
