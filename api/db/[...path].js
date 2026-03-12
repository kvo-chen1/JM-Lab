// Vercel API Route - Supabase 兼容的数据库代理
// 处理所有 /api/db/* 请求

import { Pool } from 'pg'

// 连接池延迟初始化
let pool = null

// 获取连接池（延迟初始化）
function getPool() {
  if (pool) return pool

  // 获取环境变量
  const databaseUrl = process.env.POSTGRES_URL_NON_POOLING ||
                      process.env.DATABASE_URL ||
                      process.env.POSTGRES_URL

  if (!databaseUrl) {
    console.error('[DB Pool] No database URL configured')
    return null
  }

  console.log('[DB Pool] Creating connection pool...')

  try {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      min: 2,
      idleTimeoutMillis: 120000,
      connectionTimeoutMillis: 60000,
      statement_timeout: 60000,
      query_timeout: 60000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000
    })

    pool.on('error', (err) => {
      console.error('[DB Pool] Unexpected error:', err.message)
    })

    pool.on('connect', () => {
      console.log('[DB Pool] New client connected')
    })

    return pool
  } catch (error) {
    console.error('[DB Pool] Failed to create pool:', error.message)
    return null
  }
}

// 带重试的查询函数
async function queryWithRetry(sql, params, maxRetries = 3) {
  const pool = getPool()
  if (!pool) {
    throw new Error('Database not configured')
  }

  let lastError
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await pool.query(sql, params)
      return result
    } catch (error) {
      lastError = error
      console.error(`[DB Proxy] Query attempt ${i + 1} failed:`, error.message)

      // 如果是连接错误，等待后重试
      if (error.message.includes('disconnected') ||
          error.message.includes('terminated') ||
          error.message.includes('ECONNRESET') ||
          error.message.includes('timeout') ||
          error.message.includes('Connection')) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        continue
      }

      // 其他错误直接抛出
      throw error
    }
  }
  throw lastError
}

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

  if (value === undefined || value === null) {
    console.warn(`[DB Proxy] Invalid value for key "${key}":`, value)
    return { operator: '=', value: '', isArray: false }
  }

  const valueStr = String(value)

  for (const [op, sqlOp] of Object.entries(operators)) {
    const prefix = `${op}.`
    if (valueStr.startsWith(prefix)) {
      const actualValue = valueStr.slice(prefix.length)

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

  return { operator: '=', value: valueStr, isArray: false }
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

// 处理认证相关的请求
async function handleAuthRequest(req, res, path) {
  if (req.method === 'GET' && path === '/api/db/auth/v1/user') {
    const user = verifyToken(req)
    if (!user) {
      sendJson(res, 401, { error: 'Unauthorized', message: '未授权访问' })
      return true
    }

    try {
      const result = await queryWithRetry(
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

// 处理 RPC 调用
async function handleRpcRequest(req, res, path) {
  const rpcMatch = path.match(/\/api\/db\/rest\/v1\/rpc\/(.+)/)
  if (!rpcMatch) return false

  const funcName = rpcMatch[1]
  const body = await readBody(req)

  console.log('[DB Proxy] RPC call:', funcName, body)

  try {
    const paramKeys = Object.keys(body)
    const paramValues = Object.values(body)
    const paramPlaceholders = paramKeys.length > 0
      ? paramKeys.map((_, i) => `$${i + 1}`).join(', ')
      : ''

    const sql = paramPlaceholders
      ? `SELECT * FROM ${funcName}(${paramPlaceholders})`
      : `SELECT * FROM ${funcName}()`

    console.log('[DB Proxy] RPC SQL:', sql, paramValues)

    try {
      const result = await queryWithRetry(sql, paramValues)
      sendJson(res, 200, result.rows)
    } catch (queryError) {
      console.error('[DB Proxy] RPC error:', queryError.message)
      sendJson(res, 500, { error: queryError.message })
    }
    return true
  } catch (error) {
    console.error('[DB Proxy] RPC error:', error.message)
    sendJson(res, 500, { error: error.message })
    return true
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

  // 检查数据库配置
  const pool = getPool()
  if (!pool) {
    console.error('[Vercel DB API] Database not configured')
    // 对于GET请求，返回空数据而不是错误
    if (req.method === 'GET') {
      return res.status(200).json([])
    }
    return res.status(503).json({
      error: 'Database not configured',
      message: '数据库未配置，请检查环境变量'
    })
  }

  try {
    // 处理认证相关的请求
    if (fullPath.startsWith('auth/')) {
      const handled = await handleAuthRequest(req, res, `/${fullPath}`)
      if (handled) return
    }

    // 处理 RPC 调用
    if (fullPath.includes('/rpc/')) {
      const handled = await handleRpcRequest(req, res, `/${fullPath}`)
      if (handled) return
    }

    // 提取表名
    let table = fullPath.replace('/api/db/', '').split('?')[0]
    if (table.startsWith('rest/v1/')) {
      table = table.replace('rest/v1/', '')
    }
    table = table.replace(/^\//, '')

    const u = new URL(req.url, `http://${req.headers.host}`)
    const params = Object.fromEntries(u.searchParams)

    console.log('[DB Proxy]', req.method, table, Object.keys(params))

    // 标记是否是 HEAD 请求
    const isHeadRequest = req.method === 'HEAD'

    switch (req.method) {
      case 'GET':
      case 'HEAD': {
        const select = params.select || '*'
        const isCountQuery = isHeadRequest
        let sql = isCountQuery
          ? `SELECT COUNT(*) as count FROM "${table}"`
          : `SELECT ${select} FROM "${table}"`
        const values = []
        const conditions = []
        let paramIndex = 1

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

        if (params.order) {
          const orderParts = params.order.split(',')
          const orderClauses = orderParts.map(part => {
            const [col, dir] = part.trim().split('.')
            return `"${col}" ${dir === 'desc' ? 'DESC' : 'ASC'}`
          })
          sql += ` ORDER BY ${orderClauses.join(', ')}`
        }

        if (params.limit) {
          sql += ` LIMIT ${parseInt(params.limit)}`
        }
        if (params.offset) {
          sql += ` OFFSET ${parseInt(params.offset)}`
        }

        console.log('[DB Proxy] SQL:', sql.replace(/\$\d+/g, '?'), 'Values:', values)

        try {
          const result = await queryWithRetry(sql, values)
          if (isCountQuery) {
            const count = result.rows[0]?.count || 0
            res.setHeader('Content-Range', `0-${count}/${count}`)
            res.setHeader('X-Total-Count', count)
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end()
            return
          }
          sendJson(res, 200, result.rows)
        } catch (queryError) {
          console.error('[DB Proxy] Query error:', queryError.message)
          sendJson(res, 500, { error: queryError.message })
        }
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

        let sql = `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES ${placeholders}`

        if (table === 'user_status') {
          const updateSet = columns.map(col => `"${col}" = EXCLUDED."${col}"`).join(', ')
          sql += ` ON CONFLICT (user_id) DO UPDATE SET ${updateSet}`
        }

        sql += ' RETURNING *'

        try {
          const result = await queryWithRetry(sql, values)
          sendJson(res, 201, result.rows)
        } catch (queryError) {
          console.error('[DB Proxy] Insert error:', queryError.message)
          sendJson(res, 500, { error: queryError.message })
        }
        break
      }

      case 'PATCH': {
        const body = await readBody(req)
        const setColumns = Object.keys(body)
        const setValues = Object.values(body)

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

        try {
          const result = await queryWithRetry(sql, values)
          sendJson(res, 200, result.rows)
        } catch (queryError) {
          console.error('[DB Proxy] Update error:', queryError.message)
          sendJson(res, 500, { error: queryError.message })
        }
        break
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

        try {
          const result = await queryWithRetry(sql, values)
          sendJson(res, 200, result.rows)
        } catch (queryError) {
          console.error('[DB Proxy] Delete error:', queryError.message)
          sendJson(res, 500, { error: queryError.message })
        }
        break
      }

      default:
        sendJson(res, 405, { error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('[Vercel DB API] Error:', error.message)
    sendJson(res, 500, { error: error.message })
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
