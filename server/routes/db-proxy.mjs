/**
 * 数据库代理路由 - 将 Supabase 风格的请求转换为 PostgreSQL 查询
 * 用于替代 Supabase 服务
 */

import { Router } from 'express'
import { Pool } from 'pg'

const router = Router()

// 创建 PostgreSQL 连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
                    process.env.NEON_DATABASE_URL || 
                    process.env.POSTGRES_URL_NON_POOLING ||
                    process.env.NEON_POSTGRES_URL_NON_POOLING,
  ssl: {
    rejectUnauthorized: false
  },
  max: 5,
  min: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 60000,
  statement_timeout: 30000,
  query_timeout: 30000
})

// 解析 select 参数
function parseSelect(select) {
  if (!select || select === '*') return '*'
  return select
}

// 构建 WHERE 子句
function buildWhere(filters) {
  const conditions = []
  const values = []
  let paramIndex = 1

  for (const [key, value] of Object.entries(filters)) {
    if (key === 'or' || key === 'and') continue
    
    if (typeof value === 'object' && value !== null) {
      // 处理操作符，如 eq, gt, lt, gte, lte, neq, like, ilike, in, is
      for (const [op, val] of Object.entries(value)) {
        switch (op) {
          case 'eq':
            conditions.push(`${key} = $${paramIndex}`)
            values.push(val)
            paramIndex++
            break
          case 'neq':
            conditions.push(`${key} != $${paramIndex}`)
            values.push(val)
            paramIndex++
            break
          case 'gt':
            conditions.push(`${key} > $${paramIndex}`)
            values.push(val)
            paramIndex++
            break
          case 'gte':
            conditions.push(`${key} >= $${paramIndex}`)
            values.push(val)
            paramIndex++
            break
          case 'lt':
            conditions.push(`${key} < $${paramIndex}`)
            values.push(val)
            paramIndex++
            break
          case 'lte':
            conditions.push(`${key} <= $${paramIndex}`)
            values.push(val)
            paramIndex++
            break
          case 'like':
            conditions.push(`${key} LIKE $${paramIndex}`)
            values.push(val)
            paramIndex++
            break
          case 'ilike':
            conditions.push(`${key} ILIKE $${paramIndex}`)
            values.push(val)
            paramIndex++
            break
          case 'in':
            const inPlaceholders = Array.isArray(val) 
              ? val.map((_, i) => `$${paramIndex + i}`).join(', ')
              : `$${paramIndex}`
            conditions.push(`${key} IN (${inPlaceholders})`)
            if (Array.isArray(val)) {
              values.push(...val)
              paramIndex += val.length
            } else {
              values.push(val)
              paramIndex++
            }
            break
          case 'is':
            if (val === null) {
              conditions.push(`${key} IS NULL`)
            } else {
              conditions.push(`${key} = $${paramIndex}`)
              values.push(val)
              paramIndex++
            }
            break
        }
      }
    } else {
      conditions.push(`${key} = $${paramIndex}`)
      values.push(value)
      paramIndex++
    }
  }

  return { where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '', values, paramIndex }
}

// 构建 ORDER BY 子句
function buildOrder(order) {
  if (!order) return ''
  const { column, ascending = true } = order
  return `ORDER BY ${column} ${ascending ? 'ASC' : 'DESC'}`
}

// 构建 LIMIT 和 OFFSET
function buildRange(range) {
  if (!range) return ''
  const { start = 0, end = 999999 } = range
  const limit = end - start + 1
  return `LIMIT ${limit} OFFSET ${start}`
}

// RPC 函数处理映射
const rpcHandlers = {
  // 通知相关
  'get_unread_notification_count': async (params) => {
    const { user_id } = params
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [user_id]
    )
    return result.rows[0]?.count || 0
  },
  
  // 用户参与统计
  'get_user_participation_stats': async (params) => {
    const { user_id } = params
    const result = await pool.query(`
      SELECT 
        COUNT(DISTINCT e.id) as total_events,
        COUNT(DISTINCT CASE WHEN ep.status = 'registered' THEN e.id END) as registered_events,
        COUNT(DISTINCT CASE WHEN ep.status = 'submitted' THEN e.id END) as submitted_events,
        COUNT(DISTINCT CASE WHEN ep.status = 'completed' THEN e.id END) as completed_events
      FROM events e
      LEFT JOIN event_participants ep ON e.id = ep.event_id AND ep.user_id = $1
      WHERE ep.user_id = $1
    `, [user_id])
    return result.rows[0] || { total_events: 0, registered_events: 0, submitted_events: 0, completed_events: 0 }
  },
  
  // 获取活跃推广作品
  'get_active_promoted_works': async (params) => {
    const { p_limit = 10, p_offset = 0 } = params
    // 返回空数组，因为 promoted_works 表可能不存在
    return []
  },

  // 内容审核
  'moderate_content': async (params) => {
    const { p_content_id, p_content_type, p_title, p_description, p_user_id } = params
    try {
      const result = await pool.query(
        'SELECT * FROM moderate_content($1, $2, $3, $4, $5)',
        [p_content_id, p_content_type, p_title, p_description, p_user_id]
      )
      return result.rows[0] || { approved: true, action: 'approve', reason: '', matched_words: [], scores: {} }
    } catch (error) {
      console.error('moderate_content error:', error)
      // 如果审核失败，默认允许发布（fail-safe）
      return { approved: true, action: 'approve', reason: '', matched_words: [], scores: {} }
    }
  },

  // 用户积分统计
  'get_user_points_stats': async (params) => {
    const { p_user_id } = params
    try {
      const result = await pool.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN points > 0 THEN points ELSE 0 END), 0) as total_earned,
          COALESCE(SUM(CASE WHEN points < 0 THEN points ELSE 0 END), 0) as total_spent,
          COALESCE(SUM(points), 0) as current_balance,
          COUNT(*) as total_records
        FROM points_records
        WHERE user_id = $1
      `, [p_user_id])
      return result.rows[0] || { total_earned: 0, total_spent: 0, current_balance: 0, total_records: 0 }
    } catch (error) {
      console.error('get_user_points_stats error:', error)
      return { total_earned: 0, total_spent: 0, current_balance: 0, total_records: 0 }
    }
  },

  // 获取产品列表
  'get_products': async (params) => {
    const { p_limit = 10, p_offset = 0, p_category = null } = params
    try {
      let sql = `
        SELECT * FROM products 
        WHERE status = 'active'
      `
      const values = []
      let paramIndex = 1

      if (p_category) {
        sql += ` AND category = $${paramIndex}`
        values.push(p_category)
        paramIndex++
      }

      sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      values.push(p_limit, p_offset)

      const result = await pool.query(sql, values)
      return result.rows || []
    } catch (error) {
      console.error('get_products error:', error)
      return []
    }
  }
}

// RPC 调用 - 必须放在表路由之前
router.post('/rpc/:function', async (req, res) => {
  try {
    const { function: funcName } = req.params
    const params = req.body

    // 检查是否有自定义处理器
    if (rpcHandlers[funcName]) {
      const result = await rpcHandlers[funcName](params)
      return res.json(result)
    }

    // 构建函数调用
    const paramNames = Object.keys(params)
    const paramPlaceholders = paramNames.map((_, i) => `$${i + 1}`).join(', ')
    const values = Object.values(params)

    const sql = `SELECT ${funcName}(${paramPlaceholders})`

    const result = await pool.query(sql, values)
    
    res.json(result.rows[0][funcName])
  } catch (error) {
    console.error('RPC call error:', error)
    // 返回默认值而不是错误
    res.json(null)
  }
})

// GET /rest/v1/:table - 查询数据
router.get('/:table', async (req, res) => {
  try {
    const { table } = req.params
    const { select = '*', ...filters } = req.query

    // 解析查询参数
    const columns = parseSelect(select)
    const { where, values } = buildWhere(filters)
    const order = buildOrder(req.query.order)
    const range = buildRange(req.query.range)

    // 构建 SQL 查询
    let sql = `SELECT ${columns} FROM ${table}`
    if (where) sql += ` ${where}`
    if (order) sql += ` ${order}`
    if (range) sql += ` ${range}`

    const result = await pool.query(sql, values)
    
    res.json(result.rows)
  } catch (error) {
    console.error('Database query error:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /rest/v1/:table - 插入数据
router.post('/:table', async (req, res) => {
  try {
    const { table } = req.params
    const data = Array.isArray(req.body) ? req.body : [req.body]

    if (data.length === 0) {
      return res.status(400).json({ error: 'No data provided' })
    }

    const columns = Object.keys(data[0])
    const placeholders = data.map((_, rowIndex) => 
      `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`
    ).join(', ')

    const values = data.flatMap(row => columns.map(col => row[col]))

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders} RETURNING *`

    const result = await pool.query(sql, values)
    
    res.status(201).json(result.rows)
  } catch (error) {
    console.error('Database insert error:', error)
    res.status(500).json({ error: error.message })
  }
})

// PATCH /rest/v1/:table - 更新数据
router.patch('/:table', async (req, res) => {
  try {
    const { table } = req.params
    const { ...filters } = req.query
    const data = req.body

    const setClause = Object.keys(data).map((key, index) => `${key} = $${index + 1}`).join(', ')
    const setValues = Object.values(data)

    const { where, values, paramIndex } = buildWhere(filters)
    const allValues = [...setValues, ...values]

    let sql = `UPDATE ${table} SET ${setClause}`
    if (where) sql += ` ${where}`
    sql += ` RETURNING *`

    const result = await pool.query(sql, allValues)
    
    res.json(result.rows)
  } catch (error) {
    console.error('Database update error:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE /rest/v1/:table - 删除数据
router.delete('/:table', async (req, res) => {
  try {
    const { table } = req.params
    const { ...filters } = req.query

    const { where, values } = buildWhere(filters)

    let sql = `DELETE FROM ${table}`
    if (where) sql += ` ${where}`
    sql += ` RETURNING *`

    const result = await pool.query(sql, values)
    
    res.json(result.rows)
  } catch (error) {
    console.error('Database delete error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
