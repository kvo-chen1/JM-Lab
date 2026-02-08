// 津脉社区 API 工具函数
import { supabase } from './supabase'
import type { PostWithAuthor, UserProfile, CommentWithAuthor } from './supabase'

/**
 * 获取帖子列表
 * @param page 页码
 * @param limit 每页数量
 * @param category 分类筛选
 * @param sort 排序方式
 * @param searchTerm 搜索关键词
 */
export async function getPosts(
  page: number = 1,
  limit: number = 20,
  category?: string,
  sort: 'hot' | 'new' = 'new',
  searchTerm?: string
): Promise<{ posts: PostWithAuthor[]; total: number }> {
  try {
    // 不使用嵌套查询，避免类型不匹配
    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('status', 'published')

    // 搜索逻辑
    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
    }

    // 分类筛选
    if (category && category !== 'all') {
      // 假设 category 字段存储的是字符串，如果有多选可能需要 contains
      // 这里假设是精确匹配，如果是 tag 可能需要其他方式
      // mock 数据中是 category 字段
      // 实际数据库结构需确认，这里先用 ilike 模糊匹配或 eq
       query = query.eq('category', category)
    }

    // 排序逻辑
    if (sort === 'hot') {
      query = query.order('view_count', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // 分页
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('获取帖子列表失败:', error)
      throw error
    }

    // 获取统计信息
    const postsWithStats = await Promise.all(
      (data || []).map(async (post) => {
        const [likesCount, commentsCount] = await Promise.all([
          getPostLikesCount(post.id),
          getPostCommentsCount(post.id)
        ])

        return {
          ...post,
          likes_count: likesCount,
          comments_count: commentsCount,
          author: post.author as UserProfile
        }
      })
    )

    return {
      posts: postsWithStats,
      total: count || 0
    }
  } catch (error) {
    console.error('获取帖子列表错误:', error)
    // 发生错误时，返回空数组
    return {
      posts: [],
      total: 0
    }
  }
}

/**
 * 获取单个帖子详情
 * @param postId 帖子ID
 */
export async function getPostById(postId: string): Promise<PostWithAuthor | null> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *
      `)
      .eq('id', postId)
      .single()

    if (error) {
      console.error('获取帖子详情失败:', error)
      throw error
    }

    if (!data) return null

    // 获取作者信息
    let author = null;
    if (data.author_id) {
      const { data: authorData } = await supabase
        .from('users')
        .select('id, username, avatar_url, bio, is_verified, created_at')
        .eq('id', String(data.author_id))
        .single();
      author = authorData;
    }

    // 获取统计信息
    const [likesCount, commentsCount] = await Promise.all([
      getPostLikesCount(postId),
      getPostCommentsCount(postId)
    ])

    return {
      ...data,
      likes_count: likesCount,
      comments_count: commentsCount,
      author: author as UserProfile
    }
  } catch (error) {
    console.error('获取帖子详情错误:', error)
    return null
  }
}

/**
 * 获取用户资料
 * @param userId 用户ID或用户名
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    let { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    // 如果通过ID查询失败，尝试通过用户名查询
    if (error || !data) {
      const { data: userByUsername, error: usernameError } = await supabase
        .from('users')
        .select('*')
        .eq('username', userId)
        .single()

      if (usernameError && usernameError.code !== 'PGRST116') {
        console.error('通过用户名获取用户资料失败:', usernameError)
        throw usernameError
      }
      
      data = userByUsername
    }

    if (!data) {
      // 如果数据库中没有找到用户，返回null而不是模拟数据
      console.warn(`未找到用户: ${userId}`)
      return null
    }

    // 获取统计信息
    const [followersCount, followingCount, postsCount] = await Promise.all([
      getUserFollowersCount(data.id),
      getUserFollowingCount(data.id),
      getUserPostsCount(data.id)
    ])

    return {
      ...data,
      followers_count: followersCount,
      following_count: followingCount,
      posts_count: postsCount
    }
  } catch (error) {
    console.error('获取用户资料错误:', error)
    // 发生错误时，返回null而不是模拟数据
    return null
  }
}

/**
 * 获取用户的帖子
 * @param userId 用户ID或用户名
 * @param page 页码
 * @param limit 每页数量
 */
export async function getUserPosts(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ posts: PostWithAuthor[]; total: number }> {
  try {
    let actualUserId = userId
    
    // 检查是否是用户名而不是ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', userId)
      .single()
    
    if (user) {
      actualUserId = user.id
    }
    
    // 不使用嵌套查询，避免类型不匹配
    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('author_id', actualUserId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    // 分页
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('获取用户帖子失败:', error)
      throw error
    }

    // 如果没有找到帖子，返回空数组
    if (!data || data.length === 0) {
      console.warn(`未找到用户 ${userId} 的帖子`)
      return {
        posts: [],
        total: 0
      }
    }

    // 获取统计信息
    const postsWithStats = await Promise.all(
      (data || []).map(async (post) => {
        const [likesCount, commentsCount] = await Promise.all([
          getPostLikesCount(post.id),
          getPostCommentsCount(post.id)
        ])

        return {
          ...post,
          likes_count: likesCount,
          comments_count: commentsCount,
          author: post.author as UserProfile
        }
      })
    )

    return {
      posts: postsWithStats,
      total: count || 0
    }
  } catch (error) {
    console.error('获取用户帖子错误:', error)
    
    // 发生错误时，返回空数组
    return {
      posts: [],
      total: 0
    }
  }
}

/**
 * 点赞/取消点赞
 * @param postId 帖子ID
 * @param action 操作类型
 */
export async function toggleLike(postId: string, action: 'like' | 'unlike'): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('用户未登录')
      return false
    }

    if (action === 'like') {
      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: user.id,
          post_id: postId
        })

      if (error) {
        console.error('点赞失败:', error)
        return false
      }
    } else {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId)

      if (error) {
        console.error('取消点赞失败:', error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('点赞操作错误:', error)
    return false
  }
}

/**
 * 关注/取消关注
 * @param targetUserId 目标用户ID
 * @param action 操作类型
 */
export async function toggleFollow(targetUserId: string, action: 'follow' | 'unfollow'): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('用户未登录')
      return false
    }

    if (user.id === targetUserId) {
      console.error('不能关注自己')
      return false
    }

    if (action === 'follow') {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId
        })

      if (error) {
        console.error('关注失败:', error)
        return false
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)

      if (error) {
        console.error('取消关注失败:', error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('关注操作错误:', error)
    return false
  }
}

/**
 * 获取帖子的评论
 * @param postId 帖子ID
 */
export async function getPostComments(postId: string): Promise<CommentWithAuthor[]> {
  try {
    // 优先使用后端 API 获取评论
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (token) {
      try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.code === 0 && Array.isArray(result.data)) {
            console.log('[getPostComments] Fetched from backend API:', result.data.length);
            return result.data.map((comment: any) => ({
              ...comment,
              author: {
                id: comment.user_id,
                username: comment.author_name || `用户${comment.user_id?.slice(-4) || '未知'}`,
                avatar_url: comment.author_avatar || `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=默认用户头像，简洁现代风格&image_size=square`,
                bio: null,
                is_verified: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                metadata: {}
              }
            }));
          }
        }
      } catch (apiError) {
        console.warn('[getPostComments] Backend API failed, falling back to Supabase:', apiError);
      }
    }
    
    // 回退到 Supabase
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('获取评论失败:', error)
      throw error
    }

    // 获取所有评论作者信息
    const authorIds = [...new Set((data || []).map(c => c.user_id || c.author_id).filter(Boolean))];
    const authorsMap = new Map();
    
    if (authorIds.length > 0) {
      const { data: authorsData } = await supabase
        .from('users')
        .select('id, username, avatar_url, bio, is_verified, created_at')
        .in('id', authorIds.map(id => String(id)));
      
      if (authorsData) {
        authorsData.forEach(author => {
          authorsMap.set(author.id, author);
        });
      }
    }

    // 处理评论数据，确保每个评论都有完整的作者信息
    return (data || []).map((comment) => {
      let authorInfo: UserProfile;
      const userId = comment.user_id || comment.author_id;
      
      const author = authorsMap.get(String(userId));
      if (author) {
        authorInfo = author as UserProfile;
      } else if (userId) {
        // 如果作者信息不存在但有user_id，使用默认信息
        authorInfo = {
          id: userId,
          username: `用户${userId.slice(-4)}`,
          avatar_url: `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=默认用户头像，简洁现代风格&image_size=square`,
          bio: null,
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {}
        } as UserProfile;
      } else {
        // 如果没有user_id，使用完全默认的信息
        const randomId = Math.floor(Math.random() * 10000);
        authorInfo = {
          id: `unknown-${Date.now()}`,
          username: `用户${randomId}`,
          avatar_url: `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=默认用户头像，简洁现代风格&image_size=square`,
          bio: null,
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {}
        } as UserProfile;
      }
      
      return {
        ...comment,
        author: authorInfo
      };
    });
  } catch (error) {
    console.error('获取评论错误:', error)
    return []
  }
}

/**
 * 发表评论
 * @param postId 帖子ID
 * @param content 评论内容
 * @param parentId 父评论ID（可选）
 */
export async function createComment(
  postId: string,
  content: string,
  parentId?: string
): Promise<CommentWithAuthor | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('用户未登录')
      return null
    }

    // 插入评论（不使用嵌套查询，避免类型不匹配）
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        content,
        parent_id: parentId || null
      })
      .select('*')
      .single()

    if (error) {
      console.error('发表评论失败:', error)
      throw error
    }

    return {
      ...data,
      author: data.author as UserProfile || {
        id: user.id,
        username: user.email.split('@')[0],
        avatar_url: `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=默认用户头像，简洁现代风格&image_size=square`,
        bio: null,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {}
      }
    }
  } catch (error) {
    console.error('发表评论错误:', error)
    return null
  }
}

// 辅助函数：获取统计信息
async function getPostLikesCount(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)

  if (error) {
    console.error('获取点赞数失败:', error)
    return 0
  }

  return count || 0
}

async function getPostCommentsCount(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)

  if (error) {
    console.error('获取评论数失败:', error)
    return 0
  }

  return count || 0
}

async function getUserFollowersCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId)

  if (error) {
    console.error('获取粉丝数失败:', error)
    return 0
  }

  return count || 0
}

async function getUserFollowingCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId)

  if (error) {
    console.error('获取关注数失败:', error)
    return 0
  }

  return count || 0
}

async function getUserPostsCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', userId)
    .eq('status', 'published')

  if (error) {
    console.error('获取用户帖子数失败:', error)
    return 0
  }

  return count || 0
}

/**
 * 检查用户是否点赞了帖子
 * @param postId 帖子ID
 */
export async function checkUserLikedPost(postId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return false

    const { data, error } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('检查点赞状态失败:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('检查点赞状态错误:', error)
    return false
  }
}

/**
 * 检查用户是否关注了目标用户
 * @param currentUserId 当前用户ID
 * @param targetUserId 目标用户ID或用户名
 */
export async function checkUserFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
  try {
    if (!currentUserId) {
      console.log('[checkUserFollowing] 当前用户ID为空')
      return false
    }
    
    let actualTargetId = targetUserId
    
    // 检查是否是用户名而不是ID
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', targetUserId)
      .single()
    
    if (targetUser) {
      actualTargetId = targetUser.id
    }

    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', currentUserId)
      .eq('following_id', actualTargetId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('检查关注状态失败:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('检查关注状态错误:', error)
    return false
  }
}
