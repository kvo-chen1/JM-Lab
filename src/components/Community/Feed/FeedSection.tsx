import React, { useState } from 'react';
import type { Thread } from '@/pages/Community';
import { PostCard } from './PostCard';
import { TianjinAvatar } from '@/components/TianjinStyleComponents';

interface FeedSectionProps {
  isDark: boolean;
  threads: (Thread & { comments?: any[] })[];
  onUpvote: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenThread: (id: string) => void;
  onCreateThread: () => void;
  isThreadFavorited?: (id: string) => boolean;
}

export const FeedSection: React.FC<FeedSectionProps> = ({
  isDark,
  threads,
  onUpvote,
  onToggleFavorite,
  onOpenThread,
  onCreateThread,
  isThreadFavorited = () => false
}) => {
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top'>('hot');

  return (
    <div className="max-w-4xl mx-auto py-3 px-3">
      {/* Create Post Input */}
      <div className={`flex items-center gap-2 p-3 rounded-xl border mb-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <TianjinAvatar size="sm" src="" alt="Me" className="w-9 h-9" />
        <input 
            type="text" 
            placeholder="分享你的创意..." 
            onClick={onCreateThread}
            className={`flex-1 px-3 py-2 rounded-lg focus:outline-none ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-white hover:ring-1 hover:ring-gray-300'} transition-all`}
        />
        <button className="p-2 text-gray-500 hover:bg-gray-200/20 rounded-full transition-colors"><i className="fas fa-image"></i></button>
        <button className="p-2 text-gray-500 hover:bg-gray-200/20 rounded-full transition-colors"><i className="fas fa-link"></i></button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 pb-3 overflow-x-auto no-scrollbar">
        {[
            { id: 'hot', icon: 'fas fa-fire', label: '热门' },
            { id: 'new', icon: 'fas fa-certificate', label: '最新' },
            { id: 'top', icon: 'fas fa-arrow-up', label: '高分' },
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setSortBy(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${sortBy === tab.id ? (isDark ? 'bg-gray-700 text-white shadow-sm' : 'bg-blue-50 text-blue-600 shadow-sm') : (isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100')}`}
            >
                <i className={tab.icon}></i>
                <span>{tab.label}</span>
            </button>
        ))}
      </div>

      {/* Post List */}
      <div className="space-y-0">
         {threads.map(thread => (
             <PostCard
                key={thread.id}
                isDark={isDark}
                thread={thread}
                onUpvote={onUpvote}
                onToggleFavorite={onToggleFavorite}
                onClick={onOpenThread}
                isFavorited={isThreadFavorited(thread.id)}
             />
         ))}
      </div>
    </div>
  );
};
