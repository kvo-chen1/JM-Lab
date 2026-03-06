// 津脉社区 API 工具函数
import { apiService } from '../services/apiService'
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
    // 使用后端API获取帖子列表
    const offset = (page - 1) * limit
    const posts = await apiService.get('/api/feeds', {
      limit,
      offset,
      category,
      sort,
      search: searchTerm
    })

    // 转换数据格式以匹配前端期望
    const postsWithStats = (posts || []).map((post: any) => ({
      id: post.id,
      title: post.title || '无标题',
      content: post.content,
      images: post.images,
      videos: post.videos,
      community_id: post.communityId,
      view_count: post.views,
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
      created_at: post.created_at,
      updated_at: post.updated_at,
      likes_count: post.likes || 0,
      comments_count: post.comments || 0,
      author: {
        id: post.author?.id || 'unknown',
        username: post.author?.name || post.author?.username || '未知用户',
        avatar_url: post.author?.avatar || '',
        bio: null,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {}
      } as UserProfile
    }))

    return {
      posts: postsWithStats,
      total: posts?.length || 0
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
    // 使用后端API获取帖子详情
    // 注意：这里暂时使用作品详情端点，需要后端添加专门的帖子详情端点
    const post = await apiService.get(`/api/works/${postId}`)

    if (!post) return null

    // 转换数据格式以匹配前端期望
    return {
      id: post.id,
      title: post.title || '无标题',
      content: post.content,
      images: post.images,
      videos: post.videos,
      community_id: post.communityId,
      view_count: post.view_count || post.views || 0,
      likes: post.likes || 0,
      comments: post.comments || 0,
      shares: post.shares || 0,
      created_at: post.created_at,
      updated_at: post.updated_at,
      likes_count: post.likes || 0,
      comments_count: post.comments || 0,
      author: {
        id: post.author?.id || 'unknown',
        username: post.author?.username || post.author?.name || '未知用户',
        avatar_url: post.author?.avatar || '',
        bio: null,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {}
      } as UserProfile
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
    // 使用后端API获取用户资料
    const user = await apiService.get(`/api/users/${userId}`)

    if (!user) {
      console.warn(`未找到用户: ${userId}`)
      return null
    }

    // 获取用户统计数据
    const stats = await apiService.get(`/api/user/stats`)

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar || user.avatar_url,
      bio: user.bio,
      is_verified: user.is_verified || false,
      created_at: user.created_at,
      updated_at: user.updated_at,
      metadata: user.metadata || {},
      followers_count: user.followers_count || stats?.followers_count || 0,
      following_count: user.following_count || stats?.following_count || 0,
      posts_count: stats?.works_count || 0
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
    // 使用后端API获取用户的作品（暂时使用作品端点）
    const offset = (page - 1) * limit
    const works = await apiService.get(`/api/works`, {
      creator_id: userId,
      limit,
      offset
    })

    // 转换数据格式以匹配前端期望
    const postsWithStats = (works || []).map((work: any) => ({
      id: work.id,
      title: work.title,
      content: work.description,
      images: work.images || [],
      videos: work.videos || [],
      community_id: work.communityId,
      view_count: work.view_count || work.views || 0,
      likes: work.likes || 0,
      comments: work.comments || 0,
      shares: work.shares || 0,
      created_at: work.created_at,
      updated_at: work.updated_at,
      likes_count: work.likes || 0,
      comments_count: work.comments || 0,
      author: {
        id: work.author?.id || work.creator_id,
        username: work.author?.username || work.author?.name || '未知用户',
        avatar_url: work.author?.avatar || '',
        bio: null,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {}
      } as UserProfile
    }))

    return {
      posts: postsWithStats,
      total: works?.length || 0
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
    // 使用后端API处理点赞操作
    if (action === 'like') {
      await apiService.post(`/api/works/${postId}/like`)
    } else {
      await apiService.post(`/api/works/${postId}/unlike`)
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
    // 使用后端API处理关注操作
    if (action === 'follow') {
      await apiService.post('/api/follows', { targetUserId })
    } else {
      await apiService.delete(`/api/follows/${targetUserId}`)
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
    // 使用后端API获取评论
    const comments = await apiService.get(`/api/works/${postId}/comments`)

    // 转换数据格式以匹配前端期望
    return (comments || []).map((comment: any) => ({
      id: comment.id,
      post_id: postId,
      content: comment.content,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      author: {
        id: comment.user?.id || 'unknown',
        username: comment.user?.username || comment.user?.name || '未知用户',
        avatar_url: comment.user?.avatar || '',
        bio: null,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {}
      } as UserProfile
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
    // 使用后端API发表评论
    const comment = await apiService.post(`/api/works/${postId}/comments`, { content })

    if (!comment) return null

    return {
      id: comment.id,
      post_id: postId,
      content: comment.content,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      author: {
        id: comment.user?.id || 'unknown',
        username: comment.user?.username || comment.user?.name || '未知用户',
        avatar_url: comment.user?.avatar || '',
        bio: null,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {}
      } as UserProfile
    }
  } catch (error) {
    console.error('发表评论错误:', error)
    return null
  }
}

/**
 * 检查用户是否点赞了帖子
 * @param postId 帖子ID
 */
export async function checkUserLikedPost(postId: string): Promise<boolean> {
  try {
    // 使用后端API检查点赞状态
    const result = await apiService.checkPostLiked(postId)
    return result.liked
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
    // 使用后端API检查关注状态
    const result = await apiService.checkUserFollowing(targetUserId)
    return result.isFollowing
  } catch (error) {
    console.error('检查关注状态错误:', error)
    return false
  }
}
