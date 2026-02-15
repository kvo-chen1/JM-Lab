import React, { useCallback, memo, useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Post } from '../services/postService'
import LazyImage from './LazyImage'
import { TianjinAvatar } from './TianjinStyleComponents'

interface PostGridProps {
  posts: Post[]
  onLike: (postId: string) => void
  onComment: (postId: string) => void
  onShare: (postId: string) => void
  onBookmark: (postId: string) => void
  onDelete: (postId: string) => void
  onPostClick: (postId: string) => void
  favorites: string[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  isDark?: boolean
}

// 斐波那契数列间距
const GAP_FIB = {
  sm: 8,  // 移动端
  md: 13, // 平板
  lg: 21, // 桌面
  xl: 34  // 大屏
};

// 单个帖子项组件
interface PostItemProps {
  post: Post
  index: number
  onLike: (postId: string) => void
  onComment: (postId: string) => void
  onShare: (postId: string) => void
  onBookmark: (postId: string) => void
  onDelete: (postId: string) => void
  onPostClick: (postId: string) => void
  favorites: string[]
  isDark: boolean
  style?: React.CSSProperties
  columnWidth: number
}

const PostItem = memo(({ post, index, onLike, onComment, onShare, onBookmark, onDelete, onPostClick, favorites, isDark, style, columnWidth }: PostItemProps) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  


  useEffect(() => {
    // 滚动触发：每行卡片依次淡入（stagger间隔0.15s）
    // 这里简单使用 index 进行延迟计算，更精确的行内 stagger 需要复杂计算
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, (index % 5) * 150); 
    return () => clearTimeout(timer);
  }, [index]);

  const handlePostClick = useCallback(() => {
    onPostClick(post.id)
  }, [post.id, onPostClick])

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onLike(post.id)
  }, [onLike, post.id])

  const handleComment = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onComment(post.id)
  }, [onComment, post.id])

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onShare(post.id)
  }, [onShare, post.id])

  const handleBookmark = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onBookmark(post.id)
  }, [onBookmark, post.id])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('确定要删除这个作品吗？')) {
      onDelete(post.id)
    }
  }, [onDelete, post.id])

  const isBookmarked = favorites.includes(post.id)
  // 判断是否是视频：根据类型、category、videoUrl 或 thumbnail 的扩展名
  const isVideo = post.type === 'video' || post.category === 'video' || post.videoUrl ||
    (post.thumbnail && (post.thumbnail.endsWith('.mp4') || post.thumbnail.endsWith('.webm') || post.thumbnail.endsWith('.mov')))

  // 调试日志
  if (isVideo) {
    console.log('Video post in PostGrid:', {
      id: post.id,
      title: post.title,
      thumbnail: post.thumbnail,
      videoUrl: post.videoUrl,
      category: post.category
    });
  }

  // 视频加载错误处理
  const handleVideoError = () => {
    console.warn('Video failed to load:', post.videoUrl);
    setVideoError(true);
  };

  // 高级卡片悬停效果：更细腻的位移和多层阴影
  const hoverClasses = "hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),0_12px_24px_-8px_rgba(0,0,0,0.15)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]";
  
  // 视觉风格：更高级的渐变和边框效果
  const cardBg = isDark 
    ? 'bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900 border border-slate-700/50 hover:border-slate-600' 
    : 'bg-white border border-gray-100/80 hover:border-gray-200/60';

  return (
    <div
      className={`relative rounded-2xl overflow-hidden cursor-pointer ${cardBg} ${hoverClasses} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} group`}
      style={{
        ...style,
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out, box-shadow 0.5s cubic-bezier(0.34,1.56,0.64,1), border-color 0.3s ease',
      }}
      onClick={handlePostClick}
    >
      {/* 媒体内容 */}
      <div className="relative w-full overflow-hidden">
        {/* 获取视频URL：优先使用 videoUrl，否则使用 thumbnail（如果是视频） */}
        {(() => {
          const videoSrc = post.videoUrl || 
            (post.thumbnail && (post.thumbnail.endsWith('.mp4') || post.thumbnail.endsWith('.webm') || post.thumbnail.endsWith('.mov')) ? post.thumbnail : null);
          
          if (isVideo && videoSrc && !videoError) {
            return (
              <div className="relative bg-gray-100 dark:bg-gray-800 aspect-video">
                {/* 视频自动循环播放 */}
                <video
                  ref={videoRef}
                  src={videoSrc}
                  className="absolute inset-0 w-full h-full object-cover"
                  muted
                  playsInline
                  loop
                  autoPlay
                  preload="metadata"
                  onError={handleVideoError}
                />

                {/* 视频标识 */}
                <div className="absolute top-2 right-2 z-10">
                  <span className="text-[10px] px-2 py-1 rounded-full bg-black/60 text-white flex items-center gap-1">
                    <i className="fas fa-video"></i>
                    视频
                  </span>
                </div>
              </div>
            );
          }
          
          // 调试：检查缩略图URL
          console.log('[PostGrid] Rendering thumbnail:', { 
            id: post.id, 
            title: post.title, 
            thumbnail: post.thumbnail,
            hasThumbnail: !!post.thumbnail,
            thumbnailLength: post.thumbnail?.length
          });
          
          // 使用内联 SVG 作为 fallback，避免外部服务不稳定
          // 使用英文文本避免编码问题
          const safeTitle = (post.title?.slice(0, 10) || 'Work').replace(/[^\x00-\x7F]/g, '?');
          const svgText = safeTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          const svgContent = `<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="600" height="400" fill="#3b82f6"/><text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">${svgText}</text></svg>`;
          const fallbackSvg = `data:image/svg+xml;base64,${btoa(svgContent)}`;
          
          return (
            <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-800">
              <LazyImage 
                src={post.thumbnail || ''}  
                alt={post.title}
                className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                priority={index < 5}
                quality={index < 6 ? 'high' : 'medium'}
                placeholder="skeleton"
                loadingAnimation="fade"
                fit="cover"
                bare
                fallbackSrc={fallbackSvg}
              />
              {/* 图片悬停时的光晕效果 */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/5 group-hover:to-pink-500/10 transition-all duration-700 opacity-0 group-hover:opacity-100 pointer-events-none" />
            </div>
          );
        })()}
        
        {/* 渐变遮罩 - 从底部向上 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* 悬停操作按钮 - 从底部滑入 */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
            <button
              onClick={handleLike}
              className={`w-11 h-11 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-sm ${
                post.isLiked
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-white/95 text-gray-900 hover:bg-white'
              }`}
              title={post.isLiked ? '取消点赞' : '点赞'}
            >
              <i className={`${post.isLiked ? 'fas' : 'far'} fa-heart text-sm`}></i>
            </button>
            <button 
              onClick={handleBookmark} 
              className="w-11 h-11 rounded-full bg-white/95 text-gray-900 flex items-center justify-center hover:scale-110 hover:bg-white transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-sm" 
              title="收藏"
            >
              <i className={`${isBookmarked ? 'fas text-amber-500' : 'far text-gray-600'} fa-bookmark text-sm`}></i>
            </button>
            <button 
              onClick={handleShare} 
              className="w-11 h-11 rounded-full bg-white/95 text-gray-900 flex items-center justify-center hover:scale-110 hover:bg-white transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-sm" 
              title="分享"
            >
              <i className="fas fa-share text-blue-500 text-sm"></i>
            </button>
        </div>
      </div>
      
      {/* 卡片内容 */}
      <div className="p-4">
        {/* 标题：更精致的字体样式 */}
        <h3 className={`font-semibold text-[15px] mb-2 line-clamp-2 leading-snug tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-800'} group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300`}>
          {post.title}
        </h3>
        
        {/* 标签 - 更精致的样式 */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 2).map((tag, i) => (
              <span 
                key={i} 
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${isDark ? 'bg-slate-700/60 text-slate-300' : 'bg-gray-100 text-gray-600'}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* 元信息 - 更优雅的排版 */}
        <div className={`flex items-center justify-between pt-3 mt-2 border-t ${isDark ? 'border-slate-700/50' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2.5">
            <div 
              className="relative cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                const authorId = typeof post.author === 'object' ? post.author?.id : post.authorId || post.userId;
                authorId && navigate(`/author/${authorId}`);
              }}
            >
              <TianjinAvatar
                src={typeof post.author === 'object' ? post.author?.avatar || '' : `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author || post.id}`}
                size="xs"
                alt="author"
                className="border-2 border-white dark:border-slate-600 shadow-md hover:ring-2 hover:ring-blue-400 transition-all"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
            </div>
            <span 
              className={`text-xs font-medium truncate max-w-[90px] cursor-pointer hover:text-blue-500 transition-colors ${isDark ? 'text-slate-300' : 'text-gray-700'}`}
              onClick={(e) => {
                e.stopPropagation();
                const authorId = typeof post.author === 'object' ? post.author?.id : post.authorId || post.userId;
                authorId && navigate(`/author/${authorId}`);
              }}
            >
              {typeof post.author === 'object' ? post.author?.username : (post.author || '创作者')}
            </span>
          </div>
          
          <div className={`flex items-center gap-3 text-[11px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            <span className="flex items-center gap-1">
              <i className="far fa-eye"></i>
              <span className="font-medium">{post.views || 0}</span>
            </span>
            <span className="flex items-center gap-1">
              <i className={`${post.isLiked ? 'fas text-red-400' : 'far'} fa-heart`}></i>
              <span className="font-medium">{post.likes || 0}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})

const PostGrid: React.FC<PostGridProps> = ({ 
  posts, 
  onLike, 
  onComment, 
  onShare, 
  onBookmark, 
  onDelete, 
  onPostClick, 
  favorites, 
  isLoading, 
  isLoadingMore, 
  hasMore,
  isDark: propIsDark
}) => {
  // 基于屏幕尺寸动态调整列数
  const [columns, setColumns] = useState<number>(3);
  const [internalIsDark, setInternalIsDark] = useState<boolean>(false);
  const [columnPosts, setColumnPosts] = useState<Post[][]>([]);
  
  const isDark = propIsDark !== undefined ? propIsDark : internalIsDark;

  // 检测系统主题 (仅当未提供prop时)
  useEffect(() => {
    if (propIsDark !== undefined) return;
    
    const checkDarkMode = () => {
      setInternalIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    };
    checkDarkMode();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);
    return () => mediaQuery.removeEventListener('change', checkDarkMode);
  }, [propIsDark]);
  
  // 响应式列数处理
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      const width = window.innerWidth;
      
      let newColumns = 3;
      // 列数根据视口宽度动态调整
      if (width >= 1920) {
        newColumns = 5;
      } else if (width >= 1440) {
        newColumns = 4;
      } else if (width >= 1024) {
        newColumns = 3;
      } else if (width >= 768) {
        newColumns = 2;
      } else {
        newColumns = 1; // 移动端单列
      }
      
      setColumns(newColumns);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 瀑布流布局计算
  useEffect(() => {
    if (posts.length === 0) {
      setColumnPosts(Array(columns).fill([]));
      return;
    }
    
    const initialHeights = Array(columns).fill(0);
    const initialColumns = Array(columns).fill(null).map(() => [] as Post[]);
    
    // 计算卡片高度 (模拟)
    const calculatePostHeight = (post: Post) => {
      // 宽高比动态计算（1:1.2~1:1.6自适应）
      // Aspect Ratio = Width / Height => Height = Width / AspectRatio
      // Requirements: 1:1.2 ~ 1:1.6 means Height is 1.2 to 1.6 times the Width
      // So HeightRatio should be between 1.2 and 1.6
      const heightRatio = Math.random() * (1.6 - 1.2) + 1.2;
      
      // 假设列宽为300px (归一化计算)
      const normalizedWidth = 300;
      const imageHeight = normalizedWidth * heightRatio;
      
      // 内容区域高度 (Title + Tags + Meta) 估算
      const contentHeight = 120; 
      
      return imageHeight + contentHeight;
    };
    
    const finalColumns = [...initialColumns];
    const finalHeights = [...initialHeights];
    
    posts.forEach(post => {
      // 找到高度最小的列
      const minHeight = Math.min(...finalHeights);
      const minIndex = finalHeights.indexOf(minHeight);
      
      // 将帖子添加到该列
      finalColumns[minIndex].push(post);
      
      // 更新列高
      finalHeights[minIndex] += calculatePostHeight(post);
    });
    
    setColumnPosts(finalColumns);
  }, [posts, columns]);

  // 骨架屏采用更精致的Shimmer效果
  const renderLoading = () => (
    <div className="p-4 w-full max-w-[2400px] mx-auto">
      <div className="flex" style={{ gap: columns >= 4 ? GAP_FIB.xl : columns === 3 ? GAP_FIB.lg : GAP_FIB.md }}>
        {Array.from({ length: columns }).map((_, columnIndex) => (
          <div key={columnIndex} className="flex-1 space-y-6">
            {Array.from({ length: 2 }).map((_, itemIndex) => (
              <div key={itemIndex} className={`rounded-2xl overflow-hidden relative ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
                 {/* Shimmer Effect */}
                 <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10" />
                
                <div className={`w-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} style={{ paddingBottom: '130%' }}></div>
                <div className="p-4 space-y-3">
                  <div className={`h-4 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-200'} w-3/4`}></div>
                  <div className={`h-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-200'} w-1/2`}></div>
                  <div className="flex justify-between pt-3 mt-2 border-t border-gray-100 dark:border-slate-700/50">
                     <div className="flex items-center gap-2">
                       <div className={`h-8 w-8 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                       <div className={`h-3 w-16 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                     </div>
                     <div className={`h-3 w-12 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const renderEmpty = () => (
    <div className={`flex flex-col items-center justify-center py-24 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <i className="fas fa-layer-group text-4xl opacity-50"></i>
      </div>
      <h3 className="text-xl font-light mb-2">暂无作品</h3>
      <p className="text-sm opacity-60">期待您的精彩创作</p>
    </div>
  );

  if (isLoading) {
    return renderLoading();
  }

  if (posts.length === 0) {
    return renderEmpty();
  }

  // 确定当前使用的 gap
  const currentGap = columns >= 5 ? GAP_FIB.xl : (columns === 4 ? GAP_FIB.xl : (columns === 3 ? GAP_FIB.lg : (columns === 2 ? GAP_FIB.md : GAP_FIB.sm)));

  return (
    <div className="w-full max-w-[2400px] mx-auto">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex items-start justify-center" style={{ gap: `${currentGap}px` }}>
          {columnPosts.map((column, columnIndex) => (
            <div key={columnIndex} className="flex-1 flex flex-col" style={{ gap: `${currentGap}px` }}>
              {column.map((post, postIndex) => (
                <PostItem 
                  key={post.id} 
                  post={post}
                  index={columnIndex * column.length + postIndex}
                  onLike={onLike}
                  onComment={onComment}
                  onShare={onShare}
                  onBookmark={onBookmark}
                  onDelete={onDelete}
                  onPostClick={onPostClick}
                  favorites={favorites}
                  isDark={isDark}
                  columnWidth={300} // 实际上是自适应的，这里仅传值
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {isLoadingMore && (
        <div className="flex justify-center items-center py-12">
           <div className="flex space-x-2">
             <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
             <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
             <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
           </div>
        </div>
      )}
      
      {!hasMore && posts.length > 0 && (
        <div className={`flex justify-center items-center py-12 text-xs tracking-widest uppercase opacity-40 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          THE END
        </div>
      )}
    </div>
  )
}

export default memo(PostGrid)
