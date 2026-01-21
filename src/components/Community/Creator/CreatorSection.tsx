import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Clock,
  Users
} from 'lucide-react';
import { PostGrid } from '@/components/CreatorCommunity/PostGrid';
import { AuthorGrid } from '@/components/CreatorCommunity/AuthorCard';
import { useCommunityStore } from '@/stores/communityStore';
import type { UserProfile } from '@/lib/supabase';

interface CreatorSectionProps {
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

export const CreatorSection: React.FC<CreatorSectionProps> = ({ isDark, currentUser: propUser }) => {
  const navigate = useNavigate();
  const {
    posts, loading, likes, follows,
    category, sortBy, currentUser: storeUser,
    toggleLike, toggleFollow,
    fetchPosts, setCategory, setSortBy,
    initSubscription, unsubscribe
  } = useCommunityStore();
  
  const currentUser = propUser || storeUser;
  
  const [authors, setAuthors] = useState<UserProfile[]>([]);
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

  // 使用useMemo优化推荐作者计算
  const recommendedAuthors = useMemo(() => {
    if (posts.length > 0) {
      const uniqueAuthors = posts.map(post => post.author);
      // 去重
      const unique = uniqueAuthors.filter((author, index, self) => 
        index === self.findIndex((t) => t.id === author.id)
      );
      return unique.slice(0, 6);
    }
    return [];
  }, [posts]);

  // 更新作者列表
  useEffect(() => {
    setAuthors(recommendedAuthors);
  }, [recommendedAuthors]);

  const filteredPosts = posts;

  return (
    <div className="p-6 h-full overflow-y-auto">
      <PageTransition>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 主内容区 */}
          <div className="lg:col-span-3">


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
          </div>

          {/* 侧边栏 */}
          <div className="lg:col-span-1 space-y-8">
            {/* 推荐创作者 */}
            <motion.div 
              className={`rounded-xl shadow-sm border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>推荐创作者</h3>
                <Users className={`${isDark ? 'text-gray-400' : 'text-gray-400'} w-5 h-5`} />
              </div>
              <AuthorGrid
                authors={authors}
                size="small"
                columns={1}
                onAuthorClick={(authorId) => navigate(`/author/${authorId}`)}
                onFollowClick={(authorId) => {
                  const action = follows.has(authorId) ? 'unfollow' : 'follow';
                  toggleFollow(authorId, action);
                }}
              />
            </motion.div>

            {/* 社区统计 */}
            <motion.div 
              className={`rounded-xl shadow-sm border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>社区数据</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>总帖子数</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{posts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>活跃创作者</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{authors.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>今日新增</span>
                  <span className="font-semibold text-green-600">+12</span>
                </div>
              </div>
            </motion.div>

            {/* 创作指南 */}
            <motion.div 
              className={`rounded-xl border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>创作指南</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>• 分享你的创意和灵感</p>
                <p>• 与其他创作者互动交流</p>
                <p>• 参与社区活动和挑战</p>
                <p>• 建立个人品牌和影响力</p>
              </div>
              <motion.button
                onClick={() => navigate('/create')}
                className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                开始创作
              </motion.button>
            </motion.div>
          </div>
        </div>
      </PageTransition>
    </div>
  );
};

export default CreatorSection;
