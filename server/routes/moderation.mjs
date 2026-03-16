/**
 * 内容审核管理 API 路由
 * 提供审核规则、违禁词、审核日志的管理接口
 */

import { supabaseServer } from '../supabase-server.mjs'
import { verifyToken } from '../jwt.mjs'

// 验证管理员权限
async function verifyAdmin(req) {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.slice(7)
  const decoded = verifyToken(token)
  
  if (!decoded) {
    return null
  }
  
  // 检查用户是否为管理员
  const { data: user, error } = await supabaseServer
    .from('users')
    .select('role')
    .eq('id', decoded.userId || decoded.sub || decoded.id)
    .single()
  
  if (error || !user || user.role !== 'admin') {
    return null
  }
  
  return decoded
}

// 发送 JSON 响应
function sendJson(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

// 读取请求体
async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try {
        resolve(JSON.parse(body))
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

// 主路由处理函数
export default async function moderationRoutes(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const path = url.pathname
  
  console.log('[Moderation API]', req.method, path)
  
  // 验证管理员权限
  const admin = await verifyAdmin(req)
  if (!admin) {
    sendJson(res, 401, { code: 1, message: '未授权访问，需要管理员权限' })
    return
  }
  
  try {
    // ========== 审核规则管理 ==========
    
    // 获取所有审核规则
    if (req.method === 'GET' && path === '/api/admin/moderation/rules') {
      const { data, error } = await supabaseServer
        .from('moderation_rules')
        .select('*')
        .order('rule_type')
      
      if (error) {
        console.error('[Moderation API] Get rules error:', error)
        sendJson(res, 500, { code: 1, message: '获取审核规则失败' })
        return
      }
      
      sendJson(res, 200, { code: 0, data: data || [] })
      return
    }
    
    // 更新审核规则
    if (req.method === 'PUT' && path.match(/^\/api\/admin\/moderation\/rules\/[^\/]+$/)) {
      const ruleId = path.split('/')[5]
      const body = await readBody(req)
      
      const { error } = await supabaseServer
        .from('moderation_rules')
        .update({
          enabled: body.enabled,
          threshold: body.threshold,
          auto_action: body.auto_action,
          config: body.config,
          updated_at: new Date().toISOString()
        })
        .eq('id', ruleId)
      
      if (error) {
        console.error('[Moderation API] Update rule error:', error)
        sendJson(res, 500, { code: 1, message: '更新审核规则失败' })
        return
      }
      
      sendJson(res, 200, { code: 0, message: '更新成功' })
      return
    }
    
    // ========== 违禁词管理 ==========
    
    // 获取违禁词列表
    if (req.method === 'GET' && path === '/api/admin/moderation/forbidden-words') {
      const category = url.searchParams.get('category')
      
      let query = supabaseServer
        .from('forbidden_words')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (category) {
        query = query.eq('category', category)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('[Moderation API] Get forbidden words error:', error)
        sendJson(res, 500, { code: 1, message: '获取违禁词失败' })
        return
      }
      
      sendJson(res, 200, { code: 0, data: data || [] })
      return
    }
    
    // 添加违禁词
    if (req.method === 'POST' && path === '/api/admin/moderation/forbidden-words') {
      const body = await readBody(req)
      
      if (!body.word) {
        sendJson(res, 400, { code: 1, message: '违禁词不能为空' })
        return
      }
      
      const { data, error } = await supabaseServer
        .from('forbidden_words')
        .insert({
          word: body.word,
          category: body.category || 'general',
          severity: body.severity || 3,
          is_regex: body.is_regex || false,
          is_active: body.is_active !== false
        })
        .select()
        .single()
      
      if (error) {
        console.error('[Moderation API] Add forbidden word error:', error)
        if (error.code === '23505') {
          sendJson(res, 400, { code: 1, message: '该违禁词已存在' })
        } else {
          sendJson(res, 500, { code: 1, message: '添加违禁词失败' })
        }
        return
      }
      
      sendJson(res, 200, { code: 0, data, message: '添加成功' })
      return
    }
    
    // 更新违禁词
    if (req.method === 'PUT' && path.match(/^\/api\/admin\/moderation\/forbidden-words\/[^\/]+$/)) {
      const wordId = path.split('/')[5]
      const body = await readBody(req)
      
      const { error } = await supabaseServer
        .from('forbidden_words')
        .update({
          word: body.word,
          category: body.category,
          severity: body.severity,
          is_regex: body.is_regex,
          is_active: body.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', wordId)
      
      if (error) {
        console.error('[Moderation API] Update forbidden word error:', error)
        sendJson(res, 500, { code: 1, message: '更新违禁词失败' })
        return
      }
      
      sendJson(res, 200, { code: 0, message: '更新成功' })
      return
    }
    
    // 删除违禁词
    if (req.method === 'DELETE' && path.match(/^\/api\/admin\/moderation\/forbidden-words\/[^\/]+$/)) {
      const wordId = path.split('/')[5]
      
      const { error } = await supabaseServer
        .from('forbidden_words')
        .delete()
        .eq('id', wordId)
      
      if (error) {
        console.error('[Moderation API] Delete forbidden word error:', error)
        sendJson(res, 500, { code: 1, message: '删除违禁词失败' })
        return
      }
      
      sendJson(res, 200, { code: 0, message: '删除成功' })
      return
    }
    
    // ========== 审核日志 ==========
    
    // 获取审核日志
    if (req.method === 'GET' && path === '/api/admin/moderation/logs') {
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const offset = parseInt(url.searchParams.get('offset') || '0')
      const contentType = url.searchParams.get('content_type')
      const action = url.searchParams.get('action')
      
      let query = supabaseServer
        .from('moderation_logs')
        .select('*', { count: 'exact' })
      
      if (contentType) {
        query = query.eq('content_type', contentType)
      }
      
      if (action) {
        query = query.eq('action', action)
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      if (error) {
        console.error('[Moderation API] Get logs error:', error)
        sendJson(res, 500, { code: 1, message: '获取审核日志失败' })
        return
      }
      
      sendJson(res, 200, { 
        code: 0, 
        data: data || [],
        pagination: {
          total: count || 0,
          limit,
          offset
        }
      })
      return
    }
    
    // ========== 审核统计 ==========
    
    // 获取审核统计
    if (req.method === 'GET' && path === '/api/admin/moderation/stats') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { data, error } = await supabaseServer
        .from('moderation_logs')
        .select('action, created_at')
      
      if (error) {
        console.error('[Moderation API] Get stats error:', error)
        sendJson(res, 500, { code: 1, message: '获取审核统计失败' })
        return
      }
      
      const stats = {
        total: data?.length || 0,
        autoApproved: data?.filter(l => l.action === 'auto_approved').length || 0,
        autoRejected: data?.filter(l => l.action === 'auto_rejected').length || 0,
        flagged: data?.filter(l => l.action === 'flagged').length || 0,
        today: data?.filter(l => new Date(l.created_at) >= today).length || 0
      }
      
      sendJson(res, 200, { code: 0, data: stats })
      return
    }
    
    // ========== 手动审核内容 ==========
    
    // 手动审核（通过/拒绝）
    if (req.method === 'POST' && path === '/api/admin/moderation/review') {
      const body = await readBody(req)
      
      if (!body.content_id || !body.content_type || !body.action) {
        sendJson(res, 400, { code: 1, message: '缺少必要参数' })
        return
      }
      
      // 记录手动审核日志
      const { error } = await supabaseServer
        .from('moderation_logs')
        .insert({
          content_id: body.content_id,
          content_type: body.content_type,
          user_id: admin.userId || admin.sub || admin.id,
          action: body.action === 'approve' ? 'manual_approved' : 'manual_rejected',
          reason: body.reason || null
        })
      
      if (error) {
        console.error('[Moderation API] Manual review error:', error)
        sendJson(res, 500, { code: 1, message: '审核操作失败' })
        return
      }
      
      // 更新作品状态
      if (body.content_type === 'work') {
        const { error: updateError } = await supabaseServer
          .from('works')
          .update({
            status: body.action === 'approve' ? 'published' : 'rejected',
            moderation_status: body.action === 'approve' ? 'approved' : 'rejected',
            rejection_reason: body.action === 'reject' ? (body.reason || '内容违规') : null,
            reviewed_at: new Date().toISOString(),
            moderator_id: admin.userId || admin.sub || admin.id
          })
          .eq('id', body.content_id)
        
        if (updateError) {
          console.error('[Moderation API] Update work status error:', updateError)
        }
      }
      
      sendJson(res, 200, { code: 0, message: '审核操作成功' })
      return
    }
    
    // ========== 预警管理 ==========
    
    // 获取预警规则列表
    if (req.method === 'GET' && path === '/api/admin/alerts/rules') {
      const { data, error } = await supabaseServer
        .from('alert_rules')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('[Moderation API] Get alert rules error:', error)
        sendJson(res, 500, { code: 1, message: '获取预警规则失败' })
        return
      }
      
      sendJson(res, 200, { code: 0, data: data || [] })
      return
    }
    
    // 创建预警规则
    if (req.method === 'POST' && path === '/api/admin/alerts/rules') {
      const body = await readBody(req)
      
      const { error } = await supabaseServer
        .from('alert_rules')
        .insert({
          name: body.name,
          description: body.description,
          metric: body.metric,
          threshold: body.threshold,
          operator: body.operator,
          enabled: body.enabled ?? true,
          channels: body.channels || ['dashboard'],
          created_by: admin.userId || admin.sub || admin.id
        })
      
      if (error) {
        console.error('[Moderation API] Create alert rule error:', error)
        sendJson(res, 500, { code: 1, message: '创建预警规则失败' })
        return
      }
      
      sendJson(res, 200, { code: 0, message: '创建成功' })
      return
    }
    
    // 更新预警规则
    if (req.method === 'PUT' && path.match(/^\/api\/admin\/alerts\/rules\/[^\/]+$/)) {
      const ruleId = path.split('/')[5]
      const body = await readBody(req)
      
      const { error } = await supabaseServer
        .from('alert_rules')
        .update({
          name: body.name,
          description: body.description,
          metric: body.metric,
          threshold: body.threshold,
          operator: body.operator,
          enabled: body.enabled,
          channels: body.channels,
          updated_at: new Date().toISOString()
        })
        .eq('id', ruleId)
      
      if (error) {
        console.error('[Moderation API] Update alert rule error:', error)
        sendJson(res, 500, { code: 1, message: '更新预警规则失败' })
        return
      }
      
      sendJson(res, 200, { code: 0, message: '更新成功' })
      return
    }
    
    // 删除预警规则
    if (req.method === 'DELETE' && path.match(/^\/api\/admin\/alerts\/rules\/[^\/]+$/)) {
      const ruleId = path.split('/')[5]
      
      const { error } = await supabaseServer
        .from('alert_rules')
        .delete()
        .eq('id', ruleId)
      
      if (error) {
        console.error('[Moderation API] Delete alert rule error:', error)
        sendJson(res, 500, { code: 1, message: '删除预警规则失败' })
        return
      }
      
      sendJson(res, 200, { code: 0, message: '删除成功' })
      return
    }
    
    // 获取预警记录列表
    if (req.method === 'GET' && path === '/api/admin/alerts/records') {
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const offset = parseInt(url.searchParams.get('offset') || '0')
      const status = url.searchParams.get('status')
      
      let query = supabaseServer
        .from('alert_records')
        .select('*', { count: 'exact' })
      
      if (status) {
        query = query.eq('status', status)
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      if (error) {
        console.error('[Moderation API] Get alert records error:', error)
        sendJson(res, 500, { code: 1, message: '获取预警记录失败' })
        return
      }
      
      sendJson(res, 200, { 
        code: 0, 
        data: data || [],
        pagination: {
          total: count || 0,
          limit,
          offset
        }
      })
      return
    }
    
    // 确认预警
    if (req.method === 'PUT' && path.match(/^\/api\/admin\/alerts\/records\/[^\/]+\/acknowledge$/)) {
      const recordId = path.split('/')[5]
      
      const { error } = await supabaseServer
        .from('alert_records')
        .update({
          status: 'acknowledged',
          acknowledged_by: admin.userId || admin.sub || admin.id,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', recordId)
      
      if (error) {
        console.error('[Moderation API] Acknowledge alert error:', error)
        sendJson(res, 500, { code: 1, message: '确认预警失败' })
        return
      }
      
      sendJson(res, 200, { code: 0, message: '确认成功' })
      return
    }
    
    // 如果没有匹配的路由
    sendJson(res, 404, { code: 1, message: '接口不存在' })
    
  } catch (error) {
    console.error('[Moderation API] Error:', error)
    sendJson(res, 500, { code: 1, message: '服务器内部错误' })
  }
}
