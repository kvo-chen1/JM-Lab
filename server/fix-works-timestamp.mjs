/**
 * 修复 works 表的 created_at 和 updated_at 字段类型
 * 从 BIGINT 改为 TIMESTAMP WITH TIME ZONE
 */

import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const { Pool } = pg

// 获取当前文件所在目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// 加载环境变量
dotenv.config({ path: path.join(projectRoot, '.env') })

// 尝试加载 .env.local（如果存在）
import fs from 'fs'
const envLocalPath = path.join(projectRoot, '.env.local')
if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath))
  for (const k in envConfig) {
    process.env[k] = envConfig[k]
  }
  console.log('[Fix Works Table] 已加载 .env.local 文件')
}

const connectionString = process.env.DATABASE_URL || 
                        process.env.POSTGRES_URL_NON_POOLING ||
                        process.env.POSTGRES_URL ||
                        process.env.NEON_DATABASE_URL

console.log('[Fix Works Table] 数据库连接:', connectionString?.replace(/:[^:@]+@/, ':***@'))

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : { 
    rejectUnauthorized: false 
  }
})

async function fixWorksTable() {
  const client = await pool.connect()
  
  try {
    console.log('[Fix Works Table] 开始修复 works 表...')
    
    // 检查当前字段类型
    const checkResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'works' 
      AND column_name IN ('created_at', 'updated_at')
    `)
    
    console.log('[Fix Works Table] 当前字段类型:', checkResult.rows)
    
    // 如果字段已经是 timestamp with time zone，则不需要修复
    const createdAtCol = checkResult.rows.find(r => r.column_name === 'created_at')
    if (createdAtCol && createdAtCol.data_type === 'timestamp with time zone') {
      console.log('[Fix Works Table] 字段类型已经是 timestamp with time zone，无需修复')
      return
    }
    
    // 开始事务
    await client.query('BEGIN')
    
    // 1. 添加临时字段
    console.log('[Fix Works Table] 添加临时字段...')
    await client.query(`
      ALTER TABLE works 
      ADD COLUMN IF NOT EXISTS created_at_new TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS updated_at_new TIMESTAMP WITH TIME ZONE
    `)
    
    // 2. 将 BIGINT 时间戳转换为 TIMESTAMP
    console.log('[Fix Works Table] 转换数据...')
    await client.query(`
      UPDATE works 
      SET 
        created_at_new = CASE 
          WHEN created_at IS NULL THEN NOW()
          WHEN created_at > 1000000000000000 THEN to_timestamp(created_at / 1000000)  -- 微秒
          WHEN created_at > 1000000000000 THEN to_timestamp(created_at / 1000)        -- 毫秒
          ELSE to_timestamp(created_at)                                               -- 秒
        END,
        updated_at_new = CASE 
          WHEN updated_at IS NULL THEN NOW()
          WHEN updated_at > 1000000000000000 THEN to_timestamp(updated_at / 1000000)
          WHEN updated_at > 1000000000000 THEN to_timestamp(updated_at / 1000)
          ELSE to_timestamp(updated_at)
        END
    `)
    
    // 3. 删除旧字段（如果有外键依赖，需要先处理）
    console.log('[Fix Works Table] 删除旧字段...')
    await client.query(`
      ALTER TABLE works 
      DROP COLUMN IF EXISTS created_at,
      DROP COLUMN IF EXISTS updated_at
    `)
    
    // 4. 重命名新字段
    console.log('[Fix Works Table] 重命名字段...')
    await client.query(`
      ALTER TABLE works 
      RENAME COLUMN created_at_new TO created_at
    `)
    await client.query(`
      ALTER TABLE works 
      RENAME COLUMN updated_at_new TO updated_at
    `)
    
    // 5. 设置默认值
    await client.query(`
      ALTER TABLE works 
      ALTER COLUMN created_at SET DEFAULT NOW(),
      ALTER COLUMN updated_at SET DEFAULT NOW()
    `)
    
    // 6. 重建索引
    console.log('[Fix Works Table] 重建索引...')
    await client.query(`DROP INDEX IF EXISTS idx_works_created_at`)
    await client.query(`CREATE INDEX idx_works_created_at ON works(created_at)`)
    
    // 提交事务
    await client.query('COMMIT')
    
    console.log('[Fix Works Table] 修复完成！')
    
    // 验证修复结果
    const verifyResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'works' 
      AND column_name IN ('created_at', 'updated_at')
    `)
    console.log('[Fix Works Table] 修复后的字段类型:', verifyResult.rows)
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('[Fix Works Table] 修复失败:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

fixWorksTable().catch(console.error)
