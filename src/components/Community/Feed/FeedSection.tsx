import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Thread } from '@/pages/Community';
import { PostCard } from './PostCard';
import { TianjinAvatar } from '@/components/TianjinStyleComponents';

interface FeedSectionProps {
  isDark: boolean;
  threads: (Thread & { comments?: any[] })[];
  onUpvote: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAddComment: (threadId: string, content: string) => void;
  onOpenThread: (id: string) => void;
  onCreateThread: () => void;
  isThreadFavorited?: (id: string) => boolean;
  activeCommunity?: any; // 添加活跃社群信息，用于自定义风格
}

export const FeedSection: React.FC<FeedSectionProps> = ({
  isDark,
  threads,
  onUpvote,
  onToggleFavorite,
  onAddComment,
  onOpenThread,
  onCreateThread,
  isThreadFavorited = () => false,
  activeCommunity
}) => {
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top'>('hot');

  // 根据社群布局类型确定容器类名
  const containerClass = {
    standard: "max-w-4xl mx-auto py-3 px-3",
    compact: "max-w-3xl mx-auto py-2 px-2",
    expanded: "max-w-5xl mx-auto py-4 px-4"
  }[activeCommunity?.layoutType || 'standard'];

  return (
    <div className={containerClass}>
      {/* 如果有社群主题色，应用到创建帖子按钮 */}
      {activeCommunity?.theme?.primaryColor && (
        <style jsx>{`
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
        `}</style>
      )}
      {/* Create Post Input */}
      <div className={`flex items-center gap-2 p-3 rounded-xl border mb-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <TianjinAvatar size="sm" src="" alt="当前用户" className="w-9 h-9" />
        <input 
            type="text" 
            placeholder="分享你的创意..." 
            onClick={onCreateThread}
            className={`flex-1 px-3 py-2 rounded-lg focus:outline-none create-post-button ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-white hover:ring-1 hover:ring-gray-300'} transition-all`}
        />
        <button onClick={onCreateThread} className="p-2 text-gray-500 hover:bg-gray-200/20 rounded-full transition-colors hover:cursor-pointer"><i className="fas fa-image"></i></button>
        <button onClick={onCreateThread} className="p-2 text-gray-500 hover:bg-gray-200/20 rounded-full transition-colors hover:cursor-pointer"><i className="fas fa-link"></i></button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 pb-3 overflow-x-auto no-scrollbar">
        {
          [
            { id: 'hot', icon: 'fas fa-fire', label: '热门' },
            { id: 'new', icon: 'fas fa-certificate', label: '最新' },
            { id: 'top', icon: 'fas fa-arrow-up', label: '高分' },
          ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setSortBy(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all sort-button ${sortBy === tab.id ? (activeCommunity?.theme?.primaryColor ? 'active' : (isDark ? 'bg-gray-700 text-white shadow-sm' : 'bg-blue-50 text-blue-600 shadow-sm')) : (isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100')}`}
            >
                <i className={tab.icon}></i>
                <span>{tab.label}</span>
            </button>
          ))
        }
      </div>

      {/* Post List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-3"
      >
         {threads.map((thread, index) => (
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
                    onClick={onOpenThread}
                    isFavorited={isThreadFavorited(thread.id)}
                />
             </motion.div>
         ))}
      </motion.div>
    </div>
  );
};
