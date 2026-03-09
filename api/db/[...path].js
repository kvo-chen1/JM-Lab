// Vercel API Route - Supabase 兼容的数据库代理
// 处理所有 /api/db/* 请求

import { Pool } from 'pg'

// 创建连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
                    process.env.POSTGRES_URL || 
                    process.env.POSTGRES_URL_NON_POOLING,
  ssl: { 
    rejectUnauthorized: false,
    requestCert: true,
    agent: false
  },
  max: 10,
  min: 2,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 30000
})

// 验证 JWT token
function verifyToken(authHeader) {
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

// 解析 Supabase 风格的过滤条件
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
  
  for (const [op, sqlOp] of Object.entries(operators)) {
    const prefix = `${op}.`
    if (value.startsWith(prefix)) {
      const actualValue = value.slice(prefix.length)
      
      if (op === 'in') {
        const values = actualValue.replace(/[()]/g, '').split(',').map(v => v.trim())
        return { operator: sqlOp, value: values, isArray: true }
      }
      
      if (op === 'is' && actualValue === 'null') {
        return { operator: 'IS', value: null, isNull: true }
      }
      
      return { operator: sqlOp, value: actualValue, isArray: false }
    }
  }
  
  return { operator: '=', value: value, isArray: false }
}

// 处理值：将对象/数组转换为 JSON 字符串
function processValue(value) {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return value
}

// 处理认证请求
async function handleAuthRequest(req, res, path) {
  if (req.method === 'GET' && path === '/auth/v1/user') {
    const user = verifyToken(req.headers.authorization)
    if (!user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: '未授权访问',
        data: null 
      })
    }
    
    try {
      const result = await pool.query(
        'SELECT id, email, username, avatar_url, role, created_at, updated_at FROM users WHERE id = $1',
        [user.sub || user.id]
      )
      
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          error: 'User not found', 
          message: '用户不存在',
          data: null 
        })
      }
      
      const userData = result.rows[0]
      return res.status(200).json({
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
    } catch (error) {
      console.error('[DB Proxy] Auth error:', error.message)
      return res.status(500).json({ 
        error: 'Server error', 
        message: error.message,
        data: null 
      })
    }
  }
  
  return null
}

// 处理数据库 REST API 请求
async function handleDbRequest(req, res, table, searchParams) {
  const params = Object.fromEntries(searchParams)
  
  console.log('[DB Proxy]', req.method, table, Object.keys(params))
  
  try {
    switch (req.method) {
      case 'GET':
      case 'HEAD': {
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
        if (params.or) {
          const orValue = params.or
          const orMatch = orValue.match(/^\((.+)\)$/)
          if (orMatch) {
            const orConditions = []
            const orParts = orMatch[1].split(',')
            
            for (const part of orParts) {
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
        
        if (req.method === 'HEAD') {
          return res.status(200).setHeader('Content-Length', 0).end()
        }
        
        // 返回 Supabase 标准格式
        return res.status(200).json(result.rows)
      }
      
      case 'POST': {
        const body = req.body
        const data = Array.isArray(body) ? body : [body]
        
        if (data.length === 0) {
          return res.status(400).json({ error: 'No data provided' })
        }
        
        const columns = Object.keys(data[0])
        const placeholders = data.map((_, rowIndex) => 
          `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`
        ).join(', ')
        
        // 处理值：将对象/数组转换为 JSON 字符串
        const values = data.flatMap(row => 
          columns.map(col => processValue(row[col]))
        )
        
        let sql = `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES ${placeholders}`
        
        // 处理冲突
        if (table === 'user_status') {
          const updateSet = columns.map(col => `"${col}" = EXCLUDED."${col}"`).join(', ')
          sql += ` ON CONFLICT (user_id) DO UPDATE SET ${updateSet}`
        }
        
        sql += ' RETURNING *'
        
        console.log('[DB Proxy] INSERT SQL:', sql.replace(/\$\d+/g, '?'))
        console.log('[DB Proxy] INSERT Values:', JSON.stringify(values, null, 2))
        
        const result = await pool.query(sql, values)
        return res.status(201).json(result.rows)
      }
      
      case 'PATCH': {
        const body = req.body
        const setColumns = Object.keys(body)
        const setValues = Object.values(body).map(processValue)
        
        let sql = `UPDATE "${table}" SET ${setColumns.map((col, i) => `"${col}" = $${i + 1}`).join(', ')}`
        const values = [...setValues]
        
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
        return res.status(200).json(result.rows)
      }
      
      case 'DELETE': {
        let sql = `DELETE FROM "${table}"`
        const values = []
        const conditions = []
        let paramIndex = 1
        
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
        return res.status(200).json(result.rows)
      }
      
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('[DB Proxy] Error:', error.message)
    console.error('[DB Proxy] Stack:', error.stack)
    return res.status(500).json({ error: error.message, detail: error.detail })
  }
}

// 主处理函数
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-client-info, prefer, X-Request-Timestamp, X-Request-Signature, X-Request-Id')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  // 获取路径
  const { path } = req.query
  const fullPath = Array.isArray(path) ? path.join('/') : path
  
  console.log('[Vercel DB API] Request:', req.method, fullPath)
  
  try {
    // 处理认证相关请求
    if (fullPath.startsWith('auth/')) {
      const result = await handleAuthRequest(req, res, `/${fullPath}`)
      if (result) return
    }
    
    // 处理 RPC 调用
    if (fullPath.startsWith('rest/v1/rpc/')) {
      const functionName = fullPath.replace('rest/v1/rpc/', '')
      // 这里可以添加 RPC 函数处理
      return res.status(501).json({ error: 'RPC not implemented', function: functionName })
    }
    
    // 处理标准 REST API
    let table = fullPath
    if (table.startsWith('rest/v1/')) {
      table = table.replace('rest/v1/', '')
    }
    
    // 获取查询参数
    const url = new URL(req.url, `http://${req.headers.host}`)
    
    return await handleDbRequest(req, res, table, url.searchParams)
    
  } catch (error) {
    console.error('[Vercel DB API] Error:', error)
    return res.status(500).json({ error: 'Internal Server Error', message: error.message })
  }
}

// 配置 API 路由
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
}
