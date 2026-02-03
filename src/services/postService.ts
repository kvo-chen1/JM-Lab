import { supabase } from '@/lib/supabase';
import { PostCategory, Post, Comment, CommentReaction, User } from '../types/index'; // Assuming types are here or I redefine them
// Redefine interfaces if they are local to this file in the original
// Based on previous read, they were exported from this file.
// I will keep them here to avoid breaking imports.

// 评论反应类型
export type { CommentReaction };

// 评论接口
export type { Comment };

// 作品分类类型
export type { PostCategory };

// 简化的User接口
export type { User };

// 作品接口
export type { Post };

// Re-exporting interfaces to match original file structure
// ... actually, I should just copy the interfaces to be safe.

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
  // Extra fields to match DB
  userId?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  isAdmin?: boolean;
  membershipLevel?: string;
  membershipStatus?: 'active' | 'inactive' | 'trial';
}

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
  downloadCount?: number;
  publishType: 'explore' | 'community' | 'both';
  communityId: string | null;
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'scheduled';
  rejectionReason: string | null;
  scheduledPublishDate: string | null;
  visibility: 'public' | 'private' | 'community';
  commentCount: number;
  engagementRate: number;
  trendingScore: number;
  reach: number;
  moderator: User | null;
  reviewedAt: string | null;
  recommendationScore: number;
  recommendedFor: string[];
}

// ------------------------------------------------------------------

/**
 * 获取所有帖子
 */
export async function getPosts(category?: string, currentUserId?: string): Promise<Post[]> {
  try {
    // 1. Fetch Posts with Author
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:users!author_id(*)
      `)
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      // Assuming category is stored in 'category' column text
      query = query.eq('category', category);
    }

    const { data: dbPosts, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return [];
    }

    if (!dbPosts) return [];

    // 2. Fetch User Likes and Bookmarks if user is logged in
    const likedPostIds = new Set<number>();
    const bookmarkedPostIds = new Set<number>();

    if (currentUserId && currentUserId !== 'current-user' && currentUserId !== 'anonymous') {
      const { data: likes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', currentUserId);
      
      const { data: bookmarks } = await supabase
        .from('bookmarks')
        .select('post_id')
        .eq('user_id', currentUserId);

      likes?.forEach(l => likedPostIds.add(l.post_id));
      bookmarks?.forEach(b => bookmarkedPostIds.add(b.post_id));
    }

    // 3. Map to Post interface
    const posts: Post[] = dbPosts.map((p: any) => {
      const authorData = p.author || {
        id: p.author_id || 'unknown',
        username: 'Unknown User',
        email: '',
        avatar: ''
      };

      // Handle attachments/images for thumbnail
      let thumbnail = '';
      if (p.attachments && Array.isArray(p.attachments) && p.attachments.length > 0) {
          thumbnail = p.attachments[0].url || p.attachments[0];
      } else if (p.images && Array.isArray(p.images) && p.images.length > 0) {
          thumbnail = p.images[0];
      } else if (typeof p.attachments === 'string') {
          thumbnail = p.attachments; // unlikely but possible legacy
      }

      return {
        id: p.id.toString(),
        title: p.title || 'Untitled',
        thumbnail: thumbnail,
        likes: p.likes_count || 0,
        comments: [], // Comments are fetched separately usually, or we can fetch count
        date: p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        author: {
          id: authorData.id,
          username: authorData.username || authorData.name || 'User',
          email: authorData.email || '',
          avatar: authorData.avatar || authorData.avatar_url || ''
        },
        isLiked: likedPostIds.has(p.id),
        isBookmarked: bookmarkedPostIds.has(p.id),
        category: (p.category as PostCategory) || 'other',
        tags: p.tags || [],
        description: p.content || '',
        views: p.view_count || 0,
        shares: 0,
        isFeatured: false, // Map if exists
        isDraft: p.status === 'draft',
        completionStatus: p.status === 'published' ? 'published' : 'draft',
        creativeDirection: '',
        culturalElements: [],
        colorScheme: [],
        toolsUsed: [],
        publishType: 'explore',
        communityId: p.community_id,
        moderationStatus: 'approved',
        rejectionReason: null,
        scheduledPublishDate: null,
        visibility: 'public',
        commentCount: p.comments_count || 0,
        engagementRate: 0,
        trendingScore: 0,
        reach: 0,
        moderator: null,
        reviewedAt: null,
        recommendationScore: 0,
        recommendedFor: []
      };
    });

    return posts;
  } catch (err) {
    console.error('Unexpected error in getPosts:', err);
    return [];
  }
}

export async function getPostById(id: string, currentUserId?: string): Promise<Post | null> {
  const { data: p, error } = await supabase
    .from('posts')
    .select(`*, author:users!author_id(*)`)
    .eq('id', id)
    .single();

  if (error || !p) return null;

  let isLiked = false;
  let isBookmarked = false;

  if (currentUserId && currentUserId !== 'current-user') {
     const { count: likeCount } = await supabase.from('likes').select('*', { count: 'exact', head: true }).match({ user_id: currentUserId, post_id: p.id });
     const { count: bookmarkCount } = await supabase.from('bookmarks').select('*', { count: 'exact', head: true }).match({ user_id: currentUserId, post_id: p.id });
     isLiked = !!likeCount;
     isBookmarked = !!bookmarkCount;
  }

  const authorData = p.author || {
        id: p.author_id || 'unknown',
        username: 'Unknown User',
        email: '',
        avatar: ''
  };

  let thumbnail = '';
  if (p.attachments && Array.isArray(p.attachments) && p.attachments.length > 0) {
      thumbnail = p.attachments[0].url || p.attachments[0];
  } else if (p.images && Array.isArray(p.images) && p.images.length > 0) {
      thumbnail = p.images[0];
  } else if (typeof p.attachments === 'string') {
      thumbnail = p.attachments;
  }

  // Fetch comments
  const { data: commentsData } = await supabase
    .from('comments')
    .select('*, author:users!author_id(*)')
    .eq('post_id', id)
    .order('created_at', { ascending: true });

  const comments: Comment[] = commentsData?.map((c: any) => ({
      id: c.id.toString(),
      content: c.content,
      date: c.created_at,
      author: c.author?.username || c.author?.name || 'User',
      likes: 0,
      reactions: {},
      replies: [],
      userId: c.user_id,
      userReactions: []
  })) || [];

  return {
    id: p.id.toString(),
    title: p.title || 'Untitled',
    thumbnail: thumbnail,
    likes: p.likes_count || 0,
    comments: comments,
    date: p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    author: {
      id: authorData.id,
      username: authorData.username || authorData.name || 'User',
      email: authorData.email || '',
      avatar: authorData.avatar || authorData.avatar_url || ''
    },
    isLiked: isLiked,
    isBookmarked: isBookmarked,
    category: (p.category as PostCategory) || 'other',
    tags: p.tags || [],
    description: p.content || '',
    views: p.view_count || 0,
    shares: 0,
    isFeatured: false,
    isDraft: p.status === 'draft',
    completionStatus: p.status === 'published' ? 'published' : 'draft',
    creativeDirection: '',
    culturalElements: [],
    colorScheme: [],
    toolsUsed: [],
    publishType: 'explore',
    communityId: p.community_id,
    moderationStatus: 'approved',
    rejectionReason: null,
    scheduledPublishDate: null,
    visibility: 'public',
    commentCount: p.comments_count || 0,
    engagementRate: 0,
    trendingScore: 0,
    reach: 0,
    moderator: null,
    reviewedAt: null,
    recommendationScore: 0,
    recommendedFor: []
  };
}

export async function getUserBookmarks(userId: string): Promise<string[]> {
  if (!userId || userId === 'current-user') return [];
  const { data } = await supabase.from('bookmarks').select('post_id').eq('user_id', userId);
  return data?.map(d => d.post_id.toString()) || [];
}

export async function getUserLikes(userId: string): Promise<string[]> {
  if (!userId || userId === 'current-user') return [];
  const { data } = await supabase.from('likes').select('post_id').eq('user_id', userId);
  return data?.map(d => d.post_id.toString()) || [];
}
export async function createWork(workData: any, imageFile: File, userId?: string): Promise<any> {
  // 1. Upload Image (Mock for now, or implement real upload if bucket exists)
  // For now, we assume we get a URL or use a placeholder
  const mockUrl = `https://picsum.photos/seed/${Date.now()}/800/600`;
  
  // 2. Insert into DB
  return await addPost({
    ...workData,
    thumbnail: mockUrl
  }, { id: userId } as User);
}

export async function createWorkWithUrl(workData: any, imageUrl: string, userId?: string): Promise<any> {
   return await addPost({
    ...workData,
    thumbnail: imageUrl
  }, { id: userId } as User);
}


export async function addPost(p: Partial<Post>, currentUser?: User): Promise<Post | undefined> {
  if (!currentUser?.id || currentUser.id === 'current-user') {
    console.error('Cannot add post: Invalid user ID');
    return undefined;
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      title: p.title,
      content: p.description, // Mapping description to content
      author_id: currentUser.id,
      user_id: currentUser.id, // Redundant but safe
      category: p.category,
      tags: p.tags,
      images: p.thumbnail ? [p.thumbnail] : [],
      attachments: p.thumbnail ? [{ type: 'image', url: p.thumbnail }] : [],
      status: 'published',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding post to Supabase:', error);
    return undefined;
  }

  // Return mapped post
  return {
      ...p,
      id: data.id.toString(),
      author: currentUser,
      date: data.created_at,
      likes: 0,
      comments: [],
      isLiked: false,
      isBookmarked: false
  } as Post;
}

export async function likePost(id: string, userId: string): Promise<Post | undefined> {
  if (!userId || userId === 'anonymous') return undefined;

  const postId = parseInt(id);
  if (isNaN(postId)) return undefined;

  // 1. Insert into likes
  const { error } = await supabase
    .from('likes')
    .insert({ user_id: userId, post_id: postId });

  if (error && error.code !== '23505') { // 23505 = unique_violation (already liked)
    console.error('Error liking post:', error);
    return undefined;
  }

  // 2. Increment likes_count in posts table (optional but good for performance)
  // RPC or simple update. Since we don't have RPC, we can just let next fetch handle it or manually update.
  // For immediate UI feedback, we return updated object.
  // We can also run a update query: update posts set likes_count = likes_count + 1 where id = ...
  // But checking current count first is safer.
  
  // Fetch updated post
  const { data: post } = await supabase.from('posts').select('likes_count').eq('id', postId).single();
  // We can optimistically return
  return { id, isLiked: true, likes: (post?.likes_count || 0) + 1 } as unknown as Post;
}

export async function unlikePost(id: string, userId: string): Promise<Post | undefined> {
  if (!userId || userId === 'anonymous') return undefined;
  const postId = parseInt(id);

  const { error } = await supabase
    .from('likes')
    .delete()
    .match({ user_id: userId, post_id: postId });

  if (error) {
    console.error('Error unliking post:', error);
    return undefined;
  }
  
  return { id, isLiked: false } as unknown as Post;
}

export async function bookmarkPost(id: string, userId: string): Promise<Post | undefined> {
   if (!userId || userId === 'anonymous') return undefined;
   const postId = parseInt(id);

   const { error } = await supabase
    .from('bookmarks')
    .insert({ user_id: userId, post_id: postId });
   
   if (error && error.code !== '23505') return undefined;

   return { id, isBookmarked: true } as unknown as Post;
}

export async function unbookmarkPost(id: string, userId: string): Promise<Post | undefined> {
   if (!userId || userId === 'anonymous') return undefined;
   const postId = parseInt(id);

   const { error } = await supabase
    .from('bookmarks')
    .delete()
    .match({ user_id: userId, post_id: postId });
   
   if (error) return undefined;

   return { id, isBookmarked: false } as unknown as Post;
}

export async function addComment(postId: string, content: string, parentId?: string, user?: User): Promise<Post | undefined> {
  if (!user?.id) return undefined;
  const pId = parseInt(postId);

  const { error } = await supabase
    .from('comments')
    .insert({
      post_id: pId,
      user_id: user.id,
      author_id: user.id, // Redundant
      content: content,
      parent_id: parentId ? parseInt(parentId) : null
    });

  if (error) {
    console.error('Error adding comment:', error);
    return undefined;
  }

  // Return updated post (simplified)
  return { id: postId } as unknown as Post;
}


// Stub other functions
export async function getAuthorById(userId: string): Promise<User | null> {
  if (userId === 'current-user') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) return {
          id: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          avatar: user.user_metadata?.avatar || ''
      };
      return null;
  }
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error || !data) return null;
  return {
    id: data.id,
    username: data.username || data.name || 'User',
    email: data.email || '',
    avatar: data.avatar || data.avatar_url || '',
    isAdmin: data.is_admin,
    membershipLevel: data.membership_level,
    membershipStatus: data.membership_status as any
  };
}

export async function checkUserFollowing(targetUserId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { count } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .match({ follower_id: user.id, following_id: targetUserId });
    
  return !!count && count > 0;
}

export async function followUser(targetUserId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: user.id, following_id: targetUserId });
    
  return !error;
}

export async function unfollowUser(targetUserId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('follows')
    .delete()
    .match({ follower_id: user.id, following_id: targetUserId });

  return !error;
}
export async function getBookmarkedPosts(userId: string) { return []; }
export async function getLikedPosts(userId: string) { return []; }
export async function likeComment(postId: string, commentId: string) { return undefined; }
export async function unlikeComment(postId: string, commentId: string) { return undefined; }
export async function addCommentReaction(postId: string, commentId: string, reaction: CommentReaction) { return undefined; }
export async function deleteComment(postId: string, commentId: string) { return undefined; }
export async function deletePost(id: string) { return false; }
export function clearAllCaches() {}
export function flushPendingUpdates() {}
export async function publishToExplore(postId: string, data: any) { return { success: true, message: '', moderationStatus: 'approved' as const }; }
export async function publishToCommunity(postId: string, data: any) { return { success: true, message: '' }; }
export async function getModerationStatus(postId: string) { return { status: 'approved' as const, reviewedAt: null, rejectionReason: null, moderator: null }; }
export async function getUserCommunities(userId: string) { return []; }
export async function getPublishStats() { return { successRate: 0, totalPublished: 0, totalPending: 0, totalRejected: 0, byCategory: [], byDate: [] }; }
export async function getEngagementStats(postId: string) { return { likes: 0, comments: 0, shares: 0, views: 0, downloads: 0, engagementRate: 0, bySource: [], byDate: [] }; }

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
