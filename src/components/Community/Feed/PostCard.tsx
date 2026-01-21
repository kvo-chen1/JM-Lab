import React, { useState } from 'react';
import { motion } from 'framer-motion';
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

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentContent.trim()) {
      onAddComment(thread.id, commentContent.trim());
      setCommentContent('');
      setShowCommentInput(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onClick(thread.id)}
      className={`flex flex-col rounded-xl overflow-hidden border mb-4 cursor-pointer transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:shadow-lg' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'}`}
      data-testid="post-card"
    >
      <div className="flex">
        {/* Left Vote Column */}
        <div className={`w-10 flex flex-col items-center p-3 gap-1 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
          <button
            onClick={(e) => { e.stopPropagation(); onUpvote(thread.id); }}
            className={`p-1.5 rounded-full hover:bg-gray-200/20 transition-colors ${isDark ? 'text-gray-400 hover:text-orange-500' : 'text-gray-500 hover:text-orange-600'}`}
            data-testid="like-button"
          >
            <i className="fas fa-arrow-up text-sm"></i>
          </button>
          <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-900'}`} data-testid="like-count">
            {thread.upvotes || 0}
          </span>
          <button
            onClick={(e) => e.stopPropagation()}
            className={`p-1.5 rounded-full hover:bg-gray-200/20 transition-colors ${isDark ? 'text-gray-400 hover:text-blue-500' : 'text-gray-500 hover:text-blue-600'}`}
          >
            <i className="fas fa-arrow-down text-sm"></i>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-3">
          {/* Header: User & Time */}
          <div className="flex items-center gap-2 mb-2 text-xs">
            <TianjinAvatar size="xs" src={''} alt={'创作者'} className="w-6 h-6" />
            <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
               u/User{Math.floor(Math.random() * 1000)}
            </span>
            <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>•</span>
            <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {new Date(thread.createdAt).toLocaleDateString()}
            </span>
            {thread.topic && (
               <span className={`px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                  {thread.topic}
               </span>
            )}
          </div>

          {/* Title */}
          <h3 className={`text-base font-medium mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {thread.title}
          </h3>

          {/* Content Preview */}
          <div className={`text-xs md:text-sm mb-3 line-clamp-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {thread.content}
          </div>
        </div>
      </div>
      
      {/* Post Content */}
      <div className={`p-4 rounded-b-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
        <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {thread.content}
        </div>
        
        {/* Post Images */}
        {thread.images && thread.images.length > 0 && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {thread.images.map((imageUrl, index) => (
              <div key={index} className="rounded-lg overflow-hidden border">
                <img 
                  src={imageUrl} 
                  alt={`Post image ${index + 1}`} 
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
        
        {/* 添加评论预览 */}
        {thread.comments && thread.comments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700/50 dark:border-gray-700/50">
            <div className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              最新评论 ({thread.comments.length})
            </div>
            <div className="space-y-2">
              {thread.comments.map((comment, index) => (
                <div key={comment.id || index} className={`p-2 rounded-lg bg-gray-700/20 dark:bg-gray-700/30`}>
                  <div className="flex items-start gap-2">
                    <TianjinAvatar size="xs" src={''} alt={comment.user || '评论者'} className="w-5 h-5 mt-0.5" />
                    <div className="flex-1">
                      <div className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        u/{comment.user}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                        {comment.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comment Input */}
      {showCommentInput && (
        <div className={`p-3 border-t border-gray-700/50 dark:border-gray-700/50 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <TianjinAvatar size="xs" src="" alt="当前用户" className="w-6 h-6 mt-1" />
            <div className="flex-1">
              <input
                type="text"
                placeholder="写下你的评论..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-white border border-gray-600' : 'bg-gray-100 text-gray-900 border border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <button
              type="submit"
              disabled={!commentContent.trim()}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${commentContent.trim() ? (isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white') : (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-400')}`}
              onClick={(e) => e.stopPropagation()}
            >
              发布
            </button>
          </form>
        </div>
      )}

      {/* Action Bar */}
      <div className={`flex items-center gap-3 px-3 py-3 ${isDark ? 'border-t border-gray-700' : 'border-t border-gray-200'}`}>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              setShowCommentInput(!showCommentInput); 
            }}
            className={`flex items-center gap-1.5 p-2 rounded-lg text-xs font-medium hover:bg-gray-200/20 transition-colors ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`}
          >
              <i className="fas fa-comment-alt"></i>
              <span>{(thread.comments?.length || 0)} 评论</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); }} 
            className="flex items-center gap-1.5 p-2 rounded-lg text-xs font-medium hover:bg-gray-200/20 transition-colors ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}"
          >
              <i className="fas fa-share"></i>
              <span>分享</span>
          </button>
          <button 
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(thread.id); }}
              className={`flex items-center gap-1.5 p-2 rounded-lg text-xs font-medium hover:bg-gray-200/20 transition-colors ${isDark ? (isFavorited ? 'text-yellow-500 hover:text-yellow-400' : 'text-gray-400 hover:text-gray-300') : (isFavorited ? 'text-yellow-600 hover:text-yellow-500' : 'text-gray-600 hover:text-gray-900')}`}
          >
              <i className={`fas ${isFavorited ? 'fa-bookmark' : 'fa-bookmark-o'}`}></i>
              <span>{isFavorited ? '已收藏' : '收藏'}</span>
          </button>
      </div>
    </motion.div>
  );
};
