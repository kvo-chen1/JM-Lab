import { supabase } from '@/lib/supabase';
import { uploadImage } from './imageService';
import { uploadFile } from './storageServiceNew';
import { generatePlaceholderSvg } from '@/utils/imageUrlUtils';
import { contentScoringService } from './contentScoringService';
import { contentModerationService } from './contentModerationService';

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
  reactions?: Partial<Record<CommentReaction, number>>;
  parentId?: string;
  replies?: Comment[];
  isLiked?: boolean;
  userReactions?: CommentReaction[];
  // Extra fields to match DB
  userId?: string;
  // 评论图片支持
  images?: string[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  isAdmin?: boolean;
  membershipLevel?: string;
  membershipStatus?: 'active' | 'inactive' | 'trial' | 'pending' | 'expired';
  // 可选的扩展属性
  coverImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  occupation?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  likesCount?: number;
  viewsCount?: number;
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
  // 推广相关字段（内部使用）
  _isPromoted?: boolean;
  _promotedWorkId?: string;
  _packageType?: string;
}

// ------------------------------------------------------------------

/**
 * 获取所有帖子
 * @param category 分类筛选
 * @param currentUserId 当前用户ID
 * @param useSupabase 是否从 Supabase 获取数据（默认 false，只从后端API获取）
 * @param source 数据来源：'all' | 'posts' | 'works'（默认 'all'）
 */
export async function getPosts(category?: string, currentUserId?: string, useSupabase: boolean = false, source: 'all' | 'posts' | 'works' = 'all'): Promise<Post[]> {
  try {
    let worksFromLocal: Post[] = [];
    let worksFromSupabase: Post[] = [];

    // 获取当前用户的点赞列表（用于后端API的作品）
    let userLikedWorkIds: Set<string> = new Set();
    let userLikedPostIds: Set<string> = new Set();
    let userBookmarkedWorkIds: Set<string> = new Set();
    let userBookmarkedPostIds: Set<string> = new Set();
    if (currentUserId && currentUserId !== 'anonymous' && currentUserId !== 'current-user') {
      try {
        // 首先尝试从后端 API 获取收藏和点赞列表
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
          try {
            console.log('[getPosts] Fetching user likes/bookmarks from backend API...');
            const [likesResponse, bookmarksResponse] = await Promise.all([
              fetch('/api/user/likes', { headers: { 'Authorization': `Bearer ${token}` } }),
              fetch('/api/user/bookmarks', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (likesResponse.ok) {
              const likesResult = await likesResponse.json();
              if (likesResult.data && Array.isArray(likesResult.data)) {
                const workIds = likesResult.data.map((w: any) => w.id?.toString()).filter(Boolean);
                userLikedWorkIds = new Set(workIds);
                console.log('[getPosts] User likes from backend:', workIds);
              }
            }

            if (bookmarksResponse.ok) {
              const bookmarksResult = await bookmarksResponse.json();
              if (bookmarksResult.data && Array.isArray(bookmarksResult.data)) {
                const workIds = bookmarksResult.data.map((w: any) => w.id?.toString()).filter(Boolean);
                userBookmarkedWorkIds = new Set(workIds);
                console.log('[getPosts] User bookmarks from backend:', workIds);
              }
            }
          } catch (apiError) {
            console.warn('[getPosts] Backend API error, falling back to Supabase:', apiError);
          }
        }

        // 如果从后端 API 没有获取到数据，尝试从 Supabase 获取
        // 获取 Supabase Auth 的用户ID（UUID格式）
        let supabaseUserId = currentUserId;
        try {
          const { data: { user: supabaseUser } } = await supabase.auth.getUser();
          if (supabaseUser?.id) {
            supabaseUserId = supabaseUser.id;
            console.log('[getPosts] Using Supabase Auth userId for likes/bookmarks:', supabaseUserId);
          }
        } catch (e) {
          console.log('[getPosts] Could not get Supabase user, using provided userId');
        }

        if (userLikedWorkIds.size === 0) {
          const { data: likedWorks } = await supabase
            .from('works_likes')
            .select('work_id')
            .eq('user_id', supabaseUserId);
          if (likedWorks) {
            userLikedWorkIds = new Set(likedWorks.map(l => l.work_id.toString()));
            console.log('[getPosts] User likes from Supabase works_likes:', likedWorks.length);
          }
        }

        // 获取 posts 表的点赞
        const { data: likedPosts } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', supabaseUserId);
        if (likedPosts) {
          userLikedPostIds = new Set(likedPosts.map(l => l.post_id.toString()));
          console.log('[getPosts] User likes from Supabase likes:', likedPosts.length);
        }

        if (userBookmarkedWorkIds.size === 0) {
          const { data: bookmarkedWorks } = await supabase
            .from('works_bookmarks')
            .select('work_id')
            .eq('user_id', supabaseUserId);
          if (bookmarkedWorks) {
            userBookmarkedWorkIds = new Set(bookmarkedWorks.map(b => b.work_id.toString()));
            console.log('[getPosts] User bookmarks from Supabase works_bookmarks:', bookmarkedWorks.length);
          }
        }

        // 获取 posts 表的收藏
        const { data: bookmarkedPosts } = await supabase
          .from('bookmarks')
          .select('post_id')
          .eq('user_id', supabaseUserId);
        if (bookmarkedPosts) {
          userBookmarkedPostIds = new Set(bookmarkedPosts.map(b => b.post_id.toString()));
          console.log('[getPosts] User bookmarks from Supabase bookmarks:', bookmarkedPosts.length);
        }
      } catch (error) {
        console.warn('Error fetching user likes/bookmarks:', error);
      }
    }

    // 从后端 API 获取作品数据（主要数据源）
    let backendApiFailed = false;
    try {
      // 添加时间戳防止缓存
      const timestamp = Date.now();
      const response = await fetch(`/api/works?limit=100&_t=${timestamp}`);

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && Array.isArray(result.data)) {
          // 过滤：只保留有有效缩略图或视频的作品（排除 posts 表的数据）
          const validWorks = result.data.filter((w: any) => {
            const thumbnail = w.thumbnail || w.cover_url || w.image_url || w.thumbnail_url;
            const hasVideo = w.videoUrl || w.video_url;
            // 检查缩略图是否是有效的 URL（不是空字符串、null 或 'EMPTY'）
            const hasValidThumbnail = thumbnail && 
                                     typeof thumbnail === 'string' && 
                                     thumbnail.trim().length > 0 && 
                                     thumbnail !== 'EMPTY' &&
                                     !thumbnail.toLowerCase().includes('empty');
            return hasValidThumbnail || hasVideo;
          });
          console.log('Backend API returned:', result.data.length, 'items, filtered to:', validWorks.length, 'valid works');
          
          // 检查最新的作品（按 created_at 排序）
          const sortedWorks = [...result.data].sort((a: any, b: any) => (b.created_at || 0) - (a.created_at || 0));
          console.log('Latest 3 works (sorted by created_at):', sortedWorks.slice(0, 3).map((w: any) => ({
            id: w.id,
            title: w.title,
            created_at: w.created_at,
            thumbnail: w.thumbnail?.substring(0, 50),
            hasValidThumbnail: w.thumbnail && w.thumbnail !== 'EMPTY' && !w.thumbnail.toLowerCase().includes('empty')
          })));
          // 调试：打印前5个作品的完整数据结构
          console.log('First 5 works from API:', result.data.slice(0, 5).map((w: any) => ({
            id: w.id,
            title: w.title,
            views: w.view_count,
            likes: w.likes,
            thumbnail: w.thumbnail,
            thumbnail_length: w.thumbnail?.length,
            cover_url: w.cover_url,
            cover_url_length: w.cover_url?.length,
            image_url: w.image_url,
            thumbnail_url: w.thumbnail_url,
            videoUrl: w.videoUrl,
            video_url: w.video_url
          })));
          
          // 转换后端数据为 Post 类型
          worksFromLocal = validWorks.map((w: any) => {
            // 处理视频URL：优先使用 videoUrl/video_url，如果为空且是视频类型，尝试从其他字段推断
            let videoUrl = w.videoUrl || w.video_url || undefined;
            // 处理图片URL：保留原始URL（包括阿里云OSS签名参数）
            const thumbnail = w.thumbnail || w.cover_url || '';
            const category = (w.category as PostCategory) || 'other';
            const type = w.type || 'image';
            
            // 调试日志
            if (type === 'video') {
              console.log('[getPosts] Video work:', { 
                id: w.id, 
                title: w.title, 
                videoUrl: w.videoUrl, 
                video_url: w.video_url,
                finalVideoUrl: videoUrl,
                thumbnail: thumbnail?.substring(0, 50)
              });
            }

            // 如果没有 videoUrl 但 category 是 video 或 type 是 video，尝试从其他字段推断
            if (!videoUrl && (category === 'video' || type === 'video')) {
              // 1. 尝试从 thumbnail 推断
              if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(thumbnail)) {
                videoUrl = thumbnail;
                console.log('Inferred videoUrl from thumbnail:', { id: w.id, videoUrl });
              }
              // 2. 尝试从 media 数组获取（可能是数组或 JSON 字符串）
              else if (w.media) {
                let mediaArray = w.media;
                // 如果 media 是字符串，尝试解析为 JSON
                if (typeof w.media === 'string') {
                  try {
                    mediaArray = JSON.parse(w.media);
                  } catch (e) {
                    // 如果不是 JSON，当作单个 URL 处理
                    mediaArray = [w.media];
                  }
                }
                if (Array.isArray(mediaArray) && mediaArray.length > 0) {
                  const mediaUrl = mediaArray[0];
                  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(mediaUrl)) {
                    videoUrl = mediaUrl;
                    console.log('Inferred videoUrl from media:', { id: w.id, videoUrl });
                  }
                }
              }
              // 3. 尝试从 attachments 获取
              else if (w.attachments) {
                let attachmentsArray = w.attachments;
                // 如果 attachments 是字符串，尝试解析为 JSON
                if (typeof w.attachments === 'string') {
                  try {
                    attachmentsArray = JSON.parse(w.attachments);
                  } catch (e) {
                    attachmentsArray = [];
                  }
                }
                if (Array.isArray(attachmentsArray) && attachmentsArray.length > 0) {
                  const attachment = attachmentsArray[0];
                  const attachmentUrl = typeof attachment === 'string' ? attachment : attachment.url;
                  if (attachmentUrl && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(attachmentUrl)) {
                    videoUrl = attachmentUrl;
                    console.log('Inferred videoUrl from attachments:', { id: w.id, videoUrl });
                  }
                }
              }
              // 4. 如果是视频类型且缩略图包含 "video"，尝试构造视频 URL
              else if (thumbnail && thumbnail.includes('video')) {
                // 尝试从缩略图 URL 提取视频种子
                const seedMatch = thumbnail.match(/seed\/video-([^/]+)/);
                if (seedMatch) {
                  // 这里可以构造一个默认的视频 URL，或者从其他地方获取
                  console.log('Video type detected but no videoUrl found, thumbnail:', thumbnail);
                }
              }
            }

            const workId = w.id?.toString() || Date.now().toString();

            // 调试日志：返回前的最终 videoUrl
            if (type === 'video') {
              console.log('[getPosts] Returning video work:', { 
                id: workId, 
                title: w.title, 
                finalVideoUrl: videoUrl 
              });
            }

            return {
            id: workId,
            title: w.title || 'Untitled',
            thumbnail: thumbnail,
            videoUrl: videoUrl,
            type: type,
            likes: w.likes || 0,
            comments: Array(w.comment_count || w.comments_count || w.commentsCount || 0).fill(null),
            date: w.date || (w.created_at ? new Date(w.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
            author: {
              id: w.creator_id || w.user_id || w.author_id || w.creator || w.author ||
                   w.authorId || w.creatorId || w.userId ||
                   w.created_by || w.createdBy || w.owner_id || w.ownerId || 'unknown',
              username: w.author?.username || w.creator || w.creator_name || w.user?.username ||
                        w.createdBy?.username || w.owner?.username || '创作者',
              email: '',
              avatar: w.author?.avatar || w.avatar_url || w.user?.avatar_url || w.creator_avatar ||
                      w.createdBy?.avatar || w.owner?.avatar || ''
            },
            isLiked: userLikedWorkIds.has(workId),
            isBookmarked: userBookmarkedWorkIds.has(workId),
            category: (w.category as PostCategory) || 'other',
            tags: w.tags || [],
            description: w.description || '',
            views: w.view_count || 0,
            shares: 0,
            isFeatured: false,
            isDraft: false,
            completionStatus: 'published',
            creativeDirection: '',
            culturalElements: [],
            colorScheme: [],
            toolsUsed: [],
            publishType: w.community_id || w.communityId ? 'community' : 'explore',
            communityId: w.community_id || w.communityId || null,
            moderationStatus: 'approved',
            rejectionReason: null,
            scheduledPublishDate: null,
            visibility: 'public',
            commentCount: w.comment_count || w.comments_count || w.commentsCount || 0,
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
          // 调试：检查视频作品的 videoUrl
          const videoWorks = worksFromLocal.filter(w => w.type === 'video');
          console.log('[getPosts] Video works from backend API:', videoWorks.map(w => ({ 
            id: w.id, 
            title: w.title, 
            videoUrl: w.videoUrl,
            type: w.type
          })));
        }
      } else {
        console.error('Backend API returned error status:', response.status);
        backendApiFailed = true;
      }
    } catch (error) {
      console.error('Error fetching works from backend API:', error);
      backendApiFailed = true;
    }

    // 如果后端 API 失败或没有数据，强制使用 Supabase
    if (backendApiFailed || worksFromLocal.length === 0) {
      console.log('Backend API failed or returned no data, falling back to Supabase');
      useSupabase = true;
    }

    // 从 Supabase 获取数据（posts 表和 works 表）
    if (useSupabase) {
    try {
      // 检查用户是否已登录
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Supabase user:', user ? 'logged in' : 'not logged in');
      console.log('Fetching from Supabase with source:', source);
      
      // 根据 source 参数决定查询哪些表
      let allItems: any[] = [];
      
      // 查询 posts 表（如果 source 是 'all' 或 'posts'）
      if (source === 'all' || source === 'posts') {
        let postsQuery = supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (category && category !== 'all') {
          postsQuery = postsQuery.eq('category', category);
        }

        const { data: postsData, error: postsError } = await postsQuery;
        
        if (!postsError && postsData) {
          allItems = [...allItems, ...postsData.map((p: any) => ({ ...p, _source: 'posts' }))];
          console.log('Fetched from posts table:', postsData.length);
        }
      }
      
      // 查询 works 表（如果 source 是 'all' 或 'works'）
      if (source === 'all' || source === 'works') {
        let worksQuery = supabase
          .from('works')
          .select('*')
          .order('created_at', { ascending: false });

        if (category && category !== 'all') {
          worksQuery = worksQuery.eq('category', category);
        }

        const { data: worksData, error: worksError } = await worksQuery;
        
        if (!worksError && worksData) {
          allItems = [...allItems, ...worksData.map((w: any) => ({ ...w, _source: 'works' }))];
          console.log('Fetched from works table:', worksData.length);
          // 调试：打印第一个作品的完整数据结构
          if (worksData.length > 0) {
            console.log('First work item structure:', JSON.stringify(worksData[0], null, 2));
          }
        }
      }

      if (allItems.length > 0) {
        // 获取所有作者ID（尝试多种可能的字段名，包括下划线和驼峰命名）
        const authorIds = [...new Set(allItems.map(p => {
          const id = p.author_id || p.creator_id || p.user_id || p.creator || p.author || 
                     p.authorId || p.creatorId || p.userId || 
                     p.created_by || p.createdBy || p.owner_id || p.ownerId;
          return id;
        }).filter(Boolean))].map(id => String(id));
        console.log('Extracted authorIds:', authorIds);
        
        // 批量获取作者信息
        let authorsMap: Map<string, any> = new Map();
        if (authorIds.length > 0) {
          const { data: authorsData, error: authorsError } = await supabase
            .from('users')
            .select('id, username, email, avatar_url')
            .in('id', authorIds);
          
          if (!authorsError && authorsData) {
            console.log('Fetched authors:', authorsData.length);
            authorsData.forEach(author => {
              // 使用 String() 确保键的一致性
              authorsMap.set(String(author.id), author);
            });
          } else {
            console.error('Error fetching authors:', authorsError);
          }
        }
        
        // 转换数据为 Post 类型
        worksFromSupabase = allItems.map((p: any) => {
          // 尝试多种可能的作者ID字段名（包括下划线和驼峰命名）
          const authorId = p.author_id || p.creator_id || p.user_id || p.creator || p.author || 
                          p.authorId || p.creatorId || p.userId || 
                          p.created_by || p.createdBy || p.owner_id || p.ownerId;
          // 使用 String() 确保键的一致性
          const authorFromMap = authorsMap.get(String(authorId));
          
          // 调试：如果作者信息缺失，打印相关信息
          if (!authorFromMap && !p.author?.username && !p.creator && !p.creator_name) {
            console.log('Missing author info for item:', { id: p.id, authorId, availableFields: Object.keys(p).filter(k => k.includes('author') || k.includes('creator') || k.includes('user') || k.includes('owner')) });
          }
          
          const authorData = authorFromMap || {
            id: authorId || 'unknown',
            username: p.author?.username || p.creator || p.creator_name || p.user?.username || p.createdBy?.username || p.owner?.username || '创作者',
            email: '',
            avatar_url: p.author?.avatar || p.avatar_url || p.user?.avatar_url || p.creator_avatar || p.createdBy?.avatar || p.owner?.avatar || ''
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
          } else if (p.thumbnail) {
              thumbnail = p.thumbnail;
          } else if (p.cover_url) {
              thumbnail = p.cover_url;
          }

          return {
            id: p.id.toString(),
            title: p.title || 'Untitled',
            thumbnail: thumbnail,
            videoUrl: p.video_url || p.videoUrl || undefined,
            type: p.type || 'image',
            likes: p.likes_count || p.likes || 0,
            comments: Array(p.comments_count || p.comment_count || 0).fill(null),
            date: p.created_at ? (typeof p.created_at === 'string' ? p.created_at.split('T')[0] : new Date(p.created_at).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
            author: {
              id: authorData.id,
              username: authorData.username || authorData.name || 'User',
              email: authorData.email || '',
              avatar: authorData.avatar_url || ''
            },
            isLiked: p._source === 'posts'
              ? userLikedPostIds.has(p.id.toString())
              : userLikedWorkIds.has(p.id.toString()),
            isBookmarked: p._source === 'posts'
              ? userBookmarkedPostIds.has(p.id.toString())
              : userBookmarkedWorkIds.has(p.id.toString()),
            category: (p.category as PostCategory) || 'other',
            tags: tags,
            description: p.content || p.description || '',
            views: p.view_count || p.views || 0,
            shares: 0,
            isFeatured: false,
            isDraft: p.status === 'draft',
            completionStatus: p.status === 'published' ? 'published' : 'draft',
            creativeDirection: '',
            culturalElements: [],
            colorScheme: [],
            toolsUsed: [],
            publishType: p._source === 'works' ? 'explore' : (p.community_id ? 'community' : 'explore'),
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

          // 获取所有作者ID
          const authorIds = [...new Set(allPosts.map(p => {
            const id = p.author_id || p.creator_id || p.user_id || p.creator || p.author ||
                       p.authorId || p.creatorId || p.userId ||
                       p.created_by || p.createdBy || p.owner_id || p.ownerId;
            return id;
          }).filter(Boolean))].map(id => String(id));

          // 批量获取作者信息
          let authorsMap: Map<string, any> = new Map();
          if (authorIds.length > 0) {
            const { data: authorsData, error: authorsError } = await supabase
              .from('users')
              .select('id, username, email, avatar_url')
              .in('id', authorIds);

            if (!authorsError && authorsData) {
              authorsData.forEach(author => {
                authorsMap.set(String(author.id), author);
              });
            }
          }

          worksFromSupabase = allPosts.map((p: any) => {
            const authorId = p.author_id || p.creator_id || p.user_id || p.creator || p.author ||
                            p.authorId || p.creatorId || p.userId ||
                            p.created_by || p.createdBy || p.owner_id || p.ownerId;
            const authorFromMap = authorsMap.get(String(authorId));

            const authorData = authorFromMap || {
              id: authorId || 'unknown',
              username: p.author?.username || p.creator || p.creator_name || p.user?.username || p.createdBy?.username || p.owner?.username || '创作者',
              email: '',
              avatar_url: p.author?.avatar || p.avatar_url || p.user?.avatar_url || p.creator_avatar || p.createdBy?.avatar || p.owner?.avatar || ''
            };

            return {
              id: p.id.toString(),
              title: p.title || 'Untitled',
              thumbnail: p.images?.[0] || p.attachments?.[0]?.url || p.attachments?.[0] || '',
              videoUrl: p.video_url || p.videoUrl || undefined,
              type: p.type || 'image',
              likes: p.likes_count || 0,
              comments: Array(p.comments_count || p.comment_count || 0).fill(null),
              date: p.created_at ? (typeof p.created_at === 'string' ? p.created_at.split('T')[0] : new Date(p.created_at).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
              author: {
                id: authorData.id,
                username: authorData.username || authorData.name || '创作者',
                email: authorData.email || '',
                avatar: authorData.avatar_url || ''
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
            };
          });
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
        const commentCount = w.comments || w.comments_count || w.commentCount || 0;
        return {
          id: w.id?.toString() || id,
          title: w.title || 'Untitled',
          thumbnail: w.thumbnail || w.cover_url || '',
          videoUrl: w.videoUrl || w.video_url || undefined,
          type: w.type || 'image',
          likes: w.likes || 0,
          comments: Array(commentCount).fill(null),
          date: w.date || (w.created_at ? new Date(w.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          author: {
            id: w.creator_id || w.user_id || w.author_id || w.creator || w.author ||
                 w.authorId || w.creatorId || w.userId ||
                 w.created_by || w.createdBy || w.owner_id || w.ownerId || 'unknown',
            username: w.author?.username || w.creator || w.creator_name || w.user?.username ||
                      w.createdBy?.username || w.owner?.username || '创作者',
            email: '',
            avatar: w.author?.avatar || w.avatar_url || w.user?.avatar_url || w.creator_avatar ||
                    w.createdBy?.avatar || w.owner?.avatar || ''
          },
          isLiked: false,
          isBookmarked: false,
          category: w.category || 'other',
          tags: w.tags || [],
          description: w.description || w.content || '',
          views: w.view_count || 0,
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
          rejectionStatus: 'approved',
          rejectionReason: null,
          scheduledPublishDate: null,
          visibility: w.visibility || 'public',
          commentCount: commentCount,
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

  // 如果后端 API 失败，尝试从 Supabase 获取（同时查询 posts 和 works 表）
  let p: any = null;
  let author = null;
  
  // 先尝试从 posts 表获取
  const { data: postData, error: postError } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();
  
  if (!postError && postData) {
    p = postData;
    // 获取作者信息
    if (p.author_id) {
      const { data: authorData } = await supabase
        .from('users')
        .select('id, username, email, avatar_url')
        .eq('id', String(p.author_id))
        .single();
      author = authorData;
    }
  } else {
    // 如果 posts 表没有，尝试从 works 表获取
    const { data: workData, error: workError } = await supabase
      .from('works')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!workError && workData) {
      p = workData;
      // 获取作者信息（works 表可能使用不同的字段名）
      const authorId = p.creator_id || p.user_id || p.author_id;
      if (authorId) {
        const { data: authorData } = await supabase
          .from('users')
          .select('id, username, email, avatar_url')
          .eq('id', String(authorId))
          .single();
        author = authorData;
      }
    }
  }

  if (!p) return null;

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

  const authorData = author || p.author || {
        id: p.author_id || p.creator_id || p.user_id || 'unknown',
        username: p.creator || p.creator_name || '创作者',
        email: '',
        avatar: p.creator_avatar || ''
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
    videoUrl: p.video_url || p.videoUrl || undefined,
    type: p.type || 'image',
    likes: p.likes_count || 0,
    comments: comments,
    date: p.created_at ? (typeof p.created_at === 'string' ? p.created_at.split('T')[0] : new Date(p.created_at).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
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

  console.log('[getUserBookmarks] Called with userId:', userId);

  // 首先尝试从后端 API 获取收藏列表
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    try {
      console.log('[getUserBookmarks] Trying backend API...');
      const response = await fetch('/api/user/bookmarks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[getUserBookmarks] Backend API success:', result);
        if (result.data && Array.isArray(result.data)) {
          const workIds = result.data.map((work: any) => work.id?.toString()).filter(Boolean);
          console.log('[getUserBookmarks] Extracted workIds:', workIds);
          return workIds;
        }
        console.log('[getUserBookmarks] Backend API returned empty data');
        return [];
      } else {
        console.warn('[getUserBookmarks] Backend API failed:', response.status);
      }
    } catch (error) {
      console.warn('[getUserBookmarks] Backend API error:', error);
    }
  }

  // 如果后端 API 不可用，尝试从 Supabase 获取
  console.log('[getUserBookmarks] Trying Supabase...');
  const [worksBookmarks, postBookmarks] = await Promise.all([
    supabase.from('works_bookmarks').select('work_id').eq('user_id', userId),
    supabase.from('bookmarks').select('post_id').eq('user_id', userId)
  ]);

  const workIds = worksBookmarks.data?.map(d => d.work_id.toString()) || [];
  const postIds = postBookmarks.data?.map(d => d.post_id.toString()) || [];

  console.log('[getUserBookmarks] Supabase result:', { workIds, postIds });
  return [...workIds, ...postIds];
}

export async function getUserLikes(userId: string): Promise<string[]> {
  if (!userId || userId === 'current-user') return [];

  console.log('[getUserLikes] Called with userId:', userId);

  // 首先尝试从后端 API 获取点赞列表
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    try {
      console.log('[getUserLikes] Trying backend API...');
      const response = await fetch('/api/user/likes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[getUserLikes] Backend API success:', result);
        if (result.data && Array.isArray(result.data)) {
          const workIds = result.data.map((work: any) => work.id?.toString()).filter(Boolean);
          console.log('[getUserLikes] Extracted workIds:', workIds);
          return workIds;
        }
        console.log('[getUserLikes] Backend API returned empty data');
        return [];
      } else {
        console.warn('[getUserLikes] Backend API failed:', response.status);
      }
    } catch (error) {
      console.warn('[getUserLikes] Backend API error:', error);
    }
  }

  // 如果后端 API 不可用，尝试从 Supabase 获取
  console.log('[getUserLikes] Trying Supabase...');
  const [worksLikes, postLikes] = await Promise.all([
    supabase.from('works_likes').select('work_id').eq('user_id', userId),
    supabase.from('likes').select('post_id').eq('user_id', userId)
  ]);

  const workIds = worksLikes.data?.map(d => d.work_id.toString()) || [];
  const postIds = postLikes.data?.map(d => d.post_id.toString()) || [];

  console.log('[getUserLikes] Supabase result:', { workIds, postIds });
  return [...workIds, ...postIds];
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
    fileUrl = `https://placehold.co/800x600/3b82f6/ffffff?text=${encodeURIComponent(workData.title?.slice(0, 10) || '作品')}`;
  }

  // 判断是否为视频
  const isVideo = imageFile.type.startsWith('video/');

  // 2. Insert into DB
  // 对于视频，使用视频URL作为缩略图（视频播放器可以显示第一帧）
  // 或者使用带有作品标题的占位图
  const thumbnailUrl = isVideo ?
    fileUrl : // 视频直接使用视频URL作为缩略图，让视频播放器显示第一帧
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
  // 对于视频，使用视频URL作为缩略图（视频播放器可以显示第一帧）
  const thumbnailUrl = isVideo ?
    imageUrl : // 视频直接使用视频URL作为缩略图
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

// 下载外部图片并上传到新的存储服务
async function downloadAndUploadImage(imageUrl: string, userId: string): Promise<string | null> {
  try {
    // 如果已经是本地存储的链接，直接返回
    if (imageUrl.startsWith('/uploads/')) {
      console.log('[downloadAndUploadImage] Already local URL:', imageUrl);
      return imageUrl;
    }

    console.log('[downloadAndUploadImage] Downloading image:', imageUrl.substring(0, 100));

    // 尝试下载图片
    let blob: Blob | null = null;
    
    // 方法1: 直接 fetch（适用于没有 CORS 限制的图片）
    try {
      const response = await fetch(imageUrl, { 
        headers: { 'Accept': 'image/*' }
      });
      
      if (response.ok) {
        blob = await response.blob();
        if (blob.size > 0) {
          console.log('[downloadAndUploadImage] Direct fetch successful, blob size:', blob.size);
        } else {
          blob = null;
        }
      }
    } catch (directError) {
      console.log('[downloadAndUploadImage] Direct fetch failed:', directError);
    }
    
    // 方法2: 使用代理服务器（如果直接下载失败）
    if (!blob) {
      try {
        console.log('[downloadAndUploadImage] Trying proxy download...');
        const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(imageUrl)}`;
        const response = await fetch(proxyUrl);
        
        if (response.ok) {
          blob = await response.blob();
          if (blob.size > 0) {
            console.log('[downloadAndUploadImage] Proxy download successful, blob size:', blob.size);
          } else {
            blob = null;
          }
        }
      } catch (proxyError) {
        console.log('[downloadAndUploadImage] Proxy download failed:', proxyError);
      }
    }
    
    // 如果所有下载方法都失败，返回 null（而不是原始 URL）
    if (!blob || blob.size === 0) {
      console.error('[downloadAndUploadImage] All download methods failed');
      return null;
    }

    // 使用新的存储服务上传
    const folder = `works/${userId}`;
    const file = new File([blob], `${Date.now()}-${Math.random().toString(36).substring(7)}.png`, { type: blob.type || 'image/png' });
    
    try {
      const publicUrl = await uploadFile(file, folder);
      console.log('[downloadAndUploadImage] Uploaded successfully:', publicUrl);
      return publicUrl;
    } catch (uploadError) {
      console.error('[downloadAndUploadImage] Upload error:', uploadError);
      return null;
    }
  } catch (error) {
    console.error('[downloadAndUploadImage] Error:', error);
    // 任何错误都返回 null（而不是原始 URL）
    return null;
  }
}

// 使用后端API创建作品
async function createWorkViaBackend(p: Partial<Post>, currentUser: User): Promise<Post | undefined> {
  console.log('[createWorkViaBackend] Called with:', { 
    title: p.title, 
    category: p.category, 
    userId: currentUser.id,
    type: p.type,
    videoUrl: p.videoUrl?.substring(0, 50),
    hasVideoUrl: !!p.videoUrl
  });

  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('请先登录后再发布作品')
  }

  try {
    // ========== 自动内容审核 ==========
    const workId = crypto.randomUUID();
    console.log('[createWorkViaBackend] Starting content moderation...');
    
    const moderationResult = await contentModerationService.moderateContent(
      workId,
      'work',
      p.title || '',
      p.description,
      currentUser.id
    );

    console.log('[createWorkViaBackend] Moderation result:', moderationResult);

    // 如果审核未通过，抛出错误
    if (!moderationResult.approved) {
      const errorMessage = moderationResult.reason 
        ? `该内容包含违规信息，请修改后重新提交。原因：${moderationResult.reason}`
        : '该内容包含违规信息，请修改后重新提交';
      
      console.warn('[createWorkViaBackend] Content rejected by moderation:', moderationResult);
      throw new Error(errorMessage);
    }

    // 判断是否为视频 - 优先使用 p.type 字段或 videoUrl
    const isVideo = p.type === 'video' || p.videoUrl;
    console.log('[createWorkViaBackend] isVideo check:', { 
      isVideo, 
      p_type: p.type, 
      p_videoUrl: p.videoUrl?.substring(0, 50),
      hasVideoUrl: !!p.videoUrl,
      p_type_is_video: p.type === 'video'
    });

    // 处理缩略图：下载并上传到新的存储服务
    // 对于视频类型，如果没有缩略图但有视频URL，使用视频URL作为缩略图
    let thumbnail = p.thumbnail;
    if (!thumbnail && p.videoUrl && isVideo) {
      thumbnail = p.videoUrl;
      console.log('[createWorkViaBackend] Using video URL as thumbnail:', thumbnail);
    }

    // 如果缩略图是本地存储 URL，直接使用
    if (thumbnail && thumbnail.startsWith('/uploads/')) {
      console.log('[createWorkViaBackend] Thumbnail is already local URL:', thumbnail);
    } else if (thumbnail) {
      // 需要上传：可能是外部链接或旧的 Supabase URL（已无法访问）
      console.log('[createWorkViaBackend] Processing thumbnail...');
      try {
        const uploadedUrl = await downloadAndUploadImage(thumbnail, currentUser.id);
        if (uploadedUrl) {
          thumbnail = uploadedUrl;
          console.log('[createWorkViaBackend] Thumbnail uploaded to:', uploadedUrl);
        } else {
          console.error('[createWorkViaBackend] Failed to upload thumbnail');
          // 上传失败，使用内联 SVG 占位图
          thumbnail = generatePlaceholderSvg('Upload Failed', 600, 400, '#e5e7eb', '#9ca3af');
        }
      } catch (uploadError) {
        console.error('[createWorkViaBackend] Thumbnail upload error:', uploadError);
        // 上传失败，使用内联 SVG 占位图
        thumbnail = generatePlaceholderSvg('Upload Failed', 600, 400, '#e5e7eb', '#9ca3af');
      }
    }

    // 生成时间戳（秒级）
    const now = Math.floor(Date.now() / 1000);
    
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
      created_at: now,
      updated_at: now,
      status: 'published',
      visibility: 'public',
      published_at: now
    }
    
    // 如果有视频URL，添加到数据中
    if (p.videoUrl) {
      workData.video_url = p.videoUrl;
    }

    // 计算内容评分
    try {
      const scores = contentScoringService.calculateScores(
        p.description || '',
        p.title,
        p.description
      );
      workData.authenticity_score = scores.authenticity_score;
      workData.ai_risk_score = scores.ai_risk_score;
      workData.spam_score = scores.spam_score;
      workData.cultural_elements = scores.cultural_elements;
      console.log('[createWorkViaBackend] Content scores calculated:', scores);
    } catch (scoreError) {
      console.warn('[createWorkViaBackend] Failed to calculate content scores:', scoreError);
      // 评分失败不影响作品创建
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
      // 合并后端返回的数据和原始数据，确保 video_url 不会丢失
      const workWithVideo = {
        ...work,
        video_url: work.video_url || work.videoUrl || p.videoUrl
      };
      await syncWorkToSupabase(workWithVideo, currentUser)
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
export async function syncWorkToSupabase(work: any, currentUser: User): Promise<void> {
  try {
    // 检查是否有有效的Supabase会话
    const hasSession = await hasValidSupabaseSession()
    if (!hasSession) {
      console.log('[syncWorkToSupabase] No valid Supabase session, skipping sync');
      return
    }
    
    // 判断是否为视频
    const isVideo = work.type === 'video' || work.video_url || work.category === 'video';
    
    const now = Date.now();
    const insertData: any = {
      title: work.title,
      content: work.description,
      author_id: currentUser.id,
      user_id: currentUser.id,
      category: isVideo ? 'video' : work.category,
      images: work.thumbnail && !isVideo ? [work.thumbnail] : [],
      attachments: work.thumbnail ? [{ type: isVideo ? 'video' : 'image', url: work.thumbnail }] : [],
      status: 'published',
      created_at: work.created_at || now,
      updated_at: now,
      likes_count: 0,
      view_count: 0,
      comments_count: 0
    }
    
    // 如果有视频URL，添加到数据中（支持 video_url 和 videoUrl 两种字段名）
    const videoUrl = work.video_url || work.videoUrl;
    if (videoUrl) {
      insertData.video_url = videoUrl;
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

// 直接保存到 Supabase works 表（用于视频作品，避免后端 API 不保存 video_url 的问题）
async function addPostDirectToWorks(p: Partial<Post>, currentUser?: User): Promise<Post | undefined> {
  console.log('[addPostDirectToWorks] Called with:', {
    title: p.title,
    type: p.type,
    videoUrl: p.videoUrl?.substring(0, 50),
    userId: currentUser?.id
  });

  try {
    const supabaseUserId = await ensureSupabaseSessionUserId()
    const finalUserId = supabaseUserId || currentUser?.id;

    if (!finalUserId) {
      throw new Error('请先登录后再发布作品')
    }

    // ========== 自动内容审核 ==========
    const workId = crypto.randomUUID();
    console.log('[addPostDirectToWorks] Starting content moderation...');
    
    const moderationResult = await contentModerationService.moderateContent(
      workId,
      'work',
      p.title || '',
      p.description,
      finalUserId
    );

    console.log('[addPostDirectToWorks] Moderation result:', moderationResult);

    // 如果审核未通过，抛出错误
    if (!moderationResult.approved) {
      const errorMessage = moderationResult.reason 
        ? `该内容包含违规信息，请修改后重新提交。原因：${moderationResult.reason}`
        : '该内容包含违规信息，请修改后重新提交';
      
      console.warn('[addPostDirectToWorks] Content rejected by moderation:', moderationResult);
      throw new Error(errorMessage);
    }

    const isVideo = p.type === 'video' || p.videoUrl;
    const now = Date.now();
    
    // 构建插入数据，匹配 works 表结构
    const insertData: any = {
      id: workId,
      creator_id: finalUserId,
      title: p.title,
      description: p.description || '',
      type: isVideo ? 'video' : 'image',
      category: isVideo ? 'video' : (p.category || 'design'),
      status: 'published',
      visibility: 'public',
      created_at: now,
      updated_at: now,
      published_at: now,
      likes_count: 0,
      comments_count: 0,
      views: 0,
      votes: 0,
      is_featured: false,
      creator: currentUser?.username || 'User'
    };

    // 如果有视频URL，添加到数据中
    if (p.videoUrl) {
      insertData.video_url = p.videoUrl;
    }

    // 如果有缩略图，添加到 cover_url
    // 对于视频类型，如果没有缩略图但有视频URL，使用视频URL作为缩略图（显示第一帧）
    if (p.thumbnail) {
      insertData.cover_url = p.thumbnail;
    } else if (p.videoUrl && (p.type === 'video' || insertData.type === 'video')) {
      insertData.cover_url = p.videoUrl;
    }

    // 如果有标签，添加到 tags
    if (p.tags && p.tags.length > 0) {
      insertData.tags = p.tags;
    }

    // 计算内容评分
    try {
      const scores = contentScoringService.calculateScores(
        p.description || '',
        p.title,
        p.description
      );
      insertData.authenticity_score = scores.authenticity_score;
      insertData.ai_risk_score = scores.ai_risk_score;
      insertData.spam_score = scores.spam_score;
      insertData.cultural_elements = scores.cultural_elements;
      console.log('[addPostDirectToWorks] Content scores calculated:', scores);
    } catch (scoreError) {
      console.warn('[addPostDirectToWorks] Failed to calculate content scores:', scoreError);
      // 评分失败不影响作品创建
    }

    console.log('[addPostDirectToWorks] Inserting to works table:', {
      title: insertData.title,
      type: insertData.type,
      video_url: insertData.video_url?.substring(0, 50),
      hasVideoUrl: !!insertData.video_url
    });

    const { data, error } = await supabase
      .from('works')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[addPostDirectToWorks] Insert failed:', error);
      throw new Error(`保存到 works 表失败: ${error.message}`);
    }

    console.log('[addPostDirectToWorks] Success:', data);

    // 同步到 posts 表（用于广场展示）
    try {
      await syncWorkToSupabase({ ...insertData, id: data.id }, currentUser as User);
    } catch (syncError) {
      console.warn('[addPostDirectToWorks] Failed to sync to posts:', syncError);
    }

    // 返回 Post 对象
    return {
      id: data.id.toString(),
      title: data.title || 'Untitled',
      thumbnail: data.cover_url || p.thumbnail || '',
      videoUrl: data.video_url || p.videoUrl,
      type: data.type || 'image',
      likes: 0,
      comments: [],
      date: data.created_at ? new Date(data.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      author: {
        id: finalUserId,
        username: currentUser?.username || 'User',
        email: currentUser?.email || '',
        avatar: currentUser?.avatar || ''
      },
      isLiked: false,
      isBookmarked: false,
      category: (data.category as PostCategory) || 'other',
      tags: p.tags || [],
      description: data.description || '',
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
  } catch (error) {
    console.error('[addPostDirectToWorks] Error:', error);
    throw error;
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
    // 如果是视频作品，直接保存到 Supabase works 表，避免后端 API 不保存 video_url 的问题
    if (p.type === 'video' || p.videoUrl) {
      console.log('[addPost] Video post detected, saving directly to works table');
      return await addPostDirectToWorks(p, currentUser);
    }
    
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
      
      // 处理 schema cache 错误（如找不到列）- 尝试使用后端API作为fallback
      if (error.message.includes('schema cache') || error.message.includes('Could not find')) {
        console.log('[addPost] Supabase schema cache error, trying backend API as fallback');
        const backendToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (backendToken && currentUser?.id) {
          return await createWorkViaBackend(p, currentUser)
        }
        // 如果没有后端token，尝试不带category插入
        console.log('[addPost] Trying insert without category column');
        delete insertData.category;
        const { data: retryData, error: retryError } = await supabase
          .from('posts')
          .insert(insertData)
          .select()
          .single();
        
        if (!retryError && retryData) {
          console.log('[addPost] Insert without category succeeded');
          // 构建返回的 Post 对象
          const postDate = retryData.created_at ? new Date(retryData.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          return {
            ...p,
            id: retryData.id.toString(),
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
        
        throw new Error('发布作品失败，数据库结构不匹配，请稍后重试');
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
        const result = await response.json();
        console.log('[likePost] Backend API success:', result);
        return { id, isLiked: result.isLiked ?? true, likes: result.likes ?? 0 } as unknown as Post;
      } else if (response.status === 404) {
        // 后端 API 不存在，继续尝试 Supabase
        console.warn('[likePost] Backend API not found (404), trying Supabase...');
      } else {
        console.warn('[likePost] Backend API failed:', response.status);
        // 其他错误，继续尝试 Supabase
      }
    } catch (error) {
      console.warn('[likePost] Backend API error:', error);
    }
  }

  // 如果后端 API 不可用，尝试使用 Supabase
  console.log('[likePost] Trying Supabase...');

  // 获取 Supabase Auth 的用户ID（UUID格式）
  let supabaseUserId = userId;
  try {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (supabaseUser?.id) {
      supabaseUserId = supabaseUser.id;
      console.log('[likePost] Using Supabase Auth userId:', supabaseUserId);
    }
  } catch (e) {
    console.log('[likePost] Could not get Supabase user, using provided userId');
  }

  // 广场作品使用 works_likes 表（work_id 是 UUID 格式）
  // 社区帖子使用 likes 表（post_id 是 UUID 格式）
  // 优先尝试 works_likes 表（广场作品）

  // 1. 首先尝试插入到 works_likes 表（广场作品）
  console.log('[likePost] Trying works_likes table with:', { userId: supabaseUserId, work_id: id });
  const { data: insertData, error: worksLikeError } = await supabase
    .from('works_likes')
    .insert({
      user_id: supabaseUserId,
      work_id: id,
      created_at: new Date().toISOString()
    })
    .select();

  if (!worksLikeError) {
    console.log('[likePost] works_likes success, inserted:', insertData);
    return { id, isLiked: true, likes: 0 } as unknown as Post;
  }

  console.error('[likePost] works_likes error:', worksLikeError);

  if (worksLikeError.code === '23505') {
    // 已存在（23505 = unique_violation）
    console.log('[likePost] Already liked in works_likes (duplicate)');
    return { id, isLiked: true, likes: 0 } as unknown as Post;
  }

  // 2. 如果 work_likes 失败，尝试 likes 表（社区帖子）
  console.log('[likePost] Trying likes table for post...');
  const { error: postLikeError } = await supabase
    .from('likes')
    .insert({ 
      user_id: userId, 
      post_id: id,
      created_at: new Date().toISOString()
    });
  
  if (postLikeError && postLikeError.code !== '23505') {
    console.error('[likePost] Supabase error:', postLikeError);
    return undefined;
  }

  // 3. 更新 posts 表的 likes_count（仅对社区帖子）
  try {
    const { data: currentPost } = await supabase
      .from('posts')
      .select('likes_count')
      .eq('id', id)
      .single();
    
    if (currentPost) {
      const newLikesCount = (currentPost.likes_count || 0) + 1;
      
      await supabase
        .from('posts')
        .update({ likes_count: newLikesCount })
        .eq('id', id);

      console.log('[likePost] Post likes_count updated');
      return { id, isLiked: true, likes: newLikesCount } as unknown as Post;
    }
  } catch (e) {
    console.log('[likePost] Not a post, skipping likes_count update');
  }
  
  console.log('[likePost] Supabase success');
  return { id, isLiked: true, likes: 0 } as unknown as Post;
}

export async function unlikePost(id: string, userId: string): Promise<Post | undefined> {
  console.log('[unlikePost] Called with:', { id, userId });
  if (!userId || userId === 'anonymous') return undefined;

  // 获取 Supabase Auth 的用户ID（UUID格式）
  let supabaseUserId = userId;
  try {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (supabaseUser?.id) {
      supabaseUserId = supabaseUser.id;
      console.log('[unlikePost] Using Supabase Auth userId:', supabaseUserId);
    }
  } catch (e) {
    console.log('[unlikePost] Could not get Supabase user, using provided userId');
  }

  // 广场作品使用 works_likes 表，社区帖子使用 likes 表
  // 优先尝试 works_likes 表
  console.log('[unlikePost] Trying works_likes table...');
  const { error: worksUnlikeError } = await supabase
    .from('works_likes')
    .delete()
    .match({ user_id: supabaseUserId, work_id: id });

  if (!worksUnlikeError) {
    console.log('[unlikePost] work_likes success');
    return { id, isLiked: false } as unknown as Post;
  }

  // 如果 work_likes 失败，尝试 likes 表
  console.log('[unlikePost] Trying likes table...');
  const { error: postUnlikeError } = await supabase
    .from('likes')
    .delete()
    .match({ user_id: supabaseUserId, post_id: id });

  if (postUnlikeError) {
    console.error('[unlikePost] Error:', postUnlikeError);
    return undefined;
  }
  
  // 减少 likes_count (仅对社区帖子)
  try {
    const { data: currentPost } = await supabase
      .from('posts')
      .select('likes_count')
      .eq('id', id)
      .single();
    
    if (currentPost) {
      const newLikesCount = Math.max((currentPost.likes_count || 0) - 1, 0);
      
      await supabase
        .from('posts')
        .update({ likes_count: newLikesCount })
        .eq('id', id);
      console.log('[unlikePost] Post likes_count updated');
    }
  } catch (e) {
    console.log('[unlikePost] Not a post, skipping likes_count update');
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
        const result = await response.json();
        console.log('[bookmarkPost] Backend API success:', result);
        return { id, isBookmarked: result.isBookmarked ?? true } as unknown as Post;
      } else if (response.status === 404) {
        // 后端 API 不存在，继续尝试 Supabase
        console.warn('[bookmarkPost] Backend API not found (404), trying Supabase...');
      } else {
        console.warn('[bookmarkPost] Backend API failed:', response.status);
        // 其他错误，继续尝试 Supabase
      }
     } catch (error) {
       console.warn('[bookmarkPost] Backend API error:', error);
     }
   }

   // 如果后端 API 不可用，尝试使用 Supabase
   console.log('[bookmarkPost] Trying Supabase...');

   // 获取 Supabase Auth 的用户ID（UUID格式）
   let supabaseUserId = userId;
   try {
     const { data: { user: supabaseUser } } = await supabase.auth.getUser();
     if (supabaseUser?.id) {
       supabaseUserId = supabaseUser.id;
       console.log('[bookmarkPost] Using Supabase Auth userId:', supabaseUserId);
     }
   } catch (e) {
     console.log('[bookmarkPost] Could not get Supabase user, using provided userId');
   }

   // 广场作品使用 works_bookmarks 表，社区帖子使用 bookmarks 表
   // 优先尝试 works_bookmarks 表
   console.log('[bookmarkPost] Trying works_bookmarks table with:', { userId: supabaseUserId, work_id: id });
   const { data: insertData, error: worksBookmarkError } = await supabase
     .from('works_bookmarks')
     .insert({
       user_id: supabaseUserId,
       work_id: id,
       created_at: new Date().toISOString()
     })
     .select();

   if (!worksBookmarkError) {
     console.log('[bookmarkPost] works_bookmarks success, inserted:', insertData);
     return { id, isBookmarked: true } as unknown as Post;
   }

   console.error('[bookmarkPost] works_bookmarks error:', worksBookmarkError);

   if (worksBookmarkError.code === '23505') {
     console.log('[bookmarkPost] Already bookmarked in works_bookmarks (duplicate)');
     return { id, isBookmarked: true } as unknown as Post;
   }
   
   // 如果 work_favorites 失败，尝试 bookmarks 表（社区帖子）
   console.log('[bookmarkPost] Trying bookmarks table for post...');
   const { error: postBookmarkError } = await supabase
     .from('bookmarks')
     .insert({
       user_id: supabaseUserId,
       post_id: id,
       created_at: new Date().toISOString()
     });
   
   if (postBookmarkError) {
     console.error('[bookmarkPost] Supabase error:', postBookmarkError);
     if (postBookmarkError.code === '23505') {
       console.log('[bookmarkPost] Already bookmarked in bookmarks (duplicate)');
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

   // 获取 Supabase Auth 的用户ID（UUID格式）
   let supabaseUserId = userId;
   try {
     const { data: { user: supabaseUser } } = await supabase.auth.getUser();
     if (supabaseUser?.id) {
       supabaseUserId = supabaseUser.id;
       console.log('[unbookmarkPost] Using Supabase Auth userId:', supabaseUserId);
     }
   } catch (e) {
     console.log('[unbookmarkPost] Could not get Supabase user, using provided userId');
   }

   // 广场作品使用 works_bookmarks 表，社区帖子使用 bookmarks 表
   // 优先尝试 works_bookmarks 表
   console.log('[unbookmarkPost] Trying works_bookmarks table...');
   const { error: worksUnbookmarkError } = await supabase
     .from('works_bookmarks')
     .delete()
     .match({ user_id: supabaseUserId, work_id: id });

   if (!worksUnbookmarkError) {
     console.log('[unbookmarkPost] work_favorites success');
     return { id, isBookmarked: false } as unknown as Post;
   }

   // 如果 work_favorites 失败，尝试 bookmarks 表
   console.log('[unbookmarkPost] Trying bookmarks table...');
   const { error: postUnbookmarkError } = await supabase
     .from('bookmarks')
     .delete()
     .match({ user_id: supabaseUserId, post_id: id });
   
   if (postUnbookmarkError) {
     console.error('[unbookmarkPost] Error:', postUnbookmarkError);
     return undefined;
   }

   console.log('[unbookmarkPost] Success');
   return { id, isBookmarked: false } as unknown as Post;
}

// 获取作品评论列表
export async function getWorkComments(workId: string): Promise<Comment[]> {
  console.log('[getWorkComments] Called with:', workId);

  // 直接使用 Supabase 获取评论
  try {
    const { data, error } = await supabase
      .from('work_comments')
      .select('*')
      .eq('work_id', workId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getWorkComments] Supabase error:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // 获取所有评论的用户信息
    const userIds = [...new Set(data.map(c => c.user_id).filter(Boolean))];
    const { data: users } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .in('id', userIds);

    const userMap = new Map(users?.map(u => [u.id, u]) || []);

    return data.map((c: any) => {
      const user = userMap.get(c.user_id);
      return {
        id: c.id.toString(),
        content: c.content,
        date: typeof c.created_at === 'string' ? c.created_at : new Date(c.created_at).toISOString(),
        author: user?.username || '用户',
        authorAvatar: user?.avatar_url || '',
        likes: c.likes_count || 0,
        reactions: {},
        replies: [],
        userId: c.user_id,
        userReactions: [],
        parentId: c.parent_id,
        images: c.images || []
      };
    });
  } catch (error) {
    console.error('[getWorkComments] Error:', error);
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

// 上传评论图片到存储服务
async function uploadCommentImage(file: File, userId: string): Promise<string> {
  try {
    // 使用新的存储服务上传
    const folder = `works/${userId}`;
    const publicUrl = await uploadFile(file, folder);
    console.log('[uploadCommentImage] Uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error: any) {
    console.error('Upload comment image failed:', error);
    throw new Error('图片上传失败: ' + (error.message || '未知错误'));
  }
}

export async function addComment(
  postId: string,
  content: string,
  parentId?: string,
  user?: User,
  images?: File[]
): Promise<Post | undefined> {
  if (!user?.id) {
    console.error('[addComment] No user provided');
    throw new Error('请先登录后再评论');
  }

  console.log('[addComment] Called with:', { postId, content, userId: user.id, imageCount: images?.length });

  // 上传图片（如果有）
  let imageUrls: string[] = [];
  if (images && images.length > 0) {
    try {
      imageUrls = await Promise.all(
        images.map(file => uploadCommentImage(file, user.id))
      );
      console.log('[addComment] Images uploaded:', imageUrls);
    } catch (error: any) {
      console.error('[addComment] Image upload failed:', error);
      throw new Error('图片上传失败: ' + error.message);
    }
  }

  // 直接使用 Supabase 添加评论
  try {
    const result = await supabase
      .from('work_comments')
      .insert({
        work_id: postId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId || null,
        likes_count: 0,
        images: imageUrls,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (result.error) {
      console.error('[addComment] Supabase error:', result.error);
      throw new Error('评论失败: ' + result.error.message);
    }

    console.log('[addComment] Success via Supabase');
    return { id: postId } as unknown as Post;
  } catch (error: any) {
    console.error('[addComment] Supabase error:', error);
    throw new Error('评论失败: ' + (error.message || '网络错误'));
  }
}


// Stub other functions
export async function getAuthorById(userIdOrUsername: string): Promise<User | null> {
  // 首先尝试获取当前登录用户的信息（从 Supabase auth）
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  console.log('[getAuthorById] userIdOrUsername:', userIdOrUsername, 'currentUser?.id:', currentUser?.id)
  console.log('[getAuthorById] user_metadata:', JSON.stringify(currentUser?.user_metadata))
  
  // 判断传入的是 UUID 还是用户名
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdOrUsername)
  console.log('[getAuthorById] isUUID:', isUUID)
  
  // 用于存储实际的用户ID（如果是用户名查询，会转换为ID）
  let actualUserId = userIdOrUsername
  
  if (currentUser && (currentUser.id === userIdOrUsername || currentUser.user_metadata?.username === userIdOrUsername)) {
    // 如果是当前登录用户，先尝试从后端 API 获取完整数据
    console.log('[getAuthorById] Current user, trying API first')
    try {
      const response = await fetch(`/api/users/${actualUserId}`)
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
            bio: data.bio || '',
            coverImage: data.cover_image || '',
            location: data.location || '',
            website: data.website || '',
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
    
    // 如果 API 失败，尝试从 Supabase 数据库获取用户数据
    console.log('[getAuthorById] API failed for current user, trying Supabase database')
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_user_profile', { p_user_id: currentUser.id })
      
      if (!rpcError && rpcData && rpcData.length > 0) {
        const userData = rpcData[0]
        console.log('[getAuthorById] Got current user from RPC:', userData)
        return {
          id: userData.id,
          username: userData.username || 'User',
          email: userData.email || '',
          avatar: userData.avatar_url || '',
          coverImage: userData.cover_image || '',
          bio: userData.bio || '',
          location: userData.location || '',
          website: userData.website || '',
          occupation: userData.occupation || ''
        }
      }
    } catch (rpcErr) {
      console.log('[getAuthorById] RPC failed for current user:', rpcErr)
    }
    
    // 最后使用 Supabase auth 的数据（基本数据）
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
    // 如果是用户名而非 UUID，先尝试通过用户名查询
    if (!isUUID) {
      console.log('[getAuthorById] Input is username, trying to find user by username first')
      
      // 先尝试通过 Supabase 查询用户名
      const { data: userByUsername, error: usernameError } = await supabase
        .from('users')
        .select('id, username, email, avatar_url, cover_image, bio, location, website, occupation')
        .eq('username', userIdOrUsername)
        .single()
      
      if (!usernameError && userByUsername) {
        console.log('[getAuthorById] Found user by username:', userByUsername)
        // 获取到用户ID后，继续用ID获取完整数据
        actualUserId = userByUsername.id
      } else {
        console.log('[getAuthorById] User not found by username, trying as ID anyway')
      }
    }
    
    const response = await fetch(`/api/users/${userIdOrUsername}`)
    if (!response.ok) {
      console.error('[getAuthorById] API error:', response.status)
      // 如果 API 返回 404，尝试从 Supabase 获取用户数据
      if (response.status === 404) {
        console.log('[getAuthorById] Trying to get user from Supabase users table')
        
        // 首先尝试使用 RPC 函数获取完整用户资料
        try {
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_user_profile', { p_user_id: actualUserId })
          
          if (!rpcError && rpcData && rpcData.length > 0) {
            const userData = rpcData[0]
            console.log('[getAuthorById] Got user from RPC:', userData)
            return {
              id: userData.id,
              username: userData.username || 'User',
              email: userData.email || '',
              avatar: userData.avatar_url || '',
              coverImage: userData.cover_image || '',
              bio: userData.bio || '',
              location: userData.location || '',
              website: userData.website || '',
              occupation: userData.occupation || ''
            }
          }
        } catch (rpcErr) {
          console.log('[getAuthorById] RPC failed, falling back to direct query:', rpcErr)
        }
        
        // RPC 失败，使用直接查询 - 同时支持 ID 和 username 查询
        let query = supabase
          .from('users')
          .select('id, username, email, avatar_url, cover_image, bio, location, website, occupation')
        
        if (isUUID) {
           query = query.eq('id', actualUserId)
         } else {
           query = query.eq('username', userIdOrUsername)
         }
        
        const { data: userData, error: userError } = await query.single()
        
        if (!userError && userData) {
          console.log('[getAuthorById] Got user from Supabase:', userData)
          return {
            id: userData.id,
            username: userData.username || 'User',
            email: userData.email || '',
            avatar: userData.avatar_url || '',
            coverImage: userData.cover_image || '',
            bio: userData.bio || '',
            location: userData.location || '',
            website: userData.website || '',
            occupation: userData.occupation || ''
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
      bio: data.bio || '',
      coverImage: data.coverImage || data.cover_image || '',
      location: data.location || '',
      website: data.website || '',
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
      } else {
        console.log(`[replyToComment] Backend API returned ${response.status}, trying Supabase`);
      }
    } catch (error) {
      console.warn('[replyToComment] Backend API error:', error);
    }
  }

  // 直接使用 Supabase 添加回复
  try {
    const result = await supabase
      .from('work_comments')
      .insert({
        work_id: postId,
        user_id: userId,
        content: content.trim(),
        parent_id: commentId,
        likes_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (!result.error) {
      return true;
    }
    
    console.error('[replyToComment] work_comments failed:', result.error);
    return false;
  } catch (error) {
    console.error('[replyToComment] Error:', error);
    return false;
  }
}

export async function deletePost(id: string): Promise<boolean> {
  console.log('[deletePost] Deleting work/post:', id);
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  if (!token) {
    console.error('[deletePost] No token found');
    return false;
  }
  
  let success = false;
  
  // 1. 从 Supabase works 表删除
  console.log('[deletePost] Deleting from Supabase works...');
  try {
    const { error } = await supabase
      .from('works')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[deletePost] Supabase works error:', error);
    } else {
      console.log('[deletePost] Supabase works success');
      success = true;
    }
  } catch (supabaseError) {
    console.error('[deletePost] Supabase works exception:', supabaseError);
  }
  
  // 2. 从后端 PostgreSQL works 表删除
  console.log('[deletePost] Deleting from backend PostgreSQL...');
  try {
    const response = await fetch(`/api/works/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('[deletePost] Backend API success:', result);
      success = true;
    } else if (response.status === 404) {
      console.log('[deletePost] Backend API returned 404, work not found in backend');
    } else {
      console.warn('[deletePost] Backend API failed:', response.status);
      const errorText = await response.text();
      console.warn('[deletePost] Error response:', errorText);
    }
  } catch (error) {
    console.warn('[deletePost] Backend API error:', error);
  }
  
  // 3. 同时尝试从 Supabase posts 表删除（兼容旧数据）
  console.log('[deletePost] Also trying Supabase posts...');
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.log('[deletePost] Supabase posts error (may not exist):', error);
    } else {
      console.log('[deletePost] Supabase posts success');
    }
  } catch (postsError) {
    console.log('[deletePost] Supabase posts exception:', postsError);
  }
  
  return success;
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
    date: p.created_at ? (typeof p.created_at === 'string' ? p.created_at.split('T')[0] : new Date(p.created_at).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
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
    views: work.view_count || 0,
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

  try {
    // 构建请求头，如果有 token 则添加，否则也允许未登录用户记录浏览量
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/${type}/${itemId}/view`, {
      method: 'POST',
      headers
    });

    if (response.ok) {
      const result = await response.json();
      if (result.code === 0) {
        // 记录浏览时间
        localStorage.setItem(viewKey, now.toString());
        console.log('[recordView] View recorded successfully');
        return true;
      }
    } else {
      console.warn('[recordView] API returned error:', response.status);
    }
  } catch (error) {
    console.warn('[recordView] Backend API error:', error);
  }

  return false;
}

// ==================== 广场推广集成 ====================

// 推广作品接口
export interface PromotedPost {
  id: string;
  work_type: 'normal' | 'promoted';
  title: string;
  thumbnail: string;
  video_url?: string;
  creator_id: string;
  creator_username: string;
  creator_avatar?: string;
  views: number;
  likes: number;
  comments: number;
  created_at: string;
  is_promoted: boolean;
  promoted_work_id?: string;
  package_type?: string;
  promotion_weight?: number;
}

/**
 * 获取广场作品列表（包含推广作品）
 * @param limit 每页数量
 * @param offset 偏移量
 * @param userId 当前用户ID（用于排除自己的推广）
 */
export async function getSquareWorksWithPromotion(
  limit: number = 20,
  offset: number = 0,
  userId?: string
): Promise<PromotedPost[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_square_works_with_promotion', {
        p_limit: limit,
        p_offset: offset,
        p_user_id: userId || null
      });

    if (error) {
      console.warn('获取广场作品（含推广）失败:', error);
      // 降级：返回普通作品
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      work_type: item.work_type,
      title: item.title,
      thumbnail: item.thumbnail,
      video_url: item.video_url,
      creator_id: item.creator_id,
      creator_username: item.creator_username,
      creator_avatar: item.creator_avatar,
      views: item.views,
      likes: item.likes,
      comments: item.comments,
      created_at: item.created_at,
      is_promoted: item.is_promoted,
      promoted_work_id: item.promoted_work_id,
      package_type: item.package_type,
      promotion_weight: item.promotion_weight
    }));
  } catch (err) {
    console.error('获取广场作品（含推广）失败:', err);
    return [];
  }
}

/**
 * 记录推广作品曝光（用户真正看到时调用）
 * @param promotedWorkId 推广作品ID
 * @param viewerId 观看者ID
 */
export async function recordPromotionView(
  promotedWorkId: string,
  viewerId?: string
): Promise<boolean> {
  console.log('recordPromotionView called:', { promotedWorkId, viewerId });
  try {
    const { data, error } = await supabase
      .rpc('record_promotion_view', {
        p_promoted_work_id: promotedWorkId,
        p_viewer_id: viewerId || null
      });

    console.log('recordPromotionView result:', { data, error });

    if (error) {
      console.warn('记录推广曝光失败:', error);
      return false;
    }

    return data === true;
  } catch (err) {
    console.error('记录推广曝光失败:', err);
    return false;
  }
}

/**
 * 记录推广作品点击
 * @param promotedWorkId 推广作品ID
 * @param viewerId 点击者ID
 */
export async function recordPromotionClick(
  promotedWorkId: string,
  viewerId?: string
): Promise<boolean> {
  console.log('recordPromotionClick called:', { promotedWorkId, viewerId });
  try {
    const { data, error } = await supabase
      .rpc('record_promotion_click', {
        p_promoted_work_id: promotedWorkId,
        p_viewer_id: viewerId || null
      });

    console.log('recordPromotionClick result:', { data, error });

    if (error) {
      console.warn('记录推广点击失败:', error);
      return false;
    }

    return data === true;
  } catch (err) {
    console.error('记录推广点击失败:', err);
    return false;
  }
}

// 将 PromotedPost 转换为 Post 格式
export function convertPromotedPostToPost(promotedPost: PromotedPost): Post {
  return {
    id: promotedPost.id,
    title: promotedPost.title,
    thumbnail: promotedPost.thumbnail,
    videoUrl: promotedPost.video_url,
    type: promotedPost.video_url ? 'video' : 'image',
    likes: promotedPost.likes,
    comments: [],
    date: new Date(promotedPost.created_at).toISOString().split('T')[0],
    author: {
      id: promotedPost.creator_id,
      username: promotedPost.creator_username,
      email: '',
      avatar: promotedPost.creator_avatar
    },
    isLiked: false,
    isBookmarked: false,
    category: 'other',
    tags: promotedPost.is_promoted ? ['推广'] : [],
    description: promotedPost.is_promoted ? '【推广作品】' : '',
    views: promotedPost.views,
    shares: 0,
    isFeatured: promotedPost.is_promoted,
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
    commentCount: promotedPost.comments,
    engagementRate: 0,
    trendingScore: promotedPost.promotion_weight || 0,
    reach: 0,
    moderator: null,
    reviewedAt: null,
    recommendationScore: promotedPost.is_promoted ? 100 : 0,
    recommendedFor: promotedPost.is_promoted ? ['推广'] : [],
    // 推广相关字段
    _isPromoted: promotedPost.is_promoted,
    _promotedWorkId: promotedPost.promoted_work_id,
    _packageType: promotedPost.package_type
  };
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
  recordView,
  // 广场推广集成
  getSquareWorksWithPromotion,
  recordPromotionView,
  recordPromotionClick,
  convertPromotedPostToPost
};
