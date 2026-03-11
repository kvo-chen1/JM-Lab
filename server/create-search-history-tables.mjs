/**
 * 创建搜索历史相关的数据库表
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
  console.log('[Create Search Tables] 已加载 .env.local 文件')
}

const connectionString = process.env.DATABASE_URL || 
                        process.env.POSTGRES_URL_NON_POOLING ||
                        process.env.POSTGRES_URL ||
                        process.env.NEON_DATABASE_URL

console.log('[Create Search Tables] 数据库连接:', connectionString?.replace(/:[^:@]+@/, ':***@'))

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : { 
    rejectUnauthorized: false 
  }
})

async function createSearchHistoryTables() {
  const client = await pool.connect()
  
  try {
    console.log('[Create Search Tables] 开始创建搜索历史相关表...')

    // 1. 创建 user_search_history 表（用户搜索历史表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_search_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          query TEXT NOT NULL,
          search_type VARCHAR(50) DEFAULT 'general',
          result_count INTEGER DEFAULT 0,
          clicked_result_id UUID,
          clicked_result_type VARCHAR(50),
          search_filters JSONB,
          search_duration_ms INTEGER,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('[Create Search Tables] user_search_history 表已创建或已存在')

    // 2. 创建 hot_search 表（热门搜索表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS hot_search (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          query TEXT NOT NULL,
          search_count INTEGER DEFAULT 0,
          unique_searchers INTEGER DEFAULT 0,
          trend_score NUMERIC(10,2) DEFAULT 0,
          category VARCHAR(50),
          is_active BOOLEAN DEFAULT true,
          last_searched_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(query)
      )
    `)
    console.log('[Create Search Tables] hot_search 表已创建或已存在')

    // 3. 创建索引
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_search_history_user_id ON user_search_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_search_history_created_at ON user_search_history(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_user_search_history_query ON user_search_history(query);
      CREATE INDEX IF NOT EXISTS idx_user_search_history_search_type ON user_search_history(search_type);
      CREATE INDEX IF NOT EXISTS idx_hot_search_search_count ON hot_search(search_count DESC);
      CREATE INDEX IF NOT EXISTS idx_hot_search_is_active ON hot_search(is_active);
      CREATE INDEX IF NOT EXISTS idx_hot_search_category ON hot_search(category);
    `)
    console.log('[Create Search Tables] 索引已创建')

    console.log('[Create Search Tables] 所有搜索历史相关表创建完成！')
    
  } catch (error) {
    console.error('[Create Search Tables] 创建表失败:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

createSearchHistoryTables().catch(console.error)
