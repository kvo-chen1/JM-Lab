/**
 * 简化的数据库代理路由 - 处理 Supabase 风格的 REST API 请求
 */

import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
                    process.env.NEON_DATABASE_URL || 
                    process.env.POSTGRES_URL_NON_POOLING ||
                    process.env.NEON_POSTGRES_URL_NON_POOLING ||
                    'postgresql://neondb_owner:npg_fV0Tzot3RCxh@ep-shy-bar-ajp9o0kn-pooler.c-3.us-east-2.aws.neon.tech/neondb',
  ssl: { rejectUnauthorized: false },
  max: 5,
  min: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 60000,
  statement_timeout: 30000,
  query_timeout: 30000
})

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

// 解析 Supabase 风格的过滤条件
// 例如: user_id=eq.xxx, created_at=gte.2024-01-01, status=in.(active,pending)
function parseFilter(key, value) {
  const operators = {
    'eq': '=',
    'neq': '!=',
    'gt': '>',
    'gte': '>=',
    'lt': '<',
    'lte': '<=',
    'like': 'LIKE',
    'ilike': 'ILIKE',
    'is': 'IS',
    'in': 'IN'
  }

  // 检查 value 是否有效
  if (value === undefined || value === null) {
    console.warn(`[DB Proxy] Invalid value for key "${key}":`, value)
    return { operator: '=', value: '', isArray: false }
  }

  // 确保 value 是字符串
  const valueStr = String(value)

  // 检查是否包含操作符前缀
  for (const [op, sqlOp] of Object.entries(operators)) {
    const prefix = `${op}.`
    if (valueStr.startsWith(prefix)) {
      const actualValue = valueStr.slice(prefix.length)

      if (op === 'in') {
        // 处理 IN 操作符: in.(value1,value2)
        const values = actualValue.replace(/[()]/g, '').split(',').map(v => v.trim())
        return { operator: sqlOp, value: values, isArray: true }
      }

      if (op === 'is' && actualValue === 'null') {
        return { operator: 'IS', value: null, isNull: true }
      }

      return { operator: sqlOp, value: actualValue, isArray: false }
    }
  }

  // 默认使用等于
  return { operator: '=', value: valueStr, isArray: false }
}

// 验证 JWT token 的辅助函数
function verifyToken(req) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.slice(7)
  // 简单验证：检查 token 格式（实际应该使用 jwt.verify）
  if (!token || token === 'null' || token === 'undefined') {
    return null
  }
  // 解析 token payload（简化版）
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    return payload
  } catch {
    return null
  }
}

// 处理认证相关的请求
async function handleAuthRequest(req, res, path) {
  // 获取当前用户信息 /auth/v1/user
  if (req.method === 'GET' && path === '/api/db/auth/v1/user') {
    const user = verifyToken(req)
    if (!user) {
      sendJson(res, 401, { error: 'Unauthorized', message: '未授权访问' })
      return true
    }
    
    try {
      // 从数据库获取用户详细信息
      const result = await pool.query(
        'SELECT id, email, username, avatar_url, role, created_at, updated_at FROM users WHERE id = $1',
        [user.sub || user.id]
      )
      
      if (result.rows.length === 0) {
        sendJson(res, 404, { error: 'User not found', message: '用户不存在' })
        return true
      }
      
      const userData = result.rows[0]
      sendJson(res, 200, {
        id: userData.id,
        email: userData.email,
        user_metadata: {
          username: userData.username,
          avatar_url: userData.avatar_url,
          role: userData.role
        },
        created_at: userData.created_at,
        updated_at: userData.updated_at
      })
      return true
    } catch (error) {
      console.error('[DB Proxy] Auth error:', error.message)
      sendJson(res, 500, { error: 'Server error', message: error.message })
      return true
    }
  }
  
  return false
}

// 主处理函数
export default async function handleDbProxy(req, res, path) {
  // 首先处理认证相关的请求
  if (path.startsWith('/api/db/auth/')) {
    const handled = await handleAuthRequest(req, res, path)
    if (handled) return
  }
  
  // 提取表名
  let table = path.replace('/api/db/', '').split('?')[0]
  if (table.startsWith('rest/v1/')) {
    table = table.replace('rest/v1/', '')
  }
  table = table.replace(/^\//, '')
  
  const u = new URL(req.url, `http://${req.headers.host}`)
  const params = Object.fromEntries(u.searchParams)
  
  console.log('[DB Proxy]', req.method, table, Object.keys(params))
  
  try {
    // 处理 HEAD 请求 - 返回与 GET 相同的响应头，但不返回响应体
    if (req.method === 'HEAD') {
      // 将 HEAD 请求转换为 GET 请求处理，但只返回响应头
      req.method = 'GET'
      const originalEnd = res.end
      res.end = function(data) {
        // 不返回响应体，只返回响应头
        res.setHeader('Content-Length', 0)
        originalEnd.call(res)
      }
    }
    
    switch (req.method) {
      case 'GET': {
        const select = params.select || '*'
        let sql = `SELECT ${select} FROM "${table}"`
        const values = []
        const conditions = []
        let paramIndex = 1
        
        // 处理过滤条件
        for (const [key, rawValue] of Object.entries(params)) {
          if (key === 'select' || key === 'order' || key === 'limit' || key === 'offset' || key === 'or') {
            continue
          }
          
          const filter = parseFilter(key, rawValue)
          
          if (filter.isNull) {
            conditions.push(`"${key}" IS NULL`)
          } else if (filter.isArray) {
            const placeholders = filter.value.map((_, i) => `$${paramIndex + i}`).join(', ')
            conditions.push(`"${key}" IN (${placeholders})`)
            values.push(...filter.value)
            paramIndex += filter.value.length
          } else {
            conditions.push(`"${key}" ${filter.operator} $${paramIndex}`)
            values.push(filter.value)
            paramIndex++
          }
        }
        
        // 处理 OR 条件
        // Supabase 格式: or=(sender_id.eq.xxx,receiver_id.eq.xxx)
        if (params.or) {
          const orValue = params.or
          // 解析 or 条件: (sender_id.eq.xxx,receiver_id.eq.xxx)
          const orMatch = orValue.match(/^\((.+)\)$/)
          if (orMatch) {
            const orConditions = []
            const orParts = orMatch[1].split(',')
            
            for (const part of orParts) {
              // 解析每个条件: sender_id.eq.xxx
              const match = part.match(/^(.+)\.([^.]+)\.(.*)$/)
              if (match) {
                const [, col, op, val] = match
                const filter = parseFilter(op, val)
                
                if (filter.isNull) {
                  orConditions.push(`"${col}" IS NULL`)
                } else {
                  orConditions.push(`"${col}" ${filter.operator} $${paramIndex}`)
                  values.push(filter.value)
                  paramIndex++
                }
              }
            }
            
            if (orConditions.length > 0) {
              conditions.push(`(${orConditions.join(' OR ')})`)
            }
          }
        }
        
        if (conditions.length > 0) {
          sql += ` WHERE ${conditions.join(' AND ')}`
        }
        
        // 处理排序
        if (params.order) {
          // Supabase 格式: column.asc, column.desc
          const orderParts = params.order.split(',')
          const orderClauses = orderParts.map(part => {
            const [col, dir] = part.trim().split('.')
            return `"${col}" ${dir === 'desc' ? 'DESC' : 'ASC'}`
          })
          sql += ` ORDER BY ${orderClauses.join(', ')}`
        }
        
        // 处理限制和偏移
        if (params.limit) {
          sql += ` LIMIT ${parseInt(params.limit)}`
        }
        if (params.offset) {
          sql += ` OFFSET ${parseInt(params.offset)}`
        }
        
        console.log('[DB Proxy] SQL:', sql.replace(/\$\d+/g, '?'), 'Values:', values)
        
        const result = await pool.query(sql, values)
        sendJson(res, 200, result.rows)
        break
      }
      
      case 'POST': {
        const body = await readBody(req)
        const data = Array.isArray(body) ? body : [body]
        
        if (data.length === 0) {
          sendJson(res, 400, { error: 'No data provided' })
          return
        }
        
        const columns = Object.keys(data[0])
        const placeholders = data.map((_, rowIndex) => 
          `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`
        ).join(', ')
        
        const values = data.flatMap(row => columns.map(col => row[col]))
        
        // 为特定表添加 ON CONFLICT 处理，避免重复键错误
        let sql = `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES ${placeholders}`
        
        // 处理 user_status 表的冲突（user_id 是主键）
        if (table === 'user_status') {
          const updateSet = columns.map(col => `"${col}" = EXCLUDED."${col}"`).join(', ')
          sql += ` ON CONFLICT (user_id) DO UPDATE SET ${updateSet}`
        }
        
        sql += ' RETURNING *'
        
        const result = await pool.query(sql, values)
        sendJson(res, 201, result.rows)
        break
      }
      
      case 'PATCH': {
        const body = await readBody(req)
        
        const setColumns = Object.keys(body)
        const setValues = Object.values(body)
        
        let sql = `UPDATE "${table}" SET ${setColumns.map((col, i) => `"${col}" = $${i + 1}`).join(', ')}`
        const values = [...setValues]
        
        // 处理 WHERE 条件
        const conditions = []
        let paramIndex = setValues.length + 1
        
        for (const [key, rawValue] of Object.entries(params)) {
          if (key === 'select') continue
          
          const filter = parseFilter(key, rawValue)
          
          if (filter.isNull) {
            conditions.push(`"${key}" IS NULL`)
          } else if (filter.isArray) {
            const placeholders = filter.value.map((_, i) => `$${paramIndex + i}`).join(', ')
            conditions.push(`"${key}" IN (${placeholders})`)
            values.push(...filter.value)
            paramIndex += filter.value.length
          } else {
            conditions.push(`"${key}" ${filter.operator} $${paramIndex}`)
            values.push(filter.value)
            paramIndex++
          }
        }
        
        if (conditions.length > 0) {
          sql += ` WHERE ${conditions.join(' AND ')}`
        }
        
        sql += ` RETURNING *`
        
        const result = await pool.query(sql, values)
        sendJson(res, 200, result.rows)
        break
      }
      
      case 'DELETE': {
        let sql = `DELETE FROM "${table}"`
        const values = []
        const conditions = []
        let paramIndex = 1
        
        // 处理 WHERE 条件
        for (const [key, rawValue] of Object.entries(params)) {
          if (key === 'select') continue
          
          const filter = parseFilter(key, rawValue)
          
          if (filter.isNull) {
            conditions.push(`"${key}" IS NULL`)
          } else if (filter.isArray) {
            const placeholders = filter.value.map((_, i) => `$${paramIndex + i}`).join(', ')
            conditions.push(`"${key}" IN (${placeholders})`)
            values.push(...filter.value)
            paramIndex += filter.value.length
          } else {
            conditions.push(`"${key}" ${filter.operator} $${paramIndex}`)
            values.push(filter.value)
            paramIndex++
          }
        }
        
        if (conditions.length > 0) {
          sql += ` WHERE ${conditions.join(' AND ')}`
        }
        
        sql += ` RETURNING *`
        
        const result = await pool.query(sql, values)
        sendJson(res, 200, result.rows)
        break
      }
      
      default:
        sendJson(res, 405, { error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('[DB Proxy] Error:', error.message)
    console.error('[DB Proxy] Stack:', error.stack)
    sendJson(res, 500, { error: error.message, detail: error.detail })
  }
}
