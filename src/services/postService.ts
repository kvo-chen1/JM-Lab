import { supabase } from '@/lib/supabase';
import { uploadImage } from './imageService';

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
  authorAvatar?: string;
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
  type?: 'image' | 'video' | 'audio' | 'text' | 'design' | 'photography' | '3d' | 'other';
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
 * @param category 分类筛选
 * @param currentUserId 当前用户ID
 * @param useSupabase 是否从 Supabase 获取数据（默认 false，只从后端API获取）
 */
export async function getPosts(category?: string, currentUserId?: string, useSupabase: boolean = false): Promise<Post[]> {
  try {
    let worksFromLocal: Post[] = [];
    let worksFromSupabase: Post[] = [];

    // 获取当前用户的点赞列表（用于后端API的作品）
    let userLikedWorkIds: Set<string> = new Set();
    if (currentUserId && currentUserId !== 'anonymous' && currentUserId !== 'current-user') {
      try {
        const { data: likedWorks } = await supabase
          .from('works_likes')
          .select('work_id')
          .eq('user_id', currentUserId);
        if (likedWorks) {
          userLikedWorkIds = new Set(likedWorks.map(l => l.work_id.toString()));
        }
      } catch (error) {
        console.warn('Error fetching user likes:', error);
      }
    }

    // 从后端 API 获取作品数据（主要数据源）
    try {
      const response = await fetch('/api/works?limit=100');

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && Array.isArray(result.data)) {
          // 转换后端数据为 Post 类型
          worksFromLocal = result.data.map((w: any) => {
            // 处理视频URL：优先使用 videoUrl/video_url，如果为空且是视频类型，尝试从 thumbnail 推断
            let videoUrl = w.videoUrl || w.video_url || undefined;
            const thumbnail = w.thumbnail || w.cover_url || '';
            const category = (w.category as PostCategory) || 'other';
            const type = w.type || 'image';

            // 如果没有 videoUrl 但 category 是 video 或 type 是 video，尝试从 thumbnail 推断
            if (!videoUrl && (category === 'video' || type === 'video')) {
              // 如果 thumbnail 是视频URL，使用它
              if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(thumbnail)) {
                videoUrl = thumbnail;
                console.log('Inferred videoUrl from thumbnail:', { id: w.id, videoUrl });
              }
            }

            const workId = w.id?.toString() || Date.now().toString();

            return {
            id: workId,
            title: w.title || 'Untitled',
            thumbnail: thumbnail,
            videoUrl: videoUrl,
            type: type,
            likes: w.likes || 0,
            comments: [],
            date: w.date || (w.created_at ? new Date(w.created_at * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
            author: {
              id: w.creator_id || 'unknown',
              username: w.author?.username || w.creator || 'Unknown User',
              email: '',
              avatar: w.author?.avatar || w.avatar_url || ''
            },
            isLiked: userLikedWorkIds.has(workId),
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
          };
          });
          console.log('Fetched works from backend API:', worksFromLocal.length);
        }
      }
    } catch (error) {
      console.error('Error fetching works from backend API:', error);
    }

    // 从 Supabase posts 表获取数据（可选，默认不启用）
    if (useSupabase) {
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
            videoUrl: p.video_url || undefined,
            type: p.type || 'image',
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
    } // end if (useSupabase)
    
    // 如果没有从任何来源获取到数据，且允许使用Supabase，尝试直接从Supabase获取所有帖子
    if (useSupabase && worksFromLocal.length === 0 && worksFromSupabase.length === 0) {
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
            videoUrl: p.video_url || undefined,
            type: p.type || 'image',
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
    
    // 优先使用本地 API 的数据（主要数据源）
    // 首先添加 Supabase 的数据（如果启用）
    if (useSupabase) {
      worksFromSupabase.forEach(work => {
        allWorksMap.set(work.id, work);
      });
    }
    // 然后添加本地 API 的数据，覆盖重复的 ID
    worksFromLocal.forEach(work => {
      allWorksMap.set(work.id, work);
    });
    
    // 转换为数组并按创建日期排序
    const allWorks = Array.from(allWorksMap.values());
    allWorks.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    console.log('Total works after merging:', allWorks.length);
    console.log('Works from local API:', worksFromLocal.length);
    if (useSupabase) {
      console.log('Works from Supabase:', worksFromSupabase.length);
    }
    return allWorks;
  } catch (err) {
    console.error('Unexpected error in getPosts:', err);
    // 返回空数组
    return [];
  }
}

export async function getPostById(id: string, currentUserId?: string): Promise<Post | null> {
  // 首先尝试从后端 API 获取（因为视频作品存储在 works 表中）
  try {
    const response = await fetch(`/api/works/${id}`);
    if (response.ok) {
      const result = await response.json();
      console.log('Backend API response:', result);
      if (result.code === 0 && result.data) {
        const w = result.data;
        console.log('Fetched work from backend API:', { 
          id: w.id, 
          videoUrl: w.videoUrl, 
          video_url: w.video_url, 
          type: w.type,
          allKeys: Object.keys(w)
        });
        return {
          id: w.id?.toString() || id,
          title: w.title || 'Untitled',
          thumbnail: w.thumbnail || w.cover_url || '',
          videoUrl: w.videoUrl || w.video_url || undefined,
          type: w.type || 'image',
          likes: w.likes || 0,
          comments: [],
          date: w.date || (w.created_at ? new Date(w.created_at * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          author: {
            id: w.creator_id || 'unknown',
            username: w.author?.username || w.creator || 'Unknown User',
            email: '',
            avatar: w.author?.avatar || w.avatar_url || ''
          },
          isLiked: false,
          isBookmarked: false,
          category: w.category || 'other',
          tags: w.tags || [],
          description: w.description || w.content || '',
          views: w.views || 0,
          shares: 0,
          isFeatured: false,
          isDraft: w.status === 'draft',
          completionStatus: w.status === 'published' ? 'published' : 'draft',
          creativeDirection: '',
          culturalElements: [],
          colorScheme: [],
          toolsUsed: [],
          publishType: 'explore',
          communityId: null,
          moderationStatus: 'approved',
          rejectionReason: null,
          scheduledPublishDate: null,
          visibility: w.visibility || 'public',
          commentCount: w.comments || 0,
          engagementRate: 0,
          trendingScore: 0,
          recommendationScore: 0,
          recommendedFor: []
        };
      }
    }
  } catch (apiError) {
    console.error('Error fetching work from backend API:', apiError);
  }

  // 如果后端 API 失败，尝试从 Supabase 获取
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
    videoUrl: p.video_url || undefined,
    type: p.type || 'image',
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
  console.log('[createWork] Called with:', { workData, userId, fileType: imageFile.type, fileSize: imageFile.size });
  
  // 1. Upload file (image or video)
  let fileUrl: string;
  try {
    console.log('[createWork] Uploading file:', imageFile.name);
    fileUrl = await uploadImage(imageFile);
    console.log('[createWork] File uploaded successfully:', fileUrl);
  } catch (uploadError) {
    console.error('[createWork] File upload failed:', uploadError);
    // If upload fails, use a fallback URL
    fileUrl = `https://picsum.photos/seed/${Date.now()}/800/600`;
  }
  
  // 判断是否为视频
  const isVideo = imageFile.type.startsWith('video/');
  
  // 2. Insert into DB
  // 对于视频，使用通用的视频占位图作为缩略图 - 使用可靠的图片服务
  // 因为视频文件不能直接作为图片预览
  const thumbnailUrl = isVideo ? 
    `https://picsum.photos/seed/video-${Date.now()}/800/600` : 
    fileUrl;
  
  const result = await addPost({
    title: workData.title,
    description: workData.description,
    category: workData.categoryId,
    tags: workData.tags,
    thumbnail: thumbnailUrl,
    videoUrl: isVideo ? fileUrl : undefined,
    type: isVideo ? 'video' : 'image'
  }, { id: userId } as User);
  
  console.log('[createWork] Result:', result);
  return result;
}

export async function createWorkWithUrl(workData: any, imageUrl: string, userId?: string, isVideo: boolean = false): Promise<any> {
  // 对于视频，使用通用的视频占位图作为缩略图 - 使用可靠的图片服务
  const thumbnailUrl = isVideo ? 
    `https://picsum.photos/seed/video-${Date.now()}/800/600` : 
    imageUrl;
  
  return await addPost({
    title: workData.title,
    description: workData.description,
    category: workData.categoryId,
    tags: workData.tags,
    thumbnail: thumbnailUrl,
    videoUrl: isVideo ? imageUrl : undefined,
    type: isVideo ? 'video' : 'image'
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

// 下载外部图片并上传到 Supabase Storage
async function downloadAndUploadImage(imageUrl: string, userId: string): Promise<string | null> {
  try {
    // 如果已经是 Supabase 的链接，直接返回
    if (imageUrl.includes('supabase.co') || imageUrl.includes('localhost')) {
      return imageUrl;
    }

    console.log('[downloadAndUploadImage] Downloading image:', imageUrl.substring(0, 50));

    // 下载图片
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error('[downloadAndUploadImage] Failed to download:', response.status);
      return null;
    }

    const blob = await response.blob();
    const fileName = `works/${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

    // 上传到 Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, blob, {
        contentType: blob.type || 'image/png',
        upsert: false
      });

    if (error) {
      console.error('[downloadAndUploadImage] Upload error:', error);
      return null;
    }

    // 获取公共 URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(data.path);

    console.log('[downloadAndUploadImage] Uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('[downloadAndUploadImage] Error:', error);
    return null;
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
    // 判断是否为视频 - 优先使用 p.type 字段或 videoUrl
    const isVideo = p.type === 'video' || p.videoUrl;
    console.log('[createWorkViaBackend] isVideo:', isVideo, 'p.type:', p.type, 'p.videoUrl:', p.videoUrl);

    // 处理缩略图：如果是外部链接，下载并上传到 Supabase Storage
    let thumbnail = p.thumbnail;
    if (thumbnail && (thumbnail.includes('aliyuncs.com') || thumbnail.includes('dashscope'))) {
      console.log('[createWorkViaBackend] Processing external thumbnail...');
      const uploadedUrl = await downloadAndUploadImage(thumbnail, currentUser.id);
      if (uploadedUrl) {
        thumbnail = uploadedUrl;
        console.log('[createWorkViaBackend] Thumbnail uploaded to:', uploadedUrl);
      } else {
        console.warn('[createWorkViaBackend] Failed to upload thumbnail, using original URL');
      }
    }

    const workData: any = {
      title: p.title,
      description: p.description,
      category: isVideo ? 'video' : p.category,
      tags: p.tags || [],
      thumbnail: thumbnail,
      cover_url: thumbnail,
      creator_id: currentUser.id,
      user_id: currentUser.id,
      media: thumbnail ? [thumbnail] : [],
      type: isVideo ? 'video' : 'image',
      created_at: new Date().toISOString(),
      status: 'published',
      visibility: 'public',
      published_at: new Date().toISOString()
    }
    
    // 如果有视频URL，添加到数据中
    if (p.videoUrl) {
      workData.video_url = p.videoUrl;
    }
    
    console.log('[createWorkViaBackend] Sending workData:', { title: workData.title, type: workData.type, video_url: workData.video_url, thumbnail: workData.thumbnail?.substring(0, 50) });
    
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
    
    // 使用后端返回的数据，确保 videoUrl 正确
    const resultVideoUrl = work.videoUrl || work.video_url || p.videoUrl;
    console.log('[createWorkViaBackend] Returning post with videoUrl:', resultVideoUrl?.substring(0, 50));
    
    return {
      ...p,
      id: work.id?.toString() || Date.now().toString(),
      videoUrl: resultVideoUrl,
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
    
    // 判断是否为视频
    const isVideo = work.type === 'video' || work.video_url || work.category === 'video';
    
    const insertData: any = {
      title: work.title,
      content: work.description,
      author_id: currentUser.id,
      user_id: currentUser.id,
      category: isVideo ? 'video' : work.category,
      images: work.thumbnail && !isVideo ? [work.thumbnail] : [],
      attachments: work.thumbnail ? [{ type: isVideo ? 'video' : 'image', url: work.thumbnail }] : [],
      status: 'published',
      created_at: work.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 0,
      view_count: 0,
      comments_count: 0
    }
    
    // 如果有视频URL，添加到数据中
    if (work.video_url) {
      insertData.video_url = work.video_url;
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
  console.log('[addPost] Called with:', { 
    title: p.title, 
    category: p.category, 
    videoUrl: p.videoUrl?.substring(0, 50),
    type: p.type,
    userId: currentUser?.id 
  });

  try {
    // 优先使用后端API创建作品（保存到 works 表）
    const backendToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (backendToken && currentUser?.id) {
      console.log('[addPost] Using backend API to create work');
      return await createWorkViaBackend(p, currentUser)
    }
    
    // 如果没有后端token，尝试使用Supabase
    const supabaseUserId = await ensureSupabaseSessionUserId()
    
    // 容错处理：如果无法获取Supabase会话ID，但传入了当前用户
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
    
    // 添加到 posts 表（用于广场展示）
    // 根据文件类型判断是视频还是图片
    const isVideo = p.type === 'video' || p.videoUrl || (p.thumbnail && (p.thumbnail.endsWith('.mp4') || p.thumbnail.endsWith('.webm') || p.thumbnail.endsWith('.ogg')));
    const insertData: any = {
      title: p.title,
      content: p.description, // Mapping description to content
      author_id: currentUser.id,
      user_id: currentUser.id, // Redundant but safe
      category: isVideo ? 'video' : p.category,
      images: p.thumbnail && !isVideo ? [p.thumbnail] : [],
      status: 'published',
      created_at: new Date().toISOString(), // 使用标准的 ISO 8601 日期时间字符串
      updated_at: new Date().toISOString(),
      likes_count: 0,
      view_count: 0,
      comments_count: 0
    };
    
    // 如果有视频URL，添加到数据中
    if (p.videoUrl) {
      insertData.video_url = p.videoUrl;
    }
    
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
  console.log('[likePost] Called with:', { id, userId });
  if (!userId || userId === 'anonymous') {
    console.warn('[likePost] No valid userId');
    return undefined;
  }

  // 首先尝试使用后端 API
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    try {
      console.log('[likePost] Trying backend API...');
      const response = await fetch(`/api/works/${id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        console.log('[likePost] Backend API success');
        return { id, isLiked: true, likes: 0 } as unknown as Post;
      } else if (response.status !== 404) {
        console.warn('[likePost] Backend API failed:', response.status);
      }
    } catch (error) {
      console.warn('[likePost] Backend API error:', error);
    }
  }

  // 如果后端 API 不可用，尝试使用 Supabase
  console.log('[likePost] Trying Supabase...');
  
  // 判断是后端 API 的 work（数字ID）还是 Supabase 的 post（UUID）
  const isNumericId = /^\d+$/.test(id);
  console.log('[likePost] ID type:', isNumericId ? 'numeric (work)' : 'uuid (post)');
  
  // 1. Insert into likes
  let error;
  if (isNumericId) {
    // 后端 API 的 work，使用 works_likes 表
    const result = await supabase
      .from('works_likes')
      .insert({ 
        user_id: userId, 
        work_id: parseInt(id),
        created_at: new Date().toISOString()
      });
    error = result.error;
  } else {
    // Supabase 的 post，使用 likes 表
    const result = await supabase
      .from('likes')
      .insert({ 
        user_id: userId, 
        post_id: id,
        created_at: new Date().toISOString()
      });
    error = result.error;
  }

  if (error && error.code !== '23505') { // 23505 = unique_violation (already liked)
    console.error('[likePost] Supabase error:', error);
    return undefined;
  }

  // 2. Increment likes_count in posts table (仅对 Supabase posts)
  if (!isNumericId) {
    try {
      const { data: currentPost } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', id)
        .single();
      
      const newLikesCount = (currentPost?.likes_count || 0) + 1;
    
      await supabase
        .from('posts')
        .update({ likes_count: newLikesCount })
        .eq('id', id);

      console.log('[likePost] Supabase success');
      return { id, isLiked: true, likes: newLikesCount } as unknown as Post;
    } catch (e) {
      console.error('[likePost] Error updating likes count:', e);
      return { id, isLiked: true, likes: 0 } as unknown as Post;
    }
  }
}

export async function unlikePost(id: string, userId: string): Promise<Post | undefined> {
  console.log('[unlikePost] Called with:', { id, userId });
  if (!userId || userId === 'anonymous') return undefined;
  
  // 判断是后端 API 的 work（数字ID）还是 Supabase 的 post（UUID）
  const isNumericId = /^\d+$/.test(id);
  console.log('[unlikePost] ID type:', isNumericId ? 'numeric (work)' : 'uuid (post)');

  let error;
  if (isNumericId) {
    // 后端 API 的 work，使用 works_likes 表
    const result = await supabase
      .from('works_likes')
      .delete()
      .match({ user_id: userId, work_id: parseInt(id) });
    error = result.error;
  } else {
    // Supabase 的 post，使用 likes 表
    const result = await supabase
      .from('likes')
      .delete()
      .match({ user_id: userId, post_id: id });
    error = result.error;
  }

  if (error) {
    console.error('[unlikePost] Error:', error);
    return undefined;
  }
  
  // 减少 likes_count (仅对 Supabase posts)
  if (!isNumericId) {
    try {
      const { data: currentPost } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', id)
        .single();
      
      const newLikesCount = Math.max((currentPost?.likes_count || 0) - 1, 0);
      
      await supabase
        .from('posts')
        .update({ likes_count: newLikesCount })
        .eq('id', id);
    } catch (e) {
      console.error('[unlikePost] Error updating likes count:', e);
    }
  }
  
  console.log('[unlikePost] Success');
  return { id, isLiked: false } as unknown as Post;
}

export async function bookmarkPost(id: string, userId: string): Promise<Post | undefined> {
   console.log('[bookmarkPost] Called with:', { id, userId });
   if (!userId || userId === 'anonymous') {
     console.warn('[bookmarkPost] No valid userId');
     return undefined;
   }

   // 首先尝试使用后端 API
   const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
   if (token) {
     try {
       console.log('[bookmarkPost] Trying backend API...');
       const response = await fetch(`/api/works/${id}/bookmark`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
         }
       });
       
       if (response.ok) {
         console.log('[bookmarkPost] Backend API success');
         return { id, isBookmarked: true } as unknown as Post;
       } else if (response.status !== 404) {
         console.warn('[bookmarkPost] Backend API failed:', response.status);
       }
     } catch (error) {
       console.warn('[bookmarkPost] Backend API error:', error);
     }
   }

   // 如果后端 API 不可用，尝试使用 Supabase
   console.log('[bookmarkPost] Trying Supabase...');
   
   // 判断是后端 API 的 work（数字ID）还是 Supabase 的 post（UUID）
   const isNumericId = /^\d+$/.test(id);
   console.log('[bookmarkPost] ID type:', isNumericId ? 'numeric (work)' : 'uuid (post)');
   
   let error;
   if (isNumericId) {
     // 后端 API 的 work，使用 works_bookmarks 表
     const result = await supabase
      .from('works_bookmarks')
      .insert({ 
        user_id: userId, 
        work_id: parseInt(id),
        created_at: new Date().toISOString()
      });
     error = result.error;
   } else {
     // Supabase 的 post，使用 bookmarks 表
     const result = await supabase
      .from('bookmarks')
      .insert({ 
        user_id: userId, 
        post_id: id,
        created_at: new Date().toISOString()
      });
     error = result.error;
   }
   
   if (error) {
     console.error('[bookmarkPost] Supabase error:', error);
     if (error.code === '23505') {
       console.log('[bookmarkPost] Already bookmarked (duplicate)');
       return { id, isBookmarked: true } as unknown as Post;
     }
     return undefined;
   }

   console.log('[bookmarkPost] Supabase success');
   return { id, isBookmarked: true } as unknown as Post;
}

export async function unbookmarkPost(id: string, userId: string): Promise<Post | undefined> {
   console.log('[unbookmarkPost] Called with:', { id, userId });
   if (!userId || userId === 'anonymous') return undefined;
   
   // 判断是后端 API 的 work（数字ID）还是 Supabase 的 post（UUID）
   const isNumericId = /^\d+$/.test(id);
   console.log('[unbookmarkPost] ID type:', isNumericId ? 'numeric (work)' : 'uuid (post)');

   let error;
   if (isNumericId) {
     // 后端 API 的 work，使用 works_bookmarks 表
     const result = await supabase
      .from('works_bookmarks')
      .delete()
      .match({ user_id: userId, work_id: parseInt(id) });
     error = result.error;
   } else {
     // Supabase 的 post，使用 bookmarks 表
     const result = await supabase
      .from('bookmarks')
      .delete()
      .match({ user_id: userId, post_id: id });
     error = result.error;
   }
   
   if (error) {
     console.error('[unbookmarkPost] Error:', error);
     return undefined;
   }

   console.log('[unbookmarkPost] Success');
   return { id, isBookmarked: false } as unknown as Post;
}

// 获取作品评论列表
export async function getWorkComments(workId: string): Promise<Comment[]> {
  console.log('[getWorkComments] Called with:', workId);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // 优先使用后端 API
  if (token) {
    try {
      const response = await fetch(`/api/works/${workId}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && Array.isArray(result.data)) {
          // 转换后端数据为 Comment 类型
          return result.data.map((c: any) => ({
            id: c.id.toString(),
            content: c.content,
            date: new Date(c.created_at * 1000).toISOString(),
            author: c.user?.username || '用户',
            authorAvatar: c.user?.avatar_url || '',
            likes: c.likes || 0,
            reactions: {},
            replies: [],
            userId: c.user?.id,
            userReactions: [],
            parentId: c.parent_id
          }));
        }
      } else if (response.status === 404) {
        console.log('[getWorkComments] Backend API returned 404, trying Supabase');
      }
    } catch (error) {
      console.error('[getWorkComments] Backend API error:', error);
    }
  }
  
  // 回退到 Supabase - 尝试 work_comments 表（work_id 是 UUID）
  try {
    const { data: comments, error } = await supabase
      .from('work_comments')
      .select('*')
      .eq('work_id', workId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('[getWorkComments] work_comments error:', error);
    } else if (comments && comments.length > 0) {
      // 获取评论作者信息
      const userIds = [...new Set(comments.map(c => c.user_id).filter(Boolean))];
      let authorsMap: Map<string, any> = new Map();
      
      if (userIds.length > 0) {
        const { data: authorsData } = await supabase
          .from('users')
          .select('id, username, avatar_url')
          .in('id', userIds);
        
        if (authorsData) {
          authorsData.forEach(author => {
            authorsMap.set(author.id, author);
          });
        }
      }
      
      return comments.map((c: any) => {
        const author = authorsMap.get(c.user_id);
        return {
          id: c.id.toString(),
          content: c.content,
          date: new Date(c.created_at * 1000).toISOString(),
          author: author?.username || '用户',
          authorAvatar: author?.avatar_url || '',
          likes: c.likes || 0,
          reactions: {},
          replies: [],
          userId: c.user_id,
          userReactions: [],
          parentId: c.parent_id
        };
      });
    }
  } catch (error) {
    console.error('[getWorkComments] work_comments error:', error);
  }

  // 尝试 comments 表（post_id 是 UUID）
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', workId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('[getWorkComments] comments error:', error);
      return [];
    }
    
    if (!comments || comments.length === 0) {
      return [];
    }
    
    // 获取评论作者信息
    const userIds = [...new Set(comments.map(c => c.user_id).filter(Boolean))];
    let authorsMap: Map<string, any> = new Map();
    
    if (userIds.length > 0) {
      const { data: authorsData } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', userIds);
      
      if (authorsData) {
        authorsData.forEach(author => {
          authorsMap.set(author.id, author);
        });
      }
    }
    
    return comments.map((c: any) => {
      const author = authorsMap.get(c.user_id);
      return {
        id: c.id.toString(),
        content: c.content,
        date: c.created_at,
        author: author?.username || '用户',
        authorAvatar: author?.avatar_url || '',
        likes: c.likes_count || 0,
        reactions: {},
        replies: [],
        userId: c.user_id,
        userReactions: [],
        parentId: c.parent_id
      };
    });
  } catch (error) {
    console.error('[getWorkComments] comments error:', error);
    return [];
  }
}

// 删除作品评论
export async function deleteWorkComment(commentId: string): Promise<void> {
  console.log('[deleteWorkComment] Called with:', commentId);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  if (!token) {
    throw new Error('请先登录');
  }
  
  // 优先使用后端 API
  try {
    const response = await fetch(`/api/work-comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      return;
    } else if (response.status === 404) {
      console.log('[deleteWorkComment] Backend API returned 404, trying Supabase');
    } else {
      const error = await response.json();
      throw new Error(error.message || '删除评论失败');
    }
  } catch (error: any) {
    console.warn('[deleteWorkComment] Backend API error:', error);
  }
  
  // 回退到 Supabase - 尝试 work_comments 表
  try {
    const { error } = await supabase
      .from('work_comments')
      .delete()
      .eq('id', commentId);
    
    if (!error) {
      return;
    }
    
    // 如果失败，尝试 comments 表
    const { error: error2 } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);
    
    if (error2) {
      throw new Error('删除评论失败');
    }
  } catch (error: any) {
    console.error('[deleteWorkComment] Supabase error:', error);
    throw error;
  }
}

export async function addComment(postId: string, content: string, parentId?: string, user?: User): Promise<Post | undefined> {
  if (!user?.id) {
    console.error('[addComment] No user provided');
    throw new Error('请先登录后再评论');
  }
  
  console.log('[addComment] Called with:', { postId, content, userId: user.id });
  
  // 首先尝试使用后端API添加评论
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  console.log('[addComment] Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'null');
  
  if (token) {
    try {
      console.log('[addComment] Sending request to backend API...');
      const response = await fetch(`/api/posts/${postId}/comments`, {
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
      
      console.log('[addComment] Backend API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          console.log('[addComment] Success via backend API:', result.data);
          return { id: postId } as unknown as Post;
        }
      } else if (response.status === 404) {
        // 后端API不存在，记录日志但继续尝试Supabase
        console.log('[addComment] Backend API not found (404), will try Supabase');
      } else if (response.status === 401) {
        console.warn('[addComment] Backend API returned 401 - token invalid or expired');
        const errorText = await response.text();
        console.warn('[addComment] 401 response body:', errorText);
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
    
    // 判断ID类型：数字ID（后端works）或UUID（可能是 posts 或 works）
    const isNumericId = /^\d+$/.test(postId);
    const pId = isNumericId ? parseInt(postId) : postId;
    
    console.log('[addComment] ID type:', isNumericId ? 'numeric' : 'uuid', 'postId:', postId);
    
    // 首先尝试使用 work_comments 表（适用于 works）
    try {
      const { error: workError } = await supabase
        .from('work_comments')
        .insert({
          work_id: pId,
          user_id: effectiveUserId,
          content: content,
          parent_id: parentId ? (/^\d+$/.test(parentId) ? parseInt(parentId) : parentId) : null,
          likes: 0,
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000)
        });
      
      if (!workError) {
        console.log('[addComment] Success via work_comments table');
        return { id: postId } as unknown as Post;
      }
      
      // 如果 work_comments 失败，记录错误但继续尝试 comments 表
      console.log('[addComment] work_comments failed:', workError.message);
    } catch (workError) {
      console.log('[addComment] work_comments error:', workError);
    }
    
    // 尝试使用 comments 表（适用于 posts）
    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: pId,
        user_id: effectiveUserId,
        author_id: effectiveUserId,
        content: content,
        parent_id: parentId ? (/^\d+$/.test(parentId) ? parseInt(parentId) : parentId) : null
      });

    if (error) {
      console.error('Error adding comment to Supabase:', error);
      // 如果是RLS策略错误，提供更友好的提示
      if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
        throw new Error('评论失败：权限不足，请重新登录后再试');
      }
      throw new Error('评论失败: ' + error.message);
    }

    console.log('[addComment] Success via comments table');
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
    // 如果是当前登录用户，先尝试从后端 API 获取完整数据
    console.log('[getAuthorById] Current user, trying API first')
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (response.ok) {
        const result = await response.json()
        if (result.code === 0 && result.data) {
          const data = result.data
          console.log('[getAuthorById] Got current user data from API:', data)
          return {
            id: data.id,
            username: data.username || 'User',
            email: data.email || '',
            avatar: data.avatar || data.avatar_url || '',
            isAdmin: data.is_admin,
            membershipLevel: data.membership_level,
            membershipStatus: data.membership_status as any,
            followersCount: data.followers_count,
            followingCount: data.following_count,
            postsCount: data.posts_count,
            likesCount: data.likes_count,
            viewsCount: data.views
          }
        }
      } else if (response.status === 404) {
        console.log('[getAuthorById] API returned 404 for current user, using Supabase fallback')
      }
    } catch (error) {
      console.error('[getAuthorById] API failed for current user, using fallback:', error)
    }
    
    // 如果 API 失败，使用 Supabase auth 的数据（基本数据）
    // 安全地访问 user_metadata，避免 undefined 错误
    const userMetadata = currentUser.user_metadata || {}
    const username = userMetadata.username || currentUser.email?.split('@')[0] || 'User'
    console.log('[getAuthorById] Using current user fallback data, username:', username)
    return {
      id: currentUser.id,
      username: username,
      email: currentUser.email || '',
      avatar: userMetadata.avatar || userMetadata.avatar_url || ''
    };
  }
  
  console.log('[getAuthorById] Not current user, falling back to API')
  // 对于其他用户，使用后端 API 获取信息
  try {
    const response = await fetch(`/api/users/${userId}`)
    if (!response.ok) {
      console.error('[getAuthorById] API error:', response.status)
      // 如果 API 返回 404，尝试从 Supabase 获取用户数据
      if (response.status === 404) {
        console.log('[getAuthorById] Trying to get user from Supabase users table')
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, username, email, avatar_url, cover_image')
          .eq('id', userId)
          .single()
        
        if (!userError && userData) {
          console.log('[getAuthorById] Got user from Supabase:', userData)
          return {
            id: userData.id,
            username: userData.username || 'User',
            email: userData.email || '',
            avatar: userData.avatar_url || '',
            coverImage: userData.cover_image || ''
          }
        }
      }
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
      coverImage: data.coverImage || data.cover_image || '',
      isAdmin: data.is_admin,
      membershipLevel: data.membership_level,
      membershipStatus: data.membership_status as any,
      followersCount: data.followers_count,
      followingCount: data.following_count,
      postsCount: data.posts_count,
      likesCount: data.likes_count,
      viewsCount: data.views
    }
  } catch (error) {
    console.error('[getAuthorById] Failed to fetch user:', error)
    return null
  }
}

export async function checkUserFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
  try {
    if (!currentUserId) {
      console.log('[checkUserFollowing] 用户ID为空');
      return false;
    }
    
    console.log('[checkUserFollowing] 检查关注状态:', { follower_id: currentUserId, following_id: targetUserId });
    
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .match({ follower_id: currentUserId, following_id: targetUserId });
    
    if (error) {
      console.error('[checkUserFollowing] 查询失败:', error);
      return false;
    }
    
    console.log('[checkUserFollowing] 查询结果:', { count });
    return !!count && count > 0;
  } catch (error) {
    console.error('[checkUserFollowing] 异常:', error);
    return false;
  }
}

export async function followUser(currentUserId: string, targetUserId: string): Promise<boolean> {
  try {
    if (!currentUserId) {
      console.error('[followUser] 用户ID为空');
      throw new Error('请先登录');
    }

    if (currentUserId === targetUserId) {
      console.error('[followUser] 不能关注自己');
      throw new Error('不能关注自己');
    }

    console.log('[followUser] 执行关注:', { follower_id: currentUserId, following_id: targetUserId });

    // 使用后端 API 而不是 Supabase，避免 RLS 策略限制
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录');
    }

    const response = await fetch('/api/follows', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ targetUserId })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[followUser] 关注失败:', error);
      throw new Error(error.message || '关注失败');
    }

    console.log('[followUser] 关注成功');
    return true;
  } catch (error: any) {
    console.error('[followUser] 异常:', error);
    throw error;
  }
}

export async function unfollowUser(currentUserId: string, targetUserId: string): Promise<boolean> {
  try {
    if (!currentUserId) {
      console.error('[unfollowUser] 用户ID为空');
      throw new Error('请先登录');
    }

    console.log('[unfollowUser] 执行取消关注:', { follower_id: currentUserId, following_id: targetUserId });

    // 使用后端 API 而不是 Supabase，避免 RLS 策略限制
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录');
    }

    const response = await fetch(`/api/follows/${targetUserId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[unfollowUser] 取消关注失败:', error);
      throw new Error(error.message || '取消关注失败');
    }

    console.log('[unfollowUser] 取消关注成功');
    return true;
  } catch (error: any) {
    console.error('[unfollowUser] 异常:', error);
    throw error;
  }
}

// 获取关注列表
export async function getFollowingList(): Promise<{ id: string; username: string; avatar_url: string }[]> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录');
    }

    const response = await fetch('/api/follows/following', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取关注列表失败');
    }

    const result = await response.json();
    return result.data || [];
  } catch (error: any) {
    console.error('[getFollowingList] 异常:', error);
    throw error;
  }
}

// 获取粉丝列表
export async function getFollowersList(): Promise<{ id: string; username: string; avatar_url: string }[]> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('请先登录');
    }

    const response = await fetch('/api/follows/followers', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取粉丝列表失败');
    }

    const result = await response.json();
    return result.data || [];
  } catch (error: any) {
    console.error('[getFollowersList] 异常:', error);
    throw error;
  }
}

export async function getBookmarkedPosts(userId?: string): Promise<Post[]> {
  try {
    // 获取当前用户ID
    let currentUserId = userId;
    console.log('[getBookmarkedPosts] Starting, provided userId:', userId);

    if (!currentUserId || currentUserId === 'current-user') {
      const { data: { user } } = await supabase.auth.getUser();
      currentUserId = user?.id;
      console.log('[getBookmarkedPosts] Got user from Supabase:', currentUserId);

      // 如果Supabase没有会话，尝试从localStorage获取
      if (!currentUserId && typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            currentUserId = user?.id;
            console.log('[getBookmarkedPosts] Got user from localStorage:', currentUserId);
          } catch (e) {
            console.error('Failed to parse user from localStorage:', e);
          }
        }
      }
    }

    if (!currentUserId) {
      console.warn('[getBookmarkedPosts] No user ID available');
      return [];
    }

    console.log('[getBookmarkedPosts] Querying bookmarks for user:', currentUserId);

    const allPosts: Post[] = [];

    // 1. 首先尝试从后端 API 获取收藏作品
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      try {
        console.log('[getBookmarkedPosts] Trying backend API...');
        const response = await fetch('/api/user/bookmarks', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.code === 0 && result.data) {
            const works = result.data.map((work: any) => convertWorkToPost(work, false, true));
            allPosts.push(...works);
            console.log('[getBookmarkedPosts] Backend API success, found', works.length, 'works');
          }
        } else {
          console.warn('[getBookmarkedPosts] Backend API failed:', response.status);
        }
      } catch (error) {
        console.warn('[getBookmarkedPosts] Backend API error:', error);
      }
    }

    // 2. 同时查询 Supabase posts 的收藏（兼容旧数据）
    const { data: postBookmarks, error: postBookmarksError } = await supabase
      .from('bookmarks')
      .select('post_id')
      .eq('user_id', currentUserId);

    if (postBookmarksError) {
      console.error('[getBookmarkedPosts] Error fetching post bookmarks:', postBookmarksError);
    }

    console.log('[getBookmarkedPosts] Found post bookmarks:', postBookmarks?.length || 0);

    // 处理 Supabase posts
    if (postBookmarks && postBookmarks.length > 0) {
      const postIds = postBookmarks.map(b => b.post_id);
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds);

      if (postsError) {
        console.error('[getBookmarkedPosts] Error fetching posts:', postsError);
      } else if (posts && posts.length > 0) {
        allPosts.push(...posts.map(p => convertDbPostToPost(p, false, true)));
      }
    }

    console.log('[getBookmarkedPosts] Total bookmarked posts:', allPosts.length);
    return allPosts;
  } catch (error) {
    console.error('[getBookmarkedPosts] Unexpected error:', error);
    return [];
  }
}

export async function getLikedPosts(userId?: string): Promise<Post[]> {
  try {
    // 获取当前用户ID
    let currentUserId = userId;
    console.log('[getLikedPosts] Starting, provided userId:', userId);

    if (!currentUserId || currentUserId === 'current-user') {
      const { data: { user } } = await supabase.auth.getUser();
      currentUserId = user?.id;
      console.log('[getLikedPosts] Got user from Supabase:', currentUserId);

      // 如果Supabase没有会话，尝试从localStorage获取
      if (!currentUserId && typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            currentUserId = user?.id;
            console.log('[getLikedPosts] Got user from localStorage:', currentUserId);
          } catch (e) {
            console.error('Failed to parse user from localStorage:', e);
          }
        }
      }
    }

    if (!currentUserId) {
      console.warn('[getLikedPosts] No user ID available');
      return [];
    }

    console.log('[getLikedPosts] Querying likes for user:', currentUserId);

    const allPosts: Post[] = [];

    // 1. 首先尝试从后端 API 获取点赞作品
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      try {
        console.log('[getLikedPosts] Trying backend API...');
        const response = await fetch('/api/user/likes', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.code === 0 && result.data) {
            const works = result.data.map((work: any) => convertWorkToPost(work, true, false));
            allPosts.push(...works);
            console.log('[getLikedPosts] Backend API success, found', works.length, 'works');
          }
        } else {
          console.warn('[getLikedPosts] Backend API failed:', response.status);
        }
      } catch (error) {
        console.warn('[getLikedPosts] Backend API error:', error);
      }
    }

    // 2. 同时查询 Supabase posts 的点赞（兼容旧数据）
    const { data: postLikes, error: postLikesError } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', currentUserId);

    if (postLikesError) {
      console.error('[getLikedPosts] Error fetching post likes:', postLikesError);
    }

    console.log('[getLikedPosts] Found post likes:', postLikes?.length || 0);

    // 处理 Supabase posts
    if (postLikes && postLikes.length > 0) {
      const postIds = postLikes.map(l => l.post_id);
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds);

      if (postsError) {
        console.error('[getLikedPosts] Error fetching posts:', postsError);
      } else if (posts && posts.length > 0) {
        allPosts.push(...posts.map(p => convertDbPostToPost(p, true, false)));
      }
    }

    console.log('[getLikedPosts] Total liked posts:', allPosts.length);
    return allPosts;
  } catch (error) {
    console.error('[getLikedPosts] Unexpected error:', error);
    return [];
  }
}
export async function likeComment(postId: string, commentId: string, userId: string): Promise<boolean> {
  console.log('[likeComment] Called with:', { postId, commentId, userId });
  if (!userId || userId === 'anonymous') {
    console.warn('[likeComment] No valid userId');
    return false;
  }

  // 优先使用后端 API
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    try {
      const response = await fetch(`/api/works/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.code === 0;
      } else if (response.status === 404) {
        console.log('[likeComment] Backend API returned 404, trying Supabase');
      }
    } catch (error) {
      console.warn('[likeComment] Backend API error:', error);
    }
  }

  // 回退到 Supabase - 直接更新 work_comments 表的 likes 字段
  try {
    // 先获取当前 likes 值
    const { data: comment, error: fetchError } = await supabase
      .from('work_comments')
      .select('likes')
      .eq('id', commentId)
      .single();
    
    if (fetchError) {
      console.error('[likeComment] Fetch error:', fetchError);
      // 尝试 comment_likes 表
      const { error } = await supabase
        .from('comment_likes')
        .insert({
          user_id: userId,
          comment_id: commentId,
          created_at: new Date().toISOString()
        });
      
      if (error && error.code !== '23505') {
        console.error('[likeComment] comment_likes error:', error);
        return false;
      }
      return true;
    }
    
    // 更新 likes 字段
    const { error: updateError } = await supabase
      .from('work_comments')
      .update({ likes: (comment?.likes || 0) + 1 })
      .eq('id', commentId);
    
    if (updateError) {
      console.error('[likeComment] Update error:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[likeComment] Error:', error);
    return false;
  }
}

export async function unlikeComment(postId: string, commentId: string, userId: string): Promise<boolean> {
  console.log('[unlikeComment] Called with:', { postId, commentId, userId });
  if (!userId || userId === 'anonymous') {
    return false;
  }

  // 优先使用后端 API
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    try {
      const response = await fetch(`/api/works/comments/${commentId}/like`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.code === 0;
      }
    } catch (error) {
      console.warn('[unlikeComment] Backend API error:', error);
    }
  }

  // 回退到 Supabase - 直接更新 work_comments 表的 likes 字段
  try {
    // 先获取当前 likes 值
    const { data: comment, error: fetchError } = await supabase
      .from('work_comments')
      .select('likes')
      .eq('id', commentId)
      .single();
    
    if (fetchError) {
      console.error('[unlikeComment] Fetch error:', fetchError);
      // 尝试 comment_likes 表
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('user_id', userId)
        .eq('comment_id', commentId);
      
      if (error) {
        console.error('[unlikeComment] comment_likes error:', error);
        return false;
      }
      return true;
    }
    
    // 更新 likes 字段
    const { error: updateError } = await supabase
      .from('work_comments')
      .update({ likes: Math.max(0, (comment?.likes || 1) - 1) })
      .eq('id', commentId);
    
    if (updateError) {
      console.error('[unlikeComment] Update error:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[unlikeComment] Error:', error);
    return false;
  }
}

export async function addCommentReaction(postId: string, commentId: string, reaction: CommentReaction, userId: string): Promise<boolean> {
  console.log('[addCommentReaction] Called with:', { postId, commentId, reaction, userId });
  if (!userId || userId === 'anonymous') {
    return false;
  }

  // 优先使用后端 API
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    try {
      const response = await fetch(`/api/works/comments/${commentId}/reaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reaction })
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.code === 0;
      }
    } catch (error) {
      console.warn('[addCommentReaction] Backend API error:', error);
    }
  }

  // 回退到 Supabase
  try {
    const { error } = await supabase
      .from('comment_reactions')
      .insert({
        user_id: userId,
        comment_id: commentId,
        reaction: reaction,
        created_at: new Date().toISOString()
      });

    if (error && error.code !== '23505') {
      console.error('[addCommentReaction] Supabase error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[addCommentReaction] Error:', error);
    return false;
  }
}

export async function deleteComment(postId: string, commentId: string, userId: string): Promise<boolean> {
  console.log('[deleteComment] Called with:', { postId, commentId, userId });
  if (!userId || userId === 'anonymous') {
    return false;
  }

  // 优先使用后端 API
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    try {
      const response = await fetch(`/api/works/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.code === 0;
      }
    } catch (error) {
      console.warn('[deleteComment] Backend API error:', error);
    }
  }

  // 回退到 Supabase
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) {
      console.error('[deleteComment] Supabase error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[deleteComment] Error:', error);
    return false;
  }
}

// 回复评论
export async function replyToComment(postId: string, commentId: string, content: string, userId: string): Promise<boolean> {
  console.log('[replyToComment] Called with:', { postId, commentId, content, userId });
  if (!userId || userId === 'anonymous' || !content.trim()) {
    return false;
  }

  // 优先使用后端 API
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    try {
      const response = await fetch(`/api/works/comments/${commentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.code === 0;
      } else if (response.status === 404) {
        console.log('[replyToComment] Backend API returned 404, trying Supabase');
      }
    } catch (error) {
      console.warn('[replyToComment] Backend API error:', error);
    }
  }

  // 回退到 Supabase - 尝试 work_comments 表
  try {
    // work_comments 表：work_id 和 user_id 都是 UUID，created_at 是数字时间戳
    const result = await supabase
      .from('work_comments')
      .insert({
        work_id: postId,
        user_id: userId,
        content: content.trim(),
        parent_id: commentId,
        likes: 0,
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000)
      });
    
    if (!result.error) {
      return true;
    }
    
    console.log('[replyToComment] work_comments failed, trying comments table:', result.error);
    
    // 如果失败，尝试 comments 表
    const result2 = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content: content.trim(),
        parent_id: commentId,
        created_at: new Date().toISOString()
      });
    
    if (result2.error) {
      console.error('[replyToComment] Supabase error:', result2.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[replyToComment] Error:', error);
    return false;
  }
}

export async function deletePost(id: string): Promise<boolean> {
  console.log('[deletePost] Deleting work/post:', id);
  
  // 优先使用后端 API 删除作品
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  if (token) {
    try {
      console.log('[deletePost] Trying backend API...');
      const response = await fetch(`/api/works/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('[deletePost] Backend API success:', result);
        return result.code === 0;
      } else if (response.status === 404) {
        // 后端 API 不存在该作品，尝试 Supabase
        console.log('[deletePost] Backend API returned 404, trying Supabase');
      } else {
        console.warn('[deletePost] Backend API failed:', response.status);
        const errorText = await response.text();
        console.warn('[deletePost] Error response:', errorText);
      }
    } catch (error) {
      console.warn('[deletePost] Backend API error:', error);
    }
  }
  
  // 回退到 Supabase 删除
  console.log('[deletePost] Trying Supabase...');
  
  // 判断ID类型：数字ID（后端works）或UUID（Supabase posts）
  const isNumericId = /^\d+$/.test(id);
  
  if (isNumericId) {
    // 后端 API 的 work，使用 works_likes 等表
    // 先删除相关记录
    await supabase.from('work_likes').delete().eq('work_id', parseInt(id));
    await supabase.from('work_bookmarks').delete().eq('work_id', parseInt(id));
    await supabase.from('work_comments').delete().eq('work_id', parseInt(id));
    
    // 注意：后端 works 表不在 Supabase 中，所以这里只能删除 Supabase 相关记录
    console.log('[deletePost] Numeric ID, only deleted Supabase related records');
    return true;
  } else {
    // Supabase 的 post
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[deletePost] Supabase error:', error);
      return false;
    }
    console.log('[deletePost] Supabase success');
    return true;
  }
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

// 辅助函数：将数据库 post 转换为 Post 对象
function convertDbPostToPost(p: any, isLiked: boolean, isBookmarked: boolean): Post {
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
      id: p.author_id || 'unknown',
      username: 'User',
      email: '',
      avatar: ''
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

// 辅助函数：将后端 API work 转换为 Post 对象
function convertWorkToPost(work: any, isLiked: boolean, isBookmarked: boolean): Post {
  // 处理时间戳 - 后端返回的是秒级时间戳，需要转换为毫秒级
  const createdAt = work.created_at
    ? (work.created_at > 10000000000 ? work.created_at : work.created_at * 1000)
    : Date.now();

  return {
    id: work.id.toString(),
    title: work.title || 'Untitled',
    thumbnail: work.thumbnail || work.cover_url || '',
    likes: work.likes || 0,
    comments: [],
    date: new Date(createdAt).toISOString().split('T')[0],
    author: {
      id: work.creator_id || 'unknown',
      username: work.creator || work.creator_name || work.username || 'User',
      email: '',
      avatar: work.avatar_url || work.creator_avatar || ''
    },
    isLiked: isLiked,
    isBookmarked: isBookmarked,
    category: (work.category as PostCategory) || 'other',
    tags: work.tags || [],
    description: work.description || '',
    views: work.views || 0,
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
    commentCount: work.comments || 0,
    engagementRate: 0,
    trendingScore: 0,
    reach: 0,
    moderator: null,
    reviewedAt: null,
    recommendationScore: 0,
    recommendedFor: []
  };
}

// 记录浏览量
export async function recordView(itemId: string, type: 'works' | 'posts' = 'works'): Promise<boolean> {
  console.log('[recordView] Recording view:', { itemId, type });
  
  // 检查是否已经浏览过（使用 localStorage 防止重复计数）
  const viewKey = `view_${type}_${itemId}`;
  const lastView = localStorage.getItem(viewKey);
  const now = Date.now();
  
  // 24小时内只记录一次
  if (lastView && (now - parseInt(lastView)) < 24 * 60 * 60 * 1000) {
    console.log('[recordView] Already viewed within 24 hours');
    return false;
  }
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  if (token) {
    try {
      const response = await fetch(`/api/${type}/${itemId}/view`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          // 记录浏览时间
          localStorage.setItem(viewKey, now.toString());
          console.log('[recordView] View recorded successfully');
          return true;
        }
      }
    } catch (error) {
      console.warn('[recordView] Backend API error:', error);
    }
  }
  
  return false;
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
  getWorkComments,
  deleteWorkComment,
  likeComment,
  unlikeComment,
  addCommentReaction,
  deleteComment,
  replyToComment,
  deletePost,
  clearAllCaches,
  flushPendingUpdates,
  publishToExplore,
  publishToCommunity,
  getModerationStatus,
  getUserCommunities,
  getPublishStats,
  getEngagementStats,
  recordView
};
