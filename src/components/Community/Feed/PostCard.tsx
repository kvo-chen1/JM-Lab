import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Thread } from '@/pages/Community';
import { TianjinAvatar } from '@/components/TianjinStyleComponents';
import { HoverCard, FadeIn } from '@/components/Community/DesignSystem';
import { useAuth } from '@/hooks/useAuth';
import { FeedShareModal } from '@/components/feed/FeedShareModal';

interface PostCardProps {
  isDark: boolean;
  thread: Thread & { comments?: any[] };
  onUpvote: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAddComment: (threadId: string, content: string) => void;
  onClick: (id: string) => void;
  onDelete?: (id: string) => void;
  onDeleteComment?: (threadId: string, commentId: string) => void;
  isFavorited?: boolean;
  isLiked?: boolean;
  onToggleLike?: (id: string) => void;
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

// 判断是否为视频URL
const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext)) ||
         lowerUrl.includes('video') ||
         lowerUrl.includes('supabase.co/storage/v1/object/public') && !lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i);
};

// 视频缩略图组件 - 带错误处理
const VideoThumbnail = ({ videoUrl }: { videoUrl: string }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
        <div className="text-center">
          <i className="fas fa-video text-gray-400 text-2xl mb-2"></i>
          <p className="text-xs text-gray-500">视频加载失败</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
          <i className="fas fa-spinner fa-spin text-gray-400"></i>
        </div>
      )}
      <video
        src={videoUrl}
        className="w-full h-full object-cover"
        muted
        playsInline
        loop
        autoPlay
        preload="auto"
        onError={() => {
          console.warn('Video failed to load:', videoUrl);
          setHasError(true);
          setIsLoading(false);
        }}
        onLoadedData={() => setIsLoading(false)}
      />
    </>
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

  // 单张图片单独处理，不使用 grid
  if (images.length === 1) {
    const imageUrl = images[0];
    const isVideo = isVideoUrl(imageUrl);

    return (
      <div className="mt-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`relative rounded-xl overflow-hidden border group inline-block ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          } ${!isVideo ? 'cursor-zoom-in' : ''}`}
          onClick={(e) => {
            if (!isVideo) {
              e.stopPropagation();
              onImageClick(imageUrl);
            }
          }}
        >
          <div className="overflow-hidden bg-gray-100 dark:bg-gray-800 max-h-[360px]">
            {isVideo ? (
              <VideoThumbnail videoUrl={imageUrl} />
            ) : (
              <img
                src={imageUrl}
                alt="Post image"
                className="max-w-full max-h-[360px] w-auto h-auto object-contain transition-all duration-500 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  console.error('[PostCard] Image failed to load:', imageUrl);
                  const target = e.target as HTMLImageElement;
                  const svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="#e5e7eb"/><text x="50%" y="50%" font-family="Arial" font-size="20" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">图片已过期</text></svg>`;
                  target.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
                  target.style.objectFit = 'contain';
                }}
              />
            )}
          </div>
          {isVideo && (
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <i className="fas fa-video text-[10px]"></i>
              视频
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`mt-4 grid gap-2 ${getGridClass()}`}>
      {images.slice(0, 4).map((imageUrl, index) => {
        const isVideo = isVideoUrl(imageUrl);

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`relative rounded-xl overflow-hidden border group ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            } ${
              images.length === 3 && index === 0 ? 'col-span-2 row-span-1' : ''
            } ${
              images.length > 4 && index === 3 ? 'relative' : ''
            } ${!isVideo ? 'cursor-zoom-in' : ''}`}
            onClick={(e) => {
              if (!isVideo) {
                e.stopPropagation();
                onImageClick(imageUrl);
              }
            }}
          >
            <div className="overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-[4/3]">
              {isVideo ? (
                <VideoThumbnail videoUrl={imageUrl} />
              ) : (
                <img
                  src={imageUrl}
                  alt={`Post image ${index + 1}`}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => {
                    console.error('[PostCard] Image failed to load:', imageUrl);
                    // 显示内联 SVG 占位图
                    const target = e.target as HTMLImageElement;
                    const svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="#e5e7eb"/><text x="50%" y="50%" font-family="Arial" font-size="20" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">图片已过期</text></svg>`;
                    target.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
                    target.style.objectFit = 'contain';
                  }}
                />
              )}
            </div>
            {/* 视频标识 */}
            {isVideo && (
              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <i className="fas fa-video text-[10px]"></i>
                视频
              </div>
            )}
            {images.length > 4 && index === 3 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">+{images.length - 4}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </motion.div>
        );
      })}
    </div>
  );
};

// 视频列表组件
const VideoList = ({
  videos,
  isDark
}: {
  videos: string[];
  isDark: boolean;
}) => {
  return (
    <div className="mt-4 space-y-3">
      {videos.map((videoUrl, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`relative rounded-xl overflow-hidden border ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <video
            src={videoUrl}
            className="w-full max-h-[400px] object-contain bg-black"
            muted
            loop
            autoPlay
            playsInline
            preload="metadata"
            controls
          />
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
            视频
          </div>
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
  onDelete,
  onDeleteComment,
  isFavorited = false,
  isLiked = false,
  onToggleLike,
  index = 0
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // 调试日志
  console.log('[PostCard] thread:', {
    id: thread.id,
    title: thread.title,
    hasVideos: thread.videos && thread.videos.length > 0,
    videos: thread.videos,
    hasImages: thread.images && thread.images.length > 0,
    images: thread.images,
    firstImage: thread.images && thread.images.length > 0 ? thread.images[0] : null
  });

  const handleCommentSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (commentContent.trim()) {
      onAddComment(thread.id, commentContent.trim());
      setCommentContent('');
      setShowCommentInput(false);
    }
  }, [commentContent, thread.id, onAddComment]);

  const isAuthor = currentUser?.id === thread.authorId;

  const moreMenuItems = [
    ...(isAuthor && onDelete ? [{ icon: 'fas fa-trash-alt', label: '删除帖子', onClick: () => onDelete(thread.id), danger: true }] : []),
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
        onClick={() => onClick(thread.id)}
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
                <div 
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    thread.authorId && navigate(`/author/${thread.authorId}`);
                  }}
                >
                  <TianjinAvatar 
                    size="md" 
                    src={thread.authorAvatar || ''} 
                    alt={thread.author || '创作者'} 
                    className="w-10 h-10 hover:ring-2 hover:ring-blue-400 transition-all"
                  />
                </div>
              </HoverCard>
              <div className="flex flex-col min-w-0">
                <span 
                  className={`font-semibold text-sm truncate cursor-pointer hover:text-blue-500 transition-colors ${isDark ? 'text-gray-200' : 'text-gray-900'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    thread.authorId && navigate(`/author/${thread.authorId}`);
                  }}
                >
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

            {/* Post Videos */}
            {thread.videos && thread.videos.length > 0 && (
              <VideoList
                videos={thread.videos}
                isDark={isDark}
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
                  setShowShareModal(true);
                  setShowMoreMenu(false);
                }}
              />
            </div>

            {/* Right: Like + Favorite + More */}
            <div className="flex items-center gap-1">
              {/* 点赞按钮 */}
              {onToggleLike && (
                <ActionButton 
                  icon={isLiked ? 'fas fa-heart' : 'far fa-heart'}
                  label={isLiked ? '已点赞' : '点赞'}
                  count={thread.likes || 0}
                  isDark={isDark}
                  onClick={(e) => { e.stopPropagation(); onToggleLike(thread.id); }}
                  isActive={isLiked}
                  activeColor="text-pink-500"
                />
              )}
              
              {/* 收藏按钮 */}
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
                    <TianjinAvatar size="sm" src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.id || 'current'}`} alt="当前用户" className="w-9 h-9 mt-0.5" />
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
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.08 }}
                          className={`flex gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-white hover:bg-gray-50'} transition-all duration-200 group`}
                        >
                          {/* 头像 */}
                          <div className="flex-shrink-0">
                            <div 
                              className={`w-7 h-7 rounded-full overflow-hidden ring-2 ${isDark ? 'ring-gray-600' : 'ring-gray-200'} group-hover:ring-blue-300 transition-all cursor-pointer`}
                              onClick={(e) => {
                                e.stopPropagation();
                                (comment.userId || comment.authorId) && navigate(`/author/${comment.userId || comment.authorId}`);
                              }}
                            >
                              <img 
                                src={comment.authorAvatar || comment.userAvatar || comment.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId || comment.id}`}
                                alt={comment.user || comment.author || '用户'}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          
                          {/* 内容 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span 
                                  className={`text-sm font-bold cursor-pointer hover:text-blue-500 transition-colors ${isDark ? 'text-gray-200' : 'text-gray-900'}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    (comment.userId || comment.authorId) && navigate(`/author/${comment.userId || comment.authorId}`);
                                  }}
                                >
                                  {comment.user || comment.author || '用户'}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {comment.date ? new Date(comment.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : ''}
                                </span>
                              </div>
                              {/* 删除评论按钮 */}
                              {onDeleteComment && (currentUser?.id === comment.userId || currentUser?.id === comment.authorId) && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('确定要删除这条评论吗？')) {
                                      onDeleteComment(thread.id, comment.id);
                                    }
                                  }}
                                  className={`text-xs px-2 py-1 rounded transition-colors ${
                                    isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                                  }`}
                                >
                                  <i className="fas fa-trash-alt mr-1"></i>
                                  删除
                                </motion.button>
                              )}
                            </div>
                            <p className={`text-sm leading-relaxed line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {comment.content}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                      {thread.comments.length > 3 && (
                        <motion.button 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          whileHover={{ x: 5 }}
                          className={`flex items-center gap-1 text-sm font-medium ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors mt-2`}
                          onClick={(e) => { e.stopPropagation(); onClick(thread.id); }}
                        >
                          <span>查看全部 {thread.comments.length} 条评论</span>
                          <i className="fas fa-arrow-right text-xs"></i>
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

      {/* 分享弹窗 */}
      <FeedShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        feed={{
          id: thread.id,
          title: thread.title,
          content: thread.content,
          media: [
            ...(thread.images?.map(img => ({ url: img, type: 'image' as const })) || []),
            ...(thread.videos?.map(video => ({ url: video, type: 'video' as const, thumbnailUrl: video.replace(/\.[^/.]+$/, '_thumb.jpg') })) || [])
          ],
          author: {
            id: thread.authorId || '',
            name: thread.author || '未知用户',
            avatar: thread.authorAvatar || ''
          },
          createdAt: thread.createdAt,
          likes: thread.upvotes || 0,
          comments: thread.comments?.length || 0,
          shares: 0,
          isLiked: isLiked,
          isCollected: isFavorited
        }}
        onShareSuccess={() => {
          setShowShareModal(false);
        }}
      />
    </>
  );
};

export default PostCard;
