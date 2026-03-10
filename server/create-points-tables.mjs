/**
 * 创建积分系统相关表
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
  console.log('[Create Points Tables] 已加载 .env.local 文件')
}

const connectionString = process.env.DATABASE_URL || 
                        process.env.POSTGRES_URL_NON_POOLING ||
                        process.env.POSTGRES_URL ||
                        process.env.NEON_DATABASE_URL ||
                        process.env.VITE_SUPABASE_URL?.replace('.co', '.co:5432')

console.log('[Create Points Tables] 数据库连接:', connectionString?.replace(/:[^:@]+@/, ':***@'))

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : { 
    rejectUnauthorized: false 
  }
})

async function createPointsTables() {
  const client = await pool.connect()
  
  try {
    console.log('[Create Points Tables] 开始创建积分系统相关表...')

    // 1. 创建 points_records 表（积分记录表 - 核心表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS points_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          points INTEGER NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'adjustment')),
          source TEXT NOT NULL,
          source_type TEXT,
          description TEXT NOT NULL DEFAULT '',
          balance_after INTEGER NOT NULL,
          related_id UUID,
          related_type TEXT,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE
      )
    `)
    console.log('[Create Points Tables] ✅ points_records 表已创建或已存在')

    // 2. 创建 checkin_records 表（签到记录表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS checkin_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          checkin_date DATE NOT NULL,
          consecutive_days INTEGER DEFAULT 1,
          points_earned INTEGER DEFAULT 5,
          is_bonus BOOLEAN DEFAULT false,
          bonus_points INTEGER DEFAULT 0,
          is_retroactive BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, checkin_date)
      )
    `)
    console.log('[Create Points Tables] ✅ checkin_records 表已创建或已存在')

    // 3. 创建 task_records 表（任务记录表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          task_id TEXT NOT NULL,
          task_type TEXT CHECK (task_type IN ('daily', 'weekly', 'monthly', 'event', 'achievement')),
          task_title TEXT NOT NULL,
          progress INTEGER DEFAULT 0,
          target INTEGER DEFAULT 1,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
          points_reward INTEGER DEFAULT 0,
          completed_at TIMESTAMP WITH TIME ZONE,
          expires_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, task_id)
      )
    `)
    console.log('[Create Points Tables] ✅ task_records 表已创建或已存在')

    // 4. 创建 exchange_records 表（兑换记录表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS exchange_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id TEXT NOT NULL,
          product_name TEXT NOT NULL,
          product_category TEXT,
          points_cost INTEGER NOT NULL,
          quantity INTEGER DEFAULT 1,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('[Create Points Tables] ✅ exchange_records 表已创建或已存在')

    // 5. 创建 invite_records 表（邀请记录表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS invite_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          invitee_id UUID REFERENCES users(id) ON DELETE SET NULL,
          invite_code TEXT NOT NULL UNIQUE,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'completed')),
          inviter_points INTEGER DEFAULT 0,
          invitee_points INTEGER DEFAULT 0,
          registered_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('[Create Points Tables] ✅ invite_records 表已创建或已存在')

    // 6. 创建 consumption_records 表（消费返积分记录表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS consumption_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          order_id TEXT NOT NULL,
          order_amount DECIMAL(10, 2) NOT NULL,
          category TEXT,
          points INTEGER DEFAULT 0,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
          confirmed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('[Create Points Tables] ✅ consumption_records 表已创建或已存在')

    // 7. 创建 points_rules 表（积分规则表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS points_rules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          rule_type TEXT CHECK (rule_type IN ('earn', 'spend', 'limit')),
          source_type TEXT NOT NULL,
          points INTEGER DEFAULT 0,
          daily_limit INTEGER,
          weekly_limit INTEGER,
          monthly_limit INTEGER,
          yearly_limit INTEGER,
          is_active BOOLEAN DEFAULT true,
          priority INTEGER DEFAULT 0,
          conditions JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('[Create Points Tables] ✅ points_rules 表已创建或已存在')

    // 插入默认积分规则
    const defaultRules = [
      { name: '每日签到', description: '每日签到获得基础积分', rule_type: 'earn', source_type: 'checkin', points: 5, daily_limit: 1, priority: 100 },
      { name: '连续3天签到奖励', description: '连续签到3天额外奖励', rule_type: 'earn', source_type: 'checkin', points: 10, daily_limit: 1, priority: 90 },
      { name: '连续7天签到奖励', description: '连续签到7天额外奖励', rule_type: 'earn', source_type: 'checkin', points: 30, daily_limit: 1, priority: 80 },
      { name: '连续30天签到奖励', description: '连续签到30天超级奖励', rule_type: 'earn', source_type: 'checkin', points: 100, daily_limit: 1, priority: 70 },
      { name: '任务完成', description: '完成任务获得积分', rule_type: 'earn', source_type: 'task', points: 10, daily_limit: 10, priority: 100 },
      { name: '成就解锁', description: '解锁成就获得积分', rule_type: 'earn', source_type: 'achievement', points: 50, priority: 100 }
    ]

    for (const rule of defaultRules) {
      try {
        await client.query(`
          INSERT INTO points_rules (name, description, rule_type, source_type, points, daily_limit, is_active, priority)
          VALUES ($1, $2, $3, $4, $5, $6, true, $7)
          ON CONFLICT DO NOTHING
        `, [rule.name, rule.description, rule.rule_type, rule.source_type, rule.points, rule.daily_limit, rule.priority])
      } catch (e) {
        // 忽略重复错误
      }
    }
    console.log('[Create Points Tables] ✅ 默认积分规则已插入')

    // 创建索引
    await client.query(`CREATE INDEX IF NOT EXISTS idx_points_records_user_id ON points_records(user_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_points_records_created_at ON points_records(created_at)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_points_records_type ON points_records(type)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_checkin_records_user_id ON checkin_records(user_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_checkin_records_date ON checkin_records(checkin_date)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_task_records_user_id ON task_records(user_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_exchange_records_user_id ON exchange_records(user_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_invite_records_inviter_id ON invite_records(inviter_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_consumption_records_user_id ON consumption_records(user_id)`)
    console.log('[Create Points Tables] ✅ 索引已创建')

    console.log('[Create Points Tables] 🎉 所有积分系统表创建完成！')
    
  } catch (error) {
    console.error('[Create Points Tables] ❌ 创建表失败:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

createPointsTables().catch(console.error)
