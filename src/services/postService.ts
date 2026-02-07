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
    
    // 从后端 API 获取作品数据
    try {
      const response = await fetch('/api/works');
      
      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && Array.isArray(result.data)) {
          // 转换后端数据为 Post 类型
          worksFromLocal = result.data.map((w: any) => ({
            id: w.id?.toString() || Date.now().toString(),
            title: w.title || 'Untitled',
            thumbnail: w.thumbnail || w.cover_url || '',
            likes: w.likes || 0,
            comments: [],
            date: w.created_at ? new Date(w.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            author: {
              id: w.creator_id || 'unknown',
              username: w.username || w.creator || 'Unknown User',
              email: '',
              avatar: w.avatar_url || ''
            },
            isLiked: false,
            isBookmarked: false,
            category: (w.category as PostCategory) || 'other',
            tags: w.tags || [],
            description: w.description || '',
            views: w.views || 0,
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
          }));
          console.log('Fetched works from backend API:', worksFromLocal.length);
        }
      }
    } catch (error) {
      console.error('Error fetching works from backend API:', error);
    }

    // 从 Supabase posts 表获取数据
    try {
      // 检查用户是否已登录
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Supabase user:', user ? 'logged in' : 'not logged in');
      
      // 首先获取帖子列表（不使用嵌套查询，避免类型不匹配）
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data: dbPosts, error } = await query;

      if (error) {
        console.error('Error fetching posts from Supabase:', error);
      } else if (dbPosts && Array.isArray(dbPosts)) {
        // 获取所有作者ID（转换为字符串以匹配 users.id 的 TEXT 类型）
        const authorIds = [...new Set(dbPosts.map(p => p.author_id).filter(Boolean))].map(id => String(id));
        
        // 批量获取作者信息
        let authorsMap: Map<string, any> = new Map();
        if (authorIds.length > 0) {
          const { data: authorsData, error: authorsError } = await supabase
            .from('users')
            .select('id, username, email, avatar_url')
            .in('id', authorIds);
          
          if (!authorsError && authorsData) {
            authorsData.forEach(author => {
              authorsMap.set(author.id, author);
            });
          }
        }
        
        // 转换从 posts 表获取的数据为 Post 类型
        worksFromSupabase = dbPosts.map((p: any) => {
          const authorData = authorsMap.get(p.author_id) || {
            id: p.author_id || 'unknown',
            username: 'Unknown User',
            email: '',
            avatar_url: ''
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
              avatar: authorData.avatar_url || ''
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
  // 首先获取帖子（不使用嵌套查询，避免类型不匹配）
  const { data: p, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !p) return null;

  // 获取作者信息
  let author = null;
  if (p.author_id) {
    const { data: authorData } = await supabase
      .from('users')
      .select('id, username, email, avatar_url')
      .eq('id', String(p.author_id))
      .single();
    author = authorData;
  }

  // 获取标签
  let tags: string[] = [];
  try {
    const { data: postTags } = await supabase
      .from('post_tags')
      .select('tag_id')
      .eq('post_id', id);
    
    if (postTags && postTags.length > 0) {
      const tagIds = postTags.map(pt => pt.tag_id);
      const { data: tagsData } = await supabase
        .from('tags')
        .select('name')
        .in('id', tagIds);
      
      tags = tagsData?.map(t => t.name).filter(Boolean) || [];
    }
  } catch (e) {
    console.error('Error fetching tags:', e);
  }

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

  // Fetch comments（不使用嵌套查询，避免类型不匹配）
  const { data: commentsData } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', id)
    .order('created_at', { ascending: true });

  // 获取评论作者信息
  let comments: Comment[] = [];
  if (commentsData && commentsData.length > 0) {
    const authorIds = [...new Set(commentsData.map(c => c.user_id).filter(Boolean))].map(id => String(id));
    let authorsMap: Map<string, any> = new Map();
    
    if (authorIds.length > 0) {
      const { data: authorsData } = await supabase
        .from('users')
        .select('id, username, name')
        .in('id', authorIds);
      
      if (authorsData) {
        authorsData.forEach(author => {
          authorsMap.set(author.id, author);
        });
      }
    }
    
    comments = commentsData.map((c: any) => {
      const author = authorsMap.get(String(c.user_id));
      return {
        id: c.id.toString(),
        content: c.content,
        date: c.created_at,
        author: author?.username || author?.name || 'User',
        likes: 0,
        reactions: {},
        replies: [],
        userId: c.user_id,
        userReactions: []
      };
    });
  }

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

import eventBus from '@/lib/eventBus';

async function ensureSupabaseSessionUserId(): Promise<string | null> {
  try {
    // 首先检查当前会话
    const { data: sessionData } = await supabase.auth.getSession()
    const sessionUserId = sessionData?.session?.user?.id
    if (sessionUserId) {
      console.log('[postService] Using existing session:', sessionUserId);
      return sessionUserId
    }

    // 如果没有Supabase会话，尝试使用后端token通过后端API创建作品
    // 注意：后端API的token和Supabase的session token是不同的
    // 这里我们只检查是否有后端token，让addPost函数决定使用哪种方式
    if (typeof window !== 'undefined') {
      const backendToken = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      
      if (backendToken && userStr) {
        try {
          const user = JSON.parse(userStr)
          if (user?.id) {
            console.log('[postService] Found backend auth, userId:', user.id);
            // 返回用户ID，让addPost知道可以使用后端API
            return user.id
          }
        } catch (e) {
          console.error('[postService] Failed to parse user from localStorage:', e);
        }
      }
    }

    // 最后尝试获取用户信息
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) {
         console.warn('[postService] getUser failed:', userError.message);
         return null;
      }
      console.log('[postService] Using user from getUser:', userData?.user?.id);
      return userData?.user?.id || null
    } catch (error) {
      console.error('[postService] Exception during getUser:', error);
      return null;
    }
  } catch (err) {
    console.error('[postService] ensureSupabaseSessionUserId exception:', err);
    return null
  }
}

// 检查是否有有效的Supabase会话
async function hasValidSupabaseSession(): Promise<boolean> {
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    return !!sessionData?.session?.user?.id
  } catch {
    return false
  }
}

// 检查用户是否已登录（支持Supabase会话或后端token）
async function hasValidAuth(): Promise<{ isAuthenticated: boolean; userId?: string; authType: 'supabase' | 'backend' | 'none' }> {
  try {
    // 首先检查Supabase会话
    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData?.session?.user?.id) {
      return { isAuthenticated: true, userId: sessionData.session.user.id, authType: 'supabase' }
    }
    
    // 然后检查后端token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr)
          if (user?.id) {
            return { isAuthenticated: true, userId: user.id, authType: 'backend' }
          }
        } catch (e) {
          console.warn('[hasValidAuth] Failed to parse user from localStorage:', e)
        }
      }
    }
    
    return { isAuthenticated: false, authType: 'none' }
  } catch (error) {
    console.error('[hasValidAuth] Error checking auth:', error)
    return { isAuthenticated: false, authType: 'none' }
  }
}

// 使用后端API创建作品
async function createWorkViaBackend(p: Partial<Post>, currentUser: User): Promise<Post | undefined> {
  console.log('[createWorkViaBackend] Called with:', { title: p.title, category: p.category, userId: currentUser.id });
  
  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('请先登录后再发布作品')
  }
  
  try {
    const workData = {
      title: p.title,
      description: p.description,
      category: p.category,
      tags: p.tags || [],
      thumbnail: p.thumbnail,
      cover_url: p.thumbnail,
      creator_id: currentUser.id,
      user_id: currentUser.id,
      media: p.thumbnail ? [p.thumbnail] : [],
      created_at: new Date().toISOString()
    }
    
    const response = await fetch('/api/works', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(workData)
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('登录已过期，请重新登录后重试')
      }
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || '发布作品失败，请检查网络或登录状态')
    }
    
    const result = await response.json()
    console.log('[createWorkViaBackend] Success:', result);
    
    if (result.code !== 0) {
      throw new Error(result.message || '发布作品失败')
    }
    
    const work = result.data
    
    // 同时尝试插入到Supabase（用于广场展示）
    try {
      await syncWorkToSupabase(work, currentUser)
    } catch (syncError) {
      console.warn('[createWorkViaBackend] Failed to sync to Supabase:', syncError);
      // 同步失败不影响主流程
    }
    
    return {
      ...p,
      id: work.id?.toString() || Date.now().toString(),
      author: currentUser,
      date: new Date().toISOString().split('T')[0],
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
    } as Post
  } catch (error: any) {
    console.error('[createWorkViaBackend] Error:', error);
    throw error
  }
}

// 同步作品到Supabase
async function syncWorkToSupabase(work: any, currentUser: User): Promise<void> {
  try {
    // 检查是否有有效的Supabase会话
    const hasSession = await hasValidSupabaseSession()
    if (!hasSession) {
      console.log('[syncWorkToSupabase] No valid Supabase session, skipping sync');
      return
    }
    
    const insertData = {
      title: work.title,
      content: work.description,
      author_id: currentUser.id,
      user_id: currentUser.id,
      category: work.category,
      images: work.thumbnail ? [work.thumbnail] : [],
      attachments: work.thumbnail ? [{ type: 'image', url: work.thumbnail }] : [],
      status: 'published',
      created_at: work.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 0,
      view_count: 0,
      comments_count: 0
    }
    
    const { error } = await supabase.from('posts').insert(insertData)
    
    if (error) {
      console.warn('[syncWorkToSupabase] Failed to insert to Supabase:', error);
    } else {
      console.log('[syncWorkToSupabase] Successfully synced to Supabase');
    }
  } catch (error) {
    console.warn('[syncWorkToSupabase] Error:', error);
  }
}


export async function addPost(p: Partial<Post>, currentUser?: User): Promise<Post | undefined> {
  console.log('[addPost] Called with:', { title: p.title, category: p.category, userId: currentUser?.id });

  try {
    // 检查是否有有效的Supabase会话
    const hasSession = await hasValidSupabaseSession()
    console.log('[addPost] Has valid Supabase session:', hasSession);
    
    // 如果没有有效的Supabase会话，但有后端token，使用后端API创建作品
    if (!hasSession) {
      const backendToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (backendToken && currentUser?.id) {
        console.log('[addPost] No Supabase session, using backend API');
        return await createWorkViaBackend(p, currentUser)
      }
    }
    
    const supabaseUserId = await ensureSupabaseSessionUserId()
    
    // 容错处理：如果无法获取Supabase会话ID，但传入了当前用户，尝试使用后端API
    const finalUserId = supabaseUserId || currentUser?.id;

    if (!finalUserId) {
      throw new Error('请先登录后再发布作品')
    }
    
    // 如果没有用户ID，使用一个默认的用户ID
    if (!currentUser?.id || currentUser.id === 'current-user') {
      console.warn('[addPost] No valid user ID provided, using default user ID');
      currentUser = {
        id: finalUserId, // 使用获取到的ID
        username: '默认用户',
        email: 'default@example.com',
        membershipLevel: 'free',
        membershipStatus: 'active'
      };
    }

    // 确保ID一致
    if (currentUser.id !== finalUserId) {
      currentUser = {
        ...currentUser,
        id: finalUserId,
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

    // 处理插入错误
    if (error) {
      console.error('[addPost] Supabase insert failed:', error);
      
      // 处理认证相关错误 - 尝试使用后端API作为fallback
      if (error.message.includes('401') || error.message.includes('403') || error.message.includes('unauthorized') || error.message.includes('RLS')) {
        console.log('[addPost] Supabase auth failed, trying backend API as fallback');
        const backendToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (backendToken && currentUser?.id) {
          return await createWorkViaBackend(p, currentUser)
        }
        throw new Error('登录已过期，请重新登录后重试');
      }
      
      // 处理其他错误
      throw new Error(error.message || '发布作品失败，请检查网络或登录状态');
    }

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
    if (data) {
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
  } catch (error: any) {
    console.error('[addPost] Error:', error);
    
    // 重新抛出错误，以便前端捕获并提示用户
    if (error.message.includes('请先登录') || error.message.includes('登录已过期')) {
      throw error;
    } else {
      throw new Error('发布作品失败，请检查网络或登录状态');
    }
  }
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
  if (!user?.id) {
    console.error('[addComment] No user provided');
    throw new Error('请先登录后再评论');
  }
  
  console.log('[addComment] Called with:', { postId, content, userId: user.id });
  
  // 首先尝试使用后端API添加评论
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    try {
      const response = await fetch(`/api/works/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content,
          parent_id: parentId || null
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          console.log('[addComment] Success via backend API:', result.data);
          return { id: postId } as unknown as Post;
        }
      } else if (response.status === 404) {
        // 后端API不存在，记录日志但继续尝试Supabase
        console.log('[addComment] Backend API not found (404), will try Supabase');
      } else {
        console.warn('[addComment] Backend API failed with status:', response.status);
      }
    } catch (error) {
      console.error('[addComment] Backend API error:', error);
    }
  }
  
  // 尝试使用Supabase添加评论
  try {
    // 检查是否有Supabase会话或后端token（任一有效都认为已登录）
    const hasSupabaseSession = await hasValidSupabaseSession();
    const hasBackendToken = !!token;
    
    if (!hasSupabaseSession && !hasBackendToken) {
      console.error('[addComment] No valid session (neither Supabase nor backend)');
      throw new Error('请先登录后再评论');
    }
    
    // 尝试获取Supabase当前用户ID，如果没有则使用传入的user.id
    let effectiveUserId = user.id;
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser?.id) {
        effectiveUserId = supabaseUser.id;
        console.log('[addComment] Using Supabase user ID:', effectiveUserId);
      } else {
        console.log('[addComment] Using provided user ID:', effectiveUserId);
      }
    } catch (e) {
      console.log('[addComment] Could not get Supabase user, using provided user ID');
    }
    
    const pId = parseInt(postId);
    if (isNaN(pId)) {
      console.error('[addComment] Invalid post ID:', postId);
      throw new Error('无效的作品ID');
    }
    
    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: pId,
        user_id: effectiveUserId,
        author_id: effectiveUserId,
        content: content,
        parent_id: parentId ? parseInt(parentId) : null
      });

    if (error) {
      console.error('Error adding comment to Supabase:', error);
      // 如果是RLS策略错误，提供更友好的提示
      if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
        throw new Error('评论失败：权限不足，请重新登录后再试');
      }
      throw new Error('评论失败: ' + error.message);
    }

    console.log('[addComment] Success via Supabase');
    return { id: postId } as unknown as Post;
  } catch (error: any) {
    console.error('[addComment] Failed:', error);
    throw error;
  }
}


// Stub other functions
export async function getAuthorById(userId: string): Promise<User | null> {
  // 首先尝试获取当前登录用户的信息（从 Supabase auth）
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  console.log('[getAuthorById] userId:', userId, 'currentUser?.id:', currentUser?.id)
  console.log('[getAuthorById] user_metadata:', JSON.stringify(currentUser?.user_metadata))
  
  if (currentUser && currentUser.id === userId) {
    // 如果是当前登录用户，使用 Supabase auth 的数据（包含 user_metadata）
    const username = currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || 'User'
    console.log('[getAuthorById] Using current user data, username:', username)
    return {
      id: currentUser.id,
      username: username,
      email: currentUser.email || '',
      avatar: currentUser.user_metadata?.avatar || currentUser.user_metadata?.avatar_url || ''
    };
  }
  
  console.log('[getAuthorById] Not current user, falling back to API')
  // 对于其他用户，使用后端 API 获取信息
  try {
    const response = await fetch(`/api/users/${userId}`)
    if (!response.ok) {
      console.error('[getAuthorById] API error:', response.status)
      return null
    }
    const result = await response.json()
    if (result.code !== 0 || !result.data) {
      console.error('[getAuthorById] API returned error:', result)
      return null
    }
    
    const data = result.data
    return {
      id: data.id,
      username: data.username || 'User',
      email: data.email || '',
      avatar: data.avatar || data.avatar_url || '',
      isAdmin: data.is_admin,
      membershipLevel: data.membership_level,
      membershipStatus: data.membership_status as any,
      followersCount: data.followers_count,
      followingCount: data.following_count
    }
  } catch (error) {
    console.error('[getAuthorById] Failed to fetch user:', error)
    return null
  }
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
