// 兼容层：将 Supabase 风格的调用转换为 PostgreSQL 查询
// 用于替代原有的 Supabase 服务端客户端
import { getDB } from './database.mjs'

// 创建一个模拟 Supabase 接口的客户端
function createMockSupabaseClient() {
  return {
    from: (table) => createTableQueryBuilder(table),
    rpc: (fnName, params) => executeRPC(fnName, params),
    auth: {
      admin: {
        listUsers: async () => ({ data: { users: [] }, error: null }),
        createUser: async () => ({ data: { user: null }, error: null }),
        deleteUser: async () => ({ data: {}, error: null })
      }
    },
    storage: {
      from: (bucket) => ({
        upload: async () => ({ data: null, error: new Error('Storage not implemented') }),
        getPublicUrl: (path) => ({ data: { publicUrl: path } }),
        download: async () => ({ data: null, error: new Error('Storage not implemented') }),
        remove: async () => ({ data: null, error: new Error('Storage not implemented') })
      })
    }
  }
}

// 创建表查询构建器
function createTableQueryBuilder(table) {
  let query = {
    table,
    selectColumns: '*',
    filters: [],
    orderColumn: null,
    orderAscending: true,
    limitValue: null,
    singleValue: false,
    rangeStart: null,
    rangeEnd: null
  }

  const builder = {
    select: (columns = '*') => {
      query.selectColumns = columns
      return builder
    },

    insert: (data, options = {}) => {
      query.operation = 'insert'
      query.insertData = Array.isArray(data) ? data : [data]
      return builder
    },

    update: (data) => {
      query.operation = 'update'
      query.updateData = data
      return builder
    },

    delete: () => {
      query.operation = 'delete'
      return builder
    },

    eq: (column, value) => {
      query.filters.push({ type: 'eq', column, value })
      return builder
    },

    neq: (column, value) => {
      query.filters.push({ type: 'neq', column, value })
      return builder
    },

    gt: (column, value) => {
      query.filters.push({ type: 'gt', column, value })
      return builder
    },

    gte: (column, value) => {
      query.filters.push({ type: 'gte', column, value })
      return builder
    },

    lt: (column, value) => {
      query.filters.push({ type: 'lt', column, value })
      return builder
    },

    lte: (column, value) => {
      query.filters.push({ type: 'lte', column, value })
      return builder
    },

    like: (column, pattern) => {
      query.filters.push({ type: 'like', column, value: pattern })
      return builder
    },

    ilike: (column, pattern) => {
      query.filters.push({ type: 'ilike', column, value: pattern })
      return builder
    },

    in: (column, values) => {
      query.filters.push({ type: 'in', column, value: values })
      return builder
    },

    is: (column, value) => {
      query.filters.push({ type: 'is', column, value })
      return builder
    },

    not: (column, operator, value) => {
      query.filters.push({ type: 'not', column, operator, value })
      return builder
    },

    or: (conditions) => {
      query.filters.push({ type: 'or', conditions })
      return builder
    },

    and: (conditions) => {
      query.filters.push({ type: 'and', conditions })
      return builder
    },

    order: (column, options = {}) => {
      query.orderColumn = column
      query.orderAscending = options.ascending !== false
      return builder
    },

    limit: (count) => {
      query.limitValue = count
      return builder
    },

    range: (start, end) => {
      query.rangeStart = start
      query.rangeEnd = end
      return builder
    },

    single: () => {
      query.singleValue = true
      return builder
    },

    count: (options = {}) => {
      query.countOption = options
      return builder
    },

    then: async (resolve, reject) => {
      try {
        const result = await executeQuery(query)
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }
  }

  return builder
}

// 执行查询
async function executeQuery(query) {
  const db = await getDB()

  try {
    let sql = ''
    let params = []
    let paramIndex = 1

    switch (query.operation) {
      case 'insert':
        const columns = Object.keys(query.insertData[0])
        const values = query.insertData.map(row => {
          const rowValues = columns.map(col => {
            params.push(row[col])
            return `$${paramIndex++}`
          })
          return `(${rowValues.join(', ')})`
        })
        sql = `INSERT INTO ${query.table} (${columns.join(', ')}) VALUES ${values.join(', ')} RETURNING *`
        break

      case 'update':
        const setClauses = Object.keys(query.updateData).map(key => {
          params.push(query.updateData[key])
          return `${key} = $${paramIndex++}`
        })
        sql = `UPDATE ${query.table} SET ${setClauses.join(', ')}`
        break

      case 'delete':
        sql = `DELETE FROM ${query.table}`
        break

      default: // select
        if (query.countOption) {
          sql = `SELECT COUNT(*) as count FROM ${query.table}`
        } else {
          sql = `SELECT ${query.selectColumns} FROM ${query.table}`
        }
    }

    // 构建 WHERE 子句
    if (query.filters.length > 0) {
      const whereClauses = query.filters.map(filter => {
        switch (filter.type) {
          case 'eq':
            params.push(filter.value)
            return `${filter.column} = $${paramIndex++}`
          case 'neq':
            params.push(filter.value)
            return `${filter.column} != $${paramIndex++}`
          case 'gt':
            params.push(filter.value)
            return `${filter.column} > $${paramIndex++}`
          case 'gte':
            params.push(filter.value)
            return `${filter.column} >= $${paramIndex++}`
          case 'lt':
            params.push(filter.value)
            return `${filter.column} < $${paramIndex++}`
          case 'lte':
            params.push(filter.value)
            return `${filter.column} <= $${paramIndex++}`
          case 'like':
            params.push(filter.value)
            return `${filter.column} LIKE $${paramIndex++}`
          case 'ilike':
            params.push(filter.value)
            return `${filter.column} ILIKE $${paramIndex++}`
          case 'in':
            const inPlaceholders = filter.value.map(() => `$${paramIndex++}`).join(', ')
            params.push(...filter.value)
            return `${filter.column} IN (${inPlaceholders})`
          case 'is':
            if (filter.value === null) {
              return `${filter.column} IS NULL`
            }
            params.push(filter.value)
            return `${filter.column} IS $${paramIndex++}`
          default:
            return ''
        }
      }).filter(Boolean)

      if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`
      }
    }

    // 添加 ORDER BY
    if (query.orderColumn && !query.countOption) {
      sql += ` ORDER BY ${query.orderColumn} ${query.orderAscending ? 'ASC' : 'DESC'}`
    }

    // 添加 LIMIT
    if (query.limitValue !== null) {
      sql += ` LIMIT $${paramIndex++}`
      params.push(query.limitValue)
    }

    // 添加 OFFSET (用于 range)
    if (query.rangeStart !== null) {
      sql += ` OFFSET $${paramIndex++}`
      params.push(query.rangeStart)
    }

    const result = await db.query(sql, params)

    if (query.countOption) {
      return {
        data: null,
        count: parseInt(result.rows[0].count),
        error: null
      }
    }

    if (query.singleValue) {
      return {
        data: result.rows[0] || null,
        error: null
      }
    }

    return {
      data: result.rows,
      error: null
    }
  } catch (error) {
    console.error('[SupabaseServer] Query error:', error)
    return {
      data: null,
      error: {
        message: error.message,
        code: error.code
      }
    }
  }
}

// 执行 RPC 函数
async function executeRPC(fnName, params = {}) {
  const db = await getDB()

  try {
    const paramKeys = Object.keys(params)
    const paramValues = Object.values(params)

    let sql
    if (paramKeys.length > 0) {
      const placeholders = paramKeys.map((_, i) => `$${i + 1}`).join(', ')
      sql = `SELECT * FROM ${fnName}(${placeholders})`
    } else {
      sql = `SELECT * FROM ${fnName}()`
    }

    const result = await db.query(sql, paramValues)

    return {
      data: result.rows,
      error: null
    }
  } catch (error) {
    console.error('[SupabaseServer] RPC error:', error)
    return {
      data: null,
      error: {
        message: error.message,
        code: error.code
      }
    }
  }
}

// 导出模拟的 Supabase 服务端客户端
export const supabaseServer = createMockSupabaseClient()

// 导出测试连接函数
export async function testConnection() {
  try {
    const db = await getDB()
    const result = await db.query('SELECT 1')
    return { success: true, data: result.rows }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export default supabaseServer
