import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Clock
} from 'lucide-react';
import { PostGrid } from '@/components/CreatorCommunity/PostGrid';
import { useCommunityStore } from '@/stores/communityStore';
import type { UserProfile } from '@/lib/supabase';

interface CreatorFeedProps {
  isDark?: boolean;
  currentUser?: UserProfile;
}

// 页面过渡动画组件
const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
);

export const CreatorFeed: React.FC<CreatorFeedProps> = ({ isDark }) => {
  const navigate = useNavigate();
  const {
    posts, loading, likes,
    category, sortBy,
    toggleLike,
    fetchPosts, setCategory, setSortBy,
    initSubscription, unsubscribe
  } = useCommunityStore();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 分类选项
  const categories = [
    { id: 'all', name: '全部', icon: '🎨' },
    { id: 'design', name: '设计', icon: '🎨' },
    { id: 'photography', name: '摄影', icon: '📸' },
    { id: 'writing', name: '写作', icon: '✍️' },
    { id: 'music', name: '音乐', icon: '🎵' },
    { id: 'video', name: '视频', icon: '🎬' },
    { id: 'tech', name: '科技', icon: '💻' }
  ];

  // 初始化实时订阅
  useEffect(() => {
    initSubscription();
    return () => unsubscribe();
  }, [initSubscription, unsubscribe]);

  // 加载数据
  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts, category, sortBy]);

  const filteredPosts = posts;

  return (
    <div className="p-6 h-full overflow-y-auto">
      <PageTransition>
        {/* 分类和筛选 */}
        <div className={`rounded-xl shadow-sm border p-6 mb-8 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* 分类 */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <motion.button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${category === cat.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.name}
                </motion.button>
              ))}
            </div>

            {/* 排序和视图 */}
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 rounded-lg p-1 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <button
                  onClick={() => setSortBy('new')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm transition-colors ${sortBy === 'new' ? 'bg-white shadow-sm text-blue-600 dark:bg-gray-800 dark:text-blue-400 dark:shadow-gray-700' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}
                >
                  <Clock className="w-4 h-4" />
                  <span>最新</span>
                </button>
                <button
                  onClick={() => setSortBy('hot')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm transition-colors ${sortBy === 'hot' ? 'bg-white shadow-sm text-blue-600 dark:bg-gray-800 dark:text-blue-400 dark:shadow-gray-700' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>热门</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 帖子列表 */}
        <div>
          <PostGrid
            posts={filteredPosts}
            loading={loading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onPostClick={(post) => navigate(`/post/${post.id}`)}
            onLikeClick={(post) => {
              const action = likes.has(post.id) ? 'unlike' : 'like';
              toggleLike(post.id, action);
            }}
            onAuthorClick={(authorId) => navigate(`/author/${authorId}`)}
          />
        </div>
      </PageTransition>
    </div>
  );
};
