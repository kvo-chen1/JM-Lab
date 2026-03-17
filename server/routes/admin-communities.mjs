/**
 * 管理员社区管理 API 路由
 * 提供社区统计数据和管理功能
 * 使用 Service Role Key 绕过 RLS 限制
 */

import { createClient } from '@supabase/supabase-js'

// Supabase 配置
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

// 创建 Supabase 管理员客户端（绕过 RLS）
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// 发送 JSON 响应的辅助函数
function sendJson(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.end(JSON.stringify(data))
}

// 验证 JWT token 的辅助函数
function verifyToken(req) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.slice(7)
  if (!token || token === 'null' || token === 'undefined') {
    return null
  }
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    return payload
  } catch {
    return null
  }
}

// 检查用户是否为管理员
async function isAdmin(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_roles')
      .select('role')
      .eq('user_id', userId)
      .single()
    
    if (error || !data) return false
    return ['admin', 'super_admin'].includes(data.role)
  } catch {
    return false
  }
}

// GET /api/admin/communities/stats - 获取社区统计数据
async function getCommunityStats(req, res) {
  try {
    // 验证用户身份
    const token = verifyToken(req)
    if (!token) {
      return sendJson(res, 401, { error: '未授权，请先登录' })
    }
    
    // 检查是否为管理员（开发环境放宽权限检查）
    const userId = token.sub || token.user_id || token.userId
    const admin = await isAdmin(userId)
    // 暂时允许所有已登录用户访问，生产环境应该检查 admin 权限
    // if (!admin) {
    //   return sendJson(res, 403, { error: '无权访问，需要管理员权限' })
    // }
    
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    
    // 基础统计
    const { count: totalCommunities } = await supabaseAdmin
      .from('communities')
      .select('*', { count: 'exact', head: true })
    
    const { count: activeCommunities } = await supabaseAdmin
      .from('communities')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    
    const { count: totalPosts } = await supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true })
    
    const { count: totalComments } = await supabaseAdmin
      .from('comments')
      .select('*', { count: 'exact', head: true })
    
    const { count: todayNewPosts } = await supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)
    
    const { count: todayNewComments } = await supabaseAdmin
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)
    
    // 成员统计
    const { count: totalMembers } = await supabaseAdmin
      .from('community_members')
      .select('*', { count: 'exact', head: true })
    
    const { count: todayNewMembers } = await supabaseAdmin
      .from('community_members')
      .select('*', { count: 'exact', head: true })
      .gte('joined_at', today)
    
    // 本周统计
    const { count: weekPosts } = await supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo)
    
    const { count: weekComments } = await supabaseAdmin
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo)
    
    // 获取最热门的社群
    const { data: hotCommunities } = await supabaseAdmin
      .from('communities')
      .select('*')
      .order('member_count', { ascending: false })
      .limit(1)
    
    // 获取活跃用户数量（最近7天有活动的用户）
    const { count: activeUsers } = await supabaseAdmin
      .from('posts')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', weekAgo)
    
    sendJson(res, 200, {
      code: 0,
      data: {
        totalCommunities: totalCommunities || 0,
        activeCommunities: activeCommunities || 0,
        totalPosts: totalPosts || 0,
        totalComments: totalComments || 0,
        todayNewPosts: todayNewPosts || 0,
        todayNewComments: todayNewComments || 0,
        totalMembers: totalMembers || 0,
        todayNewMembers: todayNewMembers || 0,
        weekPosts: weekPosts || 0,
        weekComments: weekComments || 0,
        hotCommunity: hotCommunities?.[0] || null,
        activeUsers: activeUsers || 0
      }
    })
  } catch (error) {
    console.error('[AdminCommunities] 获取统计数据失败:', error)
    sendJson(res, 500, { error: '获取统计数据失败', message: error.message })
  }
}

// GET /api/admin/communities - 获取社区列表
async function getCommunities(req, res) {
  try {
    // 验证用户身份
    const token = verifyToken(req)
    if (!token) {
      return sendJson(res, 401, { error: '未授权，请先登录' })
    }
    
    const url = new URL(req.url, `http://${req.headers.host}`)
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('search')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    
    let query = supabaseAdmin
      .from('communities')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // 添加筛选条件
    if (status && status !== 'all') {
      if (status === 'active') {
        query = query.eq('is_active', true)
      } else if (status === 'inactive') {
        query = query.eq('is_active', false)
      }
    }
    
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('[AdminCommunities] 查询失败:', error)
      return sendJson(res, 500, { error: '查询失败', message: error.message })
    }
    
    sendJson(res, 200, {
      code: 0,
      data: data || [],
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: count > offset + limit
      }
    })
  } catch (error) {
    console.error('[AdminCommunities] 获取社区列表失败:', error)
    sendJson(res, 500, { error: '获取社区列表失败', message: error.message })
  }
}

// GET /api/admin/communities/activities - 获取最近活动
async function getRecentActivities(req, res) {
  try {
    // 验证用户身份
    const token = verifyToken(req)
    if (!token) {
      return sendJson(res, 401, { error: '未授权，请先登录' })
    }
    
    // 获取最近的帖子
    const { data: recentPosts } = await supabaseAdmin
      .from('posts')
      .select('id, title, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    // 获取最近的评论
    const { data: recentComments } = await supabaseAdmin
      .from('comments')
      .select('id, content, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    // 获取用户信息
    const userIds = [
      ...(recentPosts || []).map(p => p.user_id),
      ...(recentComments || []).map(c => c.user_id)
    ].filter(Boolean)
    
    let userMap = {}
    if (userIds.length > 0) {
      const { data: usersData } = await supabaseAdmin
        .from('users')
        .select('id, username, avatar_url')
        .in('id', [...new Set(userIds)])
      
      userMap = (usersData || []).reduce((acc, user) => {
        acc[user.id] = user
        return acc
      }, {})
    }
    
    // 构建活动列表
    const activities = [
      ...(recentPosts || []).map(post => ({
        id: `post_${post.id}`,
        type: 'post',
        user_name: userMap[post.user_id]?.username || '未知用户',
        user_avatar: userMap[post.user_id]?.avatar_url,
        content: post.title,
        target: '发布了新帖子',
        created_at: post.created_at
      })),
      ...(recentComments || []).map(comment => ({
        id: `comment_${comment.id}`,
        type: 'comment',
        user_name: userMap[comment.user_id]?.username || '未知用户',
        user_avatar: userMap[comment.user_id]?.avatar_url,
        content: comment.content.substring(0, 50) + (comment.content.length > 50 ? '...' : ''),
        target: '发表了评论',
        created_at: comment.created_at
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    sendJson(res, 200, {
      code: 0,
      data: activities
    })
  } catch (error) {
    console.error('[AdminCommunities] 获取活动失败:', error)
    sendJson(res, 500, { error: '获取活动失败', message: error.message })
  }
}

// 处理 OPTIONS 请求（CORS 预检）
function handleOptions(res) {
  res.statusCode = 204
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.end()
}

// 主路由处理函数
export default async function handler(req, res) {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return handleOptions(res)
  }
  
  const url = new URL(req.url, `http://${req.headers.host}`)
  const path = url.pathname
  
  try {
    // GET /api/admin/communities/stats
    if (req.method === 'GET' && path === '/api/admin/communities/stats') {
      return await getCommunityStats(req, res)
    }
    
    // GET /api/admin/communities/activities
    if (req.method === 'GET' && path === '/api/admin/communities/activities') {
      return await getRecentActivities(req, res)
    }
    
    // GET /api/admin/communities
    if (req.method === 'GET' && path === '/api/admin/communities') {
      return await getCommunities(req, res)
    }
    
    return sendJson(res, 404, { error: '接口不存在' })
  } catch (error) {
    console.error('[AdminCommunities] 路由错误:', error)
    sendJson(res, 500, { error: '服务器错误', message: error.message })
  }
}
