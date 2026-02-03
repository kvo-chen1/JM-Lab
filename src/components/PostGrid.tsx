import React, { useCallback, memo, useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Post } from '../services/postService'
import LazyImage from './LazyImage'
import LazyVideo from './LazyVideo'
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
}

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
}

const PostItem = memo(({ post, index, onLike, onComment, onShare, onBookmark, onDelete, onPostClick, favorites, isDark }: PostItemProps) => {
  // 使用useCallback优化点击事件
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

  // 预先计算样式类名，避免每次渲染都重新计算
  const cardClassName = isDark 
    ? 'bg-gray-900' 
    : 'bg-white'
  
  const isBookmarked = favorites.includes(post.id)
  const isVideo = post.category === 'video'

  return (
    <div
      className={`${cardClassName} rounded-xl shadow-md overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
      onClick={handlePostClick}
    >
      {/* 媒体内容 */}
      <div className="relative w-full">
        {isVideo ? (
          <div className="relative w-full">
            <LazyVideo 
              src={post.videoUrl || post.thumbnail}  
              poster={post.thumbnail}
              alt={post.title}
              className="w-full h-auto"
              priority={index < 3}
              loadingAnimation="fade"
              autoPlay={false}
              muted={true}
              controls={true}
              playsInline={true}
              bare
            />
          </div>
        ) : (
          <LazyImage 
            src={post.thumbnail}  
            alt={post.title}
            className="w-full h-auto"
            priority={index < 3}
            quality={index < 6 ? 'high' : 'medium'}
            fit="contain"
            bare
          />
        )}
        

      </div>
      
      {/* 卡片内容 */}
      <div className={`p-3`}>
        {/* 标题 */}
        <h3 className={`font-semibold text-sm mb-2 line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {post.title}
        </h3>
        
        {/* 标签 */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {post.tags.slice(0, 3).map((tag, tagIndex) => (
              <span key={tagIndex} className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                {tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                +{post.tags.length - 3}
              </span>
            )}
          </div>
        )}
        
        {/* 互动数据 */}
        <div className="flex items-center justify-between mt-3">
          <Link 
            to={`/author/${(typeof post.author === 'object' ? post.author?.id : post.author) || 'default'}`}
            className="flex items-center gap-2 group/author"
            onClick={(e) => e.stopPropagation()}
          >
            <TianjinAvatar 
              src={typeof post.author === 'object' ? post.author?.avatar || '' : `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author || post.id}`}
              size="xs"
              alt={typeof post.author === 'object' ? post.author?.username || '用户' : (post.author || '津门创作者')}
            />
            <span className={`text-xs font-medium truncate max-w-[100px] ${isDark ? 'text-gray-400 group-hover/author:text-white' : 'text-gray-600 group-hover/author:text-gray-900'} transition-colors`}>
              {typeof post.author === 'object' ? post.author?.username : (post.author || '津门创作者')}
            </span>
          </Link>
          
          <div className="flex items-center gap-2 text-[10px]">
            <span className={`flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <i className="fas fa-heart"></i>
              <span>{post.likes || 0}</span>
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
  hasMore 
}) => {
  // 基于屏幕尺寸动态调整列数
  const [columns, setColumns] = useState<number>(3);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [columnHeights, setColumnHeights] = useState<number[]>([]);
  const [columnPosts, setColumnPosts] = useState<Post[][]>([]);
  
  // 检测系统主题
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    };
    
    checkDarkMode();
    window.addEventListener('prefers-color-scheme', checkDarkMode);
    return () => window.removeEventListener('prefers-color-scheme', checkDarkMode);
  }, []);
  
  // 响应式列数处理
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      
      let newColumns = 3;
      if (window.innerWidth < 640) {
        newColumns = 1;
      } else if (window.innerWidth < 768) {
        newColumns = 2;
      } else if (window.innerWidth < 1024) {
        newColumns = 3;
      } else if (window.innerWidth < 1280) {
        newColumns = 4;
      } else {
        newColumns = 5;
      }
      
      setColumns(newColumns);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 瀑布流布局计算
  useEffect(() => {
    if (posts.length === 0) return;
    
    // 初始化列高和列数据
    const initialHeights = Array(columns).fill(0);
    const initialColumns = Array(columns).fill(null).map(() => [] as Post[]);
    
    // 模拟图片高度（实际项目中可以从API获取或通过图片加载后计算）
    const calculatePostHeight = (post: Post) => {
      // 假设图片比例为4:3到16:9之间
      const aspectRatio = Math.random() * (16/9 - 4/3) + 4/3;
      const width = 300; // 假设列宽
      return width / aspectRatio + 100; // 加上内容高度
    };
    
    // 分配帖子到高度最小的列
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
    
    setColumnHeights(finalHeights);
    setColumnPosts(finalColumns);
  }, [posts, columns]);
  
  // 渲染单个帖子项
  const renderPostItem = useCallback((post: Post, index: number) => (
    <PostItem 
      key={post.id} 
      post={post}
      index={index}
      onLike={onLike}
      onComment={onComment}
      onShare={onShare}
      onBookmark={onBookmark}
      onDelete={onDelete}
      onPostClick={onPostClick}
      favorites={favorites}
      isDark={isDark}
    />
  ), [favorites, isDark, onBookmark, onComment, onDelete, onLike, onShare, onPostClick])

  // 加载状态渲染
  const renderLoading = () => (
    <div className="p-4">
      <div className="flex gap-6">
        {Array.from({ length: columns }).map((_, columnIndex) => (
          <div key={columnIndex} className="flex-1 space-y-6">
            {Array.from({ length: 2 }).map((_, itemIndex) => (
              <div key={itemIndex} className={`rounded-xl shadow-sm overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                <div className={`w-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'} h-64`}></div>
                <div className="p-3 space-y-2">
                  <div className={`h-4 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}></div>
                  <div className={`h-3 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-100'} w-3/4`}></div>
                  <div className={`h-3 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-100'} w-1/2`}></div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  // 加载更多状态渲染
  const renderLoadingMore = () => (
    <div className="flex justify-center items-center py-8">
      <div className={`w-8 h-8 border-4 ${isDark ? 'border-t-gray-600 border-gray-800' : 'border-t-gray-300 border-gray-100'} rounded-full animate-spin`}></div>
    </div>
  );

  // 空状态渲染
  const renderEmpty = () => (
    <div className={`flex flex-col items-center justify-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
      <i className="fas fa-image text-4xl mb-4"></i>
      <h3 className="text-lg font-medium mb-2">暂无作品</h3>
      <p className="text-sm">快来发布你的第一个作品吧！</p>
    </div>
  );

  // 主渲染逻辑
  if (isLoading) {
    return renderLoading();
  }

  if (posts.length === 0) {
    return renderEmpty();
  }

  return (
    <div className="w-full">
      <div className="p-4">
        <div className="flex gap-6">
          {columnPosts.map((column, columnIndex) => (
            <div key={columnIndex} className="flex-1 space-y-6">
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
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {isLoadingMore && renderLoadingMore()}
      
      {!hasMore && posts.length > 0 && (
        <div className={`flex justify-center items-center py-8 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          没有更多作品了
        </div>
      )}
    </div>
  )
}

export default memo(PostGrid)
