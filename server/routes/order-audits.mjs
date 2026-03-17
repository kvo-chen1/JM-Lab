/**
 * 订单审计 API 路由
 * 提供 order_audits 表的增删改查接口
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

// 读取请求体的辅助函数
async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (e) {
        resolve({})
      }
    })
    req.on('error', reject)
  })
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

// GET /api/order-audits - 获取订单审计列表
async function getOrderAudits(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const status = url.searchParams.get('status')
    const orderId = url.searchParams.get('order_id')
    const userId = url.searchParams.get('user_id')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    
    let query = supabaseAdmin
      .from('order_audits')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // 添加筛选条件
    if (status) {
      query = query.eq('status', status)
    }
    if (orderId) {
      query = query.eq('order_id', orderId)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('[OrderAudits] 查询失败:', error)
      return sendJson(res, 500, { error: '查询失败', message: error.message })
    }
    
    sendJson(res, 200, {
      data,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: count > offset + limit
      }
    })
  } catch (error) {
    console.error('[OrderAudits] 服务器错误:', error)
    sendJson(res, 500, { error: '服务器错误', message: error.message })
  }
}

// GET /api/order-audits/:id - 获取单个订单审计详情
async function getOrderAuditById(req, res, id) {
  try {
    const { data, error } = await supabaseAdmin
      .from('order_audits')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return sendJson(res, 404, { error: '订单审计记录不存在' })
      }
      console.error('[OrderAudits] 查询失败:', error)
      return sendJson(res, 500, { error: '查询失败', message: error.message })
    }
    
    sendJson(res, 200, { data })
  } catch (error) {
    console.error('[OrderAudits] 服务器错误:', error)
    sendJson(res, 500, { error: '服务器错误', message: error.message })
  }
}

// POST /api/order-audits - 创建订单审计记录
async function createOrderAudit(req, res) {
  try {
    // 验证用户身份
    const token = verifyToken(req)
    if (!token) {
      return sendJson(res, 401, { error: '未授权，请先登录' })
    }
    
    const body = await readBody(req)
    
    // 验证必填字段
    const requiredFields = ['order_id', 'title', 'brand_name', 'type']
    for (const field of requiredFields) {
      if (!body[field]) {
        return sendJson(res, 400, { error: `缺少必填字段: ${field}` })
      }
    }
    
    // 构建插入数据
    const insertData = {
      order_id: body.order_id,
      user_id: token.sub || token.user_id, // 使用当前用户ID
      title: body.title,
      brand_name: body.brand_name,
      type: body.type,
      description: body.description || '',
      budget_min: body.budget_min || 0,
      budget_max: body.budget_max || 0,
      deadline: body.deadline,
      duration: body.duration || '',
      location: body.location || '远程',
      max_applicants: body.max_applicants || 10,
      difficulty: body.difficulty || 'medium',
      requirements: body.requirements || [],
      tags: body.tags || [],
      attachments: body.attachments || [],
      status: body.status || 'pending', // pending, approved, rejected
      audit_opinion: body.audit_opinion || '',
      audited_by: null,
      audited_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    const { data, error } = await supabaseAdmin
      .from('order_audits')
      .insert([insertData])
      .select()
      .single()
    
    if (error) {
      console.error('[OrderAudits] 创建失败:', error)
      return sendJson(res, 500, { error: '创建失败', message: error.message })
    }
    
    sendJson(res, 201, { data, message: '订单审计记录创建成功' })
  } catch (error) {
    console.error('[OrderAudits] 服务器错误:', error)
    sendJson(res, 500, { error: '服务器错误', message: error.message })
  }
}

// PUT /api/order-audits/:id - 更新订单审计记录
async function updateOrderAudit(req, res, id) {
  try {
    // 验证用户身份
    const token = verifyToken(req)
    if (!token) {
      return sendJson(res, 401, { error: '未授权，请先登录' })
    }
    
    const body = await readBody(req)
    
    // 检查记录是否存在
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('order_audits')
      .select('user_id, status')
      .eq('id', id)
      .single()
    
    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return sendJson(res, 404, { error: '订单审计记录不存在' })
      }
      return sendJson(res, 500, { error: '查询失败', message: checkError.message })
    }
    
    // 检查权限：只有创建者或管理员可以修改
    const userId = token.sub || token.user_id
    const admin = await isAdmin(userId)
    
    if (existing.user_id !== userId && !admin) {
      return sendJson(res, 403, { error: '无权修改此记录' })
    }
    
    // 已审核的记录不能修改
    if (existing.status !== 'pending' && !admin) {
      return sendJson(res, 403, { error: '已审核的记录不能修改' })
    }
    
    // 构建更新数据
    const updateData = {
      updated_at: new Date().toISOString(),
    }
    
    // 允许更新的字段
    const allowedFields = [
      'title', 'brand_name', 'description', 'budget_min', 'budget_max',
      'deadline', 'duration', 'location', 'max_applicants', 'difficulty',
      'requirements', 'tags', 'attachments'
    ]
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }
    
    // 管理员可以更新审核相关字段
    if (admin) {
      if (body.status) updateData.status = body.status
      if (body.audit_opinion) updateData.audit_opinion = body.audit_opinion
      if (body.status === 'approved' || body.status === 'rejected') {
        updateData.audited_by = userId
        updateData.audited_at = new Date().toISOString()
      }
    }
    
    const { data, error } = await supabaseAdmin
      .from('order_audits')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('[OrderAudits] 更新失败:', error)
      return sendJson(res, 500, { error: '更新失败', message: error.message })
    }
    
    sendJson(res, 200, { data, message: '订单审计记录更新成功' })
  } catch (error) {
    console.error('[OrderAudits] 服务器错误:', error)
    sendJson(res, 500, { error: '服务器错误', message: error.message })
  }
}

// DELETE /api/order-audits/:id - 删除订单审计记录
async function deleteOrderAudit(req, res, id) {
  try {
    // 验证用户身份
    const token = verifyToken(req)
    if (!token) {
      return sendJson(res, 401, { error: '未授权，请先登录' })
    }
    
    // 检查记录是否存在
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('order_audits')
      .select('user_id')
      .eq('id', id)
      .single()
    
    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return sendJson(res, 404, { error: '订单审计记录不存在' })
      }
      return sendJson(res, 500, { error: '查询失败', message: checkError.message })
    }
    
    // 检查权限：只有创建者或管理员可以删除
    const userId = token.sub || token.user_id
    const admin = await isAdmin(userId)
    
    if (existing.user_id !== userId && !admin) {
      return sendJson(res, 403, { error: '无权删除此记录' })
    }
    
    const { error } = await supabaseAdmin
      .from('order_audits')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('[OrderAudits] 删除失败:', error)
      return sendJson(res, 500, { error: '删除失败', message: error.message })
    }
    
    sendJson(res, 200, { message: '订单审计记录删除成功' })
  } catch (error) {
    console.error('[OrderAudits] 服务器错误:', error)
    sendJson(res, 500, { error: '服务器错误', message: error.message })
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
  
  // 解析路径 /api/order-audits 或 /api/order-audits/:id
  const pathMatch = path.match(/^\/api\/order-audits\/?([^/]*)$/)
  
  if (!pathMatch) {
    return sendJson(res, 404, { error: '接口不存在' })
  }
  
  const id = pathMatch[1]
  
  try {
    switch (req.method) {
      case 'GET':
        if (id) {
          return await getOrderAuditById(req, res, id)
        } else {
          return await getOrderAudits(req, res)
        }
      
      case 'POST':
        if (id) {
          return sendJson(res, 405, { error: '方法不允许' })
        }
        return await createOrderAudit(req, res)
      
      case 'PUT':
        if (!id) {
          return sendJson(res, 400, { error: '缺少记录 ID' })
        }
        return await updateOrderAudit(req, res, id)
      
      case 'DELETE':
        if (!id) {
          return sendJson(res, 400, { error: '缺少记录 ID' })
        }
        return await deleteOrderAudit(req, res, id)
      
      default:
        return sendJson(res, 405, { error: '方法不允许' })
    }
  } catch (error) {
    console.error('[OrderAudits] 路由错误:', error)
    sendJson(res, 500, { error: '服务器错误', message: error.message })
  }
}
