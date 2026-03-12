/**
 * 品牌授权管理路由
 */

import { getDB } from '../database.mjs'

// 发送 JSON 响应的辅助函数
function sendJson(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
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

// 获取授权申请列表
async function getAuthorizations(req, res, userId) {
  try {
    const db = await getDB()
    
    // 获取查询参数
    const url = new URL(req.url, `http://${req.headers.host}`)
    const applicantId = url.searchParams.get('applicant_id')
    const brandId = url.searchParams.get('brand_id')
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    
    let sql = `
      SELECT 
        ba.*,
        b.id as brand_id,
        b.name as brand_name,
        b.logo as brand_logo,
        b.description as brand_description,
        b.category as brand_category,
        ia.id as ip_asset_id,
        ia.name as ip_asset_name,
        ia.thumbnail as ip_asset_thumbnail,
        u.id as applicant_id,
        u.username as applicant_username,
        u.avatar_url as applicant_avatar_url
      FROM brand_authorizations ba
      LEFT JOIN brands b ON ba.brand_id = b.id
      LEFT JOIN ip_assets ia ON ba.ip_asset_id = ia.id
      LEFT JOIN users u ON ba.applicant_id::text = u.id::text
      WHERE 1=1
    `
    const values = []
    let paramIndex = 1
    
    if (applicantId) {
      sql += ` AND ba.applicant_id = $${paramIndex}`
      values.push(applicantId)
      paramIndex++
    }
    
    if (brandId) {
      sql += ` AND ba.brand_id = $${paramIndex}`
      values.push(brandId)
      paramIndex++
    }
    
    if (status) {
      sql += ` AND ba.status = $${paramIndex}`
      values.push(status)
      paramIndex++
    }
    
    sql += ` ORDER BY ba.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    values.push(limit, offset)
    
    const { rows } = await db.query(sql, values)
    
    // 格式化返回数据
    const formattedData = rows.map(row => ({
      id: row.id,
      ip_asset_id: row.ip_asset_id,
      brand_id: row.brand_id,
      applicant_id: row.applicant_id,
      status: row.status,
      application_reason: row.application_reason,
      proposed_usage: row.proposed_usage,
      proposed_duration: row.proposed_duration,
      proposed_price: row.proposed_price,
      brand_response: row.brand_response,
      contract_url: row.contract_url,
      certificate_url: row.certificate_url,
      started_at: row.started_at,
      expired_at: row.expired_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      brand: row.brand_id ? {
        id: row.brand_id,
        name: row.brand_name,
        logo: row.brand_logo,
        description: row.brand_description,
        category: row.brand_category
      } : null,
      ip_asset: row.ip_asset_id ? {
        id: row.ip_asset_id,
        name: row.ip_asset_name,
        thumbnail: row.ip_asset_thumbnail
      } : null,
      applicant: row.applicant_id ? {
        id: row.applicant_id,
        username: row.applicant_username,
        avatar_url: row.applicant_avatar_url
      } : null
    }))
    
    sendJson(res, 200, {
      code: 0,
      data: formattedData,
      message: '获取授权申请列表成功'
    })
  } catch (error) {
    console.error('[Brand API] 获取授权申请列表失败:', error)
    sendJson(res, 500, { error: 'SERVER_ERROR', message: error.message })
  }
}

// 获取品牌列表
async function getBrands(req, res) {
  try {
    const db = await getDB()
    
    const url = new URL(req.url, `http://${req.headers.host}`)
    const status = url.searchParams.get('status')
    const category = url.searchParams.get('category')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    
    let sql = 'SELECT * FROM brands WHERE 1=1'
    const values = []
    let paramIndex = 1
    
    if (status) {
      sql += ` AND status = $${paramIndex}`
      values.push(status)
      paramIndex++
    }
    
    if (category) {
      sql += ` AND category = $${paramIndex}`
      values.push(category)
      paramIndex++
    }
    
    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    values.push(limit, offset)
    
    const { rows } = await db.query(sql, values)
    
    sendJson(res, 200, {
      code: 0,
      data: rows,
      message: '获取品牌列表成功'
    })
  } catch (error) {
    console.error('[Brand API] 获取品牌列表失败:', error)
    sendJson(res, 500, { error: 'SERVER_ERROR', message: error.message })
  }
}

// 获取授权统计
async function getAuthorizationStats(req, res, userId) {
  try {
    const db = await getDB()
    
    // 获取各状态的数量
    const { rows: statusRows } = await db.query(`
      SELECT status, COUNT(*) as count 
      FROM brand_authorizations 
      WHERE applicant_id = $1 
      GROUP BY status
    `, [userId])
    
    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
      cancelled: 0,
      total: 0
    }
    
    statusRows.forEach(row => {
      stats[row.status] = parseInt(row.count)
      stats.total += parseInt(row.count)
    })
    
    sendJson(res, 200, {
      code: 0,
      data: stats,
      message: '获取授权统计成功'
    })
  } catch (error) {
    console.error('[Brand API] 获取授权统计失败:', error)
    sendJson(res, 500, { error: 'SERVER_ERROR', message: error.message })
  }
}

// 主路由处理函数
export default async function brandRoutes(req, res) {
  const path = new URL(req.url, `http://${req.headers.host}`).pathname
  
  console.log('[Brand Routes]', req.method, path)
  
  // 验证 token
  const user = verifyToken(req)
  if (!user) {
    sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
    return
  }
  
  const userId = user.sub || user.id
  
  try {
    // GET /api/brand/authorizations - 获取授权申请列表
    if (req.method === 'GET' && path === '/api/brand/authorizations') {
      await getAuthorizations(req, res, userId)
      return
    }
    
    // GET /api/brand/brands - 获取品牌列表
    if (req.method === 'GET' && path === '/api/brand/brands') {
      await getBrands(req, res)
      return
    }
    
    // GET /api/brand/authorizations/stats - 获取授权统计
    if (req.method === 'GET' && path === '/api/brand/authorizations/stats') {
      await getAuthorizationStats(req, res, userId)
      return
    }
    
    // 未匹配的路由
    sendJson(res, 404, { error: 'NOT_FOUND', message: '接口不存在' })
  } catch (error) {
    console.error('[Brand Routes] 错误:', error)
    sendJson(res, 500, { error: 'SERVER_ERROR', message: error.message })
  }
}
