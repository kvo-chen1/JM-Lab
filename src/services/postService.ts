// 评论反应类型
export type CommentReaction = 'like' | 'love' | 'laugh' | 'surprise' | 'sad' | 'angry';

// 导入统一API服务
import { workService, commentService } from './apiService';
import { mockWorks } from '@/mock/works';

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

// 作品接口
export interface Post {
  id: string;
  title: string;
  thumbnail: string;
  likes: number;
  comments: Comment[];
  date: string;
  author?: string;
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
  const cached = getCache(postCache, 'all');
  if (cached) {
    return cached;
  }
  
  try {
    // 使用统一API服务获取作品数据
    const works = await workService.getWorks();
    
    // 将Work类型转换为Post类型
    const posts = works.map(work => ({
      id: work.id.toString(),
      title: work.title,
      thumbnail: work.thumbnail,
      likes: work.likes,
      comments: [],
      date: new Date().toISOString().slice(0, 10),
      isLiked: false,
      isBookmarked: false,
      category: work.category as PostCategory,
      tags: work.tags,
      description: work.description || '',
      views: work.views,
      shares: 0,
      isFeatured: work.featured,
      isDraft: false,
      completionStatus: 'published',
      creativeDirection: '',
      culturalElements: [],
      colorScheme: [],
      toolsUsed: [],
      downloadCount: 0
    }));
    
    setCache(postCache, 'all', posts);
    return posts;
  } catch (error) {
    console.error('获取帖子失败:', error);
    // 失败时返回空数组
    return [];
  }
}

/**
 * 添加作品
 */
export async function addPost(p: Omit<Post, 'id' | 'likes' | 'comments' | 'date' | 'isLiked' | 'isBookmarked' | 'views' | 'shares' | 'isFeatured' | 'isDraft' | 'completionStatus'>): Promise<Post> {
  try {
    // 使用统一API服务创建作品
    const createdWork = await workService.createWork({
      title: p.title,
      thumbnail: p.thumbnail,
      category: p.category,
      tags: p.tags,
      description: p.description,
      views: 0,
      likes: 0,
      featured: false,
      user_id: '1' // 假设当前用户ID为1，实际应从认证上下文中获取
    });
    
    // 转换为Post类型
    const post: Post = {
      id: createdWork.id.toString(),
      likes: createdWork.likes,
      comments: [],
      date: new Date().toISOString().slice(0, 10),
      isLiked: false,
      isBookmarked: false,
      views: createdWork.views,
      shares: 0,
      isFeatured: createdWork.featured,
      isDraft: false,
      completionStatus: 'completed',
      ...p
    };
    
    // 更新缓存
    const posts = await getPosts();
    posts.unshift(post);
    setCache(postCache, 'all', posts);
    
    return post;
  } catch (error) {
    console.error('添加作品失败:', error);
    // 失败时返回本地创建的post
    const post: Post = {
      id: `p-${Date.now()}`,
      likes: 0,
      comments: [],
      date: new Date().toISOString().slice(0, 10),
      isLiked: false,
      isBookmarked: false,
      views: 0,
      shares: 0,
      isFeatured: false,
      isDraft: false,
      completionStatus: 'completed',
      ...p
    };
    return post;
  }
}

/**
 * 点赞帖子
 */
export async function likePost(id: string): Promise<Post | undefined> {
  try {
    // 使用统一API服务点赞作品
    await workService.likeWork(parseInt(id));
    
    // 更新本地缓存
    const userLikes = getUserLikes();
    if (!userLikes.includes(id)) {
      userLikes.push(id);
      scheduleBatchUpdate(USER_LIKES_KEY, userLikes);
      setCache(likeCache, 'user', userLikes);
    }
    
    // 更新帖子缓存
    const posts = await getPosts();
    const postIndex = posts.findIndex(p => p.id === id);
    if (postIndex >= 0) {
      posts[postIndex].likes++;
      posts[postIndex].isLiked = true;
      setCache(postCache, 'all', posts);
      return posts[postIndex];
    }
    
    // 如果缓存中没有，从mock数据获取
    const work = mockWorks.find(w => w.id.toString() === id);
    if (work) {
      return {
        id: work.id.toString(),
        title: work.title,
        thumbnail: work.thumbnail,
        likes: work.likes + 1,
        comments: [],
        date: new Date().toISOString().slice(0, 10),
        isLiked: true,
        isBookmarked: false,
        category: 'design' as PostCategory,
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
        downloadCount: 0
      };
    }
  } catch (error) {
    console.error('点赞帖子失败:', error);
  }
  return undefined;
}

/**
 * 取消点赞帖子
 */
export async function unlikePost(id: string): Promise<Post | undefined> {
  try {
    // 使用统一API服务取消点赞作品
    await workService.unlikeWork(parseInt(id));
    
    // 更新本地缓存
    const userLikes = getUserLikes();
    const updatedLikes = userLikes.filter(postId => postId !== id);
    scheduleBatchUpdate(USER_LIKES_KEY, updatedLikes);
    setCache(likeCache, 'user', updatedLikes);
    
    // 更新帖子缓存
    const posts = await getPosts();
    const postIndex = posts.findIndex(p => p.id === id);
    if (postIndex >= 0) {
      posts[postIndex].likes = Math.max(0, posts[postIndex].likes - 1);
      posts[postIndex].isLiked = false;
      setCache(postCache, 'all', posts);
      return posts[postIndex];
    }
    
    // 如果缓存中没有，从mock数据获取
    const work = mockWorks.find(w => w.id.toString() === id);
    if (work) {
      return {
        id: work.id.toString(),
        title: work.title,
        thumbnail: work.thumbnail,
        likes: Math.max(0, work.likes - 1),
        comments: [],
        date: new Date().toISOString().slice(0, 10),
        isLiked: false,
        isBookmarked: false,
        category: 'design' as PostCategory,
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
        downloadCount: 0
      };
    }
  } catch (error) {
    console.error('取消点赞帖子失败:', error);
  }
  return undefined;
}

/**
 * 收藏帖子
 */
export function bookmarkPost(id: string): Post | undefined {
  const userBookmarks = getUserBookmarks();
  if (!userBookmarks.includes(id)) {
    userBookmarks.push(id);
    scheduleBatchUpdate(USER_BOOKMARKS_KEY, userBookmarks);
    setCache(bookmarkCache, 'user', userBookmarks);
  }
  
  const work = mockWorks.find(w => w.id.toString() === id);
  if (work) {
    return {
      id: work.id.toString(),
      title: work.title,
      thumbnail: work.thumbnail,
      likes: work.likes,
      comments: [],
      date: new Date().toISOString().slice(0, 10),
      isLiked: false,
      isBookmarked: true,
      category: 'design' as PostCategory,
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
      downloadCount: 0
    };
  }
  return undefined;
}

/**
 * 取消收藏帖子
 */
export function unbookmarkPost(id: string): Post | undefined {
  const userBookmarks = getUserBookmarks();
  const updatedBookmarks = userBookmarks.filter(postId => postId !== id);
  scheduleBatchUpdate(USER_BOOKMARKS_KEY, updatedBookmarks);
  setCache(bookmarkCache, 'user', updatedBookmarks);
  
  const work = mockWorks.find(w => w.id.toString() === id);
  if (work) {
    return {
      id: work.id.toString(),
      title: work.title,
      thumbnail: work.thumbnail,
      likes: work.likes,
      comments: [],
      date: new Date().toISOString().slice(0, 10),
      isLiked: false,
      isBookmarked: false,
      category: 'design' as PostCategory,
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
      downloadCount: 0
    };
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
export function getBookmarkedPosts(): Post[] {
  const cached = getCache(bookmarkedPostsCache, 'all');
  if (cached) {
    return cached;
  }
  
  const bookmarkedIds = getUserBookmarks();
  const posts = mockWorks
    .filter(post => bookmarkedIds.includes(post.id.toString()))
    .map(work => ({
      id: work.id.toString(),
      title: work.title,
      thumbnail: work.thumbnail,
      likes: work.likes,
      comments: [],
      date: new Date().toISOString().slice(0, 10),
      isLiked: false,
      isBookmarked: true,
      category: 'design' as PostCategory,
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
      downloadCount: 0
    }));
  
  setCache(bookmarkedPostsCache, 'all', posts);
  return posts;
}

/**
 * 获取用户点赞的帖子
 */
export function getLikedPosts(): Post[] {
  const cached = getCache(likedPostsCache, 'all');
  if (cached) {
    return cached;
  }
  
  const likedIds = getUserLikes();
  const posts = mockWorks
    .filter(post => likedIds.includes(post.id.toString()))
    .map(work => ({
      id: work.id.toString(),
      title: work.title,
      thumbnail: work.thumbnail,
      likes: work.likes,
      comments: [],
      date: new Date().toISOString().slice(0, 10),
      isLiked: true,
      isBookmarked: false,
      category: 'design' as PostCategory,
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
      downloadCount: 0
    }));
  
  setCache(likedPostsCache, 'all', posts);
  return posts;
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
  const posts = await getPosts();
  const postIdx = posts.findIndex(p => p.id === postId);
  if (postIdx >= 0) {
    const newComment: Comment = {
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

    if (parentId) {
      const result = findComment(posts[postIdx].comments, parentId);
      if (result) {
        result.comment.replies.push(newComment);
      }
    } else {
      posts[postIdx].comments.push(newComment);
    }

    scheduleBatchUpdate(KEY, posts);
    setCache(postCache, 'all', posts);
    return posts[postIdx];
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

export default {
  getPosts,
  addPost,
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
  clearAllCaches,
  flushPendingUpdates
};
