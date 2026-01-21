// 创作者社区 API 工具函数
import { supabase } from './supabase'
import type { PostWithAuthor, UserProfile, CommentWithAuthor } from './supabase'
import { mockWorks } from '@/mock/works'

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
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(
          id, username, avatar_url, bio, is_verified, created_at
        )
      `, { count: 'exact' })
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
    console.error('获取帖子列表错误，启用模拟数据回退:', error)
    const filtered = mockWorks.filter(w => {
      if (!category || category === 'all') return true
      return (w.category || '').toLowerCase() === category.toLowerCase()
    })
    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'hot') {
        return (b.views ?? 0) - (a.views ?? 0) || (b.likes ?? 0) - (a.likes ?? 0)
      }
      return (b.id ?? 0) - (a.id ?? 0)
    })
    const start = (page - 1) * limit
    const end = start + limit
    const slice = sorted.slice(start, end)

    const posts: PostWithAuthor[] = slice.map(w => {
      const author: UserProfile = {
        id: `mock-user-${w.creator || 'unknown'}`,
        email: `${(w.creator || 'user').replace(/\s+/g, '').toLowerCase()}@example.com`,
        username: w.creator || '创作者',
        avatar_url: (w.creatorAvatar as any) || null,
        bio: w.description || null,
        is_verified: !!w.featured,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        followers_count: Math.floor((w.views ?? 0) / 10),
        following_count: 0,
        posts_count: 1,
        is_following: false
      }
      return {
        id: String(w.id),
        author_id: author.id,
        title: w.title,
        content: w.description || '',
        attachments: [],
        status: 'published',
        view_count: w.views ?? 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author,
        likes_count: w.likes ?? 0,
        comments_count: (w as any).comments ?? 0,
        is_liked: false
      }
    })

    return { posts, total: filtered.length }
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
        *,
        author:users!posts_author_id_fkey(
          id, username, avatar_url, bio, is_verified, created_at
        )
      `)
      .eq('id', postId)
      .single()

    if (error) {
      console.error('获取帖子详情失败:', error)
      throw error
    }

    if (!data) return null

    // 获取统计信息
    const [likesCount, commentsCount] = await Promise.all([
      getPostLikesCount(postId),
      getPostCommentsCount(postId)
    ])

    return {
      ...data,
      likes_count: likesCount,
      comments_count: commentsCount,
      author: data.author as UserProfile
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
      // 如果数据库中没有找到用户，返回模拟数据
      console.warn(`未找到用户: ${userId}，使用模拟数据`)
      
      // 创建模拟用户数据
      const mockUser: UserProfile = {
        id: `mock-user-${userId}`,
        email: `${userId.replace(/\s+/g, '').toLowerCase()}@example.com`,
        username: userId,
        avatar_url: `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=创作者${userId}的头像，简洁现代风格&image_size=square`,
        bio: `这是${userId}的个人简介，来自模拟数据。`,
        is_verified: false,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        followers_count: Math.floor(Math.random() * 1000),
        following_count: Math.floor(Math.random() * 500),
        posts_count: Math.floor(Math.random() * 100),
        is_following: false
      }
      
      return mockUser
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
    
    // 发生错误时，返回模拟数据作为回退
    const mockUser: UserProfile = {
      id: `mock-user-${userId}`,
      email: `${userId.replace(/\s+/g, '').toLowerCase()}@example.com`,
      username: userId,
      avatar_url: `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=创作者${userId}的头像，简洁现代风格&image_size=square`,
      bio: `这是${userId}的个人简介，来自模拟数据。`,
      is_verified: false,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      followers_count: Math.floor(Math.random() * 1000),
      following_count: Math.floor(Math.random() * 500),
      posts_count: Math.floor(Math.random() * 100),
      is_following: false
    }
    
    return mockUser
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
    
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(
          id, username, avatar_url, bio, is_verified, created_at
        )
      `, { count: 'exact' })
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

    // 如果没有找到帖子，返回模拟数据
    if (!data || data.length === 0) {
      console.warn(`未找到用户 ${userId} 的帖子，使用模拟数据`)
      
      // 创建模拟帖子数据
      const mockPosts: PostWithAuthor[] = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, index) => {
        const author: UserProfile = {
          id: actualUserId,
          username: userId,
          avatar_url: `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=创作者${userId}的头像，简洁现代风格&image_size=square`,
          bio: `这是${userId}的个人简介，来自模拟数据。`,
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {},
          followers_count: Math.floor(Math.random() * 1000),
          following_count: Math.floor(Math.random() * 500),
          posts_count: 0,
          is_following: false
        }
        
        return {
          id: `mock-post-${userId}-${index}`,
          author_id: actualUserId,
          title: `${userId} 的模拟作品 ${index + 1}`,
          content: `这是${userId}创作的模拟作品内容。这是一个示例帖子，用于展示创作者的作品风格和创作能力。`,
          attachments: [],
          status: 'published',
          view_count: Math.floor(Math.random() * 1000),
          created_at: new Date(Date.now() - index * 86400000).toISOString(), // 按天递减
          updated_at: new Date(Date.now() - index * 86400000).toISOString(),
          author,
          likes_count: Math.floor(Math.random() * 100),
          comments_count: Math.floor(Math.random() * 20),
          is_liked: false
        }
      })
      
      return {
        posts: mockPosts,
        total: mockPosts.length
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
    
    // 发生错误时，返回模拟数据
    const mockPosts: PostWithAuthor[] = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, index) => {
      const author: UserProfile = {
        id: `mock-user-${userId}`,
        username: userId,
        avatar_url: `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=创作者${userId}的头像，简洁现代风格&image_size=square`,
        bio: `这是${userId}的个人简介，来自模拟数据。`,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {},
        followers_count: Math.floor(Math.random() * 1000),
        following_count: Math.floor(Math.random() * 500),
        posts_count: 0,
        is_following: false
      }
      
      return {
        id: `mock-post-${userId}-${index}`,
        author_id: `mock-user-${userId}`,
        title: `${userId} 的模拟作品 ${index + 1}`,
        content: `这是${userId}创作的模拟作品内容。这是一个示例帖子，用于展示创作者的作品风格和创作能力。`,
        attachments: [],
        status: 'published',
        view_count: Math.floor(Math.random() * 1000),
        created_at: new Date(Date.now() - index * 86400000).toISOString(), // 按天递减
        updated_at: new Date(Date.now() - index * 86400000).toISOString(),
        author,
        likes_count: Math.floor(Math.random() * 100),
        comments_count: Math.floor(Math.random() * 20),
        is_liked: false
      }
    })
    
    return {
      posts: mockPosts,
      total: mockPosts.length
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
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:users!comments_author_id_fkey(
          id, username, avatar_url, bio, is_verified, created_at
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('获取评论失败:', error)
      throw error
    }

    return (data || []).map(comment => ({
      ...comment,
      author: comment.author as UserProfile
    }))
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

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        content,
        parent_id: parentId || null
      })
      .select(`
        *,
        author:users!comments_author_id_fkey(
          id, username, avatar_url, bio, is_verified, created_at
        )
      `)
      .single()

    if (error) {
      console.error('发表评论失败:', error)
      throw error
    }

    return {
      ...data,
      author: data.author as UserProfile
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
 * @param targetUserId 目标用户ID或用户名
 */
export async function checkUserFollowing(targetUserId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return false
    
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
      .eq('follower_id', user.id)
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
