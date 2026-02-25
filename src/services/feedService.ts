/**
 * 动态内容展示系统服务
 * 处理动态的获取、发布、互动等操作
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
      sourceType: 'post',  // 标识这是从 Post 转换来的
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
      // 获取多个数据源
      const [posts, communities] = await Promise.all([
        getPosts('all', false),
        communityService.getCommunities().catch(() => []),
      ]);

      // 转换帖子为 FeedItem
      let feeds = posts.map(post => this.transformPostToFeedItem(post));

      // 添加社群动态（作为活动/公告类型）
      const communityFeeds: FeedItem[] = communities.slice(0, 5).map(community => ({
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
          feeds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          console.log('[getFeeds] Sorted by latest');
          break;
        case 'hot':
          feeds.sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares));
          console.log('[getFeeds] Sorted by hot');
          break;
        case 'recommend':
          // 推荐排序：综合时间、热度等因素
          feeds.sort((a, b) => {
            const scoreA = (a.likes + a.comments + a.shares) * 0.3 + new Date(a.createdAt).getTime() * 0.0000001;
            const scoreB = (b.likes + b.comments + b.shares) * 0.3 + new Date(b.createdAt).getTime() * 0.0000001;
            return scoreB - scoreA;
          });
          console.log('[getFeeds] Sorted by recommend');
          break;
      }

      // 分页
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedFeeds = feeds.slice(start, end);
      const hasMore = end < feeds.length;

      console.log('[getFeeds] Pagination:', { page, pageSize, start, end, totalFeeds: feeds.length, paginatedCount: paginatedFeeds.length, hasMore });

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
    await delay(800);

    const newFeed: FeedItem = {
      id: `feed_${Date.now()}`,
      author: {
        id: 'current_user',
        type: 'user',
        name: '当前用户',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current',
        verified: false,
      },
      contentType: request.contentType,
      content: request.content,
      media: request.media?.map((m, index) => ({
        ...m,
        id: `media_${Date.now()}_${index}`
      })),
      tags: request.tags,
      location: request.location,
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      isLiked: false,
      isCollected: false,
      isShared: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.mockFeeds.unshift(newFeed);
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
        if (isCurrentlyLiked) {
          // 取消点赞 - 删除记录
          const { error } = await supabase
            .from('feed_likes')
            .delete()
            .eq('feed_id', feedId)
            .eq('user_id', currentUserId);

          if (error) {
            console.warn('[likeFeed] Delete like failed:', error);
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
          }
        }

        // 查询最新的点赞数
        const { count, error: countError } = await supabase
          .from('feed_likes')
          .select('*', { count: 'exact', head: true })
          .eq('feed_id', feedId);

        const newLikes = countError ? (feed?.likes ?? 0) : (count ?? 0);

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
        if (isCurrentlyCollected) {
          // 取消收藏 - 删除记录
          const { error } = await supabase
            .from('feed_collects')
            .delete()
            .eq('feed_id', feedId)
            .eq('user_id', currentUserId);

          if (error) {
            console.warn('[collectFeed] Delete collect failed:', error);
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
          }
        }

        // 更新本地 mock 数据状态
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
  async getComments(feedId: string, page: number = 1, pageSize: number = 20): Promise<{ comments: FeedComment[]; hasMore: boolean }> {
    try {
      // 首先尝试从 feed_comments 表获取评论（支持所有类型的 feed_id）
      console.log('[getComments] Trying feed_comments table, feedId:', feedId);
      const { data: feedComments, error: feedError } = await supabase
        .from('feed_comments')
        .select('*')
        .eq('feed_id', feedId)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (!feedError && feedComments && feedComments.length > 0) {
        console.log('[getComments] Found comments in feed_comments:', feedComments.length);
        const comments: FeedComment[] = feedComments.map((c: any) => ({
          id: c.id,
          author: {
            id: c.user_id,
            type: 'user',
            name: c.author_name || '用户',
            avatar: c.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user_id}`,
          },
          content: c.content,
          createdAt: c.created_at,
          likes: c.likes_count || 0,
          isLiked: false,
          replyCount: 0,
        }));

        return {
          comments,
          hasMore: feedComments.length === pageSize
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
          hasMore: end < cachedComments.length
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
                hasMore: comments.length === pageSize
              };
            }
            // 如果没有作者信息，继续尝试 Supabase
            console.log('[getComments] Backend API returned comments without author info, trying Supabase...');
          }
        }
      }
      
      // 如果都失败了，返回空数组
      return { comments: [], hasMore: false };
    } catch (error) {
      console.error('[getComments] Error:', error);
      return { comments: [], hasMore: false };
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
        console.log('[createComment] Trying to insert into feed_comments table');
        const { data: insertData, error: feedError } = await supabase
          .from('feed_comments')
          .insert({
            feed_id: feedId,
            user_id: currentUserId,
            content: content,
            parent_id: parentId || null,
            author_name: userName,
            author_avatar: userAvatar,
          })
          .select()
          .single();

        if (!feedError && insertData) {
          console.log('[createComment] Success via feed_comments table:', insertData);

          // 更新本地动态评论数
          const feed = this.mockFeeds.find(f => f.id === feedId);
          if (feed) {
            feed.comments++;
          }

          return {
            id: insertData.id,
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
   * 点赞评论
   */
  async likeComment(commentId: string): Promise<{ success: boolean; likes: number }> {
    await delay(200);
    // 模拟点赞评论
    return { success: true, likes: Math.floor(Math.random() * 100) + 1 };
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
        .select('id, title, views, created_at')
        .order('views', { ascending: false })
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
        heat: post.views || 0,
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
  async getRecommendedCommunities(): Promise<RecommendedCommunity[]> {
    try {
      // 从 communities 表获取推荐社群
      const { data: communities, error } = await supabase
        .from('communities')
        .select('id, name, avatar, description, cover, member_count, post_count, created_at')
        .limit(5);

      if (error) {
        console.warn('[getRecommendedCommunities] Failed to fetch:', error);
        return this.mockRecommendedCommunities;
      }

      return (communities || []).map(community => ({
        id: community.id,
        name: community.name,
        avatar: community.avatar || community.cover || `https://api.dicebear.com/7.x/initials/svg?seed=${community.name}`,
        description: community.description || '暂无描述',
        membersCount: community.member_count || 0,
        postsCount: community.post_count || 0,
        isJoined: false,
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
  async joinCommunity(communityId: string): Promise<{ success: boolean }> {
    await delay(300);
    const community = this.mockRecommendedCommunities.find(c => c.id === communityId);
    if (community) {
      community.isJoined = true;
      community.membersCount++;
    }
    return { success: true };
  }

  /**
   * 退出社群
   */
  async leaveCommunity(communityId: string): Promise<{ success: boolean }> {
    await delay(300);
    const community = this.mockRecommendedCommunities.find(c => c.id === communityId);
    if (community) {
      community.isJoined = false;
      community.membersCount--;
    }
    return { success: true };
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
