/**
 * 优化慢查询 - 创建必要的索引
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
  console.log('[Optimize Queries] 已加载 .env.local 文件')
}

const connectionString = process.env.DATABASE_URL || 
                        process.env.POSTGRES_URL_NON_POOLING ||
                        process.env.POSTGRES_URL ||
                        process.env.NEON_DATABASE_URL

console.log('[Optimize Queries] 数据库连接:', connectionString?.replace(/:[^:@]+@/, ':***@'))

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : { 
    rejectUnauthorized: false 
  }
})

async function optimizeSlowQueries() {
  const client = await pool.connect()
  
  try {
    console.log('[Optimize Queries] 开始优化慢查询...')

    // 1. 为 user_history 表创建索引
    console.log('[Optimize Queries] 创建 user_history 表索引...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_history_user_id ON user_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_history_created_at ON user_history(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_user_history_user_created ON user_history(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_user_history_action ON user_history(action_type);
    `)
    console.log('[Optimize Queries] user_history 索引创建完成')

    // 2. 为 profiles 表创建索引
    console.log('[Optimize Queries] 创建 profiles 表索引...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_profiles_verification ON profiles(verification_status);
    `)
    console.log('[Optimize Queries] profiles 索引创建完成')

    // 3. 为 community_join_requests 表创建索引
    console.log('[Optimize Queries] 创建 community_join_requests 表索引...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_community_join_user_id ON community_join_requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_community_join_status ON community_join_requests(status);
      CREATE INDEX IF NOT EXISTS idx_community_join_created ON community_join_requests(created_at DESC);
    `)
    console.log('[Optimize Queries] community_join_requests 索引创建完成')

    // 4. 为 user_feedback 表创建索引
    console.log('[Optimize Queries] 创建 user_feedback 表索引...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);
      CREATE INDEX IF NOT EXISTS idx_user_feedback_created ON user_feedback(created_at DESC);
    `)
    console.log('[Optimize Queries] user_feedback 索引创建完成')

    // 5. 为 works 表创建索引
    console.log('[Optimize Queries] 创建 works 表索引...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_works_creator_id ON works(creator_id);
      CREATE INDEX IF NOT EXISTS idx_works_created_at ON works(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_works_status ON works(status);
    `)
    console.log('[Optimize Queries] works 索引创建完成')

    // 6. 为 posts 表创建索引
    console.log('[Optimize Queries] 创建 posts 表索引...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
      CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
      CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    `)
    console.log('[Optimize Queries] posts 索引创建完成')

    // 7. 为 membership_orders 表创建索引
    console.log('[Optimize Queries] 创建 membership_orders 表索引...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_membership_orders_user_id ON membership_orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_membership_orders_status ON membership_orders(status);
      CREATE INDEX IF NOT EXISTS idx_membership_orders_created ON membership_orders(created_at DESC);
    `)
    console.log('[Optimize Queries] membership_orders 索引创建完成')

    // 8. 分析表以更新统计信息
    console.log('[Optimize Queries] 更新表统计信息...')
    await client.query(`
      ANALYZE user_history;
      ANALYZE profiles;
      ANALYZE community_join_requests;
      ANALYZE user_feedback;
      ANALYZE works;
      ANALYZE posts;
      ANALYZE membership_orders;
    `)
    console.log('[Optimize Queries] 统计信息更新完成')

    console.log('[Optimize Queries] 所有优化完成！')
    
  } catch (error) {
    console.error('[Optimize Queries] 优化失败:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

optimizeSlowQueries().catch(console.error)
