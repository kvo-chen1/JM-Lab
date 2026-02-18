import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Thread } from '@/pages/Community';
import { PostCard } from './PostCard';
import { TianjinAvatar } from '@/components/TianjinStyleComponents';
import recommendationService from '@/services/recommendationService';

interface FeedSectionProps {
  isDark: boolean;
  threads: (Thread & { comments?: any[] })[];
  onUpvote: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAddComment: (threadId: string, content: string) => void;
  onOpenThread: (id: string) => void;
  onCreateThread: () => void;
  onDeleteThread?: (id: string) => void;
  onDeleteComment?: (threadId: string, commentId: string) => void;
  isThreadFavorited?: (id: string) => boolean;
  isThreadLiked?: (id: string) => boolean;
  onToggleLike?: (id: string) => void;
  activeCommunity?: any; // 添加活跃社群信息，用于自定义风格
  user?: { // 添加用户信息
    id: string;
    username: string;
    avatar: string;
  };
  onViewThread?: (id: string) => void; // 添加查看帖子的回调，用于记录用户行为
  loading?: boolean; // 添加加载状态
}

// 帖子骨架屏组件
const PostCardSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div className={`rounded-xl p-4 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
    <div className="flex gap-3 mb-4">
      <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
      <div className="flex-1 space-y-2">
        <div className={`h-4 w-1/3 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
        <div className={`h-3 w-1/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
      </div>
    </div>
    <div className={`h-6 w-3/4 rounded mb-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
    <div className={`h-24 w-full rounded mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
    <div className="flex gap-4">
      <div className={`h-8 w-20 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
      <div className={`h-8 w-20 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
      <div className={`h-8 w-20 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
    </div>
  </div>
);

// 发帖输入框骨架屏
const CreatePostSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div className={`flex items-center gap-3 p-4 rounded-xl border mb-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
    <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
    <div className={`flex-1 h-10 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
    <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
    <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
  </div>
);

export const FeedSection: React.FC<FeedSectionProps> = ({
  isDark,
  threads,
  onUpvote,
  onToggleFavorite,
  onAddComment,
  onOpenThread,
  onCreateThread,
  onDeleteThread,
  onDeleteComment,
  isThreadFavorited = () => false,
  isThreadLiked = () => false,
  onToggleLike,
  activeCommunity,
  user,
  onViewThread,
  loading = false
}) => {
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top'>('hot');
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  // 根据社群布局类型确定容器类名
  const layoutType = activeCommunity?.layoutType || 'standard';
  const containerClass = {
    standard: "max-w-4xl mx-auto py-3 px-3",
    compact: "max-w-3xl mx-auto py-2 px-2",
    expanded: "max-w-5xl mx-auto py-4 px-4"
  }[layoutType as 'standard' | 'compact' | 'expanded'] || "max-w-4xl mx-auto py-3 px-3";

  // 无限滚动处理函数
  const handleLoadMore = useCallback(() => {
    if (loading || !hasMore) return;

    // 这里可以调用API加载更多帖子
    setError(null);

    // 模拟API请求
    setTimeout(() => {
      // 假设没有更多数据了
      setHasMore(false);
    }, 1500);
  }, [loading, hasMore]);

  // 设置Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [handleLoadMore, loading, hasMore]);

  return (
    <div className={containerClass}>
      {/* 社群主题色样式处理 */}
      <style>
        {activeCommunity?.theme?.primaryColor && `
          .create-post-button {
            border-color: ${activeCommunity.theme.primaryColor} !important;
          }
          .create-post-button:hover {
            background-color: ${activeCommunity.theme.primaryColor} !important;
            color: white !important;
          }
          .sort-button.active {
            background-color: ${activeCommunity.theme.primaryColor} !important;
            color: white !important;
          }
        `}
      </style>

      {/* Create Post Input - 优化移动端发帖输入框 */}
      {loading ? (
        <CreatePostSkeleton isDark={isDark} />
      ) : (
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onCreateThread}
          className={`flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl border mb-4 md:mb-6 cursor-pointer shadow-sm hover:shadow-md transition-all ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <TianjinAvatar size="md" src={user?.avatar || ''} alt={user?.username || '当前用户'} className="w-9 h-9 md:w-10 md:h-10 border-2 border-white dark:border-gray-700 shadow-sm flex-shrink-0" />
          <div className="flex-1 relative group min-w-0">
            <input
                type="text"
                placeholder="分享你的创意..."
                readOnly
                className={`w-full px-3 md:px-4 py-2.5 md:py-3 rounded-full text-sm focus:outline-none transition-all cursor-pointer ${isDark ? 'bg-gray-700 text-white placeholder-gray-400 group-hover:bg-gray-600' : 'bg-gray-100 text-gray-700 placeholder-gray-500 group-hover:bg-gray-50 group-hover:shadow-inner'}`}
            />
          </div>
          <div className="flex gap-1 md:gap-2 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onCreateThread(); }}
              className={`p-2 md:p-2.5 rounded-full transition-colors ${isDark ? 'text-gray-400 hover:bg-gray-700 hover:text-green-400' : 'text-gray-500 hover:bg-gray-100 hover:text-green-500'}`}
              title="上传图片"
            >
              <i className="fas fa-image text-base md:text-lg"></i>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onCreateThread(); }}
              className={`p-2 md:p-2.5 rounded-full transition-colors ${isDark ? 'text-gray-400 hover:bg-gray-700 hover:text-blue-400' : 'text-gray-500 hover:bg-gray-100 hover:text-blue-500'}`}
              title="添加链接"
            >
              <i className="fas fa-link text-base md:text-lg"></i>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Filter Tabs - 优化移动端筛选标签 */}
      <div className={`flex items-center justify-between mb-4 md:mb-6 ${loading ? 'pointer-events-none opacity-50' : ''}`}>
        <div className="flex items-center gap-1 md:gap-2 p-1 rounded-lg bg-gray-100 dark:bg-gray-800/50 w-full md:w-auto">
          {[
            { id: 'hot', icon: 'fas fa-fire', label: '热门' },
            { id: 'new', icon: 'fas fa-clock', label: '最新' },
            { id: 'top', icon: 'fas fa-trophy', label: '高分' },
          ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setSortBy(tab.id as any)}
                className={`flex items-center justify-center gap-1.5 md:gap-2 flex-1 md:flex-none px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-all ${sortBy === tab.id ? (isDark ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-blue-600 shadow-sm') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}`}
            >
                <i className={`${tab.icon} ${sortBy === tab.id ? 'text-orange-500' : ''}`}></i>
                <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Post List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
         {/* 加载状态 - 显示多个骨架屏 */}
         {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <PostCardSkeleton key={i} isDark={isDark} />
              ))}
            </div>
         )}

         {/* 实际帖子列表 - 只在非加载状态显示 */}
         {!loading && threads.map((thread, index) => {
           // 处理帖子点击事件，记录用户行为
           const handleThreadClick = (id: string) => {
             // 调用原始的onOpenThread回调
             onOpenThread(id);

             // 记录用户查看帖子的行为，用于推荐系统
             if (user) {
               recommendationService.recordUserAction({
                 userId: user.id,
                 itemId: id,
                 itemType: 'post',
                 actionType: 'view',
                 metadata: thread
               });
             }

             // 调用传入的onViewThread回调
             onViewThread?.(id);
           };

           return (
             <motion.div
                key={thread.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
             >
                <PostCard
                    isDark={isDark}
                    thread={thread}
                    onUpvote={onUpvote}
                    onToggleFavorite={onToggleFavorite}
                    onAddComment={onAddComment}
                    onClick={handleThreadClick}
                    onDelete={onDeleteThread}
                    onDeleteComment={onDeleteComment}
                    isFavorited={isThreadFavorited(thread.id)}
                    isLiked={isThreadLiked(thread.id)}
                    onToggleLike={onToggleLike}
                    index={index}
                />
             </motion.div>
           );
         })}

         {/* 错误状态 */}
         {error && !loading && (
            <div className={`flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <i className={`fas fa-exclamation-circle text-2xl text-red-500`}></i>
                </div>
                <p className={`mb-4 text-base font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{error}</p>
                <button
                    onClick={handleLoadMore}
                    className={`px-6 py-2 rounded-full text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30`}
                >
                    重新加载
                </button>
            </div>
         )}

         {/* 无更多数据 */}
         {!hasMore && !loading && threads.length > 0 && (
            <div className="flex items-center justify-center py-8">
                <div className={`h-px w-16 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                <span className={`mx-4 text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>已经到底啦</span>
                <div className={`h-px w-16 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            </div>
         )}

         {/* 空状态 */}
         {threads.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex flex-col items-center justify-center py-20 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50/50'}`}
            >
                <div className={`w-20 h-20 mb-6 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-white shadow-sm'}`}>
                  <i className={`fas fa-pencil-alt text-3xl ${activeCommunity?.theme?.primaryColor ? '' : 'text-blue-500'}`} style={{ color: activeCommunity?.theme?.primaryColor }}></i>
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>这里还很冷清</h3>
                <p className={`text-sm mb-8 text-center max-w-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  做第一个发帖的人吧！分享你的创意、见解或提出问题。
                </p>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onCreateThread}
                    className={`px-8 py-3 rounded-full text-base font-bold text-white shadow-xl ${activeCommunity?.theme?.primaryColor ? '' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}
                    style={activeCommunity?.theme?.primaryColor ? { backgroundColor: activeCommunity.theme.primaryColor } : {}}
                >
                    <i className="fas fa-plus mr-2"></i>
                    发布第一个帖子
                </motion.button>
            </motion.div>
         )}

         {/* 用于触发无限滚动的观察点 */}
         <div ref={observerRef} className="h-4"></div>
      </motion.div>

      {/* Mobile Floating Action Button (FAB) */}
      {!loading && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onCreateThread}
          className={`md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-50 text-white ${
            activeCommunity?.theme?.primaryColor
              ? ''
              : 'bg-blue-600'
          }`}
          style={activeCommunity?.theme?.primaryColor ? { backgroundColor: activeCommunity.theme.primaryColor } : {}}
        >
          <i className="fas fa-plus text-xl"></i>
        </motion.button>
      )}
    </div>
  );
};
