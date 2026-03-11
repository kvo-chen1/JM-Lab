/**
 * 动态内容展示系统服务
 * 处理动态的获取、发布、互动等操作
 * 
 * 优化版本：集成多级召回 + LTR排序算法
 */

import {
  FeedItem,
  FeedQueryParams,
  FeedFilterType,
  FeedSortType,
  CreateFeedRequest,
  FeedComment,
  HotSearchItem,
  RecommendedUser,
  RecommendedCommunity,
  CommunityAnnouncement,
  FeedStats,
  FeedAuthor,
  FeedMedia,
  FeedShareTarget
} from '@/types/feed';
import { mockFeedData } from '@/mocks/feedData';
import { getFollowingList, getPosts, Post, likePost, unlikePost, addComment } from './postService';
import { communityService } from './communityService';
import { supabase } from '@/lib/supabase';
import {
  generateOptimizedRecommendations,
  recordUserAction,
  calculateLTRFeatures,
  calculateLTRScore,
  multiChannelRecall,
  mergeRecallResults
} from './recommendationService';

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class FeedService {
  private mockFeeds: FeedItem[] = [];
  private mockHotSearch: HotSearchItem[] = [];
  private mockRecommendedUsers: RecommendedUser[] = [];
  private mockRecommendedCommunities: RecommendedCommunity[] = [];
  private mockAnnouncements: CommunityAnnouncement[] = [];
  // 内存中的评论缓存（用于非 UUID feed 的评论）
  private commentsCache: Map<string, FeedComment[]> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    this.mockFeeds = mockFeedData.feeds;
    this.mockHotSearch = mockFeedData.hotSearch;
    this.mockRecommendedUsers = mockFeedData.recommendedUsers;
    this.mockRecommendedCommunities = mockFeedData.recommendedCommunities;
    this.mockAnnouncements = mockFeedData.announcements;
  }

  /**
   * 将 Post 转换为 FeedItem
   */
  private transformPostToFeedItem(post: Post): FeedItem {
    const author: FeedAuthor = {
      id: typeof post.author === 'string' ? post.author : post.author?.id || 'unknown',
      type: 'user',
      name: typeof post.author === 'string' ? '用户' : post.author?.username || '未知用户',
      avatar: typeof post.author === 'string' 
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author}` 
        : post.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.id || 'unknown'}`,
      verified: false,
    };

    // 确定内容类型
    let contentType: FeedItem['contentType'] = 'text';
    if (post.videoUrl || post.type === 'video') {
      contentType = 'video';
    } else if (post.thumbnail && !post.videoUrl) {
      contentType = 'image';
    } else if (post.category === 'article' || post.category === 'text') {
      contentType = 'article';
    }

    // 构建媒体数组
    const media: FeedMedia[] = [];
    if (post.thumbnail) {
      media.push({
        id: `media_${post.id}`,
        type: post.videoUrl ? 'video' : 'image',
        url: post.thumbnail,
        thumbnailUrl: post.thumbnail,
      });
    }

    return {
      id: post.id,
      author,
      contentType,
      sourceType: post.publishType === 'explore' || post.publishType === 'both' ? 'work' : 'post',  // 津脉广场作品标识为 'work'，社群帖子标识为 'post'
      communityId: post.communityId, // 添加社群ID用于@提及功能
      publishType: post.publishType, // 发布类型：explore(津脉广场) / community(社群) / both
      title: post.title || '',
      content: post.description || '',
      media: media.length > 0 ? media : undefined,
      tags: post.tags || [],
      likes: post.likes || 0,
      comments: post.comments?.length || 0,
      shares: post.shares || 0,
      views: post.views || 0,
      isLiked: post.isLiked || false,
      isCollected: post.isBookmarked || false,
      createdAt: post.date || post.createdAt || new Date().toISOString(),
      updatedAt: post.updatedAt || post.date || new Date().toISOString(),
    };
  }

  // 缓存数据
  private feedsCache: FeedItem[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 获取动态列表（真实数据）
   */
  async getFeeds(params: FeedQueryParams = {}): Promise<{ feeds: FeedItem[]; hasMore: boolean; total: number }> {
    const {
      filter = 'all',
      sort = 'latest',
      page = 1,
      pageSize = 10,
      userId,
      brandId,
      currentUserId
    } = params;

    try {
      // 检查缓存是否有效（仅用于 'all' 筛选）
      const now = Date.now();
      const isCacheValid = this.feedsCache && (now - this.cacheTimestamp) < this.CACHE_DURATION;

      let posts: any[] = [];
      let communities: any[] = [];
      let apiFeeds: any[] = [];

      if (filter === 'all' && isCacheValid) {
        // 使用缓存数据
        console.log('[getFeeds] Using cached data');
        return this.processFeeds(this.feedsCache!, params);
      }

      // 根据筛选条件决定需要请求哪些数据源
      const needPosts = filter === 'all' || filter === 'works' || filter === 'article' || filter === 'video' || filter === 'image';
      const needCommunities = filter === 'all' || filter === 'community';
      const needApiFeeds = filter === 'all' || filter === 'interaction';

      // 并行请求需要的数据源
      const requests: Promise<any>[] = [];

      if (needPosts) {
        requests.push(
          getPosts('all', currentUserId, false, 'works')
            .catch(() => [])
        );
      } else {
        requests.push(Promise.resolve([]));
      }

      if (needCommunities) {
        requests.push(
          communityService.getCommunities().catch(() => [])
        );
      } else {
        requests.push(Promise.resolve([]));
      }

      if (needApiFeeds) {
        requests.push(
          fetch('/api/feeds')
            .then(res => res.json())
            .then(data => data.code === 0 ? data.data : [])
            .catch(() => [])
        );
      } else {
        requests.push(Promise.resolve([]));
      }

      [posts, communities, apiFeeds] = await Promise.all(requests);

      // 转换帖子为 FeedItem
      let feeds = posts.map(post => this.transformPostToFeedItem(post));
      
      // 添加从 /api/feeds 获取的动态
      const apiFeedItems: FeedItem[] = apiFeeds.map((feed: any) => ({
        id: feed.id,
        author: {
          id: feed.author?.id || 'unknown',
          type: 'user',
          name: feed.author?.name || '创作者',
          avatar: feed.author?.avatar || '',
          verified: false,
        },
        contentType: feed.contentType || 'image',
        content: feed.content,
        media: feed.images?.map((url: string, index: number) => ({
          id: `media_${feed.id}_${index}`,
          type: 'image',
          url: url,
          thumbnailUrl: url,
        })),
        communityId: feed.communityId,
        publishType: feed.publishType || 'explore', // 默认为津脉广场作品
        likes: feed.likes || 0,
        comments: feed.comments || 0,
        shares: feed.shares || 0,
        views: feed.views || 0,
        isLiked: false,
        isCollected: false,
        createdAt: feed.createdAt || new Date().toISOString(),
        updatedAt: feed.updatedAt || new Date().toISOString(),
      }));
      
      // 合并动态
      feeds = [...apiFeedItems, ...feeds];

      // 添加社群动态（作为活动/公告类型）
      // 使用一个较旧的时间戳，让社群推荐排在真实动态后面
      const baseTimestamp = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30天前
      const communityFeeds: FeedItem[] = communities.slice(0, 5).map((community, index) => ({
        id: `community_feed_${community.id}`,
        author: {
          id: community.creatorId || 'system',
          type: 'official',
          name: '社群推荐',
          avatar: community.avatar,
          verified: true,
        },
        contentType: 'activity',
        title: community.name,
        content: community.description,
        media: community.cover ? [{
          id: `community_cover_${community.id}`,
          type: 'image',
          url: community.cover,
          thumbnailUrl: community.cover,
        }] : undefined,
        tags: ['社群', '推荐', ...(community.tags || [])],
        likes: 0,
        comments: 0,
        shares: 0,
        views: community.memberCount || 0,
        isLiked: false,
        isCollected: false,
        // 使用旧时间戳 + 索引偏移，确保社群推荐排在真实动态后面
        createdAt: new Date(baseTimestamp + index * 1000).toISOString(),
        updatedAt: new Date(baseTimestamp).toISOString(),
        shareTarget: {
          id: community.id,
          type: 'community',
          title: community.name,
          description: community.description,
          thumbnailUrl: community.avatar,
          url: `/community/${community.id}`,
        },
      }));

      // 合并所有动态（只包含帖子和社群推荐）
      feeds = [...feeds, ...communityFeeds];

      // 根据筛选条件过滤
      console.log('[getFeeds] Before filter:', { filter, sort, userId, feedsCount: feeds.length });
      if (filter !== 'all') {
        switch (filter) {
          case 'community': {
            // 社群动态：显示关注用户新建的社群、在社群发的帖子、社群活动通知
            try {
              const followingList = await getFollowingList();
              const followingIds = followingList.map(u => u.id);

              // 获取所有社群
              const communities = await communityService.getCommunities();

              // 1. 关注用户创建的社群
              const followingCreatedCommunities = communities.filter(c =>
                followingIds.includes(c.creatorId || '')
              );

              // 2. 获取关注用户加入的社群
              const followingJoinedCommunities: typeof communities = [];
              for (const userId of followingIds) {
                try {
                  const userCommunities = await communityService.getUserCommunities(userId);
                  followingJoinedCommunities.push(...userCommunities);
                } catch (e) {
                  // 忽略单个用户的错误
                }
              }

              // 合并关注用户相关的社群（去重）
              const relatedCommunityIds = new Set([
                ...followingCreatedCommunities.map(c => c.id),
                ...followingJoinedCommunities.map(c => c.id)
              ]);

              // 3. 筛选出与这些社群相关的动态
              // - 关注用户创建的社群
              // - 关注用户在社群发的帖子（通过 shareTarget 或标签判断）
              // - 社群相关的活动通知
              feeds = feeds.filter(f => {
                // 检查是否是关注用户创建的社群相关内容
                if (followingIds.includes(f.author.id)) {
                  // 关注用户发布的任何内容都算
                  return true;
                }

                // 检查是否分享到社群
                if (f.shareTarget?.type === 'community' && relatedCommunityIds.has(f.shareTarget.id)) {
                  return true;
                }

                // 检查内容中是否包含社群相关的标签
                const communityTags = f.tags?.filter(tag =>
                  tag.includes('社群') || tag.includes('社区') || tag.includes('活动')
                );
                if (communityTags && communityTags.length > 0) {
                  return true;
                }

                // 检查是否是社群活动类型
                if (f.contentType === 'activity' || f.contentType === 'community') {
                  return true;
                }

                return false;
              });

              // 将关注用户创建的社群作为特殊的动态项添加到列表开头
              const communityFeedItems: FeedItem[] = followingCreatedCommunities.map(community => ({
                id: `community_${community.id}`,
                author: {
                  id: community.creatorId || 'system',
                  type: 'user',
                  name: community.creatorId ? (followingList.find(u => u.id === community.creatorId)?.username || '用户') : '系统',
                  avatar: followingList.find(u => u.id === community.creatorId)?.avatar_url || community.avatar,
                  verified: false,
                },
                contentType: 'community',
                title: `新建了社群：${community.name}`,
                content: community.description,
                media: community.cover ? [{
                  id: `cover_${community.id}`,
                  type: 'image',
                  url: community.cover,
                  thumbnailUrl: community.cover,
                }] : undefined,
                tags: ['社群', '新建', ...(community.tags || [])],
                likes: 0,
                comments: 0,
                shares: 0,
                views: 0,
                isLiked: false,
                isCollected: false,
                createdAt: community.createdAt || new Date().toISOString(),
                updatedAt: community.updatedAt || new Date().toISOString(),
                shareTarget: {
                  id: community.id,
                  type: 'community',
                  title: community.name,
                  description: community.description,
                  thumbnailUrl: community.avatar,
                  url: `/community/${community.id}`,
                },
              }));

              // 合并社群动态和原有动态，按时间排序
              feeds = [...communityFeedItems, ...feeds];
            } catch (error) {
              // 如果获取失败（如未登录），返回空数组
              console.log('[getFeeds] 获取社群数据失败:', error);
              feeds = [];
            }
            break;
          }
          case 'works':
            // 作品：只显示津脉广场的作品（视频+图文），不包含社群帖子
            console.log('[getFeeds] works filter - before:', feeds.length, 'feeds');
            feeds = feeds.filter(f => {
              // 首先必须是视频或图文类型
              const isWorkContent = f.contentType === 'video' || f.contentType === 'image' || f.media?.some(m => m.type === 'image' || m.type === 'video');
              // 然后必须是津脉广场的作品（publishType 为 explore 或 both）
              const isExploreWork = f.publishType === 'explore' || f.publishType === 'both';
              console.log('[getFeeds] works filter - feed:', f.id, 'contentType:', f.contentType, 'publishType:', f.publishType, 'isWorkContent:', isWorkContent, 'isExploreWork:', isExploreWork);
              return isWorkContent && isExploreWork;
            });
            console.log('[getFeeds] works filter - after:', feeds.length, 'feeds');
            break;
          case 'video':
            feeds = feeds.filter(f => f.contentType === 'video');
            break;
          case 'image':
            feeds = feeds.filter(f => f.contentType === 'image' || f.media?.some(m => m.type === 'image'));
            break;
          case 'article':
            feeds = feeds.filter(f => f.contentType === 'article');
            break;
          case 'activity': {
            // 活动：显示自己及关注用户发的活动
            try {
              // 获取当前用户ID
              let currentUserId = userId;

              if (!currentUserId) {
                const { data: { user } } = await supabase.auth.getUser();
                currentUserId = user?.id;
              }

              // 获取关注用户列表
              let followingIds: string[] = [];
              if (currentUserId) {
                try {
                  const followingList = await getFollowingList();
                  followingIds = followingList.map(u => u.id);
                } catch (e) {
                  console.log('[getFeeds] 获取关注列表失败:', e);
                }
              }

              // 构建需要查询的用户ID列表（自己 + 关注用户）
              const targetUserIds = [currentUserId, ...followingIds].filter(Boolean) as string[];
              console.log('[getFeeds] activity - target user ids:', targetUserIds);

              // 获取所有已发布的活动
              const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
              let eventsData: any[] = [];

              // 首先尝试获取所有公开活动
              if (token) {
                try {
                  const response = await fetch('/api/events?limit=100', {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (response.ok) {
                    const result = await response.json();
                    console.log('[getFeeds] activity - API result:', result);
                    eventsData = result.data || [];
                    console.log('[getFeeds] activity - fetched all events:', eventsData.length);
                    // 打印所有活动的标题和状态
                    console.log('[getFeeds] activity - all events summary:');
                    eventsData.forEach((event, index) => {
                      const creatorId = event.organizer?.id || event.creator?.id || event.user?.id;
                      console.log(`  ${index + 1}. ${event.title} - status: ${event.status}, creator: ${creatorId}`);
                    });
                    // 打印第一个活动的完整结构
                    if (eventsData.length > 0) {
                      console.log('[getFeeds] activity - first event from API:', JSON.stringify(eventsData[0], null, 2));
                    } else {
                      console.log('[getFeeds] activity - API returned empty data, result:', JSON.stringify(result));
                    }
                  } else {
                    console.log('[getFeeds] activity - API response not ok:', response.status, response.statusText);
                  }
                } catch (apiError) {
                  console.warn('[getFeeds] API 获取所有活动失败，尝试 Supabase:', apiError);
                }
              }

              // 如果 API 失败，使用 Supabase 直接查询
              if (eventsData.length === 0) {
                const { data, error } = await supabase
                  .from('events')
                  .select('*, organizer_id')
                  .order('created_at', { ascending: false });

                if (!error && data) {
                  eventsData = data;
                  console.log('[getFeeds] activity - fetched from supabase:', eventsData.length);
                } else if (error) {
                  console.error('[getFeeds] Supabase error:', error);
                }
              }

              // 如果还是没有数据或没有创建者字段，尝试另一种方式查询
              if (eventsData.length === 0 || (eventsData.length > 0 && !eventsData[0].organizer_id && !eventsData[0].organizerId)) {
                console.log('[getFeeds] Trying alternative query for events...');
                try {
                  const { data, error } = await supabase
                    .from('events')
                    .select('id, title, description, status, created_at, updated_at, image_url, thumbnail_url, organizer_id, created_by, author_id')
                    .order('created_at', { ascending: false });

                  if (!error && data && data.length > 0) {
                    eventsData = data;
                    console.log('[getFeeds] activity - fetched with alternative query:', eventsData.length);
                  }
                } catch (e) {
                  console.error('[getFeeds] Alternative query error:', e);
                }
              }

              // 过滤：只显示已发布状态的活动，且是自己或关注用户发布的
              console.log('[getFeeds] activity filter - before filter, eventsData:', eventsData.length);
              console.log('[getFeeds] activity filter - targetUserIds:', targetUserIds);
              eventsData.forEach(event => {
                // 获取创建者ID（支持多种格式）
                const creatorId = event.creator_id || event.organizer_id || event.user_id ||
                                  event.created_by || event.author_id ||
                                  event.creatorId || event.organizerId || event.userId ||
                                  event.organizer?.id || event.creator?.id || event.user?.id;
                console.log('[getFeeds] activity filter - raw event:', {
                  title: event.title,
                  status: event.status,
                  creator_id: event.creator_id,
                  organizer_id: event.organizer_id,
                  user_id: event.user_id,
                  created_by: event.created_by,
                  author_id: event.author_id,
                  creatorId: event.creatorId,
                  organizerId: event.organizerId,
                  userId: event.userId,
                  'organizer.id': event.organizer?.id,
                  'creator.id': event.creator?.id,
                  'user.id': event.user?.id
                });
              });
              eventsData = eventsData.filter(event => {
                const isPublished = event.status === 'published' || event.status === 'completed';
                // 支持多种可能的字段名（下划线命名、驼峰命名、嵌套对象）
                const eventCreatorId = event.creator_id || event.organizer_id || event.user_id ||
                                       event.created_by || event.author_id ||
                                       event.creatorId || event.organizerId || event.userId ||
                                       event.organizer?.id || event.creator?.id || event.user?.id;
                const isFromTargetUser = targetUserIds.length === 0 || targetUserIds.includes(eventCreatorId);
                const shouldInclude = isPublished && isFromTargetUser;
                console.log('[getFeeds] activity filter - event:', event.title, 'status:', event.status, 'creator:', eventCreatorId, 'isPublished:', isPublished, 'isFromTargetUser:', isFromTargetUser, 'include:', shouldInclude);
                return shouldInclude;
              });
              console.log('[getFeeds] activity filter - after filter, eventsData:', eventsData.length);

              // 获取所有相关用户的用户信息
              const uniqueCreatorIds = [...new Set(eventsData.map(e =>
                e.creator_id || e.organizer_id || e.user_id || e.created_by || e.author_id ||
                e.creatorId || e.organizerId || e.userId ||
                e.organizer?.id || e.creator?.id || e.user?.id
              ).filter(Boolean))];
              const { data: usersData } = await supabase
                .from('users')
                .select('id, username, avatar_url')
                .in('id', uniqueCreatorIds);

              const userMap = new Map(usersData?.map(u => [u.id, u]) || []);

              // 将活动数据转换为 FeedItem 格式
              const eventFeeds: FeedItem[] = eventsData.map(event => {
                // 尝试获取图片 URL（支持多种字段名）
                let imageUrl = '';
                if (event.thumbnailUrl) {
                  imageUrl = event.thumbnailUrl;
                } else if (event.coverUrl) {
                  imageUrl = event.coverUrl;
                } else if (event.image_url) {
                  imageUrl = event.image_url;
                } else if (event.imageUrl) {
                  imageUrl = event.imageUrl;
                } else if (event.cover_url) {
                  imageUrl = event.cover_url;
                } else if (event.media && event.media.length > 0 && event.media[0].url) {
                  imageUrl = event.media[0].url;
                }

                const creatorId = event.creator_id || event.organizer_id || event.user_id ||
                                  event.created_by || event.author_id ||
                                  event.creatorId || event.organizerId || event.userId ||
                                  event.organizer?.id || event.creator?.id || event.user?.id;
                // 优先使用 API 返回的 organizer 对象信息
                const organizerInfo = event.organizer || event.creator || event.user;
                const creator = userMap.get(creatorId) || organizerInfo;
                const isSelf = creatorId === currentUserId;

                return {
                  id: event.id,
                  author: {
                    id: creatorId || 'unknown',
                    type: 'user',
                    name: creator?.username || (isSelf ? '我' : '用户'),
                    avatar: creator?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creatorId}`,
                    verified: false,
                  },
                  contentType: 'activity',
                  title: event.title,
                  content: event.description || '',
                  media: imageUrl ? [{
                    id: `event_image_${event.id}`,
                    type: 'image',
                    url: imageUrl,
                    thumbnailUrl: imageUrl,
                  }] : undefined,
                  tags: event.tags || ['活动'],
                  likes: event.likes || 0,
                  comments: event.comments_count || event.comments || 0,
                  shares: event.shares || 0,
                  views: event.views || 0,
                  isLiked: false,
                  isCollected: false,
                  createdAt: event.created_at || new Date().toISOString(),
                  updatedAt: event.updated_at || new Date().toISOString(),
                  shareTarget: {
                    id: event.id,
                    type: 'activity',
                    title: event.title,
                    description: event.description,
                    thumbnailUrl: imageUrl,
                    url: `/events/${event.id}`,
                  },
                };
              });

              // 使用活动数据替换原有 feeds
              feeds = eventFeeds;

              console.log('[getFeeds] 找到自己及关注用户的活动:', feeds.length);
            } catch (error) {
              // 如果获取失败，返回空数组
              console.log('[getFeeds] 获取活动失败:', error);
              feeds = [];
            }
            break;
          }
          case 'brand':
            feeds = feeds.filter(f => f.author.type === 'brand');
            break;
          case 'interaction': {
            // 互动：显示自己发布的动态
            try {
              // 获取当前用户ID - 优先使用 params 中的 currentUserId
              let targetUserId = currentUserId;
              if (!targetUserId) {
                const { data: { user } } = await supabase.auth.getUser();
                targetUserId = user?.id;
              }

              if (targetUserId) {
                // 从 feeds 表获取当前用户发布的动态
                const { data: userFeeds, error } = await supabase
                  .from('feeds')
                  .select('*')
                  .eq('user_id', targetUserId)
                  .order('created_at', { ascending: false });

                if (!error && userFeeds) {
                  // 获取用户信息
                  const { data: userData } = await supabase
                    .from('users')
                    .select('id, username, avatar_url')
                    .eq('id', targetUserId)
                    .single();

                  // 转换为自己的 FeedItem 格式
                  const myFeeds: FeedItem[] = userFeeds.map(feed => ({
                    id: feed.id,
                    author: {
                      id: targetUserId,
                      type: 'user',
                      name: userData?.username || '我',
                      avatar: userData?.avatar_url || '',
                      verified: false,
                    },
                    contentType: 'image',
                    content: feed.content,
                    media: feed.images?.map((url: string, index: number) => ({
                      id: `media_${feed.id}_${index}`,
                      type: 'image',
                      url: url,
                      thumbnailUrl: url,
                    })),
                    communityId: feed.community_id,
                    likes: feed.likes || 0,
                    comments: feed.comments || 0,
                    shares: feed.shares || 0,
                    views: feed.views || 0,
                    isLiked: false,
                    isCollected: false,
                    createdAt: feed.created_at,
                    updatedAt: feed.updated_at,
                  }));

                  feeds = myFeeds;
                  console.log('[getFeeds] 找到自己的动态:', feeds.length);
                } else {
                  feeds = [];
                }
              } else {
                feeds = [];
              }
            } catch (error) {
              console.log('[getFeeds] 获取自己的动态失败:', error);
              feeds = [];
            }
            break;
          }
        }
      }

      // 根据用户ID过滤（用于点击关注用户时筛选 - 在所有筛选条件之后执行）
      if (userId) {
        feeds = feeds.filter(f => f.author.id === userId);
        console.log('[getFeeds] After userId filter:', { userId, feedsCount: feeds.length });
      }

      // 根据品牌ID过滤
      if (brandId) {
        feeds = feeds.filter(f => f.author.id === brandId);
        console.log('[getFeeds] After brandId filter:', { brandId, feedsCount: feeds.length });
      }

      // 排序
      console.log('[getFeeds] Before sort:', { sort, feedsCount: feeds.length });
      switch (sort) {
        case 'latest':
          feeds.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return timeB - timeA;
          });
          console.log('[getFeeds] Sorted by latest, first 3:', feeds.slice(0, 3).map(f => ({ id: f.id, createdAt: f.createdAt, time: new Date(f.createdAt).getTime(), author: f.author.name })));
          break;
        case 'hot':
          feeds.sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares));
          console.log('[getFeeds] Sorted by hot');
          break;
        case 'recommend':
          // 优化版推荐排序：使用LTR特征 + 多级召回策略
          feeds = await this.sortByOptimizedRecommendation(feeds, currentUserId);
          console.log('[getFeeds] Sorted by optimized recommendation algorithm');
          break;
      }

      // 分页
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedFeeds = feeds.slice(start, end);
      const hasMore = end < feeds.length;

      console.log('[getFeeds] Pagination:', { page, pageSize, start, end, totalFeeds: feeds.length, paginatedCount: paginatedFeeds.length, hasMore });

      // 更新缓存（仅缓存 'all' 筛选的完整数据）
      if (filter === 'all' && page === 1) {
        this.feedsCache = feeds;
        this.cacheTimestamp = Date.now();
        console.log('[getFeeds] Updated cache with', feeds.length, 'feeds');
      }

      return {
        feeds: paginatedFeeds,
        hasMore,
        total: feeds.length
      };
    } catch (error) {
      console.error('获取动态列表失败:', error);
      // 如果获取失败，返回模拟数据
      return {
        feeds: this.mockFeeds.slice(0, pageSize),
        hasMore: false,
        total: this.mockFeeds.length
      };
    }
  }

  /**
   * 处理缓存的feeds数据（排序和分页）
   */
  private processFeeds(
    cachedFeeds: FeedItem[],
    params: FeedQueryParams
  ): { feeds: FeedItem[]; hasMore: boolean; total: number } {
    const { sort = 'latest', page = 1, pageSize = 10 } = params;

    let feeds = [...cachedFeeds];

    // 排序
    switch (sort) {
      case 'latest':
        feeds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'hot':
        feeds.sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares));
        break;
    }

    // 分页
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedFeeds = feeds.slice(start, end);
    const hasMore = end < feeds.length;

    console.log('[processFeeds] Using cached data:', { page, pageSize, total: feeds.length, returned: paginatedFeeds.length, hasMore });

    return {
      feeds: paginatedFeeds,
      hasMore,
      total: feeds.length
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.feedsCache = null;
    this.cacheTimestamp = 0;
    console.log('[feedService] Cache cleared');
  }

  /**
   * 获取单个动态详情
   */
  async getFeedById(feedId: string): Promise<FeedItem | null> {
    await delay(300);
    const feed = this.mockFeeds.find(f => f.id === feedId);
    return feed || null;
  }

  /**
   * 发布动态
   */
  async createFeed(request: CreateFeedRequest): Promise<FeedItem> {
    // 调用后端API创建动态
    console.log('[feedService.createFeed] Sending request:', {
      content: request.content,
      images: request.media?.filter(m => m.type === 'image').map(m => m.url) || [],
      videos: request.media?.filter(m => m.type === 'video').map(m => m.url) || [],
      communityId: request.communityId
    });
    
    const response = await fetch('/api/feeds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({
        content: request.content,
        images: request.media?.filter(m => m.type === 'image').map(m => m.url) || [],
        videos: request.media?.filter(m => m.type === 'video').map(m => m.url) || [],
        communityId: request.communityId
      })
    });

    console.log('[feedService.createFeed] Response status:', response.status);
    
    if (!response.ok) {
      console.error('[feedService.createFeed] Response not ok:', response.status);
      throw new Error('发布动态失败');
    }

    const result = await response.json();
    console.log('[feedService.createFeed] Response result:', result);
    
    if (result.code !== 0) {
      throw new Error(result.message || '发布动态失败');
    }

    // 将后端返回的数据转换为FeedItem格式
    const feedData = result.data;
    const newFeed: FeedItem = {
      id: feedData.id,
      author: {
        id: feedData.author.id,
        type: 'user',
        name: feedData.author.name,
        avatar: feedData.author.avatar,
        verified: false,
      },
      contentType: request.contentType,
      content: feedData.content,
      media: request.media,
      tags: request.tags,
      location: request.location,
      communityId: feedData.communityId,
      likes: feedData.likes,
      comments: feedData.comments,
      shares: feedData.shares,
      views: feedData.views,
      isLiked: false,
      isCollected: false,
      isShared: false,
      createdAt: feedData.createdAt,
      updatedAt: feedData.updatedAt,
    };

    return newFeed;
  }

  /**
   * 删除动态
   */
  async deleteFeed(feedId: string): Promise<boolean> {
    await delay(300);
    const index = this.mockFeeds.findIndex(f => f.id === feedId);
    if (index > -1) {
      this.mockFeeds.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 检查是否为有效的 UUID 格式
   */
  private isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  /**
   * 优化版推荐排序
   * 使用LTR特征 + 多级召回策略
   */
  private async sortByOptimizedRecommendation(
    feeds: FeedItem[],
    userId?: string
  ): Promise<FeedItem[]> {
    if (!userId) {
      // 未登录用户使用热门排序
      return feeds.sort((a, b) =>
        (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares)
      );
    }

    try {
      // 1. 将FeedItem转换为推荐项格式
      const recommendedItems = feeds.map(feed => ({
        id: feed.id,
        type: 'post' as const,
        title: feed.content.slice(0, 50) || '动态内容',
        thumbnail: feed.media?.[0]?.url || '',
        score: 0,
        reason: '',
        metadata: {
          ...feed,
          likes: feed.likes,
          views: feed.views,
          comments: feed.comments,
          shares: feed.shares,
          createdAt: feed.createdAt,
          authorId: feed.author.id,
          category: feed.tags?.[0],
          tags: feed.tags
        }
      }));

      // 2. 使用LTR特征计算分数
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || userId;

      // 3. 计算每个feed的LTR分数
      const scoredFeeds = await Promise.all(
        recommendedItems.map(async item => {
          try {
            // 获取用户行为数据
            const userActions = await this.getUserFeedActions(currentUserId);

            // 计算LTR特征
            const features = calculateLTRFeatures(currentUserId, item, userActions);
            const ltrScore = calculateLTRScore(features);

            // 基础热度分数
            const hotScore = (item.metadata.likes + item.metadata.comments + item.metadata.shares) / 100;

            // 新鲜度分数
            const freshness = Math.exp(-(
              Date.now() - new Date(item.metadata.createdAt).getTime()
            ) / (1000 * 60 * 60 * 24 * 7));

            // 综合分数：LTR分数 + 热度 + 新鲜度
            const finalScore = ltrScore * 50 + hotScore * 0.3 + freshness * 10;

            return {
              feed: feeds.find(f => f.id === item.id)!,
              score: finalScore,
              reason: this.generateRecommendationReason(features)
            };
          } catch (error) {
            // 计算失败时使用默认分数
            const defaultScore = (item.metadata.likes + item.metadata.comments) * 0.3;
            return {
              feed: feeds.find(f => f.id === item.id)!,
              score: defaultScore,
              reason: '热门内容'
            };
          }
        })
      );

      // 4. 按分数排序
      scoredFeeds.sort((a, b) => b.score - a.score);

      // 5. 记录推荐行为用于后续优化
      this.recordFeedRecommendation(currentUserId, scoredFeeds.slice(0, 10));

      return scoredFeeds.map(item => item.feed);
    } catch (error) {
      console.error('[sortByOptimizedRecommendation] Error:', error);
      // 出错时回退到热门排序
      return feeds.sort((a, b) =>
        (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares)
      );
    }
  }

  /**
   * 获取用户在feed上的行为
   */
  private async getUserFeedActions(userId: string): Promise<any[]> {
    // 从recommendationService获取用户行为
    const { getUserActions } = await import('./recommendationService');
    return getUserActions().filter((action: any) => action.userId === userId);
  }

  /**
   * 生成推荐理由
   */
  private generateRecommendationReason(features: any): string {
    const reasons: string[] = [];

    if (features.userFeature.favoriteCategoryMatch > 0.7) {
      reasons.push('符合你的兴趣');
    }
    if (features.contentFeature.freshness > 0.8) {
      reasons.push('新鲜内容');
    }
    if (features.contentFeature.popularity > 0.7) {
      reasons.push('热门内容');
    }
    if (features.crossFeature.authorFollow > 0) {
      reasons.push('关注作者');
    }

    return reasons.length > 0 ? reasons.join('，') : '推荐内容';
  }

  /**
   * 记录feed推荐行为
   */
  private async recordFeedRecommendation(userId: string, recommendedItems: any[]): Promise<void> {
    try {
      // 记录推荐展示行为
      recommendedItems.forEach((item, index) => {
        recordUserAction({
          id: `rec_${Date.now()}_${index}`,
          userId,
          itemId: item.feed.id,
          itemType: 'post',
          actionType: 'view',
          timestamp: new Date().toISOString(),
          metadata: {
            position: index,
            score: item.score,
            reason: item.reason,
            source: 'optimized_recommendation'
          }
        });
      });
    } catch (error) {
      console.error('[recordFeedRecommendation] Error:', error);
    }
  }

  /**
   * 点赞动态 - 使用 feed_likes 表
   */
  async likeFeed(feedId: string, userId?: string): Promise<{ success: boolean; likes: number; isLiked: boolean }> {
    try {
      console.log('[likeFeed] Called with feedId:', feedId, 'userId:', userId);

      // 获取当前用户ID
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id;
        console.log('[likeFeed] Got userId from Supabase:', currentUserId);
      } else {
        console.log('[likeFeed] Using provided userId:', currentUserId);
      }

      if (!currentUserId) {
        console.warn('[likeFeed] No valid userId');
        return { success: false, likes: 0, isLiked: false };
      }

      // 检查 feedId 是否为有效的 UUID
      const isValidUUID = this.isValidUUID(feedId);
      console.log('[likeFeed] Is valid UUID:', isValidUUID);

      // 先从本地 mock 数据中查找当前状态
      const feed = this.mockFeeds.find(f => f.id === feedId);
      const isCurrentlyLiked = feed?.isLiked ?? false;

      // 如果不是有效的 UUID，只更新本地状态（如 community_feed_xxx）
      if (!isValidUUID) {
        console.log('[likeFeed] Non-UUID feedId, updating local state only');
        // 对于非 UUID 的 feed，直接返回成功，让前端更新状态
        // 这些 feed 不在 mockFeeds 中，但前端会维护自己的状态
        const newLikes = isCurrentlyLiked ? Math.max(0, (feed?.likes ?? 0) - 1) : (feed?.likes ?? 0) + 1;
        if (feed) {
          feed.isLiked = !isCurrentlyLiked;
          feed.likes = newLikes;
        }
        return {
          success: true,
          likes: newLikes,
          isLiked: !isCurrentlyLiked
        };
      }

      try {
        let dbOperationSuccess = true;

        if (isCurrentlyLiked) {
          // 取消点赞 - 删除记录
          const { error } = await supabase
            .from('feed_likes')
            .delete()
            .eq('feed_id', feedId)
            .eq('user_id', currentUserId);

          if (error) {
            console.warn('[likeFeed] Delete like failed:', error);
            dbOperationSuccess = false;
          }
        } else {
          // 点赞 - 插入记录
          const { error } = await supabase
            .from('feed_likes')
            .insert({
              feed_id: feedId,
              user_id: currentUserId,
            });

          if (error) {
            console.warn('[likeFeed] Insert like failed:', error);
            dbOperationSuccess = false;
          }
        }

        // 查询最新的点赞数（仅在数据库操作成功时）
        let newLikes = feed?.likes ?? 0;
        if (dbOperationSuccess) {
          const { count, error: countError } = await supabase
            .from('feed_likes')
            .select('*', { count: 'exact', head: true })
            .eq('feed_id', feedId);

          if (!countError) {
            newLikes = count ?? 0;
          }
        } else {
          // 数据库操作失败，使用本地计数
          newLikes = isCurrentlyLiked ? Math.max(0, (feed?.likes ?? 0) - 1) : (feed?.likes ?? 0) + 1;
        }

        // 更新本地 mock 数据状态
        if (feed) {
          feed.isLiked = !isCurrentlyLiked;
          feed.likes = newLikes;
        }

        return {
          success: true,
          likes: newLikes,
          isLiked: !isCurrentlyLiked
        };
      } catch (supabaseError) {
        console.error('[likeFeed] Supabase error:', supabaseError);
        // 回退到本地 mock 数据
        if (feed) {
          feed.isLiked = !isCurrentlyLiked;
          feed.likes = isCurrentlyLiked ? Math.max(0, feed.likes - 1) : feed.likes + 1;
          return {
            success: true,
            likes: feed.likes,
            isLiked: feed.isLiked
          };
        }
        return { success: false, likes: 0, isLiked: isCurrentlyLiked };
      }
    } catch (error) {
      console.error('[likeFeed] Error:', error);
      return { success: false, likes: 0, isLiked: false };
    }
  }

  /**
   * 收藏动态 - 使用 feed_collects 表
   */
  async collectFeed(feedId: string, userId?: string): Promise<{ success: boolean; isCollected: boolean }> {
    try {
      console.log('[collectFeed] Called with feedId:', feedId, 'userId:', userId);

      // 获取当前用户ID
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id;
      }

      if (!currentUserId) {
        console.warn('[collectFeed] No valid userId');
        return { success: false, isCollected: false };
      }

      // 检查 feedId 是否为有效的 UUID
      const isValidUUID = this.isValidUUID(feedId);
      console.log('[collectFeed] Is valid UUID:', isValidUUID);

      // 先从本地 mock 数据中查找当前状态
      const feed = this.mockFeeds.find(f => f.id === feedId);
      const isCurrentlyCollected = feed?.isCollected ?? false;

      // 如果不是有效的 UUID，只更新本地状态（如 community_feed_xxx）
      if (!isValidUUID) {
        console.log('[collectFeed] Non-UUID feedId, updating local state only');
        // 对于非 UUID 的 feed，直接返回成功，让前端更新状态
        if (feed) {
          feed.isCollected = !isCurrentlyCollected;
        }
        return {
          success: true,
          isCollected: !isCurrentlyCollected
        };
      }

      try {
        let dbOperationSuccess = true;

        if (isCurrentlyCollected) {
          // 取消收藏 - 删除记录
          const { error } = await supabase
            .from('feed_collects')
            .delete()
            .eq('feed_id', feedId)
            .eq('user_id', currentUserId);

          if (error) {
            console.warn('[collectFeed] Delete collect failed:', error);
            dbOperationSuccess = false;
          }
        } else {
          // 收藏 - 插入记录
          const { error } = await supabase
            .from('feed_collects')
            .insert({
              feed_id: feedId,
              user_id: currentUserId,
            });

          if (error) {
            console.warn('[collectFeed] Insert collect failed:', error);
            dbOperationSuccess = false;
          }
        }

        // 更新本地 mock 数据状态（无论数据库操作是否成功，都更新本地状态以保证用户体验）
        if (feed) {
          feed.isCollected = !isCurrentlyCollected;
        }

        return {
          success: true,
          isCollected: !isCurrentlyCollected
        };
      } catch (supabaseError) {
        console.error('[collectFeed] Supabase error:', supabaseError);
        // 回退到本地 mock 数据
        if (feed) {
          feed.isCollected = !isCurrentlyCollected;
          return {
            success: true,
            isCollected: feed.isCollected
          };
        }
        return { success: false, isCollected: isCurrentlyCollected };
      }
    } catch (error) {
      console.error('[collectFeed] Error:', error);
      return { success: false, isCollected: false };
    }
  }

  /**
   * 分享动态
   */
  async shareFeed(feedId: string): Promise<{ success: boolean; shares: number }> {
    await delay(200);
    const feed = this.mockFeeds.find(f => f.id === feedId);
    if (feed) {
      feed.shares++;
      feed.isShared = true;
      return { success: true, shares: feed.shares };
    }
    return { success: false, shares: 0 };
  }

  /**
   * 获取动态评论列表 - 从真实 API 获取
   */
  async getComments(feedId: string, page: number = 1, pageSize: number = 20): Promise<{ comments: FeedComment[]; hasMore: boolean; totalCount: number }> {
    try {
      // 首先尝试从 feed_comments 表获取评论（支持所有类型的 feed_id）
      console.log('[getComments] Trying feed_comments table, feedId:', feedId, 'type:', typeof feedId);

      // 先查询所有评论，看看数据库里有什么
      const { data: allComments } = await supabase
        .from('feed_comments')
        .select('id, feed_id, content, created_at')
        .limit(10);
      console.log('[getComments] All recent comments in DB:', allComments);

      // 获取总评论数
      const { count: totalCount, error: countError } = await supabase
        .from('feed_comments')
        .select('*', { count: 'exact', head: true })
        .eq('feed_id', feedId);

      console.log('[getComments] Total comments count:', totalCount, 'error:', countError);

      const { data: feedComments, error: feedError } = await supabase
        .from('feed_comments')
        .select('*')
        .eq('feed_id', feedId)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (!feedError && feedComments && feedComments.length > 0) {
        console.log('[getComments] Found comments in feed_comments:', feedComments.length);

        // 获取所有评论用户的ID
        const userIds = [...new Set(feedComments.map((c: any) => c.user_id).filter(Boolean))];

        // 从 users 表获取用户头像信息
        let userAvatarMap = new Map<string, string>();
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, username, avatar_url')
            .in('id', userIds);

          usersData?.forEach((u: any) => {
            userAvatarMap.set(u.id, u.avatar_url);
          });
        }

        // 获取当前用户ID，用于检查点赞状态
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const currentUserId = currentUser?.id;

        // 获取当前用户已点赞的评论ID列表
        let likedCommentIds = new Set<string>();
        if (currentUserId) {
          const commentIds = feedComments.map((c: any) => c.id);
          const { data: likesData } = await supabase
            .from('feed_comment_likes')
            .select('comment_id')
            .eq('user_id', currentUserId)
            .in('comment_id', commentIds);

          likesData?.forEach((like: any) => {
            likedCommentIds.add(like.comment_id);
          });
        }

        const comments: FeedComment[] = feedComments.map((c: any) => {
          // 优先使用 users 表中的头像，其次是存储的 author_avatar，最后是基于 user_id 的默认头像
          const avatarFromUsers = userAvatarMap.get(c.user_id);
          const avatar = avatarFromUsers || c.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user_id}`;

          return {
            id: c.id,
            author: {
              id: c.user_id,
              type: 'user',
              name: c.author_name || '用户',
              avatar: avatar,
            },
            content: c.content,
            createdAt: c.created_at,
            likes: c.likes_count || 0,
            isLiked: likedCommentIds.has(c.id),
            replyCount: 0,
          };
        });

        return {
          comments,
          hasMore: feedComments.length === pageSize,
          totalCount: totalCount || comments.length
        };
      }

      console.log('[getComments] No comments in feed_comments, trying other sources');
      
      // 检查内存缓存（用于非 UUID feed 的评论）
      const cachedComments = this.commentsCache.get(feedId) || [];
      if (cachedComments.length > 0) {
        console.log('[getComments] Found comments in memory cache:', cachedComments.length);
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paginatedComments = cachedComments.slice(start, end);
        return {
          comments: paginatedComments,
          hasMore: end < cachedComments.length,
          totalCount: cachedComments.length
        };
      }
      
      // 尝试从后端 API 获取评论
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (token) {
        // 尝试 works API
        let response = await fetch(`/api/works/${feedId}/comments?page=${page}&pageSize=${pageSize}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // 如果 works API 失败，尝试 posts API
        if (!response.ok) {
          response = await fetch(`/api/posts/${feedId}/comments?page=${page}&pageSize=${pageSize}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
        
        if (response.ok) {
          const result = await response.json();
          if (result.code === 0 && Array.isArray(result.data)) {
            // 检查后端返回的数据是否包含作者信息
            const hasAuthorInfo = result.data.some((c: any) => c.author_name || c.author?.username);

            if (hasAuthorInfo) {
              // 后端返回了作者信息，直接使用
              const comments: FeedComment[] = result.data.map((c: any) => ({
                id: c.id || `comment_${Date.now()}_${Math.random()}`,
                author: {
                  id: c.author?.id || c.user_id || 'unknown',
                  type: 'user',
                  name: c.author?.username || c.author_name || '用户',
                  avatar: c.author?.avatar || c.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user_id || 'unknown'}`,
                },
                content: c.content || '',
                createdAt: c.created_at || c.date || new Date().toISOString(),
                likes: c.likes || 0,
                isLiked: c.isLiked || false,
                replyCount: c.reply_count || c.replies?.length || 0,
              }));

              return {
                comments,
                hasMore: comments.length === pageSize,
                totalCount: result.total || comments.length
              };
            }
            // 如果没有作者信息，继续尝试 Supabase
            console.log('[getComments] Backend API returned comments without author info, trying Supabase...');
          }
        }
      }
      
      // 如果都失败了，返回空数组
      return { comments: [], hasMore: false, totalCount: 0 };
    } catch (error) {
      console.error('[getComments] Error:', error);
      return { comments: [], hasMore: false, totalCount: 0 };
    }
  }

  /**
   * 发布评论 - 调用真实 API
   */
  async createComment(feedId: string, content: string, parentId?: string, userId?: string, userNameParam?: string, userAvatarParam?: string): Promise<FeedComment | null> {
    try {
      // 获取当前用户信息 - 优先使用传入的参数
      let currentUserId = userId;
      let userName = userNameParam || '用户';
      let userAvatar = userAvatarParam || '';

      console.log('[createComment] Initial values:', { currentUserId, userName, userAvatar });

      // 如果传入了 userId 但没有用户名/头像，尝试从 localStorage 获取
      if (currentUserId && (!userName || userName === '用户' || !userAvatar)) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.id === currentUserId) {
              userName = parsedUser.username || parsedUser.name || parsedUser.email?.split('@')[0] || '用户';
              userAvatar = parsedUser.avatar || parsedUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserId}`;
              console.log('[createComment] Got user info from localStorage:', { userName, userAvatar });
            }
          } catch (e) {
            console.warn('[createComment] Failed to parse user from localStorage');
          }
        }
      }

      if (!currentUserId) {
        // 尝试从 Supabase Auth 获取
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (supabaseUser?.id) {
          currentUserId = supabaseUser.id;
          userName = supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || '用户';
          userAvatar = supabaseUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.id}`;
          console.log('[createComment] Got user info from Supabase Auth:', { currentUserId, userName, userAvatar });
        }
      }

      // 如果仍然没有 userId，尝试从 localStorage 获取
      if (!currentUserId) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            currentUserId = parsedUser.id;
            userName = parsedUser.username || parsedUser.name || parsedUser.email?.split('@')[0] || '用户';
            userAvatar = parsedUser.avatar || parsedUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${parsedUser.id}`;
            console.log('[createComment] Got user info from localStorage (fallback):', { currentUserId, userName, userAvatar });
          } catch (e) {
            console.warn('[createComment] Failed to parse user from localStorage');
          }
        }
      }

      if (!currentUserId) {
        console.warn('[createComment] No valid user');
        return null;
      }

      console.log('[createComment] Final user info:', { currentUserId, userName, userAvatar });

      // 首先尝试直接插入 Supabase feed_comments 表
      // 支持所有类型的 feed_id（UUID 和非 UUID）
      try {
        console.log('[createComment] Trying to insert into feed_comments table, feedId:', feedId, 'type:', typeof feedId);

        // 构建插入数据，只包含基本字段
        const insertData: any = {
          feed_id: feedId,
          user_id: currentUserId,
          content: content,
          parent_id: parentId || null,
        };

        // 尝试添加 author_name 和 author_avatar 字段（如果表结构支持）
        try {
          const { data: testData } = await supabase
            .from('feed_comments')
            .select('author_name, author_avatar')
            .limit(1);

          if (testData !== null) {
            insertData.author_name = userName;
            insertData.author_avatar = userAvatar;
          }
        } catch (e) {
          // 字段不存在，不添加
          console.log('[createComment] author fields not available');
        }

        const { data: insertedData, error: feedError } = await supabase
          .from('feed_comments')
          .insert(insertData)
          .select()
          .single();

        if (feedError) {
          console.error('[createComment] Insert error:', feedError);
        }

        if (!feedError && insertedData) {
          console.log('[createComment] Success via feed_comments table:', insertedData);
          console.log('[createComment] Saved feed_id:', insertedData.feed_id);

          // 更新本地动态评论数
          const feed = this.mockFeeds.find(f => f.id === feedId);
          if (feed) {
            feed.comments++;
          }

          return {
            id: insertedData.id,
            author: {
              id: currentUserId,
              type: 'user',
              name: userName,
              avatar: userAvatar,
            },
            content,
            createdAt: new Date().toISOString(),
            likes: 0,
            isLiked: false,
          };
        }

        console.warn('[createComment] feed_comments failed:', feedError);
      } catch (supabaseError) {
        console.error('[createComment] Supabase error:', supabaseError);
      }
      
      // 如果 Supabase 失败，回退到内存缓存
      console.log('[createComment] Falling back to memory cache');
      const feed = this.mockFeeds.find(f => f.id === feedId);
      if (feed) {
        feed.comments++;
      }
      
      const newComment: FeedComment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        author: {
          id: currentUserId,
          type: 'user',
          name: userName,
          avatar: userAvatar,
        },
        content,
        createdAt: new Date().toISOString(),
        likes: 0,
        isLiked: false,
      };
      
      // 保存到内存缓存
      const existingComments = this.commentsCache.get(feedId) || [];
      this.commentsCache.set(feedId, [newComment, ...existingComments]);
      console.log('[createComment] Saved to cache, total comments:', existingComments.length + 1);
      
      return newComment;
    } catch (error) {
      console.error('[createComment] Error:', error);
      return null;
    }
  }

  /**
   * 点赞评论 - 使用 feed_comment_likes 表
   */
  async likeComment(commentId: string, userId?: string): Promise<{ success: boolean; likes: number; isLiked: boolean }> {
    try {
      // 获取当前用户ID
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id;
      }

      if (!currentUserId) {
        console.warn('[likeComment] No valid userId');
        return { success: false, likes: 0, isLiked: false };
      }

      // 检查是否已点赞
      const { data: existingLike } = await supabase
        .from('feed_comment_likes')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', currentUserId)
        .single();

      if (existingLike) {
        // 取消点赞
        const { error } = await supabase
          .from('feed_comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUserId);

        if (error) {
          console.error('[likeComment] Delete like failed:', error);
          return { success: false, likes: 0, isLiked: true };
        }
      } else {
        // 点赞
        const { error } = await supabase
          .from('feed_comment_likes')
          .insert({
            comment_id: commentId,
            user_id: currentUserId,
          });

        if (error) {
          console.error('[likeComment] Insert like failed:', error);
          return { success: false, likes: 0, isLiked: false };
        }
      }

      // 获取最新点赞数
      const { count, error: countError } = await supabase
        .from('feed_comment_likes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', commentId);

      const likes = countError ? 0 : (count ?? 0);

      return {
        success: true,
        likes,
        isLiked: !existingLike
      };
    } catch (error) {
      console.error('[likeComment] Error:', error);
      return { success: false, likes: 0, isLiked: false };
    }
  }

  /**
   * 检查用户是否已点赞评论
   */
  async checkCommentLiked(commentId: string, userId?: string): Promise<boolean> {
    try {
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id;
      }

      if (!currentUserId) return false;

      const { data } = await supabase
        .from('feed_comment_likes')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', currentUserId)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * 编辑评论
   */
  async updateComment(commentId: string, content: string, userId?: string): Promise<{ success: boolean; comment?: FeedComment }> {
    try {
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id;
      }

      if (!currentUserId) {
        console.warn('[updateComment] No valid userId');
        return { success: false };
      }

      // 检查评论是否属于当前用户
      const { data: existingComment } = await supabase
        .from('feed_comments')
        .select('*')
        .eq('id', commentId)
        .eq('user_id', currentUserId)
        .single();

      if (!existingComment) {
        console.warn('[updateComment] Comment not found or not owned by user');
        return { success: false };
      }

      // 更新评论
      const { data, error } = await supabase
        .from('feed_comments')
        .update({
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select()
        .single();

      if (error) {
        console.error('[updateComment] Update failed:', error);
        return { success: false };
      }

      // 获取用户头像
      const { data: userData } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', currentUserId)
        .single();

      const comment: FeedComment = {
        id: data.id,
        author: {
          id: currentUserId,
          type: 'user',
          name: data.author_name || '用户',
          avatar: userData?.avatar_url || data.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserId}`,
        },
        content: data.content,
        createdAt: data.created_at,
        likes: data.likes_count || 0,
        isLiked: false,
        replyCount: 0,
      };

      return { success: true, comment };
    } catch (error) {
      console.error('[updateComment] Error:', error);
      return { success: false };
    }
  }

  /**
   * 删除评论
   */
  async deleteComment(commentId: string, userId?: string): Promise<{ success: boolean }> {
    try {
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id;
      }

      if (!currentUserId) {
        console.warn('[deleteComment] No valid userId');
        return { success: false };
      }

      // 检查评论是否属于当前用户
      const { data: existingComment } = await supabase
        .from('feed_comments')
        .select('*')
        .eq('id', commentId)
        .eq('user_id', currentUserId)
        .single();

      if (!existingComment) {
        console.warn('[deleteComment] Comment not found or not owned by user');
        return { success: false };
      }

      // 删除评论
      const { error } = await supabase
        .from('feed_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('[deleteComment] Delete failed:', error);
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      console.error('[deleteComment] Error:', error);
      return { success: false };
    }
  }

  /**
   * 获取当前用户关注的用户列表（真实数据）
   */
  async getFollowingUsers(userId?: string): Promise<FeedAuthor[]> {
    try {
      // 调用真实的 API 获取关注列表
      const followingList = await getFollowingList();

      // 转换为 FeedAuthor 格式
      const followingUsers: FeedAuthor[] = followingList.map(user => ({
        id: user.id,
        type: 'user',
        name: user.username,
        avatar: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
        verified: false,
        isFollowing: true,
      }));

      return followingUsers;
    } catch (error) {
      console.error('获取关注列表失败:', error);
      // 如果获取失败，返回空数组
      return [];
    }
  }

  /**
   * 获取热搜列表
   */
  async getHotSearch(): Promise<HotSearchItem[]> {
    try {
      // 从 posts 表获取热门内容作为热搜
      const { data: posts, error } = await supabase
        .from('posts')
        .select('id, title, view_count, created_at')
        .order('view_count', { ascending: false })
        .limit(10);

      if (error) {
        console.warn('[getHotSearch] Failed to fetch:', error);
        return this.mockHotSearch;
      }

      // 转换为热搜格式
      return posts?.map((post, index) => ({
        id: post.id,
        rank: index + 1,
        title: post.title || '无标题',
        heat: post.view_count || 0,
        trend: 'up' as const,
        isNew: index < 3,
      })) || [];
    } catch (error) {
      console.error('[getHotSearch] Error:', error);
      return this.mockHotSearch;
    }
  }

  /**
   * 获取推荐用户/品牌
   */
  async getRecommendedUsers(): Promise<RecommendedUser[]> {
    try {
      // 从 users 表获取推荐用户
      const { data: users, error } = await supabase
        .from('users')
        .select('id, username, avatar_url, bio, created_at')
        .limit(10);

      if (error) {
        console.warn('[getRecommendedUsers] Failed to fetch:', error);
        return this.mockRecommendedUsers;
      }

      // 获取每个用户的作品数
      const usersWithWorks = await Promise.all(
        (users || []).map(async (user) => {
          const { count } = await supabase
            .from('works')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', user.id);

          return {
            id: user.id,
            type: 'user' as const,
            name: user.username || '用户',
            avatar: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
            bio: user.bio || '这个人很懒，什么都没写',
            followersCount: 0,
            worksCount: count || 0,
            isFollowing: false,
          };
        })
      );

      return usersWithWorks;
    } catch (error) {
      console.error('[getRecommendedUsers] Error:', error);
      return this.mockRecommendedUsers;
    }
  }

  /**
   * 获取推荐社群
   */
  async getRecommendedCommunities(userId?: string): Promise<RecommendedCommunity[]> {
    try {
      // 优先从后端API获取社群列表（与communityService保持一致）
      const response = await fetch('/api/communities');
      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && Array.isArray(result.data) && result.data.length > 0) {
          console.log('[getRecommendedCommunities] Fetched from backend API:', result.data.length);
          
          // 获取当前用户已加入的社群ID列表
          let joinedCommunityIds: Set<string> = new Set();
          if (userId) {
            const { data: memberships, error: membershipError } = await supabase
              .from('community_members')
              .select('community_id')
              .eq('user_id', userId);

            if (!membershipError && memberships) {
              joinedCommunityIds = new Set(memberships.map(m => m.community_id));
            }
          }
          
          return result.data.slice(0, 5).map((community: any) => ({
            id: community.id,
            name: community.name,
            avatar: community.avatar || community.avatar_url || community.cover || `https://api.dicebear.com/7.x/initials/svg?seed=${community.name}`,
            description: community.description || '暂无描述',
            membersCount: community.member_count || community.members_count || 0,
            postsCount: community.post_count || 0,
            isJoined: joinedCommunityIds.has(community.id),
          }));
        }
      }
      console.log('[getRecommendedCommunities] Backend API failed or empty, falling back to Supabase');
    } catch (apiError) {
      console.warn('[getRecommendedCommunities] Backend API error:', apiError);
    }

    // 如果后端API失败，尝试从Supabase获取
    try {
      const { data: communities, error } = await supabase
        .from('communities')
        .select('id, name, avatar, description, cover, member_count, post_count, created_at')
        .limit(5);

      console.log('[getRecommendedCommunities] Supabase response:', { communities, error });

      if (error) {
        console.warn('[getRecommendedCommunities] Failed to fetch from Supabase:', error);
        return this.mockRecommendedCommunities;
      }

      // 如果数据库中没有数据，返回模拟数据
      if (!communities || communities.length === 0) {
        console.log('[getRecommendedCommunities] No communities in database, using mock data');
        return this.mockRecommendedCommunities;
      }

      // 获取当前用户已加入的社群ID列表
      let joinedCommunityIds: Set<string> = new Set();
      if (userId) {
        const { data: memberships, error: membershipError } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('user_id', userId);

        if (!membershipError && memberships) {
          joinedCommunityIds = new Set(memberships.map(m => m.community_id));
        }
      }

      return communities.map(community => ({
        id: community.id,
        name: community.name,
        avatar: community.avatar || community.cover || `https://api.dicebear.com/7.x/initials/svg?seed=${community.name}`,
        description: community.description || '暂无描述',
        membersCount: community.member_count || 0,
        postsCount: community.post_count || 0,
        isJoined: joinedCommunityIds.has(community.id),
      }));
    } catch (error) {
      console.error('[getRecommendedCommunities] Error:', error);
      return this.mockRecommendedCommunities;
    }
  }

  /**
   * 获取社区公告
   */
  async getAnnouncements(): Promise<CommunityAnnouncement[]> {
    try {
      // 从 notifications 表获取系统公告
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('id, title, content, type, created_at')
        .eq('type', 'system')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.warn('[getAnnouncements] Failed to fetch:', error);
        return this.mockAnnouncements;
      }

      return (notifications || []).map(notification => ({
        id: notification.id,
        title: notification.title,
        content: notification.content || '',
        type: 'system' as const,
        createdAt: notification.created_at,
        isRead: false,
      }));
    } catch (error) {
      console.error('[getAnnouncements] Error:', error);
      return this.mockAnnouncements;
    }
  }

  /**
   * 关注用户
   */
  async followUser(userId: string): Promise<{ success: boolean }> {
    await delay(300);
    // 更新推荐用户列表中的关注状态
    const user = this.mockRecommendedUsers.find(u => u.id === userId);
    if (user) {
      user.isFollowing = true;
    }
    return { success: true };
  }

  /**
   * 取消关注
   */
  async unfollowUser(userId: string): Promise<{ success: boolean }> {
    await delay(300);
    const user = this.mockRecommendedUsers.find(u => u.id === userId);
    if (user) {
      user.isFollowing = false;
    }
    return { success: true };
  }

  /**
   * 加入社群
   */
  async joinCommunity(communityId: string): Promise<{ success: boolean; alreadyMember?: boolean }> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        console.warn('[joinCommunity] No token found');
        return { success: false };
      }

      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          // 更新本地缓存
          const community = this.mockRecommendedCommunities.find(c => c.id === communityId);
          if (community) {
            community.isJoined = true;
            community.membersCount++;
          }
          return { success: true };
        }
      }

      // 检查是否是已经是成员的错误
      const errorData = await response.json().catch(() => ({}));
      if (errorData.error === 'ALREADY_MEMBER' || errorData.message?.includes('已经是该社群成员')) {
        // 更新本地缓存
        const community = this.mockRecommendedCommunities.find(c => c.id === communityId);
        if (community) {
          community.isJoined = true;
        }
        return { success: true, alreadyMember: true };
      }

      console.warn('[joinCommunity] API call failed:', response.status);
      return { success: false };
    } catch (error) {
      console.error('[joinCommunity] Error:', error);
      return { success: false };
    }
  }

  /**
   * 退出社群
   */
  async leaveCommunity(communityId: string): Promise<{ success: boolean }> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        console.warn('[leaveCommunity] No token found');
        return { success: false };
      }

      const response = await fetch(`/api/communities/${communityId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          // 更新本地缓存
          const community = this.mockRecommendedCommunities.find(c => c.id === communityId);
          if (community) {
            community.isJoined = false;
            community.membersCount = Math.max(0, community.membersCount - 1);
          }
          return { success: true };
        }
      }

      console.warn('[leaveCommunity] API call failed:', response.status);
      return { success: false };
    } catch (error) {
      console.error('[leaveCommunity] Error:', error);
      return { success: false };
    }
  }

  /**
   * 获取动态统计信息
   */
  async getFeedStats(): Promise<FeedStats> {
    await delay(200);
    return {
      totalFeeds: this.mockFeeds.length,
      todayFeeds: this.mockFeeds.filter(f => 
        new Date(f.createdAt).toDateString() === new Date().toDateString()
      ).length,
      totalViews: this.mockFeeds.reduce((sum, f) => sum + f.views, 0),
      totalInteractions: this.mockFeeds.reduce((sum, f) => sum + f.likes + f.comments + f.shares, 0)
    };
  }

  /**
   * 上传媒体文件
   */
  async uploadMedia(file: File): Promise<FeedMedia> {
    await delay(1000);
    // 模拟上传，返回本地URL
    const url = URL.createObjectURL(file);
    return {
      id: `media_${Date.now()}`,
      type: file.type.startsWith('video') ? 'video' : 'image',
      url,
      thumbnailUrl: url,
      size: file.size,
    };
  }
}

export const feedService = new FeedService();
export default feedService;
