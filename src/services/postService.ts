// 评论反应类型
export type CommentReaction = 'like' | 'love' | 'laugh' | 'surprise' | 'sad' | 'angry';

// 导入统一API服务
import { workService, commentService } from './apiService';
import dataSyncService, { SyncOperation } from './dataSyncService';
import { Work } from '../mock/works';

// 评论接口
export interface Comment {
  id: string;
  content: string;
  date: string;
  author?: string;
  likes: number;
  reactions: Record<CommentReaction, number>;
  parentId?: string;
  replies: Comment[];
  isLiked?: boolean;
  userReactions: CommentReaction[];
}

// 作品分类类型
export type PostCategory = 'design' | 'writing' | 'audio' | 'video' | 'other';

// 简化的User接口
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  isAdmin?: boolean;
  membershipLevel?: string;
  membershipStatus?: 'active' | 'inactive' | 'trial';
}

// 审核日志接口
export interface ModerationLog {
  id: string;
  postId: string;
  moderatorId: string;
  action: 'approve' | 'reject' | 'flag' | 'schedule';
  reason: string;
  timestamp: string;
  metadata: any;
  moderator?: User;
}

// 作品接口
export interface Post {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl?: string;
  likes: number;
  comments: Comment[];
  date: string;
  author?: User | string;
  isLiked?: boolean;
  isBookmarked?: boolean;
  // 作品集扩展字段
  category: PostCategory;
  tags: string[];
  description: string;
  views: number;
  shares: number;
  isFeatured: boolean;
  isDraft: boolean;
  completionStatus: 'draft' | 'completed' | 'published';
  creativeDirection: string;
  culturalElements: string[];
  colorScheme: string[];
  toolsUsed: string[];
  resolution?: string;
  fileSize?: string;
  downloadCount?: number;
  license?: string;
  
  // 新增发布相关字段
  publishType: 'explore' | 'community' | 'both';
  communityId: string | null;
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'scheduled';
  rejectionReason: string | null;
  scheduledPublishDate: string | null;
  visibility: 'public' | 'private' | 'community';
  
  // 统计扩展
  commentCount: number;
  engagementRate: number;
  trendingScore: number;
  reach: number;
  
  // 审核相关
  moderator: User | null;
  reviewedAt: string | null;
  
  // 推荐相关
  recommendationScore: number;
  recommendedFor: string[];
}

const KEY = 'jmzf_posts';
const USER_BOOKMARKS_KEY = 'jmzf_user_bookmarks';
const USER_LIKES_KEY = 'jmzf_user_likes';

const CACHE_TTL = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const postCache = new Map<string, CacheEntry<Post[]>>();
const bookmarkCache = new Map<string, CacheEntry<string[]>>();
const likeCache = new Map<string, CacheEntry<string[]>>();
const bookmarkedPostsCache = new Map<string, CacheEntry<Post[]>>();
const likedPostsCache = new Map<string, CacheEntry<Post[]>>();

let pendingUpdates = new Map<string, any>();
let updateTimeout: NodeJS.Timeout | null = null;

function isCacheValid<T>(cache: Map<string, CacheEntry<T>>, key: string): boolean {
  const entry = cache.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL;
}

function getCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  if (isCacheValid(cache, key)) {
    return cache.get(key)!.data;
  }
  return null;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

function clearCache(cache: Map<string, CacheEntry<any>>): void {
  cache.clear();
}

function clearAllCaches(): void {
  clearCache(postCache);
  clearCache(bookmarkCache);
  clearCache(likeCache);
  clearCache(bookmarkedPostsCache);
  clearCache(likedPostsCache);
}

function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error reading from localStorage for key ${key}:`, error);
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error writing to localStorage for key ${key}:`, error);
  }
}

function scheduleBatchUpdate(key: string, value: any): void {
  pendingUpdates.set(key, value);
  
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }
  
  updateTimeout = setTimeout(() => {
    flushPendingUpdates();
  }, 100);
}

function flushPendingUpdates(): void {
  pendingUpdates.forEach((value, key) => {
    safeLocalStorageSet(key, JSON.stringify(value));
  });
  pendingUpdates.clear();
  updateTimeout = null;
}

function invalidateRelatedCaches(): void {
  clearCache(bookmarkedPostsCache);
  clearCache(likedPostsCache);
}

/**
 * 获取所有帖子
 */
export async function getPosts(): Promise<Post[]> {
  // SWR Strategy: Check cache directly
  const entry = postCache.get('all');
  
  // Define fetch logic
  const fetchFromStorage = async () => {
    try {
      // 清除本地存储中的模拟数据
      safeLocalStorageSet(KEY, '[]');
      safeLocalStorageSet('jmzf_tags_cache', '');
      safeLocalStorageSet('user', '');
      safeLocalStorageSet('jmzf_user_bookmarks', '[]');
      safeLocalStorageSet('jmzf_user_likes', '[]');

      // 从API获取作品
      let apiPosts: Post[] = [];
      try {
        const works = await workService.getWorks({
          limit: 50 // 获取较多的作品以确保有足够的内容显示
        });
        
        // 转换为Post类型
        apiPosts = works.map(work => ({
          id: work.id.toString(),
          title: work.title,
          thumbnail: work.thumbnail,
          likes: work.likes,
          comments: work.comments || [],
          date: new Date().toISOString().slice(0, 10),
          author: work.creator || {
            id: 'api-user',
            username: '其他创作者',
            email: 'user@example.com'
          },
          isLiked: false,
          isBookmarked: false,
          category: work.category as PostCategory,
          tags: work.tags,
          description: work.description || '',
          views: work.views,
          shares: 0,
          isFeatured: work.featured,
          isDraft: false,
          completionStatus: 'published' as const,
          creativeDirection: '',
          culturalElements: [],
          colorScheme: [],
          toolsUsed: [],
          downloadCount: 0,
          publishType: 'explore' as const,
          communityId: null,
          moderationStatus: 'approved',
          rejectionReason: null,
          scheduledPublishDate: null,
          visibility: 'public',
          commentCount: work.comments ? work.comments.length : 0,
          engagementRate: 0,
          trendingScore: 0,
          reach: 0,
          moderator: null,
          reviewedAt: null,
          recommendationScore: 0,
          recommendedFor: []
        }));
      } catch (e) {
        console.warn('从API获取作品失败:', e);
        apiPosts = [];
      }

      // 排序：按日期倒序
      apiPosts.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
      
      setCache(postCache, 'all', apiPosts);
      return apiPosts;
    } catch (error) {
      console.error('获取帖子失败:', error);
      return [];
    }
  };

  // If cache exists, return it immediately
  if (entry) {
    // If stale, trigger background update
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      console.log('Cache stale, fetching in background...');
      fetchFromStorage().catch(e => console.error('Background update failed', e));
    }
    return entry.data;
  }
  
  // No cache, wait for storage
  return fetchFromStorage();
}

/**
 * 根据用户ID获取作者信息
 */
export async function getAuthorById(userId: string): Promise<User | null> {
  // 1. 尝试从当前登录用户获取（如果是自己）
  const currentUserRaw = safeLocalStorageGet('user');
  if (currentUserRaw) {
    const currentUser = JSON.parse(currentUserRaw);
    // 支持 'current-user' 关键字或直接匹配 ID
    if (userId === 'current-user' || currentUser.id === userId) {
      return currentUser;
    }
  }

  // 2. 遍历所有帖子，查找匹配的作者信息
  const posts = await getPosts();
  const post = posts.find(p => {
    if (typeof p.author === 'object' && p.author !== null) {
      return (p.author as User).id === userId;
    }
    return false;
  });

  if (post && typeof post.author === 'object') {
    return post.author as User;
  }

  return null;
}

const FOLLOWS_KEY = 'jmzf_user_follows';

/**
 * 检查是否已关注（添加好友）
 */
export function checkUserFollowing(targetUserId: string): boolean {
  const currentUserRaw = safeLocalStorageGet('user');
  if (!currentUserRaw) return false;
  
  const currentUser = JSON.parse(currentUserRaw);
  const followsRaw = safeLocalStorageGet(`${FOLLOWS_KEY}_${currentUser.id}`);
  const follows: string[] = followsRaw ? JSON.parse(followsRaw) : [];
  
  return follows.includes(targetUserId);
}

/**
 * 关注用户（添加好友）
 */
export async function followUser(targetUserId: string): Promise<boolean> {
  const currentUserRaw = safeLocalStorageGet('user');
  if (!currentUserRaw) return false;
  
  const currentUser = JSON.parse(currentUserRaw);
  const followsRaw = safeLocalStorageGet(`${FOLLOWS_KEY}_${currentUser.id}`);
  const follows: string[] = followsRaw ? JSON.parse(followsRaw) : [];
  
  if (!follows.includes(targetUserId)) {
    follows.push(targetUserId);
    safeLocalStorageSet(`${FOLLOWS_KEY}_${currentUser.id}`, JSON.stringify(follows));
    return true;
  }
  return false;
}

/**
 * 取消关注用户（删除好友）
 */
export async function unfollowUser(targetUserId: string): Promise<boolean> {
  const currentUserRaw = safeLocalStorageGet('user');
  if (!currentUserRaw) return false;
  
  const currentUser = JSON.parse(currentUserRaw);
  const followsRaw = safeLocalStorageGet(`${FOLLOWS_KEY}_${currentUser.id}`);
  const follows: string[] = followsRaw ? JSON.parse(followsRaw) : [];
  
  const index = follows.indexOf(targetUserId);
  if (index > -1) {
    follows.splice(index, 1);
    safeLocalStorageSet(`${FOLLOWS_KEY}_${currentUser.id}`, JSON.stringify(follows));
    return true;
  }
  return false;
}

/**
 * 添加作品
 */
export async function addPost(p: Omit<Post, 'id' | 'likes' | 'comments' | 'date' | 'isLiked' | 'isBookmarked' | 'views' | 'shares' | 'isFeatured' | 'commentCount' | 'engagementRate' | 'trendingScore' | 'reach' | 'moderator' | 'reviewedAt' | 'recommendationScore' | 'recommendedFor'>, currentUser?: User): Promise<Post> {
  try {
    // 使用统一API服务创建作品
    const createdWork = await workService.createWork({
      title: p.title,
      thumbnailUrl: p.thumbnail,
      categoryId: p.category, // Assuming category maps to categoryId
      tags: p.tags,
      description: p.description,
      views: 0,
      likes: 0,
      comments: 0,
      isFeatured: false,
      isPublic: true,
      userId: currentUser?.id || 'current-user',
      type: 'image',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // 转换为Post类型
    const post: Post = {
      ...p,
      id: createdWork.id.toString(),
      likes: createdWork.likes,
      comments: [],
      date: createdWork.createdAt ? new Date(createdWork.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      isLiked: false,
      isBookmarked: false,
      views: createdWork.views,
      shares: 0,
      isFeatured: createdWork.isFeatured || false,
      commentCount: createdWork.comments || 0,
      engagementRate: 0,
      trendingScore: 0,
      reach: 0,
      moderator: null,
      reviewedAt: null,
      recommendationScore: 0,
      recommendedFor: [],
      // 使用传入的当前用户信息作为作者
      author: currentUser ? {
        id: currentUser.id,
        username: currentUser.username || currentUser.email.split('@')[0] || '用户',
        email: currentUser.email,
        avatar: currentUser.avatar,
        isAdmin: currentUser.isAdmin,
        membershipLevel: currentUser.membershipLevel,
        membershipStatus: currentUser.membershipStatus
      } : (typeof p.author === 'object' ? p.author : p.author)
    };
    
    // 保存到本地存储（持久化）
    const localRaw = safeLocalStorageGet(KEY);
    const localPosts: Post[] = localRaw ? JSON.parse(localRaw) : [];
    // 检查是否存在
    const exists = localPosts.some(item => item.id === post.id);
    if (!exists) {
      localPosts.unshift(post);
      safeLocalStorageSet(KEY, JSON.stringify(localPosts));
    }
    
    // 更新缓存
    const cachedPosts = postCache.get('all')?.data || [];
    const newCachedPosts = [post, ...cachedPosts.filter(x => x.id !== post.id)];
    setCache(postCache, 'all', newCachedPosts);
    
    return post;
  } catch (error) {
    console.error('添加作品失败:', error);
    // 失败时返回本地创建的post
    const post: Post = {
      ...p,
      id: `p-${Date.now()}`,
      likes: 0,
      comments: [],
      date: new Date().toISOString().slice(0, 10),
      isLiked: false,
      isBookmarked: false,
      views: 0,
      shares: 0,
      isFeatured: false,
      commentCount: 0,
      engagementRate: 0,
      trendingScore: 0,
      reach: 0,
      moderator: null,
      reviewedAt: null,
      recommendationScore: 0,
      recommendedFor: [],
      // 使用传入的当前用户信息作为作者
      author: currentUser ? {
        id: currentUser.id,
        username: currentUser.username || currentUser.email.split('@')[0] || '用户',
        email: currentUser.email,
        avatar: currentUser.avatar,
        isAdmin: currentUser.isAdmin,
        membershipLevel: currentUser.membershipLevel,
        membershipStatus: currentUser.membershipStatus
      } : (typeof p.author === 'object' ? p.author : p.author)
    };
    
    // 保存到本地存储（持久化）
    const localRaw = safeLocalStorageGet(KEY);
    const localPosts: Post[] = localRaw ? JSON.parse(localRaw) : [];
    localPosts.unshift(post);
    safeLocalStorageSet(KEY, JSON.stringify(localPosts));
    
    // 更新缓存，确保本地创建的作品也能显示在广场上
    const cachedPosts = postCache.get('all')?.data || [];
    const newCachedPosts = [post, ...cachedPosts];
    setCache(postCache, 'all', newCachedPosts);
    
    // 添加到同步队列
    dataSyncService.addOperation({
      id: `sync_create_post_${post.id}`,
      type: 'create',
      entityType: 'post',
      entityId: post.id,
      payload: p,
      timestamp: Date.now(),
      priority: 'high',
      status: 'pending',
      retryCount: 0,
      maxRetries: 5,
      lastAttempt: 0
    });

    return post;
  }
}

/**
 * 发布作品到探索作品
 */
export async function publishToExplore(postId: string, data: {
  category: string;
  tags: string[];
  culturalElements: string[];
  visibility: 'public' | 'private';
  isFeatured: boolean;
  scheduledPublishDate: string | null;
}): Promise<{
  success: boolean;
  message: string;
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'scheduled';
}> {
  try {
    const result = await workService.publishToExplore(parseInt(postId), data);
    
    // 更新本地缓存中的作品状态
    const posts = await getPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex >= 0) {
      posts[postIndex].moderationStatus = result.moderationStatus;
      posts[postIndex].scheduledPublishDate = data.scheduledPublishDate;
      setCache(postCache, 'all', posts);
    }
    
    return result;
  } catch (error) {
    console.error('发布到探索作品失败:', error);
    return {
      success: false,
      message: '发布失败，请重试',
      moderationStatus: 'rejected'
    };
  }
}

/**
 * 发布作品到社群
 */
export async function publishToCommunity(postId: string, data: {
  communityId: string;
  visibility: 'public' | 'community' | 'private';
  scheduledPublishDate: string | null;
}): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const result = await workService.publishToCommunity(parseInt(postId), data);
    
    // 更新本地缓存中的作品状态
    const posts = await getPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex >= 0) {
      posts[postIndex].publishType = 'community';
      posts[postIndex].communityId = data.communityId;
      posts[postIndex].visibility = data.visibility;
      posts[postIndex].scheduledPublishDate = data.scheduledPublishDate;
      setCache(postCache, 'all', posts);
    }
    
    return result;
  } catch (error) {
    console.error('发布到社群失败:', error);
    return {
      success: false,
      message: '发布失败，请重试'
    };
  }
}

/**
 * 获取作品审核状态
 */
export async function getModerationStatus(postId: string): Promise<{
  status: 'pending' | 'approved' | 'rejected' | 'scheduled';
  reviewedAt: string | null;
  rejectionReason: string | null;
  moderator: User | null;
}> {
  try {
    return await workService.getModerationStatus(parseInt(postId));
  } catch (error) {
    console.error('获取审核状态失败:', error);
    return {
      status: 'pending',
      reviewedAt: null,
      rejectionReason: null,
      moderator: null
    };
  }
}

/**
 * 获取用户加入的社群列表
 */
export async function getUserCommunities(userId: string): Promise<Array<{
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  memberCount: number;
  postCount: number;
  isPublic: boolean;
  isMember: boolean;
}>> {
  try {
    return await workService.getUserCommunities(userId);
  } catch (error) {
    console.error('获取用户社群列表失败:', error);
    return [];
  }
}

/**
 * 获取发布统计数据
 */
export async function getPublishStats(): Promise<{
  successRate: number;
  totalPublished: number;
  totalPending: number;
  totalRejected: number;
  byCategory: Array<{
    category: string;
    count: number;
  }>;
  byDate: Array<{
    date: string;
    count: number;
  }>;
}> {
  try {
    return await workService.getPublishStats();
  } catch (error) {
    console.error('获取发布统计数据失败:', error);
    return {
      successRate: 0,
      totalPublished: 0,
      totalPending: 0,
      totalRejected: 0,
      byCategory: [],
      byDate: []
    };
  }
}

/**
 * 获取作品互动统计
 */
export async function getEngagementStats(postId: string): Promise<{
  likes: number;
  comments: number;
  shares: number;
  views: number;
  downloads: number;
  engagementRate: number;
  bySource: Array<{
    source: string;
    count: number;
  }>;
  byDate: Array<{
    date: string;
    count: number;
  }>;
}> {
  try {
    return await workService.getEngagementStats(parseInt(postId));
  } catch (error) {
    console.error('获取作品互动统计失败:', error);
    return {
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      downloads: 0,
      engagementRate: 0,
      bySource: [],
      byDate: []
    };
  }
}

/**
 * 点赞帖子
 */
export async function likePost(id: string, userId: string = 'anonymous'): Promise<Post | undefined> {
  try {
    // 使用统一API服务点赞作品
    await workService.likeWork(parseInt(id));
    
    // 重新获取最新的帖子数据
    const posts = await getPosts();
    return posts.find(p => p.id === id);
  } catch (error) {
    console.error('点赞帖子失败:', error);
  }
  return undefined;
}

/**
 * 取消点赞帖子
 */
export async function unlikePost(id: string, userId: string = 'anonymous'): Promise<Post | undefined> {
  try {
    // 使用统一API服务取消点赞作品
    await workService.unlikeWork(parseInt(id));
    
    // 重新获取最新的帖子数据
    const posts = await getPosts();
    return posts.find(p => p.id === id);
  } catch (error) {
    console.error('取消点赞帖子失败:', error);
  }
  return undefined;
}

/**
 * 收藏帖子
 */
export async function bookmarkPost(id: string, userId: string = 'anonymous'): Promise<Post | undefined> {
  // 注意：这里应该调用真实的API来收藏作品
  // 由于目前没有真实的API实现，暂时只返回从API获取的作品数据
  console.log('Attempting to bookmark post:', id);
  
  // 尝试从API获取作品详情
  try {
    const workData = await workService.getWorkById(parseInt(id));
    
    // 更新缓存中的数据
    const posts = await getPosts();
    const postIndex = posts.findIndex(p => p.id === id);
    if (postIndex >= 0) {
      posts[postIndex].isBookmarked = true;
      setCache(postCache, 'all', posts);
    }
    
    return {
      id: workData.id.toString(),
      title: workData.title,
      thumbnail: workData.thumbnail,
      likes: workData.likes,
      comments: [],
      date: new Date().toISOString().slice(0, 10),
      isLiked: false,
      isBookmarked: true,
      category: 'design' as PostCategory,
      tags: workData.tags,
      description: workData.description || '',
      views: workData.views,
      shares: 0,
      isFeatured: workData.featured,
      isDraft: false,
      completionStatus: 'published' as const,
      creativeDirection: '',
      culturalElements: [],
      colorScheme: [],
      toolsUsed: [],
      downloadCount: 0,
      publishType: 'explore',
      communityId: null,
      moderationStatus: 'approved',
      rejectionReason: null,
      scheduledPublishDate: null,
      visibility: 'public',
      commentCount: workData.comments ? workData.comments.length : 0,
      engagementRate: 0,
      trendingScore: 0,
      reach: 0,
      moderator: null,
      reviewedAt: null,
      recommendationScore: 0,
      recommendedFor: []
    };
  } catch (error) {
    console.error('获取作品详情失败:', error);
  }
  return undefined;
}

/**
 * 取消收藏帖子
 */
export async function unbookmarkPost(id: string, userId: string = 'anonymous'): Promise<Post | undefined> {
  // 注意：这里应该调用真实的API来取消收藏作品
  // 由于目前没有真实的API实现，暂时只返回从API获取的作品数据
  console.log('Attempting to unbookmark post:', id);
  
  // 尝试从API获取作品详情
  try {
    const workData = await workService.getWorkById(parseInt(id));
    
    // 更新缓存中的数据
    const posts = await getPosts();
    const postIndex = posts.findIndex(p => p.id === id);
    if (postIndex >= 0) {
      posts[postIndex].isBookmarked = false;
      setCache(postCache, 'all', posts);
    }
    
    return {
      id: workData.id.toString(),
      title: workData.title,
      thumbnail: workData.thumbnail,
      likes: workData.likes,
      comments: [],
      date: new Date().toISOString().slice(0, 10),
      isLiked: false,
      isBookmarked: false,
      category: 'design' as PostCategory,
      tags: workData.tags,
      description: workData.description || '',
      views: workData.views,
      shares: 0,
      isFeatured: workData.featured,
      isDraft: false,
      completionStatus: 'published' as const,
      creativeDirection: '',
      culturalElements: [],
      colorScheme: [],
      toolsUsed: [],
      downloadCount: 0,
      publishType: 'explore',
      communityId: null,
      moderationStatus: 'approved',
      rejectionReason: null,
      scheduledPublishDate: null,
      visibility: 'public',
      commentCount: workData.comments ? workData.comments.length : 0,
      engagementRate: 0,
      trendingScore: 0,
      reach: 0,
      moderator: null,
      reviewedAt: null,
      recommendationScore: 0,
      recommendedFor: []
    };
  } catch (error) {
    console.error('获取作品详情失败:', error);
  }
  return undefined;
}

/**
 * 获取用户收藏的帖子ID列表
 */
export function getUserBookmarks(userId: string): string[] {
  const cacheKey = `user_${userId}`;
  const cached = getCache(bookmarkCache, cacheKey);
  if (cached) {
    return cached;
  }
  
  const userBookmarksKey = `${USER_BOOKMARKS_KEY}_${userId}`;
  const raw = safeLocalStorageGet(userBookmarksKey);
  const bookmarks = raw ? JSON.parse(raw) : [];
  setCache(bookmarkCache, cacheKey, bookmarks);
  return bookmarks;
}

/**
 * 获取用户点赞的帖子ID列表
 */
export function getUserLikes(userId: string): string[] {
  const cacheKey = `user_${userId}`;
  const cached = getCache(likeCache, cacheKey);
  if (cached) {
    return cached;
  }
  
  const userLikesKey = `${USER_LIKES_KEY}_${userId}`;
  const raw = safeLocalStorageGet(userLikesKey);
  const likes = raw ? JSON.parse(raw) : [];
  setCache(likeCache, cacheKey, likes);
  return likes;
}

/**
 * 获取用户收藏的帖子
 */
export async function getBookmarkedPosts(userId: string): Promise<Post[]> {
  // 注意：这里应该调用真实的API来获取用户收藏的作品
  // 由于目前没有真实的API实现，暂时返回空数组
  console.log('Attempting to get bookmarked posts for user:', userId);
  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  return [];
}

/**
 * 获取用户点赞的帖子
 */
export async function getLikedPosts(userId: string): Promise<Post[]> {
  // 注意：这里应该调用真实的API来获取用户点赞的作品
  // 由于目前没有真实的API实现，暂时返回空数组
  console.log('Attempting to get liked posts for user:', userId);
  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  return [];
}

/**
 * 递归查找评论
 */
function findComment(comments: Comment[], commentId: string): { comment: Comment; parent?: Comment; index: number } | null {
  for (let i = 0; i < comments.length; i++) {
    if (comments[i].id === commentId) {
      return { comment: comments[i], index: i };
    }
    const result = findComment(comments[i].replies, commentId);
    if (result) {
      return result.parent ? result : { ...result, parent: comments[i] };
    }
  }
  return null;
}

/**
 * 添加评论
 */
export async function addComment(postId: string, content: string, parentId?: string): Promise<Post | undefined> {
  try {
    // 调用API添加评论
    // 注意：这里应该调用真实的API来添加评论
    // 由于目前没有真实的API实现，暂时返回undefined
    console.log('Attempting to add comment to post:', postId, 'content:', content);
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 更新缓存中的数据
    const posts = await getPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex >= 0) {
      // 添加新评论
      const newComment = {
        id: `c-${Date.now()}`,
        content,
        date: new Date().toISOString(),
        likes: 0,
        reactions: {
          like: 0,
          love: 0,
          laugh: 0,
          surprise: 0,
          sad: 0,
          angry: 0
        },
        replies: [],
        userReactions: []
      };
      
      posts[postIndex].comments.push(newComment);
      posts[postIndex].commentCount = posts[postIndex].comments.length;
      setCache(postCache, 'all', posts);
    }
    
    return posts.find(p => p.id === postId);
  } catch (error) {
    console.error('Error adding comment:', error);
  }
  return undefined;
}

/**
 * 点赞评论
 */
export async function likeComment(postId: string, commentId: string): Promise<Post | undefined> {
  const posts = await getPosts();
  const postIdx = posts.findIndex(p => p.id === postId);
  if (postIdx >= 0) {
    const result = findComment(posts[postIdx].comments, commentId);
    if (result) {
      result.comment.likes += 1;
      result.comment.isLiked = true;
      scheduleBatchUpdate(KEY, posts);
      setCache(postCache, 'all', posts);
      return posts[postIdx];
    }
  }
  return undefined;
}

export async function unlikeComment(postId: string, commentId: string): Promise<Post | undefined> {
  const posts = await getPosts();
  const postIdx = posts.findIndex(p => p.id === postId);
  if (postIdx >= 0) {
    const result = findComment(posts[postIdx].comments, commentId);
    if (result && result.comment.likes > 0) {
      result.comment.likes -= 1;
      result.comment.isLiked = false;
      scheduleBatchUpdate(KEY, posts);
      setCache(postCache, 'all', posts);
      return posts[postIdx];
    }
  }
  return undefined;
}

export async function addCommentReaction(postId: string, commentId: string, reaction: CommentReaction): Promise<Post | undefined> {
  const posts = await getPosts();
  const postIdx = posts.findIndex(p => p.id === postId);
  if (postIdx >= 0) {
    const result = findComment(posts[postIdx].comments, commentId);
    if (result) {
      const userReactionIndex = result.comment.userReactions.indexOf(reaction);
      if (userReactionIndex > -1) {
        result.comment.userReactions.splice(userReactionIndex, 1);
        result.comment.reactions[reaction] -= 1;
      } else {
        result.comment.userReactions.push(reaction);
        result.comment.reactions[reaction] += 1;
      }
      scheduleBatchUpdate(KEY, posts);
      setCache(postCache, 'all', posts);
      return posts[postIdx];
    }
  }
  return undefined;
}

export async function deleteComment(postId: string, commentId: string): Promise<Post | undefined> {
  const posts = await getPosts();
  const postIdx = posts.findIndex(p => p.id === postId);
  if (postIdx >= 0) {
    const removeComment = (comments: Comment[]): boolean => {
      for (let i = 0; i < comments.length; i++) {
        if (comments[i].id === commentId) {
          comments.splice(i, 1);
          return true;
        }
        if (removeComment(comments[i].replies)) {
          return true;
        }
      }
      return false;
    };

    if (removeComment(posts[postIdx].comments)) {
      scheduleBatchUpdate(KEY, posts);
      setCache(postCache, 'all', posts);
      return posts[postIdx];
    }
  }
  return undefined;
}

/**
 * 创建作品
 */
export async function createWork(workData: Omit<Work, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'comments' | 'views' | 'userId' | 'isPublic' | 'type'>, imageFile: File): Promise<Work> {
  try {
    // 模拟图片上传
    const uploadImage = async (file: File): Promise<string> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          // 使用文本到图片的API生成图片URL
          const prompt = encodeURIComponent(`SDXL, ${workData.categoryId || 'design'} design work, high detail, ${workData.title}`);
          const imageUrl = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=1920x1080`;
          resolve(imageUrl);
        }, 1000);
      });
    };

    // 上传图片
    const thumbnail = await uploadImage(imageFile);
    // Declare imageUrl for fallback scope
    const imageUrl = thumbnail;

    // 使用API服务创建作品
    // apiService.createWork expects Omit<Work, 'id'>
    // We need to fill in missing required fields
    const workToCreate: Omit<Work, 'id'> = {
      ...workData,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'current-user', // Should be real user ID
      thumbnailUrl: thumbnail,
      likes: 0,
      views: 0,
      comments: 0,
      isPublic: true,
      type: 'image',
      isFeatured: false
    };

    const createdWork = await workService.createWork(workToCreate);

    // 保存到本地存储
    const localRaw = safeLocalStorageGet(KEY);
    const localPosts: Post[] = localRaw ? JSON.parse(localRaw) : [];

    const newPost: Post = {
      id: createdWork.id.toString(),
      title: createdWork.title,
      thumbnail: createdWork.thumbnail,
      likes: createdWork.likes,
      comments: [],
      date: new Date().toISOString().slice(0, 10),
      isLiked: false,
      isBookmarked: false,
      category: createdWork.category as PostCategory,
      tags: createdWork.tags,
      description: createdWork.description || '',
      views: createdWork.views,
      shares: 0,
      isFeatured: createdWork.featured,
      isDraft: false,
      completionStatus: 'published' as const,
      creativeDirection: '',
      culturalElements: [],
      colorScheme: [],
      toolsUsed: [],
      downloadCount: 0,
      publishType: 'explore' as const,
      communityId: null,
      moderationStatus: 'approved',
      rejectionReason: null,
      scheduledPublishDate: null,
      visibility: 'public',
      commentCount: 0,
      engagementRate: 0,
      trendingScore: 0,
      reach: 0,
      moderator: null,
      reviewedAt: null,
      recommendationScore: 0,
      recommendedFor: []
    };

    localPosts.unshift(newPost);
    safeLocalStorageSet(KEY, JSON.stringify(localPosts));

    // 清除缓存
    clearAllCaches();

    return createdWork;
  } catch (error) {
    console.error('创建作品失败，尝试本地保存:', error);
    
    // Fallback: Create locally
    const timestamp = Date.now();
    const id = timestamp;
    const idStr = timestamp.toString();

    // Construct Work object (for return)
    const fallbackWork: Work = {
      id: id,
      title: workData.title,
      creator: '我',
      creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
      thumbnail: imageUrl,
      likes: 0,
      comments: 0,
      views: 0,
      category: workData.category,
      tags: workData.tags,
      featured: false,
      description: workData.description,
    };

    // Construct Post object (for storage)
    const newPost: Post = {
      id: idStr,
      title: workData.title,
      thumbnail: imageUrl,
      likes: 0,
      comments: [],
      date: new Date().toISOString().slice(0, 10),
      isLiked: false,
      isBookmarked: false,
      category: workData.category as PostCategory,
      tags: workData.tags,
      description: workData.description || '',
      views: 0,
      shares: 0,
      isFeatured: false,
      isDraft: false,
      completionStatus: 'published',
      creativeDirection: '',
      culturalElements: [],
      colorScheme: [],
      toolsUsed: [],
      publishType: 'explore',
      communityId: null,
      moderationStatus: 'approved',
      rejectionReason: null,
      scheduledPublishDate: null,
      visibility: 'public',
      commentCount: 0,
      engagementRate: 0,
      trendingScore: 0,
      reach: 0,
      moderator: null,
      reviewedAt: null,
      recommendationScore: 0,
      recommendedFor: [],
      author: {
        id: 'current-user',
        username: '我',
        email: 'me@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
      }
    };

    // Save to localStorage
    const localRaw = safeLocalStorageGet(KEY);
    const localPosts: Post[] = localRaw ? JSON.parse(localRaw) : [];
    localPosts.unshift(newPost);
    safeLocalStorageSet(KEY, JSON.stringify(localPosts));

    // Clear cache
    clearAllCaches();

    // 添加到同步队列
    dataSyncService.addOperation({
      id: `sync_create_work_${idStr}`,
      type: 'create',
      entityType: 'work',
      entityId: idStr,
      payload: { ...workData, thumbnail: imageUrl },
      timestamp: Date.now(),
      priority: 'high',
      status: 'pending',
      retryCount: 0,
      maxRetries: 5,
      lastAttempt: 0
    });

    return fallbackWork;
  }
}

/**
 * 创建作品
 * 支持直接使用URL或Base64作为图片，绕过File对象
 */
export async function createWorkWithUrl(workData: Omit<Work, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'comments' | 'views' | 'userId' | 'isPublic' | 'type'>, imageUrl: string): Promise<Work> {
  try {
    // 使用API服务创建作品
    const workToCreate: Omit<Work, 'id'> = {
      ...workData,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'current-user',
      thumbnailUrl: imageUrl,
      likes: 0,
      views: 0,
      comments: 0,
      isPublic: true,
      type: 'image',
      isFeatured: false
    };

    const createdWork = await workService.createWork(workToCreate);

    // 保存到本地存储
    const localRaw = safeLocalStorageGet(KEY);
    const localPosts: Post[] = localRaw ? JSON.parse(localRaw) : [];

    const newPost: Post = {
      id: createdWork.id.toString(),
      title: createdWork.title,
      thumbnail: createdWork.thumbnailUrl || '',
      likes: createdWork.likes,
      comments: [],
      date: createdWork.createdAt ? new Date(createdWork.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      isLiked: false,
      isBookmarked: false,
      category: (createdWork.categoryId || 'other') as PostCategory,
      tags: createdWork.tags || [],
      description: createdWork.description || '',
      views: createdWork.views,
      shares: 0,
      isFeatured: createdWork.isFeatured || false,
      isDraft: false,
      completionStatus: 'published' as const,
      creativeDirection: '',
      culturalElements: [],
      colorScheme: [],
      toolsUsed: [],
      downloadCount: 0,
      publishType: 'explore' as const,
      communityId: null,
      moderationStatus: 'approved',
      rejectionReason: null,
      scheduledPublishDate: null,
      visibility: 'public',
      commentCount: 0,
      engagementRate: 0,
      trendingScore: 0,
      reach: 0,
      moderator: null,
      reviewedAt: null,
      recommendationScore: 0,
      recommendedFor: []
    };

    localPosts.unshift(newPost);
    safeLocalStorageSet(KEY, JSON.stringify(localPosts));

    // 清除缓存
    clearAllCaches();

    return createdWork;
  } catch (error) {
    console.error('创建作品失败，尝试本地保存:', error);
    
    // Fallback: Create locally if we have a thumbnail
    // Better approach: Since this is a mock environment fix, let's assume we can generate a mock URL or use a placeholder.
    const fallbackThumbnail = imageUrl || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Fallback&image_size=1920x1080';

    const timestamp = Date.now();
    const id = timestamp;
    const idStr = timestamp.toString();

    const fallbackWork: Work = {
      id: idStr,
      title: workData.title,
      userId: 'current-user',
      thumbnailUrl: fallbackThumbnail,
      likes: 0,
      comments: 0,
      views: 0,
      categoryId: workData.categoryId,
      tags: workData.tags,
      isFeatured: false,
      description: workData.description,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true,
      type: 'image'
    };

    const newPost: Post = {
      id: idStr,
      title: workData.title,
      thumbnail: fallbackThumbnail,
      likes: 0,
      comments: [],
      date: new Date().toISOString().slice(0, 10),
      isLiked: false,
      isBookmarked: false,
      category: (workData.categoryId || 'other') as PostCategory,
      tags: workData.tags || [],
      description: workData.description || '',
      views: 0,
      shares: 0,
      isFeatured: false,
      isDraft: false,
      completionStatus: 'published',
      creativeDirection: '',
      culturalElements: [],
      colorScheme: [],
      toolsUsed: [],
      publishType: 'explore',
      communityId: null,
      moderationStatus: 'approved',
      rejectionReason: null,
      scheduledPublishDate: null,
      visibility: 'public',
      commentCount: 0,
      engagementRate: 0,
      trendingScore: 0,
      reach: 0,
      moderator: null,
      reviewedAt: null,
      recommendationScore: 0,
      recommendedFor: [],
      author: {
        id: 'current-user',
        username: '我',
        email: 'me@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
      }
    };

    const localRaw = safeLocalStorageGet(KEY);
    const localPosts: Post[] = localRaw ? JSON.parse(localRaw) : [];
    localPosts.unshift(newPost);
    safeLocalStorageSet(KEY, JSON.stringify(localPosts));
    clearAllCaches();

    // 添加到同步队列
    dataSyncService.addOperation({
      id: `sync_create_work_${idStr}`,
      type: 'create',
      entityType: 'work',
      entityId: idStr,
      payload: { ...workData, thumbnail: fallbackThumbnail },
      timestamp: Date.now(),
      priority: 'high',
      status: 'pending',
      retryCount: 0,
      maxRetries: 5,
      lastAttempt: 0
    });

    return fallbackWork;
  }
}

/**
 * 删除帖子
 */
export async function deletePost(id: string): Promise<boolean> {
  try {
    // 从本地存储中删除帖子
    const localRaw = safeLocalStorageGet(KEY);
    if (localRaw) {
      const localPosts: Post[] = JSON.parse(localRaw);
      const filteredPosts = localPosts.filter(post => post.id !== id);
      safeLocalStorageSet(KEY, JSON.stringify(filteredPosts));
    }

    // 清除缓存，确保下次获取最新数据
    clearAllCaches();

    return true;
  } catch (error) {
    console.error('删除帖子失败:', error);
    return false;
  }
}

export default {
  getPosts,
  addPost,
  createWork,
  createWorkWithUrl,
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
  getUserBookmarks,
  getUserLikes,
  getBookmarkedPosts,
  getLikedPosts,
  addComment,
  likeComment,
  unlikeComment,
  addCommentReaction,
  deleteComment,
  deletePost,
  clearAllCaches,
  flushPendingUpdates,
  publishToExplore,
  publishToCommunity,
  getModerationStatus,
  getUserCommunities,
  getPublishStats,
  getEngagementStats
};
