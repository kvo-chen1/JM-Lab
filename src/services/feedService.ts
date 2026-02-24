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
import { getFollowingList, getPosts, Post } from './postService';

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class FeedService {
  private mockFeeds: FeedItem[] = [];
  private mockHotSearch: HotSearchItem[] = [];
  private mockRecommendedUsers: RecommendedUser[] = [];
  private mockRecommendedCommunities: RecommendedCommunity[] = [];
  private mockAnnouncements: CommunityAnnouncement[] = [];

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
      brandId
    } = params;

    try {
      // 调用真实的 API 获取帖子列表
      const posts = await getPosts('all', filter === 'following');

      // 转换为 FeedItem
      let feeds = posts.map(post => this.transformPostToFeedItem(post));

      // 根据用户ID过滤（用于点击关注用户时筛选）
      if (userId) {
        feeds = feeds.filter(f => f.author.id === userId);
      }

      // 根据品牌ID过滤
      if (brandId) {
        feeds = feeds.filter(f => f.author.id === brandId);
      }

      // 根据筛选条件过滤
      if (filter !== 'all' && filter !== 'following') {
        switch (filter) {
          case 'video':
            feeds = feeds.filter(f => f.contentType === 'video');
            break;
          case 'image':
            feeds = feeds.filter(f => f.contentType === 'image' || f.media?.some(m => m.type === 'image'));
            break;
          case 'article':
            feeds = feeds.filter(f => f.contentType === 'article');
            break;
        }
      }

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
   * 点赞动态
   */
  async likeFeed(feedId: string): Promise<{ success: boolean; likes: number }> {
    await delay(200);
    const feed = this.mockFeeds.find(f => f.id === feedId);
    if (feed) {
      if (feed.isLiked) {
        feed.likes--;
        feed.isLiked = false;
      } else {
        feed.likes++;
        feed.isLiked = true;
      }
      return { success: true, likes: feed.likes };
    }
    return { success: false, likes: 0 };
  }

  /**
   * 收藏动态
   */
  async collectFeed(feedId: string): Promise<{ success: boolean }> {
    await delay(200);
    const feed = this.mockFeeds.find(f => f.id === feedId);
    if (feed) {
      feed.isCollected = !feed.isCollected;
      return { success: true };
    }
    return { success: false };
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
   * 获取动态评论列表
   */
  async getComments(feedId: string, page: number = 1, pageSize: number = 20): Promise<{ comments: FeedComment[]; hasMore: boolean }> {
    await delay(400);
    // 模拟评论数据
    const mockComments: FeedComment[] = Array.from({ length: 15 }, (_, i) => ({
      id: `comment_${feedId}_${i}`,
      author: {
        id: `user_${i}`,
        type: 'user',
        name: `用户${i + 1}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`,
      },
      content: `这是一条评论内容 ${i + 1}，说得很有道理！`,
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      likes: Math.floor(Math.random() * 100),
      isLiked: false,
      replyCount: Math.floor(Math.random() * 5),
    }));

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      comments: mockComments.slice(start, end),
      hasMore: end < mockComments.length
    };
  }

  /**
   * 发布评论
   */
  async createComment(feedId: string, content: string, parentId?: string): Promise<FeedComment> {
    await delay(500);
    const newComment: FeedComment = {
      id: `comment_${Date.now()}`,
      author: {
        id: 'current_user',
        type: 'user',
        name: '当前用户',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current',
      },
      content,
      createdAt: new Date().toISOString(),
      likes: 0,
      isLiked: false,
    };

    // 更新动态评论数
    const feed = this.mockFeeds.find(f => f.id === feedId);
    if (feed) {
      feed.comments++;
    }

    return newComment;
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
    await delay(300);
    return this.mockHotSearch;
  }

  /**
   * 获取推荐用户/品牌
   */
  async getRecommendedUsers(): Promise<RecommendedUser[]> {
    await delay(300);
    return this.mockRecommendedUsers;
  }

  /**
   * 获取推荐社群
   */
  async getRecommendedCommunities(): Promise<RecommendedCommunity[]> {
    await delay(300);
    return this.mockRecommendedCommunities;
  }

  /**
   * 获取社区公告
   */
  async getAnnouncements(): Promise<CommunityAnnouncement[]> {
    await delay(200);
    return this.mockAnnouncements;
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
