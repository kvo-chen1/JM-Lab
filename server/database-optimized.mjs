/**
 * 优化的数据库连接模块
 * 针对 Neon PostgreSQL 进行性能优化
 */

import { Pool } from 'pg'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 检查是否在 Vercel 环境
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV

// 加载环境变量
if (!isVercel) {
  const envPath = path.join(__dirname, '..', '.env')
  const envLocalPath = path.join(__dirname, '..', '.env.local')

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
  }
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath, override: true })
  }
}

// 日志函数
const log = (msg, level = 'INFO') => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [DB-OPT:${level}] ${msg}`)
}

/**
 * 获取优化的连接字符串
 * 优先使用直连地址而非 pooler 地址
 */
const getOptimizedConnectionString = () => {
  // 1. 优先使用非池化连接（直连）
  const nonPoolingUrl = process.env.NEON_DATABASE_URL_UNPOOLED ||
                       process.env.NEON_POSTGRES_URL_NON_POOLING ||
                       process.env.POSTGRES_URL_NON_POOLING
  
  if (nonPoolingUrl) {
    // 检查是否真的是非池化地址（不包含 -pooler）
    if (!nonPoolingUrl.includes('-pooler')) {
      log('Using direct (non-pooled) connection')
      return nonPoolingUrl
    }
  }

  // 2. 尝试转换池化地址为直连地址
  const poolerUrl = process.env.DATABASE_URL || 
                   process.env.NEON_DATABASE_URL || 
                   process.env.NEON_URL ||
                   process.env.POSTGRES_URL
  
  if (poolerUrl && poolerUrl.includes('-pooler')) {
    // 将 pooler 地址转换为直连地址
    // ep-shy-bar-ajp9o0kn-pooler.c-3.us-east-2.aws.neon.tech -> ep-shy-bar-ajp9o0kn.c-3.us-east-2.aws.neon.tech
    const directUrl = poolerUrl.replace(/-pooler(\.[a-z]-\d)/, '$1')
    log('Converted pooler URL to direct connection')
    return directUrl
  }

  // 3. 使用原始地址
  return poolerUrl
}

/**
 * 连接池配置
 */
const getPoolConfig = () => {
  const connectionString = getOptimizedConnectionString()
  
  if (!connectionString) {
    throw new Error('No database connection string found')
  }

  // 判断是否为直连
  const isDirectConnection = !connectionString.includes('-pooler')
  
  // 基础配置
  const baseConfig = {
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    // 客户端编码
    client_encoding: 'UTF8',
    // 应用名称（便于在 Neon 控制台识别）
    application_name: 'jinmai-app',
  }

  if (isDirectConnection) {
    // 直连模式：使用更大的连接池
    return {
      ...baseConfig,
      max: parseInt(process.env.POSTGRES_MAX_POOL_SIZE || '10'),
      min: parseInt(process.env.POSTGRES_MIN_POOL_SIZE || '2'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      // 保持连接活跃
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    }
  } else {
    // Pooler 模式：使用较小的连接池
    return {
      ...baseConfig,
      max: parseInt(process.env.POSTGRES_MAX_POOL_SIZE || '5'),
      min: parseInt(process.env.POSTGRES_MIN_POOL_SIZE || '1'),
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000,
    }
  }
}

// 全局连接池实例
let pool = null
let poolStats = {
  totalQueries: 0,
  failedQueries: 0,
  avgQueryTime: 0,
  lastError: null
}

/**
 * 初始化连接池
 */
export const initPool = async () => {
  if (pool) {
    return pool
  }

  const config = getPoolConfig()
  log(`Initializing pool with max: ${config.max}, min: ${config.min}`)

  pool = new Pool(config)

  // 连接错误处理
  pool.on('error', (err, client) => {
    log(`Unexpected pool error: ${err.message}`, 'ERROR')
    poolStats.lastError = err.message
  })

  // 连接成功事件
  pool.on('connect', () => {
    log('New client connected to pool')
  })

  // 预热连接池
  await warmupPool()

  return pool
}

/**
 * 预热连接池
 * 预先建立最小连接数，减少首次查询延迟
 */
const warmupPool = async () => {
  const minConnections = parseInt(process.env.POSTGRES_MIN_POOL_SIZE || '2')
  log(`Warming up pool with ${minConnections} connections...`)

  const warmupStart = Date.now()
  const connections = []

  try {
    // 并行建立连接
    for (let i = 0; i < minConnections; i++) {
      connections.push(
        pool.connect().then(client => {
          // 执行简单查询保持连接活跃
          return client.query('SELECT 1').then(() => {
            client.release()
            return true
          })
        })
      )
    }

    await Promise.all(connections)
    log(`Pool warmup completed in ${Date.now() - warmupStart}ms`)
  } catch (error) {
    log(`Pool warmup failed: ${error.message}`, 'ERROR')
  }
}

/**
 * 获取连接池
 */
export const getPool = () => {
  if (!pool) {
    throw new Error('Pool not initialized. Call initPool() first.')
  }
  return pool
}

/**
 * 执行查询（带性能监控）
 */
export const query = async (sql, params = []) => {
  if (!pool) {
    await initPool()
  }

  const startTime = Date.now()
  let client = null

  try {
    client = await pool.connect()
    const result = await client.query(sql, params)
    
    const queryTime = Date.now() - startTime
    poolStats.totalQueries++
    
    // 更新平均查询时间
    poolStats.avgQueryTime = 
      (poolStats.avgQueryTime * (poolStats.totalQueries - 1) + queryTime) / poolStats.totalQueries

    // 慢查询警告
    if (queryTime > 1000) {
      log(`Slow query detected (${queryTime}ms): ${sql.substring(0, 100)}...`, 'WARN')
    }

    return result
  } catch (error) {
    poolStats.failedQueries++
    poolStats.lastError = error.message
    throw error
  } finally {
    if (client) {
      client.release()
    }
  }
}

/**
 * 获取连接池状态
 */
export const getPoolStatus = () => {
  if (!pool) {
    return { initialized: false }
  }

  return {
    initialized: true,
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    stats: { ...poolStats }
  }
}

/**
 * 健康检查
 */
export const healthCheck = async () => {
  const startTime = Date.now()
  
  try {
    const result = await query('SELECT NOW() as now, version() as version')
    const responseTime = Date.now() - startTime

    return {
      healthy: true,
      responseTime,
      timestamp: new Date().toISOString(),
      database: {
        version: result.rows[0].version.split(' ').slice(0, 3).join(' '),
        serverTime: result.rows[0].now
      },
      pool: getPoolStatus()
    }
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * 关闭连接池
 */
export const closePool = async () => {
  if (pool) {
    await pool.end()
    pool = null
    log('Pool closed')
  }
}

// 导出默认对象
export default {
  initPool,
  getPool,
  query,
  getPoolStatus,
  healthCheck,
  closePool
}
