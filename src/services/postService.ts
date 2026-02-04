import { supabase } from '@/lib/supabase';

// 评论反应类型
export type CommentReaction = 'like' | 'heart' | 'laugh' | 'wow' | 'sad' | 'angry';

// 作品分类类型
export type PostCategory = 'visual' | 'audio' | 'video' | 'text' | 'design' | 'photography' | '3d' | 'other';

// 评论接口

// 简化的User接口

// 作品接口

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
    let worksFromLocal: Post[] = [];
    let worksFromSupabase: Post[] = [];
    
    // 从本地 API 获取作品数据 - 已移除
    // 之前被注释的代码已物理删除以保持整洁

    // 从 Supabase posts 表获取数据作为备用
    try {
      // 检查用户是否已登录
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Supabase user:', user ? 'logged in' : 'not logged in');
      
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:users!author_id(*),
          post_tags(
            tags(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data: dbPosts, error } = await query;

      if (error) {
        console.error('Error fetching posts from Supabase:', error);
      } else if (dbPosts && Array.isArray(dbPosts)) {
        // 转换从 posts 表获取的数据为 Post 类型
        worksFromSupabase = dbPosts.map((p: any) => {
          const authorData = p.author || {
            id: p.author_id || 'unknown',
            username: 'Unknown User',
            email: '',
            avatar: ''
          };

          // 提取标签
          const tags = p.post_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || p.tags || [];

          let thumbnail = '';
          if (p.attachments && Array.isArray(p.attachments) && p.attachments.length > 0) {
              thumbnail = p.attachments[0].url || p.attachments[0];
          } else if (p.images && Array.isArray(p.images) && p.images.length > 0) {
              thumbnail = p.images[0];
          } else if (typeof p.attachments === 'string') {
              thumbnail = p.attachments;
          }

          return {
            id: p.id.toString(),
            title: p.title || 'Untitled',
            thumbnail: thumbnail,
            likes: p.likes_count || 0,
            comments: [],
            date: p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            author: {
              id: authorData.id,
              username: authorData.username || authorData.name || 'User',
              email: authorData.email || '',
              avatar: authorData.avatar || authorData.avatar_url || ''
            },
            isLiked: false,
            isBookmarked: false,
            category: (p.category as PostCategory) || 'other',
            tags: tags,
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
        });
        console.log('Fetched works from Supabase:', worksFromSupabase.length);
      }
    } catch (error) {
      console.error('Error fetching posts from Supabase:', error);
    }
    
    // 如果没有从任何来源获取到数据，尝试直接从Supabase获取所有帖子
    if (worksFromLocal.length === 0 && worksFromSupabase.length === 0) {
      console.log('No works found, trying to fetch from Supabase directly');
      try {
        const { data: allPosts, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!error && allPosts && Array.isArray(allPosts)) {
          console.log('Fetched all posts from Supabase:', allPosts.length);
          worksFromSupabase = allPosts.map((p: any) => ({
            id: p.id.toString(),
            title: p.title || 'Untitled',
            thumbnail: p.images?.[0] || p.attachments?.[0]?.url || p.attachments?.[0] || '',
            likes: p.likes_count || 0,
            comments: [],
            date: p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            author: {
              id: p.author_id || 'unknown',
              username: 'Unknown User',
              email: '',
              avatar: ''
            },
            isLiked: false,
            isBookmarked: false,
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
          }));
        }
      } catch (error) {
        console.error('Error fetching all posts from Supabase:', error);
      }
    }
    
    // 如果没有获取到数据，返回空数组
    if (worksFromLocal.length === 0 && worksFromSupabase.length === 0) {
      console.log('No works found from any source');
      return [];
    }
    
    // 合并数据，确保不重复
    const allWorksMap = new Map<string, Post>();
    
    // 首先添加本地 API 的数据
    worksFromLocal.forEach(work => {
      allWorksMap.set(work.id, work);
    });
    
    // 然后添加 Supabase 的数据，覆盖重复的 ID
    worksFromSupabase.forEach(work => {
      allWorksMap.set(work.id, work);
    });
    
    // 转换为数组并按创建日期排序
    const allWorks = Array.from(allWorksMap.values());
    allWorks.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    console.log('Total works after merging:', allWorks.length);
    return allWorks;
  } catch (err) {
    console.error('Unexpected error in getPosts:', err);
    // 返回空数组
    return [];
  }
}

export async function getPostById(id: string, currentUserId?: string): Promise<Post | null> {
  const { data: p, error } = await supabase
    .from('posts')
    .select(`
      *, 
      author:users!author_id(*),
      post_tags(
        tags(name)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !p) return null;

  // 提取标签
  const tags = p.post_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [];

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
    tags: tags,
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
  console.log('[createWork] Called with:', { workData, userId });
  
  // 1. Upload Image (Mock for now, or implement real upload if bucket exists)
  // For now, we assume we get a URL or use a placeholder
  const mockUrl = `https://picsum.photos/seed/${Date.now()}/800/600`;
  
  // 2. Insert into DB
  const result = await addPost({
    title: workData.title,
    description: workData.description,
    category: workData.categoryId,
    tags: workData.tags,
    thumbnail: mockUrl
  }, { id: userId } as User);
  
  console.log('[createWork] Result:', result);
  return result;
}

export async function createWorkWithUrl(workData: any, imageUrl: string, userId?: string): Promise<any> {
   return await addPost({
    title: workData.title,
    description: workData.description,
    category: workData.categoryId,
    tags: workData.tags,
    thumbnail: imageUrl
  }, { id: userId } as User);
}

async function ensureSupabaseSessionUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession()
    const sessionUserId = data?.session?.user?.id
    if (sessionUserId) return sessionUserId

    if (typeof window !== 'undefined') {
      const access_token = localStorage.getItem('token')
      const refresh_token = localStorage.getItem('refreshToken')

      if (access_token && refresh_token) {
        const { data: sessionData, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        })

        if (!error && sessionData?.session?.user?.id) {
          return sessionData.session.user.id
        }
      }
    }

    const { data: userData } = await supabase.auth.getUser()
    return userData?.user?.id || null
  } catch {
    return null
  }
}


export async function addPost(p: Partial<Post>, currentUser?: User): Promise<Post | undefined> {
  console.log('[addPost] Called with:', { title: p.title, category: p.category, userId: currentUser?.id });

  const supabaseUserId = await ensureSupabaseSessionUserId()
  if (!supabaseUserId) {
    throw new Error('请先登录后再发布作品')
  }
  
  // 如果没有用户ID，使用一个默认的用户ID
  if (!currentUser?.id || currentUser.id === 'current-user') {
    console.warn('[addPost] No valid user ID provided, using default user ID');
    currentUser = {
      id: 'default-user',
      username: '默认用户',
      email: 'default@example.com',
      membershipLevel: 'free',
      membershipStatus: 'active'
    };
  }

  if (currentUser.id !== supabaseUserId) {
    currentUser = {
      ...currentUser,
      id: supabaseUserId,
    }
  }

  console.log('[addPost] Using user:', currentUser.id);
  
  // 首先添加到 posts 表
  const insertData: any = {
    title: p.title,
    content: p.description, // Mapping description to content
    author_id: currentUser.id,
    user_id: currentUser.id, // Redundant but safe
    category: p.category,
    images: p.thumbnail ? [p.thumbnail] : [],
    attachments: p.thumbnail ? [{ type: 'image', url: p.thumbnail }] : [],
    status: 'published',
    created_at: new Date().toISOString(), // 使用标准的 ISO 8601 日期时间字符串
    updated_at: new Date().toISOString(),
    likes_count: 0,
    view_count: 0,
    comments_count: 0
  };
  
  // 只有在表中有tags列时才添加tags
  // 先尝试不带tags插入，如果失败再尝试其他方式
  console.log('[addPost] Inserting post data:', insertData);
  
  const { data, error } = await supabase
    .from('posts')
    .insert(insertData)
    .select()
    .single();

  // 准备本地API数据
  // 将tags和media转换为JSON字符串，因为数据库期望TEXT类型
  // 使用标准的ISO 8601日期时间字符串格式
  const workData = {
    title: p.title,
    description: p.description,
    cover_url: p.thumbnail,
    thumbnail: p.thumbnail,
    creator_id: currentUser.id,
    user_id: currentUser.id,
    category: p.category,
    tags: JSON.stringify(p.tags || []),
    media: JSON.stringify(p.thumbnail ? [p.thumbnail] : []),
    likes: 0,
    views_count: 0,
    comments_count: 0,
    created_at: new Date().toISOString() // 使用标准的ISO 8601日期时间字符串
  };

  // 然后尝试添加到 Supabase
  let supabasePostId: string | null = null;
  if (!error && data) {
    // ... (success logic)
    console.log('[addPost] Successfully added post to Supabase:', data);
    console.log('[addPost] Post ID:', data.id);
    supabasePostId = data.id.toString();

    // 处理标签
    if (p.tags && p.tags.length > 0) {
      // ... (tag logic)
      try {
        console.log('[addPost] Processing tags:', p.tags);
        const tagPromises = p.tags.map(async (tagName) => {
          // 1. 尝试获取现有标签
          let { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagName)
            .single();

          // 2. 如果不存在，创建新标签
          if (!existingTag) {
            const { data: newTag, error: tagError } = await supabase
              .from('tags')
              .insert({ name: tagName })
              .select('id')
              .single();
            
            if (tagError) {
               // 忽略重复键错误，并发情况下可能已存在
               if (tagError.code === '23505') {
                 const { data: retryTag } = await supabase
                   .from('tags')
                   .select('id')
                   .eq('name', tagName)
                   .single();
                 existingTag = retryTag;
               } else {
                 console.error('Error creating tag:', tagName, tagError);
               }
            } else {
              existingTag = newTag;
            }
          }

          // 3. 关联标签到帖子
          if (existingTag) {
            await supabase
              .from('post_tags')
              .insert({
                post_id: data.id,
                tag_id: existingTag.id
              });
          }
        });

        await Promise.all(tagPromises);
        console.log('[addPost] Tags processed successfully');
      } catch (tagErr) {
        console.error('Error processing tags:', tagErr);
      }
    }
  } else {
    console.error('[addPost] Supabase insert failed:', error);
    // 抛出错误，以便前端捕获并提示用户
    throw new Error(error?.message || '发布作品失败，请检查网络或登录状态');
  }

  // 使用Supabase的ID
  const finalId = supabasePostId || Date.now().toString();

  // Return mapped post
  // 使用 Supabase 的 created_at 或当前时间
  const postDate = data?.created_at ? new Date(data.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  
  return {
      ...p,
      id: finalId,
      author: currentUser,
      date: postDate,
      likes: 0,
      comments: [],
      isLiked: false,
      isBookmarked: false,
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
      recommendedFor: []
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
export async function deletePost(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting post:', error);
    return false;
  }
  return true;
}

export function clearAllCaches() {
  // 清除所有可能的缓存
  console.log('清除所有缓存...');
  try {
    localStorage.removeItem('jmzf_posts_cache');
    localStorage.removeItem('jmzf_works_cache');
    // 也可以在这里清除apiClient的缓存
  } catch (error) {
    console.error('清除缓存失败:', error);
  }
}

export function flushPendingUpdates() {}

export async function publishToExplore(postId: string, data: any) {
  const { error } = await supabase
    .from('posts')
    .update({
      status: 'published',
      publish_type: 'explore',
      is_featured: data.isFeatured || false,
      scheduled_publish_date: data.scheduledPublishDate || null,
      visibility: data.visibility || 'public'
    })
    .eq('id', postId);

  if (error) {
    console.error('Error publishing to explore:', error);
    return { success: false, message: error.message, moderationStatus: 'rejected' as const };
  }
  return { success: true, message: '发布成功', moderationStatus: 'approved' as const };
}

export async function publishToCommunity(postId: string, data: any) {
  const { error } = await supabase
    .from('posts')
    .update({
      status: 'published',
      publish_type: 'community',
      community_id: data.communityId,
      visibility: data.visibility || 'community',
      scheduled_publish_date: data.scheduledPublishDate || null
    })
    .eq('id', postId);

  if (error) {
    console.error('Error publishing to community:', error);
    return { success: false, message: error.message };
  }
  return { success: true, message: '发布成功' };
}
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
