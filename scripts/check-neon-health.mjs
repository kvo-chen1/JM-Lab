#!/usr/bin/env node
/**
 * Neon 数据库健康检查命令行工具
 * 提供彩色输出和详细的诊断信息
 */

import {
  testConnection,
  getPoolStatus,
  healthCheck,
  checkTables,
  getFullDiagnostics,
  getConnectionString,
  isNeonDatabase,
  ConnectionStatus,
  LatencyLevel
} from '../server/connection-checker.mjs'

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

// 图标
const icons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  rocket: '🚀',
  database: '🗄️',
  clock: '⏱️',
  pulse: '💓',
  table: '📊',
  link: '🔗'
}

/**
 * 打印带颜色的文本
 */
const print = (text, color = 'reset') => {
  console.log(`${colors[color]}${text}${colors.reset}`)
}

/**
 * 打印分隔线
 */
const printDivider = () => {
  console.log(colors.dim + '─'.repeat(60) + colors.reset)
}

/**
 * 打印标题
 */
const printTitle = (title) => {
  console.log('')
  printDivider()
  print(`${colors.bright}${colors.cyan}${title}${colors.reset}`)
  printDivider()
}

/**
 * 获取状态颜色和图标
 */
const getStatusStyle = (status) => {
  switch (status) {
    case ConnectionStatus.CONNECTED:
      return { color: 'green', icon: icons.success }
    case ConnectionStatus.WARNING:
      return { color: 'yellow', icon: icons.warning }
    case ConnectionStatus.ERROR:
    case ConnectionStatus.DISCONNECTED:
      return { color: 'red', icon: icons.error }
    case ConnectionStatus.TIMEOUT:
      return { color: 'yellow', icon: icons.warning }
    default:
      return { color: 'reset', icon: icons.info }
  }
}

/**
 * 获取延迟颜色
 */
const getLatencyColor = (level) => {
  switch (level) {
    case LatencyLevel.GOOD:
      return 'green'
    case LatencyLevel.NORMAL:
      return 'cyan'
    case LatencyLevel.WARNING:
      return 'yellow'
    case LatencyLevel.BAD:
      return 'red'
    default:
      return 'reset'
  }
}

/**
 * 格式化毫秒
 */
const formatMs = (ms) => {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * 显示帮助信息
 */
const showHelp = () => {
  printTitle('Neon 数据库健康检查工具')
  print('')
  print('用法: node scripts/check-neon-health.mjs [选项]', 'bright')
  print('')
  print('选项:', 'bright')
  print('  --quick, -q       快速检查（仅测试连接）')
  print('  --full, -f        完整诊断（默认）')
  print('  --tables, -t      检查表结构')
  print('  --pool, -p        检查连接池状态')
  print('  --json, -j        输出 JSON 格式')
  print('  --help, -h        显示帮助信息')
  print('')
  print('示例:', 'bright')
  print('  node scripts/check-neon-health.mjs')
  print('  node scripts/check-neon-health.mjs --quick')
  print('  node scripts/check-neon-health.mjs --json')
  print('')
}

/**
 * 快速检查模式
 */
const quickCheck = async () => {
  printTitle(`${icons.rocket} 快速连接检查`)

  const startTime = Date.now()
  const result = await testConnection()
  const totalTime = Date.now() - startTime

  const style = getStatusStyle(result.status)

  print(`\n${style.icon} 连接状态: ${colors[style.color]}${result.status.toUpperCase()}${colors.reset}`)

  if (result.connected) {
    print(`\n${icons.database} 数据库信息:`, 'bright')
    print(`  类型: ${result.database.type}`)
    print(`  版本: ${result.database.version}`)
    print(`  服务器时间: ${result.database.serverTime}`)

    print(`\n${icons.clock} 性能指标:`, 'bright')
    const latencyColor = getLatencyColor(result.latencyLevel)
    print(`  响应时间: ${colors[latencyColor]}${formatMs(result.responseTime)}${colors.reset}`)
    print(`  延迟等级: ${colors[latencyColor]}${result.latencyLevel}${colors.reset}`)
    print(`  总检查时间: ${formatMs(totalTime)}`)
  } else {
    print(`\n${icons.error} 错误信息:`, 'red')
    print(`  错误码: ${result.errorCode}`, 'red')
    print(`  错误详情: ${result.error}`, 'red')
  }

  return result.connected
}

/**
 * 完整诊断模式
 */
const fullDiagnostics = async () => {
  printTitle(`${icons.pulse} Neon 数据库完整诊断`)

  const connectionString = getConnectionString()
  print(`\n${icons.link} 连接配置:`, 'bright')
  if (connectionString) {
    const maskedUrl = connectionString.replace(/:[^:@]+@/, ':***@')
    print(`  连接字符串: ${maskedUrl}`)
    print(`  数据库类型: ${isNeonDatabase(connectionString) ? 'Neon PostgreSQL' : 'PostgreSQL'}`)
  } else {
    print('  未找到连接字符串', 'red')
    return false
  }

  print(`\n${colors.dim}正在执行全面检查，请稍候...${colors.reset}`)

  const result = await getFullDiagnostics()

  // 健康状态
  printTitle(`${icons.pulse} 健康状态`)
  const healthStyle = getStatusStyle(result.health.status)
  print(`\n${healthStyle.icon} 整体状态: ${colors[healthStyle.color]}${result.health.healthy ? '健康' : '异常'}${colors.reset}`)
  print(`  详细状态: ${result.health.status}`)
  print(`  检查时间: ${new Date(result.timestamp).toLocaleString()}`)
  print(`  总耗时: ${formatMs(result.totalCheckTime)}`)

  // 连接详情
  printTitle(`${icons.database} 连接详情`)
  const conn = result.health.connection
  if (conn.connected) {
    const connStyle = getStatusStyle(conn.status)
    print(`\n${connStyle.icon} 连接状态: ${colors[connStyle.color]}已连接${colors.reset}`)
    print(`  数据库类型: ${conn.database.type}`)
    print(`  数据库版本: ${conn.database.version}`)
    const latencyColor = getLatencyColor(conn.latencyLevel)
    print(`  响应时间: ${colors[latencyColor]}${formatMs(conn.responseTime)}${colors.reset}`)
    print(`  延迟等级: ${colors[latencyColor]}${conn.latencyLevel}${colors.reset}`)
  } else {
    print(`\n${icons.error} 连接失败`, 'red')
    print(`  错误码: ${conn.errorCode}`, 'red')
    print(`  错误信息: ${conn.error}`, 'red')
  }

  // 连接池状态
  if (result.health.pool && result.health.pool.available) {
    printTitle(`${icons.link} 连接池状态`)
    const pool = result.health.pool.pool
    print(`  总连接数: ${pool.totalCount}`)
    print(`  空闲连接: ${pool.idleCount}`)
    print(`  等待连接: ${pool.waitingCount}`)

    if (result.health.pool.database) {
      const db = result.health.pool.database
      const usagePercent = ((db.activeConnections / db.maxConnections) * 100).toFixed(1)
      const usageColor = parseFloat(usagePercent) > 80 ? 'red' : (parseFloat(usagePercent) > 50 ? 'yellow' : 'green')
      print(`  活跃连接: ${db.activeConnections}`)
      print(`  最大连接: ${db.maxConnections}`)
      print(`  使用率: ${colors[usageColor]}${usagePercent}%${colors.reset}`)
    }
  }

  // 表结构
  if (result.tables && !result.tables.error) {
    printTitle(`${icons.table} 表结构`)
    print(`  总表数: ${result.tables.totalTables}`)

    if (result.tables.criticalTables) {
      print(`\n  关键表状态:`, 'bright')
      Object.entries(result.tables.criticalTables).forEach(([table, count]) => {
        if (count >= 0) {
          print(`    ✓ ${table}: ${count} 条记录`, 'green')
        } else {
          print(`    ✗ ${table}: 表不存在或无法访问`, 'red')
        }
      })
    }
  }

  // 环境信息
  printTitle(`${icons.info} 环境信息`)
  print(`  Node 环境: ${result.environment.nodeEnv || '未设置'}`)
  print(`  Vercel 环境: ${result.environment.isVercel ? '是' : '否'}`)
  if (result.environment.vercelEnv) {
    print(`  Vercel 部署: ${result.environment.vercelEnv}`)
  }

  // 总结
  printTitle(`${icons.pulse} 诊断总结`)
  if (result.health.healthy) {
    print(`\n${icons.success} 数据库连接正常`, 'green')
    print(`  响应时间: ${formatMs(result.health.connection.responseTime)}`)
    print(`  建议: 系统运行良好`, 'green')
  } else {
    print(`\n${icons.error} 检测到连接问题`, 'red')
    print(`  错误: ${result.health.connection.error}`, 'red')
    print(`  建议: 请检查数据库配置和网络连接`, 'yellow')
  }

  return result.health.healthy
}

/**
 * JSON 输出模式
 */
const jsonOutput = async () => {
  const result = await getFullDiagnostics()
  console.log(JSON.stringify(result, null, 2))
  return result.health.healthy
}

/**
 * 主函数
 */
const main = async () => {
  const args = process.argv.slice(2)

  // 显示帮助
  if (args.includes('--help') || args.includes('-h')) {
    showHelp()
    process.exit(0)
  }

  // JSON 输出模式
  if (args.includes('--json') || args.includes('-j')) {
    const success = await jsonOutput()
    process.exit(success ? 0 : 1)
  }

  // 快速检查模式
  if (args.includes('--quick') || args.includes('-q')) {
    const success = await quickCheck()
    print('')
    printDivider()
    process.exit(success ? 0 : 1)
  }

  // 默认完整诊断
  const success = await fullDiagnostics()
  print('')
  printDivider()
  process.exit(success ? 0 : 1)
}

// 运行主函数
main().catch(error => {
  print(`\n${icons.error} 执行出错:`, 'red')
  print(error.message, 'red')
  process.exit(1)
})
