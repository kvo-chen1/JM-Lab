/**
 * Neon 数据库连接检查脚本
 */

import { Pool } from 'pg'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()
dotenv.config({ path: '.env.local', override: true })

console.log('==========================================')
console.log('       Neon 数据库连接检查工具')
console.log('==========================================\n')

// 检查环境变量
console.log('【1】环境变量检查')
console.log('------------------------------------------')

const envVars = {
  'DATABASE_URL': process.env.DATABASE_URL,
  'POSTGRES_URL': process.env.POSTGRES_URL,
  'POSTGRES_URL_NON_POOLING': process.env.POSTGRES_URL_NON_POOLING,
  'NEON_URL': process.env.NEON_URL,
  'NEON_DATABASE_URL': process.env.NEON_DATABASE_URL,
  'NEON_POSTGRES_URL': process.env.NEON_POSTGRES_URL,
  'NEON_DATABASE_URL_UNPOOLED': process.env.NEON_DATABASE_URL_UNPOOLED,
  'NEON_POSTGRES_URL_NON_POOLING': process.env.NEON_POSTGRES_URL_NON_POOLING,
  'NETLIFY_DATABASE_URL': process.env.NETLIFY_DATABASE_URL,
  'NETLIFY_DATABASE_URL_UNPOOLED': process.env.NETLIFY_DATABASE_URL_UNPOOLED
}

let foundConnectionString = null
for (const [key, value] of Object.entries(envVars)) {
  const status = value ? '✓ 已配置' : '✗ 未配置'
  console.log(`  ${key}: ${status}`)
  if (value && !foundConnectionString) {
    foundConnectionString = value
  }
}

if (!foundConnectionString) {
  console.error('\n❌ 错误: 未找到任何数据库连接字符串!')
  console.error('请确保在 .env.local 文件中配置了 DATABASE_URL 或 NEON_DATABASE_URL')
  process.exit(1)
}

// 判断是否为 Neon 数据库
const isNeon = foundConnectionString.includes('neon.tech') || foundConnectionString.includes('.neon.')
console.log(`\n  数据库类型: ${isNeon ? 'Neon PostgreSQL' : 'PostgreSQL'}`)

// 解析连接字符串（隐藏密码）
let connectionInfo = '无法解析'
try {
  const url = new URL(foundConnectionString)
  connectionInfo = `${url.protocol}//${url.username}:***@${url.hostname}:${url.port}${url.pathname}`
} catch (e) {
  connectionInfo = 'URL 格式无效'
}
console.log(`  连接字符串: ${connectionInfo}`)

// 测试连接
console.log('\n\n【2】数据库连接测试')
console.log('------------------------------------------')

const startTime = Date.now()

const pool = new Pool({
  connectionString: foundConnectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 2,
  min: 0,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 10000
})

try {
  console.log('  正在连接数据库...')
  const client = await pool.connect()
  console.log('  ✓ 连接成功!')

  // 测试查询
  console.log('\n  执行测试查询...')
  const result = await client.query('SELECT NOW() as now, version() as version')
  const responseTime = Date.now() - startTime

  console.log('  ✓ 查询成功!')
  console.log(`\n  服务器时间: ${result.rows[0].now}`)
  console.log(`  数据库版本: ${result.rows[0].version}`)
  console.log(`  响应时间: ${responseTime}ms`)

  // 检查表
  console.log('\n\n【3】数据库表检查')
  console.log('------------------------------------------')

  const tablesResult = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `)

  console.log(`  发现 ${tablesResult.rows.length} 个表:`)
  tablesResult.rows.forEach((row, index) => {
    console.log(`    ${index + 1}. ${row.table_name}`)
  })

  // 检查关键表
  const criticalTables = ['users', 'works', 'posts', 'events', 'comments', 'likes']
  console.log('\n  关键表状态:')
  for (const table of criticalTables) {
    try {
      const countResult = await client.query(`SELECT COUNT(*) FROM "${table}"`)
      const count = parseInt(countResult.rows[0].count)
      console.log(`    ✓ ${table}: ${count} 条记录`)
    } catch (e) {
      console.log(`    ✗ ${table}: 表不存在或无法访问`)
    }
  }

  // 连接池状态
  console.log('\n\n【4】连接池状态')
  console.log('------------------------------------------')
  console.log(`  总连接数: ${pool.totalCount}`)
  console.log(`  空闲连接: ${pool.idleCount}`)
  console.log(`  等待连接: ${pool.waitingCount}`)

  client.release()

  console.log('\n==========================================')
  console.log('       ✅ 数据库连接检查通过!')
  console.log('==========================================')

} catch (error) {
  console.error('\n  ❌ 连接失败!')
  console.error(`  错误信息: ${error.message}`)
  console.error(`  错误代码: ${error.code || 'N/A'}`)

  if (error.code === 'ECONNREFUSED') {
    console.error('\n  可能原因: 连接被拒绝，请检查主机地址和端口')
  } else if (error.code === 'ENOTFOUND') {
    console.error('\n  可能原因: 主机地址无法解析，请检查连接字符串')
  } else if (error.code === '28P01') {
    console.error('\n  可能原因: 认证失败，请检查用户名和密码')
  } else if (error.code === '3D000') {
    console.error('\n  可能原因: 数据库不存在')
  } else if (error.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
    console.error('\n  可能原因: SSL 证书问题')
  }

  console.log('\n==========================================')
  console.log('       ❌ 数据库连接检查失败!')
  console.log('==========================================')

} finally {
  await pool.end()
}
