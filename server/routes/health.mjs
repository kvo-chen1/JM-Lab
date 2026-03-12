/**
 * 健康检查 API 路由
 * 提供数据库连接状态和健康检查端点
 */

import express from 'express'
import {
  testConnection,
  getPoolStatus,
  healthCheck,
  checkTables,
  getFullDiagnostics,
  getConnectionString,
  isNeonDatabase
} from '../connection-checker.mjs'

const router = express.Router()

/**
 * GET /api/health
 * 基础健康检查
 */
router.get('/', async (req, res) => {
  try {
    const result = await healthCheck()

    res.status(result.healthy ? 200 : 503).json({
      status: result.healthy ? 'ok' : 'error',
      timestamp: result.timestamp,
      checkTime: result.totalCheckTime,
      database: {
        connected: result.connection.connected,
        status: result.connection.status,
        responseTime: result.connection.responseTime
      }
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * GET /api/health/db
 * 数据库连接详细检查
 */
router.get('/db', async (req, res) => {
  try {
    const result = await healthCheck()

    res.status(result.healthy ? 200 : 503).json({
      healthy: result.healthy,
      status: result.status,
      timestamp: result.timestamp,
      totalCheckTime: result.totalCheckTime,
      connection: {
        connected: result.connection.connected,
        status: result.connection.status,
        responseTime: result.connection.responseTime,
        latencyLevel: result.connection.latencyLevel,
        error: result.connection.error,
        errorCode: result.connection.errorCode,
        database: result.connection.database
      },
      pool: result.pool
    })
  } catch (error) {
    res.status(500).json({
      healthy: false,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * GET /api/health/neon
 * Neon 数据库专门检查
 */
router.get('/neon', async (req, res) => {
  try {
    const connectionString = getConnectionString()
    const isNeon = isNeonDatabase(connectionString)

    if (!isNeon) {
      return res.status(400).json({
        status: 'warning',
        message: '当前配置的不是 Neon 数据库',
        databaseType: 'other',
        timestamp: new Date().toISOString()
      })
    }

    const [connectionResult, poolResult, tablesResult] = await Promise.all([
      testConnection(),
      getPoolStatus(),
      checkTables()
    ])

    const response = {
      status: connectionResult.connected ? 'ok' : 'error',
      database: {
        type: 'neon',
        connected: connectionResult.connected
      },
      timestamp: new Date().toISOString()
    }

    if (connectionResult.connected) {
      response.connection = {
        status: connectionResult.status,
        responseTime: connectionResult.responseTime,
        latencyLevel: connectionResult.latencyLevel,
        version: connectionResult.database.version,
        serverTime: connectionResult.database.serverTime
      }

      if (poolResult.available) {
        response.pool = {
          ...poolResult.pool,
          database: poolResult.database
        }
      }

      if (!tablesResult.error) {
        response.tables = {
          total: tablesResult.totalTables,
          criticalTables: tablesResult.criticalTables
        }
      }
    } else {
      response.error = {
        message: connectionResult.error,
        code: connectionResult.errorCode
      }
    }

    res.status(connectionResult.connected ? 200 : 503).json(response)
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * GET /api/health/diagnostics
 * 完整诊断信息
 */
router.get('/diagnostics', async (req, res) => {
  try {
    const result = await getFullDiagnostics()
    res.json(result)
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * GET /api/health/ping
 * 简单的 ping 检查
 */
router.get('/ping', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'pong'
  })
})

export default router
