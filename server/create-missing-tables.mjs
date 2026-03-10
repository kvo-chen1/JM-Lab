/**
 * 创建缺失的数据库表
 */

import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const { Pool } = pg

// 获取当前文件所在目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// 加载环境变量
dotenv.config({ path: path.join(projectRoot, '.env') })

// 尝试加载 .env.local（如果存在）
const envLocalPath = path.join(projectRoot, '.env.local')
if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath))
  for (const k in envConfig) {
    process.env[k] = envConfig[k]
  }
  console.log('[Create Tables] 已加载 .env.local 文件')
}

const connectionString = process.env.DATABASE_URL || 
                        process.env.POSTGRES_URL_NON_POOLING ||
                        process.env.POSTGRES_URL ||
                        process.env.NEON_DATABASE_URL

console.log('[Create Tables] 数据库连接:', connectionString?.replace(/:[^:@]+@/, ':***@'))

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : { 
    rejectUnauthorized: false 
  }
})

async function createMissingTables() {
  const client = await pool.connect()
  
  try {
    console.log('[Create Tables] 开始创建缺失的表...')

    // 1. 创建 user_stats 表（用户统计表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_stats (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          works_count INTEGER DEFAULT 0,
          likes_count INTEGER DEFAULT 0,
          views_count INTEGER DEFAULT 0,
          followers_count INTEGER DEFAULT 0,
          following_count INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id)
      )
    `)
    console.log('[Create Tables] user_stats 表已创建或已存在')

    // 2. 创建 user_feedback 表（用户反馈表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_feedback (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255),
          content TEXT NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          admin_reply TEXT,
          replied_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('[Create Tables] user_feedback 表已创建或已存在')

    // 3. 创建 user_audit_logs 表（用户审计日志表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          action VARCHAR(100) NOT NULL,
          details JSONB,
          ip_address INET,
          user_agent TEXT,
          status VARCHAR(50) DEFAULT 'pending_review',
          reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
          reviewed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('[Create Tables] user_audit_logs 表已创建或已存在')

    // 4. 创建 profiles 表（用户资料表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          display_name VARCHAR(255),
          bio TEXT,
          avatar_url TEXT,
          verification_status VARCHAR(50) DEFAULT 'unverified',
          verified_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id)
      )
    `)
    console.log('[Create Tables] profiles 表已创建或已存在')

    // 5. 创建 content_moderation 表（内容审核表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS content_moderation (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          content_type VARCHAR(50) NOT NULL,
          content_id UUID NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          reason TEXT,
          reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
          reviewed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('[Create Tables] content_moderation 表已创建或已存在')

    // 6. 创建 exchange_records 表（兑换记录表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS exchange_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id UUID,
          product_name VARCHAR(255),
          points_cost INTEGER NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          recipient_name VARCHAR(255),
          recipient_phone VARCHAR(50),
          recipient_address TEXT,
          tracking_number VARCHAR(255),
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('[Create Tables] exchange_records 表已创建或已存在')

    // 7. 创建 community_join_requests 表（社群加入请求表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS community_join_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          community_id VARCHAR(50) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          message TEXT,
          reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
          reviewed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('[Create Tables] community_join_requests 表已创建或已存在')

    // 8. 创建 promotion_applications 表（推广申请）
    await client.query(`
      CREATE TABLE IF NOT EXISTS promotion_applications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          promotion_type VARCHAR(50) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          application_data JSONB,
          reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
          reviewed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('[Create Tables] promotion_applications 表已创建或已存在')

    console.log('[Create Tables] 所有缺失的表创建完成！')
    
  } catch (error) {
    console.error('[Create Tables] 创建表失败:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

createMissingTables().catch(console.error)
