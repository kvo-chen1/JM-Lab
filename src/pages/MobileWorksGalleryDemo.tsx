/**
 * 津脉广场 - 移动端瀑布流作品展示页面演示
 * 
 * 演示页面，展示 MobileWorksGallery 组件的完整功能
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, TrendingUp, Clock, Heart, Sparkles } from 'lucide-react';
import MobileWorksGallery, { ArtworkItem } from './MobileWorksGallery';

// 模拟作品数据生成器
const generateMockArtworks = (page: number, count: number = 10): ArtworkItem[] => {
  const titles = [
    '津门古韵 · 传统建筑之美',
    '海河夜景 · 城市光影',
    '泥人张彩塑 · 非遗传承',
    '狗不理包子 · 美食记忆',
    '天津之眼 · 摩天轮之恋',
    '五大道 · 万国建筑博览',
    '杨柳青年画 · 吉祥寓意',
    '古文化街 · 民俗风情',
    '意式风情区 · 浪漫邂逅',
    '瓷房子 · 艺术殿堂',
    '盘山风景区 · 自然之美',
    '黄崖关长城 · 历史印记',
    '独乐寺 · 千年古刹',
    '天津港 · 现代航运',
    '南开大学 · 学府风采'
  ];

  const authors = [
    { name: '艺术探索者', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1' },
    { name: '光影猎人', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2' },
    { name: '文化传承者', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3' },
    { name: '美食记录官', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4' },
    { name: '城市漫步者', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5' },
    { name: '摄影爱好者', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6' },
    { name: '设计新锐', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7' },
    { name: '创意达人', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8' }
  ];

  const tags = ['天津', '文化', '建筑', '美食', '风景', '艺术', '非遗', '摄影', '设计', '创意'];

  // Unsplash 图片集合 - 天津相关主题
  const imageUrls = [
    'https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?w=600&q=80',
    'https://images.unsplash.com/photo-1548919973-5cef591cdbc9?w=600&q=80',
    'https://images.unsplash.com/photo-1537531383496-f4749b8032cf?w=600&q=80',
    'https://images.unsplash.com/photo-1512813195386-6cf811ad3542?w=600&q=80',
    'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600&q=80',
    'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80',
    'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=600&q=80',
    'https://images.unsplash.com/photo-1528164344705-47542687000d?w=600&q=80',
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
    'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=600&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&q=80',
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=600&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&q=80',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&q=80'
  ];

  return Array.from({ length: count }, (_, i) => {
    const id = `artwork-${page}-${i}`;
    const titleIndex = Math.floor(Math.random() * titles.length);
    const authorIndex = Math.floor(Math.random() * authors.length);
    const imageIndex = Math.floor(Math.random() * imageUrls.length);
    
    // 随机宽高比 0.75 - 1.5 (高:宽)
    const aspectRatio = 0.75 + Math.random() * 0.75;
    
    // 随机标签 1-3 个
    const artworkTags = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => 
      tags[Math.floor(Math.random() * tags.length)]
    );

    return {
      id,
      title: titles[titleIndex],
      imageUrl: imageUrls[imageIndex],
      aspectRatio,
      author: {
        id: `author-${authorIndex}`,
        name: authors[authorIndex].name,
        avatar: authors[authorIndex].avatar
      },
      likes: Math.floor(Math.random() * 5000) + 100,
      views: Math.floor(Math.random() * 50000) + 1000,
      tags: [...new Set(artworkTags)],
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      isLiked: Math.random() > 0.7
    };
  });
};

// 筛选标签组件
const FilterTag: React.FC<{
  label: string;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}> = ({ label, active, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
      active
        ? 'bg-jinmai-red text-white shadow-md'
        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`}
  >
    {icon}
    {label}
  </button>
);

// 主演示组件
const MobileWorksGalleryDemo: React.FC = () => {
  const [artworks, setArtworks] = useState<ArtworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState('trending');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // 初始加载
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    const initialArtworks = generateMockArtworks(0, 12);
    setArtworks(initialArtworks);
    setLoading(false);
    setCurrentPage(1);
  };

  // 加载更多
  const handleLoadMore = useCallback(async () => {
    if (currentPage >= 5) {
      setHasMore(false);
      return;
    }

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newArtworks = generateMockArtworks(currentPage, 10);
    setArtworks(prev => [...prev, ...newArtworks]);
    setCurrentPage(prev => prev + 1);
  }, [currentPage]);

  // 处理作品点击
  const handleArtworkClick = useCallback((artwork: ArtworkItem) => {
    console.log('点击作品:', artwork);
    // 这里可以导航到作品详情页
  }, []);

  // 处理作者点击
  const handleAuthorClick = useCallback((authorId: string) => {
    console.log('点击作者:', authorId);
    // 这里可以导航到作者主页
  }, []);

  // 处理点赞
  const handleLike = useCallback(async (artworkId: string) => {
    console.log('点赞作品:', artworkId);
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 300));
  }, []);

  // 处理分享
  const handleShare = useCallback((artwork: ArtworkItem) => {
    console.log('分享作品:', artwork);
    // 这里可以打开分享弹窗
  }, []);

  // 筛选切换
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    // 重置数据并重新加载
    setArtworks([]);
    setCurrentPage(0);
    setHasMore(true);
    setLoading(true);
    setTimeout(() => {
      const newArtworks = generateMockArtworks(0, 12);
      setArtworks(newArtworks);
      setLoading(false);
      setCurrentPage(1);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航栏 */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800"
      >
        <div className="px-4 py-3">
          {/* 标题和搜索 */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                isSearchFocused ? 'text-jinmai-red' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="搜索作品、创作者..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-jinmai-red/50 transition-all"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
            </div>
            <button className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* 筛选标签 */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <FilterTag
              label="热门推荐"
              active={activeFilter === 'trending'}
              onClick={() => handleFilterChange('trending')}
              icon={<TrendingUp className="w-3.5 h-3.5" />}
            />
            <FilterTag
              label="最新发布"
              active={activeFilter === 'latest'}
              onClick={() => handleFilterChange('latest')}
              icon={<Clock className="w-3.5 h-3.5" />}
            />
            <FilterTag
              label="最多喜欢"
              active={activeFilter === 'liked'}
              onClick={() => handleFilterChange('liked')}
              icon={<Heart className="w-3.5 h-3.5" />}
            />
            <FilterTag
              label="精选作品"
              active={activeFilter === 'featured'}
              onClick={() => handleFilterChange('featured')}
              icon={<Sparkles className="w-3.5 h-3.5" />}
            />
          </div>
        </div>
      </motion.header>

      {/* 瀑布流作品展示 */}
      <MobileWorksGallery
        artworks={artworks}
        onLoadMore={handleLoadMore}
        onArtworkClick={handleArtworkClick}
        onAuthorClick={handleAuthorClick}
        onLike={handleLike}
        onShare={handleShare}
        loading={loading}
        hasMore={hasMore}
      />

      {/* 底部导航占位 */}
      <div className="h-16" />
    </div>
  );
};

export default MobileWorksGalleryDemo;
