/**
 * 动态内容展示页面
 * 参考哔哩哔哩动态页面设计 - 三栏式布局
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import feedService from '@/services/feedService';
import { getFollowingList, getFollowersList } from '@/services/postService';
import type {
  FeedItem,
  FeedFilterType,
  FeedSortType,
  FeedQueryParams,
  HotSearchItem,
  RecommendedUser,
  RecommendedCommunity,
  CommunityAnnouncement,
  CreateFeedRequest,
  FeedAuthor
} from '@/types/feed';

// 导入子组件
import { LeftSidebar } from '@/components/feed/LeftSidebar';
import { FeedPublisher } from '@/components/feed/FeedPublisher';
import { FeedFilter } from '@/components/feed/FeedFilter';
import { FeedCard } from '@/components/feed/FeedCard';
import { RightSidebar } from '@/components/feed/RightSidebar';
import { FollowingUsersBar } from '@/components/feed/FollowingUsersBar';

// 导入图标
import {
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export default function Feed() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  // 状态管理
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<FeedFilterType>('all');
  const [activeSort, setActiveSort] = useState<FeedSortType>('latest');
  
  // 右侧栏数据
  const [hotSearch, setHotSearch] = useState<HotSearchItem[]>([]);
  const [recommendedUsers, setRecommendedUsers] = useState<RecommendedUser[]>([]);
  const [recommendedCommunities, setRecommendedCommunities] = useState<RecommendedCommunity[]>([]);
  const [announcements, setAnnouncements] = useState<CommunityAnnouncement[]>([]);

  // 关注用户列表
  const [followingUsers, setFollowingUsers] = useState<FeedAuthor[]>([]);
  const [selectedFollowingUserId, setSelectedFollowingUserId] = useState<string | null>(null);

  // 用户统计数据
  const [userStats, setUserStats] = useState({
    worksCount: 0,
    followersCount: 0,
    followingCount: 0
  });

  const feedListRef = useRef<HTMLDivElement>(null);

  // 加载动态列表
  const loadFeeds = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsLoading(true);
      setPage(1);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params: FeedQueryParams = {
        filter: activeFilter,
        sort: activeSort,
        page: isRefresh ? 1 : page,
        pageSize: 10,
      };

      const response = await feedService.getFeeds(params);
      
      if (isRefresh) {
        setFeeds(response.feeds);
      } else {
        setFeeds(prev => [...prev, ...response.feeds]);
      }
      
      setHasMore(response.hasMore);
      
      if (!isRefresh && response.feeds.length > 0) {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      toast.error('加载动态失败，请稍后重试');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [activeFilter, activeSort, page]);

  // 加载右侧栏数据
  const loadSidebarData = useCallback(async () => {
    try {
      const [hotSearchData, usersData, communitiesData, announcementsData, followingData] = await Promise.all([
        feedService.getHotSearch(),
        feedService.getRecommendedUsers(),
        feedService.getRecommendedCommunities(),
        feedService.getAnnouncements(),
        feedService.getFollowingUsers(user?.id),
      ]);

      setHotSearch(hotSearchData);
      setRecommendedUsers(usersData);
      setRecommendedCommunities(communitiesData);
      setAnnouncements(announcementsData);
      setFollowingUsers(followingData);
    } catch (error) {
      console.error('加载侧边栏数据失败:', error);
    }
  }, [user?.id]);

  // 加载用户统计数据
  const loadUserStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const [following, followers, worksResult] = await Promise.all([
        getFollowingList().catch(() => []),
        getFollowersList().catch(() => []),
        token ? fetch(`/api/works?creator_id=${user.id}&limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.ok ? res.json() : { data: [] }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);

      setUserStats({
        worksCount: worksResult?.data?.length || 0,
        followersCount: followers.length,
        followingCount: following.length
      });
    } catch (error) {
      console.error('加载用户统计数据失败:', error);
    }
  }, [user?.id]);

  // 初始加载
  useEffect(() => {
    loadFeeds(true);
    loadSidebarData();
    loadUserStats();
  }, []);

  // 用户登录状态变化时重新加载统计数据
  useEffect(() => {
    if (user?.id) {
      loadUserStats();
    }
  }, [user?.id, loadUserStats]);

  // 筛选或排序变化时重新加载
  useEffect(() => {
    loadFeeds(true);
  }, [activeFilter, activeSort]);

  // 无限滚动
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadFeeds(false);
        }
      },
      { threshold: 0.1 }
    );

    const loadMoreTrigger = document.getElementById('load-more-trigger');
    if (loadMoreTrigger) {
      observer.observe(loadMoreTrigger);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, loadFeeds]);

  // 发布动态
  const handlePublish = async (data: CreateFeedRequest) => {
    try {
      const newFeed = await feedService.createFeed(data);
      setFeeds(prev => [newFeed, ...prev]);
      toast.success('动态发布成功！');
      return true;
    } catch (error) {
      toast.error('发布失败，请稍后重试');
      return false;
    }
  };

  // 点赞动态
  const handleLike = async (feedId: string) => {
    try {
      const result = await feedService.likeFeed(feedId);
      if (result.success) {
        setFeeds(prev => prev.map(feed => 
          feed.id === feedId 
            ? { ...feed, isLiked: !feed.isLiked, likes: result.likes }
            : feed
        ));
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 收藏动态
  const handleCollect = async (feedId: string) => {
    try {
      await feedService.collectFeed(feedId);
      setFeeds(prev => prev.map(feed => 
        feed.id === feedId 
          ? { ...feed, isCollected: !feed.isCollected }
          : feed
      ));
      toast.success('收藏成功');
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 分享动态
  const handleShare = async (feedId: string) => {
    try {
      const result = await feedService.shareFeed(feedId);
      if (result.success) {
        setFeeds(prev => prev.map(feed =>
          feed.id === feedId
            ? { ...feed, shares: result.shares, isShared: true }
            : feed
        ));
        toast.success('分享成功');
      }
    } catch (error) {
      toast.error('分享失败');
    }
  };

  // 点击动态卡片 - 跳转到作品详情页
  const handleOpenDetail = (feed: FeedItem) => {
    // 根据内容类型跳转到对应的作品详情页
    if (feed.contentType === 'video' || feed.contentType === 'image') {
      navigate(`/works/${feed.id}`);
    } else if (feed.contentType === 'article') {
      navigate(`/posts/${feed.id}`);
    } else {
      // 默认跳转到作品页
      navigate(`/works/${feed.id}`);
    }
  };

  // 关注用户
  const handleFollowUser = async (userId: string, isFollowing: boolean) => {
    try {
      if (isFollowing) {
        await feedService.unfollowUser(userId);
        toast.success('已取消关注');
      } else {
        await feedService.followUser(userId);
        toast.success('关注成功');
      }
      
      // 更新推荐用户列表
      setRecommendedUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, isFollowing: !isFollowing }
          : user
      ));
      
      // 更新动态中的关注状态
      setFeeds(prev => prev.map(feed => 
        feed.author.id === userId 
          ? { ...feed, author: { ...feed.author, isFollowing: !isFollowing } }
          : feed
      ));
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 加入/退出社群
  const handleJoinCommunity = async (communityId: string, isJoined: boolean) => {
    try {
      if (isJoined) {
        await feedService.leaveCommunity(communityId);
        toast.success('已退出社群');
      } else {
        await feedService.joinCommunity(communityId);
        toast.success('加入成功');
      }

      setRecommendedCommunities(prev => prev.map(community =>
        community.id === communityId
          ? { ...community, isJoined: !isJoined }
          : community
      ));
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 选择关注用户筛选
  const handleSelectFollowingUser = useCallback(async (userId: string | null) => {
    setSelectedFollowingUserId(userId);
    setIsLoading(true);
    try {
      if (userId) {
        // 获取特定用户的动态
        const response = await feedService.getFeeds({
          userId,
          sort: activeSort,
          page: 1,
          pageSize: 10,
        });
        setFeeds(response.feeds);
        setHasMore(response.hasMore);
      } else {
        // 重新加载全部动态
        await loadFeeds(true);
      }
    } catch (error) {
      toast.error('加载动态失败');
    } finally {
      setIsLoading(false);
    }
  }, [activeSort, loadFeeds]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-[#f1f2f3]'}`}>
      {/* 主内容区 - 更靠近顶部，边栏向中间靠拢 */}
      <div className="max-w-[1920px] mx-auto px-4 pt-2 pb-6">
        <div className="flex gap-4 justify-center">
          {/* 左侧边栏 */}
          <div className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-4">
              <LeftSidebar
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                user={user}
                userStats={userStats}
              />
            </div>
          </div>

          {/* 中间主内容区 */}
          <div className="flex-1 min-w-0 max-w-3xl">
            {/* 发布框 */}
            <FeedPublisher
              onPublish={handlePublish}
              user={user}
            />

            {/* 筛选标签 */}
            <FeedFilter
              activeFilter={activeFilter}
              activeSort={activeSort}
              onFilterChange={setActiveFilter}
              onSortChange={setActiveSort}
            />

            {/* 关注用户横向滚动列表 */}
            <FollowingUsersBar
              users={followingUsers}
              selectedUserId={selectedFollowingUserId}
              onSelectUser={handleSelectFollowingUser}
            />

            {/* 动态列表 */}
            <div ref={feedListRef} className="space-y-4">
              <AnimatePresence mode="popLayout">
                {feeds.map((feed, index) => (
                  <motion.div
                    key={feed.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <FeedCard
                      feed={feed}
                      onLike={() => handleLike(feed.id)}
                      onCollect={() => handleCollect(feed.id)}
                      onShare={() => handleShare(feed.id)}
                      onClick={() => handleOpenDetail(feed)}
                      onFollow={(isFollowing) => handleFollowUser(feed.author.id, isFollowing)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* 加载更多触发器 */}
              <div id="load-more-trigger" className="h-4" />

              {/* 加载状态 */}
              {(isLoading || isLoadingMore) && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className={`w-6 h-6 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {isLoading ? '加载中...' : '加载更多...'}
                  </span>
                </div>
              )}

              {/* 空状态 */}
              {!isLoading && feeds.length === 0 && (
                <div className={`text-center py-16 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                  <Sparkles className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    还没有动态
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    发布第一条动态，开始分享你的精彩时刻
                  </p>
                </div>
              )}

              {/* 没有更多 */}
              {!hasMore && feeds.length > 0 && (
                <div className={`text-center py-8 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  已经到底了~
                </div>
              )}
            </div>
          </div>

          {/* 右侧边栏 */}
          <div className="hidden xl:block w-72 flex-shrink-0">
            <div className="sticky top-4 space-y-4">
              <RightSidebar
                hotSearch={hotSearch}
                recommendedUsers={recommendedUsers}
                recommendedCommunities={recommendedCommunities}
                announcements={announcements}
                onFollowUser={handleFollowUser}
                onJoinCommunity={handleJoinCommunity}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
