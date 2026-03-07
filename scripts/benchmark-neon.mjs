#!/usr/bin/env node
/**
 * Neon 数据库连接性能测试
 * 对比优化前后的连接性能
 */

import { Pool } from 'pg'
import dotenv from 'dotenv'
import { initPool, query, closePool, healthCheck } from '../server/database-optimized.mjs'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

// ANSI 颜色
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
}

const print = (text, color = 'reset') => {
  console.log(`${colors[color]}${text}${colors.reset}`)
}

const printDivider = () => {
  print('─'.repeat(70), 'cyan')
}

/**
 * 获取连接字符串
 */
const getConnectionString = () => {
  return process.env.POSTGRES_URL_NON_POOLING ||
         process.env.DATABASE_URL ||
         process.env.POSTGRES_URL ||
         process.env.NEON_DATABASE_URL ||
         process.env.NEON_URL
}

/**
 * 获取直连地址
 */
const getDirectConnectionString = () => {
  const url = getConnectionString()
  if (url && url.includes('-pooler')) {
    return url.replace(/-pooler(\.[a-z]-\d)/, '$1')
  }
  return url
}

/**
 * 测试原始连接（使用 pooler）
 */
const testOriginalConnection = async () => {
  const connectionString = getConnectionString()
  print('\n📊 测试 1: 原始连接（Pooler）', 'bright')
  printDivider()
  
  const results = []
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
    min: 1
  })

  // 冷启动测试
  print('\n冷启动测试（首次连接）：')
  const coldStartTimes = []
  for (let i = 0; i < 3; i++) {
    const start = Date.now()
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    const time = Date.now() - start
    coldStartTimes.push(time)
    print(`  第 ${i + 1} 次: ${time}ms`)
  }
  
  const avgColdStart = coldStartTimes.reduce((a, b) => a + b, 0) / coldStartTimes.length
  print(`  平均冷启动时间: ${avgColdStart.toFixed(0)}ms`, coldStartTimes.some(t => t > 1000) ? 'yellow' : 'green')

  // 热连接测试
  print('\n热连接测试（连接池复用）：')
  const hotTimes = []
  for (let i = 0; i < 5; i++) {
    const start = Date.now()
    const client = await pool.connect()
    await client.query('SELECT NOW()')
    client.release()
    const time = Date.now() - start
    hotTimes.push(time)
    print(`  第 ${i + 1} 次: ${time}ms`)
  }
  
  const avgHot = hotTimes.reduce((a, b) => a + b, 0) / hotTimes.length
  print(`  平均热连接时间: ${avgHot.toFixed(0)}ms`, avgHot > 100 ? 'yellow' : 'green')

  await pool.end()
  
  return { avgColdStart, avgHot }
}

/**
 * 测试直连连接
 */
const testDirectConnection = async () => {
  const connectionString = getDirectConnectionString()
  print('\n📊 测试 2: 直连连接（Direct）', 'bright')
  printDivider()
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    min: 2,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000
  })

  // 冷启动测试
  print('\n冷启动测试（首次连接）：')
  const coldStartTimes = []
  for (let i = 0; i < 3; i++) {
    const start = Date.now()
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    const time = Date.now() - start
    coldStartTimes.push(time)
    print(`  第 ${i + 1} 次: ${time}ms`)
  }
  
  const avgColdStart = coldStartTimes.reduce((a, b) => a + b, 0) / coldStartTimes.length
  print(`  平均冷启动时间: ${avgColdStart.toFixed(0)}ms`, coldStartTimes.some(t => t > 1000) ? 'yellow' : 'green')

  // 热连接测试
  print('\n热连接测试（连接池复用）：')
  const hotTimes = []
  for (let i = 0; i < 5; i++) {
    const start = Date.now()
    const client = await pool.connect()
    await client.query('SELECT NOW()')
    client.release()
    const time = Date.now() - start
    hotTimes.push(time)
    print(`  第 ${i + 1} 次: ${time}ms`)
  }
  
  const avgHot = hotTimes.reduce((a, b) => a + b, 0) / hotTimes.length
  print(`  平均热连接时间: ${avgHot.toFixed(0)}ms`, avgHot > 100 ? 'yellow' : 'green')

  await pool.end()
  
  return { avgColdStart, avgHot }
}

/**
 * 测试优化后的连接池
 */
const testOptimizedPool = async () => {
  print('\n📊 测试 3: 优化后的连接池', 'bright')
  printDivider()
  
  // 初始化（包含预热）
  print('\n初始化连接池（包含预热）：')
  const initStart = Date.now()
  await initPool()
  const initTime = Date.now() - initStart
  print(`  初始化完成: ${initTime}ms`, initTime > 5000 ? 'yellow' : 'green')

  // 测试查询性能
  print('\n查询性能测试：')
  const queryTimes = []
  for (let i = 0; i < 5; i++) {
    const start = Date.now()
    await query('SELECT NOW()')
    const time = Date.now() - start
    queryTimes.push(time)
    print(`  第 ${i + 1} 次: ${time}ms`)
  }
  
  const avgQuery = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length
  print(`  平均查询时间: ${avgQuery.toFixed(0)}ms`, avgQuery > 100 ? 'yellow' : 'green')

  // 获取连接池状态
  print('\n连接池状态：')
  const { healthCheck: check } = await import('../server/connection-checker.mjs')
  const status = await check()
  print(`  总连接数: ${status.pool?.pool?.totalCount || 'N/A'}`)
  print(`  空闲连接: ${status.pool?.pool?.idleCount || 'N/A'}`)
  print(`  等待连接: ${status.pool?.pool?.waitingCount || 'N/A'}`)

  await closePool()
  
  return { initTime, avgQuery }
}

/**
 * 并发压力测试
 */
const testConcurrency = async () => {
  print('\n📊 测试 4: 并发压力测试', 'bright')
  printDivider()
  
  await initPool()
  
  const concurrency = 10
  const iterations = 5
  
  print(`\n并发测试: ${concurrency} 个并发，每个执行 ${iterations} 次查询`)
  
  const start = Date.now()
  const promises = []
  
  for (let i = 0; i < concurrency; i++) {
    promises.push(
      (async () => {
        const times = []
        for (let j = 0; j < iterations; j++) {
          const qStart = Date.now()
          await query('SELECT 1')
          times.push(Date.now() - qStart)
        }
        return times
      })()
    )
  }
  
  const results = await Promise.all(promises)
  const totalTime = Date.now() - start
  const allTimes = results.flat()
  const avgTime = allTimes.reduce((a, b) => a + b, 0) / allTimes.length
  const maxTime = Math.max(...allTimes)
  const minTime = Math.min(...allTimes)
  
  print(`\n结果：`)
  print(`  总耗时: ${totalTime}ms`)
  print(`  总查询数: ${concurrency * iterations}`)
  print(`  平均查询时间: ${avgTime.toFixed(0)}ms`)
  print(`  最快查询: ${minTime}ms`)
  print(`  最慢查询: ${maxTime}ms`)
  print(`  QPS: ${((concurrency * iterations) / (totalTime / 1000)).toFixed(1)}`)

  await closePool()
}

/**
 * 主函数
 */
const main = async () => {
  print('\n' + '═'.repeat(70), 'cyan')
  print('  Neon 数据库连接性能测试', 'bright')
  print('═'.repeat(70), 'cyan')

  try {
    // 测试 1: 原始连接
    const original = await testOriginalConnection()
    
    // 等待一下，避免连接限制
    await new Promise(r => setTimeout(r, 2000))
    
    // 测试 2: 直连连接
    const direct = await testDirectConnection()
    
    // 等待一下
    await new Promise(r => setTimeout(r, 2000))
    
    // 测试 3: 优化后的连接池
    const optimized = await testOptimizedPool()
    
    // 等待一下
    await new Promise(r => setTimeout(r, 2000))
    
    // 测试 4: 并发测试
    await testConcurrency()

    // 总结
    print('\n' + '═'.repeat(70), 'cyan')
    print('  测试结果总结', 'bright')
    print('═'.repeat(70), 'cyan')
    
    print('\n冷启动时间对比：')
    print(`  原始连接 (Pooler): ${original.avgColdStart.toFixed(0)}ms`)
    print(`  直连连接 (Direct): ${direct.avgColdStart.toFixed(0)}ms`)
    const coldImprovement = ((original.avgColdStart - direct.avgColdStart) / original.avgColdStart * 100).toFixed(1)
    print(`  直连优化: ${coldImprovement > 0 ? '+' : ''}${coldImprovement}%`)
    
    print('\n热连接时间对比：')
    print(`  原始连接 (Pooler): ${original.avgHot.toFixed(0)}ms`)
    print(`  直连连接 (Direct): ${direct.avgHot.toFixed(0)}ms`)
    const hotImprovement = ((original.avgHot - direct.avgHot) / original.avgHot * 100).toFixed(1)
    print(`  直连优化: ${hotImprovement > 0 ? '+' : ''}${hotImprovement}%`)

    print('\n优化建议：')
    if (direct.avgColdStart < original.avgColdStart) {
      print('  ✅ 使用直连地址可以显著减少冷启动时间', 'green')
    }
    if (direct.avgHot < original.avgHot) {
      print('  ✅ 使用直连地址可以改善热连接性能', 'green')
    }
    if (optimized.avgQuery < original.avgHot) {
      print('  ✅ 连接池预热机制有效', 'green')
    }
    
  } catch (error) {
    print(`\n❌ 测试失败: ${error.message}`, 'red')
    console.error(error)
  }
  
  print('\n' + '═'.repeat(70), 'cyan')
}

main()
