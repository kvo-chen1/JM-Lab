/**
 * 数据库连接检测服务模块
 * 提供统一的 Neon PostgreSQL 连接检测功能
 */

import { Pool } from 'pg'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()
dotenv.config({ path: '.env.local', override: true })

// 连接状态枚举
export const ConnectionStatus = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  TIMEOUT: 'timeout',
  WARNING: 'warning'
}

// 延迟等级
export const LatencyLevel = {
  GOOD: 'good',      // < 100ms
  NORMAL: 'normal',  // 100-500ms
  WARNING: 'warning', // 500-1000ms
  BAD: 'bad'         // > 1000ms
}

/**
 * 获取连接字符串
 * @returns {string|null}
 */
export const getConnectionString = () => {
  return process.env.POSTGRES_URL_NON_POOLING ||
         process.env.DATABASE_URL ||
         process.env.POSTGRES_URL ||
         process.env.NEON_DATABASE_URL ||
         process.env.NEON_URL ||
         process.env.NEON_POSTGRES_URL ||
         process.env.NEON_DATABASE_URL_UNPOOLED ||
         process.env.NEON_POSTGRES_URL_NON_POOLING ||
         process.env.NETLIFY_DATABASE_URL ||
         process.env.NETLIFY_DATABASE_URL_UNPOOLED
}

/**
 * 判断是否为 Neon 数据库
 * @param {string} connectionString
 * @returns {boolean}
 */
export const isNeonDatabase = (connectionString) => {
  if (!connectionString) return false
  return connectionString.includes('neon.tech') ||
         connectionString.includes('.neon.')
}

/**
 * 获取延迟等级
 * @param {number} latencyMs
 * @returns {string}
 */
export const getLatencyLevel = (latencyMs) => {
  if (latencyMs < 100) return LatencyLevel.GOOD
  if (latencyMs < 500) return LatencyLevel.NORMAL
  if (latencyMs < 1000) return LatencyLevel.WARNING
  return LatencyLevel.BAD
}

/**
 * 创建临时连接池（用于检测）
 * @returns {Pool|null}
 */
export const createCheckPool = () => {
  const connectionString = getConnectionString()
  if (!connectionString) return null

  return new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    max: 2,
    min: 0,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 10000
  })
}

/**
 * 测试数据库连接
 * @param {Object} options
 * @param {number} options.timeout - 超时时间（毫秒）
 * @returns {Promise<Object>}
 */
export const testConnection = async (options = {}) => {
  const { timeout = 10000 } = options
  const startTime = Date.now()
  const connectionString = getConnectionString()

  if (!connectionString) {
    return {
      status: ConnectionStatus.ERROR,
      connected: false,
      error: '未找到数据库连接字符串',
      errorCode: 'NO_CONNECTION_STRING',
      timestamp: new Date().toISOString(),
      responseTime: 0
    }
  }

  const pool = createCheckPool()
  if (!pool) {
    return {
      status: ConnectionStatus.ERROR,
      connected: false,
      error: '无法创建连接池',
      errorCode: 'POOL_CREATION_FAILED',
      timestamp: new Date().toISOString(),
      responseTime: 0
    }
  }

  try {
    // 设置超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('连接超时')), timeout)
    })

    // 测试连接
    const connectionPromise = (async () => {
      const client = await pool.connect()
      try {
        const result = await client.query('SELECT NOW() as now, version() as version')
        return result.rows[0]
      } finally {
        client.release()
      }
    })()

    const result = await Promise.race([connectionPromise, timeoutPromise])
    const responseTime = Date.now() - startTime

    await pool.end()

    return {
      status: ConnectionStatus.CONNECTED,
      connected: true,
      timestamp: new Date().toISOString(),
      responseTime,
      latencyLevel: getLatencyLevel(responseTime),
      database: {
        type: isNeonDatabase(connectionString) ? 'neon' : 'postgresql',
        version: result.version?.split(' ').slice(0, 3).join(' '),
        serverTime: result.now
      },
      connectionString: connectionString.replace(/:[^:@]+@/, ':***@')
    }
  } catch (error) {
    await pool.end()
    const responseTime = Date.now() - startTime

    let status = ConnectionStatus.ERROR
    let errorCode = 'CONNECTION_ERROR'

    if (error.message === '连接超时') {
      status = ConnectionStatus.TIMEOUT
      errorCode = 'CONNECTION_TIMEOUT'
    } else if (error.code === 'ECONNREFUSED') {
      errorCode = 'CONNECTION_REFUSED'
    } else if (error.code === 'ENOTFOUND') {
      errorCode = 'HOST_NOT_FOUND'
    } else if (error.code === '28P01') {
      errorCode = 'AUTHENTICATION_FAILED'
    } else if (error.code === '3D000') {
      errorCode = 'DATABASE_NOT_FOUND'
    }

    return {
      status,
      connected: false,
      error: error.message,
      errorCode,
      timestamp: new Date().toISOString(),
      responseTime,
      connectionString: connectionString.replace(/:[^:@]+@/, ':***@')
    }
  }
}

/**
 * 获取连接池状态
 * @returns {Promise<Object>}
 */
export const getPoolStatus = async () => {
  const connectionString = getConnectionString()

  if (!connectionString) {
    return {
      available: false,
      error: '未找到数据库连接字符串'
    }
  }

  const pool = createCheckPool()
  if (!pool) {
    return {
      available: false,
      error: '无法创建连接池'
    }
  }

  try {
    const client = await pool.connect()

    // 获取连接池统计信息
    const poolStats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    }

    // 获取数据库统计信息
    const statsResult = await client.query(`
      SELECT 
        count(*) as active_connections
      FROM pg_stat_activity 
      WHERE state = 'active'
    `)

    // 获取最大连接数
    const maxConnectionsResult = await client.query(`
      SHOW max_connections
    `)

    client.release()
    await pool.end()

    return {
      available: true,
      pool: poolStats,
      database: {
        activeConnections: parseInt(statsResult.rows[0].active_connections),
        maxConnections: parseInt(maxConnectionsResult.rows[0].max_connections)
      }
    }
  } catch (error) {
    await pool.end()
    return {
      available: false,
      error: error.message
    }
  }
}

/**
 * 执行详细的健康检查
 * @returns {Promise<Object>}
 */
export const healthCheck = async () => {
  const startTime = Date.now()
  const connectionResult = await testConnection()

  if (!connectionResult.connected) {
    return {
      healthy: false,
      status: connectionResult.status,
      timestamp: new Date().toISOString(),
      totalCheckTime: Date.now() - startTime,
      connection: connectionResult
    }
  }

  const poolStatus = await getPoolStatus()

  // 判断健康状态
  let healthy = true
  let status = ConnectionStatus.CONNECTED

  if (connectionResult.responseTime > 1000) {
    status = ConnectionStatus.WARNING
  }

  if (poolStatus.available && poolStatus.database) {
    const usagePercent = (poolStatus.database.activeConnections / poolStatus.database.maxConnections) * 100
    if (usagePercent > 80) {
      status = ConnectionStatus.WARNING
    }
  }

  return {
    healthy,
    status,
    timestamp: new Date().toISOString(),
    totalCheckTime: Date.now() - startTime,
    connection: connectionResult,
    pool: poolStatus
  }
}

/**
 * 检查数据库表结构
 * @returns {Promise<Object>}
 */
export const checkTables = async () => {
  const connectionString = getConnectionString()
  if (!connectionString) {
    return { error: '未找到数据库连接字符串' }
  }

  const pool = createCheckPool()
  if (!pool) {
    return { error: '无法创建连接池' }
  }

  try {
    const client = await pool.connect()

    // 获取所有表
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    // 获取关键表的数量
    const criticalTables = ['users', 'works', 'posts', 'events']
    const tableCounts = {}

    for (const table of criticalTables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) FROM "${table}"`)
        tableCounts[table] = parseInt(countResult.rows[0].count)
      } catch (e) {
        tableCounts[table] = -1 // 表不存在或错误
      }
    }

    client.release()
    await pool.end()

    return {
      totalTables: tablesResult.rows.length,
      tables: tablesResult.rows.map(r => r.table_name),
      criticalTables: tableCounts
    }
  } catch (error) {
    await pool.end()
    return { error: error.message }
  }
}

/**
 * 获取完整的连接诊断信息
 * @returns {Promise<Object>}
 */
export const getFullDiagnostics = async () => {
  const startTime = Date.now()

  const [health, tables] = await Promise.all([
    healthCheck(),
    checkTables()
  ])

  return {
    timestamp: new Date().toISOString(),
    totalCheckTime: Date.now() - startTime,
    environment: {
      nodeEnv: process.env.NODE_ENV,
      isVercel: process.env.VERCEL === '1',
      vercelEnv: process.env.VERCEL_ENV
    },
    health,
    tables
  }
}

export default {
  ConnectionStatus,
  LatencyLevel,
  getConnectionString,
  isNeonDatabase,
  getLatencyLevel,
  testConnection,
  getPoolStatus,
  healthCheck,
  checkTables,
  getFullDiagnostics
}
