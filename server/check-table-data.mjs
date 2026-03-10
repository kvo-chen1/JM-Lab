/**
 * 检查后台管理相关表的数据情况
 */

import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const { Pool } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

dotenv.config({ path: path.join(projectRoot, '.env') })

const envLocalPath = path.join(projectRoot, '.env.local')
if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath))
  for (const k in envConfig) {
    process.env[k] = envConfig[k]
  }
}

const connectionString = process.env.DATABASE_URL || 
                        process.env.POSTGRES_URL_NON_POOLING ||
                        process.env.POSTGRES_URL ||
                        process.env.NEON_DATABASE_URL

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : { 
    rejectUnauthorized: false 
  }
})

async function checkTableData() {
  const client = await pool.connect()
  
  try {
    console.log('========== 后台管理数据检查 ==========\n')

    // 1. 用户管理
    const usersCount = await client.query('SELECT COUNT(*) FROM users')
    console.log(`👤 用户总数: ${usersCount.rows[0].count}`)

    // 2. 内容审核 - 待审核作品
    const pendingWorks = await client.query("SELECT COUNT(*) FROM works WHERE status = 'pending'")
    console.log(`📝 待审核作品: ${pendingWorks.rows[0].count}`)

    // 3. 活动管理
    const eventsCount = await client.query('SELECT COUNT(*) FROM events')
    const pendingEvents = await client.query("SELECT COUNT(*) FROM events WHERE status = 'pending'")
    console.log(`📅 活动总数: ${eventsCount.rows[0].count} (待审核: ${pendingEvents.rows[0].count})`)

    // 4. 创作者管理 - 有作品的用户
    const creatorsCount = await client.query(`
      SELECT COUNT(DISTINCT creator_id) FROM works WHERE creator_id IS NOT NULL
    `)
    console.log(`🎨 创作者数: ${creatorsCount.rows[0].count}`)

    // 5. 商业化申请
    const commercialApps = await client.query('SELECT COUNT(*) FROM commercial_applications')
    const pendingCommercial = await client.query("SELECT COUNT(*) FROM commercial_applications WHERE status = 'pending'")
    console.log(`💼 商业化申请: ${commercialApps.rows[0].count} (待处理: ${pendingCommercial.rows[0].count})`)

    // 6. 积分规则
    const pointsRules = await client.query('SELECT COUNT(*) FROM points_rules')
    console.log(`⭐ 积分规则: ${pointsRules.rows[0].count}`)

    // 7. 用户反馈
    const feedbackCount = await client.query('SELECT COUNT(*) FROM user_feedback')
    const pendingFeedback = await client.query("SELECT COUNT(*) FROM user_feedback WHERE status = 'pending'")
    console.log(`💬 用户反馈: ${feedbackCount.rows[0].count} (待处理: ${pendingFeedback.rows[0].count})`)

    // 8. 兑换记录
    const exchangeCount = await client.query('SELECT COUNT(*) FROM exchange_records')
    const pendingExchange = await client.query("SELECT COUNT(*) FROM exchange_records WHERE status = 'pending'")
    console.log(`🎁 兑换记录: ${exchangeCount.rows[0].count} (待处理: ${pendingExchange.rows[0].count})`)

    console.log('\n========== 详细数据 ==========')

    // 显示积分规则详情
    if (pointsRules.rows[0].count > 0) {
      const rules = await client.query('SELECT name, points, is_active FROM points_rules LIMIT 5')
      console.log('\n积分规则示例:')
      rules.rows.forEach(r => console.log(`  - ${r.name}: ${r.points}分 (${r.is_active ? '启用' : '禁用'})`))
    }

    // 显示活动示例
    if (eventsCount.rows[0].count > 0) {
      const events = await client.query('SELECT title, status FROM events LIMIT 3')
      console.log('\n活动示例:')
      events.rows.forEach(e => console.log(`  - ${e.title} (${e.status})`))
    }

    // 显示作品示例
    const worksCount = await client.query('SELECT COUNT(*) FROM works')
    console.log(`\n作品总数: ${worksCount.rows[0].count}`)
    if (worksCount.rows[0].count > 0) {
      const works = await client.query('SELECT title, status FROM works LIMIT 3')
      console.log('作品示例:')
      works.rows.forEach(w => console.log(`  - ${w.title} (${w.status})`))
    }

    console.log('\n========== 检查完成 ==========')
    
  } catch (error) {
    console.error('检查数据失败:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

checkTableData().catch(console.error)
