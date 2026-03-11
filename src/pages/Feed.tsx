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
import { FeedDetailModal } from '@/components/feed/FeedDetailModal';
import { FeedShareModal } from '@/components/feed/FeedShareModal';
import { FeedCommentDrawer } from '@/components/feed/FeedCommentDrawer';

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

  // 调试：打印 user 对象
  console.log('[Feed] Current user:', user, 'user.id:', user?.id);

  // 状态管理
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<FeedFilterType>('all');
  const [activeSort, setActiveSort] = useState<FeedSortType>('latest');

  // 缓存所有原始数据，避免重复请求
  const [allFeedsCache, setAllFeedsCache] = useState<FeedItem[]>([]);
  const [isCacheLoading, setIsCacheLoading] = useState(false);

  // 调试：监听 activeFilter 变化
  useEffect(() => {
    console.log('[Feed] activeFilter changed:', activeFilter);
  }, [activeFilter]);
  
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

  // 评论弹窗状态
  const [selectedFeed, setSelectedFeed] = useState<FeedItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 评论抽屉状态 - 每个动态独立的展开状态
  const [openCommentFeedId, setOpenCommentFeedId] = useState<string | null>(null);

  // 分享弹窗状态
  const [shareFeed, setShareFeed] = useState<FeedItem | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const feedListRef = useRef<HTMLDivElement>(null);

  // 使用 ref 存储最新的筛选和排序状态，避免 useCallback 依赖问题
  const activeFilterRef = useRef(activeFilter);
  const activeSortRef = useRef(activeSort);
  const pageRef = useRef(page);
  const userRef = useRef(user);

  // 同步 ref 值
  useEffect(() => {
    activeFilterRef.current = activeFilter;
  }, [activeFilter]);

  useEffect(() => {
    activeSortRef.current = activeSort;
  }, [activeSort]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // 加载动态列表 - 使用缓存策略
  const loadFeeds = useCallback(async (isRefresh = false, targetPage?: number) => {
    if (isRefresh) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const currentPage = isRefresh ? 1 : (targetPage ?? pageRef.current);
      const currentFilter = activeFilterRef.current;
      const currentSort = activeSortRef.current;

      // 如果是 "全部" 筛选且有缓存数据，使用缓存策略（包括刷新操作）
      if (currentFilter === 'all' && allFeedsCache.length > 0) {
        console.log('[loadFeeds] Using cached data for filter:', currentFilter, 'sort:', currentSort);
        // 从缓存中筛选和排序
        let filteredFeeds = [...allFeedsCache];

        // 排序 - 确保按时间正确排序
        switch (currentSort) {
          case 'latest':
            filteredFeeds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
          case 'hot':
            filteredFeeds.sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares));
            break;
        }

        // 分页
        const start = (currentPage - 1) * 10;
        const end = start + 10;
        const paginatedFeeds = filteredFeeds.slice(start, end);

        console.log('[loadFeeds] First 3 sorted:', paginatedFeeds.slice(0, 3).map(f => ({ id: f.id, createdAt: f.createdAt, author: f.author.name })));

        if (isRefresh) {
          setFeeds(paginatedFeeds);
          setPage(2);
        } else {
          setFeeds(prev => [...prev, ...paginatedFeeds]);
          setPage(prev => prev + 1);
        }
        setHasMore(end < filteredFeeds.length);
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

      const params: FeedQueryParams = {
        filter: currentFilter,
        sort: currentSort,
        page: currentPage,
        pageSize: 10,
        currentUserId: userRef.current?.id,
      };

      console.log('[loadFeeds] Loading with params:', params);

      const response = await feedService.getFeeds(params);

      console.log('[loadFeeds] Response:', { feedsCount: response.feeds.length, hasMore: response.hasMore });

      if (isRefresh) {
        setFeeds(response.feeds);
        setPage(2);
      } else {
        setFeeds(prev => [...prev, ...response.feeds]);
        setPage(prev => prev + 1);
      }

      setHasMore(response.hasMore);

      // 如果是 "全部" 筛选且是刷新操作，更新缓存
      if (currentFilter === 'all' && isRefresh) {
        // 异步加载完整数据到缓存
        loadAllFeedsToCache();
      }
    } catch (error) {
      console.error('[loadFeeds] Error:', error);
      toast.error('加载动态失败，请稍后重试');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [allFeedsCache]);

  // 加载所有数据到缓存（用于快速筛选切换）
  const loadAllFeedsToCache = useCallback(async () => {
    if (isCacheLoading || allFeedsCache.length > 0) return;

    setIsCacheLoading(true);
    try {
      console.log('[loadAllFeedsToCache] Loading all feeds to cache...');
      const response = await feedService.getFeeds({
        filter: 'all',
        sort: 'latest',
        page: 1,
        pageSize: 100, // 加载更多数据到缓存
        currentUserId: user?.id,
      });
      // 确保缓存数据按时间排序
      const sortedFeeds = [...response.feeds].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAllFeedsCache(sortedFeeds);
      console.log('[loadAllFeedsToCache] Cached and sorted', sortedFeeds.length, 'feeds');
      console.log('[loadAllFeedsToCache] First 3 feeds:', sortedFeeds.slice(0, 3).map(f => ({ id: f.id, createdAt: f.createdAt, author: f.author.name })));
    } catch (error) {
      console.error('[loadAllFeedsToCache] Error:', error);
    } finally {
      setIsCacheLoading(false);
    }
  }, [isCacheLoading, allFeedsCache.length, user?.id]);

  // 加载右侧栏数据
  const loadSidebarData = useCallback(async () => {
    try {
      const [hotSearchData, usersData, communitiesData, announcementsData, followingData] = await Promise.all([
        feedService.getHotSearch(),
        feedService.getRecommendedUsers(),
        feedService.getRecommendedCommunities(user?.id),
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
    console.log('[Feed] Filter or sort changed:', { activeFilter, activeSort });
    // 重置页码
    setPage(1);
    // 直接加载，不使用 setTimeout 减少延迟
    loadFeeds(true);
  }, [activeFilter, activeSort, loadFeeds]);

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
      console.log('[Feed] Publishing feed:', data);
      const newFeed = await feedService.createFeed(data);
      console.log('[Feed] Created feed:', newFeed);

      // 更新当前显示的feeds
      setFeeds(prev => {
        console.log('[Feed] Previous feeds count:', prev.length);
        const updated = [newFeed, ...prev];
        console.log('[Feed] Updated feeds count:', updated.length);
        return updated;
      });

      // 同时更新缓存，确保切换标签时能看到新发布的动态
      setAllFeedsCache(prev => {
        const updated = [newFeed, ...prev];
        console.log('[Feed] Updated cache count:', updated.length);
        return updated;
      });

      // 清除服务层缓存，确保下次请求获取最新数据
      feedService.clearCache();

      toast.success('动态发布成功！');
      return true;
    } catch (error) {
      console.error('[Feed] Publish error:', error);
      toast.error('发布失败，请稍后重试');
      return false;
    }
  };

  // 点赞动态
  const handleLike = async (feedId: string) => {
    console.log('[Feed] handleLike called, user:', user);
    if (!user?.id) {
      toast.error('请先登录后再点赞');
      return;
    }
    console.log('[Feed] Calling likeFeed with userId:', user.id);
    try {
      const result = await feedService.likeFeed(feedId, user.id);
      console.log('[Feed] likeFeed result:', result);
      if (result.success) {
        setFeeds(prev => prev.map(feed =>
          feed.id === feedId
            ? { ...feed, isLiked: result.isLiked, likes: result.likes }
            : feed
        ));
        // 同时更新选中的动态（用于详情弹窗）
        setSelectedFeed(prev => prev && prev.id === feedId
          ? { ...prev, isLiked: result.isLiked, likes: result.likes }
          : prev
        );
      } else {
        toast.error('操作失败，请稍后重试');
      }
    } catch (error) {
      console.error('[Feed] likeFeed error:', error);
      toast.error('操作失败');
    }
  };

  // 收藏动态
  const handleCollect = async (feedId: string) => {
    if (!user?.id) {
      toast.error('请先登录后再收藏');
      return;
    }
    try {
      const result = await feedService.collectFeed(feedId, user.id);
      if (result.success) {
        setFeeds(prev => prev.map(feed =>
          feed.id === feedId
            ? { ...feed, isCollected: result.isCollected }
            : feed
        ));
        // 同时更新选中的动态（用于详情弹窗）
        setSelectedFeed(prev => prev && prev.id === feedId
          ? { ...prev, isCollected: result.isCollected }
          : prev
        );
        toast.success(result.isCollected ? '收藏成功' : '取消收藏成功');
      } else {
        toast.error('操作失败，请稍后重试');
      }
    } catch (error) {
      console.error('[Feed] collectFeed error:', error);
      toast.error('操作失败');
    }
  };

  // 分享动态 - 打开分享弹窗
  const handleShare = (feedId: string) => {
    const feed = feeds.find(f => f.id === feedId);
    if (feed) {
      setShareFeed(feed);
      setIsShareModalOpen(true);
    }
  };

  // 关闭分享弹窗
  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
    setShareFeed(null);
  };

  // 分享成功回调
  const handleShareSuccess = async (feedId: string) => {
    try {
      const result = await feedService.shareFeed(feedId);
      if (result.success) {
        setFeeds(prev => prev.map(feed =>
          feed.id === feedId
            ? { ...feed, shares: result.shares, isShared: true }
            : feed
        ));
        // 同时更新选中的动态（用于详情弹窗）
        setSelectedFeed(prev => prev && prev.id === feedId
          ? { ...prev, shares: result.shares, isShared: true }
          : prev
        );
      }
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  // 点击动态卡片 - 跳转到作品详情页
  const handleOpenDetail = (feed: FeedItem) => {
    console.log('[handleOpenDetail] Feed clicked:', { id: feed.id, sourceType: feed.sourceType, contentType: feed.contentType });

    // 检查是否是社群推荐动态
    if (feed.id.startsWith('community_feed_')) {
      const communityId = feed.id.replace('community_feed_', '');
      console.log('[handleOpenDetail] Navigating to community:', communityId);
      navigate(`/community/${communityId}`);
      return;
    }

    // 检查是否是公告动态
    if (feed.id.startsWith('announcement_')) {
      console.log('[handleOpenDetail] Announcement clicked, no navigation');
      // 公告类型不跳转，或者可以显示详情弹窗
      return;
    }

    // 检查是否有分享目标
    if (feed.shareTarget?.url) {
      console.log('[handleOpenDetail] Navigating to shareTarget.url:', feed.shareTarget.url);
      navigate(feed.shareTarget.url);
      return;
    }

    // 根据 sourceType 判断数据来源，跳转到对应页面
    if (feed.sourceType === 'post') {
      // Post 类型的数据统一跳转到帖子详情页
      console.log('[handleOpenDetail] Navigating to /post/', feed.id);
      navigate(`/post/${feed.id}`);
    } else if (feed.sourceType === 'work') {
      // Work 类型的数据跳转到作品页
      console.log('[handleOpenDetail] Navigating to /works/', feed.id);
      navigate(`/works/${feed.id}`);
    } else {
      // 兼容旧逻辑：根据内容类型跳转
      console.log('[handleOpenDetail] No sourceType, using contentType fallback');
      if (feed.contentType === 'video' || feed.contentType === 'image') {
        navigate(`/works/${feed.id}`);
      } else if (feed.contentType === 'article') {
        navigate(`/post/${feed.id}`);
      } else {
        // 默认跳转到帖子页
        navigate(`/post/${feed.id}`);
      }
    }
  };

  // 打开评论弹窗
  const handleOpenComment = (feed: FeedItem) => {
    setSelectedFeed(feed);
    setIsDetailModalOpen(true);
  };

  // 关闭评论弹窗
  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedFeed(null);
  };

  // 切换评论抽屉
  const handleToggleComment = (feedId: string) => {
    setOpenCommentFeedId((prev) => (prev === feedId ? null : feedId));
  };

  // 关闭评论抽屉
  const handleCloseComment = () => {
    setOpenCommentFeedId(null);
  };

  // 评论添加成功
  const handleCommentAdded = (feedId: string) => {
    setFeeds(prev => prev.map(feed =>
      feed.id === feedId
        ? { ...feed, comments: feed.comments + 1 }
        : feed
    ));
    // 同时更新 selectedFeed
    setSelectedFeed(prev => prev ? { ...prev, comments: prev.comments + 1 } : null);
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
        const result = await feedService.joinCommunity(communityId);
        if (result.alreadyMember) {
          toast.success('您已经是该社群的成员');
        } else {
          toast.success('加入成功');
        }
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

  // 选择关注用户筛选（与主筛选组合）
  const handleSelectFollowingUser = useCallback(async (userId: string | null) => {
    setSelectedFollowingUserId(userId);
    setIsLoading(true);
    try {
      if (userId) {
        // 获取特定用户的动态（同时应用主筛选和排序）
        // 使用 ref 获取最新的筛选和排序状态
        const response = await feedService.getFeeds({
          filter: activeFilterRef.current,
          sort: activeSortRef.current,
          userId,
          page: 1,
          pageSize: 10,
        });
        setFeeds(response.feeds);
        setHasMore(response.hasMore);
      } else {
        // 重新加载全部动态（保持当前主筛选和排序）
        await loadFeeds(true);
      }
    } catch (error) {
      toast.error('加载动态失败');
    } finally {
      setIsLoading(false);
    }
  }, [loadFeeds]);

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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{
                      duration: 0.2,
                      delay: Math.min(index * 0.03, 0.15), // 限制最大延迟
                      ease: "easeOut"
                    }}
                    className="rounded-xl overflow-hidden"
                  >
                    <FeedCard
                      feed={feed}
                      currentUserId={user?.id}
                      onLike={() => handleLike(feed.id)}
                      onCollect={() => handleCollect(feed.id)}
                      onShare={() => handleShare(feed.id)}
                      onClick={() => handleOpenDetail(feed)}
                      onFollow={(isFollowing) => handleFollowUser(feed.author.id, isFollowing)}
                      onComment={() => handleOpenComment(feed)}
                      isCommentOpen={openCommentFeedId === feed.id}
                      onCommentToggle={() => handleToggleComment(feed.id)}
                    />
                    {/* 评论抽屉 */}
                    <FeedCommentDrawer
                      feed={feed}
                      isOpen={openCommentFeedId === feed.id}
                      onClose={handleCloseComment}
                      currentUserId={user?.id}
                      currentUserName={user?.username || user?.name}
                      currentUserAvatar={user?.avatar_url || user?.avatar}
                      onCommentAdded={handleCommentAdded}
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

      {/* 评论详情弹窗 */}
      <FeedDetailModal
        feed={selectedFeed}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
        onLike={handleLike}
        onCollect={handleCollect}
        onShare={handleShare}
        onCommentAdded={handleCommentAdded}
        currentUserId={user?.id}
        currentUserName={user?.username || user?.name}
        currentUserAvatar={user?.avatar_url || user?.avatar}
        communityId={selectedFeed?.communityId}
      />

      {/* 分享弹窗 */}
      <FeedShareModal
        isOpen={isShareModalOpen}
        onClose={handleCloseShareModal}
        feed={shareFeed}
        onShareSuccess={() => shareFeed && handleShareSuccess(shareFeed.id)}
      />
    </div>
  );
}
