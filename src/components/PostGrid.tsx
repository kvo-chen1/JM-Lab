import React, { useCallback, memo, useEffect, useState, useRef } from 'react'
import { Post } from '../services/postService'
import LazyImage from './LazyImage'
import VirtualList from './VirtualList'

interface PostGridProps {
  posts: Post[]
  onPostClick: (post: Post) => void
  onLike: (postId: string) => void
  onComment: (postId: string, text: string) => void
  isDark: boolean
}

// 单个帖子项组件
interface PostItemProps {
  post: Post
  index: number
  onPostClick: (post: Post) => void
  isDark: boolean
}

const PostItem = memo(({ post, index, onPostClick, onLike, isDark }: PostItemProps & { onLike: (postId: string) => void }) => {
  // 使用useCallback优化点击事件
  const handlePostClick = useCallback(() => {
    onPostClick(post)
  }, [onPostClick, post])

  // 预先计算样式类名，避免每次渲染都重新计算
  const cardClassName = isDark 
    ? 'bg-gray-800 hover:bg-gray-700' 
    : 'bg-white hover:bg-gray-50'

  return (
    <div
      className={`${cardClassName} rounded-lg shadow-md hover:shadow-xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-105 hover:animate-bounce active:scale-95 mb-4 break-inside-avoid`}
      onClick={handlePostClick}
    >
      <LazyImage 
        src={post.thumbnail}  
        alt={post.title}
        className="w-full h-auto"
        priority={index < 3}
        quality={index < 6 ? 'high' : 'medium'}
        ratio="auto"
        bare
      />
      
      <div className="p-2 sm:p-3">
        <h3 className="font-semibold text-sm sm:text-base mb-1 line-clamp-2">{post.title}</h3>
        <div className="flex justify-between items-center text-xs sm:text-sm text-gray-500">
          <span>{post.category}</span>
          <span>{post.likes} ❤️</span>
        </div>
      </div>
    </div>
  )
})

const PostGrid: React.FC<PostGridProps> = ({ 
  posts, 
  onPostClick, 
  onLike, 
  onComment, 
  isDark 
}) => {
  // 基于屏幕尺寸动态调整列数
  const [columns, setColumns] = useState<number>(3);
  const containerRef = useRef<HTMLDivElement>(null);
  
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
  
  // 计算动态项高，根据列数调整
  const itemHeight = columns > 3 ? 250 : 300;
  
  // 使用useCallback优化回调函数
  const handlePostClick = useCallback((post: Post) => {
    onPostClick(post)
  }, [onPostClick])

  // 渲染单个帖子项
  const renderPostItem = useCallback((post: Post, index: number) => (
    <PostItem 
      key={post.id} 
      post={post}
      index={index}
      onPostClick={handlePostClick}
      onLike={onLike}
      isDark={isDark}
    />
  ), [handlePostClick, isDark, onLike])

  // 如果帖子数量较少，直接渲染，避免虚拟滚动的复杂性
  if (posts.length < 100) {
    return (
      <div className="w-full">
        <div className="gap-4 p-2 columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 space-y-4">
          {posts.map((post, index) => (
            <PostItem 
              key={post.id} 
              post={post}
              index={index}
              onPostClick={handlePostClick}
              onLike={onLike}
              isDark={isDark}
            />
          ))}
        </div>
      </div>
    )
  }

  // 帖子数量较多时，使用虚拟滚动优化性能
  return (
    <div ref={containerRef} className="w-full" style={{ minHeight: '500px' }}>
      <VirtualList 
        items={posts} 
        renderItem={renderPostItem} 
        columns={columns} 
        isDark={isDark}
        height="auto" // 使用auto高度，让VirtualList自适应内容
        itemHeight={itemHeight} // 根据列数动态调整项高
        overscan={5} // 预渲染5个额外的项目，优化滚动体验
      />
    </div>
  )
}

export default memo(PostGrid)
