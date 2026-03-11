/**
 * 修复 Lottery 相关的数据库表和视图
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
  console.log('[Fix Lottery Tables] 已加载 .env.local 文件')
}

const connectionString = process.env.DATABASE_URL || 
                        process.env.POSTGRES_URL_NON_POOLING ||
                        process.env.POSTGRES_URL ||
                        process.env.NEON_DATABASE_URL

console.log('[Fix Lottery Tables] 数据库连接:', connectionString?.replace(/:[^:@]+@/, ':***@'))

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : { 
    rejectUnauthorized: false 
  }
})

async function fixLotteryTables() {
  const client = await pool.connect()
  
  try {
    console.log('[Fix Lottery Tables] 开始修复 lottery 相关表...')

    // 先删除视图
    await client.query(`DROP VIEW IF EXISTS lottery_spin_records_with_users`)
    console.log('[Fix Lottery Tables] 已删除旧视图')

    // 删除旧表（按依赖顺序）
    await client.query(`DROP TABLE IF EXISTS user_daily_spins`)
    await client.query(`DROP TABLE IF EXISTS lottery_spin_records`)
    await client.query(`DROP TABLE IF EXISTS lottery_prizes`)
    await client.query(`DROP TABLE IF EXISTS lottery_activities`)
    console.log('[Fix Lottery Tables] 已删除旧表')

    // 1. 创建 lottery_activities 表（转盘活动表）
    await client.query(`
      CREATE TABLE lottery_activities (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          status VARCHAR(50) DEFAULT 'draft',
          start_time TIMESTAMPTZ,
          end_time TIMESTAMPTZ,
          spin_cost INTEGER DEFAULT 0,
          daily_limit INTEGER DEFAULT -1,
          total_limit INTEGER DEFAULT -1,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          total_spins INTEGER DEFAULT 0,
          total_participants INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('[Fix Lottery Tables] lottery_activities 表已创建')

    // 2. 创建 lottery_prizes 表（转盘奖品表）
    await client.query(`
      CREATE TABLE lottery_prizes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          activity_id UUID NOT NULL REFERENCES lottery_activities(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          probability NUMERIC(5,4) DEFAULT 0,
          points INTEGER DEFAULT 0,
          stock INTEGER DEFAULT -1,
          image_url TEXT,
          sort_order INTEGER DEFAULT 0,
          is_enabled BOOLEAN DEFAULT true,
          is_rare BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('[Fix Lottery Tables] lottery_prizes 表已创建')

    // 3. 创建 lottery_spin_records 表（抽奖记录表）
    await client.query(`
      CREATE TABLE lottery_spin_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          activity_id UUID NOT NULL REFERENCES lottery_activities(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          prize_id UUID REFERENCES lottery_prizes(id) ON DELETE SET NULL,
          prize_name VARCHAR(255),
          prize_points INTEGER DEFAULT 0,
          cost INTEGER DEFAULT 0,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('[Fix Lottery Tables] lottery_spin_records 表已创建')

    // 4. 创建视图 lottery_spin_records_with_users
    await client.query(`
      CREATE VIEW lottery_spin_records_with_users AS
      SELECT 
          r.id,
          r.activity_id,
          a.name as activity_name,
          r.user_id,
          u.username,
          u.avatar_url as avatar,
          r.prize_id,
          r.prize_name,
          r.prize_points,
          r.cost,
          r.ip_address,
          r.user_agent,
          r.created_at
      FROM lottery_spin_records r
      LEFT JOIN lottery_activities a ON r.activity_id = a.id
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `)
    console.log('[Fix Lottery Tables] lottery_spin_records_with_users 视图已创建')

    // 5. 创建 user_daily_spins 表（用户每日抽奖次数记录）
    await client.query(`
      CREATE TABLE user_daily_spins (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          activity_id UUID NOT NULL REFERENCES lottery_activities(id) ON DELETE CASCADE,
          spin_date DATE NOT NULL,
          spin_count INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, activity_id, spin_date)
      )
    `)
    console.log('[Fix Lottery Tables] user_daily_spins 表已创建')

    // 6. 创建索引
    await client.query(`
      CREATE INDEX idx_lottery_spin_records_activity_id ON lottery_spin_records(activity_id);
      CREATE INDEX idx_lottery_spin_records_user_id ON lottery_spin_records(user_id);
      CREATE INDEX idx_lottery_spin_records_created_at ON lottery_spin_records(created_at);
      CREATE INDEX idx_lottery_prizes_activity_id ON lottery_prizes(activity_id);
      CREATE INDEX idx_user_daily_spins_user_activity_date ON user_daily_spins(user_id, activity_id, spin_date);
    `)
    console.log('[Fix Lottery Tables] 索引已创建')

    console.log('[Fix Lottery Tables] 所有 lottery 相关表和视图修复完成！')
    
  } catch (error) {
    console.error('[Fix Lottery Tables] 修复表失败:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

fixLotteryTables().catch(console.error)
